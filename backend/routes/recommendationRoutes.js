// RECOMMENDATION ROUTES
// AI-Inspired Movie Recommendation Engine
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const tmdbApi = require("../config/tmdb");
const {buildUserProfile} = require("../services/profileEngine");
// SEARCH-BASED RECOMMENDATIONS
// Generates Recommendations Using Search Query,
// Similar Movies & Genre Matching
router.get('/recommend', async (req, res) => {
  const query = req.query.q;
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Invalid query' });
  }

  try {
    // 1st: Find the movie to get its ID and genres
    const searchResponse = await tmdbApi.get('/search/movie', { params: { query } });
    if (searchResponse.data.results.length === 0) {
      return res.json({ results: [] });
    }

    const movies = searchResponse.data.results.slice(0, 3);
    let recommendations = [];
    for (let movie of movies) {
      try {
        const similarRes = await tmdbApi.get(`/movie/${movie.id}/similar`, {
          params: {
            page: Math.floor(Math.random() * 3) + 1
          }
        });

        recommendations.push(...similarRes.data.results);

      } catch (err) {
        console.log("Similar fetch failed:", movie.id);
      }
    }
    const genreSet = new Set();

    movies.forEach(m => {
      (m.genre_ids || []).forEach(g => genreSet.add(g));
    });

    const genreIds = Array.from(genreSet).slice(0, 2).join(',');

    if (genreIds) {
      try {
        const genreRes = await tmdbApi.get('/discover/movie', {
          params: {
            with_genres: genreIds,
            sort_by: 'popularity.desc'
          }
        });

        recommendations.push(...genreRes.data.results);
      } catch (err) {
        console.log("Genre fetch failed");
      }
    }


    const filtered = recommendations.filter(m =>
      m.poster_path &&
      m.vote_average >= 5 &&
      m.vote_count > 50

    );

    const uniqueMap = new Map();
    filtered.forEach(m => {
      if (!uniqueMap.has(m.id)) {
        uniqueMap.set(m.id, m);
      }
    });

    const page = Number(req.query.page) || 1;
    const limit = 10;
    const start = (page - 1) * limit;
    const seed = Date.now();
    const final = Array.from(uniqueMap.values())
      .sort(() => (seed % 2 === 0 ? Math.random() - 0.5 : Math.random() - 0.3))
      .slice(0, 40);

    res.json({
      results: final.slice(start, start + limit),
      hasMore: start + limit < final.length
    });
  } catch (error) {
    console.error('FULL ERROR:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch from TMDB' });
  }
});

// WATCHLIST-BASED RECOMMENDATIONS
// Personalized Recommendations Based On
// User Viewing Preferences & Favorite Genres
router.get('/recommend/watchlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

const profile =
  await buildUserProfile(req.userId);
    if (!user.watchlist || user.watchlist.length === 0) {
      return res.json({ results: [], status: "empty" });
    }

    if (user.watchlist.length < 3) {
      return res.json({ results: [], status: "insufficient" });
    }
    const movieIds = user.watchlist.map(m => m.tmdbId);

    let genreCount = {};

    for (let id of movieIds.slice(0, 5)) {
      if (!id) continue;

      try {
        const response = await tmdbApi.get(`/movie/${id}`);

        response.data.genres.forEach(g => {
          genreCount[g.id] = (genreCount[g.id] || 0) + 1;
        });
      } catch (err) {
        console.error("TMDB FAIL:", id);
      }
    }
    const sortedGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .map(g => g[0]);

    const topGenres = sortedGenres.slice(0, 2);
    const genreIds = topGenres.join(',');
    let recommendations = [];
    const recent = movieIds.slice(-5);
const older = movieIds.slice(0, 2);
    const selectedMovies = [...recent, ...older];

   
    const promises = selectedMovies.map(id => tmdbApi.get(`/movie/${id}/recommendations`));
    
    // allSettled ensures that if one movie fetch fails, the rest still succeed
    const responses = await Promise.allSettled(promises);
    
    responses.forEach(res => {
      if (res.status === 'fulfilled' && res.value.data.results) {
        recommendations.push(...res.value.data.results);
      }
    });
    if (topGenres.length > 0) {
      const genreRes = await tmdbApi.get('/discover/movie', {
        params: {
          with_genres: topGenres.join(','),
          sort_by: 'vote_average.desc',
          'vote_count.gte': 200
        }
      });

      recommendations.push(...genreRes.data.results);
    }
 const scoreMap = new Map();

recommendations.forEach(m => {

  if (
    !movieIds.includes(m.id) &&
    m.poster_path &&
    m.vote_average >= 5 &&
    m.vote_count > 100
  ) {

    if (!scoreMap.has(m.id)) {

      scoreMap.set(m.id, {
        ...m,
        recommendationScore: 5
      });

    } else {

      scoreMap.get(m.id).recommendationScore += 5;

    }
  }
});
 const refined = Array.from(scoreMap.values());

refined.sort((a, b) => {

const activityBonus =
  profile.activityLevel === "Power User"
    ? 10
    : profile.activityLevel === "Active"
    ? 5
    : 0;

const scoreA =
  a.recommendationScore +
  (a.vote_average * 3) +
  (a.popularity / 100) +
  activityBonus;

const scoreB =
  b.recommendationScore +
  (b.vote_average * 3) +
  (b.popularity / 100) +
  activityBonus;
  return scoreB - scoreA;
});

res.json({
  results: refined.slice(0, 20),
  status: "ok"
    });
  } catch (err) {
    console.error("WATCHLIST RECOMMEND ERROR:", err.message);
    res.json({ results: [] });
  }
});
// EXPORT ROUTER
module.exports = router;