"""Daily green/red-light board across all activity types."""
from __future__ import annotations

import pytest

from app.calculations.activity_timing_rules import (
    ACTIVITY_LABEL_EN,
    ACTIVITY_LABEL_TA,
    ACTIVITY_TYPES,
    assess_activity_timing,
    daily_activity_board,
)

# Pournami in Shukla paksha on a Thursday — the most supportive combination the
# rules describe. Navami is a rikta tithi; Saturday is unfavourable for new work.
_GOOD_DAY = (15, "SHUKLA", "JUPITER")
_HARD_DAY = (9, "KRISHNA", "SATURN")


@pytest.mark.no_db
def test_every_activity_type_has_bilingual_labels() -> None:
    for activity in ACTIVITY_TYPES:
        assert ACTIVITY_LABEL_TA[activity].strip(), f"{activity} has no Tamil label"
        assert ACTIVITY_LABEL_EN[activity].strip(), f"{activity} has no English label"


@pytest.mark.no_db
def test_board_covers_every_activity_exactly_once() -> None:
    board = daily_activity_board(*_GOOD_DAY)
    seen = [v.activity for v in board.favourable + board.caution + board.neutral]
    assert sorted(seen) == sorted(ACTIVITY_TYPES), "board dropped or duplicated an activity"


@pytest.mark.no_db
def test_the_fallback_other_activity_is_not_shown() -> None:
    """"other" is a placeholder for an unclassified user goal; presenting it on
    a daily board would read as a real recommendation."""
    board = daily_activity_board(*_GOOD_DAY)
    assert all(v.activity != "other" for v in board.favourable + board.caution + board.neutral)


@pytest.mark.no_db
def test_a_supportive_day_produces_green_and_a_hard_day_produces_red() -> None:
    good = daily_activity_board(*_GOOD_DAY)
    hard = daily_activity_board(*_HARD_DAY)
    assert good.favourable, "the most supportive panchangam combination produced no green light"
    assert hard.caution, "a rikta tithi on Saturday produced no caution"
    assert len(good.favourable) > len(hard.favourable)


@pytest.mark.no_db
def test_board_agrees_with_the_underlying_rule_for_every_activity() -> None:
    """The board must be a partition of the existing rules, not a second
    opinion — a divergence here would mean two parts of the app disagreeing
    about the same day."""
    tithi, paksha, lord = _HARD_DAY
    board = daily_activity_board(tithi, paksha, lord)
    bucket_of = {}
    for verdict in board.favourable:
        bucket_of[verdict.activity] = "SUPPORTS"
    for verdict in board.caution:
        bucket_of[verdict.activity] = "CAUTION"
    for verdict in board.neutral:
        bucket_of[verdict.activity] = "NEUTRAL"

    for activity in ACTIVITY_TYPES:
        expected = assess_activity_timing(activity, tithi, paksha, lord).combined_alignment
        assert bucket_of[activity] == expected, (
            f"board placed {activity} in {bucket_of[activity]} but the rule says {expected}"
        )


@pytest.mark.no_db
def test_chandrashtama_suppresses_every_green_light() -> None:
    """The app raises a Chandrashtama alert; telling the same user it is a good
    day to sign a contract would contradict it."""
    board = daily_activity_board(*_GOOD_DAY, is_chandrashtama=True)
    assert board.favourable == [], "green lights survived a Chandrashtama day"
    assert board.is_chandrashtama is True


@pytest.mark.no_db
def test_chandrashtama_does_not_erase_cautions() -> None:
    """Suppressing green must not also hide red — the warnings still apply."""
    plain = daily_activity_board(*_HARD_DAY)
    flagged = daily_activity_board(*_HARD_DAY, is_chandrashtama=True)
    assert len(flagged.caution) == len(plain.caution)


@pytest.mark.no_db
def test_every_verdict_carries_a_reason() -> None:
    board = daily_activity_board(*_HARD_DAY)
    for verdict in board.favourable + board.caution + board.neutral:
        assert verdict.reason_ta.strip(), f"{verdict.activity} has no Tamil reason"
        assert verdict.reason_en.strip(), f"{verdict.activity} has no English reason"
