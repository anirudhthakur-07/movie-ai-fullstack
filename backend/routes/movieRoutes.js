// MOVIE ROUTES
// TMDB Movie Data, Search, Discovery & Streaming APIs
const express = require("express");
const router = express.Router();
const axios = require("axios");
const tmdbApi = require("../config/tmdb");
const TMDB_API_KEY =
process.env.TMDB_API_KEY;

const TMDB_BASE_URL =
"https://api.themoviedb.org/3";

router.get("/movie/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}`
    );

    res.json(response.data);
  } catch (err) {
    console.error("Error fetching movie:", err.message);
    res.status(500).json({ error: "Failed to fetch movie" });
  }
});

// MOVIE SEARCH
// Search Movies With Pagination Support
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.trim().length < 2) {
  return res.json({ results: [] });
}

    const response = await axios.get(
      `${TMDB_BASE_URL}/search/movie`,
      {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
          page: req.query.page || 1   
        }
      }
    );

    res.json({ results: response.data.results });

  } catch (err) {
    console.error("SEARCH ERROR:", err.message);
    res.json({ results: [] });
  }
});

// MOVIE CAST
// Fetch Top Cast Members For A Movie
router.get('/movie/:id/cast', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await tmdbApi.get(`/movie/${id}/credits`);
    const cast = response.data.cast.slice(0, 5); // top 5 actors

    res.json(cast);

  } catch (err) {
    console.error("CAST ERROR:", err.message);
    res.json([]);
  }
});

router.get('/movie/:id/trailer', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await tmdbApi.get(`/movie/${id}/videos`);
    const videos = response.data.results;
    //  Try to find best possible video
    let trailer = videos.find(v =>
      v.type === "Trailer" && v.site === "YouTube"
    );

    if (!trailer) {
      trailer = videos.find(v =>
        v.type === "Teaser" && v.site === "YouTube"
      );
    }

    if (!trailer) {
      trailer = videos.find(v => v.site === "YouTube");
    }

    if (!trailer) {
      return res.json({ trailer: null });
    }

    res.json({
      trailer: `https://www.youtube.com/embed/${trailer.key}`
    });

  } catch (err) {
    console.error("TRAILER ERROR:", err.message);
    res.json({ trailer: null });
  }
});

// TRENDING MOVIES
// Weekly Trending Movies From TMDB
router.get('/trending', async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/movie/week`,
      {
        params: {
          api_key: TMDB_API_KEY,
          page: req.query.page || 1   
        }
      }
    );

    res.json({ results: response.data.results });

  } catch (err) {
    console.error("TRENDING ERROR:", err.message);
    res.json({ results: [] });
  }
});
// STREAMING PROVIDERS
// Fetch OTT Platforms Available For A Movie
router.get('/movie/:id/providers', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await tmdbApi.get(`/movie/${id}/watch/providers`);
// 🇮🇳 INDIA PROVIDERS
const indiaProviders =response.data.results?.IN?.flatrate || [];

// 🇺🇸 US PROVIDERS
const usProviders =response.data.results?.US?.flatrate || [];

//  MERGE BOTH REGIONS
const providers = [
    ...indiaProviders,
    ...usProviders
];
   
    res.json(providers);

  } catch (err) {
    console.error("PROVIDERS ERROR:", err.message);

    res.json([]);
  }
});
// TOP RATED MOVIES
// Highest Rated Movies From TMDB
router.get('/top-rated', async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/top_rated`,
      {
        params: {
          api_key: TMDB_API_KEY,
          page: req.query.page || 1  
        }
      }
    );

    res.json({ results: response.data.results });

  } catch (err) {
    console.error("TOP RATED ERROR:", err.message);
    res.json({ results: [] });
  }
});
// POPULAR MOVIES
// Most Popular Movies From TMDB
router.get('/popular', async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/popular`,
      {
        params: {
          api_key: TMDB_API_KEY,
          page: req.query.page || 1  
        }
      }
    );

    res.json({ results: response.data.results });

  } catch (err) {
    console.error("POPULAR ERROR:", err.message);
    res.json({ results: [] });
  }
});

// SCIENCE FICTION MOVIES
// Fetch Movies Belonging To Sci-Fi Genre
router.get('/scifi', async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/movie`,
      {
        params: {
          api_key: TMDB_API_KEY,
          with_genres: 878,
          page: req.query.page || 1 
        }
      }
    );

    res.json({ results: response.data.results });

  } catch (err) {
    console.error("SCIFI ERROR:", err.message);
    res.json({ results: [] });
  }
});

// HORROR MOVIES
// Fetch Movies Belonging To Horror Genre
router.get('/horror', async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/movie`,
      {
        params: {
          api_key: TMDB_API_KEY,
          with_genres: 27,
          page: req.query.page || 1 
        }
      }
    );

    res.json({ results: response.data.results });

  } catch (err) {
    console.error("HORROR ERROR:", err.message);
    res.json({ results: [] });
  }
});

// PROVIDER FILTERED CONTENT
// Discover Movies Available On Specific OTT Platforms
router.get(
  "/provider-content/:provider",

  async (req, res) => {

    try {

      const provider =
      req.params.provider.toLowerCase();

      // TMDB provider IDs
      const providerMap = {

        netflix: 8,

        "amazon prime video": 119,

        "prime video": 119,

        "disney plus": 337,

        "jiohotstar": 122,

        "apple tv plus": 350,

        zee5: 232,

        "sony liv": 237
      };

      const providerId =
      providerMap[provider];

      if (!providerId) {

        return res.json({
          results: []
        });
      }

      // GET POPULAR MOVIES
      const response =
      await tmdbApi.get(

        "/discover/movie",

        {

          params: {

            with_watch_providers:
            providerId,

            watch_region: "IN",

            sort_by:
            "popularity.desc",

            page:
            req.query.page || 1
          }
        }
      );

      res.json({

        results:
        response.data.results
      });

    } catch (err) {

      console.error(
        "PROVIDER FILTER ERROR:",
        err.message
      );

      res.json({
        results: []
      });
    }
  }
);
// EXPORT ROUTER
module.exports = router;