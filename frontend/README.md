# 🎬 Dark AI Movie Recommendation Platform - Frontend

[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-E34F26?style=for-the-badge&logo=html5)]()
[![Responsive](https://img.shields.io/badge/Responsive-Mobile%20%7C%20Notch%20Ready-blueviolet?style=for-the-badge)]()
[![Animations](https://img.shields.io/badge/UI--UX-Premium%20Glassmorphic-ff69b4?style=for-the-badge)]()

The client-side interface for the Movie AI Recommender platform. It is engineered as a vanilla web application with zero heavy framework bloat, utilizing optimized layouts, transitions, and native rendering charts.

---

## 🎨 Design System & Aesthetics

The interface employs a high-end **Glassmorphism** theme configured via modular CSS variables:
*   **Frosted Glass Cards:** Realized using `backdrop-filter: blur(20px)` and semi-transparent backgrounds (`rgba(18, 18, 22, 0.45)`).
*   **Deep Shadowing:** Custom drop shadows creating an authentic Netflix/Apple TV layered look.
*   **Micro-Animations:** Fluid transformations (`transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)`) on card hovers, button click states, and modal transitions.

---

## ✨ Features & Architecture

### 📱 1. Responsive & Notch Adaptive Grid
*   **Notch Safe-Zones:** Integrates CSS safe-area boundaries (`env(safe-area-inset-top)`, etc.) to prevent clipping on iPhone Pro and modern Android display notches.
*   **Snap-Grid Rows:** Rows utilize native CSS touch-scroll alignments (`scroll-snap-type: x mandatory`) for buttery-smooth horizontal swipe gestures on mobile devices.

### 📊 2. Dynamic Charts & Gamification
*   **Chart.js Integration:** Dashboard maps user provider clicks and genre interests dynamically to high-DPI canvases.
*   **Unlocked Achievements:** Visual unlock grid displaying unique XP requirements, locks, progress tracks, and gradient badge icons.

### 💾 3. Performance & Client Caching
*   **Detail Caching:** Movie details (ratings, years, TMDB specs) are cached in the browser's `localStorage` (`movieDetailsCache`) to reduce repetitive backend API load.
*   **Shimmer Skeletons:** High-end skeleton loaders replace basic loaders, offering continuous visual feedback while data fetches.

---

## 📂 File Layout

```text
frontend/
├── index.html          # Core discovery homepage & search hub
├── login.html          # Registration/login screen
├── dashboard.html      # Gamified user profile dashboard & charts
├── watchlist.html      # Collection grid & insights panel
│
├── script.js           # Homepage lists and search controls
├── modal.js            # Video trailers and casts detail modal controller
├── dashboard.js        # Analytics engine integration & chart builder
├── watchlist.js        # Local cache enrichment & aggregation loader
│
├── style.css           # Global typography, color schemes, and media queries
├── dashboard.css       # Layout styles for dashboard analytics cards
└── assets/             # Brand identity icons and local assets
```

---

## 🔄 Client Application Flow

```text
               [ login.html ]
                      │ (Valid Token)
                      ▼
               [ index.html ] ◄────────┐
                      │                │
      ┌───────────────┼──────────────┐ │ (Close Modal)
      ▼               ▼              ▼ │
 [ Search Bar ]  [ Watchlist ]   [ Movie Details ]
      │               │              │
      ▼               ▼              ▼
 [ Curation ]   [ Insights ]    [ Video Preview ]
```

---

## 🚀 Serving Locally

To prevent CORS errors during client-server REST communication, serve the folder through a local HTTP server:

Using Python 3:
```bash
python -m http.server 3000
```

Using Node.js static server:
```bash
npx serve -l 3000
```
Open `http://localhost:3000` to interact with the platform.
