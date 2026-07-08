const { handleEvent } = require("./slackEvents");
const { handleCommand } = require("./slackCommands");

// Controller delegates events, commands, and interactivity events to correct sub-adapters
async function handleSlackEvent(req, res) {
  // Handle Slack URL validation challenge on initial webhook setup
  if (req.body && req.body.type === "url_verification") {
    return res.status(200).send({ challenge: req.body.challenge });
  }

  // Respond immediately back to Slack (under 3s requirement) to prevent retries
  res.status(200).send("ok");

  // Handle incoming event payload asynchronously
  if (req.body && req.body.event) {
    const { event } = req.body;
    try {
      await handleEvent(event);
    } catch (err) {
      console.error("[SLACK CONTROLLER] Event dispatch failed:", err.message);
    }
  }
}

async function handleSlackCommand(req, res) {
  // Respond immediately to prevent timeouts
  res.status(200).send("");

  if (req.body) {
    try {
      await handleCommand(req.body);
    } catch (err) {
      console.error("[SLACK CONTROLLER] Command dispatch failed:", err.message);
    }
  }
}

async function handleSlackAction(req, res) {
  res.status(200).send("");

  if (req.body && req.body.payload) {
    try {
      const payload = JSON.parse(req.body.payload);
      console.log("[SLACK CONTROLLER] Interactive action received:", payload.actions[0]);
    } catch (err) {
      console.error("[SLACK CONTROLLER] Action dispatch failed:", err.message);
    }
  }
}

module.exports = {
  handleSlackEvent,
  handleSlackCommand,
  handleSlackAction
};
