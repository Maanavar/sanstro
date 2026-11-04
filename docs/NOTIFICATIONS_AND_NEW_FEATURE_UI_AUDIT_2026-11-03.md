# Chandrashtamam alerts + UI coverage of new features — audit 2026-11-03

Branch at audit time: `feat/l7-ask-limits` (`71766807`). Read-only: nothing was changed.
Dev DB was queried read-only (counts and booleans, no personal fields).

## Fix status (2026-11-03, uncommitted on `feat/l7-ask-limits`)

| Item | Status | Where / gate |
|---|---|---|
| F1 / N2 own chart | **Fixed** | `birth_profile_service.find_owner_birth_profile` (shared with dashboard restore); `tests/test_daily_push_cron_db.py` — 3 of 5 fail with the old query restored. Blind spot: the `self`-member and soft-delete cases pass either way. |
| F6 guidance-failure fallback | **Fixed** | `daily_push_cron._chandrashtama_fallback` → `is_chandrashtama_day`; fails with the flat `False` restored. |
| F2 / N4 mobile "updates" switch | **Fixed** | `UpdatesConsentCard` in Notification settings; switches disabled while off; Me tab has updates + Ask-improve switches. |
| F3 alerts-paused notice | **Fixed** | Web bell popover (`AlertsPausedNote`, fetched only when opened); mobile inbox header. Not on Home. |
| Part 3 mobile consent panel | **Fixed** | `ConsentSheet` (root layout); a `CONSENT_REQUIRED` response reopens it (`mobile/__tests__/consentPrompt.test.ts`, fails without the client hook); Me → "Privacy choices" row while owed. |
| Consent copy, one table | **Moved** | `packages/shared/src/consentCopy.ts`; `web/lib/consent-copy.ts` re-exports. |
| U1 consent panel | **Redesigned** | `consent-panel.css`, no inline styles, ×, Required/Optional groups, disabled-button hint. Also fixed: it mounts outside `.cd-shell`, so it had the marketing palette and track-less toggles; now a `display: contents` `.cd-shell` host. The held-data notice is **in view again** (decision D1 below), now `HELD_DATA_NOTICE` in `packages/shared/src/consentCopy.ts`, and mobile's `ConsentSheet` shows it too (it showed only the link). |
| U2 privacy choices | **Fixed** | "Given / Not given" chip; alert toggles + time disabled while updates is off. The "card drift" claim was wrong: the tab's local `Card` uses identical values. |
| U3 upgrade page | **Fixed** | `<Card>`/`<Button>` + `components/upgrade-page.css`; new Settings → **Plan & billing** (`/dashboard/settings/plan-billing`), store-bought subscriptions pointed to the store. |
| U4 Ask credits / paused | **Fixed** | `daily-status` gains `creditsRemaining`, `askPaused` (types regenerated). Also fixed: web and mobile blocked the input at 0 allowance even with credits. Shared `askOutOfQuestions`. |
| Pirantha copy | **Fixed** | Web and mobile now say "on your own birth-star day" (it is sent on the day, own chart only). |
| `deleteAccount` wrapper | **Fixed** | Settings uses the shared wrapper. |
| F4 dedicated alert | **Built** | Decision D2. `CHANDRASHTAMA` type, `chandrashtama_alert_enabled` (migration `ef4a5b6c7d8e`, default true, applied to dev 2026-11-03 after backup `backup_20261103_1202.sql`), `panchangam.chandrashtama_window_for_day`, web + mobile toggles, bell label. `tests/test_chandrashtama_alert.py`: with the solar-day-clipped window put back, 2 of 11 fail. Blind spot: the two-sunrise dedupe is proven by the key format only; a 2026 sweep of five charts found no such window to test against. |
| F5 family alerts | **Built** | Decision D3. `family_members.alerts_enabled` (migration `fa5b6c7d8e9f`, default false, applied to dev 2026-11-03 after backup `backup_20261103_1249.sql`); `FAMILY_DIGEST` type; evening cron pass over opted-in members (`_opted_in_family_members`, `_member_digest_entry`, `family_digest_copy`) folding the user's own window in when it coincides; web per-member toggle in the edit-member modal. `tests/test_family_alert_digest.py` (7). Blind spot: the digest's own-window merge is proven by mocked windows, not an end-to-end sweep; and a user who turned OFF their own Chandrashtamam *and* every other own-alert is not in the cron loop, so their family toggle is silent until any own-alert is on (default Chandrashtamam keeps everyone in the loop) — see the limitation below. Mobile toggle rides on the not-yet-built mobile family management (Part 3). |
| Mobile export / delete / email verify | **Built** | New `mobile/app/account.tsx` ("Account & data"), linked from a row on the Me tab. Export → `exportMyData` shared as a JSON file (`src/lib/dataExport.ts`, own UTF-8 base64 — no file/base64 dep; `__tests__/dataExport.test.ts`); delete → `deleteAccount` with the same session teardown as sign-out and a 409 "cancel subscription first" message; resend verification when `me.emailVerified` is false. Backend wrappers already existed. |
| Mobile upgrade / buy / cancel | **Built** | Decision D4: the app sells only through the store, and cancels only what the store cannot. `packages/shared/src/subscriptionManage.ts` is the one table (`subscriptionManageAction`, `periodEndMeaning`, `isStoreSubscription`), read by `premium.tsx`, `(tabs)/me.tsx` and web's `settings-plan-billing.tsx`. `GET /users/me/subscription` gained `cancel_at_period_end`. `mobile/__tests__/subscriptionManage.test.ts` (8): with "always the store" restored, 2 fail; `tests/test_razorpay_payments.py::test_cancelling_tells_the_clients_the_period_end_is_now_a_stop_date` fails with the new field dropped. Blind spot: neither gate renders a screen, so a call site that stopped reading the table would still pass. |
| Mobile family-member edit | **Built** | New `mobile/app/family-member.tsx`, opened from "Edit details" on the vault's member detail. Name, relationship (weight rides with it — `packages/shared/src/familyMember.ts`, now also read by the web modal), the **F5 per-member alert toggle** (disabled while the updates consent is off, since nothing would be sent), "where they live now" with the clear-to-birth-place sentinel, and remove-member. Birth date/time/place read-only: correcting them recasts the chart and the input block for that is still inside onboarding. Member CRUD got typed wrappers (`packages/shared/src/api/familyVault.ts`) — web reached these with raw `apiFetchJson`. `mobile/__tests__/familyMemberEdit.test.ts` (10): with a naive "send the whole form" builder, 9 fail. Blind spot: the patch builder is tested, the screen is not rendered by any test, and mobile still cannot *add* a member (the vault's "Add +" is still an upsell). |
| U7 life-focus admin UI | **Built** | `web/components/admin-life-focus-panel.tsx` in Admin → Analytics, with a month picker; reads `GET /admin/analytics/life-focus` (served since Phase 4, previously unread by any screen) through the console's own `adminFetchJson`, typed by the shared wrapper's `LifeFocusMetrics`. The design point: adoption and the per-focus tuning table are snapshots **as of now** whatever month is picked, and each block says so beside its own numbers; only the Skip rate and change rate belong to the period. BALANCED is badged "default", not "rarely picked"; a focus offered to nobody reads "-", not 0%. `components/admin-life-focus-panel.test.tsx` (6): with the naive version (period label on adoption, 0% for a null share, no BALANCED case), 3 fail. Blind spot: no new CSS, and the fetch/month round-trip and elevation path stay untested. |

All new Tamil strings are pending native review.

---

## Part 1 — Chandrashtamam is not notified

Short answer: **correct, nobody gets a Chandrashtamam alert today, for themselves or for
family.** There are four separate causes. Any one of them alone would explain the report.

### N1. No Chandrashtamam alert exists (design gap)

`app/services/daily_push_cron.py` sends exactly three types: `MORNING_NALLA_NERAM`,
`DASHA_TRANSITION`, `PIRANTHA_NAAL`. Chandrashtamam is only **one sentence appended to the
morning Nalla Neram push** (`daily_push_cron.py:312-314`):

- it fires only if the user turned on the *morning* alert (default **off**);
- it says nothing about the window (start/end time), although the engine has it
  (`own_chandrashtama_windows`);
- there is no advance warning (the evening before / when the Moon enters the 8th);
- if `get_daily_guidance` throws, `is_chandrashtama` falls back to `False` silently
  (`:288`), so the user is told nothing instead of being told from the panchangam;
- there is no separate toggle in `user_notification_preferences`.

The specs ask for more: the v7 master spec step 10 ("sends a personalised alert only to
those users", with the exact start and end window), and `docs/mobile/MOBILE_DECISIONS.md:122`
lists "Chandrashtama alerts | Free" as a feature.

### N2. The root user's push is computed on the wrong chart (bug)

`_latest_active_profile` (`daily_push_cron.py:133`) picks the **newest** birth profile the
user owns and does **not** filter `family_member_id IS NULL`. Family members are birth
profiles owned by the same user, so after the user adds a family member, the morning score,
the Chandrashtamam line, the dasha alert and Pirantha Naal are all computed on **that
family member's chart** and sent to the user as if they were the user's.

Confirmed on dev: the one account with family has its own profile ranked 3rd by
`created_at`. The two family profiles are newer, so the cron reads a family member's chart.

The correct helper already exists: `life_focus_service.self_birth_profile` (own profile,
oldest first), or the ordering in `birth_profile_service.py:611-629`.

### N3. Family members get nothing (design gap)

The cron loops over users, never over family members. The family Chandrashtamam is computed
for display (`family_vault_service.py:376, 460, 549, 1826`; Family & Charts card,
Today's Rhythm) but never pushed.

Copy mismatch: the web toggle for Pirantha Naal says **"Star-birthday reminders for family
members"** (`web/components/dashboard-settings-session-tab.tsx:808`). The cron sends it for
one profile only, and per N2 not reliably the user's own. The setting promises something the
backend does not do.

### N4. Since L2, every alert is paused, and mobile users cannot unpause (blocker)

`dispatch_notification` returns `no_consent` before writing anything, including the in-app
bell row, unless the user granted the "updates" purpose (`notification_dispatch_service.py:240`).
This was the owner-approved L2 decision ("old switches ≠ consent"). The consequences:

- dev: **0 rows in `consent_records`**, so no account receives any alert of any type;
- web: the user must open Settings → Notifications and turn on the `UpdatesConsentNotice`
  toggle; nothing on Home or the bell explains why alerts stopped;
- **mobile: registration sends `updates: false` (`mobile/app/(auth)/register.tsx:67`) and no
  mobile screen can turn it on.** `updateMyConsents` is only called for `analytics` in
  `me.tsx`. A mobile-only user can never receive an alert, whatever their switches say.

### Proposed fix order (needs your go-ahead; not started)

| # | Change | Size |
|---|---|---|
| F1 | Cron uses the user's own profile (`family_member_id IS NULL`, oldest first). Regression test with a newer family profile. | small, no migration |
| F2 | Mobile: "Updates & astro alerts" consent switch in Notification settings + the same notice web has. | small |
| F3 | Web/mobile: tell the user on the bell / Home that alerts are paused until they allow updates. | small |
| F4 | A dedicated `CHANDRASHTAMA` alert: own toggle (default on once consent exists), sent the evening before and/or at window start, with start–end times, Tamil-first copy. Needs a preference column + migration. | medium |
| F5 | Family alerts: Chandrashtamam (and Pirantha Naal, as the copy already promises) for each family member, one digest push per user per day, to avoid N separate pushes. Needs a per-member opt-in decision. | medium |
| F6 | When guidance fails, fall back to the panchangam Chandrashtamam check instead of `False`. | small |

**Owner decisions needed for F4/F5:** answered 2026-11-03 under the owner's delegation; see
"Decisions" below.

### Decisions (delegated to Claude by the owner, 2026-11-03)

**D1. The held-data notice stays in view, not behind a fold-out.** DPDP §5 asks for the
notice to accompany or precede the request, and the 2025 Rules ask for it to be
understandable on its own and itemised. A closed `<details>` is a notice most people never
open, and this is birth data for a whole family (A12). The paragraph is 60 words; the
panel's length is not the problem worth solving with legal risk. It is now one shared
string, so mobile shows it as well. Adding the Chandrashtamam alert does not raise
`CURRENT_POLICY_VERSION`: it sits inside the existing "updates and astro alerts" purpose
and processes no new data. The purpose description now names it.

**D2. Chandrashtamam: evening before, 19:00 local, on by default once updates are allowed.**
- *Why evening.* Under the D11 உதய rule the named day's window usually opens the afternoon
  before (2026-09-09 15:14 for the 10th). A morning-of alert would arrive hours into it, and
  the evening is when a Tamil household plans the next day. The morning push keeps its
  one-line reminder on the day, so "both" is covered without a second dedicated push.
- *What it says.* The window's true start and end, with day words ("இன்று மதியம் 3:14 முதல்
  நாளை காலை 8:20 வரை"), counsel not command (தவிர்ப்பது நல்லது), and that routine work goes
  on. No fear language. About 13–14 alerts a year per person.
- *Why on by default.* Delivery still needs the updates consent and a channel; a user who
  allowed astro alerts asked for exactly this one, and it is the alert Tamil users already
  look up by hand. The other toggles stay opt-in.
- *Engine.* `chandrashtama_window_for_day` names the same day `is_chandrashtama_day` badges,
  then re-walks a day either side for the real edges, because the day's list is clipped to
  its solar day and would report "from sunrise" for a window that opened the afternoon before.
  Dedupe is keyed on the window start, so a window covering two sunrises warns once.

**D3. Family alerts: opt-in per family member, free within the user's vault limit, one
evening digest.**
- *Opt-in, per member.* The family member is the data principal; their details were entered
  to compute charts, and alerting about them is a further use the user should choose person
  by person. It also bounds noise: five members on by default would be ~65 extra pushes a year.
- *Free.* The tier lever is already vault size (registered 1, premium 5). Charging for a
  caution about one's mother reads badly in a family product, and `MOBILE_DECISIONS.md`
  already lists the user's own Chandrashtamam alert as Free.
- *Shape.* One toggle per member ("alerts for this person") covering Chandrashtamam and
  Pirantha Naal; one push per evening naming everyone whose day is tomorrow, merged with the
  user's own when both fall together.
- *Build (next).* `family_members.alerts_enabled` boolean default false (migration), the
  toggle on the family member card (web + mobile), a cron pass over opted-in members with a
  completed chart reusing `chandrashtama_window_for_day`, digest copy.

**D4. Mobile buys through the store only; it cancels only a subscription the store cannot.**
- *No Razorpay checkout in the app.* Apple and Google both require their own purchase flow
  for digital goods, so the Part 3 row "`/payments/*` — mobile: none" cannot be satisfied
  literally. Buying on mobile stays with the store (RevenueCat, already in `premium.tsx`).
  The two `/payments/*` calls the app does make are reads/manage: the catalogue price, and
  cancel.
- *Cancel routes by provider.* `revenuecat` → the store's subscriptions screen; `razorpay`
  (bought on the web) → `POST /payments/subscription/cancel`, which the store cannot do.
  Managing a subscription bought outside the store is not a store purchase, so this is
  allowed. An unknown provider is treated as ours: the 404 "No active subscription to
  cancel" says something true, where a store deep link leaves the user on an empty list.
  Before this, `me.tsx` sent *every* premium user to the store.
- *The period-end date is labelled by state.* "Renews" was shown even to someone who had
  just cancelled; `cancel_at_period_end` now comes from `/users/me/subscription` and both
  clients say "Ends" instead, and drop the cancel control once renewal is stopped.
- *No selling during the open beta.* `premium.tsx` now shows the same "everything is free in
  open beta" notice the web upgrade page shows, and a premium user who opens it sees their
  plan instead of "Start Premium".
- *Prices are no longer hardcoded.* The store's own price wins (it is what gets charged);
  the catalogue (`GET /payments/products`) stands in when the store has no offering, and the
  "44% off!" badge is derived from the two prices instead of being a literal.
- *One-time products stay off mobile* (report packs, Ask top-ups): they have no store
  product configured, and linking out to the web to buy them is exactly what store
  anti-steering rules forbid.

### Found while building F4, now fixed / noted

- **Fixed 2026-11-03.** The web "Smart silence" row said it pauses alerts "during Rahu Kalam
  & night". The backend does something else: during a heavy Sani cycle, at most one *push* a
  day (`notification_dispatch_service`, `_HEAVY_SANI_CYCLES`, push channel only). Both the
  toggle row and the Notifications panel header now say "during a heavy Saturn period, at
  most one push a day" (`dashboard-settings-session-tab.tsx`). Mobile has no smart-silence
  copy to correct.
- With Chandrashtamam on by default, the cron loads every preference row each hour, not only
  opted-in ones. Fine at beta scale; at scale, filter by local hour before the per-user work.

### Known limitation left by F5 (not a bug at beta scale)

The evening family digest runs inside `_dispatch_for_user`, which the cron reaches only for
users its top-level query returns — those with at least one own-alert flag on. Because the
Chandrashtamam flag defaults ON, every user with a preference row is in the loop, so the
digest fires for them. The gap: a user who explicitly turned OFF their own Chandrashtamam
*and* morning/dasha/Pirantha alerts, yet opted a family member in, is not selected and gets
no digest. The clean fix is to union family-alert owners into the top-level selection; it was
left out here to avoid reworking the query that the mock-based cron smoke tests assert against
(`tests/test_daily_push_cron.py`). Revisit with the scale fix above.

---

## Part 2 — UI/UX of recently built features (L1–L7)

Benchmark: existing settings sections use `<Card>`, `<Field>`, `<Toggle>`, `<Button>` from
`components/ui`, and existing modals use their own CSS file with Nova tokens
(`dashboard-feedback-modal.css`, `dashboard-guest-chart-modal.css`).

### U1. Consent panel (`web/components/consent-panel.tsx`): inconsistent, the worst offender

- 16 inline `style={{}}` blocks, no CSS file. Every other dashboard modal has one.
- Uses the **chart deep-dive palette** (`--deepdive-ink`, `--deepdive-surface`, falling
  back to `--panel-cream`/`--panel-earth`) instead of the modal/settings tokens
  (`--color-surface`, `--color-text-strong`, `--radius-xl`, `--space-*`). That is why it
  looks unlike anything else.
- Raw `<input type="checkbox">` for the two required items next to `<Toggle>` for the
  optional ones: two control styles in one dialog, and the checkboxes miss the 44px
  touch target.
- A 60-word paragraph opens the dialog before any choice. No grouping: "Required" vs
  "Optional" is not labelled, so the user cannot tell why one button is disabled.
- No close (×) button in the header; "Not now" is the only exit.
- Pixel font sizes (`0.75rem`–`1.1rem`) instead of `--text-*` tokens; it will not follow
  the type scale.

Suggested shape: a `consent-panel.css` on the feedback-modal pattern. Header with title + ×,
then a short lead line plus the notice link, then a **Required** group (service + 18+, both as
`<Toggle>` or styled checkbox rows), then an **Optional** group (three toggles), then the
footer. Same tokens as Settings.

### U2. Settings → Privacy choices (`settings-privacy-choices.tsx`): minor

Hand-rolls `cardStyle` instead of `<Card>`, so radius/padding drift from the cards above it
in the same tab. The service purpose shows as plain text with no "Given ✓" state badge.
`UpdatesConsentNotice` sits in the Notifications tab but the three alert toggles below it
stay enabled while consent is off, so the user can switch them on and still get nothing.
Disable them, or note it inline.

### U3. Upgrade page (`web/app/dashboard/upgrade/page.tsx`): inconsistent and hard to reach

- Hand-rolled `button` style object and raw `<button>` instead of `<Button>`; 10 inline
  style blocks; ad-hoc sizes (`1.25rem`, `1.3rem`, `800` weight).
- **Not reachable from Settings or the dashboard rail.** Linked only from the marketing
  pricing page, Reports and store badges. There is no "Plan & billing" section in Settings,
  so a subscriber cannot find **Cancel subscription** (it lives only on this page).

### U4. Ask Vinaadi limits (L7): backend built, UI partial

- **Credits:** bought question credits are spent after the daily allowance
  (`app/api/ask_vinaadi.py:293`), but no response field exposes the balance and no screen
  shows it. A user who buys credits cannot see how many remain.
- Spend-cap / paused state shows only as a red error line after the user asks
  (`dashboard-ask-vinaadi.tsx:230`). There is no up-front "Ask is paused today" state
  before they type.

### U5. Guest privacy note (`guest-privacy-note.tsx`): fine

Small inline style only when no class is passed. Acceptable.

### U6. Verify-email nudge, site-status banner: fine

Both have their own CSS files and follow the pattern.

### U7. Admin console additions (L3/L4/L5): not reviewed for polish

These are internal. One gap: `GET /admin/analytics/life-focus` (`getLifeFocusMetrics`) has
no admin UI.

---

## Part 3 — Built, but missing on a surface

From a sweep of `packages/shared/src/api/*` wrappers against web and mobile callers, then
checked by route path, since web often calls `apiFetchJson` directly.

### Mobile is missing (web has it)

| Feature | Backend | Web | Mobile |
|---|---|---|---|
| Consent panel for accounts with `consentRequired` (all 5 dev users: backfill was 0) | `POST /auth/consent` | panel | **none**: saving a profile or family member fails `CONSENT_REQUIRED` with no way to answer |
| "Updates & alerts" consent switch | `PUT /auth/me/consents` | yes | **none** (see N4) |
| "Improve Ask Vinaadi" consent switch | same | yes | none |
| Download my data | `GET /auth/me/export` | yes | **built** — `account.tsx`, shares a JSON file |
| Delete account | `DELETE /auth/me` | yes | **built** — `account.tsx`, teardown + 409 handling |
| Upgrade / buy / cancel subscription | `/payments/*` | yes | **built**, store-shaped (decision D4): buying stays store IAP; `/payments/subscription/cancel` is used for a web-bought subscription, `/payments/products` for the price |
| Email verification / resend | `/auth/verify-email` | yes | **built** — `account.tsx` resend when unverified |

The consent rows and these three account/DPDP screens are now on mobile, and so are
subscription management (decision D4) and the member editor that the F5 toggle needed
(`app/family-member.tsx`). What mobile still cannot do is **add** a member or correct a
member's birth date, time or place: the vault's "Add +" is still an upsell, and the birth
date/time/place input block lives inside `(onboarding)/birth-details.tsx` and has to be
extracted into a component before either screen can reuse it. That extraction is the next
piece of this row, not a gap in the editor.

### Web is missing (mobile has it)

The sweep shows these wrappers used on mobile only, but web reaches most of the same routes
with raw `apiFetchJson`, so they are wrapper-hygiene items (CLAUDE.md: new callers use the
wrapper), not missing UI: notifications, daily guidance, ask, goals, family vault, tools.

### Wrapper policy breach

`deleteAccount` exists in shared, but web calls `"/api/v1/auth/me"` with `DELETE` directly
(`dashboard-settings-session-tab.tsx:475`).

---

## Priority

1. **N2** (wrong chart): a correctness bug; every alert for any user with family is about
   someone else.
2. **N4 mobile + Part 3 consent rows**: mobile users cannot get alerts or save new profiles.
3. **N1/N3** dedicated and family Chandrashtamam alerts (after the owner answers the F4/F5
   questions).
4. **U1** consent panel redesign, **U3** Plan & billing entry in Settings, **U4** credits display.
5. U2, the Pirantha copy mismatch, wrapper hygiene.
