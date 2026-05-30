"use client";

import { useState } from "react";

import { t, tLang, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartCalculateResponseData,
  DailyGuidanceData,
  DashaStoryData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  JournalCorrelationData,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { DASHA_COLORS, DashaTimeline } from "./dashboard-dasha";
import { Chip, Surface } from "./dashboard-ui";

type DashboardTransitsTabProps = {
  lang: Lang;
  selectedDate: string;
  personalChart: ChartCalculateResponseData | null;
  personalDailyGuidance: DailyGuidanceData | null;
  personalTransit: TransitSnapshotData | null;
  personalSani: SaniCycleData | null;
  personalDasha: DashaTimelineResponseData | null;
  personalDashaMaha: DashaTimelineResponseData | null;
  personalDashaAntar: DashaTimelineItem[];
  dashaStory: DashaStoryData | null;
  journalCorrelations: JournalCorrelationData | null;
};

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "#A89D89",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  card: "#FFFFFF",
  terracotta: "#B85A2C",
  sage: "#5C7654",
  rust: "#A8482F",
} as const;

const PLANET_COLORS: Record<string, string> = {
  SUN: "#D08B4A",
  MOON: "#6B8DB8",
  MARS: "#CF6354",
  MERCURY: "#A99663",
  JUPITER: "#93A56D",
  VENUS: "#C59AC3",
  SATURN: "#607089",
  RAHU: "#9F93C4",
  KETU: "#9A8679",
};

function formatHeaderDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn" | "good";
}) {
  const palette =
    tone === "good"
      ? { bg: "#DCE4D2", border: "rgba(92,118,84,0.35)", color: W.sage }
      : tone === "warn"
      ? { bg: "#F0D9C4", border: "rgba(184,90,44,0.3)", color: W.terracotta }
      : { bg: W.surface, border: W.borderLt, color: W.inkMid };

  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: "999px",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        display: "inline-flex",
        gap: "10px",
        alignItems: "baseline",
      }}
    >
      <span
        style={{
          fontSize: "0.74rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: W.muted,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: "1rem", color: palette.color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function Flag({
  label,
  tone,
}: {
  label: string;
  tone: "warn" | "danger" | "focus" | "soft";
}) {
  const palette =
    tone === "danger"
      ? { bg: "#F2D8CC", border: "rgba(168,72,47,0.35)", color: W.rust }
      : tone === "focus"
      ? { bg: "rgba(122,72,128,0.12)", border: "rgba(122,72,128,0.28)", color: "#7A4880" }
      : tone === "soft"
      ? { bg: "rgba(92,118,84,0.14)", border: "rgba(92,118,84,0.28)", color: W.sage }
      : { bg: "rgba(184,90,44,0.12)", border: "rgba(184,90,44,0.3)", color: W.terracotta };

  return (
    <span
      style={{
        fontSize: "0.72rem",
        padding: "3px 10px",
        borderRadius: "999px",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        fontWeight: 700,
        lineHeight: 1.2,
      }}
    >
      {label}
    </span>
  );
}

export function DashboardTransitsTab({
  lang,
  selectedDate,
  personalChart,
  personalDailyGuidance,
  personalTransit,
  personalSani,
  personalDasha,
  personalDashaMaha,
  personalDashaAntar,
  dashaStory,
  journalCorrelations,
}: DashboardTransitsTabProps) {
  const [dashaStoryExpanded, setDashaStoryExpanded] = useState(false);
  const hasTransitSnapshot = Boolean(personalTransit && personalTransit.transits.length > 0);
  const flaggedCount = personalTransit
    ? personalTransit.transits.filter((item) => item.isRetrograde || item.isCombust || item.isGandanta || item.isSandhi).length
    : 0;
  const activeSaniCycles = personalSani
    ? Number(personalSani.moonBasedCycle.isActive) + Number(personalSani.lagnaBasedCycle.isActive)
    : 0;
  const dashaSupportScore = personalDailyGuidance
    ? Math.min(100, Math.round(personalDailyGuidance.scoreBreakdown.dashaSupport / 0.2))
    : null;
  const headerDate = formatHeaderDate(selectedDate, lang);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        color: W.inkMid,
        fontFamily: "'Noto Sans Tamil','Inter',system-ui,sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "0.74rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: W.terracotta,
            }}
          >
            {lang === "ta" ? "கோசாரம் & தசை" : "Transits & Dasha"}
          </p>
          <h1
            style={{
              margin: "0 0 8px",
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: W.ink,
              fontWeight: 500,
            }}
          >
            {lang === "ta" ? "Transit intelligence" : "Transit intelligence"}
          </h1>
          <p style={{ margin: 0, fontSize: "1.02rem", color: W.muted, lineHeight: 1.6, maxWidth: "62ch" }}>
            {t("transits_tab_desc", lang)}
          </p>
        </div>
        <span
          style={{
            borderRadius: "999px",
            border: `1px solid ${W.border}`,
            background: W.surface,
            color: W.inkMid,
            fontSize: "1.02rem",
            fontWeight: 600,
            padding: "6px 16px",
            whiteSpace: "nowrap",
            alignSelf: "center",
          }}
        >
          {headerDate}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <StatPill label={lang === "ta" ? "transits" : "transits"} value={hasTransitSnapshot ? `${personalTransit?.transits.length}` : "0"} tone="neutral" />
        <StatPill label={lang === "ta" ? "flagged" : "flagged"} value={`${flaggedCount}`} tone={flaggedCount > 0 ? "warn" : "good"} />
        <StatPill label={lang === "ta" ? "sani cycles" : "sani cycles"} value={personalSani ? `${activeSaniCycles} active` : "N/A"} tone={activeSaniCycles > 0 ? "warn" : "neutral"} />
        <StatPill
          label={lang === "ta" ? "dasa support" : "dasa support"}
          value={dashaSupportScore === null ? "N/A" : `${dashaSupportScore}/100`}
          tone={dashaSupportScore !== null && dashaSupportScore >= 65 ? "good" : "neutral"}
        />
      </div>

      {hasTransitSnapshot && personalTransit && (
        <Surface title={lang === "ta" ? "Inru graha nilaihal" : "Planetary positions today"}>
          <div className="surface__body">
            <p style={{ margin: "0 0 14px", fontSize: "0.75rem", color: W.muted, lineHeight: 1.55 }}>
              {lang === "ta"
                ? `Janma rasi ${personalTransit.janmaRasi}. H = house from Moon, L = house from Lagna.`
                : `Your birth Rasi is ${personalTransit.janmaRasi}. H = house from your Moon, L = house from Lagna.`}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))", gap: "12px" }}>
              {personalTransit.transits.map((tr) => {
                const hasFlag = tr.isRetrograde || tr.isCombust || tr.isGandanta || tr.isSandhi;
                const planetColor = PLANET_COLORS[tr.graha] ?? W.muted;
                return (
                  <div
                    key={`${tr.graha}-${tr.currentRasi}`}
                    style={{
                      padding: "16px 18px",
                      borderRadius: "16px",
                      background: hasFlag ? "#FFF9F4" : "#FFFEFC",
                      border: `1px solid ${hasFlag ? `${planetColor}77` : W.borderLt}`,
                      minHeight: "116px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "1.45rem", fontFamily: "'Fraunces', Georgia, serif", lineHeight: 1.05, color: W.ink }}>
                      {tr.currentRasi}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.86rem", fontWeight: 700, color: planetColor, letterSpacing: "0.03em" }}>{tPlanetLord(tr.graha, lang)}</p>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: W.muted }}>
                      H{tr.houseFromMoon} <span style={{ opacity: 0.6 }}>·</span> L{tr.houseFromLagna}
                    </p>
                    {hasFlag && (
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                        {tr.isRetrograde && <Flag tone="warn" label={lang === "ta" ? "Vakra" : "Retro"} />}
                        {tr.isCombust && <Flag tone="danger" label={lang === "ta" ? "Astham" : "Combust"} />}
                        {tr.isGandanta && <Flag tone="focus" label={lang === "ta" ? "Gandanta" : "Gandanta"} />}
                        {tr.isSandhi && <Flag tone="soft" label={lang === "ta" ? "Sandhi" : "Sandhi"} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Surface>
      )}

      {!hasTransitSnapshot && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "12px",
            border: `1px dashed ${W.border}`,
            background: W.surface,
            color: W.muted,
            fontSize: "0.82rem",
          }}
        >
          {t("gochar_empty", lang)}
        </div>
      )}

      {personalSani && (
        <Surface title={lang === "ta" ? "Sani suzarchi nilai" : "Saturn cycle status"}>
          <div className="surface__body">
            <p style={{ margin: "0 0 12px", fontSize: "0.75rem", color: W.muted, lineHeight: 1.55 }}>
              {lang === "ta"
                ? "Moon மற்றும் Lagna அடிப்படையில் சனி சுழற்சி கண்காணிப்பு."
                : `Saturn is currently in ${personalSani.saturnRasi}. These cycles track whether Saturn sits in a challenging position relative to your Moon or Lagna.`}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: personalSani.moonBasedCycle.isActive ? "#F0D9C4" : W.surface,
                  border: `1px solid ${personalSani.moonBasedCycle.isActive ? "rgba(184,90,44,0.28)" : W.borderLt}`,
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: personalSani.moonBasedCycle.isActive ? W.terracotta : W.mutedLt,
                    textTransform: "uppercase",
                    letterSpacing: "0.13em",
                  }}
                >
                  {lang === "ta" ? "From Moon" : "From Moon"}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: "2rem", lineHeight: 1.1, color: personalSani.moonBasedCycle.isActive ? W.rust : W.sage, fontFamily: "'Fraunces', Georgia, serif" }}>
                  {personalSani.moonBasedCycle.type ?? "Normal"}
                </p>
                <p style={{ margin: 0, fontSize: "0.92rem", color: W.inkMid }}>
                  {personalSani.moonBasedCycle.supportiveLabel ?? (lang === "ta" ? "Home cycle calm." : "No named Saturn-pressure cycle active")}
                </p>
              </div>

              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: personalSani.lagnaBasedCycle.isActive ? "#DCE4D2" : W.surface,
                  border: `1px solid ${personalSani.lagnaBasedCycle.isActive ? "rgba(92,118,84,0.3)" : W.borderLt}`,
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: personalSani.lagnaBasedCycle.isActive ? W.sage : W.mutedLt,
                    textTransform: "uppercase",
                    letterSpacing: "0.13em",
                  }}
                >
                  {lang === "ta" ? "From Lagna" : "From Lagna"}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: "2rem", lineHeight: 1.1, color: personalSani.lagnaBasedCycle.isActive ? W.sage : W.inkMid, fontFamily: "'Fraunces', Georgia, serif" }}>
                  {personalSani.lagnaBasedCycle.type ?? "Normal"}
                </p>
                <p style={{ margin: 0, fontSize: "0.92rem", color: W.inkMid }}>
                  {personalSani.lagnaBasedCycle.supportiveLabel ?? (lang === "ta" ? "Stable cycle." : "No named Saturn-pressure cycle active")}
                </p>
              </div>
            </div>

            <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: W.muted, fontStyle: "italic" }}>{personalSani.confirmationSentence}</p>
          </div>
        </Surface>
      )}

      {personalDasha ? (
        <Surface title={t("surface_dasha", lang)}>
          <div className="surface__body">
            <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted, lineHeight: 1.55 }}>
              {lang === "ta"
                ? "விம்சோத்தரி தசை காலவரிசை உங்கள் மகாதசை, புக்தி, அந்தரம் தாக்கத்தை காட்டுகிறது."
                : "The Vimshottari Dasa system divides your life into 120 years of planetary periods. Your current Mahadasha and Antardasha lords directly influence your daily score and outcomes across life areas."}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: W.mutedLt, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {lang === "ta" ? "Dasa · Bhukti · Antaram" : "Dasa · Bhukti · Antaram"}
            </p>

            <DashaTimeline
              dasha={personalDashaMaha ?? personalDasha}
              dashaAntar={personalDashaAntar}
              today={selectedDate}
              dashaSupport={dashaSupportScore ?? 50}
              lang={lang}
              birthDateLocal={personalChart?.birthProfile.birthDateLocal}
              currentPeriodAction={personalDailyGuidance ? tLang(personalDailyGuidance.actionSuggestion, lang) : undefined}
              currentPeriodCaution={personalDailyGuidance ? tLang(personalDailyGuidance.cautionSuggestion, lang) : undefined}
            />

            {dashaStory && (
              <div style={{ borderTop: `1px solid ${W.borderLt}`, paddingTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setDashaStoryExpanded((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: W.muted,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ transition: "transform 0.2s", display: "inline-block", transform: dashaStoryExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>v</span>
                  {dashaStoryExpanded ? t("btn_collapse_dasha_story", lang) : t("btn_expand_dasha_story", lang)}
                </button>

                {dashaStoryExpanded && (
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "320px", overflowY: "auto", paddingRight: "2px" }}>
                    {dashaStory.periods.map((period) => {
                      const pc = DASHA_COLORS[period.lord] ?? "#94a3b8";
                      return (
                        <div
                          key={`${period.lord}-${period.startDate}`}
                          style={{
                            padding: "9px 12px",
                            borderRadius: "9px",
                            background: period.isCurrent ? `${pc}12` : W.card,
                            border: `1px solid ${period.isCurrent ? `${pc}44` : W.borderLt}`,
                          }}
                        >
                          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "3px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: period.isCurrent ? pc : W.muted, minWidth: "80px" }}>
                              {tPlanetLord(period.lord, lang)}
                            </span>
                            <span style={{ fontSize: "0.68rem", color: W.mutedLt }}>
                              {period.startDate.slice(0, 4)}-{period.endDate.slice(0, 4)} | {t("dasha_story_age", lang)} {period.ageStart}-{period.ageEnd}
                            </span>
                            {period.isCurrent && <Chip tone="success">{t("status_active", lang)}</Chip>}
                          </div>
                          <p style={{ margin: 0, fontSize: "0.73rem", color: W.muted, lineHeight: 1.45, fontStyle: "italic" }}>
                            {lang === "ta" ? period.themeTa : period.themeEn}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </Surface>
      ) : (
        <div style={{ padding: "14px 16px", borderRadius: "12px", border: `1px dashed ${W.border}`, background: W.surface, fontSize: "0.82rem", color: W.muted }}>
          {t("chart_no_profile", lang)}
        </div>
      )}

      {journalCorrelations && (
        <Surface title={t("journal_patterns_label", lang)}>
          <div className="surface__body">
            {!journalCorrelations.hasSufficientData ? (
              <div style={{ padding: "10px 12px", borderRadius: "10px", background: "#EEF6EA", border: "1px solid rgba(92,118,84,0.25)" }}>
                <p style={{ margin: "0 0 5px", fontSize: "0.78rem", color: W.ink, lineHeight: 1.5 }}>
                  {journalCorrelations.entryCount} / {journalCorrelations.minimumEntriesRequired} {t("journal_entries_progress", lang)}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted, lineHeight: 1.45 }}>{t("journal_keep_going", lang)}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {journalCorrelations.correlations.map((corr, i) => (
                  <div key={i} style={{ padding: "9px 12px", borderRadius: "10px", background: W.card, border: `1px solid ${W.borderLt}` }}>
                    <p style={{ margin: "0 0 3px", fontSize: "0.78rem", color: W.inkMid, lineHeight: 1.45 }}>
                      {lang === "ta" ? corr.descriptionTa : corr.descriptionEn}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.68rem", color: W.mutedLt }}>
                      {t("journal_mood_avg", lang)}: {corr.avgMood.toFixed(1)} | {corr.sampleCount} {t("journal_sample_count", lang)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Surface>
      )}
    </div>
  );
}

