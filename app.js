// ============================================================
// DATA & STATE
// ============================================================
const explorerData = {
  7: { color:'#7b2ff7', light:'#ede0ff', name:'Application layer', desc:'The closest layer to end users. Defines rules for software requests.', protocols:['HTTP','HTTPS','DNS','FTP'], pdu:'Data', example:'Browser sends HTTP GET request.' },
  6: { color:'#d63af9', light:'#fae0ff', name:'Presentation layer', desc:'The translator. Handles encryption, compression, and encoding.', protocols:['TLS','SSL','JPEG','ASCII'], pdu:'Data', example:'TLS encrypts data; JPEG compresses images.' },
  5: { color:'#f74e8e', light:'#ffe0ef', name:'Session layer', desc:'Manages conversations between apps. Handles checkpoints.', protocols:['RPC','SIP','NetBIOS'], pdu:'Data', example:'Keeping video calls in sync after signal loss.' },
  4: { color:'#f9771e', light:'#fff0e0', name:'Transport layer', desc:'End-to-end delivery. TCP (reliable) or UDP (fast).', protocols:['TCP','UDP','QUIC'], pdu:'Segment', example:'Loading a page (TCP) vs Live video (UDP).' },
  3: { color:'#e8b800', light:'#fffbe0', name:'Network layer', desc:'Routes packets across networks using IP addresses.', protocols:['IPv4','IPv6','ICMP','BGP'], pdu:'Packet', example:'Routers using IP tables to find paths.' },
  2: { color:'#27b567', light:'#e0fff0', name:'Data Link layer', desc:'Node-to-node transfer. MAC addresses and framing.', protocols:['Ethernet','Wi-Fi','MAC','VLAN'], pdu:'Frame', example:'Switches mapping IPs to MAC addresses.' },
  1: { color:'#1a8cd8', light:'#e0f2ff', name:'Physical layer', desc:'The hardware. Electrical signals, light, or radio waves.', protocols:['Fiber','USB','DSL','802.11'], pdu:'Bit', example:'Cables or Wi-Fi radios transmitting bits.' }
};

const state = {
  question: null,
  score: 0,
  streak: 0,
  total: 0,
  locked: false,
  timer: null,
  timeLeft: 90,
  currentLayer: 1,      
  missedLayers: [],     
  isBonusRound: false,
  activeDetail: null
};

const API_URL = "https://dark-hall-6deb.dylangrow.workers.dev"; 
const AUTO_ADVANCE_DELAY = 2800; 

// ============================================================
// BOOT
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
  bindKeys();
  animatePacket();
  nextQuestion();
});

// ============================================================
// CORE QUIZ LOGIC
// ============================================================
async function nextQuestion() {
  resetStateForQuestion();
  let layerToFetch;

  if (!state.isBonusRound) {
    if (state.currentLayer <= 7) {
      layerToFetch = state.currentLayer;
    } else if (state.missedLayers.length > 0) {
      state.isBonusRound = true;
      return showBonusTransition();
    } else {
      return showEndScreen();
    }
  } else {
    if (state.missedLayers.length > 0) {
      layerToFetch = state.missedLayers.shift();
    } else {
      return showEndScreen();
    }
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
  } catch (err) {
    renderError();
  }
  showLoading(false);
}

// ============================================================
// UI RENDERING
// ============================================================
function renderQuestion(data) {
  const layerNum = data.layer_num;
  document.querySelector("#layer-display").textContent = state.isBonusRound ? `REMEDIATION: Layer ${layerNum}` : `PROTOCOL: Layer ${layerNum}`;
  
  // Update Progress
  const progressPercent = (state.total / 7) * 100;
  document.querySelector("#progress-bar").style.width = `${Math.min(progressPercent, 100)}%`;

  // Highlight Stack
  document.querySelectorAll(".layer").forEach(el => {
    el.classList.remove("active-layer");
    if (el.id === `l${layerNum}`) el.classList.add("active-layer");
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

  if (isCorrect) {
    state.score++;
    state.streak++;
  } else {
    state.streak = 0;
    state.missedLayers.push(state.question.layer_num);
  }

  if (!state.isBonusRound) state.currentLayer++;

  showResult(choice, correct);
  updateHUD();
  setTimeout(nextQuestion, AUTO_ADVANCE_DELAY);
}

function showResult(choice, correct) {
  const el = document.querySelector("#feedback");
  const expl = state.question.explanation || "";
  if (choice === correct) {
    el.innerHTML = `<span class="correct">Correct ✅</span><small class="expl">${expl}</small>`;
  } else {
    el.innerHTML = `<span class="wrong">Wrong ❌</span><small class="expl">${expl}</small>`;
  }
}

// ============================================================
// INTERACTIVE EXPLORER (The Sidebar Detail Panel)
// ============================================================
function toggleLayerDetail(n) {
  const panel = document.getElementById('detail-panel');
  if (state.activeDetail === n) {
    panel.classList.remove('visible');
    state.activeDetail = null;
    return;
  }

  state.activeDetail = n;
  const d = explorerData[n];
  const tags = d.protocols.map(p => `<span class="tag" style="background:${d.color}22; color:${d.color}; border:1px solid ${d.color}44; padding:2px 6px; border-radius:4px; font-size:10px; margin:2px; display:inline-block;">${p}</span>`).join('');

  panel.innerHTML = `
    <div style="color:${d.color}; font-weight:700; margin-bottom:5px;">${d.name}</div>
    <div style="font-size:12px; margin-bottom:8px; opacity:0.8;">${d.desc}</div>
    <div>${tags}</div>
    <div style="font-size:11px; margin-top:8px;"><b style="color:${d.color}">PDU:</b> ${d.pdu}</div>
  `;
  panel.classList.add('visible');
}

// ============================================================
// PACKET ANIMATION
// ============================================================
function animatePacket() {
  const pkt = document.getElementById('pkt');
  const layers = [1,2,3,4,5,6,7].map(n => document.getElementById('l'+n));
  const colors = ['#1a8cd8','#27b567','#e8b800','#f9771e','#f74e8e','#d63af9','#7b2ff7'];
  let i = 0;

  setInterval(() => {
    const el = layers[i];
    const center = el.offsetTop + (el.offsetHeight / 2) - 30; // offset for hud
    pkt.style.opacity = '1';
    pkt.style.top = center + 'px';
    pkt.style.background = colors[i];
    pkt.style.color = colors[i]; // for box shadow
    i = (i + 1) % 7;
  }, 1200);
}

// ============================================================
// SHARED SYSTEMS
// ============================================================
function startTimer() {
  state.timeLeft = 90;
  updateTimerUI();
  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();
    if (state.timeLeft <= 0) {
      stopTimer();
      state.missedLayers.push(state.question.layer_num);
      if (!state.isBonusRound) state.currentLayer++;
      showResult("⏱", state.question.answer);
      setTimeout(nextQuestion, AUTO_ADVANCE_DELAY);
    }
  }, 1000);
}

function stopTimer() { clearInterval(state.timer); }
function updateTimerUI() { document.querySelector("#timer").textContent = `Time: ${state.timeLeft}s`; }
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
function showLoading(l) { document.querySelector("#loading").style.display = l ? "block" : "none"; }
function showBonusTransition() {
  document.querySelector("#question-container").innerHTML = `
    <h2 style="color:var(--accent)">BONUS ROUND</h2>
    <p>You missed ${state.missedLayers.length} layers. Retrying for mastery...</p>
    <button class="option" onclick="nextQuestion()">Begin Remediation</button>`;
}
function showEndScreen() {
  document.querySelector("#question-container").innerHTML = `
    <h2>Protocol Complete</h2>
    <p>Accuracy: ${Math.round((state.score/state.total)*100)}%</p>
    <button class="option" onclick="location.reload()">Re-initialize</button>`;
}
function renderError() { document.querySelector("#question").textContent = "Connection Lost. Retrying..."; setTimeout(nextQuestion, 2000); }
