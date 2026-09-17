/**
 * The topbar brand mark (Vinaadi wordmark) is meant to act as a "go home"
 * affordance from anywhere in the dashboard SPA, like a site logo normally
 * does. Guards against it regressing back into an inert div.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DashboardHero } from "./dashboard-hero";

// jsdom doesn't implement scrollIntoView; the active-tab-into-view effect
// calls it on mount regardless of what this test cares about.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const noop = () => {};

function renderHero(
  activeTab: Parameters<typeof DashboardHero>[0]["activeTab"],
  onTabChange: (tab: string) => void,
  overrides: Partial<Parameters<typeof DashboardHero>[0]> = {},
) {
  return render(
    <DashboardHero
      lang="en"
      activeTab={activeTab}
      birthDisplayName="Test User"
      status={null}
      chartSummary={null}
      selectedVault={null}
      selectedVaultId=""
      selectedDate="2026-07-19"
      userEmail="test@example.com"
      showUserMenu={false}
      alertCount={0}
      alertItems={[]}
      inboxItems={[]}
      inboxUnreadCount={0}
      onMarkAllRead={noop}
      onMarkOneRead={noop}
      onTabChange={onTabChange as any}
      onDateChange={noop}
      onLangToggle={noop}
      onUserMenuToggle={noop}
      onUserMenuClose={noop}
      onGoToSettings={noop}
      onSignOut={noop}
      {...overrides}
    />,
  );
}

/**
 * DXA-05: both of these used to mount only once their data arrived, and each
 * arrival moved the bar around them.
 */
describe("DashboardHero — chrome that does not move (DXA-05)", () => {
  it("keeps the Ask pill in place before a chart exists, disabled", () => {
    const onAsk = vi.fn();
    renderHero("personal", noop, { onAskVinaadi: onAsk, askReady: false });

    const pill = screen.getByRole("button", { name: /ask vinaadi/i });
    expect(pill).toBeDisabled();
    fireEvent.click(pill);
    expect(onAsk).not.toHaveBeenCalled();
  });

  it("enables the same pill once a chart exists", () => {
    const onAsk = vi.fn();
    renderHero("personal", noop, { onAskVinaadi: onAsk, askReady: true });

    const pill = screen.getByRole("button", { name: /ask vinaadi/i });
    expect(pill).toBeEnabled();
    fireEvent.click(pill);
    expect(onAsk).toHaveBeenCalledTimes(1);
  });

  it("gives chrome space to failures only, not to routine success lines", () => {
    const { rerender } = renderHero("personal", noop, {
      status: { text: "Personal data refreshed. Panchangam uses birth location.", tone: "success" },
    });
    expect(screen.queryByText(/Personal data refreshed/)).not.toBeInTheDocument();

    rerender(
      <DashboardHero
        lang="en"
        activeTab="personal"
        birthDisplayName="Test User"
        status={{ text: "Could not load your chart.", tone: "error" }}
        chartSummary={null}
        selectedVault={null}
        selectedVaultId=""
        selectedDate="2026-07-19"
        userEmail="test@example.com"
        showUserMenu={false}
        alertCount={0}
        alertItems={[]}
        inboxItems={[]}
        inboxUnreadCount={0}
        onMarkAllRead={noop}
        onMarkOneRead={noop}
        onTabChange={noop as never}
        onDateChange={noop}
        onLangToggle={noop}
        onUserMenuToggle={noop}
        onUserMenuClose={noop}
        onGoToSettings={noop}
        onSignOut={noop}
      />,
    );
    expect(screen.getAllByText("Could not load your chart.").length).toBeGreaterThan(0);
  });
});

describe("DashboardHero brand mark", () => {
  it("navigates to the personal (home) tab when clicked from another tab", () => {
    const onTabChange = vi.fn();
    renderHero("family", onTabChange);

    fireEvent.click(screen.getByRole("button", { name: /go to dashboard home/i }));

    expect(onTabChange).toHaveBeenCalledWith("personal");
  });
});

describe("DashboardHero navigation guidance", () => {
  it("gives each More destination a plain-language description", () => {
    renderHero("personal", noop);

    fireEvent.click(screen.getByRole("button", { name: /more/i }));

    expect(screen.getByText("Use focused astrology tools for a specific question.")).toBeInTheDocument();
    expect(screen.getByText("Learn the ideas behind your chart and guidance.")).toBeInTheDocument();
  });
});

/**
 * The More menu declared role="menu"/role="menuitem" — which promises the
 * WAI-ARIA menu keys — while implementing none of them, and it marked the
 * destination you were already on with aria-current and nothing visible.
 */
describe("DashboardHero More menu keyboard behaviour", () => {
  function openMore() {
    const trigger = screen.getByRole("button", { name: /more/i });
    fireEvent.click(trigger);
    return trigger;
  }

  it("moves focus onto the destination you are already on", () => {
    renderHero("explore", noop);
    openMore();

    const current = screen.getByRole("menuitem", { name: /Understand/ });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(document.activeElement).toBe(current);
  });

  it("cycles focus with the arrow keys", () => {
    renderHero("personal", noop);
    const trigger = openMore();

    const items = screen.getAllByRole("menuitem");
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(trigger.parentElement as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);

    fireEvent.keyDown(trigger.parentElement as HTMLElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(items[0]);
  });

  it("closes on Escape and hands focus back to the trigger", () => {
    renderHero("personal", noop);
    const trigger = openMore();

    fireEvent.keyDown(trigger.parentElement as HTMLElement, { key: "Escape" });

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
