const { isSessionAuthorized } = require("../scripts/lib/number-diagnostics-auth");
const {
  NumberDiagnosticsCaptureError,
  validateNumberDiagnosticsPayload,
} = require("../scripts/lib/number-diagnostics-capture");
const { isNumberDiagnosticsCollectionOpen } = require("../scripts/lib/number-diagnostics-config");
const {
  getNumberDiagnosticCases,
  getNumberDiagnosticFilterOptions,
  getNumberDiagnosticSummary,
  insertNumberDiagnosticCases,
} = require("../scripts/lib/number-diagnostics-store");

function setCommonHeaders(response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
}

function setCaptureHeaders(response) {
  setCommonHeaders(response);
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Origin", "*");
}

function sendJson(response, statusCode, payload, capture = false) {
  if (capture) {
    setCaptureHeaders(response);
  } else {
    setCommonHeaders(response);
  }

  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function getQuery(request) {
  if (request.query && typeof request.query === "object") {
    return request.query;
  }

  try {
    return Object.fromEntries(new URL(request.url, "https://chistovik-plugin.vercel.app").searchParams.entries());
  } catch {
    return {};
  }
}

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    setCaptureHeaders(response);
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method === "POST") {
    try {
      if (!isNumberDiagnosticsCollectionOpen()) {
        sendJson(response, 410, { ok: false, error: "collection_closed" }, true);
        return;
      }

      const payload = validateNumberDiagnosticsPayload(request.body);

      if (!isNumberDiagnosticsCollectionOpen(new Date(payload.capturedAt))) {
        sendJson(response, 410, { ok: false, error: "collection_closed" }, true);
        return;
      }

      const inserted = await insertNumberDiagnosticCases(payload);
      sendJson(response, 202, { inserted, ok: true }, true);
    } catch (error) {
      if (error instanceof NumberDiagnosticsCaptureError) {
        sendJson(response, error.statusCode, { ok: false, error: error.code }, true);
        return;
      }

      console.error("[number-diagnostics] Capture failure", error?.code || error?.name || "unknown");
      sendJson(response, 503, { ok: false, error: "capture_unavailable" }, true);
    }

    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  if (!isSessionAuthorized(request)) {
    sendJson(response, 401, { ok: false, error: "unauthorized" });
    return;
  }

  try {
    const query = getQuery(request);
    const [cases, summary, filters] = await Promise.all([
      getNumberDiagnosticCases(query),
      getNumberDiagnosticSummary(query),
      getNumberDiagnosticFilterOptions(query),
    ]);
    sendJson(response, 200, { cases, filters, ok: true, summary });
  } catch (error) {
    console.error("[number-diagnostics] Read failure", error?.code || error?.name || "unknown");
    sendJson(response, 503, { ok: false, error: "report_unavailable" });
  }
};
