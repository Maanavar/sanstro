from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.settings import JournalSettingsResponse, JournalSettingsUpdateRequest
from app.services.settings_service import get_journal_settings, update_journal_settings

router = APIRouter()


@router.get("/settings/journal", response_model=JournalSettingsResponse, tags=["settings"])
def get_user_journal_settings(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JournalSettingsResponse:
    return get_journal_settings(session, current_user.user_id)


@router.patch("/settings/journal", response_model=JournalSettingsResponse, tags=["settings"])
def update_user_journal_settings(
    payload: JournalSettingsUpdateRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JournalSettingsResponse:
    return update_journal_settings(
        session,
        current_user.user_id,
        journal_retention_days=payload.journal_retention_days,
        acknowledge_reminder=payload.acknowledge_reminder,
    )
