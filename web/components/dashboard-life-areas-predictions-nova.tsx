"use client";

import { useEffect, useState } from "react";
import { Check, AlertTriangle, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { t } from "@/lib/i18n";
import { bandPhrase, bandTone } from "@/lib/reasoning";
import type { Lang } from "@/lib/i18n";
import type { LifeAreaPredictionData, PredictionAstroFactor, PredictionBundle } from "@/lib/types";
import {
  confidenceTone,
  confidenceLabel,
  supportTone,
  supportLabel,
  predictionIsDeferred,
} from "./dashboard-life-areas-shared";
import { NovaFadeIn } from "./dashboard-ui-nova";
import { Kicker } from "./ui/kicker";

/**
 * Nova re-skin of dashboard-prediction-panel.tsx's PredictionDetailPanel —
 * one of the 4 sub-tab panels deferred (Classic-styled) when Life Areas
 * Nova first shipped (Phase 9, docs/DASHBOARD_UI_REVAMP_PLAN.md §6.8).
 *
 * Grepped every var(--...) reference in the Classic file first: most tokens
 * (the chart-cell and warm-tint redirects, the SCORE_HIGH/MID/LOW constants)
 * were already Nova-redirected, but the border colors on every confidence/band
 * chip (the Classic sage/rust/brand edge tints) were not — a near-miss of the
 * already-redirected "-edge"/"-30" siblings, fixed centrally in
 * dashboard-nova.css rather than worked around here (also fixes an
 * already-shipped, unnoticed border-color
 * bug in dashboard-synastry-panel.tsx's Compatibility sub-view and
 * lib/reasoning.ts's bandTone(), used by LifeAreaCard's causalChain path).
 * With that fix, confidenceTone()/bandTone() are both fully Nova-safe, so
 * this file reuses them directly instead of re-deriving new tone logic.
 *
 * All pure derivation (band/confidence tone+label, support tone+label,
 * "is this prediction deferred to a later age phase") is reused via additive
 * `export` on the Classic file — zero behavior change, same class of edit as
 * every prior phase. Only the JSX/layout is rebuilt, using the same
 * accordion structure (one featured/expanded card, the rest collapsed rows)
 * and the same "married" 7th-house reframing and later-phase ordering.
 */

type ExpandState = {
  marriage: boolean;
  career: boolean;
  wealth: boolean;
  health: boolean;
};

type PredictionCardProps = {
  title: string;
  pred: LifeAreaPredictionData;
  lang: Lang;
  expanded: boolean;
  onToggle: () => void;
  featured?: boolean;
  deferred?: boolean;
};

function NovaChevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" style={{ width: "14px", height: "14px", color: "var(--color-faint)", transform: open ? "rotate(180deg)" : "none", transition: "transform 120ms ease", flexShrink: 0 }}>
      <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NovaSupportList({ items, color, lang }: { items: { ta: string; en: string }[]; color: string; lang: Lang }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {items.map((item, index) => (
        <li key={index} style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start", fontSize: "var(--text-base)", lineHeight: 1.5, color: "var(--color-text)" }}>
          <span style={{ color, fontWeight: 700, lineHeight: 1, marginTop: "3px" }} aria-hidden="true">&bull;</span>
          {lang === "ta" ? item.ta : item.en}
        </li>
      ))}
    </ul>
  );
}

// Status -> colour/icon for each underlying astrological factor. SUPPORT reads
// as a lift (green check), CAUTION as a drag (rust triangle), NEUTRAL as
// context (dash). Lucide icons, not Unicode glyphs (audit A6).
function factorStatusStyle(status: PredictionAstroFactor["status"]): { color: string; Icon: LucideIcon } {
  if (status === "SUPPORT") return { color: "var(--color-high)", Icon: Check };
  if (status === "CAUTION") return { color: "var(--color-low)", Icon: AlertTriangle };
  return { color: "var(--color-muted)", Icon: Minus };
}

/**
 * "Why this reading" — the detailed astrology behind a life-area prediction.
 * Every service (career/wealth/health/marriage) already emits an ordered list
 * of astrologicalFactors (house lords, ashtakavarga bindus, dhana/raja yogas,
 * dasha activation, age-phase gates…); the panel simply never rendered them.
 * This surfaces that chain for the root user, mirroring the Today tab's
 * "Why this prediction?" breakdown so the score never feels like a black box.
 */
function NovaWhyThisReading({ factors, lang }: { factors: PredictionAstroFactor[]; lang: Lang }) {
  if (!factors.length) return null;
  return (
    <div>
      <Kicker as="p" style={{ margin: "0 0 3px" }}>
        {lang === "ta" ? "இந்தக் கணிப்பு ஏன்" : "Why this reading"}
      </Kicker>
      <p style={{ margin: "0 0 10px", fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
        {lang === "ta" ? "இதற்குப் பின்னால் உள்ள ஜோதிடக் காரணிகள்" : "the astrological factors behind it"}
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {factors.map((factor, index) => {
          const s = factorStatusStyle(factor.status);
          return (
            <li key={`${factor.key}-${index}`} style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start", fontSize: "var(--text-base)", lineHeight: 1.5, color: "var(--color-text)" }}>
              <span
                aria-hidden="true"
                style={{ flexShrink: 0, marginTop: "1px", width: "18px", height: "18px", borderRadius: "var(--radius-pill)", display: "grid", placeItems: "center", color: s.color, background: "color-mix(in srgb, currentColor 12%, transparent)" }}
              >
                <s.Icon size={12} strokeWidth={2} />
              </span>
              <span>{lang === "ta" ? factor.detail.ta : factor.detail.en}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NovaPredictionDetail({ pred, lang }: { pred: LifeAreaPredictionData; lang: Lang }) {
  return (
    <div style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: pred.challenges.length > 0 ? "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" : "1fr", gap: "var(--space-5)" }}>
        {pred.supports.length > 0 && (
          <div>
            <Kicker as="p" color="var(--color-high)" style={{ margin: "0 0 8px" }}>{t("pred_supports", lang)}</Kicker>
            <NovaSupportList items={pred.supports} color="var(--color-high)" lang={lang} />
          </div>
        )}
        {pred.challenges.length > 0 && (
          <div>
            <Kicker as="p" color="var(--color-mid)" style={{ margin: "0 0 8px" }}>{t("pred_challenges", lang)}</Kicker>
            <NovaSupportList items={pred.challenges} color="var(--color-mid)" lang={lang} />
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-3)" }}>
        <div style={{ borderRadius: "var(--space-3)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", padding: "var(--space-3) var(--space-4)" }}>
          <Kicker as="p" color="var(--color-faint)" style={{ margin: "0 0 3px", letterSpacing: "0.08em" }}>{t("pred_dasha_support", lang)}</Kicker>
          <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: supportTone(pred.dashaSupport) }}>{supportLabel(pred.dashaSupport, lang)}</p>
        </div>

        <div style={{ borderRadius: "var(--space-3)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", padding: "var(--space-3) var(--space-4)" }}>
          <Kicker as="p" color="var(--color-faint)" style={{ margin: "0 0 3px", letterSpacing: "0.08em" }}>{t("pred_transit_support", lang)}</Kicker>
          <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: supportTone(pred.transitSupport) }}>{supportLabel(pred.transitSupport, lang)}</p>
        </div>

        {pred.timingWindowStart && pred.timingWindowEnd && (
          <div style={{ borderRadius: "var(--space-3)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", padding: "var(--space-3) var(--space-4)" }}>
            <Kicker as="p" color="var(--color-faint)" style={{ margin: "0 0 3px", letterSpacing: "0.08em" }}>{t("pred_timing_window", lang)}</Kicker>
            <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>{pred.timingWindowStart} to {pred.timingWindowEnd}</p>
          </div>
        )}
      </div>

      {pred.astrologicalFactors.length > 0 && (
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
          <NovaWhyThisReading factors={pred.astrologicalFactors} lang={lang} />
        </div>
      )}
    </div>
  );
}

function NovaLaterPhaseBadge({ lang }: { lang: Lang }) {
  return (
    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", background: "var(--color-low-bg)", color: "var(--color-low)", border: "1px solid var(--color-low-border)" }}>
      {lang === "ta" ? "பின்வரும் கட்டம்" : "Later phase"}
    </span>
  );
}

function NovaPredictionCard({ title, pred, lang, expanded, onToggle, featured, deferred = false }: PredictionCardProps) {
  const tone = pred.band ? bandTone(pred.band) : confidenceTone(pred.confidence);
  const chipLabel = pred.band ? bandPhrase(pred.band, lang) : confidenceLabel(pred.confidence, lang);

  if (featured && expanded) {
    return (
      <div style={{ borderRadius: "var(--space-4)", border: "1px solid var(--color-border)", background: "var(--color-surface)", overflow: "hidden", fontFamily: "var(--font-body)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr" }}>
          <div style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)", borderRight: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <Kicker as="p" style={{ margin: 0 }}>{title}</Kicker>
              {deferred && <NovaLaterPhaseBadge lang={lang} />}
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", background: tone.bg, color: tone.text, border: `1px solid ${tone.border}` }}>{chipLabel}</span>
            </div>

            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.25rem, 2vw, 1.75rem)", fontWeight: 500, lineHeight: 1.2, color: "var(--color-text-strong)" }}>
              {lang === "ta" ? pred.mainPredictionTa : pred.mainPredictionEn}
            </h2>

            <NovaPredictionDetail pred={pred} lang={lang} />
          </div>

          <div style={{ padding: "var(--space-6)", background: "var(--color-surface-soft)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Kicker as="p" style={{ margin: 0, letterSpacing: "0.08em" }}>{t("pred_confidence", lang)}</Kicker>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: pred.band ? "1.35rem" : "2rem", lineHeight: 1.15, color: tone.text }}>{chipLabel}</p>
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
              {lang === "ta" ? pred.mainPredictionTa : pred.mainPredictionEn}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          style={{ width: "100%", padding: "var(--space-3)", border: 0, borderTop: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-muted)", fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)", cursor: "pointer", fontFamily: "inherit" }}
        >
          <NovaChevron open />
          {lang === "ta" ? "மூடு" : "Collapse"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: "var(--space-3)", border: "1px solid var(--color-border)", background: "var(--color-surface)", overflow: "hidden", fontFamily: "var(--font-body)" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "var(--space-4) var(--space-5)",
          background: expanded ? "var(--color-surface-soft)" : "var(--color-surface)",
          border: 0,
          borderBottom: expanded ? "1px solid var(--color-border)" : "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-4)",
          fontFamily: "inherit",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", margin: "0 0 3px" }}>
            <Kicker as="p" color="var(--color-mid)" style={{ margin: 0 }}>{title}</Kicker>
            {deferred && <NovaLaterPhaseBadge lang={lang} />}
          </div>
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.5 }}>{lang === "ta" ? pred.mainPredictionTa : pred.mainPredictionEn}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", background: tone.bg, color: tone.text, border: `1px solid ${tone.border}` }}>{chipLabel}</span>
          <NovaChevron open={expanded} />
        </div>
      </button>

      {expanded ? <NovaPredictionDetail pred={pred} lang={lang} /> : null}
    </div>
  );
}

type Props = {
  lang: Lang;
  predictions: PredictionBundle | null;
  loading: boolean;
  maritalStatus?: string;
};

export function NovaPredictionsPanel({ lang, predictions, loading, maritalStatus }: Props) {
  const [expanded, setExpanded] = useState<ExpandState>({ marriage: true, career: false, wealth: false, health: false });
  const isMarried = maritalStatus === "married" || maritalStatus === "widowed" || maritalStatus === "divorced";

  function toggle(key: keyof ExpandState) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const marriagePredTitle = isMarried
    ? (lang === "ta" ? "உறவு & குடும்ப இணக்கம்" : "Relationship & Family Harmony")
    : t("pred_marriage_title", lang);

  const items: Array<{ key: keyof ExpandState; title: string; pred: LifeAreaPredictionData | null | undefined }> = [
    { key: "marriage", title: marriagePredTitle, pred: predictions?.marriage },
    { key: "career", title: t("pred_career_title", lang), pred: predictions?.career },
    { key: "wealth", title: t("pred_wealth_title", lang), pred: predictions?.wealth },
    { key: "health", title: t("pred_health_title", lang), pred: predictions?.health },
  ];

  const orderedItems = items
    .filter((item): item is { key: keyof ExpandState; title: string; pred: LifeAreaPredictionData } => Boolean(item.pred))
    .sort((a, b) => {
      const deferredA = predictionIsDeferred(a.pred) ? 1 : 0;
      const deferredB = predictionIsDeferred(b.pred) ? 1 : 0;
      if (deferredA !== deferredB) return deferredA - deferredB;
      const order: Record<keyof ExpandState, number> = { marriage: 0, career: 1, wealth: 2, health: 3 };
      return order[a.key] - order[b.key];
    });

  const firstKey = orderedItems[0]?.key ?? null;

  useEffect(() => {
    if (!firstKey) return;
    setExpanded({ marriage: false, career: false, wealth: false, health: false, [firstKey]: true });
  }, [firstKey]);

  if (loading) {
    return <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>{t("pred_loading", lang)}</p>;
  }

  if (!orderedItems.length) {
    return (
      <div style={{ padding: "var(--space-4) var(--space-5)", borderRadius: "var(--space-3)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", fontFamily: "var(--font-body)" }}>
        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.6 }}>
          {lang === "ta"
            ? "இந்த குடும்ப உறுப்பினரின் கணிப்புகள் தனி பகுப்பாய்வு தேவைப்படுகின்றன. தனிப்பட்ட கணிப்புகளுக்கு உங்கள் சொந்த சுயவிவரத்தை தேர்ந்தெடுக்கவும்."
            : "Predictions are computed for your own profile. Switch to your profile to see your personalised readings, or use Life Events for this member."}
        </p>
      </div>
    );
  }

  return (
    <NovaFadeIn style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", fontFamily: "var(--font-body)" }}>
      {isMarried && predictions?.marriage && (
        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.5, padding: "var(--space-2) var(--space-3)", borderRadius: "var(--space-2)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)" }}>
          {lang === "ta"
            ? "நீங்கள் திருமணமானவர் — 7-ம் வீடு இங்கே உறவு தரம், பாலத்துவம் மற்றும் குடும்ப ஒற்றுமையைக் காட்டுகிறது; புதிய திருமணம் அல்ல."
            : "This person is married — the 7th-house reading here covers relationship quality, partnership, and family cohesion, not a new wedding."}
        </p>
      )}
      {orderedItems.map(({ key, title, pred }) => (
        pred ? (
          <div key={key}>
            <NovaPredictionCard
              title={title}
              pred={pred}
              lang={lang}
              expanded={expanded[key]}
              onToggle={() => toggle(key)}
              featured={key === firstKey}
              deferred={predictionIsDeferred(pred)}
            />
            {/* Medical safeguard — folk users over-read the health card, clinicians
                reject it; both need it framed as not-a-diagnosis (#31). */}
            {key === "health" && expanded.health && (
              <p style={{ margin: "8px 2px 0", fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.5, display: "flex", gap: "var(--space-2)" }}>
                <span aria-hidden="true">⚕</span>
                <span>{t("safeguard_health", lang)}</span>
              </p>
            )}
          </div>
        ) : null
      ))}
    </NovaFadeIn>
  );
}
