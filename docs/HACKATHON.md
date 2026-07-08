# 🏆 DARK — Technical Curation Showcase & Hackathon Guide

This document is compiled specifically for technology reviewers and hackathon judges to verify design paradigms, implemented innovations, and requirement mappings.

---

## 📌 1. Executive Summary & Problem Solved
DARK eliminates **streaming fatigue** and generic recommendations. Rather than suggesting popular trending titles, it analyzes user watchlists, searches, and platforms to generate a weighted **Taste DNA** signature and **Persona Archetype**. 

The core user experience is managed by **Nyx**, a conversational, state-aware AI Operating System. Users issue queries (e.g. *"recommend action movies"*) and the platform acts as an orchestrator, dynamically highlighting charts, opening details panels, or initiating trailer overlays without manual clicks.

---

## 🏗️ 2. Architectural Innovation

### Hexagonal Port Modularity
Unlike typical monolithic projects where web and chat layers are coupled, DARK uses a decoupled **Ports & Adapters** design pattern:

*   **Single-Source-of-Truth Orchestration:** The core reasoning, context building, local intent routing, and LLM calls sit inside `nyxOrchestrator.js`.
*   **Decoupled Delivery Clients:** The Web REST APIs and Slack webhook adapters are lightweight presentation channels. They pass user input to the core and format the resulting actions into CSS styling commands or Slack Block Kit components.

---

## 🛡️ 3. SRE Resilience & Defenses

1.  **AI Gateway Model Failovers:** Routes requests through a rotating model list (`gemini-2.0-flash-lite`, `gemini-2.0-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`) with sliding concurrency queues and state-aware circuit breakers to prevent rate blocks.
2.  **NoSQL Sanitization Middleware:** Cleans incoming request keys to prevent query injection attacks.
3.  **Cryptographic Webhook Handlers:** Computes HMAC SHA256 hashes matching request signatures against `SLACK_SIGNING_SECRET` using a timing-safe timingSafeEqual comparator. Enforces a strict 300-second request timestamp replay-protection window.
4.  **Client Session Separation:** Enforces `sessionStorage` session token scopes, isolating session variables to the active tab to prevent cross-tab leaks.

---

## 📊 4. Core Capability Requirement Mapping

### A. Core LLM Reasoning & Prompt Optimization
- **Implemented Logic:** The `aiGateway.js` wrapper handles prompt registries and restricts user contexts using dynamic context templates (`contextBuilder.js`), reducing prompt payload size by over 60%.
- **Verification file:** [`backend/services/AI/aiGateway.js`](file:///c:/Users/Anirudh%20thakur/OneDrive/Desktop/movie-ai-fullstack/backend/services/AI/aiGateway.js)

### B. Workspace Collaboration & Webhooks
- **Implemented Logic:** Implements Bolt listener endpoints validating HMAC signatures. It compiles movie data, synopses, and ratings into rich interactive Slack Block Kit templates.
- **Verification files:** [`backend/slack/slackRoutes.js`](file:///c:/Users/Anirudh%20thakur/OneDrive/Desktop/movie-ai-fullstack/backend/slack/slackRoutes.js) and [`backend/slack/BlockKitBuilder.js`](file:///c:/Users/Anirudh%20thakur/OneDrive/Desktop/movie-ai-fullstack/backend/slack/BlockKitBuilder.js)

### C. Agentic Tool Routing & Planning Loops
- **Implemented Logic:** Gemini returns structured JSON commands binding instructions to frontend actions (e.g. scrolling lists, highlights, trailer modals). Offline intent routes bypass the LLM entirely for basic commands (like redirects) to maximize speeds.
- **Verification files:** [`backend/services/AI/nyxOrchestrator.js`](file:///c:/Users/Anirudh%20thakur/OneDrive/Desktop/movie-ai-fullstack/backend/services/AI/nyxOrchestrator.js) and [`frontend/nyx.js`](file:///c:/Users/Anirudh%20thakur/OneDrive/Desktop/movie-ai-fullstack/frontend/nyx.js)

### D. Analytical Personas & UI Aesthetics
- **Implemented Logic:** Uses Mongo aggregation pipelines (`profileEngine.js`) to weight preferences. The frontend displays custom interactive layouts using notches, safe-area parameters, glassmorphic filters, and level badges.
- **Verification files:** [`backend/services/profileEngine.js`](file:///c:/Users/Anirudh%20thakur/OneDrive/Desktop/movie-ai-fullstack/backend/services/profileEngine.js) and [`frontend/style.css`](file:///c:/Users/Anirudh%20thakur/OneDrive/Desktop/movie-ai-fullstack/frontend/style.css)
