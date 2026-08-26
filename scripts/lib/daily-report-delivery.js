const {
  createAnalyticsMessageOrDiagnostic,
  getMoscowReportRange,
  sendTelegramMessage,
} = require("./analytics-report");
const {
  claimDailyReportDelivery,
  markDailyReportFailed,
  markDailyReportSent,
  markDailyReportUncertain,
} = require("./daily-report-delivery-store");

const MOSCOW_TIME_ZONE = "Europe/Moscow";

function formatMoscowIsoDate(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: MOSCOW_TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function getDailyReportDate(referenceDate = new Date()) {
  const dateRange = getMoscowReportRange("yesterday", referenceDate);
  return formatMoscowIsoDate(dateRange.start);
}

async function deliverDailyAnalyticsReport(options = {}, env = process.env, dependencies = {}) {
  const source = options.source || "unknown";
  const referenceDate = options.referenceDate || new Date();
  const reportDate = getDailyReportDate(referenceDate);
  const claim = await (dependencies.claimDailyReportDelivery || claimDailyReportDelivery)(
    reportDate,
    source,
    { force: options.force === true },
    env
  );

  if (!claim.acquired) {
    const result = {
      reportDate,
      source,
      status: claim.status === "sent"
        ? "already_sent"
        : claim.status === "uncertain"
          ? "needs_manual_check"
          : "already_running",
    };
    console.log(`[daily-report] ${result.status} date=${reportDate} source=${source}`);
    return result;
  }

  let telegramAccepted = false;

  try {
    const message = await (dependencies.createAnalyticsMessageOrDiagnostic || createAnalyticsMessageOrDiagnostic)(
      "yesterday",
      env
    );
    await (dependencies.sendTelegramMessage || sendTelegramMessage)(message, env);
    telegramAccepted = true;
    await (dependencies.markDailyReportSent || markDailyReportSent)(
      reportDate,
      claim.claimToken,
      env
    );
    console.log(`[daily-report] sent date=${reportDate} source=${source}`);

    return { message, reportDate, source, status: "sent" };
  } catch (error) {
    try {
      if (telegramAccepted || error?.telegramDeliveryUnknown === true) {
        await (dependencies.markDailyReportUncertain || markDailyReportUncertain)(
          reportDate,
          claim.claimToken,
          error,
          env
        );
      } else {
        await (dependencies.markDailyReportFailed || markDailyReportFailed)(
          reportDate,
          claim.claimToken,
          error,
          env
        );
      }
    } catch (stateError) {
      console.error("[daily-report] failed to record delivery error", stateError);
    }

    throw error;
  }
}

module.exports = {
  deliverDailyAnalyticsReport,
  formatMoscowIsoDate,
  getDailyReportDate,
};
