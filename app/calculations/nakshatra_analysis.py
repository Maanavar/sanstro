from __future__ import annotations

from app.calculations.dasha import NAK_LORD

# Two pushkara navamsas per sign, by element (navamsa index 1-9 within the
# sign) — standard table (C.S. Patel, "Navamsa in Astrology" lineage). WI-06:
# the old table had one entry per sign matching no known tradition.
_PUSHKARA_NAVAMSA: dict[int, frozenset[int]] = {
    1: frozenset({7, 9}),  5: frozenset({7, 9}),  9: frozenset({7, 9}),    # fire
    2: frozenset({3, 5}),  6: frozenset({3, 5}), 10: frozenset({3, 5}),    # earth
    3: frozenset({6, 8}),  7: frozenset({6, 8}), 11: frozenset({6, 8}),    # air
    4: frozenset({1, 3}),  8: frozenset({1, 3}), 12: frozenset({1, 3}),    # water
}
# Pushkara bhaga — one exact degree per sign (standard table; WI-06 fixed 9
# of 12 signs that diverged from the standard list). Pending OQ-3 printed-
# source cross-check.
_PUSHKARA_BHAGA: dict[int, float] = {
    1: 21.0, 2: 14.0, 3: 18.0, 4: 8.0,  5: 19.0, 6: 9.0,
    7: 24.0, 8: 11.0, 9: 23.0, 10: 14.0, 11: 19.0, 12: 9.0,
}


def _norm(longitude: float) -> tuple[int, float]:
    lon = longitude % 360.0
    return int(lon // 30.0) + 1, lon % 30.0


def _nakshatra_number(longitude: float) -> int:
    return int((longitude % 360.0) // (40.0 / 3.0)) + 1


def _navamsa_number_in_sign(degree_in_sign: float) -> int:
    return min(int(degree_in_sign // (10.0 / 3.0)) + 1, 9)


def build_dispositor_chain(
    planet_longitudes: dict[str, float],
    max_depth: int = 4,
) -> dict[str, list[str]]:
    chains: dict[str, list[str]] = {}
    for planet, longitude in planet_longitudes.items():
        chain = [planet]
        current = planet
        current_longitude = longitude
        for _ in range(max_depth - 1):
            nak_lord = NAK_LORD[_nakshatra_number(current_longitude)]
            chain.append(nak_lord)
            if nak_lord == current:
                break
            if nak_lord not in planet_longitudes:
                break
            current = nak_lord
            current_longitude = planet_longitudes[nak_lord]
        chains[planet] = chain
    return chains


def pushkara_check(planet_longitudes: dict[str, float]) -> dict[str, bool]:
    result: dict[str, bool] = {}
    for planet, longitude in planet_longitudes.items():
        rasi, deg = _norm(longitude)
        navamsa_no = _navamsa_number_in_sign(deg)
        result[planet] = navamsa_no in _PUSHKARA_NAVAMSA[rasi]
        result[f"{planet}_bhaga"] = abs(deg - _PUSHKARA_BHAGA[rasi]) <= 0.5
    return result


def gandanta_detail(planet_longitudes: dict[str, float]) -> dict[str, dict]:
    """Per-planet gandanta band, on the one boundary the score uses (FAA-14).

    DEEP (≤ 40′) and MODERATE (< 3°20′) are gandanta and are scored
    (`transits.is_gandanta`). NEAR (3°20′–5°) is shown as "near gandanta" and
    is NOT gandanta: `is_gandanta` is False and nothing scores it. It used to be
    "MILD" with `is_gandanta` True, so a planet at 4° Simmam was "mild
    gandanta" on the card and not gandanta in its strength breakdown.
    """
    from app.calculations.transits import (
        GANDANTA_DEEP_DEG,
        NEAR_GANDANTA_DEG,
        gandanta_distance,
        is_gandanta,
    )

    details: dict[str, dict] = {}
    for planet, longitude in planet_longitudes.items():
        zone, distance = gandanta_distance(longitude)
        scored = is_gandanta(longitude)
        if scored and distance <= GANDANTA_DEEP_DEG:
            intensity: str | None = "DEEP"
        elif scored:
            intensity = "MODERATE"
        elif distance <= NEAR_GANDANTA_DEG:
            intensity = "NEAR"
        else:
            intensity, zone = None, None
        details[planet] = {"is_gandanta": scored, "zone": zone, "intensity": intensity}
    return details
