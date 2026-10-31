// Irodori Japanese Learning App Client Controller - Fully Audited Version
document.addEventListener('DOMContentLoaded', () => {
  // Configuration
  const CONFIG = {
    DATA_BASE_PATH: 'public/data/',
    AUDIO_BASE_URL: 'https://raw.githubusercontent.com/Sihnalahiru/MyJFT/main/public/audio/',
    IMAGE_BASE_URL: 'public/data/images/'
  };

  // State
  let currentQuizList = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let currentAudio = null;

  // DOM Elements - Navigation Tabs
  const tabs = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

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

    // Exact folder naming audit matching zip files
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
      startQuizBtn.disabled = true;
      startQuizBtn.textContent = 'Loading... (පූරණය වෙමින් පවතී)';
      
      const res = await fetch(encodeURI(filePath));
      if (!res.ok) throw new Error(`Could not load ${filePath} (Status: ${res.status})`);
      const data = await res.json();
      
      // Fix 1: Handles both 'quizzes' and 'quiz_data' keys properly
      currentQuizList = data.quizzes || data.quiz_data || (Array.isArray(data) ? data : []);
      
      if (currentQuizList.length === 0) {
        alert('මෙම පාඩමට අදාළ ප්‍රශ්න හමු නොවීය.');
        startQuizBtn.disabled = false;
        startQuizBtn.textContent = 'Start Quiz (クイズ開始)';
        return;
      }

      currentQuestionIndex = 0;
      score = 0;
      quizContainer.classList.remove('hidden');
      renderQuestion();
    } catch (err) {
      console.error('Quiz loading error:', err);
      alert(`ප්‍රශ්නාවලිය පූරණය කිරීම අසාර්ථකයි! Path එක පරීක්ෂා කරන්න: ${filePath}`);
    } finally {
      startQuizBtn.disabled = false;
      startQuizBtn.textContent = 'Start Quiz (クイズ開始)';
    }
  });

  function renderQuestion() {
    if (currentQuestionIndex >= currentQuizList.length) {
      showQuizCompletion();
      return;
    }

    const q = currentQuizList[currentQuestionIndex];
    document.getElementById('quiz-progress').textContent = `Question ${currentQuestionIndex + 1}/${currentQuizList.length}`;
    document.getElementById('quiz-can-do').textContent = q.can_do_title_sinhala || q.can_do_id || 'Can-Do Practice';
    document.getElementById('quiz-score').textContent = `Score: ${score}`;

    // Fix 2: Handles both question_text and question schema variants
    let jpText = '';
    let siText = '';

    if (q.question_text && typeof q.question_text === 'object') {
      jpText = q.question_text.japanese || '';
      siText = q.question_text.sinhala || '';
    } else if (q.question && typeof q.question === 'object') {
      jpText = q.question.japanese || '';
      siText = q.question.sinhala || '';
    } else if (typeof q.question === 'string') {
      jpText = q.question;
    }

    document.getElementById('question-japanese').textContent = jpText;
    document.getElementById('question-sinhala').textContent = siText;

    // Reset feedback
    document.getElementById('feedback-container').classList.add('hidden');
    const audioBox = document.getElementById('audio-container');
    const imageBox = document.getElementById('image-container');

    // Fix 3: Robust Audio Handler without crashing
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
          audioEl.play().catch(e => {
            console.warn('Audio file missing or blocked:', e);
            alert(`ශ්‍රව්‍ය ගොනුව (${q.media.audio_track}) සොයාගත නොහැක. (public/audio/ තුළ තිබිය යුතුය)`);
          });
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

    // Fix 4: Robust Image Handler
    if (q.media && q.media.has_image && q.media.image_file) {
      imageBox.classList.remove('hidden');
      const imgEl = document.getElementById('quiz-image');
      imgEl.src = `${CONFIG.IMAGE_BASE_URL}${q.media.image_file}`;
      imgEl.onclick = () => openImageModal(imgEl.src);
    } else {
      imageBox.classList.add('hidden');
    }

    // Render Options
    const optionsGrid = document.getElementById('options-container');
    optionsGrid.innerHTML = '';
    const opts = q.options || [];

    opts.forEach(opt => {
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

    const correctAns = String(q.correct_answer || '').trim().toLowerCase();
    const isCorrect = (String(selectedId).trim().toLowerCase() === correctAns);
    
    if (isCorrect) score++;
    document.getElementById('quiz-score').textContent = `Score: ${score}`;

    optionButtons.forEach((btn, idx) => {
      const optId = q.options[idx] ? String(q.options[idx].id).trim().toLowerCase() : '';
      if (optId === correctAns) {
        btn.classList.add('correct');
      } else if (optId === String(selectedId).trim().toLowerCase()) {
        btn.classList.add('wrong');
      }
    });

    // Feedback Display
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
    fbExp.textContent = q.explanation_sinhala || q.explanation || 'විස්තරයක් ඇතුළත් කර නැත.';

    // Audio Transcript
    const transcriptBox = document.getElementById('audio-script-box');
    if (q.audio_script && (q.audio_script.japanese || q.audio_script.sinhala)) {
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
    const total = currentQuizList.length || 1;
    const percentage = Math.round((score / total) * 100);
    quizContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h2>🎉 Quiz Completed! (ප්‍රශ්නාවලිය අවසන්)</h2>
        <p style="font-size: 1.3rem; margin: 1rem 0;">Your Final Score: <strong>${score} / ${total}</strong> (${percentage}%)</p>
        <button class="btn btn-primary" onclick="location.reload()">Start Another Quiz (තවත් ප්‍රශ්නාවලියක් කරන්න)</button>
      </div>
    `;
  }

  // MODAL LOGIC
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  const closeModal = document.querySelector('.close-modal');

  function openImageModal(src) {
    if (modal && modalImg) {
      modal.classList.remove('hidden');
      modalImg.src = src;
    }
  }

  if (closeModal) closeModal.onclick = () => modal.classList.add('hidden');
  if (modal) modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };

  // VOCABULARY VIEWER
  const vocabBook = document.getElementById('vocab-book-select');
  const vocabPart = document.getElementById('vocab-part-select');
  const vocabSearch = document.getElementById('vocab-search');
  const vocabGrid = document.getElementById('vocab-grid');
  let currentVocabList = [];

  function updateVocabParts() {
    if (!vocabPart || !vocabBook) return;
    vocabPart.innerHTML = '';
    const book = vocabBook.value;
    const partsCount = (book === 'Book1') ? 6 : 11;
    for (let i = 1; i <= partsCount; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Part ${i}`;
      vocabPart.appendChild(opt);
    }
  }

  if (vocabBook) {
    vocabBook.addEventListener('change', () => {
      updateVocabParts();
      loadVocabulary();
    });
  }
  if (vocabPart) vocabPart.addEventListener('change', loadVocabulary);
  if (vocabSearch) vocabSearch.addEventListener('input', filterVocab);

  async function loadVocabulary() {
    if (!vocabGrid) return;
    if (vocabPart && vocabPart.children.length === 0) updateVocabParts();
    const book = vocabBook ? vocabBook.value : 'Book1';
    const part = vocabPart ? vocabPart.value || 1 : 1;
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
      vocabGrid.innerHTML = '<p style="padding: 1rem;">Loading vocabulary...</p>';
      const res = await fetch(encodeURI(`${CONFIG.DATA_BASE_PATH}${fileName}`));
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      currentVocabList = data.vocabulary || (Array.isArray(data) ? data : []);
      renderVocab(currentVocabList);
    } catch (err) {
      console.error(err);
      vocabGrid.innerHTML = `<p style="color: red; padding: 1rem;">Could not load vocabulary file: ${fileName}</p>`;
    }
  }

  function renderVocab(list) {
    if (!vocabGrid) return;
    vocabGrid.innerHTML = '';
    if (!list || list.length === 0) {
      vocabGrid.innerHTML = '<p style="padding: 1rem;">No words found.</p>';
      return;
    }
    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';
      const jpWord = item.japanese || item.kanji || item.word || '';
      const reading = item.furigana || item.kana || '';
      card.innerHTML = `
        <h3 style="color: var(--secondary-color);">${jpWord} <small style="color: var(--text-muted); font-size: 0.85rem;">(${reading})</small></h3>
        <p><strong>Romaji:</strong> ${item.romaji || '-'}</p>
        <p><strong>English:</strong> ${item.english || '-'}</p>
        <p style="color: var(--primary-color);"><strong>සිංහල:</strong> ${item.sinhala || '-'}</p>
      `;
      vocabGrid.appendChild(card);
    });
  }

  function filterVocab() {
    const q = (vocabSearch ? vocabSearch.value : '').toLowerCase().trim();
    if (!q) {
      renderVocab(currentVocabList);
      return;
    }
    const filtered = currentVocabList.filter(v => 
      (v.japanese && v.japanese.toLowerCase().includes(q)) ||
      (v.furigana && v.furigana.toLowerCase().includes(q)) ||
      (v.english && v.english.toLowerCase().includes(q)) ||
      (v.sinhala && v.sinhala.toLowerCase().includes(q)) ||
      (v.romaji && v.romaji.toLowerCase().includes(q))
    );
    renderVocab(filtered);
  }

  // GRAMMAR VIEWER
  const grammarSelect = document.getElementById('grammar-file-select');
  const grammarGrid = document.getElementById('grammar-grid');
  if (grammarSelect) grammarSelect.addEventListener('change', loadGrammar);

  async function loadGrammar() {
    if (!grammarGrid || !grammarSelect) return;
    const file = grammarSelect.value;
    try {
      grammarGrid.innerHTML = '<p style="padding: 1rem;">Loading grammar patterns...</p>';
      const res = await fetch(encodeURI(`${CONFIG.DATA_BASE_PATH}Grammar/${file}`));
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const patterns = data.grammar_patterns || (Array.isArray(data) ? data : []);
      grammarGrid.innerHTML = '';
      
      patterns.forEach(g => {
        const card = document.createElement('div');
        card.className = 'item-card';
        const siMeaning = g.meaning_sinhala || g.title_sinhala || '';
        const enMeaning = g.meaning_english || g.explanation_english || '';
        card.innerHTML = `
          <h3 style="color: var(--primary-color);">${g.pattern || g.title || ''}</h3>
          <p style="font-weight: 500; margin: 0.4rem 0;">${siMeaning}</p>
          <p style="font-size: 0.9rem; color: var(--text-muted);">${enMeaning}</p>
        `;
        grammarGrid.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      grammarGrid.innerHTML = `<p style="color: red; padding: 1rem;">Could not load grammar file: ${file}</p>`;
    }
  }

  // KANJI VIEWER
  const kanjiSelect = document.getElementById('kanji-bulk-select');
  const kanjiGrid = document.getElementById('kanji-grid');
  if (kanjiSelect) kanjiSelect.addEventListener('change', loadKanji);

  async function loadKanji() {
    if (!kanjiGrid || !kanjiSelect) return;
    const file = kanjiSelect.value;
    try {
      kanjiGrid.innerHTML = '<p style="padding: 1rem;">Loading Kanji characters...</p>';
      const res = await fetch(encodeURI(`${CONFIG.DATA_BASE_PATH}Kanji/${file}`));
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const kanjiList = data.kanji_list || (Array.isArray(data) ? data : []);
      kanjiGrid.innerHTML = '';
      
      kanjiList.forEach(k => {
        const card = document.createElement('div');
        card.className = 'item-card kanji-card';
        const kanjiChar = k.kanji || k.character || '';
        const enMeaning = k.meaning_english || k.meaning || '';
        const siMeaning = k.meaning_sinhala || '';
        card.innerHTML = `
          <div class="kanji-character">${kanjiChar}</div>
          <p style="font-weight: 600;">${enMeaning}</p>
          <small style="color: var(--text-muted);">${siMeaning}</small>
          <p style="font-size: 0.8rem; margin-top: 0.3rem;">On: ${k.onyomi || '-'} | Kun: ${k.kunyomi || '-'}</p>
        `;
        kanjiGrid.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      kanjiGrid.innerHTML = `<p style="color: red; padding: 1rem;">Could not load kanji file: ${file}</p>`;
    }
  }
});
