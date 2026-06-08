from __future__ import annotations

import calendar
from datetime import UTC, date, datetime
import logging
from sqlalchemy.orm import Session

from app.calculations.festivals import get_festivals_for_date
from app.calculations.panchangam import (
    NAKSHATRA_NAMES,
    _compute_subha_muhurtham_broad,
    _compute_subha_muhurtham_strict,
    _tithi_name,
    _yoga_name,
    calculate_daily_panchangam,
    calculate_daily_panchangam_range,
    dominant_nakshatra_for_civil_day,
    dominant_tithi_for_civil_day,
    dominant_yoga_for_civil_day,
)
from app.calculations.tamil_calendar import format_tamil_date, tamil_solar_date
from app.schemas.panchangam import (
    BiText,
    PanchangamAbhijit,
    PanchangamAmirdhadhiYogam,
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
    PanchangamSpecialTithiDay,
    PanchangamSoolam,
    PanchangamSubhaMuhurtham,
    PanchangamTithi,
    PanchangamVara,
    PanchangamYoga,
    PanchangamTimingsData,
    PanchangamTimingsResponse,
)

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
) -> list[PanchangamFestival]:
    try:
        tamil_month_index, _ = tamil_solar_date(
            snapshot.date_local,
            snapshot.timezone_name,
            snapshot.latitude,
            snapshot.longitude,
        )
    except Exception as exc:
        logger.debug("Tamil month lookup failed for %s: %s", snapshot.date_local, exc)
        tamil_month_index = None

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
        )
    ]


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
                next_number=snapshot.tithi_next_number,
                next_name=snapshot.tithi_next_name,
                next_paksha=snapshot.tithi_next_paksha,
            ),
            nakshatra=PanchangamNakshatra(
                name=snapshot.nakshatra_name,
                pada=snapshot.nakshatra_pada,
                ends_at=snapshot.nakshatra_ends_at.strftime("%H:%M"),
                next_name=snapshot.nakshatra_next_name,
            ),
            yoga=PanchangamYoga(
                number=snapshot.yoga_number,
                name=snapshot.yoga_name,
                ends_at=snapshot.yoga_ends_at.strftime("%H:%M"),
                next_name=snapshot.yoga_next_name,
            ),
            karana=PanchangamKarana(
                name=snapshot.karana_name,
                ends_at=snapshot.karana_ends_at.strftime("%H:%M"),
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
            festivals=_build_festivals(snapshot),
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
            ),
            lagnam=PanchangamLagnam(
                rasi_number=snapshot.lagna_rasi_number,
                rasi_name=snapshot.lagna_rasi_name,
                ends_at=snapshot.lagna_ends_at.strftime("%H:%M"),
                nazhigai=snapshot.lagna_nazhigai,
                vinadi=snapshot.lagna_vinadi,
            ),
            nethiram=snapshot.nethiram,
            jeevan=snapshot.jeevan,
            amirdhadhi_yogam=PanchangamAmirdhadhiYogam(
                name=snapshot.amirdhadhi_yogam_name,
                ends_at=snapshot.amirdhadhi_yogam_ends_at.strftime("%H:%M"),
                next_name=snapshot.amirdhadhi_yogam_next_name,
            ),
            chandrashtamam_today=PanchangamChandrashtamamToday(
                moon_rasi_number=snapshot.chandrashtamam_moon_rasi_number,
                moon_rasi_name=snapshot.chandrashtamam_moon_rasi_name,
                affected_janma_rasi_number=snapshot.chandrashtamam_affected_janma_rasi_number,
                affected_janma_rasi_name=snapshot.chandrashtamam_affected_janma_rasi_name,
                nakshatras=list(snapshot.chandrashtamam_today_nakshatras),
            ),
            special_tithi_day=_build_special_tithi_day(snapshot),
        ),
        meta=PanchangamMeta(
            calculation_version=PANCHANGAM_CALCULATION_VERSION,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def calculate_panchangam_timings(query: PanchangamDailyQuery, session: Session | None = None) -> PanchangamTimingsResponse:
    snapshot = calculate_daily_panchangam(query.date, query.lat, query.lng, query.timezone, session=session)

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
            festivals=_build_festivals(snapshot),
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

    first_day = date(query.year, query.month, 1)
    last_day = date(query.year, query.month, days_in_month)
    snapshots_by_date = calculate_daily_panchangam_range(
        first_day, last_day, query.lat, query.lng, query.timezone, session=session,
    )

    for day_number in range(1, days_in_month + 1):
        date_local = date(query.year, query.month, day_number)
        snapshot = snapshots_by_date[date_local]
        dominant_tithi_number = dominant_tithi_for_civil_day(date_local, snapshot.timezone_name) or snapshot.tithi_number
        dominant_tithi_paksha = "SHUKLA" if dominant_tithi_number <= 15 else "KRISHNA"
        dominant_tithi_name = _tithi_name(dominant_tithi_number)
        dominant_nakshatra_number = dominant_nakshatra_for_civil_day(date_local, snapshot.timezone_name) or snapshot.nakshatra_number
        dominant_nakshatra_name = NAKSHATRA_NAMES[dominant_nakshatra_number - 1]
        dominant_yoga_number = dominant_yoga_for_civil_day(date_local, snapshot.timezone_name) or snapshot.yoga_number
        dominant_yoga_name = _yoga_name(dominant_yoga_number)
        is_subha_muhurtham, _ = _compute_subha_muhurtham_broad(
            dominant_tithi_number,
            dominant_nakshatra_name,
            date_local.weekday(),
        )
        is_subha_muhurtham_strict, _ = _compute_subha_muhurtham_strict(
            dominant_tithi_number,
            dominant_tithi_paksha,
            dominant_nakshatra_name,
            dominant_yoga_name,
            date_local.weekday(),
            snapshot.abhijit_restricted,
        )

        tamil_date = _build_tamil_date(snapshot)
        if tamil_date is not None and tamil_month_name is None:
            tamil_month_name = BiText(ta=tamil_date.ta.rsplit(" ", 1)[0], en=tamil_date.en.rsplit(" ", 1)[0])

        entries.append(
            PanchangamMonthDayEntry(
                date_local=snapshot.date_local,
                tamil_date=tamil_date,
                weekday=snapshot.weekday,
                tithi_number=dominant_tithi_number,
                tithi_name=dominant_tithi_name,
                tithi_paksha=dominant_tithi_paksha,
                nakshatra_name=dominant_nakshatra_name,
                special_tithi_day_number=snapshot.special_tithi_day_number,
                festivals=_build_festivals(
                    snapshot,
                    tithi_number=dominant_tithi_number,
                    tithi_paksha=dominant_tithi_paksha,
                    nakshatra_name=dominant_nakshatra_name,
                ),
                is_tamil_muhurtham_day=snapshot.is_subha_muhurtham,
                is_subha_muhurtham=is_subha_muhurtham,
                is_subha_muhurtham_strict=is_subha_muhurtham_strict,
            )
        )

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
