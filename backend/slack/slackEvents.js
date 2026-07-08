const { getMappedUser, queryNyxCore, formatToBlockKit, postToSlack } = require("./slackHelpers");

// Handle incoming Slack workspace event types
async function handleEvent(event) {
  // Only process app_mentions and avoid infinite bot loop responses
  if (event.type !== "app_mention" || event.bot_id) {
    return;
  }

  const rawText = event.text || "";
  // Strip out bot user mentions (e.g. <@U123456>) to avoid polluting the prompt
  const cleanQuery = rawText.replace(/<@U[A-Z0-9]+>/g, "").trim();

  if (!cleanQuery) {
    return;
  }

  console.log(`[SLACK EVENTS] App mention query received: "${cleanQuery}" from user ${event.user}`);

  // Resolve linked DARK profile from DB
  const user = await getMappedUser(event.user);
  if (!user) {
    // If user mapping collection lookup is missing, post error context
    await postToSlack("https://slack.com/api/chat.postMessage", {
      channel: event.channel,
      text: "Unable to locate a mapped Dark AI Profile for your Slack member ID."
    });
    return;
  }

  // Execute unified pipeline
  const clientState = { currentPage: "slack_chat" };
  const nyxResponse = await queryNyxCore(cleanQuery, user._id, clientState);

  // Format to Slack block structures
  const slackPayload = formatToBlockKit(nyxResponse, cleanQuery);
  slackPayload.channel = event.channel;

  // Post back to workspace channel
  await postToSlack("https://slack.com/api/chat.postMessage", slackPayload);
}

module.exports = { handleEvent };
