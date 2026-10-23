# Ground-Truth Audit — Implementation Record, 2026-10-13

Companion to [`TAMIL_ASTROLOGY_GROUND_TRUTH_AUDIT_2026-10-13.md`](TAMIL_ASTROLOGY_GROUND_TRUTH_AUDIT_2026-10-13.md).
That document says what is wrong; this one says what was changed, what was
deliberately **not** changed, and what each new gate can and cannot see.

**Reading order for the next person:** the "Not changed" table is the important
half. Six findings are owner-ruling questions, not bugs, and one is a real
defect whose obvious fix is measurably wrong. Closing them as "done" because
this file exists would be the exact failure CLAUDE.md records under *a stale
conclusion outlives its check*.

> **ANSWERED, same day.** All seven ruling questions in §2 — and Karinaal, the
> Sade Sati weights, the localisation ratchet, the festival lunar month and the
> composite rungs in §4 — were ruled on by the astrologer on 2026-10-13. Read
> [`ASTROLOGER_RULINGS_2026-10-13.md`](ASTROLOGER_RULINGS_2026-10-13.md) **before**
> acting on anything below it; four of this file's own conclusions were corrected
> there, including F-ASV-01 (not a choice between two texts — a transcription
> error, now fixed), Karthigai 7 (removal reverted) and the eka-nakshatra star
> list (this file's list differs from the astrologer's on two stars, so neither
> may be encoded). Most rulings approve a *mechanism* and withhold its *table*;
> §2 below is still the right description of the code's behaviour, but it is no
> longer the state of the question.

---

## 1. Changed

| ID | Sev | Change | Gate |
|---|---|---|---|
| F-MAR-01 | **P0** | `MarriageAssessmentInput` carries `sevvai_dosham_present` beside `sevvai_dosham_cancelled`; the penalty and the narration fire only when a dosham is actually present | `test_marriage_score_stage.py::test_absent_sevvai_dosham_costs_nothing_and_says_nothing` |
| F-CI-01 | **P0** | `sevvai_label_cap` + `apply_label_cap` in `compatibility_intelligence` — live dosham caps at AVERAGE (anchor #6), cancelled at GOOD (anchor #4); summary made cause-aware | 4 tests in `test_compatibility_intelligence.py` |
| F-MAR-02 | P1 | 7th-house occupancy no longer a flat +6 SUPPORT: benefic occupants add, malefic occupants subtract, status follows the balance | marriage golden (12 cases moved) |
| F-DSP-01 | P1 | `harmony` + `dosham_severity` lexicon domains (both halves of the pair); CI panel badges, the compatibility PDF, `mobile/app/dasha`, `mobile/app/jadhagam` all localised; new `packages/shared/src/i18n/astro-names.ts` | TS typecheck on all three surfaces |
| F-MUH-02 | P1 | `app/calculations/karinaal.py` derives Karinaal from fixed Tamil solar dates for any year; `muhurta_engine` now consults it | 8 tests in `test_muhurta_karinaal_and_month.py` |
| F-MUH-01 | P1 | `_marriage_month_factor` demotes Aadi / Purattasi / Margazhi wedding dates below every other month; notice text corrected | 6 tests, incl. an end-to-end 70-day sweep |
| F-PAN-01 | P1 | Ashtami excluded from both day-quality checks; the badge relabelled நல்ல நாள் / "Good day" on 5 surfaces (incl. the muhurta engine's own factor, which claimed *the almanac* marked the day), with முகூர்த்தம் removed | `dashboard-calendar-day-drawer-nova.test.tsx::does not call the day-quality flag a muhurtham` |
| F-SAT-01 | P1 | `sade_sati._SEGMENTS` reverted from the unsourced month table to the three named phases, **Janma heaviest** (6 / 4 / 3) | `test_sade_sati.py::test_janma_sani_is_the_heaviest_phase_everywhere_in_it` |
| F-SCO-01/02 | P1 | One `app/calculations/gochara_scores.py`, derived from the classical favourable sets; all three former tables are now the *same object* | 27 tests in `test_gochara_scores.py` |
| F-POR-05 | P1 | `_assign_bride_groom` infers the unknown gender from the known one; a genuinely assumed direction is disclosed in `contextNote` | — (see §3) |
| F-CI-02 | P1 | ஆயுள் framing removed from the Rajju risk line; the missing Vedha line added | 2 tests |
| F-CI-03 | P1 | `dosha_samyam.papa_samyam` built (5 malefics × 1/2/4/7/8/12 from Lagna, Moon, Venus, both charts); surfaced as report text | 14 tests in `test_papa_samyam.py`, incl. the end-to-end wiring |
| F-CI-04 | P2 | Dasha layer labelled "current period" in both languages, with an explicit note that it moves as the dashas advance | — |
| F-SAT-02 | P2 | `is_ardhashtama_sani` carries an explicit penalty (2), so the named Saturn periods are consistent | `test_sade_sati.py::test_no_phase_of_the_cycle_is_cheaper_than_ashtama_sani` |
| F-VAR-01 | P2 | `compute_d60` counts **forward** for every sign | `test_d60_matches_the_bphs_formula_across_the_zodiac` — 2160 probes |
| F-STR-01 | P2 | Chesta Bala rebuilt on the eight-fold `CHESTA_VIRUPA` table; fast is strong, stationary weak, Sama 7.5 | 5 tests in `test_shadbala.py` |
| F-STR-02 | P2 | `EXPERIMENTAL_NOTE` now names the flat +30 Drik Bala baseline, not only the omitted sub-components | — |
| F-FES-01 | P2 | Chitra Pournami keyed to the **Chithirai month's Pournami** (it tested the Chitra *nakshatra* and never the month); Maasi Magam and Panguni Uthiram de-AND-gated to month + star | 7 tests across 2 years |
| F-KAR-01 | P2 | `karaka_chains` made the single source; Property, Career and Health reconciled. Property drops **Venus only** — leading with the Moon instead of Mars was equally defensible but moved a measured chart 22 → 63, so the order that does not move live readings was kept pending a ruling | 19 tests in `test_karaka_tables_agree.py` |
| F-DOC-01 | P2 | `MASTER_FIX_LIST.md` AST-1 closed with evidence; `DOCTRINE_DECISIONS_V1.md` §10/§11/§12 ticked, each re-verified against live code first | — |
| F-REM-01 | P3 | Navadhanya corrected: Mars துவரை (not masoor), Ketu கொள்ளு (not "mixed grains"), Venus மொச்சை added | — |
| F-CI-05 | P3 | Venus↔Venus documented at all four surfaces; the wire name `venusMarsHarmony` kept, every user-facing label already says "Venus" alone | — |

### New modules

- `app/calculations/karinaal.py` — the Karinaal rule, derived not typed.
- `app/calculations/gochara_scores.py` — the one transit house-score table.
- `packages/shared/src/i18n/astro-names.ts` — rasi/graha localisers for mobile.

### Regenerated goldens, and why

| Golden | Cases moved | Cause |
|---|---|---|
| `marriage_prediction_golden.json` | 36 of 96 | F-MAR-01 (12 charts stopped being told they had a dosham) and F-MAR-02 (24 charts re-scored their 7th-house occupant by nature) |
| `daily_guidance_golden.json` | 16 of 16 | F-SCO-01. Score mean delta **−0.4**; one band flip. The verdict *words* did not change — they already came from `gochara_grade` — only the number moved, to agree with them |
| `life_areas_golden.json` | 16 of 16 | F-SCO-01 (area score mean delta **−0.7**), then F-KAR-01 and F-REM-01 in a second pass (a further **−0.31** over the 55 area-scores that moved, across Health, Career, Litigation, Property and Family Harmony) |

---

## 2. Not changed — and these are the ones to read

### Six owner-ruling questions, deliberately left alone

Each of these has a **recorded owner ruling** behind the current behaviour.
CLAUDE.md is explicit that owner rulings win over any outside opinion, and the
audit itself asks for an astrologer re-confirmation rather than a code change.
Changing them here would have been overturning a ruling by implication.

| ID | Current behaviour | Ruling behind it | What the astrologer needs to answer |
|---|---|---|---|
| F-POR-01 | Ganam is binary; any Rakshasa mix fails | — | Should boy-Rakshasa + girl-Manushya grade *madhyama*? Should the "star count > 14 overlooks gana mismatch" exception apply? |
| F-POR-02 | Rasi 8th from the girl **passes** | EC-RULING-01, Kalaprakasika p.74 | Popular practice fails ஷஷ்டாஷ்டகம் (6/8) **both** ways. Is the citation being read correctly? If the ruling stands, should count 8 at least show a madhyama/"verify" note? |
| F-POR-03 | Same-star couples always fail (Dinam + Rajju veto) | EC-RULING-04 | ஏக நட்சத்திரம் accepts same-star marriage for a named set (Rohini, Thiruvathirai, Magam, Hastham, Visakam, Thiruvonam, Uthirattathi, Revathi). Practice applies it **before** Rajju. ~2.6% of all couples get a hard CAUTION today |
| F-POR-04 | Vasya: Thulam → Makaram only | — | Several Tamil / Muhurta-Chintamani tables list Thulam → **Kanni, Makaram**. Needs the source page |
| F-ASV-01 | Mercury BAV from Lagna = {1,3,5,6,9,10,11} ("Phaladeepika") | — | BPHS and most software use {1,2,4,6,8,10,11}. The total stays 54 either way, so SAV looks right while the per-rasi distribution differs. Which text? |
| F-KAR-01 (marriage half) | Venus is the marriage karaka for every chart | DD-05 (governs *copy*, not karaka choice) | Tamil practice reads **Guru as the husband's karaka in a woman's chart**. DD-05 made the copy gender-neutral; the karaka choice still needs its own ruling |

**Also left alone, and why:** the Rahu/Ketu *display grade*. `gochara_grade.py`
is astrologer-ruled (D2/D3) and states the nodes have no approved table yet.
The scoring half **is** fixed — `gochara_scores` grades them 3/6/11, which is
what F-SCO-01 was about. The two modules' differing scope is now recorded in
`gochara_grade`'s own docstring so the next reader does not read it as an
oversight.

### F-FES-02 — a real defect whose obvious fix is measurably wrong

The audit is right that a 30–32-day Tamil solar month can hold the same tithi
twice, and right about the rate. Measured over 2020–2040 (21 years, Chennai),
sweeping Aavani and Aippasi:

```
2033 Aavani  Krishna Jayanthi     span 2033-08-17..2033-09-16 (31d)
                                  -> 2033-08-17 (Aavani 1) and 2033-09-16 (Aavani 31)
2034 Aavani  Vinayagar Chaturthi  span 2034-08-17..2034-09-16 (31d)
                                  -> 2034-08-18 (Aavani 2) and 2034-09-16 (Aavani 31)
```

2 of 21 years — the audit's ~5% estimate, confirmed.

**The fix was not shipped because the evidence says both heuristics fail.**
The duplicate pair is always (day 1–2, day 31), so "suppress the second" and
"suppress the first" are the two available one-line fixes. Against practice:

- Krishna Janmashtami 2033 is the **August** date → suppressing the second is right.
- Ganesh Chaturthi 2034 is the **September** date → suppressing the second is wrong.

Opposite answers, because these festivals are keyed to **lunar** months
(Shravana Krishna 8; Bhadrapada Shukla 4) and the Tamil solar month is a proxy
that holds ~95% of the time and breaks in exactly these years. A heuristic
would have turned a 2-in-21 miss into a 1-in-21 miss *plus* a 1-in-21 wrong
date presented confidently.

**The real fix** is a lunar-month (amanta) derivation feeding these rules
instead of `tamil_month_index`. That function does not exist yet. Logged here
with the sweep so the next reader inherits the measurement, not the theory.

### Deferred nuance

- **F-SAT-03** — Pongu / Mangu / Marana Sani (which round of Ezharai) is still
  not modelled. Commonly expected; if ever added, the "marana" label must stay
  out of user-facing copy.
- **Tuesday night Durmuhurtham** — still not shown (P3, cosmetic).

---

## 3. What the new gates cannot see

Per CLAUDE.md, *a gate proves its own check, not the item*. Every gate below was
run once with its fix removed and confirmed to fail; this is what each still
cannot see.

| Gate | Confirmed to fail without the fix | Blind spot |
|---|---|---|
| `test_muhurta_karinaal_and_month.py` | Yes — 5 fail with the weights zeroed, 1 more with the Karinaal weight zeroed | Derivation agrees with **our** Tamil calendar engine. Nothing has been checked against a printed almanac. The engine puts Thai 1 on 2026-01-14 (Pongal) and the old hand list implied 2026-01-15, so **all five January Karinaal moved a day**. Not verified against the source sheet |
| `test_gochara_scores.py` | Yes — identity assertions fail against the old tables | Proves the three surfaces agree and that scores match the classical sets. Does **not** prove the two-band shape is the right resolution — the gradation now comes from Ashtakavarga bindus and vedha, which no test here exercises |
| `test_d60_matches_the_bphs_formula_across_the_zodiac` | Yes | Checks D60 against the BPHS *formula*. The sixty shashtiamsa **deity names**, which genuinely do reverse for even signs, are not implemented or tested at all |
| `test_karaka_tables_agree.py` | Yes | Pins the two tables to each other. Says nothing about whether the reconciled karaka is the doctrinally right one — that is the F-KAR-01 ruling still open above |
| Compatibility cap tests | Yes — the two cap tests fail without `sevvai_label_cap` | Sub-layers are stubbed at full strength, so the cap is tested in isolation. No test covers the cap against a *real* pair of chart snapshots |
| Festival tests | Yes | Assert each festival occurs at all in a year. They do **not** assert it occurs exactly once (that is F-FES-02, unfixed), nor on the correct date |

**Not gated at all:**

- **F-PAN-01 beyond the calendar drawer.** The drawer has an assertion that
  its row never says "muhurtham day". The other four surfaces (the public
  panchangam page, the planner tool, mobile daily panchangam, and the muhurta
  engine's own `ALMANAC_DAY_QUALITY` reason strings) were changed by hand and
  nothing greps for முகூர்த்தம் on a day-quality badge. The display-boundary
  ratchet (`web/lib/rasi-display-boundary.test.ts`) covers rasi only.
- **F-POR-05's disclosure.** The inference table is exercised by hand, not by a
  test; the `contextNote` disclosure has no assertion.
- **F-CI-03's papa samyam convention.** `test_papa_samyam.py` covers the
  arithmetic, the asymmetry, the missing-reference case and the end-to-end
  wiring — but every one of those tests encodes **our** reading of the rule.
  No printed worked example was available to check it against. The specific
  convention to confirm with the astrologer: a malefic in a papa house from
  two references scores **twice** (the three references are three separate
  readings, not one to de-duplicate), and only the five grahas count, with
  Mandhi excluded.
- **F-STR-01's band boundaries.** The tests pin the eight *values* against
  BPHS and pin the direction (fast strong, stationary weak, Sama weakest).
  They do **not** pin the boundaries — 0.2 / 0.5 / 0.9 / 1.1 / 1.5 of mean
  speed is this engine's approximation of *which* state a planet is in, and
  nothing checks it against a seeghra-kendra computation. Anuvakra also
  cannot be told from Vakra without the station instants, so all retrograde
  motion scores 60 and the Anuvakra case is over-credited by 30 Virupas.
- **Tamil copy.** Every Tamil string added here is unreviewed, consistent with
  the standing Phase-4 note. The `ta` harness phase reads visible text only —
  it cannot see `title=` or `aria-label=`.

---

## 4. Open items this creates

1. **Karinaal against the printed sheet** — specifically the five Thai dates,
   Margazhi 11 (added) and Karthigai 7 (removed). Until then
   `karinaal.KARINAAL_TAMIL_DAYS` is the rule of record.
2. **PN-4 / the bare "p. 243"** — still unproduced. If it turns out to state
   the Sani Nara-Chakra, compute from Saturn's transit nakshatra counted from
   the janma nakshatra, **not** from a month clock. Do not restore the old
   `_SEGMENTS`.
3. **The six rulings in §2**, plus a seventh this work surfaced: **which graha
   leads for Property** — Mars as bhumi karaka (kept) or the Moon as 4th bhava
   karaka. Measured swing on one chart: 41 points. One astrologer session
   would close all of them.
4. **A lunar-month derivation** for F-FES-02.
5. **The 80/65/50 composite rungs** remain un-retuned, now with a second
   reason: F-CI-01's caps change the label distribution independently of the
   score. A retune needs a measured composite distribution over real charts.
