# 🏗️ DARK — Software Architecture

This document details the software architecture, design patterns, folder structure, and request lifecycles of the **DARK AI Movie Intelligence Platform**.

---

## 1. High-Level Architecture (Hexagonal Diagram)

DARK is designed using a decoupled **Hexagonal Ports & Adapters** architecture. Rather than coupling user interfaces (Web browser, Slack, API platforms) with our core taste calculation engines, all clients interact with the core domain via designated port orchestrators.

```mermaid
graph TB
    subgraph UI_Adapters [Interface Adapter Layer]
        A[Vite/Vanilla Web Client]
        B[Slack Webhook Adapter]
    end

    subgraph Core_Orchestrator [AI Port Orchestrator]
        C[nyxOrchestrator.js]
    end

    subgraph Domain_Services [Domain Services Layer]
        D[intentDetector.js]
        E[contextBuilder.js]
        F[aiGateway.js]
        G[cacheService.js]
        H[profileEngine.js]
        I[tmdbService.js]
    end

    subgraph Data_Storage [Persistent Data Layers]
        J[(MongoDB Atlas)]
        K[TMDb API Proxy]
        L[Gemini API Suite]
    end

    A -->|HTTP / SSE Requests| C
    B -->|Webhook / Command Events| C
    C -->|Classify Intent| D
    C -->|Slice Taste DNA Context| E
    C -->|Query Cache| G
    C -->|Execute LLM Logic| F
    E -->|Aggregate Profile Clicks| H
    F -->|Failover Request Queue| L
    H -->|Save Profile DNA| J
    I -->|Fetch Metadata| K
```

---

## 2. Directory Layout & Layer Mapping

```text
movie-ai-fullstack/
├── backend/                    # Domain Core & API Gateways
│   ├── config/                 # Service client boots (TMDB client)
│   ├── middleware/             # JWT auth filters & Express security blocks
│   ├── models/                 # MongoDB Mongoose schemas
│   ├── routes/                 # Express API endpoint router files
│   ├── services/AI/            # Core AI OS Layer (The Nyx Brain)
│   └── slack/                  # Slack bolt webhook adapter routes
│
└── frontend/                   # Interface client layouts
    ├── index.html              # Discovery row dashboards
    ├── nyx.js                  # SSE chat widget reader
    └── style.css               # notched safe-area mobile style tokens
```

---

## 3. End-to-End Request Lifecycle

This sequence flowchart shows how incoming requests traverse authentication guards, intent routers, and the central AI port to return structured JSON actions:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web/Slack Client
    participant Router as Express API
    participant Guard as JWT/HMAC Guard
    participant Core as nyxOrchestrator
    participant Context as contextBuilder
    participant DB as MongoDB Atlas
    participant AI as aiGateway

    Client->>Router: Send query or event
    Router->>Guard: Verify session signature / token
    alt Authorization Valid
        Guard-->>Router: Grant Access
        Router->>Core: executeNyxQuery(query, userId)
        Core->>Core: detectLocalIntent()
        alt Local Intent Matched (e.g. Navigation)
            Core-->>Router: Return Direct Action JSON
        else Ambiguous / Reasoning Required
            Core->>Context: buildUserContext(userId)
            Context->>DB: Fetch Watchlist & Taste DNA Metrics
            DB-->>Context: Return User Profile Document
            Context-->>Core: Return Context String
            Core->>AI: callLLM(prompt, context)
            AI-->>Core: Return JSON Actions Payload
            Core-->>Router: Return Structured Action Response
        end
        Router-->>Client: Dispatch response (Web UI / Slack Block Kit)
    else Authorization Invalid
        Guard-->>Client: Return 401 Unauthorized
    end
```

---

## 4. Extension & Integration Ports

- **Model Agnostic Adapter:** The interface inside `aiGateway.js` separates prompt construction from model execution. Future models (e.g., Qwen, Llama, Claude) can plug into the rotating list without modifying prompt logic.
- **Client Presentation Adapter:** Additive channels (e.g., Discord or Teams webhooks) can be created by copying the Slack structure: capture incoming webhook events, pass query to `nyxOrchestrator`, and map JSON results to client UI formats.
