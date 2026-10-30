// @vitest-environment jsdom
// (.ts tests default to node, where `window` is absent and every guarded read
// here would quietly return null.)
import { afterEach, describe, expect, it } from "vitest";

import {
  WORKSPACE_STORAGE_KEY,
  handOffDashboardDay,
  readPersistedVaultId,
  takeDashboardDayHandoff,
} from "./workspace-handoff";

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("day hand-off from a utility page to Today", () => {
  it("is read once and then gone", () => {
    handOffDashboardDay("2026-11-02");
    expect(takeDashboardDayHandoff()).toBe("2026-11-02");
    expect(takeDashboardDayHandoff()).toBeNull();
  });

  it("keeps a past date — the reader picked it a moment ago", () => {
    handOffDashboardDay("2020-01-15");
    expect(takeDashboardDayHandoff()).toBe("2020-01-15");
  });

  it("ignores anything that is not a calendar day", () => {
    handOffDashboardDay("not-a-date");
    expect(takeDashboardDayHandoff()).toBeNull();
  });
});

describe("readPersistedVaultId", () => {
  it("names the workspace's family for the same reader only", () => {
    window.localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({ ownerUserId: "user-a", selectedVaultId: "vault-1" }),
    );
    expect(readPersistedVaultId("user-a")).toBe("vault-1");
    // A shared browser: another account's blob must not pick a family.
    expect(readPersistedVaultId("user-b")).toBeNull();
    expect(readPersistedVaultId("")).toBeNull();
  });

  it("survives a corrupt blob", () => {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, "{not json");
    expect(readPersistedVaultId("user-a")).toBeNull();
  });
});
