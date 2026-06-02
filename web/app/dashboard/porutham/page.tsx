"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { t, LANG_STORAGE_KEY } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, ChartCalculateResponseData, DirectPoruthamData } from "@/lib/types";
import { RasiChart } from "@/components/dashboard-charts";
import { Field, PlaceCombobox } from "@/components/dashboard-ui";

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

// PersonForm is a top-level component so React never remounts it mid-edit.
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

      <Field label={lang === "ta" ? "பெயர்" : "Name"}>
        <input className="input" value={form.displayName}
          onChange={(e) => onChange({ ...form, displayName: e.target.value })}
          placeholder={lang === "ta" ? "பெயர் உள்ளிடவும்" : "Enter name"} />
      </Field>

      <Field label={lang === "ta" ? "பிறந்த தேதி" : "Birth Date"}>
        <input className="input" type="date" value={form.birthDateLocal}
          onChange={(e) => onChange({ ...form, birthDateLocal: e.target.value })} />
      </Field>

      <Field label={lang === "ta" ? "பிறந்த நேரம்" : "Birth Time"}>
        <input className="input" type="time" value={form.birthTimeLocal}
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
        <input className="input" value={form.birthTimezone}
          onChange={(e) => onChange({ ...form, birthTimezone: e.target.value })} />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <Field label={t("field_latitude", lang)}>
          <input className="input" inputMode="decimal" value={form.birthLatitude}
            onChange={(e) => onChange({ ...form, birthLatitude: e.target.value })} />
        </Field>
        <Field label={t("field_longitude", lang)}>
          <input className="input" inputMode="decimal" value={form.birthLongitude}
            onChange={(e) => onChange({ ...form, birthLongitude: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

export default function PoruthamPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ta");
  const [formA, setFormA] = useState<BirthForm>(EMPTY_FORM);
  const [formB, setFormB] = useState<BirthForm>(EMPTY_FORM);
  const [compatCtx, setCompatCtx] = useState<"GENERAL" | "MARRIAGE" | "FRIENDSHIP" | "BUSINESS" | "FAMILY">("MARRIAGE");
  const [chartA, setChartA] = useState<ChartCalculateResponseData | null>(null);
  const [chartB, setChartB] = useState<ChartCalculateResponseData | null>(null);
  const [porutham, setPorutham] = useState<DirectPoruthamData | null>(null);
  const [tempIds, setTempIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "ta" || stored === "en") setLang(stored as "ta" | "en");
    void fetch("/api/backend/api/v1/settings/ui", { credentials: "include" })
      .then((r) => r.json())
      .then((j: { data?: { lang?: string } }) => {
        const dbLang = j.data?.lang;
        if (dbLang === "ta" || dbLang === "en") setLang(dbLang);
      })
      .catch(() => { /* fallback to localStorage */ });
  }, []);

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

  async function handleBack() {
    await Promise.all(tempIds.map((id) => apiFetchJson(`/api/v1/birth-profiles/${id}`, { method: "DELETE" }).catch(() => {})));
    router.back();
  }

  const pct = porutham ? porutham.totalScore / Math.max(1, porutham.maxScore) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#05070d", color: "#e5e7eb", padding: "24px 16px" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="button" onClick={() => void handleBack()}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", padding: "6px 12px", fontSize: "0.8rem", cursor: "pointer" }}>
            ← {lang === "ta" ? "திரும்பு" : "Back"}
          </button>
          <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
            {lang === "ta" ? "பொருத்தம் — எந்த இரு நபரும்" : "Compatibility — Any Two People"}
          </h1>
        </div>

        {/* Context selector */}
        <div className="card" style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginRight: "4px" }}>
              {lang === "ta" ? "வகை" : "Context"}
            </span>
            {(["GENERAL", "MARRIAGE", "FRIENDSHIP", "BUSINESS", "FAMILY"] as const).map((ctx) => (
              <button key={ctx} type="button" onClick={() => setCompatCtx(ctx)}
                style={{
                  padding: "4px 12px", borderRadius: "14px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                  border: compatCtx === ctx ? "1px solid rgba(147,197,253,0.45)" : "1px solid rgba(255,255,255,0.1)",
                  background: compatCtx === ctx ? "rgba(147,197,253,0.14)" : "transparent",
                  color: compatCtx === ctx ? "#93c5fd" : "rgba(255,255,255,0.45)",
                }}>
                {ctx === "GENERAL" ? (lang === "ta" ? "பொதுவான" : "General") :
                 ctx === "MARRIAGE" ? (lang === "ta" ? "திருமணம்" : "Marriage") :
                 ctx === "FRIENDSHIP" ? (lang === "ta" ? "நட்பு" : "Friendship") :
                 ctx === "BUSINESS" ? (lang === "ta" ? "தொழில்" : "Business") :
                 (lang === "ta" ? "குடும்பம்" : "Family")}
              </button>
            ))}
          </div>
        </div>

        {/* Two person forms */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div className="card" style={{ padding: "20px", flex: 1, minWidth: "260px" }}>
            <PersonForm
              lang={lang}
              label={lang === "ta" ? "நபர் 1 (ஆண்)" : "Person 1 (Boy)"}
              accentColor="#e5b84d"
              form={formA}
              onChange={setFormA}
            />
          </div>
          <div className="card" style={{ padding: "20px", flex: 1, minWidth: "260px" }}>
            <PersonForm
              lang={lang}
              label={lang === "ta" ? "நபர் 2 (பெண்)" : "Person 2 (Girl)"}
              accentColor="#93c5fd"
              form={formB}
              onChange={setFormB}
            />
          </div>
        </div>

        {error && <p style={{ margin: 0, color: "#f87171", fontSize: "0.78rem" }}>{error}</p>}

        <button type="button" className="button button--primary"
          onClick={() => void handleCompare()} disabled={loading}
          style={{ alignSelf: "flex-start", padding: "10px 24px" }}>
          {loading
            ? (lang === "ta" ? "கணக்கிடுகிறது…" : "Calculating…")
            : (lang === "ta" ? "பொருத்தம் காண்க" : "Check Compatibility")}
        </button>

        {/* Results */}
        {porutham && chartA && chartB && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Score header */}
            <div className="card" style={{ padding: "20px", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {lang === "ta" ? "மொத்த பொருத்தம்" : "Total Score"}
                </p>
                <p style={{ margin: 0, fontSize: "2.4rem", fontWeight: 900, lineHeight: 1, color: scoreColor(pct) }}>
                  {porutham.totalScore}
                  <span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/{porutham.maxScore}</span>
                </p>
                <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.55)" }}>
                  {porutham.label} · {porutham.percentage.toFixed(0)}%
                </p>
                {(porutham.rajjuDosha || porutham.vedhaDosha) && (
                  <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {porutham.rajjuDosha && <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: "rgba(248,113,113,0.2)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>⚠ {lang === "ta" ? "ராஜ்ஜு தோஷம்" : "Rajju Dosha"}</span>}
                    {porutham.vedhaDosha && <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: "rgba(248,113,113,0.2)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>⚠ {lang === "ta" ? "வேத தோஷம்" : "Vedha Dosha"}</span>}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                  {lang === "ta" ? porutham.summary.ta : porutham.summary.en}
                </p>
                {porutham.contextNote && (
                  <p style={{ margin: "8px 0 0", fontSize: "0.74rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                    {lang === "ta" ? porutham.contextNote.ta : porutham.contextNote.en}
                  </p>
                )}
              </div>
            </div>

            {/* Kuta breakdown */}
            <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {lang === "ta" ? "குட பொருத்தங்கள்" : "Kuta breakdown"}
              </p>
              {porutham.kutas.map((k) => {
                const kpct = k.maxScore > 0 ? k.score / k.maxScore : 0;
                return (
                  <div key={k.name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "7px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ margin: 0, minWidth: "140px", fontSize: "0.76rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                      {lang === "ta" ? k.nameTa : k.name}
                    </p>
                    <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "3px", width: `${Math.round(kpct * 100)}%`, background: scoreColor(kpct) }} />
                    </div>
                    <p style={{ margin: 0, fontSize: "0.74rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", minWidth: "40px", textAlign: "right" }}>
                      {k.score}/{k.maxScore}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Side-by-side kattam */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
              <div className="card" style={{ padding: "14px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 700, color: "#e5b84d" }}>{chartA.birthProfile.displayName}</p>
                <RasiChart chart={chartA} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              </div>
              <div className="card" style={{ padding: "14px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 700, color: "#93c5fd" }}>{chartB.birthProfile.displayName}</p>
                <RasiChart chart={chartB} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
              {lang === "ta"
                ? "இந்த ஜாதகங்கள் தற்காலிகமானவை. பக்கம் விட்டு சென்றதும் தானாக நீக்கப்படும்."
                : "Temporary charts — auto-deleted when you leave this page."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
