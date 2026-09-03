# Rulings and fixes — 2026-08-31 verification audit closure

Closes the findings raised in
[`AUDIT_15_DAY_VERIFICATION_2026-08-31.md`](AUDIT_15_DAY_VERIFICATION_2026-08-31.md).
Seven items, in the order that document recommended. Two were doctrine questions
and are ruled here; the rest were defects with a settled answer.

**The thread running through all of them:** every finding was silent. Nothing
errored, and the suite was green with two wrong doctrine values, one inert rule
and a four-day-red web test in the tree. Where a test existed it pinned the
wrong number (A-1) or asserted configuration rather than behaviour (D-1). Both
of those failure modes are addressed below, not just their instances.

---

## A-1 · Fractional drishti — the table was transposed

**The page settles it; there is no divergence to label.** The audit asked for
the physical p.245 to be checked before editing, on the possibility that the
book really prints a symmetric ramp. It does not, and the text was already on
disk — transcribed identically in two places,
[`KALAPRAKASIKA_FULL_BOOK_EXTRACTION_2026-08-28.md`](KALAPRAKASIKA_FULL_BOOK_EXTRACTION_2026-08-28.md)
and [`ASTROLOGER_DECISION_REQUEST_2026-08-28.md`](ASTROLOGER_DECISION_REQUEST_2026-08-28.md):

> *"All planets throw a full aspect to the 7th house. The 4th and 8th houses are
> aspected with **three quarters** of a sight; 5th and 9th houses with **half** a
> sight; 3rd and 10th houses with **quarter** sight."*

That is the classical Parashari table, and it is **not** symmetric: the 4th
takes three quarters while its mirror the 10th takes a quarter. The shipped
table read `4: 0.50, 5: 0.75`, ramping monotonically toward the seventh. The
code comment said so in as many words — *"rises toward the seventh and falls
symmetrically"* — which is a reconstruction, not a transcription. The descending
half was right only because a symmetric ramp and the real table happen to agree
there.

**Fixed** in [`aspects.py`](../app/calculations/aspects.py):

```python
_FRACTIONAL_DRISHTI = {3: 0.25, 4: 0.75, 5: 0.50, 7: 1.00, 8: 0.75, 9: 0.50, 10: 0.25}
```

**The internal check, now written into the file and into a test.** The tiers are
what the special aspects are *built on*, so each special-aspect graha must
promote exactly one tier: Mars takes the three-quarter pair (4, 8), Jupiter the
half pair (5, 9), Saturn the quarter pair (3, 10). p.245 says as much in the
same breath, naming Mars strongest of those aspecting with three quarters and
Jupiter strongest of those aspecting with half. Under the shipped table Mars's
own two houses read 0.50 and 0.75 — two different tiers — which could not be the
table the special aspects came from.
`test_each_special_aspect_graha_promotes_exactly_one_tier` now pins that
property, so the fractional table and the special-aspect table cannot drift
apart again without a failure.

**Blast radius, measured.** Live in `shadbala._drik_bala` and
`chart_strength`'s Bhava Bala, for every graha on every chart. Over all
(graha, source rasi, target rasi) triples a Drik Bala lookup can make,
**144 of 1008 — 14.3% — return a different strength**:

| graha | lookups moved (of 144) |
|---|---|
| Sun, Moon, Mercury, Venus, Saturn | 24 each |
| Mars, Jupiter | 12 each |

Mars and Jupiter move half as much precisely *because* they are special: each
already has one of the two transposed houses promoted to poorna, so only the
other one moves. Drik Bala scores ±10 × strength per aspecting graha, so each
moved lookup shifts that pair's contribution by 2.5 points on a 0–60 scale.

The golden fixture moved **nothing** — correctly, and worth stating: yoga presence requires
poorna drishti and `aspect_target_rasis` returns poorna only, so a change to the
*fractional* tiers cannot reach either frozen surface. That is also exactly why
the fixture did not catch this. The note is now in the fixture header.

`test_aspects.py:71` pinned `0.75` and is corrected to `0.50`.

---

## A-2 · Unassociated Mercury — ruled BENEFIC

**Ruling: a solitary Budha is a benefic.** It shipped as MALEFIC, and neither
classical reading supports that:

* Parashara lists Budha among the **natural benefics** and makes the malefic
  turn *conditional* on malefic association. A condition that never occurs
  cannot fire — "no association" is not "malefic association".
* The alternative reading makes Budha **neutral**, coloured by its company. An
  uncoloured neutral does not round to malefic either.

Malefic-by-default was the outlier, and it contradicted the Moon branch three
lines above it in the same function, which explicitly refuses to be "silently
turned into a malefic" when its context is absent. Mercury alone is the same
absence.

A **missing** Mercury position is likewise benign. That is absent data, not a
chart fact, and manufacturing a malefic out of a gap is the same error more
quietly.

**Measured consequence: one cell of 78 in the golden fixture moved.**
`spread` / `VASUMATI_YOGA`, `(False, WEAK)` → `(True, PARTIAL)`. On that chart
Budha sits alone in rasi 2, the 11th from Chandran; reclassed benefic it joins
Guru in an upachaya and tips the count from one hit to two. Vasumati asks for
benefics in upachaya houses and a solitary Budha is one, so the yoga is right to
fire. Re-frozen with that reasoning recorded at the cell.

`test_bhava_bala_penalizes_a_malefic_classified_mercury` asserted the overturned
premise in its name and its comment. Rewritten as
`test_bhava_bala_follows_mercurys_contextual_class`, which varies *only*
Mercury's company against a fixed house — the thing that actually separates "the
contextual rule is wired in" from "Mercury is on a hardcoded list":

| Mercury's company | class | Bhava Bala |
|---|---|---|
| alone | BENEFIC | 52 |
| with Saturn | MALEFIC | 45 |
| with Jupiter | BENEFIC | 55 |

---

## D-1 · `janma_tara_exempt` — a missing wire, and the wrong shape

**The rulings doc overclaimed and the code was inert.** Both were true at once.
[`ASTROLOGER_RULINGS_2026-08-28.md`](ASTROLOGER_RULINGS_2026-08-28.md) said both
exemptions were live "so a per-rite favourable reading always wins". They were
wired as `janma_tara_prohibited - janma_tara_exempt`, and neither mantra
initiation nor first milk feeding carries a `janma_tara_prohibited` set — their
chapters (Ch. X, Ch. III) are not among the six that state the bar. The
subtraction had an empty left-hand side, the factor returned `None` at every
count, and the field was dead configuration.

**Ruling: wire it, and wire it as a bonus.** Both chapters state the count
*positively* — "are beneficial" (Ch. X p.62), "will be good" (Ch. III p.32).
Modelling a commendation as a subtraction throws its polarity away. Ch. X p.62
makes the inconsistency plain: it names three things in one sentence — the tara,
the Sankaranthi day, and Wednesday. Wednesday was credited as `vara_good`.
Sankaranthi was honestly recorded in `unscored_dimensions`. The tara was
silently converted into a no-op. One sentence, three treatments.

`_janma_tara_count_factor` now reads `janma_tara_exempt` directly and emits
`BONUS` / `_W.JANMA_TARA_FAVOURED` (**+8**), checked **before** the prohibition
so apavada still beats utsarga.

**On the weight.** Deliberately not the mirror of the −20 bar. The book's
prohibitions on this triad use its strongest verbs — *"should be strictly
avoided"*, *"No manner of celebration should be held"* — while its two
commendations are mild: *"are beneficial"*, *"will be good"*. Pricing a mild
commendation like a grave prohibition would let one favourable tara outweigh a
chapter's own star doctrine. Sized above `VARA_GOOD` (6) because the personal
layer outranks a broad weekday preference in Tamil practice, and below
`NAKSHATRA_FAVOURED` (14) because the chapter calls the day good, not best.

**No collision with the birth-star bar.** `janma_nakshatra_prohibited` is set
only on Annaprasana, so neither exempting rite can bonus and veto the same day.

Verified live, count by count:

| rite | 1 | 5 | 10 | 19 |
|---|---|---|---|---|
| MANTRA_INITIATION | BONUS +8 | — | BONUS +8 | BONUS +8 |
| MILK_FEEDING | — | — | BONUS +8 | — |
| UPANAYANAM (control) | VETO | VETO | PENALTY −10 | PENALTY −5 |

**The test was the real defect.**
`test_the_janma_tara_reversal_lifts_only_its_own_rite` asserted the registry's
*values* and never that anything happened, so an inert rule read as a shipped
one. A new `test_the_janma_tara_reversal_actually_reaches_the_score` walks every
count over the snapshot fixture and asserts the factor fires, is positive, and
carries the right `rule_id`.

---

## B-1 · `doctrine-parity.test.ts` — red four days, and a third drifted cell

`dad309b` (FCR-02) symmetrised the maitri node rows in the backend — Kuja-vat
Ketu, Shani-vat Rahu, sound and correctly labelled `[PRODUCT]` — and
`web/lib/chart-utils.ts` was not updated.

**Three cells had drifted, not two.** Beyond the two the symmetry change
obviously touches (`MARS` missing `KETU` and `SATURN` missing `RAHU` in
friends), **`RAHU`'s enemy row was also missing `KETU`**. It was invisible
because the friends assertion is hard and fails first, so the enemies assertion
never ran. A half-visible drift report invites a half fix.

Both tables are synced to the backend, and the `[PRODUCT]` label on the node
rows is carried across with them so the web copy does not read as sourced. The
two assertions are now `expect.soft`, so both tables always report.

**This is the third crossing of this boundary**, all the same shape: a backend
doctrine edit no reader of the web file was told about, latent because
`getNilai` compares against a sign lord and a sign lord is never a node. The
latency is why it recurs — the parity test is the only thing that has ever
caught it. That reasoning is now recorded in `chart-utils.ts` beside the tables,
with the operative line: **a red parity test is a drift report, not a flaky
suite.**

---

## D-2 · `KutaResult.detail` now renders

`compatibility-intelligence-panel.tsx` rendered `name`, `score`, `maxScore` and
`label`, never `detail`. Since the public 10-kuta score stays binary and only
UTTAMA earns its point, a Madhyama pair scored 0 and read as a flat **FAIL**,
with the one word that would have explained it dropped on the floor.

**The band now replaces the bare PASS/FAIL rather than sitting beside it.** Two
ratings on one row read as a contradiction; the band is not a competing second
verdict, it is the same axis at a finer resolution. A short gloss appears below
the list when any kuta is Madhyama, because a bare Sanskrit grade is not much
more use to a non-astrologer than a bare FAIL.

Also fixed in the same expression: the row rendered `k.name` in both languages.
It now follows the active language, matching the sibling surface.

**Sweep re-run and confirmed** (729 star pairs):

| band | pairs | share |
|---|---|---|
| FAIL | 189 | 25.9% |
| MADHYAMA | 162 | **22.2%** |
| UTTAMA | 378 | 51.9% |

Pass rate 74.1% → 51.9%. Mean composite shift **−0.78** points
(3.5 × 22.2%).

---

## A-4 · Composite band cutoffs — deliberately NOT retuned

The 80 / 65 / 50 rungs have not moved since Porutham went 20 → 35, which gave
one kuta of ten 3.5 composite points instead of 2. **Holding, and the hold is
the ruling, not an oversight:**

1. Retuning the rungs in the same change as the rulings that moved the
   distribution would make it impossible to attribute any verdict change to
   either. This is the same rule already recorded on `ALMANAC_AMAVASAI`.
2. The −0.78 mean is small and, more to the point, **intended**. The astrologer
   ruled Madhyama earns no point; the composite falling for those pairs is the
   ruling working, not a regression to be compensated for.
3. A retune needs a measured composite distribution over **real charts**, not
   over the star grid. 65 of the 100 points come from layers no star pair
   determines, so a 27×27 sweep cannot answer the question it looks like it
   answers.

The reasoning is recorded at the rungs themselves. **A stale comment was found
and fixed while there:** the Rajju/Vedha veto note still read *"Porutham is only
20 of the 100 weighted points"*.

---

## B-2 · Stale editable install — repaired

`__editable___jothidam_ai_0_1_0_finder.py` mapped `app` to the OneDrive copy
under `GitHub\sanstro\app`, last committed 2026-06-28. Only CWD precedence kept
`D:\sanstro` working — and it did fail in this session, the moment a script was
run from a temp directory:

```
ImportError: cannot import name 'muhurta_engine' from 'app.calculations'
  (C:\Users\senth\OneDrive\...\GitHub\sanstro\app\calculations\__init__.py)
```

Reinstalled with `pip install -e . --no-deps` from `D:\sanstro`. `MAPPING` now
reads `{'app': 'D:\\sanstro\\app'}`, and `import app` resolves to the repo from
any working directory.

---

## Verification

Full backend suite plus the web parity test and a `tsc --noEmit` pass. The two
failures that appeared mid-way were both expected consequences of the A-2
ruling — the single golden cell, and the test whose name asserted the overturned
premise — and both are resolved above rather than suppressed.

## New finding — D-2 is not confined to one panel

`compatibility-intelligence-panel.tsx` was the surface the audit named, and it is
fixed. But **four more surfaces render the ten kutas and none of them reads
`detail`**, so the same 22.2% of pairs still see an unexplained FAIL there:

| surface | how it renders a kuta |
|---|---|
| `dashboard-synastry-panel.tsx` | rich row; derives status from `scoreStatusOf(score, maxScore)` |
| `tools/marriage-porutham-calculator/PoruthamTool.tsx` | public marketing calculator |
| `share/porutham/[token]/page.tsx` | `KutaRow`, which takes only a `passed` boolean |
| `public-share-card.tsx` | rendered share image, 8 bars, space-constrained |

**Not fixed here, deliberately.** These are four different renderers, not four
copies of one. `dashboard-synastry-panel` computes its verdict from the score
rather than the label, so folding the band in is a decision about
`scoreStatusOf`, not a prop. `KutaRow` has no verdict string to replace — it
takes a boolean. Bolting a band onto each without that design pass is how a row
ends up carrying two competing ratings, which is the thing the panel fix above
was careful to avoid.

`public-share-card.tsx` is likely a genuine exception: it is a fixed-size
rendered image showing the top 8 bars, and it may be right to leave the band off
there rather than crowd it.

**The scoped follow-up is one decision, not four:** how a graded band should
read on a row whose verdict is derived rather than labelled. Once that is
settled, the three list surfaces follow from it.

---

## Still open

* **D-2 (extended)** — the four surfaces above.
* **A-3** and **D-3** — unchanged, still scheduled.
* **A-4** — held above, pending a real-chart composite distribution.
* **Annaprasana's p.34 exemption** stays unencoded, per the standing
  OCR-ambiguous-numeral hold.
