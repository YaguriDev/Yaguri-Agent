import * as cheerio from "cheerio";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_RESULTS = 6;
const MAX_CONTENT_LENGTH = 8000;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
];

const randomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const WebService = {
  search: async (query: string, maxResults: number = MAX_RESULTS): Promise<string> => {
    const attempts = 2;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await sleep(700 + Math.random() * 600);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=ru-ru`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": randomUA(),
            Accept: "text/html,application/xhtml+xml,application/xml",
            "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        clearTimeout(timer);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const html = await res.text();
        const $ = cheerio.load(html);

        const results: Array<{ title: string; url: string; snippet: string }> = [];

        $(".result").each((_, el) => {
          const titleEl = $(el).find(".result__a");
          const snippetEl = $(el).find(".result__snippet");

          let title = titleEl.text().trim();
          let href = titleEl.attr("href") || "";

          if (href.startsWith("/l/?uddg=")) {
            href = decodeURIComponent(href.split("uddg=")[1].split("&")[0]);
          }

          const snippet = snippetEl.text().trim();

          if (title && href && results.length < maxResults) {
            results.push({ title, url: href, snippet });
          }
        });

        if (results.length > 0) {
          return JSON.stringify({
            ok: true,
            query,
            results,
            engine: "duckduckgo-html",
            count: results.length,
          });
        }
      } catch (err) {
        console.warn(`[web_search] Attempt ${attempt} failed:`, (err as Error).message);
        if (attempt === attempts) {
          return JSON.stringify({ ok: false, error: (err as Error).message });
        }
        await sleep(1500);
      }
    }

    return JSON.stringify({ ok: false, error: "Ничего не найдено" });
  },

  fetchPage: async (url: string): Promise<string> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timer);

      if (!res.ok) {
        return JSON.stringify({ ok: false, error: `HTTP ${res.status}` });
      }

      const contentType = res.headers.get("content-type") ?? "";

      if (!contentType.includes("text/html")) {
        const text = await res.text();
        return JSON.stringify({
          ok: true,
          url,
          content: text.slice(0, MAX_CONTENT_LENGTH),
        });
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      $("script, style, nav, footer, header, aside, iframe, noscript, svg").remove();
      $("[class*='cookie'], [class*='popup'], [class*='banner'], [id*='cookie']").remove();

      const title = $("title").text().trim() || $("h1").first().text().trim();

      let content = "";
      const candidates = ["article", "main", "[role='main']", ".content", "#content", ".post", ".entry"];
      for (const selector of candidates) {
        const el = $(selector);
        if (el.length) {
          content = el.text();
          break;
        }
      }
      if (!content) {
        content = $("body").text();
      }

      content = content.replace(/\s+/g, " ").trim().slice(0, MAX_CONTENT_LENGTH);

      return JSON.stringify({ ok: true, url, title, content });
    } catch (err) {
      return JSON.stringify({ ok: false, error: (err as Error).message });
    }
  },
};
