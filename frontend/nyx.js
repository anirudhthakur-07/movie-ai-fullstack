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

  // Handle message sending
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isProcessing) return;

    input.value = "";
    isProcessing = true;
    sendBtn.disabled = true;
    orb.classList.add("processing");

    // Render User message
    appendMessage(text, "user");

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
      appendMessage(responseData.message, "system");

      // Dispatch actions if present
      if (responseData.actions && responseData.actions.length > 0) {
        handleActions(responseData.actions, responseData);
      }

    } catch (err) {
      console.error("[NYX ERROR]", err);
      typingIndicator.remove();
      appendMessage("The archive is calibrating. A temporary network deviation prevents deep reasoning.", "system");
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
  function appendMessage(content, sender) {
    const msgEl = document.createElement("div");
    msgEl.classList.add("nyx-message", sender);

    const textEl = document.createElement("div");
    textEl.classList.add("nyx-text");
    textEl.innerHTML = content;

    msgEl.appendChild(textEl);
    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;
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
});
