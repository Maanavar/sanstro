"use client";

import type { Lang } from "@/lib/i18n";

/**
 * Shared framing block for the advanced / experimental astrology lenses
 * (Yogini / Ashtottari / Kalachakra / Jaimini Chara dasha, Solar Return).
 *
 * Issues #7 and #8: users could not tell what these systems are, or whether
 * they feed the daily / matching scores. This states plainly (1) what the lens
 * is and (2) that the Tamil Thirukanitham core (Vimshottari dasha + panchangam)
 * is what actually drives their scores — these panels are study lenses only.
 */
export function AdvancedLensNote({
  lang,
  whatEn,
  whatTa,
  showDegreeNote = false,
}: {
  lang: Lang;
  whatEn: string;
  whatTa: string;
  showDegreeNote?: boolean;
}) {
  const isTamil = lang === "ta";
  return (
    <div
      style={{
        border: "1px solid var(--deepdive-border-light, var(--panel-tan-light))",
        borderRadius: "var(--radius-md)",
        background: "var(--deepdive-surface, var(--panel-cream))",
        padding: "var(--space-2_5) var(--space-3)",
        display: "grid",
        gap: "var(--space-1_5)",
      }}
    >
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--deepdive-ink, var(--panel-earth-dark))", lineHeight: 1.55 }}>
        <strong>{isTamil ? "இது என்ன? " : "What is this? "}</strong>
        {isTamil ? whatTa : whatEn}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--color-faint)", lineHeight: 1.5 }}>
        <strong>{isTamil ? "உங்கள் மதிப்பெண்களுடன் தொடர்பு: " : "Relation to your scores: "}</strong>
        {isTamil
          ? "உங்கள் தினசரி மற்றும் பொருத்த மதிப்பெண்கள் தமிழ் திருக்கணித மையத்திலிருந்து (விம்ஷோத்தரி தசை + பஞ்சாங்கம்) வருகின்றன. இவை துணை/ஒப்பீட்டுப் பார்வைகள் மட்டுமே — கற்றலுக்காகக் காட்டப்படுகின்றன; அந்த மதிப்பெண்களை இவை மாற்றாது."
          : "Your daily and matching scores come from the Tamil Thirukanitham core (Vimshottari dasha + panchangam). These are secondary cross-check lenses shown for study — they do not change those scores."}
      </p>
      {showDegreeNote && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--color-faint)", lineHeight: 1.5 }}>
          <strong>{isTamil ? "துல்லியம்: " : "Precision: "}</strong>
          {isTamil
            ? "மதிப்பெண்களும் பார்வைகளும் வெறும் ராசி நிலையை மட்டும் அல்ல — கிரகங்களின் சரியான பாகை (degree) அடிப்படையிலேயே கணக்கிடப்படுகின்றன (உச்சம்/நீசம், அஸ்தமனம், தசை மீதி, திக்/சேஷ்ட பலம் அனைத்தும் பாகை சார்ந்தவை)."
            : "Scores and aspects are computed from each planet's exact degree — not just its sign. Exaltation/debilitation, combustion, dasha balance, and Dig/Chesta strength all use precise sidereal longitudes."}
        </p>
      )}
    </div>
  );
}
