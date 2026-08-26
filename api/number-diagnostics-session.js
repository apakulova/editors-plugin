const {
  createSessionToken,
  getClearedSessionCookie,
  getSessionCookie,
  isPasswordValid,
  isSessionAuthorized,
} = require("../scripts/lib/number-diagnostics-auth");

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function parseBody(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  return body;
}

module.exports = async function handler(request, response) {
  try {
    if (request.method === "GET") {
      sendJson(response, 200, { authenticated: isSessionAuthorized(request) });
      return;
    }

    if (request.method === "DELETE") {
      response.setHeader("Set-Cookie", getClearedSessionCookie());
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method !== "POST") {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" });
      return;
    }

    const body = parseBody(request.body);

    if (body === null || typeof body !== "object" || typeof body.password !== "string" || !isPasswordValid(body.password)) {
      sendJson(response, 401, { ok: false, error: "invalid_password" });
      return;
    }

    response.setHeader("Set-Cookie", getSessionCookie(createSessionToken()));
    sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error("[number-diagnostics-session] Session failure", error?.code || error?.name || "unknown");
    sendJson(response, 503, { ok: false, error: "session_unavailable" });
  }
};
