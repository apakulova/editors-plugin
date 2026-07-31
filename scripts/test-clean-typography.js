const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const NBSP = "\u00A0";
const NB_HYPHEN = "\u2011";
const EM_DASH = "\u2014";
const MINUS = "\u2212";
const MULTIPLY = "\u00D7";

const compiledSource = fs.readFileSync("dist/code.js", "utf8");

assert.strictEqual(compiledSource.includes(".detachInstance("), false, "The plugin must not detach library instances");
assert.strictEqual(compiledSource.includes("figma.createText("), false, "The plugin must not replace text layers with new layers");
assert.strictEqual(compiledSource.includes("typographRunInProgress"), false, "A repeated run must not end with a silent early return");

const source = compiledSource.replace(
  "void run();",
  [
    "globalThis.cleanTypography = cleanTypography;",
    "globalThis.cleanTypographyWithMetadata = cleanTypographyWithMetadata;",
    "globalThis.captureTextStyles = captureTextStyles;",
    "globalThis.getWholeTextStyle = getWholeTextStyle;",
    "globalThis.restoreWholeTextStyle = restoreWholeTextStyle;",
    "globalThis.restoreTextStyles = restoreTextStyles;",
    "globalThis.buildStyleMap = buildStyleMap;",
    "globalThis.createStyleRestorationPlan = createStyleRestorationPlan;",
    "globalThis.loadFontsForTextNode = loadFontsForTextNode;",
    "globalThis.getFontLoadPromise = getFontLoadPromise;",
    "globalThis.measureDuration = measureDuration;",
    "globalThis.filterProcessableTextNodes = filterProcessableTextNodes;",
    "globalThis.processTextNodes = processTextNodes;",
    "globalThis.syncDevelopmentMarkerPluginData = syncDevelopmentMarkerPluginData;",
    "globalThis.createAnalyticsEventPayload = createAnalyticsEventPayload;",
    "globalThis.createAnalyticsEventId = createAnalyticsEventId;",
    "globalThis.toQueuedAnalyticsEvent = toQueuedAnalyticsEvent;",
    "globalThis.createAnalyticsErrorDiagnostic = createAnalyticsErrorDiagnostic;",
    "globalThis.getAnalyticsCaptureEndpoint = getAnalyticsCaptureEndpoint;",
    "globalThis.getFailureNotificationMessage = getFailureNotificationMessage;",
    "globalThis.getCleanResultNotificationMessage = getCleanResultNotificationMessage;",
    "globalThis.getRunAnalyticsProperties = getRunAnalyticsProperties;",
    "globalThis.getTextProcessTimingAnalyticsProperties = getTextProcessTimingAnalyticsProperties;",
    "globalThis.getTypographyRuleAnalyticsProperties = getTypographyRuleAnalyticsProperties;",
    "globalThis.createTypographyRuleAnalyticsCollector = createTypographyRuleAnalyticsCollector;",
    "globalThis.beginTypographyRuleAnalyticsTextLayer = beginTypographyRuleAnalyticsTextLayer;",
    "globalThis.finishTypographyRuleAnalyticsTextLayer = finishTypographyRuleAnalyticsTextLayer;",
    "globalThis.createTypographyRuleAnalyticsSummary = createTypographyRuleAnalyticsSummary;",
    "globalThis.TYPOGRAPHY_RULE_CODES = TYPOGRAPHY_RULE_CODES;",
    "globalThis.presentRunOutcome = presentRunOutcome;",
    "globalThis.runTypograph = runTypograph;",
  ].join(" ")
);
let testMonotonicNow = 0;
const testPerformance = {
  now: () => testMonotonicNow,
};
const context = {
  clearTimeout,
  console,
  figma: {
    mixed: Symbol("mixed"),
    variables: {
      getVariableByIdAsync: async (id) => ({ id }),
    },
  },
  globalThis: {
    performance: testPerformance,
  },
  performance: testPerformance,
  setTimeout,
};

vm.createContext(context);
vm.runInContext(source, context);

const cleanTypography = context.globalThis.cleanTypography;
const cleanTypographyWithMetadata = context.globalThis.cleanTypographyWithMetadata;
const captureTextStyles = context.globalThis.captureTextStyles;
const getWholeTextStyle = context.globalThis.getWholeTextStyle;
const restoreWholeTextStyle = context.globalThis.restoreWholeTextStyle;
const restoreTextStyles = context.globalThis.restoreTextStyles;
const buildStyleMap = context.globalThis.buildStyleMap;
const createStyleRestorationPlan = context.globalThis.createStyleRestorationPlan;
const loadFontsForTextNode = context.globalThis.loadFontsForTextNode;
const getFontLoadPromise = context.globalThis.getFontLoadPromise;
const measureDuration = context.globalThis.measureDuration;
const filterProcessableTextNodes = context.globalThis.filterProcessableTextNodes;
const processTextNodes = context.globalThis.processTextNodes;
const syncDevelopmentMarkerPluginData = context.globalThis.syncDevelopmentMarkerPluginData;
const createAnalyticsEventPayload = context.globalThis.createAnalyticsEventPayload;
const createAnalyticsEventId = context.globalThis.createAnalyticsEventId;
const toQueuedAnalyticsEvent = context.globalThis.toQueuedAnalyticsEvent;
const createAnalyticsErrorDiagnostic = context.globalThis.createAnalyticsErrorDiagnostic;
const getAnalyticsCaptureEndpoint = context.globalThis.getAnalyticsCaptureEndpoint;
const getFailureNotificationMessage = context.globalThis.getFailureNotificationMessage;
const getCleanResultNotificationMessage = context.globalThis.getCleanResultNotificationMessage;
const getRunAnalyticsProperties = context.globalThis.getRunAnalyticsProperties;
const getTextProcessTimingAnalyticsProperties = context.globalThis.getTextProcessTimingAnalyticsProperties;
const getTypographyRuleAnalyticsProperties = context.globalThis.getTypographyRuleAnalyticsProperties;
const createTypographyRuleAnalyticsCollector = context.globalThis.createTypographyRuleAnalyticsCollector;
const beginTypographyRuleAnalyticsTextLayer = context.globalThis.beginTypographyRuleAnalyticsTextLayer;
const finishTypographyRuleAnalyticsTextLayer = context.globalThis.finishTypographyRuleAnalyticsTextLayer;
const createTypographyRuleAnalyticsSummary = context.globalThis.createTypographyRuleAnalyticsSummary;
const typographyRuleCodes = context.globalThis.TYPOGRAPHY_RULE_CODES;
const presentRunOutcome = context.globalThis.presentRunOutcome;
const runTypograph = context.globalThis.runTypograph;
const developmentOptions = {
  mode: "development",
  processHiddenNodes: false,
  processLockedNodes: false,
  recolorExistingAsterisks: false,
};
const developmentRecolorOptions = {
  mode: "development",
  processHiddenNodes: false,
  processLockedNodes: false,
  recolorExistingAsterisks: true,
};
const beautyOptions = {
  mode: "beauty",
  processHiddenNodes: false,
  processLockedNodes: false,
  recolorExistingAsterisks: false,
};

assert.strictEqual(getAnalyticsCaptureEndpoint(), "https://eu.i.posthog.com/i/v0/e/");

const analyticsEventUuid = "123e4567-e89b-42d3-a456-426614174000";
const analyticsPayload = createAnalyticsEventPayload(
  "plugin_run_started",
  { mode: "default", source: "quick_run" },
  {
    anonymousId: "anon_test",
    distinctId: "anon_test",
    identityType: "anonymous",
    userId: null,
  },
  "2026-06-08T10:15:00.000Z",
  analyticsEventUuid
);

assert.strictEqual(analyticsPayload.timestamp, "2026-06-08T10:15:00.000Z");
assert.strictEqual(analyticsPayload.uuid, analyticsEventUuid);
assert.match(createAnalyticsEventId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
assert.strictEqual(analyticsPayload.distinct_id, "anon_test");
assert.strictEqual(analyticsPayload.properties.$process_person_profile, false);
assert.strictEqual(analyticsPayload.properties.$geoip_disable, true);
assert.strictEqual(analyticsPayload.properties.analytics_schema_version, 7);
assert.strictEqual(analyticsPayload.properties.mode, "default");
assert.strictEqual(analyticsPayload.properties.plugin_release, "2026-07-31");
assert.strictEqual(Object.prototype.hasOwnProperty.call(analyticsPayload.properties, "plugin_version"), false);

const legacyQueuedEvent = {
  attempts: 1,
  id: "evt_legacy_retry",
  payload: {
    ...analyticsPayload,
  },
};
delete legacyQueuedEvent.payload.uuid;
const normalizedLegacyEventFirstRead = toQueuedAnalyticsEvent(legacyQueuedEvent);
const normalizedLegacyEventSecondRead = toQueuedAnalyticsEvent(legacyQueuedEvent);

assert(normalizedLegacyEventFirstRead);
assert(normalizedLegacyEventSecondRead);
assert.match(normalizedLegacyEventFirstRead.payload.uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
assert.strictEqual(normalizedLegacyEventFirstRead.payload.uuid, normalizedLegacyEventSecondRead.payload.uuid);

assert.strictEqual(
  getRunAnalyticsProperties({
    mode: "default",
    options: beautyOptions,
    runId: "run_test",
    selection: {
      scope: "single_text",
      selectedNodesCount: 1,
      selectedTextNodesCount: 1,
    },
    source: "quick_run",
    startedAt: 0,
  }).performance_measurement_version,
  3
);

assert.deepStrictEqual(
  {
    ...JSON.parse(JSON.stringify(createAnalyticsErrorDiagnostic(new Error("Font is unavailable"), "load_fonts"))),
    fingerprint: "stable",
  },
  {
    category: "font_unavailable",
    fingerprint: "stable",
    location: "src/code.ts:loadFontsForTextNode",
    name: "Error",
    operation: "load_text_layer_fonts",
  }
);

const ruleAnalyticsCollector = createTypographyRuleAnalyticsCollector();
beginTypographyRuleAnalyticsTextLayer(ruleAnalyticsCollector, 0);
const ruleAnalyticsResult = cleanTypographyWithMetadata("2*2 и 1000 руб", beautyOptions, [], ruleAnalyticsCollector);
finishTypographyRuleAnalyticsTextLayer(ruleAnalyticsCollector, ruleAnalyticsResult.text !== "2*2 и 1000 руб");
const ruleAnalyticsSummary = createTypographyRuleAnalyticsSummary(ruleAnalyticsCollector);
const ruleAnalyticsProperties = getTypographyRuleAnalyticsProperties(ruleAnalyticsSummary);

assert.strictEqual(ruleAnalyticsResult.text, `2${NBSP}${MULTIPLY}${NBSP}2${NBSP}и${NBSP}1${NBSP}000${NBSP}руб.`);
assert(ruleAnalyticsSummary.changedCodes.includes("math_multiplication"));
assert(ruleAnalyticsSummary.changedCodes.includes("number_group_digits"));
assert(ruleAnalyticsSummary.changedCodes.includes("abbr_dotted"));
assert(ruleAnalyticsSummary.changedCodes.includes("nbsp_short_cyrillic_words"));
assert.strictEqual(ruleAnalyticsProperties.rule_analytics_version, 2);
assert.strictEqual(ruleAnalyticsSummary.measuredCodesCount, 77);
assert.strictEqual(Object.keys(ruleAnalyticsSummary.metrics).length, 77);
assert.strictEqual(typeof ruleAnalyticsProperties.rule_metrics_json, "string");
assert.strictEqual(typeof ruleAnalyticsProperties.rule_change_pairs_json, "string");
assert.strictEqual(ruleAnalyticsProperties.rule_metrics_json.includes("2*2"), false);
assert.strictEqual(ruleAnalyticsProperties.rule_metrics_json.includes("1000 руб"), false);
assert.strictEqual(ruleAnalyticsProperties.rule_change_pairs_json.includes("2*2"), false);
assert.strictEqual(ruleAnalyticsSummary.failedRuleCode, null);

const documentedRuleCodes = Array.from(
  fs.readFileSync("docs/typography-rules.md", "utf8").matchAll(/`([a-z][a-z0-9_]+)`/g),
  (match) => match[1]
).filter((code) => typographyRuleCodes.includes(code));
assert.deepStrictEqual(
  Array.from(new Set(documentedRuleCodes)).sort(),
  JSON.parse(JSON.stringify(typographyRuleCodes)).sort(),
  "Every analytics rule code must remain documented"
);
assert.strictEqual(new Set(typographyRuleCodes).size, typographyRuleCodes.length, "Rule analytics codes must be unique");

const unchangedRuleAnalyticsCollector = createTypographyRuleAnalyticsCollector();
beginTypographyRuleAnalyticsTextLayer(unchangedRuleAnalyticsCollector, 0);
const unchangedRuleAnalyticsResult = cleanTypographyWithMetadata("Чистовик", beautyOptions, [], unchangedRuleAnalyticsCollector);
finishTypographyRuleAnalyticsTextLayer(unchangedRuleAnalyticsCollector, unchangedRuleAnalyticsResult.text !== "Чистовик");
const unchangedRuleAnalyticsSummary = createTypographyRuleAnalyticsSummary(unchangedRuleAnalyticsCollector);
assert.deepStrictEqual(JSON.parse(JSON.stringify(unchangedRuleAnalyticsSummary.changedCodes)), []);

const alreadyCleanText = `Чистовик работает с${NBSP}текстом и${NBSP}20${NBSP}кг`;
const alreadyCleanRuleAnalyticsCollector = createTypographyRuleAnalyticsCollector();
beginTypographyRuleAnalyticsTextLayer(alreadyCleanRuleAnalyticsCollector, 0);
const alreadyCleanRuleAnalyticsResult = cleanTypographyWithMetadata(alreadyCleanText, beautyOptions, [], alreadyCleanRuleAnalyticsCollector);
finishTypographyRuleAnalyticsTextLayer(alreadyCleanRuleAnalyticsCollector, alreadyCleanRuleAnalyticsResult.text !== alreadyCleanText);
const alreadyCleanRuleAnalyticsSummary = createTypographyRuleAnalyticsSummary(alreadyCleanRuleAnalyticsCollector);
assert.strictEqual(alreadyCleanRuleAnalyticsResult.text, alreadyCleanText);
assert.deepStrictEqual(JSON.parse(JSON.stringify(alreadyCleanRuleAnalyticsSummary.changedCodes)), []);
assert.deepStrictEqual(JSON.parse(JSON.stringify(alreadyCleanRuleAnalyticsSummary.changePairs)), {});
assert.strictEqual(alreadyCleanRuleAnalyticsSummary.metrics.nbsp_short_cyrillic_words.changedApplications, 0);
assert.strictEqual(alreadyCleanRuleAnalyticsSummary.metrics.nbsp_number_unit.changedApplications, 0);
assert(alreadyCleanRuleAnalyticsSummary.metrics.nbsp_short_cyrillic_words.calls > 0);

const protectedRuleAnalyticsCollector = createTypographyRuleAnalyticsCollector();
beginTypographyRuleAnalyticsTextLayer(protectedRuleAnalyticsCollector, 0);
const protectedRuleAnalyticsInput = "v2.0.1 192.168.0.1 SALE-2026 № 12345";
const protectedRuleAnalyticsResult = cleanTypographyWithMetadata(protectedRuleAnalyticsInput, beautyOptions, [], protectedRuleAnalyticsCollector);
finishTypographyRuleAnalyticsTextLayer(protectedRuleAnalyticsCollector, protectedRuleAnalyticsResult.text !== protectedRuleAnalyticsInput);
const protectedRuleAnalyticsSummary = createTypographyRuleAnalyticsSummary(protectedRuleAnalyticsCollector);
assert(protectedRuleAnalyticsSummary.metrics.number_protect_version.calls > 0);
assert(protectedRuleAnalyticsSummary.metrics.number_protect_ip.calls > 0);
assert(protectedRuleAnalyticsSummary.metrics.number_protect_code.calls > 0);
assert(protectedRuleAnalyticsSummary.metrics.number_protect_sign.calls > 0);
assert.strictEqual(protectedRuleAnalyticsSummary.changedCodes.includes("number_protect_version"), false);
assert.strictEqual(protectedRuleAnalyticsSummary.changedCodes.includes("number_protect_ip"), false);

const abbreviationLineBreakCollector = createTypographyRuleAnalyticsCollector();
beginTypographyRuleAnalyticsTextLayer(abbreviationLineBreakCollector, 0);
const abbreviationLineBreakInput = "5 кг.\nДоставка";
const abbreviationLineBreakResult = cleanTypographyWithMetadata(abbreviationLineBreakInput, beautyOptions, [], abbreviationLineBreakCollector);
finishTypographyRuleAnalyticsTextLayer(abbreviationLineBreakCollector, abbreviationLineBreakResult.text !== abbreviationLineBreakInput);
const abbreviationLineBreakSummary = createTypographyRuleAnalyticsSummary(abbreviationLineBreakCollector);
assert(abbreviationLineBreakSummary.changedCodes.includes("abbr_line_break"));

assert.strictEqual(createAnalyticsErrorDiagnostic(new Error("Node is read-only"), "write_text").category, "layer_not_editable");
assert.strictEqual(createAnalyticsErrorDiagnostic(new Error("Unexpected write failure"), "write_text").category, "write_text_failed");
assert.strictEqual(createAnalyticsErrorDiagnostic(new Error("Unsupported mixed property"), "restore_styles").category, "mixed_or_unsupported_property");
assert.strictEqual(createAnalyticsErrorDiagnostic(new Error("Original state rollback failed"), "rollback_styles").category, "rollback_failed");
const rollbackFailureNotificationError = new Error("Failed to process text layer");
rollbackFailureNotificationError.name = "RollbackFailureError";
assert.strictEqual(
  getFailureNotificationMessage(rollbackFailureNotificationError),
  "Плагин случайно сломал какие-то стили — проверьте текстовые слои 🛑"
);
assert.strictEqual(getFailureNotificationMessage(new Error("Other failure")), "Ой, не получилось почистить 🛑");
assert.strictEqual(
  getCleanResultNotificationMessage({ changed: 1, skippedHidden: 0, skippedLocked: 0 }),
  "Теперь всё чисто 🔥🔥🔥"
);
assert.strictEqual(
  getCleanResultNotificationMessage({ changed: 0, skippedHidden: 0, skippedLocked: 0 }),
  "Всё уже было чисто 👌"
);
assert.strictEqual(
  getCleanResultNotificationMessage({ changed: 1, skippedHidden: 0, skippedLocked: 1 }),
  "Замочки не тронуты, в остальном — теперь всё чисто 🔥🔥🔥"
);
assert.strictEqual(
  getCleanResultNotificationMessage({ changed: 0, skippedHidden: 1, skippedLocked: 0 }),
  "Скрытые слои не тронуты, а остальное уже было чисто 👌"
);
assert.strictEqual(
  getCleanResultNotificationMessage({ changed: 1, skippedHidden: 1, skippedLocked: 1 }),
  "Замочки и скрытые слои не тронуты, в остальном — теперь всё чисто 🔥🔥🔥"
);
assert.deepStrictEqual(
  JSON.parse(
    JSON.stringify(
      getTextProcessTimingAnalyticsProperties({
        compareText: 5,
        developmentMarkers: 6,
        fonts: 2,
        readStyles: 3,
        restoreStyles: 7,
        typography: 1,
        writeText: 4,
      })
    )
  ),
  {
    timing_compare_text_ms: 5,
    timing_development_markers_ms: 6,
    timing_fonts_ms: 2,
    timing_read_styles_ms: 3,
    timing_restore_styles_ms: 7,
    timing_typography_ms: 1,
    timing_write_text_ms: 4,
  }
);

function assertTextProcessCounts(result, expected) {
  assert.deepStrictEqual(
    {
      changed: result.changed,
      failed: result.failed,
      processed: result.processed,
      skippedHidden: result.skippedHidden,
      skippedLocked: result.skippedLocked,
    },
    expected
  );
}

function runStyleCaptureTests() {
  const baseSegment = {
    characters: "Заголовок",
    end: 9,
    fillStyleId: "",
    start: 0,
    textStyleId: "",
  };
  const nodeStyleFallback = {
    characters: "Заголовок",
    fillStyleId: "node-fill-style-id",
    getRangeFillStyleId: () => "",
    getRangeTextStyleId: () => "",
    getStyledTextSegments: () => [baseSegment],
    id: "node-style-fallback",
    textStyleId: "node-text-style-id",
  };

  const nodeCapturedStyles = captureTextStyles(nodeStyleFallback);

  assert.strictEqual(nodeCapturedStyles.length, 1);
  assert.strictEqual(nodeCapturedStyles[0].fillStyleId, "node-fill-style-id");
  assert.strictEqual(nodeCapturedStyles[0].textStyleId, "node-text-style-id");

  const rangeStyleFallback = {
    characters: "Заголовок",
    fillStyleId: context.figma.mixed,
    getRangeFillStyleId: () => "range-fill-style-id",
    getRangeTextStyleId: () => "range-text-style-id",
    getStyledTextSegments: () => [baseSegment],
    id: "range-style-fallback",
    textStyleId: context.figma.mixed,
  };

  const rangeCapturedStyles = captureTextStyles(rangeStyleFallback);

  assert.strictEqual(rangeCapturedStyles.length, 1);
  assert.strictEqual(rangeCapturedStyles[0].fillStyleId, "range-fill-style-id");
  assert.strictEqual(rangeCapturedStyles[0].textStyleId, "range-text-style-id");
}

function expectClean(input, expected) {
  const actual = cleanTypography(input);

  assert.strictEqual(actual, expected, input);
  assert.strictEqual(cleanTypography(actual), expected, `${input} should be idempotent`);
}

function expectDevelopmentIdempotent(input, expected) {
  const first = cleanTypographyWithMetadata(input, developmentOptions);
  const secondWithMarkers = cleanTypographyWithMetadata(first.text, developmentOptions, first.developmentMarkerIndexes);

  assert.strictEqual(first.text, expected, `${input} first development run`);
  assert.strictEqual(secondWithMarkers.text, expected, `${input} second development run with marker indexes`);
}

function expectDevelopmentStableWithoutMarkers(input, expected = input) {
  const actual = cleanTypographyWithMetadata(input, developmentOptions);

  assert.strictEqual(actual.text, expected, `${input} development run without marker indexes`);
}

expectClean(
  "Она спросила \"как дела?\". Я подумала \"ну всё... приехали!\". \"Она сказала: \"Я приду завтра!\"\".",
  `Она спросила «как дела?» Я${NBSP}подумала «ну${NBSP}всё… приехали!» «Она сказала: „Я${NBSP}приду завтра!“»`
);
expectClean("«Она сказала: „Я приду завтра!“»", `«Она сказала: „Я${NBSP}приду завтра!“»`);
expectClean("»Она сказала: „Я приду завтра!“»", `«Она сказала: „Я${NBSP}приду завтра!“»`);
expectClean("«Она сказала: “Я приду завтра!“»", `«Она сказала: „Я${NBSP}приду завтра!“»`);
expectClean("«Она сказала: „Я приду завтра!„»", `«Она сказала: „Я${NBSP}приду завтра!“»`);
expectClean("\"Она сказала: \"Я приду завтра!\"\"", `«Она сказала: „Я${NBSP}приду завтра!“»`);
expectClean("The word \"привет\" means hello.", 'The word "привет" means hello.');
expectClean("The word «привет» means hello.", 'The word "привет" means hello.');
expectClean("Кнопка называется \"Start\".", "Кнопка называется «Start».");
expectClean('Он сказал "Use \'clean typography\' mode".', `Он${NBSP}сказал «Use „clean typography“ mode».`);
expectClean('Он сказал "привет...".', `Он${NBSP}сказал «привет…».`);
expectClean('Он сказал "привет"...', `Он${NBSP}сказал «привет»…`);
expectClean('He said "Use "clean typography" mode".', 'He said "Use \'clean typography\' mode".');
expectClean('He said "Use \'clean typography\' mode".', 'He said "Use \'clean typography\' mode".');
expectClean('He said "The word "привет" means hello".', 'He said "The word \'привет\' means hello".');
expectClean("Что?? Да!! Правда!?", "Что? Да! Правда?!");
expectDevelopmentIdempotent("«Она сказала: „Я приду завтра!“»", "«Она сказала: „Я*приду завтра!“»");
expectDevelopmentIdempotent("«Ты правда спросил „зачем??“»", "«Ты*правда спросил „зачем?“»");
expectDevelopmentIdempotent("«„Как это скучно!“ — воскликнул я невольно».", "«„Как это скучно!“*— воскликнул я*невольно».");
expectDevelopmentIdempotent(`Он*сказал "Use 'clean typography' mode".`, `Он*сказал «Use „clean typography“ mode».`);
expectDevelopmentIdempotent(`Он*сказал*"Use*'clean typography'*mode".`, `Он*сказал*«Use*„clean typography“*mode».`);
expectDevelopmentIdempotent(`He*said*"Use*'clean typography'*mode".`, `He*said*"Use*'clean typography'*mode".`);

expectClean("10-20", `10${EM_DASH}20`);
expectClean("10 - 20", `10${EM_DASH}20`);
expectClean("10 – 20", `10${EM_DASH}20`);
expectClean("5 - 5", `5${EM_DASH}5`);
expectClean("5-10 кг", `5${EM_DASH}10${NBSP}кг`);
expectClean("5 – 10 кг", `5${EM_DASH}10${NBSP}кг`);
expectClean("5 — 10 кг", `5${EM_DASH}10${NBSP}кг`);
expectClean("2-5 ноября", `2${EM_DASH}5${NBSP}ноября`);
expectClean("2 – 5 ноября", `2${EM_DASH}5${NBSP}ноября`);
expectClean("2 — 5 ноября", `2${EM_DASH}5${NBSP}ноября`);
expectClean("12:25-13:35", `12:25${EM_DASH}13:35`);
expectClean("12:25 – 13:35", `12:25${EM_DASH}13:35`);
expectClean("12:25 — 13:35", `12:25${EM_DASH}13:35`);
expectClean("30.04-12.05", `30.04${EM_DASH}12.05`);
expectClean("30.04 – 12.05", `30.04${EM_DASH}12.05`);
expectClean("30.04 — 12.05", `30.04${EM_DASH}12.05`);
expectClean(`Период отпуска: 30.04${NBSP}— 12.05.`, `Период отпуска: 30.04${EM_DASH}12.05.`);
expectClean("2001-2019", `2001${EM_DASH}2019`);
expectClean("2001 – 2019", `2001${EM_DASH}2019`);
expectClean("2001 — 2019", `2001${EM_DASH}2019`);
expectClean("X-XI век", `X${EM_DASH}XI век`);
expectClean("X – XI век", `X${EM_DASH}XI век`);
expectClean("X—XI век", `X${EM_DASH}XI век`);
expectClean("I - III главы", `I${EM_DASH}III главы`);
expectClean("II-IV квартал", `II${EM_DASH}IV квартал`);
expectClean("в X-XI веках", `в${NBSP}X${EM_DASH}XI веках`);
expectClean("главы I-III", `главы I${EM_DASH}III`);
expectClean("разделы IV-VI", `разделы IV${EM_DASH}VI`);
expectClean("кв. I-II", `кв. I${EM_DASH}II`);
expectClean("2 000-4 000", `2${NBSP}000${NBSP}— 4${NBSP}000`);
expectClean("2 000–4 000", `2${NBSP}000${NBSP}— 4${NBSP}000`);
expectClean("2 000—4 000", `2${NBSP}000${NBSP}— 4${NBSP}000`);
expectClean("02.02.2012-05.05.2013", `02.02.2012${NBSP}— 05.05.2013`);
expectClean("02.02.2012 – 05.05.2013", `02.02.2012${NBSP}— 05.05.2013`);
expectClean("02.02.2012—05.05.2013", `02.02.2012${NBSP}— 05.05.2013`);
expectClean("Период акции: 02.02.2012-05.05.2013.", `Период акции: 02.02.2012${NBSP}— 05.05.2013.`);
expectClean("1 января-15 августа 2018 года", `1${NBSP}января${NBSP}— 15${NBSP}августа 2018 года`);
expectClean("1 января – 15 августа 2018 года", `1${NBSP}января${NBSP}— 15${NBSP}августа 2018 года`);
expectClean("1 января—15 августа 2018 года", `1${NBSP}января${NBSP}— 15${NBSP}августа 2018 года`);
expectClean(`Период отчёта: 15${NBSP}мая 2024—20${NBSP}июня 2${NBSP}025.`, `Период отчёта: 15${NBSP}мая 2024${NBSP}— 20${NBSP}июня 2025.`);
expectClean(`Период: I квартал 2024-IV квартал 2${NBSP}025.`, `Период: I квартал 2024${NBSP}— IV квартал 2025.`);
expectClean("2016-н. в.", `2016${NBSP}— н.${NBSP}в.`);
expectClean("2016 – н. в.", `2016${NBSP}— н.${NBSP}в.`);
expectClean("2016—н. в.", `2016${NBSP}— н.${NBSP}в.`);
expectClean("2016—наст. вр.", `2016${NBSP}— наст. вр.`);
expectClean("Диапазон ставок: 12,5%-15,75%.", `Диапазон ставок: 12,5${EM_DASH}15,75%.`);
expectClean("Диапазон ставок: 12,5%–15,75%.", `Диапазон ставок: 12,5${EM_DASH}15,75%.`);
expectClean("Диапазон ставок: 12,5%—15,75%.", `Диапазон ставок: 12,5${EM_DASH}15,75%.`);
expectClean("Диапазон ставок: 12,5%−15,75%.", `Диапазон ставок: 12,5${EM_DASH}15,75%.`);
expectClean("Скидка 5%, скидки 7%, скидке 9%, скидку 10%, скидкой 15%, скидкою 20%.", `Скидка${NBSP}5%, скидки${NBSP}7%, скидке${NBSP}9%, скидку${NBSP}10%, скидкой${NBSP}15%, скидкою${NBSP}20%.`);
expectClean("Скидка 5—10% зависит от категории.", `Скидка${NBSP}5${EM_DASH}10% зависит от${NBSP}категории.`);
expectClean("Скидка 5-10% зависит от категории.", `Скидка${NBSP}5${EM_DASH}10% зависит от${NBSP}категории.`);
expectClean("Кэшбэк 5%, кэшбэка 7%, кэшбэку 9%, кэшбэком 10%, кэшбэке 15%.", `Кэшбэк${NBSP}5%, кэшбэка${NBSP}7%, кэшбэку${NBSP}9%, кэшбэком${NBSP}10%, кэшбэке${NBSP}15%.`);
expectClean("Кешбэк 5%, кешбэка 7%, кешбэку 9%, кешбэком 10%, кешбэке 15%.", `Кешбэк${NBSP}5%, кешбэка${NBSP}7%, кешбэку${NBSP}9%, кешбэком${NBSP}10%, кешбэке${NBSP}15%.`);
expectClean("Ставка 5%, ставки 7%, ставке 9%, ставку 10%, ставкой 15%.", `Ставка${NBSP}5%, ставки${NBSP}7%, ставке${NBSP}9%, ставку${NBSP}10%, ставкой${NBSP}15%.`);
expectClean("Комиссия 5%, комиссии 7%, комиссию 9%, комиссией 10%.", `Комиссия${NBSP}5%, комиссии${NBSP}7%, комиссию${NBSP}9%, комиссией${NBSP}10%.`);
expectClean("Доходность 5%, доходности 7%, доходностью 9%.", `Доходность${NBSP}5%, доходности${NBSP}7%, доходностью${NBSP}9%.`);
expectClean("Рассрочка 5%, рассрочки 7%, рассрочке 9%, рассрочку 10%, рассрочкой 15%.", `Рассрочка${NBSP}5%, рассрочки${NBSP}7%, рассрочке${NBSP}9%, рассрочку${NBSP}10%, рассрочкой${NBSP}15%.`);
expectClean("Налог 5%, налога 7%, налогу 9%, налогом 10%, налоге 15%, НДС 20%.", `Налог${NBSP}5%, налога${NBSP}7%, налогу${NBSP}9%, налогом${NBSP}10%, налоге${NBSP}15%, НДС${NBSP}20%.`);
expectClean("Оборот 7%, sale 5%, антискидка 5%, супер-скидка 5%, ставка 5—10%.", `Оборот 7%, sale 5%, антискидка 5%, супер‑скидка 5%, ставка${NBSP}5—10%.`);
expectClean("Температура: +5-+10 C", `Температура: +5…+10${NBSP}°C`);
expectClean("Температура: +5...+10 °C", `Температура: +5…+10${NBSP}°C`);
expectClean("Температура: -5 – -10 °C", `Температура: ${MINUS}5…${MINUS}10${NBSP}°C`);
expectClean("Температура: +5—+10 F", `Температура: +5…+10${NBSP}°F`);
expectClean("Температура: -5...+10 °C", `Температура: ${MINUS}5…+10${NBSP}°C`);
expectClean("Температура: +5 — -10 °C", `Температура: +5…${MINUS}10${NBSP}°C`);
expectClean("Угол 20 °", "Угол 20°");
expectClean("Угол 20°", "Угол 20°");
expectClean("Угол 20,5 °", "Угол 20,5°");
expectClean("Угол -5 °", `Угол ${MINUS}5°`);
expectClean("Угол 20 ° к горизонту", `Угол 20° к${NBSP}горизонту`);
expectClean("Температура 20 °C", `Температура 20${NBSP}°C`);
expectClean("Температура 100 ° F", `Температура 100${NBSP}°F`);
expectClean("x-xi", `x${NB_HYPHEN}xi`);
expectClean("USB-C", `USB${NB_HYPHEN}C`);
expectClean("A-B тест", `A${NB_HYPHEN}B тест`);
expectClean("B2B", "B2B");
expectClean("M-Video", `M${NB_HYPHEN}Video`);
expectClean("X-ray", `X${NB_HYPHEN}ray`);
expectClean("план B-C", `план B${NB_HYPHEN}C`);
expectClean("X-X", `X${NB_HYPHEN}X`);
expectClean("из за угла", `из${NB_HYPHEN}за угла`);
expectClean("из под стола", `из${NB_HYPHEN}под стола`);
expectClean("кто то пришёл", `кто${NB_HYPHEN}то пришёл`);
expectClean("что либо ещё", `что${NB_HYPHEN}либо ещё`);
expectClean("где нибудь рядом", `где${NB_HYPHEN}нибудь рядом`);
expectClean("кое как сделали", `кое${NB_HYPHEN}как сделали`);
expectClean("все таки получилось", `все${NB_HYPHEN}таки получилось`);
expectClean("всё таки получилось", `всё${NB_HYPHEN}таки получилось`);

expectClean("10 - 5 = 5", `10${NBSP}${MINUS}${NBSP}5${NBSP}=${NBSP}5`);
expectClean("10 - 5 + 2", `10${NBSP}${MINUS}${NBSP}5${NBSP}+${NBSP}2`);
expectClean("10 - 5 - 2", `10${NBSP}${MINUS}${NBSP}5${NBSP}${MINUS}${NBSP}2`);
expectClean("-10 - 5", `${MINUS}10${NBSP}${MINUS}${NBSP}5`);
expectClean("-10 + 5 = -5", `${MINUS}10${NBSP}+${NBSP}5${NBSP}=${NBSP}${MINUS}5`);
expectClean("100% - 7%", `100%${NBSP}${MINUS}${NBSP}7%`);

expectClean("2*2", `2${NBSP}${MULTIPLY}${NBSP}2`);
expectClean("2 * 2", `2${NBSP}${MULTIPLY}${NBSP}2`);
expectClean("2x2", `2${NBSP}${MULTIPLY}${NBSP}2`);
expectClean("2 х 2", `2${NBSP}${MULTIPLY}${NBSP}2`);
expectClean("2/2", `2${NBSP}/${NBSP}2`);
expectClean("1/2", "\u00BD");
expectClean("Статус => готово", "Статус → готово");
expectClean("Назад -> вперёд", "Назад → вперёд");
expectClean("Формула: 2 * 2 = 4.", `Формула: 2${NBSP}${MULTIPLY}${NBSP}2${NBSP}=${NBSP}4.`);
expectClean("Формула: 2*2=4.", `Формула: 2${NBSP}${MULTIPLY}${NBSP}2${NBSP}=${NBSP}4.`);
expectClean("Обязательное поле *.", "Обязательное поле *.");
expectClean("Сноска * см. ниже.", "Сноска * см. ниже.");
expectClean("Пароль: **** 1234.", "Пароль: **** 1234.");
expectClean("Пароль: ****-1234.", "Пароль: ****-1234.");
expectClean("Пароль: ****−1*234.", "Пароль: ****−1*234.");
expectClean("Пароль: ****-1*234.", "Пароль: ****-1*234.");
expectClean("••4444", "••4444");
expectClean("••44444", `••44${NBSP}444`);
expectClean("**4444", "**4444");
expectClean("**44444", `**44${NBSP}444`);
expectClean("****4444", "****4444");
expectClean("карта****4444", "карта****4444");
expectClean("карта ****4444", "карта ****4444");
expectClean("карта••4444", "карта••4444");
expectClean("карта ••4444", "карта ••4444");
expectClean("карта**4444", "карта**4444");
expectClean("8841 4758 3476 9921", "8841 4758 3476 9921");
expectClean("8841475834769921", "8841475834769921");
expectClean("8841-4758-3476-9921", "8841-4758-3476-9921");
expectClean("1234 5678 9012 3456 7", "1234 5678 9012 3456 7");
expectClean("1234 5678 9012 3456 78", "1234 5678 9012 3456 78");
expectClean("1234 5678 9012 3456 789", "1234 5678 9012 3456 789");
expectClean("1234–5678–9012–3456", "1234–5678–9012–3456");
expectClean("1234—5678—9012—3456", "1234—5678—9012—3456");
expectClean("40914810810010073985", "40914810810010073985");
expectClean("4070 2810 0000 0012 3456", "4070 2810 0000 0012 3456");
expectClean("812345678901234 клиентов", `812${NBSP}345${NBSP}678${NBSP}901${NBSP}234${NBSP}клиентов`);
expectClean("+ 7", "+ 7");
expectClean("9777001020", `977${NBSP}700${NB_HYPHEN}10${NB_HYPHEN}20`);
expectClean("977 700 10 20", `977${NBSP}700${NB_HYPHEN}10${NB_HYPHEN}20`);
expectClean("977 700-10-20", `977${NBSP}700${NB_HYPHEN}10${NB_HYPHEN}20`);
expectClean("977-700-10-20", `977${NBSP}700${NB_HYPHEN}10${NB_HYPHEN}20`);
expectClean("+ 7 9777001020", `+7${NBSP}977${NBSP}700${NB_HYPHEN}10${NB_HYPHEN}20`);

expectClean("2026-05-14", "2026-05-14");
expectClean("10.04.2025", "10.04.2025");
expectClean("12,05,2025", "12.05.2025");
expectClean("1,01,2025", "1.01.2025");
expectClean("Дата: 29,02,2024.", "Дата: 29.02.2024.");
expectClean("Встреча (12,05,2025)", "Встреча (12.05.2025)");
expectClean("29,02,2025", "29,02,2025");
expectClean("31,04,2025", "31,04,2025");
expectClean("00,05,2025", "00,05,2025");
expectClean("12,13,2025", "12,13,2025");
expectClean("12,5,2025", "12,5,2025");
expectClean("12.05,2025", "12.05,2025");
expectClean("12,05.2025", "12,05.2025");
expectClean("1,05,2025,7", "1,05,2025,7");
expectClean("v12,05,2025", "v12,05,2025");
expectClean("12,05,2025.1", "12,05,2025.1");
expectClean("Значение 12,05", "Значение 12,05");
expectClean("v2.0.1", "v2.0.1");
expectClean("192.168.0.1", "192.168.0.1");
expectClean("1.1 Как использовать", `1.1${NBSP}Как использовать`);
expectClean("1.2 Что с этим делать", `1.2${NBSP}Что с${NBSP}этим делать`);
expectClean("Раздел 1.1", "Раздел 1.1");
expectClean("§ 2.2", `§${NBSP}2.2`);
expectClean("ст. 35.1", "ст. 35.1");
expectClean("п. 2.1", "п. 2.1");
expectClean("Глава 3.2", "Глава 3.2");
expectClean("подпункт 4.3", "подпункт 4.3");
expectClean("3,1 Как использовать", `3.1${NBSP}Как использовать`);
expectClean("Раздел 1,1", "Раздел 1.1");
expectClean("§ 2,2", `§${NBSP}2.2`);
expectClean("ст. 35,1", "ст. 35.1");
expectClean("п. 2,1", "п. 2.1");
expectClean("пункт 5,5 эмоции", `пункт 5.5${NBSP}эмоции`);
expectClean("Вес 4,5 кг", `Вес 4,5${NBSP}кг`);
expectClean("4,5 кг разговоров", `4,5${NBSP}кг разговоров`);
expectClean("Цена 5,5 ₽", `Цена 5,5${NBSP}₽`);
expectClean("контрольный пункт 5,5 км", `контрольный пункт 5,5${NBSP}км`);
expectClean("контрольный пункт 5.5 км", `контрольный пункт 5,5${NBSP}км`);
expectClean("пункт 5,5%", "пункт 5,5%");
expectClean("пункт 10,04 кг", `пункт 10,04${NBSP}кг`);
expectClean("пункт назначения стоит 5,5 ₽", `пункт назначения стоит 5,5${NBSP}₽`);
expectClean("Коэффициент 5,5", "Коэффициент 5,5");
const legalNumbering = cleanTypography("Это зафиксировано в ст. 35 п. 2.1 УК РФ");
assert(legalNumbering.includes("ст. 35"));
assert(legalNumbering.includes("п. 2.1"));
assert.strictEqual(legalNumbering.includes("2,1"), false);
const repairedLegalNumbering = cleanTypography("Это зафиксировано в ст. 35 п. 2,1 УК РФ");
assert(repairedLegalNumbering.includes("ст. 35"));
assert(repairedLegalNumbering.includes("п. 2.1"));
assert.strictEqual(repairedLegalNumbering.includes("2,1"), false);
expectClean("https://example.com/2/2", "https://example.com/2/2");
expectClean("mail@example.com", "mail@example.com");
expectClean("x1+2", "x1+2");
expectClean("var_1+2", "var_1+2");
expectClean("SALE-2026", "SALE-2026");
expectClean("PROMO-10-20", "PROMO-10-20");
expectClean("№ 123-45", `№${NBSP}123-45`);
expectClean("AB-123", "AB-123");
expectClean("Серия АА-123456", "Серия АА-123456");
expectClean("+7 (900) 123-45-67", `+7${NBSP}900${NBSP}123${NB_HYPHEN}45${NB_HYPHEN}67`);
expectClean("Встреча 15 завтра.", `Встреча 15${NBSP}завтра.`);
expectClean("По 2000 человек", `По${NBSP}2${NBSP}000${NBSP}человек`);
expectClean("В базе 10000 клиентов.", `В${NBSP}базе 10${NBSP}000${NBSP}клиентов.`);
expectClean("Продано 1234567 билетов", `Продано 1${NBSP}234${NBSP}567${NBSP}билетов`);
expectClean("812345678901234 клиентов", `812${NBSP}345${NBSP}678${NBSP}901${NBSP}234${NBSP}клиентов`);
expectClean("по 10000 человек", `по${NBSP}10${NBSP}000${NBSP}человек`);
expectClean("д. 10000 корпус", `д.${NBSP}10${NBSP}000 корпус`);
expectClean("г. 10000 жителей", `г.${NBSP}10${NBSP}000 жителей`);
expectClean("в д. 5 живёт", `в${NBSP}д.${NBSP}5 живёт`);
expectClean("№ 10000 заявок", `№${NBSP}10000 заявок`);
expectClean("§ 10000 пунктов", `§${NBSP}10000 пунктов`);
expectClean("Позвоните +7 (900) 123-45-67 завтра", `Позвоните +7${NBSP}900${NBSP}123${NB_HYPHEN}45${NB_HYPHEN}67 завтра`);
expectClean("30 сентября", `30${NBSP}сентября`);
expectClean("далеко ли холодно ли стало", `далеко${NBSP}ли холодно${NBSP}ли стало`);
expectClean("он же сказал бы", `он${NBSP}же сказал${NBSP}бы`);
expectClean("знал б ты, как хороши", `знал${NBSP}б ты, как хороши`);
expectClean("всё ж красиво", `всё${NBSP}ж красиво`);
expectClean("можно ль иначе", `можно${NBSP}ль иначе`);
expectClean("Это же не баг, а фича ли?", `Это${NBSP}же не${NBSP}баг, а${NBSP}фича${NBSP}ли?`);
expectClean("ли стало холодно", "ли стало холодно");
expectClean("ль стало понятно", "ль стало понятно");
expectClean("№ 12 345 изменился.", `№${NBSP}12 345 изменился.`);
expectClean("Номер заказа № 79001234567.", `Номер заказа №${NBSP}79001234567.`);
expectClean("§ 12 применяется.", `§${NBSP}12 применяется.`);
expectClean("№, это не номер.", `№, это не${NBSP}номер.`);
expectClean("Дом № 5 стоит рядом.", `Дом №${NBSP}5 стоит рядом.`);
expectClean("См. § 100 000.", `См. §${NBSP}100 000.`);
expectClean("© 2025 по 2026 год идёт тест.", `©${NBSP}2025 по${NBSP}2026 год идёт тест.`);
expectClean("©2025", `©${NBSP}2025`);
expectClean("Подписка 5000 ₽/мес. Следующий платёж завтра.", `Подписка 5${NBSP}000${NBSP}₽/мес. Следующий платёж завтра.`);
expectClean("Подписка 5000 ₽/мес.", `Подписка 5${NBSP}000${NBSP}₽/мес`);
expectClean("Вес 1.5 кг. Доставим завтра.", `Вес 1,5${NBSP}кг. Доставим завтра.`);
expectClean("Вес 1.5 кг.", `Вес 1,5${NBSP}кг`);
expectClean("Напряжение 220 В", `Напряжение 220${NBSP}В`);
expectClean("Напряжение 220В", `Напряжение 220${NBSP}В`);
expectClean("Напряжение 220 в сети", `Напряжение 220${NBSP}В сети`);
expectClean("Мощность 100 вт", `Мощность 100${NBSP}Вт`);
expectClean("Мощность 100ВТ", `Мощность 100${NBSP}Вт`);
expectClean("Мощность 2 квт", `Мощность 2${NBSP}кВт`);
expectClean("Мощность 2КВТ", `Мощность 2${NBSP}кВт`);
expectClean("Мощность 2.5 кВт", `Мощность 2,5${NBSP}кВт`);
expectClean("Разрешение 300 DPI", `Разрешение 300${NBSP}dpi`);
expectClean("Разрешение 300dpi", `Разрешение 300${NBSP}dpi`);
expectClean("Линиатура 150 LPI", `Линиатура 150${NBSP}lpi`);
expectClean("Линиатура 150lpi", `Линиатура 150${NBSP}lpi`);
expectClean("Напряжение 220 В работает", `Напряжение 220${NBSP}В работает`);
expectClean("Мощность 100 Вт. Устройство включено.", `Мощность 100${NBSP}Вт. Устройство включено.`);
expectClean("Мощность 100 Вт.", `Мощность 100${NBSP}Вт`);
expectClean("Код A300dpi", "Код A300dpi");
expectClean("Код 300dpiX", "Код 300dpiX");
expectClean("Энергия 2 кВтч", `Энергия 2${NBSP}кВтч`);
expectClean("Дата 10.04 В Москве", `Дата 10.04 В${NBSP}Москве`);
expectClean("Мощность 10.04 кВт", `Мощность 10,04${NBSP}кВт`);
expectClean("Длина 10.04 м. Это стандартный размер.", `Длина 10,04${NBSP}м. Это стандартный размер.`);
expectClean("Длина 10.04 м.", `Длина 10,04${NBSP}м`);
expectClean("Доход 100 млн. Компания растёт.", `Доход 100${NBSP}млн. Компания растёт.`);
expectClean("Выручка 5 млрд. Это прогноз.", `Выручка 5${NBSP}млрд. Это прогноз.`);
expectClean("Срок 6 мес. Потом продлим.", `Срок 6${NBSP}мес. Потом продлим.`);
expectClean("Подписка 5000 ₽/мес доступна всем.", `Подписка 5${NBSP}000${NBSP}₽/мес доступна всем.`);
expectClean("Доход 100 млн. рублей.", `Доход 100${NBSP}млн рублей.`);
expectClean("Выручка 5 млрд. рублей.", `Выручка 5${NBSP}млрд рублей.`);
expectClean("Размер 10 см. в ширину.", `Размер 10${NBSP}см в${NBSP}ширину.`);
expectClean("Вес 5 кг. товара.", `Вес 5${NBSP}кг товара.`);
expectClean("Объём 5 мл.", `Объём 5${NBSP}мл`);
expectClean("Время 10 с.", `Время 10${NBSP}с`);
expectClean("100 руб", `100${NBSP}руб.`);
expectClean("20 коп", `20${NBSP}коп.`);
expectClean("Стоимость 100 руб. Оплата завтра.", `Стоимость 100${NBSP}руб. Оплата завтра.`);
expectClean("Те", "Те");
expectClean("те?", "те?");
expectClean("т.е. пример", `т.${NBSP}е. пример`);
expectClean("т е пример", `т.${NBSP}е. пример`);
expectClean("Т. е. пример", `Т.${NBSP}е. пример`);
expectClean("Т е пример", `Т.${NBSP}е. пример`);
expectClean("ТК пример", `ТК${NBSP}пример`);
expectClean("Период: НВ", "Период: НВ");
expectClean("PS", `P.${NBSP}S.`);
expectClean("P.S. Проверь ещё раз.", `P.${NBSP}S. Проверь ещё раз.`);
expectClean("P P S проверь ещё раз.", `P.${NBSP}P.${NBSP}S. проверь ещё раз.`);
expectClean("Список, в т ч важные пункты", `Список, в${NBSP}т.${NBSP}ч. важные пункты`);
expectClean("Период: н. в.", `Период: н.${NBSP}в.`);
expectClean("ж/д билеты", `ж/д${NBSP}билеты`);
expectClean("ж/д. билеты", `ж/д${NBSP}билеты`);
expectClean("ж./д. билеты", `ж/д${NBSP}билеты`);
expectClean("Иванов А./Петров Б.", `Иванов А./Петров${NBSP}Б.`);
expectClean("Кешбэк за покупку ж/д билетов, оплату проезда в метро", `Кешбэк за${NBSP}покупку${NBSP}ж/д${NBSP}билетов, оплату проезда в${NBSP}метро`);
expectClean("д/к фильм", `д/к${NBSP}фильм`);
expectClean("п/п платеж", `п/п${NBSP}платеж`);
expectClean("а/д дорога", `а/д${NBSP}дорога`);
expectClean("руб/мес тариф", "руб/мес тариф");
expectClean("кв/м площадь", `кв/м${NBSP}площадь`);
expectClean("руб/кв. м", `руб/кв.${NBSP}м`);
expectClean("руб./кв. м", `руб/кв.${NBSP}м`);
expectClean("100 руб/кв. м", `100${NBSP}руб/кв.${NBSP}м`);
expectClean("см ниже, гл 2, илл 3, ст 12, п 4", "см. ниже, гл. 2, илл. 3, ст. 12, п. 4");
expectClean("обл Московская, кр 1, пос Северный, пер Лесной, пр Мира", "обл. Московская, кр. 1, пос. Северный, пер. Лесной, пр. Мира");
expectClean("просп Ленина, пл Победы, бул Солнечный, наб Реки, ш Энтузиастов, туп Южный", "просп. Ленина, пл. Победы, бул. Солнечный, наб. Реки, ш. Энтузиастов, туп. Южный");
expectClean("оф 12, комн 3, под 2, мкр Северный, уч 4", "оф. 12, комн. 3, под. 2, мкр. Северный, уч. 4");
expectClean("вл 5, влад 7, корп 2, эт 10, пгт Новый", "вл. 5, влад. 7, корп. 2, эт. 10, пгт. Новый");
expectClean("под столом", "под столом");
expectClean("Адрес: пр-т Мира, б-р Цветной.", `Адрес: пр${NB_HYPHEN}т Мира, б${NB_HYPHEN}р Цветной.`);
expectClean("Адрес: пр-т. Мира, б-р. Цветной.", `Адрес: пр${NB_HYPHEN}т Мира, б${NB_HYPHEN}р Цветной.`);
expectClean("Длина 5 см", `Длина 5${NBSP}см`);
expectClean("д. 5, стр. 10, кв. 7", `д.${NBSP}5, стр.${NBSP}10, кв.${NBSP}7`);
expectClean("Дом д 5, страница стр 10, квартира кв 7", `Дом д.${NBSP}5, страница стр.${NBSP}10, квартира кв.${NBSP}7`);
expectClean("Площадь 20 кв м", `Площадь 20${NBSP}кв.${NBSP}м`);
expectClean("Выручка 10 млн", `Выручка 10${NBSP}млн`);
expectClean("Доход 100 млн и 5 млрд.", `Доход 100${NBSP}млн и${NBSP}5${NBSP}млрд`);
expectClean("Выручка 10 млн.\nНужно увеличить на 5%", `Выручка 10${NBSP}млн\nНужно увеличить на${NBSP}5%`);
expectClean("Выручка 10 млн. Нужно увеличить на 5%", `Выручка 10${NBSP}млн. Нужно увеличить на${NBSP}5%`);
expectDevelopmentIdempotent(`Цена 2${NBSP}000,35${NBSP}₽.`, "Цена 2*000,35*₽.");
expectDevelopmentIdempotent("В базе 10000 клиентов.", "В*базе 10*000*клиентов.");
expectDevelopmentIdempotent("далеко ли холодно ли стало", "далеко*ли холодно*ли стало");
expectDevelopmentIdempotent("знал б ты, всё ж можно ль иначе", "знал*б ты, всё*ж можно*ль иначе");
expectDevelopmentIdempotent("Это же не баг, а фича ли?", "Это*же не*баг, а*фича*ли?");
expectDevelopmentIdempotent("Доход 100 млн и 5 млрд.", "Доход 100*млн и*5*млрд");
expectDevelopmentIdempotent("1.1 Как использовать", "1.1*Как использовать");
expectDevelopmentIdempotent("Раздел 1.1", "Раздел 1.1");
expectDevelopmentIdempotent("§ 2.2", "§*2.2");
expectDevelopmentIdempotent("ст. 35.1", "ст. 35.1");
expectDevelopmentIdempotent("п. 2.1", "п. 2.1");
expectDevelopmentIdempotent("3,1 Как использовать", "3.1*Как использовать");
expectDevelopmentIdempotent("Раздел 1,1", "Раздел 1.1");
expectDevelopmentIdempotent("§ 2,2", "§*2.2");
expectDevelopmentIdempotent("ст. 35,1", "ст. 35.1");
expectDevelopmentIdempotent("п. 2,1", "п. 2.1");
expectDevelopmentIdempotent("пункт 5,5 эмоции", "пункт 5.5*эмоции");
expectDevelopmentIdempotent("контрольный пункт 5,5 км", "контрольный пункт 5,5*км");
expectDevelopmentIdempotent("контрольный пункт 5.5 км", "контрольный пункт 5,5*км");
expectDevelopmentIdempotent("4,5 кг разговоров", "4,5*кг разговоров");
expectDevelopmentIdempotent("Вес 1.5 кг.", "Вес 1,5*кг");
expectDevelopmentIdempotent("Формула: 2 * 2 = 4.", `Формула: 2*${MULTIPLY}*2*=*4.`);
expectDevelopmentIdempotent("Формула: 2*2=4.", `Формула: 2*${MULTIPLY}*2*=*4.`);
expectDevelopmentIdempotent("Формула 2*2=4", `Формула 2*${MULTIPLY}*2*=*4`);
expectDevelopmentIdempotent("2*2,", `2*${MULTIPLY}*2,`);
expectDevelopmentStableWithoutMarkers("Цена 1*000*₽.");
expectDevelopmentStableWithoutMarkers(`Позвоните: +7*900*123${NB_HYPHEN}45${NB_HYPHEN}67.`);
expectDevelopmentStableWithoutMarkers(`Или так: 8*900*123${NB_HYPHEN}45${NB_HYPHEN}67.`);
expectDevelopmentStableWithoutMarkers("Цена не*телефон: 79*001*234*567*₽.");
expectDevelopmentStableWithoutMarkers("Длинное число: 812*345*678*901*234.");
expectDevelopmentStableWithoutMarkers("№*12 345 изменился.", "№*12 345 изменился.");
expectDevelopmentIdempotent("Номер заказа № 79001234567.", "Номер заказа №*79001234567.");
expectDevelopmentStableWithoutMarkers("Номер заказа №*79001234567.", "Номер заказа №*79001234567.");
expectDevelopmentStableWithoutMarkers("§*12 применяется.", "§*12 применяется.");
expectDevelopmentStableWithoutMarkers("Дом №*5 стоит рядом.", "Дом №*5 стоит рядом.");
expectDevelopmentStableWithoutMarkers("©*2025 по*2026 год идёт тест.", "©*2025 по*2026 год идёт тест.");
expectDevelopmentStableWithoutMarkers("©*2*025 по*2026 год идёт тест.", "©*2025 по*2026 год идёт тест.");
expectDevelopmentStableWithoutMarkers(`Номер заказа №*+7*900*123${NB_HYPHEN}45${NB_HYPHEN}67.`, `Номер заказа №*+7*900*123${NB_HYPHEN}45${NB_HYPHEN}67.`);
expectDevelopmentStableWithoutMarkers("Номер заказа №*+79001234567.", "Номер заказа №*+79001234567.");

const development = cleanTypographyWithMetadata("2 * 2 = 4", developmentOptions);
const developmentToBeauty = cleanTypographyWithMetadata(development.text, beautyOptions, development.developmentMarkerIndexes);
const textDevelopment = cleanTypographyWithMetadata("В базе 10000 клиентов.", developmentOptions);
const textDevelopmentToBeauty = cleanTypographyWithMetadata(textDevelopment.text, beautyOptions, textDevelopment.developmentMarkerIndexes);
const developmentWithoutMarkers = cleanTypographyWithMetadata("Формула: 2*×*2*=*4.", developmentOptions);
const existingAsteriskRecolored = cleanTypographyWithMetadata("в*дом", developmentRecolorOptions);
const existingAsteriskRecoloredToBeauty = cleanTypographyWithMetadata(existingAsteriskRecolored.text, beautyOptions, existingAsteriskRecolored.developmentMarkerIndexes);
const existingAsteriskWordSpace = cleanTypographyWithMetadata("слово*слово", developmentRecolorOptions);
const existingAsteriskDefault = cleanTypographyWithMetadata("в*дом", developmentOptions);
const existingAsteriskRegularSpace = cleanTypographyWithMetadata("Что*нужно", developmentRecolorOptions);
const existingAsteriskMixedSpaces = cleanTypographyWithMetadata("или*их*комбинации", developmentRecolorOptions);
const existingAsteriskNumberAndShortWord = cleanTypographyWithMetadata("7*дней с*момента", developmentRecolorOptions);
const existingAsteriskDashSpaces = cleanTypographyWithMetadata("Москва*—*столица России. Чистовик*—*плагин.", developmentRecolorOptions);
const existingAsteriskParentheses = cleanTypographyWithMetadata("Есть блок (новая*настройка), который нужно проверить.", developmentRecolorOptions);
const existingAsteriskLongWords = cleanTypographyWithMetadata("проверить*макет, Нужно*проверить, поправить*тексты, отправить*результат", developmentRecolorOptions);
const saleCampaignCode = cleanTypographyWithMetadata("Кампания SALE*2026.", developmentRecolorOptions);
const saleCampaignCodeWithMarker = cleanTypographyWithMetadata("Кампания SALE*2*026.", developmentRecolorOptions, [15]);
const unsafeAsterisks = cleanTypographyWithMetadata("**важно**, Тариф*, A*B", developmentRecolorOptions);
const maskedCardDefault = cleanTypographyWithMetadata("карта****4444", developmentOptions);
const maskedCardRecolor = cleanTypographyWithMetadata("карта****4444", developmentRecolorOptions);
const maskedCardWithSpaceDefault = cleanTypographyWithMetadata("карта ****4444", developmentOptions);
const maskedCardWithSpaceRecolor = cleanTypographyWithMetadata("карта ****4444", developmentRecolorOptions);
const maskedCardBulletsDefault = cleanTypographyWithMetadata("карта••4444", developmentOptions);
const maskedCardBulletsRecolor = cleanTypographyWithMetadata("карта••4444", developmentRecolorOptions);

assert.strictEqual(development.text, "2*\u00D7*2*=*4");
assert.deepStrictEqual(Array.from(development.developmentMarkerIndexes), [1, 3, 5, 7]);
assert.strictEqual(developmentToBeauty.text, `2${NBSP}${MULTIPLY}${NBSP}2${NBSP}=${NBSP}4`);
assert.strictEqual(textDevelopmentToBeauty.text, `В${NBSP}базе 10${NBSP}000${NBSP}клиентов.`);
assert.strictEqual(developmentWithoutMarkers.text, "Формула: 2*×*2*=*4.");
assert.strictEqual(existingAsteriskRecolored.text, "в*дом");
assert.deepStrictEqual(Array.from(existingAsteriskRecolored.developmentMarkerIndexes), [1]);
assert.strictEqual(existingAsteriskRecoloredToBeauty.text, `в${NBSP}дом`);
assert.strictEqual(existingAsteriskWordSpace.text, "слово слово");
assert.deepStrictEqual(Array.from(existingAsteriskWordSpace.developmentMarkerIndexes), []);
assert.strictEqual(existingAsteriskDefault.text, "в*дом");
assert.deepStrictEqual(Array.from(existingAsteriskDefault.developmentMarkerIndexes), []);
assert.strictEqual(existingAsteriskRegularSpace.text, "Что нужно");
assert.deepStrictEqual(Array.from(existingAsteriskRegularSpace.developmentMarkerIndexes), []);
assert.strictEqual(existingAsteriskMixedSpaces.text, "или их*комбинации");
assert.deepStrictEqual(Array.from(existingAsteriskMixedSpaces.developmentMarkerIndexes), [6]);
assert.strictEqual(existingAsteriskNumberAndShortWord.text, "7*дней с*момента");
assert.deepStrictEqual(Array.from(existingAsteriskNumberAndShortWord.developmentMarkerIndexes), [1, 8]);
assert.strictEqual(existingAsteriskDashSpaces.text, "Москва*— столица России. Чистовик*— плагин.");
assert.deepStrictEqual(Array.from(existingAsteriskDashSpaces.developmentMarkerIndexes), [6, 33]);
assert.strictEqual(existingAsteriskParentheses.text, "Есть блок (новая настройка), который нужно проверить.");
assert.deepStrictEqual(Array.from(existingAsteriskParentheses.developmentMarkerIndexes), []);
assert.strictEqual(existingAsteriskLongWords.text, "проверить макет, Нужно проверить, поправить тексты, отправить результат");
assert.deepStrictEqual(Array.from(existingAsteriskLongWords.developmentMarkerIndexes), []);
assert.strictEqual(saleCampaignCode.text, "Кампания SALE*2026.");
assert.deepStrictEqual(Array.from(saleCampaignCode.developmentMarkerIndexes), []);
assert.strictEqual(saleCampaignCodeWithMarker.text, "Кампания SALE*2026.");
assert.deepStrictEqual(Array.from(saleCampaignCodeWithMarker.developmentMarkerIndexes), []);
assert.strictEqual(unsafeAsterisks.text, "**важно**, Тариф*, A*B");
assert.deepStrictEqual(Array.from(unsafeAsterisks.developmentMarkerIndexes), []);
assert.strictEqual(maskedCardDefault.text, "карта****4444");
assert.deepStrictEqual(Array.from(maskedCardDefault.developmentMarkerIndexes), []);
assert.strictEqual(maskedCardRecolor.text, "карта****4444");
assert.deepStrictEqual(Array.from(maskedCardRecolor.developmentMarkerIndexes), []);
assert.strictEqual(maskedCardWithSpaceDefault.text, "карта ****4444");
assert.deepStrictEqual(Array.from(maskedCardWithSpaceDefault.developmentMarkerIndexes), []);
assert.strictEqual(maskedCardWithSpaceRecolor.text, "карта ****4444");
assert.deepStrictEqual(Array.from(maskedCardWithSpaceRecolor.developmentMarkerIndexes), []);
assert.strictEqual(maskedCardBulletsDefault.text, "карта••4444");
assert.deepStrictEqual(Array.from(maskedCardBulletsDefault.developmentMarkerIndexes), []);
assert.strictEqual(maskedCardBulletsRecolor.text, "карта••4444");
assert.deepStrictEqual(Array.from(maskedCardBulletsRecolor.developmentMarkerIndexes), []);

async function runStyleRestorationTests() {
  const calls = [];
  const textNode = {
    characters: "Пункт списка",
    getRangeFillStyleId: () => "fill-style-id",
    getRangeTextStyleId: () => "text-style-id",
    setRangeFills: (start, end, value) => calls.push(["fills", start, end, value]),
    setRangeFillStyleIdAsync: async (start, end, value) => calls.push(["fillStyleId", start, end, value]),
    setRangeFontName: (start, end, value) => calls.push(["fontName", start, end, value]),
    setRangeFontSize: (start, end, value) => calls.push(["fontSize", start, end, value]),
    setRangeIndentation: (start, end, value) => calls.push(["indentation", start, end, value]),
    setRangeLetterSpacing: (start, end, value) => calls.push(["letterSpacing", start, end, value]),
    setRangeLineHeight: (start, end, value) => calls.push(["lineHeight", start, end, value]),
    setRangeListOptions: (start, end, value) => calls.push(["listOptions", start, end, value]),
    setRangeListSpacing: (start, end, value) => calls.push(["listSpacing", start, end, value]),
    setRangeParagraphIndent: (start, end, value) => calls.push(["paragraphIndent", start, end, value]),
    setRangeParagraphSpacing: (start, end, value) => calls.push(["paragraphSpacing", start, end, value]),
    setRangeBoundVariable: (start, end, field, value) => calls.push(["boundVariable", start, end, field, value]),
    setRangeHyperlink: (start, end, value) => calls.push(["hyperlink", start, end, value]),
    setRangeTextCase: (start, end, value) => calls.push(["textCase", start, end, value]),
    setRangeTextDecoration: (start, end, value) => calls.push(["textDecoration", start, end, value]),
    setRangeTextDecorationColor: (start, end, value) => calls.push(["textDecorationColor", start, end, value]),
    setRangeTextDecorationOffset: (start, end, value) => calls.push(["textDecorationOffset", start, end, value]),
    setRangeTextDecorationSkipInk: (start, end, value) => calls.push(["textDecorationSkipInk", start, end, value]),
    setRangeTextDecorationStyle: (start, end, value) => calls.push(["textDecorationStyle", start, end, value]),
    setRangeTextDecorationThickness: (start, end, value) => calls.push(["textDecorationThickness", start, end, value]),
    setRangeTextStyleIdAsync: async (start, end, value) => calls.push(["textStyleId", start, end, value]),
  };
  const listStyle = {
    boundVariables: {
      fontSize: { id: "font-size-variable-id", type: "VARIABLE_ALIAS" },
    },
    characters: "Пункт списка",
    end: 12,
    fillStyleId: "fill-style-id",
    fills: [],
    fontName: { family: "Inter", style: "Regular" },
    fontSize: 16,
    hyperlink: { type: "URL", value: "https://example.com" },
    indentation: 2,
    letterSpacing: { unit: "PERCENT", value: 0 },
    lineHeight: { unit: "AUTO" },
    listOptions: { type: "ORDERED" },
    listSpacing: 8,
    paragraphIndent: 4,
    paragraphSpacing: 12,
    start: 0,
    textCase: "ORIGINAL",
    textDecoration: "UNDERLINE",
    textDecorationColor: { color: { b: 0, g: 0, r: 0 }, type: "SOLID" },
    textDecorationOffset: { unit: "PIXELS", value: 1 },
    textDecorationSkipInk: true,
    textDecorationStyle: "SOLID",
    textDecorationThickness: { unit: "PIXELS", value: 2 },
    textStyleId: "text-style-id",
    textStyleOverrides: [{ type: "TEXT_DECORATION" }, { type: "HYPERLINK" }],
  };

  await restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [listStyle]);

  assert.deepStrictEqual(calls.find(([name]) => name === "listOptions"), ["listOptions", 0, 12, { type: "ORDERED" }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "listSpacing"), ["listSpacing", 0, 12, 8]);
  assert.deepStrictEqual(calls.find(([name]) => name === "indentation"), ["indentation", 0, 12, 2]);
  assert.deepStrictEqual(calls.find(([name]) => name === "paragraphIndent"), ["paragraphIndent", 0, 12, 4]);
  assert.deepStrictEqual(calls.find(([name]) => name === "paragraphSpacing"), ["paragraphSpacing", 0, 12, 12]);
  assert.deepStrictEqual(calls.find(([name]) => name === "fillStyleId"), ["fillStyleId", 0, 12, "fill-style-id"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textStyleId"), ["textStyleId", 0, 12, "text-style-id"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecoration"), ["textDecoration", 0, 12, "UNDERLINE"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecorationStyle"), ["textDecorationStyle", 0, 12, "SOLID"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecorationOffset"), ["textDecorationOffset", 0, 12, { unit: "PIXELS", value: 1 }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecorationThickness"), ["textDecorationThickness", 0, 12, { unit: "PIXELS", value: 2 }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecorationColor"), ["textDecorationColor", 0, 12, { color: { b: 0, g: 0, r: 0 }, type: "SOLID" }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecorationSkipInk"), ["textDecorationSkipInk", 0, 12, true]);
  assert.deepStrictEqual(calls.find(([name]) => name === "hyperlink"), ["hyperlink", 0, 12, { type: "URL", value: "https://example.com" }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "boundVariable"), ["boundVariable", 0, 12, "fontSize", { id: "font-size-variable-id" }]);
  assert(calls.findIndex(([name]) => name === "boundVariable") > calls.findIndex(([name]) => name === "textStyleId"));
  assert.strictEqual(calls.find(([name]) => name === "fontName"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "fills"), undefined);
  assert(calls.findIndex(([name]) => name === "fillStyleId") > calls.findIndex(([name]) => name === "textStyleId"));
  assert(calls.findIndex(([name]) => name === "textDecoration") > calls.findIndex(([name]) => name === "textStyleId"));
  assert(calls.findIndex(([name]) => name === "hyperlink") > calls.findIndex(([name]) => name === "textStyleId"));

  calls.length = 0;

  await restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [listStyle], true);

  assert.strictEqual(calls.find(([name]) => name === "textStyleId"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "fillStyleId"), undefined);

  calls.length = 0;

  textNode.getRangeFillStyleId = () => "";
  textNode.getRangeTextStyleId = () => "";

  await restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [listStyle], true);

  assert.deepStrictEqual(calls.find(([name]) => name === "textStyleId"), ["textStyleId", 0, 12, "text-style-id"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "fillStyleId"), ["fillStyleId", 0, 12, "fill-style-id"]);

  calls.length = 0;

  await restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [
    {
      ...listStyle,
      hyperlink: null,
      textDecoration: "NONE",
      textDecorationColor: null,
      textDecorationOffset: null,
      textDecorationSkipInk: null,
      textDecorationStyle: null,
      textDecorationThickness: null,
      textStyleOverrides: [],
    },
  ]);

  assert.deepStrictEqual(calls.find(([name]) => name === "textStyleId"), ["textStyleId", 0, 12, "text-style-id"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "fillStyleId"), ["fillStyleId", 0, 12, "fill-style-id"]);
  assert.strictEqual(calls.find(([name]) => name === "fontName"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "fills"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "textDecoration"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "hyperlink"), undefined);
  assert(calls.findIndex(([name]) => name === "fillStyleId") > calls.findIndex(([name]) => name === "textStyleId"));

  calls.length = 0;

  await restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [
    {
      ...listStyle,
      hyperlink: null,
      textStyleOverrides: [],
    },
  ]);

  assert.deepStrictEqual(calls.find(([name]) => name === "textStyleId"), ["textStyleId", 0, 12, "text-style-id"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecoration"), ["textDecoration", 0, 12, "UNDERLINE"]);
  assert.strictEqual(calls.find(([name]) => name === "hyperlink"), undefined);

  calls.length = 0;

  await restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [
    {
      ...listStyle,
      fillStyleId: "",
      textStyleId: "",
      textStyleOverrides: [],
    },
  ]);

  assert.deepStrictEqual(calls.find(([name]) => name === "fontName"), ["fontName", 0, 12, { family: "Inter", style: "Regular" }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "fills"), ["fills", 0, 12, []]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecoration"), ["textDecoration", 0, 12, "UNDERLINE"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "boundVariable"), ["boundVariable", 0, 12, "fontSize", { id: "font-size-variable-id" }]);
  assert.strictEqual(calls.find(([name]) => name === "textStyleId"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "fillStyleId"), undefined);

  calls.length = 0;

  await restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [
    {
      ...listStyle,
      fontName: { family: "Inter", style: "Bold Italic" },
      hyperlink: null,
      textDecoration: "NONE",
      textDecorationColor: null,
      textDecorationOffset: null,
      textDecorationSkipInk: null,
      textDecorationStyle: null,
      textDecorationThickness: null,
      textStyleOverrides: [{ type: "SEMANTIC_WEIGHT" }, { type: "SEMANTIC_ITALIC" }],
    },
  ]);

  assert.deepStrictEqual(calls.find(([name]) => name === "textStyleId"), ["textStyleId", 0, 12, "text-style-id"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "fontName"), ["fontName", 0, 12, { family: "Inter", style: "Bold Italic" }]);
  assert(calls.findIndex(([name]) => name === "fontName") > calls.findIndex(([name]) => name === "textStyleId"));

  calls.length = 0;
  let variableLookupAttempts = 0;
  context.figma.variables.getVariableByIdAsync = async (id) => {
    variableLookupAttempts += 1;
    return { id };
  };
  const detachedVariableStyle = {
    ...listStyle,
    fillStyleId: "",
    hyperlink: null,
    textDecoration: "NONE",
    textDecorationColor: null,
    textDecorationOffset: null,
    textDecorationSkipInk: null,
    textDecorationStyle: null,
    textDecorationThickness: null,
    textStyleId: "",
    textStyleOverrides: [],
  };

  await restoreTextStyles(textNode, [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1], [
    detachedVariableStyle,
    {
      ...detachedVariableStyle,
      characters: "списка",
      end: 12,
      start: 6,
    },
  ]);

  assert.strictEqual(variableLookupAttempts, 1);
  context.figma.variables.getVariableByIdAsync = async (id) => ({ id });
}

async function runWholeTextStyleRestorationTests() {
  const wholeStyle = {
    boundVariables: undefined,
    characters: "Заголовок",
    end: 9,
    fillStyleId: "",
    fills: [],
    fontName: { family: "Inter", style: "Bold" },
    fontSize: 32,
    hyperlink: null,
    indentation: 0,
    letterSpacing: { unit: "PERCENT", value: 0 },
    lineHeight: { unit: "PIXELS", value: 36 },
    listOptions: { type: "NONE" },
    listSpacing: 0,
    paragraphIndent: 0,
    paragraphSpacing: 0,
    start: 0,
    textCase: "ORIGINAL",
    textDecoration: "NONE",
    textDecorationColor: null,
    textDecorationOffset: null,
    textDecorationSkipInk: null,
    textDecorationStyle: null,
    textDecorationThickness: null,
    textStyleId: "heading-style-id",
    textStyleOverrides: [],
  };

  assert.strictEqual(getWholeTextStyle([wholeStyle], "Заголовок"), wholeStyle);
  assert.strictEqual(getWholeTextStyle([{ ...wholeStyle, textStyleOverrides: [{ type: "TEXT_DECORATION" }] }], "Заголовок"), null);
  assert.strictEqual(getWholeTextStyle([{ ...wholeStyle, end: 4 }], "Заголовок"), null);
  assert.strictEqual(getWholeTextStyle([{ ...wholeStyle, listOptions: { type: "ORDERED" } }], "Заголовок"), null);
  assert.strictEqual(getWholeTextStyle([{ ...wholeStyle, listSpacing: 8 }], "Заголовок"), null);
  assert.strictEqual(getWholeTextStyle([{ ...wholeStyle, indentation: 2 }], "Заголовок"), null);
  assert.strictEqual(getWholeTextStyle([{ ...wholeStyle, paragraphIndent: 4 }], "Заголовок"), null);
  assert.strictEqual(getWholeTextStyle([{ ...wholeStyle, paragraphSpacing: 12 }], "Заголовок"), null);
  assert.strictEqual(
    getWholeTextStyle(
      [
        {
          ...wholeStyle,
          boundVariables: {
            fontSize: { id: "font-size-variable-id", type: "VARIABLE_ALIAS" },
          },
        },
      ],
      "Заголовок"
    ),
    null
  );

  const wholeStylePlan = createStyleRestorationPlan("Заголовок", "Заголовок…", [wholeStyle]);

  assert.strictEqual(wholeStylePlan.wholeTextStyle, wholeStyle);
  assert.deepStrictEqual(Array.from(wholeStylePlan.styleMap), []);
  assert.strictEqual(wholeStylePlan.verifyUniformLinkedStyle, true);

  const listStylePlan = createStyleRestorationPlan("Заголовок", "Заголовок…", [
    {
      ...wholeStyle,
      listOptions: { type: "ORDERED" },
    },
  ]);

  assert.strictEqual(listStylePlan.wholeTextStyle, null);
  assert.strictEqual(listStylePlan.styleMap.length, "Заголовок…".length);
  assert(listStylePlan.styleMap.every((styleIndex) => styleIndex === 0));
  assert.strictEqual(listStylePlan.verifyUniformLinkedStyle, true);

  const mixedStylePlan = createStyleRestorationPlan("Заголовок", "Заголовок…", [
    {
      ...wholeStyle,
      characters: "Заг",
      end: 3,
    },
    {
      ...wholeStyle,
      characters: "оловок",
      end: 9,
      start: 3,
    },
  ]);

  assert.strictEqual(mixedStylePlan.verifyUniformLinkedStyle, false);

  const calls = [];
  const textNode = {
    characters: "Заголовок",
    getRangeFillStyleId: () => "",
    getRangeTextStyleId: () => "heading-style-id",
    id: "node-id",
    setRangeTextDecoration: (start, end, value) => calls.push(["textDecoration", start, end, value]),
    setFillStyleIdAsync: async (value) => calls.push(["nodeFillStyleId", value]),
    setTextStyleIdAsync: async (value) => calls.push(["nodeTextStyleId", value]),
  };

  await restoreWholeTextStyle(textNode, wholeStyle);

  assert.deepStrictEqual(calls, [["nodeTextStyleId", "heading-style-id"]]);

  calls.length = 0;

  await restoreWholeTextStyle(textNode, wholeStyle, true);

  assert.deepStrictEqual(calls, []);

  calls.length = 0;

  const linkedFillStyle = {
    ...wholeStyle,
    fillStyleId: "heading-fill-style-id",
  };
  textNode.getRangeFillStyleId = () => "heading-fill-style-id";

  await restoreWholeTextStyle(textNode, linkedFillStyle, true);

  assert.deepStrictEqual(calls, []);

  calls.length = 0;

  textNode.getRangeFillStyleId = () => "";
  textNode.getRangeTextStyleId = () => "";

  await restoreWholeTextStyle(textNode, linkedFillStyle, true);

  assert.deepStrictEqual(calls, [
    ["nodeTextStyleId", "heading-style-id"],
    ["nodeFillStyleId", "heading-fill-style-id"],
  ]);

  calls.length = 0;

  await restoreWholeTextStyle(textNode, {
    ...wholeStyle,
    textDecoration: "UNDERLINE",
  });

  assert.deepStrictEqual(calls, [
    ["nodeTextStyleId", "heading-style-id"],
    ["textDecoration", 0, 9, "UNDERLINE"],
  ]);
}

function runRepeatedTextStyleMappingTests() {
  const oldText = "тест тест";
  const newText = `тест${NBSP}— тест`;
  const styles = [
    { end: 4, start: 0 },
    { end: 9, start: 5 },
  ];
  const styleMap = buildStyleMap(oldText, newText, styles);

  assert.deepStrictEqual(Array.from(styleMap.slice(0, 4)), [0, 0, 0, 0]);
  assert.deepStrictEqual(Array.from(styleMap.slice(-4)), [1, 1, 1, 1]);
}

function runLongTextStyleMappingTests() {
  const firstPart = "а".repeat(1600);
  const secondPart = "б".repeat(1600);
  const oldText = firstPart + secondPart;
  const newText = `${firstPart}—${secondPart}`;
  const styleMap = buildStyleMap(oldText, newText, [
    { end: firstPart.length, start: 0 },
    { end: oldText.length, start: firstPart.length },
  ]);

  assert.strictEqual(styleMap.length, newText.length);
  assert.strictEqual(styleMap[0], 0);
  assert.strictEqual(styleMap[firstPart.length - 1], 0);
  assert.strictEqual(styleMap[firstPart.length + 1], 1);
  assert.strictEqual(styleMap[styleMap.length - 1], 1);
}

function runHighPrecisionTimingTests() {
  let measuredDuration = null;

  testMonotonicNow = 10;
  measureDuration(
    (duration) => {
      measuredDuration = duration;
    },
    () => {
      testMonotonicNow = 10.375;
    }
  );

  assert.strictEqual(measuredDuration, 0.375);
  testMonotonicNow = 0;
}

async function runFontLoadingCacheTests() {
  const loadCalls = [];
  const fontLoadCache = new Map();
  const loadedFontKeys = new Set();
  const interRegular = { family: "Inter", style: "Regular" };
  const interBold = { family: "Inter", style: "Bold" };
  const regularNode = {
    characters: "Обычный текст",
    getRangeAllFontNames: () => [interRegular],
    id: "regular-node",
  };
  const mixedNode = {
    characters: "Текст с выделением",
    getRangeAllFontNames: () => [interRegular, interBold, interRegular],
    id: "mixed-node",
  };

  context.figma.loadFontAsync = async (font) => {
    loadCalls.push(`${font.family}\n${font.style}`);
  };

  await loadFontsForTextNode(regularNode, fontLoadCache, loadedFontKeys);
  await loadFontsForTextNode(regularNode, fontLoadCache, loadedFontKeys);
  await loadFontsForTextNode(mixedNode, fontLoadCache, loadedFontKeys);

  assert.deepStrictEqual(loadCalls, ["Inter\nRegular", "Inter\nBold"]);
  assert.strictEqual(fontLoadCache.size, 2);
  assert.strictEqual(loadedFontKeys.size, 2);

  let retryAttempts = 0;
  const retryCache = new Map();
  const retryFont = { family: "Retry Font", style: "Regular" };
  context.figma.loadFontAsync = async () => {
    retryAttempts += 1;

    if (retryAttempts === 1) {
      throw new Error("Temporary font load failure");
    }
  };

  await assert.rejects(getFontLoadPromise(retryFont, retryCache), /Temporary font load failure/);
  assert.strictEqual(retryCache.size, 1);

  await assert.rejects(getFontLoadPromise(retryFont, retryCache), /Temporary font load failure/);

  assert.strictEqual(retryAttempts, 1);
  assert.strictEqual(retryCache.size, 1);

  await getFontLoadPromise(retryFont, new Map());
  assert.strictEqual(retryAttempts, 2);
}

async function runWhitespaceOnlyTextNodeTests() {
  let fontLookupAttempts = 0;
  const whitespaceNodes = ["", " ", `\t${NBSP}\n`].map((characters, index) => ({
    characters,
    getRangeAllFontNames: () => {
      fontLookupAttempts += 1;
      throw new Error("Whitespace-only text should not load fonts");
    },
    id: `whitespace-node-${index}`,
  }));

  const result = await processTextNodes(whitespaceNodes, 0, 0, beautyOptions);

  assertTextProcessCounts(result, {
    changed: 0,
    failed: 0,
    processed: 0,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(result.failedStage, null);
  assert.strictEqual(result.failureDiagnostic, null);
  assert.strictEqual(result.analytics.charactersProcessedTotal, 0);
  assert.strictEqual(result.analytics.charactersChangedTotal, 0);
  assert.strictEqual(result.analytics.largestTextLayerCharacters, 0);
  assert.strictEqual(result.analytics.uniqueFontsCount, 0);
  assert.strictEqual(fontLookupAttempts, 0);
}

function runParentStateCacheTests() {
  let hiddenReads = 0;
  let lockedReads = 0;
  const root = { id: "root", parent: null };
  const sharedParent = {
    get locked() {
      lockedReads += 1;
      return false;
    },
    get visible() {
      hiddenReads += 1;
      return true;
    },
    id: "shared-parent",
    parent: root,
  };
  const nodes = ["first-child", "second-child"].map((id) => ({
    id,
    locked: false,
    parent: sharedParent,
    visible: true,
  }));
  const result = filterProcessableTextNodes(nodes, {
    processHidden: false,
    processLocked: false,
  });

  assert.strictEqual(result.nodes.length, 2);
  assert.strictEqual(result.skippedHidden, 0);
  assert.strictEqual(result.skippedLocked, 0);
  assert.strictEqual(lockedReads, 2);
  assert.strictEqual(hiddenReads, 2);
}

async function runUnchangedTextNodeTests() {
  const unchangedNode = createProcessTextNodeMock("unchanged-node", "Готовый текст", { height: 20, width: 100, x: 0, y: 0 });
  let fontLookupAttempts = 0;
  let layoutLookupAttempts = 0;
  let styleCaptureAttempts = 0;

  Object.defineProperty(unchangedNode, "absoluteBoundingBox", {
    get: () => {
      layoutLookupAttempts += 1;
      throw new Error("Ordinary text should not require layout coordinates");
    },
  });
  unchangedNode.getRangeAllFontNames = () => {
    fontLookupAttempts += 1;
    throw new Error("Unchanged text should not load fonts");
  };
  unchangedNode.getStyledTextSegments = () => {
    styleCaptureAttempts += 1;
    throw new Error("Unchanged text should not capture styles");
  };

  const result = await processTextNodes([unchangedNode], 0, 0, beautyOptions);

  assertTextProcessCounts(result, {
    changed: 0,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(fontLookupAttempts, 0);
  assert.strictEqual(layoutLookupAttempts, 0);
  assert.strictEqual(styleCaptureAttempts, 0);
  assert.strictEqual(result.analytics.uniqueFontsCount, 0);
  assert.strictEqual(result.analytics.styleSegmentsCount, 0);
}

function runDevelopmentMarkerPluginDataTests() {
  const values = new Map();
  const writes = [];
  const node = {
    characters: "Текст",
    getPluginData: (key) => values.get(key) || "",
    id: "plugin-data-node",
    setPluginData: (key, value) => {
      writes.push([key, value]);
      values.set(key, value);
    },
  };

  syncDevelopmentMarkerPluginData(node, beautyOptions, []);
  assert.deepStrictEqual(writes, []);

  values.set("developmentMarkerText", "Старый текст");
  values.set("developmentMarkerIndexes", "[1]");
  syncDevelopmentMarkerPluginData(node, beautyOptions, []);
  assert.deepStrictEqual(writes, [
    ["developmentMarkerText", ""],
    ["developmentMarkerIndexes", ""],
  ]);

  writes.length = 0;
  node.characters = "Т*екст";
  values.set("developmentMarkerText", "Т*екст");
  values.set("developmentMarkerIndexes", "[1]");
  syncDevelopmentMarkerPluginData(node, developmentOptions, [1]);
  assert.deepStrictEqual(writes, []);
}

function createProcessTextNodeMock(id, characters, absoluteBoundingBox, parentId = "shared-container") {
  const font = { family: "Inter", style: "Regular" };

  const node = {
    absoluteBoundingBox,
    characters,
    fillStyleId: "",
    getPluginData: () => "",
    getRangeAllFontNames: () => [font],
    getRangeFillStyleId: () => "",
    getRangeTextStyleId: () => "",
    getStyledTextSegments: () => [
      {
        boundVariables: undefined,
        characters: node.characters,
        end: node.characters.length,
        fillStyleId: "",
        fills: [],
        fontName: font,
        fontSize: 16,
        hyperlink: null,
        indentation: 0,
        letterSpacing: { unit: "PERCENT", value: 0 },
        lineHeight: { unit: "AUTO" },
        listOptions: { type: "NONE" },
        listSpacing: 0,
        paragraphIndent: 0,
        paragraphSpacing: 0,
        start: 0,
        textCase: "ORIGINAL",
        textDecoration: "NONE",
        textDecorationColor: null,
        textDecorationOffset: null,
        textDecorationSkipInk: null,
        textDecorationStyle: null,
        textDecorationThickness: null,
        textStyleId: "phone-style-id",
        textStyleOverrides: [],
      },
    ],
    id,
    parent: parentId === null ? null : { id: parentId },
    setPluginData: () => {},
    setTextStyleIdAsync: async () => {},
    textStyleId: "",
  };

  return node;
}

async function runPreservedLibraryStyleOptimizationTests() {
  const node = createProcessTextNodeMock("preserved-library-style-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalTextStyle = node.getStyledTextSegments()[0];
  let redundantStyleRestorations = 0;

  context.figma.loadFontAsync = async () => {};
  node.getRangeTextStyleId = () => "phone-style-id";
  node.getStyledTextSegments = () => [
    {
      ...originalTextStyle,
      characters: node.characters,
      end: node.characters.length,
    },
  ];
  node.setTextStyleIdAsync = async () => {
    redundantStyleRestorations += 1;
  };

  const result = await processTextNodes([node], 0, 0, beautyOptions);

  assertTextProcessCounts(result, {
    changed: 1,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(node.characters, "Текст…");
  assert.strictEqual(redundantStyleRestorations, 0);
  assert.strictEqual(result.requiresStyleWarning, false);

  const fillLinkedNode = createProcessTextNodeMock("preserved-library-fill-style-node", "Заливка...", { height: 20, width: 100, x: 0, y: 30 });
  const originalStyle = fillLinkedNode.getStyledTextSegments()[0];
  let redundantFillStyleRestorations = 0;

  fillLinkedNode.fillStyleId = "library-fill-style-id";
  fillLinkedNode.textStyleId = "";
  fillLinkedNode.getRangeFillStyleId = () => "library-fill-style-id";
  fillLinkedNode.getRangeTextStyleId = () => "";
  fillLinkedNode.getStyledTextSegments = () => [
    {
      ...originalStyle,
      characters: fillLinkedNode.characters,
      end: fillLinkedNode.characters.length,
      fillStyleId: "library-fill-style-id",
      textStyleId: "",
    },
  ];
  fillLinkedNode.setRangeFills = () => {};
  fillLinkedNode.setRangeFillStyleIdAsync = async () => {
    redundantFillStyleRestorations += 1;
  };
  fillLinkedNode.setRangeFontName = () => {};
  fillLinkedNode.setRangeFontSize = () => {};
  fillLinkedNode.setRangeHyperlink = () => {};
  fillLinkedNode.setRangeIndentation = () => {};
  fillLinkedNode.setRangeLetterSpacing = () => {};
  fillLinkedNode.setRangeLineHeight = () => {};
  fillLinkedNode.setRangeListOptions = () => {};
  fillLinkedNode.setRangeParagraphIndent = () => {};
  fillLinkedNode.setRangeParagraphSpacing = () => {};
  fillLinkedNode.setRangeTextCase = () => {};
  fillLinkedNode.setRangeTextDecoration = () => {};

  const fillLinkedResult = await processTextNodes([fillLinkedNode], 0, 0, beautyOptions);

  assertTextProcessCounts(fillLinkedResult, {
    changed: 1,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(fillLinkedNode.characters, "Заливка…");
  assert.strictEqual(redundantFillStyleRestorations, 0);
  assert.strictEqual(fillLinkedResult.requiresStyleWarning, false);
}

async function runLibraryStyleVerificationRollbackTests() {
  const node = createProcessTextNodeMock("library-style-verification-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalText = node.characters;
  const originalGetStyledTextSegments = node.getStyledTextSegments;
  const originalConsole = context.console;
  let rollbackStyleRestorations = 0;

  context.figma.loadFontAsync = async () => {};
  node.getRangeTextStyleId = () => "phone-style-id";
  node.getStyledTextSegments = () => {
    const originalStyle = originalGetStyledTextSegments()[0];

    return [
      {
        ...originalStyle,
        characters: node.characters,
        end: node.characters.length,
        fontSize: node.characters === originalText ? 16 : 18,
      },
    ];
  };
  node.setTextStyleIdAsync = async () => {
    rollbackStyleRestorations += 1;
  };
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([node], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
  }

  assertTextProcessCounts(result, {
    changed: 0,
    failed: 1,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(node.characters, originalText);
  assert.strictEqual(rollbackStyleRestorations, 1);
  assert.strictEqual(result.failedStage, "restore_styles");
  assert.strictEqual(result.failureDiagnostic.category, "restore_styles_failed");
  assert.strictEqual(result.requiresStyleWarning, false);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(result.analytics.ruleAnalytics.changedCodes)), []);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(result.analytics.ruleAnalytics.changePairs)), {});
}

async function runDetectedRollbackDamageTests() {
  const node = createProcessTextNodeMock("detected-rollback-damage-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalGetStyledTextSegments = node.getStyledTextSegments;
  const originalConsole = context.console;
  let styleCaptureCalls = 0;

  context.figma.loadFontAsync = async () => {};
  node.getRangeTextStyleId = () => "phone-style-id";
  node.getStyledTextSegments = () => {
    styleCaptureCalls += 1;
    const originalStyle = originalGetStyledTextSegments()[0];

    return [
      {
        ...originalStyle,
        fontSize: styleCaptureCalls === 1 ? 16 : 18,
      },
    ];
  };
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([node], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
  }

  assertTextProcessCounts(result, {
    changed: 0,
    failed: 1,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(result.failedStage, "rollback_styles");
  assert.strictEqual(result.failureDiagnostic.category, "rollback_failed");
  assert.strictEqual(result.requiresStyleWarning, true);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 1);
}

async function runStandalonePhoneCountryPrefixContextTests() {
  context.figma.loadFontAsync = async () => {};

  const prefix = createProcessTextNodeMock("phone-prefix", "+ 7", { height: 20, width: 20, x: 0, y: 0 });
  const tail = createProcessTextNodeMock("phone-tail", "977 700-10-20", { height: 20, width: 110, x: 26, y: 0 });
  const result = await processTextNodes([prefix, tail], 0, 0, beautyOptions);

  assertTextProcessCounts(result, {
    changed: 2,
    failed: 0,
    processed: 2,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(result.analytics.charactersProcessedTotal, 16);
  assert.strictEqual(result.analytics.charactersChangedTotal, 16);
  assert.strictEqual(result.analytics.largestTextLayerCharacters, 13);
  assert.strictEqual(result.analytics.uniqueFontsCount, 1);
  assert.strictEqual(result.analytics.styleSegmentsCount, 2);
  assert.strictEqual(result.analytics.ruleAnalytics.measuredCodesCount, 77);
  assert(result.analytics.ruleAnalytics.changedCodes.includes("phone_ru_format"));
  assert(result.analytics.ruleAnalytics.changedCodes.includes("phone_ru_separators"));
  assert.strictEqual(prefix.characters, "+7");
  assert.strictEqual(tail.characters, `977${NBSP}700${NB_HYPHEN}10${NB_HYPHEN}20`);

  const mathPrefix = createProcessTextNodeMock("math-prefix", "+ 7", { height: 20, width: 20, x: 0, y: 0 });
  const notPhoneTail = createProcessTextNodeMock("not-phone-tail", "100", { height: 20, width: 40, x: 26, y: 0 });
  const mathResult = await processTextNodes([mathPrefix, notPhoneTail], 0, 0, beautyOptions);

  assertTextProcessCounts(mathResult, {
    changed: 0,
    failed: 0,
    processed: 2,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(mathResult.analytics.charactersProcessedTotal, 6);
  assert.strictEqual(mathResult.analytics.charactersChangedTotal, 0);
  assert.strictEqual(mathResult.analytics.largestTextLayerCharacters, 3);
  assert.strictEqual(mathPrefix.characters, "+ 7");

  const unrelatedPrefix = createProcessTextNodeMock("unrelated-prefix", "+ 7", { height: 20, width: 20, x: 0, y: 0 }, "header");
  const unrelatedTail = createProcessTextNodeMock("unrelated-tail", "977 700-10-20", { height: 20, width: 110, x: 26, y: 0 }, "footer");
  const unrelatedResult = await processTextNodes([unrelatedPrefix, unrelatedTail], 0, 0, beautyOptions);

  assertTextProcessCounts(unrelatedResult, {
    changed: 1,
    failed: 0,
    processed: 2,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(unrelatedPrefix.characters, "+ 7");
  assert.strictEqual(unrelatedTail.characters, `977${NBSP}700${NB_HYPHEN}10${NB_HYPHEN}20`);
}

async function runRuleAnalyticsFinalTextTests() {
  context.figma.loadFontAsync = async () => {};

  const alreadyCleanText = `Чистовик работает с${NBSP}текстом и${NBSP}20${NBSP}кг`;
  const alreadyCleanNode = createProcessTextNodeMock("already-clean-analytics-node", alreadyCleanText, { height: 20, width: 240, x: 0, y: 0 });
  const alreadyCleanResult = await processTextNodes([alreadyCleanNode], 0, 0, beautyOptions);

  assertTextProcessCounts(alreadyCleanResult, {
    changed: 0,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(alreadyCleanNode.characters, alreadyCleanText);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(alreadyCleanResult.analytics.ruleAnalytics.changedCodes)), []);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(alreadyCleanResult.analytics.ruleAnalytics.changePairs)), {});
  assert.strictEqual(alreadyCleanResult.analytics.ruleAnalytics.metrics.nbsp_short_cyrillic_words.changedApplications, 0);
  assert.strictEqual(alreadyCleanResult.analytics.ruleAnalytics.metrics.nbsp_number_unit.changedApplications, 0);
  assert(alreadyCleanResult.analytics.ruleAnalytics.metrics.nbsp_short_cyrillic_words.calls > 0);

  const dirtyText = "Чистовик работает с текстом и 20 кг";
  const dirtyNode = createProcessTextNodeMock("dirty-analytics-node", dirtyText, { height: 20, width: 240, x: 0, y: 0 });
  const dirtyResult = await processTextNodes([dirtyNode], 0, 0, beautyOptions);

  assertTextProcessCounts(dirtyResult, {
    changed: 1,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert(dirtyResult.analytics.ruleAnalytics.changedCodes.includes("nbsp_short_cyrillic_words"));
  assert(dirtyResult.analytics.ruleAnalytics.changedCodes.includes("number_unit_currency_nbsp"));
}

async function runProcessingFailureAnalyticsTests() {
  const failingNode = createProcessTextNodeMock("failing-font-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalConsole = context.console;
  context.figma.loadFontAsync = async () => {
    throw new Error("Font is unavailable");
  };
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([failingNode], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
  }

  assertTextProcessCounts(result, {
    changed: 0,
    failed: 1,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(result.failedStage, "load_fonts");
  assert.strictEqual(result.failureDiagnostic.category, "font_unavailable");
  assert.strictEqual(result.failureDiagnostic.location, "src/code.ts:loadFontsForTextNode");
  assert.strictEqual(result.failureDiagnostic.operation, "load_text_layer_fonts");
  assert.strictEqual(result.analytics.charactersProcessedTotal, 8);
  assert.strictEqual(result.analytics.charactersChangedTotal, 0);
  assert.strictEqual(result.analytics.largestTextLayerCharacters, 8);
  assert.strictEqual(result.analytics.uniqueFontsCount, 0);
}

async function runStyleRestorationRollbackTests() {
  const node = createProcessTextNodeMock("style-rollback-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalText = node.characters;
  const originalConsole = context.console;
  let styleRestorationAttempts = 0;

  context.figma.loadFontAsync = async () => {};
  node.setTextStyleIdAsync = async () => {
    styleRestorationAttempts += 1;

    if (styleRestorationAttempts === 1) {
      throw new Error("Style restoration failed");
    }
  };
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([node], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
  }

  assertTextProcessCounts(result, {
    changed: 0,
    failed: 1,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(node.characters, originalText);
  assert.strictEqual(styleRestorationAttempts, 2);
  assert.strictEqual(result.failedStage, "restore_styles");
  assert.strictEqual(result.failureDiagnostic.category, "restore_styles_failed");
  assert.strictEqual(result.analytics.charactersChangedTotal, 0);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(result.analytics.styleSegmentsCount, 0);
}

async function runFailedStyleRollbackTests() {
  const failingNode = createProcessTextNodeMock("failed-style-rollback-node", "Первый...", { height: 20, width: 80, x: 0, y: 0 });
  const untouchedNode = createProcessTextNodeMock("untouched-after-rollback-node", "Второй...", { height: 20, width: 80, x: 0, y: 30 });
  const originalText = failingNode.characters;
  const originalConsole = context.console;

  context.figma.loadFontAsync = async () => {};
  failingNode.setTextStyleIdAsync = async () => {
    throw new Error("Persistent style restoration failure");
  };
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([failingNode, untouchedNode], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
  }

  assertTextProcessCounts(result, {
    changed: 0,
    failed: 1,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(failingNode.characters, originalText);
  assert.strictEqual(untouchedNode.characters, "Второй...");
  assert.strictEqual(result.failedStage, "rollback_styles");
  assert.strictEqual(result.failureDiagnostic.category, "rollback_failed");
  assert.strictEqual(result.analytics.charactersChangedTotal, 0);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 1);
  assert.strictEqual(result.analytics.styleSegmentsCount, 0);
}

async function runPrioritizedRollbackFailureTests() {
  const fontFailureNode = createProcessTextNodeMock("first-font-failure-node", "Первый...", { height: 20, width: 80, x: 0, y: 0 });
  const rollbackFailureNode = createProcessTextNodeMock("second-rollback-failure-node", "Второй...", { height: 20, width: 80, x: 0, y: 30 });
  const originalConsole = context.console;

  fontFailureNode.getRangeAllFontNames = () => [{ family: "Missing Font", style: "Regular" }];
  rollbackFailureNode.setTextStyleIdAsync = async () => {
    throw new Error("Persistent style restoration failure");
  };
  context.figma.loadFontAsync = async (font) => {
    if (font.family === "Missing Font") {
      throw new Error("Font is unavailable");
    }
  };
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([fontFailureNode, rollbackFailureNode], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
  }

  assertTextProcessCounts(result, {
    changed: 0,
    failed: 2,
    processed: 2,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(result.failedStage, "rollback_styles");
  assert.strictEqual(result.failureDiagnostic.category, "rollback_failed");
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 1);
}

async function runLibraryInstanceSafetyContractTests() {
  const instance = {
    componentProperties: {
      Label: { type: "TEXT", value: "Текст..." },
    },
    id: "instance-id",
    mainComponent: { id: "main-component-id" },
    type: "INSTANCE",
  };
  const node = createProcessTextNodeMock("instance-text-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalMainComponent = instance.mainComponent;
  const originalComponentProperties = instance.componentProperties;

  node.parent = instance;
  context.figma.loadFontAsync = async () => {};

  const result = await processTextNodes([node], 0, 0, beautyOptions);

  assertTextProcessCounts(result, {
    changed: 1,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(node.parent, instance);
  assert.strictEqual(instance.mainComponent, originalMainComponent);
  assert.strictEqual(instance.componentProperties, originalComponentProperties);
}

async function runIntegratedMixedStyleProcessingTests() {
  const node = createProcessTextNodeMock("integrated-mixed-style-node", "Один... Два", { height: 20, width: 120, x: 0, y: 0 });
  const calls = [];
  const baseStyle = node.getStyledTextSegments()[0];

  node.getRangeTextStyleId = () => "body-style-id";
  node.getStyledTextSegments = () => [
    {
      ...baseStyle,
      boundVariables: {
        fontSize: { id: "integrated-font-size-variable", type: "VARIABLE_ALIAS" },
      },
      characters: "Один...",
      end: 7,
      textStyleId: "body-style-id",
    },
    {
      ...baseStyle,
      characters: " Два",
      end: 11,
      fontName: { family: "Inter", style: "Bold" },
      start: 7,
      textStyleId: "body-style-id",
      textStyleOverrides: [{ type: "SEMANTIC_WEIGHT" }],
    },
  ];
  node.setRangeFills = (start, end, value) => calls.push(["fills", start, end, value]);
  node.setRangeBoundVariable = (start, end, field, value) => calls.push(["boundVariable", start, end, field, value]);
  node.setRangeFontName = (start, end, value) => calls.push(["fontName", start, end, value]);
  node.setRangeIndentation = (start, end, value) => calls.push(["indentation", start, end, value]);
  node.setRangeListOptions = (start, end, value) => calls.push(["listOptions", start, end, value]);
  node.setRangeParagraphIndent = (start, end, value) => calls.push(["paragraphIndent", start, end, value]);
  node.setRangeParagraphSpacing = (start, end, value) => calls.push(["paragraphSpacing", start, end, value]);
  node.setRangeTextStyleIdAsync = async (start, end, value) => calls.push(["textStyleId", start, end, value]);
  context.figma.loadFontAsync = async () => {};
  context.figma.variables.getVariableByIdAsync = async (id) => ({ id });

  const result = await processTextNodes([node], 0, 0, beautyOptions);
  const textStyleCalls = calls.filter(([name]) => name === "textStyleId");
  const boldCall = calls.find(([name]) => name === "fontName");
  const boundVariableCall = calls.find(([name]) => name === "boundVariable");

  assertTextProcessCounts(result, {
    changed: 1,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(node.characters, "Один… Два");
  assert.strictEqual(textStyleCalls.length, 2);
  assert.strictEqual(textStyleCalls[0][1], 0);
  assert.strictEqual(textStyleCalls[1][2], node.characters.length);
  assert.deepStrictEqual(boldCall.slice(1), [textStyleCalls[1][1], node.characters.length, { family: "Inter", style: "Bold" }]);
  assert.deepStrictEqual(boundVariableCall.slice(3), ["fontSize", { id: "integrated-font-size-variable" }]);
  assert(calls.indexOf(boundVariableCall) > calls.indexOf(textStyleCalls[0]));
}

async function runNotificationLifecycleTests() {
  const notifications = [];
  const closePluginCalls = [];

  context.figma.closePlugin = (message) => {
    closePluginCalls.push(message);
  };
  context.figma.notify = (message, options) => {
    const notification = {
      cancelCalls: 0,
      handler: {
        cancel() {
          notification.cancelCalls += 1;
        },
      },
      message,
      options,
    };

    notifications.push(notification);
    return notification.handler;
  };

  presentRunOutcome({ error: false, message: "Теперь всё чисто 🔥🔥🔥" }, "settings", true);
  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].message, "Теперь всё чисто 🔥🔥🔥");
  assert.strictEqual(notifications[0].options.error, false);
  assert.strictEqual(notifications[0].options.timeout, 4000);
  assert.strictEqual(closePluginCalls.length, 0, "The settings window must stay open after a final notification");

  notifications.length = 0;
  presentRunOutcome({ error: true, message: "Ой, не получилось почистить 🛑" }, "settings", true);
  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].options.error, true);
  assert.strictEqual(closePluginCalls.length, 0, "The settings window must stay open after an error");

  notifications.length = 0;
  presentRunOutcome({ error: false, message: "Теперь всё чисто 🔥🔥🔥" }, "quick_run", true);
  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(closePluginCalls.length, 0, "Quick run must not close before the final notification leaves the queue");
  assert.strictEqual(typeof notifications[0].options.onDequeue, "function");
  notifications[0].options.onDequeue("timeout");
  await Promise.resolve();
  await Promise.resolve();
  assert.deepStrictEqual(closePluginCalls, [undefined]);

  notifications.length = 0;
  closePluginCalls.length = 0;
  presentRunOutcome({ error: true, message: "Ой, не получилось почистить 🛑" }, "quick_run", false);
  assert.strictEqual(notifications.length, 0);
  assert.deepStrictEqual(closePluginCalls, ["Ой, не получилось почистить 🛑"]);

  notifications.length = 0;
  closePluginCalls.length = 0;
  context.figma.notify = () => {
    throw new Error("Notification API failed");
  };
  const originalConsole = context.console;
  context.console = {
    ...console,
    error: () => {},
  };

  try {
    presentRunOutcome({ error: true, message: "Ой, не получилось почистить 🛑" }, "quick_run", true);
  } finally {
    context.console = originalConsole;
  }

  assert.deepStrictEqual(closePluginCalls, ["Ой, не получилось почистить 🛑"]);

  notifications.length = 0;
  closePluginCalls.length = 0;
  let releasePageLoad;
  const pageLoad = new Promise((resolve) => {
    releasePageLoad = resolve;
  });

  context.figma.clientStorage = {
    getAsync: async () => null,
    setAsync: async () => {},
  };
  context.figma.currentPage = {
    findAllWithCriteria: () => [],
    loadAsync: () => pageLoad,
    selection: [],
  };
  context.figma.notify = (message, options) => {
    const notification = {
      cancelCalls: 0,
      handler: {
        cancel() {
          notification.cancelCalls += 1;
        },
      },
      message,
      options,
    };

    notifications.push(notification);
    return notification.handler;
  };

  const firstRun = runTypograph(beautyOptions, "quick_run");
  const repeatedRun = runTypograph(beautyOptions, "quick_run");

  assert.strictEqual(firstRun, repeatedRun, "A repeated signal must join the current run");
  assert.strictEqual(notifications.length, 1, "A repeated signal must not create a second progress notification");

  releasePageLoad();
  await firstRun;

  assert.strictEqual(notifications.length, 2);
  assert.strictEqual(notifications[0].message, "Чистовик работает...");
  assert.strictEqual(notifications[0].cancelCalls, 1);
  assert.strictEqual(notifications[1].message, "Всё уже было чисто 👌");
  assert.strictEqual(closePluginCalls.length, 0, "The plugin must wait until the final notification is visible");

  notifications[1].options.onDequeue("timeout");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepStrictEqual(closePluginCalls, [undefined]);

  notifications.length = 0;
  closePluginCalls.length = 0;
  const uiMessages = [];
  context.figma.currentPage = {
    findAllWithCriteria: () => [],
    loadAsync: async () => {},
    selection: [],
  };
  context.figma.ui = {
    postMessage: (message) => {
      uiMessages.push(message);
    },
  };

  await runTypograph(beautyOptions, "settings");

  assert.strictEqual(notifications.length, 2);
  assert.strictEqual(notifications[0].message, "Чистовик работает...");
  assert.strictEqual(notifications[0].cancelCalls, 1);
  assert.strictEqual(notifications[1].message, "Всё уже было чисто 👌");
  assert.strictEqual(notifications[1].options.error, false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(notifications[1].options, "onDequeue"), false);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(uiMessages)), [{ type: "typograph-run-finished" }]);
  assert.strictEqual(closePluginCalls.length, 0, "The settings window must remain open when its spinner stops");
}

runStyleCaptureTests();
runRepeatedTextStyleMappingTests();
runLongTextStyleMappingTests();
runHighPrecisionTimingTests();
runDevelopmentMarkerPluginDataTests();
runParentStateCacheTests();

runStyleRestorationTests()
  .then(runWholeTextStyleRestorationTests)
  .then(runFontLoadingCacheTests)
  .then(runWhitespaceOnlyTextNodeTests)
  .then(runUnchangedTextNodeTests)
  .then(runPreservedLibraryStyleOptimizationTests)
  .then(runLibraryStyleVerificationRollbackTests)
  .then(runDetectedRollbackDamageTests)
  .then(runStandalonePhoneCountryPrefixContextTests)
  .then(runRuleAnalyticsFinalTextTests)
  .then(runProcessingFailureAnalyticsTests)
  .then(runStyleRestorationRollbackTests)
  .then(runFailedStyleRollbackTests)
  .then(runPrioritizedRollbackFailureTests)
  .then(runLibraryInstanceSafetyContractTests)
  .then(runIntegratedMixedStyleProcessingTests)
  .then(runNotificationLifecycleTests)
  .then(() => {
    console.log("cleanTypography tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
