"use client";

import { cloneElement, isValidElement, useId } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { MIN_BIRTH_DATE, maxBirthDateIso } from "@/lib/birth-date";
import { PlaceCombobox } from "./place-combobox";
import { usePlaceCoordinatesConfirm, PlaceMatchedBadge, PlaceCoordinatesFooter } from "./place-coordinates-field";
import { ModalShell } from "./modal-shell";

type Relationship = "self" | "spouse" | "child" | "parent" | "sibling" | "grandparent" | "other";

const RELATIONSHIP_WEIGHTS: Record<Relationship, string> = {
  self: "1.00", spouse: "1.00", child: "0.75",
  parent: "1.15", sibling: "0.75", grandparent: "1.15", other: "1.00",
};

/** Which record is open, and therefore which endpoint the save goes to.
 *
 *  `member` — a FamilyMember row: relationship and weight are real fields on it
 *  and are shown. `profile` — a bare BirthProfile opened from Setup → all birth
 *  profiles, where neither exists; the two fields are hidden rather than shown
 *  disabled, because a control that can never apply is noise, not information.
 *
 *  Both write the same birth data, and the backend keeps a family-linked
 *  profile's FamilyMember mirror in sync, so editing from either door is safe. */
export type EditScope = "member" | "profile";

export type EditMemberState = {
  scope: EditScope;
  /** Present for both scopes — the profile endpoint needs it, and the member
   *  endpoint's response carries it, so a member edit can fall back to it. */
  birthProfileId: string;
  /** "" in `profile` scope — there is no FamilyMember row to address. */
  memberId: string;
  /** Vault that owns `memberId`. "" in `profile` scope. */
  familyVaultId: string;
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
  ink:      "var(--deepdive-ink, var(--panel-earth-dark))",
  inkMid:   "var(--deepdive-ink-mid, var(--panel-earth))",
  muted:    "var(--color-faint)",
  mutedLt:  "var(--color-faint)",
  border:   "var(--deepdive-border, var(--panel-tan))",
  borderLt: "var(--deepdive-border-light, var(--panel-tan-light))",
  surface:  "var(--deepdive-surface, var(--panel-cream))",
  surfaceMd:"var(--deepdive-surface-strong, var(--panel-hover))",
  card:     "var(--chart-cell-default)",
  terracota:"var(--deepdive-accent, var(--panel-brand))",
} as const;

/** `span` makes the field take the whole grid row — for the one control whose
 *  hint is a sentence rather than a word, and which would otherwise wrap to
 *  four lines inside a 220px track. The hint is 0.75rem, not 0.625rem: 10px is
 *  below what this hint has to carry now that it explains what the field does
 *  and does not change.
 *
 *  The caption is a real `<label htmlFor>` bound to a generated id that is
 *  cloned onto the control. It used to be a bare `<label>` with no association
 *  at all, so every field in this modal was anonymous to a screen reader and to
 *  `getByLabelText` — twelve controls announcing only "edit text".
 *
 *  `ariaLabelled` opts out for `PlaceCombobox`, which deliberately does not
 *  spread arbitrary props onto its input (see the note in place-combobox.tsx),
 *  so an id cannot reach it. Those callers pass `aria-label` on the control
 *  itself and this renders a presentational caption rather than a `<label>`
 *  pointing at an element that does not exist. */
function WField({ label, hint, span, ariaLabelled, children }: {
  label: string;
  hint?: string;
  span?: boolean;
  ariaLabelled?: boolean;
  children: React.ReactNode;
}) {
  const id = useId();
  const control = !ariaLabelled && isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ id?: string }>, { id })
    : children;
  const captionStyle: React.CSSProperties = { fontSize: "0.75rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.06em" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", ...(span ? { gridColumn: "1 / -1" } : {}) }}>
      {ariaLabelled
        ? <span style={captionStyle}>{label}</span>
        : <label htmlFor={id} style={captionStyle}>{label}</label>}
      {control}
      {hint && <span style={{ fontSize: "0.75rem", lineHeight: 1.45, color: W.mutedLt }}>{hint}</span>}
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
  const coordsConfirm = usePlaceCoordinatesConfirm(editMember.birthPlace, editMember.birthLatitude, editMember.birthLongitude);
  const isMemberScope = editMember.scope === "member";
  const title = isMemberScope
    ? (lang === "ta" ? "உறுப்பினர் திருத்து" : "Edit member")
    : (lang === "ta" ? "பிறந்த விவரம் திருத்து" : "Edit birth profile");
  return (
    <ModalShell
      label={title}
      onClose={onClose}
      panelStyle={{
        width: "min(580px, 100%)",
        background: W.surface,
        border: `1.5px solid ${W.borderLt}`,
        borderRadius: "20px",
        padding: "28px",
        display: "flex", flexDirection: "column", gap: "20px",
        boxShadow: "0 24px 64px rgba(26,22,18,0.18)",
      }}
    >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: W.terracota }}>
              {title}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "14px" }}>
          <WField label={t("field_display_name", lang)}>
            <WInput value={editMember.displayName}
              onChange={(e) => onChange({ ...editMember, displayName: e.target.value })} />
          </WField>
          {isMemberScope && (
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
          )}
          <WField label={t("field_birth_date", lang)}>
            <WInput type="date" value={editMember.birthDateLocal} min={MIN_BIRTH_DATE} max={maxBirthDateIso()}
              onChange={(e) => {
                const next = e.target.value;
                onChange({ ...editMember, birthDateLocal: next });
              }} />
          </WField>
          <WField label={t("field_birth_time", lang)}>
            <WInput type="time" step="1" value={editMember.birthTimeLocal}
              onChange={(e) => onChange({ ...editMember, birthTimeLocal: e.target.value })} />
          </WField>
          <WField ariaLabelled label={t("field_birth_place", lang)}>
            <PlaceCombobox value={editMember.birthPlace}
              aria-label={t("field_birth_place", lang)}
              lang={lang}
              onChange={(city, raw) => {
                onChange({
                  ...editMember, birthPlace: raw,
                  ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
                });
                coordsConfirm.setMatched(city !== null);
              }} />
          </WField>
          <WField label={t("field_timezone", lang)}>
            <WInput value={editMember.birthTimezone}
              onChange={(e) => onChange({ ...editMember, birthTimezone: e.target.value })} />
          </WField>
          {coordsConfirm.showRawFields ? (
            <>
              <WField label={t("field_latitude", lang)}>
                <WInput inputMode="decimal" value={editMember.birthLatitude}
                  onChange={(e) => onChange({ ...editMember, birthLatitude: e.target.value })} />
              </WField>
              <WField label={t("field_longitude", lang)}>
                <WInput inputMode="decimal" value={editMember.birthLongitude}
                  onChange={(e) => onChange({ ...editMember, birthLongitude: e.target.value })} />
              </WField>
              <PlaceCoordinatesFooter lang={lang} place={editMember.birthPlace} matched={!!coordsConfirm.matched}
                onUseMatched={() => coordsConfirm.setEditing(false)} />
            </>
          ) : (
            <PlaceMatchedBadge lang={lang} place={editMember.birthPlace}
              latitude={editMember.birthLatitude} longitude={editMember.birthLongitude}
              onEditClick={() => coordsConfirm.setEditing(true)} />
          )}
          {/* Where they live NOW — one field, not four.
              This is the single most consequential setting in the modal and it
              used to read as four unrelated chores (city, timezone, latitude,
              longitude), all raw, all always visible, unlike the birth block
              right above which hides its coordinates behind a matched badge.
              Picking a city fills all four; the readout below proves it did.
              Nothing here touches the chart — only the day's clock. */}
          <WField
            span
            ariaLabelled
            label={lang === "ta" ? "இப்போது வசிக்கும் ஊர்" : "Where they live now"}
            hint={lang === "ta"
              ? "தினசரி நேரங்களுக்கு மட்டும் (ராகு காலம், நல்ல நேரம்). ஜாதகம் மாறாது. காலியாக விட்டால் பிறந்த ஊரே பயன்படும்."
              : "Sets the daily timings only (Rahu Kalam, nalla neram). Does not change the chart. Left empty, the birth place is used."}
          >
            <PlaceCombobox value={editMember.currentPlace}
              aria-label={lang === "ta" ? "இப்போது வசிக்கும் ஊர்" : "Where they live now"}
              lang={lang}
              onChange={(city, raw) => onChange({
                ...editMember,
                currentPlace: raw,
                // A city fills the three fields that make the place usable. Raw
                // text that matched nothing must NOT keep the previous city's
                // coordinates — that pairs a new label with an old location,
                // which is the one state the resolver cannot detect.
                ...(city
                  ? { currentLatitude: city.lat, currentLongitude: city.lng, currentTimezone: city.timezone }
                  : { currentLatitude: "", currentLongitude: "", currentTimezone: "" }),
              })} />
          </WField>
          {(editMember.currentPlace || editMember.currentTimezone) && (
            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "-6px" }}>
              <span style={{ fontSize: "0.75rem", color: W.muted }}>
                {editMember.currentTimezone
                  ? `${editMember.currentTimezone}${editMember.currentLatitude && editMember.currentLongitude ? ` · ${Number(editMember.currentLatitude).toFixed(2)}, ${Number(editMember.currentLongitude).toFixed(2)}` : ""}`
                  : (lang === "ta" ? "நகரத்தை பட்டியலிலிருந்து தேர்ந்தெடுக்கவும்" : "Pick a city from the list to set the timezone")}
              </span>
              {/* The only way back to birth-place timings. Sending "" is what
                  the API reads as a clear; omitting the field means "leave
                  alone", so without this button a current location was a
                  one-way door. */}
              <button
                type="button"
                onClick={() => onChange({ ...editMember, currentPlace: "", currentLatitude: "", currentLongitude: "", currentTimezone: "" })}
                style={{
                  background: "none", border: "none", padding: 0,
                  fontSize: "0.75rem", color: W.terracota, textDecoration: "underline",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {lang === "ta" ? "நீக்கி பிறந்த ஊரை பயன்படுத்து" : "Clear — use birth place"}
              </button>
            </div>
          )}
          {isMemberScope && (
            <WField label={t("field_weight", lang)} hint={t("field_weight_hint", lang)}>
              <WInput inputMode="decimal" value={editMember.memberWeight}
                onChange={(e) => onChange({ ...editMember, memberWeight: e.target.value })} />
            </WField>
          )}
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
    </ModalShell>
  );
}
