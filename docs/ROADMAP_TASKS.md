# Vinaadi AI — Consolidation & Mobile Gap Closure Roadmap

**Repo root:** `D:\sanstro`  
**Monorepo tool:** pnpm workspaces (`mobile/`, `packages/*`, `web/`)  
**Shared package name:** `@vinaadi/shared` (`packages/shared/`)  
**Design tokens package:** `@vinaadi/design-tokens` (`packages/design-tokens/`)

Read this file top to bottom before starting any task. Each phase depends on the previous one being complete and tested.

---

## Phase 1 — Consolidate Shared Utilities (Days 1–2)

**Goal:** Eliminate duplicated score, date, and API utility code so every new feature is written once and used by both platforms.

### 1-A — Canonical Score Utilities

**Problem:** Two separate implementations with different thresholds exist today:
- `mobile/src/lib/score.ts` — `scoreTone()` using thresholds 75 / 55
- `web/lib/format.ts` — `scoreColor()` / `scoreColorPct()` using thresholds 65 / 45

**Target file:** `packages/shared/src/utils/score.ts` (create new)

**What to build:**

```ts
// packages/shared/src/utils/score.ts

export type ScoreTone = 'high' | 'mid' | 'low';

/** Canonical thresholds — agreed across both platforms */
export const SCORE_THRESHOLDS = { HIGH: 65, MID: 45 } as const;

/** Returns the tone label for a 0–100 score. */
export function scoreTone(score: number): ScoreTone {
  if (score >= SCORE_THRESHOLDS.HIGH) return 'high';
  if (score >= SCORE_THRESHOLDS.MID) return 'mid';
  return 'low';
}

/** Same but for a 0–1 percentage. */
export function scoreTonePct(pct: number): ScoreTone {
  return scoreTone(pct * 100);
}
```

**Rules:**
- The function returns a **tone label** only — NOT a color. Platforms apply color from their own theme system.
- Web maps tone → CSS var inside `web/lib/format.ts` (keep that mapping there).
- Mobile maps tone → color hex inside `mobile/src/lib/score.ts` (keep that mapping there).
- Both files import `scoreTone` from `@vinaadi/shared/utils/score` and remove their local logic.

**Wire up the export:**
- Add `"./utils/score"` to `packages/shared/package.json` `exports` map.
- Re-export from `packages/shared/src/index.ts`.

**Acceptance:** `pnpm --filter @vinaadi/shared tsc --noEmit` passes. Both `web/lib/format.ts` and `mobile/src/lib/score.ts` import from `@vinaadi/shared/utils/score`.

---

### 1-B — Canonical Date / Format Utilities

**Problem:** Date helpers (`todayIso`, `addDays`, `formatDateLabel`, `formatClockLabel`, `formatDateTimeLabel`) live only in `web/lib/format.ts`. Mobile duplicates similar logic inline in components.

**Target file:** `packages/shared/src/utils/format.ts` (create new)

**What to move from `web/lib/format.ts`:**

```ts
// Move these — they have no web/DOM dependency:
export function todayIso(): string { ... }
export function addDays(iso: string, n: number): string { ... }
export function formatDateLabel(iso: string, locale?: string): string { ... }
export function formatClockLabel(timeStr: string): string { ... }
export function formatDateTimeLabel(iso: string, time: string): string { ... }
```

**What to leave in `web/lib/format.ts`:** score color CSS vars, scoreColor(), scoreColorPct(), getScoreBand() — these are web-specific (CSS custom properties).

**Wire up:**
- Add `"./utils/format"` to `packages/shared/package.json` exports.
- Re-export from `packages/shared/src/index.ts`.
- Update `web/lib/format.ts` to import from `@vinaadi/shared/utils/format` and re-export for backward compat.

**Acceptance:** No date/format logic duplicated between platforms. All existing web and mobile callers compile without change.

---

### 1-C — Move Mobile API Wrappers to Shared

**Problem:** All 22 API wrapper files live only in `mobile/src/api/`. Web makes raw `apiFetchJson()` calls scattered across `web/hooks/` instead of reusing these wrappers.

**Existing mobile API files to move** (source: `mobile/src/api/`):

| File | Exports |
|------|---------|
| `auth.ts` | Auth endpoints |
| `charts.ts` | `getChartSummary`, `getChartFull` |
| `guidance.ts` | `getDailyGuidance` |
| `panchangam.ts` | Panchangam endpoints |
| `dasha.ts` | Dasha period endpoints |
| `varshaphala.ts` | Annual predictions |
| `transits.ts` | Transit calculations |
| `rasiPalan.ts` | Rasi palan predictions |
| `vargas.ts` | Varga chart endpoints |
| `lifeAreas.ts` | Life area predictions |
| `lifeEvents.ts` | Life event windows |
| `rectification.ts` | Birth time rectification |
| `decisions.ts` | Decision guidance |
| `relationships.ts` | Relationship analysis |
| `porutham.ts` | Compatibility / porutham |
| `askVinaadi.ts` | Ask Vinaadi AI |
| `goals.ts` | Goal tracking |
| `journal.ts` | Journal endpoints |
| `familyVault.ts` | Family vault |
| `notifications.ts` | Push notifications |
| `tools.ts` | Misc tools |
| `annualWrapped.ts` | Annual wrapped/summary |

**Target location:** `packages/shared/src/api/` (one file per domain, same names)

**The shared API client:** Create `packages/shared/src/api/client.ts` that accepts a `fetcher` function injected by each platform — this avoids coupling to `fetch` vs Axios vs any native implementation:

```ts
// packages/shared/src/api/client.ts

export type ApiGet = (path: string, params?: Record<string, string>) => Promise<unknown>;
export type ApiPost = (path: string, body?: unknown) => Promise<unknown>;

export interface ApiClient {
  get: ApiGet;
  post: ApiPost;
}

let _client: ApiClient | null = null;

export function initApiClient(client: ApiClient) {
  _client = client;
}

export function getApiClient(): ApiClient {
  if (!_client) throw new Error('API client not initialised — call initApiClient() at app startup');
  return _client;
}
```

**Mobile wires it up** in its `mobile/src/api/client.ts` by calling `initApiClient({ get: apiGet, post: apiPost })` at startup.

**Web wires it up** in `web/lib/api.ts` similarly.

**Each domain file** calls `getApiClient().get(...)` instead of importing from `../client` directly.

**Wire up:**
- Add `"./api"` and `"./api/client"` to `packages/shared/package.json` exports.
- Mobile: update `mobile/src/api/*.ts` to re-export from `@vinaadi/shared/api/*` (thin re-exports for backward compat with existing mobile import paths).
- Web: update `web/hooks/*.ts` to import from `@vinaadi/shared/api/*` instead of calling `apiFetchJson` directly.

**Acceptance:** All 22 API wrapper files have a single canonical home in `packages/shared/src/api/`. Both platforms compile. Adding a new endpoint = add one function in `packages/shared/src/api/<domain>.ts`, done.

---

## Phase 2 — Close Critical Mobile Gaps (Weeks 2–3)

**Goal:** Add the highest-value missing features to mobile. Users expect these tools; they are already fully implemented on web.

All new mobile screens live under `mobile/src/screens/` and are registered in the navigator. Use existing mobile patterns: React Query `useQuery` with `STALE` constants from `mobile/src/lib/queryClient.ts`, themed colors via `useColors()`, typography from `mobile/src/theme/typography.ts`.

---

### 2-A — Friendship Compatibility Tool (Effort: Low)

**Missing screen:** `mobile/src/screens/tools/FriendshipCompatibility.tsx`

**What it does:** User selects two birth profiles from family vault; app calls the compatibility/porutham API and displays a score with breakdown by porutham categories.

**API:** `@vinaadi/shared/api/porutham.ts` — already exists post-Phase 1.

**Nav registration:** Add to the Tools tab stack in `mobile/src/navigation/`.

**Component checklist:**
- Profile picker (reuse `FamilyMemberPicker` component if it exists, else build a simple list sheet)
- Porutham score display (ring chart or progress bars per category)
- Tamil / English label toggle (use `useI18n` from `mobile/src/hooks/useI18n.ts`)

---

### 2-B — Jadhagam Generator (Effort: Low)

**Missing screen:** `mobile/src/screens/tools/JadhagamGenerator.tsx`

**What it does:** Renders the full birth chart (rasi + navamsa grids) for the active profile. Web equivalent is in `web/components/charts/`.

**API:** `@vinaadi/shared/api/charts.ts` → `getChartFull(chartId)`.

**Component checklist:**
- Rasi grid (9-cell SVG or View-based layout — use the same grid used in Insights tab if one exists)
- Planet placement labels in Tamil/English
- Export/share button (React Native Share API)

---

### 2-C — Daily Panchangam Planner (Effort: Low)

**Missing screen:** `mobile/src/screens/tools/DailyPanchangam.tsx`

**What it does:** Shows tithi, nakshatra, yoga, karanam, rahu kalam, and auspicious/inauspicious windows for a selected date.

**API:** `@vinaadi/shared/api/panchangam.ts` — already exists post-Phase 1.

**Component checklist:**
- Date picker (default: today, scroll to nearby dates)
- Panchangam summary card (tithi, nakshatra, yoga, karanam)
- Time-window timeline (rahu kalam, gulika kalam, yamagandam highlighted in red; auspicious windows in green)
- Query key: `['panchangam', dateIso]` with `STALE.today`

---

### 2-D — Birth Time Rectification Wizard (Effort: Medium)

**Missing screen:** `mobile/src/screens/tools/Rectification.tsx` (full multi-step wizard)

**What it does:** Guides the user through a questionnaire about life events to narrow the birth time. Web has a full implementation to reference.

**API:** `@vinaadi/shared/api/rectification.ts` — already exists post-Phase 1.

**Wizard steps:**
1. Confirm approximate birth time range (slider ± minutes)
2. Life event questions (marriage, career, relocations — dynamic questions from API)
3. Candidate birth times ranked by match score
4. Confirm selection → updates birth profile

**Component checklist:**
- Step indicator (e.g. `StepDots` component)
- Slider for time range (use `@miblanchard/react-native-slider` or equivalent already in project)
- Dynamic question cards with Yes/No/Unsure answers
- Ranked result list with confidence percentage
- Mutation to update birth time on confirmation

---

### 2-E — Nakshatra Visual Pages (Effort: Medium)

**Missing screens:** `mobile/src/screens/learn/NakshatraList.tsx` and `mobile/src/screens/learn/NakshatraDetail.tsx`

**What it does:** Browsable list of all 27 nakshatras. Each detail page shows the deity, ruling planet, qualities, compatibility, and famous personalities.

**Data source:** Static JSON — no API call needed. Content can live in `packages/shared/src/data/nakshatras.ts` (27 entries, each with id, name in Tamil/English, deity, planet, qualities array, description).

**Component checklist:**
- Grid of 27 nakshatra cards (3-column) with Sanskrit name + star symbol
- Detail screen: header image/icon, bilingual name, section cards (deity, planet, qualities, compatibility)
- Deep link: highlight the user's birth nakshatra when arriving from their profile

---

### 2-F — Tamil Calendar with Festivals (Effort: Medium)

**Missing screen:** `mobile/src/screens/calendar/TamilCalendar.tsx`

**What it does:** Month view calendar showing Tamil month/year, panchangam data per day, and festival markers.

**API:** Monthly panchangam — `@vinaadi/shared/api/panchangam.ts`.

**Data source:** Festival list — static JSON in `packages/shared/src/data/festivals.ts` (date → festival name in Tamil/English, keyed by Gregorian date).

**Component checklist:**
- Month grid (reuse or adapt `web/components/MonthlyCalendar` pattern)
- Each cell: Gregorian date, Tamil date (e.g. "ஆனி 15"), festival dot
- Tap a day → bottom sheet with panchangam summary for that day
- Month navigation arrows
- Query key: `['panchangam', 'monthly', yearMonth]` with `STALE.today`

---

### 2-G — Privacy / Terms Pages (Effort: Low)

**Missing screens:** `mobile/src/screens/settings/PrivacyPolicy.tsx` and `mobile/src/screens/settings/TermsOfService.tsx`

**What it does:** Static scrollable pages. Content is plain text / simple Markdown.

**Implementation:** Use `react-native-markdown-display` (check if already installed) or a simple `ScrollView` with `Text` components. Source content from `packages/shared/src/data/legal.ts` (strings for both platforms to share).

**Nav registration:** Add to the Settings screen stack.

---

## Phase 3 — Migrate Web to React Query (Week 4)

**Goal:** Replace the 8 manual `useState + AbortController` hooks in `web/hooks/` with React Query, matching the mobile pattern already in `mobile/src/lib/queryClient.ts`.

This phase is optional but valuable — it eliminates ~1,348 lines of manual fetch management and enables cache sharing patterns with mobile later.

### 3-A — Install and Configure React Query on Web

```bash
pnpm --filter web add @tanstack/react-query @tanstack/react-query-devtools
```

Create `web/lib/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';

export const STALE = {
  today: 1000 * 60 * 60 * 24,       // 1 day
  session: 1000 * 60 * 30,           // 30 min
  static: Infinity,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE.today,
      retry: 1,
    },
  },
});
```

Wrap `web/app/layout.tsx` with `<QueryClientProvider client={queryClient}>`.

---

### 3-B — Migrate Each Hook

Migrate hooks one at a time. Pattern for each:

**Before (`web/hooks/usePersonalData.ts`):**
```ts
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
  const controller = new AbortController();
  apiFetchJson('/api/charts/summary', { signal: controller.signal })
    .then(setData).finally(() => setLoading(false));
  return () => controller.abort();
}, [chartId]);
```

**After:**
```ts
import { useQuery } from '@tanstack/react-query';
import { getChartSummary } from '@vinaadi/shared/api/charts';

export function usePersonalData(chartId: string) {
  return useQuery({
    queryKey: ['chart', 'summary', chartId],
    queryFn: () => getChartSummary(chartId),
    staleTime: STALE.today,
    enabled: !!chartId,
  });
}
```

**Hook migration order (safest to most complex):**

| Hook | Est. Lines | Notes |
|------|-----------|-------|
| `useMonthlyPanchangam.ts` | ~80 | Simple date-keyed query |
| `useJournalData.ts` | ~120 | May need useMutation for writes |
| `usePlanData.ts` | ~150 | Goals — read + write |
| `useFamilyData.ts` | ~200 | Family vault |
| `usePersonalData.ts` | ~300 | Core chart data — test carefully |
| `useBirthProfileForm.ts` | ~150 | Form state — keep local state, only migrate the fetch |
| `useSession.ts` | Skip | Auth state — leave as-is, not a data hook |
| `useTheme.ts` | Skip | UI state — not a data hook |

**Acceptance per hook:** The migrated hook returns `{ data, isLoading, error }` matching the old `{ data, loading, error }` shape (rename `loading` → `isLoading` in callers, or add an alias).

---

## Phase 4 — Shared Design Tokens (Ongoing, Parallel with Phase 2–3)

**Goal:** One source of truth for color values, typography scale, and spacing. Both platforms import tokens from `@vinaadi/design-tokens` — they apply them in their own native way (CSS vars on web, TS constants on mobile).

**Current state:**
- `packages/design-tokens/tokens.json` — DTCG-spec token definitions already exist.
- `mobile/src/theme/colors.ts` — `CLight` object with ~40+ color vars (not yet sourced from tokens).
- Web — CSS custom properties defined in global CSS, not yet sourced from tokens.

### 4-A — Generate Platform Outputs from tokens.json

Add a token build script at `packages/design-tokens/build.ts` that reads `tokens.json` and writes:

1. `packages/design-tokens/dist/web/tokens.css` — CSS custom properties for web (`:root { --color-surface-0: ...; }`)
2. `packages/design-tokens/dist/mobile/tokens.ts` — TypeScript object for mobile (`export const tokens = { color: { surface0: '...' } }`)

**Tool recommendation:** Use `style-dictionary` (check if already installed in `packages/design-tokens/`).

### 4-B — Wire Web

- Import `@vinaadi/design-tokens/dist/web/tokens.css` in `web/app/globals.css` (or layout).
- Remove hardcoded color values from `web/lib/format.ts` and point to the CSS vars from the token output.

### 4-C — Wire Mobile

- Replace `mobile/src/theme/colors.ts` direct values with imports from `@vinaadi/design-tokens/dist/mobile/tokens.ts`.
- The `CLight` export shape stays identical — only the source of values changes. No component changes needed.

**Do NOT share UI components** — web uses HTML/CSS, mobile uses React Native primitives. Only share the raw token values.

---

## What NOT to Do

- **Do not share React components** between web and mobile. Web = HTML. Mobile = React Native. Sharing components means one of them renders broken.
- **Do not rewrite the backend.** The Python/FastAPI app in `app/` is clean and well-structured. Only add endpoints when Phase 2 features need them.
- **Do not redesign mobile navigation.** The current tab structure is already appropriate for mobile.
- **Do not skip the shared package's `tsc --noEmit` check** after every change to `packages/shared/`. Shared package type errors break both platforms.

---

## Suggested Execution Order

```
Week 1:   Phase 1-A (score utils) → Phase 1-B (date utils) → Phase 1-C (API wrappers)
Week 2:   Phase 2-A, 2-B, 2-C (Friendship compat, Jadhagam, Panchangam — all Low effort)
Week 3:   Phase 2-D, 2-E, 2-F, 2-G (Rectification wizard, Nakshatra, Calendar, Legal)
Week 4:   Phase 3 (React Query migration for web)
Ongoing:  Phase 4 (design tokens — apply to each file you touch anyway)
```

---

## Acceptance Criteria (Per Phase)

| Phase | Done When |
|-------|-----------|
| 1-A | `scoreTone` imported from `@vinaadi/shared/utils/score` in both platforms. No local score logic remains. |
| 1-B | Date helpers imported from `@vinaadi/shared/utils/format` in both platforms. |
| 1-C | All 22 API wrappers live in `packages/shared/src/api/`. Web hooks use them. Adding a new endpoint touches only one file. |
| 2-A–G | Each feature screen renders data, handles loading/error states, has bilingual labels, is reachable from nav. |
| 3 | `web/hooks/` has no `useState + useEffect` data-fetching patterns. React Query devtools show correct cache behavior. |
| 4 | `tokens.json` is the single source of truth. Changing a color in `tokens.json` + running build updates both platforms. |
