"""Unit tests for the shared Today-card remedy selection (no DB needed).

These lock the chart-driven behaviour the "Remedy For You" card depends on:
the anchor is the running dasa lord, weakness is asserted only when the planet
is genuinely among the weakest, and every graha has a reminder weekday. The
remedy-plan endpoint and the daily-guidance card both route through
`select_remedy_focus`, so these guard that shared contract.
"""
import pytest

from app.calculations.remedies import PLANET_REMEDY_WEEKDAY, select_remedy_focus

# Aries lagna throughout; the pure selection only consults functional nature via
# get_functional_nature, so a fixed lagna keeps the cases deterministic.
ARIES_LAGNA = 1
_ALL_WEEKDAYS = {"SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"}


@pytest.mark.no_db
def test_anchor_is_running_dasa_lord_and_flags_real_weakness():
    strengths = [
        ("SUN", 70), ("MOON", 30), ("MARS", 65), ("MERCURY", 55),
        ("JUPITER", 80), ("VENUS", 60), ("SATURN", 40), ("RAHU", 50), ("KETU", 45),
    ]
    focus = select_remedy_focus(
        lagna_rasi=ARIES_LAGNA,
        planet_strengths=strengths,
        current_maha_lord="MOON",
        active_dosham_planet=None,
    )
    assert focus.primary == "MOON"        # anchor = the running dasa lord
    assert focus.role == "DASHA_LORD"
    assert focus.is_weak is True          # Moon (30) is among the three weakest
    assert focus.weekday == "MONDAY"      # from PLANET_REMEDY_WEEKDAY
    assert "MOON" in focus.weakest


@pytest.mark.no_db
def test_strong_dasa_lord_is_not_falsely_called_weak():
    # The card must not claim "sits weak" when the anchor planet is strong.
    strengths = [
        ("SUN", 40), ("MOON", 35), ("MARS", 45), ("MERCURY", 55),
        ("JUPITER", 90), ("VENUS", 60), ("SATURN", 42), ("RAHU", 50), ("KETU", 48),
    ]
    focus = select_remedy_focus(
        lagna_rasi=ARIES_LAGNA,
        planet_strengths=strengths,
        current_maha_lord="JUPITER",
        active_dosham_planet=None,
    )
    assert focus.primary == "JUPITER"
    assert focus.is_weak is False
    assert focus.weekday == "THURSDAY"


@pytest.mark.no_db
def test_full_order_leads_with_maha_then_includes_dosha_planet():
    strengths = [
        ("SUN", 70), ("MOON", 60), ("MARS", 20), ("MERCURY", 55),
        ("JUPITER", 80), ("VENUS", 25), ("SATURN", 30), ("RAHU", 50), ("KETU", 45),
    ]
    focus = select_remedy_focus(
        lagna_rasi=ARIES_LAGNA,
        planet_strengths=strengths,
        current_maha_lord="SUN",
        active_dosham_planet="MARS",
    )
    assert focus.ordered[0] == "SUN"      # maha lord always leads the plan order
    assert "MARS" in focus.ordered        # the active-dosha planet is included
    assert focus.is_dosha is False        # SUN (the anchor) is not the dosha planet


@pytest.mark.no_db
def test_none_strength_defaults_do_not_crash():
    # A planet with no strength_score should default to 50, not blow up.
    strengths = [("MOON", None), ("SUN", None)]
    focus = select_remedy_focus(
        lagna_rasi=ARIES_LAGNA,
        planet_strengths=strengths,
        current_maha_lord="MOON",
        active_dosham_planet=None,
    )
    assert focus.primary == "MOON"
    assert focus.weekday == "MONDAY"


@pytest.mark.no_db
def test_every_navagraha_has_a_reminder_weekday():
    for planet in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"):
        assert PLANET_REMEDY_WEEKDAY[planet] in _ALL_WEEKDAYS
