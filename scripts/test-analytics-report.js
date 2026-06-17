const assert = require("assert");

const {
  createAnalyticsMessageOrDiagnostic,
  formatAnalyticsFailureMessage,
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

async function withMockedFetch(fetchImplementation, callback) {
  global.fetch = fetchImplementation;
  console.error = () => {};

  try {
    await callback();
  } finally {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  }
}

async function run() {
  const env = {
    POSTHOG_DASHBOARD_URL: "https://example.test/dashboard",
    POSTHOG_PERSONAL_API_KEY: "phx_test",
  };

  const dateRange = getMoscowReportRange("yesterday", new Date("2026-06-18T06:00:00.000Z"));
  const failureMessage = formatAnalyticsFailureMessage(
    dateRange,
    "PostHog вернул неожиданный формат данных.",
    env
  );

  assert.strictEqual(
    failureMessage,
    [
      "<b>🛑 Не удалось собрать отчёт за 17 июня</b>",
      "",
      'PostHog вернул неожиданный формат данных. Попробуй проверить данные <a href="https://example.test/dashboard">в полном дашборде</a> (открывается только с vpn)',
    ].join("\n")
  );

  await withMockedFetch(
    async () => createResponse({ results: [] }),
    async () => {
      const message = await createAnalyticsMessageOrDiagnostic("yesterday", env);

      assert(message.includes("Не удалось собрать отчёт за"));
      assert(message.includes("PostHog вернул неожиданный формат данных."));
      assert(message.includes('<a href="https://example.test/dashboard">в полном дашборде</a>'));
      assert(!message.includes("Запуски типографа: 0"));
    }
  );

  await withMockedFetch(
    async () => createResponse({ results: [Array(16).fill(0)] }),
    async () => {
      const message = await createAnalyticsMessageOrDiagnostic("yesterday", env);

      assert(message.includes("Запуски типографа: 0"));
      assert(!message.includes("Не удалось собрать отчёт"));
    }
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
