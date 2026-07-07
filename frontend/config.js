const isLocal =
window.location.hostname === "localhost" ||
window.location.hostname === "127.0.0.1" ||
window.location.protocol === "file:";

const API_BASE = isLocal
? "http://localhost:5000/api"
: "https://movie-ai-backend-ql2a.onrender.com/api";

// Intercept all fetch calls to automatically attach the JWT token in headers
// and handle global 401 token expiry/invalidation redirects.
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
    if (typeof url === "string" && url.includes(API_BASE)) {
        const token = localStorage.getItem("authToken");
        if (token) {
            options.headers = options.headers || {};
            if (options.headers instanceof Headers) {
                options.headers.set("Authorization", `Bearer ${token}`);
            } else {
                options.headers["Authorization"] = `Bearer ${token}`;
            }
        }
    }
    
    const res = await originalFetch(url, options);

    // If unauthorized, clean up and redirect to login page
    if (res.status === 401 && typeof url === "string" && !url.includes("/login") && !url.includes("/register")) {
        sessionStorage.removeItem("sessionActive");
        localStorage.removeItem("authToken");
        // Clear watchlist and details caches on auth expiry
        localStorage.removeItem("cachedWatchlist");
        localStorage.removeItem("movieDetailsCache");
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith("policyAccepted_") || key.startsWith("unlocked_personas_")) {
                localStorage.removeItem(key);
            }
        });
        
        if (!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    }

    // Trigger global achievements check after state modifications (watchlist actions or rating actions)
    if (res.ok && typeof url === "string" && (url.includes("/watchlist") || url.includes("/rate") || url.includes("/explore"))) {
        setTimeout(() => {
            if (typeof window.checkAchievementsGlobal === "function") {
                window.checkAchievementsGlobal();
            }
        }, 1200); // 1.2s delay to let DB write complete
    }
    
    return res;
};