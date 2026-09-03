/**
 * F8 measurement: how many times does a tab cycle put the same request on the
 * wire?
 *
 * The six panels migrated in F8 shared a hand-rolled `useState`/`useEffect`
 * fetch that lived outside react-query, so each one refetched on every mount —
 * i.e. every tab switch, for data that is stable for a day. `/event-windows` was
 * worse: fetched two entirely different ways, so Plan and Life Areas each kept
 * their own copy.
 *
 * This counts requests per endpoint across Today → Goals → Life Areas → Today,
 * which is the cycle docs/EFFICIENCY_FIX_PLAN_2026-08-07.md names. Run it with
 * the F8 commit stashed to get the "before" column.
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const RUN_ID = Date.now();
const EMAIL = `tab-cycle-${RUN_ID}@e2e.test`;
const PASSWORD = "TabCycle!Test123";
const CSRF_HEADERS = { "X-Vinaadi-CSRF": "1" };

test.describe.configure({ mode: "serial" });
test.setTimeout(240_000);

let context: BrowserContext;
let page: Page;

/** endpoint (normalised, chart id stripped) -> times requested */
const counts = new Map<string, number>();

/** Strip ids and query strings so the same endpoint aggregates into one row. */
function normalise(url: string): string {
  return url
    .split("?")[0]
    .replace(/.*\/api\/backend\/api\/v1\//, "")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "{id}");
}

/** Chart-scoped reads whose payload does not change during a tab cycle. */
const WATCHED = [
  "shadbala",
  "ashtottari-dasha",
  "yogini-dasha",
  "kalachakra-dasha",
  "conditional-dashas",
  "propensities",
  "event-windows",
];

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  const api = context.request;

  const reg = await api.post("/api/backend/api/v1/auth/register", { data: { email: EMAIL, password: PASSWORD, consentGiven: true } });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  const login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);

  const bp = await api.post("/api/backend/api/v1/birth-profiles", {
    data: {
      displayName: "E2E Cycle Owner",
      relationshipToOwner: "self",
      birthDateLocal: "1990-05-15",
      birthTimeLocal: "08:30:00",
      birthPlace: "Chennai, Tamil Nadu, India",
      birthLatitude: 13.0827,
      birthLongitude: 80.2707,
      birthTimezone: "Asia/Kolkata",
      calculateNow: true,
      genderForTraditionalRules: "male",
      maritalStatus: "married",
    },
    headers: CSRF_HEADERS,
  });
  if (!bp.ok()) throw new Error(`birth profile failed: ${bp.status()} ${await bp.text()}`);

  // A marriage goal is what makes the Plan tab request `/event-windows` at all
  // (`hasEvent("MARRIAGE")` gates the query), and the Life Areas panel requests
  // the same URL by its own route. Without a goal, the very duplication this
  // spec exists to measure never happens.
  const chartId = ((await bp.json()) as { data?: { chartId?: string } })?.data?.chartId;
  if (!chartId) throw new Error("birth profile response carried no chartId");
  const goal = await api.post("/api/backend/api/v1/goals", {
    data: { chartId, goalType: "marriage" },
    headers: CSRF_HEADERS,
  });
  if (!goal.ok()) throw new Error(`goal failed: ${goal.status()} ${await goal.text()}`);

  page = await context.newPage();
  await page.addInitScript(() => window.localStorage.setItem("vinaadi.ui", "nova"));

  page.on("request", (req) => {
    const url = req.url();
    if (!url.includes("/api/backend/api/v1/")) return;
    const hit = WATCHED.find((w) => url.includes(w));
    counts.set(hit ?? normalise(url), (counts.get(hit ?? normalise(url)) ?? 0) + 1);
  });

  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(2000);
});

test.afterAll(async () => {
  await context.close();
});

async function dismissDialogs(attempts = 12) {
  for (let i = 0; i < attempts; i++) {
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    if (!(await dialog.isVisible().catch(() => false))) {
      await page.waitForTimeout(300);
      if (!(await dialog.isVisible().catch(() => false))) return;
    }
    await dialog.click({ position: { x: 3, y: 3 }, force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function settle() {
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if ((await page.locator(".skel").count().catch(() => 0)) === 0) break;
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(800);
}

async function goTab(label: string) {
  await dismissDialogs();
  await page.getByRole("button", { name: label, exact: true }).first().click();
  await page.waitForTimeout(1000);
  await settle();
}

/**
 * The plan names "Today → Plan → Life Areas → Today", but measured, that cycle
 * mounts only ONE of the six panels. Five of them (shadbala + the three
 * secondary dashas + conditional) render from `dashboard-family-charts-hybrid`,
 * i.e. the Family & Charts tab — and also from
 * `dashboard-charts-panel-nova.tsx`, which is one of F11's 13 orphans, so that
 * second render site ships to nobody. The cycle below is the one that actually
 * exercises them.
 */
test("Today -> Goals -> Life Areas -> Today, twice", async () => {
  await dismissDialogs();
  await settle();
  counts.clear(); // ignore the initial page load; measure the cycle only

  const lap = async () => {
    await goTab("Goals");
    await goTab("Life Areas");
    await goTab("Today");
  };

  await lap();
  // Second lap — this is where a hand-rolled fetch shows up, because every
  // remount re-requests while a cached query does not.
  await lap();

  const afterLaps = counts.get("event-windows") ?? 0;

  // THE ACTUAL DUPLICATION. `EventWindowsPanel` in Life Areas is lazy —
  // `autoLoad` is not passed, so it renders "Select an event type above" and
  // fetches nothing until a tab is clicked. That is why two laps alone never
  // reproduce it. Plan has already fetched MARRIAGE windows by now; clicking
  // Marriage here asks for the identical URL. Sharing one react-query key means
  // the click is served from cache instead of crossing the wire again.
  await goTab("Life Areas");
  for (const name of [/Overview/i, /Predictions/i]) {
    const tab = page.getByRole("tab", { name }).first();
    if (await tab.isVisible().catch(() => false)) {
      await tab.click();
      await settle();
      break;
    }
  }
  const marriageTab = page.getByRole("button", { name: /^(Marriage|திருமணம்|Relationship & Harmony|உறவு & இணக்கம்)$/ }).first();
  const clicked = await marriageTab.isVisible().catch(() => false);
  if (clicked) {
    await marriageTab.click();
    await settle();
  }
  // eslint-disable-next-line no-console
  console.log(
    `\n[tab-cycle] event-windows after 2 laps: ${afterLaps}` +
      `\n[tab-cycle] Life Areas event tab reachable: ${clicked}` +
      `\n[tab-cycle] event-windows after clicking it: ${counts.get("event-windows") ?? 0}`,
  );

  const all = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const rows = all.map(([k, v]) => `    ${String(v).padStart(3)}x  ${k}`).join("\n");
  const total = all.reduce((sum, [, v]) => sum + v, 0);
  // eslint-disable-next-line no-console
  console.log(`\n[tab-cycle] every v1 request over two laps (${total} total):\n${rows}`);

  const repeated = all.filter(([, v]) => v > 1);
  // eslint-disable-next-line no-console
  console.log(
    `[tab-cycle] endpoints requested more than once: ${repeated.length}\n` +
      repeated.map(([k, v]) => `    ${v}x ${k}`).join("\n"),
  );

  // The cycle must have exercised something, or a "pass" here means nothing —
  // the failure mode this file hit on its first run, when it watched six panels
  // that the named cycle never mounts.
  expect(total, "the cycle issued no API requests at all — it proved nothing").toBeGreaterThan(0);
  expect(counts.get("event-windows") ?? 0, "event-windows crossed the wire more than once").toBeLessThanOrEqual(1);

  /**
   * `life-event-log` was the one exception this spec recorded as known-open: it
   * was fetched once per lap, being one of the ~30 hand-rolled `apiFetchJson`
   * blocks outside react-query that F8's proving run deliberately did not
   * rewrite. It has since been migrated on touch (`useApiQuery`, one key shared
   * by both of its mount sites), so the exception list is now empty and this
   * assertion is the strict form: NOTHING may be requested twice over two laps.
   */
  expect(
    [...counts.entries()].filter(([, v]) => v > 1).map(([k]) => k).sort(),
    "an endpoint refetched on a tab switch — see the table above",
  ).toEqual([]);
});
