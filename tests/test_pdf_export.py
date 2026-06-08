"""Unit tests for the PDF export service."""
from __future__ import annotations

from datetime import date, time
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from app.services.pdf_export_service import (
    _section_dasha,
    _section_planets,
    _styles,
    generate_chart_pdf,
)

pytestmark = pytest.mark.no_db


def _make_planet(graha="SUN", rasi_name="Mesham", nakshatra_name="ASWINI", house=1,
                 retro=False, combust=False):
    p = MagicMock()
    p.graha = graha
    p.rasi_name = rasi_name
    p.nakshatra_name = nakshatra_name
    p.house_from_lagna = house
    p.is_retrograde = retro
    p.is_combust = combust
    return p


def _make_lagna():
    l = MagicMock()
    l.rasi_name = "Mesham"
    l.nakshatra_name = "ASWINI"
    l.pada = 1
    return l


def _make_profile():
    p = MagicMock()
    p.display_name = "Test User"
    p.birth_date_local = date(1990, 1, 1)
    p.birth_time_local = time(6, 0)
    p.birth_place = "Chennai"
    p.birth_timezone = "Asia/Kolkata"
    p.birth_latitude = 13.0839
    p.birth_longitude = 80.2700
    return p


def _make_chart_response():
    cr = MagicMock()
    cr.data.birth_profile = _make_profile()
    cr.data.lagna = _make_lagna()
    cr.data.planets = [_make_planet("SUN"), _make_planet("MOON", "Rishabam", "ROHINI", 2)]
    return cr


def _make_dasha_response():
    dr = MagicMock()
    maha = MagicMock(); maha.lord = "JUPITER"; maha.end_date = date(2030, 1, 1)
    antar = MagicMock(); antar.lord = "SATURN";  antar.end_date = date(2027, 6, 1)
    pratyantar = MagicMock(); pratyantar.lord = "MERCURY"; pratyantar.end_date = date(2026, 9, 1)
    dr.data.current.mahadasha = maha
    dr.data.current.antardasha = antar
    dr.data.current.pratyantardasha = pratyantar
    return dr


def _make_panchang():
    pc = MagicMock()
    pc.date_local = date(2026, 5, 26)
    pc.nakshatra_name = "ASWINI"
    pc.nakshatra_number = 1
    pc.nakshatra_pada = 2
    pc.tithi_name = "Pratipada"
    pc.tithi_paksha = "Shukla"
    nalla = MagicMock()
    nalla.start.strftime = lambda fmt: "06:30"
    nalla.end.strftime   = lambda fmt: "08:00"
    rahu = MagicMock()
    rahu.start.strftime = lambda fmt: "07:30"
    rahu.end.strftime   = lambda fmt: "09:00"
    pc.nalla_neram = nalla
    pc.rahu_kalam  = rahu
    return pc


# ---------------------------------------------------------------------------
# _styles — should not raise
# ---------------------------------------------------------------------------

def test_styles_returns_four_items():
    result = _styles()
    assert len(result) == 4


# ---------------------------------------------------------------------------
# _section_planets
# ---------------------------------------------------------------------------

def test_section_planets_row_count():
    cr = _make_chart_response()
    title_s, heading_s, *_ = _styles()
    elements = _section_planets(cr, heading_s)
    # Returns a Paragraph + Table
    assert len(elements) == 2


# ---------------------------------------------------------------------------
# _section_dasha
# ---------------------------------------------------------------------------

def test_section_dasha_contains_lord_names():
    dr = _make_dasha_response()
    _, heading_s, body_s, _ = _styles()
    elements = _section_dasha(dr, heading_s, body_s)
    combined = " ".join(str(e) for e in elements)
    assert "JUPITER" in combined
    assert "SATURN" in combined
    assert "MERCURY" in combined


# ---------------------------------------------------------------------------
# generate_chart_pdf — full mock
# ---------------------------------------------------------------------------

def test_generate_chart_pdf_returns_bytes(monkeypatch):
    chart_id = uuid4()
    profile_id = uuid4()

    mock_chart = MagicMock()
    mock_chart.chart_id = chart_id
    mock_chart.birth_profile_id = profile_id

    mock_profile = _make_profile()
    mock_profile.birth_profile_id = profile_id

    session = MagicMock()
    session.get.side_effect = lambda model, pk: mock_chart if model.__name__ == "Chart" else mock_profile

    monkeypatch.setattr(
        "app.services.pdf_export_service.load_persisted_chart_response",
        lambda *a, **kw: _make_chart_response(),
    )
    monkeypatch.setattr(
        "app.services.pdf_export_service.get_chart_dasha",
        lambda *a, **kw: _make_dasha_response(),
    )
    monkeypatch.setattr(
        "app.services.pdf_export_service.calculate_daily_panchangam",
        lambda *a, **kw: _make_panchang(),
    )

    result = generate_chart_pdf(session, chart_id, date(2026, 5, 26))
    assert isinstance(result, bytes)
    assert len(result) > 100  # non-trivial PDF
    assert result[:4] == b"%PDF"  # valid PDF header


def test_generate_chart_pdf_chart_not_found():
    from fastapi import HTTPException
    session = MagicMock()
    session.get.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        generate_chart_pdf(session, uuid4(), date(2026, 5, 26))
    assert exc_info.value.status_code == 404
