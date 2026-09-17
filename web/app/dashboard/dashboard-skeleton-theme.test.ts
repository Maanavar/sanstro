import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./dashboard.css", import.meta.url), "utf8");

describe("dashboard skeleton theme", () => {
  it("uses quiet Nova surfaces rather than the retired cream palette", () => {
    const skeletonRules = css.slice(css.indexOf(".cd-skeleton"), css.indexOf("@media (max-width: 900px)"));

    expect(skeletonRules).toContain("color-mix(in srgb, var(--color-text-strong) 8%, transparent)");
    expect(skeletonRules).toContain("color-mix(in srgb, var(--color-text-strong) 14%, transparent)");
    expect(skeletonRules).toContain("background: var(--color-surface);");
    expect(skeletonRules).toContain("border-color: var(--color-border);");
    expect(skeletonRules).not.toMatch(/--panel-(?:cream|tan|tan-light)/);
  });
});
