const explorerData = {
  7: { color:'#7b2ff7', name:'Application layer', desc:'Directly interfaces with software. Handles network services for apps.', pdu:'Data', logic:'HTTP request starts here.' },
  6: { color:'#d63af9', name:'Presentation layer', desc:'The translator. Manages encryption, compression, and encoding.', pdu:'Data', logic:'SSL/TLS encrypts data here.' },
  5: { color:'#f74e8e', name:'Session layer', desc:'Manages dialogues. Keeps separate application conversations organized.', pdu:'Data', logic:'Keeps app streams separate.' },
  4: { color:'#f9771e', name:'Transport layer', desc:'End-to-end delivery. TCP for reliability or UDP for speed.', pdu:'Segment', logic:'Windowing/Flow control acts here.' },
  3: { color:'#e8b800', name:'Network layer', desc:'Routes packets across networks using IP addressing logic.', pdu:'Packet', logic:'Routers select paths here.' },
  2: { color:'#27b567', name:'Data Link layer', desc:'Node-to-node transfer. Frames raw bits and uses MAC addresses.', pdu:'Frame', logic:'Switches map MAC tables here.' },
  1: { color:'#1a8cd8', name:'Physical layer', desc:'The hardware level. Transmits raw bits via electrical or light signals.', pdu:'Bit', logic:'Signals travel over cables.' }
};

const state = {
  question: null, score: 0, streak: 0, total: 0,
  locked: false, timer: null, timeLeft: 90,
  currentLayer: 1, missedLayers: [], isBonusRound: false,
  activeDetail: null
};

const API_URL = "https://dark-hall-6deb.dylangrow.workers.dev";

window.addEventListener("DOMContentLoaded", () => {
  bindKeys();
  animatePacket();
  nextQuestion();
});

// ✅ FIXED: toggle(n) - Perfect .active + .visible sync, tidbit restart
function toggle(n) {
  const panel = document.getElementById('detail-panel');
  const layers = document.querySelectorAll('.layer');

  if (state.activeDetail === n) {
    panel.classList.remove('visible');
    document.getElementById('l'+n).classList.remove('active');
    state.activeDetail = null;
    return;
  }

  // Remove active from ALL layers first
  layers.forEach(l => l.classList.remove('active'));
  
  // Add active ONLY to clicked layer
  const activeLayer = document.getElementById('l'+n);
  activeLayer.classList.add('active');
  state.activeDetail = n;

  const d = explorerData[n];
  panel.style.borderLeft = `4px solid ${d.color}`;
  panel.innerHTML = `
    <div style="color:${d.color}; font-weight:800; font-size:1.1rem; margin-bottom:5px;">${d.name}</div>
    <div style="font-size:0.85rem; line-height:1.4; opacity:0.9;">${d.desc}</div>
    <div style="margin-top:10px; font-size:0.8rem;">
      <span style="color:${d.color}; font-weight:bold;">PDU:</span> ${d.pdu} | 
      <span style="color:${d.color}; font-weight:bold;">Logic:</span> ${d.logic}
    </div>
  `;
  panel.classList.add('visible');

  // Restart tidbit typewriter (confirmed working)
  const protoText = document.getElementById('p' + n);
  if (protoText) {
    protoText.classList.remove('run');
    void protoText.offsetWidth; // Force reflow
    protoText.classList.add('run');
  }
}

async function nextQuestion() {
  resetStateForQuestion();
  let layerToFetch;

  if (!state.isBonusRound) {
    if (state.currentLayer <= 7) { layerToFetch = state.currentLayer; }
    else if (state.missedLayers.length > 0) { state.isBonusRound = true; return showBonusTransition(); }
    else { return showEndScreen(); }
  } else {
    if (state.missedLayers.length > 0) { layerToFetch = state.missedLayers.shift(); }
    else { return showEndScreen(); }
  }

  showLoading(true);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layer: layerToFetch })
    });
    state.question = await res.json();
    state.total++;
    renderQuestion(state.question);
    startTimer();
  } catch (err) { renderError(); }
  showLoading(false);
}

function renderQuestion(data) {
  const layerNum = data.layer_num;
  document.querySelector("#layer-display").textContent = state.isBonusRound ? `REMEDIATION PHASE: LAYER ${layerNum}` : `PROTOCOL SEQUENCE: LAYER ${layerNum}`;
  document.querySelector("#progress-bar").style.width = `${(state.total / 7) * 100}%`;

  document.querySelectorAll(".layer").forEach(el => {
    el.classList.remove('active');
    if (el.id === `l${layerNum}`) el.classList.add('active');
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

function selectAnswer(choice) {
  if (state.locked) return;
  state.locked = true;
  stopTimer();
  const correct = state.question.answer;
  const isCorrect = choice === correct;

  if (isCorrect) { state.score++; state.streak++; } 
  else { state.streak = 0; state.missedLayers.push(state.question.layer_num); }
  
  if (!state.isBonusRound) state.currentLayer++;

  showResult(isCorrect, correct);
  updateHUD();
  setTimeout(nextQuestion, 2800);
}

function showResult(isCorrect, correct) {
  const el = document.querySelector("#feedback");
  const expl = state.question.explanation || "";
  el.innerHTML = isCorrect ? `<span style="color:#22c55e">Correct ✅</span><small class="expl">${expl}</small>` : `<span style="color:#ef4444">Wrong ❌ (Target: ${correct})</span><small class="expl">${expl}</small>`;
}

// ✅ FIXED: animatePacket() - getBoundingClientRect() for PERFECT centering (no HUD issues)
function animatePacket() {
  const pkt = document.getElementById('pkt');
  const packetTrack = document.getElementById('packet-track');
  const layers = [1,2,3,4,5,6,7].map(n => document.getElementById('l'+n));
  const colors = ['#1a8cd8','#27b567','#e8b800','#f9771e','#f74e8e','#d63af9','#7b2ff7'];
  let i = 0;
  
  setInterval(() => {
    const el = layers[i];
    if (el && pkt && packetTrack) {
      // Get viewport-accurate positions
      const trackRect = packetTrack.getBoundingClientRect();
      const layerRect = el.getBoundingClientRect();
      
      // Calculate layer's vertical center relative to packet-track
      const layerCenterY = layerRect.top + (layerRect.height / 2);
      const relativeTop = layerCenterY - trackRect.top;
      
      // Center packet perfectly (24px pkt height / 2 = 12px offset)
      pkt.style.top = `${relativeTop - 12}px`;
      
      pkt.style.opacity = '1';
      pkt.style.background = colors[i];
      pkt.style.boxShadow = `0 0 15px ${colors[i]}`;
    }
    i = (i + 1) % 7;
  }, 1200);
}

function startTimer() {
  state.timeLeft = 90;
  state.timer = setInterval(() => {
    state.timeLeft--;
    const t = document.querySelector("#timer");
    if (t) t.textContent = `Time: ${state.timeLeft}s`;
    if (state.timeLeft <= 0) { stopTimer(); state.missedLayers.push(state.question.layer_num); if (!state.isBonusRound) state.currentLayer++; nextQuestion(); }
  }, 1000);
}

function stopTimer() { clearInterval(state.timer); }
function resetStateForQuestion() { state.locked = false; }
function updateHUD() {
  document.querySelector("#score").textContent = `Score: ${state.score}`;
  document.querySelector("#streak").textContent = `Streak: ${state.streak}`;
  document.querySelector("#total").textContent = `Progress: ${state.total}`;
}
function bindKeys() {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toUpperCase();
    if (["A", "B", "C", "D"].includes(key)) selectAnswer(key);
  });
}
function showLoading(l) { 
  const loader = document.querySelector("#loading");
  if (loader) loader.style.display = l ? "block" : "none"; 
}
function showBonusTransition() {
  document.querySelector("#question-container").innerHTML = `<h2 style="color:#f9a825">BONUS ROUND</h2><p style="margin: 10px 0;">You missed ${state.missedLayers.length} layers. Initiating remediation...</p><button class="option" onclick="nextQuestion()">Begin Now</button>`;
}
function showEndScreen() {
  document.querySelector("#question-container").innerHTML = `<h2>Protocol Complete</h2><p>Accuracy: ${Math.round((state.score/state.total)*100)}%</p><button class="option" onclick="location.reload()" style="margin-top:20px;">Re-initialize System</button>`;
}
function renderError() { document.querySelector("#question").textContent = "Connection Lost. Check Worker deployment."; setTimeout(nextQuestion, 2000); }
