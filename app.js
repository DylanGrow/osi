function showWinState() {
    const container = document.getElementById('game-container');
    const missed = Array.from(missedLayers).sort();
    
    let html = `
        <h1 style="color: #00e5ff">SYSTEM OPTIMIZED</h1>
        <p style="margin-bottom: 1.5rem;">Network+ proficiency confirmed across all layers.</p>
    `;

    // 1. Build the Study Kit Section
    html += `
        <div class="post-action" style="background: rgba(0, 229, 255, 0.05); border-left-color: var(--cyan-neon);">
            <h3 style="color: var(--cyan-neon); margin-bottom: 10px;">V9 Training Toolkit</h3>
            <ul style="list-style: none; padding: 0; text-align: left; margin: 0;">
                <li style="margin-bottom: 12px;">
                    <a href="https://www.youtube.com/results?search_query=Professor+Messer+Network+Plus+N10-009+OSI+Layer+${missed.join('+')}" target="_blank" style="display: block;">
                        ▶ Messer V9 Video Course ${missed.length > 0 ? '(Targeted)' : ''}
                    </a>
                    <small style="opacity: 0.8; display: block;">Best for: Concise objective-by-objective deep dives.</small>
                </li>
                <li style="margin-bottom: 12px;">
                    <a href="https://www.udemy.com/courses/search/?q=Andrew+Ramdayal+Network%2B" target="_blank" style="display: block;">
                        ▶ Andrew Ramdayal Hands-on Training
                    </a>
                    <small style="opacity: 0.8; display: block;">Best for: Practical labs and the "Next Step" mindset.</small>
                </li>
                <li style="margin-bottom: 8px;">
                    <a href="https://crucialexams.com/exams/comptia/network/n10-009" target="_blank" style="display: block;">
                        ▶ Crucial Exams V9 Practice Tests
                    </a>
                    <small style="opacity: 0.8; display: block;">Best for: Simulating the actual test environment.</small>
                </li>
            </ul>
        </div>
    `;

    // 2. Performance Feedback
    if (missedLayers.length > 0) {
        html += `<p style="font-size: 0.9rem; margin: 15px 0;">Focus Areas identified: <strong>Layers ${Array.from(new Set(missedLayers)).join(', ')}</strong></p>`;
    } else {
        html += `<p style="color: #ffb612; font-weight: bold; margin: 15px 0;">Elite Performance: No technical gaps found.</p>`;
    }

    html += `<button class="option-btn" id="reboot-btn" style="width:100%; text-align:center; margin-top: 10px;">REBOOT SYSTEM</button>`;
    
    container.innerHTML = html;
    document.getElementById('reboot-btn').onclick = () => location.reload();
}
