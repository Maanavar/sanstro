import { describe, expect, it } from "vitest";
import {
  askAllowanceRefilled,
  askLimitMessage,
  askResetWhen,
  type AskAllowanceStatus,
  type UtcOffsetAt,
} from "@vinaadi/shared/askAllowance";

// The quota day is Kolkata's, so the server's reset is always 18:30 UTC.
const RESET = "2026-10-12T18:30:00Z";
const daily = (n: number): AskAllowanceStatus => ({ dailyLimit: n, monthlyLimit: null, resetsAt: RESET });
const at = (iso: string) => new Date(iso);
const fixed = (minutes: number): UtcOffsetAt => () => minutes;
const KOLKATA = fixed(330);
const NEW_YORK_EDT = fixed(-240);
const SINGAPORE = fixed(480);
const LONDON_BST = fixed(60);
// 15:30 in Kolkata, 11:00 in New York, 18:00 in Singapore.
const NOW = at("2026-10-12T10:00:00Z");

// GRW-05 — the limit interstitial once said "your 3 free questions" while the
// server allowed 7, and offered an Upgrade that led to a store badge during an
// open beta that promised every feature was unlocked.
describe("askLimitMessage", () => {
  it("states the server's limit, not a number written into the copy", () => {
    expect(askLimitMessage(daily(7), "en", false, NOW, KOLKATA)).toContain("7 questions");
    expect(askLimitMessage(daily(2), "en", false, NOW, KOLKATA)).toContain("2 questions");
    expect(askLimitMessage(daily(7), "ta", false, NOW, KOLKATA)).toContain("7");
  });

  it("offers no upgrade while the open beta runs", () => {
    expect(askLimitMessage(daily(7), "en", false, NOW, KOLKATA)).not.toMatch(/upgrade/i);
    expect(askLimitMessage(daily(7), "ta", false, NOW, KOLKATA)).not.toContain("மேம்படுத்து");
  });

  it("offers an upgrade only when one exists", () => {
    expect(askLimitMessage(daily(7), "en", true, NOW, KOLKATA)).toMatch(/upgrade/i);
  });

  it("uses the singular for a limit of one", () => {
    expect(askLimitMessage(daily(1), "en", false, NOW, KOLKATA)).toContain("1 question.");
  });

  it("counts a monthly allowance as this month's, not today's", () => {
    const premium = { dailyLimit: null, monthlyLimit: 100, resetsAt: "2026-10-31T18:30:00Z" };
    expect(askLimitMessage(premium, "en", false, NOW, KOLKATA)).toBe(
      "You've used this month's 100 questions. Ask again from 1 Nov.",
    );
    expect(askLimitMessage(premium, "ta", false, NOW, KOLKATA)).toBe(
      "இந்த மாதத்திற்கான 100 கேள்விகளையும் கேட்டுவிட்டீர்கள். நவம்பர் 1 முதல் மீண்டும் கேட்கலாம்.",
    );
    expect(askResetWhen(premium.resetsAt, "en", NOW, NEW_YORK_EDT)).toBe("from 2:30 pm on 31 Oct");
  });
});

// The reset is Kolkata midnight, so "tomorrow" was only true in India.
describe("askResetWhen", () => {
  it("still says tomorrow to a reader whose reset is their own midnight", () => {
    expect(askLimitMessage(daily(7), "en", false, NOW, KOLKATA)).toBe("You've used today's 7 questions. Ask again tomorrow.");
    expect(askLimitMessage(daily(7), "ta", false, NOW, KOLKATA)).toBe(
      "இன்றைக்கான 7 கேள்விகளையும் கேட்டுவிட்டீர்கள். நாளை மீண்டும் கேட்கலாம்.",
    );
  });

  it("names this afternoon for a New York reader", () => {
    expect(askResetWhen(RESET, "en", NOW, NEW_YORK_EDT)).toBe("from 2:30 pm today");
    expect(askResetWhen(RESET, "ta", NOW, NEW_YORK_EDT)).toBe("இன்று மதியம் 2:30 மணிக்குப் பிறகு");
  });

  it("names this evening for a London reader", () => {
    expect(askResetWhen(RESET, "en", NOW, LONDON_BST)).toBe("from 7:30 pm today");
    expect(askResetWhen(RESET, "ta", NOW, LONDON_BST)).toBe("இன்று இரவு 7:30 மணிக்குப் பிறகு");
  });

  it("names the small hours for a Singapore reader, without 'tomorrow night'", () => {
    expect(askResetWhen(RESET, "en", NOW, SINGAPORE)).toBe("from 2:30 am tomorrow");
    expect(askResetWhen(RESET, "ta", NOW, SINGAPORE)).toBe("நாளை அதிகாலை 2:30 மணிக்குப் பிறகு");
  });

  it("calls just after midnight அதிகாலை, not நள்ளிரவு (native review A-04)", () => {
    // Dhaka, UTC+6: the reset at 18:30Z is 00:30 the next day. "நாளை நள்ளிரவு
    // 12:30" can be read as tomorrow's midnight.
    expect(askResetWhen(RESET, "ta", NOW, fixed(360))).toBe("நாளை அதிகாலை 12:30 மணிக்குப் பிறகு");
    // 05:30 is still அதிகாலை under the review, though the app-wide buckets say காலை.
    expect(askResetWhen(RESET, "ta", NOW, fixed(660))).toBe("நாளை அதிகாலை 5:30 மணிக்குப் பிறகு");
  });

  it("reads each instant's own offset across a DST change", () => {
    // New York leaves EDT at 06:00Z on 2026-11-01. At 03:00Z it is still
    // 23:00 on Oct 31; the reset at 18:30Z is 13:30 EST the next day.
    const newYork: UtcOffsetAt = (d) => (d.getTime() < Date.parse("2026-11-01T06:00:00Z") ? -240 : -300);
    expect(askResetWhen("2026-11-01T18:30:00Z", "en", at("2026-11-01T03:00:00Z"), newYork)).toBe("from 1:30 pm tomorrow");
  });

  it("falls back to tomorrow when an older server sends no instant", () => {
    expect(askResetWhen(undefined, "en", NOW, NEW_YORK_EDT)).toBe("tomorrow");
  });
});

describe("askAllowanceRefilled", () => {
  it("lifts a client-side block once the reset instant has passed", () => {
    expect(askAllowanceRefilled(RESET, at("2026-10-12T18:29:59Z"))).toBe(false);
    expect(askAllowanceRefilled(RESET, at("2026-10-12T18:30:00Z"))).toBe(true);
    expect(askAllowanceRefilled(undefined, NOW)).toBe(false);
  });
});
