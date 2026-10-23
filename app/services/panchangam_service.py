from __future__ import annotations

import calendar
import logging
from dataclasses import replace
from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import UUID
from zoneinfo import ZoneInfoNotFoundError

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.calculations.astro import format_clock_hhmm, julian_day_to_utc_datetime, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_rise_transit_jd, calculate_sun_moon_longitudes
from app.calculations.festivals import (
    SOLAR_MONTH_OBSERVANCES,
    NisheethaNight,
    ObservanceInstants,
    get_festivals_for_date,
)
from app.calculations.lunar_month import amanta_month_at, amavasai_month_for_day
from app.calculations.observance_days import jayanthi_yoga_day, printed_tithi_day_on_or_after, select_in_solar_month
from app.calculations.panchangam import (
    _compute_subha_muhurtham_broad,
    _compute_subha_muhurtham_strict,
    _tithi_number_at_jd,
)
from app.calculations.tamil_calendar import (
    TAMIL_MONTHS,
    format_tamil_date,
    tamil_date_source,
    tamil_month_spans,
    tamil_solar_date,
)
from app.constants.astrology import NAKSHATRA_NAMES
from app.data.muhurtham_naals import get_muhurtham_naals
from app.models import BirthProfile, Chart
from app.schemas.panchangam import (
    BiText,
    PanchangamAbhijit,
    PanchangamAmirdhadhiYogam,
    PanchangamChandrashtamamNakshatraWindow,
    PanchangamChandrashtamamToday,
    PanchangamDailyQuery,
    PanchangamDailyResponse,
    PanchangamDailyResponseData,
    PanchangamFestival,
    PanchangamHoraEntry,
    PanchangamKalam,
    PanchangamKarana,
    PanchangamLagnam,
    PanchangamLimbSpan,
    PanchangamLocation,
    PanchangamMeta,
    PanchangamMonthDayEntry,
    PanchangamMonthlyData,
    PanchangamMonthlyQuery,
    PanchangamMonthlyResponse,
    PanchangamNakshatra,
    PanchangamNethiramJeevan,
    PanchangamSlot,
    PanchangamSoolam,
    PanchangamSpecialTithiDay,
    PanchangamSubhaMuhurtham,
    PanchangamTimingsData,
    PanchangamTimingsResponse,
    PanchangamTithi,
    PanchangamVara,
    PanchangamYoga,
    TamilMonthsData,
    TamilMonthSpanEntry,
    TamilMonthsResponse,
)
from app.services.location_service import EffectiveDailyLocation, resolve_effective_daily_location
from app.services.panchangam_cache import calculate_daily_panchangam, calculate_daily_panchangam_range
from app.services.panchangam_events_service import is_karinaal

PANCHANGAM_CALCULATION_VERSION = "thirukanitham-2026-v5"
logger = logging.getLogger(__name__)


def _overlaps(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    return a_start < b_end and b_start < a_end


def _gowri_conflict_warning(slot, snapshot) -> str | None:
    if _overlaps(slot.start, slot.end, snapshot.rahu_kalam.start, snapshot.rahu_kalam.end):
        return "Coincides with Rahu Kalam — use with caution"
    if _overlaps(slot.start, slot.end, snapshot.yamagandam.start, snapshot.yamagandam.end):
        return "Coincides with Yamagandam — use with caution"
    if _overlaps(slot.start, slot.end, snapshot.kuligai.start, snapshot.kuligai.end):
        return "Coincides with Kuligai — use with caution"
    return None


def _build_slot(slot, snapshot, *, warn_on_conflict: bool) -> PanchangamSlot:
    return PanchangamSlot(
        start=format_clock_hhmm(slot.start),
        end=format_clock_hhmm(slot.end),
        slot=slot.slot,
        warning=_gowri_conflict_warning(slot, snapshot) if warn_on_conflict else None,
        name=slot.name,
        period=slot.period,
        is_good=slot.is_good,
    )


def _build_kalam(snapshot) -> PanchangamKalam:
    return PanchangamKalam(
        rahu_kalam=PanchangamSlot(
            start=format_clock_hhmm(snapshot.rahu_kalam.start),
            end=format_clock_hhmm(snapshot.rahu_kalam.end),
            slot=snapshot.rahu_kalam.slot,
        ),
        yamagandam=PanchangamSlot(
            start=format_clock_hhmm(snapshot.yamagandam.start),
            end=format_clock_hhmm(snapshot.yamagandam.end),
            slot=snapshot.yamagandam.slot,
        ),
        kuligai=PanchangamSlot(
            start=format_clock_hhmm(snapshot.kuligai.start),
            end=format_clock_hhmm(snapshot.kuligai.end),
            slot=snapshot.kuligai.slot,
        ),
        gowri_panchangam=[
            _build_slot(w, snapshot, warn_on_conflict=True)
            for w in snapshot.gowri_panchangam
        ],
        nalla_neram=[
            _build_slot(w, snapshot, warn_on_conflict=False)
            for w in snapshot.nalla_neram
        ],
        gowri_nalla_neram=[
            _build_slot(w, snapshot, warn_on_conflict=True)
            for w in snapshot.gowri_nalla_neram
        ],
        # No conflict warning: that warning is about a good Gowri kala landing
        # on an inauspicious kalam, and Durmuhurtham is never a good kala.
        durmuhurtham=[
            _build_slot(w, snapshot, warn_on_conflict=False)
            for w in snapshot.durmuhurtham
        ],
    )


_NAKSHATRA_SPAN = 40 / 3
_MARGAZHI = 8  # TAMIL_MONTHS index
# The sunrise vratams' first-of-two needs the previous sunrise's star.
_STARS_NEEDING_PREVIOUS_SUNRISE = frozenset({"ROHINI", "THIRUVONAM"})
# A star at sunset can be Karthigai only if the sunrise star is Bharani or
# Karthigai itself (a star lasts under ~27 h).
_SUNRISE_STARS_BEFORE_KARTHIGAI = frozenset({"BHARANI", "KARTHIGAI"})
# A Jayanthi night whose nisheetha lands on this civil day opens on this or
# the previous evening; Krishna Ashtami (23), or a bracketing Saptami/Navami
# in the tie-break, can sit there only if the sunrise tithi is Krishna
# Shashthi..Dasami.
_SUNRISE_TITHIS_NEAR_KRISHNA_ASHTAMI = frozenset({21, 22, 23, 24, 25})
# Varalakshmi (§9.1): a Friday at most six days before the Pournami has a
# bright-fortnight tithi of at least Saptami at sunrise.
_SUNRISE_TITHIS_BEFORE_POURNAMI = frozenset(range(7, 16))


def _star_at_jd(jd: float) -> str:
    sun, moon = calculate_sun_moon_longitudes(jd)
    return NAKSHATRA_NAMES[int(((moon % 360.0) + 1e-9) // _NAKSHATRA_SPAN) % 27]


def _aparahna_jd(sunrise_jd: float, sunset_jd: float) -> float:
    """Midpoint of aparahna, the fourth fifth of daytime."""
    return sunrise_jd + 0.7 * (sunset_jd - sunrise_jd)


def _observance_instants(snapshot) -> ObservanceInstants:
    """FCA-04 — the values observances read at instants other than sunrise.

    Each is computed only when the sunrise state makes it reachable, so the
    other days of the month pay nothing. A failure leaves the field None,
    which omits that observance rather than guessing it from sunrise.
    """
    # Heterogeneous by design: each key is one ObservanceInstants field.
    values: dict[str, Any] = {}
    try:
        sunrise_jd = utc_datetime_to_julian_day(snapshot.sunrise.astimezone(UTC))
        sunset_jd = utc_datetime_to_julian_day(snapshot.sunset.astimezone(UTC))
        sunrise_star = snapshot.nakshatra_name.upper()
        lat, lng = snapshot.latitude, snapshot.longitude

        def rise_after(jd: float) -> float:
            return calculate_rise_transit_jd(jd, lat, lng, rise=True)

        def set_after(jd: float) -> float:
            return calculate_rise_transit_jd(jd, lat, lng, rise=False)

        # A star that holds neither this sunrise nor the next is a middle span
        # of the sunrise-to-sunrise day.
        spans = snapshot.nakshatra_spans or []
        kshaya_star = spans[1].name.upper() if len(spans) >= 3 else None
        values["kshaya_nakshatra_name"] = kshaya_star
        if sunrise_star in _SUNRISE_STARS_BEFORE_KARTHIGAI:
            values["sunset_nakshatra_name"] = _star_at_jd(sunset_jd)
            values["previous_sunset_nakshatra_name"] = _star_at_jd(
                calculate_rise_transit_jd(sunrise_jd - 1.2, snapshot.latitude, snapshot.longitude, rise=False)
            )
        if sunrise_star in _STARS_NEEDING_PREVIOUS_SUNRISE:
            values["previous_sunrise_nakshatra_name"] = _star_at_jd(
                calculate_rise_transit_jd(sunrise_jd - 1.2, snapshot.latitude, snapshot.longitude, rise=True)
            )
        # Krishna Chaturthi (19) can hold this evening's moonrise only if the
        # sunrise tithi is Tritiya (18) or Chaturthi itself.
        if snapshot.tithi_number in (18, 19):
            def moonrise_after(jd: float) -> float:
                return calculate_rise_transit_jd(jd, snapshot.latitude, snapshot.longitude, rise=True, body="MOON")

            moonrise_jd = moonrise_after(sunrise_jd)
            values["moonrise_tithi_number"] = _tithi_number_at_jd(moonrise_jd)
            # Moonrise recurs every ~24h50m, so these land on the neighbours'.
            values["previous_moonrise_tithi_number"] = _tithi_number_at_jd(moonrise_after(moonrise_jd - 1.5))
            values["next_moonrise_tithi_number"] = _tithi_number_at_jd(moonrise_after(moonrise_jd + 0.5))
        if snapshot.tithi_number in (1, 2):
            values["previous_sunrise_tithi_number"] = _tithi_number_at_jd(
                calculate_rise_transit_jd(sunrise_jd - 1.2, snapshot.latitude, snapshot.longitude, rise=True)
            )
        # Shukla Chathurthi (§5): the first of two sunrises, or the day it falls
        # in when it holds none. Both read the neighbours' sunrise tithis, and
        # only a Tritiya or Chaturthi sunrise can be that day.
        if snapshot.tithi_number in (3, 4):
            values["previous_sunrise_tithi_number"] = _tithi_number_at_jd(rise_after(sunrise_jd - 1.2))
            values["next_sunrise_tithi_number"] = _tithi_number_at_jd(rise_after(sunset_jd))
        # A Dashami sunrise followed by a Dwadasi one holds a kshaya Ekadashi
        # (§5); the aparahna block below covers Shukla Dashami (10).
        if snapshot.tithi_number == 25:
            values["next_sunrise_tithi_number"] = _tithi_number_at_jd(rise_after(sunset_jd))
        # Aparahna, with both neighbours' (they decide "two aparahnas" and
        # "none") and both neighbours' sunrise tithis (the fallback day).
        # Navami or Dasami can hold the afternoon only if the sunrise tithi is
        # Ashtami..Dasami (Shukla — the Navarathiri fortnight); Amavasai, for
        # tharpanam (ruling Q6), only if it is Chaturdashi or Amavasai.
        if snapshot.tithi_number in (8, 9, 10, 29, 30):
            previous_sunrise = rise_after(sunrise_jd - 1.2)
            next_sunrise = rise_after(sunset_jd)
            values["aparahna_tithi_number"] = _tithi_number_at_jd(_aparahna_jd(sunrise_jd, sunset_jd))
            values["previous_aparahna_tithi_number"] = _tithi_number_at_jd(
                _aparahna_jd(previous_sunrise, set_after(previous_sunrise))
            )
            values["next_aparahna_tithi_number"] = _tithi_number_at_jd(
                _aparahna_jd(next_sunrise, set_after(next_sunrise))
            )
            values["previous_sunrise_tithi_number"] = _tithi_number_at_jd(previous_sunrise)
            values["next_sunrise_tithi_number"] = _tithi_number_at_jd(next_sunrise)
        # Krishna Jayanthi (§2): nisheetha is the midpoint of the night, sunset
        # to the next sunrise. The nights opening on the evenings of day -2,
        # -1, 0 and +1, each with both civil dates it could be printed on.
        if snapshot.tithi_number in _SUNRISE_TITHIS_NEAR_KRISHNA_ASHTAMI:
            tz = snapshot.sunrise.tzinfo
            # Computed first, so a failure here leaves no nights to judge by
            # the Ashtami-only rule either.
            values["jayanthi_yoga_day"] = jayanthi_yoga_day(snapshot.date_local, snapshot.timezone_name, lat, lng)
            values["jayanthi_yoga_known"] = True

            def civil(jd: float) -> date:
                return julian_day_to_utc_datetime(jd).astimezone(tz).date()

            rise = rise_after(sunrise_jd - 2.2)
            nights = []
            for _ in range(4):
                sunset = set_after(rise)
                rise = rise_after(sunset)
                nisheetha = (sunset + rise) / 2
                nights.append(NisheethaNight(
                    tithi_number=_tithi_number_at_jd(nisheetha),
                    nakshatra_name=_star_at_jd(nisheetha),
                    evening_date=civil(sunset),
                    nisheetha_date=civil(nisheetha),
                ))
            values["nisheetha_nights"] = tuple(nights)
        # Varalakshmi (§9.1): how far the printed Pournami is from a Friday.
        if snapshot.weekday == "FRIDAY" and snapshot.tithi_number in _SUNRISE_TITHIS_BEFORE_POURNAMI:
            pournami_day = printed_tithi_day_on_or_after(
                15, snapshot.date_local, snapshot.timezone_name, lat, lng
            )
            values["days_until_pournami_day"] = (pournami_day - snapshot.date_local).days
        if snapshot.nishita_tithi_number == 29:
            local_midnight = datetime.combine(snapshot.date_local, datetime.min.time(), tzinfo=snapshot.sunrise.tzinfo)
            values["previous_nishita_tithi_number"] = _tithi_number_at_jd(
                utc_datetime_to_julian_day(local_midnight.astimezone(UTC))
            )
    except Exception as exc:
        logger.warning("Observance instants failed for %s: %s", snapshot.date_local, exc)
    return ObservanceInstants(**values)


def _solar_month_observances(
    snapshot, tamil_month_index: int | None, tamil_day_of_month: int | None
) -> tuple[frozenset[str], frozenset[str], frozenset[tuple[str, str]]]:
    """§3 — the solar-month observances that fall on this day, those whose
    duplicate tie-break fired to choose it, and how each day was named.

    Each is decided once per month (`select_in_solar_month` is cached), and
    only asked on a day its star or tithi can reach: the star at sunrise, the
    star before it (a sunset kala), or a star contained in the day; for a
    tithi, the tithi or the one before it at sunrise.
    """
    if tamil_month_index is None or tamil_day_of_month is None:
        return frozenset(), frozenset(), frozenset()
    spans = snapshot.nakshatra_spans or []
    stars = {snapshot.nakshatra_name.upper()}
    if len(spans) >= 3:
        stars.add(spans[1].name.upper())
    month_start = snapshot.date_local - timedelta(days=tamil_day_of_month - 1)
    falls: set[str] = set()
    fired: set[str] = set()
    named_by: set[tuple[str, str]] = set()
    for observance in SOLAR_MONTH_OBSERVANCES:
        if observance.tamil_month != tamil_month_index:
            continue
        if observance.kind == "star":
            index = NAKSHATRA_NAMES.index(str(observance.value))
            if not stars & {NAKSHATRA_NAMES[index], NAKSHATRA_NAMES[index - 1]}:
                continue
        elif snapshot.tithi_number not in (int(observance.value) - 1, int(observance.value)):
            continue
        try:
            selection = select_in_solar_month(
                observance.kind, observance.value, observance.kala, month_start,
                snapshot.timezone_name, snapshot.latitude, snapshot.longitude, observance.tie_break,
            )
        except Exception as exc:
            logger.warning("%s selection failed for %s: %s", observance.name, snapshot.date_local, exc)
            continue
        if snapshot.date_local in selection.selected:
            falls.add(observance.name)
            if selection.tie_break_fired:
                fired.add(observance.name)
            named_by.update(
                (observance.name, c.named_by) for c in selection.candidates if c.day == snapshot.date_local
            )
    return frozenset(falls), frozenset(fired), frozenset(named_by)


def _build_festivals(
    snapshot,
    *,
    tithi_number: int | None = None,
    tithi_paksha: str | None = None,
    nakshatra_name: str | None = None,
    previous_day_snapshot=None,
) -> list[PanchangamFestival]:
    try:
        tamil_month_index, tamil_day_of_month = tamil_solar_date(
            snapshot.date_local,
            snapshot.timezone_name,
            snapshot.latitude,
            snapshot.longitude,
        )
    except Exception as exc:
        logger.debug("Tamil month lookup failed for %s: %s", snapshot.date_local, exc)
        tamil_month_index = None
        tamil_day_of_month = None

    instants = _observance_instants(snapshot)
    # Bhogi is the last day of Margazhi; only a late-month day can be one.
    if tamil_month_index == _MARGAZHI and (tamil_day_of_month or 0) >= 28:
        try:
            _, tomorrow_day = tamil_solar_date(
                snapshot.date_local + timedelta(days=1),
                snapshot.timezone_name,
                snapshot.latitude,
                snapshot.longitude,
            )
            instants = replace(instants, tamil_month_ends_today=tomorrow_day == 1)
        except Exception as exc:
            logger.debug("Next-day Tamil date failed for %s: %s", snapshot.date_local, exc)
    solar_month, tie_breaks, named_by = _solar_month_observances(snapshot, tamil_month_index, tamil_day_of_month)
    instants = replace(
        instants,
        solar_month_observances=solar_month,
        solar_month_tie_breaks=tie_breaks,
        solar_month_named_by=named_by,
    )

    # FCA-01: lunar-month festivals are named by the amanta month, not the
    # solar Tamil month. Derived from the cached sunrise, so no cache-schema
    # change. On failure they are omitted rather than guessed from the solar
    # month, which is the rule that was wrong.
    lunar_month = amavasai_month = None
    try:
        sunrise_jd = utc_datetime_to_julian_day(snapshot.sunrise.astimezone(UTC))
        lunar_month = amanta_month_at(sunrise_jd)
        # The sunrise Amavasai day, or a tharpanam day (Chaturdashi or
        # Amavasai at sunrise, ruling Q6).
        if snapshot.special_tithi_day_number == 30 or snapshot.tithi_number in (29, 30):
            amavasai_month = amavasai_month_for_day(sunrise_jd, snapshot.tithi_number)
    except Exception as exc:
        logger.warning("Lunar month lookup failed for %s: %s", snapshot.date_local, exc)

    return [
        PanchangamFestival(name=f["name"], category=f["category"], tags=f.get("tags", [f["category"]]))
        for f in get_festivals_for_date(
            snapshot.date_local,
            tithi_number if tithi_number is not None else snapshot.tithi_number,
            tithi_paksha if tithi_paksha is not None else snapshot.tithi_paksha,
            nakshatra_name if nakshatra_name is not None else snapshot.nakshatra_name,
            weekday=snapshot.weekday,
            tamil_month_index=tamil_month_index,
            special_tithi_day_number=snapshot.special_tithi_day_number,
            pradhosham_tithi_number=snapshot.pradhosham_tithi_number or None,
            nishita_tithi_number=snapshot.nishita_tithi_number or None,
            tamil_day_of_month=tamil_day_of_month,
            previous_day_tithi_number=previous_day_snapshot.tithi_number if previous_day_snapshot else None,
            previous_day_tithi_paksha=previous_day_snapshot.tithi_paksha if previous_day_snapshot else None,
            lunar_month_index=lunar_month.index if lunar_month else None,
            lunar_month_is_adhika=lunar_month.is_adhika if lunar_month else False,
            amavasai_lunar_month_index=amavasai_month.index if amavasai_month else None,
            amavasai_lunar_month_is_adhika=amavasai_month.is_adhika if amavasai_month else False,
            instants=instants,
        )
    ]


def _previous_day_snapshot(snapshot, session: Session | None):
    """Yesterday's snapshot, for the Ekadashi two-consecutive-sunrise dedup
    (WI-12) — best-effort: on any failure, festivals still compute, just
    without that one dedup refinement (see _build_festivals' docstring note
    on the equivalent parameter in festivals.py).

    Only fetched when today's own sunrise tithi is 11 (Ekadashi) — the only
    case _recurring_tithi_festivals actually consults it — so the other
    ~26 days of every lunar month pay no extra ephemeris call or cache write
    per request (a real cost: this doubles panchangam cache rows otherwise,
    see tests/test_panchangam_api.py's cache-row-count assertions).
    """
    tithi_in_paksha = snapshot.tithi_number if snapshot.tithi_number <= 15 else snapshot.tithi_number - 15
    if tithi_in_paksha != 11:
        return None
    try:
        return calculate_daily_panchangam(
            snapshot.date_local - timedelta(days=1),
            snapshot.latitude,
            snapshot.longitude,
            snapshot.timezone_name,
            session=session,
        )
    except Exception as exc:
        logger.debug("Previous-day panchangam lookup failed for %s: %s", snapshot.date_local, exc)
        return None


def _build_tamil_date(snapshot) -> BiText | None:
    try:
        ta, en = format_tamil_date(
            snapshot.date_local,
            snapshot.timezone_name,
            snapshot.latitude,
            snapshot.longitude,
        )
        return BiText(ta=ta, en=en)
    except Exception as exc:
        logger.debug("Tamil date conversion failed for %s: %s", snapshot.date_local, exc)
        return None


def _build_tamil_date_source(snapshot) -> str | None:
    """FCA-02 — whether `_build_tamil_date` is the almanac's date or the rule's."""
    try:
        return tamil_date_source(
            snapshot.date_local,
            snapshot.timezone_name,
            snapshot.latitude,
            snapshot.longitude,
        )
    except Exception as exc:
        logger.debug("Tamil date source lookup failed for %s: %s", snapshot.date_local, exc)
        return None


def _build_special_tithi_day(snapshot) -> PanchangamSpecialTithiDay | None:
    if snapshot.special_tithi_day_number == 15:
        return PanchangamSpecialTithiDay(tithiNumber=15, name="POURNAMI", moonPhase="FULL")
    if snapshot.special_tithi_day_number == 30:
        return PanchangamSpecialTithiDay(tithiNumber=30, name="AMAVASAI", moonPhase="NEW")
    return None


def _ends(moment: datetime) -> dict[str, str]:
    """The `endsAt` / `endsAtIso` field pair for ONE instant.

    Every limb boundary ships twice: a nearest-minute display string and the
    exact instant. Those are two renderings of one event and must never name two
    different events, so they are produced from a single argument here rather
    than typed out side by side at each call site.

    That hand-wiring was the real hazard. Eight pairs in this module each named
    their snapshot field twice, and nothing structural stopped one of them
    reading `nakshatra_ends_at` for the clock and `tithi_ends_at` for the ISO —
    a mis-wire that ships a boundary a client cannot reconcile, with no type
    error and no test failure unless a test happens to compare the two. Passing
    the instant once removes the class.

    Why the two strings still differ by up to 30 s, deliberately: `endsAt` is
    presentation and rounds half-up (`format_clock_hhmm`, doctrine §1); the ISO
    value stays exact because clients compare it against `now` to decide whether
    a limb has rolled over, and rounding it would report a limb still active for
    up to 30 s after it ended. So `endsAtIso[11:16]` is NOT `endsAt` — it
    truncates. Round it before comparing.
    """
    return {"ends_at": format_clock_hhmm(moment), "ends_at_iso": moment.isoformat()}


def _starts(moment: datetime) -> dict[str, str]:
    """The `startsAt` / `startsAtIso` pair for one instant. See `_ends`.

    A span's start is the previous span's end — the same instant — and both go
    through the same pure rounding, so the shared boundary renders as one time on
    both sides of it.
    """
    return {"starts_at": format_clock_hhmm(moment), "starts_at_iso": moment.isoformat()}


def _spans(spans) -> list[PanchangamLimbSpan]:
    """Map engine spans onto the wire shape.

    Both a bare "HH:MM" and a full ISO local datetime go out for each edge. A
    limb boundary routinely lands on the next calendar day (this is a solar day,
    sunrise to sunrise), and a clock-only string cannot say which day — the same
    trap the tithi-rollover fix already hit once.
    """
    return [
        PanchangamLimbSpan(
            number=span.number,
            name=span.name,
            **_starts(span.start),
            **_ends(span.end),
            fraction=round(span.fraction, 4),
        )
        for span in spans
    ]


def calculate_panchangam(query: PanchangamDailyQuery, session: Session | None = None) -> PanchangamDailyResponse:
    snapshot = calculate_daily_panchangam(query.date, query.lat, query.lng, query.timezone, session=session)
    previous_day_snapshot = _previous_day_snapshot(snapshot, session)

    return PanchangamDailyResponse(
        data=PanchangamDailyResponseData(
            date_local=snapshot.date_local,
            tamil_date=_build_tamil_date(snapshot),
            tamil_date_source=_build_tamil_date_source(snapshot),
            location=PanchangamLocation(lat=snapshot.latitude, lng=snapshot.longitude, timezone=snapshot.timezone_name),
            sunrise=format_clock_hhmm(snapshot.sunrise),
            sunset=format_clock_hhmm(snapshot.sunset),
            solar_noon=format_clock_hhmm(snapshot.solar_noon),
            vara=PanchangamVara(weekday=snapshot.weekday, lord=snapshot.weekday_lord),
            tithi=PanchangamTithi(
                number=snapshot.tithi_number,
                name=snapshot.tithi_name,
                paksha=snapshot.tithi_paksha,
                **_ends(snapshot.tithi_ends_at),
                next_number=snapshot.tithi_next_number,
                next_name=snapshot.tithi_next_name,
                next_paksha=snapshot.tithi_next_paksha,
                spans=_spans(snapshot.tithi_spans),
            ),
            nakshatra=PanchangamNakshatra(
                name=snapshot.nakshatra_name,
                pada=snapshot.nakshatra_pada,
                **_ends(snapshot.nakshatra_ends_at),
                next_name=snapshot.nakshatra_next_name,
                spans=_spans(snapshot.nakshatra_spans),
            ),
            yoga=PanchangamYoga(
                number=snapshot.yoga_number,
                name=snapshot.yoga_name,
                **_ends(snapshot.yoga_ends_at),
                next_name=snapshot.yoga_next_name,
                spans=_spans(snapshot.yoga_spans),
            ),
            karana=PanchangamKarana(
                name=snapshot.karana_name,
                **_ends(snapshot.karana_ends_at),
                next_name=snapshot.karana_next_name,
                spans=_spans(snapshot.karana_spans),
            ),
            kalam=_build_kalam(snapshot),
            abhijit=PanchangamAbhijit(
                start=format_clock_hhmm(snapshot.abhijit_start),
                end=format_clock_hhmm(snapshot.abhijit_end),
                is_restricted_by_weekday=snapshot.abhijit_restricted,
            ),
            subha_muhurtham=PanchangamSubhaMuhurtham(
                is_subha=snapshot.is_subha_muhurtham,
                reason=snapshot.subha_muhurtham_reason,
                is_subha_strict=snapshot.is_subha_muhurtham_strict,
                strict_reason=snapshot.subha_muhurtham_strict_reason,
            ),
            festivals=_build_festivals(snapshot, previous_day_snapshot=previous_day_snapshot),
            hora=[
                PanchangamHoraEntry(
                    index=entry.index,
                    lord=entry.lord,
                    start=format_clock_hhmm(entry.start),
                    end=format_clock_hhmm(entry.end),
                )
                for entry in snapshot.hora
            ],
            moon_phase_label=snapshot.moon_phase_label,
            soolam=PanchangamSoolam(
                direction=snapshot.soolam_direction,
                parigaram=snapshot.soolam_parigaram,
                status="preliminary",
            ),
            lagnam=PanchangamLagnam(
                rasi_number=snapshot.lagna_rasi_number,
                rasi_name=snapshot.lagna_rasi_name,
                **_ends(snapshot.lagna_ends_at),
                nazhigai=snapshot.lagna_nazhigai,
                vinadi=snapshot.lagna_vinadi,
            ),
            nethiram=snapshot.nethiram,
            jeevan=snapshot.jeevan,
            # The bare strings above stay for existing clients. This object adds
            # the boundary they never had: both values are derived from the
            # Moon's star, so they flip at nakshatra_ends_at like Nokku does.
            nethiram_jeevan=PanchangamNethiramJeevan(
                nethiram=snapshot.nethiram,
                jeevan=snapshot.jeevan,
                nethiram_next=snapshot.nethiram_next,
                jeevan_next=snapshot.jeevan_next,
                **_ends(snapshot.nakshatra_ends_at),
            ),
            amirdhadhi_yogam=PanchangamAmirdhadhiYogam(
                name=snapshot.amirdhadhi_yogam_name,
                **_ends(snapshot.amirdhadhi_yogam_ends_at),
                next_name=snapshot.amirdhadhi_yogam_next_name,
                status="preliminary",
            ),
            chandrashtamam_today=PanchangamChandrashtamamToday(
                moon_rasi_number=snapshot.chandrashtamam_moon_rasi_number,
                moon_rasi_name=snapshot.chandrashtamam_moon_rasi_name,
                affected_janma_rasi_number=snapshot.chandrashtamam_affected_janma_rasi_number,
                affected_janma_rasi_name=snapshot.chandrashtamam_affected_janma_rasi_name,
                nakshatras=list(snapshot.chandrashtamam_today_nakshatras),
                janma_nakshatra_windows=[
                    PanchangamChandrashtamamNakshatraWindow(
                        name=window.name,
                        start=window.start,
                        end=window.end,
                        rasi_number=window.rasi_number,
                        rasi_name=window.rasi_name,
                    )
                    for window in snapshot.chandrashtamam_janma_nakshatra_windows
                ],
                affected_janma_nakshatra_number=snapshot.chandrashtamam_affected_janma_nakshatra_number,
                affected_janma_nakshatra_name=snapshot.chandrashtamam_affected_janma_nakshatra_name,
                status="preliminary",
            ),
            special_tithi_day=_build_special_tithi_day(snapshot),
            is_karinaal=is_karinaal(snapshot.date_local),
        ),
        meta=PanchangamMeta(
            calculation_version=PANCHANGAM_CALCULATION_VERSION,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def calculate_panchangam_timings(query: PanchangamDailyQuery, session: Session | None = None) -> PanchangamTimingsResponse:
    snapshot = calculate_daily_panchangam(query.date, query.lat, query.lng, query.timezone, session=session)
    previous_day_snapshot = _previous_day_snapshot(snapshot, session)

    return PanchangamTimingsResponse(
        data=PanchangamTimingsData(
            date_local=snapshot.date_local,
            location=PanchangamLocation(lat=snapshot.latitude, lng=snapshot.longitude, timezone=snapshot.timezone_name),
            sunrise=format_clock_hhmm(snapshot.sunrise),
            sunset=format_clock_hhmm(snapshot.sunset),
            solar_noon=format_clock_hhmm(snapshot.solar_noon),
            kalam=_build_kalam(snapshot),
            abhijit=PanchangamAbhijit(
                start=format_clock_hhmm(snapshot.abhijit_start),
                end=format_clock_hhmm(snapshot.abhijit_end),
                is_restricted_by_weekday=snapshot.abhijit_restricted,
            ),
            subha_muhurtham=PanchangamSubhaMuhurtham(
                is_subha=snapshot.is_subha_muhurtham,
                reason=snapshot.subha_muhurtham_reason,
                is_subha_strict=snapshot.is_subha_muhurtham_strict,
                strict_reason=snapshot.subha_muhurtham_strict_reason,
            ),
            festivals=_build_festivals(snapshot, previous_day_snapshot=previous_day_snapshot),
            hora=[
                PanchangamHoraEntry(
                    index=entry.index,
                    lord=entry.lord,
                    start=format_clock_hhmm(entry.start),
                    end=format_clock_hhmm(entry.end),
                )
                for entry in snapshot.hora
            ],
        ),
        meta=PanchangamMeta(
            calculation_version=PANCHANGAM_CALCULATION_VERSION,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def build_monthly_panchangam(query: PanchangamMonthlyQuery, session: Session | None = None) -> PanchangamMonthlyResponse:
    """Compact day-by-day panchangam projection for an entire Gregorian month.

    Reuses the same per-day calculation as the daily endpoint, just batched
    and trimmed down to the fields a monthly calendar grid needs — the full
    PanchangamDailyResponseData per day would be far too heavy for ~30 days.
    """
    days_in_month = calendar.monthrange(query.year, query.month)[1]
    entries: list[PanchangamMonthDayEntry] = []
    tamil_month_name: BiText | None = None

    almanac_muhurtham_dates: frozenset[date] = frozenset(
        n.date for n in get_muhurtham_naals(query.year)
    )

    first_day = date(query.year, query.month, 1)
    last_day = date(query.year, query.month, days_in_month)
    snapshots_by_date = calculate_daily_panchangam_range(
        first_day, last_day, query.lat, query.lng, query.timezone, session=session,
    )

    # Ekadashi two-consecutive-sunrise dedup (WI-12) needs the prior civil
    # day's snapshot. Only day 1 needs an extra ephemeris call (the last day
    # of the previous month, outside this range) — every other day reuses
    # the previous loop iteration's already-computed snapshot for free.
    # snapshots_by_date can be missing polar-day/night days (no sunrise/sunset),
    # so guard the day-1 lookup and skip any absent day below.
    first_snapshot = snapshots_by_date.get(first_day)
    previous_snapshot = _previous_day_snapshot(first_snapshot, session) if first_snapshot else None

    for day_number in range(1, days_in_month + 1):
        date_local = date(query.year, query.month, day_number)
        snapshot = snapshots_by_date.get(date_local)
        if snapshot is None:
            continue
        # Sunrise-governing (உதய) tithi / nakshatra / yoga: the value present at
        # sunrise names the whole civil day. This is the classical Tamil rule the
        # daily endpoint and the dashboard home already use — the monthly grid now
        # matches them instead of showing a separate longest-span (dominant) value
        # (issue #9). Boundary crossings are still surfaced per-day via the daily
        # endpoint's *_ends_at / *_next_* fields.
        governing_tithi_number = snapshot.tithi_number
        governing_tithi_paksha = snapshot.tithi_paksha
        governing_tithi_name = snapshot.tithi_name
        governing_nakshatra_name = snapshot.nakshatra_name
        governing_yoga_name = snapshot.yoga_name
        is_subha_muhurtham, _ = _compute_subha_muhurtham_broad(
            governing_tithi_number,
            governing_nakshatra_name,
            date_local.weekday(),
        )
        is_subha_muhurtham_strict, _ = _compute_subha_muhurtham_strict(
            governing_tithi_number,
            governing_tithi_paksha,
            governing_nakshatra_name,
            governing_yoga_name,
            date_local.weekday(),
        )

        tamil_date = _build_tamil_date(snapshot)
        if tamil_date is not None and tamil_month_name is None:
            tamil_month_name = BiText(ta=tamil_date.ta.rsplit(" ", 1)[0], en=tamil_date.en.rsplit(" ", 1)[0])

        entries.append(
            PanchangamMonthDayEntry(
                date_local=snapshot.date_local,
                tamil_date=tamil_date,
                tamil_date_source=_build_tamil_date_source(snapshot),
                weekday=snapshot.weekday,
                tithi_number=governing_tithi_number,
                tithi_name=governing_tithi_name,
                tithi_paksha=governing_tithi_paksha,
                nakshatra_name=governing_nakshatra_name,
                special_tithi_day_number=snapshot.special_tithi_day_number,
                festivals=_build_festivals(
                    snapshot,
                    tithi_number=governing_tithi_number,
                    tithi_paksha=governing_tithi_paksha,
                    nakshatra_name=governing_nakshatra_name,
                    previous_day_snapshot=previous_snapshot,
                ),
                is_tamil_muhurtham_day=date_local in almanac_muhurtham_dates,
                is_subha_muhurtham=is_subha_muhurtham,
                is_subha_muhurtham_strict=is_subha_muhurtham_strict,
                is_karinaal=is_karinaal(date_local),
            )
        )
        previous_snapshot = snapshot

    return PanchangamMonthlyResponse(
        data=PanchangamMonthlyData(
            year=query.year,
            month=query.month,
            tamil_month_name=tamil_month_name,
            entries=entries,
        ),
        meta=PanchangamMeta(
            calculation_version=PANCHANGAM_CALCULATION_VERSION,
            generated_at=datetime.now(tz=UTC),
        ),
    )


#: A Tamil year is 12 months; one more lets the picker offer a full year ahead
#: of *today* rather than a full year from the Tamil new year that preceded it.
DEFAULT_TAMIL_MONTH_COUNT = 13
MAX_TAMIL_MONTH_COUNT = 24


def _chart_daily_location(session: Session, chart_id: UUID) -> EffectiveDailyLocation | None:
    """The chart's current-or-birth daily location, or None if it has no profile."""
    chart = session.get(Chart, chart_id)
    if chart is None:
        return None
    profile_id = getattr(chart, "birth_profile_id", None)
    if profile_id is None:
        return None
    profile = session.get(BirthProfile, profile_id)
    if profile is None:
        return None
    return resolve_effective_daily_location(profile)


def build_tamil_months(
    session: Session,
    *,
    start: date,
    count: int,
    chart_id: UUID | None = None,
    lat: float | None = None,
    lng: float | None = None,
    timezone_name: str | None = None,
) -> TamilMonthsResponse:
    """The Tamil solar months from the one containing `start`, with civil bounds.

    Location matters and is not a formality: the month boundary is decided by
    the sunset on the sankranti day, which moves with longitude, and the
    published-almanac override applies only in Asia/Kolkata. A caller that
    resolves its own dates against one location and reads these boundaries from
    another will disagree with itself by a day at month edges — which is why
    this takes the *same* explicit-location-else-chart-location precedence as
    `find_best_muhurta_slots`, rather than defaulting to a fixed city.
    """
    if count < 1 or count > MAX_TAMIL_MONTH_COUNT:
        raise HTTPException(
            status_code=422,
            detail=f"count must be between 1 and {MAX_TAMIL_MONTH_COUNT}",
        )

    # Named one by one rather than through `any(... for value in explicit)`: a
    # generator over a tuple reads the same to a human and tells the type
    # checker nothing, so `lat` stayed `float | None` at the assignment below
    # and the mypy gate caught it. The partial-supply check has to be spelled
    # out to be the narrowing that assignment depends on.
    if lat is not None or lng is not None or timezone_name is not None:
        if lat is None or lng is None or timezone_name is None:
            raise HTTPException(status_code=422, detail="lat, lng, and timezone must be supplied together")
        latitude, longitude, tz_name = float(lat), float(lng), timezone_name
    elif chart_id is not None:
        daily_location = _chart_daily_location(session, chart_id)
        if daily_location is None:
            raise HTTPException(status_code=404, detail="Chart not found")
        latitude = daily_location.latitude
        longitude = daily_location.longitude
        tz_name = daily_location.timezone
    else:
        raise HTTPException(status_code=422, detail="lat, lng, and timezone are required without chartId")

    try:
        spans = tamil_month_spans(start, count, tz_name, latitude, longitude)
    except (ValueError, ZoneInfoNotFoundError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=f"Could not derive Tamil months: {exc}") from exc

    return TamilMonthsResponse(
        data=TamilMonthsData(
            location=PanchangamLocation(lat=latitude, lng=longitude, timezone=tz_name),
            months=[
                TamilMonthSpanEntry(
                    index=span.rasi,
                    name=BiText(ta=TAMIL_MONTHS[span.rasi][0], en=TAMIL_MONTHS[span.rasi][1]),
                    start_date=span.start,
                    end_date=span.end,
                )
                for span in spans
            ],
        ),
        meta=PanchangamMeta(
            calculation_version=PANCHANGAM_CALCULATION_VERSION,
            generated_at=datetime.now(tz=UTC),
        ),
    )
