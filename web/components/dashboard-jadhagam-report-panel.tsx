"use client";

import React, { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { JadhagamReportData } from "@/lib/types";
import { YogaDoshamPanel } from "./dashboard-yoga-dosham-panel";

// ── Shared section wrapper ────────────────────────────────────────────────────

function Section({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  const borderColor = accent ?? "rgba(255,255,255,0.08)";
  const bgColor = accent ? `${accent}08` : "rgba(255,255,255,0.03)";
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: "10px",
        background: bgColor,
        border: `1px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "0.63rem",
          fontWeight: 700,
          color: accent ?? "rgba(255,255,255,0.35)",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
      <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", minWidth: "130px", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.82)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ── Planetary strength bar ────────────────────────────────────────────────────

const PLANET_NAMES_TA: Record<string, string> = {
  SUN: "சூரியன்", MOON: "சந்திரன்", MARS: "செவ்வாய்", MERCURY: "புதன்",
  JUPITER: "குரு", VENUS: "சுக்கிரன்", SATURN: "சனி", RAHU: "ராகு", KETU: "கேது",
};

function StrengthBar({ planet, score, lang }: { planet: string; score: number; lang: Lang }) {
  const color = score >= 70 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#f87171";
  const label = lang === "ta" ? (PLANET_NAMES_TA[planet] ?? planet) : planet;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", minWidth: "76px" }}>{label}</span>
      <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.08)" }}>
        <div style={{ width: `${score}%`, height: "100%", borderRadius: "3px", background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: "0.67rem", fontWeight: 700, color, minWidth: "30px", textAlign: "right" }}>{score}</span>
    </div>
  );
}

// ── Functional nature badge ───────────────────────────────────────────────────

const NATURE_COLORS: Record<string, string> = {
  LAGNA_LORD: "#4ade80",
  YOGAKARAKA: "#a78bfa",
  TRIKONA: "#60a5fa",
  KENDRA: "#34d399",
  MARAKA: "#f87171",
  DUSTHANA: "#f87171",
  NEUTRAL: "rgba(255,255,255,0.35)",
};

const NATURE_LABELS_TA: Record<string, string> = {
  LAGNA_LORD: "லக்னாதிபதி", YOGAKARAKA: "யோககாரகன்", TRIKONA: "திரிகோண",
  KENDRA: "கேந்திர", MARAKA: "மாரகன்", DUSTHANA: "துஷ்டான", NEUTRAL: "நடுநிலை",
};

function NatureBadge({ planet, nature, lang }: { planet: string; nature: string; lang: Lang }) {
  const color = NATURE_COLORS[nature] ?? "rgba(255,255,255,0.35)";
  const planetLabel = lang === "ta" ? (PLANET_NAMES_TA[planet] ?? planet) : planet;
  const natureLabel = lang === "ta" ? (NATURE_LABELS_TA[nature] ?? nature) : nature.replace(/_/g, " ");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 8px",
        borderRadius: "6px",
        background: `${color}11`,
        border: `1px solid ${color}33`,
      }}
    >
      <span style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{planetLabel}</span>
      <span style={{ fontSize: "0.57rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{natureLabel}</span>
    </div>
  );
}

// ── Age-based focus badge ─────────────────────────────────────────────────────

const FOCUS_AREA_COLORS: Record<string, string> = {
  health: "#4ade80", health_focus: "#4ade80", health_priority: "#4ade80", health_senior: "#4ade80",
  education: "#60a5fa", education_foundation: "#60a5fa",
  career: "#fbbf24", career_preparation: "#fbbf24", career_growth: "#fbbf24",
  career_peak: "#fbbf24", career_legacy: "#fbbf24",
  marriage_prospect: "#f472b6", marriage_stability: "#f472b6",
  wealth_foundation: "#a78bfa", wealth_building: "#a78bfa",
  wealth_consolidation: "#a78bfa", wealth_protection: "#a78bfa",
  property: "#34d399",
  children: "#60a5fa", children_education: "#60a5fa", children_settlement: "#60a5fa",
  spirituality: "#c084fc", family_legacy: "#c084fc", ancestral_duty: "#c084fc",
  family: "#f87171", family_nurture: "#f87171", family_responsibility: "#f87171",
  family_support: "#f87171",
};

const FOCUS_AREA_LABELS: Record<string, { ta: string; en: string }> = {
  health:               { ta: "ஆரோக்கியம்",       en: "Health" },
  health_focus:         { ta: "ஆரோக்கிய கவனம்",   en: "Health focus" },
  health_priority:      { ta: "ஆரோக்கியம் முன்னுரிமை", en: "Health priority" },
  health_senior:        { ta: "மூத்தோர் ஆரோக்கியம்", en: "Senior health" },
  education:            { ta: "கல்வி",              en: "Education" },
  education_foundation: { ta: "கல்வி அடிப்படை",    en: "Education foundation" },
  career:               { ta: "தொழில்",             en: "Career" },
  career_preparation:   { ta: "தொழில் தயாரிப்பு",  en: "Career prep" },
  career_growth:        { ta: "தொழில் வளர்ச்சி",   en: "Career growth" },
  career_peak:          { ta: "தொழில் உச்சம்",      en: "Career peak" },
  career_legacy:        { ta: "தொழில் மரபு",        en: "Career legacy" },
  marriage_prospect:    { ta: "திருமண வாய்ப்பு",    en: "Marriage prospect" },
  marriage_stability:   { ta: "திருமண நிலைத்தன்மை", en: "Marriage stability" },
  wealth_foundation:    { ta: "செல்வ அடிப்படை",     en: "Wealth foundation" },
  wealth_building:      { ta: "செல்வம் கட்டுதல்",   en: "Wealth building" },
  wealth_consolidation: { ta: "செல்வம் ஒருங்கிணைப்பு", en: "Wealth consolidation" },
  wealth_protection:    { ta: "செல்வம் பாதுகாப்பு", en: "Wealth protection" },
  property:             { ta: "சொத்து",              en: "Property" },
  children:             { ta: "குழந்தைகள்",          en: "Children" },
  children_education:   { ta: "குழந்தை கல்வி",       en: "Children's education" },
  children_settlement:  { ta: "குழந்தை குடியேற்றம்", en: "Children's settlement" },
  spirituality:         { ta: "ஆன்மீகம்",            en: "Spirituality" },
  family_legacy:        { ta: "குடும்ப மரபு",         en: "Family legacy" },
  ancestral_duty:       { ta: "பிதிர் கடமை",          en: "Ancestral duty" },
  family:               { ta: "குடும்பம்",             en: "Family" },
  family_nurture:       { ta: "குடும்ப பராமரிப்பு",   en: "Family nurture" },
  family_responsibility:{ ta: "குடும்ப பொறுப்பு",     en: "Family responsibility" },
  family_support:       { ta: "குடும்ப ஆதரவு",        en: "Family support" },
  independence:         { ta: "சுதந்திரம்",            en: "Independence" },
  friendship_social:    { ta: "நட்பு & சமூகம்",       en: "Social & friends" },
  character_formation:  { ta: "குண உருவாக்கம்",       en: "Character building" },
  retirement_stability: { ta: "ஓய்வு நிலைத்தன்மை",   en: "Retirement stability" },
};

function FocusBadge({ area, lang }: { area: string; lang: Lang }) {
  const color = FOCUS_AREA_COLORS[area] ?? "rgba(255,255,255,0.3)";
  const labels = FOCUS_AREA_LABELS[area];
  const label = labels ? (lang === "ta" ? labels.ta : labels.en) : area;
  return (
    <span
      style={{
        fontSize: "0.65rem",
        fontWeight: 600,
        color,
        border: `1px solid ${color}44`,
        borderRadius: "5px",
        padding: "3px 9px",
        background: `${color}10`,
      }}
    >
      {label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  lang: Lang;
  report: JadhagamReportData | null;
  loading: boolean;
  onLoad: () => void;
};

export function JadhagamReportPanel({ lang, report, loading, onLoad }: Props) {
  const [showNavamsa, setShowNavamsa] = useState(false);

  if (!report && !loading) {
    return (
      <button
        onClick={onLoad}
        style={{
          padding: "10px 20px",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.75)",
          fontSize: "0.78rem",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {t("jadhagam_report_btn", lang)}
      </button>
    );
  }

  if (loading) {
    return (
      <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
        {t("jadhagam_report_loading", lang)}
      </p>
    );
  }

  if (!report) return null;

  const {
    birthProfile,
    coreIdentity,
    planetaryStrengthSummary,
    functionalNatureTable,
    yogaDoshamSummary,
    ageWiseTimeline,
    currentYearGuidance,
    practicalGuidance,
    optionalRemedies,
    executiveSummary,
    navamsamSummary,
  } = report;

  const allPlanets = [
    ...planetaryStrengthSummary.strong,
    ...planetaryStrengthSummary.moderate,
    ...planetaryStrengthSummary.weak,
  ];

  const strongNames = planetaryStrengthSummary.strong.map((p) =>
    lang === "ta" ? (PLANET_NAMES_TA[p.planet] ?? p.planet) : p.planet
  );
  const weakNames = planetaryStrengthSummary.weak.map((p) =>
    lang === "ta" ? (PLANET_NAMES_TA[p.planet] ?? p.planet) : p.planet
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* ── Executive summary ── */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "10px",
          background: "rgba(167,139,250,0.06)",
          border: "1px solid rgba(167,139,250,0.2)",
        }}
      >
        <p style={{ margin: "0 0 4px", fontSize: "0.62rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("jadhagam_executive", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.55 }}>
          {lang === "ta" ? executiveSummary.ta : executiveSummary.en}
        </p>
      </div>

      {/* ── Birth profile ── */}
      <Section title={lang === "ta" ? "பிறப்பு விவரம்" : "Birth Profile"} accent="rgba(255,255,255,0.15)">
        <Row label={lang === "ta" ? "பெயர்" : "Name"} value={birthProfile.displayName} />
        <Row label={t("label_birth_date", lang)} value={birthProfile.birthDateLocal} />
        <Row label={lang === "ta" ? "பிறந்த நேரம்" : "Birth time"} value={birthProfile.birthTimeLocal} />
        <Row label={lang === "ta" ? "பிறந்த இடம்" : "Birth place"} value={birthProfile.birthPlace} />
        <Row label={lang === "ta" ? "நேர மண்டலம்" : "Timezone"} value={birthProfile.birthTimezone} />
        <Row label={lang === "ta" ? "வயது" : "Age"} value={`${birthProfile.currentAge}`} />
      </Section>

      {/* ── Core identity ── */}
      <Section title={t("jadhagam_identity", lang)} accent="rgba(96,165,250,0.4)">
        <Row label={lang === "ta" ? "லக்னம்" : "Lagna"} value={coreIdentity.lagnaRasi} />
        <Row label={lang === "ta" ? "சந்திர ராசி" : "Moon Rasi"} value={coreIdentity.moonRasi} />
        <Row label={lang === "ta" ? "ஜன்ம நட்சத்திரம்" : "Janma Nakshatra"} value={`${coreIdentity.janmaNakshatra} — ${lang === "ta" ? "பாதம்" : "Pada"} ${coreIdentity.janmaPada}`} />
        <Row label={lang === "ta" ? "நடப்பு மகாதசை" : "Mahadasha"} value={coreIdentity.currentMahadasha} />
        <Row label={lang === "ta" ? "நடப்பு அந்தரதசை" : "Antardasha"} value={coreIdentity.currentAntardasha} />
      </Section>

      {/* ── Age-appropriate life focus ── */}
      <Section title={t("jadhagam_age_focus", lang)} accent="rgba(52,211,153,0.4)">
        <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
          {lang === "ta"
            ? `${ageWiseTimeline.currentAge} வயதில் கீழ்கண்ட வாழ்க்கை துறைகள் தற்போது முன்னுரிமை பெறுகின்றன:`
            : `At age ${ageWiseTimeline.currentAge}, the following life areas are the active priorities for this phase:`}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
          {ageWiseTimeline.activeFocusAreas.map((area) => (
            <FocusBadge key={area} area={area} lang={lang} />
          ))}
        </div>
        <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>
          {lang === "ta"
            ? "இந்த வயது-நிலைக்கு பொருந்தாத துறைகள் இந்த அறிக்கையில் சேர்க்கப்படவில்லை."
            : "Life areas not relevant to this age phase are excluded from this report."}
        </p>
      </Section>

      {/* ── Planet strength ── */}
      <Section title={t("jadhagam_planet_strength", lang)} accent="rgba(251,191,36,0.35)">
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {allPlanets.map((item) => (
            <StrengthBar key={item.planet} planet={item.planet} score={item.score} lang={lang} />
          ))}
        </div>
        {strongNames.length > 0 && (
          <p style={{ margin: "4px 0 0", fontSize: "0.67rem", color: "#4ade80", lineHeight: 1.4 }}>
            {lang === "ta"
              ? `வலுவான: ${strongNames.join(", ")}`
              : `Strong: ${strongNames.join(", ")}`}
          </p>
        )}
        {weakNames.length > 0 && (
          <p style={{ margin: "0", fontSize: "0.67rem", color: "#f87171", lineHeight: 1.4 }}>
            {lang === "ta"
              ? `ஆதரவு தேவை: ${weakNames.join(", ")}`
              : `Needs support: ${weakNames.join(", ")}`}
          </p>
        )}
      </Section>

      {/* ── Functional nature ── */}
      <Section title={t("jadhagam_func_nature", lang)}>
        <p style={{ margin: 0, fontSize: "0.67rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
          {lang === "ta"
            ? "ஒவ்வொரு கிரகத்தின் லக்னத்திற்கு உரிய செயல்பாட்டு பொறுப்பு:"
            : "Each planet's functional role relative to the lagna:"}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {Object.entries(functionalNatureTable).map(([planet, nature]) => (
            <NatureBadge key={planet} planet={planet} nature={nature} lang={lang} />
          ))}
        </div>
      </Section>

      {/* ── Yogas & Doshams ── */}
      <Section title={`${t("yogas_title", lang)} & ${t("doshams_title", lang)}`} accent="rgba(167,139,250,0.3)">
        <YogaDoshamPanel
          lang={lang}
          yogas={yogaDoshamSummary.yogas}
          doshams={yogaDoshamSummary.doshams}
        />
      </Section>

      {/* ── Navamsa summary (collapsible) ── */}
      {navamsamSummary && (
        <Section title={t("jadhagam_navamsa", lang)}>
          <button
            onClick={() => setShowNavamsa((v) => !v)}
            style={{
              alignSelf: "flex-start",
              padding: "4px 12px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.7rem",
              cursor: "pointer",
            }}
          >
            {showNavamsa
              ? (lang === "ta" ? "மூடு" : "Hide")
              : (lang === "ta" ? "நவாம்சம் காண்" : "Show Navamsa")}
          </button>
          {showNavamsa && (
            <div>
              {navamsamSummary.vargottamaPlanets.length > 0 && (
                <p style={{ margin: "4px 0 8px", fontSize: "0.72rem", color: "#60a5fa", lineHeight: 1.4 }}>
                  {lang === "ta" ? "வர்கோத்தமம்: " : "Vargottama: "}
                  {navamsamSummary.vargottamaPlanets
                    .map((p) => (lang === "ta" ? (PLANET_NAMES_TA[p] ?? p) : p))
                    .join(", ")}
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {Object.entries(navamsamSummary.d9ByPlanet).map(([planet, rasi]) => (
                  <div
                    key={planet}
                    style={{
                      padding: "3px 8px",
                      borderRadius: "5px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "0.67rem",
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    {lang === "ta" ? (PLANET_NAMES_TA[planet] ?? planet) : planet}
                    <span style={{ color: "rgba(255,255,255,0.35)", margin: "0 3px" }}>→</span>
                    {rasi}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── This year's guidance ── */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "10px",
          background: "rgba(96,165,250,0.05)",
          border: "1px solid rgba(96,165,250,0.2)",
        }}
      >
        <p style={{ margin: "0 0 6px", fontSize: "0.62rem", fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("jadhagam_year_guidance", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.55 }}>
          {lang === "ta" ? currentYearGuidance.ta : currentYearGuidance.en}
        </p>
      </div>

      {/* ── Practical guidance ── */}
      <Section title={t("jadhagam_practical", lang)} accent="rgba(52,211,153,0.3)">
        <p style={{ margin: 0, fontSize: "0.67rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
          {lang === "ta"
            ? "இந்த ஆலோசனைகள் உங்கள் வயது, நடப்பு தசை மற்றும் கிரக நிலை ஆகியவற்றின் அடிப்படையில் வழங்கப்பட்டுள்ளன:"
            : "These recommendations are specific to your age phase, current dasha, and planetary state:"}
        </p>
        <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "5px" }}>
          {(lang === "ta" ? practicalGuidance.ta : practicalGuidance.en).map((item, i) => (
            <li key={i} style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{item}</li>
          ))}
        </ul>
      </Section>

      {/* ── Remedies ── */}
      <div
        style={{
          padding: "14px 16px",
          borderRadius: "10px",
          background: "rgba(251,191,36,0.05)",
          border: "1px solid rgba(251,191,36,0.2)",
        }}
      >
        <p style={{ margin: "0 0 6px", fontSize: "0.62rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("jadhagam_remedies", lang)}
        </p>
        <p style={{ margin: "0 0 8px", fontSize: "0.67rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>
          {lang === "ta"
            ? "இந்த பரிகாரங்கள் உங்கள் நடப்பு தசை மற்றும் பலவீனமான கிரகங்களின் அடிப்படையில் பரிந்துரைக்கப்படுகின்றன:"
            : "These remedies are suggested based on your current dasha and planets needing support:"}
        </p>
        <ul style={{ margin: 0, padding: "0 0 0 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {(lang === "ta" ? optionalRemedies.ta : optionalRemedies.en).map((item, i) => (
            <li key={i} style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.45 }}>{item}</li>
          ))}
        </ul>
        <p style={{ margin: "10px 0 0", fontSize: "0.63rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.4 }}>
          {lang === "ta"
            ? "இந்த பரிகாரங்கள் விருப்பமானவை. எந்தவொரு கல் அல்லது பரிகாரமும் தகுதிவாய்ந்த ஜோதிடரின் ஆலோசனையின் பேரில் மட்டுமே மேற்கொள்ளவும்."
            : "Remedies are optional. Any gemstone or pariharam should only be undertaken after consulting a qualified astrologer."}
        </p>
      </div>

    </div>
  );
}
