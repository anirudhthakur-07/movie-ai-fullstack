// Cinematic fallback responses matching the sophisticated "Dark" Nyx persona
function getFallbackResponse(intent, query) {
  const fallbacks = {
    recommendation: {
      type: "recommendation",
      message: "The shadows reveal only standard paths. Here are titles aligning with your recorded profile.",
      actions: ["scrollRecommendation"],
      confidence: 80,
      fallback: true
    },
    movieDNA: {
      type: "movieDNA",
      message: "The complexity of your Movie DNA requires a moment to calibrate. Standard genre weights indicate a high focus on deep narrative structures.",
      actions: ["highlightDNA"],
      fallback: true
    },
    persona: {
      type: "persona",
      message: "Your taste persona remains stable. The system identifies you as a dedicated explorer of the cinema archive.",
      actions: ["openProfile"],
      fallback: true
    },
    general: {
      type: "summary",
      message: "The archive is calibrating. A temporary network deviation prevents deep reasoning, but the catalog remains open.",
      actions: [],
      fallback: true
    }
  };

  const selected = fallbacks[intent] || fallbacks.general;
  return {
    ...selected,
    query
  };
}

module.exports = { getFallbackResponse };
