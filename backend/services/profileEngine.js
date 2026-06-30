const User = require("../models/User");
const ProviderClick = require("../models/ProviderClick");
const SearchHistory =require("../models/SearchHistory");
const BehaviorEvent = require("../models/BehaviorEvent");
const tmdbApi = require("../config/tmdb");

async function buildUserProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
        return null;
    }

    // Dynamic Watchlist Genres Self-Healing Loop
    let updatedWatchlist = false;
    const watchlist = user.watchlist || [];
    
    const fetchPromises = watchlist.map(async (movie, index) => {
        if (!movie.genres || movie.genres.length === 0) {
            try {
                const tmdbRes = await tmdbApi.get(`/movie/${movie.tmdbId}`);
                if (tmdbRes.data && tmdbRes.data.genres) {
                    user.watchlist[index].genres = tmdbRes.data.genres.map(g => g.name);
                    updatedWatchlist = true;
                }
            } catch (err) {
                console.error(`Failed to heal watchlist movie ${movie.tmdbId} genres:`, err.message);
            }
        }
    });

    if (watchlist.length > 0) {
        await Promise.allSettled(fetchPromises);
        if (updatedWatchlist) {
            await user.save();
        }
    }

    const watchlistCount = user.watchlist?.length || 0;
    const totalInteractions =
        await ProviderClick.countDocuments({
            userId: user._id
        });

    const providerStats =
        await ProviderClick.aggregate([
            {
                $match: {
                    userId: user._id
                }
            },
            {
                $project: {
                    normalizedProvider: {
                        $toLower: "$provider"
                    }
                }
            },
            {
                $group: {
                    _id: "$normalizedProvider",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]); 

    // Aggregate genres from ProviderClick
    const genreStats =
        await ProviderClick.aggregate([
            {
                $match: {
                    userId: user._id
                }
            },
            {
                $project: {
                    normalizedGenre: {
                        $toLower: "$genre"
                    }
                }
            },
            {
                $group: {
                    _id: "$normalizedGenre",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]);

    // Aggregate genres from BehaviorEvent
    const behaviorGenreStats =
        await BehaviorEvent.aggregate([
            {
                $match: {
                    userId: user._id,
                    genre: { $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$genre",
                    count: { $sum: 1 }
                }
            }
        ]);

    // Combine genre counts from both sources
    const combinedGenres = {};
    genreStats.forEach(g => {
        if (g._id) {
            combinedGenres[g._id] = (combinedGenres[g._id] || 0) + g.count;
        }
    });
    behaviorGenreStats.forEach(g => {
        if (g._id) {
            combinedGenres[g._id] = (combinedGenres[g._id] || 0) + g.count;
        }
    });

    const sortedGenreStats = Object.entries(combinedGenres)
        .map(([genre, count]) => ({ _id: genre, count }))
        .sort((a, b) => b.count - a.count);

    const recentSearches =
        await SearchHistory.find({
            userId: user._id
        })
        .sort({
            searchedAt: -1
        })
        .limit(5);

    // Fetch total behavioral weight sum
    const behaviorWeightAgg = await BehaviorEvent.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, total: { $sum: "$weight" } } }
    ]);
    const behaviorWeight = behaviorWeightAgg[0]?.total || 0;

    // Combined score: provider clicks count as 100 weight each, plus behavior event weights
    const combinedBehaviorScore = (totalInteractions * 100) + behaviorWeight;

    let profileStrength = "Low";
    let movieExplorerLevel = "Beginner";
    let activityLevel = "Casual";

    if (combinedBehaviorScore >= 1500) {
        activityLevel = "Power User";
    }
    else if (combinedBehaviorScore >= 500) {
        activityLevel = "Active";
    }

    if (watchlistCount >= 20) {
        movieExplorerLevel = "Advanced";
    }
    else if (watchlistCount >= 10) {
        movieExplorerLevel = "Intermediate";
    }

    if (watchlistCount >= 20) {
        profileStrength = "High";
    }
    else if (watchlistCount >= 10) {
        profileStrength = "Medium";
    }
    // Calculate watchlist genres
    const watchlistGenreCounts = {};
    user.watchlist.forEach(movie => {
        if (movie.genres && movie.genres.length > 0) {
            movie.genres.forEach(genreName => {
                const normalized = genreName.toLowerCase().trim();
                watchlistGenreCounts[normalized] = (watchlistGenreCounts[normalized] || 0) + 1;
            });
        }
    });

    const sortedWatchlistGenres = Object.entries(watchlistGenreCounts)
        .map(([genre, count]) => ({ _id: genre, count }))
        .sort((a, b) => b.count - a.count);

    // Determine favorite genre: prioritize watchlist, fallback to analytics clicks
    const favoriteGenre = String(
      sortedWatchlistGenres[0]?._id || sortedGenreStats[0]?._id || ""
    ).toLowerCase().trim();

    let personality = "Movie Fan";

    if (favoriteGenre === "science fiction" || favoriteGenre === "sci-fi") {
        personality = "Sci-Fi Explorer";
    }
    else if (favoriteGenre === "thriller") {
        personality = "Thriller Hunter";
    }
    else if (favoriteGenre === "drama") {
        personality = "Drama Enthusiast";
    }
    else if (favoriteGenre === "action") {
        personality = "Action Addict";
    }
    else if (favoriteGenre === "horror") {
        personality = "Horror Seeker";
    }
    else if (favoriteGenre === "comedy") {
        personality = "Comedy Lover";
    } 
    else if (favoriteGenre === "adventure") {
        personality = "Adventure Explorer";
    }
    else if (favoriteGenre === "fantasy") {
        personality = "Fantasy Dreamer";
    }
    else if (favoriteGenre === "animation") {
        personality = "Animation Enthusiast";
    }
    else if (favoriteGenre === "mystery") {
        personality = "Mystery Detective";
    }
  return {

    username:
    user.username,
    watchlistCount,
    personality,
    profileStrength,
    activityLevel,
    totalInteractions,
    movieExplorerLevel,
    gender: user.gender || "male",
    recentSearches:
recentSearches.map(
    s => s.query
),

   topGenres:
sortedGenreStats
  .slice(0, 3)
  .map(g => ({
      genre: g._id,
      count: g.count
  })),

    topProviders:
    providerStats
      .slice(0, 3)
      .map(p => p._id)
};
}

module.exports = {
    buildUserProfile
};