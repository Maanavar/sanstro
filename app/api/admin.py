"""Admin operations, analytics controls, and privacy tooling."""
from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select, text, update
from sqlalchemy.orm import Session

from app.core.auth import get_admin_user
from app.db.session import get_db
from app.models import (
    BirthProfile,
    Chart,
    FamilyMember,
    FamilyVault,
    Feedback,
    RelationshipAlert,
    Subscription,
    User,
    UserNotificationPreference,
)
from app.models.ask_vinaadi_usage import AskVinaadiUsage
from app.models.family_daily_score import FamilyDailyScore
from app.services.audit_service import log_admin_action
from app.services.feature_flags import all_flags, get_flag, reset_flag, set_flag
from app.services.job_registry import get_all_jobs, get_job
from app.services.peyarchi_alert_service import daily_peyarchi_refresh
from app.services.push_service import send_push_to_token

router = APIRouter(prefix="/admin", tags=["admin"])


class DataDeletionResult(BaseModel):
    owner_user_id: str
    deleted_at: str
    birth_profiles_deleted: int
    charts_deleted: int
    family_vaults_deleted: int
    family_members_deleted: int
    family_daily_scores_deleted: int


class AdminStats(BaseModel):
    total_users: int
    total_birth_profiles: int
    total_charts: int
    total_family_vaults: int
    total_family_members: int
    as_of: str


class PeyarchiRefreshResult(BaseModel):
    charts_refreshed: int
    notifications_marked: int
    run_at_utc: str


class UserSummary(BaseModel):
    user_id: str
    email: str | None
    user_mode: str
    is_suspended: bool
    suspension_reason: str | None
    birth_profile_count: int
    chart_count: int
    created_at: str


class UserListResponse(BaseModel):
    total: int
    items: list[UserSummary]
    page: int
    page_size: int


class UserDetail(UserSummary):
    family_vault_count: int
    family_member_count: int
    feedback_count: int
    ask_vinaadi_usage_today: int
    subscription_tier: str | None
    subscription_status: str | None


class SuspendRequest(BaseModel):
    suspend: bool
    reason: str | None = None


class JobInfo(BaseModel):
    job_id: str
    label: str
    description: str


class JobRunResult(BaseModel):
    job_id: str
    started_at: str
    finished_at: str
    result_summary: str | None


class AuditLogEntry(BaseModel):
    id: str
    action: str
    target_type: str | None
    target_id: str | None
    payload_summary: str | None
    ip_address: str | None
    created_at: str


class AuditLogResponse(BaseModel):
    total: int
    items: list[AuditLogEntry]


class BroadcastRequest(BaseModel):
    title: str
    body: str
    target_user_id: str | None = None


class BroadcastResult(BaseModel):
    sent: int
    skipped: int
    target: str
    sent_at: str


class FlagEntry(BaseModel):
    name: str
    value: Any
    default: Any
    overridden: bool


class FlagUpdate(BaseModel):
    value: Any


class ComponentHealth(BaseModel):
    name: str
    status: str
    detail: str | None


class HealthDetailResponse(BaseModel):
    overall: str
    components: list[ComponentHealth]
    checked_at: str


def _assert_admin_delete_enabled() -> None:
    if not bool(get_flag("enable_admin_data_delete")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin data deletion is disabled. Enable the feature flag or environment setting first.",
        )


def _count(model: object, session: Session) -> int:
    return int(session.execute(select(func.count()).select_from(model)).scalar_one())


@router.delete(
    "/users/{owner_user_id}/data",
    response_model=DataDeletionResult,
    status_code=status.HTTP_200_OK,
    summary="Delete all data for a user (GDPR erasure)",
)
def delete_user_data(
    owner_user_id: UUID,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> DataDeletionResult:
    _assert_admin_delete_enabled()

    user = session.get(User, owner_user_id)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User '{owner_user_id}' not found.")

    vault_ids = [
        row[0]
        for row in session.execute(
            select(FamilyVault.family_vault_id).where(FamilyVault.owner_user_id == owner_user_id)
        ).all()
    ]
    fds_deleted = 0
    for vault_id in vault_ids:
        alerts = session.execute(
            select(RelationshipAlert).where(RelationshipAlert.vault_id == vault_id)
        ).scalars().all()
        for alert in alerts:
            session.delete(alert)
        rows = session.execute(
            select(FamilyDailyScore).where(FamilyDailyScore.family_vault_id == vault_id)
        ).scalars().all()
        for row in rows:
            session.delete(row)
        fds_deleted += len(rows)

    members = session.execute(
        select(FamilyMember).where(FamilyMember.owner_user_id == owner_user_id)
    ).scalars().all()
    member_ids = [member.family_member_id for member in members]
    if member_ids:
        session.execute(
            update(BirthProfile)
            .where(BirthProfile.family_member_id.in_(member_ids))
            .values(family_member_id=None)
        )
    for member in members:
        session.delete(member)

    vaults = session.execute(
        select(FamilyVault).where(FamilyVault.owner_user_id == owner_user_id)
    ).scalars().all()
    for vault in vaults:
        session.delete(vault)

    profile_ids = [
        row[0]
        for row in session.execute(
            select(BirthProfile.birth_profile_id).where(BirthProfile.owner_user_id == owner_user_id)
        ).all()
    ]
    charts_deleted = 0
    for profile_id in profile_ids:
        charts = session.execute(select(Chart).where(Chart.birth_profile_id == profile_id)).scalars().all()
        for chart in charts:
            session.delete(chart)
        charts_deleted += len(charts)

    profiles = session.execute(
        select(BirthProfile).where(BirthProfile.owner_user_id == owner_user_id)
    ).scalars().all()
    for profile in profiles:
        session.delete(profile)

    session.commit()
    log_admin_action(
        "delete_user_data",
        target_type="user",
        target_id=str(owner_user_id),
        payload_summary=f"profiles={len(profiles)},charts={charts_deleted}",
    )
    return DataDeletionResult(
        owner_user_id=str(owner_user_id),
        deleted_at=datetime.now(UTC).isoformat(),
        birth_profiles_deleted=len(profiles),
        charts_deleted=charts_deleted,
        family_vaults_deleted=len(vaults),
        family_members_deleted=len(members),
        family_daily_scores_deleted=fds_deleted,
    )


@router.get("/stats", response_model=AdminStats, summary="Aggregate record counts for admin dashboard")
def get_admin_stats(session: Session = Depends(get_db), _: User = Depends(get_admin_user)) -> AdminStats:
    return AdminStats(
        total_users=_count(User, session),
        total_birth_profiles=_count(BirthProfile, session),
        total_charts=_count(Chart, session),
        total_family_vaults=_count(FamilyVault, session),
        total_family_members=_count(FamilyMember, session),
        as_of=datetime.now(UTC).isoformat(),
    )


@router.post(
    "/run-peyarchi-refresh",
    response_model=PeyarchiRefreshResult,
    summary="Run peyarchi alert refresh and notification marking now",
)
def run_peyarchi_refresh_now(_: User = Depends(get_admin_user)) -> PeyarchiRefreshResult:
    run_at = datetime.now(UTC)
    result = daily_peyarchi_refresh(run_at_utc=run_at)
    log_admin_action(
        "trigger_job",
        target_type="job",
        target_id="daily_peyarchi_refresh",
        payload_summary=f"charts={result['charts_refreshed']}",
    )
    return PeyarchiRefreshResult(
        charts_refreshed=int(result["charts_refreshed"]),
        notifications_marked=int(result["notifications_marked"]),
        run_at_utc=run_at.isoformat(),
    )


@router.get("/users", response_model=UserListResponse, summary="List all users (paginated)")
def list_users(
    page: int = 1,
    page_size: int = 50,
    search: str | None = None,
    suspended_only: bool = False,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> UserListResponse:
    page = max(1, page)
    page_size = max(1, min(page_size, 100))

    q = select(User)
    if search:
        q = q.where(User.email.ilike(f"%{search}%"))
    if suspended_only:
        q = q.where(User.is_suspended.is_(True))

    total = int(session.execute(select(func.count()).select_from(q.subquery())).scalar_one())
    users = session.execute(
        q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()

    items: list[UserSummary] = []
    for user in users:
        birth_profile_count = int(
            session.execute(
                select(func.count()).where(BirthProfile.owner_user_id == user.user_id)
            ).scalar_one()
        )
        chart_count = int(
            session.execute(
                select(func.count(Chart.chart_id))
                .join(BirthProfile, Chart.birth_profile_id == BirthProfile.birth_profile_id)
                .where(BirthProfile.owner_user_id == user.user_id)
            ).scalar_one()
        )
        items.append(
            UserSummary(
                user_id=str(user.user_id),
                email=user.email,
                user_mode=user.user_mode,
                is_suspended=user.is_suspended,
                suspension_reason=user.suspension_reason,
                birth_profile_count=birth_profile_count,
                chart_count=chart_count,
                created_at=user.created_at.isoformat() if user.created_at else "",
            )
        )

    return UserListResponse(total=total, items=items, page=page, page_size=page_size)


@router.get("/users/{user_id}", response_model=UserDetail, summary="Get full detail for one user")
def get_user_detail(
    user_id: UUID,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> UserDetail:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    birth_profile_count = int(
        session.execute(select(func.count()).where(BirthProfile.owner_user_id == user_id)).scalar_one()
    )
    chart_count = int(
        session.execute(
            select(func.count(Chart.chart_id))
            .join(BirthProfile, Chart.birth_profile_id == BirthProfile.birth_profile_id)
            .where(BirthProfile.owner_user_id == user_id)
        ).scalar_one()
    )
    family_vault_count = int(
        session.execute(select(func.count()).where(FamilyVault.owner_user_id == user_id)).scalar_one()
    )
    family_member_count = int(
        session.execute(select(func.count()).where(FamilyMember.owner_user_id == user_id)).scalar_one()
    )
    feedback_count = int(session.execute(select(func.count()).where(Feedback.user_id == user_id)).scalar_one())
    ask_vinaadi_usage_today = int(
        session.execute(
            select(func.coalesce(func.sum(AskVinaadiUsage.chip_count), 0)).where(
                AskVinaadiUsage.user_id == user_id,
                AskVinaadiUsage.usage_date == date.today(),
            )
        ).scalar_one()
    )
    subscription = session.execute(
        select(Subscription).where(Subscription.user_id == user_id).order_by(Subscription.created_at.desc())
    ).scalars().first()

    return UserDetail(
        user_id=str(user.user_id),
        email=user.email,
        user_mode=user.user_mode,
        is_suspended=user.is_suspended,
        suspension_reason=user.suspension_reason,
        birth_profile_count=birth_profile_count,
        chart_count=chart_count,
        family_vault_count=family_vault_count,
        family_member_count=family_member_count,
        feedback_count=feedback_count,
        ask_vinaadi_usage_today=ask_vinaadi_usage_today,
        subscription_tier=subscription.tier if subscription else None,
        subscription_status=subscription.status if subscription else None,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )


@router.patch("/users/{user_id}/suspend", summary="Suspend or unsuspend a user account")
def suspend_user(
    user_id: UUID,
    body: SuspendRequest,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> dict[str, Any]:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_suspended = body.suspend
    user.suspension_reason = body.reason if body.suspend else None
    session.commit()
    log_admin_action(
        "suspend_user" if body.suspend else "reinstate_user",
        target_type="user",
        target_id=str(user_id),
        payload_summary=body.reason,
    )
    return {
        "user_id": str(user_id),
        "is_suspended": user.is_suspended,
        "suspension_reason": user.suspension_reason,
    }


@router.get("/jobs", response_model=list[JobInfo], summary="List all registered background jobs")
def list_jobs(_: User = Depends(get_admin_user)) -> list[JobInfo]:
    return [JobInfo(**{k: v for k, v in job.items() if k != "fn"}) for job in get_all_jobs()]


@router.post("/jobs/{job_id}/trigger", response_model=JobRunResult, summary="Manually trigger a background job")
def trigger_job(job_id: str, _: User = Depends(get_admin_user)) -> JobRunResult:
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not registered.")

    started = datetime.now(UTC)
    summary: str | None = None
    try:
        result = job["fn"]()
        if isinstance(result, dict):
            summary = ", ".join(f"{key}={value}" for key, value in result.items())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Job failed: {exc}") from exc

    log_admin_action("trigger_job", target_type="job", target_id=job_id, payload_summary=summary)
    return JobRunResult(
        job_id=job_id,
        started_at=started.isoformat(),
        finished_at=datetime.now(UTC).isoformat(),
        result_summary=summary,
    )


@router.get("/audit-log", response_model=AuditLogResponse, summary="List admin audit log entries")
def get_audit_log(
    page: int = 1,
    page_size: int = 100,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> AuditLogResponse:
    from app.models.admin_audit_log import AdminAuditLog

    page = max(1, page)
    page_size = max(1, min(page_size, 200))
    total = int(session.execute(select(func.count()).select_from(AdminAuditLog)).scalar_one())
    rows = session.execute(
        select(AdminAuditLog)
        .order_by(AdminAuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    return AuditLogResponse(
        total=total,
        items=[
            AuditLogEntry(
                id=str(row.id),
                action=row.action,
                target_type=row.target_type,
                target_id=row.target_id,
                payload_summary=row.payload_summary,
                ip_address=row.ip_address,
                created_at=row.created_at.isoformat(),
            )
            for row in rows
        ],
    )


@router.post("/notify/broadcast", response_model=BroadcastResult, summary="Send push notification to users")
def broadcast_notification(
    body: BroadcastRequest,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> BroadcastResult:
    if body.target_user_id:
        try:
            target_uuid = UUID(body.target_user_id)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="target_user_id must be a valid UUID.") from exc
        prefs = session.execute(
            select(UserNotificationPreference).where(UserNotificationPreference.owner_user_id == target_uuid)
        ).scalars().all()
    else:
        prefs = session.execute(select(UserNotificationPreference)).scalars().all()

    if not bool(get_flag("enable_push_notifications")):
        target_label = body.target_user_id or "all users"
        log_admin_action(
            "broadcast_notification",
            target_type="segment",
            target_id=target_label,
            payload_summary="push_disabled",
        )
        return BroadcastResult(
            sent=0,
            skipped=len(prefs),
            target=target_label,
            sent_at=datetime.now(UTC).isoformat(),
        )

    sent = 0
    skipped = 0
    for pref in prefs:
        token = pref.fcm_device_token
        if not token:
            skipped += 1
            continue
        try:
            if send_push_to_token(token, title=body.title, message=body.body):
                sent += 1
            else:
                skipped += 1
        except Exception:  # noqa: BLE001
            skipped += 1

    target_label = body.target_user_id or "all users"
    log_admin_action(
        "broadcast_notification",
        target_type="segment",
        target_id=target_label,
        payload_summary=f"title={body.title!r}, sent={sent}",
    )
    return BroadcastResult(
        sent=sent,
        skipped=skipped,
        target=target_label,
        sent_at=datetime.now(UTC).isoformat(),
    )


@router.get("/flags", response_model=list[FlagEntry], summary="List all feature flags with current values")
def list_flags(_: User = Depends(get_admin_user)) -> list[FlagEntry]:
    return [FlagEntry(**flag) for flag in all_flags().values()]


@router.patch("/flags/{flag_name}", response_model=FlagEntry, summary="Set a feature flag value")
def set_flag_value(
    flag_name: str,
    body: FlagUpdate,
    _: User = Depends(get_admin_user),
) -> FlagEntry:
    try:
        set_flag(flag_name, body.value)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    log_admin_action("set_flag", target_type="flag", target_id=flag_name, payload_summary=f"value={body.value!r}")
    return FlagEntry(**all_flags()[flag_name])


@router.delete("/flags/{flag_name}/reset", summary="Reset a feature flag to its default value")
def reset_flag_value(flag_name: str, _: User = Depends(get_admin_user)) -> dict[str, Any]:
    if flag_name not in all_flags():
        raise HTTPException(status_code=404, detail=f"Unknown flag: {flag_name}")
    reset_flag(flag_name)
    log_admin_action("reset_flag", target_type="flag", target_id=flag_name)
    return {"flag_name": flag_name, "reset": True, "current_value": all_flags()[flag_name]["value"]}


@router.get("/health/detail", response_model=HealthDetailResponse, summary="Detailed system health for admin")
def get_health_detail(
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> HealthDetailResponse:
    components: list[ComponentHealth] = []

    try:
        session.execute(text("SELECT 1"))
        components.append(ComponentHealth(name="database", status="ok", detail="Connection successful"))
    except Exception as exc:  # noqa: BLE001
        components.append(ComponentHealth(name="database", status="error", detail=str(exc)))

    try:
        user_count = session.execute(select(func.count()).select_from(User)).scalar_one()
        components.append(ComponentHealth(name="db_users", status="ok", detail=f"{user_count} users"))
    except Exception as exc:  # noqa: BLE001
        components.append(ComponentHealth(name="db_users", status="error", detail=str(exc)))

    try:
        advisory_lock_count = int(
            session.execute(
                text("SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND granted=true")
            ).scalar_one()
        )
        components.append(
            ComponentHealth(
                name="scheduler_lock",
                status="ok" if advisory_lock_count > 0 else "warning",
                detail=(
                    f"{advisory_lock_count} advisory lock(s) held"
                    if advisory_lock_count > 0
                    else "No scheduler lock held - jobs may not be running"
                ),
            )
        )
    except Exception:  # noqa: BLE001
        components.append(
            ComponentHealth(
                name="scheduler_lock",
                status="warning",
                detail="Could not check lock (non-PostgreSQL DB)",
            )
        )

    from app.core.config import get_settings

    settings = get_settings()
    if not settings.admin_api_key:
        components.append(ComponentHealth(name="secrets", status="error", detail="Admin key is not configured"))
    else:
        components.append(ComponentHealth(name="secrets", status="ok", detail="Secrets appear configured"))

    overall = "ok"
    if any(component.status == "error" for component in components):
        overall = "error"
    elif any(component.status == "warning" for component in components):
        overall = "warning"

    return HealthDetailResponse(
        overall=overall,
        components=components,
        checked_at=datetime.now(UTC).isoformat(),
    )
