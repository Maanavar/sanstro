"""Unit tests for the PDF export service."""
from __future__ import annotations

from datetime import date, time
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.services.pdf_export_service import (
    _section_dasha,
    _section_planets,
    _styles,
    generate_chart_pdf,
    generate_compatibility_intelligence_pdf,
    generate_porutham_pdf,
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


def _make_compatibility_report():
    from app.schemas.relationships import CompatibilityIntelligenceData

    return CompatibilityIntelligenceData.model_validate({
        "personAName": "Arjun Kumar",
        "personBName": "Anitha",
        "poruthamScore": 14,
        "poruthamMax": 20,
        "poruthamPercentage": 70.0,
        "poruthamLabel": "GOOD",
        "poruthamKutas": [
            {"name": "Dinam", "nameTa": "தினம்", "score": 2, "maxScore": 3, "label": "Good"},
            {"name": "Ganam", "nameTa": "கணம்", "score": 5, "maxScore": 6, "label": "Strong"},
        ],
        "rajjuDosha": False,
        "vedhaDosha": False,
        "nadiDosha": {
            "boyNadi": "Madhya",
            "girlNadi": "Adi",
            "hasNadiDosha": False,
            "cancellations": [],
            "severity": "NONE",
            "noteTa": "",
            "noteEn": "No nadi dosha.",
        },
        "chartAStrength": {
            "seventhHouseRasi": 7,
            "seventhLord": "Venus",
            "seventhLordHouse": 5,
            "seventhLordStrength": 72,
            "venusHouse": 2,
            "venusStrength": 74,
            "jupiterHouse": 9,
            "jupiterStrength": 68,
            "hasMaleficInSeventh": False,
            "score": 8,
            "noteEn": "Stable partnership indicators.",
            "noteTa": "",
        },
        "chartBStrength": {
            "seventhHouseRasi": 1,
            "seventhLord": "Mars",
            "seventhLordHouse": 7,
            "seventhLordStrength": 66,
            "venusHouse": 11,
            "venusStrength": 70,
            "jupiterHouse": 4,
            "jupiterStrength": 63,
            "hasMaleficInSeventh": False,
            "score": 7,
            "noteEn": "Good support for commitment.",
            "noteTa": "",
        },
        "navamsa": {
            "personAVenusD9": 2,
            "personBVenusD9": 7,
            "personASeventhLordD9": 5,
            "personBSeventhLordD9": 9,
            "harmonyLabel": "SUPPORTIVE",
            "noteEn": "Navamsa supports emotional maturity.",
            "noteTa": "",
            "score": 15,
        },
        "sevvaiA": {
            "hasDosham": False,
            "marsHouse": 3,
            "isCancelled": False,
            "severity": "NONE",
            "cancellationReasons": [],
            "noteEn": "No dosham for person A.",
            "noteTa": "",
            "score": 5,
        },
        "sevvaiB": {
            "hasDosham": True,
            "marsHouse": 7,
            "isCancelled": True,
            "severity": "MILD",
            "cancellationReasons": ["Mars in own sign"],
            "noteEn": "Dosham is cancelled by chart support.",
            "noteTa": "",
            "score": 4,
        },
        "dashaHarmony": {
            "personAMahaLord": "Jupiter",
            "personAantarLord": "Moon",
            "personAMahaEnd": "2031-04-01",
            "personBMahaLord": "Venus",
            "personBAntarLord": "Mercury",
            "personBMahaEnd": "2030-09-12",
            "harmonyLabel": "GOOD",
            "noteEn": "Current periods support growth and clarity.",
            "noteTa": "",
            "score": 11,
        },
        "emotional": {
            "moonMoonHarmony": "STRONG",
            "venusMarsHarmony": "GOOD",
            "communicationNote": "Clear and affectionate communication is likely.",
            "noteEn": "Emotional rhythms are broadly aligned.",
            "noteTa": "",
            "score": 8,
        },
        "synastryScore": 71,
        "overallScore": 78,
        "overallLabel": "GOOD",
        "scoreBreakdown": {
            "porutham": 14,
            "seventhHouse": 15,
            "navamsa": 15,
            "dashaHarmony": 11,
            "doshamAnalysis": 9,
            "emotional": 8,
            "synastry": 4,
        },
        "strengthsEn": ["Shared values", "Supportive dasha overlap"],
        "strengthsTa": [""],
        "risksEn": ["Needs patience during stressful routines"],
        "risksTa": [""],
        "summary": {"ta": "", "en": "A balanced match with strong long-term support."},
    })


def test_generate_compatibility_intelligence_pdf_returns_bytes():
    report = _make_compatibility_report()
    result = generate_compatibility_intelligence_pdf(report, "Arjun Kumar", "Anitha")
    assert isinstance(result, bytes)
    assert len(result) > 100
    assert result[:4] == b"%PDF"


def _make_direct_porutham(rajju_dosha=False, vedha_dosha=False):
    from app.schemas.relationships import DirectPoruthamData

    return DirectPoruthamData.model_validate({
        "chartIdA": str(uuid4()),
        "chartIdB": str(uuid4()),
        "boyNakshatra": 1,
        "boyNakshatraName": "ASWINI",
        "girlNakshatra": 4,
        "girlNakshatraName": "ROHINI",
        "kutas": [
            {"name": "Dinam", "nameTa": "தினம்", "score": 1, "maxScore": 1, "label": "Good"},
            {"name": "Ganam", "nameTa": "கணம்", "score": 1, "maxScore": 1, "label": "Good"},
            {"name": "Rajju", "nameTa": "ரஜ்ஜு", "score": 0 if rajju_dosha else 1, "maxScore": 1, "label": "Caution" if rajju_dosha else "Good"},
        ],
        "totalScore": 7,
        "maxScore": 10,
        "percentage": 70.0,
        "label": "GOOD",
        "rajjuDosha": rajju_dosha,
        "vedhaDosha": vedha_dosha,
        "nadiDosha": {
            "boyNadi": "Madhya",
            "girlNadi": "Adi",
            "hasNadiDosha": False,
            "cancellations": [],
            "severity": "NONE",
            "noteTa": "",
            "noteEn": "No nadi dosha.",
        },
        "summary": {"ta": "நல்ல பொருத்தம்.", "en": "A good match overall."},
        "compatibilityContext": "MARRIAGE",
        "contextNote": {"ta": "", "en": "Marriage context applied."},
    })


def test_generate_porutham_pdf_returns_bytes_en():
    result = generate_porutham_pdf(_make_direct_porutham(), "Arjun Kumar", "Anitha", lang="en")
    assert isinstance(result, bytes)
    assert len(result) > 100
    assert result[:4] == b"%PDF"


def test_generate_porutham_pdf_returns_bytes_ta():
    result = generate_porutham_pdf(_make_direct_porutham(), "Arjun Kumar", "Anitha", lang="ta")
    assert isinstance(result, bytes)
    assert len(result) > 100
    assert result[:4] == b"%PDF"


def test_generate_porutham_pdf_with_doshas():
    result = generate_porutham_pdf(
        _make_direct_porutham(rajju_dosha=True, vedha_dosha=True),
        "Arjun Kumar",
        "Anitha",
        lang="ta",
    )
    assert isinstance(result, bytes)
    assert result[:4] == b"%PDF"