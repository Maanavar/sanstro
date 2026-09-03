from datetime import date, timedelta
from uuid import UUID

from app.db.session import SessionLocal
from app.services.chart_service import load_persisted_chart_response
from app.services.decisions_service import _next_dasha_shift


def _create_chart(client, birth_profile_payload_factory):
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


def test_decision_brief_prefers_stable_option_when_other_is_high_risk(client, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory)
    response = client.post(
        "/api/v1/decisions/brief",
        json={
            "chartId": chart_id,
            "optionA": {
                "label": "Stay in current role",
                "description": "Continue in current company and same city for steady career growth.",
            },
            "optionB": {
                "label": "Relocate for startup",
                "description": "Resign and relocate abroad for a new startup with loan pressure.",
            },
            "priority": "career",
            "targetDate": "2026-06-15",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["chartId"] == chart_id
    assert body["data"]["scenarioUsed"] == "job_change"
    assert body["data"]["recommended"] == "A"
    assert 0 <= body["data"]["confidence"] <= 100
    assert body["data"]["optionA"]["score"] > body["data"]["optionB"]["score"]
    assert len(body["data"]["optionA"]["alignmentNotes"]) == 3
    assert body["data"]["reasoning"]["en"]


def test_decision_brief_rejects_invalid_priority(client, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory)
    response = client.post(
        "/api/v1/decisions/brief",
        json={
            "chartId": chart_id,
            "optionA": {"label": "A", "description": "First option"},
            "optionB": {"label": "B", "description": "Second option"},
            "priority": "invalid-priority",
            "targetDate": "2026-06-15",
        },
    )
    assert response.status_code == 422


def test_optimal_window_is_computed_not_a_fixed_offset(client, birth_profile_payload_factory):
    """D3 — the window used to be targetDate + 21 or + 45 days, chosen off the
    verdict string with no astrology behind it. It is now the running
    antardasha's end, so those two offsets must never appear."""
    chart_id = _create_chart(client, birth_profile_payload_factory)
    target = date(2026, 6, 15)
    response = client.post(
        "/api/v1/decisions/brief",
        json={
            "chartId": chart_id,
            "optionA": {"label": "Buy now", "description": "Purchase the flat this quarter with a loan."},
            "optionB": {"label": "Keep renting", "description": "Stay in the current place and continue saving."},
            "priority": "money",
            "targetDate": target.isoformat(),
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]

    for option in (data["optionA"], data["optionB"]):
        window = option["optimalWindow"]
        assert window
        for days in (21, 45):
            assert (target + timedelta(days=days)).strftime("%d %b %Y") not in window
        # Either it points at the date asked about, or it names a real period change.
        assert window.startswith("around ") or "antardasha" in window


def test_next_dasha_shift_reads_the_charts_own_timeline(client, birth_profile_payload_factory):
    """The `except` in `_next_dasha_shift` swallows failures into a no-date
    string, which would leave the test above green on a broken timeline. Assert
    the boundary is genuinely produced, and that it is a real future date."""
    chart_id = _create_chart(client, birth_profile_payload_factory)
    target = date(2026, 6, 15)
    with SessionLocal() as session:
        snapshot = load_persisted_chart_response(session, UUID(chart_id))
    shift = _next_dasha_shift(snapshot, target)

    assert shift is not None
    shift_date, incoming_lord = shift
    assert shift_date > target
    assert incoming_lord in {"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"}

