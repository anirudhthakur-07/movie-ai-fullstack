# 🎬 Dark AI Movie Recommendation Platform

[![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen?style=for-the-badge)]()
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=node.js)]()
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb)]()
[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-E34F26?style=for-the-badge&logo=html5)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)]()

A world-class, gamified full-stack movie recommendation and curation companion. It combines responsive glassmorphic UI, real-time TMDB API integration, behavior-based user profile analytics, and interactive discovery features into a premium cinematic dashboard.

---

## 📌 Executive Overview

The **Dark AI Movie Recommendation Platform** is engineered to eliminate content choice paralysis. By analyzing real-time search queries, active watchlists, and streaming provider interactions, the application dynamically constructs a user's **Movie DNA** and maps it to a custom **AI Persona**. 

---

## ✨ Primary Features

### 🔐 1. Authentication & Security
*   **JWT Token Authorization:** Fully stateless session management with HTTP headers.
*   **Encrypted Secrets:** Strong password hashing via `bcrypt.js`.
*   **API Rate Limiting:** Abuse prevention rate limiters.
*   **Security Audited:** Enhanced headers via `helmet`, injection sanitation using `express-mongo-sanitize`.

### 🎯 2. Curation & Movie DNA
*   **Movie DNA Visualization:** Dynamically rendered interest mapping using Chart.js.
*   **Gamified Milestones:** Unlocked achievements (XP logs, status levels, rank progressions) based on platform exploration.
*   **OTT Provider Tracking:** Tracks content click preferences across major networks (Netflix, Prime, Disney+, Hotstar, Apple TV, etc.).

### 🤖 3. AI Curation Engine
*   **Watchlist-Based Curation:** Recalculates user personas based on the actual genre composition of their saved watchlist items.
*   **Search Curation:** Resolves and ranks similar movies dynamically from search triggers.
*   **Self-Healing Databases:** Automatic background TMDB query syncing to resolve missing movie metadata.

---

## 🏗️ System Architecture

```text
                               ┌──────────────────┐
                               │   Client Browser │
                               └─────────┬────────┘
                                         │ HTTPS / JSON
                                         ▼
                              ┌────────────────────┐
                              │ Express API Server │
                              └──────────┬─────────┘
                                         │
                 ┌───────────────────────┼────────────────────────┐
                 ▼                       ▼                        ▼
       ┌──────────────────┐    ┌────────────────────┐    ┌──────────────────┐
       │   Auth Route     │    │ Curation Engine    │    │ Analytics Module │
       │ (JWT, Bcrypt)    │    │   (TMDB Queries)   │    │  (Chart.js Data) │
       └──────────────────┘    └─────────┬──────────┘    └──────────────────┘
                                         │
                                         ▼
                               ┌────────────────────┐
                               │   MongoDB Atlas    │
                               └────────────────────┘
```

---

## 📂 Repository Layout

```text
movie-ai-fullstack/
├── README.md                      # Primary Repository Documentation
├── backend/
│   ├── config/                    # Config files (TMDB client configurations)
│   ├── middleware/                # Route security and auth guards
│   ├── models/                    # MongoDB schemas (User, Click logs, Movie specs)
│   ├── routes/                    # API endpoints
│   ├── services/                  # Business logic & Curation calculators
│   ├── server.js                  # Express setup
│   └── README.md                  # Backend API Documentation
└── frontend/
    ├── assets/                    # Graphical assets and clean design logos
    ├── index.html                 # Homepage layout
    ├── login.html                 # Registration/login screen
    ├── dashboard.html             # Profile, Movie DNA, and achievements dashboard
    ├── watchlist.html             # Saved collection grid and insights
    ├── *.js                       # Javascript logic modules
    ├── style.css                  # Premium CSS design tokens & layouts
    └── README.md                  # Frontend Architecture Documentation
```

---

## 🚀 Quick Setup & Configuration

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16+ recommended)
*   [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
*   [TMDB API Key](https://www.themoviedb.org/documentation/api)

### 1. Setup Backend
Navigate to the backend directory, install dependencies, and create a `.env` configuration file:
```bash
cd backend
npm install
```

Configure `.env` using this secure placeholder template:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/movie-ai
JWT_SECRET=your_secure_jwt_passphrase_here
TMDB_API_KEY=your_tmdb_api_key_here
```

Start the service:
```bash
npm start
```

### 2. Setup Frontend
Open `frontend/config.js` and set the API path (e.g. `http://localhost:5000/api` for local development):
```javascript
const API_BASE = "http://localhost:5000/api";
```

Serve `frontend/index.html` using any local server (e.g., Live Server in VS Code, or python simple server):
```bash
cd ../frontend
python -m http.server 3000
```
Visit `http://localhost:3000` in your web browser.

---

## 👨‍💻 Developer & Project Goals

Designed to showcase:
*   **Premium UX/UI Principles:** Dynamic safe-area padding for notch devices, momentum scrolling, and custom SVG styling.
*   **Secure API Design:** Protected paths, data sanitation, and token handshakes.
*   **Interactive Analytics:** Native Chart.js renderers mapped to responsive canvas grids.
*   **Intelligent Profile Models:** Watchlist genre counting, automated persona states, and self-healing DB pipelines.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

⚠️ *Disclaimer: This product uses the TMDB API but is not officially endorsed or certified by TMDB.*
