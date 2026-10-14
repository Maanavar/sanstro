# DOCTRINE_DECISIONS v1.7 — frequency report

_2026-10-03 · the re-run the owner's ruling on packet section B2 asked for, before any decision on consumer prominence._

## How it was measured

`scripts/doctrine_v13_frequency_sweep.py --charts 3000 --seed 20261001`: the
same 3,000 ephemeris charts as the v1.3 report
(`docs/DOCTRINE_V13_FREQUENCY_REPORT_2026-10-01.md`). Birth instants are drawn
uniformly from 1950–2010 at five Tamil Nadu town coordinates. No person is
behind any chart.

Two runs on the v1.7 tree:

- **v1.6 flags**: the four changed defaults set back with `--flag`
  (`o13_nb_raja_min_points=1`, `o18_aries_scorpio_sevvai=full_cancellation`,
  `o21_nb_planet_as_own_lord=false`, `o23_six_eight_colord_mode=moolatrikona`).
  The BPHS source-veto table has no flag, so this run is v1.6 plus the vetoes.
- **v1.7**: every default as ruled on 2026-10-03.

The published v1.6 column is from the v1.3 report's v1.6 section, for
reference.

## Results

Percent of 3,000 charts.

| Measure | v1.6 (published) | v1.6 flags + vetoes | v1.7 | Driver |
|---|---:|---:|---:|---|
| **Raja Yoga present** | 80.40 | 79.47 | **76.43** | vetoes −0.93; 3rd/11th moolatrikona test −3.04 |
| … at least one CONFIRMED pair | — | 62.10 | 56.87 | full or qualified grade |
| … MIXED pairs only | — | 17.37 | 19.57 | 6th/8th co-lord or kendradhipati |
| … a source-vetoed pair recorded on the card | — | 5.33 | 2.13 | v1.7 mostly removes Mesham Sani and Simmam Sukran before the veto is reached |
| Any graha debilitated | 44.33 | 44.33 | 44.33 | unchanged input |
| **Neecha Bhanga Raja Yoga present** | 42.10 | 42.10 | **24.67** | O-13: the name needs two conditions |
| … Mild / Moderate / Strong | 18.77 / 8.00 / 15.33 | 18.77 / 8.00 / 15.33 | — / 9.33 / 15.33 | one condition no longer carries the name |
| **நீச நிவர்த்தி (`NEECHA_NIVARTHI`)** | — | — | **22.53** | O-13: one condition |
| Budhan self-reference (`nb_self_reference`) | — | 0.00 | 4.43 | O-21 counted, tagged |
| Sevvai present | 88.20 | 88.20 | 88.20 | unchanged |
| Sevvai cancelled | 71.00 | 71.00 | 70.87 | O-18 strong mitigation: 4 charts |
| Rahu–Ketu, Lakshmi, Fortune support, Gaja Kesari, Adhi, Kala Sarpa | | | unchanged | not touched by v1.7 |

Neecha Bhanga Raja Yoga and நீச நிவர்த்தி add to more than the debilitated
share (24.67 + 22.53 > 44.33) because a chart with two debilitated grahas can
carry one of each.

## What the numbers say

1. **The doctrine corrections do not make Raja Yoga rare.** The owner's review
   expected the fixes to bring the 80.4% down. They move it four points, to
   76.4%. The source vetoes and the extended moolatrikona test remove lords
   from specific lagnas, but almost every chart still has some clean
   kendra–trikona pair linked by conjunction or mutual aspect. What keeps the
   rate high is the formulation, not the eligibility: `YOG-RY-01` sweeps every
   trikona × kendra pair, and one hit forms the yoga. The 2026-08-27 reviewer
   already asked whether that sweep is too generous. That, not a threshold, is
   the next decision if the rate is to move.
2. **Neecha Bhanga is now honest about the name.** 55.6% of charts carrying a
   debilitated graha now read Neecha Bhanga Raja Yoga (two or more conditions),
   and 50.8% carry a நீச நிவர்த்தி. Strong is unchanged at 15.3%, because
   Strong already needed three conditions.
3. **O-21's cap does work.** Self-referenced Budhan charts (4.4%) moved some
   charts into the raja-yoga card at Moderate. Strong did not rise.
4. **O-18 is a principle more than a rate.** Strong mitigation changes the
   outcome on four charts in 3,000; its value is that no Mesham/Viruchigam chart
   is told "no dosham" by the lagna alone.

## v1.8 re-run (second round of owner rulings, same day)

Same command, seed and 3,000 charts, on the v1.8 defaults (Kadagam Guru
re-admitted as a named exception; O-24 ruled `mixed`, unchanged in code).

| Measure | v1.7 | v1.8 | Change |
|---|---:|---:|---|
| **Raja Yoga present** | 76.43 | **78.63** | +2.20 (66 charts): Kadagam Guru's pairs |
| … at least one CONFIRMED pair | 56.87 | 56.87 | none — every Kadagam Guru pair grades MIXED |
| … MIXED pairs only | 19.57 | 21.77 | +2.20, the same 66 charts |
| … a source-vetoed pair recorded | 2.13 | 2.13 | none |
| Every other row above | | | unchanged to the chart |

The exception does what it was ruled to do and nothing more: the added charts
are all MIXED, none CONFIRMED. The Tamil wording changes in v1.8 are labels
only and cannot move a count.

## What this report cannot see

- It counts how often each rule fires, not whether it fires correctly. The
  rulings rest on the v1.7 fixtures (`tests/test_doctrine_decisions_v17.py`) and
  on the §18 physical-edition checks, which are still open for every new
  citation (BPHS 34 pairs, the Dhanus line, the Laghu Parashari luminary and
  node verses, Phaladeepika 7.3).
- The kendradhipati MIXED grade changes labels, not presence, so the Raja Yoga
  rate does not show O-24. Under `exclude`, the four two-kendra benefics would
  also leave; this report did not measure that branch.
- The FORMED / STRENGTH / ACTIVE NOW display model is not built, so nothing here
  says how many charts would show a Raja Yoga *headline* on a given day.
- One seed, one 60-year window; not a population sample.
