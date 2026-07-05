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

### WIRE-1 Password reset cannot be completed on web or mobile `[x]` — resolved 2026-07-04

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

**Resolution (2026-07-04):**
- **SEC-4 was already fixed in code** before this pass (typed `pwreset` claim, single-use `password_reset_tokens` row with `jti_hash`, 15-min TTL, refresh-token revocation + `token_version` bump on successful reset) — `docs/MASTER_FIX_LIST.md` just hadn't been updated and there was no test coverage. Added 5 tests to `tests/test_auth_api.py`: successful reset kills the old web session and mobile refresh tokens, a reset token can't hit `GET /auth/me`, replay is rejected, expired tokens are rejected, and a normal access token can't be used as a reset token. Flipped both docs' status markers.
- **Web:** `web/app/login/page.tsx` now has a fourth mode (`reset`), entered automatically when the URL has `?resetToken=`. It renders a "set new password" form and posts to `POST /auth/reset-password/confirm`.
- **Mobile:** added `mobile/app/(auth)/reset-password.tsx`, reachable via the `vinaadi://reset-password?token=...` deep link (registered scheme already exists). Added `requestPasswordReset`/`confirmPasswordReset` wrappers to `packages/shared/src/api/auth.ts`, re-exported through `mobile/src/api/auth.ts`.
- **Known gap, recorded rather than silently deferred:** the emailed reset link is a plain `https://.../login?resetToken=...` URL (`app/services/email_service.py`), not the mobile deep link — so tapping it from a phone opens the mobile browser to the (fully working, responsive) web form rather than the native app. One-tap email→native-app requires Universal Links (iOS) / App Links (Android) domain-association files hosted at the production domain, which is an infra/deployment task outside a code-only pass. The native mobile screen is built and reachable today via the custom URL scheme for direct testing and for future use once domain association ships.

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

### WIRE-3 Marriage Porutham Calculator never calls the backend `[x]` — resolved 2026-07-04

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

**Resolution (2026-07-04):**

This turned out to need a different endpoint than either one this document names — flagging the deviation per the completion checklist rather than silently picking one.

- **Why not `/public/compare` or `/public/porutham` as written:** Both require a full `PublicBirthInput` (date, lat/long, timezone) per person because they compute a real chart via `_chart_response_from_profile` to derive the Moon's nakshatra. `PoruthamTool.tsx`'s actual UX is a pure nakshatra picker (pick girl's star, pick boy's star — no birth data at all), matching `compute_porutham()` in `app/calculations/porutham.py`, which only ever needed nakshatra + rasi numbers, never a chart. Forcing birth-detail entry onto this tool would have been a regression to its actual product shape (a quick star-only check, distinct from the full chart-based comparison already served by `porutham-panel.tsx` → `/public/compare`).
- **Real bug found in the process:** `packages/shared/src/api/porutham.ts`'s `getPorutham()` — used today by `mobile/app/(tabs)/tools/porutham.tsx` and `friendship.tsx` — posts `{boyNakshatraNumber, girlNakshatraNumber}` to `/public/porutham`, but that route requires `personA`/`personB` birth objects. Every real call from those two mobile screens would 422. This audit had assumed (from the docstring) that the mobile screens' use of `/public/porutham` was working; it wasn't. Confirmed via `tests/test_public_tools_api.py::test_public_porutham_accepts_marketing_site_payload`, which only exercises the birth-detail shape.
- **Fix:** Added `POST /public/porutham/by-star` (single pair) and `POST /public/porutham/by-star/grid` (one girl star vs. all 27 candidates, to stay inside the existing 10/min `public_porutham` rate budget instead of firing 27 requests) to `app/api/public_tools.py`. Both call `compute_porutham()` directly — no chart, no ephemeris, no persistence. Rasi is derived from nakshatra + pada (`nakshatra_to_rasi`, default pada 3), which was verified to exactly reproduce `PoruthamTool.tsx`'s original majority-pada/late-tiebreak default for all 9 rasi-straddling nakshatras (test: `test_public_porutham_by_star_default_pada_matches_majority_rasi_convention`).
- **All four contract locations updated:** `app/api/public_tools.py` (new schemas/routes), `packages/shared/src/types/index.ts` (+`PublicPoruthamStarData`, `PublicPoruthamGridItem`), `packages/shared/src/api/porutham.ts` (`getPorutham()` now points at `/porutham/by-star` with the same 2-field payload mobile already sends — this fixes the mobile bug with zero mobile-side changes; added `getPoruthamGrid()`), `web/app/tools/marriage-porutham-calculator/PoruthamTool.tsx` (rewired).
- **What was deleted vs. kept client-side:** All 10 scoring/decision functions (`calcDina`, `calcGana`, `calcMahendra`, `calcStreeDheerga`, `calcYoni`, `calcRasi`, `calcRasiyathipathi`, `calcVasya`, `calcRajju`, `calcVedhai`, `calcAll`) and every pairwise rule table (`YONI_ENEMIES`, `VEDHAI_PAIRS`, `RASI_LORD`/`PLANET_FRIENDS`/`PLANET_ENEMIES`, `VASYA_MAP`, `DINAM_GOOD`, `RAJJU_SEVERITY_TA`) are gone — every PASS/FAIL judgment now comes from the API response. Kept client-side, display-only: which gana/yoni/nadi/rajju/rasi group each nakshatra belongs to (`GANA`, `YONI`, `RAJJU`, `NADI`, `RASI` + their name-label tables), used only to render the "star info card" and the pada-choice UI. These were spot-verified 27/27 nakshatras identical to the backend's own tables (`app/calculations/porutham.py`'s `_GANA`, `_YONI`, `_RAJJU_GROUP`, `_NAKSHATRA_NADI`) during this pass — they're fixed classical attribute assignments, not compatibility rules, so keeping them client-side for labels doesn't reintroduce the divergence risk this item exists to close.
- **Minor UX simplification, noted rather than silently dropped:** the old per-kuta "detail" caption (e.g. "Count: 5" or "Deva + Manushya") is gone from the breakdown table, since the API only returns PASS/FAIL + score per kuta, not the intermediate value. The table now matches the mobile app's existing kuta-row pattern (name + PASS/FAIL + score). The overall verdict banner is a straight improvement: it now renders the API's `summary.ta/en` (which already appends Rajju/Vedha dosha explanations) and, for Nadi, the API's `nadiDosha.noteTa/noteEn` — both authoritative backend text instead of hand-written client copy.
- **Score-bucket thresholds also fixed to match backend:** the tool's own EXCELLENT/GOOD/AVERAGE/CAUTION cutoffs (≥8/≥6/≥5) didn't match `compute_porutham()`'s actual thresholds (≥9/≥7/≥5) — another real, if minor, divergence found and closed by switching to the API's `label` field directly.
- **Tests:** 6 new tests in `tests/test_public_tools_api.py` (all `pytest.mark.no_db`, no test DB needed): mobile's exact payload shape now returns 200; out-of-range nakshatra rejected; pada choice changes rasi-dependent kutas; default pada matches explicit pada=3; grid returns all 27 candidates; a grid row agrees with the equivalent single lookup. Full file: 11 passed.
- **Verified:** `web/tsconfig` and `packages/shared/tsconfig` both compile clean (`tsc --noEmit`); ESLint clean on the changed web file.

---

### WIRE-4 Indraiya Rasipalan hardcodes the backend's own content instead of calling it `[x]` — resolved 2026-07-04

**Problem:** `web/app/tools/indraiya-rasipalan/RasippalanTool.tsx` computes the moon-house transit from `GET /public/panchangam`, then looks up predictions from its own hardcoded `HOUSE_PREDICTIONS` table — a byte-for-byte duplicate of the Tamil/English text living in `app/api/public_tools.py`'s `_RASI_PALAN_TA`/`_RASI_PALAN_EN`. The real endpoint, `GET /public/rasi-palan`, exists and is fully implemented but has no caller anywhere (its only "user" is a mobile contract test).

**Decision:** Call the backend endpoint; delete the duplicated table. Lower urgency than WIRE-3 (rasi-palan is lighter-stakes than marriage matching) but same category of risk and same fix shape — do it in the same pass as WIRE-3 for efficiency.

**Primary files:**
- [web/app/tools/indraiya-rasipalan/RasippalanTool.tsx](../web/app/tools/indraiya-rasipalan/RasippalanTool.tsx) — replace the local `HOUSE_PREDICTIONS` lookup with a call to `GET /public/rasi-palan`.
- [packages/shared/src/api/rasiPalan.ts](../packages/shared/src/api/rasiPalan.ts) — `getRasiPalan()` wrapper already exists; use it instead of writing a new direct fetch (this is one of the few cases where using the shared wrapper is clearly correct — see WIRE-7's forward policy).
- [app/api/public_tools.py](../app/api/public_tools.py) — confirm response shape matches what `RasippalanTool.tsx` currently renders before wiring.

**Done when:** The page's predictions come from the API response, the hardcoded table is deleted, and content edits to `public_tools.py`'s Tamil/English tables are reflected on the page without a separate frontend change.

**Resolution (2026-07-04):**

- **Deviation from the plan as written, flagged per the completion checklist:** the tool doesn't just call the existing single `GET /public/rasi-palan` for one rasi at a time. It also renders an "All 12 Rasis" grid and, before this fix, computed all 12 client-side from one `/public/panchangam` fetch. Wiring the grid to 12 sequential `/public/rasi-palan` calls would have worked functionally but would recompute the full panchangam (`calculate_panchangam`) 12 times per page load for a value (the Moon's transit) that is identical across all 12 janma rasis — wasteful, and it would burn 12x the per-endpoint rate budget on every visit. Added `GET /public/rasi-palan/grid` to `app/api/public_tools.py`, which computes the panchangam once and returns predictions for all 12 rasis in one response. This mirrors the precedent set by WIRE-3's `/porutham/by-star/grid` (same problem shape: a picker over N fixed options, one expensive shared computation).
- **Refactor, not new logic:** extracted a `_rasi_palan_prediction(janma_rasi, moon_house)` helper so the single endpoint and the new grid endpoint build identical ta/en payloads from the same `_RASI_PALAN_TA`/`_RASI_PALAN_EN` tables — no prediction text or logic was duplicated between the two routes.
- **Rate limiting gap found and closed:** `GET /public/rasi-palan` had no `@public_endpoint_rate_limit` decorator despite calling the same `calculate_panchangam()` as the already-limited `/public/panchangam` (30/min per IP). It was never caught before because nothing called it. Added the `public_panchangam` budget to both the single and new grid route, since they do the same unit of work.
- **Frontend:** `RasippalanTool.tsx` now calls `getRasiPalanGrid()` (new wrapper in `packages/shared/src/api/rasiPalan.ts`) once per date change. That single response drives the "Moon's position today" banner (`moonRasi` + `nakshatra`, both now server-computed), the 12-rasi grid, and the selected-rasi detail card (indexed out of the same `results` array — no second network call on selection). The old `HOUSE_PREDICTIONS`/`TONE_COLORS`-keyed-by-local-table, `HousePrediction` type, and `moonHouseFromRasi()` are deleted. `RASI_LIST` (rasi number → symbol/name) is kept client-side — it's a fixed classical zodiac enumeration used only for the picker UI and icons, not prediction content, so it isn't a divergence risk the way `HOUSE_PREDICTIONS` was.
- **Contract locations touched:** `app/api/public_tools.py` (new route + shared helper + rate limit), `packages/shared/src/api/rasiPalan.ts` (`getRasiPalanGrid()`, `RasiPalanGridItem`, `RasiPalanGridData`), `web/app/tools/indraiya-rasipalan/RasippalanTool.tsx` (rewired). `mobile/src/api/rasiPalan.ts` re-exports the unchanged `getRasiPalan`/`RasiPalanData` and needed no changes; confirmed via the existing mocked contract test in `mobile/__tests__/api/contracts.test.ts` (unaffected, still passing) and via reading `app/api/daily_snapshot.py` (imports `_RASI_PALAN_TA`/`_RASI_PALAN_EN`/`_resolve_rasi_number` directly for the mobile today-screen composite endpoint — left untouched; same private names, same behavior, out of scope for this item).
- **Tests:** 6 new tests in `tests/test_public_tools_api.py` (all `pytest.mark.no_db`): single endpoint returns a full prediction for a named rasi; accepts a numeric rasi; rejects an out-of-range rasi (422); grid returns all 12 rasis; a grid row matches the equivalent single lookup byte-for-byte (headline/body/luckyNumbers/tone/moonHouse); moonRasi agrees between grid and single. Full file: 16 passed against the test DB (`vinaadi_test`, port 5433).
- **Verified:** `packages/shared` and `web` both compile clean (`tsc --noEmit`); ESLint clean on the changed web file; mobile's `rasiPalan` contract tests still pass unmodified.

---

### WIRE-5 Family Vault: four fully-built backend endpoints, zero UI `[x]` — resolved 2026-07-05 (5a + 5b)

**Problem:** These endpoints exist, are registered, have request/response models, and are exercised by nothing in `web/`:
- `GET /family-vaults/{id}/summary`
- `GET /family-vaults/{id}/composite`
- `GET /family-vaults/{id}/members` (list) and `GET /family-vaults/{id}/members/{member_id}` (single)
- `GET /family-vaults/{id}/journal` and `GET /family-vaults/{id}/journal/summary`

`web/components/dashboard-family-tab.tsx` currently reimplements a rougher version of "summary" info manually by combining `daily-aggregate` + `calendar` responses, suggesting `/summary` and `/composite` may have been built for a richer version of this tab that was never finished on the frontend.

**Decision:** Build the UI. The backend investment is already sunk; this is close to pure-frontend ROI, and family-tier richness is a stated product differentiator (see `[[project_tier_plan]]`). Sequence as two sub-tasks by risk/complexity:

**WIRE-5a (do first, lower complexity) `[x]` — resolved 2026-07-05:** Wire `/summary` and `/composite` into `dashboard-family-tab.tsx`, replacing or augmenting the current manual combination of `daily-aggregate` + `calendar`. Also wire the member list/detail endpoints wherever the tab currently derives member info ad hoc.

**Resolution (2026-07-05):** `/summary` turned out to be a strict subset of `/daily-aggregate` (`get_family_summary` literally calls `get_family_daily_aggregate` and drops fields — same DB/compute cost) — calling both for the same vault/date would just double the work for zero new data, so it was **not** wired in; `daily-aggregate` stays the source for the hero card, chandrashtama alert and per-member best/avoid windows, none of which `/summary` alone can provide. `/calendar` was replaced with `/composite` in `useFamilyData.ts`'s `fetchFamilyBundle` (same backend cost — `get_family_calendar` and `get_family_composite_timeline` both loop `get_family_daily_aggregate` per day; composite just keeps the per-member breakdown calendar discarded) and the 7-day outlook section in `dashboard-family-tab.tsx` now renders a per-member trend row underneath the family-level bars, using data that literally already existed in the response. `/family-vaults/{id}/members` (list) now backs the tab's relationship-label lookups (`MemberDetailExpanded`, the synastry `memberOptions` list), replacing the `(member as any).relationshipToOwner ?? memberChart?.chart?.birthProfile?.relationshipToOwner` cast-and-fallback hack that only worked once a member's full chart bundle had loaded. New shared types (`FamilyMemberData`, `FamilyMemberListData`, `CompositeMemberScore`, `CompositeTimelineItem`, `FamilyCompositeTimelineData`) added to `packages/shared/src/types/index.ts` alongside the existing `Family*` interfaces; fetches stayed in `useFamilyData.ts`'s existing direct-`apiFetchJson` pattern per this doc's own primary-files note, not a new shared-client wrapper. A dead, unused `MemberRowCard` component (same ad-hoc-relationship-derivation bug, zero call sites) was deleted from `dashboard-family-tab.tsx`. **Bonus fix found during manual verification:** `_persist_family_daily_score` (`app/services/family_vault_service.py`) had a non-atomic check-then-insert race — `daily-aggregate`, `composite` and `today` can all compute-and-cache the same vault/date/timezone row concurrently on a freshly created vault's first view, and the loser got a raw 500 (`UniqueViolation` on `uq_family_daily_scores_vault_date_tz`) instead of a graceful fallback. Fixed by catching the `IntegrityError`, rolling back, and re-reading+updating the row the winner just committed — verified against a live signup→vault→2-members→family-tab run (Playwright) that reproduced the 500 before the fix and rendered cleanly after it; `tests/test_family_vaults_api.py` (8 tests) still passes.

**WIRE-5b (do second, needs an access-control decision) `[x]` — resolved 2026-07-05:** Family journal (`/journal`, `/journal/summary`) is a new surface, not a replacement of something existing — the only journal UI today is the single-user personal journal tab (`dashboard-journal-tab.tsx`, backed by `app/api/journal.py`, unrelated router). Before building UI: decide who can see whose journal entries inside a shared family vault (all members see all entries? Owner-only? Per-entry visibility flag?). Check `app/api/family_vaults.py`'s journal handlers for any existing visibility/permission filtering logic — the backend may have already decided this; don't assume.

**Resolution (2026-07-05):** The two handlers actually live in `app/api/journal.py` (`GET /family-vaults/{id}/journal` and `/journal/summary`), not `app/api/family_vaults.py` — this doc's file citation was stale. The access-control question turned out to be moot: `list_family_vault_journal_entries`/`list_family_vault_journal_summary` (`app/services/journal_service.py`) filter on `JournalEntry.owner_user_id == owner_user_id` AND `FamilyMember.owner_user_id == owner_user_id` — there is no second authenticated actor who could ever see this data. Confirmed in `app/models/family_member.py`: `managed_by_user_id`/`consent_status` fields exist on the schema (forward-looking for a possible future self-managed-member feature) but `add_family_member` (`app/services/family_vault_service.py`) unconditionally sets `consent_status="owner_managed"` and `managed_by_user_id=owner_user_id` with zero code paths that ever set anything else — every family member is owner-managed today, full stop. The feature is therefore just "the owner's own journal entries, filtered to ones written against a family member's chart" (the INNER JOIN through `BirthProfile.family_member_id` means entries against the owner's *own* chart never appear here — that's intentional, not a bug, and was confirmed during manual verification: 2 seed entries against the owner's own chart correctly did not show up, 1 seeded against a member's chart did). Built a read-only "Journal" sub-tab in `dashboard-family-tab.tsx` (alongside the existing "members"/"synastry" sub-tabs) with a per-member filter row, a life-area summary strip, and a read-only entry list (no edit/archive — those stay in the personal journal tab, which is where entries are authored). New shared types (`FamilyVaultJournalEntryData`, `FamilyVaultJournalData`, `FamilyVaultJournalLifeAreaCount`, `FamilyVaultJournalSummaryData`) added to `packages/shared/src/types/index.ts`. Verified end-to-end via Playwright (fresh signup → vault → member → 3 seeded journal entries across owner/member charts → Journal sub-tab correctly shows only the 1 member-scoped entry with its life-area and tags).

**Primary files:**
- [app/api/journal.py](../app/api/journal.py) — the four family-vault-journal handlers actually live here, not in `family_vaults.py`.
- [web/components/dashboard-family-tab.tsx](../web/components/dashboard-family-tab.tsx)
- [web/hooks/useFamilyData.ts](../web/hooks/useFamilyData.ts) — this is where the existing family-vault fetches live (`fetchFamilyBundle`, etc.); add the new fetches here following the existing pattern rather than introducing a new fetching approach.

**Done when:** Family tab shows summary/composite/member data sourced from the dedicated endpoints (not re-derived client-side), and a documented decision exists for journal visibility before that UI ships.

---

### WIRE-6 Birth-time-rectification public page has no interactive surface `[x]` — resolved 2026-07-05

**Problem:** `web/app/tools/birth-time-rectification/page.tsx` is static marketing copy — hero text, step descriptions, FAQ — with no form, no input, no fetch call. It only links to `/dashboard`. The real, working rectification wizard (`web/components/dashboard-rectification-wizard.tsx`, calling `app/api/rectification.py`'s two endpoints) is authenticated-only, reachable from `dashboard-setup-tab.tsx`.

**Decision:** This is **not a bug to fix by faking a demo** — rectification fundamentally operates on an existing birth profile plus a set of known life events; there is no meaningful anonymous version of "estimate my birth time" without that input, unlike e.g. chart-preview or porutham-compare which take raw inputs upfront. **Keep this page as a conversion funnel, but tighten it:**
1. Make the page honest about needing an account — the current copy already implies this loosely; make the primary CTA explicit ("Create your free chart to start rectification") rather than a generic "Go to dashboard" link.
2. If the page currently collects any birth details as part of its copy/FAQ interactions (check current implementation), thread them into the signup flow as progressive profiling so a user doesn't re-enter data. If it collects nothing today, this is optional polish, not required.
3. Do not build a fake "preview" that produces output without hitting `app/api/rectification.py` — that would be a new instance of exactly the WIRE-3/WIRE-4 divergence risk this document is trying to eliminate.

**Primary files:** [web/app/tools/birth-time-rectification/page.tsx](../web/app/tools/birth-time-rectification/page.tsx), [web/components/dashboard-rectification-wizard.tsx](../web/components/dashboard-rectification-wizard.tsx) (reference only, don't duplicate its logic).

**Priority note:** This is UX/conversion polish, not a functional bug — rank it below WIRE-1 through WIRE-5.

**Resolution (2026-07-05):**

- **Confirmed the page collects zero birth details today** (re-read in full: hero, 3 content bands, FAQ, CTA strip — no `<form>`, no input, no fetch call anywhere), so item 2 of the decision (progressive-profiling handoff into signup) is moot per its own escape hatch — nothing to thread through. No fake preview was built, per item 3.
- **Item 1 (make the CTA explicit) was the only actionable change.** Both CTAs on this page were the odd ones out compared to every other public tool page (`jadhagam-generator`, `indraiya-rasipalan`, `daily-panchangam-planner`, `muhurta-calculator`, `marriage-porutham-calculator`), all of which already follow a consistent pattern: a benefit-specific headline + "Create a free account for/to `<specific value>`" body + a "Get started free →" button. This page instead said "Try rectification →" (hero) and "Open dashboard →" (bottom strip) — copy that implied an interactive demo existed, which is exactly the false impression the audit flagged.
- **Fix:** `web/lib/marketing-i18n.ts`'s `TOOL_BTR` — hero CTA (`cta_start`) changed to "Create your free chart to start rectification →" (the exact phrasing suggested in this doc's decision). Added `cta_strip_h2`/`cta_strip_body`/`cta_start_free` to bring the bottom CTA strip in line with the other five tool pages' pattern: headline "Save your chart, then narrow the birth time", body explicitly states rectification needs an existing chart + life events, button "Get started free →" (matching the other pages verbatim rather than inventing new button copy). `web/app/tools/birth-time-rectification/page.tsx` updated to consume these via `mt()` instead of the old inline hardcoded strings.
- **Both CTAs still link to `/dashboard`** (unchanged target — matches every other tool page's convention; no separate signup route exists in this codebase for tool pages to link to instead).
- **Verified:** `tsc --noEmit` clean on `web`; ESLint clean on both changed files (`page.tsx`, `marketing-i18n.ts`).

---

### WIRE-7 `packages/shared/src/api/*.ts` is ~95% dead code in web, with two known landmines `[x]` — resolved 2026-07-05

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

**Resolution (2026-07-05):**

- **Both landmines confirmed live and fixed.** `getDailyGuidance()` is not just theoretically broken — it's actually called today by `mobile/app/daily-score.tsx` and `mobile/app/chandrashtama.tsx` (both re-exported through `mobile/src/api/guidance.ts`), so every real invocation was 404ing. Fixed to `GET /charts/{chartId}/daily-guidance` with `date` as the only query param (confirmed against `app/api/daily_guidance.py:55-64`, which also has an optional `language` query param the wrapper doesn't expose — left alone, not part of this bug). `registerFcmToken()` is likewise actually called by `mobile/src/hooks/usePushNotificationOptIn.ts:64` — every real push opt-in was 405ing. Fixed to `PUT /settings/notifications/fcm-token` (confirmed against `app/api/notification_preferences.py:99-113`); the body shape (`{fcmDeviceToken}`) was already correct, only the verb was wrong.
- **Underlying gap found while fixing the second bug:** the shared `ApiClient` interface (`packages/shared/src/api/client.ts`) never had a `put` method — only `get`/`post`/`patch`/`delete` — so there was no way to call this endpoint correctly even once the wrapper was fixed. Added `ApiPut`/`put` to the interface, plus concrete implementations in both `web/lib/api.ts` and `mobile/src/api/client.ts` (mirroring the existing `patch` plumbing exactly — proxy-routed on web, auth-refresh-wrapped on mobile).
- **Regression tests:** added to `mobile/__tests__/api/contracts.test.ts` (the existing mocked-client contract-test pattern used for every other shared wrapper) — one asserting `getDailyGuidance` calls `/charts/{chartId}/daily-guidance` with `date` as the only param, one asserting `registerFcmToken` calls the mock's `put` (not `patch`) with the right path/body. Full suite: 11 passed. Also re-typechecked `packages/shared`, `web`, and `mobile` (`tsc --noEmit`) — clean on all files touched by this change; mobile's project-wide `tsc --noEmit` has pre-existing, unrelated failures (missing Jest type globals across all `__tests__/**`, an unrelated `dasha` type-export mismatch, a missing `@expo/vector-icons` type package) that predate this change and aren't in any file this task touched.
- **Dead-export sweep:** grepped every `function`/`const` export across all 27 files in `packages/shared/src/api/` (73 runtime exports) against `web/` and `mobile/` for zero callers. Result: **none are dead in both** — everything has at least one real caller in web or mobile (confirming the audit's own prediction that the "web-unused" ones are mobile-load-bearing). Nothing was deleted. (Type-only exports were excluded from the sweep — a type not being imported by name doesn't mean it's unused, since callers routinely consume the shape structurally without importing the type identifier; spot-checked the 4 zero-name-match types found this way — `CharaKarakaMap`, `DashaLevel`, `DashaInterpretation`, `DashaTransitionNote`, `PoruthamGridPayload` — and confirmed each is a live parameter/field type on a function in the same file, not actually dead.)
- **Forward policy written:** added a new "`packages/shared/src/api/` forward policy" subsection to `CLAUDE.md`'s existing "API contracts" section (grandfather existing direct-fetch call sites, new endpoints get a typed wrapper, verify path/verb against the actual FastAPI route rather than assuming, don't delete a wrapper for being web-unused without checking mobile first). Cross-referenced from `docs/AGENT_INSTRUCTIONS.md` §17.1 so agents following either doc's frontend-API guidance land on the same rule.
- **Scope note:** this pass only verified the two known-broken exports plus did the zero-caller sweep; it did not re-verify correctness of all 73 runtime exports' URL/verb/param shapes against their backend routes (that would be a much larger audit, out of scope for "cheap, prevents future landmines" per the execution-order note on this item).

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

### WIRE-11 `POST /admin/run-peyarchi-refresh` is redundant dead code `[x]` — resolved 2026-07-05

**Problem:** This dedicated endpoint (`app/api/admin.py`) has no caller — the generic `POST /admin/jobs/{job_id}/trigger` (which **is** wired, `admin-console.tsx:424`) already covers the same job via `app/scheduler.py:74`'s `register_job(...)`.

**Decision:** Delete the dedicated endpoint. Reducing unused API surface area is directly in scope for a hardening branch. **Primary file:** [app/api/admin.py](../app/api/admin.py) — confirm the job is genuinely reachable via the generic trigger path before deleting, then remove the route and its registration in `app/main.py`.

**Resolution (2026-07-05):** Confirmed before deleting: `app/scheduler.py`'s `SCHEDULED_JOBS` registers `daily_peyarchi_refresh` (same callable the dedicated route called) under job id `"daily_peyarchi_refresh"`, and `daily_peyarchi_refresh(run_at_utc=None)` defaults to `datetime.now(UTC)` internally — identical behavior to the dedicated route's explicit `datetime.now(UTC)` call. Confirmed zero callers of `/admin/run-peyarchi-refresh` anywhere in `web/`, `mobile/`, `packages/shared/`. Removed the route, its now-unused `PeyarchiRefreshResult` model, and the now-unused `daily_peyarchi_refresh` import from `app/api/admin.py`. The dedicated route's own regression test (`tests/test_peyarchi_alert_service.py::test_admin_run_peyarchi_refresh_endpoint`) was rewritten rather than deleted — it now hits `POST /admin/jobs/daily_peyarchi_refresh/trigger` and asserts the same real end-to-end outcome (a real chart gets refreshed, `charts_refreshed >= 1` parsed out of the generic endpoint's `result_summary`), so the "generic trigger covers the same job" claim this deletion rests on is actually exercised by a test, not just asserted in prose. `tests/test_admin_api.py::test_jobs_list_and_manual_trigger` already separately confirmed `daily_peyarchi_refresh` appears in the registered job list. Full `test_admin_api.py` + `test_peyarchi_alert_service.py`: 14 passed.

### WIRE-12 `app/api/devices.py`'s push-token endpoints are dead, superseded by a different route `[x]` — resolved 2026-07-05

**Problem:** `POST`/`DELETE /devices/push-token` (confirmed: this file, read in full, contains only these two endpoints — safe to reason about as a whole router) have typed client wrappers (`registerPushToken`/`unregisterPushToken` in `packages/shared/src/api/auth.ts`) that are never called anywhere. Both web (`dashboard-settings-session-tab.tsx:332`) and mobile (`usePushNotificationOptIn.ts:64`) actually register push tokens through a **different** endpoint: `PUT /settings/notifications/fcm-token` (`app/api/notification_preferences.py`), which is genuinely wired (confirmed under WIRE-7's audit scope).

**Decision:** Delete `app/api/devices.py` entirely (router file + its `include_router` call in `app/main.py`) and the two dead wrapper exports in `packages/shared/src/api/auth.ts`, **after** confirming: (1) the `DeviceToken` model/table isn't still written to by the surviving `fcm-token` path in a way that depends on this router's upsert logic — check `app/api/notification_preferences.py`'s handler actually writes to the same `DeviceToken` table itself rather than assuming this router does it, and (2) no other backend service (e.g. `notification_dispatch_service`, referenced in this file's own docstring) imports functions from `devices.py` directly.

**Primary files:** [app/api/devices.py](../app/api/devices.py), [app/main.py](../app/main.py), [packages/shared/src/api/auth.ts](../packages/shared/src/api/auth.ts).

**Resolution (2026-07-05):**

- **The pre-deletion check surfaced a bigger finding than expected.** `app/api/notification_preferences.py`'s `update_fcm_token` does **not** write to the `DeviceToken` table at all — it writes a single `fcm_device_token` string field on `UserNotificationPreference` (one token per user, not per device). `notification_dispatch_service.py`'s `dispatch_notification`/`dispatch_queued_notification` (the only real push-send code paths) only ever read `pref.fcm_device_token` — grepped the entire `app/` tree for `DeviceToken` and found no reader anywhere, not just none in the dispatch service. `devices.py`'s own module docstring ("Fan-out: notification_dispatch_service reads DeviceToken rows by user_id to send to all of a user's devices") is stale/false — describes an architecture that was apparently replaced by the single-token-per-user model at some point without this router or its docstring being cleaned up. Net effect: the `DeviceToken` table was already fully write-only and dead before this change, for reasons independent of whether `/devices/push-token` had callers.
- **Scope decision:** deleted the router (`app/api/devices.py`), its registration in `app/main.py`, and the two dead wrapper exports (`registerPushToken`/`unregisterPushToken`) from `packages/shared/src/api/auth.ts` plus their re-export in `mobile/src/api/auth.ts` — exactly what this item scoped. Deliberately **left the `DeviceToken` SQLAlchemy model and its DB table alone**: dropping a table/model is a schema change requiring a reversible migration and, per this repo's DB safety rules ([[feedback_postgres_composite_type_cleanup]] and CLAUDE.md's migration-authoring section), shouldn't be bundled into an API-surface cleanup without separately confirming there's no historical data worth preserving. Flagging as a follow-up candidate, not doing it here.
- **Verified before deleting:** zero references to `registerPushToken`/`unregisterPushToken` in any test file (mobile or web); the same-named local functions in `dashboard-settings-session-tab.tsx:314-357` are unrelated (they call `/settings/notifications/fcm-token` directly via `apiFetchJson`, not the shared wrapper — easy to confuse by name but a different code path); no backend test referenced `app/api/devices.py`. `python -c "import app.main"` succeeds after removal.
- **Verified after deleting:** `packages/shared` and `web` typecheck clean; mobile's `tsc --noEmit` has the same pre-existing unrelated failures noted in WIRE-7's resolution (Jest globals, an unrelated `dasha` type-export mismatch, missing `@expo/vector-icons` types) and no new ones from this change.

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
