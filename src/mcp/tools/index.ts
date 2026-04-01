import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { FinanceService } from "../../services/finance";
import { NotesService } from "../../services/notes";
import { RemindersService } from "../../services/reminders";
import { CalendarService } from "../../services/calendar";
import { ObsidianSync } from "../../obsidian";
import { TelegramApi } from "../../telegram/api";
import { config } from "../../config";
import path from "path";
import fs from "fs/promises";

export const registerAllTools = (server: McpServer): void => {
  server.tool("add_finance", "Добавить трату или доход", { amount: z.number(), category: z.string(), description: z.string() }, async ({ amount, category, description }) => {
    const r = FinanceService.add(amount, category, description);
    return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true, id: r.id, amount: r.amount, category: r.category }) }] };
  });

  server.tool("delete_finance", "Удалить финансовую запись", { id: z.number() }, async ({ id }) => {
    const deleted = FinanceService.softDelete(id);
    return { content: [{ type: "text" as const, text: JSON.stringify({ ok: deleted, id }) }] };
  });

  server.tool("query_finances", "Статистика финансов", { period: z.enum(["today", "week", "month", "all"]) }, async ({ period }) => ({
    content: [{ type: "text" as const, text: FinanceService.getQueryResult(period) }],
  }));

  server.tool("add_note", "Создать заметку", { title: z.string(), content: z.string(), tags: z.string().optional() }, async ({ title, content, tags }) => {
    const n = NotesService.add(title, content, tags);
    return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true, id: n.id, title: n.title }) }] };
  });

  server.tool("query_notes", "Поиск и просмотр заметок", { search: z.string().optional(), limit: z.number().optional() }, async ({ search, limit }) => ({
    content: [{ type: "text" as const, text: NotesService.getQueryResult(search, limit) }],
  }));

  server.tool("delete_note", "Удалить заметку", { id: z.number() }, async ({ id }) => {
    const deleted = NotesService.softDelete(id);
    return { content: [{ type: "text" as const, text: JSON.stringify({ ok: deleted, id }) }] };
  });

  server.tool("add_reminder", "Поставить напоминание", { text: z.string(), remind_at: z.string() }, async ({ text, remind_at }) => {
    const r = RemindersService.add(text, remind_at);
    return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true, id: r.id, remind_at: r.remind_at }) }] };
  });

  server.tool("query_reminders", "Список напоминаний", { include_done: z.boolean().optional() }, async ({ include_done }) => ({
    content: [{ type: "text" as const, text: RemindersService.getQueryResult(include_done ?? false) }],
  }));

  server.tool("complete_reminder", "Отметить напоминание выполненным", { id: z.number() }, async ({ id }) => {
    const done = RemindersService.markDone(id);
    return { content: [{ type: "text" as const, text: JSON.stringify({ ok: done, id }) }] };
  });

  server.tool(
    "add_calendar_event",
    "Добавить событие",
    { title: z.string(), start_at: z.string(), end_at: z.string().optional(), description: z.string().optional(), is_all_day: z.boolean().optional() },
    async ({ title, start_at, end_at, description, is_all_day }) => {
      const e = CalendarService.add(title, start_at, end_at, description, is_all_day);
      return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true, id: e.id, title: e.title }) }] };
    },
  );

  server.tool("query_calendar", "Проверить события на дату или диапазон", { date: z.string().optional(), from: z.string().optional(), to: z.string().optional() }, async ({ date, from, to }) => {
    if (from && to) {
      return { content: [{ type: "text" as const, text: CalendarService.queryRange(from, to) }] };
    }
    return { content: [{ type: "text" as const, text: CalendarService.queryDate(date ?? new Date().toISOString().split("T")[0]) }] };
  });

  server.tool("delete_calendar_event", "Удалить событие из календаря", { id: z.number() }, async ({ id }) => {
    const deleted = CalendarService.softDelete(id);
    return { content: [{ type: "text" as const, text: JSON.stringify({ ok: deleted, id }) }] };
  });

  server.tool("sync_obsidian", "Синхронизировать все данные с Obsidian", {}, async () => {
    try {
      ObsidianSync.syncAll();
      return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true, message: "Синхронизация завершена", vault: config.paths.obsidianVault }) }] };
    } catch (err) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: (err as Error).message }) }], isError: true };
    }
  });

  server.tool("send_telegram_to_me", "Отправить себе в Telegram", { message: z.string() }, async ({ message }) => {
    await TelegramApi.sendToMe(message);
    return { content: [{ type: "text" as const, text: "Sent ✓" }] };
  });

  server.tool("copy_to_workspace", "Скопировать файл/папку в рабочую папку", { source_path: z.string(), filename: z.string().optional() }, async ({ source_path, filename }) => {
    const SKIP = ["node_modules", ".git", "dist", ".next"];
    const BLOCK = ["package-lock.json", "yarn.lock"];

    const name = filename ?? path.basename(source_path);
    const dest = path.join(config.paths.workspace, name);
    const stat = await fs.stat(source_path);

    if (stat.isDirectory()) {
      await fs.cp(source_path, dest, {
        recursive: true,
        filter: (src) => {
          const bn = path.basename(src);
          if (SKIP.some((d) => src.split(path.sep).includes(d))) return false;
          if (bn === ".env" || bn.startsWith(".env.")) return false;
          if (BLOCK.includes(bn)) return false;
          return true;
        },
      });
    } else {
      await fs.copyFile(source_path, dest);
    }
    return { content: [{ type: "text" as const, text: `Copied → ${dest}` }] };
  });
};
