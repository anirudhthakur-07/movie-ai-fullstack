const express = require("express");
const router = express.Router();
const { verifySlackSignature } = require("./slackMiddleware");
const { handleSlackEvent, handleSlackCommand, handleSlackAction } = require("./slackController");

// Main event entry endpoint (handles verification and app mentions)
router.post("/events", (req, res, next) => {
  if (req.body && req.body.type === "url_verification") {
    return res.status(200).contentType("text/plain").send(req.body.challenge);
  }
  if (req.rawBody) {
    try {
      const parsed = JSON.parse(req.rawBody.toString());
      if (parsed && parsed.type === "url_verification") {
        return res.status(200).contentType("text/plain").send(parsed.challenge);
      }
    } catch (e) {}
  }
  next();
}, verifySlackSignature, handleSlackEvent);

// Command endpoint (handles slash commands /nyx)
router.post("/commands", verifySlackSignature, handleSlackCommand);

// Action endpoints (handles interactive Block Kit clicks)
router.post("/actions", verifySlackSignature, handleSlackAction);

module.exports = router;
