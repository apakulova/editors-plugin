const { isSessionAuthorized } = require("../scripts/lib/number-diagnostics-auth");
const { getNumberDiagnosticCases } = require("../scripts/lib/number-diagnostics-store");

function getQuery(request) {
  if (request.query && typeof request.query === "object") {
    return request.query;
  }

  try {
    return Object.fromEntries(new URL(request.url, "https://chistovik-plugin.vercel.app").searchParams.entries());
  } catch {
    return {};
  }
}

function escapeCsv(value) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function formatNeighbors(neighbors) {
  if (!Array.isArray(neighbors)) {
    return "";
  }

  return neighbors
    .map((neighbor) => `${neighbor.direction === "left" ? "слева" : "справа"}: ${neighbor.text}${neighbor.usedAsEvidence ? " (использован)" : ""}`)
    .join("\n");
}

function formatDecisionContext(item) {
  if (!Array.isArray(item.neighbors)) {
    return "";
  }

  return item.neighbors
    .filter((neighbor) => neighbor.usedAsEvidence)
    .map((neighbor) => neighbor.direction === "left" ? `${neighbor.text} · ${item.number_before}` : `${item.number_before} · ${neighbor.text}`)
    .join("\n");
}

function createCsv(items) {
  const headers = [
    "Дата и время",
    "Статус",
    "Число до",
    "Число после",
    "Текст до",
    "Текст после",
    "Контекст решения",
    "Соседние слои",
    "Причина",
    "Вид числа",
    "Версия числовых правил",
    "Сборка диагностики",
    "Правила",
    "Расположение",
    "Версия плагина",
    "Номер запуска",
  ];
  const rows = items.map((item) => [
    new Date(item.captured_at).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }),
    item.status,
    item.number_before,
    item.number_after,
    item.before_text,
    item.after_text,
    formatDecisionContext(item),
    formatNeighbors(item.neighbors),
    item.reason,
    item.number_kind,
    item.number_rules_version,
    item.diagnostics_schema_version || 1,
    Array.isArray(item.rule_codes) ? item.rule_codes.join(", ") : "",
    item.layer_mode,
    item.plugin_release,
    item.run_id,
  ]);

  return `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\r\n")}`;
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.statusCode = 405;
    response.end("Method not allowed");
    return;
  }

  if (!isSessionAuthorized(request)) {
    response.statusCode = 401;
    response.end("Unauthorized");
    return;
  }

  try {
    const query = getQuery(request);
    const result = await getNumberDiagnosticCases(query, process.env, { all: true, maxLimit: 20_000 });
    const filename = `chistovik-number-diagnostics-${result.from}-${result.to}.csv`;
    response.statusCode = 200;
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.end(createCsv(result.items));
  } catch (error) {
    console.error("[number-diagnostics-export] Export failure", error?.code || error?.name || "unknown");
    response.statusCode = 503;
    response.end("Export unavailable");
  }
};

module.exports.createCsv = createCsv;
module.exports.formatDecisionContext = formatDecisionContext;
