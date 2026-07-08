# 🎬 DARK — Enterprise-Grade Multi-Channel AI Movie Intelligence Platform

DARK is an advanced, production-ready AI Movie Curation & Taste Intelligence Platform. Designed with a decoupled Hexagonal Ports & Adapters architecture, it powers multiple interaction interfaces—a gamified glassmorphic web portal and a collaborative Slack workspace adapter—using a single source of truth AI reasoning orchestrator.

DARK is built for submission to multiple international hackathons:
*   **Code with Gemini API Challenge:** Optimization, resilience, model rotation, and caching.
*   **Slack Agent Builder Challenge:** Interactive Block Kit layouts, verified webhooks, and workspace linking.
*   **Agentic AI Innovation Challenge:** Schema-driven tool execution and dynamic context slicing.
*   **Next Byte Hacks / Hack The Limit:** Hexagonal architecture, modular DevSecOps, SRE resiliency patterns, and clean code.
*   **Aethera / LUMA Hacks:** Taste DNA personas, visual dashboard analytics, and premium dark aesthetics.

---

## 🔗 Live Deployments
*   **Web Dashboard App:** [https://movie-ai-fullstack.vercel.app](https://movie-ai-fullstack.vercel.app)
*   **Production API Server:** [https://movie-ai-backend-ql2a.onrender.com](https://movie-ai-backend-ql2a.onrender.com)
*   **Slack Integration Webhook:** `https://movie-ai-backend-ql2a.onrender.com/api/slack/events`

---

## 🏗️ Decoupled Hexagonal Architecture (Ports & Adapters)

DARK separates core movie intelligence domain services from integration delivery adapters (Express Web APIs, Slack Webhook listeners, future Discord/Mobile clients).

```text
                     +---------------------------------------+
                     |             Incoming Channels         |
                     +-------------------+-------------------+
                                         |
                       [Web HTTPS / SSE] | [Slack events/commands]
                                         v
                     +-------------------+-------------------+
                     |         Controllers / Adapters        |
                     |  (nyxController.js / slackAdapter.js) |
                     +-------------------+-------------------+
                                         |
                                         v
                     +-------------------+-------------------+
                     |               Nyx Port                |
                     |      (nyxOrchestrator.js)             |
                     +-------------------+-------------------+
                                         |
     +-------------------+---------------+---------------+-------------------+
     |                   |                               |                   |
     v                   v                               v                   v
+----+----+     +--------+--------+             +--------+--------+     +----+----+
| Intent  |     | Context Builder |             |   AI Gateway    |     | Cache   |
| Router  |     |   (Taste DNA)   |             | (Gemini/Tokens) |     | Service |
+---------+     +-----------------+             +-----------------+     +---------+
```

*   **Nyx Core Orchestrator:** The single brain (`nyxOrchestrator.js`) that processes natural language queries, resolves local intents, builds context snapshots, calls the LLM, and returns structured commands.
*   **Thin Adapters:** Express API routes (`nyxRoutes.js`) and Slack Bolt webhooks (`slackRoutes.js`) contain zero business logic. They simply pass queries to the Core and translate the structured response into HTML modals or Slack Block Kit layouts.

---

## 🤖 Gemini API Optimization & Resiliency Gateway

DARK features a custom, high-end SRE AI Gateway (`aiGateway.js`) designed to optimize rate usage and defend against API disruptions:
1. **Model Rotation List:** Loops dynamically through a priority list (`gemini-2.0-flash-lite`, `gemini-2.0-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`) based on error status and rate limits.
2. **Circuit Breaker:** Implements a sliding-window failure monitor that temporarily opens the circuit to protect backend services if the Gemini API goes down.
3. **Priority Concurrency Queue:** Throttles concurrent API requests to prevent HTTP `429 Too Many Requests` status blocks on the free tier.
4. **Local Response Caching:** Avoids redundant LLM invocations by caching query responses for identical user profiles.
5. **Observability Log Aggregator:** Track metrics (prompt sizes, response tokens, token cost, API latency) in a structured metrics logger (`aiLogger.js`).

---

## ⚡ Agentic Tool-Use & Planning Engine

Nyx maps user instructions directly to functional platform capabilities using Gemini native Tool/Function Declarations:
*   **Structural Commands:** When a user queries `"open my watchlist"` or `"search interstellar"`, the model responds with structured commands (e.g. `navigate(target: "watchlist")` or `searchMovie(query: "interstellar")`).
*   **Dynamic UI Handlers:** The frontend controller parses the structured response and triggers responsive UI changes (smooth scrolling to grids, launching trailer modal players, or highlighting dashboard charts).
*   **Context Slicing Engine:** Assembles a compressed snapshot of the user's active Taste DNA, unlocking milestones, and history so the LLM has zero redundant context, minimizing token sizes.

---

## 💬 Slack Collaborative Workspace Adapter

DARK includes a complete enterprise Slack integration located inside the [backend/slack/](file:///c:/Users/Anirudh%20thakur/OneDrive/Desktop/movie-ai-fullstack/backend/slack/) folder:
*   **Webhook Endpoints:** Handles Slack `app_mention` events and `/nyx` slash commands.
*   **Secure Signature Verification:** Cryptographic HMAC SHA256 request validator defends against replay attacks by enforcing a 5-minute request timestamp window.
*   **Raw Body Capture:** Express JSON and Urlencoded parsers utilize raw buffer hooks to preserve request signatures.
*   **Block Kit Builder:** Generates premium visual Slack components with movie poster images, ratings, YouTube trailers, and links to the web app dashboard.
*   **Tenant Mapping:** Links Slack member IDs to local MongoDB profile documents.

---

## ✨ Primary Platform Capabilities

### 🔐 Authentication & Security
- stateless session tracking with JWT and securely hashed passwords.
- Input sanitization blocks NoSQL injection attacks, and `helmet` guards HTTP headers.

### 🏆 Gamification & Avatars
- **User XP & Leveling:** Experience points awarded dynamically for user interactions (searches, profile views, provider clicks).
- **Achievements System:** 11 unlockable badges tracking progress (e.g. *Collector*, *Genre Explorer*, *Cinephile*).
- **Custom Avatars:** 40 custom, persona-mapped profile avatars unlocked based on user levels.

### 📊 Curation & Analytics Dashboard
- **Movie DNA Mapping:** Analyzes user search histories and genre preferences into weighted taste scores.
- **Provider Analytics:** Displays your favorite genre and OTT platform with live `Chart.js` rendering.
- **Self-Healing Metadata:** Background service automatically checks and restores missing genre tags on load.

---

## 📂 Project Structure

```text
movie-ai-fullstack/
├── backend/
│   ├── server.js               # Express bootstrap with verify parser hooks
│   ├── models/                 # MongoDB schemas (User, Click, Movie)
│   ├── controllers/            # Web query controllers
│   ├── routes/                 # API route mapping
│   │
│   ├── services/AI/            # Core AI OS Layer (The Nyx Brain)
│   │   ├── aiGateway.js        # Model rotation, circuit breaker, tools schema
│   │   ├── nyxOrchestrator.js  # Unified hexagonal query orchestrator
│   │   ├── contextBuilder.js   # Taste DNA context slicing
│   │   ├── intentDetector.js   # Offline regex intent classification
│   │   ├── promptRegistry.js   # Dynamic system prompt modules
│   │   └── aiLogger.js         # Telemetry metrics aggregator
│   │
│   └── slack/                  # Slack Adapter Layer
│       ├── slackRoutes.js      # Verified slack webhook paths
│       ├── slackMiddleware.js  # HMAC SHA256 verification middleware
│       ├── slackHelpers.js     # Dispatcher connecting Slack to Nyx core
│       └── BlockKitBuilder.js  # Presenter mapping JSON to Slack UI
│
└── frontend/                   # Vite / Vanilla frontend Client
    ├── index.html              # Glassmorphic discovery viewport
    ├── nyx.js                  # Frontend floating chat widget (SSE reader)
    ├── script.js               # Carousel loaders and search methods
    └── style.css               # notched safe-area mobile styles
```

---

## 🚀 Installation & Local Development

### 1. Backend Setup
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
3. Configure `backend/.env`:
   - `MONGO_URI`: MongoDB connection string.
   - `JWT_SECRET`: A secure session signing key.
   - `TMDB_API_KEY`: API key from [themoviedb.org](https://www.themoviedb.org).
   - `GEMINI_API_KEY`: API key from Google AI Studio.
   - `SLACK_SIGNING_SECRET` & `SLACK_BOT_TOKEN`: Keys from Slack Developer Console.
4. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Open `frontend/config.js` and set your API base:
   ```javascript
   const API_BASE = "http://localhost:5000/api";
   ```
2. Serve the `frontend/` folder locally:
   ```bash
   cd ../frontend
   npx serve -l 3000
   ```
