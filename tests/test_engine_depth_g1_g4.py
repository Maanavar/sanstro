"""Engine audit depth tranche G1-G4 (docs/THIRUKANITHAM_ENGINE_AUDIT_2026-07-23.md, Part F).

G1 compound friendship in production dignity, G2 yuti orb grading, G3 true-sunrise
day/night, G4 varga read from its own lagna. Pure calculation tests; every chart
is a synthetic rasi map or a synthetic date/place, never a real birth profile.
"""
from __future__ import annotations

from datetime import date, time
from types import SimpleNamespace

import pytest

from app.calculations import shadbala
from app.calculations.chart_strength import (
    REL_ENEMY,
    REL_FRIEND,
    REL_GREAT_ENEMY,
    REL_GREAT_FRIEND,
    REL_NEUTRAL,
    _deeptadi_avastha,
    _dignity_score,
    apply_holistic_synthesis,
    compound_relationship,
    natural_relationship,
    yuti_orb_factor,
)
from app.services._chart_planets import _is_daytime_birth, _is_daytime_birth_for_profile

pytestmark = pytest.mark.no_db


def _lon(rasi: int, deg: float = 10.0) -> float:
    return (rasi - 1) * 30.0 + deg


# ── G1 ────────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    ("natural", "temporary_house", "expected"),
    [
        (REL_FRIEND, 2, REL_GREAT_FRIEND),
        (REL_FRIEND, 7, REL_NEUTRAL),
        (REL_NEUTRAL, 11, REL_FRIEND),
        (REL_NEUTRAL, 1, REL_ENEMY),
        (REL_ENEMY, 12, REL_NEUTRAL),
        (REL_ENEMY, 8, REL_GREAT_ENEMY),
    ],
)
def test_compound_grade_table_is_bphs_panchadha(natural, temporary_house, expected):
    """Every natural relationship × temporary position lands on the BPHS grade."""
    grahas = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"]
    pair = next(
        (a, b) for a in grahas for b in grahas
        if a != b and natural_relationship(a, b) == natural
    )
    planet, other = pair
    rasi_map = {planet: 1, other: temporary_house}
    assert compound_relationship(planet, other, rasi_map) == expected


def test_shadbala_uses_the_one_compound_definition():
    """Saptavargaja Bala and the production dignity score cannot drift apart."""
    assert shadbala._compound_relation is compound_relationship


def test_dignity_without_rasi_map_is_the_permanent_table():
    """No map → the pre-G1 reading, so unthreaded callers are unchanged."""
    planet, sign_rasi = "JUPITER", 5  # Simha, lord Sun
    expected = {REL_FRIEND: 60, REL_NEUTRAL: 50, REL_ENEMY: 35}[natural_relationship(planet, "SUN")]
    assert _dignity_score(planet, sign_rasi, _lon(sign_rasi)) == expected


def test_dignity_grades_by_compound_relationship_toward_sign_lord():
    """Same graha, same sign — the lord's position decides the tier."""
    planet, sign_rasi, lord = "JUPITER", 5, "SUN"
    natural = natural_relationship(planet, lord)
    temp_friend = {planet: sign_rasi, lord: 6}   # lord 2nd from planet
    temp_enemy = {planet: sign_rasi, lord: 11}   # lord 7th from planet
    by_grade = {REL_GREAT_FRIEND: 70, REL_FRIEND: 60, REL_NEUTRAL: 50, REL_ENEMY: 35, REL_GREAT_ENEMY: 25}
    assert _dignity_score(planet, sign_rasi, _lon(sign_rasi), temp_friend) == by_grade[
        compound_relationship(planet, lord, temp_friend)
    ]
    assert _dignity_score(planet, sign_rasi, _lon(sign_rasi), temp_enemy) == by_grade[
        compound_relationship(planet, lord, temp_enemy)
    ]
    # A temporary friend always outranks a temporary enemy for the same natural bond.
    assert _dignity_score(planet, sign_rasi, _lon(sign_rasi), temp_friend) > _dignity_score(
        planet, sign_rasi, _lon(sign_rasi), temp_enemy
    )
    assert natural in {REL_FRIEND, REL_NEUTRAL, REL_ENEMY}


def test_compound_never_overrides_own_exaltation_or_debilitation():
    rasi_map = {"JUPITER": 4, "MOON": 4}  # lord conjunct = temporary enemy
    assert _dignity_score("JUPITER", 4, _lon(4, 5.0), rasi_map) == 100  # exalted
    assert _dignity_score("JUPITER", 10, _lon(10), {"JUPITER": 10, "SATURN": 10}) == 15  # debilitated
    assert _dignity_score("JUPITER", 12, _lon(12), {"JUPITER": 12}) == 80  # own sign


def test_nodes_keep_the_permanent_reading():
    rasi_map = {"RAHU": 5, "SUN": 5}
    assert _dignity_score("RAHU", 5, _lon(5), rasi_map) == _dignity_score("RAHU", 5, _lon(5))


def test_outer_tiers_fall_in_the_classical_deeptadi_labels():
    assert _deeptadi_avastha(70) == "MUDITA"   # great friend's sign
    assert _deeptadi_avastha(25) == "KHALA"    # great enemy's sign


# ── G2 ────────────────────────────────────────────────────────────────────────

def test_yuti_orb_factor_bounds():
    assert yuti_orb_factor(0.0) == 1.0
    assert yuti_orb_factor(30.0) == 0.5
    assert yuti_orb_factor(15.0) == pytest.approx(0.75)
    assert yuti_orb_factor(45.0) == 0.5  # clamped; same sign never exceeds 30


def _synth(longitudes):
    return apply_holistic_synthesis(
        {"SATURN": 50, "JUPITER": 80},
        planet_rasi={"SATURN": 3, "JUPITER": 3},
        lagna_rasi=1,
        functional_nature={"SATURN": "NEUTRAL", "JUPITER": "NEUTRAL"},
        benefic_planets=frozenset({"JUPITER"}),
        planet_longitude=longitudes,
    )


def test_tight_yuti_weighs_more_than_wide_same_sign_yuti():
    tight = _synth({"SATURN": _lon(3, 10.0), "JUPITER": _lon(3, 10.5)})["SATURN"]["yuti"]
    wide = _synth({"SATURN": _lon(3, 0.5), "JUPITER": _lon(3, 29.5)})["SATURN"]["yuti"]
    assert tight > wide > 0  # wide is still a real yuti — the sign is the gate


def test_yuti_without_longitudes_is_the_whole_sign_reading():
    legacy = _synth(None)["SATURN"]["yuti"]
    exact = _synth({"SATURN": _lon(3, 10.0), "JUPITER": _lon(3, 10.0)})["SATURN"]["yuti"]
    assert legacy == exact


# ── G3 ────────────────────────────────────────────────────────────────────────
# Synthetic place/date pairs chosen where the clock and the Sun disagree.

OSLO = {"birth_latitude": 59.91, "birth_longitude": 10.75, "birth_timezone": "Europe/Oslo"}


def test_high_latitude_summer_dawn_is_a_day_birth():
    """Oslo midsummer sunrise is ~04:00: 05:00 is daylight though the clock says night."""
    assert _is_daytime_birth(time(5, 0), birth_date=date(2001, 6, 21), **OSLO) is True
    assert _is_daytime_birth(time(5, 0)) is False  # clock fallback, the old answer


def test_high_latitude_winter_morning_is_a_night_birth():
    """Oslo midwinter sunrise is ~09:20: 08:30 is still night though the clock says day."""
    assert _is_daytime_birth(time(8, 30), birth_date=date(2001, 12, 21), **OSLO) is False
    assert _is_daytime_birth(time(8, 30)) is True


def test_unknown_birth_time_stays_a_day_birth():
    assert _is_daytime_birth(None, birth_date=date(2001, 6, 21), **OSLO) is True


def test_profile_helper_reads_the_same_fields():
    profile = SimpleNamespace(birth_time_local=time(5, 0), birth_date_local=date(2001, 6, 21), **OSLO)
    assert _is_daytime_birth_for_profile(profile) is True


# ── G4 ────────────────────────────────────────────────────────────────────────

def test_varga_confirmation_reads_the_divisional_lagna():
    """Same D10 lord position, two D10 lagnas → two different L4 verdicts; a map
    without LAGNA keeps the D1 frame."""
    from app.services.life_areas_service import _score_area

    bodies = {g: SimpleNamespace(rasi=1, is_retrograde=False) for g in
              ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")}
    lagna = 1  # Mesha: 10th house Magaram, lord SATURN
    base = dict(
        area="CAREER", natal_moon_rasi=1, transit_bodies=bodies, maha_lord="SUN", antar_lord="MOON",
        sani_cycle_type=None, sani_cycle_active=False, kandaka_sani_active=False, chandrashtama_share=0.0,
        lagna_rasi=lagna,
        natal_planet_scores={g: 50 for g in bodies},
        natal_planet_rasis={g: 1 for g in bodies},
    )
    # D10 Saturn in rasi 10: 10th from a D1-style Mesha frame (kendra, +10) but
    # 6th from a D10 lagna in Kanni (dusthana, -5).
    _, from_varga_lagna, _ = _score_area(**base, vargas={"D10": {"SATURN": 10, "LAGNA": 5}})
    _, from_d1_frame, _ = _score_area(**base, vargas={"D10": {"SATURN": 10}})
    _, same_lagna, _ = _score_area(**base, vargas={"D10": {"SATURN": 10, "LAGNA": 1}})
    assert from_d1_frame == same_lagna
    assert from_varga_lagna != from_d1_frame
