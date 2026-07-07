// Shared Header Component - Dark Manual & Onboarding Flow
document.addEventListener("DOMContentLoaded", () => {
    // 1. Inject Stylesheet for Drawer, Onboarding Popup, and Toast notifications
    const styleEl = document.createElement("style");
    styleEl.textContent = `
        /* Navigation alignment fixes */
        .nav-right {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
        }

        /* Drawer container styling (Desktop) */
        .manual-drawer {
            position: fixed !important;
            top: 0 !important;
            right: 0 !important;
            width: 380px !important;
            height: 100vh !important;
            background: rgba(10, 10, 12, 0.95) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border-left: 1px solid rgba(255, 46, 67, 0.25) !important;
            box-shadow: -10px 0 30px rgba(0, 0, 0, 0.9) !important;
            z-index: 9999 !important;
            transform: translateX(100%) !important;
            transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            box-sizing: border-box !important;
        }
        .manual-drawer.show {
            transform: translateX(0) !important;
        }
        .drawer-content {
            display: flex !important;
            flex-direction: column !important;
            height: 100% !important;
            padding: 24px !important;
            box-sizing: border-box !important;
        }
        
        /* Tooltip and progress bar alignment */
        .drawer-header {
            position: relative !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
            padding-bottom: 18px !important;
            margin-bottom: 8px !important;
        }
        .drawer-header h3 {
            margin: 0 !important;
            font-size: 1.25rem !important;
            font-family: 'Outfit', sans-serif !important;
            color: #fff !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
        }
        .drawer-header h3 i {
            color: #ff2e43 !important;
        }
        
        /* Touch target optimization: min 44x44px for Close targets */
        .drawer-header .close-btn {
            background: none !important;
            border: none !important;
            color: #8e8e93 !important;
            font-size: 1.8rem !important;
            cursor: pointer !important;
            width: 44px !important;
            height: 44px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            position: relative !important;
            z-index: 101 !important;
            transition: color 0.2s ease !important;
        }
        .drawer-header .close-btn:hover {
            color: #fff !important;
        }
        
        /* Scrollable body with custom styles */
        .drawer-body {
            flex: 1 !important;
            overflow-y: auto !important;
            padding-top: 16px !important;
            padding-right: 4px !important;
            -webkit-overflow-scrolling: touch !important;
        }
        .drawer-body::-webkit-scrollbar {
            width: 6px !important;
        }
        .drawer-body::-webkit-scrollbar-track {
            background: transparent !important;
        }
        .drawer-body::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15) !important;
            border-radius: 10px !important;
        }
        .drawer-body::-webkit-scrollbar-thumb:hover {
            background: #ff2e43 !important;
        }
        .manual-section {
            background: rgba(255, 255, 255, 0.03) !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
            border-radius: 12px !important;
            padding: 18px !important;
            margin-bottom: 16px !important;
            transition: border-color 0.3s ease !important;
        }
        .manual-section:hover {
            border-color: rgba(255, 46, 67, 0.3) !important;
        }
        .manual-section h4 {
            margin: 0 0 10px 0 !important;
            font-size: 1rem !important;
            color: #fff !important;
            font-family: 'Outfit', sans-serif !important;
        }
        .manual-section p {
            margin: 0 !important;
            font-size: 0.85rem !important;
            color: #c7c7cc !important;
            line-height: 1.6 !important;
        }
        .manual-section p strong {
            color: #fff !important;
        }

        /* Onboarding popup card styling */
        .onboarding-popup {
            position: fixed !important;
            bottom: 24px !important;
            right: 24px !important;
            width: 320px !important;
            background: rgba(18, 18, 22, 0.88) !important;
            backdrop-filter: blur(15px) !important;
            -webkit-backdrop-filter: blur(15px) !important;
            border: 1px solid rgba(255, 46, 67, 0.3) !important;
            border-radius: 16px !important;
            padding: 20px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7) !important;
            z-index: 9998 !important;
            transform: translateY(40px) !important;
            opacity: 0 !important;
            pointer-events: none !important;
            transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important;
            box-sizing: border-box !important;
        }
        .onboarding-popup.show {
            transform: translateY(0) !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }
        .popup-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 10px !important;
        }
        .popup-header h5 {
            margin: 0 !important;
            font-size: 0.95rem !important;
            color: #fff !important;
            font-family: 'Outfit', sans-serif !important;
        }
        
        /* Popup close touch target */
        .close-popup-btn {
            background: none !important;
            border: none !important;
            color: #8e8e93 !important;
            font-size: 1.5rem !important;
            cursor: pointer !important;
            width: 44px !important;
            height: 44px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin: -10px !important;
            padding: 0 !important;
        }
        .close-popup-btn:hover {
            color: #fff !important;
        }
        .popup-message {
            font-size: 0.85rem !important;
            color: #c7c7cc !important;
            line-height: 1.5 !important;
            margin: 0 0 16px 0 !important;
            text-align: left !important;
        }
        .popup-footer {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        .checkbox-container {
            font-size: 0.75rem !important;
            color: #8e8e93 !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
        }
        .popup-footer .action-btn {
            background: linear-gradient(135deg, #ff2e43 0%, #b3001b 100%) !important;
            border: none !important;
            color: #fff !important;
            padding: 8px 16px !important;
            border-radius: 8px !important;
            font-size: 0.8rem !important;
            cursor: pointer !important;
            font-family: 'Outfit', sans-serif !important;
            font-weight: 600 !important;
        }

        /* Toast notifications styles */
        .toast-container {
            position: fixed !important;
            bottom: 24px !important;
            right: 24px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            z-index: 10000 !important;
            pointer-events: none !important;
            max-width: 350px !important;
            width: 100% !important;
        }
        .toast-card {
            display: flex !important;
            align-items: center !important;
            gap: 16px !important;
            background: rgba(18, 18, 22, 0.95) !important;
            backdrop-filter: blur(15px) !important;
            -webkit-backdrop-filter: blur(15px) !important;
            border: 1px solid rgba(255, 46, 67, 0.3) !important;
            border-radius: 12px !important;
            padding: 14px 18px !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 46, 67, 0.1) !important;
            pointer-events: auto !important;
            transform: translateY(20px) scale(0.95) !important;
            opacity: 0 !important;
            transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important;
            box-sizing: border-box !important;
        }
        .toast-card.show {
            transform: translateY(0) scale(1) !important;
            opacity: 1 !important;
        }
        .toast-card.exit {
            transform: translateY(-20px) scale(0.9) !important;
            opacity: 0 !important;
        }
        .toast-card.level-up-toast {
            border: 1px solid rgba(255, 215, 0, 0.5) !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2) !important;
        }
        .toast-card.level-up-toast .toast-icon i {
            color: #ffd700 !important;
            text-shadow: 0 0 8px rgba(255, 215, 0, 0.5) !important;
        }
        .toast-icon {
            font-size: 1.5rem !important;
            color: #ff2e43 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 32px !important;
        }
        .toast-details {
            display: flex !important;
            flex-direction: column !important;
            text-align: left !important;
        }
        .toast-alert-title {
            font-size: 0.72rem !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            color: #8e8e93 !important;
            font-weight: 600 !important;
            margin-bottom: 2px !important;
        }
        .toast-title {
            font-family: 'Outfit', sans-serif !important;
            font-size: 0.9rem !important;
            color: #fff !important;
            font-weight: 700 !important;
        }
        .toast-xp {
            font-size: 0.75rem !important;
            color: #34c759 !important;
            font-weight: 600 !important;
            margin-top: 2px !important;
        }
        
        /* Body scroll lock override */
        /* Body scroll lock override */
        html.manual-open-lock, body.manual-open-lock {
            overflow: hidden !important;
            height: 100% !important;
            width: 100% !important;
        }
        
        /* Mobile responsive stylesheet */
        @media (max-width: 768px) {
            /* Full-Screen cinematic overlay */
            .manual-drawer {
                width: 100% !important;
                height: 100% !important;
                border-left: none !important;
                border-top: 1px solid rgba(255, 46, 67, 0.25) !important;
                transform: translateY(100%) !important;
                transition: transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            }
            .manual-drawer.show {
                transform: translateY(0) !important;
            }
            .drawer-content {
                padding: 20px !important;
            }
            .onboarding-popup {
                bottom: 16px !important;
                right: 16px !important;
                width: calc(100% - 32px) !important;
            }

            /* Responsive toast positioning */
            .toast-container {
                bottom: auto !important;
                top: 20px !important;
                right: 50% !important;
                transform: translateX(50%) !important;
                width: 90% !important;
                max-width: 450px !important;
            }
            .toast-card {
                transform: translateY(-20px) scale(0.95) !important;
            }
            .toast-card.show {
                transform: translateY(0) scale(1) !important;
            }
            .toast-card.exit {
                transform: translateY(-10px) scale(0.9) !important;
            }
            
            /* Navbar mobile compact adjustments */
            .nav-right {
                gap: 8px !important;
            }
            .nav-action-btn {
                font-size: 0 !important;
                padding: 0 !important;
                width: 36px !important;
                height: 36px !important;
                border-radius: 50% !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .nav-action-btn i {
                font-size: 14px !important;
                margin: 0 !important;
            }
        }
    `;
    document.head.appendChild(styleEl);

    // 2. Locate Nav and Inject Compass Button
    const navRight = document.querySelector(".nav-right");
    if (navRight) {
        const manualBtn = document.createElement("button");
        manualBtn.className = "nav-action-btn manual-btn";
        manualBtn.id = "darkManualBtn";
        manualBtn.innerHTML = `<i class="fas fa-compass"></i> Manual`;
        
        // Insert before logout button if present, otherwise append
        const logoutBtn = navRight.querySelector(".logout-btn");
        if (logoutBtn) {
            navRight.insertBefore(manualBtn, logoutBtn);
        } else {
            navRight.appendChild(manualBtn);
        }
    }

    // 3. Inject Manual Drawer HTML Markup
    const drawerEl = document.createElement("div");
    drawerEl.id = "darkManualDrawer";
    drawerEl.className = "manual-drawer";
    drawerEl.innerHTML = `
        <div class="drawer-content glass-card">
            <div class="drawer-header">
                <h3><i class="fas fa-compass icon-gradient"></i> The Dark Manual</h3>
                <button id="closeManualDrawer" class="close-btn">&times;</button>
                <!-- Sticky scroll progress indicator bar -->
                <div id="manualProgressBar" style="position: absolute; bottom: 0; left: 0; height: 3px; background: #ff2e43; width: 0%; transition: width 0.1s ease;"></div>
            </div>
            <div class="drawer-body" id="manualDrawerBody">
                <section class="manual-section">
                    <h4>🔮 1. The DNA Profile</h4>
                    <p>Calculates and projects your active taste distribution and cinematic preferences across key genre nodes.</p>
                </section>
                <section class="manual-section">
                    <h4>📺 2. Streaming Home</h4>
                    <p>Tracks your streaming clicks to set your primary provider and filters recommendations matching your networks.</p>
                </section>
                <section class="manual-section">
                    <h4>🧠 3. The Nyx Curator</h4>
                    <p>Open the chat orb to consult Nyx—a platform-aware curator providing deep insights grounded on your context.</p>
                </section>
                <section class="manual-section">
                    <h4>🏆 4. Explorer Levels</h4>
                    <p>Earn XP by searching and interacting, driving your climb across profile rankings.</p>
                </section>
                <section class="manual-section">
                    <h4>🎖️ 5. Achievement Badges</h4>
                    <p>A 40-tier gamified challenge path unlocking profile badges reflecting your viewing behaviors.</p>
                </section>
                <section class="manual-section">
                    <h4>📂 6. Curated Folders</h4>
                    <p>Organize watchlist items into custom-named folders to group titles matching specific viewing moods.</p>
                </section>
                <section class="manual-section">
                    <h4>👥 7. Co-Viewing Matcher</h4>
                    <p>Select a friend's profile to compute watchlist overlaps and suggest perfect joint watch party selections.</p>
                </section>
                <section class="manual-section">
                    <h4>🔍 8. Exploration Index</h4>
                    <p>Measures search depth and genre diversity to grade how actively you seek hidden cinematic gems.</p>
                </section>
            </div>
        </div>
    `;
    document.body.appendChild(drawerEl);

    // 4. Inject Onboarding Welcome Pop-up
    const popupEl = document.createElement("div");
    popupEl.id = "onboardingPopup";
    popupEl.className = "onboarding-popup";
    popupEl.innerHTML = `
        <div class="popup-header">
            <h5><i class="fas fa-sparkles icon-gradient"></i> System Initialization</h5>
            <button id="closeOnboardingPopup" class="close-popup-btn">&times;</button>
        </div>
        <p class="popup-message">Welcome to the archives. Your manual is now available. Click the compass to begin your journey.</p>
        <div class="popup-footer">
            <label class="checkbox-container">
                <input type="checkbox" id="dontShowAgainCheck">
                Don't show again
            </label>
            <button id="startOnboardingBtn" class="action-btn">Open Manual</button>
        </div>
    `;
    document.body.appendChild(popupEl);

    // 5. Drawer Toggle & Scroll Lock logic
    const openManualBtn = document.getElementById("darkManualBtn");
    const closeManualBtn = document.getElementById("closeManualDrawer");
    const drawer = document.getElementById("darkManualDrawer");

    const openDrawer = () => {
        if (drawer) {
            drawer.classList.add("show");
            document.documentElement.classList.add("manual-open-lock");
            document.body.classList.add("manual-open-lock");
        }
    };

    const closeDrawer = () => {
        if (drawer) {
            drawer.classList.remove("show");
            document.documentElement.classList.remove("manual-open-lock");
            document.body.classList.remove("manual-open-lock");
        }
    };

    if (openManualBtn) {
        openManualBtn.addEventListener("click", openDrawer);
    }
    if (closeManualBtn) {
        closeManualBtn.addEventListener("click", closeDrawer);
    }

    // 6. Scroll Progress Bar logic
    const drawerBody = document.getElementById("manualDrawerBody");
    const progressBar = document.getElementById("manualProgressBar");

    if (drawerBody && progressBar) {
        drawerBody.addEventListener("scroll", () => {
            const scrollTop = drawerBody.scrollTop;
            const scrollHeight = drawerBody.scrollHeight;
            const clientHeight = drawerBody.clientHeight;
            const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
            progressBar.style.width = scrollPercent + "%";
        });
    }

    // 7. Onboarding Notification Logic
    const popup = document.getElementById("onboardingPopup");
    const closePopupBtn = document.getElementById("closeOnboardingPopup");
    const startOnboardingBtn = document.getElementById("startOnboardingBtn");
    const dontShowAgainCheck = document.getElementById("dontShowAgainCheck");

    // Check storage constraints - only prompt new sign-up users once
    const onboardingDisabled = localStorage.getItem("dark_onboarding_disabled") === "true";
    const sessionTriggered = sessionStorage.getItem("dark_onboarding_session_triggered") === "true";
    const justRegistered = localStorage.getItem("just_registered") === "true";

    if (justRegistered && !onboardingDisabled && !sessionTriggered) {
        // Trigger popup notification non-intrusively 2 seconds after dashboard load
        setTimeout(() => {
            if (popup) {
                popup.classList.add("show");
                sessionStorage.setItem("dark_onboarding_session_triggered", "true");
            }
        }, 2000);
    }

    const dismissPopup = () => {
        if (popup) popup.classList.remove("show");
        // Mark onboarding completed/disabled forever once shown
        localStorage.setItem("dark_onboarding_disabled", "true");
        localStorage.removeItem("just_registered");
    };

    if (closePopupBtn) {
        closePopupBtn.addEventListener("click", dismissPopup);
    }

    if (startOnboardingBtn) {
        startOnboardingBtn.addEventListener("click", () => {
            dismissPopup();
            openDrawer();
        });
    }
});

// ==========================================================================
// 8. EVENT-DRIVEN SINGLETON TOAST NOTIFICATION QUEUE (PRODUCTION HARDENED)
// ==========================================================================
class ToastManager {
    constructor() {
        this.queue = [];
        this.stage = [];
        this.active = false;
        this.debounceTimer = null;
    }

    // Prevents DOM XSS injection attacks
    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Dynamic show request entry
    show(payload) {
        const sanitized = {
            title: this.escapeHTML(payload.title),
            xp: Number(payload.xp) || 0,
            iconClass: this.escapeHTML(payload.iconClass || 'fas fa-award'),
            priority: Number(payload.priority) || 1
        };

        // High priority actions (Level Ups = 3) bypass aggregation
        if (sanitized.priority === 3) {
            this.queue.push(sanitized);
            this.sortQueue();
            this.processQueue();
        } else {
            this.stage.push(sanitized);
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.flushStaging();
            }, 300);
        }
    }

    // Aggregates standard achievements triggered simultaneously
    flushStaging() {
        if (this.stage.length === 1) {
            this.queue.push(this.stage[0]);
        } else if (this.stage.length > 1) {
            const totalXP = this.stage.reduce((sum, item) => sum + (item.xp || 0), 0);
            this.queue.push({
                title: `${this.stage.length} Achievements Unlocked!`,
                xp: totalXP,
                iconClass: "fas fa-trophy",
                priority: 1
            });
        }
        this.stage = [];
        this.sortQueue();
        this.processQueue();
    }

    sortQueue() {
        // Sorts descending by priority: Level Up (3) -> Avatar (2) -> Standard (1)
        this.queue.sort((a, b) => b.priority - a.priority);
    }

    async processQueue() {
        if (this.active || this.queue.length === 0) return;
        this.active = true;
        const nextToast = this.queue.shift();
        await this.renderToast(nextToast);
        this.active = false;
        this.processQueue();
    }

    renderToast(data) {
        return new Promise(resolve => {
            const container = this.getContainer();
            const card = document.createElement("div");
            
            const isLevelUp = data.priority === 3;
            card.className = `toast-card glass-card ${isLevelUp ? 'level-up-toast' : ''}`;
            
            card.innerHTML = `
                <div class="toast-icon"><i class="${data.iconClass}"></i></div>
                <div class="toast-details">
                    <span class="toast-alert-title">${isLevelUp ? 'System Upgrade' : 'Milestone Reached'}</span>
                    <strong class="toast-title">${data.title}</strong>
                    ${data.xp ? `<span class="toast-xp">+${data.xp} XP</span>` : ''}
                </div>
            `;
            container.appendChild(card);

            // Entry animation trigger
            setTimeout(() => card.classList.add("show"), 50);

            // Dismiss & auto-cleanup
            setTimeout(() => {
                card.classList.remove("show");
                card.classList.add("exit");
                card.addEventListener("transitionend", () => {
                    card.remove();
                    resolve();
                });
            }, isLevelUp ? 5000 : 4000);
        });
    }

    getContainer() {
        let container = document.getElementById("toastContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "toastContainer";
            container.className = "toast-container";
            document.body.appendChild(container);
        }
        return container;
    }
}

// Global hook instantiation
window.toastManager = new ToastManager();
