(function () {
  "use strict";

  const STATUS_LABELS = {
    all: "Все случаи с числами",
    already_correct: "Уже было правильно",
    changed: "Изменено типографом",
    new: "Новых с прошлого визита",
    review: "Требует проверки",
    skipped_policy: "Оставлено по правилу",
  };
  const STATUS_ORDER = ["new", "all", "changed", "skipped_policy", "already_correct", "review"];
  const VISIT_WATERMARK_KEY = "chistovik-number-diagnostics-visit-watermark";
  const RULE_LABELS = {
    number_decimal_comma: "Десятичная запятая",
    number_context_change: "Текст рядом с числом",
    number_context_nbsp: "Пробел рядом с числом",
    number_group_digits: "Разряды числа",
    number_unit_currency_nbsp: "Пробел с обозначением",
    number_western_format: "Западная запись числа",
    phone_ru_format: "Российский телефон",
    phone_ru_separators: "Разделители телефона",
  };
  const state = {
    filters: {
      from: "2026-08-25",
      layerMode: "",
      reason: "",
      rule: "",
      search: "",
      status: "",
      to: "2026-09-18",
    },
    items: [],
    limit: 50,
    page: 1,
    summary: { all: 0, already_correct: 0, changed: 0, new: 0, review: 0, skipped_policy: 0 },
    total: 0,
    visitBaseline: readVisitWatermark(),
    visibleSpaces: true,
  };
  const elements = {};
  let searchTimer = null;
  const isLocalDemo = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  function getElement(id) {
    return document.getElementById(id);
  }

  function readVisitWatermark() {
    try {
      const value = window.localStorage.getItem(VISIT_WATERMARK_KEY);
      const date = value ? new Date(value) : null;
      return date !== null && Number.isFinite(date.getTime()) ? date.toISOString() : null;
    } catch {
      return null;
    }
  }

  function writeVisitWatermark(value) {
    try {
      const date = value ? new Date(value) : null;

      if (date !== null && Number.isFinite(date.getTime())) {
        window.localStorage.setItem(VISIT_WATERMARK_KEY, date.toISOString());
      }
    } catch {
      // Без локального хранилища отчёт продолжает работать, но не запоминает визит.
    }
  }

  function initializeElements() {
    [
      "caseList", "dateFrom", "dateTo", "exportAllButton", "exportFilteredButton", "layerModeFilter",
      "loadMoreButton", "loginError", "loginForm", "loginView", "logoutButton", "pageNotice",
      "paginationNote", "password", "reasonFilter", "reportView", "resetButton", "resultCount",
      "ruleFilter", "searchInput", "spacesToggle", "summaryGrid",
    ].forEach((id) => {
      elements[id] = getElement(id);
    });
  }

  function buildQuery(filters, page) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (key === "status" && value === "new") {
        params.set("newOnly", "1");
        return;
      }

      if (value) {
        params.set(key, value);
      }
    });

    if (state.visitBaseline) {
      params.set("seenAfter", state.visitBaseline);
    }

    params.set("page", String(page));
    params.set("limit", String(state.limit));
    return params;
  }

  async function requestJson(url, options) {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (response.status === 401) {
      const error = new Error("unauthorized");
      error.code = "unauthorized";
      throw error;
    }

    if (!response.ok) {
      throw new Error(`request_failed_${response.status}`);
    }

    return response.json();
  }

  function showLogin() {
    elements.reportView.hidden = true;
    elements.loginView.hidden = false;
    window.setTimeout(() => elements.password.focus(), 0);
  }

  function showReport() {
    elements.loginView.hidden = true;
    elements.reportView.hidden = false;
  }

  async function checkSession() {
    if (isLocalDemo) {
      showReport();
      await loadData(false);
      return;
    }

    try {
      const session = await requestJson("/api/number-diagnostics-session", { method: "GET" });

      if (!session.authenticated) {
        showLogin();
        return;
      }

      showReport();
      await loadData(false);
    } catch {
      showLogin();
    }
  }

  async function login(event) {
    event.preventDefault();
    elements.loginError.hidden = true;

    try {
      await requestJson("/api/number-diagnostics-session", {
        body: JSON.stringify({ password: elements.password.value }),
        method: "POST",
      });
      elements.password.value = "";
      showReport();
      await loadData(false);
    } catch {
      elements.loginError.hidden = false;
    }
  }

  async function logout() {
    try {
      await requestJson("/api/number-diagnostics-session", { method: "DELETE" });
    } catch {
      // The local page can still return to the login screen.
    }

    showLogin();
  }

  async function loadDemoData() {
    const response = await fetch("/number-diagnostics-demo.json", { cache: "no-store" });
    const payload = await response.json();
    const allItems = payload.cases.items;
    const latestCapturedAt = allItems.reduce((latest, item) => {
      const capturedAt = new Date(item.captured_at).getTime();
      return Number.isFinite(capturedAt) ? Math.max(latest, capturedAt) : latest;
    }, 0);
    const visitBaselineTime = state.visitBaseline ? new Date(state.visitBaseline).getTime() : null;
    payload.visit = {
      newCount: visitBaselineTime === null || !Number.isFinite(visitBaselineTime)
        ? 0
        : allItems.filter((item) => new Date(item.captured_at).getTime() > visitBaselineTime).length,
      watermark: latestCapturedAt > 0 ? new Date(latestCapturedAt).toISOString() : null,
    };
    const fromTime = new Date(`${state.filters.from}T00:00:00+03:00`).getTime();
    const toTime = new Date(`${state.filters.to}T23:59:59.999+03:00`).getTime();
    const items = allItems.filter((item) => {
      const capturedAt = new Date(item.captured_at).getTime();
      const search = state.filters.search.toLowerCase();
      return (
        capturedAt >= fromTime &&
        capturedAt <= toTime &&
        (!state.filters.status || state.filters.status === "new" || item.status === state.filters.status) &&
        (!state.filters.reason || item.reason === state.filters.reason) &&
        (!state.filters.rule || item.rule_codes.includes(state.filters.rule)) &&
        (!state.filters.layerMode || item.layer_mode === state.filters.layerMode) &&
        (state.filters.status !== "new" || (
          visitBaselineTime !== null &&
          Number.isFinite(visitBaselineTime) &&
          capturedAt > visitBaselineTime
        )) &&
        (!search || `${item.before_text} ${item.after_text} ${item.number_before} ${item.number_after}`.toLowerCase().includes(search))
      );
    });
    payload.cases.items = items;
    payload.cases.total = items.length;
    return payload;
  }

  async function loadData(append) {
    setNotice("Загружаем случаи…");

    try {
      const payload = isLocalDemo
        ? await loadDemoData()
        : await requestJson(`/api/number-diagnostics?${buildQuery(state.filters, state.page)}`, { method: "GET" });

      state.summary = {
        ...payload.summary,
        new: Number(payload.visit?.newCount) || 0,
      };
      state.total = payload.cases.total;
      state.items = append ? state.items.concat(payload.cases.items) : payload.cases.items;
      writeVisitWatermark(payload.visit?.watermark);
      renderSummary();
      renderFilterOptions(payload.filters);
      renderCases();
      clearNotice();
    } catch (error) {
      if (error.code === "unauthorized") {
        showLogin();
        return;
      }

      setNotice("Не удалось загрузить данные. Обновите страницу.");
    }
  }

  function renderSummary() {
    elements.summaryGrid.replaceChildren();

    STATUS_ORDER.forEach((status) => {
      const button = document.createElement("button");
      const count = document.createElement("strong");
      const label = document.createElement("span");
      button.type = "button";
      button.className = "summary-card";
      button.dataset.status = status;
      button.classList.toggle("is-active", (state.filters.status || "all") === status);
      count.textContent = status === "new"
        ? `+${formatNumber(state.summary.new || 0)} ⭐`
        : formatNumber(state.summary[status] || 0);
      label.textContent = STATUS_LABELS[status];
      button.append(count, label);
      button.addEventListener("click", () => {
        state.filters.status = status === "all" ? "" : status;
        refreshFromFirstPage();
      });
      elements.summaryGrid.append(button);
    });
  }

  function renderFilterOptions(filters) {
    updateSelect(elements.reasonFilter, "Все причины", filters.reasons || [], "reason");
    updateSelect(elements.ruleFilter, "Все правила", filters.rules || [], "rule_code", (value) => RULE_LABELS[value] || value);
  }

  function updateSelect(select, firstLabel, items, valueKey, formatLabel = (value) => value) {
    const current = select.value;
    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = firstLabel;
    select.replaceChildren(firstOption);

    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item[valueKey];
      option.textContent = `${formatLabel(item[valueKey])} · ${formatNumber(item.count)}`;
      select.append(option);
    });
    select.value = current;
  }

  function renderCases() {
    elements.caseList.replaceChildren();
    elements.resultCount.textContent = `Найдено: ${formatNumber(state.total)} ${pluralizeCases(state.total)}`;

    if (state.items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = hasActiveCaseFilters() ? "По выбранным фильтрам ничего не найдено." : "За выбранный период случаев нет.";
      elements.caseList.append(empty);
    } else {
      state.items.forEach((item) => elements.caseList.append(createCaseCard(item)));
    }

    const hasMore = state.items.length < state.total;
    elements.loadMoreButton.hidden = !hasMore;
    elements.paginationNote.textContent = state.total > 0 ? `Показано ${formatNumber(state.items.length)} из ${formatNumber(state.total)} случаев` : "";
  }

  function createCaseCard(item) {
    const card = document.createElement("article");
    card.className = "case-card";
    const visibleNeighbors = Array.isArray(item.neighbors)
      ? item.neighbors.filter((neighbor) => neighbor && neighbor.role !== "separator")
      : [];

    const header = document.createElement("header");
    header.className = "case-card-header";
    const headingGroup = document.createElement("div");
    headingGroup.className = "case-heading-group";
    const badge = document.createElement("span");
    badge.className = "status-badge";
    badge.dataset.status = item.status;
    const changedOnlyNearby =
      item.status === "changed" &&
      Array.isArray(item.rule_codes) &&
      item.rule_codes.some((code) => code === "number_context_change" || code === "number_context_nbsp") &&
      item.number_before === item.number_after;
    badge.textContent = changedOnlyNearby ? "Изменён текст рядом" : STATUS_LABELS[item.status] || item.status;
    const layout = document.createElement("span");
    layout.className = "case-layout";
    layout.textContent = visibleNeighbors.length > 0 ? "Несколько слоёв" : "Один слой";
    const time = document.createElement("time");
    time.className = "case-time";
    time.dateTime = item.captured_at;
    time.textContent = formatDateTime(item.captured_at);
    headingGroup.append(badge, layout);
    header.append(headingGroup, time);

    const comparison = document.createElement("div");
    comparison.className = "comparison-grid";
    const changedRanges = getChangedRanges(item.before_text, item.after_text);
    comparison.append(
      createComparisonCell("До", item.before_text, changedRanges.before),
      createComparisonCell("После", item.after_text, changedRanges.after)
    );

    card.append(header, comparison);

    const recordedDirections = new Set(
      visibleNeighbors
        .filter(isMeaningfulNumberDiagnosticNeighbor)
        .map((neighbor) => neighbor.direction)
    );
    const missingDirections = getMissingContextDirections(item)
      .filter((direction) => !recordedDirections.has(direction));

    if (visibleNeighbors.length > 0 || missingDirections.length > 0 || isStandaloneContextCase(item)) {
      const neighbors = document.createElement("div");
      neighbors.className = "neighbor-strip";

      (["left", "right"]).forEach((direction) => {
        const directionalNeighbors = visibleNeighbors.filter((neighbor) => neighbor.direction === direction);

        if (directionalNeighbors.length > 0) {
          neighbors.append(createNeighborContext(item, directionalNeighbors));
        }
      });

      if (missingDirections.length === 2 && visibleNeighbors.length === 0) {
        neighbors.append(createMissingNeighborContext(null, item.diagnostics_schema_version || 1));
      } else {
        missingDirections.forEach((direction) =>
          neighbors.append(createMissingNeighborContext(direction, item.diagnostics_schema_version || 1))
        );
      }

      card.append(neighbors);
    }

    const details = document.createElement("div");
    details.className = "details-grid";
    details.append(
      createDetail("Причина решения", item.reason),
      createDetail("Распознано как", item.number_kind),
      createRuleDetail(item.rule_codes),
      createDetail("Версия числовых правил", item.number_rules_version),
      createDetail("Сборка диагностики", String(item.diagnostics_schema_version || 1))
    );
    card.append(details);
    return card;
  }

  function createComparisonCell(labelText, value, changedRange) {
    const cell = document.createElement("div");
    cell.className = "comparison-cell";
    const label = document.createElement("span");
    label.className = "cell-label";
    label.textContent = labelText;
    const text = document.createElement("p");
    text.className = "comparison-text";
    appendTextWithChange(text, value, changedRange);
    cell.append(label, text);
    return cell;
  }

  function appendTextWithChange(container, value, changedRange) {
    const start = changedRange?.start ?? -1;
    const end = changedRange?.end ?? -1;

    if (start < 0 || end <= start) {
      appendTextWithSpaces(container, value);
      return;
    }

    appendTextWithSpaces(container, value.slice(0, start));
    const mark = document.createElement("mark");
    appendTextWithSpaces(mark, value.slice(start, end));
    container.append(mark);
    appendTextWithSpaces(container, value.slice(end));
  }

  function appendTextWithSpaces(container, value) {
    if (!state.visibleSpaces) {
      container.append(document.createTextNode(value));
      return;
    }

    let buffer = "";

    function flush() {
      if (buffer) {
        container.append(document.createTextNode(buffer));
        buffer = "";
      }
    }

    for (const character of value) {
      if (character === "\u00a0" || character === "\u202f") {
        flush();
        const token = document.createElement("span");
        token.className = "nbsp-marker";
        token.setAttribute("aria-label", "Неразрывный пробел");
        token.textContent = "*";
        container.append(token);
      } else if (character === "\u2009" || character === "\t") {
        buffer += " ";
      } else {
        buffer += character;
      }
    }
    flush();
  }

  function getChangedRanges(before, after) {
    let prefix = 0;
    const maxPrefix = Math.min(before.length, after.length);

    while (prefix < maxPrefix && before[prefix] === after[prefix]) {
      prefix += 1;
    }

    let beforeSuffix = before.length;
    let afterSuffix = after.length;

    while (beforeSuffix > prefix && afterSuffix > prefix && before[beforeSuffix - 1] === after[afterSuffix - 1]) {
      beforeSuffix -= 1;
      afterSuffix -= 1;
    }

    return {
      after: { end: afterSuffix, start: prefix },
      before: { end: beforeSuffix, start: prefix },
    };
  }


  function isStandaloneContextCase(caseItem) {
    return !/[A-Za-zА-Яа-яЁё]{4,}/.test(caseItem.before_text || "");
  }

  function isMeaningfulNumberDiagnosticNeighbor(neighbor) {
    if (neighbor.usedAsEvidence) {
      return true;
    }

    const text = String(neighbor.text || "").trim();
    return text.length > 0 && !/^[\s+\-−–—\d.,/:()]+$/.test(text);
  }

  function getMissingContextDirections(caseItem) {
    const text = caseItem.before_text || "";
    const number = caseItem.number_before || "";
    let start = number ? text.indexOf(number) : -1;
    let length = number.length;

    if (start === -1) {
      const digits = number.replace(/\D/g, "");
      start = digits ? text.indexOf(digits) : -1;
      length = digits.length;
    }

    if (start === -1) {
      return isStandaloneContextCase(caseItem) ? ["left", "right"] : [];
    }

    const end = start + length;
    const words = [];
    const pattern = /[A-Za-zА-Яа-яЁё]{4,}/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      words.push({ start: match.index, end: match.index + match[0].length });
    }

    const directions = [];

    if (!words.some((word) => word.end <= start)) {
      directions.push("left");
    }

    if (!words.some((word) => word.start >= end)) {
      directions.push("right");
    }

    return directions;
  }

  function createNeighborContext(caseItem, neighbors) {
    const item = document.createElement("div");
    const usedAsEvidence = neighbors.some((neighbor) => neighbor.usedAsEvidence);
    item.className = usedAsEvidence ? "neighbor-item is-evidence" : "neighbor-item";
    const label = document.createElement("span");
    label.className = "detail-label";
    label.textContent = usedAsEvidence ? "Контекст решения" : "Соседние слои для проверки";
    const text = document.createElement("p");
    const direction = neighbors[0]?.direction;
    const neighborTexts = neighbors.map((neighbor) => neighbor.text);
    const parts = direction === "left"
      ? [...neighborTexts].reverse().concat(caseItem.number_before)
      : [caseItem.number_before].concat(neighborTexts);
    parts.forEach((part, index) => {
      if (index > 0) {
        text.append(document.createTextNode(" · "));
      }

      appendTextWithSpaces(text, part);
    });
    item.append(label, text);
    return item;
  }

  function createMissingNeighborContext(direction, schemaVersion) {
    const item = document.createElement("div");
    item.className = "neighbor-item is-missing";
    const label = document.createElement("span");
    label.className = "detail-label";
    label.textContent = direction === "left"
      ? "Контекст перед числом"
      : direction === "right"
        ? "Контекст после числа"
        : "Контекст отдельного слоя";
    const text = document.createElement("p");
    text.textContent = schemaVersion >= 5
      ? "Соседний текстовый слой не найден"
      : "Соседний текстовый слой не был записан этой сборкой";
    item.append(label, text);
    return item;
  }

  function createDetail(labelText, value) {
    const item = document.createElement("div");
    const label = document.createElement("span");
    label.className = "detail-label";
    label.textContent = labelText;
    const content = document.createElement("p");
    content.className = "detail-value";
    content.textContent = value || "—";
    item.append(label, content);
    return item;
  }

  function createRuleDetail(ruleCodes) {
    const item = document.createElement("div");
    const label = document.createElement("span");
    label.className = "detail-label";
    label.textContent = "Сработавшие правила";
    const list = document.createElement("div");
    list.className = "rule-list";

    if (!Array.isArray(ruleCodes) || ruleCodes.length === 0) {
      list.textContent = "—";
    } else {
      ruleCodes.forEach((code) => {
        const chip = document.createElement("span");
        chip.className = "rule-chip";
        chip.textContent = RULE_LABELS[code] || code;
        list.append(chip);
      });
    }

    item.append(label, list);
    return item;
  }

  function hasActiveCaseFilters() {
    return Boolean(state.filters.status || state.filters.reason || state.filters.rule || state.filters.layerMode || state.filters.search);
  }

  function refreshFromFirstPage() {
    state.page = 1;
    state.items = [];
    loadData(false);
  }

  function resetFilters() {
    state.filters.status = "";
    state.filters.reason = "";
    state.filters.rule = "";
    state.filters.layerMode = "";
    state.filters.search = "";
    elements.reasonFilter.value = "";
    elements.ruleFilter.value = "";
    elements.layerModeFilter.value = "";
    elements.searchInput.value = "";
    refreshFromFirstPage();
  }

  function setNotice(message) {
    elements.pageNotice.textContent = message;
    elements.pageNotice.hidden = false;
  }

  function clearNotice() {
    elements.pageNotice.hidden = true;
    elements.pageNotice.textContent = "";
  }

  function exportCases(all) {
    if (isLocalDemo) {
      setNotice("В тестовом просмотре выгрузка недоступна.");
      return;
    }

    const filters = all
      ? { from: state.filters.from, to: state.filters.to }
      : state.filters;
    window.location.assign(`/api/number-diagnostics-export?${buildQuery(filters, 1)}`);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("ru-RU").format(Number(value) || 0);
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "long",
      timeZone: "Europe/Moscow",
    }).format(new Date(value));
  }

  function pluralizeCases(value) {
    const absolute = Math.abs(Number(value)) % 100;
    const last = absolute % 10;

    if (absolute > 10 && absolute < 20) return "случаев";
    if (last === 1) return "случай";
    if (last >= 2 && last <= 4) return "случая";
    return "случаев";
  }

  function bindEvents() {
    elements.loginForm.addEventListener("submit", login);
    elements.logoutButton.addEventListener("click", logout);
    elements.dateFrom.addEventListener("change", () => {
      state.filters.from = elements.dateFrom.value;
      refreshFromFirstPage();
    });
    elements.dateTo.addEventListener("change", () => {
      state.filters.to = elements.dateTo.value;
      refreshFromFirstPage();
    });
    elements.reasonFilter.addEventListener("change", () => {
      state.filters.reason = elements.reasonFilter.value;
      refreshFromFirstPage();
    });
    elements.ruleFilter.addEventListener("change", () => {
      state.filters.rule = elements.ruleFilter.value;
      refreshFromFirstPage();
    });
    elements.layerModeFilter.addEventListener("change", () => {
      state.filters.layerMode = elements.layerModeFilter.value;
      refreshFromFirstPage();
    });
    elements.searchInput.addEventListener("input", () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.filters.search = elements.searchInput.value.trim();
        refreshFromFirstPage();
      }, 300);
    });
    elements.resetButton.addEventListener("click", resetFilters);
    elements.spacesToggle.addEventListener("change", () => {
      state.visibleSpaces = elements.spacesToggle.checked;
      renderCases();
    });
    elements.exportFilteredButton.addEventListener("click", () => exportCases(false));
    elements.exportAllButton.addEventListener("click", () => exportCases(true));
    elements.loadMoreButton.addEventListener("click", () => {
      state.page += 1;
      loadData(true);
    });
  }

  function applyInitialQuery() {
    const params = new URLSearchParams(window.location.search);

    if (/^2026-\d{2}-\d{2}$/.test(params.get("from") || "")) {
      state.filters.from = params.get("from");
      elements.dateFrom.value = state.filters.from;
    }

    if (/^2026-\d{2}-\d{2}$/.test(params.get("to") || "")) {
      state.filters.to = params.get("to");
      elements.dateTo.value = state.filters.to;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initializeElements();
    applyInitialQuery();
    bindEvents();
    checkSession();
  });
})();
