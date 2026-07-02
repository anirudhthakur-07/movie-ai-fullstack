const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { handleNyxQuery, getNyxLogs } = require("../controllers/nyxController");

// Post query message to Nyx OS layer
router.post("/chat", auth, handleNyxQuery);

// Fetch latest metrics/logs of LLM operations
router.get("/logs", auth, getNyxLogs);

module.exports = router;
