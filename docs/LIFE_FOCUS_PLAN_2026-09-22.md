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
| T4 | Quick links (`DashboardTodayQuickLinksNova`, `glance-nova.tsx:170`) | The focus-relevant link goes first (MARRIAGE → porutham, REMEDIES → remedies, STUDY/CAREER → life areas tab,mily  and so on) | Unchanged | P2 |
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
| Morning push (`daily_push_cron.py`) | The notification body adds the focus line, e.g. *"Career: best window 10:30–12:00"*. One line, active language only. | P3 |

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
- **Gap until Phase 1:** with the Goal track card retired and no write-through
  yet, web can no longer set `users.goal_track`. Existing values stay in force.
  Phase 1 item 1 closes this. The picker subtitle also promises "daily tips",
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

### Phase 3: reach
Plan pre-select, Calendar filter chip, morning-push line, and mobile focus chip plus Settings card.

### Phase 4: measure and tune
Measure these with whatever event logging exists (if none, a server-side count
on `PATCH /settings/life-mode` covers the first three):
- share of users with a non-BALANCED focus
- Skip rate on first run
- focus changes per active user per month (healthy: low but non-zero)
- Ask chip taps per focus, and T3 focus-row taps

If a focus is almost never picked, merge it (LOVE/MARRIAGE are the likely pair).

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

---

## 7. Out of scope
- Any change to scoring, doctrine or remedy eligibility (D2).
- New life-area codes or activity types (Q4).
- Rewriting the existing grandfathered direct-fetch call sites elsewhere in `web/`.
