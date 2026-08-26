const { neon } = require("@neondatabase/serverless");
const { getNumberDiagnosticsDatabaseUrl } = require("./number-diagnostics-config");

const ALLOWED_STATUSES = new Set(["changed", "skipped_policy", "already_correct", "review"]);
const ALLOWED_LAYER_MODES = new Set(["single", "multiple"]);
let schemaPromise = null;

function getSql(env = process.env) {
  const databaseUrl = getNumberDiagnosticsDatabaseUrl(env);

  if (!databaseUrl) {
    const error = new Error("Number diagnostics database is not configured");
    error.code = "number_diagnostics_database_not_configured";
    throw error;
  }

  return neon(databaseUrl);
}

async function ensureNumberDiagnosticsSchema(env = process.env) {
  if (schemaPromise !== null) {
    return schemaPromise;
  }

  const sql = getSql(env);
  schemaPromise = (async () => {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS number_diagnostic_cases (
        id text PRIMARY KEY,
        captured_at timestamptz NOT NULL,
        run_id text NOT NULL,
        plugin_release text NOT NULL,
        status text NOT NULL,
        number_kind text NOT NULL,
        diagnostics_schema_version integer NOT NULL DEFAULT 1,
        number_rules_version text NOT NULL DEFAULT 'numbers-2026-08-25-v1',
        reason text NOT NULL,
        number_before text NOT NULL,
        number_after text NOT NULL,
        before_text text NOT NULL,
        after_text text NOT NULL,
        layer_mode text NOT NULL,
        neighbors jsonb NOT NULL DEFAULT '[]'::jsonb,
        rule_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT number_diagnostic_status_check CHECK (status IN ('changed', 'skipped_policy', 'already_correct', 'review')),
        CONSTRAINT number_diagnostic_layer_mode_check CHECK (layer_mode IN ('single', 'multiple'))
      )
    `);
    await sql.query("ALTER TABLE number_diagnostic_cases ADD COLUMN IF NOT EXISTS diagnostics_schema_version integer NOT NULL DEFAULT 1");
    await sql.query("ALTER TABLE number_diagnostic_cases ADD COLUMN IF NOT EXISTS number_rules_version text NOT NULL DEFAULT 'numbers-2026-08-25-v1'");
    await sql.query("CREATE INDEX IF NOT EXISTS number_diagnostic_cases_captured_at_idx ON number_diagnostic_cases (captured_at DESC)");
    await sql.query("CREATE INDEX IF NOT EXISTS number_diagnostic_cases_status_idx ON number_diagnostic_cases (status, captured_at DESC)");
    return sql;
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });

  return schemaPromise;
}

async function insertNumberDiagnosticCases(report, env = process.env) {
  const sql = await ensureNumberDiagnosticsSchema(env);
  const rows = report.cases.map((item) => ({
    after_text: item.afterText,
    before_text: item.beforeText,
    captured_at: report.capturedAt,
    id: item.id,
    layer_mode: item.layerMode,
    neighbors: item.neighbors,
    number_after: item.numberAfter,
    number_before: item.numberBefore,
    number_kind: item.numberKind,
    diagnostics_schema_version: report.schemaVersion,
    number_rules_version: item.numberRulesVersion,
    plugin_release: report.pluginRelease,
    reason: item.reason,
    rule_codes: item.ruleCodes,
    run_id: report.runId,
    status: item.status,
  }));

  if (rows.length === 0) {
    return 0;
  }

  const result = await sql.query(
    `
      INSERT INTO number_diagnostic_cases (
        id, captured_at, run_id, plugin_release, status, number_kind, diagnostics_schema_version, number_rules_version, reason,
        number_before, number_after, before_text, after_text, layer_mode, neighbors, rule_codes
      )
      SELECT
        item.id, item.captured_at::timestamptz, item.run_id, item.plugin_release, item.status,
        item.number_kind, item.diagnostics_schema_version, item.number_rules_version, item.reason, item.number_before, item.number_after, item.before_text,
        item.after_text, item.layer_mode, item.neighbors, item.rule_codes
      FROM jsonb_to_recordset($1::jsonb) AS item(
        id text, captured_at text, run_id text, plugin_release text, status text,
        number_kind text, diagnostics_schema_version integer, number_rules_version text, reason text, number_before text, number_after text,
        before_text text, after_text text, layer_mode text, neighbors jsonb, rule_codes jsonb
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `,
    [JSON.stringify(rows)]
  );

  return result.length;
}

function normalizeDateBoundary(value, fallback) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fallback;
  }

  return value;
}

function createCaseFilters(query = {}) {
  const from = normalizeDateBoundary(query.from, "2026-08-25");
  const to = normalizeDateBoundary(query.to, "2026-09-18");
  const conditions = ["captured_at >= ($1::date AT TIME ZONE 'Europe/Moscow')", "captured_at < (($2::date + 1) AT TIME ZONE 'Europe/Moscow')"];
  const params = [from, to];

  if (ALLOWED_STATUSES.has(query.status)) {
    params.push(query.status);
    conditions.push(`status = $${params.length}`);
  }

  if (ALLOWED_LAYER_MODES.has(query.layerMode)) {
    params.push(query.layerMode);
    conditions.push(`layer_mode = $${params.length}`);
  }

  if (typeof query.reason === "string" && query.reason.length > 0 && query.reason.length <= 120) {
    params.push(query.reason);
    conditions.push(`reason = $${params.length}`);
  }

  if (typeof query.rule === "string" && /^[a-z0-9_]{1,80}$/.test(query.rule)) {
    params.push(query.rule);
    conditions.push(`rule_codes ? $${params.length}`);
  }

  if (typeof query.search === "string" && query.search.trim().length > 0) {
    params.push(`%${query.search.trim().slice(0, 120)}%`);
    conditions.push(`(before_text ILIKE $${params.length} OR after_text ILIKE $${params.length} OR number_before ILIKE $${params.length} OR number_after ILIKE $${params.length})`);
  }

  return { conditions, from, params, to };
}

async function getNumberDiagnosticSummary(query = {}, env = process.env) {
  const sql = await ensureNumberDiagnosticsSchema(env);
  const filters = createCaseFilters({ from: query.from, to: query.to });
  const rows = await sql.query(
    `
      SELECT status, count(*)::int AS count
      FROM number_diagnostic_cases
      WHERE ${filters.conditions.join(" AND ")}
      GROUP BY status
    `,
    filters.params
  );
  const summary = {
    all: 0,
    already_correct: 0,
    changed: 0,
    review: 0,
    skipped_policy: 0,
  };

  for (const row of rows) {
    const count = Number(row.count) || 0;
    summary[row.status] = count;
    summary.all += count;
  }

  return summary;
}

async function getNumberDiagnosticCases(query = {}, env = process.env, options = {}) {
  const sql = await ensureNumberDiagnosticsSchema(env);
  const filters = createCaseFilters(query);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || 50;
  const limit = Math.min(options.maxLimit || 100, Math.max(1, requestedLimit));
  const offset = options.all === true ? 0 : (page - 1) * limit;
  const countRows = await sql.query(
    `SELECT count(*)::int AS count FROM number_diagnostic_cases WHERE ${filters.conditions.join(" AND ")}`,
    filters.params
  );
  const params = filters.params.slice();
  let suffix = "";

  if (options.all !== true) {
    params.push(limit, offset);
    suffix = ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
  }

  const rows = await sql.query(
    `
      SELECT id, captured_at, run_id, plugin_release, status, number_kind, diagnostics_schema_version, number_rules_version, reason,
        number_before, number_after, before_text, after_text, layer_mode, neighbors, rule_codes
      FROM number_diagnostic_cases
      WHERE ${filters.conditions.join(" AND ")}
      ORDER BY captured_at DESC, id ASC
      ${suffix}
    `,
    params
  );

  return {
    from: filters.from,
    items: rows,
    limit,
    page,
    to: filters.to,
    total: Number(countRows[0]?.count) || 0,
  };
}

async function getNumberDiagnosticFilterOptions(query = {}, env = process.env) {
  const sql = await ensureNumberDiagnosticsSchema(env);
  const filters = createCaseFilters({ from: query.from, to: query.to });
  const [reasonRows, ruleRows] = await Promise.all([
    sql.query(
      `SELECT reason, count(*)::int AS count FROM number_diagnostic_cases WHERE ${filters.conditions.join(" AND ")} GROUP BY reason ORDER BY count DESC, reason ASC`,
      filters.params
    ),
    sql.query(
      `SELECT rule_code, count(*)::int AS count
       FROM number_diagnostic_cases, jsonb_array_elements_text(rule_codes) AS rule_code
       WHERE ${filters.conditions.join(" AND ")}
       GROUP BY rule_code ORDER BY count DESC, rule_code ASC`,
      filters.params
    ),
  ]);

  return { reasons: reasonRows, rules: ruleRows };
}

async function deleteNumberDiagnosticCases(env = process.env) {
  const sql = await ensureNumberDiagnosticsSchema(env);
  const rows = await sql.query("DELETE FROM number_diagnostic_cases RETURNING id");
  return rows.length;
}

module.exports = {
  ALLOWED_LAYER_MODES,
  ALLOWED_STATUSES,
  createCaseFilters,
  deleteNumberDiagnosticCases,
  ensureNumberDiagnosticsSchema,
  getNumberDiagnosticCases,
  getNumberDiagnosticFilterOptions,
  getNumberDiagnosticSummary,
  insertNumberDiagnosticCases,
};
