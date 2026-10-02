# Vinaadi rulebook — table appendix

**Generated file. Do not hand-edit.** Produced by
`scripts/generate_rulebook_appendix.py` directly from the constants the live
calculation modules evaluate, and kept in sync by
`tests/test_rulebook_appendix_sync.py`.

This is the companion to
[the external-review rulebook](VINAADI_ASTROLOGY_RULEBOOK_FOR_EXTERNAL_REVIEW.md).
The rulebook states each rule; this file shows the table that rule actually runs
on, so a reviewer never has to verify a table they cannot see. Rule IDs match
between the two documents.

Nakshatra numbering is 1-27 in the standard order (Aswini = 1). Rasi numbering is
1-12 (Mesham = 1). Weekday rows are printed Sunday-first regardless of the
internal Monday-zero index.

---

## `PAN-12` Amirdhadhi Yogam — full 7 x 27 grid

189 cells, exactly as the engine evaluates them. Columns are nakshatra numbers
1-27 in the standard order.

| Weekday | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Sunday | C | P | C | C | C | C | C | C | C | M | C | A | C | C | C | M | M | M | A | C | A | A | M | C | C | A | A |
| Monday | C | C | M | A | C | C | A | C | C | M | C | C | C | P | A | M | C | C | C | M | M | A | C | C | M | C | C |
| Tuesday | C | C | C | A | C | M | C | C | C | C | C | A | C | C | C | M | C | M | A | C | P | C | C | M | M | A | C |
| Wednesday | M | C | A | C | C | C | C | C | C | C | A | A | M | C | C | C | C | C | M | A | A | C | P | C | A | C | M |
| Thursday | A | C | M | M | M | M | A | C | C | A | C | M | C | C | A | C | C | P | C | C | C | C | C | M | C | C | C |
| Friday | A | C | C | M | C | C | C | M | M | M | C | C | A | C | C | C | C | M | A | P | C | M | C | C | C | C | C |
| Saturday | C | C | C | A | C | C | C | C | M | A | C | M | M | M | C | C | C | C | C | C | C | C | C | A | M | C | P |

**Legend.**

- `A` — அமிர்தயோகம்
- `C` — சித்தயோகம்
- `M` — மரணயோகம்
- `P` — பிரபலாரிஷ்ட யோகம்

**Nakshatra column key.** 1=Aswini, 2=Bharani, 3=Karthigai, 4=Rohini, 5=Mirugaseeridam, 6=Thiruvathirai, 7=Punarpoosam, 8=Poosam, 9=Ayilyam, 10=Magam, 11=Pooram, 12=Uthiram, 13=Hastham, 14=Chithirai, 15=Swathi, 16=Visakam, 17=Anusham, 18=Kettai, 19=Moolam, 20=Pooradam, 21=Uthiradam, 22=Thiruvonam, 23=Avittam, 24=Sadayam, 25=Poorattathi, 26=Uthirattathi, 27=Revathi

**Scoring weights applied to these classes (`PAN-13`, product):**

- Amirtha `A` = +12
- Siddha `C` = +4
- Marana `M` = -16
- Prabalarishta `P` = -30 — Vinaadi muhurta weights (`PAN-13`), not classical numbers.

---

## `PAN-06` Rahu Kalam / Yamagandam / Kuligai daylight slots

Sunrise-to-sunset daylight is divided into **eight equal parts**; the numbers
below are which part (1-8) each kalam occupies on each weekday.

| Weekday | Rahu Kalam | Yamagandam | Kuligai |
|---|---|---|---|
| Sunday | 8 | 5 | 7 |
| Monday | 2 | 4 | 6 |
| Tuesday | 7 | 3 | 5 |
| Wednesday | 5 | 2 | 4 |
| Thursday | 6 | 1 | 3 |
| Friday | 4 | 7 | 2 |
| Saturday | 3 | 6 | 1 |

---

## `PAN-07` Gowri Panchangam — day and night kala sequences

Eight slots across daylight, and eight across the night. These are **not** one
rotating 8-cycle; each weekday row is listed in full for that reason.

**Day (sunrise to sunset):**

| Weekday | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 | Slot 6 | Slot 7 | Slot 8 |
|---|---|---|---|---|---|---|---|---|
| Sunday | UTHI | AMIRTHAM | ROGAM | LABHAM | DHANAM | SUGAM | SORAM | VISHAM |
| Monday | AMIRTHAM | VISHAM | ROGAM | LABHAM | DHANAM | SUGAM | SORAM | UTHI |
| Tuesday | ROGAM | LABHAM | DHANAM | SUGAM | SORAM | UTHI | VISHAM | AMIRTHAM |
| Wednesday | LABHAM | DHANAM | SUGAM | SORAM | VISHAM | UTHI | AMIRTHAM | ROGAM |
| Thursday | DHANAM | SUGAM | SORAM | UTHI | AMIRTHAM | VISHAM | ROGAM | LABHAM |
| Friday | SUGAM | SORAM | UTHI | VISHAM | AMIRTHAM | ROGAM | LABHAM | DHANAM |
| Saturday | SORAM | UTHI | VISHAM | AMIRTHAM | ROGAM | LABHAM | DHANAM | SUGAM |

**Night (sunset to next sunrise):**

| Weekday | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 | Slot 6 | Slot 7 | Slot 8 |
|---|---|---|---|---|---|---|---|---|
| Sunday | DHANAM | SUGAM | SORAM | VISHAM | UTHI | AMIRTHAM | ROGAM | LABHAM |
| Monday | SUGAM | SORAM | UTHI | AMIRTHAM | VISHAM | ROGAM | LABHAM | DHANAM |
| Tuesday | SORAM | UTHI | VISHAM | AMIRTHAM | ROGAM | LABHAM | DHANAM | SUGAM |
| Wednesday | UTHI | AMIRTHAM | ROGAM | LABHAM | DHANAM | SUGAM | SORAM | VISHAM |
| Thursday | AMIRTHAM | VISHAM | ROGAM | LABHAM | DHANAM | SUGAM | SORAM | UTHI |
| Friday | ROGAM | LABHAM | DHANAM | SUGAM | SORAM | UTHI | VISHAM | AMIRTHAM |
| Saturday | LABHAM | DHANAM | SUGAM | SORAM | UTHI | VISHAM | AMIRTHAM | ROGAM |

Kalas treated as good (Nalla Neram candidates): **AMIRTHAM, DHANAM, LABHAM, SUGAM, UTHI**. All others are
caution kalas. Vinaadi additionally suppresses a nominally good kala that
overlaps Rahu Kalam / Yamagandam.

---

## `PAN-08` / `MUH-07` Hora — one shared equal-hour implementation

There is a **single** hora implementation in the engine; the panchangam display
and the muhurta ranker read the same one. Both rules describe it, and both are
now marked `[VARIANT]` for that reason.

- Horas per day: **24**, each exactly **60 minutes**.
- Anchor: true local Hindu sunrise (`PAN-01`), not midnight and not clock 06:00.
- Lord order (descending geocentric distance, the classical hora chain):
  `SUN -> VENUS -> MERCURY -> MOON -> SATURN -> GURU -> MARS`.
- The first hora of a day belongs to that weekday's lord; successive weekdays
  therefore step five places along the chain (7 horas x 24 / 7).

**Why equal hours.** The Tamil almanac hora tables print whole-hour boundaries
and rely on the 6-1-8-3 mnemonic, which only holds if every hora is exactly
sixty minutes — the cycle has to land seven clock hours later each time. The
alternative twelve-unequal-day / twelve-unequal-night planetary hour convention
is authentic and in wide use elsewhere; it is not what Vinaadi calculates.

---

## `PAN-03` / `PAN-04` Tithi, Yoga and Karana — the exact formulas

All three are computed from sidereal longitudes, normalised into `[0, 360)`
before division.

**Tithi** — `floor(((moon - sun) mod 360) / 12)`, yielding 30 tithis.
Paksha is Shukla for tithi 1-15 and Krishna for 16-30.

**Yoga** — `floor(((sun + moon) mod 360) / 13.3333)`, yielding 27 yogas. Note
this is the **sum** of the two longitudes, not the difference used for tithi.

**Karana** — half-tithi steps of 6 degrees of elongation, 60 per lunar month.
The sequence is **not** a plain 60-cycle: it is one fixed opening karana, then
seven movable karanas repeating eight times, then three fixed closing karanas.
Stating it as "6-degree half-tithi" alone is not enough to reproduce it, so:

| Index | Karana |
|---|---|
| 0 | Kimstughna (fixed opening) |
| 1-56 | the seven movable karanas, repeating: BAVA, BALAVA, KAULAVA, TAITILA, GARAJA, VANIJA, VISHTI |
| 57 | Shakuni (fixed) |
| 58 | Chatushpada (fixed) |
| 59 | Naga (fixed) |

Vishti (Bhadra) is the movable karana treated as inauspicious.

---

## `PAN-09` Abhijit Muhurtham — formula and exclusion policy

The rulebook previously said "exposed as a midday timing factor where
applicable", which names neither the window nor what makes it inapplicable.

- **Window:** a fixed **solar noon +/- 24 minutes**, i.e. 48 minutes centred on
  local apparent noon. Solar noon is derived from the same ephemeris transit
  calculation as sunrise, so it tracks the equation of time and longitude within
  the timezone rather than assuming clock 12:00.
- **Exclusion:** **Wednesday**. On Wednesday the day is marked
  `abhijit_restricted` and the muhurta engine awards no Abhijit credit.
- **Declared simplification.** A fixed +/-24 minutes is the common clock-table
  convention. Some traditions instead scale Abhijit to one fifteenth of the
  actual daylight span, which makes it wider in summer and narrower in winter.
  Vinaadi uses the fixed window; this is a school choice, not an oversight, and
  it is the kind of thing a reviewer should rule on.

---

## `PAN-11` Jeevan / Nethiram — cutoffs, and their scoring reach

Both are derived from a **symmetric ring distance** `d` between the Sun's
nakshatra and the day's Moon nakshatra: `d = min(|a-b| mod 27, 27 - (|a-b| mod 27))`.

**Jeevan** — `d <= 1` -> 0; `d == 9` -> 0; `d <= 8` -> 0.5; otherwise 1.
Labels: 0 = இல்லை, 0.5 = அரை வாழ்க்கை, 1 = முழு வாழ்க்கை.

**Nethiram** — `d <= 2` -> 0; `d <= 8` -> 1; otherwise 2.
Labels: 0 = குருடு, 1 = ஒரு கண், 2 = இரு கண்.

**Scoring reach: none.** Both are strings on the panchangam snapshot, rendered on
the Calendar surface with an explanatory hint. Neither feeds daily score, muhurta
ranking, porutham, or any recommendation. Grep for `jeevan` / `nethiram` returns
only the calculation, the schema field, the service passthrough, and the display
name maps.

**Open item.** A 2026-08-10 live case (Chennai) disagrees with the Nethiram
cutoff: Sun in Ayilyam (10), Moon in Thiruvathirai (7), `d = 3`, table gives "one
eye", the reviewing astrologer said "blind". A single case underdetermines the
replacement, so the cutoff has deliberately not been guess-patched. Tracked in
`docs/ASTROLOGER_REVIEW_QUEUE.md`.

---

## `POR-02` / `POR-03` / `POR-05` count sets and directions

Direction of counting is the part that most often differs between lineages, so
each rule states its own direction explicitly.

| Rule | Direction of count | Pass condition |
|---|---|---|
| Dinam | girl's nakshatra -> boy's, inclusive 1-27 | count in {2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26} |
| Mahendra | girl's nakshatra counted **from the boy's**, inclusive | count in {4, 7, 10, 13, 16, 19, 22, 25} |
| Sthree Deergham | boy's nakshatra **from the girl's**, 0-based offset | offset > 6, i.e. inclusive count >= 8 |
| Rasi | woman's Moon rasi -> man's, inclusive 1-12 | same rasi, or count 7-12; counts {2, 3, 4, 5, 6} fail |

**Mahendra direction note.** The reference spec counts boy-from-girl. Outcomes
are identical here only because {4, 7, 10, 13, 16, 19, 22, 25} happens to be
closed under `c -> 29 - c` (the two directions around a 27-star ring sum to 29).
That is an accident of this set, not a general guarantee — locked by
`test_mahendra_good_set_symmetric_under_direction_reversal`.

**Sthree Deergham threshold.** Vinaadi uses the **lenient** >= 8. Some traditions
require >= 13 (half the circle). This is a declared school choice.

**Rasi exception clauses.** `RASI_EXCEPTIONS_ENABLED = True`.
The 2nd-position even-sign exception and the six 6th-position pair exceptions are live (Kalaprakasika p.74). Jothidam p.68's 6th-position even-sign exception is ruled in but held: we hold a paraphrase, not the sentence, and its scope decides whether the 6th-position failure survives at all.

---

## `POR-04` Gana table

| Nakshatra | Gana |
|---|---|
| 1. Aswini | Deva |
| 2. Bharani | Manushya |
| 3. Karthigai | Rakshasa |
| 4. Rohini | Manushya |
| 5. Mirugaseeridam | Deva |
| 6. Thiruvathirai | Manushya |
| 7. Punarpoosam | Deva |
| 8. Poosam | Deva |
| 9. Ayilyam | Rakshasa |
| 10. Magam | Rakshasa |
| 11. Pooram | Manushya |
| 12. Uthiram | Manushya |
| 13. Hastham | Deva |
| 14. Chithirai | Rakshasa |
| 15. Swathi | Deva |
| 16. Visakam | Rakshasa |
| 17. Anusham | Deva |
| 18. Kettai | Rakshasa |
| 19. Moolam | Rakshasa |
| 20. Pooradam | Manushya |
| 21. Uthiradam | Manushya |
| 22. Thiruvonam | Deva |
| 23. Avittam | Rakshasa |
| 24. Sadayam | Rakshasa |
| 25. Poorattathi | Manushya |
| 26. Uthirattathi | Manushya |
| 27. Revathi | Deva |

---

## `POR-04` Yoni table and hostile pairs

| Nakshatra | Yoni |
|---|---|
| 1. Aswini | Horse |
| 2. Bharani | Elephant |
| 3. Karthigai | Sheep |
| 4. Rohini | Serpent |
| 5. Mirugaseeridam | Serpent |
| 6. Thiruvathirai | Dog |
| 7. Punarpoosam | Cat |
| 8. Poosam | Sheep |
| 9. Ayilyam | Cat |
| 10. Magam | Rat |
| 11. Pooram | Rat |
| 12. Uthiram | Cow |
| 13. Hastham | Buffalo |
| 14. Chithirai | Tiger |
| 15. Swathi | Buffalo |
| 16. Visakam | Tiger |
| 17. Anusham | Deer |
| 18. Kettai | Deer |
| 19. Moolam | Dog |
| 20. Pooradam | Monkey |
| 21. Uthiradam | Mongoose |
| 22. Thiruvonam | Monkey |
| 23. Avittam | Lion |
| 24. Sadayam | Horse |
| 25. Poorattathi | Lion |
| 26. Uthirattathi | Cow |
| 27. Revathi | Elephant |

**Hostile (natural-enemy) pairs — these fail; same or any other combination passes:**

- Buffalo vs Horse
- Cat vs Rat
- Cow vs Tiger
- Deer vs Dog
- Elephant vs Lion
- Mongoose vs Serpent
- Monkey vs Sheep

---

## `POR-04` Vasya table

Read as: a person of the left-hand rasi is drawn to (vasya of) the rasis on the
right. Vinaadi passes the kuta when the relation holds in either direction, or
when both are the same rasi.

| Rasi | Vasya to |
|---|---|
| 1. Mesham | 5. Simmam, 8. Viruchigam |
| 2. Rishabam | 4. Kadagam, 7. Thulam |
| 3. Mithunam | 6. Kanni |
| 4. Kadagam | 8. Viruchigam, 9. Dhanusu |
| 5. Simmam | 7. Thulam |
| 6. Kanni | 3. Mithunam, 12. Meenam |
| 7. Thulam | 10. Magaram |
| 8. Viruchigam | 4. Kadagam, 6. Kanni |
| 9. Dhanusu | 12. Meenam |
| 10. Magaram | 1. Mesham, 11. Kumbam |
| 11. Kumbam | 1. Mesham |
| 12. Meenam | 10. Magaram |

Two rows were incomplete in an earlier revision and are now carried in full:
Viruchigam -> Kadagam/Kanni, and Magaram -> Mesham/Kumbham. Simmam -> Thulaam is
retained; the conflicting Simmam -> Magaram book row is deliberately not used.

---

## `POR-04` Rasi Adhipathi / Graha Maitri

Rasi lords used by the kuta:

| Rasi | Lord |
|---|---|
| 1. Mesham | Mars |
| 2. Rishabam | Venus |
| 3. Mithunam | Mercury |
| 4. Kadagam | Moon |
| 5. Simmam | Sun |
| 6. Kanni | Mercury |
| 7. Thulam | Venus |
| 8. Viruchigam | Mars |
| 9. Dhanusu | Jupiter |
| 10. Magaram | Saturn |
| 11. Kumbam | Saturn |
| 12. Meenam | Jupiter |

Directional relation scores between the seven rasi lords — row is the viewer,
column the viewed. `1` friend, `0.5` neutral, `0` enemy.

| From \\ To | Jupiter | Mars | Mercury | Moon | Saturn | Sun | Venus |
|---|---|---|---|---|---|---|---|
| Jupiter | 1 | 1 | 0 | 1 | 0.5 | 1 | 0 |
| Mars | 1 | 1 | 0 | 1 | 0.5 | 1 | 0.5 |
| Mercury | 0.5 | 0.5 | 1 | 0 | 0.5 | 1 | 1 |
| Moon | 0.5 | 0.5 | 1 | 1 | 0.5 | 1 | 0.5 |
| Saturn | 0.5 | 0 | 1 | 0 | 1 | 0 | 1 |
| Sun | 1 | 1 | 0.5 | 1 | 0 | 1 | 0 |
| Venus | 0.5 | 0.5 | 1 | 0 | 1 | 0 | 1 |

The kuta fails when either direction is `0`; a one-way enmity is enough to fail.

---

## `POR-06` Rajju groups

Same Rajju group **fails**. There is no eka-nakshatra exemption: two people born
under the same nakshatra share a Rajju group by definition and therefore fail.
The eka-nakshatra / bhinna-pada exception belongs to Nadi, not to Rajju.

| Nakshatra | Rajju group |
|---|---|
| 1. Aswini | Pada (foot) |
| 2. Bharani | Kati (waist) |
| 3. Karthigai | Udara (stomach) |
| 4. Rohini | Kanta (neck) |
| 5. Mirugaseeridam | Sira (head) |
| 6. Thiruvathirai | Kanta (neck) |
| 7. Punarpoosam | Udara (stomach) |
| 8. Poosam | Kati (waist) |
| 9. Ayilyam | Pada (foot) |
| 10. Magam | Pada (foot) |
| 11. Pooram | Kati (waist) |
| 12. Uthiram | Udara (stomach) |
| 13. Hastham | Kanta (neck) |
| 14. Chithirai | Sira (head) |
| 15. Swathi | Kanta (neck) |
| 16. Visakam | Udara (stomach) |
| 17. Anusham | Kati (waist) |
| 18. Kettai | Pada (foot) |
| 19. Moolam | Pada (foot) |
| 20. Pooradam | Kati (waist) |
| 21. Uthiradam | Udara (stomach) |
| 22. Thiruvonam | Kanta (neck) |
| 23. Avittam | Sira (head) |
| 24. Sadayam | Kanta (neck) |
| 25. Poorattathi | Udara (stomach) |
| 26. Uthirattathi | Kati (waist) |
| 27. Revathi | Pada (foot) |

---

## `POR-07` Vedha pairs

Vedha is a hard concern. 15 mutual pairs, each blocking in both
directions:

| Nakshatra | Vedha with |
|---|---|
| 1. Aswini | 18. Kettai |
| 2. Bharani | 17. Anusham |
| 3. Karthigai | 16. Visakam |
| 4. Rohini | 15. Swathi |
| 5. Mirugaseeridam | 14. Chithirai |
| 5. Mirugaseeridam | 23. Avittam |
| 6. Thiruvathirai | 22. Thiruvonam |
| 7. Punarpoosam | 21. Uthiradam |
| 8. Poosam | 20. Pooradam |
| 9. Ayilyam | 19. Moolam |
| 10. Magam | 27. Revathi |
| 11. Pooram | 26. Uthirattathi |
| 12. Uthiram | 25. Poorattathi |
| 13. Hastham | 24. Sadayam |
| 14. Chithirai | 23. Avittam |

Mrigashira, Chitra and Dhanishta form a mutual **three-star** group, which is why
they appear in more than one row. No nakshatra is left structurally exempt — an
earlier revision wrongly treated Chitra as having no Vedha partner, and
`test_rulebook_invariants.py` now asserts all three pairings of that trio fire.

`VEDHA_TABLE_UNVERIFIED = False`. RESOLVED against Jothidam p.70: Mrigashira/Chitra/Dhanishta are mutually Vedha, so all 27 stars are covered and no star is veto-exempt.

---

## `POR-08` Nadi

Assigned by the repeating cycle `AADHI -> MADHYA -> ANTHYA -> ANTHYA -> MADHYA -> AADHI` across the 27 nakshatras.

| Nakshatra | Nadi |
|---|---|
| 1. Aswini | Aadhi |
| 2. Bharani | Madhya |
| 3. Karthigai | Anthya |
| 4. Rohini | Anthya |
| 5. Mirugaseeridam | Madhya |
| 6. Thiruvathirai | Aadhi |
| 7. Punarpoosam | Aadhi |
| 8. Poosam | Madhya |
| 9. Ayilyam | Anthya |
| 10. Magam | Anthya |
| 11. Pooram | Madhya |
| 12. Uthiram | Aadhi |
| 13. Hastham | Aadhi |
| 14. Chithirai | Madhya |
| 15. Swathi | Anthya |
| 16. Visakam | Anthya |
| 17. Anusham | Madhya |
| 18. Kettai | Aadhi |
| 19. Moolam | Aadhi |
| 20. Pooradam | Madhya |
| 21. Uthiradam | Anthya |
| 22. Thiruvonam | Anthya |
| 23. Avittam | Madhya |
| 24. Sadayam | Aadhi |
| 25. Poorattathi | Aadhi |
| 26. Uthirattathi | Madhya |
| 27. Revathi | Anthya |

Same Nadi is a dosha. Modes: `strict, classical_lenient` — resolved by
the caller from a feature flag, never by the calculation layer. A Nadi pass or
parihara **does not** cancel Rajju.

---

## `POR-12` Moon-Moon positional grouping and its label mapping

The **positional grouping** is classical (dwirdwadasa 2/12, shadashtaka 6/8,
trikona 5/9, samasaptama 7, kendra 4/10, upachaya 3/11). The **verdict words**
are a Vinaadi presentation layer, split out as `POR-12a [PRODUCT]`.

| Inclusive count | Vinaadi label | Classical grouping |
|---|---|---|
| 1 | GOOD | same rasi |
| 2 | MIXED | dwirdwadasa |
| 3 | GOOD | upachaya |
| 4 | GOOD | kendra |
| 5 | EXCELLENT | trikona |
| 6 | TENSE | shadashtaka |
| 7 | GOOD | samasaptama |
| 8 | TENSE | shadashtaka |
| 9 | EXCELLENT | trikona |
| 10 | GOOD | kendra |
| 11 | GOOD | upachaya |
| 12 | MIXED | dwirdwadasa |

Symmetric by construction: the table is keyed on the shorter arc, so A-to-B and
B-to-A give the same label. The label feeds the emotional-compatibility subscore
as EXCELLENT 5, GOOD 4, MIXED 2, TENSE 0 — Vinaadi weights, `POR-12a`.

---

## `STR-01` / `STR-02` Natural friendship — the live directional table

Row is the viewer, column the viewed. `F` friend, `E` enemy, `N` neutral.
Directional: read across the row for what that graha thinks.

| From \\ To | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn | Rahu | Ketu |
|---|---|---|---|---|---|---|---|---|---|
| Sun | - | F | F | N | F | E | E | E | E |
| Moon | F | - | N | F | N | N | N | E | E |
| Mars | F | F | - | E | F | N | N | E | F |
| Mercury | F | E | N | - | N | F | N | N | N |
| Jupiter | F | F | F | E | - | E | N | E | E |
| Venus | E | E | N | F | N | - | F | F | F |
| Saturn | E | E | E | F | N | F | - | F | N |
| Rahu | E | E | E | N | E | F | F | - | E |
| Ketu | E | E | F | N | E | F | N | E | - |

**Why this is `[VARIANT]`, not plain Parashari.** The table includes Rahu and
Ketu as friendship participants, which strict Parashari natural-friendship
tables do not. Venus-Rahu and Venus-Ketu are mutual friends here; Moon holds
both nodes as enemies (`STR-03`).

**Known asymmetries a reviewer should rule on.**

- Moon-Mercury: Moon holds Mercury a friend, Mercury holds Moon an enemy. This is
  the genuine classical asymmetry and is intentional.
- Ketu holds Rahu an enemy; Rahu does not list Ketu at all. The nodes are always
  180 degrees apart so this never affects a conjunction, but it does reach
  relationship read-outs.
- Ketu holds Mars a friend; Mars holds Ketu neither friend nor enemy.

**`STR-02` symmetrisation is a Vinaadi algorithm, not a table.** Where one
symmetric label is required: enemy in either direction -> enemy; friend in both
directions -> friend; otherwise neutral. It is marked `[PRODUCT]` because the
underlying doctrine is the directional table above, not this reduction.

---

## `YOG-*` Yoga detectors — one row per definition

**This section is the `YOG-01` split.** Until 2026-08-27 every yoga in the engine
sat behind a single rulebook ID, and the reviewing astrologer declined to sign
that block: twenty independent definitions cannot take one verdict, and Raja
Yoga alone has several legitimate classical formulations. Each definition below
now carries its own ID, presence test, strength ladder, cancellation set and
marker, so each can be marked **Correct / Incorrect / Incomplete / Variant**
individually.

Generated from `app/calculations/yoga_rules.py`, which is pinned to the emitted
yoga codes by `tests/test_yoga_rules.py` — a new yoga cannot ship without a row
here, and a row here cannot describe a yoga the engine does not emit.

**41 rules over 39 emitted codes**, from 20 detector
functions. Rules outnumber codes because `RAJA_YOGA` merges two independent
formulations onto one card and one row records a deliberate non-detection; codes
outnumber detectors because Pancha Mahapurusha emits five, the Chandra yogas
three and Kartari three.

**Scoring reach.** Every yoga reaches the reader as a card carrying a strength
band, its `conditions_met` list and an activation score 0-100
(`yoga_activation.yoga_activation_score`), and feeds the life-area and
prediction layers through that score. The three `YOG-NKC-*` nakshatra cautions
are the exception: display-only, no strength, no activation, no scoring reach.

**Reading "Activation grahas".** These are the grahas whose maha/antar dasha
raises a present yoga above the dormant rung. **"none — dormant-capped" means
the yoga's activation score can never exceed `round(strength_base × 0.45)`**, no
matter which dasha runs. That is a live behaviour, disclosed here rather than
hidden. **"Per chart"** means the activating grahas are resolved for each chart
from the planets that formed it (astrologer ruling 2026-09-23) — Raja Yoga, the
yogakaraka, Amala, Adhi and Daridra. Where the true key grahas are still
lagna-dependent but tabled statically (Dhana, Vipareetha) the listed set is a
`[PRODUCT]` approximation and the row says so.

### Index

| Rule | Yoga | Emitted code | Detector | Markers | Activation grahas |
|---|---|---|---|---|---|
| `YOG-GK-02` | Gaja Kesari Yoga | `GAJA_KESARI_PARASHARA` | `_yoga_detect.detect_gaja_kesari_parashara` | `[TRADITION]` `[PRODUCT]` | Jupiter, Moon |
| `YOG-GK-01` | Gaja Kesari pattern | `GAJA_KESARI_YOGA` | `_yoga_detect.detect_gaja_kesari` | `[VARIANT]` `[PRODUCT]` | Jupiter, Moon |
| `YOG-RY-01` | Raja Yoga — trikona/kendra lord association | `RAJA_YOGA` | `_yoga_detect.detect_raja_yoga` | `[VARIANT]` `[PRODUCT]` | Per chart: This instance's own trikona lord and kendra lord (the fixed list is only a fallback). |
| `YOG-RY-02` | Raja Yoga — trikona/kendra lord exchange | `RAJA_YOGA` | `yogas.detect_yogas_and_doshams` | `[VARIANT]` | Per chart: The two exchanging lords of this instance. |
| `YOG-RY-03` | Raja Yoga — formulations deliberately not implemented | — (not detected) | `—` | `[LIMIT]` | — (not detected) |
| `YOG-RY-04` | Yogakaraka planet | `YOGAKARAKA_RAJA_YOGA` | `_yoga_detect.detect_raja_yogakaraka` | `[TRADITION]` `[PRODUCT]` | Per chart: The yogakaraka graha itself. |
| `YOG-DN-01` | Dhana Yoga | `DHANA_YOGA` | `_yoga_detect.detect_dhana_yoga` | `[TRADITION]` `[PRODUCT]` | Jupiter, Venus, Mercury |
| `YOG-DN-02` | Dhana Yoga (supportive) | `DHANA_SUPPORTIVE_YOGA` | `_yoga_detect.detect_dhana_yoga_supportive` | `[PRODUCT]` | Jupiter, Venus, Mercury |
| `YOG-NBR-01` | Neecha Bhanga Raja Yoga | `NEECHA_BHANGA_RAJA_YOGA` | `_yoga_detect.detect_neecha_bhanga` | `[TRADITION]` | Per chart: The debilitated graha itself (DD-15). |
| `YOG-NRV-01` | Retrograde debilitated-planet Raja Yoga | `RETROGRADE_DEBILITATED_RAJA_YOGA` | `_yoga_detect.detect_retrograde_debilitated_raja_yoga` | `[TRADITION]` `[PRODUCT]` `[LIMIT]` | Per chart: The debilitated retrograde graha itself. |
| `YOG-PMP-01` | Ruchaka Yoga (Chevvai) | `RUCHAKA_YOGA` | `_yoga_detect.detect_pancha_mahapurusha` | `[TRADITION]` | Mars |
| `YOG-PMP-02` | Bhadra Yoga (Budhan) | `BHADRA_YOGA` | `_yoga_detect.detect_pancha_mahapurusha` | `[TRADITION]` | Mercury |
| `YOG-PMP-03` | Hamsa Yoga (Guru) | `HAMSA_YOGA` | `_yoga_detect.detect_pancha_mahapurusha` | `[TRADITION]` | Jupiter |
| `YOG-PMP-04` | Malavya Yoga (Sukran) | `MALAVYA_YOGA` | `_yoga_detect.detect_pancha_mahapurusha` | `[TRADITION]` | Venus |
| `YOG-PMP-05` | Sasa Yoga (Sani) | `SASA_YOGA` | `_yoga_detect.detect_pancha_mahapurusha` | `[TRADITION]` | Saturn |
| `YOG-BA-01` | Budha Aditya Yoga | `BUDHA_ADITYA_YOGA` | `_yoga_detect.detect_budha_aditya` | `[TRADITION]` `[VARIANT]` | Sun, Mercury |
| `YOG-VRY-01` | Vipareetha Raja Yoga (Harsha / Sarala / Vimala) | `VIPAREETHA_RAJA_YOGA` | `_yoga_detect.detect_vipareetha_raja` | `[VARIANT]` | Saturn, Mars, Jupiter |
| `YOG-PV-01` | Parivartana Yoga (Maha / Dainya / Kahala) | `PARIVARTANA_YOGA` | `_yoga_detect.detect_parivartana` | `[TRADITION]` `[PRODUCT]` | Per chart: Both exchanging lords (DD-15). |
| `YOG-CM-01` | Chandra Mangala Yoga | `CHANDRA_MANGALA_YOGA` | `_yoga_detect.detect_chandra_mangala` | `[TRADITION]` `[VARIANT]` | Moon, Mars |
| `YOG-SK-01` | Sakata Yoga | `SAKATA_YOGA` | `_yoga_detect.detect_sakata_yoga` | `[TRADITION]` `[PRODUCT]` | Moon, Jupiter |
| `YOG-KD-01` | Kemadruma Yoga | `KEMADRUMA_YOGA` | `_yoga_detect.detect_kemadruma_yoga` | `[TRADITION]` `[PRODUCT]` | Moon |
| `YOG-KT-01` | Papa Kartari Yoga | `PAPA_KARTARI_YOGA` | `_yoga_detect.detect_kartari_yoga` | `[TRADITION]` | Per chart: The hemming planets (DD-15). |
| `YOG-KT-02` | Shubha Kartari Yoga | `SHUBHA_KARTARI_YOGA` | `_yoga_detect.detect_kartari_yoga` | `[TRADITION]` | Per chart: The hemming planets (DD-15). |
| `YOG-KT-03` | Kartari — neither formation present | `KARTARI_YOGA` | `_yoga_detect.detect_kartari_yoga` | `[PRODUCT]` | **none — dormant-capped** |
| `YOG-CH-01` | Guru Chandala Yoga | `CHANDALA_YOGA` | `_yoga_detect.detect_chandala_yoga` | `[TRADITION]` `[LIMIT]` | Per chart: Guru and Rahu (DD-15). |
| `YOG-CH-02` | Guru Chandala Yoga (Ketu variant) | `CHANDALA_KETU_YOGA` | `_yoga_detect.detect_chandala_yoga_ketu_variant` | `[VARIANT]` | Per chart: Guru and Ketu (DD-15). |
| `YOG-AM-01` | Amala Yoga | `AMALA_YOGA` | `_yoga_detect.detect_amala_yoga` | `[TRADITION]` `[PRODUCT]` | Per chart: The benefics occupying the 10th — never the 10th lord. |
| `YOG-AD-01` | Adhi pattern (base) | `ADHI_BASE` | `_yoga_detect.detect_adhi_base` | `[VARIANT]` `[PRODUCT]` | Per chart: The benefics in the 6th/7th/8th from Chandran. |
| `YOG-AD-02` | Adhi Yoga (raja-grade candidate) | `ADHI_RAJA_GRADE` | `_yoga_detect.detect_adhi_raja_grade` | `[LIMIT]` `[PRODUCT]` | Per chart: The forming benefics in the 6th/7th/8th from Chandran. |
| `YOG-DR-01` | Daridra Yoga | `DARIDRA_YOGA` | `_yoga_detect.detect_daridra_yoga` | `[TRADITION]` | Per chart: The 11th lord of this lagna. |
| `YOG-DR-02` | Daridra Yoga (Vinaadi proxy) | `DARIDRA_PROXY_YOGA` | `_yoga_detect.detect_daridra_yoga_proxy` | `[PRODUCT]` | Per chart: The 11th lord of this lagna. |
| `YOG-LK-01` | Lakshmi Yoga | `LAKSHMI_YOGA` | `_yoga_detect.detect_lakshmi_yoga` | `[TRADITION]` `[PRODUCT]` | Per chart: The 9th lord and the lagna lord (DD-15). |
| `YOG-LK-02` | Lakshmi Yoga (Phaladeepika form) | `LAKSHMI_YOGA_PHALADEEPIKA` | `_yoga_detect.detect_lakshmi_yoga_phaladeepika` | `[VARIANT]` | Per chart: The 9th lord and Sukran (DD-15). |
| `YOG-LK-03` | Fortune support | `BHAGYA_SUPPORT` | `_yoga_detect.detect_bhagya_support` | `[PRODUCT]` | Per chart: The 9th lord. |
| `YOG-SAD-01` | Sunapha Yoga | `SUNAPHA_YOGA` | `_yoga_detect.detect_sunapha_anapha_durudhura` | `[TRADITION]` `[PRODUCT]` | Per chart: The planets in the 2nd from Chandran (DD-15). |
| `YOG-SAD-02` | Anapha Yoga | `ANAPHA_YOGA` | `_yoga_detect.detect_sunapha_anapha_durudhura` | `[TRADITION]` `[PRODUCT]` | Per chart: The planets in the 12th from Chandran (DD-15). |
| `YOG-SAD-03` | Durudhura Yoga | `DURUDHURA_YOGA` | `_yoga_detect.detect_sunapha_anapha_durudhura` | `[TRADITION]` `[PRODUCT]` | Per chart: The planets on both sides of Chandran (DD-15). |
| `YOG-VS-01` | Vasumati Yoga | `VASUMATI_YOGA` | `_yoga_detect.detect_vasumati_yoga` | `[VARIANT]` `[PRODUCT]` | Per chart: Each qualifying benefic in the upachayas (DD-15). |
| `YOG-NKC-01` | Ayilyam (Ashlesha) caution | `AYILYAM_CAUTION` | `_yoga_detect.detect_nakshatra_cautions` | `[TAMIL_LINEAGE]` `[LIMIT]` | n/a — not scored |
| `YOG-NKC-02` | Kettai (Jyeshtha) caution | `KETTAI_CAUTION` | `_yoga_detect.detect_nakshatra_cautions` | `[TAMIL_LINEAGE]` `[LIMIT]` | n/a — not scored |
| `YOG-NKC-03` | Moolam (Moola) caution | `MOOLAM_CAUTION` | `_yoga_detect.detect_nakshatra_cautions` | `[TAMIL_LINEAGE]` `[LIMIT]` | n/a — not scored |

### The definitions

#### `YOG-GK-02` Gaja Kesari Yoga (கஜகேசரி யோகம்)

|  |  |
|---|---|
| **Emitted as** | `GAJA_KESARI_PARASHARA` |
| **Detector** | `_yoga_detect.detect_gaja_kesari_parashara` |
| **Markers** | `[TRADITION]` `[PRODUCT]` |
| **Present when** | Guru is in a kendra from Lagna or Chandran, is joined or aspected by a chart-dynamic benefic, and is not debilitated, combust, or in an enemy sign. Same-sign placement counts as the first kendra. |
| **Strength** | STRONG on formation, then gated over Guru and Chandran. |
| **Cancellation** | Any failed formation clause makes this strict form absent; neecha bhanga does not rescue it. |
| **Source** | BPHS 36.3-4 (verse numbering remains external-review pending). |
| **Activation grahas** | Jupiter, Moon |
| **Note** | Strict Parashara form. Dynamic benefic classification follows DD-12. Whether the waxing Moon may itself be the supporting benefic is open item O-22 (default: yes, literal). |

#### `YOG-GK-01` Gaja Kesari pattern (கஜகேசரி அமைப்பு)

|  |  |
|---|---|
| **Emitted as** | `GAJA_KESARI_YOGA` |
| **Detector** | `_yoga_detect.detect_gaja_kesari` |
| **Markers** | `[VARIANT]` `[PRODUCT]` |
| **Present when** | Guru occupies a kendra (1/4/7/10) counted from **Chandran's** rasi, whole sign. |
| **Strength** | STRONG on formation, then gated over Guru and Chandran. |
| **Cancellation** | None that removes the yoga. Dignity and combustion lower the reported strength, never presence. |
| **Source** | Yoga chapters of BPHS and Phaladeepika; kendra-from-Chandran is the standard form. |
| **Activation grahas** | Jupiter, Moon |
| **Note** | Presence is counted from Chandran only. Texts that additionally require Guru to be free of debilitation or combustion are honoured as a strength downgrade rather than as absence — a declared choice. Strength is then lowered one rung per condition by `_yoga_helpers.gate_yoga_strength` — a key graha's composite natal score below 45, or a key graha combust — and floored at PARTIAL, so a gate never hides a formed yoga. |

#### `YOG-RY-01` Raja Yoga — trikona/kendra lord association (ராஜயோகம் — இணைப்பு)

|  |  |
|---|---|
| **Emitted as** | `RAJA_YOGA` |
| **Detector** | `_yoga_detect.detect_raja_yoga` |
| **Markers** | `[VARIANT]` `[PRODUCT]` |
| **Present when** | For every pair of an eligible trikona lord (of 1/5/9) and an eligible kendra lord (of 1/4/7/10) that are different grahas: the two share a rasi, **or** each casts a drishti on the other's rasi (a **mutual** aspect, DD-07). Parashari aspects including the special 4/8, 5/9 and 3/10 (`CORE-11`). A one-way special aspect (audit L-3) links only under open item O-15. Eligibility is read from the functional-status rule table (`functional_status.raja_participation`, DD-07). |
| **Strength** | STRONG per firing pair, gated over that pair's two lords. Each instance also records a Tier C grade, `raja_grade_full` / `_qualified` / `_mixed`, from both lords' co-lordships. The chart card is the merge of every pair — best strength, union of conditions, activated if any pair is activated. |
| **Cancellation** | — |
| **Source** | Parashari trikona-kendra sambandha, BPHS raja yoga chapters. The association reading is one of several live formulations, not the only one. |
| **Activation grahas** | Per chart: This instance's own trikona lord and kendra lord (the fixed list is only a fallback). |
| **Note** | **This is the formulation choice the reviewer asked to see.** At least four are in live Tamil use: (a) association of a trikona and a kendra lord — implemented here; (b) mutual exchange between them — `YOG-RY-02`; (c) a single graha owning both a kendra and a trikona acting as yogakaraka on its own; (d) the strict Dharma-Karmadhipati reading, 9th lord with 10th lord only. Vinaadi implements (a) and (b). Because every lagna has one lord shared between the two sets, the association test is generous: it iterates all trikona × kendra pairs and one hit forms the yoga. **Ruling 2026-09-23:** (1) each instance activates on its own two lords, carried in `YogaResult.key_grahas`; the `key_planets` below is now only a fallback for a card with no instance. (2) A lord that also owns the 6th/8th qualifies only if its moolatrikona sign is the kendra/trikona it owns. This excludes Kadagam Guru (6+9) and Sani (7+8), Kanni Sani (5+6) and Kumbam Budhan (5+8) from every Raja Yoga; set against DD-07's trikona-dominates reading it is open item O-23 (default: this ruling). Precedence is lagna ownership first: the lagna lord always qualifies. **DD-07 (v1.3) changed the 12th:** a 12th co-lord is never downgraded for the 12th alone (O-4), which re-admits Rishabam Sevvai, Thulam Budhan and Viruchigam Sukran — the conflict with this ruling is open item O-14. (3) Rahu/Ketu sharing a sign with a forming lord are recorded as supporting (`supporting_grahas`), never forming, and their dashas do not activate the card. |

#### `YOG-RY-02` Raja Yoga — trikona/kendra lord exchange (ராஜயோகம் — பரிவர்தனம்)

|  |  |
|---|---|
| **Emitted as** | `RAJA_YOGA` |
| **Detector** | `yogas.detect_yogas_and_doshams` |
| **Markers** | `[VARIANT]` |
| **Present when** | A MAHA-grade sign exchange (`YOG-PV-01`) whose two grahas are one kendra lord and one trikona lord, in either order. Recorded as `<a>_<b>_parivartana_link`. |
| **Strength** | STRONG, flat. |
| **Cancellation** | — |
| **Source** | Parivartana raja yoga, standard in the Tamil commentaries on the exchange yogas. |
| **Activation grahas** | Per chart: The two exchanging lords of this instance. |
| **Note** | Merges into the same `RAJA_YOGA` card as `YOG-RY-01`. **This path is not strength-gated** while `YOG-RY-01` is — a combust or badly placed pair still reports STRONG here. That asymmetry is disclosed rather than quietly evened out, because evening it out is a doctrine call. The same 2026-09-23 lord-eligibility, per-instance trigger and Rahu/Ketu rules as `YOG-RY-01` apply. |

#### `YOG-RY-03` Raja Yoga — formulations deliberately not implemented

|  |  |
|---|---|
| **Emitted as** | nothing — this row records a non-detection |
| **Detector** | `—` |
| **Markers** | `[LIMIT]` |
| **Present when** | Never fires. This row records what the engine does *not* detect. |
| **Strength** | — |
| **Cancellation** | — |
| **Source** | — |
| **Activation grahas** | — (not detected) |
| **Note** | Not reported by Vinaadi under any name: (a) retired 2026-09-23 — the lone yogakaraka is now `YOG-RY-04`, its own card, which since 2026-10-01 reports the yogakaraka planet's strength and makes no Raja Yoga claim; (b) the two lords merely occupying kendras from each other, without conjunction, drishti or exchange; (c) raja yogas read from the Navamsa or from Chandra lagna rather than from the Lagna; (d) Dharma-Karmadhipati as a **separately named** yoga — the 9th/10th pair does form `YOG-RY-01`, but it is never distinguished from any other trikona-kendra link on the card. Neecha Bhanga and Vipareetha raja yogas are detected, under their own IDs. |

#### `YOG-RY-04` Yogakaraka planet (யோககாரக கிரகம்)

|  |  |
|---|---|
| **Emitted as** | `YOGAKARAKA_RAJA_YOGA` |
| **Detector** | `_yoga_detect.detect_raja_yogakaraka` |
| **Markers** | `[TRADITION]` `[PRODUCT]` |
| **Present when** | One graha holds `DUAL_LORD_YOGAKARAKA` in the functional-status matrix (DD-07): it owns one of {4, 7, 10} **and** one of {5, 9}; house 1 never satisfies either side. Exactly six lagnas have one — Sani for Rishabha/Thulam, Sevvai for Kataka/Simha, Sukran for Makara/Kumbam. Ownership alone makes it the yogakaraka. |
| **Strength** | STRONG on formation; PARTIAL when the yogakaraka is debilitated, combust or placed in the 6th/8th/12th from Lagna — one rung however many apply, each recorded as `<graha>_yogakaraka_<affliction>`. A debility cancelled by Neecha Bhanga (`neecha_bhanga_cancelled`, the same predicate as `YOG-NBR-01`) costs nothing and is recorded as `<graha>_yogakaraka_neecha_bhanga`; the other afflictions still apply (ruling 2026-10-01, option B). Strength is then lowered one rung per condition by `_yoga_helpers.gate_yoga_strength` — a key graha's composite natal score below 45, or a key graha combust — and floored at PARTIAL, so a gate never hides a formed yoga. Here the gate reads the composite score only; combustion is already counted once, above. |
| **Cancellation** | None. Debility, combustion and a dusthana placement lower its yogakaraka strength; they never remove its yogakaraka status (owner ruling 2026-09-23, superseding the first-pass dignity gate). |
| **Source** | Yogakaraka graha, BPHS — a single lord of a kendra and a trikona. |
| **Activation grahas** | Per chart: The yogakaraka graha itself. |
| **Note** | Astrologer ruling 2026-10-01: this card reports the yogakaraka **planet and its strength**, not a distinct Raja Yoga. Ownership alone does not create a yoga; a Raja Yoga still needs `YOG-RY-01`'s link between lords. The emitted code keeps its historical name `YOGAKARAKA_RAJA_YOGA` as a stable API key only. Supersedes the 2026-09-23 framing as 'a distinct yoga type'. The yogakaraka is carried per chart in `YogaResult.key_grahas`. |

#### `YOG-DN-01` Dhana Yoga (தன யோகம்)

|  |  |
|---|---|
| **Emitted as** | `DHANA_YOGA` |
| **Detector** | `_yoga_detect.detect_dhana_yoga` |
| **Markers** | `[TRADITION]` `[PRODUCT]` |
| **Present when** | Either of two conditions on the 2nd and 11th lords: they share a rasi (`second_eleventh_conjunction`), or each occupies the sign the other rules (`second_eleventh_exchange`). The third, parentless condition no longer lives on this card — see `YOG-DN-02`. |
| **Strength** | STRONG when either condition fires. Then gated over the two lords. |
| **Cancellation** | — |
| **Source** | The 2nd/11th dhana formulation of the BPHS dhana yoga chapter. |
| **Activation grahas** | Jupiter, Venus, Mercury |
| **Note** | **Separated by the 2026-08-28 ruling** ('Separate `[PRODUCT]`'). This card now carries only the two sourced conditions, so a reader meeting `DHANA_YOGA` sees a claim with a printed classical parent. `key_planets` is a `[PRODUCT]` approximation for the same reason as `YOG-RY-01`. Strength is then lowered one rung per condition by `_yoga_helpers.gate_yoga_strength` — a key graha's composite natal score below 45, or a key graha combust — and floored at PARTIAL, so a gate never hides a formed yoga. |

#### `YOG-DN-02` Dhana Yoga (supportive) (தன யோகம் (துணை))

|  |  |
|---|---|
| **Emitted as** | `DHANA_SUPPORTIVE_YOGA` |
| **Detector** | `_yoga_detect.detect_dhana_yoga_supportive` |
| **Markers** | `[PRODUCT]` |
| **Present when** | Both the 2nd and 11th lords stand in a kendra or a trikona (`both_lords_in_strong_houses`). |
| **Strength** | PARTIAL when formed, gated over the two lords; WEAK otherwise. |
| **Cancellation** | — |
| **Source** | No single source claimed. A Vinaadi proxy for 'both wealth lords are well placed', not a classical dhana yoga. |
| **Activation grahas** | Jupiter, Venus, Mercury |
| **Note** | **Split off `YOG-DN-01` by ruling, kept rather than dropped.** This is much the commonest of the original three Dhana conditions, so it fires on a large share of charts — now on its own labelled card rather than under the classical name. `key_planets` is a `[PRODUCT]` approximation for the same reason as `YOG-RY-01`. Strength is then lowered one rung per condition by `_yoga_helpers.gate_yoga_strength` — a key graha's composite natal score below 45, or a key graha combust — and floored at PARTIAL, so a gate never hides a formed yoga. |

#### `YOG-NBR-01` Neecha Bhanga Raja Yoga (நீசபங்க ராஜயோகம்)

|  |  |
|---|---|
| **Emitted as** | `NEECHA_BHANGA_RAJA_YOGA` |
| **Detector** | `_yoga_detect.detect_neecha_bhanga` |
| **Markers** | `[TRADITION]` |
| **Present when** | A graha stands in its debilitation rasi **and** at least one rule of `neecha_bhanga.NEECHA_BHANGA_RULES` fires whose verse states a raja-yoga result (O-13). One rule per Phaladeepika verse (DD-09): NB-a debilitation-sign lord in a kendra from Lagna or Chandran (7.26/7.29); NB-b exaltation-sign lord in a kendra from Lagna or Chandran (7.26/7.29); NB-c the two lords in mutual kendras (7.27); NB-d the debilitated graha aspected by its debilitation-sign lord (7.28), NB-d+ the same outside 6/8/12 (7.28, second half); NB-g either lord in a kendra from Lagna (7.30, reference point O-10). **Any one rule cancels** — there is no count threshold. |
| **Strength** | By distinct conditions, not verses (Tier C): one → WEAK (shown as 'Mild'), two → PARTIAL, three or more → STRONG. NB-g never adds a point NB-a/NB-b already counted; NB-d+ adds one. Ungated. |
| **Cancellation** | Retrogression of the debilitated graha is recorded as a supporting note only (`debilitated_planet_retrograde_note`) and never forms the yoga by itself — the retrograde verse is open item O-11. Off by default: NB-f, Navamsa strength (O-7); NB-x1/NB-x2, two conditions the engine shipped without a verse in DD-09's table (O-12). Budhan rules its own exaltation sign, so for a debilitated Budhan NB-b, NB-c and NB-g would test Budhan's own position — the deleted NB-e; that self-reference is skipped (O-21). |
| **Source** | Phaladeepika 7.26–30, verse map checked against the Subrahmanya Sastri translation online (siva.sh, 2026-10-01); physical edition pending (§18). DOCTRINE_DECISIONS v1.3, DD-09. |
| **Activation grahas** | Per chart: The debilitated graha itself (DD-15). |
| **Note** | The rules are **not** in the yoga module: `neecha_bhanga` holds them and `chart_strength.neecha_bhanga_cancelled` wraps them, so this card, the +14 bhanga term in the strength synthesis and the yogakaraka card cannot disagree on one chart (audit C2). DD-09 removed the verse-less conditions the predicate used to carry and NB-e (the debilitated graha itself in a kendra), which no cited verse states. With any one condition the yoga fires on many charts, so the card must always show its strength. The old static key graha (`JUPITER`) is retired by DD-15: the debilitated graha activates. |

#### `YOG-NRV-01` Retrograde debilitated-planet Raja Yoga (வக்ர நீச ராஜயோகம்)

|  |  |
|---|---|
| **Emitted as** | `RETROGRADE_DEBILITATED_RAJA_YOGA` |
| **Detector** | `_yoga_detect.detect_retrograde_debilitated_raja_yoga` |
| **Markers** | `[TRADITION]` `[PRODUCT]` `[LIMIT]` |
| **Present when** | A debilitated graha is retrograde, outside houses 6/8/12 from Lagna, and has bright rays. O-11 must be enabled. |
| **Strength** | STRONG when every formation clause is met; no composite-score gate. |
| **Cancellation** | Combustion fails the engine's provisional bright-rays test. |
| **Source** | Phaladeepika chapter 7, retrograde debilitated-planet verse; verse number and physical-edition wording remain pending section 18. |
| **Activation grahas** | Per chart: The debilitated retrograde graha itself. |
| **Note** | Off by default under O-11. Vinaadi provisionally translates bright rays as non-combust; that translation is Tier C and must be ruled. |

#### `YOG-PMP-01` Ruchaka Yoga (Chevvai) (ருசக யோகம்)

|  |  |
|---|---|
| **Emitted as** | `RUCHAKA_YOGA` |
| **Detector** | `_yoga_detect.detect_pancha_mahapurusha` |
| **Markers** | `[TRADITION]` |
| **Present when** | Chevvai stands in its own sign, its exaltation sign or its Moolatrikona sign, **and** that rasi is a kendra (1/4/7/10) from Lagna. |
| **Strength** | STRONG on formation, gated over Chevvai alone. |
| **Cancellation** | — |
| **Source** | Pancha Mahapurusha chapter, BPHS and Phaladeepika. |
| **Activation grahas** | Mars |
| **Note** | Kendra is counted from the **Lagna only**; schools that also count from Chandran would report more of these. The Moolatrikona clause tests the sign (`MOOLATRIKONA_ZONE[graha][0]`), not the degree band — which changes nothing for these five, because each of their Moolatrikona signs is also one of their own signs (Chevvai Mesham, Budhan Kanni, Guru Dhanusu, Sukran Thulam, Sani Kumbam), so the own-sign clause already catches every such placement. All three dignity clauses are recorded separately in `conditions_met`. |

#### `YOG-PMP-02` Bhadra Yoga (Budhan) (பத்ர யோகம்)

|  |  |
|---|---|
| **Emitted as** | `BHADRA_YOGA` |
| **Detector** | `_yoga_detect.detect_pancha_mahapurusha` |
| **Markers** | `[TRADITION]` |
| **Present when** | Budhan stands in its own sign, its exaltation sign or its Moolatrikona sign, **and** that rasi is a kendra from Lagna. |
| **Strength** | STRONG on formation, gated over Budhan alone. |
| **Cancellation** | — |
| **Source** | Pancha Mahapurusha chapter, BPHS and Phaladeepika. |
| **Activation grahas** | Mercury |
| **Note** | Kendra is counted from the **Lagna only**; schools that also count from Chandran would report more of these. The Moolatrikona clause tests the sign (`MOOLATRIKONA_ZONE[graha][0]`), not the degree band — which changes nothing for these five, because each of their Moolatrikona signs is also one of their own signs (Chevvai Mesham, Budhan Kanni, Guru Dhanusu, Sukran Thulam, Sani Kumbam), so the own-sign clause already catches every such placement. All three dignity clauses are recorded separately in `conditions_met`. |

#### `YOG-PMP-03` Hamsa Yoga (Guru) (ஹம்ச யோகம்)

|  |  |
|---|---|
| **Emitted as** | `HAMSA_YOGA` |
| **Detector** | `_yoga_detect.detect_pancha_mahapurusha` |
| **Markers** | `[TRADITION]` |
| **Present when** | Guru stands in its own sign, its exaltation sign or its Moolatrikona sign, **and** that rasi is a kendra from Lagna. |
| **Strength** | STRONG on formation, gated over Guru alone. |
| **Cancellation** | — |
| **Source** | Pancha Mahapurusha chapter, BPHS and Phaladeepika. |
| **Activation grahas** | Jupiter |
| **Note** | Kendra is counted from the **Lagna only**; schools that also count from Chandran would report more of these. The Moolatrikona clause tests the sign (`MOOLATRIKONA_ZONE[graha][0]`), not the degree band — which changes nothing for these five, because each of their Moolatrikona signs is also one of their own signs (Chevvai Mesham, Budhan Kanni, Guru Dhanusu, Sukran Thulam, Sani Kumbam), so the own-sign clause already catches every such placement. All three dignity clauses are recorded separately in `conditions_met`. |

#### `YOG-PMP-04` Malavya Yoga (Sukran) (மாளவ்ய யோகம்)

|  |  |
|---|---|
| **Emitted as** | `MALAVYA_YOGA` |
| **Detector** | `_yoga_detect.detect_pancha_mahapurusha` |
| **Markers** | `[TRADITION]` |
| **Present when** | Sukran stands in its own sign, its exaltation sign or its Moolatrikona sign, **and** that rasi is a kendra from Lagna. |
| **Strength** | STRONG on formation, gated over Sukran alone. |
| **Cancellation** | — |
| **Source** | Pancha Mahapurusha chapter, BPHS and Phaladeepika. |
| **Activation grahas** | Venus |
| **Note** | Kendra is counted from the **Lagna only**; schools that also count from Chandran would report more of these. The Moolatrikona clause tests the sign (`MOOLATRIKONA_ZONE[graha][0]`), not the degree band — which changes nothing for these five, because each of their Moolatrikona signs is also one of their own signs (Chevvai Mesham, Budhan Kanni, Guru Dhanusu, Sukran Thulam, Sani Kumbam), so the own-sign clause already catches every such placement. All three dignity clauses are recorded separately in `conditions_met`. |

#### `YOG-PMP-05` Sasa Yoga (Sani) (சஸ யோகம்)

|  |  |
|---|---|
| **Emitted as** | `SASA_YOGA` |
| **Detector** | `_yoga_detect.detect_pancha_mahapurusha` |
| **Markers** | `[TRADITION]` |
| **Present when** | Sani stands in its own sign, its exaltation sign or its Moolatrikona sign, **and** that rasi is a kendra from Lagna. |
| **Strength** | STRONG on formation, gated over Sani alone. |
| **Cancellation** | — |
| **Source** | Pancha Mahapurusha chapter, BPHS and Phaladeepika. |
| **Activation grahas** | Saturn |
| **Note** | Kendra is counted from the **Lagna only**; schools that also count from Chandran would report more of these. The Moolatrikona clause tests the sign (`MOOLATRIKONA_ZONE[graha][0]`), not the degree band — which changes nothing for these five, because each of their Moolatrikona signs is also one of their own signs (Chevvai Mesham, Budhan Kanni, Guru Dhanusu, Sukran Thulam, Sani Kumbam), so the own-sign clause already catches every such placement. All three dignity clauses are recorded separately in `conditions_met`. |

#### `YOG-BA-01` Budha Aditya Yoga (புத ஆதித்ய யோகம்)

|  |  |
|---|---|
| **Emitted as** | `BUDHA_ADITYA_YOGA` |
| **Detector** | `_yoga_detect.detect_budha_aditya` |
| **Markers** | `[TRADITION]` `[VARIANT]` |
| **Present when** | Budhan and Suriyan share a rasi. |
| **Strength** | STRONG when Budhan is not combust; PARTIAL when it is. Reported present in both cases. |
| **Cancellation** | — |
| **Source** | Standard in the Tamil yoga lists; BPHS treats the Sun-Mercury conjunction under buddhi yogas. |
| **Activation grahas** | Sun, Mercury |
| **Note** | Whole sign, no degree orb. **Treating a combust Budhan as a partial yoga rather than as no yoga is a declared school choice**: Budhan inside its combustion orb of Suriyan is the ordinary state of this conjunction, and a strict no-combust rule would make the yoga nearly unreportable. The card names the reason ('internalized intellect') rather than dropping silently. |

#### `YOG-VRY-01` Vipareetha Raja Yoga (Harsha / Sarala / Vimala) (விபரீத ராஜயோகம்)

|  |  |
|---|---|
| **Emitted as** | `VIPAREETHA_RAJA_YOGA` |
| **Detector** | `_yoga_detect.detect_vipareetha_raja` |
| **Markers** | `[VARIANT]` |
| **Present when** | The lord of the 6th, 8th or 12th occupies a dusthana (6/8/12), **including its own**. Every hit is recorded as `<lord>_lord_of_<owned>_in_<occupied>`. |
| **Strength** | STRONG if any hit, WEAK otherwise. Ungated. |
| **Cancellation** | — |
| **Source** | Harsha, Sarala and Vimala of the vipareetha raja yoga chapter, Phaladeepika. |
| **Activation grahas** | Saturn, Mars, Jupiter |
| **Note** | **Three named sub-forms share this one ID**, separable from `conditions_met`: **Harsha** = 6th lord in a dusthana, **Sarala** = 8th lord, **Vimala** = 12th lord. Vinaadi follows the **inclusive** school (audit M-4): the lord in its *own* dusthana counts, which is exactly the canonical Harsha/Sarala/Vimala placement. The stricter school requires a *cross* placement — 6th lord in the 8th, and so on — and would report far fewer. Two calls for the reviewer: the inclusive-vs-cross choice, and whether the three sub-forms should be shown as three cards instead of one. `key_planets` is fixed here and so is a `[PRODUCT]` approximation; the real lords are lagna-dependent. |

#### `YOG-PV-01` Parivartana Yoga (Maha / Dainya / Kahala) (பரிவர்தன யோகம்)

|  |  |
|---|---|
| **Emitted as** | `PARIVARTANA_YOGA` |
| **Detector** | `_yoga_detect.detect_parivartana` |
| **Markers** | `[TRADITION]` `[PRODUCT]` |
| **Present when** | Two of the seven grahas each occupy the sign the other rules. One card per exchanging pair. |
| **Strength** | MAHA → STRONG when **both** grahas stand in {1,2,4,5,7,9,10,11}; DAINYA → PARTIAL when either stands in a dusthana 6/8/12; KAHALA → WEAK otherwise. |
| **Cancellation** | — |
| **Source** | The three-fold Maha / Dainya / Kahala classification of the exchange yogas, Phaladeepika. |
| **Activation grahas** | Per chart: Both exchanging lords (DD-15). |
| **Note** | The Maha house set is kendra ∪ trikona **plus the 2nd and 11th** (audit L-2): a 2↔11 dhana exchange has to grade MAHA, not KAHALA. The classical taxonomy names the three grades by the houses involved; this particular house partition is Vinaadi's reading of it and is the `[PRODUCT]` half of the marker. The nodes never form a parivartana, ruling no sign. Activation (DD-15): the two exchanging lords, carried per chart in `YogaResult.key_grahas`. |

#### `YOG-CM-01` Chandra Mangala Yoga (சந்திர மங்கள யோகம்)

|  |  |
|---|---|
| **Emitted as** | `CHANDRA_MANGALA_YOGA` |
| **Detector** | `_yoga_detect.detect_chandra_mangala` |
| **Markers** | `[TRADITION]` `[VARIANT]` |
| **Present when** | Chandran and Chevvai share a rasi, **or** Chevvai is the 7th rasi from Chandran. |
| **Strength** | STRONG for the conjunction, PARTIAL for the mutual 7th, then gated over Chandran and Chevvai. |
| **Cancellation** | — |
| **Source** | BPHS and Phaladeepika treat this as a conjunction yoga. |
| **Activation grahas** | Moon, Mars |
| **Note** | **Classical Chandra-Mangala is the conjunction.** Admitting the mutual 7th at reduced strength is a declared widening, not the source rule. Strength is then lowered one rung per condition by `_yoga_helpers.gate_yoga_strength` — a key graha's composite natal score below 45, or a key graha combust — and floored at PARTIAL, so a gate never hides a formed yoga. |

#### `YOG-SK-01` Sakata Yoga (சகட யோகம்)

|  |  |
|---|---|
| **Emitted as** | `SAKATA_YOGA` |
| **Detector** | `_yoga_detect.detect_sakata_yoga` |
| **Markers** | `[TRADITION]` `[PRODUCT]` |
| **Present when** | Chandran stands in the 6th, 8th or 12th rasi from Guru. |
| **Strength** | STRONG; PARTIAL when Chandran is also in a kendra from Lagna. |
| **Cancellation** | Chandran in a kendra from Lagna is the classical bhanga. Here it **softens** the yoga to PARTIAL rather than removing it. |
| **Source** | Sakata yoga, Phaladeepika (Mantreswara) — Chandran in the 6th, 8th or 12th from Guru. **A lineage choice, not the only reading**: a competing classical stream, followed by several Tamil texts, gives Sakata as 6/8 only, with the kendra-from-Lagna bhanga. We follow the 6/8/12 form as the dominant one (astrologer ruling, 2026-09-11). Any surface that says '6th or 8th' is following the other lineage, not making an error — but the product speaks with one voice, and that voice is 6/8/12. |
| **Activation grahas** | Moon, Jupiter |
| **Note** | An adverse yoga. Softening rather than cancelling means the finding stays on the card with its mitigation shown, instead of vanishing — the same posture as the Nadi parihara rule. **The bhanga stays graded by astrologer ruling, 2026-09-11**: unlike Kemadruma's, the Chandran-in-kendra bhanga for Sakata is genuinely contested in the texts — some treat it as full cancellation, others as mitigation — so promoting it to a cancel would assert a settlement the sources do not have. The asymmetry with `YOG-KD-01` is deliberate and tracks how firm each bhanga's classical ground is, not a consistency defect. Key grahas are Chandran and Guru, the two grahas the yoga is defined on (same ruling). |

#### `YOG-KD-01` Kemadruma Yoga (கேமத்ரும யோகம்)

|  |  |
|---|---|
| **Emitted as** | `KEMADRUMA_YOGA` |
| **Detector** | `_yoga_detect.detect_kemadruma_yoga` |
| **Markers** | `[TRADITION]` `[PRODUCT]` |
| **Present when** | No graha other than Suriyan, Rahu, Kethu and Chandran itself occupies the 2nd or the 12th rasi from Chandran. |
| **Strength** | Four bhanga are tested. `planet_kendra_from_moon` is a **full** bhanga on its own → the card no longer shows as present at all (WEAK, `is_present=False`). Of the other three — Chandran in a kendra from Lagna, Guru's drishti on Chandran, full moon opposite Suriyan — one → PARTIAL, two or more → WEAK (still present, softened). None → STRONG. |
| **Cancellation** | The four bhanga above; all four are recorded in `cancellation_factors`. |
| **Source** | Kemadruma and its bhanga, BPHS and Phaladeepika. |
| **Activation grahas** | Moon |
| **Note** | **Bhanga is now mandatory before display (2026-08-28 ruling).** Before this, the full bhanga only lowered the reported strength to WEAK while `is_present` stayed True, so a cancelled Kemadruma could still surface as present to a reader. The full-bhanga carve-out itself is doctrine, not calibration: a graha in a kendra from Chandran destroys Kemadruma outright in both texts, and grading it produced a self-contradicting reading — Guru in a kendra from Chandran **is** Gaja Kesari, so one chart reported Gaja Kesari and Kemadruma as simultaneously active. The 1→PARTIAL / 2→WEAK grading of the remaining three is `[PRODUCT]`; those three still soften rather than cancel, matching Sakata's posture.

**A cancelled Kemadruma is a reading, not a non-event** (astrologer ruling, 2026-09-11). `is_present=False` with a non-empty `cancellation_factors` means the Moon *was* isolated and the bhanga then annulled it — the native carries the Kemadruma signature (self-reliance, the rise-from-nothing pattern) together with the resource to transcend it. That is a different and more valuable reading than 'the geometry never formed', and surfaces MUST distinguish the two: see `yogaReadingStatus` in `packages/shared/src/yogaDisplay.ts`, which resolves this case to `CANCELLED` rather than `ABSENT`. Key graha is Chandran, on which the whole yoga is defined (same ruling). |

#### `YOG-KT-01` Papa Kartari Yoga (பாப கர்த்தரி யோகம்)

|  |  |
|---|---|
| **Emitted as** | `PAPA_KARTARI_YOGA` |
| **Detector** | `_yoga_detect.detect_kartari_yoga` |
| **Markers** | `[TRADITION]` |
| **Present when** | The 2nd and the 12th rasis from the Lagna are **both** occupied, both contain at least one natural malefic, and **neither** contains a natural benefic. |
| **Strength** | STRONG when formed, WEAK otherwise. |
| **Cancellation** | A benefic on either side prevents the formation outright. |
| **Source** | Papa/Shubha kartari (hemming) of the Phaladeepika bhava chapters. |
| **Activation grahas** | Per chart: The hemming planets (DD-15). |
| **Note** | Called with `target_rasi = lagna_rasi` **only** — the hemming of any other bhava, or of Chandran, is not computed, though the function accepts a target and would compute it. The natural-malefic set includes Rahu, Kethu and **Mandhi**; treating the upagraha Mandhi as a hemming malefic is a declared Tamil inclusion. The natural-benefic set is Guru, Sukran, Budhan and Chandran, applied unconditionally: there is no waxing/waning test on Chandran and no association test on Budhan, both of which classical texts use to move a graha between the sets. |

#### `YOG-KT-02` Shubha Kartari Yoga (சுப கர்த்தரி யோகம்)

|  |  |
|---|---|
| **Emitted as** | `SHUBHA_KARTARI_YOGA` |
| **Detector** | `_yoga_detect.detect_kartari_yoga` |
| **Markers** | `[TRADITION]` |
| **Present when** | The 2nd and the 12th rasis from the Lagna are **both** occupied, both contain at least one natural benefic, and **neither** contains a natural malefic. |
| **Strength** | STRONG when formed, WEAK otherwise. |
| **Cancellation** | A malefic on either side prevents the formation outright. |
| **Source** | Papa/Shubha kartari (hemming) of the Phaladeepika bhava chapters. |
| **Activation grahas** | Per chart: The hemming planets (DD-15). |
| **Note** | Lagna only, as `YOG-KT-01`. The natural-benefic set is Guru, Sukran, Budhan and Chandran, applied unconditionally: there is no waxing/waning test on Chandran and no association test on Budhan, both of which classical texts use to move a graha between the sets. |

#### `YOG-KT-03` Kartari — neither formation present (கர்த்தரி அமைப்பு இல்லை)

|  |  |
|---|---|
| **Emitted as** | `KARTARI_YOGA` |
| **Detector** | `_yoga_detect.detect_kartari_yoga` |
| **Markers** | `[PRODUCT]` |
| **Present when** | Emitted with `is_present=False` when neither `YOG-KT-01` nor `YOG-KT-02` forms. |
| **Strength** | Always WEAK. |
| **Cancellation** | — |
| **Source** | Not a rule. A placeholder. |
| **Activation grahas** | **none — dormant-capped** |
| **Note** | **Not a third kartari yoga.** It is the empty-state row so the card slot always exists, and it is listed here only so a reviewer meeting `KARTARI_YOGA` in the output does not read it as a distinct formation. |

#### `YOG-CH-01` Guru Chandala Yoga (சண்டாள யோகம்)

|  |  |
|---|---|
| **Emitted as** | `CHANDALA_YOGA` |
| **Detector** | `_yoga_detect.detect_chandala_yoga` |
| **Markers** | `[TRADITION]` `[LIMIT]` |
| **Present when** | Guru and Rahu share a rasi. **Guru-Ketu does not form this yoga** — see `YOG-CH-02`. |
| **Strength** | STRONG when formed, WEAK otherwise. Ungated. |
| **Cancellation** | — |
| **Source** | Guru Chandala, standard in the Tamil dosha/yoga lists. |
| **Activation grahas** | Per chart: Guru and Rahu (DD-15). |
| **Note** | **Guru+Rahu ONLY (2026-08-28 ruling).** Whole sign, **no degree orb**: a Guru-Rahu pair 25° apart inside one rasi forms it, while a 3° pair straddling a rasi boundary does not. Name the orb your lineage uses and it can be tightened. The Guru-Ketu form some schools also use is split into its own `[VARIANT]` card (`YOG-CH-02`, `CHANDALA_KETU_YOGA`) rather than folded in here, so the Ketu form never reads as the same yoga. Activation (DD-15): Guru and Rahu primary, Rahu's dispositor secondary. |

#### `YOG-CH-02` Guru Chandala Yoga (Ketu variant) (சண்டாள யோகம் (குரு-கேது வேறுபாடு))

|  |  |
|---|---|
| **Emitted as** | `CHANDALA_KETU_YOGA` |
| **Detector** | `_yoga_detect.detect_chandala_yoga_ketu_variant` |
| **Markers** | `[VARIANT]` |
| **Present when** | Guru and Kethu share a rasi. |
| **Strength** | STRONG when formed, WEAK otherwise. Ungated. |
| **Cancellation** | — |
| **Source** | Not classical Guru Chandala (Guru+Rahu). Some schools extend the yoga to either node; no printed source claimed for the extension. |
| **Activation grahas** | Per chart: Guru and Ketu (DD-15). |
| **Note** | Split off `YOG-CH-01` by the 2026-08-28 ruling: **'Guru + Rahu ONLY. Guru + Ketu = separate [VARIANT] card.'** Same whole-sign, no-orb test as the Rahu form, applied to Kethu instead. Emitted unconditionally alongside `CHANDALA_YOGA` on its own card. Activation (DD-15): Guru and Ketu primary, Ketu's dispositor secondary. |

#### `YOG-AM-01` Amala Yoga (அமல யோகம்)

|  |  |
|---|---|
| **Emitted as** | `AMALA_YOGA` |
| **Detector** | `_yoga_detect.detect_amala_yoga` |
| **Markers** | `[TRADITION]` `[PRODUCT]` |
| **Present when** | At least one of Guru, Sukran or Budhan occupies the 10th rasi from the Lagna **or** the 10th from Chandran. Budhan counts only when no afflicting malefic (below) shares its sign — **not Suriya**, whose nearness to Budhan is constant and whose combustion is judged separately; Chandran never counts (ruling 2026-09-23, amended). |
| **Strength** | STRONG when two or more such benefics are found, PARTIAL for one; then one rung lower when an afflicting malefic casts poorna drishti on an occupied 10th (recorded as `malefic_aspect_on_10th_<graha>`). **Afflicting malefics** are one set, `AMALA_AFFLICTING_MALEFICS`, read by both this test and Budhan's: Sani, Sevvai, Rahu, Ketu and Mandhi. Nodes per `CORE-10`; Mandhi's 7th aspect per `EC-A21`. Suriya is excluded: karaka of the 10th with dig bala there. |
| **Cancellation** | None. Malefic aspect weakens, never cancels (ruling 2026-09-23). |
| **Source** | Amala yoga, Phaladeepika — a benefic in the 10th from Lagna or Chandran. |
| **Activation grahas** | Per chart: The benefics occupying the 10th — never the 10th lord. |
| **Note** | Classical Amala is satisfied by a **single** benefic in that position; the two-or-more → STRONG rung is Vinaadi's grading, not a source distinction. Activation (ruling 2026-09-23): the benefics occupying the 10th, carried per chart in `YogaResult.key_grahas` — never the 10th lord. The old functional-nature `dasha_activated` test is retired. |

#### `YOG-AD-01` Adhi pattern (base) (அதி யோக அமைப்பு)

|  |  |
|---|---|
| **Emitted as** | `ADHI_BASE` |
| **Detector** | `_yoga_detect.detect_adhi_base` |
| **Markers** | `[VARIANT]` `[PRODUCT]` |
| **Present when** | At least one chart-dynamic benefic among Budhan, Guru and Sukran occupies the 6th, 7th or 8th rasi from Chandran, and the raja-grade candidate does not form (when it does, it carries the one Adhi label). |
| **Strength** | Base rung by qualifying planets: 3 is STRONG, 2 PARTIAL and 1 WEAK; then lower for weak/combust formers, malefic contamination, weak Chandran and impure distribution. |
| **Cancellation** | No base cancellation; adverse factors lower its grade. |
| **Source** | Adhi yoga, BPHS and Phaladeepika — the three benefics in the 6th/7th/8th from Chandran. |
| **Activation grahas** | Per chart: The benefics in the 6th/7th/8th from Chandran. |
| **Note** | DD-08 separates broad geometry from any raja-grade claim. Geometry is Tier A; distribution is commentary; Raman's one-strong-planet sufficiency is recorded separately. Formers activate it; Chandran is secondary only under O-16. |

#### `YOG-AD-02` Adhi Yoga (raja-grade candidate) (அதி யோகம் (ராஜ தரம், பரிசீலனையில்))

|  |  |
|---|---|
| **Emitted as** | `ADHI_RAJA_GRADE` |
| **Detector** | `_yoga_detect.detect_adhi_raja_grade` |
| **Markers** | `[LIMIT]` `[PRODUCT]` |
| **Present when** | ADHI_BASE forms, no forming benefic is combust, and no serious malefic affliction is found. O-20 controls whether aspects count. |
| **Strength** | STRONG on clean formation, then gated over forming benefics and Chandran. |
| **Cancellation** | Combustion of a forming benefic or serious malefic affliction makes this candidate absent. |
| **Source** | Candidate synthesis pending Tier-A textual confirmation; not marked TRADITION. |
| **Activation grahas** | Per chart: The forming benefics in the 6th/7th/8th from Chandran. |
| **Note** | Candidate only; the registry deliberately withholds the TRADITION marker. |

#### `YOG-DR-01` Daridra Yoga (தரித்ர யோகம்)

|  |  |
|---|---|
| **Emitted as** | `DARIDRA_YOGA` |
| **Detector** | `_yoga_detect.detect_daridra_yoga` |
| **Markers** | `[TRADITION]` |
| **Present when** | A **parivartana** between a dusthana lord (6/8/12) and a house-of-wealth lord (2/11): the dusthana lord occupies the dhana house **and** that dhana lord occupies that same dusthana. The two must be different grahas. The weak-plus-malefic condition lives on `YOG-DR-02`. |
| **Strength** | STRONG when formed, WEAK otherwise. |
| **Cancellation** | — |
| **Source** | Daridra yogas are a family — variously on the 2nd/11th lords in dusthanas, the lagna lord in the 6/8/12, and dusthana lords linking to the dhana houses. **Astrologer ruling, 2026-09-11 chose the dusthana↔dhana link**, the stronger and rarer member, over the '11th lord in a dusthana' test this used to implement. |
| **Activation grahas** | Per chart: The 11th lord of this lagna. |
| **Note** | **Redefined by the 2026-09-11 ruling**, and the *reading* of the chosen words was settled by measurement rather than taste (`scripts/daridra_definition_sweep.py`, 200k random charts). The ruling's stated goal was far fewer false positives; every looser reading of 'connecting' turned out to fire **more** often than the rule it replaced — occupation alone 42.1%, conjunction 35.9%, either 63.2%, against the old test's 25.1%. Only the **mutual exchange** delivers the intent, at **3.9%**. Requiring two distinct grahas is load-bearing, not tidiness: for lagnas 2, 3, 8, 9 and 12 one graha owns both a dusthana and a dhana house, so counting shared lordship as a 'connection' would fire on 100% of those charts from the lagna alone. Marker moved `[VARIANT]` → `[TRADITION]` — the parivartana formulation is classical, where the old single-condition test was one narrow pick from the family. **When a lord's rasi is absent from the chart map the function silently defaults it to the Lagna rasi**, which reads as house 1 and so cannot complete an exchange; every production call site supplies all nine grahas. Adverse yoga. No *static* key grahas — the detector emits the 11th and 2nd lords per chart in `YogaResult.key_grahas`, which beats this table. |

#### `YOG-DR-02` Daridra Yoga (Vinaadi proxy) (தரித்ர யோகம் (வினாடி அளவுகோல்))

|  |  |
|---|---|
| **Emitted as** | `DARIDRA_PROXY_YOGA` |
| **Detector** | `_yoga_detect.detect_daridra_yoga_proxy` |
| **Markers** | `[PRODUCT]` |
| **Present when** | The 11th lord's composite natal score is below 40 **and** a natural malefic other than itself shares its rasi. |
| **Strength** | PARTIAL when formed, WEAK otherwise. |
| **Cancellation** | — |
| **Source** | No source claimed. A Vinaadi proxy, not a classical daridra yoga. |
| **Activation grahas** | Per chart: The 11th lord of this lagna. |
| **Note** | **Split off `YOG-DR-01` by ruling** ('the weak-and-afflicted proxy is labelled as ours'), kept rather than dropped. The `< 40` cut-off reads the composite natal graha score (§3.3.4), a `[PRODUCT]` number, not a classical strength. Shares the same silent-default behaviour on a missing 11th-lord rasi as `YOG-DR-01`. Adverse yoga; no key grahas defined, so activation is dormant-capped. |

#### `YOG-LK-01` Lakshmi Yoga (லக்ஷ்மி யோகம்)

|  |  |
|---|---|
| **Emitted as** | `LAKSHMI_YOGA` |
| **Detector** | `_yoga_detect.detect_lakshmi_yoga` |
| **Markers** | `[TRADITION]` `[PRODUCT]` |
| **Present when** | Parāśari form (DD-02, primary): the 9th lord in a **kendra** (1/4/7/10 — not a trikona) **and** in its own, moolatrikona or exaltation sign, **and** the lagna lord balāḍhya — `lagna_lord_strength` at or above the O-8 threshold (60). |
| **Strength** | STRONG when formed, then gated over the two lords (2026-08-28 ruling: 'Presence gated on strength'). WEAK when not formed. |
| **Cancellation** | — |
| **Source** | BPHS 36.27–28 (Santhanam ed.; verse number and 'kendra' wording to verify). |
| **Activation grahas** | Per chart: The 9th lord and the lagna lord (DD-15). |
| **Note** | **Rewritten by DD-02 (v1.3).** Dignity is mandatory; the old rule — 9th lord in a kendra *or trikona* with both composite scores >= 60 — was broader than every source. BPHS asks only that the lagna lord be balāḍhya; Vinaadi's translation of that word is a Tier C strength model (composite score, a 6/8/12 penalty waived in own/exaltation sign, a malefic-company penalty, and a cap for debility without bhanga), threshold O-8. The wire key `LAKSHMI_YOGA` is kept as a stable identifier for this form. A 9th lord well placed without the dignity is `YOG-LK-03`, never this name. Strength is then lowered one rung per condition by `_yoga_helpers.gate_yoga_strength` — a key graha's composite natal score below 45, or a key graha combust — and floored at PARTIAL, so a gate never hides a formed yoga. |

#### `YOG-LK-02` Lakshmi Yoga (Phaladeepika form) (லக்ஷ்மி யோகம் (பலதீபிகை வடிவம்))

|  |  |
|---|---|
| **Emitted as** | `LAKSHMI_YOGA_PHALADEEPIKA` |
| **Detector** | `_yoga_detect.detect_lakshmi_yoga_phaladeepika` |
| **Markers** | `[VARIANT]` |
| **Present when** | The 9th lord **and** Sukran both in their own or exaltation sign, both in a kendra or trikona from Lagna. |
| **Strength** | STRONG when formed, gated over the two. Strength is then lowered one rung per condition by `_yoga_helpers.gate_yoga_strength` — a key graha's composite natal score below 45, or a key graha combust — and floored at PARTIAL, so a gate never hides a formed yoga. |
| **Cancellation** | — |
| **Source** | Phaladeepika 6.21 (verse number to verify). |
| **Activation grahas** | Per chart: The 9th lord and Sukran (DD-15). |
| **Note** | A lineage variant kept beside the Parāśari form, never blended into it. **Off in the consumer UI by default** (DD-02): emitted only when `show_lakshmi_phaladeepika` is on, and only when present. |

#### `YOG-LK-03` Fortune support (பாக்கிய ஆதரவு)

|  |  |
|---|---|
| **Emitted as** | `BHAGYA_SUPPORT` |
| **Detector** | `_yoga_detect.detect_bhagya_support` |
| **Markers** | `[PRODUCT]` |
| **Present when** | The 9th lord in a kendra or trikona from Lagna **without** its own, moolatrikona or exaltation sign. |
| **Strength** | PARTIAL when formed, gated over the 9th lord. Strength is then lowered one rung per condition by `_yoga_helpers.gate_yoga_strength` — a key graha's composite natal score below 45, or a key graha combust — and floored at PARTIAL, so a gate never hides a formed yoga. |
| **Cancellation** | — |
| **Source** | No source claimed. DD-02's honest fallback label, Tier C. |
| **Activation grahas** | Per chart: The 9th lord. |
| **Note** | Principle 5 of the decision file — strict name, honest fallback: partial Lakshmi geometry gets its own label instead of the yoga's name. Emitted only when present. Two cases stay unlabelled under the literal DD-02 text — a dignified 9th lord in a trikona only, and a dignified 9th lord in a kendra with a lagna lord below threshold (open item O-17). |

#### `YOG-SAD-01` Sunapha Yoga (சுனபா யோகம்)

|  |  |
|---|---|
| **Emitted as** | `SUNAPHA_YOGA` |
| **Detector** | `_yoga_detect.detect_sunapha_anapha_durudhura` |
| **Markers** | `[TRADITION]` `[PRODUCT]` |
| **Present when** | A graha other than Suriyan, Chandran, Rahu, Kethu and Mandhi occupies the 2nd rasi from Chandran. |
| **Strength** | PARTIAL, flat. Ungated. |
| **Cancellation** | — |
| **Source** | Chandra yogas of BPHS — Sunapha, Anapha and Durudhura. |
| **Activation grahas** | Per chart: The planets in the 2nd from Chandran (DD-15). |
| **Note** | The exclusion set is classical for Suriyan and the nodes; excluding **Mandhi** is the WI-15 ruling — an upagraha is not a graha for this test — and matches Kemadruma's exclusion in the same module. **Emitted only when present**: an absent Sunapha produces no card at all, unlike most yogas here which always emit a row. The flat PARTIAL rung is Vinaadi's; the texts grade these by the graha involved. |

#### `YOG-SAD-02` Anapha Yoga (அநபா யோகம்)

|  |  |
|---|---|
| **Emitted as** | `ANAPHA_YOGA` |
| **Detector** | `_yoga_detect.detect_sunapha_anapha_durudhura` |
| **Markers** | `[TRADITION]` `[PRODUCT]` |
| **Present when** | A graha other than Suriyan, Chandran, Rahu, Kethu and Mandhi occupies the 12th rasi from Chandran. |
| **Strength** | PARTIAL, flat. Ungated. |
| **Cancellation** | — |
| **Source** | Chandra yogas of BPHS — Sunapha, Anapha and Durudhura. |
| **Activation grahas** | Per chart: The planets in the 12th from Chandran (DD-15). |
| **Note** | Same exclusion set, same emit-only-when-present behaviour and same flat rung as `YOG-SAD-01`. |

#### `YOG-SAD-03` Durudhura Yoga (துருதுரா யோகம்)

|  |  |
|---|---|
| **Emitted as** | `DURUDHURA_YOGA` |
| **Detector** | `_yoga_detect.detect_sunapha_anapha_durudhura` |
| **Markers** | `[TRADITION]` `[PRODUCT]` |
| **Present when** | Both `YOG-SAD-01` and `YOG-SAD-02` are satisfied. |
| **Strength** | STRONG, flat. Ungated. |
| **Cancellation** | — |
| **Source** | Chandra yogas of BPHS — Sunapha, Anapha and Durudhura. |
| **Activation grahas** | Per chart: The planets on both sides of Chandran (DD-15). |
| **Note** | Emitted **in addition to** Sunapha and Anapha, not instead of them, so a chart with both sides occupied shows three cards for one configuration. Whether Durudhura should absorb the other two is a presentation call for the reviewer. |

#### `YOG-VS-01` Vasumati Yoga (வசுமதி யோகம்)

|  |  |
|---|---|
| **Emitted as** | `VASUMATI_YOGA` |
| **Detector** | `_yoga_detect.detect_vasumati_yoga` |
| **Markers** | `[VARIANT]` `[PRODUCT]` |
| **Present when** | Two or more of Guru, Sukran, Budhan and Chandran occupy an upachaya rasi (3/6/10/11) counted from **either the Lagna or Chandran** (2026-08-28 ruling: 'Lagna-or-Moon'). |
| **Strength** | STRONG at three or more, PARTIAL at two. |
| **Cancellation** | — |
| **Source** | Vasumati yoga — benefics in the upachayas. |
| **Activation grahas** | Per chart: Each qualifying benefic in the upachayas (DD-15). |
| **Note** | **Widened by ruling from Chandran-only.** Each graha counts once if *either* reference places it in an upachaya — the union, not the intersection. Chandran was previously inert in the candidate set (it is always the 1st from itself, so it could never satisfy a Chandran-only test); it is no longer inert now that the Lagna reference is live, since Chandran can stand in an upachaya from the Lagna. The 2-and-3 rungs are Vinaadi's. |

#### `YOG-NKC-01` Ayilyam (Ashlesha) caution (ஆயில்ய தோஷம்)

|  |  |
|---|---|
| **Emitted as** | `AYILYAM_CAUTION` |
| **Detector** | `_yoga_detect.detect_nakshatra_cautions` |
| **Markers** | `[TAMIL_LINEAGE]` `[LIMIT]` |
| **Present when** | The janma nakshatra is Ayilyam (9). |
| **Strength** | None — `NakshatraCautionResult` carries no strength and no activation. |
| **Cancellation** | — |
| **Source** | Tamil household practice, widely printed in almanacs. No derivable rule; no page claimed. |
| **Activation grahas** | n/a — not scored |
| **Note** | **Not a yoga, and scoring reach: none.** A caution string keyed on the birth star alone, surfaced with remedy-oriented wording, feeding no score, no ranking and no recommendation. Carried in this registry because it is the twentieth detector and the reviewer asked for all twenty. The in-law framing is the traditional one and is a lineage statement, not a claim. |

#### `YOG-NKC-02` Kettai (Jyeshtha) caution (கேட்டை தோஷம்)

|  |  |
|---|---|
| **Emitted as** | `KETTAI_CAUTION` |
| **Detector** | `_yoga_detect.detect_nakshatra_cautions` |
| **Markers** | `[TAMIL_LINEAGE]` `[LIMIT]` |
| **Present when** | The janma nakshatra is Kettai (18). |
| **Strength** | None — no strength, no activation. |
| **Cancellation** | — |
| **Source** | Tamil household practice. No derivable rule; no page claimed. |
| **Activation grahas** | n/a — not scored |
| **Note** | As `YOG-NKC-01`: display-only, no scoring reach. |

#### `YOG-NKC-03` Moolam (Moola) caution (மூல தோஷம்)

|  |  |
|---|---|
| **Emitted as** | `MOOLAM_CAUTION` |
| **Detector** | `_yoga_detect.detect_nakshatra_cautions` |
| **Markers** | `[TAMIL_LINEAGE]` `[LIMIT]` |
| **Present when** | The janma nakshatra is Moolam (19). |
| **Strength** | None — no strength, no activation. |
| **Cancellation** | — |
| **Source** | Tamil household practice. No derivable rule; no page claimed. |
| **Activation grahas** | n/a — not scored |
| **Note** | As `YOG-NKC-01`: display-only, no scoring reach. The 'especially for a first child' clause is the traditional wording and is presented with remedies rather than as a finding. |

---

## `DOS-01` Sevvai (Chevvai / Kuja / Manglik) dosha — the full specification

The rulebook previously said "from the relevant reference", which is not a
specification. What the engine does:

**References checked — all three, independently:** Lagna, Moon, and Venus.
Mars's whole-sign house is counted from each; a hit from any one of the three
raises the condition, and each hit is recorded by name (`from_lagna`,
`from_moon`, `from_venus`) so the read-out can say which reference fired.

**House set (identical for all three references):**
{1, 2, 4, 7, 8, 12} — including the
1st, per the standard Tamil set (`docs/SEVVAIRAGU.MD` section 4.1).

**Gender-weighted houses — astrologer / porutham view only** (DD-05, v1.3). They
are recorded in `DoshamResult.astrologer_markers` and never reach a consumer
surface, which uses one sentence for every chart:

- female: {4, 8, 12}
- male: {2, 7, 8}

**Cancellation / mitigation factors, each worth one point:** Mars in own sign;
Mars exalted; Kadagam or Simmam Lagna — the traditional Tamil exception, applied
as a strong mitigation (one grade off and one point, never a cancellation on its
own; DD-06, open item O-6); Mars as Lagna lord in the 1st or 2nd for
Mesham/Viruchigam Lagna (major; open item O-18); benefic
association from {JUPITER, MERCURY, MOON, VENUS}; and the
house-sign nivarthi table below. Two uncancelled charts cancel each other
(`_apply_mutual_sevvai_cancellation`).

**Nivarthi (house-specific sign exemption):**

| Mars house | Exempt if Mars in rasi |
|---|---|
| 2 | 3. Mithunam, 6. Kanni |
| 4 | 1. Mesham, 8. Viruchigam |
| 7 | 4. Kadagam, 10. Magaram |
| 8 | 9. Dhanusu, 12. Meenam |
| 12 | 2. Rishabam, 7. Thulam |

**`DOS-02` Rahu/Ketu marriage axis (DD-03, v1.3):** a node in house
{1, 2, 7, 8} from Lagna,
reported as one axis finding (1/7 or 2/8). Houses 5 and 9 are no longer read
here (DD-04). Severity starts at Moderate; each aggravation (a node with the 7th
lord, with Venus, with the Moon; malefic influence on the 7th; the axis also
from the Moon or Venus, O-1) adds a grade, each mitigation (Guru joining or
aspecting a node; Guru aspecting the 7th or its lord; a strong 7th lord on 1/7;
a strong 8th lord or benefic on the 8th on 2/8) removes one. Net 2+ Strong, 1
Moderate, 0 Mild, below 0 mitigated. Nothing locks the grade.

---

## `DAS-02` Vimshottari period lengths

| Lord | Years |
|---|---|
| Ketu | 7 |
| Venus | 20 |
| Sun | 6 |
| Moon | 10 |
| Mars | 7 |
| Rahu | 18 |
| Jupiter | 16 |
| Saturn | 19 |
| Mercury | 17 |

Total: **120 years**, asserted by `test_rulebook_invariants.py`.

---

## `GO-05` Transit Vedha table

For a graha transiting the house on the left of each pair, the benefit is
cancelled when another graha simultaneously occupies the blocking house.
Houses are whole-sign counts from Janma Rasi.

| Graha | good house -> blocking house |
|---|---|
| Sun | 3 blocked by 9, 6 blocked by 12, 10 blocked by 4, 11 blocked by 5 |
| Moon | 1 blocked by 5, 3 blocked by 9, 6 blocked by 12, 7 blocked by 2, 10 blocked by 4, 11 blocked by 8 |
| Mars | 3 blocked by 12, 6 blocked by 9, 11 blocked by 5 |
| Mercury | 2 blocked by 5, 4 blocked by 3, 6 blocked by 9, 8 blocked by 1, 10 blocked by 8, 11 blocked by 12 |
| Jupiter | 2 blocked by 12, 5 blocked by 4, 7 blocked by 3, 9 blocked by 10, 11 blocked by 8 |
| Venus | 1 blocked by 8, 2 blocked by 7, 3 blocked by 1, 4 blocked by 10, 5 blocked by 9, 8 blocked by 5, 9 blocked by 11, 11 blocked by 3, 12 blocked by 6 |
| Saturn | 3 blocked by 12, 6 blocked by 9, 11 blocked by 5 |

**Classical exemptions — these pairs never block each other:** MERCURY / MOON, SATURN / SUN.

---

## `GO-06` / `GO-09` / `GO-10` / `GO-11` Sani cycles

| Cycle | Reference | Saturn positions |
|---|---|---|
| Ezharai Sani / Sade Sati | Janma Rasi (natal Moon) | 12, 1, 2 |
| Ardha Ashtama Sani | Janma Rasi | 4 |
| Ashtama Sani | Janma Rasi | 8 |
| Janma Sani | Janma Rasi | 1 |
| Kandaka Sani | Janma Rasi | 4, 7, 10 |

**`GO-10` is a declared lineage choice, not a locked foundation.** Kantaka /
Kandaka Sani is variously reckoned from Lagna, from Janma Rasi, or from Arudha
Lagna depending on lineage, and the house set is variously 1/4/7/10 or 1/4/8/10
or 4/7/10. **Ruled 2026-08-19 (doctrine A-1):** Vinaadi reckons it from the
Janma Rasi over 4/7/10 — the 1st is excluded because that position is Janma
Sani's — and every surface labels it "Kandaka Sani (from Janma Rasi)" /
"கண்டக சனி (ஜென்ம ராசி)" so the reference is never implied to be universal.

Note that Kandaka therefore **overlaps by design** with the Moon-reference
cycles above: Saturn in the 4th from the Janma Rasi is Ardha Ashtama Sani *and*
Kandaka Sani, and a reader in that position is told both names. Vinaadi
previously counted Kandaka from the Lagna specifically so that no such overlap
could occur; that tidiness was an engineering preference, not a source. The
score, however, is still applied once — one placement, one penalty.

**`GO-11` Murthi at Saturn's rasi ingress**, by the transiting Moon counted from
Janma Rasi:

| Grade | Counts | Tamil | English |
|---|---|---|---|
| Gold | 1, 6, 11 | பொன் சனி | Gold (Ponnu) Murthi — mildest |
| Silver | 2, 5, 9 | வெள்ளி சனி | Silver (Velli) Murthi — moderate |
| Copper | 3, 7, 10 | செம்பு சனி | Copper (Semmbu) Murthi — strong |
| Iron | 4, 8, 12 | இரும்பு சனி | Iron (Irumbu) Murthi — most severe |

---

## `GO-03` Combustion, sandhi and gandanta thresholds

The rulebook lists these as available flags without stating the numbers. They are:

**Combustion orbs (degrees of separation from the Sun):**

| Graha | Direct | Retrograde |
|---|---|---|
| Mercury | 14 | 12 |
| Venus | 10 | 8 |
| Mars | 17 | 17 |
| Jupiter | 11 | 11 |
| Saturn | 15 | 15 |

Cazimi orb: **0.283333 deg**. The Moon is deliberately absent from this
table — `GO-04` treats Moon-near-Sun as Amavasai rather than as combustion.

**Gandanta ranges (sidereal longitude), the water-fire junctions:**

- 356.6667 deg to 360.0000 deg
- 0.0000 deg to 3.3333 deg
- 116.6667 deg to 120.0000 deg
- 120.0000 deg to 123.3333 deg
- 236.6667 deg to 240.0000 deg
- 240.0000 deg to 243.3333 deg

---

## `MUH-06` Kuligai polarity by activity

Kuligai **repeats** what is begun in it. The discriminator is not "is the act
auspicious" but "does repeating it add to a stock, or does it mean the first one
came undone". Source: Jothidam p.152 (the multiplying mechanism, and the
cremation case); owner ruling 2026-08-17 for the extension to every activity.
`KULIGAI_ACTIVITY_TABLE_UNVERIFIED = False`.

**Favourable — repetition adds:**

- AGRICULTURE_START
- CATTLE_PURCHASE
- GEMS
- GOLD
- GRAIN
- HARVEST
- HARVEST_INGATHERING
- INVESTMENT
- LAND_POSSESSION
- LAND_PURCHASE
- NEW_CLOTHES
- NEW_GRAIN_MEAL
- NEW_ORNAMENT
- PURCHASE
- SOWING
- SPIRITUAL
- TILLAGE
- TREASURE_STORE

**Adverse — repetition means the first came undone:**

- ANNAPRASANA
- EAR_BORING
- EDUCATION_START
- EXAM
- GRAIN_EXPENDITURE
- JOB_START
- LYING_IN_CHAMBER
- MANTRA_INITIATION
- MARRIAGE
- MEDICAL
- MILK_FEEDING
- NAMING_CEREMONY
- SEEMANTHAM
- SNAANA
- TONSURE
- TRAVEL
- UPANAYANAM
- VEDA_STUDY
- VIDYARAMBHAM

**Neutralised:**

- (none)

An unclassified activity returns `UNSPECIFIED`, which must never be read as
rejection — blanket exclusion is the defect EC-RULING-07 corrected.

**Two deliberate divergences, recorded rather than hidden.** Kalaprakasika lists
medical treatment among Gulika's favoured acts; under the Tamil repetition rule
it cannot be, since treatment recurring means illness recurring, so MEDICAL is
adverse here. SPIRITUAL is favourable by reasoning rather than a quoted line —
worship repeated is the point of worship, and the same source has devotees
performing abhisheka during Rahu Kalam (p.81) and recommends Rahu Kalam for
Amman worship (p.257).

---

## `PAN-17` Festival coverage boundary

Two engines produce festival rows, and they have different reach:

1. **Algorithmic** — tithi/nakshatra/solar-month rules evaluated from the
   ephemeris (Ekadashi with dashami-viddha handling, Pradosham, Sankatahara
   Chaturthi, Amavasai/Pournami, Karthigai, Sashti, and the solar-day yearly
   festivals). These work for **any** year, past or future.
2. **Gazetted / administrative rows** — government holiday dates and a small set
   of hardcoded Hindu dates that are administrative records rather than
   calculations. These exist for **2025, 2026 only**.

`GAZETTED_FESTIVAL_YEARS` names that boundary in code, and
`test_rulebook_invariants.py` asserts the doc and the constant agree, so the
limit cannot drift silently. For a year outside the covered range the calendar
shows the algorithmic set and no gazetted rows — thinner, never wrong.

**Release position.** Government-holiday coverage must be extended before the
product presents a year beyond the boundary as complete. This is tracked as the
2027 almanac item.
