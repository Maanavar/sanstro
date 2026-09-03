# Response to the external release-gate review — 2026-08-18

An external reviewer read `VINAADI_ASTROLOGY_RULEBOOK_FOR_EXTERNAL_REVIEW.md`,
graded it, and returned seven blockers plus a set of classification corrections
and a demanded test suite. Their verdict was: **controlled beta yes, full
production no**, and their closing request was for the calculation source so the
second half of the audit could run rule-ID → function → constant → test.

This document is that second half, run against the code. Every claim below was
checked in the repository, not inferred from the rulebook.

**Bottom line.** The review is good work and mostly correct. Six classification
corrections were right and are applied. Three of the seven blockers were
**already closed in code** and the rulebook was under-selling them — the fix was
disclosure, not engineering. One blocker (Jeevan/Nethiram) fails its own stated
trigger and is not a blocker, though a *different* and more serious defect sits
next to it. The reviewer's single non-astrology finding, Swiss Ephemeris
licensing, is the sharpest item in the whole review and is now a stop-ship gate.

I agree with the reviewer's release conclusion, for partly different reasons.

---

## Verdicts at a glance

| # | Reviewer's blocker | Verdict | Action taken |
|---|---|---|---|
| 1 | `GO-10` Kandaka Sani marked `[CORE]` | **Upheld** | Reclassified `[VARIANT]`; ruling logged; code pinned by test. Not disabled — see below. |
| 2 | `PAN-08` / `MUH-07` Hora classification conflict | **Upheld, doc-only** | Both now `[VARIANT]`. No code contradiction existed: one shared implementation. |
| 3 | `PAN-11` Jeevan/Nethiram provenance | **Not a blocker** by the reviewer's own test — it does not affect ranking. A worse, separate defect does exist. | Reclassified `[VARIANT] [LIMIT]`; scoring reach stated; live-case defect surfaced. |
| 4 | `PAN-12` Amirdhadhi 189-cell table uncertified | **Already closed** | Table published in full; source and cross-check recorded; shape asserted by test. |
| 5 | `POR-03`/`POR-04` hidden porutham tables | **Upheld as an auditability gap** | All tables published, generated from live constants. |
| 6 | `POR-12` misclassified `[TRADITION]` | **Upheld** | Split into `POR-12` `[TRADITION]` (positions) and `POR-12a` `[PRODUCT]` (labels). |
| 7 | `PAN-17` unbounded festival coverage | **Upheld, and narrower than stated** | Coverage boundary named in code, disclosed in `PAN-17`, asserted by test. |
| — | Swiss Ephemeris licensing | **Upheld — sharpest finding in the review** | Stop-ship gate added to the go-live checklist. Owner decision. |

Classification corrections: `STR-01` → `[VARIANT]`, `STR-02` → `[PRODUCT]`,
`GO-07` → `[TRADITION]`+`[PRODUCT]`, `GO-10` → `[VARIANT]`, `MUH-07` →
`[VARIANT]`, `POR-12` → split. `PAN-08` stays `[VARIANT]` as the reviewer
recommended. `DOS-01`, `PAN-11`, `PAN-17`, `GO-03`, `GO-05`, `GO-11`, `POR-03`,
`POR-04`, `POR-06`, `POR-07`, `POR-08`, `POR-09`, `YOG-01`, `INT-02`, `OUT-06`
gained specifications they were missing. `OUT-08` is new.

---

## 1. `GO-10` Kandaka Sani — upheld

**The reviewer is right that `[CORE]` was wrong.** Kantaka/Kandaka Sani is
reckoned variously from Lagna, Janma Rasi, or Arudha Lagna, over 1/4/7/10 or
1/4/8/10 depending on lineage. Marking one of those a locked foundational
convention claimed a consensus that does not exist, and this rule decides whether
a reader is told they are *currently under* Kandaka Sani. Reclassified
`[VARIANT]`.

**Where I depart from the recommendation: I did not disable it.** The reviewer
suggested disabling until sourced. Checking the code first changes that
calculus — the reference is already disclosed to the reader on every surface:

```
app/calculations/display_names.py:69   "KANDAKA_SANI": "கண்டக சனி (லக்னம்)"
app/calculations/display_names.py:80   "KANDAKA_SANI": "Kantaka Sani (from Lagna)"
app/services/life_areas_service.py:753 "கண்டக சனி (லக்னம்)"
app/services/narrative_engine.py:416   "கண்டக சனி (லக்னத்திலிருந்து) — …"
```

Nobody is being told this is universal practice; they are being told which
reference produced it, in both languages, which is exactly the `[VARIANT]`
disclosure standard the reviewer asks for in their own Gate C. Removing a live,
correctly-labelled cycle would delete information rather than correct it. The
ruling is logged in `ASTROLOGER_REVIEW_QUEUE.md`, and
`test_kandaka_sani_activates_only_on_the_four_kendras_from_lagna` pins the code
to 1/4/7/10 so a doctrine change cannot land without updating the published rule
in the same commit.

**Still open and genuinely blocking a `[TRADITION]` re-marking:** a named Tamil
source for the reference and the house set.

## 2. `PAN-08` vs `MUH-07` — upheld, but it was never a code contradiction

The reviewer suspected an internal contradiction. There is one hora
implementation in the engine (`panchangam._make_hora_entries`), and both the
panchangam display and the muhurta ranker read it. `muhurta_service` intersects
its recommended window *with* that hora and prints the hora's own clock range as
the reason, so a divergence would have been visible immediately.

What was wrong is exactly what the reviewer said in their ruling: **one marker
claimed universality while the other declared a choice**, for the same behaviour.
Both are now `[VARIANT]`, and `PAN-08` carries the textual footing — BPHS
describes Hora Bala over a sunrise-to-sunrise day divided into 24 equal parts,
and the Tamil almanac tables print whole-hour boundaries with the 6-1-8-3
mnemonic, which only holds if every hora is exactly sixty minutes. The
twelve-unequal-day/twelve-unequal-night convention is authentic and is not what
we compute; that is now stated rather than implied.

I agree with the reviewer's conclusion that equal hours should be *kept*.

## 3. `PAN-11` Jeevan/Nethiram — fails the reviewer's own blocker test

The reviewer set the condition themselves: *"If Jeevan/Nethiram is merely
secondary explanatory information, this does not have to block the entire app. If
it affects score/ranking/recommendations, it is a release blocker."*

**It does not affect score, ranking, or recommendations.** Both are strings on the
panchangam snapshot. The complete set of consumers:

- `panchangam.py` — computes them, and the label maps
- `schemas/panchangam.py` — two `str` fields
- `panchangam_service.py` — passthrough
- `web/lib/i18n.ts` + `dashboard-calendar-tab-nova.tsx` — rendered on the
  Calendar surface, each with the hint *"a muhurtham-suitability marker, not a
  personal reading"*

No scorer, ranker, or recommender reads either field. So this is not a release
blocker under the reviewer's own criterion, and the rulebook now says so
explicitly rather than leaving a reader to guess.

**But there is a worse defect sitting next to it, which the review did not
find.** The provenance gap is theoretical; this one is a wrong value on screen.
On 2026-08-10 the reviewing astrologer gave a live Chennai case: Sun in Ayilyam
(10), Moon in Thiruvathirai (7), ring distance 3. The table returns "one eye"; the
astrologer says "blind". That is a formula defect, not a sourcing question, and it
is already logged in `ASTROLOGER_REVIEW_QUEUE.md`. It has deliberately not been
guess-patched — the same formula was marked confirmed by the same astrologer on
2026-07-16, and one data point underdetermines the replacement (shift the blind
cutoff to ≤3? or abandon the symmetric ring distance for a directional
inclusive count, as an earlier audit suspected by analogy to Dinam?). The printed
table is what unblocks it.

Reclassified `[VARIANT] [LIMIT]`: a review-confirmed formula with no printed
source in-repo is not a source-checkable traditional rule.

## 4. `PAN-12` Amirdhadhi — already closed; the rulebook was under-selling it

The reviewer asked to compare 189 source cells against 189 code cells. Fair ask.
The comparison had already been done, and the rulebook simply never said so.

- Source: the *Ungal Vazhkkai Vazhikatti* panchangam, astrologer-supplied,
  re-sourced 2026-07-14. Every row covers 27 nakshatras once.
- The two flagged Prabalarishta cells — Thursday+Kettai, Friday+Pooradam — were
  independently confirmed against the same publisher's own public article. Their
  apparent divergence from the classical Dagdha list is a **taxonomy** difference:
  Prabalarishta and Dagdha are distinct yogas.
- The whole Thursday Marana row and the whole Friday Marana row match Ernst
  Wilhelm's Dagdha sets cell-for-cell.

**One trap worth flagging back to the reviewer.** A natural premise here is that
the seven Amrita-Siddhi *muhurta* pairs should read `A` in this grid. They should
not — they land on Siddha (`C`), which is the "Siddhi" tell. An earlier internal
audit adopted that premise, "corrected" Tue+Ashwini and Wed+Anuradha on the
strength of it, and the change had to be reverted. The muhurta yoga and this
daily-classification table are different objects. Anyone re-verifying the grid
should know that before they start.

All 189 cells are now published in the appendix, and
`test_amirdhadhi_grid_is_exactly_seven_by_twentyseven` plus
`test_amirdhadhi_cells_are_all_declared_classes` assert the shape and the class
domain, so a shifted row fails a test rather than shipping 27 wrong days.

## 5. Hidden porutham tables — upheld, and fixed structurally

This was the review's most useful finding, and the right response is not to paste
tables into prose. `docs/VINAADI_RULEBOOK_TABLE_APPENDIX.md` is **generated** from
the live constants by `scripts/generate_rulebook_appendix.py`, and
`tests/test_rulebook_appendix_sync.py` regenerates it in memory and fails if the
committed copy differs. A hand-copied table drifts from the code the day after it
is written, and a drifted appendix is worse than none — it launders a stale table
as verified.

Published: Mahendra counts and direction, Sthree Deergham threshold, Dinam
counts, the Gana / Yoni / Vasya / Rajju / Nadi / Graha Maitri tables, the Vedha
pairs, the Amirdhadhi grid, both Gowri 7×8 tables, the daylight-eighth slots,
the hora chain, the Moon–Moon harmony table, the 9×9 natural friendship grid, the
full Sevvai specification, the transit Vedha table, the Murthi table, combustion
and gandanta thresholds, the Kuligai activity mapping, and the Vimshottari years.

Two things a reviewer should look at first, because they are where our tables
knowingly diverge from a printed page:

- **Vasya.** Two rows were incomplete until 2026-08-17 (Viruchigam→Kanni,
  Magaram→Kumbham). Both omissions produced spurious *failures*, so couples who
  should have cleared Vasya were being failed. Simmam→Thulaam is retained against
  Jothidam p.69's Simmam→Makaram, which contradicts every standard table and is
  treated as a source defect. That is a judgement call, and it is now visible.
- **Mahendra direction.** We count girl-from-boy; the reference spec counts
  boy-from-girl. Outcomes are identical *only* because {4,7,10,13,16,19,22,25} is
  closed under `c → 29−c`. That is an accident of this set, not a guarantee, and
  it is pinned by a test.

## 6. `POR-12` — upheld, and split

The reviewer is right that "Compatibility Intelligence emotional Moon–Moon
harmony" with a Good/Mixed/Excellent/Tense mapping is an interpretive
normalisation layer wearing a `[TRADITION]` marker. But it is not *only* that: the
underlying positional grouping in `_MOON_HARMONY_TABLE` is classical — 2/12
dwirdwadasa, 3/11 upachaya, 4/10 kendra, 5/9 trikona, 6/8 shadashtaka, 7
samasaptama.

So rather than reclassify the whole rule to `[PRODUCT]`, it is split:

- `POR-12` `[TRADITION]` — the positional grouping.
- `POR-12a` `[PRODUCT]` — the four verdict words and their subscore weights.

That is the honest cut, and it is the same treatment `GO-07` now gets. Symmetry
is asserted across all 144 rasi pairs, and a test requires each classical pair
(2/12, 3/11, 4/10, 5/9, 6/8) to share a label — so the grouping cannot be broken
by editing one half of a pair.

## 7. `PAN-17` festivals — upheld, and the real shape is narrower

The reviewer's concern was calculation correctness at tithi boundaries. The actual
gap is different and easier to state. Two engines produce festival rows with
different reach:

1. **Algorithmic** — Ekadashi with dashami-viddha handling, Pradosham, Sankatahara
   Chaturthi, Amavasai/Pournami, Karthigai, Sashti, and the solar-day yearly
   festivals, all computed from the ephemeris. These answer for **any** year.
2. **Gazetted** — government holiday dates plus a few administrative records.
   These existed for **2025 and 2026 only**, and nothing said so.

The failure mode was therefore not a wrong date; it was a **silently thinner**
calendar. Browse to January 2027 and Pongal is simply absent, with no indication
that coverage ran out rather than the month being quiet.

Fixed by naming the boundary in code — `festivals.GAZETTED_FESTIVAL_YEARS`, with
`gazetted_coverage_bounds()` and `has_gazetted_coverage(year)` so a surface can
disclose it — stating it in `PAN-17`, and asserting the doc and the constant agree
(`test_rulebook_states_the_actual_festival_coverage_boundary`). Extending coverage
now fails a test until the published rule is updated to match.

Government-holiday coverage for 2027 remains owed before any later year is
presented as complete.

## 8. Swiss Ephemeris licensing — upheld, and the most consequential item here

The reviewer flagged this almost in passing. It deserves more weight than any
doctrine item in the review, because it is the only finding that gets harder to
unwind after launch rather than easier.

- `app/calculations/ephemeris.py` uses `SEFLG_SWIEPH` — the Swiss Ephemeris
  engine proper.
- Dependencies: `pyswisseph==2.10.3.2` (< 3.14) and `swisseph-ffi==1.0.0` (3.14+),
  both wrapping the same Astrodienst library.
- **There is no `LICENSE` file at the repo root.**
- Swiss Ephemeris is dual-licensed: AGPL-3.0, or a paid professional licence.
- Every chart, panchangam, muhurta window, and transit in the product is computed
  through it, and the mobile build *distributes* rather than merely serves, which
  triggers different AGPL obligations than the web service does.

Now a stop-ship gate in `docs/launch/GO_LIVE_CHECKLIST.md` §3a. This is a
commercial decision with an authority requirement; it is flagged, not resolved.

---

## What was already true, and re-stated rather than re-worked

The review flagged several items as uncertified that were already closed. In each
case the gap was that the rulebook did not say so — a real documentation failure,
but not engineering work:

- **`MUH-06` Kuligai activity mapping.** Fully sourced: Jothidam p.152 for the
  repetition mechanism and the cremation case, plus the owner ruling of
  2026-08-17. Two divergences are deliberately recorded — MEDICAL is adverse
  against Kalaprakasika's favourable listing, because treatment recurring means
  illness recurring under the Tamil rule; SPIRITUAL is favourable by reasoning
  rather than a quoted line. An unclassified activity returns `UNSPECIFIED`, and a
  test pins that it must never read as rejection, since blanket exclusion was the
  original defect.
- **`POR-07` Vedha triad.** Already fixed against Jothidam p.70. The appendix now
  publishes all 15 pairs, and `test_no_nakshatra_is_structurally_vedha_exempt`
  makes the old defect unrepeatable — 27 is odd, so any pure-pair table
  necessarily exempts exactly one star, which is precisely how the dropped Chitra
  edge hid. Coverage is now asserted, not inspected.
- **`GO-05` transit Vedha** and its Sun–Saturn / Moon–Mercury exemptions: in code,
  now published, exemption pair set pinned by test.
- **`GO-03` thresholds.** The reviewer asked "what exact combustion degrees?" —
  they exist per graha with separate direct and retrograde values, plus a Cazimi
  orb and six gandanta ranges. All now published. A test asserts the Moon is
  *absent* from the combustion table, because `GO-04` routes Moon-near-Sun through
  Amavasai and a Moon entry would double-count it.
- **`DOS-01` Sevvai.** "From the relevant reference" was indeed not a
  specification. It is Lagna, Moon **and** Venus, all three independently, with
  the firing reference recorded; house set 1/2/4/7/8/12; gender-weighted severity;
  and six named cancellation classes including a nivarthi table. All published.
- **`GO-08`.** The reviewer independently re-derived the union of Saturn's
  occupied and aspected houses across the three Sade Sati signs and confirmed only
  the 5th is missing. That matches. No change.

## The demanded test suite

`tests/test_rulebook_invariants.py` — 133 tests, all passing:

- **Exhaustive porutham sweep.** All 729 nakshatra pairs through
  `compute_porutham`: ten kutas, in-range aggregate, valid label, and the
  `POR-09` hard-dosha label cap asserted **for every pair**, not spot-checked.
  Every nakshatra-keyed kuta is separately asserted binary over all 729.
- **Vedha.** The three triad edges by name and in both directions; symmetry over
  the full table; and full 27-star coverage.
- **Rajju.** Same-nakshatra fails for all 27 stars; the five tent groups.
- **Table shapes.** Amirdhadhi 7×27 with a valid class domain and at least one
  Amirtha per weekday; Gowri rows are 8 known kalas with a good kala available
  every weekday; daylight-kalam slots are a per-weekday permutation; all
  nakshatra-keyed tables cover 1–27; Vasya covers all 12 rasis; Graha Maitri is
  defined for every ordered lord pair (a missing cell would read as neutral and
  silently *pass* the kuta).
- **Properties.** Vimshottari totals 120 over the nine grahas; Moon–Moon harmony
  symmetric over all 144 pairs with classical pairs sharing a label; Jeevan and
  Nethiram renderable for all 729 Sun×Moon pairs; hora is 24 × exactly 60 minutes
  with a seven-lord chain.
- **Position sets.** Sade Sati fires on 12/1/2 and nowhere outside the
  Moon-reference cycle; Kandaka fires on exactly 1/4/7/10; Murthi covers all 12
  counts in four grades of three.
- **Thresholds.** Combustion orbs positive with retrograde never wider than
  direct; Moon and Sun absent; gandanta ranges exactly 3°20′ within 0–360°.
- **Kuligai.** Polarity classes disjoint; keys normalised (a lowercase key would
  be unreachable); unknown activity is `UNSPECIFIED` and not rejected; the owner's
  two worked examples pinned.
- **Festival coverage.** Constant matches the table, years contiguous, helpers
  agree, and the rulebook states the real range.

`tests/test_rulebook_appendix_sync.py` keeps the appendix honest and asserts every
rule ID the reviewer asked to see is actually covered.

**Not built, and honestly not built:** the reviewer's request for 100 charts
compared against an independent reference implementation, and their
7-weekday × 12-month × multi-location panchangam matrix. Both need an agreed
external reference to compare *against* — JHora output, or a specific printed
almanac for named cities. Neither can be manufactured from this repository, and
generating expected values from our own engine would be a tautology that reads
as verification. This is the largest remaining item on the reviewer's list and it
needs a decision on the reference before it can be built.

---

## Where I land on release

**Agreeing with the reviewer's verdict, with a different weighting.**

The doctrine items they blocked on are, on inspection, mostly *marker* problems —
rules that overstated their traditional standing — and marker problems are fixed
by honest labelling, which is now done. The engineering gaps were real but
shallow: hidden tables and missing exhaustive tests, both closed here.

What actually stands between this and full production is a shorter list than the
review's, and only partly overlapping it:

1. **Swiss Ephemeris licensing.** Not an astrology question, the only irreversible
   one, and an owner decision.
2. **The Nethiram formula defect** — a value the astrologer says is wrong, on
   screen today. Display-only, so not release-blocking, but it is a known-wrong
   output and needs the printed table.
3. **2027 gazetted festival coverage**, before any later year is presented as
   complete. Now disclosed and bounded, so this is a completeness task rather than
   a correctness risk.
4. **An agreed external reference** for the golden-chart and panchangam matrices.
   This is the real remaining verification gap, and it is a decision before it is
   work.
5. **Named sources for `GO-10` and the four Kala Sarpa sub-questions**, to move
   them from `[VARIANT]` to `[TRADITION]`. Not blocking — both are disclosed as
   choices — but they are the last two rules claiming more clarity than we hold.

Everything else the review raised is either applied above or was already true.
