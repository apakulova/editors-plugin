const {
  assertRequiredEnv,
  createAnalyticsMessageOrDiagnostic,
  sendTelegramMessage,
} = require("../scripts/lib/analytics-report");

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function isAuthorizedCron(request, env = process.env) {
  const authHeader = request.headers.authorization;

  return typeof env.CRON_SECRET === "string" && authHeader === `Bearer ${env.CRON_SECRET}`;
}

module.exports = async function handler(request, response) {
  try {
    if (request.method !== "GET") {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" });
      return;
    }

    assertRequiredEnv(process.env, ["CRON_SECRET"]);

    if (!isAuthorizedCron(request)) {
      sendJson(response, 401, { ok: false, error: "unauthorized" });
      return;
    }

    assertRequiredEnv(process.env, [
      "POSTHOG_PERSONAL_API_KEY",
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_CHAT_ID",
    ]);

    const text = await createAnalyticsMessageOrDiagnostic("yesterday");

    await sendTelegramMessage(text);
    sendJson(response, 200, { ok: true, period: "yesterday" });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { ok: false, error: "daily_report_failed" });
  }
};
