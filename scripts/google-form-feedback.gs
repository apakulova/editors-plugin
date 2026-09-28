const FEEDBACK_ENDPOINT = "https://chistovik-plugin.vercel.app/api/form-feedback";
const FEEDBACK_SECRET_PROPERTY = "FORM_FEEDBACK_WEBHOOK_SECRET";
const AUTHOR_QUESTION = "Представьтесь, пожалуйста";
const IMPRESSIONS_QUESTION = "Поделитесь впечатлениями от плагина";
const PUBLISH_PERMISSION_QUESTION = "Можно опубликовать ваш отзыв?";

function sendFeedbackToTelegram(event) {
  const answers = {};

  event.response.getItemResponses().forEach((itemResponse) => {
    answers[itemResponse.getItem().getTitle()] = String(itemResponse.getResponse() || "").trim();
  });

  const secret = PropertiesService.getScriptProperties().getProperty(FEEDBACK_SECRET_PROPERTY);

  if (!secret) {
    throw new Error(`Не задано свойство ${FEEDBACK_SECRET_PROPERTY}`);
  }

  const response = UrlFetchApp.fetch(FEEDBACK_ENDPOINT, {
    contentType: "application/json",
    headers: {
      "X-Feedback-Secret": secret,
    },
    method: "post",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      author: answers[AUTHOR_QUESTION] || "",
      impressions: answers[IMPRESSIONS_QUESTION] || "",
      publishPermission: answers[PUBLISH_PERMISSION_QUESTION] || "",
    }),
  });

  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error(`Не удалось отправить уведомление: ${response.getResponseCode()} ${response.getContentText()}`);
  }
}

function setupFormFeedbackNotifications() {
  const form = FormApp.getActiveForm();

  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "sendFeedbackToTelegram")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger("sendFeedbackToTelegram")
    .forForm(form)
    .onFormSubmit()
    .create();
}
