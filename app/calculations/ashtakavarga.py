"""
Ashtakavarga (Bhinnashtakavarga) bindu calculation.
Source: Formula Engine Spec §9.1-9.4, Thirukanitham / Brihat Parashara tradition.

BAV_TABLE[planet][reference_point] = list of houses (from that reference point's Rasi)
that contribute 1 bindu when the planet transits there.
"""
from __future__ import annotations

# Verbatim from Formula Engine Spec §9.2
BAV_TABLE: dict[str, dict[str, list[int]]] = {
    "SUN": {
        "SUN":     [1, 2, 4, 7, 8, 9, 10, 11],
        "MOON":    [3, 6, 10, 11],
        "MARS":    [1, 2, 4, 7, 8, 9, 10, 11],
        "MERCURY": [3, 5, 6, 9, 10, 11, 12],
        "JUPITER": [5, 6, 9, 11],
        "VENUS":   [6, 7, 12],
        "SATURN":  [1, 2, 4, 7, 8, 9, 10, 11],
        "LAGNA":   [3, 4, 6, 10, 11, 12],
    },
    "MOON": {
        "SUN":     [3, 6, 7, 8, 10, 11],
        "MOON":    [1, 3, 6, 7, 10, 11],
        "MARS":    [2, 3, 5, 6, 9, 10, 11],
        "MERCURY": [1, 3, 4, 5, 7, 8, 10, 11],
        "JUPITER": [1, 4, 7, 8, 10, 11, 12],
        "VENUS":   [3, 4, 5, 7, 9, 10, 11],
        "SATURN":  [3, 5, 6, 11],
        "LAGNA":   [3, 6, 10, 11],
    },
    "MARS": {
        "SUN":     [3, 5, 6, 10, 11],
        "MOON":    [3, 6, 11],
        "MARS":    [1, 2, 4, 7, 8, 10, 11],
        "MERCURY": [3, 5, 6, 11],
        "JUPITER": [6, 10, 11, 12],
        "VENUS":   [6, 8, 11, 12],
        "SATURN":  [1, 4, 7, 8, 9, 10, 11],
        "LAGNA":   [1, 2, 4, 7, 8, 10, 11],
    },
    "MERCURY": {
        "SUN":     [5, 6, 9, 11, 12],
        "MOON":    [2, 4, 6, 8, 10, 11],
        "MARS":    [1, 2, 4, 7, 8, 9, 10, 11],
        "MERCURY": [1, 3, 5, 6, 9, 10, 11, 12],
        "JUPITER": [6, 8, 11, 12],
        "VENUS":   [1, 2, 3, 4, 5, 8, 9, 11],
        "SATURN":  [1, 2, 4, 7, 8, 9, 10, 11],
        "LAGNA":   [1, 3, 5, 6, 9, 10, 11],  # Phala Deepika (Tamil primary source)
    },
    "JUPITER": {
        "SUN":     [1, 2, 3, 4, 7, 8, 9, 10, 11],
        "MOON":    [2, 5, 7, 9, 11],
        "MARS":    [1, 2, 4, 7, 8, 10, 11],
        "MERCURY": [1, 2, 4, 5, 6, 9, 10, 11],
        "JUPITER": [1, 2, 3, 4, 7, 8, 10, 11],
        "VENUS":   [2, 5, 6, 9, 10, 11],
        "SATURN":  [3, 5, 6, 12],
        "LAGNA":   [1, 2, 4, 5, 6, 7, 9, 10, 11],
    },
    "VENUS": {
        "SUN":     [8, 11, 12],
        "MOON":    [1, 2, 3, 4, 5, 8, 9, 11, 12],
        "MARS":    [3, 4, 6, 9, 11, 12],
        "MERCURY": [3, 5, 6, 9, 11],
        "JUPITER": [5, 8, 9, 10, 11],
        "VENUS":   [1, 2, 3, 4, 5, 8, 9, 10, 11],
        "SATURN":  [3, 4, 5, 8, 9, 10, 11],
        "LAGNA":   [1, 2, 3, 4, 5, 8, 9, 11],
    },
    "SATURN": {
        "SUN":     [1, 2, 4, 7, 8, 10, 11],
        "MOON":    [3, 6, 11],
        "MARS":    [3, 5, 6, 10, 11, 12],
        "MERCURY": [6, 8, 9, 10, 11, 12],
        "JUPITER": [5, 6, 11, 12],
        "VENUS":   [6, 11, 12],
        "SATURN":  [3, 5, 6, 11],
        "LAGNA":   [1, 3, 4, 6, 10, 11],
    },
}

# Rahu and Ketu do not have classical Bhinnashtakavarga tables.
# Per spec §9.3 only 7 planets contribute to Sarvashtakavarga.
# For Rahu/Ketu transit scoring, Saturn's table is used as a proxy.
BAV_PLANETS = list(BAV_TABLE.keys())  # SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN


def compute_bhinnashtakavarga(
    natal_rasi_map: dict[str, int],
) -> dict[str, dict[int, int]]:
    """
    Compute the full Bhinnashtakavarga for all 7 BAV planets.

    natal_rasi_map must contain keys: SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, LAGNA
    Values are Rasi numbers (1-12).

    Returns: {planet: {rasi_1_to_12: bindu_count_0_to_8}}
    """
    result: dict[str, dict[int, int]] = {}
    for planet, ref_table in BAV_TABLE.items():
        bindus: dict[int, int] = {rasi: 0 for rasi in range(1, 13)}
        for ref_point, benefic_houses in ref_table.items():
            ref_rasi = natal_rasi_map.get(ref_point)
            if ref_rasi is None:
                continue
            for benefic_house in benefic_houses:
                # Convert house number (relative to ref_point's Rasi) to absolute Rasi
                target_rasi = ((ref_rasi - 1 + benefic_house - 1) % 12) + 1
                bindus[target_rasi] += 1
        result[planet] = bindus
    return result


def get_av_bindu(
    bav: dict[str, dict[int, int]],
    planet: str,
    transit_rasi: int,
) -> int:
    """
    Get Ashtakavarga bindu for a planet transiting a specific Rasi.
    For RAHU and KETU, uses SATURN's table as proxy (common Thirukanitham practice).
    Returns 4 (neutral default) if planet has no BAV table.
    """
    lookup = planet if planet in BAV_TABLE else ("SATURN" if planet in {"RAHU", "KETU"} else None)
    if lookup is None:
        return 4
    return bav.get(lookup, {}).get(transit_rasi, 4)


def compute_sarvashtakavarga(bav: dict[str, dict[int, int]]) -> dict[int, int]:
    """
    Sum BAV scores across all 7 planets per Rasi.
    Per spec §9.3. Expected total range per house: 0-56.
    """
    sarva: dict[int, int] = {rasi: 0 for rasi in range(1, 13)}
    for planet in BAV_PLANETS:
        for rasi in range(1, 13):
            sarva[rasi] += bav.get(planet, {}).get(rasi, 0)
    return sarva
