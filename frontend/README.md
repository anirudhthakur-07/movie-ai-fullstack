# 🎬 Movie Recommendation System - Frontend

##  Overview

The Movie Recommendation System Frontend is a modern web application built using HTML, CSS, and JavaScript. It provides an interactive movie discovery experience with AI-powered recommendations, personalized watchlists, streaming platform integration, analytics dashboards, and secure user authentication.

The frontend communicates with a Node.js and Express.js backend while consuming movie data from TMDB APIs to deliver real-time recommendations and movie information.

---

#  Features

## 🔐 User Authentication

* User Registration
* User Login
* JWT Token Authentication
* Session Management
* Protected Pages
* Automatic Logout on Invalid Session

---

##  Movie Discovery

Users can explore movies through multiple categories:

* Trending Movies
* Popular Movies
* Top Rated Movies
* Action Movies
* Comedy Movies
* Science Fiction Movies
* Horror Movies

Movies are dynamically loaded from the backend and TMDB APIs.

---

## 🔍 Smart Search System

Users can search movies by:

* Movie Title
* Genre
* Keywords

Features include:

* Real-Time Search
* Search Result Display
* Pagination Support
* Recommendation Generation

---

##  AI Recommendation Engine

After searching for a movie, the system generates intelligent recommendations based on:

* Similar Movies
* Genre Similarity
* User Preferences
* Watchlist Behaviour

Recommendation sections include:

### Search-Based Recommendations

Recommendations generated from the current search query.

### Watchlist-Based Recommendations

Recommendations generated from movies saved in the user's watchlist.

### Analytics-Based Recommendations

Recommendations generated using:

* Favorite Genres
* Preferred Streaming Providers

---

##  Watchlist Management

Users can:

* Add Movies to Watchlist
* Remove Movies from Watchlist
* View Saved Movies
* Receive Personalized Recommendations

Watchlist data is synchronized with MongoDB through protected APIs.

---

##  Interactive Movie Modal

Clicking a movie opens a detailed movie modal containing:

* Poster
* Rating
* Release Year
* Overview
* Cast Information
* Trailer Access
* OTT Availability

---

## OTT Streaming Integration

The platform detects movie availability across streaming services including:

* Netflix
* Prime Video
* Disney+ Hotstar
* SonyLIV
* Zee5
* Apple TV
* Crunchyroll

Users can directly navigate to streaming platforms.

---

##  Analytics Dashboard

The dashboard visualizes user activity through:

### Overview Analytics

* Total Streaming Clicks
* Favorite OTT Platform
* Favorite Genre

### Provider Analytics

Interactive Doughnut Chart displaying:

* Netflix Activity
* Prime Video Activity
* Disney+ Activity
* Other Provider Usage

### Genre Analytics

Interactive Bar Chart displaying:

* Genre Preferences
* Viewing Trends
* User Behaviour Patterns

---

#  User Interface Features

## Hero Carousel

Dynamic hero section displaying trending movies with:

* Automatic Rotation
* Background Transitions
* Featured Content Showcase

## Horizontal Scrolling Rows

Netflix-inspired movie browsing experience:

* Smooth Scrolling
* Auto Pagination
* Lazy Loading

## Responsive Design

Optimized for:

* Desktop Devices
* Tablets
* Mobile Devices

---

#  Performance Optimizations

The frontend includes multiple optimization strategies:

### Local Storage Caching

Used for:

* Authentication Tokens
* Watchlist Cache
* User Preferences

### API Retry Mechanism

Automatic retry system for failed API requests.

### Lazy Loading

Images load progressively to improve performance.

### Skeleton Loading States

Improved user experience while content loads.

---

# 🛠️ Technology Stack

## Frontend

* HTML5
* CSS3
* JavaScript (ES6)

## Visualization

* Chart.js

## Authentication

* JWT Authentication

## APIs

* TMDB API
* Custom Express Backend API

---

# 📂 Frontend Structure

```text
frontend/
│
├── index.html
├── login.html
├── dashboard.html
├── watchlist.html
│
├── script.js
├── modal.js
├── dashboard.js
├── watchlist.js
│
├── style.css
│
└── assets/
```

---

# 🔄 Application Flow

```text
                        User Login
                            │
                            ▼
                     Authentication
                            │
                            ▼
                        Home Page
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
             Search    Watchlist      Dashboard
             │               │              │
             ▼               ▼              ▼
 Recommendations         Analytics    OTT Integration
```
---

#  Developer

Developed as a full-stack movie recommendation platform demonstrating:

* Frontend Development
* API Integration
* User Authentication
* Recommendation Systems
* Data Visualization
* Interactive UI Design
* Performance Optimization
* Full Stack Development
