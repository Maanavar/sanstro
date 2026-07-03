"""PR-3 (Phase 4 data spine) — write-on-serve, outcome join, admin report.

End-to-end over the API with the ``reasoning_calibration_log`` flag:
flag-off serves write nothing (silent launch is opt-in); flag-on serves
log material predictions, a logged life event grades them, and the
admin calibration report aggregates the result.

All identities are synthetic (CLAUDE.md test-data rule).
"""
from __future__ import annotations

import pytest
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.prediction_log import PredictionLog
from app.services import feature_flags


@pytest.fixture
def calibration_log_on():
    feature_flags.set_flag("reasoning_calibration_log", True)
    yield
    feature_flags.reset_flag("reasoning_calibration_log")


def _create_chart(client) -> str:
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "11111111-1111-1111-1111-111111111111",
            "displayName": "Prediction Log Test",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )
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


def _whatif(client, chart_id: str, scenario: str = "marriage", target: str = "2027-06-15"):
    response = client.post(
        "/api/v1/whatif",
        json={"chartId": chart_id, "scenario": scenario, "targetDate": target},
    )
    assert response.status_code == 200
    return response


def _rows(chart_id: str) -> list[PredictionLog]:
    with SessionLocal() as session:
        return session.execute(
            select(PredictionLog).where(PredictionLog.chart_id == chart_id)
        ).scalars().all()


def test_flag_off_serve_writes_nothing(client):
    chart_id = _create_chart(client)
    _whatif(client, chart_id)
    client.get(f"/api/v1/charts/{chart_id}/predictions/marriage")
    assert _rows(chart_id) == []


def test_whatif_serve_logs_prediction_once(client, calibration_log_on):
    chart_id = _create_chart(client)
    _whatif(client, chart_id)
    rows = _rows(chart_id)
    assert len(rows) == 1
    row = rows[0]
    assert row.source == "whatif"
    assert row.life_area == "MARRIAGE"
    assert row.band in {"STRONG", "LIKELY", "MIXED", "WEAK", "BLOCKED", "SILENT"}
    assert row.window_start is not None and row.window_end is not None
    assert row.active_maha is not None
    assert row.outcome_grade is None

    # Re-viewing the same claim must not inflate n (dedupe).
    _whatif(client, chart_id)
    assert len(_rows(chart_id)) == 1


def test_marriage_serve_logs_prediction(client, calibration_log_on):
    chart_id = _create_chart(client)
    response = client.get(f"/api/v1/charts/{chart_id}/predictions/marriage")
    assert response.status_code == 200
    rows = [r for r in _rows(chart_id) if r.source == "marriage"]
    assert len(rows) == 1
    assert rows[0].life_area == "MARRIAGE"
    assert rows[0].window_start is not None


def test_life_event_grades_open_prediction(client, calibration_log_on):
    chart_id = _create_chart(client)
    _whatif(client, chart_id, scenario="marriage", target="2027-06-15")

    # Event inside the claimed window (single-day whatif window) → HIT.
    event = client.post(
        f"/api/v1/charts/{chart_id}/life-event-log",
        json={"eventType": "RELATIONSHIP_START", "eventDate": "2027-06-15"},
    )
    assert event.status_code == 200

    rows = [r for r in _rows(chart_id) if r.source == "whatif"]
    assert len(rows) == 1
    assert rows[0].outcome_grade == "HIT"
    assert rows[0].outcome_event_id is not None


def test_unrelated_event_leaves_predictions_open(client, calibration_log_on):
    chart_id = _create_chart(client)
    _whatif(client, chart_id, scenario="marriage", target="2027-06-15")
    event = client.post(
        f"/api/v1/charts/{chart_id}/life-event-log",
        json={"eventType": "EXAM_RESULT", "eventDate": "2027-06-15"},
    )
    assert event.status_code == 200
    rows = [r for r in _rows(chart_id) if r.source == "whatif"]
    assert rows[0].outcome_grade is None


def test_admin_calibration_report_reflects_grades(client, calibration_log_on):
    chart_id = _create_chart(client)
    _whatif(client, chart_id, scenario="marriage", target="2027-06-15")
    client.post(
        f"/api/v1/charts/{chart_id}/life-event-log",
        json={"eventType": "RELATIONSHIP_START", "eventDate": "2027-06-15"},
    )

    report = client.get("/api/v1/admin/calibration")
    assert report.status_code == 200
    body = report.json()
    assert body["total_logged"] >= 1
    assert body["total_graded"] >= 1
    marriage_buckets = [b for b in body["by_area_band"] if b["key"].startswith("MARRIAGE/")]
    assert marriage_buckets, body
    assert sum(b["hit"] for b in marriage_buckets) >= 1
    for bucket in body["by_area_band"]:
        assert bucket["n"] == bucket["hit"] + bucket["near"] + bucket["miss"]


def test_admin_calibration_requires_admin(raw_client):
    response = raw_client.get("/api/v1/admin/calibration")
    assert response.status_code in (401, 403)
