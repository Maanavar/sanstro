"""
Static content endpoints — Nakshatra personality cards (FEATURE-10).
No astronomical calculation; pre-populated content for all 27 Nakshatras.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.nakshatra_content_static import get_nakshatra_card, NakshatraCardResponse

router = APIRouter()


@router.get(
    "/content/nakshatra/{nakshatra_number}",
    response_model=NakshatraCardResponse,
    tags=["content"],
    summary="Get personality and cultural profile for a Nakshatra (1-27)",
)
def nakshatra_content(nakshatra_number: int) -> NakshatraCardResponse:
    if not 1 <= nakshatra_number <= 27:
        raise HTTPException(status_code=422, detail="nakshatra_number must be between 1 and 27.")
    return get_nakshatra_card(nakshatra_number)
