# Vinaadi — Engine Fix Specification

_Version 2 · 2026-10-01 · Merged from the Claude and Codex audits, revised after Codex's review of version 1 · Every defect below was reproduced against the repo unless marked **Decision** or **DOCTRINE DECISION**._

This document is written for a coding agent. Each item says **what is wrong**, **how we know**, **exactly what to change**, and **how to prove it is fixed**. Line numbers refer to the repo as of 2026-10-01; re-check with `Select-String` before editing, as they will drift.

---

## 0. Ground rules for the agent

> **Doctrine rule — read this first.** Never change a classical or Tamil astrological formation merely to reduce its simulated prevalence. Base-rate simulations are diagnostics, not doctrine. Every detector change must either cite the selected authority (book, chapter/verse or page, edition) or be explicitly labelled a `VINAADI` heuristic with its own name. Items marked **DOCTRINE DECISION** may not be implemented until Senthil (with the reference astrologer) records the rule and its source in `docs/DOCTRINE.md`. The agent must not choose between traditions on its own.

1. **Follow `CLAUDE.md`** in the repo root: PowerShell, exact repo path `C:\Users\senth\OneDrive\문서\GitHub\sanstro`, UTF-8 without BOM for any file containing Tamil, `$env:PYTHONUTF8 = "1"` before pytest.
2. **Tests run against the test DB only** (`localhost:5433/vinaadi_test`) or SQLite. Never point `JOTHIDAM_DATABASE_URL` at `vinaadi_dev`.
3. **No destructive migrations.** If an item needs a new column, write a reversible Alembic migration and test apply → downgrade → apply on the test DB first.
4. **Keep the public API stable unless the item says otherwise.** The web and mobile apps read `name`, `strength`, `conditionsMet`, `cancellationFactors`, `dashaActivated`, `activationScore`. New fields are additive. Enum *values* must stay the exact strings emitted today (e.g. `"GAJA_KESARI_YOGA"`, `"STRONG"`).
5. **Two Swiss Ephemeris backends exist.** Python < 3.14 uses `pyswisseph` (this is what the Docker image runs — `python:3.12-slim`). Python ≥ 3.14 uses `swisseph-ffi` (your local machine — the `.pyc` files are `cpython-314`). **Every ephemeris change must be tested on both.**
6. **One PR per item ID** (E1, Y1, …) unless the item says to combine. Each PR adds or updates tests.
7. Freeze new yoga/remedy features until all P0 items are merged.

### Recommended PR order

| Order | Items | Why this order |
|---|---|---|
| 1 | E1, E2, E3 | Production crash and wrong-rasi bugs; independent of everything else |
| 2 | S1 | Shared enums are needed by Y1, SC1, R1 |
| 3 | M1, P1 | Clean inputs before changing detectors |
| 4 | Y1, Y2 | Registry + key planets + real dasha activation |
| 5 | F1 | Factor categories |
| 6 | SC1 (stage A), R1 | Scoring and remedies on top of clean data |
| 7 | D1, G1, B1 | Doctrine config, golden charts, prevalence regression report |
| 8 | K1, KS1, T5, T6 (ready) · T1–T4, T7–T9 (after their DOCTRINE DECISION is recorded) | Detector corrections, each citing its source |
| 9 | SC1 (stage B), U1–U5 | User-facing changes |
| 10 | A1–A7 | Assistant layer |

---

# P0 — Correctness and trust

## E1 — Sunrise/sunset crashes on the pyswisseph backend

**Priority:** P0 · **Source:** Claude (return-code part: Codex) · **File:** `app/calculations/ephemeris.py` → `calculate_rise_transit_jd` (lines ~197–247)

### What is wrong

The pinned `pyswisseph==2.10.3.2` signature is:

```
rise_trans(tjdut, body, rsmi, geopos, atpress=0.0, attemp=0.0, flags=FLG_SWIEPH)  -> (retflag, tret)
```

The code passes a `None` star name as the third argument, so **both** call forms send 8 arguments:

```python
swe_module.rise_trans(jd_start, SUN, None, CALC_RISE..., geopos, 0.0, 0.0, FLG_SWIEPH)   # 8 args
swe_module.rise_trans(jd_start, SUN, None, CALC_RISE..., FLG_SWIEPH, geopos, 0.0, 0.0)   # 8 args
```

Both raise `TypeError: function takes at most 7 arguments (8 given)`. Callers with no `try/except`:
- `app/calculations/panchangam.py:1339–1345` (daily panchangam)
- `app/calculations/tamil_calendar.py:58, 64`
- `app/services/chart_service.py:268–290` (Mandhi calculation — has a try/except, so it fails silently instead)

**Why nobody noticed:** your local Python is 3.14 → FFI backend → that path works. Docker (3.12) takes the broken path.

**Second defect — return codes are never checked.** Swiss Ephemeris returns `0` (OK), `-1` (error), `-2` (no rise/set — polar day/night). Verified: for Tromsø-like latitudes in June, pyswisseph returns `(-2, (0.0, …))`. The current parser would return `0.0` as the Julian Day (= 4713 BC) with no error. The FFI branch also ignores `retflag`.

### Evidence

```
$ python -c "import swisseph as s; s.rise_trans(2461314.2, s.SUN, None, s.CALC_RISE, (77.34,11.1,0), 0.0, 0.0, s.FLG_SWIEPH)"
TypeError: function takes at most 7 arguments (8 given)
```

### Fix

```python
from enum import Enum

class SunriseConvention(str, Enum):
    ASTRONOMICAL = "ASTRONOMICAL"   # upper limb + refraction — CURRENT behaviour, keep as default
    HINDU = "HINDU"                 # disc centre, no refraction (SE_BIT_HINDU_RISING = 896)

class NoRiseSetError(RuntimeError):
    """Sun does not rise or set on this date at this latitude (polar day/night)."""

_BIT_HINDU_RISING = 896  # = BIT_DISC_CENTER(256) | BIT_NO_REFRACTION(512) | BIT_GEOCTR_NO_ECL_LAT(128)

def calculate_rise_transit_jd(
    jd_start: float, latitude: float, longitude: float, *,
    rise: bool,
    altitude_m: float = 0.0,
    convention: SunriseConvention = SunriseConvention.ASTRONOMICAL,
) -> float:
    rsmi_base = CALC_RISE if _HAS_MODULE_API else SE_CALC_RISE
    rsmi_set = CALC_SET if _HAS_MODULE_API else SE_CALC_SET
    rsmi = rsmi_base if rise else rsmi_set
    if convention is SunriseConvention.HINDU:
        rsmi |= _BIT_HINDU_RISING
    with _SWISS_LOCK:
        if _HAS_MODULE_API:
            retflag, tret = swe_module.rise_trans(
                jd_start, SUN, rsmi, (longitude, latitude, altitude_m), 0.0, 0.0, FLG_SWIEPH
            )
        else:
            geopos = (c_double * 3)(longitude, latitude, altitude_m)
            tret = (c_double * 10)()
            serr = create_string_buffer(256)
            retflag = _SWISS.swe_rise_trans(jd_start, SE_SUN, None, SEFLG_SWIEPH, rsmi,
                                            geopos, 0.0, 0.0, tret, serr)
    if retflag == -2:
        raise NoRiseSetError(f"No {'rise' if rise else 'set'} at lat={latitude} for jd={jd_start}")
    if retflag < 0:
        raise RuntimeError("Swiss Ephemeris rise_trans failed")  # include serr text on FFI path
    return float(tret[0])
```

- Delete the old `try/except TypeError` dual-signature code and the tuple-shape guessing.
- **Do not change the default convention** — that is decision D2. Only add the parameter.
- In `panchangam.py` and `tamil_calendar.py`, catch `NoRiseSetError` and return a clear 422 (“Panchangam is not defined for this date at this latitude”) rather than a 500.

### Acceptance tests (`tests/test_ephemeris.py`)

- `test_sunrise_tiruppur_2026_10_01`: lat 11.10, lon 77.34 → sunrise between 06:08 and 06:11 IST (ASTRONOMICAL). Runs on whichever backend is installed.
- `test_sunrise_hindu_is_later_than_astronomical`: same place/date, HINDU − ASTRONOMICAL between 2 and 5 minutes.
- `test_polar_day_raises`: lat 78.0, lon 18.0, 2026-06-21 → `NoRiseSetError`.
- **CI:** add a job running `pytest tests/test_ephemeris.py` on Python 3.12 (pyswisseph) in addition to 3.14 (FFI).

---

## E2 — Lagna can be computed in the wrong ayanamsa

**Priority:** P0 · **Source:** Claude · **File:** `app/calculations/ephemeris.py` → `calculate_lagna_degree` (lines ~182–194)

### What is wrong

`calculate_lagna_degree` calls `houses_ex(..., FLG_SIDEREAL)` but **never sets the sidereal mode**. Only `calculate_sidereal_planets` calls `set_lahiri_ayanamsa()`. Swiss Ephemeris keeps the sidereal mode as process-global state; its default is Fagan/Bradley, ~0.88° away from Lahiri.

If a fresh worker process handles a request that calls `calculate_lagna_degree` before `calculate_sidereal_planets`, the lagna is computed in Fagan/Bradley. Direct callers: `panchangam.py:973, 980, 1436`, `prasna.py:58`, `tajaka.py:132`, `d9_chart.py:29`, `chart_service.py:294, 801`.

### Evidence

Fresh process, 1993-03-15 04:30 UT, lat 11.1, lon 77.34:

```
lagna before set_lahiri: 29.178°  (Mesham)
lagna after  set_lahiri: 30.061°  (Rishabam)   ← different rasi
```

### Fix

```python
def calculate_lagna_degree(jd_ut: float, latitude: float, longitude: float) -> float:
    with _SWISS_LOCK:
        set_lahiri_ayanamsa()          # ← add this line (RLock is re-entrant)
        ...existing body...
```

Do the same in any other function that uses `FLG_SIDEREAL` (grep `SIDEREAL` in `app/calculations`). Long term, D1 replaces the hard-coded Lahiri with `doctrine.ayanamsa`.

### Acceptance test

`test_lagna_independent_of_call_order`: run in a **subprocess** (fresh interpreter) — compute lagna first, then planets, then lagna again; both lagna values must be equal to 1e-6°. A subprocess is required because the bug only shows in a fresh process.

---

## E3 — Production may be on the Moshier fallback, and warnings are dropped

**Priority:** P0 (verify) · **Source:** Claude · **File:** `ephemeris.py`, Dockerfile, settings

### What is wrong

No code calls `set_ephe_path`. Without the `.se1` data files, Swiss Ephemeris silently falls back to the Moshier analytic ephemeris. In the audit sandbox, `calc_ut` returned flag `4` (= `FLG_MOSEPH`). Moshier is accurate enough for rasi placement, but the Moon can drift by arc-seconds, which matters for nakshatra/pada boundaries and tithi end-times. The pyswisseph branch of `_calc_ut` also discards `retflag` and never records a warning.

### Fix

1. Add `SWISSEPH_PATH` to `app/core/config.py` (env var, default `/app/ephe`).
2. Call `swe.set_ephe_path(path)` (FFI: `_SWISS.swe_set_ephe_path`) once at import, inside the lock.
3. Copy `sepl_18.se1`, `semo_18.se1`, `seas_18.se1` into the Docker image at that path.
4. In `_calc_ut`, if `retflag & FLG_SWIEPH == 0`, append the warning `"Swiss ephemeris files not found; using Moshier"` to `source_warnings`.
5. Record **both** facts on `EphemerisSnapshot` and on every stored chart: `backend` (Python binding: `pyswisseph` / `swisseph-ffi`, already present) and a new `ephemeris_source_actual` (`SWIEPH` / `MOSEPH` / `JPLEPH`, read from the returned flag bits). These are different things and both are needed to reproduce a chart later. *(Codex)*

### Acceptance test

`test_swiss_files_in_use`: compute the Sun for any date; assert `"Moshier"` not in `snapshot.source_warnings`. Mark it to run only where `SWISSEPH_PATH` exists (CI and Docker).

---

## S1 — One shared strength vocabulary

**Priority:** P0 · **Source:** Claude + Codex · **Files:** new `app/calculations/enums.py`; `yogas.py`; `yoga_activation.py`; `prediction_score.py`

### What is wrong

Three modules use three vocabularies for the same idea:

| Module | Values it uses |
|---|---|
| `yogas.py` (all detectors) | `STRONG`, `PARTIAL`, `WEAK` |
| `yoga_activation.py:49` | `STRONG`, `MODERATE`, `PARTIAL`, `WEAK` |
| `prediction_score._YOGA_STRENGTH_BONUS` | `STRONG`, `PARTIAL`, `WEAK`, `NONE` |
| `prediction_score._DOSHAM_PENALTY` | `STRONG`, `MODERATE`, `MILD`, `NONE` |

Result: a `PARTIAL` dosham gets **0** penalty (key missing → default 0). `MODERATE` and `MILD` are never produced anywhere.

### Fix

```python
# app/calculations/enums.py
from enum import Enum

class Strength(str, Enum):      # values identical to today's strings → API unchanged
    STRONG = "STRONG"
    PARTIAL = "PARTIAL"
    WEAK = "WEAK"
    NONE = "NONE"
```

- Type every `strength` field as `Strength`. Because it is a `str` enum, JSON output is unchanged.
- `prediction_score.py`:
  ```python
  _YOGA_STRENGTH_BONUS = {Strength.STRONG: 8, Strength.PARTIAL: 4, Strength.WEAK: 1, Strength.NONE: 0}
  _DOSHAM_PENALTY      = {Strength.STRONG: -10, Strength.PARTIAL: -5, Strength.WEAK: -2, Strength.NONE: 0}
  ```
- `yoga_activation.py`: `{STRONG: 75, PARTIAL: 50, WEAK: 25}`; delete `MODERATE`.
- Remedy `severity` (`SEVERE/MODERATE/MILD`) is a **different** concept — give it its own `Severity` enum; don't merge it into `Strength`.
- Do **not** change what absent yogas emit (`WEAK` today) in this PR; gating on `is_present` is handled in SC1.

### Acceptance test

`test_all_strength_values_are_enum_members`: run `detect_yogas_and_doshams` on 50 random charts; every `strength` value is in `Strength`. `test_partial_dosham_penalised`: `dosham_present=True, dosham_strength=PARTIAL` lowers the score versus `NONE`.

---

## M1 — Missing planets are silently placed in the lagna (or Moon) sign

**Priority:** P0 · **Source:** Codex (verified) · **File:** `app/calculations/yogas.py`

### What is wrong

When a planet is missing from the input, several detectors invent a position instead of reporting “unknown”:

| Line | Code | Effect |
|---|---|---|
| 1444 | `planets.get(eleventh_lord, lagna_rasi)` | Daridra: missing 11th lord assumed in lagna |
| 1466 | `planets.get(ninth_lord, lagna_rasi)` | Lakshmi: missing 9th lord assumed in lagna (house 1 = kendra → favours presence) |
| 1684 | `planets.get(fifth_lord, lagna_rasi)` | Putra Sarpa |
| 1736 | `planets.get(badhaka_lord, lagna_rasi)` | Badhaka |
| 1908 | `planets_rasi.get("JUPITER", moon_rasi)` | Sakata: missing Jupiter assumed with Moon → house 1 → never present |
| 1910 | `.get("JUPITER", moon_rasi)`, `.get("RAHU", moon_rasi)` | Chandala: both missing → both on Moon → **present** |

Separately, `detect_sevvai_dosham` validates only `MARS, MOON, VENUS` (line 324) but reads Jupiter unconditionally (line 419):

```
>>> detect_sevvai_dosham({"MARS":1,"MOON":2,"VENUS":3}, 1)
KeyError: 'JUPITER'
```

### Fix

1. Add a field to `YogaResult` (at the end, with a default, so positional constructors keep working):
   ```python
   missing_data: tuple[str, ...] = ()
   ```
2. Add a helper and use it at all six sites:
   ```python
   def _rasi_or_none(planets: Mapping[str, int], planet: str) -> int | None:
       return planets.get(planet)
   ```
   If any required planet is `None`, return the result with `is_present=False`, `strength=Strength.NONE`, `missing_data=(planet,)`. For doshams, use the existing `INCOMPLETE_DATA` pattern already used in `detect_sevvai_dosham` lines 325–352.
3. In `detect_sevvai_dosham`, change line 324 to require `("MARS", "MOON", "VENUS", "JUPITER")`.
4. In the orchestrator (lines 1908–1910), skip Sakata/Chandala when Jupiter or Rahu is missing and append an `INCOMPLETE_DATA` result instead.

### Acceptance tests

- For each of the 7 detectors, a chart missing the required planet → `is_present is False` and the planet appears in `missing_data`.
- `test_sevvai_without_jupiter_returns_incomplete`: no `KeyError`; `label == "INCOMPLETE_DATA"`.
- `test_chandala_not_fabricated`: chart without JUPITER and RAHU → Chandala not present.

---

## P1 — Every planet's strength defaults to 50 inside yoga detection

**Priority:** P0 · **Source:** Claude · **Files:** `yogas.py:1808–1813`, `app/services/chart_service.py:455–480`

### What is wrong

`detect_yogas_and_doshams` builds its own strength map:

```python
planet_scores = {planet: int(value.get("strength_score", 50)) if isinstance(value, Mapping) else 50
                 for planet, value in planets.items()}
```

But `chart_service._build_yoga_dosham_insights` passes `planet_map: dict[str, int]` (rasi only, line 455), so **every planet scores 50**. Consequences:
- **Lakshmi Yoga can never fire** (needs ≥ 60, line 1467–1468).
- Daridra's “weak 11th lord” branch (< 40, line 1446) can never fire.
- Putra Sarpa and Badhaka strength checks run on defaults.

The real scores already exist: `chart_service.py:462` computes `planet_scores = {p.graha: p.strength_score for p in planets}` and passes them only to `yoga_activation_score`.

### Fix

```python
def detect_yogas_and_doshams(
    planets, lagna_rasi, moon_rasi, *,
    planet_scores: Mapping[str, int] | None = None,   # ← new
    ...
):
    if planet_scores is None:
        planet_scores = {...existing fallback...}
```

In `chart_service.py`, pass `planet_scores=planet_scores` in the call at line ~468.

### Acceptance tests

- `test_lakshmi_fires_with_real_scores`: construct a chart where the 9th lord is in a kendra and both 9th lord and lagna lord score 70 → Lakshmi present.
- `test_chart_service_passes_scores` (service-level): monkeypatch `detect_yogas_and_doshams` and assert `planet_scores` is not `None`.

---

## Y1 — Yoga registry, per-result key planets, and the broken activation lookup

**Priority:** P0 · **Source:** Claude + Codex · **Files:** new `app/calculations/yoga_registry.py`; `yogas.py`; `yoga_activation.py`; `yoga_effects.py`; `chart_service.py:491–498`

### What is wrong

`yoga_activation.YOGA_KEY_PLANETS` is keyed by names the detectors never emit:

| Activation map key | What `yogas.py` actually emits |
|---|---|
| `GAJA_KESARI` | `GAJA_KESARI_YOGA` |
| `BUDHA_ADITYA` | `BUDHA_ADITYA_YOGA` |
| `VIPAREETHA_RAJA` | `VIPAREETHA_RAJA_YOGA` |
| `PARIVARTANA` (empty list) | `PARIVARTANA_YOGA` |
| `CHANDRA_MANGALA` | `CHANDRA_MANGALA_YOGA` |
| `PANCHA_MAHAPURUSHA_MARS` … | `RUCHAKA_YOGA`, `BHADRA_YOGA`, `HAMSA_YOGA`, `MALAVYA_YOGA`, `SASA_YOGA` |
| *(missing)* | `AMALA_YOGA`, `ADHI_YOGA`, `KEMADRUMA_YOGA`, `SAKATA_YOGA`, `CHANDALA_YOGA`, `DARIDRA_YOGA`, `LAKSHMI_YOGA`, `SUNAPHA_YOGA`, `ANAPHA_YOGA`, `DURUDHURA_YOGA`, `VASUMATI_YOGA` |

`YOGA_KEY_PLANETS.get(name, [])` returns `[]` for all of these, so the yoga is treated as never activated and scored at `strength_base * 0.45` forever. In a 6,000-chart simulation, **20 of the 23 yoga names that appeared never matched**; only `RAJA_YOGA`, `DHANA_YOGA` and `NEECHA_BHANGA_RAJA_YOGA` did.

A second problem: even where names match, the key planets are **static and wrong**. `RAJA_YOGA: [SUN, MOON, MARS, JUPITER]` — but a Raja Yoga is formed by *this chart's* kendra and trikona lords, which differ per lagna. Same for Dhana (2nd and 11th lords) and Parivartana (the two exchanging planets).

Third: `yoga_effects.YOGA_EFFECT` has 8 entries no detector emits: `CHANDALA_KETU_YOGA`, `DARIDRA_PROXY_YOGA`, `YOGAKARAKA_RAJA_YOGA`, `DHANA_SUPPORTIVE_YOGA`, `SHUBHA_KARTARI_YOGA`, `PAPA_KARTARI_YOGA`, `KARTARI_YOGA`, `MARANA_KARAKA_STHANA`. The coverage test only checks one direction (emitted → has effect).

### Fix

**Step 1 — registry.**

```python
# app/calculations/yoga_registry.py
class YogaCode(str, Enum):
    GAJA_KESARI_YOGA = "GAJA_KESARI_YOGA"
    RAJA_YOGA = "RAJA_YOGA"
    ...  # one member per string the detectors emit today — values unchanged

@dataclass(frozen=True)
class YogaSpec:
    code: YogaCode
    name_ta: str
    name_en: str
    life_areas: frozenset[str]   # area keys from life_areas_service._AREA_ROUTING
    user_facing: bool            # False for names that must not be shown raw (see U1)
    school: str                  # "BPHS", "TAMIL_POPULAR", "VINAADI"
    source_ref: str              # e.g. "BPHS 36.3"
    rule_version: str            # e.g. "2026.10.1"

YOGA_REGISTRY: dict[YogaCode, YogaSpec] = {...}
```

**Step 2 — key planets travel with the result.** Add to `YogaResult` (end of the dataclass, with a default):

```python
key_planets: tuple[str, ...] = ()
```

Each detector fills it:

| Yoga | `key_planets` |
|---|---|
| Gaja Kesari | `("JUPITER", "MOON")` |
| Raja | the `(trikona_lord, kendra_lord)` pair that formed it; `_merge_yoga_list` unions all pairs |
| Dhana | 2nd lord, 11th lord |
| Neecha Bhanga | the debilitated planet + the planet(s) supplying the cancellation |
| Ruchaka/Bhadra/Hamsa/Malavya/Sasa | the one planet |
| Budha Aditya | `("SUN", "MERCURY")` |
| Vipareetha Raja | the dusthana lords that satisfied the rule |
| Parivartana | `planet_a`, `planet_b` |
| Chandra Mangala | `("MOON", "MARS")` |
| Sakata | `("MOON", "JUPITER")` |
| Kemadruma | `("MOON",)` |
| Chandala | `("JUPITER", "RAHU")` |
| Amala / Adhi / Vasumati | the benefics found |
| Daridra | 11th lord |
| Lakshmi | 9th lord, lagna lord |
| Sunapha / Anapha / Durudhura | the planets in 2nd / 12th from Moon |

**Step 3 — activation reads the result, not a table.**

```python
def yoga_activation_score(yoga: YogaResult, *, mahadasha_lord: str, antardasha_lord: str,
                          planet_scores: Mapping[str, int]) -> int:
    if not yoga.is_present:
        return 0
    base = {Strength.STRONG: 75, Strength.PARTIAL: 50, Strength.WEAK: 25}.get(yoga.strength, 25)
    dasha = {mahadasha_lord, antardasha_lord}
    active = [p for p in yoga.key_planets if p in dasha]
    if not active:
        return round(base * 0.45)
    best = max(planet_scores.get(p, 50) for p in active)
    return max(10, min(100, round(base * 0.60 + best * 0.40)))
```

Delete `YOGA_KEY_PLANETS`. Update the call at `chart_service.py:491–498`.

**Step 4 — effects coverage both ways.** In `tests/test_yoga_effects.py`, assert `set(YOGA_EFFECT) == {c.value for c in YogaCode}`. For the 8 dead entries, either implement the detector or move the entry to a `PLANNED_YOGA_EFFECT` dict that the test ignores.

### Acceptance tests

- `test_every_emitted_code_in_registry`: 200 random charts → every `name` is a `YogaCode`.
- `test_present_yogas_have_key_planets`: every present yoga has a non-empty `key_planets`.
- `test_gaja_kesari_activates_in_jupiter_dasha`: Gaja Kesari present, maha=JUPITER → score > `round(75 * 0.45)`.
- `test_raja_key_planets_follow_lagna`: Mesham lagna chart with Sun (5th lord) conjunct Saturn (10th lord) → `key_planets == ("SUN", "SATURN")` in some order.
- Bidirectional effects test (step 4).

---

## Y2 — `dasha_activated` must mean the actual dasha, and dasha lords must be typed

**Priority:** P0 · **Source:** Codex · **File:** `yogas.py`

### What is wrong

The field `dasha_activated` (shown in the UI as **isCurrentlyActive**) is computed inconsistently:
- **Amala** (line 1413) and **Adhi** (line 1436) set it from *functional nature* (`YOGAKARAKA`/`TRIKONA`), not from the running dasha. A user is told the yoga is “active now” when it merely involves a benefic.
- **Sakata, Kemadruma, Chandala, Daridra, Lakshmi, Vasumati, Sunapha/Anapha/Durudhura** hard-code `dasha_activated=False` (lines 1355, 1378, 1392, 1457, 1476, 1489–1493, 1513), so they can never show as active.
- Line 1821: when `current_maha_lord` is not supplied, the Mahadasha lord is guessed as `sorted(active_set)[0]` — alphabetical order of a set of Maha + Antar lords. Production `chart_service` does pass `current_maha_lord`, so this is latent, but any other caller gets a wrong Badhaka activation.

### Fix

1. Add a typed context:
   ```python
   @dataclass(frozen=True)
   class DashaContext:
       mahadasha_lord: str
       antardasha_lord: str
       pratyantar_lord: str | None = None
   ```
2. `detect_yogas_and_doshams(..., dasha: DashaContext | None = None)`. Keep `active_lords` and `current_maha_lord` for one release as deprecated aliases that build a `DashaContext`; remove the `sorted(...)[0]` fallback — if Maha is unknown, Badhaka is evaluated without dasha activation and `dasha_activated=False`.
3. **Compute `dasha_activated` in one place**, after all detectors run (depends on Y1's `key_planets`):
   ```python
   lords = {dasha.mahadasha_lord, dasha.antardasha_lord} if dasha else set()
   yogas = [dataclasses.replace(y, dasha_activated=bool(lords & set(y.key_planets))) for y in yogas]
   ```
   Remove all per-detector `dasha_activated=` logic, including the functional-nature version in Amala and Adhi.
4. Doshams keep their current planet lists (Sevvai → MARS, Rahu-Ketu → RAHU/KETU, Pitru → SUN/RAHU/KETU/9th lord) but use the same `lords` set.

### Acceptance tests

- `test_amala_not_active_outside_dasha`: Amala present with Jupiter as yogakaraka, dasha = SATURN/MERCURY → `dasha_activated is False`.
- `test_kemadruma_active_in_moon_dasha`: Kemadruma present, maha=MOON → `True`.
- `test_no_alphabetical_maha_guess`: `active_lords={"VENUS","JUPITER"}` with no Maha → Badhaka not dasha-activated (previously JUPITER was chosen alphabetically).

---

## F1 — Protective and contextual factors are filed as triggers

**Priority:** P0 · **Source:** Claude + Codex · **File:** `yogas.py` (`detect_rahu_ketu_dosham`, `detect_sevvai_dosham`, `_build_dosham_explanations`)

### What is wrong

`DoshamResult` has only two lists: `conditions_met` (triggers) and `cancellation_factors`. Several markers are in the wrong one:

| Line | Marker | Currently in | Actually is |
|---|---|---|---|
| 666 | `d9_seventh_lord_strong` | `conditions_met` | a **mitigation** — the user is told a protective factor “triggered” the dosham |
| 619, 622 | `rahu_ketu_upachaya` | `conditions_met` | **context** (“more workable”) |
| 381–386, 676–683 | `female_high_attention_house`, `male_high_attention_house` | `conditions_met` | **context** (and see U1) |

`_build_dosham_explanations` prints everything in `conditions_met` under “Triggered factors”.

### Fix

1. Add `context_factors: list[str] = field(default_factory=list)` to `DoshamResult` (end of dataclass).
2. Move `d9_seventh_lord_strong` → `cancellation_factors`. Note this changes the Rahu-Ketu cancellation count (`len(cancellation_factors) >= 2`, line 694) — intended.
3. Move `rahu_ketu_upachaya` and both `*_high_attention_house` markers → `context_factors`. Remove the special-case exclusion of the gender markers at line 484 (no longer needed).
4. `_build_dosham_explanations`: add a “Context:” sentence for `context_factors`.
5. API: add optional `contextFactors` to `ChartDoshamInsight`. Frontend can ignore it initially.

### Acceptance tests

- `test_d9_strength_is_mitigation`: a chart with a strong D9 7th lord → marker in `cancellation_factors`, not in `conditions_met`.
- `test_why_text_has_no_protective_trigger`: `explanation_why_en` never lists `d9_seventh_lord_strong` under “Triggered factors”.

---

## SC1 — Prediction score: fix the bugs (stage A), then replace the 0–100 output (stage B)

**Priority:** P0 (stage A) · P1 (stage B) · **Source:** Claude + Codex · **Files:** `app/calculations/prediction_score.py`; `app/services/life_areas_service.py:950–1020`

### What is wrong — verified

1. **The caller ignores yogas and doshams completely.** `life_areas_service.py:986–990` hard-codes:
   ```python
   yoga_present=False, yoga_strength="NONE",
   dosham_present=False, dosham_cancelled=False, dosham_strength="NONE",
   ```
   Layer 1 (“birth promise”, 30 of 100 points) never sees a single yoga or dosham.
2. **`yoga_present` is never read.** The bonus is looked up by `yoga_strength` alone (line 73). An absent yoga labelled `STRONG` adds +8.
3. **`dosham_present` doesn't gate the penalty.** It is only used to halve the penalty when cancelled (lines 74–76). An absent dosham labelled `STRONG` subtracts 10.
4. **`maha_lord_strength` is never used.** Changing it from 0 to 100 leaves the score unchanged (45 → 45).
5. **Missing data earns points.** Empty `key_planet_strengths` → 8 points (line 83); `varga_confirmation=0` → 5; transit starts at 8; ashtakavarga at 3. A chart with no useful inputs scores **45/100**, which the UI shows as “Mixed — plan carefully”.
6. **Copy is too commanding** for decisions like surgery, resignation or a ₹10 lakh investment: “Exceptional period — act fully”, “proceed with confidence”.
7. **Tamil register:** the DIFFICULT band uses `காத்திரு` (informal singular imperative); every other band is polite.
8. Also S1: dosham penalty keys don't match detector strengths.

Verified by running the module: absent yoga `STRONG` + absent dosham `STRONG` → 43; all `NONE` → 45; `maha_lord_strength` 0 vs 100 → 45 both.

### Fix — stage A (keep the 0–100 number internally; fix the maths)

```python
yoga_bonus = _YOGA_STRENGTH_BONUS[inp.yoga_strength] if inp.yoga_present else 0
dosham_pen = 0
if inp.dosham_present:
    dosham_pen = _DOSHAM_PENALTY[inp.dosham_strength]
    if inp.dosham_cancelled:
        dosham_pen = -(abs(dosham_pen) // 2)      # avoid floor-division surprises on negatives
```

- **Remove** `maha_lord_strength` from `PredictionScoreInput` and its caller (or use it deliberately — e.g. `l3 *= 0.8 + 0.4 * maha_lord_strength/100` — but do not leave a dead input).
- **Missing data:** `key_planet_strengths=[]` → `l2 = 0`, and add `data_completeness: float` (0–1) to the result: the share of the six layers that had real inputs. Do not invent neutral points.
- **Wire real inputs in `life_areas_service`:** use `YogaSpec.life_areas` (Y1) to pick the strongest present yoga relevant to the area, and map dosham `category` to areas (`MARRIAGE`/`KALATHRA` → relationships/marriage area keys; `PITRU` → family; `SARPA_NAGA`/Putra → children area; Badhaka → all areas at half weight). Use the area keys already defined in `_AREA_ROUTING`.
- **Copy:** replace the interpretation scale text:

| Band | English (new) | Tamil (new) |
|---|---|---|
| ≥ 76 | Strongly supportive timing — a good window to move forward with preparation | மிகவும் சாதகமான காலம் — தயாரிப்புடன் முன்னேறலாம் |
| 61–75 | Supportive — steady effort tends to pay off | சாதகமான காலம் — தொடர் முயற்சிக்குப் பலன் கிடைக்கும் |
| 41–60 | Mixed — plan carefully, keep options open | கலப்பான காலம் — கவனமாகத் திட்டமிடுங்கள் |
| 21–40 | Needs care — favour preparation over big commitments | கவனம் தேவைப்படும் காலம் — பெரிய முடிவுகளுக்கு முன் தயாராகுங்கள் |
| < 21 | Go slow — postpone avoidable risks in this area | நிதானம் தேவை — தவிர்க்கக்கூடிய அபாயங்களைத் தள்ளிவையுங்கள் |

  (Tamil to be confirmed in U4 native review.) Merge the old EXCEPTIONAL (91+) into the top band.

### Fix — stage B (what the user sees)

Replace the single number in the API/UI with:

```python
@dataclass(frozen=True)
class AreaOutlook:
    band: Literal["SUPPORTIVE", "MIXED", "CAREFUL"]   # from total: ≥61 / 41–60 / ≤40
    confidence: Literal["HIGH", "MEDIUM", "LOW"]      # from data_completeness and layer agreement
    drivers: list[Driver]      # top 2 positive layers, each with a plain-language reason_ta/en
    watch: list[Driver]        # top 1–2 negative layers
    next_change: date | None   # next dasha/antar change or major transit ingress affecting the area
    total: int                 # kept for internal use and back-compat; not shown in UI
```

- **Confidence is three separate internal measures** (Codex), collapsed into one badge only in the UI:

  | Measure | Question it answers | Inputs |
  |---|---|---|
  | `calculation_confidence` | Can we trust the numbers? | birth-time precision flag, `ephemeris_source_actual` (E3), `missing_data`, `data_completeness` |
  | `doctrine_confidence` | How settled is the rule? | `YogaSpec.school` / `source_ref`: sourced classical rule = HIGH; school-dependent = MEDIUM; `VINAADI` heuristic = LOW |
  | `interpretation_confidence` | Do the layers agree? | sign agreement of natal promise, dasha, transit and varga layers |

  UI badge = the **lowest** of the three. Keep all three in the API response for the astrologer view and for A1/A7.
- Coordinate with web/mobile before removing the numeric display.

### Acceptance tests (`tests/test_prediction_score.py`)

- `test_absent_yoga_adds_nothing`, `test_absent_dosham_subtracts_nothing`.
- `test_partial_dosham_penalised` (from S1).
- `test_empty_inputs_low_completeness`: all-empty input → `data_completeness < 0.5`, `l2 == 0`.
- `test_life_area_uses_real_yogas` (service-level): a chart with Sevvai present → the relationships area's `l1` differs from a chart without it.
- Snapshot test of the new copy strings (catches accidental reintroduction of “act fully”).

---

## R1 — Remedy safety

**Priority:** P0 · **Source:** Claude + Codex · **Files:** `app/calculations/remedies.py`; `app/services/life_areas_service.py:1351–1360`; `app/api/remedies.py`

### What is wrong

1. **A remedy is issued for every area, even strong ones.** `life_areas_service` sorts the area's karakas by strength and always passes them, so `weak_planets[0]` is simply the *least strong* karaka — even if it scores 85. A score-90 area still gets a planet remedy (severity “MILD”).
2. **Jupiter fallback.** `get_area_remedy` (line 132): `target = weak_planets[0] if weak_planets else "JUPITER"`. No weak planet should mean no planet remedy.
3. **Gemstones are “prescribed” automatically.** `_gemstone_policy` returns `prescribe=True` with “Gemstone is prescribed for this benefic functional role” for YOGAKARAKA/TRIKONA/LAGNA_LORD, and “optional with caution” for KENDRA/UPACHAYA/NEUTRAL — that includes Blue Sapphire for Saturn.
4. **Guarantee note missing on one path.** `get_remedy()` attaches the fasting caution but not `GUARANTEE_NOTE_*`, although the module comment says both MUST accompany every remedy. `app/api/remedies.py` adds `remedy_disclaimer()` at the API level, but the **life-areas path** (`structured_remedy`) has no disclaimer at all.
5. **Functional malefics.** If the weakest karaka is a 6th/8th/12th lord, “strengthening” it is the wrong traditional move; it should be pacified (mantra, seva), never strengthened (gemstone).

### Fix

Remedy eligibility is driven by **an actual problem**, not by an arbitrary area-score threshold (Codex):

1. **No active concern → no remedy.** An area qualifies only when its outlook band is `CAREFUL` (SC1) **and** it has at least one `watch` driver, or the user explicitly asks for a remedy.
2. **No meaningful weak or afflicted driver → no planet remedy.** A karaka qualifies only if it is itself one of the area's `watch` drivers (weak, debilitated, combust, or afflicted in the current dasha/transit), not merely the least strong of the karakas.
3. **User did not ask → don't push traditional remedies.** Show the behavioural step (U5 level 1–2) only; levels 3–5 sit behind “Explore traditional remedies”.

```python
def get_area_remedy(area, outlook: AreaOutlook, functional_nature_map, *, user_requested: bool = False) -> dict:
    afflicted = [d.planet for d in outlook.watch if d.planet]
    active_concern = outlook.band == "CAREFUL" and bool(outlook.watch)
    if not (active_concern or user_requested) or not afflicted:
        return {"area": area, "primary_planet": None, "remedy": None,
                "reason_en": "No planet-specific remedy needed for this area right now.",
                "reason_ta": "இந்தப் பகுதிக்கு இப்போது கிரகப் பரிகாரம் தேவையில்லை."}
    target = afflicted[0]
    fn = functional_nature_map.get(target, FunctionalNature.NEUTRAL)
    mode = "PACIFY" if fn in {FunctionalNature.DUSTHANA, FunctionalNature.MARAKA} else "STRENGTHEN"
    ...
```

- `_gemstone_policy`: **never** return `prescribe=True`. Keep `is_gemstone_prescribed` in the payload (always `False`, for API back-compat), and add `gemstone_reference_ta/en` + `gemstone_note_en = "Traditional reference only. Consult an experienced astrologer after a full-chart review before wearing any gemstone."`. For Saturn, Rahu and Ketu, omit the gemstone reference entirely.
- `get_remedy()`: add `guarantee_note_ta` / `guarantee_note_en` to the payload.
- `life_areas_service`: pass the area's `AreaOutlook`; attach `remedy_disclaimer()` to `structured_remedy` whenever a remedy is returned.
- Add `remedy_mode` (`PACIFY` / `STRENGTHEN`) to the payload; in `PACIFY` mode, return mantra, seva and behavioural fields only.

### Acceptance tests

- `test_supportive_area_gets_no_remedy`, `test_no_afflicted_driver_no_planet_remedy`, `test_no_weak_planet_no_jupiter`, `test_user_request_unlocks_remedy`.
- Note: R1 depends on SC1 stage B (`AreaOutlook`). Until stage B lands, ship the Jupiter-fallback removal, the gemstone change and the guarantee note on their own, and keep the existing remedy trigger unchanged.
- `test_gemstone_never_prescribed`: all 9 planets × all 8 functional natures → `is_gemstone_prescribed is False`.
- `test_every_remedy_has_guarantee_note`.
- `test_dusthana_lord_is_pacified`: weakest karaka is the 8th lord → `remedy_mode == "PACIFY"` and no gemstone fields.

---

## L1 — Decision: Swiss Ephemeris licence

**Priority:** P0 (business) · **Source:** Codex · **Owner:** Senthil, not the coding agent

Swiss Ephemeris is dual-licensed: **AGPL** or the paid **Swiss Ephemeris Professional License** from Astrodienst. Read the licensing section of the official programming documentation (`https://www.astro.com/swisseph/swephprg.htm`) and decide before public launch. Under AGPL, offering the software as a network service carries source-disclosure obligations. Record the decision in `docs/LICENSES.md`. Also check `swisseph-ffi`'s own licence.

---

# P1 — Doctrine and calibration

## D1 — Doctrine configuration with provenance

**Source:** Claude + Codex · **Files:** new `app/calculations/doctrine.py`; `yogas.py`; `ephemeris.py`

### What is wrong

School-dependent choices are hard-coded constants scattered across files, and one switch is a no-op:
- `TAMIL_SEVVAI_HOUSES` and `EXTENDED_SEVVAI_HOUSES` (lines 21–22) are **both** `{1, 2, 4, 7, 8, 12}` — `sevvai_mode` changes nothing, while the API implies two traditions.
- Mean node is hard-coded (`MEAN_NODE`).
- Ayanamsa is hard-coded Lahiri.
- Sunrise convention is implicit.
- Rule provenance (which book or school) isn't recorded anywhere.

### Fix

```python
@dataclass(frozen=True)
class Doctrine:
    version: str = "2026.10.1"
    ayanamsa: str = "LAHIRI"
    node_mode: Literal["MEAN", "TRUE"] = "MEAN"
    sunrise: SunriseConvention = SunriseConvention.ASTRONOMICAL
    sevvai_houses: frozenset[int] = frozenset({1, 2, 4, 7, 8, 12})
    sevvai_references: tuple[str, ...] = ("LAGNA", "MOON", "VENUS")
    gaja_kesari_from: tuple[str, ...] = ("MOON",)          # BPHS: ("LAGNA", "MOON")
    lunar_yoga_excluded_nodes: frozenset[str] = frozenset({"RAHU", "KETU"})   # D6
    mercury_combust_deg: float = 14.0                      # T2 quality grading
    mercury_combust_deg_retro: float = 12.0
    node_axis_epsilon_deg: float = 0.0                     # KS1
    show_gender_weighting_to_users: bool = False

DEFAULT_DOCTRINE = Doctrine()
```

- Pass `doctrine` through `calculate_sidereal_planets`, `calculate_lagna_degree`, `calculate_rise_transit_jd` and `detect_yogas_and_doshams` (default `DEFAULT_DOCTRINE`).
- Delete `TAMIL_SEVVAI_HOUSES`/`EXTENDED_SEVVAI_HOUSES`; `sevvai_mode` selects a named preset (`tamil_standard` vs `extended_manglik`) **only after** decision D3 says how they differ.
- Include `doctrine.version` in the chart's existing `calculation_version` string so stored charts record which rules produced them. If that needs a new DB column, write a reversible migration (CLAUDE.md rules).
- Fill `school`, `source_ref`, `rule_version` in `YogaSpec` (Y1) for every yoga.

**Decisions Senthil needs to make (record in `docs/DOCTRINE.md`, each with book, edition and page):**
- **D3 Sevvai houses:** decide from Vinaadi's selected Tamil Thirukkanitham authority whether house 1 is included, and record the exact source. The current code comment says house 1 is included per that tradition; keep it unless the source says otherwise. Do not infer the answer from a generic “Tamil vs north Indian” distinction. Also record which references count (Lagna, Moon, Venus).
- **D4 Node:** mean or true — match the panchangam you validate against.
- **D5 Gaja Kesari:** from Moon only (common Tamil practice) or Lagna or Moon (BPHS)? See T4 for the strict/broad split.
- **D6 Lunar yogas:** do Rahu and Ketu count as grahas for Sunapha, Anapha, Durudhura and Kemadruma? Decide once; K1 applies it everywhere.
- **D7 Benefic classification:** keep the static `NATURAL_BENEFICS` set for now, or move to `is_benefic(planet, chart)` (Mercury by association, Moon by paksha/strength) as BPHS does? Not P0, but T5 depends on it.
- **D8 Each tightened detector (T1–T4, T7–T9):** the exact accepted formation and its source.

### Acceptance test

`test_sevvai_mode_changes_houses` once D3 is decided; `test_doctrine_version_recorded` on a computed chart.

---

## D2 — Decision: sunrise convention, chosen by measurement

**Source:** Codex (supersedes Claude's earlier “switch to Hindu rising” advice)

Drik Panchang documents that there is no consensus and lets users switch conventions; the difference at Tiruppur is ~3.5 minutes (≈ 9 vinaadi). Since the product is literally named Vinaadi, this must be a deliberate, tested choice.

**Procedure for the agent:**
1. Senthil picks the reference printed Tamil panchangam (Thirukkanitham).
2. Transcribe its sunrise times for 30 dates spread across one year for Chennai, Coimbatore and Madurai into `tests/golden/sunrise_reference.csv`.
3. Compute both conventions with E1's `convention` parameter; report mean absolute error per convention.
4. Set `Doctrine.sunrise` to the convention with the lower error; keep the CSV as a regression test with ±1 minute tolerance.

---

## G1 — Golden-chart regression suite

**Source:** Claude · **Files:** `tests/golden/charts.json`, `tests/test_golden_charts.py`

50 charts with answers confirmed by a trusted panchangam and a senior astrologer. Each entry:

```json
{
  "id": "g001",
  "birth_local": "1988-07-14T05:42:00", "tz": "Asia/Kolkata",
  "lat": 13.0827, "lon": 80.2707,
  "expected": {
    "lagna_rasi": 4, "moon_rasi": 9, "nakshatra": 20, "pada": 2,
    "sunrise_local": "06:01", "maha_at_birth": "VENUS", "maha_balance_years": 14.3,
    "yogas_present": ["GAJA_KESARI_YOGA"], "doshams_uncancelled": []
  }
}
```

Every fixture also carries provenance metadata (Codex):

```json
"meta": {
  "doctrine_version": "2026.10.1",
  "source_panchangam": "<name>",
  "source_edition": "<year / edition>",
  "reviewed_by": "<astrologer name>",
  "review_date": "2026-10-15",
  "birth_time_precision": "EXACT | ROUNDED_5MIN | APPROXIMATE"
}
```

Include boundary cases: lagna within 1° of a sign edge, Moon within 10′ of a nakshatra edge, births near sunrise, a southern-hemisphere birth, and high-latitude diaspora births (Toronto, Oslo — for long/short days, not polar day). The polar no-sunrise case stays in E1's unit test at 78°N (Longyearbyen latitude). Run on both swisseph backends. Tolerances: rasi/nakshatra exact; sunrise ±1 minute; dasha balance ±0.05 years. A fixture whose `doctrine_version` differs from the current one is reported, not silently compared.

---

## B1 — Prevalence regression report (diagnostic, not a gate)

**Source:** Claude (revised after Codex review) · **Files:** `scripts/base_rate_sim.py`, `tests/baselines/prevalence_<doctrine_version>.csv`, `tests/test_prevalence_regression.py` (marked `@pytest.mark.slow`)

### Why

Measured across 6,000 random births (1960–2010, Chennai, Lahiri) with the repo's current detectors:

| Yoga | Present in | | Dosham | Present & not cancelled |
|---|---|---|---|---|
| Raja | **85.0%** | | Rahu-Ketu | **66.6%** (never cancels) |
| Budha Aditya | 50.0% | | Putra Sarpa | 31.3% |
| Adhi | 48.8% | | Badhaka | 31.2% |
| Kemadruma | 45.4% | | Pitru | 29.5% |
| Anapha / Sunapha | 44.2% / 43.5% | | Sevvai | 27.7% (88.2% before cancellation) |
| Amala | 43.0% | | Kalathra | 19.3% |
| Dhana | 42.1% | | Kalasarpa | 15.1% |
| Vipareetha Raja | 41.2% | | | |
| Neecha Bhanga Raja | 38.4% | | | |
| Parivartana | 37.9% | | | |
| Gaja Kesari | 34.0% | | | |
| Daridra | 23.7% (24.4% STRONG) | | | |
| Pancha Mahapurusha (each) | 5.7–9.1% | | | |

Median chart: 7 yogas present, 4 labelled STRONG. **92%** of charts have ≥ 1 uncancelled dosham; **70%** have ≥ 2.

**How to read this.** A high rate is a reason to **check the implementation against the source**, nothing more. If the correctly implemented classical rule fires in 41% of charts, then 41% is correct. Several of the high rates above do trace to implementation errors (K1's contradictory exclusion sets, T7's retrograde trigger, T8's node-axis coverage, P1's default scores); others may simply be how common the formation is. Where a correct rule is common, the fix belongs in **presentation** (U1, SC1: show rarity, show only dasha-activated yogas), not in the rule.

### Fix

1. Commit the simulation as `scripts/base_rate_sim.py`: random UT instants over 1960–2010, fixed lat/lon, real ephemeris, `detect_yogas_and_doshams`, Mercury combust when < 14° from the Sun. Output prevalence per code to CSV.
2. Store a baseline per `Doctrine.version` in `tests/baselines/`.
3. `tests/test_prevalence_regression.py` (N = 2,000, seeded) **reports** each code's prevalence against the baseline and **fails only on unexplained change**: a relative change > 20% (e.g. 22% → 27%+) for any code whose detector was not touched in the PR, or for a touched detector without an updated baseline committed alongside it. There is **no absolute pass/fail cap**.
4. Each detector PR updates the baseline and pastes the before/after table into the PR description, with the doctrine source that justifies the change.
5. Expose `prevalence_pct` per code via the registry so the UI can say how common a pattern is (U1).

---

## T1–T9 — Detector corrections

**Source:** Claude + Codex (revised). Each item is its own PR. Every item says what is **implementation error** (fix now) and what is **DOCTRINE DECISION** (blocked until the rule and source are recorded under D8 in `docs/DOCTRINE.md`). Every changed detector fills `YogaSpec.school`, `source_ref` and `rule_version`. When Vinaadi keeps a broader or narrower rule than the classical one, it gets **its own code** — never the classical name.

### T1 — Raja Yoga · `detect_raja_yoga`, lines 888–918

**Implementation errors (fix now):**
- Strength is always `STRONG`; it should be graded by dignity, strength (`planet_scores`, P1) and dasha (Y2).
- `key_planets` must be the pair that formed the yoga (Y1).

**DOCTRINE DECISION (D8):** BPHS states that relationships between kendra and trikona lords produce yoga, and that if such a lord also owns an evil (dusthana) house, the bare relationship may not produce Raja Yoga. Implementing that correctly requires the **actual houses each planet rules**, not the single `FunctionalNature` label, which hides dual lordship.
- Add `planet_house_lordships(lagna_rasi) -> dict[str, frozenset[int]]` (e.g. for Mesham lagna, Mars → {1, 8}).
- Then encode the selected source's exact mixed-lordship rule (and whether the lagna lord pairs with kendra-only lords, and whether special aspects of Mars/Jupiter/Saturn count). Do **not** use `FunctionalNature.DUSTHANA` as a shortcut.
**Tests:** lordship table for all 12 lagnas; the exact source examples recorded under D8 as fixtures.

### T2 — Budha Aditya · lines 1126–1159

**Implementation decision (no doctrine change):** the formation is **Sun and Mercury in the same sign**. Combustion, dignity, house, functional role and benefic/malefic influence modify its **quality**; they do not create or remove the formation. (This replaces Claude's earlier proposal to add a kendra/trikona requirement, which has no source.)

**Fix:**
- `is_present = (sun_rasi == mercury_rasi)` — keep as today.
- Grade `strength`: `WEAK` when Mercury is deeply combust (degree threshold recorded in Doctrine), otherwise graded by Mercury and Sun dignity and `planet_scores`.
- Add `expression_state: Literal["CLEAR", "IMPAIRED"]` to `YogaResult` (default `"CLEAR"`; `"IMPAIRED"` when combust). Replace today's `PARTIAL`-means-combust shortcut with this field.
- Activation via Sun/Mercury dasha (Y2).
**Tests:** combust Mercury → present, `expression_state == "IMPAIRED"`, `strength == WEAK`.

### T3 — Adhi Yoga · lines 1419–1439

**Implementation errors (fix now):** grading uses only how many houses are occupied; BPHS ties results to the **strength of the participating planets**. Grade with `planet_scores`. `dasha_activated` fix is in Y2.

**DOCTRINE DECISION (D8):** whether one benefic in 6/7/8 from Moon forms the yoga or more are required, and whether a malefic co-occupant matters. Do not change the presence rule until the source is recorded.

### T4 — Gaja Kesari · lines 866–885

BPHS: Jupiter in a kendra from Lagna or Moon, conjunct or aspected by a benefic, and not debilitated, combust or in an inimical sign.

**Fix — two separate codes, never the same name for both:**
- `GAJA_KESARI_YOGA` — **strict**: all BPHS conditions met. Reference points from `Doctrine.gaja_kesari_from` (D5).
- `GAJA_KESARI_SUPPORT` (new code, `school="VINAADI"`) — Jupiter in a kendra from the Moon without the remaining conditions. Add effect copy that describes it as a supportive placement, not the full yoga.
- Today's detector output maps to `GAJA_KESARI_SUPPORT` until the strict check passes.
**Tests:** a chart meeting all strict conditions → `GAJA_KESARI_YOGA`; kendra-only → `GAJA_KESARI_SUPPORT`; debilitated Jupiter in Makaram → neither code is the strict yoga.

### T5 — Amala Yoga · lines 1398–1416 (ready)

**Wrong:** any natural benefic in the 10th from lagna or Moon counts. BPHS says the 10th should hold **exclusively** a benefic.
**Fix:** for each reference (lagna, Moon), present only if the 10th sign holds at least one benefic **and no malefic**. Remove `MOON` from the candidate list when the reference is the Moon. Use the benefic classification chosen in D7; until D7 is decided, use the existing static set and note it in `source_ref`.

### T6 — Lakshmi Yoga · lines 1463–1479 (ready)

**Wrong:** accepts the 9th lord in a kendra **or trikona** with score ≥ 60. BPHS: the 9th lord in a **kendra** and in its own, Moolatrikona or exaltation sign, with a strong lagna lord.
**Fix:** require kendra placement + dignity (`OWN_SIGN_RASI`, `MOOLATRIKONA_ZONE`, `EXALTATION_RASI` from `chart_strength`) + strong lagna lord (threshold recorded in Doctrine). Depends on P1 (real scores) and M1 (line 1466 fallback).

### T7 — Neecha Bhanga · lines 960–1026

**Implementation errors (fix now):**
- Rule 5 (“debilitated planet is retrograde”) counts toward `present = len(conditions) > 1`, so **retrograde alone** produces the yoga. Move retrograde to a context note; it never counts.
- Cancellation of debility and Neecha Bhanga **Raja** Yoga are different results. Split them: emit `NEECHA_BHANGA` (new code; add registry entry and effect copy) when a cancellation rule is met.

**DOCTRINE DECISION (D8):** which combinations elevate `NEECHA_BHANGA` to `NEECHA_BHANGA_RAJA_YOGA`. Encode each accepted classical formation separately with its source. Do **not** use a counting rule such as “two conditions = Raja” unless the source states it. Until D8 is recorded, emit only `NEECHA_BHANGA`.

### T8 — Rahu-Ketu dosham · lines 534–746

**Diagnosis (keep):** because the nodes are always opposite, testing {1, 2, 7, 8} plus {5, 9} for either node covers 8 of 12 node positions; and any 1–7 axis sets `strong_marriage_affliction`, which blocks cancellation entirely.

**Implementation errors (fix now):** the F1 marker fixes (`d9_seventh_lord_strong`, `rahu_ketu_upachaya`); separate the Sarpa/Naga (5/9) result from the marriage result so they are reported as two things.

**DOCTRINE DECISION (D8):** the presence houses, the cancellation rules and whether any configuration is non-cancellable. Tag the detector with whichever authority actually supports it (`school="TAMIL_POPULAR"` or the named source). Do not invent a new definition to move the prevalence.

### T9 — Daridra · lines 1442–1460, and `yoga_effects.py`

**Implementation errors (fix now):**
- `conditions_met` always lists **both** conditions even when only one is true (line 1455). List only the true one.
- The effect copy describes “a rare exchange between a difficult-house lord and a wealth-house lord”, which is a different rule from the code. Copy must describe what the code detects.

**Decision — choose one (D8):**
- **(a) Rename** the current heuristic to `INCOME_PRESSURE_INDICATOR` (`school="VINAADI"`), with copy that never calls it classical Daridra Yoga; or
- **(b) Implement** specific sourced BPHS poverty combinations under `DARIDRA_YOGA`, each with its source reference.
Recommendation: do (a) now and (b) later if wanted.

### Sevvai Kadagam/Simmam exception (DOCTRINE DECISION)

The exception (lines 401–404) cancels Sevvai for **every** chart with those lagnas — one-sixth of people — regardless of Mars's condition. Any additional condition (e.g. Mars unafflicted) is an extra rule: record it with its source under D3/D8 before adding it. Do not add it silently.

---

## K1 — Kemadruma / Sunapha / Anapha / Durudhura disagree with each other

**Source:** Claude + Codex · **Files:** `yogas.py:1361–1381`, `1482–1494`

### What is wrong

- Kemadruma checks the 2nd/12th from the Moon **excluding** Sun, Rahu and Ketu (line 1366).
- Sunapha/Anapha exclude **only** the Sun (lines 1485–1486), so Rahu or Ketu counts.
- So a chart with only Rahu in the 2nd from the Moon shows **Kemadruma** (“emotional isolation”) **and** **Sunapha** (“self-earned resources”) from the same empty house. This happens in **15.4%** of charts.
- Kemadruma's cancellation check (line 1368) counts **any** planet conjunct the Moon, including the Sun and nodes it excluded a line earlier.
- BPHS also cancels Kemadruma when planets occupy a kendra from lagna; that rule is missing.
- Sunapha/Anapha/Durudhura ship bare descriptions (`"Sunapha Yoga."`).

### Fix

```python
def _lunar_exclude(doctrine: Doctrine) -> frozenset[str]:
    # D6 decides whether RAHU/KETU are in this set; SUN and MOON always are (BPHS excludes the Sun).
    return frozenset({"SUN", "MOON"}) | doctrine.lunar_yoga_excluded_nodes

def _planets_in(planets: Mapping[str, int], rasi: int, doctrine: Doctrine) -> list[str]:
    exclude = _lunar_exclude(doctrine)
    return [p for p, r in planets.items() if r == rasi and p not in exclude]
```

Add `lunar_yoga_excluded_nodes: frozenset[str]` to `Doctrine` (D6; default `{"RAHU", "KETU"}`, matching today's Kemadruma). Use `_planets_in` for the 2nd, 12th and Moon's own sign in all four detectors, so one policy applies everywhere. Add the kendra-from-lagna cancellation to Kemadruma. Write proper `description_ta/en` for Sunapha, Anapha and Durudhura (mechanism only; the effect lives in `yoga_effects`).

### Acceptance test

`test_no_kemadruma_and_sunapha_together`: across 2,000 random charts, never both present.

---

## KS1 — Kala Sarpa from exact longitudes

**Source:** Codex · **File:** `yogas.py:1029–1062`

### What is wrong

Planets are reduced to rasi numbers. With `<= 6` on both arcs, a planet in the node's own sign counts on both sides, and a planet at 29°59′ next to a node at 0°01′ of the next sign can be misclassified. `chart_service` passes only rasis, so longitudes aren't available to the detector.

### Fix

1. Pass absolute longitudes (part of the typed `ChartFacts` input in A5; meanwhile an optional `longitudes: Mapping[str, float]` argument).
2. Algorithm:
   ```python
   arcs = [(lon[p] - lon["RAHU"]) % 360 for p in SEVEN_PLANETS]
   anuloma = all(0 < a < 180 for a in arcs)
   viloma  = all(180 < a < 360 for a in arcs)
   on_axis = [p for p, a in zip(SEVEN_PLANETS, arcs) if min(a, abs(a - 180), 360 - a) < doctrine.node_axis_epsilon_deg]
   ```
   `node_axis_epsilon_deg` lives in `Doctrine` (e.g. 0.0–1.0°). A planet within epsilon of the node axis is reported in `context_factors` as `planet_on_node_axis` and the result is labelled `KALA_SARPA_BOUNDARY` (school-sensitive) rather than silently counted in or out. Record the chosen epsilon and its source under D8.
3. Tag `school="VINAADI"` and note in the copy that Kala Sarpa is not recognised by all classical schools. **No silent fallback:** if longitudes are missing, return `is_present=False` with `label="INCOMPLETE_DATA"` and `missing_data=("longitudes",)`. The rasi-only result may be returned as `approximate_result` in the `ASTROLOGER` view only (U1), clearly marked approximate.

### Acceptance test

A synthetic chart with all planets at Rahu + 10°…170° → anuloma; Saturn moved to Rahu + 190° → not Kala Sarpa; Saturn at Rahu + 180.0° ± epsilon → `KALA_SARPA_BOUNDARY`; no longitudes → `INCOMPLETE_DATA`.

---

# P1 — Product and safety

## U1 — Presentation rules (engine stays complete; users see a safe view)

**Source:** Claude + Codex · **File:** new `app/services/presentation.py`, applied in `chart_service` before building API models

### What is wrong

- Names like **Daridra** (“poverty”) and **Chandala** reach users directly — Daridra is labelled STRONG for 24% of charts.
- Gender-weighted Sevvai and Rahu-Ketu markers (`female_high_attention_house` for houses 4/8/12; male for 2/7/8) raise severity differently by gender. This feeds a real marriage-market stigma.
- Nakshatra cautions (`yogas.py:1288–1292`) tell people born in Ayilyam, Kettai or Moolam about risks to in-laws or a first child — stigma from an immutable birth fact.
- `both_partners_have_sevvai` is presented as the dosham disappearing.
- Putra Sarpa (31% uncancelled) can be read as a fertility judgement.

### Fix

Add an `audience: Literal["USER", "ASTROLOGER"]` parameter (default `USER`; `ASTROLOGER` only for an explicit expert view).

In `USER` mode:

| Item | Rule |
|---|---|
| Yoga names with `user_facing=False` | show `display_name` instead of the classical name: `INCOME_PRESSURE_INDICATOR` (T9) → “Income-care pattern” / “வருமானக் கவனக் குறிப்பு”; Chandala → “Guidance-and-belief pattern”. Classical names stay in the `ASTROLOGER` view |
| Rarity | each shown yoga carries “about N% of people share this pattern” from B1's `prevalence_pct` |
| `*_high_attention_house` | drop from output entirely (`Doctrine.show_gender_weighting_to_users=False`) |
| Nakshatra cautions | move to a `traditional_considerations` list with this copy: “Some Tamil marriage traditions apply additional checks for this nakshatra. These vary by school and should not be used alone to accept or reject a match.” |
| `both_partners_have_sevvai` | label “Comparable Mars patterns in both charts reduce mismatch concern.” |
| Putra Sarpa | describe the 5th house as creativity, learning and children, never as the ability to have children; show only if dasha-activated and the user follows that area |
| Doshams in general | show only uncancelled **and** dasha- or transit-activated doshams on the home screen; the full list sits behind “See full chart analysis” |

### Acceptance test

`test_user_view_has_no_gender_markers`, `test_user_view_hides_classical_poverty_name`, `test_nakshatra_caution_moved`, `test_kala_sarpa_approximate_only_in_astrologer_view`.

---

## U2 — Safety gate for high-stakes questions

**Source:** Claude + Codex · **File:** the conversational / “Ask Vinaadi” service (find with `Select-String -Pattern "anthropic|openai|llm" -Path app\services\*.py`)

### What to build

1. **Classifier** (rules + LLM) tags each user question: `MEDICAL`, `FINANCIAL`, `LEGAL`, `FERTILITY`, `MAJOR_RELATIONSHIP` (marriage, divorce, breaking an engagement), `SELF_HARM_OR_CRISIS`, `GENERAL`.
   Age is handled separately from the topic, with **two different ages** (Codex): a saved chart may belong to the user's child, spouse, parent or a client, so its birth date says nothing about who is reading.
   - `viewer_age` — the **account holder's** age, from account data. Drives viewer safety.
   - `chart_subject_age` — the age of the person whose chart is being discussed. Drives subject-content policy.
2. **Rules by tag:**
   - `SELF_HARM_OR_CRISIS` → no astrology at all; respond with care and crisis resources (India: Tele-MANAS 14416).
   - `MEDICAL` / `LEGAL` / `FINANCIAL` / `FERTILITY` → astrology may describe timing only (“this period favours preparation”); never recommend for or against the act; always name the professional to consult (doctor, lawyer, financial adviser).
   - `MAJOR_RELATIONSHIP` → no verdict; offer a conversation guide; never cite a dosham as a reason to reject a person.
   - **Viewer under 18** (`viewer_age < 18`, or unknown account age with signals of a minor) → no dosham, marriage or fertility content for any chart; study-and-routine framing only.
   - **Chart subject under 18** (e.g. a parent viewing a child's chart) → never discuss the child's marriage prospects or fertility; doshams shown only as “traditional considerations” and never as predictions about the child; focus on learning, health routines and family support.
3. **Anti-dependency:** when the same worry is asked about 3+ times in 24 hours, suggest talking it through with a specific person (spouse, friend, mentor) rather than asking again.

### Acceptance tests

A table of 40 test prompts (5 per tag, plus cases for adult-viewing-child's-chart and minor-viewing-own-chart) with expected behaviours, run as an eval in CI.

---

## U3 — `yoga_effects.py`: tendencies, not personality facts

**Source:** Claude + Codex

### What is wrong

Several effects read as statements about the person: Gaja Kesari → “composure when a situation turns difficult”; Neecha Bhanga → “the area that felt like a handicap often becomes the one you are known for”; Anapha → “an even temperament”; Ruchaka → “physical vigour”; Kemadruma → “stretches of emotional isolation”.

### Fix

1. Rewrite those five (and review all) using the file's own rule: “classically linked to … ; it can show up as …” plus a reflection prompt. Example, Kemadruma: “Traditionally read as a call to build your support circle deliberately. Who are two people you could reconnect with this month?”
2. **Keep `yoga_effects.py` as the stable doctrine-to-modern-meaning layer: one meaning per code.** Do **not** add life-stage variants here (this replaces Claude's earlier proposal). A person is often several things at once — founder, parent, caregiver, student — and their question today may concern none of them; per-stage copy would turn this file into another horoscope-copy database. Personal relevance is produced by the guidance layer (A1/A7) from the user's actual situation.
3. Add the new codes from T2, T4, T7 and T9 (`GAJA_KESARI_SUPPORT`, `NEECHA_BHANGA`, `INCOME_PRESSURE_INDICATOR`) and keep the bidirectional coverage test (Y1).

---

## U4 — Native-Tamil review and remedy content corrections

**Source:** Claude · **Files:** `remedies.py`, `yoga_effects.py`, `prediction_score.py`, `yogas.py` description strings

Hand the following list to the Tamil reviewer and an astrologer together:

| Item | Today | Correction |
|---|---|---|
| Mercury vs Rahu `mantra_seed` | Both `ஓம் ப்ராம்` — Tamil script can't distinguish *brāṃ* (Budha) from *bhrāṃ* (Rahu) | Add `mantra_iast` (Latin transliteration) and an audio file per mantra |
| Mars vs Jupiter | `க்ராம்` vs `கிராம்` (*krāṃ* vs *grāṃ*); Jupiter's full mantra mixes `கிராம்`/`க்ரீம்`/`கிரௌம்` | Same fix; make the three syllables consistent |
| Venus, Saturn `mantra_full_ta` | Short popular forms; the other seven use the three-syllable beeja form | Pick one form for all nine (beeja: Venus *drāṃ*, Saturn *prāṃ*); offer the short form as “simple” |
| Rahu `day` / `fasting_rule` | “Rahu Kalam (daily)” / “Fast on the daily Rahu Kalam window” | Saturday as the planet day; Rahu Kalam Durgai worship as an option; no daily fast — confirm with the astrologer |
| Ketu `day` | Saturday | Confirm: Tuesday, or Vinayagar worship on Sankatahara Chathurthi |
| Venus `seva_en` | “…an underprivileged woman's marriage expenses” | Remove the marriage-expense wording; keep livelihood and education |
| `prediction_score` DIFFICULT | `காத்திரு` | `காத்திருங்கள்` (or the new SC1 copy) |
| `yoga_effects.py` | Marked first-draft Tamil in its own docstring | Full native review before release |

---

## U5 — Remedy ladder (behaviour first)

**Source:** Claude + Codex · **Files:** `remedies.py` (data model), `app/api/remedies.py`, UI

### Model

```python
@dataclass(frozen=True)
class RemedyStep:
    level: int                 # 1..5
    kind: Literal["HABIT", "PRACTICE", "SEVA", "DEVOTION", "TRADITIONAL"]
    title_ta: str; title_en: str
    detail_ta: str; detail_en: str
    minutes: int | None
    cost_band: Literal["FREE", "LOW", "MEDIUM"]   # LOW ≈ ₹100–500
    needs_location: bool
```

| Level | Kind | Example (Mars, difficult period) |
|---|---|---|
| 1 | HABIT (free, ≤ 2 min) | Wait 10 seconds before replying in an argument |
| 2 | PRACTICE (free, ~15 min) | 20 minutes of physical activity before a difficult conversation; mantra with audio, 108 counts |
| 3 | SEVA (time) | Help an accident victim or a hospital patient who cannot afford care; support emergency responders; volunteer at a hospital help desk. Blood donation appears only as “If you are medically eligible, consider voluntary blood donation” — never as the default (eligibility depends on age, weight, haemoglobin, health, medication and recent procedures) |
| 4 | DEVOTION | Murugan or Angaraka prayer on Tuesday, at the nearest temple with a Navagraha sannidhi; Vaitheeswaran Koil as the pilgrimage option; online archana for users abroad |
| 5 | TRADITIONAL | Fasting (with the existing caution text), daanam; gemstone reference only per R1 |

- The API returns the ladder ordered by level; the UI shows levels 1–2 by default and the rest behind “Explore traditional remedies”.
- Track completion of levels 1–2 per week (event table; reversible migration if new).

---

# P2 — The assistant layer

## A1 — Context engine, separate from the astrology engine

Store per user: life stage, occupation type, city, the 2–3 life areas they follow, and optionally calendar events and stated plans. The astrology engine never reads this. A guidance service combines engine output (band, drivers, active yogas from `YogaSpec`) with context. **The LLM only narrates a structured `GuidancePayload`, never raw chart data.** Checking yoga names is not enough: the model could still say “Saturn is damaging your career” without naming a yoga (Codex). So:

- Every fact the LLM may use carries an **evidence ID**: `ASTRO-001` (natal), `DASHA-004`, `TRANSIT-012`, `PANCH-002`, `CONTEXT-CLIENT-PAYMENT`, `WORLD-WEATHER-001` (A6).
  ```python
  @dataclass(frozen=True)
  class Evidence:
      id: str
      kind: Literal["ASTRO", "DASHA", "TRANSIT", "PANCHANGA", "CONTEXT", "WORLD"]
      claim_en: str
      claim_ta: str
      confidence: Literal["HIGH", "MEDIUM", "LOW"]
  @dataclass(frozen=True)
  class GuidancePayload:
      question: str
      evidence: list[Evidence]
      resolution: Resolution    # from A7
      safety_tags: list[str]    # from U2
  ```
- The LLM must return structured output where every substantive sentence lists the evidence IDs it rests on. A validator rejects any sentence that cites no ID, cites an unknown ID, or names a planet, yoga, dosham or transit absent from the payload, and regenerates once before falling back to a template.

## A2 — Classical → contemporary translation layer

A table per yoga/attribute mapping classical outcomes to present-day equivalents (royal favour → visibility, promotion, institutional recognition; wealth of cattle → productive assets; servants → team and support; victory over enemies → handling competition). Used by U3 copy and by the LLM prompt. Never translate “many sons” into a fertility claim.

## A3 — Morning home screen

Layout: one-line day summary; the user's followed areas as band chips; “Why” (dasha + Moon + relevant transit, from SC1 drivers); 2–3 actions and 1–2 cautions; Ask Vinaadi prompts. No yoga lists on the home screen.

## A4 — Feedback and outcome journal

“Was this useful?” on each card, plus an optional “What happened?” note per area per week. Use it **only** for product behaviour: tone, length, which areas the user cares about, which alerts are useful, and whether a suggested action helped. **Do not change astrological weights from this feedback** — “that felt accurate” is subject to confirmation bias, selective reporting and hindsight (Codex; this replaces Claude's earlier “calibrate SC1 weights” line). Any weight calibration is a separate research process on controlled historical or forward datasets with astrologer-approved labels, versioned through `Doctrine`.

## A5 — Cleanup

- `detect_yogas_and_doshams` accepts `bhava_chalit_map` and ignores it (line 1802). Either implement Bhava Chalit house checks or remove the parameter.
- `maha_lord_strength` — removed in SC1.
- `yogas.py:1825–1827` holds unused “retained scaffolding” variables with `noqa` — delete them.
- Replace `PlanetInput = int | Mapping[...]` with a typed `ChartFacts` dataclass (rasi, longitude, strength_score, is_combust, is_retrograde, d9_rasi) so M1, P1 and KS1 can't recur.

## A6 — Current-world context providers

**Source:** Codex. This is what makes Vinaadi aware of the user's surroundings, not just their chart.

Providers, each behind an interface so they can be added one at a time:

| Provider | Example use | Notes |
|---|---|---|
| Weather | “Rain likely during your 9 AM commute” | by user city |
| Calendar (opt-in) | “Appraisal meeting at 3 PM” | Google/Microsoft calendar connectors |
| Tamil calendar / festivals / local holidays | “Today is Pradosham; offices may close early for Deepavali” | already partly in `festivals.py` and `tamil_calendar.py` |
| Travel (opt-in) | “Your flight is delayed 40 minutes” | |
| Markets | only when the user asks about an investment | never volunteered; U2 financial rules apply |
| News | only when directly relevant to a stated plan | |
| Traffic | where available | |

Every external fact is stored as `WorldFact(id, kind, claim, source, retrieved_at, valid_until, location)` and enters the LLM only as an A1 `Evidence` item (`WORLD-…`). The astrology engine never fabricates or reads any of this. Expired facts (`now > valid_until`) are dropped before guidance is generated.

## A7 — Guidance conflict resolver

**Source:** Codex. Today, conflicting signals are blended inside one score. Make the hierarchy explicit and deterministic.

Example conflict: natal promise strong, Mahadasha supportive, Antardasha mixed, Saturn transit restrictive, today's Moon favourable, panchangam poor for the intended action.

```python
@dataclass(frozen=True)
class Resolution:
    horizon: Literal["LIFE", "PERIOD", "MONTH", "TODAY", "MOMENT"]
    overall: Literal["SUPPORTIVE", "MIXED", "CAREFUL"]
    primary_evidence: list[str]     # evidence IDs that decided the answer
    tempering_evidence: list[str]   # evidence IDs that qualify it
    template_key: str               # e.g. "BROAD_SUPPORTIVE_TODAY_PREPARE"
```

Rules:
- The **question's horizon** picks the hierarchy. A default order, from slowest to fastest: birth promise → dasha activation → varga confirmation → slow transits (Saturn, Jupiter, nodes) → fast transits / daily Moon → panchangam / muhurtham → real-world circumstances (A6).
- Slower layers set **whether** something is supported; faster layers set **how and when** to act today. A fast layer can temper but not reverse a slow layer's verdict, and vice versa for “today” questions.
- Real-world facts override timing on safety and practicality (a cyclone warning beats a good muhurtham).
- The hierarchy per life area and horizon is recorded in `Doctrine` and unit-tested with fixed fixtures, e.g. the example above → `overall="SUPPORTIVE"`, `template_key="BROAD_SUPPORTIVE_TODAY_PREPARE"` → “The broader career period is supportive, but today is better for preparation than confrontation.”

---

# Changelog — version 1 → version 2 (after Codex review)

| Item | Change |
|---|---|
| Ground rules | Added the doctrine rule: base rates are diagnostics, never a reason to change a formation; unsourced rules must be labelled `VINAADI` |
| E3 | Record `ephemeris_source_actual` (SWIEPH/MOSEPH) separately from the Python backend |
| SC1 B | Confidence split into calculation, doctrine and interpretation; UI shows the lowest |
| R1 | Removed the arbitrary “score ≥ 55 → no remedy” gate; remedies require an active concern and an afflicted driver, or a user request |
| D1 | D3 reworded to defer to Vinaadi's selected Thirukkanitham source; added D6 (nodes in lunar yogas), D7 (benefic classification), D8 (per-detector sources); new Doctrine fields |
| G1 | Fixtures carry provenance metadata; clarified that the polar test is at 78°N, not Toronto |
| B1 | Replaced the 30%/20% pass/fail caps with a per-doctrine-version prevalence regression report |
| T1 | Removed prevalence target; use actual house lordships, not `FunctionalNature`; rule is a DOCTRINE DECISION |
| T2 | Removed the invented kendra/trikona requirement; formation = conjunction; combustion grades quality via `expression_state` |
| T3 | Presence rule is a DOCTRINE DECISION; only strength grading changes now |
| T4 | Split strict `GAJA_KESARI_YOGA` from broad `GAJA_KESARI_SUPPORT` |
| T7 | Removed the “two conditions = Raja” rule; emit `NEECHA_BHANGA` until sourced elevation rules are recorded |
| T8, T9, Sevvai exception | Marked DOCTRINE DECISION; T9 recommends renaming to `INCOME_PRESSURE_INDICATOR` |
| K1 | Node policy comes from Doctrine (D6) |
| KS1 | No silent rasi fallback; documented boundary handling |
| U2 | Separate `viewer_age` from `chart_subject_age` |
| U3 | Dropped life-stage variants; contextualisation moves to A1/A7 |
| U5 | Blood donation is no longer the default Mars seva |
| A1 | LLM grounded on evidence IDs via a `GuidancePayload`, with a validator |
| A4 | Feedback never changes astrological weights |
| A6, A7 | Added current-world providers and a deterministic conflict resolver |

Not changed, with reason: Codex flagged the S1, Y2 and KS1 code snippets as collapsed onto single lines. In the file, each statement is on its own line; the collapse appears to be a rendering issue in the viewer used for review.

