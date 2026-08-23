"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { MIN_BIRTH_DATE, maxBirthDateIso } from "@/lib/birth-date";
import { useBirthProfileForm } from "@/hooks/useBirthProfileForm";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { dt, ONBOARDING_DETAIL_LEVEL } from "@/lib/dashboard-i18n";
import type { FamilyVaultListItem, FamilyAggregateMember } from "@/lib/types";
import { PlaceCombobox } from "./place-combobox";
import { RectificationWizard } from "./dashboard-rectification-wizard";
import { DashboardLearnArticleModal } from "./dashboard-learn-article-modal";
import { BirthProfilesManager } from "./birth-profiles-manager";
import { usePlaceCoordinatesConfirm, PlaceMatchedBadge, PlaceCoordinatesFooter } from "./place-coordinates-field";
import { SettingsRail, type SettingsSectionId } from "./dashboard-settings-rail";
import { Button, StatusChip } from "./ui";
import { Field, FieldShell, Input, Select } from "./ui/field";
import { ArrowUpRight } from "lucide-react";

type Relationship = "self" | "spouse" | "child" | "parent" | "sibling" | "grandparent" | "other";

// iOS app is not yet published — set the real store URL when it goes live to
// re-render the App Store badge (null hides it). Mirrors home-content.tsx.
const APP_STORE_URL: string | null = null;

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
  children: string;
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
  birthTimeSource: string;
  birthTimeConfidenceMinutes: string;
};

type UserMode = "BEGINNER" | "BALANCED" | "TRADITIONAL";

interface DashboardSetupTabProps {
  lang: Lang;
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
  onNavigate: (id: SettingsSectionId) => void;
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

/* ── Shared primitives ──
   Field/FieldShell/Input/Select/StatusChip come from components/ui/field.tsx
   (F10 migration — replaces the old WField/WInput/WSelect wrappers, which drew
   their own border and left the label disconnected from the control). StepBtn/
   GhostBtn are thin wrappers over the kit Button so the ~30 existing call sites
   stay unchanged while the chrome themes for free. */

function StepBtn({
  onClick, disabled, busy, children,
}: { onClick: () => void; disabled?: boolean; busy?: boolean; children: React.ReactNode }) {
  return (
    <Button variant="primary" onClick={onClick} disabled={disabled || busy} style={{ whiteSpace: "nowrap" }}>
      {children}
    </Button>
  );
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant="secondary" size="sm" onClick={onClick}>
      {children}
    </Button>
  );
}

const USER_MODE_OPTIONS: Array<{ value: UserMode; label: keyof typeof ONBOARDING_DETAIL_LEVEL; desc: keyof typeof ONBOARDING_DETAIL_LEVEL }> = [
  { value: "BEGINNER", label: "beginnerLabel", desc: "beginnerDesc" },
  { value: "BALANCED", label: "balancedLabel", desc: "balancedDesc" },
  { value: "TRADITIONAL", label: "traditionalLabel", desc: "traditionalDesc" },
];

function DetailLevelQuestion({
  lang,
  userMode,
  onModeChange,
}: {
  lang: Lang;
  userMode: UserMode;
  onModeChange?: (mode: UserMode) => void;
}) {
  if (!onModeChange) return null;
  return (
    <div style={{
      background: "var(--color-surface)", border: `1.5px solid var(--color-border)`,
      borderRadius: "var(--radius-md)", padding: "var(--space-4)",
      display: "flex", flexDirection: "column", gap: "var(--space-4)",
    }}>
      <div>
        <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent)" }}>
          {dt(ONBOARDING_DETAIL_LEVEL.eyebrow, lang)}
        </p>
        <h3 style={{ margin: "0 0 var(--space-1)", color: "var(--color-text-strong)", fontSize: "var(--text-md)" }}>
          {dt(ONBOARDING_DETAIL_LEVEL.title, lang)}
        </h3>
        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)", lineHeight: 1.5 }}>
          {dt(ONBOARDING_DETAIL_LEVEL.body, lang)}
        </p>
      </div>
      <div
        role="radiogroup"
        aria-label={dt(ONBOARDING_DETAIL_LEVEL.title, lang)}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "var(--space-2_5)" }}
      >
        {USER_MODE_OPTIONS.map((option) => {
          const selected = userMode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              onClick={() => onModeChange(option.value)}
              aria-checked={selected}
              style={{
                minHeight: "92px", padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)",
                textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                border: `1.5px solid ${selected ? "var(--color-accent)" : "var(--color-border-strong)"}`,
                background: selected ? "var(--color-accent)" : "transparent",
                color: selected ? "var(--color-on-accent)" : "var(--color-text)",
                transition: "background 0.12s, border-color 0.12s, color 0.12s",
              }}
            >
              <p style={{ margin: "0 0 var(--space-1)", fontWeight: 800, fontSize: "var(--text-base)", lineHeight: 1.25 }}>
                {dt(ONBOARDING_DETAIL_LEVEL[option.label], lang)}
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.35, color: selected ? "var(--color-on-accent)" : "var(--color-muted)" }}>
                {dt(ONBOARDING_DETAIL_LEVEL[option.desc], lang)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Avatar initial chip ── */
function Avatar({ name }: { name: string }) {
  const letter = (name || "?")[0]?.toUpperCase() ?? "?";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "32px", height: "32px", borderRadius: "var(--radius-pill)", flexShrink: 0,
      background: "var(--color-surface-2)", border: "1.5px solid var(--color-border-strong)",
      fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-faint)",
    }}>
      {letter}
    </span>
  );
}

export function DashboardSetupTab({
  lang,
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
  onNavigate,
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
  const [showBirthTimeLearn, setShowBirthTimeLearn] = useState(false);
  const ownCoordsConfirm = usePlaceCoordinatesConfirm(birthForm.birthPlace, birthForm.birthLatitude, birthForm.birthLongitude);
  const memberCoordsConfirm = usePlaceCoordinatesConfirm(memberForm.birthPlace, memberForm.birthLatitude, memberForm.birthLongitude);

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
    <div style={{ fontFamily: "var(--font-body)", color: "var(--color-text-strong)", maxWidth: "1180px", margin: "0 auto", width: "100%" }}>
      <div className="vs-settings-grid">
        <SettingsRail
          active="setup"
          onNavigate={onNavigate}
          lang={lang}
          userDisplayName={birthForm.displayName}
          vaultName={selectedVault?.name ?? vaultForm.name ?? ""}
        />
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>

      {/* ── Hero headline ── */}
      <h1 style={{
        margin: "-20px 0 0",
        fontFamily: "var(--font-display)",
        fontSize: "var(--display-md)",
        fontWeight: 500,
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
        color: "var(--color-text-strong)",
      }}>
        {lang === "ta"
          ? "மூன்று அமைதியான படிகள். பிறகு நாங்கள் படிக்கிறோம்."
          : "Three quiet steps. Then we read for you."}
      </h1>

      {/* Philosophy primer */}
      <div style={{
        padding: "var(--space-5) var(--space-6)",
        background: "var(--color-accent-muted)",
        border: "1px solid var(--color-accent-muted)",
        borderRadius: "var(--radius-md)",
        marginTop: "-8px",
      }}>
        <p style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: 1.7, color: "var(--color-text)" }}>
          {lang === "ta"
            ? "விநாடி உங்கள் ஜாதகத்தை படிக்கிறது — தவிர்க்க முடியாத தீர்ப்பாக அல்ல, ஒரு ஜன்னலாக. ஒவ்வொரு தசையும் ஒரு ஆற்றல் தரம்: சில மாதங்கள் விதைக்க ஏற்றது, சில மாதங்கள் அறுவடைக்கு, சில மாதங்கள் ஆழமாக ஓய்வெடுக்க. இந்த ஜன்னல்களை அறிந்துகொண்டால், சரியான நேரத்தில் சரியான முயற்சி செய்யலாம். நினைவில் கொள்ளுங்கள்: ஜோதிடம் வானிலையை காட்டுகிறது — அதில் நீங்கள் என்ன செய்கிறீர்கள் என்பதை நீங்களே தீர்மானிக்கிறீர்கள்."
            : "Vinaadi reads your birth chart as a window, not a verdict. Each dasha period has a quality — some months are built for planting, some for harvesting, some for deep rest. Knowing these windows lets you bring the right effort at the right time. Remember: astrology reads the weather. What you do in it is always yours to decide."}
        </p>
      </div>

      {/* ── Step stepper ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "flex-start", flex: i < 2 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1_5)", minWidth: "80px" }}>
              {/* Circle */}
              <div style={{
                width: "36px", height: "36px", borderRadius: "var(--radius-pill)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "var(--text-base)", fontWeight: 700,
                background: s.done ? "var(--color-high)" : setupStep === s.n ? "var(--color-accent)" : "var(--color-surface-2)",
                border: `2px solid ${s.done ? "var(--color-high)" : setupStep === s.n ? "var(--color-accent)" : "var(--color-border-strong)"}`,
                color: s.done || setupStep === s.n ? "var(--color-on-accent)" : "var(--color-faint)",
              }}>
                {s.done
                  ? <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden="true"><path d="M5.5 12.5L10 17L18.5 8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : s.n}
              </div>
              {/* Label */}
              <span style={{
                fontSize: "var(--text-sm)", fontWeight: 600, textAlign: "center", lineHeight: 1.3,
                color: s.done ? "var(--color-high)" : setupStep === s.n ? "var(--color-text-strong)" : "var(--color-faint)",
              }}>
                {s.label}
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-faint)", textAlign: "center", lineHeight: 1.3 }}>
                {s.sub}
              </span>
            </div>
            {/* Connector line */}
            {i < 2 && (
              <div style={{
                flex: 1, height: "2px", marginTop: "17px", marginLeft: "var(--space-1)", marginRight: "var(--space-1)",
                background: s.done ? "var(--color-high)" : "var(--color-border)",
              }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step cards row (Step 1 + Step 2 side by side when both active/done) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "var(--space-4)" }}>

        {/* Step 1 — Birth chart card */}
        <div style={{
          background: "var(--color-surface)",
          border: `1.5px solid ${birthProfileId ? "var(--color-high)" : setupStep === 1 ? "var(--color-accent)" : "var(--color-border)"}`,
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
              <h3 style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                {lang === "ta" ? "உங்கள் பிறந்த விவரங்கள்" : "Your birth details"}
              </h3>
              <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
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
              background: "var(--color-surface-2)", border: `1px solid var(--color-border)`,
            }}>
              {[
                { lbl: lang === "ta" ? "பெயர்" : "NAME", val: birthForm.displayName },
                { lbl: lang === "ta" ? "உறவு" : "RELATIONSHIP", val: birthForm.relationshipToOwner },
                { lbl: lang === "ta" ? "பிறந்த தேதி" : "BIRTH DATE", val: birthForm.birthDateLocal },
                { lbl: lang === "ta" ? "பிறந்த நேரம்" : "BIRTH TIME", val: birthForm.birthTimeLocal || "—" },
                { lbl: lang === "ta" ? "பிறந்த இடம்" : "BIRTH PLACE", val: birthForm.birthPlace },
                { lbl: lang === "ta" ? "நேர மண்டலம்" : "TIMEZONE", val: birthForm.birthTimezone },
                ...(birthForm.currentPlace
                  ? [{ lbl: lang === "ta" ? "தினசரி நேரங்கள்" : "DAILY TIMINGS FOR", val: birthForm.currentPlace }]
                  : []),
              ].map(({ lbl, val }) => (
                <div key={lbl}>
                  <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{lbl}</p>
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", fontWeight: 500 }}>{val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Form — shown when not yet created */}
          {!birthProfileId && (
            <form id="form-profile" onSubmit={onCreateProfile} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <DetailLevelQuestion lang={lang} userMode={userMode} onModeChange={onModeChange} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "var(--space-3)" }}>
                <Field label={t("field_name", lang)} error={formErrors.displayName}>
                  <Input
                    value={birthForm.displayName} error={!!formErrors.displayName}
                    onChange={(e) => { onBirthFormChange({ ...birthForm, displayName: e.target.value }); onFormErrorChange({ displayName: "" }); }}
                  />
                </Field>
                <Field label={t("field_birth_date", lang)} error={formErrors.birthDateLocal}>
                  <Input type="date" value={birthForm.birthDateLocal} error={!!formErrors.birthDateLocal} min={MIN_BIRTH_DATE} max={maxBirthDateIso()}
                    onChange={(e) => {
                        onBirthFormChange({
                          ...birthForm,
                          birthDateLocal: nextBirthDateOrCurrent(birthForm.birthDateLocal, e.target.value),
                        });
                      onFormErrorChange({ birthDateLocal: "" });
                    }}
                  />
                </Field>
                {/* The "why does this matter" article has existed since launch
                    and was reachable from Explore and the public footer — i.e.
                    everywhere except the one screen that raises the question.
                    Opened as a modal rather than linked out to /learn/…: this
                    sits mid-signup and navigating away would discard the form. */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  <Field label={t("field_birth_time", lang)} helper={t("field_time_optional", lang)}>
                    <Input type="time" step="1" value={birthForm.birthTimeLocal}
                      onChange={(e) => onBirthFormChange({ ...birthForm, birthTimeLocal: e.target.value })} />
                  </Field>
                  <button
                    type="button"
                    onClick={() => setShowBirthTimeLearn(true)}
                    style={{
                      alignSelf: "flex-start", background: "none", border: "none", padding: 0,
                      font: "inherit", fontSize: "var(--text-2xs)", color: "var(--color-text-accent)",
                      textDecoration: "underline", textUnderlineOffset: "2px", cursor: "pointer",
                    }}
                  >
                    {lang === "ta" ? "பிறந்த நேரம் ஏன் முக்கியம்? →" : "Why does birth time matter? →"}
                  </button>
                </div>
                <FieldShell label={t("field_birth_place", lang)}>
                  <PlaceCombobox value={birthForm.birthPlace}
                    aria-label={t("field_birth_place", lang)}
                    onChange={(city, raw) => {
                      onBirthFormChange(applyPlaceSelection(birthForm, city, raw));
                      onFormErrorChange({ birthPlace: "", birthTimezone: "" });
                    }} />
                  {formErrors.birthPlace ? (
                    <span className="ui-field__error" role="alert" aria-live="polite">{formErrors.birthPlace}</span>
                  ) : (
                    <span className="ui-field__helper">{t("field_place_helper", lang)}</span>
                  )}
                </FieldShell>
              {(!birthForm.birthTimezone || formErrors.birthTimezone) && (
                <Field label={t("field_timezone", lang)} helper={t("field_tz_helper", lang)} error={formErrors.birthTimezone}>
                  <Input value={birthForm.birthTimezone} error={!!formErrors.birthTimezone}
                    onChange={(e) => { onBirthFormChange({ ...birthForm, birthTimezone: e.target.value }); onFormErrorChange({ birthTimezone: "" }); }} />
                </Field>
              )}
                {ownCoordsConfirm.showRawFields ? (
                  <>
                    <Field label={t("field_latitude", lang)} error={formErrors.birthLatitude}>
                      <Input inputMode="decimal" value={birthForm.birthLatitude} error={!!formErrors.birthLatitude}
                        onChange={(e) => { onBirthFormChange({ ...birthForm, birthLatitude: e.target.value }); onFormErrorChange({ birthLatitude: "" }); }} />
                    </Field>
                    <Field label={t("field_longitude", lang)} error={formErrors.birthLongitude}>
                      <Input inputMode="decimal" value={birthForm.birthLongitude} error={!!formErrors.birthLongitude}
                        onChange={(e) => { onBirthFormChange({ ...birthForm, birthLongitude: e.target.value }); onFormErrorChange({ birthLongitude: "" }); }} />
                    </Field>
                    <PlaceCoordinatesFooter lang={lang} place={birthForm.birthPlace} matched={!!ownCoordsConfirm.matched}
                      onUseMatched={() => ownCoordsConfirm.setEditing(false)} />
                  </>
                ) : (
                  <PlaceMatchedBadge lang={lang} place={birthForm.birthPlace}
                    latitude={birthForm.birthLatitude} longitude={birthForm.birthLongitude}
                    onEditClick={() => ownCoordsConfirm.setEditing(true)} />
                )}
              </div>

              <details className="setup-advanced">
                <summary>
                  <svg className="setup-advanced__chev" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {/* i18n: Tamil label pending native review (CLAUDE.md new-Tamil rule) */}
                  {lang === "ta" ? "மேலும் விவரங்கள் (விருப்பம்)" : "More details (optional)"}
                </summary>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                <Field label={t("field_relationship", lang)}>
                  <Select value={birthForm.relationshipToOwner}
                    onChange={(e) => onBirthFormChange({ ...birthForm, relationshipToOwner: e.target.value as Relationship })}>
                    <option value="self">{t("rel_self", lang)}</option>
                    <option value="spouse">{t("rel_spouse", lang)}</option>
                    <option value="child">{t("rel_child", lang)}</option>
                    <option value="parent">{t("rel_parent", lang)}</option>
                    <option value="sibling">{t("rel_sibling", lang)}</option>
                    <option value="grandparent">{t("rel_grandparent", lang)}</option>
                    <option value="other">{t("rel_other", lang)}</option>
                  </Select>
                </Field>
                <Field label={lang === "ta" ? "பிறந்த நேர மூலம்" : "Birth Time Source"}>
                  <Select value={birthForm.birthTimeSource}
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
                  </Select>
                </Field>
                <FieldShell label={lang === "ta" ? "நீங்கள் இப்போது வசிக்கும் ஊர்" : "Where you live now"}>
                  <PlaceCombobox value={birthForm.currentPlace}
                    aria-label={lang === "ta" ? "நீங்கள் இப்போது வசிக்கும் ஊர்" : "Where you live now"}
                    onChange={(city, raw) => onBirthFormChange({
                      ...birthForm,
                      currentPlace: raw,
                      ...(city ? { currentLatitude: city.lat, currentLongitude: city.lng, currentTimezone: city.timezone } : {}),
                    })} />
                  <span className="ui-field__helper">
                    {lang === "ta"
                      ? "பிறந்த ஊரிலிருந்து வேறு இடத்தில் வசித்தால் மட்டும் — தினசரி நேரங்கள் (ராகு காலம், முகூர்த்தம், சூரிய உதயம்) உங்கள் ஊர் வானத்துக்கேற்ப கணிக்கப்படும். பிறந்த ஊரிலேயே இருந்தால் காலியாக விடுங்கள்."
                      : "Only if you live somewhere other than your birthplace — daily timings (Rahu Kalam, muhurtham, sunrise) will be computed for your local sky. Leave blank to use your birthplace."}
                  </span>
                </FieldShell>
                <Field label={lang === "ta" ? "திருமண நிலை" : "Marital Status"}>
                  {/* "Prefer not to say" is a real option here for the same reason
                      it is on Children: a declined status and an unasked one both
                      mean we hold no status, neither is ever read as "single", and
                      the one-minute reading withholds its fifth beat on either. */}
                  <Select value={birthForm.maritalStatus}
                    onChange={(e) => onBirthFormChange({ ...birthForm, maritalStatus: e.target.value })}>
                    <option value="">{lang === "ta" ? "தேர்ந்தெடுக்கவும்" : "Select…"}</option>
                    <option value="single">{lang === "ta" ? "திருமணமாகாதவர்" : "Single / Unmarried"}</option>
                    <option value="married">{lang === "ta" ? "திருமணமானவர்" : "Married"}</option>
                    <option value="divorced">{lang === "ta" ? "விவாகரத்து" : "Divorced"}</option>
                    <option value="widowed">{lang === "ta" ? "விதவை / விதுரர்" : "Widowed"}</option>
                    <option value="undisclosed">{lang === "ta" ? "சொல்ல விரும்பவில்லை" : "Prefer not to say"}</option>
                  </Select>
                </Field>
                <Field label={lang === "ta" ? "குழந்தைகள்" : "Children"}>
                  {/* "Prefer not to say" is a real option: a declined answer and an
                      unasked one are treated identically by the reading, and neither
                      ever unlocks a progeny reading of the 5th house. */}
                  <Select value={birthForm.children}
                    onChange={(e) => onBirthFormChange({ ...birthForm, children: e.target.value })}>
                    <option value="">{lang === "ta" ? "தேர்ந்தெடுக்கவும்" : "Select…"}</option>
                    <option value="has">{lang === "ta" ? "குழந்தைகள் உள்ளனர்" : "Yes"}</option>
                    <option value="none">{lang === "ta" ? "இல்லை" : "No"}</option>
                    <option value="undisclosed">{lang === "ta" ? "சொல்ல விரும்பவில்லை" : "Prefer not to say"}</option>
                  </Select>
                </Field>
                <Field label={lang === "ta" ? "தொழில் வகை" : "Employment Type"}>
                  <Select value={birthForm.employmentType}
                    onChange={(e) => onBirthFormChange({ ...birthForm, employmentType: e.target.value })}>
                    <option value="">{lang === "ta" ? "தேர்ந்தெடுக்கவும்" : "Select…"}</option>
                    {/* Category examples name common Tamil occupations so folk users
                        recognise themselves — "no 'driver'/'teacher'" was a wide
                        "this app doesn't understand me" miss (#23). */}
                    <option value="employed_salaried">{lang === "ta" ? "சம்பளதாரர் (ஆசிரியர், அலுவலகம், தொழிற்சாலை)" : "Salaried (teacher, office, factory)"}</option>
                    <option value="self_employed">{lang === "ta" ? "சுயதொழில் (டிரைவர், விவசாயி, மீனவர், நெசவாளர்)" : "Self-employed (driver, farmer, fisherman, weaver)"}</option>
                    <option value="business_owner">{lang === "ta" ? "சொந்த தொழில் / வியாபாரம்" : "Business Owner / Trade"}</option>
                    <option value="student">{lang === "ta" ? "மாணவர்" : "Student"}</option>
                    <option value="unemployed">{lang === "ta" ? "வேலையில்லாதவர்" : "Unemployed / Seeking"}</option>
                    <option value="retired">{lang === "ta" ? "ஓய்வு பெற்றவர்" : "Retired"}</option>
                    <option value="homemaker">{lang === "ta" ? "இல்லத்தரசி / இல்லத்தரசர்" : "Homemaker"}</option>
                  </Select>
                </Field>
                </div>
              </details>

              {/* Calculate toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
                <input type="checkbox" checked={birthForm.calculateNow}
                  onChange={(e) => onBirthFormChange({ ...birthForm, calculateNow: e.target.checked })} />
                {t("setup_calc_now", lang)}
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-faint)" }}>{t("setup_required", lang)}</span>
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
                fontSize: "var(--text-sm)", color: "var(--color-accent)", textDecoration: "underline", cursor: "pointer",
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

        {/* Manage all birth profiles — visible once at least one profile exists */}
        {birthProfileId && (
          <div style={{
            background: "var(--color-surface)",
            border: `1.5px solid var(--color-border)`,
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}>
            <div style={{
              padding: "var(--space-4) var(--space-6)",
              borderBottom: `1px solid var(--color-border)`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                {lang === "ta" ? "பிறந்த விவர பட்டியல்" : "All birth profiles"}
              </h3>
            </div>
            <BirthProfilesManager lang={lang} activeProfileId={birthProfileId} />
          </div>
        )}

        {/* Step 2 — Family vault card */}
        <div style={{
          background: "var(--color-surface)",
          border: `1.5px solid ${selectedVaultId ? "var(--color-high)" : setupStep === 2 ? "var(--color-accent)" : "var(--color-border)"}`,
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
            <h3 style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 700, color: "var(--color-text-strong)" }}>
              {/* Show live-typed name while editing, or saved vault name, or fallback */}
              {vaultForm.name || selectedVault?.name || (lang === "ta" ? "குடும்ப கொட்டில்" : "Family vault")}
            </h3>
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
              {familyMembers.length > 0
                ? `${familyMembers.length} ${t("members_label_pl", lang)} · ${selectedVault?.defaultLanguage ?? vaultForm.defaultLanguage}`
                : (lang === "ta" ? "உறுப்பினர்களை ஒரே கூரையின் கீழ் சேர்" : "Group members under one roof")}
            </p>
          </div>

          {/* Real members list from familyAggregate */}
          {familyMembers.length > 0 && (
            <div style={{
              border: `1.5px solid var(--color-border)`, borderRadius: "var(--radius-md)",
              overflow: "hidden", background: "var(--color-surface)",
            }}>
              {familyMembers.map((member, idx) => {
                const isOwner = member.birthProfileId === birthProfileId;
                return (
                  <div
                    key={member.familyMemberId}
                    style={{
                      padding: "var(--space-3) var(--space-4)",
                      borderBottom: idx < familyMembers.length - 1 ? `1px solid var(--color-border)` : undefined,
                      display: "flex", alignItems: "center", gap: "var(--space-2_5)",
                    }}
                  >
                    <Avatar name={member.displayName} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>{member.displayName}</p>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
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
                  border: "none", borderTop: `1px solid var(--color-border)`,
                  background: "transparent",
                  color: "var(--color-accent)", fontSize: "var(--text-base)", fontWeight: 600,
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
              <Field label={t("field_vault_name", lang)}>
                <Input value={vaultForm.name} placeholder="எ.கா. Murugan Family"
                  onChange={(e) => onVaultFormChange({ ...vaultForm, name: e.target.value })} />
              </Field>
              <Field label={t("field_language", lang)}>
                <Select value={vaultForm.defaultLanguage}
                  onChange={(e) => onVaultFormChange({ ...vaultForm, defaultLanguage: e.target.value })}>
                  <option value="ta-en">{t("lang_ta_en", lang)}</option>
                  <option value="ta">{t("lang_ta", lang)}</option>
                  <option value="en">{t("lang_en", lang)}</option>
                </Select>
              </Field>
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
          background: "var(--color-surface)",
          border: `1.5px solid ${(selectedVault?.memberCount ?? 0) > 1 ? "var(--color-high)" : setupStep === 3 ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-md)",
          padding: "var(--space-6)",
          display: "flex", flexDirection: "column", gap: "var(--space-4)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
              <StatusChip done={(selectedVault?.memberCount ?? 0) > 1} label={(selectedVault?.memberCount ?? 0) > 1
                ? (lang === "ta" ? "சேர்க்கப்பட்டது" : "Members added")
                : (lang === "ta" ? "தேவை" : "Required")} />
              <h3 style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                {lang === "ta" ? "குடும்ப உறுப்பினரை சேர்" : "Add a family member"}
              </h3>
              <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
                {lang === "ta"
                  ? "மனைவி, பெற்றோர், குழந்தை — அவர்களின் ஜாதகம் மட்டும் கொடுங்கள். கொட்டில் விவரங்கள் தனியே உள்ளன."
                  : "Add spouse, parent, child, etc. — only their birth details needed here. Vault settings are separate above."}
              </p>
            </div>
          </div>

          {/* Data-custody reassurance at the exact fear point — entering a
              relative's private birth details (#7/#43). The delete/rectify
              controls already exist; surface that they do. */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "var(--space-2)",
            padding: "var(--space-3) var(--space-3_5)", borderRadius: "var(--radius-md)",
            background: "var(--color-high-bg)", border: `1px solid var(--color-high-border)`,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={"var(--color-high)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: "1px" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.5 }}>
              {lang === "ta"
                ? "இவர்களின் விவரங்கள் மறையாக்கம் செய்யப்பட்டு பாதுகாப்பாக சேமிக்கப்படுகின்றன — யாருக்கும் விற்கப்படுவதில்லை. எப்போது வேண்டுமானாலும் அமைப்புகளில் நீக்கலாம் அல்லது திருத்தலாம்."
                : "Their details are encrypted and kept private — never sold or shared. You can delete or correct any member anytime from Settings."}
            </p>
          </div>

          <form id="form-member" onSubmit={onAddMember} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "var(--space-3)" }}>
              <Field label={t("field_name", lang)} error={formErrors.memberDisplayName}>
                <Input value={memberForm.displayName} error={!!formErrors.memberDisplayName}
                  onChange={(e) => { onMemberFormChange({ ...memberForm, displayName: e.target.value }); onFormErrorChange({ memberDisplayName: "" }); }} />
              </Field>
              <Field label={t("field_relationship", lang)}>
                <Select value={memberForm.relationshipToOwner}
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
                </Select>
              </Field>
              <Field label={t("field_birth_date", lang)} error={formErrors.memberBirthDate}>
                <Input type="date" value={memberForm.birthDateLocal} error={!!formErrors.memberBirthDate} min={MIN_BIRTH_DATE} max={maxBirthDateIso()}
                  onChange={(e) => {
                    onMemberFormChange({
                      ...memberForm,
                      birthDateLocal: nextBirthDateOrCurrent(memberForm.birthDateLocal, e.target.value),
                    });
                    onFormErrorChange({ memberBirthDate: "" });
                  }} />
              </Field>
              <Field label={t("field_birth_time", lang)} helper={t("field_time_optional", lang)}>
                <Input type="time" step="1" value={memberForm.birthTimeLocal}
                  onChange={(e) => onMemberFormChange({ ...memberForm, birthTimeLocal: e.target.value })} />
              </Field>
              {/* Same reassurance the owner form gives — don't have their exact
                  time on hand? Approximate is fine; this is what stopped P04
                  from adding a member at all until she could "fetch her
                  jathagam from the almirah" (#60). */}
              <Field label={lang === "ta" ? "பிறந்த நேர மூலம்" : "Birth Time Source"} helper={lang === "ta" ? "சரியாக தெரியாவிட்டால் தோராயம் போதும் — பின்னர் திருத்தலாம்" : "Approximate is fine if you don't know exactly — refine it later"}>
                <Select value={memberForm.birthTimeSource}
                  onChange={(e) => {
                    const src = e.target.value;
                    const conf = src === "hospital_record" ? "5" : src === "family_memory" ? "15" : src === "elder_told" ? "30" : src === "approximate" ? "60" : "0";
                    onMemberFormChange({ ...memberForm, birthTimeSource: src, birthTimeConfidenceMinutes: conf });
                  }}>
                  <option value="unknown">{lang === "ta" ? "தெரியாது" : "Unknown"}</option>
                  <option value="hospital_record">{lang === "ta" ? "மருத்துவமனை பதிவு" : "Hospital Record (±5 min)"}</option>
                  <option value="family_memory">{lang === "ta" ? "குடும்ப நினைவு" : "Family Memory (±15 min)"}</option>
                  <option value="elder_told">{lang === "ta" ? "பெரியவர் சொன்னது" : "Elder's Account (±30 min)"}</option>
                  <option value="approximate">{lang === "ta" ? "தோராயம்" : "Approximate (±1 hr)"}</option>
                </Select>
              </Field>
              <FieldShell label={t("field_birth_place", lang)}>
                <PlaceCombobox value={memberForm.birthPlace}
                  aria-label={t("field_birth_place", lang)}
                  onChange={(city, raw) => {
                    onMemberFormChange(applyPlaceSelection(memberForm, city, raw));
                    onFormErrorChange({ memberBirthPlace: "", memberTimezone: "" });
                  }} />
                {formErrors.memberBirthPlace && (
                  <span className="ui-field__error" role="alert" aria-live="polite">{formErrors.memberBirthPlace}</span>
                )}
              </FieldShell>
              <Field label={t("field_timezone", lang)} error={formErrors.memberTimezone}>
                <Input value={memberForm.birthTimezone} error={!!formErrors.memberTimezone}
                  onChange={(e) => { onMemberFormChange({ ...memberForm, birthTimezone: e.target.value }); onFormErrorChange({ memberTimezone: "" }); }} />
              </Field>
              {memberCoordsConfirm.showRawFields ? (
                <>
                  <Field label={t("field_latitude", lang)}>
                    <Input inputMode="decimal" value={memberForm.birthLatitude}
                      onChange={(e) => onMemberFormChange({ ...memberForm, birthLatitude: e.target.value })} />
                  </Field>
                  <Field label={t("field_longitude", lang)}>
                    <Input inputMode="decimal" value={memberForm.birthLongitude}
                      onChange={(e) => onMemberFormChange({ ...memberForm, birthLongitude: e.target.value })} />
                  </Field>
                  <PlaceCoordinatesFooter lang={lang} place={memberForm.birthPlace} matched={!!memberCoordsConfirm.matched}
                    onUseMatched={() => memberCoordsConfirm.setEditing(false)} />
                </>
              ) : (
                <PlaceMatchedBadge lang={lang} place={memberForm.birthPlace}
                  latitude={memberForm.birthLatitude} longitude={memberForm.birthLongitude}
                  onEditClick={() => memberCoordsConfirm.setEditing(true)} />
              )}
              <Field
                label={t("field_weight", lang)}
                helper={lang === "ta"
                  ? "குடும்ப ஒட்டுமொத்த மதிப்பெண்ணில் இந்த உறுப்பினரின் தாக்கம். 1.15 = முக்கிய ஆதரவு (பெற்றோர்); 1.00 = சம நிலை (மனைவி); 0.75 = குறைந்த ஆதரவு (குழந்தை, உடன்பிறந்தவர்)."
                  : "How much this member influences the family aggregate score. 1.15 = strong support role (parent/grandparent); 1.00 = equal partner (spouse); 0.75 = supported member (child, sibling)."}>
                <Input inputMode="decimal" value={memberForm.memberWeight}
                  onChange={(e) => onMemberFormChange({ ...memberForm, memberWeight: e.target.value })} />
              </Field>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
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
          background: "var(--color-high-bg)", border: `1.5px solid var(--color-high-border)`,
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)",
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ margin: "0 0 var(--space-0_5)", fontWeight: 700, color: "var(--color-high)", fontSize: "var(--text-base)" }}>{t("setup_done_title", lang)}</p>
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
              {birthForm.displayName} · {selectedVault?.name} · {selectedVault?.memberCount} {t("members_label_pl", lang)}
            </p>
          </div>
          <StepBtn onClick={onGoToPersonal}>{t("setup_done_goto", lang)}</StepBtn>
        </div>
      )}

      {/* ── Premium upgrade nudge — shown once birth profile exists ── */}
      {!!birthProfileId && (
        <div style={{
          background: "linear-gradient(135deg, var(--color-surface-3) 0%, var(--color-surface-2) 100%)",
          borderRadius: "var(--radius-md)", padding: "var(--space-5) var(--space-6)",
          display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--space-4)",
          alignItems: "center",
        }}>
          <div>
            <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>
              {lang === "ta" ? "Premium" : "Go Premium"}
            </p>
            <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "var(--text-md)", fontWeight: 700, color: "var(--color-text-strong)", lineHeight: 1.3 }}>
              {lang === "ta"
                ? "வரம்பற்ற வழிகாட்டல். விளம்பரங்கள் இல்லை."
                : "Unlimited guidance. No ads."}
            </p>
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
              {lang === "ta"
                ? "வருஷபலன், வர்கங்கள், ஒத்திசைவு — iOS மற்றும் Android ஆப்பில் சந்தா செய்யலாம்."
                : "Varshaphala, vargas, synastry, and 5 reports/month — subscribe via the iOS or Android app."}
            </p>
            {/* Explicit free/paid boundary — counters the "free = hidden charges
                later" reflex that keeps money-anxious users defensive (#19/#73). */}
            <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>
              {lang === "ta"
                ? "உங்கள் தினசரி மதிப்பெண், பஞ்சாங்கம், ஜாதகம், குடும்பக் கண்ணோட்டம் — எப்போதும் இலவசம். மறைமுக கட்டணங்கள் இல்லை; நீங்கள் தேர்ந்தெடுத்தால் மட்டுமே Premium."
                : "Your daily score, panchangam, chart and family view stay free forever. No hidden charges — Premium is only if you choose it."}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", minWidth: "120px" }}>
            {/* iOS is not published yet. `id0000000000` was a placeholder that
                404s on the App Store — home-content.tsx already hides its badge
                behind a null URL for exactly this reason and this second copy
                was missed. Same treatment: set APP_STORE_URL when iOS ships and
                the badge comes back. */}
            {APP_STORE_URL && (
              <a
                href={APP_STORE_URL}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "var(--space-1)",
                  padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)",
                  background: "var(--color-text-strong)", color: "var(--color-surface)", textDecoration: "none",
                  fontSize: "var(--text-base)", fontWeight: 700, whiteSpace: "nowrap",
                }}
              >
                App Store <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
              </a>
            )}
            <a
              href="https://play.google.com/store/apps/details?id=ai.vinaadi.app"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "var(--space-1)",
                padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-strong)", color: "var(--color-text-strong)", textDecoration: "none",
                fontSize: "var(--text-base)", fontWeight: 700, whiteSpace: "nowrap",
              }}
            >
              Google Play <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
            </a>
          </div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div style={{
        borderRadius: "var(--radius-md)", border: `1px solid var(--color-border)`,
        background: "var(--color-surface-2)", padding: "var(--space-4) var(--space-5)",
        display: "flex", flexDirection: "column", gap: "var(--space-1_5)",
      }}>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.6 }}>{t("disclaimer_astro", lang)}</p>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.5 }}>{t("disclaimer_no_doom", lang)}</p>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.5 }}>{t("disclaimer_data", lang)}</p>
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
      {showBirthTimeLearn && (
        <DashboardLearnArticleModal
          slug="why-birth-time-matters"
          lang={lang}
          onClose={() => setShowBirthTimeLearn(false)}
        />
      )}
        </div>
      </div>
    </div>
  );
}
