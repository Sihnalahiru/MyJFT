// --- GLOBAL APP STATE ---
let appDatabase = {
    particles: [],
    quizzes: []
};

let userXP = parseInt(localStorage.getItem('myjft_xp')) || 0;
let currentQuizIndex = 0;
let activeQuizQuestions = [];

// --- 1. INITIALIZE TOTAL DATABASE ---
async function initializeAppDatabase() {
    try {
        console.log("Loading total database from public/data/...");
        
        const [particlesRes, quizRes, scheduleRes] = await Promise.all([
            fetch('data/particles_master.json'),
            fetch('data/quiz_bank_master.json'),
            fetch('data/daily_schedule.json')
        ]);

        const particlesData = await particlesRes.json();
        const quizData = await quizRes.json();
        const scheduleData = await scheduleRes.json();

        appDatabase.particles = particlesData.particles || [];
        appDatabase.quizzes = quizData.questions || [];

        console.log("Total database loaded successfully!");
        
        renderDailySchedule(scheduleData);
        initQuizSession();
        updateXPUI();
    } catch (error) {
        console.error("Error loading total database:", error);
    }
}

// --- 2. RENDER DAILY SCHEDULE ---
function renderDailySchedule(data) {
    const container = document.getElementById('schedule-container');
    if (!container) return;
    
    container.innerHTML = `<h2>${data.routine_title} (Target: ${data.total_daily_goal_minutes} Mins)</h2>`;
    
    data.sessions.forEach(session => {
        let card = document.createElement('div');
        card.className = 'session-card';
        card.innerHTML = `
            <h3>${session.title}</h3>
            <p>⏱️ Duration: ${session.duration_minutes} Mins | 🎁 Reward: +${session.xp_reward} XP</p>
            <p>${session.description}</p>
            <button onclick="completeSession(${session.xp_reward}, this)">Complete Session</button>
        `;
        container.appendChild(card);
    });
}

function completeSession(xp, btn) {
    userXP += xp;
    localStorage.setItem('myjft_xp', userXP);
    updateXPUI();
    
    btn.disabled = true;
    btn.innerText = "Completed! ✅";
    btn.style.background = "#48bb78";
    playSuccessEffects();
}

// --- 3. DYNAMIC QUIZ GENERATOR (FROM TOTAL DATABASE) ---
function initQuizSession() {
    if (appDatabase.quizzes.length === 0) return;

    // Shuffle and pick random questions from the total database
    activeQuizQuestions = [...appDatabase.quizzes]
        .sort(() => 0.5 - Math.random());

    currentQuizIndex = 0;
    renderCurrentQuestion();
}

function renderCurrentQuestion() {
    const quizBox = document.getElementById('quiz-box');
    if (!quizBox) return;

    if (currentQuizIndex >= activeQuizQuestions.length) {
        quizBox.innerHTML = `
            <h2>🎉 Session Completed! Great Job!</h2>
            <button onclick="initQuizSession()">Restart Quiz</button>
        `;
        return;
    }

    let q = activeQuizQuestions[currentQuizIndex];

    quizBox.innerHTML = `
        <div class="exam-navigator">
            <span>Question ${currentQuizIndex + 1} of ${activeQuizQuestions.length}</span>
            <button onclick="playAudio('${q.audio_prompt}')">🔊 Listen Audio</button>
        </div>
        <div class="visual-hint">
            <img src="${q.image_hint}" alt="Context" style="width:100%; max-height:150px; object-fit:cover; border-radius:8px;">
        </div>
        <div id="drop-zone" class="drop-zone" ondragover="event.preventDefault()" ondrop="handleDrop(event)">
            <p style="color:#a0aec0; margin:0;">Drop Japanese chips here...</p>
        </div>
        <div class="chips-container">
            ${q.chips.map(chip => `<div class="word-chip" draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '${chip}')">${chip}</div>`).join('')}
        </div>
    `;
}

function handleDrop(event) {
    event.preventDefault();
    const val = event.dataTransfer.getData('text/plain');
    const dropZone = document.getElementById('drop-zone');

    if (dropZone.innerText.includes("Drop Japanese")) {
        dropZone.innerHTML = "";
    }

    let span = document.createElement('span');
    span.className = 'dropped-chip';
    span.innerText = val;
    dropZone.appendChild(span);

    validateAnswer();
}

function validateAnswer() {
    const dropZone = document.getElementById('drop-zone');
    const userBuilt = Array.from(dropZone.querySelectorAll('.dropped-chip')).map(el => el.innerText).join('');
    const q = activeQuizQuestions[currentQuizIndex];
    const expected = q.correct_order.join('');

    if (userBuilt === expected) {
        userXP += q.xp_reward || 10;
        localStorage.setItem('myjft_xp', userXP);
        updateXPUI();
        
        playSuccessEffects();
        
        currentQuizIndex++;
        setTimeout(renderCurrentQuestion, 1000);
    }
}

function updateXPUI() {
    const xpEl = document.getElementById('xp-display');
    if (xpEl) xpEl.innerText = `⭐ XP: ${userXP}`;
}

function playAudio(url) {
    if (!url) return;
    new Audio(url).play().catch(e => console.log("Audio play failed"));
}

function playSuccessEffects() {
    if (typeof confetti === 'function') {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    }
}

// Initialize on page load
window.onload = () => {
    initializeAppDatabase();
};