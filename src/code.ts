const NBSP = "\u00A0";
const NB_HYPHEN = "\u2011";
const EN_DASH = "\u2013";
const EM_DASH = "\u2014";
const LETTERS = "A-Za-zА-Яа-яЁё";
const LETTER_OR_DIGIT = "A-Za-zА-Яа-яЁё\\d";
const STYLE_FIELDS: Array<"fontName" | "fontSize" | "fills" | "textCase" | "textDecoration" | "letterSpacing" | "lineHeight"> = [
  "fontName",
  "fontSize",
  "fills",
  "textCase",
  "textDecoration",
  "letterSpacing",
  "lineHeight",
];

type QuoteScript = "cyrillic" | "latin";

interface QuoteState {
  script: QuoteScript;
  level: number;
}

interface TextProcessResult {
  processed: number;
  changed: number;
  failed: number;
}

type StyleSegment = Pick<StyledTextSegment, "fontName" | "fontSize" | "fills" | "textCase" | "textDecoration" | "letterSpacing" | "lineHeight" | "characters" | "start" | "end">;

async function run(): Promise<void> {
  try {
    const textNodes = collectTargetTextNodes();
    const result = await processTextNodes(textNodes);

    if (result.failed > 0) {
      throw new Error(`Failed to process ${result.failed} text node(s)`);
    }

    if (result.changed > 0) {
      figma.notify("Теперь всё чисто 🔥🔥🔥", { timeout: 4000 });
    } else {
      figma.notify("Всё уже было чисто 👌", { timeout: 4000 });
    }
  } catch (error) {
    console.error("[Чистовик] Failed to clean typography", error);
    figma.notify("Ой, не получилось почистить 🛑", { error: true });
  } finally {
    figma.closePlugin();
  }
}

function collectTargetTextNodes(): TextNode[] {
  try {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      return figma.currentPage.findAll((node) => node.type === "TEXT") as TextNode[];
    }

    const nodes: TextNode[] = [];
    const seen = new Set<string>();

    for (const selectedNode of selection) {
      collectTextNodesFromNode(selectedNode, nodes, seen);
    }

    return nodes;
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

    if ("findAll" in node) {
      const textNodes = node.findAll((child) => child.type === "TEXT") as TextNode[];

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

async function processTextNodes(textNodes: TextNode[]): Promise<TextProcessResult> {
  try {
    let processed = 0;
    let changed = 0;
    let failed = 0;

    for (const textNode of textNodes) {
      try {
        processed += 1;
        const oldText = textNode.characters;
        const newText = cleanTypography(oldText);

        if (newText !== oldText) {
          await loadFontsForTextNode(textNode);
          const styles = captureTextStyles(textNode);
          const styleMap = buildStyleMap(oldText, newText, styles);
          textNode.characters = newText;
          restoreTextStyles(textNode, styleMap, styles);
          changed += 1;
        }
      } catch (error) {
        failed += 1;
        console.error(`[Чистовик] Failed to process text node ${textNode.id}`, error);
      }
    }

    return { processed, changed, failed };
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

function cleanTypography(input: string): string {
  try {
    let text = input;

    text = cleanupSpaces(text);
    text = cleanupQuotesAndPunctuation(text);
    text = cleanupDashesAndHyphens(text);
    text = formatPhoneNumbers(text);
    text = formatNumbersAndMoney(text);
    text = normalizeAbbreviations(text);
    text = applyNonBreakingSpaces(text);
    text = normalizeMathAndSymbols(text);
    text = normalizeSpacedYears(text);

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to clean text", error);
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
      .replace(/!\?/g, "?!");

    return formatQuotes(text)
      .replace(/([»“"'])([?!])/g, "$2$1")
      .replace(/([.,;:…])([»“"'])/g, "$2$1")
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

      const opening = isOpeningQuote(input, index, stack);

      if (opening) {
        const script = detectQuoteScript(input, index, stack);
        const level = stack.length;
        stack.push({ script, level });
        result += getOpeningQuote(script, level);
      } else {
        const state = stack.pop() ?? {
          script: detectQuoteScript(input, index, stack),
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

function isOpeningQuote(input: string, index: number, stack: QuoteState[]): boolean {
  try {
    const prev = input[index - 1] ?? "";
    const next = nextVisibleChar(input, index);

    if (!next) {
      return false;
    }

    if (!prev) {
      return true;
    }

    if (/[ \t\u00A0\n\r([{<«„“‘]|[-–—]/.test(prev)) {
      return true;
    }

    if (stack.length > 0) {
      return false;
    }

    return !/[A-Za-zА-Яа-яЁё\d.!?…)\]}»“"']/.test(prev);
  } catch (error) {
    console.error("[Чистовик] Failed to detect quote direction", error);
    throw error;
  }
}

function detectQuoteScript(input: string, index: number, stack: QuoteState[]): QuoteScript {
  try {
    const lookahead = input.slice(index + 1, findNextQuoteIndex(input, index + 1));
    const cyrillicCount = countMatches(lookahead, /[А-Яа-яЁё]/g);
    const latinCount = countMatches(lookahead, /[A-Za-z]/g);

    if (cyrillicCount > latinCount) {
      return "cyrillic";
    }

    if (latinCount > 0) {
      return "latin";
    }

    return stack[stack.length - 1]?.script ?? "cyrillic";
  } catch (error) {
    console.error("[Чистовик] Failed to detect quote script", error);
    throw error;
  }
}

function findNextQuoteIndex(input: string, start: number): number {
  try {
    const max = Math.min(input.length, start + 120);

    for (let index = start; index < max; index += 1) {
      if (isQuoteChar(input[index]) && !isApostropheInsideWord(input, index)) {
        return index;
      }
    }

    return max;
  } catch (error) {
    console.error("[Чистовик] Failed to find next quote", error);
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
      .replace(/(\d)[ \t\u00A0]*[-–—][ \t\u00A0]*(\d)/g, `$1${EN_DASH}$2`)
      .replace(/([A-Za-zА-Яа-яЁё])-([A-Za-zА-Яа-яЁё])/g, `$1${NB_HYPHEN}$2`);
  } catch (error) {
    console.error("[Чистовик] Failed to clean dashes and hyphens", error);
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
    let text = input.replace(/\b(\d+)\.(\d+)\b/g, (match, integerPart: string, decimalPart: string, offset: number, fullText: string) => {
      try {
        if (isVersionOrIpDecimal(fullText, offset, offset + match.length)) {
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

        if (shouldSkipNumberGrouping(fullText, offset, offset + integerPart.length, integerPart)) {
          return match;
        }

        return `${groupLongNumber(integerPart)}${decimalPart === undefined ? "" : `,${decimalPart}`}`;
      } catch (error) {
        console.error("[Чистовик] Failed to group number", error);
        return match;
      }
    });

    text = text.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?)[ \t\u00A0]*(₽|\$|€|км|кг|м)(?=$|[^A-Za-zА-Яа-яЁё])/g, `$1${NBSP}$2`);
    text = normalizeSpacedYears(text);

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to format numbers and money", error);
    throw error;
  }
}

function isVersionOrIpDecimal(fullText: string, start: number, end: number): boolean {
  try {
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
    console.error("[Чистовик] Failed to check decimal exception", error);
    throw error;
  }
}

function normalizeSpacedYears(input: string): string {
  try {
    return input
      .replace(/(^|[^\d])([12])[ \t\u00A0](\d{3})(?=[ \t\u00A0]*(?:г\.?|год|году)(?=$|[^A-Za-zА-Яа-яЁё]))/gi, "$1$2$3")
      .replace(/(©[ \t\u00A0]*)([12])[ \t\u00A0](\d{3})\b/g, "$1$2$3");
  } catch (error) {
    console.error("[Чистовик] Failed to normalize spaced years", error);
    throw error;
  }
}

function shouldSkipNumberGrouping(fullText: string, start: number, end: number, integerPart: string): boolean {
  try {
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

    text = text.replace(/([₽$€])[ \t\u00A0]*\/[ \t\u00A0]*мес\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, "$1/мес");
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

        if (previous === "/" || previous === "₽" || previous === "$" || previous === "€" || next === "/") {
          return `${prefix}мес`;
        }

        return `${prefix}мес.`;
      } catch (error) {
        console.error("[Чистовик] Failed to normalize мес", error);
        return match;
      }
    });
    text = text.replace(/(^|[^A-Za-zА-Яа-яЁё])(млн|млрд|трлн)\.(?=$|[^A-Za-zА-Яа-яЁё])/gi, "$1$2");
    text = text.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?[ \t\u00A0]+)(км|кг|м|с)\.(?=$|[^A-Za-zА-Яа-яЁё])/gi, "$1$2");

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to normalize abbreviations", error);
    throw error;
  }
}

function applyNonBreakingSpaces(input: string): string {
  try {
    let text = input;
    const shortWords = "а|в|во|и|к|ко|о|об|обо|у|с|со|по|за|из|от|до|не|ни|но|на|я|мы|вы|он|да|же|ли";

    text = text.replace(/[ \t\u00A0]+—/g, `${NBSP}${EM_DASH}`);
    text = text.replace(new RegExp(`(^|[^${LETTERS}\\d])(${shortWords})[ \\t\\u00A0]+(?=\\S)`, "gi"), `$1$2${NBSP}`);
    text = text.replace(/(^|[^А-ЯЁа-яё])([А-ЯЁ])\.[ \t\u00A0]*([А-ЯЁ])\.[ \t\u00A0]*(?=[А-ЯЁ][а-яё]+)/g, `$1$2.${NBSP}$3.${NBSP}`);
    text = text.replace(/(^|[^А-ЯЁа-яё])([А-ЯЁ])\.[ \t\u00A0]*(?=[А-ЯЁ][а-яё]+)/g, `$1$2.${NBSP}`);
    text = text.replace(/([№§])[ \t\u00A0]*(?=\S)/g, `$1${NBSP}`);
    text = text.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?)[ \t]+(?=[A-Za-zА-Яа-яЁё])/g, `$1${NBSP}`);

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to apply non-breaking spaces", error);
    throw error;
  }
}

function normalizeMathAndSymbols(input: string): string {
  try {
    return input
      .replace(/(\d)[ \t\u00A0]*[xх][ \t\u00A0]*(\d)/gi, "$1×$2")
      .replace(/(^|[^A-Za-zА-Яа-яЁё\d])1\/2($|[^A-Za-zА-Яа-яЁё\d])/g, "$1½$2")
      .replace(/(^|[^A-Za-zА-Яа-яЁё\d])1\/4($|[^A-Za-zА-Яа-яЁё\d])/g, "$1¼$2")
      .replace(/(^|[^A-Za-zА-Яа-яЁё\d])3\/4($|[^A-Za-zА-Яа-яЁё\d])/g, "$1¾$2")
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
