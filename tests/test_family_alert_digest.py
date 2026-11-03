"""The evening family-alert digest (audit F5, 2026-11-03, decision D3).

One evening push names everyone — the user and each opted-in family member —
whose Chandrashtamam or birth-star day falls tomorrow. When the user's own
Chandrashtamam coincides, it rides inside the digest instead of going out as a
separate CHANDRASHTAMA push, so the household is notified once.

Synthetic data only.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, time
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

import app.services.daily_push_cron as cron
from app.calculations.panchangam import PanchangamChandrashtamamNakshatraWindow
from app.services.daily_push_cron import FamilyDigestEntry, family_digest_copy
from app.services.pirantha_naal_service import PiranthaNaalAlert

pytestmark = pytest.mark.no_db


def _window() -> PanchangamChandrashtamamNakshatraWindow:
    # Opens 2026-09-09 15:14 IST, closes 2026-09-10 08:20 IST (the D11 case).
    return PanchangamChandrashtamamNakshatraWindow(
        name="UTHIRADAM",
        start=datetime(2026, 9, 9, 9, 44, tzinfo=UTC),
        end=datetime(2026, 9, 10, 2, 50, tzinfo=UTC),
        rasi_number=10,
        rasi_name="Magaram",
    )


def _pirantha() -> PiranthaNaalAlert:
    return PiranthaNaalAlert(
        janma_nakshatra=5,
        nakshatra_name_ta="ரோகிணி",
        nakshatra_name_en="Rohini",
        alert_date=date(2026, 9, 10),
        nakshatra_ends_at="7:04 pm",
        days_away=1,
        is_today=True,
    )


# ---------------------------------------------------------------------------
# family_digest_copy — pure formatting
# ---------------------------------------------------------------------------

def test_copy_names_each_person_and_both_flags():
    entries = [
        FamilyDigestEntry(name_ta="நீங்கள்", name_en="You", chandra=_window(), is_self=True),
        FamilyDigestEntry(name_ta="அம்மா", name_en="Amma", pirantha=_pirantha()),
    ]
    copy = family_digest_copy(entries, date(2026, 9, 9), "Asia/Kolkata")

    # Self Chandrashtamam line, with the window's true edges and day-words.
    assert "You: Chandrashtamam, today 3:14 pm to tomorrow 8:20 am." in copy["body"]["en"]
    assert "நீங்கள்: சந்திராஷ்டமம். இன்று மதியம் 3:14 முதல் நாளை காலை 8:20 வரை" in copy["body"]["ta"]
    # Member birth-star line.
    assert "Amma: birth-star day tomorrow (Rohini)." in copy["body"]["en"]
    assert "அம்மா: நாளை பிறந்த நட்சத்திரம் (ரோகிணி)." in copy["body"]["ta"]


def test_copy_keeps_am_pm_out_of_tamil_and_stays_advisory():
    entries = [FamilyDigestEntry(name_ta="அப்பா", name_en="Appa", chandra=_window())]
    copy = family_digest_copy(entries, date(2026, 9, 9), "Asia/Kolkata")
    tamil = copy["title"]["ta"] + copy["body"]["ta"]
    assert "am" not in tamil and "pm" not in tamil
    assert "தவிர்ப்பது நல்லது" in tamil   # advisory, not the imperative
    assert "தவிர்க்கவும்" not in tamil
    assert "—" not in tamil               # no em-dash construction in Tamil


# ---------------------------------------------------------------------------
# _dispatch_for_user — evening composition
# ---------------------------------------------------------------------------

def _run(monkeypatch, *, member_entries, self_window, enabled=True):
    """Drive one 19:00 IST tick with the given opted-in members and own window.

    `member_entries` is the list _member_digest_entry would return per member
    (None for a member with nothing tomorrow)."""
    user = MagicMock(user_id=uuid4(), email="user@example.com")
    pref = MagicMock(
        morning_alert_enabled=False,
        morning_alert_time=time(6, 0),
        dasha_alert_enabled=False,
        pirantha_naal_alert_enabled=False,
        chandrashtama_alert_enabled=enabled,
    )
    profile = MagicMock(current_latitude=13.0827, current_longitude=80.2707, current_timezone="Asia/Kolkata")
    sent: list[dict] = []

    members = [MagicMock(name=f"m{i}") for i in range(len(member_entries))]
    entry_by_member = dict(zip(members, member_entries, strict=True))

    monkeypatch.setattr(cron, "_own_profile", lambda *_: profile)
    monkeypatch.setattr(cron, "_latest_completed_chart", lambda *_: MagicMock(chart_id=uuid4()))
    monkeypatch.setattr(cron, "_already_sent_today", lambda *_: False)
    monkeypatch.setattr(cron, "_own_chandrashtama_window", lambda *a, **k: self_window)
    monkeypatch.setattr(cron, "_opted_in_family_members", lambda *_: members)
    monkeypatch.setattr(cron, "_member_digest_entry", lambda _s, member, _d: entry_by_member[member])
    monkeypatch.setattr(cron, "dispatch_notification", lambda **kw: sent.append(kw) or "queued")

    cron._dispatch_for_user(MagicMock(), user, pref, date(2026, 9, 9), datetime(2026, 9, 9, 13, 30, tzinfo=UTC))
    return sent


def test_digest_folds_in_the_users_own_window_and_suppresses_the_standalone(monkeypatch):
    member = FamilyDigestEntry(name_ta="அம்மா", name_en="Amma", chandra=_window())
    sent = _run(monkeypatch, member_entries=[member], self_window=_window())

    assert [s["notification_type"] for s in sent] == ["FAMILY_DIGEST"]  # not CHANDRASHTAMA too
    digest = sent[0]
    assert "You:" in digest["body_en"] and "Amma:" in digest["body_en"]
    assert digest["logical_key"].endswith(":FAMILY_DIGEST:2026-09-10")


def test_member_only_digest_does_not_name_the_user(monkeypatch):
    member = FamilyDigestEntry(name_ta="தம்பி", name_en="Thambi", pirantha=_pirantha())
    sent = _run(monkeypatch, member_entries=[member], self_window=None)

    assert [s["notification_type"] for s in sent] == ["FAMILY_DIGEST"]
    assert "You:" not in sent[0]["body_en"]
    assert "Thambi:" in sent[0]["body_en"]


def test_falls_back_to_standalone_when_no_member_has_anything_tomorrow(monkeypatch):
    sent = _run(monkeypatch, member_entries=[None], self_window=_window())

    assert [s["notification_type"] for s in sent] == ["CHANDRASHTAMA"]


def test_no_opted_in_members_and_no_own_window_sends_nothing(monkeypatch):
    sent = _run(monkeypatch, member_entries=[], self_window=None)
    assert sent == []


def test_opted_in_members_is_empty_on_a_mocked_session():
    # The query chain is unresolvable on a bare MagicMock; the helper must not
    # raise, so the evening block can fall back to the standalone own alert.
    assert cron._opted_in_family_members(MagicMock(), uuid4()) == []
