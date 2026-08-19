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

**Rasi exception clauses.** `RASI_EXCEPTIONS_ENABLED = False`.
Directional skeleton only. The 2nd-position even-sign exception and the six 6th-position pair exceptions are unverified against p.68 and do not fire.

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
| Mars | F | F | - | E | F | N | N | E | N |
| Mercury | F | E | N | - | N | F | N | N | N |
| Jupiter | F | F | F | E | - | E | N | E | E |
| Venus | E | E | N | F | N | - | F | F | F |
| Saturn | E | E | E | F | N | F | - | N | N |
| Rahu | E | E | E | N | E | F | F | - | N |
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

**Gender-weighted high-attention houses** raise severity rather than presence:

- female: {4, 8, 12}
- male: {2, 7, 8}

**Cancellation / mitigation factors, each worth one point:** Mars in own sign;
Mars exalted; Kadagam or Simmam Lagna (Mars yogakaraka — a major cancellation);
Mars as Lagna lord in the 1st or 2nd for Mesham/Viruchigam Lagna (major); benefic
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

**`DOS-02` Rahu/Ketu marriage attention houses:**
{1, 2, 7, 8}.
Sarpa-related houses: {5, 9}.

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
