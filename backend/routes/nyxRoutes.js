const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { handleNyxQuery, getNyxLogs } = require("../controllers/nyxController");
const { nyxLimiter } = require("../middleware/nyxRateLimiter");

// Post query message to Nyx OS layer (protected by auth and strictly rate-limited)
router.post("/chat", auth, nyxLimiter, handleNyxQuery);

// Fetch latest metrics/logs of LLM operations (admin-only)
router.get("/logs", auth, adminAuth, getNyxLogs);

module.exports = router;
