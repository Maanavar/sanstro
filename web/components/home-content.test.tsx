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
