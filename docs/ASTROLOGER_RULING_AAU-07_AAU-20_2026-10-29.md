# Ruling: AAU-07 and AAU-20, "is today good?" (2026-10-29)

**Ruled by:** Claude, acting as the astrologer at the owner's request. **Countersign pending** by a
Tamil practitioner before it enters `DOCTRINE_DECISIONS_V1.md`. Format and layer tags follow the
consolidated rulings of the same date (கணிதம் / பலன் / grading).

| Part | Ruling | Layer | Status |
|---|---|---|---|
| A. Scope | The badge, the PDF day block and the push fallback answer **one** question: is today good for beginning ordinary new work? The push's main score answers a second question (for you), and must say so. | Grading | Settled, policy |
| B. Star lists | One table: the seven classical nakshatra classes. 16 stars fit, 2 mixed, 9 unfit. **Magam and Moolam are unfit for ordinary new work.** | பலன் | Settled |
| C. Which star | An act is judged on the star in force when it begins. A whole-day verdict reads the **daytime** (sunrise to sunset). If the star changes during the daytime, the verdict is split and every surface prints the change time. | பலன் + grading | Settled (principle), policy (day collapse) |
| D. AAU-20 | The PDF prints the star it scored. On a split day it prints both with the change time, the way a panchangam does. | Display | Settled |

---

## A. Scope: one question, asked three times

The code already answers the scope question. F-PAN-01 redefined the badge flag
(`_compute_subha_muhurtham_broad`, `panchangam.py:1547`) as "a broad good day for ordinary new work,
**not** a wedding muhurtham day". The wedding list is the almanac's `muhurtham_naals`. The PDF day
block (`pdf_export_service.py:727`) and the push fallback (`daily_push_cron.py:292`) read only the
panchangam, never the chart. All three are general, chart-free verdicts on the same day, so they are
the same question and may not disagree.

The push's **main** path (`get_daily_guidance`) is different. It folds in tarabala, Chandrashtama and
dasa, so it answers "is today good **for you**?". It may differ from the badge, but only when it says
why. Example copy: "A good day in general. For you, Chandrashtama runs until 14:10."

**Ruling.** Build one module, `day_quality(date, place)`, that every general verdict reads. The
personal score labels itself as personal, and wherever it contradicts the general verdict, it names
its reason.

## B. Star lists: from seven classes, not three hand-lists

The three lists disagree because each was typed for a different purpose. The 17-star badge list
mixes in **marriage** stars: Magam, Moolam, Uthiram, Uthiradam and Uthirattathi all appear on Muhurta
Chintamani's vivaha list. The 11-star daily list is a narrower general list. The 4-star caution list
is a partial set of the harsh stars.

Muhurta Chintamani (nakshatra prakarana) sorts all 27 stars into seven classes by the kind of work
each one suits. That is the sourced answer to "good for ordinary new work":

| Class | Stars | Suits | Ordinary new work |
|---|---|---|---|
| Dhruva / Sthira (fixed) | Rohini 4, Uthiram 12, Uthiradam 21, Uthirattathi 26 | foundations, lasting work | **Fit** |
| Chara (movable) | Punarpoosam 7, Swathi 15, Thiruvonam 22, Avittam 23, Sadhayam 24 | travel, vehicles | **Fit** |
| Kshipra / Laghu (swift) | Aswini 1, Poosam 8, Hastham 13 | trade, medicine, learning | **Fit** |
| Mridu / Maitra (soft) | Mirugaseeridam 5, Chithirai 14, Anusham 17, Revathi 27 | arts, friendship, clothes | **Fit** |
| Mishra (mixed) | Karthigai 3, Visakam 16 | mixed | **Neutral** |
| Ugra / Krura (fierce) | Bharani 2, Magam 10, Pooram 11, Pooradam 20, Poorattathi 25 | harsh acts | **Unfit** |
| Tikshna / Daruna (sharp) | Thiruvathirai 6, Ayilyam 9, Kettai 18, Moolam 19 | severing acts | **Unfit** |

The class scheme also pairs Ugra with Tuesday and Tikshna with Saturday, which is consistent with
the badge's existing Tuesday/Saturday block rather than a separate rule.

**Magam and Moolam.** Both are good **marriage** stars and stay so. The almanac list and the marriage
engine's Kalaprakasika list are untouched. For beginning ordinary work they are Ugra and Tikshna,
and they are unfit. They entered the badge list from the marriage list, which F-PAN-01 already ruled
the badge is not.

**What changes against today's code:**

| List | Today | Becomes |
|---|---|---|
| Badge `SUBHA_NAKSHATRAS` (17) | includes Magam, Moolam; lacks Sadhayam | the 16 fit stars: **−Magam, −Moolam, +Sadhayam** |
| `AUSPICIOUS_DAILY_NAKSHATRAS` (11) | lacks the Dhruva stars and two Chara stars | the 16 fit stars: **+Uthiram, Uthiradam, Uthirattathi, Avittam, Sadhayam** |
| `CAUTION_DAILY_NAKSHATRAS` (4) | Bharani, Ayilyam, Magam, Moolam | the 9 unfit stars: **+Thiruvathirai, Pooram, Kettai, Pooradam, Poorattathi** |

**Score mapping (policy, not doctrine).** Fit 72, mixed 50, unfit 32. Keep the existing tithi and
weekday blocks: Tuesday, Saturday, Amavasai, Rikta, Ashtami. A block lowers fit to neutral, never to
caution.

**Consequence the owner should see.** About a third of days will carry an unfit star, against about
one in seven today, so "caution" appears more often. The copy must name the cause and the scope, not
condemn the day. Example: "Bharani today: not a day to begin something new; routine work is
unaffected." Native reviewer to supply the Tamil.

## C. Which star: the one in force when the work begins

**Doctrine (settled).** A muhurta is judged on the nakshatra in force at the moment the act begins.
This is the same principle D4 already applied to tithi ("the window is judged on the tithi in
force"). Neither reading the star at sunrise (badge) nor over the whole 24 hours (PDF/push) gets this
right:

- **Sunrise star.** It holds for under half the day on 46.6% of days (`daily_push_cron.py:259`). On
  5 Jan 2026 the badge calls the day good on Poosam, while Ayilyam holds most of the day.
- **Sunrise-to-sunrise dominant star.** It counts the night, when no one begins ordinary work. A star
  can "dominate" mostly by holding 22:00 to 06:00.

**Day verdict (policy).** For a verdict that has no clock time:

1. The window is **daytime, sunrise to sunset**: the hours in which ordinary work is begun.
2. The day's verdict star is the one holding most of the daytime. On a tie, the earlier star wins,
   as `dominant_from_spans` already does.
3. If the star changes between sunrise and sunset and the two stars sit in **different** columns
   (fit / neutral / unfit), the day is **split**. Every surface shows the change time, for example
   "good from 10:42" or "good until 10:42". The calendar cell may show the majority verdict with a
   split mark. The day detail must show the time.
4. A surface that has a clock time (muhurta tool, a planned event) reads the star at that time, not
   the day verdict.

**Not affected.** Chandrashtama keeps its own D11 sunrise-star rule. It was ruled for that purpose
alone, and this ruling does not carry over to it, or it to this.

**Follow-on, not part of this ruling.** The badge reads tithi at sunrise. Under the same in-force
principle it should read tithi over the same daytime window. Raise it with the D4 owner rather than
changing it here.

## D. AAU-20: print the star you scored

The PDF block prints the sunrise star (`:370`) and scores the dominant one (`:727`). Both now come
from `day_quality`. It prints the verdict star, and on a split day both stars with the change time,
in panchangam form ("Bharani until 09:12, then Karthigai"). Never print one star beside a score set
by another.

---

## For engineering

1. `day_quality(date, place)` returns `{verdict_star, star_class, verdict, split: {change_time,
   before, after} | None, blocks: [...]}`. The class table lives once, as data, with all 27 stars.
2. Every general reader calls it: the calendar badge, `pdf_export_service`, the `daily_push_cron`
   fallback, and the day-star term in `daily_guidance_service` (`:583`) and `whatif_service`
   (`:578`). Delete the three hand-lists. The strict muhurtham check
   (`_compute_subha_muhurtham_strict`) reads the class table for its star test but keeps its own
   tithi and yoga rules.
3. API contract: if the badge payload gains a split field, update `app/api/`,
   `packages/shared/src/api/`, `mobile/src/api/` and `web/` together.
4. Copy: personal surfaces label themselves "for you" and name their reason when they disagree with
   the general verdict.

## Acceptance

- **Sweep.** Every day of 2026 and 2027, at Chennai and at Madurai: 0 days where the badge, the PDF
  block and the push fallback disagree. **Blind spot:** once they share one module this cannot fail,
  so it proves the wiring, not the doctrine.
- **Source gate.** No module outside `day_quality` holds a star set or reads `nakshatra_number` /
  `dominant_nakshatra_number` to make a general verdict. Run it once against today's code and
  confirm it fails.
- **Pinned rows.** The 14 days in AAU-07, each with its verdict recomputed under this ruling and
  pinned. Expected: the seven Magam/Moolam days are no longer "good". The seven sunrise-vs-dominant
  days get whatever the daytime majority gives, with the split shown.
- **Class table.** All 27 stars appear in exactly one class. Magam and Moolam are unfit here and
  still present in the marriage list.
- **Prevalence print.** The share of 2026 days that are fit, neutral and unfit, before and after, so
  the owner sees the rise in caution days in numbers.

## For the countersigning practitioner

Three points carry the ruling. Confirm or overturn each:

1. Ordinary new work follows the seven-class scheme, so Magam and Moolam are unfit for it while
   remaining marriage stars.
2. Sadhayam (Chara) is fit for ordinary new work.
3. A day verdict reads the daytime, not the sunrise moment and not the night.
