module.exports = {
  tabs: [
    { id: "typograph", label: "Типограф", active: true },
    { id: "rules", label: "Правила" },
    { id: "about", label: "О плагине", hasDoodles: true },
  ],
  typograph: {
    title: "Как обработать текст?",
    modeAriaLabel: "Режим типографа",
    modes: [
      {
        id: "beautyMode",
        name: "typographMode",
        value: "beauty",
        checked: true,
        title: "Для красоты",
        text: "Готовыми символами",
      },
      {
        id: "developmentMode",
        name: "typographMode",
        value: "development",
        title: "Для разработки",
        text: "С&nbsp;<span class=\"nbsp-star\">*</span> на&nbsp;месте неразрывных пробелов",
      },
    ],
    options: [
      {
        id: "processLocked",
        key: "processLockedNodes",
        label: "Обработать даже слои с замочком",
      },
      {
        id: "processHidden",
        key: "processHiddenNodes",
        label: "Обработать даже скрытые слои",
      },
    ],
  },
  rules: [
    {
      title: "Кавычки и&nbsp;пунктуация",
      points: [
        "В&nbsp;русском тексте кавычки первого уровня «ёлочки», а&nbsp;второго „лапки“: <span class=\"rule-example\">«Он&nbsp;сказал „привет“»</span>",
        "В&nbsp;текстах на&nbsp;латинице кавычки первого уровня <span class=\"rule-example\">\"двойные\"</span>, а&nbsp;второго <span class=\"rule-example\">'одинарные'</span>",
        "В&nbsp;смешанных текстах кавычки зависят от&nbsp;письма вне кавычек: <span class=\"rule-example\">Он&nbsp;сказал «hello» и&nbsp;ушёл</span>, но&nbsp;<span class=\"rule-example\">The word \"привет\" means hello</span>",
        "Точка, запятая, точка с&nbsp;запятой, двоеточие и&nbsp;многоточие после кавычек: <span class=\"rule-example\">Он&nbsp;сказал «привет».</span>",
        "Вопрос и&nbsp;восклицание внутри кавычек, после них точка не&nbsp;ставится: <span class=\"rule-example\">«Как дела?» или Она сказала «Да!»</span>",
        "Три точки меняются на&nbsp;многоточие: <span class=\"rule-example\">... <span class=\"rule-arrow\">→</span> …</span>",
        "Повторные знаки: <span class=\"rule-example\">!! <span class=\"rule-arrow\">→</span> !, ?? <span class=\"rule-arrow\">→</span> ?</span>",
        "Сочетание !?: <span class=\"rule-example\">!? <span class=\"rule-arrow\">→</span> ?!</span>",
      ],
    },
    {
      title: "Тире и&nbsp;дефисы",
      points: [
        "Длинное тире между словами: <span class=\"rule-example\">слово&nbsp;— слово</span>",
        "Диапазоны чисел: <span class=\"rule-example\">10-20, 10&nbsp;– 20 <span class=\"rule-arrow\">→</span> 10–20</span>",
        "Римские диапазоны в&nbsp;контексте: <span class=\"rule-example\">X-XI век <span class=\"rule-arrow\">→</span> X–XI век, главы I-III <span class=\"rule-arrow\">→</span> главы I–III</span>",
        "Неразрывный дефис внутри слов на&nbsp;кириллице и&nbsp;латинице: <span class=\"rule-example\">кто‑то, X‑ray</span>",
        "Тире в&nbsp;начале строки",
        "Неразрывный пробел перед длинным тире",
      ],
    },
    {
      title: "Телефоны",
      points: [
        "Российские номера: <span class=\"rule-example\">+7&nbsp;900&nbsp;123‑45‑67</span>",
        "Внутри номера цифры разделяются неразрывными пробелами и&nbsp;дефисами",
        "Номер с&nbsp;<span class=\"rule-example\">7</span> получает <span class=\"rule-example\">+7</span>",
        "Номер с&nbsp;<span class=\"rule-example\">8</span> сохраняет восьмёрку",
        "Числа после <span class=\"rule-example\">№</span> и&nbsp;рядом с&nbsp;валютой не&nbsp;считаются телефоном",
      ],
    },
    {
      title: "Числа, даты и&nbsp;деньги",
      points: [
        "Разряды в&nbsp;длинных числах: <span class=\"rule-example\">1000000 <span class=\"rule-arrow\">→</span> 1&nbsp;000&nbsp;000</span>",
        "Десятичная запятая: <span class=\"rule-example\">10.5 <span class=\"rule-arrow\">→</span> 10,5</span>",
        "Английская запись числа: <span class=\"rule-example\">62,226,338.00&nbsp;₽ <span class=\"rule-arrow\">→</span> 62&nbsp;226&nbsp;338,00&nbsp;₽</span>",
        "Неразрывный пробел перед валютой или единицей измерения: <span class=\"rule-example\">5&nbsp;кг, 1&nbsp;000&nbsp;₽</span>",
        "Год рядом с&nbsp;<span class=\"rule-example\">©</span> и&nbsp;<span class=\"rule-example\">г.</span>: <span class=\"rule-example\">©&nbsp;2024, 2024&nbsp;г.</span>",
        "IP-адреса, версии и&nbsp;даты не&nbsp;делятся на&nbsp;разряды: <span class=\"rule-example\">192.168.0.1, v2.0.1 и&nbsp;10.04.2025</span>",
        "Числа внутри кодов не&nbsp;делятся на&nbsp;разряды: <span class=\"rule-example\">SALE-2026</span>",
        "Числа после <span class=\"rule-example\">№</span> и&nbsp;<span class=\"rule-example\">§</span> не&nbsp;делятся на&nbsp;разряды",
      ],
    },
    {
      title: "Сокращения",
      points: [
        "С&nbsp;точкой: <span class=\"rule-example\">тыс., мин., д., кв., г., рис., стр., им., руб., коп., т.&nbsp;д., т.&nbsp;е., т.&nbsp;к., т.&nbsp;п., и&nbsp;т.&nbsp;д., и&nbsp;др., и&nbsp;т.&nbsp;п.</span>",
        "Без точки: <span class=\"rule-example\">млн, млрд, трлн</span>; после числа&nbsp;— <span class=\"rule-example\">с, м, км, кг, мм, см, л, мл</span>",
        "Площадь и&nbsp;объём: <span class=\"rule-example\">кв.&nbsp;м, куб.&nbsp;м</span>",
        "Месяцы: <span class=\"rule-example\">6&nbsp;мес.</span>, но&nbsp;<span class=\"rule-example\">₽/мес</span>",
        "Все правила сокращений действуют в&nbsp;середине предложения, в&nbsp;конце всегда ставится точка",
        "Перенос строки сам по&nbsp;себе не&nbsp;считается новым предложением",
      ],
    },
    {
      title: "Неразрывные пробелы",
      points: [
        "Перед длинным тире: <span class=\"rule-example\">Москва<span style=\"color:#FF4053\">*</span>— столица</span>",
        "После <span class=\"rule-example\">№</span> и&nbsp;<span class=\"rule-example\">§</span> перед числом: <span class=\"rule-example\">№<span style=\"color:#FF4053\">*</span>5, §<span style=\"color:#FF4053\">*</span>12</span>",
        "Между <span class=\"rule-example\">©</span> и&nbsp;годом: <span class=\"rule-example\">©<span style=\"color:#FF4053\">*</span>2025</span>",
        "Между числом и&nbsp;единицей: <span class=\"rule-example\">5<span style=\"color:#FF4053\">*</span>кг, 20<span style=\"color:#FF4053\">*</span>°C</span>",
        "В&nbsp;датах: <span class=\"rule-example\">30<span style=\"color:#FF4053\">*</span>сентября</span>",
        "В&nbsp;инициалах: <span class=\"rule-example\">И.<span style=\"color:#FF4053\">*</span>И.<span style=\"color:#FF4053\">*</span>Иванов</span>",
        "После любых слов из&nbsp;1–2 букв на&nbsp;кириллице: <span class=\"rule-example\">в<span style=\"color:#FF4053\">*</span>дом, на<span style=\"color:#FF4053\">*</span>сайт</span>",
      ],
    },
    {
      title: "Обычные пробелы",
      points: [
        "Без двойных пробелов",
        "Без пробелов в&nbsp;начале и&nbsp;конце строки",
        "Без лишних пробелов перед знаками препинания: <span class=\"rule-example\">. , : ; ? ! » ) ]</span>",
        "Без лишних пробелов после открывающих знаков: <span class=\"rule-example\">« ( [</span>",
        "Проценты без пробела: <span class=\"rule-example\">50%</span>",
        "Тильда без пробела: <span class=\"rule-example\">~100</span>",
      ],
    },
    {
      title: "Математика и&nbsp;символы",
      points: [
        "Математические примеры пишутся с&nbsp;неразрывными пробелами: <span class=\"rule-example\">10 x 20 = 200 <span class=\"rule-arrow\">→</span> 10&nbsp;×&nbsp;20&nbsp;=&nbsp;200</span>",
        "Умножение: <span class=\"rule-example\">2*2 и&nbsp;2 x 2 <span class=\"rule-arrow\">→</span> 2&nbsp;×&nbsp;2</span>",
        "Сложение, деление и&nbsp;равенство: <span class=\"rule-example\">5&nbsp;+&nbsp;5, 6&nbsp;/&nbsp;2&nbsp;=&nbsp;3</span>",
        "Вычитание только в&nbsp;математическом контексте: <span class=\"rule-example\">10 - 5 = 5 <span class=\"rule-arrow\">→</span> 10&nbsp;−&nbsp;5&nbsp;=&nbsp;5</span>",
        "Отрицательные числа пишутся слитно со&nbsp;знаком минус: <span class=\"rule-example\">-10 <span class=\"rule-arrow\">→</span> −10</span>",
        "Типографские дроби: <span class=\"rule-example\">1/2 <span class=\"rule-arrow\">→</span> ½, 1/4 <span class=\"rule-arrow\">→</span> ¼</span>",
        "Температура: <span class=\"rule-example\">20 C <span class=\"rule-arrow\">→</span> 20&nbsp;°C, 100F <span class=\"rule-arrow\">→</span> 100&nbsp;°F</span>",
        "Символы: <span class=\"rule-example\">(c) <span class=\"rule-arrow\">→</span> ©, (tm) <span class=\"rule-arrow\">→</span> ™, (r) <span class=\"rule-arrow\">→</span> ®</span>",
        "Стрелка: <span class=\"rule-example\">-&gt; <span class=\"rule-arrow\">→</span> →</span>",
      ],
    },
  ],
  about: {
    lead: "Чистовик&nbsp;&mdash; это финальный штрих перед разработкой",
    bullets: [
      "Исправляет кавычки, тире и&nbsp;пробелы",
      "Работает с&nbsp;текстом, фреймом или всей страницей",
      "Сохраняет цвета и&nbsp;стили внутри текста",
    ],
    noteTitle: "Сделано редактором для редакторов",
    noteHtml: "Автор плагина&nbsp;&mdash; Аня Акулова. Я&nbsp;UX-редактор в&nbsp;финтехе и&nbsp;делюсь своим опытом в&nbsp;канале «Аня учится пилить проекты». <a class=\"about-link\" href=\"https://t.me/akanna_notes\" target=\"_blank\" rel=\"noreferrer\">Заходите в&nbsp;гости&nbsp;→</a>",
  },
  actions: {
    runButton: "Запустить типограф",
  },
};
