import { TgMessage, TelegramApi } from "./api";
import { SessionService } from "../services/session";
import { ProfileService } from "../services/profile";

export const handleCommand = async (msg: TgMessage): Promise<{ handled: boolean; syncRequested: boolean }> => {
  const text = (msg.text ?? "").trim();
  if (!text.startsWith("/")) return { handled: false, syncRequested: false };

  const [cmd] = text.split(" ");
  let syncRequested = false;

  try {
    switch (cmd) {
      case "/start":
      case "/help":
        await TelegramApi.sendLong(
          msg.chat.id,
          `🤖 Yaguri Agent\n\n` +
            `Просто пиши мне обычным текстом, я всё пойму:\n\n` +
            `💰 Финансы:\n` +
            `  "-1290 продукты магнит" — запишу трату\n` +
            `  "+50000 зарплата" — запишу доход\n` +
            `  "сколько потратил за месяц?" — покажу статистику\n\n` +
            `📝 Заметки:\n` +
            `  "запиши: купить молоко" — создам заметку\n` +
            `  "покажи заметки" — выведу список\n\n` +
            `⏰ Напоминания:\n` +
            `  "напомни завтра в 10:00 созвон" — поставлю\n\n` +
            `📅 Календарь:\n` +
            `  "свободна ли пятница?" — проверю\n` +
            `  "встреча в среду в 15:00" — добавлю\n\n` +
            `🧠 Профиль и память:\n` +
            `  "измени моё имя на Макс" — обновлю\n` +
            `  "запомни, что я программист" — запомню\n\n` +
            `💬 История:\n` +
            `  "очисти историю чата" — сброшу сессию\n\n` +
            `📎 Файлы: отправь картинку, документ или голосовое\n\n` +
            `/new — новая сессия\n` +
            `/profile — мой профиль\n` +
            `/sync — синхронизация с Obsidian`,
        );
        break;

      case "/new": {
        const count = SessionService.clear(msg.chat.id);
        await TelegramApi.sendMessage(msg.chat.id, `🆕 Новая сессия. Удалено ${count} сообщений из истории.`);
        break;
      }

      case "/profile": {
        const profile = ProfileService.get(msg.chat.id);
        if (!profile) {
          await TelegramApi.sendMessage(msg.chat.id, "Профиль не найден. Напиши что-нибудь чтобы начать.");
          break;
        }
        let txt = `👤 Профиль\n\n`;
        txt += `Имя: ${profile.name || "—"}\n`;
        txt += `Часовой пояс: ${profile.timezone || "—"}\n`;
        txt += `О себе: ${profile.about || "—"}\n`;
        if (profile.extra_facts) {
          const facts = profile.extra_facts.split("\n").filter(Boolean);
          if (facts.length > 0) {
            txt += `\n📌 Запомненные факты:\n`;
            facts.forEach((f) => {
              txt += `• ${f}\n`;
            });
          }
        }
        txt += `\nЧтобы изменить профиль — просто напиши мне, например: "смени моё имя на Алекс"`;
        await TelegramApi.sendMessage(msg.chat.id, txt);
        break;
      }

      case "/sync":
        syncRequested = true;
        await TelegramApi.sendMessage(msg.chat.id, "🔄 Запускаю синхронизацию с Obsidian...");
        break;

      default:
        return { handled: false, syncRequested: false };
    }
  } catch (err) {
    console.error("[commands]", err);
    await TelegramApi.sendMessage(msg.chat.id, `Ошибка: ${(err as Error).message}`);
  }

  return { handled: true, syncRequested };
};
