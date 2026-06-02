"""Public (no-auth) tool endpoints for the Vinaadi marketing site.

These endpoints allow unsigned users to use the three core tools directly from
the public site: jadhagam generation, porutham compatibility, and today's
panchangam. No account creation, no data persistence — results are computed
on the fly and returned directly.

Rate limiting and abuse protection are handled at the infrastructure layer
(reverse proxy / CDN). These endpoints do not write to the database.
"""
from __future__ import annotations

from datetime import date, datetime, UTC
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.panchangam import PanchangamDailyQuery, PanchangamDailyResponse, PanchangamTimingsResponse
from app.services.panchangam_service import calculate_panchangam, calculate_panchangam_timings
from app.services.chart_service import _chart_response_from_profile  # noqa: PLC2701 (internal use)
from app.schemas.charts import ChartCalculateResponseData
from app.calculations.porutham import compute_porutham
from app.schemas.relationships import KutaResult, DirectPoruthamData, NadiDoshaData, RelationshipBiText

router = APIRouter(prefix="/public", tags=["public-tools"])


# ── Request/response schemas ───────────────────────────────────────────────────


class PublicBirthInput(BaseModel):
    """Minimal birth details for an unauthenticated chart or porutham request."""
    display_name: str = Field(alias="displayName", default="")
    birth_date_local: str = Field(alias="birthDateLocal")
    birth_time_local: str | None = Field(alias="birthTimeLocal", default=None)
    birth_latitude: float = Field(alias="birthLatitude")
    birth_longitude: float = Field(alias="birthLongitude")
    birth_timezone: str = Field(alias="birthTimezone", default="Asia/Kolkata")
    birth_place: str = Field(alias="birthPlace", default="")

    model_config = ConfigDict(populate_by_name=True)


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
