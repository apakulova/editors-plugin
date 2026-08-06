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
const BASE_ANALYTICS_PROPERTIES = [
  "$geoip_disable",
  "$process_person_profile",
  "analytics_schema_version",
  "identity_type",
  "plugin_release",
];
const RUN_CONTEXT_PROPERTIES = [
  "mode",
  "performance_measurement_version",
  "point_editing_phase",
  "process_hidden_nodes",
  "process_locked_nodes",
  "recolor_existing_asterisks",
  "run_id",
  "selected_nodes_count",
  "selected_text_nodes_count",
  "selection_scope",
  "source",
];
const RUN_RESULT_PROPERTIES = [
  "changed_anything",
  "changed_style_segments_count",
  "changed_text_layers_count",
  "characters_changed_total",
  "characters_processed_total",
  "duration_ms",
  "failed_text_layers_count",
  "found_text_layers_count",
  "largest_text_layer_characters",
  "loaded_unique_fonts_count",
  "point_edit_max_operations_count",
  "point_edit_mismatch_layers_count",
  "point_edit_operations_count",
  "point_edit_planned_layers_count",
  "processed_text_layers_count",
  "successful_text_layers_count",
  "safe_failure_text_layers_count",
  "critical_integrity_text_layers_count",
  "not_reached_text_layers_count",
  "rollback_attempted_layers_count",
  "rollback_failed_layers_count",
  "skipped_hidden_count",
  "skipped_locked_count",
  "slowest_text_layer_ms",
];
const TIMING_PROPERTIES = [
  "timing_collect_text_ms",
  "timing_compare_text_ms",
  "timing_development_markers_ms",
  "timing_fonts_ms",
  "timing_other_ms",
  "timing_point_edit_planning_ms",
  "timing_read_styles_ms",
  "timing_restore_styles_ms",
  "timing_typography_ms",
  "timing_write_text_ms",
];
const RULE_ANALYTICS_PROPERTIES = [
  "rule_analytics_version",
  "rule_change_pairs_count",
  "rule_change_pairs_json",
  "rule_changed_codes",
  "rule_changed_codes_count",
  "rule_failed_code",
  "rule_measured_codes_count",
  "rule_metrics_json",
  "rule_most_active_changed_layers",
  "rule_most_active_code",
  "rule_slowest_code",
  "rule_slowest_duration_ms",
];
const FAILURE_PROPERTIES = [
  "error_category",
  "error_fingerprint",
  "error_location",
  "error_name",
  "error_operation",
  "stage",
];
const EVENT_ANALYTICS_PROPERTIES = {
  settings_opened: new Set([...BASE_ANALYTICS_PROPERTIES, "source"]),
  channel_link_clicked: new Set([...BASE_ANALYTICS_PROPERTIES, "link", "source"]),
  website_link_clicked: new Set([...BASE_ANALYTICS_PROPERTIES, "link", "source"]),
  plugin_run_started: new Set([...BASE_ANALYTICS_PROPERTIES, ...RUN_CONTEXT_PROPERTIES]),
  plugin_run_completed: new Set([
    ...BASE_ANALYTICS_PROPERTIES,
    ...RUN_CONTEXT_PROPERTIES,
    ...RUN_RESULT_PROPERTIES,
    ...TIMING_PROPERTIES,
    ...RULE_ANALYTICS_PROPERTIES,
  ]),
  plugin_run_failed: new Set([
    ...BASE_ANALYTICS_PROPERTIES,
    ...RUN_CONTEXT_PROPERTIES,
    ...RUN_RESULT_PROPERTIES,
    ...TIMING_PROPERTIES,
    ...RULE_ANALYTICS_PROPERTIES,
    ...FAILURE_PROPERTIES,
  ]),
};
const BOOLEAN_ANALYTICS_PROPERTIES = new Set([
  "$geoip_disable",
  "$process_person_profile",
  "changed_anything",
  "process_hidden_nodes",
  "process_locked_nodes",
  "recolor_existing_asterisks",
]);
const STRING_ANALYTICS_PROPERTIES = new Set([
  "error_category",
  "error_fingerprint",
  "error_location",
  "error_name",
  "error_operation",
  "identity_type",
  "link",
  "mode",
  "plugin_release",
  "point_editing_phase",
  "rule_change_pairs_json",
  "rule_changed_codes",
  "rule_failed_code",
  "rule_metrics_json",
  "rule_most_active_code",
  "rule_slowest_code",
  "run_id",
  "selection_scope",
  "source",
  "stage",
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ANONYMOUS_ID_PATTERN = /^anon_[a-z0-9_]+$/;

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

  if (Object.keys(payload).some((key) => !["distinct_id", "event", "properties", "timestamp", "uuid"].includes(key))) {
    throw new AnalyticsCaptureError(400, "unknown_payload_field");
  }

  if (!ALLOWED_ANALYTICS_EVENTS.has(payload.event)) {
    throw new AnalyticsCaptureError(400, "unknown_event");
  }

  if (typeof payload.distinct_id !== "string" || !ANONYMOUS_ID_PATTERN.test(payload.distinct_id) || payload.distinct_id.length > 200) {
    throw new AnalyticsCaptureError(400, "invalid_distinct_id");
  }

  if (!isPlainObject(payload.properties)) {
    throw new AnalyticsCaptureError(400, "invalid_properties");
  }

  validateAnalyticsProperties(payload.event, payload.properties);

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

function validateAnalyticsProperties(event, properties) {
  const allowedProperties = EVENT_ANALYTICS_PROPERTIES[event];

  for (const requiredProperty of BASE_ANALYTICS_PROPERTIES) {
    if (!Object.prototype.hasOwnProperty.call(properties, requiredProperty)) {
      throw new AnalyticsCaptureError(400, "missing_property");
    }
  }

  for (const [key, value] of Object.entries(properties)) {
    if (!allowedProperties.has(key)) {
      throw new AnalyticsCaptureError(400, "unknown_property");
    }

    if (value === null) {
      if (!key.startsWith("rule_") && event !== "plugin_run_failed") {
        throw new AnalyticsCaptureError(400, "invalid_property_type");
      }

      continue;
    }

    if (BOOLEAN_ANALYTICS_PROPERTIES.has(key)) {
      if (typeof value !== "boolean") {
        throw new AnalyticsCaptureError(400, "invalid_property_type");
      }

      continue;
    }

    if (STRING_ANALYTICS_PROPERTIES.has(key)) {
      validateAnalyticsStringProperty(key, value);
      continue;
    }

    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new AnalyticsCaptureError(400, "invalid_property_type");
    }
  }

  if (properties.$geoip_disable !== true || properties.$process_person_profile !== false) {
    throw new AnalyticsCaptureError(400, "invalid_privacy_property");
  }
}

function validateAnalyticsStringProperty(key, value) {
  if (typeof value !== "string") {
    throw new AnalyticsCaptureError(400, "invalid_property_type");
  }

  if (key === "rule_change_pairs_json" || key === "rule_metrics_json") {
    validateSafeAnalyticsJson(value);
    return;
  }

  const patterns = {
    error_category: /^[a-z0-9_]+$/,
    error_fingerprint: /^[a-z0-9]+$/,
    error_location: /^[A-Za-z0-9_./:-]+$/,
    error_name: /^[A-Za-z][A-Za-z0-9_]{0,99}$/,
    error_operation: /^[a-z0-9_]+$/,
    identity_type: /^(anonymous|identified)$/,
    link: /^(channel|website)$/,
    mode: /^(default|beauty|development)$/,
    plugin_release: /^\d{4}-\d{2}-\d{2}$/,
    point_editing_phase: /^[a-z0-9_]+$/,
    rule_changed_codes: /^[a-z0-9_,]*$/,
    rule_failed_code: /^[a-z0-9_]+$/,
    rule_most_active_code: /^[a-z0-9_]+$/,
    rule_slowest_code: /^[a-z0-9_]+$/,
    run_id: /^run_[a-z0-9_]+$/,
    selection_scope: /^(single_text|container|page|multi_selection)$/,
    source: /^(settings|about_tab|quick_run)$/,
    stage: /^[a-z0-9_]+$/,
  };

  if (value.length > 2048 || !patterns[key].test(value)) {
    throw new AnalyticsCaptureError(400, "invalid_property_value");
  }
}

function validateSafeAnalyticsJson(value) {
  if (value.length > 128 * 1024) {
    throw new AnalyticsCaptureError(400, "invalid_property_value");
  }

  let parsed;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new AnalyticsCaptureError(400, "invalid_property_value");
  }

  if (!isSafeAnalyticsJsonValue(parsed)) {
    throw new AnalyticsCaptureError(400, "invalid_property_value");
  }
}

function isSafeAnalyticsJsonValue(value) {
  if (value === null || typeof value === "boolean") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0;
  }

  if (!isPlainObject(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([key, nestedValue]) => /^[A-Za-z0-9_>,-]+$/.test(key) && isSafeAnalyticsJsonValue(nestedValue)
  );
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
