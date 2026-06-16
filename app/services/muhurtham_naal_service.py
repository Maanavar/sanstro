"""Muhurtham-naal listing + personal (chart-matched) ranking.

The list of muhurtham dates is curated from a published almanac (see
``app.data.muhurtham_naals``) — NOT from our broad ``is_subha_muhurtham``
flag, which over-reports. On top of that universally-auspicious list we apply
the standard Thirukanitham personalisation used to pick a *personal* wedding
date from a published list:

1. **Chandrashtama (hard avoid).** If the Moon's rasi on the muhurtham day is
   the 8th rasi from the person's birth Moon rasi, the day is Chandrashtama for
   them and is dropped from recommendations.

2. **Tara Bala (9-fold star strength).** Counting from the person's birth star
   to the muhurtham-day star gives one of nine taras. Sampat / Kshema /
   Sadhana / Mitra / Parama-Mitra are favourable; Vipat / Pratyari / Naidhana
   are avoided; Janma (own star) is neutral.

Days that are favourable by Tara Bala and free of Chandrashtama are surfaced as
"best matches" for the chart; the rest are still returned, annotated, so the UI
can show the full picture.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import (
    chandrashtama_rasi_from_janma,
    resolve_rasi,
)
from app.calculations.panchangam import (
    NAKSHATRA_NAMES,
    NALLA_NERAM_SUMMARY_TABLE,
    WEEKDAY_NAMES,
)
from app.calculations.tamil_calendar import TAMIL_MONTHS
from app.data.muhurtham_naals import (
    MUHURTHAM_SOURCE,
    MuhurthamNaal,
    available_years,
    get_muhurtham_naals,
)
from app.models import Chart

logger = logging.getLogger(__name__)

# Tamil names for the 27 nakshatras, aligned to panchangam.NAKSHATRA_NAMES order.
NAKSHATRA_TA: tuple[str, ...] = (
    "அசுவினி", "பரணி", "கார்த்திகை", "ரோகிணி", "மிருகசீரிடம்", "திருவாதிரை",
    "புனர்பூசம்", "பூசம்", "ஆயில்யம்", "மகம்", "பூரம்", "உத்திரம்", "ஹஸ்தம்",
    "சித்திரை", "சுவாதி", "விசாகம்", "அனுசம்", "கேட்டை", "மூலம்", "பூராடம்",
    "உத்திராடம்", "திருவோணம்", "அவிட்டம்", "சதயம்", "பூரட்டாதி", "உத்திரட்டாதி",
    "ரேவதி",
)

WEEKDAY_TA = {
    "MONDAY": "திங்கள்", "TUESDAY": "செவ்வாய்", "WEDNESDAY": "புதன்",
    "THURSDAY": "வியாழன்", "FRIDAY": "வெள்ளி", "SATURDAY": "சனி", "SUNDAY": "ஞாயிறு",
}

PIRAI_LABEL = {
    "VALARPIRAI": ("வளர்பிறை", "Valarpirai (waxing)"),
    "THEIPIRAI": ("தேய்பிறை", "Theipirai (waning)"),
}

# 9-fold Tara names (Tamil, English) keyed by tara number 1..9.
TARA_NAMES: dict[int, tuple[str, str]] = {
    1: ("ஜென்மம்", "Janma"),
    2: ("சம்பத்", "Sampat"),
    3: ("விபத்", "Vipat"),
    4: ("க்ஷேமம்", "Kshema"),
    5: ("பிரத்யரி", "Pratyari"),
    6: ("சாதனை", "Sadhana"),
    7: ("நைதனம்", "Naidhana"),
    8: ("மித்திரம்", "Mitra"),
    9: ("பரம மித்திரம்", "Parama Mitra"),
}

# Quality bucket + base contribution for each tara.
TARA_QUALITY: dict[int, str] = {
    1: "NEUTRAL", 2: "GOOD", 3: "AVOID", 4: "GOOD", 5: "AVOID",
    6: "GOOD", 7: "AVOID", 8: "GOOD", 9: "GOOD",
}
TARA_SCORE: dict[int, int] = {
    1: 8, 2: 30, 3: -30, 4: 22, 5: -25, 6: 24, 7: -35, 8: 26, 9: 28,
}
TARA_MEANING: dict[int, tuple[str, str]] = {
    1: ("சொந்த நட்சத்திரம் — நடுநிலை", "your own star — neutral"),
    2: ("செல்வம் சேர்க்கும்", "brings wealth"),
    3: ("ஆபத்து — தவிர்க்கவும்", "danger — avoid"),
    4: ("நலன் தரும்", "brings well-being"),
    5: ("தடைகள் — தவிர்க்கவும்", "obstacles — avoid"),
    6: ("செயல் வெற்றி தரும்", "supports achievement"),
    7: ("கேடு — தவிர்க்கவும்", "harmful — avoid"),
    8: ("நட்பு தரும்", "friendly and supportive"),
    9: ("மிகச் சிறந்த நட்பு", "best friendly star"),
}

CALCULATION_VERSION = "muhurtham-naal-v1"


# ── data shapes returned to the API layer ──────────────────────────────────
@dataclass(frozen=True, slots=True)
class BiLabel:
    ta: str
    en: str


@dataclass(frozen=True, slots=True)
class TimeWindow:
    start: str  # HH:MM
    end: str    # HH:MM
    period: str  # "AM" | "PM"


@dataclass(frozen=True, slots=True)
class MuhurthamNaalView:
    date: str
    weekday: BiLabel
    pirai: BiLabel
    tamil_month: BiLabel
    tamil_day: int
    nakshatra: BiLabel
    tithi_number: int
    paksha: str
    nalla_neram: list[TimeWindow]


@dataclass(frozen=True, slots=True)
class MuhurthamNaalMatch:
    naal: MuhurthamNaalView
    tara_number: int
    tara_name: BiLabel
    tara_quality: str            # GOOD | NEUTRAL | AVOID
    is_chandrashtama: bool
    is_recommended: bool
    match_score: int             # 0..100
    reasons: list[BiLabel]


def _nalla_neram_windows(weekday: str) -> list[TimeWindow]:
    weekday_index = WEEKDAY_NAMES.index(weekday)
    out: list[TimeWindow] = []
    for start_min, end_min, period in NALLA_NERAM_SUMMARY_TABLE[weekday_index]:
        out.append(
            TimeWindow(
                start=f"{start_min // 60:02d}:{start_min % 60:02d}",
                end=f"{end_min // 60:02d}:{end_min % 60:02d}",
                period=period,
            )
        )
    return out


def _to_view(n: MuhurthamNaal) -> MuhurthamNaalView:
    pirai_ta, pirai_en = PIRAI_LABEL[n.pirai]
    month_ta, month_en = TAMIL_MONTHS[n.tamil_month_index]
    return MuhurthamNaalView(
        date=n.date.isoformat(),
        weekday=BiLabel(ta=WEEKDAY_TA[n.weekday], en=n.weekday.title()),
        pirai=BiLabel(ta=pirai_ta, en=pirai_en),
        tamil_month=BiLabel(ta=month_ta, en=month_en),
        tamil_day=n.tamil_day,
        nakshatra=BiLabel(ta=NAKSHATRA_TA[n.nakshatra_number - 1], en=n.nakshatra_name.title()),
        tithi_number=n.tithi_number,
        paksha=n.paksha,
        nalla_neram=_nalla_neram_windows(n.weekday),
    )


def list_muhurtham_naals(
    year: int,
    *,
    month: int | None = None,
    pirai: str | None = None,
    weekday: str | None = None,
    nakshatra: str | None = None,
) -> list[MuhurthamNaalView]:
    """Curated muhurtham naals for a year, optionally filtered.

    Raises 404 if no almanac sheet has been sourced for the year.
    """
    naals = get_muhurtham_naals(year)
    if not naals:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No muhurtham naals published for {year}. "
                f"Available years: {available_years()}"
            ),
        )

    pirai_norm = pirai.upper() if pirai else None
    weekday_norm = weekday.upper() if weekday else None
    nak_norm = nakshatra.upper() if nakshatra else None

    out: list[MuhurthamNaalView] = []
    for n in naals:
        if month is not None and n.date.month != month:
            continue
        if pirai_norm is not None and n.pirai != pirai_norm:
            continue
        if weekday_norm is not None and n.weekday != weekday_norm:
            continue
        if nak_norm is not None and n.nakshatra_name != nak_norm:
            continue
        out.append(_to_view(n))
    return out


def _tara_number(janma_nakshatra: int, day_nakshatra: int) -> int:
    count = ((day_nakshatra - janma_nakshatra) % 27) + 1
    return ((count - 1) % 9) + 1


def _resolve_janma(session: Session, chart_id: UUID) -> tuple[int, int, str]:
    """Return (janma_nakshatra_number, janma_rasi_number, janma_nakshatra_name)."""
    chart_row = session.get(Chart, chart_id)
    if chart_row is None:
        raise HTTPException(status_code=404, detail="Chart not found")
    janma_name = str(chart_row.janma_nakshatra or "").strip().upper()
    if janma_name not in NAKSHATRA_NAMES:
        raise HTTPException(
            status_code=422,
            detail=f"Chart has an unrecognised janma nakshatra: {chart_row.janma_nakshatra!r}",
        )
    janma_nak = NAKSHATRA_NAMES.index(janma_name) + 1
    try:
        janma_rasi = resolve_rasi(str(chart_row.moon_rasi))
    except ValueError as exc:
        raise HTTPException(
            status_code=422, detail=f"Invalid Moon rasi in chart: {chart_row.moon_rasi}"
        ) from exc
    return janma_nak, janma_rasi, janma_name


def match_muhurtham_naals(
    chart_id: UUID,
    year: int,
    session: Session,
    *,
    recommended_only: bool = False,
) -> tuple[list[MuhurthamNaalMatch], dict]:
    """Annotate the year's curated naals against a chart and rank them.

    Returns (matches_sorted_best_first, chart_context). Chandrashtama days and
    avoid-tara days are included but never marked recommended.
    """
    naals = get_muhurtham_naals(year)
    if not naals:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No muhurtham naals published for {year}. "
                f"Available years: {available_years()}"
            ),
        )

    janma_nak, janma_rasi, janma_name = _resolve_janma(session, chart_id)
    chandra_rasi = chandrashtama_rasi_from_janma(janma_rasi)
    janma_star_ta = NAKSHATRA_TA[janma_nak - 1]
    janma_star_en = janma_name.title()

    matches: list[MuhurthamNaalMatch] = []
    for n in naals:
        tara = _tara_number(janma_nak, n.nakshatra_number)
        quality = TARA_QUALITY[tara]
        is_chandra = n.moon_rasi_number == chandra_rasi
        tara_ta, tara_en = TARA_NAMES[tara]
        mean_ta, mean_en = TARA_MEANING[tara]

        score = 50 + TARA_SCORE[tara]
        reasons: list[BiLabel] = []

        day_star_ta = NAKSHATRA_TA[n.nakshatra_number - 1]
        reasons.append(BiLabel(
            ta=f"உங்கள் நட்சத்திரம் {janma_star_ta}லிருந்து {day_star_ta} {tara_ta} தாரா — {mean_ta}",
            en=f"{tara_en} tara ({n.nakshatra_name.title()}) from your star {janma_star_en} — {mean_en}",
        ))

        if is_chandra:
            score -= 40
            reasons.append(BiLabel(
                ta="இந்நாளில் சந்திரன் உங்கள் ஜென்ம ராசிக்கு 8ல் — சந்திராஷ்டமம், தவிர்க்கவும்",
                en="Moon is in the 8th from your birth sign — Chandrashtama for you, avoid",
            ))
        else:
            reasons.append(BiLabel(
                ta="சந்திராஷ்டம தோஷம் இல்லை",
                en="No Chandrashtama for your sign",
            ))

        score = max(0, min(100, score))
        is_recommended = quality == "GOOD" and not is_chandra

        matches.append(MuhurthamNaalMatch(
            naal=_to_view(n),
            tara_number=tara,
            tara_name=BiLabel(ta=tara_ta, en=tara_en),
            tara_quality=quality,
            is_chandrashtama=is_chandra,
            is_recommended=is_recommended,
            match_score=score,
            reasons=reasons,
        ))

    # Best score first; ties broken by earliest date (ISO strings sort naturally).
    matches.sort(key=lambda m: (-m.match_score, m.naal.date))

    if recommended_only:
        matches = [m for m in matches if m.is_recommended]

    context = {
        "janma_nakshatra": BiLabel(ta=janma_star_ta, en=janma_star_en),
        "janma_rasi_number": janma_rasi,
        "chandrashtama_rasi_number": chandra_rasi,
        "recommended_count": sum(1 for m in matches if m.is_recommended),
        "total_count": len(naals),
        "source": MUHURTHAM_SOURCE,
    }
    return matches, context
