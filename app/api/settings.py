from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.settings import JournalSettingsResponse, JournalSettingsUpdateRequest
from app.services.settings_service import get_journal_settings, update_journal_settings

router = APIRouter()


# ── UI preferences (lang, dashboard_mode) ─────────────────────────────────────

class UiPrefsResponse(BaseModel):
    lang: str
    dashboard_mode: str | None = None


class UiPrefsUpdateRequest(BaseModel):
    lang: str | None = None
    dashboard_mode: str | None = None


@router.get("/settings/ui", response_model=UiPrefsResponse, tags=["settings"])
def get_ui_preferences(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UiPrefsResponse:
    pref = session.query(UserPreference).filter_by(owner_user_id=current_user.user_id).first()
    lang = getattr(pref, "dashboard_lang", "ta") if pref else "ta"
    return UiPrefsResponse(lang=lang, dashboard_mode=current_user.user_mode)


@router.patch("/settings/ui", response_model=UiPrefsResponse, tags=["settings"])
def update_ui_preferences(
    payload: UiPrefsUpdateRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UiPrefsResponse:
    pref = session.query(UserPreference).filter_by(owner_user_id=current_user.user_id).first()
    if pref is None:
        from uuid import uuid4
        pref = UserPreference(preference_id=uuid4(), owner_user_id=current_user.user_id)
        session.add(pref)
    if payload.lang is not None and payload.lang in ("ta", "en"):
        pref.dashboard_lang = payload.lang
    if payload.dashboard_mode is not None and payload.dashboard_mode in ("BEGINNER", "BALANCED", "TRADITIONAL"):
        current_user.user_mode = payload.dashboard_mode
    session.flush()
    session.refresh(pref)
    return UiPrefsResponse(lang=pref.dashboard_lang, dashboard_mode=current_user.user_mode)


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
