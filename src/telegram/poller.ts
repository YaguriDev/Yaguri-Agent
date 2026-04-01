import { config } from "../config";
import { getDb } from "../db";
import { TelegramApi, TgUpdate } from "./api";

const CLEANUP_KEEP_ROWS = 10000;
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

const hasContent = (update: TgUpdate): boolean => {
  const msg = update.message;
  if (!msg) return false;
  return !!(msg.text || msg.caption || msg.photo || msg.document || msg.voice || msg.audio);
};

export const TelegramPoller = {
  _running: false,
  _lastCleanup: 0,

  getLastOffset: (): number => {
    const db = getDb();
    const row = db.prepare("SELECT value FROM poll_state WHERE key = 'last_update_id'").get() as { value: string } | undefined;
    return row ? Number(row.value) : 0;
  },

  setLastOffset: (offset: number): void => {
    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO poll_state (key, value) VALUES ('last_update_id', ?)").run(String(offset));
  },

  isAlreadyProcessed: (messageId: number, chatId: number): boolean => {
    const db = getDb();
    const row = db.prepare("SELECT 1 FROM processed_messages WHERE message_id = ? AND chat_id = ?").get(messageId, chatId);
    return !!row;
  },

  markProcessed: (messageId: number, chatId: number): void => {
    const db = getDb();
    db.prepare("INSERT OR IGNORE INTO processed_messages (message_id, chat_id) VALUES (?, ?)").run(messageId, chatId);
  },

  cleanupProcessed: (): void => {
    const now = Date.now();
    if (now - TelegramPoller._lastCleanup < CLEANUP_INTERVAL_MS) return;

    try {
      const db = getDb();
      const countRow = db.prepare("SELECT COUNT(*) as cnt FROM processed_messages").get() as { cnt: number };

      if (countRow.cnt > CLEANUP_KEEP_ROWS) {
        const deleteCount = countRow.cnt - CLEANUP_KEEP_ROWS;
        db.prepare(
          `DELETE FROM processed_messages WHERE rowid IN (
            SELECT rowid FROM processed_messages ORDER BY rowid ASC LIMIT ?
          )`,
        ).run(deleteCount);
        console.log(`[poller] Cleaned up ${deleteCount} old processed_messages rows`);
      }

      TelegramPoller._lastCleanup = now;
    } catch (err) {
      console.error("[poller] Cleanup error:", (err as Error).message);
    }
  },

  isAuthorized: (update: TgUpdate): boolean => {
    const msg = update.message;
    if (!msg) return false;
    if (msg.chat.id !== config.telegram.myChatId) return false;
    if (msg.from && msg.from.id !== config.telegram.myChatId) return false;
    return true;
  },

  poll: async (onMessage: (update: TgUpdate) => Promise<void>): Promise<void> => {
    TelegramPoller._running = true;
    console.log("[poller] Polling started");

    while (TelegramPoller._running) {
      try {
        TelegramPoller.cleanupProcessed();

        const offset = TelegramPoller.getLastOffset() + 1;
        const updates = await TelegramApi.getUpdates(offset, 30);

        for (const update of updates) {
          TelegramPoller.setLastOffset(update.update_id);

          if (!hasContent(update)) continue;

          if (!TelegramPoller.isAuthorized(update)) {
            console.log(`[poller] Unauthorized: chat=${update.message?.chat.id}, from=${update.message?.from?.id}`);
            continue;
          }

          if (TelegramPoller.isAlreadyProcessed(update.message!.message_id, update.message!.chat.id)) {
            console.log(`[poller] Duplicate #${update.message!.message_id}, skip`);
            continue;
          }

          await onMessage(update);
        }
      } catch (err) {
        console.error("[poller] Error:", (err as Error).message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  },

  stop: (): void => {
    TelegramPoller._running = false;
  },
};
