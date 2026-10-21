import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CALENDAR_SKY_ART, skyArtFor, skyPhaseAt, type SkyArt, type SkyPhase } from "./sky-phase";

const at = (h: number, m = 0) => new Date(2026, 9, 14, h, m);

describe("skyPhaseAt", () => {
  it.each([
    [0, 0, "night"], [5, 14, "night"], [5, 15, "dawn"], [6, 44, "dawn"],
    [6, 45, "day"], [12, 0, "day"], [17, 29, "day"], [17, 30, "dusk"],
    [18, 59, "dusk"], [19, 0, "night"], [23, 59, "night"],
  ] as const)("%i:%i is %s", (h, m, phase) => {
    expect(skyPhaseAt(at(h, m))).toBe(phase);
  });
});

describe("skyArtFor", () => {
  const night: SkyArt = { src: "/n.png", ground: "dark" };
  const day: SkyArt = { src: "/d.png", ground: "light" };
  const only = (set: Partial<Record<SkyPhase, SkyArt>>) =>
    ({ dawn: null, day: null, dusk: null, night, ...set }) as Record<SkyPhase, SkyArt | null>;

  it("uses the phase's own art when delivered", () => {
    expect(skyArtFor("day", only({ day }))).toBe(day);
  });
  it("dawn borrows day before night; dusk goes to night", () => {
    expect(skyArtFor("dawn", only({ day }))).toBe(day);
    expect(skyArtFor("dusk", only({ day }))).toBe(night);
  });
  it("every phase resolves while only the night master exists", () => {
    for (const phase of ["dawn", "day", "dusk", "night"] as const) expect(skyArtFor(phase, only({}))).toBe(night);
  });
});

describe("calendar sky art on disk", () => {
  // IMG-03 class: a path that 404s is hidden by onError and nobody sees it.
  it("every delivered phase points at a real file", () => {
    for (const art of Object.values(CALENDAR_SKY_ART)) {
      if (!art) continue;
      expect(() => readFileSync(join(__dirname, "..", "public", art.src))).not.toThrow();
    }
  });
});

describe("light theme never fades night art into fog", () => {
  // The defect: `[data-theme="light"] .nova-cal-landscape { opacity: .1 }` turned
  // a night scene into grey haze on cream. Night art on light must be a window.
  const css = readFileSync(join(__dirname, "..", "app", "dashboard", "dashboard-nova.css"), "utf8");
  it("has no blanket light-theme opacity on the landscape", () => {
    expect(css).not.toMatch(/\[data-theme="light"\][^{]*\.nova-cal-landscape\s*\{[^}]*opacity:\s*\.1\b/);
  });
  it("frames dark-ground art on the light theme", () => {
    expect(css).toMatch(/\[data-theme="light"\][^{]*\.nova-cal-closing\[data-sky-ground="dark"\] \.nova-cal-landscape[^{]*\{[^}]*opacity:\s*1;/);
  });
});

describe("the framed window never sits under a control", () => {
  // 2026-10-14 owner screenshot: the header window was absolutely positioned
  // at the header's right edge — exactly where the Panchangam/Monthly/Best
  // Dates switch lives — so the switch floated over the photo. The window must
  // be in flow, after the switch, inside the aside.
  const css = readFileSync(join(__dirname, "..", "app", "dashboard", "dashboard-nova.css"), "utf8");
  const tab = readFileSync(join(__dirname, "..", "components", "dashboard-calendar-tab-nova.tsx"), "utf8");
  it("puts the header window in flow on the opposite ground", () => {
    expect(css).toMatch(/\.nova-cal-monthly-header\[data-sky-ground="dark"\] \.nova-cal-landscape[^{]*\{[^}]*position:\s*relative;/);
  });
  it("renders the scene after the view switch, inside the aside", () => {
    const aside = tab.indexOf('className="nova-cal-header-aside"');
    const seg = tab.indexOf("<Segmented<CalendarViewExt>", aside);
    const scene = tab.indexOf("<MonthlyCalendarLandscape", aside);
    expect(aside).toBeGreaterThan(-1);
    expect(seg).toBeGreaterThan(aside);
    expect(scene).toBeGreaterThan(seg);
  });
});

describe("the opposite-ground scene has one intentional home", () => {
  const css = readFileSync(join(__dirname, "..", "app", "dashboard", "dashboard-nova.css"), "utf8");
  it("does not repeat the night scene beneath the light-theme view switch", () => {
    expect(css).toMatch(/\[data-theme="light"\][^{]*\.nova-cal-monthly-header\[data-sky-ground="dark"\] \.nova-cal-landscape[^{]*\{[^}]*display:\s*none;/);
  });
  it("uses the closing panorama as a full-width background with legible copy", () => {
    expect(css).toMatch(/\.nova-cal-closing\[data-sky-ground="dark"\] \.nova-cal-landscape[^{]*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/);
    expect(css).toMatch(/\.nova-cal-closing\[data-sky-ground="dark"\] p[^{]*\{[^}]*color:\s*#fff;/);
  });
});
