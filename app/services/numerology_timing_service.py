"""Time numerology orchestration (NUM-40..45, Phase 4).

Three jobs, and nothing else:

1. Resolve the D1 epoch from the ``numerology_personal_year_epoch`` flag and
   supply the Puthandu resolver the pure engine refuses to guess.
2. Layer numerology onto the **existing** muhurta and muhurtham-naal engines
   without ever changing what they concluded.
3. Gate everything on ``numerology_engine`` (via ``numerology_service``, which
   owns the one copy of that gate) so an accidental early wiring stays dark
   rather than shipping unreviewed copy.

The layering rule, restated because it is the whole design
----------------------------------------------------------
Muhurta and the curated naal sheet remain **authoritative**. This module adds a
bounded adjustment (±8 on their 0-100 scales) and re-sorts. Two hard guards keep
that from becoming a re-ranking of the astrology:

* ``numerology_timing.score_date`` refuses to hand back a *positive* adjustment
  for a date the astrology has flagged, and
* the sort keys below put the astrological verdict first — an unrecommended naal
  can never sort above a recommended one, and a slot carrying cautions can never
  sort above a clean one — so numerology only ever reorders *within* a band the
  astrology already agreed on.

Purity split: every function that does the actual numerology takes plain values
and is unit-testable without a database. Only the ``*_for_chart`` entry points
touch the session, and they are thin.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, timedelta
from functools import lru_cache
from uuid import UUID

from sqlalchemy.orm import Session

from app.calculations.numerology_alignment import favourable_numbers_for
from app.calculations.numerology_timing import (
    ChithiraiResolver,
    DateNumerology,
    PersonalCycle,
    PersonalYearEpoch,
    personal_cycle,
    resolve_epoch,
    score_date,
)
from app.calculations.tamil_calendar import tamil_solar_date
from app.schemas.muhurta import MuhurtaSlot
from app.services.feature_flags import get_flag
from app.services.muhurta_service import find_best_muhurta_slots
from app.services.muhurtham_naal_service import MuhurthamNaalMatch, match_muhurtham_naals
from app.services.numerology_service import (
    NumerologyChartContext,
    load_chart_context,
    numerology_enabled,
    require_numerology_enabled,
)

__all__ = [
    "CALCULATION_VERSION",
    "LuckyDate",
    "LuckyDates",
    "MarriageDates",
    "NumerologyNaalMatch",
    "chithirai_start",
    "configured_epoch",
    "cycle_for",
    "cycle_for_chart",
    "layer_onto_muhurta_slots",
    "layer_onto_naal_matches",
    "lucky_dates_for_chart",
    "marriage_dates_for_chart",
    # Re-exported from numerology_service: this module owned the flag gate
    # before Phase 3 needed one too, and callers still reach for it here.
    "numerology_enabled",
    "require_numerology_enabled",
]

logger = logging.getLogger(__name__)

CALCULATION_VERSION = "numerology-timing-v1"

#: Puthandu falls when the Sun enters sidereal Mesha. Scanned rather than
#: assumed: the civil day depends on the sankranti instant against that day's
#: sunset (see tamil_calendar). Measured over 1960-2060 at the Chennai
#: reference point below, it lands on 14 April 83 times, 13 April 14 times and
#: 15 April 4 times — so a hardcoded 14 April would be wrong about one year in
#: six.
_PUTHANDU_SCAN_START = (4, 10)
_PUTHANDU_SCAN_DAYS = 12

#: Puthandu is a solar event; the civil date can differ by a day between
#: longitudes. Tamil Nadu reference point (Chennai) for the default resolver.
_DEFAULT_TZ = "Asia/Kolkata"
_DEFAULT_LAT = 13.0827
_DEFAULT_LON = 80.2707


def configured_epoch() -> PersonalYearEpoch:
    """The D1 epoch currently in force.

    An unparseable flag value raises rather than falling back to the default —
    silently shipping a year boundary nobody chose is exactly the class of
    quiet-wrong-answer bug this feature keeps guarding against.
    """
    return resolve_epoch(get_flag("numerology_personal_year_epoch"))


@lru_cache(maxsize=256)
def chithirai_start(
    year: int,
    timezone_name: str = _DEFAULT_TZ,
    latitude: float = _DEFAULT_LAT,
    longitude: float = _DEFAULT_LON,
) -> date:
    """Civil date of Chithirai 1 (Puthandu) in ``year``.

    Scans mid-April for the day the Tamil solar calendar reports as month 0,
    day 1. Cached because it costs several ephemeris calls and never changes.
    """
    first = date(year, *_PUTHANDU_SCAN_START)
    for offset in range(_PUTHANDU_SCAN_DAYS):
        day = first + timedelta(days=offset)
        month_index, day_of_month = tamil_solar_date(day, timezone_name, latitude, longitude)
        if month_index == 0 and day_of_month == 1:
            return day
    raise ValueError(
        f"could not locate Chithirai 1 in {year} within "
        f"{_PUTHANDU_SCAN_DAYS} days of {first.isoformat()}"
    )


def _chithirai_resolver(
    epoch: PersonalYearEpoch, timezone_name: str, lat: float, lon: float
) -> ChithiraiResolver | None:
    """Only build a resolver when the epoch needs one — it costs ephemeris calls."""
    if epoch is not PersonalYearEpoch.CHITHIRAI:
        return None
    return lambda y: chithirai_start(y, timezone_name, lat, lon)


def cycle_for(
    birth_date: date,
    on_date: date,
    *,
    epoch: PersonalYearEpoch | None = None,
    timezone_name: str = _DEFAULT_TZ,
    latitude: float = _DEFAULT_LAT,
    longitude: float = _DEFAULT_LON,
) -> PersonalCycle:
    """Personal year/month/day under the configured epoch (NUM-40, NUM-41)."""
    resolved = epoch or configured_epoch()
    return personal_cycle(
        birth_date,
        on_date,
        epoch=resolved,
        chithirai_start_for=_chithirai_resolver(resolved, timezone_name, latitude, longitude),
    )


# ---------------------------------------------------------------------------
# Layering — pure, session-free, and therefore testable
# ---------------------------------------------------------------------------
@dataclass(frozen=True, slots=True)
class LuckyDate:
    """One muhurta slot with its numerology layer kept visibly separate.

    ``slot.score`` is the astrology's own verdict and is never overwritten;
    ``adjusted_score`` is what the ranking used. Keeping both means a surface
    can always show what the numerology actually moved.
    """

    slot: MuhurtaSlot
    numerology: DateNumerology
    adjusted_score: float


@dataclass(frozen=True, slots=True)
class LuckyDates:
    activity: str
    timezone_name: str
    favourable_numbers: tuple[int, ...]
    epoch: PersonalYearEpoch
    dates: tuple[LuckyDate, ...]
    calculation_version: str = CALCULATION_VERSION


@dataclass(frozen=True, slots=True)
class NumerologyNaalMatch:
    match: MuhurthamNaalMatch
    numerology: DateNumerology
    adjusted_score: float


@dataclass(frozen=True, slots=True)
class MarriageDates:
    year: int
    favourable_numbers: tuple[int, ...]
    epoch: PersonalYearEpoch
    matches: tuple[NumerologyNaalMatch, ...]
    #: The chart context muhurtham_naal_service already returns (janma star,
    #: chandrashtama rasi, counts, source) — passed through unchanged.
    chart_context: dict
    calculation_version: str = CALCULATION_VERSION


def layer_onto_muhurta_slots(
    slots: list[MuhurtaSlot],
    *,
    favourable_numbers: tuple[int, ...],
    birth_date: date | None = None,
    epoch: PersonalYearEpoch = PersonalYearEpoch.BIRTHDAY,
    chithirai_start_for: ChithiraiResolver | None = None,
) -> list[LuckyDate]:
    """Annotate and re-rank muhurta slots (NUM-42, NUM-44).

    Best-first. **No slot is added or removed** — the muhurta engine decided
    which dates are fit to act on, and this only reorders that set.

    A slot carrying cautions sorts below every clean slot regardless of its
    numerology, which is the doctrine rule made structural rather than
    advisory.
    """
    layered: list[LuckyDate] = []
    for slot in slots:
        numerology = score_date(
            slot.date,
            favourable_numbers=favourable_numbers,
            birth_date=birth_date,
            epoch=epoch,
            chithirai_start_for=chithirai_start_for,
            has_astrological_caution=bool(slot.cautions),
        )
        layered.append(
            LuckyDate(
                slot=slot,
                numerology=numerology,
                adjusted_score=slot.score + numerology.adjustment,
            )
        )

    # Astrology first: clean slots outrank flagged ones whatever the number says.
    layered.sort(key=lambda row: (bool(row.slot.cautions), -row.adjusted_score, row.slot.date))
    return layered


def layer_onto_naal_matches(
    matches: list[MuhurthamNaalMatch],
    *,
    favourable_numbers: tuple[int, ...],
    birth_date: date | None = None,
    epoch: PersonalYearEpoch = PersonalYearEpoch.BIRTHDAY,
    chithirai_start_for: ChithiraiResolver | None = None,
) -> list[NumerologyNaalMatch]:
    """Annotate and re-rank curated muhurtham naals (NUM-43).

    Best-first. ``is_recommended`` is read, never written: numerology cannot
    promote a chandrashtama or avoid-tara date into the recommended set, and the
    sort key puts recommended dates ahead of the rest before any number is
    consulted.
    """
    layered: list[NumerologyNaalMatch] = []
    for match in matches:
        numerology = score_date(
            date.fromisoformat(match.naal.date),
            favourable_numbers=favourable_numbers,
            birth_date=birth_date,
            epoch=epoch,
            chithirai_start_for=chithirai_start_for,
            has_astrological_caution=not match.is_recommended,
        )
        layered.append(
            NumerologyNaalMatch(
                match=match,
                numerology=numerology,
                adjusted_score=match.match_score + numerology.adjustment,
            )
        )

    layered.sort(
        key=lambda row: (not row.match.is_recommended, -row.adjusted_score, row.match.naal.date)
    )
    return layered


# ---------------------------------------------------------------------------
# Chart-backed entry points
# ---------------------------------------------------------------------------
def _favourable_and_epoch(
    ctx: NumerologyChartContext,
) -> tuple[tuple[int, ...], PersonalYearEpoch, ChithiraiResolver | None]:
    """The three chart-derived inputs every layering call needs."""
    favourable = favourable_numbers_for(
        ctx.lagna_rasi, strengths=ctx.strengths, node_rasi_map=ctx.node_rasi_map
    )
    epoch = configured_epoch()
    return favourable, epoch, _chithirai_resolver(
        epoch, ctx.timezone_name, ctx.latitude, ctx.longitude
    )


def cycle_for_chart(
    chart_id: UUID,
    on_date: date,
    session: Session,
) -> PersonalCycle:
    """Personal year/month/day for the native behind a chart (NUM-40, NUM-41).

    Takes the birth date from the chart rather than the caller, and resolves
    Puthandu at the *native's own* location — the Chithirai epoch turns on a
    sankranti instant against local sunset, so a Malaysian and a Chennai native
    can legitimately roll over on different civil days.
    """
    require_numerology_enabled()
    ctx = load_chart_context(session, chart_id)
    epoch = configured_epoch()
    return personal_cycle(
        ctx.birth_date,
        on_date,
        epoch=epoch,
        chithirai_start_for=_chithirai_resolver(
            epoch, ctx.timezone_name, ctx.latitude, ctx.longitude
        ),
    )


def lucky_dates_for_chart(
    chart_id: UUID,
    activity: str,
    date_from: date,
    date_to: date,
    session: Session,
) -> LuckyDates:
    """Muhurta slots for an activity, re-ranked by numerology (NUM-42, NUM-44).

    The muhurta engine runs first and unmodified; this only annotates and
    reorders what it returned.
    """
    require_numerology_enabled()
    ctx = load_chart_context(session, chart_id)
    muhurta = find_best_muhurta_slots(chart_id, activity, date_from, date_to, session)

    favourable, epoch, chithirai = _favourable_and_epoch(ctx)
    layered = layer_onto_muhurta_slots(
        list(muhurta.data.slots),
        favourable_numbers=favourable,
        birth_date=ctx.birth_date,
        epoch=epoch,
        chithirai_start_for=chithirai,
    )
    return LuckyDates(
        activity=muhurta.data.activity,
        timezone_name=muhurta.data.timezone,
        favourable_numbers=favourable,
        epoch=epoch,
        dates=tuple(layered),
    )


def marriage_dates_for_chart(
    chart_id: UUID,
    year: int,
    session: Session,
    *,
    recommended_only: bool = False,
) -> MarriageDates:
    """Curated muhurtham naals for a year, re-ranked by numerology (NUM-43)."""
    require_numerology_enabled()
    ctx = load_chart_context(session, chart_id)
    matches, context = match_muhurtham_naals(
        chart_id, year, session, recommended_only=recommended_only
    )

    favourable, epoch, chithirai = _favourable_and_epoch(ctx)
    layered = layer_onto_naal_matches(
        matches,
        favourable_numbers=favourable,
        birth_date=ctx.birth_date,
        epoch=epoch,
        chithirai_start_for=chithirai,
    )
    return MarriageDates(
        year=year,
        favourable_numbers=favourable,
        epoch=epoch,
        matches=tuple(layered),
        chart_context=context,
    )
