"use client";

import { useState } from "react";
import { PlaceCombobox } from "@/components/dashboard-ui";
import { readErrorMessage } from "@/lib/api";
import type { KutaResult, BiText } from "@/lib/types";

/* Extended type that includes nadiDosha — returned by the public API */
interface NadiDoshaResult {
  boyNadi: string;
  girlNadi: string;
  hasNadiDosha: boolean;
  cancellations: string[];
  severity: string;
  noteTa: string;
  noteEn: string;
}
interface PublicPoruthamData {
  boyNakshatra: number;
  boyNakshatraName: string;
  girlNakshatra: number;
  girlNakshatraName: string;
  kutas: KutaResult[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  label: string;
  rajjuDosha: boolean;
  vedhaDosha: boolean;
  nadiDosha: NadiDoshaResult;
  summary: BiText;
  compatibilityContext: string;
  contextNote: BiText | null;
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
  fontSize: "0.88rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const,
};
const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "5px",
  fontSize: "0.78rem", fontWeight: 600, color: "var(--cl-ink-2)",
};

function PersonForm({
  label, accentColor, form, onChange,
}: {
  label: string; accentColor: string;
  form: Form; onChange: (f: Form) => void;
}) {
  return (
    <div className="cd-responsive-form-block" style={{
      flex: 1, minWidth: "280px",
      background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
      borderRadius: "14px", padding: "20px",
      display: "flex", flexDirection: "column", gap: "12px",
    }}>
      <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: accentColor }}>{label}</p>

      <label style={labelStyle}>
        Name
        <input style={inputStyle} value={form.displayName}
          onChange={(e) => onChange({ ...form, displayName: e.target.value })}
          placeholder="Enter name" />
      </label>

      <div className="cl-mobile-form-grid-2" style={{ gap: "10px" }}>
        <label style={labelStyle}>
          Birth Date *
          <input style={inputStyle} type="date" value={form.birthDateLocal}
            onChange={(e) => onChange({ ...form, birthDateLocal: e.target.value })} />
        </label>
        <label style={labelStyle}>
          Birth Time
          <input style={inputStyle} type="time" value={form.birthTimeLocal}
            onChange={(e) => onChange({ ...form, birthTimeLocal: e.target.value })} />
        </label>
      </div>

      <label style={labelStyle}>
        Birth Place *
        <PlaceCombobox
          value={form.birthPlace}
          onChange={(city, raw) => onChange({
            ...form, birthPlace: raw,
            ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
          })}
        />
      </label>

      <div className="cl-mobile-form-grid-2" style={{ gap: "10px" }}>
        <label style={labelStyle}>
          Latitude
          <input style={inputStyle} inputMode="decimal" value={form.birthLatitude}
            onChange={(e) => onChange({ ...form, birthLatitude: e.target.value })} placeholder="e.g. 13.08" />
        </label>
        <label style={labelStyle}>
          Longitude
          <input style={inputStyle} inputMode="decimal" value={form.birthLongitude}
            onChange={(e) => onChange({ ...form, birthLongitude: e.target.value })} placeholder="e.g. 80.27" />
        </label>
      </div>
    </div>
  );
}

function scoreColor(pct: number): string {
  if (pct >= 0.7) return "#5C7654";
  if (pct >= 0.4) return "#B85A2C";
  return "#A8482F";
}

export function PoruthamTool() {
  const [formA, setFormA] = useState<Form>(EMPTY);
  const [formB, setFormB] = useState<Form>(EMPTY);
  const [result, setResult] = useState<PublicPoruthamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheck() {
    const valid = (f: Form) => f.birthDateLocal && f.birthLatitude && f.birthLongitude;
    if (!valid(formA) || !valid(formB)) {
      setError("Please fill date and birth place for both persons.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/backend/api/v1/public/porutham", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personA: {
            displayName: formA.displayName || "Person A",
            birthDateLocal: formA.birthDateLocal,
            birthTimeLocal: formA.birthTimeLocal || null,
            birthLatitude: parseFloat(formA.birthLatitude),
            birthLongitude: parseFloat(formA.birthLongitude),
            birthTimezone: formA.birthTimezone,
            birthPlace: formA.birthPlace,
          },
          personB: {
            displayName: formB.displayName || "Person B",
            birthDateLocal: formB.birthDateLocal,
            birthTimeLocal: formB.birthTimeLocal || null,
            birthLatitude: parseFloat(formB.birthLatitude),
            birthLongitude: parseFloat(formB.birthLongitude),
            birthTimezone: formB.birthTimezone,
            birthPlace: formB.birthPlace,
          },
          compatibilityContext: "MARRIAGE",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Error ${res.status}`);
      }
      const data = await res.json() as { success: boolean; data: PublicPoruthamData };
      setResult(data.data);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const pct = result ? result.totalScore / Math.max(1, result.maxScore) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Two person forms */}
      <div className="cl-mobile-flex-row" style={{ gap: "16px" }}>
        <PersonForm label="Person 1 (Boy / Groom)" accentColor="#B85A2C" form={formA} onChange={setFormA} />
        <PersonForm label="Person 2 (Girl / Bride)" accentColor="#5C7654" form={formB} onChange={setFormB} />
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#A8482F", background: "rgba(168,72,47,0.08)", border: "1px solid rgba(168,72,47,0.25)", borderRadius: "8px", padding: "10px 14px" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleCheck()}
        disabled={loading}
        style={{
          alignSelf: "flex-start", padding: "10px 32px",
          background: loading ? "var(--cl-border)" : "var(--cl-ink)",
          color: "var(--cl-bg)", border: "none", borderRadius: "999px",
          fontFamily: "inherit", fontSize: "0.9rem", fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Calculating…" : "Check Porutham"}
      </button>

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Score header */}
          <div className="cl-mobile-card-split" style={{
            background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
            borderRadius: "16px", padding: "22px 24px",
          }}>
            <div style={{ minWidth: "120px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
                Total Score
              </p>
              <p style={{ margin: 0, fontSize: "3rem", fontWeight: 700, lineHeight: 1, color: scoreColor(pct) }}>
                {result.totalScore}
                <span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--cl-muted)" }}>/{result.maxScore}</span>
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--cl-muted)" }}>
                {result.label} · {result.percentage.toFixed(0)}%
              </p>
              {(result.rajjuDosha || result.vedhaDosha) && (
                <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {result.rajjuDosha && (
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: "rgba(168,72,47,0.12)", color: "#A8482F", border: "1px solid rgba(168,72,47,0.3)" }}>
                      ⚠ Rajju Dosha
                    </span>
                  )}
                  {result.vedhaDosha && (
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: "rgba(168,72,47,0.12)", color: "#A8482F", border: "1px solid rgba(168,72,47,0.3)" }}>
                      ⚠ Vedha Dosha
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--cl-ink-2)", lineHeight: 1.65 }}>
                {result.summary.en}
              </p>
              <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--cl-muted)", background: "var(--cl-bg-2)", border: "1px solid var(--cl-border)", borderRadius: "999px", padding: "3px 12px" }}>
                  {formA.displayName || "Person A"}: {result.boyNakshatraName}
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--cl-muted)", background: "var(--cl-bg-2)", border: "1px solid var(--cl-border)", borderRadius: "999px", padding: "3px 12px" }}>
                  {formB.displayName || "Person B"}: {result.girlNakshatraName}
                </span>
              </div>
            </div>
          </div>

          {/* Kuta breakdown */}
          <div style={{
            background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
            borderRadius: "14px", padding: "18px",
          }}>
            <p style={{ margin: "0 0 14px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
              Kuta Breakdown
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {result.kutas.map((k) => {
                const kpct = k.maxScore > 0 ? k.score / k.maxScore : 0;
                return (
                  <div key={k.name} className="cl-mobile-flex-row" style={{
                    alignItems: "center", gap: "12px",
                    padding: "8px 12px", borderRadius: "8px",
                    background: "var(--cl-bg-2)", border: "1px solid var(--cl-border)",
                  }}>
                    <span style={{ minWidth: "130px", fontSize: "0.82rem", fontWeight: 600, color: "var(--cl-ink)" }}>
                      {k.name}
                    </span>
                    <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "var(--cl-border)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "3px", width: `${Math.round(kpct * 100)}%`, background: scoreColor(kpct) }} />
                    </div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: scoreColor(kpct), minWidth: "36px", textAlign: "right" }}>
                      {k.score}/{k.maxScore}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nadi dosha detail */}
          {result.nadiDosha.hasNadiDosha && (
            <div style={{
              background: "rgba(168,72,47,0.06)", border: "1px solid rgba(168,72,47,0.25)",
              borderRadius: "12px", padding: "14px 18px",
            }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A8482F" }}>
                ⚠ Nadi Dosha — {result.nadiDosha.severity}
              </p>
              <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--cl-ink-2)", lineHeight: 1.6 }}>
                {result.nadiDosha.noteEn}
              </p>
            </div>
          )}

          {/* Save CTA */}
          <div className="cl-mobile-card-split" style={{
            background: "rgba(184,90,44,0.05)", border: "1px solid rgba(184,90,44,0.2)",
            borderRadius: "14px", padding: "18px 22px",
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--cl-ink)", fontSize: "0.92rem" }}>
                Save this result and add to your family vault
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--cl-muted)" }}>
                Free account — save results, compare multiple matches, get daily guidance.
              </p>
            </div>
            <a href="/dashboard" className="cl-mobile-cta" style={{
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
