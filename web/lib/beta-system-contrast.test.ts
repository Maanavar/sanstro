/**
 * Light-public-site contrast contract for the beta banner and welcome modal.
 *
 * The site now starts in Light, while beta.css originally kept pale ink that
 * only worked over a dark page. These checks pin the selectors to the Clarity
 * public palette and verify every small-text foreground against the surfaces
 * it can actually touch.
 *
 * Blind spots: this is stylesheet arithmetic, not a browser paint test. It
 * cannot see component opacity, animations, font rendering, or accidental DOM
 * overlap. The gradient is linear between two light endpoints; both endpoints
 * are measured because they bound the background luminance for these dark inks.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { contrast, over, parseColor } from "../scripts/lib/theme-tokens.mjs";

const WEB = join(import.meta.dirname, "..");
const betaCss = readFileSync(join(WEB, "app/beta.css"), "utf8");
const globalsCss = readFileSync(join(WEB, "app/globals.css"), "utf8");

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rules(selector: string) {
  const matches = [...betaCss.matchAll(new RegExp(`${escapeRegex(selector)}\\s*\\{([^}]*)\\}`, "gs"))];
  if (!matches.length) throw new Error(`Missing CSS rule for ${selector}`);
  return matches.map((match) => match[1]);
}

function expectRule(selector: string, declaration: string) {
  expect(rules(selector)).toEqual(expect.arrayContaining([expect.stringContaining(declaration)]));
}

function token(source: string, name: string) {
  const match = source.match(new RegExp(`${escapeRegex(name)}\\s*:\\s*([^;]+);`));
  if (!match) throw new Error(`Missing CSS token ${name}`);
  return match[1].trim();
}

function colourOf(value: string) {
  const parsed = parseColor(value);
  if (!parsed) throw new Error(`Could not parse CSS colour ${value}`);
  return parsed;
}

function tokenRgb(name: string) {
  return colourOf(token(globalsCss, name));
}

function expectAa(foreground: number[], background: number[]) {
  const opaqueBackground = over(background, [255, 255, 255]);
  expect(contrast(over(foreground, opaqueBackground), opaqueBackground)).toBeGreaterThanOrEqual(4.5);
}

describe("beta launch UI on the light marketing site", () => {
  it("uses public-site ink instead of dashboard theme aliases", () => {
    expect(token(betaCss, "--beta-surface")).toBe("var(--cl-surface)");
    expect(token(betaCss, "--beta-text")).toBe("var(--cl-ink)");
    expect(token(betaCss, "--beta-text-soft")).toBe("var(--cl-ink-2)");
    expect(token(betaCss, "--beta-muted")).toBe("var(--cl-muted)");

    expectRule(".beta-banner", "color: var(--beta-text-soft)");
    expectRule(".beta-banner__cta", "color: var(--beta-link)");
    expectRule(".beta-modal", "background: var(--beta-surface)");
    expectRule(".beta-modal", "color: var(--beta-text)");
    expectRule(".beta-modal__body", "color: var(--beta-muted)");
    expect(betaCss).not.toMatch(/var\(--color-(?:surface|text|muted|border)/);
  });

  it("keeps banner text and its link at WCAG AA across the full gradient", () => {
    const grounds = [tokenRgb("--cl-accent-soft"), tokenRgb("--cl-sage-soft")];
    const foregrounds = [
      tokenRgb("--cl-ink-2"),
      tokenRgb("--cl-accent"),
      tokenRgb("--cl-muted"),
    ];

    for (const ground of grounds) {
      for (const foreground of foregrounds) expectAa(foreground, ground);
    }
  });

  it("keeps welcome-panel copy and status marks at WCAG AA", () => {
    const surface = tokenRgb("--cl-surface");
    for (const foreground of [tokenRgb("--cl-ink"), tokenRgb("--cl-muted"), tokenRgb("--cl-sage")]) {
      expectAa(foreground, surface);
    }

    const eyebrowGround = over(colourOf(token(betaCss, "--beta-gold-dark-bg")), surface);
    expectAa(colourOf(token(betaCss, "--beta-gold-dark-text")), eyebrowGround);
  });
});
