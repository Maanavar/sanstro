import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Behaviour golden for DashboardWorkspace (A13). Every pane, overlay and the
 * hero are replaced by probes that record ALL the props the workspace hands
 * them; scenarios drive the workspace through those props, the router and
 * the hooks, and each checkpoint records the URL, the visible pane, the
 * workspace's own DOM and every side effect (router, API, hook calls,
 * storage, toasts, scroll). The transcripts are committed under __golden__/
 * and must not change across a structural extraction.
 *
 * Blind spots, by construction: the real panes, hooks and router are not
 * exercised (their contracts are only what is recorded at this boundary);
 * framer-motion styles other than `display` are ignored; a setState updater
 * passed to a hook setter is recorded as "ƒ", not evaluated.
 */

const h = vi.hoisted(() => {
  type Props = Record<string, unknown>;
  const props = new Map<string, Props>();
  const hookArgs = new Map<string, Props>();
  const log: unknown[] = [];
  const nav = {
    entries: [{ pathname: "/dashboard", search: "" }],
    index: 0,
    listeners: new Set<() => void>(),
  };
  const world: Record<string, unknown> = {};

  function ser(value: unknown): unknown {
    if (typeof value === "function") return "ƒ";
    if (value === undefined) return "‹undefined›";
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(ser);
    if ("$$typeof" in (value as object)) return "‹element›";
    if (value instanceof URLSearchParams) return value.toString();
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) out[key] = ser((value as Props)[key]);
    return out;
  }

  function rec<T>(name: string, ret?: (...args: unknown[]) => T) {
    return (...args: unknown[]) => {
      log.push([name, ...args.map(ser)]);
      return ret ? ret(...args) : (undefined as T);
    };
  }

  function probe(name: string) {
    return function Probe(p: Props) {
      props.set(name, p);
      const R = (globalThis as unknown as { React: typeof import("react") }).React;
      return R.createElement("output", { "data-probe": name }, p.children as never);
    };
  }

  function current() {
    return nav.entries[nav.index];
  }
  // Next's App Router commits a navigation in a transition, after the effects
  // that requested it — `usePathname()` does not change under a running
  // effect. Navigations are queued and applied together on the next task.
  let queued: { href: string; mode: "push" | "replace" }[] = [];
  function applyQueued() {
    const batch = queued;
    queued = [];
    for (const { href, mode } of batch) {
      const [pathname, search = ""] = href.split("?");
      const entry = { pathname, search };
      if (mode === "push") {
        nav.entries = [...nav.entries.slice(0, nav.index + 1), entry];
        nav.index += 1;
      } else {
        nav.entries[nav.index] = entry;
      }
    }
    if (batch.length) nav.listeners.forEach((l) => l());
  }
  function go(href: string, mode: "push" | "replace") {
    if (!queued.length) setTimeout(applyQueued, 0);
    queued.push({ href, mode });
  }
  function resetNav(pathname: string, search: string) {
    queued = [];
    nav.entries = [{ pathname, search }];
    nav.index = 0;
  }
  const router = {
    push: (href: string, opts?: unknown) => { log.push(["router.push", href, ser(opts)]); go(href, "push"); },
    replace: (href: string, opts?: unknown) => { log.push(["router.replace", href, ser(opts)]); go(href, "replace"); },
    back: () => { log.push(["router.back"]); },
  };
  function subscribe(l: () => void) {
    nav.listeners.add(l);
    return () => nav.listeners.delete(l);
  }

  return { props, hookArgs, log, nav, world, ser, rec, probe, current, resetNav, router, subscribe };
});

vi.mock("next/navigation", () => {
  const R = () => (globalThis as unknown as { React: typeof import("react") }).React;
  return {
    usePathname: () => R().useSyncExternalStore(h.subscribe, () => h.current().pathname),
    useSearchParams: () => {
      const search = R().useSyncExternalStore(h.subscribe, () => h.current().search);
      return R().useMemo(() => new URLSearchParams(search), [search]);
    },
    useRouter: () => h.router,
  };
});

vi.mock("@/hooks/useSession", () => ({
  useSession: (opts: Record<string, unknown>) => { h.hookArgs.set("useSession", opts); return h.world.session; },
}));
vi.mock("@/hooks/usePersonalData", () => ({
  usePersonalData: (opts: Record<string, unknown>) => { h.hookArgs.set("usePersonalData", opts); return h.world.personal; },
}));
vi.mock("@/hooks/useFamilyData", () => ({
  useFamilyData: (opts: Record<string, unknown>) => { h.hookArgs.set("useFamilyData", opts); return h.world.family; },
}));
vi.mock("@/hooks/usePlanData", () => ({
  usePlanData: (opts: Record<string, unknown>) => { h.hookArgs.set("usePlanData", opts); return h.world.plan; },
}));
vi.mock("@/hooks/useJournalData", () => ({
  useJournalData: (opts: Record<string, unknown>) => { h.hookArgs.set("useJournalData", opts); return h.world.journal; },
}));
vi.mock("@/hooks/useNotificationInbox", () => ({
  useNotificationInbox: (opts: Record<string, unknown>) => { h.hookArgs.set("useNotificationInbox", opts); return h.world.inbox; },
}));
vi.mock("@/hooks/useDeviceTimeZone", () => ({ useDeviceTimeZone: () => h.world.deviceTimeZone }));

vi.mock("@/lib/api", () => ({
  apiFetchJson: (url: string, init?: { method?: string; body?: string }) => {
    const method = init?.method ?? "GET";
    h.log.push(["api", method, url, init?.body ? JSON.parse(init.body) : null]);
    return (h.world.respond as (m: string, u: string, b: unknown) => Promise<unknown>)(
      method, url, init?.body ? JSON.parse(init.body) : null,
    );
  },
  toQuery: () => "",
}));
vi.mock("@vinaadi/shared/api", () => ({
  getLifeMode: () => {
    h.log.push(["getLifeMode"]);
    return Promise.resolve(h.world.lifeMode);
  },
  updateLifeMode: (mode: string, intent: string, surface: string) => {
    h.log.push(["updateLifeMode", mode, intent, surface]);
    return Promise.resolve({ ...(h.world.lifeMode as object), mode, focusNudgeDue: false });
  },
}));
vi.mock("sonner", () => ({ toast: { error: h.rec("toast.error"), success: h.rec("toast.success") } }));

vi.mock("@/components/localized-link", () => ({
  LocalizedLink: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));
vi.mock("@/components/skeleton", () => ({ SkeletonDashboardCard: () => <i data-skeleton="" /> }));
vi.mock("./lang-toggle", () => ({ useLang: () => [h.world.serverLang] }));
vi.mock("./modal-shell", () => ({ ConfirmDialog: h.probe("confirm") }));
vi.mock("./celestial-ambient-nova", () => ({ CelestialAmbientNova: h.probe("ambient") }));
vi.mock("./dashboard-hero", () => ({ DashboardHero: h.probe("hero") }));
vi.mock("./dashboard-footer-morning-nova", () => ({ DashboardFooterMorningGuidance: h.probe("footerMorning") }));
vi.mock("./life-mode-picker", () => ({
  LifeModePicker: h.probe("lifeModePicker"),
  lifeModeLabel: (mode: string, lang: string) => `label:${mode}:${lang}`,
}));
vi.mock("./dashboard-ask-vinaadi-widget", () => ({ DashboardAskVinaadiWidget: h.probe("ask") }));
vi.mock("./ui/view-swap", () => ({ ViewSwap: h.probe("viewSwap") }));
vi.mock("./dashboard-calendar-tab-nova", () => ({ DashboardCalendarTabNova: h.probe("calendar") }));
vi.mock("./dashboard-edit-member-modal", () => ({ EditMemberModal: h.probe("editMember") }));
vi.mock("./dashboard-edit-profile-modal", () => ({ EditProfileModal: h.probe("editProfile") }));
vi.mock("./dashboard-family-charts-hybrid", () => ({ DashboardFamilyChartsHybrid: h.probe("family") }));
vi.mock("./dashboard-feedback-modal", () => ({ FeedbackModal: h.probe("feedback") }));
vi.mock("./dashboard-life-areas-tab-nova", () => ({ DashboardLifeAreasTabNova: h.probe("lifeAreas") }));
vi.mock("./dashboard-qa-tab", () => ({ QATab: h.probe("qa") }));
vi.mock("./dashboard-setup-tab", () => ({ DashboardSetupTab: h.probe("setup") }));
vi.mock("./dashboard-settings-session-tab", () => ({ DashboardSettingsSessionTab: h.probe("settingsSession") }));
vi.mock("./dashboard-journal-tab-nova", () => ({ DashboardJournalTabNova: h.probe("journal") }));
vi.mock("./dashboard-plan-tab-nova", () => ({ DashboardPlanTabNova: h.probe("plan") }));
vi.mock("./dashboard-explore-tab-nova", () => ({ DashboardExploreTabNova: h.probe("explore") }));
vi.mock("./dashboard-rectification-wizard", () => ({ RectificationWizard: h.probe("rectification") }));
vi.mock("./dashboard-today-tab-nova", () => ({ DashboardTodayTabNova: h.probe("today") }));
vi.mock("./dashboard-tools-tab-nova", () => ({ DashboardToolsTabNova: h.probe("tools") }));

import { DashboardWorkspace } from "./dashboard-workspace";

// ── Synthetic world ─────────────────────────────────────────────────────────

const TODAY = "2026-10-09";
const USER = "user-synthetic";
const OWNER_BP = "bp-owner-synthetic";
const VAULT = "vault-synthetic";

function birthProfile(id: string, name: string, relationshipToOwner: string, extra: Record<string, unknown> = {}) {
  return {
    birthProfileId: id, displayName: name, relationshipToOwner,
    birthDateLocal: "1990-01-15", birthTimeLocal: "06:30", birthPlace: "Synthetic Nagar",
    birthLatitude: 11.5, birthLongitude: 78.25, birthTimezone: "Asia/Kolkata",
    currentPlace: null, currentLatitude: null, currentLongitude: null, currentTimezone: null,
    maritalStatus: "married", employmentType: "salaried", children: "1",
    birthTimeConfidenceMinutes: 5, ...extra,
  };
}

function chart(chartId: string, bp: ReturnType<typeof birthProfile>) {
  return { chartId, birthProfile: bp, yogas: [{ code: `YOGA-${chartId}` }], doshams: [{ code: `DOSHAM-${chartId}` }] };
}

function memberChart(memberId: string, name: string, rel: string, score: number) {
  const bp = birthProfile(`bp-${memberId}`, name, rel, { birthDateLocal: "1992-03-03" });
  return {
    memberId, displayName: name, chart: chart(`chart-${memberId}`, bp),
    explanation: { tag: `explanation-${memberId}` }, summary: { chartId: `chart-${memberId}`, moonRasi: 4, janmaNakshatra: "PUSHYA", lagnaRasi: 9 },
    transit: { tag: `transit-${memberId}` }, sani: { tag: `sani-${memberId}` }, peyarchiUpcoming: [{ tag: `peyarchi-${memberId}` }],
    dailyGuidance: { score }, weekAhead: { tag: `week-${memberId}` }, dasha: { tag: `dasha-${memberId}` },
    dashaMaha: { tag: `maha-${memberId}` }, dashaAntar: [{ tag: `antar-${memberId}` }], nakshatraCard: { tag: `nak-${memberId}` },
  };
}

function aggregateRow(familyMemberId: string, birthProfileId: string, name: string, score: number) {
  return {
    familyMemberId, displayName: name, birthProfileId, chartId: `chart-${familyMemberId}`,
    individualScore: score, label: "steady", memberWeight: 1.15, birthTimeConfidenceMinutes: 5,
    activeCycleTags: [], bestWindows: [], cautionWindows: [],
  };
}

type World = Record<string, unknown> & {
  personal: Record<string, unknown>;
  family: Record<string, unknown>;
  session: Record<string, unknown>;
};

function returningReader(): World {
  const ownerBp = birthProfile(OWNER_BP, "Akila Synthetic", "self", { maritalStatus: "single" });
  const r = h.rec;
  return {
    serverLang: "en",
    deviceTimeZone: "Asia/Kolkata",
    dbLang: undefined,
    failAuthMe: false,
    createdChartId: "chart-created",
    lifeMode: {
      mode: "CAREER", lifeModeSetAt: "2026-06-01T00:00:00Z", showLifeModePicker: false,
      blockedModes: ["MARRIAGE"], focusNudgeDue: true, focusArea: "CAREER",
      focusActivities: ["job_change", "business_start"],
    },
    session: {
      hydrated: true, sessionUserId: USER, userEmail: "synthetic@example.test", userMode: "BALANCED",
      goalTrack: null, showUserMenu: false,
      setShowUserMenu: r("session.setShowUserMenu"), signOut: r("session.signOut"), setUserMode: r("session.setUserMode"),
    },
    personal: {
      ambientAlerts: [{ source: "transit", title: { ta: "தலைப்பு", en: "Synthetic alert" }, message: { ta: "செய்தி", en: "Synthetic message" } }],
      birthProfileId: OWNER_BP, birthProfileLookupDone: true, bundleSectionErrors: { weekAhead: "synthetic" },
      busyPersonal: false, chartId: "chart-owner", chart: chart("chart-owner", ownerBp),
      chartExplanation: { tag: "explanation-owner" },
      chartSummary: { chartId: "chart-owner", moonRasi: 1, janmaNakshatra: "ASHWINI", lagnaRasi: 6 },
      dailyGuidance: { score: 74 }, dailyGuidanceRange: [{ date: TODAY, score: 74 }],
      dasha: { tag: "dasha-owner" }, dashaMaha: { tag: "maha-owner" }, dashaAntar: [{ tag: "antar-owner" }],
      isShowingPreviousDay: false, jadhagamReport: null, jadhagamReportLoading: false,
      journalCorrelations: { tag: "correlations" }, lifeAreas: [{ area: "CAREER", score: 66 }],
      locationCheckDue: false, nakshatraCard: { tag: "nak-owner" },
      panchangam: { sunrise: "06:01", tithi: { number: 15, paksha: "SHUKLA" } },
      panchangamLocationLabel: "Synthetic Nagar, IN", panchangamPlace: "Synthetic Nagar",
      panchangamTimezone: "Asia/Kolkata", panchangamTimings: { tag: "timings" }, personalPending: false,
      peyarchiUpcoming: [{ tag: "peyarchi-owner" }], predictions: { tag: "predictions" }, predictionsLoading: false,
      sani: { tag: "sani-owner" }, todayDate: TODAY, transit: { tag: "transit-owner" }, weekAhead: { tag: "week-owner" },
      loadJadhagamReport: r("personal.loadJadhagamReport", () => Promise.resolve()),
      loadLatestBirthProfileForCurrentUser: r("personal.loadLatestBirthProfileForCurrentUser", () => Promise.resolve()),
      refreshLifeAreasInsights: r("personal.refreshLifeAreasInsights", () => Promise.resolve()),
      refreshPersonalBundle: r("personal.refreshPersonalBundle", () => Promise.resolve()),
      setBirthProfileId: r("personal.setBirthProfileId"), setChartId: r("personal.setChartId"),
      setJadhagamReport: r("personal.setJadhagamReport"), setLifeAreas: r("personal.setLifeAreas"),
      setPredictionsLoading: r("personal.setPredictionsLoading"),
    },
    family: {
      busyFamily: false, busyMemberCharts: false, busyVaults: false,
      familyAggregate: {
        familyVaultId: VAULT, dateLocal: TODAY, familyScore: 63,
        members: [aggregateRow(OWNER_BP, OWNER_BP, "Akila Synthetic", 50), aggregateRow("member-spouse", "bp-member-spouse", "Bala Synthetic", 61)],
      },
      familyComposite: { tag: "composite" }, familyDetail: { tag: "detail" },
      familyMembers: [
        { familyMemberId: "member-spouse", relationshipToOwner: "spouse" },
        { familyMemberId: "member-child", relationshipToOwner: "child" },
        { familyMemberId: "member-selfrow", relationshipToOwner: "self" },
      ],
      familyPending: false,
      memberCharts: [
        memberChart("member-spouse", "Bala Synthetic", "spouse", 61),
        memberChart("member-child", "Chitra Synthetic", "child", 58),
        memberChart("member-selfrow", "Akila Duplicate", "self", 70),
      ],
      relationshipAlerts: [{ tag: "alert" }], relationshipAlertsLoading: false, selectedVaultId: VAULT,
      vaults: [{ familyVaultId: VAULT, ownerUserId: USER, name: "Synthetic household", memberCount: 2 }], vaultsReady: true,
      loadRelationshipAlerts: r("family.loadRelationshipAlerts", () => Promise.resolve()),
      loadVaults: r("family.loadVaults", () => Promise.resolve()),
      refreshFamilyBundle: r("family.refreshFamilyBundle", () => Promise.resolve()),
      setFamilyAggregate: r("family.setFamilyAggregate"), setFamilyComposite: r("family.setFamilyComposite"),
      setFamilyDetail: r("family.setFamilyDetail"), setSelectedVaultId: r("family.setSelectedVaultId"),
    },
    plan: {
      goals: [{ goalId: "goal-1", goalType: "job_change" }], goalsBusy: false, addingGoalType: "", removingGoalId: "",
      whatIfScenario: "job_change", whatIfDate: "", whatIfResult: null, whatIfBusy: false, whatIfError: null,
      addGoal: r("plan.addGoal", () => Promise.resolve()), removeGoal: r("plan.removeGoal", () => Promise.resolve()),
      runWhatIf: r("plan.runWhatIf", () => Promise.resolve()), setAddingGoalType: r("plan.setAddingGoalType"),
      setWhatIfDate: r("plan.setWhatIfDate"), setWhatIfScenario: r("plan.setWhatIfScenario"),
    },
    journal: {
      busyJournalSettings: false, busyRetentionApply: false, contextData: { tag: "context" },
      journalEntries: [{ tag: "entry" }], journalTotal: 1, notificationPrefs: { tag: "prefs" },
      journalSettings: {
        journalRetentionDays: 180, lastUpdatedAt: "2026-09-01T00:00:00Z",
        lastRetentionReviewedAt: null, nextRecommendedReviewDate: "2027-01-01",
      },
      acknowledgeJournalReminder: r("journal.acknowledgeJournalReminder", () => Promise.resolve()),
      applyJournalRetention: r("journal.applyJournalRetention", () => Promise.resolve()),
      loadContextData: r("journal.loadContextData"), loadJournalEntries: r("journal.loadJournalEntries"),
      loadJournalSettings: r("journal.loadJournalSettings", () => Promise.resolve()),
      saveJournalRetentionDays: r("journal.saveJournalRetentionDays", () => Promise.resolve()),
      setContextData: r("journal.setContextData"), setNotificationPrefs: r("journal.setNotificationPrefs"),
    },
    inbox: {
      items: [{ tag: "inbox-item" }], unreadCount: 1,
      markAllRead: r("inbox.markAllRead"), markOneRead: r("inbox.markOneRead"), onOpen: r("inbox.onOpen"),
    },
  };
}

function respond(world: World) {
  return async (method: string, url: string, body: unknown) => {
    if (url === "/api/v1/settings/ui" && method === "GET") return { lang: world.dbLang };
    if (url === "/api/v1/auth/me" && world.failAuthMe) throw new Error("synthetic failure");
    if (url === "/api/v1/birth-profiles" && method === "POST") {
      return { success: true, data: { birthProfileId: "bp-created-synthetic", chartId: world.createdChartId } };
    }
    if (url.startsWith("/api/v1/birth-profiles/") && method === "PATCH") {
      return { success: true, data: { birthProfileId: url.split("/").pop(), chartId: "chart-recalculated" } };
    }
    if (url === "/api/v1/family-vaults" && method === "POST") {
      return { success: true, data: { familyVaultId: "vault-created", ownerUserId: USER } };
    }
    if (url.endsWith("/members") && method === "POST") {
      return { success: true, data: { familyMemberId: "member-created", displayName: (body as { displayName: string }).displayName } };
    }
    if (url.endsWith("/remedy-plan")) {
      return { success: true, data: { items: [{
        planet: "SATURN", priority: 2, reason_en: "synthetic reason", day: "SATURDAY", temple_ta: "கோயில்", temple_en: "Temple",
        mantra_full_ta: "மந்திரம்", japa_count: 108, daanam_items_ta: "எள்", daanam_items_en: "Sesame", gemstone_ta: null,
        gemstone_en: null, fasting_rule_ta: "விரதம்", fasting_rule_en: "Fast", behavioural_ta: "நடத்தை", behavioural_en: "Behaviour",
        seva_ta: "சேவை", seva_en: "Service",
      }] } };
    }
    if (url.endsWith("/gemstone-advice")) {
      return { success: true, data: { advice: [{
        planet: "JUPITER", functional_nature: "BENEFIC", is_gemstone_prescribed: true, gemstone_name_ta: "புஷ்பராகம்",
        gemstone_name_en: "Yellow sapphire", reason_ta: "காரணம்", reason_en: "Reason", caution_ta: null, caution_en: null,
      }] } };
    }
    if (url.includes("/varshaphala")) return { success: true, data: { year: Number(url.split("year=")[1]) } };
    return { success: true, data: {} };
  };
}

// ── Harness ─────────────────────────────────────────────────────────────────

type Checkpoint = Record<string, unknown>;
let record: Checkpoint[] = [];
let rendered: ReturnType<typeof render> | null = null;
let debounced = new Map<number, () => void>();
const realSetTimeout = window.setTimeout;
const realClearTimeout = window.clearTimeout;

function seedStorage(value: Record<string, unknown>) {
  window.localStorage.setItem("jothidam-ai-dashboard-state", JSON.stringify(value));
}

function persisted(overrides: Record<string, unknown> = {}) {
  return {
    ownerUserId: USER, selectedDate: "2026-10-12", selectedVaultId: VAULT, birthProfileId: OWNER_BP, chartId: "chart-owner",
    birthForm: {
      ownerUserId: USER, displayName: "Akila Synthetic", birthDateLocal: "1990-01-15", birthTimeLocal: "06:30",
      birthPlace: "Synthetic Nagar", birthLatitude: "11.5", birthLongitude: "78.25", birthTimezone: "Asia/Kolkata",
      currentPlace: "", currentLatitude: "", currentLongitude: "", currentTimezone: "", relationshipToOwner: "self",
      calculateNow: true, maritalStatus: "", employmentType: "", children: "", birthTimeSource: "unknown",
      birthTimeConfidenceMinutes: "0",
    },
    // States written before DXA-02 still carry the last tab; it must be ignored.
    activeTab: "calendar", lang: "en", hasVisitedReading: false, ...overrides,
  };
}

function start(world: World, path = "/dashboard") {
  const [pathname, search = ""] = path.split("?");
  h.resetNav(pathname, search);
  Object.assign(h.world, world, { respond: respond(world) });
  rendered = render(<DashboardWorkspace />);
}

function rerender(patch: (w: World) => void) {
  patch(h.world as World);
  rendered!.rerender(<DashboardWorkspace />);
}

function domState() {
  const shown: string[] = [];
  const mounted: string[] = [];
  document.querySelectorAll<HTMLElement>("output[data-probe]").forEach((el) => {
    const name = el.dataset.probe!;
    mounted.push(name);
    if (!el.closest('[style*="display: none"]')) shown.push(name);
  });
  return { shown: [...new Set(shown)].sort(), mounted: [...new Set(mounted)].sort() };
}

function fingerprint() {
  const { mounted, shown } = domState();
  return JSON.stringify([mounted, shown, h.log.length, h.current(), document.querySelector(".cd-app-body")?.getAttribute("data-active-tab")]);
}

async function settle() {
  let last = "";
  let stable = 0;
  for (let i = 0; i < 400 && stable < 3; i++) {
    await act(async () => { await new Promise((r) => realSetTimeout(r, 2)); });
    const fp = fingerprint();
    const loading = document.querySelector("[data-skeleton], .nova-today-fallback");
    stable = fp === last && !loading ? stable + 1 : 0;
    last = fp;
  }
}

async function flushPersistence() {
  const pending = [...debounced.values()];
  debounced = new Map();
  await act(async () => { pending.forEach((fn) => fn()); });
}

function drainLog() {
  return h.log.splice(0, h.log.length);
}

function workspaceDom() {
  const q = (s: string) => document.querySelector<HTMLElement>(s);
  const onboarding = q(".cd-onboarding");
  const back = q(".cd-main-content__body button[aria-label]");
  return {
    htmlLang: document.documentElement.lang,
    dataLang: q(".site")?.getAttribute("data-lang") ?? null,
    activeTab: q(".cd-app-body")?.getAttribute("data-active-tab") ?? null,
    onboarding: onboarding
      ? {
          text: onboarding.textContent,
          badges: Array.from(onboarding.querySelectorAll(".cd-onboarding__step-badge")).map((b) => b.className),
        }
      : null,
    exploreBack: back ? back.textContent : null,
    printTag: q(".cd-print-brand__tag")?.textContent ?? null,
    feedbackLabel: q(".cd-feedback-fab")?.getAttribute("aria-label") ?? null,
    footer: {
      legal: q(".nova-footer__legal")?.textContent ?? null,
      navLabel: q(".nova-footer__nav")?.getAttribute("aria-label") ?? null,
      links: Array.from(document.querySelectorAll(".nova-footer__nav-col")).map((col) => [
        col.querySelector("h2")?.textContent,
        ...Array.from(col.querySelectorAll(".nova-footer__nav-link")).map((l) => `${l.tagName}:${l.textContent}:${l.getAttribute("href") ?? ""}`),
      ]),
    },
  };
}

function url() {
  const { pathname, search } = h.current();
  return search ? `${pathname}?${search}` : pathname;
}

/** Full checkpoint: every mounted probe's props, the hooks' inputs, the workspace's own DOM, the effects. */
async function full(step: string) {
  await settle();
  const { shown, mounted } = domState();
  const props: Record<string, unknown> = {};
  for (const name of mounted) props[name] = h.ser(h.props.get(name));
  const hooks: Record<string, unknown> = {};
  for (const [name, args] of [...h.hookArgs.entries()].sort()) hooks[name] = h.ser(args);
  record.push({ step, url: url(), history: h.nav.entries.length, shown, dom: workspaceDom(), hooks, props, effects: drainLog() });
}

/** Compact checkpoint for navigation sweeps: where the reader is and what happened. */
const FOCUS_KEYS: Record<string, string[]> = {
  family: ["focusSection"], calendar: ["focusView", "chartId", "selectedMemberId"], lifeAreas: ["focusSubTab", "active", "chartId"],
  tools: ["activeTool"], ask: ["open"], settingsSession: ["section"], viewSwap: ["viewKey"], lifeModePicker: ["firstRun"],
};
async function compact(step: string) {
  await settle();
  const { shown, mounted } = domState();
  const focus: Record<string, unknown> = {};
  for (const [name, keys] of Object.entries(FOCUS_KEYS)) {
    if (!mounted.includes(name)) continue;
    const p = h.props.get(name)!;
    focus[name] = Object.fromEntries(keys.map((k) => [k, h.ser(p[k])]));
  }
  record.push({
    step, url: url(), history: `${h.nav.index + 1}/${h.nav.entries.length}`, shown,
    activeTab: document.querySelector(".cd-app-body")?.getAttribute("data-active-tab"),
    exploreBack: Boolean(document.querySelector(".cd-main-content__body button[aria-label]")),
    predictionsEnabled: h.hookArgs.get("usePersonalData")?.predictionsEnabled,
    focus, effects: drainLog(),
  });
}

function propOf(probeName: string, key: string): unknown {
  const p = probeName.startsWith("hook:") ? h.hookArgs.get(probeName.slice(5)) : h.props.get(probeName);
  if (!p) throw new Error(`probe ${probeName} never rendered`);
  return p[key];
}

async function call(probeName: string, key: string, ...args: unknown[]) {
  const fn = propOf(probeName, key);
  if (typeof fn !== "function") throw new Error(`${probeName}.${key} is not a function`);
  h.log.push(["→", `${probeName}.${key}`, ...args.map(h.ser)]);
  await act(async () => { await (fn as (...a: unknown[]) => unknown)(...args); });
  await settle();
}

/** A reader cannot act twice inside one task: every action settles first. */
async function click(selector: string, label: string, match?: (el: HTMLElement) => boolean) {
  const all = Array.from(document.querySelectorAll<HTMLElement>(selector));
  const el = match ? all.find(match) : all[0];
  if (!el) throw new Error(`no element for ${label}`);
  h.log.push(["→", label]);
  await act(async () => { el.click(); });
  await settle();
}

async function consumeFocus() {
  for (const [probeName, key] of [["family", "focusSection"], ["calendar", "focusView"], ["lifeAreas", "focusSubTab"]]) {
    const p = h.props.get(probeName);
    if (p && p[key] != null && document.querySelector(`output[data-probe="${probeName}"]`)) await call(probeName, "onFocusConsumed");
  }
}

async function historyMove(delta: -1 | 1) {
  h.log.push(["→", delta < 0 ? "browser.back" : "browser.forward"]);
  await act(async () => {
    h.nav.index += delta;
    h.nav.listeners.forEach((l) => l());
  });
  await settle();
}
const historyBack = () => historyMove(-1);

async function confirmDialog() {
  const state = propOf("confirm", "state") as { onConfirm: () => unknown };
  h.log.push(["→", "confirm.state.onConfirm"]);
  await act(async () => { await state.onConfirm(); });
  await settle();
}

const formEvent = () => ({ preventDefault: () => undefined });

function memberForm() {
  return {
    displayName: "Bala Synthetic", relationshipToOwner: "spouse", birthDateLocal: "1992-03-03", birthTimeLocal: "07:45",
    birthPlace: "Synthetic Nagar", birthLatitude: "11.5", birthLongitude: "78.25", birthTimezone: "Asia/Kolkata",
    currentPlace: "", currentLatitude: "", currentLongitude: "", currentTimezone: "", memberWeight: "1.00",
    calculateNow: true, birthTimeSource: "family_record", birthTimeConfidenceMinutes: "15",
  };
}

function lastStep() {
  return record.at(-1)!;
}
function lastDom() {
  return lastStep().dom as ReturnType<typeof workspaceDom>;
}
function lastProps(probeName: string) {
  return (lastStep().props as Record<string, Record<string, unknown>>)[probeName];
}
function lastEffects() {
  return lastStep().effects as unknown[][];
}

function golden(name: string) {
  return expect(`${JSON.stringify(record, null, 1)}\n`).toMatchFileSnapshot(`./__golden__/dashboard-workspace.${name}.json`);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(`${TODAY}T04:30:00Z`) });
  record = [];
  h.log.length = 0;
  h.props.clear();
  h.hookArgs.clear();
  window.localStorage.clear();
  document.documentElement.lang = "";
  debounced = new Map();
  let id = 1_000_000;
  // Only the persistence debounce uses exactly 500 ms; it is queued and run
  // at an explicit flush, so the write lands in the same checkpoint every run.
  window.setTimeout = ((fn: (...a: unknown[]) => void, ms?: number, ...a: unknown[]) => {
    if (ms !== 500) return realSetTimeout(fn, ms, ...a);
    id += 1;
    debounced.set(id, () => fn(...a));
    return id;
  }) as typeof window.setTimeout;
  window.clearTimeout = ((handle?: number) => {
    if (handle !== undefined && debounced.has(handle)) debounced.delete(handle);
    else realClearTimeout(handle);
  }) as typeof window.clearTimeout;
  const setItem = Storage.prototype.setItem;
  const removeItem = Storage.prototype.removeItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
    h.log.push(["storage.set", k, k === "jothidam-ai-dashboard-state" ? JSON.parse(v) : v]);
    setItem.call(this, k, v);
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, k: string) {
    h.log.push(["storage.remove", k]);
    removeItem.call(this, k);
  });
  vi.stubGlobal("scrollTo", h.rec("window.scrollTo"));
});

afterEach(() => {
  cleanup();
  rendered = null;
  window.setTimeout = realSetTimeout;
  window.clearTimeout = realClearTimeout;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ── Scenarios ───────────────────────────────────────────────────────────────

// Each scenario is ~100 settled actions; 120 s bounds a hang well clear of that.
describe("dashboard workspace behaviour golden", { timeout: 120_000 }, () => {
  it("returning reader: Today, every cross-tab jump, member switches, persistence", async () => {
    const world = returningReader();
    window.localStorage.setItem("jothidam-ai-dashboard-state", JSON.stringify(persisted()));
    start(world);
    await full("cold /dashboard");
    // DXA-02 (D1): bare /dashboard is Today even when the stored state names a tab.
    expect(lastDom().activeTab).toBe("personal");
    // A stored today-or-future date is honoured, so the selected day differs from today here.
    expect(lastProps("today")).toMatchObject({ selectedDate: "2026-10-12", todayDate: TODAY });
    // The owner's aggregate row carries the live score, not the bundle's.
    expect((lastProps("today").familyAggregate as { members: { individualScore: number }[] }).members[0].individualScore).toBe(74);

    const todayJumps: [string, ...unknown[]][] = [
      ["onGoToFamily"], ["onGoToJournal"], ["onGoToCalendar"], ["onGoToLifeAreas"], ["onGoToChart"],
      ["onGoToCharts"], ["onOpenAskVinaadi"], ["onOpenNotificationSettings"], ["onOpenChartGen"],
      ["onOpenMuhurta"], ["onOpenCompatibility"], ["onOpenActivityTiming"], ["onOpenRasipalan"],
      ["onOpenNumerology"], ["onGoToExplore"], ["onGoToAllTools"], ["onOpenFocusPicker"], ["onRetryBundle"],
    ];
    for (const [key, ...args] of todayJumps) {
      await call("hero", "onTabChange", "personal");
      await call("today", key, ...args);
      await compact(`today.${key}`);
      await consumeFocus();
    }

    await call("hero", "onTabChange", "calendar");
    await call("calendar", "onSelectMember", "member-spouse");
    await full("calendar: muhurta for the spouse");
    await call("calendar", "onSelectMember", "member-selfrow");
    await compact("calendar: muhurta for a self-tagged member keeps the focus");
    await call("calendar", "onSelectDate", "2026-10-20");
    await full("calendar: another date");

    await call("hero", "onTabChange", "life-areas");
    await call("lifeAreas", "onSelectMember", "member-child");
    await full("life areas: the child's chart");
    await call("lifeAreas", "onLoadRemedies");
    await call("lifeAreas", "onLoadJadhagamReport");
    await full("life areas: remedies loaded");
    await call("lifeAreas", "onSelectMember", "member-spouse");
    await full("life areas: the spouse's chart");
    await call("lifeAreas", "onSelectMember", null);
    await full("life areas: back to own chart");

    for (const key of ["onGoToPlan", "onGoToChart"]) {
      await call("hero", "onTabChange", "life-areas");
      await call("lifeAreas", key);
      await compact(`lifeAreas.${key}`);
    }
    await call("hero", "onTabChange", "family");
    await full("family & charts");
    for (const key of ["onGoToJournal", "onGoToLifeAreas", "onGoToRemedies", "onGoToForecast", "onGoToTools", "onOpenSetup", "onOpenPrasna"]) {
      await call("hero", "onTabChange", "family");
      await call("family", key);
      await compact(`family.${key}`);
      await consumeFocus();
    }
    await call("hero", "onTabChange", "family");
    await call("family", "onClosePrasna");
    await call("family", "onRefreshFamily");
    await compact("family: prasna closed, refreshed");

    for (const key of ["onGoToLifeAreas", "onGoToCalendar", "onGoToMuhurta", "onGoToJournal", "onGoToChart"]) {
      await call("hero", "onTabChange", "plan");
      await call("plan", key);
      await compact(`plan.${key}`);
      await consumeFocus();
    }
    await call("hero", "onTabChange", "plan");
    await call("plan", "onAddGoal", "marriage");
    await call("plan", "onRemoveGoal", "goal-1");
    await call("plan", "onRunWhatIf");
    await full("plan pane");

    await call("hero", "onTabChange", "journal");
    await call("journal", "onEntrySaved");
    await call("journal", "onEntryArchived");
    await call("journal", "onGoToChart");
    await compact("journal.onGoToChart");
    await call("hero", "onTabChange", "journal");
    await call("journal", "onManageContext");
    await full("journal.onManageContext → settings");

    await call("hero", "onTabChange", "explore");
    await full("explore pane");
    await call("explore", "onNavigate", "calendar");
    await compact("explore → calendar shows the way back");
    await click(".cd-main-content__body button[aria-label]", "explore-back button");
    await compact("back to explore");
    await call("explore", "onNavigate", "journal");
    await call("hero", "onTabChange", "journal");
    await compact("a plain tab change drops the way back");

    for (const key of ["onOpenNotificationSettings", "onGoToSettings", "onSignOut", "onAskVinaadi", "onUserMenuToggle", "onUserMenuClose", "onInboxOpen", "onMarkAllRead"]) {
      await call("hero", key);
      await compact(`hero.${key}`);
    }
    await call("hero", "onMarkOneRead", "inbox-1");
    await call("hero", "onDateChange", "2026-10-15");
    await full("hero: date changed");

    for (const label of ["Calendar", "Life Areas", "Family & Charts", "Journal", "Settings", "Today"]) {
      await click("button.nova-footer__nav-link", `footer.${label}`, (b) => b.textContent === label);
      await compact(`footer.${label}`);
    }

    await click(".cd-feedback-fab", "feedback button");
    await compact("feedback opened");
    await call("feedback", "onClose");

    await flushPersistence();
    await full("persisted");
    const written = lastEffects().filter((e) => e[0] === "storage.set" && e[1] === "jothidam-ai-dashboard-state").at(-1)![2] as Record<string, unknown>;
    expect(written).not.toHaveProperty("activeTab");
    expect(written).toMatchObject({ hasVisitedReading: true, selectedDate: "2026-10-15" });
    await golden("returning-reader");
  });

  it("addresses destinations by URL, legacy param, history and tools", async () => {
    const paths = [
      "/dashboard", "/dashboard/today", "/dashboard/calendar", "/dashboard/goals", "/dashboard/life-areas",
      "/dashboard/family", "/dashboard/journal", "/dashboard/explore", "/dashboard/tools",
      "/dashboard/tools/numerology", "/dashboard/tools/compatibility", "/dashboard/tools/not-a-tool",
      "/dashboard/settings", "/dashboard/settings/setup", "/dashboard/settings/notifications",
      "/dashboard/settings/danger-zone", "/dashboard/settings/nope", "/dashboard/nonsense", "/dashboard/qa",
      "/dashboard?tab=journal", "/dashboard?tab=settings", "/dashboard?tab=bogus&keep=1", "/dashboard/calendar?tab=journal&x=2",
    ];
    for (const path of paths) {
      start(returningReader(), path);
      await compact(`cold ${path}`);
      cleanup();
      h.props.clear();
    }

    // A legacy ?tab= link lands where it names, with one canonicalising replace.
    for (const [path, url, tab] of [["/dashboard?tab=journal", "/dashboard/journal", "journal"], ["/dashboard?tab=settings", "/dashboard/settings/setup", "settings"]]) {
      const legacy = record.find((c) => c.step === `cold ${path}`)!;
      expect(legacy).toMatchObject({ url, activeTab: tab });
      expect((legacy.effects as unknown[][]).filter((e) => String(e[0]).startsWith("router."))).toEqual([["router.replace", url, { scroll: false }]]);
    }

    // Before /auth/me the URL sync is dormant: a reader can still press Back or click a tab.
    {
      const waiting = returningReader();
      waiting.session = { ...waiting.session, hydrated: false };
      start(waiting, "/dashboard/calendar");
      h.nav.entries = [{ pathname: "/dashboard", search: "" }, { pathname: "/dashboard/calendar", search: "" }];
      h.nav.index = 1;
      await compact("before /auth/me: calendar, with Today behind it");
      await historyBack();
      await compact("before /auth/me: Back to bare /dashboard");
      rerender((w) => { w.session = { ...w.session, hydrated: true }; });
      await compact("after /auth/me, following a Back to bare /dashboard");
      expect(lastStep()).toMatchObject({ url: "/dashboard", activeTab: "personal" });
      expect(lastEffects().filter((e) => String(e[0]).startsWith("router."))).toEqual([]);
      cleanup();
      h.props.clear();
    }
    {
      const waiting = returningReader();
      waiting.session = { ...waiting.session, hydrated: false };
      start(waiting, "/dashboard");
      await call("hero", "onTabChange", "journal");
      await compact("before /auth/me: a Journal click on bare /dashboard");
      rerender((w) => { w.session = { ...w.session, hydrated: true }; });
      await compact("after /auth/me, following a Journal click");
      expect(lastStep()).toMatchObject({ url: "/dashboard/journal", activeTab: "journal" });
      expect(lastEffects().filter((e) => String(e[0]).startsWith("router."))).toEqual([["router.push", "/dashboard/journal", { scroll: false }]]);
      cleanup();
      h.props.clear();
    }

    // First paint comes before /auth/me answers: the path alone must place the reader.
    for (const path of ["/dashboard/settings/notifications", "/dashboard/tools/numerology", "/dashboard/calendar", "/dashboard?tab=journal"]) {
      const waiting = returningReader();
      waiting.session = { ...waiting.session, hydrated: false };
      start(waiting, path);
      await compact(`before /auth/me: ${path}`);
      rerender((w) => { w.session = { ...w.session, hydrated: true }; });
      await compact(`after /auth/me: ${path}`);
      cleanup();
      h.props.clear();
    }

    start(returningReader(), "/dashboard/calendar");
    await compact("cold calendar");
    await call("hero", "onTabChange", "journal");
    await compact("tab click pushes");
    await call("hero", "onTabChange", "tools");
    await call("tools", "onOpenTool", "varshaphala");
    await compact("tool opened");
    await call("tools", "onLoadVarshaphala", 2027);
    await full("varshaphala loaded");
    await call("tools", "onOpenTool", "muhurta-finder-is-not-an-id");
    await compact("unknown tool id closes");
    await call("tools", "onOpenTool", "babynames");
    await call("tools", "onCloseTool");
    await compact("tool closed");
    await call("tools", "onGoToPlan");
    await compact("tools.onGoToPlan");
    await call("hero", "onTabChange", "tools");
    await call("tools", "onGoToCalendar");
    await compact("tools.onGoToCalendar");
    await call("tools", "onOpenAskVinaadi");
    await call("tools", "onDateChange", "2026-11-01");
    await compact("tools: ask + date");

    for (const n of [1, 2, 3, 4]) {
      await historyBack();
      await compact(`back ×${n}`);
    }
    await historyMove(1);
    await compact("forward");

    await call("hero", "onTabChange", "explore");
    await call("explore", "onNavigate", "calendar");
    await compact("explore → calendar: way back offered");
    await historyBack();
    await historyMove(1);
    await compact("back and forward again: a history move drops the way back");

    await call("hero", "onGoToSettings");
    await compact("settings via hero");
    // A jump to the tab already shown navigates nowhere, so the effect that
    // consumes the push intent never runs. It must therefore not arm it: the
    // rail change on the next line is app-chosen and has to replace. Dropping
    // the guard in goToTab flips exactly this step to router.push, which is how
    // "does Back leave Settings?" came to depend on the click before it.
    await call("hero", "onTabChange", "settings");
    await call("settingsSession", "onNavigate", "appearance");
    await compact("a no-op jump does not leave the next move pushing");
    for (const section of ["notifications", "setup", "privacy", "context"]) {
      await call(section === "privacy" ? "setup" : "settingsSession", "onNavigate", section);
      await compact(`settings → ${section}`);
    }
    await call("settingsSession", "onLangChange", "ta");
    await full("settings pane in Tamil");
    await golden("url-addressing");
  });

  it("language: server-rendered Tamil, stored and DB preferences, toggle", async () => {
    const world = returningReader();
    world.serverLang = "ta";
    start(world);
    await full("first paint in Tamil with nothing stored");
    rerender((w) => { w.family.selectedVaultId = ""; });
    await call("hero", "onTabChange", "settings");
    await call("setup", "onMemberFormChange", memberForm());
    await call("setup", "onAddMember", formEvent());
    await compact("Tamil reader's first member names the new family in Tamil");
    const vaultPost = record.at(-1)!.effects as unknown[][];
    expect(vaultPost.find((e) => e[0] === "api" && e[2] === "/api/v1/family-vaults")?.[3]).toMatchObject({ name: "உங்கள் குடும்பம்" });
    cleanup();

    const stored = returningReader();
    stored.serverLang = "ta";
    stored.dbLang = "en";
    window.localStorage.setItem("jothidam-ai-dashboard-state", JSON.stringify(persisted({ lang: "ta" })));
    start(stored);
    await compact("stored Tamil, DB English wins");
    await call("hero", "onLangToggle");
    await full("toggled to Tamil");
    await call("hero", "onGoToSettings");
    await call("settingsSession", "onNavigate", "appearance");
    await call("hero", "onTabChange", "explore");
    await call("explore", "onNavigate", "family");
    await full("Tamil: back-to-explore label");
    cleanup();

    const otherUser = returningReader();
    window.localStorage.setItem("jothidam-ai-dashboard-state", JSON.stringify(persisted({ ownerUserId: "user-someone-else", lang: "ta" })));
    start(otherUser);
    await compact("another user's stored state is cleared, not applied");
    cleanup();

    const past = returningReader();
    window.localStorage.setItem("jothidam-ai-dashboard-state", JSON.stringify(persisted({ selectedDate: "2026-10-01" })));
    start(past);
    await compact("a stored past date is not restored");
    await golden("language");
  });

  it("first run: setup gate, create profile, add the first member, onboarding banner", async () => {
    const world = returningReader();
    Object.assign(world.personal, { birthProfileId: "", chartId: "", chart: null, chartSummary: null, dailyGuidance: null, panchangam: null });
    Object.assign(world.family, { vaults: [], selectedVaultId: "", familyAggregate: null, memberCharts: [], familyMembers: [] });
    world.lifeMode = { ...(world.lifeMode as object), showLifeModePicker: true };
    start(world);
    await full("no profile: setup gate");

    await call("setup", "onCreateProfile", formEvent());
    await full("create with an empty form: errors, no request");

    const form = { ...persisted().birthForm, ownerUserId: "", currentPlace: "Elsewhere", currentLatitude: "0", currentLongitude: "0", currentTimezone: "UTC", maritalStatus: "married" };
    await call("setup", "onBirthFormChange", form);
    await call("setup", "onFormErrorChange", { displayName: "" });
    await call("setup", "onCreateProfile", formEvent());
    await full("created with a chart: lands on Family & Charts");
    // T5: a freshly calculated chart opens on the reading, not on Today.
    expect(lastDom().activeTab).toBe("family");

    world.createdChartId = null;
    await call("hero", "onTabChange", "settings");
    await call("setup", "onCreateProfile", formEvent());
    await compact("created without a chart: lands on Today");

    await call("hero", "onTabChange", "settings");
    await call("setup", "onAddMember", formEvent());
    await compact("member form empty: errors");
    await call("setup", "onMemberFormChange", memberForm());
    await call("setup", "onAddMember", formEvent());
    await full("first member: family created on submit");

    await call("setup", "onShowEditProfile");
    await call("setup", "onGoToPersonal");
    await call("setup", "onModeChange", "TRADITIONAL");
    await full("mode saved, edit-profile open");

    rerender((w) => {
      Object.assign(w.personal, { birthProfileId: OWNER_BP, chartId: "chart-owner", chart: returningReader().personal.chart });
      Object.assign(w.family, { vaults: [{ familyVaultId: VAULT, ownerUserId: USER, name: "Synthetic household", memberCount: 0 }] });
    });
    await full("profile, empty vault: banner with step 1 done");
    // Step 3 ("read your reading") is not done merely because a profile exists.
    expect(lastDom().onboarding?.badges).toEqual([
      "cd-onboarding__step-badge is-done", "cd-onboarding__step-badge is-pending", "cd-onboarding__step-badge is-pending",
    ]);
    await call("lifeModePicker", "onSelected", { ...(world.lifeMode as object), mode: "STUDY", showLifeModePicker: false, focusArea: "STUDY", focusActivities: ["exam"] });
    await call("lifeModePicker", "onClose");
    await click(".cd-onboarding__cta", "onboarding CTA");
    await full("picker answered, banner CTA");
    cleanup();

    const loading = returningReader();
    Object.assign(loading.family, { vaultsReady: false, vaults: [] });
    start(loading);
    await full("vault list not fetched yet: no banner either way");
    expect((lastStep().dom as { onboarding: unknown }).onboarding).toBeNull();
    rerender((w) => { Object.assign(w.family, { vaultsReady: true, vaults: returningReader().family.vaults }); });
    await compact("vault list arrives with members: still no banner");
    await golden("first-run");
  });

  it("family and profile mutations, focus and check-ins", async () => {
    const world = returningReader();
    world.personal.panchangamTimezone = "Europe/London";
    window.localStorage.setItem("jothidam-ai-dashboard-state", JSON.stringify(persisted({ hasVisitedReading: true })));
    start(world, "/dashboard/family");
    await full("family deep link, location mismatch on Today");

    await call("family", "onEditMember", (world.family.familyAggregate as { members: unknown[] }).members[1]);
    await full("edit spouse: relationship read from the vault row");
    await call("editMember", "onSave");
    await full("spouse saved");
    await call("family", "onEditMember", aggregateRow("member-unloaded", "bp-x", "Not Loaded", 40));
    await compact("member with no loaded chart: nothing opens");

    // The vault row owns the relationship; a chart that says otherwise must not win.
    rerender((w) => {
      w.family = {
        ...w.family,
        memberCharts: [...(w.family.memberCharts as unknown[]), memberChart("member-elder", "Devi Synthetic", "self", 55)],
        familyMembers: [...(w.family.familyMembers as unknown[]), { familyMemberId: "member-elder", relationshipToOwner: "parent" }],
      };
    });
    await call("family", "onEditMember", aggregateRow("member-elder", "bp-member-elder", "Devi Synthetic", 55));
    await full("edit a member whose chart disagrees with the vault row");
    expect(propOf("editMember", "editMember")).toMatchObject({ relationshipToOwner: "parent", memberWeight: "1.15" });
    await call("editMember", "onClose");

    await call("family", "onDeleteMember", "member-child", "Chitra Synthetic");
    await full("remove member: confirm");
    await call("confirm", "onClose");
    await call("family", "onDeleteMember", "member-child", "Chitra Synthetic");
    await confirmDialog();
    await full("member removed");
    await call("family", "onDeleteVault", VAULT, "Synthetic household");
    await confirmDialog();
    await full("vault deleted");
    await call("family", "onSelectVault", { familyVaultId: "vault-other", ownerUserId: "user-other", name: "Other", memberCount: 3 });
    await compact("vault selected");

    await call("family", "onEditSelf");
    await call("editProfile", "onChange", { ...persisted().birthForm, currentPlace: "", maritalStatus: "married" });
    await call("editProfile", "onSubmit", formEvent());
    await full("own profile saved");
    await call("family", "onEditSelf");
    await call("editProfile", "onOpenRectification");
    await call("rectification", "onApply", "06:41");
    await call("editProfile", "onDeleteProfile");
    await confirmDialog();
    await full("rectified, then deleted");

    await call("hero", "onTabChange", "settings");
    await call("setup", "onEditBirthProfile", birthProfile(OWNER_BP, "Akila Synthetic", "self", { currentPlace: "Elsewhere", currentLatitude: 1, currentLongitude: 2, currentTimezone: "UTC" }));
    await call("editMember", "onChange", { ...(propOf("editMember", "editMember") as object), currentPlace: "" });
    await call("editMember", "onSave");
    await full("bare profile edited, current location cleared");

    await call("hero", "onTabChange", "personal");
    await full("Today: the focus nudge outranks the location check");
    await call("today", "onKeepFocus");
    await full("focus kept: the location mismatch takes the slot");
    await call("today", "onDismissFocusNudge");
    await call("today", "onDismissLocationCheck");
    await call("today", "onLocationResolved");
    await full("check-ins answered");

    await call("hero", "onTabChange", "life-areas");
    await call("lifeAreas", "onSelectMember", "member-spouse");
    await call("hook:usePlanData", "onGoalAdded", "marriage");
    await call("hook:usePlanData", "onGoalRemoved");
    await call("hook:usePlanData", "onError", "synthetic plan error");
    await compact("goals changed while reading the spouse");
    await call("lifeAreas", "onSelectMember", null);
    await call("hook:usePlanData", "onGoalAdded", "marriage");
    await compact("goals changed on the own chart");

    await call("hero", "onTabChange", "settings");
    await call("setup", "onNavigate", "experience");
    await call("settingsSession", "onSaveLifeMode", "WEALTH");
    await call("settingsSession", "onSaveUserSettings", "BEGINNER");
    world.failAuthMe = true;
    await call("settingsSession", "onSaveUserSettings", "TRADITIONAL");
    await call("settingsSession", "onRefreshPersonal");
    await call("settingsSession", "onRefreshFamily");
    await call("settingsSession", "onSaveJournalRetentionDays", 90);
    await call("settingsSession", "onAcknowledgeJournalReminder");
    await call("settingsSession", "onApplyRetention", true);
    await call("settingsSession", "onContextUpdated", { tag: "context-2" });
    await call("settingsSession", "onNotificationPrefsSaved", { tag: "prefs-2" });
    await call("settingsSession", "onSelectedDateChange", "2026-10-30");
    await full("settings actions");

    await call("hook:useSession", "onSetupRedirect");
    await compact("session setup redirect");

    await flushPersistence();
    await compact("persisted");
    await golden("mutations");
  });
});
