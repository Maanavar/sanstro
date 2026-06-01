from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import BirthProfile, Chart, User
from app.models.peyarchi_alert import PeyarchiAlert
from app.services.peyarchi_alert_service import (
    daily_peyarchi_refresh,
    get_pending_notifications,
    mark_notified,
    refresh_peyarchi_alerts,
)


def _create_chart(client, birth_profile_payload_factory) -> str:
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory())
    assert created.status_code == 200
    birth_profile_id = created.json()["data"]["birthProfileId"]

    chart = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert chart.status_code == 200
    return chart.json()["data"]["chartId"]


def test_refresh_peyarchi_alerts_inserts_upcoming_alerts(client, birth_profile_payload_factory):
    chart_id = UUID(_create_chart(client, birth_profile_payload_factory))

    with SessionLocal() as session:
        with session.begin():
            refresh_peyarchi_alerts(session, chart_id, date(2026, 5, 22))

    with SessionLocal() as session:
        alerts = session.execute(
            select(PeyarchiAlert).where(PeyarchiAlert.chart_id == chart_id)
        ).scalars().all()
        assert len(alerts) == 4
        assert {alert.planet for alert in alerts} == {"SATURN", "JUPITER", "RAHU", "KETU"}


def test_get_pending_notifications_and_mark_notified(client, birth_profile_payload_factory):
    chart_id = UUID(_create_chart(client, birth_profile_payload_factory))

    with SessionLocal() as session:
        with session.begin():
            session.add(
                PeyarchiAlert(
                    chart_id=chart_id,
                    planet="JUPITER",
                    from_rasi="MIDHUNAM",
                    to_rasi="KADAGAM",
                    peyarchi_date=date(2026, 5, 31),
                    peyarchi_utc=datetime(2026, 5, 31, 0, 0, tzinfo=UTC),
                )
            )

    with SessionLocal() as session:
        with session.begin():
            pending = get_pending_notifications(session, date(2026, 5, 30))
            assert pending
            jupiter = next(item for item in pending if item.planet == "JUPITER")
            assert jupiter.due_tiers == ("1d",)
            mark_notified(session, jupiter.alert_id, "1d")

    with SessionLocal() as session:
        pending_after = get_pending_notifications(session, date(2026, 5, 30))
        assert all(item.alert_id != jupiter.alert_id for item in pending_after)


def test_day_of_does_not_also_fire_1d(client, birth_profile_payload_factory):
    chart_id = UUID(_create_chart(client, birth_profile_payload_factory))

    with SessionLocal() as session:
        with session.begin():
            session.add(
                PeyarchiAlert(
                    chart_id=chart_id,
                    planet="JUPITER",
                    from_rasi="MIDHUNAM",
                    to_rasi="KADAGAM",
                    peyarchi_date=date(2026, 6, 1),
                    peyarchi_utc=datetime(2026, 6, 1, 0, 0, tzinfo=UTC),
                )
            )

    with SessionLocal() as session:
        pending = get_pending_notifications(session, date(2026, 6, 1))
        assert len(pending) == 1
        assert pending[0].due_tiers == ("day_of",)


def test_admin_run_peyarchi_refresh_endpoint(client, birth_profile_payload_factory):
    _create_chart(client, birth_profile_payload_factory)
    response = client.post("/api/v1/admin/run-peyarchi-refresh")
    assert response.status_code == 200
    body = response.json()
    assert body["charts_refreshed"] >= 1
    assert body["notifications_marked"] >= 0


def test_daily_refresh_does_not_mark_failed_email_notification(client, monkeypatch, birth_profile_payload_factory):
    chart_id = UUID(_create_chart(client, birth_profile_payload_factory))
    run_at_utc = datetime(2026, 5, 22, 3, 0, tzinfo=UTC)

    with SessionLocal() as session:
        with session.begin():
            owner_user_id = session.execute(
                select(BirthProfile.owner_user_id)
                .join(Chart, Chart.birth_profile_id == BirthProfile.birth_profile_id)
                .where(Chart.chart_id == chart_id)
            ).scalar_one()
            user = session.get(User, owner_user_id)
            assert user is not None
            user.email = "owner@example.com"
            session.add(
                PeyarchiAlert(
                    chart_id=chart_id,
                    planet="JUPITER",
                    from_rasi="MIDHUNAM",
                    to_rasi="KADAGAM",
                    peyarchi_date=run_at_utc.astimezone(UTC).date(),
                    peyarchi_utc=run_at_utc,
                    notified_day_of=False,
                )
            )

    monkeypatch.setattr("app.services.peyarchi_alert_service.send_peyarchi_notification", lambda _ctx: False)
    result = daily_peyarchi_refresh(run_at_utc=run_at_utc)
    assert result["notifications_marked"] == 0

    with SessionLocal() as session:
        alert = session.execute(
            select(PeyarchiAlert)
            .where(
                PeyarchiAlert.chart_id == chart_id,
                PeyarchiAlert.planet == "JUPITER",
                PeyarchiAlert.peyarchi_date == run_at_utc.date(),
            )
            .order_by(PeyarchiAlert.created_at.desc())
        ).scalars().first()
        assert alert is not None
        assert alert.notified_day_of is False


def test_daily_refresh_marks_successful_email_notification(client, monkeypatch, birth_profile_payload_factory):
    chart_id = UUID(_create_chart(client, birth_profile_payload_factory))
    run_at_utc = datetime(2026, 5, 22, 3, 0, tzinfo=UTC)

    with SessionLocal() as session:
        with session.begin():
            owner_user_id = session.execute(
                select(BirthProfile.owner_user_id)
                .join(Chart, Chart.birth_profile_id == BirthProfile.birth_profile_id)
                .where(Chart.chart_id == chart_id)
            ).scalar_one()
            user = session.get(User, owner_user_id)
            assert user is not None
            user.email = "owner@example.com"
            session.add(
                PeyarchiAlert(
                    chart_id=chart_id,
                    planet="RAHU",
                    from_rasi="KUMBAM",
                    to_rasi="MAGARAM",
                    peyarchi_date=run_at_utc.date(),
                    peyarchi_utc=run_at_utc,
                    notified_day_of=False,
                )
            )

    monkeypatch.setattr("app.services.peyarchi_alert_service.send_peyarchi_notification", lambda _ctx: True)
    result = daily_peyarchi_refresh(run_at_utc=run_at_utc)
    assert result["notifications_marked"] >= 1

    with SessionLocal() as session:
        alert = session.execute(
            select(PeyarchiAlert).where(
                PeyarchiAlert.chart_id == chart_id,
                PeyarchiAlert.planet == "RAHU",
                PeyarchiAlert.peyarchi_date == run_at_utc.date(),
            )
        ).scalar_one_or_none()
        assert alert is not None
        assert alert.notified_day_of is True
