"""Erasure, export and tombstones (admin spec L5).

Acceptance, as the spec words it: one row in every user-owned table, erased via
each route; zero personal rows remain and per-table counts are audited; a CI
check fails when a model referencing a user is missing from the registry.

Layers:

1. Registry coverage (no DB). Every table that references `users` — by foreign
   key, through another table, or by a `*user_id` column without one — has a
   registry entry; every entry names a real table, once per key.
2. Erase everything, via `DELETE /auth/me` and via the console. The seed puts at
   least one row in every registry store (asserted: a store added without a
   seed row fails here). Each seeded row is then checked by primary key, not by
   the store's own `where`: a delete run in the wrong order orphans a SET NULL
   child, which the `where` can no longer see but the primary key still finds.
   Includes the payment whose only parent is a subscription, which made every
   such account undeletable before migration bc1d2e3f4a5b.
3. Refusals: an admin role, a renewing Razorpay subscription, the console
   erasing its own operator. Nothing is touched.
4. Export: the person's rows, decrypted, without secrets; the console's export
   is elevated, reasoned and audited.
5. Tombstones: a restored backup that brings an erased account back is erased
   again by replay, under the same pseudonym, and a second replay does nothing.

BLIND SPOTS (CLAUDE.md "a gate proves its own check"):
- Layer 1 sees tables and columns, not personal data copied into a column of
  an unrelated table (a free-text field holding someone's email).
- External processors (PostHog, Sentry, Zoho, ...) are manual steps: the test
  checks they are listed, not that anyone did them.
- Audit rows written before L5 may hold an email in `payload_summary` or
  `details`; the append-only trigger forbids rewriting those columns.
"""
from __future__ import annotations

import hashlib
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

import pytest
from sqlalchemy import inspect, text

import app.models as models
from app.core.auth import ADMIN_ELEVATION_HEADER, create_admin_elevation_token, get_current_user
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import SessionLocal
from app.main import app
from app.models.admin_audit_log import AdminAuditLog
from app.models.erasure_tombstone import ErasureTombstone
from app.privacy.erasure import pseudonym_for
from app.privacy.registry import EXTERNAL_STORES, TABLE_STORES, registered_tables
from app.privacy.tombstones import export_tombstones, replay
from app.services import feature_flags

_CSRF = {"X-Vinaadi-CSRF": "1"}
_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"  # noqa: S105 — synthetic test value
_STORES = {store.key: store for store in TABLE_STORES}


# ── 1. Registry coverage ─────────────────────────────────────────────────────


def _tables_reaching_users() -> set[str]:
    """Tables with a path of foreign keys to `users`, or a `*user_id` column without one."""
    reach = {"users"}
    changed = True
    while changed:
        changed = False
        for table in Base.metadata.tables.values():
            if table.name in reach:
                continue
            if any(fk.column.table.name in reach for fk in table.foreign_keys):
                reach.add(table.name)
                changed = True
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if column.name.endswith("user_id") and not column.foreign_keys and table.name != "users":
                reach.add(table.name)
    return reach


#: Tables the walk finds that are deliberately not personal-data stores.
_NOT_A_STORE = {
    "erasure_tombstones": "The erasure record itself: an id that outlives the account so a restore can replay it.",
}


@pytest.mark.no_db
def test_every_table_that_reaches_a_user_is_in_the_registry():
    missing = _tables_reaching_users() - registered_tables() - set(_NOT_A_STORE)
    assert not missing, (
        f"add these to app/privacy/registry.py TABLE_STORES (what they hold, how erasure treats them): {sorted(missing)}"
    )


@pytest.mark.no_db
def test_the_coverage_walk_is_not_vacuous():
    """Every assertion above is vacuous if the walk finds nothing. An exact count,
    so a walk that quietly loses tables fails: 48 on 2026-11-05 (47 registered
    tables it can reach, plus erasure_tombstones; newsletter_subscribers is
    registered but reachable only by email). Was 46 until `job_runs` arrived
    with L10b, then 47 until `reports` arrived with report delivery — this count
    going up is what adding a table looks like."""
    found = _tables_reaching_users()
    assert {"users", "charts", "chart_planets", "payments", "refunds", "webhook_events", "erasure_tombstones"} <= found
    assert len(found) == 48, sorted(found)


@pytest.mark.no_db
def test_registry_entries_name_real_tables_once():
    keys = [store.key for store in TABLE_STORES]
    assert len(keys) == len(set(keys))
    assert registered_tables() <= set(Base.metadata.tables)
    for store in TABLE_STORES:
        assert (store.erase == "detach") == (store.detach_set is not None), store.key
    assert TABLE_STORES[-1].key == "users", "the account row must go last"
    assert len({store.key for store in EXTERNAL_STORES}) == len(EXTERNAL_STORES)


# ── Seed: one row in every registry store ────────────────────────────────────


def _new_user(session, email: str, **fields: Any) -> UUID:
    user_id = uuid4()
    session.add(models.User(user_id=user_id, email=email, **fields))
    session.flush()
    return user_id


def _seed_everything() -> tuple[UUID, str, dict[str, list[Any]]]:
    """A synthetic person with a row in every store, and the identity of each row."""
    now = datetime.now(UTC)
    email = f"erase-{uuid4().hex}@example.invalid"
    seeded: dict[str, list[Any]] = {}

    def add(key: str, session, obj: Any) -> Any:
        session.add(obj)
        session.flush()
        seeded.setdefault(key, []).append(obj)
        return obj

    with SessionLocal() as session, session.begin():
        uid = _new_user(session, email)
        other = _new_user(session, f"other-{uuid4().hex}@example.invalid")
        seeded["users"] = [session.get(models.User, uid)]

        profile = add("birth_profiles", session, models.BirthProfile(
            owner_user_id=uid, display_name="Synthetic Person", birth_date_local=date(1990, 1, 1),
            birth_place="Synthetic Town", birth_latitude=13.0, birth_longitude=80.0, birth_timezone="Asia/Kolkata",
        ))
        chart = add("charts", session, models.Chart(
            birth_profile_id=profile.birth_profile_id, calculation_version="test-1", julian_day=2447893.0,
            lagna_rasi="MESHA", lagna_longitude=10.0, moon_rasi="VRISHABHA", janma_nakshatra="ROHINI", janma_pada=1,
        ))
        cid = chart.chart_id
        add("chart_planets", session, models.ChartPlanet(
            chart_id=cid, graha="SURYA", absolute_longitude=120.0, degree_in_rasi=0.0, rasi="SIMHA",
            nakshatra="MAGHA", pada=1, house_from_lagna=5,
        ))
        add("dasha_periods", session, models.DashaPeriod(
            chart_id=cid, level="maha", lord="SURYA", start_jd=Decimal("2447893"), end_jd=Decimal("2450000"),
            start_date=date(1990, 1, 1), end_date=date(1996, 1, 1), sequence_index=0,
        ))
        add("varga_positions", session, models.VargaPosition(
            chart_id=cid, varga_code="D9", graha="SURYA", rasi="MESHA", calculation_method="parashara",
        ))
        add("peyarchi_alerts", session, models.PeyarchiAlert(
            chart_id=cid, planet="GURU", from_rasi="MESHA", to_rasi="VRISHABHA",
            peyarchi_date=date(2026, 5, 1), peyarchi_utc=now,
        ))
        life_event = add("user_life_events", session, models.UserLifeEvent(
            chart_id=cid, event_type="marriage", event_date=date(2015, 2, 1),
        ))
        add("prediction_log", session, models.PredictionLog(
            chart_id=cid, source="daily", life_area="career", band="good", calc_version="test-1",
            outcome_event_id=life_event.id,
        ))
        add("user_contexts", session, models.UserContext(owner_user_id=uid, chart_id=cid))
        add("user_goals", session, models.UserGoal(owner_user_id=uid, chart_id=cid, goal_type="career"))
        add("journal_entries", session, models.JournalEntry(
            owner_user_id=uid, chart_id=cid, entry_date=date(2026, 1, 1), note_text="synthetic note",
        ))
        add("retrospective_entries", session, models.RetrospectiveEntry(
            owner_user_id=uid, chart_id=cid, event_date=date(2020, 1, 1), event_type="career",
            event_description="synthetic",
        ))
        add("numerology_name_sessions", session, models.NumerologyNameSession(
            owner_user_id=uid, chart_id=cid, candidate_name="Synthetic", saved_calculation_version="test-1",
        ))
        add("daily_scores", session, models.DailyScore(
            birth_profile_id=profile.birth_profile_id, score_date=date(2026, 1, 1), score=60, label="good", data={},
        ))
        vault = add("family_vaults", session, models.FamilyVault(owner_user_id=uid, name="Synthetic Family"))
        vid = vault.family_vault_id
        member = add("family_members", session, models.FamilyMember(
            owner_user_id=uid, family_vault_id=vid, display_name="Synthetic Member",
        ))
        add("family_daily_scores", session, models.FamilyDailyScore(
            family_vault_id=vid, date_local=date(2026, 1, 1), timezone="Asia/Kolkata", family_score=60,
            family_label="good", aggregate_breakdown={}, member_scores={},
        ))
        add("relationship_alerts", session, models.RelationshipAlert(
            vault_id=vid, member_id=member.family_member_id, trigger_planet="GURU", trigger_type="transit",
            message_en="synthetic", message_ta="synthetic", alert_date=date(2026, 1, 1),
        ))
        for link in ({"chart_id": cid}, {"family_vault_id": vid}):
            add("interpretation_outputs", session, models.InterpretationOutput(
                output_type="daily", language="en", structured_input={}, output_text={"en": "synthetic"}, **link,
            ))
        notification = add("notifications", session, models.Notification(
            user_id=uid, type="GENERAL", priority=50, title="t", body="b", send_at=now,
        ))
        add("notification_deliveries", session, models.NotificationDelivery(
            notification_id=notification.notification_id, channel="push", next_attempt_at=now,
        ))
        add("user_preferences", session, models.UserPreference(owner_user_id=uid))
        add("user_notification_preferences", session, models.UserNotificationPreference(owner_user_id=uid))
        add("user_streaks", session, models.UserStreak(user_id=uid, last_active_date=date(2026, 1, 1)))
        add("consent_records", session, models.ConsentRecord(
            user_id=uid, purpose="analytics", granted=True, notice_version="2026-11", language="en", channel="web",
        ))
        add("life_focus_events", session, models.LifeFocusEvent(
            user_id=uid, intent="SELECT", previous_mode="BALANCED", new_mode="BALANCED", is_first_run=False,
        ))
        add("ask_vinaadi_usage", session, models.AskVinaadiUsage(user_id=uid, usage_date=date(2026, 1, 1)))
        add("porutham_shares", session, models.PoruthamShare(
            owner_user_id=uid, token_hash=uuid4().hex * 2, snapshot={}, expires_at=now + timedelta(days=1),
        ))
        add("device_tokens", session, models.DeviceToken(
            device_id=uuid4().hex, user_id=uid, fcm_token="synthetic-device-token", platform="android",
        ))
        add("feedback", session, models.Feedback(user_id=uid, message="synthetic feedback"))
        add("entitlements", session, models.Entitlement(user_id=uid, key="premium", source="grant", starts_at=now))
        add("credit_ledger", session, models.CreditLedgerEntry(
            user_id=uid, credit_key="ask_question", delta=1, source="grant", idempotency_key=f"seed:{uuid4()}",
        ))
        add("refresh_tokens", session, models.RefreshToken(
            token_hash=uuid4().hex * 2, user_id=uid, expires_at=now + timedelta(days=1),
        ))
        add("password_reset_tokens", session, models.PasswordResetToken(
            user_id=uid, jti_hash=uuid4().hex * 2, expires_at=now + timedelta(minutes=5),
        ))
        add("admin_mfa_credentials", session, models.AdminMfaCredential(user_id=uid, totp_secret=_SECRET))
        add("admin_recovery_codes", session, models.AdminRecoveryCode(user_id=uid, code_hash=uuid4().hex * 2))
        # A different case than the account: the match must ignore it.
        add("newsletter_subscribers", session, models.NewsletterSubscriber(email=email.upper()))

        # Accounting: a renewal paid through a subscription alone (no order) and
        # a one-time order. The first is what made such accounts undeletable.
        if session.get(models.Product, "synthetic_sku") is None:
            session.add(models.Product(
                sku="synthetic_sku", kind="one_time", name_en="Synthetic", name_ta="Synthetic", price_inr_paise=100,
            ))
            session.flush()
        order = add("orders", session, models.Order(
            user_id=uid, sku="synthetic_sku", provider_order_id=f"order_{uuid4().hex[:20]}", amount_paise=100,
        ))
        subscription = add("subscriptions", session, models.Subscription(
            user_id=uid, tier="premium", provider="razorpay", status="active", cancel_at_period_end=True,
        ))
        add("payments", session, models.Payment(
            order_id=order.id, provider_payment_id=f"pay_{uuid4().hex[:20]}", amount_paise=100, status="captured",
        ))
        renewal = add("payments", session, models.Payment(
            subscription_id=subscription.subscription_id, provider_payment_id=f"pay_{uuid4().hex[:20]}",
            amount_paise=100, status="captured",
        ))
        add("refunds", session, models.Refund(
            provider_refund_id=f"rfnd_{uuid4().hex[:20]}", payment_id=renewal.id,
            provider_payment_id=renewal.provider_payment_id, amount_paise=100, status="processed",
        ))
        add("webhook_events", session, models.WebhookEvent(
            provider="razorpay", event_id=uuid4().hex, event_type="payment.captured", status="ok",
            resolved_user_id=uid, provider_app_user_id=str(uid),
        ))

        # A delivered report: the person's own chart as a stored document. The
        # bytes have to be a real non-empty blob — `ck_reports_byte_size_positive`
        # rejects a placeholder, and `source = 'included'` must carry no
        # `credit_spend_key` or `ck_reports_credit_spend_key_matches_source`
        # rejects the row.
        _pdf = b"%PDF-1.4 synthetic report body"
        add("reports", session, models.Report(
            user_id=uid, kind="jadhagam", lang="en", source="included", chart_id=cid,
            title="Jadhagam Report — Synthetic Person", calculation_version="test-1",
            pdf=_pdf, byte_size=len(_pdf), sha256=hashlib.sha256(_pdf).hexdigest(),
        ))

        # Other people's rows that name this person.
        add("family_members.managed_by", session, models.FamilyMember(
            owner_user_id=other, display_name="Someone Else's Member", managed_by_user_id=uid,
        ))
        add("entitlements.granted_by", session, models.Entitlement(
            user_id=other, key="premium", source="grant", starts_at=now, granted_by=uid,
        ))
        add("runtime_settings.updated_by", session, models.RuntimeSetting(
            name="maintenance_mode", value=False, reason="synthetic", updated_by_user_id=uid,
        ))
        add("runtime_setting_changes.actor", session, models.RuntimeSettingChange(
            name="maintenance_mode", reason="synthetic", actor_user_id=uid,
        ))
        add("job_runs.actor", session, models.JobRun(
            job_id="synthetic_job", trigger="manual", actor_user_id=uid, actor_email=email,
            started_at=now, finished_at=now, outcome="success", summary="synthetic=1",
        ))
        add("admin_audit_log.actor", session, AdminAuditLog(action="synthetic", actor_user_id=uid, actor_email=email))
        add("admin_audit_log.target", session, AdminAuditLog(
            action="suspend_user", actor_user_id=other, target_type="user", target_id=str(uid),
        ))
        identities = {key: [inspect(obj).identity for obj in objs] for key, objs in seeded.items()}
    return uid, email, identities


def _model_of(table: str) -> Any:
    return next(m.class_ for m in Base.registry.mappers if m.local_table.name == table)


def _assert_erased(uid: UUID, identities: dict[str, list[Any]], erasure_id: UUID) -> None:
    pseudonym = pseudonym_for(erasure_id)
    values = {"uid": uid, "uid_text": str(uid)}
    with SessionLocal() as session:
        for key, ids in identities.items():
            store = _STORES[key]
            model = _model_of(store.table)
            pk = inspect(model).primary_key
            for identity in ids:
                row = session.get(model, identity)
                if store.erase == "delete":
                    assert row is None, f"{key} row {identity} survived erasure"
                    continue
                assert row is not None, f"{key} row {identity} should be kept ({store.erase})"
                if store.erase == "detach":
                    match = " AND ".join(f"{col.name} = :pk{i}" for i, col in enumerate(pk))
                    params = {f"pk{i}": v for i, v in enumerate(identity)}
                    params.update({k: v for k, v in values.items() if f":{k}" in store.where})
                    still = session.execute(
                        text(f"SELECT count(*) FROM {store.table} WHERE {match} AND ({store.where})"),  # noqa: S608
                        params,
                    ).scalar_one()
                    assert still == 0, f"{key} row {identity} still names the person"
        target_rows = session.query(AdminAuditLog).filter(AdminAuditLog.target_id == pseudonym).all()
        assert target_rows, "earlier audit rows about the person must carry the pseudonym"
        tombstone = session.get(ErasureTombstone, erasure_id)
        assert tombstone is not None and tombstone.user_id == uid


# ── 2. Erase everything, via each route ──────────────────────────────────────


def _make_owner() -> models.User:
    with SessionLocal() as session, session.begin():
        user_id = _new_user(
            session, f"owner-{uuid4().hex}@example.invalid", is_admin=True, admin_role="owner",
            email_verified_at=datetime.now(UTC),
        )
        session.add(models.AdminMfaCredential(user_id=user_id, totp_secret=_SECRET, confirmed_at=datetime.now(UTC)))
        email = session.get(models.User, user_id).email
    return models.User(user_id=user_id, email=email, is_admin=True, admin_role="owner", token_version=0)


@pytest.fixture()
def admin_delete_enabled(monkeypatch):
    monkeypatch.setenv("JOTHIDAM_ENABLE_ADMIN_DATA_DELETE", "1")
    get_settings.cache_clear()
    feature_flags._overrides.clear()
    yield
    get_settings.cache_clear()
    feature_flags._overrides.clear()


def _as(user: models.User) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.pop(get_current_user, None)


def _erase_via(route: str, raw_client, uid: UUID, email: str) -> tuple[UUID, dict[str, int]]:
    """Erase through `route`; returns the erasure id and the audited per-store counts."""
    if route == "self":
        _as(models.User(user_id=uid, email=email, token_version=0))
        response = raw_client.delete("/api/v1/auth/me", headers=_CSRF)
        assert response.status_code == 200, response.text
        action = "erase_account"
    else:
        owner = _make_owner()
        _as(owner)
        token, _ = create_admin_elevation_token(owner)
        response = raw_client.delete(
            f"/api/v1/admin/users/{uid}/data",
            headers={ADMIN_ELEVATION_HEADER: token},
            params={"reason": "synthetic erasure request"},
        )
        assert response.status_code == 200, response.text
        assert set(response.json()["external_followups"]) == {store.key for store in EXTERNAL_STORES}
        action = "delete_user_data"
    with SessionLocal() as session:
        tombstone = session.query(ErasureTombstone).filter(ErasureTombstone.user_id == uid).one()
        row = (
            session.query(AdminAuditLog)
            .filter(AdminAuditLog.action == action, AdminAuditLog.outcome == "success")
            .one()
        )
        assert row.target_id == pseudonym_for(tombstone.id)
        if route == "self":
            assert row.actor_user_id is None and row.actor_email is None and row.ip_address is None
        return tombstone.id, row.details["via_registry"]


@pytest.mark.parametrize("route", ["self", "admin"])
def test_erasure_leaves_no_personal_row(raw_client, admin_delete_enabled, route):
    uid, email, identities = _seed_everything()
    assert set(identities) == set(_STORES), (
        f"seed a row for these stores: {sorted(set(_STORES) - set(identities))}"
    )

    erasure_id, counts = _erase_via(route, raw_client, uid, email)

    empty = sorted(key for key in _STORES if counts.get(key, 0) < 1)
    assert not empty, f"audited counts show no row for: {empty}"
    _assert_erased(uid, identities, erasure_id)


# ── 3. Refusals ──────────────────────────────────────────────────────────────


def _plain_user(**fields: Any) -> tuple[UUID, str]:
    email = f"plain-{uuid4().hex}@example.invalid"
    with SessionLocal() as session, session.begin():
        uid = _new_user(session, email, **fields)
    return uid, email


def test_an_admin_account_is_not_erased(raw_client):
    uid, email = _plain_user(admin_role="support")
    _as(models.User(user_id=uid, email=email, admin_role="support", token_version=0))
    response = raw_client.delete("/api/v1/auth/me", headers=_CSRF)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ERASURE_BLOCKED_BY_ADMIN_ROLE"
    with SessionLocal() as session:
        assert session.get(models.User, uid) is not None
        assert session.query(ErasureTombstone).count() == 0


def test_a_renewing_subscription_blocks_erasure_until_cancelled(raw_client):
    uid, email = _plain_user()
    with SessionLocal() as session, session.begin():
        session.add(models.Subscription(user_id=uid, tier="premium", provider="razorpay", status="active"))
    _as(models.User(user_id=uid, email=email, token_version=0))

    response = raw_client.delete("/api/v1/auth/me", headers=_CSRF)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ERASURE_BLOCKED_BY_SUBSCRIPTION"

    with SessionLocal() as session, session.begin():
        session.query(models.Subscription).filter(models.Subscription.user_id == uid).update(
            {"cancel_at_period_end": True}
        )
    assert raw_client.delete("/api/v1/auth/me", headers=_CSRF).status_code == 200


def test_the_console_does_not_erase_its_own_operator(raw_client, admin_delete_enabled):
    owner = _make_owner()
    _as(owner)
    token, _ = create_admin_elevation_token(owner)
    response = raw_client.delete(
        f"/api/v1/admin/users/{owner.user_id}/data",
        headers={ADMIN_ELEVATION_HEADER: token},
        params={"reason": "synthetic"},
    )
    assert response.status_code == 409
    with SessionLocal() as session:
        assert session.get(models.User, owner.user_id) is not None


# ── 4. Export ────────────────────────────────────────────────────────────────


def test_self_export_returns_decrypted_rows_without_secrets(raw_client):
    uid, email, _ = _seed_everything()
    _as(models.User(user_id=uid, email=email, token_version=0))

    response = raw_client.get("/api/v1/auth/me/export")
    assert response.status_code == 200, response.text
    body = response.json()
    stores = body["stores"]

    assert body["account_id"] == str(uid)
    assert stores["birth_profiles"]["rows"][0]["birth_place"] == "Synthetic Town"
    assert stores["journal_entries"]["rows"][0]["note_text"] == "synthetic note"
    assert stores["users"]["rows"][0]["email"] == email
    assert "hashed_password" not in stores["users"]["rows"][0]
    assert "token_hash" not in stores["refresh_tokens"]["rows"][0]
    assert "token_hash" not in stores["porutham_shares"]["rows"][0]
    assert "fcm_token" not in stores["device_tokens"]["rows"][0]
    assert len(stores["payments"]["rows"]) == 2
    assert stores["admin_audit_log.target"]["rows"][0].keys() == {"action", "outcome", "created_at"}
    for secret_store in ("admin_mfa_credentials", "admin_recovery_codes", "password_reset_tokens"):
        assert secret_store not in stores
    # Other people's rows that name this person are theirs, not this person's.
    assert "family_members.managed_by" not in stores
    assert {entry["store"] for entry in body["elsewhere"]} == {store.key for store in EXTERNAL_STORES}


def test_console_export_is_elevated_reasoned_and_audited(raw_client):
    uid, _email = _plain_user()
    owner = _make_owner()
    _as(owner)
    token, _ = create_admin_elevation_token(owner)
    headers = {ADMIN_ELEVATION_HEADER: token}

    assert raw_client.get(f"/api/v1/admin/users/{uid}/export", headers=headers).status_code == 422
    assert raw_client.get(
        f"/api/v1/admin/users/{uuid4()}/export", headers=headers, params={"reason": "access request"}
    ).status_code == 404
    response = raw_client.get(f"/api/v1/admin/users/{uid}/export", headers=headers, params={"reason": "access request"})
    assert response.status_code == 200
    assert response.json()["stores"]["users"]["rows"][0]["user_id"] == str(uid)

    with SessionLocal() as session:
        row = (
            session.query(AdminAuditLog)
            .filter(AdminAuditLog.action == "export_user_data", AdminAuditLog.outcome == "success")
            .one()
        )
        assert row.target_id == str(uid)
        assert row.reason == "access request"
        assert row.details["rows"]["users"] == 1


# ── 5. Tombstones across a restore ───────────────────────────────────────────


def test_replay_erases_an_account_a_restore_brought_back(raw_client):
    uid, email = _plain_user()
    _as(models.User(user_id=uid, email=email, token_version=0))
    assert raw_client.delete("/api/v1/auth/me", headers=_CSRF).status_code == 200

    with SessionLocal() as session:
        carried = export_tombstones(session)
    assert [entry["user_id"] for entry in carried] == [str(uid)]

    # The restore: the account and a birth profile are back; the restored
    # database's tombstone table predates the erasure.
    with SessionLocal() as session, session.begin():
        session.execute(text("DELETE FROM erasure_tombstones"))
        session.add(models.User(user_id=uid, email=email))
        session.flush()
        session.add(models.BirthProfile(
            owner_user_id=uid, display_name="Restored", birth_date_local=date(1990, 1, 1), birth_place="Synthetic",
            birth_latitude=13.0, birth_longitude=80.0, birth_timezone="Asia/Kolkata",
        ))

    with SessionLocal() as session, session.begin():
        assert replay(session, carried) == {"tombstones_added": 1, "accounts_erased": 1}
    with SessionLocal() as session, session.begin():
        assert session.get(models.User, uid) is None
        assert session.query(models.BirthProfile).filter(models.BirthProfile.owner_user_id == uid).count() == 0
        assert str(session.query(ErasureTombstone).one().id) == carried[0]["id"]
        assert replay(session, carried) == {"tombstones_added": 0, "accounts_erased": 0}

