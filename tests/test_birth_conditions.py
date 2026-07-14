"""Golden tests for the birth-time micro-condition engine (Border Alert module).

Covers Cazimi, Sankranti birth, and Grahana (eclipse) birth — the three
astronomically-unambiguous conditions surfaced live. Tithi Shoonya and Dagda
rasi are astrologer-gated (empty tables) and are asserted dormant here so a
future table addition is a deliberate, tested change.
"""
from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.calculations import birth_conditions as bc
from app.calculations.chart_strength import compute_natal_planet_score
from app.calculations.transits import is_cazimi, is_combust
from app.services._chart_build import _apply_birth_condition_penalties

pytestmark = pytest.mark.no_db


def _flag(code: str, *, present: bool = True, **detail: object) -> bc.BirthConditionFlag:
    """Minimal BirthConditionFlag for penalty-map tests (text fields don't matter)."""
    return bc.BirthConditionFlag(
        code=code,
        is_present=present,
        severity="ALERT",
        title_ta="",
        title_en="",
        description_ta="",
        description_en="",
        detail=dict(detail),
    )


# --------------------------------------------------------------------------- #
# Cazimi
# --------------------------------------------------------------------------- #
def test_cazimi_within_orb() -> None:
    sun = 100.0
    # Mercury 10 arc-minutes from the Sun -> inside the 0°17' cazimi orb.
    assert is_cazimi("MERCURY", 100.0 + 10.0 / 60.0, sun) is True


def test_cazimi_outside_orb_is_only_combust() -> None:
    sun = 100.0
    merc = 100.0 + 1.0  # 1° away: combust but not cazimi
    assert is_cazimi("MERCURY", merc, sun) is False
    assert is_combust("MERCURY", merc, sun, False) is True


def test_cazimi_excludes_sun_and_nodes() -> None:
    assert is_cazimi("SUN", 100.0, 100.0) is False
    assert is_cazimi("RAHU", 100.0, 100.0) is False
    assert is_cazimi("KETU", 100.0, 100.0) is False


def test_cazimi_beats_combust_in_strength() -> None:
    """A cazimi planet must score higher than the same planet merely combust."""
    sun = 100.0
    cazimi_lon = 100.0 + 5.0 / 60.0   # inside cazimi orb
    combust_lon = 100.0 + 3.0         # combust but not cazimi
    lagna_rasi = 1

    cazimi_score = compute_natal_planet_score(
        "MERCURY", 4, cazimi_lon, lagna_rasi, sun, False
    )
    combust_score = compute_natal_planet_score(
        "MERCURY", 4, combust_lon, lagna_rasi, sun, False
    )
    assert cazimi_score > combust_score


# --------------------------------------------------------------------------- #
# Sankranti birth
# --------------------------------------------------------------------------- #
def test_sankranti_birth_true_on_sign_change() -> None:
    assert bc.is_sankranti_birth(1, 2) is True


def test_sankranti_birth_false_within_one_sign() -> None:
    assert bc.is_sankranti_birth(5, 5) is False


def test_sun_rasi_day_bounds_detects_crossing() -> None:
    # Sun at 29.7° of Mesha (=29.7 abs) moving ~1°/day, born at local noon.
    # By next midnight the Sun has crossed into Rishabam (rasi 2).
    start, end = bc.sun_rasi_day_bounds(29.7, 1.0, 0.5)
    assert start == 1
    assert end == 2


def test_sun_rasi_day_bounds_no_crossing_midsign() -> None:
    start, end = bc.sun_rasi_day_bounds(135.0, 1.0, 0.5)  # 15° of Simmam
    assert start == end == 5


# --------------------------------------------------------------------------- #
# Grahana (eclipse) birth
# --------------------------------------------------------------------------- #
def test_grahana_solar_eclipse() -> None:
    # New Moon (Sun~Moon) sitting on Rahu -> solar eclipse.
    present, kind, node = bc.detect_grahana_birth(50.0, 51.0, 52.0)
    assert present is True
    assert kind == "SOLAR"
    assert node == 1  # near Rahu


def test_grahana_lunar_eclipse() -> None:
    # Full Moon: Sun at 50°, Moon at 230° (opposite), Moon on Rahu at 231°.
    present, kind, node = bc.detect_grahana_birth(50.0, 230.0, 231.0)
    assert present is True
    assert kind == "LUNAR"


def test_grahana_absent_when_luminaries_off_node() -> None:
    # New Moon but nowhere near the nodal axis.
    present, kind, _ = bc.detect_grahana_birth(50.0, 51.0, 200.0)
    assert present is False
    assert kind is None


def test_grahana_absent_when_not_syzygy() -> None:
    # Sun on Rahu but Moon at quadrature -> no eclipse.
    present, _, _ = bc.detect_grahana_birth(50.0, 140.0, 51.0)
    assert present is False


# --------------------------------------------------------------------------- #
# Astrologer-gated tables stay dormant
# --------------------------------------------------------------------------- #
def test_tithi_shoonya_retired_as_dagda_duplicate() -> None:
    # EC-1: the former TITHI_SHOONYA flag was keyed tithi -> rasi(s), i.e. the
    # same phenomenon as Dagda Rasi, so it was retired (2026-07-14). Its symbols
    # must no longer exist on the module.
    assert not hasattr(bc, "tithi_shoonya_rasis")
    assert not hasattr(bc, "TITHI_SHOONYA_TABLE")
    assert not hasattr(bc, "TITHI_SHOONYA_TABLE_VERIFIED")


def test_dagda_rasi_tithi_keyed_golden() -> None:
    # EC-2: authoritative tithi-keyed "Zero Rasi" table (live session 2026-07-14).
    # Signature is now tithi-keyed (paksha-independent), returning a tuple.
    assert bc.DAGDA_RASI_TABLE_VERIFIED is True
    assert bc.dagda_rasi(1) == (7, 10)          # Pratipada
    assert bc.dagda_rasi(5) == (3, 6)           # Panchami
    assert bc.dagda_rasi(8) == (3, 6)           # Ashtami mirrors Panchami
    assert bc.dagda_rasi(9) == (5, 8)
    assert bc.dagda_rasi(10) == (5, 8)          # mirrors Navami
    assert bc.dagda_rasi(14) == (12, 3, 6, 9)   # Chaturdashi — four burnt signs
    # Paksha-independence: Krishna-paksha tithi 16 resolves to name 1.
    assert bc.dagda_rasi(16) == bc.dagda_rasi(1)
    # Purnima (15) and Amavasya (30) have no burnt sign.
    assert bc.dagda_rasi(15) == ()
    assert bc.dagda_rasi(30) == ()


# --------------------------------------------------------------------------- #
# Aggregator
# --------------------------------------------------------------------------- #
def test_detect_birth_conditions_rolls_up_present_only() -> None:
    # Cazimi Mercury + Sankranti day + solar eclipse all at once.
    longitudes = {
        "SUN": 50.0,
        "MOON": 51.0,
        "MERCURY": 50.0 + 5.0 / 60.0,
        "RAHU": 52.0,
    }
    flags = bc.detect_birth_conditions(
        planet_longitudes=longitudes,
        tithi_number=bc.tithi_number_from_longitudes(50.0, 51.0),
        sun_rasi_day_start=1,
        sun_rasi_day_end=2,
        cazimi_planets=["MERCURY"],
    )
    codes = {f.code for f in flags}
    assert "CAZIMI" in codes
    assert "SANKRANTI_BIRTH" in codes
    assert "GRAHANA_BIRTH" in codes
    # TITHI_SHOONYA was retired (EC-1) and must never reappear. DAGDA_RASI is
    # verified (EC-2) and tithi 1 is a dagda tithi (burnt Tula/Makara).
    assert "TITHI_SHOONYA" not in codes
    assert "DAGDA_RASI" in codes
    assert all(f.is_present for f in flags)


def test_detect_birth_conditions_empty_when_clean() -> None:
    # Tithi 15 (Purnima) has no dagda/shoonya sign, keeping this case clean now
    # that DAGDA_RASI is verified.
    longitudes = {"SUN": 50.0, "MOON": 140.0, "RAHU": 200.0}
    flags = bc.detect_birth_conditions(
        planet_longitudes=longitudes,
        tithi_number=15,
        sun_rasi_day_start=2,
        sun_rasi_day_end=2,
        cazimi_planets=[],
    )
    assert flags == []


# --------------------------------------------------------------------------- #
# EC-7.2 — birth-condition scoring (Sankranti/Grahana natal strength penalties)
# --------------------------------------------------------------------------- #
def test_penalty_magnitudes_are_locked() -> None:
    # The astrologer-approved magnitudes: Grahana on par with gandanta (-10),
    # Sankranti half of that (-5). Regression lock so a silent retune is caught.
    assert bc.GRAHANA_LUMINARY_PENALTY == 10.0
    assert bc.SANKRANTI_SUN_PENALTY == 5.0


def test_penalties_empty_when_no_boundary_condition() -> None:
    # Cazimi and Dagda are present but must NOT score here — cazimi is resolved
    # per-planet inside chart_strength, Dagda stays display-only.
    flags = [_flag("CAZIMI"), _flag("DAGDA_RASI", burnt_rasis=[7, 10])]
    assert bc.birth_condition_strength_penalties(flags) == {}


def test_penalties_sankranti_hits_sun_only() -> None:
    flags = [_flag("SANKRANTI_BIRTH", from_rasi=1, to_rasi=2)]
    assert bc.birth_condition_strength_penalties(flags) == {"SUN": 5.0}


def test_penalties_solar_eclipse_hits_both_luminaries() -> None:
    # Solar eclipse (New Moon on the node) shadows both Sun and Moon.
    flags = [_flag("GRAHANA_BIRTH", eclipse_type="SOLAR", near_node="Rahu")]
    assert bc.birth_condition_strength_penalties(flags) == {"SUN": 10.0, "MOON": 10.0}


def test_penalties_lunar_eclipse_hits_moon_only() -> None:
    # Lunar eclipse (Full Moon on the node) shadows the Moon; the Sun is the
    # light source, not the shadowed body.
    flags = [_flag("GRAHANA_BIRTH", eclipse_type="LUNAR", near_node="Rahu")]
    assert bc.birth_condition_strength_penalties(flags) == {"MOON": 10.0}


def test_penalties_stack_when_sankranti_and_solar_eclipse_coincide() -> None:
    flags = [
        _flag("SANKRANTI_BIRTH", from_rasi=1, to_rasi=2),
        _flag("GRAHANA_BIRTH", eclipse_type="SOLAR"),
    ]
    assert bc.birth_condition_strength_penalties(flags) == {"SUN": 15.0, "MOON": 10.0}


def test_penalties_ignore_absent_flags() -> None:
    flags = [_flag("GRAHANA_BIRTH", present=False, eclipse_type="SOLAR")]
    assert bc.birth_condition_strength_penalties(flags) == {}


def test_penalties_derive_from_real_detection_single_source() -> None:
    # End-to-end: detection -> penalty map (no duplicated eclipse geometry).
    # Cazimi Mercury + Sankranti day + solar eclipse, same scenario as the
    # aggregator test above. Only Sun/Moon are penalised; Mercury (cazimi) is not.
    longitudes = {"SUN": 50.0, "MOON": 51.0, "MERCURY": 50.0 + 5.0 / 60.0, "RAHU": 52.0}
    flags = bc.detect_birth_conditions(
        planet_longitudes=longitudes,
        tithi_number=bc.tithi_number_from_longitudes(50.0, 51.0),
        sun_rasi_day_start=1,
        sun_rasi_day_end=2,
        cazimi_planets=["MERCURY"],
    )
    assert bc.birth_condition_strength_penalties(flags) == {"SUN": 15.0, "MOON": 10.0}


def test_apply_penalties_lowers_luminaries_and_floors_at_10() -> None:
    planets = [
        SimpleNamespace(graha="SUN", strength_score=60),
        SimpleNamespace(graha="MOON", strength_score=14),   # will floor at 10
        SimpleNamespace(graha="MARS", strength_score=70),   # untouched
    ]
    _apply_birth_condition_penalties(planets, {"SUN": 15.0, "MOON": 10.0})
    assert planets[0].strength_score == 45   # 60 - 15
    assert planets[1].strength_score == 10   # max(10, 14 - 10) -> 10 (floored)
    assert planets[2].strength_score == 70   # unaffected


def test_apply_penalties_noop_on_empty_map() -> None:
    planets = [SimpleNamespace(graha="SUN", strength_score=60)]
    _apply_birth_condition_penalties(planets, {})
    assert planets[0].strength_score == 60
