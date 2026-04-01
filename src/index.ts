import { getDb } from "./db";
import { config } from "./config";
import { TelegramPoller } from "./telegram/poller";
import { TelegramApi, TgUpdate, TgMessage } from "./telegram/api";
import { handleCommand } from "./telegram/commands";
import { createQueue } from "./queue";
import { LLM } from "./llm";
import { FinanceService } from "./services/finance";
import { NotesService } from "./services/notes";
import { RemindersService } from "./services/reminders";
import { CalendarService } from "./services/calendar";
import { SessionService } from "./services/session";
import { ProfileService } from "./services/profile";
import { FileHandler } from "./services/files";
import { ObsidianSync } from "./obsidian";
import { printAgentLogo } from "./utils/logo";

process.on("uncaughtException", (err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("[fatal]", err);
  process.exit(1);
});

const handleToolCall = async (name: string, args: any, chatId: number, timezone: string): Promise<string> => {
  switch (name) {
    case "add_finance": {
      const r = FinanceService.add(args.amount, args.category, args.description);
      return JSON.stringify({ ok: true, id: r.id, amount: r.amount, category: r.category, description: r.description });
    }
    case "delete_finance": {
      const deleted = FinanceService.softDelete(args.id);
      return JSON.stringify({ ok: deleted, id: args.id, message: deleted ? "Удалено" : "Не найдено" });
    }
    case "query_finances": {
      return FinanceService.getQueryResult(args.period);
    }
    case "add_note": {
      const n = NotesService.add(args.title, args.content, args.tags);
      return JSON.stringify({ ok: true, id: n.id, title: n.title });
    }
    case "query_notes": {
      return NotesService.getQueryResult(args.search, args.limit);
    }
    case "delete_note": {
      const deleted = NotesService.softDelete(args.id);
      return JSON.stringify({ ok: deleted, id: args.id, message: deleted ? "Удалено" : "Не найдено" });
    }
    case "add_reminder": {
      const r = RemindersService.add(args.text, args.remind_at, undefined, timezone);
      return JSON.stringify({ ok: true, id: r.id, remind_at: args.remind_at });
    }
    case "query_reminders": {
      return RemindersService.getQueryResult(args.include_done ?? false, timezone);
    }
    case "complete_reminder": {
      const done = RemindersService.markDone(args.id);
      return JSON.stringify({ ok: done, id: args.id, message: done ? "Выполнено" : "Не найдено или уже выполнено" });
    }
    case "add_calendar_event": {
      const e = CalendarService.add(args.title, args.start_at, args.end_at, args.description, args.is_all_day, undefined, timezone);
      return JSON.stringify({ ok: true, id: e.id, title: e.title, start_at: args.start_at });
    }
    case "query_calendar": {
      if (args.from && args.to) return CalendarService.queryRange(args.from, args.to, timezone);
      return CalendarService.queryDate(args.date ?? new Date().toISOString().split("T")[0], timezone);
    }
    case "delete_calendar_event": {
      const deleted = CalendarService.softDelete(args.id);
      return JSON.stringify({ ok: deleted, id: args.id, message: deleted ? "Удалено" : "Не найдено" });
    }
    case "sync_obsidian": {
      try {
        ObsidianSync.syncAll();
        return JSON.stringify({ ok: true, message: "Синхронизация завершена", vault: config.paths.obsidianVault });
      } catch (err) {
        return JSON.stringify({ ok: false, error: (err as Error).message });
      }
    }
    case "remember_fact": {
      ProfileService.addFact(chatId, args.fact);
      return JSON.stringify({ ok: true, fact: args.fact });
    }
    case "update_profile": {
      const fields: Record<string, string> = {};
      if (args.name !== undefined) fields.name = args.name;
      if (args.timezone !== undefined) fields.timezone = args.timezone;
      if (args.about !== undefined) fields.about = args.about;
      if (Object.keys(fields).length > 0) {
        ProfileService.getOrCreate(chatId);
        ProfileService.update(chatId, fields);
      }
      return JSON.stringify({ ok: true, updated: fields });
    }
    case "clear_facts": {
      ProfileService.clearFacts(chatId);
      return JSON.stringify({ ok: true, message: "Факты очищены" });
    }
    case "clear_session": {
      const count = SessionService.clear(chatId);
      return JSON.stringify({ ok: true, cleared: count, message: "История чата очищена" });
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
};

const extractMessageContent = async (msg: TgMessage): Promise<{ textForSession: string; llmContent: string | Array<any> }> => {
  const text = msg.text ?? msg.caption ?? null;

  if (!msg.photo && !msg.document && !msg.voice && !msg.audio) {
    return { textForSession: text ?? "", llmContent: text ?? "(пустое сообщение)" };
  }

  let fileCtx = null;

  if (msg.photo) {
    fileCtx = await FileHandler.processPhoto(msg.photo);
  } else if (msg.document) {
    fileCtx = await FileHandler.processDocument(msg.document);
  } else if (msg.voice) {
    fileCtx = await FileHandler.processVoice(msg.voice);
  } else if (msg.audio) {
    fileCtx = await FileHandler.processVoice(msg.audio as any);
  }

  const llmContent = FileHandler.buildLLMContent(text, fileCtx);

  let textForSession = text ?? "";
  if (fileCtx?.type === "image") textForSession += text ? ` [📷 изображение]` : "[📷 изображение]";
  if (fileCtx?.type === "document") textForSession += ` [📄 ${fileCtx.fileName}]`;
  if (fileCtx?.type === "voice" && fileCtx.transcription) textForSession = `[🎤 голосовое]: ${fileCtx.transcription}`;
  if (fileCtx?.type === "voice" && !fileCtx.transcription) textForSession = "[🎤 голосовое сообщение]";

  return { textForSession, llmContent };
};

const processMessage = async (update: TgUpdate): Promise<void> => {
  const msg = update.message!;
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  const preview = msg.text?.slice(0, 50) ?? (msg.photo ? "[photo]" : msg.document ? "[doc]" : msg.voice ? "[voice]" : "[?]");
  console.log(`[process] #${messageId}: "${preview}"`);

  const { handled, syncRequested } = await handleCommand(msg);
  if (handled) {
    TelegramPoller.markProcessed(messageId, chatId);
    if (syncRequested) {
      try {
        ObsidianSync.syncAll();
        await TelegramApi.sendMessage(chatId, "Синхронизация ✅");
      } catch (err) {
        await TelegramApi.sendMessage(chatId, `Ошибка: ${(err as Error).message}`);
      }
    }
    return;
  }

  ProfileService.getOrCreate(chatId);

  await TelegramApi.setProcessingReaction(chatId, messageId);

  try {
    const { textForSession, llmContent } = await extractMessageContent(msg);
    const history = SessionService.getHistory(chatId);
    const userContext = ProfileService.buildSystemContext(chatId);
    const profile = ProfileService.get(chatId);
    const timezone = profile?.timezone || "Europe/Moscow";

    const response = await LLM.chat(llmContent, history, userContext, (name, args) => handleToolCall(name, args, chatId, timezone), timezone);

    SessionService.add(chatId, "user", textForSession || "(файл)");
    if (response) SessionService.add(chatId, "assistant", response);

    TelegramPoller.markProcessed(messageId, chatId);
    await TelegramApi.setDoneReaction(chatId, messageId);

    if (response) {
      await TelegramApi.sendLong(chatId, response);
    } else {
      console.warn(`[process] Empty response for #${messageId}`);
    }

    console.log(`[process] Done #${messageId}`);
  } catch (err) {
    console.error(`[process] Error #${messageId}:`, err);
    await TelegramApi.setErrorReaction(chatId, messageId);
    try {
      await TelegramApi.sendMessage(chatId, `❌ ${(err as Error).message}`);
    } catch {}
  }
};

const main = async () => {
  printAgentLogo();

  getDb();

  try {
    await TelegramApi.setMyCommands();
    console.log("[main] Bot commands registered");
  } catch (err) {
    console.error("[main] Failed to set commands:", (err as Error).message);
  }

  const queue = createQueue<TgUpdate>(processMessage);

  setInterval(() => {
    RemindersService.checkAndNotify().catch((err) => console.error("[reminders]", err));
  }, 60_000);

  const sync = () => {
    try {
      ObsidianSync.syncAll();
    } catch (err) {
      console.error("[obsidian]", err);
    }
  };

  sync();
  setInterval(sync, config.polling.obsidianSyncIntervalMs);

  console.log(`[main] Chat ID: ${config.telegram.myChatId}`);
  console.log(`[main] LLM: ${config.llm.baseUrl} (${config.llm.model})`);
  console.log(`[main] Max tokens: ${config.llm.maxTokens}`);
  console.log(`[main] Vault: ${config.paths.obsidianVault}`);
  console.log(`[main] Groq Whisper: ${config.llm.groqApiKey ? "enabled" : "disabled"}`);
  console.log(`[main] Local Whisper: ${config.llm.whisperUrl ?? "disabled"}`);
  console.log("[main] Waiting for messages...\n");

  await TelegramPoller.poll(async (update) => {
    queue.push(update).catch((err) => console.error("[queue]", err));
  });
};

main();
