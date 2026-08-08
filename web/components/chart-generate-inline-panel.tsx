"use client";

import React, { useState } from "react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { track } from "@/lib/analytics";
import { MIN_BIRTH_DATE, maxBirthDateIso } from "@/lib/birth-date";
import { useBirthProfileForm } from "@/hooks/useBirthProfileForm";
import { t, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartCalculateResponseData, ChartSummaryData, DashaTimelineResponseData } from "@/lib/types";
import { RasiChart, NavamsaChart } from "./dashboard-charts";
import { Field, Input, Select } from "./ui/field";
import { PlaceCombobox } from "./place-combobox";
import { Card } from "./ui/card";
import { nakshatraLordShort } from "@vinaadi/shared/nakshatraLord";
import {
  computeD9LagnaRasi,
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

const W = {
  inkMid: "var(--panel-earth)",
  muted: "var(--color-faint)",
  mutedLt: "var(--color-faint)",
  border: "var(--panel-tan)",
  borderLt: "var(--panel-tan-light)",
  surface: "var(--panel-cream)",
  surfaceMd: "var(--panel-hover)",
  card: "var(--chart-cell-default)",
  terracotta: "var(--panel-brand)",
  rust: "var(--planet-saturn)",
  sage: "var(--chart-d9-active)",
} as const;

// ── Traditional data tables ──────────────────────────────────────────────────
// Nakshatra lords are derived from the shared Vimshottari cycle rather than
// transcribed here — see packages/shared/src/nakshatraLord.ts.
const NAKSHATRA_LORDS: Record<number, string> = Object.fromEntries(
  Array.from({ length: 27 }, (_, i) => [i + 1, nakshatraLordShort(i + 1, "ta")]),
);

const RASI_LORDS_TA: Record<number, string> = {
  1: "செவ்", 2: "சுக்", 3: "புத", 4: "சந்", 5: "சூரி", 6: "புத",
  7: "சுக்", 8: "செவ்", 9: "குரு", 10: "சனி", 11: "சனி", 12: "குரு",
};

const RASI_NAMES_TA: Record<number, string> = {
  1: "மேஷம்", 2: "ரிஷபம்", 3: "மிதுனம்", 4: "கடகம்", 5: "சிம்மம்", 6: "கன்னி",
  7: "துலாம்", 8: "விருச்சிகம்", 9: "தனுசு", 10: "மகரம்", 11: "கும்பம்", 12: "மீனம்",
};

// MANDHI is the only name this file still owns — it is an upagraha, not one of
// the nine, so `tPlanetLord` has no row for it and this is a genuine local
// addition rather than a copy. The nine came from here until four sibling panels
// proved what a hand-copied graha map costs (Venus as "சுக்ரன்").
function grahaNameTA(code: string): string {
  if (code === "MANDHI") return "மாந்தி";
  return tPlanetLord(code, "ta") || code;
}

const PLANET_DIRECTION: Record<string, string> = {
  SUN: "கி", MOON: "வ", MARS: "தெ", MERCURY: "வ.கி", JUPITER: "வ.கி",
  VENUS: "கி.தெ", SATURN: "ம", RAHU: "ஈ", KETU: "ஈ", MANDHI: "-",
};

const WEEKDAY_NAMES_TA = ["திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி", "ஞாயிறு"];

const RASI_GRID: { rasi: number; col: number; row: number }[] = [
  { rasi: 12, col: 0, row: 0 }, { rasi: 1, col: 1, row: 0 }, { rasi: 2, col: 2, row: 0 }, { rasi: 3, col: 3, row: 0 },
  { rasi: 11, col: 0, row: 1 }, { rasi: 4, col: 3, row: 1 },
  { rasi: 10, col: 0, row: 2 }, { rasi: 5, col: 3, row: 2 },
  { rasi: 9, col: 0, row: 3 }, { rasi: 8, col: 1, row: 3 }, { rasi: 7, col: 2, row: 3 }, { rasi: 6, col: 3, row: 3 },
];

// ── Utility functions ─────────────────────────────────────────────────────────
function degreesToDMS(deg: number): string {
  const d = Math.floor(deg);
  const mRaw = (deg - d) * 60;
  const m = Math.floor(mRaw);
  const s = Math.round((mRaw - m) * 60);
  return `${String(d).padStart(2, "0")}° ${String(m).padStart(2, "0")}' ${String(s).padStart(2, "0")}"`;
}

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
  return tPlanetLord(lord, "ta") || lord;
}

function currentAge(dateIso: string): number {
  const [yearRaw, monthRaw, dayRaw] = dateIso.split("-");
  const year = Number(yearRaw); const month = Number(monthRaw); const day = Number(dayRaw);
  if (!year || !month || !day) return 0;
  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const monthDiff = now.getUTCMonth() + 1 - month;
  const dayDiff = now.getUTCDate() - day;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return Math.max(age, 0);
}

// ── Compact print-only Rasi grid ──────────────────────────────────────────────
function PrintRasiChart({ chart, d9LagnaRasi }: { chart: ChartCalculateResponseData; d9LagnaRasi?: number }) {
  const isD9 = d9LagnaRasi !== undefined;
  const lagnaRasi = isD9 ? d9LagnaRasi : chart.lagna.rasi;
  const cellPx = 60;

  function getOccupants(rasi: number) {
    if (isD9) {
      const occ: string[] = [];
      if (d9LagnaRasi === rasi) occ.push("ல");
      chart.planets.forEach((p) => { if (p.d9Rasi === rasi) occ.push(GRAHA_ABBR[p.graha] ?? p.graha.slice(0, 2)); });
      return occ;
    }
    const occ: string[] = [];
    if (chart.lagna.rasi === rasi) occ.push("ல");
    chart.planets.forEach((p) => { if (p.rasi === rasi) occ.push(GRAHA_ABBR[p.graha] ?? p.graha.slice(0, 2)); });
    return occ;
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(4, ${cellPx}px)`,
      gridTemplateRows: `repeat(4, ${cellPx}px)`,
      border: "1.5px solid var(--print-ink)",
      width: `${cellPx * 4 + 2}px`,
    }}>
      {RASI_GRID.map(({ rasi, col, row }) => {
        const occ = getOccupants(rasi);
        const isLagna = lagnaRasi === rasi;
        return (
          <div key={rasi} style={{
            gridColumn: col + 1, gridRow: row + 1,
            border: "0.5px solid var(--print-bdr)", padding: "2px 3px", fontSize: "7.5px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            background: isLagna ? "var(--print-lagna-bg)" : "var(--print-center)", position: "relative", minHeight: `${cellPx}px`,
          }}>
            {isLagna && (
              <div style={{
                position: "absolute", top: 0, right: 0, width: 0, height: 0,
                borderStyle: "solid", borderWidth: "0 12px 12px 0",
                borderColor: "transparent var(--chart-amber) transparent transparent",
              }} />
            )}
            <span style={{ color: "var(--print-muted)", fontSize: "6.5px" }}>{RASI_NAMES_TA[rasi]}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1px" }}>
              {occ.map((o, i) => <span key={i} style={{ fontWeight: 700, color: "var(--print-ink)", fontSize: "8px", lineHeight: 1.2 }}>{o}</span>)}
            </div>
          </div>
        );
      })}
      <div style={{
        gridColumn: "2 / 4", gridRow: "2 / 4",
        border: "0.5px solid var(--print-bdr)", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--print-center)", padding: "4px",
      }}>
        <div style={{ textAlign: "center", fontSize: "7px", color: "var(--print-ink)", lineHeight: 1.4 }}>
          <div style={{ fontWeight: 700, fontSize: "7.5px" }}>{isD9 ? "நவாம்சம்" : "இராசி"}</div>
          <div>{chart.birthProfile.displayName}</div>
          <div style={{ fontSize: "6.5px", color: "var(--print-warm)" }}>
            {isD9 ? "நவாம்சம் / Male" : `${RASI_NAMES_TA[chart.lagna.rasi]} லக்னம்`}
          </div>
          <div style={{ fontSize: "6px", color: "var(--print-muted)" }}>
            {chart.birthProfile.birthDateLocal}
            {chart.birthProfile.birthTimeLocal ? ` - ${chart.birthProfile.birthTimeLocal}` : ""}
          </div>
          {chart.birthProfile.birthLatitude !== undefined && (
            <div style={{ fontSize: "6px", color: "var(--print-muted)" }}>
              Lat: {Number(chart.birthProfile.birthLatitude).toFixed(2)} N · Lon: {Number(chart.birthProfile.birthLongitude ?? 0).toFixed(1)} E
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Full traditional print layout ────────────────────────────────────────────
function JathagamPrint({ chart, dasha, fatherName, motherName, gender }: {
  chart: ChartCalculateResponseData; dasha: DashaTimelineResponseData | null;
  fatherName: string; motherName: string; gender: string;
}) {
  const d9LagnaRasi = computeD9LagnaRasi(chart.lagna.absoluteLongitude);
  const bp = chart.birthProfile;
  const moon = chart.planets.find((p) => p.graha === "MOON");
  const weekday = formatWeekday(bp.birthDateLocal);

  const PLANET_ORDER = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU", "MANDHI"];
  const lagnaRow = {
    graha: "LAGNA", nameTA: "லக்னம்",
    absLong: chart.lagna.absoluteLongitude, degInRasi: chart.lagna.degreeInRasi,
    nakshatra: chart.lagna.nakshatra, nakshatraName: chart.lagna.nakshatraName,
    pada: chart.lagna.pada, rasi: chart.lagna.rasi, isRetrograde: false,
  };
  const planetRows = PLANET_ORDER.map((g) => {
    const p = chart.planets.find((x) => x.graha === g);
    if (!p) return null;
    return {
      graha: g, nameTA: grahaNameTA(g),
      absLong: p.absoluteLongitude, degInRasi: p.degreeInRasi,
      nakshatra: p.nakshatra, nakshatraName: p.nakshatraName,
      pada: p.pada, rasi: p.rasi, isRetrograde: p.isRetrograde,
    };
  }).filter(Boolean) as typeof lagnaRow[];
  const allRows = [lagnaRow, ...planetRows];

  const cellStyle: React.CSSProperties = { border: "0.5px solid var(--print-foot-bdr)", padding: "2px 4px", fontSize: "7.5px", textAlign: "center", verticalAlign: "middle" };
  const headerCellStyle: React.CSSProperties = { ...cellStyle, background: "var(--print-hdr)", fontWeight: 700, fontSize: "7px" };

  return (
    <div style={{ fontFamily: "serif", color: "var(--print-ink)", background: "var(--print-center)", padding: "14px 18px", maxWidth: "740px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <div style={{ fontSize: "11px", color: "var(--print-warm)" }}>உ</div>
        <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.04em" }}>ஜாதக கணிதம்</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8px", marginBottom: "8px", border: "0.5px solid var(--print-foot-bdr)" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", width: "22%", fontWeight: 600 }}>பெயர்</td>
            <td style={{ ...cellStyle, textAlign: "left", width: "28%" }}>: {bp.displayName}</td>
            <td style={{ ...cellStyle, textAlign: "left", width: "22%", fontWeight: 600 }}>தகப்பனார்</td>
            <td style={{ ...cellStyle, textAlign: "left", width: "28%" }}>: {fatherName || "—"}</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>அன்னை</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {motherName || "—"}</td>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>பாலினம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {gender === "FEMALE" ? "பெண் / Female" : "ஆண் / Male"}</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>சூ.தமிழ் நேரம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {bp.birthTimeLocal ?? "-"}</td>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}></td>
            <td style={{ ...cellStyle, textAlign: "left" }}></td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>பிறந்த தேதி</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {formatDateTa(bp.birthDateLocal)}</td>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>அயனாம்சம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {chart.ayanamsa.valueDegrees.toFixed(2)} (லஹிரி)</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>பிறந்த நேரம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {bp.birthTimeLocal ?? "-"} am</td>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>அட்சாம்சம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {bp.birthLatitude !== undefined ? `${Number(bp.birthLatitude).toFixed(2)} N` : "-"}</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>பாலினம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: ஆண் / Male</td>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>நீர்க்காம்சம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {bp.birthLongitude !== undefined ? `${Number(bp.birthLongitude).toFixed(1)} E` : "-"}</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>பிறந்த கிழமை</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {weekday}</td>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>லக்னம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {RASI_NAMES_TA[chart.lagna.rasi] ?? chart.lagna.rasiName}</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>ஜென்ம நட்சத்திரம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {moon?.nakshatraName ?? chart.lagna.nakshatraName} - {moon?.pada ?? chart.lagna.pada}ஆம் பாதம்</td>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>ஜென்ம ராசி</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {moon ? RASI_NAMES_TA[moon.rasi] : "-"}</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>பிறந்த இடம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }} colSpan={3}>: {bp.birthPlace}</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>கணிப்பு முறை</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {chart.calculationVersion}</td>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>கணிப்பு நிலை</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {chart.ephemerisBackend}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: "flex", gap: "24px", justifyContent: "center", marginBottom: "8px", alignItems: "flex-start" }}>
        <PrintRasiChart chart={chart} />
        <PrintRasiChart chart={chart} d9LagnaRasi={d9LagnaRasi} />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5px", marginTop: "4px" }}>
        <thead>
          <tr>
            <th style={headerCellStyle}>கிரகம்</th>
            <th style={headerCellStyle}>பா-கலை</th>
            <th style={headerCellStyle}>நட்சத்திரம்</th>
            <th style={headerCellStyle}>ந-பாதம்</th>
            <th style={headerCellStyle}>சாரம்</th>
            <th style={headerCellStyle}>கிய-கலை</th>
            <th style={headerCellStyle}>ராசி</th>
            <th style={headerCellStyle}>ராசி அதிபதி</th>
            <th style={headerCellStyle}>கிலம்</th>
          </tr>
        </thead>
        <tbody>
          {allRows.map((row) => (
            <tr key={row.graha}>
              <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>
                {row.nameTA}
                {row.isRetrograde ? <sup style={{ fontSize: "6px", color: "var(--dignity-neecha)" }}>வ</sup> : null}
              </td>
              <td style={cellStyle}>{degreesToDMS(row.absLong)}</td>
              <td style={{ ...cellStyle, textAlign: "left" }}>{row.nakshatraName}</td>
              <td style={cellStyle}>{row.pada}</td>
              <td style={cellStyle}>{NAKSHATRA_LORDS[row.nakshatra] ?? "-"}</td>
              <td style={cellStyle}>{degreesToDMS(row.degInRasi)}</td>
              <td style={{ ...cellStyle, textAlign: "left" }}>{RASI_NAMES_TA[row.rasi] ?? String(row.rasi)}</td>
              <td style={cellStyle}>{RASI_LORDS_TA[row.rasi] ?? "-"}</td>
              <td style={cellStyle}>{PLANET_DIRECTION[row.graha] ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {dasha && (
        <div style={{ marginTop: "8px", fontSize: "8px", color: "var(--print-ink)", lineHeight: 1.8, borderTop: "0.5px solid var(--print-foot-bdr)", paddingTop: "6px" }}>
          <div>
            <strong>பிறந்த கால தசை இருப்பு (Dasa at Birth):</strong>{" "}
            {dashaLordTA(dasha.openingDasha.lord)} தசை — இருப்பு {formatDashaBalance(dasha.openingDasha.balanceYearsAtBirth)}
          </div>
          <div>
            <strong>நடப்பு தசை இன்று (Current Dasa Today):</strong>{" "}
            {dashaLordTA(dasha.current.mahadasha.lord)} மகாதசை /{" "}
            {dashaLordTA(dasha.current.antardasha.lord)} அந்தர்தசை —{" "}
            {formatDateTA(dasha.current.mahadasha.startDate)} முதல் {formatDateTA(dasha.current.mahadasha.endDate)} வரை
          </div>
        </div>
      )}

      <div style={{ marginTop: "6px", fontSize: "7px", color: "var(--print-warm)", lineHeight: 1.5 }}>
        <strong>குறிப்பு:</strong> கணிப்பு - Vinaadi AI | அயனாம்சம்: லஹிரி | கிரக நிலைகள் பக்காவான் ஆகும்.
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface ChartGenerateInlinePanelProps {
  lang: Lang;
}

export function ChartGenerateInlinePanel({ lang }: ChartGenerateInlinePanelProps) {
  const { nextBirthDateOrCurrent, applyPlaceSelection } = useBirthProfileForm();
  const [form, setForm] = useState<BirthForm>(EMPTY_FORM);
  const [chart, setChart] = useState<ChartCalculateResponseData | null>(null);
  const [chartSummary, setChartSummary] = useState<ChartSummaryData | null>(null);
  const [dashaData, setDashaData] = useState<DashaTimelineResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"D1" | "D9">("D1");
  const [printMode, setPrintMode] = useState(false);


  async function handleGenerate() {
    if (!form.displayName || !form.birthDateLocal || !form.birthPlace || !form.birthLatitude || !form.birthLongitude || !form.birthTimezone) {
      setError(lang === "ta" ? "அனைத்து தகவல்களையும் நிரப்பவும்." : "Please fill all required fields.");
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
      track("chart_generated");
      setChartSummary(preview.data.summary);
      setDashaData(preview.data.dasha);
    } catch (err) {
      setChart(null); setChartSummary(null); setDashaData(null);
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    setPrintMode(true);
    setTimeout(() => { window.print(); setPrintMode(false); }, 100);
  }

  const moon = chart?.planets.find((p) => p.graha === "MOON");
  const detailRows = chart ? [
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
    { label: "Current Dasa", value: chartSummary ? `${chartSummary.currentMahadasha} / ${chartSummary.currentAntardasha}` : "-" },
  ] : [];

  return (
    <>
      {/* Print CSS — hides entire page UI, shows only the Jathagam print layout */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .cgp-print-only, .cgp-print-only * { visibility: visible !important; }
          .cgp-print-only {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            background: var(--print-center) !important;
            display: block !important;
          }
          body { background: var(--print-center) !important; margin: 0 !important; }
        }
        @media screen {
          .cgp-print-only { display: none !important; }
        }
      `}</style>

      {/* PRINT-ONLY: full traditional Jathagam layout */}
      {chart && (
        <div className="cgp-print-only">
          <JathagamPrint chart={chart} dasha={dashaData} fatherName={form.fatherName} motherName={form.motherName} gender={form.gender} />
        </div>
      )}

      {/* SCREEN: interactive panel */}
      <div className="cgp-no-print" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted }}>
          {lang === "ta"
            ? "தற்காலிக ஜாதகம். தளத்தை மூடியதும் தானாக நீக்கப்படும்."
            : "Preview only. This chart is not saved to your account."}
        </p>

        {/* Birth details form */}
        <Card className="card" variant="soft" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <Field label={lang === "ta" ? "பெயர்" : "Name"}>
            <Input value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder={lang === "ta" ? "உதாரணம்: ரமேஷ் குமார்" : "e.g. Ramesh Kumar"} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "12px" }}>
            <Field label={lang === "ta" ? "தகப்பனார் பெயர்" : "Father's Name"}>
              <Input value={form.fatherName}
                onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
                placeholder={lang === "ta" ? "உதாரணம்: சுரேஷ் குமார்" : "e.g. Suresh Kumar"} />
            </Field>
            <Field label={lang === "ta" ? "அன்னை பெயர்" : "Mother's Name"}>
              <Input value={form.motherName}
                onChange={(e) => setForm((f) => ({ ...f, motherName: e.target.value }))}
                placeholder={lang === "ta" ? "உதாரணம்: மீனா தேவி" : "e.g. Meena Devi"} />
            </Field>
          </div>

          <Field label={lang === "ta" ? "பாலினம்" : "Gender"}>
            <Select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as "MALE" | "FEMALE" }))}
            >
              <option value="MALE">{lang === "ta" ? "ஆண் / Male" : "Male / ஆண்"}</option>
              <option value="FEMALE">{lang === "ta" ? "பெண் / Female" : "Female / பெண்"}</option>
            </Select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "12px" }}>
            <Field label={lang === "ta" ? "பிறந்த தேதி" : "Birth Date"}>
              <Input
                type="date"
                value={form.birthDateLocal}
                min={MIN_BIRTH_DATE}
                max={maxBirthDateIso()}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    birthDateLocal: nextBirthDateOrCurrent(f.birthDateLocal, e.target.value),
                  }));
                }}
              />
            </Field>
            <Field label={lang === "ta" ? "பிறந்த நேரம்" : "Birth Time"}>
              <Input type="time" value={form.birthTimeLocal}
                onChange={(e) => setForm((f) => ({ ...f, birthTimeLocal: e.target.value }))} />
            </Field>
          </div>

          <Field label={t("field_birth_place", lang)} helper={t("field_place_helper", lang)}>
            {/* PlaceCombobox does not spread arbitrary input props, so the id and
                aria-describedby Field clones onto it are dropped and the label's
                htmlFor resolves to nothing — it is named explicitly instead. */}
            <PlaceCombobox
              value={form.birthPlace}
              aria-label={t("field_birth_place", lang)}
              onChange={(city, raw) => setForm((f) => applyPlaceSelection(f, city, raw))}
            />
          </Field>

          <Field label={t("field_timezone", lang)}>
            <Input value={form.birthTimezone}
              onChange={(e) => setForm((f) => ({ ...f, birthTimezone: e.target.value }))} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "12px" }}>
            <Field label={t("field_latitude", lang)}>
              <Input inputMode="decimal" value={form.birthLatitude}
                onChange={(e) => setForm((f) => ({ ...f, birthLatitude: e.target.value }))} />
            </Field>
            <Field label={t("field_longitude", lang)}>
              <Input inputMode="decimal" value={form.birthLongitude}
                onChange={(e) => setForm((f) => ({ ...f, birthLongitude: e.target.value }))} />
            </Field>
          </div>

          {error && <p role="alert" style={{ margin: 0, color: W.rust, fontSize: "0.75rem" }}>{error}</p>}

          <button type="button" className="button button--primary" style={{ background: "var(--panel-warm-light)", border: `1px solid ${W.terracotta}66`, color: W.terracotta }}
            onClick={() => void handleGenerate()} disabled={loading}>
            {loading
              ? (lang === "ta" ? "கணக்கிடுகிறது…" : "Calculating…")
              : (lang === "ta" ? "ஜாதகம் உருவாக்கு" : "Generate Chart")}
          </button>
        </Card>

        {/* Results */}
        {chart && (
          <Card className="card" variant="soft" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Person header */}
            <Card style={{ padding: "12px 14px", borderRadius: "10px" }}>
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: W.terracotta }}>{chart.birthProfile.displayName}</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: W.muted }}>{chart.birthProfile.birthDateLocal}</p>
            </Card>

            {/* Action buttons: Print Jathagam (prominent) + D1/D9 toggle */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" onClick={handlePrint}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 18px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 700,
                  cursor: "pointer", border: `1.5px solid ${W.border}`,
                  background: W.surface, color: W.inkMid,
                  letterSpacing: "0.02em",
                }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 800 }}>PR</span>
                {lang === "ta" ? "ஜாதகம் அச்சிடு" : "Print Jathagam"}
              </button>

              {(["D1", "D9"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)}
                  style={{
                    padding: "5px 14px", borderRadius: "14px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                    border: view === v ? `1px solid ${W.terracotta}66` : `1px solid ${W.border}`,
                    background: view === v ? "var(--panel-warm-light)" : W.card,
                    color: view === v ? W.terracotta : W.muted,
                  }}>
                  {v === "D1" ? t("label_d1", lang) : t("label_d9", lang)}
                </button>
              ))}
            </div>

            {/* Summary chips */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
              {detailRows.map((row) => (
                <div key={row.label} style={{ borderRadius: "10px", border: `1px solid ${W.borderLt}`, padding: "10px 12px" }}>
                  <p style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase", color: W.mutedLt }}>{row.label}</p>
                  <p style={{ margin: "5px 0 0", fontSize: "0.875rem", fontWeight: 700, color: W.inkMid }}>{row.value}</p>
                </div>
              ))}
            </div>

            {/* Calculation method */}
            <Card style={{ borderRadius: "10px", padding: "12px 14px" }}>
              <p style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase", color: W.terracotta }}>Calculation Method</p>
              <p style={{ margin: "6px 0 0", fontSize: "0.875rem" }}>
                Version: <strong>{chart.calculationVersion}</strong> | Ayanamsa: <strong>{chart.ayanamsa.type}</strong> | Ephemeris: <strong>{chart.ephemerisBackend}</strong>
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: W.muted }}>
                House style: Whole-sign from Lagna. Dasa system: Vimshottari from Moon longitude.
              </p>
            </Card>

            {/* Interactive chart (D1 or D9) */}
            {view === "D1"
              ? <RasiChart chart={chart} label={t("label_d1", lang)} lang={lang} showExplain />
              : <NavamsaChart chart={chart} label={t("label_d9", lang)} lang={lang} showExplain />
            }
          </Card>
        )}

        {/* Hidden print-mode indicator for styling */}
        {printMode && <div style={{ display: "none" }} />}
      </div>
    </>
  );
}



