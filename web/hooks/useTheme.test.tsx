/**
 * The navbar theme toggle (dashboard-hero) and the Appearance segmented control
 * (dashboard-settings-session-tab) both drive this hook and are mounted at the
 * same time. What is worth pinning is therefore not "the attribute changes" —
 * that was already true of the old per-component useState — but that the two
 * consumers cannot disagree.
 *
 * Blind spots, recorded beside the PASS as the repo's gate rule asks:
 *  - Which icon face is painted is decided by CSS off [data-theme] (see
 *    .cd-theme-btn in dashboard.css). jsdom applies no stylesheet, so no test
 *    here can see it; that half is covered by asserting the attribute instead.
 *  - The pre-paint inline script in app/layout.tsx is a duplicate of `resolve()`
 *    written in plain JS inside a template string. Nothing links the two. If one
 *    changes, the other has to be changed by hand.
 */
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTheme } from "./useTheme";

function Consumer({ id }: { id: string }) {
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  return (
    <button type="button" data-testid={id} onClick={toggleTheme}>
      {theme}/{resolvedTheme}
    </button>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  // Default the fake OS to dark, matching the app's own fallback.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  // The store is module-level and survives between tests in one file, so put it
  // back to a known state the way a fresh page load would.
  localStorage.setItem("vinaadi-theme", "system");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useTheme", () => {
  it("resolves the stored choice onto <html> on mount", () => {
    localStorage.setItem("vinaadi-theme", "light");
    render(<Consumer id="a" />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(screen.getByTestId("a").textContent).toBe("light/light");
  });

  it("toggles from what is on screen and writes an explicit choice", () => {
    localStorage.setItem("vinaadi-theme", "dark");
    render(<Consumer id="a" />);

    act(() => { screen.getByTestId("a").click(); });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("vinaadi-theme")).toBe("light");
    expect(screen.getByTestId("a").textContent).toBe("light/light");
  });

  it("flips a 'system' choice to the opposite of what is showing, not back to it", () => {
    // OS says dark (matchMedia light-query = false), choice is "system".
    localStorage.setItem("vinaadi-theme", "system");
    render(<Consumer id="a" />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    act(() => { screen.getByTestId("a").click(); });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("keeps two mounted consumers in sync when either one moves", () => {
    localStorage.setItem("vinaadi-theme", "dark");
    render(
      <>
        <Consumer id="navbar" />
        <Consumer id="settings" />
      </>,
    );

    act(() => { screen.getByTestId("navbar").click(); });

    // The settings control has to have moved too — this is the assertion the
    // old per-component useState implementation failed.
    expect(screen.getByTestId("settings").textContent).toBe("light/light");
    expect(screen.getByTestId("navbar").textContent).toBe("light/light");
  });
});
