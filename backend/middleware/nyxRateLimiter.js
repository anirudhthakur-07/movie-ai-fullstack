const rateLimit = require("express-rate-limit");

// Cooldown rate limiter specifically designed for the Nyx AI Operating System
const nyxLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 5, // Strict limit of 5 requests per minute per user/IP
  handler: (req, res) => {
    // Return structured JSON matching the Nyx warning schema to handle it gracefully in the UI
    res.status(429).json({
      type: "warning",
      message: "The archive is calibrating. You are querying the shadows too rapidly. Please wait a minute.",
      actions: []
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { nyxLimiter };
