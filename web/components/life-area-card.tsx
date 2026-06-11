"use client";

import { getScoreBand } from "@/lib/format";
import { t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { LifeAreaData } from "@/lib/types";

interface LifeAreaCardProps {
  area: LifeAreaData;
  lang: Lang;
  ageRelevant: boolean;
  onOpenDetail?: () => void;
}

const FACTOR_LABELS: Record<string, { ta: string; en: string }> = {
  dasha_activates_area: { en: "Current dasha activates this area", ta: "தற்போதைய தசை இந்த பகுதியை செயல்படுத்துகிறது" },
  house_av_strong: { en: "Ashtakavarga bindus strong (>=28)", ta: "அஷ்டகவர்க்க பிந்துக்கள் வலிமையானவை (>=28)" },
  house_av_weak: { en: "Ashtakavarga bindus weak (<=22)", ta: "அஷ்டகவர்க்க பிந்துக்கள் பலவீனமானவை (<=22)" },
  too_young: { en: "Not yet the typical age for this area", ta: "இந்த பகுதிக்கான பொதுவான வயது இன்னும் வரவில்லை" },
  age_limit: { en: "Past the typical active age", ta: "இந்த பகுதியின் செயலூக்கமான வயது கடந்துவிட்டது" },
};

function humaniseFactorKey(key: string, lang: Lang): string {
  const base = FACTOR_LABELS[key];
  if (base) return lang === "ta" ? base.ta : base.en;
  const planetPrefixMatch = key.match(/^(SUN|MOON|MARS|MERCURY|JUPITER|VENUS|SATURN|RAHU|KETU)_(.+)$/);
  if (planetPrefixMatch) {
    const [, planet, suffix] = planetPrefixMatch;
    const suffixLabel =
      suffix === "karaka_strong"
        ? (lang === "ta" ? "காரகன் வலிமை" : "karaka strong")
        : suffix === "karaka_weak"
        ? (lang === "ta" ? "காரகன் பலவீனம்" : "karaka weak")
        : suffix === "lord_strong"
        ? (lang === "ta" ? "அதிபதி வலிமை" : "house lord strong")
        : suffix === "lord_weak"
        ? (lang === "ta" ? "அதிபதி பலவீனம்" : "house lord weak")
        : suffix === "transit_supportive"
        ? (lang === "ta" ? "கிரகநகர்வு ஆதரவு" : "transit supportive")
        : suffix === "transit_difficult"
        ? (lang === "ta" ? "கிரகநகர்வு சவால்" : "transit difficult")
        : suffix.replaceAll("_", " ");
    return `${planet}: ${suffixLabel}`;
  }
  return key.replaceAll("_", " ");
}

function WarningGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: "12px", height: "12px" }}>
      <path d="M12 3l9 17H3L12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function LifeAreaCard({ area, lang, ageRelevant, onOpenDetail }: LifeAreaCardProps) {
  const scoreBand = getScoreBand(area.score);

  const barColor =
    scoreBand.tone === "high" ? "var(--color-score-high)"
      : scoreBand.tone === "low" ? "var(--color-score-low)"
        : "var(--color-score-mid)";

  const trendLabel = area.trend === "UP" ? "UP" : area.trend === "DOWN" ? "DOWN" : "FLAT";
  const trendColor = area.trend === "UP" ? "var(--color-score-high)" : area.trend === "DOWN" ? "var(--color-score-low)" : "var(--color-score-mid)";

  return (
    <div
      style={{
        padding: "var(--space-6) var(--space-7)",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        opacity: ageRelevant ? 1 : 0.32,
        boxShadow: "0 2px 12px rgba(60,40,20,0.06)",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2_5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {tLang(area.label, lang)}
          </p>
          {area.isGoalFocus && (
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "999px",
                background: "#F0D9C4",
                color: "#8C3E18",
                border: "1px solid rgba(184,90,44,0.3)",
              }}
            >
              {lang === "ta" ? "உங்கள் இலக்கு" : "Your focus"}
            </span>
          )}
        </div>
        <span style={{ fontSize: "0.625rem", fontWeight: 700, color: trendColor, letterSpacing: "0.06em" }}>{trendLabel}</span>
      </div>

      <p style={{ margin: "0 0 var(--space-2_5)", fontFamily: "var(--font-display)", fontSize: "3.6rem", fontWeight: 500, lineHeight: 1, color: "var(--color-text-strong)", letterSpacing: "-0.03em" }}>
        {area.score}
        <span style={{ fontFamily: "var(--font-body)", fontSize: "1rem", fontWeight: 400, color: "var(--color-faint)", marginLeft: "var(--space-0_5)" }}>/100</span>
      </p>

      <div style={{ height: "var(--space-1)", borderRadius: "var(--radius-pill)", background: "var(--color-border)", marginBottom: "var(--space-4)", overflow: "hidden" }}>
        <div style={{ width: `${area.score}%`, height: "100%", borderRadius: "var(--radius-pill)", background: barColor }} />
      </div>

      <p style={{ margin: "0 0 var(--space-4)", fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.6 }}>
        {tLang(area.narrative, lang)}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border)" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--color-faint)" }}>
          {t("life_area_karaka", lang)} · {lang === "ta" ? "கிரகம்" : "planet"}
        </span>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>{area.driver?.planet ?? "—"}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1_5)", marginTop: "var(--space-2_5)" }}>
        <span style={{ fontSize: "0.625rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-0_5) var(--space-2)", color: "var(--color-muted)" }}>
          {lang === "ta" ? "முக்கிய வீடு" : "Primary house"}: {area.primaryHouseStrength}
        </span>
        <span style={{ fontSize: "0.625rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-0_5) var(--space-2)", color: "var(--color-muted)" }}>
          {lang === "ta" ? "காரக நிலை" : "Karaka"}: {area.karakaStatus}
        </span>
        <span style={{ fontSize: "0.625rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-0_5) var(--space-2)", color: area.dashaActivation ? "var(--color-score-high)" : "var(--color-faint)" }}>
          {area.dashaActivation ? (lang === "ta" ? "தசை செயல்பாடு" : "Dasha active") : (lang === "ta" ? "தசை நடுநிலை" : "Dasha neutral")}
        </span>
        <span style={{ fontSize: "0.625rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-0_5) var(--space-2)", color: "var(--color-muted)" }}>
          {lang === "ta" ? "கிரகநகர்வு ஆதரவு" : "Transit support"}: {area.transitSupport}
        </span>
      </div>

      {((area.supportingFactors?.length ?? 0) > 0 || (area.blockingFactors?.length ?? 0) > 0) && (
        <div style={{ marginTop: "var(--space-2_5)", display: "grid", gap: "var(--space-1)" }}>
          {(area.supportingFactors ?? []).slice(0, 3).map((factor) => (
            <p key={`support-${factor}`} style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-score-high)", lineHeight: 1.4 }}>
              + {humaniseFactorKey(factor, lang)}
            </p>
          ))}
          {(area.blockingFactors ?? []).slice(0, 3).map((factor) => (
            <p key={`block-${factor}`} style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-score-low)", lineHeight: 1.4 }}>
              - {humaniseFactorKey(factor, lang)}
            </p>
          ))}
        </div>
      )}

      <div style={{ marginTop: "var(--space-2_5)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
        <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {lang === "ta" ? "அடுத்த 30 நாட்கள்" : "Next 30 days"}
        </p>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text)", lineHeight: 1.45 }}>{tLang(area.next30DayOutlook, lang)}</p>
      </div>

      {area.caution && (
        <div style={{ marginTop: "var(--space-3)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#8c3e18", lineHeight: 1.45, display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
            <WarningGlyph />
            {tLang(area.caution, lang)}
          </p>
        </div>
      )}

      {area.remedy && (
        <div style={{ marginTop: "var(--space-2_5)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "#F0D9C4", border: "1px solid rgba(184,90,44,0.25)" }}>
          <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-score-mid)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {t("remedy_label", lang)}
          </p>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#7a3412", lineHeight: 1.45 }}>{tLang(area.remedy, lang)}</p>
        </div>
      )}

      {onOpenDetail && (
        <button
          type="button"
          onClick={onOpenDetail}
          style={{
            alignSelf: "flex-end",
            marginTop: "var(--space-3)",
            padding: "var(--space-1) var(--space-4)",
            borderRadius: "var(--radius-pill)",
            border: "1.5px solid var(--color-border-strong)",
            background: "transparent",
            color: "var(--color-muted)",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "border-color 120ms ease, color 120ms ease",
          }}
        >
          {lang === "ta" ? "விவரம்" : "Details"}
        </button>
      )}
    </div>
  );
}
