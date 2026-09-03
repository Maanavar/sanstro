"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ScrollText, Sunrise, Sparkles, Timer, Hash, HeartHandshake, NotebookPen, Compass,
  ArrowRight, ArrowUp, ArrowDown, Diamond, Check,
  type LucideIcon,
} from "lucide-react";

import { formatClockLabel, formatDateLabel, getLifeAreaVerdict, getScoreBand, getScoreVerdictFromGuidance, nextWeekdayDate, scoreColorAlpha } from "@/lib/format";
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
import { Card, Kicker } from "./ui";

/** Chandrashtama for one family member, straight off the aggregate's cycle
 *  tags (app/services/family_vault_service.py appends "CHANDRASHTAMA" when
 *  that member's own gochar says so) — the Family tab reads the same tag. */
function memberIsChandrashtama(member: { activeCycleTags: string[] }): boolean {
  return member.activeCycleTags.includes("CHANDRASHTAMA");
}

/**
 * Today-tab glance sections (homepage redesign 2026-07-18):
 *   - Life Areas + Dasa Chapter row (nova-grid-la-dasa)
 *   - Family Today + Remedy For You row (nova-grid-2); "Coming up" is folded
 *     into Family Today's footer (2026-08-20) rather than its own strip
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
      return { label: lang === "ta" ? "முயற்சியால் வளரும் காலம்" : "grows with effort", color: "var(--color-mid-text)" };
    }
    if (_NATURE_TESTING.has(functionalNature)) {
      return { label: lang === "ta" ? "சவாலான காலம் · மெதுவாக செல்லுங்கள்" : "testing period · go gently", color: "var(--color-low)" };
    }
    if (_NATURE_STEADY.has(functionalNature)) {
      return { label: lang === "ta" ? "நடுநிலையான காலம்" : "steady, mixed period", color: "var(--color-mid-text)" };
    }
  }
  // Fallback: natural benefic/malefic split (no chart-specific data yet).
  if (_DASHA_BENEFIC.has(antardashaLord)) {
    return { label: lang === "ta" ? "ஆதரவான காலம்" : "supportive period", color: "var(--color-high)" };
  }
  if (_DASHA_CHALLENGING.has(antardashaLord)) {
    return { label: lang === "ta" ? "சவாலான காலம் · மெதுவாக செல்லுங்கள்" : "testing period · go gently", color: "var(--color-low)" };
  }
  return { label: lang === "ta" ? "நடுநிலையான காலம்" : "steady, mixed period", color: "var(--color-mid-text)" };
}

function daysAwayLabel(days: number, lang: Lang): string {
  if (days < 60) return lang === "ta" ? `${days} நாட்களில்` : `in ${days} days`;
  const months = Math.round(days / 30);
  return lang === "ta" ? `${months} மாதங்களில்` : `in ${months} mo`;
}

/** Shared section header: title (in the active language only) + trailing link or custom right-side content. */
export function GlanceHeader({
  lang,
  title,
  titleTa,
  linkLabel,
  onLink,
  right,
}: {
  lang: Lang;
  title: string;
  titleTa: string;
  linkLabel?: string;
  onLink?: () => void;
  /** Custom trailing content (e.g. a note + scroll controls) in place of the link button. */
  right?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginBottom: "14px" }}>
      {/* audit B-1: shared section header is a real <h2>, so every Today
          section (Life Areas, Dasa, Family, Coming up) lands in the outline. */}
      <h2 style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-strong)" }}>
        {lang === "ta" ? titleTa : title}
      </h2>
      {right}
      {onLink && linkLabel && (
        <button
          type="button"
          onClick={onLink}
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, whiteSpace: "nowrap" }}
        >
          {linkLabel}
          <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
      {!onLink && !right && <span style={{ marginLeft: "auto" }} />}
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
  onOpenNumerology,
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
  onOpenNumerology?: () => void;
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
      id: "numerology", icon: Hash, color: "var(--color-accent-secondary)",
      nameEn: "Numerology", nameTa: "எண் கணிதம்",
      descEn: "What your name & numbers say", descTa: "உங்கள் பெயர் & எண்கள் சொல்வது",
      onClick: onOpenNumerology, gateOnProfile: true,
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
    <Card compact>
      <GlanceHeader
        lang={lang}
        title="Quick Links"
        titleTa="விரைவு இணைப்புகள்"
        linkLabel={lang === "ta" ? "அனைத்து கருவிகளும்" : "All tools"}
        onLink={onGoToAllTools}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "var(--space-2_5)" }}>
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
                display: "flex", flexDirection: "column", gap: "var(--space-2)", textAlign: "left",
                cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.55 : 1,
                fontFamily: "inherit", width: "100%",
              }}
            >
              <span aria-hidden="true" style={{ flex: "none", width: "36px", height: "36px", borderRadius: "var(--radius-pill)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", color: link.color }}>
                <link.icon size={17} strokeWidth={2} />
              </span>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)", lineHeight: 1.25 }}>
                {lang === "ta" ? link.nameTa : link.nameEn}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.3 }}>
                {lang === "ta" ? link.descTa : link.descEn}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/** The tile's trend arrow. It now carries the engine's real six-month slope
 *  (`score` vs `score6mo`, the same engine re-run against the transits and
 *  dasha in force then), so it finally means the direction every reader
 *  already takes an arrow to mean. It previously restated whether the current
 *  score was high or low — "Money 16 ↓" did not say money was falling — and
 *  was `aria-hidden` with no text anywhere, so it said nothing at all to a
 *  screen reader. Now that it measures something, it gets named. */
const TREND_META: Record<"UP" | "DOWN" | "STABLE", { Icon: LucideIcon; color: string; en: string; ta: string }> = {
  UP: { Icon: ArrowUp, color: "var(--color-high)", en: "improving over the next 6 months", ta: "அடுத்த 6 மாதங்களில் ஏற்றம்" },
  DOWN: { Icon: ArrowDown, color: "var(--color-low)", en: "easing over the next 6 months", ta: "அடுத்த 6 மாதங்களில் இறக்கம்" },
  STABLE: { Icon: ArrowRight, color: "var(--color-mid-text)", en: "holding steady over the next 6 months", ta: "அடுத்த 6 மாதங்களில் நிலையானது" },
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
      <Card style={{ display: "block" }}>
        <GlanceHeader
          lang={lang}
          title="Life Areas"
          titleTa="வாழ்க்கைத் துறைகள்"
          linkLabel={lang === "ta" ? "அனைத்தும்" : "All areas"}
          onLink={onGoToLifeAreas}
        />
        {/* Visible horizon cue: these are a *period* outlook (your dasha + slow
            transits), not a daily number — stated on the card, not just in a
            hover tooltip, so users don't read them on the same "today" clock as
            the dial and the "Is today okay for…?" board. */}
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", marginTop: "-8px", marginBottom: "13px" }}>
          {lang === "ta" ? "இந்தக் காலகட்டத்தின் நிலை — தினசரி அல்ல" : "Your outlook this period — not a daily score"}
        </div>
        {lifeAreas?.areas && lifeAreas.areas.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))", gap: "var(--space-2_5)" }}>
            {lifeAreas.areas.slice(0, 5).map((area) => {
              const score = Math.round(area.score);
              // UXD-14 — pair the band colour with its verdict word so the tile
              // is readable without relying on hue (colour-blind safe). Both now
              // come from the *period* ladder, not the daily one: "Good day"
              // here read as a verdict on today, which is what made these tiles
              // look like they contradicted the "Is today okay for…?" board
              // ("Money / Wealth 16 · Take care" vs "Money decisions · Neutral").
              // The board answers "is today an auspicious day to *begin* this";
              // this tile answers "how is this area faring this period". Naming
              // the horizon in the word itself carries the distinction onto all
              // five tiles, where a one-line disclaimer above them did not.
              const { verdict: verdictWord, color } = getLifeAreaVerdict(score, lang);
              const trend = TREND_META[area.trend] ?? TREND_META.STABLE;
              const trendLabel = lang === "ta" ? trend.ta : trend.en;
              const explanation = lifeAreaExplanation(area.area, lang);
              // The one ~2-day input inside an otherwise months-long number:
              // Chandrashtamam docks 8 points from the mind-sensitive areas. Left
              // unnamed, the tile would silently drop 8 and could cross a verdict
              // boundary overnight with nothing on screen accounting for it.
              const chandra = area.chandrashtamaApplied === true;
              const chandraNote = chandra
                ? lang === "ta"
                  ? "இன்று சந்திராஷ்டமம் — இந்த மதிப்பெண் 8 புள்ளிகள் குறைக்கப்பட்டுள்ளது. இது கடந்ததும் திரும்பும்."
                  : "Chandrashtamam today — this score is docked 8 points, and recovers when it passes."
                : null;
              const tooltip = [explanation, `${verdictWord} · ${score}/100 · ${trendLabel}`, chandraNote]
                .filter(Boolean)
                .join("\n");
              return (
                <div
                  key={area.area}
                  title={tooltip}
                  style={{ background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", border: `1px solid ${scoreColorAlpha(color, 30)}`, borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-3)" }}
                >
                  {/* Two lines, always — not one line with an ellipsis. A
                      married native's Relationships tile is relabelled "Married
                      life harmony" by the engine, which at this width truncated
                      to "Married life harm…". Height is reserved even for the
                      one-line labels so every score in the row stays on the same
                      baseline. */}
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.25, minHeight: "2.5em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {lang === "ta" ? area.label.ta : area.label.en}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-1)", marginTop: "6px" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-text-strong)", lineHeight: 1 }}>{score}</span>
                    <span role="img" aria-label={trendLabel} style={{ display: "inline-flex", color: trend.color }}><trend.Icon size={14} strokeWidth={2} aria-hidden="true" /></span>
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color, marginTop: "6px", lineHeight: 1.15 }}>{verdictWord}</div>
                  {/* Amber, not red — "awareness, not alarm", the same framing the
                      Chandrashtama pill uses on the hero and the family tiles. */}
                  {chandra && (
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-mid-text)", marginTop: "4px", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      🌘 {lang === "ta" ? "சந்திராஷ்டமம்" : "Chandrashtama"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)" }}>{t("guidance_empty", lang)}</p>
        )}
      </Card>

      {/* Dasa chapter */}
      <Card style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <GlanceHeader
          lang={lang}
          title="Dasa Chapter"
          titleTa="தசா"
          linkLabel={lang === "ta" ? "திற" : "Open"}
          onLink={onGoToChart}
        />
        {personalChartSummary ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-accent-strong)" }}>
                {tPlanetLord(personalChartSummary.currentMahadasha, lang)} <ArrowRight size={16} strokeWidth={2} aria-hidden="true" style={{ verticalAlign: "middle", color: "var(--color-faint)" }} /> {tPlanetLord(personalChartSummary.currentAntardasha, lang)}
              </div>
              {(() => {
                const sentiment = dashaSentiment(
                  personalChartSummary.currentAntardasha,
                  personalChartSummary.functionalNature?.[personalChartSummary.currentAntardasha],
                  lang,
                );
                return (
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: sentiment.color, background: "color-mix(in srgb, currentColor 10%, transparent)", border: "1px solid color-mix(in srgb, currentColor 30%, transparent)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)", whiteSpace: "nowrap" }}>
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
              <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", marginTop: "10px" }}>
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
                <div style={{ position: "relative", height: "5px", borderRadius: "var(--radius-sm)", background: "color-mix(in srgb, var(--color-text-strong) 10%, transparent)", marginTop: "16px" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${elapsedPct}%`, background: "linear-gradient(90deg, var(--color-accent-secondary), var(--color-accent))", borderRadius: "var(--radius-sm)" }} />
                  <span style={{ position: "absolute", left: `${elapsedPct}%`, top: "50%", transform: "translate(-50%, -50%)", width: "11px", height: "11px", borderRadius: "var(--radius-pill)", background: "var(--color-text-strong)", border: "2px solid var(--color-surface)" }} />
                </div>
                <div style={{ position: "relative", fontSize: "var(--text-xs)", color: "var(--color-faint)", marginTop: "8px", height: "15px" }}>
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
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)" }}>{t("chart_no_profile", lang)}</p>
        )}
      </Card>
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
 *  sent no structured focus (older cached daily-guidance rows).
 *
 *  With more than one household member it also carries the member rail — one
 *  scrollable row of graha-marked chips (2026-08-14), replacing the pill row +
 *  `<input type="range">` + ‹ › arrow trio that all wrote the same index. See
 *  `.nova-remedy-rail` in dashboard-nova.css for why the range had to go. */
type RemedyMemberOption = {
  memberId: string;
  displayName: string;
  remedy: BiText | null;
  remedyFocus?: RemedyFocus | null;
};

function RemedyFocusCard({
  lang, focus, remedyFallback, remedyMembers = [], savingReminder, reminderMessage, onSaveReminder, onGoToLifeAreas,
}: {
  lang: Lang;
  focus: RemedyFocus | null;
  remedyFallback: BiText | null;
  remedyMembers?: RemedyMemberOption[];
  savingReminder: boolean;
  reminderMessage: string | null;
  onSaveReminder: () => void;
  onGoToLifeAreas?: () => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  // Whether the rail is scrolled to its start/end — drives the CSS edge fade.
  const [railEdges, setRailEdges] = useState({ atStart: true, atEnd: true });
  const railRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // This card is rendered beneath a lazily loaded Suspense boundary. `useId()`
  // encodes that boundary's render path, which can differ when the client has
  // not loaded the chunk at hydration time; React then leaves mismatched IDs in
  // place. There is one remedy rail per Today tab, so stable scoped IDs retain
  // the tab/panel relationship without depending on the render path.
  const idBase = "nova-remedy-focus";

  const members = remedyMembers.length > 0
    ? remedyMembers
    : [{ memberId: "owner", displayName: lang === "ta" ? "நீங்கள்" : "You", remedy: remedyFallback, remedyFocus: focus }];
  const selectedIndex = Math.max(0, members.findIndex((m) => m.memberId === selectedMemberId));
  const selectedMember = members[selectedIndex] ?? members[0];
  const selectedFocus = selectedMember?.remedyFocus ?? null;
  const selectedRemedy = selectedMember?.remedy ?? null;
  const hasMemberRail = members.length > 1;
  // The caller builds this list owner-first (dashboard-today-tab-nova.tsx), so
  // index 0 is the signed-in reader — the only member "for you" is true of.
  const isOwnerSelected = selectedIndex === 0;
  const accent = (selectedFocus && GRAHA_COLOR[selectedFocus.planet]) || "var(--color-accent-secondary)";
  const glyph = (selectedFocus && GRAHA_GLYPH[selectedFocus.planet]) || "❋";
  const nextDate = selectedFocus ? formatDateLabel(nextWeekdayDate(selectedFocus.weekday)).replace(/ \d{4}$/, "") : "";
  const panelId = `${idBase}-panel`;
  const tabId = (index: number) => `${idBase}-tab-${index}`;

  // Chips carry the called name only, so a rail of four still fits a phone —
  // the same trim the hero greeting makes, and never a re-spelling: the full
  // display name stays intact in the chip's title and in the card heading. If
  // two members share a first name the trim would make the chips ambiguous, so
  // the whole rail falls back to full names rather than labelling two chips
  // identically.
  const firstNames = members.map((m) => m.displayName.trim().split(/\s+/)[0] || m.displayName);
  const chipNames = new Set(firstNames).size === firstNames.length ? firstNames : members.map((m) => m.displayName);

  function selectMember(index: number) {
    const next = members[Math.max(0, Math.min(members.length - 1, index))];
    if (!next) return;
    setSelectedMemberId(next.memberId);
    setShowWhy(false);
  }

  // Tab-strip keyboard contract (WAI-ARIA APG, matching <Segmented>): arrows
  // move and select, Home/End jump to the ends, and focus follows so the next
  // arrow press continues from where the reader is. The old pill row carried
  // role="tab" with none of this — the role promised keyboard behaviour the
  // markup never implemented.
  function onRailKeyDown(event: React.KeyboardEvent, index: number) {
    const jump = (to: number) => {
      const clamped = (to + members.length) % members.length;
      event.preventDefault();
      selectMember(clamped);
      chipRefs.current[clamped]?.focus();
    };
    if (event.key === "ArrowRight" || event.key === "ArrowDown") jump(index + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") jump(index - 1);
    else if (event.key === "Home") jump(0);
    else if (event.key === "End") jump(members.length - 1);
  }

  // Keep the selected chip in view when the rail overflows. Gated on an actual
  // selection so a card that mounts below the fold never scroll-jacks the page
  // on first paint. (`?.` on the method as well — jsdom has no scrollIntoView.)
  useEffect(() => {
    if (!selectedMemberId) return;
    chipRefs.current[selectedIndex]?.scrollIntoView?.({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedIndex, selectedMemberId]);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () => {
      const atStart = el.scrollLeft <= 1;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      setRailEdges((prev) => (prev.atStart === atStart && prev.atEnd === atEnd ? prev : { atStart, atEnd }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [hasMemberRail, members.length]);

  return (
    <div style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--color-accent-secondary) 12%, transparent), color-mix(in srgb, var(--color-text-strong) 2%, transparent))", border: "1px solid color-mix(in srgb, var(--color-accent-secondary) 30%, transparent)", borderRadius: "var(--radius-lg)", padding: "var(--space-4_5) var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-3_5)" }}>
      {/* Whose remedy — one rail, at the top of the card, because everything
          below it (heading included) belongs to the selected member and so has
          to sit inside the tabpanel the rail controls. */}
      {hasMemberRail && (
        <div
          ref={railRef}
          className="nova-remedy-rail"
          role="tablist"
          aria-label={t("remedy_focus_member_rail", lang)}
          aria-orientation="horizontal"
          data-scroll-start={railEdges.atStart}
          data-scroll-end={railEdges.atEnd}
        >
          {members.map((member, index) => {
            const isSelected = index === selectedIndex;
            const memberFocus = member.remedyFocus ?? null;
            return (
              <button
                key={member.memberId}
                ref={(el) => { chipRefs.current[index] = el; }}
                type="button"
                role="tab"
                id={tabId(index)}
                aria-selected={isSelected}
                aria-controls={panelId}
                tabIndex={isSelected ? 0 : -1}
                title={member.displayName}
                onClick={() => selectMember(index)}
                onKeyDown={(event) => onRailKeyDown(event, index)}
                className="nova-remedy-chip"
                style={{ "--chip-accent": (memberFocus && GRAHA_COLOR[memberFocus.planet]) || "var(--color-accent-secondary)" } as React.CSSProperties}
              >
                {/* Each chip wears its own member's anchor graha, so the rail
                    shows what changes when you move along it — a row of
                    identical pills gave no reason to expect anything would. */}
                <span className="nova-remedy-chip__glyph" aria-hidden="true">
                  {(memberFocus && GRAHA_GLYPH[memberFocus.planet]) || "❋"}
                </span>
                <span className="nova-remedy-chip__name">{chipNames[index]}</span>
              </button>
            );
          })}
        </div>
      )}

      <div
        key={selectedMember?.memberId ?? "owner"}
        className="nova-remedy-panel"
        id={panelId}
        role={hasMemberRail ? "tabpanel" : undefined}
        aria-labelledby={hasMemberRail ? tabId(selectedIndex) : undefined}
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-3_5)" }}
      >
        {/* Header: planet glyph + eyebrow/title, with a "Why this?" affordance. */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
          <div aria-hidden="true" style={{ width: "38px", height: "38px", borderRadius: "var(--radius-pill)", background: `color-mix(in srgb, ${accent} 16%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: "var(--text-lg)", flex: "none", lineHeight: 1 }}>{glyph}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedFocus && (
              <Kicker as="div" color={accent} style={{ marginBottom: "1px" }}>
                {tPlanetLord(selectedFocus.planet, lang)} {t("remedy_focus_dasa", lang)}
              </Kicker>
            )}
            {/* "Remedy for you" is only true while the owner is selected. Read
                someone else's and the heading names them instead — the old card
                kept the first-person title over a sibling's remedy. */}
            <div style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-strong)" }}>
              {isOwnerSelected
                ? t("remedy_focus_title", lang)
                : `${selectedMember?.displayName ?? ""} · ${t("remedy_focus_title_short", lang)}`}
            </div>
          </div>
          {selectedFocus && (
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-xs)", fontWeight: 600, background: "transparent", color: "var(--color-accent-secondary)", border: "1px solid color-mix(in srgb, var(--color-accent-secondary) 35%, transparent)", borderRadius: "var(--radius-sm)", padding: "var(--space-1) var(--space-2_5)", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              {t("remedy_focus_why", lang)} {showWhy ? <ArrowUp size={12} strokeWidth={2} aria-hidden="true" /> : <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />}
            </button>
          )}
        </div>

        {/* Lead sentence — the chart reason, active language only. */}
        <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "var(--text-base)", lineHeight: 1.65, color: "var(--color-text)" }}>
          {selectedFocus ? tLang(selectedFocus.lead, lang) : (selectedRemedy ? tLang(selectedRemedy, lang) : t("remedy_focus_none", lang))}
        </p>

        {selectedFocus && showWhy && (
          <p style={{ margin: 0, padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-muted)" }}>
            {tLang(selectedFocus.why, lang)}
          </p>
        )}

        {/* Three concrete acts, each with its genuine cadence tag. */}
        {selectedFocus && selectedFocus.actions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {selectedFocus.actions.map((action, i) => (
              <div key={i} style={{ display: "flex", gap: "var(--space-2_5)", padding: "var(--space-2_5) 0", borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                <span aria-hidden="true" style={{ flex: "none", width: "7px", height: "7px", borderRadius: "var(--radius-pill)", background: accent, marginTop: "6px" }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--color-text)", lineHeight: 1.4 }}>{tLang(action.text, lang)}</div>
                  <Kicker as="div" color="var(--color-faint)" style={{ marginTop: "3px" }}>
                    {action.cadence === "RITUAL_ON_DAY" ? t("remedy_cadence_ritual", lang) : t("remedy_cadence_anyday", lang)}
                  </Kicker>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Weekday + next date — chart-driven display only (no per-day scheduling). */}
        {selectedFocus && (
          <Kicker as="div" tone="muted">
            {t("remedy_focus_best_on", lang)} {tWeekday(selectedFocus.weekday, lang)} · {t("remedy_focus_next", lang)} {nextDate}
          </Kicker>
        )}

        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {/* The reminder toggle writes the *account's* morning alert, which
              carries the signed-in user's own daily guidance and never a
              sibling's — offering it under someone else's remedy promised a
              reminder that would arrive about something else. Owner only. */}
          {isOwnerSelected && (
            <button
              type="button"
              onClick={onSaveReminder}
              disabled={savingReminder}
              title={reminderMessage ?? undefined}
              style={{ fontSize: "var(--text-sm)", fontWeight: 700, background: "var(--color-accent)", color: "var(--color-on-accent)", border: "none", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-4)", cursor: savingReminder ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              {savingReminder ? t("remedy_focus_reminder_saving", lang) : t("remedy_focus_reminder", lang)}
            </button>
          )}
          {onGoToLifeAreas && (
            <button
              type="button"
              onClick={onGoToLifeAreas}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, background: "transparent", color: "var(--color-accent-secondary)", border: "1px solid color-mix(in srgb, var(--color-accent-secondary) 35%, transparent)", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-4)", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              {t("remedy_focus_more", lang)}
            </button>
          )}
        </div>
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
  remedyMembers,
  savingReminder,
  reminderMessage,
  onSaveReminder,
  onGoToFamily,
  onGoToLifeAreas,
  peyarchiUpcoming,
  personalSani,
  onGoToCalendar,
}: {
  lang: Lang;
  familyAggregate: FamilyAggregateData | null;
  remedy: BiText | null;
  remedyFocus?: RemedyFocus | null;
  remedyMembers?: RemedyMemberOption[];
  savingReminder: boolean;
  reminderMessage: string | null;
  onSaveReminder: () => void;
  onGoToFamily?: () => void;
  onGoToLifeAreas?: () => void;
  /** "Coming up" now lives as this card's bottom-pinned footer (was a separate
   *  skinny full-width strip below the row) — the Family Today card is short
   *  on its own content for a solo household, and the grid row's stretch
   *  otherwise left it as dead space under a much taller Remedy card. */
  peyarchiUpcoming?: PeyarchiEvent[];
  personalSani?: SaniCycleData | null;
  onGoToCalendar?: () => void;
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
      {/* No display override here: <Card> is already a column flexbox
          (.ui-card in dashboard-nova.css), which is what lets the "Coming up"
          footer below sit with `marginTop: "auto"` and get pushed to the
          bottom of the grid-stretched card instead of leaving a dead gap. */}
      <Card>
        <div>
        <GlanceHeader
          lang={lang}
          title="Family Today"
          titleTa="குடும்பம்"
          linkLabel={lang === "ta" ? "குடும்பம்" : "Family"}
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
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3_5)", padding: "var(--space-0_5) var(--space-0_5) var(--space-3_5)", marginBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
                  <ScoreRing score={familyAggregate.familyScore} size={54} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", fontWeight: 600 }}>
                      {lang === "ta" ? "இன்று குடும்பம் ஒட்டுமொத்தம்" : "Family overall today"}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginTop: "2px" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text-strong)", lineHeight: 1 }}>{familyAggregate.familyScore}</span>
                      <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: fverdict.color }}>{fverdict.verdict}</span>
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
              // Chandrashtama outranks a low score for this one-line callout,
              // and is checked first for a second reason: a member can be in
              // Chandrashtama on a perfectly mid score, in which case the
              // low-band search below would have found nobody and the day
              // would have gone unmentioned entirely.
              const chandraMember = otherMembers.find(memberIsChandrashtama);
              const needsCare = chandraMember ?? otherMembers.find((m) => getScoreBand(m.individualScore).tone === "low");
              const shared = familyAggregate.bestFamilyWindows[0];
              const memberCount = familyAggregate.members.length;
              return (
                <>
                  {otherMembers.length > 0 && (
                    <>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", fontWeight: 600, marginBottom: "9px" }}>
                        {lang === "ta" ? "மற்ற உறுப்பினர்கள்" : "Other members"}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: "var(--space-2_5)" }}>
                        {otherMembers.slice(0, 3).map((m) => {
                          const verdict = getScoreVerdictFromGuidance(m.label, m.individualScore, lang);
                          return (
                            <div
                              key={m.familyMemberId}
                              role="group"
                              aria-label={`${m.displayName} — ${verdict.verdict}, ${m.individualScore} / 100${memberIsChandrashtama(m) ? `, ${lang === "ta" ? "சந்திராஷ்டமம்" : "Chandrashtama"}` : ""}`}
                              title={`${verdict.verdict} · ${m.individualScore}/100`}
                              style={{
                                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "var(--space-2)",
                                background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-md)", padding: "var(--space-3_5) var(--space-2_5)", minWidth: 0,
                              }}
                            >
                              <ScoreRing score={m.individualScore} size={44} />
                              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                                {m.displayName}
                              </div>
                              <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: verdict.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                                {verdict.verdict}
                              </div>
                              {/* The owner gets Chandrashtama named on their own
                                  hero above; a member's tile showed only a score
                                  and a verdict word, so the household's one
                                  Chandrashtama member was invisible here. The
                                  tag already rides along on the aggregate — no
                                  extra request. Amber, matching the hero pill. */}
                              {memberIsChandrashtama(m) && (
                                <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-mid-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                                  🌘 {lang === "ta" ? "சந்திராஷ்டமம்" : "Chandrashtama"}
                                </div>
                              )}
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
                            display: "inline-flex", alignItems: "center", gap: "var(--space-1)", width: "100%", textAlign: "left", fontFamily: "inherit",
                            background: "none", border: "none", padding: 0, marginTop: "9px", cursor: onGoToFamily ? "pointer" : "default",
                            fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-accent-secondary)",
                          }}
                        >
                          {lang === "ta"
                            ? `+ மேலும் ${otherMembers.length - 3} பேர்`
                            : `+${otherMembers.length - 3} more`}
                          <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
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
                    fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-muted)",
                    // Amber for Chandrashtama ("awareness, not alarm", as on
                    // the owner's own hero pill), red only for a low score.
                    background: needsCare === chandraMember && chandraMember ? "var(--color-mid-bg)" : needsCare ? "var(--color-low-bg)" : "var(--color-accent-muted)",
                    border: `1px solid ${needsCare === chandraMember && chandraMember ? "var(--color-mid-border)" : needsCare ? "var(--color-low-border)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-sm)", padding: "var(--space-2_5) var(--space-3)", marginTop: "10px",
                  }}
                >
                  {needsCare && <><b style={{ color: needsCare === chandraMember ? "var(--color-mid)" : "var(--color-low)" }}>{needsCare.displayName}</b> {needsCare === chandraMember ? (lang === "ta" ? "— இன்று சந்திராஷ்டமம்" : "— Chandrashtama today") : (lang === "ta" ? "— மென்மையான நாள்" : "— gentle day")}{shared ? "; " : "."}</>}
                  {shared && <>{lang === "ta" ? `${memberCount} பேருக்கும் நல்ல நேரம்` : `good time for all ${memberCount}`} <b style={{ color: "var(--color-high)" }}>{formatClockLabel(shared.start)} – {formatClockLabel(shared.end)}</b></>}
                </div>
                  )}
                </>
              );
            })()}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)" }}>{lang === "ta" ? "குடும்ப உறுப்பினர்கள் இல்லை" : "No family members yet"}</p>
        )}
        </div>

        {/* Bottom-pinned footer (marginTop: auto) — was the standalone
            full-width "Coming up" strip below this row; folded in here so it
            fills the space this card otherwise leaves empty next to the
            taller Remedy card, instead of just padding it out. */}
        <div style={{ marginTop: "auto", paddingTop: "var(--space-3_5)", borderTop: "1px solid var(--color-border)" }}>
          <DashboardTodayComingUpNova
            lang={lang}
            peyarchiUpcoming={peyarchiUpcoming ?? []}
            personalSani={personalSani ?? null}
            onGoToCalendar={onGoToCalendar}
          />
        </div>
      </Card>

      {/* Remedy for you — chart-driven anchor-planet remedy (2026-07-24). */}
      <RemedyFocusCard
        lang={lang}
        focus={remedyFocus ?? null}
        remedyFallback={remedy}
        remedyMembers={remedyMembers}
        savingReminder={savingReminder}
        reminderMessage={reminderMessage}
        onSaveReminder={onSaveReminder}
        onGoToLifeAreas={onGoToLifeAreas}
      />
    </div>
  );
}

/** "Coming up" — a one-liner, rendered as the Family Today card's footer. */
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
        display: "flex", alignItems: "flex-start", gap: "var(--space-2_5)", textAlign: "left", cursor: onGoToCalendar ? "pointer" : "default",
        width: "100%", minWidth: 0, boxSizing: "border-box",
        background: isNear || saniActive ? "linear-gradient(135deg, var(--color-accent-muted), transparent)" : "color-mix(in srgb, var(--color-text-strong) 3%, transparent)",
        border: `1px solid ${isNear || saniActive ? "var(--color-border-strong)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)", padding: "var(--space-3) var(--space-4_5)", fontFamily: "inherit",
      }}
    >
      {/* Nested inside the Family Today footer now (was a full-width strip),
          so the line wraps instead of ellipsis-truncating — a half-width
          column is much likelier to clip a whole clause than a full row was. */}
      <span style={{ display: "inline-flex", color: isNear || saniActive ? "var(--color-accent-strong)" : "var(--color-high)", flex: "none", marginTop: "2px" }}>
        {isNear || saniActive ? <Diamond size={15} strokeWidth={2} aria-hidden="true" /> : <Check size={15} strokeWidth={2} aria-hidden="true" />}
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5, whiteSpace: "normal" }}>
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
