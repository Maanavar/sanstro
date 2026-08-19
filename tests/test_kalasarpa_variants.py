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


# ── Doctrine A-4 (ruled 2026-08-19): the four mechanical points ──────────────


def _lons(rahu_lon: float, graha_lon: float) -> dict[str, float]:
    """Longitude map with all seven grahas stacked at `graha_lon`."""
    lons = {graha: graha_lon for graha in SEVEN_PLANETS}
    lons["RAHU"] = rahu_lon
    lons["KETU"] = (rahu_lon + 180.0) % 360.0
    return lons


def _straddling(stray_lon: float) -> tuple[dict[str, int], dict[str, float]]:
    """Six grahas safely inside the Rahu->Ketu arc, Saturn out at `stray_lon`.

    Rahu is at 15 deg Mesham (rasi 1), Ketu at 15 deg Thulaam (195 deg, rasi 7).
    The six sit at 100 deg (rasi 4). Saturn is placed in Ketu's own *sign* but
    past Ketu's exact degree, so whole-sign counts it inside the arc and
    degree-exact does not — and because the six are on the far side, no arc
    contains all seven and the yoga must not form.
    """
    planets = {graha: 4 for graha in SEVEN_PLANETS}
    planets["RAHU"] = 1
    planets["KETU"] = 7
    planets["SATURN"] = 7

    lons = _lons(15.0, 100.0)
    lons["SATURN"] = stray_lon
    return planets, lons


def test_degree_exact_arc_excludes_a_graha_the_whole_sign_test_would_include():
    """The case the whole-sign approximation gets wrong."""
    planets, lons = _straddling(200.0)

    whole_sign = detect_kalasarpa(planets, lagna_rasi=1)
    assert whole_sign.is_present is True
    assert "arc_test_whole_sign" in whole_sign.conditions_met

    exact = detect_kalasarpa(planets, lagna_rasi=1, longitudes=lons)
    assert exact.is_present is False
    assert exact.variant == "NONE"


def test_degree_exact_arc_forms_when_every_graha_is_genuinely_inside():
    planets = {graha: 4 for graha in SEVEN_PLANETS}
    planets["RAHU"] = 1
    planets["KETU"] = 7

    result = detect_kalasarpa(planets, lagna_rasi=1, longitudes=_lons(15.0, 100.0))
    assert result.is_present is True
    assert "arc_test_degree_exact" in result.conditions_met


def test_a_graha_exactly_on_a_node_qualifies_but_is_disclosed():
    """Point 4: the boundary is recorded, not silently resolved in or out."""
    planets = {graha: 1 for graha in SEVEN_PLANETS}
    planets["RAHU"] = 1
    planets["KETU"] = 7

    result = detect_kalasarpa(planets, lagna_rasi=1, longitudes=_lons(15.0, 15.0))
    assert result.is_present is True
    assert any(c.startswith("graha_on_node_") for c in result.conditions_met)


def test_lagna_is_not_required_to_fall_inside_the_arc():
    """Point 1: seven grahas only.

    Lagna is Thulaam (7) — the empty half — while all seven grahas sit inside
    the Rahu->Ketu arc. Lineages that require the Lagna inside would refuse
    this chart; we form the yoga.
    """
    planets = {graha: 4 for graha in SEVEN_PLANETS}
    planets["RAHU"] = 1
    planets["KETU"] = 7

    result = detect_kalasarpa(planets, lagna_rasi=7, longitudes=_lons(15.0, 100.0))
    assert result.is_present is True


def test_both_arc_directions_form_the_yoga_and_are_reported_separately():
    """Point 3 as amended: direction is recorded, never used to disqualify.

    The reverse enclosure is called Kala Amrita by some modern schools and read
    quite differently. That is a school convention we do not bake in, so both
    directions form and the pattern is left for the caller to interpret.
    """
    forward = {graha: 4 for graha in SEVEN_PLANETS}
    forward["RAHU"] = 1
    forward["KETU"] = 7
    reverse = {graha: 10 for graha in SEVEN_PLANETS}
    reverse["RAHU"] = 1
    reverse["KETU"] = 7

    anuloma = detect_kalasarpa(forward, lagna_rasi=1, longitudes=_lons(15.0, 100.0))
    viloma = detect_kalasarpa(reverse, lagna_rasi=1, longitudes=_lons(15.0, 280.0))

    assert anuloma.is_present is True
    assert viloma.is_present is True
    assert anuloma.pattern != viloma.pattern
    assert {anuloma.pattern, viloma.pattern} == {"ANULOMA", "VILOMA"}


def test_no_degree_tolerance_widens_the_arc():
    """Point 3: a graha just past a node is out, with no forgiving orb.

    One arcminute past Ketu is outside the arc. If someone reintroduces a
    tolerance at the node ends, this is the test that catches it.
    """
    planets, lons = _straddling(195.0 + 1.0 / 60.0)

    just_past = detect_kalasarpa(planets, lagna_rasi=1, longitudes=lons)
    assert just_past.is_present is False

    # Exactly on Ketu, the same graha is inside — that is the boundary case,
    # and it is disclosed rather than resolved silently.
    planets_on, lons_on = _straddling(195.0)
    on_node = detect_kalasarpa(planets_on, lagna_rasi=1, longitudes=lons_on)
    assert on_node.is_present is True
    assert "graha_on_node_SATURN" in on_node.conditions_met
