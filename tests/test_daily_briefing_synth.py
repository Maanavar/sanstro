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


def test_sani_cycle_surfaces_as_backdrop_and_dedupes_gochar() -> None:
    # An active Saturn cycle is exactly what the gochar fragment reports, so the
    # gochar driver stays suppressed — but the cycle itself is now spoken as a
    # scoped backdrop clause, not pinned as the day's headline caution.
    out = synthesize_daily_briefing(
        _inputs(
            sani_cycle_active=True,
            transit_score=15,
            sani_background=BiText("SANIBGMARK பின்னணி", "SANIBGMARK a years-long backdrop"),
        )
    )
    assert "SANIBGMARK" in out.en
    assert "GOCHARMARK" not in out.en


def test_sani_cycle_never_takes_the_lead_slot() -> None:
    """A 2½-to-7½-year cycle must not be the first thing the reader meets.

    Pinning it there put one unchanging sentence at the head of the briefing
    every morning for years — the boilerplate complaint — and it contradicted
    the verdict it followed. The day-varying driver leads; the cycle trails it.
    """
    out = synthesize_daily_briefing(
        _inputs(
            sani_cycle_active=True,
            moon_score=90,
            sani_background=BiText("SANIBGMARK பின்னணி", "SANIBGMARK a years-long backdrop"),
        )
    )
    assert out.en.index("MOONMARK") < out.en.index("SANIBGMARK")
    # …and it stays ahead of the closing action, not tacked on after it.
    assert out.en.index("SANIBGMARK") < out.en.index("ACTIONMARK")


def test_sani_backdrop_omitted_when_phrasing_missing() -> None:
    # An unmapped cycle type yields no backdrop text; the briefing simply drops
    # the clause rather than falling back to the today-register warn line.
    out = synthesize_daily_briefing(_inputs(sani_cycle_active=True, sani_background=None))
    assert "CAUTIONMARK" not in out.en


def test_chandrashtama_still_pins_as_the_lead_caution() -> None:
    # Unlike a Saturn cycle, Chandrashtamam is genuinely day-scoped — it lands,
    # lasts a day, and lifts — so it keeps its pinned lead slot.
    out = synthesize_daily_briefing(_inputs(chandrashtama=True, panchangam_score=90))
    assert "CAUTIONMARK" in out.en
    assert out.en.index("CAUTIONMARK") < out.en.index("PANCHMARK")


def test_caution_second_driver_uses_caution_connector() -> None:
    # Supportive lead (Moon) + cautionary second (dasha well below neutral).
    out = synthesize_daily_briefing(_inputs(moon_score=95, dasha_score=15))
    assert "DASHAMARK" in out.en
    assert any(c.en.strip() in out.en for c in _CONNECTORS_CAUTION)
    assert not any(c.en.strip() in out.en for c in _CONNECTORS_SUPPORT)


def test_second_driver_is_decapitalised_after_the_connector() -> None:
    # Fragments are written to stand alone, so each opens with a capital. Glued
    # after a lower-case connector that produced "At the same time, Your mood…".
    out = synthesize_daily_briefing(
        _inputs(
            moon_score=95,
            panchangam_score=90,
            panchangam=BiText("பஞ்சாங்கம்", "Your Panchangam reads well"),
        )
    )
    assert "your Panchangam reads well" in out.en
    assert "Your Panchangam reads well" not in out.en


def test_proper_noun_keeps_its_capital_after_the_connector() -> None:
    out = synthesize_daily_briefing(
        _inputs(
            moon_score=95,
            panchangam_score=90,
            panchangam=BiText("பஞ்சாங்கம்", "Jupiter reads supportive today"),
        )
    )
    assert "Jupiter reads supportive today" in out.en


def test_dash_free_connector_chosen_when_fragment_carries_a_dash() -> None:
    # "One thing worth noting — your mood may run flat — the day leans…" reads
    # as a stutter; the dash-free connector forms exist for exactly this case.
    out = synthesize_daily_briefing(
        _inputs(
            moon_score=95,
            dasha_score=15,
            dasha_support=BiText("தசை — குறைவு", "DASHAMARK the dasha — support is reduced"),
        )
    )
    assert "DASHAMARK" in out.en
    used = [c for c in _CONNECTORS_CAUTION if c.en in out.en]
    assert used, "a caution connector should have been used"
    assert not any(c.en.rstrip().endswith("—") for c in used)


def test_support_second_driver_uses_support_connector() -> None:
    # Supportive lead (Moon) + supportive second (panchangam above neutral).
    out = synthesize_daily_briefing(_inputs(moon_score=95, panchangam_score=90))
    assert "PANCHMARK" in out.en
    assert any(c.en.strip() in out.en for c in _CONNECTORS_SUPPORT)
    assert not any(c.en.strip() in out.en for c in _CONNECTORS_CAUTION)


def test_no_window_line_appended() -> None:
    # The briefing no longer carries its own best-window line — the action text
    # already states it on active days and both dashboards show it as a metric,
    # so restating it here duplicated the window (in two clock formats).
    out = synthesize_daily_briefing(_inputs())
    assert "Best window" not in out.en
    assert "சிறந்த நேரம்" not in out.ta


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


# ── Lead-clause trimming ──────────────────────────────────────────────────────

def test_trim_cuts_at_the_earliest_separator_not_a_fixed_precedence() -> None:
    """A chip that contains its own full stop must not drag the next chip along.

    The Ezhara Sani warns are written as two sentences, so on a Chandrashtamam +
    Ezhara day the joined caution "Chandrashtamam — … · Ezhara Sani — phase 1.
    Prepare…" got cut at the *inner* full stop, carrying two chips into the
    briefing with the second one beheaded.
    """
    out = synthesize_daily_briefing(
        _inputs(
            chandrashtama=True,
            personal_caution=BiText(
                "CAUTIONMARK · SECONDCHIP — கட்டம் 1. தயாராகுங்கள்.",
                "CAUTIONMARK — stress possible · SECONDCHIP — phase 1. Prepare for it.",
            ),
        )
    )
    assert "CAUTIONMARK" in out.en
    assert "SECONDCHIP" not in out.en


# ── Counterweight ─────────────────────────────────────────────────────────────

def test_lone_caution_is_promoted_so_a_strong_day_is_not_uniformly_rosy() -> None:
    """Salience alone let a real caution lose its slot to a slightly louder positive.

    Panchangam 88 (salience 38) and Moon 85 (35) both beat dasha 18 (32), so the
    briefing surfaced two positives and silently dropped the day's only
    counterweight — the one thing the reader would most want flagged.
    """
    out = synthesize_daily_briefing(_inputs(panchangam_score=88, moon_score=85, dasha_score=18))
    assert "DASHAMARK" in out.en
    assert out.en.index("PANCHMARK") < out.en.index("DASHAMARK"), "the lead is untouched"
    assert "MOONMARK" not in out.en, "the caution takes the second slot, not a third"


def test_promotion_is_a_no_op_when_a_caution_already_survived() -> None:
    out = synthesize_daily_briefing(_inputs(panchangam_score=88, moon_score=12, dasha_score=18))
    assert "MOONMARK" in out.en, "the louder caution keeps the slot it earned"
    assert "DASHAMARK" not in out.en


def test_nothing_is_promoted_when_no_caution_cleared_the_neutral_band() -> None:
    # dasha at 49 is inside the neutral band and never became a driver at all;
    # promotion must not resurrect it.
    out = synthesize_daily_briefing(_inputs(panchangam_score=88, moon_score=85, dasha_score=49))
    assert "DASHAMARK" not in out.en
    assert "PANCHMARK" in out.en and "MOONMARK" in out.en
