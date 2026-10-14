# DD-17 dosham frequency report (2026-10-06)

**What this measures:** how often Sevvai and Rahu–Ketu dosham are mitigated
before and after the DD-17 rulings (O-26 to O-29), and how the new residual
grade distributes.
**Command:** `python scripts/dosham_dd17_frequency_sweep.py --charts 3000 --seed 20261006`
**Sample:** 3,000 real ephemeris charts, birth instants uniform over
1950–2010 at five Tamil Nadu town coordinates (the v1.3 sweep's sampler). No
person is behind any chart. Each chart is built under both doctrines, so every
difference below is a ruling and nothing else.

"v2.0" = O-26 `from_mars`, O-27 `kendra_functional_benefic`, O-28 `off`, O-29
off (the engine before DD-17). "DD-17" = the new defaults.

## Sevvai dosham

| | Count | % of charts |
|---|---|---|
| Present | 2,636 | 87.9% |

| | v2.0 | DD-17 |
|---|---|---|
| Mitigated, % of present | 80.6% | **74.6%** |

- **O-26 (dispositor rule off).** The rule fired on 1,762 of 2,636 Sevvai
  charts (67%), and on **242** it alone decided nivarthi: with it removed those
  charts read active. This is the case the practitioner's review raised, at
  scale. A rule with no cited source was the deciding mitigation on 9% of
  Sevvai charts.
- **O-27 (dignified 7th lord protects).** 83 charts become newly mitigated:
  a strong 7th lord outside the four dual-sign lagnas, which the old test could
  never credit.
- Net: 159 fewer mitigated charts. Errors now fall toward "dosham present",
  O-18's stated preference for marriage readings.
- **Residual of the 1,966 mitigated:** 1,589 mild, 377 moderate (19%).
- **Context:** 1,120 Sevvai charts (42%) are counted only from the Moon and/or
  Venus. Those charts now carry `sevvai_not_from_lagna`, which until now no card said.

## Rahu–Ketu dosham

| | Count | % of charts |
|---|---|---|
| Present (axis on 1/7 or 2/8) | 1,041 | 34.7% |

| O-28 reading (O-29 on in all three) | Mitigated, % of present |
|---|---|
| v2.0 (O-28 off, O-29 off) | 11.1% |
| `off` | 9.2% |
| **`dignity` (default)** | **10.5%** |
| `strong_or_benefic` | 23.5% |

- **O-29 (Guru counted once)** alone takes the rate from 11.1% to 9.2%: about
  one in six mitigated axes was mitigated partly by counting one Guru aspect twice.
- **O-28.** Reusing the 8th side's broad "strong lord" test for the 2nd (any
  kendra/trikona placement, or a benefic on the house) **more than doubled**
  nivarthi, to 23.5%. That is the wrong direction for a review whose complaint
  was that mitigated doshams already read as neutralised. The default reads the
  2nd lord's dignity only (own/exaltation, unafflicted), which adds 1.3 points
  over `off`. The broad test stays an option.
- Net DD-17 vs v2.0: 109 vs 116 mitigated (13 newly, 20 no longer).
- **Residual of all 1,041 present:** 450 mild, 432 moderate, 159 strong; of
  the 109 mitigated, 58 mild and 51 moderate.
- **Context:** 455 axes do not repeat from the Moon or Venus. The Navamsa was
  read on 1,041 charts: 348 repeat the axis in D9, 693 do not. Context only;
  DD-03 keeps D9 out of the grade.

## All doshams

3,605 present-and-mitigated dosham findings across the sample: 2,969 mild
residual, 636 moderate. Before DD-17 every one of these displayed "Low
intensity", whatever its formation.

## What this cannot see

- The residual threshold (MODERATE only when a STRONG Lagna formation is offset
  by exactly the threshold) is ours; a practitioner may draw the line elsewhere.
- Sevvai's 88% presence comes from counting three references with six houses
  each. DD-17 does not change formation, so it does not touch that.
- Charts are sampled uniformly in time, not weighted to any real user population.
