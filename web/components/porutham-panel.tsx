"use client";

import { useState } from "react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, ChartCalculateResponseData, DirectPoruthamData } from "@/lib/types";
import { RasiChart } from "./dashboard-charts";
import { Field, PlaceCombobox } from "./dashboard-ui";

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

const W = {
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "#A89D89",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  card: "#FFFFFF",
  terracotta: "#B85A2C",
  sage: "#5C7654",
  rust: "#A8482F",
} as const;

const fieldStyle: React.CSSProperties = {
  borderRadius: "10px",
  border: `1.5px solid ${W.borderLt}`,
  background: W.card,
  color: W.inkMid,
  fontSize: "0.82rem",
  padding: "8px 10px",
  fontFamily: "inherit",
};

function scoreColor(pct: number): string {
  if (pct >= 0.7) return W.sage;
  if (pct >= 0.4) return W.terracotta;
  return W.rust;
}

function PersonForm({
  lang,
  label,
  accentColor,
  form,
  onChange,
}: {
  lang: Lang;
  label: string;
  accentColor: string;
  form: BirthForm;
  onChange: (updated: BirthForm) => void;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", minWidth: "260px" }}>
      <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: accentColor }}>{label}</p>
      <Field label={lang === "ta" ? "à®ªà¯†à®¯à®°à¯" : "Name"}>
        <input className="input" style={fieldStyle} value={form.displayName}
          onChange={(e) => onChange({ ...form, displayName: e.target.value })}
          placeholder={lang === "ta" ? "à®ªà¯†à®¯à®°à¯ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯" : "Enter name"} />
      </Field>
      <Field label={lang === "ta" ? "à®ªà®¿à®±à®¨à¯à®¤ à®¤à¯‡à®¤à®¿" : "Birth Date"}>
        <input className="input" style={fieldStyle} type="date" value={form.birthDateLocal}
          onChange={(e) => onChange({ ...form, birthDateLocal: e.target.value })} />
      </Field>
      <Field label={lang === "ta" ? "à®ªà®¿à®±à®¨à¯à®¤ à®¨à¯‡à®°à®®à¯" : "Birth Time"}>
        <input className="input" style={fieldStyle} type="time" value={form.birthTimeLocal}
          onChange={(e) => onChange({ ...form, birthTimeLocal: e.target.value })} />
      </Field>
      <Field label={t("field_birth_place", lang)} helper={t("field_place_helper", lang)}>
        <PlaceCombobox
          value={form.birthPlace}
          onChange={(city, raw) => onChange({
            ...form,
            birthPlace: raw,
            ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
          })}
        />
      </Field>
      <Field label={t("field_timezone", lang)}>
        <input className="input" style={fieldStyle} value={form.birthTimezone}
          onChange={(e) => onChange({ ...form, birthTimezone: e.target.value })} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <Field label={t("field_latitude", lang)}>
          <input className="input" style={fieldStyle} inputMode="decimal" value={form.birthLatitude}
            onChange={(e) => onChange({ ...form, birthLatitude: e.target.value })} />
        </Field>
        <Field label={t("field_longitude", lang)}>
          <input className="input" style={fieldStyle} inputMode="decimal" value={form.birthLongitude}
            onChange={(e) => onChange({ ...form, birthLongitude: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

interface PoruthamPanelProps {
  lang: Lang;
}

export function PoruthamPanel({ lang }: PoruthamPanelProps) {
  const [formA, setFormA] = useState<BirthForm>(EMPTY_FORM);
  const [formB, setFormB] = useState<BirthForm>(EMPTY_FORM);
  const [compatCtx, setCompatCtx] = useState<"GENERAL" | "MARRIAGE" | "FRIENDSHIP" | "BUSINESS" | "FAMILY">("MARRIAGE");
  const [chartA, setChartA] = useState<ChartCalculateResponseData | null>(null);
  const [chartB, setChartB] = useState<ChartCalculateResponseData | null>(null);
  const [porutham, setPorutham] = useState<DirectPoruthamData | null>(null);
  const [tempIds, setTempIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createTempProfile(form: BirthForm): Promise<{ birthProfileId: string }> {
    const res = await apiFetchJson<{ data: { birthProfileId: string } }>("/api/v1/birth-profiles", {
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
    return res.data;
  }

  async function handleCompare() {
    const valid = (f: BirthForm) => f.displayName && f.birthDateLocal && f.birthPlace && f.birthLatitude && f.birthLongitude && f.birthTimezone;
    if (!valid(formA) || !valid(formB)) {
      setError(lang === "ta" ? "à®‡à®°à¯ à®¨à®ªà®°à¯à®•à®³à®¿à®©à¯ à®…à®©à¯ˆà®¤à¯à®¤à¯ à®¤à®•à®µà®²à¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®¨à®¿à®°à®ªà¯à®ªà®µà¯à®®à¯." : "Please fill all fields for both persons.");
      return;
    }
    setError("");
    setLoading(true);
    await Promise.all(tempIds.map((id) => apiFetchJson(`/api/v1/birth-profiles/${id}`, { method: "DELETE" }).catch(() => {})));
    setTempIds([]);
    setPorutham(null); setChartA(null); setChartB(null);

    try {
      const [profA, profB] = await Promise.all([createTempProfile(formA), createTempProfile(formB)]);
      setTempIds([profA.birthProfileId, profB.birthProfileId]);

      const [resA, resB] = await Promise.all([
        apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>("/api/v1/charts/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ birthProfileId: profA.birthProfileId, calculationVersion: "thirukanitham-2026-v1" }),
        }),
        apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>("/api/v1/charts/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ birthProfileId: profB.birthProfileId, calculationVersion: "thirukanitham-2026-v1" }),
        }),
      ]);
      setChartA(resA.data); setChartB(resB.data);

      const porRes = await apiFetchJson<{ data: DirectPoruthamData }>("/api/v1/relationships/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartIdA: resA.data.chartId, chartIdB: resB.data.chartId, compatibilityContext: compatCtx }),
      });
      setPorutham(porRes.data);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const pct = porutham ? porutham.totalScore / Math.max(1, porutham.maxScore) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Context selector */}
      <div className="card" style={{ padding: "14px 16px", background: W.card, border: `1px solid ${W.borderLt}` }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase", marginRight: "4px" }}>
            {lang === "ta" ? "à®µà®•à¯ˆ" : "Context"}
          </span>
          {(["GENERAL", "MARRIAGE", "FRIENDSHIP", "BUSINESS", "FAMILY"] as const).map((ctx) => (
            <button key={ctx} type="button" onClick={() => setCompatCtx(ctx)}
              style={{
                padding: "4px 12px", borderRadius: "14px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                border: compatCtx === ctx ? `1px solid ${W.terracotta}66` : `1px solid ${W.border}`,
                background: compatCtx === ctx ? "#F8E4D2" : W.surface,
                color: compatCtx === ctx ? W.terracotta : W.muted,
              }}>
              {ctx === "GENERAL" ? (lang === "ta" ? "à®ªà¯Šà®¤à¯à®µà®¾à®©" : "General") :
               ctx === "MARRIAGE" ? (lang === "ta" ? "à®¤à®¿à®°à¯à®®à®£à®®à¯" : "Marriage") :
               ctx === "FRIENDSHIP" ? (lang === "ta" ? "à®¨à®Ÿà¯à®ªà¯" : "Friendship") :
               ctx === "BUSINESS" ? (lang === "ta" ? "à®¤à¯Šà®´à®¿à®²à¯" : "Business") :
               (lang === "ta" ? "à®•à¯à®Ÿà¯à®®à¯à®ªà®®à¯" : "Family")}
            </button>
          ))}
        </div>
      </div>

      {/* Two person forms */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div className="card" style={{ padding: "20px", flex: 1, minWidth: "260px", background: W.card, border: `1px solid ${W.borderLt}` }}>
          <PersonForm
            lang={lang}
            label={lang === "ta" ? "à®¨à®ªà®°à¯ 1 (à®†à®£à¯)" : "Person 1 (Boy)"}
            accentColor={W.terracotta}
            form={formA}
            onChange={setFormA}
          />
        </div>
        <div className="card" style={{ padding: "20px", flex: 1, minWidth: "260px", background: W.card, border: `1px solid ${W.borderLt}` }}>
          <PersonForm
            lang={lang}
            label={lang === "ta" ? "à®¨à®ªà®°à¯ 2 (à®ªà¯†à®£à¯)" : "Person 2 (Girl)"}
            accentColor={W.inkMid}
            form={formB}
            onChange={setFormB}
          />
        </div>
      </div>

      {error && <p style={{ margin: 0, color: W.rust, fontSize: "0.78rem" }}>{error}</p>}

      <button type="button"
        onClick={() => void handleCompare()} disabled={loading}
        style={{
          alignSelf: "flex-start",
          padding: "10px 24px",
          borderRadius: "10px",
          border: `1px solid ${W.terracotta}66`,
          background: loading ? W.surfaceMd : "#F8E4D2",
          color: loading ? W.mutedLt : W.terracotta,
          cursor: loading ? "wait" : "pointer",
          fontWeight: 700,
          fontSize: "0.8rem",
        }}>
        {loading
          ? (lang === "ta" ? "à®•à®£à®•à¯à®•à®¿à®Ÿà¯à®•à®¿à®±à®¤à¯â€¦" : "Calculatingâ€¦")
          : (lang === "ta" ? "à®ªà¯Šà®°à¯à®¤à¯à®¤à®®à¯ à®•à®¾à®£à¯à®•" : "Check Compatibility")}
      </button>

      {/* Results */}
      {porutham && chartA && chartB && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Score header */}
          <div className="card" style={{ padding: "20px", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center", background: W.card, border: `1px solid ${W.borderLt}` }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {lang === "ta" ? "à®®à¯Šà®¤à¯à®¤ à®ªà¯Šà®°à¯à®¤à¯à®¤à®®à¯" : "Total Score"}
              </p>
              <p style={{ margin: 0, fontSize: "2.4rem", fontWeight: 900, lineHeight: 1, color: scoreColor(pct) }}>
                {porutham.totalScore}
                <span style={{ fontSize: "1rem", fontWeight: 400, color: W.mutedLt }}>/{porutham.maxScore}</span>
              </p>
              <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: W.muted }}>
                {porutham.label} Â· {porutham.percentage.toFixed(0)}%
              </p>
              {(porutham.rajjuDosha || porutham.vedhaDosha) && (
                <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {porutham.rajjuDosha && <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: "#FCE7E2", color: W.rust, border: `1px solid ${W.rust}44` }}>âš  {lang === "ta" ? "à®°à®¾à®œà¯à®œà¯ à®¤à¯‹à®·à®®à¯" : "Rajju Dosha"}</span>}
                  {porutham.vedhaDosha && <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: "#FCE7E2", color: W.rust, border: `1px solid ${W.rust}44` }}>âš  {lang === "ta" ? "à®µà¯‡à®¤ à®¤à¯‹à®·à®®à¯" : "Vedha Dosha"}</span>}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ margin: 0, fontSize: "0.82rem", color: W.inkMid, lineHeight: 1.6 }}>
                {lang === "ta" ? porutham.summary.ta : porutham.summary.en}
              </p>
              {porutham.contextNote && (
                <p style={{ margin: "8px 0 0", fontSize: "0.74rem", color: W.muted, lineHeight: 1.4 }}>
                  {lang === "ta" ? porutham.contextNote.ta : porutham.contextNote.en}
                </p>
              )}
            </div>
          </div>

          {/* Kuta breakdown */}
          <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", background: W.card, border: `1px solid ${W.borderLt}` }}>
            <p style={{ margin: "0 0 6px", fontSize: "0.7rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {lang === "ta" ? "à®•à¯à®Ÿ à®ªà¯Šà®°à¯à®¤à¯à®¤à®™à¯à®•à®³à¯" : "Kuta breakdown"}
            </p>
            {porutham.kutas.map((k) => {
              const kpct = k.maxScore > 0 ? k.score / k.maxScore : 0;
              return (
                <div key={k.name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "7px", background: W.surface, border: `1px solid ${W.borderLt}` }}>
                  <p style={{ margin: 0, minWidth: "140px", fontSize: "0.76rem", fontWeight: 600, color: W.inkMid }}>
                    {lang === "ta" ? k.nameTa : k.name}
                  </p>
                  <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: W.borderLt, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "3px", width: `${Math.round(kpct * 100)}%`, background: scoreColor(kpct) }} />
                  </div>
                  <p style={{ margin: 0, fontSize: "0.74rem", fontWeight: 700, color: W.muted, minWidth: "40px", textAlign: "right" }}>
                    {k.score}/{k.maxScore}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Side-by-side charts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            <div className="card" style={{ padding: "14px", background: W.card, border: `1px solid ${W.borderLt}` }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 700, color: W.terracotta }}>{chartA.birthProfile.displayName}</p>
              <RasiChart chart={chartA} label={t("label_d1", lang)} lang={lang} showExplain={false} />
            </div>
            <div className="card" style={{ padding: "14px", background: W.card, border: `1px solid ${W.borderLt}` }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 700, color: W.inkMid }}>{chartB.birthProfile.displayName}</p>
              <RasiChart chart={chartB} label={t("label_d1", lang)} lang={lang} showExplain={false} />
            </div>
          </div>

          <p style={{ margin: 0, fontSize: "0.68rem", color: W.mutedLt, fontStyle: "italic" }}>
            {lang === "ta"
              ? "à®‡à®¨à¯à®¤ à®œà®¾à®¤à®•à®™à¯à®•à®³à¯ à®¤à®±à¯à®•à®¾à®²à®¿à®•à®®à®¾à®©à®µà¯ˆ. à®¤à®³à®¤à¯à®¤à¯ˆ à®®à¯‚à®Ÿà®¿à®¯à®¤à¯à®®à¯ à®¤à®¾à®©à®¾à®• à®¨à¯€à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®®à¯."
              : "Temporary charts â€” auto-deleted when you leave this session."}
          </p>
        </div>
      )}
    </div>
  );
}


