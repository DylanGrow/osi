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
  timeLeft: 90
};

// ============================================================
// CONFIG
// ============================================================

const API_URL = "https://your-worker-url"; // <-- update this
const QUESTION_TIME = 90; // seconds
const AUTO_ADVANCE_DELAY = 1800; // ms after answer

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

  const layer = pickLayer();

  showLoading(true);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layer })
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
// RENDERING
// ============================================================

function renderQuestion(data) {
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

  document.querySelector("#result").textContent = "";
  updateHUD();
}

function renderError() {
  document.querySelector("#question").textContent =
    "Error loading question. Retrying...";

  setTimeout(nextQuestion, 2000);
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
  }

  showResult(choice, correct);
  updateHUD();

  setTimeout(nextQuestion, AUTO_ADVANCE_DELAY);
}

// ============================================================
// RESULT DISPLAY
// ============================================================

function showResult(choice, correct) {
  const resultEl = document.querySelector("#result");

  if (choice === correct) {
    resultEl.textContent = "Correct ✅";
    resultEl.className = "correct";
  } else {
    resultEl.textContent = `Wrong ❌ (Correct: ${correct})`;
    resultEl.className = "wrong";
  }
}

// ============================================================
// TIMER SYSTEM (exam realism)
// ============================================================

function startTimer() {
  state.timeLeft = QUESTION_TIME;
  updateTimerUI();

  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();

    if (state.timeLeft <= 0) {
      handleTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timer);
  state.timer = null;
}

function handleTimeUp() {
  if (state.locked) return;

  state.locked = true;
  state.streak = 0;

  const correct = state.question.answer;

  showResult("⏱", correct);

  setTimeout(nextQuestion, AUTO_ADVANCE_DELAY);
}

function updateTimerUI() {
  const el = document.querySelector("#timer");
  if (el) el.textContent = `Time: ${state.timeLeft}s`;
}

// ============================================================
// STATE RESET
// ============================================================

function resetStateForQuestion() {
  state.locked = false;
}

// ============================================================
// HUD (score/streak)
// ============================================================

function updateHUD() {
  const scoreEl = document.querySelector("#score");
  const streakEl = document.querySelector("#streak");
  const totalEl = document.querySelector("#total");

  if (scoreEl) scoreEl.textContent = `Score: ${state.score}`;
  if (streakEl) streakEl.textContent = `Streak: ${state.streak}`;
  if (totalEl) totalEl.textContent = `Q: ${state.total}`;
}

// ============================================================
// INPUT SHORTCUTS (exam mode feel)
// ============================================================

function bindKeys() {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toUpperCase();

    if (["A", "B", "C", "D"].includes(key)) {
      selectAnswer(key);
    }

    if (e.key === "Enter") {
      nextQuestion();
    }
  });
}

// ============================================================
// UTILITY: layer selection (lightweight randomness)
// ============================================================

function pickLayer() {
  return Math.floor(Math.random() * 7) + 1;
}

// ============================================================
// UI HELPERS
// ============================================================

function showLoading(isLoading) {
  const el = document.querySelector("#loading");
  if (!el) return;
  el.style.display = isLoading ? "block" : "none";
}
