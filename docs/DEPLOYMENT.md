# 🚀 DARK AI Platform — Deployment Guide

This document outlines the setup, deployment configurations, and maintenance guidelines for both local development and production hosting environments (Vercel, Render, and MongoDB Atlas).

---

## 1. Local Development Setup

### System Prerequisites
*   Node.js (v18.x or higher)
*   MongoDB local community server or access to MongoDB Atlas clusters

### Step-by-Step Local Run:
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/movie-ai-fullstack.git
    cd movie-ai-fullstack
    ```
2.  **Configure Backend Environments:**
    Navigate to the backend directory, install packages, and create your environment file:
    ```bash
    cd backend
    npm install
    cp .env.example .env
    ```
3.  **Fill `.env` Credentials:**
    Add your MongoDB connection string, TMDB developer key, and Gemini API key.
4.  **Start API Host:**
    ```bash
    npm start
    ```
    *The local server boots at `http://localhost:5000`.*
5.  **Configure Frontend Base URL:**
    Open `frontend/config.js` and set:
    ```javascript
    const API_BASE = "http://localhost:5000/api";
    ```
6.  **Serve Client UI:**
    ```bash
    cd ../frontend
    npx serve -l 3000
    ```
    *Visit `http://localhost:3000` in your web browser.*

---

## 2. Production Deployment Protocols

### Frontend Client (Vercel)
- **Deployment Strategy:** Vercel automatically deploys the frontend on pushes to the `main` branch.
- **Clean URLs Enablement:** Ensure Vercel is configured to route without `.html` file extensions to support smooth redirects:
  - `/dashboard` maps to `/dashboard.html`
  - `/watchlist` maps to `/watchlist.html`

### Backend Service (Render)
- **Environment Management:** Configure the variables in Render's dashboard. Never push the `.env` file to Github.
- **Persistent Routing:** Make sure `cors` middleware inside `server.js` points to your production Vercel frontend URL to prevent cross-origin block responses.

---

## 3. Slack Workspace Webhook Setup

To connect your Slack application adapter with the API server:
1.  **Create App:** Visit `api.slack.com/apps` and click "Create New App".
2.  **Configure Slash Commands:**
    - Command name: `/nyx`
    - Request URL: `https://your-backend.render.com/api/slack/commands`
3.  **Enable Event Subscriptions:**
    - Enable Events and add Request URL: `https://your-backend.render.com/api/slack/events`
    - Subscribe to bot events: `app_mention`.
4.  **Install App:** Install in your test workspace and retrieve the `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` keys, adding them to the production environment variables list.
