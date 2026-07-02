const { SYSTEM_PROMPT, RESPONSE_FORMAT_INSTRUCTIONS, INTENT_PROMPTS } = require("./promptRegistry");

// Combines the system persona prompt, user context, and user request task into a unified prompt
function buildPrompt(query, context, intent = "general") {
  const contextString = JSON.stringify(context, null, 2);
  const taskDescription = INTENT_PROMPTS[intent] || INTENT_PROMPTS.general;

  return `
${SYSTEM_PROMPT}

USER CONTEXT DATA:
${contextString}

TASK INSTRUCTIONS:
1. Focus on the user's query: "${query}"
2. Apply this specific feature instruction: ${taskDescription}
3. Maintain the Nyx tone and reference context statistics (e.g. watchlist size of ${context.watchlistCount} movies, active persona of ${context.persona}) to personalize the insight.

RESPONSE SCHEMA AND FORMAT:
${RESPONSE_FORMAT_INSTRUCTIONS}
  `;
}

module.exports = { buildPrompt };
