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

function renderHero(activeTab: Parameters<typeof DashboardHero>[0]["activeTab"], onTabChange: (tab: string) => void) {
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
    />,
  );
}

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
