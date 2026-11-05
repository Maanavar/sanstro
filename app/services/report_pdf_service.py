"""The paid report documents — what a jadhagam_report / porutham_report credit
(or a month's Premium inclusion) is actually spent on.

Not the free export. `GET /charts/{id}/export/pdf` is a one-page snapshot and,
with `detail=astrologer`, the ledger sheet FTR-22 promises a reader can hand to
their own jyotishi. Both stay free and unchanged. These two documents are
longer compositions written for the person who paid: the reading in chapters,
with the dasha sequence, the timing windows and the written parihāram chapter
that the free sheets do not carry.

Why a module of its own rather than another `detail=` on the export: a paid
document is rendered once and stored (`app/models/report.py`), so this layout
has to be free to change without changing what somebody already bought, and the
free export has to be free to change without reprinting a paid artifact.

It composes from the house PDF primitives in `pdf_export_service` — fonts,
styles, and the display helpers that turn a rasi *number* into a name in the
reader's language. Those are imported by their private names deliberately: they
are the one source of truth for how a Vinaadi PDF looks and for the display
boundary (CLAUDE.md), and a second copy of either is a second answer.
"""
from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer
from sqlalchemy.orm import Session

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.event_windows import ChartData, EventType, find_event_windows
from app.calculations.functional_nature import get_functional_nature
from app.calculations.remedies import (
    active_dosham_planet,
    get_remedy,
    remedy_disclaimer,
    select_remedy_focus,
)
from app.calculations.yoga_display import (
    dosham_standing_word,
    status_word,
    yoga_display_name,
    yoga_reading_status,
)
from app.core.age_gate import marriage_timing_gate
from app.models import BirthProfile
from app.services._chart_summary import get_jadhagam_report
from app.services.birth_profile_service import resolve_relationship_to_owner
from app.services.chart_service import load_persisted_chart_response
from app.services.dasha_service import get_chart_dasha, get_chart_dasha_from_snapshot
from app.services.life_areas_service import area_label
from app.services.life_event_service import reason_bitext
from app.services.narrative_engine import format_clock_label
from app.services.pdf_export_service import (
    _MARGIN,
    _PAGE_W,
    _graha,
    _label,
    _normalize_lang,
    _pdf_text_table,
    _rasi,
    _register_pdf_fonts,
    _section_couple_identity,
    _section_planets,
    _star,
    _styles,
    _verdict,
)
from app.services.synastry_service import (
    build_compatibility_intelligence_from_snapshots,
    compare_charts_direct,
)

_CONTENT_W = _PAGE_W - 2 * _MARGIN

#: How far ahead the timing chapter looks. Ten years is what the event-window
#: engine is built for (`EventWindowsResponse` caps a request at twenty) and
#: what a reader can act on; beyond that the windows are noise with dates on.
_WINDOW_YEARS = 10

#: Words this document needs that the shared `_LABELS` table does not carry.
#: Tamil first — it is the language the reading is written in, and the Tamil
#: almanac word is preferred over the Sanskrit one (owner ruling).
_R: dict[str, tuple[str, str]] = {
    "jadhagam_title": ("ஜாதக அறிக்கை", "Jadhagam Report"),
    "porutham_title": ("விரிவான பொருத்த அறிக்கை", "Detailed Porutham Report"),
    "prepared_for": ("இந்த அறிக்கை", "Prepared for"),
    "age": ("வயது", "Age"),
    "page": ("பக்கம்", "Page"),
    "ch_identity": ("அடிப்படை அடையாளம்", "Core identity"),
    "ch_navamsam": ("நவாம்சம் (D9)", "Navamsam (D9)"),
    "ch_strength": ("கிரக பலம்", "Planetary strength"),
    "ch_adhipathi": ("பாவ அதிபதிகள்", "House lords"),
    "ch_yoga": ("யோகங்களும் தோஷங்களும்", "Yogas and doshams"),
    "ch_dasha": ("விம்சோத்தரி தசை வரிசை", "Vimshottari dasha sequence"),
    "ch_windows": ("வாழ்க்கை நிகழ்வுக் காலங்கள்", "Life event windows"),
    "ch_now": ("இந்த ஆண்டு", "This year"),
    "ch_guidance": ("நடைமுறை வழிகாட்டல்", "Practical guidance"),
    "ch_parihaaram": ("பரிகாரம்", "Parihāram"),
    "ch_verdict": ("மொத்தப் பொருத்தம்", "Overall match"),
    "ch_factors": ("பத்துப் பொருத்தங்கள்", "The ten poruthams"),
    "ch_layers": ("ஆழமான அடுக்குகள்", "The deeper layers"),
    "ch_notes": ("பலங்களும் கவனிக்க வேண்டியவையும்", "Strengths and areas to watch"),
    "summary": ("சுருக்கம்", "In summary"),
    "strong": ("வலுவான", "Strong"),
    "moderate": ("மிதமான", "Moderate"),
    "weak": ("ஆதரவு தேவைப்படும்", "Needs support"),
    "planet": ("கிரகம்", "Planet"),
    "score": ("மதிப்பெண்", "Score"),
    "d9_rasi": ("நவாம்ச ராசி", "D9 rasi"),
    "vargottama": ("வர்கோத்தமம்", "Vargottama"),
    "house": ("பாவம்", "House"),
    "lord": ("அதிபதி", "Lord"),
    "sits_in": ("அதிபதி நிற்கும் பாவம்", "Lord sits in"),
    "nature": ("தன்மை", "Nature"),
    "yoga": ("யோகம்", "Yoga"),
    "dosham": ("தோஷம்", "Dosham"),
    "standing": ("நிலை", "Standing"),
    "period": ("காலம்", "Period"),
    "area": ("துறை", "Area"),
    "reasons": ("காரணம்", "Why"),
    "level": ("நிலை", "Level"),
    "event_MARRIAGE": ("திருமணம்", "Marriage"),
    "event_CAREER": ("தொழில்", "Career"),
    "event_FINANCE": ("பொருளாதாரம்", "Finance"),
    "no_windows": (
        "இந்த ஆண்டுகளில் இந்தத் துறைக்குத் தனித்துச் சொல்லும்படியான காலம் இல்லை.",
        "No window in this range stands out for this area.",
    ),
    "marriage_withheld": (
        "இந்த ஜாதகத்திற்குத் திருமண காலக் கணிப்பு இந்த அறிக்கையில் தரப்படவில்லை.",
        "Marriage timing is not given for this chart in this report.",
    ),
    "marriage_reframed": (
        "திருமணம் ஆன ஜாதகம் — கீழே உள்ள காலங்கள் உறவு நல்லிணக்கத்திற்கானவை, "
        "புதிய திருமணத்திற்கு அல்ல.",
        "This chart is already married — the windows below read as relationship "
        "harmony, not as a new marriage.",
    ),
    "concerns": ("இப்போது கவனம் கேட்கும் இடங்கள்", "Where attention is being asked now"),
    "focus_areas": ("இந்த வயதில் செயலில் உள்ள துறைகள்", "Active areas at this age"),
    "temple": ("கோவில்", "Temple"),
    "day": ("நாள்", "Day"),
    "mantra": ("மந்திரம்", "Mantra"),
    "japa": ("ஜப எண்ணிக்கை", "Japa count"),
    "daanam": ("தானம்", "Daanam"),
    "seva": ("சேவை", "Seva"),
    "conduct": ("நடத்தை", "Conduct"),
    "advisory": (
        "இது ஆலோசனை. இந்த அறிக்கை என்ன நடக்கும் என்று தீர்மானிக்கவில்லை — "
        "பாரம்பரியக் கணிதம் என்ன சொல்கிறது என்பதை மட்டுமே சொல்கிறது. "
        "முடிவு உங்களுடையது; மருத்துவம், சட்டம், பணம் சார்ந்த விஷயங்களில் "
        "அத்துறை நிபுணரையும் அணுகுங்கள்.",
        "This is advice, not a verdict. The report says what the traditional "
        "calculation shows; it does not decide what will happen. The decision is "
        "yours, and for anything medical, legal or financial please also ask "
        "someone qualified in that field.",
    ),
    "advice_only_match": (
        "பொருத்தம் ஒரு ஆலோசனை, தீர்ப்பு அல்ல. மதிப்பெண் குறைவாக இருந்தாலும் "
        "அது ஒரு உறவை மறுப்பதற்கான காரணம் அல்ல; எந்த இடத்தில் கவனம் தேவை "
        "என்பதைக் காட்டுகிறது. முடிவு இரு குடும்பங்களுடையது.",
        "A porutham is advice, not a ruling. A low score is not a reason to "
        "refuse a match; it shows where care is needed. The decision belongs to "
        "the two families.",
    ),
    "built_from": ("கணிப்புப் பதிப்பு", "Calculation version"),
    "as_of": ("கணிக்கப்பட்ட நாள்", "Read as of"),
    "layer": ("அடுக்கு", "Layer"),
    "max": ("அதிகபட்சம்", "Max"),
    "person": ("ஜாதகர்", "Person"),
    "cancelled": ("நிவர்த்தி", "Mitigated"),
    "severity": ("தீவிரம்", "Severity"),
    "ctx_MARRIAGE": ("திருமணம்", "Marriage"),
    "ctx_FRIENDSHIP": ("நட்பு", "Friendship"),
    "ctx_BUSINESS": ("வணிகம்", "Business"),
    "ctx_FAMILY": ("குடும்பம்", "Family"),
    "ctx_GENERAL": ("பொது", "General"),
}


def _t(key: str, lang: str) -> str:
    ta, en = _R[key]
    return ta if _normalize_lang(lang) == "ta" else en


def _clock(value, lang: str) -> str:
    """A time of day in the reader's language. Tamil gets the almanac
    period-word before the number ("காலை 6:12"), never a Latin am/pm."""
    if value is None:
        return "—"
    raw = value.isoformat() if hasattr(value, "isoformat") else str(value)
    return format_clock_label(raw, _normalize_lang(lang)) or "—"


def _bi(ta: str, en: str, lang: str) -> str:
    return ta if _normalize_lang(lang) == "ta" else en


#: `house_lords.strength_band` emits STRONG | MODERATE | WEAK. Printed through
#: this rather than `verdict_phrase`: the verdict lexicon has no `strength`
#: domain, and an unmapped domain returns the key, so a Tamil report would have
#: printed "STRONG".
_BAND_WORDS = {"STRONG": "strong", "MODERATE": "moderate", "WEAK": "weak"}


def _band_word(band: str, lang: str) -> str:
    key = _BAND_WORDS.get((band or "").upper())
    return _t(key, lang) if key else (band or "—")


def _area_word(area: str, lang: str) -> str:
    """A life-area key in the reader's language, from the one table the Life
    Areas surface already reads."""
    label = area_label(area)
    if label is None:
        return area.replace("_", " ").title()
    return getattr(label, _normalize_lang(lang), None) or label.en


def _report_styles(lang: str):
    title, heading, body, caption = _styles(lang)
    font_name, bold_font_name = _register_pdf_fonts(lang)
    chapter = ParagraphStyle(
        "ReportChapter",
        parent=heading,
        fontSize=13,
        leading=17,
        spaceBefore=14,
        spaceAfter=6,
        textColor=colors.HexColor("#B85A2C"),
        fontName=bold_font_name,
    )
    lead = ParagraphStyle("ReportLead", parent=body, fontSize=10, leading=15, fontName=font_name)
    bullet = ParagraphStyle(
        "ReportBullet", parent=body, leftIndent=12, spaceAfter=3, fontName=font_name
    )
    return title, chapter, body, caption, lead, bullet


def _footer(lang: str, running_title: str):
    """A page number and one line of provenance on every page. A stored
    document is opened months later without the message it arrived in, so it
    has to say what it is on its own."""
    page_word = _t("page", lang)

    def draw(canvas, _doc) -> None:
        canvas.saveState()
        font_name, _bold = _register_pdf_fonts(lang)
        canvas.setFont(font_name, 7)
        canvas.setFillColor(colors.HexColor("#7A6F5E"))
        canvas.drawString(_MARGIN, 1.0 * cm, f"Vinaadi AI — {running_title}")
        canvas.drawRightString(
            _PAGE_W - _MARGIN, 1.0 * cm, f"{page_word} {canvas.getPageNumber()}"
        )
        canvas.restoreState()

    return draw


def _document(buf, *, title: str) -> SimpleDocTemplate:
    return SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=_MARGIN,
        rightMargin=_MARGIN,
        topMargin=_MARGIN,
        bottomMargin=1.7 * cm,
        title=title,
    )


def _bullets(items: list[str], style) -> list:
    return [Paragraph(f"&bull;&nbsp; {item}", style) for item in items if item]


# ── The Jadhagam report ──────────────────────────────────────────────────────


def _identity_chapter(report_data, snapshot, chapter_style, lead, body, lang: str) -> list:
    """Lagna, Moon, birth star and the running dasha.

    Read off `rasi_chart_summary` (numbers) rather than `core_identity` (which
    carries the server's own `*_name` strings): a Tamil report must not print a
    name the server chose in English.
    """
    lagna = report_data.rasi_chart_summary.lagna
    moon = next((p for p in report_data.rasi_chart_summary.planets if p.graha == "MOON"), None)
    rows = [
        [_label("lagna", lang), _rasi(lagna.rasi, lang)],
        [
            _label("rasi", lang),
            _rasi(moon.rasi, lang) if moon else "—",
        ],
        [
            _label("nakshatra", lang),
            (
                f"{_star(moon.nakshatra, lang)} — {_label('pada', lang)} {moon.pada}"
                if moon
                else "—"
            ),
        ],
        [
            _label("mahadasha", lang),
            _graha(report_data.dasha_analysis.current_mahadasha, lang),
        ],
        [
            _label("antardasha", lang),
            _graha(report_data.dasha_analysis.current_antardasha, lang),
        ],
    ]
    out = _chapter_heading("ch_identity", chapter_style, lang)
    out.append(_pdf_text_table(rows, [_CONTENT_W * 0.34, _CONTENT_W * 0.66], lang))
    # Printed only when a few minutes of birth-time error would move the Lagna,
    # which is the one caveat that changes how the whole document should be read.
    for note in (
        report_data.core_identity.lagna_edge_note,
        report_data.core_identity.navamsa_lagna_edge_note,
    ):
        if note is not None:
            text = getattr(note, _normalize_lang(lang), "") or getattr(note, "en", "")
            if text:
                out += [Spacer(1, 0.15 * cm), Paragraph(text, body)]
    summary = getattr(report_data.executive_summary, _normalize_lang(lang), "")
    if summary:
        out += [Spacer(1, 0.25 * cm), Paragraph(summary, lead)]
    return out


def _chapter_heading(key: str, chapter_style, lang: str) -> list:
    return [Paragraph(_t(key, lang), chapter_style)]


def _navamsam_chapter(report_data, chapter_style, lang: str) -> list:
    rows = [[_t("planet", lang), _t("d9_rasi", lang), _t("vargottama", lang)]]
    vargottama = set(report_data.navamsam_summary.vargottama_planets)
    for graha, d9_rasi in report_data.navamsam_summary.d9_by_planet.items():
        rows.append(
            [
                _graha(graha, lang),
                _rasi(d9_rasi, lang),
                _label("yes", lang) if graha in vargottama else "",
            ]
        )
    out = _chapter_heading("ch_navamsam", chapter_style, lang)
    out.append(
        _pdf_text_table(rows, [_CONTENT_W * 0.4, _CONTENT_W * 0.36, _CONTENT_W * 0.24], lang)
    )
    return out


def _strength_chapter(report_data, chapter_style, body, lang: str) -> list:
    summary = report_data.planetary_strength_summary
    rows = [[_t("planet", lang), _t("score", lang), _t("level", lang)]]
    for band_key, items in (
        ("strong", summary.strong),
        ("moderate", summary.moderate),
        ("weak", summary.weak),
    ):
        for item in items:
            rows.append([_graha(item.planet, lang), str(item.score), _t(band_key, lang)])
    out = _chapter_heading("ch_strength", chapter_style, lang)
    out.append(
        _pdf_text_table(rows, [_CONTENT_W * 0.4, _CONTENT_W * 0.24, _CONTENT_W * 0.36], lang)
    )
    return out


def _adhipathi_chapter(report_data, chapter_style, body, lang: str) -> list:
    if not report_data.adhipathi_report:
        return []
    out = _chapter_heading("ch_adhipathi", chapter_style, lang)
    rows = [
        [
            _t("house", lang),
            _t("lord", lang),
            _t("sits_in", lang),
            _t("score", lang),
            _t("nature", lang),
        ]
    ]
    for reading in report_data.adhipathi_report:
        rows.append(
            [
                str(reading.house),
                _graha(reading.lord, lang),
                f"{reading.lord_house} — {_rasi(reading.lord_rasi, lang)}",
                str(reading.strength_score),
                _band_word(reading.strength_band, lang),
            ]
        )
    out.append(
        _pdf_text_table(
            rows,
            [
                _CONTENT_W * 0.1,
                _CONTENT_W * 0.2,
                _CONTENT_W * 0.34,
                _CONTENT_W * 0.12,
                _CONTENT_W * 0.24,
            ],
            lang,
        )
    )
    out.append(Spacer(1, 0.2 * cm))
    for reading in report_data.adhipathi_report:
        text = reading.reading_ta if _normalize_lang(lang) == "ta" else reading.reading_en
        if text:
            out.append(Paragraph(f"<b>{reading.house}.</b> {text}", body))
    return out


def _yoga_chapter(report_data, chapter_style, body, lang: str) -> list:
    """Every yoga and dosham with its *standing*, not a bare name.

    `yoga_reading_status` and `dosham_standing_word` are the same functions the
    web and mobile cards read through, so a printed sheet cannot call a dosham
    active that the app shows as mitigated.
    """
    out = _chapter_heading("ch_yoga", chapter_style, lang)
    yogas = [y for y in report_data.yoga_dosham_summary.yogas if y.is_present]
    doshams = [d for d in report_data.yoga_dosham_summary.doshams if d.is_present]

    if yogas:
        rows = [[_t("yoga", lang), _t("standing", lang)]]
        for yoga in yogas:
            standing = status_word(
                yoga_reading_status(
                    yoga.is_present,
                    getattr(yoga, "strength", "") or "",
                    list(getattr(yoga, "cancellation_factors", []) or []),
                ),
                _normalize_lang(lang),
            )
            rows.append([yoga_display_name(yoga.name, _normalize_lang(lang)), standing])
        out.append(_pdf_text_table(rows, [_CONTENT_W * 0.62, _CONTENT_W * 0.38], lang))
        out.append(Spacer(1, 0.2 * cm))
        for yoga in yogas:
            effect = yoga.effect_ta if _normalize_lang(lang) == "ta" else yoga.effect_en
            if effect:
                name = yoga_display_name(yoga.name, _normalize_lang(lang))
                out.append(Paragraph(f"<b>{name}.</b> {effect}", body))

    if doshams:
        out.append(Spacer(1, 0.3 * cm))
        rows = [[_t("dosham", lang), _t("standing", lang)]]
        for dosham in doshams:
            rows.append(
                [
                    yoga_display_name(dosham.name, _normalize_lang(lang)),
                    dosham_standing_word(
                        dosham.is_cancelled,
                        dosham.strength,
                        dosham.residual,
                        _normalize_lang(lang),
                    ),
                ]
            )
        out.append(_pdf_text_table(rows, [_CONTENT_W * 0.62, _CONTENT_W * 0.38], lang))
        out.append(Spacer(1, 0.2 * cm))
        for dosham in doshams:
            meaning = dosham.meaning_ta if _normalize_lang(lang) == "ta" else dosham.meaning_en
            if not meaning:
                meaning = (
                    dosham.explanation_what_ta
                    if _normalize_lang(lang) == "ta"
                    else dosham.explanation_what_en
                )
            if meaning:
                name = yoga_display_name(dosham.name, _normalize_lang(lang))
                out.append(Paragraph(f"<b>{name}.</b> {meaning}", body))

    if not yogas and not doshams:
        out.append(
            Paragraph(
                _bi(
                    "இந்த ஜாதகத்தில் தனித்துச் சொல்லும்படியான யோகமோ தோஷமோ உருவாகவில்லை.",
                    "No yoga or dosham in this chart forms strongly enough to name.",
                    lang,
                ),
                body,
            )
        )
    return out


def _dasha_chapter(session: Session, chart_id: UUID, as_of: date, chapter_style, body, lang: str) -> list:
    """The mahadasha sequence, then the bhuktis inside the running one."""
    timeline = get_chart_dasha(session, chart_id, as_of, level="maha,antar")
    maha_rows = [r for r in timeline.data.timeline if r.get("level") == "maha"]
    antar_rows = [r for r in timeline.data.timeline if r.get("level") == "antar"]

    out = _chapter_heading("ch_dasha", chapter_style, lang)
    current = timeline.data.current
    out.append(
        Paragraph(
            f"<b>{_label('mahadasha', lang)}:</b> {_graha(current.mahadasha.lord, lang)} "
            f"({current.mahadasha.start_date} – {current.mahadasha.end_date})<br/>"
            f"<b>{_label('antardasha', lang)}:</b> {_graha(current.antardasha.lord, lang)} "
            f"({current.antardasha.start_date} – {current.antardasha.end_date})<br/>"
            f"<b>{_label('pratyantar', lang)}:</b> "
            f"{_graha(current.pratyantardasha.lord, lang)} "
            f"({current.pratyantardasha.start_date} – {current.pratyantardasha.end_date})",
            body,
        )
    )
    out.append(Spacer(1, 0.25 * cm))

    rows = [[_label("mahadasha", lang), _t("period", lang)]]
    for row in maha_rows:
        rows.append(
            [_graha(str(row["lord"]), lang), f"{row['startDate']} – {row['endDate']}"]
        )
    out.append(_pdf_text_table(rows, [_CONTENT_W * 0.34, _CONTENT_W * 0.66], lang))

    if antar_rows:
        out.append(Spacer(1, 0.3 * cm))
        rows = [[_label("antardasha", lang), _t("period", lang)]]
        for row in antar_rows:
            rows.append(
                [_graha(str(row["lord"]), lang), f"{row['startDate']} – {row['endDate']}"]
            )
        out.append(_pdf_text_table(rows, [_CONTENT_W * 0.34, _CONTENT_W * 0.66], lang))
    return out


def _windows_chapter(
    session: Session,
    snapshot,
    profile: BirthProfile,
    as_of: date,
    chapter_style,
    body,
    caption,
    lang: str,
) -> list:
    """Career, finance and — only when the gate allows it — marriage.

    The gate is `age_gate.marriage_timing_gate`, the same one
    `GET /charts/{id}/event-windows` reads. A printed document is the worst
    place to get this wrong: it cannot be taken back once it is downloaded.
    """
    out = _chapter_heading("ch_windows", chapter_style, lang)

    moon = next((p for p in snapshot.data.planets if p.graha == "MOON"), None)
    if moon is None:
        return []
    chart_data = ChartData(
        lagna_rasi=snapshot.data.lagna.rasi,
        moon_longitude=float(moon.absolute_longitude),
        birth_jd=float(snapshot.data.julian_day),
    )

    gate = marriage_timing_gate(
        birth_date=profile.birth_date_local,
        marital_status=profile.marital_status,
        relationship_to_owner=resolve_relationship_to_owner(session, profile),
        as_of=as_of,
    )

    events: list[EventType] = ["CAREER", "FINANCE"]
    if gate.hard_blocked:
        out.append(Paragraph(_t("marriage_withheld", lang), caption))
    else:
        events.insert(0, "MARRIAGE")
        if gate.age_gated:
            out.append(Paragraph(_t("marriage_reframed", lang), caption))

    note_lang = _normalize_lang(lang)
    for event in events:
        out.append(Spacer(1, 0.25 * cm))
        out.append(Paragraph(f"<b>{_t(f'event_{event}', lang)}</b>", body))
        windows = find_event_windows(chart_data, event, as_of.year, as_of.year + _WINDOW_YEARS)
        if not windows:
            out.append(Paragraph(_t("no_windows", lang), caption))
            continue
        rows = [[_t("period", lang), _t("score", lang), _t("reasons", lang)]]
        for window in windows:
            reasons = "; ".join(
                getattr(reason_bitext(key), note_lang) for key in window.reasons
            )
            rows.append(
                [
                    f"{window.start_date} – {window.end_date}",
                    str(window.score),
                    reasons or "—",
                ]
            )
        out.append(
            _pdf_text_table(
                rows, [_CONTENT_W * 0.26, _CONTENT_W * 0.1, _CONTENT_W * 0.64], lang
            )
        )
    return out


def _now_chapter(report_data, chapter_style, body, lead, bullet, lang: str) -> list:
    note_lang = _normalize_lang(lang)
    out = _chapter_heading("ch_now", chapter_style, lang)
    year_text = report_data.current_year_guidance.get(note_lang) or ""
    if year_text:
        out.append(Paragraph(year_text, lead))

    if report_data.primary_concerns:
        out += [Spacer(1, 0.25 * cm), Paragraph(f"<b>{_t('concerns', lang)}</b>", body)]
        for concern in report_data.primary_concerns:
            rationale = concern.rationale_ta if note_lang == "ta" else concern.rationale_en
            out.append(Paragraph(f"&bull;&nbsp; {rationale}", bullet))

    areas = report_data.age_wise_timeline.active_focus_areas
    if areas:
        out += [
            Spacer(1, 0.2 * cm),
            Paragraph(
                f"<b>{_t('focus_areas', lang)}:</b> "
                + ", ".join(_area_word(area, lang) for area in areas),
                body,
            ),
        ]
    return out


def _guidance_chapter(report_data, chapter_style, bullet, lang: str) -> list:
    note_lang = _normalize_lang(lang)
    items = report_data.practical_guidance.get(note_lang) or []
    if not items:
        return []
    return _chapter_heading("ch_guidance", chapter_style, lang) + _bullets(items, bullet)


def _parihaaram_chapter(
    session: Session, chart_id: UUID, snapshot, as_of: date, chapter_style, body, caption, bullet, lang: str
) -> list:
    """The written parihāram chapter — the chapter the free sheets do not have.

    Selected the same way `GET /charts/{id}/remedy-plan` selects it, so the
    document and the app never name different planets. Naming a dosham and
    charging to see what to do about it is not what is being sold here (owner
    ruling 2026-11-04): the daily pariharam line stays free everywhere. What is
    sold is the written chapter — the temple, the day, the japa count, the
    daanam and the conduct, set out in order of priority.
    """
    note_lang = _normalize_lang(lang)
    moon = next((p for p in snapshot.data.planets if p.graha == "MOON"), None)
    if moon is None:
        return []
    lagna_rasi = snapshot.data.lagna.rasi
    as_of_jd = utc_datetime_to_julian_day(datetime.combine(as_of, datetime.min.time(), tzinfo=UTC))
    timeline = calculate_vimshottari_timeline(
        snapshot.data.julian_day, moon.absolute_longitude, as_of_jd
    )
    focus = select_remedy_focus(
        lagna_rasi=lagna_rasi,
        planet_strengths=[
            (p.graha, int(getattr(p, "strength_score", 0) or 50)) for p in snapshot.data.planets
        ],
        current_maha_lord=timeline.current_mahadasha.lord,
        active_dosham_planet=active_dosham_planet(snapshot.data.doshams, lagna_rasi),
    )

    out = _chapter_heading("ch_parihaaram", chapter_style, lang)
    for index, planet in enumerate(focus.ordered, start=1):
        nature = get_functional_nature(lagna_rasi, planet)
        remedy = get_remedy(planet, nature, "SEVERE")
        out.append(Spacer(1, 0.25 * cm))
        out.append(
            Paragraph(f"<b>{index}. {_graha(planet, lang)}</b>", body)
        )
        rows = [
            [_t("day", lang), str(remedy.get("day") or "—")],
            [
                _t("temple", lang),
                str(remedy.get("temple_ta" if note_lang == "ta" else "temple_en") or "—"),
            ],
            [_t("mantra", lang), str(remedy.get("mantra_full_ta") or "—")],
            [_t("japa", lang), str(remedy.get("japa_count") or "—")],
            [
                _t("daanam", lang),
                str(remedy.get("daanam_items_ta" if note_lang == "ta" else "daanam_items_en") or "—"),
            ],
            [
                _t("seva", lang),
                str(remedy.get("seva_ta" if note_lang == "ta" else "seva_en") or "—"),
            ],
            [
                _t("conduct", lang),
                str(
                    remedy.get("behavioural_ta" if note_lang == "ta" else "behavioural_en")
                    or "—"
                ),
            ],
        ]
        out.append(_pdf_text_table(rows, [_CONTENT_W * 0.22, _CONTENT_W * 0.78], lang))

    disclaimer = remedy_disclaimer()
    out.append(Spacer(1, 0.3 * cm))
    out.append(Paragraph(disclaimer[f"fasting_caution_{note_lang}"], caption))
    out.append(Paragraph(disclaimer[f"guarantee_note_{note_lang}"], caption))
    return out


def compose_jadhagam_report_pdf(
    session: Session,
    chart_id: UUID,
    profile: BirthProfile,
    *,
    as_of: date,
    lang: str = "en",
) -> tuple[bytes, str]:
    """Render the paid Jadhagam report. Returns (pdf bytes, document title).

    The caller owns authorisation and the payment; this function only writes.
    """
    import io

    lang = _normalize_lang(lang)
    report = get_jadhagam_report(session, chart_id).data
    snapshot = load_persisted_chart_response(session, chart_id)

    title_style, chapter_style, body, caption, lead, bullet = _report_styles(lang)
    running = _t("jadhagam_title", lang)
    doc_title = f"{running} — {report.birth_profile.display_name}"

    story: list = [
        Paragraph(running, title_style),
        Paragraph(f"<b>{report.birth_profile.display_name}</b>", lead),
        Paragraph(
            f"{_label('birth_date', lang)}: {report.birth_profile.birth_date_local} &nbsp;&nbsp; "
            f"{_label('time', lang)}: {_clock(report.birth_profile.birth_time_local, lang)}",
            body,
        ),
        Paragraph(
            f"{_label('place', lang)}: {report.birth_profile.birth_place} &nbsp;&nbsp; "
            f"{_t('age', lang)}: {report.birth_profile.current_age}",
            body,
        ),
        Paragraph(
            f"{_t('as_of', lang)}: {as_of.isoformat()} &nbsp;&nbsp; "
            f"{_t('built_from', lang)}: {snapshot.data.calculation_version}",
            caption,
        ),
        Spacer(1, 0.2 * cm),
        Paragraph(_t("advisory", lang), caption),
    ]

    story += [Spacer(1, 0.2 * cm), *_identity_chapter(report, snapshot, chapter_style, lead, body, lang)]
    story += [PageBreak()]
    story += _section_planets(snapshot, chapter_style, lang)
    story += [Spacer(1, 0.3 * cm), *_navamsam_chapter(report, chapter_style, lang)]
    story += [PageBreak(), *_strength_chapter(report, chapter_style, body, lang)]
    story += [Spacer(1, 0.3 * cm), *_adhipathi_chapter(report, chapter_style, body, lang)]
    story += [PageBreak(), *_yoga_chapter(report, chapter_style, body, lang)]
    story += [
        PageBreak(),
        *_dasha_chapter(session, chart_id, as_of, chapter_style, body, lang),
    ]
    story += [
        PageBreak(),
        *_windows_chapter(session, snapshot, profile, as_of, chapter_style, body, caption, lang),
    ]
    story += [PageBreak(), *_now_chapter(report, chapter_style, body, lead, bullet, lang)]
    story += [Spacer(1, 0.3 * cm), *_guidance_chapter(report, chapter_style, bullet, lang)]
    story += [
        PageBreak(),
        *_parihaaram_chapter(
            session, chart_id, snapshot, as_of, chapter_style, body, caption, bullet, lang
        ),
    ]
    story += [Spacer(1, 0.4 * cm), Paragraph(_t("advisory", lang), caption)]

    buf = io.BytesIO()
    doc = _document(buf, title=doc_title)
    draw = _footer(lang, running)
    doc.build(story, onFirstPage=draw, onLaterPages=draw)
    return buf.getvalue(), doc_title


# ── The Porutham report ──────────────────────────────────────────────────────


def _porutham_verdict_chapter(porutham, chapter_style, lead, body, caption, lang: str) -> list:
    percentage = round((porutham.total_score / max(1, porutham.max_score)) * 100)
    out = _chapter_heading("ch_verdict", chapter_style, lang)
    out.append(
        Paragraph(
            f"<b>{porutham.total_score} / {porutham.max_score}</b> &nbsp; "
            f"({percentage}%) — {_verdict('porutham', porutham.label, lang)}",
            lead,
        )
    )
    summary = getattr(porutham.summary, _normalize_lang(lang), None) or getattr(
        porutham.summary, "en", ""
    )
    if summary:
        out.append(Paragraph(summary, body))

    # The two vetoes, then the two disclosures (F-POR-02, F-POR-03) — in that
    # order, because a disclosure read as a third veto changes the verdict.
    if porutham.rajju_dosha:
        out.append(Paragraph(_label("warning_rajju", lang), body))
    if porutham.vedha_dosha:
        out.append(Paragraph(_label("warning_vedha", lang), body))
    for disclosure in (porutham.eka_nakshatra, porutham.shashtashtaka):
        if disclosure is not None and disclosure.present:
            label = getattr(disclosure.label, _normalize_lang(lang), "") or getattr(
                disclosure.label, "en", ""
            )
            note = getattr(disclosure.note, _normalize_lang(lang), "") or getattr(
                disclosure.note, "en", ""
            )
            if label:
                out.append(Paragraph(label, body))
            if note:
                out.append(Paragraph(note, caption))
    if porutham.context_note is not None:
        note = getattr(porutham.context_note, _normalize_lang(lang), "") or ""
        if note:
            out.append(Paragraph(note, caption))
    out += [Spacer(1, 0.2 * cm), Paragraph(_t("advice_only_match", lang), caption)]
    return out


def _porutham_factors_chapter(porutham, chapter_style, lang: str) -> list:
    rows = [[_label("factor", lang), _label("score", lang), _t("max", lang), _label("result", lang)]]
    for kuta in porutham.kutas:
        pct = round((kuta.score / max(1, kuta.max_score)) * 100)
        result = (
            _label("good", lang)
            if pct >= 70
            else _label("balanced", lang)
            if pct >= 40
            else _label("caution", lang)
        )
        rows.append(
            [
                kuta.name_ta if _normalize_lang(lang) == "ta" else kuta.name,
                str(kuta.score),
                str(kuta.max_score),
                result,
            ]
        )
    return _chapter_heading("ch_factors", chapter_style, lang) + [
        _pdf_text_table(
            rows,
            [_CONTENT_W * 0.46, _CONTENT_W * 0.14, _CONTENT_W * 0.14, _CONTENT_W * 0.26],
            lang,
        )
    ]


def _porutham_layers_chapter(report, chapter_style, body, lang: str) -> list:
    """Levels 2–8 of the compatibility engine: the 7th house and Venus, the
    navamsam, Sevvai, dasha alignment, emotional fit and synastry."""
    note_lang = _normalize_lang(lang)
    out = _chapter_heading("ch_layers", chapter_style, lang)

    rows = [[_t("layer", lang), _label("score", lang), _t("max", lang)]]
    breakdown = report.score_breakdown
    for name, value, maximum in (
        (_label("porutham_level", lang), breakdown.porutham, 20),
        (_label("chart_strength_level", lang), breakdown.seventh_house, 20),
        (_label("navamsa_level", lang), breakdown.navamsa, 20),
        (_label("dasha_level", lang), breakdown.dasha_harmony, 15),
        (_label("sevvai_level", lang), breakdown.dosham_analysis, 10),
        (_label("emotional_level", lang), breakdown.emotional, 10),
        (_label("synastry_level", lang), breakdown.synastry, 5),
    ):
        rows.append([name, str(value), str(maximum)])
    out.append(
        _pdf_text_table(
            rows, [_CONTENT_W * 0.58, _CONTENT_W * 0.21, _CONTENT_W * 0.21], lang
        )
    )

    out.append(Spacer(1, 0.3 * cm))
    out.append(Paragraph(f"<b>{_label('chart_strength_level', lang)}</b>", body))
    for name, strength in (
        (report.person_a_name, report.chart_a_strength),
        (report.person_b_name, report.chart_b_strength),
    ):
        out.append(Paragraph(f"{name}: {getattr(strength, f'note_{note_lang}')}", body))

    out.append(Spacer(1, 0.25 * cm))
    out.append(Paragraph(f"<b>{_label('navamsa_level', lang)}</b>", body))
    out.append(
        Paragraph(
            f"{_label('harmony', lang)}: "
            f"{_verdict('harmony', report.navamsa.harmony_label, lang)}. "
            f"{report.person_a_name} — {_graha('VENUS', lang)} D9: "
            f"{_rasi(report.navamsa.person_a_venus_d9, lang)}; "
            f"{report.person_b_name} — {_graha('VENUS', lang)} D9: "
            f"{_rasi(report.navamsa.person_b_venus_d9, lang)}.",
            body,
        )
    )
    out.append(Paragraph(getattr(report.navamsa, f"note_{note_lang}"), body))

    out.append(Spacer(1, 0.25 * cm))
    out.append(Paragraph(f"<b>{_label('sevvai_level', lang)}</b>", body))
    rows = [
        [
            _t("person", lang),
            _t("dosham", lang),
            _t("cancelled", lang),
            _t("severity", lang),
        ]
    ]
    for name, detail in (
        (report.person_a_name, report.sevvai_a),
        (report.person_b_name, report.sevvai_b),
    ):
        rows.append(
            [
                name,
                _label("yes", lang) if detail.has_dosham else _label("no", lang),
                _label("yes", lang) if detail.is_cancelled else _label("no", lang),
                _verdict("dosham_severity", detail.severity, lang),
            ]
        )
    out.append(
        _pdf_text_table(
            rows,
            [_CONTENT_W * 0.34, _CONTENT_W * 0.2, _CONTENT_W * 0.22, _CONTENT_W * 0.24],
            lang,
        )
    )
    for name, detail in (
        (report.person_a_name, report.sevvai_a),
        (report.person_b_name, report.sevvai_b),
    ):
        out.append(Paragraph(f"{name}: {getattr(detail, f'note_{note_lang}')}", body))

    out.append(Spacer(1, 0.25 * cm))
    out.append(Paragraph(f"<b>{_label('dasha_level', lang)}</b>", body))
    harmony = report.dasha_harmony
    out.append(
        Paragraph(
            f"{report.person_a_name}: {_graha(harmony.person_a_maha_lord, lang)} / "
            f"{_graha(harmony.person_a_antar_lord, lang)} "
            f"({_label('ends', lang)} {harmony.person_a_maha_end}). "
            f"{report.person_b_name}: {_graha(harmony.person_b_maha_lord, lang)} / "
            f"{_graha(harmony.person_b_antar_lord, lang)} "
            f"({_label('ends', lang)} {harmony.person_b_maha_end}).",
            body,
        )
    )
    out.append(
        Paragraph(
            f"{_label('harmony', lang)}: "
            f"{_verdict('harmony', harmony.harmony_label, lang)}",
            body,
        )
    )
    out.append(Paragraph(getattr(harmony, f"note_{note_lang}"), body))

    out.append(Spacer(1, 0.25 * cm))
    out.append(Paragraph(f"<b>{_label('emotional_level', lang)}</b>", body))
    out.append(
        Paragraph(
            f"{_graha('MOON', lang)}: "
            f"{_verdict('harmony', report.emotional.moon_moon_harmony, lang)}. "
            f"{_graha('VENUS', lang)}: "
            f"{_verdict('harmony', report.emotional.venus_mars_harmony, lang)}.",
            body,
        )
    )
    out.append(Paragraph(getattr(report.emotional, f"note_{note_lang}"), body))
    communication = (
        report.emotional.communication_note_ta
        if note_lang == "ta"
        else report.emotional.communication_note
    )
    if communication:
        out.append(Paragraph(f"{_label('communication_note', lang)}: {communication}", body))

    out.append(Spacer(1, 0.25 * cm))
    out.append(Paragraph(f"<b>{_label('synastry_level', lang)}</b>", body))
    out.append(Paragraph(f"{_label('synastry_score', lang)}: {report.synastry_score}/100", body))
    return out


def _porutham_notes_chapter(report, chapter_style, body, bullet, lang: str) -> list:
    note_lang = _normalize_lang(lang)
    strengths = report.strengths_ta if note_lang == "ta" else report.strengths_en
    risks = report.risks_ta if note_lang == "ta" else report.risks_en
    if not strengths and not risks:
        return []
    out = _chapter_heading("ch_notes", chapter_style, lang)
    if strengths:
        out.append(Paragraph(f"<b>{_label('strengths', lang)}</b>", body))
        out += _bullets(list(strengths), bullet)
    if risks:
        out.append(Spacer(1, 0.2 * cm))
        out.append(Paragraph(f"<b>{_label('areas_to_watch', lang)}</b>", body))
        out += _bullets(list(risks), bullet)
    return out


def compose_porutham_report_pdf(
    session: Session,
    owner_user_id: UUID,
    chart_id_a: UUID,
    chart_id_b: UUID,
    *,
    lang: str = "en",
    compatibility_context: str = "MARRIAGE",
    as_of: date | None = None,
) -> tuple[bytes, str]:
    """Render the paid Porutham report. Returns (pdf bytes, document title).

    `compare_charts_direct` already refuses a chart the user does not own, so
    the ownership check is not repeated here — but the caller still does it, so
    a failure is a 404 before any money moves.
    """
    import io

    lang = _normalize_lang(lang)
    as_of = as_of or datetime.now(tz=UTC).date()

    porutham = compare_charts_direct(
        session,
        owner_user_id,
        chart_id_a,
        chart_id_b,
        compatibility_context=compatibility_context,
    ).data
    snap_a = load_persisted_chart_response(session, chart_id_a)
    snap_b = load_persisted_chart_response(session, chart_id_b)
    intelligence = build_compatibility_intelligence_from_snapshots(snap_a, snap_b).data

    name_a = snap_a.data.birth_profile.display_name
    name_b = snap_b.data.birth_profile.display_name
    dasha_a = get_chart_dasha_from_snapshot(snap_a, as_of, level="antar").data
    dasha_b = get_chart_dasha_from_snapshot(snap_b, as_of, level="antar").data

    title_style, chapter_style, body, caption, lead, bullet = _report_styles(lang)
    running = _t("porutham_title", lang)
    doc_title = f"{running} — {name_a} / {name_b}"

    story: list = [
        Paragraph(running, title_style),
        Paragraph(f"<b>{name_a}</b> &nbsp;·&nbsp; <b>{name_b}</b>", lead),
        Paragraph(
            f"{_label('context', lang)}: "
            f"{_t('ctx_' + porutham.compatibility_context, lang) if ('ctx_' + porutham.compatibility_context) in _R else porutham.compatibility_context}",
            body,
        ),
        Paragraph(f"{_t('as_of', lang)}: {as_of.isoformat()}", caption),
        Spacer(1, 0.2 * cm),
        Paragraph(_t("advisory", lang), caption),
    ]

    identity = _section_couple_identity(
        name_a, snap_a.data, dasha_a, name_b, snap_b.data, dasha_b, chapter_style, body, lang
    )
    if identity:
        story += [Spacer(1, 0.25 * cm), *identity]

    story += [PageBreak(), *_porutham_verdict_chapter(porutham, chapter_style, lead, body, caption, lang)]
    story += [Spacer(1, 0.35 * cm), *_porutham_factors_chapter(porutham, chapter_style, lang)]
    story += [PageBreak(), *_porutham_layers_chapter(intelligence, chapter_style, body, lang)]
    story += [PageBreak(), *_porutham_notes_chapter(intelligence, chapter_style, body, bullet, lang)]
    story += [Spacer(1, 0.4 * cm), Paragraph(_t("advice_only_match", lang), caption)]

    buf = io.BytesIO()
    doc = _document(buf, title=doc_title)
    draw = _footer(lang, running)
    doc.build(story, onFirstPage=draw, onLaterPages=draw)
    return buf.getvalue(), doc_title
