"""Life focus, Phase 2 acceptance: the score-invariance test (plan D2).

"Two users with the same chart and different focuses see the same numbers in a
different order." This pins the *numbers* half for one synthetic chart across
all ten focuses. The *order* half is client-side (web/lib/life-focus.test.ts).

What this cannot see: a web component that edits a value after it arrives.
The client helpers only reorder, and their test asserts they return the same
objects, but a component that bypasses them is outside both tests.
"""
from __future__ import annotations

import pytest

from app.core.life_mode import ALL_LIFE_MODES
from tests.test_life_focus_phase1 import _PARAMS, _create_chart

# The one field a focus is allowed to reword (Phase 1: the goal-track hint on
# the action line). Everything else in the payload must be identical.
_FOCUS_WORDED = {"actionSuggestion"}


def _guidance(client, chart_id: str) -> dict:
    response = client.get(f"/api/v1/charts/{chart_id}/daily-guidance", params=_PARAMS)
    assert response.status_code == 200, response.text
    return {k: v for k, v in response.json()["data"].items() if k not in _FOCUS_WORDED}


def _life_areas(client, chart_id: str) -> list:
    response = client.get(f"/api/v1/charts/{chart_id}/life-areas", params={"asOf": _PARAMS["date"]})
    assert response.status_code == 200, response.text
    return response.json()["data"]["areas"]


def test_every_focus_sees_the_same_numbers(client, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory())

    client.patch("/api/v1/settings/life-mode", json={"mode": "BALANCED"})
    baseline_guidance = _guidance(client, chart_id)
    baseline_areas = _life_areas(client, chart_id)
    # Guard the guard: an empty board or area list would make every
    # comparison below pass vacuously.
    assert baseline_guidance["activityBoard"], "no activity board to compare"
    assert baseline_guidance["bestWindows"], "no windows to compare"
    assert baseline_areas, "no life areas to compare"

    checked = []
    for mode in sorted(ALL_LIFE_MODES):
        saved = client.patch("/api/v1/settings/life-mode", json={"mode": mode})
        if saved.status_code != 200:
            # A mode the synthetic profile is not offered (age / marital gate).
            continue
        assert _guidance(client, chart_id) == baseline_guidance, f"{mode} moved a daily-guidance value"
        assert _life_areas(client, chart_id) == baseline_areas, f"{mode} moved a life-area value"
        checked.append(mode)

    # Every focus that carries a track or an area must actually have been run.
    assert {"STUDY", "CAREER", "WEALTH", "FAMILY", "HEALTH", "REMEDIES"} <= set(checked), checked


@pytest.fixture
def focus_dependent_score(monkeypatch):
    """The deliberate violation the plan asks this gate to be run against."""
    import app.services.daily_guidance_service as dg

    real_build = dg.build_daily_guidance_response

    def _leaky(*args, **kwargs):
        response = real_build(*args, **kwargs)
        if kwargs.get("goal_track"):
            response.data.score = min(100, response.data.score + 5)
        return response

    monkeypatch.setattr(dg, "build_daily_guidance_response", _leaky)


def test_the_gate_fails_when_a_focus_moves_a_score(client, birth_profile_payload_factory, focus_dependent_score):
    chart_id = _create_chart(client, birth_profile_payload_factory())
    client.patch("/api/v1/settings/life-mode", json={"mode": "BALANCED"})
    baseline = _guidance(client, chart_id)
    client.patch("/api/v1/settings/life-mode", json={"mode": "CAREER"})
    assert _guidance(client, chart_id) != baseline
