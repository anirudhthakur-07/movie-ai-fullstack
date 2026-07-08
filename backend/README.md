# ⚙️ DARK — Backend Services & AI Core Manual

This directory contains the secure Express API, MongoDB Atlas database schemas, and AI integration services for the **DARK AI Platform**.

---

## 📌 Table of Contents
1. [Ports & Adapters Execution Boundary](#1-ports--adapters-execution-boundary)
2. [Directory to Service Blueprint Mapping](#2-directory-to-service-blueprint-mapping)
3. [The Nyx Orchestration Engine](#3-the-nyx-orchestration-engine)
4. [Secure API Gateways & Request Defense](#4-secure-api-gateways--request-defense)
5. [Slack adapter Channel Adapter](#5-slack-adapter-channel-adapter)
6. [Monitoring & Logging](#6-monitoring--logging)
7. [Development Guidelines](#7-development-guidelines)

---

## 1. Ports & Adapters Execution Boundary

To prevent logic duplication, all interfaces (Web HTTPS, SSE streaming, and Slack webhooks) invoke the centralized orchestrator:

```text
Incoming Request -> [Interface Adapter] -> nyxOrchestrator.js -> [Context Engine] -> AIGateway
```

- **Web (Non-Streaming):** Calls `executeNyxQuery()` and returns JSON.
- **Web (Streaming SSE):** Bypasses the static orchestrator to stream raw text chunks via `callLLMStream` directly to the Express response stream.
- **Slack (Slash / Mentions):** Calls `executeNyxQuery()` via `slackHelpers.js`, then translates the output into Slack Block Kit payload formats.

---

## 2. Directory to Service Blueprint Mapping

| Directory / File | Design Pattern | System Responsibility |
| :--- | :--- | :--- |
| **`server.js`** | Bootstrap | Express configuration, Helmet security headers, raw body verify parsers, and route mounts. |
| **`models/User.js`** | Domain Model | User authentication states, watchlists, and computed leveling/XP. |
| **`models/Movie.js`** | Caching | TMDb details cache featuring an automatic **15-day TTL expiry index**. |
| **`services/AI/nyxOrchestrator.js`** | Orchestrator Port | Central entry point coordinate reasoning loops for all interfaces. |
| **`services/AI/aiGateway.js`** | Gateway Adapter | Gemini API rotating fallback list, request queues, and circuit breakers. |
| **`slack/slackMiddleware.js`** | Security Filter | HMAC SHA256 signature verification and request timestamp checks. |
| **`slack/BlockKitBuilder.js`** | Presenter | Maps JSON tool results to interactive Slack Block Kit cards. |

---

## 3. The Nyx Orchestration Engine

The centralized cognitive reasoning engine is structured under [backend/services/AI/](file:///c:/Users/Anirudh%20thakur/OneDrive/Desktop/movie-ai-fullstack/backend/services/AI/):
1. **Local Intent Detector (`intentDetector.js`):** Parses user input using fast offline regular expressions to intercept commands that do not require LLM calls.
2. **Context Engine (`contextBuilder.js`):** Assembles a sliced JSON snapshot of the user's active Profile DNA, Watchlist metrics, and clicked platforms.
3. **Resilient AI Gateway (`aiGateway.js`):** Connects to the Generative Model, presenting tool definitions and managing rate rotation lists and circuit breakers.
4. **Caching Layer (`cacheService.js`):** Saves processed semantic responses for identical user profiles.

---

## 4. Secure API Gateways & Request Defense

*   **Stateless JWT Security:** Generates signed JWTs (`HS256`) on authentication. Middleware parses these tokens from secure cookies or `Authorization` headers.
*   **NoSQL Injection Defense:** All body, query, and parameter payloads are passed through sanitization middleware to filter operators containing `$` or `.`.
*   **Dual-Parser Raw Buffer Capture:** Express parsers capture raw body bytes to allow HMAC signature verification:
    ```javascript
    app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
    app.use(express.urlencoded({ extended: true, verify: (req, res, buf) => { req.rawBody = buf; } }));
    ```

---

## 5. Slack Adapter Channel Adapter

The Slack integration adapter translates events and command inputs:
- **Signature verification:** Enforces an epoch threshold of 300 seconds and verifies payload integrity against the `SLACK_SIGNING_SECRET` using `crypto.timingSafeEqual`.
- **Slash Commands:** Handled asynchronously via `/nyx`. Resolves user profile mappings and queries the central Nyx Orchestrator.
- **Block Kit Presenter:** Compiles structured JSON tools results into premium Slack layouts with trailers, genres, ratings, and web links.

---

## 6. Monitoring & Logging

- **Telemetry Aggregator (`aiLogger.js`):** Logs request latencies, cache metrics, prompt sizes, and token lengths to a centralized in-memory log stack.
- **Circuit Breaker state:** Track system failures to temporarily route queries to fallback handlers if external API latency spikes.

---

## 7. Development Guidelines

1. **Strict Core Contract:** Never write database models or raw queries directly inside Slack adapter components. Always invoke domain services.
2. **Environment Isolation:** Place all secrets in the server configuration parameters. Do **not** commit `.env` to repository history.
3. **Hexagonal Boundaries:** When exposing new capabilities (e.g. watchlist tags), register them under the unified orchestrator so all adapters inherit the capability.
