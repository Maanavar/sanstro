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
import { ModalShell } from "./modal-shell";
import { PlaceCombobox } from "./place-combobox";
import "./dashboard-guest-chart-modal.css";

interface GuestChartModalProps {
  lang: Lang;
  onClose: () => void;
  onCreateAccount?: () => void;
}

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatBirthDate(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso;
  const [y, m, d] = parts;
  if (m < 1 || m > 12) return iso;
  return `${d} ${MONTHS_EN[m - 1]} ${y}`;
}

function formatBirthTime(hhmm: string | null): string | null {
  if (!hhmm) return null;
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function GuestChartModal({ lang, onClose, onCreateAccount }: GuestChartModalProps) {
  const [chart, setChart] = useState<ChartCalculateResponseData | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [view, setView] = useState<"D1" | "D9">("D1");
  const [showManualLocation, setShowManualLocation] = useState(false);

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

  const [birthPlace, birthLatitude, birthLongitude, birthTimezone] = watch([
    "birthPlace",
    "birthLatitude",
    "birthLongitude",
    "birthTimezone",
  ]);

  const locationResolved = birthLatitude !== "" && birthLongitude !== "";
  const hasLocationError = !!(errors.birthLatitude || errors.birthLongitude || errors.birthTimezone);
  const manualLocationOpen = showManualLocation || hasLocationError;

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

  const profileDate = chart ? formatBirthDate(chart.birthProfile.birthDateLocal) : "";
  const profileTime = chart ? formatBirthTime(chart.birthProfile.birthTimeLocal) : null;
  const profileInitial = chart ? chart.birthProfile.displayName.trim().charAt(0).toUpperCase() || "?" : "";

  return (
    <ModalShell
      label={lang === "ta" ? "யாரின் ஜாதகமும் காண்க" : "Generate Anyone's Chart"}
      onClose={onClose}
      overlayClassName="gcm-overlay"
      panelClassName="gcm-panel"
    >
        <div className="gcm-header">
          <div>
            <h3 className="gcm-title">
              {lang === "ta" ? "யாரின் ஜாதகமும் காண்க" : "Generate Anyone's Chart"}
            </h3>
            <p className="gcm-subtitle">
              {lang === "ta"
                ? "இலவச முன்னோட்ட ஜாதகம் — கணக்கு தேவையில்லை."
                : "A free preview chart for anyone — no account needed."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="gcm-close"
          >
            <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form className="gcm-form" onSubmit={handleSubmit(onSubmit)} noValidate>
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

          <div className="gcm-row-2">
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
          </div>

          <ValidatedField
            id="birthPlace"
            label={t("field_birth_place", lang)}
            helper={t("field_place_helper", lang)}
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

          {locationResolved && !manualLocationOpen ? (
            <p className="gcm-location-status">
              <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {lang === "ta" ? "இடம் கண்டறியப்பட்டது" : "Location detected"} · {birthTimezone}
              <button
                type="button"
                className="gcm-location-edit"
                onClick={() => setShowManualLocation(true)}
              >
                {lang === "ta" ? "மாற்ற" : "Edit"}
              </button>
            </p>
          ) : (
            <button
              type="button"
              className="gcm-location-manual-toggle"
              onClick={() => setShowManualLocation((v) => !v)}
              aria-expanded={manualLocationOpen}
            >
              {manualLocationOpen
                ? (lang === "ta" ? "தானியங்கு கண்டறிதலைப் பயன்படுத்த" : "Use auto-detect instead")
                : (lang === "ta" ? "நகரம் கிடைக்கவில்லையா? கைமுறையாக இடத்தை உள்ளிடவும்" : "Can't find your city? Enter location manually")}
            </button>
          )}

          {manualLocationOpen && (
            <div className="gcm-manual-location">
              <ValidatedField
                id="birthTimezone"
                label={t("field_timezone", lang)}
                helper={t("field_tz_helper", lang)}
                error={errors.birthTimezone?.message}
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
                >
                  <ValidatedInput
                    id="birthLongitude"
                    inputMode="decimal"
                    error={!!errors.birthLongitude}
                    {...register("birthLongitude")}
                  />
                </ValidatedField>
              </div>
            </div>
          )}

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
              <span className="gcm-profile-avatar" aria-hidden="true">{profileInitial}</span>
              <div>
                <p className="gcm-profile-name">{chart.birthProfile.displayName}</p>
                <p className="gcm-profile-date">
                  {profileDate}{profileTime ? ` · ${profileTime}` : ""}{chart.birthProfile.birthPlace ? ` · ${chart.birthProfile.birthPlace}` : ""}
                </p>
              </div>
            </div>

            <div className="gcm-view-tabs" role="tablist">
              {(["D1", "D9"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={view === v}
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
                : "Preview only — this chart isn't saved anywhere."}
            </p>

            <div className="gcm-cta-card">
              <p className="gcm-cta-text">
                {lang === "ta"
                  ? "இலவச கணக்கு உருவாக்கினால்: இந்த ஜாதகத்தை சேமிக்கலாம், தினசரி தனிப்பயன் வழிகாட்டுதலை பெறலாம், மேலும் குடும்ப உறுப்பினர்களை சேர்க்கலாம் — எப்போதும் இலவசம்."
                  : "Create a free account to save this chart, get daily personalised guidance, and add family members — free forever."}
              </p>
              <button
                type="button"
                className="gcm-cta-btn"
                onClick={onCreateAccount ?? onClose}
              >
                {lang === "ta" ? "இலவசக் கணக்கு உருவாக்க" : "Create free account"}
                <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}
    </ModalShell>
  );
}
