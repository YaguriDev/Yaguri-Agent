import { config } from "../config";
import { SessionMessage } from "../services/session";

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type LLMMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string | Array<any> }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string };

const MAX_TOOL_ROUNDS = 8;
const LLM_TIMEOUT_MS = 120_000;

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "add_finance",
      description: "Добавить трату (отрицательная сумма) или доход (положительная сумма)",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Сумма. Отрицательная = трата, положительная = доход",
          },
          category: {
            type: "string",
            description:
              "Категория расходов: Продукты, Транспорт, Развлечения, Подписки, Одежда, Здоровье, Еда вне дома, Жильё, Связь, Образование, Спорт, Красота, Табак/Вейп, Алкоголь, Животные, Техника, Подарки/Праздники, Путешествия, Ремонт, Другое. Категории доходов: Зарплата, Фриланс, Подарок, Возврат, Инвестиции, Другое",
          },
          description: { type: "string", description: "Краткое описание" },
        },
        required: ["amount", "category", "description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_finance",
      description: "Удалить финансовую запись по ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID записи" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_finances",
      description: "Получить финансовую статистику и список операций за период",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "today, week, month, all",
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_note",
      description: "Создать заметку",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Заголовок" },
          content: { type: "string", description: "Текст" },
          tags: { type: "string", description: "Теги через запятую" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_notes",
      description: "Получить список заметок. Можно искать по тексту или тегу",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "Поисковый запрос (ищет в title, content, tags). Пустая строка = все заметки",
          },
          limit: {
            type: "number",
            description: "Максимум записей (по умолчанию 20)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_note",
      description: "Удалить заметку по ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID заметки" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_reminder",
      description: "Поставить напоминание",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Текст напоминания" },
          remind_at: {
            type: "string",
            description: "Когда напомнить в часовом поясе пользователя: YYYY-MM-DD HH:mm",
          },
        },
        required: ["text", "remind_at"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_reminders",
      description: "Получить список активных (невыполненных) напоминаний",
      parameters: {
        type: "object",
        properties: {
          include_done: {
            type: "boolean",
            description: "Включить выполненные (по умолчанию false)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "complete_reminder",
      description: "Отметить напоминание как выполненное",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID напоминания" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_calendar_event",
      description: "Добавить событие в календарь",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Название" },
          description: { type: "string", description: "Описание" },
          start_at: {
            type: "string",
            description: "Начало в часовом поясе пользователя: YYYY-MM-DD HH:mm",
          },
          end_at: {
            type: "string",
            description: "Конец в часовом поясе пользователя: YYYY-MM-DD HH:mm",
          },
          is_all_day: { type: "boolean", description: "На весь день" },
        },
        required: ["title", "start_at"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_calendar",
      description: "Получить события за дату или диапазон дат",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "YYYY-MM-DD — конкретная дата",
          },
          from: {
            type: "string",
            description: "YYYY-MM-DD — начало диапазона",
          },
          to: {
            type: "string",
            description: "YYYY-MM-DD — конец диапазона",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_calendar_event",
      description: "Удалить событие из календаря по ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID события" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "sync_obsidian",
      description: "Синхронизировать все данные с Obsidian. Используй когда пользователь просит синхронизировать, обновить, сохранить в Obsidian/Notion или сделать бэкап",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "remember_fact",
      description: "Запомнить факт о пользователе для будущих разговоров. Используй когда пользователь просит что-то запомнить о себе.",
      parameters: {
        type: "object",
        properties: {
          fact: { type: "string", description: "Факт для запоминания" },
        },
        required: ["fact"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_profile",
      description: "Обновить профиль пользователя — имя, часовой пояс или описание о себе. Используй когда пользователь хочет изменить своё имя, указать часовой пояс или описание.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Новое имя пользователя" },
          timezone: {
            type: "string",
            description: "Часовой пояс (например Europe/Moscow)",
          },
          about: {
            type: "string",
            description: "Описание о себе (профессия, интересы и т.д.)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "clear_facts",
      description: "Очистить все запомненные факты о пользователе",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "clear_session",
      description: "Сбросить историю текущего разговора (новая сессия). Используй когда пользователь просит очистить историю чата, начать заново, забыть разговор.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description: "Поиск в интернете через HTML DuckDuckGo. Используй когда нужно найти актуальную информацию, загуглить что-то, узнать новости или найти решение проблемы. Работает без ключей",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Поисковый запрос" },
          max_results: { type: "number", description: "Максимум результатов (по умолчанию 5)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "fetch_page",
      description: "Открыть и прочитать содержимое сайта, репозитория или любой веб-страницы по URL.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL страницы" },
        },
        required: ["url"],
      },
    },
  },
];

const buildSystemPrompt = (userContext: string, timezone: string): string => {
  const tz = timezone || "Europe/Moscow";
  const now = new Date().toLocaleString("ru-RU", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "long",
  });

  const userSection = userContext ? `\n\n=== ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ===\n${userContext}\n=== КОНЕЦ ПРОФИЛЯ ===` : "";

  return `Ты — персональный AI-ассистент Yaguri. Пол мужской. Отвечаешь всегда на русском, кратко, с эмодзи и Markdown.${userSection}

У тебя есть полный доступ к персональной базе пользователя через tools.

**Основные правила использования инструментов:**
- Финансы: траты/доходы → add_finance (отрицательная сумма = трата)
- Статистика финансов → query_finances
- Удалить запись → delete_finance
- Заметки: создать → add_note, показать/найти → query_notes, удалить → delete_note
- Напоминания: создать → add_reminder, показать → query_reminders, выполнить → complete_reminder
- Календарь: добавить → add_calendar_event, посмотреть → query_calendar, удалить → delete_calendar_event
- Синхронизация в Obsidian → sync_obsidian
- Запомнить факт о пользователе → remember_fact
- Забыть всё о пользователе → clear_facts
- Очистить сессию/начать заново → clear_session
- Изменить имя, часовой пояс или описание → update_profile
- Поиск в интернете → web_search. Если ошибка - сразу используй fetch_page на конкретных сайтах (cbr.ru, banki.ru, rbc.ru, finance.yahoo.com и т.д.).
- Открыть/прочитать сайт → fetch_page

**Критически важно по времени:**
- Часовой пояс пользователя: ${tz}
- Текущее время пользователя: ${now}
- Все даты и время в инструментах указывай строго в часовом поясе пользователя (${tz}).
- "Через 5 минут", "завтра", "послезавтра" — считай от ${now}.

**Поведение:**
- После любого tool call ВСЕГДА отвечай текстом (что сделал, подтверждение, результат).
- Если нужно показать данные — форматируй красиво.
- Если не понимаешь или не хватает данных (время события и т.д.) — спрашивай уточнение.

Markdown разрешён, НО:
- ЗАПРЕЩЕНО использовать #, ##, ### и любые заголовки
- если используешь заголовки — ответ считается ОШИБКОЙ
- вместо заголовков используй жирный текст (**...**) или эмодзи

Категории трат: Продукты, Транспорт, Развлечения, Подписки, Одежда, Здоровье, Еда вне дома, Жильё, Связь, Образование, Спорт, Красота, Табак, Алкоголь, Животные, Техника, Подарки/Праздники, Путешествия, Ремонт, Другое.
Категории доходов: Зарплата, Фриланс, Подарок, Возврат, Инвестиции, Другое.`;
};

const cleanResponse = (text: string): string => {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, "");
  cleaned = cleaned.replace(/<\/?think>/gi, "");
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, "");
  cleaned = cleaned.replace(/^\s*\n+/, "");
  return cleaned.trim();
};

const extractLeakedToolCalls = (reasoning: string): ToolCall[] => {
  const results: ToolCall[] = [];
  const funcRegex = /<function=(\w+)>([\s\S]*?)<\/function>/g;
  let match;

  while ((match = funcRegex.exec(reasoning)) !== null) {
    const name = match[1];
    const body = match[2];
    const args: Record<string, unknown> = {};

    const paramRegex = /<parameter=(\w+)>\n?([\s\S]*?)\n?<\/parameter>/g;
    let paramMatch;
    while ((paramMatch = paramRegex.exec(body)) !== null) {
      const key = paramMatch[1];
      const val = paramMatch[2].trim();
      if (val === "true") args[key] = true;
      else if (val === "false") args[key] = false;
      else if (val !== "" && !isNaN(Number(val))) args[key] = Number(val);
      else args[key] = val;
    }

    results.push({
      id: `recovered_${Date.now()}_${results.length}`,
      type: "function",
      function: { name, arguments: JSON.stringify(args) },
    });
  }

  return results;
};

const fetchWithTimeout = async (url: string, opts: RequestInit, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export type ToolCallRecord = {
  name: string;
  args: any;
  result: string;
};

export const LLM = {
  chat: async (
    userContent: string | Array<any>,
    history: SessionMessage[],
    userContext: string,
    toolHandler: (name: string, args: any) => Promise<string>,
    timezone: string = "Europe/Moscow",
    onToolCall?: (record: ToolCallRecord) => void,
  ): Promise<string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.llm.apiKey) {
      headers["Authorization"] = `Bearer ${config.llm.apiKey}`;
    }

    const messages: LLMMessage[] = [
      { role: "system", content: buildSystemPrompt(userContext, timezone) },
      ...history.map(
        (m) =>
          ({
            role: m.role,
            content: m.content,
          }) as LLMMessage,
      ),
      { role: "user", content: userContent },
    ];

    for (let i = 0; i < MAX_TOOL_ROUNDS; i++) {
      const body: Record<string, unknown> = {
        model: config.llm.model,
        messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.6,
        top_p: 0.95,
        top_k: 20,
        min_p: 0,
        max_tokens: config.llm.maxTokens,
      };

      const res = await fetchWithTimeout(
        `${config.llm.baseUrl}/v1/chat/completions`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        },
        LLM_TIMEOUT_MS,
      );

      if (!res.ok) {
        const errText = await res.text();

        if (res.status === 429) {
          const wait = Math.min(2000 * 2 ** i, 30000);
          console.warn(`[llm] Rate limited (429), waiting ${wait}ms...`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }

        throw new Error(`LLM error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      if (!choice) throw new Error("LLM: no choices");

      const assistant = choice.message;

      if ((!assistant.tool_calls || assistant.tool_calls.length === 0) && assistant.reasoning_content) {
        const leaked = extractLeakedToolCalls(assistant.reasoning_content);
        if (leaked.length > 0) {
          console.log(`[llm] Recovered ${leaked.length} tool call(s) from reasoning_content`);
          assistant.tool_calls = leaked;
          assistant.content = null;
        }
      }

      const assistantMsg: LLMMessage = {
        role: "assistant",
        content: assistant.content ?? null,
        ...(assistant.tool_calls?.length ? { tool_calls: assistant.tool_calls } : {}),
      };
      messages.push(assistantMsg);

      if (!assistant.tool_calls || assistant.tool_calls.length === 0) {
        const raw = assistant.content || assistant.reasoning_content || "";
        const cleaned = cleanResponse(raw);
        if (!cleaned) {
          console.warn("[llm] Empty response, raw:", JSON.stringify(assistant));
        }
        return cleaned;
      }

      for (const tc of assistant.tool_calls) {
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = {};
        }

        console.log(`[llm] Tool: ${tc.function.name}`, args);

        try {
          const result = await toolHandler(tc.function.name, args);

          onToolCall?.({ name: tc.function.name, args, result });

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });
        } catch (err) {
          const errorResult = `Error: ${(err as Error).message}`;
          onToolCall?.({ name: tc.function.name, args, result: errorResult });
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: errorResult,
          });
        }
      }
    }

    return "Слишком много итераций. Попробуй проще.";
  },
};
