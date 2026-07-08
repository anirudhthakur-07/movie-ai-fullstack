const axios = require("axios");
const User = require("../models/User");
const { detectLocalIntent } = require("../services/AI/intentDetector");
const { buildUserContext } = require("../services/AI/contextBuilder");
const { buildPrompt } = require("../services/AI/promptBuilder");
const { callLLM } = require("../services/AI/aiGateway");
const { cleanAndParseJSON } = require("../utils/jsonParser");
const { validateResponse } = require("../services/AI/responseValidator");
const aiLogger = require("../services/AI/aiLogger");
const { performance } = require("perf_hooks");

// Resolve mapped user from MongoDB
async function getMappedUser(slackUserId) {
  try {
    // Look up user mapping (for now default to first user in system for ease of review)
    let user = await User.findOne({ isAdmin: true });
    if (!user) {
      user = await User.findOne();
    }
    return user;
  } catch (err) {
    console.error("[SLACK HELPERS] User mapping lookup failed:", err);
    return null;
  }
}

// Coordinate exact Nyx pipeline to query Gemini
async function queryNyxCore(query, userId, clientState = {}) {
  const startTotal = performance.now();
  let intent = "general";
  let confidence = 0.50;
  let promptSize = query.length;
  let toolCalled = null;

  try {
    const localClassification = detectLocalIntent(query);
    intent = localClassification.intent;
    confidence = localClassification.confidence;

    if (localClassification && localClassification.handledLocally) {
      const response = {
        type: localClassification.type || "summary",
        message: localClassification.message || `Resolved query: ${query}`,
        actions: localClassification.actions || [],
        local: true
      };

      if (localClassification.type === "watchlist_count" || localClassification.intent === "watchlist_count") {
        const context = await buildUserContext(userId, clientState);
        response.type = "watchlist";
        response.message = `You currently have exactly ${context ? context.watchlistCount : 0} movies saved in your watchlist.`;
        response.actions = ["openWatchlist"];
      } else if (localClassification.intent === "search") {
        response.type = "recommendation";
        response.query = localClassification.parameters?.query;
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

      return response;
    }

    const startBackend = performance.now();
    const context = await buildUserContext(userId, clientState);
    if (!context) {
      throw new Error("Failed to construct user context");
    }
    const backendLatency = Math.round(performance.now() - startBackend);

    const prompt = buildPrompt(query, context, intent);
    promptSize = prompt.length;

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
        message: `Executing platform tool: ${call.name}`,
        actions: [call.name]
      };
      if (call.name === "openMovie" || call.name === "scrollToMovie" || call.name === "playTrailer") {
        finalResponse.movieId = Number(call.args.movieId);
      } else if (call.name === "searchMovie") {
        finalResponse.query = call.args.query;
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

    return validated;
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

    return {
      type: "summary",
      message: `Nyx Core failed to process: ${err.message}`,
      actions: []
    };
  }
}

// Format JSON response to rich Slack Block Kit
function formatToBlockKit(nyxResponse, userQuery) {
  const messageText = nyxResponse.message || "Query processed.";
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "⚡ NYX CORE RESPONSE",
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Inquiry:* _"${userQuery}"_\n\n${messageText}`
      }
    }
  ];

  const actions = nyxResponse.actions || [];
  const actionButtons = [];

  // Map Nyx action arrays to Block Kit button lists
  actions.forEach(action => {
    if (action === "openWatchlist") {
      actionButtons.push({
        type: "button",
        text: { type: "plain_text", text: "🎬 View Watchlist" },
        url: "https://movie-ai-fullstack.vercel.app/watchlist.html",
        style: "primary"
      });
    } else if (action === "openDashboard") {
      actionButtons.push({
        type: "button",
        text: { type: "plain_text", text: "📊 Open Dashboard" },
        url: "https://movie-ai-fullstack.vercel.app/dashboard.html",
        style: "primary"
      });
    } else if (action === "openMovie" && nyxResponse.movieId) {
      actionButtons.push({
        type: "button",
        text: { type: "plain_text", text: "🍿 View Movie Info" },
        url: `https://movie-ai-fullstack.vercel.app/index.html?openMovie=${nyxResponse.movieId}`,
        style: "primary"
      });
    }
  });

  if (actionButtons.length > 0) {
    blocks.push({
      type: "actions",
      elements: actionButtons
    });
  }

  // Include simple footer
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "DARK AI Platform • Multi-channel Orchestrator"
      }
    ]
  });

  return { blocks };
}

// POST message back to Slack API via HTTP requests
async function postToSlack(url, payload) {
  const botToken = process.env.SLACK_BOT_TOKEN;
  if (!botToken) {
    console.error("[SLACK HELPERS] Missing SLACK_BOT_TOKEN in env");
    return;
  }

  try {
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${botToken}`,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[SLACK HELPERS] Slack API call failed:", err.response ? err.response.data : err.message);
  }
}

module.exports = {
  getMappedUser,
  queryNyxCore,
  formatToBlockKit,
  postToSlack
};
