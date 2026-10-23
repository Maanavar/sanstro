# Muhurta couple mode, signed in — and the stale SEO copy

**Date:** 2026-09-15
**Follows:** `docs/MUHURTA_COUPLE_MODE_2026-09-12.md` §5, items 1, 2 and 4
**Status:** DECIDED under delegated ownership and SHIPPED on branch
`harden/production-readiness`. Decisions D1–D6 below were taken by Claude with
the owner's full delegation ("act as the astrologer, the product designer and
the full-stack developer"). They are recorded as choices, not as settled
doctrine, so a later ruling can reverse any one of them cleanly.

---

## 1. What was open

1. **Signed-in Calendar/Plan picker** scored a wedding against one saved chart.
2. **Muhurtham Naal list** ranked the published almanac wedding dates against
   the account holder's star alone.
3. **Public SEO copy** said "top 3 auspicious time windows" and described the
   tool as "Panchangam alone". Both were stale before couple mode: the tool
   returns up to five slots and has read the birth chart for some time.

Items 1 and 2 had the same defect the Tools finder had before 2026-09-12:
Chandrashtama and Tara Bala are per-person gates, so a date clean for one
partner and Naidhana for the other was printed as a recommended wedding date,
and nothing on screen could reveal it.

---

## 2. Decisions

### D1 — The partner is a saved chart the user owns

The signed-in surfaces are built on saved charts, and `GET /birth-profiles`
already returns each profile's `chartId` and `relationshipToOwner`. Typing a
partner's details in again would duplicate the Tools finder inside the
dashboard. The partner is therefore chosen from the user's own saved charts,
and **`assert_chart_owner` runs on the partner id exactly as on the first**. A
couple request is a second way in, and without the guard a partner id would
surface another user's birth star and dasha through the factor sentences.

### D2 — One choice, above both surfaces

"Whose charts decide a wedding?" is asked once, in a card directly above
**Detailed muhurta search** (`WeddingPartnerControl`). Both the picker and the
Naal list below it read that one answer. Two copies of the control would be two
radio groups bound to one value on the same page.

The picker also restates the answer in one line next to its search window
("Checked for both charts — this chart and …"). A reader scrolled down to the
results otherwise cannot tell a one-chart wedding list from a two-chart one.

### D3 — Weddings only

The picker sends the partner only when the activity is `MARRIAGE`. Owner
rulings R1–R3 were made for a wedding. Extending "weaker side governs" to a
house-warming or a naming ceremony is a new doctrine question (whose chart
elects a household act is a lineage choice), not an implementation detail. A
role on its own still travels for a one-chart wedding, because naming that chart
as the bride is what lets Ch. XIV p.79's Jupiter rule apply, exactly as in the
Tools finder.

### D4 — The Naal list is ranked by the same ruling (R1)

Per check, the weaker reading is priced:

* **Tara Bala.** The governing tara is the worse one, by quality bucket and
  then by score. These two orderings agree: every AVOID tara scores below the
  NEUTRAL Janma tara, which scores below every GOOD one. The governing tara is
  the one on the top-level fields.
* **Chandrashtama.** Either chart's own star window rules the date out of
  "recommended". The penalty is the more severe of the two readings, applied
  **once**, never once per chart.
* **Score** = 50 + governing tara score + worst Chandrashtama penalty, clamped
  to 0–100. It can never exceed either partner's own score.
* **Recommended** exactly when both partners' own readings are recommended.

Both readings are reported (`readings[]`, one per chart, with `who` and
`governs`). Every couple reason line is headed by whose chart it read
(மணமகள் — / Bride —). When the priced tara differs from the shown one, a
sentence says which set the score. Printing two taras and silently pricing one
is the "number disagrees with its own explanation" defect this repo has paid
for before.

Ch. XIV p.79's Jupiter rule is **not** added to the Naal list. That list is a
star-level ranking (Tara Bala and Chandrashtama) of dates an almanac already
published. "Use this date in detailed search" hands a date to the picker with
`MARRIAGE` selected and the same couple still chosen, and that is where
Jupiter, dasha, hora and lagna are weighed.

### D5 — Birth time is required on both charts in couple mode

This is the same rule the public tool applies to a partner. The janma star is
the whole input to both checks, and the Moon moves about 13° a day. The backend
refuses with a 422 that names which chart failed. In practice the API no longer
calculates a chart for an untimed profile (it saves `chartId: null`), so only
legacy rows can reach the guard. The UI lists such a chart disabled, with
"no birth time saved" in its label.

### D6 — Preselection reads only what the profile says

* **Role.** The open chart's `genderForTraditionalRules` (female → Bride,
  male → Groom). Otherwise "Not specified", which keeps the Jupiter rule silent
  rather than applying it to a chart nobody said was the bride's.
* **Partner.** Preselected only when there is **exactly one** timed spouse. In
  that case "Bride and groom" is the starting answer, as it is in the Tools
  finder. Otherwise the panel starts on "This chart only".
* Seeded once per open chart. A reader's own choice is never overwritten.

---

## 3. Contract changes (all additive)

| Surface | Change |
|---|---|
| `GET /charts/{chart_id}/muhurta`, `GET /muhurta` | `partnerChartId`, `subjectRole` query params. `/muhurta` refuses a partner without `chartId` (422). |
| `GET /charts/{chart_id}/muhurtham-naals` | `partnerChartId`, `subjectRole`. Response gains `partnerChartId`, `context.subjectWho`, `context.partner`, and `matches[].readings[]`. |
| `packages/shared/src/api/tools.ts` | `getMuhurta` forwards `partnerChartId` / `subjectRole`. |
| `packages/shared/src/api/charts.ts` | New `listBirthProfiles()` wrapper for the existing `GET /birth-profiles`. |
| `packages/shared/src/types` | `BirthProfileResponse.chartId`, `.genderForTraditionalRules` (both already sent by the backend). |
| `packages/shared/src/api/numerology.ts` | Optional `readings`, `subjectWho`, `partner` on the naal match types. |
| `mobile/` | No change needed. Every field is optional and every param is opt-in. |

`/charts/{chart_id}/numerology/marriage-dates` still calls
`match_muhurtham_naals` single-chart. It layers numerology over the almanac
verdict, and a couple numerology reading is a separate question.

The `{chart_id}` route count in `tests/test_chart_access_guard.py` is unchanged
(no new routes).

---

## 4. Files

| File | Change |
|---|---|
| `app/services/muhurtham_naal_service.py` | Per-chart `_read_day`, weaker-side fold, `NaalReading`, couple labels, `_couple_pricing_reasons`, `_require_birth_time`. Single-chart copy byte-identical. |
| `app/services/muhurta_service.py` | `co_chart_id`. `_facts_from_persisted_chart` reads a saved partner through `_facts_from_chart_data`, the same path the public tool uses. Role labels on a saved chart; R2 (no natal lagna) in couple mode. |
| `app/api/muhurta.py` | Partner/role params on three routes, `_authorize_partner`, `_roles`. |
| `app/schemas/muhurtham_naal.py` | `MuhurthamNaalReading`, `MuhurthamNaalPartnerContext`, additive fields. |
| `web/components/dashboard-plan-wedding-partner.tsx` | New: the control plus pure helpers (`partnerOptions`, `suggestedPartner`, `defaultRoleFor`, `coupleFromChoice`). |
| `web/components/dashboard-plan-muhurta-nova.tsx` | Loads profiles, holds the choice, passes it to both surfaces. Subtitle names both stars in couple mode. |
| `web/components/dashboard-plan-muhurta-picker-nova.tsx` | `withWeddingParams`, a status line, and results cleared when the couple changes. |
| `web/components/dashboard-plan-muhurtham-naal-nova.tsx` | Couple fetch, a two-star context card, and a Chandrashtama badge that names whose it is. Stale ranking cleared before refetch. |
| `web/lib/muhurtham-naal.ts` | Types + optional `couple` argument. |
| `web/app/(marketing)/tools/muhurta-calculator/{page,MuhurtaPageContent,MuhurtaTool}.tsx` | SEO copy (§5). |

---

## 5. The SEO copy

* **Hero:** "top 3 … from Thirukanitham Panchangam" became "the best auspicious
  time windows, scored on Thirukanitham Panchangam and your own chart. For a
  wedding, both the bride's and the groom's charts are checked."
  No number: the tool returns up to five and its own header counts them.
* **FAQ (JSON-LD):** the question "How is this different from a personalised
  one?" answered "Panchangam alone". It is now "Does this muhurtham calculator
  use my birth chart?", answered with what the tool reads, the two-chart wedding
  check, and what an account really adds (keeping the charts).
* **Meta and OG descriptions:** name the birth-chart factors and the two-chart
  wedding check.
* **CTA strip:** sold dasa/hora/Chandrashtama personalisation as the account
  upgrade, which the tool above it already provides. It now sells saving charts
  and the surfaces built on them, including ranking published dates for a couple.

---

## 6. Tests

* `tests/test_muhurtham_naal.py` (+8). A sweep over 30 ordered star pairs
  checks that the couple score is ≤ each partner's own score on every date,
  that recommended is exactly "recommended for both", that Chandrashtama is
  either chart's, and that exactly one reading governs. Also: identical stars
  score exactly as one chart (no double counting), whose-chart labels in both
  languages, and the priced-tara sentence appearing exactly when it changed the
  score. Swapping roles changes labels, never the ranking. Also: positional
  labels, same-chart 422, and a birth-time 422 naming the chart.
* `tests/test_muhurta_couple_signed_in.py` (new, 11). Naal and picker couple
  responses; the location route; a partner without a chart (422); a chart as its
  own partner (422); an untimed legacy partner (422, named); and **another
  user's chart as partner → 403 on all three routes**.
* `web/components/dashboard-plan-wedding-partner.test.tsx` (10),
  `dashboard-plan-muhurta-picker-nova.test.tsx` (+3, `withWeddingParams`), and
  `dashboard-plan-muhurtham-naal-nova.test.tsx` (new, 2).

Not done: no browser pass of the new card at 375/768/1024/1440, and no axe run.
The control reuses `Segmented`, `NovaSelect` and `FieldShell` and adds no CSS.

---

## 7. Still open

All four closed on 2026-09-15. See `docs/MUHURTA_COUPLE_OPEN_ITEMS_2026-09-15.md`.

1. ~~**Couple numerology** on `/numerology/marriage-dates` (§3).~~ CLOSED, under R1.
2. ~~**`MARRIAGE_JUPITER_FAVOURABLE_BRIDE_AGE_YEARS`** is still unwired. It needs
   an age, and no request carries one.~~ **PERMANENTLY REFUSED.** It prescribes
   child marriage, and the age was derivable all along.
3. ~~**Quick date scan** (`/activity-timing`) above the picker is still
   single-chart.~~ CLOSED, under R1, for weddings only.
4. ~~**Non-wedding couple acts** (D3).~~ RULED: only a wedding is elected on two
   charts. Now enforced in the backend.
