const assert = require("assert");
const {
  FormFeedbackError,
  formatFormFeedbackMessage,
  isSecretValid,
  validateFormFeedbackPayload,
} = require("./lib/form-feedback");
const { createFormFeedbackHandler } = require("../api/form-feedback");

function createResponse() {
  return {
    body: "",
    headers: {},
    statusCode: 0,
    end(value) {
      this.body = value;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
}

function assertFeedbackError(callback, code) {
  assert.throws(callback, (error) => error instanceof FormFeedbackError && error.code === code);
}

const payload = validateFormFeedbackPayload({
  author: "  Аня  ",
  impressions: "  Всё работает <отлично>  ",
  publishPermission: "  Конечно  ",
});

assert.deepStrictEqual(payload, {
  author: "Аня",
  impressions: "Всё работает <отлично>",
  publishPermission: "Конечно",
});
assert.strictEqual(
  formatFormFeedbackMessage(payload),
  [
    "<b>📝 Новый отзыв о Чистовике</b>",
    "",
    "<i>Автор:</i>",
    "Аня",
    "",
    "<i>Впечатления:</i>",
    "Всё работает &lt;отлично&gt;",
    "",
    "<i>Можно опубликовать:</i>",
    "Конечно",
  ].join("\n")
);
assert.strictEqual(
  formatFormFeedbackMessage({ ...payload, author: "" }).includes("<i>Автор:</i>\nНе представились"),
  true
);
assert.strictEqual(isSecretValid("same-secret", "same-secret"), true);
assert.strictEqual(isSecretValid("wrong-secret", "same-secret"), false);
assertFeedbackError(() => validateFormFeedbackPayload({ ...payload, impressions: "" }), "impressions_required");
assertFeedbackError(
  () => validateFormFeedbackPayload({ ...payload, publishPermission: "" }),
  "publish_permission_required"
);

async function runHandlerTests() {
  const sentMessages = [];
  const env = {
    FORM_FEEDBACK_WEBHOOK_SECRET: "test-secret",
    TELEGRAM_BOT_TOKEN: "test-token",
    TELEGRAM_CHAT_ID: "123",
  };
  const handler = createFormFeedbackHandler(async (text, receivedEnv, chatId) => {
    sentMessages.push({ chatId, receivedEnv, text });
  }, env);

  const unauthorizedResponse = createResponse();
  await handler(
    { body: payload, headers: { "x-feedback-secret": "wrong-secret" }, method: "POST" },
    unauthorizedResponse
  );
  assert.strictEqual(unauthorizedResponse.statusCode, 401);
  assert.deepStrictEqual(JSON.parse(unauthorizedResponse.body), { ok: false, error: "unauthorized" });

  const successResponse = createResponse();
  await handler(
    { body: payload, headers: { "x-feedback-secret": "test-secret" }, method: "POST" },
    successResponse
  );
  assert.strictEqual(successResponse.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(successResponse.body), { ok: true });
  assert.strictEqual(sentMessages.length, 1);
  assert.strictEqual(sentMessages[0].chatId, "123");
  assert.strictEqual(sentMessages[0].text, formatFormFeedbackMessage(payload));

  const stringBodyResponse = createResponse();
  await handler(
    { body: JSON.stringify(payload), headers: { "x-feedback-secret": "test-secret" }, method: "POST" },
    stringBodyResponse
  );
  assert.strictEqual(stringBodyResponse.statusCode, 200);

  const invalidJsonResponse = createResponse();
  await handler(
    { body: "{", headers: { "x-feedback-secret": "test-secret" }, method: "POST" },
    invalidJsonResponse
  );
  assert.strictEqual(invalidJsonResponse.statusCode, 400);
  assert.deepStrictEqual(JSON.parse(invalidJsonResponse.body), { ok: false, error: "invalid_json" });
}

runHandlerTests()
  .then(() => console.log("Form feedback tests passed."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
