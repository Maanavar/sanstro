# Muhurta — corrected state, 2026-08-18

**Supersedes the §1 state table of `docs/HANDOFF_MUHURTA_NEXT_2026-08-16.md`.**
That handoff was written at `a2d9ba7` and is now two working days stale: T1, T2,
T3, T6, A2 and the S2/S3/S4 rulings all landed after it, and its "NOT STARTED"
column is wrong in six places. Read this file first, then that one for the
reasoning behind each task.

Verified against the tree at `84de58c` plus the working tree on
`harden/production-readiness`. **Re-check any line number before editing at it.**

---

## 1. Where every handoff task actually stands

| Task | State | Where |
|---|---|---|
| **T1** almanac drowns the personal layer | **DONE** | `daily_guidance_service._activity_timing_rank:1334` — the lexicographic `alignment*100 + score` is gone. Chart score + signed tara is primary; generic alignment is a tie-break only, so no unratified weight was introduced |
| **T2** static naal clock table | **DONE**, option 1 | `muhurtham_naal_service:175` computes real Nalla Neram per date from the chart's daily location in one batched range call. The unauthenticated list keeps the customary table, and says why |
| **T3** Tara Bala in the month ranker | **DONE**, scoring | `activity_timing_rules.assess_activity_timing` takes optional `janma_nakshatra`; `TARA_SCORE` moved to `tara_bala.py` so the picker and muhurtham-naal share one calibration. S2 band caps at `muhurta_service._apply_tara_display_cap:392` |
| **T4** wealth karakas never checked | **DONE 2026-08-18** | See §2 |
| **T5** activity location | **Backend + web DONE 2026-08-18. Mobile outstanding** — see §3 |
| **T6/A3** lagna schedule | **DONE** | `panchangam.build_daylight_lagna_schedule:1467`, computed only for the top five (`muhurta_service:807`), cached in the snapshot |
| **T7** evening windows | **RESOLVED by owner (S4)** — every activity stays `DAY_ONLY`. The `evening_policy` field exists on `ActivityRules` with a test pinning all 30 values; the S3 21:00/21:30 guard is at `muhurta_service:86`. It binds nothing today, by design |
| **T8** family gap | **PARTIAL — 1 surface of 7** | The calendar tab is member-aware (`dashboard-workspace.tsx:1917`). The plan tab still passes `personal.chartId` (`:1971`); mobile has no member selection |
| **T9a** Tamil review | Approved 2026-08-16. **Four new strings pending** — see §4 |
| **T9b** the six §11 questions | Q1, Q2, Q3, Q4, Q6 all resolved. **Q5 (tie-breaking) still open** — no rule in the service |
| **T9c** Kalaprakasika pp. 119–250 | **STILL OPEN.** `SPIRITUAL`, `TRAVEL`, `MEDICAL` remain absent from the sourced registry. Highest-leverage single input |
| **T9d** browser pass | **STILL NEVER DONE**, and the backlog has grown — see §5 |
| **T9e** score inflation | **STILL OPEN.** Owner decision |
| **A2** durmuhurtham | **DONE and unblocked.** `durmuhurtham_rules.DURMUHURTHAM_DAYLIGHT_INDICES` is populated from seven owner-supplied Chennai almanac days, not recall. S1 is closed |
| §3 mobile 24-hour times | **DONE** — `formatSlotClock` |
| §3 mobile missing six activities | **DONE** — all six are in the mobile picker |
| §3 `GRAIN_EXPENDITURE` unaccounted stars | Still held. Correct — do not guess them |
| §3 Oordhwa-Mukha not wired | Still unwired. Correct — marriage scoring stays byte-identical |

---

## 2. T4 — karaka transit dignity (new, 2026-08-18)

`karaka_dignity_factors` in `muhurta_engine.py`. For the ten acquisition
activities, Jupiter and Venus are the significators of the thing being bought,
and their condition on the candidate day now reaches the score.

**Provenance is practice consensus, not a page.** Tamil almanacs print
குரு / சுக்ர மௌட்யம் as dated spans and offer no muhurtham inside them. The
reason copy must never imply Kalaprakasika says this, and a test asserts it
doesn't. Same standing this file already gives `_TARA_ADVERSE` and
`_CHANDRASHTAMA`.

**Severities are anchored, not fitted:**

- `KARAKA_COMBUST = -14.0` — set to exactly cancel `NAKSHATRA_FAVOURED` (+14), so
  a fine star alone can never carry a purchase whose karaka is invisible. Penalty,
  never veto: vetoing would blank ~2 months of every year.
- `KARAKA_DEBILITATED = -10.0` — level with `LAGNA_AVOID`.

**Retrogression is deliberately NOT penalised, though A5 lists it.** This was
caught by printing a year of spans and reading them: the draft penalised vakri,
which fires on ~51% of all days, and it contradicts this codebase's own
`chart_strength._chesta_bala_score`, where a retrograde planet gets the *maximum*
motional strength. A 2026-07-18 astrologer review already caught mis-signed
retrogression once. Two engines in one product must not disagree about the sign
of one condition.

Printing the spans also exposed a second defect: a cazimi Venus mid-way through a
combust span fell through to the retrograde branch, so the one day Venus is
strongest scored *worse* than the clear days around it. Both are pinned by tests.

**Cost:** evaluated per candidate day, not just the shortlist, because
combustion runs for weeks and a range straddling the end of சுக்ர மௌட்யம் must be
able to rank the clear days above the hidden ones. Measured at **0.5 ms per
call — 60 days costs ~32 ms** of the 1.5 s budget.

Tests: `tests/test_muhurta_karaka_dignity.py` (13, `no_db`), including the master
doc's §9.1 acceptance case over a 365-day sweep.

---

## 3. T5 — what shipped and what did not

**Shipped:** `lat`/`lon`/`tz` plus a new display-only `place` on both routes;
the typed wrapper `getMuhurta` carries all four; the web picker has a
*"Where will this take place?"* field that actually changes the calculation, and
the response echoes the chosen place back.

`place` is ignored unless all three coordinates are present, so a stray label can
never rename a reading it did not move. Two tests pin exactly that.

**Not shipped: mobile.** The mobile picker still sends no location. It needs a
geocoded free-text field (mobile has no city dataset; `birth-details.tsx` posts to
`/geo/geocode`), which brings its own loading, not-found and retry states plus
Tamil copy. That is a change of its own, not a tail-end addition to this one.

---

## 4. Tamil — owner-approved 2026-08-18

Four engine strings and three web strings. **The owner supplied the corrected
wording directly in chat and it ships verbatim.** Any later change to these needs
a fresh approval; do not paraphrase them.

| Context | TA (shipped) |
|---|---|
| Jupiter combust | `குரு மௌட்யம் — செல்வத்தின் காரகரான குரு, சூரியனுக்கு மிக அருகில் இருப்பதால் தனது இயல்பான வலிமையை இழந்துள்ளார்.` |
| Venus combust | `சுக்கிர மௌட்யம் — மதிப்புமிக்க பொருட்களின் காரகரான சுக்கிரன், சூரியனுக்கு மிக அருகில் இருப்பதால் தனது இயல்பான வலிமையை இழந்துள்ளார்.` |
| Jupiter debilitated | `குரு நீசம் — செல்வத்தின் காரகரான குரு, தனது நீச ராசியில் உள்ளார்.` |
| Venus debilitated | `சுக்கிரன் நீசம் — மதிப்புமிக்க பொருட்களின் காரகரான சுக்கிரன், தனது நீச ராசியில் உள்ளார்.` |
| Location field label | `இச்செயல் நடைபெறும் இடம் (விருப்பத்தேர்வு)` |
| Location placeholder | `இயல்புநிலை: உங்கள் சுயவிவரத்தில் உள்ள இடம்` |
| Location helper | `சூரிய உதய நேரம் இடத்திற்கேற்ப மாறுவதால், நல்ல நேரம், ராகு காலம் மற்றும் ஹோரை ஆகியவை இவ்விடத்தின் அடிப்படையில் கணக்கிடப்படும்.` |

**Two structural rules the correction established, both pinned by tests:**

1. **மௌட்யம் takes the compound form, நீசம் takes the nominative.** It is
   `சுக்கிர மௌட்யம்` but `சுக்கிரன் நீசம்`. Jupiter is `குரு` in both, which is
   precisely why a single name column would have looked right in review and been
   wrong only for Venus. The draft shipped `சுக்ர` — wrong stem — and the owner
   corrected it to `சுக்கிர`.
2. **The role is an adjectival participle**, `காரகரான`, because it qualifies the
   planet that follows: `செல்வத்தின் காரகரான குரு`. The draft used the
   nominative `காரகன்` as a bare apposition.

The English was rewritten to track the approved Tamil ("so close to the Sun that
it has lost its natural strength", not the draft's "hidden in the Sun's glare") —
one card must not state two different reasons in two languages.

---

## 5. What is actually next, in order

1. **The browser pass (T9d).** Never done, and the unlooked-at backlog has grown
   again: durmuhurtham windows now render, muhurta windows are 30–60 min, tara
   caps change displayed bands, Kuligai has flipped from excluded to *favourable*
   on 20 activities, and the picker has a new location field. This repo's record
   is unambiguous — visual defects pass every automated gate. **Owner, not agent.**
2. **T8's remaining six surfaces.** Unblocked; the route takes an optional
   `chartId` and the calendar tab is the pattern to copy.
3. **Mobile activity location** (§3).
4. **T9c** — pages 119–250. Still the highest-leverage single input.
5. **Q5 tie-breaking** and **T9e score recentring** — both owner decisions.

---

## 6. Also fixed on the way, unrelated to muhurta

`web/lib/chart-utils.ts` — the maitri table had drifted from Python a **second**
time. `20a27af` resolved the Venus-node contradiction backend-side and this copy
kept the old rows, listing Rahu and Ketu as Venus's enemies while its own RAHU and
KETU rows called Venus a friend. `lib/doctrine-parity.test.ts` had been red since
that commit. Latent again (`getNilai` looks up a sign lord, never a node), but
that is the argument for the guard, not a reason to relax it.
