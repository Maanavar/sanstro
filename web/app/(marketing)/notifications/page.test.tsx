import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * The full inbox (`/notifications`) — the destination behind the dashboard
 * bell's "Open full inbox".
 *
 * These read the rendered page rather than its structure, because the three
 * things worth guarding here are all things a type check cannot see: that the
 * page speaks the account's language (it was English-only while `useSession()`
 * already knew the language), that it asks for more than the popover's default
 * page (or "full" means nothing), and that read/unread is filterable.
 */
const apiFetchJson = vi.fn();
const session = { hydrated: true, lang: "en" as "en" | "ta" };

vi.mock("@/lib/api", () => ({
  apiFetchJson: (...args: unknown[]) => apiFetchJson(...args),
  readErrorMessage: (e: unknown) => String(e),
}));
vi.mock("@/hooks/useSession", () => ({ useSession: () => session }));

import NotificationsPage from "./page";

function at(dayOffset: number, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Synthetic — no real profile, name or place. */
const ITEMS = [
  {
    notification_id: "n-today",
    type: "MORNING_NALLA_NERAM",
    title: "Nalla neram this morning",
    body: "A supportive window opens shortly after sunrise.",
    status: "sent",
    send_at: at(0),
    read_at: null,
  },
  {
    notification_id: "n-yesterday",
    type: "DASHA_TRANSITION",
    title: "Your bhukti changes",
    body: "A new sub-period begins this week.",
    status: "sent",
    send_at: at(1),
    read_at: at(1, 12),
  },
  {
    notification_id: "n-old",
    type: "PIRANTHA_NAAL",
    title: "Pirantha Naal coming up",
    body: "A birth-star day falls later this month.",
    status: "sent",
    send_at: at(10),
    read_at: null,
  },
];

function inbox(data = ITEMS) {
  return { success: true, data, unread_count: data.filter((i) => !i.read_at).length };
}

beforeEach(() => {
  vi.clearAllMocks();
  session.lang = "en";
  apiFetchJson.mockResolvedValue(inbox());
});

const TAMIL = /[஀-௿]/;

describe("Notification inbox page", () => {
  it("asks for more than the bell popover's default page", async () => {
    render(<NotificationsPage />);
    await screen.findByText("Nalla neram this morning");

    expect(apiFetchJson).toHaveBeenCalledWith("/api/v1/notifications?limit=100");
  });

  it("groups notifications by day and marks the unread ones", async () => {
    render(<NotificationsPage />);
    await screen.findByText("Nalla neram this morning");

    expect(screen.getByText(/^Today ·/)).toBeInTheDocument();
    expect(screen.getByText(/^Yesterday ·/)).toBeInTheDocument();
    expect(screen.getByText(/^Earlier ·/)).toBeInTheDocument();

    // Every row's mark-read control names its own notification — "Mark read"
    // alone is ambiguous when each row carries one.
    expect(screen.getByRole("button", { name: "Mark read: Nalla neram this morning" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark read: Your bhukti changes" })).toBeNull();
  });

  it("filters to unread", async () => {
    render(<NotificationsPage />);
    await screen.findByText("Nalla neram this morning");

    fireEvent.click(screen.getByRole("button", { name: /^Unread/ }));

    expect(screen.getByText("Nalla neram this morning")).toBeInTheDocument();
    expect(screen.queryByText("Your bhukti changes")).toBeNull();
  });

  it("marks everything read through the read-all endpoint", async () => {
    render(<NotificationsPage />);
    await screen.findByText("Nalla neram this morning");

    apiFetchJson.mockResolvedValueOnce(inbox(ITEMS.map((i) => ({ ...i, read_at: i.read_at ?? at(0, 10) }))));
    fireEvent.click(screen.getByRole("button", { name: /Mark all read/ }));

    await waitFor(() => {
      expect(apiFetchJson).toHaveBeenCalledWith("/api/v1/notifications/read-all", { method: "POST" });
    });
    await screen.findByText("All caught up");
  });

  it("speaks the account language, not English by default", async () => {
    session.lang = "ta";
    render(<NotificationsPage />);
    await screen.findByText("Nalla neram this morning");

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent ?? "").toMatch(TAMIL);
    // Active language only — no English echo beside the Tamil.
    expect(within(heading).queryByText(/Inbox/)).toBeNull();
  });
});
