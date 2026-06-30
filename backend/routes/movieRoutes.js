// MOVIE ROUTES
// TMDB Movie Data, Search, Discovery & Streaming APIs
const express = require("express");
const router = express.Router();
const tmdbApi = require("../config/tmdb");
router.get("/movie/:id", async (req, res) => {

    try {

        const response = await tmdbApi.get(
            `/movie/${req.params.id}`
        );

        res.json(response.data);

    } catch (err) {

        console.error("MOVIE DETAILS ERROR:", err.message);

        res.status(500).json({
            error: "Failed to fetch movie"
        });

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

const response = await tmdbApi.get(
    "/search/movie",
    {
        params: {
            query,
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
  const response = await tmdbApi.get(
  "/trending/movie/week",
  {
    params: {
      page: req.query.page || 1
    }
  }
);

    res.json({ results: response.data.results });

  } catch (err) {
    console.error("TRENDING ERROR");
    console.error(err.response?.data);
    console.error(err.response?.status);
    console.error(err.message);
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
   const response = await tmdbApi.get(
  "/movie/top_rated",
  {
    params: {
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
    const response = await tmdbApi.get(
  "/movie/popular",
  {
    params: {
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
  const response = await tmdbApi.get(
  "/discover/movie",
  {
    params: {
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
    const response = await tmdbApi.get(
  "/discover/movie",
  {
    params: {
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
// DYNAMIC GENRE DISCOVERY
// Resolves genre names to TMDB genre IDs and retrieves matching content, falling back to search
router.get("/discover/genre/:genreName", async (req, res) => {
  try {
    const genreName = req.params.genreName.toLowerCase().trim();
    const page = req.query.page || 1;

    const genreIdMap = {
      action: 28,
      adventure: 12,
      animation: 16,
      comedy: 35,
      crime: 80,
      documentary: 99,
      drama: 18,
      family: 10751,
      fantasy: 14,
      history: 36,
      horror: 27,
      music: 10402,
      mystery: 9648,
      romance: 10749,
      "science fiction": 878,
      "sci-fi": 878,
      thriller: 53,
      war: 10752,
      western: 37
    };

    const genreId = genreIdMap[genreName];

    if (genreId) {
      const response = await tmdbApi.get("/discover/movie", {
        params: {
          with_genres: genreId,
          page: page
        }
      });
      return res.json({ results: response.data.results });
    }

    // Fallback to text query search if the genre name is not in the map
    const response = await tmdbApi.get("/search/movie", {
      params: {
        query: genreName,
        page: page
      }
    });
    res.json({ results: response.data.results });

  } catch (err) {
    console.error("GENRE DISCOVER ERROR:", err.message);
    res.json({ results: [] });
  }
});

// EXPORT ROUTER
module.exports = router;