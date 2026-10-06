"""
PDF export service — produces a single-page Jadhagam (birth chart) report.

Sections:
  1. Header — display name, birth date/time, place, lagna
  2. Planet positions table — graha, rasi, nakshatra, house
  3. Current dasha — maha / antar / pratyantar lords + end dates
  4. Daily guidance snapshot — score, label, nalla neram, rahu kalam

The PDF is returned as raw bytes; the API streams it as application/pdf.

No external fonts are registered — uses Helvetica (built into ReportLab)
to avoid font file distribution concerns.  Tamil text is rendered as its
transliterated English equivalent (already stored in the bilingual fields)
because Helvetica does not cover the Tamil Unicode block.
"""
from __future__ import annotations

import io
import os
import re
from datetime import UTC, date, datetime
from pathlib import Path
from typing import TYPE_CHECKING
from uuid import UUID

from fastapi import HTTPException, status
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session

from app.calculations.astro import RASI_NAMES, format_clock_hhmm
from app.calculations.display_names import (
    nakshatra_en,
    nakshatra_ta,
    planet_en,
    planet_ta,
    rasi_en,
    rasi_ta,
)
from app.calculations.panchangam import (
    best_gowri_slot,
    calculate_daily_panchangam,
    gowri_good_label,
    gowri_good_purpose,
)
from app.calculations.yoga_display import (
    dosham_standing_word,
    natal_strength_word,
    status_word,
    yoga_display_name,
    yoga_reading_status,
)
from app.constants.astrology import SIGN_LORD
from app.models import BirthProfile, Chart
from app.services._dg_scoring import (
    AUSPICIOUS_DAILY_NAKSHATRAS,
    CAUTION_DAILY_NAKSHATRAS,
)
from app.services.chart_service import load_persisted_chart_response
from app.services.dasha_service import get_chart_dasha
from app.services.location_service import resolve_effective_daily_location

if TYPE_CHECKING:
    from app.schemas.relationships import CompatibilityIntelligenceData, DirectPoruthamData

_PAGE_W, _PAGE_H = A4
_MARGIN = 1.8 * cm
_TAMIL_FONT_NAME = "NotoSansTamilPdf"
_TAMIL_BOLD_FONT_NAME = "NotoSansTamilPdfBold"
_FONT_REGISTERED = False

_LABELS = {
    "en": {"unknown": "Unknown", "yes": "Yes", "no": "No", "title_jadhagam": "Vinaadi AI - Jadhagam Report", "birth_date": "Birth Date", "time": "Time", "place": "Place", "lagna": "Lagna", "nakshatra": "Nakshatra", "pada": "Pada", "generated": "Generated", "planet_positions": "Planet Positions", "graha": "Graha", "rasi": "Rasi", "house": "House", "retro": "Retro", "combust": "Combust", "current_dasha": "Current Dasha", "mahadasha": "Mahadasha", "antardasha": "Antardasha", "pratyantar": "Pratyantar", "ends": "ends", "todays_guidance": "Today's Guidance", "location": "Location for daily timings", "date": "Date", "tithi": "Tithi", "daily_score": "Daily Score", "nalla_neram": "Nalla Neram", "rahu_kalam": "Rahu Kalam", "good": "GOOD", "caution": "CAUTION", "balanced": "BALANCED", "porutham_title": "Porutham - Compatibility Report", "context": "Context", "warning_rajju": "Warning: Rajju dosha present.", "warning_vedha": "Warning: Vedha dosha present.", "factor_breakdown": "Factor Breakdown", "factor": "Factor", "score": "Score", "result": "Result", "nadi_dosha": "Nadi Dosha", "ci_title": "Vinaadi AI - Compatibility Intelligence Report", "overall_rating": "Overall Rating", "score_breakdown": "Score Breakdown", "highlights": "Highlights", "strengths": "Strengths", "areas_to_watch": "Areas to Watch", "porutham_level": "Level 1 - Traditional Porutham", "chart_strength_level": "Levels 2 and 3 - 7th House and Venus Strength", "navamsa_level": "Level 4 - Navamsa (D9)", "sevvai_level": "Level 5 - Sevvai Dosham", "dasha_level": "Level 6 - Dasha Alignment", "emotional_level": "Level 7 - Emotional Compatibility", "synastry_level": "Level 8 - Synastry", "cancellations": "Cancellations", "harmony": "Harmony", "communication_note": "Communication note", "synastry_score": "Synastry score", "couple_identity": "Birth Details"},
    "ta": {"unknown": "தெரியவில்லை", "yes": "ஆம்", "no": "இல்லை", "title_jadhagam": "வினாடி AI - ஜாதக அறிக்கை", "birth_date": "பிறந்த தேதி", "time": "நேரம்", "place": "இடம்", "lagna": "லக்னம்", "nakshatra": "நட்சத்திரம்", "pada": "பாதம்", "generated": "உருவாக்கப்பட்டது", "planet_positions": "கிரக நிலைகள்", "graha": "கிரகம்", "rasi": "ராசி", "house": "பாவம்", "retro": "வக்ரம்", "combust": "அஸ்தம்", "current_dasha": "தற்போதைய தசை", "mahadasha": "மகாதசை", "antardasha": "அந்தர்தசை", "pratyantar": "பிரத்யந்தர்தசை", "ends": "முடிவு", "todays_guidance": "இன்றைய வழிகாட்டல்", "location": "தினசரி நேரங்களுக்கான இடம்", "date": "தேதி", "tithi": "திதி", "daily_score": "தினசரி மதிப்பெண்", "nalla_neram": "நல்ல நேரம்", "rahu_kalam": "ராகு காலம்", "good": "நன்று", "caution": "கவனம்", "balanced": "சமநிலை", "porutham_title": "பொருத்தம் - இணக்க அறிக்கை", "context": "சூழல்", "warning_rajju": "எச்சரிக்கை: ரஜ்ஜு தோஷம் உள்ளது.", "warning_vedha": "எச்சரிக்கை: வேத தோஷம் உள்ளது.", "factor_breakdown": "கூறு விவரம்", "factor": "கூறு", "score": "மதிப்பெண்", "result": "முடிவு", "nadi_dosha": "நாடி தோஷம்", "ci_title": "வினாடி AI - விரிவான பொருத்த அறிக்கை", "overall_rating": "மொத்த மதிப்பீடு", "score_breakdown": "மதிப்பெண் விவரம்", "highlights": "முக்கிய அம்சங்கள்", "strengths": "பலங்கள்", "areas_to_watch": "கவனிக்க வேண்டியவை", "porutham_level": "நிலை 1 - பாரம்பரிய பொருத்தம்", "chart_strength_level": "நிலைகள் 2 மற்றும் 3 - 7ஆம் பாவம் மற்றும் சுக்கிர பலம்", "navamsa_level": "நிலை 4 - நவாம்சம் (D9)", "sevvai_level": "நிலை 5 - செவ்வாய் தோஷம்", "dasha_level": "நிலை 6 - தசை ஒத்திசைவு", "emotional_level": "நிலை 7 - உணர்ச்சி இணக்கம்", "synastry_level": "நிலை 8 - சினாஸ்ட்ரி", "cancellations": "நிவாரண காரணங்கள்", "harmony": "ஒத்திசைவு", "communication_note": "தொடர்பு குறிப்பு", "synastry_score": "சினாஸ்ட்ரி மதிப்பெண்", "couple_identity": "பிறப்பு விவரங்கள்"},
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalize_lang(lang: str | None) -> str:
    return "ta" if lang == "ta" else "en"


def _label(key: str, lang: str) -> str:
    resolved = _normalize_lang(lang)
    return _LABELS[resolved].get(key) or _LABELS["en"][key]


def _register_pdf_fonts(lang: str) -> tuple[str, str]:
    if _normalize_lang(lang) != "ta":
        return "Helvetica", "Helvetica-Bold"

    global _FONT_REGISTERED
    if _FONT_REGISTERED:
        return _TAMIL_FONT_NAME, _TAMIL_BOLD_FONT_NAME

    root = Path(__file__).resolve().parents[2]
    env_regular = os.environ.get("VINAADI_PDF_TAMIL_FONT")
    env_bold = os.environ.get("VINAADI_PDF_TAMIL_BOLD_FONT")
    regular_candidates = [
        *([Path(env_regular)] if env_regular else []),
        root / "mobile" / "assets" / "fonts" / "NotoSansTamil-Regular.ttf",
        Path("/usr/share/fonts/truetype/noto/NotoSansTamil-Regular.ttf"),
        Path("/usr/share/fonts/truetype/lohit-tamil/Lohit-Tamil.ttf"),
        Path("C:/Windows/Fonts/Nirmala.ttf"),
        Path("C:/Windows/Fonts/Latha.ttf"),
    ]
    bold_candidates = [
        *([Path(env_bold)] if env_bold else []),
        root / "mobile" / "assets" / "fonts" / "NotoSansTamil-Bold.ttf",
        Path("/usr/share/fonts/truetype/noto/NotoSansTamil-Bold.ttf"),
        Path("C:/Windows/Fonts/NirmalaB.ttf"),
        Path("C:/Windows/Fonts/Lathab.ttf"),
    ]
    regular = next((p for p in regular_candidates if str(p) and p.exists()), None)
    bold = next((p for p in bold_candidates if str(p) and p.exists()), regular)
    if regular is None:
        return "Helvetica", "Helvetica-Bold"

    pdfmetrics.registerFont(TTFont(_TAMIL_FONT_NAME, str(regular)))
    pdfmetrics.registerFont(TTFont(_TAMIL_BOLD_FONT_NAME, str(bold or regular)))
    _FONT_REGISTERED = True
    return _TAMIL_FONT_NAME, _TAMIL_BOLD_FONT_NAME


def _bitext(value, lang: str) -> str:
    return getattr(value, _normalize_lang(lang), None) or getattr(value, "en", "") or ""

def _styles(lang: str = "en"):
    base = getSampleStyleSheet()
    font_name, bold_font_name = _register_pdf_fonts(lang)
    title = ParagraphStyle(
        "PdfTitle",
        parent=base["Title"],
        fontSize=16,
        spaceAfter=4,
        textColor=colors.HexColor("#2C3E50"),
        fontName=font_name,
    )
    heading = ParagraphStyle(
        "PdfHeading",
        parent=base["Heading2"],
        fontSize=11,
        spaceBefore=10,
        spaceAfter=4,
        textColor=colors.HexColor("#34495E"),
        fontName=bold_font_name,
    )
    body = ParagraphStyle(
        "PdfBody",
        parent=base["Normal"],
        fontSize=9,
        leading=13,
        fontName=font_name,
    )
    caption = ParagraphStyle(
        "PdfCaption",
        parent=base["Normal"],
        fontSize=8,
        textColor=colors.grey,
        fontName=font_name,
        spaceAfter=6,
    )
    return title, heading, body, caption


def _table_style_base(lang: str = "en") -> TableStyle:
    font_name, bold_font_name = _register_pdf_fonts(lang)
    return TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0), colors.HexColor("#2C3E50")),
        ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
        ("FONTNAME",    (0, 0), (-1, 0), bold_font_name),
        ("FONTNAME",    (0, 1), (-1, -1), font_name),
        ("FONTSIZE",    (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F4F6F7"), colors.white]),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING",  (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ])


def _safe_filename_fragment(raw: str, fallback: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", raw).strip("_")
    return cleaned or fallback


def _format_clock_label(value) -> str:
    if value is None:
        return "Unknown"
    if hasattr(value, "strftime"):
        try:
            value = format_clock_hhmm(value)
        except (TypeError, ValueError):
            pass
    hour = getattr(value, "hour", None)
    minute = getattr(value, "minute", None)
    if hour is None or minute is None:
        pieces = str(value).split(":")
        try:
            hour = int(pieces[0])
            minute = int(pieces[1]) if len(pieces) > 1 else 0
        except (TypeError, ValueError):
            return str(value)
    hour = int(hour) % 24
    minute = int(minute) % 60
    period = "am" if hour < 12 else "pm"
    hour12 = hour % 12 or 12
    return f"{hour12}:{minute:02d} {period}"


def _format_time_range(start, end) -> str:
    return f"{_format_clock_label(start)}-{_format_clock_label(end)}"


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def _section_birth_profile(chart_response, title_style, body_style, caption_style, lang: str = "en") -> list:
    profile = chart_response.data.birth_profile
    lagna = chart_response.data.lagna

    birth_date = profile.birth_date_local
    birth_time = _format_clock_label(profile.birth_time_local) if profile.birth_time_local else _label("unknown", lang)

    generated_at = datetime.now(tz=UTC)
    # Labels and names in the reader's language (display boundary): these were
    # hard-coded English, and the names were the English/code fields, in a
    # Tamil PDF too.
    elements = [
        Paragraph(_label("title_jadhagam", lang), title_style),
        Paragraph(f"<b>{profile.display_name}</b>", body_style),
        Paragraph(
            f"{_label('birth_date', lang)}: {birth_date} &nbsp;&nbsp; {_label('time', lang)}: {birth_time} &nbsp;&nbsp; "
            f"{_label('place', lang)}: {profile.birth_place}",
            body_style,
        ),
        Paragraph(
            f"{_label('lagna', lang)}: {_rasi_name(_int_or_none(lagna.rasi), lang, lagna.rasi_name)} &nbsp;&nbsp; "
            f"{_label('nakshatra', lang)}: {_star_name(_int_or_none(lagna.nakshatra), lang, lagna.nakshatra_name)} "
            f"{_label('pada', lang)} {lagna.pada}",
            body_style,
        ),
        Paragraph(f"{_label('generated', lang)}: {generated_at.strftime('%Y-%m-%d')} {_format_clock_label(generated_at)} UTC", caption_style),
    ]
    return elements


def _section_planets(chart_response, heading_style, lang: str = "en") -> list:
    planets = chart_response.data.planets
    rows = [[_label("graha", lang), _label("rasi", lang), _label('nakshatra', lang), _label("house", lang), _label("retro", lang), _label("combust", lang)]]
    for p in planets:
        rows.append([
            _planet_name(p.graha, lang),
            _rasi_name(_int_or_none(p.rasi), lang, p.rasi_name),
            _star_name(_int_or_none(p.nakshatra), lang, p.nakshatra_name),
            str(p.house_from_lagna),
            "R" if p.is_retrograde else "",
            "C" if p.is_combust else "",
        ])

    col_w = [(_PAGE_W - 2 * _MARGIN) * f for f in [0.18, 0.18, 0.26, 0.1, 0.1, 0.1, 0.08]]
    tbl = Table(rows, colWidths=col_w[:len(rows[0])])
    tbl.setStyle(_table_style_base(lang))
    return [Paragraph(_label("planet_positions", lang), heading_style), tbl]


def _section_dasha(dasha_response, heading_style, body_style, lang: str = "en") -> list:
    current = dasha_response.data.current
    maha = current.mahadasha
    antar = current.antardasha
    pratyantar = current.pratyantardasha

    lines = [
        f"<b>{_label('mahadasha', lang)}:</b> {_planet_name(maha.lord, lang)} &nbsp; {_label('ends', lang)} {maha.end_date}",
        f"<b>{_label('antardasha', lang)}:</b> {_planet_name(antar.lord, lang)} &nbsp; {_label('ends', lang)} {antar.end_date}",
        f"<b>{_label('pratyantar', lang)}:</b> {_planet_name(pratyantar.lord, lang)} &nbsp; {_label('ends', lang)} {pratyantar.end_date}",
    ]

    return [Paragraph(_label("current_dasha", lang), heading_style)] + [Paragraph(line, body_style) for line in lines]


def _section_couple_identity(
    name_a: str,
    chart_a,
    dasha_a,
    name_b: str,
    chart_b,
    dasha_b,
    heading_style,
    body_style,
    lang: str = "en",
) -> list:
    """Rasi/Nakshatra/Lagna + current Dasha-Bhukti for both people — the plain
    -language identity facts a non-astrologer needs before the score tables.
    Degrades to no section at all when chart data isn't available (older
    callers that don't pass it through)."""
    if chart_a is None or chart_b is None:
        return []

    def _person_lines(name: str, chart, dasha) -> list[str]:
        moon = next(p for p in chart.planets if p.graha == "MOON")
        lines = [
            f"<b>{name}</b> &mdash; {_label('rasi', lang)}: {moon.rasi_name} &nbsp;&nbsp; "
            f"{_label('nakshatra', lang)}: {moon.nakshatra_name} {_label('pada', lang)} {moon.pada} &nbsp;&nbsp; "
            f"{_label('lagna', lang)}: {chart.lagna.rasi_name}"
        ]
        if dasha is not None:
            maha = dasha.current.mahadasha
            antar = dasha.current.antardasha
            lines.append(
                f"{_label('mahadasha', lang)}: {maha.lord} ({_label('ends', lang)} {maha.end_date}) &nbsp;&nbsp; "
                f"{_label('antardasha', lang)}: {antar.lord} ({_label('ends', lang)} {antar.end_date})"
            )
        return lines

    lines = _person_lines(name_a, chart_a, dasha_a) + _person_lines(name_b, chart_b, dasha_b)
    return [Paragraph(_label("couple_identity", lang), heading_style)] + [Paragraph(line, body_style) for line in lines]


def _section_daily(panchang, score: int, label: str, location_label: str, heading_style, body_style, lang: str = "en") -> list:
    slot = best_gowri_slot(panchang.nalla_neram)
    if slot:
        slot_name = getattr(slot, "name", None)
        slot_label = gowri_good_label(slot_name, lang)
        slot_purpose = gowri_good_purpose(slot_name, lang)
        nalla_time = _format_time_range(slot.start, slot.end)
        if slot_label and slot_purpose:
            nalla = f"{slot_label} {nalla_time} ({slot_purpose})"
        elif slot_label:
            nalla = f"{slot_label} {nalla_time}"
        else:
            nalla = nalla_time
    else:
        nalla = "-"
    rahu = _format_time_range(panchang.rahu_kalam.start, panchang.rahu_kalam.end)
    lines = [
        f"{_label('location', lang)}: {location_label}",
        f"{_label('date', lang)}: {panchang.date_local} &nbsp;&nbsp; {_label('nakshatra', lang)}: {panchang.nakshatra_name} ({_label('pada', lang)} {panchang.nakshatra_pada})",
        f"{_label('tithi', lang)}: {panchang.tithi_name} ({panchang.tithi_paksha})",
        f"{_label('daily_score', lang)}: <b>{score}/100</b> - {label}",
        f"{_label('nalla_neram', lang)}: {nalla} &nbsp;&nbsp; {_label('rahu_kalam', lang)}: {rahu}",
    ]
    return [Paragraph(_label("todays_guidance", lang), heading_style)] + [Paragraph(line, body_style) for line in lines]


# ---------------------------------------------------------------------------
# Astrologer appendix (FTR-22, "share with my astrologer")
#
# The web Astrologer view's ledgers, on paper, so a reader can hand the full
# working to their own jyotishi. Every cell reads a field the explanation
# engine already returned, or the fixed sign-lordship table; nothing is
# recomputed. Every name goes through a display table, never a raw engine code
# (CLAUDE.md "Display boundary"). The words mirror the web ledger
# (web/components/chart-reading/astrologer-ledgers.tsx) so the paper and the
# screen say the same thing. New Tamil column labels are pending native review.
# ---------------------------------------------------------------------------

_GRAHA_ORDER = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")

_ASTRO_LABELS: dict[str, tuple[str, str]] = {
    "title": ("ஜோதிடருக்கான முழு விவரம்", "Astrologer detail"),
    "intro": (
        "இந்தப் பக்கங்கள் உங்கள் ஜோதிடர் சரிபார்க்க: ஒவ்வொரு கணக்கும் வினாடி இயந்திரம் கணித்தபடியே.",
        "For review by your astrologer: every calculation as the Vinaadi engine computed it.",
    ),
    "method": ("கணித முறை", "Method"),
    "graha_ledger": ("கிரக அட்டவணை", "Graha ledger"),
    "house": ("வீடு", "House"),
    "star_pada": ("நட்சத்திரம் · பாதம்", "Star · pada"),
    "d9": ("நவாம்சம்", "D9"),
    "dignity": ("நிலை", "Dignity"),
    "role": ("பங்கு", "Role"),
    "score": ("பலம்", "Score"),
    "flags": ("குறிகள்", "Flags"),
    "flags_note": (
        "குறிகள்: வக் = வக்கிரம், அஸ் = அஸ்தம், கசி = கசிமி, வர் = வர்கோத்தமம், யுத் = கிரக யுத்தம். பலம் = நிலை பலம் (0–100).",
        "Flags: R retrograde, C combust, Caz cazimi, Vg vargottama, W planetary war. Score = positional strength (0–100).",
    ),
    "lordship": ("அதிபதி அட்டவணை", "Lordship ledger"),
    "rules": ("ஆளும் வீடுகள்", "Rules houses"),
    "sits": ("இருக்கும் வீடு", "Sits in house"),
    "drishti": ("ஜாதகப் பார்வைகள்", "Natal drishti"),
    "from": ("பார்க்கும் கிரகம்", "From"),
    "to": ("பார்க்கப்படும் கிரகம்", "To"),
    "aspect": ("பார்வை", "Aspect"),
    "dasha_chain": ("நடப்பு தசை வரிசை", "Running dasha chain"),
    "level": ("நிலை", "Level"),
    "lord": ("அதிபதி", "Lord"),
    "period": ("காலம்", "Period"),
    "natal_house": ("பிறப்பில் வீடு", "Natal house"),
    "transit_moon": ("இப்போது சந்திரனிலிருந்து", "Now from Moon"),
    "yogas": ("யோகங்களும் தோஷங்களும்", "Yogas and doshams"),
    "name": ("பெயர்", "Name"),
    "status": ("நிலை", "Status"),
    "strength": ("பலம்", "Strength"),
    "in_dasha": ("தசையில் இயங்குகிறது", "Running in dasha"),
    "absent_note": ("இந்த ஜாதகத்தில் உருவாகாத {n} அமைப்புகள் பட்டியலில் இல்லை.", "{n} patterns that did not form in this chart are not listed."),
    "peyarchi": ("வரவிருக்கும் பெயர்ச்சிகள்", "Upcoming peyarchi"),
    "date": ("தேதி", "Date"),
    "move": ("ராசி மாற்றம்", "Sign change"),
    "from_moon": ("சந்திரனிலிருந்து", "From Moon"),
    "from_lagna": ("லக்னத்திலிருந்து", "From Lagna"),
}

_DIGNITY_WORD: dict[str, tuple[str, str]] = {
    "EXALTED": ("உச்சம்", "exalted"),
    "MOOLATRIKONA": ("மூலத்திரிகோணம்", "moolatrikona"),
    "OWN_SIGN": ("சொந்த ராசி", "own sign"),
    "FRIEND_SIGN": ("நட்பு ராசி", "friendly sign"),
    "NEUTRAL_SIGN": ("சம ராசி", "neutral sign"),
    "ENEMY_SIGN": ("பகை ராசி", "enemy sign"),
    "DEBILITATED": ("நீசம்", "debilitated"),
}

_NATURE_WORD: dict[str, tuple[str, str]] = {
    "LAGNA_LORD": ("லக்னாதிபதி", "Lagna lord"),
    "YOGAKARAKA": ("யோககாரகன்", "Yogakaraka"),
    "TRIKONA": ("திரிகோண ஆதரவு", "Trikona support"),
    "KENDRA": ("கேந்திர பங்கு", "Kendra role"),
    "MARAKA": ("மாரக பங்கு", "Maraka role"),
    "DUSTHANA": ("துஷ்டான பங்கு", "Dusthana role"),
    "NEUTRAL": ("நடுநிலை", "Neutral"),
}

_LEVEL_LABEL_KEY = {"MAHADASHA": "mahadasha", "ANTARDASHA": "antardasha", "PRATYANTARDASHA": "pratyantar"}


def _astro(key: str, lang: str) -> str:
    ta, en = _ASTRO_LABELS[key]
    return ta if _normalize_lang(lang) == "ta" else en


def _pair(table: dict[str, tuple[str, str]], key: str, lang: str) -> str:
    entry = table.get(key)
    if entry is None:
        return key.replace("_", " ").lower() if key else "—"
    return entry[0] if _normalize_lang(lang) == "ta" else entry[1]


def _planet_name(graha: str, lang: str) -> str:
    return planet_ta(graha) if _normalize_lang(lang) == "ta" else planet_en(graha)


def _rasi_name(rasi: int | None, lang: str, fallback: str = "—") -> str:
    name = rasi_ta(rasi) if _normalize_lang(lang) == "ta" else rasi_en(rasi)
    return name or fallback


def _int_or_none(value) -> int | None:
    return value if isinstance(value, int) else None


def _star_name(nakshatra: int | None, lang: str, fallback: str = "—") -> str:
    name = nakshatra_ta(nakshatra) if _normalize_lang(lang) == "ta" else nakshatra_en(nakshatra)
    if name:
        return name
    return fallback.title() if fallback.isupper() else fallback


def _rasi_number(code: str | None) -> int | None:
    if not code:
        return None
    wanted = code.strip().lower()
    return next((number for number, name in RASI_NAMES.items() if name.lower() == wanted), None)


def _ordinal(n: int) -> str:
    suffix = "th" if 11 <= n % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def _aspect_label(aspect_type: str, lang: str) -> str:
    ta = _normalize_lang(lang) == "ta"
    if aspect_type == "STANDARD_7TH":
        return "7-ஆம் பார்வை" if ta else "7th aspect"
    special = re.match(r"^[A-Z]+_SPECIAL_(\d+)TH$", aspect_type)
    if special:
        n = int(special.group(1))
        return f"சிறப்பு {n}-ஆம் பார்வை" if ta else f"special {_ordinal(n)} aspect"
    return aspect_type.replace("_", " ").lower()


def _flags(planet, lang: str) -> str:
    ta = _normalize_lang(lang) == "ta"
    flags = [
        ("வக்" if ta else "R") if planet.is_retrograde and planet.graha not in ("RAHU", "KETU") else None,
        ("அஸ்" if ta else "C") if planet.is_combust else None,
        ("கசி" if ta else "Caz") if getattr(planet, "is_cazimi", False) else None,
        ("வர்" if ta else "Vg") if planet.is_vargottama else None,
        ("யுத்" if ta else "W") if getattr(planet, "is_planetary_war", False) else None,
    ]
    return " · ".join(f for f in flags if f) or "—"


def _houses_ruled(graha: str, lagna_rasi: int) -> list[int]:
    return sorted(((rasi - lagna_rasi) % 12) + 1 for rasi, lord in SIGN_LORD.items() if lord == graha)


def _ledger(rows: list[list[str]], fractions: list[float], lang: str) -> Table:
    """A ledger table whose cells wrap (Tamil runs wider than its English twin)."""
    font_name, bold_font_name = _register_pdf_fonts(lang)
    cell = ParagraphStyle("PdfCell", fontName=font_name, fontSize=7, leading=9)
    head = ParagraphStyle("PdfCellHead", parent=cell, fontName=bold_font_name, textColor=colors.white)
    width = _PAGE_W - 2 * _MARGIN
    data = [[Paragraph(str(value), head if index == 0 else cell) for value in row] for index, row in enumerate(rows)]
    table = Table(data, colWidths=[width * f for f in fractions], repeatRows=1)
    table.setStyle(_table_style_base(lang))
    return table


def _section_astrologer(explanation, lagna_rasi: int, heading_style, body_style, caption_style, lang: str = "en") -> list:
    """The Astrologer view's ledgers: method, grahas, lordship, drishti, the
    running dasha chain, yogas and doshams, and the coming sign changes."""
    data = explanation.data
    lang = _normalize_lang(lang)
    planets = sorted(
        (p for p in data.planets if p.graha in _GRAHA_ORDER),
        key=lambda p: _GRAHA_ORDER.index(p.graha),
    )
    story: list = [
        PageBreak(),
        Paragraph(_astro("title", lang), heading_style),
        Paragraph(_astro("intro", lang), caption_style),
        Paragraph(f"<b>{_astro('method', lang)}:</b> {_bitext(data.method_note, lang)}", body_style),
        Spacer(1, 0.2 * cm),
    ]

    # Graha ledger
    rows = [[_label("graha", lang), _astro("house", lang), _label("rasi", lang), _astro("star_pada", lang), _astro("d9", lang),
             _astro("dignity", lang), _astro("role", lang), _astro("score", lang), _astro("flags", lang)]]
    for p in planets:
        star = nakshatra_ta(p.nakshatra) if lang == "ta" else nakshatra_en(p.nakshatra)
        rows.append([
            _planet_name(p.graha, lang),
            str(p.house_from_lagna),
            _rasi_name(p.rasi, lang),
            f"{star or '—'} · {p.pada}",
            _rasi_name(p.d9_rasi, lang),
            _pair(_DIGNITY_WORD, p.dignity, lang),
            _pair(_NATURE_WORD, p.functional_nature, lang),
            str(round(p.strength_score)),
            _flags(p, lang),
        ])
    story += [Paragraph(_astro("graha_ledger", lang), heading_style),
              _ledger(rows, [0.11, 0.07, 0.12, 0.17, 0.12, 0.12, 0.13, 0.07, 0.09], lang),
              Paragraph(_astro("flags_note", lang), caption_style)]

    # Lordship ledger — houses ruled come from the fixed sign-lordship table.
    sits = {p.graha: p.house_from_lagna for p in planets}
    rows = [[_label("graha", lang), _astro("role", lang), _astro("rules", lang), _astro("sits", lang)]]
    for graha in _GRAHA_ORDER:
        if graha not in data.functional_nature and graha not in sits:
            continue
        ruled = _houses_ruled(graha, lagna_rasi)
        rows.append([
            _planet_name(graha, lang),
            _pair(_NATURE_WORD, data.functional_nature[graha], lang) if graha in data.functional_nature else "—",
            ", ".join(map(str, ruled)) or "—",
            str(sits.get(graha, "—")),
        ])
    story += [Paragraph(_astro("lordship", lang), heading_style), _ledger(rows, [0.22, 0.3, 0.26, 0.22], lang)]

    # Natal drishti, uncapped.
    if data.aspects:
        rows = [[_astro("from", lang), _astro("to", lang), _astro("house", lang), _astro("aspect", lang)]]
        rows += [[_planet_name(a.source_planet, lang), _planet_name(a.target_planet, lang), str(a.target_house), _aspect_label(a.aspect_type, lang)]
                 for a in data.aspects]
        story += [Paragraph(_astro("drishti", lang), heading_style), _ledger(rows, [0.25, 0.25, 0.15, 0.35], lang)]

    # Running dasha chain.
    lords = data.current_activation.active_lords
    if lords:
        rows = [[_astro("level", lang), _astro("lord", lang), _astro("period", lang), _astro("natal_house", lang), _astro("transit_moon", lang)]]
        for lord in lords:
            level_key = _LEVEL_LABEL_KEY.get(lord.level)
            rows.append([
                _label(level_key, lang) if level_key else lord.level.title(),
                _planet_name(lord.lord, lang),
                f"{lord.start_date} – {lord.end_date}",
                str(lord.natal_house_from_lagna),
                str(lord.transit_house_from_moon),
            ])
        story += [Paragraph(_astro("dasha_chain", lang), heading_style), _ledger(rows, [0.2, 0.18, 0.3, 0.16, 0.16], lang)]

    # Yogas and doshams that formed (present or formed-and-cancelled).
    rows = [[_astro("name", lang), _astro("status", lang), _astro("strength", lang), _astro("in_dasha", lang)]]
    absent = 0
    for yoga in data.yoga_dosham.yogas:
        status_code = yoga_reading_status(yoga.is_present, yoga.strength, yoga.cancellation_factors)
        if status_code == "ABSENT":
            absent += 1
            continue
        rows.append([
            yoga_display_name(yoga.name, lang),
            status_word(status_code, lang),
            natal_strength_word(yoga.strength, lang) if status_code == "PRESENT" else "—",
            _label("yes" if yoga.dasha_activated else "no", lang),
        ])
    for dosham in data.yoga_dosham.doshams:
        if not dosham.is_present:
            absent += 1
            continue
        rows.append([
            yoga_display_name(dosham.name, lang),
            # DD-17: a mitigated dosham is still present — "Cancelled" was the
            # yoga word and read as erased. The next column names the residual.
            status_word("PRESENT", lang),
            dosham_standing_word(dosham.is_cancelled, dosham.strength, dosham.residual, lang),
            _label("yes" if dosham.dasha_activated and not dosham.is_cancelled else "no", lang),
        ])
    story.append(Paragraph(_astro("yogas", lang), heading_style))
    if len(rows) > 1:
        story.append(_ledger(rows, [0.46, 0.18, 0.18, 0.18], lang))
    if absent:
        story.append(Paragraph(_astro("absent_note", lang).format(n=absent), caption_style))

    # Coming sign changes.
    events = data.peyarchi.events
    if events:
        rows = [[_label("graha", lang), _astro("date", lang), _astro("move", lang), _astro("from_moon", lang), _astro("from_lagna", lang)]]
        for event in events:
            move = f"{_rasi_name(_rasi_number(event.from_rasi), lang)} → {_rasi_name(_rasi_number(event.to_rasi), lang)}"
            rows.append([_planet_name(event.planet, lang), str(event.event_date), move, str(event.house_from_moon), str(event.house_from_lagna)])
        story += [Paragraph(_astro("peyarchi", lang), heading_style), _ledger(rows, [0.16, 0.18, 0.34, 0.16, 0.16], lang)]

    return story


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_chart_pdf(
    session: Session,
    chart_id: UUID,
    on_date: date,
    lang: str = "en",
    detail: str = "summary",
) -> bytes:
    """
    Build a PDF report for the given chart on the given date.
    Returns raw PDF bytes.

    ``detail="astrologer"`` appends the Astrologer view's ledgers (FTR-22,
    "share with my astrologer"); the default one-page snapshot is unchanged.
    """
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")

    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")

    chart_response = load_persisted_chart_response(session, chart_id)
    dasha_response = get_chart_dasha(session, chart_id, on_date, level="pratyantar")

    daily_location = resolve_effective_daily_location(profile)
    panchang = calculate_daily_panchangam(
        on_date,
        daily_location.latitude,
        daily_location.longitude,
        daily_location.timezone,
    )

    # Quick score derivation from the day's star (same lightweight heuristic as
    # daily_push_cron, and now literally the same two sets — these were hand-
    # copies that had drifted: the push copy also listed 14 as a caution star.
    # Dominant rather than sunrise, so an exported PDF and the app agree about
    # which star ran the day.
    nak = panchang.dominant_nakshatra_number or panchang.nakshatra_number
    if nak in AUSPICIOUS_DAILY_NAKSHATRAS:
        score, label = 72, _label("good", lang)
    elif nak in CAUTION_DAILY_NAKSHATRAS:
        score, label = 32, _label("caution", lang)
    else:
        score, label = 50, _label("balanced", lang)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=_MARGIN,
        rightMargin=_MARGIN,
        topMargin=_MARGIN,
        bottomMargin=_MARGIN,
        title=f"Jadhagam — {chart_response.data.birth_profile.display_name}",
    )

    title_style, heading_style, body_style, caption_style = _styles(lang)

    story = []
    story += _section_birth_profile(chart_response, title_style, body_style, caption_style, lang)
    story.append(Spacer(1, 0.3 * cm))
    story += _section_planets(chart_response, heading_style, lang)
    story.append(Spacer(1, 0.3 * cm))
    story += _section_dasha(dasha_response, heading_style, body_style, lang)
    story.append(Spacer(1, 0.3 * cm))
    story += _section_daily(
        panchang,
        score,
        label,
        daily_location.place or daily_location.timezone,
        heading_style,
        body_style,
        lang,  # was missing: a Tamil PDF printed this section's labels in English
    )

    if detail == "astrologer":
        # Imported here: the explanation service is heavy and the summary PDF
        # (the common path) never needs it.
        from app.services.chart_explanation_service import build_chart_explanation

        explanation = build_chart_explanation(session, chart_id, as_of=on_date)
        story += _section_astrologer(
            explanation, chart_response.data.lagna.rasi, heading_style, body_style, caption_style, lang
        )

    doc.build(story)
    return buf.getvalue()


def generate_porutham_pdf(
    porutham: DirectPoruthamData,
    name_a: str,
    name_b: str,
    lang: str = "en",
    *,
    chart_a=None,
    chart_b=None,
    dasha_a=None,
    dasha_b=None,
) -> bytes:
    """
    Build a single-page compatibility PDF from a direct Porutham response.
    Returns raw PDF bytes.

    ``chart_a``/``chart_b`` (``ChartCalculateResponseData``) and ``dasha_a``/
    ``dasha_b`` (``DashaTimelineResponseData``) are optional — when supplied,
    a Rasi/Nakshatra/Lagna/current-Dasha identity block is added for both
    people. Older callers that don't pass them keep the previous PDF shape.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=_MARGIN,
        rightMargin=_MARGIN,
        topMargin=_MARGIN,
        bottomMargin=_MARGIN,
        title=f"Porutham_{_safe_filename_fragment(name_a, 'A')}_{_safe_filename_fragment(name_b, 'B')}",
    )

    styles = getSampleStyleSheet()
    font_name, bold_font_name = _register_pdf_fonts(lang)
    title_style = ParagraphStyle(
        "PoruthamTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#B85A2C"),
        spaceAfter=4,
        fontName=bold_font_name,
    )
    body_style = ParagraphStyle("PoruthamBody", parent=styles["Normal"], fontSize=9, leading=13, fontName=font_name)
    small_style = ParagraphStyle("PoruthamSmall", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#7A6F5E"), fontName=font_name)
    score_style = ParagraphStyle("PoruthamScore", parent=styles["Normal"], fontSize=26, leading=30, fontName=bold_font_name)
    heading_style = ParagraphStyle("PoruthamHeading", parent=styles["Heading2"], fontSize=12, leading=16, fontName=bold_font_name)

    percentage = round((porutham.total_score / max(1, porutham.max_score)) * 100)
    if percentage >= 70:
        score_color = "#5C7654"
    elif percentage >= 40:
        score_color = "#B85A2C"
    else:
        score_color = "#A8482F"
    score_style.textColor = colors.HexColor(score_color)

    story: list = [
        Paragraph(_label("porutham_title", lang), title_style),
        Paragraph(f"{name_a} x {name_b}", body_style),
        Paragraph(f"{_label('context', lang)}: {porutham.compatibility_context}", small_style),
        Spacer(1, 0.4 * cm),
        Paragraph(f"{porutham.total_score} / {porutham.max_score}", score_style),
        Paragraph(f"{porutham.label} - {percentage}%", body_style),
    ]

    if porutham.rajju_dosha:
        story.append(Paragraph(_label("warning_rajju", lang), body_style))
    if porutham.vedha_dosha:
        story.append(Paragraph(_label("warning_vedha", lang), body_style))

    story.extend(
        [
            Spacer(1, 0.2 * cm),
            Paragraph(_bitext(porutham.summary, lang), body_style),
        ]
    )
    if porutham.context_note is not None and _bitext(porutham.context_note, lang):
        story.extend([Spacer(1, 0.12 * cm), Paragraph(_bitext(porutham.context_note, lang), small_style)])

    identity_section = _section_couple_identity(name_a, chart_a, dasha_a, name_b, chart_b, dasha_b, heading_style, body_style, lang)
    if identity_section:
        story.extend([Spacer(1, 0.3 * cm), *identity_section])

    story.extend([Spacer(1, 0.4 * cm), Paragraph(_label("factor_breakdown", lang), heading_style)])
    table_rows = [[_label("factor", lang), _label("score", lang), "Max", _label("result", lang)]]
    for k in porutham.kutas:
        kpct = round((k.score / max(1, k.max_score)) * 100)
        result = _label("good", lang) if kpct >= 70 else _label("balanced", lang) if kpct >= 40 else _label("caution", lang)
        table_rows.append([k.name_ta if _normalize_lang(lang) == "ta" else k.name, str(k.score), str(k.max_score), result])

    table = Table(
        table_rows,
        colWidths=[(_PAGE_W - 2 * _MARGIN) * f for f in (0.46, 0.14, 0.14, 0.2)],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F4EEE2")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#3D352B")),
                ("FONTNAME", (0, 0), (-1, 0), bold_font_name),
                ("FONTNAME", (0, 1), (-1, -1), font_name),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAF5EA")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D4C8AE")),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(table)
    story.extend(
        [
            Spacer(1, 0.35 * cm),
            Paragraph(
                f"Generated by Vinaadi - Thirukanitham Jyotish - {date.today().isoformat()}",
                small_style,
            ),
        ]
    )

    doc.build(story)
    return buf.getvalue()


def _pdf_text_table(rows: list[list[str]], col_widths: list[float], lang: str = "en") -> Table:
    font_name, bold_font_name = _register_pdf_fonts(lang)
    table = Table(rows, colWidths=col_widths)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F4EEE2")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#3D352B")),
                ("FONTNAME", (0, 0), (-1, 0), bold_font_name),
                ("FONTNAME", (0, 1), (-1, -1), font_name),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAF5EA")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D4C8AE")),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def generate_compatibility_intelligence_pdf(
    report: CompatibilityIntelligenceData,
    name_a: str,
    name_b: str,
    lang: str = "en",
) -> bytes:
    """Build a detailed multi-section PDF for the Compatibility Intelligence report."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=_MARGIN,
        rightMargin=_MARGIN,
        topMargin=_MARGIN,
        bottomMargin=_MARGIN,
        title=f"CompatibilityIntelligence_{_safe_filename_fragment(name_a, 'A')}_{_safe_filename_fragment(name_b, 'B')}",
    )

    title_style, heading_style, body_style, caption_style = _styles(lang)
    score_style = ParagraphStyle(
        "CompatibilityScore",
        parent=body_style,
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#2C3E50"),
    )
    subheading_style = ParagraphStyle(
        "CompatibilitySubheading",
        parent=body_style,
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#5D5245"),
    )

    story: list = [
        Paragraph(_label("ci_title", lang), title_style),
        Paragraph(f"<b>{name_a}</b> x <b>{name_b}</b>", body_style),
        Paragraph(f"{_label('generated', lang)}: {date.today().isoformat()}", caption_style),
        Spacer(1, 0.25 * cm),
        Paragraph(f"{report.overall_score} / 100", score_style),
        Paragraph(f"{_label('overall_rating', lang)}: {report.overall_label}", subheading_style),
        Spacer(1, 0.12 * cm),
        Paragraph(_bitext(report.summary, lang), body_style),
    ]

    story.extend([
        Spacer(1, 0.25 * cm),
        Paragraph(_label("couple_identity", lang), heading_style),
        Paragraph(
            f"<b>{name_a}</b> &mdash; {_label('rasi', lang)}: {report.person_a_identity.rasi_name} &nbsp;&nbsp; "
            f"{_label('nakshatra', lang)}: {report.person_a_identity.nakshatra_name} {_label('pada', lang)} {report.person_a_identity.pada} &nbsp;&nbsp; "
            f"{_label('lagna', lang)}: {report.person_a_identity.lagna_rasi_name}",
            body_style,
        ),
        Paragraph(
            f"<b>{name_b}</b> &mdash; {_label('rasi', lang)}: {report.person_b_identity.rasi_name} &nbsp;&nbsp; "
            f"{_label('nakshatra', lang)}: {report.person_b_identity.nakshatra_name} {_label('pada', lang)} {report.person_b_identity.pada} &nbsp;&nbsp; "
            f"{_label('lagna', lang)}: {report.person_b_identity.lagna_rasi_name}",
            body_style,
        ),
    ])

    story.extend([Spacer(1, 0.3 * cm), Paragraph(_label("score_breakdown", lang), heading_style)])
    score_rows = [["Layer", "Score", "Max"]]
    score_rows.extend([
        ["Porutham", str(report.score_breakdown.porutham), "20"],
        ["7th House", str(report.score_breakdown.seventh_house), "20"],
        ["Navamsa", str(report.score_breakdown.navamsa), "20"],
        ["Dasha Harmony", str(report.score_breakdown.dasha_harmony), "15"],
        ["Dosham Analysis", str(report.score_breakdown.dosham_analysis), "10"],
        ["Emotional", str(report.score_breakdown.emotional), "10"],
        ["Synastry", str(report.score_breakdown.synastry), "5"],
    ])
    story.append(_pdf_text_table(score_rows, [(_PAGE_W - 2 * _MARGIN) * f for f in (0.56, 0.18, 0.18)], lang))

    note_lang = _normalize_lang(lang)
    strengths = report.strengths_ta if note_lang == "ta" else report.strengths_en
    risks = report.risks_ta if note_lang == "ta" else report.risks_en
    if strengths or risks:
        story.extend([Spacer(1, 0.3 * cm), Paragraph(_label("highlights", lang), heading_style)])
        if strengths:
            story.append(Paragraph(_label("strengths", lang), subheading_style))
            for item in strengths:
                story.append(Paragraph(f"- {item}", body_style))
        if risks:
            story.append(Spacer(1, 0.08 * cm))
            story.append(Paragraph(_label("areas_to_watch", lang), subheading_style))
            for item in risks:
                story.append(Paragraph(f"- {item}", body_style))

    story.extend([Spacer(1, 0.3 * cm), Paragraph(_label("porutham_level", lang), heading_style)])
    story.append(
        Paragraph(
            f"Score: {report.porutham_score}/{report.porutham_max} ({round(report.porutham_percentage)}%) - {report.porutham_label}",
            body_style,
        )
    )
    if report.rajju_dosha:
        story.append(Paragraph(_label("warning_rajju", lang), body_style))
    if report.vedha_dosha:
        story.append(Paragraph(_label("warning_vedha", lang), body_style))
    if report.nadi_dosha.has_nadi_dosha:
        story.append(Paragraph(f"Warning: Nadi dosha present - {report.nadi_dosha.severity}.", body_style))
    if report.nadi_dosha.cancellations:
        # Shown independently of has_nadi_dosha — a full Classical Exception
        # cancellation (A-9 v2) clears has_nadi_dosha but the reason it was
        # cleared is still worth surfacing.
        story.append(Paragraph(f"Nadi Dosha notes: {', '.join(report.nadi_dosha.cancellations)}", body_style))
    porutham_rows = [["Kuta", "Score", "Max", "Label"]]
    for kuta in report.porutham_kutas:
        porutham_rows.append([kuta.name, str(kuta.score), str(kuta.max_score), kuta.label])
    story.append(_pdf_text_table(porutham_rows, [(_PAGE_W - 2 * _MARGIN) * f for f in (0.38, 0.14, 0.14, 0.24)], lang))

    story.extend([Spacer(1, 0.3 * cm), Paragraph(_label("chart_strength_level", lang), heading_style)])
    strength_rows = [["Person", "7th Lord", "7th House", "Venus", "Score"]]
    for label, strength in ((report.person_a_name, report.chart_a_strength), (report.person_b_name, report.chart_b_strength)):
        strength_rows.append([
            label,
            strength.seventh_lord,
            str(strength.seventh_lord_house),
            f"House {strength.venus_house} / {strength.venus_strength}",
            str(strength.score),
        ])
    story.append(_pdf_text_table(strength_rows, [(_PAGE_W - 2 * _MARGIN) * f for f in (0.24, 0.18, 0.14, 0.24, 0.12)], lang))
    story.append(Paragraph(f"{report.person_a_name}: {getattr(report.chart_a_strength, f'note_{note_lang}')}", body_style))
    story.append(Paragraph(f"{report.person_b_name}: {getattr(report.chart_b_strength, f'note_{note_lang}')}", body_style))

    story.extend([Spacer(1, 0.3 * cm), Paragraph(_label("navamsa_level", lang), heading_style)])
    story.append(
        Paragraph(
            f"Harmony: {report.navamsa.harmony_label}. {report.person_a_name} Venus D9: {report.navamsa.person_a_venus_d9}; {report.person_b_name} Venus D9: {report.navamsa.person_b_venus_d9}.",
            body_style,
        )
    )
    story.append(Paragraph(getattr(report.navamsa, f'note_{note_lang}'), body_style))

    story.extend([Spacer(1, 0.3 * cm), Paragraph(_label("sevvai_level", lang), heading_style)])
    dosham_rows = [["Person", "Has Dosham", "Cancelled", "Mars House", "Severity", "Score"]]
    for label, detail in ((report.person_a_name, report.sevvai_a), (report.person_b_name, report.sevvai_b)):
        dosham_rows.append([
            label,
            _label("yes", lang) if detail.has_dosham else _label("no", lang),
            _label("yes", lang) if detail.is_cancelled else _label("no", lang),
            str(detail.mars_house),
            detail.severity,
            str(detail.score),
        ])
    story.append(_pdf_text_table(dosham_rows, [(_PAGE_W - 2 * _MARGIN) * f for f in (0.22, 0.12, 0.12, 0.14, 0.18, 0.12)], lang))
    story.append(Paragraph(f"{report.person_a_name}: {getattr(report.sevvai_a, f'note_{note_lang}')}", body_style))
    story.append(Paragraph(f"{report.person_b_name}: {getattr(report.sevvai_b, f'note_{note_lang}')}", body_style))

    story.extend([Spacer(1, 0.3 * cm), Paragraph(_label("dasha_level", lang), heading_style)])
    story.append(
        Paragraph(
            (
                f"{report.person_a_name}: {report.dasha_harmony.person_a_maha_lord} / {report.dasha_harmony.person_a_antar_lord} until {report.dasha_harmony.person_a_maha_end}. "
                f"{report.person_b_name}: {report.dasha_harmony.person_b_maha_lord} / {report.dasha_harmony.person_b_antar_lord} until {report.dasha_harmony.person_b_maha_end}."
            ),
            body_style,
        )
    )
    story.append(Paragraph(f"{_label('harmony', lang)}: {report.dasha_harmony.harmony_label}", body_style))
    story.append(Paragraph(getattr(report.dasha_harmony, f'note_{note_lang}'), body_style))

    story.extend([Spacer(1, 0.3 * cm), Paragraph(_label("emotional_level", lang), heading_style)])
    story.append(
        Paragraph(
            f"Moon harmony: {report.emotional.moon_moon_harmony}. Venus-Mars harmony: {report.emotional.venus_mars_harmony}.",
            body_style,
        )
    )
    story.append(Paragraph(getattr(report.emotional, f'note_{note_lang}'), body_style))
    story.append(Paragraph(f"{_label('communication_note', lang)}: {report.emotional.communication_note}", body_style))

    story.extend([Spacer(1, 0.3 * cm), Paragraph(_label("synastry_level", lang), heading_style)])
    story.append(Paragraph(f"{_label('synastry_score', lang)}: {report.synastry_score}/100", body_style))
    story.append(
        Paragraph(
            "Synastry contributes up to 5 points to the final compatibility intelligence score.",
            body_style,
        )
    )

    story.extend([
        Spacer(1, 0.35 * cm),
        Paragraph(
            f"Generated by Vinaadi - Compatibility Intelligence - {date.today().isoformat()}",
            caption_style,
        ),
    ])

    doc.build(story)
    return buf.getvalue()
