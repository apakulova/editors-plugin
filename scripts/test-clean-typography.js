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
  [
    "globalThis.cleanTypography = cleanTypography;",
    "globalThis.cleanTypographyWithMetadata = cleanTypographyWithMetadata;",
    "globalThis.restoreTextStyles = restoreTextStyles;",
  ].join(" ")
);
const context = { console, globalThis: {} };

vm.createContext(context);
vm.runInContext(source, context);

const cleanTypography = context.globalThis.cleanTypography;
const cleanTypographyWithMetadata = context.globalThis.cleanTypographyWithMetadata;
const restoreTextStyles = context.globalThis.restoreTextStyles;
const developmentOptions = {
  mode: "development",
  processHiddenNodes: false,
  processLockedNodes: false,
};
const beautyOptions = {
  mode: "beauty",
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

  assert.strictEqual(first.text, expected, `${input} first development run`);
  assert.strictEqual(secondWithMarkers.text, expected, `${input} second development run with marker indexes`);
}

function expectDevelopmentStableWithoutMarkers(input, expected = input) {
  const actual = cleanTypographyWithMetadata(input, developmentOptions);

  assert.strictEqual(actual.text, expected, `${input} development run without marker indexes`);
}

expectClean(
  "Она спросила \"как дела?\". Я подумала \"ну всё... приехали!\". \"Она сказала: \"Я приду завтра!\"\".",
  `Она спросила «как дела?» Я${NBSP}подумала «ну${NBSP}всё… приехали!» «Она сказала: „Я${NBSP}приду завтра!“»`
);
expectClean("«Она сказала: „Я приду завтра!“»", `«Она сказала: „Я${NBSP}приду завтра!“»`);
expectClean("»Она сказала: „Я приду завтра!“»", `«Она сказала: „Я${NBSP}приду завтра!“»`);
expectClean("«Она сказала: “Я приду завтра!“»", `«Она сказала: „Я${NBSP}приду завтра!“»`);
expectClean("«Она сказала: „Я приду завтра!„»", `«Она сказала: „Я${NBSP}приду завтра!“»`);
expectClean("\"Она сказала: \"Я приду завтра!\"\"", `«Она сказала: „Я${NBSP}приду завтра!“»`);
expectClean("The word \"привет\" means hello.", 'The word "привет" means hello.');
expectClean("The word «привет» means hello.", 'The word "привет" means hello.');
expectClean("Кнопка называется \"Start\".", "Кнопка называется «Start».");
expectClean('Он сказал "Use \'clean typography\' mode".', `Он${NBSP}сказал «Use „clean typography“ mode».`);
expectClean('He said "Use "clean typography" mode".', 'He said "Use \'clean typography\' mode".');
expectClean('He said "Use \'clean typography\' mode".', 'He said "Use \'clean typography\' mode".');
expectClean('He said "The word "привет" means hello".', 'He said "The word \'привет\' means hello".');
expectClean("Что?? Да!! Правда!?", "Что? Да! Правда?!");
expectDevelopmentIdempotent("«Она сказала: „Я приду завтра!“»", "«Она сказала: „Я*приду завтра!“»");
expectDevelopmentIdempotent("«Ты правда спросил „зачем??“»", "«Ты*правда спросил „зачем?“»");
expectDevelopmentIdempotent("«„Как это скучно!“ — воскликнул я невольно».", "«„Как это скучно!“*— воскликнул я*невольно».");
expectDevelopmentIdempotent(`Он*сказал "Use 'clean typography' mode".`, `Он*сказал «Use „clean typography“ mode».`);
expectDevelopmentIdempotent(`Он*сказал*"Use*'clean typography'*mode".`, `Он*сказал*«Use*„clean typography“*mode».`);
expectDevelopmentIdempotent(`He*said*"Use*'clean typography'*mode".`, `He*said*"Use*'clean typography'*mode".`);

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
expectClean("Статус => готово", "Статус → готово");
expectClean("Назад -> вперёд", "Назад → вперёд");
expectClean("Формула: 2 * 2 = 4.", `Формула: 2${NBSP}${MULTIPLY}${NBSP}2${NBSP}=${NBSP}4.`);
expectClean("Формула: 2*2=4.", `Формула: 2${NBSP}${MULTIPLY}${NBSP}2${NBSP}=${NBSP}4.`);
expectClean("Обязательное поле *.", "Обязательное поле *.");
expectClean("Сноска * см. ниже.", "Сноска * см. ниже.");
expectClean("Пароль: **** 1234.", "Пароль: **** 1234.");

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
expectClean("Встреча 15 завтра.", `Встреча 15${NBSP}завтра.`);
expectClean("По 2000 человек", `По${NBSP}2${NBSP}000${NBSP}человек`);
expectClean("В базе 10000 клиентов.", `В${NBSP}базе 10${NBSP}000${NBSP}клиентов.`);
expectClean("Продано 1234567 билетов", `Продано 1${NBSP}234${NBSP}567${NBSP}билетов`);
expectClean("812345678901234 клиентов", `812${NBSP}345${NBSP}678${NBSP}901${NBSP}234${NBSP}клиентов`);
expectClean("по 10000 человек", `по${NBSP}10${NBSP}000${NBSP}человек`);
expectClean("д. 10000 корпус", `д.${NBSP}10${NBSP}000 корпус`);
expectClean("г. 10000 жителей", `г.${NBSP}10${NBSP}000 жителей`);
expectClean("в д. 5 живёт", `в${NBSP}д.${NBSP}5 живёт`);
expectClean("№ 10000 заявок", `№${NBSP}10000 заявок`);
expectClean("§ 10000 пунктов", `§${NBSP}10000 пунктов`);
expectClean("Позвоните +7 (900) 123-45-67 завтра", `Позвоните +7${NBSP}900${NBSP}123${NB_HYPHEN}45${NB_HYPHEN}67 завтра`);
expectClean("30 сентября", `30${NBSP}сентября`);
expectClean("далеко ли холодно ли стало", `далеко${NBSP}ли холодно${NBSP}ли стало`);
expectClean("он же сказал бы", `он${NBSP}же сказал${NBSP}бы`);
expectClean("Это же не баг, а фича ли?", `Это${NBSP}же не${NBSP}баг, а${NBSP}фича${NBSP}ли?`);
expectClean("ли стало холодно", "ли стало холодно");
expectClean("№ 12 345 изменился.", `№${NBSP}12 345 изменился.`);
expectClean("Номер заказа № 79001234567.", `Номер заказа №${NBSP}79001234567.`);
expectClean("§ 12 применяется.", `§${NBSP}12 применяется.`);
expectClean("№, это не номер.", `№, это не${NBSP}номер.`);
expectClean("Дом № 5 стоит рядом.", `Дом №${NBSP}5 стоит рядом.`);
expectClean("См. § 100 000.", `См. §${NBSP}100 000.`);
expectClean("© 2025 по 2026 год идёт тест.", `©${NBSP}2025 по${NBSP}2026 год идёт тест.`);
expectClean("©2025", `©${NBSP}2025`);
expectClean("Подписка 5000 ₽/мес. Следующий платёж завтра.", `Подписка 5${NBSP}000${NBSP}₽/мес. Следующий платёж завтра.`);
expectClean("Подписка 5000 ₽/мес.", `Подписка 5${NBSP}000${NBSP}₽/мес`);
expectClean("Вес 1.5 кг. Доставим завтра.", `Вес 1,5${NBSP}кг. Доставим завтра.`);
expectClean("Вес 1.5 кг.", `Вес 1,5${NBSP}кг`);
expectClean("Длина 10.04 м. Это стандартный размер.", `Длина 10,04${NBSP}м. Это стандартный размер.`);
expectClean("Длина 10.04 м.", `Длина 10,04${NBSP}м`);
expectClean("Доход 100 млн. Компания растёт.", `Доход 100${NBSP}млн. Компания растёт.`);
expectClean("Выручка 5 млрд. Это прогноз.", `Выручка 5${NBSP}млрд. Это прогноз.`);
expectClean("Срок 6 мес. Потом продлим.", `Срок 6${NBSP}мес. Потом продлим.`);
expectClean("Подписка 5000 ₽/мес доступна всем.", `Подписка 5${NBSP}000${NBSP}₽/мес доступна всем.`);
expectClean("Доход 100 млн. рублей.", `Доход 100${NBSP}млн рублей.`);
expectClean("Выручка 5 млрд. рублей.", `Выручка 5${NBSP}млрд рублей.`);
expectClean("Размер 10 см. в ширину.", `Размер 10${NBSP}см в${NBSP}ширину.`);
expectClean("Вес 5 кг. товара.", `Вес 5${NBSP}кг товара.`);
expectClean("Объём 5 мл.", `Объём 5${NBSP}мл`);
expectClean("Время 10 с.", `Время 10${NBSP}с`);
expectClean("100 руб", `100${NBSP}руб.`);
expectClean("20 коп", `20${NBSP}коп.`);
expectClean("Стоимость 100 руб. Оплата завтра.", `Стоимость 100${NBSP}руб. Оплата завтра.`);
expectClean("д. 5, стр. 10, кв. 7", `д.${NBSP}5, стр.${NBSP}10, кв.${NBSP}7`);
expectClean("Дом д 5, страница стр 10, квартира кв 7", `Дом д.${NBSP}5, страница стр.${NBSP}10, квартира кв.${NBSP}7`);
expectClean("Площадь 20 кв м", `Площадь 20${NBSP}кв.${NBSP}м`);
expectClean("Выручка 10 млн", `Выручка 10${NBSP}млн`);
expectClean("Доход 100 млн и 5 млрд.", `Доход 100${NBSP}млн и${NBSP}5${NBSP}млрд`);
expectClean("Выручка 10 млн.\nНужно увеличить на 5%", `Выручка 10${NBSP}млн\nНужно увеличить на${NBSP}5%`);
expectClean("Выручка 10 млн. Нужно увеличить на 5%", `Выручка 10${NBSP}млн. Нужно увеличить на${NBSP}5%`);
expectDevelopmentIdempotent(`Цена 2${NBSP}000,35${NBSP}₽.`, "Цена 2*000,35*₽.");
expectDevelopmentIdempotent("В базе 10000 клиентов.", "В*базе 10*000*клиентов.");
expectDevelopmentIdempotent("далеко ли холодно ли стало", "далеко*ли холодно*ли стало");
expectDevelopmentIdempotent("Это же не баг, а фича ли?", "Это*же не*баг, а*фича*ли?");
expectDevelopmentIdempotent("Доход 100 млн и 5 млрд.", "Доход 100*млн и*5*млрд");
expectDevelopmentIdempotent("Формула: 2 * 2 = 4.", `Формула: 2*${MULTIPLY}*2*=*4.`);
expectDevelopmentIdempotent("Формула: 2*2=4.", `Формула: 2*${MULTIPLY}*2*=*4.`);
expectDevelopmentStableWithoutMarkers("Цена 1*000*₽.");
expectDevelopmentStableWithoutMarkers(`Позвоните: +7*900*123${NB_HYPHEN}45${NB_HYPHEN}67.`);
expectDevelopmentStableWithoutMarkers(`Или так: 8*900*123${NB_HYPHEN}45${NB_HYPHEN}67.`);
expectDevelopmentStableWithoutMarkers("Цена не*телефон: 79*001*234*567*₽.");
expectDevelopmentStableWithoutMarkers("Длинное число: 812*345*678*901*234.");
expectDevelopmentStableWithoutMarkers("№*12 345 изменился.", "№*12 345 изменился.");
expectDevelopmentIdempotent("Номер заказа № 79001234567.", "Номер заказа №*79001234567.");
expectDevelopmentStableWithoutMarkers("Номер заказа №*79001234567.", "Номер заказа №*79001234567.");
expectDevelopmentStableWithoutMarkers("§*12 применяется.", "§*12 применяется.");
expectDevelopmentStableWithoutMarkers("Дом №*5 стоит рядом.", "Дом №*5 стоит рядом.");
expectDevelopmentStableWithoutMarkers("©*2025 по*2026 год идёт тест.", "©*2025 по*2026 год идёт тест.");
expectDevelopmentStableWithoutMarkers("©*2*025 по*2026 год идёт тест.", "©*2025 по*2026 год идёт тест.");
expectDevelopmentStableWithoutMarkers(`Номер заказа №*+7*900*123${NB_HYPHEN}45${NB_HYPHEN}67.`, `Номер заказа №*+7*900*123${NB_HYPHEN}45${NB_HYPHEN}67.`);
expectDevelopmentStableWithoutMarkers("Номер заказа №*+79001234567.", "Номер заказа №*+79001234567.");

const development = cleanTypographyWithMetadata("2 * 2 = 4", developmentOptions);
const developmentToBeauty = cleanTypographyWithMetadata(development.text, beautyOptions, development.developmentMarkerIndexes);
const textDevelopment = cleanTypographyWithMetadata("В базе 10000 клиентов.", developmentOptions);
const textDevelopmentToBeauty = cleanTypographyWithMetadata(textDevelopment.text, beautyOptions, textDevelopment.developmentMarkerIndexes);
const developmentWithoutMarkers = cleanTypographyWithMetadata("Формула: 2*×*2*=*4.", developmentOptions);

assert.strictEqual(development.text, "2*\u00D7*2*=*4");
assert.deepStrictEqual(Array.from(development.developmentMarkerIndexes), [1, 3, 5, 7]);
assert.strictEqual(developmentToBeauty.text, `2${NBSP}${MULTIPLY}${NBSP}2${NBSP}=${NBSP}4`);
assert.strictEqual(textDevelopmentToBeauty.text, `В${NBSP}базе 10${NBSP}000${NBSP}клиентов.`);
assert.strictEqual(developmentWithoutMarkers.text, "Формула: 2*×*2*=*4.");

{
  const calls = [];
  const textNode = {
    characters: "Пункт списка",
    setRangeFills: (start, end, value) => calls.push(["fills", start, end, value]),
    setRangeFontName: (start, end, value) => calls.push(["fontName", start, end, value]),
    setRangeFontSize: (start, end, value) => calls.push(["fontSize", start, end, value]),
    setRangeIndentation: (start, end, value) => calls.push(["indentation", start, end, value]),
    setRangeLetterSpacing: (start, end, value) => calls.push(["letterSpacing", start, end, value]),
    setRangeLineHeight: (start, end, value) => calls.push(["lineHeight", start, end, value]),
    setRangeListOptions: (start, end, value) => calls.push(["listOptions", start, end, value]),
    setRangeListSpacing: (start, end, value) => calls.push(["listSpacing", start, end, value]),
    setRangeParagraphIndent: (start, end, value) => calls.push(["paragraphIndent", start, end, value]),
    setRangeParagraphSpacing: (start, end, value) => calls.push(["paragraphSpacing", start, end, value]),
    setRangeTextCase: (start, end, value) => calls.push(["textCase", start, end, value]),
    setRangeTextDecoration: (start, end, value) => calls.push(["textDecoration", start, end, value]),
  };
  const listStyle = {
    characters: "Пункт списка",
    end: 12,
    fills: [],
    fontName: { family: "Inter", style: "Regular" },
    fontSize: 16,
    indentation: 2,
    letterSpacing: { unit: "PERCENT", value: 0 },
    lineHeight: { unit: "AUTO" },
    listOptions: { type: "ORDERED" },
    listSpacing: 8,
    paragraphIndent: 4,
    paragraphSpacing: 12,
    start: 0,
    textCase: "ORIGINAL",
    textDecoration: "NONE",
  };

  restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [listStyle]);

  assert.deepStrictEqual(calls.find(([name]) => name === "listOptions"), ["listOptions", 0, 12, { type: "ORDERED" }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "listSpacing"), ["listSpacing", 0, 12, 8]);
  assert.deepStrictEqual(calls.find(([name]) => name === "indentation"), ["indentation", 0, 12, 2]);
  assert.deepStrictEqual(calls.find(([name]) => name === "paragraphIndent"), ["paragraphIndent", 0, 12, 4]);
  assert.deepStrictEqual(calls.find(([name]) => name === "paragraphSpacing"), ["paragraphSpacing", 0, 12, 12]);
}

console.log("cleanTypography tests passed");
