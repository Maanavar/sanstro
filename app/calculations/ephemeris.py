from __future__ import annotations

from dataclasses import dataclass
from threading import RLock
from typing import Final

from app.calculations.astro import degree_in_rasi, normalize_longitude, rasi_from_degree

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
        SE_CALC_RISE,
        SE_CALC_SET,
        SEFLG_SIDEREAL,
        SEFLG_SPEED,
        SEFLG_SWIEPH,
        SE_MEAN_NODE,
        SE_MARS,
        SE_MERCURY,
        SE_MOON,
        SE_JUPITER,
        SE_SATURN,
        SE_SUN,
        SE_VENUS,
        SE_GREG_CAL,
        SE_SIDM_LAHIRI,
        SwissEph,
    )

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
        MEAN_NODE,
        MARS,
        MERCURY,
        MOON,
        JUPITER,
        SATURN,
        SUN,
        VENUS,
        SIDM_LAHIRI,
    )

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


def calculate_rise_transit_jd(jd_start: float, latitude: float, longitude: float, *, rise: bool) -> float:
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
                    CALC_RISE if rise else CALC_SET,
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
                    CALC_RISE if rise else CALC_SET,
                    FLG_SWIEPH,
                    geopos,
                    0.0,
                    0.0,
                )
            if isinstance(result, tuple):
                if len(result) >= 2 and isinstance(result[1], (tuple, list)) and result[1]:
                    return float(result[1][0])
                if len(result) >= 1 and isinstance(result[0], (tuple, list)) and result[0]:
                    return float(result[0][0])
            raise RuntimeError("Swiss Ephemeris rise_trans did not return a usable Julian Day.")

        geopos = (c_double * 3)(longitude, latitude, 0.0)
        tret = (c_double * 10)()
        serr = create_string_buffer(256)
        _SWISS.swe_rise_trans(
            jd_start,
            SE_SUN,
            None,
            SEFLG_SWIEPH,
            SE_CALC_RISE if rise else SE_CALC_SET,
            geopos,
            0.0,
            0.0,
            tret,
            serr,
        )
        return float(tret[0])
