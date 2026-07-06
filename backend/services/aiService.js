const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper to initialize and run Gemini content generation
async function generateProfileSummary(username, persona, watchlistCount, topGenres, totalClicks, activityLevel) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API key missing in environment");
      return null;
    }

    // Initialize the client
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const genresList = topGenres.map(g => g.genre).join(", ");
    
    const prompt = `
      You are an expert AI movie taste profiling assistant for "Dark" movie analytics dashboard.
      Analyze the user's movie taste profile and generate exactly 3 concise bullet points summarizing their profile.
      Keep each bullet point under 12-18 words, punchy, cool, and highly custom to their stats.
      Use standard HTML tags like <strong> to highlight key terms.
      
      User Profile:
      - Username: ${username}
      - Taste Persona: ${persona}
      - Watchlist size: ${watchlistCount} movies
      - Favorite Genres: ${genresList || "None recorded yet"}
      - Total Clicks/Interactions: ${totalClicks}
      - Activity Level: ${activityLevel}
      
      Return ONLY a JSON array of strings containing the 3 bullets. No markdown, no wrap. Example:
      ["Your affinity for <strong>${persona}</strong> narratives signals a love for complex plots.", "Your active clicks class you as an <strong>${activityLevel}</strong> on Netflix.", "With ${watchlistCount} saves, your taste data is highly tailored."]
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Sanitize response to extract JSON array
    if (text.startsWith("```json")) {
      text = text.substring(7);
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();
    
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini API generation failed:", err.message);
    return null;
  }
}

async function generateRecommendationExplanations(username, favoriteGenres, watchlistTitles, recommendedMovies) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const genresList = favoriteGenres.join(", ");
    const watchlistList = watchlistTitles.join(", ");
    
    const recsListText = recommendedMovies.map(m => `- ${m.title} (ID: ${m.id}): ${m.overview?.substring(0, 100)}...`).join("\n");

    const prompt = `
      You are an expert AI movie recommendation engine for a platform called "Dark".
      For the user "${username}" who likes genres [${genresList}] and has watched [${watchlistList}],
      generate a highly personalized, compelling, single-sentence explanation (under 12-15 words) for why they would love each of the following recommended movies.
      Write in the second person ("you"), be punchy, and highlight why it fits their taste.
      Do NOT use any HTML tags, markdown bolding (**), or strong wrappers. Write only in plain text.
      
      Recommended Movies:
      ${recsListText}
      
      Return ONLY a JSON object mapping the movie ID string to the generated explanation string. Example:
      {
        "603": "Matches your affinity for mind-bending cyberpunk realities.",
        "577922": "A complex temporal puzzle that aligns with your love for sci-fi."
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    if (text.startsWith("```json")) {
      text = text.substring(7);
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();
    
    const parsed = JSON.parse(text);
    // SECURITY & CLEANUP: Strip any HTML tags to ensure safe plain-text rendering in the UI
    for (const key in parsed) {
      if (typeof parsed[key] === "string") {
        parsed[key] = parsed[key].replace(/<[^>]*>/g, "");
      }
    }
    return parsed;
  } catch (err) {
    console.error("Gemini API recommendations explanation generation failed:", err.message);
    return null;
  }
}

module.exports = { generateProfileSummary, generateRecommendationExplanations };
