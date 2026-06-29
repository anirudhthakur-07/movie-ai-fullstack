// ==========================================================================
// MOVIES AI DASHBOARD CONTROLLER
// Handles API Data Binding, AI Insights, Chart Injections,
// and full 40-Tier Gamified Achievements Modal
// ==========================================================================

const token = sessionStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

// Global state variables
let statsOverview = { totalClicks: 0, topProvider: "No Data", topGenre: "No Data" };
let profileData = null;

// AI Persona mapping dictionary
const PERSONA_TITLES = {
    "sci-fi explorer": "The Space Explorer",
    "science fiction": "The Space Explorer",
    "thriller hunter": "The Thriller Hunter",
    "thriller": "The Thriller Hunter",
    "drama enthusiast": "The Drama Enthusiast",
    "drama": "The Drama Enthusiast",
    "action addict": "The Action Addict",
    "action": "The Action Addict",
    "horror seeker": "The Midnight Horror Fan",
    "horror": "The Midnight Horror Fan",
    "comedy lover": "The Comedy King",
    "comedy": "The Comedy King",
    "adventure explorer": "The Adventure Navigator",
    "adventure": "The Adventure Navigator",
    "fantasy dreamer": "The Fantasy Dreamer",
    "fantasy": "The Fantasy Dreamer",
    "animation enthusiast": "The Animated Cinephile",
    "animation": "The Animated Cinephile",
    "mystery detective": "The Mystery Detective",
    "mystery": "The Mystery Detective"
};

// FontAwesome mapping for 40 achievements
const ACHIEVEMENT_META = {
    // Watchlist
    "first_movie": { icon: "fas fa-film", badge: "red-badge" },
    "movie_collector_1": { icon: "fas fa-layer-group", badge: "blue-badge" },
    "movie_collector_2": { icon: "fas fa-film", badge: "purple-badge" },
    "cinephile": { icon: "fas fa-video", badge: "gold-badge" },
    "ultimate_collector": { icon: "fas fa-trophy", badge: "green-badge" },

    // Search
    "first_search": { icon: "fas fa-search", badge: "red-badge" },
    "curious_explorer": { icon: "fas fa-brain", badge: "blue-badge" },
    "movie_hunter": { icon: "fas fa-globe", badge: "purple-badge" },
    "search_master": { icon: "fas fa-book-open", badge: "gold-badge" },
    "endless_explorer": { icon: "fas fa-fire", badge: "green-badge" },

    // Recommendations
    "first_ai_viewed": { icon: "fas fa-robot", badge: "red-badge" },
    "ai_trusted": { icon: "fas fa-shield-halved", badge: "blue-badge" },
    "perfect_match": { icon: "fas fa-bullseye", badge: "purple-badge" },
    "recommendation_explorer": { icon: "fas fa-dna", badge: "gold-badge" },
    "ai_favorite": { icon: "fas fa-heart", badge: "green-badge" },

    // Genres
    "scifi_explorer": { icon: "fas fa-user-astronaut", badge: "blue-badge" },
    "comedy_lover": { icon: "fas fa-laugh-beam", badge: "gold-badge" },
    "romance_enthusiast": { icon: "fas fa-heart", badge: "red-badge" },
    "horror_survivor": { icon: "fas fa-ghost", badge: "purple-badge" },
    "action_hero": { icon: "fas fa-crosshairs", badge: "red-badge" },
    "fantasy_dreamer": { icon: "fas fa-wand-magic-sparkles", badge: "purple-badge" },
    "mystery_detective": { icon: "fas fa-user-secret", badge: "green-badge" },
    "drama_critic": { icon: "fas fa-masks-theater", badge: "blue-badge" },
    "adventure_seeker": { icon: "fas fa-mountain", badge: "blue-badge" },
    "animation_fan": { icon: "fas fa-child", badge: "gold-badge" },

    // Streaming
    "netflix_navigator": { icon: "fas fa-play", badge: "red-badge" },
    "prime_explorer": { icon: "fas fa-play", badge: "blue-badge" },
    "disney_fan": { icon: "fas fa-play", badge: "purple-badge" },
    "streaming_hopper": { icon: "fas fa-share-nodes", badge: "gold-badge" },
    "platform_collector": { icon: "fas fa-globe", badge: "green-badge" },

    // Profile
    "new_movie_fan": { icon: "fas fa-seedling", badge: "green-badge" },
    "movie_enthusiast": { icon: "fas fa-user-tag", badge: "blue-badge" },
    "movie_expert": { icon: "fas fa-award", badge: "purple-badge" },
    "movie_master": { icon: "fas fa-crown", badge: "gold-badge" },
    "ai_personality_complete": { icon: "fas fa-brain", badge: "red-badge" },

    // Analytics
    "data_explorer": { icon: "fas fa-chart-line", badge: "blue-badge" },
    "movie_analyst": { icon: "fas fa-chart-bar", badge: "purple-badge" },
    "personality_revealed": { icon: "fas fa-puzzle-piece", badge: "gold-badge" },
    "power_user": { icon: "fas fa-medal", badge: "green-badge" },
    "movie_universe_complete": { icon: "fas fa-star", badge: "gold-badge" }
};

// 1. LOAD OVERVIEW ANALYTICS (With safe defaults for new users)
async function loadAnalytics() {
    try {
        const res = await fetch(`${API_BASE}/analytics/overview?t=` + Date.now(), {
            headers: { Authorization: "Bearer " + token }
        });

        if (!res.ok) throw new Error("Overview statistics fetch failed");

        const data = await res.json();
        statsOverview.totalClicks = data.totalClicks || 0;
        statsOverview.topProvider = data.topProvider || "No Data";
        statsOverview.topGenre = data.topGenre || "No Data";

        // Bind metrics to widgets
        document.getElementById("totalClicks").innerText = statsOverview.totalClicks;
        document.getElementById("topProvider").innerText = statsOverview.topProvider === "No Data"
            ? "No Data"
            : statsOverview.topProvider.replace(/\b\w/g, c => c.toUpperCase());

        document.getElementById("topGenre").innerText = statsOverview.topGenre === "No Data"
            ? "No Data"
            : statsOverview.topGenre.replace(/\b\w/g, c => c.toUpperCase());

        // Bind behavioral metrics
        const explorationScoreEl = document.getElementById("explorationScore");
        if (explorationScoreEl) explorationScoreEl.innerText = data.explorationScore || 0;

        const genreDiversityEl = document.getElementById("genreDiversity");
        if (genreDiversityEl) genreDiversityEl.innerText = data.genreDiversity || 0;

        const trailerAffinityEl = document.getElementById("trailerAffinity");
        if (trailerAffinityEl) trailerAffinityEl.innerText = (data.trailerAffinity || 0) + "%";

        // FIX BUG 3: Only render Neural Summary AFTER both profile + stats are ready
        // profileData is populated by loadProfile(); only call summary if it is already set
        if (profileData) {
            updateSummaryList();
        }
    } catch (err) {
        console.error("Overview analytics failed", err);
        document.getElementById("totalClicks").innerText = "0";
        document.getElementById("topProvider").innerText = "No Data";
        document.getElementById("topGenre").innerText = "No Data";
        
        const explorationScoreEl = document.getElementById("explorationScore");
        if (explorationScoreEl) explorationScoreEl.innerText = "0";

        const genreDiversityEl = document.getElementById("genreDiversity");
        if (genreDiversityEl) genreDiversityEl.innerText = "0";

        const trailerAffinityEl = document.getElementById("trailerAffinity");
        if (trailerAffinityEl) trailerAffinityEl.innerText = "0%";
    }
}

// 2. LOAD USER PROFILE
function getAvatarPath(personality, gender) {
    const rawPersona = (personality || "Movie Fan").toLowerCase();
    const cleanGender = (gender || "male").toLowerCase();

    const mapping = {
        "sci-fi explorer": "space_explorer",
        "science fiction": "space_explorer",
        "thriller hunter": "thriller_hunter",
        "thriller": "thriller_hunter",
        "drama enthusiast": "drama_enthusiast",
        "drama": "drama_enthusiast",
        "action addict": "action_addict",
        "action": "action_addict",
        "horror seeker": "horror_seeker",
        "horror": "horror_seeker",
        "comedy lover": "comedy_lover",
        "comedy": "comedy_lover",
        "adventure explorer": "adventure_explorer",
        "adventure": "adventure_explorer",
        "fantasy dreamer": "fantasy_dreamer",
        "fantasy": "fantasy_dreamer",
        "animation enthusiast": "animation_enthusiast",
        "animation": "animation_enthusiast",
        "mystery detective": "mystery_detective",
        "mystery": "mystery_detective",
        "movie fan": "movie_fan"
    };

    const prefix = mapping[rawPersona] || "movie_fan";
    return `assets/avatars/${prefix}_${cleanGender}.jpg`;
}

async function loadProfile() {
    try {
        const res = await fetch(`${API_BASE}/profile?t=` + Date.now(), {
            headers: { Authorization: "Bearer " + token }
        });

        if (!res.ok) throw new Error("Profile details fetch failed");

        const data = await res.json();
        profileData = data;

        // Render Profile Card details
        const username = data.username || "Movie Explorer";
        document.getElementById("profileUsername").innerText = username;

        const rawPersonality = (data.personality || "Movie Fan").toLowerCase();
        const mappedPersona = PERSONA_TITLES[rawPersonality] || data.personality || "Movie Fan";
        document.getElementById("personality").innerText = mappedPersona;

        // Set avatar image or initials fallback
        const avatarImgUrl = getAvatarPath(data.personality, data.gender);
        const fallbackInitial = username.charAt(0).toUpperCase();
        document.getElementById("avatarInitials").innerHTML = `
            <img src="${avatarImgUrl}" alt="${mappedPersona}" onerror="this.style.display='none'; this.parentElement.innerText='${fallbackInitial}'">
        `;

        // FIX BUG 1 + BUG 4: Bind activityLevel and profileStrength from profileData
        // These were never wired — causing the widgets to always show stale HTML defaults
        const activityLevelEl = document.getElementById("activityLevel");
        if (activityLevelEl) activityLevelEl.innerText = data.activityLevel || "Casual";

        const profileStrengthEl = document.getElementById("profileStrength");
        if (profileStrengthEl) profileStrengthEl.innerText = data.profileStrength || "Low";

        // Load visual sub-cards (DNA bars)
        renderMovieDNA(data.topGenres || []);

        // FIX BUG 3: If analytics already resolved first, render summary now;
        // otherwise loadAnalytics() will call updateSummaryList() when it finishes
        if (statsOverview.totalClicks > 0 || statsOverview.topProvider !== "No Data") {
            updateSummaryList();
        } else {
            // Analytics not done yet — render with profile-only data now,
            // loadAnalytics() will re-render with full data when ready
            updateSummaryList();
        }
    } catch (err) {
        console.error("Profile load failed", err);
        document.getElementById("profileUsername").innerText = "Guest User";
        document.getElementById("personality").innerText = "Cinematic Explorer";
        document.getElementById("avatarInitials").innerText = "G";
        renderMovieDNA([]);
    }
}

// 3. RENDER GENRE DNA PERCENTAGE BARS
function renderMovieDNA(genres) {
    const container = document.getElementById("dnaContainer");
    container.innerHTML = "";

    if (!genres || genres.length === 0) {
        container.innerHTML = `
            <div class="empty-state-text">
                <p>Your Movie DNA represents your viewing tendencies.</p>
                <p style="font-size: 0.8rem; margin-top: 5px; color: var(--text-muted);">Start exploring movies to map interest percentages.</p>
            </div>
        `;
        return;
    }

    const totalCount = genres.reduce((sum, g) => sum + g.count, 0);

    genres.forEach((g, index) => {
        const percentage = totalCount > 0 ? Math.round((g.count / totalCount) * 100) : 0;
        const genreDisplay = g.genre.replace(/\b\w/g, c => c.toUpperCase());
        const fillClass = `genre-${index % 3}`;

        const itemHtml = `
            <div class="dna-item">
                <div class="dna-info">
                    <span class="dna-label">${genreDisplay}</span>
                    <span class="dna-value">${percentage}%</span>
                </div>
                <div class="dna-track">
                    <div class="dna-fill ${fillClass}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", itemHtml);
    });
}

// 4. LOAD AND SYNC DYNAMIC LEVEL & XP ACHIEVEMENTS
async function loadAchievements() {
    try {
        const res = await fetch(`${API_BASE}/achievements?t=` + Date.now(), {
            headers: { Authorization: "Bearer " + token }
        });

        if (!res.ok) throw new Error("Achievements fetch failed");

        const data = await res.json();

        // Level & XP Bar values
        document.getElementById("explorerLevel").innerText = `Level ${data.level}`;
        document.querySelector(".progress-labels span:first-child").innerHTML = `Rank Progress (Level ${data.level} &bull; ${data.xp.toLocaleString()} XP)`;
        
        const remainingXP = 500 - data.xpProgress;
        document.getElementById("levelRemaining").innerText = `${remainingXP} XP remaining to level ${data.level + 1}`;
        document.getElementById("levelProgressBar").style.width = `${(data.xpProgress / 500) * 100}%`;

        // Render Unlocked Showcase list (Mix of recently completed & close-to-unlocking)
        const showcaseEl = document.getElementById("achievementsContainer");
        showcaseEl.innerHTML = "";

        // Sort: Filter unlocked and locked, then sort locked by progress ratio descending
        const unlockedList = data.achievements.filter(m => m.unlocked);
        const lockedList = data.achievements.filter(m => !m.unlocked)
            .sort((a, b) => (b.current / b.target) - (a.current / a.target));

        const showcaseList = [];
        
        // Take up to 2 unlocked ones (recently completed) in reverse order
        const reversedUnlocked = [...unlockedList].reverse();
        if (reversedUnlocked.length >= 2) {
            showcaseList.push(reversedUnlocked[0]);
            showcaseList.push(reversedUnlocked[1]);
        } else if (reversedUnlocked.length === 1) {
            showcaseList.push(reversedUnlocked[0]);
        }

        // Fill remaining slots with locked achievements closest to completion
        let lockedIdx = 0;
        while (showcaseList.length < 3 && lockedIdx < lockedList.length) {
            showcaseList.push(lockedList[lockedIdx]);
            lockedIdx++;
        }

        // If still less than 3, fill with remaining unlocked ones
        let unlockedIdx = 2;
        while (showcaseList.length < 3 && unlockedIdx < reversedUnlocked.length) {
            showcaseList.push(reversedUnlocked[unlockedIdx]);
            unlockedIdx++;
        }

        showcaseList.forEach(m => {
            const meta = ACHIEVEMENT_META[m.id] || { icon: "fas fa-trophy", badge: "gold-badge" };
            const unlockClass = m.unlocked ? "unlocked" : "";
            const iconBoxClass = m.unlocked ? meta.badge : "";
            const iconStyle = m.unlocked ? meta.icon : "fas fa-lock";

            const achHtml = `
                <div class="achievement-badge ${unlockClass}">
                    <div class="ach-icon-box ${iconBoxClass}">
                        <i class="${iconStyle}"></i>
                    </div>
                    <div class="ach-details">
                        <h5>${m.title}</h5>
                        <p>${m.desc}</p>
                        ${m.unlocked 
                            ? `<span class="ach-unlocked-tag"><i class="fas fa-check-circle"></i> Unlocked (+${m.xp} XP)</span>`
                            : `
                            <div class="ach-mini-progress">
                                <div class="ach-mini-bar" style="width: ${Math.min(100, (m.current / m.target) * 100)}%;"></div>
                            </div>
                            <span class="ach-progress-text">${m.current.toLocaleString()} / ${m.target.toLocaleString()}</span>
                            `
                        }
                    </div>
                </div>
            `;
            showcaseEl.insertAdjacentHTML("beforeend", achHtml);
        });

        // Populate Modal Stats Header & full 40 Achievements Grid
        document.getElementById("modalAchievementsCount").innerText = `Unlocked: ${data.unlockedCount} / ${data.totalAchievements}`;
        
        const modalGrid = document.getElementById("modalAchievementsGrid");
        modalGrid.innerHTML = "";

        data.achievements.forEach(m => {
            const meta = ACHIEVEMENT_META[m.id] || { icon: "fas fa-trophy", badge: "gold-badge" };
            const unlockClass = m.unlocked ? "unlocked" : "";
            const iconBoxClass = m.unlocked ? meta.badge : "";
            const iconStyle = m.unlocked ? meta.icon : "fas fa-lock";

            const achHtml = `
                <div class="achievement-badge ${unlockClass}">
                    <div class="ach-icon-box ${iconBoxClass}">
                        <i class="${iconStyle}"></i>
                    </div>
                    <div class="ach-details">
                        <h5>${m.title}</h5>
                        <p>${m.desc}</p>
                        ${m.unlocked 
                            ? `<span class="ach-unlocked-tag"><i class="fas fa-check-circle"></i> Unlocked (+${m.xp} XP)</span>`
                            : `
                            <div class="ach-mini-progress">
                                <div class="ach-mini-bar" style="width: ${Math.min(100, (m.current / m.target) * 100)}%;"></div>
                            </div>
                            <span class="ach-progress-text">${m.current.toLocaleString()} / ${m.target.toLocaleString()}</span>
                            `
                        }
                    </div>
                </div>
            `;
            modalGrid.insertAdjacentHTML("beforeend", achHtml);
        });

    } catch (err) {
        console.error("Achievements UI render failed:", err);
    }
}

// 5. UPDATE COHESIVE AI TEXT INSIGHTS
function updateSummaryList() {
    if (!profileData) return;

    const summaryListEl = document.getElementById("aiSummaryList");
    if (!summaryListEl) return;
    summaryListEl.innerHTML = "";

    const rawPersonality = (profileData.personality || "Movie Fan").toLowerCase();
    const mappedPersona = PERSONA_TITLES[rawPersonality] || profileData.personality || "Movie Fan";
    const watchlistCount = profileData.watchlistCount || 0;
    const totalClicks = statsOverview.totalClicks || 0;

    let insights = [];
    if (watchlistCount === 0 && totalClicks === 0) {
        insights = [
            "Welcome to your neural dashboard! Your movie profile is currently a blank slate.",
            "Start searching and adding movies to your watchlist to enable taste mapping.",
            "Click on streaming links on movie cards to discover your streaming platform statistics."
        ];
    } else {
        insights.push(`Your profile highlights a distinct taste affinity for <strong>${mappedPersona}</strong> style narratives.`);
        if (statsOverview.topProvider !== "No Data") {
            insights.push(`You spend a significant portion of your exploration time browsing titles on <strong>${statsOverview.topProvider.replace(/\b\w/g, c => c.toUpperCase())}</strong>.`);
        }
        if (totalClicks > 0) {
            insights.push(`With <strong>${totalClicks}</strong> total movie interactions, your activity tier is classified as <strong>${profileData.activityLevel || "Casual"}</strong>.`);
        }
        insights.push(`Your taste profile reliability index is currently rated <strong>${profileData.profileStrength || "Low"}</strong> based on watchlist volume.`);
    }

    insights.forEach(insight => {
        const itemHtml = `
            <div class="summary-insight-item">
                <i class="fas fa-sparkles"></i>
                <span>${insight}</span>
            </div>
        `;
        summaryListEl.insertAdjacentHTML("beforeend", itemHtml);
    });
}

// 6. STREAMING PLATFORM DOUGHNUT CHART
async function loadProviderChart() {
    try {
        const res = await fetch(`${API_BASE}/analytics/providers?t=` + Date.now(), {
            headers: { Authorization: "Bearer " + token }
        });

        if (!res.ok) throw new Error("Provider statistics failed");

        const data = await res.json();
        const ctx = document.getElementById("providerChart");

        if (!data || Object.keys(data).length === 0) {
            ctx.style.display = "none";
            ctx.parentElement.insertAdjacentHTML(
                "beforeend",
                `
                <div class="empty-chart">
                    <i class="fas fa-satellite-dish"></i>
                    <h3>No Streaming Activity Yet</h3>
                    <p>Open streaming links on movie detail cards to build your universe.</p>
                </div>
                `
            );
            return;
        }

        const formattedLabels = Object.keys(data).map(word => 
            word.replace(/\b\w/g, letter => letter.toUpperCase())
        );

        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: formattedLabels, 
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        "#E32636", // Cinematic Red
                        "#3b82f6", // Neon Blue
                        "#8b5cf6", // Purple
                        "#f59e0b", // Gold
                        "#10b981", // Green
                        "#ec4899", // Pink
                        "#2ec4b6", // Teal
                        "#64748b"  // Slate
                    ],
                    borderWidth: 2,
                    borderColor: "#16161a",
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "72%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#94a3b8",
                            padding: 18,
                            usePointStyle: true,
                            pointStyle: "circle",
                            font: { size: 12, family: "Outfit" }
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error("Provider chart load failed", err);
        const ctx = document.getElementById("providerChart");
        if (ctx) ctx.style.display = "none";
    }
}

// 7. GENRE AFFINITY BAR CHART (With dynamic multi-colors)
async function loadGenreChart() {
    try {
        const res = await fetch(`${API_BASE}/analytics/genres?t=` + Date.now(), {
            headers: { Authorization: "Bearer " + token }
        });

        if (!res.ok) throw new Error("Genre statistics failed");

        const data = await res.json();
        const ctx = document.getElementById("genreChart");

        if (!data || Object.keys(data).length === 0) {
            ctx.style.display = "none";
            ctx.parentElement.insertAdjacentHTML(
                "beforeend",
                `
                <div class="empty-chart">
                    <i class="fas fa-compact-disc"></i>
                    <h3>No Movie DNA Map Yet</h3>
                    <p>Explore movie details to populate your genre affinity layout.</p>
                </div>
                `
            );
            return;
        }

        const formattedLabels = Object.keys(data).map(word => 
            word.replace(/\b\w/g, letter => letter.toUpperCase())
        );

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: formattedLabels, 
                datasets: [{
                    label: "Explored Genre Counts",
                    data: Object.values(data),
                    backgroundColor: [
                        "#E32636", // Cinematic Red
                        "#3b82f6", // Neon Blue
                        "#8b5cf6", // Purple
                        "#f59e0b", // Gold
                        "#10b981", // Green
                        "#ec4899", // Pink
                        "#e76f51", // Orange
                        "#2ec4b6", // Teal
                        "#f72585", // Magenta
                        "#7209b7"  // Dark Purple
                    ],
                    borderRadius: 8,
                    barThickness: 24
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: "#94a3b8",
                            font: { size: 11, family: "Outfit" },
                            stepSize: 1
                        },
                        grid: {
                            color: "rgba(255,255,255,0.03)"
                        },
                        border: { display: false }
                    },
                    x: {
                        ticks: {
                            color: "#94a3b8",
                            font: { size: 11, family: "Outfit" }
                        },
                        grid: { display: false },
                        border: { display: false }
                    }
                }
            }
        });
    } catch (err) {
        console.error("Genre chart load failed", err);
        const ctx = document.getElementById("genreChart");
        if (ctx) ctx.style.display = "none";
    }
}

// 8. ALL ACHIEVEMENTS MODAL EVENTS
function setupAchievementsModal() {
    const modal = document.getElementById("achievementsModal");
    const openBtn = document.getElementById("allAchievementsBtn");
    const closeBtn = document.getElementById("closeAchievementsModal");

    if (openBtn && modal) {
        openBtn.addEventListener("click", () => {
            modal.classList.remove("hidden");
            setTimeout(() => modal.classList.add("show"), 10);
            document.body.classList.add("modal-open");
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.classList.remove("show");
            setTimeout(() => modal.classList.add("hidden"), 300);
            document.body.classList.remove("modal-open");
        });
    }

    if (modal) {
        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("show");
                setTimeout(() => modal.classList.add("hidden"), 300);
                document.body.classList.remove("modal-open");
            }
        });
    }
}

// Bootstrapping function calls
loadAnalytics();
loadProfile();
loadAchievements();
loadProviderChart();
loadGenreChart();
setupAchievementsModal();

window.logout = function () {
    sessionStorage.removeItem("token");
    window.location.href = "login.html";
};
