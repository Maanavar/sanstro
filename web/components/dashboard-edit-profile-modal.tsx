"use client";

import type { FormEvent } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { Button, Field, PlaceCombobox } from "./dashboard-ui";

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
  relationshipToOwner: Relationship;
  calculateNow: boolean;
  maritalStatus: string;
  employmentType: string;
};

interface EditProfileModalProps {
  lang: Lang;
  birthForm: BirthFormState;
  busySaving: boolean;
  onClose: () => void;
  onChange: (next: BirthFormState) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function EditProfileModal({ lang, birthForm, busySaving, onClose, onChange, onSubmit }: EditProfileModalProps) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card" style={{ width: "min(560px, 100%)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>{t("modal_edit_profile_title", lang)}</h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              {t("modal_edit_profile_sub", lang)}
            </p>
          </div>
          <button type="button" className="button button--ghost" onClick={onClose}>✕</button>
        </div>

        <form id="form-edit-profile" onSubmit={onSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={t("field_display_name", lang)}>
              <input className="input" value={birthForm.displayName}
                onChange={(e) => onChange({ ...birthForm, displayName: e.target.value })} />
            </Field>
            <Field label={t("field_relationship", lang)}>
              <select className="select" value={birthForm.relationshipToOwner}
                onChange={(e) => onChange({ ...birthForm, relationshipToOwner: e.target.value as Relationship })}>
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
              <input className="input" type="date" value={birthForm.birthDateLocal}
                onChange={(e) => onChange({ ...birthForm, birthDateLocal: e.target.value })} />
            </Field>
            <Field label={t("field_birth_time", lang)}>
              <input className="input" type="time" step="1" value={birthForm.birthTimeLocal}
                onChange={(e) => onChange({ ...birthForm, birthTimeLocal: e.target.value })} />
            </Field>
            <Field label={t("field_birth_place", lang)}>
              <PlaceCombobox value={birthForm.birthPlace}
                onChange={(city, raw) => onChange({
                  ...birthForm, birthPlace: raw,
                  ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
                })} />
            </Field>
            <Field label={t("field_timezone", lang)}>
              <input className="input" value={birthForm.birthTimezone}
                onChange={(e) => onChange({ ...birthForm, birthTimezone: e.target.value })} />
            </Field>
            <Field label={t("field_latitude", lang)}>
              <input className="input" inputMode="decimal" value={birthForm.birthLatitude}
                onChange={(e) => onChange({ ...birthForm, birthLatitude: e.target.value })} />
            </Field>
            <Field label={t("field_longitude", lang)}>
              <input className="input" inputMode="decimal" value={birthForm.birthLongitude}
                onChange={(e) => onChange({ ...birthForm, birthLongitude: e.target.value })} />
            </Field>
          </div>
        </form>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button onClick={onClose} variant="ghost">{t("btn_cancel", lang)}</Button>
          <Button
            onClick={() => (document.getElementById("form-edit-profile") as HTMLFormElement)?.requestSubmit()}
            variant="primary"
            disabled={busySaving}
          >
            {busySaving ? t("btn_saving", lang) : t("btn_save_recalc", lang)}
          </Button>
        </div>
      </div>
    </div>
  );
}
