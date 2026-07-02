// Detects simple navigation, watchlist count, or statistics queries to solve natively and conserve Gemini tokens
function detectLocalIntent(query) {
  if (!query) return null;
  const normalized = query.toLowerCase().trim();

  const hasAction = normalized.includes("go to") || normalized.includes("open") || normalized.includes("show") || normalized.includes("navigate");
  const hasWatchlist = normalized.includes("watchlist") || normalized.includes("my list") || normalized.includes("saved");
  const hasDashboard = normalized.includes("dashboard") || normalized.includes("home") || normalized.includes("control");

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
  if (hasAction && hasDashboard) {
    return {
      type: "navigation",
      target: "dashboard",
      handledLocally: true,
      message: "Directing you to the main control center."
    };
  }
  if (hasAction && hasWatchlist) {
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
