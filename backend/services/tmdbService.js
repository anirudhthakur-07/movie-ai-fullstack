const tmdbApi = require("../config/tmdb");

async function getMovie(id) {
    const response = await tmdbApi.get(`/movie/${id}`);
    return response.data;
}

async function searchMovies(query, page = 1) {
    const response = await tmdbApi.get("/search/movie", {
        params: {
            query,
            page
        }
    });

    return response.data.results;
}

async function getTrending(page = 1) {
    const response = await tmdbApi.get("/trending/movie/week", {
        params: {
            page
        }
    });

    return response.data.results;
}

async function getPopular(page = 1) {
    const response = await tmdbApi.get("/movie/popular", {
        params: {
            page
        }
    });

    return response.data.results;
}

async function getTopRated(page = 1) {
    const response = await tmdbApi.get("/movie/top_rated", {
        params: {
            page
        }
    });

    return response.data.results;
}

async function getSciFi(page = 1) {
    const response = await tmdbApi.get("/discover/movie", {
        params: {
            with_genres: 878,
            page
        }
    });

    return response.data.results;
}

async function getHorror(page = 1) {
    const response = await tmdbApi.get("/discover/movie", {
        params: {
            with_genres: 27,
            page
        }
    });

    return response.data.results;
}

module.exports = {
    getMovie,
    searchMovies,
    getTrending,
    getPopular,
    getTopRated,
    getSciFi,
    getHorror
};