# DOCTRINE_DECISIONS v1.3 — frequency report (before vs after)

_2026-10-01 · required by `docs/DOCTRINE_DECISIONS_V1.2.md` §17 for DD-02, DD-03 and DD-09._

## How it was measured

`scripts/doctrine_v13_frequency_sweep.py --charts 3000 --seed 20261001`, run twice
on the same 3,000 charts:

- **Before**: a clean worktree at `987a061`, the commit before this work.
- **After**: the working tree with P0 + P1 applied, all open items at their
  §16 defaults.

The charts are real ephemeris charts from the production chart builder
(`_chart_response_from_profile`): birth instants drawn uniformly from 1950–2010
at five Tamil Nadu town coordinates. They are not random rasi maps, so Budhan
and Sukran stay near Suriyan and the strength scores are the shipped ones. No
person is behind any chart. A third run flips one open item (O-19) to show how
much it moves Neecha Bhanga.

## Results

Percent of 3,000 charts.

| Measure | Before | After | Driver |
|---|---:|---:|---|
| **Lakshmi Yoga present** | 6.03 | **1.07** | DD-02: dignity and a kendra are now required |
| Fortune support (`BHAGYA_SUPPORT`) | — | 36.50 | DD-02 fallback; did not exist before |
| **Rahu–Ketu dosham present** | 66.43 | **32.87** | DD-03: houses 5/9 no longer form it (before, the 5/9 "sarpa" axis was a second third of all charts) |
| Rahu–Ketu, Strong | 46.03 | 14.23 | DD-03 graded model |
| Rahu–Ketu, Moderate | 20.40 | 9.20 | |
| Rahu–Ketu, Mild | — | 6.30 | |
| Rahu–Ketu, mitigated (nivarthi) | **0.00** | **3.13** | DD-03 P0: the `strong_affliction` veto made nivarthi impossible on every axis chart |
| Any graha debilitated | 44.33 | 44.33 | unchanged input |
| **Neecha Bhanga Raja Yoga present** | 40.30 | **43.27** | DD-09: Phaladeepika rules replace the old four |
| … graded Mild / Moderate / Strong | — / 40.30 / — | 18.60 / 8.10 / 16.57 | DD-09: every present card used to read Moderate |
| Raja Yoga present | 91.50 | 80.40 | DD-07: mutual aspect only (O-15), matrix eligibility |
| Sevvai present | 88.20 | 88.20 | unchanged presence |
| Sevvai cancelled | 71.73 | 71.00 | DD-06: Kadagam/Simmam no longer cancels on its own |

### P2 follow-up — same 3,000 charts and seed

The “before” column here is the v1.3 working tree immediately before DD-01,
DD-08 and DD-10 were implemented; “after” is the completed P2 tree. Because
the broad keys changed meaning, the Gaja Kesari and Adhi rows are intentionally
shown as families rather than pretending they are like-for-like labels.

| Measure | Before | After | Driver |
|---|---:|---:|---|
| Gaja Kesari supportive Moon-kendra geometry | 33.40 | 26.10 | DD-01: 10.07% qualify for the strict label and are hidden from the base card; overlap means the two after rows should not be added to infer the old count |
| `GAJA_KESARI_PARASHARA` strict | — | **10.07** | Kendra from Lagna or Moon + dynamic-benefic support + dignity exclusions |
| Adhi pre-split `>=2` result | 12.87 | — | Retired combined meaning |
| `ADHI_BASE` (`>=1` dynamic benefic) | — | **44.20** | DD-08 broad geometry layer |
| `ADHI_RAJA_GRADE` candidate | — | **6.00** | Clean, uncombust candidate under O-20's occupant-only default |
| Kala Sarpa present | 5.73 | **5.73** | DD-10 changes only float-boundary equality; no sampled chart landed inside the `1e-6` boundary |

### v1.6 review fixes — same 3,000 charts and seed (2026-10-02)

"Before" is the v1.5 tree above; "after" is v1.6 at its defaults.

| Measure | v1.5 | v1.6 | Driver |
|---|---:|---:|---|
| Rahu–Ketu present | 32.87 | 32.87 | unchanged formation |
| … Strong | 14.23 | **5.40** | DD-03 arithmetic: the Strong ceiling now applies before mitigations, so each mitigation lowers the grade one step |
| … Moderate | 9.20 | 9.87 | |
| … Mild | 6.30 | 13.57 | |
| … mitigated (nivarthi) | 3.13 | **4.03** | charts with two or more aggravations can now reach it |
| Neecha Bhanga Raja Yoga present | 43.27 | **42.10** | O-21 default: a debilitated Budhan no longer cancels itself (NB-e) |
| … Mild / Moderate / Strong | 18.60 / 8.10 / 16.57 | 18.77 / 8.00 / 15.33 | |
| `ADHI_BASE` present | 44.20 | **38.20** | one Adhi card: the 6.00% that form the raja-grade candidate no longer also show the base |
| `ADHI_RAJA_GRADE` present | 6.00 | 6.00 | unchanged |
| Strict Gaja Kesari / base | 10.07 / 26.10 | 10.07 / 26.10 | O-22 default is the literal reading |
| Raja Yoga present | 80.40 | 80.40 | O-23 default keeps the 2026-09-23 test |

**What each new open item moves** (same charts, one alternative at a time):

| Switch | Measure | Default | Alternative |
|---|---|---:|---:|
| O-21 `doctrine_o21_nb_planet_as_own_lord=true` | Neecha Bhanga present | 42.10 | 43.27 |
| O-22 `doctrine_o22_gk_moon_as_support=false` | Strict Gaja Kesari / base | 10.07 / 26.10 | 7.00 / 29.17 |
| O-23 `doctrine_o23_six_eight_colord_mode=lordship_only` | Raja Yoga present | 80.40 | 86.80 |

O-21 and O-22 were measured in one run; they touch different cards, so neither
row is confounded by the other.

**O-19 sensitivity** (same charts, `--flag doctrine_o19_nb_moon_self_reference=false`):
Neecha Bhanga present 43.27 → 40.87. Only 72 of 3,000 charts depend on
reading "kendra from the Moon" as true for the Moon itself.

## What the numbers say

1. **Lakshmi fell by more than four-fifths.** That is the intent of DD-02 ("current
   rule broader than every source"). Most of what used to be Lakshmi now reads
   Fortune support, which is common (36.5%) because it asks only for a
   well-placed 9th lord. Its frequency is a Tier C label's, not a yoga's.
2. **Rahu–Ketu halved, and became gradeable.** The halving is the 5/9 removal,
   not a change in the 1/7 and 2/8 axis — that still forms on about a third
   of charts, as DD-03 says. Within it, Strong fell from always to 43% of axis
   charts, and 9.5% of axis charts now reach nivarthi.
3. **Neecha Bhanga did not get rarer — it got honest about strength.** With
   "any one condition" (DD-09), 97.6% of charts carrying a debilitated graha also
   carry a cancelled one. The decision file foresaw this ("NBRY will fire on
   many charts. Consumer UI must show strength"). The grade now does that work:
   43% of present cards read Mild, 19% Moderate, 38% Strong. O-19 is not
   the cause; the any-one rule is.
4. **Raja Yoga fell 11 points** under the mutual-aspect reading. It still forms
   on four charts in five; the all-pairs sweep the 2026-08-27 reviewer asked
   about (`YOG-RY-01`) is still generous.
5. **The P2 labels separate frequency from authority.** The broad Adhi geometry
   is common (44.2%), while the candidate raja-grade is 6.0%. Strict Gaja Kesari
   is 10.07%; the supportive base remains visible on 26.1% after strict wins the
   label. These rates describe the implemented filters, not textual validation.

## What this report cannot see

- It counts how often each rule fires, not whether it fires correctly. Correctness
  rests on the per-DD fixtures (`tests/test_doctrine_decisions_v13.py`) and on
  the §18 source checks, which are still open.
- The Tier C cut-offs it exposes — 38% of Neecha Bhanga cards at Strong; Fortune
  support on a third of charts — are calibration questions for the practitioner,
  not defects. They are reported here so they can be ruled on, not tuned in code.
- One seed and one 60-year window. A uniform draw over instants weights each
  sign by its rising time at these latitudes, as real births do; it is not a
  population sample.
- The sweep counts Sevvai presence/cancellation, not its strength distribution,
  so it cannot quantify how often the new combustion and Sani/Rahu residual
  aggravations raise a surviving result by one rung.
