const GEMINI_API_KEY = "AIzaSyA7uCfbW7EfQgm9BZSnhmXwkgzq42bxsVQ";

export default {
    async fetch(request) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
        if (request.method !== "POST") return new Response(JSON.stringify({ error: true }), { status: 405, headers: corsHeaders });

        try {
            const { prompt } = await request.json();
            const systemPrompt = "You are a quiz API. Return ONLY valid JSON matching the schema. No markdown fences. No explanations.";
            
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            
            const aiRes = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const aiData = await aiRes.json();
            let rawText = aiData.candidates[0].content.parts[0].text;
            
            rawText = rawText.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();

            return new Response(rawText, { headers: { ...corsHeaders, "Content-Type": "application/json" } });

        } catch (error) {
            return new Response(JSON.stringify({ error: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
    }
};
