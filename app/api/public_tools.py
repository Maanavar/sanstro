"""Public (no-auth) tool endpoints for the Vinaadi marketing site.

These endpoints allow unsigned users to use the three core tools directly from
the public site: jadhagam generation, porutham compatibility, and today's
panchangam. No account creation, no data persistence — results are computed
on the fly and returned directly.

Rate limiting and abuse protection are handled at the infrastructure layer
(reverse proxy / CDN). These endpoints do not write to the database.
"""
from __future__ import annotations

import logging
from datetime import date, time, timedelta
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.panchangam import PanchangamDailyQuery, PanchangamDailyResponse, PanchangamTimingsResponse
from app.services.panchangam_service import calculate_panchangam, calculate_panchangam_timings
from app.services.chart_service import _chart_response_from_profile  # noqa: PLC2701 (internal use)
from app.schemas.charts import ChartCalculateResponseData
from app.calculations.porutham import compute_porutham
from app.schemas.relationships import KutaResult, DirectPoruthamData, NadiDoshaData, RelationshipBiText
from app.schemas.birth_profiles import _validate_birth_date_bounds  # noqa: PLC2701 (shared validation)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/public", tags=["public-tools"])


# ── Request/response schemas ───────────────────────────────────────────────────


class PublicBirthInput(BaseModel):
    """Minimal birth details for an unauthenticated chart or porutham request."""
    display_name: str = Field(alias="displayName", default="")
    birth_date_local: date = Field(alias="birthDateLocal")
    birth_time_local: time | None = Field(alias="birthTimeLocal", default=None)
    birth_latitude: float = Field(alias="birthLatitude")
    birth_longitude: float = Field(alias="birthLongitude")
    birth_timezone: str = Field(alias="birthTimezone", default="Asia/Kolkata")
    birth_place: str = Field(alias="birthPlace", default="")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("birth_date_local")
    @classmethod
    def validate_birth_date_local(cls, value: date) -> date:
        return _validate_birth_date_bounds(value)


class PublicChartRequest(BaseModel):
    birth: PublicBirthInput

    model_config = ConfigDict(populate_by_name=True)


class PublicChartResponse(BaseModel):
    success: bool = True
    data: ChartCalculateResponseData

    model_config = ConfigDict(populate_by_name=True)


class PublicPoruthamRequest(BaseModel):
    person_a: PublicBirthInput = Field(alias="personA")
    person_b: PublicBirthInput = Field(alias="personB")
    compatibility_context: str = Field(alias="compatibilityContext", default="MARRIAGE")

    model_config = ConfigDict(populate_by_name=True)


class PublicPoruthamResponse(BaseModel):
    success: bool = True
    data: DirectPoruthamData

    model_config = ConfigDict(populate_by_name=True)


# ── Helper: thin profile-like object that matches the field accessor pattern ───

class _EphemeralProfile:
    """Acts as a profile for _chart_response_from_profile without DB persistence."""

    def __init__(self, inp: PublicBirthInput) -> None:
        self.birth_profile_id = uuid4()
        self.display_name = inp.display_name or "Anonymous"
        self.birth_date_local = inp.birth_date_local
        self.birth_time_local = inp.birth_time_local
        self.birth_latitude = inp.birth_latitude
        self.birth_longitude = inp.birth_longitude
        self.birth_timezone = inp.birth_timezone
        self.birth_place = inp.birth_place
        self.gender_for_traditional_rules = "UNKNOWN"
        self.relationship_to_owner = "other"
        self.deleted_at = None


# ── Endpoints ──────────────────────────────────────────────────────────────────


@router.post("/chart", response_model=PublicChartResponse)
def public_chart(payload: PublicChartRequest) -> PublicChartResponse:
    """Calculate a Thirukanitham birth chart from raw birth details.

    No authentication required. Result is computed in-memory and not persisted.
    """
    profile = _EphemeralProfile(payload.birth)
    try:
        result = _chart_response_from_profile(profile, "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=msg) from exc
    return PublicChartResponse(data=result.data)


@router.post("/porutham", response_model=PublicPoruthamResponse)
def public_porutham(payload: PublicPoruthamRequest) -> PublicPoruthamResponse:
    """Calculate 10-kuta porutham from two raw birth profiles.

    No authentication required. No data is persisted.
    """
    from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS

    if payload.compatibility_context not in VALID_COMPATIBILITY_CONTEXTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"compatibilityContext must be one of: {sorted(VALID_COMPATIBILITY_CONTEXTS)}",
        )

    try:
        chart_a = _chart_response_from_profile(_EphemeralProfile(payload.person_a), "thirukanitham-2026-v1")
        chart_b = _chart_response_from_profile(_EphemeralProfile(payload.person_b), "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=msg) from exc

    def _moon(chart_data: Any) -> Any:
        return next((p for p in chart_data.data.planets if p.graha == "MOON"), None)

    moon_a = _moon(chart_a)
    moon_b = _moon(chart_b)
    if moon_a is None or moon_b is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Could not determine Moon position.")

    result = compute_porutham(
        boy_nakshatra=moon_a.nakshatra,
        girl_nakshatra=moon_b.nakshatra,
        boy_rasi=moon_a.rasi,
        girl_rasi=moon_b.rasi,
    )

    kutas = [
        KutaResult(
            name=k.name,
            name_ta=k.name_ta,
            score=k.score,
            max_score=k.max_score,
            label=k.label,
        )
        for k in result.kutas
    ]

    nadi = result.nadi_dosha
    nadi_data = NadiDoshaData(
        boy_nadi=nadi["boy_nadi"],
        girl_nadi=nadi["girl_nadi"],
        has_nadi_dosha=nadi["has_nadi_dosha"],
        cancellations=nadi.get("cancellations", []),
        severity=nadi["severity"],
        note_ta=nadi["note_ta"],
        note_en=nadi["note_en"],
    )

    data = DirectPoruthamData(
        chart_id_a=chart_a.data.chart_id,
        chart_id_b=chart_b.data.chart_id,
        boy_nakshatra=moon_a.nakshatra,
        boy_nakshatra_name=moon_a.nakshatra_name,
        girl_nakshatra=moon_b.nakshatra,
        girl_nakshatra_name=moon_b.nakshatra_name,
        kutas=kutas,
        total_score=result.total_score,
        max_score=result.max_score,
        percentage=result.percentage,
        label=result.label,
        rajju_dosha=result.rajju_dosha,
        vedha_dosha=result.vedha_dosha,
        nadi_dosha=nadi_data,
        summary=RelationshipBiText(ta=result.summary_ta, en=result.summary_en),
        compatibility_context=payload.compatibility_context,
        context_note=None,
    )
    return PublicPoruthamResponse(data=data)


@router.get("/panchangam", response_model=PanchangamDailyResponse)
def public_panchangam(
    date: date,
    lat: float,
    lng: float,
    timezone: str = "Asia/Kolkata",
    session: Session = Depends(get_db),
) -> PanchangamDailyResponse:
    """Return the full panchangam for a date and location.

    No authentication required.
    """
    query = PanchangamDailyQuery(date=date, lat=lat, lng=lng, timezone=timezone)
    return calculate_panchangam(query, session)


# ── Public Muhurta ─────────────────────────────────────────────────────────────

_PUBLIC_MUHURTA_ACTIVITIES = {
    "MARRIAGE", "JOB_START", "INVESTMENT", "TRAVEL", "PURCHASE", "EXAM", "MEDICAL", "SPIRITUAL",
}
_PUBLIC_MUHURTA_MAX_DAYS = 30
_PUBLIC_MUHURTA_TOP_N = 3


class PublicMuhurtaRequest(BaseModel):
    event_type: str = Field(alias="eventType")
    date_from: date = Field(alias="dateFrom")
    date_to: date = Field(alias="dateTo")
    lat: float
    lng: float
    timezone: str = "Asia/Kolkata"

    model_config = ConfigDict(populate_by_name=True)


class PublicMuhurtaSlot(BaseModel):
    date: date
    time_window: str = Field(alias="timeWindow")
    tithi: str
    nakshatra: str
    quality: str  # "excellent" | "good" | "fair"
    reason: str
    reason_ta: str = Field(alias="reasonTa")
    cautions: list[str]
    cautions_ta: list[str] = Field(alias="cautionsTa")

    model_config = ConfigDict(populate_by_name=True)


class PublicMuhurtaResponse(BaseModel):
    success: bool = True
    slots: list[PublicMuhurtaSlot]

    model_config = ConfigDict(populate_by_name=True)


def _score_public_muhurta(snap) -> tuple[float, list[str], list[str], list[str], list[str]]:
    """Score a panchangam day without chart personalisation.

    Returns (score, reasons_en, reasons_ta, cautions_en, cautions_ta).
    """
    from app.calculations.panchangam import SUBHA_NAKSHATRAS, SUBHA_TITHIS_KRISHNA, SUBHA_TITHIS_SHUKLA

    score = 50.0
    reasons_en: list[str] = []
    reasons_ta: list[str] = []
    cautions_en: list[str] = []
    cautions_ta: list[str] = []

    tithi = snap.tithi_number
    paksha = snap.tithi_paksha
    nakshatra = snap.nakshatra_name
    tithi_in_paksha = tithi if tithi <= 15 else tithi - 15

    if tithi == 30:
        cautions_en.append("Amavasai tithi — not ideal for new starts")
        cautions_ta.append("அமாவாசை திதி — புதிய தொடக்கத்திற்கு ஏற்றதல்ல")
        score -= 5

    if tithi_in_paksha in {8, 9}:
        cautions_en.append(f"Tithi {snap.tithi_name} ({tithi}) — generally avoided for auspicious starts")
        cautions_ta.append(f"{snap.tithi_name} திதி (எண் {tithi}) — சுப நிகழ்வுகளுக்கு தவிர்க்கவும்")
        score -= 15

    if snap.is_subha_muhurtham:
        score += 20
        reasons_en.append("Auspicious muhurta day")
        reasons_ta.append("சுப முகூர்த்த நாள்")

    if paksha == "SHUKLA" and tithi_in_paksha in SUBHA_TITHIS_SHUKLA:
        score += 10
        reasons_en.append(f"Favourable tithi: {snap.tithi_name}")
        reasons_ta.append(f"சாதக திதி: {snap.tithi_name}")
    elif paksha == "KRISHNA" and tithi_in_paksha in SUBHA_TITHIS_KRISHNA:
        score += 8
        reasons_en.append(f"Favourable tithi: {snap.tithi_name}")
        reasons_ta.append(f"சாதக திதி: {snap.tithi_name}")

    if nakshatra in SUBHA_NAKSHATRAS or nakshatra.upper().replace("H", "") in {n.upper().replace("H", "") for n in SUBHA_NAKSHATRAS}:
        score += 10
        reasons_en.append(f"Auspicious nakshatra: {nakshatra}")
        reasons_ta.append(f"சுப நட்சத்திரம்: {nakshatra}")

    if snap.yoga_name:
        reasons_en.append(f"Yoga: {snap.yoga_name}")
        reasons_ta.append(f"யோகம்: {snap.yoga_name}")

    if snap.weekday != "WEDNESDAY" and not snap.abhijit_restricted:
        score += 5
        reasons_en.append("Abhijit muhurta window available")
        reasons_ta.append("அபிஜித் முகூர்த்த சாளரம் கிடைக்கிறது")

    if snap.nalla_neram:
        score += 5

    return score, reasons_en, reasons_ta, cautions_en, cautions_ta


def _overlaps_public(start_a, end_a, start_b, end_b) -> bool:
    return max(start_a, start_b) < min(end_a, end_b)


def _quality_label(score: float) -> str:
    if score >= 80:
        return "excellent"
    if score >= 65:
        return "good"
    return "fair"


@router.post("/muhurta", response_model=PublicMuhurtaResponse)
def public_muhurta(
    payload: PublicMuhurtaRequest,
    session: Session = Depends(get_db),
) -> PublicMuhurtaResponse:
    """Return top-3 auspicious muhurta slots for a date range and event type.

    No authentication required. No birth chart — scoring uses Panchangam only
    (tithi, nakshatra, yoga, Abhijit). Create an account for chart-personalised
    muhurta that also considers dasha and hora windows.
    """
    from app.calculations.panchangam import calculate_daily_panchangam_range, best_gowri_slot

    event_type = payload.event_type.upper()
    if event_type not in _PUBLIC_MUHURTA_ACTIVITIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"eventType must be one of: {sorted(_PUBLIC_MUHURTA_ACTIVITIES)}",
        )

    delta_days = (payload.date_to - payload.date_from).days
    if delta_days < 0:
        raise HTTPException(status_code=422, detail="dateTo must be >= dateFrom")
    if delta_days > _PUBLIC_MUHURTA_MAX_DAYS:
        raise HTTPException(status_code=422, detail=f"Date range cannot exceed {_PUBLIC_MUHURTA_MAX_DAYS} days")

    snapshots = calculate_daily_panchangam_range(
        payload.date_from, payload.date_to,
        payload.lat, payload.lng, payload.timezone,
        session=session,
    )

    scored: list[tuple[float, date, str, str, str, str, str, list[str], list[str]]] = []
    current = payload.date_from
    while current <= payload.date_to:
        try:
            snap = snapshots[current]
            score, reasons_en, reasons_ta, cautions_en, cautions_ta = _score_public_muhurta(snap)

            # Determine best time window
            if snap.nalla_neram:
                slot = best_gowri_slot(snap.nalla_neram) or snap.nalla_neram[0]
                t_start, t_end = slot.start, slot.end
            else:
                t_start, t_end = snap.abhijit_start, snap.abhijit_end

            # Check kalam overlaps
            if _overlaps_public(t_start, t_end, snap.rahu_kalam.start, snap.rahu_kalam.end):
                cautions_en.append("Rahu Kalam overlaps this slot")
                cautions_ta.append("ராகு காலம் இந்த நேரத்துடன் ஒட்டுகிறது")
            if _overlaps_public(t_start, t_end, snap.yamagandam.start, snap.yamagandam.end):
                cautions_en.append("Yamagandam overlaps this slot")
                cautions_ta.append("யமகண்டம் இந்த நேரத்துடன் ஒட்டுகிறது")
            if _overlaps_public(t_start, t_end, snap.kuligai.start, snap.kuligai.end):
                cautions_en.append("Kuligai overlaps this slot")
                cautions_ta.append("குளிகை இந்த நேரத்துடன் ஒட்டுகிறது")

            time_window = f"{t_start.strftime('%H:%M')}–{t_end.strftime('%H:%M')}"
            scored.append((
                score, current, time_window,
                snap.tithi_name, snap.nakshatra_name,
                "; ".join(reasons_en) if reasons_en else "Ordinary day",
                "; ".join(reasons_ta) if reasons_ta else "சாதாரண நாள்",
                cautions_en, cautions_ta,
            ))
        except Exception as exc:
            logger.debug("Public muhurta score failed for %s: %s", current, exc)
        current += timedelta(days=1)

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:_PUBLIC_MUHURTA_TOP_N]

    slots = [
        PublicMuhurtaSlot(
            date=d,
            timeWindow=time_window,
            tithi=tithi,
            nakshatra=nakshatra,
            quality=_quality_label(s),
            reason=reason_en,
            reasonTa=reason_ta,
            cautions=cautions_en,
            cautionsTa=cautions_ta,
        )
        for s, d, time_window, tithi, nakshatra, reason_en, reason_ta, cautions_en, cautions_ta in top
    ]

    return PublicMuhurtaResponse(success=True, slots=slots)
