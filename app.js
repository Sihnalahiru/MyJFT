// --- GLOBAL APP STATE ---
let appDatabase = {
  particles: [],
  quizzes: [],
  kanji: [],
  schedule: []
};

let userXP = parseInt(localStorage.getItem('userXP') || '0');
let currentQuizIndex = 0;
let activeQuizQuestions = [];
let currentAudio = null;

// --- IRODORI OFFICIAL CDN / WEB URL RESOLVER ---
// Local files upload කිරීමක් අවශ්‍ය නොවන පරිදි Japan Foundation official servers වෙත direct map කිරීම
const IRODORI_CDN = {
  starter: "https://www.irodori.jpf.go.jp/assets/data/starter/audio/",
  elementary1: "https://www.irodori.jpf.go.jp/assets/data/elementary1/audio/",
  elementary2: "https://www.irodori.jpf.go.jp/assets/data/elementary2/audio/"
};

function resolveAudioUrl(filename) {
  if (!filename) return null;
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }
  // File name එකේ prefix එක අනුව නිල සර්වර් path එක තේරීම
  const cleanName = filename.replace(/^assets\/audio\//, "").replace(/^public\/audio\//, "");
  if (cleanName.startsWith("ST_") || cleanName.startsWith("L01_") || cleanName.startsWith("L02_")) {
    return `${IRODORI_CDN.starter}${cleanName}`;
  } else if (cleanName.startsWith("E1_")) {
    return `${IRODORI_CDN.elementary1}${cleanName}`;
  } else if (cleanName.startsWith("E2_")) {
    return `${IRODORI_CDN.elementary2}${cleanName}`;
  }
  // Default fallback to starter audio
  return `${IRODORI_CDN.starter}${cleanName}`;
}

function resolveImageUrl(url) {
  if (!url || url.trim() === "") {
    return "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=600&auto=format&fit=crop&q=80";
  }
  return url;
}

// --- AUDIO PLAYER (Popup Alert රහිතව online stream කිරීම) ---
function playAppAudio(audioTarget, buttonEl) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const directUrl = resolveAudioUrl(audioTarget);
  if (!directUrl) return;

  currentAudio = new Audio(directUrl);
  
  if (buttonEl) buttonEl.innerText = "⏸ Pause";

  currentAudio.play().catch(err => {
    console.warn("Direct Irodori audio stream fallback:", err);
    // Browser එකෙන්ම fallback ජපන් කටහඬ ලබාදීම
    if ('speechSynthesis' in window && activeQuizQuestions[currentQuizIndex]) {
      const text = activeQuizQuestions[currentQuizIndex].target_japanese || "";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.speak(utterance);
    }
  });

  currentAudio.onended = () => {
    if (buttonEl) buttonEl.innerText = "▶ Play";
    currentAudio = null;
  };
}

// --- 1. INITIALIZE TOTAL DATABASE ---
async function initializeAppDatabase() {
  try {
    console.log("Loading total database...");
    const [quizRes, kanjiRes, scheduleRes] = await Promise.all([
      fetch('data/quiz_bank_master.json').catch(() => null),
      fetch('data/kanji_master.json').catch(() => null),
      fetch('data/daily_schedule.json').catch(() => null)
    ]);

    if (quizRes && quizRes.ok) {
      const qData = await quizRes.json();
      appDatabase.quizzes = qData.questions || [];
      activeQuizQuestions = appDatabase.quizzes;
    }

    if (kanjiRes && kanjiRes.ok) {
      const kData = await kanjiRes.json();
      appDatabase.kanji = Array.isArray(kData) ? kData : (kData.kanji || []);
    }

    if (scheduleRes && scheduleRes.ok) {
      const sData = await scheduleRes.json();
      appDatabase.schedule = sData.sessions || [];
    }

    renderCurrentQuiz();
    setupKanjiDropdown();
    renderKanjiCards("Kanji 1 - 80"); // පළමු batch එක load කිරීම
  } catch (err) {
    console.error("Initialization error:", err);
  }
}

// --- 2. KANJI FILTER & READINGS FIX (Blank වීම හා On/Kun '-' ගැටලුව විසඳීම) ---
function setupKanjiDropdown() {
  const kanjiSelect = document.getElementById("kanjiBatchSelect");
  if (!kanjiSelect) return;

  kanjiSelect.addEventListener("change", (e) => {
    renderKanjiCards(e.target.value);
  });
}

function renderKanjiCards(batchValue) {
  const container = document.getElementById("kanjiCardContainer") || document.querySelector(".kanji-grid");
  if (!container) return;

  container.innerHTML = "";
  const list = appDatabase.kanji;
  if (!list || list.length === 0) {
    container.innerHTML = `<p style="text-align:center; padding:20px;">Kanji දත්ත සොයාගත නොහැක.</p>`;
    return;
  }

  // Dropdown text එක නිවැරදිව slice කිරීම (1 - 80, 81 - 160)
  let filtered = [];
  if (batchValue.includes("1 - 80") || batchValue === "1-80") {
    filtered = list.slice(0, 80);
  } else if (batchValue.includes("81 - 160") || batchValue === "81-160") {
    filtered = list.slice(80, 160);
  } else if (batchValue.includes("161 - 240") || batchValue === "161-240") {
    filtered = list.slice(160, 240);
  } else {
    filtered = list.slice(0, 80);
  }

  // Cards render කිරීම (On/Kun keys සියල්ල fallback සහිතව බැලීම)
  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "kanji-card";

    const onRead = item.on || item.onyomi || item.on_reading || "-";
    const kunRead = item.kun || item.kunyomi || item.kun_reading || "-";
    const meaning = item.meaning || item.meaning_si || item.english || "";

    card.innerHTML = `
      <div class="kanji-character" style="font-size: 2.5rem; font-weight: bold; color: #1e3a8a; text-align: center;">
        ${item.kanji || item.character}
      </div>
      <div class="kanji-readings" style="font-size: 0.85rem; color: #475569; text-align: center; margin-top: 6px;">
        On: ${onRead} | Kun: ${kunRead}
      </div>
      ${meaning ? `<div class="kanji-meaning" style="font-size: 0.8rem; color: #64748b; text-align: center; margin-top: 4px;">${meaning}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

// --- 3. QUIZ & IMAGE RENDERING ENGINE ---
function renderCurrentQuiz() {
  if (!activeQuizQuestions || activeQuizQuestions.length === 0) return;
  const q = activeQuizQuestions[currentQuizIndex];
  if (!q) return;

  const questionEl = document.getElementById("questionText");
  const hintImageEl = document.getElementById("hintImage");
  const audioBtn = document.getElementById("playAudioBtn");

  if (questionEl) {
    questionEl.innerText = q.question || q.target_japanese || "";
  }

  // Image load කිරීම සහ direct link broken නම් hide වීම
  if (hintImageEl) {
    const imgUrl = resolveImageUrl(q.image_hint);
    hintImageEl.src = imgUrl;
    hintImageEl.style.display = "block";
    hintImageEl.onerror = () => { hintImageEl.style.display = "none"; };
  }

  if (audioBtn) {
    audioBtn.onclick = () => playAppAudio(q.audio_prompt || q.audio, audioBtn);
  }
}

// App එක ආරම්භ කිරීම
document.addEventListener("DOMContentLoaded", initializeAppDatabase);
