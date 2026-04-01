import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { TelegramApi } from "../../telegram/api";

export const registerTelegramTools = (server: McpServer): void => {
  server.tool(
    "send_telegram_to_user",
    "Отправить сообщение пользователю в Telegram",
    {
      chat_id: z.number().describe("Telegram chat_id"),
      message: z.string().describe("Текст сообщения (Markdown)"),
    },
    async ({ chat_id, message }) => {
      try {
        await TelegramApi.sendMessage(chat_id, message);
        return {
          content: [{ type: "text" as const, text: `Sent to ${chat_id} ✓` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "send_telegram_to_me",
    "Отправить себе в Telegram",
    {
      message: z.string().describe("Текст"),
    },
    async ({ message }) => {
      try {
        await TelegramApi.sendToMe(message);
        return {
          content: [{ type: "text" as const, text: "Sent to me ✓" }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    },
  );
};
