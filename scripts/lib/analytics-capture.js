const DEFAULT_POSTHOG_CAPTURE_URL = "https://eu.i.posthog.com/i/v0/e/";
const DEFAULT_POSTHOG_PROJECT_TOKEN = "phc_BkVcyxEX27UmgdY7RhHQkquqQVL49kHhL9qDPNsFYzcp";
const ANALYTICS_TRANSPORT = "vercel_queue_v1";
const ANALYTICS_QUEUE_TOPIC = "chistovik-analytics";
const ANALYTICS_QUEUE_RETENTION_SECONDS = 7 * 24 * 60 * 60;
const MAX_ANALYTICS_PAYLOAD_BYTES = 512 * 1024;
const POSTHOG_TIMEOUT_MS = 5000;
const ALLOWED_ANALYTICS_EVENTS = new Set([
  "settings_opened",
  "plugin_run_started",
  "plugin_run_completed",
  "plugin_run_failed",
  "channel_link_clicked",
  "website_link_clicked",
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class AnalyticsCaptureError extends Error {
  constructor(statusCode, code) {
    super(code);
    this.code = code;
    this.statusCode = statusCode;
  }
}

function isPlainObject(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function getRequestBodySize(body) {
  if (typeof body === "string") {
    return Buffer.byteLength(body, "utf8");
  }

  if (Buffer.isBuffer(body)) {
    return body.byteLength;
  }

  try {
    return Buffer.byteLength(JSON.stringify(body), "utf8");
  } catch {
    throw new AnalyticsCaptureError(400, "invalid_json");
  }
}

function parseRequestBody(body) {
  if (getRequestBodySize(body) > MAX_ANALYTICS_PAYLOAD_BYTES) {
    throw new AnalyticsCaptureError(413, "payload_too_large");
  }

  if (Buffer.isBuffer(body)) {
    body = body.toString("utf8");
  }

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      throw new AnalyticsCaptureError(400, "invalid_json");
    }
  }

  if (!isPlainObject(body)) {
    throw new AnalyticsCaptureError(400, "invalid_payload");
  }

  return body;
}

function validateAnalyticsPayload(body, now = Date.now()) {
  const payload = parseRequestBody(body);

  if (!ALLOWED_ANALYTICS_EVENTS.has(payload.event)) {
    throw new AnalyticsCaptureError(400, "unknown_event");
  }

  if (typeof payload.distinct_id !== "string" || payload.distinct_id.length === 0 || payload.distinct_id.length > 200) {
    throw new AnalyticsCaptureError(400, "invalid_distinct_id");
  }

  if (!isPlainObject(payload.properties)) {
    throw new AnalyticsCaptureError(400, "invalid_properties");
  }

  if (typeof payload.timestamp !== "string" || payload.timestamp.length > 64 || !Number.isFinite(Date.parse(payload.timestamp))) {
    throw new AnalyticsCaptureError(400, "invalid_timestamp");
  }

  if (typeof payload.uuid !== "string" || !UUID_PATTERN.test(payload.uuid)) {
    throw new AnalyticsCaptureError(400, "invalid_uuid");
  }

  const deliveryDelayMs = Math.max(0, now - Date.parse(payload.timestamp));

  return {
    distinct_id: payload.distinct_id,
    event: payload.event,
    properties: {
      ...payload.properties,
      analytics_delivery_delay_ms: deliveryDelayMs,
      analytics_transport: ANALYTICS_TRANSPORT,
    },
    timestamp: payload.timestamp,
    uuid: payload.uuid,
  };
}

function getPostHogCaptureUrl(env = process.env) {
  return env.POSTHOG_CAPTURE_URL || DEFAULT_POSTHOG_CAPTURE_URL;
}

function getPostHogProjectToken(env = process.env) {
  return env.POSTHOG_PROJECT_TOKEN || DEFAULT_POSTHOG_PROJECT_TOKEN;
}

async function forwardAnalyticsPayload(payload, options = {}) {
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs || POSTHOG_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(getPostHogCaptureUrl(env), {
      body: JSON.stringify({
        ...payload,
        api_key: getPostHogProjectToken(env),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AnalyticsCaptureError(502, "posthog_rejected_event");
    }
  } catch (error) {
    if (error instanceof AnalyticsCaptureError) {
      throw error;
    }

    throw new AnalyticsCaptureError(502, "posthog_unavailable");
  } finally {
    clearTimeout(timeout);
  }
}

async function enqueueAnalyticsPayload(payload, options = {}) {
  const sendImpl = options.sendImpl || require("@vercel/queue").send;

  try {
    return await sendImpl(ANALYTICS_QUEUE_TOPIC, payload, {
      idempotencyKey: payload.uuid,
      retentionSeconds: ANALYTICS_QUEUE_RETENTION_SECONDS,
    });
  } catch {
    throw new AnalyticsCaptureError(503, "queue_unavailable");
  }
}

function getQueueCreatedAtMs(metadata) {
  if (metadata?.createdAt instanceof Date) {
    return metadata.createdAt.getTime();
  }

  if (typeof metadata?.createdAt === "string") {
    const timestamp = Date.parse(metadata.createdAt);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  return null;
}

async function deliverQueuedAnalyticsPayload(payload, metadata = {}, options = {}) {
  const now = options.now || Date.now();
  const createdAtMs = getQueueCreatedAtMs(metadata);
  const queueWaitMs = createdAtMs === null ? 0 : Math.max(0, now - createdAtMs);
  const deliveryCount = Number.isFinite(metadata.deliveryCount) ? Math.max(1, Math.round(metadata.deliveryCount)) : 1;

  await forwardAnalyticsPayload(
    {
      ...payload,
      properties: {
        ...payload.properties,
        analytics_queue_delivery_count: deliveryCount,
        analytics_queue_wait_ms: queueWaitMs,
      },
    },
    options
  );
}

module.exports = {
  ALLOWED_ANALYTICS_EVENTS,
  ANALYTICS_QUEUE_RETENTION_SECONDS,
  ANALYTICS_QUEUE_TOPIC,
  ANALYTICS_TRANSPORT,
  AnalyticsCaptureError,
  DEFAULT_POSTHOG_CAPTURE_URL,
  MAX_ANALYTICS_PAYLOAD_BYTES,
  deliverQueuedAnalyticsPayload,
  enqueueAnalyticsPayload,
  forwardAnalyticsPayload,
  getPostHogCaptureUrl,
  getPostHogProjectToken,
  parseRequestBody,
  validateAnalyticsPayload,
};
