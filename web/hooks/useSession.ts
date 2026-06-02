"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetchJson, readErrorMessage } from "@/lib/api";

export type UserMode = "BEGINNER" | "BALANCED" | "TRADITIONAL";
export type GoalTrack = "CAREER" | "EXAM" | "RELATIONSHIP" | "FINANCIAL" | null;

type AuthSession = {
  userId: string;
  email: string;
  userMode?: UserMode;
  goalTrack?: GoalTrack;
};

type UseSessionOptions = {
  onSetupRedirect?: () => void;
};

export function useSession(options: UseSessionOptions = {}) {
  const { onSetupRedirect } = options;
  const [hydrated, setHydrated] = useState(false);
  const [sessionUserId, setSessionUserId] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userMode, setUserMode] = useState<UserMode>("BALANCED");
  const [goalTrack, setGoalTrack] = useState<GoalTrack>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      try {
        const me = await apiFetchJson<AuthSession>("/api/v1/auth/me");
        if (!active) return;

        setSessionUserId(me.userId);
        setUserEmail(me.email);
        if (me.userMode) setUserMode(me.userMode);
        if (me.goalTrack !== undefined) setGoalTrack(me.goalTrack ?? null);

        const url = new URL(window.location.href);
        if (url.searchParams.get("setup") === "1") {
          // Check DB for an existing birth profile — localStorage is unreliable
          // in incognito/new devices and can falsely skip setup.
          let hasProfileInDb = false;
          try {
            const resp = await fetch("/api/backend/api/v1/birth-profiles/me/latest", {
              credentials: "include",
            });
            hasProfileInDb = resp.ok;
          } catch { /* ignore — treat as no profile */ }
          if (!hasProfileInDb) {
            onSetupRedirect?.();
          }
          url.searchParams.delete("setup");
          window.history.replaceState({}, "", url.toString());
        }

        setHydrated(true);
      } catch (error) {
        if (!active) return;
        const message = readErrorMessage(error);
        if (message.startsWith("401:")) {
          await fetch("/api/backend/api/v1/auth/logout", {
            method: "POST",
            credentials: "include",
          }).catch(() => undefined);
        }
        window.location.href = "/login";
      }
    }

    void bootstrapSession();
    return () => {
      active = false;
    };
  }, [onSetupRedirect]);

  const signOut = useCallback(() => {
    void fetch("/api/backend/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      window.location.href = "/login";
    });
  }, []);

  return {
    hydrated,
    sessionUserId,
    userEmail,
    userMode,
    goalTrack,
    showUserMenu,
    setUserMode,
    setGoalTrack,
    setShowUserMenu,
    signOut,
  };
}
