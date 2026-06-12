from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.age_gate import MINOR_REDIRECT_KEYWORDS, is_minor
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.user import User
from app.schemas.ask_vinaadi import (
    AskVinaadiQuery,
    AskVinaadiResponse,
    AskVinaadiResponseData,
    BiText,
)
from app.schemas.dasha import ResponseMeta
from app.services.ask_vinaadi_service import answer_question
from app.services.ask_vinaadi_usage_service import (
    assert_chip_available,
    consume_chip,
    get_daily_status,
)

router = APIRouter()


@router.get("/ask-vinaadi/daily-status", tags=["ask-vinaadi"])
def ask_vinaadi_daily_status(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return get_daily_status(session, current_user.user_id)


def _minor_redirect_response(question: str) -> AskVinaadiResponse:
    """Safe redirect served instead of processing love/marriage questions for minors."""
    return AskVinaadiResponse(
        data=AskVinaadiResponseData(
            question=question,
            answer=BiText(
                ta=(
                    "இந்த வயதில் காதல்/திருமணம் தொடர்பான கேள்விகளை நாம் பார்ப்பதில்லை. "
                    "உங்கள் படிப்பு, ஆரோக்கியம், குடும்பம் மற்றும் ஆன்மிக வளர்ச்சி பற்றி "
                    "கேட்கலாம் — இவற்றில் உங்களுக்கு நல்ல வழிகாட்டுதல் தர விநாடி தயார்."
                ),
                en=(
                    "We don't cover love or marriage questions at your age. You can ask about "
                    "studies, health, family, and spiritual growth instead — Vinaadi is happy to "
                    "guide you on those."
                ),
            ),
            signalsUsed=[],
            confidence="HIGH",
            caveat=None,
            questionsUsedToday=0,
            dailyLimit=0,
        ),
        meta=ResponseMeta(
            calculation_version="age-gate-redirect-v1",
            generated_at=datetime.now(tz=UTC),
        ),
    )


@router.post("/charts/{chart_id}/ask", response_model=AskVinaadiResponse, tags=["ask-vinaadi"])
def ask_vinaadi(
    chart_id: UUID,
    payload: AskVinaadiQuery,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AskVinaadiResponse:
    # Feature 5 — minors asking about love/marriage get a safe redirect (not processed,
    # not counted against the daily limit).
    chart = session.get(Chart, chart_id)
    profile = session.get(BirthProfile, chart.birth_profile_id) if chart else None
    if profile is not None and is_minor(profile.birth_date_local):
        q_lower = payload.question.lower()
        if any(keyword in q_lower for keyword in MINOR_REDIRECT_KEYWORDS):
            return _minor_redirect_response(payload.question)

    # Feature 3 — enforce the free-tier daily chip limit before processing.
    assert_chip_available(session, current_user.user_id)

    response = answer_question(
        session,
        chart_id,
        payload.question,
        owner_user_id=current_user.user_id,
    )

    # Count this successful question and surface remaining chips to the client.
    response.data.chips_remaining = consume_chip(session, current_user.user_id)
    return response
