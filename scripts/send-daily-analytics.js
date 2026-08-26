const {
  assertRequiredEnv,
} = require("./lib/analytics-report");
const { deliverDailyAnalyticsReport } = require("./lib/daily-report-delivery");
const { getNumberDiagnosticsDatabaseUrl, shouldDeleteNumberDiagnostics } = require("./lib/number-diagnostics-config");
const { deleteNumberDiagnosticCases } = require("./lib/number-diagnostics-store");

function isEnabled(value) {
  return value === true || value === "true" || value === "1";
}

async function main() {
  assertRequiredEnv(process.env, [
    "POSTHOG_PERSONAL_API_KEY",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
  ]);

  const source = process.env.DAILY_REPORT_SOURCE || "github_manual";
  const delivery = await deliverDailyAnalyticsReport(
    {
      force: isEnabled(process.env.DAILY_REPORT_FORCE),
      source,
    },
    process.env
  );

  if (delivery.status === "sent") {
    console.log(delivery.message);
  }

  if (shouldDeleteNumberDiagnostics() && getNumberDiagnosticsDatabaseUrl(process.env)) {
    await deleteNumberDiagnosticCases(process.env);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
