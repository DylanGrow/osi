const API_URL = "https://dark-hall-6deb.dylangrow.workers.dev/";

const state = {
  score: 0,
  streak: 0,
  time: 90,
  currentAnswer: null,
  asked: new Set(),
};

const el = {
  question: document.getElementById("question"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  score: document.getElementById("score"),
  streak: document.getElementById("streak"),
  timer: document.getElementById("timer"),
  progress: document.getElementById("progress-bar"),
  pkt: document.getElementById("pkt"),
  layers: document.querySelectorAll(".layer"),
};

function updateHUD() {
  el.score.textContent = `Score: ${state.score}`;
  el.streak.textContent = `Streak: ${state.streak}`;
  el.timer.textContent = `Time: ${state.time}s`;
}

function startTimer() {
  setInterval(() => {
    state.time--;
    updateHUD();

    if (state.time <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  el.question.textContent = "Time's up!";
  el.options.innerHTML = "";
  el.feedback.textContent = `Final Score: ${state.score}`;
}

function getRandomLayer() {
  return Math.floor(Math.random() * 7) + 1;
}

async function fetchQuestion() {
  const layer = getRandomLayer();

  const prompt = `
Generate a CompTIA Network+ style question.

Return JSON:
{
  "question": "...",
  "options": ["A","B","C","D"],
  "answer": "correct option text",
  "layer": ${layer}
}
`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();

  // prevent duplicates
  if (state.asked.has(data.question)) {
    return fetchQuestion();
  }

  state.asked.add(data.question);
  return data;
}

function renderQuestion(q) {
  el.question.textContent = q.question;
  el.options.innerHTML = "";
  el.feedback.textContent = "";

  state.currentAnswer = q.answer;

  q.options.sort(() => Math.random() - 0.5);

  q.options.forEach(opt => {
    const btn = document.createElement("div");
    btn.className = "option";
    btn.textContent = opt;

    btn.onclick = () => handleAnswer(opt, q.layer);

    el.options.appendChild(btn);
  });

  highlightLayer(q.layer);
  movePacket(q.layer);
}

function handleAnswer(selected, layer) {
  if (!state.currentAnswer) return;

  if (selected === state.currentAnswer) {
    state.score += 10;
    state.streak++;
    el.feedback.textContent = "✅ Correct";
  } else {
    state.streak = 0;
    el.feedback.textContent = `❌ Correct: ${state.currentAnswer}`;
  }

  updateHUD();

  setTimeout(loadNextQuestion, 800);
}

function highlightLayer(layerNum) {
  el.layers.forEach(l => l.classList.remove("active"));
  const target = document.getElementById(`l${layerNum}`);
  if (target) target.classList.add("active");
}

function movePacket(layerNum) {
  const target = document.getElementById(`l${layerNum}`);
  if (!target) return;

  const stackRect = document.getElementById("osi-stack").getBoundingClientRect();
  const layerRect = target.getBoundingClientRect();

  const offset = layerRect.top - stackRect.top;

  el.pkt.style.top = offset + "px";
  el.pkt.style.opacity = 1;
}

async function loadNextQuestion() {
  const q = await fetchQuestion();
  renderQuestion(q);

  // progress bar (simple)
  const percent = Math.min((state.score / 200) * 100, 100);
  el.progress.style.width = percent + "%";
}

function init() {
  updateHUD();
  startTimer();
  loadNextQuestion();
}

init();
