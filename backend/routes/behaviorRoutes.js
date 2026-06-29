// BEHAVIOR EVENT ROUTES
// Receives weighted behavioral signals from the frontend.
// Single endpoint accepts: movie_detail | trailer_watch | watchlist_add
// All events are user-scoped via JWT auth.

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const BehaviorEvent = require("../models/BehaviorEvent");

// Canonical weights — single source of truth
const EVENT_WEIGHTS = {
    movie_detail:  40,
    trailer_watch: 60,
    watchlist_add: 75
};

// POST /api/behavior/event
// Records a single behavioral event for the authenticated user.
// Fire-and-forget from frontend — always returns 200 even on soft errors.
router.post("/event", auth, async (req, res) => {
    try {
        const { eventType, movieId, movieTitle, genre } = req.body;

        // Validate event type — reject unknowns silently (no 400 needed, fire-and-forget)
        const weight = EVENT_WEIGHTS[eventType];
        if (!weight) {
            return res.status(400).json({ error: "Unknown event type" });
        }

        // Validate movieId
        const parsedMovieId = Number(movieId);
        if (!parsedMovieId || isNaN(parsedMovieId)) {
            return res.status(400).json({ error: "Invalid movieId" });
        }

        // Sanitize string inputs
        if (movieTitle && movieTitle.length > 120) {
            return res.status(400).json({ error: "movieTitle too long" });
        }
        if (genre && genre.length > 40) {
            return res.status(400).json({ error: "genre too long" });
        }

        // Deduplicate: do not store the same event type for the same movie
        // within a 1-hour window to prevent repeated rapid opens inflating scores
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentDuplicate = await BehaviorEvent.findOne({
            userId:    req.userId,
            eventType,
            movieId:   parsedMovieId,
            recordedAt: { $gte: oneHourAgo }
        });

        if (recentDuplicate) {
            // Already recorded recently — acknowledge but don't double-count
            return res.json({ success: true, deduplicated: true });
        }

        await BehaviorEvent.create({
            userId:     req.userId,
            eventType,
            movieId:    parsedMovieId,
            movieTitle: movieTitle?.trim() || "",
            genre:      genre?.trim().toLowerCase() || "",
            weight
        });

        res.json({ success: true, deduplicated: false });

    } catch (err) {
        console.error("BEHAVIOR EVENT ERROR:", err.message);
        // Return 200 so frontend fire-and-forget never blocks on errors
        res.json({ success: false, error: "Event recording failed" });
    }
});

// GET /api/behavior/summary
// Returns the user's behavioral score breakdown for debugging / future use.
router.get("/summary", auth, async (req, res) => {
    try {
        const events = await BehaviorEvent.aggregate([
            { $match: { userId: new (require("mongoose").Types.ObjectId)(req.userId) } },
            {
                $group: {
                    _id: "$eventType",
                    count:       { $sum: 1 },
                    totalWeight: { $sum: "$weight" }
                }
            },
            { $sort: { totalWeight: -1 } }
        ]);

        const totalScore = events.reduce((sum, e) => sum + e.totalWeight, 0);

        res.json({ events, totalScore });
    } catch (err) {
        console.error("BEHAVIOR SUMMARY ERROR:", err.message);
        res.status(500).json({ error: "Summary failed" });
    }
});

module.exports = router;
