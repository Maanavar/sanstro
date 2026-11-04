"""The support console (admin spec L9, launch cut).

One read that answers "who is this and what have they paid for", and the four
actions a support agent needs to resolve a ticket without the owner: send a
password-reset link, end every session, grant a courtesy entitlement, revoke
one.

Three things are deliberate and worth keeping:

**The reset link is emailed, never returned.** The spec says "send password-reset
link", and that is the whole of it. Handing a support agent the token would hand
them the account — they could set the password themselves — and an audit row
records that afterwards rather than preventing it. The route answers "sent", and
only the address on the account receives the link (ARC-40).

**A courtesy grant is a real entitlement row, not a tier edit.** `source="grant"`
with the granting admin and a reason, so `limits_for_user` picks it up through
the same union as a purchase and the grant can be revoked without touching
anything a customer bought (spec L1, D-05). Support is capped at 30 days per
§6; the owner is not.

**Revoking stamps, it does not delete.** Entitlements are the record of why
someone had access on a given day, which support and any refund argument both
read backwards. `revoked_at` ends access now and keeps that history.

Every route here is audited with a required reason. None is elevated: §6 marks
only suspend, privacy and the owner-only writes as needing a second factor
again, and a support agent re-entering a TOTP code on every ticket would end
with the code written on a sticky note.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import admin_role_of, get_admin_user
from app.core.entitlement_access import active_entitlements, entitlement_access
from app.core.permissions import require_permission
from app.db.session import get_db
from app.models.entitlement import Entitlement
from app.models.payment import CreditLedgerEntry, Order, Payment, Refund
from app.models.subscription import Subscription
from app.models.user import User
from app.privacy.consent import current_consents
from app.services.audit_service import AuditEntry, audited

router = APIRouter(prefix="/admin", tags=["admin"])

#: What a support role may grant in one go (spec §6). The owner is uncapped.
SUPPORT_MAX_GRANT_DAYS = 30
#: Keys a courtesy grant may name. A free-text key would create access nothing
#: reads — `limits_for_user` only knows "premium" — and look like it worked.
GRANTABLE_KEYS = ("premium",)


# ── Response shapes ───────────────────────────────────────────────────────────


class SupportAcquisition(BaseModel):
    source: str | None = None
    medium: str | None = None
    campaign: str | None = None
    ref: str | None = None
    referrer_host: str | None = None
    landing_path: str | None = None


class SupportAccount(BaseModel):
    user_id: str
    email: str | None
    email_verified: bool
    user_mode: str
    is_suspended: bool
    suspension_reason: str | None
    created_at: str | None
    #: Spec §8's active-user day, with the client and language it used (L6).
    last_seen_on: str | None
    last_platform: str | None
    last_language: str | None
    acquisition: SupportAcquisition


class SupportAccess(BaseModel):
    state: Literal["free", "trial", "premium"]
    trial_ends_at: str | None = None
    #: Why they have it, which is the question a ticket actually asks.
    sources: list[str] = Field(default_factory=list)


class SupportEntitlement(BaseModel):
    id: str
    key: str
    source: str
    source_id: str | None
    starts_at: str
    ends_at: str | None
    revoked_at: str | None
    revoked_reason: str | None
    granted_by: str | None
    is_active: bool


class SupportSubscription(BaseModel):
    subscription_id: str
    tier: str
    status: str
    provider: str | None
    provider_status: str | None
    provider_subscription_id: str | None
    sku: str | None
    current_period_end: str | None
    cancel_at_period_end: bool


class SupportOrder(BaseModel):
    id: str
    sku: str
    provider_order_id: str
    amount_paise: int
    status: str
    paid_at: str | None
    created_at: str | None


class SupportPayment(BaseModel):
    id: str
    provider_payment_id: str
    method: str
    amount_paise: int
    status: str
    captured_at: str | None
    order_id: str | None
    subscription_id: str | None


class SupportRefund(BaseModel):
    id: str
    provider_refund_id: str
    provider_payment_id: str
    amount_paise: int
    status: str
    created_at: str | None


class SupportCredit(BaseModel):
    credit_key: str
    balance: int


class SupportView(BaseModel):
    account: SupportAccount
    access: SupportAccess
    entitlements: list[SupportEntitlement]
    subscriptions: list[SupportSubscription]
    orders: list[SupportOrder]
    payments: list[SupportPayment]
    refunds: list[SupportRefund]
    credits: list[SupportCredit]
    consents: dict[str, bool]
    adult_declared: bool


class ReasonRequest(BaseModel):
    reason: str | None = None


class GrantRequest(BaseModel):
    #: Only keys something reads (`GRANTABLE_KEYS`). A free string here let an
    #: agent grant, say, "varshaphala" in good faith and hand the customer
    #: nothing, with the row looking right in the console — the same silence as
    #: ARC-43, one layer up. 422 beats a grant that does not grant.
    key: Literal["premium"] = "premium"
    days: int = Field(gt=0, le=3650)
    reason: str | None = None


class ActionResult(BaseModel):
    detail: str


# ── Helpers ───────────────────────────────────────────────────────────────────


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _load_user(session: Session, user_id: UUID) -> User:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


# ── The read ──────────────────────────────────────────────────────────────────


@router.get(
    "/users/{user_id}/support",
    response_model=SupportView,
    summary="Everything support needs about one account",
    dependencies=[Depends(require_permission("users.read_masked"))],
)
def get_support_view(
    audit: Annotated[AuditEntry, audited("view_user_support", target_type="user")],
    user_id: UUID,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> SupportView:
    """A read of one person's email and payment history, so it is audited (L4).

    Birth data is deliberately absent. The masked family view and the audited
    reveal are deferred per plan §5, and until they exist this route must not
    be the back door that returns what the reveal is meant to gate.
    """
    audit.target_id = str(user_id)
    user = _load_user(session, user_id)
    now = datetime.now(UTC)

    rows = session.execute(
        select(Entitlement).where(Entitlement.user_id == user_id).order_by(Entitlement.starts_at.desc())
    ).scalars().all()
    active_ids = {row.id for row in active_entitlements(session, user_id, now=now)}
    access = entitlement_access(session, user_id, now=now)

    subscriptions = session.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.created_at.desc())
    ).scalars().all()

    orders = session.execute(
        select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
    ).scalars().all()

    order_ids = [order.id for order in orders]
    subscription_ids = [sub.subscription_id for sub in subscriptions]
    payments: list[Payment] = []
    if order_ids or subscription_ids:
        conditions = []
        if order_ids:
            conditions.append(Payment.order_id.in_(order_ids))
        if subscription_ids:
            conditions.append(Payment.subscription_id.in_(subscription_ids))
        clause = conditions[0]
        for extra in conditions[1:]:
            clause = clause | extra
        payments = list(
            session.execute(select(Payment).where(clause).order_by(Payment.created_at.desc()))
            .scalars()
            .all()
        )

    refunds: list[Refund] = []
    if payments:
        refunds = list(
            session.execute(
                select(Refund)
                .where(Refund.provider_payment_id.in_([p.provider_payment_id for p in payments]))
                .order_by(Refund.created_at.desc())
            )
            .scalars()
            .all()
        )

    balances: dict[str, int] = {}
    for entry in session.execute(
        select(CreditLedgerEntry).where(CreditLedgerEntry.user_id == user_id)
    ).scalars().all():
        balances[entry.credit_key] = balances.get(entry.credit_key, 0) + entry.delta

    # Why they have the access they have. An active subscription and an
    # entitlement row can both be true at once, and a ticket about "I paid and
    # it says free" is usually answered by which of these is missing.
    sources = sorted({row.source for row in rows if row.id in active_ids})
    if any(sub.status == "active" for sub in subscriptions):
        sources.append("subscription")

    state = access.state
    if state == "free" and any(sub.status == "active" for sub in subscriptions):
        # `limits_for_user` unions entitlements with an active subscription;
        # reporting only the entitlement half here would contradict the app.
        state = "premium"

    return SupportView(
        account=SupportAccount(
            user_id=str(user.user_id),
            email=user.email,
            email_verified=user.email_verified_at is not None,
            user_mode=user.user_mode,
            is_suspended=user.is_suspended,
            suspension_reason=user.suspension_reason,
            created_at=_iso(user.created_at),
            last_seen_on=user.last_seen_on.isoformat() if user.last_seen_on else None,
            last_platform=user.last_platform,
            last_language=user.last_language,
            acquisition=SupportAcquisition(
                source=user.acquisition_source,
                medium=user.acquisition_medium,
                campaign=user.acquisition_campaign,
                ref=user.acquisition_ref,
                referrer_host=user.acquisition_referrer_host,
                landing_path=user.acquisition_landing_path,
            ),
        ),
        access=SupportAccess(
            state=state,
            trial_ends_at=_iso(access.trial_ends_at),
            sources=sources,
        ),
        entitlements=[
            SupportEntitlement(
                id=str(row.id),
                key=row.key,
                source=row.source,
                source_id=row.source_id,
                starts_at=row.starts_at.isoformat(),
                ends_at=_iso(row.ends_at),
                revoked_at=_iso(row.revoked_at),
                revoked_reason=row.revoked_reason,
                granted_by=str(row.granted_by) if row.granted_by else None,
                is_active=row.id in active_ids,
            )
            for row in rows
        ],
        subscriptions=[
            SupportSubscription(
                subscription_id=str(sub.subscription_id),
                tier=sub.tier,
                status=sub.status,
                provider=sub.provider,
                provider_status=sub.provider_status,
                provider_subscription_id=sub.provider_subscription_id,
                sku=sub.sku,
                current_period_end=_iso(sub.current_period_end),
                cancel_at_period_end=bool(sub.cancel_at_period_end),
            )
            for sub in subscriptions
        ],
        orders=[
            SupportOrder(
                id=str(order.id),
                sku=order.sku,
                provider_order_id=order.provider_order_id,
                amount_paise=order.amount_paise,
                status=order.status,
                paid_at=_iso(order.paid_at),
                created_at=_iso(order.created_at),
            )
            for order in orders
        ],
        payments=[
            SupportPayment(
                id=str(payment.id),
                provider_payment_id=payment.provider_payment_id,
                method=payment.method,
                amount_paise=payment.amount_paise,
                status=payment.status,
                captured_at=_iso(payment.captured_at),
                order_id=str(payment.order_id) if payment.order_id else None,
                subscription_id=str(payment.subscription_id) if payment.subscription_id else None,
            )
            for payment in payments
        ],
        refunds=[
            SupportRefund(
                id=str(refund.id),
                provider_refund_id=refund.provider_refund_id,
                provider_payment_id=refund.provider_payment_id,
                amount_paise=refund.amount_paise,
                status=refund.status,
                created_at=_iso(refund.created_at),
            )
            for refund in refunds
        ],
        credits=[
            SupportCredit(credit_key=key, balance=balance)
            for key, balance in sorted(balances.items())
            if balance
        ],
        consents=dict(current_consents(session, user_id)),
        adult_declared=user.adult_declared_at is not None,
    )


# ── The actions ───────────────────────────────────────────────────────────────


@router.post(
    "/users/{user_id}/reset-link",
    response_model=ActionResult,
    summary="Email this account a password-reset link",
    dependencies=[Depends(require_permission("users.reset_link"))],
)
def send_reset_link(
    audit: Annotated[AuditEntry, audited("send_reset_link", target_type="user", reason_required=True)],
    user_id: UUID,
    body: ReasonRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> ActionResult:
    """The link goes to the address on the account and is never returned here.

    Imported inside the function: `app.api.auth` imports this module's siblings
    at module scope, and taking its private token issuer at import time makes a
    cycle. The alternative — reimplementing the token here — would be a second
    issuer to keep in step with the one that validates.
    """
    from app.api.auth import _issue_password_reset_token
    from app.services.email_service import enqueue_password_reset_email

    audit.target_id = str(user_id)
    audit.require_reason(body.reason)
    user = _load_user(session, user_id)
    if not user.email:
        # A Google-only account has no password to reset. Saying so beats
        # "sent" on a mail that can never arrive.
        raise HTTPException(status_code=422, detail="This account has no email address to send to.")

    token = _issue_password_reset_token(session, user)
    enqueue_password_reset_email(background_tasks, user.email, token)
    audit.details = {"emailed": True}
    return ActionResult(detail="A reset link has been emailed to the account holder.")


@router.post(
    "/users/{user_id}/force-logout",
    response_model=ActionResult,
    summary="End every session this account has",
    dependencies=[Depends(require_permission("users.force_logout"))],
)
def force_logout(
    audit: Annotated[AuditEntry, audited("force_logout", target_type="user", reason_required=True)],
    user_id: UUID,
    body: ReasonRequest,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> ActionResult:
    """Bumps `token_version`, which every access token carries and
    `get_current_user` checks, so live tokens stop being accepted at once
    rather than at expiry. Refresh tokens are revoked with them, or the next
    refresh would mint a session this was meant to end.
    """
    from app.models.refresh_token import RefreshToken

    audit.target_id = str(user_id)
    audit.require_reason(body.reason)
    user = _load_user(session, user_id)

    user.token_version = int(user.token_version or 0) + 1
    revoked = session.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None),
    ).update({"revoked_at": datetime.now(UTC)}, synchronize_session=False)

    audit.details = {"token_version": user.token_version, "refresh_tokens_revoked": int(revoked or 0)}
    return ActionResult(detail="Every session has been ended.")


@router.post(
    "/users/{user_id}/entitlements",
    response_model=SupportEntitlement,
    summary="Grant a courtesy entitlement",
    dependencies=[Depends(require_permission("entitlements.grant"))],
)
def grant_entitlement(
    audit: Annotated[AuditEntry, audited("grant_entitlement", target_type="user", reason_required=True)],
    user_id: UUID,
    body: GrantRequest,
    session: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
) -> SupportEntitlement:
    """A real `source="grant"` row, so the same union that reads a purchase
    reads this, and revoking it never touches what someone bought.

    The *reason* is not copied onto the row: the audit entry is where "why an
    admin did this" lives (L4), it is filterable by this target, and a second
    copy would be a second thing to keep true. `granted_by` and
    `source_id="admin:<uuid>"` are what tie the row back to that entry.
    """
    audit.target_id = str(user_id)
    audit.require_reason(body.reason)
    _load_user(session, user_id)

    if body.key not in GRANTABLE_KEYS:
        raise HTTPException(
            status_code=422,
            detail=f"Grantable keys are: {', '.join(GRANTABLE_KEYS)}.",
        )

    role = admin_role_of(admin_user)
    if role != "owner" and body.days > SUPPORT_MAX_GRANT_DAYS:
        raise HTTPException(
            status_code=403,
            detail=f"Support may grant at most {SUPPORT_MAX_GRANT_DAYS} days. Ask an owner for longer.",
        )

    now = datetime.now(UTC)
    row = Entitlement(
        user_id=user_id,
        key=body.key,
        source="grant",
        source_id=f"admin:{admin_user.user_id}",
        starts_at=now,
        ends_at=now + timedelta(days=body.days),
        granted_by=admin_user.user_id,
    )
    session.add(row)
    session.flush()

    audit.details = {"key": body.key, "days": body.days, "entitlement_id": str(row.id)}
    return SupportEntitlement(
        id=str(row.id),
        key=row.key,
        source=row.source,
        source_id=row.source_id,
        starts_at=row.starts_at.isoformat(),
        ends_at=_iso(row.ends_at),
        revoked_at=None,
        revoked_reason=None,
        granted_by=str(row.granted_by) if row.granted_by else None,
        is_active=True,
    )


@router.post(
    "/users/{user_id}/entitlements/{entitlement_id}/revoke",
    response_model=ActionResult,
    summary="Revoke an entitlement",
    dependencies=[Depends(require_permission("entitlements.revoke"))],
)
def revoke_entitlement(
    audit: Annotated[AuditEntry, audited("revoke_entitlement", target_type="user", reason_required=True)],
    user_id: UUID,
    entitlement_id: UUID,
    body: ReasonRequest,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> ActionResult:
    """Stamps `revoked_at`; the row stays as the record of why access existed.

    A POST and not a DELETE for the same reason: nothing is removed.
    """
    audit.target_id = str(user_id)
    audit.require_reason(body.reason)

    row = session.get(Entitlement, entitlement_id)
    if row is None or row.user_id != user_id:
        raise HTTPException(status_code=404, detail="Entitlement not found for this account.")
    if row.revoked_at is not None:
        raise HTTPException(status_code=409, detail="That entitlement is already revoked.")

    row.revoked_at = datetime.now(UTC)
    row.revoked_reason = audit.reason
    audit.details = {"entitlement_id": str(entitlement_id), "key": row.key, "source": row.source}
    return ActionResult(detail="The entitlement has been revoked.")
