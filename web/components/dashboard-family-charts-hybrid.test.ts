import { describe, expect, it } from "vitest";

import { cycleText } from "@/lib/sani-cycle-card";
import type { SaniCycleData } from "@/lib/types";

type Cycle = SaniCycleData["moonBasedCycle"];

describe("family Sani cycle copy", () => {
  it("frames Sade Sati with prevalence and concrete action", () => {
    const text = cycleText({ type: "JANMA_SANI", isActive: true, supportiveLabel: null } as Cycle, "en");

    expect(text.scope).toContain("7.5-year");
    expect(text.phase).toBe("Peak phase");
    expect(text.prevalence).toContain("almost everyone");
    expect(text.action).toContain("Keep decisions paced");
  });

  it("keeps Lagna-only pressure as a secondary cross-check", () => {
    const text = cycleText({ type: "KANTAKA_SANI", isActive: true, supportiveLabel: null } as Cycle, "en");

    expect(text.scope).toBe("Secondary Lagna cross-check");
    expect(text.action).toContain("not the main verdict");
  });
});

describe("Dasha panel title wiring (T20)", () => {
  it("uses the plain-language life-period title from the shared copy", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("components/dashboard-family-charts-hybrid.tsx", "utf8");

    expect(source).toContain('title={dt(DASHA_PANEL.title, lang)}');
    expect(source).toContain('sub={dt(DASHA_PANEL.subtitle, lang)}');
    expect(source).not.toContain('title={lang === "ta" ? "தசா & காலவரிசை" : "Dashas & timeline"}');
  });
});
