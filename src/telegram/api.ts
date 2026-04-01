import { config } from "../config";

const BASE = `https://api.telegram.org/bot${config.telegram.botToken}`;
const TG_MAX_LENGTH = 4096;

const call = async (method: string, body?: object): Promise<any> => {
  const opts: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}/${method}`, opts);
  const json = await res.json();

  if (!json.ok) {
    throw new Error(json.description ?? `TG API error: ${method}`);
  }

  return json.result;
};

const splitMessage = (text: string, maxLength: number = TG_MAX_LENGTH): string[] => {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    let splitAt = maxLength;
    const newline = remaining.lastIndexOf("\n", maxLength);
    const space = remaining.lastIndexOf(" ", maxLength);

    if (newline > maxLength * 0.5) {
      splitAt = newline + 1;
    } else if (space > maxLength * 0.5) {
      splitAt = space + 1;
    }

    chunks.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks;
};

export type TgPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

export type TgDocument = {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

export type TgVoice = {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
};

export type TgAudio = {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  mime_type?: string;
  file_size?: number;
};

export type TgMessage = {
  message_id: number;
  from?: { id: number; first_name?: string };
  chat: { id: number };
  date: number;
  text?: string;
  caption?: string;
  photo?: TgPhotoSize[];
  document?: TgDocument;
  voice?: TgVoice;
  audio?: TgAudio;
};

export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
};

export const TelegramApi = {
  getUpdates: (offset: number, timeout: number = 30): Promise<TgUpdate[]> =>
    call("getUpdates", {
      offset,
      timeout,
      allowed_updates: ["message"],
    }),

  sendMessage: (chatId: number, text: string, parseMode: string = ""): Promise<any> => {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
    };
    if (parseMode) {
      body.parse_mode = parseMode;
    }
    return call("sendMessage", body);
  },

  sendLong: async (chatId: number, text: string, parseMode: string = "Markdown"): Promise<void> => {
    const chunks = splitMessage(text);
    for (const chunk of chunks) {
      try {
        await TelegramApi.sendMessage(chatId, chunk, parseMode);
      } catch (err) {
        const errMsg = (err as Error).message ?? "";
        if (parseMode && (errMsg.includes("can't parse entities") || errMsg.includes("Can't parse"))) {
          await TelegramApi.sendMessage(chatId, chunk, "");
        } else {
          throw err;
        }
      }
    }
  },

  sendToMe: (text: string): Promise<any> => TelegramApi.sendMessage(config.telegram.myChatId, text),

  setMyCommands: (): Promise<any> =>
    call("setMyCommands", {
      commands: [
        { command: "start", description: "Начать" },
        { command: "help", description: "Показать справку" },
        { command: "new", description: "Новая сессия (очистить историю)" },
        { command: "sync", description: "Синхронизация с Obsidian" },
        { command: "profile", description: "Мой профиль" },
      ],
    }),

  setReaction: async (chatId: number, messageId: number, emoji: string = "👍"): Promise<any> => {
    try {
      return await call("setMessageReaction", {
        chat_id: chatId,
        message_id: messageId,
        reaction: [{ type: "emoji", emoji }],
      });
    } catch (err) {
      console.error(`[telegram] setReaction "${emoji}" failed on #${messageId}:`, (err as Error).message);
    }
  },

  setProcessingReaction: (chatId: number, messageId: number): Promise<any> => TelegramApi.setReaction(chatId, messageId, "👀"),
  setDoneReaction: (chatId: number, messageId: number): Promise<any> => TelegramApi.setReaction(chatId, messageId, "👍"),
  setErrorReaction: (chatId: number, messageId: number): Promise<any> => TelegramApi.setReaction(chatId, messageId, "👎"),
};
