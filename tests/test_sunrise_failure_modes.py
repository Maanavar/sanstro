""""The Sun did not rise" and "our ephemeris call broke" must not share a path.

The chart engine anchors the vaara boundary, the day/night classification, the
Maandhi span and Kala Bala's day/night term on one sunrise. Three separate places
used to answer "no sunrise" for reasons that had nothing to do with the sky:

  * ``_chart_planets._sunrise_sunset_jd`` wrapped the whole calculation in
    ``except Exception: return None`` — and it is ``lru_cache``d, so a single
    transient or systematic failure pinned a fabricated absence for that date and
    place for the rest of the worker's life.
  * ``resolve_daytime_birth`` then fell through to a 06:00-18:00 clock, which is
    least valid in exactly the case that produces the absence honestly (polar
    day/night): Oslo on 21 Dec rises 09:18, so a 07:00 birth read as daylight.
  * the ``swisseph-ffi`` branch of ``calculate_rise_transit_jd`` discarded
    ``swe_rise_trans``'s return code *and* its error buffer, so a real error
    (-1) reached the caller wearing the circumpolar answer (-2).

Every assertion here fails if its fix is reverted; the docstrings say how.
"""
from __future__ import annotations

from ctypes import c_double, create_string_buffer
from datetime import date, time
from types import SimpleNamespace

import pytest

from app.calculations import ephemeris
from app.calculations.ephemeris import RiseTransitUndefinedError
from app.services import _chart_planets
from app.services._chart_planets import _sunrise_sunset_jd, resolve_daytime_birth

pytestmark = pytest.mark.no_db

#: Chennai. Anywhere the Sun demonstrably rises; the point of these tests is what
#: happens when the *call* misbehaves, not where the caller is standing.
CHENNAI = dict(birth_latitude=13.0827, birth_longitude=80.2707, birth_timezone="Asia/Kolkata")
A_DATE = date(1991, 7, 22)


@pytest.fixture(autouse=True)
def _clear_sunrise_cache():
    """``_sunrise_sunset_jd`` is process-wide ``lru_cache``d.

    Without this, a monkeypatched failure in one test would be served from cache
    to the next one — and, worse, a genuine entry computed by an earlier test in
    the same session would make a patched-to-fail case silently pass.
    """
    _sunrise_sunset_jd.cache_clear()
    yield
    _sunrise_sunset_jd.cache_clear()


def _raise(exc: BaseException):
    def _fn(*_args, **_kwargs):
        raise exc

    return _fn


# ── absence vs defect ─────────────────────────────────────────────────────────

def test_polar_absence_is_none(monkeypatch) -> None:
    """The one condition that legitimately means "no sunrise here today"."""
    monkeypatch.setattr(
        _chart_planets, "calculate_rise_transit_jd", _raise(RiseTransitUndefinedError("polar"))
    )
    assert _sunrise_sunset_jd(A_DATE, "Asia/Kolkata", 78.22, 15.65) is None


@pytest.mark.parametrize(
    "exc",
    [
        RuntimeError("Swiss Ephemeris rise_trans returned an unexpected shape"),
        TypeError("rise_trans() takes 7 positional arguments but 8 were given"),
        ValueError("bad ephemeris file"),
    ],
    ids=["unexpected-shape", "wrong-signature", "bad-data"],
)
def test_any_other_failure_propagates_instead_of_becoming_absence(monkeypatch, exc) -> None:
    """A defect must reach the caller as a defect.

    Each of these is a real historical failure mode. The wrong-signature
    ``TypeError`` is the one that actually shipped: an eight-argument
    ``rise_trans`` call raised on every sunrise in CI and in the production
    image, and the blanket handler turned it into "Maandhi unavailable" on a
    chart that otherwise rendered clean.

    Reverting the narrowing (``except Exception: return None``) makes every case
    here return ``None`` and the test fails on the ``pytest.raises``.
    """
    monkeypatch.setattr(_chart_planets, "calculate_rise_transit_jd", _raise(exc))
    with pytest.raises(type(exc)):
        _sunrise_sunset_jd(A_DATE, "Asia/Kolkata", 13.0827, 80.2707)


def test_a_defect_does_not_poison_the_cache(monkeypatch) -> None:
    """The failure must not be remembered as absence once the cause is gone.

    ``lru_cache`` stores return values, not exceptions — so propagating rather
    than returning ``None`` is also what keeps the entry from being cached. This
    is the half that makes the narrowing matter in a long-lived worker: under the
    old handler, one bad call answered ``None`` for that date and place forever,
    and no later recovery could dislodge it.
    """
    monkeypatch.setattr(_chart_planets, "calculate_rise_transit_jd", _raise(RuntimeError("transient")))
    with pytest.raises(RuntimeError):
        _sunrise_sunset_jd(A_DATE, "Asia/Kolkata", 13.0827, 80.2707)

    monkeypatch.undo()
    recovered = _sunrise_sunset_jd(A_DATE, "Asia/Kolkata", 13.0827, 80.2707)
    assert recovered is not None, "the failed call must not have been cached as absence"
    sunrise_jd, sunset_jd = recovered
    assert sunrise_jd < sunset_jd


# ── the clock fallback's remaining scope ──────────────────────────────────────

def test_known_place_that_cannot_be_resolved_abstains(monkeypatch) -> None:
    """Place on file + no resolvable rise/set -> ``None``, never the clock.

    This is polar day/night, where the 06:00-18:00 rule is at its most wrong. The
    fail-safe goes toward doctrine, which here means declining to classify:
    ``_kala_bala_score`` scores nathonnatha at its 0.7 midpoint instead of
    awarding Sun/Jupiter/Venus a full day term on the strength of a clock.

    Restore the old ``if bounds is not None:`` fallthrough and this returns
    ``True`` for a 07:00 Longyearbyen birth in December.
    """
    monkeypatch.setattr(
        _chart_planets, "calculate_rise_transit_jd", _raise(RiseTransitUndefinedError("polar night"))
    )
    got = resolve_daytime_birth(
        time(7, 0),
        birth_date=date(2001, 12, 21),
        birth_latitude=78.22,
        birth_longitude=15.65,
        birth_timezone="Arctic/Longyearbyen",
    )
    assert got is None


def test_no_place_on_file_still_uses_the_clock() -> None:
    """The clock survives where it is an estimate rather than an invention.

    With no place there is nothing to resolve, and this product's charts sit at
    roughly 8-13 deg N where sunrise runs 05:50-06:30 all year. Keeping this
    branch is deliberate — the change above narrowed the fallback's scope, it did
    not delete it.
    """
    assert resolve_daytime_birth(time(9, 0)) is True
    assert resolve_daytime_birth(time(21, 0)) is False
    assert resolve_daytime_birth(time(6, 0)) is True
    assert resolve_daytime_birth(time(18, 0)) is False


def test_no_birth_time_is_unknown_not_daylight() -> None:
    """v1.4. Kept here beside its siblings: all three "unknown" paths agree."""
    assert resolve_daytime_birth(None) is None
    assert resolve_daytime_birth(None, birth_date=A_DATE, **CHENNAI) is None


def test_a_resolvable_place_is_still_answered_from_the_sky() -> None:
    """The guard against over-correcting: none of the above may have turned the
    normal case into an abstention. Chennai on a July morning is daylight."""
    assert resolve_daytime_birth(time(6, 30), birth_date=A_DATE, **CHENNAI) is True
    assert resolve_daytime_birth(time(23, 30), birth_date=A_DATE, **CHENNAI) is False


# ── the swisseph-ffi branch's return code ─────────────────────────────────────

def _ffi_backend(monkeypatch, *, retflag: int, serr: bytes = b"", tret0: float = 0.0):
    """Force the ``swisseph-ffi`` branch with a stand-in for the C binding.

    Mirrors ``test_ephemeris._use_module_backend`` for the other backend. The
    signature copied from ``swisseph_ffi``: ``swe_rise_trans(tjd_ut, body,
    starname, epheflag, rsmi, geopos, atpress, attemp, tret, serr)``, returning
    the int retflag and writing into the ``tret``/``serr`` buffers.
    """
    calls: dict[str, object] = {}

    def swe_rise_trans(tjd_ut, body, starname, epheflag, rsmi, geopos, atpress, attemp, tret, serr_buf):
        calls.update(tjd_ut=tjd_ut, rsmi=rsmi, geopos=tuple(geopos))
        tret[0] = c_double(tret0).value
        serr_buf.value = serr
        return retflag

    monkeypatch.setattr(ephemeris, "_HAS_MODULE_API", False, raising=False)
    monkeypatch.setattr(ephemeris, "_SWISS", SimpleNamespace(swe_rise_trans=swe_rise_trans), raising=False)
    monkeypatch.setattr(ephemeris, "SE_SUN", 0, raising=False)
    monkeypatch.setattr(ephemeris, "SE_CALC_RISE", 1, raising=False)
    monkeypatch.setattr(ephemeris, "SE_CALC_SET", 2, raising=False)
    monkeypatch.setattr(ephemeris, "SEFLG_SWIEPH", 2, raising=False)
    # The ffi branch imports these from ctypes only when pyswisseph is absent,
    # so on a pyswisseph install (CI, 3.12) they are not module names at all.
    monkeypatch.setattr(ephemeris, "c_double", c_double, raising=False)
    monkeypatch.setattr(ephemeris, "create_string_buffer", create_string_buffer, raising=False)
    return calls


def test_ffi_backend_reports_circumpolar_as_rise_transit_undefined(monkeypatch) -> None:
    """retflag -2 is the documented circumpolar answer, on both backends.

    It used to come out right here only by accident: the return code was
    discarded, and ``tret[0]`` was left at 0.0, which ``_require_valid_rise_jd``
    rejects as outside its +/-2.5-day window. Right answer, wrong reason — and
    the reason is what made -1 indistinguishable below.
    """
    _ffi_backend(monkeypatch, retflag=-2)
    with pytest.raises(RiseTransitUndefinedError):
        ephemeris.calculate_rise_transit_jd(2461055.0, 78.22, 15.65, rise=True)


def test_ffi_backend_reports_a_real_error_as_an_error(monkeypatch) -> None:
    """retflag -1 is a calculation failure, NOT "the Sun does not rise".

    This is the distinction the whole file exists for, and the ffi branch could
    not make it: with the return code discarded, a missing or unreadable
    ephemeris file produced ``tret[0] == 0.0`` and therefore the *same*
    ``RiseTransitUndefinedError`` as a polar day. The panchangam turns that into
    a clean 4xx "undefined here", so a broken deployment would have presented as
    every location being circumpolar.

    The error buffer is surfaced too; discarding ``serr`` is why the old branch
    had nothing to report.
    """
    _ffi_backend(monkeypatch, retflag=-1, serr=b"SwissEph file 'sepl_18.se1' not found")
    with pytest.raises(RuntimeError, match="sepl_18.se1") as exc:
        ephemeris.calculate_rise_transit_jd(2461055.0, 13.0827, 80.2707, rise=True)
    assert not isinstance(exc.value, RiseTransitUndefinedError)


def test_ffi_backend_success_returns_the_event_jd(monkeypatch) -> None:
    """The baseline the two failure cases are measured against — retflag 0 with a
    plausible event still returns it, so the new checks cannot be passing merely
    by rejecting everything."""
    jd_start = 2461055.0
    calls = _ffi_backend(monkeypatch, retflag=0, tret0=jd_start + 0.26)
    assert ephemeris.calculate_rise_transit_jd(jd_start, 13.0827, 80.2707, rise=True) == jd_start + 0.26
    # geopos is (longitude, latitude, altitude) — the same order the module
    # branch is pinned to in test_ephemeris.
    assert calls["geopos"] == (80.2707, 13.0827, 0.0)
    assert calls["rsmi"] == 1 | ephemeris._RSMI_APPARENT_UPPER_LIMB
