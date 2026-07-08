const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

// 1. Load environment variables from backend/.env
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// 2. Validate required variables are present
const requiredEnv = ["MONGO_URI", "JWT_SECRET", "TMDB_API_KEY", "SLACK_SIGNING_SECRET"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`TEST FATAL: Missing required env var: ${key}`);
    process.exit(1);
  }
}

// 3. Configure test port to prevent EADDRINUSE conflict with live servers
const TEST_PORT = 5099;
process.env.PORT = TEST_PORT;

console.log("[TEST RUNNER] Starting test server instance on port 5099...");
require("../server.js");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log("\n[TEST RUNNER] Waiting for database and server to initialize...");
  
  // Poll for MongoDB readiness instead of a static sleep
  const maxWait = 15000;
  const start = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - start > maxWait) {
      console.error("[TEST FATAL] MongoDB did not connect within 15 seconds.");
      process.exit(1);
    }
    await sleep(500);
  }
  console.log(`[TEST RUNNER] MongoDB ready after ${Date.now() - start}ms.`);

  const testUser = {
    username: "test_verify_" + Date.now(),
    password: "test_password_123",
    gender: "male"
  };

  let jwtToken = "";

  try {
    // -------------------------------------------------------------
    // STEP 1: TEST USER REGISTRATION
    // -------------------------------------------------------------
    console.log("\n[TEST] 1. Registering test user...");
    const regRes = await fetch(`http://localhost:${TEST_PORT}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser)
    });
    
    const regData = await regRes.json();
    console.log(`[TEST] Registration status: ${regRes.status}`, regData);
    if (regRes.status !== 200 && regRes.status !== 400) {
      throw new Error(`Registration failed with status ${regRes.status}: ${JSON.stringify(regData)}`);
    }

    // -------------------------------------------------------------
    // STEP 2: TEST USER LOGIN
    // -------------------------------------------------------------
    console.log("\n[TEST] 2. Logging in test user...");
    const loginRes = await fetch(`http://localhost:${TEST_PORT}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });
    
    const loginData = await loginRes.json();
    console.log(`[TEST] Login status: ${loginRes.status}`);
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    jwtToken = loginData.token;
    console.log("[TEST] JWT token successfully retrieved.");

    // -------------------------------------------------------------
    // STEP 3: TEST NYX STREAMING ROUTE & REASONING TRACES
    // -------------------------------------------------------------
    console.log("\n[TEST] 3. Querying Nyx Chat Stream...");
    const chatRes = await fetch(`http://localhost:${TEST_PORT}/api/nyx/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        query: "Recommend some high-end sci-fi movies",
        stream: true
      })
    });

    console.log(`[TEST] Stream endpoint status: ${chatRes.status}`);
    if (chatRes.status !== 200) {
      throw new Error(`Chat stream failed with status ${chatRes.status}`);
    }

    const reader = chatRes.body.getReader();
    const decoder = new TextDecoder();
    let streamText = "";
    let finished = false;
    let reasoningFound = false;

    while (!finished) {
      const { value, done } = await reader.read();
      if (done) {
        finished = true;
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      streamText += chunk;
      if (chunk.includes("[Reasoning:")) {
        reasoningFound = true;
      }
    }

    console.log(`[TEST] Stream reading finished.`);
    console.log(`[TEST] Has reasoning steps: ${reasoningFound ? "✅ PASSED" : "❌ FAILED"}`);
    if (!reasoningFound) {
      throw new Error("Reasoning trace was not found in the SSE stream!");
    }

    // -------------------------------------------------------------
    // STEP 4: TEST SLACK WEBHOOK SIGNATURE (BOLT ROUTE)
    // -------------------------------------------------------------
    console.log("\n[TEST] 4. Testing Slack Signature Verification Middleware...");
    const slackPayload = JSON.stringify({
      token: "test_token_verification",
      team_id: "T_TEST_123",
      api_app_id: "A_TEST_123",
      type: "event_callback",
      event: {
        type: "app_mention",
        text: "<@U_BOT_123> recommend action movies",
        user: "U_USER_123",
        channel: "C_TEST_123"
      }
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const sigBase = `v0:${timestamp}:${slackPayload}`;
    const validSignature = "v0=" + crypto
      .createHmac("sha256", process.env.SLACK_SIGNING_SECRET)
      .update(sigBase)
      .digest("hex");

    // A. Verify with valid signature (should verify HMAC properly)
    console.log("[TEST] A. Submitting mock Slack command with VALID signature...");
    const slackValRes = await fetch(`http://localhost:${TEST_PORT}/api/slack/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-slack-request-timestamp": String(timestamp),
        "x-slack-signature": validSignature
      },
      body: slackPayload
    });
    console.log(`[TEST] Valid signature status response: ${slackValRes.status} (Expected: 200 or 404/500 if Slack APIs are offline, but not 401)`);
    if (slackValRes.status === 401) {
      throw new Error("Valid Slack signature was rejected with 401 Unauthorized!");
    }
    console.log("[TEST] Valid Slack signature accepted successfully.");

    // B. Verify with invalid signature (should block with 401)
    console.log("[TEST] B. Submitting mock Slack command with INVALID signature...");
    const slackInvalRes = await fetch(`http://localhost:${TEST_PORT}/api/slack/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-slack-request-timestamp": String(timestamp),
        "x-slack-signature": "v0=invalid_hex_signature_here"
      },
      body: slackPayload
    });
    console.log(`[TEST] Invalid signature status response: ${slackInvalRes.status} (Expected: 401)`);
    if (slackInvalRes.status !== 401) {
      throw new Error(`Invalid Slack signature was NOT blocked (Status: ${slackInvalRes.status})!`);
    }
    console.log("[TEST] Invalid Slack signature successfully blocked (401 Unauthorized). ✅ PASSED");

    // -------------------------------------------------------------
    // DATABASE CLEANUP
    // -------------------------------------------------------------
    console.log("\n[TEST] Cleaning up test data from MongoDB...");
    const User = mongoose.model("User");
    const cleanupResult = await User.deleteOne({ username: testUser.username });
    console.log(`[TEST] Deleted test user. Count: ${cleanupResult.deletedCount}`);

    console.log("\n⭐️ ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ⭐️");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED:", error.message);
    
    // Attempt database cleanup even on failure
    try {
      const User = mongoose.model("User");
      await User.deleteOne({ username: testUser.username });
      console.log("[TEST] Cleanup completed after failure.");
    } catch (e) { /* silent */ }
    
    process.exit(1);
  }
}

runTests();
