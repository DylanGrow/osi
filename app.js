const explorerData = {
  7: { color:'#7b2ff7', name:'Application layer', desc:'Closest to user. Defines how apps request data.', protocols:['HTTP','HTTPS','DNS','FTP'], pdu:'Data', example:'Browser sends HTTP GET request.' },
  6: { color:'#d63af9', name:'Presentation layer', desc:'The translator. Handles encryption and formatting.', protocols:['TLS','SSL','JPEG','ASCII'], pdu:'Data', example:'TLS encrypts data; JPEG compresses images.' },
  5: { color:'#f74e8e', name:'Session layer', desc:'Manages connections. Handles checkpoints and sync.', protocols:['RPC','SIP','NetBIOS'], pdu:'Data', example:'Keeping a video call in sync after drops.' },
  4: { color:'#f9771e', name:'Transport layer', desc:'End-to-end delivery. TCP for reliability, UDP for speed.', protocols:['TCP','UDP','QUIC'], pdu:'Segment', example:'Webpages (TCP) vs Live Video (UDP).' },
  3: { color:'#e8b800', name:'Network layer', desc:'Routes packets across networks using IP addresses.', protocols:['IPv4','IPv6','ICMP','BGP'], pdu:'Packet', example:'Routers finding paths across the web.' },
  2: { color:'#27b567', name:'Data Link layer', desc:'Node-to-node transfer. MAC addresses and framing.', protocols:['Ethernet','Wi-Fi','MAC'], pdu:'Frame', example:'Switches mapping IPs to hardware MACs.' },
  1: { color:'#1a8cd8', name:'Physical layer', desc:'Hardware level. Cables, signals, and raw bits.', protocols:['Fiber','USB','DSL','802.11'], pdu:'Bit', example:'Fiber optics transmitting light pulses.' }
};

const state = {
  question: null, score: 0, streak: 0, total: 0,
  locked: false, timer: null, timeLeft: 90,
  currentLayer: 1, missedLayers: [], isBonusRound: false,
  activeDetail: null
};

const API_URL = "https://dark-hall-6deb.dylangrow.workers.dev";
const AUTO_ADVANCE_DELAY = 2800;

window.addEventListener("DOMContentLoaded", () => {
  bindKeys();
  animatePacket();
  nextQuestion();
});

// FIXED: Renamed to match your HTML's onclick="toggleLayerDetail(n)"
function toggleLayerDetail(n) {
  const panel = document.getElementById('detail-panel');
  const layers = document.querySelectorAll('.layer');

  if (state.activeDetail === n) {
    panel.classList.remove('visible');
    document.getElementById('l'+n).classList.remove('active');
    state.activeDetail = null;
    return;
  }

  layers.forEach(l => l.classList.remove('active'));
  document.getElementById('l'+n).classList.add('active');
  state.activeDetail = n;

  const d = explorerData[n];
  panel.style.background = d.color + '15';
  panel.style.borderColor = d.color + '44';
  panel.innerHTML = `
    <div style="color:${d.color}; font-weight:700; font-size:16px;">${d.name}</div>
    <div style="font-size:13px; margin-top:5px; opacity:0.9;">${d.desc}</div>
    <div style="font-size:11px; margin-top:10px;"><b style="color:${d.color}">PDU:</b> ${d.pdu}</div>
  `;
  panel.classList.add('visible');
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
  document.querySelector("#layer-display").textContent = state.isBonusRound ? `REMEDIATION: Layer ${layerNum}` : `PROTOCOL: Layer ${layerNum}`;
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
  if (choice === correct) { state.score++; state.streak++; } 
  else { state.streak = 0; state.missedLayers.push(state.question.layer_num); }
  if (!state.isBonusRound) state.currentLayer++;
  showResult(choice === correct, correct);
  updateHUD();
  setTimeout(nextQuestion, AUTO_ADVANCE_DELAY);
}

function showResult(isCorrect, correct) {
  const el = document.querySelector("#feedback");
  const expl = state.question.explanation || "";
  el.innerHTML = isCorrect ? `<span class="correct">Correct ✅</span><small class="expl">${expl}</small>` : `<span class="wrong">Wrong ❌</span><small class="expl">${expl}</small>`;
}

function animatePacket() {
  const pkt = document.getElementById('pkt');
  const layers = [1,2,3,4,5,6,7].map(n => document.getElementById('l'+n));
  const colors = ['#1a8cd8','#27b567','#e8b800','#f9771e','#f74e8e','#d63af9','#7b2ff7'];
  let i = 0;
  setInterval(() => {
    const el = layers[i];
    if (!el) return;
    const topPos = el.offsetTop + (el.offsetHeight / 2) - 10;
    pkt.style.opacity = '1';
    pkt.style.top = topPos + 'px';
    pkt.style.background = colors[i];
    i = (i + 1) % 7;
  }, 1200);
}

function startTimer() {
  state.timeLeft = 90;
  state.timer = setInterval(() => {
    state.timeLeft--;
    document.querySelector("#timer").textContent = `Time: ${state.timeLeft}s`;
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
function showLoading(l) { document.querySelector("#loading").style.display = l ? "block" : "none"; }
function showBonusTransition() {
  document.querySelector("#question-container").innerHTML = `<h2 style="color:#f9a825">BONUS ROUND</h2><p>Master the layers you missed.</p><button class="option" onclick="nextQuestion()">Begin Remediation</button>`;
}
function showEndScreen() {
  document.querySelector("#question-container").innerHTML = `<h2>Protocol Complete</h2><p>Accuracy: ${Math.round((state.score/state.total)*100)}%</p><button class="option" onclick="location.reload()">Re-initialize</button>`;
}
function renderError() { document.querySelector("#question").textContent = "Connection Lost. Retrying..."; setTimeout(nextQuestion, 2000); }
