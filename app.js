// --- 1. Variables & Local Storage ---
let currentLayer = parseInt(localStorage.getItem('osiLevel')) || 1;
let strikes = 0;
const MAX_STRIKES = 3;

// --- 2. Startup Functions ---
// Make sure to call initGame() somewhere at the bottom of your file to start things off!
function initGame() {
    updateStrikeDisplay();
    // Assuming you have a function called loadQuestion() or fetchQuestion() 
    // that calls the Worker. Call it here!
    loadQuestion(); 
}

function updateStrikeDisplay() {
    // Displays a red 'X' for each strike, or 'Clear' if 0
    document.getElementById('strikes').innerText = "❌".repeat(strikes) || "Clear";
}

// --- 3. The Cheat Sheet Toggle ---
function toggleCheatSheet() {
    const sheet = document.getElementById('cheat-sheet');
    sheet.classList.toggle('hidden');
}

// --- 4. The Answer Checking & Game Over Logic ---
function handleAnswer(isCorrect) {
    if (isCorrect) {
        // Correct Answer Logic
        currentLayer++;
        localStorage.setItem('osiLevel', currentLayer); // Save progress
        
        if (currentLayer > 7) {
            alert("Super Bowl Champions! You've mastered the OSI Model.");
            resetGame();
        } else {
            loadQuestion(); // Load the next layer
        }
    } else {
        // Wrong Answer Logic
        strikes++;
        updateStrikeDisplay();
        
        if (strikes >= MAX_STRIKES) {
            showGameOver();
        } else {
            alert("Penalty! That's a strike. Try the next one.");
            loadQuestion(); // Load a new question for the same layer
        }
    }
}

function showGameOver() {
    // Injects the Game Over screen directly into the page
    document.body.innerHTML += `
        <div id="game-over">
            <h1 style="color: #FFB81C; font-size: 4rem; margin-bottom: 10px;">BENCHED!</h1>
            <p style="font-size: 1.5rem; margin-bottom: 20px;">You took too many penalties.</p>
            <button onclick="resetGame()" style="padding: 15px 30px; background: #FFB81C; color: #101820; border: none; font-weight: bold; font-size: 1.2rem; cursor: pointer; border-radius: 5px;">START OVER</button>
        </div>
    `;
}

function resetGame() {
    localStorage.clear(); // Wipes the saved level
    location.reload();    // Refreshes the page to start fresh
}
