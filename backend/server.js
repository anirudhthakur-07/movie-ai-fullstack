// ENVIRONMENT CONFIGURATION & DEPENDENCIES
require('dotenv').config();

const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'TMDB_API_KEY'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required env var: ${key}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Movie = require('./models/Movie');
const User = require('./models/User');
const helmet = require("helmet");
const mongoSanitize =require("express-mongo-sanitize");
const ProviderClick =require("./models/ProviderClick");
const rateLimit =require("express-rate-limit");
const morgan = require("morgan");

// MIDDLEWARE & ROUTE IMPORTS
const searchHistoryRoutes =
require("./routes/searchHistoryRoutes");
const auth =require("./middleware/auth");
const analyticsRoutes =require("./routes/analyticsRoutes");
const watchlistRoutes =require("./routes/watchlistRoutes");
const authRoutes =require("./routes/authRoutes");
const recommendationRoutes =require("./routes/recommendationRoutes");
const profileRoutes =require("./routes/profileRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const behaviorRoutes    = require("./routes/behaviorRoutes");
const nyxRoutes         = require("./routes/nyxRoutes");
const slackRoutes       = require("./slack/slackRoutes");
// EXPRESS APPLICATION SETUP
const app = express();
const movieRoutes =require("./routes/movieRoutes");

// TRUST PROXY — Required for Render/Vercel deployments
// Enables express-rate-limit to read client IP from X-Forwarded-For
// instead of the proxy's internal IP address
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://image.tmdb.org"
        ],
        connectSrc: [
          "'self'",
          "http://localhost:5000",
          "https://movie-ai-backend-ql2a.onrender.com"
        ],
        frameSrc: [
          "'self'",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com"
        ]
      }
    }
  })
);
// SECURITY CONFIGURATION
// Helmet → Secure HTTP Headers
// Rate Limiter → Prevent API Abuse
const limiter = rateLimit({

    windowMs:
    15 * 60 * 1000,

    max: 700,

    message:
    "Too many requests"
});

app.use(limiter);
app.use(morgan("dev"));

// DATABASE CONNECTION
// MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Mongo Error:", err));
  // APPLICATION CONFIGURATION
const PORT = process.env.PORT || 5000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// GLOBAL MIDDLEWARE
// CORS, JSON Parsing, Input Sanitization
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
      "http://127.0.0.1:5502",
  "http://localhost:5502",
    "https://movie-ai-fullstack.vercel.app"
  ],
  credentials: true
}));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(mongoSanitize());

// Custom Cookie Parser Middleware
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts[0]) {
        req.cookies[parts[0].trim()] = (parts[1] || '').trim();
      }
    });
  }
  next();
});

// MOVIE DATABASE ROUTES
// Fetch Stored Movies From MongoDB
app.get('/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// OTT PROVIDER CLICK TRACKING
// Stores User Streaming Platform Interactions
app.post("/api/provider-click", auth, async (req, res) => {

    try {

        const {
            movieId,
            movieTitle,
            provider,
            genre
        } = req.body;
const allowedProviders = [

    "Netflix",

    "Amazon Prime Video",
    "Prime Video",

    "Disney Plus",
    "Disney+ Hotstar",
    "Disney Hotstar",
    "Hotstar",
    "JioHotstar",

    "ZEE5",
    "Zee5",

    "Sony LIV",
    "SonyLIV",
    "Sony Liv",

    "Apple TV",
    "Apple TV Plus",
    "AppleTV",

    "Crunchyroll"
];
if (
    !movieId ||
    !movieTitle ||
    !provider ||
    !genre
) {

    return res.status(400).json({
        error: "Missing fields"
    });
}

if (
    !allowedProviders.includes(provider)
) {

    return res.status(400).json({
        error: "Invalid provider"
    });
}

if (
    movieTitle.length > 120 ||
    genre.length > 40
) {

    return res.status(400).json({
        error: "Invalid data"
    });
}
     const click =
new ProviderClick({

    userId: req.userId,

    movieId,

    movieTitle,

    provider: provider.trim().toLowerCase(),
    genre: genre.trim().toLowerCase()
});

        await click.save();

        // Increment recommendation interactions on user model
        const user = await User.findById(req.userId);
        if (user) {
            user.recommendationInteractionsCount = (user.recommendationInteractionsCount || 0) + 1;
            await user.save();
        }

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Failed to track click"
        });
    }
});


// SLACK INTEGRATION ROUTES (mounted before auth-protected /api routes)
app.use(
    "/api/slack",
    slackRoutes
);

// APPLICATION ROUTES
app.use(
    "/api",
    authRoutes
);
app.use(
    "/api",
    searchHistoryRoutes
);
app.use(
    "/api",
    movieRoutes
);
app.use(
    "/api",
    recommendationRoutes
);
const sensitiveRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests to this endpoint. Please try again later." }
});

app.use(
    "/api/watchlist",
    sensitiveRouteLimiter,
    watchlistRoutes
);
app.use(
    "/api/analytics",
    sensitiveRouteLimiter,
    analyticsRoutes
);
app.use(
    "/api",
    sensitiveRouteLimiter,
    profileRoutes
);
app.use(
    "/api/achievements",
    sensitiveRouteLimiter,
    achievementRoutes
);
app.use(
    "/api/behavior",
    sensitiveRouteLimiter,
    behaviorRoutes
);
app.use(
    "/api/nyx",
    nyxRoutes
);
// SERVER STARTUP
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_real_tmdb_api_key_here') {
    console.warn('\n⚠️ WARNING: TMDB_API_KEY is not set correctly in your .env file!');
    console.warn('⚠️ Please add your real API key to backend/.env and restart the server.\n');
  }
});

