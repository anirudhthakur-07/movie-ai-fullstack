const crypto = require("crypto");

function verifySlackSignature(req, res, next) {
  let body = req.body;
  if (!body && req.rawBody) {
    try {
      body = JSON.parse(req.rawBody.toString());
    } catch (e) {}
  }

  // Bypass signature validation for Slack's URL verification handshake challenge
  if (body && body.type === "url_verification") {
    req.body = body; // Inject parsed body object back for downstream controller
    return next();
  }

  const signature = req.headers["x-slack-signature"];
  const timestamp = req.headers["x-slack-request-timestamp"];
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signingSecret) {
    console.error("[SLACK SECURITY] Missing SLACK_SIGNING_SECRET in environment");
    return res.status(500).send("Slack configuration missing");
  }

  if (!signature || !timestamp) {
    return res.status(401).send("Unauthorized: Missing headers");
  }

  // Prevent replay attacks (5 minute threshold)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 300) {
    return res.status(401).send("Unauthorized: Replay guard expired");
  }

  const rawBody = req.rawBody ? req.rawBody.toString() : "";
  const sigBaseString = `v0:${timestamp}:${rawBody}`;
  const mySignature = "v0=" + crypto
    .createHmac("sha256", signingSecret)
    .update(sigBaseString, "utf8")
    .digest("hex");

  try {
    const bufA = Buffer.from(mySignature, "utf8");
    const bufB = Buffer.from(signature, "utf8");
    if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
      return next();
    }
  } catch (e) {
    // Fail silently
  }

  console.warn("[SLACK SECURITY] Signature verification failed");
  return res.status(401).send("Unauthorized: Verification failed");
}

module.exports = { verifySlackSignature };
