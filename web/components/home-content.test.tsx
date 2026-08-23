import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/**
 * B-001 gave the marketing page a "New to Vedic astrology? Start here" link
 * into `/learn/vedic-vs-western`. The obvious place to put it was the hero,
 * beside the two buttons already there — and that is the thing being guarded
 * against, not guarded for.
 *
 * A hero with three calls to action has no primary call to action: "Get my
 * chart", "How it works" and "Start here" are three different first steps
 * competing at the same weight, and the visitor who cannot choose between them
 * chooses none. So the learn link lives one section down, in the social-proof
 * strip, where it reads as an aside rather than a fork.
 *
 * Both halves matter and each fails silently on its own: a third button in the
 * hero looks perfectly reasonable in a diff, and a learn link that quietly
 * disappears leaves Jake with no entry point at all. These pin the count, the
 * two survivors, and the fact that the link still exists somewhere else.
 */

vi.mock("@/lib/analytics", () => ({
  initAnalytics: vi.fn(),
  getFeatureFlag: vi.fn(() => null),
  track: vi.fn(),
}));

beforeEach(() => {
  // The page fires two stat/panchangam fetches on mount; neither is under test
  // and neither should reach a socket. Left pending rather than rejected — a
  // rejection lands its state update after the test body has finished, which
  // is an act() warning on every case for a code path none of them exercise.
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderHome() {
  const { HomeContent } = await import("./home-content");
  return render(<HomeContent />);
}

function heroActions(container: HTMLElement): HTMLElement {
  const actions = container.querySelector(".cl-hero__actions");
  expect(actions, "hero action row is missing").toBeTruthy();
  return actions as HTMLElement;
}

describe("Marketing hero — calls to action", () => {
  it("offers exactly two calls to action", async () => {
    const { container } = await renderHome();

    const ctas = heroActions(container).querySelectorAll("a, button");
    expect(ctas).toHaveLength(2);
  });

  it("keeps one primary and one secondary, in that order", async () => {
    const { container } = await renderHome();

    const [primary, secondary] = Array.from(
      heroActions(container).querySelectorAll<HTMLAnchorElement>("a"),
    );
    expect(primary.getAttribute("href")).toBe("/dashboard");
    expect(primary.className).toContain("cl-btn--solid");
    expect(secondary.getAttribute("href")).toBe("#how-it-works");
    expect(secondary.className).toContain("cl-btn--ghost");
    // Exactly one thing on this page is styled as the action to take.
    expect(heroActions(container).querySelectorAll(".cl-btn--solid")).toHaveLength(1);
  });

  it("does not put the vedic-vs-western explainer in the hero", async () => {
    const { container } = await renderHome();

    const hero = container.querySelector(".cl-hero") as HTMLElement;
    expect(hero.querySelector('a[href="/learn/vedic-vs-western"]')).toBeNull();
  });
});

describe("Marketing page — the beginner's entry point", () => {
  it("still offers the explainer, one section below the hero", async () => {
    const { container } = await renderHome();

    const learn = container.querySelector<HTMLAnchorElement>(
      'a[href="/learn/vedic-vs-western"]',
    );
    expect(learn, "the vedic-vs-western link has gone missing").toBeTruthy();
    expect(learn!.closest(".cl-hero")).toBeNull();
    expect(learn!.closest(".cl-social-proof")).toBeTruthy();
  });

  it("names the reader it is for, in words that assume no vocabulary", async () => {
    await renderHome();

    await waitFor(() =>
      expect(screen.getByText(/New to Vedic astrology\? Start here/i)).toBeInTheDocument(),
    );
  });
});

/**
 * B-002. The sample card is the only concrete demonstration of the product on
 * the marketing page, and its signal row is five untranslated proper nouns
 * ("Moon Dasa · Moon Bhukti", "Ekadasi · Kettai · Vishkambha"). A visitor with
 * no Vedic vocabulary reads the score, then a wall of names, and learns nothing
 * about what the score was built from.
 *
 * These pin the decode line's existence *and its position*: meaning first, the
 * named terms after it. A note appended below the chips would satisfy a
 * getByText assertion while leaving the reader's first encounter unchanged, so
 * the ordering is asserted structurally, not by text alone.
 */
describe("Marketing sample card — the signal row", () => {
  function signals(container: HTMLElement): HTMLElement {
    const row = container.querySelector(".cl-daily-card__signals");
    expect(row, "the sample card's signal row is missing").toBeTruthy();
    return row as HTMLElement;
  }

  it("decodes the chips in plain language, with no Vedic vocabulary of its own", async () => {
    const { container } = await renderHome();

    const note = signals(container).querySelector(".cl-daily-card__signals-note");
    expect(note, "the chips have no plain-language decode").toBeTruthy();
    const text = note!.textContent ?? "";
    expect(text).toMatch(/life period/i);
    // The decode is worthless if it needs the same vocabulary it is decoding.
    for (const jargon of ["dasa", "bhukti", "tithi", "nakshatra", "yoga", "panchangam"]) {
      expect(text.toLowerCase()).not.toContain(jargon);
    }
  });

  it("puts the plain line before the named terms, not after them", async () => {
    const { container } = await renderHome();

    const row = signals(container);
    const note = row.querySelector(".cl-daily-card__signals-note")!;
    const chips = row.querySelector(".cl-daily-card__chips")!;
    expect(note.compareDocumentPosition(chips) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("still shows the three traditional signals it is decoding", async () => {
    const { container } = await renderHome();

    const chips = signals(container).querySelectorAll(".cl-daily-card__chip");
    expect(chips).toHaveLength(3);
  });
});
