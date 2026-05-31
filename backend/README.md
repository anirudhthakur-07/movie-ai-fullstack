
#  Movie Recommendation System - Backend
A secure and scalable Node.js + Express.js backend powering a personalized movie recommendation platform with authentication, analytics, watchlists, and TMDB integration.
## Overview
The Movie Recommendation System Backend is a RESTful API built using Node.js, Express.js, and MongoDB. It provides movie discovery, personalized recommendations, watchlist management, analytics tracking, and secure user authentication.

The backend integrates with The Movie Database (TMDB) API to fetch real-time movie information while maintaining user-specific data such as watchlists, streaming preferences, and recommendation history in MongoDB.


##  Features

###  Authentication & Authorization

* User Registration
* User Login
* JWT-Based Authentication
* Protected API Routes
* Secure Password Hashing using bcrypt

###  Movie Discovery

* Search Movies
* Trending Movies
* Popular Movies
* Top Rated Movies
* Science Fiction Movies
* Horror Movies
* Movie Details
* Movie Cast Information
* Movie Trailer Information
* OTT Provider Availability

###  Watchlist Management

* Add Movies to Watchlist
* Remove Movies from Watchlist
* Fetch User Watchlist
* Persistent Storage in MongoDB

###  Recommendation Engine

* Search-Based Recommendations
* Similar Movie Recommendations
* Genre-Based Recommendations
* Watchlist-Based Personalized Recommendations
* Duplicate Filtering
* Quality Ranking System

###  Analytics Dashboard

* Total Movies Explored
* Favorite OTT Provider
* Favorite Genre
* Provider Usage Analytics
* Genre Preference Analytics

###  User Activity Tracking

* OTT Provider Click Tracking
* Search History Management
* User Preference Analysis

## 🛠️ Technology Stack

### Backend Framework

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose ODM

### Authentication

* JSON Web Token (JWT)
* bcrypt.js

### External APIs

* TMDB (The Movie Database) API

### Security

* Helmet
* Express Rate Limit
* Express Mongo Sanitize

### Logging

* Morgan

## 🏗️ Backend Architecture

```text
               Client Application
                       │
                       ▼
             Express.js API Server
                       │
 ┌─────────────────────┼─────────────────────┐
 │                     │                     │
 ▼                     ▼                     ▼
Authentication Recommendation Engine  Analytics Engine

                       │
                       ▼
                 MongoDB Atlas
                       │
                       ▼
                    TMDB API

```
## 📂 Project Structure
```text
backend/
│
├── config/
│   └── tmdb.js
│
├── middleware/
│   └── auth.js
│
├── models/
│   ├── Movie.js
│   ├── User.js
│   └── ProviderClick.js
│
├── routes/
│   ├── authRoutes.js
│   ├── analyticsRoutes.js
│   ├── movieRoutes.js
│   ├── recommendationRoutes.js
│   └── watchlistRoutes.js
│
├── .env
├── package.json
└── server.js
```

---

##  Security Features

### JWT Authentication

Protected routes require a valid JWT token.

### Password Security

Passwords are securely hashed using bcrypt before storage.

### Rate Limiting

API abuse prevention through request limiting.

### HTTP Security Headers

Helmet is used to enhance API security.

### NoSQL Injection Protection

Mongo Sanitize prevents malicious MongoDB queries.

---

##  Recommendation Engine

The recommendation engine combines multiple strategies to provide relevant movie suggestions.

### Search-Based Recommendation

1. User searches for a movie.
2. Similar movies are fetched from TMDB.
3. Related genres are identified.
4. Additional genre-based recommendations are     generated.
5. Low-quality results are filtered out.
6. Duplicates are removed.
7. Final recommendations are ranked and returned.

### Watchlist-Based Recommendation

1. Analyze user watchlist.
2. Extract frequently watched genres.
3. Identify user preferences.
4. Fetch TMDB recommendations.
5. Generate personalized suggestions.
6. Remove already watched content.
7. Return highly relevant movies.


## 📊Analytics Module

The analytics engine tracks user interactions and generates dashboard insights.

### Overview Analytics

* Total Movies Explored
* Most Used OTT Provider
* Favorite Genre

### Provider Analytics

* Netflix Usage
* Prime Video Usage
* JioHotstar Usage
* Other Provider Distribution

### Genre Analytics

* Genre Preference Tracking
* Genre Distribution Charts


##  API Endpoints

### Authentication

| Method | Endpoint      |
| ------ | ------------- |
| POST   | /api/register |
| POST   | /api/login    |

### Movies

| Method | Endpoint                        |
| ------ | ------------------------------- |
| GET    | /api/search                     |
| GET    | /api/trending                   |
| GET    | /api/top-rated                  |
| GET    | /api/popular                    |
| GET    | /api/scifi                      |
| GET    | /api/horror                     |
| GET    | /api/movie/:id                  |
| GET    | /api/movie/:id/cast             |
| GET    | /api/movie/:id/trailer          |
| GET    | /api/movie/:id/providers        |
| GET    | /api/provider-content/:provider |

### Watchlist

| Method | Endpoint       |
| ------ | -------------- |
| GET    | /api/watchlist |
| POST   | /api/watchlist |

### Recommendations

| Method | Endpoint                 |
| ------ | ------------------------ |
| GET    | /api/recommend           |
| GET    | /api/recommend/watchlist |

### Analytics

| Method | Endpoint                 |
| ------ | ------------------------ |
| GET    | /api/analytics/overview  |
| GET    | /api/analytics/providers |
| GET    | /api/analytics/genres    |


##  Future Enhancements

* Unit Testing with Jest
* API Testing with Supertest
* Redis Caching
* Advanced Recommendation Algorithms
* Docker Deployment
* CI/CD Integration
* User Reviews & Ratings
* Real-Time Trending Analytics



##  Developer

Developed as a full-stack movie recommendation platform demonstrating:

* REST API Development
* MongoDB Integration
* JWT Authentication
* Recommendation System Design
* Analytics Dashboard Development
* External API Integration
* Backend Security Best Practices
