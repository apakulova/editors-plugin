const assert = require("node:assert");

const {
  deliverDailyAnalyticsReport,
  formatMoscowIsoDate,
  getDailyReportDate,
} = require("./lib/daily-report-delivery");
const { sendTelegramMessage } = require("./lib/analytics-report");
const {
  normalizeSource,
  sanitizeDeliveryError,
} = require("./lib/daily-report-delivery-store");

async function run() {
  assert.strictEqual(
    getDailyReportDate(new Date("2026-08-26T07:00:00.000Z")),
    "2026-08-25"
  );
  assert.strictEqual(
    formatMoscowIsoDate(new Date("2026-08-24T21:00:00.000Z")),
    "2026-08-25"
  );
  assert.strictEqual(normalizeSource("github_primary"), "github_primary");
  assert.strictEqual(normalizeSource("invalid source"), "unknown");
  assert(!sanitizeDeliveryError(new Error("Failed at postgresql://user:secret@example.test/db")).includes("secret"));

  const sentCalls = [];
  const sent = await deliverDailyAnalyticsReport(
    {
      referenceDate: new Date("2026-08-26T07:00:00.000Z"),
      source: "github_primary",
    },
    {},
    {
      async claimDailyReportDelivery(reportDate, source, options) {
        sentCalls.push(["claim", reportDate, source, options.force]);
        return { acquired: true, claimToken: "claim-1", status: "sending" };
      },
      async createAnalyticsMessageOrDiagnostic(period) {
        sentCalls.push(["create", period]);
        return "report text";
      },
      async sendTelegramMessage(message) {
        sentCalls.push(["send", message]);
      },
      async markDailyReportSent(reportDate, claimToken) {
        sentCalls.push(["sent", reportDate, claimToken]);
      },
    }
  );

  assert.deepStrictEqual(sent, {
    message: "report text",
    reportDate: "2026-08-25",
    source: "github_primary",
    status: "sent",
  });
  assert.deepStrictEqual(sentCalls, [
    ["claim", "2026-08-25", "github_primary", false],
    ["create", "yesterday"],
    ["send", "report text"],
    ["sent", "2026-08-25", "claim-1"],
  ]);

  let skippedWork = false;
  const skipped = await deliverDailyAnalyticsReport(
    {
      referenceDate: new Date("2026-08-26T07:00:00.000Z"),
      source: "vercel_fallback",
    },
    {},
    {
      async claimDailyReportDelivery() {
        return { acquired: false, status: "sent" };
      },
      async createAnalyticsMessageOrDiagnostic() {
        skippedWork = true;
      },
    }
  );

  assert.strictEqual(skipped.status, "already_sent");
  assert.strictEqual(skippedWork, false);

  const failedCalls = [];
  const sendError = new Error("Telegram unavailable");
  await assert.rejects(
    deliverDailyAnalyticsReport(
      {
        force: true,
        referenceDate: new Date("2026-08-26T07:00:00.000Z"),
        source: "github_manual",
      },
      {},
      {
        async claimDailyReportDelivery(reportDate, source, options) {
          failedCalls.push(["claim", reportDate, source, options.force]);
          return { acquired: true, claimToken: "claim-2", status: "sending" };
        },
        async createAnalyticsMessageOrDiagnostic() {
          return "report text";
        },
        async sendTelegramMessage() {
          throw sendError;
        },
        async markDailyReportFailed(reportDate, claimToken, error) {
          failedCalls.push(["failed", reportDate, claimToken, error]);
        },
      }
    ),
    sendError
  );
  assert.deepStrictEqual(failedCalls[0], ["claim", "2026-08-25", "github_manual", true]);
  assert.deepStrictEqual(failedCalls[1], ["failed", "2026-08-25", "claim-2", sendError]);

  const uncertainCalls = [];
  const uncertainError = new Error("Network response was lost");
  uncertainError.telegramDeliveryUnknown = true;
  await assert.rejects(
    deliverDailyAnalyticsReport(
      {
        referenceDate: new Date("2026-08-26T07:00:00.000Z"),
        source: "github_primary",
      },
      {},
      {
        async claimDailyReportDelivery() {
          return { acquired: true, claimToken: "claim-3", status: "sending" };
        },
        async createAnalyticsMessageOrDiagnostic() {
          return "report text";
        },
        async sendTelegramMessage() {
          throw uncertainError;
        },
        async markDailyReportUncertain(reportDate, claimToken, error) {
          uncertainCalls.push([reportDate, claimToken, error]);
        },
      }
    ),
    uncertainError
  );
  assert.deepStrictEqual(uncertainCalls[0], ["2026-08-25", "claim-3", uncertainError]);

  const originalFetch = global.fetch;
  const networkError = new Error("socket closed");
  global.fetch = async () => {
    throw networkError;
  };

  try {
    await assert.rejects(
      sendTelegramMessage("report", {
        TELEGRAM_BOT_TOKEN: "test-token",
        TELEGRAM_CHAT_ID: "123",
      }),
      networkError
    );
    assert.strictEqual(networkError.telegramDeliveryUnknown, true);
  } finally {
    global.fetch = originalFetch;
  }

  console.log("Daily report delivery tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
