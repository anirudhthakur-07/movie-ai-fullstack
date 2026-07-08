# ⚙️ DARK — Backend System Architecture & Routing

The backend is a Node.js/Express API designed using the **Hexagonal Ports & Adapters** pattern, ensuring the core AI and business services are completely decoupled from delivery interfaces.

---

## 1. Directory to Service Blueprint Mapping

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

## 2. Decoupled Processing Pipeline

This sequence chart visualizes how incoming HTTP Web and Slack events are routed through standard verification layers and the unified AI ports:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web/Slack Client
    participant API as Express Router
    participant Guard as Middleware (JWT/HMAC)
    participant Core as nyxOrchestrator
    participant Context as contextBuilder
    participant DB as MongoDB Atlas
    participant AI as aiGateway (Gemini)

    Client->>API: Post Query / Event
    API->>Guard: Validate Authentication Headers
    alt Authentication Valid
        Guard-->>API: Grant Authorization
        API->>Core: executeNyxQuery(query, userId)
        Core->>Context: buildUserContext(userId)
        Context->>DB: Fetch Watchlist & Taste DNA
        DB-->>Context: Return Profile JSON
        Context-->>Core: Return Context Snippet
        Core->>AI: callLLM(prompt, context)
        AI-->>Core: Return JSON Actions Payload
        Core-->>API: Return Structured Action
        API-->>Client: Respond with UI Modal / Block Kit
    else Authentication Fails
        Guard-->>Client: Return 401 Unauthorized
    end
```

---

## 3. Environment Configurations (`.env`)

Backend keys are managed strictly via system parameters. The following variables are required for system bootstrap:

```ini
# Database & Cryptography Configuration
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dark
JWT_SECRET=your_32_character_signing_key_here

# Cinematic API Proxy Configurations
TMDB_API_KEY=your_themoviedb_org_api_key

# Reasoning Model & Slack Webhooks Configuration
GEMINI_API_KEY=your_google_ai_studio_gemini_key
SLACK_SIGNING_SECRET=your_slack_app_signing_secret
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
```
*Note: Exclude standard configuration files from source control via `.gitignore`.*
