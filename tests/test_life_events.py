"""Tests for P1-A life event windows — backend service + API endpoint."""
from __future__ import annotations

from datetime import date

import pytest


# ── Unit tests for the service layer ─────────────────────────────────────────


def test_confidence_tiers():
    from app.services.life_event_service import _confidence

    assert _confidence(3) == "HIGH"
    assert _confidence(4) == "HIGH"
    assert _confidence(2) == "MEDIUM"
    assert _confidence(1) == "LOW"
    assert _confidence(0) == "LOW"


def test_headline_returns_bitext_for_all_event_types():
    from app.services.life_event_service import _headline

    event_types = ["MARRIAGE", "CAREER", "STUDIES", "RELOCATION", "HEALTH_CAUTION"]
    for et in event_types:
        for conf in ("HIGH", "MEDIUM", "LOW"):
            h = _headline(et, conf)
            assert h.en, f"Missing EN headline for {et}/{conf}"
            assert h.ta, f"Missing TA headline for {et}/{conf}"


def test_reason_bitext_returns_translation():
    from app.services.life_event_service import _reason_bitext

    bt = _reason_bitext("7th_lord_dasha_active")
    assert "7th" in bt.en
    assert len(bt.ta) > 0


def test_reason_bitext_falls_back_to_key_for_unknown():
    from app.services.life_event_service import _reason_bitext

    bt = _reason_bitext("unknown_signal")
    assert bt.en == "unknown_signal"
    assert bt.ta == "unknown_signal"


# ── Integration tests: API endpoint ──────────────────────────────────────────


def _create_test_chart(client, birth_profile_payload_factory) -> str:
    bp = client.post(
        "/api/v1/birth-profiles",
        json={
            **birth_profile_payload_factory(display_name="Life Events Test"),
            "birthDateLocal": "1990-06-15",
            "birthTimeLocal": "09:30:00",
            "birthPlace": "Chennai, India",
        },
    )
    assert bp.status_code == 200
    chart = client.post("/api/v1/charts/calculate", json={
        "birthProfileId": bp.json()["data"]["birthProfileId"],
        "calculationVersion": "thirukanitham-2026-v1",
        "forceRecalculate": False,
    })
    assert chart.status_code == 200
    return chart.json()["data"]["chartId"]


def test_life_events_endpoint_returns_200(client, birth_profile_payload_factory):
    chart_id = _create_test_chart(client, birth_profile_payload_factory)
    resp = client.get(
        f"/api/v1/charts/{chart_id}/life-events",
        params={"asOf": date.today().isoformat(), "yearsAhead": 3},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "data" in body
    data = body["data"]
    assert "windows" in data
    assert isinstance(data["windows"], list)


def test_life_events_endpoint_default_years_ahead(client, birth_profile_payload_factory):
    chart_id = _create_test_chart(client, birth_profile_payload_factory)
    resp = client.get(f"/api/v1/charts/{chart_id}/life-events")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["yearsAhead"] == 5


def test_life_events_each_window_has_required_fields(client, birth_profile_payload_factory):
    chart_id = _create_test_chart(client, birth_profile_payload_factory)
    resp = client.get(
        f"/api/v1/charts/{chart_id}/life-events",
        params={"asOf": date.today().isoformat(), "yearsAhead": 5},
    )
    assert resp.status_code == 200
    windows = resp.json()["data"]["windows"]
    for w in windows:
        assert w["eventType"] in ("CAREER", "MARRIAGE", "STUDIES", "RELOCATION", "HEALTH_CAUTION")
        assert w["confidence"] in ("HIGH", "MEDIUM", "LOW")
        assert "startDate" in w
        assert "endDate" in w
        assert "headline" in w
        assert "en" in w["headline"]
        assert "ta" in w["headline"]
        assert isinstance(w["reasons"], list)
        assert len(w["reasons"]) > 0
        assert "dashaSupport" in w
        assert "gocharSupport" in w


def test_life_events_windows_sorted_by_start_date(client, birth_profile_payload_factory):
    chart_id = _create_test_chart(client, birth_profile_payload_factory)
    resp = client.get(
        f"/api/v1/charts/{chart_id}/life-events",
        params={"yearsAhead": 5},
    )
    assert resp.status_code == 200
    windows = resp.json()["data"]["windows"]
    dates = [w["startDate"] for w in windows]
    assert dates == sorted(dates)


def test_life_events_no_fatalistic_language(client, birth_profile_payload_factory):
    from app.services.narrative_engine import tone_validator

    chart_id = _create_test_chart(client, birth_profile_payload_factory)
    resp = client.get(f"/api/v1/charts/{chart_id}/life-events", params={"yearsAhead": 5})
    assert resp.status_code == 200
    windows = resp.json()["data"]["windows"]

    violations: list[tuple[str, list[str]]] = []
    for w in windows:
        for field in ("headline", "dashaSupport", "gocharSupport"):
            for lang in ("en", "ta"):
                text = w.get(field, {}).get(lang, "")
                found = tone_validator(text)
                if found:
                    violations.append((text[:80], found))
        for reason in w.get("reasons", []):
            for lang in ("en", "ta"):
                text = reason.get(lang, "")
                found = tone_validator(text)
                if found:
                    violations.append((text[:80], found))

    assert violations == [], (
        f"Tone violations in life event windows:\n"
        + "\n".join(f"  {v[1]} in: {v[0]!r}" for v in violations[:10])
    )
