"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { CollapsibleSection } from "./collapsible-section";
import { GlossaryTerm } from "./glossary-term";

const VARGA_TABS = [
  { key: "D2",  label: "D2" },
  { key: "D3",  label: "D3" },
  { key: "D4",  label: "D4" },
  { key: "D7",  label: "D7" },
  { key: "D9",  label: "D9" },
  { key: "D10", label: "D10" },
  { key: "D12", label: "D12" },
  { key: "D24", label: "D24" },
  { key: "D27", label: "D27" },
  { key: "D30", label: "D30" },
  { key: "D40", label: "D40" },
  { key: "D45", label: "D45" },
  { key: "D60", label: "D60" },
] as const;

type VargaKey = (typeof VARGA_TABS)[number]["key"];

const VARGA_DESC: Record<VargaKey, { ta: string; en: string }> = {
  D2:  { ta: "ஹோரா — செல்வம்",              en: "Hora — Wealth" },
  D3:  { ta: "திரேக்காண — சகோதரர்",          en: "Drekkana — Siblings" },
  D4:  { ta: "சதுர்த்தாம்சம் — சொத்து",      en: "Chaturthamsa — Property" },
  D7:  { ta: "சப்தாம்சம் — குழந்தைகள்",     en: "Saptamsa — Children" },
  D9:  { ta: "நவாம்சம் — திருமணம்",          en: "Navamsa — Marriage" },
  D10: { ta: "தசாம்சம் — தொழில்",            en: "Dasamsha — Career" },
  D12: { ta: "துவாதசாம்சம் — பெற்றோர்",      en: "Dwadashamsa — Parents" },
  D24: { ta: "சதுர்விம்சாம்சம் — கல்வி",     en: "Chaturvimsamsa — Education" },
  D27: { ta: "பாம்சம் — பொது நலம்",          en: "Bhamsa — General well-being" },
  D30: { ta: "திரிம்சாம்சம் — உடல்நலம்",     en: "Trimsamsa — Health" },
  D40: { ta: "காவேதாம்சம் — தாய்வழி",        en: "Khavedamsa — Maternal legacy" },
  D45: { ta: "அக்ஷவேதாம்சம் — பண்பு",        en: "Akshavedamsa — Character" },
  D60: { ta: "ஷஷ்டியாம்சம் — ஆன்மீகம்",     en: "Shashtiamsa — Spiritual" },
};

const RASI_NAMES: Record<number, { ta: string; en: string }> = {
  1:  { ta: "மேஷம்",    en: "Aries" },
  2:  { ta: "ரிஷபம்",   en: "Taurus" },
  3:  { ta: "மிதுனம்",  en: "Gemini" },
  4:  { ta: "கடகம்",    en: "Cancer" },
  5:  { ta: "சிம்மம்",  en: "Leo" },
  6:  { ta: "கன்னி",    en: "Virgo" },
  7:  { ta: "துலாம்",   en: "Libra" },
  8:  { ta: "விருச்சிகம்", en: "Scorpio" },
  9:  { ta: "தனுசு",    en: "Sagittarius" },
  10: { ta: "மகரம்",    en: "Capricorn" },
  11: { ta: "கும்பம்",  en: "Aquarius" },
  12: { ta: "மீனம்",    en: "Pisces" },
};

const PLANET_ORDER = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU", "LAGNA"];
const PLANET_ABBR: Record<string, string> = {
  SUN: "Su", MOON: "Mo", MARS: "Ma", MERCURY: "Me",
  JUPITER: "Ju", VENUS: "Ve", SATURN: "Sa", RAHU: "Ra", KETU: "Ke", LAGNA: "As",
};

type Props = {
  lang: Lang;
  vargas: Record<string, Record<string, number>> | undefined;
  d1Planets: Record<string, number>;
  equalBhava: Record<string, number> | undefined;
  vargaReliability?: Record<string, string>;
};

export function VargasPanel({ lang, vargas, d1Planets, equalBhava, vargaReliability }: Props) {
  const [activeVarga, setActiveVarga] = useState<VargaKey>("D10");

  const hasVargas = vargas && Object.keys(vargas).length > 0;
  const currentVarga = hasVargas ? vargas![activeVarga] : null;

  const equalBhavaChanges = equalBhava
    ? Object.entries(equalBhava).filter(([planet, equalHouse]) => {
        const d1House = d1Planets[planet];
        return d1House !== undefined && d1House !== equalHouse;
      })
    : [];

  return (
    <CollapsibleSection title={t("vargas_title", lang)} defaultOpen={false}>
      <div style={{ marginTop: "var(--space-3)" }}>
        <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.5 }}>
          <GlossaryTerm term="varga" lang={lang}>
            {lang === "ta" ? "பிரிவு கட்டங்கள்" : "Divisional charts"}
          </GlossaryTerm>
          {lang === "ta"
            ? " — ஒவ்வொன்றும் ஒரு வாழ்க்கைத் துறையை (திருமணம், தொழில் போன்றவை) விரிவாகப் பார்க்கும். "
            : " — each one zooms into a specific life area (marriage, career, and so on). "}
          <GlossaryTerm term="navamsa" lang={lang}>
            {lang === "ta" ? "D9 நவாம்சம்" : "D9 (Navamsa)"}
          </GlossaryTerm>
          {lang === "ta" ? " பாரம்பரியமாக மிக முக்கியமான வர்க்கம்." : " is traditionally the most important."}
        </p>

        {/* Varga tab pills */}
        <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
          {VARGA_TABS.map(({ key }) => {
            const isActive = key === activeVarga;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveVarga(key)}
                style={{
                  padding: "var(--space-1) var(--space-3)",
                  borderRadius: "var(--radius-pill)",
                  border: `1.5px solid ${isActive ? "var(--color-mid)" : "var(--color-border)"}`,
                  background: isActive ? "var(--color-mid-bg)" : "var(--color-surface-soft)",
                  color: isActive ? "var(--color-mid)" : "var(--color-faint)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "var(--text-base)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Active varga description */}
        <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)", marginBottom: "var(--space-2)", fontStyle: "italic" }}>
          {VARGA_DESC[activeVarga][lang]}
          {vargaReliability?.[activeVarga] === "LOW" && (
            <span style={{ color: "var(--color-mid)", fontWeight: 600, marginLeft: "var(--space-2)" }}>
              {lang === "ta" ? "(பிறந்த நேரம் துல்லியமாக இல்லை)" : "(needs exact birth time)"}
            </span>
          )}
        </p>

        {/* Planet comparison table */}
        {currentVarga ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-base)" }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid var(--color-border)` }}>
                  <th style={{ textAlign: "left", padding: "var(--space-1) var(--space-2)", color: "var(--color-faint)", fontWeight: 600 }}>
                    {t("vargas_planet", lang)}
                  </th>
                  <th style={{ textAlign: "center", padding: "var(--space-1) var(--space-2)", color: "var(--color-faint)", fontWeight: 600 }}>
                    {t("vargas_d1_label", lang)}
                  </th>
                  <th style={{ textAlign: "center", padding: "var(--space-1) var(--space-2)", color: "var(--color-faint)", fontWeight: 600 }}>
                    {activeVarga}
                  </th>
                  <th style={{ textAlign: "center", padding: "var(--space-1) var(--space-2)", color: "var(--color-faint)", fontWeight: 600 }}>
                    —
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLANET_ORDER.filter(p => d1Planets[p] !== undefined || currentVarga[p] !== undefined).map((planet) => {
                  const d1Rasi = d1Planets[planet];
                  const vargaRasi = currentVarga[planet];
                  const same = d1Rasi === vargaRasi;
                  return (
                    <tr key={planet} style={{ borderBottom: `1px solid var(--color-border)` }}>
                      <td style={{ padding: "var(--space-1) var(--space-2)", fontWeight: 600, color: "var(--color-text)" }}>
                        {PLANET_ABBR[planet] ?? planet}
                      </td>
                      <td style={{ padding: "var(--space-1) var(--space-2)", textAlign: "center", color: "var(--color-text)" }}>
                        {d1Rasi ? (RASI_NAMES[d1Rasi]?.[lang] ?? d1Rasi) : "—"}
                      </td>
                      <td style={{ padding: "var(--space-1) var(--space-2)", textAlign: "center", color: "var(--color-text)" }}>
                        {vargaRasi ? (RASI_NAMES[vargaRasi]?.[lang] ?? vargaRasi) : "—"}
                      </td>
                      <td style={{ padding: "var(--space-1) var(--space-2)", textAlign: "center" }}>
                        {d1Rasi && vargaRasi ? (
                          same
                            ? <span style={{ color: "var(--color-high)", fontWeight: 700, fontSize: "var(--text-sm)" }}>✓</span>
                            : <span style={{ color: "var(--color-mid)", fontWeight: 700, fontSize: "var(--text-sm)" }}>≠</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
            {lang === "ta" ? "வர்க தரவு கிடைக்கவில்லை." : "Varga data not available."}
          </p>
        )}

        {/* Equal Bhava diff — only planets that changed */}
        {equalBhavaChanges.length > 0 && (
          <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: `1px solid var(--color-border)` }}>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-2)" }}>
              {t("equal_bhava_title", lang)}
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)", marginBottom: "var(--space-2)", fontStyle: "italic" }}>
              {t("equal_bhava_desc", lang)}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {equalBhavaChanges.map(([planet, equalHouse]) => (
                <span
                  key={planet}
                  style={{
                    padding: "var(--space-1) var(--space-3)",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--color-mid-bg)",
                    border: `1px solid var(--color-mid-border)`,
                    fontSize: "var(--text-sm)",
                    color: "var(--color-mid)",
                    fontWeight: 600,
                  }}
                >
                  {PLANET_ABBR[planet] ?? planet}: H{d1Planets[planet]} to H{equalHouse}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
