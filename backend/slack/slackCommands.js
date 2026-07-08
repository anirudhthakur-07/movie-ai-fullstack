const { getMappedUser, queryNyxCore, formatToBlockKit, postToSlack } = require("./slackHelpers");

// Handle incoming Slack slash commands (e.g. /nyx)
async function handleCommand(body) {
  const query = body.text ? body.text.trim() : "";
  const responseUrl = body.response_url;

  if (!query) {
    if (responseUrl) {
      await postToSlack(responseUrl, {
        text: "Please provide a query for Nyx. Example: `/nyx Recommend action movies`"
      });
    }
    return;
  }

  console.log(`[SLACK COMMANDS] Slash command received: "${query}" from user ${body.user_id}`);

  // Resolve mapped profile
  const user = await getMappedUser(body.user_id);
  if (!user) {
    if (responseUrl) {
      await postToSlack(responseUrl, {
        text: "Unable to locate a mapped Dark AI Profile for your Slack member ID."
      });
    }
    return;
  }

  // Execute unified pipeline
  const clientState = { currentPage: "slack_command" };
  const nyxResponse = await queryNyxCore(query, user._id, clientState);

  // Format response for channel distribution
  const slackPayload = formatToBlockKit(nyxResponse, query);

  // Post response directly back to Slack command hook
  if (responseUrl) {
    await postToSlack(responseUrl, slackPayload);
  }
}

module.exports = { handleCommand };
