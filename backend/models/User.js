const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    watchlist: [
        {
            tmdbId: Number,
            title: String,
            poster: String
        }
    ],
    unlockedAchievements: { type: [String], default: [] },
    recommendationViewsCount: { type: Number, default: 0 },
    openedRecommendationsCount: { type: Number, default: 0 },
    recommendationInteractionsCount: { type: Number, default: 0 },
    dashboardViewsCount: { type: Number, default: 0 },
    gender: { type: String, enum: ["male", "female"], default: "male" }
});

module.exports = mongoose.model('User', userSchema);