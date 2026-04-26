// ==========================================
// OSI Model Quiz - Frontend with Prefetching
// ==========================================

const WORKER_URL = "https://dark-hall-6deb.dylangrow.workers.dev";
let currentLayer = 1;
let currentQuestion = null;
let nextQuestionBuffer = null; 
let isPrefetching = false;

// DOM Elements
const elements = {
  layerDisplay: document.getElementById('layer-display'),
  progressBar: document.getElementById('progress-bar'),
  questionText: document.getElementById('question'),
  optionsContainer: document.getElementById('options'),
  feedbackContainer: document.getElementById('feedback')
};

// ==========================================
// 1. API Calls
// ==========================================

// Base fetch function
async function fetchFromWorker(layer) {
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layer: layer })
    });
    
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Worker fetch failed:", error);
    return null;
  }
}

// Background prefetch logic
async function prefetchNextLayer() {
  const nextLayer = currentLayer + 1;
  
  // Don't prefetch if we are already fetching, if the buffer is full, or if we passed Layer 7
  if (isPrefetching || nextQuestionBuffer || nextLayer > 7) return;

  console.log(`[Prefetch] Silently loading Layer ${nextLayer} in background...`);
  isPrefetching = true;
  
  const data = await fetchFromWorker(nextLayer);
  if (data) {
    nextQuestionBuffer = data;
    console.log(`[Prefetch] Layer ${nextLayer} is loaded and waiting in buffer.`);
  }
  
  isPrefetching = false;
}

// ==========================================
// 2. Core Game Logic
// ==========================================

async function loadQuestion(layer) {
  updateProgressUI(layer);
  elements.feedbackContainer.innerHTML = ''; // Clear feedback
  elements.optionsContainer.innerHTML = ''; // Clear options
  
  // SCENARIO A: The buffer is ready! Instant load.
  if (nextQuestionBuffer && nextQuestionBuffer.meta.layer === layer) {
    console.log(`[Buffer Hit] Instantly loading Layer ${layer} from memory.`);
    currentQuestion = nextQuestionBuffer;
    nextQuestionBuffer = null; // Empty the buffer
    renderQuestion(currentQuestion);
    
    // Immediately start fetching the next one
    prefetchNextLayer(); 
    return;
  }

  // SCENARIO B: Buffer empty or missed (User clicked too fast or cold start)
  console.log(`[Buffer Miss] Fetching Layer ${layer} live...`);
  elements.questionText.innerHTML = '<span class="loading">Establishing connection to AI...</span>';
  
  const data = await fetchFromWorker(layer);
  if (data) {
    currentQuestion = data;
    renderQuestion(currentQuestion);
    prefetchNextLayer(); // Start fetching the next one
  } else {
    elements.questionText.textContent = "Failed to connect to the exam engine. Please try again.";
  }
}

// Render the question and buttons to the DOM
function renderQuestion(data) {
  elements.questionText.textContent = data.question;
  
  // Create a button for each option (A, B, C, D)
  Object.entries(data.options).forEach(([letter, text]) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<strong>${letter}:</strong> ${text}`;
    
    btn.addEventListener('click', () => handleAnswer(letter, data.answer, data.explanation, btn));
    elements.optionsContainer.appendChild(btn);
  });
}

// Handle the user's choice
function handleAnswer(selectedLetter, correctLetter, explanation, clickedButton) {
  // Disable all buttons to prevent double-clicking
  const allButtons = document.querySelectorAll('.option-btn');
  allButtons.forEach(btn => {
    btn.disabled = true;
    if (btn.innerHTML.includes(`<strong>${correctLetter}:</strong>`)) {
      btn.classList.add('correct');
    }
  });

  const isCorrect = selectedLetter === correctLetter;
  if (!isCorrect) clickedButton.classList.add('incorrect');

  // Display the feedback and the explanation
  elements.feedbackContainer.innerHTML = `
    <div class="feedback-card ${isCorrect ? 'pass' : 'fail'}">
      <h3>${isCorrect ? '✅ Correct' : '❌ Incorrect'}</h3>
      <p>${explanation}</p>
      ${currentLayer < 7 
        ? `<button id="next-btn" class="primary-btn">Proceed to Layer ${currentLayer + 1}</button>` 
        : `<button id="next-btn" class="primary-btn">Complete Assessment</button>`}
    </div>
  `;

  // Attach event listener to the newly created Next button
  document.getElementById('next-btn').addEventListener('click', () => {
    if (currentLayer < 7) {
      currentLayer++;
      loadQuestion(currentLayer);
    } else {
      elements.questionText.textContent = "Assessment Complete. You have mapped the OSI Model.";
      elements.optionsContainer.innerHTML = '';
      elements.feedbackContainer.innerHTML = '<button onclick="location.reload()" class="primary-btn">Restart Simulation</button>';
    }
  });
}

// ==========================================
// 3. UI Helpers
// ==========================================

function updateProgressUI(layer) {
  elements.layerDisplay.textContent = `Layer: ${layer}`;
  const percentage = (layer / 7) * 100;
  elements.progressBar.style.width = `${percentage}%`;
}

// ==========================================
// Initialization
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Start the engine
  loadQuestion(currentLayer);
});
