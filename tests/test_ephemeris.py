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


def test_sidereal_planets_from_synthetic_reference_datetime():
    # Synthetic T003 chart, 1988-06-01 15:44 IST — not a real person's birth.
    birth_datetime_utc = local_datetime_to_utc(
        datetime(1988, 6, 1, 15, 44),
        "Asia/Kolkata",
    )
    jd_ut = utc_datetime_to_julian_day(birth_datetime_utc)

    snapshot = calculate_sidereal_planets(jd_ut)

    assert snapshot.backend in {"pyswisseph", "swisseph-ffi"}
    assert snapshot.ayanamsa == "LAHIRI"
    assert snapshot.ayanamsa_value_degrees == pytest.approx(23.69528030, abs=0.01)
    assert snapshot.jd_ut == jd_ut
    assert snapshot.bodies["SUN"].absolute_longitude == pytest.approx(47.43402212, abs=0.01)
    assert snapshot.bodies["MOON"].absolute_longitude == pytest.approx(240.01252726, abs=0.01)
    assert snapshot.bodies["RAHU"].absolute_longitude == pytest.approx(325.40055158, abs=0.01)
    assert snapshot.bodies["KETU"].absolute_longitude == pytest.approx(145.40055158, abs=0.01)
    assert snapshot.bodies["SUN"].is_retrograde is False
    assert snapshot.bodies["SUN"].show_retrograde_badge is False
    assert snapshot.bodies["MOON"].show_retrograde_badge is False
    assert snapshot.bodies["RAHU"].show_retrograde_badge is False
    assert snapshot.bodies["KETU"].show_retrograde_badge is False
    assert snapshot.bodies["MERCURY"].is_retrograde is True
    assert snapshot.bodies["MERCURY"].show_retrograde_badge is True
    assert snapshot.bodies["VENUS"].is_retrograde is True
    assert snapshot.bodies["SATURN"].is_retrograde is True
    assert snapshot.bodies["SATURN"].show_retrograde_badge is True
    assert snapshot.bodies["JUPITER"].is_retrograde is False
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
            datetime(1988, month, 1, 15, 44),
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
    # The ruled default adds NO extra rsmi bits (apparent upper limb +
    # refraction is Swiss Ephemeris's own default), so rsmi is the bare
    # direction bit. Asserted against the named constant rather than a literal
    # 0, so a future convention change fails here instead of passing silently.
    assert recorded["rsmi"] == expected_direction_bit | ephemeris._RSMI_APPARENT_UPPER_LIMB
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


def test_bundled_swiss_ephemeris_files_are_in_use() -> None:
    """Owner ruling 2026-10-01: the `.se1` files ship in `ephe/` and are loaded
    at import. Every chart before this was computed on the Moshier fallback, and
    nothing said so on the production backend. A real snapshot, not a fake —
    if the path or a file goes missing, the library's own fallback notice
    (FFI) or MOSHIER_FALLBACK_WARNING (pyswisseph) reappears here."""
    assert ephemeris.EPHEMERIS_PATH is not None, "ephe/ not found — set JOTHIDAM_SWISSEPH_PATH"
    snapshot = calculate_sidereal_planets(2461314.5)
    assert not any("Moshier" in w or ".se1" in w for w in snapshot.source_warnings), snapshot.source_warnings


@pytest.mark.parametrize(
    ("retflag", "expected_warning"),
    [
        # SWIEPH bit (2) set, plus the echoed sidereal/speed bits: data files used.
        (2 | 256 | 64 * 1024, ""),
        # MOSEPH bit (4) instead — what this machine actually returns today
        # (65860 = 0x10144) when `sepl_18.se1` is not on the ephemeris path.
        (65860, ephemeris.MOSHIER_FALLBACK_WARNING),
    ],
    ids=["swiss-files", "moshier-fallback"],
)
def test_module_backend_records_moshier_fallback(monkeypatch, retflag: int, expected_warning: str) -> None:
    """pyswisseph reports the fallback only through the return flag. It used to
    be discarded, so the production image could compute on Moshier with no
    record while the FFI branch reported the same fact through `serr`."""
    fake_module = SimpleNamespace(calc_ut=lambda _jd, _pid, _flags: ((10.0, 0.0, 1.0, 0.9, 0.0, 0.0), retflag))
    monkeypatch.setattr(ephemeris, "swe_module", fake_module, raising=False)
    monkeypatch.setattr(ephemeris, "_HAS_MODULE_API", True, raising=False)
    monkeypatch.setattr(ephemeris, "FLG_SWIEPH", 2, raising=False)
    monkeypatch.setattr(ephemeris, "SIDEREAL_FLAGS", 2 | 256 | 64 * 1024, raising=False)

    _longitude, _speed, warning = ephemeris._calc_ut(2461314.5, 0)

    assert warning == expected_warning
