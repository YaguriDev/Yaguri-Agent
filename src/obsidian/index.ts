import fs from "fs";
import path from "path";
import { config } from "../config";
import { FinanceReport } from "./finance-report";
import { NotesService } from "../services/notes";
import { CalendarService } from "../services/calendar";
import { getDb } from "../db";

const ensureDir = (dir: string): void => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const writeFile = (filePath: string, content: string): void => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`[obsidian] Written: ${path.basename(filePath)}`);
};

export const ObsidianSync = {
  syncAll: (): void => {
    const vault = config.paths.obsidianVault;
    console.log("[obsidian] Syncing to:", vault);

    ObsidianSync.syncFinances(vault);
    ObsidianSync.syncNotes(vault);
    ObsidianSync.syncReminders(vault);
    ObsidianSync.syncCalendar(vault);
    ObsidianSync.syncDashboard(vault);

    console.log("[obsidian] Done");
  },

  syncFinances: (vault: string): void => {
    const dir = path.join(vault, "Finance");
    writeFile(path.join(dir, "Monthly Report.md"), FinanceReport.generateMonthly());
    writeFile(path.join(dir, "All Time.md"), FinanceReport.generateAllTime());
  },

  syncNotes: (vault: string): void => {
    const notes = NotesService.getAll();
    let md = `# 📝 Заметки\n\n> Обновлено: ${new Date().toLocaleString("ru-RU")}\n\n`;
    for (const n of notes) {
      const tags = n.tags
        ? n.tags
            .split(",")
            .map((t: string) => `#${t.trim()}`)
            .join(" ")
        : "";
      md += `## ${n.title}\n_${n.created_at}_ ${tags}\n\n${n.content}\n\n---\n\n`;
    }
    writeFile(path.join(vault, "Notes", "All Notes.md"), md);
  },

  syncReminders: (vault: string): void => {
    const db = getDb();
    const rems = db.prepare("SELECT * FROM reminders WHERE is_done = 0 ORDER BY remind_at ASC").all() as any[];

    let md = `# ⏰ Напоминания\n\n> Обновлено: ${new Date().toLocaleString("ru-RU")}\n\n`;
    if (rems.length === 0) {
      md += "Нет активных напоминаний.\n";
    } else {
      md += "| # | Текст | Время |\n|---|---|---|\n";
      for (const r of rems) {
        const past = new Date(r.remind_at) <= new Date() ? " ⚠️" : "";
        md += `| ${r.id} | ${r.text} | ${r.remind_at}${past} |\n`;
      }
    }
    writeFile(path.join(vault, "Reminders.md"), md);
  },

  syncCalendar: (vault: string): void => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const from = today.toISOString().split("T")[0];
    const to = nextWeek.toISOString().split("T")[0];
    const events = CalendarService.getRange(from, to);

    let md = `# 📅 Календарь\n\n> ${from} — ${to}\n> Обновлено: ${new Date().toLocaleString("ru-RU")}\n\n`;

    if (events.length === 0) {
      md += "Нет событий на неделю.\n";
    } else {
      const byDay: Record<string, typeof events> = {};
      for (const e of events) {
        const day = e.start_at.split(" ")[0] ?? e.start_at.split("T")[0];
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(e);
      }
      for (const [day, dayEvents] of Object.entries(byDay)) {
        const weekday = new Date(day).toLocaleString("ru-RU", { weekday: "long" });
        md += `## ${day} (${weekday})\n\n`;
        for (const e of dayEvents) {
          const time = e.is_all_day ? "весь день" : (e.start_at.split(" ")[1] ?? "");
          md += `- **${e.title}** — ${time}`;
          if (e.description) md += ` — ${e.description}`;
          md += "\n";
        }
        md += "\n";
      }
    }
    writeFile(path.join(vault, "Calendar.md"), md);
  },

  syncDashboard: (vault: string): void => {
    let md = `# 🏠 Dashboard\n\n> Обновлено: ${new Date().toLocaleString("ru-RU")}\n\n`;
    md += "## Ссылки\n\n";
    md += "- [[Finance/Monthly Report|💰 Финансы]]\n";
    md += "- [[Finance/All Time|💰 Всё время]]\n";
    md += "- [[Notes/All Notes|📝 Заметки]]\n";
    md += "- [[Reminders|⏰ Напоминания]]\n";
    md += "- [[Calendar|📅 Календарь]]\n";
    writeFile(path.join(vault, "Dashboard.md"), md);
  },
};
