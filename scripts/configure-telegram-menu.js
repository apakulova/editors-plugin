const TELEGRAM_COMMANDS = [
  { command: "today", description: "Отчёт за сегодня" },
  { command: "speed", description: "Отчёт по скорости за 7 дней" },
  { command: "errors", description: "Отчёт по ошибкам за 7 дней" },
];

async function configureTelegramCommands(env = process.env) {
  if (typeof env.TELEGRAM_BOT_TOKEN !== "string" || env.TELEGRAM_BOT_TOKEN.length === 0) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN");
  }

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
    body: JSON.stringify({ commands: TELEGRAM_COMMANDS }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram setMyCommands failed: ${response.status} ${body}`);
  }

  const payload = await response.json();

  if (payload?.ok !== true || payload?.result !== true) {
    throw new Error("Telegram did not confirm the command menu update");
  }
}

if (require.main === module) {
  configureTelegramCommands()
    .then(() => {
      console.log("Telegram command menu updated");
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  TELEGRAM_COMMANDS,
  configureTelegramCommands,
};
