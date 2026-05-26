from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.user import User
from app.schemas.journal import (
    FamilyVaultJournalResponse,
    FamilyVaultJournalSummaryResponse,
    JournalCreateRequest,
    JournalCreateResponse,
    JournalDeleteResponse,
    JournalExportResponse,
    JournalListResponse,
    JournalPromptsResponse,
    JournalRetentionApplyRequest,
    JournalRetentionApplyResponse,
    JournalUpdateRequest,
    VALID_LIFE_AREAS,
    VALID_SCORE_LABELS,
)
from app.services.daily_guidance_service import get_daily_guidance
from app.services.journal_service import (
    apply_journal_retention_window,
    archive_journal_entry,
    build_journal_prompts,
    create_journal_entry,
    export_journal_entries,
    list_family_vault_journal_entries,
    list_family_vault_journal_summary,
    list_journal_entries,
    update_journal_entry,
)
from app.services.settings_service import get_or_create_user_preference

router = APIRouter()


def _assert_chart_owner(session: Session, chart_id: UUID, current_user: User) -> None:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=404, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied.")


@router.post("/journal", response_model=JournalCreateResponse, tags=["journal"])
def create_journal(
    payload: JournalCreateRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JournalCreateResponse:
    return create_journal_entry(
        session,
        current_user.user_id,
        chart_id=payload.chart_id,
        entry_date=payload.entry_date,
        life_area=payload.life_area,
        note_text=payload.note_text,
    )


@router.get("/journal", response_model=JournalListResponse, tags=["journal"])
def list_journal(
    chart_id: UUID = Query(alias="chartId"),
    life_area: str | None = Query(default=None, alias="lifeArea"),
    start_date: date | None = Query(default=None, alias="startDate"),
    end_date: date | None = Query(default=None, alias="endDate"),
    include_archived: bool = Query(default=False, alias="includeArchived"),
    limit: int = Query(default=50, ge=1, le=200),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JournalListResponse:
    if life_area is not None and life_area not in VALID_LIFE_AREAS:
        raise HTTPException(status_code=422, detail=f"lifeArea must be one of: {sorted(VALID_LIFE_AREAS)}")
    return list_journal_entries(
        session,
        current_user.user_id,
        chart_id=chart_id,
        life_area=life_area,
        start_date=start_date,
        end_date=end_date,
        include_archived=include_archived,
        limit=limit,
    )


@router.patch("/journal/{journal_id}", response_model=JournalCreateResponse, tags=["journal"])
def update_journal(
    journal_id: UUID,
    payload: JournalUpdateRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JournalCreateResponse:
    return update_journal_entry(
        session,
        current_user.user_id,
        journal_id=journal_id,
        entry_date=payload.entry_date,
        life_area=payload.life_area,
        note_text=payload.note_text,
    )


@router.delete("/journal/{journal_id}", response_model=JournalDeleteResponse, tags=["journal"])
def archive_journal(
    journal_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JournalDeleteResponse:
    return archive_journal_entry(session, current_user.user_id, journal_id=journal_id)


@router.post("/journal/retention/apply", response_model=JournalRetentionApplyResponse, tags=["journal"])
def apply_journal_retention(
    payload: JournalRetentionApplyRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JournalRetentionApplyResponse:
    effective_as_of = payload.as_of_date or datetime.now(tz=UTC).date()
    preference = get_or_create_user_preference(session, current_user.user_id)
    effective_keep_days = payload.keep_days or preference.journal_retention_days
    return apply_journal_retention_window(
        session,
        current_user.user_id,
        chart_id=payload.chart_id,
        keep_days=effective_keep_days,
        as_of_date=effective_as_of,
        dry_run=payload.dry_run,
    )


@router.get("/journal/prompts", response_model=JournalPromptsResponse, tags=["journal"])
def get_prompts_for_journal(
    chart_id: UUID = Query(alias="chartId"),
    on_date: date = Query(alias="date"),
    life_area: str | None = Query(default=None, alias="lifeArea"),
    score_label: str | None = Query(default=None, alias="scoreLabel"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JournalPromptsResponse:
    _assert_chart_owner(session, chart_id, current_user)

    guidance = get_daily_guidance(session, chart_id, on_date, "ta-en")
    resolved_life_area = life_area
    if resolved_life_area is None:
        insight = guidance.data.journal_insight
        resolved_life_area = insight.dominant_life_area if insight is not None else "general"
    if resolved_life_area not in VALID_LIFE_AREAS:
        raise HTTPException(status_code=422, detail=f"lifeArea must be one of: {sorted(VALID_LIFE_AREAS)}")

    resolved_score_label = score_label or guidance.data.label
    if resolved_score_label not in VALID_SCORE_LABELS:
        raise HTTPException(status_code=422, detail=f"scoreLabel must be one of: {sorted(VALID_SCORE_LABELS)}")

    return build_journal_prompts(
        chart_id=chart_id,
        on_date=on_date,
        life_area=resolved_life_area,
        score_label=resolved_score_label,
    )


@router.get("/journal/export", response_model=JournalExportResponse, tags=["journal"])
def export_journal(
    chart_id: UUID | None = Query(default=None, alias="chartId"),
    from_date: date | None = Query(default=None, alias="fromDate"),
    to_date: date | None = Query(default=None, alias="toDate"),
    include_archived: bool = Query(default=True, alias="includeArchived"),
    limit: int = Query(default=500, ge=1, le=5000),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JournalExportResponse:
    return export_journal_entries(
        session,
        current_user.user_id,
        chart_id=chart_id,
        from_date=from_date,
        to_date=to_date,
        include_archived=include_archived,
        limit=limit,
    )


@router.get("/family-vaults/{family_vault_id}/journal", response_model=FamilyVaultJournalResponse, tags=["journal"])
def list_family_vault_journal(
    family_vault_id: UUID,
    family_member_id: UUID | None = Query(default=None, alias="familyMemberId"),
    include_archived: bool = Query(default=False, alias="includeArchived"),
    limit: int = Query(default=200, ge=1, le=2000),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyVaultJournalResponse:
    return list_family_vault_journal_entries(
        session,
        current_user.user_id,
        family_vault_id=family_vault_id,
        family_member_id=family_member_id,
        include_archived=include_archived,
        limit=limit,
    )


@router.get(
    "/family-vaults/{family_vault_id}/journal/summary",
    response_model=FamilyVaultJournalSummaryResponse,
    tags=["journal"],
)
def get_family_vault_journal_summary(
    family_vault_id: UUID,
    from_date: date | None = Query(default=None, alias="fromDate"),
    to_date: date | None = Query(default=None, alias="toDate"),
    include_archived: bool = Query(default=False, alias="includeArchived"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyVaultJournalSummaryResponse:
    return list_family_vault_journal_summary(
        session,
        current_user.user_id,
        family_vault_id=family_vault_id,
        from_date=from_date,
        to_date=to_date,
        include_archived=include_archived,
    )
