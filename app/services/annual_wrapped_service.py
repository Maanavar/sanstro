from __future__ import annotations

from collections import Counter
from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.models.chart import Chart
from app.models.birth_profile import BirthProfile
from app.models.daily_score import DailyScore
from app.models.dasha_period import DashaPeriod
from app.models.journal_entry import JournalEntry
from app.schemas.annual_wrapped import (
    AnnualWrappedBiText,
    AnnualWrappedData,
    AnnualWrappedResponse,
    WrappedSlide,
)
from app.schemas.dasha import ResponseMeta
from app.services.chart_service import load_persisted_chart_response

_CALC_VERSION = "jothidam-formula-engine-v1.0-2026"

_PLANET_TA: dict[str, str] = {
    "SUN": "சூரியன்", "MOON": "சந்திரன்", "MARS": "செவ்வாய்",
    "MERCURY": "புதன்", "JUPITER": "குரு", "VENUS": "சுக்கிரன்",
    "SATURN": "சனி", "RAHU": "ராகு", "KETU": "கேது",
}

_SCORE_BAND_THRESHOLDS = {"high": 75, "good": 55, "neutral": 40}

_LIFE_AREA_TA: dict[str, str] = {
    "career": "தொழில்", "relationship": "உறவு", "health": "ஆரோக்கியம்",
    "spiritual": "ஆன்மீகம்", "financial": "நிதி", "exam": "கல்வி", "general": "பொதுவான",
}


def _meta() -> ResponseMeta:
    return ResponseMeta(calculationVersion=_CALC_VERSION, generatedAt=datetime.now(tz=UTC))


def _band(score: int) -> str:
    if score >= _SCORE_BAND_THRESHOLDS["high"]:
        return "high"
    if score >= _SCORE_BAND_THRESHOLDS["good"]:
        return "good"
    if score >= _SCORE_BAND_THRESHOLDS["neutral"]:
        return "neutral"
    return "caution"


def _accent(lord: str) -> str:
    colors = {
        "SUN": "#f59e0b", "MOON": "#93c5fd", "MARS": "#f87171", "MERCURY": "#34d399",
        "JUPITER": "#fbbf24", "VENUS": "#f0abfc", "SATURN": "#94a3b8",
        "RAHU": "#a78bfa", "KETU": "#6b7280",
    }
    return colors.get(lord, "#e5b84d")


def _build_slides(
    year: int,
    scores: list[DailyScore],
    dominant_lord: str,
    high_days: int,
    caution_days: int,
    avg_score: int,
    peak_score: int,
    peak_date: date | None,
    valley_score: int,
    valley_date: date | None,
    top_life_area: str | None,
) -> list[WrappedSlide]:
    slides: list[WrappedSlide] = []
    lord_ta = _PLANET_TA.get(dominant_lord, dominant_lord)

    # Slide 1 — opening year summary
    slides.append(WrappedSlide(
        slideId="overview",
        slideType="OVERVIEW",
        headline=AnnualWrappedBiText(
            ta=f"உங்கள் {year} — கிரகங்கள் கண்ணோட்டம்",
            en=f"Your {year} in Planetary Terms",
        ),
        body=AnnualWrappedBiText(
            ta=f"{len(scores)} நாட்கள் கண்காணிக்கப்பட்டன. சராசரி மதிப்பெண்: {avg_score}/100.",
            en=f"{len(scores)} days tracked. Average energy score: {avg_score}/100.",
        ),
        accentColor="#e5b84d",
        stat=f"{avg_score}/100",
    ))

    # Slide 2 — dominant dasha era
    slides.append(WrappedSlide(
        slideId="dasha_era",
        slideType="DASHA_ERA",
        headline=AnnualWrappedBiText(
            ta=f"{lord_ta} தசை காலம்",
            en=f"The {dominant_lord.title()} Era",
        ),
        body=AnnualWrappedBiText(
            ta=f"{year} ஆம் ஆண்டில் {lord_ta} தசை மிகவும் செல்வாக்கு மிக்கதாக இருந்தது.",
            en=f"{dominant_lord.title()} Dasha held the strongest influence over {year}.",
        ),
        accentColor=_accent(dominant_lord),
        stat=dominant_lord,
    ))

    # Slide 3 — peak day
    if peak_date is not None:
        slides.append(WrappedSlide(
            slideId="peak_day",
            slideType="PEAK",
            headline=AnnualWrappedBiText(
                ta="உங்கள் சிறந்த நாள்",
                en="Your Strongest Day",
            ),
            body=AnnualWrappedBiText(
                ta=f"{peak_date.strftime('%d %B %Y')} அன்று {peak_score}/100 மதிப்பெண் — ஆண்டின் உயர்ந்த நிலை.",
                en=f"{peak_date.strftime('%d %B %Y')} scored {peak_score}/100 — the year's energy peak.",
            ),
            accentColor="#4ade80",
            stat=f"{peak_score}/100",
        ))

    # Slide 4 — high-energy days count
    slides.append(WrappedSlide(
        slideId="high_days",
        slideType="STATS",
        headline=AnnualWrappedBiText(
            ta="சாதகமான நாட்கள்",
            en="Your High-Energy Days",
        ),
        body=AnnualWrappedBiText(
            ta=f"{year} இல் {high_days} நாட்கள் (75+) சாதகமான ஆற்றல் நிலை கொண்டிருந்தன.",
            en=f"You had {high_days} strong days (75+) across {year}.",
        ),
        accentColor="#a3e635",
        stat=f"{high_days} days",
    ))

    # Slide 5 — caution days
    if caution_days > 0:
        slides.append(WrappedSlide(
            slideId="caution_days",
            slideType="REFLECTION",
            headline=AnnualWrappedBiText(
                ta="அமைதி மற்றும் சிந்தனை நாட்கள்",
                en="Rest and Reflect Days",
            ),
            body=AnnualWrappedBiText(
                ta=f"{caution_days} நாட்கள் கவனத்துடன் இருக்க வேண்டியதாக இருந்தன — இவை சுத்திகரிப்பு காலங்கள்.",
                en=f"{caution_days} days called for extra care — these are refinement phases, not setbacks.",
            ),
            accentColor="#fbbf24",
            stat=f"{caution_days} days",
        ))

    # Slide 6 — top journalled life area (if any)
    if top_life_area and top_life_area != "general":
        area_ta = _LIFE_AREA_TA.get(top_life_area, top_life_area)
        slides.append(WrappedSlide(
            slideId="top_life_area",
            slideType="LIFE_AREA",
            headline=AnnualWrappedBiText(
                ta=f"{area_ta} உங்கள் முக்கியமான துறை",
                en=f"{top_life_area.title()} Was Your Focus Area",
            ),
            body=AnnualWrappedBiText(
                ta=f"{year} இல் {area_ta} தொடர்பான பதிவுகள் அதிகமாக இருந்தன.",
                en=f"Most of your journal entries in {year} centred on {top_life_area}.",
            ),
            accentColor="#38bdf8",
            stat=top_life_area.title(),
        ))

    # Slide 7 — closing / looking forward
    slides.append(WrappedSlide(
        slideId="closing",
        slideType="CLOSING",
        headline=AnnualWrappedBiText(
            ta=f"{year + 1} உங்களுக்காக காத்திருக்கிறது",
            en=f"What {year + 1} Holds for You",
        ),
        body=AnnualWrappedBiText(
            ta="கிரக நடனம் தொடர்கிறது. புதிய தசை ஆற்றல்கள் உங்கள் பயணத்தை வடிவமைக்கின்றன.",
            en="The planetary dance continues. New dasha energies are shaping your path forward.",
        ),
        accentColor="#e5b84d",
        stat=None,
    ))

    return slides


def compute_annual_wrapped(
    session: Session,
    chart_id: UUID,
    owner_user_id: UUID,
    year: int,
) -> AnnualWrappedResponse:
    # Verify ownership
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=404, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    year_start = date(year, 1, 1)
    year_end = date(year, 12, 31)

    # Query daily scores for the year
    scores: list[DailyScore] = list(session.execute(
        select(DailyScore)
        .where(
            DailyScore.birth_profile_id == chart.birth_profile_id,
            DailyScore.score_date >= year_start,
            DailyScore.score_date <= year_end,
        )
        .order_by(DailyScore.score_date)
    ).scalars().all())

    if not scores:
        raise HTTPException(status_code=404, detail=f"No score data found for year {year}.")

    raw_scores = [s.score for s in scores]
    avg_score = round(sum(raw_scores) / len(raw_scores))
    peak_score = max(raw_scores)
    valley_score = min(raw_scores)
    peak_entry = next(s for s in scores if s.score == peak_score)
    valley_entry = next(s for s in scores if s.score == valley_score)
    high_days = sum(1 for s in raw_scores if s >= 75)
    caution_days = sum(1 for s in raw_scores if s < 40)

    # Dominant dasha lord during the year — use dasha_periods table
    dasha_rows: list[DashaPeriod] = list(session.execute(
        select(DashaPeriod)
        .where(
            DashaPeriod.chart_id == chart_id,
            DashaPeriod.level == "maha",
            DashaPeriod.start_date <= year_end,
            DashaPeriod.end_date >= year_start,
        )
    ).scalars().all())

    dominant_lord = "JUPITER"  # sensible fallback
    if dasha_rows:
        # Find lord whose overlap with the year is greatest
        def _overlap_days(row: DashaPeriod) -> int:
            s = max(row.start_date, year_start)
            e = min(row.end_date, year_end)
            return max(0, (e - s).days)
        dominant_lord = max(dasha_rows, key=_overlap_days).lord
    else:
        # Fall back to live calculation
        try:
            chart_snap = load_persisted_chart_response(session, chart_id)
            natal_moon = next(p for p in chart_snap.data.planets if p.graha == "MOON")
            mid_year_jd = utc_datetime_to_julian_day(
                datetime(year, 7, 1, 12, 0, tzinfo=UTC)
            )
            timeline = calculate_vimshottari_timeline(
                chart_snap.data.julian_day, natal_moon.absolute_longitude, mid_year_jd
            )
            dominant_lord = timeline.current_mahadasha.lord
        except Exception:
            pass

    # Top journalled life area
    journal_rows: list[JournalEntry] = list(session.execute(
        select(JournalEntry)
        .where(
            JournalEntry.chart_id == chart_id,
            JournalEntry.entry_date >= year_start,
            JournalEntry.entry_date <= year_end,
        )
    ).scalars().all())

    top_life_area: str | None = None
    if journal_rows:
        counter: Counter[str] = Counter(j.life_area for j in journal_rows)
        top_life_area = counter.most_common(1)[0][0]

    slides = _build_slides(
        year=year,
        scores=scores,
        dominant_lord=dominant_lord,
        high_days=high_days,
        caution_days=caution_days,
        avg_score=avg_score,
        peak_score=peak_score,
        peak_date=peak_entry.score_date,
        valley_score=valley_score,
        valley_date=valley_entry.score_date,
        top_life_area=top_life_area,
    )

    data = AnnualWrappedData(
        chartId=chart_id,
        year=year,
        slides=slides,
        totalDaysScored=len(scores),
        peakScore=peak_score,
        peakDate=peak_entry.score_date,
        valleyScore=valley_score,
        valleyDate=valley_entry.score_date,
        dominantDashaLord=dominant_lord,
        highDays=high_days,
        cautionDays=caution_days,
        averageScore=avg_score,
        topLifeArea=top_life_area,
    )

    return AnnualWrappedResponse(data=data, meta=_meta())
