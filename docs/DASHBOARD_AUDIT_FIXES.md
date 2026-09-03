# Dashboard Audit — Fix Backlog (2026-07-13)

Source: five-stakeholder audit (fullstack dev, product owner, architect, test lead,
thirukanitham astrologer) of the dashboard surface — `web/app/dashboard/**`,
`web/components/dashboard-*`, and the hooks/backend endpoints they call.

**How to use this file (for any coding agent):**

- Work items top-down by priority unless told otherwise. Each item is self-contained:
  problem → why it matters → how to fix → acceptance criteria.
- Read `CLAUDE.md` first. In particular: PowerShell syntax rules, the DB safety rules,
  and the API-contract rule (a route/param/shape change must update `app/api/`,
  `packages/shared/src/api/`, `mobile/src/api/`, and `web/` in the same change).
- Verification baseline for every item: `npx tsc --noEmit` (in `web/`, use
  `.\node_modules\.bin\tsc.CMD --noEmit`), `npx vitest run` (in `web/`), and the
  backend subset `pytest tests/reasoning tests/test_predictions_api.py -q --no-cov`
  against the Docker test DB (`vinaadi_test` on :5433, with
  `JOTHIDAM_TEST_DB_RESET_ACK` set — see CLAUDE.md).
- **DASH-17 (dead-code deletion) is LAST and requires explicit user approval for
  EVERY file before deleting it. Do not batch-delete. Ask per file.**

Status legend: `[ ]` open · `[x]` done · `[~]` partially done / needs decision.

---

## Resolved during the audit session

### DASH-00 `[x]` "Chances & Cautions" showed only "This section is being finalised"

- **Root cause:** the committed code had `propensity_insights: False` in
  `app/services/feature_flags.py`, so `GET /api/v1/charts/{id}/propensities`
  returned 404 (`app/api/predictions.py`), and
  `web/components/dashboard-propensities-panel-nova.tsx` maps 404 → the
  "being finalised" placeholder by design.
- **Fix shipped:** flag flipped ON and committed in `528387d`
  (feat(propensities): registry 23→40 …). Backend dev server runs
  `uvicorn --reload` and has already picked it up.
- **If it still shows "finalised":** restart `dev.ps1`, hard-refresh the browser.
  If it instead shows "Could not load this section", that is a **different** failure
  (the endpoint 500s) — capture the uvicorn log for that request and fix the
  exception, do not touch the flag.

---

## P0 — correctness defects visible to users

### DASH-01 `[x]` Browser-clock vs panchangam-clock mismatch (diaspora-facing wrong guidance)

> **Done 2026-07-13.** New `web/lib/tz.ts` (zone-aware `timeOnDateToMs`,
> `minutesOfDayInZone`, `hourInZone`, `formatClockInZone`; local-clock fallback
> when no zone) + `web/lib/today-windows.ts` (`pickFeaturedWindow` moved out of
> the Today tab, zone-aware). The dashboard-bundle response carries
> `panchangamTimezone` (server picks current-else-birth location); threaded to
> the Today tab, ribbon (NOW marker + Horai lookup + NOW label) and Decide
> strip. Hero sun→moon swap now uses `panchangam.sunset` (17:00-in-zone
> fallback); greeting + evening-preview cutoffs use the zone hour. Unit tests:
> `web/lib/tz.test.ts`, `web/lib/today-windows.test.ts` (incl. a
> Toronto-browser/Chennai-panchangam case). Playwright `timezoneId` pass not
> yet run.

- **Files:** `web/components/dashboard-today-ribbon-nova.tsx` (`nowMin`, NOW marker,
  "Horai now" chip), `web/components/dashboard-today-tab-nova.tsx`
  (`timeOnDateToMs`, `pickFeaturedWindow` countdown, `greetingWord`,
  `heroCelestial` 17:00 cutoff), `web/components/dashboard-today-decide-nova.tsx`
  (if it compares clock times).
- **Problem:** all "now" math uses the browser's local clock
  (`new Date().getHours()` etc.) while sunrise/sunset/hora/best-window times come
  from the panchangam computed for the **chart's location** (current location if
  set, else birth location — see `fetchChartBundle` in `web/hooks/usePersonalData.ts`).
  A user in Toronto with only a Tamil Nadu birth place sees the wrong running horai,
  a wrong NOW marker, and a wrong "starts in Xh Ym" countdown.
- **Why it matters:** horai is location-local by definition — this is factually wrong
  astrological guidance, and diaspora is an explicit product priority.
- **How to fix:**
  1. Thread the effective panchangam timezone (the same `tz` chosen in
     `fetchChartBundle`: `currentTimezone ?? birthTimezone`) into the bundle result
     (add e.g. `panchangamTimezone` next to `panchangamLocationLabel`) and pass it
     to the Today tab and ribbon.
  2. Compute "now" in that zone via `Intl.DateTimeFormat` with `timeZone` (no new
     dependency needed): derive hour/minute in the target zone, build `nowMin` from
     those. Same for the greeting/sun-moon cutoff and countdown baselines.
  3. Prefer `panchangam.sunset` over the hardcoded 17:00 for the hero sun→moon swap.
- **Acceptance:** with the browser timezone forced to `America/Toronto` (Playwright
  `timezoneId`) and a profile whose panchangam location is Chennai, the NOW marker,
  Horai-now chip, and countdown match Chennai clock time. Unit tests for the new
  zone-aware helper (export it from `web/lib/format.ts` or a new `web/lib/tz.ts`).

### DASH-02 `[x]` Chart bundle is fail-fast: one bad call blanks the Today tab

> **Done 2026-07-13** — solved at the source instead of client-side
> `withFallback`: the new `GET /charts/{id}/dashboard-bundle` (see DASH-04)
> isolates every section server-side (`app/services/
> dashboard_bundle_service.py::safe`) — a section that raises returns `null`
> plus a note under `errors`, never a failed request. The Today tab shows a
> "Some sections couldn't load · Retry" chip (retry re-runs
> `refreshPersonalBundle` with `forceDay`). Tests:
> `tests/test_dashboard_bundle_api.py::test_dashboard_bundle_isolates_a_failing_section`
> (monkeypatched sani 500 → sani null, neighbors intact) and
> `web/hooks/usePersonalData.test.tsx` (`mapDashboardBundle` with a failed
> section).

- **Files:** `web/hooks/usePersonalData.ts` (`fetchChartBundle`),
  consumers in `dashboard-today-tab-nova.tsx` and tab components.
- **Problem:** of the 13 parallel requests in `fetchChartBundle`, only
  explanation/panchangam/timings have `withFallback`. Any other rejection (e.g.
  sani-cycle 500) rejects the whole `Promise.all`, so `bundle` stays null and the
  Today tab renders essentially empty; the error is only visible as hero status text.
- **How to fix:** wrap every non-critical call in `withFallback(…, emptyValue)`
  (keep summary + daily-guidance as the only "critical pair" if you want a hard
  failure mode), and surface per-card "couldn't load — retry" states where data is
  null. Add a retry affordance that re-runs `refreshPersonalBundle`.
- **Acceptance:** kill one endpoint in dev (e.g. return 500 from sani-cycle) — the
  Today tab still renders hero/score/ribbon, with a graceful gap or retry chip where
  the missing data would go. Unit test `fetchChartBundle` with one rejected call.

### DASH-03 `[x]` Lat/lng of exactly 0 rejected by profile validation

> **Done 2026-07-13.** New `web/lib/validation.ts`
> (`parseLatitude`/`parseLongitude` — explicit empty/NaN/range checks, 0 valid)
> used by `validateBirthForm`; unit tests in `web/lib/validation.test.ts`.

- **Files:** `web/components/dashboard-workspace.tsx` (`validateBirthForm`,
  ~lines 812-813).
- **Problem:** `!form.birthLatitude || !parseNumber(form.birthLatitude)` treats a
  parsed value of `0` as missing (0 is falsy).
- **How to fix:** validate with `Number.isFinite(Number.parseFloat(v))` instead of
  truthiness.
- **Acceptance:** latitude `0` / longitude `0` passes validation; `"abc"` and empty
  string still fail. Unit test the validator (export it or move to `web/lib/`).

---

## P1 — resilience, consent, and platform hygiene

### DASH-04 `[x]` Date-change network storm (~28 requests solo, ~75 with a family of 4)

> **Done 2026-07-13.** All four sub-items:
> 1. `/charts/calculate` cached for the session (`STALE.session`), keyed by
>    profile; only profile-edit paths pass `forceChart` (goal changes and
>    manual refresh pass `forceDay` so their cache-bypass semantics survive).
> 2. Backend `level` accepts a comma list (`maha,antar,pratyantar`) — one
>    dasha request; `splitDashaTimeline` fans it back out client-side. Shared
>    wrapper `getDashaTimeline` updated (single level unchanged for mobile).
> 3. New `GET /api/v1/charts/{id}/dashboard-bundle?date=` composes chart +
>    summary + daily guidance (+3-day range) + combined dasha + transit + sani
>    + peyarchi + explanation + panchangam daily/timings + life-areas +
>    week-ahead + nakshatra card, all failure-isolated. Typed wrapper
>    `packages/shared/src/api/dashboardBundle.ts`. `fetchChartBundle` (web) is
>    now ONE request, and the same endpoint serves `useFamilyData.
>    loadMemberChart` (~12→1 per member). Old endpoints untouched for mobile.
> 4. `GET /activity-timing/batch?activities=a,b,c` (max 12, per-activity null
>    on failure) + shared wrapper `getActivityTimingBatch`; Decide strip is one
>    request.
> Also: life-area predictions (4 calls) now only fetch while the Life Areas
> tab is open (`predictionsEnabled`), and bundle-provided weekAhead/
> nakshatraCard disable their standalone queries. Date paging on Today is now
> bundle + activity-batch + ambient + dasha-story (+ peyarchi-report when one
> is upcoming) ≈ 4–5 requests, no calculate POST. Devtools count not yet
> re-measured in a live browser. Tests: `tests/test_dashboard_bundle_api.py`.

- **Files:** `web/hooks/usePersonalData.ts`, `web/hooks/useFamilyData.ts`,
  `web/components/dashboard-today-decide-nova.tsx`; backend `app/api/`.
- **Problem (measured):** every `selectedDate` change triggers:
  `POST /charts/calculate` re-run with `staleTime: 0` (birth data unchanged!);
  13 bundle calls (incl. **three** `/dasha` calls at maha/antar/pratyantar levels);
  6 `/activity-timing` calls (each computes a full month server-side);
  5 life-area insight calls; week-ahead, ambient alerts, dasha story, peyarchi
  report, journal correlations; plus ~12 calls **per family member**.
- **How to fix (in order of payoff):**
  1. Stop re-POSTing `charts/calculate` on date change: give the chart query
     `staleTime: STALE.session` keyed by `birthProfileId` (date isn't part of the
     chart), and only force-refetch on profile edit (`recalculate: true` paths).
  2. Collapse the 3 dasha calls into 1 (`level=pratyantar` response already contains
     the running maha/antar chain — verify in `app/api/` and reuse; if it doesn't,
     add the ancestors to that response and update `packages/shared` types +
     consumers in the same change).
  3. Add `GET /api/v1/charts/{id}/dashboard-bundle?date=` (backend composes the
     current 13 in one response) and a family equivalent; wire through a typed
     wrapper in `packages/shared/src/api/` per the forward policy. Keep the old
     endpoints for mobile until it migrates.
  4. Batch the Decide strip: one `GET /activity-timing/batch?activities=a,b,c`
     (or accept a comma list on the existing route) instead of 6 calls.
- **Acceptance:** with devtools open, paging one day on Today issues ≤ 5 requests
  for a solo profile; no `POST /charts/calculate` fires on date paging.

### DASH-05 `[x]` Modals have no dialog semantics; destructive ops use native `confirm()`

> **Done 2026-07-13.** New `web/components/modal-shell.tsx`: `ModalShell`
> (drawer-panel's dialog behavior extracted — role="dialog"/aria-modal, focus
> into panel + restore to trigger, Tab trap, Escape, backdrop click; style- or
> class-driven skins) + `ConfirmDialog` (destructive-styled, bilingual via
> `t()`, optional type-the-name arming). All five modals migrated
> (edit-member, edit-profile, feedback, learn-article, guest-chart). The three
> `confirm()` calls replaced: delete-profile / remove-member (bilingual keys
> already existed) / delete-vault (requires typing the vault name). axe run in
> `tests/visual/quality-gates.spec.ts` not yet re-executed (browser pass
> pending).

- **Files:** `dashboard-edit-member-modal.tsx`, `dashboard-edit-profile-modal.tsx`,
  `dashboard-feedback-modal.tsx`, `dashboard-learn-article-modal.tsx`,
  `dashboard-guest-chart-modal.tsx`; `dashboard-workspace.tsx` lines ~1051, 1064,
  1081 (three `confirm()` calls).
- **Problem:** none of the five modals set `role="dialog"`, `aria-modal`, trap focus,
  or close on Escape. The repo already has correct implementations —
  `web/components/drawer-panel.tsx` and `web/components/life-mode-picker.tsx` —
  so this is inconsistency, not a missing capability. Delete-vault/member/profile
  use browser `confirm()`; the vault/member strings are **English-only**.
- **How to fix:** extract the dialog behavior from `drawer-panel.tsx` (or wrap it)
  into a shared modal primitive; migrate the five modals onto it. Replace the three
  `confirm()` calls with an in-design confirm dialog (destructive-styled button,
  bilingual copy via `t()`; for vault deletion require typing the vault name).
- **Acceptance:** Escape closes each modal; focus is trapped and returns to the
  trigger on close; axe (`tests/visual/quality-gates.spec.ts`) passes; deleting a
  vault shows a bilingual in-app dialog, not a browser popup.

### DASH-06 `[x]` "Remind me" silently flips notification channel none→both

> **Done 2026-07-13.** Channel `none` now routes to Settings → Notifications
> (via the existing `onOpenNotificationSettings`) with an explanatory status;
> no PATCH fires. Users with a channel keep it — the PATCH re-sends their
> current channel, never upgrades it.

- **Files:** `web/components/dashboard-today-tab-nova.tsx` (`handleSaveReminder`).
- **Problem:** one tap on "Remind me" PATCHes
  `notificationChannel: "both"` (push + email) when the user's channel is `none` —
  consent the user never gave.
- **How to fix:** if channel is `none`, open Settings → Notifications (the
  `onOpenNotificationSettings` prop already exists) instead of silently enabling
  both; or enable only the single least-invasive channel with explicit copy saying
  which one.
- **Acceptance:** a user with channel `none` who taps "Remind me" lands on the
  notifications settings (or sees an explicit channel choice); no PATCH with
  `both` fires without the user seeing the word.

### DASH-07 `[x]` Reports page: misleading CTA, bogus CSRF header, bypasses shared client

> **Done 2026-07-13.** CTA is "Join waitlist →" (ta: "பட்டியலில் சேர் →");
> new shared wrapper `packages/shared/src/api/reports.ts::purchaseReport`
> (apiFetchJson underneath sends the real `X-Vinaadi-CSRF`); fake
> `X-CSRF-Token` gone; the page's settings/ui fetch also moved onto
> `apiFetchJson`. Backend: `/reports/purchase` now has
> `dependencies=[Depends(require_csrf_header)]`. Test:
> `tests/test_dashboard_bundle_api.py::test_reports_purchase_requires_csrf_header`
> (403 without header for cookie-auth, 200 queued with it).

- **Files:** `web/app/dashboard/reports/page.tsx`; backend `app/api/reports.py`.
- **Problems:**
  1. Button says "Buy →" but the endpoint queues a waitlist entry; success copy
     says "Added to waitlist" — trust-eroding mismatch at the monetization surface.
  2. Sends `"X-CSRF-Token": "1"` — wrong header name (the real one is
     `X-Vinaadi-CSRF`, set by `web/lib/api.ts`), and `/reports/purchase` doesn't
     require CSRF anyway. Dead, misleading code.
  3. Uses raw `fetch("/api/backend/…")` instead of `apiFetchJson`/a shared wrapper,
     contrary to the `packages/shared/src/api/` forward policy.
  4. Backend inconsistency: `logout`/`PATCH /me` require `require_csrf_header`;
     the state-changing purchase POST does not.
- **How to fix:** rename CTA to "Join waitlist →" (bilingual) until payment exists;
  route the call through `apiFetchJson` (or add a typed wrapper in
  `packages/shared/src/api/reports.ts`); drop the fake header; add
  `dependencies=[Depends(require_csrf_header)]` to `/reports/purchase` (update the
  web call to go through `apiFetchJson`, which already sends the right header).
- **Acceptance:** purchase click sends `X-Vinaadi-CSRF: 1` and succeeds; CTA and
  result copy agree; backend test asserts 403 without the header.

### DASH-08 `[x]` Async status not announced; error detection by string-sniffing

> **Done 2026-07-13.** `StatusMessage = { text, tone }` +
> `<StatusLive>` (always-mounted `role="status"` aria-live region) in
> `dashboard-ui-nova.tsx`. Reminder status uses it; the workspace `status` is
> now a `StatusMessage` (hooks' `onStatus` carries tone; hero renders ✓/⚠ +
> aria-live instead of an unconditional ✓); reports page announces purchase
> outcomes via a visually-hidden live region. No tone is inferred from wording
> anywhere on these paths — works identically in Tamil.

- **Files:** `dashboard-today-tab-nova.tsx` (`reminderMessage` and its
  `includes("Could not")` tone check), `dashboard-workspace.tsx` (hero `status`),
  reports page `buyState`.
- **How to fix:** carry an explicit `{ text, tone: "success" | "error" }` state
  instead of sniffing message text; render transient outcomes in an
  `aria-live="polite"` region (one shared `<StatusLive>` helper is enough — note
  `dashboard-ui.tsx` already has one `aria-live` usage to model on).
- **Acceptance:** NVDA/VoiceOver announces "Morning reminder saved."; tone no
  longer depends on message wording (works in Tamil too).

---

## P2 — architecture, tests, product polish

### DASH-09 `[~]` Test the riskiest logic (hooks + workspace gates)

> **Mostly done 2026-07-13.** New: `web/hooks/usePersonalData.test.tsx`
> (renderHook + mocked `apiFetchJson`/bundle wrapper — happy path,
> 403-recovery via /me/latest, race guard that fails if
> `isPersonalRequestCurrent` is removed, `mapDashboardBundle` partial-failure,
> `splitDashaTimeline`), `web/lib/tz.test.ts`, `web/lib/today-windows.test.ts`
> (`pickFeaturedWindow`/`timeOnDateToMs`, pairs with DASH-01),
> `web/lib/dashboard-tabs.test.ts` (restore sanitizer, pairs with DASH-11),
> `web/lib/validation.test.ts` (pairs with DASH-03).
> **Remaining:** onboarding-gate transition tests and a full
> localStorage-restore test at the workspace-component level (the restore
> *logic* is covered via `sanitizeRestoredTab`).

- **Files:** `web/hooks/usePersonalData.ts`, `useFamilyData.ts`, `usePlanData.ts`,
  `useJournalData.ts`; `dashboard-workspace.tsx`.
- **Problem:** 0 tests cover the request-id race guards, the 403/404 recovery
  recursion in `refreshPersonalBundle`, the localStorage restore/sanitize logic,
  the onboarding gate, and the owner-row reconciliation. These are the places a
  regression will silently corrupt what users see.
- **How to fix:** vitest + `@testing-library/react` `renderHook` with a mocked
  `apiFetchJson`. Priority order: `refreshPersonalBundle` happy/403-recovery/race;
  `fetchChartBundle` partial-failure (pairs with DASH-02); localStorage restore
  (wrong user, stale `"transits"`/`"qa"` tab — pairs with DASH-11); onboarding gate
  transitions. Export `pickFeaturedWindow` + `timeOnDateToMs` from the Today tab
  (or move to `web/lib/`) and unit test them (pairs with DASH-01).
- **Acceptance:** new test files run in the default `npx vitest run`; the race-guard
  test fails if `isPersonalRequestCurrent` checks are removed.

### DASH-10 `[x]` Thirukanitham sign-offs needed (queue for jyotishi review)

> **Done 2026-07-13 — queued, no behavior changed.** Both items recorded in
> the new standing list `docs/ASTROLOGER_REVIEW_QUEUE.md` (created this
> session; also gathers the previously scattered pending sign-offs).
> `pickFeaturedWindow` carries a do-not-fix-without-review note.

- **Items:**
  1. **Abhijit demotion** — `pickFeaturedWindow` (Today tab) never features the
     Abhijit window if any PERSONAL_HORA window exists. Classically Abhijit is the
     universal daily auspicious window; hiding it entirely is a doctrine deviation
     made for UX variety (it sat at ~12:02–12:50 every day). Options for the
     reviewer: keep as-is / show Abhijit as a secondary chip / feature it on days
     with no strong personal hora.
  2. **UPACHAYA copy** — `dashboard-today-glance-nova.tsx` `dashaSentiment` groups
     UPACHAYA with MARAKA/DUSTHANA as "testing period · go gently". Upachaya houses
     (3/6/10/11) classically improve with effort — "go gently" may be miscalibrated;
     consider a separate "grows with effort" phrasing.
- **How to fix:** do NOT change behavior in code first. Add both to the standing
  astrologer-review list (same queue as the propensity suites / A-04) and implement
  whatever the reviewer decides, mirroring copy in `ta` and `en`.

### DASH-11 `[x]` Sanitize persisted `activeTab`; single shared `Tab` type

> **Done 2026-07-13.** `web/lib/dashboard-tabs.ts` owns the `Tab` union
> (imported by workspace / left-rail / hero / explore-tab) and
> `sanitizeRestoredTab` (allowlist restore; `"transits"` → `plan` +
> `planView: "transits"`; settings/onboarding refused; qa dev-gated). Unit
> tests in `web/lib/dashboard-tabs.test.ts`.

- **Files:** `dashboard-workspace.tsx` (localStorage restore), the duplicated
  `type Tab = …` unions in `dashboard-workspace.tsx`, `dashboard-left-rail.tsx`,
  `dashboard-hero.tsx`, `dashboard-explore-tab-nova.tsx`.
- **Problem:** restore accepts any persisted tab except onboarding/settings/qa —
  including `"transits"`, which no navigation can reach anymore (users get stranded
  on a ghost tab). The `Tab` union is copy-pasted in 4+ files, which is exactly how
  the ghost entry survived.
- **How to fix:** define `Tab` once (e.g. `web/lib/dashboard-tabs.ts`) and import it
  everywhere; on restore, allowlist only tabs the rail/hero actually offer, mapping
  `"transits"` → `"plan"` (and set `planView: "transits"` for continuity).
- **Acceptance:** seeding localStorage with `activeTab: "transits"` lands the user
  on Plan → Transits view; tsc fails if a tab id is added in one file but not others.

### DASH-12 `[x]` Debounce localStorage persistence

> **Done 2026-07-13.** Trailing 500ms `setTimeout` in the persistence effect
> (cleared on every dep change) — typing writes at most once per quiet period.

- **Files:** `dashboard-workspace.tsx` persistence effect (~lines 540-558).
- **Problem:** the effect serializes and writes the whole persisted state on every
  keystroke in any form (birthForm/vaultForm/memberForm are dependencies).
- **How to fix:** debounce the write (e.g. 500ms via a small `useDebouncedEffect`),
  or persist forms separately from navigation state.
- **Acceptance:** typing a 20-char name causes ≤ 2 localStorage writes (verify via
  a spy in a unit test or Performance panel).

### DASH-13 `[x]` Footer fake links; rail/hero IA mismatch

> **Done 2026-07-13.** Footer labels are real `goToTab` buttons. IA decision:
> the rail's model is canonical — Life Areas/Journal removed from the hero
> strip (still reachable via Explore and cross-links), and the hero's Explore
> tab now highlights for depth tabs exactly like the rail
> (`EXPLORE_DEPTH_TABS`, documented in both component headers). The rail's
> no-op `SHOW_QA_TAB` filter and `showDivider` deleted.

- **Files:** `dashboard-workspace.tsx` footer (~lines 1700-1707),
  `dashboard-left-rail.tsx`, `dashboard-hero.tsx`.
- **Problems:** footer renders link-styled `<span>`s that do nothing. The hero tab
  strip shows Life Areas/Journal as first-class tabs while the rail hides them under
  Explore — a user in Journal sees "Explore" highlighted in the rail.
- **How to fix:** make footer labels real `goToTab` buttons (or restyle as plain
  text). For IA: product decision — either add Life Areas/Journal to the rail or
  remove them from the hero strip; document the chosen model in the component
  header comment. Also delete the no-op `SHOW_QA_TAB` filter and `showDivider`
  in the rail while there.
- **Acceptance:** every element styled as a link/button navigates; active-state
  highlighting is consistent between rail and hero for every reachable tab.

### DASH-14 `[x]` Color literals in new dashboard code

> **Done 2026-07-13.** Acceptance grep returns zero matches in both files
> (also cleaned the ribbon + decide strip literals touched for DASH-01).
> Propensities tones now `--deepdive-good/-warn/-info` (new theme-aware tokens
> in dashboard-nova.css, both theme blocks) with `color-mix()` tints; Today
> tab cream rgba → `color-mix(… var(--color-text-strong) …)`, `#221a2c`
> fallback dropped.

- **Files:** `dashboard-propensities-panel-nova.tsx` (`W.good = "#2E7D32"`,
  `#B8860B`, `#3A6EA5`, rgba literals in `TONES`), `dashboard-today-tab-nova.tsx`
  (`rgba(243,236,221,…)` ×2, `#221a2c` fallback).
- **Problem:** violates the token discipline (brand ≠ text; ratchet counts
  touched-files-only — these are all recently-touched files).
- **How to fix:** map to existing tokens (`--color-high`, `--color-low`,
  `--color-accent-*`, surface tints) or add semantic tokens in
  `dashboard-nova.css`; no raw hex/rgba in component code.
- **Acceptance:** `grep -nE "#[0-9a-fA-F]{3,8}|rgba?\(" web/components/dashboard-propensities-panel-nova.tsx web/components/dashboard-today-tab-nova.tsx`
  returns only `var(--…)` fallbacks that themselves reference tokens (ideally zero
  matches).

### DASH-15 `[~]` i18n consolidation (long-running cleanup — policy in force)

> **Policy applied 2026-07-13:** every string added this session is bilingual;
> the new Today-tab strings (retry chip, reminder consent/saved/failed) and
> the previously-English-only member-remove/vault-delete toasts + confirm
> dialogs go through `t()` with new keys in `web/lib/i18n.ts`. The 1,530-strong
> backlog of inline ternaries remains a per-PR ratchet, not a rewrite.

- **Scope:** 1,530 inline `lang === "ta" ?` ternaries vs 658 `t()` calls across
  dashboard components.
- **How to fix:** policy, not a big-bang rewrite — new/touched strings go through
  `t()` (add keys to `web/lib/i18n.ts`); convert opportunistically when editing a
  component. Translate the remaining English-only user-facing strings first
  (the two `confirm()` strings are covered by DASH-05).
- **Acceptance:** ratchet-style: count of inline ternaries in touched files does
  not grow in any PR.

### DASH-16 `[x]` Life-areas duplicate fetch race

> **Done 2026-07-13.** `lifeAreaInsightsQuery` is gated on the bundle (and on
> the Life Areas tab being open — DASH-04) and always receives the bundle's
> preloaded life-areas; the workspace effect no longer kicks a second personal
> fetch (it only serves family-member charts now). Cold load fires **zero**
> client `/life-areas` requests — the bundle computes it server-side.

- **Files:** `web/hooks/usePersonalData.ts` (`lifeAreaInsightsQuery` +
  `fetchLifeAreaInsights` `preloadedLifeAreas`).
- **Problem:** `lifeAreaInsightsQuery` captures `bundle?.lifeAreas` in its queryFn
  but not in its queryKey; when it runs before the bundle lands it refetches
  `/life-areas` that the bundle is already fetching in parallel.
- **How to fix:** gate `lifeAreaInsightsQuery` on `!!bundle`
  (`enabled: !!effectiveChartId && !!bundle`), or drop `preloadedLifeAreas`
  entirely and let react-query dedupe via a dedicated life-areas query both
  callers share.
- **Acceptance:** cold dashboard load fires exactly one `/life-areas` request.

---

## P3 — dead-code deletion (LAST — ask the user before EVERY file)

### DASH-17 `[x]` Delete dead dashboard code (~4,400 lines)

> **Done 2026-07-13 — every one of the 13 files below individually approved by
> the user (per-file, 4 batched question rounds), references re-verified via
> repo-wide grep immediately before deletion.** All 13 `git rm`'d. Extras that
> went with them: the `DashboardTransitsTab` dynamic import + `activeTab ===
> "transits"` render branch in `dashboard-workspace.tsx` (hero `TAB_DEFS`
> entry had already gone with DASH-13); rule test `test_b10` (it read
> `dashboard-shadow-prompts.tsx`'s source — user approved deleting both);
> stale "still shipping/untouched" comments in the two Plan-transits Nova
> files corrected. Verified after deletion: `next build` (regenerates
> `.next/types`, which briefly 2307s on stale page stubs until rebuilt),
> tsc clean, vitest 136/136, `tests/test_vinaadi_rule_regressions.py` 2 passed.

> **Guardrail (user instruction 2026-07-13): do this task last, and ask the user
> for explicit approval for each individual file before deleting it. Never
> batch-delete. Re-verify zero references (grep for the basename across `web/`,
> `mobile/`, `packages/`, `app/`, `tests/`) immediately before each deletion —
> the tree may have changed since this audit.**

Verified-dead as of 2026-07-13 (references are comments only, or nothing):

| File | Lines | Live replacement |
|---|---|---|
| `web/components/dashboard-daily-snapshot.tsx` | 223 | Nova Today tab (also already dropped from the b11 rule test) |
| `web/components/dashboard-shadow-prompts.tsx` | 126 | — (feature removed) |
| `web/components/dashboard-personal-overview.tsx` | 263 | Nova Today tab |
| `web/components/dashboard-muhurta-picker.tsx` | 273 | `dashboard-plan-muhurta-picker-nova.tsx` |
| `web/components/dashboard-muhurtham-naal.tsx` | 373 | `dashboard-plan-muhurtham-naal-nova.tsx` |
| `web/components/dashboard-remedies-panel.tsx` | 333 | `dashboard-life-areas-remedies-nova.tsx` |
| `web/components/dashboard-personal-hero.tsx` | 239 | `dashboard-family-tab-nova.tsx` (its DayTimeline idea was reimplemented there) |
| `web/components/dashboard-transits-tab.tsx` | 582 | Plan tab `view="transits"` (`dashboard-plan-transits-nova.tsx`) — **do DASH-11 first** so stale localStorage can't strand users |
| `web/app/dashboard/goals/page.tsx` | 292 | Plan tab goals |
| `web/app/dashboard/daily-score/page.tsx` | 244 | Today tab |
| `web/app/dashboard/wrapped/page.tsx` | 219 | Tools → `dashboard-annual-wrapped.tsx` |
| `web/app/dashboard/chart-generate/page.tsx` | 870 | Tools → chart generate / `dashboard-charts-panel-nova.tsx` |
| `web/app/dashboard/porutham/page.tsx` | 394 | Tools → `dashboard-tools-porutham-nova.tsx` |

Also when touching `dashboard-transits-tab.tsx`: remove its dynamic import, the
`activeTab === "transits"` render branch in `dashboard-workspace.tsx`, and the
`transits` entry in `dashboard-hero.tsx` `TAB_DEFS` (already filtered out).

- **Per-file procedure:** (1) grep basename repo-wide; (2) show the user the file
  path + line count + replacement and **ask**; (3) on yes, `git rm`, run
  tsc + vitest + `next build`; (4) one commit per logical group the user approved.
- **Acceptance:** builds/tests green after each deletion; no route or import
  references the removed file.

---

## Notes for future passes (observed, not yet scheduled)

- `dashboard-workspace.tsx` (1,784 lines) wants decomposition: a context/store for
  the resolved per-tab data instead of 30-40 props per tab. Do after DASH-04 so the
  data layer is stable first.
- Inline-style volume across Nova components makes hover/focus states and theming
  harder; consider migrating repeated patterns into `dashboard-nova.css` classes
  opportunistically.
- Notification inbox polls every 5 min (`dashboard-workspace.tsx`) — fine now;
  revisit with SSE/websocket if backend adds push.
