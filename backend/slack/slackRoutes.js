const express = require("express");
const router = express.Router();
const { verifySlackSignature } = require("./slackMiddleware");
const { handleSlackEvent, handleSlackCommand, handleSlackAction } = require("./slackController");

// Main event entry endpoint (handles verification and app mentions)
router.post("/events", verifySlackSignature, handleSlackEvent);

// Command endpoint (handles slash commands /nyx)
router.post("/commands", verifySlackSignature, handleSlackCommand);

// Action endpoints (handles interactive Block Kit clicks)
router.post("/actions", verifySlackSignature, handleSlackAction);

module.exports = router;
