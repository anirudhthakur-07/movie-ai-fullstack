const { GoogleGenerativeAI } = require("@google/generative-ai");

// Define Gemini native tool/function declarations to allow structured navigation and modal commands
const NYX_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "navigate",
        description: "Navigate to a specific tab or page on the platform interface (e.g. 'home', 'watchlist', 'dashboard', 'settings').",
        parameters: {
          type: "OBJECT",
          properties: {
            target: {
              type: "STRING",
              description: "Destination target page name.",
              enum: ["home", "watchlist", "dashboard", "settings"]
            }
          },
          required: ["target"]
        }
      },
      {
        name: "openMovie",
        description: "Open the interactive details modal card for a specific movie based on its unique TMDb movie ID.",
        parameters: {
          type: "OBJECT",
          properties: {
            movieId: {
              type: "INTEGER",
              description: "The unique TMDb ID of the movie."
            }
          },
          required: ["movieId"]
        }
      },
      {
        name: "showPersona",
        description: "Highlight or focus the user's taste persona card in the dashboard metrics.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "showMovieDNA",
        description: "Highlight or focus the user's Movie DNA indicators in the dashboard.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "showAnalytics",
        description: "Highlight or focus the provider click analytics chart in the dashboard.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "scrollRecommendation",
        description: "Scroll the page view to reveal the recommended movies lists section.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      }
    ]
  }
];

// Standardized gateway controller to run LLM queries with tools retry mechanism and timeout thresholds
async function callLLM(prompt, retries = 1, timeoutMs = 8000) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key missing in environment variables");
  }

  const ai = new GoogleGenerativeAI(apiKey);
  // Supported models listed in order of preference
  const MODELS = ["gemini-2.0-flash-lite", "gemini-2.5-flash-lite", "gemini-3.1-flash-lite"];

  let attempt = 0;
  while (attempt <= retries) {
    const modelName = MODELS[attempt] || MODELS[0];
    // Initialize the model with native tools definition
    const model = ai.getGenerativeModel({ 
      model: modelName,
      tools: NYX_TOOLS
    });
    console.log(`[NYX GATEWAY] Call attempt ${attempt + 1} using model: ${modelName} (Tools active)`);
    try {
      const apiCall = model.generateContent(prompt);
      
      // Enforce timeout via Promise.race
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
      );

      const result = await Promise.race([apiCall, timeoutPromise]);
      if (!result || !result.response) {
        throw new Error("Empty response received from Gemini API");
      }

      const response = result.response;
      
      // Check if Gemini wants to call a tool/function
      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        console.log("[NYX GATEWAY] Native function call detected:", JSON.stringify(functionCalls));
        return JSON.stringify({ toolCalls: functionCalls });
      }

      const text = response.text();
      if (!text) {
        throw new Error("Blank response text received from Gemini API");
      }
      return text.trim();
    } catch (err) {
      attempt++;
      console.warn(`[NYX GATEWAY] Call attempt ${attempt} failed:`, err.message);
      if (attempt > retries) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

module.exports = { callLLM };
