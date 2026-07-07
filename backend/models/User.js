const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coViewingCode: { type: String, default: () => "DARK-" + Math.floor(1000 + Math.random() * 9000) },
    watchlist: [
        {
            tmdbId: Number,
            title: String,
            poster: String,
            genres: { type: [String], default: [] },
            folder: { type: String, default: "Uncategorized" }
        }
    ],
    unlockedAchievements: { type: [String], default: [] },
    recommendationViewsCount: { type: Number, default: 0 },
    openedRecommendationsCount: { type: Number, default: 0 },
    recommendationInteractionsCount: { type: Number, default: 0 },
    dashboardViewsCount: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    gender: { type: String, enum: ["male", "female"], default: "male" },
    lastActive: { type: Date, default: Date.now }
});

// TTL index to automatically delete inactive users after 6 months (180 days)
userSchema.index({ lastActive: 1 }, { expireAfterSeconds: 15552000 });

module.exports = mongoose.model('User', userSchema);