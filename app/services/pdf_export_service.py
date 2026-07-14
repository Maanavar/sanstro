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
from pathlib import Path
from datetime import UTC, date, datetime
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
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session

from app.calculations.panchangam import (
    best_gowri_slot,
    calculate_daily_panchangam,
    gowri_good_label,
    gowri_good_purpose,
)
from app.models import BirthProfile, Chart
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
    "en": {"unknown": "Unknown", "yes": "Yes", "no": "No", "title_jadhagam": "Vinaadi AI - Jadhagam Report", "birth_date": "Birth Date", "time": "Time", "place": "Place", "lagna": "Lagna", "nakshatra": "Nakshatra", "pada": "Pada", "generated": "Generated", "planet_positions": "Planet Positions", "graha": "Graha", "rasi": "Rasi", "house": "House", "retro": "Retro", "combust": "Combust", "current_dasha": "Current Dasha", "mahadasha": "Mahadasha", "antardasha": "Antardasha", "pratyantar": "Pratyantar", "ends": "ends", "todays_guidance": "Today's Guidance", "location": "Location for daily timings", "date": "Date", "tithi": "Tithi", "daily_score": "Daily Score", "nalla_neram": "Nalla Neram", "rahu_kalam": "Rahu Kalam", "good": "GOOD", "caution": "CAUTION", "balanced": "BALANCED", "porutham_title": "Porutham - Compatibility Report", "context": "Context", "warning_rajju": "Warning: Rajju dosha present.", "warning_vedha": "Warning: Vedha dosha present.", "factor_breakdown": "Factor Breakdown", "factor": "Factor", "score": "Score", "result": "Result", "nadi_dosha": "Nadi Dosha", "ci_title": "Vinaadi AI - Compatibility Intelligence Report", "overall_rating": "Overall Rating", "score_breakdown": "Score Breakdown", "highlights": "Highlights", "strengths": "Strengths", "areas_to_watch": "Areas to Watch", "porutham_level": "Level 1 - Traditional Porutham", "chart_strength_level": "Levels 2 and 3 - 7th House and Venus Strength", "navamsa_level": "Level 4 - Navamsa (D9)", "sevvai_level": "Level 5 - Sevvai Dosham", "dasha_level": "Level 6 - Dasha Alignment", "emotional_level": "Level 7 - Emotional Compatibility", "synastry_level": "Level 8 - Synastry", "cancellations": "Cancellations", "harmony": "Harmony", "communication_note": "Communication note", "synastry_score": "Synastry score"},
    "ta": {"unknown": "தெரியவில்லை", "yes": "ஆம்", "no": "இல்லை", "title_jadhagam": "வினாடி AI - ஜாதக அறிக்கை", "birth_date": "பிறந்த தேதி", "time": "நேரம்", "place": "இடம்", "lagna": "லக்னம்", "nakshatra": "நட்சத்திரம்", "pada": "பாதம்", "generated": "உருவாக்கப்பட்டது", "planet_positions": "கிரக நிலைகள்", "graha": "கிரகம்", "rasi": "ராசி", "house": "பாவம்", "retro": "வக்ரம்", "combust": "அஸ்தம்", "current_dasha": "தற்போதைய தசை", "mahadasha": "மகாதசை", "antardasha": "அந்தர்தசை", "pratyantar": "பிரத்யந்தர்தசை", "ends": "முடிவு", "todays_guidance": "இன்றைய வழிகாட்டல்", "location": "தினசரி நேரங்களுக்கான இடம்", "date": "தேதி", "tithi": "திதி", "daily_score": "தினசரி மதிப்பெண்", "nalla_neram": "நல்ல நேரம்", "rahu_kalam": "ராகு காலம்", "good": "நன்று", "caution": "கவனம்", "balanced": "சமநிலை", "porutham_title": "பொருத்தம் - இணக்க அறிக்கை", "context": "சூழல்", "warning_rajju": "எச்சரிக்கை: ரஜ்ஜு தோஷம் உள்ளது.", "warning_vedha": "எச்சரிக்கை: வேத தோஷம் உள்ளது.", "factor_breakdown": "கூறு விவரம்", "factor": "கூறு", "score": "மதிப்பெண்", "result": "முடிவு", "nadi_dosha": "நாடி தோஷம்", "ci_title": "வினாடி AI - விரிவான பொருத்த அறிக்கை", "overall_rating": "மொத்த மதிப்பீடு", "score_breakdown": "மதிப்பெண் விவரம்", "highlights": "முக்கிய அம்சங்கள்", "strengths": "பலங்கள்", "areas_to_watch": "கவனிக்க வேண்டியவை", "porutham_level": "நிலை 1 - பாரம்பரிய பொருத்தம்", "chart_strength_level": "நிலைகள் 2 மற்றும் 3 - 7ஆம் பாவம் மற்றும் சுக்கிர பலம்", "navamsa_level": "நிலை 4 - நவாம்சம் (D9)", "sevvai_level": "நிலை 5 - செவ்வாய் தோஷம்", "dasha_level": "நிலை 6 - தசை ஒத்திசைவு", "emotional_level": "நிலை 7 - உணர்ச்சி இணக்கம்", "synastry_level": "நிலை 8 - சினாஸ்ட்ரி", "cancellations": "நிவாரண காரணங்கள்", "harmony": "ஒத்திசைவு", "communication_note": "தொடர்பு குறிப்பு", "synastry_score": "சினாஸ்ட்ரி மதிப்பெண்"},
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
            value = value.strftime("%H:%M")
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
    elements = [
        Paragraph(_label("title_jadhagam", lang), title_style),
        Paragraph(f"<b>{profile.display_name}</b>", body_style),
        Paragraph(
            f"Birth Date: {birth_date} &nbsp;&nbsp; Time: {birth_time} &nbsp;&nbsp; "
            f"Place: {profile.birth_place}",
            body_style,
        ),
        Paragraph(
            f"Lagna: {lagna.rasi_name} &nbsp;&nbsp; "
            f"Nakshatra: {lagna.nakshatra_name} Pada {lagna.pada}",
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
            p.graha,
            p.rasi_name,
            p.nakshatra_name,
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
        f"<b>{_label('mahadasha', lang)}:</b> {maha.lord} &nbsp; {_label('ends', lang)} {maha.end_date}",
        f"<b>{_label('antardasha', lang)}:</b> {antar.lord} &nbsp; {_label('ends', lang)} {antar.end_date}",
        f"<b>{_label('pratyantar', lang)}:</b> {pratyantar.lord} &nbsp; {_label('ends', lang)} {pratyantar.end_date}",
    ]

    return [Paragraph(_label("current_dasha", lang), heading_style)] + [Paragraph(line, body_style) for line in lines]


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
# Public entry point
# ---------------------------------------------------------------------------

def generate_chart_pdf(
    session: Session,
    chart_id: UUID,
    on_date: date,
    lang: str = "en",
) -> bytes:
    """
    Build a PDF report for the given chart on the given date.
    Returns raw PDF bytes.
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

    # Quick score derivation from nakshatra (same lightweight heuristic as daily_push_cron)
    nak = panchang.nakshatra_number
    if nak in {1, 4, 5, 7, 8, 13, 14, 15, 17, 22, 27}:
        score, label = 72, _label("good", lang)
    elif nak in {2, 9, 10, 19}:
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
    )

    doc.build(story)
    return buf.getvalue()


def generate_porutham_pdf(
    porutham: DirectPoruthamData,
    name_a: str,
    name_b: str,
    lang: str = "en",
) -> bytes:
    """
    Build a single-page compatibility PDF from a direct Porutham response.
    Returns raw PDF bytes.
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