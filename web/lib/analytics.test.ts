// @vitest-environment jsdom
// (`analytics.ts` no-ops entirely when `window` is absent, which is the default
// for a .ts test here — every expectation below would pass vacuously.)
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ALLOWED_PROPERTIES,
  ANALYTICS_EVENTS,
  FORBIDDEN_PROPERTIES,
  isAllowedAnalyticsProperty,
} from "@vinaadi/shared/analytics";

/**
 * The PostHog payload boundary (admin spec §9: "PostHog payload test green").
 *
 * Web is the half that had no boundary at all: `track()` handed its `props`
 * straight to `posthog.capture`, so one call site passing a form object would
 * have sent a birth date, a place and a name to a vendor. Mobile has had an
 * allowlist since it was written; both now share one, and this file tests the
 * shared module as well as the web wrapper around it.
 *
 * The test asserts two different things on purpose:
 * - **Behaviour**: what `track()` does with a hostile payload.
 * - **The allowlist itself**, against a list of forbidden names. A behavioural
 *   test alone only proves today's call sites are clean; it would still pass
 *   the day someone adds `birthDate` to `ALLOWED_PROPERTIES` and starts
 *   sending it deliberately.
 */

const capture = vi.fn();
vi.mock("posthog-js", () => ({
  default: {
    init: vi.fn(),
    capture: (...args: unknown[]) => capture(...args),
    identify: vi.fn(),
    reset: vi.fn(),
    get_property: vi.fn(),
    getFeatureFlag: vi.fn(),
  },
}));

// Imported after the mock, and after the key exists — `track()` no-ops
// entirely without `NEXT_PUBLIC_POSTHOG_KEY`, which would make every
// expectation below pass for the wrong reason.
vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
const { initAnalytics, track } = await import("./analytics");

beforeEach(() => {
  capture.mockClear();
  initAnalytics();
});

describe("the allowlist cannot name forbidden data", () => {
  it("shares no property with the forbidden list", () => {
    const leaked = FORBIDDEN_PROPERTIES.filter((key) => ALLOWED_PROPERTIES.has(key));
    expect(leaked).toEqual([]);
  });

  it("rejects every forbidden property, including through the utm_ prefix rule", () => {
    const accepted = FORBIDDEN_PROPERTIES.filter((key) => isAllowedAnalyticsProperty(key));
    expect(accepted).toEqual([]);
  });

  it("allows utm tags, which are campaign names and not personal data", () => {
    expect(isAllowedAnalyticsProperty("utm_source")).toBe(true);
    expect(isAllowedAnalyticsProperty("utm_campaign")).toBe(true);
    // The prefix rule must not be a wildcard for anything starting with "utm".
    expect(isAllowedAnalyticsProperty("utmBirthDate")).toBe(false);
  });
});

describe("track() strips what it is not allowed to send", () => {
  it("drops birth details, identity and free text from an event that is otherwise fine", () => {
    track("chart_generated", {
      is_first: true,
      language: "ta",
      // Everything below is what a careless call site would pass by spreading
      // the form state it already had in hand.
      name: "Synthetic Person",
      email: "synthetic@example.test",
      phone: "+910000000000",
      birthDate: "1990-01-01",
      birth_time: "06:30",
      birthPlace: "Example City",
      lat: 13.08,
      lon: 80.27,
      rasi: "mesham",
      nakshatra: "ashwini",
      question: "free text the person typed",
      feedback_text: "more free text",
    });

    expect(capture).toHaveBeenCalledWith("chart_generated", { is_first: true, language: "ta" });
  });

  it("sends the event with no properties rather than dropping the count", () => {
    // A typo in one property name must not cost the funnel its event.
    track("paywall_viewed", { triggerFeature: "ask" });
    expect(capture).toHaveBeenCalledWith("paywall_viewed", undefined);
  });

  it("drops an event name that is not in the taxonomy", () => {
    track("birth_chart_opened", { language: "ta" });
    expect(capture).not.toHaveBeenCalled();
  });

  it("keeps the properties the live call sites actually send", () => {
    // Regression guard for the migration itself: web had no filter before, so
    // an allowlist that missed a property in use would silently blank a
    // dimension on a dashboard nobody checks for weeks.
    track("signup_completed", { method: "email", channel: "organic" });
    expect(capture).toHaveBeenCalledWith("signup_completed", { method: "email", channel: "organic" });

    track("share_clicked", { surface: "porutham_link", channel: "whatsapp" });
    expect(capture).toHaveBeenCalledWith("share_clicked", {
      surface: "porutham_link",
      channel: "whatsapp",
    });

    track("feedback_submitted", { category: "review", rating: 5, is_review: true });
    expect(capture).toHaveBeenCalledWith("feedback_submitted", {
      category: "review",
      rating: 5,
      is_review: true,
    });
  });
});

describe("the taxonomy covers the events the code fires", () => {
  it("lists every event name passed to track() anywhere in the web app", async () => {
    const { readFileSync, readdirSync, statSync } = await import("node:fs");
    const path = await import("node:path");

    const walk = (dir: string): string[] => {
      try {
        return readdirSync(dir).flatMap((entry) => {
          const full = path.join(dir, entry);
          if (entry === "node_modules" || entry === ".next") return [];
          if (statSync(full).isDirectory()) return walk(full);
          return /\.tsx?$/.test(full) ? [full] : [];
        });
      } catch {
        return [];
      }
    };

    const roots = ["app", "components", "hooks", "lib"].map((d) => path.join(process.cwd(), d));
    const files = roots.flatMap(walk);

    const fired = new Set<string>();
    for (const file of files) {
      if (file.endsWith("analytics.test.ts")) continue;
      for (const m of readFileSync(file, "utf8").matchAll(/\btrack\(\s*"([a-z0-9_]+)"/g)) {
        fired.add(m[1]);
      }
    }

    // Non-empty, or the regex has rotted and this asserts nothing.
    expect(fired.size).toBeGreaterThan(5);
    expect([...fired].filter((name) => !ANALYTICS_EVENTS.has(name)).sort()).toEqual([]);
  });
});
