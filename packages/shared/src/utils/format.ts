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

export function formatClockLabel(value: string): string {
  const timePart = value.includes("T") ? value.split("T")[1] : value;
  const [hhStr = "", mmStr = "00"] = (timePart ?? "").split(":");
  const hh = Number.parseInt(hhStr, 10);
  const mm = Number.parseInt(mmStr, 10);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return value.slice(0, 5);
  const h24 = ((hh % 24) + 24) % 24;
  const m = ((mm % 60) + 60) % 60;
  const period = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
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
