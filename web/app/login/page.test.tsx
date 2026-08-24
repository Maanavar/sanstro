import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import LoginPage from "./page";
import { LangProvider } from "@/components/lang-toggle";

/**
 * A-004 — the login page speaks ONE language.
 *
 * The left branding panel was made bilingual while the form was not, which left
 * the page worse off than the English-only version it replaced: a Tamil reader
 * was greeted in Tamil and then handed an English form, with a `lang="en"`
 * hard-wired into the guest-chart modal and no language control anywhere on the
 * page to resolve the contradiction. A structural test could not see this — the
 * page rendered, the form worked — so these read the rendered words.
 */
const router = { refresh: vi.fn(), push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/api", () => ({ apiFetchJson: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
// Google SSO is fetched on mount; without this the promise rejects noisily.
vi.mock("@vinaadi/shared/api/auth", () => ({
  getAuthProviders: vi.fn().mockResolvedValue({ google: false }),
}));

function renderLogin(lang: "en" | "ta" = "en") {
  // `LangProvider` *writes* its resolved preference on mount, so without this
  // an earlier English render in the same file pins every later one to English.
  localStorage.clear();
  return render(
    <LangProvider initialLang={lang}>
      <LoginPage />
    </LangProvider>,
  );
}

const TAMIL = /[஀-௿]/;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("login page — language", () => {
  it("renders the form in Tamil, not just the branding panel", () => {
    renderLogin("ta");
    const form = document.querySelector("form")!;
    expect(TAMIL.test(form.textContent ?? "")).toBe(true);
  });

  it("leaves no English form control behind on the Tamil page", () => {
    // The exact split that shipped: Tamil headline, English "Email" /
    // "Password" / "Sign in".
    renderLogin("ta");
    expect(screen.queryByText("Email")).toBeNull();
    expect(screen.queryByText("Password")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
  });

  it("translates the submit button, the tabs and the heading together", () => {
    renderLogin("ta");
    expect(screen.getByText("மீண்டும் வருக")).toBeInTheDocument();
    expect(screen.getAllByText("உள்நுழைக").length).toBeGreaterThan(0);
    expect(screen.getByText("கணக்கு உருவாக்கு")).toBeInTheDocument();
  });

  it("still renders wholly in English when English is chosen", () => {
    renderLogin("en");
    const form = document.querySelector("form")!;
    expect(TAMIL.test(form.textContent ?? "")).toBe(false);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("offers a language control, so a first-time visitor can choose", () => {
    // The preference used to be readable only from localStorage — set on some
    // other page. A visitor whose first stop is /login had no way to reach it.
    renderLogin("en");
    expect(screen.getByRole("button", { name: /Switch to Tamil/i })).toBeInTheDocument();
  });

  it("hands the guest-chart modal the reader's language, not a hardcoded 'en'", () => {
    renderLogin("ta");
    fireEvent.click(screen.getByText("முதலில் ஒரு ஜாதகம் பாருங்கள் — கணக்கு தேவையில்லை"));
    const dialog = document.querySelector("[role='dialog']") ?? document.body;
    expect(TAMIL.test(dialog.textContent ?? "")).toBe(true);
  });
});

describe("login page — validation copy", () => {
  it("shows the inline email error in Tamil", () => {
    renderLogin("ta");
    fireEvent.change(screen.getByLabelText("மின்னஞ்சல்"), { target: { value: "nope" } });
    expect(screen.getByRole("alert").textContent).toMatch(TAMIL);
  });

  it("shows the submit-blocked error in Tamil rather than English", () => {
    renderLogin("ta");
    fireEvent.change(screen.getByLabelText("மின்னஞ்சல்"), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText("கடவுச்சொல்"), { target: { value: "short" } });
    fireEvent.submit(document.querySelector("form")!);
    const banner = document.querySelector(".ca-error")!;
    expect(TAMIL.test(banner.textContent ?? "")).toBe(true);
  });

  it("translates the password requirement checklist", () => {
    // `estimatePasswordStrength` has accepted a `lang` since it was written;
    // this page passed "en" regardless, so the four requirement lines and the
    // strength label stayed English under a Tamil form.
    renderLogin("ta");
    fireEvent.click(screen.getByText("கணக்கு உருவாக்கு"));
    fireEvent.change(screen.getByLabelText("கடவுச்சொல்"), { target: { value: "abc" } });
    const reqs = document.querySelector("#ca-password-reqs")!;
    expect(TAMIL.test(reqs.textContent ?? "")).toBe(true);
    expect(within(reqs as HTMLElement).queryByText(/At least 8 characters/i)).toBeNull();
  });
});

describe("login page — the method claim", () => {
  it("names Thirukanitham rather than gesturing at 'a traditional method'", () => {
    // The plain-language pass replaced "Thirukanitham accuracy — Lahiri
    // ayanamsa, Drik ephemeris" with "an established traditional method",
    // dropping the one fact a Tamil astrology reader checks: drik ganita vs
    // vakya. Those two disagree by days on festival dates.
    renderLogin("en");
    expect(screen.getByText(/Thirukanitham method/i)).toBeInTheDocument();
    expect(screen.getByText(/drik ganita/i)).toBeInTheDocument();
    expect(screen.getByText(/Lahiri ayanamsa/i)).toBeInTheDocument();
  });

  it("keeps the claim in Tamil too", () => {
    renderLogin("ta");
    expect(screen.getByText(/திருக்கணித முறை/)).toBeInTheDocument();
  });
});
