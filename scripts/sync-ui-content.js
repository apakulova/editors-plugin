const fs = require("fs");
const path = require("path");
const content = require("../src/ui-content.js");
const releaseAnnouncements = require("../src/release-announcements.js");

const rootDir = path.resolve(__dirname, "..");
const manifestPath = path.join(rootDir, "manifest.json");
const uiPath = path.join(rootDir, "src", "ui.html");
const releaseAnnouncementCommand = "open-release-announcement";

function getActiveReleaseAnnouncement() {
  if (releaseAnnouncements.activeId === null) {
    return null;
  }

  const announcement = releaseAnnouncements.items[releaseAnnouncements.activeId];

  if (!announcement) {
    throw new Error(`Не найдено активное сообщение выпуска: ${releaseAnnouncements.activeId}`);
  }

  if (!Array.isArray(announcement.paragraphsHtml) || announcement.paragraphsHtml.length === 0) {
    throw new Error("У сообщения выпуска должен быть хотя бы один абзац");
  }

  if (!Array.isArray(announcement.actions) || announcement.actions.length < 1 || announcement.actions.length > 2) {
    throw new Error("У сообщения выпуска должна быть одна или две кнопки");
  }

  if (!announcement.actions.some((action) => action.action === "back-to-typograph")) {
    throw new Error("У сообщения выпуска должна быть кнопка возврата к типографу");
  }

  const supportedActions = new Set(["back-to-typograph", "show-rules"]);
  const supportedAppearances = new Set(["primary", "secondary"]);

  announcement.actions.forEach((action) => {
    if (!supportedActions.has(action.action)) {
      throw new Error(`Неизвестное действие кнопки сообщения выпуска: ${action.action}`);
    }

    if (!supportedAppearances.has(action.appearance)) {
      throw new Error(`Неизвестный вид кнопки сообщения выпуска: ${action.appearance}`);
    }
  });

  if (announcement.actions.length === 2) {
    const appearances = new Set(announcement.actions.map((action) => action.appearance));

    if (!appearances.has("primary") || !appearances.has("secondary")) {
      throw new Error("Две кнопки сообщения выпуска должны состоять из основной и вторичной");
    }
  }

  const imagePath = path.join(rootDir, "assets", announcement.imageAsset);

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Не найдена иллюстрация сообщения выпуска: ${announcement.imageAsset}`);
  }

  return announcement;
}

const activeReleaseAnnouncement = getActiveReleaseAnnouncement();

function createDataUrl(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = extension === ".woff2" ? "font/woff2" : extension === ".png" ? "image/png" : "application/octet-stream";
  return `data:${mimeType};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

function inlineUIAssets(html) {
  const withImages = html.replace(/src="[^"]*" data-inline-asset="([^"]+)"/g, (_match, fileName) => {
    const assetPath = path.join(rootDir, "assets", fileName);
    return `src="${createDataUrl(assetPath)}" data-inline-asset="${fileName}"`;
  });

  return withImages.replace(
    /\/\* chistovik-inline-font:([^:]+):start \*\/[\s\S]*?\/\* chistovik-inline-font:\1:end \*\//g,
    (_match, fileName) => {
      const fontDataUrl = createDataUrl(path.join(rootDir, "assets", "fonts", fileName));
      return `/* chistovik-inline-font:${fileName}:start */
      @font-face {
        font-display: block;
        font-family: "Cactus Classical Serif";
        font-style: normal;
        font-weight: 400;
        src: url("${fontDataUrl}") format("woff2");
      }
      /* chistovik-inline-font:${fileName}:end */`;
    }
  );
}

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
  return `<button class="primary" id="run" type="button" aria-busy="false">
  <span class="run-spinner" aria-hidden="true"></span>
  <span>${content.actions.runButton}</span>
</button>`;
}

function renderReleaseAnnouncement() {
  if (activeReleaseAnnouncement === null) {
    return '<span hidden></span>';
  }

  const paragraphs = activeReleaseAnnouncement.paragraphsHtml
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("\n");
  const actions = activeReleaseAnnouncement.actions
    .map(
      (action) =>
        `<button class="${action.appearance}" type="button" data-announcement-action="${action.action}">${action.labelHtml}</button>`
    )
    .join("\n");

  return `<article class="release-announcement">
  <div class="release-announcement-content">
    <img class="release-announcement-illustration" src="" data-inline-asset="${activeReleaseAnnouncement.imageAsset}" alt="" />
    <h1 class="release-announcement-title">${activeReleaseAnnouncement.titleHtml}</h1>
    <div class="release-announcement-summary">
${indent(paragraphs, 6)}
    </div>
  </div>
  <footer class="release-announcement-actions">
${indent(actions, 4)}
  </footer>
</article>`;
}

function syncManifestMenu() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const menu = [];

  for (const item of manifest.menu || []) {
    if (item.command === releaseAnnouncementCommand) {
      if (menu.length > 0 && menu[menu.length - 1].separator === true) {
        menu.pop();
      }

      continue;
    }

    menu.push(item);
  }

  if (activeReleaseAnnouncement !== null) {
    menu.push({ separator: true });
    menu.push({
      name: activeReleaseAnnouncement.menuName,
      command: releaseAnnouncementCommand,
    });
  }

  manifest.menu = menu;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
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
  html = replaceBlock(html, "release-announcement", renderReleaseAnnouncement());
  html = html.replace(
    /(<img class="report-status-icon" id="reportStatusIcon") src="[^"]*"(?: data-inline-asset="report-warning\.png")?/,
    '$1 src=""'
  );
  html = inlineUIAssets(html);

  fs.writeFileSync(uiPath, html);
  syncManifestMenu();
}

syncUIContent();
