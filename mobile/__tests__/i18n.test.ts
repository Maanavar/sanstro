/**
 * Unit tests for i18n utilities — guards against Tamil string lookup failures
 * that would silently render the whole app in English.
 */

import { biText } from "@/lib/i18n";
import { strings } from "@vinaadi/shared";

describe("biText — Tamil mode", () => {
  it("returns Tamil text when isTamil=true", () => {
    expect(biText({ ta: "இன்று", en: "Today" }, true)).toBe("இன்று");
  });

  it("falls back to English when Tamil text is missing", () => {
    expect(biText({ en: "Today" }, true)).toBe("Today");
  });

  it("returns empty fallback for null input", () => {
    expect(biText(null, true)).toBe("");
  });

  it("returns empty fallback for undefined input", () => {
    expect(biText(undefined, true)).toBe("");
  });

  it("returns custom fallback when value is null", () => {
    expect(biText(null, true, "—")).toBe("—");
  });
});

describe("biText — English mode", () => {
  it("returns English text when isTamil=false", () => {
    expect(biText({ ta: "இன்று", en: "Today" }, false)).toBe("Today");
  });

  it("falls back to Tamil when English text is missing", () => {
    expect(biText({ ta: "இன்று" }, false)).toBe("இன்று");
  });

  it("returns empty string for null in English mode", () => {
    expect(biText(null, false)).toBe("");
  });
});

describe("strings — today tab", () => {
  it("today tab has a Tamil label", () => {
    expect(strings.tabs.today.ta).toBe("இன்று");
  });

  it("today tab has an English label", () => {
    expect(strings.tabs.today.en).toBe("Today");
  });
});

describe("strings — all tabs have both languages", () => {
  const tabs = ["today", "panchangam", "tools", "me", "insights"] as const;
  for (const tab of tabs) {
    it(`tabs.${tab} has ta and en`, () => {
      expect(typeof strings.tabs[tab].ta).toBe("string");
      expect(typeof strings.tabs[tab].en).toBe("string");
      expect(strings.tabs[tab].ta.length).toBeGreaterThan(0);
      expect(strings.tabs[tab].en.length).toBeGreaterThan(0);
    });
  }
});

describe("strings — auth keys", () => {
  it("login_title is available in both languages", () => {
    expect(strings.auth.login_title.ta.length).toBeGreaterThan(0);
    expect(strings.auth.login_title.en).toBe("Sign in");
  });
});
