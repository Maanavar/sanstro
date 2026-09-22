import { describe, expect, it } from "vitest";

import { isLocationMismatch, pickCheckIn, timeZoneCityLabel, type CheckIn } from "@vinaadi/shared/checkIn";

describe("pickCheckIn — §2.3, at most one check-in strip per visit", () => {
  it("returns nothing when nothing is owed", () => {
    expect(pickCheckIn({})).toBeNull();
  });

  it("never returns two, even when every signal is due", () => {
    const picked = pickCheckIn({
      locationMismatch: true,
      locationCheckDue: true,
      focusNudgeDue: true,
    });
    expect(picked).toBe("location-mismatch");
  });

  it("puts a timezone mismatch above the backstop", () => {
    // The mismatch says the timings on screen are wrong now; the backstop is a
    // question about upkeep.
    expect(pickCheckIn({ locationMismatch: true, locationCheckDue: true })).toBe("location-mismatch");
  });

  it("puts the location backstop above the focus strip", () => {
    // A wrong location makes the numbers wrong; a stale focus only makes them
    // less pointed.
    expect(pickCheckIn({ locationCheckDue: true, focusNudgeDue: true })).toBe("location-backstop");
  });

  it("falls through to the next claim when the stronger one is dismissed", () => {
    expect(
      pickCheckIn({
        locationMismatch: true,
        focusNudgeDue: true,
        dismissed: ["location-mismatch"],
      }),
    ).toBe("focus");
  });

  it("returns nothing once every owed check-in has been waved away", () => {
    const dismissed: CheckIn[] = ["location-mismatch", "location-backstop", "focus"];
    expect(
      pickCheckIn({
        locationMismatch: true,
        locationCheckDue: true,
        focusNudgeDue: true,
        dismissed,
      }),
    ).toBeNull();
  });
});

describe("isLocationMismatch", () => {
  it("compares zone ids, not offsets", () => {
    // Asia/Kolkata and Asia/Colombo share +05:30 today. The reader's place is
    // what §2 asks about, and the two diverge historically.
    expect(isLocationMismatch("Asia/Colombo", "Asia/Kolkata")).toBe(true);
  });

  it("is quiet when the two agree", () => {
    expect(isLocationMismatch("Asia/Kolkata", "Asia/Kolkata")).toBe(false);
  });

  it("is quiet when either side is missing, so an absent answer never prompts", () => {
    expect(isLocationMismatch(undefined, "Asia/Kolkata")).toBe(false);
    expect(isLocationMismatch("Asia/Kolkata", null)).toBe(false);
    expect(isLocationMismatch("", "")).toBe(false);
  });
});

describe("timeZoneCityLabel", () => {
  it("reads the city out of a zone id and restores its spaces", () => {
    expect(timeZoneCityLabel("Asia/Singapore")).toBe("Singapore");
    expect(timeZoneCityLabel("America/Los_Angeles")).toBe("Los Angeles");
  });

  it("takes the last segment of a three-part zone id", () => {
    expect(timeZoneCityLabel("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
  });

  it("returns an empty string rather than throwing on nothing", () => {
    expect(timeZoneCityLabel(null)).toBe("");
    expect(timeZoneCityLabel(undefined)).toBe("");
    expect(timeZoneCityLabel("")).toBe("");
  });
});
