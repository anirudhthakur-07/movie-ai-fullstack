const { detectLocalIntent } = require("../services/AI/intentDetector");
const { buildUserContext } = require("../services/AI/contextBuilder");
const { buildPrompt } = require("../services/AI/promptBuilder");
const { callLLM } = require("../services/AI/aiGateway");
const { cleanAndParseJSON } = require("../utils/jsonParser");
const { validateResponse } = require("../services/AI/responseValidator");
const { getFallbackResponse } = require("../utils/fallbackResponses");
const cacheService = require("../services/AI/cacheService");
const aiLogger = require("../services/AI/aiLogger");

async function handleNyxQuery(req, res) {
  const userId = req.userId;
  const { query, pageContext } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query is required and must be a string" });
  }

  if (query.trim().length > 1000) {
    return res.status(400).json({ error: "Query is too long. Limit is 1000 characters." });
  }

  const startTime = Date.now();
  let intent = "general";
  let promptSize = query.length;
  let cacheHit = false;

  try {
    // 1. Detect local intent (bypass Gemini completely if database handles query)
    const localIntent = detectLocalIntent(query);
    if (localIntent && localIntent.handledLocally) {
      const response = {
        type: localIntent.type,
        message: localIntent.message || `Locally resolved query: ${query}`,
        actions: localIntent.type === "navigation" ? [`open${localIntent.target.charAt(0).toUpperCase() + localIntent.target.slice(1)}`] : [],
        local: true
      };

      // Resolve watchlist count natively from context builder
      if (localIntent.type === "watchlist_count") {
        const context = await buildUserContext(userId);
        response.message = `You currently have exactly ${context ? context.watchlistCount : 0} movies saved in your watchlist database.`;
        response.actions = ["openWatchlist"];
      }

      const duration = Date.now() - startTime;
      aiLogger.logRequest({
        intent: localIntent.type,
        promptSize,
        tokens: 0,
        duration,
        cacheHit: false,
        success: true
      });

      return res.json(response);
    }

    // 2. Check local response cache to preserve rate limits
    const cacheKey = `${userId}:${query}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      cacheHit = true;
      const duration = Date.now() - startTime;
      aiLogger.logRequest({
        intent: cached.type || "cached",
        promptSize,
        tokens: 0,
        duration,
        cacheHit: true,
        success: true
      });
      return res.json(cached);
    }

    // 3. Build user dynamic context
    const context = await buildUserContext(userId);
    if (!context) {
      throw new Error("Failed to construct user data context");
    }

    // Classify intent based on keywords for prompt mapping
    if (query.toLowerCase().includes("dna") || query.toLowerCase().includes("theme")) {
      intent = "movieDNA";
    } else if (query.toLowerCase().includes("persona") || query.toLowerCase().includes("profile")) {
      intent = "persona";
    } else if (query.toLowerCase().includes("recommend") || query.toLowerCase().includes("suggest")) {
      intent = "recommendation";
    } else if (query.toLowerCase().includes("analytics") || query.toLowerCase().includes("provider")) {
      intent = "analytics";
    }

    // 4. Assemble dynamic prompt template
    const prompt = buildPrompt(query, context, intent);
    promptSize = prompt.length;

    // 5. Query Gemini AI Gateway
    const rawResult = await callLLM(prompt);

    // 6. Clean response envelopes
    const parsedJSON = cleanAndParseJSON(rawResult);

    // 7. Validate output schemas and actions
    const validated = validateResponse(parsedJSON);

    // Store in cache for future references
    cacheService.set(cacheKey, validated);

    const duration = Date.now() - startTime;
    aiLogger.logRequest({
      intent,
      promptSize,
      tokens: Math.ceil(promptSize / 4) + Math.ceil(rawResult.length / 4), // Simple token estimate
      duration,
      cacheHit: false,
      success: true
    });

    return res.json(validated);
  } catch (err) {
    const duration = Date.now() - startTime;
    aiLogger.logRequest({
      intent,
      promptSize,
      tokens: 0,
      duration,
      cacheHit: false,
      success: false,
      error: err
    });

    // Clean, cinematic fallback execution
    const fallback = getFallbackResponse(intent, query);
    return res.json(fallback);
  }
}

async function getNyxLogs(req, res) {
  try {
    // Only return latest logs
    return res.json(aiLogger.getLogs());
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve logs" });
  }
}

module.exports = { handleNyxQuery, getNyxLogs };
