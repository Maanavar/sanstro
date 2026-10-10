import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./dashboard.css", import.meta.url), "utf8");

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
