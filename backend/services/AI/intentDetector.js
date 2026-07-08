// Intent Confidence Engine: classifies user input, evaluates confidence levels,
// and routes queries locally or via Gemini based on confidence thresholds.
function detectLocalIntent(query) {
  if (!query) return { intent: "unknown", confidence: 0.0, requiresGemini: false };
  const normalized = query.toLowerCase().trim();

  // 1. Simple Greetings
  const greetingWords = ["hi", "hello", "hey", "yo", "sup", "greetings", "good morning", "good afternoon", "good evening"];
  const isSimpleGreeting = greetingWords.some(word => normalized === word || normalized.startsWith(word + " ") || normalized.endsWith(" " + word));
  if (isSimpleGreeting) {
    return {
      intent: "greeting",
      confidence: 1.0,
      requiresGemini: false,
      handledLocally: true,
      message: "Nyx Core online. Ready to analyze your Movie DNA, explore recommendations, or navigate the dashboard."
    };
  }

  // 2. Search Shortcut Parser
  if (normalized.startsWith("search ")) {
    const searchVal = query.substring(7).trim();
    return {
      intent: "search",
      confidence: 1.0,
      requiresGemini: false,
      handledLocally: true,
      message: `Searching for "${searchVal}"...`,
      actions: ["searchMovie"],
      parameters: { query: searchVal }
    };
  }
  if (normalized.startsWith("find movie ") || normalized.startsWith("lookup ")) {
    const searchVal = query.split(" ").slice(2).join(" ").trim();
    return {
      intent: "search",
      confidence: 0.95,
      requiresGemini: false,
      handledLocally: true,
      message: `Searching for "${searchVal}"...`,
      actions: ["searchMovie"],
      parameters: { query: searchVal }
    };
  }

  // 3. Genre Category Shortcut Parser
  const genresList = ["action", "adventure", "animation", "comedy", "crime", "documentary", "drama", "family", "fantasy", "history", "horror", "music", "mystery", "romance", "sci-fi", "science fiction", "thriller", "war", "western"];
  for (const g of genresList) {
    if (normalized.includes(`take me to ${g}`) || normalized.includes(`show ${g}`) || normalized.includes(`go to ${g}`) || normalized.includes(`filter by ${g}`)) {
      return {
        intent: "genreFilter",
        confidence: 0.98,
        requiresGemini: false,
        handledLocally: true,
        message: `Navigating to ${g.toUpperCase()} category section.`,
        actions: ["filterGenre"],
        parameters: { genre: g }
      };
    }
  }

  // 4. Navigation/Action Shortcuts
  const hasAction = normalized.includes("go to") || normalized.includes("open") || normalized.includes("show") || normalized.includes("navigate") || normalized.includes("view") || normalized.includes("locate");

  // Dashboard / Profile nav
  if (
    normalized.includes("open dashboard") || 
    normalized.includes("open profile") || 
    normalized.includes("go to dashboard") || 
    normalized.includes("view dashboard") ||
    normalized.includes("tell me my statistics") ||
    normalized.includes("show stats") ||
    normalized.includes("view stats")
  ) {
    return {
      intent: "navigation",
      confidence: 1.0,
      requiresGemini: false,
      handledLocally: true,
      message: "Opening user analytics profile dashboard dashboard page.",
      actions: ["openDashboard"]
    };
  }

  // Watchlist nav
  if (
    normalized.includes("open watchlist") || 
    normalized.includes("go to watchlist") || 
    normalized.includes("locate watchlist") || 
    normalized.includes("show saved movies") ||
    normalized.includes("watchlist") ||
    normalized.includes("my list") ||
    normalized.includes("saved list")
  ) {
    return {
      intent: "navigation",
      confidence: 1.0,
      requiresGemini: false,
      handledLocally: true,
      message: "Opening watchlist collections folder.",
      actions: ["openWatchlist"]
    };
  }

  // Home page nav
  if (
    normalized.includes("go home") || 
    normalized.includes("main page") || 
    normalized.includes("index page") || 
    normalized === "home"
  ) {
    return {
      intent: "navigation",
      confidence: 1.0,
      requiresGemini: false,
      handledLocally: true,
      message: "Navigating to home lobby feed.",
      actions: ["openHome"]
    };
  }

  // Movie DNA
  if (
    normalized.includes("show movie dna") || 
    normalized.includes("locate movie dna") || 
    normalized.includes("dna indicators") || 
    normalized.includes("movie dna")
  ) {
    return {
      intent: "navigation",
      confidence: 0.98,
      requiresGemini: false,
      handledLocally: true,
      message: "Highlighting your Movie DNA distribution charts.",
      actions: ["openDashboard", "showMovieDNA"]
    };
  }

  // Analytics
  if (
    normalized.includes("open analytics") || 
    normalized.includes("show click stats") || 
    normalized.includes("view analytics") || 
    normalized.includes("taste analytics")
  ) {
    return {
      intent: "navigation",
      confidence: 0.98,
      requiresGemini: false,
      handledLocally: true,
      message: "Directing you to your provider click analytics metrics chart.",
      actions: ["openDashboard", "showAnalytics"]
    };
  }

  // Scroll to Trending
  if (normalized.includes("scroll to trending") || normalized.includes("show trending")) {
    return {
      intent: "navigation",
      confidence: 0.98,
      requiresGemini: false,
      handledLocally: true,
      message: "Scrolling view to Trending Now list.",
      actions: ["scrollToSection"],
      parameters: { target: "trending" }
    };
  }

  // Refresh Recommendations
  if (normalized.includes("refresh recommendations") || normalized.includes("reload recommendations")) {
    return {
      intent: "action",
      confidence: 0.98,
      requiresGemini: false,
      handledLocally: true,
      message: "Reloading custom recommendations grid.",
      actions: ["refreshRecommendations"]
    };
  }

  // Find Search Bar
  if (normalized.includes("find search bar") || normalized.includes("where is search") || normalized.includes("focus search")) {
    return {
      intent: "action",
      confidence: 0.98,
      requiresGemini: false,
      handledLocally: true,
      message: "Focusing input highlight on primary search bar.",
      actions: ["focusSearch"]
    };
  }

  // Open Trailer
  if (normalized.includes("open trailer") || normalized.includes("play trailer")) {
    return {
      intent: "action",
      confidence: 0.95,
      requiresGemini: false,
      handledLocally: true,
      message: "Please select a movie card or click 'Watch Trailer' to launch the media viewer player.",
      actions: ["playTrailerPrompt"]
    };
  }

  // 5. Help / Platform Info
  if (
    normalized === "help" || 
    normalized.includes("who are you") || 
    normalized.includes("what is this platform") || 
    normalized.includes("what is dark")
  ) {
    return {
      intent: "platform_info",
      confidence: 0.98,
      requiresGemini: false,
      handledLocally: true,
      message: "Dark is a premium, AI-orchestrated cinematic dashboard. I am Nyx, your built-in curator. Here, you can trace your Movie DNA, analyze clicks across streaming providers, unlock milestone achievements, and discover hyper-personalized recommendations tailored to your taste profile."
    };
  }

  // 6. Complex Explanations requiring Gemini AI (Intent Confidence 70% - 95%)
  if (normalized.includes("explain") || normalized.includes("why") || normalized.includes("compare") || normalized.includes("taste") || normalized.includes("recommend") || normalized.includes("suggest")) {
    let subIntent = "general";
    if (normalized.includes("dna") || normalized.includes("theme")) subIntent = "movieDNA";
    else if (normalized.includes("persona") || normalized.includes("profile")) subIntent = "persona";
    else if (normalized.includes("recommend") || normalized.includes("suggest")) subIntent = "recommendation";
    else if (normalized.includes("analytics") || normalized.includes("clicks")) subIntent = "analytics";

    return {
      intent: subIntent,
      confidence: 0.85,
      requiresGemini: true,
      handledLocally: false
    };
  }

  // 7. Default Fallback
  return {
    intent: "general",
    confidence: 0.50,
    requiresGemini: true,
    handledLocally: false
  };
}

module.exports = { detectLocalIntent };
