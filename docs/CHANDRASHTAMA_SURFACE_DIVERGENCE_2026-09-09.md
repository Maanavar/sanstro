# Chandrashtama: four surfaces, three different questions

**Raised:** 2026-09-09 by the owner (Dhanusu rasi / Moolam nakshatram).
**Report:** "Today the almanac says Chandrashtamam is for Pooradam. The Today
hero shows me nothing, but the Family & Charts member card and Today's Rhythm
both say I am in Chandrashtamam."

**Status:** ruled and fixed the same day — see §6. Owner ruling: a person's
Chandrashtama is their janma **star's** window (~1 day), not the Moon's full
2¼-day transit of the 8th rasi.

**Note on the numbers below.** §1's window table was corrected after D6 was
found: the times this engine had been printing were themselves wrong by hours.
The table shows the true values.

---

## 1. The astrology, established first

Chandrashtama = transiting Moon in the 8th rasi from natal Moon rasi.
Dhanusu (9) → 8th = **Kadagam (4)**.

The Moon's Kadagam transit this cycle (Chennai 13.0827 / 80.2707, IST),
computed from this repo's own ephemeris:

| | |
|---|---|
| Moon enters Kadagam | **07-Sep 12:38** |
| Moon leaves Kadagam | **09-Sep 15:14** |
| Duration | ~2 d 2 h 36 m |

A Tamil almanac does not print "Dhanusu" across those 2¼ days. It splits the
stretch by **janma nakshatram**, because the affected point — the longitude
210° behind the Moon — walks Kettai → Moolam → Pooradam → Uthiradam at the
Moon's own rate, roughly one star per day:

| Affected janma star | True window (IST) | What the engine printed |
|---|---|---|
| Kettai (Vrischikam) | … → 07-Sep 12:38 | → 07-Sep 12:38 |
| **Moolam (Dhanusu)** | **07-Sep 12:38 → 08-Sep 11:02** | 08-Sep 00:00 → **16:39** |
| Pooradam (Dhanusu) | 08-Sep 11:02 → **09-Sep 09:34** | → 09-Sep **15:14** |
| Uthiradam (Makaram) | 09-Sep 09:34 → 10-Sep 08:20 | 10-Sep 00:00 → 14:04 |

The third column is D6 (§3): every boundary was late, and Moolam's opening on
the afternoon of the 7th was missing altogether. Both are fixed.

**So the owner's almanac is right, and this engine already agrees with it.**
`calculate_daily_panchangam(2026-09-09, …).chandrashtamam_today_nakshatras`
returns exactly `('POORADAM',)`. Moolam's window closed yesterday at 16:39.

Verdict on the report: **the Today hero is correct today and Family & Charts is
wrong** — but the hero is correct by accident, for a reason unrelated to the
nakshatra. It would show the same blank to a Pooradam native today, on the one
day the almanac names them.

---

## 2. Why the surfaces disagree

Three different questions are being asked of the same fact.

### Question A — "was the Moon in the 8th rasi for *most of the solar day*?"

`app/services/daily_guidance_service.py:437-449`

```python
moon_score, chandrashtama_fraction = weighted_moon_score(...)
chandrashtama = chandrashtama_fraction >= 0.5
```

`weighted_moon_score` (`app/services/_dg_scoring.py:571-603`) takes
`limb_fraction(moon_rasi_spans, …)` over **sunrise → next sunrise**.

Today, Dhanusu's share = **0.384** (Kadagam 06:01 → 15:14 out of a 24 h 00 m
solar day) → below the 0.5 gate → `isChandrashtama: false`.

Consumers: the **Today hero pill**
(`web/components/dashboard-today-tab-nova.tsx:817`), week-ahead
`chandrashtamaDays`, the daily push cron, the journal mood correlation.

### Question B — "is the Moon in the 8th rasi at *this instant*?"

`app/services/transit_service.py:91`

```python
chandrashtama = is_chandrashtama(natal_moon_rasi, moon_position.rasi)
```

The instant is **local solar noon** — `family_vault_service.py:269, 417, 502`
pass `solar_noon_utc`, and `/gochar/current` called with a `date` resolves to
`local_noon_as_utc_for_profile` (`transit_service.py:107-114`). At 12:00 today
the Moon is still in Kadagam (it leaves at 15:14) → **true**.

Consumers: **Family & Charts member card** (`CHANDRASHTAMA` tag,
`web/lib/family-flags.ts:96`), **Today's Rhythm** `careMembers`
(`dashboard-family-charts-hybrid.tsx:952`), and — note — the **Gochar
Chandrashtama card in the Today tab's own deep dive**
(`dashboard-today-deepdive-extras-nova.tsx:370`).

### Question C — "which janma *star* does the 8th rasi fall on right now?"

`app/calculations/panchangam.py:1533-1577`

```python
def _chandrashtamam_janma_nakshatra_name_at_jd(jd):
    janma_longitude = normalize_longitude(_nakshatra_angle_at_jd(jd) - 210.0)
    return NAKSHATRA_NAMES[nakshatra_from_degree(janma_longitude) - 1]
```

This is the almanac reckoning, and it is correct. **It is never matched against
any user's own natal Moon nakshatra.** It reaches the UI only as an impersonal
list on the Panchangam/Calendar surfaces, and as the subtitle of a card whose
*visibility* is decided by Question B.

---

## 3. Defects

### D1 — Two personal flags, two different questions, guaranteed to diverge

A ≥0.5-of-solar-day gate and a noon point-sample disagree on **every day the
Moon changes rasi** — about 2 days in 9 for any given user, i.e. every
chandrashtama stretch has at least one contradicting day at each end.

Worked both ways this week for Dhanusu:

| Date | Day share | Hero (A) | Noon sample (B) | Agree? |
|---|---|---|---|---|
| 07-Sep | 0.724 | **true** | false (Moon in Mithunam at noon) | ✗ |
| 08-Sep | 1.000 | true | true | ✓ |
| **09-Sep** | **0.384** | **false** | **true** | **✗ ← reported** |
| 10-Sep | 0.000 | false | false | ✓ |

Note 07-Sep inverts the same bug: the hero flagged a day the member card did not.

### D2 — The Today tab contradicts itself, on one screen

The hero pill (A) and the deep-dive Gochar card (B) are on the same page and
read different fields. Right now the pill is absent while the card below it is
present — and the pill, when it does render, is an anchor to that very card
(`href="#nova-deep-dive"`). Whatever ruling comes out of §4, these two must read
one field.

### D3 — Neither personal flag is nakshatra-aware

Both A and B are rasi-granular, so both are necessarily wrong for 2 of the 3
stars in a rasi on any given day of the stretch:

- A Moolam native (this report) is flagged by B on **Pooradam's** day.
- A Pooradam native gets **no hero pill today** — same 0.384 share — on the one
  day the almanac prints their star.

### D4 — `ChandrashtamaCard` contradicts its own printed numbers

`web/components/dashboard-personal-shared.tsx:60` renders `windowsSummary`,
built by `formatChandrashtamaWindowSummary` from the Question-C windows. For
this owner today the card asserts Chandrashtama and then prints
**"Pooradam 00:00 – 15:14"** underneath — someone else's star. Same shape as the
recorded `explanation-must-match-its-own-numbers` rule.

### D6 — the window boundaries were searched on the wrong grid

Found while preparing the fix, and the reason §1's table needed correcting.

The affected point is `Moon − 210°`, and **210° is 15.75 nakshatras** — not a
whole number. So the affected star turns over on a grid sitting 10°, three
padas, away from the Moon's own nakshatra grid. The walk stepped on the Moon's
nakshatra (13°20′) and rasi (30°) boundaries and read the affected star's name
at the *start* of each step, so the reported name stayed stale until the next
coarse step.

Measured against 5-minute sampling of `nakshatra(Moon − 210°)`:

| Handover | True | Reported | Error |
|---|---|---|---|
| Moolam → Pooradam | 08-Sep 11:02 | 08-Sep 16:39 | +5 h 37 m |
| Pooradam → Uthiradam | 09-Sep 09:34 | 09-Sep 15:14 | +5 h 40 m |
| Uthiradam → Thiruvonam | 10-Sep 08:20 | 10-Sep 14:04 | +5 h 44 m |

Harmless while the windows were decoration on an almanac page. Not harmless
once the personal flag is keyed to them.

### D5 — `_chandrashtamam_janma_nakshatra_windows` truncates the day

`app/calculations/panchangam.py:1539-1577` is passed the Moon's rasi at the
panchangam's reference moment (sunrise) and walks only while
`current_moon_rasi == moon_rasi_number`, `break`ing once it has left. On any
rasi-change day the rest of the civil day is silently dropped:

- **07-Sep** lists only `('KETTAI',)` 00:00→12:38. **Moolam's window opens at
  12:38 that day and appears nowhere.**
- **09-Sep** lists only `('POORADAM',)` 00:00→15:14. Uthiradam from 15:14 is dropped.

Second defect in the same function: the windows are bounded by the **civil day**
(`_civil_day_bounds_jd`, 00:00→00:00) while Question A's share is bounded by the
**solar day** (sunrise→sunrise). Three day-definitions inside one feature.

`tests/test_panchangam.py:477-481` asserts only that windows exist, are ordered,
bracket sunrise, and carry real nakshatra names — none of which the truncation
violates. That is why it has survived since v24.

---

## 4. The ruling needed

§4.11 of the frozen spec
(`docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md:801-813`),
verbatim:

> Chandrashtama occurs when the transiting Moon is 8th from natal Moon Rasi.
> This platform freezes the Tamil Thirukanitham standard as **rasi-based, not
> nakshatra-count based**. Do not compute Chandrashtama as the 8th nakshatra from
> Janma Nakshatra; Janma Nakshatra, Anujanma, and Trijanma remain separate
> nakshatra-based checks.

**This does not block the almanac reckoning, and that is the key point.** What
§4.11 forbids is the *count* rule — janma nakshatra + 8, an offset of 106°40'.
Question C is not that. It is the identical 210° offset §4.11 mandates, merely
resolved at nakshatra granularity instead of rasi granularity. The star window
is a strict sub-interval of the rasi window. Adopting it is a refinement of
§4.11, not a reversal of it.

So the ruling is about **duration**, not about method:

- **Option 1 — rasi span (~2¼ days/cycle).** Every Dhanusu native flagged
  07-Sep 12:38 → 09-Sep 15:14. Literal §4.11.
- **Option 2 — star window (~1 day/cycle).** Moolam 07-Sep 12:38 → 08-Sep 16:39;
  Pooradam 08-Sep 16:39 → 09-Sep 15:14. What the printed panchangam says, and
  what a reader who checks their star expects.
- **Option 3 — rasi flags, star window ranks.** Flag on for the full rasi span,
  with the reader's own star window called out as the peak inside it.

**Owner ruled Option 2** on 2026-09-09.

Implementation note: the flag is keyed to the star standing **at sunrise** (the
உதய rule), not to "does my star's window touch this day". That is what gives
each star exactly one day, which is the property an almanac reader relies on —
and it is verified as a property, not assumed, in
`test_chandrashtamam_sunrise_star_gives_each_star_exactly_one_day`.

The *score* penalty is deliberately left on the rasi share. §4.11's graded
`-25 × share` is a defensible reading of the classical rule, and moving it would
change every user's daily number — a separate decision, not a bug fix. Only the
display/alert boolean moved, which is what the code comment beside it always
said it was for.

---

## 6. What shipped

| File | Change |
|---|---|
| `app/calculations/astro.py` | New primitives beside `is_chandrashtama`: `chandrashtama_janma_angle` / `chandrashtama_janma_nakshatra`, with the 15.75-nakshatra trap documented at the definition. |
| `app/calculations/panchangam.py` | D5+D6: the windows are now produced by `limb_spans_between` over a new `"chandrashtama_janma_nakshatra"` limb whose boundary search uses the *shifted* angle — so the grid can no longer drift from the value — and cover the civil day end to end. New persisted scalars `chandrashtamam_affected_janma_nakshatra_number` / `_name` (the star at sunrise). Cache version 43 → **44**. |
| `app/services/daily_guidance_service.py` | D3: the badge is now `affected star at sunrise == janma nakshatra`, replacing `chandrashtama_fraction >= 0.5`. Falls back to the old gate for a pre-v44 cached snapshot. |
| `app/services/transit_service.py` | D1+D2: `_chandrashtama_on_local_day` replaces the solar-noon rasi sample and asks the identical question, sampling sunrise. Polar no-sunrise dates fall back to §4.11 at noon. |
| `tests/test_panchangam.py` | Three regression tests: full-day tiling (the 07-Sep truncation), boundaries on the affected-star grid (the 08-Sep 11:02 handover), and one-star-per-day handover across a six-day stretch. |

**No frontend change was needed, and none was made.** Both backend fields now
answer the same question, so the four web call sites that read them — the hero
pill, the deep-dive Gochar card, the family member card and Today's Rhythm —
agree without being touched. `memberIsChandrashtama` ORs the transit flag with
the vault's `CHANDRASHTAMA` tag; both derive from the corrected fields.

`TransitSnapshotData.is_chandrashtama` keeps its name and shape but its
semantics tighten from "Moon in the 8th rasi at the instant you asked" to
"today is this chart's Chandrashtama". Mobile already read the daily-guidance
field (`mobile/app/(tabs)/today.tsx:138`), so it inherits the fix.

### Verified

```
date         sunrise star (names the day)   Moolam?   Pooradam?
2026-09-07   KETTAI                         False     False
2026-09-08   MOOLAM                         True      False     <- owner's day
2026-09-09   POORADAM                       False     True      <- reported day
2026-09-10   UTHIRADAM                      False     False
2026-09-11   THIRUVONAM                     False     False
```

Engine and calculation suites — `test_panchangam`, `test_calculations`,
`test_chandrashtama_end`, `test_intraday_panchangam_spans`, `test_panchangam_api`
— **240 passed**.

API and service suites over both changed flags — `test_transits_api`,
`test_transits_calculations`, `test_daily_guidance_api`, `test_family_vaults_api`,
`test_astrology_shared_rules`, `test_muhurta_engine`, `test_chandrashtama_end`
— **132 passed**.

Ruff clean on all five changed files. Separately verified that the two code
paths sample the identical sunrise Moon longitude across 60 consecutive days
(0 divergences) — the property D1 depends on, and the one that lets the four
web call sites stay untouched.

Local runs are not authoritative here; CI is.

### Left open

- **Three day-definitions in one feature.** The windows are civil-day bounded
  (00:00→00:00), the score share is solar-day bounded (sunrise→sunrise), and
  the badge is now sunrise-keyed. The badge and the almanac agree, which was
  the complaint; the window list still starts its first row at 00:00 rather
  than at sunrise. Cosmetic today, worth a ruling before anything else keys off
  the window edges.
- **`chandrashtamam_affected_janma_rasi_number`** remains derived from the
  sunrise Moon rasi and can now name a different rasi from the one the later
  windows in the same payload imply on a rasi-change day. Nothing personal
  reads it; flagged so the next reader does not assume it agrees.
- **D4** resolves as a consequence of D3 — the card's `windowsSummary` and its
  visibility now derive from the same star — but the summary still prints every
  star of the day rather than highlighting the reader's own. Worth doing.
- **`muhurtham_naal_service.py:363`** computes its own `is_chandra` and was not
  touched. Check it against this ruling before the next muhurtham change.

---

## 5. Reproduction

```powershell
Set-Location 'D:\sanstro'
$env:PYTHONUTF8 = "1"; $env:PYTHONIOENCODING = "utf-8"
```

```python
from datetime import date
from app.calculations.panchangam import calculate_daily_panchangam
from app.calculations.astro import chandrashtama_rasi_from_janma
from app.services._dg_scoring import limb_fraction

for d in (date(2026, 9, 7), date(2026, 9, 8), date(2026, 9, 9), date(2026, 9, 10)):
    p = calculate_daily_panchangam(d, 13.0827, 80.2707, "Asia/Kolkata")
    share = limb_fraction(p.moon_rasi_spans, lambda s: s.number == chandrashtama_rasi_from_janma(9))
    print(d, p.chandrashtamam_today_nakshatras, f"{share:.3f}", share >= 0.5)
```

```
2026-09-07 ('KETTAI',)                 0.724 True
2026-09-08 ('MOOLAM', 'POORADAM')      1.000 True
2026-09-09 ('POORADAM',)               0.384 False
2026-09-10 ('UTHIRADAM', 'THIRUVONAM') 0.000 False
```

No personal data is used: Dhanusu rasi is passed as the bare rasi number 9.
