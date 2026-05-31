// TMDB API CONFIGURATION
// Centralized Axios Instance For TMDB Requests
const axios = require("axios");

// TMDB AXIOS CLIENT
// Reusable API Client With Authentication
module.exports = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  params: {
    api_key: process.env.TMDB_API_KEY
  },
  timeout: 10000
});