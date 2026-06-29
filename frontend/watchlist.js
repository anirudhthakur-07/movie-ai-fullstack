// WATCHLIST MANAGEMENT
// Handles User Saved Movies & Watchlist Operations
var IMG_BASE = 'https://image.tmdb.org/t/p/w500';

function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// PAGE INITIALIZATION
// Verify Authentication And Load Watchlist
window.addEventListener("DOMContentLoaded", () => {
    if (!sessionStorage.getItem("token")) {
        window.location.href = "login.html";
        return;
    }
    renderWatchlistPage();
});
// AUTHENTICATED API REQUESTS
// Attach JWT Token To Protected Requests
async function authFetch(url, options = {}) {

    const token =
    sessionStorage.getItem("token");

    if (!token) {

        window.location.href =
        "login.html";

        return null;
    }

    options.headers = {

        ...(options.headers || {}),

        Authorization:
        "Bearer " + token
    };

    const res =
    await fetch(url, options);

    if (res.status === 401) {

        sessionStorage.removeItem("token");

        window.location.href =
        "login.html";

        return null;
    }

    return res;
}

// FETCH WATCHLIST
// Retrieve User Watchlist From Backend
async function getWatchlist(retries = 3) {

    try {

        const res =
        await authFetch(`${API_BASE}/watchlist`);

        if (!res) return [];

        if (!res.ok)
            throw new Error("Failed");

        const data =
        await res.json();

        if (Array.isArray(data))
            return data;

        if (data.watchlist)
            return data.watchlist;

        return [];

    } catch (err) {

        if (retries > 0) {

            await new Promise(res =>
                setTimeout(res, 500)
            );

            return getWatchlist(retries - 1);
        }

        console.error(
            "Watchlist failed completely"
        );

        return [];
    }
}

// REMOVE WATCHLIST MOVIE
// Delete Movie From User Watchlist
async function removeFromWatchlist(id, btn, event) {
    event.stopPropagation();
    if (btn) {
        btn.innerText = "...";
        btn.disabled = true;
    }


try {

    const res =
    await authFetch(`${API_BASE}/watchlist`, {

        method: "POST",

        headers: {
            "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
            movie: {
                id: Number(id)
            }
        })
    });

    if (!res) {

        btn.disabled = false;
        return;
    }


        if (!res.ok) {
            console.error("Remove failed");
            return;
        }

      
        if (btn) {
            btn.closest('.watch-card').remove();
        }

    } catch (err) {
        console.error("Remove error:", err);
    }
}

window.goHome = function () {
    window.location.href = "index.html";
}
async function renderWatchlistPage() {
    const container = document.getElementById('watchlistPageRow');
    if (!container) return;

    // Load cached watchlist for faster page rendering
    const cached = localStorage.getItem("cachedWatchlist");
    if (cached) {
        try {
            const list = JSON.parse(cached);
            displayWatchlist(list, container);
        } catch { }
    } else {
        container.innerHTML = `
          <div class="loading-watchlist">
            Loading your watchlist...
          </div>
        `;
    }

    // Parallel fetch profile, watchlist
    const [profile, list] = await Promise.all([
        fetchUserProfile(),
        getWatchlist()
    ]);

    localStorage.setItem("cachedWatchlist", JSON.stringify(list));

    // Render primary components
    renderHeroCard(profile, list);
    renderRecentlyAdded(list);
    renderCollectionInsights(list, profile);
    displayWatchlist(list, container);

    // Fetch recommendations and explore log asynchronously
    renderAIPicks();
    renderContinueExploring();
}

async function fetchUserProfile() {
    try {
        const res = await authFetch(`${API_BASE}/profile`);
        if (!res || !res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function fetchWatchlistRecommendations() {
    try {
        const res = await authFetch(`${API_BASE}/recommend/watchlist`);
        if (!res || !res.ok) return { results: [], status: "empty" };
        return await res.json();
    } catch {
        return { results: [], status: "empty" };
    }
}

async function fetchSearchHistory() {
    try {
        const res = await authFetch(`${API_BASE}/history`);
        if (!res || !res.ok) return [];
        const data = await res.json();
        return data || [];
    } catch {
        return [];
    }
}

function renderHeroCard(profile, watchlist) {
    const heroCard = document.getElementById("watchlistHeroCard");
    if (!heroCard) return;

    if (!profile) {
        heroCard.classList.add("hidden");
        return;
    }

    heroCard.classList.remove("hidden");

    let avatarMarkup = "";
    if (profile.avatarUrl) {
        avatarMarkup = `<img src="${escapeHTML(profile.avatarUrl)}" alt="Avatar" class="watchlist-hero-avatar">`;
    } else {
        const initials = (profile.username || "U").substring(0, 2).toUpperCase();
        avatarMarkup = `<div class="watchlist-hero-avatar-text">${escapeHTML(initials)}</div>`;
    }

    const persona = profile.persona || "Analyzing taste DNA...";
    const currentLvl = profile.level || 1;
    const currentXp = profile.xp || 0;
    const xpNeededForNextLvl = currentLvl * 1000;
    const pct = Math.min(100, Math.floor((currentXp / xpNeededForNextLvl) * 100));

    const totalSaved = watchlist ? watchlist.length : 0;
    
    let favGenre = "None";
    if (watchlist && watchlist.length > 0) {
        const genreCounts = {};
        watchlist.forEach(m => {
            const g = m.genre || (m.genres && m.genres.length > 0 ? m.genres[0].name : "Unknown");
            if (g && g !== "Unknown") {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
            }
        });
        const genres = Object.keys(genreCounts);
        if (genres.length > 0) {
            genres.sort((a, b) => genreCounts[b] - genreCounts[a]);
            favGenre = genres[0];
        }
    }

    heroCard.innerHTML = `
        <div class="watchlist-hero-avatar-container">
            ${avatarMarkup}
        </div>
        <div class="watchlist-hero-info">
            <span class="watchlist-hero-persona">${escapeHTML(persona)}</span>
            <h2>${escapeHTML(profile.username || "Movie Explorer")}'s Universe</h2>
            <div class="watchlist-hero-xp-bar-container">
                <div class="watchlist-hero-xp-bar-wrapper">
                    <div class="watchlist-hero-xp-progress" style="width: ${pct}%"></div>
                </div>
                <div class="watchlist-hero-xp-labels">
                    <span>Level ${currentLvl}</span>
                    <span>${currentXp} / ${xpNeededForNextLvl} XP</span>
                </div>
            </div>
        </div>
        <div class="watchlist-hero-stats">
            <div class="watchlist-hero-stat-item">
                <span class="value">${totalSaved}</span>
                <span class="label">Saved Titles</span>
            </div>
            <div class="watchlist-hero-stat-item">
                <span class="value">${escapeHTML(favGenre)}</span>
                <span class="label">Favorite Genre</span>
            </div>
        </div>
    `;
}

function renderRecentlyAdded(watchlist) {
    const section = document.getElementById("recentlyAddedSection");
    const row = document.getElementById("recentlyAddedRow");
    if (!section || !row) return;

    if (!watchlist || watchlist.length === 0) {
        section.classList.add("hidden");
        return;
    }

    section.classList.remove("hidden");
    row.innerHTML = "";

    const recent = [...watchlist].reverse().slice(0, 10);
    displayRowMovies(recent, row);
}

async function renderAIPicks() {
    const section = document.getElementById("aiPicksSection");
    const row = document.getElementById("aiPicksRow");
    if (!section || !row) return;

    row.innerHTML = `<div class="loading-watchlist">Curating your AI recommendations...</div>`;
    section.classList.remove("hidden");

    const data = await fetchWatchlistRecommendations();

    if (!data.results || data.results.length === 0 || data.status === "empty" || data.status === "cold_start") {
        section.classList.add("hidden");
        return;
    }

    section.classList.remove("hidden");
    row.innerHTML = "";

    const items = data.results.slice(0, 15).map(m => {
        let reason = m.reason;
        if (!reason) {
            reason = "Recommended based on your taste profile";
        }
        return {
            ...m,
            reason,
            matchConfidence: m.matchConfidence || Math.floor(82 + (m.vote_average || 6) * 2)
        };
    });

    displayRowMovies(items, row, true);
}

async function renderContinueExploring() {
    const section = document.getElementById("continueExploringSection");
    const row = document.getElementById("continueExploringRow");
    if (!section || !row) return;

    const history = await fetchSearchHistory();

    if (!history || history.length === 0) {
        section.classList.add("hidden");
        return;
    }

    const lastQuery = history[history.length - 1]?.query;
    if (!lastQuery) {
        section.classList.add("hidden");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(lastQuery)}&page=1`);
        if (!res.ok) {
            section.classList.add("hidden");
            return;
        }
        const movies = await res.json();
        if (!movies || movies.length === 0) {
            section.classList.add("hidden");
            return;
        }

        section.classList.remove("hidden");
        row.innerHTML = "";
        displayRowMovies(movies.slice(0, 10), row);
    } catch {
        section.classList.add("hidden");
    }
}

function renderCollectionInsights(watchlist, profile) {
    const section = document.getElementById("collectionInsightsSection");
    const grid = document.getElementById("collectionInsightsGrid");
    if (!section || !grid) return;

    if (!watchlist || watchlist.length === 0) {
        section.classList.add("hidden");
        return;
    }

    section.classList.remove("hidden");
    grid.innerHTML = "";

    const totalSaved = watchlist.length;

    let totalRating = 0;
    let ratingCount = 0;
    watchlist.forEach(m => {
        const r = m.vote_average || m.rating;
        if (r) {
            totalRating += r;
            ratingCount++;
        }
    });
    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "N/A";

    const genreCounts = {};
    watchlist.forEach(m => {
        const g = m.genre || (m.genres && m.genres.length > 0 ? m.genres[0].name : "Unknown");
        if (g && g !== "Unknown") {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
        }
    });
    
    const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
    const topGenre = sortedGenres[0] || "None";
    const genreDiversity = Object.keys(genreCounts).length;

    const decadeCounts = {};
    watchlist.forEach(m => {
        const yearStr = m.release_date || m.year;
        if (yearStr) {
            const year = parseInt(yearStr);
            if (!isNaN(year)) {
                const decade = Math.floor(year / 10) * 10;
                decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
            }
        }
    });
    const sortedDecades = Object.keys(decadeCounts).sort((a, b) => decadeCounts[b] - decadeCounts[a]);
    const favDecade = sortedDecades[0] ? `${sortedDecades[0]}s` : "Unknown";

    let highestRatedMovie = null;
    watchlist.forEach(m => {
        const r = m.vote_average || m.rating;
        if (r) {
            if (!highestRatedMovie || r > (highestRatedMovie.vote_average || highestRatedMovie.rating)) {
                highestRatedMovie = m;
            }
        }
    });
    const bestTitle = highestRatedMovie ? highestRatedMovie.title : "None";

    grid.innerHTML = `
        <div class="insight-card">
            <h4><i class="fas fa-dna"></i> Watchlist DNA</h4>
            <div class="insight-metrics">
                <div class="insight-metric-item">
                    <span class="name">Total Saved Movies</span>
                    <span class="val">${totalSaved}</span>
                </div>
                <div class="insight-metric-item">
                    <span class="name">Average Rating</span>
                    <span class="val">⭐ ${avgRating}</span>
                </div>
                <div class="insight-metric-item">
                    <span class="name">Highest Rated</span>
                    <span class="val">${escapeHTML(bestTitle)}</span>
                </div>
            </div>
        </div>

        <div class="insight-card">
            <h4><i class="fas fa-film"></i> Genre Distribution</h4>
            <div class="insight-bar-chart">
                ${sortedGenres.slice(0, 3).map(g => {
                    const count = genreCounts[g];
                    const pct = Math.floor((count / totalSaved) * 100);
                    return `
                        <div class="insight-bar-row">
                            <div class="insight-bar-label-row">
                                <span>${escapeHTML(g)}</span>
                                <span>${count} (${pct}%)</span>
                            </div>
                            <div class="insight-bar-bg">
                                <div class="insight-bar-fill" style="width: ${pct}%"></div>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>

        <div class="insight-card">
            <h4><i class="fas fa-calendar-alt"></i> Collection Eras</h4>
            <div class="insight-metrics">
                <div class="insight-metric-item">
                    <span class="name">Favorite Decade</span>
                    <span class="val">${favDecade}</span>
                </div>
                <div class="insight-metric-item">
                    <span class="name">Unique Genres</span>
                    <span class="val">${genreDiversity}</span>
                </div>
                <div class="insight-metric-item">
                    <span class="name">Curator Tier</span>
                    <span class="val">${totalSaved > 15 ? "Elite" : totalSaved > 5 ? "Intermediate" : "Novice"}</span>
                </div>
            </div>
        </div>
    `;
}

function resolvePoster(poster) {
  if (!poster) return '';
  if (poster.startsWith('http')) return poster;
  return IMG_BASE + poster;
}

function displayWatchlist(list, container) {
    container.innerHTML = '';
    const heroCard = document.getElementById("watchlistHeroCard");
    const fullCollectionSection = document.getElementById("fullCollectionSection");

    if (!list || list.length === 0) {
        if (heroCard) heroCard.classList.add("hidden");
        if (fullCollectionSection) fullCollectionSection.style.display = "none";
        
        container.innerHTML = `
          <div class="empty-universe-state">
            <div class="empty-icon-glow"><i class="fas fa-clapperboard"></i></div>
            <h2>Universe Initializing</h2>
            <p>Your Movie Universe is empty. Construct your taste profile by saving titles and unlocking custom AI recommendations.</p>
            <div class="empty-universe-actions">
                <button class="browse-btn" onclick="goHome()">
                    <i class="fas fa-compass"></i> Discover Movies
                </button>
            </div>
            
            <div class="empty-universe-previews">
                <div class="preview-chip">
                    <span class="title">Taste DNA</span>
                    <span class="desc">Awaiting Data</span>
                </div>
                <div class="preview-chip">
                    <span class="title">Persona Affinity</span>
                    <span class="desc">Dormant</span>
                </div>
                <div class="preview-chip">
                    <span class="title">Achievements</span>
                    <span class="desc">Locked</span>
                </div>
            </div>
            
            <div class="empty-universe-suggestions">
                <h3>Suggested for Discovery</h3>
                <div class="suggestions-row" id="emptySuggestionsRow">
                    <div class="loading-watchlist">Loading suggestions...</div>
                </div>
            </div>
          </div>
        `;
        
        fetchSuggestions();
        return;
    }

    if (fullCollectionSection) fullCollectionSection.style.display = "block";

    list.forEach(movie => {
        const card = document.createElement('div');
        card.classList.add('watch-card');

        card.addEventListener("click", () => {
            openModal({
                id: movie.tmdbId || movie.id,
                title: movie.title || "Unknown",
                poster_path: movie.poster || movie.poster_path || ""
            });
        });

        const poster = movie.poster || movie.poster_path;

        card.innerHTML = `
  <button class="remove-btn"
    onclick="removeFromWatchlist(${movie.tmdbId || movie.id}, this, event)">
    ✖
  </button>

  <img class="watch-img" 
       src="${resolvePoster(poster)}"
       onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.classList.remove('hidden');">
  
  <div class="movie-placeholder-glow hidden">
    <i class="fas fa-film"></i>
  </div>

  <div class="watch-overlay">
    <div class="watch-title">${escapeHTML(movie.title)}</div>
  </div>
`;

        container.appendChild(card);
    });
}

async function fetchSuggestions() {
    const row = document.getElementById("emptySuggestionsRow");
    if (!row) return;
    try {
        const res = await fetch(`${API_BASE}/trending`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data && data.length > 0) {
            row.innerHTML = "";
            displayRowMovies(data.slice(0, 6), row);
        } else {
            row.innerHTML = `<div class="loading-watchlist">No suggestions available</div>`;
        }
    } catch {
        row.innerHTML = `<div class="loading-watchlist">Could not load suggestions</div>`;
    }
}

function displayRowMovies(movies, container, isRecommendation = false) {
    container.innerHTML = "";
    movies.forEach(movie => {
        const card = document.createElement("div");
        card.className = "movie-card";
        card.addEventListener("click", () => {
            openModal({
                id: movie.tmdbId || movie.id,
                title: movie.title || "Unknown",
                poster_path: movie.poster || movie.poster_path || ""
            });
        });

        const posterPath = movie.poster || movie.poster_path;
        const rating = movie.vote_average || movie.rating || 0;
        
        let badgesHtml = "";
        if (isRecommendation) {
            const matchPct = movie.matchConfidence || Math.floor(75 + Math.random() * 20);
            badgesHtml = `
                <div class="movie-badge-row">
                    <span class="movie-badge match-pct">${matchPct}% Match</span>
                </div>
            `;
        }

        card.innerHTML = `
            ${badgesHtml}
            <img class="movie-img skeleton" src="${resolvePoster(posterPath)}" alt="${escapeHTML(movie.title)}" onerror="this.onerror=null; this.classList.remove('skeleton'); this.style.display='none'; this.nextElementSibling.classList.remove('hidden');">
            <div class="movie-placeholder-glow hidden">
                <i class="fas fa-film"></i>
            </div>
            <div class="movie-info-overlay">
                <div class="movie-title">${escapeHTML(movie.title)}</div>
                <div class="movie-rating">⭐ ${rating ? rating.toFixed(1) : "N/A"}</div>
                ${isRecommendation && movie.reason ? `<span class="rec-reason-indicator">${escapeHTML(movie.reason)}</span>` : ""}
            </div>
        `;
        
        container.appendChild(card);
        
        const img = card.querySelector(".movie-img");
        img.onload = () => {
            img.classList.remove("skeleton");
            img.classList.add("loaded");
        };
        if (img.complete) {
            img.classList.remove("skeleton");
            img.classList.add("loaded");
        }
    });
}

window.scrollWatchlistRow = function(rowId, direction) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const scrollAmount = row.clientWidth * 0.75;
    row.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
};

window.logout = function () {
    sessionStorage.removeItem("token");
    window.location.href = "login.html";
};
