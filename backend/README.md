# 🎬 Dark AI Movie Recommendation Platform - Backend

[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=node.js)]()
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb)]()
[![Security](https://img.shields.io/badge/Security-OWASP%20Audited-red?style=for-the-badge)]()

The server-side application powering the Movie AI Recommender platform. Built with Express.js and MongoDB, it implements secure authentication, detailed click tracking, and metadata curation engines.

---

## 🛠️ Technology Stack & Dependencies

*   **Runtime:** Node.js (v16+)
*   **Web Framework:** Express.js
*   **Database:** MongoDB Atlas (via Mongoose ODM)
*   **Security & Guard Rails:**
    *   `bcryptjs` - Password hashing
    *   `jsonwebtoken` - Stateless authentication tokens
    *   `helmet` - HTTP header security
    *   `express-rate-limit` - DDoS protection
    *   `express-mongo-sanitize` - NoSQL injection prevention
*   **Logging:** Morgan middleware

---

## 🌐 API Endpoint Registry

### 🔑 Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Registers a new user. | No |
| `POST` | `/api/login` | Returns a signed JWT token on success. | No |

### 🎥 Discovery & TMDB Proxy
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/search` | Performs a TMDB search query. | Yes |
| `GET` | `/api/trending` | Returns current trending titles. | Yes |
| `GET` | `/api/popular` | Returns popular movie categories. | Yes |
| `GET` | `/api/scifi` | Science fiction genre feed. | Yes |
| `GET` | `/api/horror` | Horror genre feed. | Yes |
| `GET` | `/api/movie/:id` | Returns complete details for a TMDB ID. | Yes |
| `GET` | `/api/movie/:id/cast` | Returns cast members. | Yes |
| `GET` | `/api/movie/:id/trailer` | Returns Youtube trailer links. | Yes |
| `GET` | `/api/movie/:id/providers` | OTT provider availability check. | Yes |

### 📝 Watchlist & Curation
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/watchlist` | Fetch user's saved watchlist. | Yes |
| `POST` | `/api/watchlist` | Add/remove movie from watchlist. | Yes |
| `GET` | `/api/recommend` | Search-based collaborative curation. | Yes |
| `GET` | `/api/recommend/watchlist`| Watchlist-based customized recommendations.| Yes |

### 📊 Analytics & Interaction
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/overview` | Returns total interactions and favorites. | Yes |
| `GET` | `/api/analytics/providers`| Returns data for OTT provider click charts. | Yes |
| `GET` | `/api/analytics/genres` | Returns data for genre map distribution. | Yes |

---

## ⚙️ Core Engines

### 1. User Profile & Persona Engine
*   **Watchlist Genre Mapping:** The user's dynamic **Persona** (such as *Horror Seeker* or *Sci-Fi Explorer*) is calculated by counting and sorting the actual genres of movies saved in their watchlist.
*   **Fallback Resolution:** If the watchlist is empty, the system falls back to analyzing the user's provider click logs and search history.
*   **XP Progress System:** Automatically evaluates explorer levels, profile strengths, and user activities based on behavioral events.

### 2. Self-Healing Watchlist Pipeline
*   When retrieving a user profile, the server checks if any items in the user's watchlist are missing genre tags.
*   If missing, it automatically queries the TMDB API in parallel, resolves the genres, and saves them to the database without slowing down the initial response.

---

## 📂 Backend Architecture Layout

```text
backend/
├── config/
│   └── tmdb.js               # Centralized TMDB HTTP Client
├── middleware/
│   └── auth.js               # JWT security gatekeeper
├── models/
│   ├── User.js               # Account details, unlocked badges, watchlist
│   ├── Movie.js              # Cached movie definitions
│   ├── ProviderClick.js      # Click event analytics logs
│   ├── SearchHistory.js      # Query history entries
│   └── BehaviorEvent.js      # XP tracking logs
├── routes/
│   ├── authRoutes.js         # Register / Login controllers
│   ├── movieRoutes.js        # TMDB query handlers
│   ├── watchlistRoutes.js    # Watchlist modification
│   ├── recommendationRoutes.js # AI curation logic
│   └── analyticsRoutes.js    # Chart statistics generators
├── services/
│   └── profileEngine.js      # Persona, Level, and Movie DNA calculators
├── .env                      # Environment configurations (Protected)
├── server.js                 # Entry point (Express configurations)
└── package.json              # Node dependencies
```
