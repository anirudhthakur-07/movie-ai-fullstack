// TMDB API CLIENT
// Centralized Axios Instance

const axios = require("axios");

const tmdbApi = axios.create({
    baseURL: "https://api.tmdb.org/3",

timeout: 10000,

    params: {
        api_key: process.env.TMDB_API_KEY
    },

    headers: {
        Accept: "application/json"
    }
});

// Request Logger
tmdbApi.interceptors.request.use(config => {

    console.log(
        `[TMDB] ${config.method.toUpperCase()} ${config.url}`
    );

    return config;
});

// Error Logger
tmdbApi.interceptors.response.use(

    response => response,

    error => {

        console.error("\n========== TMDB ERROR ==========");

        console.error("Message :", error.message);
        console.error("Code    :", error.code);
        console.error("URL     :", error.config?.url);
        console.error("Method  :", error.config?.method);
        console.error("Timeout :", error.config?.timeout);
        console.error("Status  :", error.response?.status);
        console.error("Response:", error.response?.data);

        console.error("===============================\n");

        return Promise.reject(error);

    }

);

module.exports = tmdbApi;