"""Razorpay payments: the spec L1 acceptance tests, and the rules behind them.

Acceptance (VINAADI_ADMIN_MASTER_SPEC §4 L1):
  * a replayed webhook (same event id) grants nothing twice
  * a bad signature is stored with signature_valid=false, grants nothing, 400
  * a client-only success callback without webhook or API confirmation grants nothing
  * subscription lifecycle: created → active → charged ×2 → halted → access ends at period end
  * a refund of a one-time purchase revokes what it granted
  * the amount comes from `products`; a tampered client amount is ignored
  * reconciliation flags a payment present in Razorpay but missing locally

Razorpay is replaced by an in-memory fake at `get_razorpay_client`; the
webhook is driven over HTTP with real HMAC signatures, so signature checking,
the inbox, and the apply path are the production code.

BLIND SPOT: the fake answers the way Razorpay's documentation says it does.
A field Razorpay renamed or a status it added would pass here and fail live;
spec §9's live test purchase on production is what covers that.
"""
from __future__ import annotations

import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from app.api import payments as payments_api
from app.core.auth import get_admin_user, get_current_user
from app.core.config import get_settings
from app.core.permissions import get_admin_role
from app.core.subscription import is_premium
from app.db.session import SessionLocal
from app.main import app
from app.models.payment import CreditLedgerEntry, Order, Payment, PaymentMismatch, Product
from app.models.subscription import Subscription
from app.models.user import User
from app.models.webhook_event import WebhookEvent
from app.services import feature_flags, payment_service
from app.services.razorpay_client import RazorpayClient

WEBHOOK_SECRET = "synthetic-webhook-secret"  # noqa: S105 — test fixture value
KEY_SECRET = "synthetic-key-secret"  # noqa: S105 — test fixture value


def _now() -> int:
    return int(datetime.now(UTC).timestamp())


class FakeRazorpay(RazorpayClient):
    """Enough of Razorpay's API for checkout, confirmation and reconciliation."""

    def __init__(self) -> None:
        super().__init__(key_id="rzp_test_synthetic", key_secret=KEY_SECRET)
        object.__setattr__(self, "orders", {})
        object.__setattr__(self, "order_payments", {})
        object.__setattr__(self, "subscriptions", {})
        object.__setattr__(self, "payments", [])
        object.__setattr__(self, "refunds", [])
        object.__setattr__(self, "created_amounts", [])

    def create_order(self, *, amount_paise, receipt, notes):
        order_id = f"order_{uuid4().hex[:14]}"
        self.created_amounts.append(amount_paise)
        self.orders[order_id] = {"id": order_id, "amount": amount_paise, "status": "created", "notes": notes}
        return dict(self.orders[order_id])

    def fetch_order(self, order_id):
        return dict(self.orders[order_id])

    def fetch_order_payments(self, order_id):
        return list(self.order_payments.get(order_id, []))

    def create_subscription(self, *, plan_id, total_count, notes):
        sub_id = f"sub_{uuid4().hex[:14]}"
        self.subscriptions[sub_id] = {"id": sub_id, "plan_id": plan_id, "status": "created", "notes": notes}
        return dict(self.subscriptions[sub_id])

    def fetch_subscription(self, subscription_id):
        return dict(self.subscriptions[subscription_id])

    def cancel_subscription(self, subscription_id, *, at_cycle_end=True):
        self.subscriptions[subscription_id]["status"] = "active"
        return dict(self.subscriptions[subscription_id])

    def list_payments(self, *, since, until):
        return list(self.payments)

    def list_refunds(self, *, since, until):
        return list(self.refunds)


# ── Fixtures ─────────────────────────────────────────────────────────────────


def _seed_products() -> None:
    with SessionLocal() as session, session.begin():
        session.add_all(
            [
                Product(sku="premium_monthly", kind="subscription", name_en="Premium, monthly", name_ta="பிரீமியம்",
                        price_inr_paise=14900, billing_period="month", entitlement_keys=["premium"],
                        credit_grants={}, razorpay_plan_id="plan_synthetic", active=True),
                Product(sku="jadhagam_report", kind="one_time", name_en="Jadhagam report", name_ta="ஜாதக அறிக்கை",
                        price_inr_paise=9900, entitlement_keys=[], credit_grants={"jadhagam_report": 1}, active=True),
                Product(sku="ask_topup_10", kind="one_time", name_en="Top-up", name_ta="கேள்விகள்",
                        price_inr_paise=4900, entitlement_keys=[], credit_grants={"ask_question": 10}, active=True),
                Product(sku="porutham_report", kind="one_time", name_en="Porutham report", name_ta="பொருத்தம்",
                        price_inr_paise=9900, entitlement_keys=[], credit_grants={"porutham_report": 1}, active=False),
            ]
        )


@pytest.fixture()
def fake(monkeypatch) -> FakeRazorpay:
    client = FakeRazorpay()
    monkeypatch.setattr(payments_api, "get_razorpay_client", lambda: client)
    monkeypatch.setattr(get_settings(), "razorpay_webhook_secret", WEBHOOK_SECRET)
    return client


@pytest.fixture()
def buyer(raw_client, fake, monkeypatch):
    """A fresh signed-in account with no subscription, the open beta off."""
    monkeypatch.setattr(get_settings(), "open_beta", False)
    _seed_products()
    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email=f"buyer-{uuid4().hex}@example.invalid"))
    stub = User(user_id=user_id, email="buyer@example.invalid", token_version=0)
    app.dependency_overrides[get_current_user] = lambda: stub
    yield raw_client, stub
    app.dependency_overrides.pop(get_current_user, None)


def _csrf() -> dict[str, str]:
    return {"X-Vinaadi-CSRF": "1"}


def _post_webhook(client, body: dict, *, event_id: str | None = None, secret: str = WEBHOOK_SECRET):
    raw = json.dumps(body).encode()
    signature = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
    return client.post(
        "/api/v1/payments/razorpay/webhook",
        content=raw,
        headers={
            "Content-Type": "application/json",
            "X-Razorpay-Signature": signature,
            "X-Razorpay-Event-Id": event_id or f"evt_{uuid4().hex[:14]}",
        },
    )


def _payment(order_id: str | None, amount: int, *, status: str = "captured", invoice_id: str | None = None) -> dict:
    return {
        "id": f"pay_{uuid4().hex[:14]}",
        "entity": "payment",
        "amount": amount,
        "currency": "INR",
        "status": status,
        "order_id": order_id,
        "invoice_id": invoice_id,
        "method": "upi",
        "fee": 236,
        "tax": 36,
        # Personal fields Razorpay sends; the inbox must not keep them.
        "email": "payer@example.invalid",
        "contact": "+910000000000",
        "created_at": _now(),
    }


def _event(name: str, *, created_at: int | None = None, **entities) -> dict:
    return {
        "entity": "event",
        "event": name,
        "payload": {key: {"entity": value} for key, value in entities.items()},
        "created_at": created_at or _now(),
    }


def _credits(user_id, key: str) -> int:
    with SessionLocal() as session:
        return payment_service.credit_balance(session, user_id, key)


def _checkout_order(client, sku: str = "jadhagam_report", **extra) -> dict:
    response = client.post("/api/v1/payments/checkout/order", json={"sku": sku, **extra}, headers=_csrf())
    assert response.status_code == 200, response.text
    return response.json()


def _order_signature(order_id: str, payment_id: str) -> str:
    return hmac.new(KEY_SECRET.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()


# ── Amount from products ─────────────────────────────────────────────────────


def test_the_amount_comes_from_products_and_a_client_amount_is_ignored(buyer, fake):
    client, user = buyer
    started = _checkout_order(client, amount=1, amountPaise=1, price_inr_paise=1)
    assert started["amountPaise"] == 9900
    assert fake.created_amounts == [9900]
    with SessionLocal() as session:
        order = session.query(Order).filter(Order.provider_order_id == started["orderId"]).one()
        assert order.amount_paise == 9900
        assert order.user_id == user.user_id


def test_a_payment_for_the_wrong_amount_grants_nothing(buyer, fake):
    client, user = buyer
    order_id = _checkout_order(client)["orderId"]
    response = _post_webhook(client, _event("order.paid", payment=_payment(order_id, 100), order={"id": order_id}))
    assert response.status_code == 200
    assert _credits(user.user_id, "jadhagam_report") == 0
    with SessionLocal() as session:
        assert session.query(PaymentMismatch).filter(PaymentMismatch.kind == "payment_amount").count() == 1


def test_an_inactive_product_is_not_sold(buyer):
    client, _ = buyer
    response = client.post("/api/v1/payments/checkout/order", json={"sku": "porutham_report"}, headers=_csrf())
    assert response.status_code == 404


def test_the_ask_top_up_is_for_premium_only(buyer):
    client, _ = buyer
    response = client.post("/api/v1/payments/checkout/order", json={"sku": "ask_topup_10"}, headers=_csrf())
    assert response.status_code == 403


def test_the_catalogue_lists_only_active_products(buyer):
    client, _ = buyer
    skus = {row["sku"] for row in client.get("/api/v1/payments/products").json()}
    assert skus == {"premium_monthly", "jadhagam_report", "ask_topup_10"}


# ── The client's callback alone grants nothing ───────────────────────────────


def test_a_client_success_callback_without_confirmation_grants_nothing(buyer, fake):
    client, user = buyer
    order_id = _checkout_order(client)["orderId"]
    fake.orders[order_id]["status"] = "attempted"  # Razorpay has not seen the money
    payment_id = f"pay_{uuid4().hex[:14]}"
    response = client.post(
        "/api/v1/payments/confirm",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": _order_signature(order_id, payment_id),
        },
        headers=_csrf(),
    )
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "processing"
    assert _credits(user.user_id, "jadhagam_report") == 0
    assert client.get(f"/api/v1/payments/orders/{order_id}").json()["status"] == "processing"


def test_a_forged_callback_signature_is_refused(buyer, fake):
    client, user = buyer
    order_id = _checkout_order(client)["orderId"]
    response = client.post(
        "/api/v1/payments/confirm",
        json={"razorpay_order_id": order_id, "razorpay_payment_id": "pay_x", "razorpay_signature": "0" * 64},
        headers=_csrf(),
    )
    assert response.status_code == 400
    assert _credits(user.user_id, "jadhagam_report") == 0


def test_the_callback_grants_once_the_api_confirms_the_money(buyer, fake):
    client, user = buyer
    order_id = _checkout_order(client)["orderId"]
    payment = _payment(order_id, 9900)
    fake.orders[order_id]["status"] = "paid"
    fake.order_payments[order_id] = [payment]
    response = client.post(
        "/api/v1/payments/confirm",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment["id"],
            "razorpay_signature": _order_signature(order_id, payment["id"]),
        },
        headers=_csrf(),
    )
    assert response.json()["status"] == "paid"
    assert _credits(user.user_id, "jadhagam_report") == 1


# ── Webhook signature and replay ─────────────────────────────────────────────


def test_a_bad_signature_is_stored_grants_nothing_and_answers_400(buyer, fake):
    client, user = buyer
    order_id = _checkout_order(client)["orderId"]
    body = _event("order.paid", payment=_payment(order_id, 9900), order={"id": order_id})
    response = _post_webhook(client, body, event_id="evt_claimed_by_forger", secret="wrong-secret")
    assert response.status_code == 400
    assert _credits(user.user_id, "jadhagam_report") == 0
    with SessionLocal() as session:
        rows = session.query(WebhookEvent).filter(WebhookEvent.provider == "razorpay").all()
        assert len(rows) == 1
        assert rows[0].signature_valid is False
        assert rows[0].status == "rejected"
        # The forger's claimed id is not the row's id, so it occupies nothing.
        assert rows[0].event_id != "evt_claimed_by_forger"

    # The real event with that id still lands.
    real = _post_webhook(client, body, event_id="evt_claimed_by_forger")
    assert real.json()["status"] == "ok"
    assert _credits(user.user_id, "jadhagam_report") == 1


def test_a_replayed_webhook_grants_nothing_twice(buyer, fake):
    client, user = buyer
    order_id = _checkout_order(client)["orderId"]
    payment = _payment(order_id, 9900)
    body = _event("order.paid", payment=payment, order={"id": order_id})
    assert _post_webhook(client, body, event_id="evt_once").json()["status"] == "ok"
    assert _post_webhook(client, body, event_id="evt_once").json()["status"] == "duplicate"
    # The same money reported by a second event type is still one grant.
    assert _post_webhook(client, _event("payment.captured", payment=payment)).json()["status"] == "ok"
    assert _credits(user.user_id, "jadhagam_report") == 1
    with SessionLocal() as session:
        assert session.query(Payment).count() == 1
        assert session.query(CreditLedgerEntry).count() == 1


def test_the_inbox_keeps_no_payer_contact_details(buyer, fake):
    client, _ = buyer
    order_id = _checkout_order(client)["orderId"]
    _post_webhook(client, _event("order.paid", payment=_payment(order_id, 9900), order={"id": order_id}))
    with SessionLocal() as session:
        stored = json.dumps(session.query(WebhookEvent).one().payload)
    assert "payer@example.invalid" not in stored
    assert "+910000000000" not in stored


def test_without_a_webhook_secret_the_webhook_is_closed(buyer, monkeypatch):
    client, _ = buyer
    monkeypatch.setattr(get_settings(), "razorpay_webhook_secret", None)
    assert _post_webhook(client, _event("order.paid")).status_code == 503


# ── Subscription lifecycle ───────────────────────────────────────────────────


def _sub_entity(sub_id: str, status: str, *, end: datetime | None = None) -> dict:
    start = (end or datetime.now(UTC)) - timedelta(days=30)
    return {
        "id": sub_id,
        "entity": "subscription",
        "plan_id": "plan_synthetic",
        "status": status,
        "current_start": int(start.timestamp()) if end else None,
        "current_end": int(end.timestamp()) if end else None,
    }


def _premium(user_id) -> bool:
    with SessionLocal() as session:
        return is_premium(user_id, session)


def test_subscription_lifecycle_created_active_charged_twice_halted_then_ends(buyer, fake):
    client, user = buyer
    response = client.post("/api/v1/payments/checkout/subscription", json={"sku": "premium_monthly"}, headers=_csrf())
    assert response.status_code == 200, response.text
    sub_id = response.json()["subscriptionId"]
    assert not _premium(user.user_id), "created: no money yet, no access"

    t = _now()
    _post_webhook(client, _event("subscription.authenticated", created_at=t, subscription=_sub_entity(sub_id, "authenticated")))
    assert not _premium(user.user_id), "authenticated: a mandate is not a payment"

    first_end = datetime.now(UTC) + timedelta(days=30)
    _post_webhook(client, _event("subscription.activated", created_at=t + 1, subscription=_sub_entity(sub_id, "active", end=first_end)))
    assert _premium(user.user_id)

    second_end = first_end + timedelta(days=30)
    for offset, end in ((2, first_end), (3, second_end)):
        _post_webhook(
            client,
            _event(
                "subscription.charged",
                created_at=t + offset,
                subscription=_sub_entity(sub_id, "active", end=end),
                payment=_payment(None, 14900, invoice_id=f"inv_{offset}"),
            ),
        )
    with SessionLocal() as session:
        sub = session.query(Subscription).filter(Subscription.provider_subscription_id == sub_id).one()
        assert sub.current_period_end == second_end.replace(microsecond=0)
        assert session.query(Payment).filter(Payment.subscription_id == sub.subscription_id).count() == 2

    # An older event arriving late cannot move the period back.
    late = _post_webhook(client, _event("subscription.activated", created_at=t + 1, subscription=_sub_entity(sub_id, "active", end=first_end)))
    assert late.json()["status"] == "stale"

    _post_webhook(client, _event("subscription.halted", created_at=t + 4, subscription=_sub_entity(sub_id, "halted", end=second_end)))
    assert _premium(user.user_id), "halted: access runs to the end of the paid period"

    with SessionLocal() as session, session.begin():
        sub = session.query(Subscription).filter(Subscription.provider_subscription_id == sub_id).one()
        # Halted must leave the end where the last paid period ends — checked
        # before the clock is moved below, which would otherwise overwrite the
        # very field under test (a mutation that cleared it survived without this).
        assert sub.current_period_end == second_end.replace(microsecond=0)
        assert sub.provider_status == "halted"
        sub.current_period_end = datetime.now(UTC) - timedelta(seconds=1)  # the period runs out
    assert not _premium(user.user_id), "after the period end, access is gone"


def test_cancelling_tells_the_clients_the_period_end_is_now_a_stop_date(buyer, fake):
    """`GET /users/me/subscription` is what both clients read to label the date.

    Without `cancelAtPeriodEnd` on that response the mobile Me tab said
    "Renews: <date>" to a user who had just cancelled, and neither client could
    tell a store-bought subscription (only the store can stop it) from a web
    one (audit 2026-11-03). The field is also what hides the cancel control
    once renewal is already stopped.
    """
    client, user = buyer
    sub_id = client.post(
        "/api/v1/payments/checkout/subscription", json={"sku": "premium_monthly"}, headers=_csrf()
    ).json()["subscriptionId"]
    period_end = datetime.now(UTC) + timedelta(days=30)
    _post_webhook(
        client,
        _event("subscription.activated", created_at=_now(), subscription=_sub_entity(sub_id, "active", end=period_end)),
    )

    before = client.get("/api/v1/users/me/subscription").json()["data"]
    assert before["provider"] == "razorpay", "a web subscription: ours to cancel, not the store's"
    assert before["cancel_at_period_end"] is False
    assert before["current_period_end"] is not None

    cancelled = client.post("/api/v1/payments/subscription/cancel", headers=_csrf())
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["cancelAtPeriodEnd"] is True

    after = client.get("/api/v1/users/me/subscription").json()["data"]
    assert after["cancel_at_period_end"] is True
    assert after["current_period_end"] == before["current_period_end"], "cancelling does not move the date"
    assert _premium(user.user_id), "access runs to the end of the paid period (D-18)"


def test_a_renewal_in_retry_keeps_access_past_the_period_end(buyer, fake):
    client, user = buyer
    sub_id = client.post(
        "/api/v1/payments/checkout/subscription", json={"sku": "premium_monthly"}, headers=_csrf()
    ).json()["subscriptionId"]
    t = _now()
    ended = datetime.now(UTC) - timedelta(hours=1)
    _post_webhook(client, _event("subscription.activated", created_at=t, subscription=_sub_entity(sub_id, "active", end=ended)))
    assert not _premium(user.user_id)
    _post_webhook(client, _event("subscription.pending", created_at=t + 1, subscription=_sub_entity(sub_id, "pending", end=ended)))
    assert _premium(user.user_id), "pending: Razorpay is retrying the charge"
    _post_webhook(client, _event("subscription.halted", created_at=t + 2, subscription=_sub_entity(sub_id, "halted", end=ended)))
    assert not _premium(user.user_id)


def test_a_subscriber_cannot_start_a_second_subscription(buyer, fake):
    client, user = buyer
    with SessionLocal() as session, session.begin():
        session.add(Subscription(user_id=user.user_id, tier="premium", status="active"))
    response = client.post("/api/v1/payments/checkout/subscription", json={"sku": "premium_monthly"}, headers=_csrf())
    assert response.status_code == 409


# ── Refunds ──────────────────────────────────────────────────────────────────


def _paid_order(client) -> tuple[str, dict]:
    order_id = _checkout_order(client)["orderId"]
    payment = _payment(order_id, 9900)
    _post_webhook(client, _event("order.paid", payment=payment, order={"id": order_id}))
    return order_id, payment


def _refund(payment: dict, amount: int, status: str = "processed") -> dict:
    return {"id": f"rfnd_{uuid4().hex[:14]}", "entity": "refund", "payment_id": payment["id"], "amount": amount, "status": status}


def test_a_full_refund_takes_back_what_the_purchase_granted(buyer, fake):
    client, user = buyer
    order_id, payment = _paid_order(client)
    assert _credits(user.user_id, "jadhagam_report") == 1
    refund = _refund(payment, 9900)
    _post_webhook(client, _event("refund.processed", refund=refund))
    _post_webhook(client, _event("refund.processed", refund=refund))  # a second event for the same refund
    assert _credits(user.user_id, "jadhagam_report") == 0
    with SessionLocal() as session:
        assert session.query(Order).filter(Order.provider_order_id == order_id).one().status == "refunded"


def test_a_partial_refund_keeps_the_purchase(buyer, fake):
    client, user = buyer
    order_id, payment = _paid_order(client)
    _post_webhook(client, _event("refund.processed", refund=_refund(payment, 5000)))
    assert _credits(user.user_id, "jadhagam_report") == 1
    with SessionLocal() as session:
        assert session.query(Order).filter(Order.provider_order_id == order_id).one().status == "partially_refunded"


def test_a_pending_refund_changes_nothing_yet(buyer, fake):
    client, user = buyer
    _, payment = _paid_order(client)
    _post_webhook(client, _event("refund.created", refund=_refund(payment, 9900, status="pending")))
    assert _credits(user.user_id, "jadhagam_report") == 1


# ── Reconciliation ───────────────────────────────────────────────────────────


def test_reconciliation_flags_a_payment_razorpay_has_and_we_do_not(buyer, fake):
    client, user = buyer
    stray = _payment("order_unknown_to_us", 9900)
    fake.payments.append(stray)
    with SessionLocal() as session, session.begin():
        counts = payment_service.reconcile(session, fake)
    assert counts["mismatches"] == 1
    with SessionLocal() as session:
        row = session.query(PaymentMismatch).one()
        assert (row.kind, row.provider_ref, row.auto_resolved) == ("payment_missing", stray["id"], False)


def test_reconciliation_applies_a_lost_webhook_for_an_order_we_created(buyer, fake):
    client, user = buyer
    order_id = _checkout_order(client)["orderId"]
    fake.payments.append(_payment(order_id, 9900))
    with SessionLocal() as session, session.begin():
        counts = payment_service.reconcile(session, fake)
    assert counts["fixed"] == 1
    assert _credits(user.user_id, "jadhagam_report") == 1
    with SessionLocal() as session, session.begin():
        payment_service.reconcile(session, fake)  # a second night changes nothing
    assert _credits(user.user_id, "jadhagam_report") == 1
    with SessionLocal() as session:
        assert session.query(PaymentMismatch).one().auto_resolved is True


def test_admin_lists_the_mismatches(buyer, fake):
    raw, _ = buyer
    fake.payments.append(_payment("order_unknown_to_us", 9900))
    with SessionLocal() as session, session.begin():
        payment_service.reconcile(session, fake)
    app.dependency_overrides[get_admin_user] = lambda: User(user_id=uuid4(), is_admin=True, admin_role="support")
    app.dependency_overrides[get_admin_role] = lambda: "support"
    try:
        rows = raw.get("/api/v1/admin/payments/mismatches").json()
    finally:
        app.dependency_overrides.pop(get_admin_user, None)
        app.dependency_overrides.pop(get_admin_role, None)
    assert [row["kind"] for row in rows] == ["payment_missing"]


# ── Kill switch and configuration ────────────────────────────────────────────


def test_the_checkout_kill_switch_stops_new_checkouts_but_not_webhooks(buyer, fake):
    client, user = buyer
    order_id = _checkout_order(client)["orderId"]
    feature_flags.persist_flag("enable_payments_checkout", False, reason="incident drill", actor_user_id=None)
    try:
        blocked = client.post("/api/v1/payments/checkout/order", json={"sku": "jadhagam_report"}, headers=_csrf())
        assert blocked.status_code == 503
        # Money already taken still counts.
        _post_webhook(client, _event("order.paid", payment=_payment(order_id, 9900), order={"id": order_id}))
        assert _credits(user.user_id, "jadhagam_report") == 1
    finally:
        feature_flags.clear_persisted_flag("enable_payments_checkout", reason="drill over", actor_user_id=None)


def test_without_keys_checkout_is_unavailable(buyer, monkeypatch):
    client, _ = buyer
    monkeypatch.setattr(payments_api, "get_razorpay_client", lambda: None)
    response = client.post("/api/v1/payments/checkout/order", json={"sku": "jadhagam_report"}, headers=_csrf())
    assert response.status_code == 503
