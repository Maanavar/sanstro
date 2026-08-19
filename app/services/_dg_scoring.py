"""Scoring constants and math helpers for the daily guidance engine.

All functions here are pure (or close to it): they take values and return values.
No DB session, no HTTP exceptions except _birth_datetime_utc which validates input.
"""
from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.calculations.ashtakavarga import get_av_bindu
from app.calculations.astro import house_from_reference, local_datetime_to_utc
from app.calculations.chart_strength import (
    _NATURAL_ENEMIES,
    _NATURAL_FRIENDS,
    compute_natal_planet_score,
)
from app.models import BirthProfile
from app.services.narrative_engine import PLANET_NAME

SIGN_LORDS: dict[int, str] = {
    1: "MARS",
    2: "VENUS",
    3: "MERCURY",
    4: "MOON",
    5: "SUN",
    6: "MERCURY",
    7: "VENUS",
    8: "MARS",
    9: "JUPITER",
    10: "SATURN",
    11: "SATURN",
    12: "JUPITER",
}

# Nakshatras traditionally considered auspicious for daily activity in Tamil Jyothidam.
# Sources: Ashwini(1), Rohini(4), Mirugaseeridam(5), Punarpoosam(7), Poosam(8),
# Hastham(13), Chithirai(14), Swathi(15), Anusham(17), Thiruvonam(22), Revathi(27).
AUSPICIOUS_DAILY_NAKSHATRAS: set[int] = {1, 4, 5, 7, 8, 13, 14, 15, 17, 22, 27}
CAUTION_YOGAS = {1, 6, 9, 10, 17, 27}

PLANET_DAILY_WEIGHT: dict[str, float] = {
    "JUPITER": 0.18,
    "SATURN": 0.20,
    "RAHU": 0.12,
    "KETU": 0.08,
    "MARS": 0.14,
    "MOON": 0.10,
}

TRANSIT_BASE_SCORE: dict[str, dict[int, int]] = {
    "JUPITER": {1: 50, 2: 72, 3: 48, 4: 42, 5: 78, 6: 38, 7: 68, 8: 25, 9: 82, 10: 58, 11: 80, 12: 34},
    "SATURN": {1: 42, 2: 40, 3: 62, 4: 34, 5: 52, 6: 64, 7: 50, 8: 22, 9: 36, 10: 62, 11: 76, 12: 42},
    "RAHU": {1: 40, 2: 45, 3: 50, 4: 42, 5: 48, 6: 44, 7: 45, 8: 30, 9: 46, 10: 40, 11: 52, 12: 36},
    "KETU": {1: 42, 2: 40, 3: 46, 4: 48, 5: 44, 6: 42, 7: 46, 8: 34, 9: 48, 10: 44, 11: 40, 12: 38},
    "MARS": {1: 38, 2: 34, 3: 50, 4: 40, 5: 46, 6: 52, 7: 42, 8: 28, 9: 48, 10: 44, 11: 50, 12: 32},
    "MOON": {1: 55, 2: 58, 3: 50, 4: 48, 5: 62, 6: 46, 7: 60, 8: 30, 9: 64, 10: 52, 11: 56, 12: 36},
}

PLANET_PERIOD_SCORE: dict[str, int] = {
    "SUN": 55,
    "MOON": 60,
    "MARS": 48,
    "MERCURY": 63,
    "JUPITER": 72,
    "VENUS": 68,
    "SATURN": 44,
    "RAHU": 40,
    "KETU": 42,
}

# Naisargika maitri is NOT redefined here. This module carried a byte-identical
# hand-copy of `chart_strength`'s table, which is how the Venus/Rahu
# contradiction fixed there on 2026-08-17 would have survived in daily guidance
# after being corrected everywhere else. One definition, imported.


def _age_dasha_modifier(age: int, planet: str) -> float:
    """Return a life-stage multiplier for a dasha planet.

    Thirukanitham teaches that the same dasha produces different intensity depending
    on the native's age. Saturn is harsh during youth (before karmic readiness), Mars
    peaks during the physically active years, Venus during the romantic/creative prime,
    Jupiter during the wisdom-expansion years, and the Moon colours the emotionally
    receptive phases.
    """
    if planet == "SATURN":
        return 0.88 if age < 30 else (1.05 if age > 55 else 1.0)
    if planet == "MARS":
        return 0.92 if age < 25 else (1.05 if age <= 45 else 0.95)
    if planet == "VENUS":
        return 0.90 if age < 20 else (1.08 if age <= 40 else (0.95 if age > 55 else 1.0))
    if planet == "JUPITER":
        return 1.10 if 35 <= age <= 60 else 1.0
    if planet == "MOON":
        return 1.05 if (age < 20 or age > 60) else 1.0
    return 1.0  # SUN, MERCURY, RAHU, KETU — no strong age-dependency in Thirukanitham


def _to_utc(datetime_value: datetime) -> datetime:
    if datetime_value.tzinfo is None:
        return datetime_value.replace(tzinfo=UTC)
    return datetime_value.astimezone(UTC)


def _birth_datetime_utc(profile: BirthProfile) -> datetime:
    birth_datetime_utc = profile.birth_datetime_utc
    if birth_datetime_utc is not None:
        if birth_datetime_utc.tzinfo is None:
            return birth_datetime_utc.replace(tzinfo=UTC)
        return birth_datetime_utc.astimezone(UTC)

    if profile.birth_time_local is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Birth time is required.")

    local_dt = datetime.combine(profile.birth_date_local, profile.birth_time_local)
    return local_datetime_to_utc(local_dt, profile.birth_timezone)


def _rasi_lord(rasi_number: int) -> str:
    return SIGN_LORDS[rasi_number]


def _normalize_graha_name(name: str) -> str:
    return {
        "GURU": "JUPITER",
        "SANI": "SATURN",
    }.get(name, name)


def _score_label(score: int) -> str:
    if score >= 80:
        return "STRONG_SUPPORT"
    if score >= 65:
        return "GOOD"
    if score >= 50:
        return "BALANCED"
    if score >= 35:
        return "CAUTION"
    return "RESTORATIVE"


def _angular_sep(a: float, b: float) -> float:
    diff = abs(a - b) % 360
    return diff if diff <= 180 else 360 - diff


def _collect_afflicted_planets(chart_snapshot) -> list[str]:
    planets = chart_snapshot.data.planets
    lagna_rasi = chart_snapshot.data.lagna.rasi
    sun = next((p for p in planets if p.graha == "SUN"), None)
    saturn = next((p for p in planets if p.graha == "SATURN"), None)
    rahu = next((p for p in planets if p.graha == "RAHU"), None)
    ketu = next((p for p in planets if p.graha == "KETU"), None)
    sun_longitude = sun.absolute_longitude if sun is not None else 0.0

    afflicted: list[str] = []
    for planet in planets:
        graha = planet.graha
        house = house_from_reference(lagna_rasi, planet.rasi)
        strength = int(getattr(planet, "strength_score", 0) or 0)
        if strength <= 0:
            strength = compute_natal_planet_score(
                planet=graha,
                natal_rasi=planet.rasi,
                natal_longitude=planet.absolute_longitude,
                natal_lagna_rasi=lagna_rasi,
                sun_longitude=sun_longitude,
                is_retrograde=planet.is_retrograde,
                is_vargottama=planet.is_vargottama,
                d9_rasi=planet.d9_rasi,
            )

        is_conj_malefic = False
        for malefic in (saturn, rahu, ketu):
            if malefic is None or malefic.graha == graha:
                continue
            if _angular_sep(planet.absolute_longitude, malefic.absolute_longitude) <= 8:
                is_conj_malefic = True
                break

        if graha == "SUN" and planet.rasi == 7:
            afflicted.append(graha)
            continue

        if (house in {6, 8, 12} and strength < 45) or (planet.is_combust and graha != "SUN") or is_conj_malefic:
            afflicted.append(graha)

    # Preserve order, keep top 3 for concise remedy output.
    unique = list(dict.fromkeys(afflicted))
    return unique[:3]


def _planet_period_score(lord: str) -> int:
    return PLANET_PERIOD_SCORE[lord]


def _transit_with_av_score(
    planet: str,
    transit_rasi: int,
    moon_rasi: int,
    bhinnashtakavarga: dict[str, dict[int, int]],
) -> int:
    """
    Adjust transit house score by Ashtakavarga Bhinna bindus.
    bindus >= 4: supportive transit (+8)
    bindus <= 2: difficult transit (-8)

    Rahu and Ketu have no Bhinnashtakavarga table (doctrine A-15), so
    `get_av_bindu` returns None for them and the transit keeps its base house
    score with no bindu adjustment either way.
    """
    base_house = house_from_reference(moon_rasi, transit_rasi)
    base_score = TRANSIT_BASE_SCORE.get(planet, {}).get(base_house, 50)
    bindus = get_av_bindu(bhinnashtakavarga, planet, transit_rasi)
    if bindus is not None:
        if bindus >= 4:
            base_score += 8
        elif bindus <= 2:
            base_score -= 8
    return max(10, min(90, base_score))


def _dasha_lord_strength_score(
    planet: str,
    natal_planet_score: int,
    transit_house: int,
    is_retrograde_transit: bool = False,
) -> int:
    """
    Compute dasha lord support score from natal strength and current transit.
    Returns 10-95.
    """
    natal_component = natal_planet_score * 0.40
    transit_base = TRANSIT_BASE_SCORE.get(planet, {}).get(transit_house, 50)
    transit_component = transit_base * 0.40
    retro_component = 20.0 if is_retrograde_transit else 10.0
    return max(10, min(95, round(natal_component + transit_component + retro_component)))


def _pratyantar_narrative(
    pratyantar_lord: str,
    pratyantar_days_remaining: int,
    mahadasha_lord: str,
    antardasha_lord: str,
    planet_scores: dict[str, int],
    lang: str = "ta-en",
) -> dict[str, str] | None:
    if pratyantar_days_remaining > 90:
        return None

    score = planet_scores.get(pratyantar_lord, 50)
    quality = "strong" if score >= 65 else ("challenging" if score <= 35 else "moderate")
    quality_ta = "வலுவான" if score >= 65 else ("சவாலான" if score <= 35 else "மிதமான")
    pratyantar_lord_ta = PLANET_NAME[pratyantar_lord].ta if pratyantar_lord in PLANET_NAME else pratyantar_lord
    antardasha_lord_ta = PLANET_NAME[antardasha_lord].ta if antardasha_lord in PLANET_NAME else antardasha_lord
    en = (
        f"{pratyantar_lord.capitalize()} Pratyantar ({pratyantar_days_remaining}d remaining) "
        f"brings a {quality} short-term influence within the "
        f"{antardasha_lord.capitalize()} Antardasha of {mahadasha_lord.capitalize()} Mahadasha."
    )
    ta = (
        f"{pratyantar_lord_ta} பிரத்யந்தர தசை ({pratyantar_days_remaining} நாள் மீதம்) - "
        f"{antardasha_lord_ta} அந்தர தசையில் குறுகிய கால {quality_ta} தாக்கம்."
    )
    return {"en": en, "ta": ta}


def _graha_relationship_score(maha_lord: str, antar_lord: str) -> int:
    """Relationship score from classical natural friendship table. Covers all 9×9 pairs."""
    if maha_lord == antar_lord:
        return 72
    if antar_lord in _NATURAL_FRIENDS.get(maha_lord, frozenset()):
        return 70   # Natural friends
    if antar_lord in _NATURAL_ENEMIES.get(maha_lord, frozenset()):
        return 38   # Natural enemies
    return 55       # Natural neutrals
