/** Today in the caller's local calendar day, not UTC — `toISOString()` shifts
 *  to UTC first, which reads as "yesterday" for any positive-offset timezone
 *  (e.g. IST, UTC+5:30) during the hours after local midnight but before UTC
 *  has rolled over. */
export function todayIso(reference = new Date()): string {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, "0");
  const day = String(reference.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(isoDate: string, days: number): string {
  const value = new Date(`${isoDate}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function formatDateLabel(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** Tamil almanac period-word for a 24h hour. The word comes BEFORE the number
 *  ("மதியம் 1:42"), never a Latin am/pm. Buckets per the 2026-09-17 doctrine
 *  ruling: காலை 5–11:59, மதியம் 12–15:59, மாலை 16–18:59, இரவு 19 onward.
 *  00:00–04:59 is also இரவு — the ruling did not name that span. */
export function tamilDayPeriod(h24: number): string {
  if (h24 >= 5 && h24 < 12) return "காலை";
  if (h24 >= 12 && h24 < 16) return "மதியம்";
  if (h24 >= 16 && h24 < 19) return "மாலை";
  return "இரவு";
}

export function formatClockLabel(value: string, lang: "en" | "ta" = "en"): string {
  const timePart = value.includes("T") ? value.split("T")[1] : value;
  const [hhStr = "", mmStr = "00"] = (timePart ?? "").split(":");
  const hh = Number.parseInt(hhStr, 10);
  const mm = Number.parseInt(mmStr, 10);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return value.slice(0, 5);
  const h24 = ((hh % 24) + 24) % 24;
  const m = ((mm % 60) + 60) % 60;
  const h12 = h24 % 12 || 12;
  const clock = `${h12}:${String(m).padStart(2, "0")}`;
  if (lang === "ta") return `${tamilDayPeriod(h24)} ${clock}`;
  return `${clock} ${h24 < 12 ? "am" : "pm"}`;
}

/** Hour-only label for tight spots (axis ticks, "best window 6 am"):
 *  "6 am" / "காலை 6". Same period-word buckets as `formatClockLabel`. */
export function formatClockHour(value: string, lang: "en" | "ta" = "en"): string {
  return formatClockLabel(value, lang).replace(/:\d{2}(?= |$)/, "");
}

/** A start–end clock range. English keeps the tight "1:42 pm–3:18 pm"; Tamil
 *  spaces the dash because each end carries its own period-word. */
export function formatClockRange(start: string, end: string, lang: "en" | "ta" = "en"): string {
  const sep = lang === "ta" ? " – " : "–";
  return `${formatClockLabel(start, lang)}${sep}${formatClockLabel(end, lang)}`;
}

export function formatDateTimeLabel(value: string | null | undefined): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  }).format(date).replace(/\b(AM|PM)\b/g, (match) => match.toLowerCase());
}
