# 🛡️ DARK AI Platform — Security Manual

This document details the enterprise security guardrails, authentication protocols, and threat-mitigation layers engineered into the **DARK AI Movie Curation Platform**. 

---

## 1. Authentication & Session Isolation

### Stateless JWT Guards
- **Mechanics:** User authentication relies on secure JSON Web Tokens (JWT) signed with the server's `JWT_SECRET` using the `HS256` hashing algorithm.
- **Cross-Domain Verification:** Tokens are transmitted via secure cookies or fall back to the standard HTTP `Authorization: Bearer <token>` header for headless API calls.

### Client-Side Session Isolation
- **Scope:** Tokens are loaded into `sessionStorage` in the user's browser.
- **Vulnerability Defense:** Unlike `localStorage` (which is persistent across all tabs), `sessionStorage` scope is restricted exclusively to the active tab. This prevents session hijacking if a user navigates to a malicious tab in the same browser session.

---

## 2. API Gateways & Request Defense

### Dynamic Rate Limiting
- **Global API Limiter:** Standard REST routes are protected by a sliding-window rate limiter restricting IPs to `100 requests per 15 minutes`.
- **Sensitive Route Limiter:** Authentication routes (`/login`, `/register`) and critical endpoints (`/watchlist`, `/analytics`) enforce stricter thresholds to block brute-force and credential-stuffing actions.

### Injection & Query Sanitization
- **NoSQL Injection Defense:** All incoming request bodies and query parameters are parsed through a Mongo Sanitization middleware (`express-mongo-sanitize`), stripping out operators beginning with `$` or `.` to prevent raw query injections.
- **HTTP Header Armor:** The backend utilizes `helmet` to configure secure HTTP headers (e.g., blocking MIME sniffing, clickjacking via frameguard, and cross-site scripting filters).

---

## 3. Cryptographic Webhook Security (Slack Adapter)

To secure the open endpoints that Slack communicates with, the backend enforces cryptographic validations:

```
+---------------+           [HTTP POST with Headers]           +------------------+
| Slack Server  | ───────────────────────────────────────────> |  DARK Backend    |
+---------------+                                              +--------┬---------+
                                                                        |
                                                 [Extract Signature & Timestamp]
                                                                        v
                                                 [Check Timestamp: > 5 min old?]
                                                  /                           \
                                               (Yes)                          (No)
                                                /                               \
                                               v                                 v
                                      [Reject Request 401]            [HmacSHA256 Hash]
                                                                                |
                                                                                v
                                                                   [timingSafeEqual Match?]
                                                                    /                    \
                                                                 (Yes)                   (No)
                                                                  /                        \
                                                                 v                          v
                                                           [Authorize 200]        [Reject Request 401]
```

1. **Replay-Attack Protection:** Enforces a strictly validated epoch request window. If the difference between the timestamp in header `x-slack-request-timestamp` and the server's current time exceeds `300 seconds` (5 minutes), the request is rejected immediately.
2. **HMAC SHA256 Signature Verification:** A secure hash is computed using the raw request body bytes, request timestamp, and `SLACK_SIGNING_SECRET`:
   `SignatureBase = v0:${timestamp}:${rawBody}`
3. **Timing-Attack Mitigation:** The computed hash is compared to the incoming `x-slack-signature` header using Node's `crypto.timingSafeEqual` buffer comparator, neutralizing signature-guessing attacks based on response duration differences.

---

## 4. LLM Prompt Isolation & Gateways

Nyx protects external LLM APIs (Gemini) by acting as an intermediary proxy wrapper:
- **Zero API Leakage:** The client never makes direct requests to Gemini, meaning API keys and prompt registries are stored exclusively on the secure backend.
- **Input Sanitization:** User requests are filtered locally using regular expression filters before entering the prompt compiler to prevent prompt-injection hacks designed to bypass the platform's persona boundaries.
- **Structured JSON Contracts:** The AI Gateway validates all model outputs against fixed JSON schemas. If the model generates malformed code or non-JSON payloads, the gateway intercepts it and falls back to a clean localized response.
