"""Tests for P1-F rectification assistant."""
from __future__ import annotations

# ── Unit tests ────────────────────────────────────────────────────────────────


def test_lagna_supports_marriage_for_house_7():
    from app.services.rectification_service import _lagna_supports_event

    assert _lagna_supports_event(7, "MARRIAGE") is True


def test_lagna_does_not_support_marriage_for_house_3():
    from app.services.rectification_service import _lagna_supports_event

    assert _lagna_supports_event(3, "MARRIAGE") is False


def test_lagna_supports_relocation_for_house_12():
    from app.services.rectification_service import _lagna_supports_event

    assert _lagna_supports_event(12, "RELOCATION") is True


def test_lagna_supports_health_for_house_6():
    from app.services.rectification_service import _lagna_supports_event

    assert _lagna_supports_event(6, "HEALTH_MAJOR") is True


def test_lagna_supports_parent_for_house_9():
    from app.services.rectification_service import _lagna_supports_event

    assert _lagna_supports_event(9, "PARENT_BIRTH") is True


# ── Integration tests ─────────────────────────────────────────────────────────


def _create_test_profile(client) -> str:
    bp = client.post("/api/v1/birth-profiles", json={
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Rectify Test",
        "birthDateLocal": "1988-09-10",
        "birthTimeLocal": None,
        "birthPlace": "Chennai, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "birthTimeSource": "unknown",
        "calculateNow": False,
    })
    assert bp.status_code == 200, bp.text
    return bp.json()["data"]["birthProfileId"]


def test_rectify_endpoint_returns_candidates(client):
    profile_id = _create_test_profile(client)
    resp = client.post(
        f"/api/v1/birth-profiles/{profile_id}/rectify",
        json={
            "events": [
                {"eventType": "MARRIAGE", "eventYear": 2015},
                {"eventType": "RELOCATION", "eventYear": 2018},
            ]
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert len(data["candidates"]) > 0
    assert "recommendedTime" in data
    assert "disclaimer" in data
    assert "Approximate" in data["disclaimer"]


def test_rectify_candidates_have_required_fields(client):
    profile_id = _create_test_profile(client)
    resp = client.post(
        f"/api/v1/birth-profiles/{profile_id}/rectify",
        json={
            "events": [{"eventType": "CAREER_BREAK", "eventYear": 2010}],
        },
    )
    assert resp.status_code == 200
    for cand in resp.json()["data"]["candidates"]:
        assert "timeLocal" in cand
        assert "lagnaRasi" in cand
        assert "lagnaRasiName" in cand
        assert "probabilityWeight" in cand
        assert "matchingEvents" in cand


def test_rectify_empty_events_returns_422(client):
    profile_id = _create_test_profile(client)
    resp = client.post(
        f"/api/v1/birth-profiles/{profile_id}/rectify",
        json={"events": []},
    )
    assert resp.status_code == 422


def test_rectify_apply_updates_birth_time(client):
    profile_id = _create_test_profile(client)

    # First estimate
    est_resp = client.post(
        f"/api/v1/birth-profiles/{profile_id}/rectify",
        json={"events": [{"eventType": "MARRIAGE", "eventYear": 2015}]},
    )
    assert est_resp.status_code == 200
    recommended = est_resp.json()["data"]["recommendedTime"]

    # Apply
    apply_resp = client.patch(
        f"/api/v1/birth-profiles/{profile_id}/rectify/apply",
        json={"selectedTime": recommended},
    )
    assert apply_resp.status_code == 200
    body = apply_resp.json()
    assert "birthProfileId" in body
    assert "appliedOffsetMinutes" in body
    assert "newBirthTimeLocal" in body


def test_rectify_apply_invalid_time_returns_422(client):
    profile_id = _create_test_profile(client)
    resp = client.patch(
        f"/api/v1/birth-profiles/{profile_id}/rectify/apply",
        json={"selectedTime": "not-a-time"},
    )
    assert resp.status_code == 422


# ── FCA-03: the applied time must reach what the engine reads ─────────────────

def _latest_chart(session, birth_profile_id):
    from sqlalchemy import select

    from app.models import Chart

    return session.execute(
        select(Chart)
        .where(Chart.birth_profile_id == birth_profile_id)
        .order_by(Chart.created_at.desc())
        .limit(1)
    ).scalars().first()


def test_rectify_apply_moves_the_birth_instant_and_the_chart(client):
    """Applying a time two hours later must move `birth_datetime_utc` and the lagna.

    The old apply wrote `birth_time_local` only. The response still had its
    three keys, which is all the test above checks, so the suite stayed green
    while every reading kept the old time.
    """
    from datetime import timedelta
    from uuid import UUID

    from app.db.session import SessionLocal
    from app.models.birth_profile import BirthProfile

    created = client.post("/api/v1/birth-profiles", json={
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Rectify Moves Chart",
        "birthDateLocal": "1991-07-22",
        "birthTimeLocal": "06:30:00",
        "birthPlace": "Chennai, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    })
    assert created.status_code == 200, created.text
    profile_id = UUID(created.json()["data"]["birthProfileId"])

    with SessionLocal() as session:
        before_utc = session.get(BirthProfile, profile_id).birth_datetime_utc
        before_chart = _latest_chart(session, profile_id)
        before_lagna = float(before_chart.lagna_longitude)

    resp = client.patch(
        f"/api/v1/birth-profiles/{profile_id}/rectify/apply",
        json={"selectedTime": "08:30"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["appliedOffsetMinutes"] == 120

    with SessionLocal() as session:
        profile = session.get(BirthProfile, profile_id)
        after_chart = _latest_chart(session, profile_id)
        assert profile.birth_datetime_utc - before_utc == timedelta(hours=2)
        assert after_chart.chart_id != before_chart.chart_id
        # Lagna moves ~1 degree every 4 minutes; two hours is tens of degrees.
        moved = (float(after_chart.lagna_longitude) - before_lagna) % 360
        assert 15 < moved < 60, moved


def test_rectify_apply_offset_is_the_instant_shift_across_midnight(client):
    """23:50 -> 00:10 on the same birth date is the instant moving back 1420 min.

    Candidates are swept across the recorded date and the date is never
    changed, so the honest offset is negative, not +20.
    """
    created = client.post("/api/v1/birth-profiles", json={
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Rectify Midnight",
        "birthDateLocal": "1991-07-22",
        "birthTimeLocal": "23:50:00",
        "birthPlace": "Chennai, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": False,
    })
    assert created.status_code == 200, created.text
    profile_id = created.json()["data"]["birthProfileId"]
    resp = client.patch(
        f"/api/v1/birth-profiles/{profile_id}/rectify/apply",
        json={"selectedTime": "00:10"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["appliedOffsetMinutes"] == -1420


def test_rectify_apply_on_deleted_profile_is_404(client):
    profile_id = _create_test_profile(client)
    deleted = client.delete(f"/api/v1/birth-profiles/{profile_id}")
    assert deleted.status_code in (200, 204), deleted.text
    resp = client.patch(
        f"/api/v1/birth-profiles/{profile_id}/rectify/apply",
        json={"selectedTime": "08:30"},
    )
    assert resp.status_code == 404
