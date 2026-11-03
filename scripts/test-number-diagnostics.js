const assert = require("assert");
const fs = require("fs");

const {
  NumberDiagnosticsCaptureError,
  validateNumberDiagnosticsPayload,
} = require("./lib/number-diagnostics-capture");
const {
  NUMBER_DIAGNOSTICS_END_AT,
  isNumberDiagnosticsCollectionOpen,
} = require("./lib/number-diagnostics-config");
const {
  createCaseFilters,
  getSeenAfterThreshold,
  normalizeSeenAfter,
} = require("./lib/number-diagnostics-store");

assert.strictEqual(isNumberDiagnosticsCollectionOpen(new Date("2026-09-18T20:59:59.999Z")), true);
assert.strictEqual(isNumberDiagnosticsCollectionOpen(NUMBER_DIAGNOSTICS_END_AT), false);
assert.strictEqual(normalizeSeenAfter("2026-08-27T12:34:56.789Z"), "2026-08-27T12:34:56.789Z");
assert.strictEqual(
  normalizeSeenAfter("2026-08-27T12:34:56.789123Z"),
  "2026-08-27T12:34:56.789123Z",
  "Visit watermark must preserve PostgreSQL microseconds"
);
assert.strictEqual(normalizeSeenAfter("not-a-date"), null);
assert.strictEqual(
  getSeenAfterThreshold("2026-08-27T12:34:56.789Z"),
  "2026-08-27T12:34:56.789999Z",
  "Legacy millisecond watermark must exclude the already seen database row"
);
assert.strictEqual(
  getSeenAfterThreshold("2026-08-27T12:34:56.789123Z"),
  "2026-08-27T12:34:56.789123Z",
  "Precise watermark must remain unchanged"
);
const newCasesFilters = createCaseFilters({ newOnly: "1", seenAfter: "2026-08-27T12:34:56.789Z" });
assert(newCasesFilters.conditions.some((condition) => condition.includes("created_at >")));
assert(newCasesFilters.params.includes("2026-08-27T12:34:56.789999Z"));
const firstVisitFilters = createCaseFilters({ newOnly: "1" });
assert(firstVisitFilters.conditions.includes("FALSE"));
const validPayload = {
  capturedAt: "2026-08-26T09:15:00.000Z",
  cases: [
    {
      afterText: "Стоимость 338,00 $ за месяц",
      beforeText: "Стоимость $338.00 за месяц",
      id: "123e4567-e89b-42d3-a456-426614174000",
      layerMode: "single",
      neighbors: [],
      numberAfter: "338,00 $",
      numberBefore: "$338.00",
      numberKind: "Сумма с валютой",
      numberRulesVersion: "numbers-2026-08-25-v1",
      reason: "Надёжный признак количества повлиял на обработку",
      ruleCodes: ["number_decimal_comma", "number_unit_currency_nbsp"],
      status: "changed",
    },
  ],
  pluginRelease: "2026-08-26",
  runId: "run_mt9qf0xi_lsrjemhcg6_syx9p1y704",
  schemaVersion: 1,
};
const validated = validateNumberDiagnosticsPayload(validPayload);
assert.strictEqual(validated.cases[0].numberBefore, "$338.00");
assert.strictEqual(validated.cases[0].beforeText, "Стоимость $338.00 за месяц");
assert.strictEqual(validated.cases[0].numberRulesVersion, "numbers-2026-08-25-v1");
assert.strictEqual(validated.runId, "run_mt9qf0xi_lsrjemhcg6_syx9p1y704");
assert.strictEqual(validated.schemaVersion, 1);
assert.strictEqual(validateNumberDiagnosticsPayload({ ...validPayload, schemaVersion: 2 }).schemaVersion, 2);
assert.strictEqual(validateNumberDiagnosticsPayload({ ...validPayload, schemaVersion: 3 }).schemaVersion, 3);
assert.strictEqual(validateNumberDiagnosticsPayload({ ...validPayload, schemaVersion: 4 }).schemaVersion, 4);
assert.strictEqual(validateNumberDiagnosticsPayload({ ...validPayload, schemaVersion: 5 }).schemaVersion, 5);
assert.strictEqual(Object.prototype.hasOwnProperty.call(validated.cases[0], "fileName"), false);
const legacyCase = { ...validPayload.cases[0] };
delete legacyCase.numberRulesVersion;
assert.strictEqual(
  validateNumberDiagnosticsPayload({ ...validPayload, cases: [legacyCase] }).cases[0].numberRulesVersion,
  "numbers-2026-08-25-v1"
);

assert.throws(
  () => validateNumberDiagnosticsPayload({ ...validPayload, fileName: "Secret.fig" }),
  (error) => error instanceof NumberDiagnosticsCaptureError && error.code === "forbidden_payload_property"
);
assert.throws(
  () => validateNumberDiagnosticsPayload({ ...validPayload, cases: [{ ...validPayload.cases[0], nodeId: "1:2" }] }),
  (error) => error instanceof NumberDiagnosticsCaptureError && error.code === "forbidden_case_property"
);

const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
for (const removedPath of [
  "public/number-diagnostics.html",
  "public/number-diagnostics.js",
  "public/number-diagnostics.css",
  "public/number-diagnostics-demo.json",
  "api/number-diagnostics.js",
  "api/number-diagnostics-session.js",
  "api/number-diagnostics-export.js",
  "scripts/lib/number-diagnostics-auth.js",
]) {
  assert.strictEqual(fs.existsSync(removedPath), false, `Temporary diagnostics must stay removed: ${removedPath}`);
}
assert(!(vercelConfig.rewrites || []).some((rewrite) => rewrite.source === "/number-diagnostics"));

console.log("Number diagnostics tests passed.");
