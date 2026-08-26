const assert = require("assert");
const fs = require("fs");

const {
  createSessionToken,
  getSessionCookie,
  isPasswordValid,
  isSessionAuthorized,
} = require("./lib/number-diagnostics-auth");
const {
  NumberDiagnosticsCaptureError,
  validateNumberDiagnosticsPayload,
} = require("./lib/number-diagnostics-capture");
const {
  NUMBER_DIAGNOSTICS_END_AT,
  isNumberDiagnosticsCollectionOpen,
} = require("./lib/number-diagnostics-config");
const { createCsv, formatDecisionContext } = require("../api/number-diagnostics-export");
const { formatNumberDiagnosticCasesLine } = require("./lib/analytics-report");

const authEnv = {
  NUMBER_DIAGNOSTICS_PASSWORD: "test-password-for-report",
  NUMBER_DIAGNOSTICS_SESSION_SECRET: "test-session-secret-that-is-long-enough",
};
const now = new Date("2026-08-26T09:00:00.000Z");
const token = createSessionToken(authEnv, now);
const cookie = getSessionCookie(token);
const request = {
  headers: {
    cookie: cookie.split(";")[0],
  },
};

assert.strictEqual(isPasswordValid("test-password-for-report", authEnv), true);
assert.strictEqual(isPasswordValid("wrong-password-for-report", authEnv), false);
assert.strictEqual(isSessionAuthorized(request, authEnv, new Date(now.getTime() + 1000)), true);
assert.strictEqual(isSessionAuthorized(request, authEnv, new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000)), false);
assert.strictEqual(isNumberDiagnosticsCollectionOpen(new Date("2026-09-18T20:59:59.999Z")), true);
assert.strictEqual(isNumberDiagnosticsCollectionOpen(NUMBER_DIAGNOSTICS_END_AT), false);
const telegramLine = formatNumberDiagnosticCasesLine(
  {
    start: new Date("2026-08-25T21:00:00.000Z"),
    end: new Date("2026-08-26T21:00:00.000Z"),
  },
  127,
  { NUMBER_DIAGNOSTICS_REPORT_URL: "https://example.test/number-diagnostics" }
);
assert(telegramLine.includes("Изменения чисел: 127 случаев"));
assert(telegramLine.includes("from=2026-08-26&amp;to=2026-08-26"));

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

assert.strictEqual(
  formatDecisionContext({ number_before: "10000", neighbors: [{ direction: "right", text: "₽", usedAsEvidence: true }] }),
  "10000 · ₽"
);
const csv = createCsv([
  {
    after_text: "Стоимость 338,00 $ за месяц",
    before_text: "Стоимость $338.00 за месяц",
    captured_at: "2026-08-26T09:15:00.000Z",
    layer_mode: "single",
    neighbors: [],
    number_after: "338,00 $",
    number_before: "$338.00",
    number_kind: "Сумма с валютой",
    number_rules_version: "numbers-2026-08-25-v1",
    plugin_release: "2026-08-26",
    reason: "Валюта",
    rule_codes: ["number_decimal_comma"],
    run_id: "run-test",
    status: "changed",
  },
]);
assert(csv.startsWith("\uFEFF"));
assert(csv.includes("Стоимость $338.00 за месяц"));
assert(csv.includes("Стоимость 338,00 $ за месяц"));
assert.strictEqual(csv.includes("[НП]"), false);
assert.strictEqual(csv.includes("неразрывные пробелы как"), false);
assert(csv.includes("numbers-2026-08-25-v1"));
assert(csv.includes("Сборка диагностики"));

const page = fs.readFileSync("public/number-diagnostics.html", "utf8");
const pageScript = fs.readFileSync("public/number-diagnostics.js", "utf8");
const favicon = fs.readFileSync("public/favicon.png");
const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
assert(page.includes("Все случаи с числами") === false, "Summary labels are rendered from the page script");
assert(pageScript.includes("Все случаи с числами"));
assert(page.includes("Выгрузить все случаи"));
assert(page.includes("Показать неразрывные пробелы"));
assert(page.includes('id="spacesToggle" type="checkbox" checked'));
assert(page.includes('<link rel="icon" href="/favicon.png" type="image/png">'));
assert.deepStrictEqual(Array.from(favicon.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
assert(pageScript.includes("Сборка диагностики"));
assert(pageScript.includes("Соседний слой для проверки"));
assert(pageScript.includes("Соседний текстовый слой не найден"));
assert(pageScript.includes('neighbor.role !== "separator"'));
assert.strictEqual(pageScript.includes("getChangedRanges"), true);
assert.strictEqual(pageScript.includes('document.createElement("mark")'), true);
assert.strictEqual(fs.readFileSync("public/number-diagnostics.css", "utf8").includes(".comparison-text .nbsp-marker"), true);
assert.strictEqual(pageScript.includes('number_context_nbsp: "Пробел рядом с числом"'), true);
assert.strictEqual(pageScript.includes('"Изменён текст рядом"'), true);
assert.strictEqual(page.includes("space-legend"), false);
assert.strictEqual(page.includes("Узкий неразрывный пробел"), false);
assert(page.includes('meta name="robots" content="noindex, nofollow, noarchive"'));
assert(vercelConfig.rewrites.some((rewrite) => rewrite.source === "/number-diagnostics"));

console.log("Number diagnostics tests passed.");
