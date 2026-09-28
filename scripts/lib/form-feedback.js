const crypto = require("crypto");

const MAX_AUTHOR_LENGTH = 500;
const MAX_IMPRESSIONS_LENGTH = 5000;
const MAX_PUBLISH_PERMISSION_LENGTH = 200;

class FormFeedbackError extends Error {
  constructor(statusCode, code) {
    super(code);
    this.code = code;
    this.statusCode = statusCode;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeOptionalText(value, maximumLength, fieldName) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw new FormFeedbackError(400, `${fieldName}_must_be_string`);
  }

  const normalized = value.trim();

  if (normalized.length > maximumLength) {
    throw new FormFeedbackError(400, `${fieldName}_too_long`);
  }

  return normalized;
}

function validateFormFeedbackPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new FormFeedbackError(400, "invalid_payload");
  }

  const payload = {
    author: normalizeOptionalText(value.author, MAX_AUTHOR_LENGTH, "author"),
    impressions: normalizeOptionalText(value.impressions, MAX_IMPRESSIONS_LENGTH, "impressions"),
    publishPermission: normalizeOptionalText(
      value.publishPermission,
      MAX_PUBLISH_PERMISSION_LENGTH,
      "publish_permission"
    ),
  };

  if (payload.impressions.length === 0) {
    throw new FormFeedbackError(400, "impressions_required");
  }

  if (payload.publishPermission.length === 0) {
    throw new FormFeedbackError(400, "publish_permission_required");
  }

  return payload;
}

function isSecretValid(providedSecret, expectedSecret) {
  if (typeof providedSecret !== "string" || typeof expectedSecret !== "string") {
    return false;
  }

  const provided = Buffer.from(providedSecret);
  const expected = Buffer.from(expectedSecret);

  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

function formatFormFeedbackMessage(payload) {
  const author = payload.author || "Не представились";

  return [
    "<b>📝 Новый отзыв о Чистовике</b>",
    "",
    "<i>Автор:</i>",
    escapeHtml(author),
    "",
    "<i>Впечатления:</i>",
    escapeHtml(payload.impressions),
    "",
    "<i>Можно опубликовать:</i>",
    escapeHtml(payload.publishPermission),
  ].join("\n");
}

module.exports = {
  FormFeedbackError,
  formatFormFeedbackMessage,
  isSecretValid,
  validateFormFeedbackPayload,
};
