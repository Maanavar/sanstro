import { describe, expect, it } from "vitest";

import { resolveKalamStatus } from "./kalam-live";

const KALAM = {
  rahuKalam: { start: "09:00", end: "10:30", slot: 2 },
  yamagandam: { start: "13:30", end: "15:00", slot: 5 },
  kuligai: { start: "06:00", end: "07:30", slot: 1 },
};

const atIst = (clock: string) => new Date(`2026-08-23T${clock}+05:30`);

describe("resolveKalamStatus", () => {
  it("finds Yamagandam after Rahu Kalam has ended", () => {
    const result = resolveKalamStatus(KALAM, {
      now: atIst("14:00:00"),
      dateLocal: "2026-08-23",
      timeZone: "Asia/Kolkata",
      isToday: true,
    });

    expect(result.current?.key).toBe("yamagandam");
    expect(result.current?.phase).toBe("during");
  });

  it("uses Rahu, then Yama, then Kuligai when periods overlap", () => {
    const overlap = {
      rahuKalam: { start: "09:00", end: "10:30", slot: 1 },
      yamagandam: { start: "09:15", end: "10:45", slot: 2 },
      kuligai: { start: "09:30", end: "11:00", slot: 3 },
    };

    expect(resolveKalamStatus(overlap, {
      now: atIst("09:45:00"),
      dateLocal: "2026-08-23",
      timeZone: "Asia/Kolkata",
      isToday: true,
    }).current?.key).toBe("rahuKalam");

    expect(resolveKalamStatus(overlap, {
      now: atIst("10:35:00"),
      dateLocal: "2026-08-23",
      timeZone: "Asia/Kolkata",
      isToday: true,
    }).current?.key).toBe("yamagandam");
  });

  it("returns the next chronological period when none is running", () => {
    const result = resolveKalamStatus(KALAM, {
      now: atIst("08:30:00"),
      dateLocal: "2026-08-23",
      timeZone: "Asia/Kolkata",
      isToday: true,
    });

    expect(result.current).toBeNull();
    expect(result.next?.key).toBe("rahuKalam");
    expect(result.next?.phase).toBe("before");
  });
});
