import pytest

from app.calculations.astro import navamsa_rasi_from_degree
from app.calculations.divisional_charts import compute_d2, get_varga


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
