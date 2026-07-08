"""Unit tests for the Track A daily briefing synthesizer.

Pure, deterministic, no DB — exercises the prioritisation / dedup / tone logic
in ``app.services.daily_briefing_synth`` directly with marker fragments so we can
assert exactly which signals survive the weave and in what register.
"""
from __future__ import annotations

import pytest

from app.services.daily_briefing_synth import (
    _CONNECTORS_CAUTION,
    _CONNECTORS_SUPPORT,
    _OPENERS,
    BiText,
    BriefingInputs,
    synthesize_daily_briefing,
)

pytestmark = pytest.mark.no_db


def _inputs(**overrides) -> BriefingInputs:
    """A neutral baseline (every component at 50, no forced caution, no window).

    Each fragment carries a distinctive MARKER token so presence/absence in the
    woven output is unambiguous; override individual fields per test.
    """
    base = dict(
        label="GOOD",
        moon_score=50,
        dasha_score=50,
        transit_score=50,
        panchangam_score=50,
        personal_score=50,
        moon_transit=BiText("MOONMARK நிலா", "MOONMARK the Moon"),
        dasha_support=BiText("DASHAMARK தசை", "DASHAMARK the dasha"),
        gochar=BiText("GOCHARMARK கோசாரம்", "GOCHARMARK the transit"),
        panchangam=BiText("PANCHMARK பஞ்சாங்கம்", "PANCHMARK the panchangam"),
        personal_caution=BiText("CAUTIONMARK எச்சரிக்கை", "CAUTIONMARK a personal caution"),
        action=BiText("ACTIONMARK செய்", "ACTIONMARK do this one thing"),
        seed="test-seed",
    )
    base.update(overrides)
    return BriefingInputs(**base)


def test_leads_with_verdict_opener() -> None:
    out = synthesize_daily_briefing(_inputs(label="STRONG_SUPPORT"))
    assert any(out.en.startswith(v.en) for v in _OPENERS["STRONG_SUPPORT"])
    assert any(out.ta.startswith(v.ta) for v in _OPENERS["STRONG_SUPPORT"])


def test_unknown_label_falls_back_to_balanced_opener() -> None:
    out = synthesize_daily_briefing(_inputs(label="NOT_A_REAL_LABEL"))
    assert any(out.en.startswith(v.en) for v in _OPENERS["BALANCED"])


def test_neutral_signals_are_dropped() -> None:
    # Every component sits at neutral → no driver clears the salience band.
    out = synthesize_daily_briefing(_inputs())
    for marker in ("MOONMARK", "DASHAMARK", "GOCHARMARK", "PANCHMARK", "CAUTIONMARK"):
        assert marker not in out.en, f"neutral driver {marker} should have been dropped"
    # The action is the one thing that always survives.
    assert "ACTIONMARK" in out.en


def test_action_always_present() -> None:
    for scores in ({}, {"label": "RESTORATIVE", "moon_score": 10}, {"moon_score": 95}):
        out = synthesize_daily_briefing(_inputs(**scores))
        assert "ACTIONMARK" in out.en
        assert "ACTIONMARK" in out.ta


def test_only_top_two_drivers_surface() -> None:
    # Four salient drivers, but only the two strongest should be woven in.
    out = synthesize_daily_briefing(_inputs(
        moon_score=95,        # salience 45
        dasha_score=90,       # salience 40
        transit_score=88,     # salience 38
        panchangam_score=85,  # salience 35
    ))
    assert "MOONMARK" in out.en
    assert "DASHAMARK" in out.en
    assert "GOCHARMARK" not in out.en
    assert "PANCHMARK" not in out.en


def test_forced_chandrashtama_pins_caution_and_dedupes_moon() -> None:
    # Chandrashtama depresses the Moon score — the caution and the Moon driver
    # would otherwise name the same phenomenon twice.
    out = synthesize_daily_briefing(_inputs(chandrashtama=True, moon_score=15))
    assert "CAUTIONMARK" in out.en          # pinned caution surfaces
    assert "MOONMARK" not in out.en          # deduped: not restated as a driver


def test_forced_sani_pins_caution_and_dedupes_gochar() -> None:
    # An active Saturn cycle is exactly what the gochar fragment reports.
    out = synthesize_daily_briefing(_inputs(sani_cycle_active=True, transit_score=15))
    assert "CAUTIONMARK" in out.en
    assert "GOCHARMARK" not in out.en


def test_caution_second_driver_uses_caution_connector() -> None:
    # Supportive lead (Moon) + cautionary second (dasha well below neutral).
    out = synthesize_daily_briefing(_inputs(moon_score=95, dasha_score=15))
    assert "DASHAMARK" in out.en
    assert any(c.en.strip() in out.en for c in _CONNECTORS_CAUTION)
    assert not any(c.en.strip() in out.en for c in _CONNECTORS_SUPPORT)


def test_support_second_driver_uses_support_connector() -> None:
    # Supportive lead (Moon) + supportive second (panchangam above neutral).
    out = synthesize_daily_briefing(_inputs(moon_score=95, panchangam_score=90))
    assert "PANCHMARK" in out.en
    assert any(c.en.strip() in out.en for c in _CONNECTORS_SUPPORT)
    assert not any(c.en.strip() in out.en for c in _CONNECTORS_CAUTION)


def test_best_window_label_is_appended() -> None:
    out = synthesize_daily_briefing(_inputs(best_window_label="6:12 am-7:30 am"))
    assert "Best window: 6:12 am-7:30 am" in out.en
    assert "6:12 am-7:30 am" in out.ta


def test_deterministic_across_calls() -> None:
    # Same inputs + seed must render byte-identical text (cacheable, not salted).
    a = synthesize_daily_briefing(_inputs(moon_score=95, dasha_score=20, seed="mars:2026-07-08"))
    b = synthesize_daily_briefing(_inputs(moon_score=95, dasha_score=20, seed="mars:2026-07-08"))
    assert a.en == b.en
    assert a.ta == b.ta


def test_seed_varies_phrasing_choice() -> None:
    # Different seeds should be able to select different opener variants.
    variants = {
        synthesize_daily_briefing(_inputs(label="GOOD", seed=f"seed-{i}")).en.split(".")[0]
        for i in range(12)
    }
    assert len(variants) > 1, "seed should drive some phrasing variation across days"
