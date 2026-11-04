const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const NBSP = "\u00A0";
const root = path.resolve(__dirname, "..");
const compiled = fs.readFileSync(path.join(root, "dist/code.js"), "utf8");
assert(compiled.includes("void run();"), "Не найден безопасный вход для изолированной проверки");
const runtime = { console, setTimeout, clearTimeout, performance: { now: () => 0 }, globalThis: { performance: { now: () => 0 } } };
vm.createContext(runtime);
vm.runInContext(compiled.replace("void run();", "globalThis.clean = cleanTypographyWithMetadata; globalThis.contexts = buildNumberLayerContexts;"), runtime);
const { clean, contexts } = runtime.globalThis;
assert.strictEqual(typeof clean, "function");
assert.strictEqual(typeof contexts, "function");

let assertions = 0;
const failures = [];
const visible = (value) => value.replaceAll(NBSP, "⍽").replaceAll("\n", "\\n");
const options = (mode) => ({ mode, processHiddenNodes: false, processLockedNodes: false, recolorExistingAsterisks: false });
const fullStyle = (textCase) => (text) => ({ originalText: text, segments: [{ start: 0, end: text.length, textCase }] });

function equal(name, actual, expected) {
  assertions += 1;
  if (actual !== expected) failures.push(`${name}\n  ожидалось: ${visible(expected)}\n  получено:  ${visible(actual)}`);
}

function transform(text, mode, indexes, styleFactory, numberContextFactory) {
  return clean(text, options(mode), indexes, null, numberContextFactory === null ? null : numberContextFactory(text), null, styleFactory === null ? null : styleFactory(text));
}

function check(name, input, expected, styleFactory = null, numberContextFactory = null) {
  for (const mode of ["beauty", "development"]) {
    const expectedText = mode === "beauty" ? expected : expected.replaceAll(NBSP, "*");
    let current = input;
    let indexes = [];
    for (let pass = 1; pass <= 3; pass += 1) {
      const result = transform(current, mode, indexes, styleFactory, numberContextFactory);
      equal(`${name}, ${mode}, проход ${pass}`, result.text, expectedText);
      current = result.text;
      indexes = result.developmentMarkerIndexes;
    }
  }
}

// Исправляемая причина: число должно видеть уже согласованное сокращение
// до того, как поздний этап восстановит его точки или разделит слитный ввод.
[
  ["площадь без первой точки", "Площадь 10000 кв м", `Площадь 10${NBSP}000${NBSP}кв.${NBSP}м`],
  ["объём без первой точки", "Объём 10000 куб м", `Объём 10${NBSP}000${NBSP}куб.${NBSP}м`],
  ["площадь с десятичной точкой", "Площадь 10000.5 кв м", `Площадь 10${NBSP}000,5${NBSP}кв.${NBSP}м`],
  ["объём с десятичной точкой", "Объём 10000.5 куб м", `Объём 10${NBSP}000,5${NBSP}куб.${NBSP}м`],
  ["площадь с десятичной запятой", "Площадь 10000,5 кв м", `Площадь 10${NBSP}000,5${NBSP}кв.${NBSP}м`],
  ["объём с десятичной запятой", "Объём 10000,5 куб м", `Объём 10${NBSP}000,5${NBSP}куб.${NBSP}м`],
  ["короткое число не становится датой рядом с площадью", "Площадь 10.04 кв м", `Площадь 10,04${NBSP}кв.${NBSP}м`],
  ["уже разделённое число", "Площадь 10 000 кв м", `Площадь 10${NBSP}000${NBSP}кв.${NBSP}м`],
  ["неразрывные исходные пробелы", `Объём 10${NBSP}000${NBSP}куб${NBSP}м`, `Объём 10${NBSP}000${NBSP}куб.${NBSP}м`],
  ["тонкий исходный пробел", "Площадь 10\u2009000 кв м", `Площадь 10${NBSP}000${NBSP}кв.${NBSP}м`],
  ["узкий исходный пробел", "Объём 10\u202F000 куб м", `Объём 10${NBSP}000${NBSP}куб.${NBSP}м`],
  ["табуляция между частями сокращения", "Площадь 10000\tкв\tм", `Площадь 10${NBSP}000${NBSP}кв.${NBSP}м`],
  ["исправление обычного регистра площади", "Площадь 10000 КВ М", `Площадь 10${NBSP}000${NBSP}кв.${NBSP}м`],
  ["исправление смешанного регистра объёма", "Объём 10000 кУб М", `Объём 10${NBSP}000${NBSP}куб.${NBSP}м`],
  ["ручной капс площади сохраняется", "ПЛОЩАДЬ 10000 КВ М", `ПЛОЩАДЬ 10${NBSP}000${NBSP}КВ.${NBSP}М`],
  ["ручной капс объёма сохраняется", "ОБЪЁМ 10000 КУБ М", `ОБЪЁМ 10${NBSP}000${NBSP}КУБ.${NBSP}М`],
  ["ручной Title сохраняется", "Новая Большая Светлая Площадь 10000 Кв М", `Новая Большая Светлая Площадь 10${NBSP}000${NBSP}Кв.${NBSP}М`],
  ["авторская точка у метра в конце", "Площадь 10000 кв м.", `Площадь 10${NBSP}000${NBSP}кв.${NBSP}м.`],
  ["точка у метра перед продолжением", "Площадь 10000 кв м. товара", `Площадь 10${NBSP}000${NBSP}кв.${NBSP}м товара`],
  ["точка у метра перед новым предложением", "Площадь 10000 кв м. Доставка", `Площадь 10${NBSP}000${NBSP}кв.${NBSP}м. Доставка`],
  ["точка у метра перед переносом", "Объём 10000 куб м.\nДоставка", `Объём 10${NBSP}000${NBSP}куб.${NBSP}м.\nДоставка`],
  ["уже каноническая площадь", "Площадь 10000 кв. м", `Площадь 10${NBSP}000${NBSP}кв.${NBSP}м`],
  ["уже канонический объём", "Объём 10000 куб. м", `Объём 10${NBSP}000${NBSP}куб.${NBSP}м`],
  ["уже каноническая дробная площадь", "Площадь 10000.5 кв. м", `Площадь 10${NBSP}000,5${NBSP}кв.${NBSP}м`],
  ["код после единицы не отменяет количество", "Площадь 10000 кв м A_код", `Площадь 10${NBSP}000${NBSP}кв.${NBSP}м A_код`],
  ["сырая площадь перед закрывающей кавычкой", "«10000 кв м»", `«10${NBSP}000${NBSP}кв.${NBSP}м»`],
  ["каноническая площадь перед закрывающей кавычкой", "«10000 кв. м»", `«10${NBSP}000${NBSP}кв.${NBSP}м»`],
  ["объём перед двоеточием", "Объём 10000 куб м:", `Объём 10${NBSP}000${NBSP}куб.${NBSP}м:`],
  ["объём перед закрывающей скобкой", "(10000 куб м)", `(10${NBSP}000${NBSP}куб.${NBSP}м)`],
].forEach(([name, input, expected]) => check(name, input, expected));

// Только уже согласованные слитные формы. Слитное мес сюда не входит.
for (const abbreviation of ["мин", "тыс", "руб", "коп"]) {
  check(`${abbreviation}: слитное целое`, `10000${abbreviation}`, `10${NBSP}000${NBSP}${abbreviation}.`);
  check(`${abbreviation}: авторская точка`, `10000${abbreviation}.`, `10${NBSP}000${NBSP}${abbreviation}.`);
  check(`${abbreviation}: десятичная точка`, `10000.5${abbreviation}`, `10${NBSP}000,5${NBSP}${abbreviation}.`);
  check(`${abbreviation}: десятичная запятая`, `10000,5${abbreviation}`, `10${NBSP}000,5${NBSP}${abbreviation}.`);
  check(`${abbreviation}: прописные буквы без капсового оформления`, `10000${abbreviation.toUpperCase()}`, `10${NBSP}000${NBSP}${abbreviation}.`);
  check(`${abbreviation}: середина фразы`, `Количество 10000${abbreviation} товара`, `Количество 10${NBSP}000${NBSP}${abbreviation}. товара`);
}
check("слитный денежный диапазон", "10000-20000руб", `10${NBSP}000${NBSP}— 20${NBSP}000${NBSP}руб.`);
check("слитные минуты в диапазоне остаются стабильны", "10000-20000мин", `10${NBSP}000${NBSP}— 20${NBSP}000${NBSP}мин.`);
check("капсовая сумма", "СУММА 10000РУБ", `СУММА 10${NBSP}000${NBSP}РУБ.`);
for (const textCase of ["UPPER", "TITLE"]) {
  check(`явное ${textCase} площади`, "Площадь 10000 кВ м", `Площадь 10${NBSP}000${NBSP}кВ.${NBSP}м`, fullStyle(textCase));
  check(`явное ${textCase} слитных минут`, "10000мИн", `10${NBSP}000${NBSP}мИн.`, fullStyle(textCase));
}

// Отрицательные границы не разрешают новому раннему распознаванию
// менять числовую запись. Уже существующие точки сокращений здесь не переутверждаются.
function protectNumber(name, input, number) {
  for (const mode of ["beauty", "development"]) {
    let current = input;
    let indexes = [];
    let first = null;
    for (let pass = 1; pass <= 3; pass += 1) {
      const result = transform(current, mode, indexes, null, null);
      const actualNumber = /\d(?:[\d., \t\u00A0\u2009\u202F*]*\d)?/.exec(result.text)?.[0] ?? "";
      equal(`${name}, ${mode}, число, проход ${pass}`, actualNumber, number);
      if (first !== null) equal(`${name}, ${mode}, повтор ${pass}`, result.text, first);
      first = result.text;
      current = result.text;
      indexes = result.developmentMarkerIndexes;
    }
  }
}
[
  ["код с подчёркиванием", "id_10000мин", "10000"],
  ["код с префиксом", "SKU-10000руб", "10000"],
  ["версия перед площадью", "v2.0 кв. м", "2.0"],
  ["версия перед слитной валютой", "v2.0руб", "2.0"],
  ["ошибочная дробь перед площадью", "Площадь 1,23.00 кв. м", "1,23.00"],
  ["ошибочные группы перед объёмом", "Объём 12,34,567.00 куб. м", "12,34,567.00"],
  ["ошибочная дробь перед слитным сокращением", "1,23.00мин", "1,23.00"],
  ["ошибочные группы перед слитной валютой", "12,34,567.00руб", "12,34,567.00"],
  ["буква после точки метра", "Площадь 10000 кв м.Иванов", "10000"],
  ["цифры после точки метра", "Площадь 10000 кв м.2025", "10000"],
  ["код после точки метра", "Площадь 10000 кв м._код", "10000"],
  ["дефисное имя после метра не доказывает количество", "Площадь 10000 кв м-Иванов", "10000"],
].forEach(([name, input, number]) => protectNumber(name, input, number));
[
  ["косая черта после площади", "Площадь 10000 кв м/шт", "Площадь 10000 кв м/шт"],
  ["косая черта перед площадью", "Площадь /10000 кв м", "Площадь /10000 кв м"],
  ["каноническая составная единица через косую черту", "10000 кв. м/шт", "10000 кв. м/шт"],
  ["валюта через косую черту", "10000руб/мес", "10000руб/мес"],
  ["сокращение после косой черты", "₽/10000мин", "₽/10000мин"],
].forEach(([name, input, expected]) => check(name, input, expected));

function rawNeighborContext(marker, text) {
  const nodes = [text, marker].map((characters, index) => ({
    characters, id: `one-pass-context-${index}`, layoutPositioning: "AUTO", locked: false,
    maxLines: null, parent: null, removed: false, rotation: 0,
    textAutoResize: "WIDTH_AND_HEIGHT", textTruncation: "DISABLED", type: "TEXT", visible: true,
  }));
  const parent = { children: nodes, id: "one-pass-context-parent", layoutMode: "HORIZONTAL", layoutWrap: "NO_WRAP", locked: false, parent: null, type: "FRAME", visible: true };
  nodes.forEach((node) => { node.parent = parent; });
  const context = contexts([nodes[0]]).get(nodes[0].id) ?? null;
  equal(`сырой ${marker} в соседнем слое не даёт доказательства`, context?.evidenceAfter?.kind ?? "none", "none");
  return context;
}
for (const marker of ["кв м", "куб м", "КВ М", "КУБ М"]) {
  check(`сырое сокращение в соседнем слое: ${marker}`, "10000", "10000", null, (text) => rawNeighborContext(marker, text));
}

// Это границы изменения, а не новые смысловые решения о месяцах и г.
[
  ["месяцы раздельно", "10000 мес", `10${NBSP}000${NBSP}мес.`],
  ["месяцы раздельно с заглавной", "10000 Мес", `10${NBSP}000${NBSP}мес.`],
  ["дробные месяцы раздельно", "10000.5 мес", `10${NBSP}000,5${NBSP}мес.`],
  ["слитные месяцы не добавляются", "10000мес", "10000мес"],
  ["слитные месяцы с авторской точкой не добавляются", "10000мес.", "10000мес."],
  ["обычные граммы", "100 г", `100${NBSP}г`],
  ["календарный год", "2026 г", `2026${NBSP}г.`],
  ["согласованный срок", "1 г 2 мес", `1${NBSP}г. 2${NBSP}мес.`],
  ["неоднозначный год не расширяется", "2100 г", `2100${NBSP}г`],
  ["срок не получает нового смысла", "Срок — 1 г", `Срок${NBSP}— 1${NBSP}г`],
].forEach(([name, input, expected]) => check(name, input, expected));
for (const abbreviation of ["ч", "сек", "сут", "д", "нед", "чел", "ед", "экз", "упак", "компл"]) {
  check(`неутверждённое слитное ${abbreviation}`, `10000${abbreviation}`, `10000${abbreviation}`);
  const expectedNumber = abbreviation === "д" ? "10000" : `10${NBSP}000`;
  check(`неутверждённая точка у ${abbreviation}`, `10000 ${abbreviation}`, `${expectedNumber}${NBSP}${abbreviation}`);
}

if (failures.length > 0) {
  console.error(`Проверки обработки количества за один проход: ${failures.length} из ${assertions} не прошли.\n`);
  console.error(failures.map((failure, index) => `${index + 1}. ${failure}`).join("\n\n"));
  process.exitCode = 1;
} else {
  console.log(`Проверки обработки количества за один проход: все ${assertions} пройдены.`);
}
