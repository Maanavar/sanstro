# Handoff — muhurta, what is left after D1/D2/D3

**Written 2026-08-16.** Paste this whole file to a fresh coding agent. It is
self-contained. Every claim was verified against the tree at
`a2d9ba7` on branch `harden/production-readiness`; **re-check any line number
before you edit at it.**

Supersedes the "what's next" half of
`docs/HANDOFF_MUHURTA_SCORE_SCALE_AND_NEXT_2026-08-15.md` (its Task 1 and Task 2
are done; its Task 3, Tamil review, is still open and is reproduced here as T9).

The plan of record is `docs/MUHURTA_MASTER_REMEDIATION_2026-08-14.md`. **Its §8
phase table is stale** — more of it has shipped than the table says. §1 below is
the corrected state.

---

## 0. Environment — read before running anything

- Repo root, exactly: `D:\sanstro`. Never guess it.
- **Use PowerShell.** Chain with `;`, never `&&` (PS 5.1 has no `&&`).
- No `head` — use `Select-Object -First N`.
- Never put `2>&1` on a native exe (npm/npx/python). PS 5.1 wraps stderr in
  ErrorRecords and a success looks like a failure.
- `$env:PYTHONUTF8 = "1"` before any Python that touches Tamil text.
- **Never round-trip a source file through `Get-Content`/`Set-Content`** — it
  adds a BOM and mojibakes non-ASCII. Use the Edit/Write tools only.
- **Do not use a PowerShell here-string to pipe Python into `python -c`.** It
  mangles quotes. Write a scratch `.py` file outside the repo and run that.
- Test DB is port **5433** / `vinaadi_test`. `vinaadi_dev` on 5432 is real data —
  never point tests at it, never `drop_all` it.

### Baselines to beat (measured 2026-08-16, at `a2d9ba7`)

```powershell
Set-Location 'D:\sanstro'
$env:PYTHONUTF8 = "1"
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
python -m pytest tests -q --no-header --no-cov
#   => 2831 passed, 13 skipped   (~31 min; run it in the background)
```

The 13 skips are pre-existing: 12 WI-07 sunrise-validation cases with no printed
reference on file, and one schema-shape skip in
`test_api_wrapper_field_contract.py`. They are not yours.

`ruff check app/ tests/` repo-wide reports a large pre-existing baseline. **Only
assert on files you touch.** Never run a blanket `ruff --fix` — it strips
`daily_guidance` re-exports.

`cd web; npx tsc --noEmit` reports exactly one pre-existing error in
`.next/types/app/(marketing)/muhurtham-naal/page.ts`. Confirm it is still the
only one; do not fix it here.

### State of the tree

**Working tree is clean. Everything described in §1 is committed.** Do not
`git reset`, `git checkout --` or `git stash` anything without asking.

---

## 1. Corrected state of the plan

| Plan item | Real state |
|---|---|
| A1 shared Tara/Chandra Bala | **DONE** — `app/calculations/tara_bala.py` (`tara_number`, `chandra_bala`) |
| A2 durmuhurtham | **DONE 2026-08-17.** `app/data/durmuhurtham_rules.py` stores owner-authorized weekday daylight-grid indices; `panchangam.py` derives local intervals from actual sunrise/sunset and the picker excludes them. |
| A3 full-day lagna schedule | **DONE.** A cached daylight schedule is calculated only for the five shortlisted days; the sourced lagna-sign factor uses the selected window's actual lagna. |
| A4 per-activity preference tables | **SUBSTANTIALLY DONE** — `app/data/muhurta_activity_registry.py` + 7 `kalaprakasika_*_rules.py` modules, **30 sourced activities**, page-cited. Not from the astrologer; extracted from the primary text |
| A5 karaka transit dignity | **PARTIALLY DONE.** The shared combustion check now gates the owner-approved 2nd/11th wealth heuristic at the selected-window midpoint. A separate, sourced karaka transit penalty remains out of scope until its doctrine/copy are approved. |
| B1 engine | **DONE** — `app/calculations/muhurta_engine.py`, `Subject \| None`, `FactorResult[]`, `DayScore` |
| B2 port the picker | **DONE** — `muhurta_service.py` calls `score_day`; D1/D2 fixed inside it |
| B3 delete `_score_public_muhurta` | **DONE** — `/public/muhurta` calls `score_day(subject=None)`; the name survives only in comments explaining why it died |
| B4 nakshatra + tara in `assess_activity_timing`, re-weight D4 | **DONE.** Optional Janma Nakshatra adds named Tara Bala scoring; the chart-derived day score is primary and general almanac alignment is only a tiebreaker. |
| B5 fix D3 | **DONE.** The month ranking now receives the actual chart-derived daily score; no candidate window is fabricated. |
| C1/C2 activity location, optional `chartId` | **DONE.** Personal route accepts optional `lat`/`lon`/`tz` and preserves chart ownership; general mode requires an explicit location. |
| C4 ownership checks | **DONE** — `assert_chart_owner` is on `/charts/{id}/muhurta` (this was a live IDOR; it is closed) |
| D1–D5 UI (three-band result, family members) | **WEB DONE; MOBILE PARTIAL.** The web calendar/picker carries the selected family member. Mobile uses 12-hour window display and the added sourced activities; a signed-in device/browser pass remains. |
| Defect D1 (hora vs clock) | **FIXED** — see §1.1 |
| Defect D2 (first match) | **FIXED**, daytime scope deliberately kept — see T7 |
| Defect D3 (fabricated window) | **FIXED** — see §1.1 |
| Defect D4 (almanac drowns personalisation) | **FIXED** — chart score is primary, general alignment tiebreaks. |
| Defect D5 (static naal times) | **FIXED for chart-matched Naal.** It resolves the effective daily location and calculates real Nalla Neram; public listing retains the labelled customary table. |

### 1.1 What landed on 2026-08-16 — do not redo it

`app/services/muhurta_service.py` — `_score_hora` and the old `_best_time_window`
are gone. One `_best_time_window(snapshot, activity, lagna_rasi) -> _Window`
returns the window **and** the hora credit together. The window is the
intersection of a favoured hora ∩ a good Gowri **DAY** kala ∩ clear of Rahu
Kalam / Yamagandam / Kuligai, ranked over every hora×kala pair (lagna-lord →
`gowri_category_rank` → earliest), with `_MIN_WINDOW = 15 min`.

Two live consequences already accepted by the owner: the hora bonus is earned
only by a **usable** window (a favoured hora spent entirely inside Rahu Kalam no
longer lifts a day's score), and windows are now 30–60 min intersections rather
than whole ~95 min kalas.

`app/services/decisions_service.py` — `_optimal_window` takes a `(date, lord)`
from `_next_dasha_shift`, which reads the chart's own Vimshottari timeline and
returns the **antardasha** end plus the incoming lord. Antardasha, not
pratyantardasha, because `whatif_service`'s dasha pillar reads maha + antar and
nothing finer; naming a boundary that changes none of the brief's own inputs
would be a quieter fabrication. When the timeline cannot be built it names **no
date**.

Tests: `tests/test_muhurta_hora_window.py` (7, `no_db`, 60-day × 4-activity
sweep) and `tests/test_decisions_optimal_window.py` (7, `no_db`), plus 2 in
`tests/test_decisions_api.py`.

---

## 2. The tasks

Do them in this order. T1–T4 are unblocked and self-contained. T5–T6 are
unblocked but larger. T7–T9 need the owner.

---

### T1 — D4: the almanac drowns the personal layer

**Where:** `app/services/daily_guidance_service.py:1371` and `:1448`.

```python
alignment_rank = {"SUPPORTS": 2, "NEUTRAL": 1, "CAUTION": 0}
...
rank = alignment_rank.get(result.combined_alignment, 0) * 100 + score
```

`result.combined_alignment` comes from `assess_activity_timing` and is
**general** — tithi, paksha, weekday, nakshatra. `score` is
`daily_response.data.score`, which **is** chart-derived, 0–100. Multiplying the
general term by 100 makes it lexicographic: the chart can only reorder days
*within* an alignment bucket. A day the chart loves can never outrank a day the
chart is lukewarm about if the almanac graded them one bucket apart.

**Done means:** the two terms are commensurate, the chosen weighting is stated
in a comment with its reasoning, and a personal signal can cross a bucket
boundary when it is strong enough.

**Constraint — this is a weighting decision, and the repo's standing rule is
that weights come from doctrine, not from fitting a result you already like.**
Do not silently pick 0.6/0.4. Either derive it (e.g. map alignment to a bounded
additive term on the same 0–100 scale and justify the magnitude from how
`assess_activity_timing` grades) or implement it behind a flag and put the
number in front of the owner. Say which you did.

**Acceptance test (must fail on current code):** construct or find two days where
the almanac alignment ordering and the personal score ordering disagree, and
assert the combined ranking is not simply the alignment ordering. A sweep-based
test is stronger than a hand-built pair — over a 90-day range, assert that
`rank` order differs from `alignment_rank` order for at least one activity.

**Watch for:** `results.sort(key=lambda x: x[0], reverse=True)` at `:1465` then
`[:5]`. Changing `rank` changes which five dates the month view shows. Print the
before/after top-5 for at least three activities and paste both.

---

### T2 — D5: muhurtham-naal times are a fixed clock table

**Where:** `app/services/muhurtham_naal_service.py:142` `_nalla_neram_windows`,
reading `NALLA_NERAM_SUMMARY_TABLE` (`app/calculations/panchangam.py:518`).

The date ranking around it **is** personalised (Tara Bala + Chandrashtama, via
`match_muhurtham_naals` at `:238`), so one response mixes a chart-aware ranking
with a location-free, date-free clock table.

**Read `panchangam.py:511-517` before touching this.** The table is retained
deliberately: the naal listing is location-agnostic and shows no kalams beside
the windows, so there is nothing for a drifted window to collide with. An
earlier version of this table *did* drift into Kuligai and was retired from the
daily panchangam for exactly that reason (v35).

**So the fix is not "compute it" — it is "decide whether this surface has
coordinates."** Two honest options:

1. `match_muhurtham_naals` already takes a `chart_id` and a `session`, so it can
   resolve `resolve_effective_daily_location(bp)` exactly as `muhurta_service`
   does at `:298`. Compute real Nalla Neram per date via
   `calculate_daily_panchangam_range` and drop the table for this path. The
   unauthenticated `list_muhurtham_naals` path keeps the table.
2. Keep the table and **label it** — the response says these are the customary
   weekday windows, not computed for the date, so the mixed response stops
   reading as one uniform claim.

Option 1 is the better product and the bigger change (a year of naals is a year
of panchangam days — check the cache path and measure). **Recommend one, do not
do both.** If you take option 1, the perf budget in §9.5 of the master doc
applies.

**Contract:** `TimeWindow` is in the response. Any field change touches
`app/schemas/muhurtham_naal.py`, `packages/shared/src/api/`, `mobile/`, `web/` —
grep all four in the same change.

---

### T3 — Tara Bala into the month ranker (B4's other half)

**Where:** `app/calculations/activity_timing_rules.py:694` `assess_activity_timing`.

```python
def assess_activity_timing(
    activity: ActivityType,
    tithi_number: int,
    paksha: str,
    weekday_lord: str,
    nakshatra_number: int | None = None,
) -> ActivityTimingResult:
```

There is no subject, so this ranker — which drives the "top 5 dates" month view,
the Today activity board (`daily_activity_board:637`), and goals
(`_dg_goals.py:126`) — is impersonal on the day-selection axis. `tara_number()`
has been extracted and is available at `app/calculations/tara_bala.py`.

**Important: this is NOT the same scorer as `muhurta_engine.score_day`, and they
are not duplicates.** They use disjoint vocabularies —
`activity_timing_rules.ActivityType` is twelve lowercase *life scenarios*
(`job_change`, `money`, `marriage`, `child_birth`, …) while the engine's 30 are
uppercase *rites and purchases* (`MARRIAGE`, `GOLD`, `TONSURE`, …). They answer
different questions. Do not "consolidate" them into one — that would be a
product change, not a refactor. Only `marriage`/`MARRIAGE` overlaps, and that
overlap is worth flagging to the owner, not silently resolving.

**Done means:** an optional `janma_nakshatra: int | None = None` parameter;
when supplied, a tara signal joins the result and is named in the reason copy;
when omitted, behaviour is **byte-identical** to today.

**Blocked on §11 Q4 for the weight** — the astrologer has not said whether
Vadha/Vipat/Pratyak is a hard veto or a large penalty. Two ways forward, pick
one and say so:

- Ship the tara as a **named, non-scoring factor** (it appears in the reason and
  in `factors[]`, contributes 0) so the plumbing and the UI land now and only a
  constant changes when the answer arrives. This is the safer option.
- Ship it behind a default-off flag with a provisional weight recorded as
  provisional.

**Do not** invent a weight and let it silently change rankings.

**Acceptance test:** two synthetic subjects with different birth stars, same
date range, same activity → different day ordering, and every difference
attributable to a named tara value. Use synthetic identities only.

---

### T4 — A5: the wealth karakas are never checked

Master doc §3.6. For `GOLD`, `GEMS`, `TREASURE_STORE`, `LAND_PURCHASE`,
`NEW_ORNAMENT` and the other acquisition activities, Jupiter and Venus are the
significators, and their **transit condition on the candidate day** —
combustion, retrogression, debilitation, inimical sign — should weaken the day
even when the almanac reads well. `grep -n "combust" app/calculations/muhurta_engine.py`
returns nothing.

`_ACTIVITY_LORDS` in `muhurta_service.py` treats Jupiter and Venus as *dasha*
lords only. That is a different thing and is not this.

**Reuse, do not reinvent:** `app/calculations/functional_nature.py` and
`chart_strength.py` already grade dignity. Find the existing combustion check
before writing one — `grep -rn "combust" app/calculations/`.

**Done means:** a new `FactorResult` in `muhurta_engine`, gated to the
acquisition activities, that lowers the score with the condition named
("Venus combust — the karaka of valuables is weak on this day"), and the
master doc's §9.1 acceptance test passes: a day on which Venus is combust scores
lower for a purchase than the same almanac day with Venus direct and dignified.

**Constraints:** the engine's severity rule is read off the source's verb, never
chosen for convenience — see the `muhurta_activity_registry.py` docstring. This
factor is **not** page-cited from Kalaprakasika, so it must not claim to be.
Look at how `_unsourced(...)` marks provenance and follow it. New Tamil copy is
**pending review** — add it to the T9 list.

---

### T5 — C1/C2: the activity happens where the user is, not where they were born

Master doc §3.1, and it is the highest-impact unfixed factor.

`muhurta_service.py:409` uses `resolve_effective_daily_location(bp)` — the
**birth profile's** location. The route at `app/api/muhurta.py:25` has no
location parameter.
A Chennai-born user buying gold in Coimbatore gets Chennai's sunrise, and
therefore Chennai's Gowri grid, kalams, horas and Nalla Neram — every derived
window is offset by ~20 minutes.

**Done means:**

- `GET /charts/{chart_id}/muhurta` accepts optional `lat`/`lon`/`tz`, defaulting
  to the chart's daily location. Prefer query params over path segments.
- `chartId` becomes optional so general mode is reachable on the same route
  (`score_day(subject=None)` already supports it — `/public/muhurta` proves the
  path works).
- `assert_chart_owner` stays on **every** path where a `chartId` is supplied. A
  personal muhurta discloses birth-star information. This route has already had
  one IDOR; do not reopen it.
- The response echoes the activity location back (master doc §6.4).

**Contract work is mandatory and is the part that historically breaks:** a typed
wrapper in `packages/shared/src/api/`, and **re-read the FastAPI route decorator
before wiring it** — two wrappers have silently drifted (`getDailyGuidance` used
a query param where the backend wanted a path param; `registerFcmToken` sent
PATCH where the backend only accepts PUT). Grep `app/api/`,
`packages/shared/src/api/`, `mobile/`, `web/` in the same change.

**Acceptance test:** same date, same chart, Chennai vs Coimbatore → sunrise
differs and at least one Gowri/kalam boundary shifts accordingly.

**Cache trap:** the activity location must enter the panchangam cache key, or a
stale key silently serves another city's answer. `calculate_daily_panchangam_range`
already keys on lat/lon — verify, do not assume.

---

### T6 — A3 + L5: there is no lagna schedule, so two good windows cannot be separated

Master doc §3.9. `panchangam.py` computes the rising sign **once, at sunrise**
(`lagna_ends_at` at `:1860`, into the snapshot at `:1955`). Nothing can answer
"what is rising at 10:42?", so the difference
between "Best 10:42–11:27" and "Second choice 1:18–1:56" currently has no
mechanism behind it.

**The performance budget is non-negotiable and is written in master doc §9.5.**
`_find_lagna_rasi_boundary_jd` (`panchangam.py:1350`) steps hourly then bisects
48 times ≈ **50 ephemeris calls per boundary**, so a full-day schedule is ~600
calls per day. Over the picker's 60-day maximum that is ~36,000 calls against a
pipeline previously tuned from 2.28s to 0.251s per day.

**Therefore L5 is two-stage:** rank all days on L1–L4 (cheap), then compute the
lagna schedule **only for the top 5 days**. Budgets: 60-day personal request p95
≤ 1.5s; lagna schedule ≤ 120ms per day when computed; L5 runs on ≤ 5 days per
request. **Measure before and after and paste both numbers** — this repo's
history is that perf regressions hide easily.

Cache the schedule with the panchangam snapshot, and bump
`PANCHANGAM_CACHE_DATA_VERSION` (currently **39**) when the persisted shape
changes.

---

### T7 — Evening windows: a doctrine question, not a bug

The picker's window is deliberately daytime-only. `_best_time_window` scans all
24 horas but the candidate kalas are `period == "DAY"`, so a night hora can
never win.

**Do not "fix" this by adding NIGHT kalas to the candidate set.** Ranking a
night window has already walked this repo into the small hours once: v38 ranked
both halves of Gowri Nalla Neram for symmetry, and because Amirtham advances one
slot per weekday the announced night window landed at 04:33 Fri, 03:06 Sat,
01:40 Sun and past 22:47 Mon/Tue — 5 of 7 weekdays outside any hour a reader
would act on. v39 reverted the night half to earliest-clear-good. Read
`_compute_gowri_nalla_neram`'s docstring in full before proposing anything here.

**Ask the owner, do not decide:** which activities admit an evening muhurta at
all, and what the latest defensible hour is. Then implement to the answer.

---

### T8 — Phase D: the family gap

Every dashboard timing component receives `personal.chartId` — the account
owner's own chart. **Family-vault members are unreachable**, so a user cannot
ask a timing question about their spouse or child.

The plumbing already exists and must be reused, not reinvented:
`web/components/dashboard-workspace.tsx:686-687` resolves
`lifeAreasViewId → member?.chart.chartId ?? personal.chartId` for the Life Areas
tab, and `web/components/dashboard-plan-muhurtham-naal-nova.tsx` already takes
`chartId: string | null` (`:145`) and branches on it throughout (`:163`, `:204`,
`:232`, `:240`) — general mode when null. Copy those two patterns; do not invent
a third.

Depends on T5 (the route must accept an optional `chartId` first).

Surfaces to mount on: muhurta picker, plan muhurta panel, activity-timing card,
today glance best-hours, today activity board, calendar tab, mobile today.

**Honesty rule, and it is a gate:** a general-mode result must never contain a
second-person personalisation claim. A general answer that reads as personal is
worse than no answer, because the user acts on it believing their chart was
consulted. Assert it in a test.

---

### T9 — Needs the owner, not an agent

**9a. Tamil review — approved 2026-08-16.** The owner approved all 63 pending
Tamil strings/templates listed in chat on 2026-08-16, including the two hora
templates below. This approval covers the exact text as listed, with dynamic
placeholders (`{planet}`, `{time}`, `{kala}`) substituted at runtime. Any new
Tamil copy added later still needs explicit review. The historical source list is in
`docs/HANDOFF_MUHURTA_SCORE_SCALE_AND_NEXT_2026-08-15.md` §Task 3, plus these
added on 2026-08-16 in `app/services/muhurta_service.py::_hora_support_text`:

| Context | TA |
|---|---|
| lagna-lord hora | `லக்கினாதிபதி {planet} ஹோரை ({time}) [{kala}] — சிறந்த தனிப்பட்ட நேரம்` |
| other favoured hora | `{planet} ஹோரை ({time}) [{kala}] இந்த செயலை ஆதரிக்கிறது` |

The user **is** the astrologer and approves Tamil directly in chat. **Never
infer a sign-off from "proceed"** — get explicit per-string approval. Display
follows Tamil almanac usage over Sanskrit (enum keys stay Sanskrit), and never
render a faint other-language echo beside a title.

**9b. The six §11 questions.** Ask for the tables directly; do not offer
multiple choice. Only Q3 is answered (GOLD is now its own activity).

1. **Durmuhurtham table** — start offset from sunrise and duration, per weekday.
   Blocks A2 outright; there is no way to compute it.
2. **Tara Bala weighting** — is Vadha/Vipat/Pratyak a hard veto or a large
   penalty? If a penalty, how large relative to an excellent nakshatra? Blocks
   T3's weight and the veto list.
3. **Chandra Bala** — which of the twelve positions from Janma Rasi are
   acceptable, which penalised, which veto? (Only the 8th is handled today.)
4. **Muhurta Lagna** — for a wealth purchase, is a strong 2nd/11th a bonus or a
   requirement, and what counts as "strong" — occupancy, lord's dignity, aspect?
   Blocks the scoring half of T6.
5. **Tie-breaking** — when two windows are equal on the almanac, what decides?
   His own example returns a Best *and* a Second choice, so a deterministic rule
   exists in his practice.
6. **Evening muhurta** — T7.

**9c. Printed pages 119–250 of the Kalaprakasika scan.** Ch. XXV (foundation /
Grihapravesh), XXIX (travel) and XXXI (treatment) would convert `SPIRITUAL`,
`TRAVEL` and `MEDICAL` from generic almanac to page-cited. Still the
highest-leverage single input.

**9d. Browser pass — never done, and there is a lot to look at.** The dashboard
dropdown is a 6-group, 37-option grouped select. Scores now render with a
decimal (`96.2` where it used to say `100`). Day cards carry a factor list with
citations. Muhurta windows are now 30–60 min rather than ~95 min, so the card's
time line reads differently. **None of this has been opened in a browser.** This
repo's history is unambiguous: visual defects pass every automated gate and only
fall out of a screenshot. The dashboard needs auth; the e2e stack is a separate
:3100 frontend with an `environment=e2e` backend — never point e2e at the dev DB.

**9e. Score inflation.** `display_score` fixed *ranking*, not *calibration*. The
median raw day-score is 80, so a statistically average day still displays 80,
which reads as "very good". Recentring changes every displayed number on every
surface. **Owner decision, not an agent's.**

---

## 3. Small, real, and nobody's task yet

- **Mobile renders muhurta times in 24-hour, web in 12-hour.**
  `mobile/app/(tabs)/tools/muhurta.tsx:277` prints `slot.timeStart` raw, so a
  card can read `13:15` beside a reason saying `1:15 pm`. Web runs it through
  `formatClockLabel`. One formatter, mobile side.
- **The mobile picker omits six sourced activities** that the dashboard offers:
  `TREASURE_STORE`, `LAND_POSSESSION`, `VEDA_STUDY`, `GRAIN`,
  `GRAIN_EXPENDITURE`, `HARVEST_INGATHERING`. Nothing fails —
  `test_muhurta_activity_surface_parity.py` only guards the dashboard — but it
  is an inconsistency someone should decide on.
- **`GRAIN_EXPENDITURE` has four stars named by neither tier**, held in
  `GRAIN_EXPENDITURE_UNACCOUNTED_STARS` awaiting a clean page image. **Do not
  guess them.**
- **The Oordhwa-Mukha table is recorded but not wired to marriage**, on purpose:
  Ch. XIV names Atho-Mukha and Thiryag-Mukha and neither is in the transcribed
  pages. Wiring one third of a three-way classification would score some marriage
  days on a rule the others cannot be judged by. **Marriage scoring must stay
  byte-identical.**

---

## 4. Rules that will bite you

These are all things that have already gone wrong in this repo.

1. **Dump the output and read it.** Every significant defect in this area was
   found by printing seven days and looking, after the assertions were green.
   The D1 fix was proven by printing a week and seeing the window and its own
   stated reason disagree on all seven days.
2. **A test whose fixture supplies what production drops proves nothing.**
   `test_daily_push_cron` was green for weeks while production passed
   `name=None`, because the test constructed its own named slot.
3. **A broad `except` will keep a naive test green.** `_next_dasha_shift`
   swallows errors so a timeline hiccup cannot fail the brief — which means an
   assertion like "the string names a period" passes even if the timeline never
   computes. Assert the computed value directly, not the rendered fallback.
4. **A grep for a built name finds nothing.** Identifiers assembled at runtime
   (`f"as-rasi--{tone}"`) are invisible to any "is this used?" search. 13 live
   rules were deleted this way once. Before deleting anything, search for the
   *fragments*.
5. **`%H:%M` on the wire drops the date.** Any window that could cross midnight
   must carry a date, not a clock string. The muhurta window is daytime so it is
   safe today — that stops being true the moment T7 lands.
6. **Symmetry between two halves is an aesthetic argument, not a correctness
   one.** See T7.
7. **Never hardcode real personal data** in tests, fixtures, docs or example
   payloads. Synthetic identities only.
8. **Populating a previously-null field is a contract change.** When
   `nalla_neram` slots started carrying `name`, mobile would have rendered the
   shouting enum `AMIRTHAM` on screen. Grep the four surfaces.

---

## 5. Gates before you call anything done

1. `python -m pytest tests -q --no-cov` → **≥ 2831 passed**, 13 skipped, no new
   failures. Run it in the background; it takes ~31 min.
2. `ruff check` on **every file you touched** → clean. Never blanket `--fix`.
3. If you touched `web/`: `npx tsc --noEmit` (one pre-existing error, no more)
   and `npx vitest run`.
4. If you touched `mobile/`: `npx tsc --noEmit` and `npx jest`.
5. If you changed any route, param or response field: grep `app/api/`,
   `packages/shared/src/api/`, `mobile/`, `web/` and update them **in the same
   change**.
6. Every new invariant gets a test that **fails on the code before your fix**.
   State which test that is and what it printed before.
7. Report honestly: if a gate was skipped, say so; if a number regressed, paste
   it. Do not report "done" for partial work.

---

## 6. Do not

- Do not commit unless the owner asks. Do not `git reset`, `git checkout --` or
  `git stash`.
- Do not change any weight in `muhurta_engine._W`, any rule table, or any
  `ActivityRules` field as a side effect of another task.
- Do not harmonise disagreements between Kalaprakasika chapters. Ch. XX makes
  Saturday a best day; Ch. XXIV makes Purnima a best tithi; Ch. XIX contradicts
  itself on Scorpio one page apart. All are real and all are pinned by tests.
- Do not add an activity whose entire doctrine is invisible to the engine.
- Do not merge `assess_activity_timing` into `muhurta_engine`. See T3.
- Do not extend the picker to night windows without T7's answer.
- Do not invent a weight, a durmuhurtham offset, or a nakshatra list. Leave the
  constant empty and record why — the precedent is
  `ANNAPRASANA_FAVOURABLE_TARA_COUNTS`, empty because four of ten ordinals are
  OCR noise.
