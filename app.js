let currentLayer = 1;
let seenQuestions = [];

async function loadQuestion() {
    document.getElementById('question').textContent = "Generating next question...";
    document.getElementById('options').innerHTML = "";
    document.getElementById('feedback').textContent = "";
    document.getElementById('feedback').className = "";
    document.getElementById('layer-display').textContent = `Layer: ${currentLayer}`;

    // Update progress bar
    const bar = document.getElementById('progress-bar');
    const wrap = document.getElementById('progress-bar-wrap');
    if (bar)  bar.style.width = ((currentLayer - 1) / 7 * 100) + '%';
    if (wrap) wrap.setAttribute('aria-valuenow', currentLayer);

    try {
        const response = await fetch("https://dark-hall-6deb.dylangrow.workers.dev", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: `Generate a question for OSI Layer ${currentLayer}`,
                layer: currentLayer,
                history: seenQuestions
            })
        });
        const data = await response.json();
        seenQuestions.push(data.question);
        document.getElementById('question').textContent = data.question;

        const optionsDiv = document.getElementById('options');
        for (const [key, value] of Object.entries(data.options)) {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = `${key}: ${value}`;
            btn.type = 'button';
            btn.setAttribute('aria-label', `Option ${key}: ${value}`);
            btn.onclick = () => checkAnswer(key, data.answer, data.explanation);
            optionsDiv.appendChild(btn);
        }
    } catch (error) {
        document.getElementById('question').textContent = "Error loading question. Check console.";
        console.error(error);
    }
}

function checkAnswer(selected, correct, explanation) {
    const feedback = document.getElementById('feedback');
    if (selected === correct) {
        feedback.className = 'correct';
        feedback.textContent = "Correct! Moving up...";
        setTimeout(() => {
            currentLayer++;
            if (currentLayer > 7) {
                alert("You mastered all 7 layers! Resetting to Layer 1.");
                currentLayer = 1;
                seenQuestions = [];
            }
            loadQuestion();
        }, 1500);
    } else {
        feedback.className = 'wrong';
        feedback.textContent = `Incorrect. The answer was ${correct}. ${explanation}`;
    }
}

// Start the game
document.addEventListener('DOMContentLoaded', loadQuestion);
