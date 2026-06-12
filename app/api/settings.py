from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.age_gate import is_minor
from app.core.auth import get_current_user
from app.core.life_mode import ALL_LIFE_MODES, MINOR_BLOCKED_MODES
from app.db.session import get_db
from app.models.birth_profile import BirthProfile
from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.settings import JournalSettingsResponse, JournalSettingsUpdateRequest
from app.services.settings_service import get_journal_settings, update_journal_settings

router = APIRouter()


def _self_birth_profile(session: Session, user_id) -> BirthProfile | None:
    """The user's own birth profile (not a family member) — used for age gating."""
    return (
        session.query(BirthProfile)
        .filter(
            BirthProfile.owner_user_id == user_id,
            BirthProfile.family_member_id.is_(None),
            BirthProfile.deleted_at.is_(None),
        )
        .order_by(BirthProfile.created_at.asc())
        .first()
    )


def _user_is_minor(session: Session, user_id) -> bool:
    profile = _self_birth_profile(session, user_id)
    return profile is not None and is_minor(profile.birth_date_local)


def _get_or_create_preference(session: Session, user_id) -> UserPreference:
    pref = session.query(UserPreference).filter_by(owner_user_id=user_id).first()
    if pref is None:
        pref = UserPreference(preference_id=uuid4(), owner_user_id=user_id)
        session.add(pref)
        session.flush()
    return pref


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


# ── Life Mode (Feature 2) ─────────────────────────────────────────────────────

class LifeModeResponse(BaseModel):
    mode: str
    life_mode_set_at: datetime | None = Field(default=None, alias="lifeModeSetAt")
    show_life_mode_picker: bool = Field(alias="showLifeModePicker")
    blocked_modes: list[str] = Field(default_factory=list, alias="blockedModes")
    model_config = ConfigDict(populate_by_name=True)


class LifeModeUpdateRequest(BaseModel):
    mode: str
    model_config = ConfigDict(populate_by_name=True)


@router.get("/settings/life-mode", response_model=LifeModeResponse, tags=["settings"])
def get_life_mode(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LifeModeResponse:
    pref = session.query(UserPreference).filter_by(owner_user_id=current_user.user_id).first()
    minor = _user_is_minor(session, current_user.user_id)
    return LifeModeResponse(
        mode=getattr(pref, "life_mode", "BALANCED") if pref else "BALANCED",
        lifeModeSetAt=getattr(pref, "life_mode_set_at", None) if pref else None,
        showLifeModePicker=getattr(pref, "show_life_mode_picker", True) if pref else True,
        blockedModes=sorted(MINOR_BLOCKED_MODES) if minor else [],
    )


@router.patch("/settings/life-mode", response_model=LifeModeResponse, tags=["settings"])
def update_life_mode(
    payload: LifeModeUpdateRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LifeModeResponse:
    mode = payload.mode.strip().upper()
    if mode not in ALL_LIFE_MODES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown life mode: {payload.mode}",
        )

    # Feature 5 — minors may never select LOVE or MARRIAGE (safety, not bypassable).
    minor = _user_is_minor(session, current_user.user_id)
    if minor and mode in MINOR_BLOCKED_MODES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This focus is not available for users under 18.",
        )

    pref = _get_or_create_preference(session, current_user.user_id)
    pref.life_mode = mode
    pref.life_mode_set_at = datetime.now(tz=UTC)
    pref.show_life_mode_picker = False
    session.flush()
    session.refresh(pref)
    return LifeModeResponse(
        mode=pref.life_mode,
        lifeModeSetAt=pref.life_mode_set_at,
        showLifeModePicker=pref.show_life_mode_picker,
        blockedModes=sorted(MINOR_BLOCKED_MODES) if minor else [],
    )


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
