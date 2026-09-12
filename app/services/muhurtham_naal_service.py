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
from app.calculations.display_names import nakshatra_ta
from app.calculations.panchangam import (
    NAKSHATRA_NAMES,
    NALLA_NERAM_SUMMARY_TABLE,
    WEEKDAY_NAMES,
    calculate_daily_panchangam_range,
    own_chandrashtama_windows,
)
from app.calculations.tamil_calendar import TAMIL_MONTHS
from app.calculations.tara_bala import TARA_NAMES, TARA_SCORE, tara_number
from app.data.muhurtham_naals import (
    MUHURTHAM_SOURCE,
    MuhurthamNaal,
    available_years,
    get_muhurtham_naals,
)
from app.models import BirthProfile, Chart
from app.services.location_service import EffectiveDailyLocation, resolve_effective_daily_location

logger = logging.getLogger(__name__)

# The Tamil nakshatra names this module used to own now live in
# `calculations.display_names` — a second caller appeared (the one-minute
# reading) and one shared 1-indexed lookup beats two hand-copies.

WEEKDAY_TA = {
    "MONDAY": "திங்கள்", "TUESDAY": "செவ்வாய்", "WEDNESDAY": "புதன்",
    "THURSDAY": "வியாழன்", "FRIDAY": "வெள்ளி", "SATURDAY": "சனி", "SUNDAY": "ஞாயிறு",
}

PIRAI_LABEL = {
    "VALARPIRAI": ("வளர்பிறை", "Valarpirai (waxing)"),
    "THEIPIRAI": ("தேய்பிறை", "Theipirai (waning)"),
}

# Quality bucket + base contribution for each tara.
TARA_QUALITY: dict[int, str] = {
    1: "NEUTRAL", 2: "GOOD", 3: "AVOID", 4: "GOOD", 5: "AVOID",
    6: "GOOD", 7: "AVOID", 8: "GOOD", 9: "GOOD",
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


def _slot_windows(slots) -> list[TimeWindow]:
    """Turn computed, timezone-aware panchangam slots into the API clock shape."""
    return [
        TimeWindow(
            start=slot.start.strftime("%H:%M"),
            end=slot.end.strftime("%H:%M"),
            period=slot.period or ("AM" if slot.start.hour < 12 else "PM"),
        )
        for slot in slots
    ]


def _to_view(
    n: MuhurthamNaal,
    *,
    nalla_neram: list[TimeWindow] | None = None,
) -> MuhurthamNaalView:
    pirai_ta, pirai_en = PIRAI_LABEL[n.pirai]
    month_ta, month_en = TAMIL_MONTHS[n.tamil_month_index]
    return MuhurthamNaalView(
        date=n.date.isoformat(),
        weekday=BiLabel(ta=WEEKDAY_TA[n.weekday], en=n.weekday.title()),
        pirai=BiLabel(ta=pirai_ta, en=pirai_en),
        tamil_month=BiLabel(ta=month_ta, en=month_en),
        tamil_day=n.tamil_day,
        # `or` the English name: nakshatra_ta() returns None for a number
        # outside 1-27, and the same `<tamil> or <fallback>` shape is what
        # muhurta_engine uses for rasi labels.
        nakshatra=BiLabel(
            ta=nakshatra_ta(n.nakshatra_number) or n.nakshatra_name.title(),
            en=n.nakshatra_name.title(),
        ),
        tithi_number=n.tithi_number,
        paksha=n.paksha,
        nalla_neram=nalla_neram if nalla_neram is not None else _nalla_neram_windows(n.weekday),
    )


def _panchangam_by_date(
    naals: tuple[MuhurthamNaal, ...],
    location: EffectiveDailyLocation,
    session: Session,
):
    """One batched range call, shared by everything on this path that needs it.

    Split out from `_computed_nalla_neram_by_date` when the Chandrashtama
    reading started needing the same snapshots: two range calls over the same
    dates would double the ephemeris work and, worse, could disagree.
    """
    if not naals:
        return {}
    # `only` matters more than the range here. A curated sheet is ~55 dates
    # scattered over a year, so without it this fills every day in between —
    # ~360 computations to answer about 55, which the warm cache hid until a
    # cache-version bump made the whole year cold and the endpoint 502'd at the
    # proxy's 300 s limit.
    return calculate_daily_panchangam_range(
        min(n.date for n in naals),
        max(n.date for n in naals),
        location.latitude,
        location.longitude,
        location.timezone,
        session=session,
        only={n.date for n in naals},
    )


def _computed_nalla_neram_by_date(
    naals: tuple[MuhurthamNaal, ...],
    snapshots,
) -> dict[str, list[TimeWindow]]:
    """Compute actual Nalla Neram for a chart-aware curated-naal response.

    The public list intentionally remains a customary weekday table because it
    has no coordinates.  A chart match has an activity location, so returning
    that table there would mix personal date ranking with a date-free clock
    claim.  One batched range call lets the persisted panchangam cache satisfy
    repeat requests and keeps the calculation tied to the exact location.
    """
    return {
        n.date.isoformat(): _slot_windows(snapshots[n.date].nalla_neram)
        for n in naals
        if n.date in snapshots
    }


def _chart_daily_location(session: Session, chart_id: UUID) -> EffectiveDailyLocation | None:
    """Resolve the same current-or-birth daily location as the muhurta picker."""
    chart = session.get(Chart, chart_id)
    if chart is None:
        return None
    profile_id = getattr(chart, "birth_profile_id", None)
    if profile_id is None:
        return None
    profile = session.get(BirthProfile, profile_id)
    if profile is None:
        # Referential integrity makes this unreachable in production, but a
        # legacy/imported chart cannot truthfully claim a computed local time.
        logger.warning("Chart %s has no birth profile; retaining customary Nalla Neram", chart_id)
        return None
    return resolve_effective_daily_location(profile)


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
    """Backward-compatible alias for the shared calculation helper."""
    return tara_number(janma_nakshatra, day_nakshatra)


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
    janma_star_en = janma_name.title()
    janma_star_ta = nakshatra_ta(janma_nak) or janma_star_en
    location = _chart_daily_location(session, chart_id)
    snapshots = _panchangam_by_date(naals, location, session) if location is not None else {}
    nalla_neram_by_date = _computed_nalla_neram_by_date(naals, snapshots) if snapshots else {}
    # Does each date's Chandrashtamam touch THIS reader — their star and their
    # rasi — anywhere in the day? The overlap test the dashboard uses, not the
    # single star standing at sunrise: a sunrise reading drops a star whenever
    # its whole window falls between two sunrises, which would quietly clear a
    # date that is genuinely the reader's.
    #
    # The rasi half of the test matters for the nine straddling stars, whose
    # natives sit in two signs a fortnight apart in Chandrashtama; matching the
    # star name alone vetoed the wrong dates for one of the two halves.
    #
    # The bool pair is (the day could be read at all, it is the reader's). They
    # are not the same thing — a date with no snapshot must fall back, a date
    # with a snapshot and no match must not.
    chandra_own_by_date = {
        day: (
            bool(snapshot.chandrashtamam_janma_nakshatra_windows),
            bool(own_chandrashtama_windows(
                snapshot.chandrashtamam_janma_nakshatra_windows,
                janma_nakshatra=janma_nak,
                natal_moon_rasi=janma_rasi,
            )),
        )
        for day, snapshot in snapshots.items()
    }

    matches: list[MuhurthamNaalMatch] = []
    for n in naals:
        tara = _tara_number(janma_nak, n.nakshatra_number)
        quality = TARA_QUALITY[tara]
        # Owner ruling 2026-09-09: the star window vetoes, the rasi span
        # cautions. Picking a date is not the same act as reading today's
        # dashboard — a wedding is chosen once — so the wider rasi transit keeps
        # a voice here, but only the reader's OWN star window can knock a date
        # out of "recommended". Before this, all 2¼ days of the Moon's transit
        # were a hard veto, which marked three dates "Chandrashtama for you,
        # avoid" where the dashboard badged one.
        # See docs/CHANDRASHTAMA_SURFACE_DIVERGENCE_2026-09-09.md.
        day_readable, day_is_own = chandra_own_by_date.get(n.date, (False, False))
        in_chandra_rasi = n.moon_rasi_number == chandra_rasi
        if day_readable:
            is_chandra = day_is_own
        else:
            # No snapshot to name the stars (no activity location for this
            # chart, or a pre-v44 row). Fall back to the rasi reading rather
            # than silently clearing a date that may well be the reader's — the
            # fail-safe direction for an avoidance rule is toward the doctrine.
            is_chandra = in_chandra_rasi
        rasi_only_caution = in_chandra_rasi and not is_chandra
        tara_ta, tara_en = TARA_NAMES[tara]
        mean_ta, mean_en = TARA_MEANING[tara]

        score = 50 + TARA_SCORE[tara]
        reasons: list[BiLabel] = []

        day_star_ta = nakshatra_ta(n.nakshatra_number)
        reasons.append(BiLabel(
            ta=f"உங்கள் நட்சத்திரம் {janma_star_ta}லிருந்து {day_star_ta} {tara_ta} தாரா — {mean_ta}",
            en=f"{tara_en} tara ({n.nakshatra_name.title()}) from your star {janma_star_en} — {mean_en}",
        ))

        if is_chandra:
            score -= 40
            reasons.append(BiLabel(
                ta=f"இந்நாள் {janma_star_ta} நட்சத்திரத்திற்கு சந்திராஷ்டமம் — தவிர்க்கவும்",
                en=f"Chandrashtama for your star {janma_star_en} on this day — avoid",
            ))
        elif rasi_only_caution:
            score -= 10
            reasons.append(BiLabel(
                ta="சந்திரன் உங்கள் 8ஆம் ராசியில் உள்ளது, ஆனால் இந்நாள் வேறு நட்சத்திரத்திற்கு — லேசான கவனம் மட்டும்",
                en="The Moon is in your 8th sign, but the day belongs to another star — mild caution only",
            ))
        else:
            reasons.append(BiLabel(
                ta="உங்கள் நட்சத்திரத்திற்கு சந்திராஷ்டம தோஷம் இல்லை",
                en="No Chandrashtama for your star",
            ))

        score = max(0, min(100, score))
        is_recommended = quality == "GOOD" and not is_chandra

        matches.append(MuhurthamNaalMatch(
            naal=_to_view(n, nalla_neram=nalla_neram_by_date.get(n.date.isoformat())),
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
        "daily_location": (
            {
                "latitude": location.latitude,
                "longitude": location.longitude,
                "timezone": location.timezone,
                "source": location.source,
            }
            if location is not None
            else None
        ),
    }
    return matches, context
