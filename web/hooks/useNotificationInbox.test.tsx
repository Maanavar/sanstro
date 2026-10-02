import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetchJson } from "@/lib/api";
import type { NotificationInboxItem, NotificationInboxResponse } from "@/lib/types";
import { useNotificationInbox } from "./useNotificationInbox";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, apiFetchJson: vi.fn() };
});

const fetchMock = vi.mocked(apiFetchJson);

function item(id: string, read: boolean): NotificationInboxItem {
  return {
    notification_id: id,
    type: "GENERAL",
    title: `Synthetic ${id}`,
    body: "Synthetic body.",
    status: "SENT",
    send_at: "2026-09-30T06:00:00Z",
    read_at: read ? "2026-09-30T07:00:00Z" : null,
  };
}

function inbox(items: NotificationInboxItem[]): NotificationInboxResponse {
  return { success: true, data: items, unread_count: items.filter((n) => !n.read_at).length };
}

/** A response the test resolves by hand, to order races deterministically. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const UNREAD = inbox([item("a", false), item("b", false)]);

async function mounted(lang: "en" | "ta" = "en", onError = vi.fn()) {
  fetchMock.mockResolvedValueOnce(UNREAD);
  const hook = renderHook(() => useNotificationInbox({ lang, onError }));
  await waitFor(() => expect(hook.result.current.unreadCount).toBe(2));
  return { ...hook, onError };
}

beforeEach(() => fetchMock.mockReset());
afterEach(() => vi.useRealTimers());

describe("useNotificationInbox — mark read", () => {
  it("clears the dot before the server answers, then takes the server's list", async () => {
    const { result } = await mounted();
    const pending = deferred<NotificationInboxResponse>();
    fetchMock.mockReturnValueOnce(pending.promise);

    act(() => result.current.markOneRead("a"));
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.items.find((n) => n.notification_id === "a")?.read_at).not.toBeNull();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/v1/notifications/a/read", { method: "POST" });

    await act(async () => pending.resolve(inbox([item("a", true), item("b", false)])));
    expect(result.current.unreadCount).toBe(1);
  });

  it("does not count an already-read row down twice", async () => {
    const { result } = await mounted();
    fetchMock.mockReturnValueOnce(new Promise(() => {})).mockReturnValueOnce(new Promise(() => {}));
    act(() => result.current.markOneRead("a"));
    act(() => result.current.markOneRead("a"));
    expect(result.current.unreadCount).toBe(1);
  });

  it("marks everything read at once", async () => {
    const { result } = await mounted();
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    act(() => result.current.markAllRead());
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.items.every((n) => n.read_at)).toBe(true);
  });

  it("says so on failure and restores the true state from the server", async () => {
    const { result, onError } = await mounted();
    fetchMock
      .mockRejectedValueOnce(new Error("synthetic network failure"))
      .mockResolvedValueOnce(UNREAD);

    await act(async () => result.current.markOneRead("a"));
    expect(onError).toHaveBeenCalledWith("Couldn't update your notifications. Please try again.");
    await waitFor(() => expect(result.current.unreadCount).toBe(2));
  });

  // Tamil-mode checks are not optional (CLAUDE.md): this message reaches a
  // toast, which no English-pinned audit pass would see in Tamil.
  it("reports the failure in Tamil on the Tamil surface", async () => {
    const { result, onError } = await mounted("ta");
    fetchMock.mockRejectedValueOnce(new Error("synthetic")).mockResolvedValueOnce(UNREAD);
    await act(async () => result.current.markAllRead());
    expect(onError).toHaveBeenCalledWith("அறிவிப்புகளைப் புதுப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.");
  });

  it("never lets an older poll paint stale read-state over a mark-read", async () => {
    const { result } = await mounted();
    const poll = deferred<NotificationInboxResponse>();
    fetchMock.mockReturnValueOnce(poll.promise); // a refresh, left in flight
    fetchMock.mockReturnValueOnce(new Promise(() => {})); // the mark-read

    act(() => result.current.refresh());
    act(() => result.current.markOneRead("a"));
    await act(async () => poll.resolve(UNREAD)); // poll lands late, still says unread

    expect(result.current.unreadCount).toBe(1);
  });
});

describe("useNotificationInbox — refresh on open", () => {
  it("refetches when the list is stale, not when it just arrived", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const { result } = await mounted();
    const callsAfterMount = fetchMock.mock.calls.length;

    fetchMock.mockResolvedValue(UNREAD);
    act(() => result.current.onOpen());
    expect(fetchMock.mock.calls.length).toBe(callsAfterMount);

    vi.setSystemTime(Date.now() + 16_000);
    act(() => result.current.onOpen());
    expect(fetchMock.mock.calls.length).toBe(callsAfterMount + 1);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/v1/notifications");
  });
});
