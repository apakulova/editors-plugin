const {
  FormFeedbackError,
  formatFormFeedbackMessage,
  isSecretValid,
  validateFormFeedbackPayload,
} = require("../scripts/lib/form-feedback");
const { assertRequiredEnv, sendTelegramMessage } = require("../scripts/lib/analytics-report");

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function parseRequestBody(body) {
  if (typeof body !== "string") {
    return body;
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new FormFeedbackError(400, "invalid_json");
  }
}

function createFormFeedbackHandler(sendTelegram = sendTelegramMessage, env = process.env) {
  return async function handler(request, response) {
    if (request.method !== "POST") {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" });
      return;
    }

    try {
      assertRequiredEnv(env, ["FORM_FEEDBACK_WEBHOOK_SECRET", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]);

      if (!isSecretValid(request.headers["x-feedback-secret"], env.FORM_FEEDBACK_WEBHOOK_SECRET)) {
        sendJson(response, 401, { ok: false, error: "unauthorized" });
        return;
      }

      const payload = validateFormFeedbackPayload(parseRequestBody(request.body));
      await sendTelegram(formatFormFeedbackMessage(payload), env, env.TELEGRAM_CHAT_ID);
      sendJson(response, 200, { ok: true });
    } catch (error) {
      if (error instanceof FormFeedbackError) {
        sendJson(response, error.statusCode, { ok: false, error: error.code });
        return;
      }

      console.error("[form-feedback] Failed to deliver feedback", error);
      sendJson(response, 500, { ok: false, error: "delivery_failed" });
    }
  };
}

module.exports = createFormFeedbackHandler();
module.exports.createFormFeedbackHandler = createFormFeedbackHandler;
