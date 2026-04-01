import { FinanceService } from "../services/finance";
import { Charts } from "./charts";

export const FinanceReport = {
  generateMonthly: (): string => {
    const data = FinanceService.getForObsidian("month");
    const monthName = new Date().toLocaleString("ru-RU", { month: "long", year: "numeric" });

    let md = `# 💰 Финансы — ${monthName}\n\n`;
    md += `> Обновлено: ${new Date().toLocaleString("ru-RU")}\n\n`;

    md += `## 📊 Сводка\n\n`;
    md += `| Показатель | Сумма |\n|---|---|\n`;
    md += `| Доходы | +${data.totalIncome} ₽ |\n`;
    md += `| Расходы | ${data.totalExpense} ₽ |\n`;
    md += `| Баланс | ${data.totalIncome + data.totalExpense} ₽ |\n`;
    md += `| Операций | ${data.records.length} |\n\n`;

    const ep = Charts.expensePie(data.categories);
    if (ep) md += `## 📉 Расходы\n\n${ep}\n\n`;

    const ip = Charts.incomePie(data.categories);
    if (ip) md += `## 📈 Доходы\n\n${ip}\n\n`;

    const bar = Charts.barChart(data.categories.map((c) => ({ label: c.category, value: c.total })));
    if (bar) md += `## Все категории\n\n${bar}\n\n`;

    md += `## 📜 Операции\n\n`;
    md += `| # | Дата | Сумма | Категория | Описание |\n|---|---|---|---|---|\n`;
    for (const r of data.records) {
      md += `| ${r.id} | ${r.created_at} | ${r.amount >= 0 ? "+" : ""}${r.amount} ₽ | ${r.category} | ${r.description} |\n`;
    }

    return md;
  },

  generateAllTime: (): string => {
    const data = FinanceService.getForObsidian("all");

    let md = `# 💰 Финансы — Всё время\n\n`;
    md += `> Обновлено: ${new Date().toLocaleString("ru-RU")}\n\n`;
    md += `| Показатель | Сумма |\n|---|---|\n`;
    md += `| Доходы | +${data.totalIncome} ₽ |\n`;
    md += `| Расходы | ${data.totalExpense} ₽ |\n`;
    md += `| Баланс | ${data.totalIncome + data.totalExpense} ₽ |\n`;
    md += `| Операций | ${data.records.length} |\n\n`;

    const ep = Charts.expensePie(data.categories);
    if (ep) md += `## Расходы\n\n${ep}\n\n`;

    return md;
  },
};
