const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const NBSP = "\u00A0";
const NB_HYPHEN = "\u2011";
const EN_DASH = "\u2013";
const MINUS = "\u2212";
const MULTIPLY = "\u00D7";

const source = fs.readFileSync("dist/code.js", "utf8").replace(
  "void run();",
  "globalThis.cleanTypography = cleanTypography; globalThis.cleanTypographyWithMetadata = cleanTypographyWithMetadata;"
);
const context = { console, globalThis: {} };

vm.createContext(context);
vm.runInContext(source, context);

const cleanTypography = context.globalThis.cleanTypography;
const cleanTypographyWithMetadata = context.globalThis.cleanTypographyWithMetadata;
const developmentOptions = {
  mode: "development",
  processHiddenNodes: false,
  processLockedNodes: false,
};

function expectClean(input, expected) {
  const actual = cleanTypography(input);

  assert.strictEqual(actual, expected, input);
  assert.strictEqual(cleanTypography(actual), expected, `${input} should be idempotent`);
}

function expectDevelopmentIdempotent(input, expected) {
  const first = cleanTypographyWithMetadata(input, developmentOptions);
  const secondWithMarkers = cleanTypographyWithMetadata(first.text, developmentOptions, first.developmentMarkerIndexes);
  const secondWithoutMarkers = cleanTypographyWithMetadata(first.text, developmentOptions);

  assert.strictEqual(first.text, expected, `${input} first development run`);
  assert.strictEqual(secondWithMarkers.text, expected, `${input} second development run with marker indexes`);
  assert.strictEqual(secondWithoutMarkers.text, expected, `${input} second development run without marker indexes`);
}

expectClean(
  "Она спросила \"как дела?\". Я подумала \"ну всё... приехали!\". \"Она сказала: \"Я приду завтра!\"\".",
  `Она спросила «как дела?» Я${NBSP}подумала «ну${NBSP}всё… приехали!» «Она сказала: „Я${NBSP}приду завтра!“»`
);
expectClean("The word \"привет\" means hello.", 'The word "привет" means hello.');
expectClean("The word «привет» means hello.", 'The word "привет" means hello.');
expectClean("Что?? Да!! Правда!?", "Что? Да! Правда?!");
expectDevelopmentIdempotent("«Она сказала: „Я приду завтра!“»", "«Она сказала: „Я*приду завтра!“»");
expectDevelopmentIdempotent("«Ты правда спросил „зачем??“»", "«Ты*правда спросил „зачем?“»");
expectDevelopmentIdempotent("«„Как это скучно!“ — воскликнул я невольно».", "«„Как это скучно!“*— воскликнул я*невольно».");

expectClean("10-20", `10${EN_DASH}20`);
expectClean("10 - 20", `10${EN_DASH}20`);
expectClean("10 – 20", `10${EN_DASH}20`);
expectClean("5 - 5", `5${EN_DASH}5`);
expectClean("X-XI век", `X${EN_DASH}XI век`);
expectClean("X – XI век", `X${EN_DASH}XI век`);
expectClean("X—XI век", `X${EN_DASH}XI век`);
expectClean("I - III главы", `I${EN_DASH}III главы`);
expectClean("II-IV квартал", `II${EN_DASH}IV квартал`);
expectClean("в X-XI веках", `в${NBSP}X${EN_DASH}XI веках`);
expectClean("главы I-III", `главы I${EN_DASH}III`);
expectClean("разделы IV-VI", `разделы IV${EN_DASH}VI`);
expectClean("кв. I-II", `кв. I${EN_DASH}II`);
expectClean("x-xi", `x${NB_HYPHEN}xi`);
expectClean("USB-C", `USB${NB_HYPHEN}C`);
expectClean("A-B тест", `A${NB_HYPHEN}B тест`);
expectClean("B2B", "B2B");
expectClean("M-Video", `M${NB_HYPHEN}Video`);
expectClean("X-ray", `X${NB_HYPHEN}ray`);
expectClean("план B-C", `план B${NB_HYPHEN}C`);
expectClean("X-X", `X${NB_HYPHEN}X`);

expectClean("10 - 5 = 5", `10${NBSP}${MINUS}${NBSP}5${NBSP}=${NBSP}5`);
expectClean("10 - 5 + 2", `10${NBSP}${MINUS}${NBSP}5${NBSP}+${NBSP}2`);
expectClean("10 - 5 - 2", `10${NBSP}${MINUS}${NBSP}5${NBSP}${MINUS}${NBSP}2`);
expectClean("-10 - 5", `${MINUS}10${NBSP}${MINUS}${NBSP}5`);
expectClean("-10 + 5 = -5", `${MINUS}10${NBSP}+${NBSP}5${NBSP}=${NBSP}${MINUS}5`);

expectClean("2*2", `2${NBSP}${MULTIPLY}${NBSP}2`);
expectClean("2 * 2", `2${NBSP}${MULTIPLY}${NBSP}2`);
expectClean("2x2", `2${NBSP}${MULTIPLY}${NBSP}2`);
expectClean("2 х 2", `2${NBSP}${MULTIPLY}${NBSP}2`);
expectClean("2/2", `2${NBSP}/${NBSP}2`);
expectClean("1/2", "\u00BD");
expectClean("Формула: 2 * 2 = 4.", `Формула: 2${NBSP}${MULTIPLY}${NBSP}2${NBSP}=${NBSP}4.`);

expectClean("2026-05-14", "2026-05-14");
expectClean("10.04.2025", "10.04.2025");
expectClean("v2.0.1", "v2.0.1");
expectClean("192.168.0.1", "192.168.0.1");
expectClean("https://example.com/2/2", "https://example.com/2/2");
expectClean("mail@example.com", "mail@example.com");
expectClean("x1+2", "x1+2");
expectClean("var_1+2", "var_1+2");
expectClean("SALE-2026", "SALE-2026");
expectClean("PROMO-10-20", "PROMO-10-20");
expectClean("+7 (900) 123-45-67", `+7${NBSP}900${NBSP}123${NB_HYPHEN}45${NB_HYPHEN}67`);
expectClean("Подписка 5000 ₽/мес. Следующий платёж завтра.", `Подписка 5${NBSP}000${NBSP}₽/мес. Следующий платёж завтра.`);
expectClean("Вес 1.5 кг. Доставим завтра.", `Вес 1,5${NBSP}кг. Доставим завтра.`);
expectClean("Длина 10.04 м. Это стандартный размер.", `Длина 10,04${NBSP}м. Это стандартный размер.`);
expectClean("Доход 100 млн. Компания растёт.", `Доход 100${NBSP}млн. Компания растёт.`);
expectClean("Выручка 5 млрд. Это прогноз.", `Выручка 5${NBSP}млрд. Это прогноз.`);
expectClean("Срок 6 мес. Потом продлим.", `Срок 6${NBSP}мес. Потом продлим.`);
expectClean("Подписка 5000 ₽/мес доступна всем.", `Подписка 5${NBSP}000${NBSP}₽/мес доступна всем.`);
expectClean("Доход 100 млн. рублей.", `Доход 100${NBSP}млн рублей.`);
expectClean("Выручка 5 млрд. рублей.", `Выручка 5${NBSP}млрд рублей.`);
expectClean("Размер 10 см. в ширину.", `Размер 10${NBSP}см в${NBSP}ширину.`);
expectClean("Вес 5 кг. товара.", `Вес 5${NBSP}кг товара.`);
expectClean("100 руб", `100${NBSP}руб.`);
expectClean("20 коп", `20${NBSP}коп.`);
expectClean("Стоимость 100 руб. Оплата завтра.", `Стоимость 100${NBSP}руб. Оплата завтра.`);
expectClean("Выручка 10 млн", `Выручка 10${NBSP}млн`);
expectClean("Выручка 10 млн.\nНужно увеличить на 5%", `Выручка 10${NBSP}млн\nНужно увеличить на${NBSP}5%`);
expectClean("Выручка 10 млн. Нужно увеличить на 5%", `Выручка 10${NBSP}млн. Нужно увеличить на${NBSP}5%`);
expectDevelopmentIdempotent(`Цена 2${NBSP}000,35${NBSP}₽.`, "Цена 2*000,35*₽.");

const development = cleanTypographyWithMetadata("2 * 2 = 4", developmentOptions);

assert.strictEqual(development.text, "2*\u00D7*2*=*4");
assert.deepStrictEqual(Array.from(development.developmentMarkerIndexes), [1, 3, 5, 7]);

console.log("cleanTypography tests passed");
