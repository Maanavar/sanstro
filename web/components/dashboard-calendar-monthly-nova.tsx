"use client";

import { Sparkles, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

import { t, tLang, tTithi } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { lunarSpecialTithiMeta, moonPhaseFromTithi } from "@/lib/lunar";
import { festivalGlyph } from "@/lib/astro-symbols";
import type { PanchangamFestival, PanchangamMonthDayEntry } from "@/lib/types";

import { MiniMoonGlyph } from "./celestial-glyph-nova";
import { GlossaryTerm } from "./glossary-term";
import type { GlossaryKey } from "@/lib/glossary";
import {
  festivalImagePath,
  MONTH_LABELS_EN,
  MONTH_LABELS_TA,
  tamilMonthOnly,
  VRATHA_FESTIVAL_PATTERN,
  WEEKDAY_LABELS_EN,
  WEEKDAY_LABELS_TA,
} from "./dashboard-calendar-shared";
import { Button, Card } from "./ui";
import { SectionHeader } from "./ui/kicker";

/**
 * Nova "Calendar" tab, monthly grid view (mockup data-screen="cal-monthly",
 * docs/DASHBOARD_UI_REVAMP_PLAN.md).
 *
 * Layout (rebuilt 2026-09-15 from browser screenshots, see
 * docs/CALENDAR_EVENTS_RAIL_REDESIGN_2026-09-12.md §9): the controls sit with
 * the grid they control — month nav, Today / Next muhurtham and the category
 * filter chips form one toolbar above it — and the right rail is a single
 * agenda card sized to the grid column, never to its own content. Every agenda
 * row uses the same date column (day number over weekday) and opens the day
 * exactly like a grid cell. Filters and grid share one category model
 * (`CalCategory`) so a toggle and a highlight can never disagree.
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

// Vratha and civic dots have no legend entry of their own, so they use the
// legend's neutral grey rather than borrowing Chathurthi's or Amavasai's colour.
const NOVA_DOT_TONE: Record<"festival" | "vratha" | "global", string> = {
  festival: "var(--color-accent-strong)",
  vratha: "var(--color-faint)",
  global: "var(--color-faint)",
};

const NOVA_LEGEND: Array<{ label: { en: string; ta: string }; icon: string | null; emoji: string; swatch: string; term?: GlossaryKey }> = [
  { label: { en: "Muhurtham day", ta: "முகூர்த்த நாள்" }, icon: "/calendar/muhurtha.png", emoji: "🌟", swatch: NOVA_CAL_HILITE.muhurtham.dot },
  { label: { en: "Pournami", ta: "பௌர்ணமி" }, icon: null, emoji: "🌕", swatch: NOVA_CAL_HILITE.pournami.dot, term: "pournami" },
  { label: { en: "Amavasai", ta: "அமாவாசை" }, icon: null, emoji: "🌑", swatch: NOVA_CAL_HILITE.amavasai.dot },
  { label: { en: "Chathurthi", ta: "சதுர்த்தி" }, icon: "/calendar/chathurthi.png", emoji: "🐘", swatch: NOVA_CAL_HILITE.chathurthi.dot, term: "chathurthi" },
  { label: { en: "Sashti", ta: "சஷ்டி" }, icon: "/calendar/shasti.png", emoji: "🦚", swatch: NOVA_CAL_HILITE.sashti.dot, term: "sashti" },
  { label: { en: "Ekadashi", ta: "ஏகாதசி" }, icon: "/calendar/ekadashi.png", emoji: "🪷", swatch: "var(--color-faint)", term: "ekadashi" },
  { label: { en: "Pradosham", ta: "பிரதோஷம்" }, icon: null, emoji: "🪔", swatch: NOVA_CAL_HILITE.pradosham.dot, term: "pradosham" },
  { label: { en: "Festival", ta: "திருவிழா" }, icon: null, emoji: "🎉", swatch: "var(--color-accent-strong)" },
  { label: { en: "Karinaal (avoid)", ta: "கரிநாள் (தவிர்க்க)" }, icon: null, emoji: "🚫", swatch: "var(--color-alert-critical)" },
];

// ── Filter/grid category model ──────────────────────────────────────────────
// One enum drives the filter chips, the grid highlights, and the agenda, so a
// toggled-off category leaves the grid and the agenda in lockstep. Ekadashi is
// split out ahead of Vratham because it also matches VRATHA_FESTIVAL_PATTERN —
// order matters here.
type CalCategory = "muhurtham" | "vratham" | "festivals" | "lunar" | "ekadashi" | "karinaal";

const EKADASHI_PATTERN = /ekadashi|ekadasi|ஏகாதசி/i;

// Weight only, never filtering: the fortnightly observances every month
// repeats. Named yearly festivals that merely contain a vratham word
// (Vinayagar Chaturthi, Skanda Sashti, Vaikunta Ekadashi, Mahalaya Amavasai)
// deliberately do not match, so they read as festivals in the agenda.
const ROUTINE_OBSERVANCE_PATTERN =
  /^(sani )?prad(h)?osh?am$|^ekadashi \((shukla|krishna)\)$|^(angarki )?sankatahara chaturthi$|^cha?th?urthi$|^sashti$|^theipirai ashtami$|^(thiruvonam|rohini|karthigai) vrat(h)?am$/i;

const MAJOR_FESTIVAL_CATEGORIES = new Set(["hindu", "muslim", "christian"]);

// Written out rather than sliced from MONTH_LABELS_*. Tamil month names are
// built from grapheme clusters, so "ஆகஸ்ட்".slice(0, 3) cuts between a
// consonant and its pulli and renders as broken text — the abbreviation has to
// be chosen, not truncated.
const MONTH_SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_SHORT_TA = ["ஜன", "பிப்", "மார்", "ஏப்", "மே", "ஜூன்", "ஜூலை", "ஆக", "செப்", "அக்", "நவ", "டிச"];

/**
 * "2026-08-17" → "17 Aug" / "17 ஆக".
 *
 * Built from the tables above rather than `toLocaleDateString`, for two
 * reasons. `new Date("2026-08-17")` is parsed as UTC and shifts a day west of
 * Greenwich, which would silently misdate the Tamil month changeover; and
 * `ta-IN` short-month output depends on the runtime's ICU build, so it differs
 * between the browser and the Node the tests run in.
 */
export function formatGridDay(dateLocal: string, lang: Lang): string {
  const [, mm, dd] = dateLocal.split("-");
  const monthIndex = Number(mm) - 1;
  const name = (lang === "ta" ? MONTH_SHORT_TA : MONTH_SHORT_EN)[monthIndex];
  if (!name || !dd || Number.isNaN(Number(dd))) return dateLocal;
  return `${Number(dd)} ${name}`;
}

/**
 * B-027 — the Tamil month name(s) under the grid heading, anchored to the
 * Gregorian date the month actually turns over: "Aadi → Aavani · 17 Aug".
 *
 * A Tamil month runs from one solar ingress to the next, so it straddles the
 * middle of a Gregorian month rather than lining up with it, and a grid headed
 * "August 2026" almost always shows two of them. The fact a reader needs is
 * therefore WHERE the seam falls. A date range for the Gregorian month is not
 * that fact — it restates the heading immediately above it. (The first pass
 * printed exactly that: "Aadi & Aavani · 1 Aug–31 Aug 2026", directly under a
 * heading reading "August 2026".)
 *
 * The seam is read off the data rather than computed: it is the first day in
 * the grid whose Tamil month label differs from the previous day's. Only
 * changeovers are dated — the FIRST segment was already running when the grid
 * opened, and dating it to the 1st would claim a start it did not have.
 *
 * Entries are sorted defensively. The seam is the one thing this derives, and
 * deriving it from adjacency means an out-of-order feed would invent seams.
 */
export function buildTamilMonthHeader(entries: PanchangamMonthDayEntry[], lang: Lang): string {
  const segments: { label: string; startsOn: string }[] = [];

  entries
    .slice()
    .sort((a, b) => a.dateLocal.localeCompare(b.dateLocal))
    .forEach((entry) => {
      if (!entry.tamilDate || !entry.dateLocal) return;
      const label = tamilMonthOnly(tLang(entry.tamilDate, lang));
      if (!label) return;
      if (segments[segments.length - 1]?.label !== label) {
        segments.push({ label, startsOn: entry.dateLocal });
      }
    });

  if (segments.length === 0) return "";
  const names = segments.map((s) => s.label).join(" → ");
  const changeovers = segments.slice(1).map((s) => formatGridDay(s.startsOn, lang)).join(", ");
  return changeovers ? `${names} · ${changeovers}` : names;
}

function festivalCalCategory(name: string): CalCategory {
  if (EKADASHI_PATTERN.test(name)) return "ekadashi";
  if (VRATHA_FESTIVAL_PATTERN.test(name)) return "vratham";
  return "festivals";
}

const CAL_FILTERS: Array<{ cat: CalCategory; label: { en: string; ta: string }; swatch: string }> = [
  { cat: "muhurtham", label: { en: "Muhurtham", ta: "முகூர்த்தம்" }, swatch: NOVA_CAL_HILITE.muhurtham.dot },
  { cat: "festivals", label: { en: "Festivals", ta: "திருவிழாக்கள்" }, swatch: NOVA_DOT_TONE.festival },
  { cat: "vratham", label: { en: "Vratham", ta: "விரதம்" }, swatch: NOVA_DOT_TONE.vratha },
  { cat: "ekadashi", label: { en: "Ekadashi", ta: "ஏகாதசி" }, swatch: "var(--color-faint)" },
  { cat: "lunar", label: { en: "Amavasai / Pournami", ta: "அமாவாசை / பௌர்ணமி" }, swatch: NOVA_CAL_HILITE.pournami.dot },
  { cat: "karinaal", label: { en: "Karinaal", ta: "கரிநாள்" }, swatch: "var(--color-alert-critical)" },
];
const ALL_CATEGORIES: CalCategory[] = CAL_FILTERS.map((f) => f.cat);

type SidebarEvent = {
  dateLocal: string;
  name: string;
  calCategory: CalCategory;
  kind: "festival" | "vratha" | "global";
};

type AgendaDay = {
  dateLocal: string;
  dayNumber: number;
  weekday: string;
  meta: string;
  major: string[];
  civic: string[];
  routine: string[];
  muhurtham: "subha" | "plain" | null;
  karinaal: boolean;
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
  /** Navigate the grid to the current month (and, for "today", open today's
   *  day-detail drawer). Owned by the parent, which holds the month-nav +
   *  drawer state. */
  onQuickJump?: (target: "today" | "thisMonth") => void;
  /** Scan forward across months for the next Tamil muhurtham day after today,
   *  navigate there and open it. Resolves false when none is found within the
   *  parent's scan cap. */
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

  const [enabledCats, setEnabledCats] = useState<Set<CalCategory>>(() => new Set(ALL_CATEGORIES));
  const catOn = (cat: CalCategory) => enabledCats.has(cat);
  const toggleCat = (cat: CalCategory) =>
    setEnabledCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  const allFiltersOn = enabledCats.size === ALL_CATEGORIES.length;

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

  /**
   * B-027. See `buildTamilMonthHeader`.
   */
  const tamilMonthHeader = useMemo(
    () => buildTamilMonthHeader(monthly?.entries ?? [], lang),
    [lang, monthly],
  );

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

  // Every festival in the month, deduped and tagged with its filter category.
  // `kind` drives the grid cell's corner dot: a vratham-pattern name is always
  // "vratha"; otherwise "festival" iff the festival's own resolved `category`
  // is religious. (Checking the tags instead demoted every festival that is
  // also a gazetted holiday — Deepavali, Ugadi, Pongal — to civic.)
  const monthFestivals = useMemo<SidebarEvent[]>(() => {
    const seen = new Set<string>();
    const items: SidebarEvent[] = [];
    (monthly?.entries ?? []).forEach((entry) => {
      entry.festivals.forEach((f) => {
        const key = `${entry.dateLocal}::${f.name}`;
        if (seen.has(key)) return;
        seen.add(key);
        const isVratha = VRATHA_FESTIVAL_PATTERN.test(f.name);
        const isMajor = !isVratha && MAJOR_FESTIVAL_CATEGORIES.has(f.category);
        items.push({
          dateLocal: entry.dateLocal,
          name: f.name,
          calCategory: festivalCalCategory(f.name),
          kind: isVratha ? "vratha" : isMajor ? "festival" : "global",
        });
      });
    });
    return items;
  }, [monthly]);

  // The agenda: one row per day that has anything the filters let through, in
  // date order. Within a day, festivals lead, civic days follow, and routine
  // fortnightly observances come last in a quieter line. `isSubhaMuhurtham` is
  // the almanac's general subha rule (no birth data), so it is labelled as
  // such and never as a personal match.
  const agendaDays = useMemo<AgendaDay[]>(() => {
    return (monthly?.entries ?? [])
      .slice()
      .sort((a, b) => a.dateLocal.localeCompare(b.dateLocal))
      .flatMap((entry): AgendaDay[] => {
        const seen = new Set<string>();
        const major: string[] = [];
        const civic: string[] = [];
        const routine: string[] = [];
        entry.festivals.forEach((f) => {
          if (seen.has(f.name) || !enabledCats.has(festivalCalCategory(f.name))) return;
          seen.add(f.name);
          if (ROUTINE_OBSERVANCE_PATTERN.test(f.name)) routine.push(f.name);
          else if (MAJOR_FESTIVAL_CATEGORIES.has(f.category)) major.push(f.name);
          else civic.push(f.name);
        });
        const special = entry.specialTithiDayNumber === 15 ? "POURNAMI" : entry.specialTithiDayNumber === 30 ? "AMAVASAI" : null;
        if (special && enabledCats.has("lunar") && !entry.festivals.some((f) => /amavas|pourn/i.test(f.name))) {
          const lunar = lunarSpecialTithiMeta(special, lang);
          if (lunar) routine.unshift(lunar.label);
        }
        // A generic observance the day's named festival already says
        // ("Chathurthi" under "Vinayagar Chaturthi") is the same fact twice.
        const folded = (s: string) => s.toLowerCase().replace(/h/g, "");
        const routineShown = routine.filter((name) => !major.some((m) => folded(m).includes(folded(name))));
        routine.length = 0;
        routine.push(...routineShown);
        const muhurtham = entry.isTamilMuhurthamDay && enabledCats.has("muhurtham")
          ? (entry.isSubhaMuhurtham ? "subha" : "plain")
          : null;
        const karinaal = Boolean(entry.isKarinaal) && enabledCats.has("karinaal");
        if (major.length + civic.length + routine.length === 0 && !muhurtham && !karinaal) return [];
        const y = Number(entry.dateLocal.slice(0, 4));
        const m = Number(entry.dateLocal.slice(5, 7));
        const d = Number(entry.dateLocal.slice(8, 10));
        return [{
          dateLocal: entry.dateLocal,
          dayNumber: d,
          weekday: weekdayLabels[new Date(y, m - 1, d).getDay()] ?? "",
          // Tamil date only: the tithi is on the grid cell, and in the agenda it
          // mostly repeated the event beside it ("Sashti … · Shashti").
          meta: entry.tamilDate ? tLang(entry.tamilDate, lang) : "",
          major,
          civic,
          routine,
          muhurtham,
          karinaal,
        }];
      });
  }, [monthly, lang, enabledCats, weekdayLabels]);

  const observanceCount = agendaDays.reduce(
    (sum, day) => sum + day.major.length + day.civic.length + day.routine.length + (day.muhurtham ? 1 : 0),
    0,
  );

  // Open the agenda where the reader is: the selected day if it is in this
  // month, else today if it is, else the top. Scrolls the list, not the page.
  const agendaListRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = agendaListRef.current;
    if (!list) return;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const anchor = selectedDate.startsWith(monthKey) ? selectedDate : todayDate.startsWith(monthKey) ? todayDate : null;
    const first = anchor ? agendaDays.find((day) => day.dateLocal >= anchor) : undefined;
    const row = first ? list.querySelector<HTMLElement>(`[data-date="${first.dateLocal}"]`) : null;
    list.scrollTop = row ? Math.max(0, row.offsetTop - 4) : 0;
  }, [agendaDays, selectedDate, todayDate, year, month]);

  if (!hasLocation) {
    return <p className="empty-state">{t("panja_empty", lang)}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* ── Toolbar: month nav + jumps, then the category filters ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div className="nova-cal-toolbar">
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
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Next month"
            style={{ width: "30px", height: "30px", borderRadius: "var(--radius-pill)", border: "1px solid var(--color-border-strong)", background: "transparent", display: "grid", placeItems: "center", color: "var(--color-accent-strong)", fontSize: "var(--text-base)", cursor: "pointer" }}
          >
            <ChevronRight size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
          {tamilMonthHeader && <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{tamilMonthHeader}</div>}
          {isLoading && <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{t("cal_monthly_loading", lang)}</span>}
          <div className="nova-cal-toolbar__actions">
            <Button size="sm" variant="secondary" onClick={() => onQuickJump?.("today")}>
              {lang === "ta" ? "இன்று" : "Today"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleNextMuhurtham}
              disabled={nextMuhurthamPending || !onJumpToNextMuhurtham}
            >
              <Sparkles size={13} strokeWidth={1.75} aria-hidden="true" style={{ color: "var(--color-high)" }} />
              {nextMuhurthamPending
                ? (lang === "ta" ? "தேடுகிறது…" : "Searching…")
                : (lang === "ta" ? "அடுத்த முகூர்த்தம்" : "Next muhurtham")}
            </Button>
          </div>
        </div>

        <div className="nova-cal-filters" role="group" aria-label={lang === "ta" ? "நாட்காட்டி வடிகட்டி" : "Filter calendar"}>
          {CAL_FILTERS.map(({ cat, label, swatch }) => {
            const on = catOn(cat);
            return (
              <button
                key={cat}
                type="button"
                className="nova-cal-filter"
                aria-pressed={on}
                onClick={() => toggleCat(cat)}
                style={{ "--swatch": swatch } as React.CSSProperties}
              >
                <span className="nova-cal-filter__swatch" aria-hidden="true" />
                {lang === "ta" ? label.ta : label.en}
              </button>
            );
          })}
          {!allFiltersOn && (
            <Button size="sm" variant="ghost" onClick={() => setEnabledCats(new Set(ALL_CATEGORIES))}>
              {lang === "ta" ? "அனைத்தும் காட்டு" : "Show all"}
            </Button>
          )}
        </div>

        {nextMuhurthamNote && (
          <p role="status" style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>{nextMuhurthamNote}</p>
        )}
      </div>

      {error && <p className="empty-state">{error}</p>}
      {!isLoading && !error && !monthly?.entries.length && <p className="empty-state">{t("cal_monthly_empty", lang)}</p>}

      {Boolean(monthly?.entries.length) && (
        <div className="nova-cal-monthly-layout">
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
                  const dotColor = dominantKind ? NOVA_DOT_TONE[dominantKind] : null;
                  const tamilDay = entry?.tamilDate ? tLang(entry.tamilDate, lang) : "";
                  const showMuhurtham = Boolean(entry?.isTamilMuhurthamDay) && catOn("muhurtham");
                  const showLunar = catOn("lunar");
                  const showKarinaal = Boolean(entry?.isKarinaal) && catOn("karinaal");
                  // Every day carries its real moon shape, not just the two
                  // special tithis: the month grid is where the fortnight's
                  // rhythm is read, and the old flat mark appeared only on
                  // Pournami/Amavasai, so the fourteen days between them showed
                  // nothing at all. Phase comes from the day's own tithi +
                  // paksha (no ephemeris call) — see moonPhaseFromTithi.
                  //
                  // Deliberately NOT gated by the "lunar" filter: that toggle
                  // governs the Pournami/Amavasai *highlight tint*, which is an
                  // event category, whereas the moon's shape is a plain fact
                  // about the day — same standing as the tithi name printed
                  // right below it.
                  const moonPhase = entry ? moonPhaseFromTithi(entry.tithiNumber, entry.tithiPaksha) : null;
                  const lunarMeta = lunarSpecialTithiMeta(
                    entry?.specialTithiDayNumber === 15 ? "POURNAMI" : entry?.specialTithiDayNumber === 30 ? "AMAVASAI" : null,
                    lang,
                  );
                  const moonTitle = entry
                    ? [
                        tTithi(entry.tithiName, lang),
                        lunarMeta
                          ? lunarMeta.phaseLabel
                          : entry.tithiPaksha === "SHUKLA"
                            ? (lang === "ta" ? "வளர்பிறை" : "Waxing")
                            : (lang === "ta" ? "தேய்பிறை" : "Waning"),
                      ].filter(Boolean).join(" · ")
                    : "";
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
                      className={isToday ? "nova-cal-today" : undefined}
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
                        {moonPhase && (
                          <span title={moonTitle} style={{ display: "inline-flex", marginTop: "1px" }}>
                            <MiniMoonGlyph phase={moonPhase} size={13} />
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
                  {item.term ? <GlossaryTerm term={item.term} lang={lang}>{lang === "ta" ? item.label.ta : item.label.en}</GlossaryTerm> : (lang === "ta" ? item.label.ta : item.label.en)}
                </span>
              ))}
            </div>
          </div>

          {/* ── Agenda rail — sized by the grid column, scrolls inside ── */}
          <div className="nova-cal-agenda-slot">
            <Card as="section" className="nova-cal-agenda" aria-label={lang === "ta" ? "நிகழ்வுகள் & திருவிழாக்கள்" : "Events & Festivals"}>
              <SectionHeader
                title={lang === "ta" ? "நிகழ்வுகள் & திருவிழாக்கள்" : "Events & Festivals"}
                right={
                  <span className="nova-cal-agenda__count">
                    {lang === "ta" ? `${observanceCount} நிகழ்வுகள்` : `${observanceCount} ${observanceCount === 1 ? "observance" : "observances"}`}
                  </span>
                }
              />
              {agendaDays.length === 0 ? (
                <p className="nova-cal-agenda__empty">
                  {lang === "ta" ? "வடிகட்டிகளுக்குப் பொருந்தும் நிகழ்வு இல்லை." : "Nothing matches the selected filters."}
                </p>
              ) : (
                <ol ref={agendaListRef} className="nova-cal-agenda__list">
                  {agendaDays.map((day) => {
                    const isToday = day.dateLocal === todayDate;
                    const isSelected = day.dateLocal === selectedDate;
                    const minor = [...day.civic, ...day.routine];
                    return (
                      <li key={day.dateLocal} data-date={day.dateLocal}>
                        <button
                          type="button"
                          className={`nova-cal-agenda__day${isToday ? " nova-cal-agenda__day--today" : ""}`}
                          aria-current={isToday ? "date" : undefined}
                          aria-pressed={onSelectDate ? isSelected : undefined}
                          onClick={onSelectDate ? () => onSelectDate(day.dateLocal) : undefined}
                          disabled={!onSelectDate}
                        >
                          <span className="nova-cal-agenda__date" aria-hidden={false}>
                            <span className="nova-cal-agenda__dnum">{day.dayNumber}</span>
                            <span className="nova-cal-agenda__dow">{day.weekday}</span>
                          </span>
                          <span className="nova-cal-agenda__body">
                            {day.major.map((name) => (
                              <span key={name} className="nova-cal-agenda__major">{name}</span>
                            ))}
                            {minor.length > 0 && (
                              <span className={day.major.length ? "nova-cal-agenda__minor" : "nova-cal-agenda__minor nova-cal-agenda__minor--lead"}>
                                {minor.join(" · ")}
                              </span>
                            )}
                            {(day.muhurtham || day.karinaal) && (
                              <span className="nova-cal-agenda__marks">
                                {day.muhurtham && (
                                  <span className="nova-cal-agenda__mark nova-cal-agenda__mark--muhurtham">
                                    <Sparkles size={12} strokeWidth={1.75} aria-hidden="true" />
                                    {day.muhurtham === "subha"
                                      ? (lang === "ta" ? "சுப முகூர்த்தம்" : "Subha muhurtham")
                                      : (lang === "ta" ? "முகூர்த்தம்" : "Muhurtham")}
                                  </span>
                                )}
                                {day.karinaal && (
                                  <span className="nova-cal-agenda__mark nova-cal-agenda__mark--avoid">
                                    <AlertTriangle size={12} strokeWidth={1.75} aria-hidden="true" />
                                    {lang === "ta" ? "கரிநாள் · தவிர்க்க" : "Karinaal · avoid"}
                                  </span>
                                )}
                              </span>
                            )}
                            {day.meta && <span className="nova-cal-agenda__meta">{day.meta}</span>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  <li className="nova-cal-agenda__foot">
                    <a href="/tamil-calendar" target="_blank" rel="noreferrer">
                      {lang === "ta" ? "முழு தமிழ் நாட்காட்டி →" : "Full Tamil calendar →"}
                    </a>
                  </li>
                </ol>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
