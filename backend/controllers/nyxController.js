const { detectLocalIntent } = require("../services/AI/intentDetector");
const { buildUserContext } = require("../services/AI/contextBuilder");
const { buildPrompt } = require("../services/AI/promptBuilder");
const { executeNyxQuery } = require("../services/AI/nyxOrchestrator");
const { callLLM, callLLMStream } = require("../services/AI/aiGateway");
const { cleanAndParseJSON } = require("../utils/jsonParser");
const { validateResponse } = require("../services/AI/responseValidator");
const { getFallbackResponse } = require("../utils/fallbackResponses");
const cacheService = require("../services/AI/cacheService");
const aiLogger = require("../services/AI/aiLogger");
const { performance } = require("perf_hooks");

async function handleNyxQuery(req, res) {
  const userId = req.userId;
  const { query, clientState = {}, stream = false } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query is required and must be a string" });
  }

  if (query.trim().length > 1000) {
    return res.status(400).json({ error: "Query is too long. Limit is 1000 characters." });
  }

  const startTotal = performance.now();
  let intent = "general";
  let confidence = 0.50;
  let promptSize = query.length;
  let cacheHit = false;
  let toolCalled = null;

  try {
    // 1. Detect local intent (bypass Gemini completely if offline triggers match)
    const localClassification = detectLocalIntent(query);
    intent = localClassification.intent;
    confidence = localClassification.confidence;

    if (localClassification && localClassification.handledLocally) {
      const response = {
        type: localClassification.type || "summary",
        message: localClassification.message || `Locally resolved query: ${query}`,
        actions: localClassification.actions || [],
        local: true
      };

      // Resolve watchlist count dynamically from context builder
      if (localClassification.type === "watchlist_count" || localClassification.intent === "watchlist_count") {
        const context = await buildUserContext(userId, clientState);
        response.type = "watchlist";
        response.message = `You currently have exactly ${context ? context.watchlistCount : 0} movies saved in your watchlist.`;
        response.actions = ["openWatchlist"];
      } else if (localClassification.intent === "search") {
        response.type = "recommendation";
        response.query = localClassification.parameters?.query;
      } else if (localClassification.intent === "genreFilter") {
        response.genre = localClassification.parameters?.genre;
      } else if (localClassification.parameters?.target) {
        response.target = localClassification.parameters?.target;
      }

      const totalLatency = Math.round(performance.now() - startTotal);
      aiLogger.logRequest({
        userId,
        intent,
        confidence,
        promptSize,
        backendLatency: totalLatency,
        geminiLatency: 0,
        cacheHit: false,
        success: true
      });

      return res.json(response);
    }

    // 2. Resolve ambiguous confidence threshold (< 70%)
    if (confidence < 0.70 && query.trim().split(/\s+/).length < 2) {
      const totalLatency = Math.round(performance.now() - startTotal);
      aiLogger.logRequest({
        userId,
        intent,
        confidence,
        promptSize,
        backendLatency: totalLatency,
        success: true
      });
      return res.json({
        type: "warning",
        message: "Nyx Core requires additional parameters to run analysis. Please query with more details about your DNA, ratings, or navigation.",
        actions: []
      });
    }

    // 3. Check local cache to prevent redundant Gemini API usage
    const cacheKey = `${userId}:${query}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      cacheHit = true;
      const totalLatency = Math.round(performance.now() - startTotal);
      aiLogger.logRequest({
        userId,
        intent: cached.type || "cached",
        confidence,
        promptSize,
        backendLatency: totalLatency,
        geminiLatency: 0,
        cacheHit: true,
        success: true,
        toolCalled: cached.actions && cached.actions[0]
      });
      return res.json(cached);
    }

    // 4. Build user dynamic context
    const startBackend = performance.now();
    const context = await buildUserContext(userId, clientState);
    if (!context) {
      throw new Error("Failed to construct user data context");
    }
    const backendLatency = Math.round(performance.now() - startBackend);

    // 5. Assemble prompt with strict memory length limitations
    const prompt = buildPrompt(query, context, intent);
    promptSize = prompt.length;

    // 6. Streaming Mode Check
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Inject Predefined Agentic Reasoning Traces
      try {
        let step1 = "[Reasoning: Activating Taste DNA neural processor...]\n";
        let step2 = "[Reasoning: Consulting cached cinematic recommendations...]\n";

        if (intent === "navigation" || intent === "settings" || intent === "dashboard" || intent === "watchlist") {
          step1 = "[Reasoning: Identifying target viewport layout...]\n";
          step2 = "[Reasoning: Resolving client interface coordinates...]\n";
        } else if (intent === "search" || intent === "watchlist_count" || intent === "genreFilter") {
          step1 = "[Reasoning: Accessing Mongo user collections...]\n";
          step2 = "[Reasoning: Synthesizing database record keys...]\n";
        }

        res.write(`data: ${JSON.stringify({ chunk: step1 })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 150));
        res.write(`data: ${JSON.stringify({ chunk: step2 })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (e) {
        console.error("Reasoning inject failed:", e);
      }

      let streamedText = "";
      const startGemini = performance.now();

      try {
        await callLLMStream(prompt, (chunk) => {
          streamedText += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });

        const geminiLatency = Math.round(performance.now() - startGemini);
        const promptTokens = Math.ceil(promptSize / 4);
        const responseTokens = Math.ceil(streamedText.length / 4);

        // Telemetry Logging
        aiLogger.logRequest({
          userId,
          intent,
          confidence,
          promptSize,
          completionLength: streamedText.length,
          promptTokens,
          responseTokens,
          backendLatency,
          geminiLatency,
          cacheHit: false,
          success: true
        });

        res.write("data: [DONE]\n\n");
        return res.end();
      } catch (streamErr) {
        console.error("Streaming error in handler:", streamErr.message);
        res.write(`data: ${JSON.stringify({ error: "Failed to generate stream response" })}\n\n`);
        res.write("data: [DONE]\n\n");
        return res.end();
      }
    }

    // 7. Non-Streaming Normal Mode
    const response = await executeNyxQuery({ query, userId, clientState });
    return res.json(response);
  } catch (err) {
    const totalLatency = Math.round(performance.now() - startTotal);
    aiLogger.logRequest({
      userId,
      intent,
      confidence,
      promptSize,
      backendLatency: totalLatency,
      geminiLatency: 0,
      cacheHit: false,
      success: false,
      error: err
    });

    const fallback = getFallbackResponse(intent, query);
    return res.json(fallback);
  }
}

async function getNyxLogs(req, res) {
  try {
    return res.json(aiLogger.getLogs());
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve logs" });
  }
}

module.exports = { handleNyxQuery, getNyxLogs };
