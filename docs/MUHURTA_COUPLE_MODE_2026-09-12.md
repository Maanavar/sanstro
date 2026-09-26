# Muhurta Finder — a wedding has two charts

**Date:** 2026-09-12
**Surface:** Dashboard → Tools → Muhurta Finder (`MuhurtaTool`, also served at
`/tools/muhurta-calculator`)
**Status:** RULED and SHIPPED. Four owner rulings recorded in §2.

---

## 1. The defect

The Muhurta Finder collected **one** person's birth details under the heading
"Whose timing is this for?" and sent them as a single `birth` block. For a
wedding that is the wrong question, and it failed silently: every screen
rendered, every score looked plausible, and the recommendation was computed from
half the evidence.

The personal layer it feeds is not a preference. In Tamil practice these are
**per-person gates**:

| Factor | What it does | Whose chart |
|---|---|---|
| Chandrashtama | vetoes the day outright | each person's own janma star |
| Tara Bala | 3 / 5 / 7 are adverse; caps the displayed band | each person's own janma star |
| Chandra Bala | 4 / 8 / 12 from janma rasi | each person's own janma rasi |
| Janma-tara counts | Ch. XVI p.92 bars, graded | each person's own janma star |

So a date clean for the groom and Naidhana for the bride was being returned as a
wedding muhurtham. Nothing in the codebase could catch it — the engine answered
exactly the question it was asked.

A second consequence: `marriage_muhurta_rules.MARRIAGE_JUPITER_ADVERSE_HOUSES_FROM_MOON`
(Ch. XIV p.79, CONFIRMED_EXACT) had sat extracted but **unwired** since the
extraction pass, with a note that wiring it was "a product decision for whoever
wires this into the engine". It was not a product decision that had been ducked —
it was **unanswerable**, because the rule is counted from the *bride's*
Janma-Rasi and no request could say which chart was hers.

---

## 2. Owner rulings, 2026-09-12

### R1 — The weaker side governs

Per personal-factor family, the couple's score takes the **worse** of the two
readings. A VETO from either side vetoes the day.

Rejected alternatives, and why they are named here rather than left implicit:

* **Averaging.** Lets an excellent Tara Bala for one buy back an adverse one for
  the other. These are gates, not a pair of scores.
* **Summing.** Doubles the personal layer's weight against the almanac layer —
  the double-counting failure this codebase has hit before, and one that leaves
  every individual number looking correct.
* **Bride primary / groom secondary.** Considered and not taken. It is a
  defensible lineage reading, but it makes the groom's chart unable to
  contribute anything but a cap, and no source in our pack ranks the two for
  *date selection* (p.69's bride-star count is a **compatibility** check, not a
  muhurta veto — see `MARRIAGE_NAKSHATRA_PADA_EXCLUSIONS`).

Two consequences worth stating:

* The personal layer keeps the **same weight** as single-chart mode. The ruling
  cannot be undone by the score scale quietly doubling.
* An **absent** factor for one subject counts as a neutral 0 for them, not as
  "no opinion". A bonus only one side earns is therefore not credited; a penalty
  only one side earns **is** applied. The asymmetry is deliberate: it is the
  direction an avoidance rule has to fail.

Both readings are always **reported**, each naming whose chart it read. Only one
is **priced**; the other carries a contribution of exactly zero *and a sentence
saying so*, because a PENALTY worth 0.0 with no explanation is the
printed-number-disagrees-with-its-own-sentence defect this repo has paid for
before. A stood-down PENALTY still reaches `cautions` — an adverse reading on
either side is worth attention whether or not it set the score.

Implemented in `muhurta_engine._weaker_side_governs`.

### R2 — No natal lagna owns a wedding

Lagna is single-chart by construction. In couple mode neither chart's lagna is
used, so there is **no lagna-lord hora premium and no lagna-derived house lord**.
The window still uses the **activity's own** hora lords (Venus / Jupiter / Moon
for marriage) over the best clear Gowri kala — those are a property of the act,
not of either chart. Dropping them too would have handed a couple the same window
a signed-out stranger gets, which is not what supplying two charts should buy.

The *muhurta* lagna — the rising sign at the elected moment, which
`MARRIAGE_LAGNA_SIGN_PREFERENCE` rules on — is unaffected. It was never natal.

Implemented as `_best_time_window(..., couple_mode=True)`.

### R3 — Ch. XIV p.79 is wired, as a penalty, with the copy softened

`MARRIAGE_JUPITER_GOCHARA_FROM_MOON` now scores. It reads Jupiter's transit house
from the **bride's** Janma-Rasi and penalises the 3rd / 4th / 6th / 8th / 10th /
12th.

* **Penalty, not veto.** Sized at −15, level with `CHANDRA_ASHTAMA_RASI`: enough
  to move the band, never enough to remove a day alone. Two properties of the
  rule argue against more. Jupiter holds a sign for about a year, so across any
  60-day search it is very nearly a constant — it shifts every candidate equally
  and therefore changes the **band, not the ranking**. And six of twelve houses
  are adverse, so a veto would blank roughly half of every bride's available
  years, which no almanac does.
* **Copy softened, citation verbatim.** On screen: "Jupiter transits the 8th from
  the bride's birth sign, which Kalaprakasika counts among the adverse gochara
  positions for a marriage." The passage's own consequence stays in the
  `RuleSource` for a reader who opens the citation. Softening the copy is not the
  same as hiding the source.
* **Silent unless the role is BRIDE.** Not the cautious default — the *correct*
  one. Applying a rule about the bride to a groom's or an unnamed chart is not
  conservative, it is wrong.
* The chapter's other half — "marry in the 5th/6th/7th year of the bride when
  Jupiter is well-placed" — is deliberately **not** wired. It is a rule about the
  bride's age and no muhurta request carries an age.
* When Jupiter *is* clear, the factor is emitted NEUTRAL rather than omitted:
  this engine's standing rule is that "we checked and it is clear" must be
  distinguishable from "we have no table".

### R4 — Scope

Tools → Muhurta Finder, its backend route, and the shared-client wrapper. The
signed-in Calendar/Plan picker and the Muhurtham Naal list stay single-chart for
now (see §5).

---

## 3. What changed

| File | Change |
|---|---|
| `app/calculations/muhurta_engine.py` | `Subject.label_ta` / `Subject.role`; `_who` helper; `_personal_factors`; `_weaker_side_governs` + `_stand_down`; `score_day(co_subject=...)`; `marriage_jupiter_gochara_factor`; `_W.MARRIAGE_JUPITER_GOCHARA` |
| `app/services/muhurta_service.py` | `co_chart_data` / `subject_role` / `co_subject_role`; `_facts_from_chart_data`; `_karaka_factors_at` → `_transit_factors_at` (one ephemeris call, both factor families); tara display cap over all subjects; couple dasha line + both-must-support bonus; `_best_time_window(couple_mode=)` |
| `app/api/public_tools.py` | `partner` + `subjectRole` on `PublicPersonalizedMuhurtaRequest`; birth time required on both charts; 422s name which chart failed |
| `packages/shared/src/api/tools.ts` | `partner?` and `subjectRole?` on `PersonalizedMuhurtaPayload` |
| `web/.../MuhurtaTool.tsx` | Bride/Groom blocks, mode radiogroup, solo role selector, backend error surfacing, dead unreachable fetch removed |
| `web/components/dashboard-tools-tab-nova.tsx` | tool-card description names the two-chart capability |

### Bilingual labelling

`Subject.label` was a single string spliced into both languages. A **role** label
is generated copy with a real Tamil form, unlike a personal name, so `label_ta`
was added and `_who` picks the right half. Tamil almanac usage, not Sanskrit:
**மணமகள் / மணமகன்**. Without this, "the bride" would have landed inside every
Tamil reason sentence — the exact failure `_janma_nakshatra_factor` already
documents for its own fallback.

### Two dasha lines, one field

`MuhurtaSlot.dashaSupport` is a single `BiText` across four surfaces. Couple mode
joins both lines into it (`மணமகள் — … · மணமகன் — …`) rather than adding a field,
because a new field is a four-surface contract change before any surface can read
it. The **+10 dasha bonus** now requires a favourable lord running for *both* —
same ruling as R1, applied to the one layer that would otherwise have smuggled
averaging in through a side door.

### One prefill removed

The form used to prefill one birth date and time. With two blocks that stops
being a convenience and becomes a hazard: a hurried reader could submit and be
handed a confident wedding muhurtham computed from two fictional charts. Both
blocks now start empty and `required`.

---

## 4. Tests

* `tests/test_muhurta_couple_mode.py` (28) — the fold's algebra (min governs,
  stand-down zeroes *and* explains, veto propagates, lone penalty applies, lone
  bonus does not), a 30-day sweep proving couple ≤ min(solo, solo), a
  no-double-counting check, contributions still summing to the score, the
  bilingual role labels, the cap taking the tightest of two, and the Jupiter rule
  across all twelve houses and all three roles.
* `tests/test_public_personalized_muhurta.py` (+7) — the endpoint contract:
  both charts reported, couple score never above the solo one, birth time
  required on the partner too, 422s naming which chart failed, one-person mode
  unchanged, and naming the bride being what unlocks the Jupiter citation.
* `web/.../MuhurtaTool.test.tsx` (6) — what leaves the form. The failure being
  fixed is silent, so the assertions watch the payload, not the pixels.

**Sweep shape.** The properties here are properties of a *pair*, so the sweeps
run over subject pairs rather than over dates. One pair on thirty days would have
been the weaker test — the same mistake the Chandrashtama window bug survived.

---

## 5. Open, deliberately

> **Update 2026-09-15:** items 1, 2 and 4 are closed. See
> `docs/MUHURTA_COUPLE_SIGNED_IN_2026-09-15.md`.

1. ~~**Signed-in Calendar/Plan picker** still scores one chart.~~ CLOSED
   2026-09-15. The partner is a saved chart (owner-guarded); weddings only.
2. ~~**Muhurtham Naal list** ranks published almanac wedding dates against the
   account holder's star alone.~~ CLOSED 2026-09-15, under R1.
3. ~~**`MARRIAGE_JUPITER_FAVOURABLE_BRIDE_AGE_YEARS`** (5/6/7) remains unwired —
   needs an age, which no request carries.~~ PERMANENTLY REFUSED 2026-09-15: it
   prescribes child marriage. See `docs/MUHURTA_COUPLE_OPEN_ITEMS_2026-09-15.md` §2.
4. ~~**`MuhurtaPageContent.tsx`** still says "top 3 auspicious time windows" and
   describes the tool as Panchangam-only.~~ CLOSED 2026-09-15 (hero, FAQ JSON-LD,
   meta/OG descriptions, CTA strip).
