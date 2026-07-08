const User = require("../../models/User");
const ProviderClick = require("../../models/ProviderClick");
const SearchHistory = require("../../models/SearchHistory");
const { buildUserProfile } = require("../profileEngine");

// Compiles user taste profile, clicks, searches, and active client-side page state
async function buildUserContext(userId, clientState = {}) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Load taste profile using backend profileEngine
    const profile = await buildUserProfile(userId) || {};

    // Get click statistics
    const totalClicks = await ProviderClick.countDocuments({ userId });
    const clicksByProvider = await ProviderClick.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: "$provider", count: { $sum: 1 } } }
    ]);
    const clicksMap = {};
    clicksByProvider.forEach(p => {
      if (p._id) {
        clicksMap[p._id] = p.count;
      }
    });

    // Extract recent searches (max 5)
    const searchDocs = await SearchHistory.find({ userId: user._id })
      .sort({ searchedAt: -1 })
      .limit(5);
    const recentSearches = searchDocs.map(s => s.query);

    // Watchlist details
    const watchlistCount = user.watchlist ? user.watchlist.length : 0;
    const sampleWatchlist = (user.watchlist || [])
      .slice(-5)
      .map(w => w.title);

    // Extract recent clicks (max 5)
    const recentClicksDocs = await ProviderClick.find({ userId: user._id })
      .sort({ clickedAt: -1 })
      .limit(5)
      .select("movieTitle genre -_id");
    const recentInteractions = recentClicksDocs.map(c => ({
      title: c.movieTitle,
      genre: c.genre
    }));

    // Standardize client state from active browser view
    const pageState = {
      currentPage: clientState.currentPage || "home",
      currentMovie: clientState.currentMovie || null,
      currentGenre: clientState.currentGenre || null,
      currentProvider: clientState.currentProvider || null,
      activeFilters: clientState.activeFilters || {},
      recommendationSection: clientState.recommendationSection || null
    };

    return {
      username: user.username,
      persona: profile.personality || "Movie Fan",
      activityLevel: profile.activityLevel || "Casual",
      watchlistCount,
      sampleWatchlist,
      topGenres: (profile.topGenres || []).slice(0, 3).map(tg => tg.genre),
      recentSearches,
      recentInteractions,
      providerClicks: clicksMap,
      totalClicks,
      clientState: pageState
    };
  } catch (err) {
    console.error("Context builder failed:", err);
    return null;
  }
}

module.exports = { buildUserContext };
