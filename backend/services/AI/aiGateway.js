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
        name: "searchMovie",
        description: "Perform a search for movies matching a search query string or title filter.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "The movie title search query."
            }
          },
          required: ["query"]
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
        name: "showWatchlist",
        description: "Open or navigate to the user's saved watchlist page.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "showDashboard",
        description: "Open or navigate to the user's analytics profile dashboard page.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "showAchievements",
        description: "Open or highlight the milestones achievements panel or modal.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "showCollectionInsights",
        description: "Scroll to or highlight the collection summaries and stats insight section.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "showRecommendation",
        description: "Scroll the page view to reveal the recommended movies lists section.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "showStreamingProviders",
        description: "Highlight the click metrics breakdown for streaming providers on the dashboard.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "compareMovies",
        description: "Trigger a side-by-side comparison modal comparing multiple movies.",
        parameters: {
          type: "OBJECT",
          properties: {
            movieIds: {
              type: "ARRAY",
              items: { type: "INTEGER" },
              description: "Array of numerical TMDb movie IDs to compare."
            }
          },
          required: ["movieIds"]
        }
      },
      {
        name: "playTrailer",
        description: "Launch the video player modal for the official trailer of the specified movie.",
        parameters: {
          type: "OBJECT",
          properties: {
            movieId: {
              type: "INTEGER",
              description: "The unique TMDb movie ID."
            }
          },
          required: ["movieId"]
        }
      },
      {
        name: "highlightSection",
        description: "Apply a neon highlight glow animation to a specific UI container section (e.g. 'dna', 'persona', 'analytics', 'achievements').",
        parameters: {
          type: "OBJECT",
          properties: {
            sectionId: {
              type: "STRING",
              description: "The ID name of the targeted section.",
              enum: ["dna", "persona", "analytics", "achievements"]
            }
          },
          required: ["sectionId"]
        }
      },
      {
        name: "scrollToMovie",
        description: "Scroll the grid container directly to focus on a particular movie card by ID.",
        parameters: {
          type: "OBJECT",
          properties: {
            movieId: {
              type: "INTEGER",
              description: "The numerical TMDb ID of the movie card."
            }
          },
          required: ["movieId"]
        }
      },
      {
        name: "showRecentSearches",
        description: "Reveal the list of the user's recent search queries.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "summarizeWatchlist",
        description: "Request a summary of the current items in the user's saved list.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      }
    ]
  }
];

// CENTRALIZED CIRCUIT BREAKER PATTERN FOR LLM RESILIENCE
const breakerState = {
  state: "CLOSED", // CLOSED, OPEN, HALF-OPEN
  failureCount: 0,
  failureThreshold: 3,
  cooldownMs: 20000, // 20s cooldown
  nextAttemptTime: 0
};

function recordBreakerSuccess() {
  breakerState.state = "CLOSED";
  breakerState.failureCount = 0;
}

function recordBreakerFailure() {
  breakerState.failureCount++;
  if (breakerState.failureCount >= breakerState.failureThreshold) {
    breakerState.state = "OPEN";
    breakerState.nextAttemptTime = Date.now() + breakerState.cooldownMs;
    console.warn(`[CIRCUIT BREAKER] Threshold breached. State is now OPEN. Cooldown until ${new Date(breakerState.nextAttemptTime).toISOString()}`);
  }
}

function checkBreakerStatus() {
  if (breakerState.state === "OPEN") {
    if (Date.now() >= breakerState.nextAttemptTime) {
      breakerState.state = "HALF-OPEN";
      console.log("[CIRCUIT BREAKER] Cooldown elapsed. Entering HALF-OPEN state for verification check.");
      return true;
    }
    return false;
  }
  return true;
}

function getCircuitBreakerState() {
  return { ...breakerState };
}

// CENTRALIZED CONCURRENCY REQUEST QUEUE
class PriorityQueue {
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.next();
    });
  }

  next() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;
    
    this.running++;
    const { task, resolve, reject } = this.queue.shift();
    
    task()
      .then(res => {
        this.running--;
        resolve(res);
        this.next();
      })
      .catch(err => {
        this.running--;
        reject(err);
        this.next();
      });
  }
}
const requestQueue = new PriorityQueue(2);

// Central model failover list (prioritized by free tier rate metrics and capacity)
const MODELS = [
  "gemini-2.0-flash-lite", // 30 RPM / 1500 RPD
  "gemini-2.0-flash",      // 15 RPM / 1500 RPD
  "gemini-3.1-flash-lite", // 15 RPM / 500 RPD
  "gemini-1.5-flash"       // 15 RPM / 1500 RPD (Replaced 2.5-flash to unlock higher rate boundaries)
];

// Standard call gateway execution
async function callLLM(prompt, retries = 2, timeoutMs = 8000) {
  if (!checkBreakerStatus()) {
    throw new Error("Circuit breaker open. Gemini API is temporarily offline.");
  }

  const task = () => executeLLMWithFailover(prompt, retries, timeoutMs);
  return requestQueue.enqueue(task);
}

async function executeLLMWithFailover(prompt, retries, timeoutMs) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key missing in environment variables");
  }
  const ai = new GoogleGenerativeAI(apiKey);
  
  let attempt = 0;
  while (attempt <= retries) {
    const modelName = MODELS[attempt] || MODELS[0];
    console.log(`[NYX GATEWAY] Call attempt ${attempt + 1} using model: ${modelName}`);
    
    const model = ai.getGenerativeModel({ 
      model: modelName,
      tools: NYX_TOOLS
    });

    try {
      const apiCall = model.generateContent(prompt);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
      );

      const result = await Promise.race([apiCall, timeoutPromise]);
      if (!result || !result.response) {
        throw new Error("Empty response received from Gemini API");
      }

      const response = result.response;
      recordBreakerSuccess();

      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        return JSON.stringify({ toolCalls: functionCalls });
      }

      const text = response.text();
      if (!text) {
        throw new Error("Blank response text received");
      }

      return text.trim();
    } catch (err) {
      console.warn(`[NYX GATEWAY] Attempt ${attempt + 1} (${modelName}) failed:`, err.message);
      recordBreakerFailure();
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

// SSE Streaming support gateway execution
async function callLLMStream(prompt, onChunk, retries = 2, timeoutMs = 10000) {
  if (!checkBreakerStatus()) {
    throw new Error("Circuit breaker open. Gemini API is temporarily offline.");
  }

  const task = () => executeLLMStreamWithFailover(prompt, onChunk, retries, timeoutMs);
  return requestQueue.enqueue(task);
}

async function executeLLMStreamWithFailover(prompt, onChunk, retries, timeoutMs) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key missing in environment variables");
  }
  const ai = new GoogleGenerativeAI(apiKey);
  
  let attempt = 0;
  while (attempt <= retries) {
    const modelName = MODELS[attempt] || MODELS[0];
    console.log(`[NYX STREAM GATEWAY] Stream attempt ${attempt + 1} using model: ${modelName}`);
    
    const model = ai.getGenerativeModel({ 
      model: modelName,
      tools: NYX_TOOLS
    });

    try {
      const apiCall = model.generateContentStream(prompt);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Stream request timed out")), timeoutMs)
      );

      const resultStream = await Promise.race([apiCall, timeoutPromise]);
      recordBreakerSuccess();

      let streamContainsContent = false;
      for await (const chunk of resultStream.stream) {
        const textChunk = chunk.text();
        if (textChunk) {
          streamContainsContent = true;
          onChunk(textChunk);
        }
      }

      if (!streamContainsContent) {
        // Fallback for native tools trigger
        const response = await resultStream.response;
        const functionCalls = response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
          onChunk(JSON.stringify({ toolCalls: functionCalls }));
        }
      }
      return;
    } catch (err) {
      console.warn(`[NYX STREAM GATEWAY] Attempt ${attempt + 1} (${modelName}) failed:`, err.message);
      recordBreakerFailure();
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

module.exports = { 
  callLLM, 
  callLLMStream, 
  getCircuitBreakerState 
};
