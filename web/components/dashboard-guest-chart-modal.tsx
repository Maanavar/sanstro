"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { MIN_BIRTH_DATE, isBirthDateWithinBounds, maxBirthDateIso } from "@/lib/birth-date";
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
  const tempBirthProfileIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"D1" | "D9">("D1");

  useEffect(() => {
    tempBirthProfileIdRef.current = tempBirthProfileId;
  }, [tempBirthProfileId]);

  useEffect(() => {
    return () => {
      const id = tempBirthProfileIdRef.current;
      if (!id) return;
      fetch(`/api/v1/birth-profiles/${id}`, { method: "DELETE", keepalive: true }).catch(() => {});
    };
  }, []);

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
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(26,22,18,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) void handleClose(); }}
    >
      <div style={{
        width: "min(520px, 100%)", maxHeight: "90vh", overflowY: "auto",
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)", padding: "var(--space-6)",
        display: "flex", flexDirection: "column", gap: "var(--space-4)",
        boxShadow: "0 24px 64px rgba(26,22,18,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--color-text-strong)", fontFamily: "var(--font-display)", fontWeight: 500 }}>
            {lang === "ta" ? "யாரின் ஜாதகமும் காண்க" : "Generate Anyone's Chart"}
          </h3>
          <button
            type="button"
            onClick={() => void handleClose()}
            aria-label="Close"
            style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={lang === "ta" ? "பெயர்" : "Name"}>
              <input className="input" value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder={lang === "ta" ? "எ.கா. ராமேஷ் குமார்" : "e.g. Ramesh Kumar"} />
            </Field>
          </div>

          <Field label={lang === "ta" ? "பிறந்த தேதி" : "Birth Date"}>
            <input
              className="input"
              type="date"
              value={form.birthDateLocal}
              min={MIN_BIRTH_DATE}
              max={maxBirthDateIso()}
              onChange={(e) => {
                const next = e.target.value;
                if (!isBirthDateWithinBounds(next)) return;
                setForm((f) => ({ ...f, birthDateLocal: next }));
              }}
            />
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", gridColumn: "1 / -1" }}>
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

        {error && <p style={{ margin: 0, color: "var(--color-score-low)", fontSize: "0.875rem" }}>{error}</p>}

        <button
          type="button"
          style={{
            alignSelf: "flex-start", padding: "var(--space-2) var(--space-5)",
            borderRadius: "var(--radius-pill)", border: "none",
            background: "var(--color-text-strong)", color: "var(--color-bg)",
            fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            opacity: loading ? 0.6 : 1,
          }}
          onClick={() => void handleGenerate()}
          disabled={loading}
        >
          {loading ? (lang === "ta" ? "கணக்கிடுகிறது…" : "Calculating…") : (lang === "ta" ? "ஜாதகம் காண்க" : "Generate Chart")}
        </button>

        {chart && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-md)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-accent)", fontFamily: "var(--font-display)" }}>{chart.birthProfile.displayName}</p>
              <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "0.75rem", color: "var(--color-faint)" }}>{chart.birthProfile.birthDateLocal}</p>
            </div>

            <div style={{ display: "flex", gap: "var(--space-1_5)" }}>
              {(["D1", "D9"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)}
                  style={{
                    padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)",
                    fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    border: view === v ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
                    background: view === v ? "#F0D9C4" : "transparent",
                    color: view === v ? "var(--color-accent)" : "var(--color-faint)",
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

            <p style={{ margin: 0, fontSize: "0.625rem", color: "var(--color-faint)", fontStyle: "italic" }}>
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
