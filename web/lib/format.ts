export interface ScoreBand {
  label: string;
  tone: "high" | "mid" | "low" | "rest";
}

export function todayIso(reference = new Date()): string {
  return reference.toISOString().slice(0, 10);
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
  // Accept "HH:MM", "HH:MM:SS", or ISO datetime and normalize to "HH:MM" (24-hour).
  const timePart = value.includes("T") ? value.split("T")[1] : value;
  const [hhStr = "", mmStr = "00"] = timePart.split(":");
  const hh = Number.parseInt(hhStr, 10);
  const mm = Number.parseInt(mmStr, 10);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
    return value.slice(0, 5);
  }
  const normalizedHour = ((hh % 24) + 24) % 24;
  const normalizedMinute = ((mm % 60) + 60) % 60;
  return `${String(normalizedHour).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`;
}

export function getScoreBand(score: number): ScoreBand {
  if (score >= 80) {
    return { label: "strong day", tone: "high" };
  }
  if (score >= 65) {
    return { label: "supportive", tone: "high" };
  }
  if (score >= 50) {
    return { label: "steady", tone: "mid" };
  }
  if (score >= 35) {
    return { label: "soft caution", tone: "low" };
  }
  return { label: "restorative", tone: "rest" };
}
