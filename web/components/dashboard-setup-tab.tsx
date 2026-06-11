"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { MIN_BIRTH_DATE, maxBirthDateIso } from "@/lib/birth-date";
import { useBirthProfileForm } from "@/hooks/useBirthProfileForm";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { FamilyVaultListItem, FamilyAggregateMember } from "@/lib/types";
import { PlaceCombobox } from "./place-combobox";
import { RectificationWizard } from "./dashboard-rectification-wizard";

type Relationship = "self" | "spouse" | "child" | "parent" | "sibling" | "grandparent" | "other";

const RELATIONSHIP_WEIGHTS: Record<Relationship, string> = {
  self: "1.00", spouse: "1.00", child: "0.75",
  parent: "1.15", sibling: "0.75", grandparent: "1.15", other: "1.00",
};

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

export type VaultFormState = {
  ownerUserId: string;
  name: string;
  defaultLanguage: string;
};

export type MemberFormState = {
  displayName: string;
  relationshipToOwner: Relationship;
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
  memberWeight: string;
  calculateNow: boolean;
};

type UserMode = "BEGINNER" | "BALANCED" | "TRADITIONAL";

interface DashboardSetupTabProps {
  lang: Lang;
  settingsSubTab: "setup" | "session";
  birthProfileId: string;
  selectedVaultId: string;
  selectedVault: FamilyVaultListItem | null;
  vaults: FamilyVaultListItem[];
  familyMembers?: FamilyAggregateMember[];
  birthForm: BirthFormState;
  vaultForm: VaultFormState;
  memberForm: MemberFormState;
  formErrors: Record<string, string>;
  busy: { createProfile: boolean; createVault: boolean; addMember: boolean };
  userMode?: UserMode;
  onSettingsSubTabChange: (sub: "setup" | "session") => void;
  onBirthFormChange: (next: BirthFormState) => void;
  onVaultFormChange: (next: VaultFormState) => void;
  onMemberFormChange: (next: MemberFormState) => void;
  onFormErrorChange: (patch: Record<string, string>) => void;
  onCreateProfile: (e: FormEvent<HTMLFormElement>) => void;
  onCreateVault: (e: FormEvent<HTMLFormElement>) => void;
  onAddMember: (e: FormEvent<HTMLFormElement>) => void;
  onSelectVault: (vaultId: string, ownerUserId: string) => void;
  onShowEditProfile: () => void;
  onEditMember?: (member: FamilyAggregateMember) => void;
  onGoToPersonal: () => void;
  onModeChange?: (mode: UserMode) => void;
}

/* ── Design tokens (warm, matching personal/family/life-areas) ── */
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
  accent:   "#8c3e18",
  sage:     "#5C7654",
  sageLt:   "rgba(92,118,84,0.15)",
  sageBorder:"rgba(92,118,84,0.35)",
  goldBorder:"rgba(184,90,44,0.35)",
  goldBg:   "rgba(184,90,44,0.07)",
  dimBorder:"rgba(212,200,174,0.5)",
} as const;

/* ── Shared primitives ── */

function WInput(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        width: "100%", padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-md)",
        border: `1.5px solid ${error ? "#A8482F" : W.borderLt}`,
        background: rest.readOnly ? W.surfaceMd : W.card,
        color: W.inkMid, fontSize: "0.875rem", fontFamily: "inherit",
        outline: "none", cursor: rest.readOnly ? "default" : undefined,
        ...style,
      }}
    />
  );
}

function WSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%", padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-md)",
        border: `1.5px solid ${W.borderLt}`,
        background: W.card,
        color: W.inkMid, fontSize: "0.875rem", fontFamily: "inherit",
        outline: "none",
        ...(props.style ?? {}),
      }}
    />
  );
}

function WField({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: "0.75rem", color: W.mutedLt, lineHeight: 1.4 }}>{hint}</span>}
      {error && <span style={{ fontSize: "0.75rem", color: "#A8482F", lineHeight: 1.4 }}>{error}</span>}
    </div>
  );
}

function StepBtn({
  onClick, disabled, busy, children,
}: { onClick: () => void; disabled?: boolean; busy?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      style={{
        padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontWeight: 700,
        cursor: disabled || busy ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        border: `1.5px solid ${W.ink}`,
        background: W.ink, color: W.surfaceMd,
        fontFamily: "inherit", whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontWeight: 600,
        cursor: "pointer",
        border: `1.5px solid ${W.border}`,
        background: "transparent", color: W.muted,
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

/* ── Avatar initial chip ── */
function Avatar({ name }: { name: string }) {
  const letter = (name || "?")[0]?.toUpperCase() ?? "?";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
      background: W.surfaceMd, border: `1.5px solid ${W.border}`,
      fontSize: "0.875rem", fontWeight: 700, color: W.muted,
    }}>
      {letter}
    </span>
  );
}

/* ── Status chip ── */
function StatusChip({ done, label }: { done: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "var(--space-1)",
      padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 700,
      background: done ? W.sageLt : W.goldBg,
      border: `1px solid ${done ? W.sageBorder : W.goldBorder}`,
      color: done ? W.sage : W.terracota,
    }}>
      {done && <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M5.5 12.5L10 17L18.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {label}
    </span>
  );
}

export function DashboardSetupTab({
  lang,
  settingsSubTab,
  birthProfileId,
  selectedVaultId,
  selectedVault,
  vaults,
  familyMembers = [],
  birthForm,
  vaultForm,
  memberForm,
  formErrors,
  busy,
  onSettingsSubTabChange,
  onBirthFormChange,
  onVaultFormChange,
  onMemberFormChange,
  onFormErrorChange,
  onCreateProfile,
  onCreateVault,
  onAddMember,
  onSelectVault,
  onShowEditProfile,
  onEditMember,
  onGoToPersonal,
  userMode = "BALANCED",
  onModeChange,
}: DashboardSetupTabProps) {
  const { nextBirthDateOrCurrent, applyPlaceSelection } = useBirthProfileForm();
  const setupStep: 1 | 2 | 3 = !birthProfileId ? 1 : !selectedVaultId ? 2 : 3;
  const setupComplete = !!birthProfileId && !!selectedVaultId;
  const [showRectWizard, setShowRectWizard] = useState(false);

  const steps = [
    {
      n: 1,
      label: lang === "ta" ? "உங்கள் ஜாதகம்" : "Your chart",
      sub: lang === "ta" ? "பெயர், தேதி, நேரம், இடம்" : "Birth details and place",
      done: !!birthProfileId,
    },
    {
      n: 2,
      label: lang === "ta" ? "குடும்ப கொட்டில்" : "Family vault",
      sub: lang === "ta" ? "உறுப்பினர்களை ஒரே இடத்தில்" : "Group members under one roof",
      done: !!selectedVaultId,
    },
    {
      n: 3,
      label: lang === "ta" ? "உறுப்பினரை சேர்" : "Add member",
      sub: lang === "ta" ? "மனைவி, குழந்தை…" : "Add chart for spouse, child…",
      done: setupComplete && (selectedVault?.memberCount ?? 0) > 1,
    },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "var(--space-8)",
      fontFamily: "var(--font-body)",
      color: W.ink,
    }}>

      {/* ── Settings sub-tab switcher ── */}
      <div style={{ display: "flex", gap: "var(--space-1_5)" }}>
        {([
          { key: "setup",   label: lang === "ta" ? "ஆரம்ப நிலை" : "Onboarding" },
          { key: "session", label: lang === "ta" ? "அமைப்புகள்" : "Settings" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSettingsSubTabChange(key)}
            style={{
              padding: "var(--space-2) var(--space-4_5)", borderRadius: "var(--radius-pill)", fontSize: "0.875rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              border: "1.5px solid",
              borderColor: settingsSubTab === key ? W.ink : W.border,
              background: settingsSubTab === key ? W.ink : "transparent",
              color: settingsSubTab === key ? W.surfaceMd : W.muted,
              transition: "all 0.12s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Breadcrumb ── */}
      <p style={{ margin: "-20px 0 0", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: W.terracota }}>
        {lang === "ta" ? "அமைப்புகள் · ஆரம்ப நிலை" : "Settings · Onboarding"}
      </p>

      {/* ── Hero headline ── */}
      <h1 style={{
        margin: "-20px 0 0",
        fontFamily: "var(--font-display)",
        fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
        fontWeight: 500,
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
        color: W.ink,
      }}>
        {lang === "ta"
          ? "மூன்று அமைதியான படிகள். பிறகு நாங்கள் படிக்கிறோம்."
          : "Three quiet steps. Then we read for you."}
      </h1>

      {/* ── Step stepper ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0" }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "flex-start", flex: i < 2 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1_5)", minWidth: "80px" }}>
              {/* Circle */}
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.875rem", fontWeight: 700,
                background: s.done ? W.sage : setupStep === s.n ? W.ink : W.surfaceMd,
                border: `2px solid ${s.done ? W.sage : setupStep === s.n ? W.ink : W.border}`,
                color: s.done || setupStep === s.n ? W.surfaceMd : W.muted,
              }}>
                {s.done
                  ? <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden="true"><path d="M5.5 12.5L10 17L18.5 8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : s.n}
              </div>
              {/* Label */}
              <span style={{
                fontSize: "0.75rem", fontWeight: 600, textAlign: "center", lineHeight: 1.3,
                color: s.done ? W.sage : setupStep === s.n ? W.ink : W.muted,
              }}>
                {s.label}
              </span>
              <span style={{ fontSize: "0.625rem", color: W.mutedLt, textAlign: "center", lineHeight: 1.3 }}>
                {s.sub}
              </span>
            </div>
            {/* Connector line */}
            {i < 2 && (
              <div style={{
                flex: 1, height: "2px", marginTop: "17px", marginLeft: "var(--space-1)", marginRight: "var(--space-1)",
                background: s.done ? W.sage : W.borderLt,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step cards row (Step 1 + Step 2 side by side when both active/done) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "var(--space-4)" }}>

        {/* Step 1 — Birth chart card */}
        <div style={{
          background: W.surface,
          border: `1.5px solid ${birthProfileId ? W.sage : setupStep === 1 ? W.terracota : W.borderLt}`,
          borderRadius: "var(--radius-md)",
          padding: "var(--space-6)",
          display: "flex", flexDirection: "column", gap: "var(--space-4)",
          opacity: setupStep < 1 ? 0.5 : 1,
        }}>
          {/* Card header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
              <StatusChip done={!!birthProfileId} label={birthProfileId
                ? (lang === "ta" ? "உருவாக்கப்பட்டது" : "Created")
                : (lang === "ta" ? "தேவை" : "Required")} />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: W.ink }}>
                {lang === "ta" ? "உங்கள் பிறந்த விவரங்கள்" : "Your birth details"}
              </h3>
              <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted }}>
                {lang === "ta" ? "பெயர், தேதி, நேரம் மற்றும் இடம்" : "Name, date, time and place"}
              </p>
            </div>
            {birthProfileId && (
              <GhostBtn onClick={onShowEditProfile}>{lang === "ta" ? "திருத்து" : "Edit"}</GhostBtn>
            )}
          </div>

          {/* Summary grid when done */}
          {birthProfileId && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "var(--space-3) var(--space-6)",
              padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)",
              background: W.surfaceMd, border: `1px solid ${W.borderLt}`,
            }}>
              {[
                { lbl: lang === "ta" ? "பெயர்" : "NAME", val: birthForm.displayName },
                { lbl: lang === "ta" ? "உறவு" : "RELATIONSHIP", val: birthForm.relationshipToOwner },
                { lbl: lang === "ta" ? "பிறந்த தேதி" : "BIRTH DATE", val: birthForm.birthDateLocal },
                { lbl: lang === "ta" ? "பிறந்த நேரம்" : "BIRTH TIME", val: birthForm.birthTimeLocal || "—" },
                { lbl: lang === "ta" ? "பிறந்த இடம்" : "BIRTH PLACE", val: birthForm.birthPlace },
                { lbl: lang === "ta" ? "நேர மண்டலம்" : "TIMEZONE", val: birthForm.birthTimezone },
              ].map(({ lbl, val }) => (
                <div key={lbl}>
                  <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.07em" }}>{lbl}</p>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: W.inkMid, fontWeight: 500 }}>{val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Form — shown when not yet created */}
          {!birthProfileId && (
            <form id="form-profile" onSubmit={onCreateProfile} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "var(--space-3)" }}>
                <WField label={t("field_name", lang)} error={formErrors.displayName}>
                  <WInput
                    value={birthForm.displayName} error={!!formErrors.displayName}
                    onChange={(e) => { onBirthFormChange({ ...birthForm, displayName: e.target.value }); onFormErrorChange({ displayName: "" }); }}
                  />
                </WField>
                <WField label={t("field_relationship", lang)}>
                  <WSelect value={birthForm.relationshipToOwner}
                    onChange={(e) => onBirthFormChange({ ...birthForm, relationshipToOwner: e.target.value as Relationship })}>
                    <option value="self">{t("rel_self", lang)}</option>
                    <option value="spouse">{t("rel_spouse", lang)}</option>
                    <option value="child">{t("rel_child", lang)}</option>
                    <option value="parent">{t("rel_parent", lang)}</option>
                    <option value="sibling">{t("rel_sibling", lang)}</option>
                    <option value="grandparent">{t("rel_grandparent", lang)}</option>
                    <option value="other">{t("rel_other", lang)}</option>
                  </WSelect>
                </WField>
                <WField label={t("field_birth_date", lang)} error={formErrors.birthDateLocal}>
                  <WInput type="date" value={birthForm.birthDateLocal} error={!!formErrors.birthDateLocal} min={MIN_BIRTH_DATE} max={maxBirthDateIso()}
                    onChange={(e) => {
                        onBirthFormChange({
                          ...birthForm,
                          birthDateLocal: nextBirthDateOrCurrent(birthForm.birthDateLocal, e.target.value),
                        });
                      onFormErrorChange({ birthDateLocal: "" });
                    }}
                  />
                </WField>
                <WField label={t("field_birth_time", lang)} hint={t("field_time_optional", lang)}>
                  <WInput type="time" step="1" value={birthForm.birthTimeLocal}
                    onChange={(e) => onBirthFormChange({ ...birthForm, birthTimeLocal: e.target.value })} />
                </WField>
                <WField label={lang === "ta" ? "பிறந்த நேர மூலம்" : "Birth Time Source"}>
                  <WSelect value={birthForm.birthTimeSource}
                    onChange={(e) => {
                      const src = e.target.value;
                      const conf = src === "hospital_record" ? "5" : src === "family_memory" ? "15" : src === "elder_told" ? "30" : src === "approximate" ? "60" : "0";
                      onBirthFormChange({ ...birthForm, birthTimeSource: src, birthTimeConfidenceMinutes: conf });
                    }}>
                    <option value="unknown">{lang === "ta" ? "தெரியாது" : "Unknown"}</option>
                    <option value="hospital_record">{lang === "ta" ? "மருத்துவமனை பதிவு" : "Hospital Record (±5 min)"}</option>
                    <option value="family_memory">{lang === "ta" ? "குடும்ப நினைவு" : "Family Memory (±15 min)"}</option>
                    <option value="elder_told">{lang === "ta" ? "பெரியவர் சொன்னது" : "Elder's Account (±30 min)"}</option>
                    <option value="approximate">{lang === "ta" ? "தோராயம்" : "Approximate (±1 hr)"}</option>
                  </WSelect>
                </WField>
                <WField label={t("field_birth_place", lang)} hint={t("field_place_helper", lang)} error={formErrors.birthPlace}>
                  <PlaceCombobox value={birthForm.birthPlace}
                    onChange={(city, raw) => {
                      onBirthFormChange(applyPlaceSelection(birthForm, city, raw));
                      onFormErrorChange({ birthPlace: "", birthTimezone: "" });
                    }} />
                </WField>
                <WField label={t("field_timezone", lang)} hint={t("field_tz_helper", lang)} error={formErrors.birthTimezone}>
                  <WInput value={birthForm.birthTimezone} error={!!formErrors.birthTimezone}
                    onChange={(e) => { onBirthFormChange({ ...birthForm, birthTimezone: e.target.value }); onFormErrorChange({ birthTimezone: "" }); }} />
                </WField>
                <WField label={t("field_latitude", lang)} error={formErrors.birthLatitude}>
                  <WInput inputMode="decimal" value={birthForm.birthLatitude} error={!!formErrors.birthLatitude}
                    onChange={(e) => { onBirthFormChange({ ...birthForm, birthLatitude: e.target.value }); onFormErrorChange({ birthLatitude: "" }); }} />
                </WField>
                <WField label={t("field_longitude", lang)} error={formErrors.birthLongitude}>
                  <WInput inputMode="decimal" value={birthForm.birthLongitude} error={!!formErrors.birthLongitude}
                    onChange={(e) => { onBirthFormChange({ ...birthForm, birthLongitude: e.target.value }); onFormErrorChange({ birthLongitude: "" }); }} />
                </WField>
                <WField label={lang === "ta" ? "திருமண நிலை" : "Marital Status"}>
                  <WSelect value={birthForm.maritalStatus}
                    onChange={(e) => onBirthFormChange({ ...birthForm, maritalStatus: e.target.value })}>
                    <option value="">{lang === "ta" ? "தேர்ந்தெடுக்கவும்" : "Select…"}</option>
                    <option value="single">{lang === "ta" ? "திருமணமாகாதவர்" : "Single / Unmarried"}</option>
                    <option value="married">{lang === "ta" ? "திருமணமானவர்" : "Married"}</option>
                    <option value="divorced">{lang === "ta" ? "விவாகரத்து" : "Divorced"}</option>
                    <option value="widowed">{lang === "ta" ? "விதவை / விதவைர்" : "Widowed"}</option>
                  </WSelect>
                </WField>
                <WField label={lang === "ta" ? "தொழில் வகை" : "Employment Type"}>
                  <WSelect value={birthForm.employmentType}
                    onChange={(e) => onBirthFormChange({ ...birthForm, employmentType: e.target.value })}>
                    <option value="">{lang === "ta" ? "தேர்ந்தெடுக்கவும்" : "Select…"}</option>
                    <option value="employed_salaried">{lang === "ta" ? "சம்பளதாரர்" : "Salaried Employee"}</option>
                    <option value="self_employed">{lang === "ta" ? "சுயதொழில்" : "Self-Employed / Freelancer"}</option>
                    <option value="business_owner">{lang === "ta" ? "சொந்த தொழில்" : "Business Owner"}</option>
                    <option value="student">{lang === "ta" ? "மாணவர்" : "Student"}</option>
                    <option value="unemployed">{lang === "ta" ? "வேலையில்லாதவர்" : "Unemployed / Seeking"}</option>
                    <option value="retired">{lang === "ta" ? "ஓய்வு பெற்றவர்" : "Retired"}</option>
                    <option value="homemaker">{lang === "ta" ? "இல்லத்தரசி / இல்லத்தரசர்" : "Homemaker"}</option>
                  </WSelect>
                </WField>
              </div>

              {/* Calculate toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "0.875rem", color: W.muted }}>
                <input type="checkbox" checked={birthForm.calculateNow}
                  onChange={(e) => onBirthFormChange({ ...birthForm, calculateNow: e.target.checked })} />
                {t("setup_calc_now", lang)}
                <span style={{ fontSize: "0.625rem", color: W.mutedLt }}>{t("setup_required", lang)}</span>
              </label>

              {/* Submit */}
              <div style={{ paddingTop: "var(--space-1)" }}>
                <StepBtn onClick={() => (document.getElementById("form-profile") as HTMLFormElement)?.requestSubmit()} busy={busy.createProfile}>
                  {busy.createProfile ? t("setup_step1_creating", lang) : t("setup_step1_create", lang)}
                </StepBtn>
              </div>
            </form>
          )}

          {/* Rectification link */}
          {birthProfileId && (
            <button
              type="button"
              onClick={() => setShowRectWizard(true)}
              style={{
                alignSelf: "flex-start", background: "none", border: "none", padding: 0,
                fontSize: "0.75rem", color: W.terracota, textDecoration: "underline", cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {lang === "ta" ? "பிறந்த நேரம் தெரியாதா? கண்டுபிடிக்கலாம்" : "Don't know your birth time? Find it"}
            </button>
          )}

          {/* Go to personal */}
          {birthProfileId && (
            <div style={{ paddingTop: "var(--space-1)" }}>
              <StepBtn onClick={onGoToPersonal}>{t("setup_step1_goto_personal", lang)}</StepBtn>
            </div>
          )}
        </div>

        {/* Step 2 — Family vault card */}
        <div style={{
          background: W.surface,
          border: `1.5px solid ${selectedVaultId ? W.sage : setupStep === 2 ? W.terracota : W.borderLt}`,
          borderRadius: "var(--radius-md)",
          padding: "var(--space-6)",
          display: "flex", flexDirection: "column", gap: "var(--space-4)",
          opacity: setupStep < 2 ? 0.45 : 1,
          pointerEvents: setupStep < 2 ? "none" : undefined,
        }}>
          {/* Card header — vault name updates live from vaultForm.name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
            <StatusChip done={!!selectedVaultId} label={selectedVaultId
              ? (lang === "ta" ? "கொட்டில் உள்ளது" : "Vault exists")
              : (lang === "ta" ? "தேவை" : "Required")} />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: W.ink }}>
              {/* Show live-typed name while editing, or saved vault name, or fallback */}
              {vaultForm.name || selectedVault?.name || (lang === "ta" ? "குடும்ப கொட்டில்" : "Family vault")}
            </h3>
            <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted }}>
              {familyMembers.length > 0
                ? `${familyMembers.length} ${t("members_label_pl", lang)} · ${selectedVault?.defaultLanguage ?? vaultForm.defaultLanguage}`
                : (lang === "ta" ? "உறுப்பினர்களை ஒரே கூரையின் கீழ் சேர்" : "Group members under one roof")}
            </p>
          </div>

          {/* Real members list from familyAggregate */}
          {familyMembers.length > 0 && (
            <div style={{
              border: `1.5px solid ${W.borderLt}`, borderRadius: "var(--radius-md)",
              overflow: "hidden", background: W.card,
            }}>
              {familyMembers.map((member, idx) => {
                const isOwner = member.birthProfileId === birthProfileId;
                return (
                  <div
                    key={member.familyMemberId}
                    style={{
                      padding: "var(--space-3) var(--space-4)",
                      borderBottom: idx < familyMembers.length - 1 ? `1px solid ${W.borderLt}` : undefined,
                      display: "flex", alignItems: "center", gap: "var(--space-2_5)",
                    }}
                  >
                    <Avatar name={member.displayName} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: W.ink }}>{member.displayName}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted }}>
                        {member.label} · {lang === "ta" ? "எடை" : "weight"} {member.memberWeight.toFixed(2)}
                      </p>
                    </div>
                    {isOwner ? (
                      <GhostBtn onClick={onShowEditProfile}>{lang === "ta" ? "திருத்து" : "Edit"}</GhostBtn>
                    ) : (
                      onEditMember && (
                        <GhostBtn onClick={() => onEditMember(member)}>{lang === "ta" ? "திருத்து" : "Edit"}</GhostBtn>
                      )
                    )}
                  </div>
                );
              })}
              {/* Add a member footer row */}
              <button
                type="button"
                onClick={() => (document.getElementById("form-member") as HTMLFormElement | null)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                style={{
                  width: "100%", padding: "var(--space-3) var(--space-4)",
                  border: "none", borderTop: `1px solid ${W.borderLt}`,
                  background: "transparent",
                  color: W.terracota, fontSize: "0.875rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                }}
              >
                + {lang === "ta" ? "உறுப்பினரை சேர்" : "Add a member"}
              </button>
            </div>
          )}

          {/* Vault creation / rename form */}
          <form id="form-vault" onSubmit={onCreateVault} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "var(--space-3)" }}>
              <WField label={t("field_vault_name", lang)}>
                <WInput value={vaultForm.name} placeholder="எ.கா. Murugan Family"
                  onChange={(e) => onVaultFormChange({ ...vaultForm, name: e.target.value })} />
              </WField>
              <WField label={t("field_language", lang)}>
                <WSelect value={vaultForm.defaultLanguage}
                  onChange={(e) => onVaultFormChange({ ...vaultForm, defaultLanguage: e.target.value })}>
                  <option value="ta-en">{t("lang_ta_en", lang)}</option>
                  <option value="ta">{t("lang_ta", lang)}</option>
                  <option value="en">{t("lang_en", lang)}</option>
                </WSelect>
              </WField>
            </div>
            {!selectedVaultId && (
              <StepBtn onClick={() => (document.getElementById("form-vault") as HTMLFormElement)?.requestSubmit()} busy={busy.createVault} disabled={setupStep < 2}>
                {busy.createVault ? t("setup_step2_creating", lang) : t("setup_step2_create", lang)}
              </StepBtn>
            )}
          </form>

        </div>
      </div>

      {/* ── Step 3 — Add family member (separate card, outside vault card) ── */}
      {selectedVaultId && (
        <div style={{
          background: W.surface,
          border: `1.5px solid ${(selectedVault?.memberCount ?? 0) > 1 ? W.sage : setupStep === 3 ? W.terracota : W.borderLt}`,
          borderRadius: "var(--radius-md)",
          padding: "var(--space-6)",
          display: "flex", flexDirection: "column", gap: "var(--space-4)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
              <StatusChip done={(selectedVault?.memberCount ?? 0) > 1} label={(selectedVault?.memberCount ?? 0) > 1
                ? (lang === "ta" ? "சேர்க்கப்பட்டது" : "Members added")
                : (lang === "ta" ? "தேவை" : "Required")} />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: W.ink }}>
                {lang === "ta" ? "குடும்ப உறுப்பினரை சேர்" : "Add a family member"}
              </h3>
              <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted }}>
                {lang === "ta"
                  ? "மனைவி, பெற்றோர், குழந்தை — அவர்களின் ஜாதகம் மட்டும் கொடுங்கள். கொட்டில் விவரங்கள் தனியே உள்ளன."
                  : "Add spouse, parent, child, etc. — only their birth details needed here. Vault settings are separate above."}
              </p>
            </div>
          </div>

          <form id="form-member" onSubmit={onAddMember} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "var(--space-3)" }}>
              <WField label={t("field_name", lang)} error={formErrors.memberDisplayName}>
                <WInput value={memberForm.displayName} error={!!formErrors.memberDisplayName}
                  onChange={(e) => { onMemberFormChange({ ...memberForm, displayName: e.target.value }); onFormErrorChange({ memberDisplayName: "" }); }} />
              </WField>
              <WField label={t("field_relationship", lang)}>
                <WSelect value={memberForm.relationshipToOwner}
                  onChange={(e) => {
                    const rel = e.target.value as Relationship;
                    onMemberFormChange({ ...memberForm, relationshipToOwner: rel, memberWeight: RELATIONSHIP_WEIGHTS[rel] });
                  }}>
                  <option value="self">{t("rel_self", lang)}</option>
                  <option value="spouse">{t("rel_spouse", lang)}</option>
                  <option value="child">{t("rel_child", lang)}</option>
                  <option value="parent">{t("rel_parent", lang)}</option>
                  <option value="sibling">{t("rel_sibling", lang)}</option>
                  <option value="grandparent">{t("rel_grandparent", lang)}</option>
                  <option value="other">{t("rel_other", lang)}</option>
                </WSelect>
              </WField>
              <WField label={t("field_birth_date", lang)} error={formErrors.memberBirthDate}>
                <WInput type="date" value={memberForm.birthDateLocal} error={!!formErrors.memberBirthDate} min={MIN_BIRTH_DATE} max={maxBirthDateIso()}
                  onChange={(e) => {
                    onMemberFormChange({
                      ...memberForm,
                      birthDateLocal: nextBirthDateOrCurrent(memberForm.birthDateLocal, e.target.value),
                    });
                    onFormErrorChange({ memberBirthDate: "" });
                  }} />
              </WField>
              <WField label={t("field_birth_time", lang)} hint={t("field_time_optional", lang)}>
                <WInput type="time" step="1" value={memberForm.birthTimeLocal}
                  onChange={(e) => onMemberFormChange({ ...memberForm, birthTimeLocal: e.target.value })} />
              </WField>
              <WField label={t("field_birth_place", lang)} error={formErrors.memberBirthPlace}>
                <PlaceCombobox value={memberForm.birthPlace}
                  onChange={(city, raw) => {
                    onMemberFormChange(applyPlaceSelection(memberForm, city, raw));
                    onFormErrorChange({ memberBirthPlace: "", memberTimezone: "" });
                  }} />
              </WField>
              <WField label={t("field_timezone", lang)} error={formErrors.memberTimezone}>
                <WInput value={memberForm.birthTimezone} error={!!formErrors.memberTimezone}
                  onChange={(e) => { onMemberFormChange({ ...memberForm, birthTimezone: e.target.value }); onFormErrorChange({ memberTimezone: "" }); }} />
              </WField>
              <WField label={t("field_latitude", lang)}>
                <WInput inputMode="decimal" value={memberForm.birthLatitude}
                  onChange={(e) => onMemberFormChange({ ...memberForm, birthLatitude: e.target.value })} />
              </WField>
              <WField label={t("field_longitude", lang)}>
                <WInput inputMode="decimal" value={memberForm.birthLongitude}
                  onChange={(e) => onMemberFormChange({ ...memberForm, birthLongitude: e.target.value })} />
              </WField>
              <WField
                label={t("field_weight", lang)}
                hint={lang === "ta"
                  ? "குடும்ப ஒட்டுமொத்த மதிப்பெண்ணில் இந்த உறுப்பினரின் தாக்கம். 1.15 = முக்கிய ஆதரவு (பெற்றோர்); 1.00 = சம நிலை (மனைவி); 0.75 = குறைந்த ஆதரவு (குழந்தை, உடன்பிறந்தவர்)."
                  : "How much this member influences the family aggregate score. 1.15 = strong support role (parent/grandparent); 1.00 = equal partner (spouse); 0.75 = supported member (child, sibling)."}>
                <WInput inputMode="decimal" value={memberForm.memberWeight}
                  onChange={(e) => onMemberFormChange({ ...memberForm, memberWeight: e.target.value })} />
              </WField>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "0.875rem", color: W.muted }}>
              <input type="checkbox" checked={memberForm.calculateNow}
                onChange={(e) => onMemberFormChange({ ...memberForm, calculateNow: e.target.checked })} />
              {t("setup_calc_now", lang)}
            </label>
            <StepBtn onClick={() => (document.getElementById("form-member") as HTMLFormElement)?.requestSubmit()} busy={busy.addMember}>
              {busy.addMember ? t("setup_step3_adding", lang) : t("setup_step3_add", lang)}
            </StepBtn>
          </form>
        </div>
      )}

      {/* ── All done banner ── */}
      {setupComplete && (selectedVault?.memberCount ?? 0) > 1 && (
        <div style={{
          padding: "var(--space-4_5) var(--space-6)", borderRadius: "var(--radius-md)",
          background: W.sageLt, border: `1.5px solid ${W.sageBorder}`,
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)",
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ margin: "0 0 var(--space-0_5)", fontWeight: 700, color: W.sage, fontSize: "0.875rem" }}>{t("setup_done_title", lang)}</p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted }}>
              {birthForm.displayName} · {selectedVault?.name} · {selectedVault?.memberCount} {t("members_label_pl", lang)}
            </p>
          </div>
          <StepBtn onClick={onGoToPersonal}>{t("setup_done_goto", lang)}</StepBtn>
        </div>
      )}

      {/* ── Experience depth picker (post-setup) ── */}
      {setupComplete && onModeChange && (
        <div style={{
          background: W.surface, border: `1.5px solid ${W.borderLt}`,
          borderRadius: "var(--radius-md)", padding: "var(--space-6)",
          display: "flex", flexDirection: "column", gap: "var(--space-4)",
        }}>
          <div>
            <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: W.terracota }}>
              {lang === "ta" ? "கட்டுமான ஆழம்" : "Experience depth"}
            </p>
            <h3 style={{ margin: "0 0 var(--space-1)", color: W.ink }}>{lang === "ta" ? "உங்கள் அனுபவ நிலை தேர்ந்தெடுங்கள்" : "Choose your experience level"}</h3>
            <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted }}>
              {lang === "ta" ? "இதை பின்னர் அமைப்புகளில் மாற்றலாம்." : "You can change this later in Settings."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2_5)", flexWrap: "wrap" }}>
            {(["BEGINNER", "BALANCED", "TRADITIONAL"] as UserMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onModeChange(m)}
                style={{
                  flex: "1 1 140px", padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)",
                  textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                  border: `1.5px solid ${userMode === m ? W.ink : W.border}`,
                  background: userMode === m ? W.ink : "transparent",
                  color: userMode === m ? W.surfaceMd : W.muted,
                  transition: "all 0.12s",
                }}
              >
                <p style={{ margin: "0 0 var(--space-0_5)", fontWeight: 700, fontSize: "0.875rem" }}>
                  {m === "BEGINNER" ? (lang === "ta" ? "ஆரம்பநிலை" : "Beginner") :
                   m === "BALANCED" ? (lang === "ta" ? "சமநிலை" : "Balanced") :
                   lang === "ta" ? "பாரம்பரியம்" : "Traditional"}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.7 }}>
                  {m === "BEGINNER" ? (lang === "ta" ? "எளிய மொழி, ஜோதிட சொற்கள் இல்லை" : "Plain language, no jargon") :
                   m === "BALANCED" ? (lang === "ta" ? "சமநிலை கலவை" : "Balanced mix") :
                   lang === "ta" ? "முழு ஜோதிட சொற்களஞ்சியம்" : "Full Jyothidam vocabulary"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div style={{
        borderRadius: "var(--radius-md)", border: `1px solid ${W.borderLt}`,
        background: W.surfaceMd, padding: "var(--space-4) var(--space-5)",
        display: "flex", flexDirection: "column", gap: "var(--space-1_5)",
      }}>
        <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt, lineHeight: 1.6 }}>{t("disclaimer_astro", lang)}</p>
        <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt, lineHeight: 1.5 }}>{t("disclaimer_no_doom", lang)}</p>
        <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt, lineHeight: 1.5 }}>{t("disclaimer_data", lang)}</p>
      </div>

      {showRectWizard && birthProfileId && (
        <RectificationWizard
          lang={lang}
          birthProfileId={birthProfileId}
          onApply={(time) => {
            onBirthFormChange({ ...birthForm, birthTimeLocal: time, birthTimeSource: "ESTIMATED_RECTIFIED" });
            setShowRectWizard(false);
          }}
          onClose={() => setShowRectWizard(false)}
        />
      )}
    </div>
  );
}
