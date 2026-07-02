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
    console.warn("[NYX] Interface elements missing in page DOM layout");
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
    } catch (err) {
      console.warn("[NYX] Failed to parse sessionStorage history", err);
    }
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
    } catch (err) {
      console.warn("[NYX] Failed to write message to sessionStorage", err);
    }
  }

  // Clear chat memory and reset display to initial welcome
  function clearChatSession(messageOverride) {
    sessionStorage.removeItem("nyx_chat_history");
    chatHistory = [];
    chatBody.innerHTML = `
      <div class="nyx-message system">
        <div class="nyx-text">${messageOverride || "The archive awaits. What patterns do we seek?"}</div>
      </div>
    `;
  }

  // Session Inactivity Cooldown Monitor
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      clearChatSession("Session expired. The archive has sealed itself due to inactivity.");
      console.log("[NYX] Chat history wiped due to user inactivity timeout");
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
      console.log("[NYX] Chat history wiped on user logout click");
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
      console.error("[NYX ERROR]", err);
      typingIndicator.remove();
      appendMessage("The archive is calibrating. A temporary network deviation prevents deep reasoning.", "system", false);
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

  // Helper: Append Message Bubble to chat drawer
  function appendMessage(content, sender, saveToStorage = true) {
    const msgEl = document.createElement("div");
    msgEl.classList.add("nyx-message", sender);

    const textEl = document.createElement("div");
    textEl.classList.add("nyx-text");
    textEl.innerHTML = content;

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

  // Helper: Execute JSON commands returned by the backend OS layer
  function handleActions(actions, data) {
    actions.forEach(action => {
      console.log(`[NYX ACTION] Executing: ${action}`, data);

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
      else if (action === "scrollRecommendation") {
        const recRow = document.getElementById("watchlistRecRow") || 
                       document.getElementById("scifiRow") || 
                       document.getElementById("groupRecsRow");
        if (recRow) {
          recRow.scrollIntoView({ behavior: "smooth", block: "center" });
        }
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
});
