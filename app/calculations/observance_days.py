"""Which civil day a solar-month observance falls on (rulings 2026-10-22, round two).

Two rules, kept apart because conflating them is what moved and deleted dates
in the first round (§0.1 of the ruling): a *day-naming* rule, which every
observance has, and a *tie-break*, which fires only when there is a tie.

**Day naming (§0.3, §5).** An occurrence of a star or tithi is named by the
civil day on which its kala (the moment of the principal worship) falls inside
it; if it holds two, the first. If it holds none, the day it holds at sunrise,
first of two. If it holds no sunrise either (it begins after one sunrise and
ends before the next), the sunrise-to-sunrise day that contains it. The last
case names the day only: it is reached only when no kala and no sunrise fell
inside the occurrence, so it can never override a kala satisfied elsewhere.

**Duplicate tie-break (§3, CONVENTION).**

    FIRES WHEN: the same star (or special tithi) is named on two days of one
                Tamil solar month
    EFFECT:     keep the one in the amanta lunar month that BEGINS inside that
                solar month
    OTHERWISE:  dormant -- the single named day stands

Before either tie-break, a day that holds the occurrence at its kala or at
sunrise beats one that only contains it (§0.3 ranks containment last; Aadi
Krithigai 2025, 20 Jul, not the contained 16 Aug).

The proximity tests (nearest Pournami, nearest Amavasai) were tie-breaks
applied as filters, and the ruling withdrew them. One survives, as a gated
tie-break only: "beside the month's own full moon", for the stars named by
their union with the month's Pournami (Family A and Karthigai Deepam; answers
of 23 Oct, Q4/Q5). When it cannot decide, §3 does.

Pure ephemeris arithmetic plus the Tamil month boundaries; no database.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from functools import lru_cache
from typing import Literal
from zoneinfo import ZoneInfo

from app.calculations.astro import julian_day_to_utc_datetime, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_rise_transit_jd, calculate_sun_moon_longitudes
from app.calculations.lunar_month import amanta_month_at, elongation_instant, full_moon_tamil_month_index
from app.calculations.tamil_calendar import tamil_month_spans
from app.constants.astrology import NAKSHATRA_NAMES

Kala = Literal["sunrise", "sunset", "aparahna"]
# "kala_two": the kala fell inside the occurrence on two days and the first
# was taken (§6). Reported separately so the audit can count it.
NamedBy = Literal["kala", "kala_two", "sunrise", "contained"]
TieBreak = Literal["lunar_month", "full_moon_month"]

_NAKSHATRA_SPAN = 40.0 / 3.0
_SIDEREAL_MONTH_DAYS = 27.321661
_SYNODIC_MONTH_DAYS = 29.530588853
_MEAN_MOON_RATE = 360.0 / _SIDEREAL_MONTH_DAYS  # deg/day
# The Moon's speed stays within ~15% of the mean, so the iteration contracts
# by at most ~0.17 a step; 1e-7 deg is well under a second.
_TOLERANCE_DEG = 1e-7
_MAX_ITERATIONS = 60


@dataclass(frozen=True, slots=True)
class Occurrence:
    """One stretch of a star or tithi, [start_jd, end_jd)."""

    start_jd: float
    end_jd: float

    def holds(self, jd: float) -> bool:
        return self.start_jd <= jd < self.end_jd


@dataclass(frozen=True, slots=True)
class Candidate:
    day: date
    named_by: NamedBy
    # The amanta month in force at the instant that named the day opens
    # inside the solar month (§3's test).
    lunar_month_begins_in_solar_month: bool
    # The full moon nearest the day has the Sun in the solar month's rasi
    # (the full-moon tie-break).
    beside_own_full_moon: bool


@dataclass(frozen=True, slots=True)
class SolarMonthSelection:
    month_start: date
    month_end: date
    candidates: tuple[Candidate, ...]
    # One day, or none when a duplicate stays undecided (unresolved).
    selected: tuple[date, ...]
    tie_break_fired: bool
    # The tie-break fired and did not reduce the candidates to one day.
    unresolved: bool

    @property
    def suppressed(self) -> tuple[Candidate, ...]:
        return tuple(c for c in self.candidates if c.day not in self.selected)


def _moon_longitude_instant(guess_jd: float, target_deg: float) -> float:
    jd = guess_jd
    for _ in range(_MAX_ITERATIONS):
        _sun, moon = calculate_sun_moon_longitudes(jd)
        error = (moon - target_deg) % 360.0
        if error > 180.0:
            error -= 360.0
        if abs(error) < _TOLERANCE_DEG:
            return jd
        jd -= error / _MEAN_MOON_RATE
    raise RuntimeError(f"moon longitude {target_deg} search did not converge near JD {guess_jd}")


def star_occurrences(star: str, from_jd: float, to_jd: float) -> list[Occurrence]:
    """Every stretch of `star` that overlaps [from_jd, to_jd]."""
    begin = NAKSHATRA_NAMES.index(star.upper()) * _NAKSHATRA_SPAN
    _sun, moon = calculate_sun_moon_longitudes(from_jd)
    guess = from_jd + ((begin - moon) % 360.0) / _MEAN_MOON_RATE - _SIDEREAL_MONTH_DAYS
    found: list[Occurrence] = []
    while True:
        start = _moon_longitude_instant(guess, begin)
        if start > to_jd:
            return found
        end = _moon_longitude_instant(start + 1.0, (begin + _NAKSHATRA_SPAN) % 360.0)
        if end > from_jd:
            found.append(Occurrence(start, end))
        guess = start + _SIDEREAL_MONTH_DAYS


def tithi_occurrences(tithi: int, from_jd: float, to_jd: float) -> list[Occurrence]:
    """Every stretch of tithi `tithi` (1..30) that overlaps [from_jd, to_jd]."""
    begin = (tithi - 1) * 12.0
    sun, moon = calculate_sun_moon_longitudes(from_jd)
    elongation = (moon - sun) % 360.0
    guess = from_jd + ((begin - elongation) % 360.0) * _SYNODIC_MONTH_DAYS / 360.0 - _SYNODIC_MONTH_DAYS
    found: list[Occurrence] = []
    while True:
        start = elongation_instant(guess, begin)
        if start > to_jd:
            return found
        end = elongation_instant(start + 1.0, (begin + 12.0) % 360.0)
        if end > from_jd:
            found.append(Occurrence(start, end))
        guess = start + _SYNODIC_MONTH_DAYS


class _Clock:
    """Sunrise, sunset and aparahna of civil days at one place, memoised."""

    def __init__(self, timezone_name: str, latitude: float, longitude: float) -> None:
        self.tz = ZoneInfo(timezone_name)
        self.latitude = latitude
        self.longitude = longitude
        self._sunrise: dict[date, float] = {}
        self._sunset: dict[date, float] = {}

    def civil_date(self, jd: float) -> date:
        return julian_day_to_utc_datetime(jd).astimezone(self.tz).date()

    def sunrise(self, d: date) -> float:
        if d not in self._sunrise:
            midnight = datetime.combine(d, time(0, 0), tzinfo=self.tz)
            self._sunrise[d] = calculate_rise_transit_jd(
                utc_datetime_to_julian_day(midnight.astimezone(UTC)), self.latitude, self.longitude, rise=True
            )
        return self._sunrise[d]

    def sunset(self, d: date) -> float:
        if d not in self._sunset:
            self._sunset[d] = calculate_rise_transit_jd(self.sunrise(d), self.latitude, self.longitude, rise=False)
        return self._sunset[d]

    def at(self, d: date, kala: Kala) -> float:
        if kala == "sunrise":
            return self.sunrise(d)
        if kala == "sunset":
            return self.sunset(d)
        # Midpoint of aparahna, the fourth fifth of daytime.
        return self.sunrise(d) + 0.7 * (self.sunset(d) - self.sunrise(d))


def name_day(occurrence: Occurrence, kala: Kala, clock: _Clock) -> tuple[date, NamedBy, float]:
    """The civil day `occurrence` is observed on, how it was named, and the
    instant that named it (see the module docstring)."""
    first = clock.civil_date(occurrence.start_jd) - timedelta(days=1)
    last = clock.civil_date(occurrence.end_jd) + timedelta(days=1)
    days = [first + timedelta(days=i) for i in range((last - first).days + 1)]
    for d in days:
        if occurrence.holds(jd := clock.at(d, kala)):
            twice = occurrence.holds(clock.at(d + timedelta(days=1), kala))
            return d, "kala_two" if twice else "kala", jd
    if kala != "sunrise":
        for d in days:
            if occurrence.holds(jd := clock.sunrise(d)):
                return d, "sunrise", jd
    for d in days:
        if clock.sunrise(d) <= occurrence.start_jd < clock.sunrise(d + timedelta(days=1)):
            return d, "contained", occurrence.start_jd
    raise RuntimeError(f"no civil day contains the occurrence at JD {occurrence.start_jd}")


@lru_cache(maxsize=1024)
def select_in_solar_month(
    kind: Literal["star", "tithi"],
    value: str | int,
    kala: Kala,
    day_in_month: date,
    timezone_name: str,
    latitude: float,
    longitude: float,
    tie_break: TieBreak = "lunar_month",
) -> SolarMonthSelection:
    """The day of the Tamil solar month containing `day_in_month` on which
    `value` (a star name, or a tithi number) is observed.

    `tie_break` is consulted only when the month holds two named days, after
    a contained day has given way to one holding its kala or sunrise:
    "lunar_month" is §3; "full_moon_month" is the union with the month's
    Pournami (Q4/Q5 of 23 Oct), gated behind that same duplicate check (§9.3),
    with §3 deciding what it cannot (Vaikasi 2022, 2041 -> 12 Jun).
    """
    span = tamil_month_spans(day_in_month, 1, timezone_name, latitude, longitude)[0]
    clock = _Clock(timezone_name, latitude, longitude)
    window_from = clock.sunrise(span.start - timedelta(days=2))
    window_to = clock.sunrise(span.end + timedelta(days=3))
    occurrences = (
        star_occurrences(str(value), window_from, window_to)
        if kind == "star"
        else tithi_occurrences(int(value), window_from, window_to)
    )
    candidates: list[Candidate] = []
    for occurrence in occurrences:
        day, named_by, instant = name_day(occurrence, kala, clock)
        if not span.start <= day <= span.end:
            continue
        lunar_start = clock.civil_date(amanta_month_at(instant).starts_jd)
        candidates.append(Candidate(
            day,
            named_by,
            lunar_month_begins_in_solar_month=span.start <= lunar_start <= span.end,
            beside_own_full_moon=full_moon_tamil_month_index(clock.sunrise(day)) == span.rasi,
        ))

    selected: tuple[date, ...] = ()
    fired = unresolved = False
    if len(candidates) == 1:
        selected = (candidates[0].day,)
    elif len(candidates) > 1:
        fired = True
        pool = [c for c in candidates if c.named_by != "contained"] or candidates
        kept = pool
        if len(pool) > 1 and tie_break == "full_moon_month":
            kept = [c for c in pool if c.beside_own_full_moon]
        if len(kept) != 1:
            kept = [c for c in (kept or pool) if c.lunar_month_begins_in_solar_month]
        unresolved = len(kept) != 1
        # An undecided tie names no day (it has not happened in 2020-2045;
        # the audit reports it).
        if not unresolved:
            selected = (kept[0].day,)
    return SolarMonthSelection(
        month_start=span.start,
        month_end=span.end,
        candidates=tuple(candidates),
        selected=selected,
        tie_break_fired=fired,
        unresolved=unresolved,
    )


def printed_tithi_day_on_or_after(
    tithi: int, day: date, timezone_name: str, latitude: float, longitude: float
) -> date:
    """The first day on or after `day` printed as `tithi` — the tithi at
    sunrise, first of two, or the day containing a kshaya tithi (Q6, §5).
    Varalakshmi's "the Pournami" (§9.1)."""
    clock = _Clock(timezone_name, latitude, longitude)
    sunrise = clock.sunrise(day)
    for occurrence in tithi_occurrences(tithi, sunrise - 1.5, sunrise + 31.0):
        named, _how, _jd = name_day(occurrence, "sunrise", clock)
        if named >= day:
            return named
    raise RuntimeError(f"no tithi {tithi} within a lunation of {day}")


_KRISHNA_ASHTAMI = 23


def nisheetha(clock: _Clock, evening: date) -> float:
    """True midnight of the night opening on `evening`: the midpoint of sunset
    to the next sunrise."""
    return (clock.sunset(evening) + clock.sunrise(evening + timedelta(days=1))) / 2


def _evening_begins(clock: _Clock, d: date) -> float:
    """Where "the evening part of the day" starts: the opening of aparahna, the
    fourth fifth of daytime (`_Clock.at` samples its midpoint)."""
    rise, set_ = clock.sunrise(d), clock.sunset(d)
    return rise + 0.6 * (set_ - rise)


def jayanthi_yoga_day(day: date, timezone_name: str, latitude: float, longitude: float) -> date | None:
    """The day of the Jayanthi yoga of the Krishna Ashtami nearest `day`, or
    None when Ashtami and Rohini do not overlap, or do not overlap late enough.

    Where they overlap, the yoga decides Krishna Jayanthi ahead of Ashtami at
    nisheetha (answers of 23 Oct, §2.3): the night whose nisheetha lies in the
    overlap, printed by its evening; if no nisheetha does, the day the overlap
    begins.

    **The overlap must reach the evening** to override (A1a of the follow-up,
    23 Oct): it has to touch some day's aparahna-to-nisheetha stretch, "the
    midnight or the evening part of the day". A morning-only overlap does not,
    and the Ashtami-at-nisheetha rule stands -- 2019's ran 03:47 to 08:32 on
    24 Aug, and Tamil Nadu kept 23 Aug. Returning None is that fallback.

    Reproduces all 11 round-two vectors, Drik Panchang's Chennai smarta dates
    (2021, 2026-2031) and the Tamil Nadu holidays of 2016 and 2019: 19 of 19
    published dates, where the rule without the threshold matched 18.
    """
    clock = _Clock(timezone_name, latitude, longitude)
    sunrise = clock.sunrise(day)
    ashtamis = tithi_occurrences(_KRISHNA_ASHTAMI, sunrise - 4.0, sunrise + 4.0)
    if not ashtamis:
        raise RuntimeError(f"no Krishna Ashtami within four days of {day}")
    ashtami = min(ashtamis, key=lambda o: abs((o.start_jd + o.end_jd) / 2 - sunrise))
    for rohini in star_occurrences("ROHINI", ashtami.start_jd - 1.5, ashtami.end_jd + 1.5):
        start, end = max(rohini.start_jd, ashtami.start_jd), min(rohini.end_jd, ashtami.end_jd)
        if start >= end:
            continue
        first = clock.civil_date(start) - timedelta(days=1)
        days = [first + timedelta(days=i) for i in range(3)]
        if not any(start < nisheetha(clock, d) and _evening_begins(clock, d) < end for d in days):
            return None
        for evening in days:
            if start <= nisheetha(clock, evening) < end:
                return evening
        return clock.civil_date(start)
    return None
