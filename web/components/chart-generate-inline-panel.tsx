"use client";

import React, { useState } from "react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { track } from "@/lib/analytics";
import { MIN_BIRTH_DATE, maxBirthDateIso } from "@/lib/birth-date";
import { useBirthProfileForm } from "@/hooks/useBirthProfileForm";
import { t, tNakshatra, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartCalculateResponseData, ChartSummaryData, DashaTimelineResponseData } from "@/lib/types";
import { RasiChart, NavamsaChart } from "./dashboard-charts";
import { Field, Input, Select } from "./ui/field";
import { PlaceCombobox } from "./place-combobox";
import { Card } from "./ui/card";
import { nakshatraLord, nakshatraLordShort } from "@vinaadi/shared/nakshatraLord";
import {
  buildD1CellDetail,
  buildD9CellDetail,
  computeD9LagnaRasi,
  D1_RASI_NAMES_TA,
  GRAHA_ABBR,
  rasiLabel,
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

// The print sheet is Tamil-only by design, so it reads the Tamil column of the
// shared table directly. This used to be a third hand-copied twelve-row map.
const RASI_NAMES_TA = D1_RASI_NAMES_TA;

// MANDHI is the only name this file still owns — it is an upagraha, not one of
// the nine, so `tPlanetLord` has no row for it and this is a genuine local
// addition rather than a copy. The nine came from here until four sibling panels
// proved what a hand-copied graha map costs (Venus as "சுக்ரன்").
function grahaNameTA(code: string): string {
  return grahaName(code, "ta");
}

/** The print sheet is Tamil-only by design; the screen follows the reader's
 *  language, so the same MANDHI carve-out has to work in both. */
function grahaName(code: string, lang: Lang): string {
  if (code === "MANDHI") return lang === "ta" ? "மாந்தி" : "Mandhi";
  return tPlanetLord(code, lang) || code;
}

const PLANET_DIRECTION: Record<string, string> = {
  SUN: "கி", MOON: "வ", MARS: "தெ", MERCURY: "வ.கி", JUPITER: "வ.கி",
  VENUS: "கி.தெ", SATURN: "ம", RAHU: "ஈ", KETU: "ஈ", MANDHI: "-",
};

const WEEKDAY_NAMES_TA = ["திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி", "ஞாயிறு"];

/** Traditional reading order of the sheet: the seven grahas, the two nodes,
 *  then Mandhi. Shared by the print sheet and the on-screen positions table so
 *  the two can never drift into a different row order. */
const PLANET_ORDER = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU", "MANDHI"];

const RASI_GRID: { rasi: number; col: number; row: number }[] = [
  { rasi: 12, col: 0, row: 0 }, { rasi: 1, col: 1, row: 0 }, { rasi: 2, col: 2, row: 0 }, { rasi: 3, col: 3, row: 0 },
  { rasi: 11, col: 0, row: 1 }, { rasi: 4, col: 3, row: 1 },
  { rasi: 10, col: 0, row: 2 }, { rasi: 5, col: 3, row: 2 },
  { rasi: 9, col: 0, row: 3 }, { rasi: 8, col: 1, row: 3 }, { rasi: 7, col: 2, row: 3 }, { rasi: 6, col: 3, row: 3 },
];

// ── Utility functions ─────────────────────────────────────────────────────────
function degreesToDMS(deg: number): string {
  const d0 = Math.floor(deg);
  const mRaw = (deg - d0) * 60;
  const m0 = Math.floor(mRaw);
  // Rounding the seconds can land on 60, which is not a reading — the sheet
  // printed Rahu and Ketu at 17° 37' 60" instead of 17° 38' 00". Carry it.
  let s = Math.round((mRaw - m0) * 60);
  let m = m0;
  let d = d0;
  if (s === 60) { s = 0; m += 1; }
  if (m === 60) { m = 0; d += 1; }
  return `${String(d).padStart(2, "0")}° ${String(m).padStart(2, "0")}' ${String(s).padStart(2, "0")}"`;
}

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return WEEKDAY_NAMES_TA[d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1] ?? "";
}

/** The API returns birth time as "HH:MM:SS". A jathagam is read to the minute,
 *  and the trailing ":00" is noise on every surface that shows it. */
function formatClockTime(time: string | null | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  return h && m ? `${h}:${m}` : time;
}

function formatDateTa(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function formatDashaBalance(years: number, lang: Lang = "ta"): string {
  const y = Math.floor(years);
  const months = Math.round((years - y) * 12);
  if (lang === "en") {
    if (y === 0) return `${months} month${months === 1 ? "" : "s"}`;
    if (months === 0) return `${y} year${y === 1 ? "" : "s"}`;
    return `${y} year${y === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"}`;
  }
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
function PrintRasiChart({ chart, d9LagnaRasi, genderTA }: { chart: ChartCalculateResponseData; d9LagnaRasi?: number; genderTA: string }) {
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
            {isD9 ? `நவாம்சம் · ${genderTA}` : `${RASI_NAMES_TA[chart.lagna.rasi]} லக்னம்`}
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
  const genderTA = gender === "FEMALE" ? "பெண்" : "ஆண்";

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
            <td style={{ ...cellStyle, textAlign: "left" }}>: {genderTA}</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>சூ.தமிழ் நேரம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {formatClockTime(bp.birthTimeLocal) || "-"}</td>
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
            <td style={{ ...cellStyle, textAlign: "left" }}>: {formatClockTime(bp.birthTimeLocal) || "-"}</td>
            {/* Lat and long read as one coordinate, so they share a row — which
                also retires a duplicate "பாலினம்" row that printed a hardcoded
                "ஆண் / Male" underneath the real gender two rows above. */}
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>அட்சாம்சம் / தீர்க்காம்சம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>
              : {bp.birthLatitude !== undefined ? `${Number(bp.birthLatitude).toFixed(2)} N` : "-"}
              {" / "}
              {bp.birthLongitude !== undefined ? `${Number(bp.birthLongitude).toFixed(2)} E` : "-"}
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>பிறந்த கிழமை</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {weekday}</td>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>லக்னம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {RASI_NAMES_TA[chart.lagna.rasi] ?? chart.lagna.rasiName}</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>ஜென்ம நட்சத்திரம்</td>
            {/* The sheet is Tamil throughout, but the API sends the nakshatra as
                an uppercase key, so this row printed "UTHIRADAM" in Latin. */}
            <td style={{ ...cellStyle, textAlign: "left" }}>: {tNakshatra(moon?.nakshatraName ?? chart.lagna.nakshatraName, "ta")} - {moon?.pada ?? chart.lagna.pada}ஆம் பாதம்</td>
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
        <PrintRasiChart chart={chart} genderTA={genderTA} />
        <PrintRasiChart chart={chart} d9LagnaRasi={d9LagnaRasi} genderTA={genderTA} />
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
              <td style={{ ...cellStyle, textAlign: "left" }}>{tNakshatra(row.nakshatraName, "ta")}</td>
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

// ── Screen sheet: shared bits ─────────────────────────────────────────────────
//
// The screen used to show far less than the print sheet — six English-only
// chips, a provenance card ranked above the chart, and one kattam hidden behind
// a D1/D9 toggle. A jathagam is read as a document: அடையாளம் → கட்டங்கள் →
// கிரக நிலை → தசை. These pieces give the screen that same order, at screen
// scale, so nothing on paper is missing from the browser.

/** Tamil script carries no case and letter-spacing pulls its ligatures apart,
 *  so the kicker treatment (uppercase + tracking) is applied to English only. */
function SheetSection({ title, hint, children, lang }: {
  title: string; hint?: string; children: React.ReactNode; lang: Lang;
}) {
  const isTa = lang === "ta";
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div>
        <h3 style={{
          margin: 0, fontSize: "0.75rem", fontWeight: 700, color: W.terracotta,
          textTransform: isTa ? "none" : "uppercase",
          letterSpacing: isTa ? "normal" : "0.06em",
        }}>
          {title}
        </h3>
        {hint ? (
          <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: W.muted, lineHeight: 1.45 }}>{hint}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FactCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt, lineHeight: 1.3 }}>{label}</p>
      <p style={{ margin: "3px 0 0", fontSize: "0.875rem", fontWeight: 700, color: W.inkMid, lineHeight: 1.35 }}>{value}</p>
    </div>
  );
}

function FlagChip({ text, tone }: { text: string; tone: "vargottama" | "vakra" | "astam" }) {
  const color = tone === "vargottama" ? W.sage : tone === "astam" ? W.rust : W.terracotta;
  return (
    <span style={{
      fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.2, color,
      border: `1px solid ${color}59`, borderRadius: "var(--radius-full, 999px)",
      padding: "1px 7px", whiteSpace: "nowrap",
    }}>
      {text}
    </span>
  );
}

// ── The kattam pair — D1 and D9 together, one linked selection ────────────────
//
// Side by side is not a preference here. A graha's real strength is a D1↔D9
// question — வர்கோத்தமம் (same rasi in both), a neecha graha rescued in the
// navamsam, a strong D1 lord that falls apart in D9 — and none of those can be
// seen one chart at a time. Selecting a rasi lights it in BOTH grids and the
// strip below reads out that rasi from each chart at once, which is the gesture
// an astrologer actually makes.
function KattamPair({ chart, lang }: { chart: ChartCalculateResponseData; lang: Lang }) {
  const [selectedRasi, setSelectedRasi] = useState<number>(chart.lagna.rasi);
  const d1 = buildD1CellDetail(chart, selectedRasi);
  const d9 = buildD9CellDetail(chart, selectedRasi);
  const isTa = lang === "ta";

  const columns: { key: string; label: string; house: string; detail: typeof d1 }[] = [
    {
      key: "d1",
      label: isTa ? "ராசியில்" : "In the Rasi (D1)",
      house: `${isTa ? "லக்னத்திலிருந்து" : "From D1 Lagna"} · ${isTa ? `${d1.houseFromRef}-ஆம் இடம்` : `House ${d1.houseFromRef}`}`,
      detail: d1,
    },
    {
      key: "d9",
      label: isTa ? "நவாம்சத்தில்" : "In the Navamsa (D9)",
      house: `${isTa ? "நவாம்ச லக்னத்திலிருந்து" : "From D9 Lagna"} · ${isTa ? `${d9.houseFromRef}-ஆம் இடம்` : `House ${d9.houseFromRef}`}`,
      detail: d9,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div className="cgp-kattam-pair">
        <Card style={{ alignItems: "center", padding: "16px", borderRadius: "var(--radius-lg, 12px)" }}>
          <RasiChart
            chart={chart}
            lang={lang}
            label={isTa ? "இராசி — D1" : "Rasi — D1"}
            showExplain={false}
            selectedRasi={selectedRasi}
            onSelectRasi={setSelectedRasi}
          />
        </Card>
        <Card style={{ alignItems: "center", padding: "16px", borderRadius: "var(--radius-lg, 12px)" }}>
          <NavamsaChart
            chart={chart}
            lang={lang}
            label={isTa ? "நவாம்சம் — D9" : "Navamsa — D9"}
            showExplain={false}
            selectedRasi={selectedRasi}
            onSelectRasi={setSelectedRasi}
          />
        </Card>
      </div>

      {/* One reading strip for both grids, instead of two competing panels. */}
      <Card variant="soft" style={{ padding: "14px 16px", borderRadius: "var(--radius-lg, 12px)", gap: "10px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: W.inkMid }}>
          {rasiLabel(selectedRasi, lang)}
          <span style={{ fontWeight: 400, color: W.muted, fontSize: "0.75rem", marginLeft: "8px" }}>
            {isTa ? "— இரு கட்டங்களிலும்" : "— in both charts"}
          </span>
        </p>
        <div className="cgp-kattam-read">
          {columns.map((col) => (
            <div key={col.key} style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: W.inkMid }}>
                {col.label}
                {col.detail.isLagna ? (
                  <span style={{ marginLeft: "6px", fontWeight: 600, color: W.terracotta }}>
                    · {isTa ? "லக்னம்" : "Lagna"}
                  </span>
                ) : null}
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt }}>{col.house}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {col.detail.occupants.length === 0 ? (
                  <span style={{ fontSize: "0.75rem", color: W.muted }}>
                    {t("chart_no_graha_in_rasi", lang)}
                  </span>
                ) : (
                  col.detail.occupants.map((occ) => (
                    <span key={occ.key} style={{
                      fontSize: "0.75rem", fontWeight: 600, color: W.inkMid,
                      border: `1px solid ${W.borderLt}`, borderRadius: "var(--radius-full, 999px)",
                      padding: "2px 9px", background: W.surface, whiteSpace: "nowrap",
                    }}>
                      {occ.key === "Lagna" ? t("label_lagnam", lang) : grahaName(occ.graha, lang)}
                      {occ.degreeInRasi !== null ? ` ${occ.degreeInRasi.toFixed(2)}°` : ""}
                      {occ.isRetrograde ? ` (${t("flag_vakra", lang)})` : ""}
                      {occ.isVargottama ? ` · ${t("flag_vargottamam", lang)}` : ""}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Graha positions — the print sheet's core table, brought to the screen ─────
function GrahaPositionsTable({ chart, lang }: { chart: ChartCalculateResponseData; lang: Lang }) {
  const isTa = lang === "ta";
  // The API sends the nakshatra as an uppercase key ("UTHIRADAM"), which is
  // what `tNakshatra` is keyed on. Passing it through raw printed UTHIRADAM in
  // the middle of a Tamil table.
  const star = (v: string) => tNakshatra(v, lang);

  type Row = {
    key: string; name: string; degInRasi: number; rasi: number; d9Rasi: number;
    nakshatra: number; nakshatraName: string; pada: number;
    isRetrograde: boolean; isCombust: boolean; isVargottama: boolean; isLagna: boolean;
  };

  const rows: Row[] = [
    {
      key: "LAGNA",
      name: isTa ? "லக்னம்" : "Lagna",
      degInRasi: chart.lagna.degreeInRasi,
      rasi: chart.lagna.rasi,
      d9Rasi: computeD9LagnaRasi(chart.lagna.absoluteLongitude),
      nakshatra: chart.lagna.nakshatra,
      nakshatraName: chart.lagna.nakshatraName,
      pada: chart.lagna.pada,
      isRetrograde: false, isCombust: false, isVargottama: false, isLagna: true,
    },
    ...PLANET_ORDER.flatMap((g) => {
      const p = chart.planets.find((x) => x.graha === g);
      if (!p) return [];
      return [{
        key: g,
        name: grahaName(g, lang),
        degInRasi: p.degreeInRasi,
        rasi: p.rasi,
        d9Rasi: p.d9Rasi,
        nakshatra: p.nakshatra,
        nakshatraName: p.nakshatraName,
        pada: p.pada,
        isRetrograde: p.isRetrograde,
        isCombust: p.isCombust,
        isVargottama: p.isVargottama,
        isLagna: false,
      }];
    }),
  ];

  const headers = isTa
    ? ["கிரகம்", "பாகை", "ராசி", "நவாம்சம்", "நட்சத்திரம்", "பாதம்", "நட்சத்திர அதிபதி"]
    : ["Graha", "Degree", "Rasi", "Navamsa", "Nakshatra", "Pada", "Star lord"];

  const th: React.CSSProperties = {
    padding: "8px 10px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700,
    color: W.mutedLt, borderBottom: `1px solid ${W.border}`, whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    padding: "8px 10px", fontSize: "0.8125rem", color: W.inkMid,
    borderBottom: `1px solid ${W.borderLt}`, verticalAlign: "top",
  };

  return (
    <Card style={{ padding: 0, borderRadius: "var(--radius-lg, 12px)", overflow: "hidden", gap: 0 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead>
            <tr>{headers.map((h) => <th key={h} scope="col" style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td style={{ ...td, fontWeight: 700, color: row.isLagna ? W.terracotta : W.inkMid, whiteSpace: "nowrap" }}>
                  <span style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
                    {row.name}
                    {row.isRetrograde ? <FlagChip text={t("flag_vakra", lang)} tone="vakra" /> : null}
                    {row.isCombust ? <FlagChip text={t("flag_astam", lang)} tone="astam" /> : null}
                  </span>
                </td>
                <td style={{ ...td, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {degreesToDMS(row.degInRasi)}
                </td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>{rasiLabel(row.rasi, lang)}</td>
                {/* The navamsa rasi sits beside the rasi so the same D1↔D9 read
                    the kattam pair offers visually is also available as a scan
                    down two columns — vargottama is where they match. */}
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <span style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
                    {rasiLabel(row.d9Rasi, lang)}
                    {row.isVargottama ? <FlagChip text={t("flag_vargottamam", lang)} tone="vargottama" /> : null}
                  </span>
                </td>
                <td style={td}>{star(row.nakshatraName)}</td>
                <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>{row.pada}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {row.isLagna ? "—" : (tPlanetLord(nakshatraLord(row.nakshatra), lang) || "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
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
  const [printMode, setPrintMode] = useState(false);
  /** The form is the whole page until a chart exists, then it steps aside — the
   *  result is what the reader came for and it used to sit below a full screen
   *  of inputs they had already filled in. */
  const [formOpen, setFormOpen] = useState(true);


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
      setFormOpen(false);
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

  const isTa = lang === "ta";
  const moon = chart?.planets.find((p) => p.graha === "MOON");

  // The six facts an astrologer reads off the head of a sheet, in sheet order,
  // and in the reader's language — these were hardcoded English labels over
  // raw API strings ("Name" / "Lagnam" / "Nakshathiram") regardless of `lang`.
  const identityFacts = chart ? [
    {
      label: isTa ? "பிறந்த தேதி" : "Birth date",
      value: `${formatDateTa(chart.birthProfile.birthDateLocal)}${chart.birthProfile.birthTimeLocal ? ` · ${formatClockTime(chart.birthProfile.birthTimeLocal)}` : ""}`,
    },
    {
      label: isTa ? "பிறந்த கிழமை" : "Weekday",
      value: isTa
        ? formatWeekday(chart.birthProfile.birthDateLocal)
        : new Date(chart.birthProfile.birthDateLocal + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" }),
    },
    { label: isTa ? "வயது" : "Age", value: String(chartSummary?.currentAge ?? currentAge(chart.birthProfile.birthDateLocal)) },
    { label: t("label_lagnam", lang), value: rasiLabel(chart.lagna.rasi, lang) },
    { label: isTa ? "ஜென்ம ராசி" : "Birth sign", value: moon ? rasiLabel(moon.rasi, lang) : "—" },
    {
      label: isTa ? "ஜென்ம நட்சத்திரம்" : "Birth star",
      value: moon
        ? `${tNakshatra(moon.nakshatraName, lang)} · ${t("label_padam", lang)} ${moon.pada}`
        : "—",
    },
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

        /* The kattam pair. Two grids of equal weight, never a toggle — reading
           a graha's D1 placement against its D9 is the point. Below 700px the
           pair stacks rather than shrinking: a South-Indian kattam has a fixed
           4×4 cell size, so squeezing it is not an option and scrolling past
           one chart to reach the other still beats hiding one behind a tab. */
        .cgp-kattam-pair {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          align-items: start;
        }
        .cgp-kattam-read {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 700px) {
          .cgp-kattam-pair,
          .cgp-kattam-read { grid-template-columns: minmax(0, 1fr); }
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

        {/* Birth details form. Once a chart exists it is hidden rather than
            unmounted, so reopening it still holds everything already typed —
            the identity card below carries the Edit control. */}
        <Card id="cgp-birth-form" className="card" variant="soft" style={{ padding: "20px", display: chart && !formOpen ? "none" : "flex", flexDirection: "column", gap: "14px" }}>
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

        {/* ── Results: the sheet, in sheet order ── */}
        {chart && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>

            {/* 1 · அடையாளம் — who this sheet is for, and the print action. */}
            <Card variant="soft" style={{ padding: "18px 20px", gap: "14px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "10px" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: W.terracotta }}>
                    {chart.birthProfile.displayName}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: W.muted }}>
                    {chart.birthProfile.birthPlace || "—"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setFormOpen((v) => !v)}
                    aria-expanded={formOpen} aria-controls="cgp-birth-form"
                    style={{
                      padding: "8px 16px", borderRadius: "var(--radius-md, 10px)", fontSize: "0.8125rem",
                      fontWeight: 700, cursor: "pointer", border: `1px solid ${W.border}`,
                      background: W.card, color: W.inkMid,
                    }}>
                    {formOpen
                      ? (isTa ? "விவரங்களை மறை" : "Hide details")
                      : (isTa ? "விவரங்களை மாற்று" : "Edit details")}
                  </button>
                  <button type="button" onClick={handlePrint}
                    style={{
                      padding: "8px 18px", borderRadius: "var(--radius-md, 10px)", fontSize: "0.8125rem",
                      fontWeight: 700, cursor: "pointer", border: `1.5px solid ${W.terracotta}66`,
                      background: "var(--panel-warm-light)", color: W.terracotta,
                    }}>
                    {isTa ? "ஜாதகம் அச்சிடு" : "Print jathagam"}
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px 18px" }}>
                {identityFacts.map((fact) => (
                  <FactCell key={fact.label} label={fact.label} value={fact.value} />
                ))}
              </div>
            </Card>

            {/* 2 · கட்டங்கள் — both kattams, one selection. */}
            <SheetSection
              lang={lang}
              title={isTa ? "ஜாதகக் கட்டங்கள்" : "The kattams"}
              hint={isTa
                ? "இராசியும் நவாம்சமும் ஒருசேர. ஒரு ராசியைத் தட்டினால் இரு கட்டங்களிலும் அது தெரியும்."
                : "Rasi and Navamsa together. Tap a rasi and it lights up in both charts."}
            >
              <KattamPair chart={chart} lang={lang} />
            </SheetSection>

            {/* 3 · கிரக நிலை — the positions table, previously print-only. */}
            <SheetSection
              lang={lang}
              title={isTa ? "கிரக நிலைகள்" : "Graha positions"}
              hint={isTa
                ? "ராசிக்கு அடுத்தே நவாம்சம் — இரண்டும் ஒரே ராசியானால் அது வர்கோத்தமம்."
                : "Navamsa sits beside the rasi — where the two match, the graha is vargottama."}
            >
              <GrahaPositionsTable chart={chart} lang={lang} />
            </SheetSection>

            {/* 4 · தசை — also previously print-only. */}
            {dashaData && (
              <SheetSection lang={lang} title={isTa ? "விம்சோத்தரி தசை" : "Vimshottari dasa"}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                  <Card compact style={{ gap: "4px" }}>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt }}>
                      {isTa ? "பிறந்த கால தசை இருப்பு" : "Dasa balance at birth"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: W.inkMid }}>
                      {tPlanetLord(dashaData.openingDasha.lord, lang)}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: W.muted }}>
                      {formatDashaBalance(dashaData.openingDasha.balanceYearsAtBirth, lang)}
                    </p>
                  </Card>
                  <Card compact style={{ gap: "4px" }}>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt }}>
                      {isTa ? "நடப்பு மகாதசை" : "Current mahadasa"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: W.inkMid }}>
                      {tPlanetLord(dashaData.current.mahadasha.lord, lang)}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: W.muted, fontVariantNumeric: "tabular-nums" }}>
                      {formatDateTA(dashaData.current.mahadasha.startDate)} — {formatDateTA(dashaData.current.mahadasha.endDate)}
                    </p>
                  </Card>
                  <Card compact style={{ gap: "4px" }}>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt }}>
                      {isTa ? "நடப்பு புக்தி" : "Current bhukti"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: W.inkMid }}>
                      {tPlanetLord(dashaData.current.antardasha.lord, lang)}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: W.muted, fontVariantNumeric: "tabular-nums" }}>
                      {formatDateTA(dashaData.current.antardasha.startDate)} — {formatDateTA(dashaData.current.antardasha.endDate)}
                    </p>
                  </Card>
                </div>
              </SheetSection>
            )}

            {/* 5 · Provenance. It used to outrank the kattam; on a jathagam the
                   method is a footnote, not a headline. */}
            <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt, lineHeight: 1.6 }}>
              {isTa ? "கணிப்பு" : "Method"}: {chart.calculationVersion} · {isTa ? "அயனாம்சம்" : "Ayanamsa"} {chart.ayanamsa.type} {chart.ayanamsa.valueDegrees.toFixed(2)}° · {chart.ephemerisBackend}
              {" · "}
              {isTa
                ? "வீடுகள் லக்னத்திலிருந்து முழு-ராசி முறை; தசை சந்திரன் பாகையிலிருந்து விம்சோத்தரி."
                : "Whole-sign houses from the Lagna; Vimshottari dasa from the Moon's longitude."}
            </p>
          </div>
        )}

        {/* Hidden print-mode indicator for styling */}
        {printMode && <div style={{ display: "none" }} />}
      </div>
    </>
  );
}



