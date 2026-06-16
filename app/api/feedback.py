"""In-app feedback and beta review collection.

Persists submissions to the ``feedback`` table so they survive restarts — the
open beta's whole purpose is collecting reviews and bug reports, so losing them
on every deploy is not acceptable.
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_admin_user, get_current_user
from app.db.session import get_db
from app.models.feedback import Feedback
from app.models.user import User

logger = logging.getLogger("jothidam.feedback")

router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackPayload(BaseModel):
    category: Literal["bug", "calculation", "suggestion", "review", "other"] = "other"
    rating: int | None = Field(default=None, ge=1, le=5)
    message: str = Field(..., min_length=1, max_length=2000)
    page_context: str | None = Field(default=None, max_length=120)
    # The user marks this as a review we may feature/quote.
    is_review: bool = False
    # The user is open to being contacted (e.g. about the reviewer perk).
    allow_contact: bool = False


class FeedbackResponse(BaseModel):
    received: bool
    submitted_at: str


class FeedbackItem(BaseModel):
    id: str
    submitted_at: str
    category: str
    rating: int | None
    message: str
    page_context: str | None
    owner_user_id: str | None
    is_review: bool
    allow_contact: bool
    reward_qualified: bool


class FeedbackListResponse(BaseModel):
    total: int
    items: list[FeedbackItem]


class RewardToggle(BaseModel):
    reward_qualified: bool


def _to_item(row: Feedback) -> FeedbackItem:
    return FeedbackItem(
        id=str(row.id),
        submitted_at=row.created_at.isoformat() if row.created_at else "",
        category=row.category,
        rating=row.rating,
        message=row.message,
        page_context=row.page_context,
        owner_user_id=str(row.user_id) if row.user_id else None,
        is_review=row.is_review,
        allow_contact=row.allow_contact,
        reward_qualified=row.reward_qualified,
    )


@router.post("", response_model=FeedbackResponse, summary="Submit in-app feedback or a review")
def submit_feedback(
    payload: FeedbackPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FeedbackResponse:
    """Persist a feedback / review submission from the frontend."""
    row = Feedback(
        user_id=current_user.user_id,
        category=payload.category,
        rating=payload.rating,
        message=payload.message.strip(),
        page_context=payload.page_context,
        is_review=payload.is_review,
        allow_contact=payload.allow_contact,
    )
    db.add(row)
    db.commit()

    logger.info(
        "feedback_received",
        extra={
            "feedback_id": str(row.id),
            "category": row.category,
            "rating": row.rating,
            "is_review": row.is_review,
            "page_context": row.page_context,
            "owner_user_id": str(current_user.user_id),
        },
    )
    return FeedbackResponse(received=True, submitted_at=datetime.now(UTC).isoformat())


@router.get("", response_model=FeedbackListResponse, summary="List feedback (admin only)")
def list_feedback(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    limit: int = Query(default=200, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    reviews_only: bool = Query(default=False),
) -> FeedbackListResponse:
    """Return persisted feedback, newest first. Admin auth required."""
    stmt = select(Feedback).where(Feedback.deleted_at.is_(None))
    if reviews_only:
        stmt = stmt.where(Feedback.is_review.is_(True))
    rows = db.execute(
        stmt.order_by(Feedback.created_at.desc()).limit(limit).offset(offset)
    ).scalars().all()
    total = db.query(Feedback).filter(Feedback.deleted_at.is_(None)).count()
    return FeedbackListResponse(total=total, items=[_to_item(r) for r in rows])


@router.patch(
    "/{feedback_id}/reward",
    response_model=FeedbackItem,
    summary="Flag a reviewer as reward-qualified (admin only, discretionary)",
)
def set_reward_qualified(
    feedback_id: UUID,
    payload: RewardToggle,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> FeedbackItem:
    """Discretionary, admin-only toggle for the 'helpful reviewers may earn
    extended free access' perk. No automated promise is made to users — this is
    purely an internal flag for hand-picking qualifying reviewers."""
    row = db.get(Feedback, feedback_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found.")
    row.reward_qualified = payload.reward_qualified
    db.commit()
    db.refresh(row)
    return _to_item(row)
