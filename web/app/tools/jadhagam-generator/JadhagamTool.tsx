"use client";

import { useState } from "react";
import { PlaceCombobox } from "@/components/dashboard-ui";
import type { ChartCalculateResponseData, ChartPlanet } from "@/lib/types";
import { readErrorMessage } from "@/lib/api";
import { computeD9LagnaRasi, GRAHA_ABBR } from "@/lib/chart-utils";

/* South Indian grid positions — fixed sign layout */
const RASI_GRID = [
  { rasi: 12, col: 0, row: 0 }, { rasi: 1, col: 1, row: 0 }, { rasi: 2, col: 2, row: 0 }, { rasi: 3, col: 3, row: 0 },
  { rasi: 11, col: 0, row: 1 }, { rasi: 4, col: 3, row: 1 },
  { rasi: 10, col: 0, row: 2 }, { rasi: 5, col: 3, row: 2 },
  { rasi: 9, col: 0, row: 3 }, { rasi: 8, col: 1, row: 3 }, { rasi: 7, col: 2, row: 3 }, { rasi: 6, col: 3, row: 3 },
];

const RASI_NAMES: Record<number, string> = {
  1: "Mesham", 2: "Rishabam", 3: "Mithunam", 4: "Kadagam",
  5: "Simmam", 6: "Kanni", 7: "Tulam", 8: "Viruchigam",
  9: "Dhanus", 10: "Makaram", 11: "Kumbam", 12: "Meenam",
};

const PLANET_ORDER = ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN","RAHU","KETU","MANDHI"];
const PLANET_LABELS: Record<string, string> = {
  SUN: "Sun · Suryan", MOON: "Moon · Chandran", MARS: "Mars · Sevvai",
  MERCURY: "Mercury · Budhan", JUPITER: "Jupiter · Guru", VENUS: "Venus · Sukran",
  SATURN: "Saturn · Sani", RAHU: "Rahu", KETU: "Ketu", MANDHI: "Mandhi",
};

function RasiGrid({ chart, d9 }: { chart: ChartCalculateResponseData; d9?: boolean }) {
  const lagnaRasi = d9 ? computeD9LagnaRasi(chart.lagna.absoluteLongitude) : chart.lagna.rasi;

  function getOcc(rasi: number): string[] {
    const occ: string[] = [];
    if (lagnaRasi === rasi) occ.push("La");
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
                    color: o === "La" ? "#B85A2C" : "var(--cl-ink)",
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
              {d9 ? "D9 Navamsa" : "D1 Rasi"}
            </div>
            <div style={{ fontSize: "0.6rem", marginTop: "2px" }}>
              {RASI_NAMES[lagnaRasi]} Lagna
            </div>
          </div>
        </div>
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
  const [form, setForm] = useState<Form>(EMPTY);
  const [chart, setChart] = useState<ChartCalculateResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"D1" | "D9">("D1");

  async function handleGenerate() {
    if (!form.birthDateLocal || !form.birthLatitude || !form.birthLongitude) {
      setError("Please enter date, time, and select a birth place.");
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

  const moon = chart?.planets.find((p) => p.graha === "MOON");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Form card */}
      <div style={{
        background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
        borderRadius: "16px", padding: "24px",
        display: "flex", flexDirection: "column", gap: "16px",
      }}>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--cl-muted)", lineHeight: 1.5 }}>
          Enter birth details to generate a Thirukanitham-precise jadhagam. No account required.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <label style={labelStyle}>
            Name (optional)
            <input style={inputStyle} value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="e.g. Ramesh Kumar" />
          </label>
          <label style={labelStyle}>
            Birth Date *
            <input style={inputStyle} type="date" value={form.birthDateLocal}
              onChange={(e) => setForm((f) => ({ ...f, birthDateLocal: e.target.value }))} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <label style={labelStyle}>
            Birth Time
            <input style={inputStyle} type="time" value={form.birthTimeLocal}
              onChange={(e) => setForm((f) => ({ ...f, birthTimeLocal: e.target.value }))} />
          </label>
          <label style={labelStyle}>
            Timezone
            <input style={inputStyle} value={form.birthTimezone}
              onChange={(e) => setForm((f) => ({ ...f, birthTimezone: e.target.value }))} />
          </label>
        </div>

        <label style={labelStyle}>
          Birth Place *
          <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--cl-muted)" }}>
            Type city name to search
          </span>
          <PlaceCombobox
            value={form.birthPlace}
            onChange={(city, raw) => setForm((f) => ({
              ...f, birthPlace: raw,
              ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
            }))}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <label style={labelStyle}>
            Latitude
            <input style={inputStyle} inputMode="decimal" value={form.birthLatitude}
              onChange={(e) => setForm((f) => ({ ...f, birthLatitude: e.target.value }))}
              placeholder="e.g. 13.08" />
          </label>
          <label style={labelStyle}>
            Longitude
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
          {loading ? "Calculating…" : "Generate Jadhagam"}
        </button>
      </div>

      {/* Results */}
      {chart && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Summary strip */}
          <div style={{
            background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
            borderRadius: "16px", padding: "20px 24px",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cl-muted)" }}>
              Jadhagam · {chart.birthProfile.displayName}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 28px", marginTop: "12px" }}>
              {[
                { label: "Lagna", value: RASI_NAMES[chart.lagna.rasi] + " · " + chart.lagna.nakshatraName },
                { label: "Janma Nakshatra", value: moon ? `${moon.nakshatraName} (Pada ${moon.pada})` : "—" },
                { label: "Janma Rasi", value: moon ? RASI_NAMES[moon.rasi] : "—" },
                { label: "Ayanamsa", value: `Lahiri ${chart.ayanamsa.valueDegrees.toFixed(2)}°` },
              ].map((row) => (
                <div key={row.label}>
                  <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--cl-muted)" }}>{row.label}</p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.9rem", fontWeight: 600, color: "var(--cl-ink)" }}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chart view toggle */}
          <div style={{ display: "flex", gap: "8px" }}>
            {(["D1", "D9"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)}
                style={{
                  padding: "6px 18px", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  border: view === v ? "1.5px solid var(--cl-accent)" : "1.5px solid var(--cl-border)",
                  background: view === v ? "rgba(184,90,44,0.08)" : "var(--cl-surface)",
                  color: view === v ? "#B85A2C" : "var(--cl-ink-2)",
                }}>
                {v === "D1" ? "D1 Rasi" : "D9 Navamsa"}
              </button>
            ))}
          </div>

          {/* Chart grid */}
          <div style={{ overflowX: "auto" }}>
            <RasiGrid chart={chart} d9={view === "D9"} />
          </div>

          {/* Planet table */}
          <div style={{
            background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
            borderRadius: "14px", overflow: "hidden",
          }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--cl-border)" }}>
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
                Planet Positions
              </p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    {["Planet", "Rasi", "Nakshatra", "Pada", "Degree", "House"].map((h) => (
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
                        <td style={{ padding: "9px 14px", color: "var(--cl-ink-2)" }}>{p.nakshatraName}</td>
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

          {/* Save CTA */}
          <div style={{
            background: "rgba(184,90,44,0.05)", border: "1px solid rgba(184,90,44,0.2)",
            borderRadius: "14px", padding: "18px 22px",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap",
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--cl-ink)", fontSize: "0.92rem" }}>
                Save your chart and get daily guidance
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--cl-muted)" }}>
                Free account — daily reading, family vault, dasha tracking.
              </p>
            </div>
            <a href="/dashboard" style={{
              display: "inline-flex", alignItems: "center", padding: "9px 22px",
              background: "var(--cl-ink)", color: "var(--cl-bg)", borderRadius: "999px",
              fontWeight: 600, fontSize: "0.88rem", textDecoration: "none",
            }}>
              Get started free →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
