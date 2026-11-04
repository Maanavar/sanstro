import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { SupportView } from "@vinaadi/shared/api";
import { AdminSupportPanel } from "./admin-support-panel";

/**
 * The support panel (admin spec L9).
 *
 * What is worth holding here is not the layout but the four rules an agent
 * could otherwise break by accident: no action without a reason, the 30-day
 * cap is visible to support, revoke is owner-only, and the reset link is
 * never shown.
 */

function view(overrides: Partial<SupportView> = {}): SupportView {
  return {
    account: {
      user_id: "11111111-1111-1111-1111-111111111111",
      email: "synthetic@example.test",
      email_verified: true,
      user_mode: "BALANCED",
      is_suspended: false,
      suspension_reason: null,
      created_at: "2026-01-02T03:04:05+00:00",
      last_seen_on: "2026-11-03",
      last_platform: "ios",
      last_language: "ta",
      acquisition: {
        source: null,
        medium: null,
        campaign: null,
        ref: null,
        referrer_host: null,
        landing_path: null,
      },
    },
    access: { state: "premium", trial_ends_at: null, sources: ["purchase"] },
    entitlements: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        key: "premium",
        source: "purchase",
        source_id: null,
        starts_at: "2026-10-01T00:00:00+00:00",
        ends_at: "2026-12-01T00:00:00+00:00",
        revoked_at: null,
        revoked_reason: null,
        granted_by: null,
        is_active: true,
      },
    ],
    subscriptions: [],
    orders: [],
    payments: [],
    refunds: [],
    credits: [],
    consents: { service: true, updates: false, analytics: false, ask_improve: false },
    adult_declared: true,
    ...overrides,
  };
}

function panel(props: Partial<React.ComponentProps<typeof AdminSupportPanel>> = {}) {
  const handlers = {
    onResetLink: vi.fn(),
    onForceLogout: vi.fn(),
    onGrant: vi.fn(),
    onRevoke: vi.fn(),
  };
  render(
    <AdminSupportPanel
      view={view()}
      role="support"
      busy={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("no action fires without a reason", () => {
  it("keeps the account actions disabled until one is written", async () => {
    const handlers = panel();

    expect(screen.getByRole("button", { name: /email a reset link/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /end every session/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Action reason"), { target: { value: "caller cannot sign in after changing phone" } });

    const reset = screen.getByRole("button", { name: /email a reset link/i });
    expect(reset).toBeEnabled();
    fireEvent.click(reset);
    expect(handlers.onResetLink).toHaveBeenCalledWith(
      "caller cannot sign in after changing phone",
    );
  });

  it("does not accept a single keystroke as a reason", async () => {
    panel();
    fireEvent.change(screen.getByLabelText("Action reason"), { target: { value: "x" } });
    expect(screen.getByRole("button", { name: /end every session/i })).toBeDisabled();
  });

  it("keeps the grant button disabled until days and a reason are both there", async () => {
    const handlers = panel();
    const grant = screen.getByRole("button", { name: /grant premium/i });
    expect(grant).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Grant reason"), { target: { value: "goodwill after a failed report" } });
    expect(grant).toBeEnabled();
    fireEvent.click(grant);
    expect(handlers.onGrant).toHaveBeenCalledWith("premium", 7, "goodwill after a failed report");
  });
});

describe("the cap and the owner-only action", () => {
  it("tells support what its limit is, rather than letting the server say no", async () => {
    panel({ role: "support" });
    expect(screen.getByText(/up to 30 days/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Days"), { target: { value: "31" } });
    fireEvent.change(screen.getByLabelText("Grant reason"), { target: { value: "caller asked for a year" } });

    expect(screen.getByRole("button", { name: /grant premium/i })).toBeDisabled();
  });

  it("lets an owner past 30 days", async () => {
    const handlers = panel({ role: "owner" });
    fireEvent.change(screen.getByLabelText("Days"), { target: { value: "365" } });
    fireEvent.change(screen.getByLabelText("Grant reason"), { target: { value: "founding member" } });

    fireEvent.click(screen.getByRole("button", { name: /grant premium/i }));
    expect(handlers.onGrant).toHaveBeenCalledWith("premium", 365, "founding member");
  });

  it("shows no revoke control to support", () => {
    panel({ role: "support" });
    expect(screen.queryByRole("button", { name: /^revoke$/i })).not.toBeInTheDocument();
  });

  it("asks an owner for a reason before revoking", async () => {
    const handlers = panel({ role: "owner" });

    fireEvent.click(screen.getByRole("button", { name: /^revoke$/i }));
    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Revocation reason"), { target: { value: "granted to the wrong account" } });
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(handlers.onRevoke).toHaveBeenCalledWith(
      "22222222-2222-2222-2222-222222222222",
      "granted to the wrong account",
    );
  });
});

describe("what the screen says and does not say", () => {
  it("says why the account has the access it has", () => {
    panel({
      view: view({
        access: { state: "premium", trial_ends_at: null, sources: ["grant", "subscription"] },
      }),
    });
    // The "Because of" tile, not the entitlement row's own Source cell — a
    // ticket about "I paid and it says free" is answered by this line.
    expect(screen.getByText("grant, subscription")).toBeInTheDocument();
  });

  it("says where the reset link goes, because the agent never sees it", () => {
    panel();
    expect(screen.getByText(/never shown here/i)).toBeInTheDocument();
    expect(screen.getByText(/synthetic@example.test/)).toBeInTheDocument();
  });

  it("offers no reset link for an account that signs in with Google", () => {
    const googleOnly = view();
    googleOnly.account.email = null;
    panel({ view: googleOnly });

    expect(screen.getByRole("button", { name: /email a reset link/i })).toBeDisabled();
    expect(screen.getByText(/no password to reset/i)).toBeInTheDocument();
  });

  it("shows the last-seen day with the client it used", () => {
    panel();
    expect(screen.getByText("2026-11-03")).toBeInTheDocument();
    expect(screen.getByText("ios / ta")).toBeInTheDocument();
  });

  it("explains that a cancelled subscription still grants access to its period end", () => {
    panel({
      view: view({
        subscriptions: [
          {
            subscription_id: "33333333-3333-3333-3333-333333333333",
            tier: "premium",
            status: "active",
            provider: "razorpay",
            provider_status: "cancelled",
            provider_subscription_id: "sub_Synthetic",
            sku: "premium_monthly",
            current_period_end: "2026-12-01T00:00:00+00:00",
            cancel_at_period_end: true,
          },
        ],
      }),
    });

    // Both states on one row: ours says access, the provider's says why.
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("cancelled")).toBeInTheDocument();
  });
});
