"use client";

import React, { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { JadhagamReportData } from "@/lib/types";
import { YogaDoshamPanel } from "./dashboard-yoga-dosham-panel";

// ── Shared section wrapper ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: "var(--space-5) var(--space-6)", borderRadius: "var(--radius-md)",
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      display: "flex", flexDirection: "column", gap: "var(--space-3)",
      fontFamily: "var(--font-body)",
    }}>
      <p className="cd-kicker--inline" style={{ letterSpacing: "0.1em" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "baseline", borderBottom: "1px solid var(--color-bg)", paddingBottom: "var(--space-2)" }}>
      <span style={{ fontSize: "0.75rem", color: "var(--color-faint)", minWidth: "130px", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "0.875rem", color: "var(--color-text-strong)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ── Planetary strength bar ────────────────────────────────────────────────────

const PLANET_NAMES_TA: Record<string, string> = {
  SUN: "சூரியன்", MOON: "சந்திரன்", MARS: "செவ்வாய்", MERCURY: "புதன்",
  JUPITER: "குரு", VENUS: "சுக்கிரன்", SATURN: "சனி", RAHU: "ராகு", KETU: "கேது",
};

function StrengthBar({ planet, score, lang }: { planet: string; score: number; lang: Lang }) {
  const color = score >= 70 ? "var(--color-score-high)" : score >= 40 ? "var(--color-score-mid)" : "var(--color-score-low)";
  const label = lang === "ta" ? (PLANET_NAMES_TA[planet] ?? planet) : planet;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
      <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", minWidth: "76px" }}>{label}</span>
      <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "var(--color-border)" }}>
        <div style={{ width: `${score}%`, height: "100%", borderRadius: "3px", background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color, minWidth: "30px", textAlign: "right" }}>{score}</span>
    </div>
  );
}

// ── Functional nature badge ───────────────────────────────────────────────────

const NATURE_COLORS: Record<string, string> = {
  LAGNA_LORD: "var(--color-score-high)",
  YOGAKARAKA: "#5a4880",
  TRIKONA:    "#1e5a8c",
  KENDRA:     "#3a6b40",
  MARAKA:     "var(--color-score-low)",
  DUSTHANA:   "var(--color-score-low)",
  NEUTRAL:    "var(--color-faint)",
};

const NATURE_LABELS_TA: Record<string, string> = {
  LAGNA_LORD: "லக்னாதிபதி", YOGAKARAKA: "யோககாரகன்", TRIKONA: "திரிகோண",
  KENDRA: "கேந்திர", MARAKA: "மாரகன்", DUSTHANA: "துஷ்டான", NEUTRAL: "நடுநிலை",
};

function NatureBadge({ planet, nature, lang }: { planet: string; nature: string; lang: Lang }) {
  const color = NATURE_COLORS[nature] ?? "var(--color-faint)";
  const planetLabel = lang === "ta" ? (PLANET_NAMES_TA[planet] ?? planet) : planet;
  const natureLabel = lang === "ta" ? (NATURE_LABELS_TA[nature] ?? nature) : nature.replace(/_/g, " ");
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "var(--space-1)",
      padding: "var(--space-1) var(--space-2_5)", borderRadius: "var(--radius-pill)",
      background: "#FAF5EA", border: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: "0.75rem", color: "var(--color-text)", fontWeight: 600 }}>{planetLabel}</span>
      <span style={{ fontSize: "0.625rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{natureLabel}</span>
    </div>
  );
}

// ── Age-based focus badge ─────────────────────────────────────────────────────

const FOCUS_AREA_COLORS: Record<string, string> = {
  health: "var(--color-score-high)", health_focus: "var(--color-score-high)", health_priority: "var(--color-score-high)", health_senior: "var(--color-score-high)",
  education: "#1e5a8c", education_foundation: "#1e5a8c",
  career: "var(--color-score-mid)", career_preparation: "var(--color-score-mid)", career_growth: "var(--color-score-mid)",
  career_peak: "var(--color-score-mid)", career_legacy: "var(--color-score-mid)",
  marriage_prospect: "#7a4880", marriage_stability: "#7a4880",
  wealth_foundation: "#5a4880", wealth_building: "#5a4880",
  wealth_consolidation: "#5a4880", wealth_protection: "#5a4880",
  property: "#3a6b40",
  children: "#1e5a8c", children_education: "#1e5a8c", children_settlement: "#1e5a8c",
  spirituality: "#5a4880", family_legacy: "#5a4880", ancestral_duty: "#5a4880",
  family: "var(--color-score-low)", family_nurture: "var(--color-score-low)", family_responsibility: "var(--color-score-low)",
  family_support: "var(--color-score-low)",
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
  const color = FOCUS_AREA_COLORS[area] ?? "var(--color-faint)";
  const labels = FOCUS_AREA_LABELS[area];
  const label = labels ? (lang === "ta" ? labels.ta : labels.en) : area;
  return (
    <span style={{
      fontSize: "0.75rem", fontWeight: 600, color,
      border: `1px solid ${color}44`, borderRadius: "var(--radius-pill)",
      padding: "var(--space-0_75) var(--space-3)", background: "#FAF5EA",
    }}>
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
          padding: "var(--space-3) var(--space-7)", borderRadius: "var(--radius-pill)",
          background: "var(--color-text-strong)", border: "none",
          color: "var(--color-bg)", fontSize: "0.875rem",
          cursor: "pointer", fontWeight: 600,
          fontFamily: "var(--font-body)",
          display: "inline-block", alignSelf: "flex-start",
        }}
      >
        {t("jadhagam_report_btn", lang)}
      </button>
    );
  }

  if (loading) {
    return (
      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3_5)" }}>

      {/* ── Executive summary ── */}
      <div style={{ padding: "var(--space-5) var(--space-6)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", border: "1px solid var(--color-border)", fontFamily: "var(--font-body)" }}>
        <p className="cd-kicker" style={{ marginBottom: "var(--space-1_5)", color: "var(--color-score-mid)", letterSpacing: "0.1em" }}>
          {t("jadhagam_executive", lang)}
        </p>
        <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 500, color: "var(--color-text-strong)", lineHeight: 1.55 }}>
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
        <Row label={lang === "ta" ? "பிறப்பு நட்சத்திரம்" : "Birth Star"} value={`${coreIdentity.janmaNakshatra} — ${lang === "ta" ? "பாதம்" : "Pada"} ${coreIdentity.janmaPada}`} />
        <Row label={lang === "ta" ? "நடப்பு மகாதசை" : "Mahadasha"} value={coreIdentity.currentMahadasha} />
        <Row label={lang === "ta" ? "நடப்பு அந்தரதசை" : "Antardasha"} value={coreIdentity.currentAntardasha} />
      </Section>

      {/* ── Age-appropriate life focus ── */}
      <Section title={t("jadhagam_age_focus", lang)} accent="rgba(52,211,153,0.4)">
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {lang === "ta"
            ? `${ageWiseTimeline.currentAge} வயதில் கீழ்கண்ட வாழ்க்கை துறைகள் தற்போது முன்னுரிமை பெறுகின்றன:`
            : `At age ${ageWiseTimeline.currentAge}, the following life areas are the active priorities for this phase:`}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1_5)" }}>
          {ageWiseTimeline.activeFocusAreas.map((area) => (
            <FocusBadge key={area} area={area} lang={lang} />
          ))}
        </div>
        <p style={{ margin: "var(--space-1) 0 0", fontSize: "0.75rem", color: "var(--color-faint)", lineHeight: 1.4 }}>
          {lang === "ta"
            ? "இந்த வயது-நிலைக்கு பொருந்தாத துறைகள் இந்த அறிக்கையில் சேர்க்கப்படவில்லை."
            : "Life areas not relevant to this age phase are excluded from this report."}
        </p>
      </Section>

      {/* ── Planet strength ── */}
      <Section title={t("jadhagam_planet_strength", lang)} accent="rgba(251,191,36,0.35)">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {allPlanets.map((item) => (
            <StrengthBar key={item.planet} planet={item.planet} score={item.score} lang={lang} />
          ))}
        </div>
        {strongNames.length > 0 && (
          <p style={{ margin: "var(--space-1) 0 0", fontSize: "0.75rem", color: "var(--color-score-high)", lineHeight: 1.4 }}>
            {lang === "ta" ? `வலுவான: ${strongNames.join(", ")}` : `Strong: ${strongNames.join(", ")}`}
          </p>
        )}
        {weakNames.length > 0 && (
          <p style={{ margin: "0", fontSize: "0.75rem", color: "var(--color-score-low)", lineHeight: 1.4 }}>
            {lang === "ta" ? `ஆதரவு தேவை: ${weakNames.join(", ")}` : `Needs support: ${weakNames.join(", ")}`}
          </p>
        )}
      </Section>

      {/* ── Functional nature ── */}
      <Section title={t("jadhagam_func_nature", lang)}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.4 }}>
          {lang === "ta"
            ? "ஒவ்வொரு கிரகத்தின் லக்னத்திற்கு உரிய செயல்பாட்டு பொறுப்பு:"
            : "Each planet's functional role relative to the lagna:"}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1_5)" }}>
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
              alignSelf: "flex-start", padding: "var(--space-1) var(--space-4)", borderRadius: "var(--radius-pill)",
              background: "transparent", border: "1.5px solid var(--color-border-strong)",
              color: "var(--color-muted)", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600,
              fontFamily: "var(--font-body)",
            }}
          >
            {showNavamsa ? (lang === "ta" ? "மூடு" : "Hide") : (lang === "ta" ? "நவாம்சம் காண்" : "Show Navamsa")}
          </button>
          {showNavamsa && (
            <div>
              {navamsamSummary.vargottamaPlanets.length > 0 && (
                <p style={{ margin: "var(--space-1) 0 var(--space-2_5)", fontSize: "0.875rem", color: "#1e5a8c", lineHeight: 1.4 }}>
                  {lang === "ta" ? "வர்கோத்தமம்: " : "Vargottama: "}
                  {navamsamSummary.vargottamaPlanets.map((p) => (lang === "ta" ? (PLANET_NAMES_TA[p] ?? p) : p)).join(", ")}
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1_5)" }}>
                {Object.entries(navamsamSummary.d9ByPlanet).map(([planet, rasi]) => (
                  <div key={planet} style={{
                    padding: "var(--space-1) var(--space-2_5)", borderRadius: "var(--radius-pill)",
                    background: "#FAF5EA", border: "1px solid var(--color-border)",
                    fontSize: "0.75rem", color: "var(--color-text)",
                  }}>
                    {lang === "ta" ? (PLANET_NAMES_TA[planet] ?? planet) : planet}
                    <span style={{ color: "var(--color-faint)", margin: "0 var(--space-1)" }}>→</span>
                    {rasi}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── This year's guidance ── */}
      <div style={{ padding: "var(--space-5) var(--space-6)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", border: "1px solid var(--color-border)", fontFamily: "var(--font-body)" }}>
        <p className="cd-kicker" style={{ marginBottom: "var(--space-2)", color: "#1e5a8c", letterSpacing: "0.1em" }}>
          {t("jadhagam_year_guidance", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-strong)", lineHeight: 1.6 }}>
          {lang === "ta" ? currentYearGuidance.ta : currentYearGuidance.en}
        </p>
      </div>

      {/* ── Practical guidance ── */}
      <Section title={t("jadhagam_practical", lang)}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.4 }}>
          {lang === "ta"
            ? "இந்த ஆலோசனைகள் உங்கள் வயது, நடப்பு தசை மற்றும் கிரக நிலை ஆகியவற்றின் அடிப்படையில் வழங்கப்பட்டுள்ளன:"
            : "These recommendations are specific to your age phase, current dasha, and planetary state:"}
        </p>
        <ul style={{ margin: 0, padding: "0 0 0 var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
          {(lang === "ta" ? practicalGuidance.ta : practicalGuidance.en).map((item, i) => (
            <li key={i} style={{ fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.55 }}>{item}</li>
          ))}
        </ul>
      </Section>

      {/* ── Remedies ── */}
      <div style={{ padding: "var(--space-5) var(--space-6)", borderRadius: "var(--radius-md)", background: "#F0D9C4", border: "1px solid rgba(184,90,44,0.25)", fontFamily: "var(--font-body)" }}>
        <p className="cd-kicker" style={{ marginBottom: "var(--space-1_5)", color: "var(--color-score-mid)", letterSpacing: "0.1em" }}>
          {t("jadhagam_remedies", lang)}
        </p>
        <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.875rem", color: "#7a3412", lineHeight: 1.4 }}>
          {lang === "ta"
            ? "இந்த பரிகாரங்கள் உங்கள் நடப்பு தசை மற்றும் பலவீனமான கிரகங்களின் அடிப்படையில் பரிந்துரைக்கப்படுகின்றன:"
            : "These remedies are suggested based on your current dasha and planets needing support:"}
        </p>
        <ul style={{ margin: 0, padding: "0 0 0 var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {(lang === "ta" ? optionalRemedies.ta : optionalRemedies.en).map((item, i) => (
            <li key={i} style={{ fontSize: "0.875rem", color: "var(--color-text-strong)", lineHeight: 1.5 }}>{item}</li>
          ))}
        </ul>
        <p style={{ margin: "var(--space-3) 0 0", fontSize: "0.75rem", color: "var(--color-score-mid)", lineHeight: 1.4 }}>
          {lang === "ta"
            ? "இந்த பரிகாரங்கள் விருப்பமானவை. எந்தவொரு கல் அல்லது பரிகாரமும் தகுதிவாய்ந்த ஜோதிடரின் ஆலோசனையின் பேரில் மட்டுமே மேற்கொள்ளவும்."
            : "Remedies are optional. Any gemstone or pariharam should only be undertaken after consulting a qualified astrologer."}
        </p>
      </div>

    </div>
  );
}
