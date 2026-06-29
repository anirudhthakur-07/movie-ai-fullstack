// MOVIE RECOMMENDATION PLATFORM
// Main Application Logic & User Interaction System
// AUTHENTICATED API REQUESTS
// Attach JWT Token To Protected Requests
async function authFetch(url, options = {}) {

  const token = localStorage.getItem("token");

  //  NO TOKEN
  if (!token) {
    window.location.href = "login.html";
    return null;
  }

  // DEFAULT HEADERS
  options.headers = {
    ...(options.headers || {}),
    "Authorization": "Bearer " + token
  };

  try {

    const response = await fetch(url, options);

    //  TOKEN EXPIRED / INVALID
    if (response.status === 401) {

      console.warn("Session expired");

      localStorage.removeItem("token");

      alert("Session expired. Please login again.");

      window.location.href = "login.html";

      return null;
    }

    return response;

  } catch (err) {

    console.error("Auth fetch failed:", err);

    return null;
  }
}

// APPLICATION STATE MANAGEMENT
// Caching, Pagination & Runtime Variables
let heroInterval = null;
let currentPage = 1;
let currentQuery = '';
var IMG_BASE = 'https://image.tmdb.org/t/p/w500';
let actionPage = 1;
let comedyPage = 1;
let trendingPage = 1;
let actionCache = {};
let comedyCache = {};
let topRatedCache = {};
let popularCache = {};
let scifiCache = {};
let horrorCache = {};
let trendingCache = {};
// DOM Elements
let analyticsGenrePage = 1;
let analyticsProviderPage = 1;
let searchSpinner, searchResultsSection, recommendationsSection;
let searchResultsRow, recommendationsRow, noResultsMsg;
let loadMoreBtn;
let trendingRow, actionRow, comedyRow;
let topRatedRow, popularRow, scifiRow, horrorRow;
let historyRow;
let historyBtn;
let historyDropdown;
let historySection;
let watchlistRecRow;
let topRatedPage = 1;
let popularPage = 1;
let scifiPage = 1;
let horrorPage = 1;
let userWatchlist = [];
let recCache = [];
let recPage = 1;
let watchlistCache = [];
let watchlistPage = 1;
 
// MOVIE CATEGORY LOADERS
// Fetch Trending, Popular & Genre-Based Movies
async function loadTopRated() {
  const data = await fetchMovies(`/top-rated`);

  if (!data) {
    setTimeout(loadTopRated, 2000);
    return;
  }

  displayMovies(data, topRatedRow);
}
async function loadPopular() {
  const data = await fetchMovies(`/popular`);
  if (!data) {
    setTimeout(loadPopular, 2000);
    return;
  }

  displayMovies(data, popularRow);
}

async function loadScifi() {
  const data = await fetchMovies(`/scifi`);
  if (!data) {
    setTimeout(loadScifi, 2000);
    return;
  }

  displayMovies(data, scifiRow);
}

async function loadHorror() {
  const data = await fetchMovies(`/horror`);

  if (!data) {
    setTimeout(loadHorror, 2000);
    return;
  }

  displayMovies(data, horrorRow);
}

// CATEGORY PAGINATION
// Dynamic Loading For Infinite Scrolling Rows
function loadMoreAction(direction = 1) {
  const row = actionRow;

  if (row.dataset.loading === "true") return;
  row.dataset.loading = "true";

  actionPage += direction;
  if (actionPage < 1) actionPage = 1;

  if (actionCache[actionPage]) {
    displayMovies(actionCache[actionPage], row);
    row.dataset.loading = "false";
    return;
  }

  fetchMovies(`/search?q=action&page=${actionPage}`)
    .then(data => {
      actionCache[actionPage] = data;
      displayMovies(data, row);
      row.dataset.loading = "false";
    });
}
function loadMoreComedy(direction = 1) {
  const row = comedyRow;

  if (row.dataset.loading === "true") return;
  row.dataset.loading = "true";

  comedyPage += direction;
  if (comedyPage < 1) comedyPage = 1;

  if (comedyCache[comedyPage]) {
    displayMovies(comedyCache[comedyPage], row);
    row.dataset.loading = "false";
    return;
  }

  fetchMovies(`/search?q=comedy&page=${comedyPage}`)
    .then(data => {
      comedyCache[comedyPage] = data;
      displayMovies(data, row);
      row.dataset.loading = "false";
    });
}
function loadMoreTopRated(direction = 1) {
  const row = topRatedRow;

  if (row.dataset.loading === "true") return;
  row.dataset.loading = "true";

  topRatedPage += direction;
  if (topRatedPage < 1) topRatedPage = 1;

  if (topRatedCache[topRatedPage]) {
    displayMovies(topRatedCache[topRatedPage], row);
    row.dataset.loading = "false";
    return;
  }

  fetchMovies(`/top-rated?page=${topRatedPage}`)
    .then(data => {
      topRatedCache[topRatedPage] = data;
      displayMovies(data, row);
      row.dataset.loading = "false";
    });
}
function loadMorePopular(direction = 1) {
  const row = popularRow;

  if (row.dataset.loading === "true") return;
  row.dataset.loading = "true";

  popularPage += direction;
  if (popularPage < 1) popularPage = 1;

  if (popularCache[popularPage]) {
    displayMovies(popularCache[popularPage], row);
    row.dataset.loading = "false";
    return;
  }

  fetchMovies(`/popular?page=${popularPage}`)
    .then(data => {
      popularCache[popularPage] = data;
      displayMovies(data, row);
      row.dataset.loading = "false";
    });
}
function loadMoreScifi(direction = 1) {
  const row = scifiRow;

  if (row.dataset.loading === "true") return;
  row.dataset.loading = "true";

  scifiPage += direction;
  if (scifiPage < 1) scifiPage = 1;

  if (scifiCache[scifiPage]) {
    displayMovies(scifiCache[scifiPage], row);
    row.dataset.loading = "false";
    return;
  }

  fetchMovies(`/scifi?page=${scifiPage}`)
    .then(data => {
      scifiCache[scifiPage] = data;
      displayMovies(data, row);
      row.dataset.loading = "false";
    });
}
function loadMoreHorror(direction = 1) {
  const row = horrorRow;

  if (row.dataset.loading === "true") return;
  row.dataset.loading = "true";

  horrorPage += direction;
  if (horrorPage < 1) horrorPage = 1;

  if (horrorCache[horrorPage]) {
    displayMovies(horrorCache[horrorPage], row);
    row.dataset.loading = "false";
    return;
  }

  fetchMovies(`/horror?page=${horrorPage}`)
    .then(data => {
      horrorCache[horrorPage] = data;
      displayMovies(data, row);
      row.dataset.loading = "false";
    });
}
// INITIAL CONTENT LOADING
// Populate Homepage Movie Sections
async function fetchInitialMovies() {
  // Using Chat API to get action and comedy!
  const action = await fetchMovies('/search?q=action');
  if (action) displayMovies(action, actionRow);

  const comedy = await fetchMovies('/search?q=comedy');
  if (comedy) displayMovies(comedy, comedyRow);
}

// MOVIE API SERVICE
// Centralized Movie Fetching With Retry Logic
async function fetchMovies(endpoint, retries = 3) {
  try {
   const response =
await fetch(`${API_BASE}${endpoint}`,{
    cache:"no-store"
});

    if (!response.ok) throw new Error("API failed");

    const data = await response.json();
    const movies = data.results || data;

    if (!movies || movies.length === 0) {
      throw new Error("Empty data");
    }

    return movies;
  } catch (error) {
    console.warn(`Retrying ${endpoint}... Attempts left: ${retries}`);

    if (retries > 0) {
      await new Promise(res => setTimeout(res, 800));
      return fetchMovies(endpoint, retries - 1);
    }

    console.error("Final failure:", endpoint);
    return null;
  }
}

// WATCHLIST MANAGEMENT
// User Saved Movies & Personalized Recommendations
async function loadUserWatchlist() {
  try {
   
const res = await authFetch(`${API_BASE}/watchlist`);

if (!res) return;
    userWatchlist = await res.json();

  } catch (err) {
    console.error("Failed to load watchlist");
  }
}
async function fetchWatchlistRecommendations() {
  try {
    const res = await authFetch(
  `${API_BASE}/recommend/watchlist?t=${Date.now()}`
);

if (!res) {
  return { results: [], status: "error" };
}
    const data = await res.json();
    return data;

  } catch (err) {
    return { results: [], status: "error" };
  }
}
async function loadWatchlistRecommendations(reset = false) {

  const text = document.getElementById("refreshText");
  if (text) text.classList.remove("hidden");

  const data = await fetchWatchlistRecommendations();

  //  CLEAR ONLY IF RESET
  if (reset) {
    watchlistRecRow.innerHTML = "";
    watchlistCache = [];
    watchlistPage = 1;
  }

  //  REMOVE OLD MESSAGE
  const oldMsg = document.querySelector(".empty-msg");
  if (oldMsg) oldMsg.remove();

  //  NO MOVIES (legacy fallback)
  if (data.status === "empty") {
    showWatchlistMessage("Add movies to your watchlist to get recommendations 🎯");
    if (text) text.classList.add("hidden");
    return;
  }

  // NO MATCHES
  if (!data.results || data.results.length === 0) {
    if (data.status === "insufficient") {
      showWatchlistMessage("Not enough data to recommend yet 🤖");
    } else {
      showWatchlistMessage("No strong matches found 😅");
    }
    if (text) text.classList.add("hidden");
    return;
  }

  if (reset || watchlistCache.length === 0) {
    watchlistRecRow.innerHTML = "";
    watchlistCache = data.results;
    watchlistPage = 1;
  }

  const start = (watchlistPage - 1) * 10;
  const nextBatch = watchlistCache.slice(start, start + 10);

  if (nextBatch.length > 0) {
    displayMovies(nextBatch, watchlistRecRow);
  }

  if (text) text.classList.add("hidden");
}
function showWatchlistMessage(text) {
  const msg = document.createElement("div");
  msg.className = "empty-msg";
  msg.innerText = text;

  watchlistRecRow.parentElement.appendChild(msg);
}
async function loadHistory() {

    try {

        const res = await authFetch(
            `${API_BASE}/history`
        );

        if (!res) return;

        const history = await res.json();

        renderHistory(history);

    } catch (err) {

        console.error(
            "History load failed",
            err
        );
    }
}
function renderHistory(history) {

    if (!historyRow || !historyBtn) return;

    historyRow.innerHTML = "";

    // Hide history button if no history
    if (!history || history.length === 0) {

        historyBtn.style.display = "none";

        historySection.classList.add("hidden");

        return;
    }

    // Show button if history exists
    historyBtn.style.display = "block";

    history.forEach(item => {

        const chip =
        document.createElement("button");

        chip.className =
        "history-chip";

        chip.innerHTML =
        `<i class="fas fa-history"></i>
        ${item.query}`;

        chip.onclick = () => {

            searchMovie(item.query);
        };

        historyRow.appendChild(chip);
    });
}
// MOVIE SEARCH ENGINE
// Search Movies And Generate Recommendations
async function searchMovie(query) {

  query = query.trim();

  if (!query) return;

  currentQuery = query;
  currentPage = 1;

  searchResultsRow.innerHTML = "";
  recommendationsRow.innerHTML = "";

  // Hide sections initially
  searchResultsSection.classList.add("hidden");
  recommendationsSection.classList.add("hidden");

  const data = await fetchMovies(
    `/search?q=${encodeURIComponent(query)}&page=1`
  );

  // No search results
  if (!data || data.length === 0) {

    searchResultsRow.innerHTML = `
      <p class="empty-search">
        No movies found for "${query}"
      </p>
    `;

    searchResultsSection.classList.remove("hidden");

    return; // STOP HERE
  }

  // Valid search results
  searchResultsSection.classList.remove("hidden");
  displayMovies(data, searchResultsRow);
   const historyRes = await authFetch(
    `${API_BASE}/history`,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query
        })
    }
);
if (historyRes) {

    const historyData =
        await historyRes.json();

    if (historyRes.ok) {

        await loadHistory();

    } else {

        console.log(
            "History not saved:",
            historyData.error
        );
    }
}

  // Fetch recommendations ONLY when results exist
  const rec = await fetchMovies(
    `/recommend?q=${encodeURIComponent(query)}`
  );

  if (rec && rec.length > 0) {

    recCache = rec;
    recPage = 1;

    displayMovies(
      rec.slice(0, 10),
      recommendationsRow
    );

    recommendationsSection.classList.remove("hidden");
  }
}
// USER INTERFACE RENDERING
// Movie Cards, Images & Dynamic Components
function displayMovies(movies, container, replace = false) {
  if (replace) container.innerHTML = "";
  if (!container) return;
  if (!movies) {
    container.innerHTML = '<p style="color:red">Failed to load... retrying</p>';

    setTimeout(() => {
      container.style.pointerEvents = "auto";
    }, 300);

    return;
  }
  movies.forEach(movie => {
    if (!movie || !movie.id || !movie.title) return;

    const card = document.createElement('div');
    card.dataset.id = movie.id;
    card.classList.add('movie-card');
    card.addEventListener("click", async () => {
      if (movie.explanations && movie.explanations.length > 0 && localStorage.getItem("token")) {
        fetch(`${API_BASE}/achievements/track`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
          },
          body: JSON.stringify({ action: "open_recommendation" })
        }).catch(err => console.log("Tracking open_recommendation failed", err));
      }

      if (typeof openModal === "function") {
        openModal(movie);
      } else {
        console.error("openModal not loaded");
      }
    });

    const poster = movie.poster_path
      ? IMG_BASE + movie.poster_path
      : movie.backdrop_path
        ? IMG_BASE + movie.backdrop_path
        : 'https://via.placeholder.com/300x450?text=No+Image';
    card.innerHTML = ` <img class="movie-img skeleton" src="${poster}" alt="${movie.title}">
 
  
  <div class="movie-info-overlay">
    <div class="movie-title">${movie.title}</div>
   <div class="movie-rating">
⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}
</div>

   <button
  class="watch-btn"
  data-id="${movie.id}"
  data-title="${movie.title}"
  data-poster="${movie.poster_path}"
  data-added="${userWatchlist.some(m => m.tmdbId === movie.id)}"
  onclick="toggleWatchlist(event, this)">

  ${userWatchlist.some(m => m.tmdbId === movie.id) ? "❤️" : "🤍"}

</button>
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
  requestAnimationFrame(() => {
    updateScrollButtons(
      container,
      container.parentElement.querySelector(".scroll-left"),
      container.parentElement.querySelector(".scroll-right")
    );
  });
}

// WATCHLIST INTERACTIONS
// Add Or Remove Movies From Watchlist
async function toggleWatchlist(event, btn) {
  event.stopPropagation();

  if (btn.disabled) return;
  btn.disabled = true;

  const movie = {
    id: Number(btn.dataset.id),
    title: btn.dataset.title,
    poster_path: btn.dataset.poster
  };

  if (!movie.id) {
    console.error("Invalid movie ID");
    btn.disabled = false;
    return;
  }

  try {
    const res = await authFetch(`${API_BASE}/watchlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        movie: {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path
        }
      })
    });
    
if (!res) {
  btn.disabled = false;
  return;
}
    const data = await res.json();
    userWatchlist = data;

    if (!res.ok) {
      console.error("Backend error:", data);
      btn.disabled = false;
      return;
    }

    // Check if movie exists in updated watchlist
    const exists = data.find(m => m.tmdbId === movie.id);

    //  Update UI correctly
    if (exists) {
      btn.innerText = "❤️";
      btn.dataset.added = "true";
    } else {
      btn.innerText = "🤍";
      btn.dataset.added = "false";
    }

    setTimeout(() => {
      loadWatchlistRecommendations(true);
    }, 500);

  } catch (err) {
    console.error("Watchlist error:", err);
  }

  btn.disabled = false;
}
async function initTrendingAndHero() {
  try {
    const movies = await fetchMovies('/trending');
    if (!movies || movies.length === 0) return;

    displayMovies(movies, trendingRow);

    heroMovies = movies.slice(0, 10);
    heroIndex = 0;
    updateHeroBackground();

    clearInterval(heroInterval);
    heroInterval = setInterval(() => {
      heroIndex = (heroIndex + 1) % heroMovies.length;
      updateHeroBackground();
    }, 4000);
  } catch (err) {
    console.error("Trending/hero init error:", err);
  }
}

// HERO CAROUSEL
// Dynamic Featured Movie Banner
let heroMovies = [];
let heroIndex = 0;

function updateHeroBackground() {
  const hero = document.getElementById('hero');
  const movie = heroMovies[heroIndex];
  if (!movie || !movie.backdrop_path) return;

  // Crossfade: fade out → swap → fade in
  hero.style.opacity = '0';
  hero.style.transition = 'opacity 0.6s ease';
  setTimeout(() => {
    hero.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`;
    hero.style.opacity = '1';
  }, 600);
}

window.addEventListener('beforeunload', () => clearInterval(heroInterval));
function loadMore() {
  currentPage++;
  searchMovie(currentQuery);
}


// AUTO SCROLLING SYSTEM
// Infinite Loading For Movie Rows
function setupAutoScroll(row, loadMoreFn, getPage) {
  let loading = false;

  row.addEventListener('scroll', () => {
    if (loading) return;

    const scrollLeft = row.scrollLeft;
    const maxScroll = row.scrollWidth - row.clientWidth;

    //  LOAD NEXT PAGE ONLY
    if (scrollLeft >= maxScroll - 200) {
      loading = true;

      loadMoreFn(1);

      setTimeout(() => {
        loading = false;
      }, 500);
    }

    updateScrollButtons(
      row,
      row.parentElement.querySelector(".scroll-left"),
      row.parentElement.querySelector(".scroll-right")
    );
  });
}
function loadMoreTrending(direction = 1) {
  const row = trendingRow;

  if (row.dataset.loading === "true") return;
  row.dataset.loading = "true";

  trendingPage += direction;
  if (trendingPage < 1) trendingPage = 1;

  if (trendingCache[trendingPage]) {
    displayMovies(trendingCache[trendingPage], row);
    row.dataset.loading = "false";
    return;
  }

  fetchMovies(`/trending?page=${trendingPage}`)
    .then(data => {
      trendingCache[trendingPage] = data;
      displayMovies(data, row);
      row.dataset.loading = "false";
    });
}

window.scrollRow = function (rowId, direction) {
  const row = document.getElementById(rowId);
  if (!row) return;

  //  ALWAYS SCROLL (even if no cards yet)
  const scrollAmount = row.clientWidth * 0.8;

  row.scrollBy({
    left: direction * scrollAmount,
    behavior: 'smooth'
  });
};

// APPLICATION INITIALIZATION
// Configure UI, Authentication & Data Loading
document.addEventListener('DOMContentLoaded', async () => {
  // UI Element References
  const searchInput = document.getElementById('searchInput');
  searchResultsSection = document.getElementById('searchResultsSection');
  recommendationsSection = document.getElementById('recommendationsSection');
  searchResultsRow = document.getElementById('searchResultsRow');
  recommendationsRow = document.getElementById('recommendationsRow');
  searchSpinner = document.getElementById('searchSpinner');
  noResultsMsg = document.getElementById('noResultsMsg');
  loadMoreBtn = document.getElementById('loadMoreBtn');

  trendingRow = document.getElementById('trendingRow');
  actionRow = document.getElementById('actionRow');
  comedyRow = document.getElementById('comedyRow');
  topRatedRow = document.getElementById('topRatedRow');
  popularRow = document.getElementById('popularRow');
  scifiRow = document.getElementById('scifiRow');
  horrorRow = document.getElementById('horrorRow');
  historyBtn =
document.getElementById("historyBtn");

historyDropdown =
document.getElementById(
    "historyDropdown"
);
historySection =
document.getElementById(
    "historySection"
);

historyRow =
document.getElementById(
    "historyRow"
);
  watchlistRecRow = document.getElementById('watchlistRecRow');

  //  Auth Check
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {

  const query = searchInput.value.trim();

  if (query.length < 3) {
    alert("Enter at least 3 characters");
    return;
  }

  searchMovie(query);
}
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMore);
  }

  //  Initial Data Fetching
  await loadUserWatchlist();
  await loadHistory();
  if (historyBtn) {
historyBtn.addEventListener(
    "click",
    async () => {

        await loadHistory();

        historySection
        .classList
        .toggle("hidden");
    }
);
 
}

document.addEventListener(
    "click",
    (e) => {

       if (
    historyDropdown &&
    historyBtn &&
    !historyDropdown.contains(e.target) &&
    !historyBtn.contains(e.target)
) {

            historyDropdown
            .classList
            .add("hidden");
        }
    }
);
await Promise.all([

    initTrendingAndHero(),

    loadTopRated(),

    loadPopular(),

    loadScifi(),

    loadHorror(),

    loadWatchlistRecommendations(),

    fetchInitialMovies()

]);

  loadAnalyticsRecommendations();

  // Scroll Setup - Main Categories
  setupAutoScroll(trendingRow, loadMoreTrending, () => trendingPage);
  setupAutoScroll(actionRow, loadMoreAction, () => actionPage);
  setupAutoScroll(comedyRow, loadMoreComedy, () => comedyPage);
  setupAutoScroll(topRatedRow, loadMoreTopRated, () => topRatedPage);
  setupAutoScroll(popularRow, loadMorePopular, () => popularPage);
  setupAutoScroll(scifiRow, loadMoreScifi, () => scifiPage);
  setupAutoScroll(horrorRow, loadMoreHorror, () => horrorPage);

  // Scroll Setup - Search Results
  setupAutoScroll(searchResultsRow, () => {
    currentPage++;
    fetchMovies(`/search?q=${currentQuery}&page=${currentPage}`)
      .then(data => displayMovies(data, searchResultsRow));
  });

  // AI Recommendations scroll
  setupAutoScroll(recommendationsRow, () => {
    recPage++;
    const start = (recPage - 1) * 10;
    if (start >= recCache.length) return;

    const nextBatch = recCache.slice(start, start + 10);
    if (nextBatch.length > 0) {
      displayMovies(nextBatch, recommendationsRow);
    }
  });

  //  Watchlist Recommendations scroll (SEPARATE)
  setupAutoScroll(watchlistRecRow, () => {
    if (watchlistCache.length === 0) return; // no scroll if message
    watchlistPage++;

    const start = (watchlistPage - 1) * 10;
    const nextBatch = watchlistCache.slice(start, start + 10);
    if (nextBatch.length > 0) {
      displayMovies(nextBatch, watchlistRecRow);
    }
  });
});

// ANALYTICS-BASED RECOMMENDATIONS
// Generate Content Using User Behaviour Insights
async function loadAnalyticsRecommendations() {

  try {
const res = await authFetch(
  `${API_BASE}/analytics/overview`
);

if (!res) return;

const data = await res.json();
   

    // GENRE SECTION
if (
  data.topGenre &&
  data.topGenre !== "Unknown" &&
  data.topGenre !== "No Data"
){

  document
  .getElementById(
    "genreAnalyticsSection"
  )
  .classList.remove("hidden");

  document
  .getElementById(
    "genreAnalyticsTitle"
  )
  .innerText =

  `Because You Explore ${data.topGenre}`;

  // FETCH MOVIES
 const genreMovies =
await fetchMovies(
  `/search?q=${encodeURIComponent(
      data.topGenre
  )}`
);

  if (genreMovies) {

    displayMovies(

      genreMovies,

      document.getElementById(
        "genreAnalyticsRow"
      )
    );
   
const genreRow =
document.getElementById(
  "genreAnalyticsRow"
);

if (
  !genreRow.dataset.listenerAdded
) {

  genreRow.dataset.listenerAdded =
  "true";

  setupAutoScroll(
    genreRow,
    async () => {
  analyticsGenrePage++;

const moreMovies =
await fetchMovies(
  `/search?q=${encodeURIComponent(
      data.topGenre
  )}&page=${analyticsGenrePage}`
);
if (moreMovies) {

  displayMovies(
    moreMovies,
    document.getElementById(
      "genreAnalyticsRow"
    )
  );

}
  }
);}
  }
}
    // PROVIDER SECTION

  if (
  data.topProvider &&
  data.topProvider !== "Unknown" &&
  data.topProvider !== "No Data"
)   {

  document
  .getElementById(
    "providerAnalyticsSection"
  )
  .classList.remove("hidden");

  document
  .getElementById(
    "providerAnalyticsTitle"
  )
  .innerText =

  `Streaming on ${data.topProvider}`;

  // FETCH MOVIES
const providerMovies =
await fetchMovies(
  `/provider-content/${encodeURIComponent(
      data.topProvider
  )}`
);
if (
  providerMovies &&
  providerMovies.length > 0
) {

    displayMovies(
      providerMovies,
      document.getElementById(
        "providerAnalyticsRow"
      )
    );
   const providerRow =
document.getElementById(
  "providerAnalyticsRow"
);

if (
  !providerRow.dataset.listenerAdded
) {

  providerRow.dataset.listenerAdded =
  "true";

  setupAutoScroll(
    providerRow,
    async () => {

  
analyticsProviderPage++;

const moreMovies =
await fetchMovies(
  `/provider-content/${encodeURIComponent(
      data.topProvider
  )}?page=${analyticsProviderPage}`
);
if (moreMovies) {
displayMovies(
    moreMovies,
    document.getElementById(
      "providerAnalyticsRow"
    )
);
}
}
);
}
}
}
} catch (err) {

    console.error(
      "Analytics recommendation failed",
      err
    );
  }
}
 


// SCROLL NAVIGATION CONTROLS
// Manage Horizontal Movie Row Navigation
function openWatchlistPage() {
  window.location.href = "watchlist.html";
}
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
function updateScrollButtons(row, leftBtn, rightBtn) {
  const maxScroll = row.scrollWidth - row.clientWidth;

  // LEFT BUTTON
  if (row.scrollLeft <= 2) {
    leftBtn.style.opacity = "0";
    leftBtn.style.pointerEvents = "none";
  } else {
    leftBtn.style.opacity = "1";
    leftBtn.style.pointerEvents = "auto";
  }

  // RIGHT BUTTON
  if (row.scrollLeft >= maxScroll - 2) {
    rightBtn.style.opacity = "0";
    rightBtn.style.pointerEvents = "none";
  } else {
    rightBtn.style.opacity = "1";
    rightBtn.style.pointerEvents = "auto";
  }
}
window.addEventListener('scroll', function () {
  const nav = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

function hideError(){

    const errorBox =
    document.getElementById("error-msg");

    if(errorBox){
        errorBox.classList.add("hidden");
    }
}
const usernameInput =
document.getElementById("username");

if (usernameInput) {
  usernameInput.addEventListener(
    "input",
    hideError
  );
}

const passwordInput =
document.getElementById("password");

if (passwordInput) {
  passwordInput.addEventListener(
    "input",
    hideError
  );
}
