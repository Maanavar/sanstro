"""Tests for P1-C Ask Vinaadi — mocks Claude API, verifies context and rate limit."""
from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest


# ── Helpers ───────────────────────────────────────────────────────────────────


def _create_test_chart(client) -> tuple[str, str]:
    """Returns (birth_profile_id, chart_id)."""
    bp = client.post("/api/v1/birth-profiles", json={
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Ask Vinaadi Test",
        "birthDateLocal": "1992-07-04",
        "birthTimeLocal": "14:30:00",
        "birthPlace": "Chennai, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    })
    assert bp.status_code == 200, bp.text
    chart = client.post("/api/v1/charts/calculate", json={
        "birthProfileId": bp.json()["data"]["birthProfileId"],
        "calculationVersion": "thirukanitham-2026-v1",
        "forceRecalculate": False,
    })
    assert chart.status_code == 200, chart.text
    return bp.json()["data"]["birthProfileId"], chart.json()["data"]["chartId"]


def _mock_claude_response(ta: str, en: str, signals: list, confidence: str = "MEDIUM") -> MagicMock:
    mock_msg = MagicMock()
    mock_msg.content = [MagicMock()]
    mock_msg.content[0].text = json.dumps({
        "ta": ta,
        "en": en,
        "signals_used": signals,
        "confidence": confidence,
    })
    return mock_msg


# ── Unit tests ────────────────────────────────────────────────────────────────


def test_ask_vinaadi_counter_increments():
    from app.services.ask_vinaadi_service import _daily_counts, _get_count, _today_key

    import uuid
    uid = str(uuid.uuid4())
    today = _today_key()
    assert _get_count(uid) == 0
    _daily_counts[uid][today] = 3
    assert _get_count(uid) == 3
    del _daily_counts[uid]


def test_ask_vinaadi_rate_limit_raises():
    from app.services.ask_vinaadi_service import _daily_counts, _increment_and_check, _today_key
    from fastapi import HTTPException

    import uuid
    uid = str(uuid.uuid4())
    _daily_counts[uid][_today_key()] = 10
    with pytest.raises(HTTPException) as exc:
        _increment_and_check(uid, limit=10)
    assert exc.value.status_code == 429
    del _daily_counts[uid]


# ── Integration tests: 503 when no API key ────────────────────────────────────


def test_ask_returns_503_when_no_api_key(client):
    _, chart_id = _create_test_chart(client)
    with patch("app.services.ask_vinaadi_service.get_settings") as mock_settings:
        mock_settings.return_value.anthropic_api_key = None
        mock_settings.return_value.ask_vinaadi_daily_limit = 10
        resp = client.post(
            f"/api/v1/charts/{chart_id}/ask",
            json={"question": "Is this a good week for career?"},
        )
    assert resp.status_code == 503


# ── Integration tests: mocked Claude ─────────────────────────────────────────


def test_ask_returns_200_with_mocked_claude(client):
    _, chart_id = _create_test_chart(client)
    mock_msg = _mock_claude_response(
        ta="இந்த வாரம் தொழிலுக்கு நல்ல ஆதரவு உள்ளது.",
        en="This week has good support for career.",
        signals=["JUPITER_H11", "MERCURY_ANTARDASHA"],
        confidence="HIGH",
    )

    mock_anthropic_module = MagicMock()
    mock_anthropic_module.Anthropic.return_value.messages.create.return_value = mock_msg

    with patch("app.services.ask_vinaadi_service.get_settings") as mock_settings, \
         patch.dict("sys.modules", {"anthropic": mock_anthropic_module}):
        mock_settings.return_value.anthropic_api_key = "sk-test-key"
        mock_settings.return_value.ask_vinaadi_daily_limit = 10

        resp = client.post(
            f"/api/v1/charts/{chart_id}/ask",
            json={"question": "Is this a good week for career?", "lang": "en"},
        )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert "answer" in data
    assert "en" in data["answer"]
    assert "ta" in data["answer"]
    assert "signalsUsed" in data
    assert "confidence" in data
    assert data["confidence"] in ("HIGH", "MEDIUM", "LOW")
    assert "questionsUsedToday" in data
    assert "dailyLimit" in data


def test_ask_response_has_correct_fields(client):
    _, chart_id = _create_test_chart(client)
    mock_msg = _mock_claude_response(
        ta="சந்திரன் நிலை சற்று கவனம் தேவைப்படுகிறது.",
        en="Moon position calls for gentle care.",
        signals=["MOON_TRANSIT_H8"],
        confidence="LOW",
    )

    mock_anthropic_module = MagicMock()
    mock_anthropic_module.Anthropic.return_value.messages.create.return_value = mock_msg

    with patch("app.services.ask_vinaadi_service.get_settings") as mock_settings, \
         patch.dict("sys.modules", {"anthropic": mock_anthropic_module}):
        mock_settings.return_value.anthropic_api_key = "sk-test-key"
        mock_settings.return_value.ask_vinaadi_daily_limit = 10

        resp = client.post(
            f"/api/v1/charts/{chart_id}/ask",
            json={"question": "How is my health this month?"},
        )

    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data["answer"]["en"]) > 0
    assert isinstance(data["signalsUsed"], list)


def test_ask_question_too_long_returns_422(client):
    _, chart_id = _create_test_chart(client)
    resp = client.post(
        f"/api/v1/charts/{chart_id}/ask",
        json={"question": "x" * 501},
    )
    assert resp.status_code == 422
