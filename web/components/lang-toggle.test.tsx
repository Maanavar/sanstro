import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { LangProvider, LangToggle, useLang } from "./lang-toggle";
import { LANG_STORAGE_KEY } from "@/lib/i18n";

/**
 * F7 part two — the guard for a **dead control**.
 *
 * Marketing pages are now Server Components that receive their copy from the
 * server, resolved from the language cookie (`lib/server-lang.ts`). React
 * context can no longer switch them: their text is in the RSC payload, not in
 * component state. `router.refresh()` inside `setLang` is the *only* thing that
 * makes the toggle work on those ~45 routes.
 *
 * Delete that one call and nothing complains. `tsc`, eslint and `next build`
 * all stay green; the unit suite stays green; the toggle keeps working on the
 * handful of pages still reading `useLang()`, so it looks fine in a spot check.
 * The symptom is that the language button silently does nothing on every
 * server-rendered page — the same shape as F7 part one's `sideEffects` field,
 * where one deleted line reverted 477 KB per route with no build error.
 *
 * So this asserts the refresh *behaviourally*, and was verified by removing the
 * `router.refresh()` call and watching it fail, not merely by watching it pass.
 */

const refresh = vi.fn();
// One stable router object, as Next's own `useRouter()` returns — a fresh
// object per call would change the reconciliation effect's dependency identity
// on every render and spin.
const router = { refresh, push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/api", () => ({ apiFetchJson: vi.fn().mockResolvedValue({}) }));

function CurrentLang() {
  const [lang] = useLang();
  return <span data-testid="lang">{lang}</span>;
}

beforeEach(() => {
  refresh.mockClear();
  localStorage.clear();
  document.cookie = `${LANG_STORAGE_KEY}=; path=/; max-age=0`;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LangProvider / LangToggle — server-rendered copy", () => {
  it("refreshes the route when the language changes, or the toggle is a dead control on every server-rendered page", async () => {
    await act(async () => {
      render(
        <LangProvider initialLang="en">
          <LangToggle />
          <CurrentLang />
        </LangProvider>,
      );
    });
    refresh.mockClear(); // ignore any mount-time reconciliation

    await act(async () => {
      screen.getByRole("button", { name: /switch to tamil/i }).click();
    });

    expect(screen.getByTestId("lang").textContent).toBe("ta");
    expect(refresh).toHaveBeenCalled();
  });

  it("writes both stores on change, so the server sees the same language on the next request", async () => {
    await act(async () => {
      render(
        <LangProvider initialLang="en">
          <LangToggle />
        </LangProvider>,
      );
    });

    await act(async () => {
      screen.getByRole("button", { name: /switch to tamil/i }).click();
    });

    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe("ta");
    expect(document.cookie).toContain(`${LANG_STORAGE_KEY}=ta`);
  });

  it("self-heals a stored preference the server could not see", async () => {
    // localStorage never expires; the cookie has a 1-year max-age. A visitor
    // returning after a long gap, or one who cleared cookies only, arrives with
    // a Tamil preference and an English page already rendered by the server.
    // Writing the cookie back is not enough — the copy is in the HTML — so this
    // must also refresh.
    localStorage.setItem(LANG_STORAGE_KEY, "ta");

    await act(async () => {
      render(
        <LangProvider initialLang="en">
          <CurrentLang />
        </LangProvider>,
      );
    });

    expect(screen.getByTestId("lang").textContent).toBe("ta");
    expect(document.cookie).toContain(`${LANG_STORAGE_KEY}=ta`);
    expect(refresh).toHaveBeenCalled();
  });

  it("does not refresh when the stores already agree with the server", async () => {
    // The common case by far. A refresh on every mount would put an RSC
    // round-trip on every navigation for no reason.
    localStorage.setItem(LANG_STORAGE_KEY, "en");

    await act(async () => {
      render(
        <LangProvider initialLang="en">
          <CurrentLang />
        </LangProvider>,
      );
    });

    expect(refresh).not.toHaveBeenCalled();
  });
});
