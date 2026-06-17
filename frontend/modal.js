// MOVIE MODAL SYSTEM
// Handles Movie Details, Trailers, Cast Information,
// OTT Providers & Analytics Tracking
var IMG_BASE = 'https://image.tmdb.org/t/p/w500';
let currentModalRequest = 0;
let currentOpenMovieId = null;
// AUTHENTICATED API REQUESTS
// Automatically Attach JWT Token To Requests
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

// MOVIE CAST INFORMATION
// Retrieve Top Cast Members From Backend API
async function fetchCast(movieId) {
    try {
        const res = await fetch(`${API_BASE}/movie/${movieId}/cast`);
        const data = await res.json();
        return data.map(a => a.name).join(", ");
    } catch {
        return "Cast not available";
    }
}

// TRAILER FETCHING
// Retrieve Official Movie Trailer
async function fetchTrailer(movieId) {
    try {
        const res = await fetch(`${API_BASE}/movie/${movieId}/trailer`);
        const data = await res.json();
        return data.trailer;
    } catch {
        return null;
    }
}

// STREAMING PROVIDERS
// Fetch Available OTT Platforms For Movie
async function fetchProviders(movieId) {
    try {
        const res = await fetch(`${API_BASE}/movie/${movieId}/providers`);

        const data = await res.json();

        return data;

    } catch (err) {
        console.error("Provider fetch failed");

        return [];
    }
}
// MOVIE DETAILS MODAL
// Display Complete Movie Information
window.openModal = async function (movie) {
    const requestId = Date.now();
    currentModalRequest = requestId;
    const modal = document.getElementById('movieModal');
    if (!modal) return;   
    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalRating = document.getElementById('modalRating');
    const modalYear = document.getElementById('modalYear');
    const modalOverview = document.getElementById('modalOverview');
    const reasonsBox =document.getElementById("recommendationReasons");
    const movieId = movie.id || movie.tmdbId;
    currentOpenMovieId = movieId;
    let fullMovie = movie;
    if (!movieId) return;
    // Display modal immediately while data loads
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.classList.add("modal-open");
    modalImg.classList.add("skeleton", "skeleton-img");

    modalTitle.innerHTML = `<div class="skeleton skeleton-title"></div>`;
    modalRating.innerHTML = "";
    modalYear.textContent = "";
    modalOverview.innerHTML = `
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-text"></div>
  <br>
  <div class="skeleton skeleton-text" style="width:50%"></div>
`;
if (reasonsBox) {
    reasonsBox.innerHTML = "";
    reasonsBox.classList.add("hidden");
}
    modalImg.style.opacity = 0;
    const imgUrl = fullMovie.poster_path
        ? `${IMG_BASE}${fullMovie.poster_path}`
        : 'https://via.placeholder.com/500x750';
    // handle both cached + fresh images
    modalImg.onload = () => {
        if (currentModalRequest !== requestId) return;
        modalImg.classList.remove("skeleton", "skeleton-img");
        modalImg.style.opacity = 1;
    };

    modalImg.src = imgUrl;

    if (modalImg.complete) {
        modalImg.classList.remove("skeleton", "skeleton-img");
        modalImg.style.opacity = 1;
    }
    const trailerBtn = document.getElementById("playTrailerBtn");
    // Reset trailer button before loading new data
    trailerBtn.innerText = "Loading...";
    trailerBtn.disabled = true;
    trailerBtn.onclick = null;
    try {
     // Retrieve latest movie details from backend
const res =
await fetch(`${API_BASE}/movie/${movieId}`);

if (!res.ok) {
    throw new Error("Movie fetch failed");
}

fullMovie =
await res.json();

if (fullMovie.error) {
    throw new Error(fullMovie.error);
}
        const rating = fullMovie.vote_average ?? fullMovie.rating ?? 'N/A';
        const year =
fullMovie.release_date ||
fullMovie.first_air_date ||
'';
        const cast = await fetchCast(movieId);
        if (currentModalRequest !== requestId) return;
        modalTitle.textContent = fullMovie.title || "Unknown";
        modalRating.innerHTML =
rating ? `⭐ ${Number(rating).toFixed(1)}` : "⭐ N/A";
        modalYear.textContent = year ? year.split('-')[0] : 'Unknown';
        modalOverview.innerHTML = `
      ${fullMovie.overview ?? fullMovie.description ?? 'No overview available.'}
      <br><br>
      <strong>Cast:</strong> ${cast}
    `;
const isWatchlistRecommendation =
    movie.explanations &&
    movie.explanations.length;

if (reasonsBox) {

    if (isWatchlistRecommendation) {

        reasonsBox.innerHTML =
            movie.explanations
                .map(reason =>
                    `<span class="reason-tag">${reason}</span>`
                )
                .join("");

        reasonsBox.classList.remove("hidden");

    } else {

        reasonsBox.innerHTML = "";
        reasonsBox.classList.add("hidden");
    }
}     const trailerUrl = await fetchTrailer(movieId);
        // Clear previously displayed OTT providers
const providerContainer =
document.getElementById("floatingProviders");

const providerIcons =
document.getElementById("providerIcons");


if (!providerIcons || !providerContainer) {
    console.warn(
        "providerIcons element missing"
    );

} else {

    // instantly clear old icons
    providerIcons.innerHTML = "";

    // instantly hide dock
    providerContainer.classList.add("hidden");
}

// Load streaming providers for current movie
fetchProviders(movieId).then(providers => {

    // stop stale requests
    if (currentModalRequest !== requestId) return;

    // clear previous icons safely
    providerIcons.innerHTML = "";

    // no providers
    if (!providers || providers.length === 0) return;


// Filter supported streaming platforms
const uniqueProviders = [];
const seen = new Set();


const allowedProviders = [

    "Netflix",

    "Amazon Prime Video",
    "Prime Video",

    "Disney Plus",
    "Disney+ Hotstar",
    "JioHotstar",

    "Zee5",
    "ZEE5",

    "SonyLIV",
    "Sony Liv",

    "AppleTV",
    "Apple TV",
    "Apple TV Plus",

    "Crunchyroll",

];
    

providers.forEach(provider => {

    let normalized =
        provider.provider_name
        .toLowerCase()
        .trim();

    // remove useless variants
    normalized =
        normalized
        .replace("with ads", "")
        .replace("standard", "")
        .replace("premium", "")
        .replace("essential", "")
        .replace("roku channel", "")
        .replace(/\+/g, "")
        .trim();

    const isAllowed =
    allowedProviders.some(name => {

        const cleanedName =
            name.toLowerCase()
            .replace(/\+/g, "")
            .trim();

        return normalized === cleanedName;
    });
    if (!isAllowed) return;

    // avoid duplicates
    if (seen.has(normalized)) return;

    seen.add(normalized);

    uniqueProviders.push(provider);
});
    
const normalizedLinks = {

    netflix:
    "https://www.netflix.com",

    "amazon prime video":
    "https://www.primevideo.com",

    "prime video":
    "https://www.primevideo.com",

    "disney plus":
    "https://www.hotstar.com/in",

    "disney hotstar":
    "https://www.hotstar.com/in",

    jiohotstar:
    "https://www.hotstar.com/in",

    zee5:
    "https://www.zee5.com",

    sonyliv:
    "https://www.sonyliv.com",

    "sony liv":
    "https://www.sonyliv.com",

    appletv:
    "https://tv.apple.com",

    "apple tv":
    "https://tv.apple.com",

    "apple tv plus":
    "https://tv.apple.com",

    crunchyroll:
    "https://www.crunchyroll.com",

  
};
    uniqueProviders.forEach(provider => {

        const img = document.createElement("img");

        img.src =
`https://image.tmdb.org/t/p/original${provider.logo_path}`;

        img.className = "provider-logo";

        img.title = provider.provider_name;
        console.log("PROVIDER:", provider.provider_name);
img.onclick = async () => {

console.log("CLICK STARTED");
    const cleanName =
        provider.provider_name
        .toLowerCase()
        .replace("with ads", "")
        .replace("standard", "")
        .replace("premium", "")
        .replace("essential", "")
        .replace("roku channel", "")
        .replace(/\+/g, "")
        .trim();

    let url = null;

    //  NETFLIX
    if (cleanName.includes("netflix")) {
        url = "https://www.netflix.com";
    }

    // PRIME VIDEO
    else if (
        cleanName.includes("prime")
    ) {
        url = "https://www.primevideo.com";
    }
 //  HULU
    else if (
        cleanName.includes("hulu")
    ) {
        url = "https://www.hulu.com";
    }
   //  HOTSTAR ONLY
else if (
    cleanName.includes("hotstar")
) {
    url = "https://www.hotstar.com/in";
}

//  DISNEY+
else if (
    cleanName.includes("disney")
) {
    url = "https://www.disneyplus.com";
}

    //  ZEE5
    else if (
        cleanName.includes("zee5")
    ) {
        url = "https://www.zee5.com";
    }

    //  SONYLIV
    else if (
        cleanName.includes("sony")
    ) {
        url = "https://www.sonyliv.com";
    }

    // APPLE TV
    else if (
        cleanName.includes("apple")
    ) {
        url = "https://tv.apple.com";
    }

    //  CRUNCHYROLL
    else if (
        cleanName.includes("crunchyroll")
    ) {
        url = "https://www.crunchyroll.com";
    }

  if (url) {

  // Track user OTT platform interaction for analytics

const genreName =

    fullMovie.genres?.[0]?.name ||
    movie.genres?.[0]?.name;

if (!genreName) {

    console.warn("Genre missing");

}
console.log("SENDING ANALYTICS");
console.log({
    provider: provider.provider_name,
    genre: genreName,
    movie: fullMovie.title
});
await authFetch(`${API_BASE}/provider-click`, {

    method: "POST",

    headers: {
        "Content-Type": "application/json",
    },

    body: JSON.stringify({

        movieId: fullMovie.id,

        movieTitle: fullMovie.title,

        provider: provider.provider_name,
        genre: genreName || "Unknown"
    })
});
  // Redirect user to selected streaming platform
   setTimeout(() => {
    window.open(url, "_blank");
}, 300);
}
};
     
        providerIcons.appendChild(img);
    });

    // show ONLY after fully rendered
    if (currentModalRequest !== requestId) return;

    providerContainer.classList.remove("hidden");
});
        if (currentModalRequest !== requestId) return;
        if (trailerUrl) {
            trailerBtn.innerText = "▶ Watch Trailer";
            trailerBtn.onclick = () => openTrailer(trailerUrl);
            trailerBtn.disabled = false;
        } else {
            trailerBtn.innerText = "Trailer not available";
            trailerBtn.disabled = true;
        }

    } catch (err) {

    console.error("MODAL ERROR:", err);

    modalTitle.textContent = "Movie unavailable";

    modalRating.innerHTML = "⭐ N/A";

    modalYear.textContent = "";

    modalOverview.innerHTML =
        "Failed to load movie details.";

    trailerBtn.innerText =
        "Trailer unavailable";

    trailerBtn.disabled = true;
}
};
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("close-modal")) {
        const modal = document.getElementById("movieModal");
        modal.classList.remove("show");
        setTimeout(() => modal.classList.add("hidden"), 300);
        document.body.classList.remove("modal-open");
    }
});
// TRAILER PLAYER
// Open Embedded Trailer Viewer
function openTrailer(url) {
    const frame = document.getElementById("trailerFrame");
    const modal = document.getElementById("trailerModal");

    if (!frame || !modal) return;

    frame.src = url;
    modal.classList.remove("hidden");
}

function closeTrailer() {
    const frame = document.getElementById("trailerFrame");
    const modal = document.getElementById("trailerModal");

    if (!frame || !modal) return;

    frame.src = "";
    modal.classList.add("hidden");
}

window.openTrailer = openTrailer;
window.closeTrailer = closeTrailer;
const refreshBtn =
document.getElementById('refreshMovieBtn');

if (refreshBtn) {

    refreshBtn.addEventListener('click', async () => {

        if (!currentOpenMovieId) return;

        // Show visual feedback
        const icon =
        document.querySelector(
            '#refreshMovieBtn .refresh-icon'
        );

        if (icon) {
            icon.style.animation =
            "spin 1s linear infinite";
        }

        try {

            const response =
            await fetch(
                `${API_BASE}/movie/${currentOpenMovieId}`
            );

            const freshData =
            await response.json();

            const freshCast =
            await fetchCast(currentOpenMovieId);

            document.getElementById(
                'modalTitle'
            ).innerText =
            freshData.title;

            document.getElementById(
                'modalRating'
            ).innerHTML =
            `⭐ ${freshData.vote_average.toFixed(1)}`;

            document.getElementById(
                'modalOverview'
            ).innerHTML = `
                ${freshData.overview || 'No overview available.'}
                <br><br>
                <strong>Cast:</strong> ${freshCast}
            `;

            console.log(
                "Modal data refreshed for ID:",
                currentOpenMovieId
            );

        } catch (err) {

            console.error(
                "Refresh failed:",
                err
            );

        } finally {

            if (icon) {
                icon.style.animation = "none";
            }
        }
    });

}