let currentLayer = 1;
let seenQuestions = [];

// ── Progress bar helper ───────────────────────────────────
function updateProgress() {
  const pct = ((currentLayer - 1) / 7) * 100;
  const bar = document.getElementById('progress-bar');
  const wrap = document.getElementById('progress-bar-wrap');
  if (bar)  bar.style.width = pct + '%';
  if (wrap) wrap.setAttribute('aria-valuenow', currentLayer);
}

// ── Load a question from the Cloudflare Worker ────────────
async function loadQuestion() {
  const questionEl = document.getElementById('question');
  const optionsEl  = document.getElementById('options');
  const feedbackEl = document.getElementById('feedback');
  const layerEl    = document.getElementById('layer-display');

  // Reset UI
  questionEl.textContent = 'Generating next question…';
  optionsEl.innerHTML    = '';
  feedbackEl.textContent = '';
  feedbackEl.className   = '';
  layerEl.textContent    = `Layer: ${currentLayer}`;
  updateProgress();

  try {
    const response = await fetch('https://dark-hall-6deb.dylangrow.workers.dev', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt:  `Generate a question for OSI Layer ${currentLayer}`,
        layer:   currentLayer,
        history: seenQuestions,
      }),
    });

    if (!response.ok) throw new Error(`Worker responded ${response.status}`);

    const data = await response.json();
    seenQuestions.push(data.question);
    questionEl.textContent = data.question;

    // Build option buttons
    for (const [key, value] of Object.entries(data.options)) {
      const btn = document.createElement('button');
      btn.className   = 'option-btn';
      btn.textContent = `${key}: ${value}`;
      btn.setAttribute('aria-label', `Option ${key}: ${value}`);
      btn.type = 'button';
      btn.addEventListener('click', () => checkAnswer(key, data.answer, data.explanation));
      optionsEl.appendChild(btn);
    }
  } catch (error) {
    questionEl.textContent = 'Error loading question. Please check your connection.';
    console.error('[OSI Quiz] loadQuestion error:', error);
  }
}

// ── Check selected answer ─────────────────────────────────
function checkAnswer(selected, correct, explanation) {
  const feedbackEl = document.getElementById('feedback');
  const optionsEl  = document.getElementById('options');
  const buttons    = optionsEl.querySelectorAll('.option-btn');

  if (selected === correct) {
    // Lock buttons only on correct — next question is loading anyway
    buttons.forEach(btn => {
      btn.disabled = true;
      const key = btn.textContent.trim().charAt(0);
      if (key === correct) btn.classList.add('correct');
    });

    feedbackEl.className   = 'correct';
    feedbackEl.textContent = '✓ Correct! Moving up…';

    setTimeout(() => {
      currentLayer++;
      if (currentLayer > 7) {
        alert('🎉 You mastered all 7 layers! Resetting to Layer 1.');
        currentLayer  = 1;
        seenQuestions = [];
      }
      loadQuestion();
    }, 1500);

  } else {
    // Wrong — highlight wrong button, show correct, but keep others clickable
    buttons.forEach(btn => {
      const key = btn.textContent.trim().charAt(0);
      if (key === selected) btn.classList.add('wrong');
      if (key === correct)  btn.classList.add('correct');
    });

    feedbackEl.className   = 'wrong';
    feedbackEl.textContent = `✗ Incorrect. Answer was ${correct}. ${explanation}`;
  }
}

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadQuestion);
