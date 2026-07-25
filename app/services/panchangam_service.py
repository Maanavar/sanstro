from __future__ import annotations

import calendar
import logging
from datetime import UTC, date, datetime, timedelta

from sqlalchemy.orm import Session

from app.calculations.festivals import get_festivals_for_date
from app.calculations.panchangam import (
    _compute_subha_muhurtham_broad,
    _compute_subha_muhurtham_strict,
    calculate_daily_panchangam,
    calculate_daily_panchangam_range,
)
from app.calculations.tamil_calendar import format_tamil_date, tamil_solar_date
from app.data.muhurtham_naals import get_muhurtham_naals
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
    PanchangamLocation,
    PanchangamMeta,
    PanchangamMonthDayEntry,
    PanchangamMonthlyData,
    PanchangamMonthlyQuery,
    PanchangamMonthlyResponse,
    PanchangamNakshatra,
    PanchangamSlot,
    PanchangamSoolam,
    PanchangamSpecialTithiDay,
    PanchangamSubhaMuhurtham,
    PanchangamTimingsData,
    PanchangamTimingsResponse,
    PanchangamTithi,
    PanchangamVara,
    PanchangamYoga,
)
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
        start=slot.start.strftime("%H:%M"),
        end=slot.end.strftime("%H:%M"),
        slot=slot.slot,
        warning=_gowri_conflict_warning(slot, snapshot) if warn_on_conflict else None,
        name=slot.name,
        period=slot.period,
        is_good=slot.is_good,
    )


def _build_kalam(snapshot) -> PanchangamKalam:
    return PanchangamKalam(
        rahu_kalam=PanchangamSlot(
            start=snapshot.rahu_kalam.start.strftime("%H:%M"),
            end=snapshot.rahu_kalam.end.strftime("%H:%M"),
            slot=snapshot.rahu_kalam.slot,
        ),
        yamagandam=PanchangamSlot(
            start=snapshot.yamagandam.start.strftime("%H:%M"),
            end=snapshot.yamagandam.end.strftime("%H:%M"),
            slot=snapshot.yamagandam.slot,
        ),
        kuligai=PanchangamSlot(
            start=snapshot.kuligai.start.strftime("%H:%M"),
            end=snapshot.kuligai.end.strftime("%H:%M"),
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
    )


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


def _build_special_tithi_day(snapshot) -> PanchangamSpecialTithiDay | None:
    if snapshot.special_tithi_day_number == 15:
        return PanchangamSpecialTithiDay(tithiNumber=15, name="POURNAMI", moonPhase="FULL")
    if snapshot.special_tithi_day_number == 30:
        return PanchangamSpecialTithiDay(tithiNumber=30, name="AMAVASAI", moonPhase="NEW")
    return None


def calculate_panchangam(query: PanchangamDailyQuery, session: Session | None = None) -> PanchangamDailyResponse:
    snapshot = calculate_daily_panchangam(query.date, query.lat, query.lng, query.timezone, session=session)
    previous_day_snapshot = _previous_day_snapshot(snapshot, session)

    return PanchangamDailyResponse(
        data=PanchangamDailyResponseData(
            date_local=snapshot.date_local,
            tamil_date=_build_tamil_date(snapshot),
            location=PanchangamLocation(lat=snapshot.latitude, lng=snapshot.longitude, timezone=snapshot.timezone_name),
            sunrise=snapshot.sunrise.strftime("%H:%M"),
            sunset=snapshot.sunset.strftime("%H:%M"),
            solar_noon=snapshot.solar_noon.strftime("%H:%M"),
            vara=PanchangamVara(weekday=snapshot.weekday, lord=snapshot.weekday_lord),
            tithi=PanchangamTithi(
                number=snapshot.tithi_number,
                name=snapshot.tithi_name,
                paksha=snapshot.tithi_paksha,
                ends_at=snapshot.tithi_ends_at.strftime("%H:%M"),
                ends_at_iso=snapshot.tithi_ends_at.isoformat(),
                next_number=snapshot.tithi_next_number,
                next_name=snapshot.tithi_next_name,
                next_paksha=snapshot.tithi_next_paksha,
            ),
            nakshatra=PanchangamNakshatra(
                name=snapshot.nakshatra_name,
                pada=snapshot.nakshatra_pada,
                ends_at=snapshot.nakshatra_ends_at.strftime("%H:%M"),
                ends_at_iso=snapshot.nakshatra_ends_at.isoformat(),
                next_name=snapshot.nakshatra_next_name,
            ),
            yoga=PanchangamYoga(
                number=snapshot.yoga_number,
                name=snapshot.yoga_name,
                ends_at=snapshot.yoga_ends_at.strftime("%H:%M"),
                ends_at_iso=snapshot.yoga_ends_at.isoformat(),
                next_name=snapshot.yoga_next_name,
            ),
            karana=PanchangamKarana(
                name=snapshot.karana_name,
                ends_at=snapshot.karana_ends_at.strftime("%H:%M"),
                ends_at_iso=snapshot.karana_ends_at.isoformat(),
                next_name=snapshot.karana_next_name,
            ),
            kalam=_build_kalam(snapshot),
            abhijit=PanchangamAbhijit(
                start=snapshot.abhijit_start.strftime("%H:%M"),
                end=snapshot.abhijit_end.strftime("%H:%M"),
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
                    start=entry.start.strftime("%H:%M"),
                    end=entry.end.strftime("%H:%M"),
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
                ends_at=snapshot.lagna_ends_at.strftime("%H:%M"),
                ends_at_iso=snapshot.lagna_ends_at.isoformat(),
                nazhigai=snapshot.lagna_nazhigai,
                vinadi=snapshot.lagna_vinadi,
            ),
            nethiram=snapshot.nethiram,
            jeevan=snapshot.jeevan,
            amirdhadhi_yogam=PanchangamAmirdhadhiYogam(
                name=snapshot.amirdhadhi_yogam_name,
                ends_at=snapshot.amirdhadhi_yogam_ends_at.strftime("%H:%M"),
                ends_at_iso=snapshot.amirdhadhi_yogam_ends_at.isoformat(),
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
                    )
                    for window in snapshot.chandrashtamam_janma_nakshatra_windows
                ],
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
            sunrise=snapshot.sunrise.strftime("%H:%M"),
            sunset=snapshot.sunset.strftime("%H:%M"),
            solar_noon=snapshot.solar_noon.strftime("%H:%M"),
            kalam=_build_kalam(snapshot),
            abhijit=PanchangamAbhijit(
                start=snapshot.abhijit_start.strftime("%H:%M"),
                end=snapshot.abhijit_end.strftime("%H:%M"),
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
                    start=entry.start.strftime("%H:%M"),
                    end=entry.end.strftime("%H:%M"),
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
