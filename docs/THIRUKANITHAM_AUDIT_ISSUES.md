# Thirukanitham Calculation Audit — Issue Tracker

**Audited:** 2026-06-01  
**Scope:** All `app/calculations/` modules cross-checked against Tamil Thirukanitham / Pambu Panchangam / Brihat Parashara Hora Shastra standards.  
**How to use this file:** Work through issues in priority order (CRITICAL → MEDIUM → LOW). Each issue contains the exact file, line number, current code, what it should be, and the fix to apply.

---

## HOW TO USE THIS DOCUMENT

Work through findings top-to-bottom by severity tier.  
Each finding block is self-contained — an agent can action it without reading any other block.  
Mark each block `[DONE]` when the fix is applied and tested.


**Repo root:** `C:\Users\senth\OneDrive\문서\GitHub\sanstro`  
**Shell:** PowerShell 5.1 — use `;` not `&&`, no `head`, no `2>&1` on native exes


## Issue Index

| # | Severity | Module | File | Short Description |
|---|---|---|---|---|
| P1 | 🔴 CRITICAL | Panchangam | `panchangam.py:151` | `SUBHA_NAKSHATRAS` uses Sanskrit names — never matches runtime Tamil names → muhurta nakshatra check always fails |
| PO2 | 🟠 MEDIUM | Porutham | `porutham.py:159` | Dinam: remainder=0 (same nakshatra group) scores 3 instead of 0 |
| PO4 | 🟠 MEDIUM | Porutham | `porutham.py:44` | Yoni hostile pair `{9,13}` (Buffalo vs Lion) should be `{9,10}` (Buffalo vs Tiger) |
| PO5 | 🔴 CRITICAL `[DONE 2026-06-04]` | Porutham + Chart | `porutham.py` / `chart_service.py` | `_GANA`, `_YONI` (animal), `_YONI_HOSTILE`, `_VEDHA_PAIRS`, `_rajju_cycle` all deviated from the classical standard; `chart_service._NAKSHATRA_GANA` was a *second*, separately-wrong gana table. Unit tests encoded the wrong values (circular validation). All corrected to classical tables; tests updated. **Supersedes PO4** (the whole `_YONI` table was scrambled, not just one hostile pair). NOTE: the earlier PO4 analysis incorrectly validated the scrambled `_YONI` table — do not trust the PO4 "yoni number → animal" reference. |
| C1 | 🟠 MEDIUM | Functional Nature | `functional_nature.py:173` | Mercury for Magaram lagna marked `TRIKONA` — should be `NEUTRAL` (owns 6th+9th; same rule as Kadagam Jupiter) |
| T2 | 🟠 MEDIUM | Transits | `transits.py:140` | Vedha table missing Mercury, Mars, Venus entries — their transit vedha check always returns False |
| P3 | 🟡 MEDIUM | Panchangam | `panchangam.py:314` | Nalla Neram is set to Abhijit window only; weekday-slot-based Nalla Neram not implemented |
| PO1 | 🟡 MEDIUM | Porutham | `porutham.py:308` | Max score sum of per-kuta maxes = 35, but `MAX_SCORE = 36` — percentage calc is off |
| E1 | 🟡 MEDIUM | Astro | `astro.py:193` | Navamsa formula uses per-sign start method; verify whether universal-anchor method is intended |
| A2 | 🟡 LOW | Ashtakavarga | `ashtakavarga.py:50` | Mercury BAV Lagna reference follows BPHS; Phala Deepika (Tamil primary source) differs |
| T3 | 🟡 LOW | Transits | `transits.py:113` | Ardhashtama Sani (4th from Moon) and Kandaka Sani (4th from Lagna) both fire for 4th house — potential UI double-count |
| Y1 | 🟡 LOW | Yogas | `yogas.py:15` | Sevvai: house 1 excluded from Tamil Standard mode; many Tamil practitioners include it |
| E2 | 🟡 LOW | Chart Strength | `chart_strength.py:124` | Avastha multiplier is a custom degree-band approximation, not classical Baladi Avastha |
| C2 | 🟡 LOW | Functional Nature | `functional_nature.py:152` | Viruchigam Jupiter (2nd+5th lord): marked `NEUTRAL`; a case for `TRIKONA` exists |
| D1 | 🟡 LOW | Dasha | `dasha.py:72` | Only 9 mahadasha periods generated; `_find_period` returns last period for dates beyond 120yr window |
| C3 | 🟡 LOW | Jaimini | `jaimini_dasha.py:78` | Chara Dasha sub-periods (Antardasha within each rasi) not implemented |
| P2 | 🟡 LOW | Panchangam | `panchangam.py:132` | Gowri Nalla Neram slot 8 on Sunday = Rahu Kalam — UI must surface the conflict |

---

## Resolution status — re-verified against current code 2026-06-05

All issues below were re-checked against the live code. **Every item is resolved except T3, which is a tradition choice (not a bug).**

| # | Status (2026-06-05) |
|---|---|
| P1 | ✅ Fixed — `SUBHA_NAKSHATRAS` uses Tamil-transliterated names matching runtime (`panchangam.py:154`) |
| PO1 | ✅ Fixed — per-kuta maxes sum to 36 (Mahendra 4, Stree Dirgha 5; Rajju/Vedha dosha-only) |
| PO2 | ✅ Fixed — Dinam remainder 0 → score 0 |
| PO4 | ✅ Superseded by **PO5** (whole `_YONI`/`_GANA`/`_VEDHA`/Rajju tables corrected 2026-06-04) |
| PO5 | ✅ Fixed 2026-06-04 (porutham + chart_service gana tables; tests corrected) |
| P3 | ✅ Fixed — `NALLA_NERAM_SLOT` weekday-slot table; Abhijit separate |
| C1 | ✅ Fixed — Mercury/Magaram lagna = `NEUTRAL` (`functional_nature.py:173`) |
| C2 | ✅ Fixed — Viruchigam Jupiter = `TRIKONA` (`functional_nature.py:152`) |
| T2 | ✅ Fixed — `VEDHA_TABLE` now includes Mars/Mercury/Venus (`transits.py:143-146`) |
| A2 | ✅ Fixed — Mercury BAV Lagna = Phala Deepika `[1,3,5,6,9,10,11]` (`ashtakavarga.py:50`) |
| E1 | ✅ OK — navamsa per-sign method preserves movable-sign vargottama (intended) |
| E2 | ✅ Fixed — real Baladi avastha with odd/even reversal (`chart_strength.py:124-133`) |
| Y1 | ✅ Fixed — Sevvai houses = `{1,2,4,7,8,12}` (includes 1st) |
| D1 | ✅ Fixed — 2 full cycles / 18 mahadashas generated (`dasha.py:78`); plus opening-MD sub-period fix 2026-06-04 |
| C3 | ✅ Fixed — `calculate_chara_antardasha` implemented (`jaimini_dasha.py:121`) |
| P2 | ✅ Known/by-design — slot conflict surfaced in UI |
| T3 | ✅ Resolved by decision 2026-06-05 — **keep** `ARDHASHTAMA_SANI` (4th-from-Moon) as an active affliction. It's a genuine Saturn caution many Tamil practitioners use, and the daily-score double-count with Kantaka Sani is already guarded (`daily_guidance_service.py`). No code change. |

---

## Detailed Issues

---

### P1 — 🔴 CRITICAL: `SUBHA_NAKSHATRAS` uses Sanskrit names, muhurta nakshatra check always fails

**File:** [app/calculations/panchangam.py](app/calculations/panchangam.py)  
**Lines:** 151–155 (constant definition) and 661 (usage)

**Root cause:**  
`SUBHA_NAKSHATRAS` is a `set` of Sanskrit-transliterated names. At line 661 it is checked against `NAKSHATRA_NAMES[nakshatra_number - 1]`, which returns Tamil-transliterated names from the runtime list at lines 41–69. The two name sets have zero overlap, so `nakshatra_name in SUBHA_NAKSHATRAS` is **always `False`**. The "auspicious nakshatra" branch of `_compute_subha_muhurtham` never fires.

**Current code (lines 151–155):**
```python
SUBHA_NAKSHATRAS = {
    "ASHWINI", "ROHINI", "MRIGASHIRA", "PUNARVASU", "PUSHYA", "HASTA",
    "CHITRA", "SWATI", "ANURADHA", "MULA", "UTTARASHADA", "UTTARABHADRA",
    "REVATI", "MAGHA", "UTTARAPHALGUNI", "SHRAVANA", "DHANISHTHA",
}
```

**Runtime nakshatra names (lines 41–69) that the check is compared against:**
```
ASWINI, BHARANI, KARTHIGAI, ROHINI, MIRUGASEERIDAM, THIRUVATHIRAI,
PUNARPOOSAM, POOSAM, AYILYAM, MAGAM, POORAM, UTHIRAM, HASTHAM,
CHITHIRAI, SWATHI, VISAKAM, ANUSHAM, KETTAI, MOOLAM, POORADAM,
UTHIRADAM, THIRUVONAM, AVITTAM, SADAYAM, POORATTATHI, UTHIRATTATHI, REVATHI
```

**Fix — replace the constant with Tamil-transliterated names that exactly match `NAKSHATRA_NAMES`:**
```python
SUBHA_NAKSHATRAS = {
    "ASWINI",        # 1  — Ashwini
    "ROHINI",        # 4  — Rohini
    "MIRUGASEERIDAM",# 5  — Mrigashira
    "PUNARPOOSAM",   # 7  — Punarvasu
    "POOSAM",        # 8  — Pushya
    "HASTHAM",       # 13 — Hasta
    "CHITHIRAI",     # 14 — Chitra
    "SWATHI",        # 15 — Swati
    "ANUSHAM",       # 17 — Anuradha
    "MOOLAM",        # 19 — Mula
    "UTHIRADAM",     # 21 — Uttarashada
    "UTHIRATTATHI",  # 26 — Uttarabhadrapada
    "REVATHI",       # 27 — Revati
    "MAGAM",         # 10 — Magha
    "UTHIRAM",       # 12 — Uttaraphalguni
    "THIRUVONAM",    # 22 — Shravana
    "AVITTAM",       # 23 — Dhanishtha
}
```

**Verify:** After the fix, run a test for a date where Moon is in Rohini or Hastham and confirm `is_subha_muhurtham` can return `True` when tithi and yoga are also auspicious.

---

### PO2 — 🟠 MEDIUM: Dinam score gives 3 for same nakshatra group (remainder=0), should give 0

**File:** [app/calculations/porutham.py](app/calculations/porutham.py)  
**Lines:** 159–163

**Root cause:**  
Classical Tamil Thirukanitham Dhinam kuta: count girl's nakshatra to boy's, take the result modulo 9. Remainder 0 means they fall in the same nakshatra group — this is **inauspicious** (score 0). Remainders 1–4 are auspicious (score 3). Remainders 5–8 are inauspicious (score 0). The current code includes 0 in the auspicious set.

**Current code:**
```python
def _dinam_score(nak_boy: int, nak_girl: int) -> int:
    diff = (nak_boy - nak_girl) % 27
    remainder = diff % 9
    return 3 if remainder in {0, 1, 2, 3, 4} else 0
```

**Fixed code:**
```python
def _dinam_score(nak_boy: int, nak_girl: int) -> int:
    diff = (nak_boy - nak_girl) % 27
    remainder = diff % 9
    return 3 if remainder in {1, 2, 3, 4} else 0
```

**Impact:** Any couple whose nakshatras are 9, 18, or 27 apart (same group) currently gets 3/3 on Dinam kuta but should get 0/3.

---

### PO4 — 🟠 MEDIUM: Yoni hostile pair `{9, 13}` (Buffalo vs Lion) is wrong — should be `{9, 10}` (Buffalo vs Tiger)

**File:** [app/calculations/porutham.py](app/calculations/porutham.py)  
**Lines:** 44–48

**Root cause:**  
Per classical Yoni Kuta tables (Muhurta Chintamani, Jataka Parijata), the hostile pairs are:

| Yoni | Animal | Hostile Yoni | Animal |
|---|---|---|---|
| 1 | Horse | 2 | Elephant |
| 3 | Sheep | 8 | Cow |
| 4 | Serpent | 5 | Dog |
| 6 | Cat | 7 | Rat |
| 9 | Buffalo | **10** | **Tiger** |
| **11** | **Hare** | **13** | **Lion** |
| 12 | Monkey | 14 | Mongoose |

The code has `{9, 13}` (Buffalo vs Lion) and `{10, 11}` (Tiger vs Hare) — the Tiger and Lion assignments are swapped.

**Current code:**
```python
_YONI_HOSTILE: frozenset[frozenset[int]] = frozenset(
    frozenset(pair) for pair in [
        {1, 2}, {3, 8}, {4, 5}, {6, 7}, {9, 13}, {10, 11}, {12, 14},
    ]
)
```

**Fixed code:**
```python
_YONI_HOSTILE: frozenset[frozenset[int]] = frozenset(
    frozenset(pair) for pair in [
        {1, 2},   # Horse vs Elephant
        {3, 8},   # Sheep vs Cow
        {4, 5},   # Serpent vs Dog
        {6, 7},   # Cat vs Rat
        {9, 10},  # Buffalo vs Tiger  ← was {9, 13}
        {11, 13}, # Hare vs Lion      ← was {10, 11}
        {12, 14}, # Monkey vs Mongoose
    ]
)
```

**Yoni number → animal reference (from `_YONI` dict):**
- 9 = Buffalo (nakshatra 11 Pooram, 24 Sadayam)
- 10 = Tiger (nakshatra 12 Uthiram, 25 Poorattathi)
- 11 = Hare (nakshatra 13 Hastham, 26 Uthirattathi)
- 13 = Lion (nakshatra 15 Swathi, 23 Avittam)

---

### C1 — 🟠 MEDIUM: Mercury for Magaram (Capricorn) lagna marked `TRIKONA` — must be `NEUTRAL`

**File:** [app/calculations/functional_nature.py](app/calculations/functional_nature.py)  
**Line:** 173

**Root cause:**  
For Magaram (10) lagna, Mercury owns the 6th house (Kanni) and the 9th house (Mithunam). The rule for Trikona+Dusthana dual ownership is: **the dusthana pollution reduces the planet to NEUTRAL** (not TRIKONA). The same rule is applied correctly for Kadagam lagna's Jupiter (also owns 6th+9th → marked NEUTRAL at line 108). The Magaram Mercury entry is inconsistent.

**Current code:**
```python
10: {  # Magaram Lagna
    ...
    "MERCURY": "TRIKONA",  # 6th+9th lord (9th=Trikona; 6th=Dusthana; Trikona wins for 9th)
    ...
},
```

**Fixed code:**
```python
10: {  # Magaram Lagna
    ...
    "MERCURY": "NEUTRAL",  # 6th+9th lord (Trikona+Dusthana = mixed → Neutral, same rule as Kadagam Jupiter)
    ...
},
```

**Impact:** Magaram lagna natives will have Mercury dasha modifier corrected from 1.20→1.00 (dasha) and 1.15→1.00 (transit). Mercury-ruled periods won't be falsely elevated.

---

### T2 — 🟠 MEDIUM: Vedha table missing Mercury, Mars, Venus entries

**File:** [app/calculations/transits.py](app/calculations/transits.py)  
**Lines:** 140–145

**Root cause:**  
The classical Vedha table from Phala Deepika covers all 7 classical planets. Only 4 are currently implemented (Sun, Moon, Jupiter, Saturn). Mercury, Mars, and Venus transits will always return `False` from `check_vedha()`, meaning their transit benefits are never blocked even when a blocking planet is simultaneously present.

**Current code:**
```python
VEDHA_TABLE: dict[str, dict[int, int]] = {
    "SUN":     {3: 9, 6: 12, 10: 4, 11: 5},
    "MOON":    {1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8},
    "JUPITER": {2: 12, 5: 4, 7: 3, 9: 10, 11: 8},
    "SATURN":  {3: 12, 6: 9, 11: 5},
}
```

**Fixed code — add Mercury, Mars, Venus rows per Phala Deepika / classical tables:**
```python
VEDHA_TABLE: dict[str, dict[int, int]] = {
    "SUN":     {3: 9, 6: 12, 10: 4, 11: 5},
    "MOON":    {1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8},
    "MARS":    {3: 12, 6: 9, 11: 5},
    "MERCURY": {2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12},
    "JUPITER": {2: 12, 5: 4, 7: 3, 9: 10, 11: 8},
    "VENUS":   {1: 8, 2: 7, 3: 10, 4: 3, 5: 11, 8: 1, 9: 5, 11: 6, 12: 6},
    "SATURN":  {3: 12, 6: 9, 11: 5},
}
```

**Note:** The exact classical Vedha values for Mercury and Venus have minor variation across sources. The values above are from Phala Deepika Chapter 28. Cross-check against your reference Thirukanitham manual and adjust if needed. The Mars Vedha is the same as Saturn per most Tamil sources.

---

### P3 — 🟡 MEDIUM: Nalla Neram implemented as Abhijit only — weekday-slot version missing

**File:** [app/calculations/panchangam.py](app/calculations/panchangam.py)  
**Lines:** 314–319 (`_compute_nalla_neram`) and 657 (call site)

**Root cause:**  
In Thirukanitham tradition, **Nalla Neram** is a specific slot on the 8-slot daylight grid determined by the weekday. **Abhijit** is a separate midday window (±24 min around solar noon). Currently both are being served from the Abhijit window — users see only one Nalla Neram, and it is the Abhijit one, not the traditional slot-based one.

**Classical Nalla Neram slots (Thirukanitham / Pambu Panchangam):**
| Weekday (Python .weekday()) | Weekday Name | Nalla Neram Slot |
|---|---|---|
| 6 | Sunday | 3 |
| 0 | Monday | 5 |
| 1 | Tuesday | 6 |
| 2 | Wednesday | 7 |
| 3 | Thursday | 1 |
| 4 | Friday | 4 |
| 5 | Saturday | 2 |

**Add this constant** near the other slot tables (around line 127):
```python
NALLA_NERAM_SLOT = {6: 3, 0: 5, 1: 6, 2: 7, 3: 1, 4: 4, 5: 2}
```

**Replace `_compute_nalla_neram` (lines 314–319):**
```python
def _compute_nalla_neram(
    sunrise: datetime,
    sunset: datetime,
    weekday_index: int,
) -> list[PanchangamSlot]:
    """Nalla Neram: one slot per day on the 8-slot daylight grid (Thirukanitham tradition)."""
    dur = (sunset - sunrise) / 8
    slot = NALLA_NERAM_SLOT[weekday_index]
    return [_slot_datetime(sunrise, dur, slot)]
```

**Update the call site at line 657:**
```python
# Before:
nalla_neram = _compute_nalla_neram(abhijit_start, abhijit_end)

# After:
nalla_neram = _compute_nalla_neram(sunrise, sunset, date_local.weekday())
```

**Note:** Abhijit should remain separately displayed in the UI as its own field (it already is). Nalla Neram and Abhijit are two distinct auspicious windows.

---

### PO1 — 🟡 MEDIUM: Porutham max score sum is 35 but `MAX_SCORE = 36`

**File:** [app/calculations/porutham.py](app/calculations/porutham.py)  
**Lines:** 308–313

**Root cause:**  
Sum of per-kuta maximums: 3+6+4+7+5+2+2+2+2+2 = **35**. `MAX_SCORE = 36` is hardcoded. This means the best achievable score (35/36 = 97.2%) can never reach 100%, and percentage thresholds for EXCELLENT/GOOD/AVERAGE/CAUTION labels are computed against the wrong base.

**Classical Tamil 10-kuta breakdown (from Muhurta Chintamani):**

| Kuta | Tamil Name | Classical Max |
|---|---|---|
| Dinam | தினம் | 3 |
| Ganam | கணம் | 6 |
| Yoni | யோனி | 4 |
| Rasi | ராசி | 7 |
| Graha Maitri | கிரக மைத்திரி | 5 |
| Rajju | ரஜ்ஜு | dosha only (0 or pass) |
| Vedha | வேதம் | dosha only (0 or pass) |
| Vasya | வாஸ்யம் | 2 |
| Mahendra | மகேந்திரம் | 4 |
| Stree Dirgha | ஸ்த்ரீ தீர்கம் | 5 |
| **Total** | | **36** |

The discrepancy is that Mahendra (2 in code, 4 classical) and Stree Dirgha (2 in code, 5 classical) are under-weighted. Rajju and Vedha are scored as points in the code (2 each) but are traditionally dosha-only checks with no positive point contribution.

**Option A — Align to classical (recommended):**
```python
maxes = {
    "Dinam":        3,
    "Ganam":        6,
    "Yoni":         4,
    "Rasi":         7,
    "Graha Maitri": 5,
    "Vasya":        2,
    "Mahendra":     4,   # was 2
    "Stree Dirgha": 5,   # was 2
    # Rajju and Vedha become dosha flags only (not scored as points)
}
MAX_SCORE = 36
```

**Option B — Keep current scoring, fix the total:**
```python
MAX_SCORE = 35  # matches actual sum of maxes
```

Option A is the correct classical approach. If Option A is chosen, also remove Rajju and Vedha from the `raw_scores` sum, retaining them only as `rajju_dosha` / `vedha_dosha` boolean flags (which they already have).

---

### E1 — 🟡 MEDIUM: Navamsa formula uses per-sign start method — verify against source

**File:** [app/calculations/astro.py](app/calculations/astro.py)  
**Lines:** 193–207

**Context:**  
There are two traditions for computing the Navamsa (D9) starting rasi:

**Method A — Per-sign (current implementation):**
- Movable signs (1,4,7,10) → start from that same sign
- Fixed signs (2,5,8,11) → start from 9th sign from that sign
- Dual signs (3,6,9,12) → start from 5th sign from that sign

**Method B — Universal anchor (classical Parashari):**
- All movable signs → start from Mesha (1)
- All fixed signs → start from Magaram (10)
- All dual signs → start from Thulam (7)

The two methods produce **different D9 rasi numbers** for most degrees. Method B is the standard per BPHS and most published Thirukanitham software (Jagannatha Hora, Astro-Vision etc.).

**Current code (Method A):**
```python
def navamsa_rasi_from_degree(degree: float) -> int:
    normalized = normalize_longitude(degree)
    natal_rasi = rasi_from_degree(normalized)
    degree_in_sign = normalized % 30.0
    index = floor(degree_in_sign / PADA_SIZE_DEGREES + EPSILON_DEGREES)

    if natal_rasi in {1, 4, 7, 10}:    # movable
        start_rasi = natal_rasi
    elif natal_rasi in {2, 5, 8, 11}:  # fixed — start from 9th
        start_rasi = ((natal_rasi + 8 - 1) % 12) + 1
    else:                               # dual — start from 5th
        start_rasi = ((natal_rasi + 4 - 1) % 12) + 1

    return ((start_rasi + index - 1) % 12) + 1
```

**Method B replacement:**
```python
def navamsa_rasi_from_degree(degree: float) -> int:
    normalized = normalize_longitude(degree)
    natal_rasi = rasi_from_degree(normalized)
    degree_in_sign = normalized % 30.0
    index = floor(degree_in_sign / PADA_SIZE_DEGREES + EPSILON_DEGREES)

    if natal_rasi in {1, 4, 7, 10}:    # movable → start from Mesha (1)
        start_rasi = 1
    elif natal_rasi in {2, 5, 8, 11}:  # fixed → start from Magaram (10)
        start_rasi = 10
    else:                               # dual → start from Thulam (7)
        start_rasi = 7

    return ((start_rasi + index - 1) % 12) + 1
```

**Action required:** Confirm which method your reference Thirukanitham manual uses, then apply the corresponding code. If switching to Method B, all existing D9 results in the database will change — a migration step to recalculate stored D9 data is needed.

---

### A2 — 🟡 LOW: Mercury BAV Lagna reference differs between BPHS and Phala Deepika

**File:** [app/calculations/ashtakavarga.py](app/calculations/ashtakavarga.py)  
**Line:** 50

**Current code:**
```python
"MERCURY": {
    ...
    "LAGNA": [1, 2, 4, 6, 8, 10, 11],
},
```

**BPHS (current implementation):** Lagna contributes bindus for Mercury in houses 1, 2, 4, 6, 8, 10, 11.  
**Phala Deepika (Tamil primary source):** Lagna contributes bindus for Mercury in houses 1, 3, 5, 6, 9, 10, 11.

**Action required:** Confirm which text your Thirukanitham tradition follows, then update the list accordingly. Both are valid from their respective sources.

```python
# If using Phala Deepika:
"MERCURY": {
    ...
    "LAGNA": [1, 3, 5, 6, 9, 10, 11],  # Phala Deepika
},
```

---

### T3 — 🟡 LOW: Ardhashtama Sani and Kandaka Sani both active for 4th house from Moon/Lagna

**File:** [app/calculations/transits.py](app/calculations/transits.py)  
**Lines:** 113–117 and 128–135

**Context:**  
When Saturn transits the 4th house from the natal Moon, both `classify_sani_cycle` (returns `ARDHASHTAMA_SANI`) and `classify_kandaka_cycle` (returns `KANDAKA_SANI`) will be active simultaneously if natal Moon and Lagna happen to be the same sign (or close). Even when they're different, both can fire independently for the same transit.

**Ardhashtama Sani** is a North Indian / some South Indian concept not prominently featured in Thirukanitham. Pambu Panchangam focuses on Ezharai Sani and Ashtama Sani. Kandaka Sani (1/4/7/10 from Lagna) is widely used in Tamil tradition.

**Option:** Remove `ARDHASHTAMA_SANI` (4th house from Moon) from `classify_sani_cycle` if the app is targeting pure Thirukanitham:
```python
def classify_sani_cycle(position_from_moon: int) -> CycleAssessment:
    mapping = {
        12: CycleAssessment(type="EZHARAI_SANI_PHASE_1", is_active=True, ...),
        1:  CycleAssessment(type="JANMA_SANI", is_active=True, ...),
        2:  CycleAssessment(type="EZHARAI_SANI_PHASE_3", is_active=True, ...),
        8:  CycleAssessment(type="ASHTAMA_SANI", is_active=True, ...),
        # Remove the 4: ARDHASHTAMA_SANI entry
    }
    return mapping.get(position_from_moon, CycleAssessment(type=None, is_active=False))
```

**Or:** Keep it but add a `tradition="thirukanitham"` guard so it only shows when explicitly enabled.

---

### Y1 — 🟡 LOW: Sevvai Dosham Tamil Standard excludes house 1 — verify against tradition

**File:** [app/calculations/yogas.py](app/calculations/yogas.py)  
**Lines:** 15–16

**Current code:**
```python
TAMIL_SEVVAI_HOUSES = {2, 4, 7, 8, 12}
EXTENDED_SEVVAI_HOUSES = {1, 2, 4, 7, 8, 12}
```

**Classical Thirukanitham sources** (Jataka Chandrika, many Tamil jyotishis) include house 1 in the Sevvai Dosham check, giving 6 houses: 1, 2, 4, 7, 8, 12. The current "Tamil Standard" uses the 5-house Parashari definition. The 6-house version is more common in Tamil Nadu practice.

**Recommended fix:**
```python
TAMIL_SEVVAI_HOUSES = {1, 2, 4, 7, 8, 12}   # include 1st house per Tamil Thirukanitham
EXTENDED_SEVVAI_HOUSES = {1, 2, 4, 7, 8, 12} # same; extended can add Moon/Venus references
```

If you want to keep the strict Parashari mode available, rename:
```python
PARASHARI_SEVVAI_HOUSES = {2, 4, 7, 8, 12}
TAMIL_SEVVAI_HOUSES = {1, 2, 4, 7, 8, 12}
```

---

### E2 — 🟡 LOW: Avastha multiplier is custom degree-band approximation, not classical Baladi

**File:** [app/calculations/chart_strength.py](app/calculations/chart_strength.py)  
**Lines:** 124–135

**Current code:**
```python
def _avastha_multiplier(natal_longitude: float) -> float:
    deg = natal_longitude % 30
    if deg < 6:   return 0.25
    if deg < 12:  return 0.50
    if deg < 18:  return 1.00
    if deg < 24:  return 0.50
    return 0.25
```

**Classical Baladi Avastha** is not based on uniform degree bands. It depends on whether the sign is odd or even, and divides each sign into 6° zones with Bala (infant), Kumara (youth), Yuva (adult), Vriddha (old), Mrita (dead) states. The current implementation is a pragmatic bell-curve approximation.

**No fix required if this is an intentional custom scoring model.** However, add a code comment making this explicit:
```python
def _avastha_multiplier(natal_longitude: float) -> float:
    # Custom bell-curve approximation; not classical Baladi Avastha.
    # Classical Baladi uses odd/even sign + 6-degree zones.
    deg = natal_longitude % 30
    if deg < 6:   return 0.25
    if deg < 12:  return 0.50
    if deg < 18:  return 1.00
    if deg < 24:  return 0.50
    return 0.25
```

---

### C2 — 🟡 LOW: Viruchigam (Scorpio) lagna Jupiter marked `NEUTRAL` — case for `TRIKONA`

**File:** [app/calculations/functional_nature.py](app/calculations/functional_nature.py)  
**Line:** 152

**Current code:**
```python
8: {  # Viruchigam Lagna
    "JUPITER": "NEUTRAL",  # 2nd+5th lord (Maraka+Trikona = mixed → Neutral-positive)
```

**Context:**  
Jupiter owns the 2nd house (Dhanusu) and 5th house (Meenam) for Viruchigam lagna. The 5th is a Trikona; the 2nd is a Maraka. Classical doctrine has two positions:

1. **Trikona dominates Maraka → TRIKONA** (Parashari mainstream)
2. **Maraka taints Trikona → NEUTRAL** (stricter Tamil view)

The current NEUTRAL is defensible. However it under-estimates Jupiter's benefic role for Viruchigam natives in dasha/transit scoring.

**Recommended:** Change to `TRIKONA` if following mainstream Parashari doctrine widely used in Thirukanitham. Keep as `NEUTRAL` if following the stricter Tamil Sarvashtakavarga-based approach.

```python
"JUPITER": "TRIKONA",  # 2nd+5th lord — 5th=Trikona dominates; Parashari doctrine
```

---

### D1 — 🟡 LOW: Vimshottari Dasha generates only 9 periods (120-year window cap)

**File:** [app/calculations/dasha.py](app/calculations/dasha.py)  
**Lines:** 72–94 (`_build_periods`) and 123–131 (`_find_period`)

**Context:**  
`_build_periods` generates exactly 9 mahadasha periods starting from birth. The total span is 120 years minus the balance years. For an `as_of_jd` beyond the 9th period's end date, `_find_period` returns `periods[-1]` (last dasha). This silently gives wrong results for:
- Very long-lived test cases
- Future projections more than ~120 years from birth

**Fix — generate 18 periods (two full cycles) to cover any practical date range:**
```python
def _build_periods(start_jd: float, sequence_start_lord: str, first_duration_years: float) -> tuple[DashaPeriod, ...]:
    periods: list[DashaPeriod] = []
    sequence = _sequence_from(sequence_start_lord)
    current_start = start_jd

    # Generate 2 full cycles (18 periods = 240 years coverage)
    for cycle in range(2):
        for index, lord in enumerate(sequence):
            duration_years = first_duration_years if (cycle == 0 and index == 0) else DASHA_YEARS[lord]
            end_jd = current_start + duration_years * JULIAN_YEAR_DAYS
            start_date, end_date = _period_dates(current_start, end_jd)
            periods.append(
                DashaPeriod(
                    level="maha",
                    lord=lord,
                    start_jd=current_start,
                    end_jd=end_jd,
                    start_date=start_date,
                    end_date=end_date,
                    sequence_index=cycle * 9 + index,
                )
            )
            current_start = end_jd

    return tuple(periods)
```

---

### C3 — 🟡 LOW: Jaimini Chara Dasha sub-periods not implemented

**File:** [app/calculations/jaimini_dasha.py](app/calculations/jaimini_dasha.py)  
**Lines:** 78–104

**Context:**  
The `calculate_chara_dasha` function computes only the 12 main-period rasi dashas. Each main period should have 12 sub-periods (Antardasha within the Mahadasha). The sub-period sequence within a main period starts from the main period's own rasi and proceeds in the same direction (odd/even rule applies recursively).

**Sub-period duration formula:**
```
Antardasha duration = (Main_period_years / 12) × sub_rasi_years
```
Wait — Jaimini sub-periods work differently from Vimshottari. Each sub-period within a Chara Mahadasha has equal duration = `main_period_years / 12`.

**Basic implementation to add after `calculate_chara_dasha`:**
```python
def calculate_chara_antardasha(
    lagna_rasi: int,
    planet_rasi_map: Mapping[str, int],
    birth_date: date,
    main_period: dict,
) -> list[dict]:
    """
    Sub-periods within a Jaimini Chara Dasha main period.
    Each sub-period runs for main_period_years / 12 years.
    Sub-period sequence starts from main_period rasi, same odd/even direction as lagna.
    """
    main_rasi = main_period["rasi"]
    main_years = main_period["years"]
    sub_duration_days = (main_years * 365.25) / 12

    # Sub-period sequence: same direction rule as main (odd lagna = forward, even = reverse)
    if lagna_rasi % 2 == 1:
        full_order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    else:
        full_order = [1, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]

    start_idx = full_order.index(main_rasi)
    rasi_order = full_order[start_idx:] + full_order[:start_idx]

    periods: list[dict] = []
    current = main_period["start_date"]
    for rasi in rasi_order:
        from datetime import timedelta
        end_dt = current + timedelta(days=sub_duration_days)
        periods.append({
            "rasi": rasi,
            "rasi_name": RASI_NAMES.get(rasi, str(rasi)),
            "start_date": current,
            "end_date": end_dt,
        })
        current = end_dt
    return periods
```

---

### P2 — 🟡 LOW: Gowri Nalla Neram slot 8 coincides with Rahu Kalam on Sunday — UI must surface conflict

**File:** [app/calculations/panchangam.py](app/calculations/panchangam.py)  
**Lines:** 132–140

**Context:**  
```python
GOWRI_NALLA_NERAM_SLOTS = {
    6: (5, 6, 8),   # Sunday — slot 8 is also RAHU_SLOT[6] = 8
    ...
}
```

This is **correct per Thirukanitham tradition** — the tradition acknowledges the overlap and considers the slot to have mixed quality. No code change is needed in the calculation layer.

**Action required in the UI/API layer:** When rendering Gowri Nalla Neram, check if any slot overlaps with Rahu Kalam or Yamagandam. If so, annotate it:

```python
# In the API response builder (app/api/ or app/services/panchangam_service.py):
for slot in gowri_nalla_neram:
    if slot.start == rahu_kalam.start:
        # Add warning annotation: "Coincides with Rahu Kalam — use with caution"
```

---

## Cross-Module Consistency Checks

These are not individual bugs but consistency items to verify across modules:

### CC1 — Nakshatra name canonical form
All modules that use nakshatra names as strings must use the same canonical form. The canonical list is defined in [app/calculations/astro.py:35-63](app/calculations/astro.py):
```
ASWINI, BHARANI, KARTHIGAI, ROHINI, MIRUGASEERIDAM, THIRUVATHIRAI,
PUNARPOOSAM, POOSAM, AYILYAM, MAGAM, POORAM, UTHIRAM, HASTHAM,
CHITHIRAI, SWATHI, VISAKAM, ANUSHAM, KETTAI, MOOLAM, POORADAM,
UTHIRADAM, THIRUVONAM, AVITTAM, SADAYAM, POORATTATHI, UTHIRATTATHI, REVATHI
```
After fixing P1, grep the entire codebase for any other set/dict that uses Sanskrit nakshatra names:
```
grep -rn "ASHWINI\|MRIGASHIRA\|PUNARVASU\|PUSHYA\|HASTA\|CHITRA\|ANURADHA\|UTTARASHADA\|REVATI\|SHRAVANA\|DHANISHTHA" app/
```

### CC2 — Weekday indexing is consistent
Python `date.weekday()`: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6.  
All slot tables (RAHU_SLOT, YAMA_SLOT, KULIGAI_SLOT, GOWRI_NALLA_NERAM_SLOTS, NALLA_NERAM_SLOT) must use this same convention. Verify after adding the new NALLA_NERAM_SLOT constant.

### CC3 — Lagna rasi numbering is 1-based
All calculation functions use 1-12 for rasi. Verify any new code added does not accidentally use 0-11 indexing.

---

## Testing Checklist After Fixes

| Fix | Test case to run |
|---|---|
| P1 (SUBHA_NAKSHATRAS) | Date when Moon is in Rohini or Hastham + auspicious tithi + auspicious yoga → `is_subha_muhurtham` must be `True` |
| PO2 (Dinam) | Boy nakshatra=1 (Aswini), Girl nakshatra=1 (same) → Dinam score must be 0, not 3 |
| PO2 (Dinam) | Boy nakshatra=2, Girl nakshatra=1 → remainder=1 → score must be 3 |
| PO4 (Yoni) | Boy nak=11 (Pooram, yoni=9 Buffalo), Girl nak=12 (Uthiram, yoni=10 Tiger) → hostile, score 0 |
| C1 (Functional Nature) | Magaram lagna + Mercury dasha → dasha modifier must be 1.00 (NEUTRAL), not 1.20 (TRIKONA) |
| T2 (Vedha) | Mercury in 2nd from natal Moon + another planet in 5th → `check_vedha("MERCURY", 2, ...)` must return True |
| P3 (Nalla Neram) | Monday → Nalla Neram slot must be slot 5 (not the Abhijit window) |
| PO1 (Max score) | Perfect-match chart → total score = 35 (or 36 after kuta rebalancing), not exceeding MAX_SCORE |
| E1 (Navamsa) | Known birth chart with published D9 rasi values → verify all 9 planet D9 rasis match |

---

*End of audit issue tracker. All line numbers reference the state of the codebase as of 2026-06-01.*
