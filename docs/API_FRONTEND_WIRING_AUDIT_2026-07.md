# API ↔ Frontend Wiring Audit & Remediation Plan

Last updated: 2026-07-04
Author: Codebase audit (grounded in source reads, not docs) + product/architecture decisions below.

## Purpose

This is a full audit of whether every backend API (`app/api/*.py`, 44 router modules, ~177 endpoints, all registered in `app/main.py`) is actually reachable and used by a real frontend surface (`web/`, `mobile/`, `packages/shared/src/api/`) — not just "does a client function exist," but "does a real page/component import and call it."

Every finding below was produced by reading the router file, the client wrapper (if any), and grepping `web/app`, `web/components`, `web/hooks`, and `mobile/` for real imports/invocations. Where a file/line is cited, it was read directly. Treat line numbers as anchors, not guarantees — re-grep before editing if the file has moved on since 2026-07-04.

This document supersedes the "MISSING FRONTEND FEATURES" section of [FRONTEND.md](FRONTEND.md) (last updated 2026-05-26) — that list is stale; the features it names as missing are now built and wired. Do not re-implement anything already marked WIRED below.

This document is a sibling to [MASTER_FIX_LIST.md](MASTER_FIX_LIST.md) (security/resilience/astrology-accuracy fixes) — it does not duplicate SEC-4/SEC-7 (which cover the password-reset **token's** security properties), it covers the fact that no client can **complete** a password reset at all (a distinct, product-level gap). Read both before touching auth code.

## Before Starting

1. Read [CLAUDE.md](../CLAUDE.md) and [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md) first.
2. Work from repo root `D:\sanstro`, PowerShell only, per CLAUDE.md.
3. A change to a route path, query param, or response shape must be updated in all four contract locations in the same change: `app/api/`, `packages/shared/src/api/`, `mobile/src/api/`, `web/`. See CLAUDE.md "API contracts."
4. Never hardcode real personal data in tests/fixtures — synthetic identities only.
5. For any task touching account deletion, auth tokens, or PII (WIRE-1, WIRE-2), do not run destructive tests against `vinaadi_dev`. Use the test DB per CLAUDE.md.
6. Preserve existing user changes; do not revert unrelated work.

## Status legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[?]` Needs product/legal/human sign-off before a coding agent should act (see WIRE-2)

## Priority legend

- **P0** — broken or contradictory user-facing behavior; fix first.
- **P1** — built feature invisible to users, or silent-divergence risk (frontend logic can drift from backend logic with no test tying them together).
- **P2** — small, contained, low-risk fixes (dead endpoints, missing single UI controls).
- **P3** — backlog/cleanup, no user-facing impact, do opportunistically.

## Decisions log (product-owner calls, made up front)

| # | Item | Decision |
|---|---|---|
| WIRE-1 | Password reset has no completion UI on any client | **Build it.** Backend endpoint already exists; this is frontend-only work on web, plus a mobile deep-link equivalent. |
| WIRE-2 | Two account-deletion endpoints with different semantics, only one wired | **Do not auto-pick.** Investigate first (see below), then get explicit sign-off — this touches GDPR erasure correctness and real user data. Flagged `[?]`. |
| WIRE-3 | Marriage porutham calculator reimplements kuta logic client-side | **Replace with a real API call.** Delete the duplicate client-side tables once parity is confirmed. |
| WIRE-4 | Indraiya Rasipalan hardcodes prediction text instead of calling the backend | **Replace with a real API call.** Delete the duplicate table. |
| WIRE-5 | Family Vault has 4 fully-built, zero-UI backend endpoints | **Build the UI.** Backend work is a sunk cost; this is pure frontend ROI. |
| WIRE-6 | Birth-time-rectification public page is a static funnel with no interactive surface | **Keep as a funnel, tighten it.** The underlying calculation needs an existing chart + life events, so a true anonymous demo isn't the right shape. Reposition copy/CTA; do not fabricate a fake anonymous calculator. |
| WIRE-7 | `packages/shared/src/api/*.ts` has two provably-broken exports and is ~95% unused by web | **Fix the two known bugs. Set a forward policy, don't force a bulk migration.** |
| WIRE-8..12 | Assorted unreachable admin/notification endpoints, dead device-token router | **Small, independent fixes** — see each task. |

---

## P0 — Broken or contradictory user-facing behavior

### WIRE-1 Password reset cannot be completed on web or mobile `[ ]`

**Problem:** A user who forgets their password can request a reset, but no client can finish the flow.

**Evidence:**
- `app/api/auth.py:358-359` — `POST /auth/forgot-password` (alias `/auth/reset-password/request`) sends the email. Confirmed working, has a caller (`web/app/login/page.tsx:158`).
- The reset email links to `${frontend_url}/login?resetToken={token}` — `app/services/email_service.py:41`.
- `app/api/auth.py` also defines `POST /auth/reset-password` (alias `/auth/reset-password/confirm`) — the completion endpoint. **Zero callers** in `web/` or `mobile/`.
- `web/app/login/page.tsx` never reads a `resetToken` query param and has no "set new password" mode.
- `mobile/app/(auth)/forgot-password.tsx` only calls the request endpoint; there is no mobile screen calling the confirm endpoint either.

**Decision:** Build the missing completion step. The backend endpoint already exists and needs no new route — this is a frontend gap on both clients.

**Primary files:**
- [web/app/login/page.tsx](../web/app/login/page.tsx) — add a mode: if the URL has `?resetToken=...`, render a "set new password" form instead of the login form.
- [packages/shared/src/api/auth.ts](../packages/shared/src/api/auth.ts) — add/verify a `confirmPasswordReset(token, newPassword)` wrapper calling `POST /auth/reset-password/confirm`.
- [mobile/app/(auth)/forgot-password.tsx](../mobile/app/(auth)/forgot-password.tsx) and mobile navigation/deep-link config — add a screen reachable from the emailed link (deep link scheme) that posts the new password.
- [app/services/email_service.py](../app/services/email_service.py) — confirm the link target matches whatever URL shape web ends up using (don't change the token itself here — that's SEC-4's job).

**Sequencing note:** [MASTER_FIX_LIST.md SEC-4](MASTER_FIX_LIST.md#sec-4-password-reset-token-is-an-unscoped-full-access-token-med) found the reset token is currently an unscoped, replayable access token. Building a UI that exercises this endpoint makes SEC-4 more reachable/exploitable in practice (a support agent or attacker now has a working end-to-end flow to target). **Do SEC-4 in the same pass as WIRE-1, or immediately before it** — don't ship a working reset-completion UI on top of an unscoped token.

**Done when:**
- A user can request a reset, click the email link, land on a form (not a dead end), submit a new password, and log in with it.
- The reset token is single-use and rejected by normal authenticated endpoints (this is SEC-4's acceptance criteria — verify both together).
- Mobile has an equivalent path (deep link → set-new-password screen), or an explicit product decision to defer mobile and ship web-only (record that decision here if made).

**Suggested verification:**
```powershell
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
pytest tests/test_auth_api.py tests/test_auth.py -k reset
```
Manually walk the flow in a browser with a synthetic test account (never a real email/identity).

---

### WIRE-2 Two account-deletion endpoints, different semantics, only one is wired `[x]` — resolved 2026-07-04

**Problem:** There are two independent "delete my account" implementations with materially different behavior, and the UI only calls one of them.

**Evidence (both read in full):**
- `app/api/users.py:73-113` — `DELETE /users/me`. Docstring explicitly says "GDPR right-to-erasure": **anonymizes** PII (email replaced with a placeholder, password hash cleared, `deleted_at` set), keeps the user row for audit trail, bumps `token_version` to invalidate JWTs, explicitly cascade-deletes `birth_profiles` in-session. **No caller anywhere in web or mobile** — fully unwired.
- `app/api/auth.py:323-355` — `DELETE /auth/me`. Docstring says "Permanently erase all user data and delete the account": runs a raw SQL delete against `interpretation_outputs`, then `session.delete(user)` — a **hard delete of the user row itself**, relying on DB-level `ON DELETE CASCADE` FKs for everything else (subscriptions, device tokens, notifications, family vault memberships, journal entries, etc.). This is the one actually wired: `web/components/dashboard-settings-session-tab.tsx:395`.

**Why this needs a human, not a coding agent's guess:** These aren't just "duplicate code" — they encode two different compliance strategies (anonymize-and-retain vs. hard-delete-and-cascade), and the wired one (`auth.py`) has a narrower, hand-picked set of raw-SQL cleanup statements (only `interpretation_outputs` gets explicit treatment) resting on an assumption that every other user-owned table has a correct `ON DELETE CASCADE` FK. That assumption has not been verified against the actual schema/migrations in this audit. Picking the wrong one, or shipping a fix without verifying FK cascade completeness, is a real data-loss or data-retention-compliance risk.

**What a coding agent should do:**
1. **Investigate, don't decide.** Cross-reference every table with a `user_id` or `owner_user_id` FK (grep `migrations/versions` and `app/models/*.py`) against the raw SQL + ORM cascade path in `auth.py`'s `delete_my_account`. Produce a table: "table → has ON DELETE CASCADE? → covered by auth.py's delete? → covered by users.py's anonymize?"
2. Report that table back to the user/product owner. Do not merge a change that silently picks one implementation.
3. Once a direction is chosen: delete the other implementation's route entirely (don't leave dead compliance code around), update the single caller if the surviving route's path differs, and add a regression test that creates a synthetic user with data in every user-owned table, calls the surviving delete endpoint, and asserts zero orphaned rows remain.

**Primary files:** [app/api/users.py](../app/api/users.py), [app/api/auth.py](../app/api/auth.py), `app/models/*.py`, `migrations/versions/`.

**Resolution (2026-07-04):** Investigated per the checklist above, then decided (product-owner call, full v1 live on web + mobile — no separate legal/billing retention requirement found in this codebase; `subscriptions` is a lifecycle cache, not an invoice ledger). **Kept `DELETE /auth/me` (hard delete) as the sole endpoint; deleted `DELETE /users/me` entirely.**

FK-cascade coverage table (verified against every migration up to `gg7c8d9e0f1b`, not just the ORM model declarations):

| Table(s) | DB-level rule | Verified by |
|---|---|---|
| birth_profiles, family_vaults, family_members, user_preferences, user_notification_preferences, subscriptions, ask_vinaadi_usage, notifications, user_contexts, user_goals, journal_entries, retrospective_entries | CASCADE | `z1a2b3c4d5e6_user_delete_cascades.py` |
| refresh_tokens, password_reset_tokens, user_streaks | CASCADE | correct from each table's original `create_table` migration |
| charts, chart_planets, dasha_periods, varga_positions, peyarchi_alerts, user_life_events | CASCADE (via birth_profile/chart) | `z1a2b3c4d5e6` + `l7f8a9b0c1d2_fix_chart_delete_cascades.py` |
| interpretation_outputs.chart_id / .family_vault_id | SET NULL (intentional — content survives by default) | `l7f8a9b0c1d2`; erasure instead handled by explicit raw-SQL `DELETE` in `delete_my_account` |
| feedback.user_id, family_members.managed_by_user_id, device_tokens.user_id | SET NULL (intentional — these rows must survive) | `z1a2b3c4d5e6` / `aa1b2c3d4e5f` |

Why hard-delete over anonymize: the anonymize variant (`users.py`, never wired) had two real, unfixed bugs that would have shipped a broken "erasure" if wired as-is — (1) it never deleted `interpretation_outputs`, which store the user's own structured chart/birth data in JSONB, so anonymizing would have orphaned real PII instead of erasing it; (2) it bumped `token_version` (correctly killing web/mobile access tokens) but never revoked `refresh_tokens`, and `POST /auth/refresh` (`mobile_auth.py`) only checks `revoked_at`/`expires_at`, not `token_version` or `deleted_at` — so a live mobile refresh token would keep minting new access tokens for an "anonymized" account for up to its 60-day TTL. The hard-delete path has neither gap: deleting the `users` row cascades `refresh_tokens`/`password_reset_tokens` at the DB level immediately, and the raw-SQL cleanup already explicitly erases `interpretation_outputs` before the user row goes.

**Regression test added:** `tests/test_auth_api.py::test_delete_me_leaves_no_orphaned_rows_across_every_owned_table` — seeds one row in every table above (including both `interpretation_outputs` variants, `refresh_tokens`, `password_reset_tokens`) and asserts zero rows survive `DELETE /auth/me`.

**Changed:** `app/api/users.py` (removed `delete_own_account` / `DELETE /me`, kept `GET /me/subscription`). No client ever called `DELETE /users/me` (confirmed by grep across `web/`, `mobile/`, `packages/shared/`), so no other contract location needed updating.

---

## P1 — Built-but-invisible features and silent-divergence risks

### WIRE-3 Marriage Porutham Calculator never calls the backend `[ ]`

**Problem:** `web/app/tools/marriage-porutham-calculator/PoruthamTool.tsx` has zero `fetch`/`apiFetchJson` calls. It reimplements all 10 kutas (Dinam, Ganam, Rajju, Vedha, Nadi, etc.) from scratch in client-side JS with its own nakshatra tables, completely independent of `app/calculations/porutham.py`. There is no test or contract keeping the two in sync — a future fix to the real porutham logic (see [MASTER_FIX_LIST.md AST-1](MASTER_FIX_LIST.md#ast-1-porutham-is-relabeled-ashtakoota-not-true-tamil-10-porutham-high), which is already flagged as a HIGH astrology-accuracy bug) will not reach this page at all. This is the single highest silent-divergence risk found in the audit, precisely because porutham (marriage matching) is a high-stakes, reputationally sensitive calculation in this product's domain — see [[feedback_astrology_calc_accuracy]].

**Decision:** Replace the client-side reimplementation with a real call to the existing public endpoint, matching the pattern already proven elsewhere in this codebase.

**Reference pattern already working:** `web/app/dashboard/porutham/page.tsx` and `web/components/porutham-panel.tsx` already call `POST /public/compare` and `POST /public/compare/pdf` (`app/api/public_tools.py`) successfully. `POST /public/porutham` also exists and is already used by the mobile tools screens (`mobile/app/(tabs)/tools/{porutham,friendship}.tsx`).

**Primary files:**
- [web/app/tools/marriage-porutham-calculator/PoruthamTool.tsx](../web/app/tools/marriage-porutham-calculator/PoruthamTool.tsx) — remove the hardcoded kuta tables and scoring logic; call `POST /public/compare` (or `/public/porutham` if the response shape fits the public-tool page better — compare both response shapes in `app/api/public_tools.py` before choosing).
- [web/app/tools/marriage-porutham-calculator/PoruthamPageContent.tsx](../web/app/tools/marriage-porutham-calculator/PoruthamPageContent.tsx) — form/input plumbing, adjust as needed.
- [web/components/porutham-panel.tsx](../web/components/porutham-panel.tsx) — reference implementation for request/response handling.
- [app/api/public_tools.py](../app/api/public_tools.py) — read `_compare`/`_porutham` handlers to confirm exact request/response schema before wiring.

**Done when:**
- The public marriage-porutham-calculator page produces output computed entirely by the backend, with no client-side kuta tables left in the file.
- A fix to `app/calculations/porutham.py` (e.g., the AST-1 fix) automatically changes what this page shows, with no separate frontend edit required.
- Existing UI/UX (loading states, PDF download if applicable) is preserved or improved, not regressed.

**Suggested verification:** Manually compare output for a few synthetic birth-detail pairs before/after the change; run `pytest tests/test_public_tools_api.py`.

---

### WIRE-4 Indraiya Rasipalan hardcodes the backend's own content instead of calling it `[ ]`

**Problem:** `web/app/tools/indraiya-rasipalan/RasippalanTool.tsx` computes the moon-house transit from `GET /public/panchangam`, then looks up predictions from its own hardcoded `HOUSE_PREDICTIONS` table — a byte-for-byte duplicate of the Tamil/English text living in `app/api/public_tools.py`'s `_RASI_PALAN_TA`/`_RASI_PALAN_EN`. The real endpoint, `GET /public/rasi-palan`, exists and is fully implemented but has no caller anywhere (its only "user" is a mobile contract test).

**Decision:** Call the backend endpoint; delete the duplicated table. Lower urgency than WIRE-3 (rasi-palan is lighter-stakes than marriage matching) but same category of risk and same fix shape — do it in the same pass as WIRE-3 for efficiency.

**Primary files:**
- [web/app/tools/indraiya-rasipalan/RasippalanTool.tsx](../web/app/tools/indraiya-rasipalan/RasippalanTool.tsx) — replace the local `HOUSE_PREDICTIONS` lookup with a call to `GET /public/rasi-palan`.
- [packages/shared/src/api/rasiPalan.ts](../packages/shared/src/api/rasiPalan.ts) — `getRasiPalan()` wrapper already exists; use it instead of writing a new direct fetch (this is one of the few cases where using the shared wrapper is clearly correct — see WIRE-7's forward policy).
- [app/api/public_tools.py](../app/api/public_tools.py) — confirm response shape matches what `RasippalanTool.tsx` currently renders before wiring.

**Done when:** The page's predictions come from the API response, the hardcoded table is deleted, and content edits to `public_tools.py`'s Tamil/English tables are reflected on the page without a separate frontend change.

---

### WIRE-5 Family Vault: four fully-built backend endpoints, zero UI `[ ]`

**Problem:** These endpoints exist, are registered, have request/response models, and are exercised by nothing in `web/`:
- `GET /family-vaults/{id}/summary`
- `GET /family-vaults/{id}/composite`
- `GET /family-vaults/{id}/members` (list) and `GET /family-vaults/{id}/members/{member_id}` (single)
- `GET /family-vaults/{id}/journal` and `GET /family-vaults/{id}/journal/summary`

`web/components/dashboard-family-tab.tsx` currently reimplements a rougher version of "summary" info manually by combining `daily-aggregate` + `calendar` responses, suggesting `/summary` and `/composite` may have been built for a richer version of this tab that was never finished on the frontend.

**Decision:** Build the UI. The backend investment is already sunk; this is close to pure-frontend ROI, and family-tier richness is a stated product differentiator (see `[[project_tier_plan]]`). Sequence as two sub-tasks by risk/complexity:

**WIRE-5a (do first, lower complexity):** Wire `/summary` and `/composite` into `dashboard-family-tab.tsx`, replacing or augmenting the current manual combination of `daily-aggregate` + `calendar`. Also wire the member list/detail endpoints wherever the tab currently derives member info ad hoc.

**WIRE-5b (do second, needs an access-control decision):** Family journal (`/journal`, `/journal/summary`) is a new surface, not a replacement of something existing — the only journal UI today is the single-user personal journal tab (`dashboard-journal-tab.tsx`, backed by `app/api/journal.py`, unrelated router). Before building UI: decide who can see whose journal entries inside a shared family vault (all members see all entries? Owner-only? Per-entry visibility flag?). Check `app/api/family_vaults.py`'s journal handlers for any existing visibility/permission filtering logic — the backend may have already decided this; don't assume.

**Primary files:**
- [app/api/family_vaults.py](../app/api/family_vaults.py) — read the four handlers' response models and any permission filtering first.
- [web/components/dashboard-family-tab.tsx](../web/components/dashboard-family-tab.tsx)
- [web/hooks/useFamilyData.ts](../web/hooks/useFamilyData.ts) — this is where the existing family-vault fetches live (`fetchFamilyBundle`, etc.); add the new fetches here following the existing pattern rather than introducing a new fetching approach.

**Done when:** Family tab shows summary/composite/member data sourced from the dedicated endpoints (not re-derived client-side), and a documented decision exists for journal visibility before that UI ships.

---

### WIRE-6 Birth-time-rectification public page has no interactive surface `[ ]`

**Problem:** `web/app/tools/birth-time-rectification/page.tsx` is static marketing copy — hero text, step descriptions, FAQ — with no form, no input, no fetch call. It only links to `/dashboard`. The real, working rectification wizard (`web/components/dashboard-rectification-wizard.tsx`, calling `app/api/rectification.py`'s two endpoints) is authenticated-only, reachable from `dashboard-setup-tab.tsx`.

**Decision:** This is **not a bug to fix by faking a demo** — rectification fundamentally operates on an existing birth profile plus a set of known life events; there is no meaningful anonymous version of "estimate my birth time" without that input, unlike e.g. chart-preview or porutham-compare which take raw inputs upfront. **Keep this page as a conversion funnel, but tighten it:**
1. Make the page honest about needing an account — the current copy already implies this loosely; make the primary CTA explicit ("Create your free chart to start rectification") rather than a generic "Go to dashboard" link.
2. If the page currently collects any birth details as part of its copy/FAQ interactions (check current implementation), thread them into the signup flow as progressive profiling so a user doesn't re-enter data. If it collects nothing today, this is optional polish, not required.
3. Do not build a fake "preview" that produces output without hitting `app/api/rectification.py` — that would be a new instance of exactly the WIRE-3/WIRE-4 divergence risk this document is trying to eliminate.

**Primary files:** [web/app/tools/birth-time-rectification/page.tsx](../web/app/tools/birth-time-rectification/page.tsx), [web/components/dashboard-rectification-wizard.tsx](../web/components/dashboard-rectification-wizard.tsx) (reference only, don't duplicate its logic).

**Priority note:** This is UX/conversion polish, not a functional bug — rank it below WIRE-1 through WIRE-5.

---

### WIRE-7 `packages/shared/src/api/*.ts` is ~95% dead code in web, with two known landmines `[ ]`

**Problem:** Across the entire audit, the only function from `packages/shared/src/api/*.ts` that `web/` genuinely imports and calls is `pingStreak`. Every other web data flow (charts, dasha, goals, journal, relationships, family vaults, notifications, decisions, etc.) goes through direct `apiFetchJson(...)` calls with hardcoded paths inside hooks (`usePersonalData.ts`, `useFamilyData.ts`, `useJournalData.ts`) and components (`dashboard-workspace.tsx` and its children). Mobile, by contrast, does genuinely use the shared package.

Two exports in the unused portion are provably broken and would fail immediately if anything ever called them:
- `packages/shared/src/api/guidance.ts`'s `getDailyGuidance()` calls `GET /daily-guidance?chartId=...`; the real backend route is `GET /charts/{chart_id}/daily-guidance` (path param, not query param, and no bare `/daily-guidance` route exists at all). Confirmed by reading `app/api/daily_guidance.py`.
- `packages/shared/src/api/notifications.ts`'s `registerFcmToken()` sends `PATCH` to `/settings/notifications/fcm-token`; `app/api/notification_preferences.py` only defines `PUT` and `DELETE` for that path. A `PATCH` call would get a 405.

**Decision:**
1. **Fix both known bugs immediately** — cheap, low-risk, and they are landmines for whoever next reaches for "the shared client" assuming it's correct (a very reasonable assumption to make, since it's presented as the canonical typed API layer).
2. **Set a forward policy, do not force a bulk migration of existing web call sites.** Migrating dozens of already-working direct-fetch call sites to the shared package in one pass is high-risk, high-effort, low-immediate-value, and out of scope here. Instead:
   - Any **new** backend endpoint built from this point forward must get a typed wrapper in `packages/shared/src/api/`, and any new web code consuming it **must** use that wrapper, not a fresh direct `apiFetchJson` call.
   - When WIRE-3/WIRE-4 above are implemented, use the existing shared wrappers where they already exist and are correct (e.g. `rasiPalan.ts` for WIRE-4) rather than adding another direct-fetch call site — don't grow the "bypass" pattern further.
   - Existing direct-fetch call sites are grandfathered; do not touch them as part of this task.
3. Do a one-time dead-export sweep: grep every export in `packages/shared/src/api/*.ts` for zero callers across `web/` and `mobile/`; for any that are both unused **and** unverified/likely-wrong (like the two above), fix or delete rather than leave to bit-rot further. Do not delete exports that are unused in web but genuinely used in mobile (e.g. several `familyVault.ts`/`relationships.ts`/`decisions.ts`/`goals.ts` functions may be web-unused but still fine — check mobile before deleting anything).

**Primary files:** [packages/shared/src/api/guidance.ts](../packages/shared/src/api/guidance.ts), [packages/shared/src/api/notifications.ts](../packages/shared/src/api/notifications.ts), and a full pass over [packages/shared/src/api/](../packages/shared/src/api/).

**Done when:** Both known bugs are fixed with a regression test (call the wrapper against a running test backend, assert 2xx), and the forward policy is written into `docs/AGENT_INSTRUCTIONS.md` or `CLAUDE.md`'s API-contracts section so future agents don't reintroduce the bypass pattern silently.

---

## P2 — Small, contained fixes

### WIRE-8 No UI control to mark a single notification as read `[ ]`

**Problem:** `POST /notifications/{notification_id}/read` exists (`app/api/notifications.py`) with no caller. Both consuming surfaces — `web/app/notifications/page.tsx` and the inbox widget in `web/components/dashboard-hero.tsx` — only offer "mark all read."

**Fix:** Add a per-row click handler in both surfaces calling the existing endpoint. **Primary files:** [web/app/notifications/page.tsx](../web/app/notifications/page.tsx), [web/components/dashboard-hero.tsx](../web/components/dashboard-hero.tsx).

### WIRE-9 Feedback "reward qualified" toggle has no admin control `[ ]`

**Problem:** `PATCH /feedback/{feedback_id}/reward` exists (`app/api/feedback.py`) to flag a feedback submission as qualifying for the "extended free access" perk described in its own docstring. `web/components/admin-console.tsx`'s Feedback tab (~line 1008-1038) displays feedback but has no button/handler for this — the `reward_qualified` field exists in the type but is never read or acted on.

**Fix:** Add a toggle/button in the admin console's Feedback tab wired to this endpoint. **Primary file:** [web/components/admin-console.tsx](../web/components/admin-console.tsx).

### WIRE-10 Admin calibration report has no UI `[ ]`

**Problem:** `GET /admin/calibration` exists (`app/api/admin.py`) with no caller — the D5 prediction-calibration report has no tab in `admin-console.tsx`.

**Fix:** Add a read-only "Calibration" tab, following the existing tab pattern (see the Health/Analytics tabs for reference). **Primary file:** [web/components/admin-console.tsx](../web/components/admin-console.tsx).

### WIRE-11 `POST /admin/run-peyarchi-refresh` is redundant dead code `[ ]`

**Problem:** This dedicated endpoint (`app/api/admin.py`) has no caller — the generic `POST /admin/jobs/{job_id}/trigger` (which **is** wired, `admin-console.tsx:424`) already covers the same job via `app/scheduler.py:74`'s `register_job(...)`.

**Decision:** Delete the dedicated endpoint. Reducing unused API surface area is directly in scope for a hardening branch. **Primary file:** [app/api/admin.py](../app/api/admin.py) — confirm the job is genuinely reachable via the generic trigger path before deleting, then remove the route and its registration in `app/main.py`.

### WIRE-12 `app/api/devices.py`'s push-token endpoints are dead, superseded by a different route `[ ]`

**Problem:** `POST`/`DELETE /devices/push-token` (confirmed: this file, read in full, contains only these two endpoints — safe to reason about as a whole router) have typed client wrappers (`registerPushToken`/`unregisterPushToken` in `packages/shared/src/api/auth.ts`) that are never called anywhere. Both web (`dashboard-settings-session-tab.tsx:332`) and mobile (`usePushNotificationOptIn.ts:64`) actually register push tokens through a **different** endpoint: `PUT /settings/notifications/fcm-token` (`app/api/notification_preferences.py`), which is genuinely wired (confirmed under WIRE-7's audit scope).

**Decision:** Delete `app/api/devices.py` entirely (router file + its `include_router` call in `app/main.py`) and the two dead wrapper exports in `packages/shared/src/api/auth.ts`, **after** confirming: (1) the `DeviceToken` model/table isn't still written to by the surviving `fcm-token` path in a way that depends on this router's upsert logic — check `app/api/notification_preferences.py`'s handler actually writes to the same `DeviceToken` table itself rather than assuming this router does it, and (2) no other backend service (e.g. `notification_dispatch_service`, referenced in this file's own docstring) imports functions from `devices.py` directly.

**Primary files:** [app/api/devices.py](../app/api/devices.py), [app/main.py](../app/main.py), [packages/shared/src/api/auth.ts](../packages/shared/src/api/auth.ts).

---

## P3 — Backlog / cleanup, no user-facing impact

Do these opportunistically; none block a release.

- `GET /birth-profiles/{birth_profile_id}` (single fetch by id) — unused, superseded by `/birth-profiles/me/latest`. Leave; may be useful for a future admin/family lookup use case.
- `GET /charts/{chart_id}/share` (`app/api/charts.py`) — unused, duplicates the working `share-card` feature (`dashboard-share-card.tsx`). Decision: delete as part of a future cleanup pass; not urgent.
- `GET /charts/{chart_id}/transits/major` — no client caller anywhere (web, mobile, or shared). Confirm intentional before continued maintenance; not user-facing today.
- `GET /charts/{chart_id}/peyarchi` — not dead, just not client-facing: used internally by `chart_explanation_service.py` and `peyarchi_alert_service.py`. Consider marking internal-only in the OpenAPI surface rather than leaving it exposed as a public-looking route with no client user.
- `web/app/dashboard/wrapped/page.tsx` — a fully working standalone page with no in-app nav link pointing to it (the in-app "wrapped" experience is a tab inside `dashboard-workspace.tsx`, not this route). Likely intentional as a shareable-link target; if so, no action needed, just don't remove it thinking it's orphaned.
- `GET /streak` (plain read, `app/api/streak.py`) — unused; the streak value the UI shows comes from the `POST /streak/ping` response instead. Leave as-is.
- `POST /relationships/compare` (non-PDF JSON variant) — unused; only `/compare/pdf` is called today. Keep — could enable an in-app (non-PDF) comparison card later at zero backend cost. Don't delete.
- `GET /family-vaults/{id}/members` and `/members/{member_id}` — roll into WIRE-5a scope; don't treat as a separate task.
- `app/api/qa.py`'s `POST /qa/validate-golden-case` (compat alias) and `DELETE /qa/regressions/{test_id}` (single-id) — admin/internal, no caller even from the admin QA tab (which uses the bulk delete and list/validate instead). Low-priority cleanup candidate.
- `GET /public/panchangam/monthly` (the public/unauthenticated variant) — unused; web's monthly panchangam view uses a different, authenticated route. Keep for potential embeddable-widget or partner-API use case.
- `GET /users/me/subscription` — unused in web (mobile-only today). Not a bug; web doesn't yet have a subscription/billing settings view. Backlog candidate tied to `[[project_tier_plan]]`, not urgent.

---

## Execution order

1. **WIRE-2** — investigate only (produce the FK-cascade coverage table), get sign-off. Do this first since it concerns live user data correctness and blocks nothing else.
2. **WIRE-1 + SEC-4 together** — the one genuinely broken user journey.
3. **WIRE-3, WIRE-4** — remove silent-divergence risk in two public tool pages, same pattern, do together.
4. **WIRE-7** — fix the two dead-code bugs and write the forward policy (cheap, prevents future landmines).
5. **WIRE-11, WIRE-12** — delete confirmed-dead backend surface (cheap, reduces attack surface, good hardening-branch hygiene).
6. **WIRE-8, WIRE-9, WIRE-10** — small, independent admin/UX control additions.
7. **WIRE-5a then WIRE-5b** — the larger family-vault frontend project.
8. **WIRE-6** — funnel copy/CTA polish.
9. **P3** items as capacity allows.

## Agent completion checklist (per task)

- [ ] Re-grep the cited file/line before editing — this document is a snapshot from 2026-07-04.
- [ ] If the change touches a route path, query param, or response shape, update all four contract locations (`app/api/`, `packages/shared/src/api/`, `mobile/src/api/`, `web/`) in the same change.
- [ ] Add or update a test proving the fix (unit test for backend changes, a manual or Playwright check for pure frontend wiring where no test harness exists yet).
- [ ] Update this file's status marker (`[ ]` → `[x]`) and note the PR/commit.
- [ ] If a decision in this document turns out to be wrong once you're in the code (e.g., an endpoint has a caller this audit missed), stop and flag it rather than silently deviating — the audit is a snapshot, not ground truth.
