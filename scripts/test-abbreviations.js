const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const NBSP = "\u00A0";

function loadCleanTypography() {
  const compiledSource = fs.readFileSync("dist/code.js", "utf8");
  const source = compiledSource.replace(
    "void run();",
    [
      "globalThis.cleanTypography = cleanTypography;",
      "globalThis.cleanTypographyWithMetadata = cleanTypographyWithMetadata;",
      "globalThis.buildNumberLayerContexts = buildNumberLayerContexts;",
    ].join(" ")
  );
  const testPerformance = { now: () => 0 };
  const context = {
    clearTimeout,
    console,
    globalThis: { performance: testPerformance },
    performance: testPerformance,
    setTimeout,
  };

  vm.createContext(context);
  vm.runInContext(source, context);

  assert.strictEqual(
    typeof context.globalThis.cleanTypography,
    "function",
    "Не удалось получить функцию типографики из dist/code.js"
  );

  return {
    buildNumberLayerContexts: context.globalThis.buildNumberLayerContexts,
    cleanTypography: context.globalThis.cleanTypography,
    cleanTypographyWithMetadata: context.globalThis.cleanTypographyWithMetadata,
  };
}

const {
  buildNumberLayerContexts,
  cleanTypography,
  cleanTypographyWithMetadata,
} = loadCleanTypography();
const failures = [];
let checksCount = 0;

function visible(value) {
  return value
    .replaceAll(NBSP, "⍽")
    .replaceAll("\n", "\\n");
}

function checkExact(name, input, expected) {
  checksCount += 1;
  const actual = cleanTypography(input);

  if (actual !== expected) {
    failures.push(
      `${name}\n  вход:     ${visible(input)}\n  ожидалось: ${visible(expected)}\n  получено:  ${visible(actual)}`
    );
  }

  checksCount += 1;
  const repeated = cleanTypography(expected);

  if (repeated !== expected) {
    failures.push(
      `${name}: повторный запуск\n  вход:     ${visible(expected)}\n  ожидалось: ${visible(expected)}\n  получено:  ${visible(repeated)}`
    );
  }
}

function checkCondition(name, input, condition, expectation) {
  checksCount += 1;
  const actual = cleanTypography(input);

  if (!condition(actual)) {
    failures.push(
      `${name}\n  вход:     ${visible(input)}\n  ожидалось: ${expectation}\n  получено:  ${visible(actual)}`
    );
  }
}

// Общие правила вправе менять обычные пробелы на неразрывные. Отмена адресной
// обработки означает сохранение букв и авторских точек, а не отключение этих правил.
function checkUnchangedExceptNbsp(name, input) {
  const expected = input.replaceAll(NBSP, " ");
  let current = input;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    checksCount += 1;
    const actual = cleanTypography(current);
    if (actual.replaceAll(NBSP, " ") !== expected) {
      failures.push(
        `${name}${attempt === 1 ? ": повторный запуск" : ""}` +
        `\n  вход:     ${visible(current)}\n  ожидалось: ${visible(input)} (допустимы общие неразрывные пробелы)` +
        `\n  получено:  ${visible(actual)}`
      );
    }
    current = actual;
  }
}

function createContextTextNode(id, characters) {
  return {
    characters,
    id,
    layoutPositioning: "AUTO",
    locked: false,
    maxLines: null,
    parent: null,
    removed: false,
    rotation: 0,
    textAutoResize: "WIDTH_AND_HEIGHT",
    textTruncation: "DISABLED",
    type: "TEXT",
    visible: true,
  };
}

function connectHorizontalContext(id, nodes) {
  const parent = {
    children: nodes,
    id,
    layoutMode: "HORIZONTAL",
    layoutWrap: "NO_WRAP",
    locked: false,
    parent: null,
    type: "FRAME",
    visible: true,
  };

  nodes.forEach((node) => {
    node.parent = parent;
  });

  return parent;
}

function checkCrossLayerMoney(name, numberText, abbreviationText, expectedAbbreviation) {
  checksCount += 1;
  const numberNode = createContextTextNode(`${name}-number`, numberText);
  const abbreviationNode = createContextTextNode(`${name}-abbreviation`, abbreviationText);
  connectHorizontalContext(`${name}-parent`, [numberNode, abbreviationNode]);
  const context = buildNumberLayerContexts([numberNode, abbreviationNode]).get(abbreviationNode.id);
  const actual = cleanTypographyWithMetadata(
    abbreviationText,
    {
      mode: "beauty",
      processHiddenNodes: false,
      processLockedNodes: false,
      recolorExistingAsterisks: false,
    },
    [],
    null,
    context ?? null
  ).text;

  if (context?.moneyNumberBefore !== true || actual !== expectedAbbreviation) {
    failures.push(
      `${name}\n  соседние слои: ${visible(numberText)} | ${visible(abbreviationText)}` +
      `\n  ожидалось: moneyNumberBefore=true, ${visible(expectedAbbreviation)}` +
      `\n  получено:  moneyNumberBefore=${String(context?.moneyNumberBefore)}, ${visible(actual)}`
    );
  }

  checksCount += 1;
  abbreviationNode.characters = actual;
  const repeatedContext = buildNumberLayerContexts([numberNode, abbreviationNode]).get(abbreviationNode.id);
  const repeated = cleanTypographyWithMetadata(
    abbreviationNode.characters,
    {
      mode: "beauty",
      processHiddenNodes: false,
      processLockedNodes: false,
      recolorExistingAsterisks: false,
    },
    [],
    null,
    repeatedContext ?? null
  ).text;

  if (repeatedContext?.moneyNumberBefore !== true || repeated !== expectedAbbreviation) {
    failures.push(
      `${name}: повторный запуск в соседних слоях` +
      `\n  ожидалось: moneyNumberBefore=true, ${visible(expectedAbbreviation)}` +
      `\n  получено:  moneyNumberBefore=${String(repeatedContext?.moneyNumberBefore)}, ${visible(repeated)}`
    );
  }
}

// Сокращения перед номером. Здесь зафиксированы все согласованные виды номера,
// но не регистр одиночных сокращений: он пока отдельно не согласован.
[
  ["рис перед целым числом", "рис 5", `рис.${NBSP}5`],
  ["илл перед целым числом", "илл 10", `илл.${NBSP}10`],
  ["гл перед римским числом", "гл IV", `гл.${NBSP}IV`],
  ["стр перед целым числом", "стр 15", `стр.${NBSP}15`],
  ["ст перед вложенным номером", "ст 5.1", `ст.${NBSP}5.1`],
  ["п перед знаком номера", "п № 5", `п.${NBSP}№${NBSP}5`],
  ["рис перед диапазоном", "рис 5-7", `рис.${NBSP}5—7`],
  ["перед номером уже есть точка", "рис. 5", `рис.${NBSP}5`],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

[
  ["рис без номера", "рис хороший", /рис\./],
  ["илл без номера", "илл автора", /илл\./],
  ["гл без номера", "гл книги", /гл\./],
  ["стр без номера", "стр текста", /стр\./],
  ["ст без номера", "ст закона", /ст\./],
  ["п без номера", "п документа", /п\./],
].forEach(([name, input, forbidden]) => {
  checkCondition(name, input, (actual) => !forbidden.test(actual), `нет автоматически добавленной точки: ${forbidden}`);
});

// Сокращения с точкой после числа.
[
  ["тысячи", "10 тыс", `10${NBSP}тыс.`],
  ["минуты", "5 мин", `5${NBSP}мин.`],
  ["месяцы", "6 мес", `6${NBSP}мес.`],
  ["тысячи внутри предложения", "Продали 10 тыс билетов", `Продали 10${NBSP}тыс. билетов`],
  ["минуты внутри предложения", "Подождите 5 мин перед запуском", `Подождите 5${NBSP}мин. перед запуском`],
  ["месяцы внутри предложения", "Срок 6 мес с продлением", `Срок 6${NBSP}мес. с${NBSP}продлением`],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

[
  ["тыс без числа", "тыс причин", /тыс\./],
  ["мин без числа", "мин ожидания", /мин\./],
  ["мес без числа", "мес ожидания", /мес\./],
].forEach(([name, input, forbidden]) => {
  checkCondition(name, input, (actual) => !forbidden.test(actual), `нет автоматически добавленной точки: ${forbidden}`);
});

// Денежные сокращения.
[
  ["рубли после числа", "100 руб", `100${NBSP}руб.`],
  ["копейки после числа", "20 коп", `20${NBSP}коп.`],
  ["денежный диапазон", "100-200 руб", `100—200${NBSP}руб.`],
  ["слитно написанные рубли", "100руб", `100${NBSP}руб.`],
  ["рубли и копейки", "100 руб 20 коп", `100${NBSP}руб. 20${NBSP}коп.`],
  ["рубли с заглавной буквы", "100 Руб", `100${NBSP}Руб.`],
  ["рубли прописными", "100РУБ", `100${NBSP}РУБ.`],
  ["копейки смешанного регистра", "20кОп", `20${NBSP}кОп.`],
  ["составная сумма прописными", "100 РУБ 20 КОП", `100${NBSP}РУБ. 20${NBSP}КОП.`],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

[
  ["руб без числа", "руб текста", /руб\./],
  ["коп без числа", "коп текста", /коп\./],
].forEach(([name, input, forbidden]) => {
  checkCondition(name, input, (actual) => !forbidden.test(actual), `нет автоматически добавленной точки: ${forbidden}`);
});

checkCrossLayerMoney("рубли в соседнем слое", "100", "руб", "руб.");
checkCrossLayerMoney("копейки в соседнем слое", "20", "коп", "коп.");
checkCrossLayerMoney("денежный диапазон в соседнем слое", "100—200", "руб", "руб.");

for (const abbreviation of ["Руб", "РУБ", "рУб", "Коп", "КОП", "кОп"]) {
  checkCrossLayerMoney(`регистр в соседнем денежном слое: ${abbreviation}`, "100", abbreviation, `${abbreviation}.`);
}

for (const [rubles, kopecks] of [["руб", "коп"], ["Руб", "Коп"], ["РУБ", "КОП"], ["рУб", "кОп"], ["руб", "КОП"]]) {
  const nodes = [
    createContextTextNode("compound-rubles-number", "100"),
    createContextTextNode("compound-rubles-abbreviation", rubles),
    createContextTextNode("compound-kopecks-number", "20"),
    createContextTextNode("compound-kopecks-abbreviation", kopecks),
  ];
  connectHorizontalContext("compound-money-parent", nodes);

  for (const pass of [1, 2]) {
    checksCount += 1;
    const contexts = buildNumberLayerContexts(nodes);
    const abbreviationNodes = [nodes[1], nodes[3]];
    const outputs = abbreviationNodes.map((node) =>
      cleanTypographyWithMetadata(
        node.characters,
        {
          mode: "beauty",
          processHiddenNodes: false,
          processLockedNodes: false,
          recolorExistingAsterisks: false,
        },
        [],
        null,
        contexts.get(node.id) ?? null
      ).text
    );

    if (
      contexts.get(nodes[1].id)?.moneyNumberBefore !== true ||
      contexts.get(nodes[3].id)?.moneyNumberBefore !== true ||
      outputs[0] !== `${rubles}.` ||
      outputs[1] !== `${kopecks}.`
    ) {
      failures.push(
        `составная сумма в четырёх соседних слоях (${rubles}, ${kopecks}), запуск ${pass}` +
        `\n  ожидалось: 100 | ${rubles}. | 20 | ${kopecks}.` +
        `\n  получено:  100 | ${visible(outputs[0])} | 20 | ${visible(outputs[1])}`
      );
    }

    abbreviationNodes.forEach((node, index) => { node.characters = outputs[index]; });
  }
}

checksCount += 1;
{
  const leftNumber = createContextTextNode("ambiguous-left-number", "100");
  const abbreviation = createContextTextNode("ambiguous-rub", "руб");
  const rightNumber = createContextTextNode("ambiguous-right-number", "200");
  connectHorizontalContext("ambiguous-money-parent", [leftNumber, abbreviation, rightNumber]);
  const context = buildNumberLayerContexts([leftNumber, abbreviation, rightNumber]).get(abbreviation.id);
  const actual = cleanTypographyWithMetadata(
    abbreviation.characters,
    {
      mode: "beauty",
      processHiddenNodes: false,
      processLockedNodes: false,
      recolorExistingAsterisks: false,
    },
    [],
    null,
    context ?? null
  ).text;

  if (context?.moneyNumberBefore === true || actual !== "руб") {
    failures.push(
      "неоднозначные соседние числа не доказывают денежное сокращение" +
      `\n  соседние слои: 100 | руб | 200` +
      `\n  ожидалось: moneyNumberBefore=false, руб` +
      `\n  получено:  moneyNumberBefore=${String(context?.moneyNumberBefore)}, ${visible(actual)}`
    );
  }
}

function checkUnsafeCrossLayerMoney(name, nodes, abbreviationIndex, configureParent = () => {}) {
  checksCount += 1;
  const parent = connectHorizontalContext(`${name}-parent`, nodes);
  configureParent(parent, nodes[abbreviationIndex]);
  const abbreviation = nodes[abbreviationIndex];
  const context = buildNumberLayerContexts(nodes).get(abbreviation.id);
  const actual = cleanTypographyWithMetadata(
    abbreviation.characters,
    {
      mode: "beauty",
      processHiddenNodes: false,
      processLockedNodes: false,
      recolorExistingAsterisks: false,
    },
    [],
    null,
    context ?? null
  ).text;

  if (context?.moneyNumberBefore === true || actual !== abbreviation.characters) {
    failures.push(
      `${name}\n  ожидалось: денежный контекст не доказан, ${visible(abbreviation.characters)}` +
      `\n  получено:  moneyNumberBefore=${String(context?.moneyNumberBefore)}, ${visible(actual)}`
    );
  }
}

checkUnsafeCrossLayerMoney(
  "посторонний слой разрывает число и рубли",
  [
    createContextTextNode("interrupted-number", "100"),
    createContextTextNode("interrupted-label", "итого"),
    createContextTextNode("interrupted-rub", "руб"),
  ],
  2
);
checkUnsafeCrossLayerMoney(
  "число справа не доказывает рубли",
  [createContextTextNode("right-rub", "руб"), createContextTextNode("right-number", "100")],
  0
);
checkUnsafeCrossLayerMoney(
  "прописное РУБ между двумя числами остаётся неоднозначным",
  [
    createContextTextNode("uppercase-left-number", "100"),
    createContextTextNode("uppercase-rub", "РУБ"),
    createContextTextNode("uppercase-right-number", "200"),
  ],
  1
);
checkUnsafeCrossLayerMoney(
  "число справа не доказывает прописное КОП",
  [createContextTextNode("right-uppercase-kop", "КОП"), createContextTextNode("right-kop-number", "100")],
  0
);
checkUnsafeCrossLayerMoney(
  "код с РУБ не становится денежным сокращением",
  [createContextTextNode("code-rub-number", "100"), createContextTextNode("code-rub", "РУБ_код")],
  1
);
checkUnsafeCrossLayerMoney(
  "вертикальный контейнер не доказывает рубли",
  [createContextTextNode("vertical-number", "100"), createContextTextNode("vertical-rub", "руб")],
  1,
  (parent) => {
    parent.layoutMode = "VERTICAL";
  }
);
checkUnsafeCrossLayerMoney(
  "контейнер с переносом не доказывает рубли",
  [createContextTextNode("wrapped-number", "100"), createContextTextNode("wrapped-rub", "руб")],
  1,
  (parent) => {
    parent.layoutWrap = "WRAP";
  }
);
checkUnsafeCrossLayerMoney(
  "абсолютно расположенный слой не доказывает рубли",
  [createContextTextNode("absolute-number", "100"), createContextTextNode("absolute-rub", "руб")],
  1,
  (_parent, abbreviation) => {
    abbreviation.layoutPositioning = "ABSOLUTE";
  }
);
checkUnsafeCrossLayerMoney(
  "повёрнутый слой не доказывает рубли",
  [createContextTextNode("rotated-number", "100"), createContextTextNode("rotated-rub", "руб")],
  1,
  (_parent, abbreviation) => {
    abbreviation.rotation = 1;
  }
);
checkUnsafeCrossLayerMoney(
  "перенос строки в числовом слое не доказывает рубли",
  [createContextTextNode("multiline-number", "100\n"), createContextTextNode("multiline-rub", "руб")],
  1
);

// После числа эти обозначения пишутся без точки.
const undottedForms = [
  ["млн", "5"],
  ["млрд", "1"],
  ["трлн", "1"],
  ["с", "2"],
  ["м", "5"],
  ["км", "20"],
  ["кг", "5"],
  ["мм", "10"],
  ["см", "1"],
  ["л", "2"],
  ["мл", "200"],
  ["В", "220"],
  ["Вт", "5"],
  ["кВт", "20"],
  ["dpi", "300"],
  ["lpi", "85"],
];

for (const [form, number] of undottedForms) {
  checkExact(`${form} после числа без точки`, `${number} ${form}`, `${number}${NBSP}${form}`);
}

// Регистр слитно написанной физической единицы сохраняется при восстановлении пробела.
[
  ["килограммы прописными без пробела", "5КГ", `5${NBSP}КГ`],
  ["километры с заглавной без пробела", "20Км", `20${NBSP}Км`],
  ["сантиметры смешанного регистра без пробела", "10сМ", `10${NBSP}сМ`],
  ["миллилитры прописными без пробела", "200МЛ", `200${NBSP}МЛ`],
  ["дробные граммы прописными без пробела", "1,5Г", `1,5${NBSP}Г`],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

checkCondition(
  "кг без числа не распознаётся как единица",
  "кг. товара",
  (actual) => actual.includes("кг."),
  "авторская точка сохранена, потому что перед сокращением нет числа"
);
checkExact("см без числа не становится сокращением", "см", "см");
checkExact("авторская форма см. сохраняется", "см.", "см.");
checkCondition("см ниже не становится сокращением", "см ниже", (actual) => !/см\./.test(actual), "форма «см» без точки");
checkCondition("авторское см. ниже сохраняется", "см. ниже", (actual) => /см\./.test(actual), "авторская точка сохранена");

// Точка у форм без точки удаляется только перед доказанным продолжением
// предложения со строчной буквы и сохраняется на неоднозначной границе.
[
  ["единица перед продолжением", "5 кг. товара", `5${NBSP}кг товара`],
  ["масштаб перед продолжением", "5 млн. билетов", `5${NBSP}млн билетов`],
  ["единица перед новым предложением", "5 кг. Доставка завтра", `5${NBSP}кг. Доставка завтра`],
  ["масштаб перед новым предложением", "5 млн. Продолжим", `5${NBSP}млн. Продолжим`],
  ["единица в конце слоя", "Вес — 5 кг.", `Вес${NBSP}— 5${NBSP}кг.`],
  ["масштаб в конце слоя", "Всего 5 млн.", `Всего 5${NBSP}млн.`],
  ["единица перед переносом", "5 кг.\nДоставка", `5${NBSP}кг.\nДоставка`],
  ["масштаб перед переносом", "5 млн.\nПродолжим", `5${NBSP}млн.\nПродолжим`],
  ["прописная единица перед строчной", "5 КГ. товара", `5${NBSP}КГ товара`],
  ["прописная единица перед капсовым продолжением", "5 КГ. ТОВАРА", `5${NBSP}КГ. ТОВАРА`],
  ["прописной масштаб перед капсовым продолжением", "5 МЛН. БИЛЕТОВ", `5${NBSP}МЛН. БИЛЕТОВ`],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

// Граммы, календарный год и срок: фиксируем только явно согласованные примеры,
// не превращая их в общий критерий распознавания любого года или срока.
[
  ["целые граммы", "100 г", `100${NBSP}г`],
  ["дробные граммы", "1,5 г", `1,5${NBSP}г`],
  ["граммы перед продолжением", "Добавьте 1 г. соли", `Добавьте 1${NBSP}г соли`],
  ["граммы в конце предложения", "Вес порции — 1 г.", `Вес порции${NBSP}— 1${NBSP}г.`],
  ["календарный год", "2026 г", `2026${NBSP}г.`],
  ["срок в годах и месяцах", "Срок — 1 г 2 мес", `Срок${NBSP}— 1${NBSP}г. 2${NBSP}мес.`],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

// «гг.» добавляет точку только после диапазона четырёхзначных годов 1000–2999.
// Буквы сокращения сохраняют регистр, а границы и повторная обработка проверяются явно.
[
  ["гг после диапазона", "2020—2024 гг", `2020—2024${NBSP}гг.`],
  ["гг после диапазона с дефисом", "2020-2024 гг", `2020—2024${NBSP}гг.`],
  ["гг после диапазона с коротким тире", "2020–2024 гг", `2020—2024${NBSP}гг.`],
  ["гг после диапазона с минусом", "2020−2024 гг", `2020—2024${NBSP}гг.`],
  ["пробелы вокруг границ диапазона гг", "2020 — 2024 гг", `2020—2024${NBSP}гг.`],
  ["табуляция в диапазоне гг", "2020\t—\t2024\tгг", `2020—2024${NBSP}гг.`],
  ["неразрывные пробелы в исходном диапазоне гг", `2020${NBSP}—${NBSP}2024${NBSP}гг`, `2020—2024${NBSP}гг.`],
  ["слитное гг после диапазона", "2020—2024гг", `2020—2024${NBSP}гг.`],
  ["слитное ГГ после дефиса", "2020-2024ГГ", `2020—2024${NBSP}ГГ.`],
  ["Гг с заглавной буквы", "2020–2024 Гг", `2020—2024${NBSP}Гг.`],
  ["смешанный регистр гГ", "2020 − 2024 гГ", `2020—2024${NBSP}гГ.`],
  ["авторская точка у гг сохраняется", "2020—2024 гг.", `2020—2024${NBSP}гг.`],
  ["авторская точка у ГГ сохраняется", "2020—2024ГГ.", `2020—2024${NBSP}ГГ.`],
  ["нижняя граница годов для гг", "1000—1001 гг", `1000—1001${NBSP}гг.`],
  ["верхняя граница годов для гг", "2998—2999 гг", `2998—2999${NBSP}гг.`],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

[
  ["гг без диапазона", "гг"],
  ["гг перед обычным словом", "гг текст"],
  ["авторское гг. без диапазона", "гг. текст"],
  ["гг после одного года", "2024 гг"],
  ["гг после коротких количеств", "5—10 гг"],
  ["гг после пятизначных количеств", "10000—20000 гг"],
  ["первая граница меньше 1000", "999—2024 гг"],
  ["вторая граница больше 2999", "2020—3000 гг"],
  ["неполные годы с ведущим нулём", "0202—2024 гг"],
  ["четыре цифры внутри более длинного числа", "12020—2024 гг"],
  ["буквы гг внутри слова", "2020—2024 ггода"],
  ["ID перед диапазоном гг", "ID 2020—2024 гг"],
  ["номер перед диапазоном гг", "№ 2020—2024 гг"],
  ["точная защитная подпись перед гг", "номер договора: 2020—2024 гг"],
  ["маска перед диапазоном гг", "••2020—2024 гг"],
  ["код с дефисом перед диапазоном гг", "SALE-2020—2024 гг"],
  ["буква перед первым годом гг", "A2020—2024гг"],
  ["идентификатор с подчёркиванием после гг", "2020—2024гг_код"],
  ["цифра после гг", "2020—2024гг2"],
  ["цифра после авторской точки гг", "2020—2024 гг.2"],
  ["диапазон полных дат не доказывает гг", "10.04.2020 — 12.05.2024 гг"],
  ["вложенная нумерация перед гг", "2020—2024.1 гг"],
  ["косая черта после гг", "2020—2024 гг/ч"],
  ["косая черта перед гг", "2020—2024/гг"],
  ["косая черта перед диапазоном гг", "/2020—2024 гг"],
  ["точка перед фамилией не удваивается", "2020—2024 гг.Иванов"],
  ["точка перед строчным словом не удваивается", "2020—2024 гг.были"],
  ["точка перед цифрами не удваивается", "2020—2024 гг.2025"],
  ["точка перед подчёркиванием не удваивается", "2020—2024 гг._код"],
].forEach(([name, input]) => checkUnchangedExceptNbsp(name, input));

checkExact("диапазон без г не получает гг", "2020—2024", "2020—2024");
checkExact("диапазон с килограммами остаётся количеством", "2020—2024 кг", `2${NBSP}020${NBSP}— 2${NBSP}024${NBSP}кг`);
checkCondition("единственное г не превращается в гг", "2020—2024 г", (actual) => !/гг/i.test(actual), "сокращение гг не создаётся");
for (const input of ["+2020—2024 гг", "−2020—2024 гг"]) {
  checkCondition("знак перед диапазоном не разрешает гг.", input, (actual) => !/гг\./i.test(actual), "новая точка после гг не добавлена");
  checkCondition("знак перед диапазоном не разрешает гг. при повторе", cleanTypography(input), (actual) => !/гг\./i.test(actual), "новая точка после гг не добавлена");
}

// Все прежние адресные формы исключены, в том числе внутри подписанного адреса.
// Регистр и авторские точки сохраняются. Никакого нового адресного распознавания нет.
for (const abbreviation of "д г кв обл кр пос пер пр просп пл бул наб ш туп оф комн мкр уч вл влад корп эт пгт под".split(" ")) {
  const forms = new Set([
    abbreviation,
    abbreviation[0].toUpperCase() + abbreviation.slice(1),
    abbreviation.toUpperCase(),
    Array.from(abbreviation, (letter, index) => index % 2 === 0 ? letter : letter.toUpperCase()).join(""),
  ]);
  for (const form of forms) {
    checkUnchangedExceptNbsp(`бывшее адресное ${form} не получает точку`, `${form} текст`);
    checkUnchangedExceptNbsp(`авторская точка бывшего адресного ${form} сохраняется`, `${form}. текст`);
  }
}

[
  ["адресная подпись не включает обработку", "Адрес: д 5, кв 17"],
  ["подпись без двоеточия не включает обработку", "Адрес д 5, кв 17"],
  ["соседние строки не включают адресную обработку", "ул Ленина\nд 5\nкв 17"],
  ["имя Влад", "Влад пришёл"],
  ["имя ВЛАД", "ВЛАД ПРИШЁЛ"],
  ["авторская точка у Влад", "Влад. пришёл"],
  ["предлог под перед временем", "под 2 часа"],
  ["предлог Под с заглавной перед временем", "Под 2 часа"],
  ["предлог ПОД прописными перед временем", "ПОД 2 ЧАСА"],
].forEach(([name, input]) => checkUnchangedExceptNbsp(name, input));

[
  ["авторские точки у б-р и пр-т", "Адрес: б-р. Цветной, пр-т. Мира", "Адрес: б‑р. Цветной, пр‑т. Мира"],
  ["точки не создаются у Б-Р и ПР-Т", "Адрес: Б-Р Цветной, ПР-Т Мира", "Адрес: Б‑Р Цветной, ПР‑Т Мира"],
  ["смешанный регистр б-Р и Пр-т сохраняется", "б-Р. Цветной, Пр-т. Мира", `б‑Р.${NBSP}Цветной, Пр‑т. Мира`],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

// Площадь и объём.
[
  ["квадратные метры после числа", "20 кв м", `20${NBSP}кв.${NBSP}м`],
  ["кубические метры после числа", "5 куб м", `5${NBSP}куб.${NBSP}м`],
  ["точка у площади перед продолжением", "20 кв м. товара", `20${NBSP}кв.${NBSP}м товара`],
  ["точка у объёма перед продолжением", "5 куб м. бетона", `5${NBSP}куб.${NBSP}м бетона`],
  ["точка у площади перед новым предложением", "20 кв м. Доставка", `20${NBSP}кв.${NBSP}м. Доставка`],
  ["точка у площади в конце слоя", "20 кв м.", `20${NBSP}кв.${NBSP}м.`],
  ["точка у объёма перед переносом", "5 куб м.\nДоставка", `5${NBSP}куб.${NBSP}м.\nДоставка`],
  ["площадь прописными", "20 КВ М", `20${NBSP}КВ.${NBSP}М`],
  ["площадь с заглавной", "20 Кв м", `20${NBSP}Кв.${NBSP}м`],
  ["площадь смешанного регистра", "20 кВ М", `20${NBSP}кВ.${NBSP}М`],
  ["объём прописными", "5 КУБ М", `5${NBSP}КУБ.${NBSP}М`],
  ["объём с заглавной", "5 Куб м", `5${NBSP}Куб.${NBSP}м`],
  ["объём смешанного регистра", "5 кУб М", `5${NBSP}кУб.${NBSP}М`],
  ["площадь прописными перед строчной", "20 КВ М. товара", `20${NBSP}КВ.${NBSP}М товара`],
  ["площадь прописными перед заглавной", "20 КВ М. ТОВАРА", `20${NBSP}КВ.${NBSP}М. ТОВАРА`],
  ["объём прописными перед переносом", "5 КУБ М.\nДоставка", `5${NBSP}КУБ.${NBSP}М.\nДоставка`],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

[
  ["кв м без числа", "кв м", /кв\./],
  ["куб м без числа", "куб м", /куб\./],
  ["прописное КВ м", "КВ м", /КВ\./],
  ["смешанное Куб м", "Куб м", /Куб\./],
  ["прописное КВ М без числа", "КВ М", /КВ\./],
  ["прописное КУБ М без числа", "КУБ М", /КУБ\./],
  ["заглавная М не доказывает адресное кв", "кв М", /кв\./],
].forEach(([name, input, forbidden]) => {
  checkCondition(name, input, (actual) => !forbidden.test(actual), `нет автоматически добавленной точки: ${forbidden}`);
});

checkExact("кв. м без числа не нормализуется", "кв. м", "кв. м");
checkExact("куб. м без числа не нормализуется", "куб. м", "куб. м");
checkExact("КВ. М без числа не нормализуется", "КВ. М", "КВ. М");
checkExact("КУБ. М без числа не нормализуется", "КУБ. М", "КУБ. М");

// Единственная поддерживаемая форма с косой чертой — ₽/мес.
[
  ["₽ / мес", "399 ₽ / мес", `399${NBSP}₽/мес`],
  ["₽/ мес", "399 ₽/ мес", `399${NBSP}₽/мес`],
  ["₽ /мес", "399 ₽ /мес", `399${NBSP}₽/мес`],
  ["уже правильная форма ₽/мес", "399 ₽/мес", `399${NBSP}₽/мес`],
  ["точка перед продолжением", "Тариф 399 ₽/мес. доступен всем", `Тариф 399${NBSP}₽/мес доступен всем`],
  ["точка перед новым предложением", "Тариф 399 ₽/мес. Следующий платёж завтра", `Тариф 399${NBSP}₽/мес. Следующий платёж завтра`],
  ["точка в конце слоя", "Тариф — 399 ₽/мес.", `Тариф${NBSP}— 399${NBSP}₽/мес.`],
  ["точка перед переносом", "399 ₽/мес.\nСледующий платёж", `399${NBSP}₽/мес.\nСледующий платёж`],
  ["₽ / МЕС", "399 ₽ / МЕС", `399${NBSP}₽/МЕС`],
  ["₽/ Мес", "399 ₽/ Мес", `399${NBSP}₽/Мес`],
  ["₽ /мЕс", "399 ₽ /мЕс", `399${NBSP}₽/мЕс`],
  ["прописное МЕС перед строчной", "399 ₽/МЕС. доступен всем", `399${NBSP}₽/МЕС доступен всем`],
  ["прописное МЕС перед заглавной", "399 ₽/МЕС. ДОСТУПЕН ВСЕМ", `399${NBSP}₽/МЕС. ДОСТУПЕН ВСЕМ`],
  ["прописное МЕС в конце слоя", "399 ₽/МЕС.", `399${NBSP}₽/МЕС.`],
  ["смешанное мЕс перед переносом", "399 ₽/мЕс.\nДоставка", `399${NBSP}₽/мЕс.\nДоставка`],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

[
  ["рубли за квадратный метр", "руб./кв. м"],
  ["рубли в час", "₽/ч."],
  ["рубли в минуту", "₽/мин."],
  ["рубли в день", "₽/д"],
  ["рубли в неделю", "₽/нед."],
  ["рубли за штуку", "₽/шт"],
  ["рубли на человека", "₽/чел."],
  ["рубли на тысячу", "₽/тыс."],
  ["штук в упаковке", "шт./упак."],
  ["человек в час", "чел./ч"],
  ["рубли за площадь после числа", "100 руб./кв. м"],
  ["минуты в час после числа", "10 мин./ч"],
  ["килограммы на штуку после числа", "5 кг/шт."],
  ["косая черта в начале перед д", "/д"],
  ["косая черта в начале перед г", "/г"],
  ["косая черта в конце после д", "д/"],
  ["составное сокращение перед косой чертой", "т е/ч"],
  ["составное сокращение после косой черты", "ч/т е"],
  ["постскриптумы через косую черту", "P.S./P.P.S."],
  ["сокращение с дефисом перед косой чертой", "б-р./тест"],
  ["рубли за площадь прописными", "100 РУБ. / КВ. М"],
  ["рубли в час прописными с пробелами", "₽ / Ч."],
  ["составное прописное перед косой чертой", "Т Е/Ч"],
  ["составное смешанное после косой черты", "Ч/Т е"],
  ["месяцы с другой валютой прописными", "€ / МЕС."],
].forEach(([name, input]) => checkExact(`${name} не обрабатываются`, input, input));

// Регистр месяца не разрешает собирать ₽, / и мес через границы слоёв.
for (const month of ["мес", "Мес", "МЕС", "мЕс"]) {
  checksCount += 1;
  const currencyNode = createContextTextNode("split-month-currency", "399 ₽");
  const slashNode = createContextTextNode("split-month-slash", "/");
  const monthNode = createContextTextNode("split-month-word", month);
  connectHorizontalContext("split-month-parent", [currencyNode, slashNode, monthNode]);
  const contexts = buildNumberLayerContexts([currencyNode, slashNode, monthNode]);
  const outputs = [currencyNode, slashNode, monthNode].map((node) =>
    cleanTypographyWithMetadata(
      node.characters,
      {
        mode: "beauty",
        processHiddenNodes: false,
        processLockedNodes: false,
        recolorExistingAsterisks: false,
      },
      [],
      null,
      contexts.get(node.id) ?? null
    ).text
  );
  const expected = [`399${NBSP}₽`, "/", month];

  if (outputs.some((output, index) => output !== expected[index])) {
    failures.push(
      `разнесённое по слоям ₽ / ${month} не собирается` +
      `\n  ожидалось: ${expected.map(visible).join(" | ")}` +
      `\n  получено:  ${outputs.map(visible).join(" | ")}`
    );
  }
}

// Составные сокращения распознаются в любом регистре, сохраняя авторские буквы.
// Разделители обязательны: слитные слова не превращаются в сокращения.
[
  ["т е", "т е", `т.${NBSP}е.`],
  ["т к", "т к", `т.${NBSP}к.`],
  ["т д", "т д", `т.${NBSP}д.`],
  ["т п", "т п", `т.${NBSP}п.`],
  ["и т д", "и т д", `и${NBSP}т.${NBSP}д.`],
  ["и т п", "и т п", `и${NBSP}т.${NBSP}п.`],
  ["и др", "и др", `и${NBSP}др.`],
  ["в т ч", "в т ч", `в${NBSP}т.${NBSP}ч.`],
  ["уже расставленные точки", "т. е.", `т.${NBSP}е.`],
  ["Т е с заглавной", "Т е", `Т.${NBSP}е.`],
  ["Т Е прописными", "Т Е", `Т.${NBSP}Е.`],
  ["т Е смешанного регистра", "т Е", `т.${NBSP}Е.`],
  ["Т К прописными", "Т К", `Т.${NBSP}К.`],
  ["т К смешанного регистра", "т К", `т.${NBSP}К.`],
  ["Т д с заглавной", "Т д", `Т.${NBSP}д.`],
  ["Т Д прописными без частичной адресной обработки", "Т Д", `Т.${NBSP}Д.`],
  ["т Д смешанного регистра", "т Д", `т.${NBSP}Д.`],
  ["Т П прописными", "Т П", `Т.${NBSP}П.`],
  ["И т д с заглавной", "И т д", `И${NBSP}т.${NBSP}д.`],
  ["И Т Д прописными целиком", "И Т Д", `И${NBSP}Т.${NBSP}Д.`],
  ["и Т д смешанного регистра", "и Т д", `и${NBSP}Т.${NBSP}д.`],
  ["И т п с заглавной", "И т п", `И${NBSP}т.${NBSP}п.`],
  ["И Т П прописными", "И Т П", `И${NBSP}Т.${NBSP}П.`],
  ["и Т п смешанного регистра", "и Т п", `и${NBSP}Т.${NBSP}п.`],
  ["И др с заглавной", "И др", `И${NBSP}др.`],
  ["И ДР прописными", "И ДР", `И${NBSP}ДР.`],
  ["и Др смешанного регистра", "и Др", `и${NBSP}Др.`],
  ["В т ч с заглавной", "В т ч", `В${NBSP}т.${NBSP}ч.`],
  ["В Т Ч прописными", "В Т Ч", `В${NBSP}Т.${NBSP}Ч.`],
  ["в Т ч смешанного регистра", "в Т ч", `в${NBSP}Т.${NBSP}ч.`],
  ["прописные части с уже расставленными точками", "Т. Е.", `Т.${NBSP}Е.`],
  ["прописное составное перед обычным словом", "Т Е ПРИМЕР", `Т.${NBSP}Е. ПРИМЕР`],
  ["прописное и т д перед обычным словом", "И Т Д ПОДОБНОЕ", `И${NBSP}Т.${NBSP}Д. ПОДОБНОЕ`],
  ["прописное в т ч перед обычным словом", "В Т Ч ПРИМЕР", `В${NBSP}Т.${NBSP}Ч. ПРИМЕР`],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

["те", "тк", "тд", "тп", "Те", "ТЕ", "ТК", "ТД", "ТП", "тЕ"].forEach((input) => {
  checkExact(`слитное ${input} не меняется`, input, input);
});

// «Настоящее время» распознаётся только рядом с годом или диапазоном.
checkExact("н в рядом с годом", "2016—н в", `2016${NBSP}— н.${NBSP}в.`);
checkExact("Н в рядом с годом", "2016—Н в", `2016${NBSP}— Н.${NBSP}в.`);
checkExact("Н В рядом с годом", "2016—Н В", `2016${NBSP}— Н.${NBSP}В.`);
checkExact("н В рядом с годом", "2016—н В", `2016${NBSP}— н.${NBSP}В.`);
checkExact("Н. В. с авторскими точками", "2016—Н. В.", `2016${NBSP}— Н.${NBSP}В.`);
checkExact("отдельное н в", "н в", "н в");
checkExact("отдельное Н В", "Н В", "Н В");
checkExact("отдельное смешанное Н в", "Н в", "Н в");
checkExact("отдельное смешанное н В", "н В", "н В");
checkExact("н в без года внутри фразы", "Период: н в", "Период: н в");
checkExact("Н В без года внутри фразы", "Период: Н В", "Период: Н В");

// Сокращения не распознаются внутри кодовых имён и идентификаторов.
[
  ["рубли внутри идентификатора", "v2_100руб2"],
  ["рисунок внутри идентификатора", "x_рис 5"],
  ["составное сокращение внутри идентификатора", "id_т е"],
  ["площадь внутри идентификатора", "20 кв м_код"],
  ["прописное составное внутри идентификатора", "id_Т Е"],
  ["смешанное составное внутри идентификатора", "id_Т е"],
  ["прописная площадь внутри идентификатора", "20 КВ М_код"],
].forEach(([name, input]) => checkExact(name, input, input));

// В постскриптумах исправляются только пробелы между уже написанными точками.
[
  ["P.S.", "P.S.", `P.${NBSP}S.`],
  ["P.P.S.", "P.P.S.", `P.${NBSP}P.${NBSP}S.`],
  ["PS", "PS", "PS"],
  ["PPS", "PPS", "PPS"],
  ["P P S", "P P S", "P P S"],
  ["ps без точек", "ps", "ps"],
  ["PpS без точек", "PpS", "PpS"],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

// Инициалы остаются заглавными; фамилия допускает любой регистр после первой заглавной.
[
  ["один инициал и обычная фамилия", "И.Иванов", `И.${NBSP}Иванов`],
  ["два инициала и прописная фамилия", "И.И.ИВАНОВ", `И.${NBSP}И.${NBSP}ИВАНОВ`],
  ["один инициал и прописная фамилия", "И. ИВАНОВ", `И.${NBSP}ИВАНОВ`],
  ["два инициала и смешанная фамилия", "И. И. ИвАнОв", `И.${NBSP}И.${NBSP}ИвАнОв`],
  ["один инициал и смешанная фамилия", "И. ИвАнОв", `И.${NBSP}ИвАнОв`],
  ["существующая связка Т. Е. и обычной фамилии сохраняется", "Т. Е. Иванов", `Т.${NBSP}Е.${NBSP}Иванов`],
  ["слитные инициалы Т.Е. перед обычной фамилией не получают лишнюю точку", "Т.Е.Иванов", `Т.${NBSP}Е.${NBSP}Иванов`],
  ["слитные инициалы Т.К. перед смешанной фамилией не получают лишнюю точку", "Т.К.ИвАнОв", `Т.${NBSP}К.${NBSP}ИвАнОв`],
  ["слитные инициалы Т.П. перед обычной фамилией не получают лишнюю точку", "Т.П.Иванов", `Т.${NBSP}П.${NBSP}Иванов`],
  ["строчный инициал перед фамилией не угадывается", "и. ИВАНОВ", "и. ИВАНОВ"],
  ["строчная фамилия не доказывает инициалы", "И. иванов", "И. иванов"],
].forEach(([name, input, expected]) => checkExact(name, input, expected));

// «им» полностью исключено из автоматической обработки сокращений. Проверяем
// именно отсутствие добавленной точки: общее правило коротких слов вправе
// заменить обычный пробел после «им» на неразрывный.
checkCondition("местоимение им", "Передали им документ", (actual) => !/им\./.test(actual), "форма «им» без точки");
checkCondition("местоимение Им в начале", "Им передали документы", (actual) => !/Им\./.test(actual), "форма «Им» без точки");
checkExact("отдельное им", "им", "им");
checkExact("авторское им. сохраняется", "им.", "им.");

if (failures.length > 0) {
  console.error(`Проверки сокращений: ${failures.length} из ${checksCount} не прошли.\n`);
  console.error(failures.map((failure, index) => `${index + 1}. ${failure}`).join("\n\n"));
  process.exitCode = 1;
} else {
  console.log(`Проверки сокращений: все ${checksCount} пройдены.`);
}
