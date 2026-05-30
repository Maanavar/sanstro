"""
What-If Simulator — Thirukanitham triple-confirmation engine.

Every prediction traces to three independent pillars:
  1. Natal Promise   — does the birth chart support this scenario?
  2. Dasha Timing    — is the current/target dasha lord aligned with this scenario?
  3. Gochar Support  — are the karaka planets transiting well on the target date?

Rules (agents.md / formula spec):
- Language is supportive and tendency-based, NEVER deterministic ("will happen").
- Sani periods framed as discipline, restructuring, and care — never as punishment.
- Health outputs are preventive only; mandatory disclaimer included.
- No fatalistic predictions; no death or major loss predictions.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import house_from_reference, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.dasha import DASHA_YEARS, calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.panchangam import calculate_daily_panchangam
from app.calculations.transits import classify_sani_cycle
from app.schemas.dasha import ResponseMeta
from app.schemas.whatif import (
    TripleConfirmation,
    WhatIfBiText,
    WhatIfData,
    WhatIfResponse,
)
from app.models import BirthProfile, Chart
from app.services.chart_service import load_persisted_chart_response

_CALC_VERSION = "jothidam-formula-engine-v1.0-2026"

# ── Strength labels ────────────────────────────────────────────────────────────

_STRONG    = "STRONG"
_MODERATE  = "MODERATE"
_WEAK      = "WEAK"

def _strength(score: int) -> str:
    if score >= 65:
        return _STRONG
    if score >= 45:
        return _MODERATE
    return _WEAK


# ── Karaka planets per scenario (mirrors life_areas_service._AREA_KARAKA) ─────

_SCENARIO_KARAKA: dict[str, list[str]] = {
    "job_change":      ["SATURN", "SUN"],        # 10th house lords
    "business_start":  ["SATURN", "MERCURY"],    # 10th and 3rd/7th
    "marriage":        ["VENUS", "JUPITER"],     # 7th house karaka
    "education":       ["MERCURY", "JUPITER"],   # 4th/5th karaka
    "property":        ["SATURN", "MARS"],       # 4th house karaka
    "health":          ["SUN", "MARS"],          # lagna/6th karaka
    "travel_abroad":   ["RAHU", "JUPITER"],      # 12th/9th karaka
    "spiritual":       ["JUPITER", "KETU"],      # 9th/12th karaka
    "family_harmony":  ["MOON", "JUPITER"],      # 4th karaka
    "money":           ["JUPITER", "VENUS"],     # 2nd/11th karaka
    "child_birth":     ["JUPITER", "MOON"],      # 5th house karaka
    "other":           ["JUPITER", "SUN"],       # generic benefics
}

# Natal house indicators per scenario (which natal house placement matters) ────
# List: (house_number, preferred_lords_present_check)
# We check whether the scenario's karaka planets are well-placed in natal chart.

_SCENARIO_NATAL_HOUSES: dict[str, list[int]] = {
    "job_change":      [10, 6, 2],
    "business_start":  [10, 7, 3],
    "marriage":        [7, 2, 11],
    "education":       [4, 5, 9],
    "property":        [4, 2, 12],
    "health":          [1, 6, 8],
    "travel_abroad":   [12, 9, 3],
    "spiritual":       [9, 12, 5],
    "family_harmony":  [4, 2, 7],
    "money":           [2, 11, 5],
    "child_birth":     [5, 2, 9],
    "other":           [9, 5, 1],
}

# Dasha lord affinity per scenario ─────────────────────────────────────────────

_DASHA_SCENARIO_SCORE: dict[str, dict[str, int]] = {
    "job_change": {
        "SUN": 72, "MOON": 50, "MARS": 65, "MERCURY": 62,
        "JUPITER": 65, "VENUS": 55, "SATURN": 68, "RAHU": 58, "KETU": 38,
    },
    "business_start": {
        "SUN": 65, "MOON": 50, "MARS": 60, "MERCURY": 72,
        "JUPITER": 68, "VENUS": 62, "SATURN": 58, "RAHU": 62, "KETU": 40,
    },
    "marriage": {
        "SUN": 48, "MOON": 65, "MARS": 52, "MERCURY": 58,
        "JUPITER": 70, "VENUS": 80, "SATURN": 42, "RAHU": 52, "KETU": 38,
    },
    "education": {
        "SUN": 60, "MOON": 55, "MARS": 48, "MERCURY": 80,
        "JUPITER": 78, "VENUS": 55, "SATURN": 48, "RAHU": 52, "KETU": 45,
    },
    "property": {
        "SUN": 55, "MOON": 62, "MARS": 65, "MERCURY": 55,
        "JUPITER": 68, "VENUS": 60, "SATURN": 62, "RAHU": 48, "KETU": 38,
    },
    "health": {
        "SUN": 70, "MOON": 58, "MARS": 62, "MERCURY": 55,
        "JUPITER": 65, "VENUS": 55, "SATURN": 45, "RAHU": 40, "KETU": 38,
    },
    "travel_abroad": {
        "SUN": 55, "MOON": 58, "MARS": 55, "MERCURY": 60,
        "JUPITER": 65, "VENUS": 60, "SATURN": 50, "RAHU": 72, "KETU": 48,
    },
    "spiritual": {
        "SUN": 65, "MOON": 62, "MARS": 50, "MERCURY": 55,
        "JUPITER": 80, "VENUS": 55, "SATURN": 65, "RAHU": 45, "KETU": 82,
    },
    "family_harmony": {
        "SUN": 55, "MOON": 75, "MARS": 50, "MERCURY": 58,
        "JUPITER": 72, "VENUS": 68, "SATURN": 45, "RAHU": 42, "KETU": 42,
    },
    "money": {
        "SUN": 55, "MOON": 58, "MARS": 52, "MERCURY": 72,
        "JUPITER": 70, "VENUS": 68, "SATURN": 50, "RAHU": 58, "KETU": 38,
    },
    "child_birth": {
        "SUN": 60, "MOON": 68, "MARS": 55, "MERCURY": 55,
        "JUPITER": 78, "VENUS": 65, "SATURN": 42, "RAHU": 48, "KETU": 42,
    },
    "other": {
        "SUN": 58, "MOON": 58, "MARS": 55, "MERCURY": 60,
        "JUPITER": 68, "VENUS": 60, "SATURN": 52, "RAHU": 52, "KETU": 45,
    },
}

# House transit scores for karaka planets (from Moon) ──────────────────────────

_JUPITER_HOUSE_SCORE = {
    1: 50, 2: 72, 3: 48, 4: 42, 5: 78, 6: 38,
    7: 74, 8: 25, 9: 82, 10: 58, 11: 80, 12: 34,
}
_SATURN_HOUSE_SCORE = {
    1: 42, 2: 40, 3: 62, 4: 34, 5: 52, 6: 64,
    7: 50, 8: 22, 9: 36, 10: 62, 11: 76, 12: 42,
}
_VENUS_HOUSE_SCORE = {
    1: 55, 2: 62, 3: 50, 4: 55, 5: 68, 6: 42,
    7: 65, 8: 30, 9: 60, 10: 50, 11: 68, 12: 38,
}
_MERCURY_HOUSE_SCORE = {
    1: 55, 2: 60, 3: 52, 4: 48, 5: 65, 6: 45,
    7: 58, 8: 30, 9: 62, 10: 55, 11: 65, 12: 36,
}
_MARS_HOUSE_SCORE = {
    1: 38, 2: 34, 3: 50, 4: 40, 5: 46, 6: 52,
    7: 42, 8: 28, 9: 48, 10: 44, 11: 50, 12: 32,
}
_MOON_HOUSE_SCORE = {
    1: 55, 2: 60, 3: 50, 4: 65, 5: 62, 6: 40,
    7: 55, 8: 28, 9: 68, 10: 52, 11: 65, 12: 35,
}
_SUN_HOUSE_SCORE = {
    1: 50, 2: 45, 3: 55, 4: 38, 5: 60, 6: 48,
    7: 40, 8: 28, 9: 65, 10: 58, 11: 55, 12: 32,
}
_RAHU_HOUSE_SCORE = {
    1: 42, 2: 38, 3: 55, 4: 35, 5: 45, 6: 58,
    7: 40, 8: 30, 9: 45, 10: 50, 11: 62, 12: 42,
}
_KETU_HOUSE_SCORE = {
    1: 45, 2: 35, 3: 50, 4: 38, 5: 52, 6: 55,
    7: 38, 8: 35, 9: 55, 10: 42, 11: 48, 12: 62,
}

_PLANET_HOUSE_SCORE: dict[str, dict[int, int]] = {
    "JUPITER": _JUPITER_HOUSE_SCORE,
    "SATURN":  _SATURN_HOUSE_SCORE,
    "VENUS":   _VENUS_HOUSE_SCORE,
    "MERCURY": _MERCURY_HOUSE_SCORE,
    "MARS":    _MARS_HOUSE_SCORE,
    "MOON":    _MOON_HOUSE_SCORE,
    "SUN":     _SUN_HOUSE_SCORE,
    "RAHU":    _RAHU_HOUSE_SCORE,
    "KETU":    _KETU_HOUSE_SCORE,
}

# Tamil planet names ───────────────────────────────────────────────────────────

_PLANET_TA = {
    "SUN": "சூரியன்", "MOON": "சந்திரன்", "MARS": "செவ்வாய்",
    "MERCURY": "புதன்", "JUPITER": "குரு", "VENUS": "சுக்கிரன்",
    "SATURN": "சனி", "RAHU": "ராகு", "KETU": "கேது",
}
_PLANET_EN = {
    "SUN": "Suryan (Sun)", "MOON": "Chandran (Moon)", "MARS": "Chevvai (Mars)",
    "MERCURY": "Budhan (Mercury)", "JUPITER": "Guru (Jupiter)",
    "VENUS": "Sukran (Venus)", "SATURN": "Sani (Saturn)",
    "RAHU": "Rahu", "KETU": "Ketu",
}

# Scenario display names ───────────────────────────────────────────────────────

_SCENARIO_LABEL_TA = {
    "job_change":      "வேலை மாற்றம்",
    "business_start":  "தொழில் தொடக்கம்",
    "marriage":        "திருமணம்",
    "education":       "கல்வி",
    "property":        "சொத்து",
    "health":          "உடல்நலம்",
    "travel_abroad":   "வெளிநாடு பயணம்",
    "spiritual":       "ஆன்மீகம்",
    "family_harmony":  "குடும்ப நலம்",
    "money":           "பணம் / செல்வம்",
    "child_birth":     "குழந்தை பாக்கியம்",
    "other":           "பொது",
}
_SCENARIO_LABEL_EN = {
    "job_change":      "Job Change",
    "business_start":  "Starting a Business",
    "marriage":        "Marriage",
    "education":       "Education",
    "property":        "Property",
    "health":          "Health",
    "travel_abroad":   "Travel Abroad",
    "spiritual":       "Spiritual Growth",
    "family_harmony":  "Family Harmony",
    "money":           "Money / Wealth",
    "child_birth":     "Child Birth",
    "other":           "General",
}


# ── Natal promise assessment ───────────────────────────────────────────────────

@dataclass
class _NatalAssessment:
    score: int
    text_ta: str
    text_en: str


def _assess_natal_promise(
    scenario: str,
    natal_planets: list,  # PlanetPosition objects from chart snapshot
    natal_lagna_rasi: int,
) -> _NatalAssessment:
    """
    Check natal chart support for the scenario.
    Uses whole-sign house positions (Thirukanitham standard).
    Checks how many of the scenario's karaka planets are in supportive houses.
    """
    karakas = _SCENARIO_KARAKA[scenario]
    key_houses = _SCENARIO_NATAL_HOUSES[scenario]

    # Build a rasi→planet lookup
    planet_rasi: dict[str, int] = {p.graha: p.rasi for p in natal_planets}

    # Favourable houses from lagna (whole-sign)
    favourable_from_lagna = {1, 2, 4, 5, 7, 9, 10, 11}

    karaka_scores: list[int] = []
    for k in karakas:
        if k not in planet_rasi:
            karaka_scores.append(50)
            continue
        natal_house = house_from_reference(natal_lagna_rasi, planet_rasi[k])
        # Base score from house quality
        base = 65 if natal_house in favourable_from_lagna else 38
        # Bonus if in one of the scenario's key houses
        bonus = 12 if natal_house in key_houses else 0
        karaka_scores.append(min(90, base + bonus))

    score = round(sum(karaka_scores) / len(karaka_scores)) if karaka_scores else 50

    primary = karakas[0]
    prim_rasi = planet_rasi.get(primary)
    prim_house = house_from_reference(natal_lagna_rasi, prim_rasi) if prim_rasi else None

    ta_prim = _PLANET_TA[primary]
    en_prim = _PLANET_EN[primary]
    scenario_ta = _SCENARIO_LABEL_TA[scenario]
    scenario_en = _SCENARIO_LABEL_EN[scenario]

    if score >= 65:
        text_ta = (
            f"ஜாதகத்தில் {scenario_ta}க்கு ஆதரவு உள்ளது. "
            f"{ta_prim} {prim_house}ஆம் இடத்தில் சாதகமாக உள்ளது." if prim_house else
            f"ஜாதகத்தில் {scenario_ta}க்கு ஆதரவு உள்ளது. கராக கிரக நிலை நல்லது."
        )
        text_en = (
            f"Natal chart shows support for {scenario_en}. "
            f"{en_prim} in house {prim_house} is favourably placed." if prim_house else
            f"Natal chart shows support for {scenario_en}. Karaka placement is good."
        )
    elif score >= 45:
        text_ta = (
            f"ஜாதகத்தில் {scenario_ta}க்கு நடுநிலை ஆதரவு உள்ளது. "
            f"முயற்சியும் கூடுதல் விழிப்புணர்வும் தேவை."
        )
        text_en = (
            f"Natal chart shows moderate support for {scenario_en}. "
            f"Effort and additional awareness are needed."
        )
    else:
        text_ta = (
            f"ஜாதகத்தில் {scenario_ta}க்கு சவால்கள் காணப்படுகின்றன. "
            f"சரியான நேரத்தில் முயற்சிப்பது முக்கியம்."
        )
        text_en = (
            f"Natal chart shows challenges around {scenario_en}. "
            f"Timing and preparation are especially important."
        )

    return _NatalAssessment(score=score, text_ta=text_ta, text_en=text_en)


# ── Dasha support assessment ───────────────────────────────────────────────────

@dataclass
class _DashaAssessment:
    score: int
    maha_lord: str
    antar_lord: str
    text_ta: str
    text_en: str


def _assess_dasha_support(
    scenario: str,
    timeline,
    target_jd: float,
) -> _DashaAssessment:
    """
    Assess dasha lord alignment for the scenario at the target date.
    Uses both mahadasha and antardasha lords.
    """
    # Find which dasha period contains the target JD
    maha = timeline.current_mahadasha
    antar = timeline.current_antardasha

    # Override with target-date dasha if we can scan mahadashas
    for m in timeline.mahadashas:
        if m.start_jd <= target_jd < m.end_jd:
            maha = m
            break

    maha_lord = maha.lord
    antar_lord = antar.lord

    maha_score = _DASHA_SCENARIO_SCORE[scenario].get(maha_lord, 52)
    antar_score = _DASHA_SCENARIO_SCORE[scenario].get(antar_lord, 52)

    # Blend: 60% maha, 40% antar
    score = round(maha_score * 0.60 + antar_score * 0.40)

    ta_maha = _PLANET_TA[maha_lord]
    en_maha = _PLANET_EN[maha_lord]
    ta_antar = _PLANET_TA[antar_lord]
    en_antar = _PLANET_EN[antar_lord]
    scenario_ta = _SCENARIO_LABEL_TA[scenario]
    scenario_en = _SCENARIO_LABEL_EN[scenario]

    if score >= 65:
        text_ta = (
            f"{ta_maha} மஹாதசையும் {ta_antar} அந்தர்தசையும் {scenario_ta}க்கு "
            f"நல்ல ஆதரவு அளிக்கின்றன."
        )
        text_en = (
            f"{en_maha} Mahadasha and {en_antar} Antardasha provide strong support "
            f"for {scenario_en}."
        )
    elif score >= 45:
        text_ta = (
            f"{ta_maha} மஹாதசையில் {scenario_ta}க்கு நடுநிலை ஆதரவு உள்ளது. "
            f"{ta_antar} அந்தர்தசை கவனமான செயல்பாட்டை ஊக்குவிக்கிறது."
        )
        text_en = (
            f"{en_maha} Mahadasha offers moderate support for {scenario_en}. "
            f"{en_antar} Antardasha encourages careful action."
        )
    else:
        text_ta = (
            f"{ta_maha} மஹாதசையில் {scenario_ta}க்கு தசை ஆதரவு குறைவாக உள்ளது. "
            f"இதை சவாலாக அல்ல, பக்குவமான தயாரிப்பு காலமாக பார்க்கவும்."
        )
        text_en = (
            f"Dasha support for {scenario_en} is lower in {en_maha} Mahadasha. "
            f"View this as a preparation period rather than a setback."
        )

    return _DashaAssessment(
        score=score, maha_lord=maha_lord, antar_lord=antar_lord,
        text_ta=text_ta, text_en=text_en,
    )


# ── Gochar (transit) support assessment ───────────────────────────────────────

@dataclass
class _GocharAssessment:
    score: int
    primary_karaka: str
    house_from_moon: int
    text_ta: str
    text_en: str


def _assess_gochar_support(
    scenario: str,
    natal_moon_rasi: int,
    transit_bodies: dict,
    sani_cycle_active: bool,
    sani_cycle_type: str | None,
) -> _GocharAssessment:
    """
    Assess gochar (transit) support at the target date.
    Primary karaka transit from natal Moon is the main signal.
    """
    karakas = _SCENARIO_KARAKA[scenario]
    primary = karakas[0]

    if primary in transit_bodies and primary in _PLANET_HOUSE_SCORE:
        h = house_from_reference(natal_moon_rasi, transit_bodies[primary].rasi)
        primary_score = _PLANET_HOUSE_SCORE[primary][h]
    else:
        h = 1
        primary_score = 50

    # Secondary karaka blend (30%)
    if len(karakas) > 1:
        sec = karakas[1]
        if sec in transit_bodies and sec in _PLANET_HOUSE_SCORE:
            h2 = house_from_reference(natal_moon_rasi, transit_bodies[sec].rasi)
            sec_score = _PLANET_HOUSE_SCORE[sec][h2]
            primary_score = round(primary_score * 0.70 + sec_score * 0.30)

    score = primary_score

    # Sani cycle penalty for effort-heavy scenarios
    if sani_cycle_active and scenario in ("job_change", "business_start", "property", "marriage"):
        if sani_cycle_type == "ASHTAMA_SANI":
            score = max(score - 12, 0)
        elif sani_cycle_type in ("JANMA_SANI", "EZHARAI_SANI_PHASE_1", "EZHARAI_SANI_PHASE_3", "ARDHASHTAMA_SANI"):
            score = max(score - 8, 0)

    ta_prim = _PLANET_TA[primary]
    en_prim = _PLANET_EN[primary]
    scenario_ta = _SCENARIO_LABEL_TA[scenario]
    scenario_en = _SCENARIO_LABEL_EN[scenario]

    if score >= 65:
        text_ta = (
            f"கோசர நிலை சாதகமாக உள்ளது. {ta_prim} {h}ஆம் இடத்தில் கோசரிக்கிறது — "
            f"{scenario_ta}க்கு கிரக ஆதரவு நல்லது."
        )
        text_en = (
            f"Transit position is favourable. {en_prim} transiting house {h} — "
            f"planetary support for {scenario_en} is good."
        )
    elif score >= 45:
        text_ta = (
            f"கோசர நிலை நடுநிலையாக உள்ளது. {ta_prim} {h}ஆம் இடத்தில் உள்ளது. "
            f"நல்ல கிரக நிலையை எதிர்பார்த்து திட்டமிடலாம்."
        )
        text_en = (
            f"Transit position is neutral. {en_prim} is in house {h}. "
            f"Planning ahead for a better transit window is advised."
        )
    else:
        sani_note_ta = (
            f" {sani_cycle_type.replace('_', ' ')} நடப்பில் உள்ளது — கவனமான நடவடிக்கை தேவை."
            if sani_cycle_active and sani_cycle_type else ""
        )
        sani_note_en = (
            f" {sani_cycle_type.replace('_', ' ')} is active — careful action is needed."
            if sani_cycle_active and sani_cycle_type else ""
        )
        text_ta = (
            f"கோசர நிலை சவாலானது. {ta_prim} {h}ஆம் இடத்தில் உள்ளது.{sani_note_ta} "
            f"சரியான கிரக நிலைக்காக காத்திருப்பது நல்லது."
        )
        text_en = (
            f"Transit position is challenging. {en_prim} is in house {h}.{sani_note_en} "
            f"Waiting for a better planetary window is advisable."
        )

    return _GocharAssessment(
        score=score, primary_karaka=primary, house_from_moon=h,
        text_ta=text_ta, text_en=text_en,
    )


# ── Panchangam quality score for a given date ─────────────────────────────────

_CAUTION_YOGAS = {1, 6, 9, 10, 17, 27}
_AUSPICIOUS_NAKSHATRAS = {1, 4, 5, 7, 8, 13, 14, 15, 17, 22, 27}
_SIGN_LORDS = {
    1: "MARS", 2: "VENUS", 3: "MERCURY", 4: "MOON", 5: "SUN", 6: "MERCURY",
    7: "VENUS", 8: "MARS", 9: "JUPITER", 10: "SATURN", 11: "SATURN", 12: "JUPITER",
}


def _compute_panchangam_score(
    target_date: date,
    latitude: float,
    longitude: float,
    timezone_str: str,
    natal_lagna_rasi: int,
    maha_lord: str,
) -> int:
    """Compute a 0-100 panchangam quality score for target_date.
    Uses the same logic as daily_guidance_service panchangam_score section.
    Returns 70 (neutral) if panchangam cannot be computed.
    """
    try:
        panchang = calculate_daily_panchangam(target_date, latitude, longitude, timezone_str)
    except Exception:
        return 70

    score = 70
    if panchang.tithi_number in {4, 9, 14, 19, 24, 29}:
        score -= 15
    if panchang.tithi_number in {8, 23}:
        score -= 10
    if panchang.yoga_number in _CAUTION_YOGAS:
        score -= 10
    if panchang.karana_name == "VISHTI":
        score -= 10
    lagna_lord = _SIGN_LORDS.get(natal_lagna_rasi)
    if lagna_lord and panchang.weekday_lord == lagna_lord:
        score += 8
    if panchang.weekday_lord == maha_lord:
        score += 5
    if panchang.nakshatra_number in _AUSPICIOUS_NAKSHATRAS:
        score += 8
    return max(0, min(100, score))


# ── Combined verdict and narrative ────────────────────────────────────────────

def _overall_verdict(
    natal_score: int, dasha_score: int, gochar_score: int, panchangam_score: int = 70
) -> tuple[int, str]:
    # Four-pillar formula: natal + dasha + gochar + panchangam
    overall = round(
        natal_score * 0.25
        + dasha_score * 0.35
        + gochar_score * 0.25
        + panchangam_score * 0.15
    )
    if overall >= 62 and natal_score >= 50 and dasha_score >= 50 and gochar_score >= 50:
        verdict = "FAVOURABLE"
    elif overall >= 45:
        verdict = "NEUTRAL"
    else:
        verdict = "CAUTION"
    return overall, verdict


def _build_summary(
    scenario: str,
    verdict: str,
    overall_score: int,
    natal: _NatalAssessment,
    dasha: _DashaAssessment,
    gochar: _GocharAssessment,
    target_date: date,
    sani_cycle_active: bool,
    sani_cycle_type: str | None,
) -> tuple[WhatIfBiText, WhatIfBiText, WhatIfBiText, WhatIfBiText, WhatIfBiText]:
    """Returns (summary, best_period, caution_note, remedy, disclaimer)."""

    scenario_ta = _SCENARIO_LABEL_TA[scenario]
    scenario_en = _SCENARIO_LABEL_EN[scenario]
    ta_maha = _PLANET_TA[dasha.maha_lord]
    en_maha = _PLANET_EN[dasha.maha_lord]

    target_str_en = target_date.strftime("%d %B %Y")
    target_str_ta = target_date.strftime("%d-%m-%Y")

    # ── Summary ──
    if verdict == "FAVOURABLE":
        summary_ta = (
            f"{target_str_ta} தேதிக்கு {scenario_ta} பற்றிய ஆய்வு: "
            f"மூன்று தூண்களும் ({overall_score}/100) சாதகமாக உள்ளன. "
            f"{ta_maha} தசை, கோசர கிரக நிலை, மற்றும் ஜாதக வாக்கு ஒருங்கிணைந்து ஆதரவளிக்கின்றன. "
            f"இது ஒரு சாதகமான காலகட்டமாக தெரிகிறது."
        )
        summary_en = (
            f"Analysis for {scenario_en} around {target_str_en}: "
            f"All three pillars ({overall_score}/100) are aligned favourably. "
            f"{en_maha} dasha, transit positions, and natal promise converge in support. "
            f"This appears to be a favourable period for this intent."
        )
    elif verdict == "NEUTRAL":
        summary_ta = (
            f"{target_str_ta} தேதிக்கு {scenario_ta} பற்றிய ஆய்வு: "
            f"நடுநிலை ஆதரவு உள்ளது ({overall_score}/100). "
            f"சில தூண்கள் ஆதரவளிக்கின்றன, சில கவனம் தேவைப்படுகின்றன. "
            f"கவனமான திட்டமிடலுடன் முன்னேறலாம்."
        )
        summary_en = (
            f"Analysis for {scenario_en} around {target_str_en}: "
            f"Moderate support is present ({overall_score}/100). "
            f"Some pillars are supportive while others call for attention. "
            f"Careful planning can help you move forward."
        )
    else:
        summary_ta = (
            f"{target_str_ta} தேதிக்கு {scenario_ta} பற்றிய ஆய்வு: "
            f"கவன நிலை ({overall_score}/100). "
            f"இந்த காலகட்டத்தில் முக்கிய நடவடிக்கைகளை ஒத்திவைப்பது கருத்தில் கொள்ளலாம். "
            f"சரியான கிரக நிலைக்காக காத்திருப்பது நல்லது."
        )
        summary_en = (
            f"Analysis for {scenario_en} around {target_str_en}: "
            f"Caution is indicated ({overall_score}/100). "
            f"Consider postponing major steps during this period. "
            f"Waiting for a more supportive planetary window is advisable."
        )

    # ── Best period in window ──
    best_period_ta = (
        f"{ta_maha} மஹாதசை காலத்தில் கோசர கிரகங்கள் சாதகமாக நிற்கும் போது "
        f"(குரு 2, 5, 9, 11ஆம் இடங்களில்) {scenario_ta}க்கு முயற்சிக்கலாம். "
        f"பஞ்சாங்க சுப தினங்களில் புதிய தொடக்கம் நல்லது."
    )
    best_period_en = (
        f"Within {en_maha} Mahadasha, attempt {scenario_en} when transit planets are favourable "
        f"(especially Jupiter in houses 2, 5, 9, 11). "
        f"Begin on auspicious Panchangam days for best results."
    )

    # ── Caution note ──
    if sani_cycle_active and sani_cycle_type:
        sani_label = sani_cycle_type.replace("_", " ").title()
        caution_ta = (
            f"{sani_label} நடப்பில் உள்ளது — சனி இந்த காலகட்டத்தை ஒழுக்கமும் "
            f"மறுசீரமைப்பும் காலமாக ஆக்குகிறார். "
            f"முக்கிய {scenario_ta} நடவடிக்கைகளில் பொறுமையோடு செயல்படவும்."
        )
        caution_en = (
            f"{sani_label} is active — Sani is shaping this as a period of discipline "
            f"and restructuring. "
            f"Proceed with patience on major {scenario_en} steps."
        )
    elif gochar.score < 50:
        caution_ta = (
            f"கோசர கிரக நிலை இப்போது சவாலானது. "
            f"முக்கிய {scenario_ta} முடிவுகளை சாதகமான கோசர நிலையில் எடுக்கவும்."
        )
        caution_en = (
            f"Transit position is currently challenging. "
            f"Take major {scenario_en} decisions when transits are more supportive."
        )
    else:
        caution_ta = (
            f"பஞ்சாங்கம் சரிபார்த்து, சந்திராஷ்டமம் தினங்களில் "
            f"முக்கிய {scenario_ta} நடவடிக்கைகளை தவிர்க்கவும்."
        )
        caution_en = (
            f"Check Panchangam and avoid Chandrashtamam days "
            f"for key {scenario_en} steps."
        )

    # ── Remedy (Tamil temple tradition) ──
    remedies = {
        "job_change":      ("வியாழக்கிழமை தட்சிணாமூர்த்தி வழிபாடு. சனிக்கிழமை சனீஸ்வரன் வழிபாடு.",
                            "Dakshinamurthy worship on Thursdays. Saneeswaran worship on Saturdays."),
        "business_start":  ("வியாழக்கிழமை தட்சிணாமூர்த்தி மற்றும் புதன்கிழமை புதன் வழிபாடு.",
                            "Dakshinamurthy on Thursdays and Mercury worship on Wednesdays."),
        "marriage":        ("வெள்ளிக்கிழமை மகாலட்சுமி வழிபாடு. வெள்ளை மலர் சமர்ப்பிக்கவும்.",
                            "Mahalakshmi worship on Fridays. Offer white flowers."),
        "education":       ("வியாழக்கிழமை சரஸ்வதி மற்றும் தட்சிணாமூர்த்தி வழிபாடு.",
                            "Saraswati and Dakshinamurthy worship on Thursdays."),
        "property":        ("சனிக்கிழமை சனீஸ்வரன் வழிபாடு. எள் எண்ணெய் விளக்கு ஏற்றுங்கள்.",
                            "Saneeswaran worship on Saturdays. Light sesame oil lamps."),
        "health":          ("ஞாயிற்றுக்கிழமை சூரிய வழிபாடு. யோகா மற்றும் தியானம் தொடரவும்.",
                            "Sun worship on Sundays. Continue yoga and meditation."),
        "travel_abroad":   ("வியாழக்கிழமை பெருமாள் வழிபாடு. பயணத்திற்கு முன் குரு ஆசி பெறவும்.",
                            "Perumal worship on Thursdays. Seek Guru's blessings before travel."),
        "spiritual":       ("வியாழக்கிழமை குரு வழிபாடு. தினமும் திருவாசகம் அல்லது கீதை படிக்கவும்.",
                            "Guru worship on Thursdays. Read Thiruvasagam or Gita daily."),
        "family_harmony":  ("திங்கட்கிழமை அம்மன் வழிபாடு. குடும்பத்துடன் பஜனை.",
                            "Amman worship on Mondays. Bhajans with family."),
        "money":           ("வெள்ளிக்கிழமை மகாலட்சுமி வழிபாடு. தான தர்மம் செய்யுங்கள்.",
                            "Mahalakshmi worship on Fridays. Practice charity."),
        "child_birth":     ("வியாழக்கிழமை குரு வழிபாடு. மஞ்சள் தானம் நல்லது.",
                            "Guru worship on Thursdays. Donating yellow items is auspicious."),
        "other":           ("வழக்கமான குல தெய்வ வழிபாட்டை தொடரவும்.",
                            "Continue regular Kula Deivam worship."),
    }
    remedy_ta, remedy_en = remedies.get(scenario, remedies["other"])

    # ── Disclaimer (always present per agents.md) ──
    disclaimer_ta = (
        "இந்த பகுப்பாய்வு தோட்டா அடிப்படையில் உள்ளது — 'நடக்கும்' என்று அல்ல, "
        "'சாத்தியமான காலம்' என்று பாருங்கள். "
        "ஜோதிடம் ஒரு வழிகாட்டுதல் கருவி; இறுதி முடிவு உங்களுடையது. "
        "உடல்நல கேள்விகளுக்கு தகுதிவாய்ந்த மருத்துவரை கலந்தாலோசிக்கவும்."
    )
    disclaimer_en = (
        "This analysis is tendency-based — read it as a 'possible window', not a certainty. "
        "Astrology is a guidance tool; the final decision is always yours. "
        "For health matters, please consult a qualified medical professional."
    )

    return (
        WhatIfBiText(ta=summary_ta, en=summary_en),
        WhatIfBiText(ta=best_period_ta, en=best_period_en),
        WhatIfBiText(ta=caution_ta, en=caution_en),
        WhatIfBiText(ta=remedy_ta, en=remedy_en),
        WhatIfBiText(ta=disclaimer_ta, en=disclaimer_en),
    )


# ── Public service function ────────────────────────────────────────────────────

def _assert_chart_owner(session: Session, chart_id: UUID, owner_user_id: UUID) -> None:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def evaluate_whatif(
    session: Session,
    owner_user_id: UUID,
    chart_id: UUID,
    scenario: str,
    target_date: date,
) -> WhatIfResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    birth_profile = chart_snapshot.data.birth_profile

    # Resolve Julian days
    tz = resolve_timezone(birth_profile.birth_timezone)
    local_noon = datetime.combine(target_date, time(12, 0), tzinfo=tz)
    target_jd = utc_datetime_to_julian_day(local_noon.astimezone(UTC))
    birth_jd = chart_snapshot.data.julian_day

    # Natal reference points
    natal_moon = next(p for p in chart_snapshot.data.planets if p.graha == "MOON")
    natal_lagna_rasi = chart_snapshot.data.lagna.rasi

    # Transit at target date
    transit = calculate_sidereal_planets(target_jd)
    transit_bodies = transit.bodies

    # Dasha timeline
    timeline = calculate_vimshottari_timeline(birth_jd, natal_moon.absolute_longitude, target_jd)

    # Sani cycle at target date
    saturn_transit = transit_bodies.get("SATURN")
    if saturn_transit:
        saturn_house = house_from_reference(natal_moon.rasi, saturn_transit.rasi)
        sani_cycle = classify_sani_cycle(saturn_house)
    else:
        from dataclasses import dataclass as _dc
        sani_cycle_active = False
        sani_cycle_type = None

        class _FakeCycle:
            is_active = False
            type = None
        sani_cycle = _FakeCycle()

    # ── Triple confirmation ──
    natal = _assess_natal_promise(scenario, chart_snapshot.data.planets, natal_lagna_rasi)
    dasha = _assess_dasha_support(scenario, timeline, target_jd)
    gochar = _assess_gochar_support(
        scenario,
        natal_moon.rasi,
        transit_bodies,
        sani_cycle.is_active,
        sani_cycle.type if sani_cycle.is_active else None,
    )

    # Panchangam quality for target date (uses birth location as proxy for local panchangam)
    panchang_score = _compute_panchangam_score(
        target_date,
        float(birth_profile.birth_latitude or 13.0),
        float(birth_profile.birth_longitude or 80.0),
        birth_profile.birth_timezone,
        natal_lagna_rasi,
        timeline.current_mahadasha.lord,
    )

    overall_score, verdict = _overall_verdict(natal.score, dasha.score, gochar.score, panchang_score)

    summary, best_period, caution_note, remedy, disclaimer = _build_summary(
        scenario, verdict, overall_score,
        natal, dasha, gochar,
        target_date,
        sani_cycle.is_active,
        sani_cycle.type if sani_cycle.is_active else None,
    )

    triple = TripleConfirmation(
        natalPromise=natal.text_en,
        natalPromiseStrength=_strength(natal.score),
        dashaSupport=dasha.text_en,
        dashaSupportStrength=_strength(dasha.score),
        gocharSupport=gochar.text_en,
        gocharSupportStrength=_strength(gochar.score),
        panchangamQuality=_strength(panchang_score),
        overallVerdict=verdict,
    )

    data = WhatIfData(
        chartId=chart_id,
        scenario=scenario,
        targetDate=target_date,
        overallScore=overall_score,
        verdict=verdict,
        tripleConfirmation=triple,
        summary=summary,
        bestPeriodInWindow=best_period,
        cautionNote=caution_note,
        remedy=remedy,
        disclaimer=disclaimer,
    )

    return WhatIfResponse(
        data=data,
        meta=ResponseMeta(
            calculation_version=_CALC_VERSION,
            generated_at=datetime.now(tz=UTC),
        ),
    )
