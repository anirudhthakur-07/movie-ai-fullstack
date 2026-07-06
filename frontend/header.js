// Shared Header Component - Dark Manual & Onboarding Flow
document.addEventListener("DOMContentLoaded", () => {
    // 1. Inject Stylesheet for Drawer & Onboarding Popup
    const styleEl = document.createElement("style");
    styleEl.textContent = `
        /* Navigation alignment fixes */
        .nav-right {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
        }

        /* Drawer container styling */
        .manual-drawer {
            position: fixed !important;
            top: 0 !important;
            right: 0 !important;
            width: 380px !important;
            height: 100vh !important;
            background: rgba(10, 10, 12, 0.82) !important;
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
        .drawer-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
            padding-bottom: 16px !important;
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
        .drawer-header .close-btn {
            background: none !important;
            border: none !important;
            color: #8e8e93 !important;
            font-size: 1.5rem !important;
            cursor: pointer !important;
            transition: color 0.2s ease !important;
        }
        .drawer-header .close-btn:hover {
            color: #fff !important;
        }
        .drawer-body {
            flex: 1 !important;
            overflow-y: auto !important;
            padding-top: 16px !important;
            padding-right: 4px !important;
        }
        .manual-section {
            background: rgba(255, 255, 255, 0.03) !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
            border-radius: 12px !important;
            padding: 16px !important;
            margin-bottom: 16px !important;
            transition: border-color 0.3s ease !important;
        }
        .manual-section:hover {
            border-color: rgba(255, 46, 67, 0.3) !important;
        }
        .manual-section h4 {
            margin: 0 0 8px 0 !important;
            font-size: 0.95rem !important;
            color: #fff !important;
            font-family: 'Outfit', sans-serif !important;
        }
        .manual-section p {
            margin: 0 !important;
            font-size: 0.8rem !important;
            color: #c7c7cc !important;
            line-height: 1.5 !important;
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
            background: rgba(18, 18, 22, 0.85) !important;
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
        .close-popup-btn {
            background: none !important;
            border: none !important;
            color: #8e8e93 !important;
            font-size: 1.25rem !important;
            cursor: pointer !important;
        }
        .close-popup-btn:hover {
            color: #fff !important;
        }
        .popup-message {
            font-size: 0.8rem !important;
            color: #c7c7cc !important;
            line-height: 1.45 !important;
            margin: 0 0 16px 0 !important;
            text-align: left !important;
        }
        .popup-footer {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        .checkbox-container {
            font-size: 0.72rem !important;
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
            padding: 6px 12px !important;
            border-radius: 8px !important;
            font-size: 0.75rem !important;
            cursor: pointer !important;
            font-family: 'Outfit', sans-serif !important;
            font-weight: 600 !important;
        }
        
        /* Mobile layout styling updates */
        @media (max-width: 480px) {
            .manual-drawer {
                width: 100% !important;
            }
            .onboarding-popup {
                bottom: 16px !important;
                right: 16px !important;
                width: calc(100% - 32px) !important;
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
            </div>
            <div class="drawer-body">
                <section class="manual-section">
                    <h4>🔮 1. The DNA Profile & Streaming Home</h4>
                    <p>Your profile is a living, breathing <strong>Movie DNA signature</strong> that adapts based on your clicks, searches, and watchlist additions.</p>
                    <p style="margin-top: 8px;">Clicking Netflix/Prime links locks in your <strong>Streaming Home</strong> and filters movie recommendations.</p>
                </section>
                <section class="manual-section">
                    <h4>🧠 2. The Nyx Curator</h4>
                    <p>Engage with <strong>Nyx</strong> by opening the floating chat orb. Ask <em>"Analyze my taste profile"</em> to get neural narrative critiques based on your history.</p>
                </section>
                <section class="manual-section">
                    <h4>🏆 3. The Explorer Journey</h4>
                    <p>Earn XP by searching and clicking. Progress through <strong>40-Tier Gamified Achievements</strong> to advance your Explorer Level and unlock profile badges.</p>
                </section>
                <section class="manual-section">
                    <h4>🍿 4. The Library & Co-Viewing</h4>
                    <p>Curate your <strong>Watchlist</strong> and group items into custom folders. Match watchlists with friends to suggest movies for joint co-viewing.</p>
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

    // 5. Drawer Toggle Logic
    const openManualBtn = document.getElementById("darkManualBtn");
    const closeManualBtn = document.getElementById("closeManualDrawer");
    const drawer = document.getElementById("darkManualDrawer");

    if (openManualBtn && drawer) {
        openManualBtn.addEventListener("click", () => {
            drawer.classList.toggle("show");
        });
    }
    if (closeManualBtn && drawer) {
        closeManualBtn.addEventListener("click", () => {
            drawer.classList.remove("show");
        });
    }

    // 6. Onboarding Notification Logic
    const popup = document.getElementById("onboardingPopup");
    const closePopupBtn = document.getElementById("closeOnboardingPopup");
    const startOnboardingBtn = document.getElementById("startOnboardingBtn");
    const dontShowAgainCheck = document.getElementById("dontShowAgainCheck");

    // Check storage constraints
    const onboardingDisabled = localStorage.getItem("dark_onboarding_disabled") === "true";
    const sessionTriggered = sessionStorage.getItem("dark_onboarding_session_triggered") === "true";

    if (!onboardingDisabled && !sessionTriggered) {
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
        if (dontShowAgainCheck && dontShowAgainCheck.checked) {
            localStorage.setItem("dark_onboarding_disabled", "true");
        }
    };

    if (closePopupBtn) {
        closePopupBtn.addEventListener("click", dismissPopup);
    }

    if (startOnboardingBtn) {
        startOnboardingBtn.addEventListener("click", () => {
            dismissPopup();
            if (drawer) drawer.classList.add("show");
        });
    }
});
