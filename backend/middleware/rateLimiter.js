const mongoose = require("mongoose");

// Schema for MongoDB sliding window rate limiting
const rateLimitSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    route: { type: String, required: true },
    timestamp: { type: Date, required: true, expires: 60 } // auto TTL sweep in 60 seconds
});
rateLimitSchema.index({ userId: 1, route: 1, timestamp: 1 });

let AIRateLimit;
try {
    AIRateLimit = mongoose.model("AIRateLimit");
} catch (e) {
    AIRateLimit = mongoose.model("AIRateLimit", rateLimitSchema);
}

module.exports = async function aiRateLimiter(req, res, next) {
    const userId = req.userId || req.ip;
    const route = req.originalUrl || req.path;
    
    try {
        const oneMinuteAgo = new Date(Date.now() - 60000);
        
        // Remove old entries inside the current sliding window
        await AIRateLimit.deleteMany({ userId, route, timestamp: { $lt: oneMinuteAgo } });
        
        // Count request timestamps inside the current 60s frame
        const activeRequests = await AIRateLimit.countDocuments({ userId, route });
        if (activeRequests >= 5) {
            return res.status(429).json({
                error: "Rate limit exceeded. You are limited to 5 AI requests per minute.",
                retryAfter: 60
            });
        }
        
        // Record the stamp
        await AIRateLimit.create({ userId, route, timestamp: new Date() });
        next();
    } catch (err) {
        console.error("AI rate limiter fallback error, bypassed:", err);
        next(); // Fail open in production for maximum availability
    }
};
