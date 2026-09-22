from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.age_gate import is_minor
from app.core.auth import get_current_user
from app.core.life_mode import ALL_LIFE_MODES, effective_life_mode, focus_mapping, is_focus_nudge_due
from app.db.session import get_db
from app.models.life_focus_event import LifeFocusEvent
from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.settings import JournalSettingsResponse, JournalSettingsUpdateRequest
from app.services.life_focus_service import self_birth_profile, user_blocked_modes
from app.services.settings_service import get_journal_settings, update_journal_settings

router = APIRouter()


def _user_is_minor(session: Session, user_id) -> bool:
    profile = self_birth_profile(session, user_id)
    return profile is not None and is_minor(profile.birth_date_local)


def _user_blocked_modes(session: Session, user_id) -> frozenset[str]:
    return user_blocked_modes(session, user_id)


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
    lang = getattr(pref, "dashboard_lang", "en") if pref else "en"
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
    # Server-computed so web and mobile share one cadence (LIFE_MODE_STALE_DAYS).
    focus_nudge_due: bool = Field(default=False, alias="focusNudgeDue")
    # The D1 table's answer for this focus, so clients never re-derive it.
    focus_area: str | None = Field(default=None, alias="focusArea")
    focus_activities: list[str] = Field(default_factory=list, alias="focusActivities")
    model_config = ConfigDict(populate_by_name=True)


def _life_mode_response(pref: UserPreference | None, blocked: frozenset[str]) -> LifeModeResponse:
    show_picker = pref.show_life_mode_picker if pref else True
    set_at = pref.life_mode_set_at if pref else None
    mode = effective_life_mode(pref.life_mode if pref else None, blocked)
    mapping = focus_mapping(mode)
    return LifeModeResponse(
        mode=mode,
        focusArea=mapping.area,
        focusActivities=list(mapping.activities),
        lifeModeSetAt=set_at,
        showLifeModePicker=show_picker,
        blockedModes=sorted(blocked),
        focusNudgeDue=is_focus_nudge_due(show_picker=show_picker, set_at=set_at),
    )


class LifeModeUpdateRequest(BaseModel):
    mode: str
    # Optional on the wire for old clients; every current surface sends it.
    intent: Literal["SELECT", "SKIP", "KEEP"] = "SELECT"
    model_config = ConfigDict(populate_by_name=True)


@router.get("/settings/life-mode", response_model=LifeModeResponse, tags=["settings"])
def get_life_mode(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LifeModeResponse:
    pref = session.query(UserPreference).filter_by(owner_user_id=current_user.user_id).first()
    blocked = _user_blocked_modes(session, current_user.user_id)
    return _life_mode_response(pref, blocked)


@router.patch("/settings/life-mode", response_model=LifeModeResponse, tags=["settings"])
def update_life_mode(
    payload: LifeModeUpdateRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LifeModeResponse:
    mode = payload.mode.strip().upper()
    if mode not in ALL_LIFE_MODES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Unknown life mode: {payload.mode}",
        )

    blocked = _user_blocked_modes(session, current_user.user_id)
    if mode in blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"The '{mode}' focus is not available for your profile.",
        )

    existing_pref = session.query(UserPreference).filter_by(owner_user_id=current_user.user_id).first()
    is_first_run = existing_pref is None or existing_pref.show_life_mode_picker
    previous_mode = existing_pref.life_mode if existing_pref else "BALANCED"

    if payload.intent == "SKIP" and (not is_first_run or mode != "BALANCED"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="SKIP is valid only for BALANCED on the first-run picker.",
        )

    pref = existing_pref or _get_or_create_preference(session, current_user.user_id)
    pref.life_mode = mode
    pref.life_mode_set_at = datetime.now(tz=UTC)
    pref.show_life_mode_picker = False
    # Write-through (plan Phase 1): keep the legacy column in step for old
    # clients reading /auth/me. Backend readers derive it via
    # life_focus_service.resolve_goal_track, which also honours D5.
    # Loaded here rather than mutating current_user, which need not belong to
    # this session.
    user_row = session.get(User, current_user.user_id)
    if user_row is not None:
        user_row.goal_track = focus_mapping(mode).goal_track
    session.add(
        LifeFocusEvent(
            user_id=current_user.user_id,
            intent=payload.intent,
            previous_mode=previous_mode,
            new_mode=mode,
            is_first_run=is_first_run,
        )
    )
    session.flush()
    session.refresh(pref)
    return _life_mode_response(pref, blocked)


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
