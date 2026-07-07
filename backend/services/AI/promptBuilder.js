const Registry = require("./promptRegistry");

// Combines the system persona prompt, user context, and user request task into a unified prompt
function buildPrompt(query, context, intent = "general") {
  const contextString = JSON.stringify(context, null, 2);
  
  // Map intent classification to Registry prompt segment
  let intentPrompt = Registry.SYSTEM_PROMPT;
  if (intent === "movieDNA") {
    intentPrompt = Registry.MOVIEDNA_PROMPT;
  } else if (intent === "persona") {
    intentPrompt = Registry.PERSONA_PROMPT;
  } else if (intent === "recommendation") {
    intentPrompt = Registry.RECOMMENDATION_PROMPT;
  } else if (intent === "analytics") {
    intentPrompt = Registry.ANALYTICS_PROMPT;
  } else if (intent === "dashboard") {
    intentPrompt = Registry.DASHBOARD_PROMPT;
  } else if (intent === "platform") {
    intentPrompt = Registry.PLATFORM_PROMPT;
  } else if (intent === "navigation") {
    intentPrompt = Registry.NAVIGATION_PROMPT;
  }

  return `
${Registry.SYSTEM_PROMPT}

${Registry.CONTEXT_PROMPT}

USER CONTEXT DATA SNAPSHOT:
${contextString}

TASK INSTRUCTIONS:
1. Focus on explaining this user inquiry: "${query}"
2. Apply these specific analytical guidelines: ${intentPrompt}
3. Ground your explanation mathematically in the provided USER CONTEXT DATA SNAPSHOT.
4. Keep your answer strictly under 3 sentences (60 words max).
`;
}

module.exports = { buildPrompt };
