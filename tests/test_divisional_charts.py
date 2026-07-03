import pytest

from app.calculations.astro import navamsa_rasi_from_degree
from app.calculations.divisional_charts import (
    compute_d2,
    compute_d27,
    compute_d45,
    compute_d60,
    get_varga,
)

pytestmark = pytest.mark.no_db


def test_d2_hora_for_even_sign_boundary():
    # 14° Taurus (even sign, first half) => Moon hora => Cancer (4)
    out = compute_d2({"SUN": 44.0})
    assert out["SUN"] == 4


def test_d9_dispatch_matches_existing_navamsa():
    samples = [0.5, 32.1, 95.0, 180.0, 271.2]
    for lon in samples:
        out = get_varga(9, {"P": lon})
        assert out["P"] == navamsa_rasi_from_degree(lon)


def test_get_varga_unsupported_raises():
    with pytest.raises(ValueError):
        get_varga(5, {"SUN": 10.0})


# ---------------------------------------------------------------------------
# D27 (Nakshatramsa/Bhamsa) — element-group golden cases, hand-computed
# against the standard Parashari rule (fire/earth/air/water quartets).
# ---------------------------------------------------------------------------

def test_d27_fire_sign_starts_aries():
    # 5° Aries (fire sign) => part 4 => Aries + 4 = Leo (5)
    out = compute_d27({"P": 5.0})
    assert out["P"] == 5


def test_d27_earth_sign_starts_cancer():
    # 5° Taurus (earth sign) => part 4 => Cancer + 4 = Scorpio (8)
    out = compute_d27({"P": 35.0})
    assert out["P"] == 8


def test_d27_air_sign_starts_libra():
    # 5° Gemini (air sign) => part 4 => Libra + 4 = Aquarius (11)
    out = compute_d27({"P": 65.0})
    assert out["P"] == 11


def test_d27_water_sign_starts_capricorn():
    # 5° Cancer (water sign) => part 4 => Capricorn + 4 = Taurus (2)
    out = compute_d27({"P": 95.0})
    assert out["P"] == 2


def test_d27_dispatch_matches_direct_call():
    assert get_varga(27, {"P": 35.0}) == compute_d27({"P": 35.0})


# ---------------------------------------------------------------------------
# D45 (Akshavedamsa) — movable/fixed/dual golden cases.
# ---------------------------------------------------------------------------

def test_d45_movable_sign_starts_aries():
    # 5° Aries (movable) => part 7 => Aries + 7 = Scorpio (8)
    out = compute_d45({"P": 5.0})
    assert out["P"] == 8


def test_d45_fixed_sign_starts_leo():
    # 5° Taurus (fixed) => part 7 => Leo + 7 = Pisces (12)
    out = compute_d45({"P": 35.0})
    assert out["P"] == 12


def test_d45_dual_sign_starts_sagittarius():
    # 5° Gemini (dual) => part 7 => Sagittarius + 7 = Cancer (4)
    out = compute_d45({"P": 65.0})
    assert out["P"] == 4


def test_d45_dispatch_matches_direct_call():
    assert get_varga(45, {"P": 65.0}) == compute_d45({"P": 65.0})


# ---------------------------------------------------------------------------
# D60 (Shashtiamsa) — spec section 3.13. Regression coverage for the bug
# where the previous implementation ignored the natal rasi and always
# counted forward from Aries, regardless of the planet's actual sign.
# ---------------------------------------------------------------------------

def test_d60_odd_sign_counts_forward_from_own_rasi():
    # 0°15' Aries (odd sign) => index 0 => own sign, Aries (1)
    out = compute_d60({"P": 0.25})
    assert out["P"] == 1


def test_d60_odd_sign_wraps_forward():
    # 15° Aries (odd sign) => index 30 => Aries + 6 signs (30 % 12) = Libra (7)
    out = compute_d60({"P": 15.0})
    assert out["P"] == 7


def test_d60_even_sign_counts_backward_from_own_rasi():
    # 2.1° Taurus (even sign) => index 4 => Taurus - 4 signs = Capricorn (10)
    out = compute_d60({"P": 32.1})
    assert out["P"] == 10


def test_d60_depends_on_natal_rasi_not_just_degree_in_sign():
    # Regression: the old implementation always started counting from Aries,
    # so the same degree-in-sign in two different rasis produced the same
    # result. The fixed formula must vary with the natal rasi.
    same_deg_in_taurus = compute_d60({"P": 32.1})   # Taurus, 2.1°
    same_deg_in_gemini = compute_d60({"P": 62.1})   # Gemini, 2.1°
    assert same_deg_in_taurus["P"] != same_deg_in_gemini["P"]


def test_d60_dispatch_matches_direct_call():
    assert get_varga(60, {"P": 15.0}) == compute_d60({"P": 15.0})
