// WATCHLIST ROUTES
// Manage User Movie Watchlist
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const tmdbApi = require("../config/tmdb");

router.post('/', auth, async (req, res) => {
  try {
    const { movie } = req.body;

    if (!movie || !movie.id) {
      return res.status(400).json({ error: "Invalid movie data" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const movieId = Number(movie.id);
    if (isNaN(movieId)) {
      return res.status(400).json({ error: "Invalid movie id" });
    }

    const exists = user.watchlist.find(m => m.tmdbId === movieId);

    if (exists) {
      await User.updateOne(
        { _id: req.userId },
        { $pull: { watchlist: { tmdbId: movieId } } }
      );
    } else {
      if (!movie.title) {
        return res.status(400).json({ error: "Movie title required" });
      }
      
      // Fetch genres from TMDB in background addition
      let genres = [];
      try {
        const tmdbRes = await tmdbApi.get(`/movie/${movieId}`);
        if (tmdbRes.data && tmdbRes.data.genres) {
          genres = tmdbRes.data.genres.map(g => g.name);
        }
      } catch (err) {
        console.error("Failed to fetch genres for watchlist movie:", err.message);
      }

      await User.updateOne(
        { _id: req.userId },
        {
          $addToSet: {
            watchlist: {
              tmdbId: movieId,
              title: movie.title,
              poster: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : movie.poster || null,
              genres: genres
            }
          }
        }
      );
    }

    const updatedUser = await User.findById(req.userId);
    res.json(updatedUser.watchlist);
  } catch (err) {
    console.error("WATCHLIST POST ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.json([]);
    }

    res.json(user.watchlist || []);
  } catch (err) {
    console.error("WATCHLIST ERROR:", err.message);
    res.json([]);
  }
});

// DELETE ALL ITEMS FROM WATCHLIST
router.delete('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await User.updateOne(
      { _id: req.userId },
      { $set: { watchlist: [] } }
    );

    res.json([]);
  } catch (err) {
    console.error("WATCHLIST DELETE ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
