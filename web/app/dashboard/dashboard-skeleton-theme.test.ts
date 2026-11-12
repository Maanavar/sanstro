/**
 * The stylesheet is located from the working directory, not from
 * `import.meta.url`.
 *
 * It used to be `readFileSync(new URL("./dashboard.css", import.meta.url))`,
 * which forced this one file to run in node: under jsdom `import.meta.url`
 * becomes an `http://localhost/` URL and readFileSync dies with "The URL must
 * be of scheme file". That one exception then had to be carved out of the
 * suite-wide environment AND transform, and a web-transformed module in a node
 * environment fails a second way, on `self is not defined`. Vite's `?raw` is
 * not an option either: vitest stubs CSS imports (`css: false`), so it hands
 * back an empty string and the assertions below fail on a slice of nothing.
 *
 * Walking up from the working directory keeps this file on the same
 * environment and transform as every other test, and it works whether vitest
 * is started from `web/` or from the repo root. It throws a message naming the
 * file it wanted if the stylesheet ever moves, rather than silently reading ""
 * and failing with `expected -1 to be greater than or equal to 0`.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function fromWebRoot(relative: string): string {
  let dir = process.cwd();
  for (let up = 0; up < 6; up += 1) {
    for (const candidate of [path.join(dir, relative), path.join(dir, "web", relative)]) {
      if (existsSync(candidate)) return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`dashboard-skeleton-theme: could not find ${relative} from ${process.cwd()}`);
}

const css = readFileSync(fromWebRoot(path.join("app", "dashboard", "dashboard.css")), "utf8");

describe("dashboard skeleton theme", () => {
  it("uses quiet Nova surfaces rather than the retired cream palette", () => {
    const start = css.indexOf(".cd-skeleton");
    const end = css.indexOf("@media (max-width: 900px)", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const skeletonRules = css.slice(start, end);

    expect(skeletonRules).toContain("color-mix(in srgb, var(--color-text-strong) 8%, transparent)");
    expect(skeletonRules).toContain("color-mix(in srgb, var(--color-text-strong) 14%, transparent)");
    expect(skeletonRules).toContain("background: var(--color-surface);");
    expect(skeletonRules).toContain("border-color: var(--color-border);");
    expect(skeletonRules).not.toMatch(/--panel-(?:cream|tan|tan-light)/);
  });

  it("keeps the chart corner cells distinct from the card they sit on", () => {
    const rule = css.match(/\.cd-main-content \.skel-chart-corner\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).not.toContain("var(--color-surface)");
    expect(rule![1]).toContain("color-mix(in srgb, var(--color-text-strong) 4%, transparent)");
  });
});
