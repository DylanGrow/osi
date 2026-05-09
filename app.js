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
  progress: document.getElementById("progress-fill"),
};

function updateHUD() {
  el.score.textContent = `Score: ${state.score}`;
  el.streak.textContent = `Streak: ${state.streak}`;
  el.timer.textContent = `Time: ${state.time}s`;
}

let timerId;
function startTimer() {
  timerId = setInterval(() => {
    state.time--;
    updateHUD();

    if (state.time <= 0) {
      endGame();
      clearInterval(timerId);
    }
  }, 1000);
}

function endGame() {
  el.question.textContent = "Time's up!";
  el.options.innerHTML = "";
  el.feedback.textContent = `Final Score: ${state.score}`;
  el.feedback.className = "";
  state.currentAnswer = null;
}

const QUESTION_BANK = [
  { question: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Processor Unit", "Central Process Unit"], answer: "Central Processing Unit" },
  { question: "Which protocol is used for secure web browsing?", options: ["HTTP", "HTTPS", "FTP", "SMTP"], answer: "HTTPS" },
  { question: "What is the main function of DNS?", options: ["Translate domain names to IP addresses", "Encrypt web traffic", "Assign IP addresses to devices", "Route packets across networks"], answer: "Translate domain names to IP addresses" },
  { question: "Which port is commonly used for SSH?", options: ["21", "22", "23", "80"], answer: "22" },
  { question: "What is the maximum IPv4 address space?", options: ["4.3 billion", "128 million", "3.4 x 10^38", "16 million"], answer: "4.3 billion" },
];

async function fetchQuestion() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const layer = Math.floor(Math.random() * 7) + 1;

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layer }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await res.json();

    if (!data.question || !data.options || !data.answer) throw new Error("Invalid OSI data");

    const optionsArray = Object.values(data.options);
    const correctValue = data.options[data.answer];

    const formattedData = {
      question: data.question,
      options: optionsArray,
      answer: correctValue,
      explanation: data.explanation
    };

    if (state.asked.has(formattedData.question)) return fetchQuestion();
    state.asked.add(formattedData.question);
    return formattedData;

  } catch (err) {
    console.warn("Worker failed or timed out, using fallback bank.", err);
    const available = QUESTION_BANK.filter(q => !state.asked.has(q.question));
    const source = available.length > 0 ? available : QUESTION_BANK;
    const q = source[Math.floor(Math.random() * source.length)];
    state.asked.add(q.question);
    return { ...q, options: [...q.options] };
  }
}

function renderQuestion(q) {
  el.question.textContent = q.question;
  el.options.innerHTML = "";
  el.feedback.textContent = "";
  el.feedback.className = "";

  state.currentAnswer = q.answer;
  state.currentExplanation = q.explanation;

  q.options.sort(() => Math.random() - 0.5);

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = opt;
    btn.setAttribute("aria-label", opt);

    btn.onclick = () => handleAnswer(opt);

    el.options.appendChild(btn);
  });
}

function handleAnswer(selected) {
  if (!state.currentAnswer) return;

  const explText = state.currentExplanation ? ` - ${state.currentExplanation}` : "";

  if (selected === state.currentAnswer) {
    state.score += 10;
    state.streak++;
    el.feedback.textContent = `✅ Correct!${explText}`;
    el.feedback.className = "feedback-correct";
  } else {
    state.streak = 0;
    el.feedback.textContent = `❌ Correct: ${state.currentAnswer}${explText}`;
    el.feedback.className = "feedback-incorrect";
  }

  updateHUD();
  state.currentAnswer = null; // Prevent double clicking

  setTimeout(loadNextQuestion, 2500); // 2.5 seconds to read explanation
}

async function loadNextQuestion() {
  if (state.time <= 0) return;
  const q = await fetchQuestion();
  renderQuestion(q);

  // Update progress bar
  const percent = Math.min((state.score / 200) * 100, 100);
  if (el.progress) el.progress.style.width = percent + "%";
}

function init() {
  updateHUD();
  startTimer();
  loadNextQuestion();
}

init();
