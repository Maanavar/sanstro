import React, { createContext, useContext, useState } from "react";

export type Tier = "guest" | "registered" | "premium";

export interface SessionUser {
  userId: string;
  email: string;
  displayName: string | null;
}

export interface SessionState {
  tier: Tier;
  user: SessionUser | null;
  isReady: boolean;
}

interface SessionContextValue extends SessionState {
  setSession: (user: SessionUser, tier: Tier) => void;
  clearSession: () => void;
  setReady: () => void;
}

const SessionContext = createContext<SessionContextValue>({
  tier: "guest",
  user: null,
  isReady: false,
  setSession: () => undefined,
  clearSession: () => undefined,
  setReady: () => undefined,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    tier: "guest",
    user: null,
    isReady: false,
  });

  function setSession(user: SessionUser, tier: Tier) {
    setState({ user, tier, isReady: true });
  }

  function clearSession() {
    setState({ tier: "guest", user: null, isReady: true });
  }

  function setReady() {
    setState((prev) => ({ ...prev, isReady: true }));
  }

  return (
    <SessionContext.Provider value={{ ...state, setSession, clearSession, setReady }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
