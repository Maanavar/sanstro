"""Gates for the changes taken from the 2026-11-09 astrologer review.

docs/ASTROLOGER_REVIEW_RESPONSE_2026-11-09.md lists each answer, what was
built, and what was left for the owner. These tests are the built half.

All charts here are the review sheet's synthetic charts, reduced to the few
facts each rule reads (lagna, a planet's rasi, combustion, the Moon's motion).
No real person's birth data.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.calculations.house_lords import house_significations
from app.services import five_minute_reading_service as five
from app.services import nakshatra_content
from app.services import one_minute_reading_service as one

MEENA, KADAGA, MITHUNA = 12, 4, 3


def _planet(graha: str, rasi: int, *, combust: bool = False) -> SimpleNamespace:
    return SimpleNamespace(graha=graha, rasi=rasi, is_combust=combust)


# Chart 1 (synthetic): Meena lagna, Venus exalted in Meena, Jupiter in Kanni.
CHART_1 = one.LordStanding.from_chart(MEENA, [_planet("VENUS", 12), _planet("JUPITER", 6)])
# Chart 3 (synthetic): Kadaga lagna, Venus combust in Viruchigam, Mars in Thulam.
CHART_3 = one.LordStanding.from_chart(KADAGA, [_planet("VENUS", 8, combust=True), _planet("MARS", 7)])


# ── Q1/Q3: a natural benefic's promise needs functional benefic lordship ─────


def test_venus_promise_is_withheld_where_venus_rules_the_3rd_and_8th() -> None:
    adult_promise = one._VOICE["VENUS"].now_texture
    ta, en = one._now_texture("VENUS", "self", CHART_1)
    assert (ta, en) != adult_promise
    assert "மூன்றாம், எட்டாம் வீடுகளுக்கு அதிபதி" in ta
    assert "3rd and 8th houses" in en
    # Exaltation does not buy the promise back: lordship decides (review Q1).
    assert "VENUS" not in CHART_1.debilitated


def test_jupiter_promise_holds_for_its_own_lagna() -> None:
    """Meena's lagna lord. Without this the gate could be 'never promise'."""
    assert one._now_texture("JUPITER", "self", CHART_1) == one._VOICE["JUPITER"].now_texture


def test_withheld_lagna_never_defaults_to_the_promise() -> None:
    ta, en = one._now_texture("VENUS", "self", None)
    assert ta == one.conditioned_period_texture("VENUS", None)[0]
    assert "rising sign" in en


def test_non_promissory_lords_are_untouched() -> None:
    for lord in ("SUN", "MOON", "MARS", "MERCURY", "SATURN", "RAHU", "KETU"):
        assert one._now_texture(lord, "self", None) == one._VOICE[lord].now_texture


def test_teen_keeps_the_minor_texture_when_the_promise_holds() -> None:
    # Thulam lagna: Venus is the lagna lord and is placed (here) uncombust.
    thulam = one.LordStanding.from_chart(7, [_planet("VENUS", 7)])
    assert one._now_texture("VENUS", "client_with_guardian", thulam) == one._MINOR_NOW_TEXTURE["VENUS"]


# ── Q4: the bhukti clause takes the same gate ────────────────────────────────


def test_child_venus_bhukti_names_the_houses_venus_rules_for_kadaga() -> None:
    ta, en = five.bhukti_flavor("VENUS", them=True, standing=CHART_3)
    assert ta != five._BHUKTI_FLAVOR["VENUS"][0]
    assert "நான்காம், பதினொன்றாம்" in ta
    assert "4th and 11th" in en


def test_combust_benefic_loses_the_promise() -> None:
    # Thulam lagna, Venus lagna lord but combust: lordship passes, condition fails.
    thulam = one.LordStanding.from_chart(7, [_planet("VENUS", 7, combust=True)])
    ta, en = five.bhukti_flavor("VENUS", them=False, standing=thulam)
    assert "சூரியனுக்கு மிக அருகில்" in ta
    assert "too close to the Sun" in en


# ── Q5: the "patience in learning" verdict needs the lagna to agree ─────────


_DATES = ("நவம்பர் 2028", "November 2028")


def test_yogakaraka_mars_does_not_get_the_slow_learning_verdict() -> None:
    assert one._outlook("CHILD_GROWTH", "MARS", _DATES, CHART_3) == one._OUTLOOK_MIXED


def test_slow_verdict_still_prints_where_mars_is_a_functional_malefic() -> None:
    """Mithuna lagna: Mars rules the 6th and 11th. Proves the gate is the
    cause above, not a table edit that silenced Mars everywhere."""
    mithuna = one.LordStanding.from_chart(MITHUNA, [_planet("MARS", 1)])
    ta, _ = one._outlook("CHILD_GROWTH", "MARS", _DATES, mithuna)
    assert "பொறுமை தேவை" in ta


def test_no_outlook_verdict_without_a_lagna() -> None:
    assert one._outlook("CHILD_GROWTH", "MARS", _DATES, None) == one._OUTLOOK_MIXED
    assert one._outlook("EDUCATION", "JUPITER", _DATES, None) == one._OUTLOOK_MIXED


# ── Q6: no study-direction prediction off a dasa handover ───────────────────


def test_child_forward_beat_makes_no_schooling_prediction() -> None:
    import inspect

    source = inspect.getsource(one._beat_years_ahead_for_a_child)
    assert "இன்னும் தெளிவாகலாம்" not in source
    assert "ஒரே மாதிரி போகும்" not in source


# ── Q9: the 5th lord beside the 4th, and the exchange stated ────────────────


def test_child_house_beat_states_the_4th_5th_exchange() -> None:
    venus = SimpleNamespace(graha="VENUS", house_from_lagna=5)
    mars = SimpleNamespace(graha="MARS", house_from_lagna=4)
    ta, en = five._child_learning_house_clause(
        house=4, lord="VENUS", record=venus, lagna_rasi=KADAGA, planets=(venus, mars)
    )
    assert "பரிவர்த்தனை" in ta
    assert "exchange" in en


def test_child_house_beat_without_exchange_names_the_5th_lord_only() -> None:
    venus = SimpleNamespace(graha="VENUS", house_from_lagna=2)
    mars = SimpleNamespace(graha="MARS", house_from_lagna=4)
    ta, _ = five._child_learning_house_clause(
        house=4, lord="VENUS", record=venus, lagna_rasi=KADAGA, planets=(venus, mars)
    )
    assert "செவ்வாய்" in ta
    assert "பரிவர்த்தனை" not in ta


# ── Q10: the 12th house line ────────────────────────────────────────────────


def test_twelfth_house_is_not_only_expenses_foreign_liberation() -> None:
    ta, en = house_significations(12)
    for word in ("தூக்கம்", "தானம்", "மோட்சம்"):
        assert word in ta
    assert "sleep" in en and "charity" in en


# ── Q11: the eight symbols the review settled ───────────────────────────────


def test_rejected_symbols_are_gone_from_the_readings_list() -> None:
    import inspect

    source = inspect.getsource(nakshatra_content)
    for rejected in ("சிங்கத்தின் வால்", "மயில் தோகை", "Lion's tail", "Peacock feather"):
        assert rejected not in source, rejected


# ── Q12: the unconfirmed-time disclosure tells the truth about the dates ─────


def _moon(longitude: float, speed: float = 13.4) -> SimpleNamespace:
    return SimpleNamespace(absolute_longitude=longitude, speed_deg_per_day=speed)


def test_dates_move_months_per_hour_for_a_ketu_opening() -> None:
    """Chart 2's shape: Moon early in Moolam (Ketu, 7 years)."""
    profile = SimpleNamespace(birth_time_confidence_minutes=0)
    spread = one.dasa_date_spread(profile=profile, moon=_moon(243.33), opening_lord="KETU")
    assert not spread.star_may_change
    # 13.4 deg/day / 24 / 13.333 * 7 years ~= 0.293 years ~= 107 days an hour.
    assert 95 <= spread.days_per_hour <= 120


def test_star_boundary_inside_the_window_is_reported() -> None:
    """0.1 deg past the Kettai/Moolam line: an hour earlier is Kettai."""
    profile = SimpleNamespace(birth_time_confidence_minutes=0)
    spread = one.dasa_date_spread(profile=profile, moon=_moon(240.1), opening_lord="KETU")
    assert spread.star_may_change


@pytest.mark.parametrize(
    ("addressed_to", "lagna_reliable"),
    [("self", False), ("other", False), ("parent", False)],
)
def test_unconfirmed_disclosure_no_longer_says_the_dates_stand(
    addressed_to: str, lagna_reliable: bool
) -> None:
    spread = one.DateSpread(star_may_change=False, days_per_hour=107)
    beat = one._beat_what_this_rests_on(
        display_name="Divya Synthetic",
        lagna_reliable=lagna_reliable,
        addressed_to=addressed_to,
        birth_time_source="unknown",
        date_spread=spread,
    )
    assert "லக்னத்தைச் சார்ந்தவை அல்ல" not in beat.text.ta
    assert "every date here stand" not in beat.text.en
    assert "which the rest is built on" not in beat.text.en
    assert "4 மாதங்கள்" in beat.text.ta
    assert "about 4 months" in beat.text.en


def test_every_unconfirmed_disclosure_carries_the_anchor_the_closing_replaces() -> None:
    """If a copy edit drops the anchor, the replacement silently stops — and
    the false closing ships again. This is that tripwire."""
    for (_register, reliable), (ta, en) in one._FALSIFIABILITY.items():
        if reliable:
            continue
        assert one._TA_LAGNA_CLAUSE_END in ta
        assert one._EN_LAGNA_CLAUSE_END in en
