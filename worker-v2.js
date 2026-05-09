/**
 * OSI Protocol Trainer - Backend Worker v2.0
 * Handles scenario-based networking questions with 
 * strictly constrained explanations (8 words max).
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 2. Friendly GET response (health check)
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ 
        status: "🟢 OSI Trainer Online", 
        layers: 7,
        message: "POST {layer: 1-7} for protocol scenarios.",
        timestamp: new Date().toISOString()
      }), { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }

    // 3. Process POST request
    try {
      const rawBody = await request.text();
      if (!rawBody.trim()) {
        throw new Error("Empty JSON payload required.");
      }

      const body = JSON.parse(rawBody);
      const requestedLayer = parseInt(body?.layer, 10);

      // 4. Validate layer (1-7)
      if (isNaN(requestedLayer) || requestedLayer < 1 || requestedLayer > 7) {
        return new Response(JSON.stringify({ 
          error: "Invalid layer", 
          valid: "1-7 only",
          received: requestedLayer 
        }), {
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // 5. Return random scenario for layer + add layer_num for frontend
      const questionData = getRandomQuestionForLayer(requestedLayer);
      questionData.layer_num = requestedLayer;

      return new Response(JSON.stringify(questionData), {
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });

    } catch (err) {
      console.error("Worker Error:", err);
      return new Response(JSON.stringify({ 
        error: "Processing failed", 
        details: err.message 
      }), {
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }
};

// ============================================================
// SUPREME SCENARIO BANK v1.1 - 14 battle-tested questions
// ============================================================

const questions = {
  1: [ // Physical Layer
    { 
      question: "Cable tester finds split pair. Which layer fails?", 
      options: { A: "Data Link", B: "Network", C: "Physical", D: "Transport" }, 
      answer: "C", 
      explanation: "Physical handles cable and signal integrity." 
    },
    { 
      question: "Generator near switch corrupts data. Root cause?", 
      options: { A: "Attenuation", B: "EMI", C: "Crosstalk", D: "Latency" }, 
      answer: "B", 
      explanation: "Electromagnetic interference corrupts physical signals." 
    }
  ],
  2: [ // Data Link
    { 
      question: "Switch gets unknown MAC frame. Next action?", 
      options: { A: "Drop", B: "Flood", C: "Route", D: "Store" }, 
      answer: "B", 
      explanation: "Floods unknown destination MAC addresses." 
    },
    { 
      question: "Same subnet devices can't talk. Missing MAC resolution?", 
      options: { A: "DNS", B: "DHCP", C: "ARP", D: "ICMP" }, 
      answer: "C", 
      explanation: "ARP maps IP to layer 2 MAC." 
    }
  ],
  3: [ // Network
    { 
      question: "TTL hits zero. Packet dropped by?", 
      options: { A: "Source", B: "Switch", C: "Router", D: "Destination" }, 
      answer: "C", 
      explanation: "Routers decrement TTL, drop at zero." 
    },
    { 
      question: "Fastest path to remote subnet. Layer 3 action?", 
      options: { A: "Switch", B: "Route", C: "Segment", D: "Frame" }, 
      answer: "B", 
      explanation: "Routing calculates optimal network paths." 
    }
  ],
  4: [ // Transport
    { 
      question: "Server overwhelms slow client. Mechanism?", 
      options: { A: "Routing", B: "Flow Control", C: "Encryption", D: "Framing" }, 
      answer: "B", 
      explanation: "Windowing paces transport layer transmission." 
    },
    { 
      question: "VoIP needs low latency. Protocol?", 
      options: { A: "TCP", B: "IP", C: "UDP", D: "ICMP" }, 
      answer: "C", 
      explanation: "UDP sacrifices reliability for transport speed." 
    }
  ],
  5: [ // Session
    { 
      question: "Multiple bank tabs. Data separation layer?", 
      options: { A: "Presentation", B: "Session", C: "Application", D: "Transport" }, 
      answer: "B", 
      explanation: "Session manages concurrent application streams." 
    },
    { 
      question: "File transfer interrupted. Resume mechanism?", 
      options: { A: "Checkpoint", B: "Routing", C: "Encryption", D: "Framing" }, 
      answer: "A", 
      explanation: "Session layer supports dialog recovery." 
    }
  ],
  6: [ // Presentation
    { 
      question: "HTTPS packet decrypted at?", 
      options: { A: "Application", B: "Session", C: "Presentation", D: "Network" }, 
      answer: "C", 
      explanation: "Presentation performs encryption/decryption translation." 
    },
    { 
      question: "Image compressed to JPEG. Layer?", 
      options: { A: "Compression", B: "Segmentation", C: "Routing", D: "Framing" }, 
      answer: "A", 
      explanation: "Presentation handles data format translation." 
    }
  ],
  7: [ // Application
    { 
      question: "'google.com' typed. HTTP starts at?", 
      options: { A: "Presentation", B: "Session", C: "Application", D: "Transport" }, 
      answer: "C", 
      explanation: "Application layer launches network services." 
    },
    { 
      question: "DNS query issued. Operating layer?", 
      options: { A: "Application", B: "Network", C: "Data Link", D: "Physical" }, 
      answer: "A", 
      explanation: "DNS runs as application layer service." 
    }
  ]
};

function getRandomQuestionForLayer(layer) {
  const layerQuestions = questions[layer];
  if (!layerQuestions?.length) throw new Error(`No questions for layer ${layer}`);
  
  const randomIndex = Math.floor(Math.random() * layerQuestions.length);
  return { ...layerQuestions[randomIndex] }; // Return copy
}
