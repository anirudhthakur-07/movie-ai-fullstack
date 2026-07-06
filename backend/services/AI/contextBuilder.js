const User = require("../../models/User");
const ProviderClick = require("../../models/ProviderClick");
const SearchHistory = require("../../models/SearchHistory");
const { buildUserProfile } = require("../profileEngine");

// Compiles a token-trimmed, semantically dense contextual view of the user's active dashboard state
async function buildUserContext(userId) {
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

    // Extract recent searches (max 5) from the database collection
    const searchDocs = await SearchHistory.find({ userId: user._id })
      .sort({ searchedAt: -1 })
      .limit(5);
    const recentSearches = searchDocs.map(s => s.query);

    // Watchlist details (max 5 titles to keep context small)
    const watchlistCount = user.watchlist ? user.watchlist.length : 0;
    const sampleWatchlist = (user.watchlist || [])
      .slice(-5)
      .map(w => w.title);

    // SEMANTIC DENSITY: Extract Top 5 Most Recent and Top 5 Most Frequent interactions from Provider Click History
    const [recentClicksDocs, frequentClicksAgg] = await Promise.all([
      // Top 5 most recent interactions
      ProviderClick.find({ userId: user._id })
        .sort({ clickedAt: -1 })
        .limit(5)
        .select("movieTitle genre -_id"),
      
      // Top 5 most frequent interactions
      ProviderClick.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: { title: "$movieTitle", genre: "$genre" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const recentInteractions = recentClicksDocs.map(c => ({
      title: c.movieTitle,
      genre: c.genre
    }));

    const frequentInteractions = frequentClicksAgg.map(f => ({
      title: f._id.title,
      genre: f._id.genre,
      frequency: f.count
    }));

    return {
      username: user.username,
      persona: profile.personality || "Movie Fan",
      activityLevel: profile.activityLevel || "Casual",
      watchlistCount,
      sampleWatchlist,
      topGenres: (profile.topGenres || []).slice(0, 3).map(tg => tg.genre),
      recentSearches,
      recentInteractions,
      frequentInteractions,
      providerClicks: clicksMap,
      totalClicks
    };
  } catch (err) {
    console.error("Context builder failed:", err);
    return null;
  }
}

module.exports = { buildUserContext };
