<div align="center">

![Yaguri Banner](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=Yaguri&fontSize=80&fontAlignY=35&desc=Personal%20AI%20Assistant%20for%20Telegram&descAlignY=55&descSize=20)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://core.telegram.org/bots)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Персональный AI-ассистент в Telegram с поддержкой финансов, заметок, напоминаний, календаря и поиска в интернете**

[Возможности](#-возможности) •
[Установка](#-установка) •
[Настройка](#-настройка) •
[Использование](#-использование) •
[🇬🇧 English](README_EN.md)

</div>

---

## 📋 О проекте

Yaguri - персональный AI-ассистент, работающий через Telegram. Понимает естественный язык и помогает вести учёт финансов, создавать заметки, ставить напоминания, управлять календарём, искать информацию в интернете и читать сайты. Все данные хранятся локально в SQLite и могут синхронизироваться с Obsidian.

### Почему Yaguri?

- **Приватность** - данные хранятся только на вашем компьютере
- **Естественный язык** - просто пишите как обычному собеседнику
- **Гибкость** - работает с любым LLM через OpenAI-совместимый API
- **Интернет** - поиск через DuckDuckGo и чтение сайтов без API ключей
- **Интеграция** - синхронизация с Obsidian для красивых отчётов
- **MCP-сервер** - интеграция с Claude Desktop и другими MCP-клиентами

---

## ✨ Возможности

### 💰 Финансы

```
-1500 продукты пятёрочка
+50000 зарплата
сколько потратил за месяц?
удали трату #15
```

### 📝 Заметки

```
запиши: идеи для проекта - сделать API, добавить тесты
покажи заметки
найди заметки про проект
```

### ⏰ Напоминания

```
напомни через 30 минут проверить почту
напомни завтра в 10:00 созвон с командой
покажи напоминания
```

### 📅 Календарь

```
встреча в пятницу в 15:00 с заказчиком
свободна ли среда?
что запланировано на неделю?
```

### 🔍 Поиск в интернете

```
загугли как исправить ошибку CORS в Node.js
найди новости про релиз GPT-5
поищи лучшие практики TypeScript 2025
```

### 🌐 Чтение сайтов и репозиториев

```
прочитай эту статью: https://habr.com/...
открой репозиторий и объясни что делает README: https://github.com/...
прочитай документацию: https://docs.example.com/api
```

### 🧠 Память и профиль

```
запомни, что я предпочитаю утренние встречи
меня зовут Алекс
мой часовой пояс Europe/Moscow
```

### 📎 Файлы

- Отправьте изображение - Yaguri его проанализирует
- Отправьте документ (.txt, .md, .json и др.) - прочитает содержимое
- Отправьте голосовое сообщение - транскрибирует и ответит

### 🔄 Синхронизация

```
синхронизируй с Obsidian
сделай бэкап
```

---

## 🛠 Технологии

| Технология           | Назначение                               |
| -------------------- | ---------------------------------------- |
| **TypeScript**       | Основной язык                            |
| **Node.js 20+**      | Среда выполнения                         |
| **better-sqlite3**   | Локальная база данных                    |
| **Telegram Bot API** | Интерфейс общения                        |
| **OpenAI API**       | Совместимый LLM (локальный или облачный) |
| **Groq Whisper**     | Транскрипция голосовых сообщений         |
| **cheerio**          | Парсинг HTML страниц и сайтов            |
| **MCP SDK**          | Model Context Protocol для интеграций    |
| **Obsidian**         | Синхронизация отчётов в Markdown         |

---

## 📦 Установка

### Требования

- [Node.js](https://nodejs.org/) версии 20 или выше
- [Git](https://git-scm.com/)
- Telegram-бот (создайте через [@BotFather](https://t.me/BotFather))
- LLM с OpenAI-совместимым API (LM Studio, Ollama, OpenRouter, OpenAI и др.)

### Шаги установки

1. **Клонируйте репозиторий**

```bash
git clone https://github.com/YaguriDev/Yaguri-Agent.git
cd Yaguri-Agent
```

2. **Установите зависимости**

```bash
npm install
```

3. **Создайте файл конфигурации**

```bash
copy .env.example .env
```

4. **Заполните `.env`** (см. раздел [Настройка](#-настройка))

5. **Запустите**

```bash
start.bat
```

Или вручную:

```bash
npm run build
node --env-file=.env dist/index.js
```

---

## ⚙ Настройка

### Файл `.env`

```env
# ===== TELEGRAM =====
# Токен бота от @BotFather
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Ваш Telegram ID (узнать: @userinfobot)
TELEGRAM_MY_CHAT_ID=123456789

# ===== LLM =====
# URL вашего LLM API
LLM_BASE_URL=http://localhost:1234

# Название модели
LLM_MODEL=qwen2.5-32b-instruct

# API ключ (если требуется)
LLM_API_KEY=

# Максимум токенов в ответе
LLM_MAX_TOKENS=4096

# ===== WHISPER (опционально) =====
# Для транскрипции голосовых сообщений (бесплатно)
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# Или локальный Whisper
WHISPER_URL=http://localhost:8080

# ===== ПУТИ =====
# Где хранить базу данных
DB_PATH=./data/agent.db

# Путь к Obsidian vault для синхронизации
OBSIDIAN_VAULT_PATH=C:/Users/Username/Documents/Obsidian/MyVault

# Рабочая папка для файлов
WORKSPACE_PATH=./workspace

# ===== ИНТЕРВАЛЫ =====
# Интервал опроса Telegram (мс)
POLL_INTERVAL_MS=3000

# Интервал синхронизации с Obsidian (мс)
OBSIDIAN_SYNC_INTERVAL_MS=300000
```

### Получение данных

#### Telegram Bot Token

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Скопируйте токен

#### Telegram Chat ID

1. Откройте [@userinfobot](https://t.me/userinfobot)
2. Отправьте любое сообщение
3. Скопируйте ваш ID

#### Groq API Key (для голосовых)

1. Зарегистрируйтесь на [console.groq.com](https://console.groq.com)
2. Создайте API ключ
3. Бесплатно, лимиты достаточные для личного использования

#### LLM

Рекомендуемые варианты:

- **[LM Studio](https://lmstudio.ai/)** - локальный, бесплатный
- **[Ollama](https://ollama.ai/)** - локальный, бесплатный
- **[OpenRouter](https://openrouter.ai/)** - облачный, много моделей
- **OpenAI** - облачный, платный

---

## 🚀 Использование

### Запуск

Дважды кликните `start.bat` или выполните:

```bash
npm run build && node --env-file=.env dist/index.js
```

### Команды бота

| Команда    | Описание                       |
| ---------- | ------------------------------ |
| `/start`   | Начало работы                  |
| `/help`    | Справка по командам            |
| `/new`     | Новая сессия (очистка истории) |
| `/sync`    | Синхронизация с Obsidian       |
| `/profile` | Просмотр профиля               |

### Примеры диалогов

**Финансы:**

```
Вы: -890 такси до работы
Бот: ✅ Записал: -890 ₽, Транспорт - такси до работы

Вы: сколько потратил сегодня?
Бот: 📊 Сегодня: -2340 ₽
     • Транспорт: -890 ₽
     • Еда вне дома: -450 ₽
     • Продукты: -1000 ₽
```

**Поиск и чтение сайтов:**

```
Вы: загугли как решить Cannot find module в Node.js
Бот: 🔍 Нашёл 5 результатов:
     1. Stack Overflow - "Cannot find module" error in Node.js
        https://stackoverflow.com/...
     2. Node.js docs - Module resolution
     ...

Вы: прочитай первую ссылку
Бот: 📄 Читаю... Основная причина ошибки - неверный путь или...
```

**Напоминания:**

```
Вы: напомни через 2 часа позвонить маме
Бот: ⏰ Готово! Напомню в 18:30

[через 2 часа]
Бот: ⏰ Напоминание! позвонить маме
```

---

## 💡 Рекомендации

### RBTray - сворачивание в трей

Чтобы окно консоли не мешало, используйте [RBTray](https://github.com/benbuck/rbtray):

1. Скачайте с [GitHub Releases](https://github.com/benbuck/rbtray/releases)
2. Запустите `RBTray.exe`
3. Правый клик по кнопке сворачивания окна → окно уйдёт в трей

### Автозапуск

1. Нажмите `Win + R`
2. Введите `shell:startup`
3. Создайте ярлык на `start.bat`

### Локальная модель

`LM Studio` + `qwen3.5-9b-uncensored-hauhaucs-aggressive` дают оптимальную производительность с поддержкой `vision` и `tools`.

---

## 🔌 MCP-интеграция

Yaguri можно использовать как MCP-сервер для Claude Desktop и других клиентов.

### Настройка Claude Desktop

Добавьте в `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "yaguri": {
      "command": "node",
      "args": ["C:/path/to/yaguri/dist/mcp-entry.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your_token",
        "TELEGRAM_MY_CHAT_ID": "your_id",
        "DB_PATH": "C:/path/to/yaguri/data/agent.db",
        "OBSIDIAN_VAULT_PATH": "C:/path/to/vault",
        "WORKSPACE_PATH": "C:/path/to/yaguri/workspace"
      }
    }
  }
}
```

---

## 📁 Структура проекта

```
yaguri/
├── src/
│   ├── index.ts          # Точка входа Telegram-бота
│   ├── mcp-entry.ts      # Точка входа MCP-сервера
│   ├── config.ts         # Конфигурация
│   ├── db/               # База данных и миграции
│   ├── llm/              # Интеграция с LLM
│   ├── services/
│   │   ├── finance.ts    # Финансы
│   │   ├── notes.ts      # Заметки
│   │   ├── reminders.ts  # Напоминания
│   │   ├── calendar.ts   # Календарь
│   │   ├── web.ts        # Поиск и парсинг сайтов
│   │   ├── files.ts      # Обработка файлов
│   │   ├── profile.ts    # Профиль пользователя
│   │   └── session.ts    # История чата
│   ├── telegram/         # Telegram API
│   ├── obsidian/         # Синхронизация с Obsidian
│   ├── mcp/              # MCP-сервер
│   └── utils/            # Утилиты
├── data/                 # База данных (создаётся автоматически)
├── workspace/            # Рабочие файлы
├── .env                  # Конфигурация (не в git)
├── .env.example          # Пример конфигурации
├── package.json
├── tsconfig.json
└── start.bat             # Скрипт запуска
```

---

## 🤝 Лицензия

MIT License. Подробности в файле [LICENSE](LICENSE).

---

<div align="center">

**[🇬🇧 English Version](README_EN.md)**

![Footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer)

</div>
