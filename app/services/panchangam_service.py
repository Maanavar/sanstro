from __future__ import annotations

from datetime import UTC, datetime
from sqlalchemy.orm import Session

from app.calculations.festivals import get_festivals_for_date
from app.calculations.panchangam import calculate_daily_panchangam
from app.schemas.panchangam import (
    PanchangamAbhijit,
    PanchangamDailyQuery,
    PanchangamDailyResponse,
    PanchangamDailyResponseData,
    PanchangamFestival,
    PanchangamHoraEntry,
    PanchangamKalam,
    PanchangamKarana,
    PanchangamLocation,
    PanchangamMeta,
    PanchangamNakshatra,
    PanchangamSlot,
    PanchangamSubhaMuhurtham,
    PanchangamTithi,
    PanchangamVara,
    PanchangamYoga,
    PanchangamTimingsData,
    PanchangamTimingsResponse,
)


def _gowri_conflict_warning(slot: int, snapshot) -> str | None:
    if slot == snapshot.rahu_kalam.slot:
        return "Coincides with Rahu Kalam — use with caution"
    if slot == snapshot.yamagandam.slot:
        return "Coincides with Yamagandam — use with caution"
    if slot == snapshot.kuligai.slot:
        return "Coincides with Kuligai — use with caution"
    return None


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
        nalla_neram=[
            PanchangamSlot(
                start=w.start.strftime("%H:%M"),
                end=w.end.strftime("%H:%M"),
                slot=w.slot,
            )
            for w in snapshot.nalla_neram
        ],
        gowri_nalla_neram=[
            PanchangamSlot(
                start=w.start.strftime("%H:%M"),
                end=w.end.strftime("%H:%M"),
                slot=w.slot,
                warning=_gowri_conflict_warning(w.slot, snapshot),
            )
            for w in snapshot.gowri_nalla_neram
        ],
    )


def _build_festivals(snapshot) -> list[PanchangamFestival]:
    return [
        PanchangamFestival(name=f["name"], category=f["category"])
        for f in get_festivals_for_date(
            snapshot.date_local,
            snapshot.tithi_number,
            snapshot.tithi_paksha,
            snapshot.nakshatra_name,
        )
    ]


def calculate_panchangam(query: PanchangamDailyQuery, session: Session | None = None) -> PanchangamDailyResponse:
    snapshot = calculate_daily_panchangam(query.date, query.lat, query.lng, query.timezone, session=session)

    return PanchangamDailyResponse(
        data=PanchangamDailyResponseData(
            date_local=snapshot.date_local,
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
            ),
            nakshatra=PanchangamNakshatra(
                name=snapshot.nakshatra_name,
                pada=snapshot.nakshatra_pada,
                ends_at=snapshot.nakshatra_ends_at.strftime("%H:%M"),
            ),
            yoga=PanchangamYoga(number=snapshot.yoga_number, name=snapshot.yoga_name),
            karana=PanchangamKarana(name=snapshot.karana_name),
            kalam=_build_kalam(snapshot),
            abhijit=PanchangamAbhijit(
                start=snapshot.abhijit_start.strftime("%H:%M"),
                end=snapshot.abhijit_end.strftime("%H:%M"),
                is_restricted_by_weekday=snapshot.abhijit_restricted,
            ),
            subha_muhurtham=PanchangamSubhaMuhurtham(
                is_subha=snapshot.is_subha_muhurtham,
                reason=snapshot.subha_muhurtham_reason,
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
            calculation_version="thirukanitham-2026-v1",
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
            calculation_version="thirukanitham-2026-v1",
            generated_at=datetime.now(tz=UTC),
        ),
    )
