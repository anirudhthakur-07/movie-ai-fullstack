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

  // Dynamic Suggestion Chips Builder
  function renderSuggestionChips() {
    let chipsContainer = document.getElementById("chatSuggestionChips");
    if (!chipsContainer) {
      chipsContainer = document.createElement("div");
      chipsContainer.id = "chatSuggestionChips";
      chipsContainer.className = "nyx-suggestion-chips";
      
      const chips = [
        "Tell me my statistics",
        "Recommend Sci-Fi Movies",
        "Show Movie DNA",
        "Open Watchlist",
        "Search Batman"
      ];
      
      chips.forEach(text => {
        const btn = document.createElement("button");
        btn.className = "nyx-chip";
        btn.innerText = text;
        btn.onclick = () => {
          input.value = text;
          sendMessage();
        };
        chipsContainer.appendChild(btn);
      });
      
      const inputArea = document.querySelector(".nyx-chat-input-area");
      if (inputArea) {
        inputArea.parentNode.insertBefore(chipsContainer, inputArea);
      }
    }
  }

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
            appendMessage(msg.text, msg.sender, false);
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
      renderSuggestionChips();
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

    const badWords = ["fuck", "shit", "bitch", "cunt", "asshole", "bastard", "dick"];
    const hasProfanity = badWords.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      return regex.test(normalized);
    });
    if (hasProfanity) {
      return { valid: false, reason: "The archive maintains strict decorum. Please query with meaningful terms." };
    }

    const words = normalized.split(/\s+/);
    for (let word of words) {
      if (word.length > 7) {
        const hasVowels = /[aeiouy]/.test(word);
        if (!hasVowels) {
          return { valid: false, reason: "Incomprehensible pattern. Please query with meaningful terms." };
        }
        if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(word)) {
          return { valid: false, reason: "Incomprehensible pattern. Please query with meaningful terms." };
        }
      }
    }
    return { valid: true };
  }

  // Handle message sending with SSE markdown streaming reader fallback
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

    // Render typing placeholder
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
          stream: true, // Toggle Server-Side SSE stream
          clientState: {
            currentPage: pageContext,
            currentMovie: window.currentOpenMovieId ? { id: window.currentOpenMovieId } : null,
            activeFilters: {}
          },
          history: chatHistory.slice(-5) // Maintain last 5 turns
        }),
        credentials: "include"
      });

      typingIndicator.remove();

      if (!res.ok) {
        throw new Error(`API returned HTTP error ${res.status}`);
      }

      // Read chunk-by-chunk using readable stream reader
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let finished = false;

      // Append system message placeholder that we will update progressively
      const msgEl = document.createElement("div");
      msgEl.classList.add("nyx-message", "system");
      const textEl = document.createElement("div");
      textEl.classList.add("nyx-text");
      msgEl.appendChild(textEl);
      chatBody.appendChild(msgEl);

      let fullResponseText = "";

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) {
          finished = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6).trim();
            if (dataStr === "[DONE]") {
              finished = true;
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.chunk) {
                fullResponseText += data.chunk;
                textEl.innerHTML = safeSanitize(fullResponseText);
                chatBody.scrollTop = chatBody.scrollHeight;
              } else if (data.error) {
                textEl.innerHTML = safeSanitize(data.error);
              }
            } catch (e) {
              // Ignore boundary split JSON fragments
            }
          }
        }
      }

      // Check if response contains tool/function calls payload
      if (fullResponseText.startsWith('{"toolCalls":')) {
        msgEl.remove();
        const parsed = JSON.parse(fullResponseText);
        const call = parsed.toolCalls[0];

        const mockData = {
          actions: []
        };

        if (call.name === "navigate") {
          const target = call.args.target;
          mockData.type = "navigation";
          if (target === "dashboard") {
            mockData.message = "Opening your main control center.";
            mockData.actions = ["openDashboard"];
          } else if (target === "watchlist") {
            mockData.message = "Opening your saved watchlist shelf.";
            mockData.actions = ["openWatchlist"];
          } else if (target === "home") {
            mockData.message = "Returning to home lobby feed.";
            mockData.actions = ["openHome"];
          } else if (target === "settings") {
            mockData.message = "Opening configurations.";
            mockData.actions = ["openSettings"];
          }
        } else if (call.name === "openMovie") {
          mockData.type = "recommendation";
          mockData.message = "Displaying cinematic insights.";
          mockData.actions = ["openMovie"];
          mockData.movieId = Number(call.args.movieId);
        } else if (call.name === "searchMovie") {
          mockData.type = "recommendation";
          mockData.message = `Executing movie search query: "${call.args.query}".`;
          mockData.actions = ["searchMovie"];
          mockData.query = call.args.query;
        } else if (call.name === "showPersona") {
          mockData.type = "persona";
          mockData.message = "Focusing on your active taste persona archetype.";
          mockData.actions = ["showPersona"];
        } else if (call.name === "showMovieDNA") {
          mockData.type = "movieDNA";
          mockData.message = "Locating your movie DNA indicators.";
          mockData.actions = ["showMovieDNA"];
        } else if (call.name === "showAnalytics") {
          mockData.type = "analytics";
          mockData.message = "Opening provider click analytics insights.";
          mockData.actions = ["showAnalytics"];
        } else if (call.name === "showWatchlist") {
          mockData.type = "navigation";
          mockData.message = "Opening your saved watchlist shelf.";
          mockData.actions = ["openWatchlist"];
        } else if (call.name === "showDashboard") {
          mockData.type = "navigation";
          mockData.message = "Opening your main control center.";
          mockData.actions = ["openDashboard"];
        } else if (call.name === "showAchievements") {
          mockData.type = "navigation";
          mockData.message = "Revealing your unlocked milestones.";
          mockData.actions = ["openDashboard", "highlightAchievements"];
        } else if (call.name === "showCollectionInsights") {
          mockData.type = "navigation";
          mockData.message = "Showing collection summary logs.";
          mockData.actions = ["openDashboard", "showCollectionInsights"];
        } else if (call.name === "showRecommendation") {
          mockData.type = "recommendation";
          mockData.message = "Scrolling to recommendations grid.";
          mockData.actions = ["scrollRecommendation"];
        } else if (call.name === "showStreamingProviders") {
          mockData.type = "navigation";
          mockData.message = "Displaying provider click analytics chart.";
          mockData.actions = ["openDashboard", "showAnalytics"];
        } else if (call.name === "compareMovies") {
          mockData.type = "recommendation";
          mockData.message = "Comparing select titles side-by-side.";
          mockData.actions = ["compareMovies"];
          mockData.movieIds = call.args.movieIds;
        } else if (call.name === "playTrailer") {
          mockData.type = "recommendation";
          mockData.message = "Initializing video player for movie trailer.";
          mockData.actions = ["playTrailer"];
          mockData.movieId = Number(call.args.movieId);
        } else if (call.name === "highlightSection") {
          mockData.type = "navigation";
          mockData.message = `Focusing on target section: ${call.args.sectionId}.`;
          mockData.actions = ["highlightSection"];
          mockData.sectionId = call.args.sectionId;
        } else if (call.name === "scrollToMovie") {
          mockData.type = "recommendation";
          mockData.message = "Focusing on selected movie card.";
          mockData.actions = ["scrollToMovie"];
          mockData.movieId = Number(call.args.movieId);
        } else if (call.name === "showRecentSearches") {
          mockData.type = "summary";
          mockData.message = "Displaying recent search logs.";
          mockData.actions = ["showRecentSearches"];
        } else if (call.name === "summarizeWatchlist") {
          mockData.type = "watchlist";
          mockData.message = "Aggregating your saved watchlist statistics.";
          mockData.actions = ["summarizeWatchlist"];
        }

        // Re-append clean message block for final command
        appendMessage(mockData.message, "system", true);
        chatHistory.push({ query: text, response: mockData.message });

        if (mockData.actions && mockData.actions.length > 0) {
          handleActions(mockData.actions, mockData);
        }
      } else {
        chatHistory.push({ query: text, response: fullResponseText });
        saveMessageToStorage(fullResponseText, "system");
      }

    } catch (err) {
      if (typingIndicator) typingIndicator.remove();
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

  // Close chat window when clicking anywhere outside
  document.addEventListener("click", (e) => {
    if (!chatWindow.classList.contains("hidden")) {
      if (!chatWindow.contains(e.target) && !container.contains(e.target)) {
        chatWindow.classList.add("hidden");
      }
    }
  });

  loadChatHistory();
  resetInactivityTimer();

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
