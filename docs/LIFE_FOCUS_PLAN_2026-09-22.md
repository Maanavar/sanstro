# Life Focus — product plan (2026-09-22)

Owner-facing plan for the "What are you focused on right now?" feature:
what it should do, how a user changes it, and which surfaces respond to it.
Every surface below is named against real code as of `887aaeb`.

---

## 1. Where we are today

The picker promises *"We'll surface daily guidance around your choice. You can
change it anytime."* Neither half is true.

**Three separate "what matters to you" settings exist, and they don't talk to
each other:**

| Setting | Where the user sets it | Values | What actually reads it |
|---|---|---|---|
| **Life Mode** (`user_preferences.life_mode`) | First-run modal, `web/components/life-mode-picker.tsx` | 10: STUDY, CAREER, LOVE, MARRIAGE, FAMILY, WEALTH, HEALTH, SPIRITUALITY, REMEDIES, BALANCED | Only the 3 Ask Vinaadi quick-question chips (`web/lib/ask-vinaadi-chips.ts`). Backend saves it and never reads it. Passed to the Today tab but unused there. |
| **Goal track** (`users.goal_track`) | Settings → Preferences, `dashboard-settings-session-tab.tsx` (~L655) | 4: CAREER, EXAM, RELATIONSHIP, FINANCIAL | Daily guidance action line (`daily_guidance_service.py:891`), Ask Vinaadi LLM context (`ask_vinaadi_service.py:294`), journal prompts (`journal_service.py:485`) |
| **Active goals** (per chart) | Plan/Goals flow | 12 activity types | Daily guidance, and it outranks goal track (`daily_guidance_service.py:891`) |

The part that works (goal track) is buried in Settings with 4 options. The part
users actually see (Life Mode) has 10 options and does almost nothing.

**Other defects:**
- **No way to change it.** `LifeModeBadge` ("Change focus") exists at `life-mode-picker.tsx:142` but isn't mounted anywhere.
- **It nags.** "Skip for now" closes without saving, so `showLifeModePicker` stays `true` and the modal comes back on later dashboard loads (`dashboard-workspace.tsx:1008-1014`). It also comes back as a full modal every 30 days.
- **Mobile has none of it.**

---

## 2. Product decisions

### D1. One setting: "Your focus"
Life Mode becomes **the** focus preference. Goal track stops being something
the user sets. The server derives it from focus so existing backend readers
keep working (see §5, Phase 1). Active goals stay as they are: a goal is a
concrete plan ("job change by March"), a focus is a standing interest, and a
concrete goal keeps priority over a focus.

| Focus | → goal_track (derived) | → life-area code | → activity types it lifts |
|---|---|---|---|
| STUDY | EXAM | EDUCATION | education |
| CAREER | CAREER | CAREER | job_change, business_start |
| LOVE | RELATIONSHIP | RELATIONSHIPS | *(none, see open question Q4)* |
| MARRIAGE | RELATIONSHIP | RELATIONSHIPS | marriage |
| FAMILY | — | FAMILY_HARMONY | family_harmony, child_birth, property |
| WEALTH | FINANCIAL | MONEY | money, property, business_start |
| HEALTH | — | HEALTH | health |
| SPIRITUALITY | — | SPIRITUAL | spiritual |
| REMEDIES | — | — (cross-cutting) | — ; lifts remedy surfaces instead |
| BALANCED | — | — | — ; today's behaviour, nothing reordered |

This table belongs in **one** module (`app/core/life_mode.py`) and is exposed to
the client. Do not re-type it in each consumer (see memory: *Pure Function
Recomputed Per Consumer*).

### D2. Focus changes emphasis, never the astrology
A focus may **reorder, pin, highlight, pre-select and pre-word**. It must never
change a score, verdict, dosham, window or remedy eligibility. Two users with
the same chart and different focuses see the same numbers in a different order.

**Why:** if choosing "Career" moved the career score, the product would be
telling people what they want to hear. It would also break *Explanation Must
Match Its Own Numbers*. This rule gets a test (Phase 2 acceptance).

### D3. Changeable from anywhere, asked about rarely
- **Always-visible chip** in the Today tab header showing the current focus (e.g. "◆ Career"). Tapping it opens the picker. This is the existing `LifeModeBadge`, now mounted.
- **Settings → Preferences → "Your focus"** card replaces the Goal track card, with the same 10 options.
- **Mobile**: the same two entry points (Phase 3).
- **Skip means skip.** "Skip for now" saves BALANCED and sets `show_life_mode_picker = false`. It does not come back on the next load.
- **30-day re-ask becomes a soft inline nudge**, not a modal: a one-line strip on Today reading *"Still focused on Career?  [Yes, keep]  [Change]"*. "Keep" refreshes `life_mode_set_at`. The strip can be dismissed.
- Changing focus takes effect **immediately, with no reload**: the Today tab re-sorts in place.

### D4. Focus is per user, applied to the user's own chart
When the user is viewing a family member's chart, focus-driven ordering is off
and the neutral order is shown. A person's focus is about their own life, not
their spouse's. (Open question Q2 if the owner wants otherwise.)

### D5. Safety rails that already exist stay in force
Minors and marital-status blocks (`app/core/age_gate.py:get_blocked_life_modes`)
keep filtering the options. **New:** if a profile edit makes the saved focus
blocked, the server returns BALANCED instead of the blocked value.

---

## 3. Surface map: what each screen does with the focus

Legend: **P1–P3** = delivery phase (see §5). "Focus area" = the life-area code from D1.

### Today tab (`personal`, `dashboard-today-tab-nova.tsx`)

| # | Card | Behaviour with a focus set | BALANCED | Phase |
|---|---|---|---|---|
| T0 | Header | Focus chip (D3) plus the 30-day nudge strip | Chip reads "Balanced" | P0 |
| T1 | One-minute reading / hero line (`DashboardOneMinuteReading`) | One added sentence: *"For your career today: steady; best window 10:30–12:00."* Built from the focus area's existing life-area score and today's windows. No new calculation. | No extra line | P2 |
| T2 | Life areas row (`DashboardTodayLifeAreasDasaRowNova`, `dashboard-today-glance-nova.tsx:329`) | Focus area pinned first, with a small "Your focus" label. Other areas keep their order. | Unchanged | P2 |
| T3 | Activity board (`dashboard-today-activity-board-nova.tsx`) | The focus's activity types sort to the top. If today says nothing about them, show one row: *"Nothing specific for job moves today. Next good day: Thu 25."* The board already points cautions at a better day this month, so reuse that. | Unchanged | P2 |
| T4 | Quick links (`DashboardTodayQuickLinksNova`, `glance-nova.tsx:170`) | The focus-relevant link goes first (MARRIAGE → porutham, REMEDIES → remedies, STUDY/CAREER → life areas tab, and so on) | Unchanged | P2 |
| T5 | Remedy row (`DashboardTodayFamilyRemedyRowNova`, `glance-nova.tsx:836`) | Prefer a remedy tied to the focus area when one is eligible. REMEDIES focus: remedy row moves up, directly under the hero. | Unchanged | P2 |

### Other web tabs

| Tab | Behaviour | Phase |
|---|---|---|
| **Life areas** (`life-areas`) | Opens with the focus area expanded and scrolled into view | P2 |
| **Ask Vinaadi** (`qa` + widget) | Chips per focus (already done). The server also receives the focus as context instead of goal_track, so the *answers* lean too. | P1 |
| **Journal** (`journal`) | Prompt bias switches from goal_track to focus (`journal_service.py:485`) | P1 |
| **Plan** (`plan`) | New goal / muhurta flow opens with the focus's first activity type pre-selected. The user can still change it. | P3 |
| **Calendar** (`calendar`) | Optional filter chip *"Good days for Career"*, shading month cells using the existing activity-timing engine for the focus activities. Off by default. | P3 |
| **Settings** (`settings-session`) | "Your focus" card replaces "Goal track" (D3) | P0 |

### Backend and push

| Surface | Behaviour | Phase |
|---|---|---|
| Daily guidance (`daily_guidance_service.py`) | `_enrich_action_with_goal_track` is driven by focus (via the derived track, or directly by focus area). Active goals still outrank it (L891, unchanged). | P1 |
| Morning push (`daily_push_cron.py`) | The notification body adds the focus line, e.g. *"Career: best window 10:30–12:00"*. One line, active language only. **As built:** the line names the Today board's verdict on a focus activity instead of a window, because the title already carries the day's window (see §5 Phase 3). | P3 |

### Mobile

Focus chip plus the Settings card (D3), and the Ask chips. Today-tab
reordering follows only once mobile has an equivalent Today layout. (Phase 3)

---

## 4. Contract changes (four surfaces, per CLAUDE.md)

- `GET/PATCH /api/v1/settings/life-mode`: keep the path. Add `focusArea` (life-area code or null) and `focusActivities` (string[]) to the response so clients never re-derive the D1 table.
- `PATCH /settings/life-mode` also writes `users.goal_track` from the D1 map in the same transaction. `PATCH /auth/me` with `goalTrack` keeps working for old clients but is no longer sent by web.
- **New typed wrappers** in `packages/shared/src/api/`, `getLifeMode()` and `updateLifeMode(mode)`, checked against the route decorators (GET and PATCH, no path params). New web and mobile code uses these. The two existing direct `apiFetchJson` calls in `dashboard-workspace.tsx` / `life-mode-picker.tsx` are grandfathered, but since both files are touched anyway, moving them onto the wrapper is in scope.
- `packages/shared/src/types/index.ts` `LifeModeStatus`: add the two fields.
- No DB migration is needed. All columns already exist.

---

## 5. Delivery phases

### Phase 0: make it honest and changeable (small, ship first)
1. Mount `LifeModeBadge` in the Today header. Tapping it opens the picker.
2. Settings: replace the Goal track card with a "Your focus" card using the same `MODE_META`.
3. "Skip for now" persists BALANCED with `show_life_mode_picker=false`.
4. Replace the 30-day modal with the inline nudge strip.
5. Until P1/P2 land, change the picker subtitle to what is true: *"We'll tailor your quick questions and daily tips to this. Change it anytime from the chip on Today or in Settings."*

**Accept:** the user can change focus from Today and from Settings, in both
languages; Skip does not re-open the modal on reload; the 30-day case shows the
strip and not the modal. The e2e specs that dismiss the modal
(`nova-sweep`, `dashboard-render-pass`, `theme-contrast`, `field-a11y-probe`)
are updated.

**Status 2026-09-22: implemented and committed.** Verified in a browser on the
isolated stack (`ux-audit-stack.ps1`, `vinaadi_e2e`): 23/23 checks in EN and TA,
at 1440 and 375 px. Implementation notes:
- Skip closes immediately and saves BALANCED **in the background**. UXD-08
  (`3a353f9`) had made Skip a no-op because the old Skip *awaited* the PATCH, so a
  failed request trapped the user in an error loop. If the background save
  fails, the picker is simply offered again on a later load.
- The nudge cadence is server-computed (`focusNudgeDue` on the life-mode
  response, `is_focus_nudge_due` in `app/core/life_mode.py`), so mobile inherits
  it. A dismissal is stored in `localStorage` against the `lifeModeSetAt` it
  dismissed.
- D5 shipped early: a saved focus that a profile edit has since blocked reads
  back as BALANCED (`effective_life_mode`).
- **Gap until Phase 1 (closed by Phase 1):** with the Goal track card retired
  and no write-through yet, web could no longer set `users.goal_track`. The picker subtitle also promises "daily tips",
  and that is true only once Phase 1 lands.
- **What the probe cannot see:** it runs against one synthetic account with no
  family members, so D4 is untested (and moot until Phase 2 reorders anything).
  Mobile is untouched.

### Phase 1: one preference drives the backend
1. D1 table in `app/core/life_mode.py`. Focus → goal_track write-through.
2. Daily guidance, Ask Vinaadi context and journal read focus (or its derived track).
3. **Daily guidance cache:** it is currently *bypassed* whenever `goal_track` is set (`daily_guidance_service.py:1178`). If every user who picks a focus then bypasses the cache, the load goes up for most users. Key the cache by `(chart, date, focus)` instead of bypassing it. Load-check it before merge (memory: *A Cache Version Bump Is A Load Test*).
4. Shared wrappers and type fields (§4).

**Accept:** changing focus changes tomorrow's guidance action line for a
synthetic user. The cache hit rate for focus-set users stays within budget.
Old clients sending `goalTrack` still work.

**Status 2026-09-22: implemented and committed.**
Tests: `tests/test_life_focus_phase1.py`. Implementation notes:
- **D1 table** is `FOCUS_TABLE` in `app/core/life_mode.py`, the only copy. A test
  checks every code in it against `VALID_GOAL_TYPES`, the life-area labels and
  the `goalTrack` literal, so a typo cannot silently match nothing.
- **One resolver**, `app/services/life_focus_service.py`. Daily guidance, Ask
  Vinaadi and journal prompts all call it instead of reading `users.goal_track`:
  - a user who has chosen a focus gets the track derived from their *effective*
    focus, so D5 reaches the readers too (a focus a profile edit has since
    blocked drives no track, where a stale stored `RELATIONSHIP` would have);
  - a user who has **never** chosen a focus keeps their legacy `goal_track`;
  - **D4 is applied in Phase 1 as well**: a family member's chart gets no track.
    Ruling Q2 is about a person's focus, not only Today's ordering, and "career
    efforts" on a spouse's action line broke it. The relationship lives on
    `FamilyMember`, so a vault member marked `self` counts as the user.
- **Write-through:** `PATCH /settings/life-mode` also sets `users.goal_track`
  (clearing it for a focus with no track), so `/auth/me` stays in step for old
  clients. `PATCH /auth/me` with `goalTrack` is still accepted and stored, but
  once a focus exists the focus wins (Q6). No current client sends it: mobile
  never did, and web stopped in Phase 0.
- **Ask Vinaadi** gets `User's current life focus: FAMILY (life area FAMILY_HARMONY)`
  instead of the 4-value goal track, so FAMILY, HEALTH, SPIRITUALITY and
  REMEDIES now reach the model; they used to read "none set".
- **Cache, no migration and no version bump.** A cache row is per birth profile,
  and a profile has one owner, so it has one track at a time. Rows are
  tagged `_goalTrack` and a mismatch is a miss, which keys the cache by
  (profile, date, track). Untagged rows still match every user without a track,
  so no existing row is retired. The month-timing scan now writes under the
  same tag. Before this change it wrote track-free rows, which would have
  overwritten a focus user's rows and caused thrash.
- **Load check.** A track used to bypass the cache entirely (0% hits for those
  users). Now it costs one miss per profile per day and one more on each focus
  change. A test asserts the same focus is a hit and a new focus is exactly one
  rebuild. Each new gate (tag, D4, cache hit) was run once with its fix removed
  and failed.
- **What the tests cannot see:** the real goal-track hint only speaks on some
  days (dasha affinity or a caution label), so the action-line tests replace it
  with a marker. They prove the wiring, not the wording. Tomorrow's action line
  for a real chart changes only on such days. Journal D4 has no dedicated test.
  The resolver adds two small queries per guidance request (preference plus
  profile, or member). A range resolves once, not once per day.
- **Known edge:** a legacy user with a stored `goal_track` who has never
  chosen a focus loses the track if they press Skip, because Skip saves
  BALANCED. The dev DB has no such user (checked 2026-09-22).

### Phase 2: Today tab responds
T1–T5 and the Life areas tab behaviour from §3, driven by `focusArea` /
`focusActivities` from the API.

**Accept:**
- **Score-invariance test (D2):** for one synthetic chart, every life-area score, activity verdict and window is identical across all 10 focuses. Run it once with a deliberate focus-dependent score injected and confirm it fails.
- The pinned area and the added hero sentence render through the localisers (`ta` checked, not just `en`). No `…Name` field is rendered.
- Changing focus re-sorts Today without a reload.
- Viewing a family member's chart shows the neutral order (D4).

**What this gate cannot see:** `scripts/ux-audit-core.mjs` pins the audit
account to BALANCED and walks top-level panes only, so every focus-specific
state lives outside it. Check CAREER and REMEDIES by hand in both languages, at
375 px and 1440 px.

**Status 2026-09-22: implemented and committed.**
Implementation notes:
- **One reorder primitive.** `web/lib/life-focus.ts` holds `pinFirst` (a
  stable partition that returns the same objects it was given), `appliedFocus`
  (applies D4) and `focusQuickLinkId`. Every surface below reorders through
  them and reads `focusArea` / `focusActivities` from the server. The D1 table
  is not re-typed on the client.
- **T1** is a line under the hero briefing, not inside `DashboardOneMinuteReading`
  (that card collapses once read and fetches on its own). It reads *"Your focus,
  Career: Mixed period. Today's best window 4:31 pm – 5:01 pm."* The plan's
  example said "career **today**: steady", but a life-area score is a period
  outlook and its tiles say "not a daily score", so the line uses the tile's own
  period verdict and rounding. The two cannot disagree.
- **T2:** the focus tile is pinned *before* the cut to five, so an area ranked
  sixth still reaches the row. Labelled "Your focus".
- **T3:** one carousel ordered across the three tones, with focus rows first,
  each keeping its own tone and better-day link. When every focus activity is
  neutral, one line says *"Job moves: nothing specific today. Next good day: Thu 25."*
  That line is suppressed on a Chandrashtama day, where the neutral column is
  the engine's deliberate call and already explained. The carousel scrolls
  back to its start when the focus changes.
- **T4:** RELATIONSHIPS goes to Compatibility; every other area goes to "Best
  Days This Month". The plan's "REMEDIES → remedies, STUDY/CAREER → life areas"
  named links that do not exist in Quick Links, so the change reorders only.
  Confirmed as ruling Q8 (§6).
- **T5, partial.** The REMEDIES focus moves the remedy row directly under the
  hero. **Not built:** "prefer a remedy tied to the focus area". The server
  sends one remedy, anchored to the running dasa lord. Picking a different
  graha by focus is a selection change near D2's "never change remedy
  eligibility", and which graha serves a life area is a doctrine call for the
  astrologer, not a UI change. Ruled out as Q7 (§6).
- **Life areas tab:** the focus card is labelled and, when the tab opens on
  Overview, scrolled into view only if it is off screen. The scroll waits for
  the pane to be active (inactive panes are `display: none`).
- **Label collision fixed:** active *goals* were labelled "Your focus" in
  English (the Tamil always said இலக்கு, goal) on both the Life areas card pill
  and the goals card. They now read "Your goal(s)".
- **D4 on web:** a chart is the reader's own when no member is selected or the
  vault member's `relationshipToOwner` is `self`. Today has no member switcher
  (`setPersonalViewId` is never called), so D4 is reachable only on the Life
  areas tab.
- Picker subtitle and Settings copy now say Today puts the focus first.

**Gates:**
- `tests/test_life_focus_phase2.py`: the whole daily-guidance payload (minus
  `actionSuggestion`, the one field a focus may reword) and the whole
  life-areas list are identical across every focus the synthetic profile is
  offered. Run with a focus-dependent score injected, it fails (that run is
  kept as a test).
- `web/lib/life-focus.test.ts` (helpers, including same-object identity) and
  focus cases in `dashboard-today-activity-board-nova.test.tsx`. The lead-order
  case failed with pinning switched off.
- Browser probe on the isolated stack (`vinaadi_e2e`, synthetic account with a
  spouse member), CAREER → REMEDIES change in place, EN and TA at 1440 and
  375 px: **45/46**. Covered: hero line (no Latin in TA), pinned tile, first
  board card, first quick link, remedy-row position, change without reload,
  Life areas card present and in view, and no focus card on the spouse's chart.
- **The one failure is pre-existing:** at TA 375 px the page is 447 px wide
  under BALANCED too. The Today ribbon's week strip plus its
  "முழு பஞ்சாங்கம்" button overflows. Not caused by Phase 2; not fixed here.

**What the gates cannot see:** the "next good day" half of the T3 note has no
component test (it needs the timing batch mocked). The probe account's
CAREER activities happened to carry verdicts, so the quiet note was not seen
in a browser. There is no light-theme pass.

**Closed 2026-09-22 (after Phase 4): the T1 line's pending stand-in.** The
loaded line had no place held for it, so a focus reader's hero grew by one or
two lines on arrival. `HeroPendingFocusLine` now holds it when the reader has
a focus area, sized by `.nova-hero-skel--focus`. Measured on the isolated stack
(CAREER, EN and TA at 375/768/860/1024/1200/1440): en's line is 391px on one
line and wraps below 860; ta's is 612px and fits on one line only at 1440 with
the shortest verdict. Before: the stand-in was 18px against a 36px line at
375/768 (both languages) and ta 1024/1200. After: 11 of 12 points match; ta at
1440 over-reserves 18px when the verdict is "Mixed", chosen because a longer
verdict or area label wraps there. BALANCED readers get no stand-in. **Cannot
see:** the height depends on the words, so an unusually long area label or
window can still differ by one 18px line; one synthetic chart was measured.

### Phase 3: reach
Plan pre-select, Calendar filter chip, morning-push line, and mobile focus chip plus Settings card.

**Status 2026-09-22: implemented and committed (`0055d34`).**
Implementation notes:
- **One copy of the words.** The ten focus labels and descriptions, and the
  Ask chips, moved to `packages/shared/src/lifeFocus.ts` (`LIFE_MODE_TEXT`,
  `LIFE_MODE_ASK_CHIPS`). Web's `MODE_META` and `ask-vinaadi-chips.ts` now read
  them, and so does mobile, so the two surfaces cannot name a focus differently.
  The D1 table still lives only on the server.
- **Plan pre-select.** Goals' "add a goal" picker and the Calendar's quick
  date scan open on the focus's **first** activity, via `focusPreselect`. Only
  the first: FAMILY's second activity is `child_birth`, and opening a form on
  "Child birth" because someone chose Family presumes too much. If the first is
  not offered (FAMILY in the quick scan has no `family_harmony` row) or is already
  a goal, the old default stands. The reader's own choice is never overridden.
  The muhurta view follows its member picker (D4). Goals is always the reader's
  own chart. The detailed muhurta search is not pre-filled, since
  `ACTIVITY_TO_MUHURTA` sends some goal types to a placeholder activity.
- **Calendar chip.** "Good days: Career" in the month grid's filter bar, off by
  default, and left alone by Clear / Show all. When switched on, it asks
  `/activity-timing/batch` for the focus activities in the shown month, on the
  reader's own chart even if the muhurta view shows a relative. It marks the
  dates that rank in an activity's top five **and** read SUPPORTS. A
  top-ranked CAUTION day is the best of a bad set, so it is not marked. The mark
  is a crosshair shape in achromatic ink, because every tint on that grid
  already means an almanac category. Each marked cell says "Good day for
  Career" in its accessible name, and a status line explains what is marked,
  or says it is loading, failed or found nothing. Nothing is fetched until
  the chip is switched on. LOVE, REMEDIES and BALANCED have no activities, so
  they get no chip.
- **Morning push.** One line from the day's activity board, which the push
  already fetched with the guidance. So there is no new calculation, and it
  says what the Today board says: *"Your focus, Career. Job moves: supported
  today."* or *"… go carefully today."* The first favoured focus activity is
  named, else the first cautioned one, else there is no line (a neutral or
  Chandrashtama day). The line never names a window: the title already carries
  the day's Nalla Neram, and a second window could contradict it. D4 applies.
  A failure in the line is logged and the push still goes out. Tamil is new,
  pending native review.
- **Mobile.** A "Focus Career" chip in the Today header and a "Your focus" row
  on Me, both opening one picker that hides blocked focuses. The Ask chips now
  follow the focus. There is no first-run modal and no 60-day strip, and Today
  does not reorder: the plan waits for an equivalent Today layout.
  `mobile/src/api/lifeMode.ts` re-exports the shared wrappers, which the mobile
  contract test now checks against the route (GET/PATCH, body `{ mode }`).

**Gates:**
- `tests/test_life_focus_phase3.py` (13): which verdict the line names, focus
  order over board order, favoured over cautioned, no line when silent, no line
  for a focus without activities, D4, the line reaching the dispatched body, and
  the push surviving a failing line. The D4 case failed with its check removed.
- `web/lib/life-focus.test.ts`: `focusPreselect` (never falls through) and
  `supportiveFocusDates` (SUPPORTS only). Both failed with their fix removed.
- `web/components/dashboard-calendar-focus-days.test.tsx` (7): chip off by
  default, exact cells marked, loading/failure/empty lines, Clear leaves it
  alone, Tamil names. Failed with marking switched off.
- Full web suite 958/958, backend focus + push suites 55/55, web/mobile/shared
  `tsc` clean, `ruff` and `eslint` clean on changed files.

**What the gates cannot see:** there has been no browser pass and no device
run. The chip, the pre-selects and every mobile screen are checked only by
tests and typecheck, in either language and at any width. The push line is
tested with a synthetic board, not a real chart's day. The chip's real dates
depend on the engine and were not eyeballed against the Best Days list for the
same month. (`scripts/audit-color-literals.mjs` had been red since `af20604`
for an unrelated literal; fixed right after this phase in `7eff4e9`.)

### Phase 4: measure and tune
Measure these with whatever event logging exists (if none, a server-side count
on `PATCH /settings/life-mode` covers the first three):
- share of users with a non-BALANCED focus
- Skip rate on first run
- focus changes per active user per month (healthy: low but non-zero)
- Ask chip taps per focus, and T3 focus-row taps

If a focus is almost never picked, merge it (LOVE/MARRIAGE are the likely pair).

**Status 2026-09-22: implemented and committed.** Measurement is now in
place; tuning waits for a real sample rather than guessing from synthetic data.
Implementation notes:
- **Existing logging audit.** There was no server-side product-event store.
  `user_life_events` is the reader's domain data, `prediction_log` is outcome
  calibration, `ask_vinaadi_usage` is only a per-day quota count, and the admin
  analytics routes aggregate existing tables. Web and mobile already send
  explicit PostHog events; mobile's transport is opt-in, allowlisted and
  fail-closed, while web no-ops without a key and honours Do Not Track.
- **One atomic signal, not a second endpoint.** `PATCH /settings/life-mode`
  accepts optional `intent: SELECT | SKIP | KEEP` (default `SELECT`) and
  `surface: FIRST_RUN_PICKER | WEB | MOBILE` (default null), both for old
  clients. The shared wrapper makes both **required**, so no new caller can
  omit them. SKIP is valid only for BALANCED, on first run, from
  `FIRST_RUN_PICKER`. KEEP must repeat the focus the reader was shown (the
  D5-effective mode), so it can never change focus uncounted. The state write
  and its event commit or roll back together, and the server decides whether
  the interaction was truly first-run. This distinguishes Skip from choosing
  Balanced without trusting a separate best-effort browser event.
- **Minimal server record.** `life_focus_events` stores only opaque user id,
  intent, previous/new mode, the first-run bit, entry-point surface and
  timestamp, with CHECK constraints on both enums. No birth, chart, profile,
  rendered label, or question data. Its user FK cascades on account deletion.
  Migration `qq0a1b2c3d4e` is reversible.
- **The first three measures are admin-only.** `GET
  /api/v1/admin/analytics/life-focus?month=YYYY-MM`, over live non-admin
  accounts only (soft-deleted users and preferences, and staff, are excluded
  from every numerator and denominator):
  - adoption: a snapshot of saved preferences, stamped `adoption_as_of`, not
    scoped to `month`. Missing preferences count as BALANCED.
  - Skip rate: `first_run_skips / first_run_picker_decisions`. The base is
    first writes from the first-run picker only. A mobile reader's first
    choice (`MOBILE`) is in `first_run_decisions` but not in the base, because
    mobile has no first-run modal and could never have skipped.
  - change rate: post-onboarding SELECT transitions per
    `focus_returning_users`, the distinct readers with a non-first-run write
    that month. A reader whose only write was their first choice is not in the
    base, since they cannot have changed yet.

  A typed shared wrapper mirrors the route; normal users receive 403.
- **Tap measures stay consent-aware client analytics.** Both Ask surfaces emit
  `life_focus_ask_chip_tapped` with only `focus`, `surface` and `chip_index`.
  The Family rail's embedded Ask reports `surface: web_family`. It passes no
  life mode, so its chips are the BALANCED set, and without its own surface
  those taps would inflate the BALANCED bucket of the reader's own Ask. Web T3
  focus cards emit `life_focus_row_tapped` with `focus`, `surface`, the
  language-free activity key and `target: card | better_date`. It fires on
  `click` (not `pointerup`), so secondary buttons and scroll-drags do not
  count, and the nested calendar link is named instead of double-counted. No
  question or rendered text is sent. Mobile has no T3 activity row yet, so that
  event is web-only by design.
- **Silent first-run dismissals.** Escape or the backdrop closes the first-run
  picker without saving (it returns on a later load), so the server cannot see
  it. The picker emits `life_focus_first_run_dismissed` for it. Read it beside
  the server Skip count: together they are "did not choose".

**Gates:**
- `tests/test_life_focus_phase4.py` (15): Skip versus chose-Balanced, old
  client without intent/surface, SKIP rejected after onboarding, with a
  non-BALANCED mode, and from WEB/MOBILE/null; KEEP rejected on a different
  mode; real changes versus first choice/Keep; mobile first choice kept out of
  the Skip base; first choice alone kept out of the change base; deleted and
  admin accounts excluded; invalid month; the admin boundary. With the route
  and metrics code reverted (model kept, so the failures are the logic's and
  not a missing column), 9 fail; the 6 that pass cover behaviour that was
  already right but untested.
- Shared/mobile contract and analytics tests (27, including a rendered mobile
  Ask screen): the PATCH body carries intent and surface, the new event is
  dropped before consent, and after consent only its allowlisted
  aggregate-safe properties pass.
- Web picker/Ask/activity tests (21): the picker's three surfaces, the
  first-run dismissal (tracked, nothing saved) and its non-first-run negative;
  the Family Ask surface; card versus better-date targets and the non-focus
  negative. All 7 positive gates failed with the component changes reverted.
- Test-DB migration cycle: clean `vinaadi_test` -> upgrade to
  `qq0a1b2c3d4e` (8 columns incl. `surface`) -> downgrade to `pp9f0a1b2c3d`
  (absent) -> upgrade again; an out-of-enum `surface` insert is rejected by the
  CHECK constraint. Backend focus/settings/admin regression 93/93; full web
  suite 968/968; mobile 27/27 focused; shared/web/mobile `tsc`, changed-file
  `ruff` and ESLint clean.

**What the gates cannot see:** there is no production PostHog delivery or
dashboard check (test/dev have no key, and mobile remains off without opt-in),
so event arrival and the eventual per-focus breakdown still need production
observation. The dismissal event sits in PostHog and the Skip count on the
server, so "did not choose" has to be joined by hand, and web PostHog honours
Do Not Track, so dismissals are undercounted by that share. A Skip sent from a
closing tab can still be lost (it is fire-and-forget by design, UXD-08).
Server history starts at this migration; it does not reconstruct old
first-run choices or changes. Test accounts without `is_admin` are still in
the population; there is no flag to exclude them by. The adoption count reads
the saved preference, so a focus that D5 currently masks as BALANCED after a
profile edit still counts as the user's non-BALANCED choice. A T3 card tap has
no action of its own: `target: card` measures curiosity, not use, and a
keyboard user focusing a card without pressing its link records nothing. No
browser or device pass was run because this phase changes no visible UI.

### Where the plan stands (2026-09-22)
Phases 0–4 are built, committed and pushed on `harden/production-readiness`.
Nothing in §3–§5 is left unbuilt except what an owner ruling took out (T5's
focus-tied remedy, Q7; extra Quick Links, Q8). What remains is not code:
- **Tuning (Phase 4, second half):** merge a focus that is almost never picked
  (LOVE/MARRIAGE likeliest). Needs a production sample from
  `/admin/analytics/life-focus`; there is none yet.
- **Unverified in a browser:** Phase 3's Calendar chip and Plan pre-selects,
  and every mobile screen on a device. Tests and typecheck only.
- **Mobile Today reordering** waits for an equivalent Today layout (§3).
- **Not this plan's:** the TA 375 px ribbon overflow (Phase 2) is pre-existing.

---

## 6. Open questions for the owner

**Owner rulings 2026-09-22:** Q2 **No** (neutral order on family charts), Q3
**60 days, inline strip**, Q6 **retire it**. Q1, Q4 and Q5 were not asked
separately; their recommendations are in force unless the owner says otherwise.

| # | Question | Recommendation |
|---|---|---|
| Q1 | One focus, or a primary plus an optional secondary? | **One.** Ordering is only meaningful with a single first item. Revisit after Phase 4 data. |
| Q2 | Should focus apply when viewing a family member's chart? | **No** (D4). **Ruled: No.** |
| Q3 | Re-ask cadence: 30 days, 90 days, or never? | **60 days, as the inline strip.** 30 days is too often for a standing interest. **Ruled: 60 days** (`LIFE_MODE_STALE_DAYS`). |
| Q4 | LOVE has no matching activity type. Add one ("difficult conversation / proposal") or leave the activity board unchanged for LOVE? | Leave it unchanged for now. Adding an activity type is a doctrine question for the astrologer, not a UI one. |
| Q5 | Is REMEDIES a focus or a feature? | Keep it as a focus: it is how a user says "I want to *do* something about my chart". |
| Q6 | Retire the Goal track UI completely, or keep it hidden for power users? | **Retire it.** Two settings for one idea is what caused this mess. **Ruled: retire.** |
| Q7 | Should the Today remedy switch to a planet tied to the focus area (e.g. Guru for Study, Sukran for Marriage)? | **Ruled 2026-09-22: No.** The remedy stays anchored to the running dasa lord. In Thirukanitham practice the dasa lord governs what fructifies now, so its parihara comes first whatever the reader wants to hear. Choosing the planet by focus is the same flattery D2 forbids for scores. Reopen only if the astrologer supplies a bhava-karaka parihara table and rules on when it outranks the dasa lord. |
| Q8 | Add Remedies / Life Areas tiles to Quick Links for REMEDIES / STUDY / CAREER? | **Ruled 2026-09-22: No; reorder only.** Both would repeat something already on screen for that reader: REMEDIES already moves the remedy row under the hero (T5), and the Life areas row already pins the focus tile with its "All areas" link (T2). Quick Links stays a curated eight. Relationships leads with Compatibility (porutham); every other focus leads with Best Days This Month. |

---

## 7. Out of scope
- Any change to scoring, doctrine or remedy eligibility (D2).
- New life-area codes or activity types (Q4).
- Rewriting the existing grandfathered direct-fetch call sites elsewhere in `web/`.
