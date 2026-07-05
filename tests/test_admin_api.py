from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

import pytest

from app.core.auth import create_access_token
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.ask_vinaadi_usage import AskVinaadiUsage
from app.models.birth_profile import BirthProfile
from app.models.chart import Chart
from app.models.family_member import FamilyMember
from app.models.family_vault import FamilyVault
from app.models.feedback import Feedback
from app.models.prediction_log import PredictionLog
from app.models.subscription import Subscription
from app.models.user import User
from app.models.user_notification_preference import UserNotificationPreference
from app.services import feature_flags


def _create_user(
    email: str,
    *,
    created_at: datetime | None = None,
    is_suspended: bool = False,
    suspension_reason: str | None = None,
) -> str:
    user_id = uuid4()
    with SessionLocal() as session:
        with session.begin():
            user = User(
                user_id=user_id,
                email=email,
                is_suspended=is_suspended,
                suspension_reason=suspension_reason,
            )
            if created_at is not None:
                user.created_at = created_at
            session.add(user)
    return str(user_id)


def _admin_headers(user_id: str, admin_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {create_access_token(subject=user_id)}",
        "X-Admin-Key": admin_key,
    }


@pytest.fixture(autouse=True)
def _admin_env(monkeypatch):
    monkeypatch.setenv("JOTHIDAM_ADMIN_API_KEY", "test-admin-key")
    get_settings.cache_clear()
    feature_flags._overrides.clear()
    yield
    feature_flags._overrides.clear()
    get_settings.cache_clear()


def test_admin_delete_is_disabled_by_default(raw_client, monkeypatch):
    monkeypatch.delenv("JOTHIDAM_ENABLE_ADMIN_DATA_DELETE", raising=False)
    get_settings.cache_clear()

    admin_user_id = _create_user("admin-delete-default@example.com")
    response = raw_client.delete(
        f"/api/v1/admin/users/{admin_user_id}/data",
        headers=_admin_headers(admin_user_id, "test-admin-key"),
    )

    assert response.status_code == 403
    assert "disabled" in response.json()["detail"].lower()


def test_admin_delete_requires_explicit_enable_flag(raw_client, monkeypatch):
    monkeypatch.setenv("JOTHIDAM_ENABLE_ADMIN_DATA_DELETE", "1")
    get_settings.cache_clear()
    feature_flags._overrides.clear()

    admin_user_id = _create_user("admin-delete-enabled@example.com")
    response = raw_client.delete(
        f"/api/v1/admin/users/{admin_user_id}/data",
        headers=_admin_headers(admin_user_id, "test-admin-key"),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["owner_user_id"] == admin_user_id
    assert body["birth_profiles_deleted"] == 0
    assert body["charts_deleted"] == 0
    assert body["family_vaults_deleted"] == 0
    assert body["family_members_deleted"] == 0
    assert body["family_daily_scores_deleted"] == 0

    with SessionLocal() as session:
        assert session.get(User, UUID(admin_user_id)) is not None


def test_user_list_search_and_detail(raw_client):
    admin_user_id = _create_user("admin@example.com")
    target_user_id = UUID(_create_user("target@example.com"))

    with SessionLocal() as session:
        profile = BirthProfile(
            owner_user_id=target_user_id,
            display_name="Target User",
            birth_date_local=date(1991, 7, 22),
            birth_time_local=time(6, 30),
            birth_place="Chennai, Tamil Nadu, India",
            birth_latitude=Decimal("13.082700"),
            birth_longitude=Decimal("80.270700"),
            birth_timezone="Asia/Kolkata",
        )
        session.add(profile)
        session.flush()

        chart = Chart(
            birth_profile_id=profile.birth_profile_id,
            calculation_version="test-v1",
            julian_day=Decimal("2451545.00000000"),
            lagna_rasi="Mesha",
            lagna_longitude=Decimal("15.25000000"),
            moon_rasi="Rishabha",
            janma_nakshatra="Ashwini",
            janma_pada=1,
        )
        session.add(chart)

        vault = FamilyVault(owner_user_id=target_user_id, name="Target Family")
        session.add(vault)
        session.flush()

        session.add(
            FamilyMember(
                owner_user_id=target_user_id,
                family_vault_id=vault.family_vault_id,
                display_name="Partner",
                relationship_to_owner="spouse",
            )
        )
        session.add(
            Feedback(
                user_id=target_user_id,
                category="bug",
                message="Something broke",
            )
        )
        session.add(
            AskVinaadiUsage(
                user_id=target_user_id,
                usage_date=date.today(),
                chip_count=3,
            )
        )
        session.add(
            Subscription(
                user_id=target_user_id,
                tier="pro",
                status="active",
            )
        )
        session.commit()

    headers = _admin_headers(admin_user_id, "test-admin-key")

    list_response = raw_client.get("/api/v1/admin/users?page=1&page_size=50", headers=headers)
    assert list_response.status_code == 200
    list_body = list_response.json()
    assert list_body["total"] == 2
    assert any(item["email"] == "target@example.com" for item in list_body["items"])

    search_response = raw_client.get("/api/v1/admin/users?search=target@example.com", headers=headers)
    assert search_response.status_code == 200
    search_body = search_response.json()
    assert search_body["total"] == 1
    assert search_body["items"][0]["email"] == "target@example.com"

    detail_response = raw_client.get(f"/api/v1/admin/users/{target_user_id}", headers=headers)
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["birth_profile_count"] == 1
    assert detail["chart_count"] == 1
    assert detail["family_vault_count"] == 1
    assert detail["family_member_count"] == 1
    assert detail["feedback_count"] == 1
    assert detail["ask_vinaadi_usage_today"] == 3
    assert detail["subscription_tier"] == "pro"
    assert detail["subscription_status"] == "active"


def test_suspend_user_records_audit_log(raw_client):
    admin_user_id = _create_user("admin@example.com")
    target_user_id = _create_user("target@example.com")
    headers = _admin_headers(admin_user_id, "test-admin-key")

    suspend_response = raw_client.patch(
        f"/api/v1/admin/users/{target_user_id}/suspend",
        headers=headers,
        json={"suspend": True, "reason": "spam"},
    )
    assert suspend_response.status_code == 200
    assert suspend_response.json()["is_suspended"] is True
    assert suspend_response.json()["suspension_reason"] == "spam"

    audit_response = raw_client.get("/api/v1/admin/audit-log", headers=headers)
    assert audit_response.status_code == 200
    first_entry = audit_response.json()["items"][0]
    assert first_entry["action"] == "suspend_user"
    assert first_entry["target_id"] == target_user_id
    assert first_entry["payload_summary"] == "spam"


def test_analytics_endpoints_return_expected_shapes(raw_client):
    admin_user_id = _create_user("admin@example.com")
    target_created_at = datetime.now(UTC) - timedelta(days=35)
    target_user_id = UUID(_create_user("analytics@example.com", created_at=target_created_at))

    with SessionLocal() as session:
        profile = BirthProfile(
            owner_user_id=target_user_id,
            display_name="Analytics User",
            birth_date_local=date(1992, 2, 2),
            birth_time_local=time(7, 0),
            birth_place="Madurai, Tamil Nadu, India",
            birth_latitude=Decimal("9.925200"),
            birth_longitude=Decimal("78.119800"),
            birth_timezone="Asia/Kolkata",
        )
        profile.created_at = target_created_at
        session.add(profile)
        session.flush()

        chart = Chart(
            birth_profile_id=profile.birth_profile_id,
            calculation_version="test-v1",
            julian_day=Decimal("2451546.00000000"),
            lagna_rasi="Rishabha",
            lagna_longitude=Decimal("10.50000000"),
            moon_rasi="Mithuna",
            janma_nakshatra="Rohini",
            janma_pada=2,
        )
        chart.created_at = datetime.now(UTC) - timedelta(days=2)
        session.add(chart)
        session.add(FamilyVault(owner_user_id=target_user_id, name="Analytics Vault"))
        session.add(AskVinaadiUsage(user_id=target_user_id, usage_date=date.today(), chip_count=4))
        session.commit()

    headers = _admin_headers(admin_user_id, "test-admin-key")

    daily_response = raw_client.get("/api/v1/admin/analytics/daily?days=30", headers=headers)
    assert daily_response.status_code == 200
    daily = daily_response.json()
    assert daily["days"] == 30
    assert len(daily["new_users"]) == 30
    assert len(daily["active_users"]) == 30

    feature_response = raw_client.get("/api/v1/admin/analytics/features", headers=headers)
    assert feature_response.status_code == 200
    features = feature_response.json()
    assert features["charts_total"] == 1
    assert features["family_vaults_total"] == 1
    assert features["ask_vinaadi_today"] == 4
    assert features["birth_profiles_total"] == 1

    retention_response = raw_client.get("/api/v1/admin/analytics/retention", headers=headers)
    assert retention_response.status_code == 200
    cohorts = retention_response.json()["cohorts"]
    assert len(cohorts) >= 1
    assert cohorts[0]["retained_d7"] >= 1
    assert cohorts[0]["retained_d30"] >= 1


def test_jobs_list_and_manual_trigger(raw_client, monkeypatch):
    admin_user_id = _create_user("admin@example.com")
    headers = _admin_headers(admin_user_id, "test-admin-key")

    jobs_response = raw_client.get("/api/v1/admin/jobs", headers=headers)
    assert jobs_response.status_code == 200
    job_ids = {job["job_id"] for job in jobs_response.json()}
    assert {
        "daily_peyarchi_refresh",
        "daily_relationship_alert_refresh",
        "daily_push_cron",
        "panchangam_prewarm",
    }.issubset(job_ids)

    monkeypatch.setattr(
        "app.api.admin.get_job",
        lambda job_id: {
            "job_id": job_id,
            "label": "Dummy",
            "description": "Dummy",
            "fn": lambda: {"ok": 1},
        },
    )

    trigger_response = raw_client.post("/api/v1/admin/jobs/test-job/trigger", headers=headers)
    assert trigger_response.status_code == 200
    assert trigger_response.json()["job_id"] == "test-job"
    assert trigger_response.json()["result_summary"] == "ok=1"


def test_broadcast_notification_to_specific_user(raw_client, monkeypatch):
    admin_user_id = _create_user("admin@example.com")
    target_user_id = UUID(_create_user("notify@example.com"))
    headers = _admin_headers(admin_user_id, "test-admin-key")

    with SessionLocal() as session:
        session.add(
            UserNotificationPreference(
                owner_user_id=target_user_id,
                notification_channel="push",
                fcm_device_token="token-1234567890",
            )
        )
        session.commit()

    monkeypatch.setattr("app.api.admin.send_push_to_token", lambda *_args, **_kwargs: True)

    response = raw_client.post(
        "/api/v1/admin/notify/broadcast",
        headers=headers,
        json={"title": "Test", "body": "Hello", "target_user_id": str(target_user_id)},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["sent"] == 1
    assert body["skipped"] == 0
    assert body["target"] == str(target_user_id)


def test_feature_flags_round_trip(raw_client):
    admin_user_id = _create_user("admin@example.com")
    headers = _admin_headers(admin_user_id, "test-admin-key")

    list_response = raw_client.get("/api/v1/admin/flags", headers=headers)
    assert list_response.status_code == 200
    names = {flag["name"] for flag in list_response.json()}
    assert {
        "enable_admin_data_delete",
        "ask_vinaadi_daily_limit",
        "enable_push_notifications",
        "maintenance_mode",
        "max_birth_profiles_per_user",
        "reasoning_gate",
        "reasoning_bands",
        "reasoning_contradiction",
        "reasoning_calibration_log",
        "reasoning_chart_signature",
    } == names

    set_response = raw_client.patch(
        "/api/v1/admin/flags/maintenance_mode",
        headers=headers,
        json={"value": True},
    )
    assert set_response.status_code == 200
    assert set_response.json()["value"] is True
    assert set_response.json()["overridden"] is True

    reset_response = raw_client.delete("/api/v1/admin/flags/maintenance_mode/reset", headers=headers)
    assert reset_response.status_code == 200
    assert reset_response.json()["reset"] is True
    assert reset_response.json()["current_value"] is False


def test_calibration_requires_admin(raw_client):
    non_admin_user_id = _create_user("non-admin@example.com")
    response = raw_client.get(
        "/api/v1/admin/calibration",
        headers={"Authorization": f"Bearer {create_access_token(subject=non_admin_user_id)}"},
    )
    assert response.status_code == 403


def test_calibration_report_aggregates_prediction_log(raw_client):
    admin_user_id = _create_user("admin@example.com")
    target_user_id = UUID(_create_user("calibration-target@example.com"))
    headers = _admin_headers(admin_user_id, "test-admin-key")

    with SessionLocal() as session:
        profile = BirthProfile(
            owner_user_id=target_user_id,
            display_name="Calibration Target",
            birth_date_local=date(1990, 4, 12),
            birth_time_local=time(9, 15),
            birth_place="Madurai, Tamil Nadu, India",
            birth_latitude=Decimal("9.925200"),
            birth_longitude=Decimal("78.119800"),
            birth_timezone="Asia/Kolkata",
        )
        session.add(profile)
        session.flush()

        chart = Chart(
            birth_profile_id=profile.birth_profile_id,
            calculation_version="test-v1",
            julian_day=Decimal("2451545.00000000"),
            lagna_rasi="Simha",
            lagna_longitude=Decimal("135.00000000"),
            moon_rasi="Kanni",
            janma_nakshatra="Hastha",
            janma_pada=2,
        )
        session.add(chart)
        session.flush()

        session.add_all(
            [
                PredictionLog(
                    chart_id=chart.chart_id,
                    source="life_areas",
                    life_area="CAREER",
                    band="STRONG",
                    active_maha="JUPITER",
                    outcome_grade="HIT",
                    calc_version="test-v1",
                ),
                PredictionLog(
                    chart_id=chart.chart_id,
                    source="life_areas",
                    life_area="CAREER",
                    band="STRONG",
                    active_maha="JUPITER",
                    outcome_grade="MISS",
                    calc_version="test-v1",
                ),
                PredictionLog(
                    chart_id=chart.chart_id,
                    source="whatif",
                    life_area="MARRIAGE",
                    band="LIKELY",
                    active_maha="VENUS",
                    outcome_grade=None,
                    calc_version="test-v1",
                ),
            ]
        )
        session.commit()

    response = raw_client.get("/api/v1/admin/calibration", headers=headers)
    assert response.status_code == 200
    body = response.json()

    assert body["total_logged"] == 3
    assert body["total_open"] == 1
    assert body["total_graded"] == 2

    area_band = {b["key"]: b for b in body["by_area_band"]}
    assert area_band["CAREER/STRONG"]["hit"] == 1
    assert area_band["CAREER/STRONG"]["miss"] == 1
    assert area_band["CAREER/STRONG"]["n"] == 2
    assert area_band["CAREER/STRONG"]["hit_rate"] == 0.5
    assert "MARRIAGE/LIKELY" not in area_band  # open rows are excluded from buckets

    dasha_lord = {b["key"]: b for b in body["by_dasha_lord"]}
    assert dasha_lord["JUPITER"]["n"] == 2
    assert "VENUS" not in dasha_lord
