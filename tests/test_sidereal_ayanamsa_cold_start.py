"""The sidereal Ascendant must be Lahiri on the FIRST ephemeris call of a process.

``FLG_SIDEREAL`` says "use the sidereal mode". It does not say *which* — that is
process-global state set by ``swe_set_sid_mode``, and Swiss Ephemeris's own
default is Fagan/Bradley, 0.883208 deg from Lahiri at this epoch.

``calculate_sidereal_planets`` has always called ``set_lahiri_ayanamsa()``, so
the nine real grahas were never affected. Three other functions did not:

  * ``calculate_lagna_degree`` — every sidereal Ascendant, which is what
    Maandhi's longitude IS, and also the sunrise lagna, the lagna-edge
    sensitivity check and birth-time rectification.
  * ``calculate_asc_mc`` — Dig Bala in Shadbala.
  * ``get_lahiri_ayanamsa_ut`` — whose NAME is the promise. It reports whatever
    mode is selected, so cold it returned Fagan/Bradley, and that number is
    stamped into ``chart.ayanamsa_value_degrees`` and shown to the reader.

All three relied on some earlier planet call in the same process. Under
``uvicorn --reload`` the worker restarts on every file save, so whether a value
was Lahiri or Fagan/Bradley depended on which request happened to touch the
ephemeris first — intermittent and unreproducible on demand.

These tests run in a SUBPROCESS on purpose. Nothing else in the suite can assert
"first call in the process": once any test has touched the ephemeris the mode is
set and the assertion cannot fail.

Deliberately pinned to raw ephemeris values, NOT to a Maandhi longitude. The
first version of this file pinned Maandhi, and the owner's 2026-09-29 Maandhi
ruling broke it the same day — an ayanamsa test must not also be a doctrine
test. `tests/test_gulika.py` owns the doctrine, and would pass under either
ayanamsa.
"""

from __future__ import annotations

import subprocess
import sys
import textwrap

# 1993-03-15 09:48:33 UT at 11.1085N 77.3411E.
_JD = 2449061.908715278
_EXPECTED_ASC = 104.97033412042533
_EXPECTED_LAHIRI = 23.762129
_FAGAN_BRADLEY_OFFSET = 0.883208


def _run_cold(body: str) -> str:
    result = subprocess.run(
        [sys.executable, "-c", textwrap.dedent(body)],
        capture_output=True,
        text=True,
        timeout=180,
    )
    assert result.returncode == 0, result.stderr
    return result.stdout.strip()


def test_ascendant_is_lahiri_without_a_preceding_planet_call() -> None:
    out = _run_cold(
        f"""
        from app.calculations.ephemeris import calculate_lagna_degree
        print(repr(calculate_lagna_degree({_JD!r}, 11.1085, 77.3411)))
        """
    )
    got = float(out)
    assert abs(got - _EXPECTED_ASC) < 1e-6, (
        f"cold-start Ascendant is {got}, expected {_EXPECTED_ASC}. "
        f"A gap near {_FAGAN_BRADLEY_OFFSET} deg means the ayanamsa was left at the library default."
    )


def test_ayanamsa_getter_returns_lahiri_when_called_first() -> None:
    out = _run_cold(
        f"""
        from app.calculations.ephemeris import get_lahiri_ayanamsa_ut
        print(repr(get_lahiri_ayanamsa_ut({_JD!r})))
        """
    )
    got = float(out)
    assert abs(got - _EXPECTED_LAHIRI) < 1e-4, (
        f"get_lahiri_ayanamsa_ut returned {got}, expected ~{_EXPECTED_LAHIRI} (Lahiri). "
        f"{_EXPECTED_LAHIRI + _FAGAN_BRADLEY_OFFSET:.6f} would be Fagan/Bradley."
    )


def test_cold_ascendant_matches_warm_ascendant() -> None:
    """The invariant, stated without a pinned constant: order must not matter."""
    out = _run_cold(
        f"""
        from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets

        cold = calculate_lagna_degree({_JD!r}, 11.1085, 77.3411)
        calculate_sidereal_planets({_JD!r})
        warm = calculate_lagna_degree({_JD!r}, 11.1085, 77.3411)
        print(f"{{cold!r}} {{warm!r}}")
        """
    )
    cold, warm = (float(v) for v in out.split())
    assert cold == warm, f"Ascendant depends on call order: cold={cold} warm={warm}"


def test_asc_mc_is_lahiri_cold_too() -> None:
    """`calculate_asc_mc` feeds Dig Bala and had the same omission."""
    out = _run_cold(
        """
        from app.calculations.astro import utc_datetime_to_julian_day
        from app.calculations.ephemeris import calculate_asc_mc, calculate_sidereal_planets
        from datetime import UTC, datetime

        jd = utc_datetime_to_julian_day(datetime(1993, 3, 15, 2, 45, tzinfo=UTC))
        cold_asc, cold_mc = calculate_asc_mc(jd, 11.1085, 77.3411)
        calculate_sidereal_planets(jd)
        warm_asc, warm_mc = calculate_asc_mc(jd, 11.1085, 77.3411)
        print(f"{cold_asc!r} {warm_asc!r} {cold_mc!r} {warm_mc!r}")
        """
    )
    cold_asc, warm_asc, cold_mc, warm_mc = (float(v) for v in out.split())
    assert cold_asc == warm_asc, f"Asc depends on call order: {cold_asc} vs {warm_asc}"
    assert cold_mc == warm_mc, f"MC depends on call order: {cold_mc} vs {warm_mc}"
