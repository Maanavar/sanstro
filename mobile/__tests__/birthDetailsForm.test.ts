/**
 * The birth-input logic shared by the add-member and member-edit screens
 * (audit F-series follow-up). Proves the parts easy to get subtly wrong: the
 * date-of-birth bounds, the 12h/AM-PM ↔ 24h round-trip, and the rule that a
 * place is a label AND coordinates — typing alone is never a location.
 *
 * Blind spot: pure logic only. The <BirthDetailsFields> component's rendering,
 * the place-search debounce and the screens' submit wiring are not exercised
 * here.
 */
import {
  buildBirthDetailsPayload,
  birthDetailsChanged,
  emptyBirthDetailsForm,
  hasBirthErrors,
  seedBirthDetailsForm,
  to24HourTime,
  validateBirthDetails,
  type BirthDetailsFormState,
} from "../src/lib/birthDetailsForm";

const CHENNAI = { lat: 13.0827, lon: 80.2707, timezone: "Asia/Kolkata" };

function form(over: Partial<BirthDetailsFormState> = {}): BirthDetailsFormState {
  return {
    ...emptyBirthDetailsForm,
    displayName: "Valli",
    dobDay: "5",
    dobMonth: "4",
    dobYear: "1990",
    timeUnknown: false,
    timeHour: "9",
    timeMin: "30",
    ampm: "AM",
    placeLabel: "Chennai, Tamil Nadu, India",
    selected: CHENNAI,
    timezone: "Asia/Kolkata",
    ...over,
  };
}

describe("validateBirthDetails", () => {
  it("passes a complete form", () => {
    expect(hasBirthErrors(validateBirthDetails(form()))).toBe(false);
  });

  it("requires a name unless told otherwise", () => {
    expect(validateBirthDetails(form({ displayName: "  " }))).toEqual({ name: "name_required" });
    expect(validateBirthDetails(form({ displayName: "  " }), { requireName: false })).toEqual({});
  });

  it("rejects impossible dates", () => {
    expect(validateBirthDetails(form({ dobDay: "31", dobMonth: "2", dobYear: "1990" })).date).toBe("date_invalid");
    expect(validateBirthDetails(form({ dobMonth: "13" })).date).toBe("date_invalid");
    expect(validateBirthDetails(form({ dobYear: "1800" })).date).toBe("date_invalid");
    expect(validateBirthDetails(form({ dobYear: String(new Date().getFullYear() + 1) })).date).toBe("date_invalid");
    expect(validateBirthDetails(form({ dobDay: "5abc" })).date).toBe("date_invalid");
  });

  it("distinguishes an empty place from an unpicked one", () => {
    expect(validateBirthDetails(form({ placeLabel: "", selected: null })).place).toBe("place_required");
    // Typed text but never picked a suggestion — no coordinates.
    expect(validateBirthDetails(form({ placeLabel: "Somewhere", selected: null })).place).toBe("place_not_selected");
  });

  it("checks the time only when it is claimed to be known", () => {
    expect(validateBirthDetails(form({ timeHour: "13" })).time).toBe("time_invalid");
    expect(validateBirthDetails(form({ timeMin: "60" })).time).toBe("time_invalid");
    expect(validateBirthDetails(form({ timeHour: "", timeMin: "" })).time).toBe("time_invalid");
    // Unknown time is valid: an approximate chart is allowed.
    expect(validateBirthDetails(form({ timeUnknown: true, timeHour: "", timeMin: "" })).time).toBeUndefined();
  });
});

describe("to24HourTime", () => {
  it("converts around the 12/24 boundaries", () => {
    expect(to24HourTime("12", "30", "AM")).toBe("00:30:00"); // midnight
    expect(to24HourTime("12", "00", "PM")).toBe("12:00:00"); // noon
    expect(to24HourTime("9", "05", "AM")).toBe("09:05:00");
    expect(to24HourTime("9", "5", "PM")).toBe("21:05:00");
  });

  it("returns undefined for an incomplete time", () => {
    expect(to24HourTime("", "30", "AM")).toBeUndefined();
    expect(to24HourTime("9", "", "AM")).toBeUndefined();
  });
});

describe("buildBirthDetailsPayload", () => {
  it("builds a padded ISO date, 24h time and gender mapping", () => {
    expect(buildBirthDetailsPayload(form({ dobDay: "5", dobMonth: "4", gender: "female" }))).toEqual({
      displayName: "Valli",
      birthDateLocal: "1990-04-05",
      birthTimeLocal: "09:30:00",
      birthPlace: "Chennai, Tamil Nadu, India",
      birthLatitude: 13.0827,
      birthLongitude: 80.2707,
      birthTimezone: "Asia/Kolkata",
      genderForTraditionalRules: "female",
    });
  });

  it("maps 'other' gender to null and omits an unknown time", () => {
    const payload = buildBirthDetailsPayload(form({ gender: "other", timeUnknown: true }));
    expect(payload.genderForTraditionalRules).toBeNull();
    expect(payload.birthTimeLocal).toBeUndefined();
  });

  it("prefers the editable timezone chip over the picked zone", () => {
    expect(buildBirthDetailsPayload(form({ timezone: "America/New_York" })).birthTimezone).toBe("America/New_York");
    // A blank chip falls back to the picked place's zone.
    expect(buildBirthDetailsPayload(form({ timezone: "  " })).birthTimezone).toBe("Asia/Kolkata");
  });

  it("refuses to build without a picked place", () => {
    expect(() => buildBirthDetailsPayload(form({ selected: null }))).toThrow();
  });
});

describe("seedBirthDetailsForm round-trips with buildBirthDetailsPayload", () => {
  it("restores fields, coordinates and a PM time", () => {
    const seeded = seedBirthDetailsForm({
      displayName: "Murugan",
      birthDateLocal: "1985-12-09",
      birthTimeLocal: "21:05:00",
      birthPlace: "Madurai, Tamil Nadu, India",
      birthLatitude: 9.9252,
      birthLongitude: 78.1198,
      birthTimezone: "Asia/Kolkata",
      genderForTraditionalRules: "male",
    });
    expect(seeded.ampm).toBe("PM");
    expect(seeded.timeHour).toBe("9");
    expect(hasBirthErrors(validateBirthDetails(seeded))).toBe(false);
    expect(buildBirthDetailsPayload(seeded)).toEqual({
      displayName: "Murugan",
      birthDateLocal: "1985-12-09",
      birthTimeLocal: "21:05:00",
      birthPlace: "Madurai, Tamil Nadu, India",
      birthLatitude: 9.9252,
      birthLongitude: 78.1198,
      birthTimezone: "Asia/Kolkata",
      genderForTraditionalRules: "male",
    });
  });

  it("treats a missing time as unknown and a missing gender as 'other'", () => {
    const seeded = seedBirthDetailsForm({
      displayName: "No Time",
      birthDateLocal: "2000-01-01",
      birthTimeLocal: null,
      birthPlace: "Chennai",
      birthLatitude: 13.0827,
      birthLongitude: 80.2707,
      birthTimezone: "Asia/Kolkata",
      genderForTraditionalRules: null,
    });
    expect(seeded.timeUnknown).toBe(true);
    expect(seeded.gender).toBe("other");
  });

  it("leaves the place unpicked when coordinates are missing", () => {
    const seeded = seedBirthDetailsForm({ displayName: "x", birthDateLocal: "2000-01-01", birthPlace: "Nowhere" });
    expect(seeded.selected).toBeNull();
    expect(validateBirthDetails(seeded).place).toBe("place_not_selected");
  });
});

describe("birthDetailsChanged", () => {
  const base = buildBirthDetailsPayload(form());
  it("ignores a rename", () => {
    expect(birthDetailsChanged(base, { ...base, displayName: "Renamed" })).toBe(false);
  });
  it("sees a moved birth place, a new time and a new date", () => {
    expect(birthDetailsChanged(base, { ...base, birthDateLocal: "1991-04-05" })).toBe(true);
    expect(birthDetailsChanged(base, { ...base, birthTimeLocal: "10:00:00" })).toBe(true);
    expect(birthDetailsChanged(base, { ...base, birthLatitude: 11.0 })).toBe(true);
    // base gender is "male" (the form default); a real switch is female/null.
    expect(birthDetailsChanged(base, { ...base, genderForTraditionalRules: "female" })).toBe(true);
  });
});
