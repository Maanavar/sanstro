"""Deferred-checks plan, item 1: Guru + Ketu in Putra Sarpa (D6b, Q14).

Not ruled. The default stays today's behaviour (a watch-note); `leg` is the
other branch, built so the astrologer can see what it changes before choosing.
Synthetic chart only.
"""
from __future__ import annotations

import pytest

from app.calculations._yoga_dosham import detect_putra_sarpa_dosham
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions, validated

pytestmark = pytest.mark.no_db

# Mesham lagna: the 5th is Simmam (5), lord Sun. Rahu in the 5th declares it.
# Ketu (always 7th from Rahu) sits with Jupiter in the 11th, and Jupiter in the
# 11th aspects the 5th by its 7th aspect, so Jupiter is linked to the 5th.
# Jupiter in the 11th is not a kendra and the Sun scores 50, so no protection
# lowers the grade and the leg alone decides it.
_PLANETS = {
    "SUN": 3, "MOON": 2, "MARS": 9, "MERCURY": 3, "JUPITER": 11,
    "VENUS": 4, "SATURN": 10, "RAHU": 5, "KETU": 11,
}
_SCORES = dict.fromkeys(_PLANETS, 50)


def _detect(mode: str):
    return detect_putra_sarpa_dosham(_PLANETS, 1, _SCORES, doctrine=DoctrineOptions(d6b_guru_ketu=mode, ps_node_alone="mild"))


def test_the_default_is_todays_watch_note() -> None:
    assert DEFAULT_DOCTRINE.d6b_guru_ketu == "watch_note"
    result = _detect("watch_note")
    assert result.is_present and result.strength == "WEAK"
    assert "putra_sarpa_guru_ketu_noted" in result.context_notes
    assert "jupiter_joined_by_ketu" not in result.conditions_met


def test_leg_counts_ketu_beside_guru_and_drops_the_note() -> None:
    """The plan's negative run, both ways: under `leg` the note disappears and
    the grade rises one step; back on `watch_note` it returns."""
    leg = _detect("leg")
    assert "jupiter_joined_by_ketu" in leg.conditions_met
    assert "putra_sarpa_guru_ketu_noted" not in leg.context_notes
    assert leg.strength == "PARTIAL"
    assert "putra_sarpa_guru_ketu_noted" in _detect("watch_note").context_notes


def test_rahu_beside_guru_is_a_leg_under_both_settings() -> None:
    swapped = {**_PLANETS, "RAHU": 11, "KETU": 5}
    for mode in ("watch_note", "leg"):
        r = detect_putra_sarpa_dosham(swapped, 1, _SCORES, doctrine=DoctrineOptions(d6b_guru_ketu=mode, ps_node_alone="mild"))
        assert "jupiter_joined_by_rahu" in r.conditions_met, mode


def test_an_unknown_value_is_refused() -> None:
    with pytest.raises(ValueError, match="d6b_guru_ketu"):
        validated(DoctrineOptions(d6b_guru_ketu="half_leg"))
