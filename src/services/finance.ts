import { getDb } from "../db";

type FinanceRecord = {
  id: number;
  amount: number;
  category: string;
  description: string;
  created_at: string;
  telegram_message_id: number | null;
};

export const FinanceService = {
  add: (amount: number, category: string, description: string, telegramMessageId?: number): FinanceRecord => {
    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO finances (amount, category, description, telegram_message_id)
         VALUES (?, ?, ?, ?)`,
      )
      .run(amount, category, description, telegramMessageId ?? null);

    return db.prepare("SELECT * FROM finances WHERE id = ?").get(result.lastInsertRowid) as FinanceRecord;
  },

  softDelete: (id: number): boolean => {
    const db = getDb();
    const result = db.prepare("UPDATE finances SET is_deleted = 1 WHERE id = ? AND is_deleted = 0").run(id);
    return result.changes > 0;
  },

  getByPeriod: (period: "today" | "week" | "month" | "all"): FinanceRecord[] => {
    const db = getDb();
    let where = "is_deleted = 0";

    switch (period) {
      case "today":
        where += " AND date(created_at) = date('now', 'localtime')";
        break;
      case "week":
        where += " AND created_at >= datetime('now', 'localtime', '-7 days')";
        break;
      case "month":
        where += " AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')";
        break;
      case "all":
        break;
    }

    return db.prepare(`SELECT * FROM finances WHERE ${where} ORDER BY created_at DESC`).all() as FinanceRecord[];
  },

  getCategoryTotals: (period: "today" | "week" | "month" | "all"): { category: string; total: number; count: number }[] => {
    const db = getDb();
    let where = "is_deleted = 0";

    switch (period) {
      case "today":
        where += " AND date(created_at) = date('now', 'localtime')";
        break;
      case "week":
        where += " AND created_at >= datetime('now', 'localtime', '-7 days')";
        break;
      case "month":
        where += " AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')";
        break;
    }

    return db
      .prepare(
        `SELECT category, SUM(amount) as total, COUNT(*) as count
         FROM finances WHERE ${where}
         GROUP BY category ORDER BY total ASC`,
      )
      .all() as any[];
  },

  getForObsidian: (
    period: "month" | "all",
  ): {
    records: FinanceRecord[];
    categories: { category: string; total: number; count: number }[];
    totalIncome: number;
    totalExpense: number;
  } => {
    const records = FinanceService.getByPeriod(period);
    const categories = FinanceService.getCategoryTotals(period);
    const totalIncome = categories.filter((c) => c.total > 0).reduce((s, c) => s + c.total, 0);
    const totalExpense = categories.filter((c) => c.total < 0).reduce((s, c) => s + c.total, 0);
    return { records, categories, totalIncome, totalExpense };
  },

  getQueryResult: (period: "today" | "week" | "month" | "all"): string => {
    const records = FinanceService.getByPeriod(period);
    const categories = FinanceService.getCategoryTotals(period);
    const totalIncome = categories.filter((c) => c.total > 0).reduce((s, c) => s + c.total, 0);
    const totalExpense = categories.filter((c) => c.total < 0).reduce((s, c) => s + c.total, 0);

    return JSON.stringify({
      period,
      record_count: records.length,
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome + totalExpense,
      categories: categories.map((c) => ({
        name: c.category,
        total: c.total,
        count: c.count,
      })),
      recent: records.slice(0, 10).map((r) => ({
        id: r.id,
        amount: r.amount,
        category: r.category,
        description: r.description,
        date: r.created_at,
      })),
    });
  },
};
