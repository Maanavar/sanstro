import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "./page";
import { LangProvider } from "@/components/lang-toggle";

/**
 * GRW-14 — a new account is signed straight in.
 *
 * Signup used to end on "Account created — please sign in", making the person
 * switch tabs and type the password they had just chosen. It now signs in with
 * those credentials and hands over to setup. The neutral register answer is
 * kept: when the sign-in fails (the email already belonged to someone else),
 * the same "account created" screen shows as before, so the page still says
 * nothing about whether the address was known.
 */
const router = { refresh: vi.fn(), push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/api", () => ({ apiFetchJson: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@vinaadi/shared/api/auth", () => ({
  getAuthProviders: vi.fn().mockResolvedValue({ google: false }),
}));
// The welcome curtain animates on canvas; stand it in so the hand-off is visible.
vi.mock("@/components/login-welcome-nova", () => ({
  LoginWelcomeNova: () => <div data-testid="welcome" />,
}));

const PASSWORD = "Tr1cky-Sample-Pass!";

function fillSignup() {
  localStorage.clear();
  render(
    <LangProvider initialLang="en">
      <LoginPage />
    </LangProvider>,
  );
  fireEvent.click(screen.getAllByText("Create account")[0]);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sample.user@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: PASSWORD } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: PASSWORD } });
  fireEvent.click(document.getElementById("ca-consent")!);
  fireEvent.submit(document.querySelector("form")!);
}

function mockFetch(loginOk: boolean) {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith("/auth/register")) return new Response(JSON.stringify({ detail: "ok" }), { status: 200 });
    if (url.endsWith("/auth/login")) return new Response("{}", { status: loginOk ? 200 : 401 });
    return new Response("{}", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("signup", () => {
  it("signs the new account straight in and heads to setup", async () => {
    const fetchMock = mockFetch(true);
    fillSignup();
    await waitFor(() => expect(screen.getByTestId("welcome")).toBeInTheDocument());
    expect(router.prefetch).toHaveBeenCalledWith("/dashboard?setup=1");
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.filter((u) => u.endsWith("/auth/login"))).toHaveLength(1);
    expect(screen.queryByText("Account created")).toBeNull();
  });

  it("falls back to the neutral 'account created' screen when sign-in fails", async () => {
    mockFetch(false);
    fillSignup();
    await waitFor(() => expect(screen.getByText("Account created")).toBeInTheDocument());
    expect(screen.queryByTestId("welcome")).toBeNull();
  });
});
