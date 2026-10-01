/**
 * The topbar brand mark (Vinaadi wordmark) is meant to act as a "go home"
 * affordance from anywhere in the dashboard SPA, like a site logo normally
 * does. Guards against it regressing back into an inert div.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { todayIso } from "@/lib/format";
import { DashboardHero } from "./dashboard-hero";

// AnimatePresence retains an exiting node, while jsdom never advances that
// exit. The browser audit proves the actual animation; RTL needs immediate
// unmounting to assert the established dismissal contract.
vi.mock("./ui/presence", () => ({
  Presence: ({ open, children, ...props }: any) => open ? <div {...props}>{children}</div> : null,
}));

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
    <div className="cd-shell">
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
      />
    </div>,
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

/**
 * §2.4 of docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md — the sub-bar's
 * provenance note names the place today's timings were computed for, so a
 * reader who has moved can see the mistake without being prompted.
 */
describe("DashboardHero panchangam provenance (§2.4)", () => {
  it("leads with the place, shortened to the city, and keeps the rest in title", () => {
    renderHero("personal", noop, {
      panchangamSunrise: "05:45",
      panchangamPlace: "Chennai, Tamil Nadu, India",
    });

    const note = screen.getByTitle("Chennai, Tamil Nadu, India");
    expect(note).toHaveTextContent("Timings for Chennai");
    expect(note).toHaveTextContent("sunrise");
    // The place is the subject, not a trailing footnote to the sunrise time.
    expect(note.textContent?.indexOf("Chennai")).toBeLessThan(
      note.textContent?.indexOf("sunrise") ?? -1,
    );
  });

  it("still prints the sunrise when the profile has no usable place", () => {
    renderHero("personal", noop, { panchangamSunrise: "05:45", panchangamPlace: null });

    expect(screen.queryByText(/Timings for/)).not.toBeInTheDocument();
    expect(screen.getByText(/sunrise/)).toBeInTheDocument();
  });

  it("names it in Tamil too", () => {
    // The harness pins the audit account to en, so an en-only pass proves
    // nothing about the Tamil surface (CLAUDE.md display boundary).
    renderHero("personal", noop, {
      lang: "ta",
      panchangamSunrise: "05:45",
      panchangamPlace: "Chennai, Tamil Nadu, India",
    });

    expect(screen.getByTitle("Chennai, Tamil Nadu, India")).toHaveTextContent("Chennai நேரப்படி");
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

/**
 * The bell panel: a header · scrolling list · footer. What jsdom can check is
 * the content and wiring below. Blind spot: jsdom loads no stylesheet, so the
 * part the redesign was for — the list scrolling inside a viewport-capped
 * panel, and the phone sheet staying on-screen — is invisible here and was
 * checked in a browser instead.
 */
describe("DashboardHero notification panel", () => {
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
  const items = [
    {
      notification_id: "n-1",
      type: "MORNING_NALLA_NERAM",
      title: "Synthetic morning window",
      body: "A synthetic body for the first row.",
      status: "SENT",
      send_at: minutesAgo(5),
      read_at: null,
    },
    {
      notification_id: "n-2",
      type: "DASHA_TRANSITION",
      title: "Synthetic dasa row",
      body: "A synthetic body for the second row.",
      status: "SENT",
      send_at: minutesAgo(60 * 30),
      read_at: minutesAgo(60),
    },
  ];

  function openBell(overrides: Partial<Parameters<typeof DashboardHero>[0]> = {}) {
    renderHero("personal", noop, { inboxItems: items, inboxUnreadCount: 1, ...overrides });
    // Located by what it controls: its name is the thing under test, in two languages.
    const trigger = document.querySelector<HTMLButtonElement>('[aria-controls="cd-notif-panel"]')!;
    fireEvent.click(trigger);
    return trigger;
  }

  it("carries the unread count in the bell's name, not only in the badge pixels", () => {
    const trigger = openBell();
    expect(trigger).toHaveAccessibleName("Notifications, 1 new");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("labels each row with its kind and age, and marks only the unread one", () => {
    const onMarkOneRead = vi.fn();
    openBell({ onMarkOneRead });

    expect(screen.getByText("Morning timing")).toBeInTheDocument();
    expect(screen.getByText("5 min ago")).toBeInTheDocument();
    expect(screen.getByText("Dasa change")).toBeInTheDocument();

    // One control per unread row, each naming its row.
    const marks = screen.getAllByRole("button", { name: /^Mark read:/ });
    expect(marks).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Mark read: Synthetic morning window" }));
    expect(onMarkOneRead).toHaveBeenCalledWith("n-1");
  });

  it("names the selected date on the day's alerts when it is not today", () => {
    openBell({
      selectedDate: "2026-01-15",
      alertCount: 1,
      alertItems: [{ type: "synthetic", title: "Synthetic alert", body: "Synthetic alert body." }],
    });
    expect(screen.getByText("For 15 Jan 2026")).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
  });

  it("hands off to notification settings from the footer and closes", () => {
    const onOpenNotificationSettings = vi.fn();
    openBell({ onOpenNotificationSettings });

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(onOpenNotificationSettings).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Synthetic morning window")).not.toBeInTheDocument();
  });

  // Tamil-mode checks are not optional for this class (CLAUDE.md): the
  // harness pins the audit account to en, and several labels here live in
  // aria-label, which no text probe sees.
  it("speaks Tamil throughout on the Tamil surface, attributes included", () => {
    const trigger = openBell({
      lang: "ta",
      selectedDate: todayIso(),
      alertCount: 1,
      alertItems: [{ type: "synthetic", title: "செயற்கை", body: "செயற்கை." }],
      onOpenNotificationSettings: noop,
    });

    // The bell counts the day's alert and the unread message together.
    expect(trigger).toHaveAccessibleName("அறிவிப்புகள், 2 புதியவை");
    expect(screen.getByText("காலை நேரம்")).toBeInTheDocument();
    expect(screen.getByText("இன்றைக்கு")).toBeInTheDocument();
    expect(screen.getByText("அறிவிப்பு பெட்டி")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "படித்தது: Synthetic morning window" })).toBeInTheDocument();
    for (const english of [/\bnew\b/, /^Inbox$/, /Mark read/, /min ago/, /Open full inbox/, /^Settings$/]) {
      expect(screen.queryAllByText(english)).toHaveLength(0);
      expect(screen.queryAllByRole("button", { name: english })).toHaveLength(0);
    }
  });
});

describe("DashboardHero top-bar menu dismissal (DXA-41)", () => {
  it("closes notifications on Escape and returns focus to its trigger", () => {
    renderHero("personal", noop);
    const trigger = screen.getByRole("button", { name: /notifications/i });

    fireEvent.click(trigger);
    expect(screen.getByText("No notifications yet.")).toBeInTheDocument();

    // Keyboard events from the focused trigger bubble through document in a
    // browser; dispatch there rather than at the window-only test target.
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("No notifications yet.")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("uses the shell-level layer to dismiss notifications on a page click", () => {
    renderHero("personal", noop);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    fireEvent.click(document.querySelector(".cd-overlay--page") as HTMLElement);

    expect(screen.queryByText("No notifications yet.")).not.toBeInTheDocument();
  });

  // The theme control lives in the topbar so switching does not cost a trip to
  // Settings. It talks to hooks/useTheme directly rather than through a prop,
  // so the wiring is only visible from a mounted hero.
  //
  // Blind spot: which of the two icon faces is painted is a CSS decision off
  // [data-theme] (.cd-theme-btn in dashboard.css) and jsdom loads no
  // stylesheet, so both faces are in this DOM and neither visibility is
  // assertable here. The attribute below is the half that can be checked.
  it("flips the painted theme from the topbar without going to Settings", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    renderHero("personal", noop);

    const toggle = screen.getByRole("button", { name: "Switch theme" });
    fireEvent.click(toggle);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    fireEvent.click(toggle);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  // A control whose whole label lives in aria-label/title is invisible to every
  // text probe in this repo, so an English string would sit there unnoticed on
  // the Tamil surface. Checked by hand here because nothing else can see it.
  it("labels the theme toggle in Tamil on the Tamil surface", () => {
    renderHero("personal", noop, { lang: "ta" });
    expect(screen.getByRole("button", { name: "தோற்றத்தை மாற்று" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Switch theme" })).not.toBeInTheDocument();
  });
});
