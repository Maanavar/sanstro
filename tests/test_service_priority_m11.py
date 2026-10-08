from __future__ import annotations

from datetime import date, timedelta
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.models.notification import Notification
from app.models.notification_delivery import NotificationDelivery
from app.services import dasha_transition_service as dts
from app.services import muhurta_service as ms
from app.services import notification_dispatch_service as nds
from app.services import synastry_service as ss
from app.services import whatif_service as ws


def _snapshot_with_planets(planets: dict[str, float]) -> SimpleNamespace:
    return SimpleNamespace(
        data=SimpleNamespace(
            planets=[
                SimpleNamespace(graha=name, absolute_longitude=deg)
                for name, deg in planets.items()
            ]
        )
    )


def test_muhurta_nakshatra_to_rasi_mapping_boundaries() -> None:
    assert ms._nakshatra_to_rasi(1, 1) == 1
    assert ms._nakshatra_to_rasi(3, 4) == 2
    assert ms._nakshatra_to_rasi(4, 1) == 2
    assert ms._nakshatra_to_rasi(27, 4) == 12
    assert ms._nakshatra_to_rasi(10, 0) == ms._nakshatra_to_rasi(10, 1)
    with pytest.raises(ValueError):
        ms._nakshatra_to_rasi(0, 1)
    with pytest.raises(ValueError):
        ms._nakshatra_to_rasi(28, 1)


def test_dasha_next_lord_wraparound() -> None:
    assert dts._next_lord(dts.SEQUENCE[-1]) == dts.SEQUENCE[0]


def test_dasha_transition_alert_urgencies(monkeypatch: pytest.MonkeyPatch) -> None:
    today = date(2026, 6, 1)
    fake_timeline = SimpleNamespace(
        current_mahadasha=SimpleNamespace(end_date=today + timedelta(days=30), lord="JUPITER"),
        current_antardasha=SimpleNamespace(end_date=today, lord="SATURN"),
    )
    monkeypatch.setattr(dts, "calculate_vimshottari_timeline", lambda *_args, **_kwargs: fake_timeline)

    alerts = dts.get_dasha_transition_alerts(0.0, 0.0, 0.0, today)
    by_type = {a.type: a for a in alerts}

    assert by_type["MAHADASHA"].urgency == "30_DAY"
    assert by_type["MAHADASHA"].starting_lord == dts._next_lord("JUPITER")
    assert by_type["ANTARDASHA"].urgency == "TODAY"
    assert by_type["ANTARDASHA"].starting_lord == dts._next_lord("SATURN")


def test_synastry_score_supportive_label() -> None:
    chart_a = _snapshot_with_planets({"VENUS": 0.0, "MARS": 0.0, "MOON": 120.0, "SUN": 180.0})
    chart_b = _snapshot_with_planets({"VENUS": 0.0, "MARS": 0.0, "MOON": 120.0, "SUN": 240.0})

    result = ss.compute_synastry_score(chart_a, chart_b)

    assert result.label == "SUPPORTIVE"
    assert result.score >= 65
    assert len(result.key_aspects) >= 4


def test_synastry_transit_activation_hits() -> None:
    chart_a = _snapshot_with_planets({"VENUS": 0.0, "MARS": 0.0, "MOON": 120.0, "SUN": 180.0})
    chart_b = _snapshot_with_planets({"VENUS": 0.0, "MARS": 0.0, "MOON": 120.0, "SUN": 240.0})
    transit = {"SATURN": SimpleNamespace(absolute_longitude=0.5)}

    hits = ss.check_transit_activation(chart_a, chart_b, transit)

    assert len(hits) >= 1
    assert any(hit.trigger_planet == "SATURN" for hit in hits)


def test_whatif_overall_verdict_thresholds() -> None:
    # Legacy path (reasoning_gate off): band and reading are None, thresholds unchanged.
    score, verdict, band, reading = ws._overall_verdict(70, 70, 70, 70)
    assert score >= 62
    assert verdict == "FAVOURABLE"
    assert band is None
    assert reading is None

    score, verdict, band, reading = ws._overall_verdict(40, 80, 80, 70)
    assert score >= 45
    assert verdict == "NEUTRAL"
    assert band is None
    assert reading is None

    score, verdict, band, reading = ws._overall_verdict(30, 30, 30, 30)
    assert verdict == "CAUTION"
    assert band is None
    assert reading is None


def test_whatif_strength_buckets() -> None:
    assert ws._strength(70) == "STRONG"
    assert ws._strength(50) == "MODERATE"
    assert ws._strength(30) == "WEAK"


class _DispatchSession:
    bind = SimpleNamespace(dialect=SimpleNamespace(name="test"))

    def __init__(self) -> None:
        self.added: list[Notification | NotificationDelivery] = []

    def add(self, value: Notification | NotificationDelivery) -> None:
        self.added.append(value)

    def flush(self) -> None:
        pass


def _stub_dispatch_db(monkeypatch: pytest.MonkeyPatch) -> _DispatchSession:
    monkeypatch.setattr(nds, "_notification_language", lambda *_args, **_kwargs: "en")
    monkeypatch.setattr(nds, "get_flag", lambda *_args, **_kwargs: True)
    return _DispatchSession()


def test_dispatch_notification_in_app_only_when_channel_none(monkeypatch: pytest.MonkeyPatch) -> None:
    # channel="none" suppresses push/email delivery but still persists to the in-app
    # inbox (status="sent"); dispatch reflects that with "in_app_only".
    pref = SimpleNamespace(notification_channel="none", smart_silence_enabled=True, fcm_device_token=None)
    session = _stub_dispatch_db(monkeypatch)
    monkeypatch.setattr(nds, "get_or_create_preferences", lambda *_args, **_kwargs: pref)
    result = nds.dispatch_notification(
        session=session,
        user_id=uuid4(),
        notification_type="GENERAL",
        title_ta="Talaipe",
        title_en="Title",
        body_ta="Urai",
        body_en="Body",
    )
    assert result == "in_app_only"
    assert len(session.added) == 1
    assert session.added[0].status == "sent"


def test_dispatch_notification_defers_smart_silence_until_delivery(monkeypatch: pytest.MonkeyPatch) -> None:
    pref = SimpleNamespace(notification_channel="push", smart_silence_enabled=True, fcm_device_token="token")

    session = _stub_dispatch_db(monkeypatch)
    monkeypatch.setattr(nds, "get_or_create_preferences", lambda *_args, **_kwargs: pref)
    monkeypatch.setattr(nds, "_resolve_user_timezone", lambda *_args, **_kwargs: "Asia/Calcutta")
    monkeypatch.setattr(nds, "_push_count_today", lambda *_args, **_kwargs: 1)
    monkeypatch.setattr(nds, "send_push", lambda *_args, **_kwargs: (_ for _ in ()).throw(AssertionError("push should be suppressed")))

    result = nds.dispatch_notification(
        session=session,
        user_id=uuid4(),
        notification_type="GENERAL",
        title_ta="Talaipe",
        title_en="Title",
        body_ta="Urai",
        body_en="Body",
        sani_cycle="JANMA_SANI",
    )

    assert result == "queued"
    assert len(session.added) == 2
    assert session.added[0].status == "queued"
    assert session.added[1].status == "pending"


def test_dispatch_notification_both_channel_creates_two_outbox_rows(monkeypatch: pytest.MonkeyPatch) -> None:
    pref = SimpleNamespace(notification_channel="both", smart_silence_enabled=False, fcm_device_token="token")

    session = _stub_dispatch_db(monkeypatch)
    monkeypatch.setattr(nds, "get_or_create_preferences", lambda *_args, **_kwargs: pref)
    monkeypatch.setattr(nds, "send_push", lambda *_args, **_kwargs: "sent")
    monkeypatch.setattr(nds, "build_notification_email", lambda *_args, **_kwargs: object())
    monkeypatch.setattr(nds, "send_email", lambda *_args, **_kwargs: True)

    result = nds.dispatch_notification(
        session=session,
        user_id=uuid4(),
        notification_type="GENERAL",
        title_ta="Talaipe",
        title_en="Title",
        body_ta="Urai",
        body_en="Body",
        user_email="test@example.com",
    )

    assert result == "queued"
    assert len(session.added) == 3
    assert {getattr(row, "channel", None) for row in session.added[1:]} == {"push", "email"}
