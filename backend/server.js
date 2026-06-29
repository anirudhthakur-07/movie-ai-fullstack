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
// EXPRESS APPLICATION SETUP
const app = express();
const movieRoutes =require("./routes/movieRoutes");
app.use(helmet());
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
app.use(express.json());
app.use(mongoSanitize());

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


// APPLICATION ROUTES
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
app.use(
    "/api",
    authRoutes
);
app.use(
    "/api/watchlist",
    watchlistRoutes
);
app.use(
    "/api/analytics",
    analyticsRoutes
);
app.use(
    "/api",
    profileRoutes
);
app.use(
    "/api/achievements",
    achievementRoutes
);
app.use(
    "/api/behavior",
    behaviorRoutes
);
// SERVER STARTUP
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_real_tmdb_api_key_here') {
    console.warn('\n⚠️ WARNING: TMDB_API_KEY is not set correctly in your .env file!');
    console.warn('⚠️ Please add your real API key to backend/.env and restart the server.\n');
  }
});

