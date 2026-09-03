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
    block = MagicMock()
    block.type = "text"
    block.text = json.dumps({
        "ta": ta,
        "en": en,
        "signals_used": signals,
        "confidence": confidence,
    })
    mock_msg.content = [block]
    return mock_msg


# ── Unit tests: DB-backed chip counter (single source of truth) ───────────────


def test_ask_vinaadi_counter_increments(client):
    """consume_chip increments the DB-backed daily usage row."""
    from uuid import UUID

    from app.services.ask_vinaadi_usage_service import consume_chip, get_daily_status
    from tests.conftest import TEST_USER_ID, SessionLocal

    uid = UUID(TEST_USER_ID)
    with SessionLocal() as session, session.begin():
        assert get_daily_status(session, uid)["chipsUsed"] == 0
        consume_chip(session, uid)
        consume_chip(session, uid)
    with SessionLocal() as session:
        assert get_daily_status(session, uid)["chipsUsed"] == 2


def test_ask_vinaadi_rate_limit_raises(client):
    """assert_chip_available raises 429 once the allowance is spent."""
    from uuid import UUID

    from fastapi import HTTPException

    from app.core.subscription import is_premium
    from app.core.tier_limits import ask_vinaadi_limit_for_tier
    from app.services.ask_vinaadi_usage_service import assert_chip_available, consume_chip
    from tests.conftest import TEST_USER_ID, SessionLocal

    uid = UUID(TEST_USER_ID)
    with SessionLocal() as session, session.begin():
        tier = "premium" if is_premium(uid, session) else "registered"
        daily_limit, monthly_limit = ask_vinaadi_limit_for_tier(tier)
        limit = monthly_limit if monthly_limit is not None else daily_limit
        for _ in range(limit):
            consume_chip(session, uid)
    with SessionLocal() as session:
        with pytest.raises(HTTPException) as exc:
            assert_chip_available(session, uid)
    assert exc.value.status_code == 429


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


# ── P1-3: doctrine alignment (safety pass, calibration log, minor gates) ──────


def _create_test_chart_minor(client) -> tuple[str, str]:
    """Same shape as _create_test_chart but the birth date makes the profile
    a minor (age 14 as of the plan's execution date)."""
    bp = client.post("/api/v1/birth-profiles", json={
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Ask Vinaadi Minor Test",
        "birthDateLocal": "2012-06-01",
        "birthTimeLocal": "09:15:00",
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


def test_ask_vinaadi_minor_wellbeing_redirect(client):
    """P1-2/D11 hard gate mirrored into Ask Vinaadi: a minor asking a
    fertility/wellbeing-adjacent question gets the safe redirect instead of
    a Claude call (no API key needed — this must short-circuit before
    _call_claude)."""
    _, chart_id = _create_test_chart_minor(client)
    resp = client.post(
        f"/api/v1/charts/{chart_id}/ask",
        json={"question": "Will I have children and when will I be pregnant?"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["confidence"] == "HIGH"
    assert data["signalsUsed"] == []
    assert data["dailyLimit"] == 0
    assert "talk to a parent" in data["answer"]["en"].lower()


def test_ask_vinaadi_runs_safety_pass_on_llm_output(client, caplog):
    """The Claude-generated answer is routed through safety_filter before
    being served — the one surface where the tone check can actually catch
    something, since it's LLM output rather than a pre-validated template."""
    _, chart_id = _create_test_chart(client)
    mock_msg = _mock_claude_response(
        ta="இது ஒரு பரிசோதனை பதில்.",
        en="This looks like a real danger ahead for your career.",
        signals=[],
        confidence="MEDIUM",
    )
    mock_anthropic_module = MagicMock()
    mock_anthropic_module.Anthropic.return_value.messages.create.return_value = mock_msg

    with patch("app.services.ask_vinaadi_service.get_settings") as mock_settings, \
         patch.dict("sys.modules", {"anthropic": mock_anthropic_module}), \
         caplog.at_level("ERROR", logger="app.services.safety_filter"):
        mock_settings.return_value.anthropic_api_key = "sk-test-key"
        mock_settings.return_value.ask_vinaadi_daily_limit = 10

        resp = client.post(
            f"/api/v1/charts/{chart_id}/ask",
            json={"question": "What do you think about today in general?"},
        )

    assert resp.status_code == 200, resp.text
    assert any("ask_vinaadi" in rec.message and "danger" in rec.message.lower() for rec in caplog.records)


def test_ask_vinaadi_logs_calibration_for_mapped_high_confidence(client):
    """A HIGH-confidence answer to a question that maps to a known life area
    is logged to the calibration spine as source=ask_vinaadi, using
    legacy_confidence_to_band, with no reading and no timing window."""
    from sqlalchemy import select

    from app.models.prediction_log import PredictionLog
    from tests.conftest import SessionLocal

    _, chart_id = _create_test_chart(client)
    mock_msg = _mock_claude_response(
        ta="இந்த வாரம் தொழிலுக்கு நல்ல ஆதரவு உள்ளது.",
        en="This week has good support for career.",
        signals=["JUPITER_H11"],
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
            json={"question": "Is this a good week for my career?"},
        )
    assert resp.status_code == 200, resp.text

    with SessionLocal() as session:
        rows = session.execute(
            select(PredictionLog).where(
                PredictionLog.chart_id == chart_id,
                PredictionLog.source == "ask_vinaadi",
            )
        ).scalars().all()
    assert len(rows) == 1
    assert rows[0].life_area == "CAREER"
    assert rows[0].band == "LIKELY"
    assert rows[0].reading is None
    assert rows[0].window_start is None
    assert rows[0].window_end is None


def test_ask_vinaadi_skips_calibration_log_for_low_confidence(client):
    """LOW-confidence answers are never logged, even when the question maps
    cleanly to a life area — avoids polluting calibration buckets with the
    least-trustworthy tier."""
    from sqlalchemy import select

    from app.models.prediction_log import PredictionLog
    from tests.conftest import SessionLocal

    _, chart_id = _create_test_chart(client)
    mock_msg = _mock_claude_response(
        ta="இது தெளிவற்றது.",
        en="This is unclear.",
        signals=[],
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
            json={"question": "Is this a good week for my career?"},
        )
    assert resp.status_code == 200

    with SessionLocal() as session:
        rows = session.execute(
            select(PredictionLog).where(
                PredictionLog.chart_id == chart_id,
                PredictionLog.source == "ask_vinaadi",
            )
        ).scalars().all()
    assert rows == []


def test_ask_vinaadi_skips_calibration_log_for_unmapped_question(client):
    """A question that doesn't match any known life area's keywords is
    skipped rather than logged under a guessed/OTHER bucket."""
    from sqlalchemy import select

    from app.models.prediction_log import PredictionLog
    from tests.conftest import SessionLocal

    _, chart_id = _create_test_chart(client)
    mock_msg = _mock_claude_response(
        ta="பொது பதில்.",
        en="A general answer.",
        signals=[],
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
            json={"question": "What do you think about today in general?"},
        )
    assert resp.status_code == 200

    with SessionLocal() as session:
        rows = session.execute(
            select(PredictionLog).where(
                PredictionLog.chart_id == chart_id,
                PredictionLog.source == "ask_vinaadi",
            )
        ).scalars().all()
    assert rows == []
