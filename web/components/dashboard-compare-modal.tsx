"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { MIN_BIRTH_DATE, maxBirthDateIso } from "@/lib/birth-date";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, ChartCalculateResponseData, DirectPoruthamData } from "@/lib/types";
import { RasiChart } from "./dashboard-charts";
import { Field } from "./dashboard-ui";
import { PlaceCombobox } from "./place-combobox";

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
  if (pct >= 0.7) return "var(--color-score-high, #5C7654)";
  if (pct >= 0.4) return "var(--color-score-mid, #B85A2C)";
  return "var(--color-score-low, #A8482F)";
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
  const tempIdsRef = useRef<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    tempIdsRef.current = tempIds;
  }, [tempIds]);

  useEffect(() => {
    return () => {
      for (const id of tempIdsRef.current) {
        fetch(`/api/v1/birth-profiles/${id}`, { method: "DELETE", keepalive: true }).catch(() => {});
      }
    };
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
        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: accentColor }}>{label}</p>

        <Field label={lang === "ta" ? "பெயர்" : "Name"}>
          <input className="input" value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder={lang === "ta" ? "பெயர் உள்ளிடவும்" : "Enter name"} />
        </Field>

        <Field label={lang === "ta" ? "பிறந்த தேதி" : "Birth Date"}>
          <input
            className="input"
            type="date"
            value={form.birthDateLocal}
            min={MIN_BIRTH_DATE}
            max={maxBirthDateIso()}
            onChange={(e) => {
              const next = e.target.value;
              setForm((f) => ({ ...f, birthDateLocal: next }));
            }}
          />
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
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(26,22,18,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) void handleClose(); }}
    >
      <div style={{
        width: "min(740px, 100%)", maxHeight: "92vh", overflowY: "auto",
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)", padding: "var(--space-6)",
        display: "flex", flexDirection: "column", gap: "var(--space-4)",
        boxShadow: "0 24px 64px rgba(26,22,18,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--color-text-strong)", fontFamily: "var(--font-display)", fontWeight: 500 }}>
            {lang === "ta" ? "பொருத்தம் — எந்த இரு நபரும்" : "Compatibility — Any Two People"}
          </h3>
          <button type="button" onClick={() => void handleClose()} aria-label="Close"
            style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Context selector */}
        <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase" }}>
            {lang === "ta" ? "வகை" : "Context"}
          </span>
          {(["GENERAL", "MARRIAGE", "FRIENDSHIP", "BUSINESS", "FAMILY"] as const).map((ctx) => (
            <button key={ctx} type="button" onClick={() => setCompatCtx(ctx)}
              style={{
                padding: "var(--space-0_75) var(--space-3)", borderRadius: "var(--radius-pill)",
                fontSize: "0.625rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                border: compatCtx === ctx ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
                background: compatCtx === ctx ? "#F0D9C4" : "transparent",
                color: compatCtx === ctx ? "var(--color-accent)" : "var(--color-faint)",
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
        <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap" }}>
          <PersonForm
            label={lang === "ta" ? "நபர் 1 (ஆண்)" : "Person 1 (Boy)"}
            accentColor="var(--color-accent)"
            form={formA}
            setForm={setFormA}
          />
          <div style={{ width: "1px", background: "var(--color-border)", alignSelf: "stretch" }} />
          <PersonForm
            label={lang === "ta" ? "நபர் 2 (பெண்)" : "Person 2 (Girl)"}
            accentColor="var(--color-accent-alt)"
            form={formB}
            setForm={setFormB}
          />
        </div>

        {error && <p style={{ margin: 0, color: "var(--color-score-low)", fontSize: "0.875rem" }}>{error}</p>}

        <button type="button"
          onClick={() => void handleCompare()} disabled={loading}
          style={{
            alignSelf: "flex-start", padding: "var(--space-2) var(--space-5)",
            borderRadius: "var(--radius-pill)", border: "none",
            background: "var(--color-text-strong)", color: "var(--color-bg)",
            fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading
            ? (lang === "ta" ? "கணக்கிடுகிறது…" : "Calculating…")
            : (lang === "ta" ? "பொருத்தம் காண்க" : "Check Compatibility")}
        </button>

        {porutham && chartA && chartB && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3_5)" }}>
            {/* Score header */}
            <div style={{ padding: "var(--space-4) var(--space-5)", borderRadius: "var(--radius-md)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {lang === "ta" ? "மொத்த பொருத்தம்" : "Total Score"}
                </p>
                <p style={{ margin: 0, fontSize: "2.2rem", fontWeight: 900, lineHeight: 1, color: scoreColor(pct), fontFamily: "var(--font-display)" }}>
                  {porutham.totalScore}
                  <span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--color-faint)" }}>/{porutham.maxScore}</span>
                </p>
                <p style={{ margin: "var(--space-0_75) 0 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                  {porutham.label} · {porutham.percentage.toFixed(0)}%
                </p>
                {(porutham.rajjuDosha || porutham.vedhaDosha) && (
                  <div style={{ marginTop: "var(--space-1_5)", display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                    {porutham.rajjuDosha && <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "0.625rem", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-sm)", background: "#F2D8CC", color: "var(--color-accent-strong)", border: "1px solid rgba(168,72,47,0.3)" }}><svg viewBox="0 0 24 24" fill="none" width="10" height="10" aria-hidden="true"><path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 9V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>{lang === "ta" ? "ராஜ்ஜு தோஷம்" : "Rajju Dosha"}</span>}
                    {porutham.vedhaDosha && <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "0.625rem", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-sm)", background: "#F2D8CC", color: "var(--color-accent-strong)", border: "1px solid rgba(168,72,47,0.3)" }}><svg viewBox="0 0 24 24" fill="none" width="10" height="10" aria-hidden="true"><path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 9V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>{lang === "ta" ? "வேத தோஷம்" : "Vedha Dosha"}</span>}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.5 }}>
                  {lang === "ta" ? porutham.summary.ta : porutham.summary.en}
                </p>
                {porutham.contextNote && (
                  <p style={{ margin: "var(--space-1_5) 0 0", fontSize: "0.75rem", color: "var(--color-faint)", lineHeight: 1.4 }}>
                    {lang === "ta" ? porutham.contextNote.ta : porutham.contextNote.en}
                  </p>
                )}
              </div>
            </div>

            {/* Kuta breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
              {porutham.kutas.map((k) => {
                const kpct = k.maxScore > 0 ? k.score / k.maxScore : 0;
                return (
                  <div key={k.name} style={{ display: "flex", alignItems: "center", gap: "var(--space-2_5)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)" }}>
                    <p style={{ margin: 0, minWidth: "130px", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text)" }}>
                      {lang === "ta" ? k.nameTa : k.name}
                    </p>
                    <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "var(--color-border)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "3px", width: `${Math.round(kpct * 100)}%`, background: scoreColor(kpct) }} />
                    </div>
                    <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-strong)", minWidth: "36px", textAlign: "right" }}>
                      {k.score}/{k.maxScore}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Side-by-side kattam */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-3)" }}>
              <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-3)", background: "var(--color-surface-soft)" }}>
                <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-accent)", fontFamily: "var(--font-display)" }}>{chartA.birthProfile.displayName}</p>
                <RasiChart chart={chartA} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              </div>
              <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-3)", background: "var(--color-surface-soft)" }}>
                <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-accent-alt)", fontFamily: "var(--font-display)" }}>{chartB.birthProfile.displayName}</p>
                <RasiChart chart={chartB} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "0.625rem", color: "var(--color-faint)", fontStyle: "italic" }}>
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
