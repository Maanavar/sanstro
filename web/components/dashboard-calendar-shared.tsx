"use client";

// Shared calendar utilities/leaf-components extracted from the (now-deleted)
// Classic dashboard-calendar-tab.tsx during the Nova-only migration
// (docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3b). Pure functions/constants plus
// three presentational leaf components (DayTimeline, MoonPhaseMark,
// LunarTithiBadge) with no Classic/Nova fork.

import { formatClockLabel, formatDateLabel } from "@/lib/format";
import { tNakshatra } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { lunarSpecialTithiMeta } from "@/lib/lunar";
import { festivalGlyph } from "@/lib/astro-symbols";
import type { PanchangamDailyResponseData, PanchangamFestival } from "@/lib/types";

export type CalendarView = "panchangam" | "monthly";

export const W = {
  ink: "var(--color-text-strong)",
  inkMid: "var(--color-text)",
  muted: "var(--color-muted)",
  mutedLt: "var(--color-faint)",
  border: "var(--color-border-strong)",
  borderLt: "var(--color-border)",
  surface: "var(--color-surface-soft)",
  card: "var(--color-surface)",
  terracotta: "var(--color-score-mid)",
  rust: "var(--color-score-low)",
  sage: "var(--color-score-high)",
} as const;

export const RASI_NAMES_EN = ["", "Mesham", "Rishabam", "Mithunam", "Kadagam", "Simmam", "Kanni", "Thulam", "Viruchigam", "Dhanusu", "Magaram", "Kumbam", "Meenam"];
export const RASI_NAMES_TA = ["", "மேஷம்", "ரிஷபம்", "மிதுனம்", "கடகம்", "சிம்மம்", "கன்னி", "துலாம்", "விருச்சிகம்", "தனுசு", "மகரம்", "கும்பம்", "மீனம்"];

// Tamil solar months start dates (approximate Gregorian: month-day)
// Chithirai begins ~Apr 14, then every ~30–31 days
const TAMIL_MONTHS_EN = [
  "Chithirai", "Vaigasi", "Aani", "Aadi", "Aavani", "Purattasi",
  "Aippasi", "Karthigai", "Margazhi", "Thai", "Maasi", "Panguni",
];
const TAMIL_MONTHS_TA = [
  "சித்திரை", "வைகாசி", "ஆனி", "ஆடி", "ஆவணி", "புரட்டாசி",
  "ஐப்பசி", "கார்த்திகை", "மார்கழி", "தை", "மாசி", "பங்குனி",
];
// Each month starts on these Gregorian md pairs (year-independent approximation)
const TAMIL_MONTH_STARTS: Array<[number, number]> = [
  [4, 14], [5, 15], [6, 15], [7, 17], [8, 17], [9, 17],
  [10, 18], [11, 16], [12, 16], [1, 14], [2, 13], [3, 14],
];

export function getTamilMonthDate(dateStr: string, lang: Lang): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const month = d.getMonth() + 1; // 1-based
  const day = d.getDate();

  // Find which Tamil month this Gregorian date falls in
  let tamilMonthIdx = -1;
  for (let i = 0; i < 12; i++) {
    const [sm, sd] = TAMIL_MONTH_STARTS[i]!;
    const [nm, nd] = TAMIL_MONTH_STARTS[(i + 1) % 12]!;
    const inMonth = (month === sm && day >= sd) || (i < 11 ? (month === nm && day < nd) : (month === nm && day < nd) || (month < sm));
    if (month === sm && day >= sd) { tamilMonthIdx = i; break; }
    if (i < 11 && month === nm && day < nd) { tamilMonthIdx = i; break; }
  }
  // Fallback: find nearest
  if (tamilMonthIdx < 0) {
    const dayOfYear = (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000;
    tamilMonthIdx = Math.floor(((dayOfYear - 104 + 365) % 365) / 30.4) % 12;
  }

  // Compute day within Tamil month
  const [sm, sd] = TAMIL_MONTH_STARTS[tamilMonthIdx]!;
  const startDate = new Date(d.getFullYear(), sm - 1, sd);
  if (sm > month || (sm === month && sd > day)) {
    startDate.setFullYear(d.getFullYear() - 1);
  }
  const tamilDay = Math.floor((d.getTime() - startDate.getTime()) / 86400000) + 1;

  const monthName = lang === "ta"
    ? (TAMIL_MONTHS_TA[tamilMonthIdx] ?? "")
    : (TAMIL_MONTHS_EN[tamilMonthIdx] ?? "");
  return lang === "ta"
    ? `${monthName} ${tamilDay}`
    : `${monthName} ${tamilDay}`;
}

const NAKSHATRA_ORDER = [
  "ASWINI", "BHARANI", "KARTHIGAI", "ROHINI", "MIRUGASEERIDAM", "THIRUVATHIRAI",
  "PUNARPOOSAM", "POOSAM", "AYILYAM", "MAGAM", "POORAM", "UTHIRAM", "HASTHAM",
  "CHITHIRAI", "SWATHI", "VISAKAM", "ANUSHAM", "KETTAI", "MOOLAM", "POORADAM",
  "UTHIRADAM", "THIRUVONAM", "AVITTAM", "SADAYAM", "POORATTATHI", "UTHIRATTATHI", "REVATHI",
];

export function parseHmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// A panchangam limb (tithi/nakshatra/…) carries the segment active at sunrise
// plus the one that follows. When the user is viewing *today* and the clock has
// passed the segment's end, the headline should become the next segment so the
// card reflects what is actually running now. We only promote for a clear
// daytime rollover — an endsAt before ~04:00 is an after-midnight boundary that
// two-segment data can't disambiguate, so we leave those untouched.
export function activeLimb(
  name: string,
  endsAt: string,
  nextName: string,
  nowMinutes: number,
): { activeName: string; until: string | null; upcomingName: string | null; rolledOver: boolean } {
  if (nowMinutes < 0) {
    return { activeName: name, until: endsAt, upcomingName: nextName, rolledOver: false };
  }
  const end = parseHmToMinutes(endsAt);
  if (end >= 240 && nowMinutes > end) {
    return { activeName: nextName, until: null, upcomingName: null, rolledOver: true };
  }
  return { activeName: name, until: endsAt, upcomingName: nextName, rolledOver: false };
}

export function moonRasiFromNakshatra(name: string, pada = 1): number {
  const idx = NAKSHATRA_ORDER.indexOf(name.toUpperCase());
  if (idx < 0) return 0;
  const normalizedPada = Math.min(4, Math.max(1, Math.trunc(pada) || 1));
  const absolutePada = idx * 4 + (normalizedPada - 1);
  return Math.floor(absolutePada / 9) + 1;
}

export function formatChandrashtamaWindowEdge(value: string, dateLocal: string): string {
  const clock = formatClockLabel(value);
  if (!value.includes("T")) return clock;
  const edgeDate = value.slice(0, 10);
  return edgeDate === dateLocal ? clock : `${clock}, ${formatDateLabel(edgeDate)}`;
}

export function formatChandrashtamaWindowSummary(
  windows: PanchangamDailyResponseData["chandrashtamamToday"]["janmaNakshatraWindows"],
  dateLocal: string,
  lang: Lang,
): string {
  return windows
    .map((window) => `${tNakshatra(window.name, lang)} ${formatChandrashtamaWindowEdge(window.start, dateLocal)} - ${formatChandrashtamaWindowEdge(window.end, dateLocal)}`)
    .join("; ");
}

export function chandrashtamaAffectedNatalRasi(moonRasi: number): number {
  if (!moonRasi) return 0;
  return ((moonRasi - 1 - 7 + 12) % 12) + 1;
}

export function rasiName(rasi: number, lang: Lang): string {
  return (lang === "ta" ? RASI_NAMES_TA[rasi] : RASI_NAMES_EN[rasi]) ?? "";
}

export function formatHeaderDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return formatDateLabel(value);
  return parsed.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function tamilMonthOnly(value: string): string {
  const trimmed = value.trim();
  const splitAt = trimmed.lastIndexOf(" ");
  return splitAt > 0 ? trimmed.slice(0, splitAt) : trimmed;
}

export function DayTimeline({
  bestStart,
  bestEnd,
  avoidStart,
  avoidEnd,
}: {
  bestStart?: string;
  bestEnd?: string;
  avoidStart?: string;
  avoidEnd?: string;
}) {
  function toX(timeStr: string | undefined): number | null {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    const hrs = (h + (m ?? 0) / 60) - 6;
    if (hrs < 0 || hrs > 12) return null;
    return 40 + (hrs / 12) * 520;
  }

  const bx1 = toX(bestStart);
  const bx2 = toX(bestEnd);
  const ax1 = toX(avoidStart);
  const ax2 = toX(avoidEnd);

  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const t = Math.max(0, Math.min(1, (nowH - 6) / 12));
  const sunX = 40 + t * 520;
  const sunY = 160 - 2 * t * (1 - t) * 118;

  return (
    <div style={{ marginTop: "var(--space-3)" }}>
      <svg viewBox="0 0 600 210" style={{ width: "100%", height: "auto", display: "block" }}>
        <path d="M40,160 Q300,40 560,160" fill="none" stroke={W.border} strokeWidth="2" />
        <rect x="40" y="157" width="520" height="4" rx="2" fill={W.borderLt} />
        {bx1 !== null && bx2 !== null && <rect x={Math.min(bx1, bx2)} y="154" width={Math.max(Math.abs(bx2 - bx1), 8)} height="9" rx="5" fill={W.sage} opacity={0.9} />}
        {ax1 !== null && ax2 !== null && <rect x={Math.min(ax1, ax2)} y="154" width={Math.max(Math.abs(ax2 - ax1), 8)} height="9" rx="5" fill={W.terracotta} opacity={0.88} />}
        {[40, 170, 300, 430, 560].map((x) => <line key={x} x1={x} y1="161" x2={x} y2="169" stroke={W.mutedLt} strokeWidth="2" />)}
        <circle cx={sunX} cy={sunY} r="8" fill={W.terracotta} />
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", marginTop: "var(--space-1)", padding: "0 var(--space-2)" }}>
        {["6 am", "9 am", "12 pm", "3 pm", "6 pm"].map((label) => (
          <span key={label} style={{ textAlign: "center", fontSize: "0.75rem", color: W.mutedLt, fontFamily: "var(--font-mono)" }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function timeWindowsOverlap(left: { start: string; end: string }, right: { start: string; end: string }): boolean {
  const leftStart = parseHmToMinutes(left.start);
  let leftEnd = parseHmToMinutes(left.end);
  const rightStart = parseHmToMinutes(right.start);
  let rightEnd = parseHmToMinutes(right.end);

  if (leftEnd <= leftStart) leftEnd += 24 * 60;
  if (rightEnd <= rightStart) rightEnd += 24 * 60;

  return leftStart < rightEnd && rightStart < leftEnd;
}

export function MoonPhaseMark({ kind, size = 10 }: { kind: "new" | "full"; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: "1.5px solid currentColor",
        background: kind === "new" ? "currentColor" : "transparent",
        display: "inline-block",
        flex: "0 0 auto",
      }}
    />
  );
}

export function LunarTithiBadge({
  value,
  lang,
  compact = false,
}: {
  value: string | null | undefined;
  lang: Lang;
  compact?: boolean;
}) {
  const meta = lunarSpecialTithiMeta(value, lang);
  if (!meta) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? "5px" : "var(--space-1_5)",
        borderRadius: "var(--radius-pill)",
        background: W.ink,
        color: "var(--color-bg)",
        border: `1px solid ${W.ink}`,
        padding: compact ? "3px 7px" : "var(--space-1_5) var(--space-2_5)",
        fontSize: compact ? "0.68rem" : "0.75rem",
        fontWeight: 800,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <MoonPhaseMark kind={meta.kind} size={compact ? 8 : 10} />
      <span>{meta.label}</span>
      {!compact && <span style={{ opacity: 0.72, fontWeight: 700 }}>{meta.phaseLabel}</span>}
    </span>
  );
}

export const MONTH_LABELS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTH_LABELS_TA = [
  "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
  "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்",
];
export const WEEKDAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_LABELS_TA = ["ஞா", "தி", "செ", "பு", "வி", "வெ", "ச"];

// Festival/observance icon glyphs keyed by a keyword found in the festival name.
// Falls back to a generic sparkle when nothing matches.
const FESTIVAL_ICON_RULES: Array<[RegExp, string]> = [
  [/pradhosam/i, "🪔"],
  [/sivarath/i, "🔱"],
  [/chathurthi/i, "🐘"],
  [/sashti/i, "🦚"],
  [/pournami|pournima|purnima/i, "🌕"],
  [/amavasai|amavasya/i, "🌑"],
  [/ekadasi/i, "🪷"],
  [/visakam|magam|uthiram/i, "⭐"],
];

export function festivalIcon(name: string): string {
  // Prefer the local rule table (kept for backwards-compatible icons), then fall
  // back to the shared glyph map so every surface uses the same symbol set.
  for (const [pattern, icon] of FESTIVAL_ICON_RULES) {
    if (pattern.test(name)) return icon;
  }
  return festivalGlyph(name);
}

export function festivalImagePath(name: string): string | null {
  if (/chaturthi|chathurthi/i.test(name)) return "/calendar/chathurthi.png";
  if (/sashti/i.test(name)) return "/calendar/shasti.png";
  if (/ekadasi|ekadashi/i.test(name)) return "/calendar/ekadashi.png";
  return null;
}

export function festivalTags(festival: Pick<PanchangamFestival, "category" | "tags">): string[] {
  const tags = festival.tags && festival.tags.length > 0 ? festival.tags : [festival.category];
  return Array.from(new Set(tags.filter(Boolean)));
}

export const VRATHA_FESTIVAL_PATTERN = /ekadashi|ekadasi|pradosham|sashti|chaturthi|chathurthi|ashtami|amavas|pourn|vratam|vratham|thiruvonam/i;

