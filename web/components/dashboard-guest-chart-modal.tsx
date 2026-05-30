"use client";

import { useState } from "react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, ChartCalculateResponseData } from "@/lib/types";
import { RasiChart, NavamsaChart } from "./dashboard-charts";
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

interface GuestChartModalProps {
  lang: Lang;
  onClose: () => void;
}

export function GuestChartModal({ lang, onClose }: GuestChartModalProps) {
  const [form, setForm] = useState<BirthForm>(EMPTY_FORM);
  const [chart, setChart] = useState<ChartCalculateResponseData | null>(null);
  const [tempBirthProfileId, setTempBirthProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"D1" | "D9">("D1");

  async function handleGenerate() {
    if (!form.displayName || !form.birthDateLocal || !form.birthPlace || !form.birthLatitude || !form.birthLongitude || !form.birthTimezone) {
      setError(lang === "ta" ? "அனைத்து தகவல்களையும் நிரப்பவும்." : "Please fill all required fields.");
      return;
    }
    setError("");
    setLoading(true);
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
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleClose() {
    if (tempBirthProfileId) {
      await apiFetchJson(`/api/v1/birth-profiles/${tempBirthProfileId}`, { method: "DELETE" }).catch(() => {});
    }
    onClose();
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) void handleClose(); }}
    >
      <div className="card" style={{ width: "min(520px, 100%)", maxHeight: "90vh", overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1rem" }}>
            {lang === "ta" ? "யாரின் ஜாதகமும் காண்க" : "Generate Anyone's Chart"}
          </h3>
          <button type="button" className="button button--ghost" onClick={() => void handleClose()}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={lang === "ta" ? "பெயர்" : "Name"}>
              <input className="input" value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder={lang === "ta" ? "எ.கா. ராமேஷ் குமார்" : "e.g. Ramesh Kumar"} />
            </Field>
          </div>

          <Field label={lang === "ta" ? "பிறந்த தேதி" : "Birth Date"}>
            <input className="input" type="date" value={form.birthDateLocal}
              onChange={(e) => setForm((f) => ({ ...f, birthDateLocal: e.target.value }))} />
          </Field>

          <Field label={lang === "ta" ? "பிறந்த நேரம்" : "Birth Time"}>
            <input className="input" type="time" value={form.birthTimeLocal}
              onChange={(e) => setForm((f) => ({ ...f, birthTimeLocal: e.target.value }))} />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
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
          </div>

          <Field label={t("field_timezone", lang)} helper={t("field_tz_helper", lang)}>
            <input className="input" value={form.birthTimezone}
              onChange={(e) => setForm((f) => ({ ...f, birthTimezone: e.target.value }))} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", gridColumn: "1 / -1" }}>
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

        {error && <p style={{ margin: 0, color: "#f87171", fontSize: "0.78rem" }}>{error}</p>}

        <button
          type="button"
          className="button button--primary"
          onClick={() => void handleGenerate()}
          disabled={loading}
          style={{ alignSelf: "flex-start" }}
        >
          {loading ? (lang === "ta" ? "கணக்கிடுகிறது…" : "Calculating…") : (lang === "ta" ? "ஜாதகம் காண்க" : "Generate Chart")}
        </button>

        {chart && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(229,184,77,0.08)", border: "1px solid rgba(229,184,77,0.2)" }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#e5b84d" }}>{chart.birthProfile.displayName}</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>{chart.birthProfile.birthDateLocal}</p>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              {(["D1", "D9"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)}
                  style={{
                    padding: "4px 12px", borderRadius: "14px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                    border: view === v ? "1px solid rgba(229,184,77,0.45)" : "1px solid rgba(255,255,255,0.12)",
                    background: view === v ? "rgba(229,184,77,0.12)" : "transparent",
                    color: view === v ? "#e5b84d" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {v === "D1" ? t("label_d1", lang) : t("label_d9", lang)}
                </button>
              ))}
            </div>

            {view === "D1"
              ? <RasiChart chart={chart} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              : <NavamsaChart chart={chart} label={t("label_d9", lang)} lang={lang} showExplain={false} />
            }

            <p style={{ margin: 0, fontSize: "0.68rem", color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>
              {lang === "ta"
                ? "இந்த ஜாதகம் தற்காலிகமானது. மூடியதும் தானாக நீக்கப்படும்."
                : "Temporary chart — auto-deleted when you close."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
