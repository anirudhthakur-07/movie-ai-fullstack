// RECOMMENDATION ROUTES
// AI-Inspired Movie Recommendation Engine
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const tmdbApi = require("../config/tmdb");
const {buildUserProfile} = require("../services/profileEngine");
const { generateRecommendationExplanations } = require("../services/aiService");
const genreMap = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

async function getColdStartRecommendations() {
  const [trending, topRated] = await Promise.all([
    tmdbApi.get('/trending/movie/week'),
    tmdbApi.get('/movie/top_rated', { params: { page: 1 } })
  ]);

  const seen = new Set();
  const blended = [];

  for (const m of [
    ...trending.data.results.slice(0, 10),
    ...topRated.data.results.slice(0, 10)
  ]) {
    if (!seen.has(m.id) && m.poster_path) {
      seen.add(m.id);
      blended.push({
        ...m,
        explanations: ['Popular on Movie AI', 'Trending This Week']
      });
    }
  }

  return blended.slice(0, 20);
}

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
    
    // Fetch similar movies concurrently
    const similarPromises = movies.map(movie => 
      tmdbApi.get(`/movie/${movie.id}/similar`, {
        params: {
          page: Math.floor(Math.random() * 3) + 1
        }
      })
    );
    
    const similarResponses = await Promise.allSettled(similarPromises);
    similarResponses.forEach((res, idx) => {
      if (res.status === "fulfilled") {
        recommendations.push(...res.value.data.results);
      } else {
        console.log("Similar fetch failed:", movies[idx].id);
      }
    });
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
    if (!user) {
  return res.json({
    results: [],
    status: "user_missing"
  });
}
    // Increment AI recommendation views count
    user.recommendationViewsCount = (user.recommendationViewsCount || 0) + 1;
    await user.save();

const profile =
await buildUserProfile(req.userId);

if (!profile) {
  return res.json({
    results: [],
    status: "profile_missing"
  });
}
  const favoriteGenres = profile?.topGenres || [];
  const genreScores = {};
  favoriteGenres.forEach(g => {
    genreScores[g.genre.toLowerCase()] = g.count;
  });

  if (!user.watchlist || user.watchlist.length === 0) {
    const results = await getColdStartRecommendations();
    return res.json({ results, status: "cold_start" });
  }

  const movieIds = user.watchlist.map(m => m.tmdbId);
    const recent = movieIds.slice(-5);
    const older = movieIds.slice(0, 2);
    const selectedMovies = [...recent, ...older];
    const activeMovieIds = selectedMovies.filter(Boolean);
    let genreCount = {};
    const sourceMovieTitles = {};
    const moviePromises = activeMovieIds.map(id => tmdbApi.get(`/movie/${id}`));
    const movieResponses = await Promise.allSettled(moviePromises);

    movieResponses.forEach((res, index) => {
      const id = activeMovieIds[index];
      if (res.status === "fulfilled") {
        const response = res.value;
        response.data.genres.forEach(g => {
          genreCount[g.id] = (genreCount[g.id] || 0) + 1;
          sourceMovieTitles[id] = response.data.title;
        });
      } else {
        console.error("TMDB FAIL:", id);
      }
    });
    const sortedGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .map(g => g[0]);

    const topGenres = sortedGenres.slice(0, 2);
    const genreIds = topGenres.join(',');
    let recommendations = [];
    const promises = selectedMovies.map(id => tmdbApi.get(`/movie/${id}/recommendations`));
    
    // allSettled ensures that if one movie fetch fails, the rest still succeed
    const responses = await Promise.allSettled(promises);
    if (topGenres.length > 0) {

  try {

    const genreRes = await tmdbApi.get(
      '/discover/movie',
      {
        params: {
          with_genres: genreIds,
          sort_by: 'vote_average.desc',
          'vote_count.gte': 200
        }
      }
    );

    recommendations.push(
      ...genreRes.data.results
    );

  } catch (err) {

    console.log(
      "Genre discover failed"
    );

  }

}
   responses.forEach((res,index) => {

  if (
    res.status === "fulfilled" &&
    res.value.data.results
  ) {

    const sourceMovieId =
      selectedMovies[index];

    const sourceTitle =
      sourceMovieTitles[sourceMovieId];

    res.value.data.results.forEach(movie => {

      movie.sourceMovie =
        sourceTitle;

      recommendations.push(movie);

    });

  }

});
 const scoreMap = new Map();

recommendations.forEach(m => {
  if (
    !movieIds.includes(m.id) &&
    m.poster_path &&
    m.vote_average >= 5 &&
    m.vote_count > 100
  ) {
const explanations = [];

if (
 profile.activityLevel === "Power User"
) {
 explanations.push("Based on Viewing Activity");
}

(m.genre_ids || []).forEach(id => {

  const genreName = genreMap[id];

  if (genreName && genreScores[genreName.toLowerCase()]) {

   const shortGenres = {
  "Action": "Action Match",
  "Adventure": "Adventure Match",
  "Comedy": "Comedy Match",
  "Crime": "Crime Match",
  "Drama": "Drama Match",
  "Fantasy": "Fantasy Match",
  "Horror": "Horror Match",
  "Mystery": "Mystery Match",
  "Romance": "Romance Match",
  "Science Fiction": "Sci-Fi Match",
  "Thriller": "Thriller Match",
  "War": "War Match",
  "Animation": "Animation Match"
};

    explanations.push(
      shortGenres[genreName] ||
      `🎬 ${genreName} Fan`
    );
  }
});
if (m.sourceMovie) {

explanations.push(
  `Similar to ${m.sourceMovie}`
);
}
const uniqueExplanations =
[...new Set(explanations)]
.slice(0,3);
if (!scoreMap.has(m.id)) {

  scoreMap.set(m.id, {
    ...m,
    recommendationScore: 5,
    explanations: uniqueExplanations
  });

} else {

  scoreMap.get(m.id).recommendationScore += 5;

}
  }
});
 const refined = Array.from(scoreMap.values());
const activityBonus =
  profile.activityLevel === "Power User"
    ? 10
    : profile.activityLevel === "Active"
    ? 5
    : 0;
 const profileMultiplier =
  profile.profileStrength === "High"
    ? 2
    : profile.profileStrength === "Medium"
    ? 1.5
    : 1;
refined.sort((a, b) => {
const genreBonusA =
  (a.genre_ids || []).reduce((score, id) => {

    const genreName = genreMap[id];

    if (genreName && genreScores[genreName.toLowerCase()]) {

      return score +
        (genreScores[genreName.toLowerCase()] * profileMultiplier);

    }

    return score;

  }, 0);
  const genreBonusB =
  (b.genre_ids || []).reduce((score, id) => {

    const genreName = genreMap[id];

    if (genreName && genreScores[genreName.toLowerCase()]) {

      return score +
        (genreScores[genreName.toLowerCase()] * profileMultiplier);

    }

    return score;

  }, 0);


const scoreA =
  a.recommendationScore +
  genreBonusA +
  (a.vote_average * 3) +
  (a.popularity / 100) +
  activityBonus;

const scoreB =
  b.recommendationScore +
  genreBonusB +
  (b.vote_average * 3) +
  (b.popularity / 100) +
  activityBonus;
  return scoreB - scoreA;
});

const results = refined.slice(0, 20);
const top3 = results.slice(0, 3);
if (top3.length > 0) {
  try {
    const watchlistTitles = user.watchlist.map(w => w.title);
    const favoriteGenres = profile.topGenres?.map(tg => tg.genre) || [];
    const aiExplanations = await generateRecommendationExplanations(
      user.username,
      favoriteGenres,
      watchlistTitles,
      top3.map(m => ({ id: m.id, title: m.title, overview: m.overview }))
    );
    if (aiExplanations) {
      top3.forEach(m => {
        if (aiExplanations[m.id]) {
          m.explanations = [aiExplanations[m.id], ...(m.explanations || [])].slice(0, 3);
        }
      });
    }
  } catch (aiErr) {
    console.warn("Gemini explanations generation failed, falling back to rule-based:", aiErr.message);
  }
}

res.json({
  results,
  status: "ok"
});
  } catch (err) {
    console.error("WATCHLIST RECOMMEND ERROR:", err.message);
    res.json({ results: [] });
  }
// CO-VIEWING GROUP RECOMMENDATIONS
router.post('/recommend/group', auth, async (req, res) => {
  try {
    const { friendUsername } = req.body;
    if (!friendUsername) {
      return res.status(400).json({ error: "Friend username required" });
    }

    const cleanFriendUsername = String(friendUsername).trim();
    
    // Find users
    const [user, friend] = await Promise.all([
      User.findById(req.userId),
      User.findOne({ username: { $regex: new RegExp(`^${cleanFriendUsername}$`, "i") } })
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!friend) {
      return res.status(404).json({ error: `User "${friendUsername}" not found` });
    }
    if (friend._id.toString() === user._id.toString()) {
      return res.status(400).json({ error: "Cannot co-view with yourself" });
    }

    // Build user profiles
    const [userProfile, friendProfile] = await Promise.all([
      buildUserProfile(user._id),
      buildUserProfile(friend._id)
    ]);

    // Build combined genres weights
    const combinedGenresMap = {};
    const userGenreScores = {};
    const friendGenreScores = {};

    userProfile.topGenres.forEach(tg => {
      const g = tg.genre.toLowerCase();
      combinedGenresMap[g] = (combinedGenresMap[g] || 0) + tg.count;
      userGenreScores[g] = tg.count;
    });

    friendProfile.topGenres.forEach(tg => {
      const g = tg.genre.toLowerCase();
      combinedGenresMap[g] = (combinedGenresMap[g] || 0) + tg.count;
      friendGenreScores[g] = tg.count;
    });

    const sortedCombinedGenres = Object.entries(combinedGenresMap)
      .sort((a, b) => b[1] - a[1])
      .map(g => g[0]);

    const genreNameToId = {
      "action": 28, "adventure": 12, "animation": 16, "comedy": 35, "crime": 80,
      "documentary": 99, "drama": 18, "family": 10751, "fantasy": 14, "history": 36,
      "horror": 27, "music": 10402, "mystery": 9648, "romance": 10749,
      "science fiction": 878, "sci-fi": 878, "tv movie": 10770, "thriller": 53,
      "war": 10752, "western": 37
    };

    const topCombinedGenreIds = sortedCombinedGenres.slice(0, 2)
      .map(name => genreNameToId[name])
      .filter(Boolean);

    // Merge watchlists to avoid recommending already watched items
    const userWatchlistIds = (user.watchlist || []).map(m => m.tmdbId);
    const friendWatchlistIds = (friend.watchlist || []).map(m => m.tmdbId);
    const watchedIds = Array.from(new Set([...userWatchlistIds, ...friendWatchlistIds]));

    // Fetch movie recommendations from joint watchlist items
    const combinedWatchlist = [...(user.watchlist || []), ...(friend.watchlist || [])];
    const selectedIds = Array.from(new Set(combinedWatchlist.map(m => m.tmdbId))).slice(-6); // last 6 items
    
    let recommendations = [];
    
    // Fetch similarity lists in parallel
    const promises = selectedIds.map(id => tmdbApi.get(`/movie/${id}/recommendations`).catch(() => null));
    const responses = await Promise.all(promises);

    responses.forEach(res => {
      if (res && res.data && res.data.results) {
        recommendations.push(...res.data.results);
      }
    });

    // Also fetch discover list for top combined genres
    if (topCombinedGenreIds.length > 0) {
      try {
        const discoverRes = await tmdbApi.get('/discover/movie', {
          params: {
            with_genres: topCombinedGenreIds.join(','),
            sort_by: 'vote_average.desc',
            'vote_count.gte': 250
          }
        });
        if (discoverRes.data && discoverRes.data.results) {
          recommendations.push(...discoverRes.data.results);
        }
      } catch (discoverErr) {
        console.error("Group discover call failed:", discoverErr.message);
      }
    }

    const scoreMap = new Map();
    recommendations.forEach(m => {
      if (!watchedIds.includes(m.id) && m.poster_path && m.vote_average >= 5 && m.vote_count > 100) {
        const explanations = [];
        
        // Find matching genres to show tag reasoning
        (m.genre_ids || []).forEach(id => {
          const name = genreMap[id];
          if (name) {
            const lowerName = name.toLowerCase();
            if (userGenreScores[lowerName] && friendGenreScores[lowerName]) {
              explanations.push(`👥 Joint Match: ${name}`);
            } else if (userGenreScores[lowerName]) {
              explanations.push(`👤 Your Match: ${name}`);
            } else if (friendGenreScores[lowerName]) {
              explanations.push(`👤 Friend's Match: ${name}`);
            }
          }
        });

        explanations.push("🍿 Recommended for Co-Viewing");
        const uniqueExplanations = [...new Set(explanations)].slice(0, 3);

        if (!scoreMap.has(m.id)) {
          scoreMap.set(m.id, {
            ...m,
            recommendationScore: 5,
            explanations: uniqueExplanations
          });
        } else {
          scoreMap.get(m.id).recommendationScore += 5;
        }
      }
    });

    const refined = Array.from(scoreMap.values());
    refined.sort((a, b) => {
      const getGenreBonus = (movie) => {
        return (movie.genre_ids || []).reduce((score, id) => {
          const name = genreMap[id];
          if (name && combinedGenresMap[name.toLowerCase()]) {
            return score + combinedGenresMap[name.toLowerCase()];
          }
          return score;
        }, 0);
      };
      const scoreA = a.recommendationScore + getGenreBonus(a) + (a.vote_average * 3) + (a.popularity / 100);
      const scoreB = b.recommendationScore + getGenreBonus(b) + (b.vote_average * 3) + (b.popularity / 100);
      return scoreB - scoreA;
    });

    res.json({
      results: refined.slice(0, 20),
      friendUsername: friend.username
    });

  } catch (err) {
    console.error("GROUP RECOMMENDATION ERROR:", err.message);
    res.status(500).json({ error: "Group recommendation failed" });
  }
});

module.exports = router;