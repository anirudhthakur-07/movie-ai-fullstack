const { detectLocalIntent } = require("../services/AI/intentDetector");
const { buildUserContext } = require("../services/AI/contextBuilder");
const { buildPrompt } = require("../services/AI/promptBuilder");
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
    const startGemini = performance.now();
    const rawResult = await callLLM(prompt);
    const geminiLatency = Math.round(performance.now() - startGemini);

    let finalResponse;
    const promptTokens = Math.ceil(promptSize / 4);
    const responseTokens = Math.ceil(rawResult.length / 4);

    if (rawResult.startsWith('{"toolCalls":')) {
      const parsedCall = JSON.parse(rawResult);
      const call = parsedCall.toolCalls[0];
      toolCalled = call.name;

      finalResponse = {
        type: "summary",
        message: "Executing curated platform command.",
        actions: []
      };

      // Map native tool commands to client action array payloads
      if (call.name === "navigate") {
        const target = call.args.target;
        finalResponse.type = "navigation";
        if (target === "dashboard") {
          finalResponse.message = "Opening your main control center.";
          finalResponse.actions = ["openDashboard"];
        } else if (target === "watchlist") {
          finalResponse.message = "Opening your saved collection folder.";
          finalResponse.actions = ["openWatchlist"];
        } else if (target === "home") {
          finalResponse.message = "Returning to the dark cinema gate.";
          finalResponse.actions = ["openHome"];
        } else if (target === "settings") {
          finalResponse.message = "Opening configurations.";
          finalResponse.actions = ["openSettings"];
        }
      } else if (call.name === "openMovie") {
        finalResponse.type = "recommendation";
        finalResponse.message = "Displaying cinematic insights.";
        finalResponse.actions = ["openMovie"];
        finalResponse.movieId = Number(call.args.movieId);
      } else if (call.name === "searchMovie") {
        finalResponse.type = "recommendation";
        finalResponse.message = `Executing movie search query: "${call.args.query}".`;
        finalResponse.actions = ["searchMovie"];
        finalResponse.query = call.args.query;
      } else if (call.name === "showPersona") {
        finalResponse.type = "persona";
        finalResponse.message = "Focusing on your active taste persona archetype.";
        finalResponse.actions = ["showPersona"];
      } else if (call.name === "showMovieDNA") {
        finalResponse.type = "movieDNA";
        finalResponse.message = "Locating your movie DNA indicators.";
        finalResponse.actions = ["showMovieDNA"];
      } else if (call.name === "showAnalytics") {
        finalResponse.type = "analytics";
        finalResponse.message = "Opening provider click analytics insights.";
        finalResponse.actions = ["showAnalytics"];
      } else if (call.name === "showWatchlist") {
        finalResponse.type = "navigation";
        finalResponse.message = "Opening your saved watchlist shelf.";
        finalResponse.actions = ["openWatchlist"];
      } else if (call.name === "showDashboard") {
        finalResponse.type = "navigation";
        finalResponse.message = "Opening your main control center.";
        finalResponse.actions = ["openDashboard"];
      } else if (call.name === "showAchievements") {
        finalResponse.type = "navigation";
        finalResponse.message = "Revealing your unlocked milestones.";
        finalResponse.actions = ["openDashboard", "highlightAchievements"];
      } else if (call.name === "showCollectionInsights") {
        finalResponse.type = "navigation";
        finalResponse.message = "Showing collection summary logs.";
        finalResponse.actions = ["openDashboard", "showCollectionInsights"];
      } else if (call.name === "showRecommendation") {
        finalResponse.type = "recommendation";
        finalResponse.message = "Scrolling to recommendations grid.";
        finalResponse.actions = ["scrollRecommendation"];
      } else if (call.name === "showStreamingProviders") {
        finalResponse.type = "navigation";
        finalResponse.message = "Displaying provider click analytics chart.";
        finalResponse.actions = ["openDashboard", "showAnalytics"];
      } else if (call.name === "compareMovies") {
        finalResponse.type = "recommendation";
        finalResponse.message = "Comparing select titles side-by-side.";
        finalResponse.actions = ["compareMovies"];
        finalResponse.movieIds = call.args.movieIds;
      } else if (call.name === "playTrailer") {
        finalResponse.type = "recommendation";
        finalResponse.message = "Initializing video player for movie trailer.";
        finalResponse.actions = ["playTrailer"];
        finalResponse.movieId = Number(call.args.movieId);
      } else if (call.name === "highlightSection") {
        finalResponse.type = "navigation";
        finalResponse.message = `Focusing on target section: ${call.args.sectionId}.`;
        finalResponse.actions = ["highlightSection"];
        finalResponse.sectionId = call.args.sectionId;
      } else if (call.name === "scrollToMovie") {
        finalResponse.type = "recommendation";
        finalResponse.message = "Focusing on selected movie card.";
        finalResponse.actions = ["scrollToMovie"];
        finalResponse.movieId = Number(call.args.movieId);
      } else if (call.name === "showRecentSearches") {
        finalResponse.type = "summary";
        finalResponse.message = "Displaying recent search logs.";
        finalResponse.actions = ["showRecentSearches"];
      } else if (call.name === "summarizeWatchlist") {
        finalResponse.type = "watchlist";
        finalResponse.message = "Aggregating your saved watchlist statistics.";
        finalResponse.actions = ["summarizeWatchlist"];
      }
    } else {
      try {
        finalResponse = cleanAndParseJSON(rawResult);
      } catch (jsonErr) {
        finalResponse = {
          type: "summary",
          message: rawResult,
          actions: []
        };
      }
    }

    const validated = validateResponse(finalResponse);
    cacheService.set(cacheKey, validated);

    const totalLatency = Math.round(performance.now() - startTotal);
    aiLogger.logRequest({
      userId,
      intent,
      confidence,
      promptSize,
      completionLength: rawResult.length,
      promptTokens,
      responseTokens,
      backendLatency,
      geminiLatency,
      cacheHit: false,
      success: true,
      toolCalled
    });

    return res.json(validated);
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
