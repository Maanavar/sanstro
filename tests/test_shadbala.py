"""Golden / unit cases for the full classical Shadbala engine
(app/calculations/shadbala.py), Depth Expansion Plan Phase 2.

Per the plan's guiding principle #2, every sub-formula gets a hand-checked
case rather than only a smoke test. Each assertion below is computed by hand
from the cited classical rule in the source module, not read back from the
implementation. Full end-to-end cross-validation against Jagannatha Hora's
Rupa totals is the remaining gate before the experimental label is removed
(plan §2 validation note) — these lock the deterministic pieces meanwhile.
"""
from __future__ import annotations

import pytest

from app.calculations.shadbala import (
    NAISARGIKA_VIRUPA,
    REQUIRED_RUPAS,
    SHADBALA_GRAHAS,
    PlanetInput,
    ShadbalaContext,
    _ayana_bala,
    _dig_bala,
    _drekkana_bala,
    _drik_bala,
    _hora_lord,
    _kendradi_bala,
    _nathonnatha_bala,
    _oja_yugma_bala,
    _paksha_bala,
    _saptavargaja_bala,
    _tribhaga_bala,
    _uchcha_bala,
    _vara_bala,
    compute_shadbala,
    declination_from_longitude,
    mean_obliquity,
)

pytestmark = pytest.mark.no_db


# ---------------------------------------------------------------------------
# Sthana Bala sub-components
# ---------------------------------------------------------------------------

def test_uchcha_bala_peaks_at_deep_exaltation():
    # Sun deep exaltation = 10° Aries (lon 10). Distance from its deep
    # debilitation (10° Libra, lon 190) is 180° → 180/3 = 60 (max).
    assert _uchcha_bala("SUN", 10.0) == pytest.approx(60.0)


def test_uchcha_bala_zero_at_deep_debilitation():
    # Sun at 10° Libra (lon 190) sits on the deep-debilitation point → 0.
    assert _uchcha_bala("SUN", 190.0) == pytest.approx(0.0)


def test_uchcha_bala_midpoint():
    # Sun at lon 100 → 90° from deep debilitation (190) → 90/3 = 30.
    assert _uchcha_bala("SUN", 100.0) == pytest.approx(30.0)


def test_saptavargaja_moolatrikona_in_d1_plus_own_elsewhere():
    # Sun at 5° Leo: D1 is Moolatrikona (Leo 0-20°) → 45; the other six
    # vargas placed in Leo (own sign) → 30 each. Total 45 + 6*30 = 225.
    varga_rasis = {c: 5 for c in ("D1", "D2", "D3", "D7", "D9", "D12", "D30")}
    got = _saptavargaja_bala("SUN", varga_rasis, 125.0, {"SUN": 5})
    assert got == pytest.approx(45.0 + 6 * 30.0)


def test_saptavargaja_own_sign_without_moolatrikona():
    # Sun at 25° Leo: past the Moolatrikona zone (0-20°), so D1 is own (30);
    # all seven vargas own → 7*30 = 210.
    varga_rasis = {c: 5 for c in ("D1", "D2", "D3", "D7", "D9", "D12", "D30")}
    got = _saptavargaja_bala("SUN", varga_rasis, 145.0, {"SUN": 5})
    assert got == pytest.approx(7 * 30.0)


def test_oja_yugma_odd_planet_in_odd_rasi_and_navamsa():
    # Sun wants odd (oja): odd rasi (+15) and odd navamsa (+15) = 30.
    assert _oja_yugma_bala("SUN", rasi=1, d9_rasi=1) == pytest.approx(30.0)
    # Even rasi, even navamsa → 0 for an odd-preferring planet.
    assert _oja_yugma_bala("SUN", rasi=2, d9_rasi=2) == pytest.approx(0.0)


def test_oja_yugma_moon_and_venus_prefer_even():
    assert _oja_yugma_bala("MOON", rasi=2, d9_rasi=2) == pytest.approx(30.0)
    assert _oja_yugma_bala("VENUS", rasi=4, d9_rasi=6) == pytest.approx(30.0)
    assert _oja_yugma_bala("MOON", rasi=1, d9_rasi=1) == pytest.approx(0.0)


def test_kendradi_bala_bands():
    assert _kendradi_bala(1) == 60.0
    assert _kendradi_bala(4) == 60.0
    assert _kendradi_bala(2) == 30.0
    assert _kendradi_bala(11) == 30.0
    assert _kendradi_bala(3) == 15.0
    assert _kendradi_bala(12) == 15.0


def test_drekkana_bala_by_sex_and_decanate():
    assert _drekkana_bala("SUN", 5.0) == 15.0     # male, 1st decanate
    assert _drekkana_bala("MOON", 25.0) == 15.0   # female, 3rd decanate
    assert _drekkana_bala("MERCURY", 15.0) == 15.0  # neutral, 2nd decanate
    assert _drekkana_bala("SUN", 15.0) == 0.0     # male but wrong decanate


# ---------------------------------------------------------------------------
# Dig Bala (spec §8.1)
# ---------------------------------------------------------------------------

def test_dig_bala_peaks_at_own_direction():
    asc, mc = 0.0, 270.0
    # Jupiter peaks at East (=Asc, lon 0). On the Asc → (180-0)/3 = 60.
    assert _dig_bala("JUPITER", 0.0, asc, mc) == pytest.approx(60.0)
    # Sun peaks at South (=MC, lon 270). On the MC → 60.
    assert _dig_bala("SUN", 270.0, asc, mc) == pytest.approx(60.0)


def test_dig_bala_zero_opposite_own_direction():
    asc, mc = 0.0, 270.0
    # Jupiter opposite its peak (East) is West (lon 180) → sep 180 → 0.
    assert _dig_bala("JUPITER", 180.0, asc, mc) == pytest.approx(0.0)


# ---------------------------------------------------------------------------
# Kala Bala sub-components
# ---------------------------------------------------------------------------

def _ctx(**kw):
    base = dict(asc_longitude=0.0, mc_longitude=270.0, weekday=0,
               birth_clock_hours=12.0, sunrise_hours=6.0, sunset_hours=18.0)
    base.update(kw)
    return ShadbalaContext(**base)


def test_nathonnatha_mercury_always_full():
    assert _nathonnatha_bala("MERCURY", _ctx(birth_clock_hours=3.0)) == 60.0


def test_nathonnatha_diurnal_peaks_at_noon():
    # Noon birth (sunrise 6, sunset 18 → noon 12): diurnal planets peak at 60.
    assert _nathonnatha_bala("SUN", _ctx(birth_clock_hours=12.0)) == pytest.approx(60.0)
    # Nocturnal planet at noon → 0.
    assert _nathonnatha_bala("SATURN", _ctx(birth_clock_hours=12.0)) == pytest.approx(0.0)


def test_nathonnatha_nocturnal_peaks_at_midnight():
    assert _nathonnatha_bala("MOON", _ctx(birth_clock_hours=0.0)) == pytest.approx(60.0)


def test_paksha_bala_full_moon_benefic_vs_malefic():
    # Sun 0°, Moon 180° → full elongation. Benefic gets 60, malefic gets 0.
    assert _paksha_bala("JUPITER", 0.0, 180.0) == pytest.approx(60.0)
    assert _paksha_bala("SATURN", 0.0, 180.0) == pytest.approx(0.0)
    # Moon's own Paksha Bala is doubled → 120.
    assert _paksha_bala("MOON", 0.0, 180.0) == pytest.approx(120.0)


def test_vara_bala_weekday_lord():
    assert _vara_bala("SUN", _ctx(weekday=0)) == 45.0        # Sunday → Sun
    assert _vara_bala("JUPITER", _ctx(weekday=4)) == 45.0    # Thursday → Jupiter
    assert _vara_bala("MARS", _ctx(weekday=0)) == 0.0


def test_hora_lord_chaldean_sequence_on_sunday():
    # Sunday sunrise hora is the Sun; the next is Venus (Chaldean order).
    assert _hora_lord(_ctx(weekday=0, birth_clock_hours=6.0)) == "SUN"
    assert _hora_lord(_ctx(weekday=0, birth_clock_hours=7.0)) == "VENUS"


def test_tribhaga_jupiter_always_and_day_lords():
    ctx = _ctx(weekday=0, birth_clock_hours=7.0)  # first third of the day
    assert _tribhaga_bala("JUPITER", ctx) == 60.0     # Jupiter always
    assert _tribhaga_bala("MERCURY", ctx) == 60.0     # 1st day third → Mercury
    assert _tribhaga_bala("SUN", ctx) == 0.0


def test_ayana_bala_sun_doubled_and_declination_direction():
    # Declination unknown → neutral 30.
    assert _ayana_bala("SUN", None) == pytest.approx(30.0)
    # Sun at 0 declination → (24/48)*60 = 30, doubled → 60.
    assert _ayana_bala("SUN", 0.0) == pytest.approx(60.0)
    # Sun at max north declination (+24) → 60, doubled → 120.
    assert _ayana_bala("SUN", 24.0) == pytest.approx(120.0)
    # Moon strong in south: +24 north declination → effective −24 → 0.
    assert _ayana_bala("MOON", 24.0) == pytest.approx(0.0)


# ---------------------------------------------------------------------------
# Naisargika & Drik
# ---------------------------------------------------------------------------

def test_naisargika_fixed_table():
    assert NAISARGIKA_VIRUPA["SUN"] == pytest.approx(60.0)
    assert NAISARGIKA_VIRUPA["SATURN"] == pytest.approx(8.57)
    # Strictly descending Sun→Saturn.
    order = ["SUN", "MOON", "VENUS", "JUPITER", "MERCURY", "MARS", "SATURN"]
    vals = [NAISARGIKA_VIRUPA[p] for p in order]
    assert vals == sorted(vals, reverse=True)


def test_drik_bala_malefic_aspect_subtracts():
    # Saturn in rasi 1 casts its 7th aspect onto rasi 7; Moon there loses 10
    # from the 30 baseline → 20.
    rasi_map = {"MOON": 7, "SATURN": 1}
    assert _drik_bala("MOON", 7, rasi_map) == pytest.approx(20.0)


def test_drik_bala_benefic_aspect_adds():
    # Jupiter in rasi 1 aspects its 5th/7th/9th; a planet in rasi 7 gains 10.
    rasi_map = {"MARS": 7, "JUPITER": 1}
    assert _drik_bala("MARS", 7, rasi_map) == pytest.approx(40.0)


def test_drik_bala_ignores_nodes_even_if_a_direct_map_includes_them():
    # Rahu/Ketu are excluded from classical seven-graha Shadbala.
    assert _drik_bala("MARS", 7, {"MARS": 7, "RAHU": 1}) == pytest.approx(30.0)


# ---------------------------------------------------------------------------
# Declination helper
# ---------------------------------------------------------------------------

def test_declination_from_longitude_at_solstice_points():
    obliquity = 23.44
    # Tropical 90° (summer solstice point) → declination = +obliquity.
    d = declination_from_longitude(sidereal_longitude=90.0, ayanamsa=0.0, obliquity=obliquity)
    assert d == pytest.approx(obliquity, abs=1e-6)
    # Tropical 0° (equinox) → 0 declination.
    d0 = declination_from_longitude(sidereal_longitude=0.0, ayanamsa=0.0, obliquity=obliquity)
    assert d0 == pytest.approx(0.0, abs=1e-9)


def test_mean_obliquity_near_23_44_for_modern_epoch():
    # J2000.0 obliquity ≈ 23.4393°.
    assert mean_obliquity(2451545.0) == pytest.approx(23.4393, abs=1e-3)


# ---------------------------------------------------------------------------
# Full assembly
# ---------------------------------------------------------------------------

def _sample_planets() -> dict[str, PlanetInput]:
    # A synthetic, clearly-non-real set of longitudes spread across the zodiac.
    return {
        "SUN": PlanetInput(longitude=10.0, is_retrograde=False, speed_deg_per_day=0.98, declination=4.0),
        "MOON": PlanetInput(longitude=185.0, is_retrograde=False, speed_deg_per_day=13.2, declination=-5.0),
        "MARS": PlanetInput(longitude=95.0, is_retrograde=False, speed_deg_per_day=0.5, declination=10.0),
        "MERCURY": PlanetInput(longitude=25.0, is_retrograde=True, speed_deg_per_day=-0.3, declination=2.0),
        "JUPITER": PlanetInput(longitude=250.0, is_retrograde=False, speed_deg_per_day=0.08, declination=-12.0),
        "VENUS": PlanetInput(longitude=320.0, is_retrograde=False, speed_deg_per_day=1.1, declination=-15.0),
        "SATURN": PlanetInput(longitude=200.0, is_retrograde=True, speed_deg_per_day=-0.02, declination=-18.0),
    }


def test_compute_shadbala_returns_all_seven_grahas():
    result = compute_shadbala(_sample_planets(), _ctx())
    assert set(result.keys()) == set(SHADBALA_GRAHAS)


def test_compute_shadbala_total_equals_sum_of_components():
    result = compute_shadbala(_sample_planets(), _ctx())
    for ps in result.values():
        parts = ps.sthana + ps.dig + ps.kala + ps.chesta + ps.naisargika + ps.drik
        assert ps.total_virupa == pytest.approx(parts, abs=0.05)
        assert ps.rupas == pytest.approx(ps.total_virupa / 60.0, abs=0.01)
        assert ps.required_rupas == REQUIRED_RUPAS[ps.graha]
        assert ps.is_strong == (ps.rupas >= ps.required_rupas)


def test_compute_shadbala_sthana_components_sum_to_sthana():
    result = compute_shadbala(_sample_planets(), _ctx())
    for ps in result.values():
        assert ps.sthana == pytest.approx(sum(ps.sthana_components.values()), abs=0.05)


def test_compute_shadbala_retrograde_gets_full_chesta():
    # Saturn and Mercury are retrograde in the sample → Vakra Chesta = 60.
    result = compute_shadbala(_sample_planets(), _ctx())
    assert result["SATURN"].chesta == pytest.approx(60.0)
    assert result["MERCURY"].chesta == pytest.approx(60.0)


def test_compute_shadbala_sun_chesta_equals_ayana():
    result = compute_shadbala(_sample_planets(), _ctx())
    assert result["SUN"].chesta == pytest.approx(result["SUN"].kala_components["ayana"])
