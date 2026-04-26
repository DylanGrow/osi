let currentLayer = 1;
let seenQuestions = [];

async function loadQuestion() {
    document.getElementById('question').innerText = "Generating next question...";
    document.getElementById('options').innerHTML = "";
    document.getElementById('feedback').innerText = "";
    document.getElementById('layer-display').innerText = `Layer: ${currentLayer}`;

    try {
        const response = await fetch("https://dark-hall-6deb.dylangrow.workers.dev", {
            method: "POST",
            body: JSON.stringify({
                prompt: `Generate a question for OSI Layer ${currentLayer}`,
                layer: currentLayer,
                history: seenQuestions
            })
        });

        const data = await response.json();
        seenQuestions.push(data.question);

        document.getElementById('question').innerText = data.question;
        
        const optionsDiv = document.getElementById('options');
        for (const [key, value] of Object.entries(data.options)) {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = `${key}: ${value}`;
            btn.onclick = () => checkAnswer(key, data.answer, data.explanation);
            optionsDiv.appendChild(btn);
        }
    } catch (error) {
        document.getElementById('question').innerText = "Error loading question. Check console.";
        console.error(error);
    }
}

function checkAnswer(selected, correct, explanation) {
    const feedback = document.getElementById('feedback');
    if (selected === correct) {
        feedback.style.color = "green";
        feedback.innerText = "Correct! Moving up...";
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
        feedback.style.color = "red";
        feedback.innerText = `Incorrect. The answer was ${correct}. ${explanation}`;
    }
}

// Start the game
loadQuestion();
