/**
 * The same gate as components/test-environment.test.tsx, from a `.test.ts`.
 *
 * This extension is the one that matters: the broken config gave `.test.ts`
 * node deliberately, so a `.test.tsx`-only gate would still pass if someone
 * reinstated a per-extension split and got it wrong again. The suite now runs
 * one environment for every file, and this asserts that from the `.ts` side.
 *
 * A file that genuinely needs node must say so in its own docblock — see
 * app/dashboard/dashboard-skeleton-theme.test.ts, which reads a real file
 * through `import.meta.url` and cannot work under jsdom.
 */
import { describe, expect, it } from "vitest";

describe("the test environment, from a .test.ts file", () => {
  it("provides a DOM here too, so the suite has one environment", () => {
    expect(typeof document).not.toBe("undefined");
    expect(typeof window).not.toBe("undefined");
  });

  it("can touch the DOM, which is what a .test.ts could not do before", () => {
    document.documentElement.lang = "ta";
    expect(document.documentElement.lang).toBe("ta");
    document.documentElement.lang = "en";
  });
});
