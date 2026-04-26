let currentLayer = 1;
let seenQuestions = [];
let missedLayers = new Set();
const workerUrl = "https://dark-hall-6deb.dylangrow.workers.dev";

async function loadQuestion() {
    const optionsDiv = document.getElementById('options');
    const questionEl = document.getElementById('question');
    const feedback = document.getElementById('feedback');
    
    questionEl.innerText = "Connecting to Layer " + currentLayer + "...";
    optionsDiv.innerHTML = "";
    feedback.innerText = "";
    document.getElementById('layer-display').innerText = `Layer: ${currentLayer}`;
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
            btn.onclick = () => checkAnswer(key, data);
            optionsDiv.appendChild(btn);
        });
    } catch (err) {
        questionEl.innerText = "Signal lost. Retrying...";
        setTimeout(loadQuestion, 2000);
    }
}

function checkAnswer(selected, data) {
    const feedback = document.getElementById('feedback');
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);

    if (selected === data.answer) {
        feedback.style.color = "#00e5ff";
        feedback.innerText = "✓ CORRECT: " + data.explanation;
        setTimeout(() => {
            currentLayer++;
            if (currentLayer > 7) showWinState();
            else loadQuestion();
        }, 3000);
    } else {
        feedback.style.color = "#ff1744";
        feedback.innerText = `✗ INCORRECT. Answer was ${data.answer}. ${data.explanation}`;
        missedLayers.add(currentLayer);
        setTimeout(() => {
            buttons.forEach(btn => btn.disabled = false);
            loadQuestion();
        }, 4000);
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

    html += `<button class="option-btn" onclick="location.reload()" style="margin-top: 1rem; text-align: center; width: 100%;">REBOOT SYSTEM</button>`;
    container.innerHTML = html;
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
