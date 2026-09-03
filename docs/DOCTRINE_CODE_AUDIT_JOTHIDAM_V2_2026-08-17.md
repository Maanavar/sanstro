# Doctrine ↔ Code Audit — *Jothidam* AUDITED Edition v2 vs. the Vinaadi engine

**Date:** 2026-08-17
**Scope:** every engine-relevant claim in `Jothidam_AUDITED_Edition_v2_2026-08-15.md` (35 EC annotations + 7 standing engine rules), checked against the **running code**, not against other docs.
**Method:** read the modules; then diffed the shipped tables against the book's tables **programmatically** (script output reproduced inline). Where the two disagreed I judged both against classical Parashari / printed Tamil almanac practice rather than assuming either was right.

**Bottom line.** The engine is in far better doctrinal shape than the audit document assumes — the whole P0-ETHICS class was never ingested, the deterministic foundation is exact to the digit, and several EC items are already implemented in precisely the shape EC prescribes. Four real defects were found and fixed. Eight items need your ruling because they are doctrine choices, not bugs. And in three places **the book is wrong and the code is right**.

---

## A. Verified correct — with evidence

| Audit item | Where in code | Evidence |
|---|---|---|
| **EC-A34 Tier A** — Sarvashtakavarga 337 | `ashtakavarga.py` | Measured: Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn 39 → **SAV = 337 exactly**. The Mars-from-Lagna row had already been corrected from the spec doc's duplicated row (339→337). |
| **EC-A34 Tier A** — Vimshottari | `dasha.py` | Total **120 years**; sequence Ketu→Venus→Sun→Moon→Mars→Rahu→Jupiter→Saturn→Mercury; `NAK_LORD` **derived** as `SEQUENCE[(n-1)%9]`, not hand-listed. |
| **EC-A34 Tier A** — bhukti formula | `dasha.py:119` | `parent_years * DASHA_YEARS[lord] / 120.0` = B×C/120. Saturn→Ketu = 19×7/120 = 1.108333 yr = **13m 9d** at the 360-day convention — the book's p.30 worked example, to the day. |
| **EC-A01** — per-planet combustion, no generic 5°/10° | `transits.py:41` | `COMBUST_ORBS` = Mercury 14/12ᴿ, Venus 10/8ᴿ, Mars 17, Jupiter 11, Saturn 15 — **exactly** EC-A01's prescribed table. Graha yuddham is a **separate** detector (`chart_strength.detect_planetary_wars`) on absolute-longitude proximity, so the two phenomena are never conflated. Combustion is even graded (`combustion_severity`) with a cazimi override. |
| **EC-A03** — Sun 3/10, Venus 4/8 disabled | `aspects.py:18` | The table has Mars 4/7/8, Jupiter 5/7/9, Saturn 3/7/10 and nothing else. The p.39 additions never entered. |
| **EC-A05 / A17 / A17b** — no book astronomy | repo-wide | No distance, rotation or orbital figure from the book appears anywhere. All positions come from Swiss Ephemeris. |
| **EC-A06 / A07** — waxing/waning from elongation | `panchangam.py:1948` | `tithi_paksha` derives from `tithi_number`, which derives from the exact Sun–Moon elongation (`_tithi_angle_at_jd`), not from a house count. The p.31 shortcut was never coded. |
| **EC-A10** — Kuja dosha as an assessment, never a boolean | `_yoga_dosham.py:57` | Returns `conditions_met` (which reference points fired), `house_hits`, `cancellation_factors[]`, `mitigation_score`, `strength` (residual severity) and a graded `label`. This **is** the `MarsDoshaAssessment{…}` EC-A10 asks for. `HOUSE_SIGN_NIVARTHI` matches p.60's three house-sign exceptions exactly and adds two standard ones. |
| **EC-A15** — node dignity not hard-coded | `chart_strength.py:35` | `EXALTATION_RASI` / `DEBILITATION_RASI` contain **no** Rahu/Ketu entries. That is `NodeDignityScheme.NONE` — the only disposition that avoids inheriting the book's internal contradiction. |
| **EC-A16** — Sun's nakshatra triad | `dasha.py:33` | Derived, giving Krittika(3) / U.Phalguni(12) / U.Ashadha(21). The p.99 "Uttirattadhi" OCR error never entered. |
| **EC-A21** — Mandi has no own sign / no special aspects | `aspects.py:41` | `"MANDHI": frozenset({7})` — the 7th aspect only. No Kumbha ownership, no 2/7/12, no vahana. Exactly EC-A21's prescription, and explicitly documented as a choice. |
| **EC-A24** — Shodasavarga from BPHS, not from the book | `divisional_charts.py` | D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, **D27**, D30, **D40**, D45, D60. The two the book was missing are present; the book's garbled "Panchamsa"/"Suvedamsa" are absent. |
| **EC-A31** (Rahu Kalam half) — derived from sunrise | `panchangam.py:1919` | `kalam_slot_duration = (sunset - sunrise) / 8`. Rahu/Yama/Kuligai are weekday **slot indices** on that grid — no fixed clock table is stored anywhere. Durmuhurtham likewise uses `(sunset - sunrise) / 15`. |
| **EC-A11 / A29 / A32 / A33** — ethics exclusions | repo-wide | No planet→disease list, no widowhood-timing combination, no congenital-disability rule, no misconduct case study. The p.79 "bride dies or becomes widow" passage exists **only** inside a `RuleSource.authority` provenance record, with a note saying user-facing copy is a separate undecided question. One live exception — see **C6**. |
| **Standing rule 5** — veto hierarchy | `muhurta_service.py:686` | A vetoed day is dropped **before** the dasha (+10) and hora bonuses are added. A low-level bonus structurally cannot rescue a high-level veto. |
| **Standing rule 1** — rule metadata | `muhurta_doctrine.py` | `RuleSource` carries tradition, page, passage, scope, confidence, verification outcome, exceptions, overrides. `source_scope` specifically blocks a natal-chapter rule being silently promoted to muhurta scope. This is better than the audit asks for. |
| Badhaka scheme (p.22) | `_yoga_dosham.py:703` | movable→11th, fixed→9th, dual→7th. Exact. |
| Porutham **Dinam** (p.65) | `porutham.py:171` | `{2,4,6,8,9,11,13,15,18,20,24,26}` — **identical** to the book's 12-count list, same counting direction. |
| Porutham **Rajju** (p.69) | `porutham.py:128` | The 9-period tent cycle reproduces all five groups **cell-for-cell** against the book. |
| Porutham **Gana / Yoni** | `porutham.py:37,54` | Both are the correct classical 27-entry tables; the 7 hostile yoni pairs match p.68. |
| Porutham **Stri Dirgha** ≥8 | `porutham.py:208` | The lenient threshold — and the book itself sanctions it at p.67 ("some authorities accept more than 7"). |

---

## B. Defects found and **fixed** in this pass

### B1 — Vasya porutham table was missing two rows (live matching bug)

Two rows disagreed with **both** the book (p.69) and the standard Muhurta-Chintamani table, which agree with each other against the shipped code:

```
VASYA rasi 8  (Vrischika): code=[4]   classical=[4, 6]   book=[4, 6]
VASYA rasi 10 (Makara)   : code=[1]   classical=[1, 11]  book=[11]
```

These are **missing PASSes**, never spurious ones: couples who should have cleared Vasya porutham were being failed on it. Invisible to every existing test because each row still looked like a valid vasya row in isolation — only a full-table diff catches it.

**Fixed** in `app/calculations/porutham.py` (`8 → {4, 6}`, `10 → {1, 11}`), with the derivation recorded in a comment and a regression test (`test_vasya_table_carries_the_two_rows_that_were_incomplete`) asserting on the *score*, not the raw dict, so a later refactor cannot quietly drop them again.

Simha(5)→Tula(7) was deliberately **left alone**: the book prints Makara there, which contradicts every standard table. See **D2**.

### B2 — Naisargika maitri held a self-contradiction (two answers for one couple)

```
CONTRADICTION: RAHU->VENUS=friend, VENUS->RAHU=enemy
CONTRADICTION: KETU->VENUS=friend, VENUS->KETU=enemy
```

Not an asymmetry — a **contradiction**. Directional maitri is real doctrine (Moon counts Mercury a friend, Mercury counts Moon an enemy, and that is derivable from the Moolatrikona rule). But no tradition grades Venus and the nodes friend one way and enemy the other: classical maitri gives the nodes no friendships at all, and the Tamil node-inclusive table this repo's own Rahu/Ketu rows follow makes Venus and both nodes **mutual friends** — which is also exactly what the book prints at p.171.

Live consequences:
- `numerology_compatibility.graha_relation` returned **different answers depending on argument order** — a couple graded differently by who was entered first.
- `compatibility_intelligence._graha_relation` silently resolved it to "enemy" (enemy-wins).

**Fixed** in `chart_strength.py`: `VENUS` enemies `{SUN, MOON, RAHU, KETU}` → `{SUN, MOON}`, and `RAHU`/`KETU` added to Venus's friends. Distribution moved exactly as expected and no further: HARMONIOUS 15→17, ONE_SIDED 3→1, all other grades unchanged, total still 45.

Three golden tests in `test_numerology_compatibility.py` **encoded the contradiction as intended behaviour** ("Rahu counts Venus a friend; Venus counts Rahu an enemy … it is a fact about the grahas"). They were rewritten around the one genuine directional pair, Moon/Mercury, with the derivation stated. A new invariant test in `test_chart_strength.py` asserts the contradictory set is **exactly** `{Moon, Mercury}` — so neither direction of drift passes: re-introducing a spliced pair fails, and flattening the real asymmetry also fails.

### B3 — A second, hand-copied maitri table in daily guidance

`app/services/_dg_scoring.py` carried a byte-identical copy of the same table. Still in sync, but it is precisely how B2's fix would have survived in daily guidance after being corrected everywhere else. **Deduped** — now imported from the single definition.

### B4 — **Amirdhadhi Yogam was computed, cached, serialised and displayed, but no scorer ever read it**

This is the headline finding.

`AMIRDHADHI_YOGAM_TABLE` is a fully-sourced 7×27 grid (Ungal Vazhkkai Vazhikatti almanac, cross-checked against the publisher's own article and against Ernst Wilhelm's Dagdha set, locked by tests). It classifies every weekday×star pair as Amirtha / Siddha / **Marana** / **Prabalarishta**. It is persisted in the panchangam cache, exposed through the API and rendered on three surfaces.

**No scorer consulted it.** Not `muhurta_engine.score_day`, not `_compute_subha_muhurtham_broad/strict`, not `activity_timing_rules`. The only reachable function returned the *Tamil label*, never the class key — so nothing downstream could even ask.

The book states this classification **twice** (pp. 33–34 and 254–255) and calls Marana/Amrita "the two most important classifications for the reader to remember" (p.255), with stated consequences: land that does not stay with the buyer, a business that fails to develop, a marriage that turns bitter or ends in separation. **A day the almanac marks Marana Yogam could top a 60-day marriage search on the strength of its tithi and star alone.** In this Chennai sweep that is **19% of all days**.

**Wired:**
- `panchangam.amirdhadhi_yogam_class(weekday, nakshatra)` — new public accessor returning the class key, accepting either the weekday index or the snapshot's weekday name.
- `muhurta_engine._almanac_amirdhadhi_factor` — a new L1 factor: Amirtha +12, Siddha +4, Marana −16, Prabalarishta −30. Sized above the broad subha-star bonus (10) and level with the heaviest L2 star penalty, because the almanac treats this as a **gate**, not a preference. Graded PENALTY rather than VETO — the conservative reading (see **C8**).
- **EC-A08 polarity is honoured**: `_TERMINATIVE_ACTIVITIES` gates the adverse classes, because the very passage that gives the Marana rule also says a debt may be repaid on such a day and generalises it to "activities intended to terminate or cut off something". The set ships **empty** — every activity the engine currently scores is acquisitive or unitive — with `MEDICAL` deliberately excluded rather than guessed at. A test drives the branch through a temporary member so it is wired, not dead code.
- Five tests added, including one asserting the reason copy names **both** the weekday and the star (a bare "Marana Yogam" is not checkable against a printed almanac).

**Display calibration re-measured** (90 days × 30 sourced activities, general mode, n = 1975): min 1, p50 81, p95 131, max 150, 31.2% ≥ 100. The knee (80) and ceiling (180) still hold, so `display_score` was **not** retuned — but the docstring's measured numbers were updated, because a factor that moves the distribution without updating them turns a measured claim into a stale one.

---

## C. Found, **not** fixed — these need your ruling

> **RESOLVED 2026-08-17.** All eight were adjudicated in
> `EC-RULING-DOCTRINE-2026-08-17.md` and implemented; see
> [EC_RULING_IMPLEMENTATION_2026-08-17.md](EC_RULING_IMPLEMENTATION_2026-08-17.md).
> Outcomes: C1 Rasi porutham → directional skeleton, exceptions disabled ·
> C2 Chitra Vedha → HELD and flagged · C3 Hora → equal 60-min from sunrise ·
> C4 Rajju → exemption removed · C5 Sade Sati → A26/A25/A27 all shipped ·
> C6 widowhood copy → excised (and a **second** breach found on the public
> marketing page) · C7 Kuligai → polarity mechanism, table pending p.152 ·
> C8 Marana → stays a penalty; the blocking question is answered in that doc.
> The sections below are retained as the original findings.

### C1 — Rasi Porutham implements the North-Indian Bhakoot rule, not the Tamil one

`porutham.py:_rasi_score` fails only **Shashtashtaka (6/8 in either direction)**. The book (p.68) and the standard printed Tamil rule are different: counting from the **woman's** rasi to the man's, **2, 3, 4, 5 and 6 fail** and 7–12 (and same-rasi) pass.

Consequences of the divergence, in a module whose docstring says "Thirukanitham tradition":
- boy 2nd/3rd/4th/5th from girl → **code passes, Tamil practice fails**
- boy 8th from girl → **code fails, the p.68 rule passes**

I did not change it: it moves every compatibility result shipped, and both rules are genuinely in use. **Your call** — if you want the Tamil rule, it is a four-line change plus a golden-test update.

### C2 — Chitra can never fail Vedha porutham

```
stars with no vedha partner in code: [14]
VEDHA MISSING in code: 5-14 (book p.70)
VEDHA MISSING in code: 14-23 (book p.70)
```

The code has 13 vedha pairs covering 26 stars. Chitra (சித்திரை) has **no partner at all**, so 1 star in 27 is structurally exempt from a hard veto. The book (p.70) closes the gap by making Mrigashira / Chitra / Dhanishta **mutually** vedha; the code implements only Mrigashira–Dhanishta of that triple.

Not applied unilaterally because adding vedha pairs makes couples newly **fail a veto** — a strictly harsher change to live output. One word from you and it is two entries.

### C3 — Hora: the code uses unequal day/night hours; the book (and its mnemonic) require equal 60-minute hours

`panchangam._make_hora_entries` divides daylight into 12 and night into 12 (the Western/Drik planetary-hour method). EC-A31 (audit v2) says the book's Hora is **equal one-hour periods anchored at local sunrise**, and the book's own **6-1-8-3 mnemonic** (p.54 — the hora at 6 a.m. recurs at 1 p.m., 8 p.m., 3 a.m., i.e. every 7 clock-hours) only works with 60-minute horas.

Measured at Chennai:

```
2026-06-21  daylight 766 min → shipped hora 63.9 min (day) / 56.1 min (night)
            sunrise lord SUN: equal-hour repeat 12:47, shipped repeat 13:14 → 27 min drift
2026-12-21  daylight 674 min → shipped hora 56.2 min (day) / 63.8 min (night)
            sunrise lord MOON: equal-hour repeat 13:29, shipped repeat 13:03 → 27 min drift
```

**~27 minutes on a ~60-minute window — nearly half a hora wrong at midday.** This matters because the muhurta picker returns a *clock time* whose stated reason is the hora it sits in. Both schools genuinely exist, so this is a doctrine selection, not a bug — but it is the single largest numeric divergence I found, and the mnemonic is diagnostic evidence for the equal-hour reading.

### C4 — Rajju exempts eka-nakshatra; the book does not

`_rajju_score` returns PASS when both partners share a birth star ("accepted exception in Thirukanitham"). Same star necessarily means same rajju, and p.69 states the prohibition without that exception. The classical *eka nakshatra – bhinna pada* exception belongs to **Nadi** (where this repo implements it correctly), not to Rajju. Currently a hard veto is being silently waived.

### C5 — Sade Sati: all three of the audit's INSIGHT items are unimplemented

EC-A25, EC-A26 and EC-A27 are graded INSIGHT/ADOPT — the strongest positive verdicts in the whole document. None is in the code. `prediction_score.py:160` applies a flat `l5 -= 4` for `is_sade_sati` and that is the whole model.

- **EC-A25 mitigation gates** — natal Saturn exalted / own sign / 3-6-10-11 placement, SAV bindus > 30 in the transited sign. Nothing gates the penalty; there is no `mitigat*` anywhere in the Sade Sati path.
- **EC-A26 non-uniform 90 months** — 16 difficult / 35 comparatively favourable / 4 acute / remainder mixed. The code treats all three 2½-year phases as uniformly active.
- **EC-A27 the 5th is never touched** — I re-derived this independently and it is **correct**: Saturn in the 12th aspects 2/6/9, in the 1st aspects 3/7/10, in the 2nd aspects 4/8/11. Union of occupied and aspected houses over the whole cycle = everything **except the 5th**. Purva Punya is structurally untouched for all 7½ years. That is exactly the reassurance-with-rigour voice the readings should carry, and it is free — pure arithmetic on data already in hand.

Minor: `_SADE_SATI_SANI_TYPES` includes `"EZHARAI_SANI_PHASE_2"`, which `classify_sani_cycle` never emits (position 1 yields `JANMA_SANI`). Dead string.

### C6 — The one live EC-A11 breach: "widowhood risk" on the **public** porutham tool

`porutham.py:594-595` appends to the user-facing summary:

> ⚠ Rajju Dosha: same Rajju group — traditionally associated with **widowhood risk**; requires remedial attention.
> ⚠ ராஜ்ஜு தோஷம்: … **வைதவ்ய ஆபத்துடன்** தொடர்புடையது; பரிகாரம் அவசியம்.

This ships through `app/api/public_tools.py` to the **unauthenticated** marriage-porutham calculator and the public share page. It is a spouse-death assertion shown to anonymous visitors, which is precisely the class EC-A11 exists to block — and `tone_validator` does not catch it, because its banned list has "danger" and "crisis" but not "widowhood".

The dosha itself should absolutely stay flagged (it is a legitimate veto). What needs deciding is the *framing*. Suggested replacement, keeping the strength and losing the death assertion: "same Rajju group — traditionally one of the strongest objections in Tamil matching, and one that remedial guidance addresses directly." I have not changed user-facing copy without your sign-off.

### C7 — Kuligai is treated as purely inauspicious; the book gives it a polarity

The engine excludes Kuligai as a bad kalam everywhere. The book (p.152) says Gulika Kalam **multiplies** whatever is done in it — excellent for what you want repeated, ruinous for what you don't (hence the funeral prohibition). That is the same EC-A08 polarity primitive, and it means the current blanket exclusion is wrong in one direction for acquisitive activities like buying gold. Worth a ruling; I did not act because the current treatment is at least conservative.

### C8 — Should Marana Yogam **veto** rather than penalise?

I shipped B4 as a penalty. Printed Tamil almanacs offer no muhurtam at all on these days, which argues for a veto for UNION-intent activities. It is a one-constant change. It removes ~19% of every search window, so it is yours to call.

---

## D. Where the audit document / the book is **wrong** and the code is right

### D1 — Book p.69 Vasya: "Simha → Makara"

Every standard table gives **Simha → Tula**, which is what the code has. Treat the book's row as a source/OCR defect; do not "correct" the code toward it. (I left the code alone and said so in the comment.)

### D2 — The book's Marana/Amrita tables disagree with the Tamil almanac in 5 of 49 checked cells

```
Marana agreement: 18/22    Amrita non-contradiction: 26/27
  Sun + Krittika(3)   → engine Siddha,   book Marana
  Mon + Ashwini(1)    → engine Siddha,   book Marana
  Tue + Rohini(4)     → engine AMIRTHA,  book Marana     ← direct opposition
  Thu + Anuradha(17)  → engine Siddha,   book Marana
  Fri + Pushya(8)     → engine MARANA,   book Amrita     ← direct opposition
```

**22 of 27 book-listed cells agree** with the independently-sourced almanac grid, which is strong mutual corroboration — and per the audit's own **standing rule 7** (Tamil Panchanga tradition ranks above this book's experiential rules), the almanac wins the five disputes. Note also that the engine's Friday Marana row is a **superset** of the book's and matches the classical Dagdha set cell-for-cell, so Fri+Pushya is the book being loose, not the engine being wrong. Recorded here so a future reader does not "fix" the almanac toward the book.

### D3 — EC-A01's Moon 12° combustion

The classical table does give the Moon a 12° orb; the code deliberately excludes the Moon, on the documented Tamil reading that Moon-near-Sun is **Amavasai**, not combustion. Defensible school choice, worth knowing it is a choice.

### D4 — EC-A22 is right about the classics but the code keeps the Tamil overlay

EC-A22 is correct that classical Parashari gives the **Moon no enemies**. The code lists Rahu/Ketu as the Moon's enemies (`_NATURAL_ENEMIES['MOON']`), which is common Tamil practice. It cannot reach `_dignity_score` (nodes are never sign lords), so it only affects planet-to-planet regard. Left as-is and now documented in the table's comment. If you want the strict Parashari reading, say so and it is one line.

### D5 — EC-A31 conflates two corrections

The Rahu Kalam half of EC-A31 is right and already implemented. The Hora half is presented as a correction but is a **school selection** (see C3). Worth splitting in any future revision of the audit doc.

---

## E. Sourced, verified, and simply not built yet

Not defects — EC-A34 Tier B material that is correct and usable but has no implementation:

- **Kendradhipatya Dosha** (p.22) — no implementation anywhere.
- **Indu Lagna** (p.49) — the kala numbers and the 9th-lord method; no implementation.
- **Hora activity associations** (pp.55–56) — including *Saturn hora for repaying debt*, which is the cleanest available seed for the EC-A08 TERMINATION polarity the engine now has a hook for.
- **EC-A25 / A26 / A27** Sade Sati (see C5) — the highest value-per-line items in the document.

---

## Changes made in this pass

| File | Change |
|---|---|
| `app/calculations/porutham.py` | Vasya rows 8 and 10 completed; derivation documented |
| `app/calculations/chart_strength.py` | Venus/node maitri contradiction resolved; table provenance documented |
| `app/services/_dg_scoring.py` | Duplicate maitri table removed, imported instead |
| `app/calculations/panchangam.py` | New `amirdhadhi_yogam_class()` accessor |
| `app/calculations/muhurta_engine.py` | New `_almanac_amirdhadhi_factor` (L1) + `_TERMINATIVE_ACTIVITIES` polarity gate + 4 weights; display-scale note re-measured |
| `tests/test_porutham.py` | Vasya regression test |
| `tests/test_chart_strength.py` | Maitri contradiction invariant + Moon/Mercury asymmetry test |
| `tests/test_numerology_compatibility.py` | Three golden tests corrected (they encoded the contradiction) |
| `tests/test_numerology_chart_api.py` | The same Rahu/Venus pair, pinned a **fourth** time at the API boundary — corrected |
| `tests/test_muhurta_engine.py` | Five Amirdhadhi tests incl. the EC-A08 polarity branch |

**Test status.** Full backend suite against the Postgres test DB: **3222 passed, 1 failed, 13 skipped** (39m30s). The single failure was
`test_numerology_chart_api::test_compatibility_layers_numbers_over_the_poruthams`
— the *fourth* place the Venus/Rahu contradiction had been pinned as expected
behaviour, asserting `grahaRelation == "one_sided"` and `("friend", "enemy")` for
the destiny pair. Corrected to `harmonious` / `("friend", "friend")`; that file now
passes **47/47**. The directional-regard property the test exists to guard is
unharmed — its *psychic* pair (Rahu/Saturn) still carries a genuine one-way regard.

That four golden tests across three files all encoded the same contradiction is
itself the lesson: a wrong table gets locked in proportionally to how visible it
is, so a defect in shared reference data costs more test edits than code edits.

Ruff clean on every changed file.
