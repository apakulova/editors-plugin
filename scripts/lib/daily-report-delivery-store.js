const { randomUUID } = require("node:crypto");
const { neon } = require("@neondatabase/serverless");
const { getNumberDiagnosticsDatabaseUrl } = require("./number-diagnostics-config");

const DELIVERY_STATUSES = new Set(["failed", "sending", "sent", "uncertain"]);
let schemaPromise = null;

function getDailyReportDatabaseUrl(env = process.env) {
  return env.ANALYTICS_DATABASE_URL || getNumberDiagnosticsDatabaseUrl(env);
}

function getSql(env = process.env) {
  const databaseUrl = getDailyReportDatabaseUrl(env);

  if (!databaseUrl) {
    const error = new Error("Daily report database is not configured");
    error.code = "daily_report_database_not_configured";
    throw error;
  }

  return neon(databaseUrl);
}

function assertReportDate(reportDate) {
  if (typeof reportDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    throw new Error("Invalid daily report date");
  }
}

function normalizeSource(source) {
  if (typeof source !== "string" || !/^[a-z0-9_-]{1,50}$/.test(source)) {
    return "unknown";
  }

  return source;
}

function sanitizeDeliveryError(error) {
  const name = typeof error?.name === "string" ? error.name : "Error";
  const code = typeof error?.code === "string" ? error.code : "unknown";
  const rawMessage = typeof error?.message === "string" ? error.message : "Unknown error";
  const message = rawMessage
    .replace(/(?:postgres(?:ql)?|https?):\/\/[^\s]+/gi, "[redacted-url]")
    .slice(0, 500);

  return `${name}:${code}: ${message}`;
}

async function ensureDailyReportDeliverySchema(env = process.env) {
  if (schemaPromise !== null) {
    return schemaPromise;
  }

  const sql = getSql(env);
  schemaPromise = (async () => {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS daily_analytics_report_deliveries (
        report_date date PRIMARY KEY,
        status text NOT NULL,
        source text NOT NULL,
        claim_token text NOT NULL,
        attempt_count integer NOT NULL DEFAULT 1,
        started_at timestamptz NOT NULL DEFAULT now(),
        finished_at timestamptz,
        last_error text,
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT daily_analytics_report_status_check CHECK (status IN ('failed', 'sending', 'sent', 'uncertain'))
      )
    `);
    await sql.query("CREATE INDEX IF NOT EXISTS daily_analytics_report_status_idx ON daily_analytics_report_deliveries (status, report_date DESC)");
    return sql;
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });

  return schemaPromise;
}

async function claimDailyReportDelivery(
  reportDate,
  source,
  options = {},
  env = process.env
) {
  assertReportDate(reportDate);
  const sql = await ensureDailyReportDeliverySchema(env);
  const normalizedSource = normalizeSource(source);
  const claimToken = randomUUID();
  const force = options.force === true;
  const rows = await sql.query(
    `
      INSERT INTO daily_analytics_report_deliveries (
        report_date, status, source, claim_token, attempt_count, started_at, finished_at, last_error, updated_at
      )
      VALUES ($1::date, 'sending', $2, $3, 1, now(), NULL, NULL, now())
      ON CONFLICT (report_date) DO UPDATE SET
        status = 'sending',
        source = EXCLUDED.source,
        claim_token = EXCLUDED.claim_token,
        attempt_count = daily_analytics_report_deliveries.attempt_count + 1,
        started_at = now(),
        finished_at = NULL,
        last_error = NULL,
        updated_at = now()
      WHERE
        $4::boolean
        OR daily_analytics_report_deliveries.status = 'failed'
      RETURNING report_date::text, status, source, claim_token, attempt_count, started_at, finished_at
    `,
    [reportDate, normalizedSource, claimToken, force]
  );

  if (rows.length > 0) {
    return {
      acquired: true,
      claimToken,
      reportDate,
      source: normalizedSource,
      status: "sending",
    };
  }

  const existingRows = await sql.query(
    `
      SELECT report_date::text, status, source, attempt_count, started_at, finished_at
      FROM daily_analytics_report_deliveries
      WHERE report_date = $1::date
      LIMIT 1
    `,
    [reportDate]
  );
  const existing = existingRows[0] || null;

  return {
    acquired: false,
    reportDate,
    source: existing?.source || normalizedSource,
    status: DELIVERY_STATUSES.has(existing?.status) ? existing.status : "sending",
  };
}

async function markDailyReportSent(reportDate, claimToken, env = process.env) {
  assertReportDate(reportDate);
  const sql = await ensureDailyReportDeliverySchema(env);
  const rows = await sql.query(
    `
      UPDATE daily_analytics_report_deliveries
      SET status = 'sent', finished_at = now(), last_error = NULL, updated_at = now()
      WHERE report_date = $1::date AND claim_token = $2 AND status = 'sending'
      RETURNING report_date::text
    `,
    [reportDate, claimToken]
  );

  if (rows.length !== 1) {
    const error = new Error("Daily report delivery claim was lost before success was recorded");
    error.code = "daily_report_claim_lost";
    throw error;
  }
}

async function markDailyReportFailed(reportDate, claimToken, error, env = process.env) {
  assertReportDate(reportDate);
  const sql = await ensureDailyReportDeliverySchema(env);
  await sql.query(
    `
      UPDATE daily_analytics_report_deliveries
      SET status = 'failed', finished_at = now(), last_error = $3, updated_at = now()
      WHERE report_date = $1::date AND claim_token = $2 AND status = 'sending'
    `,
    [reportDate, claimToken, sanitizeDeliveryError(error)]
  );
}

async function markDailyReportUncertain(reportDate, claimToken, error, env = process.env) {
  assertReportDate(reportDate);
  const sql = await ensureDailyReportDeliverySchema(env);
  await sql.query(
    `
      UPDATE daily_analytics_report_deliveries
      SET status = 'uncertain', finished_at = now(), last_error = $3, updated_at = now()
      WHERE report_date = $1::date AND claim_token = $2 AND status = 'sending'
    `,
    [reportDate, claimToken, sanitizeDeliveryError(error)]
  );
}

module.exports = {
  claimDailyReportDelivery,
  ensureDailyReportDeliverySchema,
  getDailyReportDatabaseUrl,
  markDailyReportFailed,
  markDailyReportSent,
  markDailyReportUncertain,
  normalizeSource,
  sanitizeDeliveryError,
};
