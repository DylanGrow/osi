// ============================================================
// EXAM ENGINE STATE
// ============================================================

const state = {
  question: null,
  score: 0,
  streak: 0,
  total: 0,
  locked: false,
  timer: null,
  timeLeft: 90,
  
  // NEW LOGIC STATE
  currentLayer: 1,      // Start at Layer 1
  missedLayers: [],     // Track layers to retry
  isBonusRound: false   // Flag for the retry phase
};

// ============================================================
// CONFIG
// ============================================================

const API_URL = "https://dark-hall-6deb.dylangrow.workers.dev"; 
const QUESTION_TIME = 90; 
const AUTO_ADVANCE_DELAY = 2500; 

// ============================================================
// BOOT
// ============================================================

window.addEventListener("DOMContentLoaded", init);

async function init() {
  bindKeys();
  await nextQuestion();
}

// ============================================================
// CORE LOOP
// ============================================================

async function nextQuestion() {
  resetStateForQuestion();
  
  let layerToFetch;

  // ROUND 1: Sequential 1-7
  if (!state.isBonusRound) {
    if (state.currentLayer <= 7) {
      layerToFetch = state.currentLayer;
    } else {
      // End of Round 1: Check if we have homework
      if (state.missedLayers.length > 0) {
        state.isBonusRound = true;
        showBonusTransition();
        return; // Transition screen handles the next call
      } else {
        showEndScreen();
        return;
      }
    }
  } 
  
  // ROUND 2: The Bonus Round (Retrying missed layers)
  else {
    if (state.missedLayers.length > 0) {
      layerToFetch = state.missedLayers.shift(); // Pull the first missed layer
    } else {
      showEndScreen();
      return;
    }
  }

  showLoading(true);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layer: layerToFetch })
    });

    const data = await res.json();
    state.question = data;
    state.total++;

    renderQuestion(data);
    startTimer();

  } catch (err) {
    console.error("Fetch failed:", err);
    renderError();
  }

  showLoading(false);
}

// ============================================================
// RENDERING & VISUALS
// ============================================================

function renderQuestion(data) {
  const layerNum = data.layer_num;
  
  document.querySelector("#layer-display").textContent = 
    state.isBonusRound ? `BONUS: Layer ${layerNum}` : `Layer: ${layerNum}`;

  // Progress Bar: Now based on 7 base layers + total questions
  const progressPercent = (state.total / 7) * 100;
  const bar = document.querySelector("#progress-bar");
  if (bar) bar.style.width = `${Math.min(progressPercent, 100)}%`;

  // Highlight OSI Stack
  document.querySelectorAll(".layer-box").forEach(el => {
    el.classList.remove("active-layer");
    if (el.getAttribute("data-l") == layerNum) {
      el.classList.add("active-layer");
    }
  });

  document.querySelector("#question").textContent = data.question;
  const optionsEl = document.querySelector("#options");
  optionsEl.innerHTML = "";

  Object.entries(data.options).forEach(([key, value]) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = `${key}: ${value}`;
    btn.onclick = () => selectAnswer(key);
    optionsEl.appendChild(btn);
  });

  document.querySelector("#feedback").innerHTML = "";
  updateHUD();
}

// ============================================================
// ANSWER HANDLER
// ============================================================

function selectAnswer(choice) {
  if (state.locked) return;
  state.locked = true;
  stopTimer();

  const correct = state.question.answer;
  const isCorrect = choice === correct;

  if (isCorrect) {
    state.score++;
    state.streak++;
  } else {
    state.streak = 0;
    // Record the failure to trigger a bonus round for this layer
    if (!state.isBonusRound) {
      state.missedLayers.push(state.question.layer_num);
    } else {
      // If they miss it in the bonus round, put it back in the queue!
      state.missedLayers.push(state.question.layer_num);
    }
  }

  // Progress to next layer if in Round 1
  if (!state.isBonusRound) {
    state.currentLayer++;
  }

  showResult(choice, correct);
  updateHUD();

  setTimeout(nextQuestion, AUTO_ADVANCE_DELAY);
}

// ============================================================
// UI HELPERS
// ============================================================

function showResult(choice, correct) {
  const resultEl = document.querySelector("#feedback");
  const explanation = state.question.explanation || "";

  if (choice === correct) {
    resultEl.innerHTML = `Correct ✅ <div class="expl">${explanation}</div>`;
    resultEl.className = "correct";
  } else {
    resultEl.innerHTML = `Wrong ❌ <div class="expl">${explanation}</div>`;
    resultEl.className = "wrong";
  }
}

function showBonusTransition() {
  const container = document.querySelector("#question-container");
  container.innerHTML = `
    <h2 style="color: var(--accent)">BONUS ROUND</h2>
    <p>You missed ${state.missedLayers.length} layers. Let's master them now.</p>
    <button class="option" onclick="nextQuestion()">Begin Remediation</button>
  `;
}

function showEndScreen() {
  const container = document.querySelector("#question-container");
  const percentage = Math.round((state.score / state.total) * 100);
  
  container.innerHTML = `
    <h2>Protocol Complete</h2>
    <p>Final Accuracy: ${percentage}%</p>
    <p>Total Questions: ${state.total}</p>
    <button class="option" onclick="location.reload()">Restart Trainer</button>
  `;
}

// ============================================================
// SHARED SYSTEMS
// ============================================================

function startTimer() {
  state.timeLeft = QUESTION_TIME;
  updateTimerUI();
  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();
    if (state.timeLeft <= 0) handleTimeUp();
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timer);
  state.timer = null;
}

function handleTimeUp() {
  if (state.locked) return;
  state.locked = true;
  state.missedLayers.push(state.question.layer_num);
  if (!state.isBonusRound) state.currentLayer++;
  showResult("⏱", state.question.answer);
  setTimeout(nextQuestion, AUTO_ADVANCE_DELAY);
}

function updateTimerUI() {
  const el = document.querySelector("#timer");
  if (el) el.textContent = `Time: ${state.timeLeft}s`;
}

function resetStateForQuestion() {
  state.locked = false;
}

function updateHUD() {
  document.querySelector("#score").textContent = `Correct: ${state.score}`;
  document.querySelector("#streak").textContent = `Streak: ${state.streak}`;
  document.querySelector("#total").textContent = `Progress: ${state.total}`;
}

function bindKeys() {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toUpperCase();
    if (["A", "B", "C", "D"].includes(key)) selectAnswer(key);
  });
}

function showLoading(isLoading) {
  const el = document.querySelector("#loading");
  if (el) el.style.display = isLoading ? "block" : "none";
}
