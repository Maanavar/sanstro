"use client";

import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { MIN_BIRTH_DATE, isBirthDateWithinBounds, maxBirthDateIso } from "@/lib/birth-date";
import { PlaceCombobox } from "./dashboard-ui";

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
  currentPlace: string;
  currentLatitude: string;
  currentLongitude: string;
  currentTimezone: string;
};

interface EditMemberModalProps {
  lang: Lang;
  editMember: EditMemberState;
  busySaving: boolean;
  onClose: () => void;
  onChange: (next: EditMemberState) => void;
  onSave: () => void;
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
} as const;

function WField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: "0.625rem", color: W.mutedLt }}>{hint}</span>}
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

export function EditMemberModal({ lang, editMember, busySaving, onClose, onChange, onSave }: EditMemberModalProps) {
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
              {lang === "ta" ? "உறுப்பினர் திருத்து" : "Edit member"}
            </p>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: W.ink }}>{editMember.displayName}</h3>
            <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: W.muted }}>{t("modal_edit_member_sub", lang)}</p>
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

        {/* Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <WField label={t("field_display_name", lang)}>
            <WInput value={editMember.displayName}
              onChange={(e) => onChange({ ...editMember, displayName: e.target.value })} />
          </WField>
          <WField label={t("field_relationship", lang)}>
            <WSelect value={editMember.relationshipToOwner}
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
            </WSelect>
          </WField>
          <WField label={t("field_birth_date", lang)}>
            <WInput type="date" value={editMember.birthDateLocal} min={MIN_BIRTH_DATE} max={maxBirthDateIso()}
              onChange={(e) => {
                const next = e.target.value;
                if (!isBirthDateWithinBounds(next)) return;
                onChange({ ...editMember, birthDateLocal: next });
              }} />
          </WField>
          <WField label={t("field_birth_time", lang)}>
            <WInput type="time" step="1" value={editMember.birthTimeLocal}
              onChange={(e) => onChange({ ...editMember, birthTimeLocal: e.target.value })} />
          </WField>
          <WField label={t("field_birth_place", lang)}>
            <PlaceCombobox value={editMember.birthPlace}
              onChange={(city, raw) => onChange({
                ...editMember, birthPlace: raw,
                ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
              })} />
          </WField>
          <WField label={t("field_timezone", lang)}>
            <WInput value={editMember.birthTimezone}
              onChange={(e) => onChange({ ...editMember, birthTimezone: e.target.value })} />
          </WField>
          <WField label={t("field_latitude", lang)}>
            <WInput inputMode="decimal" value={editMember.birthLatitude}
              onChange={(e) => onChange({ ...editMember, birthLatitude: e.target.value })} />
          </WField>
          <WField label={t("field_longitude", lang)}>
            <WInput inputMode="decimal" value={editMember.birthLongitude}
              onChange={(e) => onChange({ ...editMember, birthLongitude: e.target.value })} />
          </WField>
          <WField label={lang === "ta" ? "தினசரி நேரங்களுக்கான தற்போதைய நகரம்" : "Current City (Daily Timings)"}>
            <PlaceCombobox value={editMember.currentPlace}
              onChange={(city, raw) => onChange({
                ...editMember,
                currentPlace: raw,
                ...(city ? { currentLatitude: city.lat, currentLongitude: city.lng, currentTimezone: city.timezone } : {}),
              })} />
          </WField>
          <WField label={lang === "ta" ? "தற்போதைய நேர மண்டலம்" : "Current Timezone"}>
            <WInput value={editMember.currentTimezone}
              onChange={(e) => onChange({ ...editMember, currentTimezone: e.target.value })} />
          </WField>
          <WField label={lang === "ta" ? "தற்போதைய அகலம்" : "Current Latitude"}>
            <WInput inputMode="decimal" value={editMember.currentLatitude}
              onChange={(e) => onChange({ ...editMember, currentLatitude: e.target.value })} />
          </WField>
          <WField label={lang === "ta" ? "தற்போதைய தீர்க்கரம்" : "Current Longitude"}>
            <WInput inputMode="decimal" value={editMember.currentLongitude}
              onChange={(e) => onChange({ ...editMember, currentLongitude: e.target.value })} />
          </WField>
          <WField label={t("field_weight", lang)} hint={t("field_weight_hint", lang)}>
            <WInput inputMode="decimal" value={editMember.memberWeight}
              onChange={(e) => onChange({ ...editMember, memberWeight: e.target.value })} />
          </WField>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", gap: "10px", justifyContent: "flex-end",
          paddingTop: "16px", borderTop: `1px solid ${W.borderLt}`,
        }}>
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
            onClick={onSave}
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
