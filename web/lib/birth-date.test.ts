import { describe, expect, it } from "vitest";
import { isBirthDateWithinBounds, MIN_BIRTH_DATE } from "./birth-date";

describe("MIN_BIRTH_DATE", () => {
  it("is 1900-01-01", () => {
    expect(MIN_BIRTH_DATE).toBe("1900-01-01");
  });
});

describe("isBirthDateWithinBounds", () => {
  it("accepts a valid date within range", () => {
    expect(isBirthDateWithinBounds("1990-06-15")).toBe(true);
  });
  it("accepts the minimum bound exactly", () => {
    expect(isBirthDateWithinBounds("1900-01-01")).toBe(true);
  });
  it("accepts today", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(isBirthDateWithinBounds(today)).toBe(true);
  });
  it("rejects a year before 1900", () => {
    expect(isBirthDateWithinBounds("1899-12-31")).toBe(false);
  });
  it("rejects a future year", () => {
    const future = `${new Date().getFullYear() + 1}-01-01`;
    expect(isBirthDateWithinBounds(future)).toBe(false);
  });
  it("returns true for empty string (treated as no value)", () => {
    expect(isBirthDateWithinBounds("")).toBe(true);
  });
  it("returns false for non-date string", () => {
    expect(isBirthDateWithinBounds("not-a-date")).toBe(false);
  });
});
