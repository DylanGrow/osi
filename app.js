const OSI_NAMES = {
    1: "Physical", 2: "Data Link", 3: "Network", 4: "Transport",
    5: "Session", 6: "Presentation", 7: "Application"
};

let currentLayer = 1;
let seenQuestions = [];
let missedLayers = []; // Now an array to act as a queue
let isBonusRound = false;
const workerUrl = "https://dark-hall-6deb.dylangrow.workers.dev";

// --- AUDIO ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (type === 'correct') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    } else {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(110, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
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
    
    const layerName = isBonusRound ? `BONUS: ${OSI_NAMES[currentLayer]}` : `Layer ${currentLayer}: ${OSI_NAMES[currentLayer]}`;
    document.getElementById('layer-display').innerText = layerName;
    document.getElementById('layer-display').style.color = isBonusRound ? "var(--gold-neon)" : "var(--cyan-neon)";
    
    questionEl.innerText = isBonusRound ? "Generating high-entropy redemption challenge..." : "Establishing connection...";
    optionsDiv.innerHTML = "";
    updateProgressBar();

    try {
        const response = await fetch(workerUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                layer: currentLayer, 
                history: seenQuestions,
                isBonus: isBonusRound // Tell the worker to get creative
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
        questionEl.innerText = "Signal lost. Retrying...";
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
        feedback.innerHTML = `<strong>✗ ERROR:</strong> Correct was ${data.answer}. ${data.explanation}`;
        if (!isBonusRound) missedLayers.push(currentLayer);
    }

    setTimeout(() => {
        if (isBonusRound) {
            // In bonus mode, just clear the queue
            missedLayers.shift();
            if (missedLayers.length > 0) {
                currentLayer = missedLayers[0];
                loadQuestion();
            } else {
                showWinState();
            }
        } else {
            // Main mode: Always move forward
            currentLayer++;
            if (currentLayer > 7) {
                if (missedLayers.length > 0) {
                    startBonusRound();
                } else {
                    showWinState();
                }
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
    const originalContent = container.innerHTML;
    
    container.innerHTML = `
        <h1 style="color: var(--gold-neon)">REDEMPTION MODE</h1>
        <p>Main sequence complete. Re-evaluating ${missedLayers.length} failed sectors...</p>
        <button class="option-btn" id="start-bonus" style="text-align:center">INITIALIZE</button>
    `;
    
    document.getElementById('start-bonus').onclick = () => {
        container.innerHTML = originalContent; // Restore game UI
        loadQuestion();
    };
}

function updateProgressBar() {
    const fill = document.getElementById('progress-bar');
    const total = isBonusRound ? missedLayers.length : 7;
    fill.style.width = (currentLayer / 7) * 100 + "%";
}

function showWinState() {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <h1 style="color: #00e5ff">SYSTEM OPTIMIZED</h1>
        <p>All layers verified. Network+ proficiency confirmed.</p>
        <div class="post-action">
            <h3>Final Report</h3>
            <p>You have successfully navigated the OSI model.</p>
            <a href="https://www.youtube.com/results?search_query=Professor+Messer+Network+Plus+N10-009" target="_blank">▶ Continue Training</a>
        </div>
        <button class="option-btn" id="reboot-btn" style="width:100%; text-align:center">REBOOT</button>
    `;
    document.getElementById('reboot-btn').onclick = () => location.reload();
}

// --- STAR ANIMATION ---
(function() {
    const canvas = document.getElementById('star-canvas');
    const ctx = canvas.getContext('2d');
    let stars = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.onresize = resize;
    resize();
    for(let i=0; i<140; i++) stars.push({
        x: Math.random()*canvas.width, y: Math.random()*canvas.height,
        r: Math.random()*1.2+0.2, s: Math.random()*0.2+0.05, 
        a: Math.random(), td: Math.random()>0.5?1:-1
    });
    function draw() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        stars.forEach(s => {
            s.a += 0.005 * s.td; if(s.a>1 || s.a<0) s.td*=-1;
            s.y -= s.s; if(s.y<0) s.y=canvas.height;
            ctx.fillStyle = `rgba(0,229,255,${s.a})`;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
})();

loadQuestion();
