let currentLayer = parseInt(localStorage.getItem('osiLevel')) || 1;
let strikes = 0;
const MAX_STRIKES = 3;

// Call this when the page loads to set the UI
function initGame() {
    updateStrikeDisplay();
    loadQuestion(); 
}

function updateStrikeDisplay() {
    // Displays "❌" for each strike
    document.getElementById('strikes').innerText = "❌".repeat(strikes) || "Clear";
}

function handleAnswer(isCorrect) {
    if (isCorrect) {
        celebrateCorrect();
        currentLayer++;
        localStorage.setItem('osiLevel', currentLayer);
        if (currentLayer > 7) {
            alert("Super Bowl Champions! You've mastered the OSI Model.");
            resetGame();
        } else {
            loadQuestion();
        }
    } else {
        strikes++;
        updateStrikeDisplay();
        if (strikes >= MAX_STRIKES) {
            showGameOver();
        } else {
            alert("Penalty! That's a strike. Try the next one.");
            loadQuestion();
        }
    }
}

function showGameOver() {
    document.body.innerHTML += `
        <div id="game-over">
            <h1 style="color: #FFB81C;">BENCHED!</h1>
            <p>You took too many penalties.</p>
            <button onclick="resetGame()" style="padding: 15px; background: #FFB81C; border: none; font-weight: bold;">START OVER</button>
        </div>
    `;
}

function resetGame() {
    localStorage.clear();
    location.reload();
}

function toggleCheatSheet() {
    const sheet = document.getElementById('cheat-sheet');
    sheet.classList.toggle('hidden');
}
