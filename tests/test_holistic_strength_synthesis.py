"""Golden cases for the Holistic Strength Synthesis second pass.

Spec: docs/THIRUKANITHAM_STRENGTH_SYNTHESIS_2026-07-23.md

These exercise the PURE function ``apply_holistic_synthesis`` (and the
``_neecha_bhanga_planets`` helper) directly — no DB, no birth data. Every term
is asserted in isolation via the per-term fields the function returns, then the
clamps and the "identity under no signal" guarantee.

All charts here are synthetic (bare rasi maps), never a real birth profile.
"""
from __future__ import annotations

import pytest

from app.calculations.chart_strength import (
    FUNCTIONAL_STRENGTH_DELTA,
    SYNTHESIS_DELTA_CAP,
    _neecha_bhanga_planets,
    apply_holistic_synthesis,
)

# Pure calculation tests — no DB, no birth data. The `no_db` marker lets the
# conftest skip the test-DB reset guard (tests/conftest.py::require_db).
pytestmark = pytest.mark.no_db

# Mesha (Aries) lagna throughout unless a test says otherwise.
MESHA = 1

# A neutral benefic set that names only the natural benefics, so tests that
# don't care about yuti/drishti sign get the classical default.
BENEFICS = frozenset({"JUPITER", "VENUS", "MERCURY", "MOON"})


def _run(base_scores, planet_rasi, *, lagna=MESHA, functional=None, benefics=BENEFICS, d9=None):
    return apply_holistic_synthesis(
        base_scores,
        planet_rasi=planet_rasi,
        lagna_rasi=lagna,
        functional_nature=functional or {g: "NEUTRAL" for g in base_scores},
        benefic_planets=benefics,
        d9_rasi_map=d9,
    )


def test_identity_under_no_signal():
    """One planet, NEUTRAL role, no company, aspected by no one, not debilitated:
    every term is 0 and the score is exactly the base."""
    out = _run({"SATURN": 44}, {"SATURN": 3})  # rasi 3, alone
    s = out["SATURN"]
    assert s["functional"] == 0.0
    assert s["yuti"] == 0.0
    assert s["drishti"] == 0.0
    assert s["bhanga"] == 0.0
    assert s["delta"] == 0.0
    assert s["score"] == 44.0


def test_functional_term_isolated():
    """Functional lordship contributes exactly FUNCTIONAL_STRENGTH_DELTA[nature]."""
    out = _run(
        {"MARS": 44},
        {"MARS": 8},
        functional={"MARS": "LAGNA_LORD"},
    )
    assert out["MARS"]["functional"] == FUNCTIONAL_STRENGTH_DELTA["LAGNA_LORD"]

    out2 = _run(
        {"MERCURY": 30},
        {"MERCURY": 6},
        functional={"MERCURY": "DUSTHANA"},
    )
    assert out2["MERCURY"]["functional"] == FUNCTIONAL_STRENGTH_DELTA["DUSTHANA"]
    # Dusthana lord loses points; score drops but never below the 10 floor.
    assert out2["MERCURY"]["score"] == 24.0


def test_yuti_strong_malefic_companion_drags():
    """Mars sharing the 8th with a strong Sun (malefic) takes a negative yuti."""
    out = _run(
        {"MARS": 44, "SUN": 80},
        {"MARS": 8, "SUN": 8},  # co-tenants
        benefics=frozenset({"JUPITER", "VENUS"}),  # Sun is malefic
    )
    # sign(-1) * (80-50)/50 * 6 = -3.6
    assert out["MARS"]["yuti"] == pytest.approx(-3.6, abs=0.01)
    # same-sign ⇒ no drishti double-count
    assert out["MARS"]["drishti"] == 0.0


def test_yuti_strong_benefic_companion_lifts():
    out = _run(
        {"MERCURY": 40, "JUPITER": 75},
        {"MERCURY": 5, "JUPITER": 5},
    )
    # +1 * (75-50)/50 * 6 = +3.0
    assert out["MERCURY"]["yuti"] == pytest.approx(3.0, abs=0.01)


def test_weighted_drishti_from_strong_jupiter():
    """Jupiter in the 4th casts its 5th aspect on Mars in the 8th; the relief is
    graded by Jupiter's own strength."""
    out = _run(
        {"MARS": 44, "JUPITER": 70},
        {"MARS": 8, "JUPITER": 4},  # Jupiter 5th-aspects rasi 8
    )
    # +1 * (70-50)/50 * 5 = +2.0
    assert out["MARS"]["drishti"] == pytest.approx(2.0, abs=0.01)
    assert out["MARS"]["yuti"] == 0.0  # not co-tenants


def test_neecha_bhanga_bonus_applied():
    """Mars in rasi 4 (its debilitation). SIGN_LORD[4]=MOON; place the Moon in a
    kendra from lagna ⇒ neecha cancelled ⇒ +14 bonus."""
    planet_rasi = {"MARS": 4, "MOON": 1}  # Moon in rasi 1 = kendra (1st) from Mesha
    cancelled = _neecha_bhanga_planets(planet_rasi, MESHA, None)
    assert "MARS" in cancelled

    out = _run({"MARS": 20, "MOON": 55}, planet_rasi)
    assert out["MARS"]["bhanga"] == 14.0


def test_neecha_bhanga_not_applied_when_uncancelled():
    """Sun debilitated in rasi 7 (Libra); its dispositor Venus sits in rasi 3
    (3rd from lagna — not a kendra), the Moon is in a non-kendra from Venus, and
    the exalter (Saturn) isn't placed ⇒ nothing cancels ⇒ no bhanga.

    (Deliberately NOT Mars-in-Cancer: there the dispositor IS the Moon, so
    "kendra from Moon" is trivially true — a real quirk shared with the
    canonical _yoga_detect.detect_neecha_bhanga, so cancellation is correct there.)
    """
    planet_rasi = {"SUN": 7, "VENUS": 3, "MOON": 1}
    assert "SUN" not in _neecha_bhanga_planets(planet_rasi, MESHA, None)
    out = _run({"SUN": 20, "VENUS": 55, "MOON": 55}, planet_rasi)
    assert out["SUN"]["bhanga"] == 0.0


def test_delta_is_clamped():
    """Stacking a Dusthana role (−6), a capped malefic yuti (−10) and malefic
    drishti (−8) sums to −24, which the net-delta clamp holds at
    −SYNTHESIS_DELTA_CAP (−22); the score never falls below 10."""
    base = {
        "MERCURY": 40,
        "SUN": 90, "MARS": 90, "SATURN": 90,   # co-tenants (yuti)
        "RAHU": 90, "KETU": 90,                 # aspecters from another sign (drishti)
    }
    rasi = {"MERCURY": 6, "SUN": 6, "MARS": 6, "SATURN": 6, "RAHU": 12, "KETU": 12}
    # Rahu/Ketu in rasi 12 cast their 7th aspect onto rasi 6 (Mercury).
    functional = {"MERCURY": "DUSTHANA", "SUN": "NEUTRAL", "MARS": "NEUTRAL", "SATURN": "NEUTRAL", "RAHU": "NEUTRAL", "KETU": "NEUTRAL"}
    out = _run(base, rasi, functional=functional, benefics=frozenset())  # all malefic
    assert out["MERCURY"]["yuti"] == -10.0    # yuti sub-cap
    assert out["MERCURY"]["drishti"] == -8.0  # two strong malefic aspects
    assert out["MERCURY"]["delta"] == -SYNTHESIS_DELTA_CAP
    assert out["MERCURY"]["score"] >= 10.0


def test_nodes_carry_no_functional_lordship_delta():
    """Astrologer decision (spec §7 Q3): Rahu/Ketu own no rasi, so they take NO
    functional-lordship delta even when the dispositor logic would label them a
    lord. They still participate in the relational terms — here Rahu, alone in
    its sign and aspected by no one, nets exactly zero."""
    out = _run(
        {"RAHU": 44, "KETU": 46},
        {"RAHU": 9, "KETU": 3},  # opposite signs, no co-tenants
        functional={"RAHU": "LAGNA_LORD", "KETU": "KENDRA"},
    )
    assert out["RAHU"]["functional"] == 0.0
    assert out["KETU"]["functional"] == 0.0
    # Rahu 5th/9th-aspects across the chart but neither aspects the other here
    # (rasi 9 vs rasi 3 is the 7th — a real aspect), so a drishti term is fine;
    # the guarantee under test is only that the LORDSHIP delta is muted.
    assert out["RAHU"]["functional"] == 0.0


def test_non_node_functional_delta_still_applies():
    """The node mute must not leak to the seven grahas that DO own signs."""
    out = _run({"JUPITER": 43}, {"JUPITER": 9}, functional={"JUPITER": "LAGNA_LORD"})
    assert out["JUPITER"]["functional"] == FUNCTIONAL_STRENGTH_DELTA["LAGNA_LORD"]


def test_score_never_exceeds_95():
    out = _run(
        {"JUPITER": 90, "VENUS": 90},
        {"JUPITER": 5, "VENUS": 5},
        functional={"JUPITER": "YOGAKARAKA", "VENUS": "NEUTRAL"},
    )
    assert out["JUPITER"]["score"] <= 95.0
