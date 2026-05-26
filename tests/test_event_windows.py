from dataclasses import dataclass

from app.calculations.astro import julian_day_to_utc_datetime
from app.calculations.event_windows import ChartData, find_marriage_windows


@dataclass(frozen=True)
class _Body:
    rasi: int


@dataclass(frozen=True)
class _Snapshot:
    bodies: dict[str, _Body]


@dataclass(frozen=True)
class _Period:
    lord: str


@dataclass(frozen=True)
class _Timeline:
    current_mahadasha: _Period
    current_antardasha: _Period


def test_find_marriage_windows_requires_dasha_and_transit_support(monkeypatch):
    def fake_timeline(_birth_jd: float, _moon_lon: float, as_of_jd: float):
        if julian_day_to_utc_datetime(as_of_jd).year == 2027:
            return _Timeline(current_mahadasha=_Period("VENUS"), current_antardasha=_Period("SUN"))
        return _Timeline(current_mahadasha=_Period("SUN"), current_antardasha=_Period("MARS"))

    def fake_snapshot(as_of_jd: float):
        if julian_day_to_utc_datetime(as_of_jd).year == 2027:
            return _Snapshot(bodies={"JUPITER": _Body(3), "VENUS": _Body(7)})
        return _Snapshot(bodies={"JUPITER": _Body(2), "VENUS": _Body(2)})

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    chart = ChartData(lagna_rasi=1, moon_longitude=240.0, birth_jd=2449061.6145833335)
    windows = find_marriage_windows(chart, 2025, 2027)
    assert len(windows) == 1
    assert windows[0].start_date.year == 2027
    assert windows[0].event == "MARRIAGE"


def test_find_marriage_windows_empty_when_no_support(monkeypatch):
    def fake_timeline(_birth_jd: float, _moon_lon: float, _as_of_jd: float):
        return _Timeline(current_mahadasha=_Period("SUN"), current_antardasha=_Period("MARS"))

    def fake_snapshot(_as_of_jd: float):
        return _Snapshot(bodies={"JUPITER": _Body(2), "VENUS": _Body(2)})

    monkeypatch.setattr("app.calculations.event_windows.calculate_vimshottari_timeline", fake_timeline)
    monkeypatch.setattr("app.calculations.event_windows.calculate_sidereal_planets", fake_snapshot)

    chart = ChartData(lagna_rasi=1, moon_longitude=240.0, birth_jd=2449061.6145833335)
    windows = find_marriage_windows(chart, 2026, 2028)
    assert windows == []
