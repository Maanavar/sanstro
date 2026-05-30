"""Tone compliance tests — ensure no banned fatalistic phrases appear in
narrative output generated for a representative set of chart configurations.

P1-D: All narrative text must be non-fatalistic.
Banned phrases: bad day, danger, will fail, doomed, trouble ahead, crisis,
hardship, inauspicious.
"""

from __future__ import annotations

from datetime import date

import pytest

from app.services.narrative_engine import tone_validator


# ── Unit tests for tone_validator itself ─────────────────────────────────────


def test_tone_validator_returns_empty_for_clean_text():
    assert tone_validator("Today is a supportive day for reflection.") == []


def test_tone_validator_detects_bad_day():
    assert "bad day" in tone_validator("This is a bad day for new starts.")


def test_tone_validator_detects_crisis():
    assert "crisis" in tone_validator("A crisis period is approaching.")


def test_tone_validator_detects_inauspicious():
    assert "inauspicious" in tone_validator("An inauspicious karana, avoid this.")


def test_tone_validator_is_case_insensitive():
    assert "danger" in tone_validator("There is DANGER ahead today.")


def test_tone_validator_returns_multiple_violations():
    violations = tone_validator("A hardship period — danger ahead, bad day.")
    assert "hardship" in violations
    assert "danger" in violations
    assert "bad day" in violations


# ── Integration tests: run tone_validator over generated narratives ──────────


def _create_test_chart(client) -> str:
    """Create a birth profile + chart and return the chart_id."""
    bp = client.post("/api/v1/birth-profiles", json={
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Tone Test",
        "birthDateLocal": "1991-07-22",
        "birthTimeLocal": "06:30:00",
        "birthPlace": "Madurai, India",
        "birthLatitude": 9.9252,
        "birthLongitude": 78.1198,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    })
    assert bp.status_code == 200
    chart = client.post("/api/v1/charts/calculate", json={
        "birthProfileId": bp.json()["data"]["birthProfileId"],
        "calculationVersion": "thirukanitham-2026-v1",
        "forceRecalculate": False,
    })
    assert chart.status_code == 200
    return chart.json()["data"]["chartId"]


def _get_narrative_texts(client) -> list[str]:  # type: ignore[type-arg]
    """Fetch daily guidance for a test chart and collect all English
    narrative strings from the response for tone checking."""
    chart_id = _create_test_chart(client)

    resp = client.get(
        f"/api/v1/charts/{chart_id}/daily-guidance",
        params={"date": date.today().isoformat()},
    )
    if resp.status_code != 200:
        return []

    data = resp.json().get("data", {})
    texts: list[str] = []

    def _collect(obj: object) -> None:
        if isinstance(obj, dict):
            for key, val in obj.items():
                if key == "en" and isinstance(val, str):
                    texts.append(val)
                else:
                    _collect(val)
        elif isinstance(obj, list):
            for item in obj:
                _collect(item)

    _collect(data)
    return texts


def test_daily_guidance_narrative_passes_tone_check(client) -> None:
    texts = _get_narrative_texts(client)
    assert texts, "Expected at least one English narrative string from daily-guidance"
    violations: list[tuple[str, list[str]]] = []
    for text in texts:
        found = tone_validator(text)
        if found:
            violations.append((text[:120], found))

    assert violations == [], (
        f"Tone violations found in {len(violations)} string(s):\n"
        + "\n".join(f"  {v[1]} in: {v[0]!r}" for v in violations[:10])
    )


def test_narrative_engine_catalog_strings_pass_tone_check() -> None:
    """Run tone_validator over all static string catalogs in narrative_engine."""
    import app.services.narrative_engine as ne

    catalogs = [
        ne.PLANET_NAME,
        ne.RASI_NAME,
        ne.NAKSHATRA_NAME,
        ne._DASHA_CHARACTER,
        ne._ANTARA_NOTE,
        ne._SANI_CYCLE_WARN,
        ne._PLANET_REMEDY,
        ne._CYCLE_REMEDY,
    ]
    violations: list[tuple[str, list[str]]] = []

    for catalog in catalogs:
        for key, bitext in catalog.items():
            for lang_text in (bitext.ta, bitext.en):
                found = tone_validator(lang_text)
                if found:
                    violations.append((f"{key}: {lang_text[:80]}", found))

    for nested_catalog in (ne._TRANSIT_QUALITY,):
        for outer_key, inner in nested_catalog.items():
            for inner_key, bitext in inner.items():
                for lang_text in (bitext.ta, bitext.en):
                    found = tone_validator(lang_text)
                    if found:
                        violations.append((f"{outer_key}.{inner_key}: {lang_text[:80]}", found))

    assert violations == [], (
        f"Tone violations in static catalogs ({len(violations)} strings):\n"
        + "\n".join(f"  {v[1]} in: {v[0]!r}" for v in violations[:10])
    )
