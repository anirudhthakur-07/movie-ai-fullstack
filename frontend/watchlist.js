// WATCHLIST MANAGEMENT
// Handles User Saved Movies & Watchlist Operations
var IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// PAGE INITIALIZATION
// Verify Authentication And Load Watchlist
window.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("token")) {
        window.location.href = "login.html";
        return;
    }
    renderWatchlistPage();
});
// AUTHENTICATED API REQUESTS
// Attach JWT Token To Protected Requests
async function authFetch(url, options = {}) {

    const token =
    localStorage.getItem("token");

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

        localStorage.removeItem("token");

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

function displayWatchlist(list, container) {
    container.innerHTML = '';
    if (!list || list.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🎬</div>
            <h2>No Movies Yet</h2>
            <p>Your watchlist is empty.</p>
            <!-- This adds the button back so it doesn't disappear -->
           <button class="browse-btn" onclick="goHome()">
    Browse Movies
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
       src="${poster ? IMG_BASE + poster : 'https://via.placeholder.com/300x450'}">

  <div class="watch-overlay">
    <div class="watch-title">${movie.title}</div>
  </div>
`;

        container.appendChild(card);
    });
}
