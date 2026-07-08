const mongoose = require("mongoose");

const aiLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    userId: { type: String, index: true },
    intent: { type: String, required: true },
    modelUsed: { type: String, default: "local" },
    promptLength: { type: Number, default: 0 },
    completionLength: { type: Number, default: 0 },
    tokens: {
        prompt: { type: Number, default: 0 },
        response: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    latency: { type: Number, required: true }, // total elapsed milliseconds
    cacheHit: { type: Boolean, default: false },
    success: { type: Boolean, default: true },
    fallbackUsed: { type: Boolean, default: false },
    errorType: { type: String, default: null }
});

aiLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model("AILog", aiLogSchema);
