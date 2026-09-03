"""Tests for degree-based strength gating of sign-only yogas (audit T6).

Presence is whole-sign and must NOT change; only the reported strength label is
downgraded when a yoga's key planets are weak (low composite score) or combust.
"""
from __future__ import annotations

import pytest

from app.calculations._yoga_helpers import gate_yoga_strength
from app.calculations.yogas import (
    detect_chandra_mangala,
    detect_gaja_kesari,
    detect_pancha_mahapurusha,
)

# Mesha lagna helpers. Jupiter in a kendra from Moon -> Gaja Kesari present.
_MOON_RASI = 1


def _planets(**overrides):
    base = {
        "SUN": 5, "MOON": 1, "MARS": 10, "MERCURY": 6, "JUPITER": 4,
        "VENUS": 7, "SATURN": 11, "RAHU": 3, "KETU": 9,
    }
    base.update(overrides)
    return base


# ── gate_yoga_strength unit behaviour ─────────────────────────────────────────


@pytest.mark.no_db
def test_gate_no_scores_keeps_strength():
    strength, notes = gate_yoga_strength("STRONG", ("JUPITER", "MOON"), None)
    assert strength == "STRONG"
    assert notes == []


@pytest.mark.no_db
def test_gate_strong_scores_keep_strength():
    strength, notes = gate_yoga_strength(
        "STRONG", ("JUPITER", "MOON"), {"JUPITER": 70, "MOON": 65}
    )
    assert strength == "STRONG"
    assert notes == []


@pytest.mark.no_db
def test_gate_weak_key_planet_downgrades():
    strength, notes = gate_yoga_strength(
        "STRONG", ("JUPITER", "MOON"), {"JUPITER": 30, "MOON": 65}
    )
    assert strength == "PARTIAL"
    assert any("weak_key_planet_jupiter" in n for n in notes)


@pytest.mark.no_db
def test_gate_combust_key_planet_downgrades():
    strength, notes = gate_yoga_strength(
        "STRONG", ("JUPITER", "MOON"), {"JUPITER": 70, "MOON": 65},
        combust_planets=frozenset({"JUPITER"}),
    )
    assert strength == "PARTIAL"
    assert any("combust_key_planet" in n for n in notes)


@pytest.mark.no_db
def test_gate_floors_at_partial_for_present_yoga():
    # Weak AND combust would be two downgrades, but floor keeps it PARTIAL.
    strength, _notes = gate_yoga_strength(
        "STRONG", ("JUPITER",), {"JUPITER": 20}, combust_planets=frozenset({"JUPITER"})
    )
    assert strength == "PARTIAL"


@pytest.mark.no_db
def test_gate_never_upgrades():
    strength, _notes = gate_yoga_strength("PARTIAL", ("MARS",), {"MARS": 95})
    assert strength == "PARTIAL"


# ── Detector-level: presence unchanged, strength gated ────────────────────────


@pytest.mark.no_db
def test_gaja_kesari_present_but_downgraded_when_jupiter_weak():
    planets = _planets()
    strong = detect_gaja_kesari(planets, _MOON_RASI, planet_scores={"JUPITER": 70, "MOON": 60})
    weak = detect_gaja_kesari(planets, _MOON_RASI, planet_scores={"JUPITER": 25, "MOON": 60})
    # Presence identical (whole-sign), strength differs.
    assert strong.is_present is True
    assert weak.is_present is True
    assert strong.strength == "STRONG"
    assert weak.strength == "PARTIAL"


@pytest.mark.no_db
def test_gaja_kesari_combust_jupiter_downgrades():
    planets = _planets()
    result = detect_gaja_kesari(
        planets, _MOON_RASI,
        planet_scores={"JUPITER": 70, "MOON": 60},
        combust_planets=frozenset({"JUPITER"}),
    )
    assert result.is_present is True
    assert result.strength == "PARTIAL"


@pytest.mark.no_db
def test_pancha_mahapurusha_strength_gated():
    # Mars exalted in Magaram (rasi 10) and in a kendra (10th house from Mesha).
    planets = _planets(MARS=10)
    strong = detect_pancha_mahapurusha(planets, 1, planet_scores={"MARS": 80})
    ruchaka_strong = next(y for y in strong if y.name == "RUCHAKA_YOGA")
    assert ruchaka_strong.is_present is True
    assert ruchaka_strong.strength == "STRONG"

    weak = detect_pancha_mahapurusha(planets, 1, planet_scores={"MARS": 30})
    ruchaka_weak = next(y for y in weak if y.name == "RUCHAKA_YOGA")
    assert ruchaka_weak.is_present is True  # presence unchanged
    assert ruchaka_weak.strength == "PARTIAL"


@pytest.mark.no_db
def test_chandra_mangala_conjunct_downgrades_when_mars_weak():
    planets = _planets(MARS=1)  # Moon+Mars both rasi 1 -> conjunct
    strong = detect_chandra_mangala(planets, planet_scores={"MOON": 60, "MARS": 70})
    weak = detect_chandra_mangala(planets, planet_scores={"MOON": 60, "MARS": 28})
    assert strong.strength == "STRONG"
    assert weak.is_present is True
    assert weak.strength == "PARTIAL"
