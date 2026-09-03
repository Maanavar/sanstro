"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PlaceCombobox } from "@/components/place-combobox";
import type { ChartCalculateResponseData, ChartPlanet, ChartYogaInsight } from "@/lib/types";
import { readErrorMessage } from "@/lib/api";
import {
  computeD9LagnaRasi,
  DEBILITATION_RASI,
  EXALTATION_RASI,
  GRAHA_ABBR,
  GRAHA_ABBR_EN,
  NATURAL_ENEMIES,
  NATURAL_FRIENDS,
  OWN_SIGN_RASI,
  RASI_LORDS as SIGN_LORD,
} from "@/lib/chart-utils";
import { useLang } from "@/components/lang-toggle";
import { JadhagamShareButton } from "@/components/public-share-card";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
import { tPlanetLord } from "@/lib/i18n";
import { nakshatraLordShort } from "@vinaadi/shared/nakshatraLord";

// ── South Indian grid layout ──────────────────────────────────────────────────
const RASI_GRID = [
  { rasi: 12, col: 0, row: 0 }, { rasi: 1, col: 1, row: 0 }, { rasi: 2, col: 2, row: 0 }, { rasi: 3, col: 3, row: 0 },
  { rasi: 11, col: 0, row: 1 }, { rasi: 4, col: 3, row: 1 },
  { rasi: 10, col: 0, row: 2 }, { rasi: 5, col: 3, row: 2 },
  { rasi: 9, col: 0, row: 3 }, { rasi: 8, col: 1, row: 3 }, { rasi: 7, col: 2, row: 3 }, { rasi: 6, col: 3, row: 3 },
];

const RASI_NAMES_EN: Record<number, string> = {
  1: "Mesham", 2: "Rishabam", 3: "Mithunam", 4: "Kadagam",
  5: "Simmam", 6: "Kanni", 7: "Tulam", 8: "Viruchigam",
  9: "Dhanus", 10: "Makaram", 11: "Kumbam", 12: "Meenam",
};

const RASI_NAMES_TA: Record<number, string> = {
  1: "மேஷம்", 2: "ரிஷபம்", 3: "மிதுனம்", 4: "கடகம்",
  5: "சிம்மம்", 6: "கன்னி", 7: "துலாம்", 8: "விருச்சிகம்",
  9: "தனுசு", 10: "மகரம்", 11: "கும்பம்", 12: "மீனம்",
};

const PLANET_ORDER = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU", "MANDHI"];

const PLANET_LABELS_EN: Record<string, string> = {
  SUN: "Sun · Suryan", MOON: "Moon · Chandran", MARS: "Mars · Sevvai",
  MERCURY: "Mercury · Budhan", JUPITER: "Jupiter · Guru", VENUS: "Venus · Sukran",
  SATURN: "Saturn · Sani", RAHU: "Rahu", KETU: "Ketu", MANDHI: "Mandhi",
};

// PLANET_LABELS_EN above stays — "Sun · Suryan" is this tool's own bilingual
// gloss and exists nowhere else. The Tamil side was a plain copy of the canonical
// nine, so it delegates; MANDHI is an upagraha with no `tPlanetLord` row and is
// the one name this file still owns.
const PLANET_LABELS_TA: Record<string, string> = Object.fromEntries([
  ...PLANET_ORDER.filter((code) => code !== "MANDHI").map((code) => [code, tPlanetLord(code, "ta")]),
  ["MANDHI", "மாந்தி"],
]);

// Nakshatra lords come from the shared Vimshottari derivation — this file used
// to carry its own transcribed 27-row copy, as did chart-generate-inline-panel.
const NAKSHATRA_LORDS_TA: Record<number, string> = Object.fromEntries(
  Array.from({ length: 27 }, (_, i) => [i + 1, nakshatraLordShort(i + 1, "ta")]),
);

// ── Nakshatra starting syllables (4 padas each) ──────────────────────────────
const NAKSHATRA_SYLLABLES: Record<number, [string, string, string, string]> = {
  1:  ["அ",   "சி",   "சு",   "சே"],
  2:  ["லீ",  "லு",   "லே",   "லோ"],
  3:  ["அ",   "இ",    "உ",    "எ"],
  4:  ["ஓ",   "வா",   "வி",   "வு"],
  5:  ["வே",  "வோ",   "க",    "கி"],
  6:  ["கு",  "க்ஷ",  "ண",    "ஞ"],
  7:  ["கே",  "கோ",   "ஹா",   "ஹி"],
  8:  ["ஹு",  "ஹே",   "ஹோ",   "ட"],
  9:  ["டி",  "டு",   "டே",   "டோ"],
  10: ["மா",  "மி",   "மு",   "மே"],
  11: ["மோ",  "ட",    "டீ",   "டு"],
  12: ["டே",  "டோ",   "ப",    "பி"],
  13: ["பு",  "ஷ",    "ண",    "ட"],
  14: ["பே",  "போ",   "ர",    "ரீ"],
  15: ["ரு",  "ரே",   "ரோ",   "த"],
  16: ["தி",  "தூ",   "தே",   "தோ"],
  17: ["ந",   "நி",   "நு",   "நே"],
  18: ["நோ",  "ய",    "யி",   "யு"],
  19: ["யே",  "யோ",   "ப",    "பீ"],
  20: ["பு",  "ட",    "ட",    "டீ"],
  21: ["பே",  "போ",   "ஜ",    "ஜி"],
  22: ["ஜு",  "ஜே",   "ஜோ",   "க்ஷீ"],
  23: ["க",   "கீ",   "கு",   "கே"],
  24: ["கோ",  "ச",    "சீ",   "சு"],
  25: ["சே",  "சோ",   "த",    "தீ"],
  26: ["து",  "ஜ",    "ஜீ",   "ஜு"],
  27: ["தே",  "தோ",   "ச",    "சீ"],
};

// ── Dignity (Nilai) tables ────────────────────────────────────────────────────
//
// Six hand-copied tables used to sit here. THIS FILE'S NATURAL_ENEMIES WAS WRONG:
// it omitted RAHU/KETU as enemies for SUN, MARS, JUPITER, VENUS and KETU, against
// both the dashboard's copy and the backend's `chart_strength._NATURAL_ENEMIES`.
//
// It never showed, and the reason is worth knowing rather than being relieved
// about: `getNilai` compares the graha against `SIGN_LORD[rasi]`, and a sign lord
// is only ever one of the seven — never Rahu or Ketu — so the five wrong rows
// could not be reached. A copy that is already wrong and merely unreachable is
// the case for single-sourcing, not against it.
//
// Imported from `lib/chart-utils` rather than from the dashboard's explanation-data
// module, which would have dragged several KB of bilingual dashboard prose onto
// this SEO-indexed page.

function getNilai(graha: string, rasi: number): string {
  if (EXALTATION_RASI[graha] === rasi) return "உச்சம்";
  if (DEBILITATION_RASI[graha] === rasi) return "நீச்சம்";
  if (OWN_SIGN_RASI[graha]?.includes(rasi)) return "ஆட்சி";
  const lord = SIGN_LORD[rasi];
  if (!lord) return "—";
  if (NATURAL_FRIENDS[graha]?.includes(lord)) return "நட்பு";
  if (NATURAL_ENEMIES[graha]?.includes(lord)) return "பகை";
  return "சமம்";
}

// ── Utility helpers ───────────────────────────────────────────────────────────
function toDMS(deg: number): string {
  const d0 = Math.floor(deg);
  const mRaw = (deg - d0) * 60;
  const m0 = Math.floor(mRaw);
  // Same 60-second carry the dashboard sheet needed — rounding can produce
  // "17:37:60", which is not a reading.
  let s = Math.round((mRaw - m0) * 60);
  let m = m0;
  let d = d0;
  if (s === 60) { s = 0; m += 1; }
  if (m === 60) { m = 0; d += 1; }
  return `${d}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDateDD(dateIso: string) {
  const [y, m, d] = dateIso.split("-");
  return `${d ?? ""}-${m ?? ""}-${y ?? ""}`;
}

function timeToMinutes(t: string): number {
  // Handles "HH:MM", "HH:MM:SS", "HH:MM:SS AM/PM"
  const upper = t.trim().toUpperCase();
  const isPM = upper.endsWith("PM");
  const isAM = upper.endsWith("AM");
  const clean = upper.replace(/\s*(AM|PM)$/, "");
  const parts = clean.split(":").map(Number);
  let h = parts[0] ?? 0;
  const min = parts[1] ?? 0;
  if (isPM && h !== 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + min;
}

function computeNaaligai(birthTime: string, sunriseTime: string): string {
  const bMin = timeToMinutes(birthTime);
  const sMin = timeToMinutes(sunriseTime);
  let diff = bMin - sMin;
  if (diff < 0) diff += 1440; // before today's sunrise → count from prev sunrise
  const totalSec = diff * 60;
  const naaligai = Math.floor(totalSec / 1440);
  const rem = totalSec % 1440;
  const vinnadi = Math.floor(rem / 24);
  const tattam = rem % 24;
  return `${naaligai}.${String(vinnadi).padStart(2, "0")}.${String(tattam).padStart(2, "0")}`;
}

function latToDMS(lat: number): string {
  const abs = Math.abs(lat);
  const d = Math.floor(abs);
  const mRaw = (abs - d) * 60;
  const m = Math.floor(mRaw);
  const s = Math.round((mRaw - m) * 60);
  const dir = lat >= 0 ? "N" : "S";
  return `${d}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} ${dir}`;
}

function lngToDMS(lng: number): string {
  const abs = Math.abs(lng);
  const d = Math.floor(abs);
  const mRaw = (abs - d) * 60;
  const m = Math.floor(mRaw);
  const s = Math.round((mRaw - m) * 60);
  const dir = lng >= 0 ? "E" : "W";
  return `${d}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} ${dir}`;
}

function pakshaTa(p: string): string {
  if (p === "SHUKLA") return "சுக்ல";
  if (p === "KRISHNA") return "கிருஷ்ண";
  return p;
}

function dashaLordTa(lord: string): string {
  return tPlanetLord(lord, "ta") || lord;
}

function formatDashaYMD(years: number): string {
  const y = Math.floor(years);
  const m = Math.round((years - y) * 12);
  if (y === 0) return `${m} மாதம்`;
  if (m === 0) return `${y} வருடம்`;
  return `${y} வருடம் ${m} மாதம்`;
}

function formatISODate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

// ── Screen RasiGrid (interactive) ─────────────────────────────────────────────
function RasiGrid({ chart, d9, lang }: { chart: ChartCalculateResponseData; d9?: boolean; lang: "en" | "ta" }) {
  const lagnaRasi = d9 ? computeD9LagnaRasi(chart.lagna.absoluteLongitude) : chart.lagna.rasi;
  const RASI_NAMES = lang === "en" ? RASI_NAMES_EN : RASI_NAMES_TA;
  const lagnaLabel = lang === "en" ? "La" : "ல";
  const cellSize = 72;

  function getOcc(rasi: number): string[] {
    const occ: string[] = [];
    if (lagnaRasi === rasi) occ.push(lagnaLabel);
    chart.planets.forEach((p) => {
      const planetRasi = d9 ? p.d9Rasi : p.rasi;
      if (planetRasi === rasi) occ.push(GRAHA_ABBR[p.graha] ?? p.graha.slice(0, 2));
    });
    return occ;
  }

  return (
    <div style={{ display: "inline-block" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`,
        border: "2px solid var(--cl-ink)",
        borderRadius: "4px",
        overflow: "hidden",
      }}>
        {RASI_GRID.map(({ rasi, col, row }) => {
          const occ = getOcc(rasi);
          const isLagna = lagnaRasi === rasi;
          return (
            <div key={rasi} style={{
              gridColumn: col + 1, gridRow: row + 1,
              border: "1px solid var(--cl-border)",
              padding: "4px 5px",
              background: isLagna ? "var(--cl-brand-tint)" : "var(--cl-surface)",
              position: "relative", minHeight: `${cellSize}px`,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}>
              {isLagna && (
                <div style={{
                  position: "absolute", top: 0, right: 0, width: 0, height: 0,
                  borderStyle: "solid", borderWidth: "0 14px 14px 0",
                  borderColor: "transparent var(--chart-d1-active) transparent transparent",
                }} />
              )}
              <span style={{ fontSize: "0.55rem", color: "var(--cl-muted)", fontWeight: 500 }}>
                {RASI_NAMES[rasi]}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                {occ.map((o, i) => (
                  <span key={i} style={{
                    fontSize: "0.75rem", fontWeight: 700,
                    color: o === lagnaLabel ? "var(--chart-d1-active)" : "var(--cl-ink)",
                  }}>{o}</span>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{
          gridColumn: "2 / 4", gridRow: "2 / 4",
          border: "1px solid var(--cl-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--cl-surface)", padding: "4px",
        }}>
          <div style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--cl-muted)" }}>
            <div style={{ fontWeight: 700, fontSize: "0.72rem", color: "var(--cl-ink)" }}>
              {d9 ? (lang === "en" ? "D9 Navamsa" : "D9 நவாம்சம்") : (lang === "en" ? "D1 Rasi" : "D1 ராசி")}
            </div>
            <div style={{ fontSize: "0.6rem", marginTop: "2px" }}>
              {RASI_NAMES[lagnaRasi]} {lang === "en" ? "Lagna" : "லக்னம்"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Print-only South chart ────────────────────────────────────────────────────
function PrintSouthChart({
  chart, title, d9 = false,
}: {
  chart: ChartCalculateResponseData; title: string; d9?: boolean;
}) {
  const lagnaRasi = d9 ? computeD9LagnaRasi(chart.lagna.absoluteLongitude) : chart.lagna.rasi;
  const cellSize = 64;

  function getOcc(rasi: number): string[] {
    const occ: string[] = [];
    if (lagnaRasi === rasi) occ.push("ல");
    chart.planets.forEach((planet) => {
      const r = d9 ? planet.d9Rasi : planet.rasi;
      if (r === rasi) occ.push(GRAHA_ABBR[planet.graha] ?? planet.graha.slice(0, 2));
    });
    return occ;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "center" }}>
      <div style={{ fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--print-ink)" }}>{title}</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`,
        border: "1.5px solid var(--print-ink)",
        background: "white",
      }}>
        {RASI_GRID.map(({ rasi, col, row }) => {
          const occ = getOcc(rasi);
          const isLagna = lagnaRasi === rasi;
          return (
            <div key={`${title}-${rasi}`} style={{
              gridColumn: col + 1, gridRow: row + 1,
              border: "0.75px solid var(--print-bdr)",
              padding: "3px",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              minHeight: `${cellSize}px`,
              background: isLagna ? "var(--print-lagna-bg)" : "white",
              position: "relative",
            }}>
              {isLagna && (
                <div style={{
                  position: "absolute", top: 0, right: 0, width: 0, height: 0,
                  borderStyle: "solid", borderWidth: "0 10px 10px 0",
                  borderColor: "transparent var(--print-lagna-accent) transparent transparent",
                }} />
              )}
              <span style={{ fontSize: "5.5px", color: "var(--print-muted)" }}>{RASI_NAMES_TA[rasi]}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1px" }}>
                {occ.map((item, index) => (
                  <span key={`${rasi}-${item}-${index}`} style={{
                    fontSize: "7px", fontWeight: 700,
                    color: item === "ல" ? "var(--print-lagna-accent)" : "var(--print-ink)",
                  }}>{item}</span>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{
          gridColumn: "2 / 4", gridRow: "2 / 4",
          border: "0.75px solid var(--print-bdr)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "4px", textAlign: "center", background: "var(--print-center)",
        }}>
          <div>
            <div style={{ fontSize: "7.5px", fontWeight: 700, color: "var(--print-ink)" }}>
              {d9 ? "நவாம்சம்" : "இராசி"}
            </div>
            <div style={{ fontSize: "6px", color: "var(--print-muted)", marginTop: "2px" }}>
              {RASI_NAMES_TA[lagnaRasi]} லக்னம்
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main print document ───────────────────────────────────────────────────────
function PrintableJadhagamSheet({
  chart,
  fatherName,
  motherName,
  gender,
  dasha,
}: {
  chart: ChartCalculateResponseData;
  fatherName: string;
  motherName: string;
  gender: string;
  dasha: { openingDasha: { lord: string; balanceYearsAtBirth: number }; current: { mahadasha: { lord: string; startDate: string; endDate: string }; antardasha: { lord: string; endDate: string } } } | null;
}) {
  const bp = chart.birthProfile;
  const moon = chart.planets.find((p) => p.graha === "MOON");
  const d9LagnaRasi = computeD9LagnaRasi(chart.lagna.absoluteLongitude);
  const sig = chart.birthPanchangamSignature as Record<string, string>;

  // Nakshatra syllables for moon's nakshatra
  const moonNakIdx = moon?.nakshatra ?? 0;
  const syllables = NAKSHATRA_SYLLABLES[moonNakIdx] ?? ["—", "—", "—", "—"];

  // Udhayadhi Naaligai
  const naaligai = sig.sunrise_time && bp.birthTimeLocal
    ? computeNaaligai(bp.birthTimeLocal, sig.sunrise_time)
    : "—";

  const cellSt: React.CSSProperties = {
    border: "0.5px solid var(--print-bdr)",
    padding: "3px 5px",
    fontSize: "7.5px",
    verticalAlign: "middle",
  };
  const hdrSt: React.CSSProperties = {
    ...cellSt,
    fontWeight: 700,
    background: "var(--print-hdr)",
    whiteSpace: "nowrap",
    width: "1%",
  };

  // Build lagna + planet rows for planet table
  const lagnaRow = {
    graha: "LAGNA",
    nameTA: "லக்னம்",
    absLong: chart.lagna.absoluteLongitude,
    nakshatra: chart.lagna.nakshatra,
    nakshatraName: chart.lagna.nakshatraName,
    pada: chart.lagna.pada,
    rasi: chart.lagna.rasi,
    d9Rasi: d9LagnaRasi,
    isRetrograde: false,
  };

  const planetRows = PLANET_ORDER.map((g) => {
    const p = chart.planets.find((x) => x.graha === g);
    if (!p) return null;
    return {
      graha: g,
      nameTA: PLANET_LABELS_TA[g] ?? g,
      absLong: p.absoluteLongitude,
      nakshatra: p.nakshatra,
      nakshatraName: p.nakshatraName,
      pada: p.pada,
      rasi: p.rasi,
      d9Rasi: p.d9Rasi,
      isRetrograde: p.isRetrograde,
    };
  }).filter(Boolean) as typeof lagnaRow[];

  const allPlanetRows = [lagnaRow, ...planetRows];

  // Paavaga Maarudhal
  const paavagam = PLANET_ORDER.map((g) => {
    const p = chart.planets.find((x) => x.graha === g);
    if (!p) return null;
    const abbr = GRAHA_ABBR[g] ?? g.slice(0, 2);
    const v = p.isRetrograde ? "(வ)" : "";
    return `${abbr}${v}-${p.houseFromLagna}`;
  }).filter(Boolean).join(", ");

  const docStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "780px",
    margin: "0 auto",
    background: "white",
    color: "var(--print-ink)",
    border: "1.5px solid var(--print-ink)",
    padding: "14px 16px",
    boxSizing: "border-box",
    fontFamily: '"Noto Serif Tamil", "Latha", "Tamil MN", Georgia, serif',
    fontSize: "8px",
  };

  return (
    <div className="jg-document-sheet" style={docStyle}>
      {/* ── Branding header ── */}
      <div style={{ textAlign: "center", borderBottom: "1.5px solid var(--print-ink)", paddingBottom: "8px", marginBottom: "10px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.05em" }}>Vinaadi AI</div>
        <div style={{ fontSize: "8px", marginTop: "2px", color: "var(--print-warm)" }}>
          விண்ணாடி AI · thirukanitham-based jathagam · {chart.ayanamsa.type} {chart.ayanamsa.valueDegrees.toFixed(2)}°
        </div>
      </div>

      {/* ── Section 1: Two-column personal details ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px", border: "0.5px solid var(--print-bdr)" }}>
        <tbody>
          <tr>
            <td style={hdrSt}>பெயர்</td>
            <td style={cellSt}>: {bp.displayName}</td>
            <td style={hdrSt}>அன்னை</td>
            <td style={cellSt}>: {motherName || "—"}</td>
          </tr>
          <tr>
            <td style={hdrSt}>தகப்பனார்</td>
            <td style={cellSt}>: {fatherName || "—"}</td>
            <td style={hdrSt}>பாலினம்</td>
            <td style={cellSt}>: {gender === "FEMALE" ? "பெண்" : "ஆண்"}</td>
          </tr>
          <tr>
            <td style={hdrSt}>பிறந்த தேதி/நேரம்</td>
            <td style={cellSt}>: {formatDateDD(bp.birthDateLocal)}{bp.birthTimeLocal ? ` ${bp.birthTimeLocal}` : ""}</td>
            <td style={hdrSt}>உதயாதி நாழிகை</td>
            <td style={cellSt}>: {naaligai}</td>
          </tr>
          <tr>
            <td style={hdrSt}>லக்னம்</td>
            <td style={cellSt}>: {RASI_NAMES_TA[chart.lagna.rasi]} · {chart.lagna.nakshatraName}</td>
            <td style={hdrSt}>பிறந்த இடம்</td>
            <td style={cellSt}>: {bp.birthPlace || "—"}</td>
          </tr>
          <tr>
            <td style={hdrSt}>ராசி / நட்சத்திரம்</td>
            <td style={cellSt}>
              : {moon ? `${RASI_NAMES_TA[moon.rasi]}-${moon.nakshatraName}, பாதம்-${moon.pada}` : "—"}
            </td>
            <td style={hdrSt}>அட்சாம்சம் / தீர்க்காம்சம்</td>
            <td style={cellSt}>
              : {latToDMS(Number(bp.birthLatitude ?? 0))} / {lngToDMS(Number(bp.birthLongitude ?? 0))}
            </td>
          </tr>
          <tr>
            <td style={hdrSt}>பஷ்ம-திதி</td>
            <td style={cellSt}>
              : {sig.tithi_paksha ? pakshaTa(sig.tithi_paksha) : "—"}{sig.tithi ? `/${sig.tithi}` : ""}
            </td>
            <td style={hdrSt}>சூரிய உதயம்</td>
            <td style={cellSt}>: {sig.sunrise_time || "—"}</td>
          </tr>
          <tr>
            <td style={hdrSt}>யோகம்-காரணம்</td>
            <td style={cellSt}>
              : {sig.yogam || "—"}{sig.karanam ? `/${sig.karanam}` : ""}
            </td>
            <td style={hdrSt}>சூரிய அஸ்தமனம்</td>
            <td style={cellSt}>: {sig.sunset_time || "—"}</td>
          </tr>
          <tr>
            <td style={hdrSt}>தமிழ் மாதம்/தேதி</td>
            <td style={cellSt}>: {sig.tamil_date_ta || "—"}</td>
            <td style={hdrSt}>நட்சத்திர எழுத்துக்கள்</td>
            <td style={cellSt}>: {syllables.join(", ")}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Section 2: Planet positions table ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px", fontSize: "7.5px" }}>
        <thead>
          <tr>
            {["கிரகம்", "பாகை-கலை", "நட்சத்திரம்", "பாதம்", "நட்சத்திர அதிபதி", "ராசி", "நவாம்சம்", "நிலை"].map((h) => (
              <th key={h} style={{ ...cellSt, background: "var(--print-hdr)", fontWeight: 700, textAlign: "center" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allPlanetRows.map((row) => (
            <tr key={row.graha}>
              <td style={{ ...cellSt, fontWeight: 600 }}>
                {row.nameTA}
                {row.isRetrograde && <sup style={{ fontSize: "5.5px", color: "var(--planet-saturn)" }}>வ</sup>}
              </td>
              <td style={{ ...cellSt, textAlign: "center", fontFamily: "monospace" }}>
                {toDMS(row.absLong)}
              </td>
              <td style={cellSt}>{row.nakshatraName}</td>
              <td style={{ ...cellSt, textAlign: "center" }}>{row.pada}</td>
              <td style={{ ...cellSt, textAlign: "center" }}>
                {row.graha === "LAGNA" ? "—" : (NAKSHATRA_LORDS_TA[row.nakshatra] ?? "—")}
              </td>
              <td style={cellSt}>{RASI_NAMES_TA[row.rasi]}</td>
              <td style={cellSt}>{RASI_NAMES_TA[row.d9Rasi] ?? "—"}</td>
              <td style={{ ...cellSt, textAlign: "center" }}>
                {row.graha === "LAGNA" || row.graha === "RAHU" || row.graha === "KETU" || row.graha === "MANDHI"
                  ? "—"
                  : getNilai(row.graha, row.rasi)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Section 3: Charts ── */}
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginBottom: "10px" }}>
        <PrintSouthChart chart={chart} title="இராசி படம் (D1)" />
        <PrintSouthChart chart={chart} title="நவாம்சம் படம் (D9)" d9 />
      </div>

      {/* ── Section 4: Dasha + Paavaga Maarudhal ── */}
      <div style={{ borderTop: "0.5px solid var(--print-bdr)", paddingTop: "6px", fontSize: "7.5px", lineHeight: 1.9 }}>
        {dasha && (
          <>
            <div>
              <strong>பிறந்த கால தசை இருப்பு:</strong>{" "}
              {dashaLordTa(dasha.openingDasha.lord)} தசை — இருப்பு {formatDashaYMD(dasha.openingDasha.balanceYearsAtBirth)}
            </div>
            <div>
              <strong>நடப்பு தசை/அந்தரம்:</strong>{" "}
              {dashaLordTa(dasha.current.mahadasha.lord)} தசை · {dashaLordTa(dasha.current.antardasha.lord)} புக்தி —{" "}
              {formatISODate(dasha.current.antardasha.endDate)} வரை
            </div>
          </>
        )}
        <div>
          <strong>பாவக மாறுதல்:</strong> {paavagam}
        </div>
      </div>

      {/* Footer — bottom-right attribution */}
      <div style={{ marginTop: "10px", paddingTop: "5px", borderTop: "0.5px solid var(--print-foot-bdr)", display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "6.5px", color: "var(--print-foot)" }}>
          vinaadi.com · திருக்கணிதம் · {chart.ayanamsa.type} {chart.ayanamsa.valueDegrees.toFixed(2)}° · {chart.ephemerisBackend}
        </span>
      </div>
    </div>
  );
}

// ── Form type ─────────────────────────────────────────────────────────────────
type Form = {
  displayName: string;
  fatherName: string;
  motherName: string;
  gender: "MALE" | "FEMALE";
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
};

const EMPTY: Form = {
  displayName: "", fatherName: "", motherName: "", gender: "MALE",
  birthDateLocal: "", birthTimeLocal: "12:00",
  birthPlace: "", birthLatitude: "", birthLongitude: "", birthTimezone: "Asia/Kolkata",
};

// DashaData shape we accept from /chart-preview
type DashaData = {
  openingDasha: { lord: string; balanceYearsAtBirth: number };
  current: {
    mahadasha: { lord: string; startDate: string; endDate: string };
    antardasha: { lord: string; startDate: string; endDate: string };
  };
};

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1.5px solid var(--cl-border)", borderRadius: "8px",
  padding: "9px 12px", background: "var(--cl-bg)", color: "var(--cl-ink)",
  fontSize: "0.88rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "5px",
  fontSize: "0.78rem", fontWeight: 600, color: "var(--cl-ink-2)",
};

export function JadhagamTool() {
  const [lang] = useLang();
  const en = lang === "en";
  const RASI_NAMES = en ? RASI_NAMES_EN : RASI_NAMES_TA;
  const PLANET_LABELS = en ? PLANET_LABELS_EN : PLANET_LABELS_TA;
  const fmtStar = (v: string) => (en ? tamilizeAstroEnglish(v) : v);

  const [form, setForm] = useState<Form>(EMPTY);
  const [chart, setChart] = useState<ChartCalculateResponseData | null>(null);
  const [dasha, setDasha] = useState<DashaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  async function handleGenerate() {
    if (!form.birthDateLocal || !form.birthLatitude || !form.birthLongitude) {
      setError(en
        ? "Please enter date, time, and select a birth place."
        : "தேதி, நேரம் உள்ளிட்டு பிறந்த இடம் தேர்வு செய்யவும்.");
      return;
    }
    setError(""); setLoading(true); setChart(null); setDasha(null);
    try {
      const res = await fetch("/api/backend/api/v1/public/chart-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth: {
            displayName: form.displayName || "Chart",
            birthDateLocal: form.birthDateLocal,
            birthTimeLocal: form.birthTimeLocal || null,
            birthLatitude: parseFloat(form.birthLatitude),
            birthLongitude: parseFloat(form.birthLongitude),
            birthTimezone: form.birthTimezone,
            birthPlace: form.birthPlace,
          },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Error ${res.status}`);
      }
      const data = await res.json() as { success: boolean; data: { chart: ChartCalculateResponseData; dasha: DashaData } };
      setChart(data.data.chart);
      setDasha(data.data.dasha ?? null);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleExportPdf() {
    window.setTimeout(() => { window.print(); }, 80);
  }

  const moon = chart?.planets.find((p) => p.graha === "MOON");
  const d9LagnaRasi = chart ? computeD9LagnaRasi(chart.lagna.absoluteLongitude) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          body > *:not(.jg-print-portal) { display: none !important; }
          .jg-print-portal {
            display: block !important;
            width: 210mm;
            padding: 10mm;
            box-sizing: border-box;
          }
        }
        @media screen { .jg-print-portal { display: none !important; } }
      `}</style>

      {chart && mounted && createPortal(
        <div className="jg-print-portal">
          <PrintableJadhagamSheet
            chart={chart}
            fatherName={form.fatherName}
            motherName={form.motherName}
            gender={form.gender}
            dasha={dasha}
          />
        </div>,
        document.body,
      )}

      {/* ── Form ── */}
      <div style={{
        background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
        borderRadius: "16px", padding: "24px",
        display: "flex", flexDirection: "column", gap: "16px",
      }}>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--cl-muted)", lineHeight: 1.5 }}>
          {en
            ? "Enter birth details to generate a Thirukanitham-precise jadhagam."
            : "திருக்கணிதம் துல்லியமான ஜாதகம் உருவாக்க பிறப்பு விவரங்களை உள்ளிடவும்."}
        </p>

        {/* Name + DOB */}
        <div className="cl-mobile-form-grid-2" style={{ gap: "12px" }}>
          <label style={labelStyle}>
            {en ? "Name (optional)" : "பெயர் (விருப்பத்திற்கு)"}
            <input style={inputStyle} value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder={en ? "e.g. Ramesh Kumar" : "எ.கா. ரமேஷ் குமார்"} />
          </label>
          <label style={labelStyle}>
            {en ? "Birth Date *" : "பிறந்த தேதி *"}
            <input style={inputStyle} type="date" value={form.birthDateLocal}
              onChange={(e) => setForm((f) => ({ ...f, birthDateLocal: e.target.value }))} />
          </label>
        </div>

        {/* Father + Mother */}
        <div className="cl-mobile-form-grid-2" style={{ gap: "12px" }}>
          <label style={labelStyle}>
            {en ? "Father's Name (optional)" : "தகப்பனார் பெயர் (விருப்பத்திற்கு)"}
            <input style={inputStyle} value={form.fatherName}
              onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
              placeholder={en ? "e.g. Rajan" : "எ.கா. ராஜன்"} />
          </label>
          <label style={labelStyle}>
            {en ? "Mother's Name (optional)" : "அன்னை பெயர் (விருப்பத்திற்கு)"}
            <input style={inputStyle} value={form.motherName}
              onChange={(e) => setForm((f) => ({ ...f, motherName: e.target.value }))}
              placeholder={en ? "e.g. Meena" : "எ.கா. மீனா"} />
          </label>
        </div>

        {/* Time + Gender */}
        <div className="cl-mobile-form-grid-2" style={{ gap: "12px" }}>
          <label style={labelStyle}>
            {en ? "Birth Time" : "பிறந்த நேரம்"}
            <input style={inputStyle} type="time" value={form.birthTimeLocal}
              onChange={(e) => setForm((f) => ({ ...f, birthTimeLocal: e.target.value }))} />
          </label>
          <label style={labelStyle}>
            {en ? "Gender" : "பாலினம்"}
            <select
              style={inputStyle}
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as "MALE" | "FEMALE" }))}
            >
              <option value="MALE">{en ? "Male" : "ஆண்"}</option>
              <option value="FEMALE">{en ? "Female" : "பெண்"}</option>
            </select>
          </label>
        </div>

        {/* Birth Place */}
        <label style={labelStyle}>
          {en ? "Birth Place *" : "பிறந்த இடம் *"}
          <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--cl-muted)" }}>
            {en ? "Type city name to search" : "நகர பெயர் தட்டச்சு செய்து தேடவும்"}
          </span>
          <PlaceCombobox
            value={form.birthPlace}
            lang={lang}
            onChange={(city, raw) => setForm((f) => ({
              ...f, birthPlace: raw,
              ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
            }))}
          />
        </label>

        {/* Lat / Long */}
        <div className="cl-mobile-form-grid-2" style={{ gap: "12px" }}>
          <label style={labelStyle}>
            {en ? "Latitude" : "அட்சாம்சம்"}
            <input style={inputStyle} inputMode="decimal" value={form.birthLatitude}
              onChange={(e) => setForm((f) => ({ ...f, birthLatitude: e.target.value }))}
              placeholder="e.g. 13.08" />
          </label>
          <label style={labelStyle}>
            {en ? "Longitude" : "தீர்க்காம்சம்"}
            <input style={inputStyle} inputMode="decimal" value={form.birthLongitude}
              onChange={(e) => setForm((f) => ({ ...f, birthLongitude: e.target.value }))}
              placeholder="e.g. 80.27" />
          </label>
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--planet-saturn)", background: "var(--cl-rust-tint)", border: "1px solid var(--cl-rust-ring)", borderRadius: "8px", padding: "10px 14px" }}>
            {error}
          </p>
        )}

        <button
          type="button" onClick={() => void handleGenerate()} disabled={loading}
          style={{
            alignSelf: "flex-start", padding: "10px 28px",
            background: loading ? "var(--cl-border)" : "var(--cl-ink)",
            color: "var(--cl-bg)", border: "none", borderRadius: "999px",
            fontFamily: "inherit", fontSize: "0.9rem", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (en ? "Calculating…" : "கணக்கிடுகிறது…") : (en ? "Generate Jadhagam" : "ஜாதகம் உருவாக்கு")}
        </button>
      </div>

      {/* ── Results ── */}
      {chart && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Summary strip */}
          <div className="cl-mobile-flex-row" style={{
            background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
            borderRadius: "16px", padding: "20px 24px",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cl-muted)" }}>
              {en ? "Jadhagam" : "ஜாதகம்"} · {chart.birthProfile.displayName}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 28px", marginTop: "12px" }}>
              {[
                { label: en ? "Lagna" : "லக்னம்", value: `${RASI_NAMES[chart.lagna.rasi]} · ${fmtStar(chart.lagna.nakshatraName)}` },
                { label: en ? "Birth Star" : "ஜென்ம நட்சத்திரம்", value: moon ? `${fmtStar(moon.nakshatraName)} (${en ? "Pada" : "பாதம்"} ${moon.pada})` : "—" },
                { label: en ? "Birth Sign" : "ஜென்ம ராசி", value: moon ? RASI_NAMES[moon.rasi] : "—" },
                { label: "Ayanamsa", value: `Lahiri ${chart.ayanamsa.valueDegrees.toFixed(2)}°` },
              ].map((row) => (
                <div key={row.label}>
                  <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--cl-muted)" }}>{row.label}</p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.9rem", fontWeight: 600, color: "var(--cl-ink)" }}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Export bar */}
          <div className="cl-mobile-flex-row" style={{ justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--cl-ink-2)" }}>
              {en ? "Traditional single-page layout with all sections." : "அனைத்து பிரிவுகளுடன் பாரம்பரிய ஒரு-பக்க வடிவமைப்பு."}
            </p>
            <button type="button" onClick={handleExportPdf} style={{
              padding: "9px 16px", borderRadius: "999px",
              border: "1px solid var(--cl-brand-edge)", background: "var(--cl-brand-tint)",
              color: "var(--chart-d1-active)", fontFamily: "inherit", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer",
            }}>
              {en ? "Export PDF" : "PDF ஏற்றுமதி"}
            </button>
          </div>

          {/* Dual charts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "18px", overflowX: "auto" }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--cl-muted)" }}>
                {en ? "D1 Rasi" : "D1 இராசி"}
              </p>
              <div className="cl-chart-scroll"><RasiGrid chart={chart} lang={lang} /></div>
            </div>
            <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "18px", overflowX: "auto" }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--cl-muted)" }}>
                {en ? "D9 Navamsa" : "D9 நவாம்சம்"}
              </p>
              <div className="cl-chart-scroll"><RasiGrid chart={chart} d9 lang={lang} /></div>
            </div>
          </div>

          {/* Planet table — updated columns */}
          <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--cl-border)" }}>
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
                {en ? "Planet Positions" : "கிரக நிலைகள்"}
              </p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    {(en
                      ? ["Planet", "Degrees (DMS)", "Nakshatra", "Pada", "Nak. Lord", "Rasi", "Navamsa", "Dignity"]
                      : ["கிரகம்", "பாகை-கலை", "நட்சத்திரம்", "பாதம்", "நட்சத்திர அதிபதி", "ராசி", "நவாம்சம்", "நிலை"]
                    ).map((h) => (
                      <th key={h} style={{
                        padding: "8px 12px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        color: "var(--cl-muted)", background: "var(--cl-bg-2)",
                        borderBottom: "1px solid var(--cl-border)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Lagna row */}
                  <tr style={{ borderBottom: "1px solid var(--cl-border)" }}>
                    <td style={{ padding: "9px 12px", fontWeight: 600, color: "var(--chart-d1-active)" }}>
                      {en ? "Lagna" : "லக்னம்"}
                    </td>
                    <td style={{ padding: "9px 12px", color: "var(--cl-ink-2)", fontFamily: "monospace", fontSize: "0.78rem" }}>
                      {toDMS(chart.lagna.absoluteLongitude)}
                    </td>
                    <td style={{ padding: "9px 12px", color: "var(--cl-ink-2)" }}>{fmtStar(chart.lagna.nakshatraName)}</td>
                    <td style={{ padding: "9px 12px", color: "var(--cl-muted)" }}>{chart.lagna.pada}</td>
                    <td style={{ padding: "9px 12px", color: "var(--cl-muted)" }}>
                      {NAKSHATRA_LORDS_TA[chart.lagna.nakshatra] ?? "—"}
                    </td>
                    <td style={{ padding: "9px 12px", color: "var(--cl-ink-2)" }}>{RASI_NAMES[chart.lagna.rasi]}</td>
                    <td style={{ padding: "9px 12px", color: "var(--cl-ink-2)" }}>{RASI_NAMES[d9LagnaRasi]}</td>
                    <td style={{ padding: "9px 12px", color: "var(--cl-muted)" }}>—</td>
                  </tr>
                  {PLANET_ORDER.map((g) => {
                    const p = chart.planets.find((x: ChartPlanet) => x.graha === g);
                    if (!p) return null;
                    const nilai = (g === "RAHU" || g === "KETU" || g === "MANDHI") ? "—" : getNilai(g, p.rasi);
                    return (
                      <tr key={g} style={{ borderBottom: "1px solid var(--cl-border)" }}>
                        <td style={{ padding: "9px 12px", fontWeight: 600, color: "var(--cl-ink)" }}>
                          {PLANET_LABELS[g] ?? g}
                          {p.isRetrograde && <span style={{ fontSize: "0.68rem", color: "var(--planet-saturn)", marginLeft: "4px" }}>(வ)</span>}
                        </td>
                        <td style={{ padding: "9px 12px", color: "var(--cl-ink-2)", fontFamily: "monospace", fontSize: "0.78rem" }}>
                          {toDMS(p.absoluteLongitude)}
                        </td>
                        <td style={{ padding: "9px 12px", color: "var(--cl-ink-2)" }}>{fmtStar(p.nakshatraName)}</td>
                        <td style={{ padding: "9px 12px", color: "var(--cl-muted)" }}>{p.pada}</td>
                        <td style={{ padding: "9px 12px", color: "var(--cl-muted)" }}>
                          {NAKSHATRA_LORDS_TA[p.nakshatra] ?? "—"}
                        </td>
                        <td style={{ padding: "9px 12px", color: "var(--cl-ink-2)" }}>{RASI_NAMES[p.rasi]}</td>
                        <td style={{ padding: "9px 12px", color: "var(--cl-ink-2)" }}>{RASI_NAMES[p.d9Rasi]}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 500, color: nilai === "உச்சம்" ? "var(--dignity-exalt)" : nilai === "நீச்சம்" ? "var(--dignity-neecha)" : "var(--cl-ink-2)" }}>
                          {nilai}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Share snapshot */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <JadhagamShareButton data={{
              name: form.displayName,
              lagnaRasi: RASI_NAMES_EN[chart.lagna.rasi] ?? "",
              lagnaRasiNum: chart.lagna.rasi,
              janmaNakshatra: moon ? `${tamilizeAstroEnglish(moon.nakshatraName)} P${moon.pada}` : "—",
              janmaRasi: moon ? (RASI_NAMES_EN[moon.rasi] ?? "") : "—",
              planets: PLANET_ORDER.slice(0, 9).flatMap((g) => {
                const p = chart.planets.find((x: ChartPlanet) => x.graha === g);
                return p ? [{ abbr: GRAHA_ABBR_EN[g] ?? g.slice(0, 2), rasi: RASI_NAMES_EN[p.rasi] ?? "", rasiNum: p.rasi }] : [];
              }),
              yoga: (chart.yogas as ChartYogaInsight[])?.find(y => y.isPresent && y.isCurrentlyActive)?.name
                || (chart.yogas as ChartYogaInsight[])?.find(y => y.isPresent)?.name,
              lang,
            }} />
          </div>

          {/* Save CTA */}
          <div className="cl-mobile-card-split" style={{
            background: "var(--cl-brand-tint)", border: "1px solid var(--cl-brand-ring-md)",
            borderRadius: "14px", padding: "18px 22px",
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--cl-ink)", fontSize: "0.92rem" }}>
                {en ? "Save your chart and get daily guidance" : "ஜாதகம் சேமித்து தினசரி வழிகாட்டுதல் பெறவும்"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--cl-muted)" }}>
                {en ? "Free account — daily reading, family vault, dasha tracking." : "இலவச கணக்கு — தினசரி வாசிப்பு, குடும்ப சேகரிப்பு, தசை கண்காணிப்பு."}
              </p>
            </div>
            <Link href="/dashboard" className="cl-mobile-cta" style={{
              display: "inline-flex", alignItems: "center", padding: "9px 22px",
              background: "var(--cl-ink)", color: "var(--cl-bg)", borderRadius: "999px",
              fontWeight: 600, fontSize: "0.88rem", textDecoration: "none",
            }}>
              {en ? "Get started free →" : "இலவசமாக தொடங்கு →"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
