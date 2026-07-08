# 🛡️ DARK AI Platform — Security Architecture

This document outlines the security controls, validation middlewares, and threat mitigation layers implemented on the **DARK AI Movie Platform**.

---

## 1. Authentication & Session Security

### stateless JSON Web Tokens
- **Mechanism:** User sessions are managed via JWTs signed with `HS256`. 
- **Header Guards:** Protected API routes require the standard `Authorization: Bearer <token>` header, verified via the `auth.js` middleware.

### Browser Session Separation
- **Tab-Scoped Session:** Tokens are stored exclusively in the browser's `sessionStorage`.
- **Mitigation:** Unlike standard `localStorage`, `sessionStorage` values are destroyed when the browser tab is closed and are not shared across tabs, blocking cross-tab hijacking vulnerabilities.

---

## 2. API Gateways & Security Filters

### sliding-window Rate Limiting
- **Global Routes:** Restricts IPs to `100 requests per 15 minutes`.
- **Sensitive Interfaces:** Auth routes (`/login`, `/register`) and curation endpoints (`/watchlist`, `/nyx/chat`) enforce tighter constraints to neutralize brute-force login attempts and automated scraping.

### Database Query Sanitization
- **NoSQL Injection Defense:** All incoming parameters are sanitized using a query filter middleware (`express-mongo-sanitize`). This removes operators beginning with `$` or `.` to prevent raw query injections.
- **Helmet Headers:** Sets secure headers to block clickjacking, MIME sniffing, and cross-site scripting (XSS) attacks.

---

## 3. Cryptographic Slack Webhook Validation

All incoming webhook payloads from Slack are verified using a custom HMAC cryptographic filter:

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

1. **Replay-Attack Protection:** Enforces a verified epoch window. If `(serverTime - requestTimestamp) > 300` seconds, the request is rejected immediately.
2. **HMAC SHA256 Signature Verification:** A secure hash is computed using the raw request body bytes, request timestamp, and `SLACK_SIGNING_SECRET`:
   `SignatureBase = v0:${timestamp}:${rawBody}`
3. **Timing-Attack Defense:** Uses Node's `crypto.timingSafeEqual` buffer comparator, neutralizing signature-guessing attacks based on response duration differences.

---

## 4. Threat Matrix & Mitigations

| Threat Vector | Description | Mitigation Strategy |
| :--- | :--- | :--- |
| **Prompt Injection** | Crafting inputs to hijack prompt registries. | Sanitizes text fields via local regex filters before compilation. |
| **Cross-User Leakage** | Context values bleeding between profiles. | Strict isolate scopes using JWT claims on database queries. |
| **Token Exhaustion** | Flooding the LLM API to inflate costs. | Sliding concurrency queue limits and local cache lookups. |
| **Sensitive Data Leakage** | Exposing TMDB or Gemini keys. | Environment keys are kept on host servers (Render) and never committed. |
