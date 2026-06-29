// BEHAVIOR EVENT MODEL
// Unified behavioral event store for the intelligence engine.
// Captures weighted user interactions beyond provider clicks.
// TTL: 30 days (same as ProviderClick and SearchHistory)

const mongoose = require("mongoose");

// Allowed event types and their canonical weights
const EVENT_WEIGHTS = {
    movie_detail:   40,   // User opened movie details — active exploration
    trailer_watch:  60,   // User played trailer — visual commitment
    watchlist_add:  75    // User added to watchlist — strong curation intent
};

const behaviorEventSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // One of: movie_detail | trailer_watch | watchlist_add
    eventType: {
        type: String,
        enum: Object.keys(EVENT_WEIGHTS),
        required: true
    },

    movieId: {
        type: Number,
        required: true
    },

    movieTitle: {
        type: String,
        trim: true,
        maxlength: 120
    },

    // Primary genre (lowercase) — used for DNA + persona weighting
    genre: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 40
    },

    // Canonical weight baked in at write time for fast aggregation reads
    weight: {
        type: Number,
        required: true
    },

    recordedAt: {
        type: Date,
        default: Date.now,
        // Auto-delete after 30 days — same policy as ProviderClick
        expires: 60 * 60 * 24 * 30
    }

});

// Primary query index: all events for a user, newest first
behaviorEventSchema.index({ userId: 1, recordedAt: -1 });

// Secondary index: genre aggregation queries
behaviorEventSchema.index({ userId: 1, genre: 1 });

// Export weights so routes can import them without re-declaring
behaviorEventSchema.statics.EVENT_WEIGHTS = EVENT_WEIGHTS;

module.exports = mongoose.model("BehaviorEvent", behaviorEventSchema);
