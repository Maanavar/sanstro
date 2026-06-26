"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, type Variants, useMotionValue, useTransform, animate } from "framer-motion";

function useCountUp(target: number, duration = 0.6) {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    const from = prevTarget.current === target ? 0 : prevTarget.current;
    prevTarget.current = target;
    const controls = animate(motionVal, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}

const scoreGridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.12 } },
};
const scoreRowVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeInOut" } },
};

import { formatClockLabel, scoreColor, SCORE_LOW } from "@/lib/format";
import { t, tLang, tNakshatra, tTithi } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  BirthProfileSnapshot,
  DailyGuidanceData,
  LifeMode,
  PanchangamDailyResponseData,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";
import { getBirthTimeConfidence, getScoreDrivers, type ScoreDriver } from "@/lib/uiux-enhancements";

import { Chip, Surface } from "./dashboard-ui";
import { LifeModeBadge } from "./life-mode-picker";


function driverLabel(driver: ScoreDriver | null, lang: Lang): string {
  if (!driver) return "—";
  if (!driver.reasonKey) return lang === "ta" ? "Pariharam support" : "Remedial support";
  return t(`reason_${driver.reasonKey}` as any, lang);
}

export function DashboardDailySnapshot({
  lang,
  guidance,
  transit,
  sani,
  panchangam,
  birthProfile,
  lifeMode,
  onChangeFocus,
}: {
  lang: Lang;
  guidance: DailyGuidanceData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  panchangam: PanchangamDailyResponseData | null;
  birthProfile: BirthProfileSnapshot | null;
  lifeMode?: LifeMode;
  onChangeFocus?: () => void;
}) {
  const [showDualLanguage, setShowDualLanguage] = useState(false);
  const drivers = useMemo(() => (guidance ? getScoreDrivers(guidance.scoreBreakdown) : null), [guidance]);
  const confidence = getBirthTimeConfidence(birthProfile);
  const animatedScore = useCountUp(guidance?.score ?? 0, 0.7);

  if (!guidance) return null;

  const actionPrimary = tLang(guidance.actionSuggestion, lang);
  const actionSecondary = lang === "ta" ? guidance.actionSuggestion.en : guidance.actionSuggestion.ta;
  const scoreSummaryPrimary = tLang(guidance.text, lang);
  const scoreSummarySecondary = lang === "ta" ? guidance.text.en : guidance.text.ta;

  const confidenceLabel =
    confidence.level === "high"
      ? (lang === "ta" ? "அதிக நம்பகத்தன்மை" : "High confidence")
      : confidence.level === "medium"
        ? (lang === "ta" ? "மிதமான நம்பகத்தன்மை" : "Moderate confidence")
        : confidence.level === "low"
          ? (lang === "ta" ? "குறைந்த நம்பகத்தன்மை" : "Low confidence")
          : (lang === "ta" ? "பிறந்த நேரம் அமைக்கப்படவில்லை" : "Birth time not set");

  return (
    <Surface title={`${t("personal_today", lang)} Snapshot`}>
      <div className="surface__body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <p className="surface__text" style={{ margin: 0 }}>
            {scoreSummaryPrimary}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {lifeMode && onChangeFocus && (
              <LifeModeBadge mode={lifeMode} lang={lang} onClick={onChangeFocus} />
            )}
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setShowDualLanguage((v) => !v)}
              style={{ padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem" }}
            >
              {showDualLanguage ? "Single language" : "TA + EN"}
            </button>
          </div>
        </div>

        {showDualLanguage && (
          <p className="surface__text" style={{ marginTop: "var(--space-2)", color: "var(--color-muted, var(--panel-mid-earth))" }}>
            {scoreSummarySecondary}
          </p>
        )}

        <div className="snapshot-grid">
          <div className="snapshot-box">
            <p className="snapshot-kicker">{lang === "ta" ? "இன்றைய மதிப்பெண்" : "Today's Score"}</p>
            <p className="snapshot-value" style={{ color: scoreColor(guidance.score) }}>{animatedScore}/100</p>
            <p className="snapshot-hint">
              {guidance.label}
              {guidance.emotionalWeather?.tone ? ` · ${guidance.emotionalWeather.tone}` : ""}
            </p>
          </div>

          <div className="snapshot-box">
            <p className="snapshot-kicker">{lang === "ta" ? "சிறந்த நேரம்" : "Best Window"}</p>
            <p className="snapshot-value">
              {guidance.bestWindows[0] ? `${formatClockLabel(guidance.bestWindows[0].start)}-${formatClockLabel(guidance.bestWindows[0].end)}` : "—"}
            </p>
            <p className="snapshot-hint">
              {guidance.cautionWindows[0]
                ? `${lang === "ta" ? "தவிர்க்க" : "Avoid"}: ${formatClockLabel(guidance.cautionWindows[0].start)}-${formatClockLabel(guidance.cautionWindows[0].end)}`
                : lang === "ta" ? "தவிர்ப்பு நேரம் இல்லை" : "No caution window"}
            </p>
          </div>

          <div className="snapshot-box">
            <p className="snapshot-kicker">{lang === "ta" ? "ராகு காலம்" : "Rahu Kalam"}</p>
            <p className="snapshot-value" style={{ color: SCORE_LOW }}>
              {panchangam ? `${formatClockLabel(panchangam.kalam.rahuKalam.start)}-${formatClockLabel(panchangam.kalam.rahuKalam.end)}` : "—"}
            </p>
            <p className="snapshot-hint">
              {transit?.isChandrashtama
                ? (lang === "ta" ? "சந்திராஷ்டமம் - கவனமாக இருக்கவும்" : "Chandrashtama - proceed with care")
                : (lang === "ta" ? "இந்த நேரத்தில் முக்கிய காரியங்கள் செய்யாதீர்கள்" : "Avoid important activities during this time")}
            </p>
          </div>

          <div className="snapshot-box">
            <p className="snapshot-kicker">{lang === "ta" ? "திதி" : "Tithi"}</p>
            <p className="snapshot-value">{panchangam ? tTithi(panchangam.tithi.name, lang) : "—"}</p>
            <p className="snapshot-hint">
              {panchangam
                ? `${lang === "ta" ? "நட்சத்திரம்" : "Nakshatra"}: ${tNakshatra(panchangam.nakshatra.name, lang)} · ${lang === "ta" ? "பாதம்" : "Pada"} ${panchangam.nakshatra.pada}`
                : lang === "ta" ? "ஏற்றப்படவில்லை" : "Not loaded"}
            </p>
          </div>
        </div>

        <div className="snapshot-action">
          <p className="snapshot-kicker" style={{ marginBottom: "var(--space-1)" }}>
            {lang === "ta" ? "இன்றைய முக்கிய செயல்" : "One focused action"}
          </p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text, var(--panel-earth))", lineHeight: 1.5 }}>{actionPrimary}</p>
          {showDualLanguage && actionSecondary && (
            <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.875rem", color: "var(--color-muted, var(--panel-mid-earth))", lineHeight: 1.45 }}>
              {actionSecondary}
            </p>
          )}
        </div>

        <details className="snapshot-details">
          <summary>See why this score</summary>
          <div className="snapshot-details__content">
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
              {drivers?.strongestSupport && (
                <Chip tone="success">
                  Top support: {driverLabel(drivers.strongestSupport, lang)} ({drivers.strongestSupport.value})
                </Chip>
              )}
              {drivers?.strongestCaution && (
                <Chip tone="warning">
                  Top caution: {driverLabel(drivers.strongestCaution, lang)} ({drivers.strongestCaution.value})
                </Chip>
              )}
              <Chip tone="neutral">{confidenceLabel}</Chip>
            </div>

            <motion.div
              className="snapshot-score-grid"
              variants={scoreGridVariants}
              initial="hidden"
              animate="visible"
            >
              {Object.entries(guidance.scoreBreakdown).map(([key, value]) => (
                <motion.div key={key} className="snapshot-score-grid__row" variants={scoreRowVariants}>
                  <span>{key}</span>
                  <strong>{value}</strong>
                </motion.div>
              ))}
            </motion.div>
            {sani?.moonBasedCycle.isActive && (
              <p className="surface__text" style={{ marginTop: "var(--space-2)" }}>
                {sani.confirmationSentence}
              </p>
            )}
          </div>
        </details>
      </div>
    </Surface>
  );
}
