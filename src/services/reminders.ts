import { getDb } from "../db";
import { TelegramApi } from "../telegram/api";
import { toUTC, fromUTC, nowUTC } from "../utils/time";

type ReminderRecord = {
  id: number;
  text: string;
  remind_at: string;
  is_done: number;
  created_at: string;
};

export const RemindersService = {
  add: (text: string, remindAt: string, telegramMessageId?: number, timezone?: string): ReminderRecord => {
    const db = getDb();
    const remindAtUTC = timezone ? toUTC(remindAt, timezone) : remindAt;

    const result = db
      .prepare(
        `INSERT INTO reminders (text, remind_at, telegram_message_id)
         VALUES (?, ?, ?)`,
      )
      .run(text, remindAtUTC, telegramMessageId ?? null);

    return db.prepare("SELECT * FROM reminders WHERE id = ?").get(result.lastInsertRowid) as ReminderRecord;
  },

  markDone: (id: number): boolean => {
    const db = getDb();
    const result = db.prepare("UPDATE reminders SET is_done = 1 WHERE id = ? AND is_done = 0").run(id);
    return result.changes > 0;
  },

  getDue: (): ReminderRecord[] => {
    const db = getDb();
    const now = nowUTC();
    return db
      .prepare(
        `SELECT * FROM reminders
         WHERE is_done = 0 AND remind_at <= ?
         ORDER BY remind_at ASC`,
      )
      .all(now) as ReminderRecord[];
  },

  getAll: (includeDone: boolean = false): ReminderRecord[] => {
    const db = getDb();
    if (includeDone) {
      return db.prepare("SELECT * FROM reminders ORDER BY remind_at DESC").all() as ReminderRecord[];
    }
    return db.prepare("SELECT * FROM reminders WHERE is_done = 0 ORDER BY remind_at ASC").all() as ReminderRecord[];
  },

  getQueryResult: (includeDone: boolean = false, timezone?: string): string => {
    const rems = RemindersService.getAll(includeDone);
    const tz = timezone || "Europe/Moscow";
    const now = nowUTC();

    return JSON.stringify({
      count: rems.length,
      reminders: rems.map((r) => ({
        id: r.id,
        text: r.text,
        remind_at: fromUTC(r.remind_at, tz),
        is_done: !!r.is_done,
        created_at: r.created_at,
        is_overdue: !r.is_done && r.remind_at <= now,
      })),
    });
  },

  checkAndNotify: async (): Promise<void> => {
    const due = RemindersService.getDue();
    for (const r of due) {
      try {
        await TelegramApi.sendToMe(`⏰ Напоминание!\n\n${r.text}\n\nУстановлено: ${r.created_at}`);
        RemindersService.markDone(r.id);
        console.log(`[reminders] Sent reminder #${r.id}`);
      } catch (err) {
        console.error(`[reminders] Failed to send #${r.id}:`, err);
      }
    }
  },
};
