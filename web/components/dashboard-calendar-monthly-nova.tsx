"use client";

import { Sparkles, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

import { useMemo, useState } from "react";

import { formatDateLabel } from "@/lib/format";
import { t, tLang, tTithi } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { lunarSpecialTithiMeta } from "@/lib/lunar";
import { festivalGlyph } from "@/lib/astro-symbols";
import type { PanchangamFestival, PanchangamMonthDayEntry } from "@/lib/types";

import {
  festivalImagePath,
  festivalTags,
  MONTH_LABELS_EN,
  MONTH_LABELS_TA,
  MoonPhaseMark,
  tamilMonthOnly,
  VRATHA_FESTIVAL_PATTERN,
  WEEKDAY_LABELS_EN,
  WEEKDAY_LABELS_TA,
} from "./dashboard-calendar-shared";
import { Card } from "./ui";

/**
 * Nova "Calendar" tab, monthly grid view — Phase 3 of the dashboard revamp,
 * pulled forward at the user's request right after Phase 2 sign-off
 * (mockup data-screen="cal-monthly", see docs/DASHBOARD_UI_REVAMP_PLAN.md).
 *
 * Classic's MonthlyCalendarView (dashboard-calendar-tab.tsx) reads almost
 * entirely from Classic-only literal-hex custom properties (the legacy
 * cal / cream-light families — confirmed via globals.css to have no
 * [data-ui="nova"] override), so unlike DayTimeline/.cd-detail-spec-row in
 * Phase 2, none of its markup is safe to reuse verbatim. This file
 * recomputes the same derived data (festival grouping, vratha sequences,
 * sidebar tabs) from the same PanchangamMonthlyData entries — same
 * calculations, fresh Nova-token presentation.
 *
 * The sidebar rail (2026-07-22) folds three month-control panels into the view
 * — Events & Festivals (Upcoming/Vratham/Muhurtham), Filter Calendar (six
 * category toggles that gate BOTH the grid and the lists), and Quick Jump
 * (Today / This Month / Next Muhurtham). Filters and grid share one category
 * model (`CalCategory`) so a toggle and a highlight can never disagree.
 */

type NovaHighlightKind = "muhurtham" | "pournami" | "amavasai" | "chathurthi" | "sashti" | "pradosham";

// dot/bg/border were literal hex until Phase 1 (Nova-Only Migration Plan) —
// fine while Nova was always dark, but a light-tuned gold/blue never
// existed, so under Light these would've stayed exactly as dark-tuned.
// Reuses existing themed tokens (--color-accent-strong for pournami's gold,
// --planet-other for sashti's one-off blue — same slot dashboard-nova.css's
// own comment on --planet-other already earmarked for this) via color-mix()
// instead of inventing new custom properties.
const NOVA_CAL_HILITE: Record<NovaHighlightKind, { dot: string; bg: string; border: string }> = {
  muhurtham: { dot: "var(--color-high)", bg: "var(--color-high-bg)", border: "var(--color-high-border)" },
  pournami: { dot: "var(--color-accent-strong)", bg: "color-mix(in srgb, var(--color-accent-strong) 16%, transparent)", border: "color-mix(in srgb, var(--color-accent-strong) 40%, transparent)" },
  amavasai: { dot: "var(--color-accent-secondary)", bg: "var(--color-accent-secondary-muted)", border: "color-mix(in srgb, var(--color-accent-secondary) 40%, transparent)" },
  chathurthi: { dot: "var(--color-low)", bg: "var(--color-low-bg)", border: "var(--color-low-border)" },
  sashti: { dot: "var(--planet-other)", bg: "color-mix(in srgb, var(--planet-other) 16%, transparent)", border: "color-mix(in srgb, var(--planet-other) 40%, transparent)" },
  pradosham: { dot: "var(--color-accent)", bg: "var(--color-accent-muted)", border: "var(--color-border-strong)" },
};

const NOVA_DOT_TONE: Record<"festival" | "vratha" | "global", string> = {
  festival: "var(--color-accent-strong)",
  vratha: "var(--color-low)",
  global: "var(--color-accent-secondary)",
};

const NOVA_LEGEND: Array<{ label: { en: string; ta: string }; icon: string | null; emoji: string; swatch: string }> = [
  { label: { en: "Muhurtham day", ta: "முகூர்த்த நாள்" }, icon: "/calendar/muhurtha.png", emoji: "🌟", swatch: NOVA_CAL_HILITE.muhurtham.dot },
  { label: { en: "Pournami", ta: "பௌர்ணமி" }, icon: null, emoji: "🌕", swatch: NOVA_CAL_HILITE.pournami.dot },
  { label: { en: "Amavasai", ta: "அமாவாசை" }, icon: null, emoji: "🌑", swatch: NOVA_CAL_HILITE.amavasai.dot },
  { label: { en: "Chathurthi", ta: "சதுர்த்தி" }, icon: "/calendar/chathurthi.png", emoji: "🐘", swatch: NOVA_CAL_HILITE.chathurthi.dot },
  { label: { en: "Sashti", ta: "சஷ்டி" }, icon: "/calendar/shasti.png", emoji: "🦚", swatch: NOVA_CAL_HILITE.sashti.dot },
  { label: { en: "Ekadashi", ta: "ஏகாதசி" }, icon: "/calendar/ekadashi.png", emoji: "🪷", swatch: "var(--color-faint)" },
  { label: { en: "Pradosham", ta: "பிரதோஷம்" }, icon: null, emoji: "🪔", swatch: NOVA_CAL_HILITE.pradosham.dot },
  { label: { en: "Festival", ta: "திருவிழா" }, icon: null, emoji: "🎉", swatch: "var(--color-accent-strong)" },
  { label: { en: "Karinaal (avoid)", ta: "கரிநாள் (தவிர்க்க)" }, icon: null, emoji: "🚫", swatch: "var(--color-alert-critical)" },
];

// ── Filter/grid category model ──────────────────────────────────────────────
// One enum drives the Filter Calendar toggles, the grid highlights, and the
// sidebar lists, so a toggled-off category leaves the grid and the lists in
// lockstep. Ekadashi is split out ahead of Vratham because it also matches
// VRATHA_FESTIVAL_PATTERN — order matters here.
type CalCategory = "muhurtham" | "vratham" | "festivals" | "lunar" | "ekadashi" | "karinaal";

const EKADASHI_PATTERN = /ekadashi|ekadasi|ஏகாதசி/i;

function festivalCalCategory(name: string): CalCategory {
  if (EKADASHI_PATTERN.test(name)) return "ekadashi";
  if (VRATHA_FESTIVAL_PATTERN.test(name)) return "vratham";
  return "festivals";
}

const CAL_FILTERS: Array<{ cat: CalCategory; label: { en: string; ta: string }; swatch: string }> = [
  { cat: "muhurtham", label: { en: "Muhurtham", ta: "முகூர்த்தம்" }, swatch: NOVA_CAL_HILITE.muhurtham.dot },
  { cat: "vratham", label: { en: "Vratham", ta: "விரதம்" }, swatch: NOVA_DOT_TONE.vratha },
  { cat: "festivals", label: { en: "Festivals", ta: "திருவிழாக்கள்" }, swatch: NOVA_DOT_TONE.festival },
  { cat: "lunar", label: { en: "Amavasai / Pournami", ta: "அமாவாசை / பௌர்ணமி" }, swatch: NOVA_CAL_HILITE.pournami.dot },
  { cat: "ekadashi", label: { en: "Ekadashi", ta: "ஏகாதசி" }, swatch: "var(--color-faint)" },
  { cat: "karinaal", label: { en: "Karinaal (avoid)", ta: "கரிநாள் (தவிர்க்க)" }, swatch: "var(--color-alert-critical)" },
];
const ALL_CATEGORIES: CalCategory[] = CAL_FILTERS.map((f) => f.cat);

type SidebarEvent = {
  dateLocal: string;
  name: string;
  calCategory: CalCategory;
  kind: "festival" | "vratha" | "global" | "reference-muhurtham";
  tamilDate: string;
  tithiName: string;
};

export type DashboardCalendarMonthlyNovaProps = {
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
  onSelectDate?: (date: string) => void;
  /** Quick Jump — navigate the grid to the current month (and, for "today",
   *  open today's day-detail drawer). Owned by the parent, which holds the
   *  month-nav + drawer state. */
  onQuickJump?: (target: "today" | "thisMonth") => void;
  /** Quick Jump — scan forward across months for the next Tamil muhurtham day
   *  after today, navigate there and open it. Resolves false when none is found
   *  within the parent's scan cap. */
  onJumpToNextMuhurtham?: () => Promise<boolean>;
};

function NovaFestivalIcon({ name }: { name: string }) {
  const imgSrc = festivalImagePath(name);
  if (!imgSrc) return <span aria-hidden="true" style={{ fontSize: "var(--text-sm)", lineHeight: 1 }}>{festivalGlyph(name)}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative festival icon with onError fallback
    <img
      src={imgSrc}
      alt=""
      aria-hidden="true"
      width={14}
      height={14}
      style={{ objectFit: "contain", flexShrink: 0 }}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

/** The on/off pill used by every Filter Calendar row. Knob is the card surface
 *  with a border so it stays legible against both the on (accent) and off
 *  (faint) track — no literal hex, works in light + dark. */
function FilterSwitch({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      style={{
        position: "relative", width: "38px", height: "22px", flexShrink: 0,
        borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer", padding: 0,
        background: on ? "var(--color-accent)" : "color-mix(in srgb, var(--color-text-strong) 20%, transparent)",
        transition: "background 0.15s ease",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute", top: "2px", left: on ? "18px" : "2px",
          width: "18px", height: "18px", borderRadius: "var(--radius-pill)",
          background: "var(--color-surface)", border: "1px solid var(--color-border-strong)",
          transition: "left 0.15s ease",
        }}
      />
    </button>
  );
}

/** One event row shared by all three Events & Festivals tabs: dot + name and a
 *  `date · tamil-date · tithi` meta line, with an optional "your chart" badge. */
function NovaEventRow({
  item,
  lang,
  dotColor,
  chartMatch,
}: {
  item: SidebarEvent;
  lang: Lang;
  dotColor: string;
  chartMatch: boolean;
}) {
  const dayLabel = new Date(`${item.dateLocal}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
  const meta = [dayLabel, item.tamilDate, tTithi(item.tithiName, lang)].filter(Boolean).join(" · ");
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)", padding: "var(--space-3) var(--space-1)", borderBottom: "1px solid color-mix(in srgb, var(--color-text-strong) 6%, transparent)" }}>
      <span style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)", minWidth: 0 }}>
        <span aria-hidden="true" style={{ width: "7px", height: "7px", borderRadius: "var(--radius-pill)", background: chartMatch ? "var(--color-high)" : dotColor, flexShrink: 0, marginTop: "5px" }} />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
          <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: "2px" }}>{meta}</span>
        </span>
      </span>
      {chartMatch && (
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--color-high)", background: "var(--color-high-bg)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2)", whiteSpace: "nowrap", flexShrink: 0, marginTop: "2px" }}>
          {lang === "ta" ? "உங்கள் ஜாதகம்" : "Your chart"}
        </span>
      )}
    </div>
  );
}

export function MonthlyCalendarViewNova({
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
  onSelectDate,
  onQuickJump,
  onJumpToNextMuhurtham,
}: DashboardCalendarMonthlyNovaProps) {
  const monthLabel = lang === "ta" ? MONTH_LABELS_TA[month - 1] : MONTH_LABELS_EN[month - 1];
  const weekdayLabels = lang === "ta" ? WEEKDAY_LABELS_TA : WEEKDAY_LABELS_EN;
  const [sidebarTab, setSidebarTab] = useState<"upcoming" | "vratha" | "muhurthams">("upcoming");
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  const [enabledCats, setEnabledCats] = useState<Set<CalCategory>>(() => new Set(ALL_CATEGORIES));
  const catOn = (cat: CalCategory) => enabledCats.has(cat);
  const toggleCat = (cat: CalCategory) =>
    setEnabledCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  const clearFilters = () => setEnabledCats(new Set(ALL_CATEGORIES));

  const [nextMuhurthamPending, setNextMuhurthamPending] = useState(false);
  const [nextMuhurthamNote, setNextMuhurthamNote] = useState<string | null>(null);
  const handleNextMuhurtham = async () => {
    if (!onJumpToNextMuhurtham) return;
    setNextMuhurthamPending(true);
    setNextMuhurthamNote(null);
    try {
      const found = await onJumpToNextMuhurtham();
      if (!found) setNextMuhurthamNote(lang === "ta" ? "வரவிருக்கும் முகூர்த்தம் காணப்படவில்லை." : "No upcoming muhurtham found.");
    } finally {
      setNextMuhurthamPending(false);
    }
  };

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

  // Every festival in the month, deduped, tagged with its filter category and
  // enriched with the day's tamil-date + tithi for the sidebar meta line.
  const monthFestivals = useMemo<SidebarEvent[]>(() => {
    const seen = new Set<string>();
    const items: SidebarEvent[] = [];
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
          calCategory: festivalCalCategory(f.name),
          kind: isGlobal ? "global" : isVratha ? "vratha" : "festival",
          tamilDate: entry.tamilDate ? tLang(entry.tamilDate, lang) : "",
          tithiName: entry.tithiName,
        });
      });
    });
    return items;
  }, [monthly, lang]);

  const tamilMuhurthamEntries = useMemo(
    () => (monthly?.entries ?? []).filter((entry) => entry.isTamilMuhurthamDay),
    [monthly],
  );
  const chartMatchedMuhurthamEntries = useMemo(
    () => tamilMuhurthamEntries.filter((entry) => entry.isSubhaMuhurtham),
    [tamilMuhurthamEntries],
  );
  const chartMatchedDates = useMemo(
    () => chartMatchedMuhurthamEntries.map((entry) => entry.dateLocal),
    [chartMatchedMuhurthamEntries],
  );

  const muhurthamEvents = useMemo<SidebarEvent[]>(
    () =>
      tamilMuhurthamEntries
        .map((entry): SidebarEvent => ({
          dateLocal: entry.dateLocal,
          name: lang === "ta" ? "தமிழ் முகூர்த்த நாள்" : "Tamil Muhurtham",
          calCategory: "muhurtham",
          kind: "reference-muhurtham",
          tamilDate: entry.tamilDate ? tLang(entry.tamilDate, lang) : "",
          tithiName: entry.tithiName,
        }))
        .sort((left, right) => left.dateLocal.localeCompare(right.dateLocal)),
    [lang, tamilMuhurthamEntries],
  );

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

  // Sidebar lists, each already gated by the Filter Calendar toggles.
  // Upcoming = every event (festivals + muhurtham days) chronologically, from
  // today forward (View all reveals the earlier-in-month ones too).
  const allEventsChrono = useMemo<SidebarEvent[]>(
    () =>
      [...monthFestivals, ...muhurthamEvents].sort(
        (a, b) => a.dateLocal.localeCompare(b.dateLocal) || a.name.localeCompare(b.name),
      ),
    [monthFestivals, muhurthamEvents],
  );

  const upcomingItems = useMemo(() => {
    const visible = allEventsChrono.filter((item) => catOn(item.calCategory));
    if (showAllUpcoming) return visible;
    const forward = visible.filter((item) => item.dateLocal >= todayDate);
    // If the displayed month is entirely past/future relative to today, "from
    // today forward" would be empty — fall back to the whole month.
    return forward.length > 0 ? forward : visible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEventsChrono, enabledCats, showAllUpcoming, todayDate]);

  const upcomingHiddenCount = useMemo(() => {
    if (showAllUpcoming) return 0;
    const visible = allEventsChrono.filter((item) => catOn(item.calCategory));
    return Math.max(0, visible.length - upcomingItems.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEventsChrono, enabledCats, showAllUpcoming, upcomingItems.length]);

  const vrathaItems = useMemo(
    () => monthFestivals.filter((item) => item.kind === "vratha" && catOn(item.calCategory)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthFestivals, enabledCats],
  );
  const muhurthamItems = useMemo(
    () => muhurthamEvents.filter((item) => catOn(item.calCategory)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [muhurthamEvents, enabledCats],
  );

  const sidebarLists = { upcoming: upcomingItems, vratha: vrathaItems, muhurthams: muhurthamItems } as const;
  const sidebarCounts = {
    upcoming: upcomingItems.length,
    vratha: vrathaItems.length,
    muhurthams: muhurthamItems.length,
  } as const;

  if (!hasLocation) {
    return <p className="empty-state">{t("panja_empty", lang)}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {/* ── Month nav ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Previous month"
          style={{ width: "30px", height: "30px", borderRadius: "var(--radius-pill)", border: "1px solid var(--color-border-strong)", background: "transparent", display: "grid", placeItems: "center", color: "var(--color-accent-strong)", fontSize: "var(--text-base)", cursor: "pointer" }}
        >
          <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-strong)" }}>
          {monthLabel} {year}
        </div>
        {tamilMonthHeader && <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{tamilMonthHeader}</div>}
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Next month"
          style={{ width: "30px", height: "30px", borderRadius: "var(--radius-pill)", border: "1px solid var(--color-border-strong)", background: "transparent", display: "grid", placeItems: "center", color: "var(--color-accent-strong)", fontSize: "var(--text-base)", cursor: "pointer" }}
        >
          <ChevronRight size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
        {isLoading && <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{t("cal_monthly_loading", lang)}</span>}
      </div>

      {error && <p className="empty-state">{error}</p>}
      {!isLoading && !error && !monthly?.entries.length && <p className="empty-state">{t("cal_monthly_empty", lang)}</p>}

      {Boolean(monthly?.entries.length) && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: "var(--space-5)", alignItems: "start" }} className="nova-cal-monthly-layout">
          {/* ── Grid ── */}
          <div style={{ minWidth: 0, overflowX: "auto" }}>
            {/* audit B-5: `min(620px, 100%)` fills the column at desktop widths
                but never exceeds it, so a 375px phone renders the whole month
                in-viewport instead of scrolling sideways through it. The
                overflowX:auto above stays as a graceful fallback only. */}
            <div style={{ minWidth: "min(620px, 100%)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "var(--space-2)", marginBottom: "8px" }}>
                {weekdayLabels.map((wd, i) => (
                  <div key={wd} style={{ fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", color: i === 0 ? "var(--color-low)" : "var(--color-faint)" }}>
                    {wd}
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "var(--space-2)" }}>
                {cells.map((cell, idx) => {
                  if (!cell.dateLocal) return <div key={`blank-${idx}`} style={{ minHeight: "82px" }} />;
                  const entry = cell.entry;
                  const dayNumber = Number(cell.dateLocal.slice(-2));
                  const isSelected = cell.dateLocal === selectedDate;
                  const isToday = cell.dateLocal === todayDate;
                  // Only the festivals whose category is still switched on. Both
                  // the day's dot and the chathurthi/sashti/pradosham tints derive
                  // from this list, so gating here gates them all at once.
                  const visibleFestivals = (entry?.festivals ?? []).filter((f) => catOn(festivalCalCategory(f.name)));
                  const visibleFestNames = visibleFestivals.map((f) => f.name).join(" ");
                  const dayItems = monthFestivals.filter((item) => item.dateLocal === cell.dateLocal && catOn(item.calCategory));
                  const dominantKind = dayItems[0]?.kind;
                  const hasFestival = dayItems.length > 0;
                  const dotColor = dominantKind && dominantKind !== "reference-muhurtham" ? NOVA_DOT_TONE[dominantKind] : null;
                  const tamilDay = entry?.tamilDate ? tLang(entry.tamilDate, lang) : "";
                  const showMuhurtham = Boolean(entry?.isTamilMuhurthamDay) && catOn("muhurtham");
                  const showLunar = catOn("lunar");
                  const showKarinaal = Boolean(entry?.isKarinaal) && catOn("karinaal");
                  const specialTithi = showLunar && entry?.specialTithiDayNumber === 15 ? "POURNAMI" : showLunar && entry?.specialTithiDayNumber === 30 ? "AMAVASAI" : null;
                  const specialTithiMeta = lunarSpecialTithiMeta(specialTithi, lang);
                  const highlightType: NovaHighlightKind | null = !entry ? null
                    : showMuhurtham ? "muhurtham"
                    : showLunar && entry.specialTithiDayNumber === 15 ? "pournami"
                    : showLunar && entry.specialTithiDayNumber === 30 ? "amavasai"
                    : /chaturthi|chathurthi/i.test(visibleFestNames) ? "chathurthi"
                    : /sashti/i.test(visibleFestNames) ? "sashti"
                    : /pradhosam|pradosham/i.test(visibleFestNames) ? "pradosham"
                    : null;
                  const tone = highlightType ? NOVA_CAL_HILITE[highlightType] : null;
                  // Selected/today are rings layered on top of the day's own highlight tint
                  // (Pournami/Amavasai/Muhurtham/etc.), not a replacement for it — previously
                  // isSelected fully overrode cellBg/cellBorder and isToday's badge was hidden
                  // whenever the day was also selected, so on the default view (today ==
                  // selectedDate on load) none of today/pournami/amavasai ever showed at all.
                  //
                  // Selected/today deliberately do NOT use gold (--color-accent /
                  // -strong): gold is this grid's lunar/auspicious language
                  // (pournami's fill+border, pradosham's dot) and reusing it for the
                  // selection ring made "today" and "pournami" read as the same
                  // highlighted cell at a glance — worst on load, when today ==
                  // selectedDate wears pournami's exact gold. --color-text-strong is
                  // achromatic chrome, so it can't collide with any lunar/festival hue
                  // (gold, purple/amavasai, blue/sashti, coral/chathurthi, green/muhurtham),
                  // present or future.
                  const cellBg = tone?.bg ?? (isSelected ? "color-mix(in srgb, var(--color-text-strong) 10%, transparent)" : hasFestival ? "var(--color-surface-soft)" : "color-mix(in srgb, var(--color-text-strong) 3%, transparent)");
                  const cellBorder = tone?.border ?? (isSelected ? "var(--color-border-strong)" : "var(--color-border)");
                  // inset, not outset: an outset ring painted outside the border box gets
                  // clipped by the cell's own overflow:hidden (needed for long festival
                  // text) and, on the last column of a row, by the grid's right edge too —
                  // so the ring's right side silently disappeared for Saturday cells.
                  // Inset paints inside the border box, so it can never be clipped.
                  const selectionRing = isSelected ? "inset 0 0 0 2px var(--color-text-strong)" : isToday ? "inset 0 0 0 1.5px color-mix(in srgb, var(--color-text-strong) 55%, transparent)" : "none";
                  const dateColor = "var(--color-text-strong)";

                  return (
                    <button
                      key={cell.dateLocal}
                      type="button"
                      aria-pressed={onSelectDate ? isSelected : undefined}
                      aria-current={isToday ? "date" : undefined}
                      onClick={onSelectDate ? () => onSelectDate(cell.dateLocal!) : undefined}
                      disabled={!onSelectDate}
                      style={{
                        appearance: "none", width: "100%", position: "relative",
                        border: `1px solid ${cellBorder}`, borderRadius: "var(--radius-sm)",
                        boxShadow: selectionRing,
                        background: cellBg, padding: "var(--space-2)", minHeight: "82px",
                        display: "flex", flexDirection: "column", gap: "var(--space-1)",
                        overflow: "hidden", cursor: onSelectDate ? "pointer" : "default", textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      {dotColor && (
                        <span aria-hidden="true" style={{ position: "absolute", top: "8px", right: "8px", width: "6px", height: "6px", borderRadius: "var(--radius-pill)", background: dotColor }} />
                      )}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)" }}>
                        <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: dateColor, lineHeight: 1 }}>{dayNumber}</span>
                        {specialTithiMeta && (
                          <span title={specialTithiMeta.label} style={{ color: dateColor, display: "inline-flex", marginTop: "1px" }}>
                            <MoonPhaseMark kind={specialTithiMeta.kind} size={9} />
                          </span>
                        )}
                      </div>
                      {tamilDay && <span style={{ fontSize: "var(--text-xs)", color: hasFestival ? "var(--color-text)" : "var(--color-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{tamilDay}</span>}
                      {entry && <span style={{ fontSize: "var(--text-xs)", color: hasFestival ? "var(--color-text)" : "var(--color-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{tTithi(entry.tithiName, lang)}</span>}
                      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                        {visibleFestivals.slice(0, 2).map((f: PanchangamFestival) => (
                          <span key={f.name} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-accent-strong)", minWidth: 0 }}>
                            <NovaFestivalIcon name={f.name} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{f.name}</span>
                          </span>
                        ))}
                        {showMuhurtham && (
                          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-high)", display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                            <Sparkles size={12} strokeWidth={1.5} aria-hidden="true" />{lang === "ta" ? "முகூர்த்தம்" : "Muhurtham"}
                          </span>
                        )}
                        {showKarinaal && (
                          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-alert-critical-text, var(--color-alert-critical))", display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                            <AlertTriangle size={12} strokeWidth={1.5} aria-hidden="true" />{lang === "ta" ? "கரிநாள்" : "Karinaal"}
                          </span>
                        )}
                        {isToday && (
                          <span style={{ alignSelf: "flex-start", borderRadius: "var(--radius-pill)", background: "color-mix(in srgb, var(--color-text-strong) 14%, transparent)", color: "var(--color-text-strong)", padding: "var(--space-1) var(--space-2)", fontSize: "var(--text-xs)", fontWeight: 700 }}>
                            {lang === "ta" ? "இன்று" : "Today"}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Legend ── */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--color-border)" }}>
              {NOVA_LEGEND.map((item) => (
                <span key={item.label.en} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                  <span aria-hidden="true" style={{ width: "9px", height: "9px", borderRadius: "var(--radius-sm)", background: item.swatch, display: "inline-block" }} />
                  {lang === "ta" ? item.label.ta : item.label.en}
                </span>
              ))}
            </div>
          </div>

          {/* ── Sidebar rail: Events & Festivals · Filter Calendar · Quick Jump ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
            {/* Card A — Events & Festivals */}
            <Card as="section" style={{ borderRadius: "var(--radius-xl)", borderColor: "var(--color-border-strong)", gap: "var(--space-1)" }}>
              <div style={{ fontSize: "var(--text-xs)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700, marginBottom: "10px" }}>
                {lang === "ta" ? "நிகழ்வுகள் & திருவிழாக்கள்" : "Events & Festivals"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", borderBottom: "1px solid var(--color-border)", marginBottom: "6px" }}>
                {([
                  ["upcoming", lang === "ta" ? "வரவிருப்பவை" : "Upcoming", sidebarCounts.upcoming],
                  ["vratha", lang === "ta" ? "விரதம்" : "Vratham", sidebarCounts.vratha],
                  ["muhurthams", lang === "ta" ? "முகூர்த்தம்" : "Muhurtham", sidebarCounts.muhurthams],
                ] as const).map(([key, label, count]) => {
                  const active = sidebarTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSidebarTab(key)}
                      style={{
                        border: "none", borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
                        background: "transparent", color: active ? "var(--color-accent-strong)" : "var(--color-muted)",
                        paddingBottom: "var(--space-3)", cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: active ? 700 : 600,
                        display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontFamily: "inherit",
                      }}
                    >
                      <span>{label}</span>
                      {count > 0 && <span style={{ color: active ? "var(--color-accent-strong)" : "var(--color-faint)", fontSize: "var(--text-xs)" }}>{count}</span>}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {sidebarLists[sidebarTab].length === 0 ? (
                  <p style={{ margin: "9px 2px", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{t("cal_monthly_empty", lang)}</p>
                ) : (
                  sidebarLists[sidebarTab].map((item) => {
                    const dotColor = item.kind === "reference-muhurtham" ? "var(--color-high)" : NOVA_DOT_TONE[item.kind];
                    const chartMatch = item.kind === "reference-muhurtham" && chartMatchedDates.includes(item.dateLocal);
                    return (
                      <NovaEventRow
                        key={`${sidebarTab}-${item.dateLocal}-${item.name}`}
                        item={item}
                        lang={lang}
                        dotColor={dotColor}
                        chartMatch={chartMatch}
                      />
                    );
                  })
                )}
              </div>

              {sidebarTab === "upcoming" && (upcomingHiddenCount > 0 || showAllUpcoming) && (
                <button
                  type="button"
                  onClick={() => setShowAllUpcoming((v) => !v)}
                  style={{ alignSelf: "flex-start", marginTop: "8px", border: "none", background: "none", color: "var(--color-accent-strong)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: "var(--space-1) 0" }}
                >
                  {showAllUpcoming
                    ? (lang === "ta" ? "வரவிருப்பவை மட்டும்" : "Upcoming only")
                    : (lang === "ta" ? `அனைத்தையும் காட்டு (${upcomingHiddenCount})` : `View all (${upcomingHiddenCount})`)}
                </button>
              )}

              {sidebarTab === "vratha" && vrathaGroups.length > 0 && (
                <div style={{ marginTop: "14px" }}>
                  <p style={{ margin: "0 0 8px", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)", fontWeight: 700 }}>
                    {lang === "ta" ? "விரத வரிசை" : "Vratha sequence"}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    {vrathaGroups.slice(0, 6).map((group) => (
                      <span key={group.name} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-pill)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)", color: "var(--color-text)" }}>
                        <span aria-hidden="true" style={{ width: "7px", height: "7px", borderRadius: "var(--radius-pill)", background: "var(--color-low)" }} />
                        {group.name}
                        <span style={{ color: "var(--color-faint)" }}>{group.days.join(", ")}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sidebarTab === "muhurthams" && chartMatchedDates.length > 0 && (
                <div style={{ marginTop: "14px" }}>
                  <p style={{ margin: "0 0 8px", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-high)", fontWeight: 700 }}>
                    {lang === "ta" ? "உங்கள் ஜாதகத்துக்கு ஏற்ற நாட்கள்" : "Best for your chart"}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    {chartMatchedDates.map((dateLocal) => (
                      <span key={dateLocal} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-pill)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", fontSize: "var(--text-xs)", color: "var(--color-high)", fontWeight: 700 }}>
                        <Sparkles size={12} strokeWidth={1.5} aria-hidden="true" />
                        {formatDateLabel(dateLocal)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Card B — Filter Calendar */}
            <Card as="section" style={{ borderRadius: "var(--radius-xl)", borderColor: "var(--color-border-strong)", gap: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ fontSize: "var(--text-xs)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
                  {lang === "ta" ? "நாட்காட்டி வடிகட்டி" : "Filter Calendar"}
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={enabledCats.size === ALL_CATEGORIES.length}
                  style={{
                    border: "none", background: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-sm)", fontWeight: 700,
                    color: enabledCats.size === ALL_CATEGORIES.length ? "var(--color-faint)" : "var(--color-accent-strong)",
                    cursor: enabledCats.size === ALL_CATEGORIES.length ? "default" : "pointer",
                  }}
                >
                  {lang === "ta" ? "அழி" : "Clear"}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {CAL_FILTERS.map(({ cat, label, swatch }) => {
                  const on = catOn(cat);
                  const text = lang === "ta" ? label.ta : label.en;
                  return (
                    <div key={cat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600, color: on ? "var(--color-text-strong)" : "var(--color-muted)", minWidth: 0 }}>
                        <span aria-hidden="true" style={{ width: "10px", height: "10px", borderRadius: "var(--radius-sm)", background: swatch, opacity: on ? 1 : 0.4, flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
                      </span>
                      <FilterSwitch on={on} label={text} onToggle={() => toggleCat(cat)} />
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Card C — Quick Jump */}
            <Card as="section" style={{ borderRadius: "var(--radius-xl)", borderColor: "var(--color-border-strong)", gap: 0 }}>
              <div style={{ fontSize: "var(--text-xs)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700, marginBottom: "12px" }}>
                {lang === "ta" ? "விரைவு தாவல்" : "Quick Jump"}
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "10px" }}>
                <button
                  type="button"
                  onClick={() => onQuickJump?.("today")}
                  style={{ flex: 1, border: "1px solid var(--color-border-strong)", background: "var(--color-surface-soft)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {lang === "ta" ? "இன்று" : "Today"}
                </button>
                <button
                  type="button"
                  onClick={() => onQuickJump?.("thisMonth")}
                  style={{ flex: 1, border: "1px solid var(--color-border-strong)", background: "var(--color-surface-soft)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {lang === "ta" ? "இந்த மாதம்" : "This Month"}
                </button>
              </div>
              <button
                type="button"
                onClick={handleNextMuhurtham}
                disabled={nextMuhurthamPending || !onJumpToNextMuhurtham}
                style={{
                  width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
                  border: "1px solid var(--color-high-border)", background: "var(--color-high-bg)", borderRadius: "var(--radius-md)",
                  padding: "var(--space-3) var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-high)",
                  cursor: nextMuhurthamPending ? "progress" : "pointer", fontFamily: "inherit", opacity: nextMuhurthamPending ? 0.7 : 1,
                }}
              >
                <Sparkles size={12} strokeWidth={1.5} aria-hidden="true" />
                {nextMuhurthamPending
                  ? (lang === "ta" ? "தேடுகிறது…" : "Searching…")
                  : (lang === "ta" ? "அடுத்த முகூர்த்தம்" : "Next Muhurtham")}
              </button>
              {nextMuhurthamNote && (
                <p style={{ margin: "8px 0 0", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>{nextMuhurthamNote}</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
