const ALLOWED_ACTIONS = [
  "openMovie",
  "highlightMovie",
  "scrollRecommendation",
  "openProfile",
  "openWatchlist"
];

// Validates structured JSON responses to filter allowed actions and enforce model schemas
function validateResponse(json) {
  if (!json || typeof json !== "object") {
    return {
      type: "warning",
      message: "The archive parsed an invalid data format.",
      actions: []
    };
  }

  // Enforce required structure properties
  const validated = {
    type: json.type || "summary",
    message: json.message || "A silent response from the shadows.",
    actions: Array.isArray(json.actions) ? json.actions : []
  };

  // Filter actions against whitelist to protect client execution
  validated.actions = validated.actions.filter(act => ALLOWED_ACTIONS.includes(act));

  // Add optional elements if present
  if (json.movieId) validated.movieId = Number(json.movieId);
  if (json.confidence) validated.confidence = Number(json.confidence);
  if (json.persona) validated.persona = String(json.persona);
  if (json.dna) validated.dna = Array.isArray(json.dna) ? json.dna : [];

  return validated;
}

module.exports = { validateResponse };
