import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";
import { config } from "../../config";

const BLACKLIST_NAMES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];
const BLACKLIST_EXTENSIONS = [".prod", ".local", ".pem", ".key"];
const BLACKLIST_DIRS = [".git"];
const SKIP_DIRS = ["node_modules", ".git", "dist", ".next", ".nuxt"];

const isBlacklisted = (filePath: string): string | null => {
  const name = path.basename(filePath);
  const parts = filePath.split(path.sep);

  if (BLACKLIST_NAMES.includes(name)) return `"${name}" запрещён`;
  if (name === ".env" || name.startsWith(".env.")) return "env запрещён";
  if (BLACKLIST_EXTENSIONS.some((e) => name.endsWith(e))) return `"${name}" запрещённое расширение`;
  const blocked = BLACKLIST_DIRS.find((dir) => parts.includes(dir));
  if (blocked) return `Путь содержит "${blocked}"`;

  return null;
};

export const registerFilesystemTools = (server: McpServer): void => {
  server.tool(
    "copy_to_workspace",
    "Скопировать файл или папку в рабочую папку",
    {
      source_path: z.string().describe("Абсолютный путь"),
      filename: z.string().optional().describe("Имя в workspace"),
    },
    async ({ source_path, filename }) => {
      const blocked = isBlacklisted(source_path);
      if (blocked) {
        return {
          content: [{ type: "text" as const, text: `Запрещено: ${blocked}` }],
          isError: true,
        };
      }

      try {
        const name = filename ?? path.basename(source_path);
        const dest = path.join(config.paths.workspace, name);
        const stat = await fs.stat(source_path);

        if (stat.isDirectory()) {
          await fs.cp(source_path, dest, {
            recursive: true,
            filter: (src) => {
              const parts = src.split(path.sep);
              const baseName = path.basename(src);
              if (SKIP_DIRS.some((dir) => parts.includes(dir))) return false;
              if (baseName === ".env" || baseName.startsWith(".env.")) return false;
              if (BLACKLIST_NAMES.includes(baseName)) return false;
              return true;
            },
          });
          return {
            content: [{ type: "text" as const, text: `Папка: ${source_path} → ${dest}` }],
          };
        } else {
          await fs.copyFile(source_path, dest);
          return {
            content: [{ type: "text" as const, text: `Файл: ${source_path} → ${dest}` }],
          };
        }
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    },
  );
};
