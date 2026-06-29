const User = require("../models/User");
const ProviderClick = require("../models/ProviderClick");
const SearchHistory =require("../models/SearchHistory");
async function buildUserProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
        return null;
    }

    const watchlistCount =
        user.watchlist?.length || 0;
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
const recentSearches =
await SearchHistory.find({
    userId: user._id
})
.sort({
    searchedAt: -1
})
.limit(5);
    let profileStrength = "Low";
   let movieExplorerLevel =
"Beginner";
let activityLevel = "Casual";

if (totalInteractions >= 50) {
    activityLevel = "Power User";
}
else if (totalInteractions >= 20) {
    activityLevel = "Active";
}
if (watchlistCount >= 20) {
    movieExplorerLevel =
    "Advanced";
}
else if (watchlistCount >= 10) {
    movieExplorerLevel =
    "Intermediate";
}
    if (watchlistCount >= 20) {
        profileStrength = "High";
    }
    else if (watchlistCount >= 10) {
        profileStrength = "Medium";
    }
   let personality =
"Movie Fan";

const favoriteGenre =
String(
  genreStats[0]?._id || ""
).toLowerCase();
if (
favoriteGenre === "science fiction"
) {
    personality =
    "Sci-Fi Explorer";
}
else if (
favoriteGenre === "thriller"
) {
    personality =
    "Thriller Hunter";
}
else if (
favoriteGenre === "drama"
) {
    personality =
    "Drama Enthusiast";
}
else if (
favoriteGenre === "action"
) {
    personality =
    "Action Addict";
}
else if (
favoriteGenre === "horror"
) {
    personality =
    "Horror Seeker";
}
else if (
favoriteGenre === "comedy"
) {
    personality =
    "Comedy Lover";
} 
else if (
favoriteGenre === "adventure"
) {
    personality =
    "Adventure Explorer";
}
else if (
favoriteGenre === "fantasy"
) {
    personality =
    "Fantasy Dreamer";
}
else if (
favoriteGenre === "animation"
) {
    personality =
    "Animation Enthusiast";
}
else if (
favoriteGenre === "mystery"
) {
    personality =
    "Mystery Detective";
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
    recentSearches:
recentSearches.map(
    s => s.query
),

   topGenres:
genreStats
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