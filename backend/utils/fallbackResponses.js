// Professional fallback responses matching the sophisticated "Dark" Nyx AI OS persona
function getFallbackResponse(intent, query) {
  const fallbacks = {
    recommendation: {
      type: "recommendation",
      message: "The AI reasoning engine is currently unreachable. You can inspect your curated recommendations dynamically on your Home dashboard.",
      actions: ["scrollRecommendation"],
      confidence: 80,
      fallback: true
    },
    movieDNA: {
      type: "movieDNA",
      message: "The taste database is currently calibrating or offline. I can highlight your local Movie DNA widget to inspect your genre metrics.",
      actions: ["showMovieDNA"],
      fallback: true
    },
    persona: {
      type: "persona",
      message: "Unable to retrieve real-time taste persona analysis. Your active archetype progress remains available on your profile widget.",
      actions: ["showPersona"],
      fallback: true
    },
    general: {
      type: "summary",
      message: "Nyx Core experienced a connection deviation while reaching the AI reasoning engine. Your local dashboard and cached navigation remains fully operational.",
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
