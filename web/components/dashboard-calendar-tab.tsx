"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { formatClockLabel, formatDateLabel } from "@/lib/format";
import { bestGowriSlot, gowriCategoryLabel, gowriPeriodLabel, gowriPurposeLabel } from "@/lib/gowri";
import { t, tKarana, tLang, tNakshatra, tPlanetLord, tTithi, tWeekday, tYoga } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { lunarSpecialTithiMeta } from "@/lib/lunar";
import { useMonthlyPanchangam } from "@/hooks/useMonthlyPanchangam";
import type {
  PanchangamDailyResponseData,
  PanchangamFestival,
  PanchangamMonthDayEntry,
  PanchangamTimingsData,
} from "@/lib/types";

import { DASHA_COLORS } from "./dashboard-dasha";

type CalendarView = "panchangam" | "monthly";

const W = {
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

const RASI_NAMES_EN = ["", "Mesham", "Rishabam", "Mithunam", "Kadagam", "Simmam", "Kanni", "Thulam", "Viruchigam", "Dhanusu", "Magaram", "Kumbam", "Meenam"];
const RASI_NAMES_TA = ["", "மேஷம்", "ரிஷபம்", "மிதுனம்", "கடகம்", "சிம்மம்", "கன்னி", "துலாம்", "விருச்சிகம்", "தனுசு", "மகரம்", "கும்பம்", "மீனம்"];

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

function getTamilMonthDate(dateStr: string, lang: Lang): string {
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

function parseHmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function moonRasiFromNakshatra(name: string, pada = 1): number {
  const idx = NAKSHATRA_ORDER.indexOf(name.toUpperCase());
  if (idx < 0) return 0;
  const normalizedPada = Math.min(4, Math.max(1, Math.trunc(pada) || 1));
  const absolutePada = idx * 4 + (normalizedPada - 1);
  return Math.floor(absolutePada / 9) + 1;
}

// Nakshatras (by janma star) that fall inside a given rasi. A rasi spans 9
// padas (2¼ nakshatras); each nakshatra spans 4 padas. Chandrashtamam afflicts
// people whose *janma* rasi/star is the affected sign — so we list that sign's
// constituent stars, NOT today's transit nakshatra.
function nakshatrasForRasi(rasi: number): string[] {
  if (!rasi) return [];
  const rasiPadaStart = (rasi - 1) * 9;
  const rasiPadaEnd = rasi * 9 - 1;
  const names: string[] = [];
  for (let idx = 0; idx < NAKSHATRA_ORDER.length; idx++) {
    const nakStart = idx * 4;
    const nakEnd = idx * 4 + 3;
    if (nakStart <= rasiPadaEnd && nakEnd >= rasiPadaStart) names.push(NAKSHATRA_ORDER[idx]);
  }
  return names;
}

function chandrashtamaAffectedNatalRasi(moonRasi: number): number {
  if (!moonRasi) return 0;
  return ((moonRasi - 1 - 7 + 12) % 12) + 1;
}

function rasiName(rasi: number, lang: Lang): string {
  return (lang === "ta" ? RASI_NAMES_TA[rasi] : RASI_NAMES_EN[rasi]) ?? "";
}

function formatHeaderDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return formatDateLabel(value);
  return parsed.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function tamilMonthOnly(value: string): string {
  const trimmed = value.trim();
  const splitAt = trimmed.lastIndexOf(" ");
  return splitAt > 0 ? trimmed.slice(0, splitAt) : trimmed;
}

function DayTimeline({
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
        {["6a", "9a", "12p", "3p", "6p"].map((label) => (
          <span key={label} style={{ textAlign: "center", fontSize: "0.75rem", color: W.mutedLt, fontFamily: "var(--font-mono)" }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function HoraRow({
  hora,
  lang,
  nowMinutes,
}: {
  hora: { index: number; lord: string; start: string; end: string };
  lang: Lang;
  nowMinutes: number;
}) {
  const color = DASHA_COLORS[hora.lord.toUpperCase()] ?? W.mutedLt;
  const start = parseHmToMinutes(hora.start);
  const end = parseHmToMinutes(hora.end);
  const running = nowMinutes >= start && nowMinutes < end;
  const rowRef = useRef<HTMLDivElement>(null);

  // Keep the active hora visible inside the hora scroller without moving the full page.
  useEffect(() => {
    if (!running || !rowRef.current) return;
    const container = rowRef.current.parentElement;
    if (!container) return;

    const rowTop = rowRef.current.offsetTop;
    const rowBottom = rowTop + rowRef.current.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;

    if (rowTop < visibleTop) {
      container.scrollTop = rowTop;
      return;
    }
    if (rowBottom > visibleBottom) {
      container.scrollTop = rowBottom - container.clientHeight;
    }
  }, [running]);

  return (
    <div
      ref={rowRef}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-md)",
        background: running ? "#F8E4D2" : W.surface,
        border: `1px solid ${running ? "rgba(184,90,44,0.35)" : W.borderLt}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontSize: "0.875rem", color: W.inkMid, fontWeight: running ? 700 : 600 }}>{tPlanetLord(hora.lord, lang)} {t("hora_word", lang)}</span>
      </div>
      <span style={{ fontSize: "0.875rem", color: W.muted }}>{formatClockLabel(hora.start)} - {formatClockLabel(hora.end)}</span>
    </div>
  );
}

type PanchangamKalamSlot = PanchangamDailyResponseData["kalam"]["nallaNeram"][number];
type PanchangamAvoidWindow = { label: string; start: string; end: string };

function timeWindowsOverlap(left: { start: string; end: string }, right: { start: string; end: string }): boolean {
  const leftStart = parseHmToMinutes(left.start);
  let leftEnd = parseHmToMinutes(left.end);
  const rightStart = parseHmToMinutes(right.start);
  let rightEnd = parseHmToMinutes(right.end);

  if (leftEnd <= leftStart) leftEnd += 24 * 60;
  if (rightEnd <= rightStart) rightEnd += 24 * 60;

  return leftStart < rightEnd && rightStart < leftEnd;
}

function AuspiciousSlotGroup({
  label,
  slots,
  lang,
}: {
  label: string;
  slots: PanchangamKalamSlot[];
  lang: Lang;
}) {
  if (slots.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", background: "#DCE4D2" }}>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: W.sage }}>{label}</span>
      {slots.map((slot, idx) => {
        const period = gowriPeriodLabel(slot.period, lang);
        const category = gowriCategoryLabel(slot.name, lang);
        const purpose = gowriPurposeLabel(slot.name, lang);
        return (
          <div
            key={`${slot.period ?? "slot"}-${slot.name ?? slot.slot}-${slot.start}-${slot.end}-${idx}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: "var(--space-2)",
              alignItems: "center",
              color: slot.warning ? W.rust : W.sage,
              fontSize: "0.8125rem",
            }}
          >
            <span style={{ minWidth: 0, fontWeight: 600, lineHeight: 1.35 }}>
              <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {[period, category].filter(Boolean).join(" · ") || `Slot ${slot.slot}`}
              </span>
              {purpose && <span style={{ display: "block", fontSize: "0.72rem", color: W.muted, fontWeight: 600 }}>{purpose}</span>}
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
              {formatClockLabel(slot.start)} - {formatClockLabel(slot.end)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function GowriNamedSlotPanel({
  slots,
  avoidSlots,
  lang,
}: {
  slots: NonNullable<PanchangamDailyResponseData["kalam"]["gowriPanchangam"]>;
  avoidSlots: PanchangamAvoidWindow[];
  lang: Lang;
}) {
  const visibleSlots = slots;
  if (visibleSlots.length === 0) return null;

  return (
    <div style={{ borderRadius: "var(--radius-md)", border: `1px solid ${W.borderLt}`, background: W.surface, overflow: "hidden" }}>
      <p style={{ margin: 0, padding: "var(--space-1_5) var(--space-3)", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: W.sage, fontWeight: 700, borderBottom: `1px solid ${W.borderLt}` }}>
        {lang === "ta" ? "கௌரி நல்ல நேரம் விவரம்" : "Gowri Nalla Neram Details"}
      </p>
      <div style={{ padding: "var(--space-2) var(--space-3)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "var(--space-1_5)" }}>
        {visibleSlots.map((slot, idx) => {
          const overlappingAvoidSlots = avoidSlots.filter((avoidSlot) => timeWindowsOverlap(slot, avoidSlot));
          const collisionText = overlappingAvoidSlots.length > 0
            ? `${lang === "ta" ? "தவிர்க்கும் நேரம்" : "Overlaps"}: ${overlappingAvoidSlots.map((avoidSlot) => avoidSlot.label).join(", ")}`
            : "";
          const isBad = slot.isGood === false || overlappingAvoidSlots.length > 0;
          const period = gowriPeriodLabel(slot.period, lang);
          const category = gowriCategoryLabel(slot.name, lang);
          const purpose = gowriPurposeLabel(slot.name, lang);
          return (
            <div
              key={`${slot.period ?? "slot"}-${slot.name ?? slot.slot}-${slot.start}-${slot.end}-${idx}`}
              style={{
                borderRadius: "var(--radius-md)",
                border: isBad ? "1px solid rgba(184,90,44,0.35)" : "1px solid rgba(92,118,84,0.22)",
                background: isBad ? "#F2D8CC" : "#DCE4D2",
                padding: "var(--space-2) var(--space-2_5)",
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-0_5)" }}>
                <span style={{ color: isBad ? W.rust : W.sage, fontSize: "0.82rem", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {[period, category].filter(Boolean).join(" · ") || `Slot ${slot.slot}`}
                </span>
                <span style={{ color: isBad ? W.rust : W.sage, fontSize: "0.76rem", fontWeight: 800, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {formatClockLabel(slot.start)} - {formatClockLabel(slot.end)}
                </span>
              </div>
              {purpose && <p style={{ margin: 0, color: isBad ? W.rust : W.muted, fontSize: "0.72rem", fontWeight: 600, lineHeight: 1.35 }}>{purpose}</p>}
              {collisionText && <p style={{ margin: purpose ? "var(--space-0_5) 0 0" : 0, color: W.rust, fontSize: "0.72rem", fontWeight: 800, lineHeight: 1.35 }}>{collisionText}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MoonPhaseMark({ kind, size = 10 }: { kind: "new" | "full"; size?: number }) {
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

function LunarTithiBadge({
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

const MONTH_LABELS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_LABELS_TA = [
  "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
  "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்",
];
const WEEKDAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LABELS_TA = ["ஞா", "தி", "செ", "பு", "வி", "வெ", "ச"];

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

function festivalIcon(name: string): string {
  for (const [pattern, icon] of FESTIVAL_ICON_RULES) {
    if (pattern.test(name)) return icon;
  }
  return "✨";
}

function festivalTags(festival: Pick<PanchangamFestival, "category" | "tags">): string[] {
  const tags = festival.tags && festival.tags.length > 0 ? festival.tags : [festival.category];
  return Array.from(new Set(tags.filter(Boolean)));
}

function festivalTagLabel(tag: string, lang: Lang): string {
  const labels: Record<string, { en: string; ta: string }> = {
    hindu: { en: "Hindu", ta: "இந்து" },
    muslim: { en: "Muslim", ta: "இஸ்லாம்" },
    christian: { en: "Christian", ta: "கிறித்தவம்" },
    indian_govt: { en: "Indian Govt", ta: "இந்திய அரசு" },
    tamilnadu_govt: { en: "Tamil Nadu Govt", ta: "தமிழ்நாடு அரசு" },
    observance: { en: "Observance", ta: "உலக தினம்" },
  };
  return labels[tag]?.[lang] ?? tag.replaceAll("_", " ");
}

function compactFestivalTagLabel(tag: string, lang: Lang): string {
  if (tag === "indian_govt") return lang === "ta" ? "இந்தியா" : "India";
  if (tag === "tamilnadu_govt") return lang === "ta" ? "தமிழ்நாடு" : "TN";
  return festivalTagLabel(tag, lang);
}

const VRATHA_FESTIVAL_PATTERN = /ekadashi|ekadasi|pradosham|sashti|chaturthi|chathurthi|ashtami|amavas|pourn|vratam|vratham|thiruvonam/i;

function festivalTagTone(tag: string): { bg: string; border: string; color: string } {
  if (tag === "hindu") return { bg: "#F8E4D2", border: "rgba(184,90,44,0.25)", color: W.rust };
  if (tag === "muslim") return { bg: "#DCE4D2", border: "rgba(92,118,84,0.25)", color: W.sage };
  if (tag === "christian") return { bg: "#E7D3BE", border: "rgba(75,57,45,0.18)", color: W.ink };
  if (tag === "indian_govt") return { bg: "#DDEAF1", border: "rgba(49,86,106,0.25)", color: "#31566A" };
  if (tag === "tamilnadu_govt") return { bg: "#F0E2B8", border: "rgba(122,92,20,0.25)", color: "#7A5C14" };
  return { bg: W.surface, border: W.borderLt, color: W.muted };
}

function FestivalTagBadge({ tag, lang, compact = false }: { tag: string; lang: Lang; compact?: boolean }) {
  const tone = festivalTagTone(tag);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--radius-pill)",
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        color: tone.color,
        padding: compact ? "1px 5px" : "2px 8px",
        fontSize: compact ? "0.55rem" : "0.65rem",
        fontWeight: 800,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {compact ? compactFestivalTagLabel(tag, lang) : festivalTagLabel(tag, lang)}
    </span>
  );
}

function FestivalTagList({ festival, lang, compact = false }: { festival: PanchangamFestival; lang: Lang; compact?: boolean }) {
  return (
    <span style={{ display: "inline-flex", gap: compact ? "3px" : "5px", flexWrap: "wrap", minWidth: 0 }}>
      {festivalTags(festival).map((tag) => (
        <FestivalTagBadge key={tag} tag={tag} lang={lang} compact={compact} />
      ))}
    </span>
  );
}

function MonthSidebarCard({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div style={{ borderRadius: "var(--radius-lg)", border: `1px solid ${W.border}`, background: W.card, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-2)",
          padding: "var(--space-2_5) var(--space-3)",
          borderBottom: `1px solid ${W.borderLt}`,
        }}
      >
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: W.ink }}>{title}</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "1.5rem",
            height: "1.5rem",
            padding: "0 var(--space-1_5)",
            borderRadius: "var(--radius-pill)",
            background: accent,
            color: "#FFFFFF",
            fontSize: "0.6875rem",
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </span>
      </div>
      <div style={{ padding: "var(--space-1) var(--space-3) var(--space-2_5)" }}>{children}</div>
    </div>
  );
}

function SubhaDatePillGroup({
  label,
  dates,
  color,
  background,
  borderColor,
  formatDateLabel,
}: {
  label?: string;
  dates: string[];
  color: string;
  background: string;
  borderColor: string;
  formatDateLabel: (d: string) => string;
}) {
  if (dates.length === 0) return null;
  return (
    <div>
      {label ? (
        <span style={{ display: "block", fontSize: "0.6875rem", fontWeight: 700, color: W.muted, marginBottom: "var(--space-1)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          {label}
        </span>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1_5)" }}>
        {dates.map((d) => (
          <span
            key={d}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              borderRadius: "var(--radius-pill)",
              border: `1px solid ${borderColor}`,
              background,
              color,
              padding: "var(--space-1) var(--space-2_5)",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            <span aria-hidden="true">✦</span>
            {formatDateLabel(d)}
          </span>
        ))}
      </div>
    </div>
  );
}

function MonthlyCalendarView({
  lang,
  year,
  month,
  monthly,
  isLoading,
  error,
  hasLocation,
  selectedDate,
  todayDate,
  onPrevMonth,
  onNextMonth,
}: {
  lang: Lang;
  year: number;
  month: number;
  monthly: { tamilMonthName?: { ta: string; en: string } | null; entries: PanchangamMonthDayEntry[] } | null;
  isLoading: boolean;
  error: string | null;
  hasLocation: boolean;
  selectedDate: string;
  todayDate: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const monthLabel = lang === "ta" ? MONTH_LABELS_TA[month - 1] : MONTH_LABELS_EN[month - 1];
  const weekdayLabels = lang === "ta" ? WEEKDAY_LABELS_TA : WEEKDAY_LABELS_EN;
  const [sidebarTab, setSidebarTab] = useState<"events" | "vratha" | "muhurthams">("events");
  const monthlyTheme = {
    page: "#F6F0E3",
    line: "rgba(116, 91, 66, 0.16)",
    card: "#FBF7EF",
    mutedCard: "#EFEEE2",
    selected: "#F4DDC8",
    selectedBorder: "#CB7748",
    festival: "#6B8661",
    vratha: "#CC6A32",
    global: "#4C7897",
    softText: "#8E7B68",
  } as const;

  const entriesByDate = useMemo(() => {
    const map = new Map<string, PanchangamMonthDayEntry>();
    (monthly?.entries ?? []).forEach((entry) => map.set(entry.dateLocal, entry));
    return map;
  }, [monthly]);

  const tamilMonthHeader = useMemo(() => {
    const labels: string[] = [];
    (monthly?.entries ?? []).forEach((entry) => {
      if (!entry.tamilDate) return;
      const label = tamilMonthOnly(tLang(entry.tamilDate, lang));
      if (label && !labels.includes(label)) labels.push(label);
    });
    return labels.join(" & ");
  }, [lang, monthly]);

  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingBlanks = firstOfMonth.getDay();
    const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;
    const result: Array<{ dateLocal: string | null; entry: PanchangamMonthDayEntry | null }> = [];
    for (let i = 0; i < totalCells; i += 1) {
      const dayNumber = i - leadingBlanks + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        result.push({ dateLocal: null, entry: null });
      } else {
        const dateLocal = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
        result.push({ dateLocal, entry: entriesByDate.get(dateLocal) ?? null });
      }
    }
    return result;
  }, [year, month, entriesByDate]);

  const monthFestivals = useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{ dateLocal: string; name: string; category: string; tags: string[]; kind: "festival" | "vratha" | "global" }> = [];
    (monthly?.entries ?? []).forEach((entry) => {
      entry.festivals.forEach((f) => {
        const key = `${entry.dateLocal}::${f.name}`;
        if (seen.has(key)) return;
        seen.add(key);
        const tags = festivalTags(f);
        const isGlobal = tags.includes("observance") || tags.includes("indian_govt") || tags.includes("tamilnadu_govt");
        const isVratha = VRATHA_FESTIVAL_PATTERN.test(f.name);
        items.push({
          dateLocal: entry.dateLocal,
          name: f.name,
          category: f.category,
          tags,
          kind: isGlobal ? "global" : isVratha ? "vratha" : "festival",
        });
      });
    });
    return items;
  }, [monthly]);

  const tamilMuhurthamEntries = useMemo(
    () => (monthly?.entries ?? []).filter((entry) => entry.isTamilMuhurthamDay),
    [monthly],
  );
  const subhaEntries = useMemo(
    () => (monthly?.entries ?? []).filter((entry) => entry.isSubhaMuhurtham),
    [monthly],
  );
  const broadSubhaEntries = useMemo(
    () => subhaEntries.filter((entry) => !entry.isSubhaMuhurthamStrict),
    [subhaEntries],
  );
  const strongMuhurthamEntries = useMemo(
    () => subhaEntries.filter((entry) => entry.isSubhaMuhurthamStrict),
    [subhaEntries],
  );
  const broadSubhaDates = useMemo(() => broadSubhaEntries.map((entry) => entry.dateLocal), [broadSubhaEntries]);
  const tamilMuhurthamDates = useMemo(
    () => tamilMuhurthamEntries.map((entry) => entry.dateLocal),
    [tamilMuhurthamEntries],
  );
  const broadSubhaValarpiraiDates = useMemo(
    () => broadSubhaEntries.filter((entry) => entry.tithiPaksha === "SHUKLA").map((entry) => entry.dateLocal),
    [broadSubhaEntries],
  );
  const strongMuhurthamDates = useMemo(
    () => strongMuhurthamEntries.map((entry) => entry.dateLocal),
    [strongMuhurthamEntries],
  );

  // Vratha (fasting/observance) days — group recurring "hindu" category
  // festivals by name and list the day-of-month each one falls on, mirroring
  // the "விரத நாட்கள்" box on a traditional Tamil wall calendar.
  const vrathaGroups = useMemo(() => {
    const groups = new Map<string, number[]>();
    (monthly?.entries ?? []).forEach((entry) => {
      entry.festivals.forEach((f) => {
        if (!VRATHA_FESTIVAL_PATTERN.test(f.name)) return;
        const day = Number(entry.dateLocal.slice(-2));
        const list = groups.get(f.name) ?? [];
        if (!list.includes(day)) list.push(day);
        groups.set(f.name, list);
      });
    });
    return Array.from(groups.entries()).map(([name, days]) => ({ name, days: days.sort((a, b) => a - b) }));
  }, [monthly]);

  const sidebarItems = useMemo(() => {
    const allEvents = monthFestivals.filter((item) => item.kind !== "vratha");
    const vratha = monthFestivals.filter((item) => item.kind === "vratha");
    const muhurthams = [
      ...tamilMuhurthamEntries.map((entry) => ({
        dateLocal: entry.dateLocal,
        name: lang === "ta" ? "தமிழ் முஹூர்த்த நாள்" : "Tamil Muhurtham Day",
        kind: "reference-muhurtham" as const,
      })),
      ...strongMuhurthamEntries.map((entry) => ({
        dateLocal: entry.dateLocal,
        name: lang === "ta" ? "வலுவான முஹூர்த்த நாள்" : "Strong Muhurtham Day",
        kind: "strong-muhurtham" as const,
      })),
      ...broadSubhaEntries.map((entry) => ({
        dateLocal: entry.dateLocal,
        name:
          lang === "ta"
            ? entry.tithiPaksha === "SHUKLA"
              ? "வளர்பிறை சுப நாள்"
              : "தேய்பிறை சுப நாள்"
            : entry.tithiPaksha === "SHUKLA"
              ? "Valarpirai Subha Day"
              : "Theipirai Subha Day",
        kind: "muhurtham" as const,
      })),
    ].sort((left, right) => left.dateLocal.localeCompare(right.dateLocal));
    return { events: allEvents, vratha, muhurthams };
  }, [lang, monthFestivals, tamilMuhurthamEntries, strongMuhurthamEntries, broadSubhaEntries]);

  const sidebarCounts = {
    events: sidebarItems.events.length,
    vratha: sidebarItems.vratha.length,
    muhurthams: sidebarItems.muhurthams.length,
  } as const;

  if (!hasLocation) {
    return <p className="empty-state">{t("panja_empty", lang)}</p>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        marginInline: "calc(var(--space-6) * -1)",
        padding: "var(--space-5) var(--space-6) var(--space-6)",
        background: monthlyTheme.page,
        borderTop: `1px solid ${monthlyTheme.line}`,
        borderBottom: `1px solid ${monthlyTheme.line}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gridTemplateColumns: "40px minmax(0, 1fr) 40px", alignItems: "center", gap: "var(--space-3)", flex: "1 1 540px" }}>
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Previous month"
            style={{ border: `1px solid ${monthlyTheme.line}`, background: "#FFFDF8", borderRadius: "14px", width: "40px", height: "40px", cursor: "pointer", color: W.ink, fontSize: "1.1rem", fontWeight: 700 }}
          >
            ‹
          </button>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 2.35vw, 2rem)", fontWeight: 500, color: "#2E231B" }}>
              {monthLabel} {year}
              {tamilMonthHeader ? (
                <span style={{ marginInlineStart: "10px", fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 700, color: monthlyTheme.softText }}>
                  {tamilMonthHeader}
                </span>
              ) : null}
            </p>
            {tamilMonthHeader && (
              <p style={{ margin: 0 }} />
            )}
          </div>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Next month"
            style={{ border: `1px solid ${monthlyTheme.line}`, background: "#FFFDF8", borderRadius: "14px", width: "40px", height: "40px", cursor: "pointer", color: W.ink, fontSize: "1.1rem", fontWeight: 700 }}
          >
            ›
          </button>
        </div>
        {isLoading && <span style={{ fontSize: "0.8125rem", color: W.muted }}>{t("cal_monthly_loading", lang)}</span>}
      </div>

      {error && <p className="empty-state">{error}</p>}
      {!isLoading && !error && !monthly?.entries.length && <p className="empty-state">{t("cal_monthly_empty", lang)}</p>}

      {Boolean(monthly?.entries.length) && (
        <div className="cd-calendar-monthly-layout">
          <div style={{ minWidth: 0 }}>
            <div className="cd-calendar-grid-scroll">
              <div className="cd-calendar-grid">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
              {weekdayLabels.map((wd, i) => (
                <p
                  key={wd}
                  style={{
                    margin: 0,
                    textAlign: "center",
                    padding: "var(--space-1_5) 0",
                    fontSize: "0.75rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: i === 0 ? W.terracotta : monthlyTheme.softText,
                    fontWeight: 700,
                  }}
                >
                  {wd}
                </p>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "var(--space-1_5)" }}>
              {cells.map((cell, idx) => {
                if (!cell.dateLocal) {
                  return (
                    <div
                      key={`blank-${idx}`}
                      style={{
                        minHeight: "148px",
                      }}
                    />
                  );
                }
                const entry = cell.entry;
                const dayNumber = Number(cell.dateLocal.slice(-2));
                const isSelected = cell.dateLocal === selectedDate;
                const isToday = cell.dateLocal === todayDate;
                const dayItems = monthFestivals.filter((item) => item.dateLocal === cell.dateLocal);
                const dominantKind = dayItems[0]?.kind;
                const hasFestival = dayItems.length > 0;
                const dotColor = dominantKind === "global" ? monthlyTheme.global : dominantKind === "vratha" ? monthlyTheme.vratha : monthlyTheme.festival;
                const dateColor = isSelected ? monthlyTheme.selectedBorder : W.ink;
                const tamilDay = entry?.tamilDate ? tLang(entry.tamilDate, lang) : "";
                const specialTithi = entry?.specialTithiDayNumber === 15
                  ? "POURNAMI"
                  : entry?.specialTithiDayNumber === 30
                    ? "AMAVASAI"
                    : null;
                const specialTithiMeta = lunarSpecialTithiMeta(specialTithi, lang);
                return (
                  <div
                    key={cell.dateLocal}
                    style={{
                      position: "relative",
                      border: `1px solid ${isSelected ? monthlyTheme.selectedBorder : monthlyTheme.line}`,
                      borderRadius: "16px",
                      background: isSelected ? monthlyTheme.selected : hasFestival ? monthlyTheme.mutedCard : monthlyTheme.card,
                      padding: "12px 12px 10px",
                      minHeight: "148px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-1)" }}>
                      <span style={{ display: "inline-flex", alignItems: "flex-start", gap: "6px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "1.125rem",
                            lineHeight: 1,
                            fontWeight: 600,
                            color: dateColor,
                          }}
                        >
                          {dayNumber}
                        </span>
                        {specialTithiMeta && (
                          <span title={specialTithiMeta.label} style={{ color: dateColor, display: "inline-flex", marginTop: "2px" }}>
                            <MoonPhaseMark kind={specialTithiMeta.kind} size={10} />
                          </span>
                        )}
                      </span>
                      {hasFestival ? <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "999px", background: dotColor, marginTop: "2px", flexShrink: 0 }} /> : null}
                    </div>
                    {tamilDay ? <span style={{ fontSize: "0.75rem", color: monthlyTheme.softText, fontWeight: 500 }}>{tamilDay}</span> : null}
                    {entry ? <span style={{ fontSize: "0.75rem", color: W.inkMid, fontWeight: 500 }}>{tNakshatra(entry.nakshatraName, lang)}</span> : null}
                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {entry?.festivals.slice(0, 2).map((f) => {
                        const kind = monthFestivals.find((item) => item.dateLocal === cell.dateLocal && item.name === f.name)?.kind ?? "festival";
                        const itemColor = kind === "global" ? monthlyTheme.global : kind === "vratha" ? monthlyTheme.vratha : monthlyTheme.festival;
                        return (
                          <span
                            key={f.name}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "auto minmax(0, 1fr)",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "0.625rem",
                              fontWeight: 500,
                              color: W.inkMid,
                              minWidth: 0,
                            }}
                          >
                            <span aria-hidden="true" style={{ width: "7px", height: "7px", borderRadius: "999px", background: itemColor }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{f.name}</span>
                          </span>
                        );
                      })}
                      {specialTithiMeta && !entry?.festivals.length ? (
                        <span style={{ fontSize: "0.625rem", fontWeight: 600, color: W.rust, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {specialTithiMeta.label}
                        </span>
                      ) : null}
                      {isToday && !isSelected ? (
                        <span style={{ display: "inline-flex", alignSelf: "flex-start", borderRadius: "999px", background: "#F2E4D6", color: W.terracotta, padding: "2px 8px", fontSize: "0.625rem", fontWeight: 700 }}>
                          {lang === "ta" ? "இன்று" : "Today"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "var(--space-3)", paddingLeft: "4px" }}>
              {[
                { label: lang === "ta" ? "விரதம்" : "Vratha", color: monthlyTheme.vratha },
                { label: lang === "ta" ? "திருவிழா" : "Festival", color: monthlyTheme.festival },
                { label: lang === "ta" ? "உலக நாள்" : "Global day", color: monthlyTheme.global },
              ].map((item) => (
                <span key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: monthlyTheme.softText }}>
                  <span aria-hidden="true" style={{ width: "9px", height: "9px", borderRadius: "999px", background: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <aside className="cd-calendar-monthly-sidebar" style={{ borderLeftColor: monthlyTheme.line }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", borderBottom: `1px solid ${monthlyTheme.line}`, marginBottom: "var(--space-2)" }}>
              {([
                ["events", lang === "ta" ? "நிகழ்வுகள்" : "Events", sidebarCounts.events],
                ["vratha", lang === "ta" ? "விரதம்" : "Vratha", sidebarCounts.vratha],
                ["muhurthams", lang === "ta" ? "சுப நாள் / முஹூர்த்தம்" : "Subha / Muhurtham", sidebarCounts.muhurthams],
              ] as const).map(([key, label, count]) => {
                const active = sidebarTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSidebarTab(key)}
                    style={{
                      border: "none",
                      borderBottom: active ? `3px solid ${W.ink}` : "3px solid transparent",
                      background: "transparent",
                      color: active ? W.ink : monthlyTheme.softText,
                      padding: "0 0 14px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: active ? 700 : 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>{label}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "24px", height: "24px", borderRadius: "999px", background: active ? "#2F241D" : "#F2E8D9", color: active ? "#FFF" : monthlyTheme.softText, fontSize: "0.75rem", fontWeight: 700, padding: "0 7px" }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "var(--space-3)" }}>
              {[
                { label: lang === "ta" ? "விரதம்" : "Vratha", color: monthlyTheme.vratha },
                { label: lang === "ta" ? "திருவிழா" : "Festival", color: monthlyTheme.festival },
                { label: lang === "ta" ? "உலகம்" : "Global", color: monthlyTheme.global },
              ].map((item) => (
                <span key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "0.75rem", color: monthlyTheme.softText }}>
                  <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "999px", background: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>

            {sidebarTab === "muhurthams" && (
              <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.8125rem", lineHeight: 1.55, color: monthlyTheme.softText }}>
                {lang === "ta"
                  ? "சுப நாள் என்பது பொதுவாக நல்ல நாளை குறிக்கும். வலுவான முஹூர்த்த நாள் என்பது கடுமையான திதி-நட்சத்திர பொருத்தத்தையும் கடக்கும் நாள்."
                  : "Subha day means a broadly auspicious day. Strong muhurtham day means the date also passes the stricter tithi and nakshatra screening."}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sidebarItems[sidebarTab].length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted }}>{t("cal_monthly_empty", lang)}</p>
              ) : (
                sidebarItems[sidebarTab].map((item) => {
                  const itemColor = item.kind === "global"
                    ? monthlyTheme.global
                    : item.kind === "vratha"
                      ? monthlyTheme.vratha
                      : item.kind === "strong-muhurtham"
                        ? W.sage
                        : monthlyTheme.festival;
                  const dayLabel = new Date(`${item.dateLocal}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
                    day: "2-digit",
                    month: "short",
                  });
                  return (
                    <div
                      key={`${item.dateLocal}-${item.name}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto minmax(0, 1fr) auto",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 14px",
                        borderRadius: "14px",
                        border: `1px solid ${monthlyTheme.line}`,
                        background: "#FBF7EF",
                      }}
                    >
                      <span aria-hidden="true" style={{ width: "9px", height: "9px", borderRadius: "999px", background: itemColor }} />
                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#2E241C", fontSize: "0.875rem", fontWeight: 600 }}>
                        {item.name}
                      </span>
                      <span style={{ color: monthlyTheme.softText, fontSize: "0.8125rem", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {dayLabel}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {((sidebarTab === "vratha" && vrathaGroups.length > 0) || (sidebarTab === "muhurthams" && (tamilMuhurthamDates.length > 0 || broadSubhaDates.length > 0 || strongMuhurthamDates.length > 0))) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                {sidebarTab === "vratha" && vrathaGroups.length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: monthlyTheme.softText, fontWeight: 700 }}>
                      {lang === "ta" ? "விரத வரிசை" : "Vratha sequence"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {vrathaGroups.slice(0, 6).map((group) => (
                        <span key={group.name} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "999px", background: "#FBF7EF", border: `1px solid ${monthlyTheme.line}`, fontSize: "0.75rem", color: W.inkMid }}>
                          <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "999px", background: monthlyTheme.vratha }} />
                          {group.name}
                          <span style={{ color: monthlyTheme.softText }}>{group.days.join(", ")}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {sidebarTab === "muhurthams" && tamilMuhurthamDates.length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: monthlyTheme.softText, fontWeight: 700 }}>
                      {lang === "ta" ? "தமிழ் முஹூர்த்த நாட்கள்" : "Tamil muhurtham days"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {tamilMuhurthamDates.slice(0, 10).map((dateLocal) => (
                        <span key={dateLocal} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "999px", background: "#FBF7EF", border: `1px solid ${monthlyTheme.line}`, fontSize: "0.75rem", color: W.inkMid }}>
                          <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "999px", background: monthlyTheme.festival }} />
                          {formatDateLabel(dateLocal)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {sidebarTab === "muhurthams" && broadSubhaDates.length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: monthlyTheme.softText, fontWeight: 700 }}>
                      {lang === "ta" ? "சுப நாட்கள்" : "Subha days"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {broadSubhaDates.slice(0, 10).map((dateLocal) => {
                        const isShukla = broadSubhaValarpiraiDates.includes(dateLocal);
                        const chipColor = isShukla ? monthlyTheme.festival : monthlyTheme.vratha;
                        return (
                          <span key={dateLocal} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "999px", background: "#FBF7EF", border: `1px solid ${monthlyTheme.line}`, fontSize: "0.75rem", color: W.inkMid }}>
                            <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "999px", background: chipColor }} />
                            {formatDateLabel(dateLocal)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sidebarTab === "muhurthams" && strongMuhurthamDates.length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: monthlyTheme.softText, fontWeight: 700 }}>
                      {lang === "ta" ? "வலுவான முஹூர்த்த நாட்கள்" : "Strong muhurtham days"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {strongMuhurthamDates.slice(0, 10).map((dateLocal) => (
                        <span key={dateLocal} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "999px", background: "#FBF7EF", border: `1px solid ${monthlyTheme.line}`, fontSize: "0.75rem", color: W.inkMid }}>
                          <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "999px", background: W.sage }} />
                          {formatDateLabel(dateLocal)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export function CalendarTab({
  selectedDate,
  todayDate,
  panchangam,
  panchangamTimings,
  lang,
}: {
  selectedDate: string;
  todayDate: string;
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;
  lang: Lang;
}) {
  const [view, setView] = useState<CalendarView>("panchangam");
  const selectedDateObj = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);
  const [monthlyYear, setMonthlyYear] = useState(() => selectedDateObj.getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(() => selectedDateObj.getMonth() + 1);
  const { monthlyPanchangam, isMonthlyPanchangamLoading, monthlyPanchangamError, fetchMonthlyPanchangam } = useMonthlyPanchangam();
  const monthlyLocation = panchangam?.location ?? null;

  useEffect(() => {
    if (view !== "monthly" || !monthlyLocation) return;
    fetchMonthlyPanchangam(monthlyYear, monthlyMonth, monthlyLocation);
  }, [view, monthlyYear, monthlyMonth, monthlyLocation, fetchMonthlyPanchangam]);

  const goToAdjacentMonth = (delta: number) => {
    const next = new Date(monthlyYear, monthlyMonth - 1 + delta, 1);
    setMonthlyYear(next.getFullYear());
    setMonthlyMonth(next.getMonth() + 1);
  };

  const headerDate = formatHeaderDate(selectedDate, lang);
  const tamilHeaderDate = getTamilMonthDate(selectedDate, lang);
  const currentNowMinutes = selectedDate === todayDate ? new Date().getHours() * 60 + new Date().getMinutes() : -1;

  const tithiPaksha = panchangam
    ? `${panchangam.tithi.paksha === "SHUKLA" ? t("paksha_shukla", lang) : t("paksha_krishna", lang)} ${panchangam.tithi.number}`
    : null;

  const panchangamMeta = panchangam
    ? `${tWeekday(panchangam.vara.weekday, lang)} · ${tithiPaksha ?? ""} · ${tNakshatra(panchangam.nakshatra.name, lang)}`
    : t("panja_empty", lang);
  const bestNallaSlot = bestGowriSlot(panchangam?.kalam.nallaNeram);

  const fallbackMoonRasi = panchangam ? moonRasiFromNakshatra(panchangam.nakshatra.name, panchangam.nakshatra.pada) : 0;
  const moonRasi = panchangam?.chandrashtamamToday.moonRasiNumber || fallbackMoonRasi;
  const chandrashtama = panchangam?.chandrashtamamToday.affectedJanmaRasiNumber || chandrashtamaAffectedNatalRasi(moonRasi);
  const moonRasiName = moonRasi ? rasiName(moonRasi, lang) : "";
  const chandraName = chandrashtama ? rasiName(chandrashtama, lang) : "";
  const chandraNakshatras = chandrashtama ? nakshatrasForRasi(chandrashtama) : [];
  const observanceFestivals = panchangam?.festivals.filter((f) => festivalTags(f).includes("observance")) ?? [];
  const dailyFestivalEvents = panchangam?.festivals.filter((f) => !festivalTags(f).includes("observance")) ?? [];

  const significanceText = useMemo(() => {
    if (!panchangam) return "";
    return panchangam.festivals?.[0]?.name || panchangam.subhaMuhurtham?.reason || (lang === "ta" ? "இன்று அமைதியாக முன்னேறுங்கள்." : "Move steadily and keep the day intentional.");
  }, [panchangam, lang]);


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: W.inkMid }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: W.terracotta }}>
            {lang === "ta" ? "கிரகநகர்வு & நிகழ்வுகள்" : "Transits & Events"}
          </p>
          <h1 style={{ margin: "0 0 var(--space-1)", display: "flex", alignItems: "baseline", gap: "var(--space-2_5)", flexWrap: "wrap", fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 500, lineHeight: 1.1, color: W.ink, letterSpacing: "-0.02em" }}>
            <span>{headerDate}</span>
            {tamilHeaderDate && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: W.terracotta, fontWeight: 800, letterSpacing: 0 }}>
                {tamilHeaderDate}
              </span>
            )}
          </h1>
          <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, color: W.muted, maxWidth: "70ch" }}>{panchangamMeta}</p>
        </div>

        <div style={{ display: "inline-flex", padding: "var(--space-1_5)", borderRadius: "var(--radius-pill)", background: W.surface, border: `1px solid ${W.border}` }}>
          {([
            ["panchangam", t("cal_panchangam", lang)],
            ["monthly", t("cal_monthly", lang)],
          ] as [CalendarView, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: "var(--radius-pill)",
                padding: "var(--space-2) var(--space-4)",
                background: view === key ? W.card : "transparent",
                color: view === key ? W.ink : W.muted,
                fontSize: "0.875rem",
                fontWeight: view === key ? 700 : 500,
                fontFamily: "inherit",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "panchangam" && (
        <>
          {!panchangam ? (
            <p className="empty-state">{t("panja_empty", lang)}</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "var(--space-4)" }}>
              <div style={{ borderRadius: "var(--radius-xl)", border: `1px solid ${W.borderLt}`, background: W.card, padding: "var(--space-5_5) var(--space-6)" }}>
                <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase", color: W.muted, fontWeight: 700 }}>
                  Day At A Glance
                </p>
                <h2 style={{ margin: "0 0 var(--space-1_5)", fontFamily: "var(--font-display)", fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", color: W.ink, letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                  {tTithi(panchangam.tithi.name, lang)}. {tNakshatra(panchangam.nakshatra.name, lang)}. {tYoga(panchangam.yoga.name, lang)}.
                </h2>
                <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted }}>
                  {lang === "ta" ? "சூர்யோதயம்" : "Sunrise"} {formatClockLabel(panchangam.sunrise)} · {lang === "ta" ? "சூர்யாஸ்தமனம்" : "Sunset"} {formatClockLabel(panchangam.sunset)}
                </p>
                {panchangam.specialTithiDay && (
                  <div style={{ marginTop: "var(--space-2)", display: "flex", flexWrap: "wrap", gap: "var(--space-1_5)" }}>
                    <LunarTithiBadge value={panchangam.specialTithiDay.name} lang={lang} />
                  </div>
                )}

                <DayTimeline
                  bestStart={bestNallaSlot?.start}
                  bestEnd={bestNallaSlot?.end}
                  avoidStart={panchangam.kalam.rahuKalam.start}
                  avoidEnd={panchangam.kalam.rahuKalam.end}
                />

                <div style={{ marginTop: "var(--space-3_5)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>

                  {/* ── Auspicious ── */}
                  <div>
                    <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: W.sage, fontWeight: 700 }}>
                      {lang === "ta" ? "நல்ல நேரங்கள்" : "Auspicious"}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
                      <AuspiciousSlotGroup label={t("label_nalla_neram", lang)} slots={panchangam.kalam.nallaNeram ?? []} lang={lang} />
                      <AuspiciousSlotGroup label={t("label_gowri_nalla_neram", lang)} slots={panchangam.kalam.gowriNallaNeram ?? []} lang={lang} />
                    </div>
                  </div>

                  {/* ── Inauspicious ── */}
                  <div>
                    <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: W.rust, fontWeight: 700 }}>
                      {lang === "ta" ? "தவிர்க்க வேண்டிய நேரம்" : "Avoid"}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
                      {[
                        { label: t("label_rahu_kalam", lang), slot: panchangam.kalam.rahuKalam },
                        { label: t("label_yamagandam", lang), slot: panchangam.kalam.yamagandam },
                        { label: t("label_kuligai", lang), slot: panchangam.kalam.kuligai },
                      ].map((row) => (
                        <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", background: "#F2D8CC", color: W.rust, fontSize: "0.875rem", fontWeight: 600 }}>
                          <span>{row.label}</span>
                          <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatClockLabel(row.slot.start)} – {formatClockLabel(row.slot.end)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Chandrashtamam ── */}
                  {chandraName && (
                    <div style={{ borderRadius: "var(--radius-md)", border: `1px solid rgba(184,90,44,0.25)`, background: "#F8E4D2", overflow: "hidden" }}>
                      <p style={{ margin: 0, padding: "var(--space-1_5) var(--space-3)", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: W.terracotta, fontWeight: 700, borderBottom: `1px solid rgba(184,90,44,0.15)` }}>
                        {t("label_chandrashtamam", lang)}
                      </p>
                      <div style={{ padding: "var(--space-2) var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: W.rust }}>
                          <span style={{ color: W.muted }}>
                            {lang === "ta" ? "பாதிக்கப்படும் ராசி" : "Affected Rasi"}
                          </span>
                          <span style={{ fontWeight: 600, textAlign: "right" }}>
                            {chandraName}
                          </span>
                        </div>
                        {chandraNakshatras.length > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                            <span style={{ color: W.muted }}>
                              {lang === "ta" ? "இந்த ராசியில் உள்ள நட்சத்திரங்கள்" : "Nakshatras in this rasi"}
                            </span>
                            <span style={{ color: W.terracotta, fontWeight: 600, textAlign: "right" }}>
                              {chandraNakshatras.map((n) => tNakshatra(n, lang)).join(", ")}
                            </span>
                          </div>
                        )}
                        <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted, lineHeight: 1.45, fontStyle: "italic", borderTop: `1px solid rgba(184,90,44,0.12)`, paddingTop: "var(--space-1_5)", marginTop: "var(--space-0_5)" }}>
                          {lang === "ta"
                            ? `இந்த ராசியில் பிறந்த அனைவருக்கும் சந்திரன் ${moonRasiName} ராசியில் இருக்கும் ~2½ நாட்கள் சந்திராஷ்டமம். இந்த ராசியின் அனைத்து நட்சத்திரங்களும் சேர்ந்தே பாதிக்கப்படும்.`
                            : `Everyone born with their natal Moon in ${chandraName} rasi is in Chandrashtamam for the ~2½ days the Moon transits ${moonRasiName}. All nakshatras of this rasi are affected together.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── World / observance days ── */}
                  <div style={{ borderRadius: "var(--radius-md)", border: `1px solid ${W.borderLt}`, background: W.surface, overflow: "hidden" }}>
                    <p style={{ margin: 0, padding: "var(--space-1_5) var(--space-3)", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: W.muted, fontWeight: 700, borderBottom: `1px solid ${W.borderLt}` }}>
                      {lang === "ta" ? "உலக தினங்கள்" : "World Observance Days"}
                    </p>
                    <div style={{ padding: "var(--space-2) var(--space-3)" }}>
                      <span style={{ fontSize: "0.8125rem", color: observanceFestivals.length > 0 ? W.inkMid : W.muted, fontWeight: 600 }}>
                        {observanceFestivals.length > 0
                          ? observanceFestivals.map((f) => f.name).join(", ")
                          : lang === "ta"
                            ? "இன்றைக்கு உலக தினம் பட்டியலிடப்படவில்லை"
                            : "No world observance listed for this date"}
                      </span>
                    </div>
                  </div>
                  <div style={{ borderRadius: "var(--radius-md)", border: `1px solid ${W.borderLt}`, background: W.surface, overflow: "hidden" }}>
                    <p style={{ margin: 0, padding: "var(--space-1_5) var(--space-3)", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: W.terracotta, fontWeight: 700, borderBottom: `1px solid ${W.borderLt}` }}>
                      {t("label_festivals", lang)}
                    </p>
                    <div style={{ padding: "var(--space-2) var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      {dailyFestivalEvents.length > 0 ? (
                        dailyFestivalEvents.map((festival) => (
                          <div key={festival.name} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "var(--space-2)", alignItems: "start" }}>
                            <span aria-hidden="true" style={{ lineHeight: 1.4 }}>{festivalIcon(festival.name)}</span>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.875rem", color: W.inkMid, fontWeight: 700, lineHeight: 1.35 }}>{festival.name}</p>
                              <FestivalTagList festival={festival} lang={lang} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: "0.8125rem", color: W.muted, fontWeight: 600 }}>{t("label_no_festivals", lang)}</span>
                      )}
                    </div>
                  </div>

                  <GowriNamedSlotPanel
                    slots={panchangam.kalam.gowriPanchangam ?? []}
                    avoidSlots={[
                      { label: t("label_rahu_kalam", lang), start: panchangam.kalam.rahuKalam.start, end: panchangam.kalam.rahuKalam.end },
                      { label: t("label_yamagandam", lang), start: panchangam.kalam.yamagandam.start, end: panchangam.kalam.yamagandam.end },
                      { label: t("label_kuligai", lang), start: panchangam.kalam.kuligai.start, end: panchangam.kalam.kuligai.end },
                    ]}
                    lang={lang}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3_5)" }}>
                <div style={{ borderRadius: "var(--radius-xl)", border: `1px solid ${W.borderLt}`, background: W.card, padding: "var(--space-5_5)" }}>
                  <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase", color: W.muted, fontWeight: 700 }}>
                    Panchangam · Five Limbs
                  </p>
                  {[
                    { key: "Vara", value: tWeekday(panchangam.vara.weekday, lang), hint: `${tPlanetLord(panchangam.vara.lord, lang)} ${t("lord_word", lang)}` },
                    { key: "Tithi", value: tTithi(panchangam.tithi.name, lang), hint: `${tithiPaksha ?? ""} · ${formatClockLabel(panchangam.tithi.endsAt)} ${t("until_word", lang)} · ${lang === "ta" ? "பின்பு" : "then"} ${tTithi(panchangam.tithi.nextName, lang)}` },
                    { key: "Nakshatra", value: tNakshatra(panchangam.nakshatra.name, lang), hint: `${t("label_padam", lang)} ${panchangam.nakshatra.pada} · ${formatClockLabel(panchangam.nakshatra.endsAt)} ${t("until_word", lang)} · ${lang === "ta" ? "பின்பு" : "then"} ${tNakshatra(panchangam.nakshatra.nextName, lang)}` },
                    { key: "Yoga", value: tYoga(panchangam.yoga.name, lang), hint: `Yoga ${panchangam.yoga.number}` },
                    { key: "Karana", value: tKarana(panchangam.karana.name, lang), hint: "—" },
                    { key: lang === "ta" ? "சந்திரன்" : "Moon", value: panchangam.moonPhaseLabel, hint: lang === "ta" ? "சந்திர கலை" : "Moon phase" },
                    { key: lang === "ta" ? "சூலம்" : "Soolam", value: panchangam.soolam.direction, hint: `${lang === "ta" ? "பரிகாரம்" : "Parigaram"}: ${panchangam.soolam.parigaram}` },
                    { key: lang === "ta" ? "லக்னம்" : "Lagnam", value: panchangam.lagnam.rasiName, hint: `${lang === "ta" ? "இருப்பு" : "Remaining"} ${panchangam.lagnam.nazhigai} ${lang === "ta" ? "நாழிகை" : "nazhigai"} ${panchangam.lagnam.vinadi} ${lang === "ta" ? "விநாடி" : "vinadi"} · ${formatClockLabel(panchangam.lagnam.endsAt)} ${t("until_word", lang)}` },
                    { key: lang === "ta" ? "நேத்திரம்" : "Nethiram", value: panchangam.nethiram, hint: lang === "ta" ? "இன்று முழுவதும்" : "Throughout today" },
                    { key: lang === "ta" ? "ஜீவன்" : "Jeevan", value: panchangam.jeevan, hint: lang === "ta" ? "இன்று முழுவதும்" : "Throughout today" },
                    { key: lang === "ta" ? "அமிர்தாதி யோகம்" : "Amirdhadhi Yogam", value: panchangam.amirdhadhiYogam.name, hint: `${formatClockLabel(panchangam.amirdhadhiYogam.endsAt)} ${t("until_word", lang)} · ${lang === "ta" ? "பின்பு" : "then"} ${panchangam.amirdhadhiYogam.nextName}` },
                  ].map((row) => (
                    <div key={row.key} className="cd-detail-spec-row">
                      <span className="cd-detail-spec-row__label">{row.key}</span>
                      <div className="cd-detail-spec-row__body">
                        <p>{row.value}</p>
                        <p>{row.hint}</p>
                      </div>
                      <span className="cd-detail-spec-row__tag">5L</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderRadius: "var(--radius-xl)", border: `1px solid rgba(184,90,44,0.2)`, background: "#F8E4D2", padding: "var(--space-5)" }}>
                  <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase", color: W.terracotta, fontWeight: 700 }}>
                    Today's Significance
                  </p>
                  <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, color: W.inkMid }}>{significanceText}</p>
                </div>

                {panchangam.hora.length > 0 && (
                  <div style={{ borderRadius: "var(--radius-xl)", border: `1px solid ${W.borderLt}`, background: W.card, padding: "var(--space-5)" }}>
                    <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase", color: W.muted, fontWeight: 700 }}>
                      Hora Table
                    </p>
                    {(() => {
                      if (currentNowMinutes < 0) return null;
                      const runningHora = panchangam.hora.find((h) => {
                        const s = parseHmToMinutes(h.start);
                        const e = parseHmToMinutes(h.end);
                        return currentNowMinutes >= s && currentNowMinutes < e;
                      });
                      if (!runningHora) return null;
                      return (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-2_5)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", background: "#F8E4D2", border: "1px solid rgba(184,90,44,0.35)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1_5)", fontSize: "0.875rem", fontWeight: 700, color: W.inkMid }}>
                            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: DASHA_COLORS[runningHora.lord.toUpperCase()] ?? W.mutedLt, display: "inline-block" }} />
                            {lang === "ta" ? "தற்போதைய ஹோரா" : "Running hora"}: {tPlanetLord(runningHora.lord, lang)} {t("hora_word", lang)}
                          </span>
                          <span style={{ fontSize: "0.875rem", color: W.muted }}>{formatClockLabel(runningHora.start)} - {formatClockLabel(runningHora.end)}</span>
                        </div>
                      );
                    })()}
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", maxHeight: "330px", overflowY: "auto", paddingRight: "var(--space-0_5)" }}>
                      {panchangam.hora.map((h) => (
                        <HoraRow key={h.index} hora={h} lang={lang} nowMinutes={currentNowMinutes} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {view === "monthly" && (
        <MonthlyCalendarView
          lang={lang}
          year={monthlyYear}
          month={monthlyMonth}
          monthly={monthlyPanchangam}
          isLoading={isMonthlyPanchangamLoading}
          error={monthlyPanchangamError}
          hasLocation={Boolean(monthlyLocation)}
          selectedDate={selectedDate}
          todayDate={todayDate}
          onPrevMonth={() => goToAdjacentMonth(-1)}
          onNextMonth={() => goToAdjacentMonth(1)}
        />
      )}
    </div>
  );
}
