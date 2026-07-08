# ⚙️ DARK — Backend Services Manual

This directory contains the secure Express API, MongoDB Atlas schemas, and AI integration services for the **DARK AI Platform**.

---

## 1. Directory Blueprint & Service Mapping

- **`server.js`:** Express bootstrap file. Configures security headers (Helmet), CORS, JSON raw body capture hooks, rate limiters, and mounts routers.
- **`models/`:** MongoDB data models:
  - `User.js`: User profiles, credentials, watchlist elements, and levels/XP metrics.
  - `Movie.js`: Temporary metadata cache with a **15-day TTL index** to avoid redundant TMDB requests.
  - `ProviderClick.js`: Analytics events tracking provider click frequencies.
  - `SearchHistory.js`: User query history records.
  - `BehaviorEvent.js`: XP interaction points configuration weights.
- **`routes/`:** Routing controllers validating tokens via JWT middleware:
  - `authRoutes.js`: Login, signup, and profile bootstrapping.
  - `movieRoutes.js`: TMDb proxy router.
  - `watchlistRoutes.js`: CRUD endpoints managing saved watchlists.
  - `analyticsRoutes.js`: Aggregation queries for user charts.
- **`services/AI/`:** Core AI OS domain (The Nyx Brain):
  - `aiGateway.js`: Gemini failover model list, Priority concurrency queue, and circuit breakers.
  - `nyxOrchestrator.js`: Hexagonal query orchestrator.
  - `contextBuilder.js`: Compiles user profiles, watchlist count, and recent clicks into dynamic context snippets.
  - `intentDetector.js`: Local regex classification routing.
- **`slack/`:** Slack Integration:
  - `slackRoutes.js`: Endpoint routes.
  - `slackMiddleware.js`: HMAC SHA256 cryptographic signature validator.
  - `slackHelpers.js`: Bridge connecting Slack events to `nyxOrchestrator.js`.
  - `BlockKitBuilder.js`: Presenter mapping JSON payloads to Slack UI cards.

---

## 2. Ports & Adapters Execution Boundary

To prevent logic duplication, all interfaces (Web HTTPS, SSE streaming, and Slack webhooks) invoke the centralized orchestrator:

```text
Incoming Request -> [Interface Adapter] -> nyxOrchestrator.js -> [Context Engine] -> AIGateway
```

- **Web (Non-Streaming):** Calls `executeNyxQuery()` and returns JSON.
- **Web (Streaming SSE):** Bypasses the static orchestrator to stream raw text chunks via `callLLMStream` directly to the Express response stream.
- **Slack (Slash / Mentions):** Calls `executeNyxQuery()` via `slackHelpers.js`, then translates the output into Slack Block Kit payload formats.

---

## 3. Secure Environment Guidelines

Environment keys are strictly maintained on the hosting server (Render) and are **never** committed to Git. A `.env.example` file is included in this folder as a structural template.

### Critical Keys:
- `MONGO_URI`: Atlas connection string.
- `JWT_SECRET`: Signing secret for token cryptography.
- `TMDB_API_KEY`: API key for movie metadata proxies.
- `GEMINI_API_KEY`: Key for LLM reasoning models.
- `SLACK_SIGNING_SECRET` & `SLACK_BOT_TOKEN`: Keys for verifying webhook requests.
