"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { t } from "@/lib/i18n";
import { LANG_STORAGE_KEY } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartCalculateResponseData, ChartSummaryData, DashaTimelineResponseData } from "@/lib/types";
import { RasiChart, NavamsaChart } from "@/components/dashboard-charts";
import { Field } from "@/components/dashboard-ui";
import { PlaceCombobox } from "@/components/place-combobox";
import {
  buildD1CellDetail,
  buildD9CellDetail,
  computeD9LagnaRasi,
  D1_RASI_NAMES,
  GRAHA_ABBR,
} from "@/lib/chart-utils";

type PublicChartPreviewResponse = { success: boolean; data: { chart: ChartCalculateResponseData; summary: ChartSummaryData; dasha: DashaTimelineResponseData } };

type BirthForm = {
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

const EMPTY_FORM: BirthForm = {
  displayName: "",
  fatherName: "",
  motherName: "",
  gender: "MALE",
  birthDateLocal: "",
  birthTimeLocal: "12:00",
  birthPlace: "",
  birthLatitude: "",
  birthLongitude: "",
  birthTimezone: "Asia/Kolkata",
};

// Traditional data tables for print
const NAKSHATRA_LORDS: Record<number, string> = {
  1: "கேது", 2: "சுக்", 3: "சூரி", 4: "சந்", 5: "செவ்", 6: "ராகு", 7: "குரு",
  8: "சனி", 9: "புத", 10: "கேது", 11: "சுக்", 12: "சூரி", 13: "சந்", 14: "செவ்",
  15: "ராகு", 16: "குரு", 17: "சனி", 18: "புத", 19: "கேது", 20: "சுக்", 21: "சூரி",
  22: "சந்", 23: "செவ்", 24: "ராகு", 25: "குரு", 26: "சனி", 27: "புத",
};

const RASI_LORDS_TA: Record<number, string> = {
  1: "செவ்", 2: "சுக்", 3: "புத", 4: "சந்", 5: "சூரி", 6: "புத",
  7: "சுக்", 8: "செவ்", 9: "குரு", 10: "சனி", 11: "சனி", 12: "குரு",
};

const RASI_NAMES_TA: Record<number, string> = {
  1: "மேஷம்", 2: "ரிஷபம்", 3: "மிதுனம்", 4: "கடகம்", 5: "சிம்மம்", 6: "கன்னி",
  7: "துலாம்", 8: "விருச்சிகம்", 9: "தனுசு", 10: "மகரம்", 11: "கும்பம்", 12: "மீனம்",
};

const GRAHA_NAMES_TA: Record<string, string> = {
  SUN: "சூரியன்", MOON: "சந்திரன்", MARS: "செவ்வாய்", MERCURY: "புதன்",
  JUPITER: "குரு", VENUS: "சுக்கிரன்", SATURN: "சனி", RAHU: "ராகு",
  KETU: "கேது", MANDHI: "மாந்தி",
};

const PLANET_DIRECTION: Record<string, string> = {
  SUN: "கி", MOON: "வ", MARS: "தெ", MERCURY: "வ.கி", JUPITER: "வ.கி",
  VENUS: "கி.தெ", SATURN: "ம", RAHU: "ஈ", KETU: "ஈ", MANDHI: "-",
};

const WEEKDAY_NAMES_TA = ["திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி", "ஞாயிறு"];

// South Indian Rasi grid positions
const RASI_GRID: { rasi: number; col: number; row: number }[] = [
  { rasi: 12, col: 0, row: 0 }, { rasi: 1, col: 1, row: 0 }, { rasi: 2, col: 2, row: 0 }, { rasi: 3, col: 3, row: 0 },
  { rasi: 11, col: 0, row: 1 }, { rasi: 4, col: 3, row: 1 },
  { rasi: 10, col: 0, row: 2 }, { rasi: 5, col: 3, row: 2 },
  { rasi: 9, col: 0, row: 3 }, { rasi: 8, col: 1, row: 3 }, { rasi: 7, col: 2, row: 3 }, { rasi: 6, col: 3, row: 3 },
];

// DMS colon format matching the traditional print style (e.g. "191:24:13")
function toDMS(deg: number): string {
  const d = Math.floor(deg);
  const mRaw = (deg - d) * 60;
  const m = Math.floor(mRaw);
  const s = Math.round((mRaw - m) * 60);
  return `${d}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function latToDMS(lat: number): string {
  const abs = Math.abs(lat);
  const d = Math.floor(abs);
  const mRaw = (abs - d) * 60;
  const m = Math.floor(mRaw);
  const s = Math.round((mRaw - m) * 60);
  return `${d}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} ${lat >= 0 ? "N" : "S"}`;
}

function lngToDMS(lng: number): string {
  const abs = Math.abs(lng);
  const d = Math.floor(abs);
  const mRaw = (abs - d) * 60;
  const m = Math.floor(mRaw);
  const s = Math.round((mRaw - m) * 60);
  return `${d}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} ${lng >= 0 ? "E" : "W"}`;
}

function pakshaTa(p: string): string {
  if (p === "SHUKLA") return "சுக்ல";
  if (p === "KRISHNA") return "கிருஷ்ண";
  return p;
}

function timeToMinutes(t: string): number {
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
  if (diff < 0) diff += 1440;
  const totalSec = diff * 60;
  const naaligai = Math.floor(totalSec / 1440);
  const rem = totalSec % 1440;
  const vinnadi = Math.floor(rem / 24);
  const tattam = rem % 24;
  return `${naaligai}.${String(vinnadi).padStart(2, "0")}.${String(tattam).padStart(2, "0")}`;
}

// Dignity (Nilai) tables
const EXALTATION_RASI: Record<string, number> = {
  SUN: 1, MOON: 2, MARS: 10, MERCURY: 6, JUPITER: 4, VENUS: 12, SATURN: 7,
};
const DEBILITATION_RASI: Record<string, number> = {
  SUN: 7, MOON: 8, MARS: 4, MERCURY: 12, JUPITER: 10, VENUS: 6, SATURN: 1,
};
const OWN_SIGN_RASI: Record<string, number[]> = {
  SUN: [5], MOON: [4], MARS: [1, 8], MERCURY: [3, 6],
  JUPITER: [9, 12], VENUS: [2, 7], SATURN: [10, 11],
};
const NATURAL_FRIENDS: Record<string, string[]> = {
  SUN: ["MOON", "MARS", "JUPITER"], MOON: ["SUN", "MERCURY"],
  MARS: ["SUN", "MOON", "JUPITER"], MERCURY: ["SUN", "VENUS"],
  JUPITER: ["SUN", "MOON", "MARS"], VENUS: ["MERCURY", "SATURN"],
  SATURN: ["MERCURY", "VENUS"], RAHU: ["VENUS", "SATURN"], KETU: ["MARS", "VENUS"],
};
const NATURAL_ENEMIES: Record<string, string[]> = {
  SUN: ["VENUS", "SATURN"], MOON: ["RAHU", "KETU"], MARS: ["MERCURY"],
  MERCURY: ["MOON"], JUPITER: ["MERCURY", "VENUS"], VENUS: ["SUN", "MOON"],
  SATURN: ["SUN", "MOON", "MARS"], RAHU: ["SUN", "MOON", "MARS", "JUPITER"],
  KETU: ["SUN", "MOON", "JUPITER"],
};
const SIGN_LORD_MAP: Record<number, string> = {
  1: "MARS", 2: "VENUS", 3: "MERCURY", 4: "MOON", 5: "SUN", 6: "MERCURY",
  7: "VENUS", 8: "MARS", 9: "JUPITER", 10: "SATURN", 11: "SATURN", 12: "JUPITER",
};

function getNilai(graha: string, rasi: number): string {
  if (EXALTATION_RASI[graha] === rasi) return "உச்சம்";
  if (DEBILITATION_RASI[graha] === rasi) return "நீச்சம்";
  if (OWN_SIGN_RASI[graha]?.includes(rasi)) return "ஆட்சி";
  const lord = SIGN_LORD_MAP[rasi];
  if (!lord) return "—";
  if (NATURAL_FRIENDS[graha]?.includes(lord)) return "நட்பு";
  if (NATURAL_ENEMIES[graha]?.includes(lord)) return "பகை";
  return "சமம்";
}

// Nakshatra starting syllables (4 padas each)
const NAKSHATRA_SYLLABLES: Record<number, [string, string, string, string]> = {
  1:  ["அ","சி","சு","சே"],    2:  ["லீ","லு","லே","லோ"],
  3:  ["அ","இ","உ","எ"],       4:  ["ஓ","வா","வி","வு"],
  5:  ["வே","வோ","க","கி"],    6:  ["கு","க்ஷ","ண","ஞ"],
  7:  ["கே","கோ","ஹா","ஹி"],   8:  ["ஹு","ஹே","ஹோ","ட"],
  9:  ["டி","டு","டே","டோ"],   10: ["மா","மி","மு","மே"],
  11: ["மோ","ட","டீ","டு"],    12: ["டே","டோ","ப","பி"],
  13: ["பு","ஷ","ண","ட"],      14: ["பே","போ","ர","ரீ"],
  15: ["ரு","ரே","ரோ","த"],    16: ["தி","தூ","தே","தோ"],
  17: ["ந","நி","நு","நே"],     18: ["நோ","ய","யி","யு"],
  19: ["யே","யோ","ப","பீ"],    20: ["பு","ட","ட","டீ"],
  21: ["பே","போ","ஜ","ஜி"],    22: ["ஜு","ஜே","ஜோ","க்ஷீ"],
  23: ["க","கீ","கு","கே"],    24: ["கோ","ச","சீ","சு"],
  25: ["சே","சோ","த","தீ"],    26: ["து","ஜ","ஜீ","ஜு"],
  27: ["தே","தோ","ச","சீ"],
};

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return WEEKDAY_NAMES_TA[d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1] ?? "";
}

function formatDateTa(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Compact print chart — pure HTML/CSS, no interactivity
function PrintRasiChart({ chart, d9LagnaRasi }: { chart: ChartCalculateResponseData; d9LagnaRasi?: number }) {
  const isD9 = d9LagnaRasi !== undefined;
  const lagnaRasi = isD9 ? d9LagnaRasi : chart.lagna.rasi;
  const cellPx = 60;

  function getOccupants(rasi: number) {
    if (isD9) {
      const occ: string[] = [];
      if (d9LagnaRasi === rasi) occ.push("ல");
      chart.planets.forEach((p) => {
        if (p.d9Rasi === rasi) occ.push(GRAHA_ABBR[p.graha] ?? p.graha.slice(0, 2));
      });
      return occ;
    } else {
      const occ: string[] = [];
      if (chart.lagna.rasi === rasi) occ.push("ல");
      chart.planets.forEach((p) => {
        if (p.rasi === rasi) occ.push(GRAHA_ABBR[p.graha] ?? p.graha.slice(0, 2));
      });
      return occ;
    }
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(4, ${cellPx}px)`,
      gridTemplateRows: `repeat(4, ${cellPx}px)`,
      border: "1.5px solid var(--color-border)",
      width: `${cellPx * 4 + 2}px`,
    }}>
      {RASI_GRID.map(({ rasi, col, row }) => {
        const occ = getOccupants(rasi);
        const isLagna = lagnaRasi === rasi;
        return (
          <div
            key={rasi}
            style={{
              gridColumn: col + 1,
              gridRow: row + 1,
              border: "0.5px solid var(--color-border)",
              padding: "2px 3px",
              fontSize: "7.5px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: isLagna ? "var(--color-mid-bg)" : "var(--color-surface)",
              position: "relative",
              minHeight: `${cellPx}px`,
            }}
          >
            {isLagna && (
              <div style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 0,
                height: 0,
                borderStyle: "solid",
                borderWidth: "0 12px 12px 0",
                borderColor: "transparent var(--color-accent) transparent transparent",
              }} />
            )}
            <span style={{ color: "var(--color-faint)", fontSize: "6.5px" }}>{RASI_NAMES_TA[rasi]}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1px" }}>
              {occ.map((o, i) => (
                <span key={i} style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "8px", lineHeight: 1.2 }}>{o}</span>
              ))}
            </div>
          </div>
        );
      })}
      {/* Center label */}
      <div style={{
        gridColumn: "2 / 4",
        gridRow: "2 / 4",
        border: "0.5px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-mid-bg)",
        padding: "4px",
      }}>
        <div style={{ textAlign: "center", fontSize: "7px", color: "var(--color-text)", lineHeight: 1.4 }}>
          <div style={{ fontWeight: 700, fontSize: "7.5px" }}>{isD9 ? "நவாம்சம்" : "இராசி"}</div>
          <div>{chart.birthProfile.displayName}</div>
          <div style={{ fontSize: "6.5px", color: "var(--color-muted)" }}>
            {isD9
              ? `நவாம்சம் / Male`
              : `${RASI_NAMES_TA[chart.lagna.rasi]} லக்னம்`}
          </div>
          <div style={{ fontSize: "6px", color: "var(--color-muted)" }}>
            {chart.birthProfile.birthDateLocal}
            {chart.birthProfile.birthTimeLocal ? ` - ${chart.birthProfile.birthTimeLocal}` : ""}
          </div>
          {chart.birthProfile.birthLatitude !== undefined && (
            <div style={{ fontSize: "6px", color: "var(--color-muted)" }}>
              Lat: {Number(chart.birthProfile.birthLatitude).toFixed(2)} N · Lon: {Number(chart.birthProfile.birthLongitude ?? 0).toFixed(1)} E
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDashaBalance(years: number): string {
  const y = Math.floor(years);
  const months = Math.round((years - y) * 12);
  if (y === 0) return `${months} மாதம்`;
  if (months === 0) return `${y} ஆண்டு`;
  return `${y} ஆண்டு ${months} மாதம்`;
}

function formatDateTA(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

function dashaLordTA(lord: string): string {
  const map: Record<string, string> = {
    SUN: "சூரியன்", MOON: "சந்திரன்", MARS: "செவ்வாய்", MERCURY: "புதன்",
    JUPITER: "குரு", VENUS: "சுக்கிரன்", SATURN: "சனி", RAHU: "ராகு", KETU: "கேது",
  };
  return map[lord] ?? lord;
}

function JathagamPrint({
  chart, dasha, fatherName, motherName, gender,
}: {
  chart: ChartCalculateResponseData;
  dasha: DashaTimelineResponseData | null;
  fatherName: string;
  motherName: string;
  gender: string;
}) {
  const d9LagnaRasi = computeD9LagnaRasi(chart.lagna.absoluteLongitude);
  const bp = chart.birthProfile;
  const moon = chart.planets.find((p) => p.graha === "MOON");
  const sig = chart.birthPanchangamSignature as Record<string, string>;

  const moonNakIdx = moon?.nakshatra ?? 0;
  const syllables = NAKSHATRA_SYLLABLES[moonNakIdx] ?? ["—", "—", "—", "—"];

  const naaligai = sig.sunrise_time && bp.birthTimeLocal
    ? computeNaaligai(bp.birthTimeLocal, sig.sunrise_time)
    : "—";

  const PLANET_ORDER_PRINT = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU", "MANDHI"];

  const lagnaRow = {
    graha: "LAGNA", nameTA: "லக்னம்",
    absLong: chart.lagna.absoluteLongitude,
    nakshatra: chart.lagna.nakshatra, nakshatraName: chart.lagna.nakshatraName,
    pada: chart.lagna.pada, rasi: chart.lagna.rasi, d9Rasi: d9LagnaRasi, isRetrograde: false,
  };

  const planetRows = PLANET_ORDER_PRINT.map((g) => {
    const p = chart.planets.find((x) => x.graha === g);
    if (!p) return null;
    return {
      graha: g, nameTA: GRAHA_NAMES_TA[g] ?? g,
      absLong: p.absoluteLongitude, nakshatra: p.nakshatra,
      nakshatraName: p.nakshatraName, pada: p.pada,
      rasi: p.rasi, d9Rasi: p.d9Rasi, isRetrograde: p.isRetrograde,
    };
  }).filter(Boolean) as typeof lagnaRow[];

  const allRows = [lagnaRow, ...planetRows];

  const paavagam = PLANET_ORDER_PRINT.map((g) => {
    const p = chart.planets.find((x) => x.graha === g);
    if (!p) return null;
    const abbr = GRAHA_ABBR[g] ?? g.slice(0, 2);
    return `${abbr}${p.isRetrograde ? "(வ)" : ""}-${p.houseFromLagna}`;
  }).filter(Boolean).join(", ");

  const cSt: React.CSSProperties = { border: "0.5px solid var(--print-bdr)", padding: "3px 5px", fontSize: "7.5px", verticalAlign: "middle" };
  const hSt: React.CSSProperties = { ...cSt, fontWeight: 700, background: "var(--print-hdr)", whiteSpace: "nowrap" as const, width: "1%" };

  return (
    <div style={{ fontFamily: '"Noto Serif Tamil","Latha","Tamil MN",Georgia,serif', color: "var(--print-ink)", background: "var(--cl-surface)", padding: "14px 16px", maxWidth: "780px", margin: "0 auto", border: "1.5px solid var(--print-ink)", fontSize: "8px", boxSizing: "border-box" as const }}>

      {/* Header */}
      <div style={{ textAlign: "center", borderBottom: "1.5px solid var(--print-ink)", paddingBottom: "7px", marginBottom: "9px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700 }}>Vinaadi AI</div>
        <div style={{ fontSize: "7.5px", color: "var(--print-warm)", marginTop: "2px" }}>
          விண்ணாடி AI · திருக்கணிதம் · {chart.ayanamsa.type} {chart.ayanamsa.valueDegrees.toFixed(2)}°
        </div>
      </div>

      {/* Section 1 — personal details */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "9px", border: "0.5px solid var(--print-bdr)" }}>
        <tbody>
          <tr>
            <td style={hSt}>பெயர்</td><td style={cSt}>: {bp.displayName}</td>
            <td style={hSt}>அன்னை</td><td style={cSt}>: {motherName || "—"}</td>
          </tr>
          <tr>
            <td style={hSt}>தகப்பனார்</td><td style={cSt}>: {fatherName || "—"}</td>
            <td style={hSt}>பாலினம்</td><td style={cSt}>: {gender === "FEMALE" ? "பெண்" : "ஆண்"}</td>
          </tr>
          <tr>
            <td style={hSt}>பிறந்த தேதி/நேரம்</td>
            <td style={cSt}>: {formatDateTa(bp.birthDateLocal)}{bp.birthTimeLocal ? ` ${bp.birthTimeLocal}` : ""}</td>
            <td style={hSt}>உதயாதி நாழிகை</td><td style={cSt}>: {naaligai}</td>
          </tr>
          <tr>
            <td style={hSt}>லக்னம்</td>
            <td style={cSt}>: {RASI_NAMES_TA[chart.lagna.rasi]} · {chart.lagna.nakshatraName}</td>
            <td style={hSt}>பிறந்த இடம்</td><td style={cSt}>: {bp.birthPlace || "—"}</td>
          </tr>
          <tr>
            <td style={hSt}>ராசி / நட்சத்திரம்</td>
            <td style={cSt}>: {moon ? `${RASI_NAMES_TA[moon.rasi]}-${moon.nakshatraName}, பாதம்-${moon.pada}` : "—"}</td>
            <td style={hSt}>அட்சாம்சம் / தீர்க்காம்சம்</td>
            <td style={cSt}>: {latToDMS(Number(bp.birthLatitude ?? 0))} / {lngToDMS(Number(bp.birthLongitude ?? 0))}</td>
          </tr>
          <tr>
            <td style={hSt}>பஷ்ம-திதி</td>
            <td style={cSt}>: {sig.tithi_paksha ? pakshaTa(sig.tithi_paksha) : "—"}{sig.tithi ? `/${sig.tithi}` : ""}</td>
            <td style={hSt}>சூரிய உதயம்</td><td style={cSt}>: {sig.sunrise_time || "—"}</td>
          </tr>
          <tr>
            <td style={hSt}>யோகம்-காரணம்</td>
            <td style={cSt}>: {sig.yogam || "—"}{sig.karanam ? `/${sig.karanam}` : ""}</td>
            <td style={hSt}>சூரிய அஸ்தமனம்</td><td style={cSt}>: {sig.sunset_time || "—"}</td>
          </tr>
          <tr>
            <td style={hSt}>தமிழ் மாதம்/தேதி</td><td style={cSt}>: {sig.tamil_date_ta || "—"}</td>
            <td style={hSt}>நட்சத்திர எழுத்துக்கள்</td><td style={cSt}>: {syllables.join(", ")}</td>
          </tr>
        </tbody>
      </table>

      {/* Section 2 — planet table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "9px", fontSize: "7.5px" }}>
        <thead>
          <tr>
            {["கிரகம்", "பாகை-கலை", "நட்சத்திரம்", "பாதம்", "நட்சத்திர அதிபதி", "ராசி", "நவாம்சம்", "நிலை"].map((h) => (
              <th key={h} style={{ ...cSt, background: "var(--print-hdr)", fontWeight: 700, textAlign: "center" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allRows.map((row) => {
            const nilai = (row.graha === "LAGNA" || row.graha === "RAHU" || row.graha === "KETU" || row.graha === "MANDHI")
              ? "—" : getNilai(row.graha, row.rasi);
            return (
              <tr key={row.graha}>
                <td style={{ ...cSt, fontWeight: 600 }}>
                  {row.nameTA}{row.isRetrograde && <sup style={{ fontSize: "5.5px", color: "var(--cl-rust)" }}>வ</sup>}
                </td>
                <td style={{ ...cSt, textAlign: "center", fontFamily: "monospace" }}>{toDMS(row.absLong)}</td>
                <td style={cSt}>{row.nakshatraName}</td>
                <td style={{ ...cSt, textAlign: "center" }}>{row.pada}</td>
                <td style={{ ...cSt, textAlign: "center" }}>{row.graha === "LAGNA" ? "—" : (NAKSHATRA_LORDS[row.nakshatra] ?? "—")}</td>
                <td style={cSt}>{RASI_NAMES_TA[row.rasi]}</td>
                <td style={cSt}>{RASI_NAMES_TA[row.d9Rasi] ?? "—"}</td>
                <td style={{ ...cSt, textAlign: "center" }}>{nilai}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Section 3 — charts */}
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginBottom: "9px" }}>
        <PrintRasiChart chart={chart} />
        <PrintRasiChart chart={chart} d9LagnaRasi={d9LagnaRasi} />
      </div>

      {/* Section 4 — dasha + paavagam */}
      <div style={{ borderTop: "0.5px solid var(--print-bdr)", paddingTop: "6px", fontSize: "7.5px", lineHeight: 1.9 }}>
        {dasha && (
          <>
            <div>
              <strong>பிறந்த கால தசை இருப்பு:</strong>{" "}
              {dashaLordTA(dasha.openingDasha.lord)} தசை — இருப்பு {formatDashaBalance(dasha.openingDasha.balanceYearsAtBirth)}
            </div>
            <div>
              <strong>நடப்பு தசை/அந்தரம்:</strong>{" "}
              {dashaLordTA(dasha.current.mahadasha.lord)} தசை · {dashaLordTA(dasha.current.antardasha.lord)} புக்தி —{" "}
              {formatDateTA(dasha.current.antardasha.endDate)} வரை
            </div>
          </>
        )}
        <div><strong>பாவக மாறுதல்:</strong> {paavagam}</div>
      </div>

      {/* Footer — bottom-right */}
      <div style={{ marginTop: "10px", paddingTop: "5px", borderTop: "0.5px solid var(--print-foot-bdr)", display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "6.5px", color: "var(--print-foot)" }}>
          vinaadi.com · திருக்கணிதம் · {chart.ayanamsa.type} {chart.ayanamsa.valueDegrees.toFixed(2)}° · {chart.ephemerisBackend}
        </span>
      </div>
    </div>
  );
}

export default function ChartGeneratePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ta");
  const [form, setForm] = useState<BirthForm>(EMPTY_FORM);
  const [chart, setChart] = useState<ChartCalculateResponseData | null>(null);
  const [chartSummary, setChartSummary] = useState<ChartSummaryData | null>(null);
  const [dashaData, setDashaData] = useState<DashaTimelineResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"D1" | "D9">("D1");
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "ta" || stored === "en") setLang(stored as "ta" | "en");
    // DB overrides localStorage — works in incognito and across devices
    void fetch("/api/backend/api/v1/settings/ui", { credentials: "include" })
      .then((r) => r.json())
      .then((j: { data?: { lang?: string } }) => {
        const dbLang = j.data?.lang;
        if (dbLang === "ta" || dbLang === "en") setLang(dbLang);
      })
      .catch(() => { /* fallback to localStorage */ });
  }, []);

  function currentAge(dateIso: string): number {
    const [yearRaw, monthRaw, dayRaw] = dateIso.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    if (!year || !month || !day) return 0;
    const now = new Date();
    let age = now.getUTCFullYear() - year;
    const monthDiff = now.getUTCMonth() + 1 - month;
    const dayDiff = now.getUTCDate() - day;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
    return Math.max(age, 0);
  }

  async function handleGenerate() {
    if (!form.displayName || !form.birthDateLocal || !form.birthPlace || !form.birthLatitude || !form.birthLongitude || !form.birthTimezone) {
      setError("Please fill all required fields.");
      return;
    }

    setError("");
    setLoading(true);
    setChartSummary(null);
    setDashaData(null);

    try {
      const preview = await apiFetchJson<PublicChartPreviewResponse>("/api/v1/public/chart-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth: {
            displayName: form.displayName,
            birthDateLocal: form.birthDateLocal,
            birthTimeLocal: form.birthTimeLocal || null,
            birthPlace: form.birthPlace,
            birthLatitude: parseFloat(form.birthLatitude),
            birthLongitude: parseFloat(form.birthLongitude),
            birthTimezone: form.birthTimezone,
          },
        }),
      });
      setChart(preview.data.chart);
      setChartSummary(preview.data.summary);
      setDashaData(preview.data.dasha);
    } catch (err) {
      setChart(null);
      setChartSummary(null);
      setDashaData(null);
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleBack() {
    router.back();
  }

  function handlePrint() {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  }

  const moon = chart?.planets.find((p) => p.graha === "MOON");
  const detailRows = chart
    ? [
        { label: "Name", value: chart.birthProfile.displayName },
        { label: "Age", value: String(chartSummary?.currentAge ?? currentAge(chart.birthProfile.birthDateLocal)) },
        { label: "Rasi", value: chartSummary?.moonRasi ?? moon?.rasiName ?? "-" },
        { label: "Lagnam", value: chartSummary?.lagnaRasi ?? chart.lagna.rasiName },
        {
          label: "Nakshathiram",
          value: chartSummary
            ? `${chartSummary.janmaNakshatra} (Pada ${chartSummary.janmaPada})`
            : `${moon?.nakshatraName ?? "-"}${moon?.pada ? ` (Pada ${moon.pada})` : ""}`,
        },
        {
          label: "Current Dasa",
          value: chartSummary ? `${chartSummary.currentMahadasha} / ${chartSummary.currentAntardasha}` : "-",
        },
      ]
    : [];

  return (
    <div
      className="cd-shell"
      style={{
        minHeight: "100vh",
        background: printMode ? "var(--color-surface)" : "var(--nova-hero-gradient, linear-gradient(180deg, var(--panel-warm-light) 0%, var(--surface-0) 92%))",
        color: printMode ? "var(--color-text)" : "var(--color-text-strong)",
        padding: "24px 16px 42px",
      }}
    >
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          body {
            background: var(--cl-surface) !important;
            color: var(--print-ink) !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-shell {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-card {
            border: none !important;
            background: var(--cl-surface) !important;
            color: var(--print-ink) !important;
            box-shadow: none !important;
          }
          .screen-only {
            display: none !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
          .screen-only {
            display: block !important;
          }
        }
      `}</style>

      {/* PRINT-ONLY: Full Jathagam layout */}
      {chart && (
        <div className="print-only">
          <JathagamPrint chart={chart} dasha={dashaData} fatherName={form.fatherName} motherName={form.motherName} gender={form.gender} />
        </div>
      )}

      {/* SCREEN-ONLY: normal app UI */}
      <div className="screen-only print-shell" style={{ maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => void handleBack()}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              color: "var(--color-muted)",
              padding: "6px 12px",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            {"<-"} Back
          </button>
          <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-strong)" }}>Generate Anyone&apos;s Chart</h1>
        </div>

        <p className="no-print" style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-faint)" }}>
          Preview chart only. Nothing here is saved to All Birth Profiles unless you create a real profile.
        </p>

        <div className="card no-print" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", border: "1px solid var(--color-border)" }}>
          <Field label="Name">
            <input
              className="input"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="e.g. Ramesh Kumar"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "12px" }}>
            <Field label="Father's Name">
              <input
                className="input"
                value={form.fatherName}
                onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
                placeholder="e.g. Suresh Kumar"
              />
            </Field>
            <Field label="Mother's Name">
              <input
                className="input"
                value={form.motherName}
                onChange={(e) => setForm((f) => ({ ...f, motherName: e.target.value }))}
                placeholder="e.g. Meena Devi"
              />
            </Field>
          </div>

          <Field label="Gender">
            <select
              className="input"
              aria-label="Gender"
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as "MALE" | "FEMALE" }))}
            >
              <option value="MALE">Male / ஆண்</option>
              <option value="FEMALE">Female / பெண்</option>
            </select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "12px" }}>
            <Field label="Birth Date">
              <input className="input" type="date" value={form.birthDateLocal} onChange={(e) => setForm((f) => ({ ...f, birthDateLocal: e.target.value }))} />
            </Field>
            <Field label="Birth Time">
              <input className="input" type="time" value={form.birthTimeLocal} onChange={(e) => setForm((f) => ({ ...f, birthTimeLocal: e.target.value }))} />
            </Field>
          </div>

          <Field label={t("field_birth_place", lang)} helper={t("field_place_helper", lang)} required>
            <PlaceCombobox
              value={form.birthPlace}
              onChange={(city, raw) => {
                setForm((f) => ({
                  ...f,
                  birthPlace: raw,
                  ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
                }));
              }}
            />
          </Field>

          <Field label={t("field_timezone", lang)} helper={t("field_tz_helper", lang)}>
            <input className="input" value={form.birthTimezone} onChange={(e) => setForm((f) => ({ ...f, birthTimezone: e.target.value }))} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "12px" }}>
            <Field label={t("field_latitude", lang)} required>
              <input className="input" inputMode="decimal" value={form.birthLatitude} onChange={(e) => setForm((f) => ({ ...f, birthLatitude: e.target.value }))} />
            </Field>
            <Field label={t("field_longitude", lang)} required>
              <input className="input" inputMode="decimal" value={form.birthLongitude} onChange={(e) => setForm((f) => ({ ...f, birthLongitude: e.target.value }))} />
            </Field>
          </div>

          {error && <p style={{ margin: 0, color: "var(--color-error-light)", fontSize: "0.78rem" }}>{error}</p>}

          <button type="button" className="button button--primary" onClick={() => void handleGenerate()} disabled={loading}>
            {loading ? "Calculating..." : "Generate Chart"}
          </button>
        </div>

        {chart && (
          <div className="card print-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid var(--color-border)" }}>
            <div style={{ padding: "12px 14px", borderRadius: "10px", background: "var(--color-mid-bg)", border: "1px solid var(--color-mid-border)" }}>
              <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--color-mid)" }}>{chart.birthProfile.displayName}</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--color-muted)" }}>{chart.birthProfile.birthDateLocal}</p>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  padding: "6px 12px",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "1px solid var(--info)",
                  background: "var(--info-subtle)",
                  color: "var(--info)",
                }}
              >
                Print Jathagam
              </button>

              {(["D1", "D9"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: "14px",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: view === v ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                    background: view === v ? "var(--color-mid-bg)" : "transparent",
                    color: view === v ? "var(--color-accent)" : "var(--color-text)",
                  }}
                >
                  {v === "D1" ? t("label_d1", lang) : t("label_d9", lang)}
                </button>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px",
              }}
            >
              {detailRows.map((row) => (
                <div key={row.label} style={{ borderRadius: "10px", border: "1px solid var(--color-border)", padding: "10px 12px" }}>
                  <p style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                    {row.label}
                  </p>
                  <p style={{ margin: "5px 0 0", fontSize: "0.9rem", fontWeight: 700 }}>{row.value}</p>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: "10px", border: "1px solid var(--color-success)", background: "var(--success-subtle)", padding: "12px 14px" }}>
              <p style={{ margin: 0, fontSize: "0.76rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-success)" }}>Calculation Method</p>
              <p style={{ margin: "6px 0 0", fontSize: "0.86rem" }}>
                Version: <strong>{chart.calculationVersion}</strong> | Ayanamsa: <strong>{chart.ayanamsa.type}</strong> | Ephemeris: <strong>{chart.ephemerisBackend}</strong>
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "var(--color-text)", opacity: 0.75 }}>
                House style: Whole-sign from Lagna. Dasha system: Vimshottari from Moon longitude.
              </p>
            </div>

            {view === "D1" ? <RasiChart chart={chart} label={t("label_d1", lang)} lang={lang} showExplain /> : <NavamsaChart chart={chart} label={t("label_d9", lang)} lang={lang} showExplain />}
          </div>
        )}
      </div>
    </div>
  );
}
