/**
 * The rendered easing census is deliberately limited to transitions in
 * top-level English panes. This source ratchet catches bare `ease` in the
 * Nova dashboard, including animations and unvisited tool surfaces that the
 * browser census cannot observe.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const BARE_EASE = /\b\d*\.?\d+m?s\s+ease(?!-)/g;
const COMPONENTS = ["components/guide-cards.tsx", "components/natchathiram-visual.tsx"];

export function bareEaseTimings(source: string): string[] {
  return [...source.matchAll(BARE_EASE)].map((match) => match[0]);
}

function dashboardComponents(dir = "components"): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "ui" ? dashboardComponents(file) : [];
    return entry.isFile() && /^dashboard-.*\.tsx$/.test(entry.name) ? [file] : [];
  });
}

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
    .map((entry) => path.join(dir, entry.name));
}

function scan(): Map<string, string[]> {
  const files = [
    "app/globals.css",
    ...cssFiles("app/dashboard"),
    ...cssFiles("components"),
    ...dashboardComponents(),
    ...COMPONENTS,
  ];
  const hits = new Map<string, string[]>();
  for (const file of files) {
    const timings = bareEaseTimings(readFileSync(file, "utf8"));
    if (timings.length) hits.set(file.split(path.sep).join("/"), timings);
  }
  return hits;
}

describe("dashboard motion source boundary (DXA-16)", () => {
  it("uses a Nova token instead of bare ease in dashboard source", () => {
    expect(
      [...scan().entries()],
      "Use var(--ease-nova) for CSS and EASE_NOVA for Framer transitions. Bare ease can hide in animations the browser census does not sample.",
    ).toEqual([]);
  });

  it("matches bare ease but permits explicitly chosen named curves", () => {
    expect(bareEaseTimings("transition: opacity 120ms ease;")).toEqual(["120ms ease"]);
    expect(bareEaseTimings("animation: rise .3s ease-in-out; transition: opacity 120ms ease-out;")).toEqual([]);
  });
});
