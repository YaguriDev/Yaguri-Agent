import path from "path";

const env = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    console.error(`[config] Missing env: ${name}`);
    process.exit(1);
  }
  return value;
};

const envOptional = (name: string): string | undefined => process.env[name];

export const config = {
  telegram: {
    botToken: env("TELEGRAM_BOT_TOKEN"),
    myChatId: Number(env("TELEGRAM_MY_CHAT_ID")),
  },
  llm: {
    baseUrl: env("LLM_BASE_URL", "http://localhost:1234"),
    model: env("LLM_MODEL"),
    apiKey: envOptional("LLM_API_KEY"),
    maxTokens: Number(env("LLM_MAX_TOKENS", "4096")),
    whisperUrl: envOptional("WHISPER_URL"),
    whisperApiKey: envOptional("WHISPER_API_KEY"),
    groqApiKey: envOptional("GROQ_API_KEY"),
  },
  paths: {
    db: path.resolve(env("DB_PATH", "./data/agent.db")),
    obsidianVault: env("OBSIDIAN_VAULT_PATH"),
    workspace: env("WORKSPACE_PATH"),
  },
  polling: {
    intervalMs: Number(env("POLL_INTERVAL_MS", "3000")),
    obsidianSyncIntervalMs: Number(env("OBSIDIAN_SYNC_INTERVAL_MS", "300000")),
  },
};
