"use client";

import { useState } from "react";
import { PlaceCombobox } from "@/components/dashboard-ui";
import type { ChartCalculateResponseData, ChartPlanet, ChartYogaInsight } from "@/lib/types";
import { readErrorMessage } from "@/lib/api";
import { computeD9LagnaRasi, GRAHA_ABBR, GRAHA_ABBR_EN } from "@/lib/chart-utils";
import { useLang } from "@/components/lang-toggle";
import { JadhagamShareButton } from "@/components/public-share-card";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";

/* South Indian grid positions — fixed sign layout */
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

const PLANET_ORDER = ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN","RAHU","KETU","MANDHI"];

const PLANET_LABELS_EN: Record<string, string> = {
  SUN: "Sun · Suryan", MOON: "Moon · Chandran", MARS: "Mars · Sevvai",
  MERCURY: "Mercury · Budhan", JUPITER: "Jupiter · Guru", VENUS: "Venus · Sukran",
  SATURN: "Saturn · Sani", RAHU: "Rahu", KETU: "Ketu", MANDHI: "Mandhi",
};

const PLANET_LABELS_TA: Record<string, string> = {
  SUN: "சூரியன்", MOON: "சந்திரன்", MARS: "செவ்வாய்",
  MERCURY: "புதன்", JUPITER: "குரு", VENUS: "சுக்கிரன்",
  SATURN: "சனி", RAHU: "ராகு", KETU: "கேது", MANDHI: "மாந்தி",
};

function RasiGrid({ chart, d9, lang }: { chart: ChartCalculateResponseData; d9?: boolean; lang: "en" | "ta" }) {
  const lagnaRasi = d9 ? computeD9LagnaRasi(chart.lagna.absoluteLongitude) : chart.lagna.rasi;
  const RASI_NAMES = lang === "en" ? RASI_NAMES_EN : RASI_NAMES_TA;
  const lagnaLabel = lang === "en" ? "La" : "ல";

  function getOcc(rasi: number): string[] {
    const occ: string[] = [];
    if (lagnaRasi === rasi) occ.push(lagnaLabel);
    chart.planets.forEach((p) => {
      const planetRasi = d9 ? p.d9Rasi : p.rasi;
      if (planetRasi === rasi) occ.push(GRAHA_ABBR[p.graha] ?? p.graha.slice(0, 2));
    });
    return occ;
  }

  const cellSize = 72;

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
              gridColumn: col + 1,
              gridRow: row + 1,
              border: "1px solid var(--cl-border)",
              padding: "4px 5px",
              background: isLagna ? "rgba(184,90,44,0.07)" : "var(--cl-surface)",
              position: "relative",
              minHeight: `${cellSize}px`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}>
              {isLagna && (
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  width: 0, height: 0, borderStyle: "solid",
                  borderWidth: "0 14px 14px 0",
                  borderColor: "transparent #B85A2C transparent transparent",
                }} />
              )}
              <span style={{ fontSize: "0.55rem", color: "var(--cl-muted)", fontWeight: 500 }}>
                {RASI_NAMES[rasi]}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                {occ.map((o, i) => (
                  <span key={i} style={{
                    fontSize: "0.75rem", fontWeight: 700,
                    color: o === lagnaLabel ? "#B85A2C" : "var(--cl-ink)",
                  }}>{o}</span>
                ))}
              </div>
            </div>
          );
        })}
        {/* Center label */}
        <div style={{
          gridColumn: "2 / 4", gridRow: "2 / 4",
          border: "1px solid var(--cl-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--cl-surface)", padding: "4px",
        }}>
          <div style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--cl-muted)" }}>
            <div style={{ fontWeight: 700, fontSize: "0.72rem", color: "var(--cl-ink)" }}>
              {d9
                ? (lang === "en" ? "D9 Navamsa" : "D9 நவாம்சம்")
                : (lang === "en" ? "D1 Rasi" : "D1 ராசி")}
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


function formatDateForSheet(dateIso: string) {
  const [year, month, day] = dateIso.split("-");
  if (!year || !month || !day) return dateIso;
  return `${day}-${month}-${year}`;
}

function PrintableSouthChart({
  chart,
  lang,
  title,
  d9 = false,
}: {
  chart: ChartCalculateResponseData;
  lang: "en" | "ta";
  title: string;
  d9?: boolean;
}) {
  const lagnaRasi = d9 ? computeD9LagnaRasi(chart.lagna.absoluteLongitude) : chart.lagna.rasi;
  const rasiNames = lang === "en" ? RASI_NAMES_EN : RASI_NAMES_TA;
  const lagnaLabel = lang === "en" ? "La" : "L";
  const cellSize = 66;

  function getOccupants(rasi: number): string[] {
    const occ: string[] = [];
    if (lagnaRasi === rasi) occ.push(lagnaLabel);
    chart.planets.forEach((planet) => {
      const planetRasi = d9 ? planet.d9Rasi : planet.rasi;
      if (planetRasi === rasi) occ.push(GRAHA_ABBR[planet.graha] ?? planet.graha.slice(0, 2));
    });
    return occ;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
      <div style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2f2720" }}>
        {title}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(4, ${cellSize}px)`,
          gridTemplateRows: `repeat(4, ${cellSize}px)`,
          border: "1.5px solid #2f2720",
          background: "#fff",
        }}
      >
        {RASI_GRID.map(({ rasi, col, row }) => {
          const occupants = getOccupants(rasi);
          const isLagna = lagnaRasi === rasi;
          return (
            <div
              key={`${title}-${rasi}`}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                border: "1px solid #6b5d4d",
                padding: "4px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: `${cellSize}px`,
                background: isLagna ? "#fbf1de" : "#fff",
              }}
            >
              <span style={{ fontSize: "0.58rem", color: "#7a6f5e" }}>{rasiNames[rasi]}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                {occupants.map((item, index) => (
                  <span
                    key={`${rasi}-${item}-${index}`}
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      color: item === lagnaLabel ? "#b85a2c" : "#2f2720",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        <div
          style={{
            gridColumn: "2 / 4",
            gridRow: "2 / 4",
            border: "1px solid #6b5d4d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            textAlign: "center",
            background: "#fffdfa",
          }}
        >
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#2f2720" }}>{chart.birthProfile.displayName}</div>
            <div style={{ fontSize: "0.72rem", color: "#7a6f5e", marginTop: "4px" }}>
              {rasiNames[lagnaRasi]} {lang === "en" ? "Lagna" : "Lagna"}
            </div>
            <div style={{ fontSize: "0.66rem", color: "#7a6f5e", marginTop: "2px" }}>
              {formatDateForSheet(chart.birthProfile.birthDateLocal)}
              {chart.birthProfile.birthTimeLocal ? ` · ${chart.birthProfile.birthTimeLocal}` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintableJadhagamSheet({ chart, lang }: { chart: ChartCalculateResponseData; lang: "en" | "ta" }) {
  const en = lang === "en";
  const moon = chart.planets.find((planet) => planet.graha === "MOON");
  const d9LagnaRasi = computeD9LagnaRasi(chart.lagna.absoluteLongitude);
  const rasiNames = en ? RASI_NAMES_EN : RASI_NAMES_TA;
  const planetLabels = en ? PLANET_LABELS_EN : PLANET_LABELS_TA;

  const summaryRows = [
    { label: "Name", value: chart.birthProfile.displayName || "Chart" },
    { label: "Birth Place", value: chart.birthProfile.birthPlace || "-" },
    {
      label: "Birth Date & Time",
      value: `${formatDateForSheet(chart.birthProfile.birthDateLocal)}${chart.birthProfile.birthTimeLocal ? ` · ${chart.birthProfile.birthTimeLocal}` : ""}`,
    },
    { label: "Timezone", value: chart.birthProfile.birthTimezone || "-" },
    { label: "Lagna", value: `${rasiNames[chart.lagna.rasi]} · ${chart.lagna.nakshatraName}` },
    { label: "Birth Star", value: moon ? `${moon.nakshatraName} (Pada ${moon.pada})` : "-" },
    { label: "Birth Sign", value: moon ? rasiNames[moon.rasi] : "-" },
    {
      label: "Coordinates",
      value: `${Number(chart.birthProfile.birthLatitude ?? 0).toFixed(2)}, ${Number(chart.birthProfile.birthLongitude ?? 0).toFixed(2)}`,
    },
  ];

  return (
    <div
      className="jg-document-sheet"
      style={{
        width: "100%",
        maxWidth: "860px",
        margin: "0 auto",
        background: "#fff",
        color: "#2f2720",
        border: "2px solid #2f2720",
        padding: "18px",
        boxSizing: "border-box",
        fontFamily: '"Times New Roman", Georgia, serif',
      }}
    >
      <div style={{ textAlign: "center", borderBottom: "1.5px solid #2f2720", paddingBottom: "10px", marginBottom: "12px" }}>
        <div style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "0.04em" }}>Vinaadi AI</div>
        <div style={{ marginTop: "4px", fontSize: "0.9rem" }}>
          {en ? "Traditional South Indian Jadhagam" : "Traditional South Indian Jadhagam"}
        </div>
        <div style={{ marginTop: "4px", fontSize: "0.74rem", color: "#7a6f5e" }}>
          {chart.calculationVersion} · {chart.ayanamsa.type} {chart.ayanamsa.valueDegrees.toFixed(2)}° · {chart.ephemerisBackend}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          border: "1px solid #6b5d4d",
          marginBottom: "14px",
        }}
      >
        {summaryRows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "grid",
              gridTemplateColumns: "150px 1fr",
              borderRight: "1px solid #6b5d4d",
              borderBottom: "1px solid #6b5d4d",
              minHeight: "34px",
            }}
          >
            <div style={{ padding: "7px 8px", fontSize: "0.74rem", fontWeight: 700, background: "#f7f1e6" }}>{row.label}</div>
            <div style={{ padding: "7px 8px", fontSize: "0.76rem" }}>{row.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid #6b5d4d", padding: "14px", marginBottom: "14px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            gap: "18px",
            alignItems: "start",
          }}
        >
          <PrintableSouthChart chart={chart} lang={lang} title="D1 Rasi" />
          <PrintableSouthChart chart={chart} lang={lang} title="D9 Navamsa" d9 />
        </div>
        <div style={{ marginTop: "10px", fontSize: "0.72rem", color: "#6b5d4d", textAlign: "center" }}>
          {`D9 Lagna: ${rasiNames[d9LagnaRasi]}`}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.74rem" }}>
          <thead>
            <tr>
              {["Planet", "Rasi", "Navamsa", "Birth Star", "Pada", "Degree", "House"].map((heading) => (
                <th
                  key={heading}
                  style={{
                    border: "1px solid #6b5d4d",
                    background: "#f7f1e6",
                    padding: "7px 8px",
                    textAlign: "left",
                    fontWeight: 700,
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLANET_ORDER.map((graha) => {
              const planet = chart.planets.find((item: ChartPlanet) => item.graha === graha);
              if (!planet) return null;
              return (
                <tr key={graha}>
                  <td style={{ border: "1px solid #6b5d4d", padding: "6px 8px", fontWeight: 700 }}>
                    {planetLabels[graha] ?? graha}
                  </td>
                  <td style={{ border: "1px solid #6b5d4d", padding: "6px 8px" }}>{rasiNames[planet.rasi]}</td>
                  <td style={{ border: "1px solid #6b5d4d", padding: "6px 8px" }}>{rasiNames[planet.d9Rasi]}</td>
                  <td style={{ border: "1px solid #6b5d4d", padding: "6px 8px" }}>{planet.nakshatraName}</td>
                  <td style={{ border: "1px solid #6b5d4d", padding: "6px 8px" }}>{planet.pada}</td>
                  <td style={{ border: "1px solid #6b5d4d", padding: "6px 8px", fontFamily: "monospace" }}>{planet.degreeInRasi.toFixed(2)}°</td>
                  <td style={{ border: "1px solid #6b5d4d", padding: "6px 8px" }}>{planet.houseFromLagna}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Form = {
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
};

const EMPTY: Form = {
  displayName: "", birthDateLocal: "", birthTimeLocal: "12:00",
  birthPlace: "", birthLatitude: "", birthLongitude: "", birthTimezone: "Asia/Kolkata",
};

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1.5px solid var(--cl-border)", borderRadius: "8px",
  padding: "9px 12px", background: "var(--cl-bg)", color: "var(--cl-ink)",
  fontSize: "0.88rem", fontFamily: "inherit", outline: "none",
  boxSizing: "border-box" as const,
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
  const formatStarName = (value: string) => (en ? tamilizeAstroEnglish(value) : value);

  const [form, setForm] = useState<Form>(EMPTY);
  const [chart, setChart] = useState<ChartCalculateResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  async function handleGenerate() {
    if (!form.birthDateLocal || !form.birthLatitude || !form.birthLongitude) {
      setError(en
        ? "Please enter date, time, and select a birth place."
        : "தேதி, நேரம் உள்ளிட்டு பிறந்த இடம் தேர்வு செய்யவும்.");
      return;
    }
    setError("");
    setLoading(true);
    setChart(null);
    try {
      const res = await fetch("/api/backend/api/v1/public/chart", {
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
      const data = await res.json() as { success: boolean; data: ChartCalculateResponseData };
      setChart(data.data);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }


  function handleExportPdf() {
    window.setTimeout(() => {
      window.print();
    }, 80);
  }

  const moon = chart?.planets.find((p) => p.graha === "MOON");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          .jg-print-only,
          .jg-print-only * {
            visibility: visible !important;
          }
          .jg-print-only {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            display: block !important;
          }
          body {
            background: #fff !important;
          }
        }
        @media screen {
          .jg-print-only {
            display: none !important;
          }
        }
      `}</style>

      {chart && (
        <div className="jg-print-only">
          <PrintableJadhagamSheet chart={chart} lang={lang} />
        </div>
      )}

      {/* Form card */}
      <div style={{
        background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
        borderRadius: "16px", padding: "24px",
        display: "flex", flexDirection: "column", gap: "16px",
      }}>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--cl-muted)", lineHeight: 1.5 }}>
          {en
            ? "Enter birth details to generate a Thirukanitham-precise jadhagam. No account required."
            : "திருக்கணிதம் துல்லியமான ஜாதகம் உருவாக்க பிறப்பு விவரங்களை உள்ளிடவும். கணக்கு தேவையில்லை."}
        </p>

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

        <div className="cl-mobile-form-grid-2" style={{ gap: "12px" }}>
          <label style={labelStyle}>
            {en ? "Birth Time" : "பிறந்த நேரம்"}
            <input style={inputStyle} type="time" value={form.birthTimeLocal}
              onChange={(e) => setForm((f) => ({ ...f, birthTimeLocal: e.target.value }))} />
          </label>
          <label style={labelStyle}>
            {en ? "Timezone" : "நேர மண்டலம்"}
            <input style={inputStyle} value={form.birthTimezone}
              onChange={(e) => setForm((f) => ({ ...f, birthTimezone: e.target.value }))} />
          </label>
        </div>

        <label style={labelStyle}>
          {en ? "Birth Place *" : "பிறந்த இடம் *"}
          <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--cl-muted)" }}>
            {en ? "Type city name to search" : "நகர பெயர் தட்டச்சு செய்து தேடவும்"}
          </span>
          <PlaceCombobox
            value={form.birthPlace}
            onChange={(city, raw) => setForm((f) => ({
              ...f, birthPlace: raw,
              ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
            }))}
          />
        </label>

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
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#A8482F", background: "rgba(168,72,47,0.08)", border: "1px solid rgba(168,72,47,0.25)", borderRadius: "8px", padding: "10px 14px" }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={loading}
          style={{
            alignSelf: "flex-start", padding: "10px 28px",
            background: loading ? "var(--cl-border)" : "var(--cl-ink)",
            color: "var(--cl-bg)", border: "none", borderRadius: "999px",
            fontFamily: "inherit", fontSize: "0.9rem", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? (en ? "Calculating…" : "கணக்கிடுகிறது…")
            : (en ? "Generate Jadhagam" : "ஜாதகம் உருவாக்கு")}
        </button>
      </div>

      {/* Results */}
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
                { label: en ? "Lagna" : "லக்னம்", value: RASI_NAMES[chart.lagna.rasi] + " · " + formatStarName(chart.lagna.nakshatraName) },
                { label: en ? "Birth Star" : "பிறப்பு நட்சத்திரம்", value: moon ? `${formatStarName(moon.nakshatraName)} (${en ? "Pada" : "பாதம்"} ${moon.pada})` : "—" },
                { label: en ? "Birth Sign" : "பிறப்பு ராசி", value: moon ? RASI_NAMES[moon.rasi] : "—" },
                { label: "Ayanamsa", value: `Lahiri ${chart.ayanamsa.valueDegrees.toFixed(2)}°` },
              ].map((row) => (
                <div key={row.label}>
                  <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--cl-muted)" }}>{row.label}</p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.9rem", fontWeight: 600, color: "var(--cl-ink)" }}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Export + dual chart layout */}
          <div className="cl-mobile-flex-row" style={{ justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--cl-muted)" }}>
                {en ? "Classic Layout" : "Classic Layout"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "var(--cl-ink-2)" }}>
                {en
                  ? "Rasi and Navamsa are shown together here, and the PDF export uses a traditional single-page layout."
                  : "Rasi and Navamsa are shown together here, and the PDF export uses a traditional single-page layout."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportPdf}
              style={{
                padding: "9px 16px",
                borderRadius: "999px",
                border: "1px solid rgba(184,90,44,0.35)",
                background: "rgba(184,90,44,0.08)",
                color: "#B85A2C",
                fontFamily: "inherit",
                fontSize: "0.84rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {en ? "Export PDF" : "Export PDF"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "18px", overflowX: "auto" }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--cl-muted)" }}>
                {en ? "D1 Rasi" : "D1 Rasi"}
              </p>
              <div className="cl-chart-scroll">
                <RasiGrid chart={chart} lang={lang} />
              </div>
            </div>

            <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "18px", overflowX: "auto" }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--cl-muted)" }}>
                {en ? "D9 Navamsa" : "D9 Navamsa"}
              </p>
              <div className="cl-chart-scroll">
                <RasiGrid chart={chart} d9 lang={lang} />
              </div>
            </div>
          </div>
          {/* Planet table */}
          <div style={{
            background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
            borderRadius: "14px", overflow: "hidden",
          }}>
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
                      ? ["Planet", "Rasi", "Birth Star", "Pada", "Degree", "House"]
                      : ["கிரகம்", "ராசி", "நட்சத்திரம்", "பாதம்", "பாகை", "பாவம்"]
                    ).map((h) => (
                      <th key={h} style={{
                        padding: "8px 14px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        color: "var(--cl-muted)", background: "var(--cl-bg-2)",
                        borderBottom: "1px solid var(--cl-border)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLANET_ORDER.map((g) => {
                    const p = chart.planets.find((x: ChartPlanet) => x.graha === g);
                    if (!p) return null;
                    return (
                      <tr key={g} style={{ borderBottom: "1px solid var(--cl-border)" }}>
                        <td style={{ padding: "9px 14px", fontWeight: 600, color: "var(--cl-ink)" }}>
                          {PLANET_LABELS[g] ?? g}
                          {p.isRetrograde && <span style={{ fontSize: "0.68rem", color: "#A8482F", marginLeft: "4px" }}>(R)</span>}
                        </td>
                        <td style={{ padding: "9px 14px", color: "var(--cl-ink-2)" }}>{RASI_NAMES[p.rasi]}</td>
                        <td style={{ padding: "9px 14px", color: "var(--cl-ink-2)" }}>{formatStarName(p.nakshatraName)}</td>
                        <td style={{ padding: "9px 14px", color: "var(--cl-muted)" }}>{p.pada}</td>
                        <td style={{ padding: "9px 14px", color: "var(--cl-muted)", fontFamily: "monospace", fontSize: "0.78rem" }}>
                          {p.degreeInRasi.toFixed(2)}°
                        </td>
                        <td style={{ padding: "9px 14px", color: "var(--cl-muted)" }}>{p.houseFromLagna}</td>
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
            background: "rgba(184,90,44,0.05)", border: "1px solid rgba(184,90,44,0.2)",
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
            <a href="/dashboard" className="cl-mobile-cta" style={{
              display: "inline-flex", alignItems: "center", padding: "9px 22px",
              background: "var(--cl-ink)", color: "var(--cl-bg)", borderRadius: "999px",
              fontWeight: 600, fontSize: "0.88rem", textDecoration: "none",
            }}>
              {en ? "Get started free →" : "இலவசமாக தொடங்கு →"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
