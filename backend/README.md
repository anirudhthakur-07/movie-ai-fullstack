# 🎬 Movie Recommendation System - Backend

A secure and scalable Node.js + Express.js backend powering a personalized movie recommendation platform with authentication, analytics dashboards, gamified watchlists, and TMDB integration.

## Overview

The Movie Recommendation System Backend is a RESTful API built using Node.js, Express.js, and MongoDB. It provides movie discovery, personalized recommendations, watchlist management, analytics tracking, achievements mapping, and secure user authentication.

The backend integrates with The Movie Database (TMDB) API to fetch real-time movie information while maintaining user-specific data such as watchlists, streaming platform clicks, XP metrics, and search queries in MongoDB.

---

## 🚀 Key Features

### 🔐 Authentication & Authorization
- User Registration & Login.
- JWT-Based Stateless Authentication.
- Protected API Routes using JWT validation guards.
- Secure Password Hashing using `bcryptjs`.
- Standardized authentication response codes to block user enumeration attacks.

### 🎥 Movie Discovery
- Debounced Search Queries.
- Curated categories: Trending, Popular, Top Rated, Sci-Fi, and Horror.
- Enriched metadata profiles: runtime, cast profiles, trailers, and regional OTT watch providers.

### ❤️ Watchlist & Self-Healing
- Add and remove movies to watchlists with MongoDB persistence.
- Automatic self-healing background checks to fetch and resolve missing genre arrays from TMDB API.

### 🤖 Recommendation Curation
- **Search-Based Recommendations:** Generates recommendations similar to user search inputs, filtered for duplicates and ranked by rating.
- **Watchlist-Based Recommendations:** Analyzes genre density arrays inside user watchlists to curate highly relevant suggestions.

### 📊 Analytics Dashboard
- Aggregates interaction signals (clicks, views, queries) into taste metrics.
- Provides overview values (total saves, favorite genre, favorite platform, average ratings) via Mongo pipelines.
- Supports frontend Chart.js components (Provider usage grids and Genre affinity maps).

### 🏆 Gamification & XP System
- User XP weights logged based on interactive behaviors (DDoS-protected behavior logs).
- Handles profile levels ("Beginner", "Intermediate", "Advanced") and activity ranges ("Casual", "Active", "Power User").
- Handles unlock states for achievements (11 unique badges) and custom user avatars.

---

## 🛠️ Technology Stack

### Backend Framework
- Node.js (v18+)
- Express.js (v4.x)

### Database
- MongoDB Atlas (Cloud Cluster)
- Mongoose ODM (Data Validation & Modeling)

### Authentication
- JSON Web Token (JWT)
- bcrypt.js (Password Salt-Hashing)

### External APIs
- TMDB (The Movie Database) API Client

### Security Middleware
- Helmet (HTTP Header Protection)
- Express Rate Limit (IP-based Request Throttling)
- Express Mongo Sanitize (NoSQL Query Injection Prevention)

### Logging
- Morgan (HTTP Request Logger)

---

## 🏗️ Backend Architecture

```text
               Client Application (HTML5, CSS3, Vanilla JS)
                                     │
                                     ▼
                        Express.js REST API Server
                                     │
 ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
 │                   │                               │                   │
 ▼                   ▼                               ▼                   ▼
Authentication  Curation Engine (profileEngine.js)  Analytics Engine  Security Guard
  Middleware     (Self-Healing Metadata API)        (Aggregations)     (Rate Limits)
                     │                               │
                     └───────────────┬───────────────┘
                                     │
                                     ▼
                               MongoDB Atlas
                                     │
                                     ▼
                            TMDB API Proxy Client
```

---

## 📂 Project Structure

```text
backend/
│
├── config/
│   └── tmdb.js                 # TMDB HTTP Client (Axios client setup)
│
├── middleware/
│   └── auth.js                 # JWT Authentication route protection middleware
│
├── models/
│   ├── BehaviorEvent.js        # User XP behaviors and weights schema
│   ├── Movie.js                # Cached TMDB movie details (15-day TTL index)
│   ├── ProviderClick.js        # User OTT platform click interaction schema
│   ├── SearchHistory.js        # User search queries tracking schema
│   └── User.js                 # User profile credentials and watchlist schema
│
├── routes/
│   ├── achievementRoutes.js    # Achievements checklist and claims endpoints
│   ├── analyticsRoutes.js      # User taste profile metrics endpoints
│   ├── authRoutes.js           # Register and Login endpoints
│   ├── behaviorRoutes.js       # Dynamic XP updates endpoints
│   ├── movieRoutes.js          # Search, Trending, Cast, Trailers, and OTT proxy endpoints
│   ├── profileRoutes.js        # User details, gender, and level endpoints
│   ├── recommendationRoutes.js # Contextual curation and watchlist recommendations endpoints
│   ├── searchHistoryRoutes.js  # Search history log endpoints
│   └── watchlistRoutes.js      # Watchlist items toggle and list endpoints
│
├── services/
│   ├── profileEngine.js        # Dynamic taste math, levels, and self-healing loop
│   └── tmdbService.js          # Raw TMDB parsing methods
│
├── .env                        # Local configurations (Gitignored)
├── package.json                # Project dependencies and startup script
└── server.js                   # Application bootstrap and global middleware config
```

---

## 🔐 Security Features

- **JWT Authentication:** Protected API routes require a valid header signature (`Authorization: Bearer <JWT_token>`).
- **Password Security:** Credentials hashed using salt rounds prior to DB indexing.
- **Rate Limiting:** Global limiter prevents API abuse (configured to block users at `700` calls per 15 minutes).
- **HTTP Security Headers:** Helmet integrates header security flags to defend against framing and clickjacking.
- **NoSQL Injection Protection:** Sanitize parser strips `$` and `.` characters from req parameter objects.

---

## 🤖 Recommendation Engine

### Search-Based Recommendation
1. User types in a search query.
2. Similar movies are fetched from TMDB.
3. Matching genres are parsed to search for supplementary options.
4. Duplicates and low-rating metadata records are filtered out.
5. Suggestions are returned sorted by rating.

### Watchlist-Based Recommendation
1. Reads the user's saved watchlist.
2. Background self-healing processes any entries missing genres.
3. Computes the user's primary taste interest based on watchlist genre density.
4. Queries TMDB recommendations using the computed genre profile.
5. Filters out titles already saved to the user's watchlist.
6. Returns highly personalized selections.

---

## 📊 Analytics Module

The analytics engine processes database documents to render user taste graphs:
- **Overview Analytics:** Calculates total movies, favorite genre, most-clicked streaming platform, average watchlist rating, and genre diversity scores.
- **Provider Analytics:** Tracks clicks on OTT channels (Netflix, Prime Video, Disney+ Hotstar, ZEE5, SonyLIV, Apple TV, Crunchyroll) to build platform distributions.
- **Genre Analytics:** Aggregates watchlist genres and user interaction behavior events to output genre affinity maps.

---

## 📡 API Endpoints

### Authentication
- `POST /api/register` — Create user account.
- `POST /api/login` — Authenticate credentials and receive token.

### Movies & Metadata
- `GET /api/search?q=<query>` — Query movies by title.
- `GET /api/trending` — Retrieve trending movies.
- `GET /api/popular` — Retrieve popular movies.
- `GET /api/top-rated` — Retrieve top-rated movies.
- `GET /api/scifi` — Retrieve Science Fiction movies.
- `GET /api/horror` — Retrieve Horror movies.
- `GET /api/movie/:id` — Retrieve movie overview details.
- `GET /api/movie/:id/cast` — Retrieve cast lists.
- `GET /api/movie/:id/trailer` — Retrieve YouTube video trailers.
- `GET /api/movie/:id/providers` — Retrieve available streaming networks.
- `GET /api/provider-content/:provider` — Retrieve titles cached under a specific provider.
- `GET /api/discover/genre/:genreName` — Retrieve titles from a specific genre.

### Watchlist
- `GET /api/watchlist` — Retrieve saved movie lists.
- `POST /api/watchlist` — Toggle movie inside user watchlist.

### Recommendations
- `GET /api/recommend?movieId=<id>` — Contextual/similar suggestions.
- `GET /api/recommend/watchlist` — Watchlist-based suggestions.

### Analytics
- `GET /api/analytics/overview` — Dynamic profile counts and levels.
- `GET /api/analytics/providers` — Aggregated streaming click counts.
- `GET /api/analytics/genres` — Aggregated genre interaction logs.

### Profile & Gamification
- `GET /api/profile` — Fetch user levels, XP, and computed personas.
- `POST /api/profile/gender` — Set profile gender parameter.
- `GET /api/achievements` — Fetch achievements unlock grid.
- `POST /api/achievements/track` — Set achievement trigger signals.
- `POST /api/behavior/event` — Log interaction behavior XP.
- `GET /api/behavior/summary` — Read behavior log summary.
- `GET /api/history` — Read search history queries.
- `POST /api/history` — Write search history query.

---

## 🔮 Future Enhancements
- Unit and integration testing suites (Jest, Supertest).
- Server memory caching using Redis.
- Automated container builds with Docker.
- Real-time notification systems (WebSockets).

---

## 👨‍💻 Developer
Developed as a robust, secure, and production-ready Express API backing the Dark movie curation dashboard.
