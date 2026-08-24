/**
 * B-006 — `matched` used to be re-derived every render by looking the current
 * place/lat/lng up in a static city array; that array is gone. These pin the
 * replacement contract: an existing saved place+coordinates starts matched
 * (badge, not raw fields) and a blank one starts unmatched, and the caller's
 * combobox selection is what flips it either way afterwards.
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePlaceCoordinatesConfirm } from "./place-coordinates-field";

describe("usePlaceCoordinatesConfirm", () => {
  it("starts matched (badge, not raw fields) when the field already carries a saved place and coordinates", () => {
    const { result } = renderHook(() =>
      usePlaceCoordinatesConfirm("Chennai, Tamil Nadu, India", "13.0667", "80.2833"),
    );
    expect(result.current.matched).toBe(true);
    expect(result.current.showRawFields).toBe(false);
  });

  it("starts unmatched (raw fields) for a blank field", () => {
    const { result } = renderHook(() => usePlaceCoordinatesConfirm("", "", ""));
    expect(result.current.matched).toBe(false);
    expect(result.current.showRawFields).toBe(true);
  });

  it("setMatched(false) — a live combobox selection reporting no match — flips to raw fields", () => {
    const { result } = renderHook(() =>
      usePlaceCoordinatesConfirm("Chennai, Tamil Nadu, India", "13.0667", "80.2833"),
    );
    act(() => result.current.setMatched(false));
    expect(result.current.showRawFields).toBe(true);
  });

  it("editing stays true regardless of matched, until the caller turns it off again", () => {
    const { result } = renderHook(() =>
      usePlaceCoordinatesConfirm("Chennai, Tamil Nadu, India", "13.0667", "80.2833"),
    );
    act(() => result.current.setEditing(true));
    expect(result.current.showRawFields).toBe(true);
    act(() => result.current.setEditing(false));
    expect(result.current.showRawFields).toBe(false);
  });
});
