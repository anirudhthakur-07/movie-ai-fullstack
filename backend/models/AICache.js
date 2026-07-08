const mongoose = require("mongoose");

const aiCacheSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    watchlistCount: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
});

// Configure MongoDB database auto TTL index trigger
aiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

let AICache;
try {
    AICache = mongoose.model("AICache");
} catch (e) {
    AICache = mongoose.model("AICache", aiCacheSchema);
}

module.exports = AICache;
