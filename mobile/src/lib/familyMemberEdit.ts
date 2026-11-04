import type { FamilyMember, FamilyMemberPatch } from "@/api/familyVault";
import type { BirthDetailsPayload } from "@/lib/birthDetailsForm";
import { defaultWeightFor } from "@vinaadi/shared/familyMember";

/**
 * What the member screen sends, worked out away from the screen so it can be
 * tested. A PATCH field that is omitted means "leave alone", so the body must
 * carry only what the user actually changed — the one exception being
 * `currentPlace: ""`, which is the sentinel that clears a current location back
 * to the birth place.
 *
 * `recalculate` is sent only with a birth-field change: correcting the date,
 * time or place recasts the chart (`apply_birth_profile_changes`), while a
 * rename or a current-location move must not.
 */

/** What the place field is asking for, which typing alone never decides. */
export type PlaceEdit =
  | { kind: "unchanged" }
  /** Back to birth-place timings. */
  | { kind: "cleared" }
  /** A city picked from the suggestions: a place AND its coordinates. */
  | { kind: "picked"; label: string; lat: number; lng: number; timezone: string };

/** A correction to the member's birth data — the chart-recasting kind of edit.
 *  The screen decides `changed` by comparing the edited payload against the one
 *  seeded from the saved profile, so typing that lands back on the saved values
 *  is not a change. */
export type BirthEdit =
  | { kind: "unchanged" }
  | { kind: "changed"; payload: BirthDetailsPayload };

export interface MemberEditForm {
  name: string;
  relationship: string;
  alertsEnabled: boolean;
  place: PlaceEdit;
  /** What the server already holds, so a clear of an empty value is not a change. */
  savedPlace: string;
  /** A birth-data correction, if any. Defaults to unchanged. */
  birth?: BirthEdit;
}

export function buildMemberPatch(member: FamilyMember, form: MemberEditForm): FamilyMemberPatch {
  const patch: FamilyMemberPatch = {};
  const name = form.name.trim();
  // An empty name is not a rename: `displayName` has min_length=1 server-side,
  // and a blank field is a user mid-edit, not a request to erase the name.
  if (name && name !== member.displayName) patch.displayName = name;
  if (form.relationship !== member.relationshipToOwner) {
    patch.relationshipToOwner = form.relationship;
    // The weight rides with the relationship, or the label says "parent" while
    // the family aggregate still weighs them as a child.
    patch.memberWeight = defaultWeightFor(form.relationship);
  }
  if (form.alertsEnabled !== member.alertsEnabled) patch.alertsEnabled = form.alertsEnabled;
  if (form.place.kind === "cleared") {
    if (form.savedPlace !== "") patch.currentPlace = "";
  } else if (form.place.kind === "picked") {
    patch.currentPlace = form.place.label;
    patch.currentLatitude = form.place.lat;
    patch.currentLongitude = form.place.lng;
    patch.currentTimezone = form.place.timezone;
  }
  if (form.birth?.kind === "changed") {
    const b = form.birth.payload;
    patch.birthDateLocal = b.birthDateLocal;
    // Omit the time when unknown so it leaves the saved one alone rather than
    // sending `undefined` — clearing a known birth time is not offered here.
    if (b.birthTimeLocal !== undefined) patch.birthTimeLocal = b.birthTimeLocal;
    patch.birthPlace = b.birthPlace;
    patch.birthLatitude = b.birthLatitude;
    patch.birthLongitude = b.birthLongitude;
    patch.birthTimezone = b.birthTimezone;
    // `FamilyMemberPatch.genderForTraditionalRules` is a plain string, so only a
    // concrete male/female is sent; "other" (null here) leaves the stored value.
    if (b.genderForTraditionalRules) patch.genderForTraditionalRules = b.genderForTraditionalRules;
    // The one path that recasts the chart.
    patch.recalculate = true;
  }
  return patch;
}

/** Nothing to send — the Save button stays off. */
export function isEmptyPatch(patch: FamilyMemberPatch): boolean {
  return Object.keys(patch).length === 0;
}
