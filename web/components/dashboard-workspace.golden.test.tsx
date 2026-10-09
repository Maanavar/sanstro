import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * This is deliberately a composition golden rather than a DOM snapshot of the
 * real tabs. DashboardWorkspace owns the cross-tab wiring, while each lazy
 * tab owns its markup. Replacing the leaf tabs with small probes gives this
 * test a stable, synthetic-data record of the values handed across that
 * boundary without baking their implementation details into this 2.5k-line
 * coordinator.
 */
const route = { pathname: "/dashboard" };

const { noop } = vi.hoisted(() => ({ noop: () => undefined }));
const personal = {
  ambientAlerts: [], birthProfileId: "profile-synthetic-akila", birthProfileLookupDone: true,
  bundleSectionErrors: {}, busyPersonal: false,
  chartId: "chart-synthetic-akila",
  chart: { birthProfile: {
    birthProfileId: "profile-synthetic-akila", displayName: "Akila Synthetic",
    birthTimeConfidenceMinutes: 5, birthTimeLocal: "09:15",
  }, yogas: [], doshams: [] },
  chartExplanation: null, chartSummary: { moonRasi: "MESHA", janmaNakshatra: "ASHWINI", lagnaRasi: "KANYA" },
  dailyGuidance: { score: 74 }, dailyGuidanceRange: [], dasha: null, dashaAntar: null, dashaMaha: null,
  isShowingPreviousDay: false, jadhagamReport: null, jadhagamReportLoading: false,
  journalCorrelations: null, lifeAreas: [], loadJadhagamReport: noop,
  loadLatestBirthProfileForCurrentUser: noop, locationCheckDue: false, nakshatraCard: null,
  panchangam: null, panchangamLocationLabel: "Synthetic Nagar", panchangamPlace: "Synthetic Nagar",
  panchangamTimezone: "Asia/Kolkata", panchangamTimings: null, personalPending: false,
  peyarchiUpcoming: null, predictions: [], predictionsLoading: false, refreshLifeAreasInsights: noop,
  refreshPersonalBundle: noop, sani: null, setBirthProfileId: noop, setChartId: noop,
  setJadhagamReport: noop, setLifeAreas: noop, setPredictionsLoading: noop,
  todayDate: "2026-10-09", transit: null, weekAhead: [],
};
const family = {
  busyFamily: false, busyMemberCharts: false, busyVaults: false, familyAggregate: null,
  familyComposite: null, familyDetail: null,
  familyMembers: [{ familyMemberId: "member-synthetic-spouse", relationshipToOwner: "spouse" }],
  familyPending: false, loadRelationshipAlerts: noop, loadVaults: noop, memberCharts: [],
  refreshFamilyBundle: noop, relationshipAlerts: [], relationshipAlertsLoading: false,
  selectedVaultId: "vault-synthetic", setFamilyAggregate: noop, setFamilyComposite: noop,
  setFamilyDetail: noop, setSelectedVaultId: noop,
  vaults: [{ familyVaultId: "vault-synthetic", name: "Synthetic household", memberCount: 1 }], vaultsReady: true,
};
const session = {
  goalTrack: null, hydrated: true, sessionUserId: "user-synthetic", setShowUserMenu: noop,
  showUserMenu: false, signOut: noop, userEmail: "akila.synthetic@example.test", userMode: "standard",
  setUserMode: noop,
};

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useRouter: () => ({ push: noop, replace: noop }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/useSession", () => ({ useSession: () => session }));
vi.mock("@/hooks/usePersonalData", () => ({ usePersonalData: () => personal }));
vi.mock("@/hooks/useFamilyData", () => ({ useFamilyData: () => family }));
vi.mock("@/hooks/usePlanData", () => ({ usePlanData: () => ({
  addGoal: noop, addingGoalType: null, goals: [], goalsBusy: false, removeGoal: noop,
  removingGoalId: null, runWhatIf: noop, setAddingGoalType: noop, setWhatIfDate: noop,
  setWhatIfScenario: noop, whatIfBusy: false, whatIfDate: "", whatIfError: null,
  whatIfResult: null, whatIfScenario: null,
}) }));
vi.mock("@/hooks/useJournalData", () => ({ useJournalData: () => ({
  acknowledgeJournalReminder: noop, applyJournalRetention: noop, busyJournalSettings: false,
  busyRetentionApply: false, contextData: null, journalEntries: [], journalSettings: null,
  journalTotal: 0, loadContextData: noop, loadJournalEntries: noop, loadJournalSettings: noop,
  notificationPrefs: null, saveJournalRetentionDays: noop, setContextData: noop, setNotificationPrefs: noop,
}) }));
vi.mock("@/hooks/useNotificationInbox", () => ({ useNotificationInbox: () => ({
  items: [], unreadCount: 0, markAllRead: noop, markOneRead: noop, onOpen: noop,
}) }));
vi.mock("@/hooks/useDeviceTimeZone", () => ({ useDeviceTimeZone: () => "Asia/Kolkata" }));
vi.mock("@/components/localized-link", () => ({ LocalizedLink: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
vi.mock("@/components/skeleton", () => ({ SkeletonDashboardCard: () => <div /> }));
vi.mock("@/lib/api", () => ({ apiFetchJson: vi.fn(async () => ({})), toQuery: () => "" }));
vi.mock("@/lib/error-messages", () => ({ getFriendlyErrorMessage: () => "Synthetic error" }));
vi.mock("@/lib/lunar", () => ({ moonPhaseFromTithi: () => null }));
vi.mock("@/components/lang-toggle", () => ({ useLang: () => ["en"] }));
vi.mock("@/components/modal-shell", () => ({ ConfirmDialog: () => null }));
vi.mock("@/components/celestial-ambient-nova", () => ({ CelestialAmbientNova: () => null }));
vi.mock("@/components/dashboard-hero", () => ({ DashboardHero: () => null }));
vi.mock("@/components/dashboard-footer-morning-nova", () => ({ DashboardFooterMorningGuidance: () => null }));
vi.mock("@/components/life-mode-picker", () => ({ LifeModePicker: () => null, lifeModeLabel: () => "Balanced" }));
vi.mock("@/components/dashboard-ask-vinaadi-widget", () => ({ DashboardAskVinaadiWidget: () => null }));
vi.mock("@/components/ui/view-swap", () => ({ ViewSwap: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("sonner", () => ({ toast: { error: noop, success: noop } }));
vi.mock("@vinaadi/shared/api", () => ({ getLifeMode: () => Promise.resolve({ mode: "BALANCED", blockedModes: [] }), updateLifeMode: vi.fn() }));
vi.mock("@vinaadi/shared/checkIn", () => ({ isLocationMismatch: () => false, pickCheckIn: () => null }));

vi.mock("./dashboard-today-tab-nova", () => ({
  DashboardTodayTabNova: (props: { birthDisplayName: string; selectedDate: string; personalDailyGuidance: { score: number } | null; lifeFocus: { area?: string } }) => (
    <output data-testid="today-probe">{JSON.stringify({
      name: props.birthDisplayName, date: props.selectedDate,
      score: props.personalDailyGuidance?.score ?? null, focus: props.lifeFocus.area ?? null,
    })}</output>
  ),
}));
vi.mock("./dashboard-calendar-tab-nova", () => ({
  DashboardCalendarTabNova: (props: { chartId: string; selectedDate: string }) => (
    <output data-testid="calendar-probe">{JSON.stringify({ chartId: props.chartId, date: props.selectedDate })}</output>
  ),
}));

import { DashboardWorkspace } from "./dashboard-workspace";

describe("dashboard workspace composition golden", () => {
  beforeEach(() => {
    route.pathname = "/dashboard";
    window.localStorage.clear();
    vi.stubGlobal("scrollTo", noop);
  });

  it("hands a synthetic reader's coherent Today state to the first visible pane", async () => {
    render(<DashboardWorkspace />);

    await waitFor(() => expect(screen.getByTestId("today-probe")).toHaveTextContent(
      JSON.stringify({ name: "Akila Synthetic", date: "2026-10-09", score: 74, focus: null }),
    ));
  });

  it("keeps footer navigation inside the workspace and preserves the synthetic calendar context", async () => {
    render(<DashboardWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Calendar" }));

    await waitFor(() => expect(screen.getByTestId("calendar-probe")).toHaveTextContent(
      JSON.stringify({ chartId: "chart-synthetic-akila", date: "2026-10-09" }),
    ));
  });
});
