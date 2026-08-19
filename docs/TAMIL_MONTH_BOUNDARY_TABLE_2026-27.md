# Tamil month boundaries — Tamil year 2026-27 (Chennai)

**Generated** by `scripts/derive_tamil_month_boundaries.py`. Do not hand-edit —
regenerate it. Every value below comes from the same ephemeris the engine uses
(Swiss Ephemeris, sidereal Lahiri; sunrise/sunset as geometric disc-centre with
no refraction, which is the printed-panchangam convention).

This table exists because doctrine A-3 asserted that the sunset and sunrise
conventions disagree on 8 of 12 months, and for one revision that number lived in
a docstring with nothing behind it. Here is the derivation.

- **Sunset rule** (implemented): the month starts on the sankranti day if the
  crossing falls before that day's sunset, otherwise the next day.
- **Sunrise rule** (competing): the month starts on the first day whose sunrise
  follows the crossing.

`Daylight` is how far through the day's light the crossing falls — 0.00 at
sunrise, 1.00 at sunset. It is the quantity any threshold rule compares against.

| Tamil month | Sankranti (IST) | Sunrise | Sunset | Daylight | Sunset rule | Sunrise rule | Agree? |
|---|---|---|---|---|---|---|---|
| சித்திரை (Chithirai) | 2026-04-14 09:32:39 | 06:00:31 | 18:18:05 | 0.288 | 2026-04-14 | 2026-04-15 | **NO** |
| வைகாசி (Vaikasi) | 2026-05-15 06:22:01 | 05:47:04 | 18:23:33 | 0.046 | 2026-05-15 | 2026-05-16 | **NO** |
| ஆனி (Aani) | 2026-06-15 12:53:00 | 05:46:20 | 18:32:25 | 0.557 | 2026-06-15 | 2026-06-16 | **NO** |
| ஆடி (Aadi) | 2026-07-16 23:39:22 | 05:54:05 | 18:35:49 | 1.399 | 2026-07-17 | 2026-07-17 | yes |
| ஆவணி (Aavani) | 2026-08-17 07:58:45 | 06:00:21 | 18:25:36 | 0.159 | 2026-08-17 | 2026-08-18 | **NO** |
| புரட்டாசி (Purattasi) | 2026-09-17 07:52:57 | 06:01:26 | 18:05:23 | 0.154 | 2026-09-17 | 2026-09-18 | **NO** |
| ஐப்பசி (Aippasi) | 2026-10-17 19:51:42 | 06:02:59 | 17:45:29 | 1.180 | 2026-10-18 | 2026-10-18 | yes |
| கார்த்திகை (Karthigai) | 2026-11-16 19:43:12 | 06:11:38 | 17:35:31 | 1.187 | 2026-11-17 | 2026-11-17 | yes |
| மார்கழி (Margazhi) | 2026-12-16 10:25:02 | 06:27:16 | 17:41:31 | 0.353 | 2026-12-16 | 2026-12-17 | **NO** |
| தை (Thai) | 2027-01-14 21:10:25 | 06:38:35 | 17:57:06 | 1.285 | 2027-01-15 | 2027-01-15 | yes |
| மாசி (Maasi) | 2027-02-13 10:09:04 | 06:35:53 | 18:10:28 | 0.307 | 2027-02-13 | 2027-02-14 | **NO** |
| பங்குனி (Panguni) | 2027-03-15 07:00:06 | 06:20:09 | 18:15:55 | 0.056 | 2027-03-15 | 2027-03-16 | **NO** |

**The two conventions disagree on 8 of 12 months:** Chithirai, Vaikasi, Aani, Aavani, Purattasi, Margazhi, Maasi, Panguni.

## Month lengths under the implemented (sunset) rule

| Tamil month | First day | Last day | Days |
|---|---|---|---|
| சித்திரை (Chithirai) | 2026-04-14 | 2026-05-14 | 31 |
| வைகாசி (Vaikasi) | 2026-05-15 | 2026-06-14 | 31 |
| ஆனி (Aani) | 2026-06-15 | 2026-07-16 | 32 |
| ஆடி (Aadi) | 2026-07-17 | 2026-08-16 | 31 |
| ஆவணி (Aavani) | 2026-08-17 | 2026-09-16 | 31 |
| புரட்டாசி (Purattasi) | 2026-09-17 | 2026-10-17 | 31 |
| ஐப்பசி (Aippasi) | 2026-10-18 | 2026-11-16 | 30 |
| கார்த்திகை (Karthigai) | 2026-11-17 | 2026-12-15 | 29 |
| மார்கழி (Margazhi) | 2026-12-16 | 2027-01-14 | 30 |
| தை (Thai) | 2027-01-15 | 2027-02-12 | 29 |
| மாசி (Maasi) | 2027-02-13 | 2027-03-14 | 30 |
| பங்குனி (Panguni) | 2027-03-15 | — | — |

## Why the anchor decides it

Puthandu — Chithirai 1, 2026 = **2026-04-14** — is gazetted by the
Tamil Nadu government. The sunrise rule places it on
2026-04-15, so the anchor excludes that convention outright.

## The open Aavani conflict

This engine produces Aavani 1, 2026 = **2026-08-17**. Multiple live
panchang sources publish **2026-08-18**.

The two claims cannot both come from a threshold rule:

- Chithirai's crossing sits at **0.288** of daylight and is assigned to its own day.
- Aavani's crossing sits at **0.159** of daylight — *earlier* — yet 18 August requires it to be pushed to the following day.

A threshold that keeps the later crossing and defers the earlier one does not
exist. So the 18 August sources are not simply using a different cut-off: either
they compute sankranti by **Vakya** (mean-motion instants, which differ from drik
by hours), or they apply a rule that is not a threshold, or an anchor is misread.
`tests/test_tamil_calendar.py` pins this argument as an executable proof.

## Evidence trail

Staged so whoever resolves this does not have to re-collect it. **Standing is
recorded honestly** — a live calculator is not a printed almanac, and nothing
below is upgraded to `SOURCE` until someone has actually seen the page.

| Evidence | Claim | Standing |
|---|---|---|
| TN Government Gazette | Puthandu / Chithirai 1, 2026 = 14 April | **ANCHOR** — gazetted, and independently carried in our own festival table. The PDF itself is not filed in this repo; filing it would close the last gap. |
| TN Government Gazette | Aadi 27 = 12 August 2026 | **CORROBORATES US** — implies Aadi 1 = 17 July, which this engine produces. Constrains where Aadi *starts*, not how long it runs, so it does not by itself imply an 18 August Aavani. |
| Live sankranti calculators | Simha sankranti ≈ 08:04 IST, 17 Aug 2026 | **CORROBORATES US** — our ephemeris gives 07:58:45, agreeing to ~5 minutes. This matters: it means the dispute is *not* about the astronomy. Both sides agree when the Sun crosses; they disagree about which civil day that opens. |
| Prokerala (3 pages, per review) | Aavani 1, 2026 = 18 August | **SEARCH_LEAD** — a live calculator, not a printed almanac, and **its system (Vakya vs Thirukanitham) is unstated**. That unknown is the crux of the whole question. |

The single most useful thing anyone can add here is a **named printed almanac**
— publisher, edition, and whether it is Vakya or Thirukanitham — showing a
month-start table for a full Tamil year. See question **Q4** in
`docs/ASTROLOGER_CONSULTATION_2026-08-19.md`.
