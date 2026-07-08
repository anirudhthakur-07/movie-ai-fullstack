# 🤖 DARK — Nyx AI Operating System Architecture

This document explains the cognitive reasoning pipeline, tool execution loops, context management, and rate optimizations built into **Nyx**, the AI Operating System of the **DARK Platform**.

---

## 1. Why Nyx Exists (Concept Architecture)
In traditional recommendation platforms, LLMs act as chatbots—they simply output text that users must read. **Nyx** operates as an **Operating System** for the platform:
- It acts as a tool router: it decides when the user wants to view stats, play trailers, search movies, or highlight charts, and executes those actions directly.
- It acts as a context collector: it compiles dynamic user states (such as clicked platforms and genre DNA) on-the-fly to prevent API context bloat.

---

## 2. Decoupled Reasoning Layers

Nyx coordinates queries through these structural layers:

```
User Query ---> [intentDetector.js] (Offline Classifier) ---> (Matches?)
                                                              /        \
                                                            (Yes)      (No)
                                                            /            \
                                                [Direct Command]    [contextBuilder.js] (Compile User DNA)
                                                                                  │
                                                                                  ▼
                                                                     [aiGateway.js] (Model Rotation)
                                                                                  │
                                                                                  ▼
                                                                     Gemini API Tool Validation
                                                                                  │
                                                                                  ▼
                                                                     JSON Actions Contract output
```

### Layer 1: Conversation & Intent Router
- Pre-scans inputs locally in `intentDetector.js` to catch offline intents (like dashboard redirects or direct searches) and execute them immediately.

### Layer 2: Context Slicing Engine
- Build dynamic context snapshots inside `contextBuilder.js`. Rather than sending full watchlists, it compiles summaries, XP stats, and clicked platforms to minimize token cost.

### Layer 3: Reasoning Gateway
- The gateway `aiGateway.js` implements tools mapping schemas, converting natural language into JSON parameters (e.g. `playTrailer(movieId: 27205)`).

### Layer 4: Response Adapter
- Renders structured outputs. In the web portal, `nyx.js` reads SSE streams, parses JSON, and triggers animations. In Slack, `BlockKitBuilder.js` translates parameters into rich interactive cards.

---

## 3. Resiliency Gateway & Token Optimization

### Priority Model Rotation
If a model fails due to rate limits or API latency, the gateway automatically rotates through the fallback pool:
1. `gemini-2.0-flash-lite` (Default - optimized for speed and cost)
2. `gemini-2.0-flash`
3. `gemini-3.1-flash-lite`
4. `gemini-2.5-flash`

### Optimization Performance Metrics

| Optimization Area | Logic Strategy | Token Impact |
| :--- | :--- | :--- |
| **History Pruning** | Serializes only the last 5 conversation turns. | Reduces context size by ~50%. |
| **Watchlist Compression** | Converts array objects to computed genre percentages. | Reduces payload size by ~60%. |
| **Cached Query Hashing** | Direct match lookup on identical profile inputs. | 100% token savings on cache hits. |

---

## 4. MCP & Future Integration Roadmap

- [ ] **MCP (Model Context Protocol) Server (In Progress):** Additive adapter exposing Taste DNA metrics as tools, allowing external desktop AI clients (like Claude Desktop) to connect.
- [ ] **Multi-Model Provider Gateway (Planned):** Expand the client proxy class in `aiGateway.js` to dynamically route requests to Qwen Cloud or Llama models.
