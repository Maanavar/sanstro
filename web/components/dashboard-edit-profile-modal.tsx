"use client";

import type { FormEvent } from "react";
import { MIN_BIRTH_DATE, maxBirthDateIso } from "@/lib/birth-date";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { useBirthProfileForm } from "@/hooks/useBirthProfileForm";
import { PlaceCombobox } from "./dashboard-ui";

type Relationship = "self" | "spouse" | "child" | "parent" | "sibling" | "grandparent" | "other";

export type BirthFormState = {
  ownerUserId: string;
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
  currentPlace: string;
  currentLatitude: string;
  currentLongitude: string;
  currentTimezone: string;
  relationshipToOwner: Relationship;
  calculateNow: boolean;
  maritalStatus: string;
  employmentType: string;
  birthTimeSource: string;
  birthTimeConfidenceMinutes: string;
};

interface EditProfileModalProps {
  lang: Lang;
  birthForm: BirthFormState;
  busySaving: boolean;
  isExistingProfile?: boolean;
  onClose: () => void;
  onChange: (next: BirthFormState) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onOpenRectification?: () => void;
  onDeleteProfile?: () => void;
}

/* ── Warm design tokens ── */
const W = {
  ink:      "#1A1612",
  inkMid:   "#3D352B",
  muted:    "#7A6F5E",
  mutedLt:  "var(--color-faint)",
  border:   "#D4C8AE",
  borderLt: "#E4DBC8",
  surface:  "#FAF5EA",
  surfaceMd:"#F4EEE2",
  card:     "#FFFFFF",
  terracota:"#B85A2C",
  sage:     "#5C7654",
  error:    "#A8482F",
} as const;

function WField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      {children}
    </div>
  );
}

function WInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: "10px",
        border: `1.5px solid ${W.borderLt}`,
        background: W.card, color: W.inkMid,
        fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
        ...(props.style ?? {}),
      }}
    />
  );
}

function WSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: "10px",
        border: `1.5px solid ${W.borderLt}`,
        background: W.card, color: W.inkMid,
        fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
        ...(props.style ?? {}),
      }}
    />
  );
}

export function EditProfileModal({
  lang, birthForm, busySaving, isExistingProfile,
  onClose, onChange, onSubmit, onOpenRectification, onDeleteProfile,
}: EditProfileModalProps) {
  const { nextBirthDateOrCurrent, applyPlaceSelection } = useBirthProfileForm();
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(26,22,18,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px", overflowY: "auto",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "min(580px, 100%)",
        background: W.surface,
        border: `1.5px solid ${W.borderLt}`,
        borderRadius: "20px",
        padding: "28px",
        display: "flex", flexDirection: "column", gap: "20px",
        boxShadow: "0 24px 64px rgba(26,22,18,0.18)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: W.terracota }}>
              {lang === "ta" ? "திருத்து" : "Edit"}
            </p>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: W.ink }}>{t("modal_edit_profile_title", lang)}</h3>
            <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: W.muted }}>{t("modal_edit_profile_sub", lang)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "32px", height: "32px", borderRadius: "50%",
              border: `1.5px solid ${W.border}`, background: "transparent",
              color: W.muted, fontSize: "1rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          aria-label="Close"><svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
        </div>

        {/* Form */}
        <form id="form-edit-profile" onSubmit={onSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <WField label={t("field_display_name", lang)}>
              <WInput value={birthForm.displayName}
                onChange={(e) => onChange({ ...birthForm, displayName: e.target.value })} />
            </WField>
            <WField label={t("field_relationship", lang)}>
              <WSelect value={birthForm.relationshipToOwner}
                onChange={(e) => onChange({ ...birthForm, relationshipToOwner: e.target.value as Relationship })}>
                <option value="self">{t("rel_self", lang)}</option>
                <option value="spouse">{t("rel_spouse", lang)}</option>
                <option value="child">{t("rel_child", lang)}</option>
                <option value="parent">{t("rel_parent", lang)}</option>
                <option value="sibling">{t("rel_sibling", lang)}</option>
                <option value="grandparent">{t("rel_grandparent", lang)}</option>
                <option value="other">{t("rel_other", lang)}</option>
              </WSelect>
            </WField>
            <WField label={t("field_birth_date", lang)}>
              <WInput type="date" value={birthForm.birthDateLocal} min={MIN_BIRTH_DATE} max={maxBirthDateIso()}
                onChange={(e) => {
                  onChange({
                    ...birthForm,
                    birthDateLocal: nextBirthDateOrCurrent(birthForm.birthDateLocal, e.target.value),
                  });
                }} />
            </WField>
            <WField label={t("field_birth_time", lang)}>
              <WInput type="time" step="1" value={birthForm.birthTimeLocal}
                onChange={(e) => onChange({ ...birthForm, birthTimeLocal: e.target.value })} />
              {onOpenRectification && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenRectification(); }}
                  style={{
                    background: "none", border: "none", padding: 0,
                    fontSize: "0.75rem", color: W.terracota,
                    textDecoration: "underline", cursor: "pointer",
                    fontFamily: "inherit", marginTop: "2px", textAlign: "left",
                  }}
                >
                  {lang === "ta" ? "பிறந்த நேரம் தெரியாதா? கண்டுபிடிக்கலாம்" : "Don't know your birth time? Find it"}
                </button>
              )}
            </WField>
            <WField label={t("field_birth_place", lang)}>
              <PlaceCombobox value={birthForm.birthPlace}
                onChange={(city, raw) => onChange(applyPlaceSelection(birthForm, city, raw))} />
            </WField>
            <WField label={t("field_timezone", lang)}>
              <WInput value={birthForm.birthTimezone}
                onChange={(e) => onChange({ ...birthForm, birthTimezone: e.target.value })} />
            </WField>
            <WField label={t("field_latitude", lang)}>
              <WInput inputMode="decimal" value={birthForm.birthLatitude}
                onChange={(e) => onChange({ ...birthForm, birthLatitude: e.target.value })} />
            </WField>
            <WField label={t("field_longitude", lang)}>
              <WInput inputMode="decimal" value={birthForm.birthLongitude}
                onChange={(e) => onChange({ ...birthForm, birthLongitude: e.target.value })} />
            </WField>
            <WField label={lang === "ta" ? "தினசரி நேரங்களுக்கான தற்போதைய நகரம்" : "Current City (Daily Timings)"}>
              <PlaceCombobox value={birthForm.currentPlace}
                onChange={(city, raw) => onChange({
                  ...birthForm,
                  currentPlace: raw,
                  ...(city ? { currentLatitude: city.lat, currentLongitude: city.lng, currentTimezone: city.timezone } : {}),
                })} />
            </WField>
            <WField label={lang === "ta" ? "தற்போதைய நேர மண்டலம்" : "Current Timezone"}>
              <WInput value={birthForm.currentTimezone}
                onChange={(e) => onChange({ ...birthForm, currentTimezone: e.target.value })} />
            </WField>
            <WField label={lang === "ta" ? "தற்போதைய அகலம்" : "Current Latitude"}>
              <WInput inputMode="decimal" value={birthForm.currentLatitude}
                onChange={(e) => onChange({ ...birthForm, currentLatitude: e.target.value })} />
            </WField>
            <WField label={lang === "ta" ? "தற்போதைய தீர்க்கரம்" : "Current Longitude"}>
              <WInput inputMode="decimal" value={birthForm.currentLongitude}
                onChange={(e) => onChange({ ...birthForm, currentLongitude: e.target.value })} />
            </WField>
            <WField label={t("field_marital_status", lang)}>
              <WSelect value={birthForm.maritalStatus}
                onChange={(e) => onChange({ ...birthForm, maritalStatus: e.target.value })}>
                <option value="">{t("marital_select", lang)}</option>
                <option value="single">{t("marital_single", lang)}</option>
                <option value="married">{t("marital_married", lang)}</option>
                <option value="divorced">{t("marital_divorced", lang)}</option>
                <option value="widowed">{t("marital_widowed", lang)}</option>
              </WSelect>
            </WField>
            <WField label={t("field_employment_type", lang)}>
              <WSelect value={birthForm.employmentType}
                onChange={(e) => onChange({ ...birthForm, employmentType: e.target.value })}>
                <option value="">{t("employment_select", lang)}</option>
                <option value="employed_salaried">{t("employment_salaried", lang)}</option>
                <option value="self_employed">{t("employment_self_employed", lang)}</option>
                <option value="business_owner">{t("employment_business", lang)}</option>
                <option value="student">{t("employment_student", lang)}</option>
                <option value="retired">{t("employment_retired", lang)}</option>
                <option value="homemaker">{t("employment_homemaker", lang)}</option>
                <option value="unemployed">{t("employment_unemployed", lang)}</option>
              </WSelect>
            </WField>
          </div>
        </form>

        {/* Footer */}
        <div style={{
          display: "flex", gap: "10px", alignItems: "center",
          paddingTop: "16px", borderTop: `1px solid ${W.borderLt}`,
        }}>
          {isExistingProfile && onDeleteProfile && (
            <button
              type="button"
              onClick={onDeleteProfile}
              disabled={busySaving}
              style={{
                marginRight: "auto", background: "transparent",
                border: `1.5px solid rgba(168,72,47,0.4)`,
                color: W.error, borderRadius: "8px",
                padding: "7px 14px", fontSize: "0.875rem",
                cursor: "pointer", fontFamily: "inherit",
                opacity: busySaving ? 0.5 : 1,
              }}
            >
              {t("btn_delete_profile", lang)}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 18px", borderRadius: "10px",
              border: `1.5px solid ${W.border}`, background: "transparent",
              color: W.muted, fontSize: "0.875rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t("btn_cancel", lang)}
          </button>
          <button
            type="button"
            onClick={() => (document.getElementById("form-edit-profile") as HTMLFormElement)?.requestSubmit()}
            disabled={busySaving}
            style={{
              padding: "8px 20px", borderRadius: "10px",
              border: `1.5px solid ${W.ink}`, background: W.ink,
              color: W.surfaceMd, fontSize: "0.875rem", fontWeight: 700,
              cursor: busySaving ? "not-allowed" : "pointer",
              opacity: busySaving ? 0.6 : 1, fontFamily: "inherit",
            }}
          >
            {busySaving ? t("btn_saving", lang) : t("btn_save_recalc", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
