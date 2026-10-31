// Irodori Japanese Learning App Client Controller
document.addEventListener('DOMContentLoaded', () => {
  // Configuration
  const CONFIG = {
    DATA_BASE_PATH: 'data/',
    AUDIO_BASE_URL: 'https://raw.githubusercontent.com/your-username/MyJFT/main/public/audio/', // fallback or local
    IMAGE_BASE_URL: 'data/images/' // local or CDN
  };

  // State
  let currentQuizList = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let currentAudio = null;

  // DOM Elements
  const tabs = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(`${tab.dataset.tab}-tab`);
      if (target) target.classList.add('active');

      if (tab.dataset.tab === 'vocabulary') loadVocabulary();
      if (tab.dataset.tab === 'grammar') loadGrammar();
      if (tab.dataset.tab === 'kanji') loadKanji();
    });
  });

  // QUIZ LOGIC
  const bookSelect = document.getElementById('book-select');
  const lessonSelect = document.getElementById('lesson-select');
  const startQuizBtn = document.getElementById('load-quiz-btn');
  const quizContainer = document.getElementById('quiz-container');
  const nextQuestionBtn = document.getElementById('next-question-btn');

  startQuizBtn.addEventListener('click', async () => {
    const book = bookSelect.value;
    const lessonFile = lessonSelect.value;
    let folder = '';
    let prefix = '';

    if (book === 'book1') {
      folder = 'Quiz/Book 1 - Starter/';
      prefix = 'irodori_starter_quiz_';
    } else if (book === 'book2') {
      folder = 'Quiz/Book 2 - Elemantary/';
      prefix = 'irodori_elem1_quiz_';
    } else if (book === 'book3') {
      folder = 'Quiz/Book 3 - Elemantary 2/';
      prefix = 'irodori_elementary2_quiz_';
    }

    const filePath = `${CONFIG.DATA_BASE_PATH}${folder}${prefix}${lessonFile}`;
    try {
      const res = await fetch(filePath);
      if (!res.ok) throw new Error(`Could not load ${filePath}`);
      const data = await res.json();
      currentQuizList = data.quizzes || [];
      if (currentQuizList.length === 0) {
        alert('No questions found in this set.');
        return;
      }
      currentQuestionIndex = 0;
      score = 0;
      quizContainer.classList.remove('hidden');
      renderQuestion();
    } catch (err) {
      console.error(err);
      alert('Failed to load quiz file. Check your console/network path.');
    }
  });

  function renderQuestion() {
    if (currentQuestionIndex >= currentQuizList.length) {
      showQuizCompletion();
      return;
    }

    const q = currentQuizList[currentQuestionIndex];
    document.getElementById('quiz-progress').textContent = `Question ${currentQuestionIndex + 1}/${currentQuizList.length}`;
    document.getElementById('quiz-can-do').textContent = q.can_do_title_sinhala || 'Can-Do';
    document.getElementById('quiz-score').textContent = `Score: ${score}`;

    // Question Text
    document.getElementById('question-japanese').textContent = q.question_text.japanese;
    document.getElementById('question-sinhala').textContent = q.question_text.sinhala;

    // Reset feedback and media
    document.getElementById('feedback-container').classList.add('hidden');
    const audioBox = document.getElementById('audio-container');
    const imageBox = document.getElementById('image-container');

    // Audio setup
    if (q.media && q.media.has_audio && q.media.audio_track) {
      audioBox.classList.remove('hidden');
      const audioEl = document.getElementById('quiz-audio');
      audioEl.src = q.media.audio_track.startsWith('http') 
        ? q.media.audio_track 
        : `${CONFIG.AUDIO_BASE_URL}${q.media.audio_track}`;
      document.getElementById('audio-track-name').textContent = q.media.audio_track;
      const playBtn = document.getElementById('audio-play-btn');
      playBtn.textContent = '▶ Play Audio';
      playBtn.onclick = () => {
        if (audioEl.paused) {
          audioEl.play();
          playBtn.textContent = '⏸ Pause';
        } else {
          audioEl.pause();
          playBtn.textContent = '▶ Play';
        }
      };
      audioEl.onended = () => { playBtn.textContent = '▶ Play Audio'; };
    } else {
      audioBox.classList.add('hidden');
    }

    // Image setup
    if (q.media && q.media.has_image && q.media.image_file) {
      imageBox.classList.remove('hidden');
      const imgEl = document.getElementById('quiz-image');
      imgEl.src = `${CONFIG.IMAGE_BASE_URL}${q.media.image_file}`;
      imgEl.onclick = () => openImageModal(imgEl.src);
    } else {
      imageBox.classList.add('hidden');
    }

    // Options setup
    const optionsGrid = document.getElementById('options-container');
    optionsGrid.innerHTML = '';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `<strong>${opt.id}.</strong> ${opt.text}`;
      btn.onclick = () => handleAnswerSelect(opt.id, q);
      optionsGrid.appendChild(btn);
    });
  }

  function handleAnswerSelect(selectedId, q) {
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.disabled = true);

    const isCorrect = (String(selectedId).toLowerCase() === String(q.correct_answer).toLowerCase());
    if (isCorrect) score++;
    document.getElementById('quiz-score').textContent = `Score: ${score}`;

    optionButtons.forEach((btn, idx) => {
      const optId = q.options[idx].id;
      if (String(optId).toLowerCase() === String(q.correct_answer).toLowerCase()) {
        btn.classList.add('correct');
      } else if (String(optId).toLowerCase() === String(selectedId).toLowerCase()) {
        btn.classList.add('wrong');
      }
    });

    // Feedback
    const fbBox = document.getElementById('feedback-container');
    const fbTitle = document.getElementById('feedback-title');
    const fbExp = document.getElementById('feedback-explanation');
    fbBox.classList.remove('hidden');

    if (isCorrect) {
      fbTitle.textContent = '✓ 正解 (නිවැරදියි!)';
      fbTitle.style.color = '#15803d';
    } else {
      fbTitle.textContent = '✗ 不正解 (වැරදියි!)';
      fbTitle.style.color = '#b91c1c';
    }
    fbExp.textContent = q.explanation_sinhala || '';

    // Audio Transcript
    const transcriptBox = document.getElementById('audio-script-box');
    if (q.audio_script) {
      transcriptBox.classList.remove('hidden');
      document.getElementById('transcript-japanese').textContent = q.audio_script.japanese || '';
      document.getElementById('transcript-sinhala').textContent = q.audio_script.sinhala || '';
    } else {
      transcriptBox.classList.add('hidden');
    }
  }

  nextQuestionBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    renderQuestion();
  });

  function showQuizCompletion() {
    const percentage = Math.round((score / currentQuizList.length) * 100);
    quizContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h2>🎉 Quiz Completed! (ප්‍රශ්නාවලිය අවසන්)</h2>
        <p style="font-size: 1.3rem; margin: 1rem 0;">Your Final Score: <strong>${score} / ${currentQuizList.length}</strong> (${percentage}%)</p>
        <button class="btn btn-primary" onclick="location.reload()">Start Another Quiz</button>
      </div>
    `;
  }

  // MODAL LOGIC
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  const closeModal = document.querySelector('.close-modal');

  function openImageModal(src) {
    modal.classList.remove('hidden');
    modalImg.src = src;
  }

  closeModal.onclick = () => modal.classList.add('hidden');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };

  // VOCABULARY VIEWER
  const vocabBook = document.getElementById('vocab-book-select');
  const vocabPart = document.getElementById('vocab-part-select');
  const vocabSearch = document.getElementById('vocab-search');
  const vocabGrid = document.getElementById('vocab-grid');
  let currentVocabList = [];

  function updateVocabParts() {
    vocabPart.innerHTML = '';
    const book = vocabBook.value;
    let partsCount = (book === 'Book1') ? 6 : 11;
    for (let i = 1; i <= partsCount; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Part ${i}`;
      vocabPart.appendChild(opt);
    }
  }

  vocabBook.addEventListener('change', () => {
    updateVocabParts();
    loadVocabulary();
  });
  vocabPart.addEventListener('change', loadVocabulary);
  vocabSearch.addEventListener('input', filterVocab);

  async function loadVocabulary() {
    if (vocabPart.children.length === 0) updateVocabParts();
    const book = vocabBook.value;
    const part = vocabPart.value || 1;
    let fileName = '';

    if (book === 'Book1') {
      fileName = `Word/Book1/irodori_starter_part_${part}_100words.json`;
    } else if (book === 'Book2') {
      fileName = (part == 11) 
        ? `Word/Book2/irodori_elementary1_part11_150words.json`
        : `Word/Book2/irodori_elementary1_part${part}_100words_v2.json`;
    } else {
      fileName = (part == 11)
        ? `Word/Book 3/irodori_elementary2_part11_150words.json`
        : `Word/Book 3/irodori_elementary2_part${part}_100words.json`;
    }

    try {
      const res = await fetch(`${CONFIG.DATA_BASE_PATH}${fileName}`);
      const data = await res.json();
      currentVocabList = data.vocabulary || (Array.isArray(data) ? data : []);
      renderVocab(currentVocabList);
    } catch (err) {
      vocabGrid.innerHTML = `<p style="color: red;">Could not load vocabulary file: ${fileName}</p>`;
    }
  }

  function renderVocab(list) {
    vocabGrid.innerHTML = '';
    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <h3 style="color: var(--secondary-color);">${item.japanese || item.kanji || ''} <small style="color: var(--text-muted); font-size: 0.8rem;">(${item.furigana || item.kana || ''})</small></h3>
        <p><strong>Romaji:</strong> ${item.romaji || ''}</p>
        <p><strong>English:</strong> ${item.english || ''}</p>
        <p style="color: var(--primary-color);"><strong>සිංහල:</strong> ${item.sinhala || ''}</p>
      `;
      vocabGrid.appendChild(card);
    });
  }

  function filterVocab() {
    const q = vocabSearch.value.toLowerCase().trim();
    if (!q) {
      renderVocab(currentVocabList);
      return;
    }
    const filtered = currentVocabList.filter(v => 
      (v.japanese && v.japanese.toLowerCase().includes(q)) ||
      (v.furigana && v.furigana.toLowerCase().includes(q)) ||
      (v.english && v.english.toLowerCase().includes(q)) ||
      (v.sinhala && v.sinhala.toLowerCase().includes(q))
    );
    renderVocab(filtered);
  }

  // GRAMMAR VIEWER
  const grammarSelect = document.getElementById('grammar-file-select');
  const grammarGrid = document.getElementById('grammar-grid');
  grammarSelect.addEventListener('change', loadGrammar);

  async function loadGrammar() {
    const file = grammarSelect.value;
    try {
      const res = await fetch(`${CONFIG.DATA_BASE_PATH}Grammar/${file}`);
      const data = await res.json();
      const patterns = data.grammar_patterns || (Array.isArray(data) ? data : []);
      grammarGrid.innerHTML = '';
      patterns.forEach(g => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
          <h3 style="color: var(--primary-color);">${g.pattern || g.title || ''}</h3>
          <p style="font-weight: 500; margin: 0.4rem 0;">${g.meaning_sinhala || g.title_sinhala || ''}</p>
          <p style="font-size: 0.9rem; color: var(--text-muted);">${g.meaning_english || ''}</p>
        `;
        grammarGrid.appendChild(card);
      });
    } catch (err) {
      grammarGrid.innerHTML = `<p style="color: red;">Could not load grammar file: ${file}</p>`;
    }
  }

  // KANJI VIEWER
  const kanjiSelect = document.getElementById('kanji-bulk-select');
  const kanjiGrid = document.getElementById('kanji-grid');
  kanjiSelect.addEventListener('change', loadKanji);

  async function loadKanji() {
    const file = kanjiSelect.value;
    try {
      const res = await fetch(`${CONFIG.DATA_BASE_PATH}Kanji/${file}`);
      const data = await res.json();
      const kanjiList = data.kanji_list || (Array.isArray(data) ? data : []);
      kanjiGrid.innerHTML = '';
      kanjiList.forEach(k => {
        const card = document.createElement('div');
        card.className = 'item-card kanji-card';
        card.innerHTML = `
          <div class="kanji-character">${k.kanji || k.character || ''}</div>
          <p style="font-weight: 600;">${k.meaning_english || k.meaning || ''}</p>
          <small style="color: var(--text-muted);">${k.meaning_sinhala || ''}</small>
          <p style="font-size: 0.8rem; margin-top: 0.3rem;">On: ${k.onyomi || '-'} | Kun: ${k.kunyomi || '-'}</p>
        `;
        kanjiGrid.appendChild(card);
      });
    } catch (err) {
      kanjiGrid.innerHTML = `<p style="color: red;">Could not load kanji file: ${file}</p>`;
    }
  }
});
