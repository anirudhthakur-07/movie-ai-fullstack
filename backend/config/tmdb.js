// TMDB API CLIENT
// Centralized Axios Instance with Auto-Sanitization Interceptors

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

// Helper: Strip all HTML tags to prevent cross-site scripting/formatting injection
function stripHTML(str) {
    if (typeof str !== "string") return str;
    return str.replace(/<[^>]*>/g, "");
}

// Helper: Recursively walk response trees to locate and sanitize content fields
function sanitizeTMDbData(data) {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(sanitizeTMDbData);
    }
    if (typeof data === "object") {
        for (const key in data) {
            if ((key === "overview" || key === "tagline" || key === "biography") && typeof data[key] === "string") {
                data[key] = stripHTML(data[key]);
            } else if (typeof data[key] === "object") {
                data[key] = sanitizeTMDbData(data[key]);
            }
        }
    }
    return data;
}

// Request Logger Interceptor
tmdbApi.interceptors.request.use(config => {
    console.log(`[TMDB] ${config.method.toUpperCase()} ${config.url}`);
    return config;
});

// Response interceptor: automatically sanitizes payload fields
tmdbApi.interceptors.response.use(
    response => {
        if (response.data) {
            response.data = sanitizeTMDbData(response.data);
        }
        return response;
    },
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