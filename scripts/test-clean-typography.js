const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const NBSP = "\u00A0";
const NB_HYPHEN = "\u2011";
const EM_DASH = "\u2014";
const MINUS = "\u2212";
const MULTIPLY = "\u00D7";

const source = fs.readFileSync("dist/code.js", "utf8").replace(
  "void run();",
  [
    "globalThis.cleanTypography = cleanTypography;",
    "globalThis.cleanTypographyWithMetadata = cleanTypographyWithMetadata;",
    "globalThis.captureTextStyles = captureTextStyles;",
    "globalThis.getWholeTextStyle = getWholeTextStyle;",
    "globalThis.restoreWholeTextStyle = restoreWholeTextStyle;",
    "globalThis.restoreTextStyles = restoreTextStyles;",
    "globalThis.loadFontsForTextNode = loadFontsForTextNode;",
    "globalThis.getFontLoadPromise = getFontLoadPromise;",
    "globalThis.createAnalyticsEventPayload = createAnalyticsEventPayload;",
    "globalThis.getAnalyticsCaptureEndpoint = getAnalyticsCaptureEndpoint;",
  ].join(" ")
);
const context = {
  console,
  figma: {
    mixed: Symbol("mixed"),
    variables: {
      getVariableByIdAsync: async (id) => ({ id }),
    },
  },
  globalThis: {},
};

vm.createContext(context);
vm.runInContext(source, context);

const cleanTypography = context.globalThis.cleanTypography;
const cleanTypographyWithMetadata = context.globalThis.cleanTypographyWithMetadata;
const captureTextStyles = context.globalThis.captureTextStyles;
const getWholeTextStyle = context.globalThis.getWholeTextStyle;
const restoreWholeTextStyle = context.globalThis.restoreWholeTextStyle;
const restoreTextStyles = context.globalThis.restoreTextStyles;
const loadFontsForTextNode = context.globalThis.loadFontsForTextNode;
const getFontLoadPromise = context.globalThis.getFontLoadPromise;
const createAnalyticsEventPayload = context.globalThis.createAnalyticsEventPayload;
const getAnalyticsCaptureEndpoint = context.globalThis.getAnalyticsCaptureEndpoint;
const developmentOptions = {
  mode: "development",
  processHiddenNodes: false,
  processLockedNodes: false,
  recolorExistingAsterisks: false,
};
const developmentRecolorOptions = {
  mode: "development",
  processHiddenNodes: false,
  processLockedNodes: false,
  recolorExistingAsterisks: true,
};
const beautyOptions = {
  mode: "beauty",
  processHiddenNodes: false,
  processLockedNodes: false,
  recolorExistingAsterisks: false,
};

assert.strictEqual(getAnalyticsCaptureEndpoint(), "https://eu.i.posthog.com/i/v0/e/");

const analyticsPayload = createAnalyticsEventPayload(
  "plugin_run_started",
  { mode: "default", source: "quick_run" },
  {
    anonymousId: "anon_test",
    distinctId: "anon_test",
    identityType: "anonymous",
    userId: null,
  },
  "2026-06-08T10:15:00.000Z"
);

assert.strictEqual(analyticsPayload.timestamp, "2026-06-08T10:15:00.000Z");
assert.strictEqual(Object.prototype.hasOwnProperty.call(analyticsPayload, "uuid"), false);
assert.strictEqual(analyticsPayload.distinct_id, "anon_test");
assert.strictEqual(analyticsPayload.properties.$process_person_profile, false);
assert.strictEqual(analyticsPayload.properties.$geoip_disable, true);
assert.strictEqual(analyticsPayload.properties.mode, "default");

function runStyleCaptureTests() {
  const baseSegment = {
    characters: "Заголовок",
    end: 9,
    fillStyleId: "",
    start: 0,
    textStyleId: "",
  };
  const nodeStyleFallback = {
    characters: "Заголовок",
    fillStyleId: "node-fill-style-id",
    getRangeFillStyleId: () => "",
    getRangeTextStyleId: () => "",
    getStyledTextSegments: () => [baseSegment],
    id: "node-style-fallback",
    textStyleId: "node-text-style-id",
  };

  const nodeCapturedStyles = captureTextStyles(nodeStyleFallback);

  assert.strictEqual(nodeCapturedStyles.length, 1);
  assert.strictEqual(nodeCapturedStyles[0].fillStyleId, "node-fill-style-id");
  assert.strictEqual(nodeCapturedStyles[0].textStyleId, "node-text-style-id");

  const rangeStyleFallback = {
    characters: "Заголовок",
    fillStyleId: context.figma.mixed,
    getRangeFillStyleId: () => "range-fill-style-id",
    getRangeTextStyleId: () => "range-text-style-id",
    getStyledTextSegments: () => [baseSegment],
    id: "range-style-fallback",
    textStyleId: context.figma.mixed,
  };

  const rangeCapturedStyles = captureTextStyles(rangeStyleFallback);

  assert.strictEqual(rangeCapturedStyles.length, 1);
  assert.strictEqual(rangeCapturedStyles[0].fillStyleId, "range-fill-style-id");
  assert.strictEqual(rangeCapturedStyles[0].textStyleId, "range-text-style-id");
}

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
expectClean('Он сказал "привет...".', `Он${NBSP}сказал «привет…».`);
expectClean('Он сказал "привет"...', `Он${NBSP}сказал «привет»…`);
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

expectClean("10-20", `10${EM_DASH}20`);
expectClean("10 - 20", `10${EM_DASH}20`);
expectClean("10 – 20", `10${EM_DASH}20`);
expectClean("5 - 5", `5${EM_DASH}5`);
expectClean("5-10 кг", `5${EM_DASH}10${NBSP}кг`);
expectClean("5 – 10 кг", `5${EM_DASH}10${NBSP}кг`);
expectClean("5 — 10 кг", `5${EM_DASH}10${NBSP}кг`);
expectClean("2-5 ноября", `2${EM_DASH}5${NBSP}ноября`);
expectClean("2 – 5 ноября", `2${EM_DASH}5${NBSP}ноября`);
expectClean("2 — 5 ноября", `2${EM_DASH}5${NBSP}ноября`);
expectClean("12:25-13:35", `12:25${EM_DASH}13:35`);
expectClean("12:25 – 13:35", `12:25${EM_DASH}13:35`);
expectClean("12:25 — 13:35", `12:25${EM_DASH}13:35`);
expectClean("30.04-12.05", `30.04${EM_DASH}12.05`);
expectClean("30.04 – 12.05", `30.04${EM_DASH}12.05`);
expectClean("30.04 — 12.05", `30.04${EM_DASH}12.05`);
expectClean(`Период отпуска: 30.04${NBSP}— 12.05.`, `Период отпуска: 30.04${EM_DASH}12.05.`);
expectClean("2001-2019", `2001${EM_DASH}2019`);
expectClean("2001 – 2019", `2001${EM_DASH}2019`);
expectClean("2001 — 2019", `2001${EM_DASH}2019`);
expectClean("X-XI век", `X${EM_DASH}XI век`);
expectClean("X – XI век", `X${EM_DASH}XI век`);
expectClean("X—XI век", `X${EM_DASH}XI век`);
expectClean("I - III главы", `I${EM_DASH}III главы`);
expectClean("II-IV квартал", `II${EM_DASH}IV квартал`);
expectClean("в X-XI веках", `в${NBSP}X${EM_DASH}XI веках`);
expectClean("главы I-III", `главы I${EM_DASH}III`);
expectClean("разделы IV-VI", `разделы IV${EM_DASH}VI`);
expectClean("кв. I-II", `кв. I${EM_DASH}II`);
expectClean("2 000-4 000", `2${NBSP}000${NBSP}— 4${NBSP}000`);
expectClean("2 000–4 000", `2${NBSP}000${NBSP}— 4${NBSP}000`);
expectClean("2 000—4 000", `2${NBSP}000${NBSP}— 4${NBSP}000`);
expectClean("02.02.2012-05.05.2013", `02.02.2012${NBSP}— 05.05.2013`);
expectClean("02.02.2012 – 05.05.2013", `02.02.2012${NBSP}— 05.05.2013`);
expectClean("02.02.2012—05.05.2013", `02.02.2012${NBSP}— 05.05.2013`);
expectClean("Период акции: 02.02.2012-05.05.2013.", `Период акции: 02.02.2012${NBSP}— 05.05.2013.`);
expectClean("1 января-15 августа 2018 года", `1${NBSP}января${NBSP}— 15${NBSP}августа 2018 года`);
expectClean("1 января – 15 августа 2018 года", `1${NBSP}января${NBSP}— 15${NBSP}августа 2018 года`);
expectClean("1 января—15 августа 2018 года", `1${NBSP}января${NBSP}— 15${NBSP}августа 2018 года`);
expectClean(`Период отчёта: 15${NBSP}мая 2024—20${NBSP}июня 2${NBSP}025.`, `Период отчёта: 15${NBSP}мая 2024${NBSP}— 20${NBSP}июня 2025.`);
expectClean(`Период: I квартал 2024-IV квартал 2${NBSP}025.`, `Период: I квартал 2024${NBSP}— IV квартал 2025.`);
expectClean("2016-н. в.", `2016${NBSP}— н.${NBSP}в.`);
expectClean("2016 – н. в.", `2016${NBSP}— н.${NBSP}в.`);
expectClean("2016—н. в.", `2016${NBSP}— н.${NBSP}в.`);
expectClean("2016—наст. вр.", `2016${NBSP}— наст. вр.`);
expectClean("Диапазон ставок: 12,5%-15,75%.", `Диапазон ставок: 12,5${EM_DASH}15,75%.`);
expectClean("Диапазон ставок: 12,5%–15,75%.", `Диапазон ставок: 12,5${EM_DASH}15,75%.`);
expectClean("Диапазон ставок: 12,5%—15,75%.", `Диапазон ставок: 12,5${EM_DASH}15,75%.`);
expectClean("Диапазон ставок: 12,5%−15,75%.", `Диапазон ставок: 12,5${EM_DASH}15,75%.`);
expectClean("Скидка 5%, скидки 7%, скидке 9%, скидку 10%, скидкой 15%, скидкою 20%.", `Скидка${NBSP}5%, скидки${NBSP}7%, скидке${NBSP}9%, скидку${NBSP}10%, скидкой${NBSP}15%, скидкою${NBSP}20%.`);
expectClean("Скидка 5—10% зависит от категории.", `Скидка${NBSP}5${EM_DASH}10% зависит от${NBSP}категории.`);
expectClean("Скидка 5-10% зависит от категории.", `Скидка${NBSP}5${EM_DASH}10% зависит от${NBSP}категории.`);
expectClean("Кэшбэк 5%, кэшбэка 7%, кэшбэку 9%, кэшбэком 10%, кэшбэке 15%.", `Кэшбэк${NBSP}5%, кэшбэка${NBSP}7%, кэшбэку${NBSP}9%, кэшбэком${NBSP}10%, кэшбэке${NBSP}15%.`);
expectClean("Кешбэк 5%, кешбэка 7%, кешбэку 9%, кешбэком 10%, кешбэке 15%.", `Кешбэк${NBSP}5%, кешбэка${NBSP}7%, кешбэку${NBSP}9%, кешбэком${NBSP}10%, кешбэке${NBSP}15%.`);
expectClean("Ставка 5%, ставки 7%, ставке 9%, ставку 10%, ставкой 15%.", `Ставка${NBSP}5%, ставки${NBSP}7%, ставке${NBSP}9%, ставку${NBSP}10%, ставкой${NBSP}15%.`);
expectClean("Комиссия 5%, комиссии 7%, комиссию 9%, комиссией 10%.", `Комиссия${NBSP}5%, комиссии${NBSP}7%, комиссию${NBSP}9%, комиссией${NBSP}10%.`);
expectClean("Доходность 5%, доходности 7%, доходностью 9%.", `Доходность${NBSP}5%, доходности${NBSP}7%, доходностью${NBSP}9%.`);
expectClean("Рассрочка 5%, рассрочки 7%, рассрочке 9%, рассрочку 10%, рассрочкой 15%.", `Рассрочка${NBSP}5%, рассрочки${NBSP}7%, рассрочке${NBSP}9%, рассрочку${NBSP}10%, рассрочкой${NBSP}15%.`);
expectClean("Налог 5%, налога 7%, налогу 9%, налогом 10%, налоге 15%, НДС 20%.", `Налог${NBSP}5%, налога${NBSP}7%, налогу${NBSP}9%, налогом${NBSP}10%, налоге${NBSP}15%, НДС${NBSP}20%.`);
expectClean("Оборот 7%, sale 5%, антискидка 5%, супер-скидка 5%, ставка 5—10%.", `Оборот 7%, sale 5%, антискидка 5%, супер‑скидка 5%, ставка${NBSP}5—10%.`);
expectClean("Температура: +5-+10 C", `Температура: +5…+10${NBSP}°C`);
expectClean("Температура: +5...+10 °C", `Температура: +5…+10${NBSP}°C`);
expectClean("Температура: -5 – -10 °C", `Температура: ${MINUS}5…${MINUS}10${NBSP}°C`);
expectClean("Температура: +5—+10 F", `Температура: +5…+10${NBSP}°F`);
expectClean("Температура: -5...+10 °C", `Температура: ${MINUS}5…+10${NBSP}°C`);
expectClean("Температура: +5 — -10 °C", `Температура: +5…${MINUS}10${NBSP}°C`);
expectClean("x-xi", `x${NB_HYPHEN}xi`);
expectClean("USB-C", `USB${NB_HYPHEN}C`);
expectClean("A-B тест", `A${NB_HYPHEN}B тест`);
expectClean("B2B", "B2B");
expectClean("M-Video", `M${NB_HYPHEN}Video`);
expectClean("X-ray", `X${NB_HYPHEN}ray`);
expectClean("план B-C", `план B${NB_HYPHEN}C`);
expectClean("X-X", `X${NB_HYPHEN}X`);
expectClean("из за угла", `из${NB_HYPHEN}за угла`);
expectClean("из под стола", `из${NB_HYPHEN}под стола`);
expectClean("кто то пришёл", `кто${NB_HYPHEN}то пришёл`);
expectClean("что либо ещё", `что${NB_HYPHEN}либо ещё`);
expectClean("где нибудь рядом", `где${NB_HYPHEN}нибудь рядом`);
expectClean("кое как сделали", `кое${NB_HYPHEN}как сделали`);
expectClean("все таки получилось", `все${NB_HYPHEN}таки получилось`);
expectClean("всё таки получилось", `всё${NB_HYPHEN}таки получилось`);

expectClean("10 - 5 = 5", `10${NBSP}${MINUS}${NBSP}5${NBSP}=${NBSP}5`);
expectClean("10 - 5 + 2", `10${NBSP}${MINUS}${NBSP}5${NBSP}+${NBSP}2`);
expectClean("10 - 5 - 2", `10${NBSP}${MINUS}${NBSP}5${NBSP}${MINUS}${NBSP}2`);
expectClean("-10 - 5", `${MINUS}10${NBSP}${MINUS}${NBSP}5`);
expectClean("-10 + 5 = -5", `${MINUS}10${NBSP}+${NBSP}5${NBSP}=${NBSP}${MINUS}5`);
expectClean("100% - 7%", `100%${NBSP}${MINUS}${NBSP}7%`);

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
expectClean("Пароль: ****-1234.", "Пароль: ****-1234.");
expectClean("Пароль: ****−1*234.", "Пароль: ****−1*234.");
expectClean("Пароль: ****-1*234.", "Пароль: ****-1*234.");
expectClean("карта****4444", "карта****4444");
expectClean("карта ****4444", "карта ****4444");

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
expectClean("№ 123-45", `№${NBSP}123-45`);
expectClean("AB-123", "AB-123");
expectClean("Серия АА-123456", "Серия АА-123456");
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
expectClean("знал б ты, как хороши", `знал${NBSP}б ты, как хороши`);
expectClean("всё ж красиво", `всё${NBSP}ж красиво`);
expectClean("можно ль иначе", `можно${NBSP}ль иначе`);
expectClean("Это же не баг, а фича ли?", `Это${NBSP}же не${NBSP}баг, а${NBSP}фича${NBSP}ли?`);
expectClean("ли стало холодно", "ли стало холодно");
expectClean("ль стало понятно", "ль стало понятно");
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
expectClean("Те", "Те");
expectClean("те?", "те?");
expectClean("т.е. пример", `т.${NBSP}е. пример`);
expectClean("т е пример", `т.${NBSP}е. пример`);
expectClean("Т. е. пример", `Т.${NBSP}е. пример`);
expectClean("Т е пример", `Т.${NBSP}е. пример`);
expectClean("ТК пример", `ТК${NBSP}пример`);
expectClean("Период: НВ", "Период: НВ");
expectClean("PS", `P.${NBSP}S.`);
expectClean("P.S. Проверь ещё раз.", `P.${NBSP}S. Проверь ещё раз.`);
expectClean("P P S проверь ещё раз.", `P.${NBSP}P.${NBSP}S. проверь ещё раз.`);
expectClean("Список, в т ч важные пункты", `Список, в${NBSP}т.${NBSP}ч. важные пункты`);
expectClean("Период: н. в.", `Период: н.${NBSP}в.`);
expectClean("ж/д билеты", `ж/д${NBSP}билеты`);
expectClean("ж/д. билеты", `ж/д${NBSP}билеты`);
expectClean("Кешбэк за покупку ж/д билетов, оплату проезда в метро", `Кешбэк за${NBSP}покупку${NBSP}ж/д${NBSP}билетов, оплату проезда в${NBSP}метро`);
expectClean("д/к фильм", `д/к${NBSP}фильм`);
expectClean("п/п платеж", `п/п${NBSP}платеж`);
expectClean("а/д дорога", `а/д${NBSP}дорога`);
expectClean("руб/мес тариф", "руб/мес тариф");
expectClean("кв/м площадь", `кв/м${NBSP}площадь`);
expectClean("руб/кв. м", `руб/кв.${NBSP}м`);
expectClean("руб./кв. м", `руб/кв.${NBSP}м`);
expectClean("100 руб/кв. м", `100${NBSP}руб/кв.${NBSP}м`);
expectClean("см ниже, гл 2, илл 3, ст 12, п 4", "см. ниже, гл. 2, илл. 3, ст. 12, п. 4");
expectClean("обл Московская, кр 1, пос Северный, пер Лесной, пр Мира", "обл. Московская, кр. 1, пос. Северный, пер. Лесной, пр. Мира");
expectClean("просп Ленина, пл Победы, бул Солнечный, наб Реки, ш Энтузиастов, туп Южный", "просп. Ленина, пл. Победы, бул. Солнечный, наб. Реки, ш. Энтузиастов, туп. Южный");
expectClean("оф 12, комн 3, под 2, мкр Северный, уч 4", "оф. 12, комн. 3, под. 2, мкр. Северный, уч. 4");
expectClean("вл 5, влад 7, корп 2, эт 10, пгт Новый", "вл. 5, влад. 7, корп. 2, эт. 10, пгт. Новый");
expectClean("под столом", "под столом");
expectClean("Адрес: пр-т Мира, б-р Цветной.", `Адрес: пр${NB_HYPHEN}т Мира, б${NB_HYPHEN}р Цветной.`);
expectClean("Адрес: пр-т. Мира, б-р. Цветной.", `Адрес: пр${NB_HYPHEN}т Мира, б${NB_HYPHEN}р Цветной.`);
expectClean("Длина 5 см", `Длина 5${NBSP}см`);
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
expectDevelopmentIdempotent("знал б ты, всё ж можно ль иначе", "знал*б ты, всё*ж можно*ль иначе");
expectDevelopmentIdempotent("Это же не баг, а фича ли?", "Это*же не*баг, а*фича*ли?");
expectDevelopmentIdempotent("Доход 100 млн и 5 млрд.", "Доход 100*млн и*5*млрд");
expectDevelopmentIdempotent("Формула: 2 * 2 = 4.", `Формула: 2*${MULTIPLY}*2*=*4.`);
expectDevelopmentIdempotent("Формула: 2*2=4.", `Формула: 2*${MULTIPLY}*2*=*4.`);
expectDevelopmentIdempotent("Формула 2*2=4", `Формула 2*${MULTIPLY}*2*=*4`);
expectDevelopmentIdempotent("2*2,", `2*${MULTIPLY}*2,`);
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
const existingAsteriskRecolored = cleanTypographyWithMetadata("в*дом", developmentRecolorOptions);
const existingAsteriskRecoloredToBeauty = cleanTypographyWithMetadata(existingAsteriskRecolored.text, beautyOptions, existingAsteriskRecolored.developmentMarkerIndexes);
const existingAsteriskWordSpace = cleanTypographyWithMetadata("слово*слово", developmentRecolorOptions);
const existingAsteriskDefault = cleanTypographyWithMetadata("в*дом", developmentOptions);
const existingAsteriskRegularSpace = cleanTypographyWithMetadata("Что*нужно", developmentRecolorOptions);
const existingAsteriskMixedSpaces = cleanTypographyWithMetadata("или*их*комбинации", developmentRecolorOptions);
const existingAsteriskNumberAndShortWord = cleanTypographyWithMetadata("7*дней с*момента", developmentRecolorOptions);
const existingAsteriskDashSpaces = cleanTypographyWithMetadata("Москва*—*столица России. Чистовик*—*плагин.", developmentRecolorOptions);
const existingAsteriskParentheses = cleanTypographyWithMetadata("Есть блок (новая*настройка), который нужно проверить.", developmentRecolorOptions);
const existingAsteriskLongWords = cleanTypographyWithMetadata("проверить*макет, Нужно*проверить, поправить*тексты, отправить*результат", developmentRecolorOptions);
const saleCampaignCode = cleanTypographyWithMetadata("Кампания SALE*2026.", developmentRecolorOptions);
const saleCampaignCodeWithMarker = cleanTypographyWithMetadata("Кампания SALE*2*026.", developmentRecolorOptions, [15]);
const unsafeAsterisks = cleanTypographyWithMetadata("**важно**, Тариф*, A*B", developmentRecolorOptions);
const maskedCardDefault = cleanTypographyWithMetadata("карта****4444", developmentOptions);
const maskedCardRecolor = cleanTypographyWithMetadata("карта****4444", developmentRecolorOptions);
const maskedCardWithSpaceDefault = cleanTypographyWithMetadata("карта ****4444", developmentOptions);
const maskedCardWithSpaceRecolor = cleanTypographyWithMetadata("карта ****4444", developmentRecolorOptions);

assert.strictEqual(development.text, "2*\u00D7*2*=*4");
assert.deepStrictEqual(Array.from(development.developmentMarkerIndexes), [1, 3, 5, 7]);
assert.strictEqual(developmentToBeauty.text, `2${NBSP}${MULTIPLY}${NBSP}2${NBSP}=${NBSP}4`);
assert.strictEqual(textDevelopmentToBeauty.text, `В${NBSP}базе 10${NBSP}000${NBSP}клиентов.`);
assert.strictEqual(developmentWithoutMarkers.text, "Формула: 2*×*2*=*4.");
assert.strictEqual(existingAsteriskRecolored.text, "в*дом");
assert.deepStrictEqual(Array.from(existingAsteriskRecolored.developmentMarkerIndexes), [1]);
assert.strictEqual(existingAsteriskRecoloredToBeauty.text, `в${NBSP}дом`);
assert.strictEqual(existingAsteriskWordSpace.text, "слово слово");
assert.deepStrictEqual(Array.from(existingAsteriskWordSpace.developmentMarkerIndexes), []);
assert.strictEqual(existingAsteriskDefault.text, "в*дом");
assert.deepStrictEqual(Array.from(existingAsteriskDefault.developmentMarkerIndexes), []);
assert.strictEqual(existingAsteriskRegularSpace.text, "Что нужно");
assert.deepStrictEqual(Array.from(existingAsteriskRegularSpace.developmentMarkerIndexes), []);
assert.strictEqual(existingAsteriskMixedSpaces.text, "или их*комбинации");
assert.deepStrictEqual(Array.from(existingAsteriskMixedSpaces.developmentMarkerIndexes), [6]);
assert.strictEqual(existingAsteriskNumberAndShortWord.text, "7*дней с*момента");
assert.deepStrictEqual(Array.from(existingAsteriskNumberAndShortWord.developmentMarkerIndexes), [1, 8]);
assert.strictEqual(existingAsteriskDashSpaces.text, "Москва*— столица России. Чистовик*— плагин.");
assert.deepStrictEqual(Array.from(existingAsteriskDashSpaces.developmentMarkerIndexes), [6, 33]);
assert.strictEqual(existingAsteriskParentheses.text, "Есть блок (новая настройка), который нужно проверить.");
assert.deepStrictEqual(Array.from(existingAsteriskParentheses.developmentMarkerIndexes), []);
assert.strictEqual(existingAsteriskLongWords.text, "проверить макет, Нужно проверить, поправить тексты, отправить результат");
assert.deepStrictEqual(Array.from(existingAsteriskLongWords.developmentMarkerIndexes), []);
assert.strictEqual(saleCampaignCode.text, "Кампания SALE*2026.");
assert.deepStrictEqual(Array.from(saleCampaignCode.developmentMarkerIndexes), []);
assert.strictEqual(saleCampaignCodeWithMarker.text, "Кампания SALE*2026.");
assert.deepStrictEqual(Array.from(saleCampaignCodeWithMarker.developmentMarkerIndexes), []);
assert.strictEqual(unsafeAsterisks.text, "**важно**, Тариф*, A*B");
assert.deepStrictEqual(Array.from(unsafeAsterisks.developmentMarkerIndexes), []);
assert.strictEqual(maskedCardDefault.text, "карта****4444");
assert.deepStrictEqual(Array.from(maskedCardDefault.developmentMarkerIndexes), []);
assert.strictEqual(maskedCardRecolor.text, "карта****4444");
assert.deepStrictEqual(Array.from(maskedCardRecolor.developmentMarkerIndexes), []);
assert.strictEqual(maskedCardWithSpaceDefault.text, "карта ****4444");
assert.deepStrictEqual(Array.from(maskedCardWithSpaceDefault.developmentMarkerIndexes), []);
assert.strictEqual(maskedCardWithSpaceRecolor.text, "карта ****4444");
assert.deepStrictEqual(Array.from(maskedCardWithSpaceRecolor.developmentMarkerIndexes), []);

async function runStyleRestorationTests() {
  const calls = [];
  const textNode = {
    characters: "Пункт списка",
    setRangeFills: (start, end, value) => calls.push(["fills", start, end, value]),
    setRangeFillStyleIdAsync: async (start, end, value) => calls.push(["fillStyleId", start, end, value]),
    setRangeFontName: (start, end, value) => calls.push(["fontName", start, end, value]),
    setRangeFontSize: (start, end, value) => calls.push(["fontSize", start, end, value]),
    setRangeIndentation: (start, end, value) => calls.push(["indentation", start, end, value]),
    setRangeLetterSpacing: (start, end, value) => calls.push(["letterSpacing", start, end, value]),
    setRangeLineHeight: (start, end, value) => calls.push(["lineHeight", start, end, value]),
    setRangeListOptions: (start, end, value) => calls.push(["listOptions", start, end, value]),
    setRangeListSpacing: (start, end, value) => calls.push(["listSpacing", start, end, value]),
    setRangeParagraphIndent: (start, end, value) => calls.push(["paragraphIndent", start, end, value]),
    setRangeParagraphSpacing: (start, end, value) => calls.push(["paragraphSpacing", start, end, value]),
    setRangeBoundVariable: (start, end, field, value) => calls.push(["boundVariable", start, end, field, value]),
    setRangeHyperlink: (start, end, value) => calls.push(["hyperlink", start, end, value]),
    setRangeTextCase: (start, end, value) => calls.push(["textCase", start, end, value]),
    setRangeTextDecoration: (start, end, value) => calls.push(["textDecoration", start, end, value]),
    setRangeTextDecorationColor: (start, end, value) => calls.push(["textDecorationColor", start, end, value]),
    setRangeTextDecorationOffset: (start, end, value) => calls.push(["textDecorationOffset", start, end, value]),
    setRangeTextDecorationSkipInk: (start, end, value) => calls.push(["textDecorationSkipInk", start, end, value]),
    setRangeTextDecorationStyle: (start, end, value) => calls.push(["textDecorationStyle", start, end, value]),
    setRangeTextDecorationThickness: (start, end, value) => calls.push(["textDecorationThickness", start, end, value]),
    setRangeTextStyleIdAsync: async (start, end, value) => calls.push(["textStyleId", start, end, value]),
  };
  const listStyle = {
    boundVariables: {
      fontSize: { id: "font-size-variable-id", type: "VARIABLE_ALIAS" },
    },
    characters: "Пункт списка",
    end: 12,
    fillStyleId: "fill-style-id",
    fills: [],
    fontName: { family: "Inter", style: "Regular" },
    fontSize: 16,
    hyperlink: { type: "URL", value: "https://example.com" },
    indentation: 2,
    letterSpacing: { unit: "PERCENT", value: 0 },
    lineHeight: { unit: "AUTO" },
    listOptions: { type: "ORDERED" },
    listSpacing: 8,
    paragraphIndent: 4,
    paragraphSpacing: 12,
    start: 0,
    textCase: "ORIGINAL",
    textDecoration: "UNDERLINE",
    textDecorationColor: { color: { b: 0, g: 0, r: 0 }, type: "SOLID" },
    textDecorationOffset: { unit: "PIXELS", value: 1 },
    textDecorationSkipInk: true,
    textDecorationStyle: "SOLID",
    textDecorationThickness: { unit: "PIXELS", value: 2 },
    textStyleId: "text-style-id",
    textStyleOverrides: [{ type: "TEXT_DECORATION" }, { type: "HYPERLINK" }],
  };

  await restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [listStyle]);

  assert.deepStrictEqual(calls.find(([name]) => name === "listOptions"), ["listOptions", 0, 12, { type: "ORDERED" }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "listSpacing"), ["listSpacing", 0, 12, 8]);
  assert.deepStrictEqual(calls.find(([name]) => name === "indentation"), ["indentation", 0, 12, 2]);
  assert.deepStrictEqual(calls.find(([name]) => name === "paragraphIndent"), ["paragraphIndent", 0, 12, 4]);
  assert.deepStrictEqual(calls.find(([name]) => name === "paragraphSpacing"), ["paragraphSpacing", 0, 12, 12]);
  assert.deepStrictEqual(calls.find(([name]) => name === "fillStyleId"), ["fillStyleId", 0, 12, "fill-style-id"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textStyleId"), ["textStyleId", 0, 12, "text-style-id"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecoration"), ["textDecoration", 0, 12, "UNDERLINE"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecorationStyle"), ["textDecorationStyle", 0, 12, "SOLID"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecorationOffset"), ["textDecorationOffset", 0, 12, { unit: "PIXELS", value: 1 }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecorationThickness"), ["textDecorationThickness", 0, 12, { unit: "PIXELS", value: 2 }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecorationColor"), ["textDecorationColor", 0, 12, { color: { b: 0, g: 0, r: 0 }, type: "SOLID" }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecorationSkipInk"), ["textDecorationSkipInk", 0, 12, true]);
  assert.deepStrictEqual(calls.find(([name]) => name === "hyperlink"), ["hyperlink", 0, 12, { type: "URL", value: "https://example.com" }]);
  assert.strictEqual(calls.find(([name]) => name === "boundVariable"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "fontName"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "fills"), undefined);
  assert(calls.findIndex(([name]) => name === "fillStyleId") > calls.findIndex(([name]) => name === "textStyleId"));
  assert(calls.findIndex(([name]) => name === "textDecoration") > calls.findIndex(([name]) => name === "textStyleId"));
  assert(calls.findIndex(([name]) => name === "hyperlink") > calls.findIndex(([name]) => name === "textStyleId"));

  calls.length = 0;

  await restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [
    {
      ...listStyle,
      hyperlink: null,
      textDecoration: "NONE",
      textDecorationColor: null,
      textDecorationOffset: null,
      textDecorationSkipInk: null,
      textDecorationStyle: null,
      textDecorationThickness: null,
      textStyleOverrides: [],
    },
  ]);

  assert.deepStrictEqual(calls.find(([name]) => name === "textStyleId"), ["textStyleId", 0, 12, "text-style-id"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "fillStyleId"), ["fillStyleId", 0, 12, "fill-style-id"]);
  assert.strictEqual(calls.find(([name]) => name === "fontName"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "fills"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "textDecoration"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "hyperlink"), undefined);
  assert(calls.findIndex(([name]) => name === "fillStyleId") > calls.findIndex(([name]) => name === "textStyleId"));

  calls.length = 0;

  await restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [
    {
      ...listStyle,
      hyperlink: null,
      textStyleOverrides: [],
    },
  ]);

  assert.deepStrictEqual(calls.find(([name]) => name === "textStyleId"), ["textStyleId", 0, 12, "text-style-id"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecoration"), ["textDecoration", 0, 12, "UNDERLINE"]);
  assert.strictEqual(calls.find(([name]) => name === "hyperlink"), undefined);

  calls.length = 0;

  await restoreTextStyles(textNode, new Array(textNode.characters.length).fill(0), [
    {
      ...listStyle,
      fillStyleId: "",
      textStyleId: "",
      textStyleOverrides: [],
    },
  ]);

  assert.deepStrictEqual(calls.find(([name]) => name === "fontName"), ["fontName", 0, 12, { family: "Inter", style: "Regular" }]);
  assert.deepStrictEqual(calls.find(([name]) => name === "fills"), ["fills", 0, 12, []]);
  assert.deepStrictEqual(calls.find(([name]) => name === "textDecoration"), ["textDecoration", 0, 12, "UNDERLINE"]);
  assert.deepStrictEqual(calls.find(([name]) => name === "boundVariable"), ["boundVariable", 0, 12, "fontSize", { id: "font-size-variable-id" }]);
  assert.strictEqual(calls.find(([name]) => name === "textStyleId"), undefined);
  assert.strictEqual(calls.find(([name]) => name === "fillStyleId"), undefined);
}

async function runWholeTextStyleRestorationTests() {
  const wholeStyle = {
    boundVariables: undefined,
    characters: "Заголовок",
    end: 9,
    fillStyleId: "",
    fills: [],
    fontName: { family: "Inter", style: "Bold" },
    fontSize: 32,
    hyperlink: null,
    indentation: 0,
    letterSpacing: { unit: "PERCENT", value: 0 },
    lineHeight: { unit: "PIXELS", value: 36 },
    listOptions: { type: "NONE" },
    listSpacing: 0,
    paragraphIndent: 0,
    paragraphSpacing: 0,
    start: 0,
    textCase: "ORIGINAL",
    textDecoration: "NONE",
    textDecorationColor: null,
    textDecorationOffset: null,
    textDecorationSkipInk: null,
    textDecorationStyle: null,
    textDecorationThickness: null,
    textStyleId: "heading-style-id",
    textStyleOverrides: [],
  };

  assert.strictEqual(getWholeTextStyle([wholeStyle], "Заголовок"), wholeStyle);
  assert.strictEqual(getWholeTextStyle([{ ...wholeStyle, textStyleOverrides: [{ type: "TEXT_DECORATION" }] }], "Заголовок"), null);
  assert.strictEqual(getWholeTextStyle([{ ...wholeStyle, end: 4 }], "Заголовок"), null);

  const calls = [];
  const textNode = {
    characters: "Заголовок",
    id: "node-id",
    setRangeTextDecoration: (start, end, value) => calls.push(["textDecoration", start, end, value]),
    setFillStyleIdAsync: async (value) => calls.push(["nodeFillStyleId", value]),
    setTextStyleIdAsync: async (value) => calls.push(["nodeTextStyleId", value]),
  };

  await restoreWholeTextStyle(textNode, wholeStyle);

  assert.deepStrictEqual(calls, [["nodeTextStyleId", "heading-style-id"]]);

  calls.length = 0;

  await restoreWholeTextStyle(textNode, {
    ...wholeStyle,
    textDecoration: "UNDERLINE",
  });

  assert.deepStrictEqual(calls, [
    ["nodeTextStyleId", "heading-style-id"],
    ["textDecoration", 0, 9, "UNDERLINE"],
  ]);
}

async function runFontLoadingCacheTests() {
  const loadCalls = [];
  const fontLoadCache = new Map();
  const interRegular = { family: "Inter", style: "Regular" };
  const interBold = { family: "Inter", style: "Bold" };
  const regularNode = {
    characters: "Обычный текст",
    getRangeAllFontNames: () => [interRegular],
    id: "regular-node",
  };
  const mixedNode = {
    characters: "Текст с выделением",
    getRangeAllFontNames: () => [interRegular, interBold, interRegular],
    id: "mixed-node",
  };

  context.figma.loadFontAsync = async (font) => {
    loadCalls.push(`${font.family}\n${font.style}`);
  };

  await loadFontsForTextNode(regularNode, fontLoadCache);
  await loadFontsForTextNode(regularNode, fontLoadCache);
  await loadFontsForTextNode(mixedNode, fontLoadCache);

  assert.deepStrictEqual(loadCalls, ["Inter\nRegular", "Inter\nBold"]);
  assert.strictEqual(fontLoadCache.size, 2);

  let retryAttempts = 0;
  const retryCache = new Map();
  const retryFont = { family: "Retry Font", style: "Regular" };
  context.figma.loadFontAsync = async () => {
    retryAttempts += 1;

    if (retryAttempts === 1) {
      throw new Error("Temporary font load failure");
    }
  };

  await assert.rejects(getFontLoadPromise(retryFont, retryCache), /Temporary font load failure/);
  assert.strictEqual(retryCache.size, 0);

  await getFontLoadPromise(retryFont, retryCache);

  assert.strictEqual(retryAttempts, 2);
  assert.strictEqual(retryCache.size, 1);
}

runStyleCaptureTests();

runStyleRestorationTests()
  .then(runWholeTextStyleRestorationTests)
  .then(runFontLoadingCacheTests)
  .then(() => {
    console.log("cleanTypography tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
