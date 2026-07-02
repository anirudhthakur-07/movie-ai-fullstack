// Clean markdown wraps and sanitize text to ensure reliable JSON parsing of Gemini output
function cleanAndParseJSON(text) {
  if (!text) return null;
  let cleanText = text.trim();

  // Strip JSON codeblock envelopes
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  cleanText = cleanText.trim();

  try {
    return JSON.parse(cleanText);
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON:", err.message, "\nRaw response was:", text);
    
    // Try regex recovery for JSON array/object structure if standard parse fails
    try {
      const match = cleanText.match(/[\{\[].*[\}\]]/s);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (nestedErr) {
      console.error("Regex JSON recovery failed:", nestedErr.message);
    }
    return null;
  }
}

module.exports = { cleanAndParseJSON };
