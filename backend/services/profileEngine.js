const User = require("../models/User");
const ProviderClick = require("../models/ProviderClick");

async function buildUserProfile(userId) {

    const user = await User.findById(userId);

    if (!user) {
        return null;
    }

    const watchlistCount =
        user.watchlist?.length || 0;
    const providerStats =
await ProviderClick.aggregate([
  {
    $match: {
      userId: user._id
    }
  },
  {
    $group: {
      _id: "$provider",
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
    $group: {
      _id: "$genre",
      count: { $sum: 1 }
    }
  },
  {
    $sort: {
      count: -1
    }
  }
]);
    let profileStrength = "Low";
   let movieExplorerLevel =
"Beginner";

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
  return {

    username:
    user.username,

    watchlistCount,

    profileStrength,

    movieExplorerLevel,

    topGenres:
    genreStats
      .slice(0, 3)
      .map(g => g._id),

    topProviders:
    providerStats
      .slice(0, 3)
      .map(p => p._id)
};
}

module.exports = {
    buildUserProfile
};