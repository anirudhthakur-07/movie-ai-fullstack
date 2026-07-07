// Frontend controller for the Floating Nyx Orb interface and JSON actions dispatcher
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("nyxOrbContainer");
  const orb = document.getElementById("nyxOrb");
  const chatWindow = document.getElementById("nyxChatWindow");
  const closeBtn = document.getElementById("closeNyxChat");
  const chatBody = document.getElementById("nyxChatBody");
  const input = document.getElementById("nyxInput");
  const sendBtn = document.getElementById("nyxSendBtn");

  if (!orb || !chatWindow || !closeBtn || !chatBody || !input || !sendBtn) {
    return;
  }

  let chatHistory = [];
  let isProcessing = false;
  let inactivityTimer;
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes session duration

  // Initialize and load chat history from sessionStorage (Persists on active tab navigation)
  function loadChatHistory() {
    try {
      const stored = sessionStorage.getItem("nyx_chat_history");
      if (stored) {
        const messages = JSON.parse(stored);
        if (Array.isArray(messages) && messages.length > 0) {
          // Clear default DOM welcome message if we have loaded history
          chatBody.innerHTML = "";
          messages.forEach(msg => {
            // Re-render message bubble
            appendMessage(msg.text, msg.sender, false);
            // Re-add to memory array for LLM context calls
            if (msg.sender === "user") {
              chatHistory.push({ query: msg.text, response: "" });
            } else if (msg.sender === "system" && chatHistory.length > 0) {
              chatHistory[chatHistory.length - 1].response = msg.text;
            }
          });
        }
      }
    } catch (e) { /* silent */ }
  }

  // Save single message item to sessionStorage list
  function saveMessageToStorage(text, sender) {
    try {
      let messages = [];
      const stored = sessionStorage.getItem("nyx_chat_history");
      if (stored) {
        messages = JSON.parse(stored);
      }
      messages.push({ sender, text });
      sessionStorage.setItem("nyx_chat_history", JSON.stringify(messages));
    } catch (e) { /* silent */ }
  }

  // Clear chat memory and reset display to initial welcome
  function clearChatSession(messageOverride) {
    sessionStorage.removeItem("nyx_chat_history");
    chatHistory = [];
    chatBody.innerHTML = `
      <div class="nyx-message system">
        <div class="nyx-text">${messageOverride || "Nyx Core online. Ready to analyze your Movie DNA, explore recommendations, or navigate the dashboard."}</div>
      </div>
    `;
  }

  // Session Inactivity Cooldown Monitor
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      clearChatSession("Session expired. Nyx Core has went offline to preserve server resources.");
    }, INACTIVITY_TIMEOUT);
  }

  // Register interactive triggers to reset inactivity timers
  ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });

  // Intercept logout events to wipe chat history instantly
  document.addEventListener("click", (e) => {
    const logoutBtn = e.target.closest("#logoutBtn") || 
                      e.target.closest(".logout-btn") || 
                      e.target.closest("[onclick*='logout']");
    if (logoutBtn) {
      clearChatSession();
    }
  });

  // Intercept window.logout function wrapper if exposed
  const originalLogout = window.logout;
  if (typeof originalLogout === "function") {
    window.logout = async function(...args) {
      clearChatSession();
      return originalLogout.apply(this, args);
    };
  }

  // Toggle Chat window view
  orb.addEventListener("click", () => {
    chatWindow.classList.toggle("hidden");
    if (!chatWindow.classList.contains("hidden")) {
      input.focus();
    }
  });

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    chatWindow.classList.add("hidden");
  });

  // Simple validation for gibberish and profanity to protect API key usage
  function isValidQuery(text) {
    const normalized = text.toLowerCase().trim();
    if (normalized.length < 2) {
      return { valid: false, reason: "The inquiry is too brief." };
    }

    // 1. Profanity filter
    const badWords = ["fuck", "shit", "bitch", "cunt", "asshole", "bastard", "dick"];
    const hasProfanity = badWords.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      return regex.test(normalized);
    });
    if (hasProfanity) {
      return { valid: false, reason: "The archive maintains strict decorum. Please query with meaningful terms." };
    }

    // 2. Gibberish check (e.g. "ajhsfkafkjasf")
    const words = normalized.split(/\s+/);
    for (let word of words) {
      if (word.length > 7) {
        const hasVowels = /[aeiouy]/.test(word);
        if (!hasVowels) {
          return { valid: false, reason: "Incomprehensible pattern. Please query with meaningful terms." };
        }
        // If has more than 5 consecutive consonants
        if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(word)) {
          return { valid: false, reason: "Incomprehensible pattern. Please query with meaningful terms." };
        }
      }
    }
    return { valid: true };
  }

  // Handle message sending
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isProcessing) return;

    // Validate Input Quality (Spam / Gibberish / Profanity filter)
    const check = isValidQuery(text);
    if (!check.valid) {
      input.value = "";
      appendMessage(text, "user", false);
      appendMessage(check.reason, "system", false);
      return;
    }

    input.value = "";
    isProcessing = true;
    sendBtn.disabled = true;
    orb.classList.add("processing");

    // Render User message
    appendMessage(text, "user", true);

    // Render Typing indicator
    const typingIndicator = appendTypingIndicator();

    try {
      const pageContext = window.location.pathname.split("/").pop() || "index.html";

      const res = await fetch(`${API_BASE}/nyx/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: text,
          pageContext,
          history: chatHistory.slice(-5) // Maintain last 5 turns
        }),
        credentials: "include"
      });

      typingIndicator.remove();

      if (!res.ok) {
        throw new Error(`API returned HTTP error ${res.status}`);
      }

      const responseData = await res.json();
      
      // Store history memory
      chatHistory.push({ query: text, response: responseData.message });

      // Render Nyx Response
      appendMessage(responseData.message, "system", true);

      // Dispatch actions if present
      if (responseData.actions && responseData.actions.length > 0) {
        handleActions(responseData.actions, responseData);
      }

    } catch (err) {
      typingIndicator.remove();
      appendMessage("Nyx Core experienced a connection deviation while reaching the AI reasoning engine. Your local dashboard and cached navigation remains fully operational.", "system", false);
    } finally {
      isProcessing = false;
      sendBtn.disabled = false;
      orb.classList.remove("processing");
      input.focus();
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  function safeSanitize(str) {
    if (!str) return '';
    const escaped = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return escaped
      .replace(/&lt;strong&gt;/g, '<strong>')
      .replace(/&lt;\/strong&gt;/g, '</strong>')
      .replace(/&lt;em&gt;/g, '<em>')
      .replace(/&lt;\/em&gt;/g, '</em>')
      .replace(/&lt;br\s*\/?&gt;/g, '<br>')
      .replace(/&lt;p&gt;/g, '<p>')
      .replace(/&lt;\/p&gt;/g, '</p>');
  }

  // Helper: Append Message Bubble to chat drawer
  function appendMessage(content, sender, saveToStorage = true) {
    const msgEl = document.createElement("div");
    msgEl.classList.add("nyx-message", sender);

    const textEl = document.createElement("div");
    textEl.classList.add("nyx-text");
    textEl.innerHTML = safeSanitize(content);

    msgEl.appendChild(textEl);
    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;

    if (saveToStorage) {
      saveMessageToStorage(content, sender);
    }
  }

  // Helper: Typing Bubble
  function appendTypingIndicator() {
    const indicatorEl = document.createElement("div");
    indicatorEl.classList.add("nyx-message", "system");

    const typingEl = document.createElement("div");
    typingEl.classList.add("nyx-text", "nyx-typing-indicator");
    typingEl.innerHTML = `
      <div class="nyx-dot"></div>
      <div class="nyx-dot"></div>
      <div class="nyx-dot"></div>
    `;

    indicatorEl.appendChild(typingEl);
    chatBody.appendChild(indicatorEl);
    chatBody.scrollTop = chatBody.scrollHeight;
    return indicatorEl;
  }

  // Helper: Highlight elements on page with a pulsing neon class
  function highlightElement(selector) {
    const el = document.querySelector(selector);
    if (el) {
      const card = el.closest(".glass-card") || el.closest(".stat-widget") || el.closest(".dashboard-section") || el;
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("highlight-glow");
      setTimeout(() => {
        card.classList.remove("highlight-glow");
      }, 4000);
    }
  }

  // Helper: Execute JSON commands returned by the backend OS layer
  function handleActions(actions, data) {
    actions.forEach(action => {
      if (action === "openMovie" && data.movieId) {
        if (typeof window.openModal === "function") {
          window.openModal({ id: data.movieId });
        }
      }
      else if (action === "openWatchlist") {
        if (!window.location.pathname.includes("watchlist.html")) {
          window.location.href = "watchlist.html";
        }
      }
      else if (action === "openProfile" || action === "openDashboard") {
        if (!window.location.pathname.includes("dashboard.html")) {
          window.location.href = "dashboard.html";
        }
      }
      else if (action === "openHome") {
        if (!window.location.pathname.includes("index.html")) {
          window.location.href = "index.html";
        }
      }
      else if (action === "openSettings") {
        if (!window.location.pathname.includes("dashboard.html")) {
          window.location.href = "dashboard.html";
        }
      }
      else if (action === "scrollRecommendation") {
        const recRow = document.getElementById("watchlistRecRow") || 
                       document.getElementById("scifiRow") || 
                       document.getElementById("groupRecsRow");
        if (recRow) {
          recRow.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      else if (action === "showPersona") {
        if (!window.location.pathname.includes("dashboard.html")) {
          sessionStorage.setItem("nyx_pending_highlight", "showPersona");
          window.location.href = "dashboard.html";
        } else {
          highlightElement("#personality");
        }
      }
      else if (action === "showMovieDNA") {
        if (!window.location.pathname.includes("dashboard.html")) {
          sessionStorage.setItem("nyx_pending_highlight", "showMovieDNA");
          window.location.href = "dashboard.html";
        } else {
          highlightElement("#dnaContainer");
        }
      }
      else if (action === "showAnalytics") {
        if (!window.location.pathname.includes("dashboard.html")) {
          sessionStorage.setItem("nyx_pending_highlight", "showAnalytics");
          window.location.href = "dashboard.html";
        } else {
          highlightElement("#providerChart");
        }
      }
      else if (action === "highlightAchievements") {
        if (!window.location.pathname.includes("dashboard.html")) {
          sessionStorage.setItem("nyx_pending_highlight", "highlightAchievements");
          window.location.href = "dashboard.html";
        } else {
          highlightElement("#achievementsContainer");
        }
      }
      else if (action === "searchMovie" && data.query) {
        if (!window.location.pathname.includes("index.html")) {
          sessionStorage.setItem("nyx_pending_search", data.query);
          window.location.href = "index.html";
        } else {
          const searchInput = document.getElementById("searchInput");
          if (searchInput) {
            searchInput.value = data.query;
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
      }
      else if (action === "playTrailer" && data.movieId) {
        if (typeof window.openModal === "function") {
          window.openModal({ id: data.movieId });
          setTimeout(() => {
            const trailerBtn = document.getElementById("playTrailerBtn") || 
                               document.querySelector(".trailer-btn") || 
                               document.querySelector(".play-trailer-btn");
            if (trailerBtn) trailerBtn.click();
          }, 600);
        }
      }
      else if (action === "compareMovies" && data.movieIds) {
        if (typeof window.openComparisonModal === "function") {
          window.openComparisonModal(data.movieIds);
        } else if (typeof window.openModal === "function" && data.movieIds[0]) {
          window.openModal({ id: data.movieIds[0] });
        }
      }
      else if (action === "highlightSection" && data.sectionId) {
        if (!window.location.pathname.includes("dashboard.html")) {
          const mapping = data.sectionId === "dna" ? "showMovieDNA" : 
                          data.sectionId === "persona" ? "showPersona" : 
                          data.sectionId === "analytics" ? "showAnalytics" : "highlightAchievements";
          sessionStorage.setItem("nyx_pending_highlight", mapping);
          window.location.href = "dashboard.html";
        } else {
          const selector = data.sectionId === "dna" ? "#dnaContainer" : 
                            data.sectionId === "persona" ? "#personality" : 
                            data.sectionId === "analytics" ? "#providerChart" : "#achievementsContainer";
          highlightElement(selector);
        }
      }
      else if (action === "scrollToMovie" && data.movieId) {
        highlightElement(`[data-id="${data.movieId}"]` || `.movie-card[data-id="${data.movieId}"]`);
      }
    });
  }

  // Close chat window when clicking anywhere outside the chat window and the floating orb
  document.addEventListener("click", (e) => {
    if (!chatWindow.classList.contains("hidden")) {
      if (!chatWindow.contains(e.target) && !container.contains(e.target)) {
        chatWindow.classList.add("hidden");
      }
    }
  });

  // Run startup initializations
  loadChatHistory();
  resetInactivityTimer();

  // Execute cross-page pending action highlights once dashboard loads
  const pendingHighlight = sessionStorage.getItem("nyx_pending_highlight");
  if (pendingHighlight && window.location.pathname.includes("dashboard.html")) {
    sessionStorage.removeItem("nyx_pending_highlight");
    setTimeout(() => {
      if (pendingHighlight === "showPersona") highlightElement("#personality");
      else if (pendingHighlight === "showMovieDNA") highlightElement("#dnaContainer");
      else if (pendingHighlight === "showAnalytics") highlightElement("#providerChart");
      else if (pendingHighlight === "highlightAchievements") highlightElement("#achievementsContainer");
    }, 1000);
  }

  // Execute cross-page pending search once home page loads
  const pendingSearch = sessionStorage.getItem("nyx_pending_search");
  if (pendingSearch && window.location.pathname.includes("index.html")) {
    sessionStorage.removeItem("nyx_pending_search");
    setTimeout(() => {
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        searchInput.value = pendingSearch;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, 1000);
  }
});
