"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { t, LANG_STORAGE_KEY } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartCalculateResponseData, DirectPoruthamData } from "@/lib/types";
import { RasiChart } from "@/components/dashboard-charts";
import { Field } from "@/components/dashboard-ui";
import { PlaceCombobox } from "@/components/place-combobox";

type PublicCompareResponse = { success: boolean; data: { chartA: ChartCalculateResponseData; chartB: ChartCalculateResponseData; porutham: DirectPoruthamData } };

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
  if (pct >= 0.7) return "var(--success)";
  if (pct >= 0.4) return "var(--warning)";
  return "var(--error)";
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", minWidth: "260px" }}>
      <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: accentColor }}>{label}</p>

      <Field label={lang === "ta" ? "பெயர்" : "Name"} required>
        <input className="input" value={form.displayName}
          onChange={(e) => onChange({ ...form, displayName: e.target.value })}
          placeholder={lang === "ta" ? "பெயர் உள்ளிடவும்" : "Enter name"} />
      </Field>

      <Field label={lang === "ta" ? "பிறந்த தேதி" : "Birth Date"} required>
        <input className="input" type="date" value={form.birthDateLocal}
          onChange={(e) => onChange({ ...form, birthDateLocal: e.target.value })} />
      </Field>

      <Field label={lang === "ta" ? "பிறந்த நேரம்" : "Birth Time"}>
        <input className="input" type="time" value={form.birthTimeLocal}
          onChange={(e) => onChange({ ...form, birthTimeLocal: e.target.value })} />
      </Field>

      <Field label={t("field_birth_place", lang)} helper={t("field_place_helper", lang)} required>
        <PlaceCombobox
          value={form.birthPlace}
          onChange={(city, raw) => onChange({
            ...form,
            birthPlace: raw,
            // Clear stale coordinates when the typed place no longer matches a known city,
            // so a hidden lat/long can never silently belong to a previous selection.
            ...(city
              ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone }
              : { birthLatitude: "", birthLongitude: "" }),
          })}
        />
      </Field>

      {!showAdvanced && form.birthLatitude && form.birthLongitude && (
        <p style={{ margin: "-4px 0 0", fontSize: "0.8rem", color: "var(--color-faint)" }}>
          {form.birthLatitude}°, {form.birthLongitude}° · {form.birthTimezone}
        </p>
      )}

      <button type="button" onClick={() => setShowAdvanced((s) => !s)}
        style={{ alignSelf: "flex-start", background: "transparent", border: "none", padding: 0, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-muted)", textDecoration: "underline" }}>
        {showAdvanced
          ? (lang === "ta" ? "கூடுதல் விவரங்களை மறை" : "Hide advanced options")
          : (lang === "ta" ? "கூடுதல் விவரங்கள் (ஆயத்தொலைவுகள், நேர மண்டலம்)" : "Advanced options (coordinates & timezone)")}
      </button>

      {showAdvanced && (
        <>
          <Field label={t("field_timezone", lang)} required>
            <input className="input" value={form.birthTimezone}
              onChange={(e) => onChange({ ...form, birthTimezone: e.target.value })} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "8px" }}>
            <Field label={t("field_latitude", lang)} required>
              <input className="input" inputMode="decimal" value={form.birthLatitude}
                onChange={(e) => onChange({ ...form, birthLatitude: e.target.value })} />
            </Field>
            <Field label={t("field_longitude", lang)} required>
              <input className="input" inputMode="decimal" value={form.birthLongitude}
                onChange={(e) => onChange({ ...form, birthLongitude: e.target.value })} />
            </Field>
          </div>
        </>
      )}
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
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
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


  function buildComparePayload() {
    const person = (f: BirthForm) => ({
      displayName: f.displayName,
      birthDateLocal: f.birthDateLocal,
      birthTimeLocal: f.birthTimeLocal || null,
      birthPlace: f.birthPlace,
      birthLatitude: parseFloat(f.birthLatitude),
      birthLongitude: parseFloat(f.birthLongitude),
      birthTimezone: f.birthTimezone,
    });
    return { personA: person(formA), personB: person(formB), compatibilityContext: compatCtx };
  }

  async function handleCompare() {
    const missingBasics = (f: BirthForm) => !f.displayName || !f.birthDateLocal || !f.birthPlace;
    const missingCoords = (f: BirthForm) => !f.birthLatitude || !f.birthLongitude || !f.birthTimezone;
    if (missingBasics(formA) || missingBasics(formB)) {
      setError(lang === "ta"
        ? "இரு நபர்களுக்கும் அனைத்து விவரங்களையும் நிரப்பவும்."
        : "Please fill all fields for both persons.");
      return;
    }
    if (missingCoords(formA) || missingCoords(formB)) {
      setError(lang === "ta"
        ? "பிறந்த இடத்தைப் பட்டியலிலிருந்து தேர்ந்தெடுக்கவும், அல்லது கூடுதல் விவரங்களில் ஆயத்தொலைவுகளை உள்ளிடவும்."
        : "Select the birth place from the list, or enter coordinates under Advanced options.");
      return;
    }
    setError("");
    setLoading(true);
    setPorutham(null); setChartA(null); setChartB(null);

    try {
      const result = await apiFetchJson<PublicCompareResponse>("/api/v1/public/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildComparePayload()),
      });
      setChartA(result.data.chartA);
      setChartB(result.data.chartB);
      setPorutham(result.data.porutham);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!porutham || !chartA || !chartB || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const response = await fetch(`/api/backend/api/v1/public/compare/pdf?lang=${lang}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-Vinaadi-CSRF": "1" },
        body: JSON.stringify(buildComparePayload()),
      });
      if (!response.ok) throw new Error(`${response.status}: PDF export failed`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `porutham_${chartA.birthProfile.displayName}_${chartB.birthProfile.displayName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(lang === "ta" ? "PDF பதிவிறக்கம் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "PDF download failed. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleBack() {
    router.back();
  }

  const pct = porutham ? porutham.totalScore / Math.max(1, porutham.maxScore) : 0;

  return (
    <div className="cd-shell" style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)", padding: "24px 16px" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="button" onClick={() => void handleBack()}
            style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--color-muted)", padding: "6px 12px", fontSize: "0.8rem", cursor: "pointer" }}>
            ← {lang === "ta" ? "திரும்பு" : "Back"}
          </button>
          <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "பொருத்தம் — எந்த இரு நபரும்" : "Compatibility — Any Two People"}
          </h1>
        </div>

        {/* Context selector */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg, 14px)", padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-muted)", textTransform: "uppercase", marginRight: "4px" }}>
              {lang === "ta" ? "வகை" : "Context"}
            </span>
            {(["GENERAL", "MARRIAGE", "FRIENDSHIP", "BUSINESS", "FAMILY"] as const).map((ctx) => (
              <button key={ctx} type="button" onClick={() => setCompatCtx(ctx)}
                style={{
                  padding: "4px 12px", borderRadius: "14px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                  border: compatCtx === ctx ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  background: compatCtx === ctx ? "var(--color-mid-bg)" : "transparent",
                  color: compatCtx === ctx ? "var(--color-accent)" : "var(--color-muted)",
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
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg, 14px)", padding: "20px", flex: 1, minWidth: "260px" }}>
            <PersonForm
              lang={lang}
              label={compatCtx === "MARRIAGE"
                ? (lang === "ta" ? "நபர் 1 (ஆண்)" : "Person 1 (Boy)")
                : (lang === "ta" ? "நபர் 1" : "Person 1")}
              accentColor="var(--color-accent)"
              form={formA}
              onChange={setFormA}
            />
          </div>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg, 14px)", padding: "20px", flex: 1, minWidth: "260px" }}>
            <PersonForm
              lang={lang}
              label={compatCtx === "MARRIAGE"
                ? (lang === "ta" ? "நபர் 2 (பெண்)" : "Person 2 (Girl)")
                : (lang === "ta" ? "நபர் 2" : "Person 2")}
              accentColor="var(--info)"
              form={formB}
              onChange={setFormB}
            />
          </div>
        </div>

        {error && <p style={{ margin: 0, color: "var(--error)", fontSize: "0.85rem" }}>{error}</p>}

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
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg, 14px)", padding: "20px", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {lang === "ta" ? "மொத்த பொருத்தம்" : "Total Score"}
                </p>
                <p style={{ margin: 0, fontSize: "2.4rem", fontWeight: 900, lineHeight: 1, color: scoreColor(pct) }}>
                  {porutham.totalScore}
                  <span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--color-muted)" }}>/{porutham.maxScore}</span>
                </p>
                <p style={{ margin: "3px 0 0", fontSize: "0.85rem", color: "var(--color-muted)" }}>
                  {porutham.label} · {porutham.percentage.toFixed(0)}%
                </p>
                {(porutham.rajjuDosha || porutham.vedhaDosha) && (
                  <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {porutham.rajjuDosha && <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: "var(--warning-subtle)", color: "var(--warning)", border: "1px solid var(--warning)" }}>⚠ {lang === "ta" ? "ராஜ்ஜு தோஷம்" : "Rajju Dosha"}</span>}
                    {porutham.vedhaDosha && <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: "var(--warning-subtle)", color: "var(--warning)", border: "1px solid var(--warning)" }}>⚠ {lang === "ta" ? "வேத தோஷம்" : "Vedha Dosha"}</span>}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text)", lineHeight: 1.6 }}>
                  {lang === "ta" ? porutham.summary.ta : porutham.summary.en}
                </p>
                {porutham.contextNote && (
                  <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
                    {lang === "ta" ? porutham.contextNote.ta : porutham.contextNote.en}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => void handleDownloadPdf()} disabled={downloadingPdf}
                style={{ alignSelf: "flex-start", flexShrink: 0, background: "transparent", border: "1px solid var(--color-accent)", borderRadius: "8px", color: "var(--color-text-accent)", padding: "8px 16px", fontSize: "0.8rem", fontWeight: 600, cursor: downloadingPdf ? "wait" : "pointer", opacity: downloadingPdf ? 0.6 : 1 }}>
                {downloadingPdf
                  ? (lang === "ta" ? "தயாராகிறது…" : "Preparing…")
                  : (lang === "ta" ? "⬇ PDF பதிவிறக்கு" : "⬇ Download PDF")}
              </button>
            </div>

            {/* Kuta breakdown */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg, 14px)", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {lang === "ta" ? "குட பொருத்தங்கள்" : "Kuta breakdown"}
              </p>
              {porutham.kutas.map((k) => {
                const kpct = k.maxScore > 0 ? k.score / k.maxScore : 0;
                return (
                  <div key={k.name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "7px", background: "var(--color-surface-3)", border: "1px solid var(--color-border)" }}>
                    <p style={{ margin: 0, minWidth: "140px", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text)" }}>
                      {lang === "ta" ? k.nameTa : k.name}
                    </p>
                    <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "var(--color-border)", opacity: 0.15, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "3px", width: `${Math.round(kpct * 100)}%`, background: scoreColor(kpct) }} />
                    </div>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "var(--color-muted)", minWidth: "40px", textAlign: "right" }}>
                      {k.score}/{k.maxScore}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Side-by-side kattam */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg, 14px)", padding: "14px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-accent-strong)" }}>{chartA.birthProfile.displayName}</p>
                <RasiChart chart={chartA} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              </div>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg, 14px)", padding: "14px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-accent-secondary)" }}>{chartB.birthProfile.displayName}</p>
                <RasiChart chart={chartB} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-faint)", fontStyle: "italic" }}>
              {lang === "ta"
                ? "இந்த ஜாதகங்கள் தற்காலிகமானவை. பக்கம் விட்டு சென்றதும் தானாக நீக்கப்படும்."
                : "Preview only. This comparison is not saved to your account."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
