# 🎨 DARK — Frontend Client Manual

This directory contains the premium, high-end vanilla web client interface for the **DARK AI Movie Platform**. It is structured as a glassmorphic dashboard optimized for both desktop viewports and touch-first mobile screens.

---

## 1. File Structure & Component Map

- **`index.html`:** The main landing feed housing the discovery rows (Weekly Trending, Popular, Top Rated, Sci-Fi, and Horror).
- **`dashboard.html`:** The user metrics viewport displaying computed taste profiles, click analytics, and unlocked badges.
- **`watchlist.html`:** A dedicated grid viewport showing saved curation cards and recommended list rows.
- **`login.html`:** Secure user registration and login gate.
- **`script.js`:** The controller for Carousel row loaders, fetch requests, search handlers, and local state management.
- **`modal.js`:** The interactive details modal script, tracking streaming clicks and embedded YouTube trailers.
- **`dashboard.js`:** Hooks for Chart.js rendering and experience level progression animations.
- **`avatarSelector.js`:** Controller mapping unlocked levels to custom user avatars.
- **`nyx.js`:** The SSE streaming chat drawer interface.
- **`style.css` & `dashboard.css`:** CSS design token registries.

---

## 2. Responsive Layout Tokens & Notch Safe-Areas

The styling follows notches and safe-area margins for high-end mobile rendering:

- **Viewport Containment:** Utilizes `padding: env(safe-area-inset-bottom)` and `margin: env(safe-area-inset-right)` to prevent navigation bars or notch cutouts from overlapping text on iPhone and high-end Android viewports.
- **Responsive Sizing Clamps:** Uses CSS variables with `clamp()` configurations (e.g. `font-size: clamp(1rem, 2vw, 1.5rem)`) to scale font scales and button sizes fluidly between desktop screens and mobile displays.

---

## 3. Streaming Chat Widget Controller (`nyx.js`)

The chat widget implements a custom **Server-Sent Events (SSE) Reader**:
- **Progressive Chunk Rendering:** Reads chunks using a standard readable stream reader (`res.body.getReader()`), decodes bytes using `TextDecoder`, and progressively updates the bubble's innerHTML.
- **Command Routing:** Intercepts JSON tool calls (e.g., `{"toolCalls": [{"name": "openMovie", "args": {"movieId": 27205}}]}`). It removes the blank bubble, parses the command, and dispatches the action (such as opening the detail modal or scrolling to a section).
- **Redirection Helpers:** Evaluates path prefixes to map `openWatchlist` and `showPersona` actions cleanly on Vercel's clean subdirectories (e.g., `/watchlist` or `/dashboard`).
- **Orb Transition Handler:** Listens to toggle actions. When the chat drawer window is visible, it triggers a `.chat-open` class on the container to fade out and scale down the red launcher orb, preventing layout overlapping.
