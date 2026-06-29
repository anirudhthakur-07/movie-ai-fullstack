// ACHIEVEMENT ROUTES
// 40 Gamified Achievements & User Experience Tracker
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const SearchHistory = require("../models/SearchHistory");
const ProviderClick = require("../models/ProviderClick");
const auth = require("../middleware/auth");

// GET ALL USER ACHIEVEMENTS
router.get("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Increment dashboard views count whenever they hit this route (meaning they opened the dashboard/analytics page)
        user.dashboardViewsCount = (user.dashboardViewsCount || 0) + 1;

        // Query stats from database
        const watchlistCount = user.watchlist?.length || 0;
        const totalSearches = await SearchHistory.countDocuments({ userId: req.userId });
        const totalClicks = await ProviderClick.countDocuments({ userId: req.userId });

        // Get top genre
        const genreAgg = await ProviderClick.aggregate([
            { $match: { userId: user._id } },
            { $project: { lowerGenre: { $toLower: "$genre" } } },
            { $group: { _id: "$lowerGenre", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const topGenre = genreAgg.length > 0 ? genreAgg[0]._id : "";

        // Get top provider
        const providerAgg = await ProviderClick.aggregate([
            { $match: { userId: user._id } },
            { $project: { lowerProvider: { $toLower: "$provider" } } },
            { $group: { _id: "$lowerProvider", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const topProvider = providerAgg.length > 0 ? providerAgg[0]._id : "";

        // Clicks by provider
        const netflixClicks = await ProviderClick.countDocuments({
            userId: req.userId,
            provider: { $regex: /netflix/i }
        });
        const primeClicks = await ProviderClick.countDocuments({
            userId: req.userId,
            provider: { $regex: /prime|amazon/i }
        });
        const disneyClicks = await ProviderClick.countDocuments({
            userId: req.userId,
            provider: { $regex: /disney|hotstar/i }
        });

        // Distinct platforms
        const distinctProviders = await ProviderClick.distinct("provider", { userId: req.userId });
        const platformCount = distinctProviders.length;

        // Profile metrics
        let profileStrength = "Low";
        let activityLevel = "Casual";
        if (watchlistCount >= 20) profileStrength = "High";
        else if (watchlistCount >= 10) profileStrength = "Medium";
        if (totalClicks >= 50) activityLevel = "Power User";
        else if (totalClicks >= 20) activityLevel = "Active";

        // Definitions of 40 Achievements with unlocked status, XP, targets, and progress
        const achievementsList = [
            // WATCHLIST
            { id: "first_movie", category: "Watchlist", title: "🎬 First Movie Added", desc: "Add 1 movie to watchlist", xp: 100, target: 1, current: watchlistCount },
            { id: "movie_collector_1", category: "Watchlist", title: "🍿 Movie Collector I", desc: "Add 10 movies to watchlist", xp: 200, target: 10, current: watchlistCount },
            { id: "movie_collector_2", category: "Watchlist", title: "🎥 Movie Collector II", desc: "Add 25 movies to watchlist", xp: 300, target: 25, current: watchlistCount },
            { id: "cinephile", category: "Watchlist", title: "🎞 Cinephile", desc: "Add 50 movies to watchlist", xp: 500, target: 50, current: watchlistCount },
            { id: "ultimate_collector", category: "Watchlist", title: "🏆 Ultimate Collector", desc: "Add 100 movies to watchlist", xp: 1000, target: 100, current: watchlistCount },

            // SEARCH
            { id: "first_search", category: "Search", title: "🔎 First Search", desc: "Perform your first movie search", xp: 100, target: 1, current: totalSearches },
            { id: "curious_explorer", category: "Search", title: "🧠 Curious Explorer", desc: "Perform 25 movie searches", xp: 200, target: 25, current: totalSearches },
            { id: "movie_hunter", category: "Search", title: "🌎 Movie Hunter", desc: "Perform 100 movie searches", xp: 300, target: 100, current: totalSearches },
            { id: "search_master", category: "Search", title: "📚 Search Master", desc: "Perform 250 movie searches", xp: 500, target: 250, current: totalSearches },
            { id: "endless_explorer", category: "Search", title: "🔥 Endless Explorer", desc: "Perform 500 movie searches", xp: 1000, target: 500, current: totalSearches },

            // RECOMMENDATIONS
            { id: "first_ai_viewed", category: "Recommendations", title: "⭐ First AI Recommendation Viewed", desc: "Load AI recommendations once", xp: 100, target: 1, current: user.recommendationViewsCount || 0 },
            { id: "ai_trusted", category: "Recommendations", title: "🤖 AI Trusted You", desc: "View AI recommendations 10 times", xp: 250, target: 10, current: user.recommendationViewsCount || 0 },
            { id: "perfect_match", category: "Recommendations", title: "🎯 Perfect Match", desc: "Open 25 recommendation cards", xp: 500, target: 25, current: user.openedRecommendationsCount || 0 },
            { id: "recommendation_explorer", category: "Recommendations", title: "🧬 Recommendation Explorer", desc: "Open a recommendation detail card", xp: 150, target: 1, current: user.openedRecommendationsCount || 0 },
            { id: "ai_favorite", category: "Recommendations", title: "🚀 AI Favorite", desc: "100 recommendation clicks/saves", xp: 1000, target: 100, current: user.recommendationInteractionsCount || 0 },

            // GENRES (Target = 1 if favorite genre, else 0)
            { id: "scifi_explorer", category: "Genres", title: "🚀 Sci-Fi Explorer", desc: "Science Fiction is your top genre", xp: 250, target: 1, current: (topGenre.includes("science fiction") || topGenre.includes("sci-fi")) ? 1 : 0 },
            { id: "comedy_lover", category: "Genres", title: "😂 Comedy Lover", desc: "Comedy is your top genre", xp: 250, target: 1, current: topGenre.includes("comedy") ? 1 : 0 },
            { id: "romance_enthusiast", category: "Genres", title: "❤️ Romance Enthusiast", desc: "Romance is your top genre", xp: 250, target: 1, current: topGenre.includes("romance") ? 1 : 0 },
            { id: "horror_survivor", category: "Genres", title: "👻 Horror Survivor", desc: "Horror is your top genre", xp: 250, target: 1, current: topGenre.includes("horror") ? 1 : 0 },
            { id: "action_hero", category: "Genres", title: "🔫 Action Hero", desc: "Action is your top genre", xp: 250, target: 1, current: topGenre.includes("action") ? 1 : 0 },
            { id: "fantasy_dreamer", category: "Genres", title: "🧙 Fantasy Dreamer", desc: "Fantasy is your top genre", xp: 250, target: 1, current: topGenre.includes("fantasy") ? 1 : 0 },
            { id: "mystery_detective", category: "Genres", title: "🕵 Mystery Detective", desc: "Mystery is your top genre", xp: 250, target: 1, current: topGenre.includes("mystery") ? 1 : 0 },
            { id: "drama_critic", category: "Genres", title: "🎭 Drama Critic", desc: "Drama is your top genre", xp: 250, target: 1, current: topGenre.includes("drama") ? 1 : 0 },
            { id: "adventure_seeker", category: "Genres", title: "🏝 Adventure Seeker", desc: "Adventure is your top genre", xp: 250, target: 1, current: topGenre.includes("adventure") ? 1 : 0 },
            { id: "animation_fan", category: "Genres", title: "🎨 Animation Fan", desc: "Animation is your top genre", xp: 250, target: 1, current: topGenre.includes("animation") ? 1 : 0 },

            // STREAMING
            { id: "netflix_navigator", category: "Streaming", title: "🍿 Netflix Navigator", desc: "Interact with Netflix 20 times", xp: 200, target: 20, current: netflixClicks },
            { id: "prime_explorer", category: "Streaming", title: "📦 Prime Explorer", desc: "Interact with Prime Video 20 times", xp: 200, target: 20, current: primeClicks },
            { id: "disney_fan", category: "Streaming", title: "⭐ Disney Fan", desc: "Interact with Disney+ 20 times", xp: 200, target: 20, current: disneyClicks },
            { id: "streaming_hopper", category: "Streaming", title: "📱 Streaming Hopper", desc: "Explore 3 streaming platforms", xp: 300, target: 3, current: platformCount },
            { id: "platform_collector", category: "Streaming", title: "🌍 Platform Collector", desc: "Explore 5 streaming platforms", xp: 500, target: 5, current: platformCount },

            // PROFILE
            { id: "new_movie_fan", category: "Profile", title: "🌱 New Movie Fan", desc: "Unlock profile dashboard validation", xp: 100, target: 1, current: 1 },
            { id: "movie_enthusiast", category: "Profile", title: "🎬 Movie Enthusiast", desc: "Achieve Medium profile strength", xp: 250, target: 1, current: (profileStrength === "Medium" || profileStrength === "High") ? 1 : 0 },
            { id: "movie_expert", category: "Profile", title: "🎖 Movie Expert", desc: "Achieve High profile strength", xp: 500, target: 1, current: profileStrength === "High" ? 1 : 0 },
            { id: "movie_master", category: "Profile", title: "👑 Movie Master", desc: "Achieve High strength and Power activity", xp: 1000, target: 1, current: (profileStrength === "High" && activityLevel === "Power User") ? 1 : 0 },
            { id: "ai_personality_complete", category: "Profile", title: "🧠 AI Personality Complete", desc: "Generate a taste profile personality", xp: 250, target: 1, current: topGenre ? 1 : 0 },

            // ANALYTICS
            { id: "data_explorer", category: "Analytics", title: "📈 Data Explorer", desc: "Open the analytics dashboard", xp: 100, target: 1, current: user.dashboardViewsCount || 1 },
            { id: "movie_analyst", category: "Analytics", title: "📊 Movie Analyst", desc: "Register at least 1 provider interaction", xp: 200, target: 1, current: totalClicks },
            { id: "personality_revealed", category: "Analytics", title: "🧩 Personality Revealed", desc: "Generate genre analytics count", xp: 200, target: 1, current: totalClicks },
            { id: "power_user", category: "Analytics", title: "🏅 Power User", desc: "Reach Power User activity level", xp: 500, target: 1, current: activityLevel === "Power User" ? 1 : 0 }
        ];

        // Evaluate lock status for each of the first 39 achievements
        const unlockedIds = [];
        let earnedXP = 0;

        achievementsList.forEach(ach => {
            ach.unlocked = ach.current >= ach.target;
            if (ach.unlocked) {
                unlockedIds.push(ach.id);
                earnedXP += ach.xp;
            }
        });

        // Add 40th achievement: Movie Universe Complete (Unlock 35+ other achievements)
        const universeTarget = 35;
        const universeCurrent = unlockedIds.length;
        const universeUnlocked = universeCurrent >= universeTarget;
        const universeXP = 1500;

        const universeAchievement = {
            id: "movie_universe_complete",
            category: "Analytics",
            title: "🌌 Movie Universe Complete",
            desc: "Unlock 35 other achievements",
            xp: universeXP,
            target: universeTarget,
            current: universeCurrent,
            unlocked: universeUnlocked
        };

        if (universeUnlocked) {
            unlockedIds.push("movie_universe_complete");
            earnedXP += universeXP;
        }
        achievementsList.push(universeAchievement);

        // Update user unlockedAchievements list in Mongo only if changes occurred
        const originalUnlockedCount = user.unlockedAchievements?.length || 0;
        if (unlockedIds.length > originalUnlockedCount) {
            user.unlockedAchievements = unlockedIds;
        }
        await user.save();

        // Level calculations (500 XP per level)
        const level = Math.floor(earnedXP / 500) + 1;
        const xpProgress = earnedXP % 500;

        res.json({
            level,
            xp: earnedXP,
            xpProgress,
            unlockedCount: unlockedIds.length,
            totalAchievements: achievementsList.length,
            achievements: achievementsList
        });

    } catch (err) {
        console.error("Achievements loading failed:", err);
        res.status(500).json({ error: "Achievements route failed" });
    }
});

// Temporary in-memory map to store tracking cooldown timestamps per user
const trackingCooldowns = new Map(); // userId -> { lastOpenTime, lastInteractTime }

// POST ACTION TRACKER
// Safe endpoint to log user clicks and views on recommendation items
router.post("/track", auth, async (req, res) => {
    const { action } = req.body;
    try {
        const userIdStr = req.userId.toString();
        const now = Date.now();

        if (!trackingCooldowns.has(userIdStr)) {
            trackingCooldowns.set(userIdStr, { lastOpenTime: 0, lastInteractTime: 0 });
        }
        const userCooldown = trackingCooldowns.get(userIdStr);

        if (action === "open_recommendation") {
            if (now - userCooldown.lastOpenTime < 2000) {
                return res.status(429).json({ error: "Action too frequent" });
            }
            userCooldown.lastOpenTime = now;
        } else if (action === "recommendation_interaction") {
            if (now - userCooldown.lastInteractTime < 2000) {
                return res.status(429).json({ error: "Action too frequent" });
            }
            userCooldown.lastInteractTime = now;
        } else {
            return res.status(400).json({ error: "Invalid action" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (action === "open_recommendation") {
            user.openedRecommendationsCount = (user.openedRecommendationsCount || 0) + 1;
        } else if (action === "recommendation_interaction") {
            user.recommendationInteractionsCount = (user.recommendationInteractionsCount || 0) + 1;
        }

        await user.save();
        res.json({ success: true, opened: user.openedRecommendationsCount, interactions: user.recommendationInteractionsCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to log interaction" });
    }
});

module.exports = router;
