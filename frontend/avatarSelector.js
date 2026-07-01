// Helper to sanitize HTML content safely
function escapeHTML(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// PERSONAS specification mapping
const PERSONAS_CONFIG = [
    { name: "Cinematic Explorer", key: "movie_fan", achievement: "new_movie_fan", genre: "default" },
    { name: "Space Explorer", key: "space_explorer", achievement: "scifi_explorer", genre: "science fiction" },
    { name: "Thriller Hunter", key: "thriller_hunter", achievement: "romance_enthusiast", genre: "thriller" }, 
    { name: "Drama Enthusiast", key: "drama_enthusiast", achievement: "drama_critic", genre: "drama" },
    { name: "Action Addict", key: "action_addict", achievement: "action_hero", genre: "action" },
    { name: "Horror Seeker", key: "horror_seeker", achievement: "horror_survivor", genre: "horror" },
    { name: "Comedy Lover", key: "comedy_lover", achievement: "comedy_lover", genre: "comedy" },
    { name: "Adventure Explorer", key: "adventure_explorer", achievement: "adventure_seeker", genre: "adventure" },
    { name: "Fantasy Dreamer", key: "fantasy_dreamer", achievement: "fantasy_dreamer", genre: "fantasy" },
    { name: "Animation Enthusiast", key: "animation_enthusiast", achievement: "animation_fan", genre: "animation" },
    { name: "Mystery Detective", key: "mystery_detective", achievement: "mystery_detective", genre: "mystery" }
];

// Show customizable notification toast inside the modal card
function showAvatarNotification(message) {
    let notification = document.getElementById("avatarNotification");
    if (!notification) {
        notification = document.createElement("div");
        notification.id = "avatarNotification";
        notification.className = "avatar-notification";
        document.body.appendChild(notification);
    }
    notification.innerText = message;
    notification.classList.add("show");
    
    // Clear previous timeout
    if (window.avatarNotificationTimeout) {
        clearTimeout(window.avatarNotificationTimeout);
    }
    window.avatarNotificationTimeout = setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

// Open the selection modal
async function openAvatarSelector(currentPersonaRaw, currentGender, username, onSaveCallback) {
    // 1. Fetch achievements list to know which ones are unlocked
    let unlockedAchievements = [];
    const token = sessionStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE}/achievements`, {
            headers: { "Authorization": "Bearer " + token }
        });
        if (res && res.ok) {
            const data = await res.json();
            unlockedAchievements = data.achievements.filter(m => m.unlocked).map(m => m.id);
        }
    } catch (err) {
        console.error("Error fetching achievements for avatar selection:", err);
    }

    // 2. Fetch locally recorded unlocked personas to persist history across profile shifts
    const localKey = "unlocked_personas_" + username;
    let localUnlocked = [];
    try {
        localUnlocked = JSON.parse(localStorage.getItem(localKey) || "[]");
    } catch {}

    // Map raw active persona correctly to match config keys returned by the profile engine
    const activePersonaName = (() => {
        const raw = (currentPersonaRaw || "").toLowerCase().trim();
        let targetKey = "movie_fan";
        if (raw === "sci-fi explorer" || raw === "science fiction" || raw === "sci-fi") {
            targetKey = "space_explorer";
        } else if (raw === "thriller hunter" || raw === "thriller") {
            targetKey = "thriller_hunter";
        } else if (raw === "drama enthusiast" || raw === "drama") {
            targetKey = "drama_enthusiast";
        } else if (raw === "action addict" || raw === "action") {
            targetKey = "action_addict";
        } else if (raw === "horror seeker" || raw === "horror") {
            targetKey = "horror_seeker";
        } else if (raw === "comedy lover" || raw === "comedy") {
            targetKey = "comedy_lover";
        } else if (raw === "adventure explorer" || raw === "adventure") {
            targetKey = "adventure_explorer";
        } else if (raw === "fantasy dreamer" || raw === "fantasy") {
            targetKey = "fantasy_dreamer";
        } else if (raw === "animation enthusiast" || raw === "animation") {
            targetKey = "animation_enthusiast";
        } else if (raw === "mystery detective" || raw === "mystery") {
            targetKey = "mystery_detective";
        }
        const currentConfig = PERSONAS_CONFIG.find(p => p.key === targetKey);
        return currentConfig ? currentConfig.name : "Cinematic Explorer";
    })();

    if (!localUnlocked.includes(activePersonaName)) {
        localUnlocked.push(activePersonaName);
        localStorage.setItem(localKey, JSON.stringify(localUnlocked));
    }

    // Create Modal Backdrop
    let backdrop = document.getElementById("avatarSelectorModal");
    if (backdrop) backdrop.remove();

    backdrop = document.createElement("div");
    backdrop.id = "avatarSelectorModal";
    backdrop.className = "avatar-modal-backdrop";

    // Close on backdrop click (but not card)
    backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
            backdrop.remove();
        }
    });

    const card = document.createElement("div");
    card.className = "avatar-modal-card";

    const closeBtn = document.createElement("button");
    closeBtn.className = "avatar-modal-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => backdrop.remove());
    card.appendChild(closeBtn);

    const header = document.createElement("div");
    header.className = "avatar-modal-header";
    header.innerHTML = `
        <h3>Choose Profile Avatar</h3>
        <p>Active Taste DNA: <span class="glowing-red" style="font-weight: 700;">${escapeHTML(activePersonaName)}</span>. Toggle between the Male or Female avatar for your active persona. Other personas unlock permanently as your Taste DNA evolves!</p>
    `;
    card.appendChild(header);

    const gridContainer = document.createElement("div");
    gridContainer.className = "avatar-grid-container";

    const listDiv = document.createElement("div");
    listDiv.className = "avatar-personas-list";

    PERSONAS_CONFIG.forEach(p => {
        const isCurrent = (p.name === activePersonaName);
        const isUnlocked = isCurrent || 
                           unlockedAchievements.includes(p.achievement) || 
                           localUnlocked.includes(p.name) ||
                           p.genre === "default"; // cinematic explorer always unlocked

        const row = document.createElement("div");
        row.className = "avatar-persona-row" + (isCurrent ? " active-persona-row" : "");

        const info = document.createElement("div");
        info.className = "avatar-persona-info";
        info.innerHTML = `
            <div class="avatar-persona-name">${escapeHTML(p.name)}</div>
            <div class="avatar-persona-desc ${isUnlocked ? 'unlocked' : ''}">
                ${isCurrent ? '⚡ Active Persona' : isUnlocked ? '✅ Unlocked' : `🔒 Locked (Complete ${p.genre === 'thriller' ? 'Thriller' : p.name.replace(' Hunter','').replace(' Addict','').replace(' Lover','').replace(' Seeker','').replace(' Explorer','').replace(' Enthusiast','').replace(' Navigator','')} achievements to unlock)`}
            </div>
        `;
        row.appendChild(info);

        const pairDiv = document.createElement("div");
        pairDiv.className = "avatar-pair";

        const genders = ["female", "male"];
        genders.forEach(g => {
            const avatarUrl = `assets/avatars/${p.key}_${g}.jpg`;
            const isActiveAvatar = isCurrent && (currentGender.toLowerCase() === g);

            const opt = document.createElement("div");
            opt.className = `avatar-option-card${isUnlocked ? '' : ' locked'}${isActiveAvatar ? ' active-avatar' : ''}`;
            opt.title = `${p.name} (${g === 'female' ? 'Female' : 'Male'})`;

            const img = document.createElement("img");
            img.src = avatarUrl;
            img.alt = `${p.name} ${g}`;
            img.onerror = () => {
                img.style.display = "none";
                opt.innerText = g.charAt(0).toUpperCase();
            };
            opt.appendChild(img);

            // Handle Avatar Clicks
            opt.addEventListener("click", async () => {
                if (!isUnlocked) {
                    showAvatarNotification(`Locked! Explore movies in the ${escapeHTML(p.genre)} genre to unlock this persona.`);
                    return;
                }
                if (!isCurrent) {
                    showAvatarNotification(`Active persona is locked to your Taste DNA! You can only toggle Male/Female for ${escapeHTML(activePersonaName)}.`);
                    return;
                }
                if (isActiveAvatar) {
                    return;
                }

                // Call Gender Update API
                try {
                    const updateRes = await fetch(`${API_BASE}/profile/gender`, {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        },
                        body: JSON.stringify({ gender: g })
                    });
                    if (updateRes && updateRes.ok) {
                        showAvatarNotification("Success! Profile avatar updated.");
                        backdrop.remove();
                        if (onSaveCallback) {
                            onSaveCallback(g);
                        }
                    } else {
                        showAvatarNotification("Failed to update avatar. Please try again.");
                    }
                } catch (err) {
                    console.error("Failed to update avatar:", err);
                    showAvatarNotification("Error updating avatar.");
                }
            });

            pairDiv.appendChild(opt);
        });

        row.appendChild(pairDiv);
        listDiv.appendChild(row);
    });

    gridContainer.appendChild(listDiv);
    card.appendChild(gridContainer);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
}
