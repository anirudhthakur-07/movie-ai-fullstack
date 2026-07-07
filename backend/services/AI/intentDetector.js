// Intent Confidence Engine: classifies user input, evaluates confidence levels,
// and routes queries locally or via Gemini based on confidence thresholds.
function detectLocalIntent(query) {
  if (!query) return { intent: "unknown", confidence: 0.0, requiresGemini: false };
  const normalized = query.toLowerCase().trim();

  // 1. Simple Greetings Pattern matching
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
      intent: "platform_info",
      confidence: 0.98,
      requiresGemini: false,
      handledLocally: true,
      message: "Dark is a premium, AI-orchestrated cinematic dashboard. I am Nyx, your built-in curator. Here, you can trace your Movie DNA, analyze clicks across streaming providers, unlock milestone achievements, and discover hyper-personalized recommendations tailored to your taste profile.",
      actions: []
    };
  }

  // 3. Navigation keywords
  const hasAction = normalized.includes("go to") || normalized.includes("open") || normalized.includes("show") || normalized.includes("navigate") || normalized.includes("view");
  
  // Watchlist Count Inquiry
  if (
    normalized.includes("how many movies") || 
    normalized.includes("watchlist size") || 
    normalized.includes("watchlist count") ||
    normalized.includes("number of movies")
  ) {
    return {
      intent: "watchlist_count",
      confidence: 0.97,
      requiresGemini: false,
      handledLocally: true
    };
  }

  // Direct Settings Nav
  if (normalized.includes("settings") || normalized.includes("preferences")) {
    return {
      intent: "settings",
      confidence: 0.98,
      requiresGemini: false,
      handledLocally: true,
      message: "Opening configurations.",
      actions: ["openSettings"]
    };
  }

  // Direct Home Nav
  if (normalized.includes("go home") || normalized.includes("main page") || normalized.includes("index page") || normalized === "home") {
    return {
      intent: "navigation",
      confidence: 0.99,
      requiresGemini: false,
      handledLocally: true,
      message: "Returning to the dark cinema gate.",
      actions: ["openHome"]
    };
  }

  // Direct Watchlist Nav
  if (normalized.includes("watchlist") || normalized.includes("my list") || normalized.includes("saved list")) {
    return {
      intent: "navigation",
      confidence: 0.99,
      requiresGemini: false,
      handledLocally: true,
      message: "Opening your saved collection folder.",
      actions: ["openWatchlist"]
    };
  }

  // Direct Dashboard Nav
  if (normalized.includes("dashboard") || normalized.includes("profile") || (hasAction && normalized.includes("stats"))) {
    return {
      intent: "navigation",
      confidence: 0.99,
      requiresGemini: false,
      handledLocally: true,
      message: "Directing you to the main control center.",
      actions: ["openDashboard"]
    };
  }

  // Direct Achievements Nav
  if (normalized.includes("achievements") || normalized.includes("milestones") || normalized.includes("badges") || normalized.includes("trophies")) {
    return {
      intent: "navigation",
      confidence: 0.98,
      requiresGemini: false,
      handledLocally: true,
      message: "Revealing your unlocked milestones.",
      actions: ["openDashboard", "highlightAchievements"]
    };
  }

  // Direct DNA Nav
  if (normalized.includes("movie dna") || normalized.includes("my dna") || (hasAction && (normalized.includes("genres") || normalized.includes("themes")))) {
    return {
      intent: "navigation",
      confidence: 0.96,
      requiresGemini: false,
      handledLocally: true,
      message: "Locating your movie DNA indicators.",
      actions: ["openDashboard", "showMovieDNA"]
    };
  }

  // Direct Provider clicks Nav
  if (normalized.includes("taste analytics") || normalized.includes("provider clicks") || normalized.includes("click stats")) {
    return {
      intent: "navigation",
      confidence: 0.96,
      requiresGemini: false,
      handledLocally: true,
      message: "Opening provider analytics insights.",
      actions: ["openDashboard", "showAnalytics"]
    };
  }

  // 4. Complex Explanations requiring Gemini AI (Intent Confidence 70% - 95%)
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

  // 5. Default Fallback / Unrecognized commands (Confidence < 70%)
  return {
    intent: "general",
    confidence: 0.50,
    requiresGemini: true,
    handledLocally: false
  };
}

module.exports = { detectLocalIntent };
