/**
 * The birth-input block's state, validation and payload building — the logic
 * pulled out of `(onboarding)/birth-details.tsx` so the new "add member" and the
 * member edit screens share one copy of the parts that are easy to get subtly
 * wrong: the AM/PM → 24h conversion, the date-of-birth bounds, and the rule that
 * a place is a label AND its coordinates (typing alone never sets a location).
 *
 * This module is deliberately UI-free and pure so it can be unit-tested. The
 * `<BirthDetailsFields>` component renders this state; onboarding keeps its own
 * JSX for now (it owns the opt-in online-geocode and Chennai fallbacks, owner
 * ruling B-006) and can adopt the component as a device-tested follow-up.
 */

export type BirthGender = "male" | "female" | "other";

/** A place is only a location once a suggestion is picked: label + coordinates. */
export interface SelectedPlace {
  lat: number;
  lon: number;
  timezone: string;
}

export interface BirthDetailsFormState {
  displayName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  gender: BirthGender;
  timeUnknown: boolean;
  timeHour: string;
  timeMin: string;
  ampm: "AM" | "PM";
  /** The text in the place field — may be ahead of `selected` while typing. */
  placeLabel: string;
  /** Set only by picking a suggestion; cleared the moment the text changes. */
  selected: SelectedPlace | null;
  /** The editable timezone chip. Defaults to the picked place's zone. */
  timezone: string;
}

export const emptyBirthDetailsForm: BirthDetailsFormState = {
  displayName: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  gender: "male",
  timeUnknown: false,
  timeHour: "",
  timeMin: "",
  ampm: "AM",
  placeLabel: "",
  selected: null,
  timezone: "",
};

/** Which fields can fail, and why — mapped to localized copy in the component. */
export type BirthFieldKey = "name" | "date" | "place" | "time";
export type BirthFieldError =
  | "name_required"
  | "date_invalid"
  | "place_required"
  | "place_not_selected"
  | "time_invalid";
export type BirthFormErrors = Partial<Record<BirthFieldKey, BirthFieldError>>;

export interface ValidateOptions {
  /** Onboarding and add-member need a name; the edit screen owns it elsewhere. */
  requireName?: boolean;
}

function parseIntOrNaN(value: string): number {
  // parseInt("12abc") === 12 would wave bad input through; be strict.
  return /^\d+$/.test(value.trim()) ? Number.parseInt(value.trim(), 10) : NaN;
}

export function validateBirthDetails(
  form: BirthDetailsFormState,
  options: ValidateOptions = {},
): BirthFormErrors {
  const errors: BirthFormErrors = {};

  if (options.requireName !== false && !form.displayName.trim()) {
    errors.name = "name_required";
  }

  const d = parseIntOrNaN(form.dobDay);
  const m = parseIntOrNaN(form.dobMonth);
  const y = parseIntOrNaN(form.dobYear);
  const currentYear = new Date().getFullYear();
  // Build the date and check the month survives round-trip, so 31 Feb or
  // month 13 is rejected rather than rolled into the next month.
  const dateObj = new Date(y, m - 1, d);
  const dateValid =
    !Number.isNaN(d) &&
    !Number.isNaN(m) &&
    !Number.isNaN(y) &&
    y >= 1900 &&
    y <= currentYear &&
    m >= 1 &&
    m <= 12 &&
    d >= 1 &&
    dateObj.getMonth() === m - 1 &&
    dateObj.getDate() === d;
  if (!dateValid) errors.date = "date_invalid";

  if (!form.placeLabel.trim()) {
    errors.place = "place_required";
  } else if (!form.selected) {
    errors.place = "place_not_selected";
  }

  if (!form.timeUnknown) {
    const h = parseIntOrNaN(form.timeHour);
    const min = parseIntOrNaN(form.timeMin);
    if (Number.isNaN(h) || Number.isNaN(min) || h < 1 || h > 12 || min < 0 || min > 59) {
      errors.time = "time_invalid";
    }
  }

  return errors;
}

export function hasBirthErrors(errors: BirthFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** The server-facing birth fields, shared by create and member-add payloads. */
export interface BirthDetailsPayload {
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal?: string;
  birthPlace: string;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezone: string;
  /** "male" | "female"; null for "other" — a wedding-role hint, never a score. */
  genderForTraditionalRules: string | null;
}

/** 12h + AM/PM → "HH:MM:00", matching onboarding's submit path exactly. */
export function to24HourTime(hour12: string, minute: string, ampm: "AM" | "PM"): string | undefined {
  if (!hour12 || !minute) return undefined;
  let h = parseIntOrNaN(hour12);
  const min = parseIntOrNaN(minute);
  if (Number.isNaN(h) || Number.isNaN(min)) return undefined;
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:00`;
}

/**
 * Build the payload. The caller must `validateBirthDetails` first — this trusts
 * `selected` is set and the date parses, and throws otherwise rather than
 * sending coordinate-less or malformed birth data.
 */
export function buildBirthDetailsPayload(form: BirthDetailsFormState): BirthDetailsPayload {
  if (!form.selected) {
    throw new Error("buildBirthDetailsPayload called without a picked place");
  }
  const day = parseIntOrNaN(form.dobDay);
  const month = parseIntOrNaN(form.dobMonth);
  const year = parseIntOrNaN(form.dobYear);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    throw new Error("buildBirthDetailsPayload called with an invalid date");
  }
  const birthDateLocal = `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

  const birthTimeLocal = form.timeUnknown
    ? undefined
    : to24HourTime(form.timeHour, form.timeMin, form.ampm);

  return {
    displayName: form.displayName.trim(),
    birthDateLocal,
    birthTimeLocal,
    birthPlace: form.placeLabel.trim(),
    birthLatitude: form.selected.lat,
    birthLongitude: form.selected.lon,
    birthTimezone: form.timezone.trim() || form.selected.timezone,
    genderForTraditionalRules: form.gender === "other" ? null : form.gender,
  };
}

/** The birth fields that, when any differs, mean the chart must be recast.
 *  `displayName` is excluded — a rename is not a birth-data change and does not
 *  need a recalculation. */
export function birthDetailsChanged(a: BirthDetailsPayload, b: BirthDetailsPayload): boolean {
  return (
    a.birthDateLocal !== b.birthDateLocal ||
    a.birthTimeLocal !== b.birthTimeLocal ||
    a.birthPlace !== b.birthPlace ||
    a.birthLatitude !== b.birthLatitude ||
    a.birthLongitude !== b.birthLongitude ||
    a.birthTimezone !== b.birthTimezone ||
    a.genderForTraditionalRules !== b.genderForTraditionalRules
  );
}

interface SeedProfile {
  displayName?: string;
  birthDateLocal?: string | null;
  birthTimeLocal?: string | null;
  birthPlace?: string | null;
  birthLatitude?: number | null;
  birthLongitude?: number | null;
  birthTimezone?: string | null;
  genderForTraditionalRules?: string | null;
}

/** Seed the form from a saved profile for the edit screen. The reverse of
 *  `buildBirthDetailsPayload`: splits the ISO date and the 24h time back into
 *  the field shapes, and restores the picked-place coordinates so a save that
 *  does not touch the place still carries a valid location. */
export function seedBirthDetailsForm(profile: SeedProfile): BirthDetailsFormState {
  const [yearStr = "", monthStr = "", dayStr = ""] = (profile.birthDateLocal ?? "").split("-");

  let timeUnknown = true;
  let timeHour = "";
  let timeMin = "";
  let ampm: "AM" | "PM" = "AM";
  if (profile.birthTimeLocal) {
    const [hStr = "", mStr = ""] = profile.birthTimeLocal.split(":");
    const h24 = Number.parseInt(hStr, 10);
    const min = Number.parseInt(mStr, 10);
    if (!Number.isNaN(h24) && !Number.isNaN(min)) {
      timeUnknown = false;
      ampm = h24 >= 12 ? "PM" : "AM";
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      timeHour = h12.toString();
      timeMin = min.toString().padStart(2, "0");
    }
  }

  const gender: BirthGender =
    profile.genderForTraditionalRules === "male" || profile.genderForTraditionalRules === "female"
      ? profile.genderForTraditionalRules
      : "other";

  const hasCoords =
    typeof profile.birthLatitude === "number" &&
    typeof profile.birthLongitude === "number" &&
    !!profile.birthTimezone;

  return {
    displayName: profile.displayName ?? "",
    dobDay: dayStr.replace(/^0/, "") || dayStr,
    dobMonth: monthStr.replace(/^0/, "") || monthStr,
    dobYear: yearStr,
    gender,
    timeUnknown,
    timeHour,
    timeMin,
    ampm,
    placeLabel: profile.birthPlace ?? "",
    selected: hasCoords
      ? {
          lat: profile.birthLatitude as number,
          lon: profile.birthLongitude as number,
          timezone: profile.birthTimezone as string,
        }
      : null,
    timezone: profile.birthTimezone ?? "",
  };
}
