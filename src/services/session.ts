import { getDb } from "../db";

const MAX_HISTORY = 50;

export type SessionMessage = {
  role: "user" | "assistant";
  content: string;
};

export const SessionService = {
  add: (chatId: number, role: "user" | "assistant", content: string): void => {
    const db = getDb();
    db.prepare("INSERT INTO chat_sessions (chat_id, role, content) VALUES (?, ?, ?)").run(chatId, role, content);
  },

  getHistory: (chatId: number, limit: number = MAX_HISTORY): SessionMessage[] => {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT role, content FROM chat_sessions
         WHERE chat_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .all(chatId, limit) as SessionMessage[];
    return rows.reverse();
  },

  clear: (chatId: number): number => {
    const db = getDb();
    const result = db.prepare("DELETE FROM chat_sessions WHERE chat_id = ?").run(chatId);
    return result.changes;
  },

  count: (chatId: number): number => {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) as cnt FROM chat_sessions WHERE chat_id = ?").get(chatId) as { cnt: number };
    return row.cnt;
  },
};
