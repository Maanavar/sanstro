from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.age_gate import (
    CAREER_REDIRECT_KEYWORDS,
    MARRIED_TIMING_REDIRECT_KEYWORDS,
    MINOR_REDIRECT_KEYWORDS,
    SENIOR_MARRIAGE_REDIRECT_KEYWORDS,
    STUDY_REDIRECT_KEYWORDS,
    WELLBEING_REDIRECT_KEYWORDS,
    compute_age,
    is_married_settled,
    is_minor,
    is_past_prime_marriage_age,
    is_young_child,
)
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


def _minor_career_redirect_response(question: str) -> AskVinaadiResponse:
    return AskVinaadiResponse(
        data=AskVinaadiResponseData(
            question=question,
            answer=BiText(
                ta=(
                    "தொழில்/வேலை தொடர்பான கேள்விகள் இந்த வயதில் பொருந்தாது. "
                    "படிப்பு, ஆரோக்கியம், ஆர்வங்கள் மற்றும் திறன் வளர்ச்சி பற்றி கேட்கலாம் — "
                    "இவற்றில் விநாடி உங்களுக்கு நல்ல வழிகாட்டுதல் தர தயார்."
                ),
                en=(
                    "Career and job questions are not applicable at your age. You can ask about "
                    "studies, health, interests, and skill-building instead — "
                    "Vinaadi is happy to guide you on those."
                ),
            ),
            signalsUsed=[],
            confidence="HIGH",
            caveat=None,
            questionsUsedToday=0,
            dailyLimit=0,
        ),
        meta=ResponseMeta(
            calculation_version="minor-career-gate-redirect-v1",
            generated_at=datetime.now(tz=UTC),
        ),
    )


def _minor_wellbeing_redirect_response(question: str) -> AskVinaadiResponse:
    """P1-2/D11 hard gate mirrored here: propensity_service hard-suppresses
    the sensitive WELLBEING/CAUTION cards for minors, so Ask Vinaadi must not
    answer the same topics in free text instead."""
    return AskVinaadiResponse(
        data=AskVinaadiResponseData(
            question=question,
            answer=BiText(
                ta=(
                    "இந்த வயதில் இது போன்ற தனிப்பட்ட நல்வாழ்வு கேள்விகளை நாம் பார்ப்பதில்லை. "
                    "ஏதேனும் கவலை இருந்தால் பெற்றோர் அல்லது நம்பகமான பெரியவருடன் பேசுவது நல்லது. "
                    "படிப்பு, ஆரோக்கியமான பழக்கவழக்கங்கள் மற்றும் ஆன்மிக வளர்ச்சி பற்றி கேட்கலாம்."
                ),
                en=(
                    "We don't cover personal wellbeing questions like this at your age. If something is "
                    "worrying you, please talk to a parent or a trusted adult. You can ask about studies, "
                    "healthy habits, and spiritual growth instead."
                ),
            ),
            signalsUsed=[],
            confidence="HIGH",
            caveat=None,
            questionsUsedToday=0,
            dailyLimit=0,
        ),
        meta=ResponseMeta(
            calculation_version="minor-wellbeing-gate-redirect-v1",
            generated_at=datetime.now(tz=UTC),
        ),
    )


def _infant_study_redirect_response(question: str) -> AskVinaadiResponse:
    return AskVinaadiResponse(
        data=AskVinaadiResponseData(
            question=question,
            answer=BiText(
                ta=(
                    "இந்த வயதில் கல்வி/பள்ளி தொடர்பான கேள்விகள் பொருந்தாது. "
                    "ஆரோக்கியம், குழந்தை வளர்ச்சி மற்றும் குடும்ப நலன் பற்றி கேட்கலாம் — "
                    "இவற்றில் விநாடி உதவ தயார்."
                ),
                en=(
                    "Education and school questions are not applicable at this age. You can ask about "
                    "health, child development, and family well-being instead — "
                    "Vinaadi is happy to help with those."
                ),
            ),
            signalsUsed=[],
            confidence="HIGH",
            caveat=None,
            questionsUsedToday=0,
            dailyLimit=0,
        ),
        meta=ResponseMeta(
            calculation_version="infant-study-gate-redirect-v1",
            generated_at=datetime.now(tz=UTC),
        ),
    )


def _married_timing_redirect_response(question: str) -> AskVinaadiResponse:
    return AskVinaadiResponse(
        data=AskVinaadiResponseData(
            question=question,
            answer=BiText(
                ta=(
                    "நீங்கள் ஏற்கனவே திருமணமானவர் என்பதால், 'எப்போது திருமணம்' கேள்விக்கு "
                    "பதில் சொல்வது பொருந்தாது. உங்கள் திருமண வாழ்க்கையில் உறவு ஒற்றுமை, "
                    "குடும்ப நலன் அல்லது இணை புரிதல் பற்றி கேட்கலாம் — அதற்கு விநாடி உதவ தயார்."
                ),
                en=(
                    "Since you are already married, questions about 'when will I get married' don't apply. "
                    "You can ask about relationship harmony, family well-being, or understanding your partner "
                    "better — Vinaadi is happy to help with those."
                ),
            ),
            signalsUsed=[],
            confidence="HIGH",
            caveat=None,
            questionsUsedToday=0,
            dailyLimit=0,
        ),
        meta=ResponseMeta(
            calculation_version="married-gate-redirect-v1",
            generated_at=datetime.now(tz=UTC),
        ),
    )


def _senior_marriage_redirect_response(question: str) -> AskVinaadiResponse:
    return AskVinaadiResponse(
        data=AskVinaadiResponseData(
            question=question,
            answer=BiText(
                ta=(
                    "இந்த வாழ்க்கை கட்டத்தில் திருமண நேர கணிப்பு பொருந்தாது. "
                    "துணைவன்/துணைவி ஒற்றுமை, குடும்ப நலன், ஆன்மிக வளர்ச்சி அல்லது "
                    "உடல் ஆரோக்கியம் பற்றி கேட்கலாம் — இவற்றில் விநாடி உதவ தயார்."
                ),
                en=(
                    "Marriage timing predictions are not applicable at this life stage. "
                    "You can ask about companionship quality, family well-being, spiritual growth, "
                    "or health — Vinaadi is happy to guide you on those."
                ),
            ),
            signalsUsed=[],
            confidence="HIGH",
            caveat=None,
            questionsUsedToday=0,
            dailyLimit=0,
        ),
        meta=ResponseMeta(
            calculation_version="senior-gate-redirect-v1",
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
    # Verify ownership first so no feature-specific logic leaks chart existence or
    # the owner's birth date to callers who don't own the chart.
    chart = session.get(Chart, chart_id)
    profile = session.get(BirthProfile, chart.birth_profile_id) if chart else None
    if profile is None or profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Age/life-stage gates — not counted against the daily chip limit.
    age = compute_age(profile.birth_date_local)
    q_lower = payload.question.lower()

    if is_minor(profile.birth_date_local):
        # Under-18: block love/marriage topics.
        if any(k in q_lower for k in MINOR_REDIRECT_KEYWORDS):
            return _minor_redirect_response(payload.question)
        # Under-18: block career/job topics.
        if any(k in q_lower for k in CAREER_REDIRECT_KEYWORDS):
            return _minor_career_redirect_response(payload.question)
        # Under-18: block wellbeing/fertility/health-sensitive topics (P1-2, D11).
        if any(k in q_lower for k in WELLBEING_REDIRECT_KEYWORDS):
            return _minor_wellbeing_redirect_response(payload.question)

    # Under-6: additionally block study/education topics.
    if is_young_child(age):
        if any(k in q_lower for k in STUDY_REDIRECT_KEYWORDS):
            return _infant_study_redirect_response(payload.question)

    # Married users: block marriage-timing questions (harmony questions still OK).
    if is_married_settled(profile.marital_status):
        if any(k in q_lower for k in MARRIED_TIMING_REDIRECT_KEYWORDS):
            return _married_timing_redirect_response(payload.question)

    # 50+: redirect all love/marriage topics.
    if is_past_prime_marriage_age(age):
        if any(k in q_lower for k in SENIOR_MARRIAGE_REDIRECT_KEYWORDS):
            return _senior_marriage_redirect_response(payload.question)

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
