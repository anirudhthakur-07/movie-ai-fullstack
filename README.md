# 🎬 Dark — Full-Stack Movie Recommendation & Gamified Curation Platform

A full-stack movie recommendation platform that combines intelligent movie discovery, personalized curation, watchlist management, streaming platform tracking, and user analytics into a modern, gamified Netflix-inspired experience.

---

# 📌 Overview

**Dark** is a full-stack web application designed to eliminate streaming fatigue. By building user behavior profiles, tracking streaming provider clicks, and analyzing watchlists, the platform dynamically computes user personas, unlocks gamified achievements, and builds visual taste graphs.

The application uses pure HTML5, CSS3 (with notch/safe-area mobile responsiveness), and Vanilla JS on the client side, powered by a secure Node.js/Express REST API and a MongoDB Atlas data layer.

---
## Live Demo
- **Frontend App:** [https://movie-ai-fullstack.vercel.app](https://movie-ai-fullstack.vercel.app)
- **Backend API:** `https://movie-ai-fullstack.onrender.com/api`

---

# ✨ Key Features

## 🔐 Authentication & Security
- **Secure Logins:** Password hashing with `bcryptjs` and stateless session tracking with JWT.
- **Tab-Scoped Sessions:** Session tokens stored securely in `sessionStorage` to prevent cross-tab reuse.
- **Error Standardization:** Muted, generic authentication error messages to block username harvesting.
- **API Defense:** Rate-limiting limits API abuse, `helmet` enforces strict HTTP headers, and input sanitization cleans database queries against NoSQL injection.

## 🎥 Movie Discovery
- Curated horizontal movie rows: Weekly Trending, Popular, Top Rated, Sci-Fi, and Horror.
- Full details modals showing runtime, synopsis, cast, and embedded YouTube trailers.
- Real-time OTT streaming provider availability detection powered by TMDB.

## 🤖 Personalized Curation
- **Self-Healing Metadata:** Background pipeline automatically checks and fetches missing genre details for saved movies when profiles load.
- **Movie DNA Mapping:** Aggregates user search history, genre distributions, and provider click events into weighted taste scores.
- **Watchlist Recommendations:** Contextual recommendations showing matching explanation rows (e.g. *"Because you watched Inception"*).

## 🏆 Gamification & Avatars
- **User XP & Leveling:** Experience points awarded dynamically for user interactions (searches, profile views, provider clicks).
- **Achievements System:** 11 unlockable badges tracking progress (e.g. *Collector*, *Genre Explorer*, *Cinephile*).
- **Custom Avatars:** 40 custom, persona-mapped profile avatars available to unlock based on user levels.

## 📊 Analytics Dashboard
- **Favorite Genre & Provider:** Displays the user's top genre and most frequently clicked streaming platform.
- **Dynamic Charts:** Genre Distribution (Donut Chart), Genre Affinity (Bar Chart), and Streaming Platform Usage (Donut Chart) rendered client-side using `Chart.js`.

---

# 🛠️ Technology Stack

### Frontend
- **HTML5 & CSS3:** Responsive layouts optimized for mobile safe-areas (notches and home indicators).
- **JavaScript (ES6):** Vanilla controller modules with debounced search queries and skeleton shim loaders.
- **Chart.js:** Responsive canvas charts for dashboard visualizations.

### Backend
- **Node.js & Express.js:** Layered REST API routing requests through JWT middleware to services.
- **MongoDB Atlas & Mongoose:** Persistent document database utilizing automatic 15-day TTL expiry indexes on cached movie metadata.

---

# 🏗️ System Architecture

```text
                    User Browser (HTML5, Glassmorphic CSS3, Vanilla JS)
                                              │
                                              ▼
                             Express API Gateway (Render.com)
                       ┌──────────────────────┼──────────────────────┐
                       │ (Helmet, Cors, Rate Limiters, Sanitizers)   │
                       ▼                                             ▼
                 Protected Routes                            Public Auth Routes
             (JWT Auth Middleware Guard)                 (/api/login, /api/register)
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
Curation Services  Search Engine   Analytics Engine
(profileEngine.js) (tmdbService.js) (Mongo Aggregations)
       │               │               │
       └───────────────┼───────────────┘
                       │
                       ├──────────────────────────────┐
                       ▼                              ▼
                 MongoDB Atlas                   TMDB API Proxy
            (User Watchlists, Events)           (Metadata, OTT Details)
```

---

# 📂 Project Structure

```text
movie-ai-fullstack/
│
├── README.md                   # Master project manual
│
├── backend/
│   ├── .env.example            # Backend environment variables template
│   ├── server.js               # API bootstrap and global middleware chains
│   ├── package.json            # Node project configuration
│   │
│   ├── config/
│   │   └── tmdb.js             # TMDB HTTP Client setup
│   │
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   │
│   ├── models/
│   │   ├── User.js             # User data schema + watchlist subdocuments
│   │   ├── Movie.js            # Cached movie documents (15-day TTL index)
│   │   ├── ProviderClick.js    # OTT platform interaction logs
│   │   ├── SearchHistory.js    # Search query records
│   │   └── BehaviorEvent.js    # XP behavior weights
│   │
│   ├── routes/
│   │   ├── achievementRoutes.js# Achievements status API
│   │   ├── analyticsRoutes.js  # Chart aggregates and stats API
│   │   ├── authRoutes.js       # Register and login API
│   │   ├── behaviorRoutes.js   # XP interaction tracker API
│   │   ├── movieRoutes.js      # TMDB search, detail, and provider proxy API
│   │   ├── profileRoutes.js    # Dynamic user profile details API
│   │   ├── recommendationRoutes.js # Search and watchlist curation API
│   │   ├── searchHistoryRoutes.js # User query history API
│   │   └── watchlistRoutes.js  # Add/remove watchlist items API
│   │
│   └── services/
│       ├── profileEngine.js    # XP math, persona assignment, and self-healing
│       └── tmdbService.js      # Raw external metadata parsing client
│
├── frontend/
│   ├── index.html              # Discovery feed layout
│   ├── login.html              # Sign-up and login gate
│   ├── dashboard.html          # User profile analytics dashboard layout
│   ├── watchlist.html          # Curation feed and grid layout
│   │
│   ├── config.js               # Global client API base configuration
│   ├── script.js               # Discovery controllers and feed rendering
│   ├── modal.js                # Detail modal, casts, and provider trackers
│   ├── dashboard.js            # Chart.js rendering and achievements grid
│   ├── watchlist.js            # LocalStorage caching loader and watchlist grids
│   ├── avatarSelector.js       # Avatar selector UI and unlocks
│   │
│   ├── style.css               # Global responsive design tokens
│   ├── dashboard.css           # Glowing glassmorphic widget styles
│   │
│   └── assets/
│       ├── avatars/            # 40 persona-mapped avatar images
│       └── videos/             # Background mp4 video loops
│
└── screenshots/                # Application demonstration screenshots
```

---

# 🚀 Installation & Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/movie-ai-fullstack.git
cd movie-ai-fullstack
```

### 2. Backend Setup
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
3. Open `backend/.env` and configure your credentials:
   - `MONGO_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A secure key used for signing tokens (minimum 32 characters).
   - `TMDB_API_KEY`: A free API key from [themoviedb.org](https://www.themoviedb.org).
4. Start the server:
   ```bash
   npm start
   ```
   *The server runs by default on `http://localhost:5000`.*

### 3. Frontend Setup
1. Open `frontend/config.js` and set the `API_BASE` variable:
   ```javascript
   const API_BASE = "http://localhost:5000/api";
   ```
2. Serve the `frontend/` directory using a local web server (like VS Code Live Server) or via npm:
   ```bash
   cd ../frontend
   npx serve -l 3000
   ```
3. Visit `http://localhost:3000` in your web browser.

---

# 📸 Screenshots

### Home Page — Discovery Hub
![Home](screenshots/HomePage.png)

### Movie Detail Modal & Cast Details
![Search](screenshots/Search.png)

### Watchlist — Collection Manager
![Watchlist](screenshots/Watchlist.png)

### Analytics Dashboard — Movie DNA & Persona
![Dashboard](screenshots/Dashboard.png)

---

# 🔮 Future Enhancements
- **Adaptive Recommendations:** Machine Learning models trained on user watchlist genre weights.
- **Redis Caching:** Memory cache layer for fast API response speeds on repeat details.
- **Docker Support:** Dockerfile container setup for automated deployments.
- **Social Features:** Co-viewing chatrooms and watchlist sharing profiles.

---

# 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

# 🙏 Acknowledgements
- **TMDB (The Movie Database):** For providing rich media metadata.
- **Chart.js:** For client-side dashboard charts.
- **MongoDB Atlas:** For cloud database systems.

---

⚠️ *This product uses the TMDB API but is not officially endorsed or certified by TMDB.*
