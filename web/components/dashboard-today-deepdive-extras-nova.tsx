"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Minus, AlertTriangle, ArrowRight } from "lucide-react";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { formatClockLabel, getScoreBand } from "@/lib/format";
import { t, tLang, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { D1_RASI_NAMES, RASI_LORDS } from "@/lib/chart-utils";
import { RASI_TRAITS } from "@/lib/rasi-traits";
import { ZodiacBadge } from "@/components/zodiac-badge";
import type {
  ActivityTimingData,
  ChartCalculateResponseData,
  ChartSummaryData,
  ChartValidationStatus,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DashaTimelineResponseData,
  PanchangamDailyResponseData,
  PrasnaResponse,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { formatChandrashtamaWindowSummary } from "./dashboard-calendar-shared";
import { DASHA_COLORS } from "./dashboard-dasha";
import { GlossaryTerm } from "./glossary-term";
import { ChandrashtamaCard, GUIDANCE_REASON_KEYS } from "./dashboard-personal-shared";
import {
  ACTIVITY_OPTIONS,
  alignmentTone,
  currentMonthIso,
  formatShortDate,
  formatWeekday,
} from "./dashboard-activity-timing-card";
import { QUESTION_AREAS, outlookLabel } from "./dashboard-prasna-widget";
import { RasiChart, NavamsaChart } from "./dashboard-charts";
import { DrawerPanel } from "./drawer-panel";
import { NovaSelect } from "./nova-select";
import { Chip, Metric, Surface } from "./dashboard-ui";

/**
 * Deep Dive completeness follow-up (see docs/DASHBOARD_UI_REVAMP_PLAN.md §7/§8) —
 * the 6 pieces Nova's Today tab hadn't yet folded in from Classic's
 * dashboard-personal-tab.tsx. Same data/logic as Classic throughout; only the
 * JSX/styling is fresh Nova-token markup (Classic's own inline styles here
 * read several Classic-only literal-hex warm custom properties that dashboard-nova.css's
 * gap-fix block deliberately does NOT redirect, since redirecting them broke
 * "selected pill" text app-wide during the 2026-07-06 browser QA round; see
 * that Progress Log entry). Everything below is grouped into Nova's Deep
 * Dive collapsed section, not the top-level page, keeping the at-a-glance
 * sections (hero/ribbon/decide/anticipation/glance) uncluttered.
 */

// ───────────────────────── 1. Chart validation confidence chip ─────────────────────────

export function NovaChartValidationChip({
  lang,
  validationStatus,
}: {
  lang: Lang;
  validationStatus: ChartValidationStatus | null | undefined;
}) {
  if (!validationStatus) return null;
  const { confidence, matchCount, totalChecked } = validationStatus;
  const color =
    confidence === "HIGH" ? "var(--color-high)" :
    confidence === "MEDIUM" ? "var(--color-mid)" :
    confidence === "LOW" ? "var(--color-low)" :
    "var(--color-faint)";
  const Icon = confidence === "HIGH" ? Check : confidence === "UNVALIDATED" ? Minus : AlertTriangle;
  const label = confidence === "HIGH"
    ? (lang === "ta" ? `உயர் நம்பகம் — ${matchCount}/${totalChecked} பொருந்தியது` : `High confidence — ${matchCount}/${totalChecked} events matched`)
    : confidence === "MEDIUM"
    ? (lang === "ta" ? `நடுத்தர நம்பகம் — ${matchCount}/${totalChecked} பொருந்தியது` : `Moderate — ${matchCount}/${totalChecked} matched`)
    : confidence === "LOW"
    ? (lang === "ta" ? `குறைவான நம்பகம் — ${matchCount}/${totalChecked} பொருந்தியது` : `Low confidence — ${matchCount}/${totalChecked} matched`)
    : (lang === "ta" ? "நிகழ்வுகள் பதிவு செய்யப்படவில்லை" : "No life events on record");

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "var(--space-1_5)",
      padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)",
      background: `${color}18`, border: `1px solid ${color}44`,
      fontSize: "var(--text-sm)", fontWeight: 600, color,
    }}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

// ─────────────── 2a. Chart identity card (kattam + birth facts) ───────────────
// Formerly the left column of one combined NovaChartContextGuidanceGochar
// two-col. Split in two so the charts panel can lead with the kattam
// (identity zone, first thing after the header) and render today's
// guidance/gochar as its own later zone — see dashboard-charts-panel-nova.tsx.

export function NovaChartIdentityCard({
  lang,
  personalChart,
  personalChartSummary,
  dasha,
  astroText,
}: {
  lang: Lang;
  personalChart: ChartCalculateResponseData | null;
  personalChartSummary: ChartSummaryData | null;
  dasha?: DashaTimelineResponseData | null;
  astroText: (value: string) => string;
}) {
  return (
      <Surface title={t("surface_chart_context", lang)}>
        {personalChart ? (
          <div className="surface__body">
            <div className="surface__headline">
              <span>{personalChartSummary?.displayName ?? personalChart.birthProfile.displayName}</span>
              <Chip tone="accent">
                {dasha
                  ? `${tPlanetLord(dasha.current.mahadasha.lord, lang)} ${t("dasha_word", lang)} · ${tPlanetLord(dasha.current.antardasha.lord, lang)} ${t("bhukti_word", lang)} · ${tPlanetLord(dasha.current.pratyantardasha.lord, lang)} ${t("antaram_word", lang)}`
                  : personalChartSummary
                  ? `${personalChartSummary.currentMahadasha} ${t("dasha_word", lang)}`
                  : personalChart.calculationVersion}
              </Chip>
            </div>
            <p className="surface__text">
              {personalChartSummary
                ? `${personalChartSummary.lagnaRasi} ${t("label_lagnam", lang)} · ${personalChartSummary.moonRasi} ${t("label_janma_rasi", lang)} · ${astroText(personalChartSummary.janmaNakshatra)} ${t("label_nakshatra", lang)} ${t("label_padam", lang)} ${personalChartSummary.janmaPada}`
                : t("chart_loading", lang)}
            </p>
            <div style={{ display: "flex", gap: "var(--space-3_5)", flexWrap: "wrap", justifyContent: "center", marginTop: "14px" }}>
              <RasiChart chart={personalChart} label={t("label_d1", lang)} lang={lang} />
              <NavamsaChart chart={personalChart} label={t("label_d9", lang)} lang={lang} />
            </div>
            <div style={{ marginTop: "10px", paddingTop: "var(--space-2)", borderTop: "1px solid var(--color-border)" }}>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                {lang === "ta"
                  ? `${personalChart.ayanamsa.type === "LAHIRI" ? "லாகிரி அயனாம்சம்" : personalChart.ayanamsa.type} · முழு-ராசி வீட்டு முறை · `
                  : `${personalChart.ayanamsa.type === "LAHIRI" ? "Lahiri ayanamsa" : personalChart.ayanamsa.type} · Whole-sign houses · `}
                <Link href="/trust/methodology#lahiri" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontWeight: 700, color: "var(--color-text-accent)", textDecoration: "none" }}>
                  {lang === "ta" ? "முறையை பார்க்க" : "See methodology"}
                  <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <p className="empty-state">{t("chart_no_profile", lang)}</p>
        )}
      </Surface>
  );
}

// ─── 2a-2. Rasi / Lagnam trait card (classical, generic — no per-user calc) ───
// Same visual/content shape as the nakshatra profile card above (headline +
// ruling-planet chip + profile + strength chips + one caution chip), reused
// for both the moon-rasi and lagna-rasi trait cards from RASI_TRAITS in
// lib/rasi-traits.ts — see that file's header comment for why this is
// hardcoded client-side rather than API-sourced like the nakshatra card.
export function NovaRasiTraitCard({
  lang,
  rasi,
  titleKey,
  astroText,
}: {
  lang: Lang;
  rasi: number | null | undefined;
  titleKey: "rasi_trait_card_label" | "lagna_trait_card_label";
  astroText: (value: string) => string;
}) {
  if (rasi == null) return null;
  const entry = RASI_TRAITS[rasi];
  if (!entry) return null;
  const rasiName = D1_RASI_NAMES[rasi] ?? `Rasi ${rasi}`;
  const lord = RASI_LORDS[rasi];

  return (
    <Surface title={t(titleKey, lang)}>
      <div className="surface__body">
        <div className="surface__headline surface__headline--profile">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2_5)", minWidth: 0 }}>
            <ZodiacBadge rasi={rasi} size={56} />
            <span>{rasiName}</span>
          </span>
          {lord && <Chip tone="accent">{t("nakshatra_ruling_planet", lang)}: {tPlanetLord(lord, lang)}</Chip>}
        </div>
        <p className="surface__text">{lang === "ta" ? entry.profile.ta : astroText(entry.profile.en)}</p>
        <div className="chip-row">
          <Chip>{t("rasi_trait_element", lang)}: {lang === "ta" ? entry.element.ta : astroText(entry.element.en)}</Chip>
        </div>
        {entry.traits.length > 0 && (
          <div className="chip-row">{entry.traits.map((s) => <Chip key={s.en} tone="success">{lang === "ta" ? s.ta : astroText(s.en)}</Chip>)}</div>
        )}
        <div className="chip-row">
          <Chip tone="warning">{lang === "ta" ? entry.caution.ta : astroText(entry.caution.en)}</Chip>
        </div>
      </div>
    </Surface>
  );
}

// ─────────────── 2b. Today's guidance card ───────────────
// Split from the old combined "guidance + gochar" two-col (see git history)
// so the charts panel can place guidance and gochar in different reading-order
// zones — guidance stands alone as its own "why this score" section, while
// gochar/transit content moves up next to the planet-positions reference
// material. Same data/logic, just no longer forced side-by-side.

export function NovaGuidanceCard({
  lang,
  personalDailyGuidance,
  dailyGuidanceRange,
  astroText,
}: {
  lang: Lang;
  personalDailyGuidance: DailyGuidanceData | null;
  dailyGuidanceRange?: DailyGuidanceRangeData | null;
  astroText: (value: string) => string;
}) {
  const bestWindow = personalDailyGuidance?.bestWindows[0] ?? null;
  const avoidWindow = personalDailyGuidance?.cautionWindows[0] ?? null;
  const personalScoreBand = personalDailyGuidance ? getScoreBand(personalDailyGuidance.score) : null;

  return (
        <Surface title={t("surface_guidance", lang)}>
          {personalDailyGuidance ? (
            <div className="surface__body">
              {personalDailyGuidance.tithiCard && (
                <div style={{ marginBottom: "10px", padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--color-mid-bg)", border: "1px solid var(--color-mid-border)" }}>
                  <p style={{ margin: "0 0 3px", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--color-mid)", textTransform: "uppercase", letterSpacing: "0.06em" }}>🕉 {t("tithi_card_label", lang)}</p>
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.5 }}>{tLang(personalDailyGuidance.tithiCard, lang)}</p>
                </div>
              )}
              {personalDailyGuidance.contextInsight && (
                <div style={{ marginBottom: "10px", padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--color-accent-secondary-muted)", border: "1px solid color-mix(in srgb, var(--color-accent-secondary) 40%, transparent)" }}>
                  <p style={{ margin: "0 0 3px", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--color-accent-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>📋 {t("context_insight_label", lang)}</p>
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.5 }}>{tLang(personalDailyGuidance.contextInsight, lang)}</p>
                </div>
              )}
              <div className="surface__headline">
                <span>{`${personalDailyGuidance.score}/100 – ${getScoreBand(personalDailyGuidance.score).label}`}</span>
                <Chip tone={personalScoreBand?.tone === "high" ? "success" : personalScoreBand?.tone === "low" ? "warning" : "neutral"}>{personalDailyGuidance.label}</Chip>
              </div>
              <p className="surface__text">{tLang(personalDailyGuidance.text, lang)}</p>
              {personalDailyGuidance.currentHoraLord && (
                <div
                  style={{
                    marginTop: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-1_5)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  <span style={{ color: "var(--color-faint)" }}>{lang === "ta" ? "தற்போதைய ஹோரா" : "Current hora"}</span>
                  <strong style={{ color: DASHA_COLORS[personalDailyGuidance.currentHoraLord] ?? "var(--color-accent)" }}>
                    {tPlanetLord(personalDailyGuidance.currentHoraLord, lang)}
                  </strong>
                </div>
              )}
              {personalDailyGuidance.pratyantarNarrative && (
                <div style={{ marginTop: "8px", padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
                  <p style={{ margin: "0 0 3px", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {lang === "ta" ? "பிரத்யந்தர தசை" : "Pratyantar signal"}
                  </p>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.45, color: "var(--color-text)" }}>
                    {tLang(personalDailyGuidance.pratyantarNarrative, lang)}
                  </p>
                </div>
              )}
              {personalDailyGuidance.nakshatraPerspective && (
                <p style={{ margin: "8px 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
                  {astroText(tLang(personalDailyGuidance.nakshatraPerspective, lang))}
                </p>
              )}
              <div className="surface__metrics">
                <Metric label={t("label_best_time", lang)} value={bestWindow ? formatClockLabel(bestWindow.start) : ""} hint={bestWindow ? formatClockLabel(bestWindow.end) : ""} tone="high" />
                <Metric label={t("label_caution_time", lang)} value={avoidWindow ? formatClockLabel(avoidWindow.start) : ""} hint={avoidWindow ? formatClockLabel(avoidWindow.end) : ""} tone="low" />
                <Metric label={t("label_moon_transit", lang)} value={`${personalDailyGuidance.scoreBreakdown.moonTransit}`} hint={`${t("dasha_word", lang)} ${personalDailyGuidance.scoreBreakdown.dashaSupport}`} />
              </div>
              {personalDailyGuidance.reasons && (
                <div style={{ marginTop: "10px", paddingTop: "var(--space-2_5)", borderTop: "1px solid var(--veil-white-07)" }}>
                  <p className="surface__subhead" style={{ marginBottom: "6px" }}>{t("why_this_prediction", lang)}</p>
                  {GUIDANCE_REASON_KEYS.map((key) => (
                    <div key={key} className="cd-responsive-detail-row" style={{ marginBottom: "4px" }}>
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--color-muted)", minWidth: "84px", paddingTop: "var(--space-0_5)" }}>{t(`reason_${key}` as Parameters<typeof t>[0], lang)}</span>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.4 }}>{tLang(personalDailyGuidance.reasons[key], lang)}</p>
                    </div>
                  ))}
                </div>
              )}
              {dailyGuidanceRange && dailyGuidanceRange.items.length > 0 && (
                <div style={{ marginTop: "10px", paddingTop: "var(--space-2)", borderTop: "1px solid var(--veil-white-07)" }}>
                  <p className="surface__subhead" style={{ marginBottom: "6px" }}>{t("label_next_3_days", lang)}</p>
                  <div className="chip-row">
                    {dailyGuidanceRange.items.map((item) => {
                      const band = getScoreBand(item.score);
                      return (
                        <Chip key={item.dateLocal} tone={band.tone === "high" ? "success" : band.tone === "low" ? "warning" : "neutral"}>
                          {item.dateLocal} {item.score}/100
                        </Chip>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="empty-state">{t("guidance_empty", lang)}</p>
          )}
        </Surface>
  );
}

// ─────────────── 2c. Transits & Panchangam card (gochar) ───────────────
// The other half of the old combined row — now grouped with planet
// positions/chart explanation as the "why" material for the same chart,
// instead of sitting beside the guidance card.

export function NovaGocharCard({
  lang,
  personalDailyGuidance,
  personalTransit,
  personalSani,
  panchangam,
}: {
  lang: Lang;
  personalDailyGuidance: DailyGuidanceData | null;
  personalTransit: TransitSnapshotData | null;
  personalSani: SaniCycleData | null;
  panchangam: PanchangamDailyResponseData | null;
}) {
  const chandrashtamaWindowsSummary = panchangam
    ? formatChandrashtamaWindowSummary(panchangam.chandrashtamamToday?.janmaNakshatraWindows ?? [], panchangam.dateLocal, lang)
    : "";

  return (
        <Surface title={<GlossaryTerm term="gochar" lang={lang}>{t("surface_gochar", lang)}</GlossaryTerm>}>
          {personalTransit && personalSani && panchangam ? (
            <div className="stack">
              {personalTransit.isChandrashtama && (
                <ChandrashtamaCard
                  lang={lang}
                  chandrashtamaEnds={personalDailyGuidance?.chandrashtamaEnds ?? null}
                  descriptionTa={null}
                  descriptionEn={null}
                  windowsSummary={chandrashtamaWindowsSummary}
                />
              )}
              <div className="surface__metrics">
                {!personalTransit.isChandrashtama && (
                  <Metric
                    label={t("label_chandrashtamam", lang)}
                    value={t("label_none", lang)}
                    hint={personalSani.confirmationSentence}
                    tone="rest"
                  />
                )}
                {personalSani.moonBasedCycle.isActive && <Metric label={t("label_sani_cycle", lang)} value={personalSani.moonBasedCycle.type ?? ""} hint={personalSani.moonBasedCycle.supportiveLabel ?? ""} tone="low" />}
              </div>
              <div className="surface__textBlock">
                <p className="surface__subhead">{t("label_gochar_pos", lang)}</p>
                <div className="chip-row">
                  {personalTransit.transits.slice(0, 5).map((item) => (
                    <Chip key={item.graha}>{item.graha} · {item.currentRasi}</Chip>
                  ))}
                </div>
              </div>
            </div>
          ) : <p className="empty-state">{t("gochar_empty", lang)}</p>}
        </Surface>
  );
}

// (Section 3, the "Dasa Position" strip, was deleted — it duplicated the full
// Dasa · Bhukti · Antaram detail that now renders once in the charts panel's
// identity zone via DasaBhuktiAntaramDetail from dashboard-family-tab.tsx.)

// ───────────────────────── 4. Activity Timing (single-activity month browser) ─────────────────────────

const novaFieldStyle = {
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-strong)",
  fontSize: "var(--text-base)",
  padding: "var(--space-2) var(--space-2_5)",
  fontFamily: "inherit",
} as const;

export function NovaActivityTimingCard({
  lang,
  chartId,
  selectedDate,
  onDateChange,
}: {
  lang: Lang;
  chartId: string;
  selectedDate: string;
  onDateChange?: (date: string) => void;
}) {
  const [activityType, setActivityType] = useState(ACTIVITY_OPTIONS[0].value);
  const [activityMonth, setActivityMonth] = useState(() => selectedDate.slice(0, 7) || currentMonthIso());
  const [result, setResult] = useState<ActivityTimingData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextMonth = selectedDate.slice(0, 7);
    if (nextMonth) setActivityMonth(nextMonth);
  }, [selectedDate]);

  useEffect(() => {
    if (!chartId || !activityMonth) {
      setResult(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setBusy(true);
    setError(null);
    void apiFetchJson<{ success: boolean; data: ActivityTimingData }>(
      `/api/v1/activity-timing${toQuery({ chartId, activity: activityType, month: activityMonth })}`,
    )
      .then((response) => { if (!cancelled) setResult(response.data ?? null); })
      .catch((fetchError) => { if (!cancelled) { setResult(null); setError(readErrorMessage(fetchError)); } })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [activityMonth, activityType, chartId]);

  return (
    <Surface title={t("activity_timing_label", lang)}>
      <div className="surface__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <p className="surface__text" style={{ margin: 0 }}>
          {lang === "ta"
            ? "இந்த மாதத்தில் உங்கள் செயல் தொடக்கத்திற்கு ஏற்ற நாட்களை உடனே பார்க்கலாம். ஒரு தேதியைத் தேர்வு செய்தால் அந்த நாளைத் திறக்கும்."
            : "See the strongest dates for your chosen activity this month. Picking a date switches to that day."}
        </p>
        <div className="cd-responsive-row" style={{ gap: "var(--space-2_5)", alignItems: "flex-end" }}>
          <div className="cd-responsive-form-block" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-faint)" }}>{t("activity_label", lang)}</span>
            <NovaSelect
              value={activityType}
              onChange={setActivityType}
              ariaLabel={t("activity_label", lang)}
              containerStyle={{ minWidth: "240px" }}
              options={ACTIVITY_OPTIONS.map((option) => ({ value: option.value, label: lang === "ta" ? option.ta : option.en }))}
            />
          </div>
          <div className="cd-responsive-form-block" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-faint)" }}>{t("activity_month_label", lang)}</span>
            <input style={{ ...novaFieldStyle, minWidth: "140px" }} type="month" value={activityMonth} onChange={(event) => setActivityMonth(event.target.value)} />
          </div>
          <div style={{ minWidth: "140px" }}>
            <Chip tone={busy ? "accent" : "neutral"}>
              {busy ? t("btn_finding", lang) : `${result?.topDates.length ?? 0} ${lang === "ta" ? "நாட்கள்" : "dates"}`}
            </Chip>
          </div>
        </div>

        {error && <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-low)" }}>{error}</p>}

        {!busy && result && result.topDates.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {result.topDates.slice(0, 3).map((item, index) => {
              const isSelected = selectedDate === item.dateLocal;
              const weekday = formatWeekday(item.dateLocal, lang);
              const content = (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-faint)" }}>{index + 1}.</span>
                    <span style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--color-text-strong)" }}>{formatShortDate(item.dateLocal, lang)}</span>
                    {weekday && <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{weekday}</span>}
                    <Chip tone={alignmentTone(item.alignment)}>{item.alignment}</Chip>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-high)" }}>{item.score}/100</span>
                    {isSelected && <Chip tone="accent">{lang === "ta" ? "தற்போது பார்க்கப்படுகிறது" : "Viewing"}</Chip>}
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.5 }}>
                    {lang === "ta" ? item.reasonTa : item.reasonEn}
                  </p>
                </>
              );
              const rowStyle = {
                padding: "var(--space-3)",
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${isSelected ? "var(--color-high-border)" : "var(--color-border)"}`,
                background: isSelected ? "var(--color-high-bg)" : "var(--color-surface)",
              } as const;
              if (!onDateChange) {
                return <div key={item.dateLocal} style={rowStyle}>{content}</div>;
              }
              return (
                <button key={item.dateLocal} type="button" onClick={() => onDateChange(item.dateLocal)} style={{ ...rowStyle, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                  {content}
                </button>
              );
            })}
          </div>
        )}

        {!busy && !error && result && result.topDates.length === 0 && (
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
            {lang === "ta" ? "இந்த மாதத்திற்கு பொருத்தமான தேதிகள் கிடைக்கவில்லை." : "No matching dates were found for this month."}
          </p>
        )}
      </div>
    </Surface>
  );
}

// ───────────────────────── 5. Prasna (Horary) trigger + widget ─────────────────────────
// (Section "Morning Guidance opt-in" removed — the opt-in now lives only in
// Settings > Notifications; the Today tab renders the compact
// MorningGuidanceCard pointer from ./morning-guidance-card instead.)

function novaOutlookColor(outlook: PrasnaResponse["outlook"]) {
  if (outlook === "FAVOURABLE") return "var(--color-high)";
  if (outlook === "UNFAVOURABLE") return "var(--color-low)";
  if (outlook === "DELAY") return "var(--color-mid)";
  return "var(--color-faint)";
}

function NovaMetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "var(--space-1_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)" }}>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>{label}</p>
      <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>{value}</p>
    </div>
  );
}

export function NovaPrasnaTrigger({ lang, onOpenPrasna }: { lang: Lang; onOpenPrasna?: () => void }) {
  if (!onOpenPrasna) return null;
  return (
    <div className="cd-responsive-row" style={{ alignItems: "center", gap: "var(--space-3)" }}>
      <button
        type="button"
        onClick={onOpenPrasna}
        style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-pill)", border: "1px solid var(--color-border-strong)", background: "none", color: "var(--color-accent-strong)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
      >
        {lang === "ta" ? "ப்ரஸ்ன கேள்வி கேளுங்கள்" : "Ask a Horary Question"}
      </button>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
        {lang === "ta" ? "பிறந்த நேரம் தெரியாவிட்டால் அல்லது உடனடி கேள்விக்கு" : "When birth time is unknown or for an immediate question"}
      </span>
    </div>
  );
}

export function NovaPrasnaWidget({
  lang, open, onClose, timezone, latitude, longitude,
}: {
  lang: Lang; open: boolean; onClose: () => void; timezone: string; latitude: number; longitude: number;
}) {
  const [selectedArea, setSelectedArea] = useState("GENERAL");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrasnaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // POST /prasna responds with the payload flat — there is no
      // { success, data } envelope, so don't unwrap one.
      const res = await apiFetchJson<PrasnaResponse>("/api/v1/prasna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_area: selectedArea, timezone_name: timezone, latitude, longitude }),
      });
      if (res?.outlook) {
        setResult(res);
      } else {
        setError(lang === "ta" ? "பதில் கிடைக்கவில்லை." : "No result returned.");
      }
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setResult(null);
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <DrawerPanel title={t("prasna_title", lang)} onClose={handleClose}>
      <div style={{ padding: "var(--space-4) var(--space-4) var(--space-8)", maxWidth: "480px" }}>
        <p style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", marginBottom: "16px", lineHeight: 1.6 }}>
          {t("prasna_desc", lang)}
        </p>

        <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
          {t("prasna_area_label", lang)}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "16px" }}>
          {QUESTION_AREAS.map(({ key, labelKey }) => {
            const isActive = key === selectedArea;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedArea(key)}
                style={{
                  padding: "var(--space-1) var(--space-3_5)", borderRadius: "var(--radius-pill)",
                  border: `1.5px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: isActive ? "var(--color-accent-muted)" : "var(--color-surface-soft)",
                  color: isActive ? "var(--color-accent-strong)" : "var(--color-text)",
                  fontWeight: isActive ? 700 : 500, fontSize: "var(--text-base)", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {t(labelKey, lang)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void handleAsk()}
          disabled={loading}
          style={{
            display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-pill)",
            border: "1px solid var(--color-accent)", background: "var(--color-accent)", color: "var(--color-on-accent)",
            fontSize: "var(--text-base)", fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? t("prasna_asking", lang) : t("prasna_ask", lang)}
        </button>

        {error && <p style={{ marginTop: "12px", fontSize: "var(--text-base)", color: "var(--color-low)" }}>{error}</p>}

        {result && (
          <div style={{ marginTop: "20px" }}>
            <div style={{
              padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-md)",
              background: `${novaOutlookColor(result.outlook)}18`,
              border: `1.5px solid ${novaOutlookColor(result.outlook)}44`,
              marginBottom: "16px",
            }}>
              <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: novaOutlookColor(result.outlook), marginBottom: "2px" }}>
                {outlookLabel(result.outlook, lang)}
              </p>
              <p style={{ fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                {lang === "ta" ? result.outlookTa : result.outlookEn}
              </p>
            </div>

            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "16px" }}>
              <NovaMetaChip label={t("prasna_lagna", lang)} value={result.prasnaLagnaName} />
              <NovaMetaChip label={t("prasna_moon", lang)} value={result.moonNakshatraName} />
              <NovaMetaChip label={t("prasna_karaka", lang)} value={`${result.karaka} (H${result.karakaHouse})`} />
            </div>

            {result.positiveIndicators.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-high)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                  {t("prasna_positive", lang)}
                </p>
                {result.positiveIndicators.map((ind, i) => (
                  <p key={i} style={{ fontSize: "var(--text-base)", color: "var(--color-text)", marginBottom: "4px" }}>+ {ind}</p>
                ))}
              </div>
            )}

            {result.negativeIndicators.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-mid)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                  {t("prasna_negative", lang)}
                </p>
                {result.negativeIndicators.map((ind, i) => (
                  <p key={i} style={{ fontSize: "var(--text-base)", color: "var(--color-text)", marginBottom: "4px" }}>− {ind}</p>
                ))}
              </div>
            )}

            {(lang === "ta" ? result.cautionTa : result.cautionEn) && (
              <div style={{
                padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--color-mid-bg)",
                border: "1px solid var(--color-mid-border)", fontSize: "var(--text-sm)", color: "var(--color-mid)", lineHeight: 1.55,
                display: "flex", alignItems: "flex-start", gap: "var(--space-1_5)",
              }}>
                <AlertTriangle size={14} strokeWidth={2} aria-hidden="true" style={{ flex: "none", marginTop: "2px" }} />
                <span>{lang === "ta" ? result.cautionTa : result.cautionEn}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </DrawerPanel>
  );
}
