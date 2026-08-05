const assert = require("assert");
const fs = require("fs");
const {
  ANALYTICS_QUEUE_RETENTION_SECONDS,
  ANALYTICS_QUEUE_TOPIC,
  ANALYTICS_TRANSPORT,
  AnalyticsCaptureError,
  MAX_ANALYTICS_PAYLOAD_BYTES,
  deliverQueuedAnalyticsPayload,
  enqueueAnalyticsPayload,
  forwardAnalyticsPayload,
  validateAnalyticsPayload,
} = require("./lib/analytics-capture");
const { createCaptureHandler } = require("../api/capture");

const EVENT_UUID = "123e4567-e89b-42d3-a456-426614174000";
const EVENT_TIMESTAMP = "2026-08-05T08:00:00.000Z";

function createPayload(overrides = {}) {
  return {
    distinct_id: "anon_test",
    event: "plugin_run_started",
    properties: {
      $geoip_disable: true,
      $process_person_profile: false,
      analytics_schema_version: 9,
      plugin_release: "2026-08-05",
      run_id: "run_test",
    },
    timestamp: EVENT_TIMESTAMP,
    uuid: EVENT_UUID,
    ...overrides,
  };
}

function createResponse() {
  const headers = new Map();

  return {
    body: "",
    ended: false,
    headers,
    statusCode: 0,
    end(value = "") {
      this.body = value;
      this.ended = true;
    },
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
  };
}

async function expectCaptureError(callback, statusCode, code) {
  try {
    await callback();
    assert.fail(`Expected ${code}`);
  } catch (error) {
    assert(error instanceof AnalyticsCaptureError);
    assert.strictEqual(error.statusCode, statusCode);
    assert.strictEqual(error.code, code);
  }
}

async function run() {
  const validatedPayload = validateAnalyticsPayload(createPayload(), Date.parse("2026-08-05T08:00:01.250Z"));
  assert.strictEqual(validatedPayload.properties.analytics_transport, ANALYTICS_TRANSPORT);
  assert.strictEqual(validatedPayload.properties.analytics_delivery_delay_ms, 1250);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(validatedPayload, "api_key"), false);
  assert.strictEqual(validatedPayload.uuid, EVENT_UUID);
  assert.strictEqual(ANALYTICS_QUEUE_RETENTION_SECONDS, 7 * 24 * 60 * 60);

  await expectCaptureError(
    () => Promise.resolve(validateAnalyticsPayload(createPayload({ event: "unknown_event" }))),
    400,
    "unknown_event"
  );
  await expectCaptureError(
    () => Promise.resolve(validateAnalyticsPayload(createPayload({ uuid: "not-a-uuid" }))),
    400,
    "invalid_uuid"
  );
  await expectCaptureError(
    () => Promise.resolve(validateAnalyticsPayload("x".repeat(MAX_ANALYTICS_PAYLOAD_BYTES + 1))),
    413,
    "payload_too_large"
  );

  let queuedTopic = "";
  let queuedPayload = null;
  let queuedOptions = null;
  await enqueueAnalyticsPayload(validatedPayload, {
    sendImpl: async (topic, payload, options) => {
      queuedTopic = topic;
      queuedPayload = payload;
      queuedOptions = options;
      return { messageId: "msg_test" };
    },
  });
  assert.strictEqual(queuedTopic, ANALYTICS_QUEUE_TOPIC);
  assert.strictEqual(queuedPayload.uuid, EVENT_UUID);
  assert.strictEqual(queuedOptions.idempotencyKey, EVENT_UUID);
  assert.strictEqual(queuedOptions.retentionSeconds, 7 * 24 * 60 * 60);

  await expectCaptureError(
    () => enqueueAnalyticsPayload(validatedPayload, { sendImpl: async () => { throw new Error("queue down"); } }),
    503,
    "queue_unavailable"
  );

  let forwardedUrl = "";
  let forwardedOptions = null;
  await forwardAnalyticsPayload(validatedPayload, {
    env: {
      POSTHOG_CAPTURE_URL: "https://capture.example.test/i/v0/e/",
      POSTHOG_PROJECT_TOKEN: "phc_server_token",
    },
    fetchImpl: async (url, options) => {
      forwardedUrl = url;
      forwardedOptions = options;
      return { ok: true };
    },
  });

  assert.strictEqual(forwardedUrl, "https://capture.example.test/i/v0/e/");
  const forwardedPayload = JSON.parse(forwardedOptions.body);
  assert.strictEqual(forwardedPayload.api_key, "phc_server_token");
  assert.strictEqual(forwardedPayload.uuid, EVENT_UUID);
  assert.strictEqual(forwardedPayload.properties.analytics_transport, ANALYTICS_TRANSPORT);

  await deliverQueuedAnalyticsPayload(
    validatedPayload,
    {
      createdAt: new Date("2026-08-05T08:00:02.000Z"),
      deliveryCount: 3,
    },
    {
      env: {
        POSTHOG_CAPTURE_URL: "https://capture.example.test/i/v0/e/",
        POSTHOG_PROJECT_TOKEN: "phc_server_token",
      },
      fetchImpl: async (_url, options) => {
        const deliveredPayload = JSON.parse(options.body);
        assert.strictEqual(deliveredPayload.properties.analytics_queue_delivery_count, 3);
        assert.strictEqual(deliveredPayload.properties.analytics_queue_wait_ms, 4000);
        return { ok: true };
      },
      now: Date.parse("2026-08-05T08:00:06.000Z"),
    }
  );

  await expectCaptureError(
    () => forwardAnalyticsPayload(validatedPayload, { fetchImpl: async () => ({ ok: false }) }),
    502,
    "posthog_rejected_event"
  );

  const acceptedPayloads = [];
  const captureHandler = createCaptureHandler(async (payload) => {
    acceptedPayloads.push(payload);
  });

  const optionsResponse = createResponse();
  await captureHandler({ method: "OPTIONS" }, optionsResponse);
  assert.strictEqual(optionsResponse.statusCode, 204);
  assert.strictEqual(optionsResponse.headers.get("access-control-allow-origin"), "*");

  const methodResponse = createResponse();
  await captureHandler({ method: "GET" }, methodResponse);
  assert.strictEqual(methodResponse.statusCode, 405);

  const captureResponse = createResponse();
  await captureHandler({ body: createPayload(), method: "POST" }, captureResponse);
  assert.strictEqual(captureResponse.statusCode, 202);
  assert.deepStrictEqual(JSON.parse(captureResponse.body), { ok: true, queued: true });
  assert.strictEqual(acceptedPayloads.length, 1);
  assert.strictEqual(acceptedPayloads[0].uuid, EVENT_UUID);

  const unavailableHandler = createCaptureHandler(async () => {
    throw new AnalyticsCaptureError(503, "queue_unavailable");
  });
  const unavailableResponse = createResponse();
  await unavailableHandler({ body: createPayload(), method: "POST" }, unavailableResponse);
  assert.strictEqual(unavailableResponse.statusCode, 503);
  assert.deepStrictEqual(JSON.parse(unavailableResponse.body), { ok: false, error: "queue_unavailable" });

  const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
  const queueTriggers = vercelConfig.functions["api/queues/posthog.js"].experimentalTriggers;
  assert.deepStrictEqual(queueTriggers, [
    {
      type: "queue/v2beta",
      topic: ANALYTICS_QUEUE_TOPIC,
      retryAfterSeconds: 60,
      initialDelaySeconds: 0,
    },
  ]);

  console.log("Analytics capture tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
