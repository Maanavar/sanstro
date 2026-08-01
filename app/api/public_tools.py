"""Public (no-auth) tool endpoints for the Vinaadi marketing site.

These endpoints allow unsigned users to use the three core tools directly from
the public site: jadhagam generation, porutham compatibility, and today's
panchangam. No account creation, no data persistence — results are computed
on the fly and returned directly.

Rate limiting: Application-level per-endpoint rate limits enforce tight per-IP
budgets for expensive operations (chart, porutham, muhurta). Additional infrastructure
rate limiting (CDN / WAF) should be confirmed separately.
"""
from __future__ import annotations

import logging
from datetime import date, time, timedelta
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.calculations.astro import RASI_NAME_TO_NUMBER, RASI_NAMES, nakshatra_to_rasi
from app.calculations.numerology import ScriptMismatchError, analyze_object, build_profile
from app.calculations.numerology_naming import NamingMode, UnverifiedCanonError
from app.calculations.porutham import compute_porutham
from app.core.public_endpoint_limiter import public_endpoint_rate_limit
from app.services.feature_flags import get_flag
from app.db.session import get_db
from app.schemas.birth_profiles import _validate_birth_date_bounds  # noqa: PLC2701 (shared validation)
from app.schemas.charts import ChartCalculateResponseData, ChartSummaryData
from app.schemas.muhurtham_naal import MuhurthamNaalListResponse, item_from_view
from app.schemas.numerology import (
    BabyNamesResponse,
    NumerologyProfileRequest,
    NumerologyProfileResponse,
    ObjectNumberRequest,
    ObjectNumberResponse,
    PersonalCycleRequest,
    PersonalCycleResponse,
    PublicBabyNameRequest,
)
from app.schemas.panchangam import PanchangamDailyQuery, PanchangamDailyResponse, PanchangamMonthlyQuery, PanchangamMonthlyResponse
from app.schemas.dasha import DashaTimelineResponseData
from app.schemas.relationships import DirectPoruthamData, KutaResult, NadiDoshaData, RelationshipBiText
from app.services.chart_service import _chart_response_from_profile, get_chart_summary_from_snapshot  # noqa: PLC2701 (internal use)
from app.services.dasha_service import get_chart_dasha_from_snapshot
from app.services.numerology_naming_service import (
    baby_names_for_birth_details,
    baby_names_for_pada,
)
from app.services.numerology_timing_service import cycle_for
from app.services.panchangam_service import build_monthly_panchangam, calculate_panchangam
from app.services.synastry_service import compare_chart_snapshots_direct

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


class PublicChartPreviewData(BaseModel):
    chart: ChartCalculateResponseData
    summary: ChartSummaryData
    dasha: DashaTimelineResponseData

    model_config = ConfigDict(populate_by_name=True)


class PublicChartPreviewResponse(BaseModel):
    success: bool = True
    data: PublicChartPreviewData

    model_config = ConfigDict(populate_by_name=True)


class PublicCompareData(BaseModel):
    chart_a: ChartCalculateResponseData = Field(alias="chartA")
    chart_b: ChartCalculateResponseData = Field(alias="chartB")
    porutham: DirectPoruthamData
    dasha_a: DashaTimelineResponseData = Field(alias="dashaA")
    dasha_b: DashaTimelineResponseData = Field(alias="dashaB")

    model_config = ConfigDict(populate_by_name=True)


class PublicCompareResponse(BaseModel):
    success: bool = True
    data: PublicCompareData

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


@router.post("/chart-preview", response_model=PublicChartPreviewResponse)
@public_endpoint_rate_limit("public_chart")
def public_chart_preview(payload: PublicChartRequest, request: Request) -> PublicChartPreviewResponse:
    """Calculate a transient chart plus summary and dasha without persistence."""
    profile = _EphemeralProfile(payload.birth)
    try:
        result = _chart_response_from_profile(profile, "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=msg) from exc

    summary = get_chart_summary_from_snapshot(result, language="ta-en")
    dasha = get_chart_dasha_from_snapshot(result, date.today())
    return PublicChartPreviewResponse(
        data=PublicChartPreviewData(
            chart=result.data,
            summary=summary.data,
            dasha=dasha.data,
        )
    )


@router.post("/chart", response_model=PublicChartResponse)
@public_endpoint_rate_limit("public_chart")
def public_chart(payload: PublicChartRequest, request: Request) -> PublicChartResponse:
    """Calculate a Thirukanitham birth chart from raw birth details.

    No authentication required. Result is computed in-memory and not persisted.
    """
    profile = _EphemeralProfile(payload.birth)
    try:
        result = _chart_response_from_profile(profile, "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=msg) from exc
    return PublicChartResponse(data=result.data)


@router.post("/compare", response_model=PublicCompareResponse)
@public_endpoint_rate_limit("public_porutham")
def public_compare(payload: PublicPoruthamRequest, request: Request) -> PublicCompareResponse:
    """Calculate two transient charts plus porutham without saving profiles."""
    from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS

    if payload.compatibility_context not in VALID_COMPATIBILITY_CONTEXTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"compatibilityContext must be one of: {sorted(VALID_COMPATIBILITY_CONTEXTS)}",
        )

    try:
        chart_a = _chart_response_from_profile(_EphemeralProfile(payload.person_a), "thirukanitham-2026-v1")
        chart_b = _chart_response_from_profile(_EphemeralProfile(payload.person_b), "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=msg) from exc

    porutham = compare_chart_snapshots_direct(
        chart_a,
        chart_b,
        compatibility_context=payload.compatibility_context,
    )
    dasha_a = get_chart_dasha_from_snapshot(chart_a, date.today(), level="antar")
    dasha_b = get_chart_dasha_from_snapshot(chart_b, date.today(), level="antar")
    return PublicCompareResponse(
        data=PublicCompareData(
            chartA=chart_a.data,
            chartB=chart_b.data,
            porutham=porutham.data,
            dashaA=dasha_a.data,
            dashaB=dasha_b.data,
        )
    )


@router.post("/compare/pdf")
@public_endpoint_rate_limit("public_compare_pdf")
def public_compare_pdf(payload: PublicPoruthamRequest, request: Request, lang: str = "en") -> Response:
    """Generate a transient porutham PDF without creating saved profiles."""
    from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS
    from app.services.pdf_export_service import generate_porutham_pdf

    if payload.compatibility_context not in VALID_COMPATIBILITY_CONTEXTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"compatibilityContext must be one of: {sorted(VALID_COMPATIBILITY_CONTEXTS)}",
        )

    try:
        chart_a = _chart_response_from_profile(_EphemeralProfile(payload.person_a), "thirukanitham-2026-v1")
        chart_b = _chart_response_from_profile(_EphemeralProfile(payload.person_b), "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=msg) from exc

    porutham = compare_chart_snapshots_direct(
        chart_a,
        chart_b,
        compatibility_context=payload.compatibility_context,
    )
    dasha_a = get_chart_dasha_from_snapshot(chart_a, date.today(), level="antar")
    dasha_b = get_chart_dasha_from_snapshot(chart_b, date.today(), level="antar")
    pdf_bytes = generate_porutham_pdf(
        porutham.data,
        chart_a.data.birth_profile.display_name or "Person_A",
        chart_b.data.birth_profile.display_name or "Person_B",
        lang=lang if lang in {"en", "ta"} else "en",
        chart_a=chart_a.data,
        chart_b=chart_b.data,
        dasha_a=dasha_a.data,
        dasha_b=dasha_b.data,
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="porutham_preview.pdf"'},
    )


@router.post("/porutham", response_model=PublicPoruthamResponse)
@public_endpoint_rate_limit("public_porutham")
def public_porutham(payload: PublicPoruthamRequest, request: Request) -> PublicPoruthamResponse:
    """Calculate 10-kuta porutham from two raw birth profiles.

    No authentication required. No data is persisted.
    """
    from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS

    if payload.compatibility_context not in VALID_COMPATIBILITY_CONTEXTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"compatibilityContext must be one of: {sorted(VALID_COMPATIBILITY_CONTEXTS)}",
        )

    try:
        chart_a = _chart_response_from_profile(_EphemeralProfile(payload.person_a), "thirukanitham-2026-v1")
        chart_b = _chart_response_from_profile(_EphemeralProfile(payload.person_b), "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=msg) from exc

    def _moon(chart_data: Any) -> Any:
        return next((p for p in chart_data.data.planets if p.graha == "MOON"), None)

    moon_a = _moon(chart_a)
    moon_b = _moon(chart_b)
    if moon_a is None or moon_b is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Could not determine Moon position.")

    result = compute_porutham(
        boy_nakshatra=moon_a.nakshatra,
        girl_nakshatra=moon_b.nakshatra,
        boy_rasi=moon_a.rasi,
        girl_rasi=moon_b.rasi,
        boy_pada=moon_a.pada,
        girl_pada=moon_b.pada,
        nadi_parihara_mode=get_flag("nadi_parihara_mode"),
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
        mitigation=nadi.get("mitigation", "NONE"),
        nadi_parihara_mode=nadi.get("nadi_parihara_mode", "strict"),
        rajju_guard_warning=nadi.get("rajju_guard_warning"),
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


# ── Public Porutham by nakshatra number (no birth chart needed) ──────────────
#
# Distinct from /compare and /porutham above: those need full birth details
# because they derive the Moon's nakshatra/rasi from a computed chart. Tools
# where the user already knows their birth star (the marketing site's quick
# calculator, and the mobile app's porutham/friendship screens) only need
# compute_porutham() itself — no ephemeris, no birth data, no persistence.
#
# `pada` defaults to 3 when omitted: nakshatra_to_rasi(nak, pada=3) reproduces
# the classical majority-pada rasi (with the later rasi on an exact 2/2 pada
# split) for every one of the 9 nakshatras that straddle a rasi boundary —
# verified against the reference table in
# web/app/tools/marriage-porutham-calculator/PoruthamTool.tsx during the
# 2026-07 wiring audit. Pass pada=1/4 for an explicit early/late pada choice.


class PublicPoruthamStarRequest(BaseModel):
    boy_nakshatra_number: int = Field(alias="boyNakshatraNumber", ge=1, le=27)
    girl_nakshatra_number: int = Field(alias="girlNakshatraNumber", ge=1, le=27)
    boy_pada: int = Field(alias="boyPada", default=3, ge=1, le=4)
    girl_pada: int = Field(alias="girlPada", default=3, ge=1, le=4)
    compatibility_context: str = Field(alias="compatibilityContext", default="MARRIAGE")

    model_config = ConfigDict(populate_by_name=True)


class PublicPoruthamStarData(BaseModel):
    boy_nakshatra: int = Field(alias="boyNakshatra")
    girl_nakshatra: int = Field(alias="girlNakshatra")
    kutas: list[KutaResult]
    total_score: int = Field(alias="totalScore")
    max_score: int = Field(alias="maxScore")
    percentage: float
    label: str
    rajju_dosha: bool = Field(alias="rajjuDosha")
    vedha_dosha: bool = Field(alias="vedhaDosha")
    nadi_dosha: NadiDoshaData = Field(alias="nadiDosha")
    summary: RelationshipBiText
    compatibility_context: str = Field(default="MARRIAGE", alias="compatibilityContext")

    model_config = ConfigDict(populate_by_name=True)


class PublicPoruthamStarResponse(BaseModel):
    success: bool = True
    data: PublicPoruthamStarData

    model_config = ConfigDict(populate_by_name=True)


class PublicPoruthamGridRequest(BaseModel):
    girl_nakshatra_number: int = Field(alias="girlNakshatraNumber", ge=1, le=27)
    girl_pada: int = Field(alias="girlPada", default=3, ge=1, le=4)
    compatibility_context: str = Field(alias="compatibilityContext", default="MARRIAGE")

    model_config = ConfigDict(populate_by_name=True)


class PublicPoruthamGridItem(BaseModel):
    boy_nakshatra: int = Field(alias="boyNakshatra")
    total_score: int = Field(alias="totalScore")
    max_score: int = Field(alias="maxScore")
    percentage: float
    label: str
    rajju_dosha: bool = Field(alias="rajjuDosha")
    vedha_dosha: bool = Field(alias="vedhaDosha")
    nadi_caution: bool = Field(alias="nadiCaution")

    model_config = ConfigDict(populate_by_name=True)


class PublicPoruthamGridResponse(BaseModel):
    success: bool = True
    girl_nakshatra_number: int = Field(alias="girlNakshatraNumber")
    results: list[PublicPoruthamGridItem]

    model_config = ConfigDict(populate_by_name=True)


def _validate_compatibility_context(value: str) -> None:
    from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS

    if value not in VALID_COMPATIBILITY_CONTEXTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"compatibilityContext must be one of: {sorted(VALID_COMPATIBILITY_CONTEXTS)}",
        )


def _compute_star_porutham(
    boy_nakshatra: int,
    girl_nakshatra: int,
    boy_rasi: int,
    girl_rasi: int,
    compatibility_context: str,
    *,
    boy_pada: int = 1,
    girl_pada: int = 1,
) -> PublicPoruthamStarData:
    result = compute_porutham(
        boy_nakshatra=boy_nakshatra,
        girl_nakshatra=girl_nakshatra,
        boy_rasi=boy_rasi,
        girl_rasi=girl_rasi,
        boy_pada=boy_pada,
        girl_pada=girl_pada,
        nadi_parihara_mode=get_flag("nadi_parihara_mode"),
    )
    kutas = [
        KutaResult(name=k.name, name_ta=k.name_ta, score=k.score, max_score=k.max_score, label=k.label)
        for k in result.kutas
    ]
    nadi = result.nadi_dosha
    nadi_data = NadiDoshaData(
        boy_nadi=nadi["boy_nadi"],
        girl_nadi=nadi["girl_nadi"],
        has_nadi_dosha=nadi["has_nadi_dosha"],
        cancellations=nadi.get("cancellations", []),
        severity=nadi["severity"],
        mitigation=nadi.get("mitigation", "NONE"),
        nadi_parihara_mode=nadi.get("nadi_parihara_mode", "strict"),
        rajju_guard_warning=nadi.get("rajju_guard_warning"),
        note_ta=nadi["note_ta"],
        note_en=nadi["note_en"],
    )
    return PublicPoruthamStarData(
        boy_nakshatra=boy_nakshatra,
        girl_nakshatra=girl_nakshatra,
        kutas=kutas,
        total_score=result.total_score,
        max_score=result.max_score,
        percentage=result.percentage,
        label=result.label,
        rajju_dosha=result.rajju_dosha,
        vedha_dosha=result.vedha_dosha,
        nadi_dosha=nadi_data,
        summary=RelationshipBiText(ta=result.summary_ta, en=result.summary_en),
        compatibility_context=compatibility_context,
    )


@router.post("/porutham/by-star", response_model=PublicPoruthamStarResponse)
@public_endpoint_rate_limit("public_porutham")
def public_porutham_by_star(payload: PublicPoruthamStarRequest, request: Request) -> PublicPoruthamStarResponse:
    """Calculate the 10-kuta Tamil porutham from nakshatra numbers alone.

    No birth chart, no authentication, no persistence. Powers quick star-based
    tools (public marketing-site calculator, mobile porutham/friendship screens)
    where the user already knows their birth star.
    """
    _validate_compatibility_context(payload.compatibility_context)

    boy_rasi = nakshatra_to_rasi(payload.boy_nakshatra_number, payload.boy_pada)
    girl_rasi = nakshatra_to_rasi(payload.girl_nakshatra_number, payload.girl_pada)
    data = _compute_star_porutham(
        payload.boy_nakshatra_number,
        payload.girl_nakshatra_number,
        boy_rasi,
        girl_rasi,
        payload.compatibility_context,
        boy_pada=payload.boy_pada,
        girl_pada=payload.girl_pada,
    )
    return PublicPoruthamStarResponse(data=data)


@router.post("/porutham/by-star/grid", response_model=PublicPoruthamGridResponse)
@public_endpoint_rate_limit("public_porutham")
def public_porutham_by_star_grid(payload: PublicPoruthamGridRequest, request: Request) -> PublicPoruthamGridResponse:
    """Compare one nakshatra against all 27 possible partner nakshatras in one call.

    Powers the "full grid" view of the public marriage-porutham-calculator so the
    client doesn't have to make 27 separate requests against the per-IP rate limit.
    Each candidate uses its own default (pada 3) rasi.
    """
    _validate_compatibility_context(payload.compatibility_context)

    girl_rasi = nakshatra_to_rasi(payload.girl_nakshatra_number, payload.girl_pada)
    results: list[PublicPoruthamGridItem] = []
    for boy_nak in range(1, 28):
        data = _compute_star_porutham(
            boy_nak,
            payload.girl_nakshatra_number,
            nakshatra_to_rasi(boy_nak, 3),
            girl_rasi,
            payload.compatibility_context,
            boy_pada=3,  # matches this endpoint's own default-pada rasi assumption
            girl_pada=payload.girl_pada,
        )
        results.append(
            PublicPoruthamGridItem(
                boy_nakshatra=boy_nak,
                total_score=data.total_score,
                max_score=data.max_score,
                percentage=data.percentage,
                label=data.label,
                rajju_dosha=data.rajju_dosha,
                vedha_dosha=data.vedha_dosha,
                nadi_caution=data.nadi_dosha.has_nadi_dosha,
            )
        )
    return PublicPoruthamGridResponse(girl_nakshatra_number=payload.girl_nakshatra_number, results=results)


# ── Public Friendship Compatibility (Feature 4) ───────────────────────────────

class FriendshipRequest(BaseModel):
    person_a: PublicBirthInput = Field(alias="personA")
    person_b: PublicBirthInput = Field(alias="personB")

    model_config = ConfigDict(populate_by_name=True)


@router.post("/friendship-compatibility")
@public_endpoint_rate_limit("public_friendship")
def public_friendship_compatibility(payload: FriendshipRequest, request: Request) -> dict:
    """Positively-framed friendship compatibility between two people. No auth.

    Reuses the porutham engine but drops marriage-specific kutas and reframes the
    result as friendship. Endpoint-level per-IP budget, same cost tier as porutham
    (two ephemeris chart computations per call).
    """
    from app.services.friendship_compatibility_service import get_friendship_report

    try:
        chart_a = _chart_response_from_profile(_EphemeralProfile(payload.person_a), "thirukanitham-2026-v1")
        chart_b = _chart_response_from_profile(_EphemeralProfile(payload.person_b), "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=msg) from exc

    moon_a = next((p for p in chart_a.data.planets if p.graha == "MOON"), None)
    moon_b = next((p for p in chart_b.data.planets if p.graha == "MOON"), None)
    if moon_a is None or moon_b is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Could not determine Moon position.")

    return get_friendship_report(
        {
            "name": payload.person_a.display_name,
            "nakshatra": moon_a.nakshatra,
            "nakshatra_name": moon_a.nakshatra_name,
            "rasi": moon_a.rasi,
            "rasi_name": getattr(moon_a, "rasi_name", ""),
        },
        {
            "name": payload.person_b.display_name,
            "nakshatra": moon_b.nakshatra,
            "nakshatra_name": moon_b.nakshatra_name,
            "rasi": moon_b.rasi,
            "rasi_name": getattr(moon_b, "rasi_name", ""),
        },
    )


@router.get("/muhurtham-naals", response_model=MuhurthamNaalListResponse)
@public_endpoint_rate_limit("public_muhurtham_naals")
def public_muhurtham_naals(
    request: Request,
    year: int = 2027,
    month: int | None = None,
    pirai: str | None = None,
    weekday: str | None = None,
    nakshatra: str | None = None,
) -> MuhurthamNaalListResponse:
    """List the curated Tamil muhurtham (wedding) naals for a year.

    No authentication required — powers the public marketing page. Dates come
    from a published almanac sheet (not our broad calculation), enriched with
    each day's verified nakshatra / tithi / Tamil-month labels. Optional
    filters: month (1-12), pirai (VALARPIRAI|THEIPIRAI), weekday, nakshatra.
    """
    from app.data.muhurtham_naals import MUHURTHAM_SOURCE
    from app.services.muhurtham_naal_service import list_muhurtham_naals

    views = list_muhurtham_naals(
        year, month=month, pirai=pirai, weekday=weekday, nakshatra=nakshatra,
    )
    return MuhurthamNaalListResponse(
        year=year,
        source=MUHURTHAM_SOURCE,
        count=len(views),
        naals=[item_from_view(v) for v in views],
    )


@router.get("/panchangam-events")
@public_endpoint_rate_limit("public_panchangam_events")
def public_panchangam_events(request: Request, year: int = 2026) -> dict:
    """List all Tamil-calendar special events for a year with their next date.

    No auth. Powers the /tamil-calendar SEO hub. Each event includes its
    bilingual name, count of dates, and the next upcoming date.
    """
    from app.services.panchangam_events_service import list_events

    return list_events(year)


@router.get("/panchangam-events/{event}")
@public_endpoint_rate_limit("public_panchangam_events")
def public_panchangam_event(request: Request, event: str, year: int = 2026) -> dict:
    """Full date list + SEO content for one special event (e.g. pournami-2026).

    No auth. Powers the /tamil-calendar/[event] SEO pages. Accepts either an
    event key ('pournami') or a slug ('pournami-2026').
    """
    from app.services.panchangam_events_service import get_event

    return get_event(event, year)


@router.get("/calendar-categories")
@public_endpoint_rate_limit("public_calendar_categories")
def public_calendar_categories(request: Request, year: int = 2026) -> dict:
    """List festival/holiday category pages for the public Tamil calendar."""
    from app.services.calendar_category_service import list_calendar_categories

    return list_calendar_categories(year)


@router.get("/calendar-categories/{category}")
@public_endpoint_rate_limit("public_calendar_categories")
def public_calendar_category(request: Request, category: str, year: int = 2026) -> dict:
    """Full date list for one festival/holiday category page."""
    from app.services.calendar_category_service import get_calendar_category

    return get_calendar_category(category, year)


@router.get("/panchangam", response_model=PanchangamDailyResponse)
@public_endpoint_rate_limit("public_panchangam")
def public_panchangam(
    date: date,
    lat: float,
    request: Request,
    lng: float,
    timezone: str = "Asia/Kolkata",
    session: Session = Depends(get_db),
) -> PanchangamDailyResponse:
    """Return the full panchangam for a date and location.

    No authentication required.
    """
    query = PanchangamDailyQuery(date=date, lat=lat, lng=lng, timezone=timezone)
    return calculate_panchangam(query, session)


@router.get("/panchangam-share-card")
@public_endpoint_rate_limit("public_panchangam_share_card")
def public_panchangam_share_card(
    request: Request,
    date: date,
    lat: float = 13.0827,
    lng: float = 80.2707,
    timezone: str = "Asia/Kolkata",
    city: str = "Chennai",
    lang: str = "ta",
    session: Session = Depends(get_db),
) -> dict:
    """Assemble the share-card payload for a date/location. No authentication required.

    Defaults to Chennai. Used by the public /share/panchangam page and the in-app
    "Share Today's Card" button.
    """
    from app.services.panchangam_card_service import get_card_data

    return get_card_data(date, lat, lng, timezone, lang=lang, city=city, session=session)


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
    from app.calculations.panchangam import (
        RIKTA_TITHIS_IN_PAKSHA,
        SUBHA_NAKSHATRAS,
        SUBHA_TITHIS_KRISHNA,
        SUBHA_TITHIS_SHUKLA,
    )

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

    if tithi_in_paksha in RIKTA_TITHIS_IN_PAKSHA:
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


def _format_clock_label(value) -> str:
    if hasattr(value, "strftime"):
        value = value.strftime("%H:%M")
    pieces = str(value).split(":")
    try:
        hour = int(pieces[0])
        minute = int(pieces[1]) if len(pieces) > 1 else 0
    except (TypeError, ValueError):
        return str(value)
    hour %= 24
    minute %= 60
    period = "am" if hour < 12 else "pm"
    hour12 = hour % 12 or 12
    return f"{hour12}:{minute:02d} {period}"


def _format_time_range(start, end) -> str:
    return f"{_format_clock_label(start)}-{_format_clock_label(end)}"


@router.post("/muhurta", response_model=PublicMuhurtaResponse)
@public_endpoint_rate_limit("public_muhurta")
def public_muhurta(
    payload: PublicMuhurtaRequest,
    request: Request,
    session: Session = Depends(get_db),
) -> PublicMuhurtaResponse:
    """Return top-3 auspicious muhurta slots for a date range and event type.

    No authentication required. No birth chart — scoring uses Panchangam only
    (tithi, nakshatra, yoga, Abhijit). Create an account for chart-personalised
    muhurta that also considers dasha and hora windows.
    """
    from app.calculations.panchangam import best_gowri_slot, calculate_daily_panchangam_range

    event_type = payload.event_type.upper()
    if event_type not in _PUBLIC_MUHURTA_ACTIVITIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
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

            time_window = _format_time_range(t_start, t_end)
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


# ── Public Rasi Palan ──────────────────────────────────────────────────────────

_RASI_PALAN_TA: dict[int, dict] = {
    1:  {"title": "கலப்பான நாள்", "body": "சந்திரன் உங்கள் பிறப்பு ராசியில் உள்ளது. மன அமைதியின்மை, உள்ளார்ந்த சிந்தனை அதிகமாக இருக்கும். அவசர முடிவுகளைத் தவிர்க்கவும்; குறுகிய பயணம் சாத்தியம்.", "lucky_color": "வெள்ளை / வெள்ளி", "pariharam": "மாலையில் மேற்கு திசை நோக்கி சந்திரனுக்கு நீர் அர்க்கியம் செலுத்துங்கள். வீட்டில் வெள்ளை நிற விளக்கு ஏற்றுங்கள்.", "lucky_numbers": [2, 7], "tone": "neutral"},
    2:  {"title": "பண விஷயங்கள்", "body": "குடும்பம் மற்றும் பண விஷயங்கள் முன்னிலையில் உள்ளன. வாக்கு விஷயத்தில் கவனமாக இருங்கள். சிறிய பண பிரச்சினைகள் சாத்தியம்.", "lucky_color": "மஞ்சள் / தங்க நிறம்", "pariharam": "ஒரு குடும்பத்திற்கு உணவு அல்லது மளிகை தானம் செய்யுங்கள். காலையில் ஸ்ரீ சூக்தம் அல்லது லக்ஷ்மி அஷ்டகம் படியுங்கள்.", "lucky_numbers": [6, 8], "tone": "neutral"},
    3:  {"title": "தைரியம் மற்றும் முயற்சி", "body": "முயற்சி, குறுகிய பயணம், தொடர்பாடல் ஆகியவற்றிற்கு நல்ல சக்தி. சகோதர ஆதரவு உண்டு. நம்பிக்கையுடன் சவால்களை எதிர்கொள்ளுங்கள்.", "lucky_color": "சிவப்பு / கோரல்", "pariharam": "முருகன் கோவிலுக்கு செல்லுங்கள். சிவப்பு மலர் சமர்ப்பித்து வேண்டிக் கொள்ளுங்கள்.", "lucky_numbers": [3, 9], "tone": "positive"},
    4:  {"title": "வீடு மற்றும் சுகம்", "body": "வீடு, சொத்து, தாயின் நலன் ஆகியவை கவனம் பெறும். அமைதியான, சுகமான காலம். குடும்ப விஷயங்களுக்கு ஏற்றது.", "lucky_color": "வெண்மை / இளம் பச்சை", "pariharam": "சிவலிங்கத்திற்கு பால் அபிஷேகம் செய்யுங்கள். இன்று தாயை சேவியுங்கள் அல்லது அவர் ஆசீர்வாதம் பெறுங்கள்.", "lucky_numbers": [2, 4], "tone": "positive"},
    5:  {"title": "புத்தி மற்றும் மகிழ்ச்சி", "body": "புத்தி கூர்மையாகவும் படைப்பாற்றல் மிகுந்தும் உள்ளது. பிள்ளைகள், காதல், கற்றல் ஆகியவற்றிற்கு நல்லது. உள்ளுணர்வு அதிகரிக்கும்.", "lucky_color": "மஞ்சள் / ஆரஞ்சு", "pariharam": "விநாயகர் கோவிலுக்கு செல்லுங்கள். கொழுக்கட்டை நைவேத்தியம் செய்யுங்கள்.", "lucky_numbers": [5, 9], "tone": "positive"},
    6:  {"title": "உடல் நலம் மற்றும் சேவை", "body": "சிறிய உடல்நலக்குறைவு அல்லது கடன் வரலாம். மோதல்களை கவனமாக கையாளுங்கள். சேவை, வழக்கமான பணிகள், சுய பராமரிப்பில் கவனம் செலுத்துங்கள்.", "lucky_color": "பச்சை", "pariharam": "காலையில் நாய்கள் மற்றும் பறவைகளுக்கு உணவிடுங்கள். துர்கை கோவிலுக்கு சென்று வேம்பு இலை சமர்ப்பியுங்கள்.", "lucky_numbers": [5, 6], "tone": "caution"},
    7:  {"title": "உறவுகள்", "body": "கூட்டாண்மை, சமூக தொடர்புகள் முன்னிலையில் உள்ளன. புதியவர்களை சந்திக்கவும், ஒத்துழைக்கவும் ஏற்ற நேரம். துணையர் விஷயங்கள் கவனம் பெறும்.", "lucky_color": "வெள்ளை / இளஞ்சிவப்பு", "pariharam": "லலிதா சஹஸ்ரநாமம் படியுங்கள் அல்லது தேவிக்கு மலர் சமர்ப்பியுங்கள். துணையரிடம் அன்பான செயல் செய்யுங்கள்.", "lucky_numbers": [6, 7], "tone": "neutral"},
    8:  {"title": "சந்திராஷ்டமம்", "body": "சந்திரன் உங்கள் ராசியிலிருந்து 8ஆம் இடத்தில் உள்ளது. புதிய தொடக்கங்கள், முக்கிய முடிவுகள், அறுவை சிகிச்சை, பண ஆபத்துகளை தவிர்க்கவும். ஓய்வும் தியானமும் நலம்.", "lucky_color": "வெள்ளை / சாம்பல்", "pariharam": "சிவலிங்கத்திற்கு பால் அபிஷேகம் செய்து வில்வம் சமர்ப்பியுங்கள். மகா மிருத்யுஞ்சய மந்திரம் 108 முறை ஜபியுங்கள்.", "lucky_numbers": [8], "tone": "warn"},
    9:  {"title": "அதிர்ஷ்டம் மற்றும் ஆசீர்வாதம்", "body": "சுப காலம். அதிர்ஷ்டம், தர்மம், தந்தையின் ஆசீர்வாதம், நீண்ட பயணம் ஆகியவை சாதகமாக உள்ளன. ஆன்மிக நடவடிக்கைகளில் பலன் கிடைக்கும்.", "lucky_color": "மஞ்சள் / காவி", "pariharam": "குலதெய்வம் அல்லது தந்தையின் விரும்பிய கோவிலுக்கு செல்லுங்கள். கோவிலுக்கு தானம் செய்யுங்கள்.", "lucky_numbers": [1, 3], "tone": "positive"},
    10: {"title": "தொழில் மற்றும் அங்கீகாரம்", "body": "தொழில் நடவடிக்கைகள், பொது தெரிவு, தலைமை ஏற்பதற்கு நல்லது. தொழில் இலக்குகளில் நடவடிக்கை எடுங்கள் — வேகம் கிடைக்கும்.", "lucky_color": "சிவப்பு / செம்பு / ஆரஞ்சு", "pariharam": "சூரிய அஷ்டகம் படியுங்கள் அல்லது காலையில் உதிக்கும் சூரியனுக்கு அர்க்கியம் செலுத்துங்கள்.", "lucky_numbers": [1, 9], "tone": "positive"},
    11: {"title": "லாபம் மற்றும் வெற்றி", "body": "மிகவும் நல்ல நாள். லாபம், ஆசை நிறைவேற்றம், வருமானம், நட்பு சாதகமாக உள்ளன. சந்திர சுழற்சியின் சிறந்த காலம் — வாய்ப்புகளை பயன்படுத்துங்கள்.", "lucky_color": "நீலம் / இண்டிகோ", "pariharam": "ஒரு தர்ம நிறுவனத்திற்கு தானம் செய்யுங்கள். விநாயகர் கோவிலுக்கு சென்று வேண்டிக் கொள்ளுங்கள்.", "lucky_numbers": [3, 6, 9], "tone": "positive"},
    12: {"title": "செலவு மற்றும் ஓய்வு", "body": "செலவுகள் மற்றும் நஷ்டம் சாத்தியம். உலகிலிருந்து விலகி ஓய்வெடுங்கள். ஆன்மிக சாதனை, தனிமை, வெளிநாட்டு தொடர்புகளுக்கு ஏற்றது.", "lucky_color": "மஞ்சள் / வெள்ளை", "pariharam": "மாலையில் நல்லெண்ணெய் விளக்கு ஏற்றுங்கள். ஏழைகளுக்கு தானம் செய்யுங்கள். விஷ்ணு சஹஸ்ரநாமம் படியுங்கள்.", "lucky_numbers": [3, 7], "tone": "caution"},
}

_RASI_PALAN_EN: dict[int, dict] = {
    1:  {"title": "Mixed day", "body": "Moon transits your natal sign — mental restlessness and introspection. Avoid impulsive new starts; short travel is possible.", "lucky_color": "White / Silver", "pariharam": "Offer water to the Moon at dusk (pour water facing west while reciting Chandra's name). Light a white lamp at home.", "lucky_numbers": [2, 7], "tone": "neutral"},
    2:  {"title": "Financial focus", "body": "Family and money matters surface. Watch your speech — careless words create friction. Minor monetary tensions are possible.", "lucky_color": "Yellow / Gold", "pariharam": "Donate food or groceries to a family in need. Recite Sri Suktam or Lakshmi Ashtakam in the morning.", "lucky_numbers": [6, 8], "tone": "neutral"},
    3:  {"title": "Courage and effort", "body": "Strong energy for initiative, short travel, and communication. Sibling support is available. Take on challenges with confidence.", "lucky_color": "Red / Coral", "pariharam": "Visit a Murugan temple. Offer red flowers or a garland and pray for strength and courage.", "lucky_numbers": [3, 9], "tone": "positive"},
    4:  {"title": "Home and comfort", "body": "Focus on home, property, and mother's wellbeing. A peaceful and comforting period — good for domestic matters and rest.", "lucky_color": "Cream / Light Green", "pariharam": "Offer milk abhishekam to a Shivalinga. Serve or seek blessings from your mother today.", "lucky_numbers": [2, 4], "tone": "positive"},
    5:  {"title": "Intellect and joy", "body": "Sharp intelligence and creativity. Good for children, romance, learning, and speculative ideas. Intuition is heightened.", "lucky_color": "Yellow / Orange", "pariharam": "Visit a Vinayaka temple. Offer modakam or kozhukattai and pray for wisdom and clarity.", "lucky_numbers": [5, 9], "tone": "positive"},
    6:  {"title": "Health and service", "body": "Minor health issues or debts may surface. Handle conflicts carefully. Focus on service, routines, and self-care.", "lucky_color": "Green", "pariharam": "Feed dogs and birds in the morning. Visit a Durga Devi temple and offer neem leaves or flowers.", "lucky_numbers": [5, 6], "tone": "caution"},
    7:  {"title": "Relationships", "body": "Partnerships and social interactions are highlighted. Good for meeting people, collaborating, and spouse-related matters.", "lucky_color": "White / Pink", "pariharam": "Recite Lalita Sahasranama or offer white or pink flowers to Devi. Perform an act of kindness toward your spouse or partner.", "lucky_numbers": [6, 7], "tone": "neutral"},
    8:  {"title": "Chandrashtamam", "body": "Moon is in the 8th house from your rasi. Avoid new ventures, major decisions, surgery, and financial risk. Rest and introspect.", "lucky_color": "White / Grey", "pariharam": "Perform milk abhishekam on a Shivalinga and offer bilva leaves. Recite Maha Mrityunjaya mantra 108 times for protection.", "lucky_numbers": [8], "tone": "warn"},
    9:  {"title": "Fortune and blessings", "body": "Auspicious period. Luck, dharma, father's blessings, and long journeys are favoured. Spiritual activities bring rewards.", "lucky_color": "Yellow / Saffron", "pariharam": "Visit your kula deivam or father's favourite deity. Donate to a temple or offer yellow flowers to Guru Bhagavan.", "lucky_numbers": [1, 3], "tone": "positive"},
    10: {"title": "Career and recognition", "body": "Good for professional activities, public visibility, and leadership. Take action on career goals — momentum is available.", "lucky_color": "Red / Copper / Orange", "pariharam": "Recite Surya Ashtakam or offer water to the rising Sun. Visit a Sun temple or Murugan temple.", "lucky_numbers": [1, 9], "tone": "positive"},
    11: {"title": "Gains and success", "body": "Excellent day. Gains, fulfilled desires, income, and friendships are favoured. Best window in the lunar cycle — act on opportunities.", "lucky_color": "Blue / Indigo", "pariharam": "Donate to a charity or help someone in genuine need. Visit a Ganapati temple and pray for continued blessings.", "lucky_numbers": [3, 6, 9], "tone": "positive"},
    12: {"title": "Expenses and rest", "body": "Expenditure and losses are possible. Retreat from the world — good for spiritual practice, solitude, and overseas connections.", "lucky_color": "Yellow / White (spiritual tones)", "pariharam": "Light a sesame oil lamp in the evening. Donate to the poor or a dharmasala. Recite Vishnu Sahasranama for peace.", "lucky_numbers": [3, 7], "tone": "caution"},
}

_RASI_NAMES_TA: dict[int, str] = {
    1: "மேஷம்", 2: "ரிஷபம்", 3: "மிதுனம்", 4: "கடகம்",
    5: "சிம்மம்", 6: "கன்னி", 7: "துலாம்", 8: "விருச்சிகம்",
    9: "தனுசு", 10: "மகரம்", 11: "கும்பம்", 12: "மீனம்",
}


def _resolve_rasi_number(rasi: str) -> int:
    """Accept a rasi number (1-12) or name (mesham, rishabam, …) and return 1-12."""
    rasi = rasi.strip()
    if rasi.isdigit():
        n = int(rasi)
        if 1 <= n <= 12:
            return n
        raise ValueError(f"rasi number must be 1-12, got {n}")
    key = rasi.lower().replace(" ", "")
    # Try direct lookup then common aliases
    aliases = {"kadagam": "katakam", "katakam": "katakam", "simmam": "simmam", "simham": "simmam"}
    lookup_key = aliases.get(key, key)
    # RASI_NAME_TO_NUMBER uses Mesham-style keys; build our own map too
    _extra = {
        "mesham": 1, "rishabam": 2, "mithunam": 3, "katakam": 4, "kadagam": 4,
        "simmam": 5, "simham": 5, "kanni": 6, "thulam": 7, "viruchigam": 8,
        "dhanusu": 9, "makaram": 10, "kumbam": 11, "meenam": 12,
    }
    n = _extra.get(lookup_key) or _extra.get(key) or RASI_NAME_TO_NUMBER.get(lookup_key) or RASI_NAME_TO_NUMBER.get(key)
    if n is None:
        raise ValueError(f"Unknown rasi: '{rasi}'. Use a number 1-12 or a name like 'mesham'.")
    return n


def _rasi_palan_prediction(janma_rasi: int, moon_house: int) -> dict:
    """Build the ta/en prediction payload for one janma rasi given the Moon's house."""
    pred_ta = _RASI_PALAN_TA[moon_house]
    pred_en = _RASI_PALAN_EN[moon_house]
    rasi_name_en = RASI_NAMES.get(janma_rasi, str(janma_rasi))
    rasi_name_ta = _RASI_NAMES_TA.get(janma_rasi, rasi_name_en)
    return {
        "rasi": janma_rasi,
        "rasiName": {"ta": rasi_name_ta, "en": rasi_name_en},
        "moonHouse": moon_house,
        "headline": {"ta": pred_ta["title"], "en": pred_en["title"]},
        "body": {"ta": pred_ta["body"], "en": pred_en["body"]},
        "luckyColor": {"ta": pred_ta["lucky_color"], "en": pred_en["lucky_color"]},
        "luckyNumbers": pred_ta["lucky_numbers"],
        "pariharam": {"ta": pred_ta["pariharam"], "en": pred_en["pariharam"]},
        "tone": pred_ta["tone"],
    }


class PublicRasiPalanResponse(BaseModel):
    success: bool = True
    rasi: int
    rasi_name: dict = Field(alias="rasiName")
    date: date
    moon_rasi: int = Field(alias="moonRasi")
    moon_house: int = Field(alias="moonHouse")
    headline: dict
    body: dict
    lucky_color: dict = Field(alias="luckyColor")
    lucky_numbers: list[int] = Field(alias="luckyNumbers")
    pariharam: dict
    tone: str

    model_config = ConfigDict(populate_by_name=True)


@router.get("/rasi-palan", response_model=PublicRasiPalanResponse)
@public_endpoint_rate_limit("public_panchangam")
def public_rasi_palan(
    request: Request,
    rasi: str,
    query_date: date | None = None,
    lang: str = "ta",
    lat: float = 13.0827,
    lng: float = 80.2707,
    timezone: str = "Asia/Kolkata",
    session: Session = Depends(get_db),
) -> PublicRasiPalanResponse:
    """Return today's rasi palan for a janma rasi based on Moon's current transit.

    No authentication required. The Moon's rasi is derived from the panchangam
    engine for the given date and location (defaults to Chennai). The house number
    (Moon's position from janma rasi) drives the prediction.
    """
    try:
        janma_rasi = _resolve_rasi_number(rasi)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc

    target_date = query_date or date.today()
    query = PanchangamDailyQuery(date=target_date, lat=lat, lng=lng, timezone=timezone)
    panchangam = calculate_panchangam(query, session)
    moon_rasi = panchangam.data.chandrashtamam_today.moon_rasi_number
    moon_house = ((moon_rasi - janma_rasi) % 12) + 1

    return PublicRasiPalanResponse(
        success=True,
        date=target_date,
        moonRasi=moon_rasi,
        **_rasi_palan_prediction(janma_rasi, moon_house),
    )


class PublicRasiPalanGridItem(BaseModel):
    rasi: int
    rasi_name: dict = Field(alias="rasiName")
    moon_house: int = Field(alias="moonHouse")
    headline: dict
    body: dict
    lucky_color: dict = Field(alias="luckyColor")
    lucky_numbers: list[int] = Field(alias="luckyNumbers")
    pariharam: dict
    tone: str

    model_config = ConfigDict(populate_by_name=True)


class PublicRasiPalanGridResponse(BaseModel):
    success: bool = True
    date: date
    moon_rasi: int = Field(alias="moonRasi")
    nakshatra: str
    results: list[PublicRasiPalanGridItem]

    model_config = ConfigDict(populate_by_name=True)


@router.get("/rasi-palan/grid", response_model=PublicRasiPalanGridResponse)
@public_endpoint_rate_limit("public_panchangam")
def public_rasi_palan_grid(
    request: Request,
    query_date: date | None = None,
    lat: float = 13.0827,
    lng: float = 80.2707,
    timezone: str = "Asia/Kolkata",
    session: Session = Depends(get_db),
) -> PublicRasiPalanGridResponse:
    """Return today's rasi palan for all 12 janma rasis in a single call.

    Computes the panchangam once (the Moon's current transit is independent of
    which janma rasi is asked about) and derives all 12 predictions from it,
    instead of forcing 12 separate `/rasi-palan` calls per page load.
    """
    target_date = query_date or date.today()
    query = PanchangamDailyQuery(date=target_date, lat=lat, lng=lng, timezone=timezone)
    panchangam = calculate_panchangam(query, session)
    moon_rasi = panchangam.data.chandrashtamam_today.moon_rasi_number

    results = [
        PublicRasiPalanGridItem(**_rasi_palan_prediction(janma_rasi, ((moon_rasi - janma_rasi) % 12) + 1))
        for janma_rasi in range(1, 13)
    ]

    return PublicRasiPalanGridResponse(
        success=True,
        date=target_date,
        moonRasi=moon_rasi,
        nakshatra=panchangam.data.nakshatra.name,
        results=results,
    )


# ── Public Monthly Panchangam ──────────────────────────────────────────────────

@router.get("/panchangam/monthly", response_model=PanchangamMonthlyResponse)
@public_endpoint_rate_limit("public_panchangam")
def public_panchangam_monthly(
    request: Request,
    query: PanchangamMonthlyQuery = Depends(),
    session: Session = Depends(get_db),
) -> PanchangamMonthlyResponse:
    """Return the monthly panchangam (festival markers, special days) without auth.

    Powers the guest calendar screen (S3). Same data as the authenticated
    /panchangam/monthly but accessible to guest users.
    """
    return build_monthly_panchangam(query, session)


# ── Numerology (Chaldean) ──────────────────────────────────────────────────────
#
# Public and unauthenticated on purpose: numerology needs only a date of birth
# and a name — no birth time, no location. It is therefore the one reading we
# can offer the large share of users who bounce at the birth-time field.
#
# Gated on the `numerology_engine` flag (default OFF) while the interpretive
# corpus is unreviewed. Responses carry numbers and graha names only, never
# readings — see app/schemas/numerology.py.


def _require_numerology_enabled() -> None:
    if not bool(get_flag("numerology_engine")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not available.")


@router.post("/numerology/profile", response_model=NumerologyProfileResponse)
@public_endpoint_rate_limit("public_numerology")
def public_numerology_profile(
    payload: NumerologyProfileRequest,
    request: Request,
) -> NumerologyProfileResponse:
    """Compute the four core numbers from a date of birth and optional name(s)."""
    _require_numerology_enabled()
    try:
        profile = build_profile(
            year=payload.birth_date.year,
            month=payload.birth_date.month,
            day=payload.birth_date.day,
            document_name=payload.document_name,
            called_name=payload.called_name,
        )
    except ScriptMismatchError as exc:
        # Chaldean values are Latin-only. Refusing beats silently skipping the
        # characters and returning a confident wrong number.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    return NumerologyProfileResponse.from_profile(profile)


@router.post("/numerology/number", response_model=ObjectNumberResponse)
@public_endpoint_rate_limit("public_numerology")
def public_numerology_number(
    payload: ObjectNumberRequest,
    request: Request,
) -> ObjectNumberResponse:
    """Analyse a mobile, vehicle or house number."""
    _require_numerology_enabled()
    try:
        result = analyze_object(payload.value, payload.kind)
    except ScriptMismatchError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    return ObjectNumberResponse.from_reading(result)


@router.post("/numerology/personal-year", response_model=PersonalCycleResponse)
@public_endpoint_rate_limit("public_numerology")
def public_personal_year(
    payload: PersonalCycleRequest,
    request: Request,
) -> PersonalCycleResponse:
    """Personal year (and the month/day inside it) for a date of birth.

    Numbers only, same rule Phase 2 ships under — no interpretive copy anywhere
    in this response. The month and day ride along because
    ``personal_cycle`` derives all three in one pass and a personal year with no
    position inside it is half a reading.

    ``epoch``, ``cycleStart`` and ``cycleEnd`` are part of the answer, not
    metadata: the year rolls on a different day under each doctrine D1 branch
    (birthday / 1 January / Puthandu), so a number without its window cannot be
    checked against anyone else's.

    Unauthenticated, like the rest of the numerology tools — this needs a date
    of birth and nothing else. The authenticated
    ``/charts/{chart_id}/numerology/personal-cycle`` takes the birth date from
    the jadhagam and resolves Puthandu at the native's own longitude; here it
    can only be the Chennai reference point.

    POST rather than GET to match the sibling numerology tools and keep dates of
    birth out of URLs and access logs.
    """
    _require_numerology_enabled()
    try:
        cycle = cycle_for(payload.birth_date, payload.on_date or date.today())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    return PersonalCycleResponse.from_cycle(cycle)


# ── Baby naming (NUM-50/51/52) ──────────────────────────────────────────────
#
# Behind a SECOND flag on top of `numerology_engine` — `numerology_baby_naming`,
# defaulting True as of 2026-07-30 (access-gating, on product direction; see
# app/services/feature_flags.py). That flag does not by itself mean this is
# reviewed: the nakshatra-pada canon this matches against is 0/108
# astrologer-verified, and the name corpus (app/data/tamil_name_corpus.py) was
# drafted by an assistant with zero rows reviewed. assert_canon_usable() is
# the operative backstop and still raises outside dev/test regardless of
# either flag.
#
# Two routes here. `POST /numerology/baby-names` takes a bare nakshatra+pada —
# no chart, so no lagna, so `alignment` is null on every candidate.
# `POST /numerology/baby-names-preview` is the primary path: raw birth
# details, mirroring `/chart-preview`'s ephemeral (no-login, unpersisted)
# chart computation, which DOES carry a real lagna — so it ranks by Fortune
# Alignment same as the signed-in `/charts/{id}/numerology/baby-names` route
# (app/api/numerology.py), just without needing a saved profile first.


def _require_baby_naming_enabled() -> None:
    if not bool(get_flag("numerology_baby_naming")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not available.")


@router.post("/numerology/baby-names", response_model=BabyNamesResponse)
@public_endpoint_rate_limit("public_numerology")
def public_baby_names(
    payload: PublicBabyNameRequest,
    request: Request,
) -> BabyNamesResponse:
    """Baby names for a bare nakshatra + pada — no chart, no alignment.

    ``response.usable`` is False and ``response.canonVerified`` is False until
    the pada canon and the name corpus have both cleared review — a client
    must not render ``candidates`` as a recommendation until then.
    """
    _require_numerology_enabled()
    _require_baby_naming_enabled()
    try:
        result = baby_names_for_pada(
            payload.nakshatra_id,
            payload.pada,
            gender=payload.gender,
            mode=NamingMode(payload.mode),
            allow_ambiguous=payload.allow_ambiguous,
            allow_tamil_collapse=payload.allow_tamil_collapse,
            limit=payload.limit,
        )
    except UnverifiedCanonError as exc:
        # Belt-and-braces backstop behind the two flags above — reachable only
        # if both were flipped True against a still-unverified canon in a real
        # environment.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    return BabyNamesResponse.from_result(result)


class PublicBabyNamesPreviewRequest(BaseModel):
    """Raw birth details — the primary baby-naming input, since the person
    this feature is for does not have a saved profile yet."""

    birth: PublicBirthInput
    gender: Literal["m", "f", "n"] | None = None
    #: Scope ladder — see `app.calculations.numerology_naming.NamingMode`.
    mode: Literal["pada_first", "pada_weighted", "rasi_wide", "open"] = "pada_first"
    allow_ambiguous: bool = Field(alias="allowAmbiguous", default=False)
    allow_tamil_collapse: bool = Field(alias="allowTamilCollapse", default=False)
    limit: int = Field(default=20, ge=1, le=50)

    model_config = ConfigDict(populate_by_name=True)


@router.post("/numerology/baby-names-preview", response_model=BabyNamesResponse)
@public_endpoint_rate_limit("public_numerology")
def public_baby_names_preview(
    payload: PublicBabyNamesPreviewRequest,
    request: Request,
) -> BabyNamesResponse:
    """Baby names from raw birth details — no saved profile, no login.

    Mirrors `/chart-preview`'s ephemeral-chart pattern exactly: the chart is
    computed once, in memory, to read the Moon's nakshatra-pada and this
    native's own lagna/strengths for Fortune Alignment, then discarded —
    nothing here is persisted. This is the primary way to use baby naming,
    because the person it is for does not have a saved chart to point at.

    ``response.usable`` is False and ``response.canonVerified`` is False
    until the pada canon and the name corpus have both cleared review — a
    client must not render ``candidates`` as a recommendation until then.
    """
    _require_numerology_enabled()
    _require_baby_naming_enabled()
    profile = _EphemeralProfile(payload.birth)
    try:
        chart = _chart_response_from_profile(profile, "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=msg) from exc

    try:
        result = baby_names_for_birth_details(
            chart,
            gender=payload.gender,
            mode=NamingMode(payload.mode),
            allow_ambiguous=payload.allow_ambiguous,
            allow_tamil_collapse=payload.allow_tamil_collapse,
            limit=payload.limit,
        )
    except UnverifiedCanonError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    return BabyNamesResponse.from_result(result)
