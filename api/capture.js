const {
  AnalyticsCaptureError,
  enqueueAnalyticsPayload,
  validateAnalyticsPayload,
} = require("../scripts/lib/analytics-capture");

function setCommonHeaders(response) {
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Cache-Control", "no-store");
}

function sendJson(response, statusCode, payload) {
  setCommonHeaders(response);
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function createCaptureHandler(enqueue = enqueueAnalyticsPayload) {
  return async function handler(request, response) {
    if (request.method === "OPTIONS") {
      setCommonHeaders(response);
      response.statusCode = 204;
      response.end();
      return;
    }

    if (request.method !== "POST") {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" });
      return;
    }

    try {
      const payload = validateAnalyticsPayload(request.body);
      await enqueue(payload);
      sendJson(response, 202, { ok: true, queued: true });
    } catch (error) {
      if (error instanceof AnalyticsCaptureError) {
        sendJson(response, error.statusCode, { ok: false, error: error.code });
        return;
      }

      console.error("[analytics-capture] Unexpected queue failure", error);
      sendJson(response, 500, { ok: false, error: "capture_failed" });
    }
  };
}

module.exports = createCaptureHandler();
module.exports.createCaptureHandler = createCaptureHandler;
