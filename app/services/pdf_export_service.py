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
import re
from datetime import UTC, date, datetime
from typing import TYPE_CHECKING
from uuid import UUID

from fastapi import HTTPException, status
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
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
    from app.schemas.relationships import DirectPoruthamData

_PAGE_W, _PAGE_H = A4
_MARGIN = 1.8 * cm


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _styles():
    base = getSampleStyleSheet()
    title = ParagraphStyle(
        "PdfTitle",
        parent=base["Title"],
        fontSize=16,
        spaceAfter=4,
        textColor=colors.HexColor("#2C3E50"),
    )
    heading = ParagraphStyle(
        "PdfHeading",
        parent=base["Heading2"],
        fontSize=11,
        spaceBefore=10,
        spaceAfter=4,
        textColor=colors.HexColor("#34495E"),
    )
    body = ParagraphStyle(
        "PdfBody",
        parent=base["Normal"],
        fontSize=9,
        leading=13,
    )
    caption = ParagraphStyle(
        "PdfCaption",
        parent=base["Normal"],
        fontSize=8,
        textColor=colors.grey,
        spaceAfter=6,
    )
    return title, heading, body, caption


def _table_style_base() -> TableStyle:
    return TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0), colors.HexColor("#2C3E50")),
        ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
        ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
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


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def _section_birth_profile(chart_response, title_style, body_style, caption_style) -> list:
    profile = chart_response.data.birth_profile
    lagna = chart_response.data.lagna

    birth_date = profile.birth_date_local
    birth_time = profile.birth_time_local or "Unknown"

    elements = [
        Paragraph("Vinaadi AI — Jadhagam Report", title_style),
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
        Paragraph(f"Generated: {datetime.now(tz=UTC).strftime('%Y-%m-%d %H:%M UTC')}", caption_style),
    ]
    return elements


def _section_planets(chart_response, heading_style) -> list:
    planets = chart_response.data.planets
    rows = [["Graha", "Rasi", "Nakshatra", "House", "Retro", "Combust"]]
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
    tbl.setStyle(_table_style_base())
    return [Paragraph("Planet Positions", heading_style), tbl]


def _section_dasha(dasha_response, heading_style, body_style) -> list:
    current = dasha_response.data.current
    maha = current.mahadasha
    antar = current.antardasha
    pratyantar = current.pratyantardasha

    lines = [
        f"<b>Mahadasha:</b> {maha.lord} &nbsp; ends {maha.end_date}",
        f"<b>Antardasha:</b> {antar.lord} &nbsp; ends {antar.end_date}",
        f"<b>Pratyantar:</b> {pratyantar.lord} &nbsp; ends {pratyantar.end_date}",
    ]

    return [Paragraph("Current Dasha", heading_style)] + [Paragraph(l, body_style) for l in lines]


def _section_daily(panchang, score: int, label: str, location_label: str, heading_style, body_style) -> list:
    slot = best_gowri_slot(panchang.nalla_neram)
    if slot:
        slot_name = getattr(slot, "name", None)
        slot_label = gowri_good_label(slot_name, "en")
        slot_purpose = gowri_good_purpose(slot_name, "en")
        nalla_time = f"{slot.start.strftime('%H:%M')}–{slot.end.strftime('%H:%M')}"
        if slot_label and slot_purpose:
            nalla = f"{slot_label} {nalla_time} ({slot_purpose})"
        elif slot_label:
            nalla = f"{slot_label} {nalla_time}"
        else:
            nalla = nalla_time
    else:
        nalla = "-"
    rahu  = f"{panchang.rahu_kalam.start.strftime('%H:%M')}–{panchang.rahu_kalam.end.strftime('%H:%M')}"
    lines = [
        f"Location for daily timings: {location_label}",
        f"Date: {panchang.date_local} &nbsp;&nbsp; Nakshatra: {panchang.nakshatra_name} (Pada {panchang.nakshatra_pada})",
        f"Tithi: {panchang.tithi_name} ({panchang.tithi_paksha})",
        f"Daily Score: <b>{score}/100</b> — {label}",
        f"Nalla Neram: {nalla} &nbsp;&nbsp; Rahu Kalam: {rahu}",
    ]
    return [Paragraph("Today's Guidance", heading_style)] + [Paragraph(l, body_style) for l in lines]


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_chart_pdf(
    session: Session,
    chart_id: UUID,
    on_date: date,
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
        score, label = 72, "GOOD"
    elif nak in {2, 9, 10, 19}:
        score, label = 32, "CAUTION"
    else:
        score, label = 50, "BALANCED"

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

    title_style, heading_style, body_style, caption_style = _styles()

    story = []
    story += _section_birth_profile(chart_response, title_style, body_style, caption_style)
    story.append(Spacer(1, 0.3 * cm))
    story += _section_planets(chart_response, heading_style)
    story.append(Spacer(1, 0.3 * cm))
    story += _section_dasha(dasha_response, heading_style, body_style)
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
    porutham: "DirectPoruthamData",
    name_a: str,
    name_b: str,
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
    title_style = ParagraphStyle(
        "PoruthamTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#B85A2C"),
        spaceAfter=4,
    )
    body_style = ParagraphStyle("PoruthamBody", parent=styles["Normal"], fontSize=9, leading=13)
    small_style = ParagraphStyle("PoruthamSmall", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#7A6F5E"))
    score_style = ParagraphStyle("PoruthamScore", parent=styles["Normal"], fontSize=26, leading=30)

    percentage = round((porutham.total_score / max(1, porutham.max_score)) * 100)
    if percentage >= 70:
        score_color = "#5C7654"
    elif percentage >= 40:
        score_color = "#B85A2C"
    else:
        score_color = "#A8482F"
    score_style.textColor = colors.HexColor(score_color)

    story: list = [
        Paragraph("Porutham - Compatibility Report", title_style),
        Paragraph(f"{name_a} x {name_b}", body_style),
        Paragraph(f"Context: {porutham.compatibility_context}", small_style),
        Spacer(1, 0.4 * cm),
        Paragraph(f"{porutham.total_score} / {porutham.max_score}", score_style),
        Paragraph(f"{porutham.label} - {percentage}%", body_style),
    ]

    if porutham.rajju_dosha:
        story.append(Paragraph("Warning: Rajju dosha present.", body_style))
    if porutham.vedha_dosha:
        story.append(Paragraph("Warning: Vedha dosha present.", body_style))

    story.extend(
        [
            Spacer(1, 0.2 * cm),
            Paragraph(porutham.summary.en, body_style),
        ]
    )
    if porutham.context_note is not None and porutham.context_note.en:
        story.extend([Spacer(1, 0.12 * cm), Paragraph(porutham.context_note.en, small_style)])

    story.extend([Spacer(1, 0.4 * cm), Paragraph("Factor Breakdown", styles["Heading2"])])
    table_rows = [["Factor", "Score", "Max", "Result"]]
    for k in porutham.kutas:
        kpct = round((k.score / max(1, k.max_score)) * 100)
        result = "Good" if kpct >= 70 else "Moderate" if kpct >= 40 else "Weak"
        table_rows.append([k.name, str(k.score), str(k.max_score), result])

    table = Table(
        table_rows,
        colWidths=[(_PAGE_W - 2 * _MARGIN) * f for f in (0.46, 0.14, 0.14, 0.2)],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F4EEE2")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#3D352B")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
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
