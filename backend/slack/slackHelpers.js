const axios = require("axios");
const User = require("../models/User");
const { executeNyxQuery } = require("../services/AI/nyxOrchestrator");
const BlockKitBuilder = require("./BlockKitBuilder");

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

// Format JSON response to rich Slack Block Kit (Delegated to BlockKitBuilder)
function formatToBlockKit(nyxResponse, userQuery) {
  return BlockKitBuilder.buildResponse(nyxResponse, userQuery);
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
  queryNyxCore: (query, userId, clientState) => executeNyxQuery({ query, userId, clientState }),
  formatToBlockKit,
  postToSlack
};
