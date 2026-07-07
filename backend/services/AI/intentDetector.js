// Detects simple navigation, watchlist count, or statistics queries to solve natively and conserve Gemini tokens
function detectLocalIntent(query) {
  if (!query) return null;
  const normalized = query.toLowerCase().trim();

  // 1. Simple Greetings Pattern matching
  const greetingWords = ["hi", "hello", "hey", "yo", "sup", "greetings", "good morning", "good afternoon", "good evening"];
  const isSimpleGreeting = greetingWords.some(word => normalized === word || normalized.startsWith(word + " ") || normalized.endsWith(" " + word));
  
  if (isSimpleGreeting) {
    return {
      type: "greeting",
      handledLocally: true,
      message: "The archive awaits. What patterns do we seek?"
    };
  }

  // 2. Help / Platform Information
  if (
    normalized === "help" || 
    normalized.includes("who are you") || 
    normalized.includes("what are you") || 
    normalized.includes("what is this platform") || 
    normalized.includes("what is dark") ||
    normalized.includes("what can this platform do") ||
    normalized.includes("explain this page") ||
    normalized.includes("how to use")
  ) {
    return {
      type: "platform_info",
      handledLocally: true,
      message: "Dark is a premium, AI-orchestrated cinematic dashboard. I am Nyx, your built-in curator. Here, you can trace your Movie DNA, analyze clicks across streaming providers, unlock milestone achievements, and discover hyper-personalized recommendations tailored to your taste profile.",
      actions: []
    };
  }

  // 3. Watchlist Count Inquiry
  if (
    normalized.includes("how many movies") || 
    normalized.includes("watchlist size") || 
    normalized.includes("watchlist count") ||
    normalized.includes("number of movies")
  ) {
    return {
      type: "watchlist_count",
      handledLocally: true
    };
  }

  // 4. Navigation Triggers
  const hasAction = normalized.includes("go to") || normalized.includes("open") || normalized.includes("show") || normalized.includes("navigate") || normalized.includes("view");
  
  // Dashboard & Profile
  if (normalized.includes("dashboard") || normalized.includes("profile") || (hasAction && normalized.includes("stats"))) {
    return {
      type: "navigation",
      target: "dashboard",
      handledLocally: true,
      message: "Directing you to the main control center.",
      actions: ["openDashboard"]
    };
  }

  // Watchlist
  if (normalized.includes("watchlist") || normalized.includes("my list") || normalized.includes("saved list")) {
    return {
      type: "navigation",
      target: "watchlist",
      handledLocally: true,
      message: "Opening your saved collection folder.",
      actions: ["openWatchlist"]
    };
  }

  // Home Page
  if (normalized.includes("go home") || normalized.includes("main page") || normalized.includes("index page") || normalized === "home") {
    return {
      type: "navigation",
      target: "home",
      handledLocally: true,
      message: "Returning to the dark cinema gate.",
      actions: ["openHome"]
    };
  }

  // Settings
  if (normalized.includes("settings") || normalized.includes("preferences")) {
    return {
      type: "navigation",
      target: "settings",
      handledLocally: true,
      message: "Opening configurations.",
      actions: ["openSettings"]
    };
  }

  // Achievements/Milestones
  if (normalized.includes("achievements") || normalized.includes("milestones") || normalized.includes("trophies") || normalized.includes("badges")) {
    return {
      type: "navigation",
      target: "dashboard",
      handledLocally: true,
      message: "Revealing your unlocked milestones.",
      actions: ["openDashboard", "highlightAchievements"]
    };
  }

  // Movie DNA & Taste Analytics
  if (normalized.includes("where is movie dna") || normalized.includes("show movie dna") || normalized.includes("open movie dna")) {
    return {
      type: "navigation",
      target: "dashboard",
      handledLocally: true,
      message: "Locating your movie DNA indicators.",
      actions: ["openDashboard", "showMovieDNA"]
    };
  }

  if (normalized.includes("where is taste analytics") || normalized.includes("show taste analytics") || normalized.includes("open taste analytics") || normalized.includes("show provider clicks")) {
    return {
      type: "navigation",
      target: "dashboard",
      handledLocally: true,
      message: "Opening provider analytics insights.",
      actions: ["openDashboard", "showAnalytics"]
    };
  }

  return null;
}

module.exports = { detectLocalIntent };
