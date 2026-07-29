from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from threading import RLock
from typing import Final

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

    _RSMI_HINDU_RISING: Final[int] = SE_BIT_HINDU_RISING

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
    SIDEREAL_FLAGS: Final[int] = SEFLG_SPEED | SEFLG_SIDEREAL | SEFLG_SWIEPH
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
        from swisseph import BIT_HINDU_RISING as _RSMI_HINDU_RISING  # type: ignore[import-not-found]
    except ImportError:
        try:
            from swisseph import (  # type: ignore[import-not-found]
                BIT_DISC_CENTER,
                BIT_GEOCTR_NO_ECL_LAT,
                BIT_NO_REFRACTION,
            )

            _RSMI_HINDU_RISING = BIT_DISC_CENTER | BIT_NO_REFRACTION | BIT_GEOCTR_NO_ECL_LAT
        except ImportError:
            # Hardcoded per the Swiss Ephemeris C header (swephexp.h) — same
            # combination as swisseph_ffi's SE_BIT_HINDU_RISING: disc-center
            # (256) | no-refraction (512) | geocentric-no-ecliptic-latitude
            # (128) = 896.
            _RSMI_HINDU_RISING = 896

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
    SIDEREAL_FLAGS: Final[int] = FLG_SPEED | FLG_SIDEREAL | FLG_SWIEPH

RETROGRADE_BADGE_EXEMPT = frozenset({"SUN", "MOON", "RAHU", "KETU"})
_SWISS_LOCK = RLock()


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
    with _SWISS_LOCK:
        if _HAS_MODULE_API:
            return float(swe_module.get_ayanamsa_ut(jd_ut))
        return float(_SWISS.swe_get_ayanamsa_ut(jd_ut))


def _calc_ut(jd_ut: float, planet_id: int) -> tuple[float, float, str]:
    with _SWISS_LOCK:
        if _HAS_MODULE_API:
            xx, _retflag = swe_module.calc_ut(jd_ut, planet_id, SIDEREAL_FLAGS)
            longitude = normalize_longitude(float(xx[0]))
            speed = float(xx[3])
            return longitude, speed, ""

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
    with _SWISS_LOCK:
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
    Ascendant, ascmc[1] the MC. Used by the Shadbala Dig Bala computation."""
    with _SWISS_LOCK:
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


def calculate_rise_transit_jd(jd_start: float, latitude: float, longitude: float, *, rise: bool) -> float:
    """Hindu sunrise/sunset (Doctrine §1, WI-07): geometric rise/set of the
    Sun's disc CENTER with NO atmospheric refraction, matching every printed
    Tamil panchangam's definition of udaya/asthamana — not Swiss Ephemeris's
    default (upper limb + refraction), which sits ~2-4 minutes earlier. This
    is the single anchor every sunrise-derived field inherits (Rahu kalam,
    Yamagandam, Kuligai, horai, udaya tithi/nakshatra, sunrise lagna, Gowri,
    tamil_calendar's sunset cutoff) — see PANCHANGAM_CACHE_DATA_VERSION v33
    in panchangam.py.
    """
    rsmi_rise = CALC_RISE if _HAS_MODULE_API else SE_CALC_RISE
    rsmi_set = CALC_SET if _HAS_MODULE_API else SE_CALC_SET
    rsmi = (rsmi_rise if rise else rsmi_set) | _RSMI_HINDU_RISING
    with _SWISS_LOCK:
        if _HAS_MODULE_API:
            if not hasattr(swe_module, "rise_trans"):
                raise RuntimeError("Swiss Ephemeris rise_trans is unavailable in this module backend.")
            geopos = (longitude, latitude, 0.0)
            try:
                result = swe_module.rise_trans(
                    jd_start,
                    SUN,
                    None,
                    rsmi,
                    geopos,
                    0.0,
                    0.0,
                    FLG_SWIEPH,
                )
            except TypeError:
                result = swe_module.rise_trans(
                    jd_start,
                    SUN,
                    None,
                    rsmi,
                    FLG_SWIEPH,
                    geopos,
                    0.0,
                    0.0,
                )
            if isinstance(result, tuple):
                if len(result) >= 2 and isinstance(result[1], (tuple, list)) and result[1]:
                    return _require_valid_rise_jd(float(result[1][0]), jd_start, rise=rise)
                if len(result) >= 1 and isinstance(result[0], (tuple, list)) and result[0]:
                    return _require_valid_rise_jd(float(result[0][0]), jd_start, rise=rise)
            raise RuntimeError("Swiss Ephemeris rise_trans did not return a usable Julian Day.")

        geopos = (c_double * 3)(longitude, latitude, 0.0)
        tret = (c_double * 10)()
        serr = create_string_buffer(256)
        _SWISS.swe_rise_trans(
            jd_start,
            SE_SUN,
            None,
            SEFLG_SWIEPH,
            rsmi,
            geopos,
            0.0,
            0.0,
            tret,
            serr,
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
