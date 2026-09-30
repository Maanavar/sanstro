"""Pure planet-position calculation helpers — no DB, no HTTP, no service imports."""
from __future__ import annotations

import logging
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from functools import lru_cache

from app.calculations.aspects import aspects_house
from app.calculations.astro import (
    degree_in_rasi,
    house_from_reference,
    nakshatra_from_degree,
    navamsa_rasi_from_degree,
    pada_from_degree,
    resolve_timezone,
    utc_datetime_to_julian_day,
)
from app.calculations.chart_strength import (
    compute_strength_breakdown,
    d9_dignity_label,
    explain_natal_planet_score,
)
from app.calculations.divisional_charts import get_varga
from app.calculations.ephemeris import (
    THIRUKANITHAM_SUNRISE_CONVENTION,
    RiseTransitUndefinedError,
    calculate_lagna_degree,
    calculate_rise_transit_jd,
)
from app.calculations.nakshatra_analysis import build_dispositor_chain, gandanta_detail, pushkara_check
from app.calculations.panchangam import NAKSHATRA_NAMES
from app.calculations.transits import RASI_NAMES, is_cazimi, is_combust
from app.schemas.charts import PlanetPosition, PlanetScoreTerm

logger = logging.getLogger(__name__)

# ── Maandhi (மாந்தி) ─────────────────────────────────────────────────────────
#
# WHICH TRADITION THIS IS. Vinaadi adopts the **Uttara-Kalamrita** distinction
# between Maandhi and Gulika (owner ruling, 2026-09-29). Under it they are two
# separately calculated points: Maandhi is the proportional nazhigai measure
# below, and Gulika is derived from Saturn's eighth-part. That text distinguishes
# them explicitly and works a Saturday example in which they differ — Maandhi at
# 2 nazhigai after sunrise, Gulika at 3-3/4 — which is exactly what our two
# tables reproduce (see `test_maandhi_and_gulika_diverge_by_a_quarter_nazhigai`).
#
# This is a CHOSEN textual tradition, not a universal rule of Jyotisha. Other
# traditions — some editions and commentaries of Brihat Parashara Hora Shastra,
# and the Prasna-Marga lineage cited in the same debate — use "Mandi" and
# "Gulika" as names for one point. Vinaadi deliberately does not follow that
# convention. Do not "fix" this module by aliasing the two; the disagreement is
# real and the side we take is recorded, per the standing rule that contested
# doctrine is a lineage choice rather than one side being wrong.
#
# Gulika's own tables live with Gulika, in app/calculations/panchangam.py as
# `KULIGAI_SLOT` / `KULIGAI_NIGHT_SLOT`, where the drikpanchang.com cross-checks
# are recorded. Nothing here derives Maandhi from them.
#
# THE MEASURE. The classical constants are stated in nazhigai (நாழிகை, ~24 min)
# of a **30-nazhigai reference span** — half of the 60-nazhigai day-and-night.
# That is a nominal divisor, not the length of any day this engine computes. It
# is not even the equinoctial day: under the ruled apparent-upper-limb sunrise,
# refraction and the upper limb add about 3.5 minutes at each end, so the
# equinox day at 8-13 deg N runs 12h06.8m, about 30.28 nazhigai. So the
# constant is scaled to the true local span:
#
#     day birth:    maandhi_time = sunrise + day_duration   * c / 30
#     night birth:  maandhi_time = sunset  + night_duration * c / 30
#
# Equivalently, and the way a Tamil practitioner states it: the constants are
# read in *proportional* nazhigai, each 1/30th of whichever span the birth falls
# in. Both readings give identical arithmetic; only the first survives a reader
# who knows a nazhigai is a fixed unit of time.
#
# The constant is indexed by the SUNRISE-BOUNDED VAARA, never by
# `date.weekday()` directly — a vaara runs sunrise to sunrise, so a birth
# between midnight and sunrise belongs to the preceding civil date's vaara.
# `maandhi_span` is the single place that decides this; read its docstring
# before touching either table.
#
# Maandhi's longitude is then the nirayana (sidereal) ascendant at that exact
# instant. Deliberately NOT rounded to an eighth-part boundary: 2 nazhigai is
# 1/15th of the span, not 1/8th, and no constant here is a multiple of the
# eighth-part grid.
#
# This replaced an implementation that computed Maandhi as Saturn's eighth-part
# — i.e. as Gulika under a Maandhi name — which made the two indistinguishable
# in the chart and additionally carried a wrong night table.
#
# Sunday -> Saturday, keyed by Python weekday (Mon=0 .. Sun=6).
MAANDHI_DAY_NAZHIGAI = {6: 26, 0: 22, 1: 18, 2: 14, 3: 10, 4: 6, 5: 2}
MAANDHI_NIGHT_NAZHIGAI = {6: 10, 0: 6, 1: 2, 2: 26, 3: 22, 4: 18, 5: 14}
#: Nazhigai in the reference day (or night) the constants above are stated for.
#: A DIVISOR, not the length of any actual day — see the note above. Named
#: "reference" and not "per span" because an actual span is rarely 30 nazhigai.
MAANDHI_REFERENCE_NAZHIGAI = 30

# The eighth-part tables that used to sit here under Maandhi names — a copy of
# panchangam.py's `KULIGAI_SLOT` for the day, and a `day_slot + 4` night form
# that was wrong for four of the seven weekdays — are gone. Gulika's tables
# live with Gulika, in app/calculations/panchangam.py, where the day table's
# drikpanchang.com cross-checks are recorded. Nothing in the chart derives
# Maandhi from them any more.

_PLANET_MEAN_DAILY_SPEED: dict[str, float] = {
    "MOON": 13.176,
    "MERCURY": 1.20,
    "VENUS": 1.20,
    "SUN": 0.9856,
    "MARS": 0.524,
    "JUPITER": 0.083,
    "SATURN": 0.033,
    "RAHU": 0.053,
    "KETU": 0.053,
}
_NATAL_GRAHAS = frozenset({"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"})
_VARGA_DIVISIONS = (2, 3, 4, 7, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60)
# Spec section 3.13: D60 requires exact birth time; >2 min uncertainty is unreliable.
_LOW_RELIABILITY_VARGAS = frozenset({"D60"})
# Classical Deva/Manushya/Rakshasa assignment — must match app.calculations.porutham._GANA.
_NAKSHATRA_GANA = {
    1: "Deva", 2: "Manushya", 3: "Rakshasa", 4: "Manushya", 5: "Deva", 6: "Manushya",
    7: "Deva", 8: "Deva", 9: "Rakshasa", 10: "Rakshasa", 11: "Manushya", 12: "Manushya",
    13: "Deva", 14: "Rakshasa", 15: "Deva", 16: "Rakshasa", 17: "Deva", 18: "Rakshasa",
    19: "Rakshasa", 20: "Manushya", 21: "Manushya", 22: "Deva", 23: "Rakshasa", 24: "Rakshasa",
    25: "Manushya", 26: "Manushya", 27: "Deva",
}

def _nakshatra_gana(nakshatra_number: int) -> str:
    return _NAKSHATRA_GANA.get(nakshatra_number, "Deva")


def _nakshatra_nadi(nakshatra_number: int) -> str:
    mod = (nakshatra_number - 1) % 9
    if mod < 3:
        return "Aadhi"
    if mod < 6:
        return "Madhya"
    return "Anthya"


def _compute_vargas(planet_longitudes: dict[str, float]) -> dict[str, dict[str, int]]:
    return {
        f"D{division}": get_varga(division, planet_longitudes)
        for division in _VARGA_DIVISIONS
    }


def _varga_reliability(confidence_minutes: int) -> dict[str, str]:
    if confidence_minutes > 2:
        return {varga: "LOW" for varga in _LOW_RELIABILITY_VARGAS}
    return {}


def _compute_nakshatra_analysis(planet_longitudes: dict[str, float]) -> dict[str, object]:
    return {
        "dispositor_chain": build_dispositor_chain(planet_longitudes),
        "pushkara": pushkara_check(planet_longitudes),
        "gandanta": gandanta_detail(planet_longitudes),
    }


def _speed_ratio(graha: str, speed_deg_per_day: float) -> float | None:
    mean = _PLANET_MEAN_DAILY_SPEED.get(graha)
    if mean is None or mean <= 0:
        return None
    return abs(speed_deg_per_day) / mean


def _aspect_counts(
    target_graha: str,
    planet_rasi_map: dict[str, int],
    combust_planets: set[str],
    *,
    paksha_is_shukla: bool,
) -> tuple[int, int]:
    target_rasi = planet_rasi_map.get(target_graha)
    if target_rasi is None:
        return 0, 0

    benefics = {"JUPITER", "VENUS"}
    malefics = {"SUN", "MARS", "SATURN", "RAHU", "KETU"}
    if paksha_is_shukla:
        benefics.add("MOON")
    else:
        malefics.add("MOON")
    if "MERCURY" in combust_planets:
        malefics.add("MERCURY")
    else:
        benefics.add("MERCURY")

    benefic_count = 0
    malefic_count = 0
    for source_graha, source_rasi in planet_rasi_map.items():
        if source_graha == target_graha:
            continue
        if source_graha not in _NATAL_GRAHAS:
            continue
        # Shared classical special-aspect table (aspects.py) — the single source
        # of drishti geometry, so the natal drik count can never drift from the
        # rest of the engine (audit C3).
        if not aspects_house(source_graha, source_rasi, target_rasi):
            continue
        if source_graha in benefics:
            benefic_count += 1
        elif source_graha in malefics:
            malefic_count += 1
    return benefic_count, malefic_count


@lru_cache(maxsize=4096)
def _sunrise_sunset_jd(
    birth_date: date,
    birth_timezone: str,
    birth_latitude: float,
    birth_longitude: float,
) -> tuple[float, float] | None:
    """Sunrise and sunset JDs for a civil date and place — the canonical pair.

    Passes `THIRUKANITHAM_SUNRISE_CONVENTION` (apparent upper limb including
    refraction, owner ruling 2026-09-29) **explicitly**, which is exactly what
    `app/calculations/panchangam.py` uses. It said "Hindu, disc-centre" until
    that ruling. The named argument is deliberate and worth the two words:
    doctrine this load-bearing must not be carried by an invisible parameter
    default that a later reader can retune believing it an implementation
    detail. It is also what makes the choice greppable from the call site.

    This is the one sunrise the chart side may use for the vaara boundary, the
    day/night classification and the Maandhi span — see `maandhi_span` for why
    a second convention here would put a birth in two different vaaras.

    Memoised on scalars: a pure function of date and place, and every chart load
    asks for it (see _chart_build._birth_panchangam_signature_items for why a
    per-load recomputation is not free).

    ``None`` means ONE thing: ``RiseTransitUndefinedError`` — the Sun genuinely
    does not rise or set there that day (polar day/night). Every other exception
    propagates, logged at exception level.

    That narrowing is the fix for a blanket ``except Exception: return None``.
    "The Sun did not rise today" and "our ephemeris call broke" must never share
    a return value, and here they shared a *cached* one: this function is
    ``lru_cache``d, so one transient or systematic failure pinned ``None`` for
    that date and place for the rest of the worker's life. Downstream, ``None``
    silently disables Maandhi, moves the vaara boundary and flips Kala Bala's
    day/night term — a wrong chart that renders cleanly. A backend signature
    bug, a bad timezone string, or the next Swiss Ephemeris API change now
    surfaces as a stack trace instead. `_mandhi_longitude` still declines to let
    one upagraha take down a chart render, and catches at its own level; see its
    docstring.
    """
    tz = resolve_timezone(birth_timezone)
    local_midnight = datetime.combine(birth_date, datetime.min.time(), tzinfo=tz)
    jd_start = utc_datetime_to_julian_day(local_midnight.astimezone(UTC))
    try:
        sunrise_jd = calculate_rise_transit_jd(
            jd_start,
            birth_latitude,
            birth_longitude,
            rise=True,
            convention=THIRUKANITHAM_SUNRISE_CONVENTION,
        )
        sunset_jd = calculate_rise_transit_jd(
            jd_start,
            birth_latitude,
            birth_longitude,
            rise=False,
            convention=THIRUKANITHAM_SUNRISE_CONVENTION,
        )
    except RiseTransitUndefinedError:
        logger.debug(
            "No rise/set for %s at %.4f,%.4f (polar day/night) — Maandhi and the "
            "vaara boundary are undefined for this date.",
            birth_date,
            birth_latitude,
            birth_longitude,
        )
        return None
    return sunrise_jd, sunset_jd


def resolve_daytime_birth(
    birth_time_local: time | None,
    *,
    birth_date: date | None = None,
    birth_latitude: float | None = None,
    birth_longitude: float | None = None,
    birth_timezone: str | None = None,
) -> bool | None:
    """Was the Sun above the horizon at birth? Feeds Kala Bala's nathonnatha half.

    Three-valued **on purpose**: ``True`` day, ``False`` night, ``None`` not
    resolvable. Kala Bala must score an unresolved birth neutrally rather than
    receive a fabricated boolean — see `_kala_bala_score`.

    Engine audit G3: this used to be the clock (06:00-18:00), while Mandhi — in
    the same chart — used true sunrise, so a dawn, dusk or high-latitude birth
    could be "day" to one and "night" to the other. With the birth date and place
    it now uses the same true sunrise/sunset as Mandhi.

    **An unknown birth time is now ``None``, not day.** It returned ``True``,
    which silently turned "we do not know" into "born in daylight" and then fed
    that invention to Kala Bala, where it makes Sun/Jupiter/Venus strong and
    Moon/Mars/Saturn weak. There is no doctrine that assumes a daylight birth
    when the time is unknown — classical practice rectifies the time first — so
    the fail-safe goes toward doctrine, which here means abstaining. `_mandhi_
    longitude` already returned None in the same situation; these now agree.

    The 06:00-18:00 clock survives for a KNOWN time at NO place on file, where
    it is an estimate and not an invention: this product's charts sit at roughly
    8-13 deg N, where sunrise runs 05:50-06:30 and sunset 17:45-18:30 all year,
    so the clock is right except within minutes of the boundary.

    It is **no longer** the fallback when a place IS on file and the day/night
    cannot be resolved there. That case is polar day/night, where the clock is at
    its least valid — Oslo on 21 Dec rises 09:18, so a 07:00 birth read as
    "daylight". Having a place and failing to resolve it is exactly the situation
    in which we know the clock is wrong, so this abstains instead, and Kala Bala
    scores nathonnatha at its midpoint. A Tamil-focused product still has readers
    born in Oslo or Toronto, and this is a generic birth-chart function: it does
    not get to hardwire Tamil Nadu's latitude.
    """
    if birth_time_local is None:
        return None
    if (
        birth_date is not None
        and birth_latitude is not None
        and birth_longitude is not None
        and birth_timezone
    ):
        bounds = _sunrise_sunset_jd(birth_date, str(birth_timezone), float(birth_latitude), float(birth_longitude))
        if bounds is None:
            return None
        tz = resolve_timezone(str(birth_timezone))
        birth_jd = utc_datetime_to_julian_day(
            datetime.combine(birth_date, birth_time_local, tzinfo=tz).astimezone(UTC)
        )
        return bounds[0] <= birth_jd < bounds[1]
    return 6 <= birth_time_local.hour < 18


def resolve_daytime_birth_for_profile(profile: object) -> bool | None:
    """``resolve_daytime_birth`` read off a birth profile (ORM row or namespace).

    ``None`` when the profile carries no birth time — see `resolve_daytime_birth`.
    """
    return resolve_daytime_birth(
        getattr(profile, "birth_time_local", None),
        birth_date=getattr(profile, "birth_date_local", None),
        birth_latitude=getattr(profile, "birth_latitude", None),
        birth_longitude=getattr(profile, "birth_longitude", None),
        birth_timezone=getattr(profile, "birth_timezone", None),
    )


def _paksha_is_shukla(moon_longitude: float, sun_longitude: float) -> bool:
    phase = (moon_longitude - sun_longitude) % 360.0
    return phase < 180.0


#: The three vaara-relative portions a birth instant can fall in.
PREVIOUS_NIGHT = "PREVIOUS_NIGHT"
DAY = "DAY"
NIGHT = "NIGHT"


def classify_vaara_portion(birth_jd: float, sunrise_jd: float, sunset_jd: float) -> str:
    """Which portion of which vaara a birth instant falls in. Pure arithmetic.

    Extracted from `maandhi_span` so the doctrine's boundary can be tested at
    **exact float equality**, which no test going through a date/time can do:
    a `datetime` round-trip truncates microseconds, so a "sunrise exactly" case
    built that way is really a case some fraction of a second off, and a
    half-open boundary that had been implemented closed would pass it. See
    `test_vaara_portion_boundaries_at_exact_equality`.

    Half-open, as ruled::

        birth <  sunrise  -> PREVIOUS_NIGHT   (the preceding vaara's night)
        birth == sunrise  -> DAY              (the new vaara begins)
        birth <  sunset   -> DAY
        birth == sunset   -> NIGHT            (same vaara, night portion)
    """
    if birth_jd < sunrise_jd:
        return PREVIOUS_NIGHT
    if birth_jd < sunset_jd:
        return DAY
    return NIGHT


@dataclass(frozen=True)
class MaandhiSpan:
    """Which vaara-bounded span Maandhi divides, and the constant dividing it.

    Separated from `_mandhi_longitude` so the doctrine is inspectable on its
    own: a test can assert which vaara governs a 03:00 birth without having to
    read it back out of an ascendant degree.
    """

    #: The governing vaara, as a civil date. For a pre-sunrise birth this is the
    #: PRECEDING civil date — see `maandhi_span`.
    vara_date: date
    is_day: bool
    start_jd: float
    end_jd: float
    nazhigai: int

    @property
    def maandhi_jd(self) -> float:
        return (
            self.start_jd
            + (self.end_jd - self.start_jd) * self.nazhigai / MAANDHI_REFERENCE_NAZHIGAI
        )


def maandhi_span(
    birth_date: date,
    birth_time_local: time,
    birth_lat: float,
    birth_lng: float,
    birth_timezone: str,
) -> MaandhiSpan | None:
    """Resolve the vaara, the span and the constant for a birth moment.

    **Vinaadi doctrine (owner ruling 2026-09-29, confirmed 2026-09-29):**
    Maandhi is indexed by the SUNRISE-BOUNDED VAARA. The governing vaara begins
    at local sunrise and continues until the following local sunrise. A birth
    after midnight but before local sunrise therefore belongs to the preceding
    civil date's vaara and uses that vaara's night Maandhi constant.

    Boundaries, exactly::

        [sunrise, sunset)      -> day portion of THIS vaara
        [sunset, next_sunrise) -> night portion of THIS vaara

    So at sunrise exactly the new vaara begins (day); at sunset exactly the
    night portion of the same vaara begins.

    The civil midnight rollover is astrologically meaningless here: it must NOT
    change the governing weekday, and crossing local sunrise MUST. Thursday
    03:00 is Wednesday's vaara and takes Wednesday's night constant of 26, not
    Thursday's 22 — `datetime.weekday()` alone would have given the wrong one,
    and the night constants are up to 24 nazhigai apart (Wed 26 vs Tue 2), so
    this is not a rounding-scale distinction.

    Sunrise and sunset come from `_sunrise_sunset_jd`, which is the same
    `calculate_rise_transit_jd` under the same `THIRUKANITHAM_SUNRISE_CONVENTION`
    that the panchangam uses. That is deliberate and load-bearing: if the vaara
    boundary were computed on a different convention from the panchangam's
    sunrise, a birth inside the ~3.5-minute gap between them would sit in
    Wednesday's vaara according to one engine and Thursday's according to the
    other. One canonical sunrise feeds the vaara boundary, the day/night
    classification, the span and the constant.

    Returns None when the ephemeris has no rise/set for the day (polar
    latitudes), which is the same condition `_sunrise_sunset_jd` reports.
    """
    tz = resolve_timezone(birth_timezone)
    today = _sunrise_sunset_jd(birth_date, birth_timezone, birth_lat, birth_lng)
    if today is None:
        return None
    sunrise_jd, sunset_jd = today
    birth_jd = utc_datetime_to_julian_day(
        datetime.combine(birth_date, birth_time_local, tzinfo=tz).astimezone(UTC)
    )

    portion = classify_vaara_portion(birth_jd, sunrise_jd, sunset_jd)

    if portion == PREVIOUS_NIGHT:
        vara_date = birth_date - timedelta(days=1)
        previous = _sunrise_sunset_jd(vara_date, birth_timezone, birth_lat, birth_lng)
        if previous is None:
            return None
        return MaandhiSpan(
            vara_date=vara_date,
            is_day=False,
            start_jd=previous[1],
            end_jd=sunrise_jd,
            nazhigai=MAANDHI_NIGHT_NAZHIGAI[vara_date.weekday()],
        )

    if portion == DAY:
        return MaandhiSpan(
            vara_date=birth_date,
            is_day=True,
            start_jd=sunrise_jd,
            end_jd=sunset_jd,
            nazhigai=MAANDHI_DAY_NAZHIGAI[birth_date.weekday()],
        )

    following = _sunrise_sunset_jd(birth_date + timedelta(days=1), birth_timezone, birth_lat, birth_lng)
    if following is None:
        return None
    return MaandhiSpan(
        vara_date=birth_date,
        is_day=False,
        start_jd=sunset_jd,
        end_jd=following[0],
        nazhigai=MAANDHI_NIGHT_NAZHIGAI[birth_date.weekday()],
    )


def _mandhi_longitude(
    birth_date: date,
    birth_time_local: time | None,
    birth_lat: float,
    birth_lng: float,
    birth_timezone: str,
) -> float | None:
    """Maandhi's nirayana longitude at birth.

    Thin wrapper: `maandhi_span` decides *which* span and *which* constant,
    which is where all the doctrine lives, and this turns the resulting instant
    into an ascendant. Returns None with no birth time — Maandhi is a
    moment-of-birth measure and there is nothing to place without one.

    The two ways Maandhi is legitimately unavailable — no birth time, and no
    rise/set for the day — are each returned explicitly above. Anything else
    reaching the handler below is a defect, and it is **logged at exception
    level** rather than folded into the same silent None. A blanket
    `except Exception: return None` here would let the next wrong-ayanamsa or
    wrong-convention bug present as "Maandhi unavailable" on a chart instead of
    as a stack trace, which is how the Fagan/Bradley cold start survived. It is
    still swallowed rather than raised, because one upagraha must not take down
    a whole chart render, but it no longer does so quietly.
    """
    if birth_time_local is None:
        return None
    try:
        span = maandhi_span(birth_date, birth_time_local, birth_lat, birth_lng, birth_timezone)
        if span is None:
            return None
        return calculate_lagna_degree(span.maandhi_jd, birth_lat, birth_lng)
    except Exception:
        logger.exception(
            "Unexpected Maandhi calculation failure for %s %s at %.4f,%.4f (%s) — "
            "this is a defect, not an unavailable-Maandhi condition.",
            birth_date,
            birth_time_local,
            birth_lat,
            birth_lng,
            birth_timezone,
        )
        return None


def _mandhi_planet_position(longitude: float, lagna_rasi: int) -> PlanetPosition:
    rasi = int((longitude % 360) // 30) + 1
    nakshatra_number = nakshatra_from_degree(longitude)
    d9_rasi = navamsa_rasi_from_degree(longitude)
    return PlanetPosition(
        graha="MANDHI",
        rasi_name=RASI_NAMES[rasi],
        absolute_longitude=longitude,
        rasi=rasi,
        degree_in_rasi=degree_in_rasi(longitude),
        nakshatra=nakshatra_number,
        nakshatra_name=NAKSHATRA_NAMES[nakshatra_number - 1],
        pada=pada_from_degree(longitude),
        house_from_lagna=house_from_reference(lagna_rasi, rasi),
        speed_deg_per_day=0.0,
        is_retrograde=False,
        is_combust=False,
        is_cazimi=False,
        d9_rasi=d9_rasi,
        d9_dignity=d9_dignity_label("MANDHI", d9_rasi),
        is_vargottama=rasi == d9_rasi,
        show_retrograde_badge=False,
        strength_score=0,
        strength_breakdown={
            "sthana": "NEUTRAL",
            "dik": "NEUTRAL",
            "kala": "NEUTRAL",
            "chesta": "NEUTRAL",
            "naisargika": "NEUTRAL",
            "drik": "NEUTRAL",
            # Mandhi is a shadow upagraha, not a real graha — it has no
            # classical Shadbala/avastha of its own, so these stay neutral.
            "baladi": "NEUTRAL",
            "jagradadi": "NEUTRAL",
            "deeptadi": "NEUTRAL",
        },
    )


def _planet_position_from_snapshot(
    body: object,
    *,
    lagna_rasi: int,
    sun_degree: float,
    # Three-valued since v1.4: `None` when the birth's day/night is unresolvable
    # (no time on file, or polar day/night at a known place). Passed straight
    # through to `_kala_bala_score`, which scores nathonnatha at its midpoint
    # rather than on a fabricated boolean. The annotation said `bool`, which is
    # how a reader concludes it is safe to coerce.
    is_daytime: bool | None,
    paksha_is_shukla: bool,
    benefic_aspect_count: int = 0,
    malefic_aspect_count: int = 0,
    planetary_wars: dict[str, str] | None = None,
    planet_rasi_map: Mapping[str, int] | None = None,
) -> PlanetPosition:
    rasi_name = RASI_NAMES[body.rasi]  # type: ignore[attr-defined]
    nakshatra_number = nakshatra_from_degree(body.absolute_longitude)  # type: ignore[attr-defined]
    d9_rasi = navamsa_rasi_from_degree(body.absolute_longitude)  # type: ignore[attr-defined]
    is_vargottama = body.rasi == d9_rasi  # type: ignore[attr-defined]
    speed_ratio = _speed_ratio(body.graha, body.speed_deg_per_day)  # type: ignore[attr-defined]
    strength_score, score_terms = explain_natal_planet_score(
        body.graha,  # type: ignore[attr-defined]
        body.rasi,  # type: ignore[attr-defined]
        body.absolute_longitude,  # type: ignore[attr-defined]
        lagna_rasi,
        sun_degree,
        body.is_retrograde,  # type: ignore[attr-defined]
        is_vargottama=is_vargottama,
        d9_rasi=d9_rasi,
        is_daytime=is_daytime,
        paksha_is_shukla=paksha_is_shukla,
        speed_ratio=speed_ratio,
        benefic_aspect_count=benefic_aspect_count,
        malefic_aspect_count=malefic_aspect_count,
        planetary_wars=planetary_wars,
        planet_rasi_map=planet_rasi_map,
    )
    return PlanetPosition(
        graha=body.graha,  # type: ignore[attr-defined]
        rasi_name=rasi_name,
        absolute_longitude=body.absolute_longitude,  # type: ignore[attr-defined]
        rasi=body.rasi,  # type: ignore[attr-defined]
        degree_in_rasi=body.degree_in_rasi,  # type: ignore[attr-defined]
        nakshatra=nakshatra_number,
        nakshatra_name=NAKSHATRA_NAMES[nakshatra_number - 1],
        pada=pada_from_degree(body.absolute_longitude),  # type: ignore[attr-defined]
        house_from_lagna=house_from_reference(lagna_rasi, body.rasi),  # type: ignore[attr-defined]
        speed_deg_per_day=body.speed_deg_per_day,  # type: ignore[attr-defined]
        is_retrograde=body.is_retrograde,  # type: ignore[attr-defined]
        # Cazimi and combust are mutually exclusive: a planet in the heart of the
        # Sun is empowered, not burnt, so it must not read as combust to yoga
        # detection or the combust badge even though it sits inside the orb.
        is_combust=(
            is_combust(body.graha, body.absolute_longitude, sun_degree, body.is_retrograde)  # type: ignore[attr-defined]
            and not is_cazimi(body.graha, body.absolute_longitude, sun_degree)  # type: ignore[attr-defined]
        ),
        is_cazimi=is_cazimi(body.graha, body.absolute_longitude, sun_degree),  # type: ignore[attr-defined]
        d9_rasi=d9_rasi,
        d9_dignity=d9_dignity_label(body.graha, d9_rasi),  # type: ignore[attr-defined]
        is_vargottama=is_vargottama,
        show_retrograde_badge=body.show_retrograde_badge and body.graha not in {"RAHU", "KETU"},  # type: ignore[attr-defined]
        strength_score=strength_score,
        strength_breakdown=compute_strength_breakdown(
            body.graha,  # type: ignore[attr-defined]
            body.rasi,  # type: ignore[attr-defined]
            body.absolute_longitude,  # type: ignore[attr-defined]
            lagna_rasi,
            body.is_retrograde,  # type: ignore[attr-defined]
            is_vargottama=is_vargottama,
            d9_rasi=d9_rasi,
            is_daytime=is_daytime,
            paksha_is_shukla=paksha_is_shukla,
            benefic_aspect_count=benefic_aspect_count,
            malefic_aspect_count=malefic_aspect_count,
            speed_ratio=speed_ratio,
            planet_rasi_map=planet_rasi_map,
        ),
        score_terms=[
            PlanetScoreTerm(
                key=c.key,
                points=c.points,
                detail_key=c.detail_key,
                detail_value=c.detail_value,
            )
            for c in score_terms
        ],
    )
