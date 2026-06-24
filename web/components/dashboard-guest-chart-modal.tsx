"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { MIN_BIRTH_DATE, maxBirthDateIso } from "@/lib/birth-date";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartCalculateResponseData } from "@/lib/types";
import { guestChartSchema, type GuestChartFormValues } from "@/lib/schemas";
import { ValidatedField, ValidatedInput } from "@/components/form/ValidatedField";
import { RasiChart, NavamsaChart } from "./dashboard-charts";
import { Field } from "./dashboard-ui";
import { PlaceCombobox } from "./place-combobox";
import "./dashboard-guest-chart-modal.css";

interface GuestChartModalProps {
  lang: Lang;
  onClose: () => void;
}

export function GuestChartModal({ lang, onClose }: GuestChartModalProps) {
  const [chart, setChart] = useState<ChartCalculateResponseData | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [view, setView] = useState<"D1" | "D9">("D1");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GuestChartFormValues>({
    resolver: zodResolver(guestChartSchema) as any,
    defaultValues: {
      displayName: "",
      birthDateLocal: "",
      birthTimeLocal: "12:00",
      birthPlace: "",
      birthLatitude: "",
      birthLongitude: "",
      birthTimezone: "Asia/Kolkata",
    },
  });

  const birthPlace = watch("birthPlace");

  async function onSubmit(values: GuestChartFormValues) {
    setSubmitError("");
    try {
      const chartRes = await apiFetchJson<{ success: boolean; data: ChartCalculateResponseData }>("/api/v1/public/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth: {
            displayName: values.displayName,
            birthDateLocal: values.birthDateLocal,
            birthTimeLocal: values.birthTimeLocal || null,
            birthPlace: values.birthPlace,
            birthLatitude: parseFloat(values.birthLatitude),
            birthLongitude: parseFloat(values.birthLongitude),
            birthTimezone: values.birthTimezone,
          },
        }),
      });
      setChart(chartRes.data);
    } catch (err) {
      setSubmitError(readErrorMessage(err));
    }
  }

  return (
    <div
      className="gcm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="gcm-panel">
        <div className="gcm-header">
          <h3 className="gcm-title">
            {lang === "ta" ? "யாரின் ஜாதகமும் காண்க" : "Generate Anyone's Chart"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="gcm-close"
          >
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form className="gcm-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="gcm-full-col">
            <ValidatedField
              id="displayName"
              label={lang === "ta" ? "பெயர்" : "Name"}
              error={errors.displayName?.message}
              required
            >
              <ValidatedInput
                id="displayName"
                error={!!errors.displayName}
                placeholder={lang === "ta" ? "எ.கா. ராமேஷ் குமார்" : "e.g. Ramesh Kumar"}
                {...register("displayName")}
              />
            </ValidatedField>
          </div>

          <ValidatedField
            id="birthDateLocal"
            label={lang === "ta" ? "பிறந்த தேதி" : "Birth Date"}
            error={errors.birthDateLocal?.message}
            required
          >
            <ValidatedInput
              id="birthDateLocal"
              type="date"
              min={MIN_BIRTH_DATE}
              max={maxBirthDateIso()}
              error={!!errors.birthDateLocal}
              {...register("birthDateLocal")}
            />
          </ValidatedField>

          <Field label={lang === "ta" ? "பிறந்த நேரம்" : "Birth Time"}>
            <input className="input" type="time" {...register("birthTimeLocal")} />
          </Field>

          <div className="gcm-full-col">
            <ValidatedField
              id="birthPlace"
              label={t("field_birth_place", lang)}
              helper={errors.birthLatitude?.message ?? t("field_place_helper", lang)}
              error={errors.birthPlace?.message}
              required
            >
              <PlaceCombobox
                value={birthPlace}
                onChange={(city, raw) => {
                  setValue("birthPlace", raw, { shouldValidate: true });
                  if (city) {
                    setValue("birthLatitude", city.lat, { shouldValidate: true });
                    setValue("birthLongitude", city.lng, { shouldValidate: true });
                    setValue("birthTimezone", city.timezone, { shouldValidate: true });
                  }
                }}
              />
            </ValidatedField>
          </div>

          <ValidatedField
            id="birthTimezone"
            label={t("field_timezone", lang)}
            helper={t("field_tz_helper", lang)}
            error={errors.birthTimezone?.message}
            required
          >
            <ValidatedInput
              id="birthTimezone"
              error={!!errors.birthTimezone}
              {...register("birthTimezone")}
            />
          </ValidatedField>

          <div className="gcm-coord-grid">
            <ValidatedField
              id="birthLatitude"
              label={t("field_latitude", lang)}
              error={errors.birthLatitude?.message}
              required
            >
              <ValidatedInput
                id="birthLatitude"
                inputMode="decimal"
                error={!!errors.birthLatitude}
                {...register("birthLatitude")}
              />
            </ValidatedField>
            <ValidatedField
              id="birthLongitude"
              label={t("field_longitude", lang)}
              error={errors.birthLongitude?.message}
              required
            >
              <ValidatedInput
                id="birthLongitude"
                inputMode="decimal"
                error={!!errors.birthLongitude}
                {...register("birthLongitude")}
              />
            </ValidatedField>
          </div>

          {submitError && (
            <p className="gcm-submit-error">{submitError}</p>
          )}

          <button type="submit" className="gcm-submit" disabled={isSubmitting}>
            {isSubmitting
              ? (lang === "ta" ? "கணக்கிடுகிறது…" : "Calculating…")
              : (lang === "ta" ? "ஜாதகம் காண்க" : "Generate Chart")}
          </button>
        </form>

        {chart && (
          <div className="gcm-chart-section">
            <div className="gcm-profile-card">
              <p className="gcm-profile-name">{chart.birthProfile.displayName}</p>
              <p className="gcm-profile-date">{chart.birthProfile.birthDateLocal}</p>
            </div>

            <div className="gcm-view-tabs">
              {(["D1", "D9"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className="gcm-view-tab"
                  data-active={view === v}
                  onClick={() => setView(v)}
                >
                  {v === "D1" ? t("label_d1", lang) : t("label_d9", lang)}
                </button>
              ))}
            </div>

            {view === "D1"
              ? <RasiChart chart={chart} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              : <NavamsaChart chart={chart} label={t("label_d9", lang)} lang={lang} showExplain={false} />
            }

            <p className="gcm-preview-note">
              {lang === "ta"
                ? "இந்த ஜாதகம் தற்காலிகமானது. மூடியதும் தானாக நீக்கப்படும்."
                : "Preview only. This chart is not saved to your account."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
