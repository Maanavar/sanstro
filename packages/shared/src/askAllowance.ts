import { formatClockLabel } from "./utils/format";

/**
 * What Ask Vinaadi tells a reader whose questions are spent, shared by web and
 * mobile so the two cannot word it differently.
 *
 * The quota day is Kolkata's (docs/CLOCK_POLICY.md), so "ask again tomorrow"
 * was only true in India and Sri Lanka. A New York reader's allowance refills
 * at 14:30 the same afternoon, a Singapore reader's at 02:30. The server sends
 * the instant (`resetsAt` on GET /ask-vinaadi/daily-status) and this names it
 * in the reader's own clock. For an Indian reader it still reads "tomorrow".
 */

type Lang = "en" | "ta";

/** The fields of the daily-status response that the limit copy reads. */
export interface AskAllowanceStatus {
  dailyLimit: number | null;
  monthlyLimit: number | null;
  /** Optional only so an older server without the field still gets "tomorrow". */
  resetsAt?: string | null;
}

/** Minutes east of UTC at an instant. Device time by default; a parameter so
 *  tests can stand in New York or Singapore. Plain Date arithmetic, because
 *  Hermes's Intl time-zone support cannot be relied on. */
export type UtcOffsetAt = (instant: Date) => number;
const deviceOffset: UtcOffsetAt = (instant) => -instant.getTimezoneOffset();

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TA_MONTHS = [
  "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
  "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்",
];

const DAY_MS = 86_400_000;

function parseInstant(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function localParts(instant: Date, offsetAt: UtcOffsetAt) {
  const shifted = new Date(instant.getTime() + offsetAt(instant) * 60_000);
  return {
    dayNumber: Math.floor(shifted.getTime() / DAY_MS),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hh: shifted.getUTCHours(),
    mm: shifted.getUTCMinutes(),
  };
}

/** True once the server's reset instant has passed. A client that is still
 *  blocking the reader on yesterday's count should step aside and let the
 *  server decide. */
export function askAllowanceRefilled(resetsAt: string | null | undefined, now: Date = new Date()): boolean {
  const at = parseInstant(resetsAt);
  return at !== null && at.getTime() <= now.getTime();
}

/** A Tamil clock label for this message. Native review 2026-10-12 (A-04..A-06):
 *  00:00 is நள்ளிரவு 12:00, and 00:01–05:59 is அதிகாலை. formatClockLabel's
 *  shared buckets call 00:00–04:59 இரவு, and "நாளை இரவு 2:30" reads as tomorrow
 *  NIGHT; "நாளை நள்ளிரவு 12:30" can read as tomorrow's midnight. The other hours
 *  keep the 2026-09-17 buckets, which the review did not reopen for the app. */
function taClock(hh: number, mm: number): string {
  const minutes = String(mm).padStart(2, "0");
  if (hh === 0 && mm === 0) return "நள்ளிரவு 12:00";
  if (hh < 6) return `அதிகாலை ${hh || 12}:${minutes}`;
  return formatClockLabel(`${String(hh).padStart(2, "0")}:${minutes}`, "ta");
}

/** When the allowance refills, as an adverbial phrase in the reader's clock:
 *  "tomorrow", "from 2:30 pm today", "from 1 Nov". In Tamil, "… மணிக்குப்
 *  பிறகு" (native review, A-02). */
export function askResetWhen(
  resetsAt: string | null | undefined,
  lang: Lang,
  now: Date = new Date(),
  offsetAt: UtcOffsetAt = deviceOffset,
): string {
  const ta = lang === "ta";
  const at = parseInstant(resetsAt);
  // A server without the field still meant Kolkata midnight.
  if (!at) return ta ? "நாளை" : "tomorrow";
  if (at.getTime() <= now.getTime()) return ta ? "இப்போது" : "now";

  const r = localParts(at, offsetAt);
  const days = r.dayNumber - localParts(now, offsetAt).dayNumber;
  const hhmm = `${String(r.hh).padStart(2, "0")}:${String(r.mm).padStart(2, "0")}`;
  const midnight = r.hh === 0 && r.mm === 0;

  const after = ta ? `${taClock(r.hh, r.mm)} மணிக்குப் பிறகு` : "";

  if (days === 1 && midnight) return ta ? "நாளை" : "tomorrow";
  if (days === 0) return ta ? `இன்று ${after}` : `from ${formatClockLabel(hhmm)} today`;
  if (days === 1) return ta ? `நாளை ${after}` : `from ${formatClockLabel(hhmm)} tomorrow`;
  // Further out is a monthly allowance.
  const date = ta ? `${TA_MONTHS[r.month]} ${r.day}` : `${r.day} ${EN_MONTHS[r.month]}`;
  if (midnight) return ta ? `${date} முதல்` : `from ${date}`;
  return ta ? `${date} ${after}` : `from ${formatClockLabel(hhmm)} on ${date}`;
}

/** The whole limit sentence. The number is the server's, never prose: this
 *  line once said "3" while the server allowed 7 (GRW-05). An upgrade is
 *  offered only when one exists — not to a subscriber, not in the open beta. */
export function askLimitMessage(
  status: AskAllowanceStatus,
  lang: Lang,
  canUpgrade: boolean,
  now: Date = new Date(),
  offsetAt: UtcOffsetAt = deviceOffset,
): string {
  const monthly = status.dailyLimit == null && status.monthlyLimit != null;
  const n = (monthly ? status.monthlyLimit : status.dailyLimit) ?? 0;
  const when = askResetWhen(status.resetsAt, lang, now, offsetAt);

  if (lang === "ta") {
    // Native review 2026-10-12: "கேட்டுவிட்டீர்கள்" (asked), not the
    // translated "பயன்படுத்திவிட்டீர்கள்" (used) — A-01, applied to the daily
    // line for the same reason; and "கேட்கலாம்" (you may ask), an opening, not
    // the instruction "கேளுங்கள்" — A-09, applied to the upgrade clause too.
    const used = monthly
      ? `இந்த மாதத்திற்கான ${n} கேள்விகளையும் கேட்டுவிட்டீர்கள்.`
      : `இன்றைக்கான ${n} கேள்விகளையும் கேட்டுவிட்டீர்கள்.`;
    return canUpgrade
      ? `${used} கூடுதல் கேள்விகளுக்கு மேம்படுத்தலாம், அல்லது ${when} மீண்டும் கேட்கலாம்.`
      : `${used} ${when} மீண்டும் கேட்கலாம்.`;
  }
  const noun = `question${n === 1 ? "" : "s"}`;
  const used = monthly ? `You've used this month's ${n} ${noun}.` : `You've used today's ${n} ${noun}.`;
  return canUpgrade ? `${used} Upgrade for more, or ask again ${when}.` : `${used} Ask again ${when}.`;
}
