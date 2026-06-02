"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { t } from "@/lib/i18n";
import { LANG_STORAGE_KEY } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, ChartCalculateResponseData, ChartSummaryData, DashaTimelineResponseData } from "@/lib/types";
import { RasiChart, NavamsaChart } from "@/components/dashboard-charts";
import { Field, PlaceCombobox } from "@/components/dashboard-ui";
import {
  buildD1CellDetail,
  buildD9CellDetail,
  computeD9LagnaRasi,
  D1_RASI_NAMES,
  GRAHA_ABBR,
} from "@/lib/chart-utils";

type BirthForm = {
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
};

const EMPTY_FORM: BirthForm = {
  displayName: "",
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
      border: "1.5px solid #333",
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
              border: "0.5px solid #555",
              padding: "2px 3px",
              fontSize: "7.5px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: isLagna ? "#fff9e6" : "#fff",
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
                borderColor: "transparent #e5b84d transparent transparent",
              }} />
            )}
            <span style={{ color: "#888", fontSize: "6.5px" }}>{RASI_NAMES_TA[rasi]}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1px" }}>
              {occ.map((o, i) => (
                <span key={i} style={{ fontWeight: 700, color: "#111", fontSize: "8px", lineHeight: 1.2 }}>{o}</span>
              ))}
            </div>
          </div>
        );
      })}
      {/* Center label */}
      <div style={{
        gridColumn: "2 / 4",
        gridRow: "2 / 4",
        border: "0.5px solid #555",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        padding: "4px",
      }}>
        <div style={{ textAlign: "center", fontSize: "7px", color: "#333", lineHeight: 1.4 }}>
          <div style={{ fontWeight: 700, fontSize: "7.5px" }}>{isD9 ? "நவாம்சம்" : "இராசி"}</div>
          <div>{chart.birthProfile.displayName}</div>
          <div style={{ fontSize: "6.5px", color: "#666" }}>
            {isD9
              ? `நவாம்சம் / Male`
              : `${RASI_NAMES_TA[chart.lagna.rasi]} லக்னம்`}
          </div>
          <div style={{ fontSize: "6px", color: "#888" }}>
            {chart.birthProfile.birthDateLocal}
            {chart.birthProfile.birthTimeLocal ? ` - ${chart.birthProfile.birthTimeLocal}` : ""}
          </div>
          {chart.birthProfile.birthLatitude !== undefined && (
            <div style={{ fontSize: "6px", color: "#888" }}>
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

function JathagamPrint({ chart, dasha }: { chart: ChartCalculateResponseData; dasha: DashaTimelineResponseData | null }) {
  const d9LagnaRasi = computeD9LagnaRasi(chart.lagna.absoluteLongitude);
  const bp = chart.birthProfile;

  const moon = chart.planets.find((p) => p.graha === "MOON");
  const weekday = formatWeekday(bp.birthDateLocal);

  // Build ordered planet rows: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu, Maandi, Lagna
  const PLANET_ORDER = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU", "MANDHI"];
  const planetRows = PLANET_ORDER.map((g) => {
    if (g === "LAGNA") {
      return {
        graha: "LAGNA",
        nameTA: "லக்னம்",
        absLong: chart.lagna.absoluteLongitude,
        degInRasi: chart.lagna.degreeInRasi,
        nakshatra: chart.lagna.nakshatra,
        nakshatraName: chart.lagna.nakshatraName,
        pada: chart.lagna.pada,
        rasi: chart.lagna.rasi,
        isRetrograde: false,
      };
    }
    const p = chart.planets.find((x) => x.graha === g);
    if (!p) return null;
    return {
      graha: g,
      nameTA: GRAHA_NAMES_TA[g] ?? g,
      absLong: p.absoluteLongitude,
      degInRasi: p.degreeInRasi,
      nakshatra: p.nakshatra,
      nakshatraName: p.nakshatraName,
      pada: p.pada,
      rasi: p.rasi,
      isRetrograde: p.isRetrograde,
    };
  }).filter(Boolean) as {
    graha: string; nameTA: string; absLong: number; degInRasi: number;
    nakshatra: number; nakshatraName: string; pada: number; rasi: number; isRetrograde: boolean;
  }[];

  // Also add Lagna row
  const lagnaRow = {
    graha: "LAGNA",
    nameTA: "லக்னம்",
    absLong: chart.lagna.absoluteLongitude,
    degInRasi: chart.lagna.degreeInRasi,
    nakshatra: chart.lagna.nakshatra,
    nakshatraName: chart.lagna.nakshatraName,
    pada: chart.lagna.pada,
    rasi: chart.lagna.rasi,
    isRetrograde: false,
  };
  const allRows = [lagnaRow, ...planetRows];

  const cellStyle: React.CSSProperties = {
    border: "0.5px solid #999",
    padding: "2px 4px",
    fontSize: "7.5px",
    textAlign: "center",
    verticalAlign: "middle",
  };
  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    background: "#f0f0f0",
    fontWeight: 700,
    fontSize: "7px",
  };

  return (
    <div style={{ fontFamily: "serif", color: "#111", background: "#fff", padding: "14px 18px", maxWidth: "740px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <div style={{ fontSize: "11px", color: "#555" }}>உ</div>
        <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.04em" }}>ஜாதக கணிதம்</div>
      </div>

      {/* Two-column info table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8px", marginBottom: "8px", border: "0.5px solid #999" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, textAlign: "left", width: "22%", fontWeight: 600 }}>பெயர்</td>
            <td style={{ ...cellStyle, textAlign: "left", width: "28%" }}>: {bp.displayName}</td>
            <td style={{ ...cellStyle, textAlign: "left", width: "22%", fontWeight: 600 }}>சூ.தமிழ் நேரம்</td>
            <td style={{ ...cellStyle, textAlign: "left", width: "28%" }}>: {bp.birthTimeLocal ?? "-"}</td>
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
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>ஜென்ம ராசி</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {moon ? RASI_NAMES_TA[moon.rasi] : "-"}</td>
            <td style={{ ...cellStyle, textAlign: "left", fontWeight: 600 }}>லக்னம்</td>
            <td style={{ ...cellStyle, textAlign: "left" }}>: {RASI_NAMES_TA[chart.lagna.rasi]}</td>
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

      {/* Two charts side by side */}
      <div style={{ display: "flex", gap: "24px", justifyContent: "center", marginBottom: "8px", alignItems: "flex-start" }}>
        <div>
          <PrintRasiChart chart={chart} />
        </div>
        <div>
          <PrintRasiChart chart={chart} d9LagnaRasi={d9LagnaRasi} />
        </div>
      </div>

      {/* Planet positions table */}
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
                {row.isRetrograde ? <sup style={{ fontSize: "6px", color: "#c00" }}>வ</sup> : null}
              </td>
              <td style={cellStyle}>{degreesToDMS(row.absLong)}</td>
              <td style={{ ...cellStyle, textAlign: "left" }}>{row.nakshatraName}</td>
              <td style={cellStyle}>{row.pada}</td>
              <td style={cellStyle}>{NAKSHATRA_LORDS[row.nakshatra] ?? "-"}</td>
              <td style={cellStyle}>{degreesToDMS(row.degInRasi)}</td>
              <td style={{ ...cellStyle, textAlign: "left" }}>{RASI_NAMES_TA[row.rasi] ?? row.rasi}</td>
              <td style={cellStyle}>{RASI_LORDS_TA[row.rasi] ?? "-"}</td>
              <td style={cellStyle}>{PLANET_DIRECTION[row.graha] ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Dasha footer rows */}
      {dasha && (
        <div style={{ marginTop: "8px", fontSize: "8px", color: "#111", lineHeight: 1.8, borderTop: "0.5px solid #aaa", paddingTop: "6px" }}>
          <div>
            <strong>பிறந்த கால தசை இருப்பு (Dasha at Birth):</strong>{" "}
            {dashaLordTA(dasha.openingDasha.lord)} தசை — இருப்பு{" "}
            {formatDashaBalance(dasha.openingDasha.balanceYearsAtBirth)}
          </div>
          <div>
            <strong>நடப்பு தசை இன்று (Current Dasha Today):</strong>{" "}
            {dashaLordTA(dasha.current.mahadasha.lord)} மகாதசை /{" "}
            {dashaLordTA(dasha.current.antardasha.lord)} அந்தர்தசை —{" "}
            {formatDateTA(dasha.current.mahadasha.startDate)} முதல்{" "}
            {formatDateTA(dasha.current.mahadasha.endDate)} வரை
          </div>
        </div>
      )}

      {/* Footer note */}
      <div style={{ marginTop: "6px", fontSize: "7px", color: "#666", lineHeight: 1.5 }}>
        <strong>குறிப்பு:</strong> கணிப்பு - Vinaadi AI | அயனாம்சம்: லஹிரி | கிரக நிலைகள் பக்காவான் ஆகும்.
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
  const [tempBirthProfileId, setTempBirthProfileId] = useState<string | null>(null);
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

    if (tempBirthProfileId) {
      await apiFetchJson(`/api/v1/birth-profiles/${tempBirthProfileId}`, { method: "DELETE" }).catch(() => {});
      setTempBirthProfileId(null);
    }

    try {
      const profileRes = await apiFetchJson<{ data: { birthProfileId: string } }>("/api/v1/birth-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          birthDateLocal: form.birthDateLocal,
          birthTimeLocal: form.birthTimeLocal || null,
          birthPlace: form.birthPlace,
          birthLatitude: parseFloat(form.birthLatitude),
          birthLongitude: parseFloat(form.birthLongitude),
          birthTimezone: form.birthTimezone,
          relationshipToOwner: "other",
          calculateNow: false,
        }),
      });

      const birthProfileId = profileRes.data.birthProfileId;
      setTempBirthProfileId(birthProfileId);

      const chartRes = await apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>("/api/v1/charts/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthProfileId, calculationVersion: "thirukanitham-2026-v1" }),
      });
      setChart(chartRes.data);

      try {
        const summaryRes = await apiFetchJson<ApiEnvelope<ChartSummaryData>>(
          `/api/v1/charts/${chartRes.data.chartId}/summary?language=ta-en`,
        );
        setChartSummary(summaryRes.data);
      } catch {
        setChartSummary(null);
      }

      try {
        const today = new Date().toISOString().slice(0, 10);
        const dashaRes = await apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(
          `/api/v1/charts/${chartRes.data.chartId}/dasha?asOf=${today}`,
        );
        setDashaData(dashaRes.data);
      } catch {
        setDashaData(null);
      }
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
    if (tempBirthProfileId) {
      await apiFetchJson(`/api/v1/birth-profiles/${tempBirthProfileId}`, { method: "DELETE" }).catch(() => {});
    }
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
          label: "Current Dasha",
          value: chartSummary ? `${chartSummary.currentMahadasha} / ${chartSummary.currentAntardasha}` : "-",
        },
      ]
    : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: printMode ? "#fff" : "radial-gradient(1200px circle at 10% -10%, rgba(229,184,77,0.14), transparent 35%), #070b13",
        color: printMode ? "#111" : "#e5e7eb",
        padding: "24px 16px 42px",
      }}
    >
      <style jsx global>{`
        @media print {
          body {
            background: #fff !important;
            color: #111 !important;
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
            background: #ffffff !important;
            color: #111827 !important;
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
          <JathagamPrint chart={chart} dasha={dashaData} />
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
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.6)",
              padding: "6px 12px",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            {"<-"} Back
          </button>
          <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Generate Anyone&apos;s Chart</h1>
        </div>

        <p className="no-print" style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.54)" }}>
          Temporary chart. It is automatically deleted when leaving this page.
        </p>

        <div className="card no-print" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Field label="Name">
            <input
              className="input"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="e.g. Ramesh Kumar"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Birth Date">
              <input className="input" type="date" value={form.birthDateLocal} onChange={(e) => setForm((f) => ({ ...f, birthDateLocal: e.target.value }))} />
            </Field>
            <Field label="Birth Time">
              <input className="input" type="time" value={form.birthTimeLocal} onChange={(e) => setForm((f) => ({ ...f, birthTimeLocal: e.target.value }))} />
            </Field>
          </div>

          <Field label={t("field_birth_place", lang)} helper={t("field_place_helper", lang)}>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={t("field_latitude", lang)}>
              <input className="input" inputMode="decimal" value={form.birthLatitude} onChange={(e) => setForm((f) => ({ ...f, birthLatitude: e.target.value }))} />
            </Field>
            <Field label={t("field_longitude", lang)}>
              <input className="input" inputMode="decimal" value={form.birthLongitude} onChange={(e) => setForm((f) => ({ ...f, birthLongitude: e.target.value }))} />
            </Field>
          </div>

          {error && <p style={{ margin: 0, color: "#f87171", fontSize: "0.78rem" }}>{error}</p>}

          <button type="button" className="button button--primary" onClick={() => void handleGenerate()} disabled={loading}>
            {loading ? "Calculating..." : "Generate Chart"}
          </button>
        </div>

        {chart && (
          <div className="card print-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(229,184,77,0.08)", border: "1px solid rgba(229,184,77,0.2)" }}>
              <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#e5b84d" }}>{chart.birthProfile.displayName}</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.58)" }}>{chart.birthProfile.birthDateLocal}</p>
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
                  border: "1px solid rgba(56,189,248,0.35)",
                  background: "rgba(56,189,248,0.08)",
                  color: "#7dd3fc",
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
                    border: view === v ? "1px solid rgba(229,184,77,0.45)" : "1px solid rgba(255,255,255,0.12)",
                    background: view === v ? "rgba(229,184,77,0.12)" : "transparent",
                    color: view === v ? "#e5b84d" : "rgba(255,255,255,0.5)",
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
                <div key={row.label} style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 12px" }}>
                  <p style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(255,255,255,0.52)" }}>
                    {row.label}
                  </p>
                  <p style={{ margin: "5px 0 0", fontSize: "0.9rem", fontWeight: 700 }}>{row.value}</p>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: "10px", border: "1px solid rgba(34,197,94,0.24)", background: "rgba(34,197,94,0.08)", padding: "12px 14px" }}>
              <p style={{ margin: 0, fontSize: "0.76rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "#86efac" }}>Calculation Method</p>
              <p style={{ margin: "6px 0 0", fontSize: "0.86rem" }}>
                Version: <strong>{chart.calculationVersion}</strong> | Ayanamsa: <strong>{chart.ayanamsa.type}</strong> | Ephemeris: <strong>{chart.ephemerisBackend}</strong>
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.75)" }}>
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
