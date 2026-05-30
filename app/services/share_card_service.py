from __future__ import annotations

from datetime import UTC, datetime, date
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.schemas.dasha import ResponseMeta
from app.schemas.share_card import ShareCardBiText, ShareCardData, ShareCardResponse, VALID_CARD_TYPES
from app.services.chart_service import load_persisted_chart_response
from app.services.daily_guidance_service import get_daily_guidance
from app.services.nakshatra_content_static import get_nakshatra_card

# Maps score label → headline copy
_SCORE_HEADLINES: dict[str, dict[str, str]] = {
    "STRONG_SUPPORT": {
        "ta": "இன்று மிகவும் சாதகமான நாள்",
        "en": "Strong day ahead",
    },
    "GOOD": {
        "ta": "இன்று நல்ல ஆதரவு",
        "en": "Good energy today",
    },
    "NEUTRAL": {
        "ta": "இன்று சமநிலை நாள்",
        "en": "Steady, balanced day",
    },
    "CAUTION": {
        "ta": "இன்று அமைதியாக இருங்கள்",
        "en": "Rest and reflect today",
    },
    "RESTORATIVE": {
        "ta": "இன்று புத்துணர்வு நாள்",
        "en": "Rest and restore today",
    },
}

_SCORE_BAND: dict[str, str] = {
    "STRONG_SUPPORT": "high",
    "GOOD": "good",
    "NEUTRAL": "neutral",
    "CAUTION": "caution",
    "RESTORATIVE": "caution",
}

# Plain-language era labels per dasha lord
_ERA_LABEL: dict[str, dict[str, str]] = {
    "SUN":     {"ta": "சூரியன் தசை — ஆன்மா விழிப்பு காலம்", "en": "Sun era — soul awakening phase"},
    "MOON":    {"ta": "சந்திரன் தசை — மன வளர்ச்சி காலம்", "en": "Moon era — emotional growth phase"},
    "MARS":    {"ta": "செவ்வாய் தசை — செயல் உந்துதல் காலம்", "en": "Mars era — action and drive phase"},
    "MERCURY": {"ta": "புதன் தசை — தகவல் மற்றும் கல்வி காலம்", "en": "Mercury era — learning and communication phase"},
    "JUPITER": {"ta": "குரு தசை — ஞானம் மற்றும் வளர்ச்சி காலம்", "en": "Jupiter era — wisdom and expansion phase"},
    "VENUS":   {"ta": "சுக்கிரன் தசை — அன்பு மற்றும் ஆனந்த காலம்", "en": "Venus era — love and joy phase"},
    "SATURN":  {"ta": "சனி தசை — ஒழுக்கம் மற்றும் சுத்திகரிப்பு காலம்", "en": "Saturn era — discipline and refinement phase"},
    "RAHU":    {"ta": "ராகு தசை — மாற்றம் மற்றும் கண்டுபிடிப்பு காலம்", "en": "Rahu era — transformation and discovery phase"},
    "KETU":    {"ta": "கேது தசை — வைராக்கியம் மற்றும் ஆன்மீக காலம்", "en": "Ketu era — detachment and spiritual phase"},
}


def _meta() -> ResponseMeta:
    return ResponseMeta(
        calculation_version="jothidam-formula-engine-v1.0-2026",
        generated_at=datetime.now(UTC),
    )


def generate_card_data(
    session: Session,
    chart_id: UUID,
    card_type: str,
    on_date: date,
) -> ShareCardResponse:
    if card_type not in VALID_CARD_TYPES:
        raise HTTPException(status_code=422, detail=f"type must be one of: {sorted(VALID_CARD_TYPES)}")

    chart_snap = load_persisted_chart_response(session, chart_id)

    if card_type == "DAILY_VIBE":
        guidance = get_daily_guidance(session, chart_id, on_date, "ta-en")
        g = guidance.data
        headline_raw = _SCORE_HEADLINES.get(g.label, _SCORE_HEADLINES["NEUTRAL"])
        best_win = g.best_windows[0] if g.best_windows else None
        best_str = f"{best_win.start}–{best_win.end}" if best_win else None
        data = ShareCardData(
            card_type=card_type,
            chart_id=chart_id,
            date_local=on_date,
            score=g.score,
            score_label=g.label,
            score_band=_SCORE_BAND.get(g.label, "neutral"),
            headline=ShareCardBiText(ta=headline_raw["ta"], en=headline_raw["en"]),
            sub_headline=ShareCardBiText(ta=g.action_suggestion.ta, en=g.action_suggestion.en)
            if g.action_suggestion else None,
            best_window=best_str,
        )

    elif card_type == "DASHA_ERA":
        natal_moon = next(p for p in chart_snap.data.planets if p.graha == "MOON")
        birth_jd = chart_snap.data.julian_day
        now_jd = utc_datetime_to_julian_day(datetime.now(UTC))
        timeline = calculate_vimshottari_timeline(birth_jd, natal_moon.absolute_longitude, now_jd)
        maha = timeline.current_mahadasha
        era_raw = _ERA_LABEL.get(maha.lord, {"ta": f"{maha.lord} தசை", "en": f"{maha.lord} era"})
        era_years = f"{maha.start_date.year}–{maha.end_date.year}"
        data = ShareCardData(
            card_type=card_type,
            chart_id=chart_id,
            date_local=on_date,
            maha_lord=maha.lord,
            maha_lord_plain=ShareCardBiText(**era_raw),
            era_label=ShareCardBiText(ta=era_raw["ta"], en=era_raw["en"]),
            era_years=era_years,
        )

    else:  # NAKSHATRA
        natal_moon = next(p for p in chart_snap.data.planets if p.graha == "MOON")
        nak_num = natal_moon.nakshatra
        card = get_nakshatra_card(nak_num)
        c = card.data
        data = ShareCardData(
            card_type=card_type,
            chart_id=chart_id,
            date_local=on_date,
            nakshatra_name_ta=c.name_ta,
            nakshatra_name_en=c.name_en,
            nakshatra_trait=ShareCardBiText(ta=c.profile.ta, en=c.profile.en),
            ruling_planet=c.ruling_planet,
        )

    return ShareCardResponse(data=data, meta=_meta())
