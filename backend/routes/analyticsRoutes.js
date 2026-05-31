// ANALYTICS ROUTES
// User Streaming Analytics & Dashboard Insights
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Types } = mongoose;
const ProviderClick =require("../models/ProviderClick");
const auth =require("../middleware/auth");

// ANALYTICS OVERVIEW
// Total Clicks, Favorite Provider & Favorite Genre
router.get("/overview", auth, async (req, res) => {
    try {
        const totalClicks = await ProviderClick.countDocuments({ userId: req.userId });

        // Let MongoDB find the top provider directly, ignoring case differences
        const providerAgg = await ProviderClick.aggregate([
            { $match: { userId: new Types.ObjectId(req.userId) } },
            { $project: { lowerProvider: { $toLower: "$provider" } } }, 
            { $group: { _id: "$lowerProvider", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const topProvider = providerAgg.length > 0 ? providerAgg[0]._id : "No Data";

        // Let MongoDB find the top genre directly, ignoring case differences
        const genreAgg = await ProviderClick.aggregate([
            { $match: { userId: new Types.ObjectId(req.userId) } },
            { $project: { lowerGenre: { $toLower: "$genre" } } },     
            { $group: { _id: "$lowerGenre", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const topGenre = genreAgg.length > 0 ? genreAgg[0]._id : "No Data";

        res.json({ totalClicks, topProvider, topGenre });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Analytics failed" });
    }
});

// STREAMING PLATFORM ANALYTICS
// Generates Provider Distribution Chart Data
router.get("/providers", auth, async (req, res) => {
    try {
        const stats = await ProviderClick.aggregate([
            {
   $match: {
      userId: new Types.ObjectId(req.userId)
   }
},
            { $project: { lowerProvider: { $toLower: "$provider" } } }, // 👈 Force lower-case for grouping duplicates
            {
                $group: {
                    _id: "$lowerProvider",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const providerMap = {};
        stats.forEach(stat => {
            if (stat._id) { // Ensure key is valid
                providerMap[stat._id] = stat.count;
            }
        });

        res.json(providerMap);
    } catch (err) {
        res.status(500).json({
            error: "Provider analytics failed"
        });
    }
});

// STREAMING PLATFORM ANALYTICS
// Generates Provider Distribution Chart Data
router.get("/genres", auth, async (req, res) => {
    try {
        const stats = await ProviderClick.aggregate([
            {
   $match: {
      userId: new Types.ObjectId(req.userId)
   }
},
            { $project: { lowerGenre: { $toLower: "$genre" } } }, // 👈 Force lower-case for grouping duplicates
            {
                $group: {
                    _id: "$lowerGenre",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const genreMap = {};
        stats.forEach(stat => {
            if (stat._id) { // Ensure key is valid
                genreMap[stat._id] = stat.count;
            }
        });

        res.json(genreMap);
    } catch (err) {
        res.status(500).json({
            error: "Genre analytics failed"
        });
    }
});
// EXPORT ROUTER
module.exports = router;