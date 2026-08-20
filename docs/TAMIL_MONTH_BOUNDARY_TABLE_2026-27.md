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

**Engine** is what `tamil_solar_date` actually returns. It equals the sunset
rule everywhere except where a verified published-calendar boundary overrides
it — those rows are marked ⚠ and listed again below.

| Tamil month | Sankranti (IST) | Sunrise | Sunset | Daylight | Sunset rule | Sunrise rule | Agree? | Engine |
|---|---|---|---|---|---|---|---|---|
| சித்திரை (Chithirai) | 2026-04-14 09:32:39 | 06:00:31 | 18:18:05 | 0.288 | 2026-04-14 | 2026-04-15 | **NO** | 2026-04-14 |
| வைகாசி (Vaikasi) | 2026-05-15 06:22:01 | 05:47:04 | 18:23:33 | 0.046 | 2026-05-15 | 2026-05-16 | **NO** | 2026-05-15 |
| ஆனி (Aani) | 2026-06-15 12:53:00 | 05:46:20 | 18:32:25 | 0.557 | 2026-06-15 | 2026-06-16 | **NO** | 2026-06-15 |
| ஆடி (Aadi) | 2026-07-16 23:39:22 | 05:54:05 | 18:35:49 | 1.399 | 2026-07-17 | 2026-07-17 | yes | 2026-07-17 |
| ஆவணி (Aavani) | 2026-08-17 07:58:45 | 06:00:21 | 18:25:36 | 0.159 | 2026-08-17 | 2026-08-18 | **NO** | ⚠ **2026-08-18** |
| புரட்டாசி (Purattasi) | 2026-09-17 07:52:57 | 06:01:26 | 18:05:23 | 0.154 | 2026-09-17 | 2026-09-18 | **NO** | ⚠ **2026-09-18** |
| ஐப்பசி (Aippasi) | 2026-10-17 19:51:42 | 06:02:59 | 17:45:29 | 1.180 | 2026-10-18 | 2026-10-18 | yes | 2026-10-18 |
| கார்த்திகை (Karthigai) | 2026-11-16 19:43:12 | 06:11:38 | 17:35:31 | 1.187 | 2026-11-17 | 2026-11-17 | yes | 2026-11-17 |
| மார்கழி (Margazhi) | 2026-12-16 10:25:02 | 06:27:16 | 17:41:31 | 0.353 | 2026-12-16 | 2026-12-17 | **NO** | 2026-12-16 |
| தை (Thai) | 2027-01-14 21:10:25 | 06:38:35 | 17:57:06 | 1.285 | 2027-01-15 | 2027-01-15 | yes | 2027-01-15 |
| மாசி (Maasi) | 2027-02-13 10:09:04 | 06:35:53 | 18:10:28 | 0.307 | 2027-02-13 | 2027-02-14 | **NO** | 2027-02-13 |
| பங்குனி (Panguni) | 2027-03-15 07:00:06 | 06:20:09 | 18:15:55 | 0.056 | 2027-03-15 | 2027-03-16 | **NO** | 2027-03-15 |

**The two conventions disagree on 8 of 12 months:** Chithirai, Vaikasi, Aani, Aavani, Purattasi, Margazhi, Maasi, Panguni.

## Month lengths as the engine returns them

| Tamil month | First day | Last day | Days |
|---|---|---|---|
| சித்திரை (Chithirai) | 2026-04-14 | 2026-05-14 | 31 |
| வைகாசி (Vaikasi) | 2026-05-15 | 2026-06-14 | 31 |
| ஆனி (Aani) | 2026-06-15 | 2026-07-16 | 32 |
| ஆடி (Aadi) | 2026-07-17 | 2026-08-17 | 32 |
| ஆவணி (Aavani) | 2026-08-18 | 2026-09-17 | 31 |
| புரட்டாசி (Purattasi) | 2026-09-18 | 2026-10-17 | 30 |
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

## The Aavani boundary — why it is an override and not a rule change

The sunset rule computes Aavani 1, 2026 = **2026-08-17**. The published
Tamil calendar places it on **2026-08-18**, and the engine follows the published
calendar for this boundary via a named, regression-tested override.

It has to be an override rather than a different threshold, because the two
dates cannot both come from a threshold rule:

- Chithirai's crossing sits at **0.288** of daylight and is assigned to its own day.
- Aavani's crossing sits at **0.159** of daylight — *earlier* — yet 18 August requires it to be pushed to the following day.

A threshold that keeps the later crossing and defers the earlier one does not
exist. So the published calendar is not simply using a different cut-off: either
it computes sankranti by **Vakya** (mean-motion instants, which differ from drik
by hours), or it applies a rule that is not a threshold at all.
`tests/test_tamil_calendar.py` pins this argument as an executable proof — which
is exactly why the correction is scoped to one named month rather than applied
as a new universal rule.

## What the authority's own table reveals about its system

The authority is **Sri Gnanananda Panchangam**, 2026–27 edition
(<https://gnanananda.org/wp-content/uploads/2026/03/panchangam26_27.pdf>), imported as a complete twelve-month set rather
than as isolated patches. That completeness is what makes the following check
possible — and it is the strongest evidence in this document.

Sorted by how far into daylight each crossing falls, with what the authority
does about it:

| Daylight | Tamil month | Authority | Matches |
|---|---|---|---|
| 0.046 | வைகாசி (Vaikasi) | 2026-05-15 (same day) | **sunset** rule |
| 0.056 | பங்குனி (Panguni) | 2027-03-15 (same day) | **sunset** rule |
| 0.154 | புரட்டாசி (Purattasi) | 2026-09-18 (next day) | **sunrise** rule |
| 0.159 | ஆவணி (Aavani) | 2026-08-18 (next day) | **sunrise** rule |
| 0.288 | சித்திரை (Chithirai) | 2026-04-14 (same day) | **sunset** rule |
| 0.307 | மாசி (Maasi) | 2027-02-13 (same day) | **sunset** rule |
| 0.353 | மார்கழி (Margazhi) | 2026-12-16 (same day) | **sunset** rule |
| 0.557 | ஆனி (Aani) | 2026-06-15 (same day) | **sunset** rule |
| 1.180 | ஐப்பசி (Aippasi) | 2026-10-18 (next day) | both (rules agree) |
| 1.187 | கார்த்திகை (Karthigai) | 2026-11-17 (next day) | both (rules agree) |
| 1.285 | தை (Thai) | 2027-01-15 (next day) | both (rules agree) |
| 1.399 | ஆடி (Aadi) | 2026-07-17 (next day) | both (rules agree) |

**This is not a threshold rule, and the authority's own data proves it.** Of the
crossings that happen in daylight, it defers only Purattasi (0.154), Aavani (0.159) to the next day — while keeping Vaikasi (0.046), Panguni (0.056) on the same day despite those crossings being *earlier*, and also keeping Chithirai (0.288), Aani (0.557), Margazhi (0.353), Maasi (0.307) on the same day when they are *later*.

A cut-off that defers a middle band while accepting both the earlier and the
later crossings does not exist. What this establishes with certainty is the
negative: **the authority is not applying any threshold to the instants we
compute.** Two readings remain, and the data here cannot separate them —

1. it works from **different sankranti instants** (Vakya mean-motion rather than
   drik), so its own "before sunset" test lands differently; or
2. it works from the same instants under a rule that is not a threshold at all.

Reading 1 is the more likely — a few hours' shift in two instants is exactly the
scale of Vakya-vs-drik divergence — but it is a hypothesis, and it is recorded
as one.

**Why this matters practically.** It means the override table is not a list of
corrections to our rule; it is a second calendar system recorded verbatim. The
durable fix is a Vakya sankranti source, after which these entries become
derivable rather than transcribed. Until then the complete-set discipline in
`app/data/tamil_calendar_authority.py` is what keeps it honest. Confirming the
system is question **Q4** in `docs/ASTROLOGER_CONSULTATION_2026-08-19.md`.

**One boundary to watch:** the authority covers Chithirai 2026 – Panguni 2027
only. Dates outside that window fall back to the computed sunset rule, so the
convention changes at the edge of coverage. A later edition must be imported as
a complete set before that window lapses.

## Evidence trail

Staged so whoever resolves this does not have to re-collect it. **Standing is
recorded honestly** — a live calculator is not a printed almanac, and nothing
below is upgraded to `SOURCE` until someone has actually seen the page.

| Evidence | Claim | Standing |
|---|---|---|
| **Sri Gnanananda Panchangam**, 2026–27 | All twelve month starts | **SOURCE — the adopted authority.** Named publisher, named edition, complete April–March set, filed at `app/data/tamil_calendar_authority.py`. This is what the engine reproduces. |
| TN Government Gazette | Puthandu / Chithirai 1, 2026 = 14 April | **ANCHOR** — gazetted, independently carried in our festival table, and **the authority agrees with it**. The PDF itself is not filed in this repo; filing it would close the last gap. |
| TN Government Gazette | Aadi 27 = 12 August 2026 | **CORROBORATES BOTH** — implies Aadi 1 = 17 July, which the engine and the authority both give. Under the authority's 18 August Aavani, Aadi runs 17 Jul – 17 Aug (32 days) and Aadi 27 lands on 12 August exactly as gazetted. |
| Live sankranti calculators | Simha sankranti ≈ 08:04 IST, 17 Aug 2026 | **CORROBORATES OUR EPHEMERIS** — we compute 07:58:45, agreeing to ~5 minutes. The disagreement was never about the astronomy. |
| Prokerala (3 pages, per review) | Aavani 1, 2026 = 18 August | **SEARCH_LEAD**, now superseded as evidence by the adopted authority above — but it agrees with it, and its own system remains unstated. |

The evidence bar this document originally set — *a named printed almanac,
publisher and edition, showing a month-start table for a full Tamil year* — **has
been met**. What remains open is narrower and is question **Q4** in
`docs/ASTROLOGER_CONSULTATION_2026-08-19.md`: whether that almanac computes by
Vakya or Thirukanitham. The answer decides whether these twelve dates stay
transcribed or become derivable.
