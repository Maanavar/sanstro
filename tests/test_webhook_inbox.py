"""A05 — billing events must not overwrite newer subscription state (P1).

`webhooks.py` read the event type and expiry and applied them straight to the
first subscription row it found for the user. It recorded no event identity and
no event timestamp, so it had nothing to decide with: a renewal followed by an
older expiration marked a renewed subscription inactive, and the audit
reproduced that transition even though both payloads carried timestamps.

A webhook is a message *about* something that happened. Delivery order is not
authoritative, and RevenueCat's own documentation states that retries reuse the
same `id` and `event_timestamp_ms` — so duplicate delivery is a contract
guarantee to design for, not an edge case.

Two further things the old handler got wrong, both confirmed against the
provider's documented field list:

  - it stored `product_id` in a column named `provider_subscription_id`. A SKU
    identifies a *product*, not a user's distinct subscription history;
    `original_transaction_id` is the store subscription identity.
  - it resolved the account from `app_user_id` alone. RevenueCat also sends
    `original_app_user_id` and `aliases`, which is exactly how a purchase made
    under an anonymous id reaches the right account.

The subscriptions table was empty when this was written (0 rows in
`vinaadi_dev`, 0 duplicate user_ids), so correcting the misnamed write and
adding a uniqueness constraint carried no backfill and no duplicate-resolution
policy. That was checked, not assumed — the guide's caution about a uniqueness
migration presumes rows exist.

WHAT THIS SUITE CANNOT SEE:
  - concurrent delivery of two initial events. These tests are sequential; the
    unique index on (provider, provider_subscription_id) is what makes the
    select-then-insert race lose cleanly, and that is asserted structurally
    rather than by racing two sessions.
  - real provider retry timing, signature rotation, or the store's own
    semantics for refunds and product changes.
  - entitlement *reconciliation* against RevenueCat's current state (A05 step
    7). This handler still derives entitlement from the event stream alone; a
    missed event is not recovered by anything here.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.subscription import Subscription
from app.models.user import User
from app.models.webhook_event import WebhookEvent

WEBHOOK_URL = "/api/v1/webhooks/revenuecat"
SECRET = "synthetic-webhook-secret-for-tests"  # noqa: S105 — synthetic, not a real credential


@pytest.fixture(autouse=True)
def _configured_secret(monkeypatch):
    """The endpoint 503s when no secret is configured; give it a synthetic one."""
    settings = get_settings()
    monkeypatch.setattr(settings, "revenuecat_webhook_secret", SECRET, raising=False)
    return SECRET


@pytest.fixture()
def account(raw_client):
    """A synthetic user with no subscription row yet."""
    user_id = uuid4()
    with SessionLocal() as setup, setup.begin():
        setup.add(User(user_id=user_id, email=f"billing-{uuid4().hex}@example.invalid"))
    return user_id


def _event(
    *,
    app_user_id,
    event_type: str,
    event_id: str | None = None,
    timestamp: datetime | None = None,
    expiry: datetime | None = None,
    product_id: str = "premium_monthly",
    original_transaction_id: str | None = "txn-original-1",
    aliases: list[str] | None = None,
    original_app_user_id: str | None = None,
) -> dict:
    """A RevenueCat webhook body, using the provider's documented field names."""
    at = timestamp or datetime.now(UTC)
    body: dict = {
        "event": {
            "id": event_id or f"evt-{uuid4().hex}",
            "type": event_type,
            "event_timestamp_ms": int(at.timestamp() * 1000),
            "app_user_id": str(app_user_id),
            "product_id": product_id,
        }
    }
    if expiry is not None:
        body["event"]["expiration_at_ms"] = int(expiry.timestamp() * 1000)
    if original_transaction_id is not None:
        body["event"]["original_transaction_id"] = original_transaction_id
    if aliases is not None:
        body["event"]["aliases"] = aliases
    if original_app_user_id is not None:
        body["event"]["original_app_user_id"] = original_app_user_id
    return body


def _post(client, body: dict):
    return client.post(WEBHOOK_URL, json=body, headers={"Authorization": f"Bearer {SECRET}"})


def _subscription(user_id):
    with SessionLocal() as session:
        return session.query(Subscription).filter(Subscription.user_id == user_id).one_or_none()


def _inbox_rows(event_id: str | None = None):
    with SessionLocal() as session:
        query = session.query(WebhookEvent)
        if event_id is not None:
            query = query.filter(WebhookEvent.event_id == event_id)
        return query.all()


class TestOrdering:
    def test_an_older_expiration_does_not_deactivate_a_newer_renewal(self, raw_client, account):
        """The headline failure: renewal, then a late-arriving older expiry."""
        now = datetime.now(UTC)
        renewal = _post(
            raw_client,
            _event(
                app_user_id=account,
                event_type="RENEWAL",
                timestamp=now,
                expiry=now + timedelta(days=30),
            ),
        )
        assert renewal.status_code == 200, renewal.text
        assert _subscription(account).status == "active"

        stale = _post(
            raw_client,
            _event(
                app_user_id=account,
                event_type="EXPIRATION",
                timestamp=now - timedelta(hours=1),
                expiry=now,
            ),
        )
        assert stale.status_code == 200
        assert stale.json()["status"] == "stale"

        subscription = _subscription(account)
        assert subscription.status == "active", (
            "an event older than the one already applied revoked a live entitlement"
        )

    def test_a_newer_expiration_is_applied(self, raw_client, account):
        # The guard must not simply refuse everything: a genuinely newer
        # expiration still ends the subscription.
        now = datetime.now(UTC)
        _post(raw_client, _event(app_user_id=account, event_type="RENEWAL", timestamp=now, expiry=now + timedelta(days=30)))

        later = _post(
            raw_client,
            _event(app_user_id=account, event_type="EXPIRATION", timestamp=now + timedelta(days=1), expiry=now + timedelta(days=1)),
        )

        assert later.status_code == 200
        assert later.json()["status"] == "ok"
        assert _subscription(account).status == "inactive"

    def test_an_event_with_the_same_timestamp_is_applied(self, raw_client, account):
        # Equal timestamps are not stale. Refusing them would drop a legitimate
        # second event delivered within the same millisecond.
        now = datetime.now(UTC)
        _post(raw_client, _event(app_user_id=account, event_type="RENEWAL", timestamp=now, expiry=now + timedelta(days=30)))
        same = _post(raw_client, _event(app_user_id=account, event_type="EXPIRATION", timestamp=now, expiry=now))
        assert same.json()["status"] == "ok"
        assert _subscription(account).status == "inactive"


class TestIdempotency:
    def test_a_redelivered_event_is_accepted_once(self, raw_client, account):
        """Retries reuse the same `id`, per the provider's documentation."""
        now = datetime.now(UTC)
        body = _event(
            app_user_id=account,
            event_type="INITIAL_PURCHASE",
            event_id="evt-retried-once",
            timestamp=now,
            expiry=now + timedelta(days=30),
        )

        first = _post(raw_client, body)
        second = _post(raw_client, body)

        assert first.status_code == 200
        assert first.json()["status"] == "ok"
        # 200, not an error: the provider has delivered successfully and must
        # not be told to keep retrying.
        assert second.status_code == 200
        assert second.json()["status"] == "duplicate"

        assert len(_inbox_rows("evt-retried-once")) == 1
        with SessionLocal() as session:
            assert session.query(Subscription).filter(Subscription.user_id == account).count() == 1

    def test_a_duplicate_cannot_reapply_a_superseded_state(self, raw_client, account):
        # The dangerous shape: expiry, then renewal, then the expiry redelivered.
        now = datetime.now(UTC)
        expire_body = _event(
            app_user_id=account,
            event_type="EXPIRATION",
            event_id="evt-expiry-1",
            timestamp=now,
            expiry=now,
        )
        _post(raw_client, _event(app_user_id=account, event_type="INITIAL_PURCHASE", timestamp=now - timedelta(days=1), expiry=now + timedelta(days=30)))
        _post(raw_client, expire_body)
        assert _subscription(account).status == "inactive"

        _post(raw_client, _event(app_user_id=account, event_type="RENEWAL", timestamp=now + timedelta(minutes=5), expiry=now + timedelta(days=30)))
        assert _subscription(account).status == "active"

        redelivered = _post(raw_client, expire_body)

        assert redelivered.json()["status"] == "duplicate"
        assert _subscription(account).status == "active"

    def test_an_event_without_an_id_is_still_deduplicated(self, raw_client, account):
        """The provider documents `id` as always present; this is the fallback.

        Rejecting such an event would drop it permanently — RevenueCat retries
        5xx, not 4xx — and minting a fresh UUID would make every redelivery
        look new. A content-derived key does neither, and the existing
        `test_revenuecat_webhook.py` fixtures (written against a handler that
        never read `id`) exercise this path, which is how it was found.
        """
        now = datetime.now(UTC)
        body = _event(
            app_user_id=account,
            event_type="INITIAL_PURCHASE",
            timestamp=now,
            expiry=now + timedelta(days=30),
        )
        del body["event"]["id"]

        first = _post(raw_client, body)
        second = _post(raw_client, body)

        assert first.json()["status"] == "ok"
        assert second.json()["status"] == "duplicate", (
            "a redelivery of an id-less event must still be recognised"
        )

        derived = [row for row in _inbox_rows() if row.event_id.startswith("derived:")]
        assert len(derived) == 1

    def test_two_different_id_less_events_are_not_collapsed(self, raw_client, account):
        # The fallback must not be so coarse that distinct events dedupe into
        # one. Differing timestamps are enough to separate them.
        now = datetime.now(UTC)
        first_body = _event(app_user_id=account, event_type="INITIAL_PURCHASE", timestamp=now, expiry=now + timedelta(days=30))
        second_body = _event(
            app_user_id=account,
            event_type="RENEWAL",
            timestamp=now + timedelta(days=30),
            expiry=now + timedelta(days=60),
        )
        del first_body["event"]["id"]
        del second_body["event"]["id"]

        assert _post(raw_client, first_body).json()["status"] == "ok"
        assert _post(raw_client, second_body).json()["status"] == "ok"

    def test_every_accepted_event_is_recorded(self, raw_client, account):
        now = datetime.now(UTC)
        _post(raw_client, _event(app_user_id=account, event_type="INITIAL_PURCHASE", event_id="evt-a", timestamp=now, expiry=now + timedelta(days=30)))
        _post(raw_client, _event(app_user_id=account, event_type="RENEWAL", event_id="evt-b", timestamp=now + timedelta(days=30), expiry=now + timedelta(days=60)))

        assert {row.event_id for row in _inbox_rows()} >= {"evt-a", "evt-b"}


class TestIdentity:
    def test_the_subscription_records_the_store_subscription_not_the_sku(self, raw_client, account):
        now = datetime.now(UTC)
        _post(
            raw_client,
            _event(
                app_user_id=account,
                event_type="INITIAL_PURCHASE",
                timestamp=now,
                expiry=now + timedelta(days=30),
                product_id="premium_annual",
                original_transaction_id="txn-original-99",
            ),
        )

        subscription = _subscription(account)
        assert subscription.provider_subscription_id == "txn-original-99"
        assert subscription.provider_product_id == "premium_annual"

    def test_an_account_is_resolvable_through_an_alias(self, raw_client, account):
        # The A04 scenario from the other side: a purchase made while the SDK
        # held an anonymous id still has to reach the right account.
        now = datetime.now(UTC)
        response = _post(
            raw_client,
            _event(
                app_user_id="$RCAnonymousID:abc123",
                original_app_user_id="$RCAnonymousID:abc123",
                aliases=["$RCAnonymousID:abc123", str(account)],
                event_type="INITIAL_PURCHASE",
                timestamp=now,
                expiry=now + timedelta(days=30),
            ),
        )

        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert _subscription(account) is not None

    def test_an_unresolvable_account_is_recorded_rather_than_dropped(self, raw_client):
        # "Unknown users should have an explicit observable disposition." The
        # old handler returned {"status": "ignored"} and kept nothing, so a
        # purchase by an account the backend could not resolve left no trace to
        # reconcile from.
        now = datetime.now(UTC)
        response = _post(
            raw_client,
            _event(
                app_user_id=str(uuid4()),
                event_type="INITIAL_PURCHASE",
                event_id="evt-unknown-user",
                timestamp=now,
                expiry=now + timedelta(days=30),
            ),
        )

        assert response.status_code == 200
        assert response.json()["status"] == "unresolved"
        rows = _inbox_rows("evt-unknown-user")
        assert len(rows) == 1
        assert rows[0].status == "unresolved"


class TestUnchangedSemantics:
    def test_cancellation_still_runs_to_the_period_end(self, raw_client, account):
        """Preserve the existing paid-period cancellation semantics.

        Turning off auto-renew leaves the paid period running; ending premium
        on the event cut paying users off early, and that was deliberately
        fixed before. A05 must not undo it.
        """
        now = datetime.now(UTC)
        period_end = now + timedelta(days=20)
        _post(raw_client, _event(app_user_id=account, event_type="INITIAL_PURCHASE", timestamp=now, expiry=period_end))

        _post(
            raw_client,
            _event(app_user_id=account, event_type="CANCELLATION", timestamp=now + timedelta(minutes=1), expiry=period_end),
        )

        subscription = _subscription(account)
        assert subscription.status == "active", "cancellation must not deactivate before the period end"
        assert subscription.current_period_end is not None

    def test_an_unhandled_event_type_is_still_ignored(self, raw_client, account):
        response = _post(raw_client, _event(app_user_id=account, event_type="SUBSCRIBER_ALIAS"))
        assert response.status_code == 200
        assert response.json()["status"] == "ignored"

    def test_a_bad_secret_is_still_rejected(self, raw_client, account):
        response = raw_client.post(
            WEBHOOK_URL,
            json=_event(app_user_id=account, event_type="RENEWAL"),
            headers={"Authorization": "Bearer wrong"},
        )
        assert response.status_code == 401

    def test_an_unparseable_body_is_still_a_400(self, raw_client):
        response = raw_client.post(
            WEBHOOK_URL, content=b"{not json", headers={"Authorization": f"Bearer {SECRET}"}
        )
        assert response.status_code == 400
