"""Amanta lunar month — the month a tithi festival is named by (FCA-01).

Vinayagar Chaturthi, Skanda Sashti, Maha Sivarathiri, Deepavali and Mahalaya
Amavasai are *lunar*-month festivals: Bhadrapada Shukla Chaturthi, Kartika
Shukla Sashti, Magha Krishna Chaturdashi, Ashvina Krishna Chaturdashi and
Bhadrapada Amavasai. They used to be named by tithi + **solar** Tamil month.
A solar month (29-32 days) can hold zero, one or two occurrences of a given
tithi, and the lunar month drifts up to ~18 days against it, so the rule fired
a month early (Vinayagar Chaturthi 2023: 20 Aug, observed 18 Sep), twice
(Deepavali 2028) or never (Skanda Sashti 2031). See
docs/FULL_CODEBASE_AUDIT_2026-10-22.md FCA-01.

The reckoning is amanta (new moon to new moon), as in Tamil Nadu:

* A lunar month runs from one new moon to the next.
* It is named for the sankranti that falls inside it: the month whose opening
  new moon has the Sun in sidereal rasi *r* (0 = Mesha) is month *r* + 1 —
  Sun in Meena at the new moon opens Chaitra, because Mesha sankranti
  (Puthandu) falls inside that lunation.
* A lunation with no sankranti inside it — the Sun in the same rasi at both
  bounding new moons — is **adhika** (intercalary). It takes the next month's
  name and carries no festival; the festival falls in the nija month after.

Sidereal (Lahiri) longitudes, the same as every other panchangam limb here.
Pure ephemeris arithmetic: no database, no timezone, no location.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.calculations.ephemeris import calculate_sun_moon_longitudes

#: 0-indexed, Chaitra first — the order `AmantaMonth.index` uses.
LUNAR_MONTH_NAMES: tuple[str, ...] = (
    "CHAITRA", "VAISHAKHA", "JYESHTHA", "ASHADHA", "SHRAVANA", "BHADRAPADA",
    "ASHVINA", "KARTIKA", "MARGASHIRSHA", "PAUSHA", "MAGHA", "PHALGUNA",
)

LUNAR_CHAITRA = 0
LUNAR_SHRAVANA = 4
LUNAR_BHADRAPADA = 5
LUNAR_ASHVINA = 6
LUNAR_KARTIKA = 7
LUNAR_MAGHA = 10

_MEAN_SYNODIC_DAYS = 29.530588853
_MEAN_ELONGATION_RATE = 360.0 / _MEAN_SYNODIC_DAYS  # deg/day
# 1e-6 deg of elongation is ~0.1 s of time — far finer than any sankranti that
# could sit near a new moon. The iteration contracts by |1 - true/mean rate|,
# at worst ~0.25, so this converges in about ten steps.
_TOLERANCE_DEG = 1e-6
_MAX_ITERATIONS = 40


@dataclass(frozen=True, slots=True)
class AmantaMonth:
    index: int  # 0 = Chaitra … 11 = Phalguna
    is_adhika: bool
    starts_jd: float  # opening new moon
    ends_jd: float  # closing new moon

    @property
    def name(self) -> str:
        return LUNAR_MONTH_NAMES[self.index]


def _elongation_and_sun(jd: float) -> tuple[float, float]:
    sun, moon = calculate_sun_moon_longitudes(jd)
    return (moon - sun) % 360.0, sun


def _refine_elongation(guess_jd: float, target_deg: float) -> float:
    """The instant nearest `guess_jd` (within ~half a lunation) at which the
    Moon-Sun elongation equals `target_deg`."""
    jd = guess_jd
    for _ in range(_MAX_ITERATIONS):
        elongation, _sun = _elongation_and_sun(jd)
        # Signed distance from the target, in (-180, 180].
        error = (elongation - target_deg) % 360.0
        if error > 180.0:
            error -= 360.0
        if abs(error) < _TOLERANCE_DEG:
            return jd
        jd -= error / _MEAN_ELONGATION_RATE
    raise RuntimeError(f"elongation {target_deg} search did not converge near JD {guess_jd}")


def elongation_instant(guess_jd: float, target_deg: float) -> float:
    """Public form of `_refine_elongation`: where a tithi begins or ends (a
    multiple of 12 degrees), nearest `guess_jd`."""
    return _refine_elongation(guess_jd, target_deg)


def _refine_new_moon(guess_jd: float) -> float:
    """The new moon nearest `guess_jd` (within ~half a lunation)."""
    return _refine_elongation(guess_jd, 0.0)


def full_moon_tamil_month_index(jd: float) -> int:
    """The Sun's sidereal rasi (0 = Mesha, which is also the Tamil month index)
    at the full moon nearest `jd`.

    A Pournami-anchored star festival (Thai Poosam, Karthigai Deepam, ...)
    belongs to the solar month its full moon falls in (ruling 2026-10-22 Q5).
    The instant, not the civil Pournami day: the two can name different months
    only when a sankranti falls within hours of the full moon.
    """
    elongation, _sun = _elongation_and_sun(jd)
    full_moon = _refine_elongation(jd - ((elongation - 180.0) / _MEAN_ELONGATION_RATE), 180.0)
    return _sun_rasi(full_moon)


def previous_new_moon_jd(jd: float) -> float:
    """The last new moon at or before `jd`."""
    elongation, _sun = _elongation_and_sun(jd)
    found = _refine_new_moon(jd - elongation / _MEAN_ELONGATION_RATE)
    if found > jd:  # the guess overshot onto the conjunction just ahead
        found = _refine_new_moon(found - _MEAN_SYNODIC_DAYS)
    return found


def _sun_rasi(jd: float) -> int:
    _elongation, sun = _elongation_and_sun(jd)
    return int(sun // 30.0) % 12


def amanta_month_at(jd: float) -> AmantaMonth:
    """The amanta lunar month in force at instant `jd`."""
    start = previous_new_moon_jd(jd)
    end = _refine_new_moon(start + _MEAN_SYNODIC_DAYS)
    if end <= jd:  # `jd` sat a hair past a conjunction the search rounded onto
        start, end = end, _refine_new_moon(end + _MEAN_SYNODIC_DAYS)
    rasi_at_start = _sun_rasi(start)
    return AmantaMonth(
        index=(rasi_at_start + 1) % 12,
        is_adhika=rasi_at_start == _sun_rasi(end),
        starts_jd=start,
        ends_jd=end,
    )


def amavasai_month_for_day(sunrise_jd: float, sunrise_tithi_number: int) -> AmantaMonth:
    """The lunation an Amavasai *day* belongs to.

    An Amavasai is the last tithi of the month it closes. When the new moon has
    already passed by this day's sunrise (sunrise tithi is Prathama or later),
    the day's dominant Amavasai belongs to the lunation that just ended, not
    the one in force at sunrise.
    """
    month = amanta_month_at(sunrise_jd)
    # Shukla at sunrise means the conjunction is already behind us. Krishna
    # Chaturdashi (29) or Amavasai (30) at sunrise means it is still ahead and
    # closes the lunation in force.
    if sunrise_tithi_number <= 15:
        return amanta_month_at(month.starts_jd - 1e-3)
    return month
