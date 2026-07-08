// MOVIE MODAL SYSTEM
// Handles Movie Details, Trailers, Cast Information,
// OTT Providers & Analytics Tracking
var IMG_BASE = 'https://image.tmdb.org/t/p/w500';
let currentModalRequest = 0;
let currentOpenMovieId = null;

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

// UNIFIED PIPELINE DATA FETCHING (Parallel + Shared Promise cache)
async function fetchFullMovieDetails(movieId) {
    const mId = Number(movieId);
    if (!mId) return null;

    if (!window.movieRegistry) return null;

    return window.movieRegistry.getOrCreatePromise(mId, async () => {
        const controller = window.movieRegistry.createController(mId);
        const signal = controller.signal;

        try {
            const [detailsRes, castRes, trailerRes, providersRes] = await Promise.all([
                fetch(`${API_BASE}/movie/${mId}`, { signal }).then(r => r.ok ? r.json() : null),
                fetch(`${API_BASE}/movie/${mId}/cast`, { signal }).then(r => r.ok ? r.json() : null),
                fetch(`${API_BASE}/movie/${mId}/trailer`, { signal }).then(r => r.ok ? r.json() : null),
                fetch(`${API_BASE}/movie/${mId}/providers`, { signal }).then(r => r.ok ? r.json() : null)
            ]);

            const fullData = {
                ...detailsRes,
                cast: castRes ? castRes.map(a => a.name).join(", ") : "Cast not available",
                trailer: trailerRes ? trailerRes.trailer : null,
                providers: providersRes || []
            };

            window.movieRegistry.set(mId, fullData);
            return fullData;
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.warn("Failed to prefetch details for movie", mId, e);
            }
            return null;
        }
    });
}

// MOVIE DETAILS MODAL
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
            const modalElement = document.getElementById("movieModal");
            if (modalElement) {
                modalElement.appendChild(dotsContainer);
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

function prefetchNeighbors(currentIndex) {
    if (modalSiblings.length <= 1) return;
    
    // Prefetch previous, next, and subsequent neighbors on idle times
    const indicesToPreload = [
        (currentIndex + 1) % modalSiblings.length,
        (currentIndex - 1 + modalSiblings.length) % modalSiblings.length,
        (currentIndex + 2) % modalSiblings.length
    ];

    indicesToPreload.forEach(idx => {
        const m = modalSiblings[idx];
        if (m) {
            const mId = m.id || m.tmdbId;
            if (mId && window.movieRegistry && !window.movieRegistry.has(mId)) {
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(() => fetchFullMovieDetails(mId));
                } else {
                    setTimeout(() => fetchFullMovieDetails(mId), 150);
                }
            }
        }
    });
}

async function navigateModal(direction) {
    if (isTransitioning || modalSiblings.length <= 1 || modalCurrentIndex === -1) return;
    
    const nextIndex = (modalCurrentIndex + direction + modalSiblings.length) % modalSiblings.length;
    const nextMovie = modalSiblings[nextIndex];
    const nextMovieId = nextMovie.id || nextMovie.tmdbId;

    // Prevent double triggers during active sliding phase
    isTransitioning = true;
    
    const modalBody = document.querySelector(".modal-body");
    if (!modalBody) {
        isTransitioning = false;
        return;
    }

    const outgoingClass = direction > 0 ? "slide-out-left" : "slide-out-right";
    const incomingClass = direction > 0 ? "slide-in-right" : "slide-in-left";

    // Abort active detail fetch for current movie to save bandwidth
    if (window.movieRegistry) {
        window.movieRegistry.cancelRequest(currentOpenMovieId);
    }
    currentOpenMovieId = nextMovieId;

    modalBody.classList.add(outgoingClass);

    setTimeout(async () => {
        modalCurrentIndex = nextIndex;
        const newRequestId = Date.now();
        currentModalRequest = newRequestId;

        // INSTANT SWR Render from in-memory cache
        const cachedData = window.movieRegistry ? window.movieRegistry.get(nextMovieId) : null;
        if (cachedData && cachedData.cast !== undefined) {
            renderFullModalDOM(cachedData, newRequestId);
        } else {
            renderOptimisticModalDOM(nextMovie, newRequestId);
            fetchFullMovieDetails(nextMovieId).then(fullMovie => {
                if (fullMovie && currentModalRequest === newRequestId) {
                    renderFullModalDOM(fullMovie, newRequestId);
                }
            });
        }

        updateDots();
        prefetchNeighbors(nextIndex);

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
    
    // Save scroll position and lock background scroll on mobile
    window.modalScrollY = window.scrollY;
    document.body.classList.add("modal-open");
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.modalScrollY}px`;
    document.body.style.width = '100%';

    setupSwipeGestures();
    setupModalArrows();
    updateDots();

    // Trigger instant content render
    await updateModalContent(movie);

    // Predictively preload neighboring movie assets
    if (modalCurrentIndex !== -1) {
        prefetchNeighbors(modalCurrentIndex);
    }
};

async function updateModalContent(movie) {
    const requestId = Date.now();
    currentModalRequest = requestId;
    
    const movieId = movie.id || movie.tmdbId;
    currentOpenMovieId = movieId;
    if (!movieId) return;

    // 1. SWR Cache check
    const cachedData = window.movieRegistry ? window.movieRegistry.get(movieId) : null;
    if (cachedData && cachedData.cast !== undefined) {
        // Cache Hit: Render full view instantly ( FCP < 10ms )
        renderFullModalDOM(cachedData, requestId);
    } else {
        // Cache Miss: Optimistically render core metadata, fetch rest in background
        renderOptimisticModalDOM(movie, requestId);
        
        fetchFullMovieDetails(movieId).then(fullMovie => {
            if (fullMovie && currentModalRequest === requestId) {
                renderFullModalDOM(fullMovie, requestId);
            }
        });
    }
}

function renderOptimisticModalDOM(movie, requestId) {
    if (currentModalRequest !== requestId) return;

    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalRating = document.getElementById('modalRating');
    const modalYear = document.getElementById('modalYear');
    const modalOverview = document.getElementById('modalOverview');
    const reasonsBox = document.getElementById("recommendationReasons");
    const metaExtra = document.getElementById("modalMetaExtra");
    const watchlistBtn = document.getElementById("modalWatchlistBtn");
    const trailerBtn = document.getElementById("playTrailerBtn");
    const placeholder = document.getElementById("modalPlaceholder");
    const providerContainer = document.getElementById("floatingProviders");

    if (providerContainer) {
        providerContainer.classList.add("hidden");
        providerContainer.classList.remove("show-active");
    }

    const imgUrl = (movie.poster_path || movie.poster)
        ? `${IMG_BASE}${movie.poster_path || movie.poster}`
        : null;

    const modalContent = document.querySelector(".modal-content");
    if (modalContent) {
        const backdropUrl = imgUrl ? `url(${imgUrl})` : "none";
        modalContent.style.setProperty('--modal-backdrop', backdropUrl);
    }

    if (!imgUrl) {
        modalImg.style.display = "none";
        if (placeholder) placeholder.classList.remove("hidden");
    } else {
        modalImg.src = imgUrl;
        modalImg.style.display = "block";
        modalImg.style.opacity = 1;
    }

    const rating = movie.vote_average ?? movie.rating ?? 'N/A';
    const year = movie.release_date || movie.first_air_date || '';

    modalTitle.textContent = movie.title || "Unknown";
    modalRating.innerHTML = rating ? `⭐ ${Number(rating).toFixed(1)}` : "⭐ N/A";
    modalYear.textContent = year ? year.split('-')[0] : 'Unknown';
    
    modalOverview.innerHTML = `
      ${escapeHTML(movie.overview ?? movie.description ?? 'No overview available.')}
      <br><br>
      <span class="cast-loading-indicator" style="color: #ff2e43; font-size: 0.85rem;"><i class="fas fa-spinner fa-spin"></i> Loading cast...</span>
    `;

    if (metaExtra) {
        metaExtra.innerHTML = `<span class="meta-tag"><i class="fas fa-spinner fa-spin"></i> Loading stats...</span>`;
    }

    if (watchlistBtn) {
        watchlistBtn.disabled = true;
        watchlistBtn.innerHTML = 'Loading...';
    }

    if (trailerBtn) {
        trailerBtn.innerText = "Loading...";
        trailerBtn.disabled = true;
    }

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
}

async function renderFullModalDOM(fullMovie, requestId) {
    if (currentModalRequest !== requestId) return;

    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalRating = document.getElementById('modalRating');
    const modalYear = document.getElementById('modalYear');
    const modalOverview = document.getElementById('modalOverview');
    const metaExtra = document.getElementById("modalMetaExtra");
    const watchlistBtn = document.getElementById("modalWatchlistBtn");
    const trailerBtn = document.getElementById("playTrailerBtn");
    const providerContainer = document.getElementById("floatingProviders");
    const providerIcons = document.getElementById("providerIcons");
    const placeholder = document.getElementById("modalPlaceholder");

    const imgUrl = (fullMovie.poster_path || fullMovie.poster)
        ? `${IMG_BASE}${fullMovie.poster_path || fullMovie.poster}`
        : null;

    const modalContent = document.querySelector(".modal-content");
    if (modalContent) {
        const backdropUrl = fullMovie.backdrop_path 
          ? `url(${IMG_BASE}${fullMovie.backdrop_path})`
          : (imgUrl ? `url(${imgUrl})` : "none");
        modalContent.style.setProperty('--modal-backdrop', backdropUrl);
    }

    if (!imgUrl) {
        modalImg.style.display = "none";
        if (placeholder) placeholder.classList.remove("hidden");
    } else {
        modalImg.src = imgUrl;
        modalImg.style.display = "block";
        modalImg.style.opacity = 1;
    }

    const rating = fullMovie.vote_average ?? fullMovie.rating ?? 'N/A';
    const year = fullMovie.release_date || fullMovie.first_air_date || '';
    const cast = fullMovie.cast || "Cast not available";

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

    modalOverview.innerHTML = `
      ${escapeHTML(fullMovie.overview ?? fullMovie.description ?? 'No overview available.')}
      <br><br>
      <strong>Cast:</strong> ${escapeHTML(cast)}
    `;

    // OTT Streaming Providers Rendering
    if (providerIcons && providerContainer) {
        providerIcons.innerHTML = "";
        providerContainer.classList.remove("show-active");
        providerContainer.classList.add("hidden");
        
        const overviewEl = document.getElementById("modalOverview");
        if (overviewEl) {
            overviewEl.parentNode.insertBefore(providerContainer, overviewEl.nextSibling);
        }

        const providers = fullMovie.providers || [];
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
                .replace("with ads", "").replace("standard", "").replace("premium", "")
                .replace("essential", "").replace("roku channel", "").replace(/\+/g, "").trim();

            const isAllowed = allowedProviders.some(name => {
                const cleanedName = name.toLowerCase().replace(/\+/g, "").trim();
                return normalized === cleanedName;
            });
            if (!isAllowed) return;
            if (seen.has(normalized)) return;
            if (!provider.logo_path) return;
            seen.add(normalized);
            uniqueProviders.push(provider);
        });

        if (uniqueProviders.length > 0) {
            uniqueProviders.forEach(provider => {
                const img = document.createElement("img");
                img.src = `https://image.tmdb.org/t/p/original${provider.logo_path}`;
                img.className = "provider-logo";
                img.title = provider.provider_name;
                img.onerror = () => {
                    img.remove();
                    if (providerIcons.children.length === 0) {
                        providerContainer.classList.add("hidden");
                        providerContainer.classList.remove("show-active");
                    }
                };
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
                        let genreName = fullMovie.genres?.[0]?.name;
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

            providerContainer.classList.remove("hidden");
            setTimeout(() => {
                if (currentModalRequest === requestId) {
                    providerContainer.classList.add("show-active");
                }
            }, 30);
        }
    }

    // Hydrate trailer button state
    const trailerUrl = fullMovie.trailer;
    if (trailerUrl) {
        trailerBtn.innerText = "▶ Watch Trailer";
        trailerBtn.disabled = false;
        trailerBtn.onclick = () => {
            if (typeof openTrailer === "function") {
                openTrailer(trailerUrl);
            }
        };
    } else {
        trailerBtn.innerText = "Trailer Unavailable";
        trailerBtn.disabled = true;
        trailerBtn.onclick = null;
    }

    // Hydrate watchlist button state
    if (watchlistBtn) {
        const movieId = fullMovie.id || fullMovie.tmdbId;
        watchlistBtn.disabled = false;
        try {
            const wlRes = await fetch(`${API_BASE}/watchlist`, { credentials: "include" });
            if (wlRes.ok) {
                const wlData = await wlRes.json();
                const isAdded = wlData.some(m => Number(m.tmdbId) === Number(movieId) || Number(m.id) === Number(movieId));
                updateWatchlistButtonState(watchlistBtn, isAdded, fullMovie);
            } else {
                updateWatchlistButtonState(watchlistBtn, false, fullMovie);
            }
        } catch (e) {
            updateWatchlistButtonState(watchlistBtn, false, fullMovie);
        }
    }
}

// TRAILER CONTROLS
function openTrailer(url) {
    const modal = document.getElementById("trailerModal");
    const frame = document.getElementById("trailerFrame");
    if (modal && frame) {
        frame.src = url;
        modal.classList.remove("hidden");
    }
}

function closeTrailer() {
    const modal = document.getElementById("trailerModal");
    const frame = document.getElementById("trailerFrame");
    if (modal && frame) {
        frame.src = "";
        modal.classList.add("hidden");
    }
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
            id: movie.id || movie.tmdbId,
            title: movie.title,
            poster_path: movie.poster_path
          }
        }),
        credentials: "include"
      });
      if (res.ok) {
        const wlData = await res.json();
        const movieKeyId = movie.id || movie.tmdbId;
        const updatedAdded = wlData.some(m => Number(m.tmdbId) === Number(movieKeyId) || Number(m.id) === Number(movieKeyId));
        updateWatchlistButtonState(btn, updatedAdded, movie);
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