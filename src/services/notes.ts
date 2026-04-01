import { getDb } from "../db";

type NoteRecord = {
  id: number;
  title: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
  telegram_message_id: number | null;
};

export const NotesService = {
  add: (title: string, content: string, tags?: string, telegramMessageId?: number): NoteRecord => {
    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO notes (title, content, tags, telegram_message_id)
         VALUES (?, ?, ?, ?)`,
      )
      .run(title, content, tags ?? "", telegramMessageId ?? null);

    return db.prepare("SELECT * FROM notes WHERE id = ?").get(result.lastInsertRowid) as NoteRecord;
  },

  softDelete: (id: number): boolean => {
    const db = getDb();
    const result = db.prepare("UPDATE notes SET is_deleted = 1 WHERE id = ? AND is_deleted = 0").run(id);
    return result.changes > 0;
  },

  getAll: (): NoteRecord[] => {
    const db = getDb();
    return db.prepare("SELECT * FROM notes WHERE is_deleted = 0 ORDER BY created_at DESC").all() as NoteRecord[];
  },

  search: (query: string, limit: number = 20): NoteRecord[] => {
    const db = getDb();
    if (!query || query.trim() === "") {
      return db.prepare("SELECT * FROM notes WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT ?").all(limit) as NoteRecord[];
    }
    const like = `%${query}%`;
    return db
      .prepare(
        `SELECT * FROM notes
         WHERE is_deleted = 0
           AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
         ORDER BY created_at DESC LIMIT ?`,
      )
      .all(like, like, like, limit) as NoteRecord[];
  },

  getQueryResult: (search?: string, limit?: number): string => {
    const notes = NotesService.search(search ?? "", limit ?? 20);
    return JSON.stringify({
      count: notes.length,
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        tags: n.tags,
        created_at: n.created_at,
      })),
    });
  },
};
