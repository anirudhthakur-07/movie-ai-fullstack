// Detects simple navigation, watchlist count, or statistics queries to solve natively and conserve Gemini tokens
function detectLocalIntent(query) {
  if (!query) return null;
  const normalized = query.toLowerCase().trim();

  // Watchlist Count check
  if (
    normalized.includes("how many movies") || 
    normalized.includes("watchlist size") || 
    normalized.includes("watchlist count") ||
    normalized.includes("number of movies")
  ) {
    return {
      type: "watchlist_count",
      handledLocally: true
    };
  }

  // Page Navigation checks
  if (
    normalized.includes("go to dashboard") || 
    normalized.includes("open dashboard") || 
    normalized.includes("show dashboard")
  ) {
    return {
      type: "navigation",
      target: "dashboard",
      handledLocally: true,
      message: "Directing you to the main control center."
    };
  }
  if (
    normalized.includes("go to watchlist") || 
    normalized.includes("open watchlist") || 
    normalized.includes("show watchlist") ||
    normalized.includes("open my list")
  ) {
    return {
      type: "navigation",
      target: "watchlist",
      handledLocally: true,
      message: "Opening your saved collection folder."
    };
  }

  return null;
}

module.exports = { detectLocalIntent };
