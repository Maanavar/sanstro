"use client";

import { useState } from "react";
import {
  ScrollText, Sunrise, Sparkles, Timer, CalendarClock, HeartHandshake, NotebookPen, Compass,
  type LucideIcon,
} from "lucide-react";

import { formatClockLabel, formatDateLabel, getScoreBand, getScoreVerdict, getScoreVerdictFromGuidance, nextWeekdayDate, scoreColorAlpha, scoreColorScale } from "@/lib/format";
import { t, tLang, tPlanetLord, tWeekday } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  BiText,
  ChartSummaryData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  LifeAreasResponseData,
  PeyarchiEvent,
  RemedyFocus,
  SaniCycleData,
} from "@/lib/types";

import { ScoreRing } from "./dashboard-family-shared";

/**
 * Today-tab glance sections (homepage redesign 2026-07-18):
 *   - Life Areas + Dasa Chapter row (nova-grid-la-dasa)
 *   - Family Today + Remedy For You row (nova-grid-2)
 *   - "Coming up" one-liner strip
 * All real data, reused from the same hooks the Today tab already consumes.
 */

// Chart-independent read on the current antardasha (sub-period) lord —
// natural benefics vs. natural malefics — used only as a fallback when the
// chart's Lagna-dependent functional nature (below) isn't available (e.g.
// older cached chart summaries). Deliberately three-way and weather-framed
// (never fatalist), matching getScoreVerdict's tone elsewhere in this app.
const _DASHA_BENEFIC = new Set(["JUPITER", "VENUS"]);
const _DASHA_CHALLENGING = new Set(["SATURN", "MARS", "RAHU", "KETU"]);

// Lagna-dependent functional-nature bands, matching the doctrine the backend
// uses everywhere else (dasha service, daily-guidance modifiers, remedies,
// adhipathi report) — see app/calculations/functional_nature.py.
const _NATURE_SUPPORTIVE = new Set(["YOGAKARAKA", "LAGNA_LORD", "TRIKONA"]);
const _NATURE_STEADY = new Set(["KENDRA", "NEUTRAL"]);
const _NATURE_TESTING = new Set(["MARAKA", "DUSTHANA"]);
// DASH-10.2 ruling (2026-07-16): Upachaya houses (3/6/10/11) classically
// improve with effort/time rather than warranting caution — bucketing them
// with Maraka/Dusthana's "go gently" copy was a miscalibration. Split out
// with its own "grows with effort" framing; reuses the neutral --color-mid
// tone (not --color-low, which reads as a warning) rather than adding a new
// color token for a single category.
const _NATURE_GROWTH = new Set(["UPACHAYA"]);

function dashaSentiment(
  antardashaLord: string,
  functionalNature: string | undefined,
  lang: Lang,
): { label: string; color: string } {
  if (functionalNature) {
    if (_NATURE_SUPPORTIVE.has(functionalNature)) {
      return { label: lang === "ta" ? "ஆதரவான காலம்" : "supportive period", color: "var(--color-high)" };
    }
    if (_NATURE_GROWTH.has(functionalNature)) {
      // New `ta` string — pending native review, matching this repo's
      // convention for newly added Tamil copy.
      return { label: lang === "ta" ? "முயற்சியால் வளரும் காலம்" : "grows with effort", color: "var(--color-mid)" };
    }
    if (_NATURE_TESTING.has(functionalNature)) {
      return { label: lang === "ta" ? "சவாலான காலம் · மெதுவாக செல்லுங்கள்" : "testing period · go gently", color: "var(--color-low)" };
    }
    if (_NATURE_STEADY.has(functionalNature)) {
      return { label: lang === "ta" ? "நடுநிலையான காலம்" : "steady, mixed period", color: "var(--color-mid)" };
    }
  }
  // Fallback: natural benefic/malefic split (no chart-specific data yet).
  if (_DASHA_BENEFIC.has(antardashaLord)) {
    return { label: lang === "ta" ? "ஆதரவான காலம்" : "supportive period", color: "var(--color-high)" };
  }
  if (_DASHA_CHALLENGING.has(antardashaLord)) {
    return { label: lang === "ta" ? "சவாலான காலம் · மெதுவாக செல்லுங்கள்" : "testing period · go gently", color: "var(--color-low)" };
  }
  return { label: lang === "ta" ? "நடுநிலையான காலம்" : "steady, mixed period", color: "var(--color-mid)" };
}

function daysAwayLabel(days: number, lang: Lang): string {
  if (days < 60) return lang === "ta" ? `${days} நாட்களில்` : `in ${days} days`;
  const months = Math.round(days / 30);
  return lang === "ta" ? `${months} மாதங்களில்` : `in ${months} mo`;
}

/** Shared section header: title (in the active language only) + trailing link. */
function GlanceHeader({
  lang,
  title,
  titleTa,
  linkLabel,
  onLink,
}: {
  lang: Lang;
  title: string;
  titleTa: string;
  linkLabel?: string;
  onLink?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "14px" }}>
      {/* audit B-1: shared section header is a real <h2>, so every Today
          section (Life Areas, Dasa, Family, Coming up) lands in the outline. */}
      <h2 style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-strong)" }}>
        {lang === "ta" ? titleTa : title}
      </h2>
      {onLink && linkLabel && (
        <button
          type="button"
          onClick={onLink}
          style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, whiteSpace: "nowrap" }}
        >
          {linkLabel}
        </button>
      )}
      {!onLink && <span style={{ marginLeft: "auto" }} />}
    </div>
  );
}

type QuickLinkSpec = {
  id: string;
  icon: LucideIcon;
  color: string;
  nameEn: string;
  nameTa: string;
  descEn: string;
  descTa: string;
  onClick?: () => void;
  /** Chart-dependent tools gray out with no saved profile — mirrors the exact
   *  same `needsProfile` gating the Tools tab already applies to these three
   *  (dashboard-tools-tab-nova.tsx), not a new rule. */
  gateOnProfile?: boolean;
};

/** Quick Links — one-tap shortcuts to the product's highest-value functions
 *  that otherwise sit behind the "More" nav dropdown (Tools/Explore) or have
 *  no top-level nav entry at all (Journal). A curated 8, not a mirror of the
 *  full Tools/Explore grids — see docs/dashboard-master-audit-2026-07-23.md
 *  (A-1: "'More' is where features go to die") and the IA audit's
 *  progressive-disclosure direction (Today stays a snapshot, not a wall).
 *  Reuses GlanceHeader (this file) and the `.ui-card`/`.ui-card--pad-sm`
 *  component-kit classes (web/components/ui/card.tsx) rather than inventing
 *  new tile chrome. */
export function DashboardTodayQuickLinksNova({
  lang,
  needsProfile,
  onOpenChartGen,
  onOpenMuhurta,
  onOpenCompatibility,
  onOpenActivityTiming,
  onOpenRasipalan,
  onOpenVarshaphala,
  onGoToJournal,
  onGoToExplore,
  onGoToAllTools,
}: {
  lang: Lang;
  needsProfile: boolean;
  onOpenChartGen?: () => void;
  onOpenMuhurta?: () => void;
  onOpenCompatibility?: () => void;
  onOpenActivityTiming?: () => void;
  onOpenRasipalan?: () => void;
  onOpenVarshaphala?: () => void;
  onGoToJournal?: () => void;
  onGoToExplore?: () => void;
  onGoToAllTools?: () => void;
}) {
  const LINKS: QuickLinkSpec[] = [
    {
      id: "rasipalan", icon: Sparkles, color: "var(--color-accent-strong)",
      nameEn: "Today's Rasipalan", nameTa: "இன்றைய ராசிபலன்",
      descEn: "Palan for all 12 rasis", descTa: "12 ராசிகளுக்குமான பலன்",
      onClick: onOpenRasipalan,
    },
    {
      id: "muhurta", icon: Sunrise, color: "var(--color-high)",
      nameEn: "Muhurta Finder", nameTa: "முகூர்த்தம்",
      descEn: "Best date for an event", descTa: "நிகழ்விற்கான சிறந்த தேதி",
      onClick: onOpenMuhurta,
    },
    {
      id: "compatibility", icon: HeartHandshake, color: "var(--color-accent-secondary)",
      nameEn: "Compatibility", nameTa: "பொருத்தம்",
      descEn: "Porutham for two charts", descTa: "இரு ஜாதகங்களுக்கும் பொருத்தம்",
      onClick: onOpenCompatibility, gateOnProfile: true,
    },
    {
      id: "chartgen", icon: ScrollText, color: "var(--color-accent-strong)",
      nameEn: "Generate Jadhagam", nameTa: "ஜாதகம் உருவாக்கு",
      descEn: "Full horoscope as PDF", descTa: "முழு ஜாதகம் PDF ஆக",
      onClick: onOpenChartGen,
    },
    {
      id: "activityTiming", icon: Timer, color: "var(--color-high)",
      nameEn: "Best Days This Month", nameTa: "இந்த மாத சிறந்த நாட்கள்",
      descEn: "For travel, signing, moving", descTa: "பயணம், ஒப்பந்தம், இடமாற்றம்",
      onClick: onOpenActivityTiming, gateOnProfile: true,
    },
    {
      id: "varshaphala", icon: CalendarClock, color: "var(--color-accent-strong)",
      nameEn: "Annual Chart", nameTa: "வர்ஷபலம்",
      descEn: "Your year ahead", descTa: "உங்கள் இந்த ஆண்டு பலன்",
      onClick: onOpenVarshaphala, gateOnProfile: true,
    },
    {
      id: "journal", icon: NotebookPen, color: "var(--color-accent-secondary)",
      nameEn: "Journal", nameTa: "குறிப்பேடு",
      descEn: "Log your day", descTa: "நாளைப் பதிவு செய்",
      onClick: onGoToJournal,
    },
    {
      id: "explore", icon: Compass, color: "var(--color-high)",
      nameEn: "Explore & Learn", nameTa: "ஆராயுங்கள் & கற்றுக்கொள்",
      descEn: "Nakshatram, dosham, yogam", descTa: "நட்சத்திரம், தோஷம், யோகம்",
      onClick: onGoToExplore,
    },
  ];

  return (
    <div className="ui-card ui-card--pad-sm" style={{ display: "flex", flexDirection: "column" }}>
      <GlanceHeader
        lang={lang}
        title="Quick Links"
        titleTa="விரைவு இணைப்புகள்"
        linkLabel={lang === "ta" ? "அனைத்து கருவிகளும் →" : "All tools →"}
        onLink={onGoToAllTools}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
        {LINKS.map((link) => {
          const disabled = Boolean(link.gateOnProfile && needsProfile);
          return (
            <button
              key={link.id}
              type="button"
              className="ui-card ui-card--pad-sm"
              onClick={link.onClick}
              disabled={disabled || !link.onClick}
              style={{
                display: "flex", flexDirection: "column", gap: "8px", textAlign: "left",
                cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.55 : 1,
                fontFamily: "inherit", width: "100%",
              }}
            >
              <span aria-hidden="true" style={{ flex: "none", width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", color: link.color }}>
                <link.icon size={17} strokeWidth={2} />
              </span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-strong)", lineHeight: 1.25 }}>
                {lang === "ta" ? link.nameTa : link.nameEn}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.3 }}>
                {lang === "ta" ? link.descTa : link.descEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const TREND_META: Record<"UP" | "DOWN" | "STABLE", { arrow: string; color: string }> = {
  UP: { arrow: "↑", color: "var(--color-high)" },
  DOWN: { arrow: "↓", color: "var(--color-low)" },
  STABLE: { arrow: "→", color: "var(--color-mid)" },
};

/** Plain-language "what this life-area score means", for the tile tooltip.
 *  Deliberately framed as a standing *outlook* ("how it fares now"), NOT a
 *  muhurtam — that is what keeps a "Health 44" tile from reading as a
 *  contradiction of the activity board's "Medical procedures · Neutral": the
 *  two answer different questions (your outlook vs. a good day to begin).
 *  Keyed on the stable uppercase area id (see _AREA_LABELS, life_areas_service). */
const LIFE_AREA_EXPLANATION: Record<string, { en: string; ta: string }> = {
  CAREER: { en: "Your work and profession — how career matters are faring for you now.", ta: "உங்கள் வேலை மற்றும் தொழில் இப்போது எப்படி உள்ளது." },
  MONEY: { en: "Income, savings and money matters over this period.", ta: "வருமானம், சேமிப்பு, பண விஷயங்கள் இந்தக் காலத்தில்." },
  WEALTH: { en: "Assets, savings and longer-term prosperity over this period.", ta: "சொத்து, சேமிப்பு, நீண்டகால செழிப்பு இந்தக் காலத்தில்." },
  HEALTH: { en: "Your wellbeing and vitality — how your health is trending now.", ta: "உங்கள் உடல்நலம் மற்றும் ஆரோக்கியம் இப்போது எப்படி உள்ளது." },
  RELATIONSHIPS: { en: "Your close relationships, marriage and partnerships right now.", ta: "உங்கள் நெருங்கிய உறவுகள், திருமணம், கூட்டாண்மை இப்போது." },
  EDUCATION: { en: "Learning, studies and skill-building — how they're supported now.", ta: "கற்றல், படிப்பு, திறன் வளர்ச்சி இப்போது எப்படி ஆதரிக்கப்படுகிறது." },
  SPIRITUAL: { en: "Your inner life and spiritual growth over this period.", ta: "உங்கள் உள் வாழ்க்கை மற்றும் ஆன்மீக வளர்ச்சி இந்தக் காலத்தில்." },
  SPIRITUALITY: { en: "Your inner life and spiritual growth over this period.", ta: "உங்கள் உள் வாழ்க்கை மற்றும் ஆன்மீக வளர்ச்சி இந்தக் காலத்தில்." },
  FAMILY_HARMONY: { en: "Peace and harmony within your family right now.", ta: "உங்கள் குடும்பத்தில் அமைதி மற்றும் ஒற்றுமை இப்போது." },
  CHILDREN: { en: "Matters concerning children and progeny right now.", ta: "பிள்ளைகள் தொடர்பான விஷயங்கள் இப்போது." },
  PROPERTY: { en: "Home, land and property matters over this period.", ta: "வீடு, நிலம், சொத்து விஷயங்கள் இந்தக் காலத்தில்." },
  FOREIGN: { en: "Travel, relocation and foreign connections right now.", ta: "பயணம், இடமாற்றம், வெளிநாட்டு தொடர்புகள் இப்போது." },
  LITIGATION: { en: "Legal matters, disputes and court affairs right now.", ta: "சட்ட விஷயங்கள், தகராறுகள், வழக்குகள் இப்போது." },
};

function lifeAreaExplanation(area: string, lang: Lang): string | null {
  const e = LIFE_AREA_EXPLANATION[(area || "").toUpperCase()];
  return e ? (lang === "ta" ? e.ta : e.en) : null;
}

/** Life Areas (five stat tiles with trend arrows) + Dasa Chapter. */
export function DashboardTodayLifeAreasDasaRowNova({
  lang,
  personalChartSummary,
  dasha,
  dashaAntar,
  selectedDate,
  lifeAreas,
  onGoToChart,
  onGoToLifeAreas,
}: {
  lang: Lang;
  personalChartSummary: ChartSummaryData | null;
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  selectedDate: string;
  lifeAreas?: LifeAreasResponseData | null;
  onGoToChart?: () => void;
  onGoToLifeAreas?: () => void;
}) {
  const currentAntarIdx = dashaAntar.findIndex((item) => item.startDate <= selectedDate && selectedDate <= item.endDate);
  const nextAntar = currentAntarIdx >= 0 ? dashaAntar[currentAntarIdx + 1] : null;

  const maha = dasha?.current.mahadasha ?? null;
  let elapsedPct: number | null = null;
  let yearsLeft: number | null = null;
  let mahaStartYear: number | null = null;
  let mahaEndYear: number | null = null;
  if (maha) {
    const start = new Date(maha.startDate).getTime();
    const end = new Date(maha.endDate).getTime();
    const now = new Date(selectedDate).getTime();
    if (end > start) {
      elapsedPct = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
      yearsLeft = Math.max(0, (end - now) / (365.25 * 24 * 3600 * 1000));
      mahaStartYear = new Date(maha.startDate).getFullYear();
      mahaEndYear = new Date(maha.endDate).getFullYear();
    }
  }

  return (
    <div className="nova-grid-la-dasa nova-stagger">
      {/* Life areas: stat tiles with trend arrows. No sparklines — the API
          exposes today's score + trend direction, not a history series, so a
          curve would be invented data. */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px 20px" }}>
        <GlanceHeader
          lang={lang}
          title="Life Areas"
          titleTa="வாழ்க்கைத் துறைகள்"
          linkLabel={lang === "ta" ? "அனைத்தும் →" : "All areas →"}
          onLink={onGoToLifeAreas}
        />
        {/* Visible horizon cue: these are a *period* outlook (your dasha + slow
            transits), not a daily number — stated on the card, not just in a
            hover tooltip, so users don't read them on the same "today" clock as
            the dial and the "Is today okay for…?" board. */}
        <div style={{ fontSize: "11.5px", color: "var(--color-faint)", marginTop: "-8px", marginBottom: "13px" }}>
          {lang === "ta" ? "இந்தக் காலகட்டத்தின் நிலை — தினசரி அல்ல" : "Your outlook this period — not a daily score"}
        </div>
        {lifeAreas?.areas && lifeAreas.areas.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))", gap: "10px" }}>
            {lifeAreas.areas.slice(0, 5).map((area) => {
              const score = Math.round(area.score);
              const color = scoreColorScale(score);
              const band = getScoreBand(score);
              // UXD-14 — pair the band colour with its verdict word so the tile
              // is readable without relying on hue (colour-blind safe).
              const verdictWord = getScoreVerdict(score, lang).verdict;
              const trend = TREND_META[area.trend] ?? TREND_META.STABLE;
              const explanation = lifeAreaExplanation(area.area, lang);
              return (
                <div
                  key={area.area}
                  title={explanation ? `${explanation}\n${band.label} · ${score}/100` : `${band.label} · ${score}/100`}
                  style={{ background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", border: `1px solid ${scoreColorAlpha(color, 30)}`, borderRadius: "12px", padding: "12px 12px" }}
                >
                  <div style={{ fontSize: "11.5px", color: "var(--color-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {lang === "ta" ? area.label.ta : area.label.en}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginTop: "6px" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--color-text-strong)", lineHeight: 1 }}>{score}</span>
                    <span aria-hidden="true" style={{ fontSize: "13px", color: trend.color }}>{trend.arrow}</span>
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color, marginTop: "6px", lineHeight: 1.15 }}>{verdictWord}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{t("guidance_empty", lang)}</p>
        )}
      </div>

      {/* Dasa chapter */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px 20px", display: "flex", flexDirection: "column" }}>
        <GlanceHeader
          lang={lang}
          title="Dasa Chapter"
          titleTa="தசா"
          linkLabel={lang === "ta" ? "திற →" : "Open →"}
          onLink={onGoToChart}
        />
        {personalChartSummary ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
                {tPlanetLord(personalChartSummary.currentMahadasha, lang)} <span style={{ color: "var(--color-faint)" }}>→</span> {tPlanetLord(personalChartSummary.currentAntardasha, lang)}
              </div>
              {(() => {
                const sentiment = dashaSentiment(
                  personalChartSummary.currentAntardasha,
                  personalChartSummary.functionalNature?.[personalChartSummary.currentAntardasha],
                  lang,
                );
                return (
                  <span style={{ fontSize: "11px", fontWeight: 600, color: sentiment.color, background: "color-mix(in srgb, currentColor 10%, transparent)", border: "1px solid color-mix(in srgb, currentColor 30%, transparent)", borderRadius: "999px", padding: "4px 12px", whiteSpace: "nowrap" }}>
                    {sentiment.label}
                  </span>
                );
              })()}
            </div>
            {/* Two different clocks, both labeled: the sub-period (antardasha)
                ends on nextAntar.startDate — often months out — while
                yearsLeft is how much of the whole mahadasha *chapter*
                remains. "in chapter" keeps the second from reading as a
                contradiction of the first. */}
            {(nextAntar || yearsLeft !== null) && (
              <div style={{ fontSize: "12.5px", color: "var(--color-muted)", marginTop: "10px" }}>
                {nextAntar && (
                  <>
                    {lang === "ta" ? "உட் தசை " : "Sub-period until "}
                    {new Date(nextAntar.startDate).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { month: "short", year: "numeric" })}
                    {lang === "ta" ? " வரை" : ""}
                  </>
                )}
                {nextAntar && yearsLeft !== null && " · "}
                {yearsLeft !== null && (
                  <>{yearsLeft.toFixed(1)} {lang === "ta" ? "ஆண்டுகள் மீதம் (அத்தியாயம்)" : "yrs left in chapter"}</>
                )}
              </div>
            )}
            <div style={{ flex: 1 }} />
            {elapsedPct !== null && (
              <>
                <div style={{ position: "relative", height: "5px", borderRadius: "3px", background: "color-mix(in srgb, var(--color-text-strong) 10%, transparent)", marginTop: "16px" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${elapsedPct}%`, background: "linear-gradient(90deg, var(--color-accent-secondary), var(--color-accent))", borderRadius: "3px" }} />
                  <span style={{ position: "absolute", left: `${elapsedPct}%`, top: "50%", transform: "translate(-50%, -50%)", width: "11px", height: "11px", borderRadius: "50%", background: "var(--color-text-strong)", border: "2px solid var(--color-surface)" }} />
                </div>
                <div style={{ position: "relative", fontSize: "11px", color: "var(--color-faint)", marginTop: "8px", height: "15px" }}>
                  {mahaStartYear !== null && <span style={{ position: "absolute", left: 0 }}>{mahaStartYear}</span>}
                  <span style={{ position: "absolute", left: `${Math.max(8, Math.min(92, elapsedPct))}%`, transform: "translateX(-50%)", color: "var(--color-text)", fontWeight: 600 }}>
                    {lang === "ta" ? "இப்போது" : "Now"}
                  </span>
                  {mahaEndYear !== null && <span style={{ position: "absolute", right: 0 }}>{mahaEndYear}</span>}
                </div>
              </>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{t("chart_no_profile", lang)}</p>
        )}
      </div>
    </div>
  );
}

// Anchor-planet glyph + accent. Kept as tiny local maps rather than importing
// the private `GRAHA_GLYPH`/`NOVA_PLANET_COLOR` from dashboard-hybrid-parts /
// dashboard-life-areas-remedies-nova — those files pull heavy siblings, and a
// 9-entry symbol map is cheaper to inline than to risk the framer-motion
// lazy-chunk load issue (see memory: UI Barrel Framer ChunkLoadError). Colours
// mirror the existing Nova per-planet precedent so the two surfaces agree.
const GRAHA_GLYPH: Record<string, string> = {
  SUN: "☉", MOON: "☾", MARS: "♂", MERCURY: "☿", JUPITER: "♃",
  VENUS: "♀", SATURN: "♄", RAHU: "☊", KETU: "☋",
};
const GRAHA_COLOR: Record<string, string> = {
  SUN: "var(--color-accent-strong)", JUPITER: "var(--color-accent-strong)",
  MOON: "var(--color-accent-secondary)", VENUS: "var(--color-accent-secondary)",
  MARS: "var(--color-low)", MERCURY: "var(--color-high)",
  SATURN: "var(--planet-other)", RAHU: "var(--color-text)", KETU: "var(--color-text)",
};

/** "Remedy For You" — the chart-driven card. Leads with the running dasa lord
 *  (its glyph + accent), a plain-language reason, the anchor planet's three real
 *  catalog acts (temple offering + two seva strands, each tagged by its genuine
 *  cadence — never a per-chart "strongest" ranking), and the planet's weekday +
 *  next date. Falls back to the flat `remedyFallback` string when the backend
 *  sent no structured focus (older cached daily-guidance rows). */
function RemedyFocusCard({
  lang, focus, remedyFallback, savingReminder, reminderMessage, onSaveReminder, onGoToLifeAreas,
}: {
  lang: Lang;
  focus: RemedyFocus | null;
  remedyFallback: BiText | null;
  savingReminder: boolean;
  reminderMessage: string | null;
  onSaveReminder: () => void;
  onGoToLifeAreas?: () => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const accent = (focus && GRAHA_COLOR[focus.planet]) || "var(--color-accent-secondary)";
  const glyph = (focus && GRAHA_GLYPH[focus.planet]) || "❋";
  const nextDate = focus ? formatDateLabel(nextWeekdayDate(focus.weekday)).replace(/ \d{4}$/, "") : "";

  return (
    <div style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--color-accent-secondary) 12%, transparent), color-mix(in srgb, var(--color-text-strong) 2%, transparent))", border: "1px solid color-mix(in srgb, var(--color-accent-secondary) 30%, transparent)", borderRadius: "var(--radius-lg)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Header: planet glyph + eyebrow/title, with a "Why this?" affordance. */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div aria-hidden="true" style={{ width: "38px", height: "38px", borderRadius: "50%", background: `color-mix(in srgb, ${accent} 16%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: "19px", flex: "none", lineHeight: 1 }}>{glyph}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {focus && (
            <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.11em", textTransform: "uppercase", color: accent, marginBottom: "1px" }}>
              {tPlanetLord(focus.planet, lang)} {t("remedy_focus_dasa", lang)}
            </div>
          )}
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-strong)" }}>{t("remedy_focus_title", lang)}</div>
        </div>
        {focus && (
          <button
            type="button"
            onClick={() => setShowWhy((v) => !v)}
            aria-expanded={showWhy}
            style={{ flex: "none", fontSize: "11.5px", fontWeight: 600, background: "transparent", color: "var(--color-accent-secondary)", border: "1px solid color-mix(in srgb, var(--color-accent-secondary) 35%, transparent)", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
          >
            {t("remedy_focus_why", lang)} {showWhy ? "↑" : "→"}
          </button>
        )}
      </div>

      {/* Lead sentence — the chart reason, active language only. */}
      <p style={{ margin: 0, fontFamily: "var(--font-nova-prose), Georgia, serif", fontSize: "14.5px", lineHeight: 1.65, color: "var(--color-text)" }}>
        {focus ? tLang(focus.lead, lang) : (remedyFallback ? tLang(remedyFallback, lang) : t("remedy_focus_none", lang))}
      </p>

      {focus && showWhy && (
        <p style={{ margin: 0, padding: "10px 12px", borderRadius: "10px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", fontSize: "12.5px", lineHeight: 1.55, color: "var(--color-muted)" }}>
          {tLang(focus.why, lang)}
        </p>
      )}

      {/* Three concrete acts, each with its genuine cadence tag. */}
      {focus && focus.actions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {focus.actions.map((action, i) => (
            <div key={i} style={{ display: "flex", gap: "11px", padding: "11px 0", borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
              <span aria-hidden="true" style={{ flex: "none", width: "7px", height: "7px", borderRadius: "50%", background: accent, marginTop: "6px" }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--color-text)", lineHeight: 1.4 }}>{tLang(action.text, lang)}</div>
                <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-faint)", marginTop: "3px" }}>
                  {action.cadence === "RITUAL_ON_DAY" ? t("remedy_cadence_ritual", lang) : t("remedy_cadence_anyday", lang)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekday + next date — chart-driven display only (no per-day scheduling). */}
      {focus && (
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-muted)" }}>
          {t("remedy_focus_best_on", lang)} {tWeekday(focus.weekday, lang)} · {t("remedy_focus_next", lang)} {nextDate}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onSaveReminder}
          disabled={savingReminder}
          title={reminderMessage ?? undefined}
          style={{ fontSize: "12px", fontWeight: 700, background: "var(--color-accent)", color: "var(--color-on-accent)", border: "none", borderRadius: "8px", padding: "9px 16px", cursor: savingReminder ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
        >
          {savingReminder ? t("remedy_focus_reminder_saving", lang) : t("remedy_focus_reminder", lang)}
        </button>
        {onGoToLifeAreas && (
          <button
            type="button"
            onClick={onGoToLifeAreas}
            style={{ fontSize: "12px", fontWeight: 600, background: "transparent", color: "var(--color-accent-secondary)", border: "1px solid color-mix(in srgb, var(--color-accent-secondary) 35%, transparent)", borderRadius: "8px", padding: "9px 16px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
          >
            {t("remedy_focus_more", lang)}
          </button>
        )}
      </div>
    </div>
  );
}

/** Family Today (member star tiles + shared-window strip) + Remedy For You. */
export function DashboardTodayFamilyRemedyRowNova({
  lang,
  familyAggregate,
  remedy,
  remedyFocus,
  savingReminder,
  reminderMessage,
  onSaveReminder,
  onGoToFamily,
  onGoToLifeAreas,
}: {
  lang: Lang;
  familyAggregate: FamilyAggregateData | null;
  remedy: BiText | null;
  remedyFocus?: RemedyFocus | null;
  savingReminder: boolean;
  reminderMessage: string | null;
  onSaveReminder: () => void;
  onGoToFamily?: () => void;
  onGoToLifeAreas?: () => void;
}) {
  return (
    <div className="nova-grid-2 nova-stagger">
      {/* Family today: one score ring per member, same ScoreRing the Family
          tab uses (dashboard-family-shared.tsx) — exact score + colour, so
          two members in the same coarse verdict band (e.g. both "Balanced")
          still read as visibly different rather than looking duplicated.
          The verdict word below is looked up through getScoreVerdictFromGuidance
          (was: the raw backend label token printed as-is, unlocalised, and
          identical for every score in that label's band). */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px 20px" }}>
        <GlanceHeader
          lang={lang}
          title="Family Today"
          titleTa="குடும்பம்"
          linkLabel={lang === "ta" ? "குடும்பம் →" : "Family →"}
          onLink={onGoToFamily}
        />
        {familyAggregate && familyAggregate.members.length > 0 ? (
          <>
            {/* Lead with the *family's* composite score, not the owner's tile.
                The owner used to sit first in the member row and read as "you =
                the family"; the household's own aggregate is what this section
                is about, so it leads, and the owner drops to being one member
                tile among the rest. */}
            {(() => {
              const fverdict = getScoreVerdictFromGuidance(familyAggregate.familyLabel, familyAggregate.familyScore, lang);
              return (
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "2px 2px 14px", marginBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
                  <ScoreRing score={familyAggregate.familyScore} size={54} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "12px", color: "var(--color-muted)", fontWeight: 600 }}>
                      {lang === "ta" ? "இன்று குடும்பம் ஒட்டுமொத்தம்" : "Family overall today"}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: "var(--color-text-strong)", lineHeight: 1 }}>{familyAggregate.familyScore}</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: fverdict.color }}>{fverdict.verdict}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
            {(() => {
              // The synthetic owner row (familyMemberId === birthProfileId) is
              // dropped from the per-member tiles: the root user's own score
              // now lives in the composite lead above, not repeated as a tile
              // here. Remaining tiles are the *other* household members.
              const otherMembers = familyAggregate.members.filter((m) => m.familyMemberId !== m.birthProfileId);
              const needsCare = otherMembers.find((m) => getScoreBand(m.individualScore).tone === "low");
              const shared = familyAggregate.bestFamilyWindows[0];
              const memberCount = familyAggregate.members.length;
              return (
                <>
                  {otherMembers.length > 0 && (
                    <>
                      <div style={{ fontSize: "11px", color: "var(--color-faint)", fontWeight: 600, marginBottom: "9px" }}>
                        {lang === "ta" ? "மற்ற உறுப்பினர்கள்" : "Other members"}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: "10px" }}>
                        {otherMembers.slice(0, 3).map((m) => {
                          const verdict = getScoreVerdictFromGuidance(m.label, m.individualScore, lang);
                          return (
                            <div
                              key={m.familyMemberId}
                              role="group"
                              aria-label={`${m.displayName} — ${verdict.verdict}, ${m.individualScore} / 100`}
                              title={`${verdict.verdict} · ${m.individualScore}/100`}
                              style={{
                                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "8px",
                                background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", border: "1px solid var(--color-border)",
                                borderRadius: "12px", padding: "14px 10px", minWidth: 0,
                              }}
                            >
                              <ScoreRing score={m.individualScore} size={44} />
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                                {m.displayName}
                              </div>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: verdict.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                                {verdict.verdict}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Only the first 3 other members show here; the rest are
                          one click away in Family. */}
                      {otherMembers.length > 3 && (
                        <button
                          type="button"
                          onClick={onGoToFamily}
                          style={{
                            display: "block", width: "100%", textAlign: "left", fontFamily: "inherit",
                            background: "none", border: "none", padding: 0, marginTop: "9px", cursor: onGoToFamily ? "pointer" : "default",
                            fontSize: "11.5px", fontWeight: 600, color: "var(--color-accent-secondary)",
                          }}
                        >
                          {lang === "ta"
                            ? `+ மேலும் ${otherMembers.length - 3} பேர் →`
                            : `+${otherMembers.length - 3} more →`}
                        </button>
                      )}
                    </>
                  )}
                  {(needsCare || shared) && (
                <div
                  title={shared
                    ? (lang === "ta"
                      ? `இன்று குடும்ப உறுப்பினர்கள் ${memberCount} பேரின் நல்ல நேரங்களும் ஒன்று சேரும் நேரம் — கூட்டு முடிவுகள், குடும்ப பேச்சு, ஒன்றாக செல்லும் வேலைகளுக்கு ஏற்றது.`
                      : `When all ${memberCount} family members' favourable windows overlap today, from each person's own chart — a good slot for joint decisions, family talks or doing things together.`)
                    : undefined}
                  style={{
                    fontSize: "12px", lineHeight: 1.5, color: "var(--color-muted)",
                    background: needsCare ? "var(--color-low-bg)" : "var(--color-accent-muted)",
                    border: `1px solid ${needsCare ? "var(--color-low-border)" : "var(--color-border)"}`,
                    borderRadius: "10px", padding: "10px 13px", marginTop: "10px",
                  }}
                >
                  {needsCare && <><b style={{ color: "var(--color-low)" }}>{needsCare.displayName}</b> {lang === "ta" ? "— மென்மையான நாள்" : "— gentle day"}{shared ? "; " : "."}</>}
                  {shared && <>{lang === "ta" ? `${memberCount} பேருக்கும் நல்ல நேரம்` : `good time for all ${memberCount}`} <b style={{ color: "var(--color-high)" }}>{formatClockLabel(shared.start)} – {formatClockLabel(shared.end)}</b></>}
                </div>
                  )}
                </>
              );
            })()}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{lang === "ta" ? "குடும்ப உறுப்பினர்கள் இல்லை" : "No family members yet"}</p>
        )}
      </div>

      {/* Remedy for you — chart-driven anchor-planet remedy (2026-07-24). */}
      <RemedyFocusCard
        lang={lang}
        focus={remedyFocus ?? null}
        remedyFallback={remedy}
        savingReminder={savingReminder}
        reminderMessage={reminderMessage}
        onSaveReminder={onSaveReminder}
        onGoToLifeAreas={onGoToLifeAreas}
      />
    </div>
  );
}

/** "Coming up" — still a one-liner, now full width. */
export function DashboardTodayComingUpNova({
  lang,
  peyarchiUpcoming,
  personalSani,
  onGoToCalendar,
}: {
  lang: Lang;
  peyarchiUpcoming: PeyarchiEvent[];
  personalSani: SaniCycleData | null;
  onGoToCalendar?: () => void;
}) {
  const primary = peyarchiUpcoming[0] ?? null;
  const isNear = primary ? primary.daysFromToday <= 3 : false;
  const saniActive = personalSani?.moonBasedCycle.isActive ?? false;

  return (
    <button
      type="button"
      onClick={onGoToCalendar}
      style={{
        display: "flex", alignItems: "center", gap: "11px", textAlign: "left", cursor: onGoToCalendar ? "pointer" : "default",
        width: "100%", minWidth: 0, boxSizing: "border-box",
        background: isNear || saniActive ? "linear-gradient(135deg, var(--color-accent-muted), rgba(212,175,95,0.03))" : "color-mix(in srgb, var(--color-text-strong) 3%, transparent)",
        border: `1px solid ${isNear || saniActive ? "var(--color-border-strong)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)", padding: "13px 18px", fontFamily: "inherit",
      }}
    >
      <span style={{ color: isNear || saniActive ? "var(--color-accent-strong)" : "var(--color-high)", fontSize: "14px", flex: "none" }}>
        {isNear || saniActive ? "◆" : "✓"}
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: "12.5px", color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        <b style={{ color: "var(--color-text-strong)" }}>{lang === "ta" ? "வரவிருப்பது" : "Coming up"}</b>
        {" — "}
        {primary
          ? <>{lang === "ta" ? primary.labelTa : primary.labelEn} · {daysAwayLabel(primary.daysFromToday, lang)}</>
          : (lang === "ta" ? "இந்த வாரம் பெரிய மாற்றம் இல்லை." : "No major transit shifts this week.")}
        {saniActive && (
          <> · <span style={{ color: "var(--color-low)" }}>{personalSani?.moonBasedCycle.supportiveLabel ?? personalSani?.moonBasedCycle.type}</span></>
        )}
      </span>
    </button>
  );
}
