const ACTIVE_ANNOUNCEMENT_ID = "feedback-2026-09";

function getMenuAnalyticsLabel(menuName) {
  return menuName.replace(/\s*→\s*$/, "").trim();
}

module.exports = {
  activeId: ACTIVE_ANNOUNCEMENT_ID,
  getMenuAnalyticsLabel,
  items: {
    [ACTIVE_ANNOUNCEMENT_ID]: {
      menuName: "💬 Оставить отзыв →",
      imageAsset: "announcements/feedback-needed-v4.png",
      titleHtml: "Расскажите, как вам Чистовик",
      paragraphsHtml: [
        "Скоро плагин выйдет за&nbsp;пределы Авито. Перед этим хочу узнать у&nbsp;своих: что уже классно, а&nbsp;где ещё есть над чем поработать.",
        "Хвалите, ругайте&nbsp;— что угодно, только чур честно!",
      ],
      actions: [
        {
          action: "open-url",
          appearance: "primary",
          labelHtml: "Оставить отзыв",
          url: "https://forms.gle/hrkShyDWdidogZj18",
        },
        {
          action: "back-to-typograph",
          appearance: "secondary",
          labelHtml: "Вернуться к&nbsp;типографу",
        },
      ],
    },
    "number-grouping-2026-08": {
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
