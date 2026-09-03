from datetime import datetime
from types import SimpleNamespace

import pytest

from app.calculations import ephemeris
from app.calculations.astro import local_datetime_to_utc, utc_datetime_to_julian_day
from app.calculations.ephemeris import (
    RiseTransitUndefinedError,
    calculate_lagna_degree,
    calculate_sidereal_planets,
    calculate_sun_moon_longitudes,
)


def test_sidereal_planets_from_documented_birth_datetime():
    birth_datetime_utc = local_datetime_to_utc(
        datetime(1993, 3, 15, 8, 15),
        "Asia/Kolkata",
    )
    jd_ut = utc_datetime_to_julian_day(birth_datetime_utc)

    snapshot = calculate_sidereal_planets(jd_ut)

    assert snapshot.backend in {"pyswisseph", "swisseph-ffi"}
    assert snapshot.ayanamsa == "LAHIRI"
    assert snapshot.ayanamsa_value_degrees == pytest.approx(23.76211742, abs=0.01)
    assert snapshot.jd_ut == jd_ut
    assert snapshot.bodies["SUN"].absolute_longitude == pytest.approx(330.76342508, abs=0.01)
    assert snapshot.bodies["MOON"].absolute_longitude == pytest.approx(240.01137891, abs=0.01)
    assert snapshot.bodies["RAHU"].absolute_longitude == pytest.approx(232.78702194, abs=0.01)
    assert snapshot.bodies["KETU"].absolute_longitude == pytest.approx(52.78702194, abs=0.01)
    assert snapshot.bodies["SUN"].is_retrograde is False
    assert snapshot.bodies["SUN"].show_retrograde_badge is False
    assert snapshot.bodies["MOON"].show_retrograde_badge is False
    assert snapshot.bodies["RAHU"].show_retrograde_badge is False
    assert snapshot.bodies["KETU"].show_retrograde_badge is False
    assert snapshot.bodies["MERCURY"].is_retrograde is True
    assert snapshot.bodies["MERCURY"].show_retrograde_badge is True
    assert snapshot.bodies["VENUS"].is_retrograde is True
    assert snapshot.bodies["JUPITER"].is_retrograde is True
    assert snapshot.bodies["KETU"].absolute_longitude == pytest.approx(
        (snapshot.bodies["RAHU"].absolute_longitude + 180.0) % 360.0,
        abs=1e-9,
    )


def test_t020_lagna_changes_once_within_two_hour_window_for_chennai():
    latitude = 13.0827
    longitude = 80.2707
    times = [(8, 0), (8, 30), (9, 0), (9, 30), (10, 0)]

    lagna_rasis: list[int] = []
    for hour, minute in times:
        birth_datetime_utc = local_datetime_to_utc(
            datetime(1993, 3, 16, hour, minute),
            "Asia/Kolkata",
        )
        jd_ut = utc_datetime_to_julian_day(birth_datetime_utc)
        lagna_degree = calculate_lagna_degree(jd_ut, latitude, longitude)
        lagna_rasis.append(int((lagna_degree % 360) // 30) + 1)

    changes = sum(1 for i in range(1, len(lagna_rasis)) if lagna_rasis[i] != lagna_rasis[i - 1])
    assert changes == 1


def test_sun_moon_shortcut_matches_the_full_snapshot_exactly():
    """The narrow query must never become a *different* query.

    ``calculate_sun_moon_longitudes`` exists only to spare the panchangam's
    boundary searches the six bodies a tithi/nakshatra/yoga angle does not
    involve — it is the same Swiss Ephemeris call with the same flags, so it owes
    bit-identical longitudes, not merely close ones. ``approx`` would hide
    exactly the drift this guards: a changed flag or a missing
    ``set_lahiri_ayanamsa`` would move results by a fraction of a degree and
    silently shift every tithi boundary in the product.

    Swept across the year because the Moon is the fast body here, and a single
    instant could agree by luck.
    """
    for month in range(1, 13):
        birth_datetime_utc = local_datetime_to_utc(
            datetime(1993, month, 15, 8, 15),
            "Asia/Kolkata",
        )
        jd_ut = utc_datetime_to_julian_day(birth_datetime_utc)

        snapshot = calculate_sidereal_planets(jd_ut)
        sun, moon = calculate_sun_moon_longitudes(jd_ut)

        assert sun == snapshot.bodies["SUN"].absolute_longitude
        assert moon == snapshot.bodies["MOON"].absolute_longitude


def _pyswisseph_2_10_rise_trans(recorded: dict[str, object]):
    """A stand-in with pyswisseph 2.10.3.2's exact ``rise_trans`` binding.

    Source of truth: ``pyswisseph.c``, ``pyswe_rise_trans`` ::

        kwlist = {"tjdut", "body", "rsmi", "geopos", "atpress", "attemp", "flags"}
        PyArg_ParseTupleAndKeywords(args, kwds, "dOiO|ddi", ...)
        return Py_BuildValue("i(dddddddddd)", res, tret[0..9])

    Seven arguments, maximum. ``rsmi`` is parsed as ``i`` and ``geopos`` as a
    3-sequence, so the type checks below are the C parser's, not invented.
    """

    def rise_trans(tjdut, body, rsmi, geopos, atpress=0.0, attemp=0.0, flags=0):
        if not isinstance(rsmi, int) or isinstance(rsmi, bool):
            raise TypeError("swisseph.rise_trans: an integer is required (rsmi)")
        if not isinstance(geopos, (tuple, list)) or len(geopos) != 3:
            raise TypeError("swisseph.rise_trans: geopos: expected a sequence of 3 floats")
        recorded.update(
            tjdut=tjdut, body=body, rsmi=rsmi, geopos=tuple(geopos),
            atpress=atpress, attemp=attemp, flags=flags,
        )
        res = recorded.get("_res", 0)
        return res, (tjdut + 0.25 if res == 0 else 0.0,) + (0.0,) * 9

    return rise_trans


def _use_module_backend(monkeypatch, recorded: dict[str, object]) -> None:
    """Force the pyswisseph branch of the ephemeris on a swisseph-ffi machine."""
    fake_module = SimpleNamespace(rise_trans=_pyswisseph_2_10_rise_trans(recorded))
    monkeypatch.setattr(ephemeris, "swe_module", fake_module, raising=False)
    monkeypatch.setattr(ephemeris, "_HAS_MODULE_API", True, raising=False)
    monkeypatch.setattr(ephemeris, "SUN", 0, raising=False)
    monkeypatch.setattr(ephemeris, "CALC_RISE", 1, raising=False)
    monkeypatch.setattr(ephemeris, "CALC_SET", 2, raising=False)
    monkeypatch.setattr(ephemeris, "FLG_SWIEPH", 987654, raising=False)


@pytest.mark.parametrize(
    ("rise", "expected_direction_bit"),
    [(True, 1), (False, 2)],
    ids=["sunrise", "sunset"],
)
def test_module_backend_calls_rise_trans_with_the_pyswisseph_signature(
    monkeypatch, rise: bool, expected_direction_bit: int
) -> None:
    """Pin the call shape of a branch this machine can never execute.

    Python >= 3.14 has no pyswisseph wheel (PyPI ships cp36-cp311 only), so
    ``pyproject.toml`` resolves the dev machine to ``swisseph-ffi`` and
    ``calculate_rise_transit_jd``'s ``_HAS_MODULE_API`` branch is unreachable
    here — while the ``python:3.12-slim`` API image and CI take *only* that
    branch. A call with eight arguments in the pre-2.x order (and an
    ``except TypeError`` fallback that passed eight again) therefore stayed
    invisible locally and raised on every sunrise in CI, taking every
    sunrise-anchored panchangam field down with it.

    Asserting against a faithful copy of the C binding is what makes this
    runnable on both backends.
    """
    recorded: dict[str, object] = {}
    _use_module_backend(monkeypatch, recorded)

    jd_start = 2461055.0
    jd = ephemeris.calculate_rise_transit_jd(jd_start, 13.0827, 80.2707, rise=rise)

    assert jd == jd_start + 0.25
    assert recorded["tjdut"] == jd_start
    assert recorded["body"] == 0
    # geopos is (longitude, latitude, altitude) — eastern/northern positive.
    assert recorded["geopos"] == (80.2707, 13.0827, 0.0)
    assert recorded["rsmi"] == expected_direction_bit | ephemeris._RSMI_HINDU_RISING
    assert recorded["flags"] == 987654
    assert recorded["atpress"] == 0.0
    assert recorded["attemp"] == 0.0


def test_module_backend_reports_circumpolar_as_rise_transit_undefined(monkeypatch) -> None:
    """``res == -2`` is pyswisseph's documented "object is circumpolar", and the
    panchangam turns that into a clean 4xx rather than a 500."""
    recorded: dict[str, object] = {"_res": -2}
    _use_module_backend(monkeypatch, recorded)

    with pytest.raises(RiseTransitUndefinedError):
        ephemeris.calculate_rise_transit_jd(2461055.0, 78.22, 15.65, rise=True)
