import { planKalamReminders } from "@/lib/kalamReminders";

const KALAM = {
  rahuKalam: { start: "09:00", end: "10:30" },
  yamagandam: { start: "13:30", end: "15:00" },
};

const atIst = (clock: string) => new Date(`2026-08-23T${clock}+05:30`);
const opts = (now: Date) => ({ now, dateLocal: "2026-08-23", timeZone: "Asia/Kolkata" });

describe("planKalamReminders", () => {
  it("plans a reminder 10 minutes before an opted-in kalam that has not started", () => {
    const plans = planKalamReminders(KALAM, { rahuKalam: true, yamagandam: false }, opts(atIst("08:00:00")));
    expect(plans).toHaveLength(1);
    expect(plans[0].kind).toBe("rahuKalam");
    expect(new Date(plans[0].triggerAt).toISOString()).toBe(atIst("08:50:00").toISOString());
  });

  it("plans nothing for a kalam the reader has not opted into", () => {
    expect(planKalamReminders(KALAM, { rahuKalam: false, yamagandam: false }, opts(atIst("08:00:00")))).toEqual([]);
  });

  it("skips a kalam once its 10-minute lead moment has passed, running or over", () => {
    // 09:05 — inside Rahu Kalam; the 08:50 lead moment is already behind now.
    expect(planKalamReminders(KALAM, { rahuKalam: true, yamagandam: false }, opts(atIst("09:05:00")))).toEqual([]);
    // 11:00 — Rahu Kalam is over.
    expect(planKalamReminders(KALAM, { rahuKalam: true, yamagandam: false }, opts(atIst("11:00:00")))).toEqual([]);
  });

  it("plans both opted-in kalams independently", () => {
    const plans = planKalamReminders(KALAM, { rahuKalam: true, yamagandam: true }, opts(atIst("08:00:00")));
    expect(plans.map((p) => p.kind)).toEqual(["rahuKalam", "yamagandam"]);
  });

  it("never plans Kuligai, even if a caller's prefs object carries a truthy key for it", () => {
    // R5: Kuligai is not a plain avoid period, so it gets no "10 minutes
    // before" reminder — the loop only ever walks KALAM_REMINDER_KINDS,
    // which does not include it, regardless of what `prefs` contains.
    const withStrayKuligai = { rahuKalam: false, yamagandam: false, kuligai: true } as never;
    expect(planKalamReminders(KALAM, withStrayKuligai, opts(atIst("06:00:00")))).toEqual([]);
  });

  it("returns nothing when there is no kalam data yet", () => {
    expect(planKalamReminders(null, { rahuKalam: true, yamagandam: true }, opts(atIst("08:00:00")))).toEqual([]);
    expect(planKalamReminders(undefined, { rahuKalam: true, yamagandam: true }, opts(atIst("08:00:00")))).toEqual([]);
  });
});
