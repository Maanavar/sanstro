import pytest

from app.calculations.astro import navamsa_rasi_from_degree
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.divisional_charts import (
    compute_d2,
    compute_d7,
    compute_d10,
    compute_d24,
    compute_d27,
    compute_d30,
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
# D30 (Trimsamsa) — WI-03: even-sign targets previously repeated the odd-sign
# set (Libra/Gemini/Sag/Aquarius/Aries) instead of each lord's own even sign.
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "longitude,expected_rasi",
    [
        (33.0, 2),    # 3 deg Taurus (even) -> Venus segment -> Taurus (2)
        (100.0, 6),   # 10 deg Cancer (even) -> Mercury segment -> Virgo (6)
        (165.0, 12),  # 15 deg Virgo (even) -> Jupiter segment -> Pisces (12)
        (232.0, 10),  # 22 deg Scorpio (even) -> Saturn segment -> Capricorn (10)
        (358.0, 8),   # 28 deg Pisces (even) -> Mars segment -> Scorpio (8)
        (3.0, 1),     # 3 deg Aries (odd) -> unchanged -> Aries (1)
    ],
)
def test_d30_even_sign_targets(longitude, expected_rasi):
    out = compute_d30({"P": longitude})
    assert out["P"] == expected_rasi


@pytest.mark.parametrize(
    "old_odd_sign_target,new_even_sign_target",
    [
        (7, 2),    # Venus: Libra (odd) vs Taurus (even)
        (3, 6),    # Mercury: Gemini (odd) vs Virgo (even)
        (9, 12),   # Jupiter: Sagittarius (odd) vs Pisces (even)
        (11, 10),  # Saturn: Aquarius (odd) vs Capricorn (even)
        (1, 8),    # Mars: Aries (odd) vs Scorpio (even)
    ],
)
def test_d30_even_sign_fix_preserves_lord_saptavargaja_invariance(old_odd_sign_target, new_even_sign_target):
    # The old (buggy) even-sign table reused the odd-sign targets above; the
    # fixed table points at each lord's own even sign instead. Both targets
    # share the same sign lord, so Saptavargaja bala (which only reads the
    # D30 lord, not the raw sign number) is unaffected by this fix.
    assert SIGN_LORD[old_odd_sign_target] == SIGN_LORD[new_even_sign_target]


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


# ---------------------------------------------------------------------------
# D7 / D10 / D24 — the three vargas the "Chances & Cautions" propensity engine
# reads (children→D7, career→D10, education→D24). Golden values hand-computed
# from the classical Parashari rules and cross-checked, so a silent regression
# in the amsa math is caught rather than shipped as a confident wrong reading.
# (Rasi numbers: 1=Aries … 12=Pisces. Amsa width shown per varga.)
# ---------------------------------------------------------------------------

# D7 Saptamsa — 7 amsas of 4°17′08″; odd signs count from the same sign,
# even signs from the 7th sign.
def test_d7_odd_sign_counts_from_same_sign():
    # 5° Aries (odd) => amsa 1 => Aries + 1 = Taurus (2)
    assert compute_d7({"P": 5.0})["P"] == 2


def test_d7_even_sign_starts_from_seventh_sign():
    # 5° Taurus (even) => amsa 1 => 7th-from-Taurus (Scorpio) + 1 = Sagittarius (9)
    assert compute_d7({"P": 35.0})["P"] == 9


def test_d7_odd_sign_mid_amsa():
    # 25° Aries (odd) => amsa 5 => Aries + 5 = Virgo (6)
    assert compute_d7({"P": 25.0})["P"] == 6


# D10 Dasamsa — 10 amsas of 3°; odd signs count from the same sign, even signs
# from the 9th sign.
def test_d10_odd_sign_counts_from_same_sign():
    # 5° Aries (odd) => amsa 1 => Aries + 1 = Taurus (2)
    assert compute_d10({"P": 5.0})["P"] == 2


def test_d10_even_sign_starts_from_ninth_sign():
    # 5° Taurus (even) => amsa 1 => 9th-from-Taurus (Capricorn) + 1 = Aquarius (11)
    assert compute_d10({"P": 35.0})["P"] == 11


def test_d10_odd_sign_last_amsa():
    # 28° Aries (odd) => amsa 9 => Aries + 9 = Capricorn (10)
    assert compute_d10({"P": 28.0})["P"] == 10


# D24 Chaturvimsamsa/Siddhamsa — 24 amsas of 1°15′; odd signs start from Leo,
# even signs start from Cancer.
def test_d24_odd_sign_starts_from_leo():
    # 0°30′ Aries (odd) => amsa 0 => Leo (5)
    assert compute_d24({"P": 0.5})["P"] == 5


def test_d24_even_sign_starts_from_cancer():
    # 0°30′ Taurus (even) => amsa 0 => Cancer (4)
    assert compute_d24({"P": 30.5})["P"] == 4


def test_d24_odd_sign_mid_amsa():
    # 5° Aries (odd) => amsa 4 => Leo + 4 = Sagittarius (9)
    assert compute_d24({"P": 5.0})["P"] == 9


def test_d7_d10_d24_dispatch_matches_direct_call():
    for lon in (5.0, 35.0, 65.0, 128.7):
        assert get_varga(7, {"P": lon}) == compute_d7({"P": lon})
        assert get_varga(10, {"P": lon}) == compute_d10({"P": lon})
        assert get_varga(24, {"P": lon}) == compute_d24({"P": lon})
