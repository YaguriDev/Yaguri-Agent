export const toUTC = (localDateStr: string, timezone: string): string => {
  const [datePart, timePart] = localDateStr.split(" ");
  if (!datePart) return localDateStr;

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart || "00:00").split(":").map(Number);

  const testDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(testDate);
  const get = (type: string): number => {
    const p = parts.find((p) => p.type === type);
    return p ? parseInt(p.value, 10) : 0;
  };

  const tzYear = get("year");
  const tzMonth = get("month");
  const tzDay = get("day");
  const tzHour = get("hour");
  const tzMinute = get("minute");

  const utcMs = testDate.getTime();
  const tzDate = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute));
  const offsetMs = tzDate.getTime() - utcMs;

  const userLocal = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const utcResult = new Date(userLocal.getTime() - offsetMs);

  return formatDateUTC(utcResult);
};

export const fromUTC = (utcDateStr: string, timezone: string): string => {
  const [datePart, timePart] = utcDateStr.split(" ");
  if (!datePart) return utcDateStr;

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart || "00:00").split(":").map(Number);

  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const get = (type: string): string => {
    const p = parts.find((p) => p.type === type);
    return p ? p.value : "00";
  };

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
};

export const nowUTC = (): string => {
  const now = new Date();
  return formatDateUTC(now, true);
};

const pad = (n: number): string => n.toString().padStart(2, "0");

const formatDateUTC = (d: Date, includeSeconds: boolean = false): string => {
  const base = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  if (includeSeconds) return `${base}:${pad(d.getUTCSeconds())}`;
  return base;
};
