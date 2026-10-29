import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The router here behaves the way the App Router does in production: `push`
 * returns at once, but `usePathname()` only moves when the navigation lands
 * (an RSC round trip later), and a newer navigation discards a pending one.
 * The earlier mock-free tests could not see the race below because every
 * write landed in the same tick.
 */
const nav = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { pathname: "/dashboard/tools", pending: null as string | null, writes: [] as string[] };
  return {
    state,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    write(href: string) {
      state.writes.push(href);
      // A newer navigation supersedes whatever was still in flight.
      state.pending = href;
    },
    land() {
      if (state.pending === null) return;
      state.pathname = state.pending.split("?")[0];
      state.pending = null;
      listeners.forEach((fn) => fn());
    },
  };
});

vi.mock("next/navigation", async () => {
  const React = await import("react");
  const router = { push: (href: string) => nav.write(href), replace: (href: string) => nav.write(href) };
  return {
    usePathname: () => React.useSyncExternalStore(nav.subscribe, () => nav.state.pathname),
    useSearchParams: () => React.useMemo(() => new URLSearchParams(), []),
    useRouter: () => router,
  };
});

import { useWorkspaceNavigation } from "./useWorkspaceNavigation";

function mount() {
  const hook = renderHook(() => useWorkspaceNavigation());
  act(() => hook.result.current.enableUrlSync());
  return hook;
}

beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  nav.state.pathname = "/dashboard/tools";
  nav.state.pending = null;
  nav.state.writes = [];
});

describe("useWorkspaceNavigation — closing a tool before its URL lands", () => {
  it("one click on the Tools crumb returns to the hub even while the open is still in flight", () => {
    const { result } = mount();

    act(() => result.current.openTool("numerology"));
    expect(nav.state.writes.at(-1)).toBe("/dashboard/tools/numerology");
    // The panel is on screen; the URL has not caught up yet.
    expect(nav.state.pathname).toBe("/dashboard/tools");

    act(() => result.current.closeTool());
    act(() => nav.land());

    expect(result.current.activeTool).toBeNull();
    expect(nav.state.pathname).toBe("/dashboard/tools");
  });

  it("still settles on the tool when the open lands first", () => {
    const { result } = mount();

    act(() => result.current.openTool("numerology"));
    act(() => nav.land());
    expect(nav.state.pathname).toBe("/dashboard/tools/numerology");

    act(() => result.current.closeTool());
    act(() => nav.land());

    expect(result.current.activeTool).toBeNull();
    expect(nav.state.pathname).toBe("/dashboard/tools");
  });

  it("a Back that moves the URL is still adopted after a write", () => {
    const { result } = mount();

    act(() => result.current.openTool("numerology"));
    act(() => nav.land());
    // Browser Back: the URL moves without the hook asking for it.
    act(() => {
      nav.state.pending = "/dashboard/tools";
      nav.land();
    });

    expect(result.current.activeTool).toBeNull();
  });
});
