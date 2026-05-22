const {
  assertRequiredEnv,
  createAnalyticsMessage,
  sendTelegramMessage,
} = require("./lib/analytics-report");

async function main() {
  assertRequiredEnv(process.env, [
    "POSTHOG_PERSONAL_API_KEY",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
  ]);

  const message = await createAnalyticsMessage("yesterday");

  await sendTelegramMessage(message);
  console.log(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
