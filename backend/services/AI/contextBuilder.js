const User = require("../../models/User");
const ProviderClick = require("../../models/ProviderClick");
const { buildUserProfile } = require("../profileEngine");

// Compiles a token-trimmed contextual view of the user's active dashboard state
async function buildUserContext(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Load taste profile using backend profileEngine
    const profile = await buildUserProfile(userId) || {};

    // Get click statistics
    const totalClicks = await ProviderClick.countDocuments({ userId });
    const clicksByProvider = await ProviderClick.aggregate([
      { $match: { userId } },
      { $group: { _id: "$provider", count: { $sum: 1 } } }
    ]);
    const clicksMap = {};
    clicksByProvider.forEach(p => {
      clicksMap[p._id] = p.count;
    });

    // Extract recent searches (max 3)
    const recentSearches = (user.searchHistory || [])
      .sort((a, b) => b.searchedAt - a.searchedAt)
      .slice(0, 3)
      .map(s => s.query);

    // Watchlist details (max 5 titles to keep context small)
    const watchlistCount = user.watchlist ? user.watchlist.length : 0;
    const sampleWatchlist = (user.watchlist || [])
      .slice(-5)
      .map(w => w.title);

    return {
      username: user.username,
      persona: profile.personality || "Movie Fan",
      activityLevel: profile.activityLevel || "Casual",
      watchlistCount,
      sampleWatchlist,
      topGenres: (profile.topGenres || []).slice(0, 3).map(tg => tg.genre),
      recentSearches,
      providerClicks: clicksMap,
      totalClicks
    };
  } catch (err) {
    console.error("Context builder failed:", err);
    return null;
  }
}

module.exports = { buildUserContext };
