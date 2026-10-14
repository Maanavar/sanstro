/**
 * Unit tests for sessionContext — guards against auth flow regressions that
 * would prevent users from logging in or expose premium features to guests.
 *
 * sessionContext.tsx uses only React hooks (no React Native APIs), so
 * @testing-library/react in jsdom is the right environment.
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  SessionProvider,
  useSession,
  type SessionUser,
} from "@/state/sessionContext";

function wrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

const MOCK_USER: SessionUser = {
  userId: "user-abc-123",
  email: "test@vinaadi.com",
  displayName: "Test User",
};

describe("initial state (unauthenticated)", () => {
  it("tier defaults to guest", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.tier).toBe("guest");
  });

  it("user defaults to null", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it("isReady defaults to false", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.isReady).toBe(false);
  });
});

describe("setSession", () => {
  it("sets user.userId correctly", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "registered");
    });
    expect(result.current.user?.userId).toBe("user-abc-123");
  });

  it("sets tier to registered", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "registered");
    });
    expect(result.current.tier).toBe("registered");
  });

  it("sets tier to premium for subscribers", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "premium");
    });
    expect(result.current.tier).toBe("premium");
  });

  it("marks isReady=true after login", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "registered");
    });
    expect(result.current.isReady).toBe(true);
  });
});

describe("setReady", () => {
  it("marks session ready without changing user", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setReady();
    });
    expect(result.current.isReady).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.tier).toBe("guest");
  });
});

describe("open beta gating", () => {
  it("unlocks premium features for a registered account while the beta runs", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "registered", true);
    });
    expect(result.current.gateTier).toBe("premium");
  });

  it("keeps tier as the subscription fact, so no one is shown a plan they did not buy", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "registered", true);
    });
    expect(result.current.tier).toBe("registered");
  });

  it("gates on the real tier once the beta ends", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "registered", false);
    });
    expect(result.current.gateTier).toBe("registered");
  });

  it("never lifts a guest — the beta is for accounts", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "guest", true);
    });
    expect(result.current.gateTier).toBe("guest");
  });

  it("drops the beta flag on logout", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "registered", true);
    });
    act(() => {
      result.current.clearSession();
    });
    expect(result.current.openBeta).toBe(false);
    expect(result.current.gateTier).toBe("guest");
  });
});

describe("clearSession (logout)", () => {
  it("resets tier to guest", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "premium");
    });
    act(() => {
      result.current.clearSession();
    });
    expect(result.current.tier).toBe("guest");
  });

  it("clears user after logout", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "registered");
    });
    act(() => {
      result.current.clearSession();
    });
    expect(result.current.user).toBeNull();
  });

  it("keeps isReady=true after logout", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.setSession(MOCK_USER, "registered");
    });
    act(() => {
      result.current.clearSession();
    });
    expect(result.current.isReady).toBe(true);
  });
});
