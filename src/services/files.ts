import { config } from "../config";
import path from "path";

const TG_BASE = `https://api.telegram.org/bot${config.telegram.botToken}`;
const TG_FILE_BASE = `https://api.telegram.org/file/bot${config.telegram.botToken}`;

export type FileContext = {
  type: "image" | "document" | "voice" | "audio";
  mimeType: string;
  base64?: string;
  text?: string;
  fileName?: string;
  fileSizeBytes?: number;
  transcription?: string;
};

const getFilePath = async (fileId: string): Promise<string> => {
  const res = await fetch(`${TG_BASE}/getFile?file_id=${fileId}`);
  const json = (await res.json()) as { ok: boolean; result: { file_path: string } };
  if (!json.ok) throw new Error("getFile failed");
  return json.result.file_path;
};

const downloadFile = async (filePath: string): Promise<Buffer> => {
  const url = `${TG_FILE_BASE}/${filePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const SUPPORTED_TEXT_EXTS = [".txt", ".md", ".csv", ".json", ".js", ".ts", ".py", ".html", ".xml", ".yaml", ".yml", ".log", ".sh"];

const tryReadAsText = async (buf: Buffer, fileName: string): Promise<string | null> => {
  const ext = path.extname(fileName).toLowerCase();
  if (SUPPORTED_TEXT_EXTS.includes(ext)) {
    return buf.toString("utf-8").slice(0, 8000);
  }
  return null;
};

const transcribeViaGroq = async (buf: Buffer, mimeType: string): Promise<string | null> => {
  if (!config.llm.groqApiKey) return null;

  try {
    const blob = new Blob([new Uint8Array(buf)], { type: mimeType });
    const formData = new FormData();
    formData.append("file", blob, "voice.ogg");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "text");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.llm.groqApiKey}` },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[groq whisper] Error:", err);
      return null;
    }

    const text = await res.text();
    return text.trim() || null;
  } catch (err) {
    console.error("[groq whisper] Exception:", err);
    return null;
  }
};

const transcribeViaLocal = async (buf: Buffer, mimeType: string): Promise<string | null> => {
  if (!config.llm.whisperUrl) return null;

  try {
    const blob = new Blob([new Uint8Array(buf)], { type: mimeType });
    const formData = new FormData();
    formData.append("file", blob, "voice.ogg");
    formData.append("model", "whisper-1");

    const res = await fetch(`${config.llm.whisperUrl}/v1/audio/transcriptions`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { text?: string };
    return json.text ?? null;
  } catch {
    return null;
  }
};

export const FileHandler = {
  processPhoto: async (photos: Array<{ file_id: string; file_size?: number }>): Promise<FileContext | null> => {
    try {
      const best = photos.sort((a, b) => (b.file_size ?? 0) - (a.file_size ?? 0))[0];
      const filePath = await getFilePath(best.file_id);
      const buf = await downloadFile(filePath);
      const base64 = buf.toString("base64");
      const ext = path.extname(filePath).toLowerCase();
      const mimeMap: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };
      const mimeType = mimeMap[ext] ?? "image/jpeg";

      return { type: "image", mimeType, base64, fileSizeBytes: best.file_size };
    } catch (err) {
      console.error("[files] photo error:", err);
      return null;
    }
  },

  processDocument: async (doc: { file_id: string; file_name?: string; mime_type?: string; file_size?: number }): Promise<FileContext | null> => {
    try {
      const fileName = doc.file_name ?? "file";
      const mimeType = doc.mime_type ?? "application/octet-stream";

      if (mimeType.startsWith("image/")) {
        const filePath = await getFilePath(doc.file_id);
        const buf = await downloadFile(filePath);
        return { type: "image", mimeType, base64: buf.toString("base64"), fileName, fileSizeBytes: doc.file_size };
      }

      const filePath = await getFilePath(doc.file_id);
      const buf = await downloadFile(filePath);
      const text = await tryReadAsText(buf, fileName);

      return {
        type: "document",
        mimeType,
        text: text ?? `[Бинарный файл: ${fileName}, ${doc.file_size ?? "?"} байт — не могу прочитать содержимое]`,
        fileName,
        fileSizeBytes: doc.file_size,
      };
    } catch (err) {
      console.error("[files] document error:", err);
      return null;
    }
  },

  processVoice: async (voice: { file_id: string; duration?: number; mime_type?: string }): Promise<FileContext | null> => {
    try {
      const filePath = await getFilePath(voice.file_id);
      const buf = await downloadFile(filePath);
      const mimeType = voice.mime_type ?? "audio/ogg";

      const transcription = (await transcribeViaGroq(buf, mimeType)) ?? (await transcribeViaLocal(buf, mimeType));

      console.log("   > transcription:", transcription ?? "<empty>");

      return {
        type: "voice",
        mimeType,
        transcription: transcription ?? `[Голосовое сообщение, ${voice.duration ?? "?"} сек]`,
      };
    } catch (err) {
      console.error("[files] voice error:", err);
      return null;
    }
  },

  buildLLMContent: (text: string | null, fileCtx: FileContext | null): Array<any> => {
    const parts: Array<any> = [];

    if (fileCtx?.type === "image" && fileCtx.base64) {
      parts.push({
        type: "image_url",
        image_url: { url: `data:${fileCtx.mimeType};base64,${fileCtx.base64}` },
      });
    }

    let textContent = text ?? "";

    if (fileCtx?.type === "document" && fileCtx.text) {
      textContent += `\n\n[Прикреплённый файл: ${fileCtx.fileName}]\n${fileCtx.text}`;
    }

    if (fileCtx?.type === "voice" && fileCtx.transcription) {
      textContent = `[Голосовое сообщение]: ${fileCtx.transcription}`;
    }

    if (textContent.trim()) {
      parts.push({ type: "text", text: textContent.trim() });
    }

    return parts.length > 0 ? parts : [{ type: "text", text: "(пустое сообщение)" }];
  },
};
