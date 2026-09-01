const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const releaseAnnouncements = require("../src/release-announcements.js");

const NBSP = "\u00A0";
const NB_HYPHEN = "\u2011";
const EM_DASH = "\u2014";
const MINUS = "\u2212";
const MULTIPLY = "\u00D7";

const compiledSource = fs.readFileSync("dist/code.js", "utf8");
const uiSource = fs.readFileSync("src/ui.html", "utf8");
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));

assert.strictEqual(compiledSource.includes(".detachInstance("), false, "The plugin must not detach library instances");
assert.strictEqual(compiledSource.includes("figma.createText("), false, "The plugin must not replace text layers with new layers");
assert.strictEqual(compiledSource.includes("typographRunInProgress"), false, "A repeated run must not end with a silent early return");
assert.strictEqual(compiledSource.includes("MANUAL_ERROR_REPORT_TEST_KIND"), false, "Manual error report test mode must never remain in the build");
assert.match(uiSource, /data-channel-link[^>]+href="https:\/\/t\.me\/akanna_notes"/, "The Telegram link must keep its analytics marker");
assert.match(uiSource, /data-website-link[^>]+href="https:\/\/annaakulova\.ru\/"/, "The website link must have its own analytics marker");
assert.strictEqual(uiSource.includes('type: "channel-link-clicked"'), true, "The Telegram link must notify the plugin code");
assert.strictEqual(uiSource.includes('type: "website-link-clicked"'), true, "The website link must notify the plugin code");
assert.strictEqual(compiledSource.includes('queueAnalyticsEvent("channel_link_clicked"'), true, "Telegram clicks must reach PostHog");
assert.strictEqual(compiledSource.includes('queueAnalyticsEvent("website_link_clicked"'), true, "Website clicks must reach PostHog");
assert.strictEqual(compiledSource.includes("phc_BkVcyxEX27UmgdY7RhHQkquqQVL49kHhL9qDPNsFYzcp"), false, "The PostHog project token must stay on the relay");
assert.deepStrictEqual(
  manifest.networkAccess.allowedDomains,
  ["https://chistovik-plugin.vercel.app"],
  "The plugin must send analytics only through the Vercel relay"
);
assert.strictEqual(uiSource.includes('id="rulesScrollIndicator"'), true, "Scrollable rules must have a persistent indicator");
assert.strictEqual(uiSource.includes("updatePersistentScrollIndicator"), true, "Scrollable UI areas must share the persistent indicator logic");
assert.strictEqual(uiSource.includes("persistent-scroll-thumb"), true, "The persistent scroll indicator must use the shared thumb style");
assert.match(uiSource, /\.tabs\s*\{[^}]*z-index:\s*1;/s, "The active tab underline must stay above scrolled content");
assert.strictEqual(uiSource.includes('id="errorReportShell"'), true, "The agreed error report must be part of the working plugin UI");
assert.strictEqual(uiSource.includes('type === "show-error-report"'), true, "The working UI must accept real error reports");
assert.strictEqual(uiSource.includes("Не всё удалось обработать"), true, "The safe failure title must keep the agreed text");
assert.strictEqual(uiSource.includes("Типограф остановил работу"), true, "The critical failure title must keep the agreed text");
assert.strictEqual(uiSource.includes("Не удалось запустить типограф"), true, "The startup failure title must keep the agreed text");
assert.strictEqual(uiSource.includes("Вернуться к типографу"), true, "The settings error report must keep the agreed return action");
assert.match(
  uiSource,
  /\.error-report\s*\{[^}]*grid-template-rows:\s*auto auto minmax\(0, 1fr\) auto;/s,
  "The error report footer must have its own fixed grid row"
);
assert.match(
  uiSource,
  /\.report-footer\s*\{[^}]*padding:\s*10px 16px 16px;[^}]*position:\s*relative;/s,
  "The fixed error report footer must keep the agreed white safe space"
);
assert.strictEqual(
  uiSource.includes(".report-footer.with-scroll-gradient::before"),
  true,
  "The fixed error report footer must expose the agreed scroll gradient"
);
assert.strictEqual(
  uiSource.includes('reportFooter.classList.toggle("with-scroll-gradient", hasHiddenContentBelow)'),
  true,
  "The footer gradient must react to hidden content below the viewport"
);
assert.strictEqual(
  uiSource.includes("function updateProblemLayerPaths()"),
  true,
  "Long error-report paths must keep their informative ending"
);
assert.strictEqual(
  uiSource.includes('path.textContent = `… / ${segments.slice(startIndex).join(" / ")}`'),
  true,
  "Long error-report paths must remove leading segments first"
);
assert.strictEqual(
  uiSource.includes('item.addEventListener("click", () => selectProblemLayer(index, true))'),
  true,
  "Clicking a problem layer must scroll its row into view"
);
assert.strictEqual(
  uiSource.includes("function scrollProblemLayerIntoView(item)"),
  true,
  "The selected problem layer must use the fixed-footer-aware scroll helper"
);
assert.strictEqual(
  uiSource.includes('const gradientHeight = reportFooter.classList.contains("with-scroll-gradient") ? 18 : 0'),
  true,
  "The selected problem layer must stay clear of the fixed footer gradient"
);
assert.strictEqual(
  uiSource.includes('scrollIntoView({ block: "center" })'),
  false,
  "Selecting a problem layer must not jump it to the middle of the list"
);
const reportScrollContentIndex = uiSource.indexOf('<div class="report-scroll" id="reportScroll">');
const reportScrollIndicatorIndex = uiSource.indexOf('<div class="report-scroll-indicator"', reportScrollContentIndex);
const fixedReportFooterIndex = uiSource.indexOf('<footer class="report-footer" id="reportFooter">', reportScrollContentIndex);
assert.ok(
  reportScrollContentIndex !== -1
    && reportScrollIndicatorIndex > reportScrollContentIndex
    && fixedReportFooterIndex > reportScrollIndicatorIndex,
  "The error report footer must stay outside the scrollable list"
);
assert.match(uiSource, /src="data:image\/png;base64,[^"]+" data-inline-asset="report-warning\.png"/, "The warning illustration must be bundled into the UI");
assert.match(uiSource, /src="data:image\/png;base64,[^"]+" data-inline-asset="report-critical\.png"/, "The critical illustration must be bundled into the UI");
assert.match(uiSource, /src="data:image\/png;base64,[^"]+" data-inline-asset="startup-error\.png"/, "The startup illustration must be bundled into the UI");
assert.match(uiSource, /src: url\("data:font\/woff2;base64,[^"]+"\)/, "The text-layer icon font must be bundled into the UI");

const releaseAnnouncementMenuIndex = manifest.menu.findIndex((item) => item.command === "open-release-announcement");
assert.strictEqual(
  compiledSource.includes('figma.ui.postMessage({ type: "show-release-announcement" })'),
  true,
  "The release announcement command must open its screen"
);
assert.strictEqual(uiSource.includes('id="releaseAnnouncementShell"'), true, "The release announcement screen must be bundled into the UI");
assert.strictEqual(
  uiSource.includes('if (!releaseAnnouncementShell.querySelector(".release-announcement"))'),
  true,
  "A stale recent announcement command must fall back to the typograph screen"
);

if (releaseAnnouncements.activeId === null) {
  assert.strictEqual(releaseAnnouncementMenuIndex, -1, "An inactive release announcement must be absent from the plugin menu");
  assert.strictEqual(
    uiSource.includes('<article class="release-announcement">'),
    false,
    "An inactive release announcement must not be bundled into the UI"
  );
  assert.notDeepStrictEqual(manifest.menu[manifest.menu.length - 1], { separator: true }, "An inactive announcement must not leave a trailing separator");
} else {
  const activeReleaseAnnouncement = releaseAnnouncements.items[releaseAnnouncements.activeId];

  assert.ok(activeReleaseAnnouncement, "The active release announcement id must point to an archived item");
  assert.notStrictEqual(releaseAnnouncementMenuIndex, -1, "The active release announcement must be present in the plugin menu");
  assert.deepStrictEqual(
    manifest.menu[releaseAnnouncementMenuIndex - 1],
    { separator: true },
    "The release announcement must be separated from the regular plugin commands"
  );
  assert.strictEqual(
    manifest.menu[releaseAnnouncementMenuIndex].name,
    activeReleaseAnnouncement.menuName,
    "The release announcement menu text must match its source"
  );
  assert.strictEqual(uiSource.includes(activeReleaseAnnouncement.titleHtml), true, "The release announcement title must match its source");

  activeReleaseAnnouncement.paragraphsHtml.forEach((paragraph) => {
    assert.strictEqual(uiSource.includes(paragraph), true, "Every release announcement paragraph must match its source");
  });

  assert.match(
    uiSource,
    new RegExp(`src="data:image\\/png;base64,[^"]+" data-inline-asset="${activeReleaseAnnouncement.imageAsset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`),
    "The release announcement illustration must be bundled into the UI"
  );

  activeReleaseAnnouncement.actions.forEach((action) => {
    assert.strictEqual(
      uiSource.includes(
        `class="${action.appearance}" type="button" data-announcement-action="${action.action}">${action.labelHtml}</button>`
      ),
      true,
      "Every release announcement action must match its source"
    );
  });
}

const source = compiledSource.replace(
  "void run();",
  [
    "globalThis.cleanTypography = cleanTypography;",
    "globalThis.cleanTypographyWithMetadata = cleanTypographyWithMetadata;",
    "globalThis.calculatePointTextEdits = calculatePointTextEdits;",
    "globalThis.applyPointTextEditsToString = applyPointTextEditsToString;",
    "globalThis.applyPointTextEditsToTextNode = applyPointTextEditsToTextNode;",
    "globalThis.buildPointTextEditStyleMap = buildPointTextEditStyleMap;",
    "globalThis.coalesceDensePointTextEdits = coalesceDensePointTextEdits;",
    "globalThis.getPointTextEditStyleSourcePosition = getPointTextEditStyleSourcePosition;",
    "globalThis.segmentTextForPointEdits = segmentTextForPointEdits;",
    "globalThis.findLocalPointEditAlignment = findLocalPointEditAlignment;",
    "globalThis.captureTextStyles = captureTextStyles;",
    "globalThis.getWholeTextStyle = getWholeTextStyle;",
    "globalThis.restoreWholeTextStyle = restoreWholeTextStyle;",
    "globalThis.restoreTextLayerSnapshot = restoreTextLayerSnapshot;",
    "globalThis.restoreTextStyles = restoreTextStyles;",
    "globalThis.restoreStyleIds = restoreStyleIds;",
    "globalThis.restoreBoundVariables = restoreBoundVariables;",
    "globalThis.buildStyleMap = buildStyleMap;",
    "globalThis.createStyleRestorationPlan = createStyleRestorationPlan;",
    "globalThis.loadFontsForTextNode = loadFontsForTextNode;",
    "globalThis.getFontLoadPromise = getFontLoadPromise;",
    "globalThis.getExistingDevelopmentMarkerIndexes = getExistingDevelopmentMarkerIndexes;",
    "globalThis.captureDevelopmentMarkerFills = captureDevelopmentMarkerFills;",
    "globalThis.getStandalonePhoneCountryPrefixIds = getStandalonePhoneCountryPrefixIds;",
    "globalThis.buildNumberLayerContexts = buildNumberLayerContexts;",
    "globalThis.buildNumberDiagnosticLayerContexts = buildNumberDiagnosticLayerContexts;",
    "globalThis.createProblemLayerTextPreview = createProblemLayerTextPreview;",
    "globalThis.selectProblemTextLayer = selectProblemTextLayer;",
    "globalThis.measureDuration = measureDuration;",
    "globalThis.withFigmaOperationTimeout = withFigmaOperationTimeout;",
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
    "globalThis.createNumberDiagnosticCases = createNumberDiagnosticCases;",
    "globalThis.collectNumberDiagnosticTokens = collectNumberDiagnosticTokens;",
    "globalThis.createDiagnosticNumberContextNeighbors = createDiagnosticNumberContextNeighbors;",
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
  __html__: uiSource,
  clearTimeout,
  console,
  figma: {
    commitUndo: () => {},
    getStyleByIdAsync: async (id) => ({ id, type: id.includes("fill") ? "PAINT" : "TEXT" }),
    mixed: Symbol("mixed"),
    triggerUndo: () => {},
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
const calculatePointTextEdits = context.globalThis.calculatePointTextEdits;
const applyPointTextEditsToString = context.globalThis.applyPointTextEditsToString;
const applyPointTextEditsToTextNode = context.globalThis.applyPointTextEditsToTextNode;
const buildPointTextEditStyleMap = context.globalThis.buildPointTextEditStyleMap;
const coalesceDensePointTextEdits = context.globalThis.coalesceDensePointTextEdits;
const getPointTextEditStyleSourcePosition = context.globalThis.getPointTextEditStyleSourcePosition;
const segmentTextForPointEdits = context.globalThis.segmentTextForPointEdits;
const findLocalPointEditAlignment = context.globalThis.findLocalPointEditAlignment;
const captureTextStyles = context.globalThis.captureTextStyles;
const getWholeTextStyle = context.globalThis.getWholeTextStyle;
const restoreWholeTextStyle = context.globalThis.restoreWholeTextStyle;
const restoreTextLayerSnapshot = context.globalThis.restoreTextLayerSnapshot;
const restoreTextStyles = context.globalThis.restoreTextStyles;
const restoreStyleIds = context.globalThis.restoreStyleIds;
const restoreBoundVariables = context.globalThis.restoreBoundVariables;
const buildStyleMap = context.globalThis.buildStyleMap;
const createStyleRestorationPlan = context.globalThis.createStyleRestorationPlan;
const loadFontsForTextNode = context.globalThis.loadFontsForTextNode;
const getFontLoadPromise = context.globalThis.getFontLoadPromise;
const getExistingDevelopmentMarkerIndexes = context.globalThis.getExistingDevelopmentMarkerIndexes;
const captureDevelopmentMarkerFills = context.globalThis.captureDevelopmentMarkerFills;
const getStandalonePhoneCountryPrefixIds = context.globalThis.getStandalonePhoneCountryPrefixIds;
const buildNumberLayerContexts = context.globalThis.buildNumberLayerContexts;
const createProblemLayerTextPreview = context.globalThis.createProblemLayerTextPreview;
const selectProblemTextLayer = context.globalThis.selectProblemTextLayer;
const measureDuration = context.globalThis.measureDuration;
const withFigmaOperationTimeout = context.globalThis.withFigmaOperationTimeout;
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
const createNumberDiagnosticCases = context.globalThis.createNumberDiagnosticCases;
const collectNumberDiagnosticTokens = context.globalThis.collectNumberDiagnosticTokens;
const createDiagnosticNumberContextNeighbors = context.globalThis.createDiagnosticNumberContextNeighbors;
const buildNumberDiagnosticLayerContexts = context.globalThis.buildNumberDiagnosticLayerContexts;
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

assert.strictEqual(getAnalyticsCaptureEndpoint(), "https://chistovik-plugin.vercel.app/api/capture");

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
assert.strictEqual(Object.prototype.hasOwnProperty.call(analyticsPayload, "api_key"), false);
assert.match(createAnalyticsEventId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
assert.strictEqual(analyticsPayload.distinct_id, "anon_test");
assert.strictEqual(analyticsPayload.properties.$process_person_profile, false);
assert.strictEqual(analyticsPayload.properties.$geoip_disable, true);
assert.strictEqual(analyticsPayload.properties.analytics_schema_version, 14);
assert.strictEqual(analyticsPayload.properties.mode, "default");
assert.strictEqual(analyticsPayload.properties.plugin_release, "2026-08-26");
assert.strictEqual(Object.prototype.hasOwnProperty.call(analyticsPayload.properties, "plugin_version"), false);

const movedCurrencyDiagnostics = createNumberDiagnosticCases(
  "Стоимость $338.00 за месяц",
  `Стоимость 338,00${NBSP}$ за месяц`,
  null
);
assert.strictEqual(movedCurrencyDiagnostics.length, 1);
assert.strictEqual(movedCurrencyDiagnostics[0].status, "changed");
assert.strictEqual(movedCurrencyDiagnostics[0].numberBefore, "$338.00");
assert.strictEqual(movedCurrencyDiagnostics[0].numberAfter, `338,00${NBSP}$`);
assert.strictEqual(movedCurrencyDiagnostics[0].beforeText, "Стоимость $338.00 за месяц");
assert.strictEqual(movedCurrencyDiagnostics[0].reason, "$ перед числом");
assert.strictEqual(movedCurrencyDiagnostics[0].numberRulesVersion, "numbers-2026-08-25-v1");
assert(movedCurrencyDiagnostics[0].ruleCodes.includes("number_decimal_comma"));
assert(movedCurrencyDiagnostics[0].ruleCodes.includes("number_unit_currency_nbsp"));

const unchangedDecimalDiagnostics = createNumberDiagnosticCases(
  "Проверяем значение 338.00. Доставка завтра",
  "Проверяем значение 338.00. Доставка завтра",
  null
);
assert.strictEqual(unchangedDecimalDiagnostics.length, 1);
assert.strictEqual(unchangedDecimalDiagnostics[0].status, "skipped_policy");
assert.strictEqual(unchangedDecimalDiagnostics[0].beforeText, "значение 338.00. Доставка");
assert.strictEqual(unchangedDecimalDiagnostics[0].reason, "Признак количества не найден");

const nearbySpaceDiagnostics = createNumberDiagnosticCases(
  "iPhone 17 Pro Max",
  `iPhone 17${NBSP}Pro Max`,
  null
);
assert.strictEqual(nearbySpaceDiagnostics.length, 1);
assert.strictEqual(nearbySpaceDiagnostics[0].status, "changed");
assert.strictEqual(nearbySpaceDiagnostics[0].numberBefore, "17");
assert.strictEqual(nearbySpaceDiagnostics[0].numberAfter, "17");
assert.strictEqual(
  nearbySpaceDiagnostics[0].reason,
  "Изменён пробел рядом с числом; числовое правило не применялось"
);
assert.deepStrictEqual(Array.from(nearbySpaceDiagnostics[0].ruleCodes), ["number_context_nbsp"]);

const mccDiagnostics = createNumberDiagnosticCases("MCC 5411", "MCC 5411", null);
assert.strictEqual(mccDiagnostics.length, 1);
assert.strictEqual(mccDiagnostics[0].status, "skipped_policy");
assert.strictEqual(mccDiagnostics[0].numberKind, "MCC-код");
assert.strictEqual(mccDiagnostics[0].reason, "Защита: MCC-код");

const mccCurrencyDiagnostics = createNumberDiagnosticCases(
  "MCC 5411 ₽",
  `MCC 5${NBSP}411${NBSP}₽`,
  null
);
assert.strictEqual(mccCurrencyDiagnostics.length, 1);
assert.strictEqual(mccCurrencyDiagnostics[0].status, "changed");
assert.strictEqual(mccCurrencyDiagnostics[0].numberKind, "Сумма с валютой");
assert.strictEqual(mccCurrencyDiagnostics[0].reason, "₽ после числа");

const dateContextDiagnostics = createNumberDiagnosticCases(
  "Сохраняем случаи до 18 сентября включительно",
  `Сохраняем случаи до 18${NBSP}сентября включительно`,
  null
);
assert.strictEqual(dateContextDiagnostics.length, 1);
assert.strictEqual(dateContextDiagnostics[0].beforeText, "случаи до 18 сентября");
assert.strictEqual(dateContextDiagnostics[0].afterText, `случаи до 18${NBSP}сентября`);
assert.strictEqual(dateContextDiagnostics[0].reason, "сентября после числа");

const alreadyCorrectDiagnostics = createNumberDiagnosticCases(
  `Стоимость подписки 10${NBSP}000${NBSP}₽ ежегодно`,
  `Стоимость подписки 10${NBSP}000${NBSP}₽ ежегодно`,
  null
);
assert.strictEqual(alreadyCorrectDiagnostics.length, 1);
assert.strictEqual(alreadyCorrectDiagnostics[0].status, "already_correct");
assert.strictEqual(alreadyCorrectDiagnostics[0].reason, "₽ после числа");

const developmentNumberBefore = `iPhone 17${NBSP}Pro Max и${NBSP}20${NBSP}000${NBSP}₽`;
const developmentNumberAfter = developmentNumberBefore.replaceAll(NBSP, "*");
const developmentMarkerIndexes = Array.from(developmentNumberAfter)
  .map((character, index) => character === "*" ? index : -1)
  .filter((index) => index >= 0);
const developmentNumberDiagnostics = createNumberDiagnosticCases(
  developmentNumberBefore,
  developmentNumberAfter,
  null,
  [],
  developmentMarkerIndexes
);
assert.strictEqual(developmentNumberDiagnostics.length, 2);
assert.strictEqual(developmentNumberDiagnostics.some((item) => item.status === "review"), false);
assert.strictEqual(developmentNumberDiagnostics.some((item) => item.beforeText === "" || item.afterText === ""), false);
assert.strictEqual(developmentNumberDiagnostics.some((item) => item.beforeText.includes("*") || item.afterText.includes("*")), false);
const developmentAmountDiagnostic = developmentNumberDiagnostics.find(
  (item) => item.numberBefore.replace(/\D/g, "") === "20000"
);
assert(developmentAmountDiagnostic);
assert.strictEqual(developmentAmountDiagnostic.numberBefore, `20${NBSP}000${NBSP}₽`);
assert.strictEqual(developmentAmountDiagnostic.numberAfter, `20${NBSP}000${NBSP}₽`);
assert.strictEqual(developmentAmountDiagnostic.status, "already_correct");

const restoredBeautyNumberDiagnostics = createNumberDiagnosticCases(
  developmentNumberAfter,
  developmentNumberBefore,
  null,
  developmentMarkerIndexes,
  []
);
assert.strictEqual(restoredBeautyNumberDiagnostics.length, 2);
assert.strictEqual(restoredBeautyNumberDiagnostics.some((item) => item.status === "review"), false);
assert.strictEqual(restoredBeautyNumberDiagnostics.some((item) => item.beforeText === "" || item.afterText === ""), false);

const neighboringCurrencyDiagnostics = createNumberDiagnosticCases(
  "10000",
  `10${NBSP}000`,
  {
    diagnosticNeighbors: [
      { direction: "right", role: "evidence", text: "₽", usedAsEvidence: true },
    ],
    evidenceAfter: { kind: "currency", marker: "₽" },
    evidenceBefore: null,
    protectedAsPhoneByNeighbor: false,
    protectedByNeighbor: false,
    standalonePhonePrefix: false,
    snapshotKey: "test",
  }
);
assert.strictEqual(neighboringCurrencyDiagnostics.length, 1);
assert.strictEqual(neighboringCurrencyDiagnostics[0].layerMode, "multiple");
assert.strictEqual(neighboringCurrencyDiagnostics[0].neighbors[0].text, "₽");
assert.strictEqual(neighboringCurrencyDiagnostics[0].status, "changed");
assert.strictEqual(neighboringCurrencyDiagnostics[0].reason, "₽ в соседнем слое");

const idLayerText = "A4172085226022010000010011270701";
const idLayerDiagnostics = createNumberDiagnosticCases(
  idLayerText,
  idLayerText,
  {
    diagnosticNeighbors: [
      { direction: "left", role: "protection", text: "ID", usedAsEvidence: true },
    ],
    evidenceAfter: null,
    evidenceBefore: null,
    protectedAsPhoneByNeighbor: false,
    protectedByNeighbor: true,
    standalonePhonePrefix: false,
    snapshotKey: "test-id-row",
  }
);
assert.strictEqual(idLayerDiagnostics.length, 1);
assert.strictEqual(idLayerDiagnostics[0].layerMode, "multiple");
assert.strictEqual(idLayerDiagnostics[0].neighbors[0].text, "ID");
assert.strictEqual(idLayerDiagnostics[0].reason, "Защита: ID в соседнем слое");

const createDiagnosticTextNode = (id, characters) => ({
  characters,
  id,
  layoutPositioning: "AUTO",
  maxLines: null,
  removed: false,
  rotation: 0,
  textAutoResize: "WIDTH_AND_HEIGHT",
  type: "TEXT",
});
const idRowNeighbors = createDiagnosticNumberContextNeighbors(
  [
    createDiagnosticTextNode("label", "ID"),
    { id: "leader", type: "VECTOR" },
    createDiagnosticTextNode("value", idLayerText),
  ],
  2
);
assert.strictEqual(idRowNeighbors.length, 1);
assert.strictEqual(idRowNeighbors[0].direction, "left");
assert.strictEqual(idRowNeighbors[0].text, "ID");

const twoSidedAutoLayoutNeighbors = createDiagnosticNumberContextNeighbors(
  [
    createDiagnosticTextNode("left-anchor", "Баллы всего"),
    createDiagnosticTextNode("left-intermediate-number", "1"),
    createDiagnosticTextNode("delta-value", "+0"),
    createDiagnosticTextNode("right-anchor", "изменение за день"),
  ],
  2
);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(twoSidedAutoLayoutNeighbors.map((neighbor) => [neighbor.direction, neighbor.text]))),
  [
    ["left", "1"],
    ["left", "Баллы всего"],
    ["right", "изменение за день"],
  ]
);
const twoSidedAutoLayoutCases = createNumberDiagnosticCases(
  "+0",
  "+0",
  {
    diagnosticNeighbors: twoSidedAutoLayoutNeighbors,
    evidenceAfter: null,
    evidenceBefore: null,
    protectedAsPhoneByNeighbor: false,
    protectedByNeighbor: false,
    standalonePhonePrefix: false,
    snapshotKey: "test-two-sided-auto-layout-context",
  }
);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(twoSidedAutoLayoutCases[0].neighbors.map((neighbor) => [neighbor.direction, neighbor.text]))),
  [
    ["left", "1"],
    ["left", "Баллы всего"],
    ["right", "изменение за день"],
  ]
);
assert.strictEqual(twoSidedAutoLayoutCases[0].layerMode, "multiple");

const numericOnlyAutoLayoutNeighbors = createDiagnosticNumberContextNeighbors(
  [
    createDiagnosticTextNode("numeric-only-neighbor", "1"),
    createDiagnosticTextNode("numeric-only-value", "+0"),
  ],
  1
);
const numericOnlyAutoLayoutCases = createNumberDiagnosticCases(
  "+0",
  "+0",
  {
    diagnosticNeighbors: numericOnlyAutoLayoutNeighbors,
    evidenceAfter: null,
    evidenceBefore: null,
    protectedAsPhoneByNeighbor: false,
    protectedByNeighbor: false,
    standalonePhonePrefix: false,
    snapshotKey: "test-numeric-only-auto-layout-context",
  }
);
assert.strictEqual(numericOnlyAutoLayoutCases[0].neighbors.length, 0);
assert.strictEqual(numericOnlyAutoLayoutCases[0].layerMode, "single");

const diagnosticRoot = {
  id: "diagnostic-root",
  layoutMode: "VERTICAL",
  locked: false,
  parent: null,
  type: "FRAME",
  visible: true,
};
const accountLabel = createProcessTextNodeMock(
  "diagnostic-account-label",
  "Счёт зачисления",
  { height: 20, width: 110, x: 40, y: 100 },
  null
);
const accountValue = createProcessTextNodeMock(
  "diagnostic-account-value",
  "12345678912345678902",
  { height: 20, width: 180, x: 190, y: 100 },
  null
);
const accountLabelWrapper = {
  children: [accountLabel],
  id: "diagnostic-account-label-wrapper",
  layoutMode: "NONE",
  locked: false,
  parent: diagnosticRoot,
  type: "FRAME",
  visible: true,
};
const accountValueWrapper = {
  children: [accountValue],
  id: "diagnostic-account-value-wrapper",
  layoutMode: "NONE",
  locked: false,
  parent: diagnosticRoot,
  type: "FRAME",
  visible: true,
};
accountLabel.parent = accountLabelWrapper;
accountValue.parent = accountValueWrapper;
const spatialAccountContext = buildNumberDiagnosticLayerContexts([accountLabel, accountValue]).get(accountValue.id);
assert(spatialAccountContext);
assert.strictEqual(spatialAccountContext.diagnosticNeighbors.length, 1);
assert.strictEqual(spatialAccountContext.diagnosticNeighbors[0].text, "Счёт зачисления");
assert.strictEqual(spatialAccountContext.diagnosticNeighbors[0].usedAsEvidence, true);
const spatialAccountCases = createNumberDiagnosticCases(accountValue.characters, accountValue.characters, spatialAccountContext);
assert.strictEqual(spatialAccountCases[0].layerMode, "multiple");
assert.strictEqual(spatialAccountCases[0].reason, "Защита: номер счёта");

const spatialIdLabel = createProcessTextNodeMock(
  "diagnostic-id-label",
  "ID",
  { height: 20, width: 18, x: 40, y: 130 },
  null
);
const spatialIdValue = createProcessTextNodeMock(
  "diagnostic-id-value",
  "A4172085226022010000010011270701",
  { height: 20, width: 260, x: 190, y: 130 },
  null
);
spatialIdLabel.parent = { ...accountLabelWrapper, children: [spatialIdLabel], id: "diagnostic-id-label-wrapper" };
spatialIdValue.parent = { ...accountValueWrapper, children: [spatialIdValue], id: "diagnostic-id-value-wrapper" };
const spatialIdContext = buildNumberDiagnosticLayerContexts([spatialIdLabel, spatialIdValue]).get(spatialIdValue.id);
assert(spatialIdContext);
assert.strictEqual(spatialIdContext.diagnosticNeighbors[0].text, "ID");
assert.strictEqual(spatialIdContext.diagnosticNeighbors[0].usedAsEvidence, true);
const spatialIdCases = createNumberDiagnosticCases(spatialIdValue.characters, spatialIdValue.characters, spatialIdContext);
assert.strictEqual(spatialIdCases[0].reason, "Защита: ID в соседнем слое");

const genericContextLabel = createProcessTextNodeMock(
  "diagnostic-generic-label",
  "Остаток баллов",
  { height: 20, width: 110, x: 40, y: 160 },
  null
);
const genericContextValue = createProcessTextNodeMock(
  "diagnostic-generic-value",
  "29143",
  { height: 20, width: 60, x: 190, y: 160 },
  null
);
const unrelatedNextRowLabel = createProcessTextNodeMock(
  "diagnostic-unrelated-label",
  "Следующий показатель",
  { height: 20, width: 140, x: 40, y: 190 },
  null
);
genericContextLabel.parent = { ...accountLabelWrapper, children: [genericContextLabel], id: "diagnostic-generic-label-wrapper" };
genericContextValue.parent = { ...accountValueWrapper, children: [genericContextValue], id: "diagnostic-generic-value-wrapper" };
unrelatedNextRowLabel.parent = { ...accountLabelWrapper, children: [unrelatedNextRowLabel], id: "diagnostic-unrelated-label-wrapper" };
const genericContext = buildNumberDiagnosticLayerContexts([
  genericContextLabel,
  genericContextValue,
  unrelatedNextRowLabel,
]).get(genericContextValue.id);
assert(genericContext);
assert.strictEqual(genericContext.diagnosticNeighbors.length, 1);
assert.strictEqual(genericContext.diagnosticNeighbors[0].text, "Остаток баллов");
assert.strictEqual(genericContext.diagnosticNeighbors[0].usedAsEvidence, false);
const genericContextCases = createNumberDiagnosticCases(
  genericContextValue.characters,
  genericContextValue.characters,
  genericContext
);
assert.strictEqual(genericContextCases[0].layerMode, "multiple");
assert.strictEqual(genericContextCases[0].reason, "Признак количества не найден");

const selectedContainerContext = buildNumberDiagnosticLayerContexts(
  [genericContextValue],
  [genericContextLabel, genericContextValue]
).get(genericContextValue.id);
assert(selectedContainerContext);
assert.strictEqual(selectedContainerContext.diagnosticNeighbors.length, 1);
assert.strictEqual(selectedContainerContext.diagnosticNeighbors[0].text, "Остаток баллов");

const competingSelectedLabel = createProcessTextNodeMock(
  "diagnostic-competing-selection-label",
  "Чужая карточка",
  { height: 20, width: 60, x: 120, y: 160 },
  null
);
competingSelectedLabel.parent = {
  ...accountLabelWrapper,
  children: [competingSelectedLabel],
  id: "diagnostic-competing-selection-wrapper",
};
const separatedSelectionContext = buildNumberDiagnosticLayerContexts(
  [genericContextValue],
  [genericContextLabel, competingSelectedLabel, genericContextValue],
  new Map([
    [genericContextLabel.id, "selected-container"],
    [genericContextValue.id, "selected-container"],
    [competingSelectedLabel.id, "other-selected-container"],
  ])
).get(genericContextValue.id);
assert(separatedSelectionContext);
assert.strictEqual(separatedSelectionContext.diagnosticNeighbors.length, 1);
assert.strictEqual(separatedSelectionContext.diagnosticNeighbors[0].text, "Остаток баллов");

const selectedTextOnlyContext = buildNumberDiagnosticLayerContexts(
  [genericContextValue],
  [genericContextValue]
).get(genericContextValue.id);
assert.strictEqual(selectedTextOnlyContext, undefined);

const trailingNumberText = createProcessTextNodeMock(
  "diagnostic-trailing-number",
  "Каждый раз 5",
  { height: 20, width: 100, x: 40, y: 220 },
  null
);
const trailingNumberRightContext = createProcessTextNodeMock(
  "diagnostic-trailing-number-right-context",
  "дней подряд",
  { height: 20, width: 90, x: 160, y: 220 },
  null
);
const trailingNumberUnusedLeftContext = createProcessTextNodeMock(
  "diagnostic-trailing-number-unused-left-context",
  "Чужой текст",
  { height: 20, width: 100, x: -80, y: 220 },
  null
);
trailingNumberText.parent = {
  ...accountValueWrapper,
  children: [trailingNumberText],
  id: "diagnostic-trailing-number-wrapper",
};
trailingNumberRightContext.parent = {
  ...accountLabelWrapper,
  children: [trailingNumberRightContext],
  id: "diagnostic-trailing-number-right-context-wrapper",
};
trailingNumberUnusedLeftContext.parent = {
  ...accountLabelWrapper,
  children: [trailingNumberUnusedLeftContext],
  id: "diagnostic-trailing-number-unused-left-context-wrapper",
};
const trailingNumberContext = buildNumberDiagnosticLayerContexts(
  [trailingNumberText],
  [trailingNumberUnusedLeftContext, trailingNumberText, trailingNumberRightContext]
).get(trailingNumberText.id);
assert(trailingNumberContext);
assert.strictEqual(trailingNumberContext.diagnosticNeighbors.length, 1);
assert.strictEqual(trailingNumberContext.diagnosticNeighbors[0].direction, "right");
assert.strictEqual(trailingNumberContext.diagnosticNeighbors[0].text, "дней подряд");
const trailingNumberCases = createNumberDiagnosticCases(
  trailingNumberText.characters,
  trailingNumberText.characters,
  trailingNumberContext
);
assert.strictEqual(trailingNumberCases.length, 1);
assert.strictEqual(trailingNumberCases[0].beforeText, "Каждый раз 5");
assert.strictEqual(trailingNumberCases[0].neighbors.length, 1);
assert.strictEqual(trailingNumberCases[0].neighbors[0].text, "дней подряд");
assert.strictEqual(trailingNumberCases[0].layerMode, "multiple");

const twoSidedSpatialNodes = [
  createProcessTextNodeMock("spatial-left-anchor", "Баллы всего", { height: 20, width: 100, x: 40, y: 260 }, null),
  createProcessTextNodeMock("spatial-left-number", "1", { height: 20, width: 10, x: 170, y: 260 }, null),
  createProcessTextNodeMock("spatial-delta", "+0", { height: 20, width: 30, x: 200, y: 260 }, null),
  createProcessTextNodeMock("spatial-right-number", "2", { height: 20, width: 10, x: 250, y: 260 }, null),
  createProcessTextNodeMock("spatial-right-anchor", "изменение за день", { height: 20, width: 130, x: 290, y: 260 }, null),
];
twoSidedSpatialNodes.forEach((node) => {
  node.parent = {
    ...accountLabelWrapper,
    children: [node],
    id: `${node.id}-wrapper`,
  };
});
const twoSidedSpatialContext = buildNumberDiagnosticLayerContexts(
  [twoSidedSpatialNodes[2]],
  twoSidedSpatialNodes
).get(twoSidedSpatialNodes[2].id);
assert(twoSidedSpatialContext);
const twoSidedSpatialCases = createNumberDiagnosticCases(
  twoSidedSpatialNodes[2].characters,
  twoSidedSpatialNodes[2].characters,
  twoSidedSpatialContext
);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(twoSidedSpatialCases[0].neighbors.map((neighbor) => [neighbor.direction, neighbor.text]))),
  [
    ["left", "1"],
    ["left", "Баллы всего"],
    ["right", "2"],
    ["right", "изменение за день"],
  ]
);

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

const shadowRunAnalyticsProperties = getRunAnalyticsProperties({
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
  });
assert.strictEqual(shadowRunAnalyticsProperties.performance_measurement_version, 8);
assert.strictEqual(shadowRunAnalyticsProperties.point_editing_phase, "point_safe");

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
assert.strictEqual(ruleAnalyticsProperties.rule_analytics_version, 3);
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
assert.strictEqual(createAnalyticsErrorDiagnostic(new Error("Style does not exist"), "restore_styles").category, "restore_styles_failed");
assert.strictEqual(createAnalyticsErrorDiagnostic(new Error("Variable does not exist"), "restore_styles").category, "restore_styles_failed");
assert.strictEqual(createAnalyticsErrorDiagnostic(new Error("Figma operation timed out: font_load"), "load_fonts").category, "timeout");
assert.strictEqual(createAnalyticsErrorDiagnostic(new Error("Original state rollback failed"), "rollback_styles").category, "rollback_failed");
const rollbackFailureNotificationError = new Error("Failed to process text layer");
rollbackFailureNotificationError.name = "RollbackFailureError";
assert.strictEqual(
  getFailureNotificationMessage(rollbackFailureNotificationError),
  "Плагин случайно сломал какие-то стили — проверьте текстовые слои 🛑"
);
const textLayerContentChangedNotificationError = new Error("Text layer changed");
textLayerContentChangedNotificationError.name = "TextLayerContentChangedError";
assert.strictEqual(getFailureNotificationMessage(textLayerContentChangedNotificationError), "Тут изменился текст — запустите типограф заново 🔄");
assert.strictEqual(getFailureNotificationMessage(new Error("Node was removed")), "Ой, не получилось почистить 🛑");
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
        numberContext: 9,
        pointEditPlanning: 8,
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
    timing_number_context_ms: 9,
    timing_point_edit_planning_ms: 8,
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

  const longDetachedText = "т".repeat(90000);
  let detachedFillStyleReads = 0;
  let detachedTextStyleReads = 0;
  const longDetachedNode = {
    characters: longDetachedText,
    fillStyleId: "",
    getRangeFillStyleId: () => {
      detachedFillStyleReads += 1;
      return "";
    },
    getRangeTextStyleId: () => {
      detachedTextStyleReads += 1;
      return "";
    },
    getStyledTextSegments: () => [{ ...baseSegment, characters: longDetachedText, end: longDetachedText.length }],
    id: "long-detached-style",
    textStyleId: "",
  };

  const longDetachedStyles = captureTextStyles(longDetachedNode);

  assert.strictEqual(longDetachedStyles.length, 1);
  assert.strictEqual(detachedFillStyleReads, 1, "Detached fill style must be read once for the whole segment");
  assert.strictEqual(detachedTextStyleReads, 1, "Detached text style must be read once for the whole segment");
}

const pointWriterTypographyExamples = [];

function expectClean(input, expected) {
  const actual = cleanTypography(input);
  const pointEdits = calculatePointTextEdits(input, actual);

  pointWriterTypographyExamples.push({ input, expected });

  assert.strictEqual(actual, expected, input);
  assert.strictEqual(applyPointTextEditsToString(input, pointEdits), actual, `${input} point edits`);
  assert.strictEqual(cleanTypography(actual), expected, `${input} should be idempotent`);
  assert.strictEqual(calculatePointTextEdits(actual, expected).length, 0, `${input} clean text should not have point edits`);
}

function expectDevelopmentIdempotent(input, expected) {
  const first = cleanTypographyWithMetadata(input, developmentOptions);
  const secondWithMarkers = cleanTypographyWithMetadata(first.text, developmentOptions, first.developmentMarkerIndexes);
  const pointEdits = calculatePointTextEdits(input, first.text);

  assert.strictEqual(first.text, expected, `${input} first development run`);
  assert.strictEqual(applyPointTextEditsToString(input, pointEdits), first.text, `${input} development point edits`);
  assert.strictEqual(secondWithMarkers.text, expected, `${input} second development run with marker indexes`);
}

function expectDevelopmentStableWithoutMarkers(input, expected = input) {
  const actual = cleanTypographyWithMetadata(input, developmentOptions);

  assert.strictEqual(actual.text, expected, `${input} development run without marker indexes`);
  assert.strictEqual(applyPointTextEditsToString(input, calculatePointTextEdits(input, actual.text)), actual.text);
}

function findLocalPointEditAlignmentReference(oldParts, newParts, oldStart, newStart) {
  const lookahead = 32;
  const oldEnd = Math.min(oldParts.length, oldStart + lookahead + 1);
  const newEnd = Math.min(newParts.length, newStart + lookahead + 1);
  let best = null;

  const hasStableAnchor = (oldCandidate, newCandidate) => {
    const availableLength = Math.min(oldParts.length - oldCandidate, newParts.length - newCandidate);
    const requiredLength = Math.min(4, availableLength);

    if (requiredLength === 0) return false;

    for (let offset = 0; offset < requiredLength; offset += 1) {
      if (oldParts[oldCandidate + offset] !== newParts[newCandidate + offset]) return false;
    }

    return true;
  };

  for (let oldCandidate = oldStart; oldCandidate < oldEnd; oldCandidate += 1) {
    for (let newCandidate = newStart; newCandidate < newEnd; newCandidate += 1) {
      if (oldParts[oldCandidate] !== newParts[newCandidate] || !hasStableAnchor(oldCandidate, newCandidate)) continue;
      const score = oldCandidate - oldStart + (newCandidate - newStart);

      if (score !== 0 && (best === null || score < best.score)) {
        best = { oldIndex: oldCandidate, newIndex: newCandidate, score };
      }
    }
  }

  return best === null ? null : { oldIndex: best.oldIndex, newIndex: best.newIndex };
}

function buildPointTextEditStyleMapReference(oldText, styles, edits) {
  const styleMap = new Array(oldText.length).fill(0);

  for (let styleIndex = 0; styleIndex < styles.length; styleIndex += 1) {
    for (let index = styles[styleIndex].start; index < styles[styleIndex].end; index += 1) {
      styleMap[index] = styleIndex;
    }
  }

  for (let editIndex = edits.length - 1; editIndex >= 0; editIndex -= 1) {
    const edit = edits[editIndex];
    let insertedStyles;

    if (edit.start === edit.end) {
      const leadingWhitespaceLength = edit.insertText.match(/^[ \t\r\n\u00A0]+/)?.[0].length ?? 0;
      const leftStyleIndex = edit.start > 0 ? styleMap[edit.start - 1] : undefined;
      const rightStyleIndex = edit.start < oldText.length ? styleMap[edit.start] : undefined;
      const defaultStyleIndex = rightStyleIndex ?? leftStyleIndex ?? 0;
      insertedStyles = new Array(edit.insertText.length).fill(defaultStyleIndex);

      if (leftStyleIndex !== undefined && leadingWhitespaceLength > 0) {
        insertedStyles.fill(leftStyleIndex, 0, leadingWhitespaceLength);
      }
    } else {
      const sourcePosition = getPointTextEditStyleSourcePosition(oldText, edit);
      insertedStyles = new Array(edit.insertText.length).fill(styleMap[sourcePosition] ?? 0);
    }

    styleMap.splice(edit.start, edit.end - edit.start, ...insertedStyles);
  }

  return styleMap;
}

function runPointTextEditAlignmentEquivalenceTests() {
  const repeatedCases = [
    [Array(70).fill("."), Array(70).fill(".")],
    [Array.from("абракадабра".repeat(7)), Array.from("кадабраабра".repeat(6))],
    [Array(40).fill(" ").concat(Array(40).fill("а")), Array(20).fill(" ").concat(Array(60).fill("а"))],
  ];

  for (const [oldParts, newParts] of repeatedCases) {
    for (const oldStart of [0, 1, 17, 35]) {
      for (const newStart of [0, 2, 19, 36]) {
        assert.deepStrictEqual(
          JSON.parse(JSON.stringify(findLocalPointEditAlignment(oldParts, newParts, oldStart, newStart))),
          findLocalPointEditAlignmentReference(oldParts, newParts, oldStart, newStart)
        );
      }
    }
  }

  let state = 0x716f31;
  const units = ["а", "б", " ", ".", "…", "?", "!", "👩‍💻"];
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };

  for (let caseIndex = 0; caseIndex < 20000; caseIndex += 1) {
    const oldParts = Array.from({ length: 1 + (next() % 80) }, () => units[next() % units.length]);
    const newParts = Array.from({ length: 1 + (next() % 80) }, () => units[next() % units.length]);
    const oldStart = next() % oldParts.length;
    const newStart = next() % newParts.length;

    assert.deepStrictEqual(
      JSON.parse(JSON.stringify(findLocalPointEditAlignment(oldParts, newParts, oldStart, newStart))),
      findLocalPointEditAlignmentReference(oldParts, newParts, oldStart, newStart),
      `Nearest-first alignment must match the former exhaustive search in case ${caseIndex}`
    );
  }
}

function runPointTextEditCalculationTests() {
  assert.strictEqual(calculatePointTextEdits("Без изменений", "Без изменений").length, 0);
  assert.strictEqual(applyPointTextEditsToString("", calculatePointTextEdits("", "Новый текст")), "Новый текст");
  assert.strictEqual(applyPointTextEditsToString("Старый текст", calculatePointTextEdits("Старый текст", "")), "");
  assert.strictEqual(
    getPointTextEditStyleSourcePosition(" - ", { start: 0, end: 3, insertText: " — " }),
    1,
    "A replacement containing spaces must inherit the style of the meaningful original sign"
  );
  assert.strictEqual(
    getPointTextEditStyleSourcePosition("Текст", { start: 5, end: 5, insertText: "!" }),
    4,
    "An insertion at the end must inherit the preceding character style"
  );
  const boundaryReplacementNode = createProcessTextNodeMock("boundary-replacement-operation", " - ", null);
  const boundaryReplacementCalls = [];
  boundaryReplacementNode.insertCharacters = (start, value, useStyle) => {
    boundaryReplacementCalls.push(["insert", start, value, useStyle]);
    boundaryReplacementNode.characters = `${boundaryReplacementNode.characters.slice(0, start)}${value}${boundaryReplacementNode.characters.slice(start)}`;
  };
  boundaryReplacementNode.deleteCharacters = (start, end) => {
    boundaryReplacementCalls.push(["delete", start, end]);
    boundaryReplacementNode.characters = `${boundaryReplacementNode.characters.slice(0, start)}${boundaryReplacementNode.characters.slice(end)}`;
  };
  const boundaryReplacementEdit = { start: 0, end: 3, insertText: " — " };
  applyPointTextEditsToTextNode(boundaryReplacementNode, [boundaryReplacementEdit]);
  assert.strictEqual(boundaryReplacementNode.characters, " — ");
  assert.deepStrictEqual(boundaryReplacementCalls, [
    ["insert", 1, " — ", "AFTER"],
    ["delete", 4, 6],
    ["delete", 0, 1],
  ]);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(buildPointTextEditStyleMap(" - ", [
      { start: 0, end: 1 },
      { start: 1, end: 2 },
      { start: 2, end: 3 },
    ], [boundaryReplacementEdit]))),
    [1, 1, 1]
  );

  const currencyMoveSource = "$123";
  const currencyMoveTarget = `123${NBSP}$`;
  const currencyMoveEdits = calculatePointTextEdits(currencyMoveSource, currencyMoveTarget);
  const currencyMoveStyleMap = buildPointTextEditStyleMap(currencyMoveSource, [
    { start: 0, end: 1 },
    { start: 1, end: currencyMoveSource.length },
  ], currencyMoveEdits);

  assert.strictEqual(applyPointTextEditsToString(currencyMoveSource, currencyMoveEdits), currencyMoveTarget);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(currencyMoveStyleMap)), [1, 1, 1, 1, 0]);

  const repeatedCurrencySource = "₽10000—₽20000";
  const repeatedCurrencyTarget = `10${NBSP}000${NBSP}— 20${NBSP}000${NBSP}₽`;
  const repeatedCurrencyStyleMap = buildPointTextEditStyleMap(repeatedCurrencySource, [
    { start: 0, end: 1 },
    { start: 1, end: 7 },
    { start: 7, end: 8 },
    { start: 8, end: repeatedCurrencySource.length },
  ], calculatePointTextEdits(repeatedCurrencySource, repeatedCurrencyTarget));

  assert.strictEqual(repeatedCurrencyStyleMap[repeatedCurrencyTarget.lastIndexOf("₽")], 2);

  const insertionSource = "Первый второй";
  const insertionTarget = `Первый${NBSP}и второй`;
  const insertionEdits = calculatePointTextEdits(insertionSource, insertionTarget);
  assert.strictEqual(applyPointTextEditsToString(insertionSource, insertionEdits), insertionTarget);

  const repeatedSource = "слово слово слово";
  const repeatedTarget = `слово${NBSP}слово слово`;
  assert.strictEqual(
    applyPointTextEditsToString(repeatedSource, calculatePointTextEdits(repeatedSource, repeatedTarget)),
    repeatedTarget
  );

  const multilineSource = "Первая строка...\nВторая  строка";
  const multilineTarget = `Первая строка…\nВторая${NBSP}строка`;
  assert.strictEqual(
    applyPointTextEditsToString(multilineSource, calculatePointTextEdits(multilineSource, multilineTarget)),
    multilineTarget
  );

  const emojiSource = "👩‍💻 и 👍🏽";
  const emojiTarget = "👨‍💻 и 👍🏽!";
  const emojiEdits = calculatePointTextEdits(emojiSource, emojiTarget);
  assert.strictEqual(applyPointTextEditsToString(emojiSource, emojiEdits), emojiTarget);
  assert.strictEqual(emojiEdits[0].start, 0);
  assert.strictEqual(emojiEdits[0].end, "👩‍💻".length);

  const combiningSource = "йод";
  const combiningTarget = "йод";
  const combiningEdits = calculatePointTextEdits(combiningSource, combiningTarget);
  assert.strictEqual(applyPointTextEditsToString(combiningSource, combiningEdits), combiningTarget);
  assert.strictEqual(combiningEdits[0].end, "й".length);

  const sandboxIntl = vm.runInContext("Intl", context);

  try {
    vm.runInContext("globalThis.Intl = undefined", context);
    assert.strictEqual(
      applyPointTextEditsToString(emojiSource, calculatePointTextEdits(emojiSource, emojiTarget)),
      emojiTarget,
      "Point edits must work in the Figma sandbox without Intl"
    );

    for (const cluster of ["🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}", "क्ष", "நி", "가"]) {
      assert.strictEqual(segmentTextForPointEdits(cluster).length, 1, `Fallback must keep ${cluster} together`);
    }

  } finally {
    context.Intl = sandboxIntl;
  }

  const longSource = `${"а".repeat(5000)}x${"б".repeat(5000)}y`;
  const longTarget = `${"а".repeat(5000)}X${"б".repeat(5000)}Y`;
  const longEdits = calculatePointTextEdits(longSource, longTarget);
  assert.strictEqual(applyPointTextEditsToString(longSource, longEdits), longTarget);
  assert.strictEqual(longEdits.length, 2);

  for (const replacementCount of [1025, 2000]) {
    const denseSource = "а дом ".repeat(replacementCount);
    const denseTarget = cleanTypography(denseSource);
    const denseEdits = calculatePointTextEdits(denseSource, denseTarget);

    assert.strictEqual(applyPointTextEditsToString(denseSource, denseEdits), denseTarget);
    assert(denseEdits.length >= replacementCount, `Dense point edits must stay local for ${replacementCount} replacements`);
    assert(denseEdits.every((edit) => edit.insertText.length <= 4096));
  }

  const manyEllipsesSource = Array(10000).fill("слово...").join(" ");
  const manyEllipsesTarget = cleanTypography(manyEllipsesSource);
  const manyEllipsesEdits = calculatePointTextEdits(manyEllipsesSource, manyEllipsesTarget);

  assert.strictEqual(
    applyPointTextEditsToString(manyEllipsesSource, manyEllipsesEdits),
    manyEllipsesTarget,
    "A layer with 10,000 ellipses must be processed instead of rejected"
  );
  assert.strictEqual(manyEllipsesEdits.length, 10000);
  const manyEllipsesCoalesced = coalesceDensePointTextEdits(manyEllipsesSource, manyEllipsesEdits, [
    { start: 0, end: manyEllipsesSource.length },
  ]);
  assert.strictEqual(manyEllipsesCoalesced.length, 1, "Dense edits in one style segment must use one Figma write");
  assert.strictEqual(applyPointTextEditsToString(manyEllipsesSource, manyEllipsesCoalesced), manyEllipsesTarget);
  const manyEllipsesStyleMap = buildPointTextEditStyleMap(
    manyEllipsesSource,
    [{ start: 0, end: manyEllipsesSource.length }],
    manyEllipsesCoalesced
  );
  assert.strictEqual(manyEllipsesStyleMap.length, manyEllipsesTarget.length);
  assert(manyEllipsesStyleMap.every((styleIndex) => styleIndex === 0));

  const wideGapSource = `${"а ".repeat(256)}${"неизменённый фрагмент ".repeat(500)}б `;
  const wideGapEdits = [
    ...Array.from({ length: 256 }, (_, index) => ({ start: index * 2 + 1, end: index * 2 + 2, insertText: NBSP })),
    { start: wideGapSource.length - 1, end: wideGapSource.length, insertText: NBSP },
  ];
  const wideGapCoalesced = coalesceDensePointTextEdits(wideGapSource, wideGapEdits, [
    { start: 0, end: wideGapSource.length },
  ]);
  assert.strictEqual(wideGapCoalesced.length, 2, "A distant edit must not capture a huge unchanged text fragment");

  const repeatedMathSource = "Формула 2 * 2 = 4. ".repeat(2500);
  const repeatedMathTarget = cleanTypography(repeatedMathSource);
  const repeatedMathStartedAt = Date.now();
  const repeatedMathEdits = calculatePointTextEdits(repeatedMathSource, repeatedMathTarget);
  const repeatedMathDurationMs = Date.now() - repeatedMathStartedAt;
  assert.strictEqual(applyPointTextEditsToString(repeatedMathSource, repeatedMathEdits), repeatedMathTarget);
  assert(repeatedMathDurationMs < 2000, `Repeated math point planning took ${repeatedMathDurationMs} ms`);

  const styledDenseSource = "а дом ".repeat(600);
  const styledDenseTarget = cleanTypography(styledDenseSource);
  const styledDenseEdits = calculatePointTextEdits(styledDenseSource, styledDenseTarget);
  const styledDenseSegments = [];

  for (let start = 0; start < styledDenseSource.length; start += 120) {
    styledDenseSegments.push({ start, end: Math.min(styledDenseSource.length, start + 120) });
  }

  const coalescedDenseEdits = coalesceDensePointTextEdits(styledDenseSource, styledDenseEdits, styledDenseSegments);
  assert.strictEqual(applyPointTextEditsToString(styledDenseSource, coalescedDenseEdits), styledDenseTarget);
  assert(coalescedDenseEdits.length < styledDenseEdits.length);
  assert.strictEqual(coalescedDenseEdits.length, styledDenseSegments.length);
  assert(coalescedDenseEdits.every((edit) => styledDenseSegments.some((style) => style.start <= edit.start && edit.end <= style.end)));
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(buildPointTextEditStyleMap(styledDenseSource, styledDenseSegments, coalescedDenseEdits))),
    JSON.parse(JSON.stringify(buildPointTextEditStyleMap(styledDenseSource, styledDenseSegments, styledDenseEdits)))
  );

  const exhaustiveAlphabet = ["а", " ", "…", "👩‍💻"];
  const exhaustiveSamples = [""];

  for (const first of exhaustiveAlphabet) {
    exhaustiveSamples.push(first);

    for (const second of exhaustiveAlphabet) {
      exhaustiveSamples.push(`${first}${second}`);
    }
  }

  for (const source of exhaustiveSamples) {
    for (const target of exhaustiveSamples) {
      assert.strictEqual(
        applyPointTextEditsToString(source, calculatePointTextEdits(source, target)),
        target,
        `Point edit exhaustive pair ${JSON.stringify(source)} -> ${JSON.stringify(target)}`
      );
    }
  }

  let randomState = 0x51f15e;
  const randomUnits = ["а", "б", " ", "?", "!", "…", "👩‍💻", "👍🏽", "🇷🇺", "й", "\n"];
  const nextRandom = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState;
  };
  const createRandomText = () => {
    let value = "";
    const length = nextRandom() % 18;

    for (let index = 0; index < length; index += 1) {
      value += randomUnits[nextRandom() % randomUnits.length];
    }

    return value;
  };

  for (let index = 0; index < 5000; index += 1) {
    const source = createRandomText();
    const target = createRandomText();
    const edits = calculatePointTextEdits(source, target);
    const styles = [];
    let styleStart = 0;

    while (styleStart < source.length) {
      const styleEnd = Math.min(source.length, styleStart + 1 + (nextRandom() % 4));
      styles.push({ start: styleStart, end: styleEnd });
      styleStart = styleEnd;
    }

    assert.strictEqual(applyPointTextEditsToString(source, edits), target, `Seeded point edit pair ${index}`);
    assert.deepStrictEqual(
      JSON.parse(JSON.stringify(buildPointTextEditStyleMap(source, styles, edits))),
      buildPointTextEditStyleMapReference(source, styles, edits),
      `Linear style map must match the former splice-based result in case ${index}`
    );
  }
}

runPointTextEditAlignmentEquivalenceTests();
runPointTextEditCalculationTests();

expectClean(
  "Она спросила \"как дела?\". Я подумала \"ну всё... приехали!\". \"Она сказала: \"Я приду завтра!\"\".",
  `Она спросила «как дела?» Я${NBSP}подумала «ну${NBSP}всё… приехали!» «Она сказала: „Я${NBSP}приду завтра!“»`
);
expectClean("«Она сказала: „Я приду завтра!“»", `«Она сказала: „Я${NBSP}приду завтра!“»`);
expectClean("«Ты правда спросил „зачем?“?»", `«Ты${NBSP}правда спросил „зачем?“»`);
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
expectClean("...", "…");
expectClean("слово...слово", "слово…слово");
expectClean("....", "....");
expectClean(".....", ".....");
expectClean("......", "......");
expectClean('He said "Use "clean typography" mode".', 'He said "Use \'clean typography\' mode".');
expectClean('He said "Use \'clean typography\' mode".', 'He said "Use \'clean typography\' mode".');
expectClean('He said "The word "привет" means hello".', 'He said "The word \'привет\' means hello".');
expectClean("Что?? Да!! Правда!?", "Что? Да! Правда?!");
expectClean("!?!!", "!?!");
expectClean("?!?", "?!?");
expectClean("?!?!", "?!?!");
expectClean("слово : значение", "слово: значение");

for (const smiley of [":)", ";)", ":-)", ";-)"]) {
  expectClean(`посмеялся${smiley}`, `посмеялся${smiley}`);
  expectClean(`посмеялся ${smiley}`, `посмеялся ${smiley}`);
  expectClean(`я ${smiley}`, `я ${smiley}`);
  expectDevelopmentIdempotent(`я ${smiley}`, `я ${smiley}`);
}

expectClean("5 1000 - 1000", "5 1000 - 1000");

for (let length = 1; length <= 10; length += 1) {
  for (let mask = 0; mask < 2 ** length; mask += 1) {
    let punctuation = "";

    for (let index = 0; index < length; index += 1) {
      punctuation += (mask >> index) & 1 ? "?" : "!";
    }

    const first = cleanTypography(punctuation);
    assert.strictEqual(cleanTypography(first), first, `${punctuation} must be stable after the first run`);
  }
}

for (const insideMark of ["?", "!"]) {
  for (const outsideMark of ["?", "!"]) {
    const input = `«Он сказал „текст${insideMark}“${outsideMark}»`;
    const first = cleanTypography(input);
    assert.strictEqual(cleanTypography(first), first, `${input} must be stable after punctuation moves inside quotes`);
  }
}

expectDevelopmentIdempotent("«Она сказала: „Я приду завтра!“»", "«Она сказала: „Я*приду завтра!“»");
expectDevelopmentIdempotent("«Ты правда спросил „зачем??“»", "«Ты*правда спросил „зачем?“»");
expectDevelopmentIdempotent("«Ты правда спросил „зачем?“?»", "«Ты*правда спросил „зачем?“»");
expectDevelopmentIdempotent(
  "«„Как это скучно!“ — воскликнул я невольно».\n«Она сказала: „Я приду завтра!“»\n«Ты правда спросил „зачем??“»",
  "«„Как это скучно!“*— воскликнул я*невольно».\n«Она сказала: „Я*приду завтра!“»\n«Ты*правда спросил „зачем?“»"
);
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
expectClean("2 000-4 000", `2 000${NBSP}— 4 000`);
expectClean("2 000–4 000", `2 000${NBSP}— 4 000`);
expectClean("2 000—4 000", `2 000${NBSP}— 4 000`);
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
expectClean("••44444", "••44444");
expectClean("**4444", "**4444");
expectClean("**44444", "**44444");
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
expectClean("812345678901234 клиентов", `812345678901234${NBSP}клиентов`);
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
expectClean("По 2000 человек", `По${NBSP}2000${NBSP}человек`);
expectClean("В базе 10000 клиентов.", `В${NBSP}базе 10000${NBSP}клиентов.`);
expectClean("Продано 1234567 билетов", `Продано 1234567${NBSP}билетов`);
expectClean("812345678901234 клиентов", `812345678901234${NBSP}клиентов`);
expectClean("по 10000 человек", `по${NBSP}10000${NBSP}человек`);
expectClean("д. 10000 корпус", `д.${NBSP}10000 корпус`);
expectClean("г. 10000 жителей", `г.${NBSP}10000 жителей`);
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
expectClean("10000", "10000");
expectClean("10000 ₽", `10${NBSP}000${NBSP}₽`);
expectClean("₽10000", `10${NBSP}000${NBSP}₽`);
expectClean("$123", `123${NBSP}$`);
expectClean("€ 123", `123${NBSP}€`);
for (const currencySymbol of ["£", "¥", "₸", "₾", "₴", "₺", "֏", "₪", "₹", "₩", "₫", "฿", "₱"]) {
  expectClean(`${currencySymbol}123`, `123${NBSP}${currencySymbol}`);
}
expectClean("₽ 50 тыс.", `50${NBSP}тыс.${NBSP}₽`);
expectClean("$50 миллионов", `50${NBSP}миллионов${NBSP}$`);
expectClean("$50 товаров", `50${NBSP}$ товаров`);
expectClean("$123USD", "$123USD");
expectClean("Цена ($123).", `Цена (123${NBSP}$).`);
expectClean("RUB 10000", `RUB 10${NBSP}000`);
expectClean("рублей 10000", `рублей 10${NBSP}000`);
expectClean("10000%", `10${NBSP}000%`);
expectClean("10000 кг", `10${NBSP}000${NBSP}кг`);
expectClean("10000 руб", `10${NBSP}000${NBSP}руб.`);
expectClean("10000 DPI", `10${NBSP}000${NBSP}dpi`);
expectClean("10000 клиентов", `10000${NBSP}клиентов`);
expectClean("код 12345 кг", `код 12${NBSP}345${NBSP}кг`);
expectClean("ID 12345 ₽", `ID 12345${NBSP}₽`);
expectClean("8841475834769921 ₽", `8${NBSP}841${NBSP}475${NBSP}834${NBSP}769${NBSP}921${NBSP}₽`);
expectClean("8841 4758 3476 9921 ₽", `8841 4758 3476 9921${NBSP}₽`);
expectClean("00001000 ₽", `00${NBSP}001${NBSP}000${NBSP}₽`);
expectClean("+79001234567 ₽", `+79${NBSP}001${NBSP}234${NBSP}567${NBSP}₽`);
expectClean("+7 (900) 123-45-67 ₽", `+7${NBSP}900${NBSP}123${NB_HYPHEN}45${NB_HYPHEN}67${NBSP}₽`);
expectClean("Телефон: +79001234567 ₽", `Телефон: +7${NBSP}900${NBSP}123${NB_HYPHEN}45${NB_HYPHEN}67${NBSP}₽`);
expectClean("+79001234567 кг", `+7${NBSP}900${NBSP}123${NB_HYPHEN}45${NB_HYPHEN}67${NBSP}кг`);
expectClean("338.00", "338.00");
expectClean("338.00 ₽", `338,00${NBSP}₽`);
expectClean("$338.00", `338,00${NBSP}$`);
expectClean("$+10000", `+10${NBSP}000${NBSP}$`);
expectClean("₽+79001234567", `+79${NBSP}001${NBSP}234${NBSP}567${NBSP}₽`);
expectClean("₽+7 (900) 123-45-67", `+7${NBSP}900${NBSP}123${NB_HYPHEN}45${NB_HYPHEN}67${NBSP}₽`);
expectClean("RUB-10000", "RUB-10000");
expectClean("RUB10000", "RUB10000");
expectClean("10000RUB", "10000RUB");
expectClean("338.00 кг", `338,00${NBSP}кг`);
expectClean("338.00%", "338,00%");
expectClean("338.00 тыс.", `338,00${NBSP}тыс.`);
expectClean("12,345", "12,345");
expectClean("12,345 ₽", `12,345${NBSP}₽`);
expectClean("1,234,567", "1,234,567");
expectClean("1,234,567 ₽", `1${NBSP}234${NBSP}567${NBSP}₽`);
expectClean("12,345.00 ₽", `12${NBSP}345,00${NBSP}₽`);
expectClean("₽10000—$20000", `10${NBSP}000${NBSP}₽${NBSP}— 20${NBSP}000${NBSP}$`);
expectClean("₽10000—₽20000", `10${NBSP}000${NBSP}— 20${NBSP}000${NBSP}₽`);
expectClean("10000—20000 кг", `10${NBSP}000${NBSP}— 20${NBSP}000${NBSP}кг`);
expectClean("10000, 20000 и 30000 ₽", `10${NBSP}000, 20${NBSP}000${NBSP}и${NBSP}30${NBSP}000${NBSP}₽`);
expectClean("10000 + 20000 = 30000", `10${NBSP}000${NBSP}+${NBSP}20${NBSP}000${NBSP}=${NBSP}30${NBSP}000`);
expectClean("10000 + 20000", `10000${NBSP}+${NBSP}20000`);
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
expectDevelopmentIdempotent("В базе 10000 клиентов.", "В*базе 10000*клиентов.");
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
expectDevelopmentStableWithoutMarkers("Цена: 79*001*234*567*₽.");
expectDevelopmentStableWithoutMarkers("Длинное число: 812*345*678*901*234.", "Длинное число: 812 345 678 901 234.");
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
assert.strictEqual(textDevelopmentToBeauty.text, `В${NBSP}базе 10000${NBSP}клиентов.`);
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

async function runFigmaOperationTimeoutTests() {
  assert.strictEqual(await withFigmaOperationTimeout(async () => "готово", "test_success", 20), "готово");
  await assert.rejects(
    withFigmaOperationTimeout(() => new Promise(() => {}), "test_timeout", 5),
    (error) => error?.name === "FigmaOperationTimeoutError" && /test_timeout/.test(error?.message || "")
  );
}

async function runRollbackTimeoutTests() {
  const originalConsole = context.console;
  context.console = {
    ...console,
    error: () => {},
  };
  const node = createProcessTextNodeMock("rollback-timeout-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalStyle = {
    ...node.getStyledTextSegments()[0],
    textStyleId: "linked-text-style",
  };

  node.componentPropertyReferences = null;
  node.getRangeTextStyleId = () => "wrong-style";
  node.getStyledTextSegments = () => [{ ...originalStyle, fontSize: 18 }];
  node.setTextStyleIdAsync = () => new Promise(() => {});

  const startedAt = Date.now();
  const rollbackResult = await restoreTextLayerSnapshot(
    {
      componentPropertyReferences: null,
      developmentMarkerFills: [],
      developmentMarkerIndexesPluginData: "",
      developmentMarkerTextPluginData: "",
      parentChainIds: ["shared-container"],
      styles: [originalStyle],
      text: "Текст...",
      textNode: node,
    },
    null,
    5
  );

  assert.strictEqual(rollbackResult.succeeded, false);
  assert.strictEqual(rollbackResult.failureDiagnostic.reason, "operation_failed");
  assert.strictEqual(rollbackResult.failureDiagnostic.operation, "restore_whole_text_style");
  assert.strictEqual(rollbackResult.failureDiagnostic.errorName, "FigmaOperationTimeoutError");
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(rollbackResult.failureDiagnostic.verificationFailures)),
    ["styles"]
  );
  assert(Date.now() - startedAt < 250, "A hanging whole-style restore must respect the one rollback deadline");

  await assert.rejects(
    restoreStyleIds(
      {
        getRangeFillStyleId: () => "",
        getRangeTextStyleId: () => "wrong-style",
        id: "hanging-range-style-node",
        setRangeFillStyleIdAsync: async () => {},
        setRangeTextStyleIdAsync: () => new Promise(() => {}),
      },
      0,
      1,
      { fillStyleId: "", textStyleId: "linked-text-style" },
      true,
      Date.now() + 5
    ),
    (error) => error?.name === "FigmaOperationTimeoutError"
  );

  const originalVariableLookup = context.figma.variables.getVariableByIdAsync;
  context.figma.variables.getVariableByIdAsync = () => new Promise(() => {});

  try {
    await assert.rejects(
      restoreBoundVariables(
        { id: "hanging-variable-node", setRangeBoundVariable: () => {} },
        0,
        1,
        { boundVariables: { fontSize: { id: "variable-id", type: "VARIABLE_ALIAS" } } },
        new Map(),
        Date.now() + 5
      ),
      (error) => error?.name === "FigmaOperationTimeoutError"
    );
  } finally {
    context.figma.variables.getVariableByIdAsync = originalVariableLookup;
    context.console = originalConsole;
  }
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

  let failedAttempts = 0;
  const failedCache = new Map();
  const failedFont = { family: "Unavailable Font", style: "Regular" };
  context.figma.loadFontAsync = async () => {
    failedAttempts += 1;
    throw new Error("Font load failure");
  };

  await assert.rejects(getFontLoadPromise(failedFont, failedCache), /Font load failure/);
  await assert.rejects(getFontLoadPromise(failedFont, failedCache), /Font load failure/);
  assert.strictEqual(failedAttempts, 1, "One unavailable font must be tried only once per plugin run");
  assert.strictEqual(failedCache.size, 1);

  const waitingBudget = { remainingMs: 15000 };
  const budgetCache = new Map();
  const budgetLoadedFontKeys = new Set();
  const budgetLoadCalls = [];
  testMonotonicNow = 20000;
  context.figma.loadFontAsync = async (font) => {
    budgetLoadCalls.push(`${font.family}\n${font.style}`);
    testMonotonicNow += font.family === "First Font" ? 4000 : 1000;
  };

  await loadFontsForTextNode(
    {
      characters: "Первый слой",
      getRangeAllFontNames: () => [{ family: "First Font", style: "Regular" }],
      id: "first-budget-node",
    },
    budgetCache,
    budgetLoadedFontKeys,
    waitingBudget
  );
  assert.strictEqual(waitingBudget.remainingMs, 11000);

  // Simulate more than 15 seconds of typography and writing work between layers.
  // This time must not consume the font waiting budget.
  testMonotonicNow = 60000;
  await loadFontsForTextNode(
    {
      characters: "Второй слой",
      getRangeAllFontNames: () => [{ family: "Second Font", style: "Regular" }],
      id: "second-budget-node",
    },
    budgetCache,
    budgetLoadedFontKeys,
    waitingBudget
  );
  assert.deepStrictEqual(budgetLoadCalls, ["First Font\nRegular", "Second Font\nRegular"]);
  assert.strictEqual(waitingBudget.remainingMs, 10000);
  testMonotonicNow = 0;

  let exhaustedBudgetAttempts = 0;
  context.figma.loadFontAsync = async () => {
    exhaustedBudgetAttempts += 1;
  };
  const originalConsole = context.console;
  context.console = { ...console, error: () => {} };
  try {
    await assert.rejects(
      loadFontsForTextNode(
        {
          characters: "Запас исчерпан",
          getRangeAllFontNames: () => [{ family: "Third Font", style: "Regular" }],
          id: "exhausted-budget-node",
        },
        new Map(),
        new Set(),
        { remainingMs: 0 }
      ),
      (error) => error?.name === "FigmaOperationTimeoutError"
    );
  } finally {
    context.console = originalConsole;
  }
  assert.strictEqual(exhaustedBudgetAttempts, 0);

  let afterDeadlineAttempts = 0;
  context.figma.loadFontAsync = async () => {
    afterDeadlineAttempts += 1;
  };
  await assert.rejects(
    getFontLoadPromise({ family: "Late Font", style: "Regular" }, new Map(), new Set(), Date.now() - 1),
    (error) => error?.name === "FigmaOperationTimeoutError"
  );
  assert.strictEqual(afterDeadlineAttempts, 0, "No new font request may start after the font waiting budget is exhausted");
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

function runDevelopmentMarkerScanTests() {
  const text = "*".repeat(10000);
  let styledSegmentReads = 0;
  let singleCharacterFillReads = 0;
  const node = {
    characters: text,
    getPluginData: () => "",
    getRangeFills: () => {
      singleCharacterFillReads += 1;
      return [];
    },
    getStyledTextSegments: () => {
      styledSegmentReads += 1;
      return [{ end: text.length, fills: [], start: 0 }];
    },
    id: "many-development-markers-node",
  };

  assert.deepStrictEqual(Array.from(getExistingDevelopmentMarkerIndexes(node)), []);
  assert.strictEqual(captureDevelopmentMarkerFills(node, text).length, text.length);
  assert.strictEqual(styledSegmentReads, 2, "Marker inspection must read styled segments once per operation");
  assert.strictEqual(singleCharacterFillReads, 0, "Marker inspection must not ask Figma about every star separately");
}

function runProblemLayerPreviewTests() {
  const longText = `Начало${NBSP}${"очень длинного текста ".repeat(40)}👩‍💻`;
  const preview = createProblemLayerTextPreview(longText);

  assert(preview.length <= 321);
  assert(preview.endsWith("…"));
  assert(preview.includes(NBSP), "A non-breaking space must stay intact in the problem-layer preview");
  assert.strictEqual(createProblemLayerTextPreview("Короткий текст"), "Короткий текст");

  const hugeText = `${"Очень длинный текст ".repeat(60000)}👩‍💻`;
  const startedAt = Date.now();
  const hugePreview = createProblemLayerTextPreview(hugeText);
  assert(hugePreview.length <= 321);
  assert(Date.now() - startedAt < 250, "A huge layer preview must inspect only the visible prefix");
}

function runPhoneLayoutPerformanceTests() {
  const nodes = [];

  for (let index = 0; index < 5000; index += 1) {
    nodes.push(
      createProcessTextNodeMock(
        `phone-prefix-${index}`,
        "+7",
        { height: 20, width: 10, x: 0, y: index * 30 },
        "phone-layout-container"
      )
    );
    nodes.push(
      createProcessTextNodeMock(
        `phone-tail-${index}`,
        "900 123-45-67",
        { height: 20, width: 100, x: 15, y: 200000 + index * 30 },
        "phone-layout-container"
      )
    );
  }

  const startedAt = Date.now();
  const prefixIds = getStandalonePhoneCountryPrefixIds(nodes);
  const durationMs = Date.now() - startedAt;

  assert.strictEqual(prefixIds.size, 0);
  assert(durationMs < 1500, `Phone layout lookup took ${durationMs} ms for repeated horizontal positions`);
}

function runNumberLayerContextPerformanceTests() {
  const numberNodes = [];

  for (let index = 0; index < 5000; index += 1) {
    const amount = createProcessTextNodeMock(
      `number-context-performance-amount-${index}`,
      "10000",
      { height: 20, width: 60, x: 0, y: index * 24 },
      null
    );
    const currency = createProcessTextNodeMock(
      `number-context-performance-currency-${index}`,
      "₽",
      { height: 20, width: 12, x: 70, y: index * 24 },
      null
    );
    connectHorizontalAutoLayoutParent(`number-context-performance-parent-${index}`, [amount, currency]);
    numberNodes.push(amount);
  }

  const startedAt = Date.now();
  const contexts = buildNumberLayerContexts(numberNodes);
  const durationMs = Date.now() - startedAt;

  assert.strictEqual(contexts.size, numberNodes.length);
  assert(durationMs < 1500, `Number context lookup took ${durationMs} ms for ${numberNodes.length} layers`);
}

function runNumberDiagnosticSpatialContextPerformanceTests() {
  const nodes = [];
  const root = {
    id: "diagnostic-performance-root",
    layoutMode: "VERTICAL",
    locked: false,
    parent: null,
    type: "FRAME",
    visible: true,
  };

  for (let index = 0; index < 2000; index += 1) {
    const y = index * 24;
    const label = createProcessTextNodeMock(
      `diagnostic-performance-label-${index}`,
      "Счёт зачисления",
      { height: 20, width: 110, x: 0, y },
      null
    );
    const value = createProcessTextNodeMock(
      `diagnostic-performance-value-${index}`,
      "12345678912345678902",
      { height: 20, width: 180, x: 150, y },
      null
    );
    label.parent = {
      children: [label],
      id: `diagnostic-performance-label-wrapper-${index}`,
      layoutMode: "NONE",
      locked: false,
      parent: root,
      type: "FRAME",
      visible: true,
    };
    value.parent = {
      children: [value],
      id: `diagnostic-performance-value-wrapper-${index}`,
      layoutMode: "NONE",
      locked: false,
      parent: root,
      type: "FRAME",
      visible: true,
    };
    nodes.push(label, value);
  }

  const startedAt = Date.now();
  const contexts = buildNumberDiagnosticLayerContexts(nodes);
  const durationMs = Date.now() - startedAt;

  assert.strictEqual(contexts.size, 2000);
  assert(durationMs < 1500, `Diagnostic number context lookup took ${durationMs} ms for ${nodes.length} layers`);
}

function createProcessTextNodeMock(id, characters, absoluteBoundingBox, parentId = "shared-container") {
  const font = { family: "Inter", style: "Regular" };

  const node = {
    absoluteBoundingBox,
    characters,
    layoutPositioning: "AUTO",
    locked: false,
    maxLines: null,
    rotation: 0,
    textAutoResize: "WIDTH_AND_HEIGHT",
    textTruncation: "DISABLED",
    type: "TEXT",
    visible: true,
    fillStyleId: "",
    getPluginData: () => "",
    getRangeAllFontNames: () => [font],
    getRangeFillStyleId: () => "",
    getRangeFills: () => [],
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
    insertCharacters: (start, value) => {
      node.characters = `${node.characters.slice(0, start)}${value}${node.characters.slice(start)}`;
    },
    parent: parentId === null ? null : { id: parentId },
    deleteCharacters: (start, end) => {
      node.characters = `${node.characters.slice(0, start)}${node.characters.slice(end)}`;
    },
    setPluginData: () => {},
    setTextStyleIdAsync: async () => {},
    textStyleId: "",
  };

  return node;
}

function connectHorizontalAutoLayoutParent(id, nodes) {
  const parent = {
    children: nodes,
    id,
    layoutMode: "HORIZONTAL",
    layoutWrap: "NO_WRAP",
    locked: false,
    parent: null,
    type: "FRAME",
    visible: true,
  };

  for (const node of nodes) {
    node.parent = parent;
  }

  return parent;
}

function configureFigmaUndoForNodes(nodes, restoreOnUndo = true) {
  let commitCalls = 0;
  let snapshots = [];
  let triggerCalls = 0;

  context.figma.commitUndo = () => {
    commitCalls += 1;
    snapshots = nodes.map((node) => ({
      characters: node.characters,
      customState: typeof node.captureUndoState === "function" ? node.captureUndoState() : undefined,
      node,
    }));
  };
  context.figma.triggerUndo = () => {
    triggerCalls += 1;

    if (!restoreOnUndo) {
      return;
    }

    for (const snapshot of snapshots) {
      snapshot.node.characters = snapshot.characters;

      if (typeof snapshot.node.restoreUndoState === "function") {
        snapshot.node.restoreUndoState(snapshot.customState);
      }
    }
  };

  return {
    getCommitCalls: () => commitCalls,
    getTriggerCalls: () => triggerCalls,
  };
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
  const undo = configureFigmaUndoForNodes([node]);
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
  assert.strictEqual(rollbackStyleRestorations, 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);
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
  const laterNode = createProcessTextNodeMock("not-reached-after-critical-node", "Позже...", { height: 20, width: 80, x: 0, y: 30 });
  const originalGetStyledTextSegments = node.getStyledTextSegments;
  const originalConsole = context.console;
  let styleRestorationAttempted = false;

  context.figma.loadFontAsync = async () => {};
  node.getRangeTextStyleId = () => "";
  node.getStyledTextSegments = () => {
    const originalStyle = originalGetStyledTextSegments()[0];

    return [
      {
        ...originalStyle,
        fontSize: styleRestorationAttempted ? 18 : 16,
      },
    ];
  };
  node.setTextStyleIdAsync = async () => {
    styleRestorationAttempted = true;
    throw new Error("Style restoration failed");
  };
  const undo = configureFigmaUndoForNodes([node, laterNode]);
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([node, laterNode], 0, 0, beautyOptions, "full");
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
  assert.strictEqual(result.originalFailureStage, "restore_styles");
  assert.strictEqual(result.originalFailureDiagnostic.category, "restore_styles_failed");
  assert.strictEqual(result.rollbackFailureDiagnostic.reason, "operation_failed");
  assert.strictEqual(result.rollbackFailureDiagnostic.operation, "restore_whole_text_style");
  assert.strictEqual(result.rollbackFailureDiagnostic.errorName, "Error");
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result.rollbackFailureDiagnostic.verificationFailures)),
    ["styles"]
  );
  assert.strictEqual(result.requiresStyleWarning, true);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 1);
  assert.strictEqual(undo.getTriggerCalls(), 0);
  assert.strictEqual(laterNode.characters, "Позже...");
  assert.strictEqual(result.successful, 0);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result.problemLayers)),
    [
      {
        kind: "critical_integrity",
        nodeId: "detected-rollback-damage-node",
        nodePath: "",
        textPreview: "Текст...",
      },
      {
        kind: "not_reached",
        nodeId: "not-reached-after-critical-node",
        nodePath: "",
        textPreview: "Позже...",
      },
    ]
  );
}

async function runUnavailableLinkedStylePreflightTests() {
  const node = createProcessTextNodeMock("unavailable-linked-style-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalText = node.characters;
  const originalGetStyleByIdAsync = context.figma.getStyleByIdAsync;
  const originalConsole = context.console;
  let styleRestorationAttempts = 0;

  context.figma.loadFontAsync = async () => {};
  context.figma.getStyleByIdAsync = async () => null;
  node.setTextStyleIdAsync = async () => {
    styleRestorationAttempts += 1;
  };
  const undo = configureFigmaUndoForNodes([node]);
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([node], 0, 0, beautyOptions, "full");
  } finally {
    context.console = originalConsole;
    context.figma.getStyleByIdAsync = originalGetStyleByIdAsync;
  }

  assertTextProcessCounts(result, {
    changed: 0,
    failed: 1,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(node.characters, originalText);
  assert.strictEqual(styleRestorationAttempts, 0);
  assert.strictEqual(result.failedStage, "restore_styles");
  assert.strictEqual(result.failureDiagnostic.category, "restore_styles_failed");
  assert.strictEqual(result.requiresStyleWarning, false);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 0);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(undo.getCommitCalls(), 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);

  const pointNode = createProcessTextNodeMock("point-linked-resources-node", "Текст...", { height: 20, width: 80, x: 0, y: 30 });
  const pointSegments = pointNode.getStyledTextSegments;
  let linkedResourceLookupCalls = 0;

  pointNode.getRangeTextStyleId = () => "phone-style-id";
  pointNode.getStyledTextSegments = () =>
    pointSegments().map((segment) => ({
      ...segment,
      boundVariables: {
        fontSize: { id: "point-variable-id", type: "VARIABLE_ALIAS" },
      },
      characters: pointNode.characters,
      end: pointNode.characters.length,
      textStyleId: "phone-style-id",
    }));
  context.figma.getStyleByIdAsync = async () => {
    linkedResourceLookupCalls += 1;
    throw new Error("Point mode must not open a linked style before editing text");
  };
  const originalGetVariableByIdAsync = context.figma.variables.getVariableByIdAsync;
  context.figma.variables.getVariableByIdAsync = async () => {
    linkedResourceLookupCalls += 1;
    throw new Error("Point mode must not open a linked variable before editing text");
  };

  try {
    const pointResult = await processTextNodes([pointNode], 0, 0, beautyOptions, "point");
    assert.strictEqual(pointResult.failed, 0);
    assert.strictEqual(pointResult.changed, 1);
    assert.strictEqual(pointNode.characters, "Текст…");
    assert.strictEqual(linkedResourceLookupCalls, 0);
  } finally {
    context.figma.getStyleByIdAsync = originalGetStyleByIdAsync;
    context.figma.variables.getVariableByIdAsync = originalGetVariableByIdAsync;
  }
}

async function runStandalonePhoneCountryPrefixContextTests() {
  context.figma.loadFontAsync = async () => {};

  const prefix = createProcessTextNodeMock("phone-prefix", "+ 7", { height: 20, width: 20, x: 0, y: 0 });
  const tail = createProcessTextNodeMock("phone-tail", "977 700-10-20", { height: 20, width: 110, x: 26, y: 0 });
  connectHorizontalAutoLayoutParent("phone-auto-layout", [prefix, tail]);
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
  assert.strictEqual(result.analytics.pointEditPlannedLayersCount, 2);
  assert.strictEqual(result.analytics.pointEditMismatchLayersCount, 0);
  assert(result.analytics.pointEditOperationsCount >= 2);
  assert(result.analytics.pointEditMaxOperationsCount >= 1);
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
  assert.strictEqual(mathResult.analytics.pointEditPlannedLayersCount, 0);
  assert.strictEqual(mathResult.analytics.pointEditOperationsCount, 0);
  assert.strictEqual(mathResult.analytics.pointEditMismatchLayersCount, 0);
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

async function runEvidenceBasedNumberLayerContextTests() {
  context.figma.loadFontAsync = async () => {};

  const amount = createProcessTextNodeMock("context-amount", "10000", { height: 20, width: 70, x: 0, y: 0 });
  const currency = createProcessTextNodeMock("context-currency", "₽", { height: 20, width: 12, x: 80, y: 0 });
  currency.locked = true;
  connectHorizontalAutoLayoutParent("context-currency-parent", [amount, currency]);
  const amountResult = await processTextNodes([amount], 0, 0, beautyOptions);

  assertTextProcessCounts(amountResult, {
    changed: 1,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(amount.characters, `10${NBSP}000`);
  assert.strictEqual(currency.characters, "₽");

  const leadingCurrency = createProcessTextNodeMock("leading-context-currency", "$", { height: 20, width: 12, x: 0, y: 20 });
  const leadingAmount = createProcessTextNodeMock("leading-context-amount", "10000", { height: 20, width: 70, x: 20, y: 20 });
  leadingCurrency.locked = true;
  connectHorizontalAutoLayoutParent("leading-context-parent", [leadingCurrency, leadingAmount]);
  const leadingAmountResult = await processTextNodes([leadingAmount], 0, 0, beautyOptions);

  assert.strictEqual(leadingAmountResult.changed, 1);
  assert.strictEqual(leadingCurrency.characters, "$");
  assert.strictEqual(leadingAmount.characters, `10${NBSP}000`);

  const decimal = createProcessTextNodeMock("context-decimal", "338.00", { height: 20, width: 70, x: 0, y: 30 });
  const unit = createProcessTextNodeMock("context-unit", "кг", { height: 20, width: 20, x: 80, y: 30 });
  connectHorizontalAutoLayoutParent("context-unit-parent", [decimal, unit]);
  const decimalResult = await processTextNodes([decimal], 0, 0, beautyOptions);

  assert.strictEqual(decimalResult.failed, 0);
  assert.strictEqual(decimal.characters, "338,00");

  const manualAmount = createProcessTextNodeMock("manual-amount", "10000", { height: 20, width: 70, x: 0, y: 60 });
  const manualCurrency = createProcessTextNodeMock("manual-currency", "₽", { height: 20, width: 12, x: 80, y: 60 });
  const manualParent = connectHorizontalAutoLayoutParent("manual-parent", [manualAmount, manualCurrency]);
  manualParent.layoutMode = "NONE";
  const manualResult = await processTextNodes([manualAmount], 0, 0, beautyOptions);

  assert.strictEqual(manualResult.changed, 0);
  assert.strictEqual(manualAmount.characters, "10000");

  const blockedAmount = createProcessTextNodeMock("blocked-context-amount", "10000", { height: 20, width: 70, x: 0, y: 75 });
  const blockingIcon = {
    id: "blocked-context-icon",
    layoutPositioning: "AUTO",
    locked: false,
    parent: null,
    rotation: 0,
    type: "RECTANGLE",
    visible: true,
  };
  const blockedCurrency = createProcessTextNodeMock("blocked-context-currency", "₽", { height: 20, width: 12, x: 90, y: 75 });
  connectHorizontalAutoLayoutParent("blocked-context-parent", [blockedAmount, blockingIcon, blockedCurrency]);
  const blockedResult = await processTextNodes([blockedAmount], 0, 0, beautyOptions);

  assert.strictEqual(blockedResult.changed, 0);
  assert.strictEqual(blockedAmount.characters, "10000");

  const firstAmount = createProcessTextNodeMock("ambiguous-first", "10000", { height: 20, width: 70, x: 0, y: 90 });
  const sharedCurrency = createProcessTextNodeMock("ambiguous-currency", "₽", { height: 20, width: 12, x: 80, y: 90 });
  const secondAmount = createProcessTextNodeMock("ambiguous-second", "20000", { height: 20, width: 70, x: 100, y: 90 });
  connectHorizontalAutoLayoutParent("ambiguous-parent", [firstAmount, sharedCurrency, secondAmount]);
  const ambiguousResult = await processTextNodes([firstAmount, secondAmount], 0, 0, beautyOptions);

  assert.strictEqual(ambiguousResult.changed, 0);
  assert.strictEqual(firstAmount.characters, "10000");
  assert.strictEqual(secondAmount.characters, "20000");

  const protectedLabel = createProcessTextNodeMock("protected-label", "ID", { height: 20, width: 20, x: 0, y: 120 });
  const protectedNumber = createProcessTextNodeMock("protected-number", "12345", { height: 20, width: 60, x: 30, y: 120 });
  connectHorizontalAutoLayoutParent("protected-parent", [protectedLabel, protectedNumber]);
  const protectedResult = await processTextNodes([protectedNumber], 0, 0, beautyOptions);

  assert.strictEqual(protectedResult.changed, 0);
  assert.strictEqual(protectedNumber.characters, "12345");

  const changingAmount = createProcessTextNodeMock("changing-context-amount", "10000", { height: 20, width: 70, x: 0, y: 150 });
  const changingMarker = createProcessTextNodeMock("changing-context-marker", "₽", { height: 20, width: 20, x: 80, y: 150 });
  connectHorizontalAutoLayoutParent("changing-context-parent", [changingAmount, changingMarker]);
  let markerChanged = false;
  context.figma.loadFontAsync = async () => {
    if (!markerChanged) {
      markerChanged = true;
      changingMarker.characters = "клиенты";
    }
  };
  const changingResult = await processTextNodes([changingAmount], 0, 0, beautyOptions);
  context.figma.loadFontAsync = async () => {};

  assert.strictEqual(changingResult.failed, 0);
  assert.strictEqual(changingResult.changed, 0);
  assert.strictEqual(changingResult.processed, 1);
  assert.strictEqual(changingAmount.characters, "10000");
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
  const undo = configureFigmaUndoForNodes([node]);
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([node], 0, 0, beautyOptions, "full");
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
  assert.strictEqual(styleRestorationAttempts, 1);
  assert.strictEqual(undo.getTriggerCalls(), 0);
  assert.strictEqual(result.failedStage, "restore_styles");
  assert.strictEqual(result.failureDiagnostic.category, "restore_styles_failed");
  assert.strictEqual(result.analytics.charactersChangedTotal, 0);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(result.analytics.styleSegmentsCount, 0);
}

async function runSafeLayerFailureContinuesTests() {
  const firstNode = createProcessTextNodeMock("successful-before-undo-node", "Первый...", { height: 20, width: 80, x: 0, y: 0 });
  const failingNode = createProcessTextNodeMock("failure-triggering-undo-node", "Второй...", { height: 20, width: 80, x: 0, y: 30 });
  const thirdNode = createProcessTextNodeMock("successful-after-safe-failure-node", "Третий...", { height: 20, width: 80, x: 0, y: 60 });
  const originalFirstText = firstNode.characters;
  const originalFailingText = failingNode.characters;
  const originalConsole = context.console;

  context.figma.loadFontAsync = async () => {};
  failingNode.setTextStyleIdAsync = async () => {
    throw new Error("Style restoration failed");
  };
  const undo = configureFigmaUndoForNodes([firstNode, failingNode, thirdNode]);
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([firstNode, failingNode, thirdNode], 0, 0, beautyOptions, "full");
  } finally {
    context.console = originalConsole;
  }

  assertTextProcessCounts(result, {
    changed: 2,
    failed: 1,
    processed: 3,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.notStrictEqual(firstNode.characters, originalFirstText);
  assert.strictEqual(firstNode.characters, "Первый…");
  assert.strictEqual(failingNode.characters, originalFailingText);
  assert.strictEqual(thirdNode.characters, "Третий…");
  assert.strictEqual(result.failedStage, "restore_styles");
  assert.strictEqual(result.requiresStyleWarning, false);
  assert(result.analytics.charactersChangedTotal > 0);
  assert(result.analytics.styleSegmentsCount > 0);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(undo.getCommitCalls(), 1);
  assert.strictEqual(undo.getTriggerCalls(), 0);
  assert.strictEqual(result.successful, 2);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result.problemLayers)),
    [
      {
        kind: "safe_failure",
        nodeId: "failure-triggering-undo-node",
        nodePath: "",
        textPreview: "Второй...",
      },
    ]
  );
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
  const undo = configureFigmaUndoForNodes([failingNode, untouchedNode], false);
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([failingNode, untouchedNode], 0, 0, beautyOptions, "full");
  } finally {
    context.console = originalConsole;
  }

  assertTextProcessCounts(result, {
    changed: 1,
    failed: 1,
    processed: 2,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(failingNode.characters, originalText);
  assert.strictEqual(untouchedNode.characters, "Второй…");
  assert.strictEqual(result.failedStage, "restore_styles");
  assert.strictEqual(result.failureDiagnostic.category, "restore_styles_failed");
  assert(result.analytics.charactersChangedTotal > 0);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert(result.analytics.styleSegmentsCount > 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);
}

async function runPrioritizedRollbackFailureTests() {
  const fontFailureNode = createProcessTextNodeMock("first-font-failure-node", "Первый...", { height: 20, width: 80, x: 0, y: 0 });
  const rollbackFailureNode = createProcessTextNodeMock("second-rollback-failure-node", "Второй...", { height: 20, width: 80, x: 0, y: 30 });
  const originalConsole = context.console;

  fontFailureNode.getRangeAllFontNames = () => [{ family: "Missing Font", style: "Regular" }];
  rollbackFailureNode.setTextStyleIdAsync = async () => {
    throw new Error("Persistent style restoration failure");
  };
  const undo = configureFigmaUndoForNodes([fontFailureNode, rollbackFailureNode], false);
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
    result = await processTextNodes([fontFailureNode, rollbackFailureNode], 0, 0, beautyOptions, "full");
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
  assert.strictEqual(result.failedStage, "load_fonts");
  assert.strictEqual(result.failureDiagnostic.category, "font_unavailable");
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);
}

async function runLibraryInstanceSafetyContractTests() {
  const outerInstance = {
    componentProperties: {},
    id: "outer-instance-id",
    mainComponent: { id: "outer-main-component-id" },
    parent: null,
    type: "INSTANCE",
  };
  const instance = {
    componentProperties: {
      Label: { type: "TEXT", value: "Текст..." },
    },
    id: "instance-id",
    mainComponent: { id: "main-component-id" },
    parent: outerInstance,
    type: "INSTANCE",
  };
  const node = createProcessTextNodeMock("instance-text-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalMainComponent = instance.mainComponent;
  const originalComponentProperties = instance.componentProperties;
  const originalOuterMainComponent = outerInstance.mainComponent;

  node.parent = instance;
  node.componentPropertyReferences = { characters: "Label" };
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
  assert.strictEqual(outerInstance.mainComponent, originalOuterMainComponent);
  assert.strictEqual(instance.componentProperties, originalComponentProperties);
  assert.deepStrictEqual(node.componentPropertyReferences, { characters: "Label" });
}

async function runComponentHeavyScreenWithoutLibraryLoadsTests() {
  const nodes = [];
  let mainComponentLoadCalls = 0;

  for (let index = 0; index < 150; index += 1) {
    const instance = {
      id: `component-heavy-instance-${index}`,
      get mainComponent() {
        throw new Error("The synchronous mainComponent getter must not be used");
      },
      getMainComponentAsync: () => {
        mainComponentLoadCalls += 1;
        return new Promise(() => {});
      },
      parent: null,
      type: "INSTANCE",
    };
    const node = createProcessTextNodeMock(
      `component-heavy-text-${index}`,
      `Экран ${index}...`,
      { height: 20, width: 120, x: 0, y: index * 24 }
    );

    node.parent = instance;
    node.componentPropertyReferences = { characters: `Label ${index}` };
    nodes.push(node);
  }

  context.figma.loadFontAsync = async () => {};
  const result = await processTextNodes(nodes, 0, 0, beautyOptions);

  assertTextProcessCounts(result, {
    changed: 150,
    failed: 0,
    processed: 150,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(mainComponentLoadCalls, 0);
  assert(nodes.every((node) => node.characters.endsWith("…")));
}

async function runSuccessfulWriteConnectionVerificationTests() {
  let mainComponentLoadCalls = 0;
  const instance = {
    componentProperties: {
      Label: { type: "TEXT", value: "Текст..." },
    },
    id: "connection-verification-instance",
    get mainComponent() {
      throw new Error("The synchronous mainComponent getter is unavailable with dynamic-page access");
    },
    getMainComponentAsync: () => {
      mainComponentLoadCalls += 1;
      return new Promise(() => {});
    },
    parent: null,
    type: "INSTANCE",
  };
  const node = createProcessTextNodeMock("connection-verification-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalInsertCharacters = node.insertCharacters;
  const originalText = node.characters;

  node.componentPropertyReferences = { characters: "Label" };
  node.parent = instance;
  node.captureUndoState = () => ({
    componentPropertyReferences: { ...node.componentPropertyReferences },
  });
  node.restoreUndoState = (state) => {
    node.componentPropertyReferences = state.componentPropertyReferences;
  };
  node.insertCharacters = (start, value, useStyle) => {
    originalInsertCharacters(start, value, useStyle);
    node.componentPropertyReferences = { characters: "Changed label" };
  };
  context.figma.loadFontAsync = async () => {};
  const undo = configureFigmaUndoForNodes([node]);
  const originalConsole = context.console;
  context.console = { ...console, error: () => {} };

  let result;

  try {
    result = await processTextNodes([node], 0, 0, beautyOptions, "point");
  } finally {
    context.console = originalConsole;
  }

  assert.strictEqual(result.failed, 1);
  assert.strictEqual(result.changed, 0);
  assert.strictEqual(result.failedStage, "rollback_styles");
  assert.strictEqual(result.failureDiagnostic.category, "rollback_failed");
  assert.strictEqual(result.originalFailureStage, "restore_styles");
  assert.strictEqual(result.originalFailureDiagnostic.category, "restore_styles_failed");
  assert.strictEqual(result.rollbackFailureDiagnostic.reason, "snapshot_verification_failed");
  assert.strictEqual(result.rollbackFailureDiagnostic.operation, "verify_final_snapshot");
  assert.strictEqual(result.rollbackFailureDiagnostic.errorName, null);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result.rollbackFailureDiagnostic.verificationFailures)),
    ["component_property_references"]
  );
  assert.strictEqual(node.characters, originalText);
  assert.deepStrictEqual(node.componentPropertyReferences, { characters: "Changed label" });
  assert.strictEqual(mainComponentLoadCalls, 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);
}

async function runLinkedVariablePreflightTests() {
  const node = createProcessTextNodeMock("missing-variable-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalSegments = node.getStyledTextSegments;
  const originalGetVariableByIdAsync = context.figma.variables.getVariableByIdAsync;
  const undo = configureFigmaUndoForNodes([node]);

  node.getStyledTextSegments = () =>
    originalSegments().map((segment) => ({
      ...segment,
      boundVariables: {
        fontSize: { id: "missing-variable-id", type: "VARIABLE_ALIAS" },
      },
    }));
  context.figma.loadFontAsync = async () => {};
  context.figma.variables.getVariableByIdAsync = async () => null;
  const originalConsole = context.console;
  context.console = { ...console, error: () => {} };

  let result;

  try {
    result = await processTextNodes([node], 0, 0, beautyOptions, "full");
  } finally {
    context.console = originalConsole;
    context.figma.variables.getVariableByIdAsync = originalGetVariableByIdAsync;
  }

  assert.strictEqual(result.failed, 1);
  assert.strictEqual(result.changed, 0);
  assert.strictEqual(result.failedStage, "restore_styles");
  assert.strictEqual(result.failureDiagnostic.category, "restore_styles_failed");
  assert.strictEqual(node.characters, "Текст...");
  assert.strictEqual(undo.getTriggerCalls(), 0);
}

async function runIntegratedMixedStyleProcessingTests() {
  const node = createProcessTextNodeMock("integrated-mixed-style-node", "Один... Два", { height: 20, width: 120, x: 0, y: 0 });
  const calls = [];
  const baseStyle = node.getStyledTextSegments()[0];
  const originalText = node.characters;
  const originalSegments = [
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
      textDecoration: "UNDERLINE",
      textStyleId: "accent-style-id",
      textStyleOverrides: [{ type: "SEMANTIC_WEIGHT" }, { type: "TEXT_DECORATION" }],
    },
  ];

  node.getRangeTextStyleId = (start) => {
    const boundary = node.characters === originalText ? 7 : 5;
    return start < boundary ? "body-style-id" : "accent-style-id";
  };
  node.getStyledTextSegments = () => {
    if (node.characters === originalText) {
      return originalSegments;
    }

    return [
      {
        ...originalSegments[0],
        characters: node.characters.slice(0, 5),
        start: 0,
        end: 5,
      },
      {
        ...originalSegments[1],
        characters: node.characters.slice(5),
        start: 5,
        end: node.characters.length,
      },
    ];
  };
  node.insertCharacters = (start, value, useStyle) => {
    calls.push(["insertCharacters", start, value, useStyle]);
    node.characters = `${node.characters.slice(0, start)}${value}${node.characters.slice(start)}`;
  };
  node.deleteCharacters = (start, end) => {
    calls.push(["deleteCharacters", start, end]);
    node.characters = `${node.characters.slice(0, start)}${node.characters.slice(end)}`;
  };
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
  assert.strictEqual(result.analytics.pointEditPlannedLayersCount, 1);
  assert.strictEqual(result.analytics.pointEditMismatchLayersCount, 0);
  assert.strictEqual(result.analytics.pointEditOperationsCount, 1);
  assert.strictEqual(textStyleCalls.length, 0);
  assert.strictEqual(boldCall, undefined);
  assert.strictEqual(boundVariableCall, undefined);
  assert.deepStrictEqual(calls, [
    ["insertCharacters", 4, "…", "AFTER"],
    ["deleteCharacters", 5, 8],
  ]);
}

async function runPointStyleBoundaryProcessingTests() {
  const node = createProcessTextNodeMock("point-style-boundary-node", "Один... Два", { height: 20, width: 120, x: 0, y: 0 });
  const calls = [];
  const baseStyle = node.getStyledTextSegments()[0];
  const originalText = node.characters;
  const originalSegments = [
    {
      ...baseStyle,
      characters: "Один.",
      end: 5,
      textStyleId: "body-style-id",
    },
    {
      ...baseStyle,
      characters: ".. Два",
      end: 11,
      fontName: { family: "Inter", style: "Bold" },
      start: 5,
      textDecoration: "UNDERLINE",
      textStyleId: "accent-style-id",
      textStyleOverrides: [{ type: "SEMANTIC_WEIGHT" }, { type: "TEXT_DECORATION" }],
    },
  ];

  node.getRangeTextStyleId = (start) => start < 5 ? "body-style-id" : "accent-style-id";
  node.getStyledTextSegments = () => {
    if (node.characters === originalText) {
      return originalSegments;
    }

    return [
      {
        ...originalSegments[0],
        characters: node.characters.slice(0, 5),
        start: 0,
        end: 5,
      },
      {
        ...originalSegments[1],
        characters: node.characters.slice(5),
        start: 5,
        end: node.characters.length,
      },
    ];
  };
  node.insertCharacters = (start, value, useStyle) => {
    calls.push(["insertCharacters", start, value, useStyle]);
    node.characters = `${node.characters.slice(0, start)}${value}${node.characters.slice(start)}`;
  };
  node.deleteCharacters = (start, end) => {
    calls.push(["deleteCharacters", start, end]);
    node.characters = `${node.characters.slice(0, start)}${node.characters.slice(end)}`;
  };
  context.figma.loadFontAsync = async () => {};

  const result = await processTextNodes([node], 0, 0, beautyOptions);

  assertTextProcessCounts(result, {
    changed: 1,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(node.characters, "Один… Два");
  assert.strictEqual(result.analytics.pointEditMismatchLayersCount, 0);
  assert.deepStrictEqual(calls, [
    ["insertCharacters", 4, "…", "AFTER"],
    ["deleteCharacters", 5, 8],
  ]);
}

async function runAllTypographyExamplesThroughPointWriterTests() {
  context.figma.loadFontAsync = async () => {};

  for (let index = 0; index < pointWriterTypographyExamples.length; index += 1) {
    const { input, expected } = pointWriterTypographyExamples[index];

    if (input === expected || isWhitespaceOnlyForTest(input)) {
      continue;
    }

    const node = createProcessTextNodeMock(`point-writer-rule-example-${index}`, input, { height: 20, width: 320, x: 0, y: 0 });
    const result = await processTextNodes([node], 0, 0, beautyOptions);

    assertTextProcessCounts(result, {
      changed: 1,
      failed: 0,
      processed: 1,
      skippedHidden: 0,
      skippedLocked: 0,
    });
    assert.strictEqual(node.characters, expected, `Point writer example ${index}: ${input}`);
  }
}

async function runSinglePassDevelopmentPunctuationTests() {
  const input = "«„Как это скучно!“ — воскликнул я невольно».\n«Она сказала: „Я приду завтра!“»\n«Ты правда спросил „зачем?“?»";
  const expected = "«„Как это скучно!“*— воскликнул я*невольно».\n«Она сказала: „Я*приду завтра!“»\n«Ты*правда спросил „зачем?“»";
  const node = createProcessTextNodeMock("single-pass-development-punctuation-node", input, { height: 60, width: 420, x: 0, y: 0 });
  const pluginData = new Map();
  const rangeFills = new Map();

  node.getPluginData = (key) => pluginData.get(key) || "";
  node.setPluginData = (key, value) => pluginData.set(key, value);
  node.getRangeFills = (start) => rangeFills.get(start) || [];
  node.setRangeFills = (start, _end, fills) => rangeFills.set(start, JSON.parse(JSON.stringify(fills)));

  context.figma.loadFontAsync = async () => {};
  configureFigmaUndoForNodes([node]);

  const firstResult = await processTextNodes([node], 0, 0, developmentOptions);

  assertTextProcessCounts(firstResult, {
    changed: 1,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(node.characters, expected, "One development-mode run must remove the repeated question mark");

  const secondResult = await processTextNodes([node], 0, 0, developmentOptions);

  assertTextProcessCounts(secondResult, {
    changed: 0,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(node.characters, expected, "A repeated development-mode run must not change the result");
}

function isWhitespaceOnlyForTest(input) {
  return /^[ \t\r\n\u00A0]*$/.test(input);
}

function runAdjacentPunctuationStylePreservationTests() {
  const dashInput = "A - B";
  const dashOutput = `A${NBSP}${EM_DASH} B`;
  const dashEdits = calculatePointTextEdits(dashInput, dashOutput);

  assert.deepStrictEqual(JSON.parse(JSON.stringify(dashEdits)), [
    { start: 1, end: 2, insertText: NBSP },
    { start: 2, end: 3, insertText: EM_DASH },
  ]);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(buildPointTextEditStyleMap(dashInput, [
      { start: 0, end: 2 },
      { start: 2, end: 3 },
      { start: 3, end: dashInput.length },
    ], dashEdits))),
    [0, 0, 1, 2, 2],
    "The protected space and dash must each keep their own original style"
  );

  const mixedInput = 'Он сказал "это очень важно..." и ушёл.';
  const mixedOutput = "Он\u00A0сказал «это очень важно…» и\u00A0ушёл.";
  const mixedEdits = calculatePointTextEdits(mixedInput, mixedOutput);

  assert.deepStrictEqual(JSON.parse(JSON.stringify(mixedEdits)), [
    { start: 2, end: 3, insertText: NBSP },
    { start: 10, end: 11, insertText: "«" },
    { start: 26, end: 29, insertText: "…" },
    { start: 29, end: 30, insertText: "»" },
    { start: 32, end: 33, insertText: NBSP },
  ]);
  assert.strictEqual(applyPointTextEditsToString(mixedInput, mixedEdits), mixedOutput);

  const mixedStyleMap = buildPointTextEditStyleMap(mixedInput, [
    { start: 0, end: 26 },
    { start: 26, end: 29 },
    { start: 29, end: mixedInput.length },
  ], mixedEdits);
  assert.strictEqual(mixedStyleMap[26], 1, "The ellipsis must keep the dots' underline style");
  assert.strictEqual(mixedStyleMap[27], 2, "The closing quote must keep its own non-underlined style");

  const linkInput = 'Открыть "справку"... и закрыть старую версию.';
  const linkOutput = "Открыть «справку»… и\u00A0закрыть старую версию.";
  const linkEdits = calculatePointTextEdits(linkInput, linkOutput);

  assert.deepStrictEqual(JSON.parse(JSON.stringify(linkEdits)), [
    { start: 8, end: 9, insertText: "«" },
    { start: 16, end: 17, insertText: "»" },
    { start: 17, end: 20, insertText: "…" },
    { start: 22, end: 23, insertText: NBSP },
  ]);
  assert.strictEqual(applyPointTextEditsToString(linkInput, linkEdits), linkOutput);

  const linkStyleMap = buildPointTextEditStyleMap(linkInput, [
    { start: 0, end: 17 },
    { start: 17, end: 20 },
    { start: 20, end: linkInput.length },
  ], linkEdits);
  assert.strictEqual(linkStyleMap[16], 0, "The closing quote must keep its own non-underlined style");
  assert.strictEqual(linkStyleMap[17], 1, "The ellipsis must keep the dots' underline style");
}

async function runPointInsertionProcessingTests() {
  const node = createProcessTextNodeMock("point-insertion-node", "Температура 100F", { height: 20, width: 160, x: 0, y: 0 });
  const calls = [];
  const originalInsertCharacters = node.insertCharacters;
  const originalText = node.characters;
  const styleBoundary = originalText.length - 1;
  const baseStyle = node.getStyledTextSegments()[0];
  const originalSegments = [
    {
      ...baseStyle,
      characters: originalText.slice(0, styleBoundary),
      end: styleBoundary,
      textStyleId: "body-style-id",
    },
    {
      ...baseStyle,
      characters: "F",
      end: originalText.length,
      fontName: { family: "Inter", style: "Bold" },
      start: styleBoundary,
      textDecoration: "UNDERLINE",
      textStyleId: "accent-style-id",
      textStyleOverrides: [{ type: "SEMANTIC_WEIGHT" }, { type: "TEXT_DECORATION" }],
    },
  ];

  node.getRangeTextStyleId = (start) => start < styleBoundary ? "body-style-id" : "accent-style-id";
  node.getStyledTextSegments = () => {
    if (node.characters === originalText) {
      return originalSegments;
    }

    const insertedWhitespaceEnd = styleBoundary + 1;

    return [
      {
        ...originalSegments[0],
        characters: node.characters.slice(0, insertedWhitespaceEnd),
        start: 0,
        end: insertedWhitespaceEnd,
      },
      {
        ...originalSegments[1],
        characters: node.characters.slice(insertedWhitespaceEnd),
        start: insertedWhitespaceEnd,
        end: node.characters.length,
      },
    ];
  };
  node.insertCharacters = (start, value, useStyle) => {
    calls.push([start, value, useStyle]);
    originalInsertCharacters(start, value, useStyle);
  };
  context.figma.loadFontAsync = async () => {};

  const result = await processTextNodes([node], 0, 0, beautyOptions);

  assertTextProcessCounts(result, {
    changed: 1,
    failed: 0,
    processed: 1,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(node.characters, `Температура 100${NBSP}°F`);
  assert.deepStrictEqual(calls, [
    [styleBoundary, "°", "AFTER"],
    [styleBoundary, NBSP, "BEFORE"],
  ]);

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(buildPointTextEditStyleMap(originalText, [
      { start: 0, end: styleBoundary },
      { start: styleBoundary, end: originalText.length },
    ], [{ start: styleBoundary, end: styleBoundary, insertText: `${NBSP}°` }]))),
    [
      ...new Array(styleBoundary).fill(0),
      0,
      1,
      1,
    ],
    "The inserted space must keep the number style, while the degree sign must keep the unit style"
  );

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(buildPointTextEditStyleMap("12F", [
      { start: 0, end: 2 },
      { start: 2, end: 3 },
    ], [{ start: 2, end: 2, insertText: NBSP }]))),
    [0, 0, 0, 1],
    "An inserted separator space between styles must keep the style on its left"
  );
}

async function runPointWriteRollbackTests() {
  const node = createProcessTextNodeMock("point-write-rollback-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalText = node.characters;
  const originalConsole = context.console;
  const originalDeleteCharacters = node.deleteCharacters;
  let deleteCalls = 0;

  node.deleteCharacters = (start, end) => {
    deleteCalls += 1;

    if (deleteCalls === 1) {
      throw new Error("Point deletion failed");
    }

    originalDeleteCharacters(start, end);
  };
  context.figma.loadFontAsync = async () => {};
  const undo = configureFigmaUndoForNodes([node]);
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
  assert.strictEqual(result.failedStage, "write_text");
  assert.strictEqual(result.requiresStyleWarning, false);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);
}

async function runPointRollbackNeverAssignsWholeTextTests() {
  const runFailureCase = async (id, failureCall) => {
    const node = createProcessTextNodeMock(id, "Текст...", { height: 20, width: 80, x: 0, y: 0 });
    let backingText = node.characters;
    let directCharactersAssignments = 0;
    let rangeStylesIntact = true;
    let pointOperationCalls = 0;

    Object.defineProperty(node, "characters", {
      configurable: true,
      get: () => backingText,
      set: (value) => {
        directCharactersAssignments += 1;
        rangeStylesIntact = false;
        backingText = value;
      },
    });
    node.insertCharacters = (start, value) => {
      pointOperationCalls += 1;
      if (pointOperationCalls === failureCall) throw new Error(`Injected point insertion failure ${failureCall}`);
      backingText = `${backingText.slice(0, start)}${value}${backingText.slice(start)}`;
    };
    node.deleteCharacters = (start, end) => {
      pointOperationCalls += 1;
      if (pointOperationCalls === failureCall) throw new Error(`Injected point deletion failure ${failureCall}`);
      backingText = `${backingText.slice(0, start)}${backingText.slice(end)}`;
    };

    context.figma.loadFontAsync = async () => {};
    configureFigmaUndoForNodes([node]);
    const originalConsole = context.console;
    context.console = { ...console, error: () => {} };

    let result;
    try {
      result = await processTextNodes([node], 0, 0, beautyOptions);
    } finally {
      context.console = originalConsole;
    }

    assert.strictEqual(result.failed, 1);
    assert.strictEqual(node.characters, "Текст...");
    assert.strictEqual(directCharactersAssignments, 0, "Emergency rollback must never assign the whole characters value");
    assert.strictEqual(rangeStylesIntact, true, "Emergency rollback must not trigger Figma range-style reset behavior");
    assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  };

  await runFailureCase("point-first-operation-failure-with-figma-style-reset", 1);
  await runFailureCase("point-partial-operation-failure-with-figma-style-reset", 2);
}

async function runPointSafeFailureContinuesTests() {
  const firstNode = createProcessTextNodeMock("point-safe-first-node", "Первый...", { height: 20, width: 80, x: 0, y: 0 });
  const failingNode = createProcessTextNodeMock("point-safe-failing-node", "Второй...", { height: 20, width: 80, x: 0, y: 30 });
  const thirdNode = createProcessTextNodeMock("point-safe-third-node", "Третий...", { height: 20, width: 80, x: 0, y: 60 });
  const originalFailingText = failingNode.characters;
  const undo = configureFigmaUndoForNodes([firstNode, failingNode, thirdNode]);
  const originalConsole = context.console;

  const originalFailingDelete = failingNode.deleteCharacters;
  let failingDeleteCalls = 0;
  failingNode.deleteCharacters = (...args) => {
    failingDeleteCalls += 1;

    if (failingDeleteCalls === 1) {
      throw new Error("Injected safe point failure");
    }

    originalFailingDelete(...args);
  };
  context.figma.loadFontAsync = async () => {};
  context.console = { ...console, error: () => {} };

  let result;

  try {
    result = await processTextNodes([firstNode, failingNode, thirdNode], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
  }

  assertTextProcessCounts(result, {
    changed: 2,
    failed: 1,
    processed: 3,
    skippedHidden: 0,
    skippedLocked: 0,
  });
  assert.strictEqual(firstNode.characters, "Первый…");
  assert.strictEqual(failingNode.characters, originalFailingText);
  assert.strictEqual(thirdNode.characters, "Третий…");
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);
}

async function runPointStyleVerificationRollbackTests() {
  const node = createProcessTextNodeMock("point-style-verification-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalText = node.characters;
  const originalGetStyledTextSegments = node.getStyledTextSegments;
  const originalConsole = context.console;

  node.getRangeTextStyleId = () => "body-style-id";
  node.getStyledTextSegments = () => {
    const style = originalGetStyledTextSegments()[0];
    return [
      {
        ...style,
        characters: node.characters,
        end: node.characters.length,
        fontSize: node.characters === originalText ? 16 : 18,
        textStyleId: "body-style-id",
      },
    ];
  };
  context.figma.loadFontAsync = async () => {};
  const undo = configureFigmaUndoForNodes([node]);
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
  assert.strictEqual(result.failedStage, "restore_styles");
  assert.strictEqual(result.requiresStyleWarning, false);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);
}

async function runMixedStyleVerificationRollbackTests() {
  const node = createProcessTextNodeMock("mixed-style-verification-node", "Один... Два", { height: 20, width: 120, x: 0, y: 0 });
  const originalText = node.characters;
  const baseStyle = node.getStyledTextSegments()[0];
  const originalSegments = [
    {
      ...baseStyle,
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
      textDecoration: "UNDERLINE",
      textStyleId: "accent-style-id",
      textStyleOverrides: [{ type: "SEMANTIC_WEIGHT" }, { type: "TEXT_DECORATION" }],
    },
  ];

  node.getRangeTextStyleId = () => "body-style-id";
  node.getStyledTextSegments = () => {
    if (node.characters === originalText) {
      return originalSegments;
    }

    return [
      {
        ...baseStyle,
        characters: node.characters,
        end: node.characters.length,
        textStyleId: "body-style-id",
      },
    ];
  };
  node.setRangeBoundVariable = () => {};
  node.setRangeFills = () => {};
  node.setRangeFontName = () => {};
  node.setRangeIndentation = () => {};
  node.setRangeListOptions = () => {};
  node.setRangeParagraphIndent = () => {};
  node.setRangeParagraphSpacing = () => {};
  node.setRangeTextDecoration = () => {};
  node.setRangeTextDecorationColor = () => {};
  node.setRangeTextDecorationOffset = () => {};
  node.setRangeTextDecorationSkipInk = () => {};
  node.setRangeTextDecorationStyle = () => {};
  node.setRangeTextDecorationThickness = () => {};
  node.setRangeTextStyleIdAsync = async () => {};
  context.figma.loadFontAsync = async () => {};
  const undo = configureFigmaUndoForNodes([node]);
  const originalConsole = context.console;
  context.console = {
    ...console,
    error: () => {},
  };

  let result;

  try {
    result = await processTextNodes([node], 0, 0, beautyOptions, "full");
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
  assert.strictEqual(result.failedStage, "restore_styles");
  assert.strictEqual(result.failureDiagnostic.category, "restore_styles_failed");
  assert.strictEqual(result.requiresStyleWarning, false);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);
}

async function runChangedDuringFontLoadingTests() {
  for (const stage of ["font", "linked-style"]) {
    const node = createProcessTextNodeMock(`changed-during-${stage}-load-node`, "Текст...", { height: 20, width: 80, x: 0, y: 0 });
    const undo = configureFigmaUndoForNodes([node]);
    const originalGetStyleByIdAsync = context.figma.getStyleByIdAsync;
    const originalConsole = context.console;

    context.figma.loadFontAsync = async () => {
      if (stage === "font") {
        node.characters = "Текст изменён во время ожидания";
      }
    };
    context.figma.getStyleByIdAsync = async (id) => {
      if (stage === "linked-style") {
        node.characters = "Текст изменён во время ожидания";
      }

      return { id, type: "TEXT" };
    };
    context.console = { ...console, error: () => {} };

    let result;

    try {
      result = await processTextNodes([node], 0, 0, beautyOptions, stage === "linked-style" ? "full" : "point");
    } finally {
      context.console = originalConsole;
      context.figma.loadFontAsync = async () => {};
      context.figma.getStyleByIdAsync = originalGetStyleByIdAsync;
    }

    assert.strictEqual(node.characters, "Текст изменён во время ожидания");
    assert.strictEqual(result.failed, 1);
    assert.strictEqual(result.failureDiagnostic.category, "layer_changed");
    assert.strictEqual(result.failureDiagnostic.name, "TextLayerContentChangedError");
    assert.strictEqual(result.textLayerContentChanged, true);
    assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 0);
    assert.strictEqual(undo.getTriggerCalls(), 0);
  }
}

async function runUndoCheckpointTimingTests() {
  const targetNode = createProcessTextNodeMock("late-undo-checkpoint-target", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const unrelatedNode = createProcessTextNodeMock("late-undo-checkpoint-unrelated", "Исходный соседний текст", { height: 20, width: 160, x: 100, y: 0 });
  const originalTargetText = targetNode.characters;
  const originalGetStyledTextSegments = targetNode.getStyledTextSegments;

  targetNode.getStyledTextSegments = () =>
    originalGetStyledTextSegments().map((segment) => ({
      ...segment,
      openTypeFeatures: { LIGA: targetNode.characters === originalTargetText },
    }));
  context.figma.loadFontAsync = async () => {
    unrelatedNode.characters = "Ручная правка во время подготовки";
  };
  const undo = configureFigmaUndoForNodes([targetNode, unrelatedNode]);
  const originalConsole = context.console;
  context.console = { ...console, error: () => {} };

  let result;

  try {
    result = await processTextNodes([targetNode], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
    context.figma.loadFontAsync = async () => {};
  }

  assert.strictEqual(result.failed, 1);
  assert.strictEqual(undo.getCommitCalls(), 1);
  assert.strictEqual(undo.getTriggerCalls(), 0);
  assert.strictEqual(targetNode.characters, originalTargetText);
  assert.strictEqual(unrelatedNode.characters, "Ручная правка во время подготовки");
}

async function runRemovedDuringFontLoadingTests() {
  const removedNode = createProcessTextNodeMock("removed-during-font-load-node", "Первый...", { height: 20, width: 80, x: 0, y: 0 });
  const remainingNode = createProcessTextNodeMock("remaining-after-removed-node", "Второй...", { height: 20, width: 80, x: 100, y: 0 });
  const originalRemovedText = removedNode.characters;
  let removed = false;

  Object.defineProperty(removedNode, "characters", {
    configurable: true,
    get() {
      if (removed) {
        throw new Error("Node was removed");
      }

      return originalRemovedText;
    },
    set() {
      if (removed) {
        throw new Error("Node was removed");
      }
    },
  });
  Object.defineProperty(removedNode, "removed", {
    configurable: true,
    get: () => removed,
  });
  const removedDuringLoadUndo = configureFigmaUndoForNodes([remainingNode]);

  context.figma.loadFontAsync = async () => {
    removed = true;
  };
  const originalConsole = context.console;
  context.console = { ...console, error: () => {}, warn: () => {} };

  let result;

  try {
    result = await processTextNodes([removedNode, remainingNode], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
    context.figma.loadFontAsync = async () => {};
  }

  assert.strictEqual(result.failed, 0);
  assert.strictEqual(result.processed, 1);
  assert.strictEqual(result.changed, 1);
  assert.strictEqual(result.failureDiagnostic, null);
  assert.strictEqual(result.textLayerContentChanged, false);
  assert.strictEqual(removedDuringLoadUndo.getTriggerCalls(), 0);
  assert.strictEqual(remainingNode.characters, "Второй…");

  const alreadyRemovedNode = createProcessTextNodeMock("already-removed-node", "Удалённый...", { height: 20, width: 80, x: 0, y: 40 });
  const survivingNode = createProcessTextNodeMock("surviving-after-already-removed-node", "Третий...", { height: 20, width: 80, x: 100, y: 40 });
  Object.defineProperty(alreadyRemovedNode, "removed", { configurable: true, value: true });
  Object.defineProperty(alreadyRemovedNode, "characters", {
    configurable: true,
    get() {
      throw new Error("Node was removed");
    },
  });
  const alreadyRemovedUndo = configureFigmaUndoForNodes([survivingNode]);
  context.figma.loadFontAsync = async () => {};
  context.console = { ...console, error: () => {}, warn: () => {} };

  let alreadyRemovedResult;

  try {
    alreadyRemovedResult = await processTextNodes([alreadyRemovedNode, survivingNode], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
  }

  assert.strictEqual(alreadyRemovedResult.failed, 0);
  assert.strictEqual(alreadyRemovedResult.processed, 1);
  assert.strictEqual(alreadyRemovedResult.changed, 1);
  assert.strictEqual(alreadyRemovedUndo.getTriggerCalls(), 0);
  assert.strictEqual(survivingNode.characters, "Третий…");

  const removedDuringLinkedStyleNode = createProcessTextNodeMock(
    "removed-during-linked-style-load-node",
    "Связанный...",
    { height: 20, width: 100, x: 0, y: 80 }
  );
  const removedDuringLinkedStyleText = removedDuringLinkedStyleNode.characters;
  let removedDuringLinkedStyle = false;
  Object.defineProperty(removedDuringLinkedStyleNode, "removed", {
    configurable: true,
    get: () => removedDuringLinkedStyle,
  });
  Object.defineProperty(removedDuringLinkedStyleNode, "characters", {
    configurable: true,
    get() {
      if (removedDuringLinkedStyle) {
        throw new Error("Node was removed");
      }

      return removedDuringLinkedStyleText;
    },
  });
  const removedDuringLinkedStyleUndo = configureFigmaUndoForNodes([removedDuringLinkedStyleNode]);
  const getStyleBeforeRemovedDuringLinkedStyle = context.figma.getStyleByIdAsync;
  context.figma.getStyleByIdAsync = async (id) => {
    removedDuringLinkedStyle = true;
    return { id, type: "TEXT" };
  };
  context.console = { ...console, error: () => {}, warn: () => {} };

  let removedDuringLinkedStyleResult;

  try {
    removedDuringLinkedStyleResult = await processTextNodes([removedDuringLinkedStyleNode], 0, 0, beautyOptions, "full");
  } finally {
    context.console = originalConsole;
    context.figma.getStyleByIdAsync = getStyleBeforeRemovedDuringLinkedStyle;
  }

  assert.strictEqual(removedDuringLinkedStyleResult.failed, 0);
  assert.strictEqual(removedDuringLinkedStyleResult.processed, 0);
  assert.strictEqual(removedDuringLinkedStyleUndo.getTriggerCalls(), 0);

  const missingStyleNode = createProcessTextNodeMock("missing-style-is-not-removed-node", "Стиль...", { height: 20, width: 80, x: 0, y: 0 });
  const originalGetStyleByIdAsync = context.figma.getStyleByIdAsync;
  configureFigmaUndoForNodes([missingStyleNode]);
  context.figma.getStyleByIdAsync = async () => {
    throw new Error("Style does not exist");
  };
  context.console = { ...console, error: () => {} };

  let missingStyleResult;

  try {
    missingStyleResult = await processTextNodes([missingStyleNode], 0, 0, beautyOptions, "full");
  } finally {
    context.console = originalConsole;
    context.figma.getStyleByIdAsync = originalGetStyleByIdAsync;
  }

  assert.strictEqual(missingStyleResult.failed, 1);
  assert.strictEqual(missingStyleResult.processed, 1);
  assert.notStrictEqual(missingStyleResult.failureDiagnostic, null);
}

async function runChangedStylesDuringPreparationTests() {
  for (const stage of ["font", "linked-style"]) {
    const node = createProcessTextNodeMock(`styles-changed-during-${stage}-node`, "Текст...", { height: 20, width: 80, x: 0, y: 0 });
    const originalSegments = node.getStyledTextSegments;
    const originalInsertCharacters = node.insertCharacters;
    const originalDeleteCharacters = node.deleteCharacters;
    const originalGetStyleByIdAsync = context.figma.getStyleByIdAsync;
    const undo = configureFigmaUndoForNodes([node]);
    let fontSize = 16;
    let pointWrites = 0;

    node.getStyledTextSegments = () => originalSegments().map((segment) => ({ ...segment, fontSize }));
    node.insertCharacters = (start, value, useStyle) => {
      pointWrites += 1;
      originalInsertCharacters(start, value, useStyle);
    };
    node.deleteCharacters = (start, end) => {
      pointWrites += 1;
      originalDeleteCharacters(start, end);
    };
    context.figma.loadFontAsync = async () => {
      if (stage === "font") {
        fontSize = 18;
      }
    };
    context.figma.getStyleByIdAsync = async (id) => {
      if (stage === "linked-style") {
        fontSize = 18;
      }

      return { id, type: "TEXT" };
    };
    const originalConsole = context.console;
    context.console = { ...console, error: () => {} };

    let result;

    try {
      result = await processTextNodes([node], 0, 0, beautyOptions, stage === "linked-style" ? "full" : "point");
    } finally {
      context.console = originalConsole;
      context.figma.loadFontAsync = async () => {};
      context.figma.getStyleByIdAsync = originalGetStyleByIdAsync;
    }

    assert.strictEqual(result.failed, 0, `${stage}: the current style must be accepted after it becomes stable`);
    assert.strictEqual(result.changed, 1, `${stage}: the plugin must write only after rechecking the current style`);
    assert.strictEqual(result.textLayerContentChanged, false);
    assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 0);
    assert.strictEqual(undo.getTriggerCalls(), 0);
    if (stage === "font") {
      assert(pointWrites > 0);
    } else {
      assert.strictEqual(pointWrites, 0);
    }
    assert.strictEqual(fontSize, 18, `${stage}: the user's new style must stay untouched`);
    assert.strictEqual(node.characters, "Текст…");
  }

  const unstableNode = createProcessTextNodeMock("continuously-changing-styles-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const unstableOriginalSegments = unstableNode.getStyledTextSegments;
  const unstableUndo = configureFigmaUndoForNodes([unstableNode]);
  let styleCaptureCalls = 0;
  let unstablePointWrites = 0;

  unstableNode.getStyledTextSegments = () => {
    styleCaptureCalls += 1;
    return unstableOriginalSegments().map((segment) => ({ ...segment, fontSize: styleCaptureCalls % 2 === 0 ? 18 : 16 }));
  };
  unstableNode.insertCharacters = () => {
    unstablePointWrites += 1;
  };
  unstableNode.deleteCharacters = () => {
    unstablePointWrites += 1;
  };
  context.figma.loadFontAsync = async () => {};
  const unstableOriginalConsole = context.console;
  context.console = { ...console, error: () => {} };

  let unstableResult;

  try {
    unstableResult = await processTextNodes([unstableNode], 0, 0, beautyOptions);
  } finally {
    context.console = unstableOriginalConsole;
  }

  assert.strictEqual(unstableResult.failed, 1);
  assert.strictEqual(unstableResult.changed, 0);
  assert.strictEqual(unstableResult.analytics.rollbackAttemptedLayersCount, 0);
  assert.strictEqual(unstableUndo.getTriggerCalls(), 0);
  assert.strictEqual(unstablePointWrites, 0);
  assert.strictEqual(unstableNode.characters, "Текст...");
}

async function runDevelopmentMarkerRollbackTests() {
  const text = "в*дом и*сад";
  const node = createProcessTextNodeMock("development-marker-rollback-node", text, { height: 20, width: 120, x: 0, y: 0 });
  const pluginData = new Map([
    ["developmentMarkerText", text],
    ["developmentMarkerIndexes", "[1,7]"],
  ]);
  const rangeFills = new Map([[1, []], [7, []]]);
  let fillWrites = 0;

  node.getPluginData = (key) => pluginData.get(key) || "";
  node.setPluginData = (key, value) => pluginData.set(key, value);
  node.getRangeFills = (start) => rangeFills.get(start) || [];
  node.setRangeFills = (start, _end, fills) => {
    fillWrites += 1;

    if (fillWrites === 2) {
      throw new Error("Second development marker fill failed");
    }

    rangeFills.set(start, JSON.parse(JSON.stringify(fills)));
  };
  node.captureUndoState = () => ({
    pluginData: Array.from(pluginData.entries()),
    rangeFills: Array.from(rangeFills.entries()),
  });
  node.restoreUndoState = (state) => {
    pluginData.clear();
    rangeFills.clear();

    for (const [key, value] of state.pluginData) pluginData.set(key, value);
    for (const [key, value] of state.rangeFills) rangeFills.set(key, value);
  };

  context.figma.loadFontAsync = async () => {};
  const undo = configureFigmaUndoForNodes([node]);
  const originalConsole = context.console;
  context.console = { ...console, error: () => {} };

  let result;

  try {
    result = await processTextNodes([node], 0, 0, developmentOptions);
  } finally {
    context.console = originalConsole;
  }

  assert.strictEqual(result.failed, 1);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(rangeFills.get(1))), []);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(rangeFills.get(7))), []);
  assert.strictEqual(pluginData.get("developmentMarkerText"), text);
  assert.strictEqual(pluginData.get("developmentMarkerIndexes"), "[1,7]");
}

async function runDevelopmentPluginDataRollbackTests() {
  const node = createProcessTextNodeMock("development-plugin-data-rollback-node", "Чистовик", { height: 20, width: 100, x: 0, y: 0 });
  const pluginData = new Map([
    ["developmentMarkerText", "Старый текст"],
    ["developmentMarkerIndexes", "[1]"],
  ]);
  let pluginDataWrites = 0;

  node.getPluginData = (key) => pluginData.get(key) || "";
  node.setPluginData = (key, value) => {
    pluginDataWrites += 1;

    if (pluginDataWrites === 2) {
      throw new Error("Second plugin data write failed");
    }

    pluginData.set(key, value);
  };
  node.captureUndoState = () => Array.from(pluginData.entries());
  node.restoreUndoState = (state) => {
    pluginData.clear();
    for (const [key, value] of state) pluginData.set(key, value);
  };

  context.figma.loadFontAsync = async () => {};
  const undo = configureFigmaUndoForNodes([node]);
  const originalConsole = context.console;
  context.console = { ...console, error: () => {} };

  let result;

  try {
    result = await processTextNodes([node], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
  }

  assert.strictEqual(result.failed, 1);
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);
  assert.strictEqual(pluginData.get("developmentMarkerText"), "Старый текст");
  assert.strictEqual(pluginData.get("developmentMarkerIndexes"), "[1]");
}

async function runPointOperationFailureMatrixTests() {
  const input = "Текст... и 100F";
  const createInstrumentedNode = (id, failureCall = null) => {
    const node = createProcessTextNodeMock(id, input, { height: 20, width: 160, x: 0, y: 0 });
    const originalInsert = node.insertCharacters;
    const originalDelete = node.deleteCharacters;
    let calls = 0;

    node.insertCharacters = (...args) => {
      calls += 1;
      if (calls === failureCall) throw new Error(`Injected point operation failure ${calls}`);
      originalInsert(...args);
    };
    node.deleteCharacters = (...args) => {
      calls += 1;
      if (calls === failureCall) throw new Error(`Injected point operation failure ${calls}`);
      originalDelete(...args);
    };

    return { getCalls: () => calls, node };
  };

  context.figma.loadFontAsync = async () => {};
  const baseline = createInstrumentedNode("point-operation-baseline");
  const baselineResult = await processTextNodes([baseline.node], 0, 0, beautyOptions);
  assert.strictEqual(baselineResult.failed, 0);
  assert(baseline.getCalls() >= 4);

  const originalConsole = context.console;
  context.console = { ...console, error: () => {} };

  try {
    for (let failureCall = 1; failureCall <= baseline.getCalls(); failureCall += 1) {
      const current = createInstrumentedNode(`point-operation-failure-${failureCall}`, failureCall);
      const undo = configureFigmaUndoForNodes([current.node]);
      const result = await processTextNodes([current.node], 0, 0, beautyOptions);

      assert.strictEqual(result.failed, 1, `Point operation ${failureCall} must fail the layer`);
      assert.strictEqual(current.node.characters, input, `Point operation ${failureCall} must be undone`);
      assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
      assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
      assert.strictEqual(undo.getTriggerCalls(), 0);
    }
  } finally {
    context.console = originalConsole;
  }
}

async function runDensePointProcessingTests() {
  const input = "а дом ".repeat(2000);
  const expected = cleanTypography(input);
  const node = createProcessTextNodeMock("dense-point-processing-node", input, { height: 200, width: 600, x: 0, y: 0 });
  const originalInsert = node.insertCharacters;
  const originalDelete = node.deleteCharacters;
  let calls = 0;

  node.insertCharacters = (...args) => {
    calls += 1;
    originalInsert(...args);
  };
  node.deleteCharacters = (...args) => {
    calls += 1;
    originalDelete(...args);
  };
  context.figma.loadFontAsync = async () => {};

  const result = await processTextNodes([node], 0, 0, beautyOptions);

  assert.strictEqual(result.failed, 0);
  assert.strictEqual(node.characters, expected);
  assert(calls < 20, `Dense text must be written in a small number of safe chunks, received ${calls}`);

  const manyEllipsesInput = Array(10000).fill("слово...").join(" ");
  const manyEllipsesExpected = cleanTypography(manyEllipsesInput);
  const manyEllipsesNode = createProcessTextNodeMock("many-ellipses-processing-node", manyEllipsesInput, {
    height: 200,
    width: 600,
    x: 0,
    y: 0,
  });
  const manyEllipsesResult = await processTextNodes([manyEllipsesNode], 0, 0, beautyOptions);

  assert.strictEqual(manyEllipsesResult.failed, 0);
  assert.strictEqual(manyEllipsesNode.characters, manyEllipsesExpected);
}

async function runOpenTypeFeatureVerificationTests() {
  const node = createProcessTextNodeMock("open-type-verification-node", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  const originalText = node.characters;
  const originalGetStyledTextSegments = node.getStyledTextSegments;

  node.getStyledTextSegments = () => originalGetStyledTextSegments().map((segment) => ({
    ...segment,
    fontStyle: "REGULAR",
    fontWeight: 400,
    openTypeFeatures: { LIGA: node.characters === originalText },
  }));
  context.figma.loadFontAsync = async () => {};
  const undo = configureFigmaUndoForNodes([node]);
  const originalConsole = context.console;
  context.console = { ...console, error: () => {} };

  let result;

  try {
    result = await processTextNodes([node], 0, 0, beautyOptions);
  } finally {
    context.console = originalConsole;
  }

  assert.strictEqual(result.failed, 1);
  assert.strictEqual(result.failedStage, "restore_styles");
  assert.strictEqual(result.analytics.rollbackAttemptedLayersCount, 1);
  assert.strictEqual(result.analytics.rollbackFailedLayersCount, 0);
  assert.strictEqual(undo.getTriggerCalls(), 0);
  assert.strictEqual(node.characters, originalText);
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
  const showUICalls = [];
  const errorReportMessages = [];
  const selectedProblemNodes = [];
  const problemNode = createProcessTextNodeMock("problem-layer-for-report", "Текст...", { height: 20, width: 80, x: 0, y: 0 });
  problemNode.type = "TEXT";
  problemNode.removed = false;
  context.figma.showUI = (_html, options) => {
    showUICalls.push(options);
  };
  context.figma.ui = {
    onmessage: null,
    postMessage: (message) => {
      errorReportMessages.push(message);
    },
  };
  context.figma.getNodeByIdAsync = async () => problemNode;
  context.figma.currentPage = { selection: [] };
  context.figma.viewport = {
    scrollAndZoomIntoView: (nodes) => {
      selectedProblemNodes.push(nodes.map((node) => node.id));
    },
  };
  presentRunOutcome(
    {
      error: true,
      message: "Ой, не получилось почистить 🛑",
      report: {
        kind: "safe_failure",
        layers: [
          {
            kind: "safe_failure",
            nodeId: problemNode.id,
            nodePath: "card / title",
            textPreview: problemNode.characters,
          },
        ],
        source: "quick_run",
        successfulLayerCount: 2,
      },
    },
    "quick_run",
    true
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(showUICalls)), [{ height: 372, themeColors: true, width: 360 }]);
  assert.strictEqual(notifications.length, 0, "A detailed report must replace the red final notification");
  assert.strictEqual(errorReportMessages.length, 1);
  assert.strictEqual(errorReportMessages[0].type, "show-error-report");
  assert.strictEqual(errorReportMessages[0].report.layers[0].textPreview, "Текст...");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(selectedProblemNodes)), []);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.figma.currentPage.selection.map((node) => node.id))), []);
  assert.strictEqual(
    uiSource.includes("selectProblemLayer(0, true)"),
    true,
    "The UI must be the only place that selects the first problem layer"
  );

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

  closePluginCalls.length = 0;
  presentRunOutcome({ error: true, message: "Тут изменился текст — запустите типограф заново 🔄" }, "quick_run", false);
  assert.deepStrictEqual(closePluginCalls, ["Тут изменился текст — запустите типограф заново 🔄"]);

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

  notifications.length = 0;
  uiMessages.length = 0;
  const changedDuringFontLoadNode = createProcessTextNodeMock(
    "notification-changed-during-font-load-node",
    "Текст...",
    { height: 20, width: 80, x: 0, y: 0 },
    null
  );
  const changedDuringFontLoadUndo = configureFigmaUndoForNodes([changedDuringFontLoadNode]);
  context.figma.currentPage = {
    findAllWithCriteria: () => [changedDuringFontLoadNode],
    loadAsync: async () => {},
    selection: [],
  };
  context.figma.loadFontAsync = async () => {
    changedDuringFontLoadNode.characters = "Текст изменён во время ожидания";
  };
  const consoleBeforeChangedDuringFontLoad = context.console;
  context.console = { ...console, error: () => {} };

  try {
    await runTypograph(beautyOptions, "settings");
  } finally {
    context.console = consoleBeforeChangedDuringFontLoad;
    context.figma.loadFontAsync = async () => {};
  }

  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].message, "Чистовик работает...");
  assert.strictEqual(notifications[0].cancelCalls, 1);
  assert.strictEqual(changedDuringFontLoadNode.characters, "Текст изменён во время ожидания");
  assert.strictEqual(changedDuringFontLoadUndo.getTriggerCalls(), 0);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(uiMessages)), [
    { type: "typograph-run-finished" },
    {
      report: {
        kind: "safe_failure",
        layers: [
          {
            kind: "safe_failure",
            nodeId: "notification-changed-during-font-load-node",
            nodePath: "",
            textPreview: "Текст изменён во время ожидания",
          },
        ],
        source: "settings",
        successfulLayerCount: 0,
      },
      type: "show-error-report",
    },
  ]);

  notifications.length = 0;
  uiMessages.length = 0;
  const earlierFontFailureNode = createProcessTextNodeMock("notification-earlier-font-failure-node", "Первый...", { height: 20, width: 80, x: 0, y: 0 }, null);
  const laterChangedTextNode = createProcessTextNodeMock("notification-later-changed-text-node", "Второй...", { height: 20, width: 80, x: 100, y: 0 }, null);
  laterChangedTextNode.getRangeAllFontNames = () => [{ family: "Inter", style: "Bold" }];
  let fontLoadAttempt = 0;
  context.figma.currentPage = {
    findAllWithCriteria: () => [earlierFontFailureNode, laterChangedTextNode],
    loadAsync: async () => {},
    selection: [],
  };
  context.figma.loadFontAsync = async () => {
    fontLoadAttempt += 1;

    if (fontLoadAttempt === 1) {
      throw new Error("Font is unavailable");
    }

    laterChangedTextNode.characters = "Второй изменён во время ожидания";
  };
  const consoleBeforePrioritizedChangedText = context.console;
  context.console = { ...console, error: () => {} };

  try {
    await runTypograph(beautyOptions, "settings");
  } finally {
    context.console = consoleBeforePrioritizedChangedText;
    context.figma.loadFontAsync = async () => {};
  }

  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].message, "Чистовик работает...");
  assert.strictEqual(laterChangedTextNode.characters, "Второй изменён во время ожидания");
  assert.strictEqual(uiMessages[1].type, "show-error-report");
  assert.strictEqual(uiMessages[1].report.kind, "safe_failure");
  assert.strictEqual(uiMessages[1].report.layers.length, 2);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(uiMessages[1].report.layers.map((layer) => layer.nodeId))),
    ["notification-earlier-font-failure-node", "notification-later-changed-text-node"]
  );
}

async function runProblemLayerSelectionTests() {
  const originalGetNodeByIdAsync = context.figma.getNodeByIdAsync;
  const originalCurrentPage = context.figma.currentPage;
  const originalSetCurrentPageAsync = context.figma.setCurrentPageAsync;
  const originalViewport = context.figma.viewport;
  const firstPage = { id: "page-one", parent: null, selection: [], type: "PAGE" };
  const secondPage = { id: "page-two", parent: null, selection: [], type: "PAGE" };
  const firstNode = { id: "first-problem-node", parent: secondPage, removed: false, type: "TEXT" };
  const secondNode = { id: "second-problem-node", parent: secondPage, removed: false, type: "TEXT" };
  const resolvers = new Map();
  const scrolledNodeIds = [];
  let pageSwitches = 0;

  context.figma.currentPage = firstPage;
  context.figma.getNodeByIdAsync = (id) => new Promise((resolve) => resolvers.set(id, resolve));
  context.figma.setCurrentPageAsync = async (page) => {
    pageSwitches += 1;
    context.figma.currentPage = page;
  };
  context.figma.viewport = {
    scrollAndZoomIntoView: (nodes) => scrolledNodeIds.push(nodes.map((node) => node.id)),
  };

  try {
    const firstSelection = selectProblemTextLayer(firstNode.id);
    const secondSelection = selectProblemTextLayer(secondNode.id);
    await Promise.resolve();
    await Promise.resolve();
    resolvers.get(secondNode.id)(secondNode);
    await secondSelection;
    resolvers.get(firstNode.id)(firstNode);
    await firstSelection;

    assert.strictEqual(context.figma.currentPage.id, secondPage.id);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(secondPage.selection.map((node) => node.id))), [secondNode.id]);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(scrolledNodeIds)), [[secondNode.id]]);
    assert.strictEqual(pageSwitches, 1);
  } finally {
    context.figma.getNodeByIdAsync = originalGetNodeByIdAsync;
    context.figma.currentPage = originalCurrentPage;
    context.figma.setCurrentPageAsync = originalSetCurrentPageAsync;
    context.figma.viewport = originalViewport;
  }
}

runStyleCaptureTests();
runRepeatedTextStyleMappingTests();
runLongTextStyleMappingTests();
runHighPrecisionTimingTests();
runDevelopmentMarkerPluginDataTests();
runDevelopmentMarkerScanTests();
runProblemLayerPreviewTests();
runPhoneLayoutPerformanceTests();
runNumberLayerContextPerformanceTests();
runNumberDiagnosticSpatialContextPerformanceTests();
runParentStateCacheTests();
runAdjacentPunctuationStylePreservationTests();

runStyleRestorationTests()
  .then(runWholeTextStyleRestorationTests)
  .then(runFigmaOperationTimeoutTests)
  .then(runRollbackTimeoutTests)
  .then(runFontLoadingCacheTests)
  .then(runWhitespaceOnlyTextNodeTests)
  .then(runUnchangedTextNodeTests)
  .then(runPreservedLibraryStyleOptimizationTests)
  .then(runLibraryStyleVerificationRollbackTests)
  .then(runDetectedRollbackDamageTests)
  .then(runUnavailableLinkedStylePreflightTests)
  .then(runStandalonePhoneCountryPrefixContextTests)
  .then(runEvidenceBasedNumberLayerContextTests)
  .then(runRuleAnalyticsFinalTextTests)
  .then(runProcessingFailureAnalyticsTests)
  .then(runStyleRestorationRollbackTests)
  .then(runSafeLayerFailureContinuesTests)
  .then(runFailedStyleRollbackTests)
  .then(runPrioritizedRollbackFailureTests)
  .then(runLibraryInstanceSafetyContractTests)
  .then(runComponentHeavyScreenWithoutLibraryLoadsTests)
  .then(runSuccessfulWriteConnectionVerificationTests)
  .then(runLinkedVariablePreflightTests)
  .then(runAllTypographyExamplesThroughPointWriterTests)
  .then(runSinglePassDevelopmentPunctuationTests)
  .then(runIntegratedMixedStyleProcessingTests)
  .then(runPointStyleBoundaryProcessingTests)
  .then(runPointInsertionProcessingTests)
  .then(runPointWriteRollbackTests)
  .then(runPointRollbackNeverAssignsWholeTextTests)
  .then(runPointSafeFailureContinuesTests)
  .then(runPointStyleVerificationRollbackTests)
  .then(runMixedStyleVerificationRollbackTests)
  .then(runChangedDuringFontLoadingTests)
  .then(runUndoCheckpointTimingTests)
  .then(runRemovedDuringFontLoadingTests)
  .then(runChangedStylesDuringPreparationTests)
  .then(runDevelopmentMarkerRollbackTests)
  .then(runDevelopmentPluginDataRollbackTests)
  .then(runPointOperationFailureMatrixTests)
  .then(runDensePointProcessingTests)
  .then(runOpenTypeFeatureVerificationTests)
  .then(runNotificationLifecycleTests)
  .then(runProblemLayerSelectionTests)
  .then(() => {
    console.log("cleanTypography tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
