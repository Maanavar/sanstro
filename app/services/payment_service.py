"""Payments: checkout, confirmation, webhook processing, refunds, reconciliation.

The one service that turns money into access (admin spec §2.2). The checkout
routes, the Razorpay webhook and the nightly reconciliation all end in the same
`apply_*` functions, so a grant cannot happen by a path the others do not know.

Rules held here (spec L1 acceptance):

* The amount always comes from `products`; nothing the client sends is read
  for it.
* Access is granted only on proof the money arrived: a signed webhook, or an
  order/subscription fetched from Razorpay's API. A checkout signature alone
  grants nothing.
* Every grant is idempotent: an order is marked paid once, credits carry
  idempotency keys, payments are unique on Razorpay's id.

Subscription access is the existing `subscriptions` row (ARC-13): this module
keeps its period and status in step with Razorpay, and
`app.core.subscription` reads it. Webhooks are applied inline, in the request's
transaction (ARC-04); the nightly reconciliation catches anything lost.
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.core.subscription import is_premium, limits_for_user
from app.models.payment import CreditLedgerEntry, Order, Payment, PaymentMismatch, Product, Refund
from app.models.subscription import Subscription
from app.models.user import User
from app.services.razorpay_client import RazorpayClient

logger = logging.getLogger(__name__)

PROVIDER = "razorpay"

#: How many renewals a Razorpay subscription is created for. Razorpay needs a
#: finite count; ten years of either plan, after which the user subscribes again.
_TOTAL_COUNT = {"month": 120, "year": 10}

_PAYMENT_METHODS = {"upi", "card", "netbanking", "wallet"}

#: Razorpay subscription states that grant access while the period runs.
_ACCESS_STATES = {"active", "pending"}
#: States after which no new period is paid; access runs out at the period end.
_ENDING_STATES = {"halted", "cancelled", "completed", "expired", "paused"}


class CheckoutError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def _ts(value: Any) -> datetime | None:
    """Razorpay timestamps are Unix seconds."""
    if value in (None, "", 0):
        return None
    return datetime.fromtimestamp(int(value), tz=UTC)


# ── Catalogue and credits ────────────────────────────────────────────────────


def active_products(session: Session) -> list[Product]:
    return session.query(Product).filter(Product.active.is_(True)).order_by(Product.price_inr_paise).all()


def credit_balance(session: Session, user_id: UUID, credit_key: str) -> int:
    total = (
        session.query(func.coalesce(func.sum(CreditLedgerEntry.delta), 0))
        .filter(CreditLedgerEntry.user_id == user_id, CreditLedgerEntry.credit_key == credit_key)
        .scalar()
    )
    return int(total or 0)


def _ledger(
    session: Session, *, user_id: UUID, credit_key: str, delta: int, source: str, source_id: str, key: str
) -> bool:
    """Insert one ledger row unless its idempotency key exists. True if inserted."""
    result = session.execute(
        pg_insert(CreditLedgerEntry)
        .values(
            id=uuid4(),
            user_id=user_id,
            credit_key=credit_key,
            delta=delta,
            source=source,
            source_id=source_id,
            idempotency_key=key,
        )
        .on_conflict_do_nothing(index_elements=["idempotency_key"])
    )
    return bool(result.rowcount)


# ── Checkout ─────────────────────────────────────────────────────────────────


def _sellable(session: Session, sku: str, kind: str) -> Product:
    product = session.get(Product, sku)
    if product is None or not product.active or product.kind != kind:
        raise CheckoutError(404, "That product is not on sale.")
    return product


def start_order_checkout(session: Session, user: User, sku: str, client: RazorpayClient) -> dict[str, Any]:
    """Create a Razorpay order for a one-time product, at the catalogue price."""
    product = _sellable(session, sku, "one_time")
    if "ask_question" in (product.credit_grants or {}) and not limits_for_user(
        user.user_id, session
    ).ask_vinaadi_topup_enabled:
        # Owner decision 8: the top-up is for Premium accounts.
        raise CheckoutError(403, "Question top-ups are part of Premium.")

    local_id = uuid4()
    created = client.create_order(
        amount_paise=product.price_inr_paise,
        receipt=str(local_id),
        notes={"vinaadi_user_id": str(user.user_id), "sku": sku},
    )
    if int(created.get("amount", -1)) != product.price_inr_paise:
        # Razorpay echoes the amount; a mismatch means a bug, not a discount.
        raise CheckoutError(502, "The payment provider returned an unexpected amount.")
    session.add(
        Order(
            id=local_id,
            user_id=user.user_id,
            sku=sku,
            provider=PROVIDER,
            provider_order_id=created["id"],
            amount_paise=product.price_inr_paise,
            currency="INR",
            status="created",
        )
    )
    session.flush()
    return {
        "provider": PROVIDER,
        "orderId": created["id"],
        "amountPaise": product.price_inr_paise,
        "currency": "INR",
        "sku": sku,
        "nameEn": product.name_en,
        "nameTa": product.name_ta,
    }


def start_subscription_checkout(
    session: Session, user: User, sku: str, client: RazorpayClient
) -> dict[str, Any]:
    product = _sellable(session, sku, "subscription")
    if not product.razorpay_plan_id:
        raise CheckoutError(503, "This plan is not available yet.")
    if is_premium(user.user_id, session):
        raise CheckoutError(409, "You already have an active Premium subscription.")
    created = client.create_subscription(
        plan_id=product.razorpay_plan_id,
        total_count=_TOTAL_COUNT[product.billing_period or "month"],
        notes={"vinaadi_user_id": str(user.user_id), "sku": sku},
    )
    session.add(
        Subscription(
            user_id=user.user_id,
            tier="premium",
            provider=PROVIDER,
            provider_subscription_id=created["id"],
            provider_product_id=product.razorpay_plan_id,
            sku=sku,
            # No access until Razorpay says the first charge succeeded.
            status="created",
            provider_status=created.get("status", "created"),
        )
    )
    session.flush()
    return {
        "provider": PROVIDER,
        "subscriptionId": created["id"],
        "sku": sku,
        "nameEn": product.name_en,
        "nameTa": product.name_ta,
    }


# ── Applying what Razorpay reports ───────────────────────────────────────────


def _method(entity: dict[str, Any]) -> str:
    method = str(entity.get("method") or "other")
    return method if method in _PAYMENT_METHODS else "other"


def _upsert_payment(
    session: Session,
    entity: dict[str, Any],
    *,
    order: Order | None = None,
    subscription: Subscription | None = None,
) -> Payment:
    payment = session.query(Payment).filter(Payment.provider_payment_id == entity["id"]).first()
    if payment is None:
        payment = Payment(provider_payment_id=entity["id"], amount_paise=int(entity.get("amount") or 0))
        session.add(payment)
    payment.order_id = payment.order_id or (order.id if order else None)
    payment.subscription_id = payment.subscription_id or (subscription.subscription_id if subscription else None)
    payment.method = _method(entity)
    payment.status = str(entity.get("status") or "unknown")
    if entity.get("fee") is not None:
        payment.fee_paise = int(entity["fee"])
    if entity.get("tax") is not None:
        payment.tax_on_fee_paise = int(entity["tax"])
    if payment.status == "captured" and payment.captured_at is None:
        payment.captured_at = _ts(entity.get("created_at")) or datetime.now(UTC)
    session.flush()
    return payment


def apply_order_paid(session: Session, order: Order, payment_entity: dict[str, Any]) -> bool:
    """Mark a one-time order paid and grant its credits. True if this call granted.

    Safe to call any number of times, from any path.
    """
    if payment_entity.get("status") != "captured":
        return False
    if int(payment_entity.get("amount") or 0) != order.amount_paise:
        _record_mismatch(
            session,
            "payment_amount",
            payment_entity["id"],
            {"order": order.provider_order_id, "expected": order.amount_paise, "got": payment_entity.get("amount")},
        )
        return False
    _upsert_payment(session, payment_entity, order=order)
    if order.status not in ("created", "failed"):
        return False
    order.status = "paid"
    order.paid_at = datetime.now(UTC)
    product = session.get(Product, order.sku)
    if order.user_id is not None and product is not None:
        for credit_key, count in sorted((product.credit_grants or {}).items()):
            _ledger(
                session,
                user_id=order.user_id,
                credit_key=credit_key,
                delta=int(count),
                source="purchase",
                source_id=str(order.id),
                key=f"order:{order.id}:{credit_key}",
            )
    session.flush()
    return True


def apply_refund(session: Session, entity: dict[str, Any]) -> str:
    """Record a refund; a processed full refund of a one-time order takes its credits back."""
    refund = session.query(Refund).filter(Refund.provider_refund_id == entity["id"]).first()
    payment = session.query(Payment).filter(Payment.provider_payment_id == entity.get("payment_id")).first()
    if refund is None:
        refund = Refund(
            provider_refund_id=entity["id"],
            provider_payment_id=str(entity.get("payment_id") or ""),
            amount_paise=int(entity.get("amount") or 0),
            status="pending",
        )
        session.add(refund)
    refund.payment_id = refund.payment_id or (payment.id if payment else None)
    refund.status = str(entity.get("status") or refund.status)
    session.flush()
    if payment is None:
        return "unmatched"
    if refund.status != "processed" or payment.order_id is None:
        return "ok"

    order = session.get(Order, payment.order_id)
    refunded = (
        session.query(func.coalesce(func.sum(Refund.amount_paise), 0))
        .filter(Refund.payment_id == payment.id, Refund.status == "processed")
        .scalar()
    )
    if int(refunded) < payment.amount_paise:
        order.status = "partially_refunded"
        return "ok"
    order.status = "refunded"
    product = session.get(Product, order.sku)
    if order.user_id is not None and product is not None:
        for credit_key, count in sorted((product.credit_grants or {}).items()):
            # The balance may go below zero if the credits were already spent:
            # a refund of something used is the owner's call (D-18), and a
            # negative balance blocks further use rather than hiding the debt.
            _ledger(
                session,
                user_id=order.user_id,
                credit_key=credit_key,
                delta=-int(count),
                source="refund",
                source_id=str(order.id),
                key=f"refund:{order.id}:{credit_key}",
            )
    session.flush()
    return "ok"


def apply_subscription_entity(
    session: Session, sub: Subscription, entity: dict[str, Any], *, event_at: datetime | None
) -> str:
    """Bring a local subscription in line with Razorpay's subscription entity."""
    if event_at is not None and sub.provider_event_timestamp is not None:
        applied = sub.provider_event_timestamp
        if applied.tzinfo is None:
            applied = applied.replace(tzinfo=UTC)
        if event_at < applied:
            return "stale"

    state = str(entity.get("status") or "")
    sub.provider_status = state
    start, end = _ts(entity.get("current_start")), _ts(entity.get("current_end"))
    if state in _ACCESS_STATES:
        sub.status = "active"
        sub.cancel_at_period_end = False
        if start is not None:
            sub.current_period_start = start
        if end is not None:
            sub.current_period_end = end
    elif state in _ENDING_STATES:
        # Access runs to the end of the period already paid for, then stops:
        # `status` stays as it was and `current_period_end` does the ending.
        sub.cancel_at_period_end = state == "cancelled"
        if end is not None and sub.current_period_end is None:
            sub.current_period_end = end
    # created / authenticated: the mandate exists, no money yet. No access.
    if event_at is not None:
        sub.provider_event_timestamp = event_at
    session.flush()
    return "ok"


def _subscription_for(session: Session, entity: dict[str, Any]) -> Subscription | None:
    sub = (
        session.query(Subscription)
        .filter(Subscription.provider == PROVIDER, Subscription.provider_subscription_id == entity["id"])
        .first()
    )
    if sub is not None:
        return sub
    # Created outside our checkout (e.g. in the dashboard): the notes name the account.
    raw_user = (entity.get("notes") or {}).get("vinaadi_user_id")
    try:
        user_id = UUID(str(raw_user))
    except ValueError:
        return None
    if session.get(User, user_id) is None:
        return None
    sub = Subscription(
        user_id=user_id,
        tier="premium",
        provider=PROVIDER,
        provider_subscription_id=entity["id"],
        provider_product_id=entity.get("plan_id"),
        sku=(entity.get("notes") or {}).get("sku"),
        status="created",
    )
    session.add(sub)
    session.flush()
    return sub


def process_event(session: Session, body: dict[str, Any]) -> tuple[str, UUID | None]:
    """Apply one verified webhook event. Returns (disposition, resolved user)."""
    event = str(body.get("event") or "")
    payload = body.get("payload") or {}
    event_at = _ts(body.get("created_at"))

    def entity(name: str) -> dict[str, Any] | None:
        return ((payload.get(name) or {}).get("entity")) or None

    if event in ("payment.captured", "order.paid", "payment.failed"):
        payment = entity("payment")
        order_entity = entity("order")
        order_id = (order_entity or {}).get("id") or (payment or {}).get("order_id")
        order = (
            session.query(Order).filter(Order.provider_order_id == order_id).first() if order_id else None
        )
        if order is None:
            # A subscription's charge: subscription.charged carries it with the
            # subscription it belongs to, so this copy is not needed.
            if payment and payment.get("invoice_id"):
                return "ignored", None
            return "unmatched", None
        if payment is None:
            return "ignored", order.user_id
        if event == "payment.failed":
            _upsert_payment(session, payment, order=order)
            if order.status == "created":
                order.status = "failed"
            return "ok", order.user_id
        apply_order_paid(session, order, payment)
        return "ok", order.user_id

    if event.startswith("refund."):
        refund = entity("refund")
        if refund is None:
            return "ignored", None
        return apply_refund(session, refund), None

    if event.startswith("subscription."):
        sub_entity = entity("subscription")
        if sub_entity is None:
            return "ignored", None
        sub = _subscription_for(session, sub_entity)
        if sub is None:
            return "unmatched", None
        payment = entity("payment")
        if event == "subscription.charged" and payment is not None:
            _upsert_payment(session, payment, subscription=sub)
        return apply_subscription_entity(session, sub, sub_entity, event_at=event_at), sub.user_id

    return "ignored", None


def minimal_payload(body: dict[str, Any]) -> dict[str, Any]:
    """What the inbox keeps: ids, states and amounts. Never the payer's email,
    phone, card or VPA, which Razorpay's payment entity carries."""
    payload = body.get("payload") or {}
    kept: dict[str, Any] = {"event": body.get("event"), "created_at": body.get("created_at")}
    for name in ("payment", "order", "subscription", "refund"):
        entity = (payload.get(name) or {}).get("entity")
        if entity:
            kept[name] = {
                key: entity.get(key)
                for key in ("id", "status", "amount", "order_id", "payment_id", "plan_id", "current_end")
                if entity.get(key) is not None
            }
    return kept


# ── The client's success callback ────────────────────────────────────────────


def confirm_order(
    session: Session, user: User, *, order_id: str, payment_id: str, client: RazorpayClient
) -> str:
    """'paid' when Razorpay's API confirms the money; else 'processing'.

    The caller has already checked the checkout signature. That proves the
    browser saw a success handler, not that money moved, so the grant waits
    for the API (here) or the webhook.
    """
    order = (
        session.query(Order)
        .filter(Order.provider_order_id == order_id, Order.user_id == user.user_id)
        .first()
    )
    if order is None:
        raise CheckoutError(404, "Order not found.")
    if order.status in ("paid", "refunded", "partially_refunded"):
        return "paid"
    remote = client.fetch_order(order_id)
    if remote.get("status") != "paid":
        return "processing"
    for payment in client.fetch_order_payments(order_id):
        if payment.get("id") == payment_id or payment.get("status") == "captured":
            apply_order_paid(session, order, payment)
    return "paid" if order.status == "paid" else "processing"


def confirm_subscription(
    session: Session, user: User, *, subscription_id: str, client: RazorpayClient
) -> str:
    sub = (
        session.query(Subscription)
        .filter(
            Subscription.provider == PROVIDER,
            Subscription.provider_subscription_id == subscription_id,
            Subscription.user_id == user.user_id,
        )
        .first()
    )
    if sub is None:
        raise CheckoutError(404, "Subscription not found.")
    remote = client.fetch_subscription(subscription_id)
    apply_subscription_entity(session, sub, remote, event_at=None)
    return "active" if sub.status == "active" else "processing"


def cancel_subscription(session: Session, user: User, client: RazorpayClient) -> Subscription:
    """Stop renewing; access continues to the end of the paid period (D-18)."""
    sub = (
        session.query(Subscription)
        .filter(
            Subscription.provider == PROVIDER,
            Subscription.user_id == user.user_id,
            Subscription.status == "active",
        )
        .order_by(Subscription.created_at.desc())
        .first()
    )
    if sub is None or not sub.provider_subscription_id:
        raise CheckoutError(404, "No active subscription to cancel.")
    client.cancel_subscription(sub.provider_subscription_id, at_cycle_end=True)
    sub.cancel_at_period_end = True
    session.flush()
    return sub


# ── Reconciliation (nightly) ─────────────────────────────────────────────────


def _record_mismatch(
    session: Session, kind: str, ref: str, detail: dict[str, Any], *, auto_resolved: bool = False
) -> None:
    session.execute(
        pg_insert(PaymentMismatch)
        .values(id=uuid4(), kind=kind, provider_ref=ref, detail=detail, auto_resolved=auto_resolved)
        .on_conflict_do_nothing(index_elements=["kind", "provider_ref"])
    )


def reconcile(
    session: Session, client: RazorpayClient, *, now: datetime | None = None, days: int = 3
) -> dict[str, int]:
    """Compare the last `days` of Razorpay with local rows; fix what is safe, list the rest.

    Safe to fix: a captured payment for an order we created, whose webhook never
    arrived — `apply_order_paid` is the same call the webhook makes. Everything
    else is listed for a person.
    """
    until = now or datetime.now(UTC)
    since = until - timedelta(days=days)
    counts = {"payments_checked": 0, "refunds_checked": 0, "subscriptions_checked": 0, "mismatches": 0, "fixed": 0}

    for remote in client.list_payments(since=int(since.timestamp()), until=int(until.timestamp())):
        counts["payments_checked"] += 1
        if remote.get("status") != "captured":
            continue
        local = session.query(Payment).filter(Payment.provider_payment_id == remote["id"]).first()
        if local is not None:
            if local.status != "captured":
                _record_mismatch(session, "payment_status", remote["id"], {"local": local.status, "remote": "captured"})
                counts["mismatches"] += 1
            continue
        order = (
            session.query(Order).filter(Order.provider_order_id == remote.get("order_id")).first()
            if remote.get("order_id")
            else None
        )
        fixed = order is not None and apply_order_paid(session, order, remote)
        _record_mismatch(
            session,
            "payment_missing",
            remote["id"],
            {"order_id": remote.get("order_id"), "amount": remote.get("amount"), "invoice_id": remote.get("invoice_id")},
            auto_resolved=fixed,
        )
        counts["mismatches"] += 1
        counts["fixed"] += int(fixed)

    for remote in client.list_refunds(since=int(since.timestamp()), until=int(until.timestamp())):
        counts["refunds_checked"] += 1
        if session.query(Refund).filter(Refund.provider_refund_id == remote["id"]).first() is not None:
            continue
        outcome = apply_refund(session, remote)
        _record_mismatch(
            session,
            "refund_missing",
            remote["id"],
            {"payment_id": remote.get("payment_id"), "amount": remote.get("amount")},
            auto_resolved=outcome == "ok",
        )
        counts["mismatches"] += 1
        counts["fixed"] += int(outcome == "ok")

    live = (
        session.query(Subscription)
        .filter(
            Subscription.provider == PROVIDER,
            Subscription.provider_status.in_(["created", "authenticated", "active", "pending"]),
        )
        .limit(500)
        .all()
    )
    for sub in live:
        counts["subscriptions_checked"] += 1
        remote = client.fetch_subscription(sub.provider_subscription_id or "")
        if remote.get("status") != sub.provider_status:
            previous = sub.provider_status
            apply_subscription_entity(session, sub, remote, event_at=None)
            _record_mismatch(
                session,
                "subscription_status",
                sub.provider_subscription_id or "",
                {"local": previous, "remote": remote.get("status")},
                auto_resolved=True,
            )
            counts["mismatches"] += 1
            counts["fixed"] += 1

    session.flush()
    return counts


def run_payment_reconciliation() -> None:
    """Scheduled entry point (nightly, 03:30 IST)."""
    from app.db.session import SessionLocal
    from app.services.razorpay_client import get_razorpay_client

    client = get_razorpay_client()
    if client is None:
        logger.info("payment_reconciliation_skipped: razorpay not configured")
        return
    with SessionLocal() as session, session.begin():
        counts = reconcile(session, client)
    logger.info("payment_reconciliation_complete %s", " ".join(f"{k}={v}" for k, v in counts.items()))
