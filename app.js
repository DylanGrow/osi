const OSI_NAMES = {
    1: "Physical",
    2: "Data Link",
    3: "Network",
    4: "Transport",
    5: "Session",
    6: "Presentation",
    7: "Application"
};

let currentLayer = 1;
let seenQuestions = [];
let missedLayers = new Set();
const workerUrl = "https://dark-hall-6deb.dylangrow.workers.dev"; // Your Cloudflare URL

// --- WEB AUDIO API (Synthesized UI Sounds) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    // Browsers suspend audio until the first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'correct') {
        // Soft, ascending "success" chime (Sine wave)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(554.37, audioCtx.currentTime + 0.1); // C#5
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Very quiet
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3); // Quick fade
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'wrong') {
        // Dull, low "thud" (Triangle wave)
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.2); // Pitch drops quickly
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime); // Slightly louder than success, but still soft
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
    }
}

// --- CORE GAME LOGIC ---
async function loadQuestion() {
    const optionsDiv = document.getElementById('options');
    const questionEl = document.getElementById('question');
    const feedback = document.getElementById('feedback');
    
    feedback.className = '';
    feedback.innerHTML = '';
    
    document.getElementById('layer-display').innerText = `Layer ${currentLayer}: ${OSI_NAMES[currentLayer]}`;
    questionEl.innerText = "Establishing secure connection...";
    optionsDiv.innerHTML = "";
    updateProgressBar();

    try {
        const response = await fetch(workerUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layer: currentLayer, history: seenQuestions })
        });

        const data = await response.json();
        if (!data.question || !data.options) throw new Error("Malformed data");

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
        questionEl.innerText = "Signal lost. Retrying connection...";
        setTimeout(loadQuestion, 2000);
    }
}

function checkAnswer(selected, data, clickedBtn) {
    const feedback = document.getElementById('feedback');
    const buttons = document.querySelectorAll('.option-btn');
    
    buttons.forEach(btn => btn.disabled = true);

    let correctBtn = null;
    buttons.forEach(btn => {
        if(btn.innerText.startsWith(data.answer)) correctBtn = btn;
    });

    if (selected === data.answer) {
        playSound('correct'); // Trigger success sound
        clickedBtn.classList.add('correct-pulse');
        feedback.className = 'feedback-box success';
        feedback.innerHTML = `<strong>✓ ACCESS GRANTED:</strong> ${data.explanation}`;
        
        setTimeout(() => {
            currentLayer++;
            if (currentLayer > 7) showWinState();
            else loadQuestion();
        }, 3000);
    } else {
        playSound('wrong'); // Trigger fail sound
        clickedBtn.classList.add('error-shake');
        if (correctBtn) correctBtn.classList.add('correct-highlight');
        
        feedback.className = 'feedback-box error';
        feedback.innerHTML = `<strong>✗ ACCESS DENIED:</strong> Answer was ${data.answer}. ${data.explanation}`;
        missedLayers.add(currentLayer);
        
        setTimeout(() => {
            buttons.forEach(btn => btn.disabled = false);
            loadQuestion();
        }, 4500);
    }
}

function updateProgressBar() {
    const fill = document.getElementById('progress-bar');
    fill.style.width = (currentLayer / 7) * 100 + "%";
}

function showWinState() {
    const container = document.getElementById('game-container');
    let html = `
        <h1 style="color: #00e5ff">OSI MASTERED</h1>
        <p>System fully optimized. All 7 layers verified.</p>
    `;

    if (missedLayers.size > 0) {
        const missed = Array.from(missedLayers).sort();
        const studyLink = `https://www.youtube.com/results?search_query=Professor+Messer+CompTIA+Network%2B+OSI+Layer+${missed.join('+')}`;
        html += `
            <div class="post-action">
                <h3>Post-Action Report</h3>
                <p style="margin-bottom: 10px;">You took damage on Layer(s): <strong>${missed.join(', ')}</strong></p>
                <a href="${studyLink}" target="_blank">▶ Watch Network+ Video on Missed Layers</a>
            </div>
        `;
    } else {
        html += `<p style="color: #ffb612; font-weight: bold; margin: 20px 0; text-shadow: 0 0 8px rgba(255, 182, 18, 0.5);">Flawless victory! Zero mistakes.</p>`;
    }

    // CSP-Safe Reboot Button
    html += `<button class="option-btn" id="reboot-btn" style="margin-top: 1rem; text-align: center; width: 100%;">REBOOT SYSTEM</button>`;
    container.innerHTML = html;

    // Attach the event listener SECURELY after the button is added to the page
    document.getElementById('reboot-btn').addEventListener('click', () => {
        location.reload();
    });
}

// --- BACKGROUND ANIMATION ---
(function () {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const N = 140;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.6 + 0.15,
      speed: Math.random() * 0.2 + 0.04,
      twinkleSpeed: Math.random() * 0.007 + 0.002,
      twinkleDir: Math.random() > 0.5 ? 1 : -1,
      isGold: Math.random() > 0.85, 
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.alpha += s.twinkleSpeed * s.twinkleDir;
      if (s.alpha > 0.85 || s.alpha < 0.08) s.twinkleDir *= -1;
      s.y -= s.speed;
      if (s.y < -2) {
        s.y = canvas.height + 2;
        s.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.isGold
        ? `rgba(255, 182, 18, ${s.alpha})`
        : `rgba(0, 229, 255, ${s.alpha})`; 
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  initStars();
  draw();
  window.addEventListener('resize', () => { resize(); initStars(); });
})();

// Initial Boot
loadQuestion();
