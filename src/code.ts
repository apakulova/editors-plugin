const NBSP = "\u00A0";
const DEVELOPMENT_NBSP_MARKER = "*";
const DEVELOPMENT_NBSP_FILL: SolidPaint = {
  type: "SOLID",
  color: { r: 1, g: 64 / 255, b: 83 / 255 },
};
const NB_HYPHEN = "\u2011";
const EN_DASH = "\u2013";
const EM_DASH = "\u2014";
const MINUS = "\u2212";
const COMMAND_OPEN_SETTINGS = "open-settings";
const LETTERS = "A-Za-zА-Яа-яЁё";
const STYLE_FIELDS: Array<"fontName" | "fontSize" | "fills" | "textCase" | "textDecoration" | "letterSpacing" | "lineHeight"> = [
  "fontName",
  "fontSize",
  "fills",
  "textCase",
  "textDecoration",
  "letterSpacing",
  "lineHeight",
];

type TypographMode = "beauty" | "development";
type QuoteScript = "cyrillic" | "latin";

interface PluginRunOptions {
  mode: TypographMode;
  processHiddenNodes: boolean;
  processLockedNodes: boolean;
}

interface PluginUIMessage {
  options?: Partial<PluginRunOptions>;
  type?: string;
}

interface QuoteState {
  script: QuoteScript;
  level: number;
}

interface TextProcessResult {
  processed: number;
  changed: number;
  failed: number;
  skippedHidden: number;
  skippedLocked: number;
}

interface TextCollectionResult {
  nodes: TextNode[];
  skippedHidden: number;
  skippedLocked: number;
}

interface TypographyCleanResult {
  text: string;
  developmentMarkerIndexes: number[];
}

interface MathExpressionParseResult {
  end: number;
  text: string;
}

interface MathNumberParseResult {
  end: number;
  hasUnaryMinus: boolean;
  text: string;
}

interface MathOperatorParseResult {
  end: number;
  text: string;
}

type StyleSegment = Pick<StyledTextSegment, "fontName" | "fontSize" | "fills" | "textCase" | "textDecoration" | "letterSpacing" | "lineHeight" | "characters" | "start" | "end">;

async function run(): Promise<void> {
  let shouldClosePlugin = true;

  try {
    if (figma.command === COMMAND_OPEN_SETTINGS) {
      shouldClosePlugin = false;
      openSettingsUI();
      return;
    }

    await runTypograph(getDefaultRunOptions());
  } catch (error) {
    console.error("[Чистовик] Failed to clean typography", error);
    figma.notify("Ой, не получилось почистить 🛑", { error: true });
  } finally {
    if (shouldClosePlugin) {
      figma.closePlugin();
    }
  }
}

function openSettingsUI(): void {
  try {
    figma.showUI(__html__, {
      height: 340,
      themeColors: true,
      width: 360,
    });

    figma.ui.onmessage = async (message: PluginUIMessage) => {
      try {
        if (message.type === "close") {
          figma.closePlugin();
          return;
        }

        if (message.type === "run-typograph") {
          await runTypograph(getRunOptionsFromMessage(message));
          figma.closePlugin();
        }
      } catch (error) {
        console.error("[Чистовик] Failed to handle UI message", error);
        figma.notify("Ой, не получилось почистить 🛑", { error: true });
      }
    };
  } catch (error) {
    console.error("[Чистовик] Failed to open settings UI", error);
    throw error;
  }
}

async function runTypograph(options: PluginRunOptions): Promise<void> {
  try {
    figma.skipInvisibleInstanceChildren = !options.processHiddenNodes;

    const collection = await collectTargetTextNodes({
      processHidden: options.processHiddenNodes,
      processLocked: options.processLockedNodes,
    });
    const result = await processTextNodes(collection.nodes, collection.skippedLocked, collection.skippedHidden, options);

    if (result.failed > 0) {
      throw new Error(`Failed to process ${result.failed} text node(s)`);
    }

    notifyCleanResult(result);
  } catch (error) {
    console.error("[Чистовик] Failed to run typograph", error);
    throw error;
  }
}

function getDefaultRunOptions(): PluginRunOptions {
  try {
    return {
      mode: "beauty",
      processHiddenNodes: false,
      processLockedNodes: false,
    };
  } catch (error) {
    console.error("[Чистовик] Failed to get default run options", error);
    throw error;
  }
}

function getRunOptionsFromMessage(message: PluginUIMessage): PluginRunOptions {
  try {
    const defaults = getDefaultRunOptions();
    const mode = message.options?.mode === "development" ? "development" : defaults.mode;

    return {
      mode,
      processHiddenNodes: message.options?.processHiddenNodes === true,
      processLockedNodes: message.options?.processLockedNodes === true,
    };
  } catch (error) {
    console.error("[Чистовик] Failed to get run options from UI message", error);
    throw error;
  }
}

function notifyCleanResult(result: TextProcessResult): void {
  try {
    if (result.skippedLocked > 0 || result.skippedHidden > 0) {
      const skippedLabel = getSkippedLayerLabel(result);

      if (result.changed > 0) {
        figma.notify(`${skippedLabel} не тронуты, в остальном — теперь всё чисто 🔥🔥🔥`, { timeout: 4000 });
      } else {
        figma.notify(`${skippedLabel} не тронуты, а остальное уже было чисто 👌`, { timeout: 4000 });
      }

      return;
    }

    if (result.changed > 0) {
      figma.notify("Теперь всё чисто 🔥🔥🔥", { timeout: 4000 });
    } else {
      figma.notify("Всё уже было чисто 👌", { timeout: 4000 });
    }
  } catch (error) {
    console.error("[Чистовик] Failed to notify result", error);
    throw error;
  }
}

function getSkippedLayerLabel(result: TextProcessResult): string {
  try {
    if (result.skippedLocked > 0 && result.skippedHidden > 0) {
      return "Замочки и скрытые слои";
    }

    if (result.skippedHidden > 0) {
      return "Скрытые слои";
    }

    return "Замочки";
  } catch (error) {
    console.error("[Чистовик] Failed to get skipped layer label", error);
    throw error;
  }
}

async function collectTargetTextNodes(options: { processHidden: boolean; processLocked: boolean }): Promise<TextCollectionResult> {
  try {
    await figma.currentPage.loadAsync();

    const selection = figma.currentPage.selection;
    let candidates: TextNode[] = [];

    if (selection.length === 0) {
      candidates = figma.currentPage.findAllWithCriteria({ types: ["TEXT"] });
    } else {
      const seen = new Set<string>();

      for (const selectedNode of selection) {
        collectTextNodesFromNode(selectedNode, candidates, seen);
      }
    }

    return filterProcessableTextNodes(candidates, options);
  } catch (error) {
    console.error("[Чистовик] Failed to collect text nodes", error);
    throw error;
  }
}

function collectTextNodesFromNode(node: SceneNode, result: TextNode[], seen: Set<string>): void {
  try {
    if (node.type === "TEXT") {
      if (!seen.has(node.id)) {
        result.push(node);
        seen.add(node.id);
      }

      return;
    }

    if ("findAllWithCriteria" in node) {
      const textNodes = node.findAllWithCriteria({ types: ["TEXT"] });

      for (const textNode of textNodes) {
        if (!seen.has(textNode.id)) {
          result.push(textNode);
          seen.add(textNode.id);
        }
      }
    }
  } catch (error) {
    console.error("[Чистовик] Failed to walk selected node", error);
    throw error;
  }
}

function filterProcessableTextNodes(textNodes: TextNode[], options: { processHidden: boolean; processLocked: boolean }): TextCollectionResult {
  try {
    const nodes: TextNode[] = [];
    let skippedHidden = 0;
    let skippedLocked = 0;

    for (const textNode of textNodes) {
      if (!options.processLocked && isLockedForProcessing(textNode)) {
        skippedLocked += 1;
      } else if (!options.processHidden && isHiddenForProcessing(textNode)) {
        skippedHidden += 1;
      } else {
        nodes.push(textNode);
      }
    }

    return { nodes, skippedHidden, skippedLocked };
  } catch (error) {
    console.error("[Чистовик] Failed to filter processable text nodes", error);
    throw error;
  }
}

function isLockedForProcessing(node: BaseNode): boolean {
  try {
    let current: BaseNode | null = node;

    while (current !== null) {
      if (hasLockedProperty(current) && current.locked) {
        return true;
      }

      current = current.parent;
    }

    return false;
  } catch (error) {
    console.error("[Чистовик] Failed to check locked node state", error);
    throw error;
  }
}

function isHiddenForProcessing(node: BaseNode): boolean {
  try {
    let current: BaseNode | null = node;

    while (current !== null) {
      if (hasVisibleProperty(current) && !current.visible) {
        return true;
      }

      current = current.parent;
    }

    return false;
  } catch (error) {
    console.error("[Чистовик] Failed to check hidden node state", error);
    throw error;
  }
}

function hasVisibleProperty(node: BaseNode): node is BaseNode & { visible: boolean } {
  try {
    return "visible" in node && typeof node.visible === "boolean";
  } catch (error) {
    console.error("[Чистовик] Failed to check visible property", error);
    throw error;
  }
}

function hasLockedProperty(node: BaseNode): node is BaseNode & { locked: boolean } {
  try {
    return "locked" in node && typeof node.locked === "boolean";
  } catch (error) {
    console.error("[Чистовик] Failed to check locked property", error);
    throw error;
  }
}

async function processTextNodes(textNodes: TextNode[], skippedLocked: number, skippedHidden: number, options: PluginRunOptions): Promise<TextProcessResult> {
  try {
    let processed = 0;
    let changed = 0;
    let failed = 0;

    for (const textNode of textNodes) {
      try {
        processed += 1;
        const oldText = textNode.characters;
        const existingDevelopmentMarkerIndexes = getExistingDevelopmentMarkerIndexes(textNode);
        const cleanResult = cleanTypographyWithMetadata(oldText, options, existingDevelopmentMarkerIndexes);
        const newText = cleanResult.text;

        if (newText !== oldText) {
          await loadFontsForTextNode(textNode);
          const styles = captureTextStyles(textNode);
          const styleMap = buildStyleMap(oldText, newText, styles);
          textNode.characters = newText;
          restoreTextStyles(textNode, styleMap, styles);
          applyDevelopmentMarkerStyles(textNode, cleanResult.developmentMarkerIndexes);
          changed += 1;
        } else if (needsDevelopmentMarkerStyles(textNode, cleanResult.developmentMarkerIndexes)) {
          applyDevelopmentMarkerStyles(textNode, cleanResult.developmentMarkerIndexes);
          changed += 1;
        }
      } catch (error) {
        failed += 1;
        console.error(`[Чистовик] Failed to process text node ${textNode.id}`, error);
      }
    }

    return { processed, changed, failed, skippedHidden, skippedLocked };
  } catch (error) {
    console.error("[Чистовик] Failed to process text nodes", error);
    throw error;
  }
}

async function loadFontsForTextNode(textNode: TextNode): Promise<void> {
  try {
    const fonts = new Map<string, FontName>();

    if (textNode.characters.length === 0) {
      return;
    }

    for (const font of textNode.getRangeAllFontNames(0, textNode.characters.length)) {
      fonts.set(`${font.family}\n${font.style}`, font);
    }

    await Promise.all(Array.from(fonts.values(), (font) => figma.loadFontAsync(font)));
  } catch (error) {
    console.error(`[Чистовик] Failed to load fonts for text node ${textNode.id}`, error);
    throw error;
  }
}

function captureTextStyles(textNode: TextNode): StyleSegment[] {
  try {
    if (textNode.characters.length === 0) {
      return [];
    }

    return textNode.getStyledTextSegments(STYLE_FIELDS);
  } catch (error) {
    console.error(`[Чистовик] Failed to capture text styles for text node ${textNode.id}`, error);
    throw error;
  }
}

function buildStyleMap(oldText: string, newText: string, styles: StyleSegment[]): number[] {
  try {
    const oldIndexToStyle = new Array<number>(oldText.length).fill(0);

    for (let styleIndex = 0; styleIndex < styles.length; styleIndex += 1) {
      const segment = styles[styleIndex];

      for (let index = segment.start; index < segment.end; index += 1) {
        oldIndexToStyle[index] = styleIndex;
      }
    }

    const oldIndexMap = buildOldIndexMap(oldText, newText);

    return oldIndexMap.map((oldIndex) => {
      const safeIndex = Math.max(0, Math.min(oldText.length - 1, oldIndex));
      return oldIndexToStyle[safeIndex] ?? 0;
    });
  } catch (error) {
    console.error("[Чистовик] Failed to build style map", error);
    throw error;
  }
}

function buildOldIndexMap(oldText: string, newText: string): number[] {
  try {
    if (oldText.length === 0) {
      return new Array<number>(newText.length).fill(0);
    }

    if (oldText.length * newText.length > 9000000) {
      return buildGreedyOldIndexMap(oldText, newText);
    }

    const oldLength = oldText.length;
    const newLength = newText.length;
    const width = newLength + 1;
    const table = new Uint32Array((oldLength + 1) * (newLength + 1));

    for (let oldIndex = oldLength - 1; oldIndex >= 0; oldIndex -= 1) {
      for (let newIndex = newLength - 1; newIndex >= 0; newIndex -= 1) {
        const current = oldIndex * width + newIndex;

        if (oldText[oldIndex] === newText[newIndex]) {
          table[current] = table[(oldIndex + 1) * width + newIndex + 1] + 1;
        } else {
          table[current] = Math.max(table[(oldIndex + 1) * width + newIndex], table[oldIndex * width + newIndex + 1]);
        }
      }
    }

    const result = new Array<number>(newLength).fill(0);
    let oldIndex = 0;
    let newIndex = 0;
    let lastMappedOldIndex = 0;

    while (oldIndex < oldLength && newIndex < newLength) {
      if (oldText[oldIndex] === newText[newIndex]) {
        result[newIndex] = oldIndex;
        lastMappedOldIndex = oldIndex;
        oldIndex += 1;
        newIndex += 1;
      } else if (table[(oldIndex + 1) * width + newIndex] >= table[oldIndex * width + newIndex + 1]) {
        oldIndex += 1;
      } else {
        result[newIndex] = lastMappedOldIndex;
        newIndex += 1;
      }
    }

    while (newIndex < newLength) {
      result[newIndex] = Math.min(lastMappedOldIndex, oldLength - 1);
      newIndex += 1;
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to build old index map", error);
    throw error;
  }
}

function buildGreedyOldIndexMap(oldText: string, newText: string): number[] {
  try {
    const result: number[] = [];
    let oldIndex = 0;

    for (let newIndex = 0; newIndex < newText.length; newIndex += 1) {
      const nextOldIndex = oldText.indexOf(newText[newIndex], oldIndex);

      if (nextOldIndex === -1) {
        result.push(Math.max(0, oldIndex - 1));
      } else {
        result.push(nextOldIndex);
        oldIndex = nextOldIndex + 1;
      }
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to build greedy old index map", error);
    throw error;
  }
}

function restoreTextStyles(textNode: TextNode, styleMap: number[], styles: StyleSegment[]): void {
  try {
    if (textNode.characters.length === 0 || styles.length === 0 || styleMap.length === 0) {
      return;
    }

    let start = 0;
    let currentStyleIndex = styleMap[0] ?? 0;

    for (let index = 1; index <= styleMap.length; index += 1) {
      const nextStyleIndex = styleMap[index] ?? -1;

      if (nextStyleIndex === currentStyleIndex && index < styleMap.length) {
        continue;
      }

      applyStyleSegment(textNode, start, index, styles[currentStyleIndex]);
      start = index;
      currentStyleIndex = nextStyleIndex;
    }
  } catch (error) {
    console.error(`[Чистовик] Failed to restore text styles for text node ${textNode.id}`, error);
    throw error;
  }
}

function applyStyleSegment(textNode: TextNode, start: number, end: number, style: StyleSegment): void {
  try {
    if (start >= end) {
      return;
    }

    textNode.setRangeFontName(start, end, style.fontName);
    textNode.setRangeFontSize(start, end, style.fontSize);
    textNode.setRangeFills(start, end, style.fills);
    textNode.setRangeTextCase(start, end, style.textCase);
    textNode.setRangeTextDecoration(start, end, style.textDecoration);
    textNode.setRangeLetterSpacing(start, end, style.letterSpacing);
    textNode.setRangeLineHeight(start, end, style.lineHeight);
  } catch (error) {
    console.error("[Чистовик] Failed to apply style segment", error);
    throw error;
  }
}

function applyDevelopmentMarkerStyles(textNode: TextNode, markerIndexes: number[]): void {
  try {
    for (const index of markerIndexes) {
      if (textNode.characters[index] === DEVELOPMENT_NBSP_MARKER) {
        textNode.setRangeFills(index, index + 1, [createDevelopmentMarkerFill()]);
      }
    }
  } catch (error) {
    console.error(`[Чистовик] Failed to apply development marker styles for text node ${textNode.id}`, error);
    throw error;
  }
}

function needsDevelopmentMarkerStyles(textNode: TextNode, markerIndexes: number[]): boolean {
  try {
    for (const index of markerIndexes) {
      if (textNode.characters[index] !== DEVELOPMENT_NBSP_MARKER) {
        continue;
      }

      const fills = textNode.getRangeFills(index, index + 1);

      if (fills === figma.mixed || !isDevelopmentMarkerFills(fills)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`[Чистовик] Failed to check development marker styles for text node ${textNode.id}`, error);
    throw error;
  }
}

function isDevelopmentMarkerFills(fills: readonly Paint[]): boolean {
  try {
    return fills.length === 1 && isDevelopmentMarkerFill(fills[0]);
  } catch (error) {
    console.error("[Чистовик] Failed to check development marker fills", error);
    throw error;
  }
}

function isDevelopmentMarkerFill(fill: Paint): boolean {
  try {
    return fill.type === "SOLID" && fill.color.r === DEVELOPMENT_NBSP_FILL.color.r && fill.color.g === DEVELOPMENT_NBSP_FILL.color.g && fill.color.b === DEVELOPMENT_NBSP_FILL.color.b && (fill.opacity ?? 1) === 1;
  } catch (error) {
    console.error("[Чистовик] Failed to check development marker fill", error);
    throw error;
  }
}

function createDevelopmentMarkerFill(): SolidPaint {
  try {
    return {
      type: DEVELOPMENT_NBSP_FILL.type,
      color: {
        r: DEVELOPMENT_NBSP_FILL.color.r,
        g: DEVELOPMENT_NBSP_FILL.color.g,
        b: DEVELOPMENT_NBSP_FILL.color.b,
      },
    };
  } catch (error) {
    console.error("[Чистовик] Failed to create development marker fill", error);
    throw error;
  }
}

function getExistingDevelopmentMarkerIndexes(textNode: TextNode): number[] {
  try {
    const indexes: number[] = [];
    const text = textNode.characters;
    let index = text.indexOf(DEVELOPMENT_NBSP_MARKER);

    while (index !== -1) {
      const fills = textNode.getRangeFills(index, index + 1);

      if (fills !== figma.mixed && isDevelopmentMarkerFills(fills)) {
        indexes.push(index);
      }

      index = text.indexOf(DEVELOPMENT_NBSP_MARKER, index + 1);
    }

    return indexes;
  } catch (error) {
    console.error(`[Чистовик] Failed to get existing development marker indexes for text node ${textNode.id}`, error);
    throw error;
  }
}

function cleanTypography(input: string, options: PluginRunOptions = getDefaultRunOptions()): string {
  try {
    return cleanTypographyWithMetadata(input, options).text;
  } catch (error) {
    console.error("[Чистовик] Failed to clean text", error);
    throw error;
  }
}

function cleanTypographyWithMetadata(input: string, options: PluginRunOptions = getDefaultRunOptions(), existingDevelopmentMarkerIndexes: number[] = []): TypographyCleanResult {
  try {
    const normalizedInput = normalizeInputNonBreakingSpaces(input);
    const inputWithKnownMarkers = restoreExistingDevelopmentMarkers(normalizedInput, existingDevelopmentMarkerIndexes);
    const beautyInput = restoreTypographicDevelopmentMarkers(inputWithKnownMarkers);
    const beautyText = cleanTypographyForBeauty(beautyInput);

    if (options.mode !== "development") {
      return {
        text: beautyText,
        developmentMarkerIndexes: [],
      };
    }

    return createDevelopmentTypographyResult(beautyText);
  } catch (error) {
    console.error("[Чистовик] Failed to clean text with metadata", error);
    throw error;
  }
}

function restoreTypographicDevelopmentMarkers(input: string): string {
  try {
    if (!input.includes(DEVELOPMENT_NBSP_MARKER)) {
      return input;
    }

    const chars = input.split("");

    for (let index = 0; index < chars.length; index += 1) {
      if (chars[index] === DEVELOPMENT_NBSP_MARKER && isTypographicDevelopmentMarker(input, index)) {
        chars[index] = " ";
      }
    }

    return chars.join("");
  } catch (error) {
    console.error("[Чистовик] Failed to restore typographic development markers", error);
    throw error;
  }
}

function isTypographicDevelopmentMarker(input: string, index: number): boolean {
  try {
    const candidate = `${input.slice(0, index)} ${input.slice(index + 1)}`;
    const beautyText = cleanTypographyForBeauty(candidate);

    return beautyText[index] === NBSP;
  } catch (error) {
    console.error("[Чистовик] Failed to check typographic development marker", error);
    throw error;
  }
}

function createDevelopmentTypographyResult(beautyText: string): TypographyCleanResult {
  try {
    let text = "";
    const developmentMarkerIndexes: number[] = [];

    for (let index = 0; index < beautyText.length; index += 1) {
      if (beautyText[index] === NBSP) {
        developmentMarkerIndexes.push(index);
        text += DEVELOPMENT_NBSP_MARKER;
      } else {
        text += beautyText[index];
      }
    }

    return { text, developmentMarkerIndexes };
  } catch (error) {
    console.error("[Чистовик] Failed to create development typography result", error);
    throw error;
  }
}

function cleanTypographyForBeauty(input: string): string {
  try {
    let text = input;

    text = cleanupSpaces(text);
    text = cleanupQuotesAndPunctuation(text);
    text = normalizeMathAndSymbols(text);
    text = cleanupDashesAndHyphens(text);
    text = formatPhoneNumbers(text);
    text = formatNumbersAndMoney(text);
    text = normalizeAbbreviations(text);
    text = applyNonBreakingSpaces(text);
    text = normalizeMathAndSymbols(text);
    text = normalizeSpacedYears(text);

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to clean text for beauty mode", error);
    throw error;
  }
}

function restoreExistingDevelopmentMarkers(input: string, markerIndexes: number[]): string {
  try {
    if (markerIndexes.length === 0) {
      return input;
    }

    const chars = input.split("");

    for (const index of markerIndexes) {
      if (chars[index] === DEVELOPMENT_NBSP_MARKER) {
        chars[index] = " ";
      }
    }

    return chars.join("");
  } catch (error) {
    console.error("[Чистовик] Failed to restore existing development markers", error);
    throw error;
  }
}

function normalizeInputNonBreakingSpaces(input: string): string {
  try {
    return input.replace(/\u00A0/g, " ");
  } catch (error) {
    console.error("[Чистовик] Failed to normalize input non-breaking spaces", error);
    throw error;
  }
}

function cleanupSpaces(input: string): string {
  try {
    return input
      .split("\n")
      .map((line) => line.replace(/^[ \t\u00A0]+|[ \t\u00A0]+$/g, ""))
      .join("\n")
      .replace(/[ \t\u00A0]{2,}/g, " ")
      .replace(/[ \t\u00A0]+([.…:;,?!»)\]])/g, "$1")
      .replace(/([«(\[])[ \t\u00A0]+/g, "$1")
      .replace(/(\d)[ \t\u00A0]+%/g, "$1%")
      .replace(/~[ \t\u00A0]+(?=[A-Za-zА-Яа-яЁё\d])/g, "~");
  } catch (error) {
    console.error("[Чистовик] Failed to clean spaces", error);
    throw error;
  }
}

function cleanupQuotesAndPunctuation(input: string): string {
  try {
    const text = input
      .replace(/\.{3}/g, "…")
      .replace(/!{2,}/g, "!")
      .replace(/\?{2,}/g, "?")
      .replace(/!\?/g, "?!");

    return formatQuotes(text)
      .replace(/([»“"'])([?!])/g, "$2$1")
      .replace(/([.,;:…])([»“"'])/g, "$2$1")
      .replace(/([?!](?:[»“"']+))\./g, "$1")
      .replace(/[ \t\u00A0]+([.,;:?!…])/g, "$1");
  } catch (error) {
    console.error("[Чистовик] Failed to clean quotes and punctuation", error);
    throw error;
  }
}

function formatQuotes(input: string): string {
  try {
    const stack: QuoteState[] = [];
    let result = "";

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];

      if (!isQuoteChar(char) || isApostropheInsideWord(input, index)) {
        result += char;
        continue;
      }

      const opening = getQuoteRole(input, index, stack) === "opening";

      if (opening) {
        const script = stack.length === 0 ? detectTopLevelQuoteScript(input, index) : stack[stack.length - 1].script;
        const level = stack.length;
        stack.push({ script, level });
        result += getOpeningQuote(script, level);
      } else {
        const state = stack.pop() ?? {
          script: detectTopLevelQuoteScript(input, index),
          level: 0,
        };
        result += getClosingQuote(state.script, state.level);
      }
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to format quotes", error);
    throw error;
  }
}

function isQuoteChar(char: string): boolean {
  try {
    return char === '"' || char === "'" || char === "«" || char === "»" || char === "„" || char === "“" || char === "”" || char === "‘" || char === "’";
  } catch (error) {
    console.error("[Чистовик] Failed to check quote char", error);
    throw error;
  }
}

function isApostropheInsideWord(input: string, index: number): boolean {
  try {
    const char = input[index];

    if (char !== "'" && char !== "’") {
      return false;
    }

    return isLetter(input[index - 1] ?? "") && isLetter(input[index + 1] ?? "");
  } catch (error) {
    console.error("[Чистовик] Failed to check apostrophe context", error);
    throw error;
  }
}

function getQuoteRole(input: string, index: number, stack: QuoteState[]): "opening" | "closing" {
  try {
    const prev = input[index - 1] ?? "";
    const next = nextVisibleChar(input, index);

    if (!next) {
      return "closing";
    }

    if (stack.length > 0 && isQuoteClosingContext(input, index)) {
      return "closing";
    }

    if (isQuoteOpeningContext(prev)) {
      return "opening";
    }

    if (isQuoteClosingContext(input, index)) {
      return "closing";
    }

    return "opening";
  } catch (error) {
    console.error("[Чистовик] Failed to detect quote role", error);
    throw error;
  }
}

function isQuoteOpeningContext(previous: string): boolean {
  try {
    return previous === "" || /[ \t\u00A0\n\r*([{<«„“‘"'—–-]/.test(previous);
  } catch (error) {
    console.error("[Чистовик] Failed to check quote opening context", error);
    throw error;
  }
}

function isQuoteClosingContext(input: string, index: number): boolean {
  try {
    const previous = previousVisibleChar(input, index);
    const next = input[index + 1] ?? "";

    if (previous === null) {
      return false;
    }

    return next === "" || /[ \t\u00A0\n\r*.,;:?!…)\]}»“"']/.test(next);
  } catch (error) {
    console.error("[Чистовик] Failed to check quote closing context", error);
    throw error;
  }
}

function detectTopLevelQuoteScript(input: string, index: number): QuoteScript {
  try {
    const line = getLineAtIndex(input, index);
    const textOutsideQuotes = getTextOutsideQuotesForScriptDetection(line);
    const outsideScript = detectDominantQuoteScript(textOutsideQuotes);

    if (outsideScript !== null) {
      return outsideScript;
    }

    return detectDominantQuoteScript(line) ?? "latin";
  } catch (error) {
    console.error("[Чистовик] Failed to detect top-level quote script", error);
    throw error;
  }
}

function getLineAtIndex(input: string, index: number): string {
  try {
    const lineStart = input.lastIndexOf("\n", index - 1) + 1;
    const nextLineBreak = input.indexOf("\n", index);
    const lineEnd = nextLineBreak === -1 ? input.length : nextLineBreak;

    return input.slice(lineStart, lineEnd);
  } catch (error) {
    console.error("[Чистовик] Failed to get line at index", error);
    throw error;
  }
}

function detectDominantQuoteScript(input: string): QuoteScript | null {
  try {
    const latinCount = countMatches(input, /[A-Za-z]/g);
    const cyrillicCount = countMatches(input, /[А-Яа-яЁё]/g);

    if (latinCount === 0 && cyrillicCount === 0) {
      return null;
    }

    return latinCount > cyrillicCount ? "latin" : "cyrillic";
  } catch (error) {
    console.error("[Чистовик] Failed to detect dominant quote script", error);
    throw error;
  }
}

function getTextOutsideQuotesForScriptDetection(input: string): string {
  try {
    const stack: QuoteState[] = [];
    let result = "";

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];

      if (!isQuoteChar(char) || isApostropheInsideWord(input, index)) {
        if (stack.length === 0) {
          result += char;
        }

        continue;
      }

      const opening = getQuoteRole(input, index, stack) === "opening";

      if (opening) {
        stack.push({ script: "latin", level: stack.length });
      } else {
        stack.pop();
      }
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to get text outside quotes for script detection", error);
    throw error;
  }
}

function getTextOutsideQuotes(input: string): string {
  try {
    const stack: QuoteState[] = [];
    let result = "";

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];

      if (!isQuoteChar(char) || isApostropheInsideWord(input, index)) {
        if (stack.length === 0) {
          result += char;
        }

        continue;
      }

      const opening = getQuoteRole(input, index, stack) === "opening";

      if (opening) {
        stack.push({ script: "cyrillic", level: stack.length });
      } else {
        stack.pop();
      }
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to get text outside quotes", error);
    throw error;
  }
}

function getOpeningQuote(script: QuoteScript, level: number): string {
  try {
    if (script === "latin") {
      return level % 2 === 0 ? '"' : "'";
    }

    return level % 2 === 0 ? "«" : "„";
  } catch (error) {
    console.error("[Чистовик] Failed to get opening quote", error);
    throw error;
  }
}

function getClosingQuote(script: QuoteScript, level: number): string {
  try {
    if (script === "latin") {
      return level % 2 === 0 ? '"' : "'";
    }

    return level % 2 === 0 ? "»" : "“";
  } catch (error) {
    console.error("[Чистовик] Failed to get closing quote", error);
    throw error;
  }
}

function cleanupDashesAndHyphens(input: string): string {
  try {
    return input
      .replace(/^([ \t\u00A0]*)([-–])(?=[ \t\u00A0])/gm, `$1${EM_DASH}`)
      .replace(/([^ \t\u00A0\n\r\d])[ \t\u00A0]+[-–][ \t\u00A0]+([A-Za-zА-Яа-яЁё])/g, `$1 ${EM_DASH} $2`)
      .replace(/([A-Za-zА-Яа-яЁё])[ \t\u00A0]+[-–][ \t\u00A0]+([A-Za-zА-Яа-яЁё])/g, `$1 ${EM_DASH} $2`)
      .replace(/(^|[^\d])(\d+(?:[.,]\d+)?)[ \t\u00A0]*[-–—][ \t\u00A0]*(\d+(?:[.,]\d+)?)(?=$|[^\d])/g, (match: string, prefix: string, startNumber: string, endNumber: string, offset: number, fullText: string) => {
        try {
          const rangeStart = offset + prefix.length;
          const rangeEnd = rangeStart + match.length - prefix.length;

          if (isProtectedNumericRange(fullText, rangeStart, rangeEnd)) {
            return match;
          }

          return `${prefix}${startNumber}${EN_DASH}${endNumber}`;
        } catch (error) {
          console.error("[Чистовик] Failed to normalize numeric range", error);
          return match;
        }
      })
      .replace(/(^|[^A-Za-zА-Яа-яЁё])([IVXLCDM]+)[ \t\u00A0]*[-–—][ \t\u00A0]*([IVXLCDM]+)(?=$|[^A-Za-zА-Яа-яЁё\d])/g, (match: string, prefix: string, startRoman: string, endRoman: string, offset: number, fullText: string) => {
        try {
          const rangeStart = offset + prefix.length;
          const rangeEnd = rangeStart + match.length - prefix.length;

          if (isProtectedRomanRange(fullText, rangeStart, rangeEnd) || !hasRomanRangeContext(fullText, rangeStart, rangeEnd)) {
            return match;
          }

          return `${prefix}${startRoman}${EN_DASH}${endRoman}`;
        } catch (error) {
          console.error("[Чистовик] Failed to normalize roman numeral range", error);
          return match;
        }
      })
      .replace(/([A-Za-zА-Яа-яЁё])-([A-Za-zА-Яа-яЁё])/g, `$1${NB_HYPHEN}$2`);
  } catch (error) {
    console.error("[Чистовик] Failed to clean dashes and hyphens", error);
    throw error;
  }
}

function isProtectedNumericRange(fullText: string, start: number, end: number): boolean {
  try {
    if (isInsideProtectedToken(fullText, start, end)) {
      return true;
    }

    return isCodeTokenNeighbor(fullText[start - 1] ?? "") || isCodeTokenNeighbor(fullText[end] ?? "");
  } catch (error) {
    console.error("[Чистовик] Failed to check protected numeric range", error);
    throw error;
  }
}

function isProtectedRomanRange(fullText: string, start: number, end: number): boolean {
  try {
    if (isInsidePhoneNumberCandidate(fullText, start, end)) {
      return true;
    }

    const bounds = getLooseTokenBounds(fullText, start, end);
    const token = fullText.slice(bounds.start, bounds.end);

    if (/^[A-Za-z][A-Za-z\d+.-]*:\/\//.test(token) || /^www\./i.test(token) || token.includes("@") || token.includes("_")) {
      return true;
    }

    if (/\d/.test(token) || hasProtectedRomanRangeTokenLetters(token)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("[Чистовик] Failed to check protected roman range", error);
    throw error;
  }
}

function hasRomanRangeContext(fullText: string, start: number, end: number): boolean {
  try {
    return hasRomanRangeContextBefore(fullText, start) || hasRomanRangeContextAfter(fullText, end);
  } catch (error) {
    console.error("[Чистовик] Failed to check roman range context", error);
    throw error;
  }
}

function hasRomanRangeContextBefore(fullText: string, start: number): boolean {
  try {
    const before = fullText.slice(0, start).toLowerCase();
    const match = /(^|[^А-Яа-яЁё])(век|века|веках|веков|глава|главы|глав|часть|части|частей|раздел|разделы|разделов|пункт|пункты|пунктов|квартал|кварталы|кварталов|кв\.|том|тома|томов|параграф|параграфы|параграфов)[ \t\u00A0]*$/.exec(before);

    return match !== null;
  } catch (error) {
    console.error("[Чистовик] Failed to check roman range context before", error);
    throw error;
  }
}

function hasRomanRangeContextAfter(fullText: string, end: number): boolean {
  try {
    const after = fullText.slice(end).toLowerCase();
    const match = /^[ \t\u00A0]*(век|века|веках|веков|глава|главы|глав|часть|части|частей|раздел|разделы|разделов|пункт|пункты|пунктов|квартал|кварталы|кварталов|кв\.|том|тома|томов|параграф|параграфы|параграфов)(?=$|[^А-Яа-яЁё])/.exec(after);

    return match !== null;
  } catch (error) {
    console.error("[Чистовик] Failed to check roman range context after", error);
    throw error;
  }
}

function hasProtectedRomanRangeTokenLetters(token: string): boolean {
  try {
    for (const char of token) {
      if (isLetter(char) && !/[IVXLCDM]/.test(char)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[Чистовик] Failed to check protected roman range token letters", error);
    throw error;
  }
}

function formatPhoneNumbers(input: string): string {
  try {
    const phoneCandidate = /(^|[^\d])(\+?[78](?:[ \t\u00A0().\-–—‑]*\d){10})(?![ \t\u00A0().\-–—‑]*\d)(?![ \t\u00A0]*[₽$€])/g;

    return input.replace(phoneCandidate, (match, prefix: string, candidate: string, offset: number, fullText: string) => {
      try {
        const candidateStart = offset + prefix.length;

        if (previousNonSpace(fullText, candidateStart) === "№") {
          return match;
        }

        const candidateEnd = candidateStart + candidate.length;
        const next = nextNonSpace(fullText, candidateEnd);

        if (next === "₽" || next === "$" || next === "€") {
          return match;
        }

        const digits = candidate.replace(/\D/g, "");

        if (digits.length !== 11 || (digits[0] !== "7" && digits[0] !== "8")) {
          return match;
        }

        const country = digits[0] === "8" ? "8" : "+7";
        const operator = digits.slice(1, 4);
        const first = digits.slice(4, 7);
        const second = digits.slice(7, 9);
        const third = digits.slice(9, 11);

        return `${prefix}${country}${NBSP}${operator}${NBSP}${first}${NB_HYPHEN}${second}${NB_HYPHEN}${third}`;
      } catch (error) {
        console.error("[Чистовик] Failed to format phone candidate", error);
        return match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to format phone numbers", error);
    throw error;
  }
}

function formatNumbersAndMoney(input: string): string {
  try {
    let text = normalizeWesternGroupedNumbers(input);

    text = text.replace(/\b(\d+)\.(\d+)\b/g, (match, integerPart: string, decimalPart: string, offset: number, fullText: string) => {
      try {
        if (isProtectedDottedNumber(fullText, offset, offset + match.length)) {
          return match;
        }

        return `${integerPart},${decimalPart}`;
      } catch (error) {
        console.error("[Чистовик] Failed to format decimal number", error);
        return match;
      }
    });

    text = text.replace(/\b\d{4,}(?:,\d+)?\b/g, (match: string, offset: number, fullText: string) => {
      try {
        const [integerPart, decimalPart] = match.split(",");

        if (isNumberPartOfDate(fullText, offset, offset + integerPart.length) || shouldSkipNumberGrouping(fullText, offset, offset + integerPart.length, integerPart)) {
          return match;
        }

        return `${groupLongNumber(integerPart)}${decimalPart === undefined ? "" : `,${decimalPart}`}`;
      } catch (error) {
        console.error("[Чистовик] Failed to group number", error);
        return match;
      }
    });

    text = normalizeGroupedNumberSpaces(text);
    text = text.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?)[ \t\u00A0]*(₽|\$|€|км|кг|м)(?=$|[^A-Za-zА-Яа-яЁё])/g, `$1${NBSP}$2`);
    text = normalizeSpacedYears(text);

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to format numbers and money", error);
    throw error;
  }
}

function normalizeWesternGroupedNumbers(input: string): string {
  try {
    return input.replace(/(^|[^\d])(\d{1,3}(?:,\d{3})+(?:\.\d+)?)(?=$|[^\d])/g, (match, prefix: string, candidate: string, offset: number, fullText: string) => {
      try {
        const candidateStart = offset + prefix.length;
        const [integerPart, decimalPart] = candidate.split(".");
        const compactInteger = integerPart.replace(/,/g, "");

        if (shouldSkipNumberGrouping(fullText, candidateStart, candidateStart + integerPart.length, compactInteger)) {
          return match;
        }

        return `${prefix}${integerPart.replace(/,/g, NBSP)}${decimalPart === undefined ? "" : `,${decimalPart}`}`;
      } catch (error) {
        console.error("[Чистовик] Failed to normalize western grouped number candidate", error);
        return match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to normalize western grouped numbers", error);
    throw error;
  }
}

function normalizeGroupedNumberSpaces(input: string): string {
  try {
    return input.replace(/\b\d{1,3}(?:[ \t\u00A0]\d{3})+(?:,\d+)?\b/g, (match: string, offset: number, fullText: string) => {
      try {
        const compactInteger = match.split(",")[0].replace(/[ \t\u00A0]/g, "");

        if (shouldSkipNumberGrouping(fullText, offset, offset + match.length, compactInteger)) {
          return match;
        }

        return match.replace(/[ \t\u00A0](?=\d{3}(?:[ \t\u00A0,]|$))/g, NBSP);
      } catch (error) {
        console.error("[Чистовик] Failed to normalize grouped number candidate", error);
        return match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to normalize grouped number spaces", error);
    throw error;
  }
}

function isProtectedDottedNumber(fullText: string, start: number, end: number): boolean {
  try {
    if (isNumberPartOfCodeToken(fullText, start, end) || isNumberPartOfDate(fullText, start, end)) {
      return true;
    }

    let tokenStart = start;
    let tokenEnd = end;

    while (tokenStart > 0 && /[A-Za-zА-Яа-яЁё\d.]/.test(fullText[tokenStart - 1])) {
      tokenStart -= 1;
    }

    while (tokenEnd < fullText.length && /[A-Za-zА-Яа-яЁё\d.]/.test(fullText[tokenEnd])) {
      tokenEnd += 1;
    }

    const token = fullText.slice(tokenStart, tokenEnd);
    const dotCount = countMatches(token, /\./g);

    return dotCount > 1 || /[A-Za-zА-Яа-яЁё]/.test(token);
  } catch (error) {
    console.error("[Чистовик] Failed to check dotted number exception", error);
    throw error;
  }
}

function isNumberPartOfDate(fullText: string, start: number, end: number): boolean {
  try {
    const bounds = getDottedNumberTokenBounds(fullText, start, end);

    if (bounds === null) {
      return false;
    }

    const token = fullText.slice(bounds.start, bounds.end);

    if (isShortDateToken(token) && isFollowedByDecimalUnitOrCurrency(fullText, bounds.end)) {
      return false;
    }

    return isDateToken(token);
  } catch (error) {
    console.error("[Чистовик] Failed to check date token", error);
    throw error;
  }
}

function getDottedNumberTokenBounds(fullText: string, start: number, end: number): { start: number; end: number } | null {
  try {
    let tokenStart = start;
    let tokenEnd = end;

    while (tokenStart > 0 && /[\d.]/.test(fullText[tokenStart - 1])) {
      tokenStart -= 1;
    }

    while (tokenEnd < fullText.length && /[\d.]/.test(fullText[tokenEnd])) {
      tokenEnd += 1;
    }

    if (tokenStart > 0 && /[A-Za-zА-Яа-яЁё\d.]/.test(fullText[tokenStart - 1])) {
      return null;
    }

    if (tokenEnd < fullText.length && /[A-Za-zА-Яа-яЁё\d.]/.test(fullText[tokenEnd])) {
      return null;
    }

    return { start: tokenStart, end: tokenEnd };
  } catch (error) {
    console.error("[Чистовик] Failed to get dotted number token bounds", error);
    throw error;
  }
}

function isDateToken(token: string): boolean {
  try {
    const match = /^(\d{1,2})\.(\d{2})(?:\.(\d{4}))?$/.exec(token);

    if (match === null) {
      return false;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = match[3] === undefined ? null : Number(match[3]);

    return day >= 1 && day <= 31 && month >= 1 && month <= 12 && (year === null || (year >= 1000 && year <= 2999));
  } catch (error) {
    console.error("[Чистовик] Failed to check date token format", error);
    throw error;
  }
}

function isShortDateToken(token: string): boolean {
  try {
    return /^\d{1,2}\.\d{2}$/.test(token) && isDateToken(token);
  } catch (error) {
    console.error("[Чистовик] Failed to check short date token", error);
    throw error;
  }
}

function isFollowedByDecimalUnitOrCurrency(fullText: string, index: number): boolean {
  try {
    const after = fullText.slice(index);
    const match = /^[ \t\u00A0]*(₽|\$|€|%|руб\.?|коп\.?|тыс\.?|млн|млрд|трлн|км|кг|мм|см|мл|м|г\.?|л|шт\.?|сек\.?|мин\.?|мес\.?|с|кв\.?|куб\.?)(?=$|[^A-Za-zА-Яа-яЁё])/i.exec(after);

    return match !== null;
  } catch (error) {
    console.error("[Чистовик] Failed to check decimal unit or currency", error);
    throw error;
  }
}

function normalizeSpacedYears(input: string): string {
  try {
    return input
      .replace(/(\b\d{1,2}\.\d{2}\.)([12])[ \t\u00A0](\d{3})\b/g, "$1$2$3")
      .replace(/(^|[^\d])([12])[ \t\u00A0](\d{3})(?=[ \t\u00A0]*(?:г\.?|год|году)(?=$|[^A-Za-zА-Яа-яЁё]))/gi, "$1$2$3")
      .replace(/(©[ \t\u00A0]*)([12])[ \t\u00A0](\d{3})\b/g, "$1$2$3");
  } catch (error) {
    console.error("[Чистовик] Failed to normalize spaced years", error);
    throw error;
  }
}

function shouldSkipNumberGrouping(fullText: string, start: number, end: number, integerPart: string): boolean {
  try {
    if (isNumberPartOfCodeToken(fullText, start, end) || isNumberInsideFullDate(fullText, start, end)) {
      return true;
    }

    const previous = previousNonSpace(fullText, start);

    if (previous === "№" || previous === "§") {
      return true;
    }

    if (!/^\d{4}$/.test(integerPart)) {
      return false;
    }

    const year = Number(integerPart);

    if (year < 1000 || year > 2099) {
      return false;
    }

    const before = fullText.slice(Math.max(0, start - 16), start).toLowerCase();
    const after = fullText.slice(end, Math.min(fullText.length, end + 16)).toLowerCase();

    return /(?:^|[\s\u00A0])(в|с|по)[\s\u00A0]*$/.test(before) || /(?:©|\(c\))[\s\u00A0]*$/i.test(before) || /^[\s\u00A0]*(г\.?|год|году)(?=$|[^A-Za-zА-Яа-яЁё])/.test(after);
  } catch (error) {
    console.error("[Чистовик] Failed to check number grouping exception", error);
    throw error;
  }
}

function isNumberInsideFullDate(fullText: string, start: number, end: number): boolean {
  try {
    const before = fullText.slice(Math.max(0, start - 6), start);

    return /\d{1,2}\.\d{2}\.$/.test(before);
  } catch (error) {
    console.error("[Чистовик] Failed to check full date number", error);
    throw error;
  }
}

function isNumberPartOfCodeToken(fullText: string, start: number, end: number): boolean {
  try {
    return isCodeTokenNeighbor(fullText[start - 1] ?? "") || isCodeTokenNeighbor(fullText[end] ?? "");
  } catch (error) {
    console.error("[Чистовик] Failed to check code token number", error);
    throw error;
  }
}

function isCodeTokenNeighbor(char: string): boolean {
  try {
    return /^[A-Za-zА-Яа-яЁё]$/.test(char) || char === "-" || char === EN_DASH || char === EM_DASH || char === NB_HYPHEN;
  } catch (error) {
    console.error("[Чистовик] Failed to check code token neighbor", error);
    throw error;
  }
}

function groupLongNumber(value: string): string {
  try {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  } catch (error) {
    console.error("[Чистовик] Failed to group long number", error);
    throw error;
  }
}

function normalizeAbbreviations(input: string): string {
  try {
    let text = input;

    text = text.replace(/([₽$€])[ \t\u00A0]*\/[ \t\u00A0]*мес\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match: string, currency: string, offset: number, fullText: string) => {
      try {
        const periodIndex = match.lastIndexOf(".");

        if (periodIndex !== -1 && isSentenceEndingPeriod(fullText, offset + periodIndex)) {
          return `${currency}/мес.`;
        }

        return `${currency}/мес`;
      } catch (error) {
        console.error("[Чистовик] Failed to normalize currency per month", error);
        return match;
      }
    });
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])и[ \t\u00A0]+т[ \t\u00A0]*\.?[ \t\u00A0]*д\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1и${NBSP}т.${NBSP}д.`);
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])и[ \t\u00A0]+т[ \t\u00A0]*\.?[ \t\u00A0]*п\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1и${NBSP}т.${NBSP}п.`);
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])и[ \t\u00A0]+др\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1и${NBSP}др.`);
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])т[ \t\u00A0]*\.?[ \t\u00A0]*е\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1т.${NBSP}е.`);
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])т[ \t\u00A0]*\.?[ \t\u00A0]*к\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1т.${NBSP}к.`);
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])т[ \t\u00A0]*\.?[ \t\u00A0]*д\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1т.${NBSP}д.`);
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])т[ \t\u00A0]*\.?[ \t\u00A0]*п\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1т.${NBSP}п.`);
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])кв\.?[ \t\u00A0]*м\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1кв.${NBSP}м`);
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])куб\.?[ \t\u00A0]*м\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1куб.${NBSP}м`);
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])(тыс|мин|д|кв|г|рис|стр|им|руб|коп)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, "$1$2.");
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])мес\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match: string, prefix: string, offset: number, fullText: string) => {
      try {
        const start = offset + prefix.length;
        const previous = previousNonSpace(fullText, start);
        const next = nextNonSpace(fullText, offset + match.length);
        const periodIndex = match.lastIndexOf(".");

        if (previous === "/" || previous === "₽" || previous === "$" || previous === "€" || next === "/") {
          if (periodIndex !== -1 && isSentenceEndingPeriod(fullText, offset + periodIndex)) {
            return `${prefix}мес.`;
          }

          return `${prefix}мес`;
        }

        return `${prefix}мес.`;
      } catch (error) {
        console.error("[Чистовик] Failed to normalize мес", error);
        return match;
      }
    });
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])(млн|млрд|трлн)\.(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match: string, prefix: string, abbreviation: string, offset: number, fullText: string) => {
      try {
        const periodIndex = offset + match.length - 1;

        if (isSentenceEndingPeriod(fullText, periodIndex)) {
          return `${prefix}${abbreviation}.`;
        }

        return `${prefix}${abbreviation}`;
      } catch (error) {
        console.error("[Чистовик] Failed to normalize large number abbreviation period", error);
        return match;
      }
    });
    text = text.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?[ \t\u00A0]+)(км|кг|м|с|мм|см|л|мл)\.(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match: string, numberWithSpace: string, unit: string, offset: number, fullText: string) => {
      try {
        const periodIndex = offset + match.length - 1;

        if (isSentenceEndingPeriod(fullText, periodIndex)) {
          return `${numberWithSpace}${unit}.`;
        }

        return `${numberWithSpace}${unit}`;
      } catch (error) {
        console.error("[Чистовик] Failed to normalize unit period", error);
        return match;
      }
    });

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to normalize abbreviations", error);
    throw error;
  }
}

function isSentenceEndingPeriod(fullText: string, periodIndex: number): boolean {
  try {
    const after = fullText.slice(periodIndex + 1);

    return after.length === 0 || /^[ \t\u00A0]*$/.test(after) || /^[ \t\u00A0]+[A-ZА-ЯЁ]/.test(after);
  } catch (error) {
    console.error("[Чистовик] Failed to check sentence-ending period", error);
    throw error;
  }
}

function applyNonBreakingSpaces(input: string): string {
  try {
    let text = input;

    text = text.replace(/[ \t\u00A0]+—/g, `${NBSP}${EM_DASH}`);
    text = applyShortWordNonBreakingSpaces(text);
    text = text.replace(/(^|[^А-ЯЁа-яё])([А-ЯЁ])\.[ \t\u00A0]*([А-ЯЁ])\.[ \t\u00A0]*(?=[А-ЯЁ][а-яё]+)/g, `$1$2.${NBSP}$3.${NBSP}`);
    text = text.replace(/(^|[^А-ЯЁа-яё])([А-ЯЁ])\.[ \t\u00A0]*(?=[А-ЯЁ][а-яё]+)/g, `$1$2.${NBSP}`);
    text = text.replace(/([№§])[ \t\u00A0]*(?=\d)/g, `$1${NBSP}`);
    text = text.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?)[ \t]+(?=[A-Za-zА-Яа-яЁё])/g, (match: string, number: string, offset: number, fullText: string) => {
      try {
        if (isNumberPartOfDate(fullText, offset, offset + number.length)) {
          return match;
        }

        return `${number}${NBSP}`;
      } catch (error) {
        console.error("[Чистовик] Failed to apply number non-breaking space", error);
        return match;
      }
    });
    text = restoreSpacesAfterMeasurementUnits(text);

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to apply non-breaking spaces", error);
    throw error;
  }
}

function applyShortWordNonBreakingSpaces(input: string): string {
  try {
    const shortWordPattern = new RegExp(`(^|[^${LETTERS}\\d\\-${NB_HYPHEN}])([А-Яа-яЁё]{1,2})[ \\t]+(?=\\S)`, "g");
    let text = input;
    let previous = "";

    while (text !== previous) {
      previous = text;
      shortWordPattern.lastIndex = 0;
      text = text.replace(shortWordPattern, `$1$2${NBSP}`);
    }

    return restoreSpacesAfterMeasurementUnits(text);
  } catch (error) {
    console.error("[Чистовик] Failed to apply short word non-breaking spaces", error);
    throw error;
  }
}

function restoreSpacesAfterMeasurementUnits(input: string): string {
  try {
    return input.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?\u00A0(?:г|кг|м|км|мм|см|л|мл|с))\u00A0(?=[A-Za-zА-Яа-яЁё])/gi, "$1 ");
  } catch (error) {
    console.error("[Чистовик] Failed to restore spaces after measurement units", error);
    throw error;
  }
}

function normalizeMathAndSymbols(input: string): string {
  try {
    const text = input
      .replace(/(^|[^A-Za-zА-Яа-яЁё\d])1\/2($|[^A-Za-zА-Яа-яЁё\d])/g, "$1½$2")
      .replace(/(^|[^A-Za-zА-Яа-яЁё\d])1\/4($|[^A-Za-zА-Яа-яЁё\d])/g, "$1¼$2")
      .replace(/(^|[^A-Za-zА-Яа-яЁё\d])3\/4($|[^A-Za-zА-Яа-яЁё\d])/g, "$1¾$2");

    return normalizeMathExpressions(text)
      .replace(/(^|[^A-Za-zА-Яа-яЁё\d])([-–−])[ \t\u00A0]*(\d)/g, (match: string, prefix: string, _sign: string, digit: string, offset: number, fullText: string) => {
        try {
          const signIndex = offset + prefix.length;
          const previous = previousNonSpace(fullText, signIndex);

          if (previous !== null && /\d/.test(previous)) {
            return match;
          }

          return `${prefix}${MINUS}${digit}`;
        } catch (error) {
          console.error("[Чистовик] Failed to normalize negative number", error);
          return match;
        }
      })
      .replace(/(\d(?:[\d \u00A0]*\d)?)[ \t\u00A0]*°?[ \t\u00A0]*([CFС])\b/g, (_match, number: string, unit: string) => `${number}${NBSP}°${unit === "F" ? "F" : "C"}`)
      .replace(/\(c\)/gi, "©")
      .replace(/\(tm\)/gi, "™")
      .replace(/\(r\)/gi, "®")
      .replace(/->/g, "→");
  } catch (error) {
    console.error("[Чистовик] Failed to normalize math and symbols", error);
    throw error;
  }
}

function normalizeMathExpressions(input: string): string {
  try {
    let result = "";
    let index = 0;

    while (index < input.length) {
      const expression = parseMathExpression(input, index);

      if (expression === null) {
        result += input[index];
        index += 1;
        continue;
      }

      result += expression.text;
      index = expression.end;
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to normalize math expressions", error);
    throw error;
  }
}

function parseMathExpression(input: string, start: number): MathExpressionParseResult | null {
  try {
    const firstNumber = parseMathNumber(input, start, true);

    if (firstNumber === null || !hasMathNumberBoundaryBefore(input, start) || isInsideProtectedToken(input, start, firstNumber.end)) {
      return null;
    }

    const parts = [firstNumber.text];
    const operators: MathOperatorParseResult[] = [];
    let cursor = firstNumber.end;

    while (cursor < input.length) {
      const operator = parseMathOperator(input, cursor);

      if (operator === null) {
        break;
      }

      const nextNumber = parseMathNumber(input, operator.end, true);

      if (nextNumber === null) {
        break;
      }

      parts.push(`${NBSP}${operator.text}${NBSP}`, nextNumber.text);
      operators.push(operator);
      cursor = nextNumber.end;
    }

    if (operators.length === 0 || !hasMathNumberBoundaryAfter(input, cursor) || isInsideProtectedToken(input, start, cursor)) {
      return null;
    }

    if (!hasMathExpressionContext(firstNumber, operators)) {
      return null;
    }

    return {
      end: cursor,
      text: parts.join(""),
    };
  } catch (error) {
    console.error("[Чистовик] Failed to parse math expression", error);
    throw error;
  }
}

function parseMathNumber(input: string, start: number, allowSign: boolean): MathNumberParseResult | null {
  try {
    let cursor = start;
    let sign = "";

    if (allowSign && isMinusLike(input[cursor] ?? "")) {
      sign = MINUS;
      cursor += 1;

      while (/[ \t\u00A0]/.test(input[cursor] ?? "")) {
        cursor += 1;
      }
    }

    const numberStart = cursor;

    if (!/\d/.test(input[cursor] ?? "")) {
      return null;
    }

    cursor += 1;

    while (cursor < input.length) {
      const char = input[cursor];
      const next = input[cursor + 1] ?? "";

      if (/\d/.test(char) || (char === "," && /\d/.test(next))) {
        cursor += 1;
        continue;
      }

      if ((char === " " || char === NBSP) && /\d/.test(next)) {
        cursor += 1;
        continue;
      }

      break;
    }

    return {
      end: cursor,
      hasUnaryMinus: sign !== "",
      text: `${sign}${input.slice(numberStart, cursor).replace(/ /g, NBSP)}`,
    };
  } catch (error) {
    console.error("[Чистовик] Failed to parse math number", error);
    throw error;
  }
}

function parseMathOperator(input: string, start: number): MathOperatorParseResult | null {
  try {
    let cursor = start;

    while (/[ \t\u00A0]/.test(input[cursor] ?? "")) {
      cursor += 1;
    }

    const char = input[cursor] ?? "";

    if (!isMathOperatorChar(char)) {
      return null;
    }

    if (char === "-" && input[cursor + 1] === ">") {
      return null;
    }

    cursor += 1;

    while (/[ \t\u00A0]/.test(input[cursor] ?? "")) {
      cursor += 1;
    }

    return {
      end: cursor,
      text: normalizeMathOperator(char),
    };
  } catch (error) {
    console.error("[Чистовик] Failed to parse math operator", error);
    throw error;
  }
}

function isMathOperatorChar(char: string): boolean {
  try {
    return char === "+" || char === "=" || char === "/" || char === "÷" || char === "*" || char === "×" || char === "x" || char === "X" || char === "х" || char === "Х" || isMinusLike(char);
  } catch (error) {
    console.error("[Чистовик] Failed to check math operator char", error);
    throw error;
  }
}

function normalizeMathOperator(char: string): string {
  try {
    if (char === "*" || char === "x" || char === "X" || char === "х" || char === "Х") {
      return "×";
    }

    if (isMinusLike(char)) {
      return MINUS;
    }

    return char;
  } catch (error) {
    console.error("[Чистовик] Failed to normalize math operator", error);
    throw error;
  }
}

function isMinusLike(char: string): boolean {
  try {
    return char === "-" || char === EN_DASH || char === EM_DASH || char === MINUS;
  } catch (error) {
    console.error("[Чистовик] Failed to check minus-like char", error);
    throw error;
  }
}

function hasMathExpressionContext(firstNumber: MathNumberParseResult, operators: MathOperatorParseResult[]): boolean {
  try {
    if (firstNumber.hasUnaryMinus || operators.length > 1) {
      return true;
    }

    return operators.some((operator) => operator.text !== MINUS);
  } catch (error) {
    console.error("[Чистовик] Failed to check math expression context", error);
    throw error;
  }
}

function hasMathNumberBoundaryBefore(input: string, start: number): boolean {
  try {
    const previous = input[start - 1] ?? "";

    return !/[A-Za-zА-Яа-яЁё\d.,]/.test(previous);
  } catch (error) {
    console.error("[Чистовик] Failed to check math number boundary before", error);
    throw error;
  }
}

function hasMathNumberBoundaryAfter(input: string, end: number): boolean {
  try {
    const next = input[end] ?? "";

    if (next === "." && !/\d/.test(input[end + 1] ?? "")) {
      return true;
    }

    return !/[A-Za-zА-Яа-яЁё\d.,]/.test(next);
  } catch (error) {
    console.error("[Чистовик] Failed to check math number boundary after", error);
    throw error;
  }
}

function isInsideProtectedToken(input: string, start: number, end: number): boolean {
  try {
    if (isInsidePhoneNumberCandidate(input, start, end)) {
      return true;
    }

    const bounds = getLooseTokenBounds(input, start, end);
    const token = input.slice(bounds.start, bounds.end);

    if (/^[A-Za-z][A-Za-z\d+.-]*:\/\//.test(token) || /^www\./i.test(token) || token.includes("@")) {
      return true;
    }

    if (/^\d{1,4}[-–—]\d{1,2}[-–—]\d{1,4}$/.test(token)) {
      return true;
    }

    if (token.includes("_") || hasProtectedTokenLetters(token)) {
      return true;
    }

    if (/^[A-Za-zА-Яа-яЁё]+[\w.-]*[-–—]\d/.test(token) || /\d[-–—][\w.-]*[A-Za-zА-Яа-яЁё]/.test(token)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("[Чистовик] Failed to check protected token", error);
    throw error;
  }
}

function hasProtectedTokenLetters(token: string): boolean {
  try {
    for (const char of token) {
      if (isLetter(char) && char !== "x" && char !== "X" && char !== "х" && char !== "Х") {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[Чистовик] Failed to check protected token letters", error);
    throw error;
  }
}

function isInsidePhoneNumberCandidate(input: string, start: number, end: number): boolean {
  try {
    const bounds = getPhoneLikeTokenBounds(input, start, end);
    const token = input.slice(bounds.start, bounds.end);
    const digits = token.replace(/\D/g, "");

    return digits.length === 11 && (digits[0] === "7" || digits[0] === "8");
  } catch (error) {
    console.error("[Чистовик] Failed to check phone number candidate", error);
    throw error;
  }
}

function getPhoneLikeTokenBounds(input: string, start: number, end: number): { start: number; end: number } {
  try {
    let tokenStart = start;
    let tokenEnd = end;

    while (tokenStart > 0 && /[\d+()[\] \t\u00A0.\-–—‑]/.test(input[tokenStart - 1])) {
      tokenStart -= 1;
    }

    while (tokenEnd < input.length && /[\d+()[\] \t\u00A0.\-–—‑]/.test(input[tokenEnd])) {
      tokenEnd += 1;
    }

    return { start: tokenStart, end: tokenEnd };
  } catch (error) {
    console.error("[Чистовик] Failed to get phone-like token bounds", error);
    throw error;
  }
}

function getLooseTokenBounds(input: string, start: number, end: number): { start: number; end: number } {
  try {
    let tokenStart = start;
    let tokenEnd = end;

    while (tokenStart > 0 && !/[ \t\u00A0\n\r()[\]{}<>«»"']/.test(input[tokenStart - 1])) {
      tokenStart -= 1;
    }

    while (tokenEnd < input.length && !/[ \t\u00A0\n\r()[\]{}<>«»"']/.test(input[tokenEnd])) {
      tokenEnd += 1;
    }

    return { start: tokenStart, end: tokenEnd };
  } catch (error) {
    console.error("[Чистовик] Failed to get loose token bounds", error);
    throw error;
  }
}

function previousVisibleChar(input: string, index: number): string | null {
  try {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (!/[ \t\u00A0]/.test(input[cursor])) {
        return input[cursor];
      }
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to find previous visible char", error);
    throw error;
  }
}

function nextVisibleChar(input: string, index: number): string | null {
  try {
    for (let cursor = index + 1; cursor < input.length; cursor += 1) {
      if (!/[ \t\u00A0]/.test(input[cursor])) {
        return input[cursor];
      }
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to find next visible char", error);
    throw error;
  }
}

function previousNonSpace(input: string, index: number): string | null {
  try {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (!/[ \t\u00A0]/.test(input[cursor])) {
        return input[cursor];
      }
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to find previous non-space char", error);
    throw error;
  }
}

function nextNonSpace(input: string, index: number): string | null {
  try {
    for (let cursor = index; cursor < input.length; cursor += 1) {
      if (!/[ \t\u00A0]/.test(input[cursor])) {
        return input[cursor];
      }
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to find next non-space char", error);
    throw error;
  }
}

function countMatches(input: string, regex: RegExp): number {
  try {
    return input.match(regex)?.length ?? 0;
  } catch (error) {
    console.error("[Чистовик] Failed to count regex matches", error);
    throw error;
  }
}

function isLetter(char: string): boolean {
  try {
    return /^[A-Za-zА-Яа-яЁё]$/.test(char);
  } catch (error) {
    console.error("[Чистовик] Failed to check letter", error);
    throw error;
  }
}

void run();
