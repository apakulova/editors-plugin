const NUMBER_DIAGNOSTICS_START_AT = new Date("2026-08-25T00:00:00+03:00");
const NUMBER_DIAGNOSTICS_END_AT = new Date("2026-09-19T00:00:00+03:00");
const NUMBER_DIAGNOSTICS_DELETE_AT = new Date("2026-09-19T09:00:00+03:00");
const NUMBER_DIAGNOSTICS_MAX_PAYLOAD_BYTES = 512 * 1024;
const NUMBER_DIAGNOSTICS_MAX_CASES_PER_REQUEST = 200;
const NUMBER_DIAGNOSTICS_MAX_TEXT_LENGTH = 12_000;
const NUMBER_RULES_INITIAL_VERSION = "numbers-2026-08-25-v1";

function isNumberDiagnosticsCollectionOpen(date = new Date()) {
  const timestamp = date.getTime();
  return timestamp >= NUMBER_DIAGNOSTICS_START_AT.getTime() && timestamp < NUMBER_DIAGNOSTICS_END_AT.getTime();
}

function shouldDeleteNumberDiagnostics(date = new Date()) {
  return date.getTime() >= NUMBER_DIAGNOSTICS_DELETE_AT.getTime();
}

function getNumberDiagnosticsDatabaseUrl(env = process.env) {
  return env.NUMBER_DIAGNOSTICS_DATABASE_URL || env.DATABASE_URL || "";
}

module.exports = {
  NUMBER_DIAGNOSTICS_DELETE_AT,
  NUMBER_DIAGNOSTICS_END_AT,
  NUMBER_DIAGNOSTICS_MAX_CASES_PER_REQUEST,
  NUMBER_DIAGNOSTICS_MAX_PAYLOAD_BYTES,
  NUMBER_DIAGNOSTICS_MAX_TEXT_LENGTH,
  NUMBER_DIAGNOSTICS_START_AT,
  NUMBER_RULES_INITIAL_VERSION,
  getNumberDiagnosticsDatabaseUrl,
  isNumberDiagnosticsCollectionOpen,
  shouldDeleteNumberDiagnostics,
};
