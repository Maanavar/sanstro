# Muhurta doctrine — answers to the three blocking questions

**Written 2026-08-16.** Answers §11 Q1 (durmuhurtham), Q2 (Tara Bala weighting)
and Q6 (evening muhurta) of `docs/HANDOFF_MUHURTA_NEXT_2026-08-16.md`, which
block plan items **A2**, **T3** and **T7**.

## Provenance — read this before encoding anything below

This document was written by a coding agent, **not by the astrologer.** Every
claim carries a confidence label:

| Label | Meaning | May it be encoded? |
|---|---|---|
| **[STRUCTURE]** | How the quantity is defined. Not a judgement call. | Yes — encode now. |
| **[REPO]** | Already live in this codebase; verifiable by reading it. | Yes — cite the file. |
| **[SOURCED]** | Page-cited to the Kalaprakasika extraction in `app/data/`. | Yes — cite the rule id. |
| **[RECALL]** | Standard published table, reproduced from the agent's own recall. **Not verified against a printed almanac.** | **No — owner must confirm first.** |
| **[PRODUCT]** | A calibration or guardrail proposal, not doctrine. | Only behind the owner's signature. |

The repo's standing rule is *"Do not invent a weight, a durmuhurtham offset, or
a nakshatra list"* (handoff §6). Nothing labelled **[RECALL]** or **[PRODUCT]**
below is exempt from that rule. §4 lists exactly what needs a signature.

### Owner decisions — 2026-08-16

The owner reviewed this document on 2026-08-16 and gave these rulings
explicitly. They are **[SIGNED]** and may be encoded.

| # | Item | Ruling |
|---|---|---|
| **S3** | Late cut-off, §3.1.3 | **APPROVED.** No recommended window starts after 21:00 or ends after 21:30 local. |
| **S2** | Tara band caps, §2.3 | **APPROVED.** Naidhana max Usable; Vipat/Pratyari max Good; sourced activity-specific tara counts remain hard vetoes. |
| **S4** | Evening policies, §3.2 | **NOT approved. Every activity stays `DAY_ONLY`.** The per-activity table in §3.2 is retained as an unapproved proposal only. |
| **S1** | Durmuhurtham indices, §1.2a | **OWNER-AUTHORIZED 2026-08-17.** Derived from seven consecutive Chennai almanac entries; the recalled table remains non-authoritative. |
| **Q4** | Wealth-purchase lagna, §5 | Sourced rising-sign rule **first**; the 2nd/11th axis approved **as an explicitly unsourced bonus-only factor** on the §5.3 definition. |

---

## 1. Durmuhurtham (Q1 — blocks A2)

### 1.1 The question's premise is wrong, and this is the important part

The question asks for a table of *"starts N hours/minutes after sunrise,
lasts N minutes"*, with the example *"Tuesday: begins 2h 24m after sunrise;
lasts 48m."*

**[STRUCTURE]** Durmuhurtham has no fixed clock offset and no fixed duration.
The daylight span is divided into **15 equal muhurtas**:

```
muhurta_length = (sunset - sunrise) / 15
nth muhurta starts at  sunrise + (n - 1) * muhurta_length
```

Durmuhurtham is defined by **which muhurta index** is inauspicious on each
weekday. The clock offset and the duration are both *derived*, and both move
with the season and the latitude.

The example is self-consistent only on a 12-hour day: 48 min is exactly
`12h / 15`, and 2h 24m is exactly 3 × 48 min, i.e. the start of muhurta **4**.
So the example encodes "Tuesday = muhurta 4" — the fixed-clock framing is an
artefact of assuming an equinox.

What this means in practice for Chennai (≈13°N):

| Day | Daylight | Muhurta length | Offset to muhurta 4 |
|---|---|---|---|
| Summer solstice | ≈ 12h 55m | ≈ 51.7 min | ≈ 2h 35m |
| Equinox | ≈ 12h 07m | ≈ 48.5 min | ≈ 2h 25m |
| Winter solstice | ≈ 11h 21m | ≈ 45.4 min | ≈ 2h 16m |

A hardcoded 2h 24m / 48m would be wrong by up to ~11 minutes at the solstices,
and the error compounds across the index — at muhurta 14 it is up to ~40
minutes, which is most of a durmuhurtham. **Encoding a fixed clock table would
reproduce exactly the defect the handoff calls D5** (a static clock table
standing in for a computed window) in a new place.

**Conclusion: A2's data shape is `dict[weekday, tuple[int, ...]]` of muhurta
indices in 1..15 — not offsets and not durations.** That much can be built now
and is not blocked.

### 1.2 The weekday index table — NOT confirmed

### 1.2a Owner-authorized Chennai verification (17–23 August 2026)

**[OWNER-AUTHORIZED / EVIDENCE]** The owner supplied seven consecutive Chennai
daily-almanac screenshots, covering every weekday. For every printed period,
both start and end agree with consecutive boundaries of
`D = (sunset - sunrise) / 15`, within printed-minute rounding. The production
constant therefore contains only these daylight-grid indices:

| Weekday | Date | Sunrise–sunset | Printed Durmuhurtham | Derived index/indexes |
|---|---:|---|---|---|
| Monday | 17 Aug 2026 | 05:57–18:29 | 12:38–13:28; 15:08–15:59 | 9, 12 |
| Tuesday | 18 Aug 2026 | 05:57–18:28 | 08:27–09:17 | 4 |
| Wednesday | 19 Aug 2026 | 05:57–18:28 | 11:47–12:37 | 8 |
| Thursday | 20 Aug 2026 | 05:57–18:27 | 10:07–10:57; 15:07–15:57 | 6, 12 |
| Friday | 21 Aug 2026 | 05:57–18:27 | 08:27–09:17; 12:37–13:27 | 4, 9 |
| Saturday | 22 Aug 2026 | 05:57–18:26 | 05:57–06:47; 06:47–07:37 | 1, 2 |
| Sunday | 23 Aug 2026 | 05:57–18:26 | 16:46–17:36 | 14 |

This is a weekday rule, not a Chennai clock-time rule. For each requested
date and location, the service recomputes the actual daylight duration and
turns the stored index into its local interval. Tuesday has one evidenced
daylight period; no second Tuesday period is invented.

**[RECALL]** The commonly published table (Muhurta Chintamani lineage; the same
set most panchanga software prints) is:

| Weekday | Durmuhurtham muhurta index (of 15) | Offset on a 12h day |
|---|---|---|
| Sunday | 14 | 10h 24m |
| Monday | 9, 13 | 6h 24m, 9h 36m |
| Tuesday | 4, 8 | 2h 24m, 5h 36m |
| Wednesday | 8, 12 | 5h 36m, 8h 48m |
| Thursday | 6, 12 | 4h 00m, 8h 48m |
| Friday | 4, 9 | 2h 24m, 6h 24m |
| Saturday | 2, 3 | 0h 48m, 1h 36m |

**I am not confident in this table and it must not be shipped as-is.** Two
things about it that I *can* argue:

- **Wednesday = 8 is corroborated independently.** Muhurta 8 is Abhijit, the
  midday muhurta, and the well-known rule is that *Abhijit is auspicious on
  every weekday except Wednesday.* The standard explanation for that exception
  is precisely that Wednesday's durmuhurtham falls on it. Wednesday's entry is
  the one line here I would defend.
- **Tuesday = 4 matches the question's own worked example** (2h 24m after
  sunrise, 48m long, on a 12h day). Whoever wrote the question had that value
  from somewhere.
- **Tuesday = 8 is internally suspect for the same reason Wednesday = 8 is
  strong:** if Abhijit were also spoilt on Tuesday, the "except Wednesday" rule
  would not be stated the way it universally is. Treat the second Tuesday index
  as the weakest cell in the table.

### 1.3 Implementation rule

**[PRODUCT]** The completed implementation follows the
`ANNAPRASANA_FAVOURABLE_TARA_COUNTS` data-shape precedent:

```python
# app/data/durmuhurtham_rules.py
#
# Durmuhurtham is the (sunset - sunrise) / 15 muhurta grid, indexed 1..15 from
# sunrise. This table names WHICH indices are inauspicious per weekday; the
# clock times are derived per date and per location and are never stored.
#
DURMUHURTHAM_DAYLIGHT_INDICES: dict[str, tuple[int, ...]] = {
    "SUNDAY": (14,), "MONDAY": (9, 12), "TUESDAY": (4,),
    "WEDNESDAY": (8,), "THURSDAY": (6, 12), "FRIDAY": (4, 9),
    "SATURDAY": (1, 2),
}
```

The muhurta-grid computation, snapshot field, candidate exclusion, UI, and
tests now use this single constant. No fixed duration or offset is stored.

### 1.4 The cheapest way for the owner to confirm it

One printed Tamil almanac, seven consecutive days, one pass:

1. For each day read the printed durmuhurtham start/end and the printed
   sunrise and sunset, from one city, edition and year.
2. Set `D = (sunset - sunrise) / 15`; derive both positions:
   `start_position = (printed_start - sunrise) / D` and
   `end_position = (printed_end - sunrise) / D`.
3. Accept an index only when the positions approximately match the consecutive
   boundaries `index - 1` and `index` (allowing for printed-minute rounding).
   Record the predicted interval and its start/end differences beside the
   printed one; do not infer an index from the start time alone.
4. Seven consecutive days gives all weekdays and confirms or refutes every
   cell, including the suspect Tuesday one. The final owner sign-off is only
   the weekday-to-index table, never fixed clock offsets or a 48-minute span.

If the almanac's derived indices are stable across dates, the structural model
in §1.1 is also confirmed at the same time. If they drift, the almanac is using
a different division and §1.1 needs revisiting before anything is built.

### 1.5 Night durmuhurtham

**[STRUCTURE]** The night span divides into 15 muhurtas the same way
(`(next_sunrise - sunset) / 15`), and some traditions name night durmuhurthams.
**Out of scope**: the picker is daytime-only and stays that way until T7 (§3)
is answered. Day indices only.

---

## 2. Tara Bala severity (Q2 — blocks T3)

### 2.1 There are two different tara systems in this app, and they must not merge

This is the finding that actually answers the question, and it came out of the
code rather than the question.

**[SOURCED]** Kalaprakasika does not prohibit *tara classes*. It prohibits
specific **counts** from the birth star, and the sets it prints cut straight
across the 9-fold classification:

| Activity | Prohibited counts | Their 9-fold taras |
|---|---|---|
| Seemantham (`kalaprakasika_lifecycle_rules.py:298`) | 3, 5, 7, 10, 19, 22, 27 | Vipat, Pratyari, Naidhana, **Janma, Janma, Kshema, Parama Mitra** |
| Upanayanam (`:214`) | 1, 5, 7, 10, 19, 22, 27 | Janma, Pratyari, Naidhana, Janma, Janma, **Kshema, Parama Mitra** |
| Marriage (Ch. XIV p.86) | 1, 3, 5, 7, 10, 19 | Janma, Vipat, Pratyari, Naidhana, Janma, Janma |
| Harvest (`kalaprakasika_harvest_rules.py:109`) | 1, 10, 19 | Janma, Janma, Janma |

Counts **22 and 27 map to Kshema and Parama Mitra** — two of the *favourable*
taras — and the book bans them anyway. And the book names only the first cycle
of 3/5/7; it never bans 12/14/16 or 21/23/25, which are the same taras one and
two cycles on.

**So the source's system is not a coarse version of the 9-fold one. It is a
different system that partly overlaps.** Anything that "simplifies"
`janma_tara_prohibited` into Vipat/Pratyari/Naidhana would silently drop the
22nd and 27th bans and silently add six counts the book never banned.

**Do not merge them.** This is the same class of instruction as the handoff's
"do not merge `assess_activity_timing` into `muhurta_engine`."

### 2.2 The answer, in two tiers

**Tier 1 — sourced count prohibitions: HARD VETO. [SOURCED]**

Where an activity carries a `janma_tara_prohibited` set, that set is a veto for
that activity. The text's verb is prohibitive ("The asterisms to be avoided
are…", "The wise man will avoid…", "will result in loss"), and the engine's
standing rule is that severity is read off the source's verb. This is already
the encoded design; it needs no new decision. **No change required.**

**Tier 2 — the general 9-fold Tara Bala: PENALTY, plus a band cap. [PRODUCT]**

For activities with no sourced count rule, and as a general personal-layer
signal, the 9-fold tara should be a **penalty, not a veto.** Reasons:

- Three of nine taras are adverse, so a veto removes **≈33% of all days** for
  every activity and every subject. Layered on top of Chandrashtama (a further
  ≈8%) and the sourced count vetoes, a month picker starts returning empty
  results — and the handoff's own honesty gate says a thin-but-honest answer
  beats a confident wrong one, not that no answer is fine.
- The astrologer's own worked example (quoted in `muhurta-two-mode-plan.md`
  §4) says he *"may reject"* the period — modal, not absolute. That is the
  language of a strong penalty, not a veto.
- The one place the doctrine *does* want a veto, it says so explicitly, per
  activity, in counts. Tier 1 already carries that.

**Magnitudes — reuse the table that is already live. [REPO]**
`app/services/muhurtham_naal_service.py:85` already ships:

| Tara | # | Score |
|---|---|---|
| Janma | 1 | +8 |
| Sampat | 2 | +30 |
| **Vipat** | 3 | **−30** |
| Kshema | 4 | +22 |
| **Pratyari** | 5 | **−25** |
| Sadhana | 6 | +24 |
| **Naidhana** | 7 | **−35** |
| Mitra | 8 | +26 |
| Parama Mitra | 9 | +28 |

The **relative ordering is doctrinal** — Naidhana (destruction) worse than
Vipat (danger) worse than Pratyari (obstruction). The **numbers are product
calibration** that this repo already made once and already ships to users on
the muhurtham-naal surface. Introducing a *second*, differently-scaled tara
table in `muhurta_engine` would mean two surfaces of the same app disagreeing
about how bad a Vipat day is. Reuse these, normalised onto the engine's factor
scale; do not invent a fresh set.

Note the question mis-states one term: **Vadha and Naidhana are the same tara**
(the 7th), not two. The repo names it Naidhana (`TARA_NAMES[7]`,
`நைதனம்`), consistent with Tamil almanac usage.

### 2.3 "How large relative to an excellent nakshatra?" — answer with a cap, not a number

**[SIGNED — owner-approved 2026-08-16, S2.]** This is the half of the question a
weight cannot answer, and it is the part worth implementing.

An adverse tara should not be *arithmetically* rescuable by a strong almanac.
Express that as a **band cap** rather than a bigger negative number:

| Tara | Cap on the displayed band |
|---|---|
| Naidhana (7) | may not be **Best** or **Good** — at most **Usable**, and the reason names the tara |
| Vipat (3) | may not be **Best** — at most **Good** |
| Pratyari (5) | may not be **Best** — at most **Good** |
| all others | uncapped |

A cap is more robust than a weight: it survives any future re-calibration of
the 0–100 scale (which §9e of the handoff says is coming), it needs no
tuning, and it makes the guarantee testable as a property — *no personal-mode
result whose tara is 7 is ever labelled Best* — rather than as a number that
has to be re-checked whenever anything else moves.

It also answers the question as asked: an excellent nakshatra can lift a Vipat
day within the Good band, but it can never make it the recommended day.

### 2.4 T3 ships scoring directly

The cap in §2.3 is signed, so T3 does **not** need the non-scoring fallback:
ship the tara as a scoring factor with the §2.2 magnitudes and the §2.3 caps.

The cap is a property, and it is the acceptance test: **no personal-mode result
whose tara is 7 is ever labelled Best or Good, and none whose tara is 3 or 5 is
ever labelled Best** — asserted over a sweep, not a hand-built pair. That test
must fail on the code before the change.

---

## 3. Evening muhurta (Q6 / T7)

### 3.1 Three guardrails first — these are not doctrine questions

**[STRUCTURE]** Whatever the answer on activities, three constraints hold and
should be implemented regardless:

1. **Sandhya is excluded for everything.** The twilight junctions — one ghati
   (24 min) either side of sunrise and of sunset — are inauspicious for all
   muhurtas without exception. This is not activity-specific. An evening
   window must begin after `sunset + 24m`, and any daytime window must end by
   `sunset - 24m`.
2. **No window may cross midnight.** Handoff §4 rule 5 — `%H:%M` on the wire
   drops the date. The moment a night window exists this stops being
   theoretical, so the schema must carry a date on both ends *before* any
   evening window ships, not after.
3. **A hard late cut-off applies on top of any activity rule.
   [SIGNED — owner-approved 2026-08-16, S3.]** No
   recommended window may *start* after **21:00** local or *end* after
   **21:30** local. This is the guardrail that directly prevents the 01:40
   failure the question is worried about, and it is independent of doctrine —
   it is a statement about when a reader will act, and the v38 regression
   (windows at 04:33 / 03:06 / 01:40 on 5 of 7 weekdays) is exactly what it
   exists to stop.

Guardrail 3 alone answers the question's stated purpose. **It can ship without
any per-activity ruling**, and I recommend it ships first and separately.

### 3.2 Per-activity evening policy — REJECTED for now, all activities stay `DAY_ONLY`

**Owner ruling 2026-08-16 (S4): every activity keeps `DAY_ONLY`.** The table
below is an **unapproved proposal**, retained so the question does not have to
be re-derived later. **No row in it may be encoded.**

What *should* be built is the field itself, with `DAY_ONLY` as its value
everywhere — so the mechanism exists and each row is a one-line change when and
if it is ever signed.

**[PRODUCT]**, with the sourced anchors noted. Model it as one field on
`ActivityRules`, defaulting to the current behaviour:

| Policy | Meaning |
|---|---|
| `DAY_ONLY` (**default**) | sunrise+24m → sunset−24m. Today's behaviour, unchanged. |
| `FORENOON_ONLY` | sunrise+24m → local noon |
| `UNTIL_PRADOSHA` | day window, plus sunset+24m → sunset+96m |
| `EVENING_ALLOWED` | day window, plus sunset+24m → the §3.1.3 cut-off |

Proposed assignment for the activities the question names — **NOT approved,
do not encode:**

| Activity | Policy | Basis |
|---|---|---|
| Marriage | `DAY_ONLY` | Tamil almanac wedding muhurthams are daytime, overwhelmingly forenoon. North-Indian night marriage muhurtas exist but are not this app's tradition. **[RECALL]** |
| Naming (`NAMAKARANA`) | `FORENOON_ONLY` | Ch. III already sets the precedent for a forenoon-only rite — `MILK_FEEDING_FORENOON_OR_NOON_ONLY = True` (`kalaprakasika_samskara_rules.py:286`). **[SOURCED, adjacent]** |
| Religious / `SPIRITUAL` | `UNTIL_PRADOSHA` | Pradosha — roughly the 1.5h after sunset — is specifically prescribed for evening worship, the one classical case where evening is *better* than day. **[RECALL]** |
| Travel (`TRAVEL`) | `EVENING_ALLOWED` | Prayana doctrine contemplates night departures and carries its own weekday direction rules. **[RECALL]** |
| Gold / purchase (`GOLD`, `PURCHASE`, `GEMS`) | `EVENING_ALLOWED` | Classical texts assume daytime, but the rite is a transaction, not a samskara, and evening purchase is ordinary Tamil practice. This is the weakest cell — it is a practice argument, not a text one. **[PRODUCT]** |
| Griha pravesh / foundation | `DAY_ONLY` | never at night. **[RECALL]** |
| All samskaras (tonsure, upanayanam, seemantham, annaprasana…) | `DAY_ONLY` | no evening. **[RECALL]** |

**Default matters more than any row**, and the owner's ruling makes the default
the whole of it. `DAY_ONLY` everywhere means all 30 sourced activities keep
their exact current behaviour, and evening becomes opt-in per activity if and
when a row is signed. No row above needs to be right for the change to be safe.

### 3.3 Honest consequence of S4: the approved cut-off currently binds nothing

Worth stating plainly so nobody reports S3 as a fix for a live defect.

With every activity on `DAY_ONLY`, the latest a window can end is
`sunset - 24m`. In Tamil Nadu sunset never passes ~18:45, so **no window can
approach 21:00 and the §3.1.3 cut-off can never fire today.**

It is still worth implementing, as a **defensive invariant rather than a
repair**: the 01:40 window that motivated the question came from v38 ranking
NIGHT Gowri kalas, and the cut-off is what makes that class of regression fail
a test instead of reaching a user. Assert it as a property over a sweep, and
expect it to be green from the first run — a guard that has never fired is the
intended state here, not evidence the guard is untested.

### 3.3 What this deliberately does not do

It does **not** add NIGHT Gowri kalas to the ranked candidate set. The handoff
is explicit that ranking night kalas is what produced the 01:40 window in v38,
and none of the above requires it: an evening window is a bounded clock range
(sunset+24m → cut-off) intersected with the existing hora and kalam logic, not
a new set of kalas competing on rank with the day's.

---

## 4. Signature status after the 2026-08-16 review

| # | Item | Status | What it unblocks |
|---|---|---|---|
| S3 | §3.1.3 — the 21:00 / 21:30 cut-off | **APPROVED** | Ship standalone. See §3.3 — it binds nothing today and that is expected. |
| S2 | §2.3 — the Tara band caps | **APPROVED** | T3 ships as a **scoring** factor, not the non-scoring fallback. |
| S4 | §3.2 — per-activity evening rows | **REJECTED for now** | Build the `evening_policy` field, value `DAY_ONLY` everywhere. Encode no row. |
| S1 | §1.2a — durmuhurtham weekday indices | **OWNER-AUTHORIZED 2026-08-17** | Seven consecutive Chennai entries confirm the production table. |
| Q4 | §5 — wealth-purchase lagna | **RULED** | Sourced rising-sign rule first; unsourced 2nd/11th bonus second. |

No further doctrine decision is required for Durmuhurtham. Work completed:
the muhurta-grid computation and verified weekday table (§1.3); the sandhya
and midnight guardrails (§3.1.1–2); the S3 cut-off as a
swept property (§3.3); the `evening_policy` field pinned to `DAY_ONLY` (§3.2);
and T3's tara factor **with scoring and caps** (§2.4).

---

## 4.5 Weekday avoidance severity — owner ruling 2026-08-17

**[OWNER-RULED / IMPLEMENTED]** Every weekday explicitly placed in an
activity's sourced `vara_avoid` set is a date-level veto, not a score penalty.
This includes the samskaras (Naming, Annaprasana, Ear Boring, Tonsure,
Upanayanam, Seemantham, and Lying-in) and the separately sourced learning,
adornment, and harvest exclusions. It does **not** create a global Saturday
ban: activities whose own source names Saturday favourable remain eligible.

Marriage has no weekday rule in the extracted Ch. XIV corpus, so it is not
silently included in this owner rule or attributed to Kalaprakasika.

## 5. Wealth-purchase muhurta lagna (§11 Q4)

### 5.1 There is no cited source rule for a "strong 2nd/11th"

The question asks whether a strong 2nd/11th is a bonus or a requirement, and
what counts as "strong" — occupancy, lord's dignity, or aspect. **The extracted
corpus does not support the question's framing, and this should be recorded as
the answer to Q4 rather than resolved by inventing a rule.**

The 2nd and the 11th do appear, but only ever inside **named, whole-configuration
yogas** — all-or-nothing planetary patterns, not a gradeable axis:

| Yoga | Configuration | Activity | Page |
|---|---|---|---|
| `STORE_FIRM_AGAINST_FAILURE` | Jupiter in lagna, Venus in the 2nd, Mercury in the 11th, Moon in the 10th | `TREASURE_STORE` | XXI, 110 |
| `SERVANTS_AND_DEPOSITS` | Thursday, Jupiter in the rising sign, Sun in the 11th, Saturn in the 6th | `TREASURE_STORE` | XXI, 110 |
| `JUPITER_LAGNA_MOON_4_SUN_11` | Jupiter in the rising sign, Moon in the 4th, Sun in the 11th, Saturn in the 7th | `HARVEST_INGATHERING` | XX, 108 |

A four-planet pattern either holds or it does not. Nothing here grades the 2nd
or the 11th on occupancy versus lord's dignity versus aspect. That axis is a
Muhurta Chintamani general principle, not this book's.

### 5.2 What the source *does* say — and it is already extracted

The chapter's actual wealth lagna rule is a **rising-sign list**, page-cited and
`CONFIRMED_EXACT`:

- `TREASURE_LAGNA_BEST = {2, 5, 8, 11}` (fixed signs), `TREASURE_LAGNA_MIDDLING
  = {3, 6, 9, 12}`, avoid-set deliberately empty — `kalaprakasika_treasure_rules.py:121-123`, p.110.
  Movable signs are left **unstated**, and Ch. XX's "movable should be left out
  of consideration" was correctly not imported: different activity.
- `NEW_ORNAMENT_LAGNA_BEST = {2, 3, 6, 9, 12}` — `kalaprakasika_adornment_rules.py:178`, p.117.
- Plus `NEW_CLOTHES`, `VIDYARAMBHAM`, `INGATHERING` and `GRAIN_EXPENDITURE`
  sign-lists already extracted alongside them.

These are unscored for exactly one reason, stated at
`kalaprakasika_treasure_rules.py:125-127`: the engine reads a snapshot whose
lagna is the **sunrise** lagna, and has no muhurta-moment lagna. That is A3/T6 —
**the same prerequisite the 2nd/11th rule would need.**

**So the first spend of A3 is the sourced rising-sign rule.** Identical cost,
page-cited rather than invented, and it activates eight already-extracted
activities at once: `TREASURE_STORE`, `GOLD`, `GEMS`, `NEW_ORNAMENT`,
`NEW_CLOTHES`, `VIDYARAMBHAM`, `HARVEST_INGATHERING`, `GRAIN_EXPENDITURE`.

### 5.3 The 2nd/11th bonus — approved as an explicitly unsourced factor

**[PRODUCT — owner-approved 2026-08-16.]** Built *after* §5.2, never instead of
it. Definition, to be encoded exactly as written:

- **Bonus only. Never a requirement, never a veto.** The question's "bonus or
  requirement" is answered: bonus.
- **Evaluated at the recommended window's midpoint**, using the A3 lagna
  schedule. It cannot be evaluated against a sunrise lagna, and must not be.
- **Condition:** the 2nd or the 11th from the muhurta lagna is occupied by an
  unafflicted natural benefic — Jupiter, Venus, or Mercury not combust and not
  conjoined a natural malefic — **and** no natural malefic (Sun, Mars, Saturn,
  Rahu, Ketu) occupies the 2nd. "Strong" is thus **occupancy plus non-affliction**;
  lord's dignity and aspect are deliberately excluded as a second unsourced
  choice layered on a first.
- **Magnitude: strictly smaller than any sourced factor**, and small enough that
  it can never move a day across a band boundary on its own. It refines an
  ordering; it does not make a verdict.
- **It is subordinate to §2.3.** It can never lift a day past a tara cap.
- **Provenance: `_unsourced(...)`, and the reason copy must not cite a page or
  imply the text says this.** Follow T4's marking exactly.

**Reuse note:** the combustion check this needs is the same one T4 needs for
karaka dignity. Build it once — `grep -rn "combust" app/calculations/` first,
per the handoff — and let both factors call it. Do not write a second.

Tamil copy for this factor is **SIGNED — owner-approved 2026-08-17**:

| Context | TA | EN |
|---|---|---|
| Unsourced 2nd/11th wealth bonus | `தேர்ந்தெடுத்த லக்னத்திலிருந்து 2 அல்லது 11ஆம் வீட்டில் பாதிப்பில்லாத சுபகிரகம் உள்ளது — இந்தச் செல்வக் கொள்முதலுக்கு ஆதரவு. இது கலப்பிரகாசிகை விதியல்ல; செயலி வழிகாட்டல்.` | `An unafflicted natural benefic occupies the 2nd or 11th from the selected lagna, supporting this wealth purchase. This is a product heuristic, not a Kalaprakasika rule.` |

**[IMPLEMENTED 2026-08-17]** The picker calculates the condition at the
selected-window midpoint for `TREASURE_STORE`, `GOLD`, `GEMS`,
`LAND_PURCHASE`, `LAND_POSSESSION`, and `NEW_ORNAMENT`. Its maximum is +1.0,
below every sourced score factor, and the service clips it at the existing
Usable/Good and Good/Best boundaries; Tara caps apply afterwards. The factor
has no rule ID and therefore serializes as `sourced: false`.

### 5.4 Order of work

1. A3 lagna schedule, within the §9.5 perf budget (top-5 days only).
2. §5.2 sourced rising-sign rule across the eight activities.
3. §5.3 bonus, with T4's shared combustion check.

Step 2 must be live and its output eyeballed before step 3 is judged — the
point of that ordering is to see whether the bonus adds anything the sourced
rule does not already say.
