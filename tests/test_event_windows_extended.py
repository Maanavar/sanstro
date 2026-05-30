"""Tests for Career and Finance event window types (PRES-11)."""
from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from app.calculations.astro import julian_day_to_utc_datetime
from app.calculations.event_windows import (
    ChartData,
    find_career_windows,
    find_event_windows,
    find_finance_windows,
)


# ---------------------------------------------------------------------------
# Shared test helpers (mirror test_event_windows.py pattern)
# ---------------------------------------------------------------------------

class _Body:
    def __init__(self, rasi: int):
        self.rasi = rasi


class _Snapshot:
    def __init__(self, bodies: dict):
        self.bodies = bodies


class _Period:
    def __init__(self, lord: str, end_date=None):
        self.lord = lord
        from datetime import date
        self.end_date = end_date or date(2099, 1, 1)


class _Timeline:
    def __init__(self, maha: str, antar: str):
        self.current_mahadasha = _Period(maha)
        self.current_antardasha = _Period(antar)


# ---------------------------------------------------------------------------
# Career windows
# ---------------------------------------------------------------------------

def test_find_career_windows_with_support(monkeypatch):
    def fake_timeline(_birth_jd, _moon, _jd):
        return _Timeline("SUN", "MERCURY")   # 10th lord for lagna=1 is SATURN; SUN active

    def fake_snapshot(_jd):
        return _Snapshot({"JUPITER": _Body(10), "SUN": _Body(10)})  # Jupiter on 10th (rasi 10 for lagna 1)

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    # lagna_rasi=1 → 10th house rasi = 10 (Magaram)
    chart = ChartData(lagna_rasi=1, moon_longitude=0.0, birth_jd=2449061.0)
    windows = find_career_windows(chart, 2026, 2026)
    assert len(windows) == 1
    assert windows[0].event == "CAREER"
    assert windows[0].score > 0


def test_find_career_windows_no_dasha_support(monkeypatch):
    def fake_timeline(_b, _m, _jd):
        return _Timeline("MOON", "VENUS")  # neither 10th lord, SUN, nor MERCURY

    def fake_snapshot(_jd):
        return _Snapshot({"JUPITER": _Body(10), "SUN": _Body(10)})

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    chart = ChartData(lagna_rasi=1, moon_longitude=0.0, birth_jd=2449061.0)
    windows = find_career_windows(chart, 2026, 2026)
    assert windows == []


def test_find_career_windows_no_transit_support(monkeypatch):
    def fake_timeline(_b, _m, _jd):
        return _Timeline("SUN", "SATURN")

    def fake_snapshot(_jd):
        # Jupiter far from 10th house (rasi 3), SUN not on 10th
        return _Snapshot({"JUPITER": _Body(3), "SUN": _Body(6)})

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    chart = ChartData(lagna_rasi=1, moon_longitude=0.0, birth_jd=2449061.0)
    windows = find_career_windows(chart, 2026, 2026)
    assert windows == []


# ---------------------------------------------------------------------------
# Finance windows
# ---------------------------------------------------------------------------

def test_find_finance_windows_with_support(monkeypatch):
    def fake_timeline(_b, _m, _jd):
        return _Timeline("JUPITER", "VENUS")  # both are finance-support lords

    def fake_snapshot(_jd):
        # Jupiter on 2nd house rasi (rasi 2 for lagna=1)
        return _Snapshot({"JUPITER": _Body(2)})

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    chart = ChartData(lagna_rasi=1, moon_longitude=0.0, birth_jd=2449061.0)
    windows = find_finance_windows(chart, 2026, 2026)
    assert len(windows) == 1
    assert windows[0].event == "FINANCE"


def test_find_finance_windows_no_support(monkeypatch):
    def fake_timeline(_b, _m, _jd):
        return _Timeline("SUN", "MARS")

    def fake_snapshot(_jd):
        return _Snapshot({"JUPITER": _Body(6)})

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    chart = ChartData(lagna_rasi=1, moon_longitude=0.0, birth_jd=2449061.0)
    windows = find_finance_windows(chart, 2026, 2026)
    assert windows == []


def test_find_finance_windows_11th_lord_active(monkeypatch):
    # lagna=2 → 11th house rasi = 12 (Meenam) → lord = JUPITER
    def fake_timeline(_b, _m, _jd):
        return _Timeline("JUPITER", "SUN")  # Jupiter = 11th lord for lagna 2

    def fake_snapshot(_jd):
        return _Snapshot({"JUPITER": _Body(12)})  # Jupiter on 11th rasi

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    chart = ChartData(lagna_rasi=2, moon_longitude=30.0, birth_jd=2449061.0)
    windows = find_finance_windows(chart, 2026, 2026)
    assert len(windows) == 1


# ---------------------------------------------------------------------------
# Unified find_event_windows dispatcher
# ---------------------------------------------------------------------------

def test_find_event_windows_marriage(monkeypatch):
    def fake_timeline(_b, _m, _jd):
        return _Timeline("VENUS", "SUN")

    def fake_snapshot(_jd):
        return _Snapshot({"JUPITER": _Body(7), "VENUS": _Body(7)})

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    chart = ChartData(lagna_rasi=1, moon_longitude=0.0, birth_jd=2449061.0)
    windows = find_event_windows(chart, "MARRIAGE", 2026, 2026)
    assert all(w.event == "MARRIAGE" for w in windows)


def test_find_event_windows_career(monkeypatch):
    def fake_timeline(_b, _m, _jd):
        return _Timeline("SUN", "MERCURY")

    def fake_snapshot(_jd):
        return _Snapshot({"JUPITER": _Body(10), "SUN": _Body(10)})

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    chart = ChartData(lagna_rasi=1, moon_longitude=0.0, birth_jd=2449061.0)
    windows = find_event_windows(chart, "CAREER", 2026, 2026)
    assert all(w.event == "CAREER" for w in windows)


def test_find_event_windows_finance(monkeypatch):
    def fake_timeline(_b, _m, _jd):
        return _Timeline("JUPITER", "VENUS")

    def fake_snapshot(_jd):
        return _Snapshot({"JUPITER": _Body(2)})

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    chart = ChartData(lagna_rasi=1, moon_longitude=0.0, birth_jd=2449061.0)
    windows = find_event_windows(chart, "FINANCE", 2026, 2026)
    assert all(w.event == "FINANCE" for w in windows)


def test_find_event_windows_invalid_type():
    chart = ChartData(lagna_rasi=1, moon_longitude=0.0, birth_jd=2449061.0)
    with pytest.raises(ValueError, match="Unknown event type"):
        find_event_windows(chart, "INVALID", 2026, 2026)  # type: ignore[arg-type]


def test_find_event_windows_multi_year_sorted(monkeypatch):
    """Results sorted highest score first across multiple years."""
    call_count = [0]

    def fake_timeline(_b, _m, jd):
        call_count[0] += 1
        year = julian_day_to_utc_datetime(jd).year
        # 2027 gets stronger dasha
        if year == 2027:
            return _Timeline("SUN", "SATURN")
        return _Timeline("SUN", "MERCURY")

    def fake_snapshot(_jd):
        return _Snapshot({"JUPITER": _Body(10), "SUN": _Body(10)})

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    chart = ChartData(lagna_rasi=1, moon_longitude=0.0, birth_jd=2449061.0)
    windows = find_career_windows(chart, 2026, 2028)
    scores = [w.score for w in windows]
    assert scores == sorted(scores, reverse=True)
