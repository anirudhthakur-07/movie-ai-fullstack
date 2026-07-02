const { GoogleGenerativeAI } = require("@google/generative-ai");

// Standardized gateway controller to run LLM queries with retry mechanism and timeout thresholds
async function callLLM(prompt, retries = 1, timeoutMs = 8000) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key missing in environment variables");
  }

  const ai = new GoogleGenerativeAI(apiKey);
  // Using stable gemini-3.1-flash-lite model to leverage higher RPD limits (500 RPD vs 20 RPD)
  const model = ai.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

  let attempt = 0;
  while (attempt <= retries) {
    try {
      const apiCall = model.generateContent(prompt);
      
      // Enforce timeout via Promise.race
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
      );

      const result = await Promise.race([apiCall, timeoutPromise]);
      if (!result || !result.response) {
        throw new Error("Empty response received from Gemini API");
      }

      const text = result.response.text();
      if (!text) {
        throw new Error("Blank response text received from Gemini API");
      }
      return text.trim();
    } catch (err) {
      attempt++;
      console.warn(`[NYX GATEWAY] Call attempt ${attempt} failed:`, err.message);
      if (attempt > retries) {
        throw err; // Exceeded retries, propagate error upstream
      }
      // Brief delay before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

module.exports = { callLLM };
