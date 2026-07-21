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
