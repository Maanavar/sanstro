"use client";

import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { Button, Field, PlaceCombobox } from "./dashboard-ui";

type Relationship = "self" | "spouse" | "child" | "parent" | "sibling" | "grandparent" | "other";

const RELATIONSHIP_WEIGHTS: Record<Relationship, string> = {
  self: "1.00", spouse: "1.00", child: "0.75",
  parent: "1.15", sibling: "0.75", grandparent: "1.15", other: "1.00",
};

export type EditMemberState = {
  memberId: string;
  displayName: string;
  relationshipToOwner: Relationship;
  memberWeight: string;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
};

interface EditMemberModalProps {
  lang: Lang;
  editMember: EditMemberState;
  busySaving: boolean;
  onClose: () => void;
  onChange: (next: EditMemberState) => void;
  onSave: () => void;
}

export function EditMemberModal({ lang, editMember, busySaving, onClose, onChange, onSave }: EditMemberModalProps) {
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
            <h3 style={{ margin: 0 }}>{t("modal_edit_member_title", lang)}</h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              {t("modal_edit_member_sub", lang)}
            </p>
          </div>
          <button type="button" className="button button--ghost" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label={t("field_display_name", lang)}>
            <input className="input" value={editMember.displayName}
              onChange={(e) => onChange({ ...editMember, displayName: e.target.value })} />
          </Field>
          <Field label={t("field_relationship", lang)}>
            <select className="select" value={editMember.relationshipToOwner}
              onChange={(e) => {
                const rel = e.target.value as Relationship;
                onChange({ ...editMember, relationshipToOwner: rel, memberWeight: RELATIONSHIP_WEIGHTS[rel] });
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
            <input className="input" type="date" value={editMember.birthDateLocal}
              onChange={(e) => onChange({ ...editMember, birthDateLocal: e.target.value })} />
          </Field>
          <Field label={t("field_birth_time", lang)}>
            <input className="input" type="time" step="1" value={editMember.birthTimeLocal}
              onChange={(e) => onChange({ ...editMember, birthTimeLocal: e.target.value })} />
          </Field>
          <Field label={t("field_birth_place", lang)}>
            <PlaceCombobox value={editMember.birthPlace}
              onChange={(city, raw) => onChange({
                ...editMember, birthPlace: raw,
                ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
              })} />
          </Field>
          <Field label={t("field_timezone", lang)}>
            <input className="input" value={editMember.birthTimezone}
              onChange={(e) => onChange({ ...editMember, birthTimezone: e.target.value })} />
          </Field>
          <Field label={t("field_latitude", lang)}>
            <input className="input" inputMode="decimal" value={editMember.birthLatitude}
              onChange={(e) => onChange({ ...editMember, birthLatitude: e.target.value })} />
          </Field>
          <Field label={t("field_longitude", lang)}>
            <input className="input" inputMode="decimal" value={editMember.birthLongitude}
              onChange={(e) => onChange({ ...editMember, birthLongitude: e.target.value })} />
          </Field>
          <Field label={t("field_weight", lang)} helper={t("field_weight_hint", lang)}>
            <input className="input" inputMode="decimal" value={editMember.memberWeight}
              onChange={(e) => onChange({ ...editMember, memberWeight: e.target.value })} />
          </Field>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button onClick={onClose} variant="ghost">{t("btn_cancel", lang)}</Button>
          <Button onClick={onSave} variant="primary" disabled={busySaving}>
            {busySaving ? t("btn_saving", lang) : t("btn_save_recalc", lang)}
          </Button>
        </div>
      </div>
    </div>
  );
}
