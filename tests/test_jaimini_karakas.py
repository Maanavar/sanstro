from __future__ import annotations

import pytest

from app.calculations.astro import navamsa_rasi_from_degree
from app.calculations.jaimini_karakas import (
    CHARA_KARAKA_ORDER,
    compute_char_karakas,
    compute_karakamsa,
)

pytestmark = pytest.mark.no_db

# Same reference-chart longitudes as
# test_golden_validation.py::test_t003_cross_verify_reference_chart_all_9_planets_within_point1_degree
# (1993-03-15 08:15 IST, cross-verified to within 0.1 deg against a second
# ephemeris source). Reused here so the Atmakaraka ranking is checked against
# real, already-audited planetary positions rather than invented numbers.
_T003_LONGITUDES = {
    "SUN": 330.76342508,
    "MOON": 240.01137891,
    "MARS": 79.07542605,
    "MERCURY": 319.35056099,
    "JUPITER": 167.96021694,
    "VENUS": 355.97203864,
    "SATURN": 301.07930470,
    "RAHU": 232.78702194,
    "KETU": 52.78702194,
}


def test_atmakaraka_ranking_against_t003_reference_chart() -> None:
    # Effective degree-within-sign (WI-09: Rahu reversed to 30 - advancement)
    # for each candidate: VENUS 25.97 > MERCURY 19.35 > MARS 19.08 >
    # JUPITER 17.96 > RAHU (30 - 22.79 = 7.21) > SATURN 1.08 > SUN 0.76 >
    # MOON 0.01. Atmakaraka is unchanged (Venus was already highest either
    # way); Amatyakaraka moves from Rahu to Mercury under the reversed rule.
    karakas = compute_char_karakas(_T003_LONGITUDES)
    assert karakas == {
        "ATMAKARAKA": "VENUS",
        "AMATYAKARAKA": "MERCURY",
        "BHRATRUKARAKA": "MARS",
        "MATRUKARAKA": "JUPITER",
        "PITRUKARAKA": "RAHU",
        "PUTRAKARAKA": "SATURN",
        "GNATIKARAKA": "SUN",
        "DAARAKARAKA": "MOON",
    }


def test_karakamsa_matches_atmakaraka_navamsa() -> None:
    karakas = compute_char_karakas(_T003_LONGITUDES)
    atmakaraka = karakas["ATMAKARAKA"]
    d9_rasi_map = {
        planet: navamsa_rasi_from_degree(lon)
        for planet, lon in _T003_LONGITUDES.items()
    }
    assert compute_karakamsa(atmakaraka, d9_rasi_map) == navamsa_rasi_from_degree(_T003_LONGITUDES["VENUS"])


def test_ketu_excluded_even_at_highest_degree() -> None:
    longitudes = dict(_T003_LONGITUDES)
    longitudes["KETU"] = 29.99  # highest possible degree-in-sign
    karakas = compute_char_karakas(longitudes)
    assert "KETU" not in karakas.values()


def test_rahu_degree_reversed_not_forward() -> None:
    # Doctrine §4 / WI-09: Rahu's effective degree = 30 - advancement. A Rahu
    # near the START of its sign (small forward degree, e.g. 2.0) has a HIGH
    # effective degree (28.0) and should outrank; a Rahu near the END of its
    # sign (28.0) has a LOW effective degree (2.0) and should underrank.
    low_forward_degree = compute_char_karakas({"RAHU": 2.0, "SUN": 15.0})
    high_forward_degree = compute_char_karakas({"RAHU": 28.0, "SUN": 15.0})
    assert low_forward_degree["ATMAKARAKA"] == "RAHU"
    assert high_forward_degree["ATMAKARAKA"] == "SUN"


def test_tie_break_uses_classical_dignity_order() -> None:
    # Sun at forward degree 10; Rahu at forward degree 20, whose REVERSED
    # effective degree (30 - 20 = 10) ties with Sun. Sun (earlier in
    # classical dignity order) keeps the higher karaka (WI-09).
    karakas = compute_char_karakas({"SUN": 10.0, "RAHU": 20.0})
    assert karakas["ATMAKARAKA"] == "SUN"
    assert karakas["AMATYAKARAKA"] == "RAHU"


def test_full_eight_karaka_assignment_strictly_descending() -> None:
    longitudes = {
        "SUN": 371.0,     # 11.0 in-sign
        "MOON": 40.0,     # 10.0
        "MARS": 39.0,     # 9.0
        "MERCURY": 38.0,  # 8.0
        "JUPITER": 37.0,  # 7.0
        "VENUS": 36.0,    # 6.0
        "SATURN": 35.0,   # 5.0
        "RAHU": 26.0,     # forward 26.0 -> reversed effective degree 30-26=4.0 (WI-09)
    }
    karakas = compute_char_karakas(longitudes)
    assert list(karakas.keys()) == CHARA_KARAKA_ORDER
    assert list(karakas.values()) == [
        "SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU",
    ]


def test_atmakaraka_flips_between_forward_and_reversed_rahu_degree() -> None:
    # Golden case (WI-09 acceptance): a chart where forward-vs-reversed Rahu
    # counting changes the ATMAKARAKA itself, not just a lower karaka. Rahu
    # at forward degree 29.0 would rank ATMAKARAKA (highest) under the old
    # forward-counting rule; under the ratified reversed rule its effective
    # degree is 30-29=1.0, the lowest, so Jupiter (20.0) becomes Atmakaraka.
    longitudes = {"JUPITER": 20.0, "RAHU": 29.0}
    karakas = compute_char_karakas(longitudes)
    assert karakas["ATMAKARAKA"] == "JUPITER"
    assert karakas["AMATYAKARAKA"] == "RAHU"
