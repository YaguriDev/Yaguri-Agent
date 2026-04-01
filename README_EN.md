<div align="center">

![Yaguri Banner](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=Yaguri&fontSize=80&fontAlignY=35&desc=Personal%20AI%20Assistant%20for%20Telegram&descAlignY=55&descSize=20)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://core.telegram.org/bots)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Self-hosted AI assistant for Telegram with finance tracking, notes, reminders and calendar**

[🇷🇺 Русский](README.md) •
[Features](#-features) •
[Installation](#-installation) •
[Configuration](#-configuration)

</div>

---

## 📋 About

Yaguri is a personal AI assistant that works through Telegram. It understands natural language and helps track finances, create notes, set reminders, and manage your calendar. All data is stored locally in SQLite and can be synced to Obsidian.

### Why Yaguri?

- **Privacy** - all data stored locally on your machine
- **Natural language** - just write as you would to a friend
- **Flexible** - works with any OpenAI-compatible LLM API
- **Integration** - sync with Obsidian for beautiful reports
- **MCP server** - works with Claude Desktop and other MCP clients

---

## ✨ Features

| Feature          | Examples                                                     |
| ---------------- | ------------------------------------------------------------ |
| 💰 **Finance**   | `-50 groceries`, `+3000 salary`, `spending this month?`      |
| 📝 **Notes**     | `note: project ideas`, `show notes`, `find notes about work` |
| ⏰ **Reminders** | `remind me in 30 min to call`, `tomorrow at 10am meeting`    |
| 📅 **Calendar**  | `meeting friday 3pm`, `is wednesday free?`                   |
| 🧠 **Memory**    | `remember I prefer morning meetings`, `my name is Alex`      |
| 📎 **Files**     | Images, documents (.txt, .md, .json), voice messages         |
| 🔄 **Sync**      | Export all data to Obsidian vault                            |

---

## 🛠 Tech Stack

- **TypeScript** - main language
- **Node.js 20+** - runtime
- **better-sqlite3** - local database
- **Telegram Bot API** - chat interface
- **OpenAI-compatible API** - any LLM (local or cloud)
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

### Tips

**Minimize to tray:** Use [RBTray](https://github.com/benbuck/rbtray) - right-click minimize button to send window to tray.

**Autostart:** Create shortcut to `start.bat` in `shell:startup` folder.

**Best model for me:** `qwen3.5-9b-uncensored-hauhaucs-aggressive`.

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

## 📄 License

MIT License. See [LICENSE](LICENSE).

---

<div align="center">

![Footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer)

</div>
