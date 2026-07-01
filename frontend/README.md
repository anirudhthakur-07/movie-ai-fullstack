# 🎨 Movie Recommendation System - Frontend

[← Back to Root README](../README.md)

## Overview

The Movie Recommendation System Frontend is a modern web application built using HTML5, CSS3, and JavaScript (ES6+). It provides an interactive movie discovery experience with personalized recommendations, watchlists, streaming platform integration, analytics dashboards, gamified levels, and secure user authentication.

The frontend communicates with a Node.js and Express.js backend and retrieves movie data from TMDB API proxies to deliver real-time recommendations and movie details.

---

# Features

## 🔐 User Authentication
- User Registration & Login switcher.
- JWT Token Authentication.
- **Session Management:** Secure tab-scoped token storage inside `sessionStorage` (automatic session termination on tab close).
- **Protected Pages:** Auto-redirects unauthenticated sessions back to `login.html`.

## 🎥 Movie Discovery
- Curated categories: Trending, Popular, Top Rated, Sci-Fi, and Horror.
- Interactive movie detail modals with casts list, trailers, and regional OTT providers.
- Smooth horizontal carousels with swipe controls and scroll buttons.

## 🔍 Smart Search System
- Debounced query handler (begins searching 500ms after user pauses typing).
- Displays search results along with similar movie recommendations.
- Saves query inputs to search history logs.

## 🤖 Taste Curation Engine
Curation widgets suggest titles based on multiple interaction signals:
- **Search-Based Recommendations:** Movies similar to search query inputs.
- **Watchlist-Based Recommendations:** Suggestions computed from watchlist genre profiles (complete with *"Because you watched"* explanation flags).

## ❤️ Watchlist Management
- Toggle movies in/out of watchlists instantly.
- **Persistent Synchronization:** Synchronizes saved watchlists with MongoDB.
- **Watchlist Persona Card:** Large hero card displaying computed taste personas (e.g. *Horror Seeker*, *Action Addict*).

## 🏆 Gamification & Avatars
- **XP Progression:** Track experience points and user levels on the profile card.
- **Achievements:** 11 unlockable badges displayed as neon-glowing cards.
- **Avatar Selector:** Interactive UI to unlock and save 40 custom persona-mapped profile avatars.

## 📊 Analytics Dashboard
Visualizes user tastes and click logs using responsive Chart.js canvases:
- **Streaming platform distribution:** Donut chart mapping OTT usage.
- **Genre preferences:** Bar chart displaying genre affinity scores.
- **Genre distribution:** Donut chart summarizing watchlist compositions.

---

# User Interface Features

- **Hero Banner:** Dynamic featured sections displaying backdrop graphics.
- **Horizontal scrolling rows:** Smooth scroll containers with gradient overlays and button navigations.
- **Glassmorphic Theme:** Dark design system featuring translucent cards and glowing accents.
- **Responsive Layouts:** Mobile-optimized views containing safe-area padding adjustments for notches and home indicators.

---

# Performance Optimizations

- **Client Caching:** 
  - **Auth token:** Stored in `sessionStorage` (session scope) to secure connections.
  - **Watchlist cache:** Stored in `localStorage` (`cachedWatchlist`) to render collection grids instantly.
  - **Movie metadata:** Stored in `localStorage` (`movieDetailsCache`) to prevent redundant genre and rating lookups.
- **API Retries:** Automatic request retry logic for failed watchlist updates.
- **Progressive loading:** Offscreen images defer loading using the browser-native `loading="lazy"` attribute.
- **Skeleton shimmers:** Shimmer loader animations render while awaiting API responses.

---

# 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+).
- **Visualization:** Chart.js (v4.x).
- **Authentication:** JWT (tab-scoped verification).
- **Typography:** Google Fonts Outfit.

---

# 📂 Frontend Structure

```text
frontend/
│
├── index.html                  # Discovery Feed and Search layout
├── login.html                  # Registration and Login credentials form
├── dashboard.html              # Analytics graphs and Achievements grid layout
├── watchlist.html              # Watchlist grid and Insights panel layout
│
├── config.js                   # Client API base URL configuration
├── script.js                   # Discovery rows logic and search debouncer
├── modal.js                    # Movie detail modal, trailer player, and provider click logger
├── dashboard.js                # Profile load, Chart.js integrations, and achievements grid
├── watchlist.js                # LocalStorage cache loaders and watchlist rendering
├── avatarSelector.js           # Avatar grid selection and unlocked persistence
│
├── style.css                   # Global responsive design tokens
├── dashboard.css               # Glowing glassmorphic widget overlays
│
└── assets/
    ├── avatars/                # 40 custom profile avatar images
    └── videos/                 # Background mp4 video loops (bg.mp4)
```

---

# 🔄 Application Flow

```text
                        User Login (login.html)
                                 │
                                 ▼
                     Credentials Authentication
                                 │
                                 ▼
                       Home Page (index.html)
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
     Search Query        Watchlist Grid          Dashboard Profile
  (script.js debouncer) (watchlist.js cache)   (dashboard.js charts)
           │                     │                     │
           ▼                     ▼                     ▼
    Recommendations      Genre Insights        OTT Click Tracking
   Similar Movie Row    (Genre Affinity)      (ProviderClick logs)
```
---

## 👨‍💻 Developer
Developed as a premium, highly responsive glassmorphic frontend for the Dark Movie Recommendation Platform.
