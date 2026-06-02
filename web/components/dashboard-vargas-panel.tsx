"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { CollapsibleSection } from "./collapsible-section";

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  sage: "#5C7654",
  terracotta: "#B85A2C",
} as const;

const VARGA_TABS = [
  { key: "D2",  label: "D2" },
  { key: "D3",  label: "D3" },
  { key: "D4",  label: "D4" },
  { key: "D7",  label: "D7" },
  { key: "D9",  label: "D9" },
  { key: "D10", label: "D10" },
  { key: "D12", label: "D12" },
  { key: "D30", label: "D30" },
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
  D30: { ta: "திரிம்சாம்சம் — உடல்நலம்",     en: "Trimsamsa — Health" },
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
  bhavaChalit: Record<string, number> | undefined;
};

export function VargasPanel({ lang, vargas, d1Planets, bhavaChalit }: Props) {
  const [activeVarga, setActiveVarga] = useState<VargaKey>("D10");

  const hasVargas = vargas && Object.keys(vargas).length > 0;
  const currentVarga = hasVargas ? vargas![activeVarga] : null;

  const bhavaChanges = bhavaChalit
    ? Object.entries(bhavaChalit).filter(([planet, bhavaHouse]) => {
        const d1House = d1Planets[planet];
        return d1House !== undefined && d1House !== bhavaHouse;
      })
    : [];

  return (
    <CollapsibleSection title={t("vargas_title", lang)} defaultOpen={false}>
      <div style={{ marginTop: "var(--space-3)" }}>

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
                  padding: "4px 12px",
                  borderRadius: "var(--radius-pill)",
                  border: `1.5px solid ${isActive ? W.terracotta : W.borderLt}`,
                  background: isActive ? "rgba(184,90,44,0.1)" : W.surface,
                  color: isActive ? W.terracotta : W.muted,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.8rem",
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
        <p style={{ fontSize: "0.8rem", color: W.muted, marginBottom: "var(--space-2)", fontStyle: "italic" }}>
          {VARGA_DESC[activeVarga][lang]}
        </p>

        {/* Planet comparison table */}
        {currentVarga ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${W.border}` }}>
                  <th style={{ textAlign: "left", padding: "4px 8px", color: W.muted, fontWeight: 600 }}>
                    {t("vargas_planet", lang)}
                  </th>
                  <th style={{ textAlign: "center", padding: "4px 8px", color: W.muted, fontWeight: 600 }}>
                    {t("vargas_d1_label", lang)}
                  </th>
                  <th style={{ textAlign: "center", padding: "4px 8px", color: W.muted, fontWeight: 600 }}>
                    {activeVarga}
                  </th>
                  <th style={{ textAlign: "center", padding: "4px 8px", color: W.muted, fontWeight: 600 }}>
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
                    <tr key={planet} style={{ borderBottom: `1px solid ${W.borderLt}` }}>
                      <td style={{ padding: "5px 8px", fontWeight: 600, color: W.inkMid }}>
                        {PLANET_ABBR[planet] ?? planet}
                      </td>
                      <td style={{ padding: "5px 8px", textAlign: "center", color: W.inkMid }}>
                        {d1Rasi ? (RASI_NAMES[d1Rasi]?.[lang] ?? d1Rasi) : "—"}
                      </td>
                      <td style={{ padding: "5px 8px", textAlign: "center", color: W.inkMid }}>
                        {vargaRasi ? (RASI_NAMES[vargaRasi]?.[lang] ?? vargaRasi) : "—"}
                      </td>
                      <td style={{ padding: "5px 8px", textAlign: "center" }}>
                        {d1Rasi && vargaRasi ? (
                          same
                            ? <span style={{ color: W.sage, fontWeight: 700, fontSize: "0.75rem" }}>✓</span>
                            : <span style={{ color: W.terracotta, fontWeight: 700, fontSize: "0.75rem" }}>≠</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: "0.82rem", color: W.muted }}>
            {lang === "ta" ? "வர்க தரவு கிடைக்கவில்லை." : "Varga data not available."}
          </p>
        )}

        {/* Bhava Chalit diff — only planets that changed */}
        {bhavaChanges.length > 0 && (
          <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: `1px solid ${W.borderLt}` }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-2)" }}>
              {t("bhava_chalit_title", lang)}
            </p>
            <p style={{ fontSize: "0.75rem", color: W.muted, marginBottom: "var(--space-2)", fontStyle: "italic" }}>
              {t("bhava_chalit_desc", lang)}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {bhavaChanges.map(([planet, bhavaHouse]) => (
                <span
                  key={planet}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "var(--radius-pill)",
                    background: "rgba(184,90,44,0.08)",
                    border: `1px solid rgba(184,90,44,0.25)`,
                    fontSize: "0.78rem",
                    color: W.terracotta,
                    fontWeight: 600,
                  }}
                >
                  {PLANET_ABBR[planet] ?? planet}: H{d1Planets[planet]} → H{bhavaHouse}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
