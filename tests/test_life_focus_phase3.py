"""Life Focus, Phase 3: the morning push's focus line.

docs/LIFE_FOCUS_PLAN_2026-09-22.md §5 Phase 3. The line is read off the day's
activity board, which the push already fetches with the guidance, so it adds no
calculation and can never disagree with the Today board.

What these tests can see: which verdict is named, when there is no line, D4,
and that the line reaches the dispatched body. What they cannot see: the real
board for a real chart (the board's own doctrine is covered elsewhere), and
how a phone truncates the body.
"""
from __future__ import annotations

from datetime import UTC, date, datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

import app.services.life_focus_service as focus_service
from app.schemas.daily_guidance import DailyActivityBoardData, DailyActivityVerdict, DailyGuidanceText

pytestmark = pytest.mark.no_db

_LABELS = {
    "job_change": ("வேலை மாற்றம்", "Job moves"),
    "business_start": ("தொழில் தொடக்கம்", "Starting a business"),
    "money": ("பண முடிவுகள்", "Money decisions"),
    "travel_abroad": ("வெளிநாட்டுப் பயணம்", "Setting out abroad"),
}


def _row(activity: str, alignment: str) -> DailyActivityVerdict:
    ta, en = _LABELS[activity]
    return DailyActivityVerdict(
        activity=activity,
        label=DailyGuidanceText(ta=ta, en=en),
        alignment=alignment,
        reason=DailyGuidanceText(ta="-", en="-"),
    )


def _board(favourable=(), caution=(), neutral=()) -> DailyActivityBoardData:
    return DailyActivityBoardData(
        favourable=[_row(a, "SUPPORTS") for a in favourable],
        caution=[_row(a, "CAUTION") for a in caution],
        neutral=[_row(a, "NEUTRAL") for a in neutral],
        isChandrashtama=False,
    )


@pytest.fixture
def focus(monkeypatch):
    """Set the reader's focus and whether the chart is their own, without a DB."""
    state = {"focus": "CAREER", "own": True}
    monkeypatch.setattr(focus_service, "resolve_focus", lambda _s, _u: state["focus"])
    monkeypatch.setattr(focus_service, "is_own_chart", lambda _s, _p: state["own"])
    return state


def _line(board):
    return focus_service.focus_push_line(None, object(), uuid4(), board)


def test_names_the_focus_activity_the_board_favours(focus):
    ta, en = _line(_board(favourable=["travel_abroad", "business_start"], neutral=["job_change"]))
    assert en == "Your focus, Career. Starting a business: supported today."
    assert ta == "உங்கள் கவனம், தொழில். தொழில் தொடக்கம்: இன்று உகந்தது."


def test_follows_the_focus_order_not_the_board_order(focus):
    # D1 order for CAREER is job_change, then business_start.
    _, en = _line(_board(favourable=["business_start", "job_change"]))
    assert "Job moves: supported today." in en


def test_a_favoured_activity_outranks_a_cautioned_one(focus):
    _, en = _line(_board(favourable=["business_start"], caution=["job_change"]))
    assert "Starting a business: supported today." in en


def test_falls_back_to_a_caution(focus):
    _, en = _line(_board(caution=["job_change"], favourable=["travel_abroad"]))
    assert en == "Your focus, Career. Job moves: go carefully today."


def test_no_line_when_the_board_says_nothing_about_the_focus(focus):
    # A neutral or Chandrashtama day: silence, not filler.
    assert _line(_board(neutral=["job_change", "business_start"], favourable=["travel_abroad"])) is None
    assert _line(None) is None


@pytest.mark.parametrize("mode", ["BALANCED", "REMEDIES", "LOVE", None])
def test_no_line_for_a_focus_with_no_activities_or_none_chosen(focus, mode):
    focus["focus"] = mode
    assert _line(_board(favourable=["job_change", "money"])) is None


def test_no_line_on_a_family_members_chart(focus):
    # D4 (ruling Q2): a focus is about the reader's own life.
    focus["own"] = False
    assert _line(_board(favourable=["job_change"])) is None


def test_the_area_label_is_the_life_area_one(focus):
    focus["focus"] = "WEALTH"
    ta, en = _line(_board(favourable=["money"]))
    assert en.startswith("Your focus, Money / Wealth. Money decisions:")
    assert ta.startswith("உங்கள் கவனம், பணம் / செல்வம். பண முடிவுகள்:")


# ── The cron ──────────────────────────────────────────────────────────────────

def _dispatch(monkeypatch, *, focus_line):
    """Run one morning push with guidance mocked; return the dispatched body."""
    import app.services.daily_push_cron as cron

    user = MagicMock(user_id=uuid4(), email="user@example.com")
    pref = MagicMock(morning_alert_enabled=True, dasha_alert_enabled=False, pirantha_naal_alert_enabled=False)
    profile = MagicMock(current_latitude=13.08, current_longitude=80.27, current_timezone="Asia/Kolkata")
    chart = MagicMock(chart_id=uuid4())

    slot = MagicMock(start=datetime(2026, 10, 9, 4, 0, tzinfo=UTC), end=datetime(2026, 10, 9, 5, 0, tzinfo=UTC))
    slot.name = "LABHAM"
    rahu = MagicMock(start=datetime(2026, 10, 9, 7, 30, tzinfo=UTC), end=datetime(2026, 10, 9, 9, 0, tzinfo=UTC))
    panchang = MagicMock(nakshatra_number=1, dominant_nakshatra_number=1, nalla_neram=[slot], rahu_kalam=rahu)

    guidance = MagicMock()
    guidance.data.score = 60
    guidance.data.label = "BALANCED"
    guidance.data.is_chandrashtama = False
    guidance.data.action_suggestion.ta = guidance.data.action_suggestion.en = ""
    guidance.data.reasons.dasha_support.ta = guidance.data.reasons.dasha_support.en = ""
    guidance.data.activity_board = _board(favourable=["job_change"])

    sent: dict = {}
    monkeypatch.setattr(cron, "_latest_active_profile", lambda *_: profile)
    monkeypatch.setattr(cron, "_latest_completed_chart", lambda *_: chart)
    monkeypatch.setattr(cron, "_morning_alert_due", lambda *_: True)
    monkeypatch.setattr(cron, "_already_sent_today", lambda *_: False)
    monkeypatch.setattr(cron, "calculate_daily_panchangam", lambda *_: panchang)
    monkeypatch.setattr(cron, "build_nakshatra_perspective", lambda *_: None)
    monkeypatch.setattr(cron, "get_daily_guidance", lambda *_: guidance)
    monkeypatch.setattr(cron, "focus_push_line", focus_line)
    monkeypatch.setattr(cron, "dispatch_notification", lambda **kw: sent.update(kw) or "sent_push")

    result = cron._dispatch_for_user(MagicMock(), user, pref, date(2026, 10, 9), datetime(2026, 10, 9, 0, 30, tzinfo=UTC))
    return result, sent


def test_the_line_reaches_the_dispatched_body(monkeypatch):
    def line(_session, _profile, _owner, board):
        assert board.favourable[0].activity == "job_change"  # the guidance's own board
        return ("TA-LINE", "EN-LINE")

    result, sent = _dispatch(monkeypatch, focus_line=line)
    assert result["MORNING_NALLA_NERAM"] == "sent_push"
    assert sent["body_en"].endswith(" EN-LINE")
    assert sent["body_ta"].endswith(" TA-LINE")


def test_a_failing_focus_line_still_sends_the_push(monkeypatch):
    def broken(*_args):
        raise RuntimeError("boom")

    result, sent = _dispatch(monkeypatch, focus_line=broken)
    assert result["MORNING_NALLA_NERAM"] == "sent_push"
    assert "boom" not in sent["body_en"]
