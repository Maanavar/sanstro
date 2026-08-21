"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";

import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { addDays, formatClockLabel, formatHijriDate } from "@/lib/format";
import {
  bestGowriSlot,
  gowriCategoryLabel,
  gowriCategoryRank,
  gowriCautionLabel,
  gowriPeriodLabel,
  gowriPurposeLabel,
  gowriQualityLabel,
  gowriSlotDayOffsets,
} from "@/lib/gowri";
import type { GowriSlotDayOffset } from "@/lib/gowri";
import { t, tAmirdhadhiYogam, tJeevan, tKarana, tMoonPhase, tNakshatra, tNethiram, tParigaram, tPlanetLord, tSoolamDirection, tTithi, tWeekday, tYoga } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { rasiGlyph } from "@/lib/astro-symbols";
import { lunarSpecialTithiMeta, moonPhaseFromTithi } from "@/lib/lunar";
import { nokkuMeta } from "@/lib/nokku";
import { timeOnDateToMs } from "@/lib/tz";
import { MiniMoonGlyph } from "./celestial-glyph-nova";
import { useMonthlyPanchangam } from "@/hooks/useMonthlyPanchangam";
import { PlaceCombobox } from "./place-combobox";
import { DrawerPanel } from "./drawer-panel";
import { Card, Pill, Segmented } from "./ui";
import { Kicker } from "./ui/kicker";
import type {
  PanchangamDailyResponseData,
  PanchangamFestival,
  PanchangamMonthlyData,
  PanchangamTimingsData,
} from "@/lib/types";

import { DASHA_COLORS } from "./dashboard-dasha";
import {
  activeLimb,
  chandrashtamaAffectedNatalRasi,
  DayTimeline,
  festivalIcon,
  festivalTags,
  formatChandrashtamaWindowSummary,
  formatHeaderDate,
  formatUntilLabel,
  LunarTithiBadge,
  moonRasiFromNakshatra,
  parseHmToMinutes,
  rasiName,
  resolveTamilDate,
  timeWindowsOverlap,
} from "./dashboard-calendar-shared";
import type { CalendarView, DayTimelineBand } from "./dashboard-calendar-shared";
import { MonthlyCalendarViewNova } from "./dashboard-calendar-monthly-nova";
import { NovaPlanMuhurtaPanel } from "./dashboard-plan-muhurta-nova";

// "Best Dates & Muhurta" moved here from Goals (IA audit 2026-07-22, Phase 3):
// timing/almanac work belongs with the panchangam, not goal-setting. The panel
// is self-contained (`NovaPlanMuhurtaPanel`, props `{ lang, chartId }`).
type CalendarViewExt = CalendarView | "muhurta";

/**
 * Nova "Calendar" tab, daily Panchangam view — Phase 2 of the dashboard
 * revamp (mockup data-screen="cal-panch", see docs/DASHBOARD_UI_REVAMP_PLAN.md
 * §6/§8 Phase 2). Re-skin, not a rewrite: every field and calculation below
 * comes from the same PanchangamDailyResponseData Classic's CalendarTab
 * (dashboard-calendar-tab.tsx) already receives — the pure derivation
 * helpers (activeLimb promotion, chandrashtamam rasi math, header/tamil
 * date formatting, festival tag extraction, the Hora/DayTimeline SVG
 * component) are imported from that file rather than reimplemented, since
 * they already read exclusively from var(--color-*) tokens Nova redefines.
 *
 * The "Monthly" toggle (screen 3, mockup data-screen="cal-monthly") was
 * originally deferred to a later phase, then pulled forward in this same
 * session after the user flagged Classic-styled colors leaking through —
 * see `dashboard-calendar-monthly-nova.tsx` for that screen's own re-skin
 * (`MonthlyCalendarViewNova`) and `DayDetailDrawerNova` below for its
 * day-click preview drawer.
 */

export type DashboardCalendarTabNovaProps = {
  selectedDate: string;
  todayDate: string;
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;
  lang: Lang;
  locationLabel?: string | null;
  /** IANA timezone of the panchangam location; used for live timing states. */
  panchangamTimezone?: string | null;
  onSelectDate?: (date: string) => void;
  /** Personal chart the "Best Dates & Muhurta" view computes against. Null when
   *  no birth profile exists yet — the view then shows an add-profile note. */
  chartId?: string | null;
  memberCharts?: Array<{ memberId: string; displayName: string }>;
  selectedMemberId?: string | null;
  onSelectMember?: (memberId: string | null) => void;
  /** Cross-tab request to open a specific view (e.g. Goals' "Best Dates &
   *  Muhurta in Calendar" wants `muhurta`). Focused on arrival, then cleared
   *  via `onFocusConsumed` (IA audit 2026-07-22, Phase 3). */
  focusView?: string | null;
  onFocusConsumed?: () => void;
};

function novaFestivalTagLabel(tag: string, lang: Lang): string {
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

function novaFestivalTagTone(tag: string): { bg: string; border: string; color: string } {
  if (tag === "hindu") return { bg: "var(--color-accent-muted)", border: "var(--color-border-strong)", color: "var(--color-accent-strong)" };
  if (tag === "muslim") return { bg: "var(--color-high-bg)", border: "var(--color-high-border)", color: "var(--color-high)" };
  if (tag === "christian") return { bg: "var(--color-accent-secondary-muted)", border: "var(--color-border-strong)", color: "var(--color-accent-secondary)" };
  return { bg: "var(--color-surface-soft)", border: "var(--color-border)", color: "var(--color-muted)" };
}

function NovaFestivalRow({ festival, lang }: { festival: PanchangamFestival; lang: Lang }) {
  return (
    <Card variant="accent" compact style={{ flexDirection: "row", alignItems: "center", gap: "var(--space-3)" }}>
      <span aria-hidden="true" style={{ color: "var(--color-accent-strong)" }}>{festivalIcon(festival.name)}</span>
      <span style={{ fontSize: "var(--text-base)", fontWeight: 600, flex: 1, color: "var(--color-text-strong)" }}>{festival.name}</span>
      <span style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap", justifyContent: "flex-end" }}>
        {festivalTags(festival).map((tag) => {
          const tone = novaFestivalTagTone(tag);
          return (
            <span key={tag} style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: tone.color, background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: "var(--radius-sm)", padding: "var(--space-1) var(--space-2)", whiteSpace: "nowrap" }}>
              {novaFestivalTagLabel(tag, lang)}
            </span>
          );
        })}
      </span>
    </Card>
  );
}

/**
 * A Nalla Neram / Gowri Nalla Neram summary card.
 *
 * Each window names the Gowri kala it was cut from (Amirtham/Uthi/Labham/…) next
 * to its AM/PM/Day/Night period. Without it the two cards can print adjacent
 * windows with nothing to tell them apart — the reader sees two good times and
 * no reason why they are listed separately. The kala name is what distinguishes
 * them: it says *what kind* of good time this is. What it is good for comes from
 * `gowriPurposeLabel`, printed only where nothing else on the surface carries it
 * — see `showPurpose`.
 */
/**
 * A festival as a chip for the day-header row, beside Valarpirai and the nokku.
 *
 * "Is today anything?" is the first question a panchangam answers, and it was
 * being answered eight sections down the card, below the kalams and the
 * chandrashtamam — by the time a reader reached it they had already decided the
 * day was ordinary. Up here it lands with the fortnight, where it is read.
 * Tag tone carries the tradition (Hindu / Muslim / Christian / govt); world
 * observances fall through to the muted tone, which is the ranking we want.
 */
function NovaFestivalChip({ festival, lang }: { festival: PanchangamFestival; lang: Lang }) {
  const tags = festivalTags(festival);
  const tone = novaFestivalTagTone(tags[0] ?? "");
  const tagNames = tags.map((tag) => novaFestivalTagLabel(tag, lang)).join(" · ");
  return (
    <span
      title={tagNames || undefined}
      style={{
        display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
        fontSize: "var(--text-sm)", fontWeight: 600, color: tone.color,
        background: tone.bg, border: `1px solid ${tone.border}`,
        borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)",
      }}
    >
      <span aria-hidden="true">{festivalIcon(festival.name)}</span>
      {festival.name}
    </span>
  );
}

function NovaAuspiciousCard({
  title,
  slots,
  lang,
  showPurpose = true,
}: {
  title: string;
  slots: PanchangamDailyResponseData["kalam"]["nallaNeram"];
  lang: Lang;
  /**
   * Whether each window carries its "good for X" line. Off on the full day view,
   * where the Gowri detail grid a few sections below already prints the purpose
   * for every one of the day's kalas — repeating it here makes the Auspicious
   * section a wall of prose when it is meant to be read as a list of times. On
   * in the month drawer, which has no detail grid to fall back to.
   */
  showPurpose?: boolean;
}) {
  if (!slots || slots.length === 0) return null;
  // The purpose line belongs to the kala, not the window, so print it once per
  // kala: two windows of the same kala repeating "best overall — any important
  // activity" directly under itself reads as a rendering fault. This used to hit
  // on most days, when both Gowri windows were Amirtham; since the night window
  // became the earliest good kala rather than the best-ranked one (panchangam.py
  // v39) the two coincide far less often, but a shared kala is still reachable.
  const purposeShownFor = new Set<string>();
  return (
    <Card variant="high" compact>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)" }}>{title}</div>
      {slots.map((slot, idx) => {
        const category = gowriCategoryLabel(slot.name, lang);
        const quality = gowriQualityLabel(slot.name, lang);
        const kalaKey = String(slot.name ?? "");
        const purpose = !showPurpose || purposeShownFor.has(kalaKey) ? "" : gowriPurposeLabel(slot.name, lang);
        if (purpose) purposeShownFor.add(kalaKey);
        return (
          <div key={`${slot.period ?? "slot"}-${slot.start}-${idx}`} style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
              <span style={{ minWidth: 0 }}>
                {gowriPeriodLabel(slot.period, lang) || `#${idx + 1}`}
                {category && (
                  <>
                    <span aria-hidden="true" style={{ color: "var(--color-faint)" }}> · </span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-strong)" }}>{category}</span>
                    {quality && <span style={{ color: "var(--color-high)", fontWeight: 600 }}> · {quality}</span>}
                  </>
                )}
              </span>
              <span style={{ fontWeight: 600, color: "var(--color-high)", whiteSpace: "nowrap" }}>{formatClockLabel(slot.start)} – {formatClockLabel(slot.end)}</span>
            </div>
            {purpose && (
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.35 }}>{purpose}</div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

/**
 * The three inauspicious kalams as one three-up row rather than three stacked
 * rows. They are the same *kind* of fact measured three ways, all of one day, so
 * a reader compares them against each other and against the clock — a vertical
 * list makes that a scan of three separate cards; side by side it is one glance.
 * Collapses to two columns and then one on narrow surfaces (the day drawer).
 *
 * `nowMinutes` is optional: only the live "today" view knows a running window,
 * and the month drawer (any date) must not claim one is running.
 */
function NovaAvoidStrip({
  kalam,
  lang,
  nowMinutes,
}: {
  kalam: PanchangamDailyResponseData["kalam"];
  lang: Lang;
  nowMinutes?: number;
}) {
  // Dot colour + opacity deliberately mirror DAY_TIMELINE_BAND_STYLE's
  // avoid-strong / avoid / avoid-soft ramp, because the timeline paints these
  // same three windows a few pixels above this strip. Two severity ramps
  // disagreeing on one card is worse than having none.
  const entries = [
    { key: "rahu", label: t("label_rahu_kalam", lang), slot: kalam.rahuKalam, dot: "var(--color-score-low)", dotOpacity: 0.9 },
    { key: "yama", label: t("label_yamagandam", lang), slot: kalam.yamagandam, dot: "var(--color-score-mid)", dotOpacity: 0.88 },
    { key: "kuligai", label: t("label_kuligai", lang), slot: kalam.kuligai, dot: "var(--color-score-mid)", dotOpacity: 0.45 },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--space-2)" }}>
      {entries.map((entry) => {
        const start = parseHmToMinutes(entry.slot.start);
        const end = parseHmToMinutes(entry.slot.end);
        const running = nowMinutes !== undefined && nowMinutes >= start && nowMinutes < end;
        return (
          <Card
            key={entry.key}
            variant="low"
            compact
            style={{ gap: "3px", minWidth: 0, borderColor: running ? "var(--color-low)" : undefined }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-strong)", minWidth: 0 }}>
              <span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "var(--radius-pill)", background: entry.dot, opacity: entry.dotOpacity, flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.label}</span>
            </span>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-low)" }}>
              {formatClockLabel(entry.slot.start)} – {formatClockLabel(entry.slot.end)}
            </span>
            {running && (
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-low)" }}>
                {lang === "ta" ? "இப்போது நடப்பில்" : "Running now"}
              </span>
            )}
          </Card>
        );
      })}
    </div>
  );
}

type GowriSlot = NonNullable<PanchangamDailyResponseData["kalam"]["gowriPanchangam"]>[number];
type GowriAvoidSlot = { label: string; start: string; end: string };

// Day/month only ("18 Jul") — this stamp sits inside a dense time cell and only
// ever marks tomorrow, so the year would be noise.
function shortDayMonth(isoDate: string, lang: Lang): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short" });
}

function gowriEdgeLabel(hm: string, dayOffset: number, dateLocal: string, lang: Lang): string {
  const clock = formatClockLabel(hm);
  if (dayOffset <= 0) return clock;
  const stamp = shortDayMonth(addDays(dateLocal, dayOffset), lang);
  return stamp ? `${clock}, ${stamp}` : clock;
}

/**
 * One kala row: name + verdict on the left, its window on the right, with the
 * reason underneath. Mirrors the row-per-kala shape printed almanacs use.
 */
function NovaGowriKalaRow({
  slot,
  offset,
  avoidSlots,
  dateLocal,
  lang,
  running,
}: {
  slot: GowriSlot;
  offset: GowriSlotDayOffset;
  avoidSlots: GowriAvoidSlot[];
  dateLocal: string;
  lang: Lang;
  running: boolean;
}) {
  const overlapping = avoidSlots.filter((avoid) => timeWindowsOverlap(slot, avoid));
  const isInauspiciousKala = slot.isGood === false;
  const isBad = isInauspiciousKala || overlapping.length > 0;
  const isBest = !isBad && gowriCategoryRank(slot.name) === 1;
  const category = gowriCategoryLabel(slot.name, lang);
  const quality = isBad && !isInauspiciousKala ? (lang === "ta" ? "தவிர்க்கவும்" : "Avoid") : gowriQualityLabel(slot.name, lang);
  const purpose = gowriPurposeLabel(slot.name, lang);

  const tone = isBad
    ? { bg: "var(--color-low-bg)", border: "var(--color-low-border)", color: "var(--color-low)" }
    : { bg: "var(--color-high-bg)", border: "var(--color-high-border)", color: "var(--color-high)" };

  // Explain every red row: an inauspicious kala carries its own caution, an
  // otherwise-good kala that lands in Rahu/Yama/Kuligai carries the clash.
  const reasons: string[] = [];
  if (isInauspiciousKala) {
    reasons.push(gowriCautionLabel(slot.name, lang) || (lang === "ta" ? "தீய கலம்" : "Inauspicious kala"));
  }
  if (overlapping.length > 0) {
    const names = overlapping.map((o) => o.label).join(", ");
    reasons.push(lang === "ta" ? `${names} உடன் மோதுகிறது — தவிர்க்கவும்` : `Coincides with ${names} — avoid`);
  }

  return (
    <div
      style={{
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${isBest ? "var(--color-high)" : tone.border}`,
        background: tone.bg,
        padding: "var(--space-2) var(--space-3)",
        minWidth: 0,
        outline: running ? "2px solid var(--color-accent)" : "none",
        outlineOffset: "1px",
        boxShadow: running ? "0 0 0 4px var(--color-accent-muted)" : "none",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "var(--space-2)", alignItems: "baseline" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {category || `${lang === "ta" ? "கலம்" : "Kala"} ${slot.slot}`}
          {quality && <span style={{ fontWeight: 600, color: tone.color }}> · {quality}</span>}
          {running && (
            <span style={{ marginLeft: "var(--space-2)", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "var(--text-xs)", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-accent-strong)" }}>
              <span aria-hidden="true" className="nova-pulse-dot" style={{ width: "6px", height: "6px", borderRadius: "var(--radius-pill)", background: "var(--color-accent)", flex: "none" }} />
              {lang === "ta" ? "இப்போது" : "Now"}
            </span>
          )}
        </span>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap" }}>
          {gowriEdgeLabel(slot.start, offset.startOffset, dateLocal, lang)} – {gowriEdgeLabel(slot.end, offset.endOffset, dateLocal, lang)}
        </span>
      </div>
      {purpose && !isBad && (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: "2px", lineHeight: 1.35 }}>{purpose}</div>
      )}
      {reasons.length > 0 && (
        <div style={{ fontSize: "var(--text-xs)", color: tone.color, marginTop: "2px", fontWeight: 700, lineHeight: 1.35 }}>
          {reasons.join(" · ")}
        </div>
      )}
    </div>
  );
}

/** One of the two halves of the Gowri grid: 8 kalas anchored at sunrise or sunset. */
function NovaGowriKalaColumn({
  slots,
  anchorHm,
  anchorLabel,
  title,
  icon,
  avoidSlots,
  dateLocal,
  lang,
  nowMs,
  timeZone,
  isToday,
}: {
  slots: GowriSlot[];
  anchorHm: string;
  anchorLabel: string;
  title: string;
  icon: string;
  avoidSlots: GowriAvoidSlot[];
  dateLocal: string;
  lang: Lang;
  nowMs: number;
  timeZone?: string | null;
  isToday: boolean;
}) {
  if (slots.length === 0) return null;
  const offsets = gowriSlotDayOffsets(slots, anchorHm);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", minWidth: 0 }}>
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-2)",
          paddingRight: "var(--space-1)", paddingBottom: "var(--space-1)", paddingLeft: "var(--space-1)", borderBottom: "1px solid var(--color-border)",
        }}
      >
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-strong)" }}>
          <span aria-hidden="true" style={{ marginRight: "5px" }}>{icon}</span>
          {title}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", whiteSpace: "nowrap" }}>
          {anchorLabel} {formatClockLabel(anchorHm)}
        </span>
      </div>
      {slots.map((slot, idx) => (
        (() => {
          const offset = offsets[idx] ?? { startOffset: 0, endOffset: 0 };
          const startMs = timeOnDateToMs(addDays(dateLocal, offset.startOffset), slot.start, timeZone);
          const endMs = timeOnDateToMs(addDays(dateLocal, offset.endOffset), slot.end, timeZone);
          const running = isToday && startMs !== null && endMs !== null && nowMs >= startMs && nowMs < endMs;
          return (
            <NovaGowriKalaRow
              key={`${slot.period ?? "slot"}-${slot.name ?? slot.slot}-${idx}`}
              slot={slot}
              offset={offset}
              avoidSlots={avoidSlots}
              dateLocal={dateLocal}
              lang={lang}
              running={running}
            />
          );
        })()
      ))}
    </div>
  );
}

/**
 * The 16 Gowri kalas, split the way the panchangam day is actually built:
 * sunrise->sunset in one column, sunset->next sunrise in the other, each anchored
 * by the boundary it starts from. A single flat grid of 16 cards hid that
 * structure — the day/night break landed wherever the columns happened to wrap,
 * and night times past midnight read as this morning.
 */
function NovaGowriDetailGrid({
  slots,
  avoidSlots,
  sunrise,
  sunset,
  dateLocal,
  lang,
  nowMs,
  timeZone,
  isToday,
}: {
  slots: NonNullable<PanchangamDailyResponseData["kalam"]["gowriPanchangam"]>;
  avoidSlots: GowriAvoidSlot[];
  sunrise: string;
  sunset: string;
  dateLocal: string;
  lang: Lang;
  nowMs: number;
  timeZone?: string | null;
  isToday: boolean;
}) {
  if (slots.length === 0) return null;
  const daySlots = slots.filter((slot) => slot.period === "DAY");
  const nightSlots = slots.filter((slot) => slot.period === "NIGHT");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <Kicker as="div">
        {t("gowri_panchangam_details", lang)}
      </Kicker>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.4 }}>
        {lang === "ta"
          ? "சிவப்பு = தீய கலம் (ரோகம்/சோரம்/விஷம்) அல்லது ராகு காலம்/யமகண்டம்/குளிகையுடன் மோதும் நேரம் — காரணம் ஒவ்வொரு வரிசையிலும். பஞ்சாங்க நாள் சூர்யோதயத்தில் தொடங்குகிறது; நள்ளிரவுக்குப் பிந்தைய நேரங்களுடன் அடுத்த நாள் தேதி குறிக்கப்பட்டுள்ளது."
          : "Red = an inauspicious kala (Rogam/Soram/Visham) or one that coincides with Rahu Kalam/Yamagandam/Kuligai — the reason is shown on each row. The panchangam day starts at sunrise; times past midnight are stamped with the next day's date."}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
        <NovaGowriKalaColumn
          slots={daySlots}
          anchorHm={sunrise}
          anchorLabel={lang === "ta" ? "சூர்யோதயம்" : "Sunrise"}
          title={lang === "ta" ? "பகல் முகூர்த்தம்" : "Day Muhurtham"}
          icon="☀"
          avoidSlots={avoidSlots}
          dateLocal={dateLocal}
          lang={lang}
          nowMs={nowMs}
          timeZone={timeZone}
          isToday={isToday}
        />
        <NovaGowriKalaColumn
          slots={nightSlots}
          anchorHm={sunset}
          anchorLabel={lang === "ta" ? "சூர்யாஸ்தமனம்" : "Sunset"}
          title={lang === "ta" ? "இரவு முகூர்த்தம்" : "Night Muhurtham"}
          icon="☾"
          avoidSlots={avoidSlots}
          dateLocal={dateLocal}
          lang={lang}
          nowMs={nowMs}
          timeZone={timeZone}
          isToday={isToday}
        />
      </div>
    </div>
  );
}

function NovaHoraRow({
  hora,
  lang,
  nowMinutes,
}: {
  hora: PanchangamDailyResponseData["hora"][number];
  lang: Lang;
  nowMinutes: number;
}) {
  const start = parseHmToMinutes(hora.start);
  const end = parseHmToMinutes(hora.end);
  const running = nowMinutes >= start && nowMinutes < end;
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running || !rowRef.current) return;
    const container = rowRef.current.parentElement;
    if (!container) return;
    const rowTop = rowRef.current.offsetTop;
    const rowBottom = rowTop + rowRef.current.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    if (rowTop < visibleTop) { container.scrollTop = rowTop; return; }
    if (rowBottom > visibleBottom) container.scrollTop = rowBottom - container.clientHeight;
  }, [running]);

  return (
    <div
      ref={rowRef}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)",
        background: running ? "var(--color-accent-muted)" : "transparent",
        border: running ? "1px solid var(--color-border-strong)" : "1px solid transparent",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: running ? 700 : 500, color: running ? "var(--color-text-strong)" : "var(--color-text)" }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "var(--radius-pill)", background: DASHA_COLORS[hora.lord.toUpperCase()] ?? "var(--color-faint)", flexShrink: 0 }} />
        {tPlanetLord(hora.lord, lang)} {t("hora_word", lang)}
      </span>
      <span style={{ fontSize: "var(--text-sm)", color: running ? "var(--color-accent-strong)" : "var(--color-faint)", fontWeight: running ? 600 : 500 }}>
        {formatClockLabel(hora.start)} – {formatClockLabel(hora.end)}
      </span>
    </div>
  );
}

/**
 * Nova version of Classic's `DayDetailDrawer` (the month-grid day-click
 * preview). Classic's version pulls in `AuspiciousSlotGroup` and inline
 * "avoid" rows that read Classic-only literal-hex warm-tint/chart tokens —
 * reusing it verbatim would put cream-tinted badges
 * on a dark drawer panel. Rebuilt with the same Nova cards already defined
 * above (NovaAuspiciousCard/NovaAvoidRow/NovaFestivalRow) instead; the
 * underlying data/fields are identical to Classic's drawer.
 */
function DayDetailDrawerNova({
  date,
  data,
  loading,
  error,
  lang,
  onClose,
  onOpenFull,
}: {
  date: string;
  data: PanchangamDailyResponseData | null;
  loading: boolean;
  error: string | null;
  lang: Lang;
  onClose: () => void;
  onOpenFull: () => void;
}) {
  const headerDate = formatHeaderDate(date, lang);
  const tamilDate = resolveTamilDate(data?.tamilDate, date, lang);
  const hijri = formatHijriDate(date);
  const hijriLabel = hijri ? (lang === "ta" ? hijri.ta : hijri.en) : "";
  const tithiPaksha = data ? `${data.tithi.paksha === "SHUKLA" ? t("paksha_shukla", lang) : t("paksha_krishna", lang)} ${data.tithi.number}` : "";

  return (
    <DrawerPanel title={`${headerDate}${tamilDate ? ` · ${tamilDate}` : ""}${hijriLabel ? ` · ${hijriLabel}` : ""}`} onClose={onClose}>
      {loading && <p style={{ fontSize: "var(--text-base)", color: "var(--color-muted)" }}>{t("cal_monthly_loading", lang)}</p>}
      {error && !loading && <p className="empty-state">{error}</p>}
      {data && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: "var(--text-base)", color: "var(--color-text)" }}>
              {tWeekday(data.vara.weekday, lang)} · {tithiPaksha} · {tNakshatra(data.nakshatra.name, lang)}
            </p>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
              {lang === "ta" ? "சூர்யோதயம்" : "Sunrise"} {formatClockLabel(data.sunrise)} · {lang === "ta" ? "சூர்யாஸ்தமனம்" : "Sunset"} {formatClockLabel(data.sunset)}
            </p>
            {data.specialTithiDay && (
              <div style={{ marginTop: "8px" }}>
                <LunarTithiBadge value={data.specialTithiDay.name} lang={lang} />
              </div>
            )}
          </div>

          {(data.kalam.nallaNeram?.length ?? 0) > 0 && (
            <NovaAuspiciousCard title={t("title_recommended_nalla_neram", lang)} slots={data.kalam.nallaNeram ?? []} lang={lang} />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <Kicker as="p" color="var(--color-low)" style={{ margin: 0, letterSpacing: "0.14em" }}>
              {lang === "ta" ? "தவிர்க்க வேண்டிய நேரம்" : "Avoid"}
            </Kicker>
            <NovaAvoidStrip kalam={data.kalam} lang={lang} />
          </div>

          {data.festivals.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <Kicker as="p" style={{ margin: 0, letterSpacing: "0.14em" }}>
                {t("label_festivals", lang)}
              </Kicker>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {data.festivals.map((f) => <NovaFestivalRow key={f.name} festival={f} lang={lang} />)}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenFull}
            style={{ alignSelf: "flex-start", padding: "var(--space-3) var(--space-5)", borderRadius: "var(--radius-pill)", border: "1px solid var(--color-border-strong)", background: "none", color: "var(--color-accent-strong)", fontSize: "var(--text-base)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            {lang === "ta" ? "முழு நாள் விவரம்" : "Open full day view"}
          </button>
        </div>
      )}
    </DrawerPanel>
  );
}

export function DashboardCalendarTabNova({
  selectedDate,
  todayDate,
  panchangam: defaultPanchangam,
  lang,
  locationLabel,
  panchangamTimezone,
  onSelectDate,
  chartId = null,
  memberCharts = [],
  selectedMemberId = null,
  onSelectMember,
  focusView = null,
  onFocusConsumed,
}: DashboardCalendarTabNovaProps) {
  const CALENDAR_VIEWS: CalendarViewExt[] = ["panchangam", "monthly", "muhurta"];
  const [view, setView] = useState<CalendarViewExt>(
    focusView && (CALENDAR_VIEWS as string[]).includes(focusView) ? (focusView as CalendarViewExt) : "panchangam",
  );
  useEffect(() => {
    if (focusView && (CALENDAR_VIEWS as string[]).includes(focusView)) {
      setView(focusView as CalendarViewExt);
      onFocusConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusView]);

  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<PanchangamDailyResponseData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const selectedDateObj = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);
  const [monthlyYear, setMonthlyYear] = useState(() => selectedDateObj.getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(() => selectedDateObj.getMonth() + 1);
  const { monthlyPanchangam, isMonthlyPanchangamLoading, monthlyPanchangamError, fetchMonthlyPanchangam } = useMonthlyPanchangam();

  const [overrideLocation, setOverrideLocation] = useState<{ lat: number; lng: number; timezone: string; label: string } | null>(null);
  const [overridePanchangam, setOverridePanchangam] = useState<PanchangamDailyResponseData | null>(null);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const panchangam = overridePanchangam ?? defaultPanchangam;
  const activePanchangamTimezone = overrideLocation?.timezone ?? panchangamTimezone;
  const monthlyLocation = panchangam?.location ?? null;

  useEffect(() => {
    if (selectedDate !== todayDate) return;
    const untilNextMinute = 60_000 - (Date.now() % 60_000);
    let intervalId: number | null = null;
    const timeoutId = window.setTimeout(() => {
      setNowMs(Date.now());
      intervalId = window.setInterval(() => setNowMs(Date.now()), 60_000);
    }, untilNextMinute);
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [selectedDate, todayDate]);

  useEffect(() => {
    if (view !== "monthly" || !monthlyLocation) return;
    fetchMonthlyPanchangam(monthlyYear, monthlyMonth, monthlyLocation);
  }, [view, monthlyYear, monthlyMonth, monthlyLocation, fetchMonthlyPanchangam]);

  useEffect(() => {
    if (!detailDate) return;
    if (detailDate === selectedDate && panchangam) {
      setDetailData(panchangam);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }
    if (!monthlyLocation) {
      setDetailError(t("panja_empty", lang));
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);
    const params = new URLSearchParams({
      date: detailDate,
      lat: String(monthlyLocation.lat),
      lng: String(monthlyLocation.lng),
      timezone: monthlyLocation.timezone,
    });
    apiFetchJson<{ data: PanchangamDailyResponseData }>(`/api/v1/panchangam/daily?${params.toString()}`, { signal: controller.signal })
      .then((res) => setDetailData(res.data))
      .catch((err) => { if (!controller.signal.aborted) setDetailError(readErrorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [detailDate, selectedDate, panchangam, monthlyLocation, lang]);

  useEffect(() => {
    if (!overrideLocation) { setOverrideLoading(false); return; }
    const controller = new AbortController();
    setOverrideLoading(true);
    setOverridePanchangam(null);
    const params = new URLSearchParams({
      date: selectedDate,
      lat: String(overrideLocation.lat),
      lng: String(overrideLocation.lng),
      timezone: overrideLocation.timezone,
    });
    apiFetchJson<{ data: PanchangamDailyResponseData }>(`/api/v1/panchangam/daily?${params.toString()}`, { signal: controller.signal })
      .then((res) => setOverridePanchangam(res.data))
      .catch((err) => { if (!controller.signal.aborted) console.error("Location override fetch:", readErrorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setOverrideLoading(false); });
    return () => controller.abort();
  }, [overrideLocation, selectedDate]);

  const goToAdjacentMonth = (delta: number) => {
    const next = new Date(monthlyYear, monthlyMonth - 1 + delta, 1);
    setMonthlyYear(next.getFullYear());
    setMonthlyMonth(next.getMonth() + 1);
  };

  // Quick Jump: "This Month" returns the grid to the current month; "Today"
  // additionally opens today's day-detail drawer for a quick peek. The grid
  // already rings today/selected, so navigation is all "This Month" needs.
  const handleQuickJump = useCallback((target: "today" | "thisMonth") => {
    const todayObj = new Date(`${todayDate}T00:00:00`);
    setMonthlyYear(todayObj.getFullYear());
    setMonthlyMonth(todayObj.getMonth() + 1);
    if (target === "today") setDetailDate(todayDate);
  }, [todayDate]);

  // Quick Jump: "Next Muhurtham" scans forward from today's month, fetching one
  // month at a time (the monthly grid only ever holds a single month), until it
  // finds the first Tamil muhurtham day after today, then navigates there and
  // opens its drawer. Capped at 12 months so a data gap can't loop forever.
  const jumpToNextMuhurtham = useCallback(async (): Promise<boolean> => {
    if (!monthlyLocation) return false;
    const todayObj = new Date(`${todayDate}T00:00:00`);
    let year = todayObj.getFullYear();
    let month = todayObj.getMonth() + 1;
    for (let i = 0; i < 12; i += 1) {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
        lat: String(monthlyLocation.lat),
        lng: String(monthlyLocation.lng),
        timezone: monthlyLocation.timezone,
      });
      try {
        const res = await apiFetchJson<{ data: PanchangamMonthlyData }>(`/api/v1/panchangam/monthly?${params.toString()}`);
        const hit = (res.data.entries ?? []).find((entry) => entry.isTamilMuhurthamDay && entry.dateLocal > todayDate);
        if (hit) {
          setMonthlyYear(year);
          setMonthlyMonth(month);
          setDetailDate(hit.dateLocal);
          return true;
        }
      } catch {
        // A single failed month shouldn't abort the scan — keep looking ahead.
      }
      const next = new Date(year, month, 1); // month is 1-based -> first of the *next* month
      year = next.getFullYear();
      month = next.getMonth() + 1;
    }
    return false;
  }, [monthlyLocation, todayDate]);

  const headerDate = formatHeaderDate(selectedDate, lang);
  const tamilHeaderDate = resolveTamilDate(panchangam?.tamilDate, selectedDate, lang);
  const hijriHeaderDate = formatHijriDate(selectedDate);
  const currentNow = new Date(nowMs);
  const currentNowMinutes = selectedDate === todayDate ? currentNow.getHours() * 60 + currentNow.getMinutes() : -1;
  const currentNowIso = selectedDate === todayDate ? currentNow.toISOString() : undefined;

  const tithiActive = panchangam ? activeLimb(panchangam.tithi.name, panchangam.tithi.endsAt, panchangam.tithi.nextName, currentNowMinutes, panchangam.tithi.endsAtIso, currentNowIso) : null;
  const nakActive = panchangam ? activeLimb(panchangam.nakshatra.name, panchangam.nakshatra.endsAt, panchangam.nakshatra.nextName, currentNowMinutes, panchangam.nakshatra.endsAtIso, currentNowIso) : null;
  // Issue #9: yoga & karana were static (sunrise value only, hint "Yoga N" / "—")
  // so they never advanced after their boundary. Give them the same live promotion
  // + "until HH:MM · then next" treatment as tithi/nakshatra.
  const yogaActive = panchangam ? activeLimb(panchangam.yoga.name, panchangam.yoga.endsAt, panchangam.yoga.nextName, currentNowMinutes, panchangam.yoga.endsAtIso, currentNowIso) : null;
  const karanaActive = panchangam ? activeLimb(panchangam.karana.name, panchangam.karana.endsAt, panchangam.karana.nextName, currentNowMinutes, panchangam.karana.endsAtIso, currentNowIso) : null;

  const tithiPaksha = panchangam
    ? `${panchangam.tithi.paksha === "SHUKLA" ? t("paksha_shukla", lang) : t("paksha_krishna", lang)} ${panchangam.tithi.number}`
    : null;

  const panchangamMeta = panchangam
    ? `${tWeekday(panchangam.vara.weekday, lang)} · ${tithiPaksha ?? ""} · ${tNakshatra(nakActive?.activeName ?? panchangam.nakshatra.name, lang)}`
    : t("panja_empty", lang);

  // Fortnight + moon shape, matching the Today hero's chip (same lunar helpers,
  // same Amavasai/Pournami override) so the two surfaces cannot disagree.
  const isWaxing = panchangam?.tithi.paksha === "SHUKLA";
  const moonPhase = panchangam ? moonPhaseFromTithi(panchangam.tithi.number, panchangam.tithi.paksha) : null;
  const specialTithiMeta = lunarSpecialTithiMeta(panchangam?.specialTithiDay?.name, lang);
  // Nokku follows the nakshatra currently in effect and changes at its boundary.
  const nokku = nokkuMeta(nakActive?.activeName ?? panchangam?.nakshatra.name, lang);

  const bestNallaSlot = bestGowriSlot(panchangam?.kalam.nallaNeram);

  const fallbackMoonRasi = panchangam ? moonRasiFromNakshatra(panchangam.nakshatra.name, panchangam.nakshatra.pada) : 0;
  const moonRasi = panchangam?.chandrashtamamToday.moonRasiNumber || fallbackMoonRasi;
  const chandrashtama = panchangam?.chandrashtamamToday.affectedJanmaRasiNumber || chandrashtamaAffectedNatalRasi(moonRasi);
  const moonRasiName = moonRasi ? rasiName(moonRasi, lang) : "";
  const chandraName = chandrashtama ? rasiName(chandrashtama, lang) : "";
  const chandraNakshatraWindows = panchangam?.chandrashtamamToday.janmaNakshatraWindows ?? [];
  const chandraNakshatraWindowSummary = panchangam ? formatChandrashtamaWindowSummary(chandraNakshatraWindows, panchangam.dateLocal, lang) : "";
  const todayMoonNakshatra = panchangam ? panchangam.nakshatra.name : "";
  const observanceFestivals = panchangam?.festivals.filter((f) => festivalTags(f).includes("observance")) ?? [];
  const dailyFestivalEvents = panchangam?.festivals.filter((f) => !festivalTags(f).includes("observance")) ?? [];

  // The festival name used to lead this line. It now leads the day-header chip
  // row instead, and repeating it here — inside the same card, a few hundred
  // pixels down — spent the "significance" slot restating a fact the reader has
  // already had, in place of the muhurtham reason it was hiding.
  const significanceText = useMemo(() => {
    if (!panchangam) return "";
    return panchangam.subhaMuhurtham?.reason || (lang === "ta" ? "இன்று அமைதியாக முன்னேறுங்கள்." : "Move steadily and keep the day intentional.");
  }, [panchangam, lang]);

  // Reading order is the astrologer's, not the textbook's: the day's fixed
  // identity first (Vara / Moon / Lagnam), then the moving limbs a reader checks
  // for timing (Nakshatra / Tithi / Naamyogam / Amirdhadhi Yogam / Karana), then
  // the directional and Nethiram/Jeevan qualifiers.
  const fiveLimbRows = panchangam
    ? [
        { key: lang === "ta" ? "வாரம்" : "Vara", value: tWeekday(panchangam.vara.weekday, lang), hint: `${tPlanetLord(panchangam.vara.lord, lang)} ${t("lord_word", lang)}` },
        { key: lang === "ta" ? "சந்திரன்" : "Moon", value: tMoonPhase(panchangam.moonPhaseLabel, lang), hint: lang === "ta" ? "சந்திர கலை" : "Moon phase" },
        { key: lang === "ta" ? "லக்னம்" : "Lagnam", value: panchangam.lagnam.rasiName, hint: `${lang === "ta" ? "இருப்பு" : "Remaining"} ${panchangam.lagnam.nazhigai} ${lang === "ta" ? "நாழிகை" : "nazhigai"} ${panchangam.lagnam.vinadi} ${lang === "ta" ? "விநாடி" : "vinadi"} · ${formatUntilLabel(panchangam.lagnam.endsAt, panchangam.lagnam.endsAtIso, panchangam.dateLocal, lang)} ${t("until_word", lang)}` },
        {
          key: lang === "ta" ? "நட்சத்திரம்" : "Nakshatra",
          value: tNakshatra(nakActive?.activeName ?? panchangam.nakshatra.name, lang),
          hint: nakActive?.rolledOver
            ? `${formatClockLabel(panchangam.nakshatra.endsAt)} ${lang === "ta" ? "முதல் தற்போது செயலில்" : "active since"}`
            : `${t("label_padam", lang)} ${panchangam.nakshatra.pada} · ${formatUntilLabel(panchangam.nakshatra.endsAt, panchangam.nakshatra.endsAtIso, panchangam.dateLocal, lang)} ${t("until_word", lang)} · ${lang === "ta" ? "பின்பு" : "then"} ${tNakshatra(panchangam.nakshatra.nextName, lang)}`,
        },
        {
          key: lang === "ta" ? "திதி" : "Tithi",
          value: tTithi(tithiActive?.activeName ?? panchangam.tithi.name, lang),
          hint: tithiActive?.rolledOver
            ? `${formatClockLabel(panchangam.tithi.endsAt)} ${lang === "ta" ? "முதல் தற்போது செயலில்" : "active since"}`
            : `${tithiPaksha ?? ""} · ${formatUntilLabel(panchangam.tithi.endsAt, panchangam.tithi.endsAtIso, panchangam.dateLocal, lang)} ${t("until_word", lang)} · ${lang === "ta" ? "பின்பு" : "then"} ${tTithi(panchangam.tithi.nextName, lang)}`,
        },
        {
          // The 27 nithya yogas, named Naamyogam here to keep them clearly apart
          // from the Amirdhadhi Yogam row directly below — two different "yogam"
          // systems sitting adjacent read as one repeated field otherwise.
          key: lang === "ta" ? "நாம யோகம்" : "Naamyogam",
          value: tYoga(yogaActive?.activeName ?? panchangam.yoga.name, lang),
          hint: yogaActive?.rolledOver
            ? `${formatClockLabel(panchangam.yoga.endsAt)} ${lang === "ta" ? "முதல் தற்போது செயலில்" : "active since"}`
            : `${formatUntilLabel(panchangam.yoga.endsAt, panchangam.yoga.endsAtIso, panchangam.dateLocal, lang)} ${t("until_word", lang)} · ${lang === "ta" ? "பின்பு" : "then"} ${tYoga(panchangam.yoga.nextName, lang)}`,
        },
        { key: lang === "ta" ? "அமிர்தாதி யோகம்" : "Amirdhadhi Yogam", value: tAmirdhadhiYogam(panchangam.amirdhadhiYogam.name, lang), hint: `${formatUntilLabel(panchangam.amirdhadhiYogam.endsAt, panchangam.amirdhadhiYogam.endsAtIso, panchangam.dateLocal, lang)} ${t("until_word", lang)} · ${lang === "ta" ? "பின்பு" : "then"} ${tAmirdhadhiYogam(panchangam.amirdhadhiYogam.nextName, lang)}` },
        {
          key: lang === "ta" ? "கரணம்" : "Karana",
          value: tKarana(karanaActive?.activeName ?? panchangam.karana.name, lang),
          hint: karanaActive?.rolledOver
            ? `${formatClockLabel(panchangam.karana.endsAt)} ${lang === "ta" ? "முதல் தற்போது செயலில்" : "active since"}`
            : `${formatUntilLabel(panchangam.karana.endsAt, panchangam.karana.endsAtIso, panchangam.dateLocal, lang)} ${t("until_word", lang)} · ${lang === "ta" ? "பின்பு" : "then"} ${tKarana(panchangam.karana.nextName, lang)}`,
        },
        { key: lang === "ta" ? "சூலம்" : "Soolam", value: tSoolamDirection(panchangam.soolam.direction, lang), hint: `${lang === "ta" ? "பரிகாரம்" : "Parigaram"}: ${tParigaram(panchangam.soolam.parigaram, lang)}` },
        { key: lang === "ta" ? "நேத்திரம்" : "Nethiram", value: tNethiram(panchangam.nethiram, lang), hint: t("nethiram_jeevan_hint", lang) },
        { key: lang === "ta" ? "ஜீவன்" : "Jeevan", value: tJeevan(panchangam.jeevan, lang), hint: t("nethiram_jeevan_hint", lang) },
      ]
    : [];

  const avoidSlotsForOverlap = panchangam
    ? [
        { label: t("label_rahu_kalam", lang), start: panchangam.kalam.rahuKalam.start, end: panchangam.kalam.rahuKalam.end },
        { label: t("label_yamagandam", lang), start: panchangam.kalam.yamagandam.start, end: panchangam.kalam.yamagandam.end },
        { label: t("label_kuligai", lang), start: panchangam.kalam.kuligai.start, end: panchangam.kalam.kuligai.end },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {/* ===== Page header ===== */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div>
          <Kicker as="div">
            {lang === "ta" ? "கிரகநகர்வு & நிகழ்வுகள்" : "Transits & Events"}
          </Kicker>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", marginTop: "6px", flexWrap: "wrap" }}>
            {/* audit B-1: the date is the Calendar page's sole page heading
                (was a styled div; the tab shipped no headings / no outline). */}
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--display-md)", fontWeight: 600, color: "var(--color-text-strong)", lineHeight: 1.1 }}>
              {headerDate}
            </h1>
            {tamilHeaderDate && (
              <div style={{ fontSize: "var(--text-md)", color: "var(--color-accent-strong)", fontWeight: 600 }}>{tamilHeaderDate}</div>
            )}
            {hijriHeaderDate && (
              <div style={{ fontSize: "var(--text-base)", color: "var(--color-high)", fontWeight: 600 }}>{lang === "ta" ? hijriHeaderDate.ta : hijriHeaderDate.en}</div>
            )}
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", marginTop: "2px" }}>{panchangamMeta}</div>
        </div>

        {/* View switch — the segmented-toggle pattern, now the shared <Segmented>
            (audit A-1/B-7): one nav look across every tab, arrow-key + 44px touch. */}
        <Segmented<CalendarViewExt>
          ariaLabel={lang === "ta" ? "நாட்காட்டி பார்வைகள்" : "Calendar views"}
          value={view}
          onChange={setView}
          options={[
            { key: "panchangam", label: t("cal_panchangam", lang) },
            { key: "monthly", label: t("cal_monthly", lang) },
            { key: "muhurta", label: lang === "ta" ? "சிறந்த நாள் & முஹூர்த்தம்" : "Best Dates & Muhurta" },
          ]}
        />
      </div>

      {view === "panchangam" && (
        !panchangam ? (
          <p className="empty-state">{t("panja_empty", lang)}</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "var(--space-5)", alignItems: "start" }}>
            {/* ===== LEFT: Day at a glance ===== */}
            <Card style={{ borderRadius: "var(--radius-xl)", borderColor: "var(--color-border-strong)", padding: "var(--space-6) var(--space-7)", gap: "var(--space-5)" }}>
              <div>
                <h2 style={{ margin: "0 0 8px", fontSize: "var(--text-xs)", letterSpacing: "0.12em", color: "var(--color-text-accent)", textTransform: "uppercase", fontWeight: 700 }}>
                  {lang === "ta" ? "இன்று — ஒரு பார்வையில்" : "Day at a glance"}
                </h2>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 600, lineHeight: 1.25, color: "var(--color-text-strong)" }}>
                  {tTithi(tithiActive?.activeName ?? panchangam.tithi.name, lang)}. {tNakshatra(nakActive?.activeName ?? panchangam.nakshatra.name, lang)}. {tYoga(yogaActive?.activeName ?? panchangam.yoga.name, lang)}.
                </div>
                {/* Fortnight (with the live moon shape), the day's nokku, and what
                    the day *is* — the things a reader checks before the clock
                    times below. */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "10px", flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-accent-secondary)", fontWeight: 600 }}>
                    {moonPhase ? <MiniMoonGlyph phase={moonPhase} size={15} /> : (isWaxing ? "◐" : "◑")}
                    {specialTithiMeta
                      ? specialTithiMeta.label
                      : isWaxing ? (lang === "ta" ? "வளர்பிறை" : "Valarpirai") : (lang === "ta" ? "தேய்பிறை" : "Theipirai")}
                  </span>
                  {nokku && (
                    <>
                      <span aria-hidden="true" style={{ color: "var(--color-border-strong)" }}>·</span>
                      <span
                        title={nokku.meaning}
                        style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-accent)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}
                      >
                        <span aria-hidden="true" style={{ display: "inline-flex" }}>{nokku.nokku === "URDHVAMUKHA" ? <ArrowUp size={13} strokeWidth={1.5} /> : nokku.nokku === "ADHOMUKHA" ? <ArrowDown size={13} strokeWidth={1.5} /> : <ArrowRight size={13} strokeWidth={1.5} />}</span>
                        {nokku.label}
                      </span>
                    </>
                  )}
                  {/* Festivals first, then world observances — same row, ranked
                      by the tone their tag resolves to. */}
                  {[...dailyFestivalEvents, ...observanceFestivals].map((festival) => (
                    <NovaFestivalChip key={festival.name} festival={festival} lang={lang} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "8px", fontSize: "var(--text-sm)", color: "var(--color-muted)", flexWrap: "wrap" }}>
                  <span>
                    {lang === "ta" ? "சூர்யோதயம்" : "Sunrise"} {formatClockLabel(panchangam.sunrise)} · {lang === "ta" ? "சூர்யாஸ்தமனம்" : "Sunset"} {formatClockLabel(panchangam.sunset)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker((v) => !v)}
                    style={{ border: "1px solid var(--color-border-strong)", background: showLocationPicker ? "var(--color-surface-soft)" : "transparent", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-accent-strong)", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    📍 {overrideLoading ? (lang === "ta" ? "ஏற்றுகிறது…" : "Loading…") : (overrideLocation?.label ?? locationLabel ?? (lang === "ta" ? "இடம்" : "Location"))} ▾
                  </button>
                </div>
                {showLocationPicker && (
                  <div style={{ marginTop: "10px", padding: "var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "var(--text-sm)", color: "var(--color-muted)", fontWeight: 600 }}>
                      {lang === "ta" ? "வேறு இடத்திற்கான பஞ்சாங்கம் காண்க" : "View panchangam for another location"}
                    </p>
                    <PlaceCombobox
                      value={overrideLocation?.label ?? ""}
                      onChange={(city) => {
                        if (city) {
                          setOverrideLocation({ lat: parseFloat(city.lat), lng: parseFloat(city.lng), timezone: city.timezone, label: city.name });
                          setShowLocationPicker(false);
                        }
                      }}
                      placeholder={lang === "ta" ? "நகரம் தேடுங்கள்…" : "Search city…"}
                    />
                    {overrideLocation && (
                      <button
                        type="button"
                        onClick={() => { setOverrideLocation(null); setOverridePanchangam(null); setOverrideLoading(false); setShowLocationPicker(false); }}
                        style={{ marginTop: "8px", display: "block", fontSize: "var(--text-sm)", color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                      >
                        {lang === "ta" ? "↩ பொதுவான இடத்திற்கு திரும்பு" : "↩ Reset to profile location"}
                      </button>
                    )}
                  </div>
                )}
                {panchangam.specialTithiDay && (
                  <div style={{ marginTop: "8px" }}>
                    <LunarTithiBadge value={panchangam.specialTithiDay.name} lang={lang} />
                  </div>
                )}
              </div>

              <DayTimeline
                sunrise={panchangam.sunrise}
                sunset={panchangam.sunset}
                bands={[
                  ...(panchangam.kalam.nallaNeram ?? []).map((slot, i): DayTimelineBand => ({
                    key: `nalla-${i}`,
                    start: slot.start,
                    end: slot.end,
                    kind: bestNallaSlot && slot.start === bestNallaSlot.start && slot.end === bestNallaSlot.end ? "best" : "good",
                    label: t("label_nalla_neram", lang),
                  })),
                  { key: "rahu", start: panchangam.kalam.rahuKalam.start, end: panchangam.kalam.rahuKalam.end, kind: "avoid-strong", label: t("label_rahu_kalam", lang) },
                  { key: "yama", start: panchangam.kalam.yamagandam.start, end: panchangam.kalam.yamagandam.end, kind: "avoid", label: t("label_yamagandam", lang) },
                  { key: "kuligai", start: panchangam.kalam.kuligai.start, end: panchangam.kalam.kuligai.end, kind: "avoid-soft", label: t("label_kuligai", lang) },
                ]}
              />

              {/* ── Auspicious ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <Kicker as="div" color="var(--color-high)">
                  {lang === "ta" ? "நல்ல நேரங்கள்" : "Auspicious"}
                </Kicker>
                {/* showPurpose off: the Gowri detail grid below prints what each
                    kala is good for, so here the section stays a list of times. */}
                <NovaAuspiciousCard title={t("title_recommended_nalla_neram", lang)} slots={panchangam.kalam.nallaNeram ?? []} lang={lang} showPurpose={false} />
                <NovaAuspiciousCard title={t("title_additional_gowri_good_times", lang)} slots={panchangam.kalam.gowriNallaNeram ?? []} lang={lang} showPurpose={false} />
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.4 }}>
                  {t("gowri_summary_hint", lang)}
                </p>
              </div>

              {/* ── Avoid ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <Kicker as="div" color="var(--color-low)">
                  {lang === "ta" ? "தவிர்க்க வேண்டிய நேரம்" : "Avoid"}
                </Kicker>
                {/* currentNowMinutes is -1 on any date but today, so "Running
                    now" can never appear while browsing another day. */}
                <NovaAvoidStrip kalam={panchangam.kalam} lang={lang} nowMinutes={currentNowMinutes} />
              </div>

              {/* ── Today's Nakshatra ── */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <Kicker as="div">
                  {lang === "ta" ? "இன்றைய நட்சத்திரம்" : "Today's Nakshatra"}
                </Kicker>
                <Card variant="accent" compact style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-strong)" }}>
                    {tNakshatra(nakActive?.activeName ?? panchangam.nakshatra.name, lang)}
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
                    {t("label_padam", lang)} {panchangam.nakshatra.pada} · {t("until_word", lang)} {formatUntilLabel(panchangam.nakshatra.endsAt, panchangam.nakshatra.endsAtIso, panchangam.dateLocal, lang)}
                  </span>
                </Card>
              </div>

              {/* ── Chandrashtamam ── */}
              {chandraName && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <Kicker as="div" color="var(--color-low)">
                    {t("label_chandrashtamam", lang)}
                  </Kicker>
                  <Card variant="low" compact>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                      <span style={{ color: "var(--color-muted)" }}>{lang === "ta" ? "பாதிக்கப்படும் ராசி" : "Affected Rasi"}</span>
                      <span style={{ fontWeight: 700, color: "var(--color-text-strong)" }}>{rasiGlyph(chandrashtama)} {chandraName}</span>
                    </div>
                    {chandraNakshatraWindowSummary && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                        <span style={{ color: "var(--color-muted)" }}>{lang === "ta" ? "இன்றைய ஜன்ம நட்சத்திர நேரங்கள்" : "Today's Janma Nakshatra Windows"}</span>
                        <span style={{ color: "var(--color-low)", fontWeight: 600, textAlign: "right", lineHeight: 1.45 }}>{chandraNakshatraWindowSummary}</span>
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55, fontStyle: "italic", borderTop: "1px solid var(--color-low-border)", paddingTop: "8px" }}>
                      {lang === "ta"
                        ? `சந்திரன் இன்று ${todayMoonNakshatra ? tNakshatra(todayMoonNakshatra, lang) + " நட்சத்திரத்தில் " : ""}${moonRasiName} ராசியில் சஞ்சரிக்கிறது. ${chandraName} ஜன்ம ராசி உடையோருக்கு சந்திராஷ்டமம்.${chandraNakshatraWindowSummary ? ` குறிப்பாக ${chandraNakshatraWindowSummary} நேரத்தில் இருக்கும் ஜன்ம நட்சத்திரங்கள் கவனமாக இருக்கவும்.` : ""}`
                        : `Moon transits ${moonRasiName} today${todayMoonNakshatra ? ` (in ${tNakshatra(todayMoonNakshatra, "en")} nakshatra)` : ""}. Natives born with ${chandraName} as their Janma Rasi are in Chandrashtamam.${chandraNakshatraWindowSummary ? ` Specifically, the Janma Nakshatra windows are ${chandraNakshatraWindowSummary}.` : ""}`}
                    </p>
                  </Card>
                </div>
              )}

              {/* Today's Events moved up into the day-header chip row above (as
                  NovaFestivalChip) — a festival is the headline fact about a
                  day, not a footnote under the kalams. Nothing is printed when
                  the day has none: the chip row already carries the fortnight,
                  so an explicit "no festivals" line would only add noise. */}

              {/* ── Gowri Nalla Neram Details ── */}
              <NovaGowriDetailGrid
                slots={panchangam.kalam.gowriPanchangam ?? []}
                avoidSlots={avoidSlotsForOverlap}
                sunrise={panchangam.sunrise}
                sunset={panchangam.sunset}
              dateLocal={panchangam.dateLocal}
              lang={lang}
              nowMs={nowMs}
              timeZone={activePanchangamTimezone}
              isToday={selectedDate === todayDate}
              />

              {/* ── Today's Significance ── */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <Kicker as="div">
                  {lang === "ta" ? "இன்றைய சிறப்பு" : "Today's Significance"}
                </Kicker>
                <Card variant="accent" compact style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                  {significanceText}
                </Card>
              </div>
            </Card>

            {/* ===== RIGHT column ===== */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              <Card style={{ borderRadius: "var(--radius-xl)", borderColor: "var(--color-border-strong)", gap: 0 }}>
                <Kicker as="div" style={{ marginBottom: "12px" }}>
                  {lang === "ta" ? "பஞ்சாங்கம் · ஐந்து அங்கங்கள்" : "Panchangam · Five Limbs"}
                </Kicker>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {fiveLimbRows.map((row) => (
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

                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.5 }}>
                    {lang === "ta"
                      ? "இந்த நேரங்கள் திருக்கணிதம் (எபிமெரிஸ் அடிப்படையிலான வானியல்) முறையில், லாஹிரி அயனாம்சத்தில் கணக்கிடப்படுகின்றன. வாக்கிய முறையைப் பின்பற்றும் உங்கள் ஊர் பஞ்சாங்கம் அல்லது குருவின் கணக்கீட்டில் திதி/நட்சத்திர மாற்ற நேரங்களில் சிறிது வேறுபாடு இருக்கலாம்."
                      : "These times use Drik-ganita (ephemeris-based) astronomy with Lahiri ayanamsa. If your local almanac or purohit follows the traditional Vakya method, tithi/nakshatra boundary times may differ slightly."}
                  </p>
                  <Link href="/trust/methodology#panchangam" target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-accent)", textDecoration: "none" }}>
                    {lang === "ta" ? "எங்கள் கணக்கீட்டு முறையைப் பார்க்க" : "See our calculation methodology"}
                  </Link>
                </div>
              </Card>

              {panchangam.hora.length > 0 && (
                <Card style={{ borderRadius: "var(--radius-xl)", borderColor: "var(--color-border-strong)", gap: 0 }}>
                  <Kicker as="div" style={{ marginBottom: "10px" }}>
                    {lang === "ta" ? "ஹோரை அட்டவணை" : "Hora Table"}
                  </Kicker>
                  {/* Issue #11: pin the currently-running hora to the top so the user
                      never has to scroll the 24-row table to find "now". */}
                  {(() => {
                    const nowHora = panchangam.hora.find((h) => {
                      const s = parseHmToMinutes(h.start);
                      const e = parseHmToMinutes(h.end);
                      return currentNowMinutes >= s && currentNowMinutes < e;
                    });
                    if (!nowHora) return null;
                    return (
                      <Card variant="accent" compact style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "10px", borderColor: "var(--color-accent)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                          <span style={{ fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent-strong)", fontWeight: 800 }}>{lang === "ta" ? "இப்போது" : "Now"}</span>
                          <span style={{ width: "7px", height: "7px", borderRadius: "var(--radius-pill)", background: DASHA_COLORS[nowHora.lord.toUpperCase()] ?? "var(--color-faint)", flexShrink: 0 }} />
                          {tPlanetLord(nowHora.lord, lang)} {t("hora_word", lang)}
                        </span>
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent-strong)" }}>
                          {formatClockLabel(nowHora.start)} – {formatClockLabel(nowHora.end)}
                        </span>
                      </Card>
                    );
                  })()}
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", maxHeight: "330px", overflowY: "auto", paddingRight: "4px" }}>
                    {panchangam.hora.map((h) => (
                      <NovaHoraRow key={h.index} hora={h} lang={lang} nowMinutes={currentNowMinutes} />
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )
      )}

      {view === "muhurta" && (
        chartId ? (
          <>
            {onSelectMember && (
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <Pill active={selectedMemberId === null} onClick={() => onSelectMember(null)}>
                  {lang === "ta" ? "நீங்கள்" : "You"}
                </Pill>
                {memberCharts.map((member) => (
                  <Pill
                    key={member.memberId}
                    active={selectedMemberId === member.memberId}
                    onClick={() => onSelectMember(member.memberId)}
                  >
                    {member.displayName}
                  </Pill>
                ))}
              </div>
            )}
            <NovaPlanMuhurtaPanel lang={lang} chartId={chartId} />
          </>
        ) : (
          <p className="empty-state">
            {lang === "ta"
              ? "தனிப்பயன் முஹூர்த்தம் காண உங்கள் பிறப்பு விவரத்தைச் சேர்க்கவும்."
              : "Add your birth profile to see personalised best dates & muhurtham."}
          </p>
        )
      )}

      {view === "monthly" && (
        <MonthlyCalendarViewNova
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
          onSelectDate={(date) => setDetailDate(date)}
          onQuickJump={handleQuickJump}
          onJumpToNextMuhurtham={jumpToNextMuhurtham}
        />
      )}

      {detailDate && (
        <DayDetailDrawerNova
          date={detailDate}
          data={detailData}
          loading={detailLoading}
          error={detailError}
          lang={lang}
          onClose={() => setDetailDate(null)}
          onOpenFull={() => {
            onSelectDate?.(detailDate);
            setView("panchangam");
            setDetailDate(null);
          }}
        />
      )}
    </div>
  );
}
