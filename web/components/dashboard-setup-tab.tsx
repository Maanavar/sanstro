"use client";

import type { FormEvent } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { FamilyVaultListItem } from "@/lib/types";
import { Button, Field, PlaceCombobox } from "./dashboard-ui";

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
  relationshipToOwner: Relationship;
  calculateNow: boolean;
  maritalStatus: string;
  employmentType: string;
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
  memberWeight: string;
  calculateNow: boolean;
};

interface DashboardSetupTabProps {
  lang: Lang;
  settingsSubTab: "setup" | "session";
  birthProfileId: string;
  selectedVaultId: string;
  selectedVault: FamilyVaultListItem | null;
  vaults: FamilyVaultListItem[];
  birthForm: BirthFormState;
  vaultForm: VaultFormState;
  memberForm: MemberFormState;
  formErrors: Record<string, string>;
  busy: { createProfile: boolean; createVault: boolean; addMember: boolean };
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
  onGoToPersonal: () => void;
}

export function DashboardSetupTab({
  lang,
  settingsSubTab,
  birthProfileId,
  selectedVaultId,
  selectedVault,
  vaults,
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
  onGoToPersonal,
}: DashboardSetupTabProps) {
  const setupStep: 1 | 2 | 3 = !birthProfileId ? 1 : !selectedVaultId ? 2 : 3;
  const setupComplete = !!birthProfileId && !!selectedVaultId;

  return (
    <div className="tab-section">
      <div className="settings-layout">
        <aside className="card settings-sidebar">
          <button
            type="button"
            className={`settings-sidebtn${settingsSubTab === "setup" ? " settings-sidebtn--active" : ""}`}
            onClick={() => onSettingsSubTabChange("setup")}
          >
            {t("tab_setup", lang)}
          </button>
          <button
            type="button"
            className={`settings-sidebtn${settingsSubTab === "session" ? " settings-sidebtn--active" : ""}`}
            onClick={() => onSettingsSubTabChange("session")}
          >
            {t("settings_title", lang)}
          </button>
        </aside>

        <div className="settings-content">
          {/* Step progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "8px" }}>
            {([
              { n: 1, label: t("setup_step1_label", lang), done: !!birthProfileId },
              { n: 2, label: t("setup_step2_label", lang), done: !!selectedVaultId },
              { n: 3, label: t("setup_step3_label", lang), done: setupComplete && (selectedVault?.memberCount ?? 0) > 0 },
            ] as { n: number; label: string; done: boolean }[]).map((s, i) => {
              const isActive = setupStep === s.n;
              const isPast = s.done;
              return (
                <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : undefined }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", fontWeight: 700,
                      background: isPast ? "rgba(74,222,128,0.2)" : isActive ? "rgba(229,184,77,0.25)" : "rgba(255,255,255,0.07)",
                      border: `2px solid ${isPast ? "#4ade80" : isActive ? "#e5b84d" : "rgba(255,255,255,0.15)"}`,
                      color: isPast ? "#4ade80" : isActive ? "#e5b84d" : "rgba(255,255,255,0.35)",
                    }}>
                      {isPast ? "✓" : s.n}
                    </div>
                    <span style={{ fontSize: "0.68rem", color: isActive ? "#e5b84d" : isPast ? "#4ade80" : "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div style={{ flex: 1, height: "2px", margin: "0 8px", marginBottom: "20px", background: s.done ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 1 – Birth profile */}
          <div className="card" style={{
            padding: "24px",
            opacity: setupStep === 1 ? 1 : 0.65,
            border: setupStep === 1 ? "1px solid rgba(229,184,77,0.35)" : birthProfileId ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <p className="section-kicker" style={{ color: birthProfileId ? "#4ade80" : "#e5b84d" }}>
                  {birthProfileId ? t("setup_step_done", lang) : "1"}
                </p>
                <h3 style={{ margin: 0 }}>{t("setup_step1_title", lang)}</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                  {t("setup_step1_sub", lang)}
                </p>
              </div>
              {birthProfileId ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button onClick={onShowEditProfile} variant="secondary">{t("setup_step1_edit", lang)}</Button>
                  <Button onClick={onGoToPersonal} variant="primary">{t("setup_step1_goto_personal", lang)}</Button>
                </div>
              ) : (
                <Button variant="primary" disabled={busy.createProfile}
                  onClick={() => (document.getElementById("form-profile") as HTMLFormElement)?.requestSubmit()}>
                  {busy.createProfile ? t("setup_step1_creating", lang) : t("setup_step1_create", lang)}
                </Button>
              )}
            </div>
            {birthProfileId && (
              <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", marginBottom: "16px" }}>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#4ade80" }}>
                  ✓ {birthForm.displayName || "Profile"} – {birthForm.birthDateLocal} · {birthForm.birthPlace}
                </p>
              </div>
            )}
            <form id="form-profile" onSubmit={onCreateProfile}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label={t("field_name", lang)}>
                  <input className={`input${formErrors.displayName ? " input--error" : ""}`} value={birthForm.displayName}
                    onChange={(e) => { onBirthFormChange({ ...birthForm, displayName: e.target.value }); onFormErrorChange({ displayName: "" }); }} />
                  {formErrors.displayName && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.displayName}</span>}
                </Field>
                <Field label={t("field_relationship", lang)}>
                  <select className="select" value={birthForm.relationshipToOwner}
                    onChange={(e) => onBirthFormChange({ ...birthForm, relationshipToOwner: e.target.value as Relationship })}>
                    <option value="self">{t("rel_self", lang)}</option>
                    <option value="spouse">{t("rel_spouse", lang)}</option>
                    <option value="child">{t("rel_child", lang)}</option>
                    <option value="parent">{t("rel_parent", lang)}</option>
                    <option value="sibling">{t("rel_sibling", lang)}</option>
                    <option value="grandparent">{t("rel_grandparent", lang)}</option>
                    <option value="other">{t("rel_other", lang)}</option>
                  </select>
                </Field>
                <Field label={t("field_birth_date", lang)}>
                  <input className={`input${formErrors.birthDateLocal ? " input--error" : ""}`} type="date" value={birthForm.birthDateLocal}
                    onChange={(e) => { onBirthFormChange({ ...birthForm, birthDateLocal: e.target.value }); onFormErrorChange({ birthDateLocal: "" }); }} />
                  {formErrors.birthDateLocal && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.birthDateLocal}</span>}
                </Field>
                <Field label={t("field_birth_time", lang)} helper={t("field_time_optional", lang)}>
                  <input className="input" type="time" step="1" value={birthForm.birthTimeLocal}
                    onChange={(e) => onBirthFormChange({ ...birthForm, birthTimeLocal: e.target.value })} />
                </Field>
                <Field label={t("field_birth_place", lang)} helper={t("field_place_helper", lang)}>
                  <PlaceCombobox value={birthForm.birthPlace}
                    onChange={(city, raw) => {
                      onBirthFormChange({ ...birthForm, birthPlace: raw, ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}) });
                      onFormErrorChange({ birthPlace: "", birthTimezone: "" });
                    }} />
                  {formErrors.birthPlace && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.birthPlace}</span>}
                </Field>
                <Field label={t("field_timezone", lang)} helper={t("field_tz_helper", lang)}>
                  <input className={`input${formErrors.birthTimezone ? " input--error" : ""}`} value={birthForm.birthTimezone}
                    onChange={(e) => { onBirthFormChange({ ...birthForm, birthTimezone: e.target.value }); onFormErrorChange({ birthTimezone: "" }); }} />
                  {formErrors.birthTimezone && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.birthTimezone}</span>}
                </Field>
                <Field label={t("field_latitude", lang)}>
                  <input className={`input${formErrors.birthLatitude ? " input--error" : ""}`} inputMode="decimal" value={birthForm.birthLatitude}
                    onChange={(e) => { onBirthFormChange({ ...birthForm, birthLatitude: e.target.value }); onFormErrorChange({ birthLatitude: "" }); }} />
                  {formErrors.birthLatitude && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.birthLatitude}</span>}
                </Field>
                <Field label={t("field_longitude", lang)}>
                  <input className={`input${formErrors.birthLongitude ? " input--error" : ""}`} inputMode="decimal" value={birthForm.birthLongitude}
                    onChange={(e) => { onBirthFormChange({ ...birthForm, birthLongitude: e.target.value }); onFormErrorChange({ birthLongitude: "" }); }} />
                  {formErrors.birthLongitude && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.birthLongitude}</span>}
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                <Field label={lang === "ta" ? "திருமண நிலை" : "Marital Status"}>
                  <select className="input" value={birthForm.maritalStatus}
                    onChange={(e) => onBirthFormChange({ ...birthForm, maritalStatus: e.target.value })}>
                    <option value="">{lang === "ta" ? "தேர்ந்தெடுக்கவும்" : "Select…"}</option>
                    <option value="single">{lang === "ta" ? "திருமணமாகாதவர்" : "Single / Unmarried"}</option>
                    <option value="married">{lang === "ta" ? "திருமணமானவர்" : "Married"}</option>
                    <option value="divorced">{lang === "ta" ? "விவாகரத்து" : "Divorced"}</option>
                    <option value="widowed">{lang === "ta" ? "விதவை / விதவைர்" : "Widowed"}</option>
                  </select>
                </Field>
                <Field label={lang === "ta" ? "தொழில் வகை" : "Employment Type"}>
                  <select className="input" value={birthForm.employmentType}
                    onChange={(e) => onBirthFormChange({ ...birthForm, employmentType: e.target.value })}>
                    <option value="">{lang === "ta" ? "தேர்ந்தெடுக்கவும்" : "Select…"}</option>
                    <option value="employed_salaried">{lang === "ta" ? "சம்பளதாரர்" : "Salaried Employee"}</option>
                    <option value="self_employed">{lang === "ta" ? "சுயதொழில்" : "Self-Employed / Freelancer"}</option>
                    <option value="business_owner">{lang === "ta" ? "சொந்த தொழில்" : "Business Owner"}</option>
                    <option value="student">{lang === "ta" ? "மாணவர்" : "Student"}</option>
                    <option value="unemployed">{lang === "ta" ? "வேலையில்லாதவர்" : "Unemployed / Seeking"}</option>
                    <option value="retired">{lang === "ta" ? "ஓய்வு பெற்றவர்" : "Retired"}</option>
                    <option value="homemaker">{lang === "ta" ? "இல்லத்தரசி / இல்லத்தரசர்" : "Homemaker"}</option>
                  </select>
                </Field>
              </div>
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
                <label className="toggle">
                  <input type="checkbox" checked={birthForm.calculateNow}
                    onChange={(e) => onBirthFormChange({ ...birthForm, calculateNow: e.target.checked })} />
                  <span>{t("setup_calc_now", lang)}</span>
                </label>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{t("setup_required", lang)}</span>
              </div>
            </form>
          </div>

          {/* Step 2 – Family vault */}
          <div className="card" style={{
            padding: "24px",
            opacity: setupStep < 2 ? 0.4 : 1,
            border: setupStep === 2 ? "1px solid rgba(229,184,77,0.35)" : selectedVaultId ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.08)",
            pointerEvents: setupStep < 2 ? "none" : undefined,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <p className="section-kicker" style={{ color: selectedVaultId ? "#4ade80" : "#e5b84d" }}>
                  {selectedVaultId ? t("setup_vault_step_active", lang) : "2"}
                </p>
                <h3 style={{ margin: 0 }}>{t("setup_step2_title", lang)}</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                  {t("setup_step2_sub", lang)}
                </p>
              </div>
              <Button variant="primary" disabled={busy.createVault || setupStep < 2}
                onClick={() => (document.getElementById("form-vault") as HTMLFormElement)?.requestSubmit()}>
                {busy.createVault ? t("setup_step2_creating", lang) : selectedVaultId ? t("setup_step2_more", lang) : t("setup_step2_create", lang)}
              </Button>
            </div>
            {vaults.length > 0 && (
              <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {vaults.map((v) => (
                  <div key={v.familyVaultId} style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px",
                    background: v.familyVaultId === selectedVaultId ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${v.familyVaultId === selectedVaultId ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`,
                    cursor: "pointer",
                  }} onClick={() => onSelectVault(v.familyVaultId, v.ownerUserId)}>
                    <span style={{ fontSize: "0.85rem", fontWeight: v.familyVaultId === selectedVaultId ? 700 : 400, flex: 1 }}>{v.name}</span>
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{v.memberCount} {t("members_label_pl", lang)}</span>
                    {v.familyVaultId === selectedVaultId && <span style={{ color: "#4ade80", fontSize: "0.75rem" }}>{t("setup_step2_selected", lang)}</span>}
                  </div>
                ))}
              </div>
            )}
            <form id="form-vault" onSubmit={onCreateVault}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label={t("field_vault_name", lang)}>
                  <input className="input" value={vaultForm.name} placeholder="எ.கா. Murugan Family"
                    onChange={(e) => onVaultFormChange({ ...vaultForm, name: e.target.value })} />
                </Field>
                <Field label={t("field_language", lang)}>
                  <select className="select" value={vaultForm.defaultLanguage}
                    onChange={(e) => onVaultFormChange({ ...vaultForm, defaultLanguage: e.target.value })}>
                    <option value="ta-en">{t("lang_ta_en", lang)}</option>
                    <option value="ta">{t("lang_ta", lang)}</option>
                    <option value="en">{t("lang_en", lang)}</option>
                  </select>
                </Field>
              </div>
            </form>
          </div>

          {/* Step 3 – Add member */}
          <div className="card" style={{
            padding: "24px",
            opacity: setupStep < 3 ? 0.4 : 1,
            border: setupStep === 3 ? "1px solid rgba(229,184,77,0.35)" : "1px solid rgba(255,255,255,0.08)",
            pointerEvents: setupStep < 3 ? "none" : undefined,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <p className="section-kicker" style={{ color: setupStep >= 3 ? "#e5b84d" : "rgba(255,255,255,0.3)" }}>3</p>
                <h3 style={{ margin: 0 }}>{t("setup_step3_title", lang)}</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                  {selectedVault ? `${selectedVault.name} – ${selectedVault.memberCount} ${t("members_label_pl", lang)}` : t("setup_step3_sub_vault", lang)}
                </p>
              </div>
              <Button variant="primary" disabled={busy.addMember || !selectedVaultId}
                onClick={() => (document.getElementById("form-member") as HTMLFormElement)?.requestSubmit()}>
                {busy.addMember ? t("setup_step3_adding", lang) : t("setup_step3_add", lang)}
              </Button>
            </div>
            <form id="form-member" onSubmit={onAddMember}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label={t("field_name", lang)}>
                  <input className={`input${formErrors.memberDisplayName ? " input--error" : ""}`} value={memberForm.displayName}
                    onChange={(e) => { onMemberFormChange({ ...memberForm, displayName: e.target.value }); onFormErrorChange({ memberDisplayName: "" }); }} />
                  {formErrors.memberDisplayName && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.memberDisplayName}</span>}
                </Field>
                <Field label={t("field_relationship", lang)}>
                  <select className="select" value={memberForm.relationshipToOwner}
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
                  </select>
                </Field>
                <Field label={t("field_birth_date", lang)}>
                  <input className={`input${formErrors.memberBirthDate ? " input--error" : ""}`} type="date" value={memberForm.birthDateLocal}
                    onChange={(e) => { onMemberFormChange({ ...memberForm, birthDateLocal: e.target.value }); onFormErrorChange({ memberBirthDate: "" }); }} />
                  {formErrors.memberBirthDate && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.memberBirthDate}</span>}
                </Field>
                <Field label={t("field_birth_time", lang)} helper={t("field_time_optional", lang)}>
                  <input className="input" type="time" step="1" value={memberForm.birthTimeLocal}
                    onChange={(e) => onMemberFormChange({ ...memberForm, birthTimeLocal: e.target.value })} />
                </Field>
                <Field label={t("field_birth_place", lang)}>
                  <PlaceCombobox value={memberForm.birthPlace}
                    onChange={(city, raw) => {
                      onMemberFormChange({ ...memberForm, birthPlace: raw, ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}) });
                      onFormErrorChange({ memberBirthPlace: "", memberTimezone: "" });
                    }} />
                  {formErrors.memberBirthPlace && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.memberBirthPlace}</span>}
                </Field>
                <Field label={t("field_timezone", lang)}>
                  <input className={`input${formErrors.memberTimezone ? " input--error" : ""}`} value={memberForm.birthTimezone}
                    onChange={(e) => { onMemberFormChange({ ...memberForm, birthTimezone: e.target.value }); onFormErrorChange({ memberTimezone: "" }); }} />
                  {formErrors.memberTimezone && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.memberTimezone}</span>}
                </Field>
                <Field label={t("field_latitude", lang)}>
                  <input className="input" inputMode="decimal" value={memberForm.birthLatitude}
                    onChange={(e) => onMemberFormChange({ ...memberForm, birthLatitude: e.target.value })} />
                </Field>
                <Field label={t("field_longitude", lang)}>
                  <input className="input" inputMode="decimal" value={memberForm.birthLongitude}
                    onChange={(e) => onMemberFormChange({ ...memberForm, birthLongitude: e.target.value })} />
                </Field>
                <Field label={t("field_weight", lang)} helper={t("field_weight_helper", lang)}>
                  <input className="input" inputMode="decimal" value={memberForm.memberWeight}
                    onChange={(e) => onMemberFormChange({ ...memberForm, memberWeight: e.target.value })} />
                </Field>
              </div>
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
                <label className="toggle">
                  <input type="checkbox" checked={memberForm.calculateNow}
                    onChange={(e) => onMemberFormChange({ ...memberForm, calculateNow: e.target.checked })} />
                  <span>{t("setup_calc_now", lang)}</span>
                </label>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{t("setup_required", lang)}</span>
              </div>
            </form>
          </div>

          {/* Done state */}
          {setupComplete && (selectedVault?.memberCount ?? 0) > 0 && (
            <div style={{ padding: "16px 20px", borderRadius: "10px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "#4ade80" }}>{t("setup_done_title", lang)}</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                  {birthForm.displayName} ஜாதகம் · {selectedVault?.name} vault · {selectedVault?.memberCount} member{(selectedVault?.memberCount ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <Button onClick={onGoToPersonal} variant="primary">{t("setup_done_goto", lang)}</Button>
            </div>
          )}

          {/* Disclaimer banner */}
          <div style={{
            borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.025)", padding: "14px 18px",
            display: "flex", flexDirection: "column", gap: "6px",
          }}>
            <p style={{ margin: 0, fontSize: "0.73rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              {t("disclaimer_astro", lang)}
            </p>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
              {t("disclaimer_no_doom", lang)}
            </p>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
              {t("disclaimer_data", lang)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
