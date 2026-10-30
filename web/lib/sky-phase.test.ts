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

describe("the light theme draws night art instead of showing the photo", () => {
  // 10-14: `opacity: .1` turned the night photo into grey fog on cream. 10-28:
  // its replacements — a framed window, then a dark panorama with a black
  // scrim and white copy — read as a navy slab pasted onto the page (owner).
  // On the light theme a dark-ground photo is never shown; the engraving of
  // the same hour (<TempleTankEngraving>) takes its place.
  const css = readFileSync(join(__dirname, "..", "app", "dashboard", "dashboard-nova.css"), "utf8");
  it("has no blanket light-theme opacity on the landscape", () => {
    expect(css).not.toMatch(/\[data-theme="light"\][^{]*\.nova-cal-landscape\s*\{[^}]*opacity:\s*\.1\b/);
  });
  it("hides the dark-ground photo and shows the engraving on the light theme", () => {
    expect(css).toMatch(/\[data-theme="light"\] \.cd-shell \[data-sky-ground="dark"\] \.nova-cal-landscape \{ display: none; \}/);
    expect(css).toMatch(/\[data-theme="light"\] \.cd-shell \[data-sky-ground="dark"\] \.nova-cal-engraving \{[^}]*display: block;/);
  });
  it("puts no scrim and no white copy on the light-theme closing", () => {
    expect(css).not.toMatch(/\[data-theme="light"\][^{]*\.nova-cal-closing\[data-sky-ground="dark"\]::before/);
    expect(css).not.toMatch(/\[data-theme="light"\][^{]*\.nova-cal-closing\[data-sky-ground="dark"\] p[^{]*\{[^}]*color:\s*(#f{3}\b|#f{6}\b|white)/i);
  });
});

describe("the header scene never puts the temple under a control", () => {
  // 10-14: a framed window sat under the Panchangam/Monthly/Best Dates switch.
  // 10-28: the full engraving behind the header stood the switch on the
  // gopuram's crown. The header scene is sky-only; the closing has the temple.
  const tab = readFileSync(join(__dirname, "..", "components", "dashboard-calendar-tab-nova.tsx"), "utf8");
  it("renders the scene after the view switch, inside the aside, as sky only", () => {
    const aside = tab.indexOf('className="nova-cal-header-aside"');
    const seg = tab.indexOf("<Segmented<CalendarViewExt>", aside);
    const scene = tab.indexOf("<MonthlyCalendarLandscape", aside);
    expect(aside).toBeGreaterThan(-1);
    expect(seg).toBeGreaterThan(aside);
    expect(scene).toBeGreaterThan(seg);
    expect(tab.slice(scene, tab.indexOf("/>", scene))).toMatch(/scene="sky"/);
  });
});
