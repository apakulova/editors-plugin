const assert = require("assert");

const {
  createAnalyticsMessageOrDiagnostic,
  formatAnalyticsFailureMessage,
  formatAnalyticsMessage,
  getMoscowReportRange,
} = require("./lib/analytics-report");

const originalFetch = global.fetch;
const originalConsoleError = console.error;

function createResponse(payload) {
  return {
    json: async () => payload,
    ok: true,
  };
}

async function withMockedFetch(payloads, callback) {
  let callIndex = 0;
  global.fetch = async () => createResponse(payloads[callIndex++] ?? { results: [] });
  console.error = () => {};

  try {
    await callback();
  } finally {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  }
}

function createSummary(overrides = {}) {
  return {
    affectedUsers: 1,
    baseline: {
      averageDailyRuns: 25,
      failedRate: 0.04,
      medianDurationMs: 400,
      p90DurationMs: 1385,
    },
    channelLinkClicked: 0,
    errorCategories: [
      { category: "font_unavailable", count: 4 },
      { category: "write_text_failed", count: 1 },
    ],
    failedRuns: 5,
    medianDurationMs: 420,
    modeBeauty: 0,
    modeDefault: 28,
    modeDevelopment: 0,
    p90DurationMs: 1800,
    runsWithHiddenNodes: 0,
    runsWithLockedNodes: 0,
    runsWithRecoloredAsterisks: 0,
    scopeContainer: 14,
    scopeMultiSelection: 0,
    scopePage: 1,
    scopeSingleText: 13,
    settingsOpened: 0,
    successfulRuns: 20,
    typographRuns: 28,
    uniqueUsers: 3,
    ...overrides,
  };
}

async function run() {
  const env = {
    POSTHOG_DASHBOARD_URL: "https://example.test/dashboard",
    POSTHOG_PERSONAL_API_KEY: "phx_test",
  };

  const dateRange = getMoscowReportRange("yesterday", new Date("2026-07-28T06:00:00.000Z"));
  const message = formatAnalyticsMessage(dateRange, createSummary(), env);

  assert(message.includes("<b>✦ Чистовик за 27 июля</b>"));
  assert(message.includes("Запуски типографа: 28 — на 12% больше среднего за предыдущие 7 дней"));
  assert(message.includes("Успешные обработки: 20 из 25 завершённых — 80%"));
  assert(message.includes("Без финального статуса: 3 из 28 — 11%, нужно проверить доставку аналитики"));
  assert(message.includes("5 неудачных попыток у 1 пользователя — вероятно, повторные запуски"));
  assert(message.includes("18% всех запусков завершились ошибкой — обычно было 4%"));
  assert(message.includes("основная причина: шрифт недоступен — 4 из 5 ошибок"));
  assert(message.includes("обычное время обработки: 420 мс — без заметных изменений"));
  assert(message.includes("90% обработок укладываются в 1,8 секунды — заметно хуже, на 30%"));
  assert(message.includes("открывается только с VPN"));

  const todayRange = getMoscowReportRange("today", new Date("2026-07-28T06:00:00.000Z"));
  const todayMessage = formatAnalyticsMessage(todayRange, createSummary(), env);

  assert(todayMessage.includes("<b>✦ Чистовик сегодня</b>"));
  assert(todayMessage.includes("Запуски типографа: 28 — на 12% больше среднего за предыдущие 7 дней"));
  assert(todayMessage.includes("Ошибки:"));
  assert(todayMessage.includes("Производительность:"));
  assert(todayMessage.includes("основная причина: шрифт недоступен — 4 из 5 ошибок"));

  const noErrorsMessage = formatAnalyticsMessage(
    dateRange,
    createSummary({
      affectedUsers: 0,
      errorCategories: [],
      failedRuns: 0,
      medianDurationMs: 0,
      p90DurationMs: 0,
      successfulRuns: 0,
      typographRuns: 0,
      uniqueUsers: 0,
    }),
    env
  );

  assert(noErrorsMessage.includes("Успешные обработки: пока нет завершённых запусков"));
  assert(noErrorsMessage.includes("Без финального статуса: 0 — все запуски получили результат"));
  assert(noErrorsMessage.includes("— ошибок не было"));
  assert(noErrorsMessage.includes("обычное время обработки: пока недостаточно данных"));
  assert(noErrorsMessage.includes("90% обработок укладываются: пока недостаточно данных"));

  const tiedCausesMessage = formatAnalyticsMessage(
    dateRange,
    createSummary({
      affectedUsers: 4,
      errorCategories: [
        { category: "font_unavailable", count: 4 },
        { category: "write_text_failed", count: 4 },
      ],
      failedRuns: 8,
      successfulRuns: 20,
      typographRuns: 28,
    }),
    env
  );

  assert(tiedCausesMessage.includes("8 неудачных попыток у 4 пользователей"));
  assert(tiedCausesMessage.includes("единой основной причины нет: шрифт недоступен — 4, не удалось записать текст — 4"));

  const failureMessage = formatAnalyticsFailureMessage(
    dateRange,
    "PostHog вернул неожиданный формат данных.",
    env
  );

  assert.strictEqual(
    failureMessage,
    [
      "<b>🛑 Не удалось собрать отчёт за 27 июля</b>",
      "",
      'PostHog вернул неожиданный формат данных. Попробуй проверить данные <a href="https://example.test/dashboard">в полном дашборде</a> (открывается только с VPN)',
    ].join("\n")
  );

  await withMockedFetch(
    [
      { results: [] },
      { results: [[0, 0, 0, 0]] },
      { results: [] },
    ],
    async () => {
      const diagnostic = await createAnalyticsMessageOrDiagnostic("yesterday", env);

      assert(diagnostic.includes("Не удалось собрать отчёт за"));
      assert(diagnostic.includes("PostHog вернул неожиданный формат данных."));
      assert(!diagnostic.includes("Запуски типографа: 0"));
    }
  );

  await withMockedFetch(
    [
      { results: [Array(19).fill(0)] },
      { results: [[0, 0, 0, 0]] },
      { results: [] },
    ],
    async () => {
      const emptyMessage = await createAnalyticsMessageOrDiagnostic("yesterday", env);

      assert(emptyMessage.includes("Запуски типографа: 0"));
      assert(emptyMessage.includes("— ошибок не было"));
      assert(!emptyMessage.includes("Не удалось собрать отчёт"));
    }
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
