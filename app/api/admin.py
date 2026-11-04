"""Admin operations, analytics controls, and privacy tooling."""
from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.auth import (
    admin_role_of,
    create_admin_elevation_token,
    get_admin_user,
    get_admin_user_without_mfa,
    get_elevated_admin_user,
)
from app.core.auth_throttle import AuthThrottleAction, get_auth_throttler
from app.core.clock import accounting_date
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.permissions import ROLE_PERMISSIONS, require_permission
from app.db.session import get_db
from app.middleware import resolve_client_ip
from app.models import (
    BirthProfile,
    Chart,
    FamilyMember,
    FamilyVault,
    Feedback,
    Subscription,
    User,
)
from app.models.ask_vinaadi_usage import AskVinaadiUsage
from app.models.payment import Order, Payment, PaymentMismatch, Refund
from app.models.prediction_log import PredictionLog
from app.privacy.erasure import ErasureRefused, erase_user, export_user
from app.reasoning.calibration import GradedPrediction, build_calibration_report
from app.services import admin_mfa_service, admin_roles_service
from app.services.audit_service import AuditEntry, audited
from app.services.feature_flags import (
    DoctrineFlagNotPersistable,
    FlagValueError,
    UnknownFlagError,
    all_flags,
    clear_persisted_flag,
    doctrine_runtime_override_allowed,
    flag_history,
    get_flag,
    persist_flag,
    reset_flag,
    rollback_change,
    set_flag,
)
from app.services.job_registry import get_all_jobs, get_job
from app.services.job_run_service import (
    TRIGGER_MANUAL,
    last_run_per_job,
    recent_job_runs,
    record_job_run,
    summarise_result,
)

router = APIRouter(prefix="/admin", tags=["admin"])

_throttler = get_auth_throttler()


class ElevationRequest(BaseModel):
    #: A current TOTP code, or one unused recovery code.
    code: str


class ElevationGrant(BaseModel):
    token: str
    expires_at: str
    expires_in_seconds: int


def _client_ip(request: Request) -> str:
    return resolve_client_ip(request, max(0, int(get_settings().trusted_proxy_count)))


@router.post(
    "/elevate",
    response_model=ElevationGrant,
    summary="Re-authenticate with the second factor to authorise destructive operations",
)
def elevate_admin(
    audit: Annotated[AuditEntry, audited("admin_elevation")],
    payload: ElevationRequest,
    request: Request,
    session: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
) -> ElevationGrant:
    """Exchange a TOTP code (or a recovery code) for a short-lived elevation token.

    Holding an admin session is authority to *look*. Destructive operations —
    erasing a user's data, suspending an account, moving a feature flag —
    additionally require proof that the person at the keyboard is still the
    account holder, within the last few minutes. That is the one thing a stolen
    session, an open laptop or an XSS-driven request cannot supply.

    Was the account password (P1-4 step 2). The second factor replaces it
    (spec L3, D-15): it works for Google-sign-in admins, who have no password —
    they could never elevate before — and it is something a session thief who
    also phished the password still does not have.

    The grant is not a cookie: the caller attaches it per request, deliberately,
    which is also why a CSRF-shaped request cannot pick it up for free.
    """
    client_ip = _client_ip(request)
    _throttler.enforce(AuthThrottleAction.ADMIN_ELEVATION, ip=client_ip, account_identifier=str(admin_user.user_id))
    method = admin_mfa_service.verify_second_factor(session, admin_user, payload.code)
    if method is None:
        # Audited as a refusal, not just an auth warning: a failed elevation
        # is somebody holding a valid admin session without the second factor,
        # which is the exact shape of a session compromise.
        audit.action = "admin_elevation_denied"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="That code did not match. Use the newest code from your authenticator app.",
        )

    token, expires_at = create_admin_elevation_token(admin_user)
    audit.action = "admin_elevation_granted"
    audit.details = {"method": method, "expires_at": expires_at.isoformat()}
    return ElevationGrant(
        token=token,
        expires_at=expires_at.isoformat(),
        expires_in_seconds=get_settings().admin_elevation_minutes * 60,
    )


# ── Who am I, and two-step sign-in (spec L3, D-15) ───────────────────────────


class AdminMe(BaseModel):
    user_id: str
    email: str | None
    role: str
    mfa_enrolled: bool
    recovery_codes_remaining: int
    permissions: list[str]


class MfaEnrolment(BaseModel):
    secret: str
    otpauth_uri: str


class MfaCodeRequest(BaseModel):
    code: str


class RecoveryCodes(BaseModel):
    recovery_codes: list[str]


@router.get("/me", response_model=AdminMe, summary="The signed-in admin, their role and MFA state")
def admin_me(
    request: Request,
    session: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user_without_mfa),
) -> AdminMe:
    role = "owner" if getattr(request.state, "admin_via_key", False) else (admin_role_of(admin_user) or "")
    return AdminMe(
        user_id=str(admin_user.user_id),
        email=admin_user.email,
        role=role,
        mfa_enrolled=admin_mfa_service.is_enrolled(session, admin_user),
        recovery_codes_remaining=admin_mfa_service.remaining_recovery_codes(session, admin_user),
        permissions=sorted(ROLE_PERMISSIONS.get(role, frozenset())),
    )


@router.post("/mfa/enroll", response_model=MfaEnrolment, summary="Start two-step sign-in set-up")
def mfa_enroll(
    audit: Annotated[AuditEntry, audited("mfa_enrolment_started", target_type="user", before_mfa=True)],
    session: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user_without_mfa),
) -> MfaEnrolment:
    audit.target_id = str(admin_user.user_id)
    try:
        secret, uri = admin_mfa_service.start_enrolment(session, admin_user)
    except admin_mfa_service.MfaError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return MfaEnrolment(secret=secret, otpauth_uri=uri)


@router.post("/mfa/confirm", response_model=RecoveryCodes, summary="Finish set-up with a first code")
def mfa_confirm(
    audit: Annotated[AuditEntry, audited("mfa_enrolled", target_type="user", before_mfa=True)],
    payload: MfaCodeRequest,
    request: Request,
    session: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user_without_mfa),
) -> RecoveryCodes:
    audit.target_id = str(admin_user.user_id)
    _throttler.enforce(AuthThrottleAction.ADMIN_MFA, ip=_client_ip(request), account_identifier=str(admin_user.user_id))
    try:
        codes = admin_mfa_service.confirm_enrolment(session, admin_user, payload.code)
    except admin_mfa_service.MfaError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    return RecoveryCodes(recovery_codes=codes)


@router.post("/mfa/recovery-codes", response_model=RecoveryCodes, summary="Replace all recovery codes")
def mfa_regenerate_recovery_codes(
    audit: Annotated[AuditEntry, audited("mfa_recovery_codes_regenerated", target_type="user")],
    session: Session = Depends(get_db),
    admin_user: User = Depends(get_elevated_admin_user),
) -> RecoveryCodes:
    audit.target_id = str(admin_user.user_id)
    try:
        codes = admin_mfa_service.regenerate_recovery_codes(session, admin_user)
    except admin_mfa_service.MfaError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return RecoveryCodes(recovery_codes=codes)


# ── Roles (spec L3, D-14) ─────────────────────────────────────────────────────


class AdminRoleEntry(BaseModel):
    user_id: str
    email: str | None
    role: str
    mfa_enrolled: bool


class RoleChangeRequest(BaseModel):
    role: str
    reason: str


@router.get(
    "/roles",
    response_model=list[AdminRoleEntry],
    summary="Everyone who holds an admin role",
    dependencies=[Depends(require_permission("roles.grant"))],
)
def list_admin_roles(
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> list[AdminRoleEntry]:
    rows = session.query(User).filter((User.admin_role.is_not(None)) | (User.is_admin.is_(True))).all()
    return [
        AdminRoleEntry(
            user_id=str(row.user_id),
            email=row.email,
            role=admin_role_of(row) or "",
            mfa_enrolled=admin_mfa_service.is_enrolled(session, row),
        )
        for row in rows
    ]


@router.put(
    "/users/{user_id}/role",
    response_model=AdminRoleEntry,
    summary="Grant or change an admin role",
    dependencies=[Depends(require_permission("roles.grant"))],
)
def set_admin_role(
    audit: Annotated[AuditEntry, audited("grant_role", target_type="user", reason_required=True)],
    user_id: UUID,
    body: RoleChangeRequest,
    session: Session = Depends(get_db),
    admin_user: User = Depends(get_elevated_admin_user),
) -> AdminRoleEntry:
    audit.target_id = str(user_id)
    audit.require_reason(body.reason)
    target = session.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found.")
    try:
        previous = admin_roles_service.grant_role(session, target=target, role=body.role)
    except admin_roles_service.RoleChangeError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    audit.details = {"old_role": previous, "new_role": body.role}
    return AdminRoleEntry(
        user_id=str(target.user_id), email=target.email, role=body.role,
        mfa_enrolled=admin_mfa_service.is_enrolled(session, target),
    )


@router.delete(
    "/users/{user_id}/role",
    summary="Remove an admin role",
    dependencies=[Depends(require_permission("roles.grant"))],
)
def revoke_admin_role(
    audit: Annotated[AuditEntry, audited("revoke_role", target_type="user", reason_required=True)],
    user_id: UUID,
    reason: str = "",
    session: Session = Depends(get_db),
    admin_user: User = Depends(get_elevated_admin_user),
) -> dict[str, Any]:
    audit.target_id = str(user_id)
    audit.require_reason(reason)
    target = session.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found.")
    try:
        previous = admin_roles_service.revoke_role(session, target=target)
    except admin_roles_service.RoleChangeError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    # Removing a role ends their admin sessions now, not when the token expires.
    if previous is not None:
        target.token_version = int(target.token_version or 0) + 1
    audit.details = {"old_role": previous}
    return {"user_id": str(user_id), "previous_role": previous}


@router.delete(
    "/users/{user_id}/mfa",
    summary="Reset another admin's two-step sign-in (lost phone)",
    dependencies=[Depends(require_permission("roles.grant"))],
)
def reset_admin_mfa(
    audit: Annotated[AuditEntry, audited("reset_admin_mfa", target_type="user", reason_required=True)],
    user_id: UUID,
    reason: str = "",
    session: Session = Depends(get_db),
    admin_user: User = Depends(get_elevated_admin_user),
) -> dict[str, Any]:
    audit.target_id = str(user_id)
    audit.require_reason(reason)
    if user_id == admin_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Use a recovery code to sign in, then replace your codes. Another owner can reset yours.",
        )
    target = session.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found.")
    removed = admin_mfa_service.reset_for(session, target)
    target.token_version = int(target.token_version or 0) + 1
    audit.details = {"removed": removed}
    return {"user_id": str(user_id), "reset": removed}


class ErasureResultOut(BaseModel):
    """packages/shared/src/api/adminAudit.ts ErasureResult."""

    #: The account is gone; this id is how the audit log names it from now on.
    erasure_id: str
    erased_at: str
    #: Registry key -> rows deleted, detached or (accounting records) seen.
    tables: dict[str, int]
    #: External stores whose manual erasure step is now due (app/privacy/registry.py).
    external_followups: list[str]


class AdminStats(BaseModel):
    total_users: int
    total_birth_profiles: int
    total_charts: int
    total_family_vaults: int
    total_family_members: int
    as_of: str


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


class JobRunOut(BaseModel):
    """One row of `job_runs` (spec L10). `finished_at` is null while it runs."""

    id: str
    job_id: str
    trigger: Literal["schedule", "manual"]
    actor_email: str | None
    started_at: str
    finished_at: str | None
    outcome: Literal["running", "success", "error"]
    summary: str | None


class JobInfo(BaseModel):
    job_id: str
    label: str
    description: str
    # Surfaced so the console can mark the job before an operator runs it, rather
    # than only discovering it needs elevation from a 403.
    destructive: bool = False
    #: Newest `job_runs` row for this job, scheduled or manual. Null = never run
    #: since the table existed, which for a daily job is itself the finding.
    last_run: JobRunOut | None = None


class JobRunResult(BaseModel):
    job_id: str
    started_at: str
    finished_at: str
    result_summary: str | None
    #: The `job_runs` row this trigger wrote, so the console can link to it.
    run_id: str | None = None
    outcome: Literal["success", "error"] = "success"


class AuditLogEntry(BaseModel):
    id: str
    action: str
    actor_user_id: str | None
    actor_email: str | None
    actor_role: str | None
    target_type: str | None
    target_id: str | None
    reason: str | None
    #: success | refused | error
    outcome: str
    details: dict[str, Any] | None
    #: Free text on rows written before `details` existed.
    payload_summary: str | None
    ip_address: str | None
    user_agent: str | None
    created_at: str


class AuditLogResponse(BaseModel):
    total: int
    items: list[AuditLogEntry]


class FlagEntry(BaseModel):
    name: str
    value: Any
    default: Any
    overridden: bool
    #: default | persisted (every worker, survives restart) | process (this worker only)
    source: str
    doctrine: bool


class FlagUpdate(BaseModel):
    value: Any
    #: Why. Stored with the change; required for every persisted setting.
    reason: str = ""


class FlagChange(BaseModel):
    id: str
    name: str
    old_value: Any
    new_value: Any
    reason: str
    actor_user_id: str | None
    created_at: str


class FlagRollback(BaseModel):
    reason: str


class ComponentHealth(BaseModel):
    name: str
    status: str
    detail: str | None


class HealthDetailResponse(BaseModel):
    overall: str
    components: list[ComponentHealth]
    checked_at: str


class CalibrationBucketOut(BaseModel):
    key: str
    hit: int
    near: int
    miss: int
    n: int
    hit_rate: float | None


class CalibrationReportOut(BaseModel):
    total_logged: int
    total_open: int
    total_graded: int
    by_area_band: list[CalibrationBucketOut]
    by_dasha_lord: list[CalibrationBucketOut]
    as_of: str


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
    response_model=ErasureResultOut,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("privacy.erase"))],
    summary="Erase an account and all its personal data (DPDP erasure)",
)
def delete_user_data(
    audit: Annotated[AuditEntry, audited("delete_user_data", target_type="user", reason_required=True)],
    owner_user_id: UUID,
    reason: str = "",
    session: Session = Depends(get_db),
    admin: User = Depends(get_elevated_admin_user),
) -> ErasureResultOut:
    """Same effect as the person's own `DELETE /auth/me` (spec L5, decision 10).

    The audit row names the person by the erasure pseudonym, as every earlier
    row about them now does; per-store counts go in its details.
    """
    audit.target_id = str(owner_user_id)
    audit.require_reason(reason)
    _assert_admin_delete_enabled()
    if owner_user_id == admin.user_id:
        # The audit row would name an actor that no longer exists.
        raise HTTPException(status_code=409, detail="Erase your own account from its settings, not the console.")
    try:
        result = erase_user(session, owner_user_id, via="admin")
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=f"User '{owner_user_id}' not found.") from exc
    except ErasureRefused as exc:
        raise AppError(exc.code) from exc
    audit.target_id = result.pseudonym
    audit.details = result.audit_details()
    return ErasureResultOut(
        erasure_id=str(result.erasure_id),
        erased_at=result.erased_at.isoformat(),
        tables=result.counts,
        external_followups=result.external_followups,
    )


@router.get(
    "/users/{owner_user_id}/export",
    dependencies=[Depends(require_permission("privacy.export"))],
    summary="Export an account's personal data (DPDP access request)",
)
def export_user_data(
    audit: Annotated[AuditEntry, audited("export_user_data", target_type="user", reason_required=True)],
    owner_user_id: UUID,
    reason: str = "",
    session: Session = Depends(get_db),
    _: User = Depends(get_elevated_admin_user),
) -> dict[str, Any]:
    """A reveal of everything held on the person, so elevated and reasoned (ARC-21)."""
    audit.target_id = str(owner_user_id)
    audit.require_reason(reason)
    try:
        data = export_user(session, owner_user_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=f"User '{owner_user_id}' not found.") from exc
    audit.details = {"rows": {key: len(store["rows"]) for key, store in data["stores"].items() if store["rows"]}}
    return data


@router.get("/stats", response_model=AdminStats, summary="Aggregate record counts for admin dashboard", dependencies=[Depends(require_permission("overview.read"))])
def get_admin_stats(session: Session = Depends(get_db), _: User = Depends(get_admin_user)) -> AdminStats:
    return AdminStats(
        total_users=_count(User, session),
        total_birth_profiles=_count(BirthProfile, session),
        total_charts=_count(Chart, session),
        total_family_vaults=_count(FamilyVault, session),
        total_family_members=_count(FamilyMember, session),
        as_of=datetime.now(UTC).isoformat(),
    )


#: Razorpay's id prefixes, and the column each one resolves through.
#: Support is handed these by a customer pasting a payment confirmation or by
#: Razorpay's own dashboard, and before L9 the only way in was an email address
#: — which is exactly what someone who paid from a different address does not
#: have to hand (spec L9: "search by … Razorpay order/payment/subscription ID").
_RAZORPAY_PREFIXES = ("order_", "pay_", "sub_", "rfnd_")


def _user_search_clause(search: str, session: Session) -> tuple[str, Any]:
    """(how it matched, the WHERE clause) for one search box.

    One box, several kinds of identifier, because a support agent should not
    have to know which field a pasted string belongs to. The shape of the
    string decides:

    - a Razorpay prefix → resolve that record to its account
    - a UUID → our own user id
    - anything else → email, case-insensitive substring

    A Razorpay id that matches nothing returns no users rather than falling
    back to an email search: `pay_X` is never somebody's email address, and a
    silent fallback to "no rows" that *looks* like an email miss is how an
    agent concludes an account does not exist.
    """
    if search.startswith(_RAZORPAY_PREFIXES):
        return "provider_id", User.user_id.in_(_user_ids_for_provider_id(search, session))

    try:
        return "user_id", User.user_id == UUID(search)
    except ValueError:
        pass

    return "email", User.email.ilike(f"%{search}%")


def _user_ids_for_provider_id(provider_id: str, session: Session) -> list[UUID]:
    """Accounts behind a Razorpay order, payment, subscription or refund id.

    A payment hangs off an order or a subscription (`ck_payments_has_parent`),
    and a refund off a payment, so both are followed one hop at a time rather
    than joined — the parent may be the detached accounting record of an erased
    account (spec L5), in which case there is no account to find and that is
    the correct answer.
    """
    if provider_id.startswith("order_"):
        return [
            uid for (uid,) in session.execute(
                select(Order.user_id).where(Order.provider_order_id == provider_id)
            ).all() if uid is not None
        ]

    if provider_id.startswith("sub_"):
        return [
            uid for (uid,) in session.execute(
                select(Subscription.user_id).where(
                    Subscription.provider_subscription_id == provider_id
                )
            ).all() if uid is not None
        ]

    payment_id = provider_id
    if provider_id.startswith("rfnd_"):
        payment_id = session.execute(
            select(Refund.provider_payment_id).where(Refund.provider_refund_id == provider_id)
        ).scalar_one_or_none() or ""
        if not payment_id:
            return []

    payment = session.execute(
        select(Payment).where(Payment.provider_payment_id == payment_id)
    ).scalars().first()
    if payment is None:
        return []
    if payment.order_id is not None:
        order = session.get(Order, payment.order_id)
        return [order.user_id] if order and order.user_id else []
    if payment.subscription_id is not None:
        subscription = session.get(Subscription, payment.subscription_id)
        return [subscription.user_id] if subscription and subscription.user_id else []
    return []


@router.get("/users", response_model=UserListResponse, summary="List all users (paginated)", dependencies=[Depends(require_permission("users.search"))])
def list_users(
    audit: Annotated[AuditEntry, audited("list_users", target_type="user")],
    page: int = 1,
    page_size: int = 50,
    search: str | None = None,
    suspended_only: bool = False,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> UserListResponse:
    """A read of people's email addresses, so it is audited (spec L4). The search
    text is not stored: it is itself usually an email address."""
    page = max(1, page)
    page_size = max(1, min(page_size, 100))

    q = select(User)
    matched_by = "none"
    if search:
        matched_by, clause = _user_search_clause(search.strip(), session)
        q = q.where(clause)
    if suspended_only:
        q = q.where(User.is_suspended.is_(True))

    total = int(session.execute(select(func.count()).select_from(q.subquery())).scalar_one())
    users = session.execute(
        q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()

    user_ids = [user.user_id for user in users]
    birth_profile_counts: dict[UUID, int] = {}
    chart_counts: dict[UUID, int] = {}
    if user_ids:
        birth_profile_counts = {
            owner_user_id: int(count)
            for owner_user_id, count in session.execute(
                select(BirthProfile.owner_user_id, func.count())
                .where(BirthProfile.owner_user_id.in_(user_ids))
                .group_by(BirthProfile.owner_user_id)
            ).all()
        }
        chart_counts = {
            owner_user_id: int(count)
            for owner_user_id, count in session.execute(
                select(BirthProfile.owner_user_id, func.count(Chart.chart_id))
                .join(Chart, Chart.birth_profile_id == BirthProfile.birth_profile_id)
                .where(BirthProfile.owner_user_id.in_(user_ids))
                .group_by(BirthProfile.owner_user_id)
            ).all()
        }

    items: list[UserSummary] = []
    for user in users:
        items.append(
            UserSummary(
                user_id=str(user.user_id),
                email=user.email,
                user_mode=user.user_mode,
                is_suspended=user.is_suspended,
                suspension_reason=user.suspension_reason,
                birth_profile_count=birth_profile_counts.get(user.user_id, 0),
                chart_count=chart_counts.get(user.user_id, 0),
                created_at=user.created_at.isoformat() if user.created_at else "",
            )
        )

    audit.details = {
        "searched": bool(search),
        # *How* it matched, never what was typed: the search text is usually an
        # email address, and this row is the audit trail, not a second copy of
        # the thing being looked up.
        "matched_by": matched_by,
        "suspended_only": suspended_only,
        "page": page,
        "returned": len(items),
    }
    return UserListResponse(total=total, items=items, page=page, page_size=page_size)


@router.get("/users/{user_id}", response_model=UserDetail, summary="Get full detail for one user", dependencies=[Depends(require_permission("users.read_masked"))])
def get_user_detail(
    audit: Annotated[AuditEntry, audited("view_user", target_type="user")],
    user_id: UUID,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> UserDetail:
    audit.target_id = str(user_id)
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
                AskVinaadiUsage.usage_date == accounting_date(),
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


@router.patch("/users/{user_id}/suspend", summary="Suspend or unsuspend a user account", dependencies=[Depends(require_permission("users.suspend"))])
def suspend_user(
    audit: Annotated[AuditEntry, audited("suspend_user", target_type="user", reason_required=True)],
    user_id: UUID,
    body: SuspendRequest,
    session: Session = Depends(get_db),
    admin_user: User = Depends(get_elevated_admin_user),
) -> dict[str, Any]:
    """Both directions need a reason (ARC-21): a reinstatement undoes a decision,
    and the review asks why just as often as for the suspension."""
    audit.target_id = str(user_id)
    if not body.suspend:
        audit.action = "reinstate_user"
    reason = audit.require_reason(body.reason)
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if body.suspend:
        # Spec L3 guards: a mistaken click must not lock the operator, or the
        # last person able to undo it, out of the console.
        if user.user_id == admin_user.user_id:
            raise HTTPException(status_code=409, detail="You cannot suspend your own account.")
        if admin_role_of(user) == "owner":
            raise HTTPException(status_code=409, detail="Remove the owner role before suspending this account.")
    user.is_suspended = body.suspend
    user.suspension_reason = reason if body.suspend else None
    if body.suspend:
        # Suspension ends every live session now, not when its token expires.
        user.token_version = int(user.token_version or 0) + 1
    session.commit()
    return {
        "user_id": str(user_id),
        "is_suspended": user.is_suspended,
        "suspension_reason": user.suspension_reason,
    }


def _job_run_out(row: Any) -> JobRunOut:
    return JobRunOut(
        id=str(row.id),
        job_id=row.job_id,
        trigger=row.trigger,
        actor_email=row.actor_email,
        started_at=row.started_at.isoformat(),
        finished_at=row.finished_at.isoformat() if row.finished_at else None,
        outcome=row.outcome,
        summary=row.summary,
    )


@router.get("/jobs", response_model=list[JobInfo], summary="List all registered background jobs", dependencies=[Depends(require_permission("overview.read"))])
def list_jobs(
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> list[JobInfo]:
    last_runs = last_run_per_job(session)
    return [
        JobInfo(
            **{k: v for k, v in job.items() if k != "fn"},
            last_run=(
                _job_run_out(last_runs[job["job_id"]]) if job["job_id"] in last_runs else None
            ),
        )
        for job in get_all_jobs()
    ]


@router.get("/job-runs", response_model=list[JobRunOut], summary="Recent background job runs", dependencies=[Depends(require_permission("overview.read"))])
def list_job_runs(
    job_id: str | None = None,
    outcome: Literal["running", "success", "error"] | None = None,
    limit: int = 50,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> list[JobRunOut]:
    """History of what actually ran (spec L10), newest first.

    Read-only and on `overview.read`, the same permission as the job list: this
    is the answer to "did last night's reconciliation run", which every admin
    role that can see the overview needs.
    """
    rows = recent_job_runs(session, job_id=job_id, outcome=outcome, limit=limit)
    return [_job_run_out(row) for row in rows]


@router.post("/jobs/{job_id}/trigger", response_model=JobRunResult, summary="Manually trigger a background job", dependencies=[Depends(require_permission("jobs.trigger"))])
def trigger_job(
    audit: Annotated[AuditEntry, audited("trigger_job", target_type="job")],
    job_id: str,
    request: Request,
    reason: str = "",
    admin_user: User = Depends(get_admin_user),
    x_admin_key: str | None = Header(default=None),
) -> JobRunResult:
    audit.target_id = job_id
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not registered.")

    # A destructive job gets the same gate as the five destructive routes: admin
    # session *and* a fresh password proof. Checked here rather than as a route
    # dependency because which job this is only exists as a path parameter — but
    # it calls the real dependency function, so the X-Admin-Key browser refusal,
    # the token binding and the audit trail all still apply. Reimplementing the
    # check would be how the two drift apart. A destructive job needs a reason
    # too (spec L4), for the same path-parameter reason checked here, not
    # declared on the route.
    if job.get("destructive"):
        get_elevated_admin_user(request, admin_user, x_admin_key)
        audit.require_reason(reason)
    else:
        audit.note_reason(reason)

    # The run is recorded whichever way it ends (spec L10): the row is committed
    # before the job body starts and closed after it, in its own session, so a
    # failure leaves history rather than silence. The exception is converted
    # outside the recorder so the row carries the job's own error rather than
    # "HTTPException: 500".
    summary: str | None = None
    try:
        with record_job_run(
            job_id,
            trigger=TRIGGER_MANUAL,
            actor_user_id=admin_user.user_id,
            actor_email=admin_user.email,
        ) as run:
            started = run.started_at
            result = job["fn"]()
            summary = summarise_result(result)
            run.summary = summary
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Job failed: {exc}") from exc

    audit.details = {"destructive": bool(job.get("destructive")), "result": summary}
    return JobRunResult(
        job_id=job_id,
        started_at=started.isoformat(),
        finished_at=(run.finished_at or datetime.now(UTC)).isoformat(),
        result_summary=summary,
        run_id=str(run.run_id) if run.run_id else None,
        outcome=run.outcome,
    )


@router.get("/audit-log", response_model=AuditLogResponse, summary="List admin audit log entries", dependencies=[Depends(require_permission("audit.read"))])
def get_audit_log(
    page: int = 1,
    page_size: int = 100,
    action: str | None = None,
    actor: str | None = None,
    target_type: str | None = None,
    target_id: str | None = None,
    outcome: Literal["success", "refused", "error"] | None = None,
    since: datetime | None = None,
    until: datetime | None = None,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> AuditLogResponse:
    """Newest first. `actor` matches an admin's user id exactly, or part of their
    email; the other filters are exact; `since`/`until` bound `created_at`."""
    from app.models.admin_audit_log import AdminAuditLog

    page = max(1, page)
    page_size = max(1, min(page_size, 200))
    query = select(AdminAuditLog)
    if action:
        query = query.where(AdminAuditLog.action == action)
    if actor:
        try:
            query = query.where(AdminAuditLog.actor_user_id == UUID(actor))
        except ValueError:
            query = query.where(AdminAuditLog.actor_email.ilike(f"%{actor}%"))
    if target_type:
        query = query.where(AdminAuditLog.target_type == target_type)
    if target_id:
        query = query.where(AdminAuditLog.target_id == target_id)
    if outcome:
        query = query.where(AdminAuditLog.outcome == outcome)
    if since:
        query = query.where(AdminAuditLog.created_at >= since)
    if until:
        query = query.where(AdminAuditLog.created_at < until)
    total = int(session.execute(select(func.count()).select_from(query.subquery())).scalar_one())
    rows = session.execute(
        query.order_by(AdminAuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    return AuditLogResponse(
        total=total,
        items=[
            AuditLogEntry(
                id=str(row.id),
                action=row.action,
                actor_user_id=str(row.actor_user_id) if row.actor_user_id else None,
                actor_email=row.actor_email,
                actor_role=row.actor_role,
                target_type=row.target_type,
                target_id=row.target_id,
                reason=row.reason,
                outcome=row.outcome,
                details=row.details,
                payload_summary=row.payload_summary,
                ip_address=row.ip_address,
                user_agent=row.user_agent,
                created_at=row.created_at.isoformat(),
            )
            for row in rows
        ],
    )


@router.post(
    "/notify/broadcast",
    status_code=status.HTTP_410_GONE,
    dependencies=[Depends(require_permission("messaging.broadcast"))],
    summary="Disabled until consent-aware broadcast ships (admin spec L8, D-17)",
)
def broadcast_notification(
    audit: Annotated[AuditEntry, audited("broadcast_notification_refused", target_type="segment")],
    _: User = Depends(get_elevated_admin_user),
) -> None:
    """Gone until L+30.

    The old handler sent pushes straight to every stored device token: it
    ignored notification consent and bypassed the outbox (no idempotency, no
    retry, no record), which is ADM-02. At launch Vinaadi sends transactional
    messages and the user's own alerts only (D-17). Consent-aware broadcast —
    segment, preview, test-to-self, schedule, typed-count confirm — is rebuilt
    on the outbox at L+30. The attempt is still audited.
    """
    audit.details = {"why": "broadcast disabled until the consent-aware outbox version (L+30)"}
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail=(
            "Broadcast is disabled until the consent-aware version ships. Transactional "
            "messages and users' own alerts are unaffected."
        ),
    )


@router.get("/flags", response_model=list[FlagEntry], summary="List all feature flags with current values", dependencies=[Depends(require_permission("flags.read"))])
def list_flags(_: User = Depends(get_admin_user)) -> list[FlagEntry]:
    return [FlagEntry(**flag) for flag in all_flags().values()]


_DOCTRINE_MULTI_WORKER_DETAIL = (
    "Doctrine flags cannot be overridden at runtime with more than one worker: "
    "the change would reach one worker only and be lost on restart. Record the "
    "ruling in docs/DOCTRINE_DECISIONS_V1.2.md §16 and change the default in code."
)


@router.patch("/flags/{flag_name}", response_model=FlagEntry, summary="Set a feature flag value", dependencies=[Depends(require_permission("flags.write"))])
def set_flag_value(
    audit: Annotated[AuditEntry, audited("set_flag", target_type="flag", reason_required=True)],
    flag_name: str,
    body: FlagUpdate,
    admin_user: User = Depends(get_elevated_admin_user),
) -> FlagEntry:
    """Non-doctrine flags are stored for every worker, with history (ADM-09).

    Doctrine flags keep their old, deliberately weaker path: a process-local
    trial on a single-worker deployment. They are never persisted — a stored
    doctrine override would be a ruling made outside §16–§18.
    """
    audit.target_id = flag_name
    reason = audit.require_reason(body.reason)
    if flag_name.startswith("doctrine_"):
        if not doctrine_runtime_override_allowed():
            raise HTTPException(status_code=409, detail=_DOCTRINE_MULTI_WORKER_DETAIL)
        try:
            set_flag(flag_name, body.value)
        except UnknownFlagError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except FlagValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        audit.details = {"new_value": body.value, "scope": "process"}
    else:
        try:
            change = persist_flag(flag_name, body.value, reason=reason, actor_user_id=admin_user.user_id)
        except UnknownFlagError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except (FlagValueError, DoctrineFlagNotPersistable) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        # A process override would shadow the stored value on this worker only.
        reset_flag(flag_name)
        audit.details = {
            "old_value": change["old_value"],
            "new_value": change["new_value"],
            "change_id": change["change_id"],
            "scope": "persisted",
        }
    return FlagEntry(**all_flags()[flag_name])


@router.delete("/flags/{flag_name}/reset", summary="Reset a feature flag to its default value", dependencies=[Depends(require_permission("flags.write"))])
def reset_flag_value(
    audit: Annotated[AuditEntry, audited("reset_flag", target_type="flag", reason_required=True)],
    flag_name: str,
    reason: str = "",
    admin_user: User = Depends(get_elevated_admin_user),
) -> dict[str, Any]:
    audit.target_id = flag_name
    cleaned = audit.require_reason(reason)
    if flag_name not in all_flags():
        raise HTTPException(status_code=404, detail=f"Unknown flag: {flag_name}")
    reset_flag(flag_name)
    change = None
    if not flag_name.startswith("doctrine_"):
        try:
            change = clear_persisted_flag(flag_name, reason=cleaned, actor_user_id=admin_user.user_id)
        except FlagValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
    if change:
        audit.details = {"old_value": change["old_value"], "change_id": change["change_id"]}
    return {"flag_name": flag_name, "reset": True, "current_value": all_flags()[flag_name]["value"]}


@router.get("/flags/history", response_model=list[FlagChange], summary="Recorded setting changes, newest first", dependencies=[Depends(require_permission("flags.read"))])
def list_flag_history(
    name: str | None = None,
    limit: int = 100,
    _: User = Depends(get_admin_user),
) -> list[FlagChange]:
    return [FlagChange(**row) for row in flag_history(name, limit)]


@router.post(
    "/flags/changes/{change_id}/rollback",
    response_model=FlagEntry,
    dependencies=[Depends(require_permission("flags.write"))],
    summary="Undo one recorded setting change",
)
def rollback_flag_change(
    audit: Annotated[AuditEntry, audited("rollback_flag", target_type="flag", reason_required=True)],
    change_id: UUID,
    body: FlagRollback,
    admin_user: User = Depends(get_elevated_admin_user),
) -> FlagEntry:
    reason = audit.require_reason(body.reason)
    audit.details = {"rolled_back": str(change_id)}
    try:
        change = rollback_change(change_id, reason=reason, actor_user_id=admin_user.user_id)
    except UnknownFlagError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except (FlagValueError, DoctrineFlagNotPersistable) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    audit.target_id = change["name"]
    audit.details["new_change"] = change["change_id"]
    return FlagEntry(**all_flags()[change["name"]])


@router.get(
    "/calibration",
    response_model=CalibrationReportOut,
    dependencies=[Depends(require_permission("overview.read"))],
    summary="D5 prediction calibration report — hit/near/miss per area, band, and dasha lord",
)
def get_calibration_report(
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> CalibrationReportOut:
    """Read-only aggregate over prediction_log (plan Phase 4 step 3).

    Silent-launch: numbers are only meaningful once n per bucket is ~30+;
    any weight recalibration stays a manual owner + specialist decision.
    """
    rows = session.execute(
        select(
            PredictionLog.life_area,
            PredictionLog.band,
            PredictionLog.outcome_grade,
            PredictionLog.active_maha,
        ).where(PredictionLog.deleted_at.is_(None))
    ).all()
    report = build_calibration_report(
        [
            GradedPrediction(life_area=r[0], band=r[1], outcome_grade=r[2], active_maha=r[3])
            for r in rows
        ]
    )
    def _out(buckets) -> list[CalibrationBucketOut]:
        return [
            CalibrationBucketOut(
                key=b.key, hit=b.hit, near=b.near, miss=b.miss, n=b.n, hit_rate=b.hit_rate
            )
            for b in buckets
        ]
    return CalibrationReportOut(
        total_logged=report.total_logged,
        total_open=report.total_open,
        total_graded=report.total_graded,
        by_area_band=_out(report.by_area_band),
        by_dasha_lord=_out(report.by_dasha_lord),
        as_of=datetime.now(tz=UTC).isoformat(),
    )


@router.get("/health/detail", response_model=HealthDetailResponse, summary="Detailed system health for admin", dependencies=[Depends(require_permission("overview.read"))])
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

    # What actually ran (spec L10). A job list proves jobs are registered; this
    # is the only component that can tell an operator the schedule stopped
    # firing, or that last night's run failed while nobody was watching.
    try:
        recent = recent_job_runs(session, limit=200)
        day_ago = datetime.now(UTC) - timedelta(hours=24)
        in_day = [run for run in recent if run.started_at >= day_ago]
        failed = [run for run in in_day if run.outcome == "error"]
        # A row left `running` past the window is a process that died mid-job.
        stuck = [run for run in recent if run.outcome == "running" and run.started_at < day_ago]
        if failed:
            jobs_listed = ", ".join(sorted({run.job_id for run in failed}))
            components.append(
                ComponentHealth(
                    name="job_runs",
                    status="error",
                    detail=f"{len(failed)} failed run(s) in 24h: {jobs_listed}",
                )
            )
        elif stuck:
            components.append(
                ComponentHealth(
                    name="job_runs",
                    status="warning",
                    detail=f"{len(stuck)} run(s) still marked running after 24h",
                )
            )
        elif not recent:
            components.append(
                ComponentHealth(
                    name="job_runs", status="warning", detail="No job run recorded yet"
                )
            )
        else:
            newest = recent[0]
            components.append(
                ComponentHealth(
                    name="job_runs",
                    status="ok",
                    detail=(
                        f"{len(in_day)} run(s) in 24h, none failed; "
                        f"last {newest.job_id} at {newest.started_at.isoformat()}"
                    ),
                )
            )
    except Exception as exc:  # noqa: BLE001
        components.append(ComponentHealth(name="job_runs", status="warning", detail=str(exc)))

    # The restore drill (spec L10: "record date and result on the Health tab").
    # Performed by hand against a scratch database — see
    # docs/runbooks/KEY_ESCROW_AND_RESTORE.md — so what the tab can check is
    # whether the record exists and how stale it is. The runbook's own cadence
    # is quarterly, which is where 90 days comes from.
    drill_at = str(get_flag("ops_last_restore_drill_at") or "").strip()
    drill_note = str(get_flag("ops_last_restore_drill_note") or "").strip()
    if not drill_at:
        components.append(
            ComponentHealth(
                name="restore_drill",
                status="warning",
                detail="No restore drill recorded. Run docs/runbooks/KEY_ESCROW_AND_RESTORE.md.",
            )
        )
    else:
        try:
            drill_date = date.fromisoformat(drill_at[:10])
        except ValueError:
            components.append(
                ComponentHealth(
                    name="restore_drill",
                    status="warning",
                    detail=f"Recorded date is not a date: {drill_at!r}",
                )
            )
        else:
            age_days = (datetime.now(UTC).date() - drill_date).days
            passed = bool(get_flag("ops_last_restore_drill_passed"))
            suffix = f" - {drill_note}" if drill_note else ""
            verdict = "pass" if passed else "NOT a pass"
            components.append(
                ComponentHealth(
                    name="restore_drill",
                    status="ok" if (passed and age_days <= 90) else "warning",
                    detail=(
                        f"Last drill {drill_date.isoformat()} ({age_days}d ago, {verdict})"
                        f"{suffix}"
                    ),
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


# ── Payments (spec L1; the L9 support console builds on these) ───────────────


class PaymentMismatchOut(BaseModel):
    id: str
    kind: str
    provider_ref: str
    detail: dict[str, Any]
    auto_resolved: bool
    found_at: str
    resolved_at: str | None


class RecentOrderOut(BaseModel):
    provider_order_id: str
    user_id: str | None
    sku: str
    amount_paise: int
    status: str
    created_at: str
    paid_at: str | None


@router.get(
    "/payments/mismatches",
    response_model=list[PaymentMismatchOut],
    summary="What the nightly reconciliation found, newest first",
    dependencies=[Depends(require_permission("payments.read"))],
)
def list_payment_mismatches(
    open_only: bool = True,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> list[PaymentMismatchOut]:
    query = session.query(PaymentMismatch)
    if open_only:
        query = query.filter(PaymentMismatch.resolved_at.is_(None))
    return [
        PaymentMismatchOut(
            id=str(row.id),
            kind=row.kind,
            provider_ref=row.provider_ref,
            detail=row.detail or {},
            auto_resolved=row.auto_resolved,
            found_at=row.found_at.isoformat(),
            resolved_at=row.resolved_at.isoformat() if row.resolved_at else None,
        )
        for row in query.order_by(PaymentMismatch.found_at.desc()).limit(200)
    ]


@router.get(
    "/payments/orders",
    response_model=list[RecentOrderOut],
    summary="Recent one-time orders, newest first",
    dependencies=[Depends(require_permission("payments.read"))],
)
def list_recent_orders(
    limit: int = 50,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> list[RecentOrderOut]:
    rows = session.query(Order).order_by(Order.created_at.desc()).limit(max(1, min(limit, 200))).all()
    return [
        RecentOrderOut(
            provider_order_id=row.provider_order_id,
            user_id=str(row.user_id) if row.user_id else None,
            sku=row.sku,
            amount_paise=row.amount_paise,
            status=row.status,
            created_at=row.created_at.isoformat(),
            paid_at=row.paid_at.isoformat() if row.paid_at else None,
        )
        for row in rows
    ]
