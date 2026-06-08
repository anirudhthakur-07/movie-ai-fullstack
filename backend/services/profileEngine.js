const User = require("../models/User");

async function buildUserProfile(userId) {

    const user = await User.findById(userId);

    if (!user) {
        return null;
    }

    const watchlistCount =
        user.watchlist?.length || 0;

    let profileStrength = "Low";

    if (watchlistCount >= 20) {
        profileStrength = "High";
    }
    else if (watchlistCount >= 10) {
        profileStrength = "Medium";
    }

    return {
        username: user.username,
        watchlistCount,
        profileStrength
    };
}

module.exports = {
    buildUserProfile
};