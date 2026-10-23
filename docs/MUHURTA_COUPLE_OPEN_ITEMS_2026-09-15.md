# Muhurta couple mode: the last four open items

**Date:** 2026-09-15
**Follows:** `docs/MUHURTA_COUPLE_SIGNED_IN_2026-09-15.md` §7
**Status:** DECIDED under delegated ownership and SHIPPED on branch
`harden/production-readiness`. The owner gave full delegation ("act as the
Thirukanitham astrologer, the product designer and the full-stack developer").
Every decision below is recorded as a choice, so a later ruling can reverse any
one of them cleanly.

| # | Item | Outcome |
|---|---|---|
| 1 | Numerology marriage dates read one chart | **Closed.** Couple mode under R1 |
| 2 | Bride's-age Jupiter rule "needs an age" | **Permanently refused.** It prescribes child marriage |
| 3 | Quick date scan reads one chart | **Closed.** Couple mode under R1, weddings only |
| 4 | Two charts for rites other than a wedding | **Ruled: no.** Now enforced by the backend |

---

## 1. Numerology marriage dates, for a couple

`GET /charts/{chart_id}/numerology/marriage-dates` now takes the same
`partnerChartId` / `subjectRole` as `/muhurtham-naals`, which it layers over.

* **The almanac layer is the couple's.** It calls `match_muhurtham_naals` with
  the partner, so Tara Bala and Chandrashtama are ranked exactly as in the naal
  list (weaker side governs, and the Chandrashtama penalty is applied once).
* **The numerology layer is the couple's too.** Each date is scored against
  *each* partner's own favourable-number ranking and personal day. The **lower**
  adjustment is priced (R1). So a bonus that only one partner's numbers give is
  not credited, and a penalty that only one partner's numbers give is.
* **The existing guards still hold.** A flagged date gets no positive
  adjustment for either partner. A recommended date still sorts above every
  unrecommended one.
* **Both readings are reported** (`matches[].readings[]`, each with `who` and
  `governs`). `numerology` is the governing reading. `partnerFavourableNumbers`
  carries the partner's ranking.
* The partner id gets `assert_chart_owner`, after the flag check, just like the
  first chart.

No web or mobile surface calls this route today (the Numerology panel dropped
the view on purpose). The shared wrapper `getNumerologyMarriageDates` takes an
optional `couple` argument.

## 2. The bride's-age rule is refused, permanently

Kalaprakasika Ch. XIV p.79: *"Marry in the 5th/6th/7th year of the bride when
Jupiter is well-placed."*

That is a prescription for the marriage of a child aged four to six. Child
marriage is a criminal offence under India's Prohibition of Child Marriage Act,
2006, and in every country this product serves. No weighting, softened wording
or "for information only" framing makes it usable. This follows the same
reasoning as the permanent refusal of Balarishta.

**The recorded blocker was stale, and it was the wrong kind of blocker.** The
note said the rule "needs an age, which no request carries". But a saved
bride's chart holds her birth date, and every candidate date is a date, so the
age is one subtraction away. A later reader would reasonably have unblocked it.

What changed:

* The constant `MARRIAGE_JUPITER_FAVOURABLE_BRIDE_AGE_YEARS` stays in
  `app/data/marriage_muhurta_rules.py`, so the extraction stays faithful to the
  page. Its comment now says **PERMANENTLY REFUSED** and gives the reason.
* `tests/test_marriage_muhurta_doctrine.py::test_the_bride_age_half_of_p79_is_refused_and_never_read`
  scans every file under `app/` and fails if anything except the data file
  mentions the name. On its first run it caught the engine docstring, which had
  named the constant.
* The adverse-house half of p.79 (a penalty from the bride's Janma-Rasi) is
  unaffected. It is about Jupiter's transit, not about her age.

## 3. The quick date scan, for a couple

`GET /activity-timing` takes `partnerChartId` / `subjectRole`, for
`activity=marriage` only. The `/batch` route (the Decide strip) is unchanged.

* **Per factor family, weaker side governs**, as the muhurta engine applies R1:
  * **Day score:** the lower of the two charts' own daily-guidance scores. Each
    score is read exactly as that chart's own scan reads it: its own daily
    location, goals, journal and score cache.
  * **Tara:** the weaker of the two, for the ranking.
  * The two families are folded independently, so a day can take one partner's
    score and the other's Tara.
* **Panchangam signals** (tithi, paksha, weekday, day star) come from the first
  chart's place, the same "one place, one sky" reading the naal list uses. They
  are identical for both charts.
* **The explanation matches the number.** Every reason names both Taras (for
  example "Bride: Vipat tara … Groom: Sampat tara …"). It then states which day
  score was used, e.g. "Day score 64 is the lower of the two charts' (Bride 72 ·
  Groom 64)". When the two Taras differ, it also says whose Tara set the order.
  Identical scores read "Both charts score this day 70."
* **`nextFavourableDates` is unchanged.** It uses Panchangam alignment only,
  which never included Tara, so it is the same for one chart or two.
* **Guards:** the partner is owner-checked in the route. Both birth times are
  required (a 422 names which chart). A chart cannot be its own partner. Any
  activity other than `marriage` gets a 422.

**Web.** The "Wedding dates · whose charts" control moved **above the quick
scan**, so it now sits above all three surfaces it governs, and "Choose … above"
in the status lines is literally true. The scan sends the couple only when its
own activity is `marriage` (`scanWeddingParams`). The panel maps
`family_harmony` and `child_birth` to the wedding muhurta, and neither is a
two-chart rite. The scan shows a status line naming whose charts it read, and a
shortlist is cleared when the couple changes.

## 4. Only a wedding is elected on two charts

**Ruling (lineage choice, as Tamil almanac practice follows it).** A marriage is
the one samskara that joins two janma stars, which is why porutham exists for it
and for no other rite. Every other rite is elected on the star of the one it is
for:

| Rite | Whose star elects it |
|---|---|
| Namakaranam, Annaprasanam, Karnavedham, Aksharabhyasam | The child |
| Seemantham / Valaikaappu | The expectant mother |
| Griha pravesam, land or property purchase, business start | The yajamana (the one who owns or heads the act) |
| Job, exam, travel, medical | The person themselves |

This does not say another tradition is wrong. Some families also ask the
jothidar to avoid the spouse's Chandrashtama for a house-warming. That is an
advisory on top of an election, not a second election. If the owner wants it, it
can be added later as a named caution, not by extending R1.

**It was only enforced by the clients.** `find_best_muhurta_slots` accepted a
partner for any activity. So `/charts/{id}/muhurta`, `/muhurta` and
`/public/muhurta/personalized` would all have scored a naming ceremony as
"weaker side governs" with no ruling behind it. It now refuses with a 422
(`COUPLE_ACTIVITY_ONLY_DETAIL`). The quick scan applies the same rule.

The partner control now also says, in couple mode: "Only a wedding is read on two
charts. Every other rite is checked on the chart of the person it is for."

---

## Contract changes (all additive)

| Surface | Change |
|---|---|
| `GET /charts/{chart_id}/numerology/marriage-dates` | `partnerChartId`, `subjectRole` params; `partnerChartId`, `partnerFavourableNumbers`, `matches[].readings[]` in the response |
| `GET /activity-timing` | `partnerChartId`, `subjectRole` params; `data.partnerChartId` |
| `GET /charts/{id}/muhurta`, `GET /muhurta`, `POST /public/muhurta/personalized` | 422 for a partner with any activity other than `MARRIAGE` (no client sent one) |
| `packages/shared/src/api/numerology.ts` | `NumerologyDateReading`; optional `readings`, `partnerChartId`, `partnerFavourableNumbers`; `getNumerologyMarriageDates(…, couple?)` |
| `packages/shared/src/types` | `ActivityTimingData.partnerChartId?` |
| `mobile/` | No change. It calls none of these with a partner. |

## Files

| File | Change |
|---|---|
| `app/data/marriage_muhurta_rules.py`, `app/calculations/muhurta_engine.py` | Refusal recorded |
| `app/services/muhurta_service.py` | `COUPLE_ACTIVITY` gate |
| `app/services/muhurtham_naal_service.py` | `couple_who`, `require_couple_birth_time` made public for reuse |
| `app/services/numerology_timing_service.py` | `NumerologySubject`, `NumerologyDateReading`, couple layering |
| `app/services/daily_guidance_service.py` | `_TimingChart`, `_load_timing_chart`, `_timing_day_score`, `_couple_timing_day`; couple branch in `get_activity_timing` |
| `app/api/numerology.py`, `app/api/daily_guidance.py`, `app/schemas/{numerology,daily_guidance}.py` | Params, partner guard, fields |
| `web/components/dashboard-plan-wedding-partner.tsx` | `scanWeddingParams`; copy for three surfaces; the wedding-only note |
| `web/components/dashboard-plan-muhurta-nova.tsx` | Control moved above the scan; couple sent; status line; stale results cleared |

## Tests

* `tests/test_marriage_muhurta_doctrine.py`: the refusal guard.
* `tests/test_numerology_timing.py` (+4): the lower adjustment is priced; a
  one-sided bonus is not credited; an identical partner changes only the
  readings; couple numerology still cannot lift an unrecommended date.
* `tests/test_activity_timing_tara.py` (+2): the two families fold independently
  and the reason matches its numbers; identical charts say so.
* `tests/test_numerology_chart_api.py` (+1): couple marriage dates over HTTP.
* `tests/test_muhurta_couple_signed_in.py` (+6 and 2 new 403 cases): the couple
  scan's score equals the lower of the two solo scans for the same date; a 422
  for a non-wedding rite and for a self-partner; a 422 for a non-wedding partner
  on the muhurta route; another user's partner gets a 403 on marriage-dates and
  activity-timing.
* `tests/test_public_personalized_muhurta.py` (+2): a 422 for a non-wedding
  partner.
* `web/components/dashboard-plan-wedding-partner.test.tsx` (+3): `scanWeddingParams`.

**Result (local, test DB on :5433):** 497 passed and 9 skipped across the 13
affected backend modules, in 9m51s. The 9 skips are the field-contract guard's
routes that have no response schema. Also passing: web `tsc --noEmit`, and 29
tests in the three Plan muhurta web files. Ruff is clean. CI remains the
authority.

Not done: no browser pass of the moved control at 375/768/1024/1440, and no axe
run. No new CSS was added.
