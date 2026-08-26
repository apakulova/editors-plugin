const {
  NUMBER_DIAGNOSTICS_MAX_CASES_PER_REQUEST,
  NUMBER_DIAGNOSTICS_MAX_PAYLOAD_BYTES,
  NUMBER_DIAGNOSTICS_MAX_TEXT_LENGTH,
  NUMBER_RULES_INITIAL_VERSION,
} = require("./number-diagnostics-config");
const { ALLOWED_LAYER_MODES, ALLOWED_STATUSES } = require("./number-diagnostics-store");

class NumberDiagnosticsCaptureError extends Error {
  constructor(statusCode, code) {
    super(code);
    this.name = "NumberDiagnosticsCaptureError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function parsePayload(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      throw new NumberDiagnosticsCaptureError(400, "invalid_json");
    }
  }

  return body;
}

function assertPlainObject(value, code) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new NumberDiagnosticsCaptureError(400, code);
  }
}

function assertExactKeys(value, allowedKeys, code) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw new NumberDiagnosticsCaptureError(400, code);
    }
  }
}

function assertString(value, maximumLength, code, minimumLength = 0) {
  if (typeof value !== "string" || value.length < minimumLength || value.length > maximumLength) {
    throw new NumberDiagnosticsCaptureError(400, code);
  }

  return value;
}

function validateNeighbor(value) {
  assertPlainObject(value, "invalid_neighbor");
  assertExactKeys(value, new Set(["direction", "role", "text", "usedAsEvidence"]), "forbidden_neighbor_property");

  if (!new Set(["left", "right"]).has(value.direction)) {
    throw new NumberDiagnosticsCaptureError(400, "invalid_neighbor_direction");
  }

  if (!new Set(["context", "evidence", "protection", "separator"]).has(value.role)) {
    throw new NumberDiagnosticsCaptureError(400, "invalid_neighbor_role");
  }

  if (typeof value.usedAsEvidence !== "boolean") {
    throw new NumberDiagnosticsCaptureError(400, "invalid_neighbor_evidence");
  }

  return {
    direction: value.direction,
    role: value.role,
    text: assertString(value.text, NUMBER_DIAGNOSTICS_MAX_TEXT_LENGTH, "invalid_neighbor_text"),
    usedAsEvidence: value.usedAsEvidence,
  };
}

function validateCase(value) {
  assertPlainObject(value, "invalid_case");
  assertExactKeys(
    value,
    new Set([
      "afterText",
      "beforeText",
      "id",
      "layerMode",
      "neighbors",
      "numberAfter",
      "numberBefore",
      "numberKind",
      "numberRulesVersion",
      "reason",
      "ruleCodes",
      "status",
    ]),
    "forbidden_case_property"
  );

  const id = assertString(value.id, 64, "invalid_case_id", 16);

  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    throw new NumberDiagnosticsCaptureError(400, "invalid_case_id");
  }

  if (!ALLOWED_STATUSES.has(value.status)) {
    throw new NumberDiagnosticsCaptureError(400, "invalid_case_status");
  }

  if (!ALLOWED_LAYER_MODES.has(value.layerMode)) {
    throw new NumberDiagnosticsCaptureError(400, "invalid_case_layer_mode");
  }

  const numberBefore = assertString(value.numberBefore, 1000, "invalid_number_before");
  const numberAfter = assertString(value.numberAfter, 1000, "invalid_number_after");

  if (!/\d/.test(numberBefore) && !/\d/.test(numberAfter)) {
    throw new NumberDiagnosticsCaptureError(400, "case_without_digits");
  }

  if (!Array.isArray(value.neighbors) || value.neighbors.length > 4) {
    throw new NumberDiagnosticsCaptureError(400, "invalid_neighbors");
  }

  if (!Array.isArray(value.ruleCodes) || value.ruleCodes.length > 20) {
    throw new NumberDiagnosticsCaptureError(400, "invalid_rule_codes");
  }

  const ruleCodes = value.ruleCodes.map((code) => {
    const normalized = assertString(code, 80, "invalid_rule_code", 1);

    if (!/^[a-z0-9_]+$/.test(normalized)) {
      throw new NumberDiagnosticsCaptureError(400, "invalid_rule_code");
    }

    return normalized;
  });

  return {
    afterText: assertString(value.afterText, NUMBER_DIAGNOSTICS_MAX_TEXT_LENGTH, "invalid_after_text"),
    beforeText: assertString(value.beforeText, NUMBER_DIAGNOSTICS_MAX_TEXT_LENGTH, "invalid_before_text"),
    id,
    layerMode: value.layerMode,
    neighbors: value.neighbors.map(validateNeighbor),
    numberAfter,
    numberBefore,
    numberKind: assertString(value.numberKind, 80, "invalid_number_kind", 1),
    numberRulesVersion:
      value.numberRulesVersion === undefined
        ? NUMBER_RULES_INITIAL_VERSION
        : assertString(value.numberRulesVersion, 80, "invalid_number_rules_version", 1),
    reason: assertString(value.reason, 240, "invalid_reason", 1),
    ruleCodes,
    status: value.status,
  };
}

function validateNumberDiagnosticsPayload(body) {
  const payload = parsePayload(body);
  assertPlainObject(payload, "invalid_payload");

  const serialized = JSON.stringify(payload);

  if (Buffer.byteLength(serialized, "utf8") > NUMBER_DIAGNOSTICS_MAX_PAYLOAD_BYTES) {
    throw new NumberDiagnosticsCaptureError(413, "payload_too_large");
  }

  assertExactKeys(payload, new Set(["capturedAt", "cases", "pluginRelease", "runId", "schemaVersion"]), "forbidden_payload_property");

  if (![1, 2, 3, 4].includes(payload.schemaVersion)) {
    throw new NumberDiagnosticsCaptureError(400, "unsupported_schema_version");
  }

  const capturedAt = assertString(payload.capturedAt, 40, "invalid_captured_at", 20);
  const capturedDate = new Date(capturedAt);

  if (!Number.isFinite(capturedDate.getTime())) {
    throw new NumberDiagnosticsCaptureError(400, "invalid_captured_at");
  }

  if (!Array.isArray(payload.cases) || payload.cases.length === 0 || payload.cases.length > NUMBER_DIAGNOSTICS_MAX_CASES_PER_REQUEST) {
    throw new NumberDiagnosticsCaptureError(400, "invalid_cases");
  }

  const runId = assertString(payload.runId, 64, "invalid_run_id", 16);

  if (!/^[a-zA-Z0-9_-]+$/.test(runId)) {
    throw new NumberDiagnosticsCaptureError(400, "invalid_run_id");
  }

  return {
    capturedAt: capturedDate.toISOString(),
    cases: payload.cases.map(validateCase),
    pluginRelease: assertString(payload.pluginRelease, 80, "invalid_plugin_release", 1),
    runId,
    schemaVersion: payload.schemaVersion,
  };
}

module.exports = {
  NumberDiagnosticsCaptureError,
  validateNumberDiagnosticsPayload,
};
