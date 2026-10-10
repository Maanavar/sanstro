import { describe, expect, it } from "vitest";
import { askLimitMessage } from "./dashboard-ask-vinaadi";

// GRW-05 — the limit interstitial once said "your 3 free questions" while the
// server allowed 7, and offered an Upgrade that led to a store badge during an
// open beta that promised every feature was unlocked.
describe("askLimitMessage", () => {
  it("states the server's limit, not a number written into the copy", () => {
    expect(askLimitMessage("en", 7, false)).toContain("7 questions");
    expect(askLimitMessage("en", 2, false)).toContain("2 questions");
    expect(askLimitMessage("ta", 7, false)).toContain("7");
  });

  it("offers no upgrade while the open beta runs", () => {
    expect(askLimitMessage("en", 7, false)).not.toMatch(/upgrade/i);
    expect(askLimitMessage("ta", 7, false)).not.toContain("மேம்படுத்து");
  });

  it("offers an upgrade only when one exists", () => {
    expect(askLimitMessage("en", 7, true)).toMatch(/upgrade/i);
  });

  it("uses the singular for a limit of one", () => {
    expect(askLimitMessage("en", 1, false)).toContain("1 question.");
  });
});
