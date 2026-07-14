"""Golden tests for the 12 named Kala Sarpa variants (Ananta..Sheshanaga).

The naga is fixed by Rahu's house from lagna, so with lagna = Mesha (rasi 1)
the house number equals Rahu's rasi, making the expected variant easy to state.
"""
from __future__ import annotations

import pytest

from app.calculations._yoga_dosham import KALASARPA_NAGAS, detect_kalasarpa
from app.calculations._yoga_helpers import SEVEN_PLANETS

pytestmark = pytest.mark.no_db


def _ksy_planets(rahu_rasi: int) -> dict[str, int]:
    """Build a chart where all seven planets sit inside the Rahu->Ketu arc."""
    ketu_rasi = ((rahu_rasi - 1 + 6) % 12) + 1
    inside = (rahu_rasi % 12) + 1  # one sign ahead of Rahu, safely inside the arc
    planets: dict[str, int] = {p: inside for p in SEVEN_PLANETS}
    planets["RAHU"] = rahu_rasi
    planets["KETU"] = ketu_rasi
    return planets


@pytest.mark.parametrize(
    "rahu_rasi,expected",
    [
        (1, "ANANTA"),
        (2, "KULIKA"),
        (3, "VASUKI"),
        (4, "SHANKHAPALA"),
        (5, "PADMA"),
        (6, "MAHAPADMA"),
        (7, "TAKSHAKA"),
        (8, "KARKOTAKA"),
        (9, "SHANKHACHUDA"),
        (10, "GHATAKA"),
        (11, "VISHADHARA"),
        (12, "SHESHANAGA"),
    ],
)
def test_variant_by_rahu_house(rahu_rasi: int, expected: str) -> None:
    result = detect_kalasarpa(_ksy_planets(rahu_rasi), lagna_rasi=1)
    assert result.is_present is True
    assert result.variant == expected
    assert result.rahu_house == rahu_rasi
    assert result.variant_en  # non-empty label
    assert result.variant_ta
    assert result.meaning_en in result.description_en


def test_all_twelve_nagas_covered() -> None:
    assert len(KALASARPA_NAGAS) == 12
    codes = {v["code"] for v in KALASARPA_NAGAS.values()}
    assert len(codes) == 12  # no duplicates


def test_no_kalasarpa_when_axis_split() -> None:
    # Rahu=1, Ketu=7. Most planets sit in the Rahu-side exclusive arc (rasi 4),
    # but Saturn sits in the Ketu-side exclusive arc (rasi 10) — so neither arc
    # contains all seven and no Kala Sarpa forms.
    planets = {p: 4 for p in SEVEN_PLANETS}
    planets["SATURN"] = 10
    planets["RAHU"] = 1
    planets["KETU"] = 7
    result = detect_kalasarpa(planets, lagna_rasi=1)
    assert result.is_present is False
    assert result.variant == "NONE"


def test_lagna_unknown_falls_back_to_unnamed() -> None:
    result = detect_kalasarpa(_ksy_planets(1))  # no lagna passed
    assert result.is_present is True
    assert result.variant == "NONE"  # present, but not named without lagna
