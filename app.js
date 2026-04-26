const WORKER_URL = "https://dark-hall-6deb.dylangrow.workers.dev";

const LOCAL_BANK = [
    { layer: 1, question: "Which device operates primarily at the Physical layer?", options: { A: "Router", B: "Switch", C: "Hub", D: "Firewall" }, answer: "C", explanation: "Hubs are Layer 1 devices that simply broadcast electrical signals to all ports without inspecting MAC or IP addresses." },
    { layer: 2, question: "What data unit is associated with the Data Link layer?", options: { A: "Packet", B: "Frame", C: "Segment", D: "Bit" }, answer: "B", explanation: "Layer 2 encapsulates network layer packets into frames before transmitting them onto the physical medium." },
    { layer: 3, question: "Which protocol is responsible for logical addressing and routing at Layer 3?", options: { A: "TCP", B: "MAC", C: "IP", D: "HTTP" }, answer: "C", explanation: "The Internet Protocol (IP) handles logical addressing and routing packets across different networks." },
    { layer: 4, question: "What is a primary characteristic of UDP at the Transport layer?", options: { A: "Guaranteed delivery", B: "Connectionless", C: "Three-way handshake", D: "Flow control" }, answer: "B", explanation: "UDP is a connectionless protocol that provides fast transmission without guaranteed delivery or error recovery." },
    { layer: 5, question: "Which layer establishes, manages, and terminates connections between applications?", options: { A: "Session", B: "Presentation", C: "Application", D: "Transport" }, answer: "A", explanation: "The Session layer (Layer 5) is responsible for dialog control, establishing, managing, and tearing down communication sessions." },
    { layer: 6, question: "Data encryption and formatting, such as JPEG or ASCII, occur at which layer?", options: { A: "Application", B: "Presentation", C: "Session", D: "Data Link" }, answer: "B", explanation: "Layer 6 (Presentation) translates data formats, encrypts, and compresses data for the application layer." },
    { layer: 7, question: "Which of the following protocols operates at the Application layer?", options: { A: "ICMP", B: "ARP", C: "SMTP", D: "TCP" }, answer: "C", explanation: "SMTP (Simple Mail Transfer Protocol) provides email services directly to user applications at Layer 7." },
    { layer: 2, question: "What is the primary purpose of a MAC address?", options: { A: "Route packets globally", B: "Identify a device on a local network segment", C: "Translate domain names", D: "Ensure reliable delivery" }, answer: "B", explanation: "MAC addresses operate at Layer 2 to physically identify hardware on the same local network segment." },
    { layer: 3, question: "Which device is designed to connect multiple distinct networks and route traffic between them?", options: { A: "Switch", B: "Repeater", C: "Router", D: "Bridge" }, answer: "C", explanation: "Routers operate at Layer 3, examining IP addresses to forward packets between different networks." },
    { layer: 4, question: "What process does TCP use to establish a reliable connection?", options: { A: "CSMA/CD", B: "Three-way handshake", C: "Sliding window", D: "ARP request" }, answer: "B", explanation: "TCP uses a SYN, SYN-ACK, ACK three-way handshake to establish a reliable connection before data transfer." },
    { layer: 7, question: "Which layer is closest to the end user?", options: { A: "Session", B: "Application", C: "Presentation", D: "Transport" }, answer: "B", explanation: "Layer 7 provides the interface for software applications to access network services." },
    { layer: 1, question: "Which medium is considered a Layer 1 component?", options: { A: "IP address", B: "Ethernet frame", C: "Fiber optic cable", D: "Port number" }, answer: "C", explanation: "Layer 1 defines the physical and electrical specifications, including cables and wireless frequencies." },
    { layer: 2, question: "What error-checking mechanism is typically found in a Layer 2 frame?", options: { A: "TTL", B: "FCS (Frame Check Sequence)", C: "Sequence Number", D: "Window Size" }, answer: "B", explanation: "The FCS field at the end of a frame uses a checksum to detect transmission errors over the physical link." },
    { layer: 3, question: "What happens when an IP packet's TTL (Time to Live) reaches zero?", options: { A: "It is sent to the default gateway", B: "It is fragmented", C: "It is dropped by the router", D: "It is retransmitted" }, answer: "C", explanation: "To prevent infinite routing loops, routers decrement TTL. If it hits zero, the packet is discarded." },
    { layer: 4, question: "Which protocol is best suited for real-time video streaming?", options: { A: "TCP", B: "HTTP", C: "FTP", D: "UDP" }, answer: "D", explanation: "UDP avoids the overhead of error correction and retransmission, making it ideal for time-sensitive voice and video." }
];

let state = { score: 0, streak: 0, level: 1, currentQ: null, localIndex: 0 };

const DOM = {
    themeBtn: document.getElementById('theme-toggle'),
    offlineBanner: document.getElementById('offline-banner'),
    score: document.getElementById('score-display'),
    streak: document.getElementById('streak-display'),
    level: document.getElementById('level-display'),
    loading: document.getElementById('loading-spinner'),
    card: document.getElementById('question-card'),
    qText: document.getElementById('question-text'),
    badge: document.getElementById('layer-badge'),
    options: document.querySelectorAll('.option-btn'),
    feedback: document.getElementById('feedback-region'),
    feedTitle: document.getElementById('feedback-title'),
    explanation: document.getElementById('explanation-text'),
    nextBtn: document.getElementById('next-btn')
};

function init() {
    state.score = parseInt(localStorage.getItem('osiScore')) || 0;
    state.streak = parseInt(localStorage.getItem('osiStreak')) || 0;
    state.level = parseInt(localStorage.getItem('osiLevel')) || 1;
    
    const savedTheme = localStorage.getItem('osiTheme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    
    updateStats();
    setupListeners();
    fetchNextQuestion();
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(console.error);
    }
}

function updateStats() {
    DOM.score.textContent = state.score;
    DOM.streak.textContent = state.streak;
    DOM.level.textContent = state.level;
    localStorage.setItem('osiScore', state.score);
    localStorage.setItem('osiStreak', state.streak);
    localStorage.setItem('osiLevel', state.level);
}

function setupListeners() {
    DOM.themeBtn.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const next = curr === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('osiTheme', next);
    });

    DOM.options.forEach(btn => {
        btn.addEventListener('click', () => handleAnswer(btn.dataset.option));
    });

    DOM.nextBtn.addEventListener('click', fetchNextQuestion);

    document.addEventListener('keydown', (e) => {
        if (!DOM.card.classList.contains('hidden') && DOM.feedback.classList.contains('hidden')) {
            const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', 'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D' };
            if (map[e.key.toLowerCase()]) handleAnswer(map[e.key.toLowerCase()]);
        }
    });
}

async function fetchNextQuestion() {
    DOM.card.classList.add('hidden');
    DOM.feedback.classList.add('hidden');
    DOM.loading.classList.remove('hidden');
    DOM.options.forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
        btn.disabled = false;
    });

    try {
        if (!navigator.onLine) throw new Error("Offline");
        
        const prompt = `Generate a difficult, educational multiple-choice question about the OSI model suitable for level ${state.level}. Return ONLY valid JSON, no markdown, no explanation, exactly matching: {"question": "string", "options": {"A": "string", "B": "string", "C": "string", "D": "string"}, "answer": "A"|"B"|"C"|"D", "explanation": "string", "layer": number}`;
        
        const res = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });
        
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        
        if (data.error || !data.question || !data.options || !data.answer) throw new Error("Invalid Format");
        
        DOM.offlineBanner.classList.add('hidden');
        renderQuestion(data);
    } catch (err) {
        DOM.offlineBanner.classList.remove('hidden');
        renderQuestion(LOCAL_BANK[state.localIndex]);
        state.localIndex = (state.localIndex + 1) % LOCAL_BANK.length;
    }
}

function renderQuestion(qData) {
    state.currentQ = qData;
    DOM.qText.textContent = qData.question;
    DOM.badge.textContent = `Layer ${qData.layer}`;
    
    DOM.options.forEach(btn => {
        const opt = btn.dataset.option;
        btn.querySelector('.opt-text').textContent = qData.options[opt];
    });

    DOM.loading.classList.add('hidden');
    DOM.card.classList.remove('hidden');
}

function handleAnswer(selected) {
    const isCorrect = selected === state.currentQ.answer;
    
    DOM.options.forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.option === state.currentQ.answer) btn.classList.add('correct');
        else if (btn.dataset.option === selected) btn.classList.add('incorrect');
    });

    if (isCorrect) {
        state.score += 10 * state.level;
        state.streak += 1;
        if (state.streak % 5 === 0) state.level += 1;
        DOM.feedTitle.textContent = "✅ Correct!";
        DOM.feedTitle.style.color = "var(--correct-color)";
    } else {
        state.streak = 0;
        DOM.feedTitle.textContent = "❌ Incorrect";
        DOM.feedTitle.style.color = "var(--incorrect-color)";
    }
    
    updateStats();
    DOM.explanation.textContent = state.currentQ.explanation;
    DOM.feedback.classList.remove('hidden');
    DOM.nextBtn.focus();
}

window.addEventListener('DOMContentLoaded', init);
