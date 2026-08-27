const ACTIVE_ANNOUNCEMENT_ID = "number-grouping-2026-08";

module.exports = {
  activeId: ACTIVE_ANNOUNCEMENT_ID,
  items: {
    [ACTIVE_ANNOUNCEMENT_ID]: {
      menuName: "⚠️ Не все числа делятся на разряды →",
      imageAsset: "announcements/number-grouping-v3.png",
      titleHtml: "Чистовик больше не&nbsp;делит все числа по&nbsp;разрядам",
      paragraphsHtml: [
        "Пробел теперь ставится только у&nbsp;чисел рядом с&nbsp;валютой, процентом или единицами измерения. В&nbsp;остальных случаях&nbsp;— решение за&nbsp;редактором.",
        "Здесь поменяется:&nbsp;<strong>10000&nbsp;₽</strong>&nbsp;→&nbsp;<strong>10&nbsp;000&nbsp;₽</strong><br>Тут без правок: <strong>Разыграем 20000&nbsp;пылесосов</strong>",
      ],
      actions: [
        {
          action: "back-to-typograph",
          appearance: "primary",
          labelHtml: "Вернуться к&nbsp;типографу",
        },
      ],
    },
  },
};
