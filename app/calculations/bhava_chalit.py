from __future__ import annotations


def compute_bhava_chalit(
    lagna_longitude: float,
    planet_longitudes: dict[str, float],
) -> dict[str, int]:
    """
    Equal-house Bhava Chalit from Lagna cusp.
    Returns {planet: house_1_to_12}.
    """
    lagna = lagna_longitude % 360.0
    result: dict[str, int] = {}
    for planet, raw_lon in planet_longitudes.items():
        lon = raw_lon % 360.0
        rel = (lon - lagna) % 360.0
        result[planet] = int(rel // 30.0) + 1
    return result
