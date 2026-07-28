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

  assert(message.includes("<b>✦ Чистовик за 27 июля (пн)</b>"));
  assert(message.includes("Запуски типографа: 28"));
  assert(message.includes("Успешные обработки: 20 — это 80%"));
  assert(message.includes("Без финального статуса: 3"));
  assert(message.includes("📍 Плагин запускали на 12% больше среднего за последние 7 дней"));
  assert(message.includes("5 фейлов у 1 пользователя"));
  assert(message.includes("18% от всех запусков"));
  assert(message.includes("основные причины — недоступен шрифт (4 из 5 ошибок), не удалось записать текст (1 из 5 ошибок)"));
  assert(message.includes("📍 Это на 346% больше среднего за последние 7 дней"));
  assert(message.includes("обычное время обработки: 420 мс — без заметных изменений"));
  assert(message.includes("90% обработок за 1,8 секунды — заметно хуже, на 30%"));
  assert(message.includes("📍 Скорость примерно такая же, как в среднем за последние 7 дней"));
  assert(message.includes("открывается только с vpn"));

  const todayRange = getMoscowReportRange("today", new Date("2026-07-28T06:00:00.000Z"));
  const todayMessage = formatAnalyticsMessage(todayRange, createSummary(), env);

  assert(todayMessage.includes("<b>✦ Чистовик сегодня (вт)</b>"));
  assert(todayMessage.includes("Запуски типографа: 28"));
  assert(todayMessage.includes("📍 Плагин запускали на 12% больше среднего за последние 7 дней"));
  assert(todayMessage.includes("Ошибки:"));
  assert(todayMessage.includes("Производительность:"));
  assert(todayMessage.includes("основные причины — недоступен шрифт (4 из 5 ошибок), не удалось записать текст (1 из 5 ошибок)"));

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

  assert.strictEqual(
    noErrorsMessage,
    [
      "<b>✦ Чистовик за 27 июля (пн)</b>",
      "",
      "Плагин никто не запускал",
      "",
      '<a href="https://example.test/dashboard">Полный дашборд с графиками</a> (открывается только с vpn)',
    ].join("\n")
  );

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

  assert(tiedCausesMessage.includes("8 фейлов у 4 пользователей"));
  assert(tiedCausesMessage.includes("основные причины — недоступен шрифт (4 из 8 ошибок), не удалось записать текст (4 из 8 ошибок)"));

  const noKnownCauseMessage = formatAnalyticsMessage(
    dateRange,
    createSummary({
      affectedUsers: 2,
      errorCategories: [],
      failedRuns: 3,
      successfulRuns: 22,
      typographRuns: 28,
    }),
    env
  );

  assert(noKnownCauseMessage.includes("3 фейла у 2 пользователей"));
  assert(!noKnownCauseMessage.includes("основная причина"));
  assert(!noKnownCauseMessage.includes("основные причины"));

  const failureMessage = formatAnalyticsFailureMessage(
    dateRange,
    "PostHog вернул неожиданный формат данных.",
    env
  );

  assert.strictEqual(
    failureMessage,
    [
      "<b>🛑 Не удалось собрать отчёт за 27 июля (пн)</b>",
      "",
      'PostHog вернул неожиданный формат данных. Попробуй проверить данные <a href="https://example.test/dashboard">в полном дашборде</a> (открывается только с vpn)',
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

      assert(emptyMessage.includes("Плагин никто не запускал"));
      assert(!emptyMessage.includes("Запуски типографа: 0"));
      assert(!emptyMessage.includes("Ошибки:"));
      assert(!emptyMessage.includes("Не удалось собрать отчёт"));
    }
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
