from __future__ import annotations

from app.calculations.transits import get_jupiter_aspects, get_saturn_aspects


def score_double_transit(
    relevant_house_rasi: int,
    jupiter_transit_rasi: int,
    saturn_transit_rasi: int,
    rahu_transit_rasi: int,
    natal_house_lord_rasi: int,
) -> int:
    """
    Returns -10 to +15.

    +15: Jupiter transits relevant house and Saturn aspects/occupies it (or vice versa).
    +10: Jupiter aspects relevant house from supportive position.
    +5: Only one among Jupiter/Saturn connects to relevant house.
     0: Neither connects.
    -5: Saturn transits relevant house with no Jupiter support.
   -10: Saturn + Rahu afflict relevant house simultaneously.
    """
    jup_aspects = set(get_jupiter_aspects(jupiter_transit_rasi))
    sat_aspects = set(get_saturn_aspects(saturn_transit_rasi))

    jup_connected = (
        jupiter_transit_rasi == relevant_house_rasi
        or relevant_house_rasi in jup_aspects
        or natal_house_lord_rasi in jup_aspects
    )
    sat_connected = (
        saturn_transit_rasi == relevant_house_rasi
        or relevant_house_rasi in sat_aspects
        or natal_house_lord_rasi in sat_aspects
    )

    if saturn_transit_rasi == relevant_house_rasi and rahu_transit_rasi == relevant_house_rasi:
        return -10
    if saturn_transit_rasi == relevant_house_rasi and not jup_connected:
        return -5
    if (jupiter_transit_rasi == relevant_house_rasi and sat_connected) or (
        saturn_transit_rasi == relevant_house_rasi and jup_connected
    ):
        return 15
    if relevant_house_rasi in jup_aspects:
        return 10
    if jup_connected or sat_connected:
        return 5
    return 0

