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
            displayWatchlist(JSON.parse(cached), container);
        } catch { }
    } else {
        container.innerHTML = `
          <div class="loading-watchlist">
            Loading your watchlist...
          </div>
        `;
    }
    // Retrieve latest watchlist data from backend
    const list = await getWatchlist();
    console.log("WATCHLIST DATA:", list);

    localStorage.setItem("cachedWatchlist", JSON.stringify(list));


    displayWatchlist(list, container);
}

function resolvePoster(poster) {
  if (!poster) return 'https://via.placeholder.com/300x450';
  if (poster.startsWith('http')) return poster;
  return IMG_BASE + poster;
}

function displayWatchlist(list, container) {
    container.innerHTML = '';
    if (!list || list.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon-glow"><i class="fas fa-clapperboard"></i></div>
            <h2>Watchlist Empty</h2>
            <p>Explore trending releases, search for classics, and start building your personalized movie collection.</p>
            <button class="browse-btn" onclick="goHome()">
                Browse Titles
            </button>
          </div>
        `;
        return;
    }

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
    <span>${escapeHTML(movie.title)}</span>
  </div>

  <div class="watch-overlay">
    <div class="watch-title">${escapeHTML(movie.title)}</div>
  </div>
`;

        container.appendChild(card);
    });
}

window.logout = function () {
    sessionStorage.removeItem("token");
    window.location.href = "login.html";
};
