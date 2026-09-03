import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DashboardGlossaryPage from "./page";
import { LangProvider } from "@/components/lang-toggle";
import { GLOSSARY } from "@/lib/glossary";

// `LangProvider` calls `useRouter()` to refresh server-rendered copy on a
// language change; jsdom has no app router mounted. One stable object, as
// components/lang-toggle.test.tsx does — a fresh one per call changes the
// reconciliation effect's dependency identity every render and spins.
const router = { refresh: vi.fn(), push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/api", () => ({ apiFetchJson: vi.fn().mockResolvedValue({}) }));

function renderPage(lang: "en" | "ta" = "en") {
  // `LangProvider` reconciles `initialLang` against a stored preference, and it
  // *writes* that preference on mount — so without this an earlier English
  // render in the same file pins every later one to English.
  localStorage.clear();
  return render(
    <LangProvider initialLang={lang}>
      <DashboardGlossaryPage />
    </LangProvider>,
  );
}

/** Tamil script — the cheapest reliable test for "the other language is here". */
const TAMIL = /[஀-௿]/;
/** Latin letters, ignoring only the brand name, which stays Latin in Tamil copy.
 *
 *  "Today" and "Calendar" USED to be allowed here, on the stated grounds that
 *  those tab names render in English on the Tamil dashboard too. They do not —
 *  the tabs are இன்று and நாட்காட்டி in Tamil mode (dashboard-workspace.tsx).
 *  The allowance was untrue, and it was load-bearing: the Tamil intro pointed
 *  readers at "Today, Calendar", i.e. at two words that appear nowhere in the
 *  UI a Tamil reader sees, and this guard was the thing that should have caught
 *  it. An allowlist entry asserting a fact about the product is worth no more
 *  than the fact — all 42 Tamil definitions are Latin-free, so nothing else
 *  needs it. */
const LATIN_WORD = /[A-Za-z]{3,}/;
const TAMIL_MODE_ENGLISH_ALLOWLIST = ["Vinaadi"];

describe("/dashboard/glossary", () => {
  it("renders one index card for every glossary entry", () => {
    const { container } = renderPage();

    expect(screen.getByRole("heading", { name: /^Glossary$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(container.querySelectorAll("article")).toHaveLength(Object.keys(GLOSSARY).length);
  });

  it("includes the daily terms the tooltip system points readers toward", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: /Rahu Kalam/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Panchangam/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Chandrashtama/i })).toBeInTheDocument();
  });

  it("gives every card a deep-link anchor", () => {
    const { container } = renderPage();

    // `GlossaryTerm` can point at a specific definition, not just the top.
    expect(container.querySelector("article#tithi")).toBeTruthy();
    expect(container.querySelector("article#rahuKalam")).toBeTruthy();
  });

  /**
   * The rule this page broke on its first pass, and the reason it is now a
   * client component: the owner has rejected two-languages-at-once twice, and
   * since 2026-07-22 the rule is absolute — no carve-out for "reference" or
   * proper-noun content. A glossary is where that exception feels most
   * reasonable, so it is where it most needs pinning: the first version printed
   * "Glossary / சொற்களஞ்சியம்", "Dasha / தசை", and both definitions of all 42
   * terms, to every reader in either mode.
   */
  describe("renders the active language only", () => {
    it("shows no Tamil anywhere in English mode", () => {
      const { container } = renderPage("en");

      const offenders = Array.from(container.querySelectorAll("h1, h2, p, a"))
        .map((el) => el.textContent ?? "")
        .filter((text) => TAMIL.test(text));

      expect(offenders).toEqual([]);
    });

    it("shows no English prose in Tamil mode", () => {
      const { container } = renderPage("ta");

      const offenders = Array.from(container.querySelectorAll("h1, h2, p, a"))
        .map((el) => (el.textContent ?? "").trim())
        .filter((text) => {
          const stripped = TAMIL_MODE_ENGLISH_ALLOWLIST.reduce(
            (acc, word) => acc.replaceAll(word, ""),
            text,
          );
          return LATIN_WORD.test(stripped);
        });

      expect(offenders).toEqual([]);
    });

    it("switches the definitions themselves, not just the chrome", () => {
      const english = renderPage("en");
      const dashaEn = english.container.querySelector("article#dasha")?.textContent ?? "";
      english.unmount();

      const tamil = renderPage("ta");
      const dashaTa = tamil.container.querySelector("article#dasha")?.textContent ?? "";

      expect(dashaEn).toContain(GLOSSARY.dasha.en);
      expect(dashaEn).not.toContain(GLOSSARY.dasha.ta);
      expect(dashaTa).toContain(GLOSSARY.dasha.ta);
      expect(dashaTa).not.toContain(GLOSSARY.dasha.en);
    });
  });
});

/**
 * FINDABILITY. Until 2026-08-23 the only door into this page was tapping a
 * glossed term — which means it was reachable exactly by the readers who had
 * already worked out that the dotted words are tappable, and unreachable by
 * everyone the page was written for. A glossary nobody can find is a glossary
 * nobody has.
 *
 * The door is the dashboard footer, and it has to be an `<a href>`: the
 * workspace's own nav is tab state inside the `(workspace)` layout and never
 * routes, so a tab-shaped entry could not reach a route that lives outside it.
 * `dashboard-workspace.tsx` is far too heavy to mount here, so this reads the
 * source — the same cheap guard `dashboard-today-tab-nova.test.tsx` uses for
 * the `userMode` prop, and for the same reason: the regression it catches
 * (someone tidies the footer array, the link goes, nothing else notices) is
 * silent everywhere else.
 */
describe("reachable without already knowing it exists", () => {
  it("is linked from the dashboard footer", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("components/dashboard-workspace.tsx", "utf8");

    const footerNav = source.slice(source.indexOf('aria-label={lang === "ta" ? "அடிக்குறிப்பு வழிசெலுத்தல்"'));
    const navBlock = footerNav.slice(0, footerNav.indexOf("</nav>"));

    expect(navBlock).toContain('href: "/dashboard/glossary"');
    // A real navigation, rendered as one. The footer's other entries are
    // buttons because they only change tab state; this one leaves.
    expect(navBlock).toMatch(/<Link[^>]*href=\{link\.href\}/);
  });
});
