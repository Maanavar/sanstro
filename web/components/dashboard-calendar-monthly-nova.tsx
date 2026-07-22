"use client";

import { useMemo, useState } from "react";

import { formatDateLabel } from "@/lib/format";
import { t, tLang, tTithi } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { lunarSpecialTithiMeta } from "@/lib/lunar";
import { festivalGlyph } from "@/lib/astro-symbols";
import type { PanchangamFestival, PanchangamMonthDayEntry } from "@/lib/types";

import {
  festivalIcon,
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

/**
 * Nova "Calendar" tab, monthly grid view — Phase 3 of the dashboard revamp,
 * pulled forward at the user's request right after Phase 2 sign-off
 * (mockup data-screen="cal-monthly", see docs/DASHBOARD_UI_REVAMP_PLAN.md).
 *
 * Classic's MonthlyCalendarView (dashboard-calendar-tab.tsx) reads almost
 * entirely from Classic-only literal-hex custom properties (--cal-*,
 * --panel-cream-light, etc. — confirmed via globals.css to have no
 * [data-ui="nova"] override), so unlike DayTimeline/.cd-detail-spec-row in
 * Phase 2, none of its markup is safe to reuse verbatim. This file
 * recomputes the same derived data (festival grouping, vratha sequences,
 * sidebar tabs) from the same PanchangamMonthlyData entries — same
 * calculations, fresh Nova-token presentation.
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
  { label: { en: "Muhurtham day", ta: "முகூர்த்த நாள்" }, icon: "/calendar/muhurtha.png", emoji: "✦", swatch: NOVA_CAL_HILITE.muhurtham.dot },
  { label: { en: "Pournami", ta: "பௌர்ணமி" }, icon: null, emoji: "🌕", swatch: NOVA_CAL_HILITE.pournami.dot },
  { label: { en: "Amavasai", ta: "அமாவாசை" }, icon: null, emoji: "🌑", swatch: NOVA_CAL_HILITE.amavasai.dot },
  { label: { en: "Chathurthi", ta: "சதுர்த்தி" }, icon: "/calendar/chathurthi.png", emoji: "🐘", swatch: NOVA_CAL_HILITE.chathurthi.dot },
  { label: { en: "Sashti", ta: "சஷ்டி" }, icon: "/calendar/shasti.png", emoji: "🦚", swatch: NOVA_CAL_HILITE.sashti.dot },
  { label: { en: "Ekadashi", ta: "ஏகாதசி" }, icon: "/calendar/ekadashi.png", emoji: "🪷", swatch: "var(--color-faint)" },
  { label: { en: "Pradosham", ta: "பிரதோஷம்" }, icon: null, emoji: "🪔", swatch: NOVA_CAL_HILITE.pradosham.dot },
  { label: { en: "Festival", ta: "திருவிழா" }, icon: null, emoji: "🎉", swatch: "var(--color-accent-strong)" },
  { label: { en: "Karinaal (avoid)", ta: "கரிநாள் (தவிர்க்க)" }, icon: null, emoji: "⚠️", swatch: "var(--color-alert-critical)" },
];

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
};

function NovaFestivalIcon({ name }: { name: string }) {
  const imgSrc = festivalImagePath(name);
  if (!imgSrc) return <span aria-hidden="true" style={{ fontSize: "0.78rem", lineHeight: 1 }}>{festivalGlyph(name)}</span>;
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
}: DashboardCalendarMonthlyNovaProps) {
  const monthLabel = lang === "ta" ? MONTH_LABELS_TA[month - 1] : MONTH_LABELS_EN[month - 1];
  const weekdayLabels = lang === "ta" ? WEEKDAY_LABELS_TA : WEEKDAY_LABELS_EN;
  const [sidebarTab, setSidebarTab] = useState<"events" | "vratha" | "muhurthams">("events");

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
  const chartMatchedMuhurthamEntries = useMemo(
    () => tamilMuhurthamEntries.filter((entry) => entry.isSubhaMuhurtham),
    [tamilMuhurthamEntries],
  );
  const chartMatchedDates = useMemo(
    () => chartMatchedMuhurthamEntries.map((entry) => entry.dateLocal),
    [chartMatchedMuhurthamEntries],
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

  const sidebarItems = useMemo(() => {
    const allEvents = monthFestivals.filter((item) => item.kind !== "vratha");
    const vratha = monthFestivals.filter((item) => item.kind === "vratha");
    const muhurthams = tamilMuhurthamEntries
      .map((entry) => ({
        dateLocal: entry.dateLocal,
        name: lang === "ta" ? "தமிழ் முகூர்த்த நாள்" : "Tamil Muhurtham",
        kind: "reference-muhurtham" as const,
      }))
      .sort((left, right) => left.dateLocal.localeCompare(right.dateLocal));
    return { events: allEvents, vratha, muhurthams };
  }, [lang, monthFestivals, tamilMuhurthamEntries]);

  const sidebarCounts = {
    events: sidebarItems.events.length,
    vratha: sidebarItems.vratha.length,
    muhurthams: sidebarItems.muhurthams.length,
  } as const;

  if (!hasLocation) {
    return <p className="empty-state">{t("panja_empty", lang)}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* ── Month nav ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Previous month"
          style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid var(--color-border-strong)", background: "transparent", display: "grid", placeItems: "center", color: "var(--color-accent-strong)", fontSize: "14px", cursor: "pointer" }}
        >
          ‹
        </button>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 600, color: "var(--color-text-strong)" }}>
          {monthLabel} {year}
        </div>
        {tamilMonthHeader && <div style={{ fontSize: "12.5px", color: "var(--color-muted)" }}>{tamilMonthHeader}</div>}
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Next month"
          style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid var(--color-border-strong)", background: "transparent", display: "grid", placeItems: "center", color: "var(--color-accent-strong)", fontSize: "14px", cursor: "pointer" }}
        >
          ›
        </button>
        {isLoading && <span style={{ fontSize: "12.5px", color: "var(--color-muted)" }}>{t("cal_monthly_loading", lang)}</span>}
      </div>

      {error && <p className="empty-state">{error}</p>}
      {!isLoading && !error && !monthly?.entries.length && <p className="empty-state">{t("cal_monthly_empty", lang)}</p>}

      {Boolean(monthly?.entries.length) && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: "18px", alignItems: "start" }} className="nova-cal-monthly-layout">
          {/* ── Grid ── */}
          <div style={{ minWidth: 0, overflowX: "auto" }}>
            <div style={{ minWidth: "620px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "8px", marginBottom: "8px" }}>
                {weekdayLabels.map((wd, i) => (
                  <div key={wd} style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", color: i === 0 ? "var(--color-low)" : "var(--color-faint)" }}>
                    {wd}
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "8px" }}>
                {cells.map((cell, idx) => {
                  if (!cell.dateLocal) return <div key={`blank-${idx}`} style={{ minHeight: "82px" }} />;
                  const entry = cell.entry;
                  const dayNumber = Number(cell.dateLocal.slice(-2));
                  const isSelected = cell.dateLocal === selectedDate;
                  const isToday = cell.dateLocal === todayDate;
                  const dayItems = monthFestivals.filter((item) => item.dateLocal === cell.dateLocal);
                  const dominantKind = dayItems[0]?.kind;
                  const hasFestival = dayItems.length > 0;
                  const dotColor = dominantKind ? NOVA_DOT_TONE[dominantKind] : null;
                  const tamilDay = entry?.tamilDate ? tLang(entry.tamilDate, lang) : "";
                  const specialTithi = entry?.specialTithiDayNumber === 15 ? "POURNAMI" : entry?.specialTithiDayNumber === 30 ? "AMAVASAI" : null;
                  const specialTithiMeta = lunarSpecialTithiMeta(specialTithi, lang);
                  const specialFestivalNames = entry ? entry.festivals.map((f) => f.name).join(" ") : "";
                  const highlightType: NovaHighlightKind | null = !entry ? null
                    : entry.isTamilMuhurthamDay ? "muhurtham"
                    : entry.specialTithiDayNumber === 15 ? "pournami"
                    : entry.specialTithiDayNumber === 30 ? "amavasai"
                    : /chaturthi|chathurthi/i.test(specialFestivalNames) ? "chathurthi"
                    : /sashti/i.test(specialFestivalNames) ? "sashti"
                    : /pradhosam|pradosham/i.test(specialFestivalNames) ? "pradosham"
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
                  const selectionRing = isSelected ? "0 0 0 2px var(--color-text-strong)" : isToday ? "0 0 0 1.5px color-mix(in srgb, var(--color-text-strong) 55%, transparent)" : "none";
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
                        border: `1px solid ${cellBorder}`, borderRadius: "9px",
                        boxShadow: selectionRing,
                        background: cellBg, padding: "9px", minHeight: "82px",
                        display: "flex", flexDirection: "column", gap: "4px",
                        overflow: "hidden", cursor: onSelectDate ? "pointer" : "default", textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      {dotColor && (
                        <span aria-hidden="true" style={{ position: "absolute", top: "8px", right: "8px", width: "6px", height: "6px", borderRadius: "50%", background: dotColor }} />
                      )}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: dateColor, lineHeight: 1 }}>{dayNumber}</span>
                        {specialTithiMeta && (
                          <span title={specialTithiMeta.label} style={{ color: dateColor, display: "inline-flex", marginTop: "1px" }}>
                            <MoonPhaseMark kind={specialTithiMeta.kind} size={9} />
                          </span>
                        )}
                      </div>
                      {tamilDay && <span style={{ fontSize: "10px", color: hasFestival ? "var(--color-text)" : "var(--color-faint)" }}>{tamilDay}</span>}
                      {entry && <span style={{ fontSize: "10px", color: hasFestival ? "var(--color-text)" : "var(--color-faint)" }}>{tTithi(entry.tithiName, lang)}</span>}
                      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                        {entry?.festivals.slice(0, 2).map((f: PanchangamFestival) => (
                          <span key={f.name} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "center", gap: "5px", fontSize: "9.5px", fontWeight: 500, color: "var(--color-accent-strong)", minWidth: 0 }}>
                            <NovaFestivalIcon name={f.name} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{f.name}</span>
                          </span>
                        ))}
                        {entry?.isTamilMuhurthamDay && (
                          <span style={{ fontSize: "9.5px", fontWeight: 700, color: "var(--color-high)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <span aria-hidden="true">✦</span>{lang === "ta" ? "முகூர்த்தம்" : "Muhurtham"}
                          </span>
                        )}
                        {entry?.isKarinaal && (
                          <span style={{ fontSize: "9.5px", fontWeight: 700, color: "var(--color-alert-critical-text, var(--color-alert-critical))", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <span aria-hidden="true">⚠</span>{lang === "ta" ? "கரிநாள்" : "Karinaal"}
                          </span>
                        )}
                        {isToday && (
                          <span style={{ alignSelf: "flex-start", borderRadius: "999px", background: "color-mix(in srgb, var(--color-text-strong) 14%, transparent)", color: "var(--color-text-strong)", padding: "2px 8px", fontSize: "9.5px", fontWeight: 700 }}>
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--color-border)" }}>
              {NOVA_LEGEND.map((item) => (
                <span key={item.label.en} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--color-muted)" }}>
                  <span aria-hidden="true" style={{ width: "9px", height: "9px", borderRadius: "3px", background: item.swatch, display: "inline-block" }} />
                  {lang === "ta" ? item.label.ta : item.label.en}
                </span>
              ))}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-xl)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid var(--color-border)", marginBottom: "10px" }}>
              {([
                ["events", lang === "ta" ? "நிகழ்வுகள்" : "Events", sidebarCounts.events],
                ["vratha", lang === "ta" ? "விரதம்" : "Vratha", sidebarCounts.vratha],
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
                      padding: "0 0 10px", cursor: "pointer", fontSize: "12.5px", fontWeight: active ? 700 : 600,
                      display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "inherit",
                    }}
                  >
                    <span>{label}</span>
                    {count > 0 && <span style={{ color: active ? "var(--color-accent-strong)" : "var(--color-faint)", fontSize: "11.5px" }}>{count}</span>}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {sidebarItems[sidebarTab].length === 0 ? (
                <p style={{ margin: "9px 2px", fontSize: "12.5px", color: "var(--color-muted)" }}>{t("cal_monthly_empty", lang)}</p>
              ) : (
                sidebarItems[sidebarTab].map((item) => {
                  const itemColor = item.kind === "reference-muhurtham" ? "var(--color-high)" : NOVA_DOT_TONE[item.kind as "festival" | "vratha" | "global"];
                  const isMuhurtham = item.kind === "reference-muhurtham";
                  const isChartMatch = isMuhurtham && chartMatchedDates.includes(item.dateLocal);
                  const dayLabel = new Date(`${item.dateLocal}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "2-digit", month: "short" });
                  return (
                    <div key={`${item.dateLocal}-${item.name}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "9px 2px", borderBottom: "1px solid color-mix(in srgb, var(--color-text-strong) 6%, transparent)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-strong)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "50%", background: isChartMatch ? "var(--color-high)" : itemColor, flexShrink: 0 }} />
                        {item.name}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        {isChartMatch && (
                          <span style={{ fontSize: "9.5px", fontWeight: 800, color: "var(--color-high)", background: "var(--color-high-bg)", borderRadius: "999px", padding: "2px 6px", whiteSpace: "nowrap" }}>
                            {lang === "ta" ? "உங்கள் ஜாதகம்" : "Your chart ✦"}
                          </span>
                        )}
                        <span style={{ color: "var(--color-faint)", fontSize: "11.5px" }}>{dayLabel}</span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {sidebarTab === "vratha" && vrathaGroups.length > 0 && (
              <div style={{ marginTop: "14px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "10.5px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)", fontWeight: 700 }}>
                  {lang === "ta" ? "விரத வரிசை" : "Vratha sequence"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {vrathaGroups.slice(0, 6).map((group) => (
                    <span key={group.name} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "999px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", fontSize: "11.5px", color: "var(--color-text)" }}>
                      <span aria-hidden="true" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-low)" }} />
                      {group.name}
                      <span style={{ color: "var(--color-faint)" }}>{group.days.join(", ")}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sidebarTab === "muhurthams" && chartMatchedDates.length > 0 && (
              <div style={{ marginTop: "14px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "10.5px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-high)", fontWeight: 700 }}>
                  {lang === "ta" ? "உங்கள் ஜாதகத்துக்கு ஏற்ற நாட்கள்" : "Best for your chart"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {chartMatchedDates.map((dateLocal) => (
                    <span key={dateLocal} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "999px", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", fontSize: "11.5px", color: "var(--color-high)", fontWeight: 700 }}>
                      <span aria-hidden="true">✦</span>
                      {formatDateLabel(dateLocal)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
