"""Sprint 10 — in-app feedback collection endpoint."""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

logger = logging.getLogger("jothidam.feedback")

router = APIRouter(prefix="/feedback", tags=["feedback"])

# In-process store for beta. Replace with DB persistence in production.
_feedback_log: list[dict] = []


class FeedbackPayload(BaseModel):
    owner_user_id: str | None = None
    category: Literal["bug", "calculation", "suggestion", "other"] = "other"
    rating: int | None = Field(default=None, ge=1, le=5)
    message: str = Field(..., min_length=1, max_length=2000)
    page_context: str | None = None  # which tab/view the user was on


class FeedbackResponse(BaseModel):
    received: bool
    submitted_at: str


class FeedbackListResponse(BaseModel):
    total: int
    items: list[dict]


@router.post(
    "",
    response_model=FeedbackResponse,
    summary="Submit in-app feedback",
)
def submit_feedback(payload: FeedbackPayload) -> FeedbackResponse:
    """Accept a feedback submission from the frontend.

    Logs it as a structured JSON entry and appends to the in-process store.
    In production this should write to the database or a dedicated log sink.
    """
    now = datetime.now(UTC).isoformat()
    record = {
        "submitted_at": now,
        "category": payload.category,
        "rating": payload.rating,
        "message": payload.message,
        "page_context": payload.page_context,
        "owner_user_id": payload.owner_user_id,
    }
    _feedback_log.append(record)
    logger.info(
        "feedback_received",
        extra=record,
    )
    return FeedbackResponse(received=True, submitted_at=now)


@router.get(
    "",
    response_model=FeedbackListResponse,
    summary="List all received feedback (admin only)",
)
def list_feedback() -> FeedbackListResponse:
    """Return all feedback collected since last server restart.

    Protect this endpoint with admin auth before exposing publicly.
    """
    return FeedbackListResponse(total=len(_feedback_log), items=list(reversed(_feedback_log)))
