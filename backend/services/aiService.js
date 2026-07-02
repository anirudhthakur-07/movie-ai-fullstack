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
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

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

module.exports = { generateProfileSummary };
