// ANALYTICS ROUTES
// User Streaming Analytics & Dashboard Insights
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Types } = mongoose;
const ProviderClick   = require("../models/ProviderClick");
const BehaviorEvent   = require("../models/BehaviorEvent");
const auth            = require("../middleware/auth");

// ANALYTICS OVERVIEW
// Returns existing streaming metrics PLUS new behavioral intelligence metrics.
// Existing fields: totalClicks, topProvider, topGenre
// New fields:      behaviorScore, explorationScore, genreDiversity, trailerAffinity, topBehaviorGenre
router.get("/overview", auth, async (req, res) => {
    try {
        const uid = new Types.ObjectId(req.userId);

        // ── EXISTING: ProviderClick metrics ─────────────────────────────────
        const totalClicks = await ProviderClick.countDocuments({ userId: req.userId });

        const providerAgg = await ProviderClick.aggregate([
            { $match: { userId: uid } },
            { $project: { lowerProvider: { $toLower: "$provider" } } },
            { $group: { _id: "$lowerProvider", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const topProvider = providerAgg.length > 0 ? providerAgg[0]._id : "No Data";

        const genreAgg = await ProviderClick.aggregate([
            { $match: { userId: uid } },
            { $project: { lowerGenre: { $toLower: "$genre" } } },
            { $group: { _id: "$lowerGenre", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const topGenre = genreAgg.length > 0 ? genreAgg[0]._id : "No Data";

        // ── NEW: BehaviorEvent metrics ───────────────────────────────────────
        // Run all behavioral aggregations in parallel for performance
        const [
            behaviorScoreAgg,
            distinctMoviesAgg,
            genreDiversityAgg,
            trailerCountAgg,
            detailCountAgg,
            topBehaviorGenreAgg
        ] = await Promise.all([

            // Weighted behavioral score — sum of all event weights
            BehaviorEvent.aggregate([
                { $match: { userId: uid } },
                { $group: { _id: null, total: { $sum: "$weight" } } }
            ]),

            // Exploration score — distinct movies the user has interacted with
            BehaviorEvent.aggregate([
                { $match: { userId: uid } },
                { $group: { _id: "$movieId" } },
                { $count: "distinctMovies" }
            ]),

            // Genre diversity — how many unique genres they have explored
            BehaviorEvent.aggregate([
                { $match: { userId: uid, genre: { $ne: "" } } },
                { $group: { _id: "$genre" } },
                { $count: "distinctGenres" }
            ]),

            // Trailer affinity numerator — trailer_watch event count
            BehaviorEvent.countDocuments({ userId: req.userId, eventType: "trailer_watch" }),

            // Trailer affinity denominator — movie_detail event count
            BehaviorEvent.countDocuments({ userId: req.userId, eventType: "movie_detail" }),

            // Top genre from ALL behavioral events combined (weighted)
            BehaviorEvent.aggregate([
                { $match: { userId: uid, genre: { $ne: "" } } },
                { $group: { _id: "$genre", totalWeight: { $sum: "$weight" } } },
                { $sort: { totalWeight: -1 } },
                { $limit: 1 }
            ])
        ]);

        // Derive computed values with safe fallbacks
        const behaviorScore    = behaviorScoreAgg[0]?.total || 0;
        const explorationScore = distinctMoviesAgg[0]?.distinctMovies || 0;
        const genreDiversity   = genreDiversityAgg[0]?.distinctGenres || 0;
        const trailerAffinity  = detailCountAgg > 0
            ? Math.round((trailerCountAgg / detailCountAgg) * 100)
            : 0;
        const topBehaviorGenre = topBehaviorGenreAgg[0]?._id || "No Data";

        res.json({
            // ── Existing fields (unchanged) ──
            totalClicks,
            topProvider,
            topGenre,
            // ── New behavioral fields ──
            behaviorScore,
            explorationScore,
            genreDiversity,
            trailerAffinity,
            topBehaviorGenre
        });

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