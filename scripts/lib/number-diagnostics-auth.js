const crypto = require("crypto");

const SESSION_COOKIE_NAME = "chistovik_number_diagnostics";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function safeEqual(first, second) {
  const firstBuffer = Buffer.from(String(first));
  const secondBuffer = Buffer.from(String(second));

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

function getRequiredSecret(env, name) {
  const value = env[name];

  if (typeof value !== "string" || value.length < 16) {
    const error = new Error(`${name} is not configured`);
    error.code = "number_diagnostics_not_configured";
    throw error;
  }

  return value;
}

function signSessionPayload(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionToken(env = process.env, now = new Date()) {
  const secret = getRequiredSecret(env, "NUMBER_DIAGNOSTICS_SESSION_SECRET");
  const payload = Buffer.from(
    JSON.stringify({
      expiresAt: now.getTime() + SESSION_MAX_AGE_SECONDS * 1000,
      purpose: "number-diagnostics",
    })
  ).toString("base64url");
  const signature = signSessionPayload(payload, secret);
  return `${payload}.${signature}`;
}

function parseCookies(request) {
  const header = request.headers?.cookie;

  if (typeof header !== "string") {
    return {};
  }

  return Object.fromEntries(
    header.split(";").map((part) => {
      const separatorIndex = part.indexOf("=");
      const name = separatorIndex === -1 ? part.trim() : part.slice(0, separatorIndex).trim();
      const value = separatorIndex === -1 ? "" : part.slice(separatorIndex + 1).trim();
      return [name, decodeURIComponent(value)];
    })
  );
}

function isSessionAuthorized(request, env = process.env, now = new Date()) {
  try {
    const token = parseCookies(request)[SESSION_COOKIE_NAME];

    if (typeof token !== "string") {
      return false;
    }

    const separatorIndex = token.lastIndexOf(".");

    if (separatorIndex === -1) {
      return false;
    }

    const payload = token.slice(0, separatorIndex);
    const signature = token.slice(separatorIndex + 1);
    const secret = getRequiredSecret(env, "NUMBER_DIAGNOSTICS_SESSION_SECRET");

    if (!safeEqual(signature, signSessionPayload(payload, secret))) {
      return false;
    }

    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return parsed.purpose === "number-diagnostics" && Number(parsed.expiresAt) > now.getTime();
  } catch {
    return false;
  }
}

function isPasswordValid(password, env = process.env) {
  const expected = getRequiredSecret(env, "NUMBER_DIAGNOSTICS_PASSWORD");
  return safeEqual(password, expected);
}

function getSessionCookie(token) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

function getClearedSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

module.exports = {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getClearedSessionCookie,
  getSessionCookie,
  isPasswordValid,
  isSessionAuthorized,
};
