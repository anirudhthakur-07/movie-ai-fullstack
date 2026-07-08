/**
 * Presenter class to map standard Nyx AI response structures to Slack Block Kit layouts.
 * Separates UI rendering and presentation logic from core AI and adapter services.
 */
class BlockKitBuilder {
  /**
   * Translates unified Nyx JSON results to Slack Block Kit payload structures.
   * @param {Object} response - The structured response from executeNyxQuery.
   * @param {string} userQuery - The original user text.
   * @returns {Object} Slack block schema.
   */
  static buildResponse(response, userQuery) {
    const text = response.message || "Query processed.";
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "⚡ NYX CORE RESPONSE",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Inquiry:* _"${userQuery}"_\n\n${text}`
        }
      }
    ];

    // Enrich layout depending on the AI target type
    if (response.type === "movieDNA" || response.type === "persona") {
      const details = [];
      if (response.persona) {
        details.push(`*Archetype Persona:* ${response.persona}`);
      }
      if (response.dna && response.dna.length > 0) {
        details.push(`*Taste DNA Markers:* ${response.dna.join(", ")}`);
      }
      if (details.length > 0) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: details.join("\n")
          }
        });
      }
    }

    // Append action elements/buttons
    const actions = response.actions || [];
    const elements = [];

    actions.forEach(action => {
      if (action === "openWatchlist" || response.type === "watchlist") {
        elements.push({
          type: "button",
          text: { type: "plain_text", text: "🎬 View Watchlist" },
          url: "https://movie-ai-fullstack.vercel.app/watchlist.html",
          style: "primary"
        });
      } else if (action === "openDashboard" || response.type === "analytics") {
        elements.push({
          type: "button",
          text: { type: "plain_text", text: "📊 Open Dashboard" },
          url: "https://movie-ai-fullstack.vercel.app/dashboard.html",
          style: "primary"
        });
      } else if ((action === "openMovie" || response.movieId) && response.movieId) {
        elements.push({
          type: "button",
          text: { type: "plain_text", text: "🍿 View Movie Info" },
          url: `https://movie-ai-fullstack.vercel.app/index.html?openMovie=${response.movieId}`,
          style: "primary"
        });
      }
    });

    if (elements.length > 0) {
      blocks.push({
        type: "actions",
        elements
      });
    }

    // Add standard platform footer context
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "DARK AI Platform • Multi-channel Orchestrator"
        }
      ]
    });

    return { blocks };
  }
}

module.exports = BlockKitBuilder;
