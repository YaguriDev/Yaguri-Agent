<div align="center">

![Yaguri Banner](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=Yaguri&fontSize=80&fontAlignY=35&desc=Personal%20AI%20Assistant%20for%20Telegram&descAlignY=55&descSize=20)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://core.telegram.org/bots)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Self-hosted AI assistant for Telegram with finance tracking, notes, reminders, calendar and web search**

[🇷🇺 Русский](README.md) •
[Features](#-features) •
[Installation](#-installation) •
[Configuration](#-configuration)

</div>

---

## 📋 About

Yaguri is a personal AI assistant that works through Telegram. It understands natural language and helps track finances, create notes, set reminders, manage your calendar, search the web, and read websites. All data is stored locally in SQLite and can be synced to Obsidian.

### Why Yaguri?

- **Privacy** - all data stored locally on your machine
- **Natural language** - just write as you would to a friend
- **Flexible** - works with any OpenAI-compatible LLM API
- **Web search** - DuckDuckGo search and page reading with no API keys required
- **Integration** - sync with Obsidian for beautiful reports
- **MCP server** - works with Claude Desktop and other MCP clients

---

## ✨ Features

| Feature           | Examples                                                         |
| ----------------- | ---------------------------------------------------------------- |
| 💰 **Finance**    | `-50 groceries`, `+3000 salary`, `spending this month?`          |
| 📝 **Notes**      | `note: project ideas`, `show notes`, `find notes about work`     |
| ⏰ **Reminders**  | `remind me in 30 min to call`, `tomorrow at 10am meeting`        |
| 📅 **Calendar**   | `meeting friday 3pm`, `is wednesday free?`                       |
| 🔍 **Web Search** | `google how to fix CORS error`, `find latest news about GPT-5`   |
| 🌐 **Read Pages** | `read this article: https://...`, `open repo and explain README` |
| 🧠 **Memory**     | `remember I prefer morning meetings`, `my name is Alex`          |
| 📎 **Files**      | Images, documents (.txt, .md, .json), voice messages             |
| 🔄 **Sync**       | Export all data to Obsidian vault                                |

---

## 🛠 Tech Stack

- **TypeScript** - main language
- **Node.js 20+** - runtime
- **better-sqlite3** - local database
- **Telegram Bot API** - chat interface
- **OpenAI-compatible API** - any LLM (local or cloud)
- **cheerio** - HTML parsing for web page reading
- **Groq Whisper** - voice transcription
- **MCP SDK** - Model Context Protocol

---

## 📦 Installation

### Requirements

- [Node.js](https://nodejs.org/) 20+
- [Git](https://git-scm.com/)
- Telegram bot (create via [@BotFather](https://t.me/BotFather))
- OpenAI-compatible LLM (LM Studio, Ollama, OpenRouter, etc.)

### Steps

```bash
# Clone
git clone https://github.com/YaguriDev/Yaguri-Agent.git
cd Yaguri-Agent

# Install dependencies
npm install

# Create config
copy .env.example .env

# Edit .env with your settings (see Configuration)

# Run
start.bat
```

Or manually:

```bash
npm run build
node --env-file=.env dist/index.js
```

---

## ⚙ Configuration

### `.env` file

```env
# ===== TELEGRAM =====
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_MY_CHAT_ID=123456789

# ===== LLM =====
LLM_BASE_URL=http://localhost:1234
LLM_MODEL=qwen2.5-32b-instruct
LLM_API_KEY=
LLM_MAX_TOKENS=4096

# ===== WHISPER (optional) =====
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# ===== PATHS =====
DB_PATH=./data/agent.db
OBSIDIAN_VAULT_PATH=C:/Users/You/Documents/Obsidian/Vault
WORKSPACE_PATH=./workspace
```

### Getting credentials

| What          | How                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **Bot Token** | [@BotFather](https://t.me/BotFather) → `/newbot`                                                      |
| **Chat ID**   | [@userinfobot](https://t.me/userinfobot) → send any message                                           |
| **Groq API**  | [console.groq.com](https://console.groq.com) (free)                                                   |
| **LLM**       | [LM Studio](https://lmstudio.ai/), [Ollama](https://ollama.ai/), [OpenRouter](https://openrouter.ai/) |

---

## 🚀 Usage

### Bot Commands

| Command    | Description                 |
| ---------- | --------------------------- |
| `/start`   | Get started                 |
| `/help`    | Show help                   |
| `/new`     | New session (clear history) |
| `/sync`    | Sync to Obsidian            |
| `/profile` | View profile                |

### Example conversations

**Finance:**

```
You: -890 taxi to work
Bot: ✅ Saved: -890 ₽, Transport - taxi to work

You: how much did I spend today?
Bot: 📊 Today: -2340 ₽
     • Transport: -890 ₽
     • Food out: -450 ₽
     • Groceries: -1000 ₽
```

**Web search and reading:**

```
You: google how to fix "Cannot find module" in Node.js
Bot: 🔍 Found 5 results:
     1. Stack Overflow - "Cannot find module" error in Node.js
        https://stackoverflow.com/...
     2. Node.js docs - Module resolution
     ...

You: read the first link
Bot: 📄 Reading... The main cause of this error is an incorrect path or...
```

### Tips

**Minimize to tray:** Use [RBTray](https://github.com/benbuck/rbtray) - right-click minimize button to send window to tray.

**Autostart:** Create shortcut to `start.bat` in `shell:startup` folder.

**Best model:** `qwen3.5-9b-uncensored-hauhaucs-aggressive` - great balance of speed, vision and tool calling support.

---

## 🔌 MCP Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "yaguri": {
      "command": "node",
      "args": ["C:/path/to/yaguri/dist/mcp-entry.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "token",
        "TELEGRAM_MY_CHAT_ID": "id",
        "DB_PATH": "C:/path/to/data/agent.db",
        "OBSIDIAN_VAULT_PATH": "C:/path/to/vault",
        "WORKSPACE_PATH": "C:/path/to/workspace"
      }
    }
  }
}
```

---

## 📁 Project Structure

```
yaguri/
├── src/
│   ├── index.ts          # Telegram bot entry point
│   ├── mcp-entry.ts      # MCP server entry point
│   ├── config.ts         # Configuration
│   ├── db/               # Database and migrations
│   ├── llm/              # LLM integration
│   ├── services/
│   │   ├── finance.ts    # Finance tracking
│   │   ├── notes.ts      # Notes
│   │   ├── reminders.ts  # Reminders
│   │   ├── calendar.ts   # Calendar
│   │   ├── web.ts        # Web search and page reading
│   │   ├── files.ts      # File handling
│   │   ├── profile.ts    # User profile
│   │   └── session.ts    # Chat history
│   ├── telegram/         # Telegram API
│   ├── obsidian/         # Obsidian sync
│   ├── mcp/              # MCP server
│   └── utils/            # Utilities
├── data/                 # Database (auto-created)
├── workspace/            # Working files
├── .env                  # Config (not in git)
├── .env.example          # Config example
├── package.json
├── tsconfig.json
└── start.bat             # Startup script
```

---

## 📄 License

MIT License. See [LICENSE](LICENSE).

---

<div align="center">

![Footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer)

</div>
