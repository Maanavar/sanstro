from __future__ import annotations

from app.calculations.chart_strength import SIGN_LORD


def get_dasha_activated_houses(lord: str, lagna_rasi: int) -> list[int]:
    """
    Return whole-sign houses activated by a planet's dasha,
    based on house ownership for the given Lagna.
    """
    normalized_lord = lord.upper()
    if normalized_lord in {"RAHU", "KETU"}:
        return []
    if not 1 <= lagna_rasi <= 12:
        raise ValueError("lagna_rasi must be between 1 and 12.")

    houses: list[int] = []
    for house in range(1, 13):
        house_rasi = ((lagna_rasi + house - 2) % 12) + 1
        if SIGN_LORD[house_rasi] == normalized_lord:
            houses.append(house)
    return houses
