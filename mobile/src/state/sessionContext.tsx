import React, { createContext, useContext, useState } from "react";
import { effectiveTier } from "@vinaadi/shared";

export type Tier = "guest" | "registered" | "premium";

export interface SessionUser {
  userId: string;
  email: string;
  displayName: string | null;
}

export interface SessionState {
  /** The subscription fact — drives the Subscription card, never a feature lock. */
  tier: Tier;
  /** True while the open beta runs (`MeResponse.openBeta`). */
  openBeta: boolean;
  user: SessionUser | null;
  isReady: boolean;
}

interface SessionContextValue extends SessionState {
  /**
   * The tier to gate features on. During the open beta the server holds every
   * signed-in account to premium's limits, so a lock shown here would be one
   * the server does not enforce. Use this for `TIER_LIMITS[...]` lookups and
   * locks; use `tier` only to describe the user's subscription.
   */
  gateTier: Tier;
  setSession: (user: SessionUser, tier: Tier, openBeta?: boolean) => void;
  clearSession: () => void;
  setReady: () => void;
}

const SessionContext = createContext<SessionContextValue>({
  tier: "guest",
  openBeta: false,
  gateTier: "guest",
  user: null,
  isReady: false,
  setSession: () => undefined,
  clearSession: () => undefined,
  setReady: () => undefined,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    tier: "guest",
    openBeta: false,
    user: null,
    isReady: false,
  });

  function setSession(user: SessionUser, tier: Tier, openBeta = false) {
    setState({ user, tier, openBeta, isReady: true });
  }

  function clearSession() {
    setState({ tier: "guest", openBeta: false, user: null, isReady: true });
  }

  function setReady() {
    setState((prev) => ({ ...prev, isReady: true }));
  }

  const gateTier = effectiveTier(state.tier, state.openBeta);

  return (
    <SessionContext.Provider value={{ ...state, gateTier, setSession, clearSession, setReady }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
