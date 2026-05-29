const fs = require("fs");
const path = require("path");
const content = require("../src/ui-content.js");

const rootDir = path.resolve(__dirname, "..");
const uiPath = path.join(rootDir, "src", "ui.html");

function indent(lines, spaces) {
  const prefix = " ".repeat(spaces);

  return lines
    .split("\n")
    .map((line) => (line ? `${prefix}${line}` : line))
    .join("\n");
}

function renderTabs() {
  return content.tabs
    .map((tab) => {
      const activeClass = tab.active ? " active" : "";
      const selected = tab.active ? "true" : "false";

      if (tab.hasDoodles) {
        return `<button class="tab${activeClass}" type="button" data-tab="${tab.id}" aria-selected="${selected}">
  <span class="tab-label">
    ${tab.label}
    <span class="tab-doodles" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </span>
  </span>
</button>`;
      }

      return `<button class="tab${activeClass}" type="button" data-tab="${tab.id}" aria-selected="${selected}">${tab.label}</button>`;
    })
    .join("\n");
}

function renderTypograph() {
  const modes = content.typograph.modes
    .map((mode) => {
      const checked = mode.checked ? " checked" : "";

      return `<label class="mode" for="${mode.id}">
  <input id="${mode.id}" name="${mode.name}" type="radio" value="${mode.value}"${checked} />
  <span class="radio-mark" aria-hidden="true"></span>
  <span class="mode-content">
    <span class="mode-name">${mode.title}</span>
    <span class="mode-text">${mode.text}</span>
  </span>
</label>`;
    })
    .join("\n");
  const options = content.typograph.options
    .map((option) => {
      const developmentOnlyLabel = option.developmentOnly ? " option-disabled" : "";
      const developmentOnlyAttribute = option.developmentOnly ? ' data-development-only-option="true"' : "";
      const developmentOnlyInputAttribute = option.developmentOnly ? ' data-development-only="true" disabled' : "";

      return `<label class="option${developmentOnlyLabel}" for="${option.id}"${developmentOnlyAttribute}>
  <input id="${option.id}" type="checkbox" data-option="${option.key}"${developmentOnlyInputAttribute} />
  <span>
    <span class="option-title">${option.label}</span>
  </span>
</label>`;
    })
    .join("\n");

  return `<div class="group">
  <div class="group-title">${content.typograph.title}</div>
  <div class="mode-list" role="radiogroup" aria-label="${content.typograph.modeAriaLabel}">
${indent(modes, 4)}
  </div>
</div>

<div class="options">
${indent(options, 2)}
</div>`;
}

function renderRules() {
  return content.rules
    .map((rule) => {
      const points = rule.points.map((point) => `<div class="rule-point">${point}</div>`).join("\n");

      return `<details class="rule">
  <summary>${rule.title}</summary>
  <div class="rule-body">
${indent(points, 4)}
  </div>
</details>`;
    })
    .join("\n\n");
}

function renderAbout() {
  const bullets = content.about.bullets
    .map(
      (bullet) => `<div class="about-list-item">
  <span class="about-bullet" aria-hidden="true">✦</span>
  <span>${bullet}</span>
</div>`
    )
    .join("\n");

  return `<div class="about">
  <p class="about-lead">${content.about.lead}</p>
  <div class="about-list">
${indent(bullets, 4)}
  </div>
  <div class="about-note">
    <span class="about-sparkles" aria-hidden="true">
      <span class="about-sparkle large">✦</span>
      <span class="about-sparkle medium">✦</span>
      <span class="about-sparkle small">✦</span>
    </span>
    <span class="about-note-title">${content.about.noteTitle}</span>
    <p class="about-text">${content.about.noteHtml}</p>
  </div>
</div>`;
}

function renderActions() {
  return `<button class="primary" id="run" type="button">${content.actions.runButton}</button>`;
}

function replaceBlock(html, key, block) {
  const start = `<!-- chistovik-content:${key}:start -->`;
  const end = `<!-- chistovik-content:${key}:end -->`;
  const pattern = new RegExp(`^([ \\t]*)${start}[\\s\\S]*?\\n[ \\t]*${end}`, "m");
  const match = html.match(pattern);

  if (!match) {
    throw new Error(`Не найден блок контента: ${key}`);
  }

  const baseIndent = match[1];
  const childIndent = baseIndent + "  ";

  return html.replace(pattern, `${baseIndent}${start}\n${indent(block, childIndent.length)}\n${baseIndent}${end}`);
}

function syncUIContent() {
  let html = fs.readFileSync(uiPath, "utf8");

  html = replaceBlock(html, "tabs", renderTabs());
  html = replaceBlock(html, "typograph", renderTypograph());
  html = replaceBlock(html, "rules", renderRules());
  html = replaceBlock(html, "about", renderAbout());
  html = replaceBlock(html, "actions", renderActions());

  fs.writeFileSync(uiPath, html);
}

syncUIContent();
