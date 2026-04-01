export const Charts = {
  expensePie: (categories: { category: string; total: number }[]): string => {
    const exp = categories.filter((c) => c.total < 0).map((c) => ({ name: c.category, value: Math.abs(c.total) }));
    if (exp.length === 0) return "";

    let chart = "```mermaid\npie title Расходы по категориям\n";
    for (const e of exp) chart += `    "${e.name}" : ${e.value}\n`;
    chart += "```";
    return chart;
  },

  incomePie: (categories: { category: string; total: number }[]): string => {
    const inc = categories.filter((c) => c.total > 0).map((c) => ({ name: c.category, value: c.total }));
    if (inc.length === 0) return "";

    let chart = "```mermaid\npie title Доходы по категориям\n";
    for (const i of inc) chart += `    "${i.name}" : ${i.value}\n`;
    chart += "```";
    return chart;
  },

  barChart: (data: { label: string; value: number }[], maxWidth: number = 30): string => {
    if (data.length === 0) return "";
    const maxVal = Math.max(...data.map((d) => Math.abs(d.value)));
    if (maxVal === 0) return "";

    let out = "```\n";
    for (const d of data) {
      const bar = "█".repeat(Math.round((Math.abs(d.value) / maxVal) * maxWidth));
      out += `${d.label.padEnd(15)} ${bar} ${d.value >= 0 ? "+" : ""}${d.value} ₽\n`;
    }
    out += "```";
    return out;
  },
};
