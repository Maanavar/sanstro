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

function scoreColor(pct: number): string {
  if (pct >= 0.7) return "#4ade80";
  if (pct >= 0.4) return "#fbbf24";
  return "#f87171";
}

interface CompareModalProps {
  lang: Lang;
  onClose: () => void;
}

export function CompareModal({ lang, onClose }: CompareModalProps) {
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
      setError(lang === "ta" ? "இரு நபர்களின் அனைத்து தகவல்களையும் நிரப்பவும்." : "Please fill all fields for both persons.");
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

  async function handleClose() {
    await Promise.all(tempIds.map((id) => apiFetchJson(`/api/v1/birth-profiles/${id}`, { method: "DELETE" }).catch(() => {})));
    onClose();
  }

  const pct = porutham ? porutham.totalScore / Math.max(1, porutham.maxScore) : 0;

  function PersonForm({ label, accentColor, form, setForm }: {
    label: string;
    accentColor: string;
    form: BirthForm;
    setForm: React.Dispatch<React.SetStateAction<BirthForm>>;
  }) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", minWidth: "230px" }}>
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: accentColor }}>{label}</p>

        <Field label={lang === "ta" ? "பெயர்" : "Name"}>
          <input className="input" value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder={lang === "ta" ? "பெயர் உள்ளிடவும்" : "Enter name"} />
        </Field>

        <Field label={lang === "ta" ? "பிறந்த தேதி" : "Birth Date"}>
          <input className="input" type="date" value={form.birthDateLocal}
            onChange={(e) => setForm((f) => ({ ...f, birthDateLocal: e.target.value }))} />
        </Field>

        <Field label={lang === "ta" ? "பிறந்த நேரம்" : "Birth Time"}>
          <input className="input" type="time" value={form.birthTimeLocal}
            onChange={(e) => setForm((f) => ({ ...f, birthTimeLocal: e.target.value }))} />
        </Field>

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

        <Field label={t("field_timezone", lang)}>
          <input className="input" value={form.birthTimezone}
            onChange={(e) => setForm((f) => ({ ...f, birthTimezone: e.target.value }))} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <Field label={t("field_latitude", lang)}>
            <input className="input" inputMode="decimal" value={form.birthLatitude}
              onChange={(e) => setForm((f) => ({ ...f, birthLatitude: e.target.value }))} />
          </Field>
          <Field label={t("field_longitude", lang)}>
            <input className="input" inputMode="decimal" value={form.birthLongitude}
              onChange={(e) => setForm((f) => ({ ...f, birthLongitude: e.target.value }))} />
          </Field>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) void handleClose(); }}
    >
      <div className="card" style={{ width: "min(740px, 100%)", maxHeight: "92vh", overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1rem" }}>
            {lang === "ta" ? "பொருத்தம் — எந்த இரு நபரும்" : "Compatibility — Any Two People"}
          </h3>
          <button type="button" className="button button--ghost" onClick={() => void handleClose()}>✕</button>
        </div>

        {/* Context selector */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
            {lang === "ta" ? "வகை" : "Context"}
          </span>
          {(["GENERAL", "MARRIAGE", "FRIENDSHIP", "BUSINESS", "FAMILY"] as const).map((ctx) => (
            <button key={ctx} type="button" onClick={() => setCompatCtx(ctx)}
              style={{
                padding: "3px 10px", borderRadius: "14px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer",
                border: compatCtx === ctx ? "1px solid rgba(147,197,253,0.45)" : "1px solid rgba(255,255,255,0.1)",
                background: compatCtx === ctx ? "rgba(147,197,253,0.14)" : "transparent",
                color: compatCtx === ctx ? "#93c5fd" : "rgba(255,255,255,0.45)",
              }}
            >
              {ctx === "GENERAL" ? (lang === "ta" ? "பொதுவான" : "General") :
               ctx === "MARRIAGE" ? (lang === "ta" ? "திருமணம்" : "Marriage") :
               ctx === "FRIENDSHIP" ? (lang === "ta" ? "நட்பு" : "Friendship") :
               ctx === "BUSINESS" ? (lang === "ta" ? "தொழில்" : "Business") :
               (lang === "ta" ? "குடும்பம்" : "Family")}
            </button>
          ))}
        </div>

        {/* Two person forms side by side */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <PersonForm
            label={lang === "ta" ? "நபர் 1 (ஆண்)" : "Person 1 (Boy)"}
            accentColor="#e5b84d"
            form={formA}
            setForm={setFormA}
          />
          <div style={{ width: "1px", background: "rgba(255,255,255,0.08)", alignSelf: "stretch" }} />
          <PersonForm
            label={lang === "ta" ? "நபர் 2 (பெண்)" : "Person 2 (Girl)"}
            accentColor="#93c5fd"
            form={formB}
            setForm={setFormB}
          />
        </div>

        {error && <p style={{ margin: 0, color: "#f87171", fontSize: "0.78rem" }}>{error}</p>}

        <button type="button" className="button button--primary"
          onClick={() => void handleCompare()} disabled={loading}
          style={{ alignSelf: "flex-start" }}
        >
          {loading
            ? (lang === "ta" ? "கணக்கிடுகிறது…" : "Calculating…")
            : (lang === "ta" ? "பொருத்தம் காண்க" : "Check Compatibility")}
        </button>

        {porutham && chartA && chartB && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Score header */}
            <div style={{ padding: "16px 20px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {lang === "ta" ? "மொத்த பொருத்தம்" : "Total Score"}
                </p>
                <p style={{ margin: 0, fontSize: "2.2rem", fontWeight: 900, lineHeight: 1, color: scoreColor(pct) }}>
                  {porutham.totalScore}
                  <span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/{porutham.maxScore}</span>
                </p>
                <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.55)" }}>
                  {porutham.label} · {porutham.percentage.toFixed(0)}%
                </p>
                {(porutham.rajjuDosha || porutham.vedhaDosha) && (
                  <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {porutham.rajjuDosha && <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(248,113,113,0.2)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>⚠ {lang === "ta" ? "ராஜ்ஜு தோஷம்" : "Rajju Dosha"}</span>}
                    {porutham.vedhaDosha && <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(248,113,113,0.2)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>⚠ {lang === "ta" ? "வேத தோஷம்" : "Vedha Dosha"}</span>}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                  {lang === "ta" ? porutham.summary.ta : porutham.summary.en}
                </p>
                {porutham.contextNote && (
                  <p style={{ margin: "6px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
                    {lang === "ta" ? porutham.contextNote.ta : porutham.contextNote.en}
                  </p>
                )}
              </div>
            </div>

            {/* Kuta breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {porutham.kutas.map((k) => {
                const kpct = k.maxScore > 0 ? k.score / k.maxScore : 0;
                return (
                  <div key={k.name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 10px", borderRadius: "7px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ margin: 0, minWidth: "130px", fontSize: "0.74rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                      {lang === "ta" ? k.nameTa : k.name}
                    </p>
                    <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "3px", width: `${Math.round(kpct * 100)}%`, background: scoreColor(kpct) }} />
                    </div>
                    <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", minWidth: "36px", textAlign: "right" }}>
                      {k.score}/{k.maxScore}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Side-by-side kattam */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
              <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px", background: "rgba(255,255,255,0.02)" }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "#e5b84d" }}>{chartA.birthProfile.displayName}</p>
                <RasiChart chart={chartA} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px", background: "rgba(255,255,255,0.02)" }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "#93c5fd" }}>{chartB.birthProfile.displayName}</p>
                <RasiChart chart={chartB} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
              {lang === "ta"
                ? "இந்த ஜாதகங்கள் தற்காலிகமானவை. மூடியதும் தானாக நீக்கப்படும்."
                : "Temporary charts — auto-deleted when you close."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
