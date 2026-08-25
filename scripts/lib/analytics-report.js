const MOSCOW_TIME_ZONE = "Europe/Moscow";
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_POSTHOG_HOST = "https://eu.posthog.com";
const DEFAULT_POSTHOG_PROJECT_ID = "184090";
const DEFAULT_POSTHOG_DASHBOARD_URL = "https://eu.posthog.com/project/184090/dashboard/695809";
const DEFAULT_POSTHOG_PERFORMANCE_DASHBOARD_URL = "https://eu.posthog.com/project/184090/dashboard/854930";
const POSTHOG_UNEXPECTED_RESPONSE_REASON = "PostHog вернул неожиданный формат данных.";
const MIN_WEEKLY_PERFORMANCE_RUNS = 10;
const PERFORMANCE_MEASUREMENT_VERSION = 8;
const POINT_EDITING_PHASE = "implementation";
const POINT_EDITING_RELEASE = "2026-08-05";
const POINT_EDITING_RELEASE_DAY = { day: 5, month: 8, year: 2026 };
const POINT_EDITING_FIRST_FULL_DAY = { day: 6, month: 8, year: 2026 };
const POINT_EDITING_MIN_FULL_DAYS = 7;
const POINT_EDITING_MIN_SUCCESSFUL_RUNS = 30;
const POINT_EDITING_WAIT_MESSAGE = "🛑 Нельзя делать доработки — ещё не накопились 7 полных дней или 30 успешных обработок";
const POINT_EDITING_READY_MESSAGE = "✅ Можно приступать к переходу на точечную обработку текста";
const RUN_DEDUPLICATION_EXPRESSION = "coalesce(nullIf(toString(properties.run_id), ''), toString(uuid))";
const SUMMARY_COLUMNS = [
  "uniqueUsers",
  "typographRuns",
  "successfulRuns",
  "performanceRuns",
  "failedRuns",
  "affectedUsers",
  "medianDurationMs",
  "p90DurationMs",
  "modeDefault",
  "modeBeauty",
  "modeDevelopment",
  "scopeSingleText",
  "scopeContainer",
  "scopePage",
  "scopeMultiSelection",
  "runsWithHiddenNodes",
  "runsWithLockedNodes",
  "runsWithRecoloredAsterisks",
  "settingsOpened",
  "channelLinkClicked",
];
const BASELINE_COLUMNS = [
  "typographRuns",
  "failedRuns",
  "performanceRuns",
  "medianDurationMs",
  "p90DurationMs",
];
const DEDUPLICATED_PERFORMANCE_COLUMNS = [
  "performanceRuns",
  "medianDurationMs",
  "p90DurationMs",
];
const ERROR_CATEGORY_LABELS = {
  font_unavailable: "недоступен шрифт",
  layer_not_editable: "слой нельзя изменить",
  layer_changed: "слой изменился или исчез",
  mixed_or_unsupported_property: "смешанное или неподдерживаемое свойство",
  write_text_failed: "не удалось записать текст",
  restore_styles_failed: "не удалось вернуть оформление",
  rollback_failed: "не удалось вернуть исходное состояние",
  typography_failed: "ошибка правил типографики",
  timeout: "превышено время ожидания",
  unknown: "причина неизвестна",
};
const PERFORMANCE_TIMING_COLUMNS = [
  { key: "collectTextMs", label: "поиск текстовых слоёв", property: "timing_collect_text_ms" },
  { key: "typographyMs", label: "применение правил типографики", property: "timing_typography_ms" },
  { key: "numberContextMs", label: "проверка числового контекста", property: "timing_number_context_ms" },
  { key: "fontsMs", label: "загрузка шрифтов", property: "timing_fonts_ms" },
  { key: "readStylesMs", label: "чтение оформления", property: "timing_read_styles_ms" },
  { key: "compareTextMs", label: "сравнение текста", property: "timing_compare_text_ms" },
  { key: "writeTextMs", label: "запись текста", property: "timing_write_text_ms" },
  { key: "restoreStylesMs", label: "возвращение оформления", property: "timing_restore_styles_ms" },
  { key: "developmentMarkersMs", label: "работа со служебными звёздочками", property: "timing_development_markers_ms" },
  { key: "otherMs", label: "остальные операции", property: "timing_other_ms" },
];
const PERFORMANCE_COLUMNS = [
  "successfulRuns",
  "averageDurationMs",
  "p90DurationMs",
  "slowestDurationMs",
  ...PERFORMANCE_TIMING_COLUMNS.map((item) => item.key),
];
const WEEKLY_ERROR_SUMMARY_COLUMNS = [
  "typographRuns",
  "failedRuns",
  "affectedUsers",
];
const ERROR_SCOPE_LABELS = {
  single_text: "на текстовом слое",
  container: "во фрейме",
  page: "на странице",
  multi_selection: "при мультивыборе",
};

class AnalyticsReportError extends Error {
  constructor(message, publicReason) {
    super(message);
    this.name = "AnalyticsReportError";
    this.publicReason = publicReason;
  }
}

function assertRequiredEnv(env, keys) {
  const missing = keys
    .filter((key) => typeof env[key] !== "string" || env[key].length === 0);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function getMoscowDateParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: MOSCOW_TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);

  return {
    day: Number(parts.find((part) => part.type === "day").value),
    month: Number(parts.find((part) => part.type === "month").value),
    year: Number(parts.find((part) => part.type === "year").value),
  };
}

function getMoscowOffsetMs(utcDate) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: MOSCOW_TIME_ZONE,
    year: "numeric",
  }).formatToParts(utcDate);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - utcDate.getTime();
}

function getMoscowDayStartUtc(dateParts) {
  const approximateUtcMidnight = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 0, 0, 0));
  const offsetMs = getMoscowOffsetMs(approximateUtcMidnight);

  return new Date(approximateUtcMidnight.getTime() - offsetMs);
}

function getMoscowReportRange(period, referenceDate = new Date()) {
  if (period === "today") {
    const dateParts = getMoscowDateParts(referenceDate);
    const start = getMoscowDayStartUtc(dateParts);

    return {
      ...dateParts,
      end: referenceDate,
      label: "сегодня",
      start,
    };
  }

  if (period === "yesterday") {
    const yesterdayReference = new Date(referenceDate.getTime() - MS_IN_DAY);
    const dateParts = getMoscowDateParts(yesterdayReference);
    const start = getMoscowDayStartUtc(dateParts);
    const end = new Date(start.getTime() + MS_IN_DAY);

    return {
      ...dateParts,
      end,
      label: `за ${formatRussianDate(dateParts)}`,
      start,
    };
  }

  throw new Error(`Unsupported report period: ${period}`);
}

function getMoscowCompletedWeekRange(referenceDate = new Date()) {
  const todayParts = getMoscowDateParts(referenceDate);
  const end = getMoscowDayStartUtc(todayParts);
  const start = new Date(end.getTime() - 7 * MS_IN_DAY);
  const baselineStart = new Date(start.getTime() - 7 * MS_IN_DAY);
  const startParts = getMoscowDateParts(start);
  const endParts = getMoscowDateParts(new Date(end.getTime() - 1));

  return {
    baselineStart,
    end,
    label: formatRussianDateRange(startParts, endParts),
    start,
  };
}

function getPointEditingFullDays(referenceDate = new Date()) {
  const currentDayStart = getMoscowDayStartUtc(getMoscowDateParts(referenceDate));
  const firstFullDayStart = getMoscowDayStartUtc(POINT_EDITING_FIRST_FULL_DAY);

  return Math.max(0, Math.floor((currentDayStart.getTime() - firstFullDayStart.getTime()) / MS_IN_DAY));
}

function formatRussianDate({ day, month }) {
  const monthNames = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];

  return `${day} ${monthNames[month - 1]}`;
}

function formatRussianDateRange(startParts, endParts) {
  if (startParts.year === endParts.year && startParts.month === endParts.month) {
    return `${startParts.day}–${formatRussianDate(endParts)}`;
  }

  if (startParts.year === endParts.year) {
    return `${formatRussianDate(startParts)} — ${formatRussianDate(endParts)}`;
  }

  return `${formatRussianDate(startParts)} ${startParts.year} — ${formatRussianDate(endParts)} ${endParts.year}`;
}

function formatRussianWeekday({ day, month, year }) {
  const weekdayNames = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  const weekdayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return weekdayNames[weekdayIndex];
}

function escapeHogqlString(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function formatHogqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getAnalyticsQuery(start, end) {
  const startDateTime = escapeHogqlString(formatHogqlDateTime(start));
  const endDateTime = escapeHogqlString(formatHogqlDateTime(end));

  return `
SELECT
  uniqExactIf(distinct_id, event = 'plugin_run_started') AS unique_users,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started') AS typograph_runs,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_completed') AS successful_runs,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_completed' AND toString(properties.performance_measurement_version) = '${PERFORMANCE_MEASUREMENT_VERSION}') AS performance_runs,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_failed') AS failed_runs,
  uniqExactIf(distinct_id, event = 'plugin_run_failed') AS affected_users,
  quantileIf(0.5)(toFloat(properties.duration_ms), event = 'plugin_run_completed' AND isNotNull(properties.duration_ms) AND toString(properties.performance_measurement_version) = '${PERFORMANCE_MEASUREMENT_VERSION}') AS median_duration_ms,
  quantileIf(0.9)(toFloat(properties.duration_ms), event = 'plugin_run_completed' AND isNotNull(properties.duration_ms) AND toString(properties.performance_measurement_version) = '${PERFORMANCE_MEASUREMENT_VERSION}') AS p90_duration_ms,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started' AND properties.mode = 'default') AS mode_default,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started' AND properties.mode = 'beauty') AS mode_beauty,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started' AND properties.mode = 'development') AS mode_development,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started' AND properties.selection_scope = 'single_text') AS scope_single_text,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started' AND properties.selection_scope = 'container') AS scope_container,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started' AND properties.selection_scope = 'page') AS scope_page,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started' AND properties.selection_scope = 'multi_selection') AS scope_multi_selection,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started' AND properties.process_hidden_nodes = true) AS runs_with_hidden_nodes,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started' AND properties.process_locked_nodes = true) AS runs_with_locked_nodes,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started' AND properties.recolor_existing_asterisks = true) AS runs_with_recolored_asterisks,
  countIf(event = 'settings_opened') AS settings_opened,
  countIf(event = 'channel_link_clicked') AS channel_link_clicked
FROM events
WHERE timestamp >= toDateTime('${startDateTime}', 'UTC')
  AND timestamp < toDateTime('${endDateTime}', 'UTC')
  AND event IN (
    'settings_opened',
    'plugin_run_started',
    'plugin_run_completed',
    'plugin_run_failed',
    'channel_link_clicked'
  )
  AND ifNull(properties.is_test_event, false) != true
`;
}

function getBaselineAnalyticsQuery(start, end) {
  const startDateTime = escapeHogqlString(formatHogqlDateTime(start));
  const endDateTime = escapeHogqlString(formatHogqlDateTime(end));

  return `
SELECT
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started') AS typograph_runs,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_failed') AS failed_runs,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_completed' AND toString(properties.performance_measurement_version) = '${PERFORMANCE_MEASUREMENT_VERSION}') AS performance_runs,
  quantileIf(0.5)(toFloat(properties.duration_ms), event = 'plugin_run_completed' AND isNotNull(properties.duration_ms) AND toString(properties.performance_measurement_version) = '${PERFORMANCE_MEASUREMENT_VERSION}') AS median_duration_ms,
  quantileIf(0.9)(toFloat(properties.duration_ms), event = 'plugin_run_completed' AND isNotNull(properties.duration_ms) AND toString(properties.performance_measurement_version) = '${PERFORMANCE_MEASUREMENT_VERSION}') AS p90_duration_ms
FROM events
WHERE timestamp >= toDateTime('${startDateTime}', 'UTC')
  AND timestamp < toDateTime('${endDateTime}', 'UTC')
  AND event IN ('plugin_run_started', 'plugin_run_completed', 'plugin_run_failed')
  AND ifNull(properties.is_test_event, false) != true
`;
}

function getDeduplicatedPerformanceQuery(start, end) {
  const startDateTime = escapeHogqlString(formatHogqlDateTime(start));
  const endDateTime = escapeHogqlString(formatHogqlDateTime(end));

  return `
SELECT
  count() AS performance_runs,
  quantile(0.5)(duration_ms) AS median_duration_ms,
  quantile(0.9)(duration_ms) AS p90_duration_ms
FROM (
  SELECT
    ${RUN_DEDUPLICATION_EXPRESSION} AS run_id,
    any(toFloat(properties.duration_ms)) AS duration_ms
  FROM events
  WHERE timestamp >= toDateTime('${startDateTime}', 'UTC')
    AND timestamp < toDateTime('${endDateTime}', 'UTC')
    AND event = 'plugin_run_completed'
    AND isNotNull(properties.duration_ms)
    AND toString(properties.performance_measurement_version) = '${PERFORMANCE_MEASUREMENT_VERSION}'
    AND ifNull(properties.is_test_event, false) != true
  GROUP BY run_id
)
`;
}

function getPointEditingReadinessQuery() {
  const releaseStart = escapeHogqlString(formatHogqlDateTime(getMoscowDayStartUtc(POINT_EDITING_RELEASE_DAY)));

  return `
SELECT
  uniqExact(${RUN_DEDUPLICATION_EXPRESSION}) AS successful_runs
FROM events
WHERE timestamp >= toDateTime('${releaseStart}', 'UTC')
  AND event = 'plugin_run_completed'
  AND toString(properties.performance_measurement_version) = '${PERFORMANCE_MEASUREMENT_VERSION}'
  AND startsWith(toString(properties.plugin_release), '${POINT_EDITING_RELEASE}')
  AND ifNull(properties.is_test_event, false) != true
`;
}

function getErrorCategoriesQuery(start, end) {
  const startDateTime = escapeHogqlString(formatHogqlDateTime(start));
  const endDateTime = escapeHogqlString(formatHogqlDateTime(end));

  return `
SELECT
  toString(properties.error_category) AS error_category,
  uniqExact(${RUN_DEDUPLICATION_EXPRESSION}) AS total
FROM events
WHERE timestamp >= toDateTime('${startDateTime}', 'UTC')
  AND timestamp < toDateTime('${endDateTime}', 'UTC')
  AND event = 'plugin_run_failed'
  AND isNotNull(properties.error_category)
  AND toString(properties.error_category) != ''
  AND ifNull(properties.is_test_event, false) != true
GROUP BY error_category
ORDER BY total DESC, error_category ASC
`;
}

function getWeeklyPerformanceQuery(start, end) {
  const startDateTime = escapeHogqlString(formatHogqlDateTime(start));
  const endDateTime = escapeHogqlString(formatHogqlDateTime(end));
  const timingColumns = PERFORMANCE_TIMING_COLUMNS
    .map(
      (item) =>
        `  avg(${item.property}) AS ${item.property}`
    )
    .join(",\n");
  const timingRunColumns = PERFORMANCE_TIMING_COLUMNS
    .map(
      (item) =>
        `    any(toFloat(properties.${item.property})) AS ${item.property}`
    )
    .join(",\n");

  return `
SELECT
  count() AS successful_runs,
  avg(duration_ms) AS average_duration_ms,
  quantile(0.9)(duration_ms) AS p90_duration_ms,
  max(duration_ms) AS slowest_duration_ms,
${timingColumns}
FROM (
  SELECT
    ${RUN_DEDUPLICATION_EXPRESSION} AS run_id,
    any(toFloat(properties.duration_ms)) AS duration_ms,
${timingRunColumns}
  FROM events
  WHERE timestamp >= toDateTime('${startDateTime}', 'UTC')
    AND timestamp < toDateTime('${endDateTime}', 'UTC')
    AND event = 'plugin_run_completed'
    AND isNotNull(properties.duration_ms)
    AND toString(properties.performance_measurement_version) = '${PERFORMANCE_MEASUREMENT_VERSION}'
    AND ifNull(properties.is_test_event, false) != true
  GROUP BY run_id
)
`;
}

function getWeeklyErrorSummaryQuery(start, end) {
  const startDateTime = escapeHogqlString(formatHogqlDateTime(start));
  const endDateTime = escapeHogqlString(formatHogqlDateTime(end));

  return `
SELECT
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_started') AS typograph_runs,
  uniqExactIf(${RUN_DEDUPLICATION_EXPRESSION}, event = 'plugin_run_failed') AS failed_runs,
  uniqExactIf(distinct_id, event = 'plugin_run_failed') AS affected_users
FROM events
WHERE timestamp >= toDateTime('${startDateTime}', 'UTC')
  AND timestamp < toDateTime('${endDateTime}', 'UTC')
  AND event IN ('plugin_run_started', 'plugin_run_failed')
  AND ifNull(properties.is_test_event, false) != true
`;
}

function getErrorScopesQuery(start, end) {
  const startDateTime = escapeHogqlString(formatHogqlDateTime(start));
  const endDateTime = escapeHogqlString(formatHogqlDateTime(end));

  return `
SELECT
  toString(properties.selection_scope) AS selection_scope,
  uniqExact(${RUN_DEDUPLICATION_EXPRESSION}) AS total
FROM events
WHERE timestamp >= toDateTime('${startDateTime}', 'UTC')
  AND timestamp < toDateTime('${endDateTime}', 'UTC')
  AND event = 'plugin_run_failed'
  AND isNotNull(properties.selection_scope)
  AND toString(properties.selection_scope) != ''
  AND ifNull(properties.is_test_event, false) != true
GROUP BY selection_scope
ORDER BY total DESC, selection_scope ASC
`;
}

async function queryPostHog(query, name, env) {
  const posthogHost = env.POSTHOG_HOST || DEFAULT_POSTHOG_HOST;
  const posthogProjectId = env.POSTHOG_PROJECT_ID || DEFAULT_POSTHOG_PROJECT_ID;
  const response = await fetch(`${posthogHost}/api/projects/${posthogProjectId}/query/`, {
    body: JSON.stringify({
      name,
      query: {
        kind: "HogQLQuery",
        query,
      },
    }),
    headers: {
      Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PostHog query failed: ${response.status} ${body}`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new AnalyticsReportError("PostHog query returned invalid JSON", POSTHOG_UNEXPECTED_RESPONSE_REASON);
  }
}

async function fetchPostHogSummary(dateRange, env = process.env) {
  assertRequiredEnv(env, ["POSTHOG_PERSONAL_API_KEY"]);
  const baselineStart = new Date(dateRange.start.getTime() - 7 * MS_IN_DAY);
  const [summaryPayload, baselinePayload, categoriesPayload, performancePayload, baselinePerformancePayload, pointEditingPayload] = await Promise.all([
    queryPostHog(getAnalyticsQuery(dateRange.start, dateRange.end), "chistovik telegram daily summary", env),
    queryPostHog(getBaselineAnalyticsQuery(baselineStart, dateRange.start), "chistovik telegram seven day baseline", env),
    queryPostHog(getErrorCategoriesQuery(dateRange.start, dateRange.end), "chistovik telegram error categories", env),
    queryPostHog(getDeduplicatedPerformanceQuery(dateRange.start, dateRange.end), "chistovik telegram daily performance without duplicates", env),
    queryPostHog(getDeduplicatedPerformanceQuery(baselineStart, dateRange.start), "chistovik telegram baseline performance without duplicates", env),
    queryPostHog(getPointEditingReadinessQuery(), "chistovik point editing readiness", env),
  ]);

  const row = Array.isArray(summaryPayload.results) && Array.isArray(summaryPayload.results[0]) ? summaryPayload.results[0] : null;
  const baselineRow = Array.isArray(baselinePayload.results) && Array.isArray(baselinePayload.results[0]) ? baselinePayload.results[0] : null;

  if (row === null || row.length < SUMMARY_COLUMNS.length) {
    throw new AnalyticsReportError("PostHog query returned unexpected result shape", POSTHOG_UNEXPECTED_RESPONSE_REASON);
  }

  if (baselineRow === null || baselineRow.length < BASELINE_COLUMNS.length || !Array.isArray(categoriesPayload.results)) {
    throw new AnalyticsReportError("PostHog baseline query returned unexpected result shape", POSTHOG_UNEXPECTED_RESPONSE_REASON);
  }

  const summary = Object.fromEntries(SUMMARY_COLUMNS.map((column, index) => [column, Number(row[index] || 0)]));
  const baseline = Object.fromEntries(BASELINE_COLUMNS.map((column, index) => [column, Number(baselineRow[index] || 0)]));
  const performance = parseNumericResult(performancePayload, DEDUPLICATED_PERFORMANCE_COLUMNS);
  const baselinePerformance = parseNumericResult(baselinePerformancePayload, DEDUPLICATED_PERFORMANCE_COLUMNS);
  const pointEditing = parseNumericResult(pointEditingPayload, ["successfulRuns"]);
  const errorCategories = categoriesPayload.results
    .filter((categoryRow) => Array.isArray(categoryRow) && typeof categoryRow[0] === "string")
    .map((categoryRow) => ({
      category: categoryRow[0],
      count: Number(categoryRow[1] || 0),
    }))
    .filter((item) => item.count > 0);

  return {
    ...summary,
    performanceRuns: performance.performanceRuns,
    medianDurationMs: performance.medianDurationMs,
    p90DurationMs: performance.p90DurationMs,
    baseline: {
      averageDailyRuns: baseline.typographRuns / 7,
      failedRate: baseline.typographRuns > 0 ? baseline.failedRuns / baseline.typographRuns : null,
      performanceRuns: baselinePerformance.performanceRuns,
      medianDurationMs: baselinePerformance.medianDurationMs,
      p90DurationMs: baselinePerformance.p90DurationMs,
    },
    errorCategories,
    pointEditingReadiness: {
      fullDays: getPointEditingFullDays(dateRange.end),
      successfulRuns: pointEditing.successfulRuns,
    },
  };
}

function parseNumericResult(payload, columns) {
  const row = Array.isArray(payload.results) && Array.isArray(payload.results[0]) ? payload.results[0] : null;

  if (row === null || row.length < columns.length) {
    throw new AnalyticsReportError("PostHog query returned unexpected result shape", POSTHOG_UNEXPECTED_RESPONSE_REASON);
  }

  return Object.fromEntries(columns.map((column, index) => [column, Number(row[index] || 0)]));
}

function parseGroupedResults(payload, keyName) {
  if (!Array.isArray(payload.results)) {
    throw new AnalyticsReportError("PostHog grouped query returned unexpected result shape", POSTHOG_UNEXPECTED_RESPONSE_REASON);
  }

  return payload.results
    .filter((row) => Array.isArray(row) && typeof row[0] === "string")
    .map((row) => ({
      [keyName]: row[0],
      count: Number(row[1] || 0),
    }))
    .filter((item) => item.count > 0);
}

async function fetchWeeklyPerformanceSummary(dateRange, env = process.env) {
  assertRequiredEnv(env, ["POSTHOG_PERSONAL_API_KEY"]);
  const [currentPayload, baselinePayload] = await Promise.all([
    queryPostHog(
      getWeeklyPerformanceQuery(dateRange.start, dateRange.end),
      "chistovik telegram weekly performance",
      env
    ),
    queryPostHog(
      getWeeklyPerformanceQuery(dateRange.baselineStart, dateRange.start),
      "chistovik telegram previous weekly performance",
      env
    ),
  ]);

  return {
    ...parseNumericResult(currentPayload, PERFORMANCE_COLUMNS),
    baseline: parseNumericResult(baselinePayload, PERFORMANCE_COLUMNS),
  };
}

async function fetchWeeklyErrorsSummary(dateRange, env = process.env) {
  assertRequiredEnv(env, ["POSTHOG_PERSONAL_API_KEY"]);
  const [currentPayload, baselinePayload, categoriesPayload, scopesPayload] = await Promise.all([
    queryPostHog(
      getWeeklyErrorSummaryQuery(dateRange.start, dateRange.end),
      "chistovik telegram weekly errors",
      env
    ),
    queryPostHog(
      getWeeklyErrorSummaryQuery(dateRange.baselineStart, dateRange.start),
      "chistovik telegram previous weekly errors",
      env
    ),
    queryPostHog(
      getErrorCategoriesQuery(dateRange.start, dateRange.end),
      "chistovik telegram weekly error categories",
      env
    ),
    queryPostHog(
      getErrorScopesQuery(dateRange.start, dateRange.end),
      "chistovik telegram weekly error scopes",
      env
    ),
  ]);

  return {
    ...parseNumericResult(currentPayload, WEEKLY_ERROR_SUMMARY_COLUMNS),
    baseline: parseNumericResult(baselinePayload, WEEKLY_ERROR_SUMMARY_COLUMNS),
    errorCategories: parseGroupedResults(categoriesPayload, "category"),
    errorScopes: parseGroupedResults(scopesPayload, "scope"),
  };
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatSignedPercent(value) {
  return `${Math.round(Math.abs(value) * 100)}%`;
}

function formatDuration(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return null;
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)} мс`;
  }

  return `${(durationMs / 1000).toFixed(1).replace(".", ",")} секунды`;
}

function formatRunsInsight(currentRuns, averageDailyRuns) {
  if (!Number.isFinite(averageDailyRuns) || averageDailyRuns < 1) {
    return null;
  }

  const change = (currentRuns - averageDailyRuns) / averageDailyRuns;

  if (Math.abs(change) < 0.1) {
    return "📍 Плагин запускали примерно как обычно";
  }

  if (change > 0) {
    return `📍 Плагин запускали на ${formatSignedPercent(change)} больше среднего за последние 7 дней`;
  }

  return `📍 Плагин запускали на ${formatSignedPercent(change)} меньше среднего за последние 7 дней`;
}

function formatPerformanceComparison(currentValue, baselineValue, slowerWord, fasterWord) {
  if (!Number.isFinite(currentValue) || currentValue <= 0 || !Number.isFinite(baselineValue) || baselineValue <= 0) {
    return "данных пока мало для надёжного сравнения";
  }

  const change = (currentValue - baselineValue) / baselineValue;

  if (Math.abs(change) < 0.1) {
    return "без заметных изменений";
  }

  if (change > 0.25) {
    return `заметно ${slowerWord}, на ${formatSignedPercent(change)}`;
  }

  if (change > 0) {
    return `немного ${slowerWord}, на ${formatSignedPercent(change)}`;
  }

  if (change < -0.25) {
    return `заметно ${fasterWord}, на ${formatSignedPercent(change)}`;
  }

  return `немного ${fasterWord}, на ${formatSignedPercent(change)}`;
}

function getRussianPlural(value, one, few, many) {
  const absolute = Math.abs(value) % 100;
  const lastDigit = absolute % 10;

  if (absolute > 10 && absolute < 20) {
    return many;
  }

  if (lastDigit === 1) {
    return one;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }

  return many;
}

function formatErrorAttempts(summary) {
  const attemptsWord = getRussianPlural(summary.failedRuns, "фейл", "фейла", "фейлов");
  const usersWord = getRussianPlural(summary.affectedUsers, "пользователя", "пользователей", "пользователей");

  return `${summary.failedRuns} ${attemptsWord} у ${summary.affectedUsers} ${usersWord}`;
}

function formatMainErrorCause(summary) {
  if (!Array.isArray(summary.errorCategories) || summary.errorCategories.length === 0) {
    return null;
  }

  const sorted = summary.errorCategories
    .filter((item) => item.category !== "unknown" && ERROR_CATEGORY_LABELS[item.category] && item.count > 0)
    .slice()
    .sort((left, right) => right.count - left.count)
    .slice(0, 2);

  if (sorted.length === 0) {
    return null;
  }

  const first = sorted[0];
  const second = sorted[1];
  const firstLabel = ERROR_CATEGORY_LABELS[first.category];
  const firstReason = `${firstLabel} (${first.count} из ${summary.failedRuns} ошибок)`;

  if (second) {
    const secondLabel = ERROR_CATEGORY_LABELS[second.category];
    const secondReason = `${secondLabel} (${second.count} из ${summary.failedRuns} ошибок)`;
    return `основные причины — ${firstReason}, ${secondReason}`;
  }

  return `основная причина — ${firstReason}`;
}

function formatErrorsInsight(failedRate, baselineFailedRate) {
  if (!Number.isFinite(failedRate) || failedRate === null || !Number.isFinite(baselineFailedRate) || baselineFailedRate === null) {
    return null;
  }

  if (baselineFailedRate === 0) {
    return failedRate > 0 ? "📍 За предыдущие 7 дней ошибок не было" : null;
  }

  const change = (failedRate - baselineFailedRate) / baselineFailedRate;

  if (Math.abs(change) < 0.1) {
    return "📍 Доля ошибок примерно такая же, как в среднем за последние 7 дней";
  }

  if (change > 0) {
    return `📍 Это на ${formatSignedPercent(change)} больше среднего за последние 7 дней`;
  }

  return `📍 Это на ${formatSignedPercent(change)} меньше среднего за последние 7 дней`;
}

function formatPerformanceInsight(currentValue, baselineValue) {
  if (!Number.isFinite(currentValue) || currentValue <= 0 || !Number.isFinite(baselineValue) || baselineValue <= 0) {
    return null;
  }

  const change = (currentValue - baselineValue) / baselineValue;

  if (Math.abs(change) < 0.1) {
    return "📍 Скорость примерно такая же, как в среднем за последние 7 дней";
  }

  if (change > 0) {
    return `📍 Скорость на ${formatSignedPercent(change)} медленнее средней за последние 7 дней`;
  }

  return `📍 Скорость на ${formatSignedPercent(change)} быстрее средней за последние 7 дней`;
}

function formatPointEditingReadinessMessage(readiness, phase = POINT_EDITING_PHASE) {
  if (phase !== "baseline") {
    return null;
  }

  const fullDays = Number(readiness?.fullDays || 0);
  const successfulRuns = Number(readiness?.successfulRuns || 0);

  if (fullDays >= POINT_EDITING_MIN_FULL_DAYS && successfulRuns >= POINT_EDITING_MIN_SUCCESSFUL_RUNS) {
    return POINT_EDITING_READY_MESSAGE;
  }

  return POINT_EDITING_WAIT_MESSAGE;
}

function formatAnalyticsMessage(dateRange, summary, env = process.env) {
  const dashboardUrl = env.POSTHOG_DASHBOARD_URL || DEFAULT_POSTHOG_DASHBOARD_URL;
  const heading = `<b>✦ Чистовик ${escapeHtml(dateRange.label)} (${formatRussianWeekday(dateRange)})</b>`;
  const readinessMessage = formatPointEditingReadinessMessage(summary.pointEditingReadiness);
  const headingLines = readinessMessage ? [heading, "", readinessMessage] : [heading];

  if (summary.typographRuns === 0) {
    const emptyLines = [...headingLines, "", "Плагин никто не запускал"];

    if (dashboardUrl) {
      emptyLines.push("", `<a href="${escapeHtml(dashboardUrl)}">Полный дашборд с графиками</a> (открывается только с vpn)`);
    }

    return emptyLines.join("\n");
  }

  const runsWithoutFinalStatus = Math.max(0, summary.typographRuns - summary.successfulRuns - summary.failedRuns);
  const completedRuns = summary.successfulRuns + summary.failedRuns;
  const successRate = completedRuns > 0 ? summary.successfulRuns / completedRuns : null;
  const failedRate = summary.typographRuns > 0 ? summary.failedRuns / summary.typographRuns : null;
  const baselineFailedRate = summary.baseline?.failedRate;
  const runsInsight = formatRunsInsight(summary.typographRuns, summary.baseline?.averageDailyRuns);
  const lines = [
    ...headingLines,
    "",
    `Запуски типографа: ${summary.typographRuns}`,
    `Уникальные пользователи: ${summary.uniqueUsers}`,
    completedRuns > 0
      ? `Успешные обработки: ${summary.successfulRuns} — это ${formatPercent(successRate)}`
      : "Успешные обработки: 0 — пока нет завершённых запусков",
    `Без финального статуса: ${runsWithoutFinalStatus}`,
  ];

  if (runsInsight) {
    lines.push("", runsInsight);
  }

  lines.push("", "Ошибки:");

  if (summary.failedRuns === 0) {
    lines.push("— ошибок не было");
  } else {
    const mainErrorCause = formatMainErrorCause(summary);

    lines.push(
      `— ${formatErrorAttempts(summary)}`,
      `— ${formatPercent(failedRate)} от всех запусков`
    );

    if (mainErrorCause) {
      lines.push(`— ${mainErrorCause}`);
    }

    const errorsInsight = formatErrorsInsight(failedRate, baselineFailedRate);

    if (errorsInsight) {
      lines.push("", errorsInsight);
    }
  }

  const medianDuration = formatDuration(summary.medianDurationMs);
  const p90Duration = formatDuration(summary.p90DurationMs);
  const performanceLines = [];

  if (medianDuration !== null && summary.performanceRuns > 0) {
    performanceLines.push(
      `— обычное время обработки: ${medianDuration} — ${formatPerformanceComparison(
        summary.medianDurationMs,
        summary.baseline?.medianDurationMs,
        "медленнее",
        "быстрее"
      )}`
    );
  }

  if (p90Duration !== null && summary.performanceRuns >= MIN_WEEKLY_PERFORMANCE_RUNS) {
    performanceLines.push(
      `— 90% обработок за ${p90Duration} — ${formatPerformanceComparison(
        summary.p90DurationMs,
        summary.baseline?.p90DurationMs,
        "хуже",
        "лучше"
      )}`
    );
  }

  if (performanceLines.length > 0) {
    lines.push("", "Производительность:", ...performanceLines);

    const performanceInsight =
      summary.performanceRuns > 0 && (summary.baseline?.performanceRuns || 0) > 0
        ? formatPerformanceInsight(summary.medianDurationMs, summary.baseline?.medianDurationMs)
        : null;

    if (performanceInsight) {
      lines.push("", performanceInsight);
    }
  }

  lines.push(
    "",
    "Режимы:",
    `— Быстрый запуск: ${summary.modeDefault}`,
    `— Для красоты: ${summary.modeBeauty}`,
    `— Для разработки: ${summary.modeDevelopment}`,
    "",
    "Область:",
    `— текстовый слой: ${summary.scopeSingleText}`,
    `— фрейм: ${summary.scopeContainer}`,
    `— страница: ${summary.scopePage}`,
    `— мультивыбор: ${summary.scopeMultiSelection}`,
    "",
    "Опции:",
    `— со скрытыми слоями: ${summary.runsWithHiddenNodes}`,
    `— со слоями с замочком: ${summary.runsWithLockedNodes}`,
    `— с перекраской звездочек: ${summary.runsWithRecoloredAsterisks}`,
    "",
    `Открытия настроек: ${summary.settingsOpened}`,
    `Переходы в канал: ${summary.channelLinkClicked}`
  );

  if (dashboardUrl) {
    lines.push("", `<a href="${escapeHtml(dashboardUrl)}">Полный дашборд с графиками</a> (открывается только с vpn)`);
  }

  return lines.join("\n");
}

function getPerformanceDashboardUrl(env) {
  return env.POSTHOG_PERFORMANCE_DASHBOARD_URL || DEFAULT_POSTHOG_PERFORMANCE_DASHBOARD_URL;
}

function appendPerformanceDashboardLink(lines, env) {
  const dashboardUrl = getPerformanceDashboardUrl(env);

  lines.push(
    "",
    `<a href="${escapeHtml(dashboardUrl)}">Дашборд по производительности</a> (открывается только с vpn)`
  );
}

function formatWeeklyPerformanceInsight(currentAverage, baselineAverage, baselineRuns) {
  if (
    baselineRuns < MIN_WEEKLY_PERFORMANCE_RUNS ||
    !Number.isFinite(currentAverage) ||
    currentAverage <= 0 ||
    !Number.isFinite(baselineAverage) ||
    baselineAverage <= 0
  ) {
    return null;
  }

  const change = (currentAverage - baselineAverage) / baselineAverage;

  if (Math.abs(change) < 0.1) {
    return "📍 Скорость примерно такая же, как за предыдущие 7 дней";
  }

  if (change > 0) {
    return `📍 Скорость стала на ${formatSignedPercent(change)} медленнее, чем за предыдущие 7 дней`;
  }

  return `📍 Скорость стала на ${formatSignedPercent(change)} быстрее, чем за предыдущие 7 дней`;
}

function getPerformanceBreakdown(summary) {
  return PERFORMANCE_TIMING_COLUMNS
    .map((item) => ({
      key: item.key,
      label: item.label,
      value: Number(summary[item.key] || 0),
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value);
}

function formatWeeklyPerformanceMessage(dateRange, summary, env = process.env) {
  const lines = [`<b>✦ Скорость за ${escapeHtml(dateRange.label)}</b>`];

  if (
    summary.successfulRuns < MIN_WEEKLY_PERFORMANCE_RUNS ||
    !Number.isFinite(summary.averageDurationMs) ||
    summary.averageDurationMs <= 0
  ) {
    lines.push("", "Слишком мало запусков за последние 7 дней, чтобы оценить скорость");
    appendPerformanceDashboardLink(lines, env);
    return lines.join("\n");
  }

  lines.push(
    "",
    `Успешные обработки: ${summary.successfulRuns}`,
    `Среднее время: ${formatDuration(summary.averageDurationMs)}`,
    `90% обработок: за ${formatDuration(summary.p90DurationMs)}`,
    `Самый медленный запуск: ${formatDuration(summary.slowestDurationMs)}`
  );

  const breakdown = getPerformanceBreakdown(summary);

  if (breakdown.length > 0) {
    lines.push("", "Разбивка по времени:");

    for (const item of breakdown) {
      lines.push(`— ${item.label}: ${formatDuration(item.value)}`);
    }
  }

  const performanceInsight = formatWeeklyPerformanceInsight(
    summary.averageDurationMs,
    summary.baseline?.averageDurationMs,
    summary.baseline?.successfulRuns || 0
  );

  if (performanceInsight) {
    lines.push("", performanceInsight);
  }

  if (breakdown.length > 0 && breakdown[0].key !== "otherMs") {
    lines.push(`📍 Основная задержка — ${breakdown[0].label}`);
  }

  appendPerformanceDashboardLink(lines, env);
  return lines.join("\n");
}

function formatWeeklyErrorComparison(summary) {
  if (summary.typographRuns <= 0 || summary.baseline?.typographRuns <= 0) {
    return null;
  }

  const currentRate = summary.failedRuns / summary.typographRuns;
  const baselineRate = summary.baseline.failedRuns / summary.baseline.typographRuns;

  if (baselineRate === 0) {
    return currentRate > 0 ? "📍 За предыдущие 7 дней ошибок не было" : null;
  }

  const change = (currentRate - baselineRate) / baselineRate;

  if (Math.abs(change) < 0.1) {
    return "📍 Ошибок примерно столько же, сколько за предыдущие 7 дней";
  }

  if (change > 0) {
    return `📍 Ошибок на ${formatSignedPercent(change)} больше, чем за предыдущие 7 дней`;
  }

  return `📍 Ошибок на ${formatSignedPercent(change)} меньше, чем за предыдущие 7 дней`;
}

function getWeeklyMainErrorInsight(errorCategories) {
  if (!Array.isArray(errorCategories) || errorCategories.length === 0) {
    return null;
  }

  const sorted = errorCategories
    .filter((item) => item.count > 0)
    .slice()
    .sort((left, right) => right.count - left.count);

  if (sorted.length === 0) {
    return null;
  }

  const highestCount = sorted[0].count;
  const mainCategories = sorted.filter((item) => item.count === highestCount);
  const labels = mainCategories.map((item) => ERROR_CATEGORY_LABELS[item.category] || "другая причина");

  if (labels.length === 1) {
    return `📍 Основная причина — ${labels[0]}`;
  }

  return `📍 Основные причины — ${labels.join(", ")}`;
}

function formatWeeklyErrorsMessage(dateRange, summary, env = process.env) {
  const lines = [`<b>✦ Ошибки за ${escapeHtml(dateRange.label)}</b>`];

  if (summary.failedRuns === 0) {
    lines.push("", "За последние 7 дней ошибок не было");
    appendPerformanceDashboardLink(lines, env);
    return lines.join("\n");
  }

  const failedRate = summary.typographRuns > 0 ? summary.failedRuns / summary.typographRuns : null;

  lines.push(
    "",
    `Запуски типографа: ${summary.typographRuns}`,
    `Ошибки: ${summary.failedRuns}`,
    `Пострадавшие пользователи: ${summary.affectedUsers}`
  );

  if (failedRate !== null) {
    lines.push(`Доля запусков с ошибкой: ${formatPercent(failedRate)}`);
  }

  const errorCategories = Array.isArray(summary.errorCategories)
    ? summary.errorCategories
        .filter((item) => item.count > 0)
        .slice()
        .sort((left, right) => right.count - left.count)
    : [];

  if (errorCategories.length > 0) {
    const errorsWord = getRussianPlural(summary.failedRuns, "ошибки", "ошибок", "ошибок");
    lines.push("", "Разбивка по причинам:");

    for (const item of errorCategories) {
      const label = ERROR_CATEGORY_LABELS[item.category] || "другая причина";
      lines.push(`— ${label}: ${item.count} из ${summary.failedRuns} ${errorsWord}`);
    }
  }

  const errorScopes = Array.isArray(summary.errorScopes)
    ? summary.errorScopes
        .filter((item) => item.count > 0 && ERROR_SCOPE_LABELS[item.scope])
        .slice()
        .sort((left, right) => right.count - left.count)
    : [];

  if (errorScopes.length > 0) {
    lines.push("", "Где происходили ошибки:");

    for (const item of errorScopes) {
      lines.push(`— ${ERROR_SCOPE_LABELS[item.scope]}: ${item.count}`);
    }
  }

  const comparisonInsight = formatWeeklyErrorComparison(summary);
  const mainErrorInsight = getWeeklyMainErrorInsight(errorCategories);

  if (comparisonInsight || mainErrorInsight) {
    lines.push("");
  }

  if (comparisonInsight) {
    lines.push(comparisonInsight);
  }

  if (mainErrorInsight) {
    lines.push(mainErrorInsight);
  }

  appendPerformanceDashboardLink(lines, env);
  return lines.join("\n");
}

function formatWeeklyFailureMessage(subject, dateRange, reason, env = process.env) {
  const lines = [
    `<b>🛑 Не удалось собрать отчёт «${escapeHtml(subject)}» за ${escapeHtml(dateRange.label)}</b>`,
    "",
    escapeHtml(reason),
  ];

  appendPerformanceDashboardLink(lines, env);
  return lines.join("\n");
}

function formatAnalyticsFailureMessage(dateRange, reason, env = process.env) {
  const dashboardUrl = env.POSTHOG_DASHBOARD_URL || DEFAULT_POSTHOG_DASHBOARD_URL;
  const lines = [
    `<b>🛑 Не удалось собрать отчёт за ${escapeHtml(formatRussianDate(dateRange))} (${formatRussianWeekday(dateRange)})</b>`,
    "",
    `${escapeHtml(reason)} Попробуй проверить данные <a href="${escapeHtml(dashboardUrl)}">в полном дашборде</a> (открывается только с vpn)`,
  ];

  return lines.join("\n");
}

async function sendTelegramMessage(text, env = process.env, chatId = env.TELEGRAM_CHAT_ID) {
  assertRequiredEnv(env, ["TELEGRAM_BOT_TOKEN"]);

  if (typeof chatId !== "string" || chatId.length === 0) {
    throw new Error("Missing Telegram chat id");
  }

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: true,
      parse_mode: "HTML",
      text,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
  }
}

async function createAnalyticsMessage(period, env = process.env) {
  const dateRange = getMoscowReportRange(period);
  const summary = await fetchPostHogSummary(dateRange, env);

  return formatAnalyticsMessage(dateRange, summary, env);
}

async function createAnalyticsMessageOrDiagnostic(period, env = process.env) {
  const dateRange = getMoscowReportRange(period);

  try {
    const summary = await fetchPostHogSummary(dateRange, env);

    return formatAnalyticsMessage(dateRange, summary, env);
  } catch (error) {
    if (error instanceof AnalyticsReportError) {
      console.error(error);

      return formatAnalyticsFailureMessage(dateRange, error.publicReason, env);
    }

    throw error;
  }
}

async function createWeeklyPerformanceMessageOrDiagnostic(env = process.env) {
  const dateRange = getMoscowCompletedWeekRange();

  try {
    const summary = await fetchWeeklyPerformanceSummary(dateRange, env);

    return formatWeeklyPerformanceMessage(dateRange, summary, env);
  } catch (error) {
    if (error instanceof AnalyticsReportError) {
      console.error(error);

      return formatWeeklyFailureMessage("Скорость", dateRange, error.publicReason, env);
    }

    throw error;
  }
}

async function createWeeklyErrorsMessageOrDiagnostic(env = process.env) {
  const dateRange = getMoscowCompletedWeekRange();

  try {
    const summary = await fetchWeeklyErrorsSummary(dateRange, env);

    return formatWeeklyErrorsMessage(dateRange, summary, env);
  } catch (error) {
    if (error instanceof AnalyticsReportError) {
      console.error(error);

      return formatWeeklyFailureMessage("Ошибки", dateRange, error.publicReason, env);
    }

    throw error;
  }
}

module.exports = {
  AnalyticsReportError,
  assertRequiredEnv,
  createAnalyticsMessage,
  createAnalyticsMessageOrDiagnostic,
  createWeeklyErrorsMessageOrDiagnostic,
  createWeeklyPerformanceMessageOrDiagnostic,
  fetchPostHogSummary,
  fetchWeeklyErrorsSummary,
  fetchWeeklyPerformanceSummary,
  formatAnalyticsFailureMessage,
  formatAnalyticsMessage,
  formatPointEditingReadinessMessage,
  formatRussianDate,
  formatWeeklyErrorsMessage,
  formatWeeklyPerformanceMessage,
  getMoscowCompletedWeekRange,
  getMoscowReportRange,
  getPointEditingFullDays,
  sendTelegramMessage,
};
