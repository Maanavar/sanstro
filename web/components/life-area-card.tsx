"use client";

import { getScoreBand } from "@/lib/format";
import { WarningGlyph } from "./icons";
import { t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { LifeAreaData } from "@/lib/types";
import { readingPhrase, readingTone } from "@/lib/reasoning";

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
  // Connection-match dasha keys (life_areas_service → dasha_activation.py).
  dasha_lords_bhava: { en: "Dasha lord owns this house", ta: "தசை அதிபதியே இந்த வீட்டின் அதிபதி" },
  dasha_lords_related_house: { en: "Dasha lord owns a supporting house", ta: "தசை அதிபதி துணை வீட்டின் அதிபதி" },
  dasha_is_karaka: { en: "Dasha lord is the area karaka", ta: "தசை அதிபதியே இந்த பகுதியின் காரகன்" },
  dasha_occupies_bhava: { en: "Dasha lord sits in this house", ta: "தசை அதிபதி இந்த வீட்டில் அமர்ந்துள்ளார்" },
  dasha_aspects_bhava: { en: "Dasha lord aspects this house", ta: "தசை அதிபதியின் பார்வை இந்த வீட்டின் மீது உள்ளது" },
  dasha_dispositor_of_bhava_lord: { en: "House lord sits in the dasha lord's sign", ta: "வீட்டு அதிபதி தசை அதிபதியின் ராசியில் உள்ளார்" },
  dasha_node_agent: { en: "Rahu/Ketu dasha delivers a connected planet's results", ta: "ராகு/கேது தசை தொடர்புடைய கிரகத்தின் பலனை தருகிறது" },
  // Bhinnashtakavarga indications counted from the karaka graha's own rasi
  // (app/calculations/bav_derived.py). These read a bindu band on the classical
  // 0-8 scale — deliberately never a number of children or of relatives, which
  // is how these sutras are often misquoted. See
  // docs/BAV_DERIVED_INDICATIONS_2026-08-18.md.
  progeny_bav_strong: {
    en: "Guru's bindus support the 5th from Guru — a classical progeny indication",
    ta: "குருவின் பிந்துக்கள், குருவிலிருந்து 5ஆம் இடத்திற்கு நல்ல வலிமை அளிக்கின்றன — புத்திர பாக்கியத்திற்கு நல்ல அறிகுறி",
  },
  siblings_bav_strong: {
    en: "Sevvai's bindus support the 3rd from Sevvai — sahodara indications are well placed",
    ta: "செவ்வாயின் பிந்துக்கள், செவ்வாயிலிருந்து 3ஆம் இடத்திற்கு நல்ல வலிமை அளிக்கின்றன — சகோதர உறவிற்கு நல்ல அறிகுறி",
  },
  siblings_bav_thin: {
    en: "Sevvai's bindus are thin in the 3rd from Sevvai — sahodara support is lighter",
    ta: "செவ்வாயிலிருந்து 3ஆம் இடத்தில் பிந்துக்கள் குறைவாக உள்ளன — சகோதர உறவிற்கான ஆதரவு குறைவாக உள்ளது",
  },
  maternal_bav_strong: {
    en: "Budhan's bindus support the 4th from Budhan — the maternal line is well placed",
    ta: "புதனின் பிந்துக்கள், புதனிலிருந்து 4ஆம் இடத்திற்கு நல்ல வலிமை அளிக்கின்றன — தாய்வழி உறவிற்கு நல்ல அறிகுறி",
  },
  maternal_bav_thin: {
    en: "Budhan's bindus are thin in the 4th from Budhan — the maternal line has lighter support",
    ta: "புதனிலிருந்து 4ஆம் இடத்தில் பிந்துக்கள் குறைவாக உள்ளன — தாய்வழி உறவிற்கான ஆதரவு குறைவாக உள்ளது",
  },
  paternal_bav_strong: {
    en: "Suriyan's bindus support the 9th from Suriyan — the paternal line is well placed",
    ta: "சூரியனின் பிந்துக்கள், சூரியனிலிருந்து 9ஆம் இடத்திற்கு நல்ல வலிமை அளிக்கின்றன — தந்தைவழி உறவிற்கு நல்ல அறிகுறி",
  },
  paternal_bav_thin: {
    en: "Suriyan's bindus are thin in the 9th from Suriyan — the paternal line has lighter support",
    ta: "சூரியனிலிருந்து 9ஆம் இடத்தில் பிந்துக்கள் குறைவாக உள்ளன — தந்தைவழி உறவிற்கான ஆதரவு குறைவாக உள்ளது",
  },
  // Named affliction keys (life_areas_service → bhava_afflictions.py).
  papa_kartari_hems_house: { en: "Papa kartari — malefics hem this house", ta: "பாப கர்த்தரி — இரு பக்கமும் பாப கிரகங்கள்" },
  shubha_kartari_protects_house: { en: "Shubha kartari — benefics protect this house", ta: "சுப கர்த்தரி — இரு பக்கமும் சுப கிரகங்கள்" },
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
        : suffix === "occupies_house"
        ? (lang === "ta" ? "இந்த வீட்டில் அமர்வு" : "occupies this house")
        : suffix === "aspects_house"
        ? (lang === "ta" ? "இந்த வீட்டின் மீது பார்வை" : "aspects this house")
        : suffix.replaceAll("_", " ");
    return `${planet}: ${suffixLabel}`;
  }
  return key.replaceAll("_", " ");
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
          <p className="cd-kicker--inline" style={{ letterSpacing: "0.1em" }}>
            {tLang(area.label, lang)}
          </p>
          {area.isGoalFocus && (
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "999px",
                background: "var(--chart-d1-lagna-bg)",
                color: "var(--planet-lagna)",
                border: "1px solid rgba(184,90,44,0.3)",
              }}
            >
              {lang === "ta" ? "உங்கள் இலக்கு" : "Your focus"}
            </span>
          )}
          {/* D4 contradiction reading (reasoning Phase 3): additive, present
              only when reasoning_contradiction is on. The server already
              rewrites the narrative below for PROMISED_NOT_NOW/NOT_PROMISED/
              ACTIVE_BUT_UNPROMISED; this chip surfaces the raw state for
              every area, including the ones that don't change the copy. */}
          {area.reading && (
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "999px",
                background: readingTone(area.reading).bg,
                color: readingTone(area.reading).text,
                border: `1px solid ${readingTone(area.reading).border}`,
              }}
            >
              {readingPhrase(area.reading, lang)}
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

      {/* Root-cause chain (reasoning Phase 5): when the server sends a
          "because ... therefore ..." reading for LOW-confidence areas, it
          replaces the flat factor list below. */}
      {area.causalChain && (
        <p style={{ margin: "var(--space-2_5) 0 0", fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.55, fontStyle: "italic" }}>
          {tLang(area.causalChain, lang)}
        </p>
      )}

      {!area.causalChain && ((area.supportingFactors?.length ?? 0) > 0 || (area.blockingFactors?.length ?? 0) > 0) && (
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
        <p className="cd-kicker" style={{ margin: "0 0 var(--space-0_5)", letterSpacing: "0.08em" }}>
          {lang === "ta" ? "அடுத்த 30 நாட்கள்" : "Next 30 days"}
        </p>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text)", lineHeight: 1.45 }}>{tLang(area.next30DayOutlook, lang)}</p>
      </div>

      {area.caution && (
        <div style={{ marginTop: "var(--space-3)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--panel-warm-tint)", border: "1px solid rgba(168,72,47,0.3)" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--planet-lagna)", lineHeight: 1.45, display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
            <WarningGlyph />
            {tLang(area.caution, lang)}
          </p>
        </div>
      )}

      {area.remedy && (
        <div style={{ marginTop: "var(--space-2_5)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--chart-d1-lagna-bg)", border: "1px solid rgba(184,90,44,0.25)" }}>
          <p className="cd-kicker" style={{ margin: "0 0 var(--space-0_5)", color: "var(--color-mid-text)", letterSpacing: "0.08em" }}>
            {t("remedy_label", lang)}
          </p>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text)", lineHeight: 1.45 }}>{tLang(area.remedy, lang)}</p>
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
