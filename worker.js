const ANTHROPIC_API_KEY = "PASTE_YOUR_KEY_HERE";

export default {
    async fetch(request, env, ctx) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== "POST") {
            return new Response(JSON.stringify({ error: true, message: "POST required" }), { status: 405, headers: corsHeaders });
        }

        try {
            const { prompt } = await request.json();
            
            const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-3-5-haiku-20241022",
                    max_tokens: 512,
                    system: "You are a quiz API. Return ONLY valid JSON matching the user's requested schema. Do not output markdown code blocks or explanations.",
                    messages: [{ role: "user", content: prompt }]
                })
            });

            if (!aiRes.ok) throw new Error("Anthropic API Error");

            const aiData = await aiRes.json();
            let rawText = aiData.content[0].text.trim();
            
            // Clean markdown fences if Claude ignored system instructions
            rawText = rawText.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();

            return new Response(rawText, { headers: { ...corsHeaders, "Content-Type": "application/json" } });

        } catch (error) {
            return new Response(JSON.stringify({ error: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
    }
};
