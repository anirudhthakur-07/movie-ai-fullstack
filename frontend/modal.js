// MOVIE MODAL SYSTEM
// Handles Movie Details, Trailers, Cast Information,
// OTT Providers & Analytics Tracking
var IMG_BASE = 'https://image.tmdb.org/t/p/w500';
let currentModalRequest = 0;
let currentOpenMovieId = null;
// authFetch is defined globally in script.js
// No duplicate definition here — uses the script.js version with try/catch

// SECURITY: HTML Entity Escaping
// Prevents DOM XSS from TMDB-sourced content injected via innerHTML
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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
        return [];
    }
}
// MOVIE DETAILS MODAL
// Display Complete Movie Information
let modalRetryCount = 0;
let modalSiblings = [];
let modalCurrentIndex = -1;
let isTransitioning = false;
let touchStartX = 0;
let touchEndX = 0;

function setupSwipeGestures() {
    const modalContent = document.querySelector(".modal-content");
    if (!modalContent || modalContent._swipeBound) return;
    
    modalContent.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    modalContent.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    }, { passive: true });
    
    modalContent._swipeBound = true;
}

function handleSwipeGesture() {
    if (modalSiblings.length <= 1 || isTransitioning) return;
    const swipeThreshold = 75;
    const diffX = touchEndX - touchStartX;
    if (diffX < -swipeThreshold) {
        navigateModal(1);
    } else if (diffX > swipeThreshold) {
        navigateModal(-1);
    }
}

function setupModalArrows() {
    let prevArrow = document.getElementById("modalPrevArrow");
    let nextArrow = document.getElementById("modalNextArrow");
    const modalContent = document.querySelector(".modal-content");
    if (!modalContent) return;

    if (modalSiblings.length > 1 && modalCurrentIndex !== -1) {
        if (!prevArrow) {
            prevArrow = document.createElement("button");
            prevArrow.id = "modalPrevArrow";
            prevArrow.className = "modal-nav-arrow prev-arrow";
            prevArrow.innerHTML = "❮";
            modalContent.appendChild(prevArrow);
        }
        if (!nextArrow) {
            nextArrow = document.createElement("button");
            nextArrow.id = "modalNextArrow";
            nextArrow.className = "modal-nav-arrow next-arrow";
            nextArrow.innerHTML = "❯";
            modalContent.appendChild(nextArrow);
        }
        prevArrow.style.display = "flex";
        nextArrow.style.display = "flex";
        
        prevArrow.onclick = (e) => {
            e.stopPropagation();
            navigateModal(-1);
        };
        nextArrow.onclick = (e) => {
            e.stopPropagation();
            navigateModal(1);
        };
    } else {
        if (prevArrow) prevArrow.style.display = "none";
        if (nextArrow) nextArrow.style.display = "none";
    }
}

function updateDots() {
    let dotsContainer = document.getElementById("modalDotsContainer");
    if (modalSiblings.length > 1) {
        if (!dotsContainer) {
            dotsContainer = document.createElement("div");
            dotsContainer.id = "modalDotsContainer";
            dotsContainer.className = "modal-indicator-dots";
            const modalBody = document.querySelector(".modal-body");
            if (modalBody) {
                modalBody.parentNode.insertBefore(dotsContainer, modalBody.nextSibling);
            }
        }
        dotsContainer.style.display = "flex";
        dotsContainer.innerHTML = "";
        const maxDots = Math.min(modalSiblings.length, 10);
        for (let i = 0; i < maxDots; i++) {
            const dot = document.createElement("span");
            dot.className = "indicator-dot" + (i === modalCurrentIndex ? " active" : "");
            const targetIndex = i;
            dot.onclick = () => {
                const diff = targetIndex - modalCurrentIndex;
                if (diff !== 0) navigateModal(diff);
            };
            dotsContainer.appendChild(dot);
        }
    } else {
        if (dotsContainer) dotsContainer.style.display = "none";
    }
}

async function navigateModal(direction) {
    if (isTransitioning || modalSiblings.length <= 1 || modalCurrentIndex === -1) return;
    isTransitioning = true;
    
    const modalBody = document.querySelector(".modal-body");
    if (!modalBody) {
        isTransitioning = false;
        return;
    }
    
    const outgoingClass = direction > 0 ? "slide-out-left" : "slide-out-right";
    const incomingClass = direction > 0 ? "slide-in-right" : "slide-in-left";
    
    modalBody.classList.add(outgoingClass);
    
    setTimeout(async () => {
        modalCurrentIndex = (modalCurrentIndex + direction + modalSiblings.length) % modalSiblings.length;
        const nextMovie = modalSiblings[modalCurrentIndex];
        
        await updateModalContent(nextMovie);
        updateDots();
        
        modalBody.classList.remove(outgoingClass);
        modalBody.classList.add(incomingClass);
        
        setTimeout(() => {
            modalBody.classList.remove(incomingClass);
            isTransitioning = false;
        }, 380);
    }, 200);
}

window.openModal = async function (movie, cardElement) {
    const modal = document.getElementById('movieModal');
    if (!modal) return;   

    if (cardElement) {
        const parent = cardElement.closest('.movie-row') || cardElement.closest('.movie-grid') || cardElement.closest('.watchlist-grid') || cardElement.closest('#watchlistContainer') || cardElement.parentNode;
        if (parent) {
            const cards = Array.from(parent.querySelectorAll('.movie-card, .watch-card'));
            modalSiblings = cards.map(c => c._movieData).filter(Boolean);
            modalCurrentIndex = modalSiblings.findIndex(m => Number(m.id || m.tmdbId) === Number(movie.id || movie.tmdbId));
        }
    } else {
        modalSiblings = [];
        modalCurrentIndex = -1;
    }

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.classList.add("modal-open");

    setupSwipeGestures();
    setupModalArrows();
    updateDots();

    await updateModalContent(movie);
};

async function updateModalContent(movie) {
    const requestId = Date.now();
    currentModalRequest = requestId;
    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalRating = document.getElementById('modalRating');
    const modalYear = document.getElementById('modalYear');
    const modalOverview = document.getElementById('modalOverview');
    const reasonsBox = document.getElementById("recommendationReasons");
    const metaExtra = document.getElementById("modalMetaExtra");
    const watchlistBtn = document.getElementById("modalWatchlistBtn");
    
    if (metaExtra) {
        metaExtra.innerHTML = '<div class="skeleton-meta-loader"></div>';
    }
    if (watchlistBtn) {
        watchlistBtn.disabled = true;
        watchlistBtn.innerHTML = 'Loading...';
        watchlistBtn.className = 'modal-btn watchlist-btn';
    }

    const movieId = movie.id || movie.tmdbId;
    currentOpenMovieId = movieId;
    let fullMovie = movie;
    if (!movieId) return;

    modalImg.classList.add("skeleton", "skeleton-img");
    modalImg.style.display = "block";
    modalImg.style.opacity = 0;

    const placeholder = document.getElementById("modalPlaceholder");
    if (placeholder) {
        placeholder.classList.add("hidden");
    }

    modalImg.onerror = () => {
        modalImg.classList.remove("skeleton", "skeleton-img");
        modalImg.style.display = "none";
        if (placeholder) {
            placeholder.classList.remove("hidden");
        }
    };

    modalTitle.innerHTML = `<div class="skeleton skeleton-title"></div>`;
    modalRating.innerHTML = "";
    modalYear.textContent = "";
    if (reasonsBox) {
        reasonsBox.innerHTML = "";
        reasonsBox.classList.add("hidden");
    }  modalOverview.innerHTML = `
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-text"></div>
  <br>
  <div class="skeleton skeleton-text" style="width:50%"></div>
`;

    const imgUrl = (fullMovie.poster_path || fullMovie.poster)
        ? `${IMG_BASE}${fullMovie.poster_path || fullMovie.poster}`
        : null;

    const modalContent = document.querySelector(".modal-content");
    if (modalContent) {
        modalContent.style.setProperty('--modal-backdrop', imgUrl ? `url(${imgUrl})` : "none");
    }

    modalImg.onload = () => {
        if (currentModalRequest !== requestId) return;
        modalImg.classList.remove("skeleton", "skeleton-img");
        modalImg.style.opacity = 1;
    };

    if (!imgUrl) {
        modalImg.classList.remove("skeleton", "skeleton-img");
        modalImg.style.display = "none";
        if (placeholder) {
            placeholder.classList.remove("hidden");
        }
    } else {
        modalImg.src = imgUrl;
        if (modalImg.complete) {
            modalImg.classList.remove("skeleton", "skeleton-img");
            modalImg.style.opacity = 1;
        }
    }    
    
    const trailerBtn = document.getElementById("playTrailerBtn");
    trailerBtn.innerText = "Loading...";
    trailerBtn.disabled = true;
    trailerBtn.onclick = null;
    
    try {
      const res = await fetch(`${API_BASE}/movie/${movieId}`);

      if (!res.ok) {
          throw new Error("Movie fetch failed");
      }

      fullMovie = await res.json();

      if (fullMovie.error) {
          throw new Error(fullMovie.error);
      }
      modalRetryCount = 0;

      if (modalContent) {
          const backdropUrl = fullMovie.backdrop_path 
            ? `url(${IMG_BASE}${fullMovie.backdrop_path})`
            : (imgUrl ? `url(${imgUrl})` : "none");
          modalContent.style.setProperty('--modal-backdrop', backdropUrl);
      }

      const rating = fullMovie.vote_average ?? fullMovie.rating ?? 'N/A';
      const year = fullMovie.release_date || fullMovie.first_air_date || '';
      const cast = await fetchCast(movieId);
      if (currentModalRequest !== requestId) return;

      const directorMember = fullMovie.credits && fullMovie.credits.crew 
        ? fullMovie.credits.crew.find(c => c.job === "Director") 
        : null;
      const directorName = directorMember ? directorMember.name : "Unknown";
      const langName = getLanguageName(fullMovie.original_language || 'en');
      const runtimeVal = fullMovie.runtime ? `${fullMovie.runtime} min` : "N/A";

      if (metaExtra) {
        metaExtra.innerHTML = `
          <span class="meta-tag"><i class="far fa-clock"></i> ${escapeHTML(runtimeVal)}</span>
          <span class="meta-tag"><i class="far fa-user"></i> Dir: ${escapeHTML(directorName)}</span>
          <span class="meta-tag"><i class="fas fa-globe"></i> ${escapeHTML(langName)}</span>
        `;
      }

      const watchBtn = document.getElementById("modalWatchlistBtn");
      if (watchBtn) {
        try {
          const wlRes = await fetch(`${API_BASE}/watchlist`, { credentials: "include" });
          if (wlRes.ok) {
            const wlData = await wlRes.json();
            const isAdded = wlData.some(m => Number(m.tmdbId) === Number(movieId) || Number(m.id) === Number(movieId));
            updateWatchlistButtonState(watchBtn, isAdded, fullMovie);
          } else {
            updateWatchlistButtonState(watchBtn, false, fullMovie);
          }
        } catch (e) {
          updateWatchlistButtonState(watchBtn, false, fullMovie);
        }
      }

      if (typeof window.trackBehaviorEvent === "function") {
          const firstGenre = fullMovie.genres?.[0]?.name || "";
          window.trackBehaviorEvent("movie_detail", movieId, fullMovie.title, firstGenre);
      }

      modalTitle.textContent = fullMovie.title || "Unknown";
      modalRating.innerHTML = rating ? `⭐ ${Number(rating).toFixed(1)}` : "⭐ N/A";
      modalYear.textContent = year ? year.split('-')[0] : 'Unknown';
      modalOverview.innerHTML = `
        ${escapeHTML(fullMovie.overview ?? fullMovie.description ?? 'No overview available.')}
        <br><br>
        <strong>Cast:</strong> ${escapeHTML(cast)}
      `;
      const isWatchlistRecommendation = movie.explanations && movie.explanations.length;

      if (reasonsBox) {
          if (isWatchlistRecommendation) {
              reasonsBox.innerHTML =
                  movie.explanations
                      .map(reason => {
                          const cleanReason = String(reason || "").replace(/<\/?strong>/gi, "");
                          return `<span class="reason-tag">${escapeHTML(cleanReason)}</span>`;
                      })
                      .join("");
              reasonsBox.classList.remove("hidden");
          } else {
              reasonsBox.innerHTML = "";
              reasonsBox.classList.add("hidden");
          }
      }     
      const trailerUrl = await fetchTrailer(movieId);
      const providerContainer = document.getElementById("floatingProviders");
      const providerIcons = document.getElementById("providerIcons");

      if (providerIcons && providerContainer) {
          providerIcons.innerHTML = "";
          providerContainer.classList.add("hidden");

          if (window.innerWidth <= 768) {
              const overviewEl = document.getElementById("modalOverview");
              if (overviewEl) {
                  overviewEl.parentNode.insertBefore(providerContainer, overviewEl.nextSibling);
              }
          } else {
              const modalContentEl = document.querySelector(".modal-content");
              const modalBodyEl = document.querySelector(".modal-body");
              if (modalContentEl && modalBodyEl) {
                  modalContentEl.insertBefore(providerContainer, modalBodyEl);
              }
          }
      }

      fetchProviders(movieId).then(providers => {
          if (currentModalRequest !== requestId) return;
          providerIcons.innerHTML = "";
          if (!providers || providers.length === 0) return;

          const uniqueProviders = [];
          const seen = new Set();
          const allowedProviders = [
              "Netflix", "Amazon Prime Video", "Prime Video",
              "Disney Plus", "Disney+ Hotstar", "JioHotstar",
              "Zee5", "ZEE5", "SonyLIV", "Sony Liv",
              "AppleTV", "Apple TV", "Apple TV Plus", "Crunchyroll"
          ];
              
          providers.forEach(provider => {
              let normalized = provider.provider_name.toLowerCase().trim();
              normalized = normalized
                  .replace("with ads", "")
                  .replace("standard", "")
                  .replace("premium", "")
                  .replace("essential", "")
                  .replace("roku channel", "")
                  .replace(/\+/g, "")
                  .trim();

              const isAllowed = allowedProviders.some(name => {
                  const cleanedName = name.toLowerCase().replace(/\+/g, "").trim();
                  return normalized === cleanedName;
              });
              if (!isAllowed) return;
              if (seen.has(normalized)) return;
              seen.add(normalized);
              uniqueProviders.push(provider);
          });
              
          uniqueProviders.forEach(provider => {
              const img = document.createElement("img");
              img.src = `https://image.tmdb.org/t/p/original${provider.logo_path}`;
              img.className = "provider-logo";
              img.title = provider.provider_name;
              img.onclick = async () => {
                  const cleanName = provider.provider_name.toLowerCase()
                      .replace("with ads", "").replace("standard", "").replace("premium", "")
                      .replace("essential", "").replace("roku channel", "").replace(/\+/g, "").trim();

                  let url = null;
                  if (cleanName.includes("netflix")) url = "https://www.netflix.com";
                  else if (cleanName.includes("prime")) url = "https://www.primevideo.com";
                  else if (cleanName.includes("hulu")) url = "https://www.hulu.com";
                  else if (cleanName.includes("hotstar")) url = "https://www.hotstar.com/in";
                  else if (cleanName.includes("disney")) url = "https://www.disneyplus.com";
                  else if (cleanName.includes("zee5")) url = "https://www.zee5.com";
                  else if (cleanName.includes("sony")) url = "https://www.sonyliv.com";
                  else if (cleanName.includes("apple")) url = "https://tv.apple.com";
                  else if (cleanName.includes("crunchyroll")) url = "https://www.crunchyroll.com";

                  if (url) {
                      let genreName = fullMovie.genres?.[0]?.name || movie.genres?.[0]?.name;
                      if (!genreName && movie.genre_ids?.length) {
                          const genreLookup = {
                              28:"Action", 12:"Adventure", 16:"Animation", 35:"Comedy", 80:"Crime",
                              18:"Drama", 14:"Fantasy", 27:"Horror", 9648:"Mystery", 878:"Science Fiction", 53:"Thriller"
                          };
                          genreName = genreLookup[movie.genre_ids[0]];
                      }
                      await authFetch(`${API_BASE}/provider-click`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                              movieId: fullMovie.id,
                              movieTitle: fullMovie.title,
                              provider: provider.provider_name,
                              genre: genreName || "Unknown"
                          })
                      });
                      setTimeout(() => {
                          window.open(url, "_blank", "noopener,noreferrer");
                      }, 300);
                  }
              };
              providerIcons.appendChild(img);
          });

          if (currentModalRequest !== requestId) return;
          providerContainer.classList.remove("hidden");
      });

      if (currentModalRequest !== requestId) return;
      if (trailerUrl) {
          trailerBtn.innerText = "▶ Watch Trailer";
          trailerBtn.onclick = () => {
              if (typeof window.trackBehaviorEvent === "function") {
                  const firstGenre = fullMovie.genres?.[0]?.name || "";
                  window.trackBehaviorEvent("trailer_watch", movieId, fullMovie.title, firstGenre);
              }
              openTrailer(trailerUrl);
          };
          trailerBtn.disabled = false;
      } else {
          trailerBtn.innerText = "Trailer not available";
          trailerBtn.disabled = true;
      }

    } catch (err) {
        if (modalRetryCount < 2) {
            modalRetryCount++;
            setTimeout(() => {
                updateModalContent(movie);
            }, 1000);
            return;
        }

        modalTitle.textContent = "Movie unavailable";
        modalRating.innerHTML = "⭐ N/A";
        modalYear.textContent = "";
        modalOverview.innerHTML = "Failed to load movie details after multiple retries.";
        if (metaExtra) {
            metaExtra.textContent = "Please try again later.";
        }
        trailerBtn.innerText = "Trailer unavailable";
        trailerBtn.disabled = true;
        const watchBtn = document.getElementById("modalWatchlistBtn");
        if (watchBtn) {
            watchBtn.innerText = "Unavailable";
            watchBtn.disabled = true;
        }
    }
}
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
// HELPER: Toggle Watchlist UI state and trigger additions/removals
function updateWatchlistButtonState(btn, isAdded, movie) {
  btn.disabled = false;
  btn.dataset.added = isAdded ? "true" : "false";
  if (isAdded) {
    btn.innerHTML = `<i class="fas fa-check"></i> In Watchlist`;
    btn.classList.add("added");
  } else {
    btn.innerHTML = `<i class="fas fa-plus"></i> Watchlist`;
    btn.classList.remove("added");
  }
  btn.onclick = async () => {
    btn.disabled = true;
    btn.innerText = "Processing...";
    try {
      const res = await fetch(`${API_BASE}/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movie: {
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path
          }
        }),
        credentials: "include"
      });
      if (res.ok) {
        const wlData = await res.json();
        const updatedAdded = wlData.some(m => Number(m.tmdbId) === Number(movie.id) || Number(m.id) === Number(movie.id));
        updateWatchlistButtonState(btn, updatedAdded, movie);
        // Automatically refresh watchlist panels if defined on the active page
        if (typeof window.loadWatchlist === "function") {
          window.loadWatchlist();
        }
        if (typeof window.loadWatchlistRecommendations === "function") {
          window.loadWatchlistRecommendations(true);
        }
      }
    } catch (err) {
      /* silent */
    } finally {
      btn.disabled = false;
    }
  };
}

// HELPER: Map language codes to readable strings
function getLanguageName(code) {
  const langs = {
    en: "English",
    ko: "Korean",
    ja: "Japanese",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    zh: "Chinese",
    hi: "Hindi",
    ru: "Russian"
  };
  return langs[code.toLowerCase()] || code.toUpperCase();
}