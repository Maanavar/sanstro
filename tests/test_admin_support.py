"""The support console (admin spec L9, launch cut).

Structural coverage — audited, reason required, permission per role, not
elevated — is held by `test_admin_audit.py`, `test_admin_permissions.py` and
`test_admin_elevation.py`, which discover these routes by walking the app. This
file is about what the routes *do*.

Blind spots, deliberately:
- The reset email is checked as far as the enqueue call. Whether the provider
  delivers it is not something a test can hold.
- The masked family view, the audited birth-data reveal, support notes and the
  Sentry link are deferred per plan §5; nothing here covers them, and the
  support read asserts birth data is *absent* so it cannot quietly become the
  back door the reveal is meant to gate.
- Nothing drives the web console. The panel is covered by its own component
  test.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import pytest

from app.core.auth import ADMIN_ELEVATION_HEADER, create_admin_elevation_token, get_current_user
from app.main import app
from app.models.admin_mfa import AdminMfaCredential
from app.models.entitlement import Entitlement
from app.models.payment import CreditLedgerEntry, Order, Payment, Product, Refund
from app.models.subscription import Subscription
from app.models.user import User
from tests.conftest import SessionLocal, grant_service_consent

#: A confirmed TOTP secret, so the real MFA guard lets the request through.
_SECRET = "JBSWY3DPEHPK3PXP"


# ── Fixtures ──────────────────────────────────────────────────────────────────


def _make_admin(role: str) -> User:
    """A real admin row with a confirmed second factor, plus a detached stub.

    The stub is what `get_current_user` is overridden with, so everything above
    it — the MFA guard, `admin_role_of`, `require_permission` — is the real
    chain. Overriding `get_admin_user` instead would skip the permission check,
    which is precisely what the support-versus-owner cases below are about.
    """
    user_id = uuid4()
    email = f"{role}-{uuid4().hex[:8]}@example.invalid"
    with SessionLocal() as session, session.begin():
        user = User(
            user_id=user_id,
            email=email,
            is_admin=True,
            admin_role=role,
            email_verified_at=datetime.now(UTC),
        )
        session.add(user)
        session.flush()
        grant_service_consent(session, user)
        session.add(
            AdminMfaCredential(user_id=user_id, totp_secret=_SECRET, confirmed_at=datetime.now(UTC))
        )
    return User(
        user_id=user_id, email=email, is_admin=True, admin_role=role, token_version=0
    )


def _make_customer(session, *, email: str | None = "customer@example.test") -> User:
    user = User(email=email)
    session.add(user)
    session.flush()
    grant_service_consent(session, user)
    return user


@pytest.fixture()
def owner(raw_client):
    stub = _make_admin("owner")
    app.dependency_overrides[get_current_user] = lambda: stub
    yield stub
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture()
def support(raw_client):
    stub = _make_admin("support")
    app.dependency_overrides[get_current_user] = lambda: stub
    yield stub
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture()
def customer(raw_client):
    with SessionLocal() as session, session.begin():
        user = _make_customer(session)
        return User(user_id=user.user_id, email=user.email)


def _as(_client, admin: User) -> dict[str, str]:
    """The elevation header for this admin; the fixture already signed them in."""
    token, _expiry = create_admin_elevation_token(admin)
    return {ADMIN_ELEVATION_HEADER: token, "User-Agent": "support-test/1.0"}


def _reload(user_id: UUID) -> User:
    with SessionLocal() as session:
        row = session.get(User, user_id)
        assert row is not None
        session.expunge(row)
        return row


# ── The read ──────────────────────────────────────────────────────────────────


def test_the_support_view_answers_who_and_what_they_paid_for(raw_client, owner, customer):
    with SessionLocal() as session, session.begin():
        session.add(Product(sku="report_career", kind="one_time", name_en="Career report", name_ta="Career report", price_inr_paise=49900, active=True))
        session.flush()
        order = Order(
            user_id=customer.user_id,
            sku="report_career",
            provider_order_id="order_SyntheticOne",
            amount_paise=49900,
            status="paid",
            paid_at=datetime.now(UTC),
        )
        session.add(order)
        session.flush()
        session.add(
            Payment(
                order_id=order.id,
                provider_payment_id="pay_SyntheticOne",
                method="upi",
                amount_paise=49900,
                status="captured",
                captured_at=datetime.now(UTC),
            )
        )
        session.add(
            Entitlement(
                user_id=customer.user_id,
                key="premium",
                source="purchase",
                source_id=str(order.id),
                starts_at=datetime.now(UTC) - timedelta(days=1),
                ends_at=datetime.now(UTC) + timedelta(days=30),
            )
        )
        session.add(
            CreditLedgerEntry(
                user_id=customer.user_id,
                credit_key="ask_question",
                delta=10,
                source="purchase",
                idempotency_key=f"order:{order.id}",
            )
        )

    headers = _as(raw_client, owner)
    response = raw_client.get(f"/api/v1/admin/users/{customer.user_id}/support", headers=headers)

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["account"]["email"] == "customer@example.test"
    assert body["access"]["state"] == "premium"
    assert body["access"]["sources"] == ["purchase"]
    assert [e["key"] for e in body["entitlements"]] == ["premium"]
    assert body["entitlements"][0]["is_active"] is True
    assert [o["provider_order_id"] for o in body["orders"]] == ["order_SyntheticOne"]
    assert [p["provider_payment_id"] for p in body["payments"]] == ["pay_SyntheticOne"]
    assert body["credits"] == [{"credit_key": "ask_question", "balance": 10}]
    assert body["consents"]["service"] is True


def test_the_support_view_carries_no_birth_data(raw_client, owner, customer):
    # The masked view and the audited reveal are deferred (plan §5). Until they
    # exist, this route must not be the way round them.
    headers = _as(raw_client, owner)
    body = raw_client.get(
        f"/api/v1/admin/users/{customer.user_id}/support", headers=headers
    ).json()

    serialized = str(body).lower()
    for forbidden in ("birth", "nakshatra", "rasi", "latitude", "longitude", "date_of_birth"):
        assert forbidden not in serialized, forbidden


def test_an_active_subscription_shows_premium_even_with_no_entitlement_row(
    raw_client, owner, customer
):
    # `limits_for_user` unions entitlements with an active subscription. A
    # support page that read only the entitlement half would tell an agent
    # "free" about an account the app is treating as premium — the exact
    # contradiction a billing ticket starts from.
    with SessionLocal() as session, session.begin():
        session.add(
            Subscription(
                user_id=customer.user_id,
                tier="premium",
                status="active",
                provider="razorpay",
                provider_subscription_id="sub_SyntheticOne",
                current_period_end=datetime.now(UTC) + timedelta(days=20),
            )
        )

    headers = _as(raw_client, owner)
    body = raw_client.get(
        f"/api/v1/admin/users/{customer.user_id}/support", headers=headers
    ).json()

    assert body["access"]["state"] == "premium"
    assert "subscription" in body["access"]["sources"]
    assert body["subscriptions"][0]["provider_subscription_id"] == "sub_SyntheticOne"


def test_an_unknown_account_is_a_404(raw_client, owner):
    headers = _as(raw_client, owner)
    response = raw_client.get(f"/api/v1/admin/users/{uuid4()}/support", headers=headers)
    assert response.status_code == 404


# ── Search by provider id ─────────────────────────────────────────────────────


def _search(client, admin: User, term: str) -> list[str]:
    headers = _as(client, admin)
    response = client.get("/api/v1/admin/users", params={"search": term}, headers=headers)
    assert response.status_code == 200, response.text
    return [item["user_id"] for item in response.json()["items"]]


@pytest.fixture()
def paid_customer(raw_client):
    """A customer with an order, a payment, a refund and a subscription."""
    with SessionLocal() as session, session.begin():
        user = _make_customer(session, email="payer@example.test")
        session.add(Product(sku="report_marriage", kind="one_time", name_en="Marriage report", name_ta="Marriage report", price_inr_paise=99900, active=True))
        session.flush()
        order = Order(
            user_id=user.user_id,
            sku="report_marriage",
            provider_order_id="order_FindMe",
            amount_paise=99900,
            status="paid",
        )
        subscription = Subscription(
            user_id=user.user_id,
            tier="premium",
            status="active",
            provider="razorpay",
            provider_subscription_id="sub_FindMe",
        )
        session.add_all([order, subscription])
        session.flush()
        payment = Payment(
            order_id=order.id,
            provider_payment_id="pay_FindMe",
            method="upi",
            amount_paise=99900,
            status="captured",
        )
        session.add(payment)
        session.flush()
        session.add(
            Refund(
                provider_refund_id="rfnd_FindMe",
                payment_id=payment.id,
                provider_payment_id="pay_FindMe",
                amount_paise=99900,
                status="processed",
            )
        )
        # A detached copy: anything returned from inside `session.begin()` is
        # unbound once the block exits, and reading an attribute off it raises.
        return User(user_id=user.user_id, email=user.email)


@pytest.mark.parametrize("term", ["order_FindMe", "pay_FindMe", "sub_FindMe", "rfnd_FindMe"])
def test_search_finds_the_account_behind_a_razorpay_id(raw_client, owner, paid_customer, term):
    # What a customer actually pastes into a support ticket. Before L9 the only
    # way in was the email address — which is what someone who paid from a
    # different address does not have.
    assert _search(raw_client, owner, term) == [str(paid_customer.user_id)]


def test_search_finds_the_account_by_its_own_id(raw_client, owner, customer):
    assert _search(raw_client, owner, str(customer.user_id)) == [str(customer.user_id)]


def test_search_still_matches_part_of_an_email(raw_client, owner, customer):
    assert str(customer.user_id) in _search(raw_client, owner, "customer@")


def test_an_unknown_razorpay_id_finds_nobody_rather_than_everybody(raw_client, owner, customer):
    # The clause must stay a provider lookup. Falling through to an email
    # `ilike '%pay_Nothing%'` would also return nothing — and look identical —
    # but falling through to *no* clause would list every account.
    assert _search(raw_client, owner, "pay_NothingHere") == []


def test_the_audit_row_records_how_a_search_matched_and_not_what_was_typed(
    raw_client, owner, paid_customer
):
    from app.models.admin_audit_log import AdminAuditLog

    _search(raw_client, owner, "order_FindMe")

    with SessionLocal() as session:
        row = (
            session.query(AdminAuditLog)
            .filter(AdminAuditLog.action == "list_users")
            .order_by(AdminAuditLog.created_at.desc())
            .first()
        )
        assert row is not None
        assert row.details["matched_by"] == "provider_id"
        assert "order_FindMe" not in str(row.details)


# ── Actions ───────────────────────────────────────────────────────────────────


def test_a_reset_link_is_emailed_and_never_returned(raw_client, owner, customer, monkeypatch):
    sent: list[tuple[str, str]] = []

    import app.services.email_service as email_service

    monkeypatch.setattr(
        email_service,
        "enqueue_password_reset_email",
        lambda _tasks, address, token: sent.append((address, token)),
    )

    headers = _as(raw_client, owner)
    response = raw_client.post(
        f"/api/v1/admin/users/{customer.user_id}/reset-link",
        json={"reason": "caller cannot sign in after changing phone"},
        headers=headers,
    )

    assert response.status_code == 200, response.text
    assert sent and sent[0][0] == "customer@example.test"
    # The token is the account. An agent who could read it could take the
    # account over, and an audit row records that afterwards rather than
    # preventing it (ARC-40).
    assert sent[0][1] not in response.text
    assert "token" not in response.json()


def test_a_google_only_account_is_told_there_is_nothing_to_send(raw_client, owner):
    with SessionLocal() as session, session.begin():
        user = _make_customer(session, email=None)
        user_id = user.user_id

    headers = _as(raw_client, owner)
    response = raw_client.post(
        f"/api/v1/admin/users/{user_id}/reset-link",
        json={"reason": "caller asked for a reset"},
        headers=headers,
    )

    assert response.status_code == 422
    assert "no email address" in response.text


def test_force_logout_bumps_the_token_version_and_revokes_refresh_tokens(
    raw_client, owner, customer
):
    from app.models.refresh_token import RefreshToken

    with SessionLocal() as session, session.begin():
        session.add(
            RefreshToken(
                user_id=customer.user_id,
                token_hash="synthetic-hash",
                expires_at=datetime.now(UTC) + timedelta(days=30),
            )
        )

    before = _reload(customer.user_id).token_version or 0
    headers = _as(raw_client, owner)
    response = raw_client.post(
        f"/api/v1/admin/users/{customer.user_id}/force-logout",
        json={"reason": "caller reports a shared device"},
        headers=headers,
    )

    assert response.status_code == 200, response.text
    assert (_reload(customer.user_id).token_version or 0) == before + 1

    with SessionLocal() as session:
        token = session.query(RefreshToken).filter(RefreshToken.user_id == customer.user_id).one()
        # Without this the next refresh would mint a session this just ended.
        assert token.revoked_at is not None


def test_a_courtesy_grant_is_a_real_entitlement_that_grants_access(raw_client, support, customer):
    headers = _as(raw_client, support)
    response = raw_client.post(
        f"/api/v1/admin/users/{customer.user_id}/entitlements",
        json={"key": "premium", "days": 14, "reason": "goodwill after a failed report delivery"},
        headers=headers,
    )

    assert response.status_code == 200, response.text
    granted = response.json()
    assert granted["source"] == "grant"
    assert granted["is_active"] is True

    # Through the same reader the app uses, not by re-reading the row.
    from app.core.entitlement_access import entitlement_access

    with SessionLocal() as session:
        assert entitlement_access(session, customer.user_id).state == "premium"


def test_support_cannot_grant_more_than_thirty_days(raw_client, support, customer):
    headers = _as(raw_client, support)
    response = raw_client.post(
        f"/api/v1/admin/users/{customer.user_id}/entitlements",
        json={"key": "premium", "days": 31, "reason": "caller asked for a year"},
        headers=headers,
    )

    assert response.status_code == 403
    assert "30 days" in response.text

    with SessionLocal() as session:
        assert session.query(Entitlement).filter(Entitlement.user_id == customer.user_id).count() == 0


def test_an_owner_may_grant_longer(raw_client, owner, customer):
    headers = _as(raw_client, owner)
    response = raw_client.post(
        f"/api/v1/admin/users/{customer.user_id}/entitlements",
        json={"key": "premium", "days": 365, "reason": "founding member, agreed off-platform"},
        headers=headers,
    )

    assert response.status_code == 200, response.text


def test_an_unknown_key_is_refused_rather_than_granted_into_the_void(raw_client, owner, customer):
    # `limits_for_user` only knows "premium". A free-text key would store a row
    # that reads like access and grants none.
    headers = _as(raw_client, owner)
    response = raw_client.post(
        f"/api/v1/admin/users/{customer.user_id}/entitlements",
        json={"key": "platinum", "days": 7, "reason": "caller asked for platinum"},
        headers=headers,
    )

    assert response.status_code == 422
    assert "premium" in response.text


def test_revoking_ends_access_and_keeps_the_row(raw_client, owner, customer):
    headers = _as(raw_client, owner)
    granted = raw_client.post(
        f"/api/v1/admin/users/{customer.user_id}/entitlements",
        json={"key": "premium", "days": 30, "reason": "goodwill"},
        headers=headers,
    ).json()

    response = raw_client.post(
        f"/api/v1/admin/users/{customer.user_id}/entitlements/{granted['id']}/revoke",
        json={"reason": "granted to the wrong account"},
        headers=headers,
    )

    assert response.status_code == 200, response.text

    from app.core.entitlement_access import entitlement_access

    with SessionLocal() as session:
        row = session.get(Entitlement, UUID(granted["id"]))
        # The row is the record of why access existed on a given day, which a
        # refund argument reads backwards.
        assert row is not None
        assert row.revoked_at is not None
        assert row.revoked_reason == "granted to the wrong account"
        assert entitlement_access(session, customer.user_id).state == "free"


def test_revoking_twice_is_refused(raw_client, owner, customer):
    headers = _as(raw_client, owner)
    granted = raw_client.post(
        f"/api/v1/admin/users/{customer.user_id}/entitlements",
        json={"key": "premium", "days": 30, "reason": "goodwill"},
        headers=headers,
    ).json()
    path = f"/api/v1/admin/users/{customer.user_id}/entitlements/{granted['id']}/revoke"

    assert raw_client.post(path, json={"reason": "mistake"}, headers=headers).status_code == 200
    assert raw_client.post(path, json={"reason": "mistake"}, headers=headers).status_code == 409


def test_an_entitlement_belonging_to_someone_else_is_not_revocable_through_this_account(
    raw_client, owner, customer
):
    # The id is a UUID in the path. Without the owner check, knowing one id
    # would let an agent revoke any account's access through any other path.
    with SessionLocal() as session, session.begin():
        other = _make_customer(session, email="other@example.test")
        row = Entitlement(
            user_id=other.user_id,
            key="premium",
            source="purchase",
            starts_at=datetime.now(UTC),
            ends_at=datetime.now(UTC) + timedelta(days=30),
        )
        session.add(row)
        session.flush()
        entitlement_id = row.id

    headers = _as(raw_client, owner)
    response = raw_client.post(
        f"/api/v1/admin/users/{customer.user_id}/entitlements/{entitlement_id}/revoke",
        json={"reason": "wrong account"},
        headers=headers,
    )

    assert response.status_code == 404

    with SessionLocal() as session:
        assert session.get(Entitlement, entitlement_id).revoked_at is None
