# Гайд по Telegram-боту «Чистовика»

Этот файл хранит рабочие инструкции для Telegram-бота, который отправляет аналитику по плагину «Чистовик».

## Что уже настроено

- Бот отправляет ежедневный отчет через Vercel Cron около `09:00` по Москве.
- Ежедневный cron вызывает Vercel endpoint:

```text
https://chistovik-plugin.vercel.app/api/daily-analytics
```

- Команда `/today` работает через Vercel endpoint:

```text
https://chistovik-plugin.vercel.app/api/telegram
```

- Команда `/today` добавлена в меню команд бота.
- В отчетах заголовок приходит жирным и начинается с `✦`, а полный дашборд спрятан в кликабельный текст `Полный дашборд с графиками`.
- Полный дашборд PostHog:

```text
https://eu.posthog.com/project/184090/dashboard/695809
```

## Где лежит код

- `api/daily-analytics.js` — Vercel endpoint для ежедневного отчета за вчера.
- `scripts/send-daily-analytics.js` — резервный ручной отчет за вчера через GitHub Actions.
- `scripts/lib/analytics-report.js` — общая логика PostHog-запросов, форматирования сообщений и отправки в Telegram.
- `api/telegram.js` — Vercel endpoint для Telegram webhook и команды `/today`.
- `.github/workflows/daily-analytics.yml` — ручной резервный запуск ежедневного отчета.
- `vercel.json` — конфиг Vercel.
- `public/index.html` — минимальный static output для Vercel.

## Секреты и переменные

### GitHub Actions Secrets

Нужны только для ручного резервного запуска ежедневного отчета:

```text
POSTHOG_PERSONAL_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

### Vercel Environment Variables

Нужны для команды `/today` и ежедневного отчета через Vercel Cron:

```text
POSTHOG_PERSONAL_API_KEY
POSTHOG_HOST=https://eu.posthog.com
POSTHOG_PROJECT_ID=184090
POSTHOG_DASHBOARD_URL=https://eu.posthog.com/project/184090/dashboard/695809
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
TELEGRAM_WEBHOOK_SECRET
CRON_SECRET
```

Токены, API-ключи, `TELEGRAM_WEBHOOK_SECRET` и `CRON_SECRET` не хранить в коде и не публиковать.

## Как узнать chat_id

1. Написать боту `/start`.
2. Открыть в браузере:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates
```

3. Найти:

```json
"chat": {
  "id": 382344500
}
```

Это число сохранить как:

```text
TELEGRAM_CHAT_ID
```

Если `result` пустой:

1. Убедиться, что сообщение отправлено именно этому боту.
2. При необходимости сбросить webhook:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/deleteWebhook
```

3. Снова написать боту `/start`.
4. Повторить `getUpdates`.

## Как сгенерировать TELEGRAM_WEBHOOK_SECRET

В терминале:

```bash
openssl rand -hex 32
```

Сохранить результат в Vercel как:

```text
TELEGRAM_WEBHOOK_SECRET
```

Эта же строка нужна при установке webhook.

## Как сгенерировать CRON_SECRET

`CRON_SECRET` защищает endpoint ежедневного отчета. Vercel Cron будет отправлять его в заголовке `Authorization: Bearer <CRON_SECRET>`, а `api/daily-analytics.js` проверит этот заголовок перед отправкой сообщения.

Сгенерировать можно так:

```bash
openssl rand -hex 32
```

Результат сохранить в Vercel как Environment Variable:

```text
CRON_SECRET
```

## Как установить webhook

После деплоя Vercel открыть в браузере:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://chistovik-plugin.vercel.app/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Успешный ответ:

```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

После этого команда `/today` должна работать в Telegram.

## Как проверить webhook

Открыть:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo
```

В ответе проверить:

- `url` — должен быть `https://chistovik-plugin.vercel.app/api/telegram`;
- `last_error_message` — должно быть пусто или отсутствовать;
- `pending_update_count` — обычно `0`.

## Как удалить webhook

Если нужно временно вернуться к `getUpdates` или перенастроить webhook:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/deleteWebhook
```

После удаления webhook команды через Vercel endpoint работать не будут, пока webhook не установить снова.

## Как добавить команды в меню бота

Открыть в браузере:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setMyCommands?commands=[{"command":"today","description":"Отчёт за сегодня"}]
```

Если браузер ругается на русские буквы, использовать encoded-вариант:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setMyCommands?commands=%5B%7B%22command%22%3A%22today%22%2C%22description%22%3A%22%D0%9E%D1%82%D1%87%D1%91%D1%82%20%D0%B7%D0%B0%20%D1%81%D0%B5%D0%B3%D0%BE%D0%B4%D0%BD%D1%8F%22%7D%5D
```

Успешный ответ:

```json
{"ok":true,"result":true}
```

После этого в Telegram появится команда:

```text
/today — Отчёт за сегодня
```

Иногда меню обновляется не сразу. Можно закрыть и снова открыть чат с ботом.

## Как посмотреть текущие команды бота

Открыть:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getMyCommands
```

## Как очистить меню команд

Открыть:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/deleteMyCommands
```

## Как вручную проверить ежедневный отчет

Основной ежедневный отчет теперь отправляет Vercel Cron. Для быстрой ручной проверки без ожидания cron можно использовать резервный GitHub Actions workflow:

1. Открыть GitHub repository.
2. Перейти в `Actions`.
3. Выбрать workflow `Daily analytics report`.
4. Нажать `Run workflow`.
5. Проверить сообщение в Telegram.

После деплоя Vercel отдельно проверить, что в проекте появился cron `/api/daily-analytics`. На Hobby-тарифе он может сработать не ровно в `09:00`, а в пределах часа.

## Как проверить команду /today

1. Убедиться, что Vercel deploy успешный.
2. Убедиться, что webhook установлен.
3. Написать боту:

```text
/today
```

4. Проверить, что пришел отчет за текущий день по Москве.

## Что делать, если /today не отвечает

1. Проверить Vercel deploy.
2. Проверить Vercel logs.
3. Проверить env vars в Vercel.
4. Проверить webhook:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo
```

5. Проверить, что `TELEGRAM_CHAT_ID` в Vercel совпадает с chat id пользователя.
6. Проверить, что `TELEGRAM_WEBHOOK_SECRET` в Vercel совпадает с `secret_token`, с которым установлен webhook.

## Правила безопасности

- Не хранить `TELEGRAM_BOT_TOKEN`, `POSTHOG_PERSONAL_API_KEY` и `TELEGRAM_WEBHOOK_SECRET` в репозитории.
- Не присылать токены в чат.
- Если токен случайно утек, перевыпустить его в BotFather или PostHog.
- Endpoint должен отвечать только разрешенному `TELEGRAM_CHAT_ID`.
- Чужие сообщения бот должен игнорировать.

## Будущие команды

Можно добавить:

```text
/yesterday
/week
/errors
/help
```

Для обратной связи можно добавить:

```text
/feedback текст сообщения
```

Перед добавлением обратной связи нужно отдельно решить, где хранить сообщения: GitHub Issues, PostHog, Google Sheets, Notion, Supabase или другой сервис.
