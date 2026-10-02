from __future__ import annotations

import os
from dataclasses import dataclass
from enum import Enum
from functools import lru_cache
from pathlib import Path
from threading import RLock

from app.calculations.astro import degree_in_rasi, normalize_longitude, rasi_from_degree

# Rahu/Ketu node type: MEAN node (SE_MEAN_NODE / MEAN_NODE below), deliberate
# default (Doctrine §2) — classical computation, the Vakya tradition, and the
# majority of Tamil practice use the mean node; Rahu is doctrinally always
# vakri (retrograde), and the true node's occasional direct motion is awkward
# within that framework. CAVEAT: JHora defaults to the TRUE node, not mean —
# do not cite JHora as supporting this choice. Users comparing against
# out-of-box JHora will see Rahu/Ketu differ by up to ~1.5deg+, occasionally
# flipping nakshatra pada (which can shift a Vimshottari dasha start). A
# true-node settings toggle is a possible future follow-up (needs product
# sign-off) — not implemented here; this module only computes mean node.

# Declared once here rather than in each backend branch below. The two branches
# are mutually exclusive at runtime, but a type checker reads both, so a
# per-branch annotation is a redefinition. Not `Final` either: the fallback
# chain for _RSMI_GEOMETRIC_DISC_CENTER legitimately assigns it more than once. Both are
# write-once-per-process in practice; nothing outside this header rebinds them.
_RSMI_GEOMETRIC_DISC_CENTER: int
SIDEREAL_FLAGS: int

# No extra rsmi bits: Swiss Ephemeris's own default is apparent rise/set of the
# Sun's UPPER LIMB including atmospheric refraction. That is Vinaadi's
# Thirukanitham convention (see SunriseConvention.APPARENT_UPPER_LIMB) and the
# reason it is spelled as a named zero rather than omitted — an absent flag
# reads like an oversight, a named one records a decision.
_RSMI_APPARENT_UPPER_LIMB = 0

try:
    import swisseph as swe_module  # type: ignore[import-not-found]

    _BACKEND = "pyswisseph"
    _HAS_MODULE_API = True
except ImportError:  # pragma: no cover - exercised in this environment via swisseph-ffi
    swe_module = None
    _BACKEND = "swisseph-ffi"
    _HAS_MODULE_API = False

    from ctypes import c_double, create_string_buffer

    from swisseph_ffi import (  # type: ignore[import-not-found]
        SE_BIT_HINDU_RISING,
        SE_CALC_RISE,
        SE_CALC_SET,
        SE_JUPITER,
        SE_MARS,
        SE_MEAN_NODE,
        SE_MERCURY,
        SE_MOON,
        SE_SATURN,
        SE_SIDM_LAHIRI,
        SE_SUN,
        SE_VENUS,
        SEFLG_SIDEREAL,
        SEFLG_SPEED,
        SEFLG_SWIEPH,
        SwissEph,
    )

    _RSMI_GEOMETRIC_DISC_CENTER = SE_BIT_HINDU_RISING

    _SWISS = SwissEph()

    PLANET_IDS = {
        "SUN": SE_SUN,
        "MOON": SE_MOON,
        "MARS": SE_MARS,
        "MERCURY": SE_MERCURY,
        "JUPITER": SE_JUPITER,
        "VENUS": SE_VENUS,
        "SATURN": SE_SATURN,
        "RAHU": SE_MEAN_NODE,
    }
    SIDEREAL_FLAGS = SEFLG_SPEED | SEFLG_SIDEREAL | SEFLG_SWIEPH
else:
    from swisseph import (  # type: ignore[import-not-found]
        CALC_RISE,
        CALC_SET,
        FLG_SIDEREAL,
        FLG_SPEED,
        FLG_SWIEPH,
        JUPITER,
        MARS,
        MEAN_NODE,
        MERCURY,
        MOON,
        SATURN,
        SIDM_LAHIRI,
        SUN,
        VENUS,
    )

    try:
        from swisseph import BIT_HINDU_RISING  # type: ignore[import-not-found]

        _RSMI_GEOMETRIC_DISC_CENTER = BIT_HINDU_RISING
    except ImportError:
        try:
            from swisseph import (  # type: ignore[import-not-found]
                BIT_DISC_CENTER,
                BIT_GEOCTR_NO_ECL_LAT,
                BIT_NO_REFRACTION,
            )

            _RSMI_GEOMETRIC_DISC_CENTER = BIT_DISC_CENTER | BIT_NO_REFRACTION | BIT_GEOCTR_NO_ECL_LAT
        except ImportError:
            # Hardcoded per the Swiss Ephemeris C header (swephexp.h) — same
            # combination as swisseph_ffi's SE_BIT_HINDU_RISING: disc-center
            # (256) | no-refraction (512) | geocentric-no-ecliptic-latitude
            # (128) = 896. Note the library's name for this combination is a
            # claim about Hindu practice, not a fact about it — Vinaadi's
            # Thirukanitham doctrine does NOT use it as the default; see
            # SunriseConvention below.
            _RSMI_GEOMETRIC_DISC_CENTER = 896

    PLANET_IDS = {
        "SUN": SUN,
        "MOON": MOON,
        "MARS": MARS,
        "MERCURY": MERCURY,
        "JUPITER": JUPITER,
        "VENUS": VENUS,
        "SATURN": SATURN,
        "RAHU": MEAN_NODE,
    }
    SIDEREAL_FLAGS = FLG_SPEED | FLG_SIDEREAL | FLG_SWIEPH

RETROGRADE_BADGE_EXEMPT = frozenset({"SUN", "MOON", "RAHU", "KETU"})
_SWISS_LOCK = RLock()

#: Where the Swiss Ephemeris ``.se1`` data files live (sepl_18 / semo_18 /
#: seas_18, 1800-2399 AD). Committed under ``ephe/`` at the repo root and copied
#: to ``/app/ephe`` in the API image, which sets the variable explicitly.
SWISSEPH_PATH_ENV = "JOTHIDAM_SWISSEPH_PATH"
_DEFAULT_EPHE_DIR = Path(__file__).resolve().parents[2] / "ephe"


def _configure_ephemeris_path() -> str | None:
    """Point Swiss Ephemeris at its data files, once, at import.

    Nothing used to, so every chart and panchangam was computed on the Moshier
    analytic fallback (owner ruling 2026-10-01 to bundle the files). Measured
    over 15 dates 1988-2017: Moon within 0.88", Sun 0.05", Saturn 0.50",
    sunrise 3 ms — small, but the computation is now the one the library is
    built around, and `source_warnings` stops carrying the fallback notice.

    A missing directory is left alone rather than raised: the library then
    falls back to Moshier exactly as before and `_calc_ut` records it.
    """
    path = Path(os.environ.get(SWISSEPH_PATH_ENV) or _DEFAULT_EPHE_DIR)
    if not path.is_dir():
        return None
    with _SWISS_LOCK:
        if _HAS_MODULE_API:
            swe_module.set_ephe_path(str(path))
        else:
            _SWISS.swe_set_ephe_path(str(path).encode("utf-8"))
    return str(path)


EPHEMERIS_PATH = _configure_ephemeris_path()


@dataclass(frozen=True, slots=True)
class EphemerisBody:
    graha: str
    absolute_longitude: float
    speed_deg_per_day: float
    rasi: int
    degree_in_rasi: float
    is_retrograde: bool
    show_retrograde_badge: bool


@dataclass(frozen=True, slots=True)
class EphemerisSnapshot:
    jd_ut: float
    backend: str
    ayanamsa: str
    ayanamsa_value_degrees: float
    bodies: dict[str, EphemerisBody]
    source_warnings: tuple[str, ...] = ()


def set_lahiri_ayanamsa() -> None:
    with _SWISS_LOCK:
        if _HAS_MODULE_API:
            swe_module.set_sid_mode(SIDM_LAHIRI, 0, 0)
        else:
            _SWISS.swe_set_sid_mode(SE_SIDM_LAHIRI, 0, 0)


def get_lahiri_ayanamsa_ut(jd_ut: float) -> float:
    """The Lahiri ayanamsa at `jd_ut`, in degrees.

    Sets the mode first, because `swe_get_ayanamsa_ut` reports whatever mode is
    currently selected and this function's NAME is a promise about which one
    that is. Called cold it returned the library default, Fagan/Bradley — at
    1988-06-01 that is 24.578488 against Lahiri's 23.695280, and the number
    goes straight into `chart.ayanamsa_value_degrees` and onto the screen. Same
    omission as `calculate_lagna_degree`; see its note.
    """
    with _SWISS_LOCK:
        set_lahiri_ayanamsa()
        if _HAS_MODULE_API:
            return float(swe_module.get_ayanamsa_ut(jd_ut))
        return float(_SWISS.swe_get_ayanamsa_ut(jd_ut))


#: Recorded when Swiss Ephemeris answers from the Moshier analytic fallback
#: because its ``.se1`` data files are not on the ephemeris path. The FFI branch
#: gets the library's own sentence through ``serr``; pyswisseph exposes only the
#: return flag, so this branch names the fact itself.
MOSHIER_FALLBACK_WARNING = "Swiss Ephemeris data files not found; using Moshier ephemeris."


def _calc_ut(jd_ut: float, planet_id: int) -> tuple[float, float, str]:
    with _SWISS_LOCK:
        if _HAS_MODULE_API:
            xx, retflag = swe_module.calc_ut(jd_ut, planet_id, SIDEREAL_FLAGS)
            longitude = normalize_longitude(float(xx[0]))
            speed = float(xx[3])
            # The return flag says which ephemeris actually answered. It used to
            # be discarded, so the production image (pyswisseph) fell back to
            # Moshier with no record, while the FFI branch below reported the
            # same fallback through `serr`. Only a missing SWIEPH bit is read:
            # the other bits echo the request (sidereal, speed).
            warning = "" if int(retflag) & FLG_SWIEPH else MOSHIER_FALLBACK_WARNING
            return longitude, speed, warning

        xx = (c_double * 6)()
        serr = create_string_buffer(256)
        _retflag = _SWISS.swe_calc_ut(jd_ut, planet_id, SIDEREAL_FLAGS, xx, serr)
        longitude = normalize_longitude(float(xx[0]))
        speed = float(xx[3])
        warning = serr.value.decode("utf-8", "ignore").strip()
        return longitude, speed, warning


def calculate_sun_moon_longitudes(jd_ut: float) -> tuple[float, float]:
    """Sidereal Sun and Moon longitudes alone, for root-finding hot paths.

    ``calculate_sidereal_planets`` computes all eight bodies, derives Ketu, and
    reads the ayanamsa — ten Swiss Ephemeris calls. The panchangam's tithi,
    nakshatra and yoga boundary searches bisect to 64 iterations against a
    function of the Sun and Moon *only*, so they were paying for six bodies they
    discard on every probe: one daily panchangam issued ~1,355 snapshots and
    ~10,840 ``_calc_ut`` calls, of which roughly three quarters were waste.

    Values are identical to the corresponding entries of a full snapshot by
    construction — same ``_calc_ut``, same flags, same ayanamsa mode set first.
    This is strictly a narrower query, never a different one.

    Deliberately returns no warnings: every caller of this path discards them,
    and the one panchangam site that *reports* ``source_warnings`` still takes
    the full snapshot so its output is unchanged.
    """
    with _SWISS_LOCK:  # RLock — set_lahiri_ayanamsa reacquires, as it does below
        set_lahiri_ayanamsa()
        sun_longitude, _sun_speed, _sun_warning = _calc_ut(jd_ut, PLANET_IDS["SUN"])
        moon_longitude, _moon_speed, _moon_warning = _calc_ut(jd_ut, PLANET_IDS["MOON"])
        return sun_longitude, moon_longitude


def calculate_sidereal_planets(jd_ut: float) -> EphemerisSnapshot:
    with _SWISS_LOCK:
        set_lahiri_ayanamsa()

        bodies: dict[str, EphemerisBody] = {}
        warnings: list[str] = []

        for graha, planet_id in PLANET_IDS.items():
            longitude, speed, warning = _calc_ut(jd_ut, planet_id)
            if warning:
                warnings.append(warning)
            bodies[graha] = EphemerisBody(
                graha=graha,
                absolute_longitude=longitude,
                speed_deg_per_day=speed,
                rasi=rasi_from_degree(longitude),
                degree_in_rasi=degree_in_rasi(longitude),
                is_retrograde=speed < 0,
                show_retrograde_badge=speed < 0 and graha not in RETROGRADE_BADGE_EXEMPT,
            )

        rahu = bodies["RAHU"]
        ketu_longitude = normalize_longitude(rahu.absolute_longitude + 180.0)
        bodies["KETU"] = EphemerisBody(
            graha="KETU",
            absolute_longitude=ketu_longitude,
            speed_deg_per_day=rahu.speed_deg_per_day,
            rasi=rasi_from_degree(ketu_longitude),
            degree_in_rasi=degree_in_rasi(ketu_longitude),
            is_retrograde=rahu.speed_deg_per_day < 0,
            show_retrograde_badge=False,
        )

        return EphemerisSnapshot(
            jd_ut=jd_ut,
            backend=_BACKEND,
            ayanamsa="LAHIRI",
            ayanamsa_value_degrees=get_lahiri_ayanamsa_ut(jd_ut),
            bodies=bodies,
            source_warnings=tuple(dict.fromkeys(warnings)),
        )


def calculate_lagna_degree(jd_ut: float, latitude: float, longitude: float) -> float:
    """Sidereal Ascendant longitude (degrees), Lahiri.

    ``set_lahiri_ayanamsa()`` is called here and not assumed. ``FLG_SIDEREAL``
    only says "use the sidereal mode"; *which* mode is process-global state,
    and Swiss Ephemeris's default is **Fagan/Bradley**, about 0.88° from
    Lahiri. This function used to rely on some earlier
    ``calculate_sidereal_planets`` in the same process having set it — true on
    the fresh-chart path, which computes the planets first, and false for any
    caller that reaches the Ascendant first on a cold worker. Those callers got
    a silently Fagan/Bradley Ascendant: ~0.88° out, and a different rasi
    whenever the true degree sits within 0.88° of a sign boundary.

    Measured on a cold interpreter: an Ascendant came out 0.8832 deg lower
    without a preceding planet call than with one — the full Fagan/Bradley
    offset. Re-entrant lock, so the nested acquire is free.
    """
    with _SWISS_LOCK:
        set_lahiri_ayanamsa()
        if _HAS_MODULE_API:
            try:
                _cusps, ascmc = swe_module.houses_ex(jd_ut, latitude, longitude, b"W", FLG_SIDEREAL)
            except TypeError:
                _cusps, ascmc = swe_module.houses_ex(jd_ut, FLG_SIDEREAL, latitude, longitude, b"W")
            return normalize_longitude(float(ascmc[0]))

        cusps = (c_double * 13)()
        ascmc = (c_double * 10)()
        _SWISS.swe_houses_ex(jd_ut, SEFLG_SIDEREAL, latitude, longitude, ord("W"), cusps, ascmc)
        return normalize_longitude(float(ascmc[0]))


def calculate_asc_mc(jd_ut: float, latitude: float, longitude: float) -> tuple[float, float]:
    """Sidereal Ascendant and Midheaven longitudes (degrees). ascmc[0] is the
    Ascendant, ascmc[1] the MC. Used by the Shadbala Dig Bala computation.

    Sets the ayanamsa for the same reason ``calculate_lagna_degree`` does —
    ``FLG_SIDEREAL`` does not choose the mode, and the library's default is
    Fagan/Bradley.
    """
    with _SWISS_LOCK:
        set_lahiri_ayanamsa()
        if _HAS_MODULE_API:
            try:
                _cusps, ascmc = swe_module.houses_ex(jd_ut, latitude, longitude, b"W", FLG_SIDEREAL)
            except TypeError:
                _cusps, ascmc = swe_module.houses_ex(jd_ut, FLG_SIDEREAL, latitude, longitude, b"W")
            return normalize_longitude(float(ascmc[0])), normalize_longitude(float(ascmc[1]))

        cusps = (c_double * 13)()
        ascmc = (c_double * 10)()
        _SWISS.swe_houses_ex(jd_ut, SEFLG_SIDEREAL, latitude, longitude, ord("W"), cusps, ascmc)
        return normalize_longitude(float(ascmc[0])), normalize_longitude(float(ascmc[1]))


class RiseTransitUndefinedError(ValueError):
    """The Sun does not rise or set for this location and date.

    At polar latitudes during polar day / polar night the Sun is circumpolar, so
    there is no sunrise or sunset — Swiss Ephemeris returns a sentinel (0.0) or a
    far-away next event rather than an event on this date. Every panchangam field
    (Rahu Kalam, Yamagandam, Kuligai, Gowri, Nalla Neram, horai, udaya tithi …)
    is anchored on sunrise, so the whole day is *undefined* here, not merely
    approximate. Callers should surface this as a clean 4xx, not a 500.
    """


def _require_valid_rise_jd(jd_result: float, jd_start: float, *, rise: bool) -> float:
    """Reject a circumpolar / sentinel rise-set result.

    A genuine sunrise/sunset for ``jd_start`` lands within about a day and a half
    of it. A circumpolar day makes Swiss Ephemeris return either 0.0 or an event
    weeks/months away — both far outside this window, and both also what would
    overflow the later Julian-Day -> datetime conversion.
    """
    if not (jd_start - 2.5 <= jd_result <= jd_start + 2.5):
        raise RiseTransitUndefinedError(
            f"No sun{'rise' if rise else 'set'} at this location on this date "
            "(polar day/night) — panchangam is undefined here."
        )
    return jd_result


class SunriseConvention(Enum):
    """Which horizon event counts as sunrise/sunset.

    Vinaadi's Thirukanitham doctrine is APPARENT_UPPER_LIMB (WI-07, re-ruled
    2026-09-29). GEOMETRIC_DISC_CENTER is retained as a named traditional
    variant so it can be requested deliberately; it must never become the
    default again without a fresh owner ruling.
    """

    #: Apparent rise/set of the Sun's UPPER LIMB including atmospheric
    #: refraction — the modern Drik convention of India's Rashtriya Panchang
    #: and DrikPanchang's default. **Vinaadi Thirukanitham doctrine.**
    APPARENT_UPPER_LIMB = "APPARENT_UPPER_LIMB"

    #: Geometric rise/set of the Sun's disc CENTRE with NO refraction
    #: (Swiss Ephemeris SE_BIT_HINDU_RISING). Lands ~3-6 min inside the
    #: apparent event at both ends. Traditional/alternate variant only.
    GEOMETRIC_DISC_CENTER = "GEOMETRIC_DISC_CENTER"


_RSMI_BY_CONVENTION = {
    SunriseConvention.APPARENT_UPPER_LIMB: _RSMI_APPARENT_UPPER_LIMB,
    SunriseConvention.GEOMETRIC_DISC_CENTER: _RSMI_GEOMETRIC_DISC_CENTER,
}

#: Vinaadi Thirukanitham doctrine (WI-07, re-ruled 2026-09-29). Named so the
#: default is auditable by grep rather than implied by a parameter default.
THIRUKANITHAM_SUNRISE_CONVENTION = SunriseConvention.APPARENT_UPPER_LIMB


def calculate_rise_transit_jd(
    jd_start: float,
    latitude: float,
    longitude: float,
    *,
    rise: bool,
    convention: SunriseConvention = THIRUKANITHAM_SUNRISE_CONVENTION,
) -> float:
    """Thirukanitham sunrise/sunset (Doctrine §1, WI-07 as re-ruled 2026-09-29):
    **apparent** rise/set of the Sun's upper limb **including atmospheric
    refraction** — the modern Drik convention followed by India's Rashtriya
    Panchang and by DrikPanchang's default, and therefore by Vinaadi.

    This replaced Swiss Ephemeris's ``SE_BIT_HINDU_RISING`` (disc centre, no
    refraction), which had been adopted on the unsupported premise that it
    "matches every printed Tamil panchangam". It does not: it sits ~3.5 min
    later at sunrise and ~3.5 min earlier at sunset than every mainstream
    published source, and no printed edition was ever checked. The library's
    flag name is a claim about Hindu practice, not a ratified standard — do
    not read it as one. Printed Thirukanitha parity (Vasan / Manimekalai /
    Arcot) is a SEPARATE open validation task; this convention is ruled, not
    publisher-verified.

    This is the single anchor every sunrise-derived field inherits (Rahu
    kalam, Yamagandam, Kuligai, horai, Gowri, Durmuhurtham, udaya
    tithi/nakshatra, sunrise lagna, tamil_calendar's sunset cutoff) — see
    PANCHANGAM_CACHE_DATA_VERSION v47 in panchangam.py.

    Returns the exact Julian Day of the event. Callers must NOT pre-round:
    presentation rounds to the nearest minute at the display boundary only
    (``app/services/panchangam_service.py``), because every derived window is
    a fraction of the sunrise→sunset span and rounding the anchor first
    compounds into those subdivisions.

    Atmospheric parameters are passed as 0.0/0.0 deliberately (see the call
    sites): atpress=0 makes Swiss Ephemeris estimate pressure from geographic
    altitude, and attemp=0 selects 0 °C. Moving to 15 °C shifts the event by
    ~13 s — below the display's rounding granularity, and changing it would
    silently move every pinned reference value.
    """
    rsmi_rise = CALC_RISE if _HAS_MODULE_API else SE_CALC_RISE
    rsmi_set = CALC_SET if _HAS_MODULE_API else SE_CALC_SET
    rsmi = (rsmi_rise if rise else rsmi_set) | _RSMI_BY_CONVENTION[convention]
    with _SWISS_LOCK:
        if _HAS_MODULE_API:
            if not hasattr(swe_module, "rise_trans"):
                raise RuntimeError("Swiss Ephemeris rise_trans is unavailable in this module backend.")
            geopos = (longitude, latitude, 0.0)
            # pyswisseph 2.10.3.2, pyswisseph.c pyswe_rise_trans:
            #   kwlist = tjdut, body, rsmi, geopos, atpress, attemp, flags
            #   PyArg_ParseTupleAndKeywords format "dOiO|ddi"  -> SEVEN args, max.
            # This used to pass EIGHT, in the pre-2.x order (body, starname,
            # rsmi, geopos, ...), with a second eight-argument call in the
            # `except TypeError` fallback — so both branches raised and the
            # exception propagated. It could not fail on the development
            # machine: Python >= 3.14 has no pyswisseph wheel, so this repo
            # resolves to swisseph-ffi there and never enters this branch at
            # all (see the pyproject markers). It failed on every 3.12 CI run
            # and would have failed in the production image, where sunrise
            # anchors every panchangam field this docstring lists.
            # The optional tail is passed by keyword deliberately: a future
            # reordering then raises TypeError instead of silently binding
            # atmospheric pressure to the ephemeris flags.
            result = swe_module.rise_trans(
                jd_start,
                SUN,
                rsmi,
                geopos,
                atpress=0.0,
                attemp=0.0,
                flags=FLG_SWIEPH,
            )
            # Documented return: (res, tret) — res 0 = event found, -2 = the
            # body is circumpolar, tret[0] = Julian Day of the event.
            if isinstance(result, tuple) and len(result) >= 2 and isinstance(result[1], (tuple, list)) and result[1]:
                if result[0] == -2:
                    raise RiseTransitUndefinedError(
                        f"No sun{'rise' if rise else 'set'} at this location on this date "
                        "(polar day/night) — panchangam is undefined here."
                    )
                return _require_valid_rise_jd(float(result[1][0]), jd_start, rise=rise)
            raise RuntimeError(
                f"Swiss Ephemeris rise_trans returned an unexpected shape: {result!r}"
            )

        # Distinct name from the module-API branch's `geopos` tuple above: the
        # two backends want different objects, and one local cannot be both.
        geopos_buf = (c_double * 3)(longitude, latitude, 0.0)
        tret = (c_double * 10)()
        serr = create_string_buffer(256)
        retflag = _SWISS.swe_rise_trans(
            jd_start,
            SE_SUN,
            None,
            SEFLG_SWIEPH,
            rsmi,
            geopos_buf,
            0.0,
            0.0,
            tret,
            serr,
        )
        # The return code and `serr` used to be discarded outright — this branch
        # called the function for `tret` alone. Circumpolar days still came out
        # right, but only by accident: Swiss Ephemeris leaves `tret[0]` at 0.0,
        # which `_require_valid_rise_jd` rejects as out of window. That means a
        # genuine ERROR (-1: bad ephemeris file, unreadable data) arrived at the
        # caller wearing "the Sun does not rise here", which is the one
        # distinction `RiseTransitUndefinedError` exists to make. Same two
        # documented codes the module branch above checks: -2 circumpolar,
        # -1 error.
        if retflag is not None and int(retflag) == -2:
            raise RiseTransitUndefinedError(
                f"No sun{'rise' if rise else 'set'} at this location on this date "
                "(polar day/night) — panchangam is undefined here."
            )
        if retflag is not None and int(retflag) < 0:
            message = serr.value.decode("utf-8", "ignore").strip()
            raise RuntimeError(
                f"Swiss Ephemeris swe_rise_trans failed (retflag={int(retflag)}): "
                f"{message or 'no detail reported'}"
            )
        return _require_valid_rise_jd(float(tret[0]), jd_start, rise=rise)


@lru_cache(maxsize=256)
def sun_longitude_at_jd(jd: float) -> float:
    """Return the sidereal (Lahiri) longitude of the Sun at the given Julian Day.

    Memoized (L-16, docs/ASTROLOGY_FULL_CODE_AUDIT_2026-07-16.md): a
    sankranti search bisects this ~64x per call and callers frequently
    re-request the same instant across independent code paths (tithi,
    nakshatra, festival lookups); find_saturn_ingress_jd (transits.py) uses
    the same lru_cache pattern for its own boundary-finding search.
    """
    from app.calculations.astro import normalize_longitude
    snap = calculate_sidereal_planets(jd)
    return normalize_longitude(snap.bodies["SUN"].absolute_longitude)


@lru_cache(maxsize=256)
def saturn_longitude_at_jd(jd: float) -> float:
    """Return the sidereal (Lahiri) longitude of Saturn at the given Julian Day.

    ONE ``_calc_ut``, not ten, and that is the whole reason this exists next to
    ``sun_longitude_at_jd`` rather than reusing it in Saturn's shape.
    ``find_saturn_ingress_jd`` in transits.py calls
    ``calculate_sidereal_planets`` inside both its walk-back loop and its
    64-step bisection — up to ~104 full snapshots, each computing eight bodies
    and the ayanamsa to read one of them. That cost is tolerable there because
    the result is ``lru_cache``d per (rasi, jd) and the caller is a background
    cycle report; it is not tolerable on a reading endpoint, where the
    five-minute module bisects for the date Saturn LEAVES its current rasi
    while the reader waits.

    Same narrowing argument as ``calculate_sun_moon_longitudes`` above, and the
    same guarantee: identical ``_calc_ut``, identical flags, ayanamsa mode set
    first, so the value equals the corresponding entry of a full snapshot by
    construction. Strictly a narrower query, never a different one.
    """
    from app.calculations.astro import normalize_longitude
    with _SWISS_LOCK:  # RLock — set_lahiri_ayanamsa reacquires, as _calc_ut does
        set_lahiri_ayanamsa()
        longitude, _speed, _warning = _calc_ut(jd, PLANET_IDS["SATURN"])
    return normalize_longitude(longitude)
