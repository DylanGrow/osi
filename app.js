const OSI_NAMES = {
    1: "Physical", 2: "Data Link", 3: "Network", 4: "Transport",
    5: "Session", 6: "Presentation", 7: "Application"
};

let currentLayer = 1;
let seenQuestions = [];
let missedLayers = []; 
let isBonusRound = false;
const workerUrl = "https://dark-hall-6deb.dylangrow.workers.dev";

// --- AUDIO ENGINE (Synthesized UI Sounds) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    
    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, audioCtx.currentTime); // A2 (Dull thud)
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    }
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}

// --- GAME CORE ---
async function loadQuestion() {
    const optionsDiv = document.getElementById('options');
    const questionEl = document.getElementById('question');
    const feedback = document.getElementById('feedback');
    
    feedback.className = '';
    feedback.innerHTML = '';
    
    const layerName = isBonusRound ? `REDEMPTION: ${OSI_NAMES[currentLayer]}` : `Layer ${currentLayer}: ${OSI_NAMES[currentLayer]}`;
    document.getElementById('layer-display').innerText = layerName;
    document.getElementById('layer-display').style.color = isBonusRound ? "var(--gold-neon)" : "var(--cyan-neon)";
    
    questionEl.innerText = "Synchronizing Layer Data...";
    optionsDiv.innerHTML = "";
    updateProgressBar();

    try {
        const response = await fetch(workerUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                layer: currentLayer, 
                history: seenQuestions,
                isBonus: isBonusRound 
            })
        });

        const data = await response.json();
        seenQuestions.push(data.question.substring(0, 30));
        questionEl.innerText = data.question;

        Object.entries(data.options).forEach(([key, value]) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = `${key}: ${value}`;
            btn.onclick = (e) => checkAnswer(key, data, e.target);
            optionsDiv.appendChild(btn);
        });
    } catch (err) {
        questionEl.innerText = "Connection Timed Out. Retrying...";
        setTimeout(loadQuestion, 2000);
    }
}

function checkAnswer(selected, data, clickedBtn) {
    const feedback = document.getElementById('feedback');
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);

    if (selected === data.answer) {
        playSound('correct');
        clickedBtn.classList.add('correct-pulse');
        feedback.className = 'feedback-box success';
        feedback.innerHTML = `<strong>✓ ACCESS GRANTED:</strong> ${data.explanation}`;
    } else {
        playSound('wrong');
        clickedBtn.classList.add('error-shake');
        feedback.className = 'feedback-box error';
        feedback.innerHTML = `<strong>✗ AUTH ERROR:</strong> Correct was ${data.answer}. ${data.explanation}`;
        if (!isBonusRound) missedLayers.push(currentLayer);
    }

    setTimeout(() => {
        if (isBonusRound) {
            missedLayers.shift(); // Remove the layer we just attempted
            if (missedLayers.length > 0) {
                currentLayer = missedLayers[0];
                loadQuestion();
            } else {
                showWinState();
            }
        } else {
            currentLayer++;
            if (currentLayer > 7) {
                if (missedLayers.length > 0) startBonusRound();
                else showWinState();
            } else {
                loadQuestion();
            }
        }
    }, 3500);
}

function startBonusRound() {
    isBonusRound = true;
    currentLayer = missedLayers[0];
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <h1 style="color: var(--gold-neon)">REDEMPTION REQUIRED</h1>
        <p>Main sequence offline. ${missedLayers.length} sectors require manual verification.</p>
        <button class="option-btn" id="start-bonus" style="text-align:center; width: 100%;">INITIALIZE REDEMPTION</button>
    `;
    document.getElementById('start-bonus').onclick = () => {
        location.reload(); // Simple way to reset UI state for bonus, or re-render
        // For a smoother flow without reload, we'd re-trigger the original HTML structure
    };
    // Note: For a true "Senior" feel, we'll just re-render the question UI
    document.getElementById('start-bonus').onclick = () => {
        container.innerHTML = `
            <header class="quiz-header"><h1>OSI Model Quiz</h1></header>
            <div class="progress-row">
                <h2 id="layer-display"></h2>
                <div class="progress-bar-wrap"><div class="progress-bar-fill" id="progress-bar"></div></div>
            </div>
            <section id="question-container"><p id="question"></p><div id="options"></div></section>
            <div id="feedback"></div>
        `;
        loadQuestion();
    };
}

function updateProgressBar() {
    const fill = document.getElementById('progress-bar');
    fill.style.width = (currentLayer / 7) * 100 + "%";
}

function showWinState() {
    const container = document.getElementById('game-container');
    const missed = Array.from(new Set(missedLayers)).sort(); // Unique missed layers
    
    let html = `
        <h1 style="color: #00e5ff">SYSTEM OPTIMIZED</h1>
        <p style="margin-bottom: 1.5rem;">Network+ proficiency confirmed across all layers.</p>
        <div class="post-action" style="background: rgba(0, 229, 255, 0.05); border-left: 4px solid var(--cyan-neon); padding: 15px; margin: 15px 0; text-align: left; border-radius: 4px;">
            <h3 style="color: var(--cyan-neon); margin: 0 0 10px 0;">V9 Training Toolkit</h3>
            <ul style="list-style: none; padding: 0; text-align: left; margin: 0;">
                <li style="margin-bottom: 12px;">
                    <a href="https://www.youtube.com/results?search_query=Professor+Messer+Network+Plus+N10-009+OSI+Layer+${missed.join('+')}" target="_blank" style="color: var(--cyan-neon); text-decoration: none; font-weight: bold; display: block;">▶ Messer V9 Video Course</a>
                    <small style="opacity: 0.8; display: block; color: white;">Targeted deep dives for N10-009.</small>
                </li>
                <li style="margin-bottom: 12px;">
                    <a href="https://www.udemy.com/courses/search/?q=Andrew+Ramdayal+Network%2B" target="_blank" style="color: var(--cyan-neon); text-decoration: none; font-weight: bold; display: block;">▶ Andrew Ramdayal Mindset</a>
                    <small style="opacity: 0.8; display: block; color: white;">Master the "Next Best Step" logic.</small>
                </li>
                <li>
                    <a href="https://crucialexams.com/exams/comptia/network/n10-009" target="_blank" style="color: var(--cyan-neon); text-decoration: none; font-weight: bold; display: block;">▶ Crucial Exams V9 Practice</a>
                    <small style="opacity: 0.8; display: block; color: white;">Realistic exam simulation environment.</small>
                </li>
            </ul>
        </div>
    `;

    if (missedLayers.length > 0) {
        html += `<p style="font-size: 0.9rem; margin: 15px 0;">Anomalies detected in: <strong>Layers ${missed.join(', ')}</strong></p>`;
    } else {
        html += `<p style="color: #ffb612; font-weight: bold; margin: 15px 0;">FLAWLESS: All protocols fully operational.</p>`;
    }

    html += `<button class="option-btn" id="reboot-btn" style="width:100%; text-align:center; margin-top: 10px;">REBOOT SYSTEM</button>`;
    container.innerHTML = html;
    document.getElementById('reboot-btn').onclick = () => location.reload();
}

// --- STAR BACKGROUND ---
(function () {
  const canvas = document.getElementById('star-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  window.onresize = resize; resize();
  for(let i=0; i<140; i++) stars.push({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height,
    r: Math.random()*1.2+0.2, s: Math.random()*0.15+0.05, a: Math.random(), d: Math.random()>0.5?1:-1
  });
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    stars.forEach(s => {
      s.a += 0.005 * s.d; if(s.a>1 || s.a<0) s.d*=-1;
      s.y -= s.s; if(s.y<0) s.y=canvas.height;
      ctx.fillStyle = `rgba(0,229,255,${s.a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

loadQuestion();
