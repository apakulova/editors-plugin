const assert = require("assert");

const {
  createAnalyticsMessageOrDiagnostic,
  fetchPostHogSummary,
  fetchWeeklyErrorsSummary,
  fetchWeeklyPerformanceSummary,
  formatAnalyticsFailureMessage,
  formatAnalyticsMessage,
  formatPointEditingReadinessMessage,
  formatWeeklyErrorsMessage,
  formatWeeklyPerformanceMessage,
  getMoscowCompletedWeekRange,
  getMoscowReportRange,
  getPointEditingFullDays,
} = require("./lib/analytics-report");
const telegramHandler = require("../api/telegram");
const {
  TELEGRAM_COMMANDS,
  configureTelegramCommands,
} = require("./configure-telegram-menu");

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
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ options, url });
    return createResponse(payloads[callIndex++] ?? { results: [] });
  };
  console.error = () => {};

  try {
    await callback(calls);
  } finally {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  }
}

async function withTelegramEnvironment(callback) {
  const keys = [
    "POSTHOG_PERSONAL_API_KEY",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
    "TELEGRAM_WEBHOOK_SECRET",
  ];
  const originalValues = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  process.env.POSTHOG_PERSONAL_API_KEY = "phx_test";
  process.env.TELEGRAM_BOT_TOKEN = "telegram_test";
  process.env.TELEGRAM_CHAT_ID = "123";
  process.env.TELEGRAM_WEBHOOK_SECRET = "secret";

  try {
    await callback();
  } finally {
    for (const key of keys) {
      if (originalValues[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValues[key];
      }
    }
  }
}

function createApiResponse() {
  return {
    body: null,
    end(body) {
      this.body = JSON.parse(body);
    },
    setHeader() {},
    statusCode: null,
  };
}

function createSummary(overrides = {}) {
  return {
    affectedUsers: 1,
    baseline: {
      averageDailyRuns: 25,
      failedRate: 0.04,
      performanceRuns: 175,
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
    performanceRuns: 20,
    pointEditingReadiness: {
      fullDays: 1,
      successfulRuns: 7,
    },
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
  assert(message.startsWith([
    "<b>✦ Чистовик за 27 июля (пн)</b>",
    "",
    "Запуски типографа: 28",
  ].join("\n")));
  assert(!message.includes("Нельзя делать доработки"));
  assert(!message.includes("Можно приступать к переходу"));
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
  assert(!message.includes("1 из 7"));
  assert(!message.includes("7 из 30"));

  const readyMessage = formatAnalyticsMessage(
    dateRange,
    createSummary({
      pointEditingReadiness: {
        fullDays: 7,
        successfulRuns: 30,
      },
    }),
    env
  );

  assert(!readyMessage.includes("✅ Можно приступать к переходу на точечную обработку текста"));
  assert(!readyMessage.includes("🛑 Нельзя делать доработки"));

  assert.strictEqual(getPointEditingFullDays(new Date("2026-08-07T06:00:00.000Z")), 1);
  assert.strictEqual(getPointEditingFullDays(new Date("2026-08-13T06:00:00.000Z")), 7);

  const todayRange = getMoscowReportRange("today", new Date("2026-07-28T06:00:00.000Z"));
  const todayMessage = formatAnalyticsMessage(todayRange, createSummary(), env);

  assert(todayMessage.includes("<b>✦ Чистовик сегодня (вт)</b>"));
  assert(!todayMessage.includes("Нельзя делать доработки"));
  assert(!todayMessage.includes("Можно приступать к переходу"));
  assert(todayMessage.includes("Запуски типографа: 28"));
  assert(todayMessage.includes("📍 Плагин запускали на 12% больше среднего за последние 7 дней"));
  assert(todayMessage.includes("Ошибки:"));
  assert(todayMessage.includes("Производительность:"));
  assert(todayMessage.includes("основные причины — недоступен шрифт (4 из 5 ошибок), не удалось записать текст (1 из 5 ошибок)"));

  const oldMeasurementMessage = formatAnalyticsMessage(
    dateRange,
    createSummary({
      baseline: {
        averageDailyRuns: 25,
        failedRate: 0.04,
        medianDurationMs: 0,
        p90DurationMs: 0,
        performanceRuns: 0,
      },
      medianDurationMs: 0,
      p90DurationMs: 0,
      performanceRuns: 0,
    }),
    env
  );

  assert(!oldMeasurementMessage.includes("Производительность:"));
  assert(!oldMeasurementMessage.includes("пока недостаточно данных"));

  const partialPerformanceMessage = formatAnalyticsMessage(
    dateRange,
    createSummary({
      medianDurationMs: 420,
      p90DurationMs: 1800,
      performanceRuns: 1,
    }),
    env
  );

  assert(partialPerformanceMessage.includes("Производительность:"));
  assert(partialPerformanceMessage.includes("обычное время обработки: 420 мс"));
  assert(!partialPerformanceMessage.includes("90% обработок"));
  assert(!partialPerformanceMessage.includes("пока недостаточно данных"));

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

  assert.strictEqual(
    formatPointEditingReadinessMessage({ fullDays: 7, successfulRuns: 30 }, "baseline"),
    "✅ Можно приступать к переходу на точечную обработку текста"
  );
  assert.strictEqual(
    formatPointEditingReadinessMessage({ fullDays: 6, successfulRuns: 30 }, "baseline"),
    "🛑 Нельзя делать доработки — ещё не накопились 7 полных дней или 30 успешных обработок"
  );
  assert.strictEqual(
    formatPointEditingReadinessMessage({ fullDays: 7, successfulRuns: 29 }, "baseline"),
    "🛑 Нельзя делать доработки — ещё не накопились 7 полных дней или 30 успешных обработок"
  );
  assert.strictEqual(formatPointEditingReadinessMessage({ fullDays: 7, successfulRuns: 30 }), null);
  assert.strictEqual(
    formatPointEditingReadinessMessage({ fullDays: 7, successfulRuns: 30 }, "implementation"),
    null
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

  const weeklyRange = getMoscowCompletedWeekRange(new Date("2026-07-28T06:00:00.000Z"));
  assert.strictEqual(weeklyRange.label, "21–27 июля");

  const weeklyPerformanceMessage = formatWeeklyPerformanceMessage(
    weeklyRange,
    {
      averageDurationMs: 420,
      baseline: {
        averageDurationMs: 338.71,
        successfulRuns: 150,
      },
      collectTextMs: 10,
      compareTextMs: 0,
      developmentMarkersMs: 0,
      fontsMs: 310,
      otherMs: 6,
      p90DurationMs: 1800,
      readStylesMs: 0,
      restoreStylesMs: 74,
      slowestDurationMs: 12400,
      successfulRuns: 164,
      typographyMs: 20,
      writeTextMs: 0,
    },
    env
  );

  assert(weeklyPerformanceMessage.includes("<b>✦ Скорость за 21–27 июля</b>"));
  assert(weeklyPerformanceMessage.includes("Успешные обработки: 164"));
  assert(weeklyPerformanceMessage.includes("Среднее время: 420 мс"));
  assert(weeklyPerformanceMessage.includes("90% обработок: за 1,8 секунды"));
  assert(weeklyPerformanceMessage.includes("Самый медленный запуск: 12,4 секунды"));
  assert(weeklyPerformanceMessage.includes("— загрузка шрифтов: 310 мс"));
  assert(weeklyPerformanceMessage.includes("— возвращение оформления: 74 мс"));
  assert(weeklyPerformanceMessage.includes("— применение правил типографики: 20 мс"));
  assert(weeklyPerformanceMessage.includes("— поиск текстовых слоёв: 10 мс"));
  assert(weeklyPerformanceMessage.includes("— остальные операции: 6 мс"));
  assert(!weeklyPerformanceMessage.includes("сравнение текста"));
  assert(weeklyPerformanceMessage.includes("📍 Скорость стала на 24% медленнее, чем за предыдущие 7 дней"));
  assert(weeklyPerformanceMessage.includes("📍 Основная задержка — загрузка шрифтов"));
  assert(
    weeklyPerformanceMessage.includes(
      '<a href="https://eu.posthog.com/project/184090/dashboard/854930">Дашборд по производительности</a>'
    )
  );

  const insufficientPerformanceMessage = formatWeeklyPerformanceMessage(
    weeklyRange,
    {
      averageDurationMs: 420,
      baseline: { averageDurationMs: 400, successfulRuns: 20 },
      successfulRuns: 4,
    },
    env
  );

  assert(insufficientPerformanceMessage.includes("Слишком мало запусков за последние 7 дней, чтобы оценить скорость"));
  assert(!insufficientPerformanceMessage.includes("Среднее время:"));

  const unexplainedDelayMessage = formatWeeklyPerformanceMessage(
    weeklyRange,
    {
      averageDurationMs: 420,
      baseline: { averageDurationMs: 400, successfulRuns: 20 },
      otherMs: 300,
      p90DurationMs: 800,
      slowestDurationMs: 1000,
      successfulRuns: 20,
      typographyMs: 100,
    },
    env
  );

  assert(unexplainedDelayMessage.includes("— остальные операции: 300 мс"));
  assert(!unexplainedDelayMessage.includes("📍 Основная задержка — остальные операции"));

  const weeklyErrorsMessage = formatWeeklyErrorsMessage(
    weeklyRange,
    {
      affectedUsers: 4,
      baseline: {
        affectedUsers: 3,
        failedRuns: 12,
        typographRuns: 808,
      },
      errorCategories: [
        { category: "font_unavailable", count: 10 },
        { category: "write_text_failed", count: 5 },
        { category: "unknown", count: 2 },
      ],
      errorScopes: [
        { scope: "container", count: 10 },
        { scope: "single_text", count: 5 },
        { scope: "page", count: 2 },
      ],
      failedRuns: 17,
      typographRuns: 806,
    },
    env
  );

  assert(weeklyErrorsMessage.includes("<b>✦ Ошибки за 21–27 июля</b>"));
  assert(weeklyErrorsMessage.includes("Запуски типографа: 806"));
  assert(weeklyErrorsMessage.includes("Ошибки: 17"));
  assert(weeklyErrorsMessage.includes("Пострадавшие пользователи: 4"));
  assert(weeklyErrorsMessage.includes("Доля запусков с ошибкой: 2%"));
  assert(weeklyErrorsMessage.includes("— недоступен шрифт: 10 из 17 ошибок"));
  assert(weeklyErrorsMessage.includes("— не удалось записать текст: 5 из 17 ошибок"));
  assert(weeklyErrorsMessage.includes("— причина неизвестна: 2 из 17 ошибок"));
  assert(weeklyErrorsMessage.includes("— во фрейме: 10"));
  assert(weeklyErrorsMessage.includes("— на текстовом слое: 5"));
  assert(weeklyErrorsMessage.includes("— на странице: 2"));
  assert(weeklyErrorsMessage.includes("📍 Ошибок на 42% больше, чем за предыдущие 7 дней"));
  assert(weeklyErrorsMessage.includes("📍 Основная причина — недоступен шрифт"));
  assert(
    weeklyErrorsMessage.includes(
      '<a href="https://eu.posthog.com/project/184090/dashboard/854930">Дашборд по производительности</a>'
    )
  );

  const noWeeklyErrorsMessage = formatWeeklyErrorsMessage(
    weeklyRange,
    {
      affectedUsers: 0,
      baseline: {
        affectedUsers: 1,
        failedRuns: 1,
        typographRuns: 100,
      },
      errorCategories: [],
      errorScopes: [],
      failedRuns: 0,
      typographRuns: 120,
    },
    env
  );

  assert(noWeeklyErrorsMessage.includes("За последние 7 дней ошибок не было"));
  assert(!noWeeklyErrorsMessage.includes("Запуски типографа:"));

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
      { results: [[3, 28, 20, 18, 5, 1, 420, 1800, 28, 0, 0, 13, 14, 1, 0, 0, 0, 0, 0, 0]] },
      { results: [[175, 7, 160, 400, 1385]] },
      { results: [["font_unavailable", 5]] },
      { results: [[18, 420, 1800]] },
      { results: [[160, 400, 1385]] },
      { results: [[7]] },
    ],
    async (calls) => {
      const summary = await fetchPostHogSummary(dateRange, env);

      assert.strictEqual(summary.successfulRuns, 20);
      assert.strictEqual(summary.performanceRuns, 18);
      assert.strictEqual(summary.failedRuns, 5);
      assert.strictEqual(summary.baseline.performanceRuns, 160);
      assert.strictEqual(summary.medianDurationMs, 420);
      assert.strictEqual(summary.pointEditingReadiness.successfulRuns, 7);
      assert(calls.slice(0, 2).every((call) => JSON.parse(call.options.body).query.query.includes("performance_measurement_version")));
      assert(calls.slice(0, 2).every((call) => JSON.parse(call.options.body).query.query.includes("= '8'")));
      assert(calls[0] && JSON.parse(calls[0].options.body).query.query.includes("coalesce(nullIf(toString(properties.run_id), ''), toString(uuid))"));
      assert(calls.slice(3, 5).every((call) => JSON.parse(call.options.body).query.query.includes("GROUP BY run_id")));
      assert(JSON.parse(calls[5].options.body).query.query.includes("startsWith(toString(properties.plugin_release), '2026-08-05')"));
    }
  );

  await withMockedFetch(
    [
      { results: [] },
      { results: [[0, 0, 0, 0, 0]] },
      { results: [] },
      { results: [[0, 0, 0]] },
      { results: [[0, 0, 0]] },
      { results: [[7]] },
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
      { results: [Array(20).fill(0)] },
      { results: [[0, 0, 0, 0, 0]] },
      { results: [] },
      { results: [[0, 0, 0]] },
      { results: [[0, 0, 0]] },
      { results: [[7]] },
    ],
    async () => {
      const emptyMessage = await createAnalyticsMessageOrDiagnostic("yesterday", env);

      assert(emptyMessage.includes("Плагин никто не запускал"));
      assert(!emptyMessage.includes("Запуски типографа: 0"));
      assert(!emptyMessage.includes("Ошибки:"));
      assert(!emptyMessage.includes("Не удалось собрать отчёт"));
    }
  );

  await withMockedFetch(
    [
      { results: [[164, 420, 1800, 12400, 10, 20, 15, 310, 0, 0, 0, 74, 0, 6]] },
      { results: [[150, 338.71, 1600, 9000, 8, 18, 12, 250, 0, 0, 0, 55, 0, 5]] },
    ],
    async (calls) => {
      const summary = await fetchWeeklyPerformanceSummary(weeklyRange, env);

      assert.strictEqual(summary.successfulRuns, 164);
      assert.strictEqual(summary.fontsMs, 310);
      assert.strictEqual(summary.baseline.averageDurationMs, 338.71);
      assert(calls.every((call) => JSON.parse(call.options.body).query.query.includes("performance_measurement_version")));
      assert(calls.every((call) => JSON.parse(call.options.body).query.query.includes("= '8'")));
    }
  );

  await withMockedFetch(
    [
      { results: [[806, 17, 4]] },
      { results: [[808, 12, 3]] },
      { results: [["font_unavailable", 10], ["write_text_failed", 5], ["unknown", 2]] },
      { results: [["container", 10], ["single_text", 5], ["page", 2]] },
    ],
    async () => {
      const summary = await fetchWeeklyErrorsSummary(weeklyRange, env);

      assert.strictEqual(summary.failedRuns, 17);
      assert.strictEqual(summary.errorCategories.length, 3);
      assert.strictEqual(summary.errorScopes.length, 3);
      assert.strictEqual(summary.baseline.failedRuns, 12);
    }
  );

  await withTelegramEnvironment(async () => {
    await withMockedFetch(
      [
        { results: [[164, 420, 1800, 12400, 10, 20, 15, 310, 0, 0, 0, 74, 0, 6]] },
        { results: [[150, 338.71, 1600, 9000, 8, 18, 12, 250, 0, 0, 0, 55, 0, 5]] },
        { ok: true },
      ],
      async (calls) => {
        const response = createApiResponse();

        await telegramHandler(
          {
            body: { message: { chat: { id: 123 }, text: "/speed" } },
            headers: { "x-telegram-bot-api-secret-token": "secret" },
            method: "POST",
          },
          response
        );

        assert.strictEqual(response.statusCode, 200);
        assert.deepStrictEqual(response.body, { ok: true });
        assert.strictEqual(calls.length, 3);
        const telegramPayload = JSON.parse(calls[2].options.body);
        assert(telegramPayload.text.includes("✦ Скорость за"));
        assert(telegramPayload.text.includes("Дашборд по производительности"));
      }
    );

    await withMockedFetch(
      [
        { results: [[806, 17, 4]] },
        { results: [[808, 12, 3]] },
        { results: [["font_unavailable", 10], ["write_text_failed", 5], ["unknown", 2]] },
        { results: [["container", 10], ["single_text", 5], ["page", 2]] },
        { ok: true },
      ],
      async (calls) => {
        const response = createApiResponse();

        await telegramHandler(
          {
            body: { message: { chat: { id: 123 }, text: "/errors" } },
            headers: { "x-telegram-bot-api-secret-token": "secret" },
            method: "POST",
          },
          response
        );

        assert.strictEqual(response.statusCode, 200);
        assert.deepStrictEqual(response.body, { ok: true });
        assert.strictEqual(calls.length, 5);
        const telegramPayload = JSON.parse(calls[4].options.body);
        assert(telegramPayload.text.includes("✦ Ошибки за"));
        assert(telegramPayload.text.includes("Ошибки: 17"));
        assert(telegramPayload.text.includes("Пострадавшие пользователи: 4"));
      }
    );
  });

  assert.deepStrictEqual(TELEGRAM_COMMANDS, [
    { command: "today", description: "Отчёт за сегодня" },
    { command: "speed", description: "Отчёт по скорости за 7 дней" },
    { command: "errors", description: "Отчёт по ошибкам за 7 дней" },
  ]);

  await withMockedFetch(
    [{ ok: true, result: true }],
    async (calls) => {
      await configureTelegramCommands({ TELEGRAM_BOT_TOKEN: "telegram_test" });

      assert.strictEqual(calls.length, 1);
      assert.deepStrictEqual(JSON.parse(calls[0].options.body), {
        commands: TELEGRAM_COMMANDS,
      });
    }
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
