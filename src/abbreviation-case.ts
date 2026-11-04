type AbbreviationAuthorCase = "upper" | "title" | null;

interface AbbreviationCaseSegment {
  start: number;
  end: number;
  textCase: TextCase;
}

interface AbbreviationCaseContext {
  originalText: string;
  segments: AbbreviationCaseSegment[];
}

interface AbbreviationCaseParagraph {
  start: number;
  end: number;
  authorCase: AbbreviationAuthorCase;
  explicitCase: AbbreviationAuthorCase;
}

interface AbbreviationCasePolicy {
  originalText: string;
  segments: AbbreviationCaseSegment[];
  paragraphs: AbbreviationCaseParagraph[];
  currentParagraphs: Map<string, number[]>;
  mappedCases: Map<string, AbbreviationAuthorCase[]>;
}

// This is the catalogue we actually edit, not the wider quantity-marker list:
// SI prefixes in that list (for example мВт and МВт) have different meanings.
const ABBREVIATION_CASE_WORDS = new Set(
  "рис илл гл стр ст п тыс мин руб коп шт мес млн млрд трлн с м км кг г гг мм см л мл в вт квт dpi lpi кв куб т е к д и др ч н p s".split(" ")
);

function abbreviationAuthorCase(value: TextCase): AbbreviationAuthorCase {
  return value === "UPPER" ? "upper" : value === "TITLE" ? "title" : null;
}

function createAbbreviationCaseContext(text: string, segments: AbbreviationCaseSegment[]): AbbreviationCaseContext | null {
  const explicitSegments: AbbreviationCaseSegment[] = [];
  for (const segment of segments) {
    if (abbreviationAuthorCase(segment.textCase) === null) continue;
    const previous = explicitSegments[explicitSegments.length - 1];
    if (previous?.end === segment.start && previous.textCase === segment.textCase) previous.end = segment.end;
    else explicitSegments.push({ start: segment.start, end: segment.end, textCase: segment.textCase });
  }
  return explicitSegments.length === 0 ? null : { originalText: text, segments: explicitSegments };
}

function readAbbreviationCaseContext(textNode: TextNode, text: string): AbbreviationCaseContext | null {
  const textCase = textNode.textCase;
  if (typeof textCase === "string") {
    return createAbbreviationCaseContext(text, [{ start: 0, end: text.length, textCase }]);
  }
  // Small test doubles may not expose this Figma property.
  if (textCase === undefined) return null;
  return createAbbreviationCaseContext(text, textNode.getStyledTextSegments(["textCase"]));
}

function areAbbreviationCaseContextsEqual(first: AbbreviationCaseContext | null, second: AbbreviationCaseContext | null): boolean {
  if (first === null || second === null) return first === second;
  return first.originalText === second.originalText && JSON.stringify(first.segments) === JSON.stringify(second.segments);
}

function getAbbreviationParagraphStarts(text: string): number[] {
  const starts = [0];
  const breaks = /\r\n|\r|\n/g;
  let match: RegExpExecArray | null;
  while ((match = breaks.exec(text)) !== null) starts.push(match.index + match[0].length);
  return starts;
}

function detectAbbreviationAuthorCase(text: string): AbbreviationAuthorCase {
  const words: string[] = [];
  for (const atom of text.match(/[^\s\u00A0]+/g) ?? []) {
    if (/[\d_/@:]/.test(atom)) continue;
    for (const word of atom.match(/[A-Za-zА-Яа-яЁё]+/g) ?? []) {
      if (word.length < 2 || ABBREVIATION_CASE_WORDS.has(word.toLowerCase()) || QUANTITY_MARKER_FORMS.has(word) || /^[IVXLCDM]+$/.test(word)) continue;
      words.push(word);
    }
  }
  if (words.length > 0 && words.every((word) => word === word.toUpperCase())) return "upper";
  if (words.length >= 3 && words.every((word) => /^[A-ZА-ЯЁ][a-zа-яё]+$/.test(word))) return "title";
  return null;
}

function createAbbreviationCasePolicy(text: string, context: AbbreviationCaseContext | null): AbbreviationCasePolicy {
  const originalText = context?.originalText ?? text;
  const segments = context?.segments ?? [];
  const starts = getAbbreviationParagraphStarts(originalText);
  const restoredStarts = getAbbreviationParagraphStarts(text);
  const paragraphs = starts.map((start, index): AbbreviationCaseParagraph => {
    const end = starts[index + 1] ?? originalText.length;
    let explicitCase: AbbreviationAuthorCase = null;
    let allExplicit = true;
    for (let position = start; position < end; position += 1) {
      if (!/[A-Za-zА-Яа-яЁё]/.test(originalText[position])) continue;
      const segment = segments.find((candidate) => candidate.start <= position && position < candidate.end);
      const mode = segment === undefined ? null : abbreviationAuthorCase(segment.textCase);
      if (mode === null || (explicitCase !== null && explicitCase !== mode)) {
        allExplicit = false;
        break;
      }
      explicitCase = mode;
    }
    const restoredStart = restoredStarts[index] ?? text.length;
    const restoredEnd = restoredStarts[index + 1] ?? text.length;
    return { start, end, authorCase: detectAbbreviationAuthorCase(text.slice(restoredStart, restoredEnd)), explicitCase: allExplicit ? explicitCase : null };
  });
  return { originalText, segments, paragraphs, currentParagraphs: new Map(), mappedCases: new Map() };
}

function getAbbreviationCaseParagraph(policy: AbbreviationCasePolicy, text: string, position: number): AbbreviationCaseParagraph | undefined {
  let starts = policy.currentParagraphs.get(text);
  if (starts === undefined) {
    starts = getAbbreviationParagraphStarts(text);
    policy.currentParagraphs.set(text, starts);
  }
  let low = 0;
  let high = starts.length;
  while (low + 1 < high) {
    const middle = (low + high) >>> 1;
    if (starts[middle] <= position) low = middle;
    else high = middle;
  }
  return policy.paragraphs[low];
}

function getMappedAbbreviationCases(policy: AbbreviationCasePolicy, text: string): AbbreviationAuthorCase[] {
  const cached = policy.mappedCases.get(text);
  if (cached !== undefined) return cached;
  const originalCases = new Array<AbbreviationAuthorCase>(policy.originalText.length).fill(null);
  for (const segment of policy.segments) {
    originalCases.fill(abbreviationAuthorCase(segment.textCase), segment.start, segment.end);
  }
  if (text === policy.originalText) {
    policy.mappedCases.set(text, originalCases);
    return originalCases;
  }
  // Reuse the existing pure text comparison to carry only case hints across
  // inserted punctuation/spaces. This does not change how Figma text is written.
  const edits = calculatePointTextEdits(policy.originalText, text);
  const result: AbbreviationAuthorCase[] = [];
  let cursor = 0;
  for (const edit of edits) {
    for (let index = cursor; index < edit.start; index += 1) result.push(originalCases[index]);
    const source = edit.start === edit.end
      ? Math.min(edit.start, originalCases.length - 1)
      : getPointTextEditStyleSourcePosition(policy.originalText, edit);
    for (let index = 0; index < edit.insertText.length; index += 1) result.push(originalCases[source] ?? null);
    cursor = edit.end;
  }
  for (let index = cursor; index < originalCases.length; index += 1) result.push(originalCases[index]);
  policy.mappedCases.set(text, result);
  return result;
}

function shouldPreserveAbbreviationCase(policy: AbbreviationCasePolicy, text: string, start: number, end: number): boolean {
  const paragraph = getAbbreviationCaseParagraph(policy, text, start);
  if (paragraph?.authorCase || paragraph?.explicitCase) return true;
  if (policy.segments.length === 0) return false;
  const cases = getMappedAbbreviationCases(policy, text);
  for (let index = start; index < end; index += 1) {
    if (cases[index] !== null && /[A-Za-zА-Яа-яЁё]/.test(text[index])) return true;
  }
  return false;
}

function shouldPreserveAuthorAbbreviationPeriod(policy: AbbreviationCasePolicy | null, text: string, position: number): boolean {
  if (policy === null) return false;
  const paragraph = getAbbreviationCaseParagraph(policy, text, position);
  return Boolean(paragraph?.authorCase || paragraph?.explicitCase);
}

function isAbbreviationAtSentenceStart(text: string, position: number): boolean {
  const before = text.slice(0, position).replace(/[ \t\u00A0«“„"'([{]+$/, "");
  return before.length === 0 || /[.!?…\r\n]$/.test(before) || /(?:^|[\r\n])[ \t\u00A0]*(?:[—–\-•●○◦‣⁃*]|\d+[.)])$/.test(before);
}

function normalizeAbbreviationCase(
  input: string,
  policy: AbbreviationCasePolicy,
  collector: TypographyRuleAnalyticsCollector | null,
  numberLayerContext: NumberLayerContext | null
): string {
  const changes = new Map<TypographyRuleCode, Array<{ start: number; end: number; text: string }>>();
  const occupied = new Set<number>();
  const add = (start: number, end: number, code: TypographyRuleCode, canonical: string, sentenceInitial: boolean = false): void => {
    for (let index = start; index < end; index += 1) if (occupied.has(index)) return;
    for (let index = start; index < end; index += 1) occupied.add(index);
    const rublePerMonth = input.slice(Math.max(0, start - 2), start) === "₽/" && !isSlashSeparatedAbbreviationPart(input, start - 2, end);
    if ((!rublePerMonth && isSlashSeparatedAbbreviationPart(input, start, end)) || isCodeLikeTextPart(input, start, end) || shouldPreserveAbbreviationCase(policy, input, start, end)) return;
    const original = input.slice(start, end);
    if (sentenceInitial && /^[A-ZА-ЯЁ]/.test(original) && isAbbreviationAtSentenceStart(input, start)) {
      canonical = canonical[0].toUpperCase() + canonical.slice(1);
    }
    if (original === canonical) return;
    const entries = changes.get(code) ?? [];
    entries.push({ start, end, text: canonical });
    changes.set(code, entries);
  };
  const scan = (pattern: RegExp, visit: (match: RegExpExecArray) => void): void => {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(input)) !== null) visit(match);
  };

  scan(/(^|[^A-Za-zА-Яа-яЁё\d_])((?:и[ \t\u00A0]+т\.[ \t\u00A0]+[дп]\.|и[ \t\u00A0]+др\.|в[ \t\u00A0]+т\.[ \t\u00A0]+ч\.|т\.[ \t\u00A0]+[екдп]\.))(?=$|[^A-Za-zА-Яа-яЁё\d_])/gi, (match) => {
    const start = match.index + match[1].length;
    // The same two capital letters can be a person's initials.
    if (/^[А-ЯЁ]\.[ \t\u00A0]+[А-ЯЁ]\.$/.test(match[2]) && /^[ \t\u00A0]*[А-ЯЁ][А-Яа-яЁё]+/.test(input.slice(start + match[2].length))) return;
    add(start, start + match[2].length, "abbr_compound", match[2].toLowerCase(), true);
  });
  scan(/(^|[^\d_])[12]\d{3}[ \t\u00A0]*—[ \t\u00A0]*(н\.[ \t\u00A0]+в\.)(?=$|[^A-Za-zА-Яа-яЁё\d_])/gi, (match) => {
    const start = match.index + match[0].lastIndexOf(match[2]);
    add(start, start + match[2].length, "abbr_compound", match[2].toLowerCase());
  });
  scan(/(^|[^A-Za-zА-Яа-яЁё\d_])((?:p\.[ \t\u00A0]+){1,2}s\.)(?=$|[^A-Za-zА-Яа-яЁё\d_])/gi, (match) => {
    const start = match.index + match[1].length;
    add(start, start + match[2].length, "abbr_compound", match[2].toUpperCase());
  });

  const number = "\\d+(?:[ \\t\\u00A0\\u2009\\u202F]\\d{3})*(?:,\\d+)?";
  scan(new RegExp(`(^|[^${LETTERS}\\d_])${number}[ \\t\\u00A0]+(кв|куб)\\.[ \\t\\u00A0]+(м)(?=$|[^${LETTERS}\\d_])`, "gi"), (match) => {
    const unitStart = match.index + match[0].lastIndexOf(match[3]);
    const kindStart = match.index + match[0].lastIndexOf(match[2]);
    const amountStart = match.index + match[1].length;
    const amountEnd = amountStart + input.slice(amountStart, kindStart).replace(/[ \t\u00A0]+$/, "").length;
    if (isPartialSeparatedNumber(input, amountStart, amountEnd) || isNumberPartOfCodeToken(input, amountStart, amountEnd)) return;
    add(kindStart, kindStart + match[2].length, "abbr_area_volume", match[2].toLowerCase());
    add(unitStart, unitStart + match[3].length, "abbr_area_volume", "м");
  });
  scan(new RegExp(`(^|[^${LETTERS}\\d_])${number}(?:[—–-]${number})?[ \\t\\u00A0]+(млрд|трлн|млн|тыс|мин|руб|коп|шт|мес|квт|вт|dpi|lpi|км|кг|мм|см|мл|с|м|г|л|в)(\\.?)(?=$|[^${LETTERS}\\d_])`, "gi"), (match) => {
    const abbreviation = match[2];
    const start = match.index + match[0].lastIndexOf(abbreviation);
    const amountStart = match.index + match[1].length;
    const amountEnd = amountStart + input.slice(amountStart, start).replace(/[ \t\u00A0]+$/, "").length;
    if (isPartialSeparatedNumber(input, amountStart, amountEnd) || isNumberPartOfCodeToken(input, amountStart, amountEnd)) return;
    if (abbreviation.toLowerCase() === "шт" && isProtectedPieceAbbreviation(input, amountStart, amountEnd, start + abbreviation.length, numberLayerContext)) return;
    if (abbreviation.toLowerCase() === "с" && match[3] === "" && /^[ \t\u00A0]+[A-Za-zА-Яа-яЁё]/.test(input.slice(start + abbreviation.length))) return;
    const code: TypographyRuleCode = abbreviation.toLowerCase() === "мес" ? "abbr_month" : /^(?:тыс|мин|руб|коп|шт)$/i.test(abbreviation) || (abbreviation.toLowerCase() === "г" && match[3] === ".") ? "abbr_dotted" : "abbr_undotted_large_number";
    add(start, start + abbreviation.length, code, getCanonicalTechnicalMeasurementUnit(abbreviation.toLowerCase()));
  });
  scan(new RegExp(`(^|[^${LETTERS}\\d_.])(([12]\\d{3})—([12]\\d{3}))[ \\t\\u00A0]+(гг)\\.(?=$|[^${LETTERS}\\d_.])`, "gi"), (match) => {
    const rangeStart = match.index + match[1].length;
    const rangeEnd = rangeStart + match[2].length;
    const start = match.index + match[0].lastIndexOf(match[5]);
    const previous = previousNonSpaceSkippingDevelopmentMarker(input, rangeStart);
    const protectionText = input.slice(0, start) + "  " + input.slice(start + 2);
    if (numberLayerContext?.protectedByNeighbor || previous === "+" || previous === MINUS || hasProtectiveQuantityLabel(input, rangeStart) || isNumberPartOfMaskedSecret(input, rangeStart, match[3]) || isProtectedNumericRange(protectionText, rangeStart, rangeEnd) || isNumberInsideFullDate(input, rangeStart, rangeEnd)) return;
    add(start, start + 2, "abbr_dotted", "гг");
  });
  scan(/₽\/(мес)(?=$|[^A-Za-zА-Яа-яЁё\d_])/gi, (match) => add(match.index + 2, match.index + match[0].length, "abbr_month", "мес"));
  const referenceNumber = "(?:№[ \\t\\u00A0]*\\d+(?:\\.\\d+)*|[IVXLCDM]+|\\d+(?:\\.\\d+)*(?:[—–-]\\d+(?:\\.\\d+)*)?)";
  scan(new RegExp(`(^|[^${LETTERS}\\d_])(рис|илл|гл|стр|ст|п)\\.(?=[ \\t\\u00A0]+${referenceNumber}(?=$|[^${LETTERS}\\d_]))`, "gi"), (match) => {
    const start = match.index + match[1].length;
    add(start, start + match[2].length, "abbr_dotted", match[2].toLowerCase(), true);
  });
  if (numberLayerContext?.moneyNumberBefore) {
    scan(/^([ \t\u00A0]*)(руб|коп)\.(?=[ \t\u00A0]*$)/gi, (match) => add(match[1].length, match[1].length + match[2].length, "abbr_dotted", match[2].toLowerCase()));
  }

  let text = input;
  for (const [code, edits] of changes) {
    text = applyTypographyRule(collector, code, text, (value) => {
      let result = "";
      let cursor = 0;
      for (const edit of edits.sort((first, second) => first.start - second.start)) {
        result += value.slice(cursor, edit.start) + edit.text;
        cursor = edit.end;
      }
      return result + value.slice(cursor);
    });
  }
  return text;
}
