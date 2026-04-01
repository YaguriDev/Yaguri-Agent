import { getDb } from "../db";
import { toUTC, fromUTC } from "../utils/time";

type CalendarEvent = {
  id: number;
  title: string;
  description: string;
  start_at: string;
  end_at: string | null;
  is_all_day: number;
  created_at: string;
};

export const CalendarService = {
  add: (title: string, startAt: string, endAt?: string, description?: string, isAllDay?: boolean, telegramMessageId?: number, timezone?: string): CalendarEvent => {
    const db = getDb();
    const startAtUTC = timezone && !isAllDay ? toUTC(startAt, timezone) : startAt;
    const endAtUTC = endAt && timezone && !isAllDay ? toUTC(endAt, timezone) : (endAt ?? null);

    const result = db
      .prepare(
        `INSERT INTO calendar_events (title, description, start_at, end_at, is_all_day, telegram_message_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(title, description ?? "", startAtUTC, endAtUTC, isAllDay ? 1 : 0, telegramMessageId ?? null);

    return db.prepare("SELECT * FROM calendar_events WHERE id = ?").get(result.lastInsertRowid) as CalendarEvent;
  },

  softDelete: (id: number): boolean => {
    const db = getDb();
    const result = db.prepare("UPDATE calendar_events SET is_deleted = 1 WHERE id = ? AND is_deleted = 0").run(id);
    return result.changes > 0;
  },

  getByDate: (date: string): CalendarEvent[] => {
    const db = getDb();
    return db
      .prepare(
        `SELECT * FROM calendar_events
         WHERE is_deleted = 0
           AND (date(start_at) = date(?)
                OR (end_at IS NOT NULL AND date(?) BETWEEN date(start_at) AND date(end_at)))
         ORDER BY start_at ASC`,
      )
      .all(date, date) as CalendarEvent[];
  },

  getRange: (from: string, to: string): CalendarEvent[] => {
    const db = getDb();
    return db
      .prepare(
        `SELECT * FROM calendar_events
         WHERE is_deleted = 0
           AND date(start_at) BETWEEN date(?) AND date(?)
         ORDER BY start_at ASC`,
      )
      .all(from, to) as CalendarEvent[];
  },

  queryDate: (date: string, timezone?: string): string => {
    const events = CalendarService.getByDate(date);
    const tz = timezone || "Europe/Moscow";

    return JSON.stringify({
      date,
      is_free: events.length === 0,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        start: e.is_all_day ? e.start_at : fromUTC(e.start_at, tz),
        end: e.end_at ? (e.is_all_day ? e.end_at : fromUTC(e.end_at, tz)) : null,
        all_day: !!e.is_all_day,
      })),
      message: events.length === 0 ? `${date} — свободный день.` : `На ${date} есть ${events.length} событий.`,
    });
  },

  queryRange: (from: string, to: string, timezone?: string): string => {
    const events = CalendarService.getRange(from, to);
    const tz = timezone || "Europe/Moscow";

    return JSON.stringify({
      from,
      to,
      count: events.length,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        start: e.is_all_day ? e.start_at : fromUTC(e.start_at, tz),
        end: e.end_at ? (e.is_all_day ? e.end_at : fromUTC(e.end_at, tz)) : null,
        all_day: !!e.is_all_day,
      })),
    });
  },
};
