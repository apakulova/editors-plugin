const {
  assertRequiredEnv,
  createAnalyticsMessage,
  sendTelegramMessage,
} = require("../scripts/lib/analytics-report");

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function getTelegramSecret(request) {
  return request.headers["x-telegram-bot-api-secret-token"];
}

function isAllowedChat(message, env = process.env) {
  const chatId = message?.chat?.id;

  return String(chatId) === String(env.TELEGRAM_CHAT_ID);
}

function getCommand(message) {
  const text = typeof message?.text === "string" ? message.text.trim() : "";

  return text.split(/\s+/)[0].split("@")[0].toLowerCase();
}

module.exports = async function handler(request, response) {
  try {
    if (request.method !== "POST") {
      sendJson(response, 200, { ok: true });
      return;
    }

    assertRequiredEnv(process.env, [
      "POSTHOG_PERSONAL_API_KEY",
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_CHAT_ID",
      "TELEGRAM_WEBHOOK_SECRET",
    ]);

    if (getTelegramSecret(request) !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      sendJson(response, 401, { ok: false });
      return;
    }

    const message = request.body?.message;

    if (!message || !isAllowedChat(message)) {
      sendJson(response, 200, { ok: true });
      return;
    }

    const command = getCommand(message);

    if (command !== "/today") {
      sendJson(response, 200, { ok: true });
      return;
    }

    const text = await createAnalyticsMessage("today");

    await sendTelegramMessage(text, process.env, String(message.chat.id));
    sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { ok: false });
  }
};
