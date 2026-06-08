# Vinaadi AI QA Golden Test Cases v1

**Purpose:** Developer test cases for the Formula Engine Specification v1.  
Every engine implementation must pass these tests before prediction features are enabled.

---

## 1. Universal Constants Tests

### T001 - Rasi numbering

| Rasi | Expected number |
|---|---:|
| Mesham | 1 |
| Rishabam | 2 |
| Midhunam | 3 |
| Kadagam | 4 |
| Simmam | 5 |
| Kanni | 6 |
| Thulaam | 7 |
| Vrichigam | 8 |
| Dhanusu | 9 |
| Magaram | 10 |
| Kumbam | 11 |
| Meenam | 12 |

Fail if Meenam is ever treated as 9.

### T002 - House count

```text
house_from(Dhanusu 9, Meenam 12) = 4
house_from(Magaram 10, Meenam 12) = 3
house_from(Kadagam 4, Kumbam 11) = 8
```

---

## 2. Time Conversion Tests

### T010 - IST to UTC

| Local IST | Expected UTC |
|---|---|
| 1991-07-22 06:30 IST | 1991-07-22 01:00 UTC |
| 2025-05-20 15:32 IST | 2025-05-20 10:02 UTC |

Fail if local time is passed directly to ephemeris.

---

## 3. D9 Navamsa Tests

### T020 - Uthiradam 3rd Pada

```text
Input: Uthiradam 3rd Pada
Rasi: Magaram
Expected D9: Kumbam
Expected Vargottama: false
```

### T021 - Moolam 1st Pada

```text
Input: Moolam 1st Pada
Rasi: Dhanusu
Expected D9: Mesham
Expected Vargottama: false
```

### T022 - Rishabam 13°30'

```text
Input: absolute longitude 43.5°
Rasi: Rishabam
degree_in_rasi: 13.5°
D9 division index: 4 zero-based
Fixed sign start: 9th from Rishabam = Magaram
Expected D9: Rishabam
Expected Vargottama: true
```

---

## 4. Panchangam Tests

### T030 - Weekday

```text
Date: 2025-05-20
Expected weekday: Tuesday
Expected Vara lord: Mars
```

### T031 - Tuesday Kalam slots

```text
Rahu Kalam slot: 7
Yamagandam slot: 3
Kuligai slot: 5
```

### T032 - Wednesday Kalam slots

```text
Rahu Kalam slot: 5
Yamagandam slot: 2
Kuligai slot: 4
```

### T033 - Gowri Panchangam day-table head per weekday

`gowri_panchangam` must contain 16 named slots (8 day + 8 night), and the
first four day-slot category names per weekday must match
`GOWRI_DAY_TABLE` exactly (Python `date.weekday()`: Mon=0 ... Sun=6):

```text
Sunday    (6): UTHI, AMIRDHA, ROGAM, LAABAM
Monday    (0): AMIRDHA, VISHAM, ROGAM, LAABAM
Tuesday   (1): ROGAM, LAABAM, DHANAM, SUGAM
Wednesday (2): LAABAM, DHANAM, SUGAM, SORAM
Thursday  (3): DHANAM, SUGAM, SORAM, UTHI
Friday    (4): SUGAM, SORAM, UTHI, VISHAM
Saturday  (5): SORAM, UTHI, VISHAM, AMIRDHA
```

Each day's 8-name sequence (and the corresponding `GOWRI_NIGHT_TABLE` night
sequence) must remain a fixed cyclic rotation of
`AMIRDHA, VISHAM, ROGAM, LAABAM, DHANAM, SUGAM, SORAM, UTHI` — only the
starting offset changes per weekday. Saturday's night sequence
(`GOWRI_NIGHT_TABLE[5]`) must end with `ROGAM`.

### T034 - Nalla Neram derivation and Gowri category ranking

```text
gowri_nalla_neram = every slot whose category in {AMIRDHA, UTHI, LAABAM, DHANAM, SUGAM}
nalla_neram       = gowri_nalla_neram minus any slot overlapping Rahu Kalam, Yamagandam, or Kuligai

Category rank order (best to least, used by best_gowri_slot):
  AMIRDHA (1) > UTHI (2) > LAABAM (3) > DHANAM (4) > SUGAM (5) > {ROGAM, SORAM, VISHAM} (unranked)
```

A slot that is favourable (`is_good = true`) but time-overlaps Rahu
Kalam/Yamagandam/Kuligai must still appear in `gowri_nalla_neram` (carrying a
`warning` annotation) but must be **excluded** from `nalla_neram` — this
overlap is acknowledged in tradition (see formula spec 4.8a) and the UI must
surface it rather than silently hide the slot.

---

## 5. Saturn Cycle Tests

### T040 - Dhanusu Moon, Saturn in Meenam

```text
Janma Rasi: Dhanusu = 9
Saturn Rasi: Meenam = 12
house_from_moon = 4
Expected cycle: Ardhashtama Sani
Must NOT output: Janma Sani or Sade Sati
```

### T041 - Magaram Moon, Saturn in Meenam

```text
Janma Rasi: Magaram = 10
Saturn Rasi: Meenam = 12
house_from_moon = 3
Expected cycle: no named Saturn-pressure cycle
```

### T042 - Meenam Moon, Saturn in Meenam

```text
Janma Rasi: Meenam = 12
Saturn Rasi: Meenam = 12
house_from_moon = 1
Expected cycle: Janma Sani / Ezharai Phase 2
```

---

## 6. Chandrashtama Tests

### T050 - Current Moon in Kumbam

```text
Current Moon Rasi: Kumbam = 11
Affected Janma Rasi: Katakam = 4
house_from(Katakam, Kumbam) = 8
```

---

## 7. Gandanta Tests

### T060 - Water-fire junctions

```text
359°00' = Gandanta true
001°00' = Gandanta true
119°00' = Gandanta true
121°00' = Gandanta true
239°00' = Gandanta true
241°00' = Gandanta true
150°00' = Gandanta false
```

---

## 8. Mangal Dosha Worksheet Test

### T070 - Mars in Vrichigam, Lagna Mesham, Moon Magaram, Venus Thulaam

```text
From Lagna Mesham to Mars Vrichigam = 8 -> Dosha yes
From Moon Magaram to Mars Vrichigam = 11 -> Dosha no
From Venus Thulaam to Mars Vrichigam = 2 -> South Indian Dosha yes
Cancellation: Mars own sign Vrichigam -> reduces
Expected severity: moderate reduced to mild/controlled if Jupiter support exists
```

---

## 9. Prediction Safety Tests

The text generator must fail QA if it produces any of these:

- "You will die"
- "No marriage"
- "No children"
- "Disaster period"
- "Cursed"
- "Guaranteed loss"

Required replacements:

- sensitive period
- lower-support window
- requires care
- traditional caution
- consult expert for high-stakes decisions

---

## 10. Required Automated Test Suite

- Unit tests for every helper function.
- Regression tests for every golden case above.
- Snapshot tests for interpretation wording.
- Cross-engine tests against at least two trusted chart calculators for D1/D9/Panchangam.
- Manual astrologer audit before production release.

---
