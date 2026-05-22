const MOSCOW_TIME_ZONE = "Europe/Moscow";
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_POSTHOG_HOST = "https://eu.posthog.com";
const DEFAULT_POSTHOG_PROJECT_ID = "184090";
const DEFAULT_POSTHOG_DASHBOARD_URL = "https://eu.posthog.com/project/184090/dashboard/695809";

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
  uniqExact(distinct_id) AS unique_users,
  countIf(event = 'plugin_run_started') AS typograph_runs,
  countIf(event = 'plugin_run_completed') AS successful_runs,
  countIf(event = 'plugin_run_failed') AS failed_runs,
  countIf(event = 'plugin_run_started' AND properties.mode = 'default') AS mode_default,
  countIf(event = 'plugin_run_started' AND properties.mode = 'beauty') AS mode_beauty,
  countIf(event = 'plugin_run_started' AND properties.mode = 'development') AS mode_development,
  countIf(event = 'plugin_run_started' AND properties.selection_scope = 'single_text') AS scope_single_text,
  countIf(event = 'plugin_run_started' AND properties.selection_scope = 'container') AS scope_container,
  countIf(event = 'plugin_run_started' AND properties.selection_scope = 'page') AS scope_page,
  countIf(event = 'plugin_run_started' AND properties.selection_scope = 'multi_selection') AS scope_multi_selection,
  countIf(event = 'plugin_run_started' AND properties.process_hidden_nodes = true) AS runs_with_hidden_nodes,
  countIf(event = 'plugin_run_started' AND properties.process_locked_nodes = true) AS runs_with_locked_nodes,
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

async function fetchPostHogSummary(dateRange, env = process.env) {
  assertRequiredEnv(env, ["POSTHOG_PERSONAL_API_KEY"]);

  const posthogHost = env.POSTHOG_HOST || DEFAULT_POSTHOG_HOST;
  const posthogProjectId = env.POSTHOG_PROJECT_ID || DEFAULT_POSTHOG_PROJECT_ID;
  const response = await fetch(`${posthogHost}/api/projects/${posthogProjectId}/query/`, {
    body: JSON.stringify({
      name: "chistovik telegram report",
      query: {
        kind: "HogQLQuery",
        query: getAnalyticsQuery(dateRange.start, dateRange.end),
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

  const payload = await response.json();
  const row = Array.isArray(payload.results) && Array.isArray(payload.results[0]) ? payload.results[0] : [];
  const columns = [
    "uniqueUsers",
    "typographRuns",
    "successfulRuns",
    "failedRuns",
    "modeDefault",
    "modeBeauty",
    "modeDevelopment",
    "scopeSingleText",
    "scopeContainer",
    "scopePage",
    "scopeMultiSelection",
    "runsWithHiddenNodes",
    "runsWithLockedNodes",
    "settingsOpened",
    "channelLinkClicked",
  ];

  return Object.fromEntries(columns.map((column, index) => [column, Number(row[index] || 0)]));
}

function formatAnalyticsMessage(dateRange, summary, env = process.env) {
  const runsWithoutFinalStatus = Math.max(0, summary.typographRuns - summary.successfulRuns - summary.failedRuns);
  const lines = [
    `<b>✦ Чистовик ${escapeHtml(dateRange.label)}</b>`,
    "",
    `Уникальные пользователи: ${summary.uniqueUsers}`,
    `Запуски типографа: ${summary.typographRuns}`,
    `Успешные обработки: ${summary.successfulRuns}`,
    `Ошибки: ${summary.failedRuns}`,
    `Без финального статуса: ${runsWithoutFinalStatus}`,
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
    "",
    `Открытия настроек: ${summary.settingsOpened}`,
    `Переходы в канал: ${summary.channelLinkClicked}`,
  ];

  const dashboardUrl = env.POSTHOG_DASHBOARD_URL || DEFAULT_POSTHOG_DASHBOARD_URL;

  if (dashboardUrl) {
    lines.push("", `<a href="${escapeHtml(dashboardUrl)}">Полный дашборд с графиками</a> (открывается только с vpn)`);
  }

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

module.exports = {
  assertRequiredEnv,
  createAnalyticsMessage,
  fetchPostHogSummary,
  formatAnalyticsMessage,
  formatRussianDate,
  getMoscowReportRange,
  sendTelegramMessage,
};
