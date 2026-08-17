"""Tests for the curated muhurtham-naal listing and chart-matched ranking.

These do not touch the ephemeris or the database — the naal data is baked and
the matching is pure arithmetic — so they run anywhere (no swisseph / no DB).
"""
from __future__ import annotations

import uuid
from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.data.muhurtham_naals import available_years, get_muhurtham_naals
from app.models import BirthProfile, Chart
from app.services import muhurtham_naal_service as svc

pytestmark = pytest.mark.no_db


def test_2026_sheet_has_55_dates_with_expected_pirai_split():
    naals = get_muhurtham_naals(2026)
    assert len(naals) == 55
    valar = sum(1 for n in naals if n.pirai == "VALARPIRAI")
    thei = sum(1 for n in naals if n.pirai == "THEIPIRAI")
    assert (valar, thei) == (25, 30)
    # every curated date resolves to an auspicious driving star
    for n in naals:
        assert n.nakshatra_name in svc.NAKSHATRA_NAMES


def test_2027_sheet_has_74_dates_with_expected_pirai_split():
    naals = get_muhurtham_naals(2027)
    assert len(naals) == 74
    valar = sum(1 for n in naals if n.pirai == "VALARPIRAI")
    thei = sum(1 for n in naals if n.pirai == "THEIPIRAI")
    assert (valar, thei) == (37, 37)
    assert available_years() == [2026, 2027]
    for n in naals:
        assert n.nakshatra_name in svc.NAKSHATRA_NAMES


def test_list_filters_and_unknown_year():
    assert len(svc.list_muhurtham_naals(2026)) == 55
    feb = svc.list_muhurtham_naals(2026, month=2)
    assert {v.date[:7] for v in feb} == {"2026-02"}
    valar = svc.list_muhurtham_naals(2026, pirai="VALARPIRAI")
    assert all("Valarpirai" in v.pirai.en for v in valar)
    with pytest.raises(HTTPException) as exc:
        svc.list_muhurtham_naals(2030)
    assert exc.value.status_code == 404


@pytest.mark.parametrize(
    "janma,day,expected_tara,expected_quality",
    [
        (4, 4, 1, "NEUTRAL"),   # same star -> Janma
        (1, 2, 2, "GOOD"),      # Aswini -> Bharani -> Sampat
        (1, 3, 3, "AVOID"),     # Aswini -> Karthigai -> Vipat
        (1, 9, 9, "GOOD"),      # Aswini -> Ayilyam -> Parama Mitra
        (1, 7, 7, "AVOID"),     # Aswini -> Punarpoosam -> Naidhana
    ],
)
def test_tara_number_and_quality(janma, day, expected_tara, expected_quality):
    tara = svc._tara_number(janma, day)
    assert tara == expected_tara
    assert svc.TARA_QUALITY[tara] == expected_quality


class _FakeChart:
    def __init__(self, janma_nakshatra: str, moon_rasi: str):
        self.janma_nakshatra = janma_nakshatra
        self.moon_rasi = moon_rasi


class _FakeSession:
    def __init__(self, chart):
        self._chart = chart

    def get(self, model, _id):
        if model is Chart:
            return self._chart
        if model is BirthProfile:
            return None
        raise AssertionError(f"Unexpected model: {model}")


def test_match_ranks_and_flags_chandrashtama_for_rohini():
    # Rohini native (rasi Rishabam=2). Chandrashtama rasi = 9 (Dhanusu).
    session = _FakeSession(_FakeChart("ROHINI", "Rishabam"))
    matches, ctx = svc.match_muhurtham_naals(uuid.uuid4(), 2026, session)

    assert ctx["total_count"] == 55
    assert ctx["chandrashtama_rasi_number"] == 9
    assert 0 < ctx["recommended_count"] < 55
    assert ctx["daily_location"] is None

    # sorted best-first by score, ties by earliest date
    scores = [m.match_score for m in matches]
    assert scores == sorted(scores, reverse=True)

    # Moolam days (rasi Dhanusu=9) are both Naidhana tara AND chandrashtama -> 0
    moolam = [m for m in matches if m.naal.nakshatra.en == "Moolam"]
    assert moolam, "expected Moolam muhurtham dates in 2026 sheet"
    for m in moolam:
        assert m.is_chandrashtama is True
        assert m.is_recommended is False
        assert m.match_score == 0

    # recommended entries are GOOD tara and never chandrashtama
    for m in matches:
        if m.is_recommended:
            assert m.tara_quality == "GOOD"
            assert m.is_chandrashtama is False
        assert len(m.reasons) >= 2  # tara reason + chandrashtama line


def test_match_recommended_only_filter():
    session = _FakeSession(_FakeChart("ROHINI", "Rishabam"))
    all_matches, ctx = svc.match_muhurtham_naals(uuid.uuid4(), 2026, session)
    rec_only, _ = svc.match_muhurtham_naals(
        uuid.uuid4(), 2026, session, recommended_only=True,
    )
    assert len(rec_only) == ctx["recommended_count"]
    assert all(m.is_recommended for m in rec_only)


def test_chart_match_uses_computed_location_specific_nalla_neram(monkeypatch):
    """The public table stays static; a chart match must use its daily location."""
    profile_id = uuid.uuid4()

    class _ChartWithProfile(_FakeChart):
        birth_profile_id = profile_id

    class _Profile:
        birth_place = "Synthetic birthplace"
        birth_latitude = 10.0
        birth_longitude = 76.0
        birth_timezone = "Asia/Kolkata"
        current_place = "Synthetic current place"
        current_latitude = 11.0
        current_longitude = 77.0
        current_timezone = "Asia/Kolkata"

    class _SessionWithProfile(_FakeSession):
        def get(self, model, _id):
            if model is Chart:
                return self._chart
            if model is BirthProfile:
                return _Profile()
            return None

    def _snapshots(start, end, lat, lon, tz, *, session):
        assert (lat, lon, tz) == (11.0, 77.0, "Asia/Kolkata")
        slot = SimpleNamespace(
            start=datetime(2026, 1, 1, 8, 12),
            end=datetime(2026, 1, 1, 9, 7),
            period="AM",
        )
        return {
            n.date: SimpleNamespace(nalla_neram=[slot])
            for n in get_muhurtham_naals(2026)
        }

    monkeypatch.setattr(svc, "calculate_daily_panchangam_range", _snapshots)
    matches, _ = svc.match_muhurtham_naals(
        uuid.uuid4(), 2026, _SessionWithProfile(_ChartWithProfile("ROHINI", "Rishabam"))
    )

    assert all(match.naal.nalla_neram[0].start == "08:12" for match in matches)


def test_match_unknown_chart_or_year():
    with pytest.raises(HTTPException) as exc:
        svc.match_muhurtham_naals(uuid.uuid4(), 2030, _FakeSession(_FakeChart("ROHINI", "Rishabam")))
    assert exc.value.status_code == 404

    class _NoneSession:
        def get(self, model, _id):
            return None

    with pytest.raises(HTTPException) as exc2:
        svc.match_muhurtham_naals(uuid.uuid4(), 2026, _NoneSession())
    assert exc2.value.status_code == 404
