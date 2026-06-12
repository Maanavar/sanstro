"""Panchangam share-card data assembly — Feature 1 (WhatsApp Panchangam Share Card).

Assembles the fields a shareable card needs from the existing panchangam calculation.
No new astrological maths — cards are rendered client-side on canvas; this only
returns JSON. Picks a day-of-week deity and detects special-tithi festivals
(Pournami / Amavasai / Shivarathiri / Ekadasi / Pradosham).
"""
from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from app.schemas.panchangam import PanchangamDailyQuery
from app.services.narrative_engine import festival_for_tithi, tithi_content_card
from app.services.panchangam_service import calculate_panchangam

# Day-of-week → presiding deity (GROWTH_FEATURES.md DEITY_MAP).
DEITY_MAP: dict[str, str] = {
    "MON": "shiva",
    "TUE": "murugan",
    "WED": "vishnu",
    "THU": "dakshinamurthy",
    "FRI": "lakshmi",
    "SAT": "shani",
    "SUN": "surya",
}

DEITY_LABELS: dict[str, dict[str, str]] = {
    "shiva":          {"ta": "சிவன்",          "en": "Shiva"},
    "murugan":        {"ta": "முருகன்",        "en": "Murugan"},
    "vishnu":         {"ta": "விஷ்ணு",         "en": "Vishnu"},
    "dakshinamurthy": {"ta": "தட்சிணாமூர்த்தி", "en": "Dakshinamurthy"},
    "lakshmi":        {"ta": "லட்சுமி",         "en": "Lakshmi"},
    "shani":          {"ta": "சனி பகவான்",      "en": "Shani"},
    "surya":          {"ta": "சூரியன்",         "en": "Surya"},
}


def _absolute_tithi_number(number: int, paksha: str) -> int:
    """Return the 1–30 absolute tithi index from a per-paksha number + paksha."""
    if number > 15:  # already absolute
        return number
    return number + (15 if (paksha or "").upper() == "KRISHNA" else 0)


def _daily_guidance_line(is_subha: bool) -> dict[str, str]:
    if is_subha:
        return {
            "ta": "இன்று சுப முகூர்த்த நாள் — நல்ல காரியங்களைத் தொடங்கலாம்.",
            "en": "An auspicious day — a good time to begin good work.",
        }
    return {
        "ta": "கீழே உள்ள நல்ல நேரங்களைப் பயன்படுத்தி, ராகு காலத்தைத் தவிர்க்கவும்.",
        "en": "Use the good windows below and avoid Rahu Kalam.",
    }


def get_card_data(
    on_date: date,
    lat: float,
    lng: float,
    timezone: str,
    lang: str = "ta",
    city: str = "Chennai",
    session: Session | None = None,
) -> dict:
    query = PanchangamDailyQuery(date=on_date, lat=lat, lng=lng, timezone=timezone)
    resp = calculate_panchangam(query, session)
    d = resp.data

    weekday = (d.vara.weekday or "").upper()
    deity_key = DEITY_MAP.get(weekday[:3], "surya")

    abs_tithi = _absolute_tithi_number(d.tithi.number, d.tithi.paksha)
    festival = festival_for_tithi(abs_tithi)
    festival_payload = None
    if festival is not None:
        card = tithi_content_card(abs_tithi)
        festival_payload = {
            "key": festival["key"],
            "ta": festival["ta"],
            "en": festival["en"],
            "deity": festival["deity"],
            "message": {"ta": card.ta, "en": card.en} if card else None,
        }

    return {
        "date": d.date_local.isoformat(),
        "city": city,
        "weekday": weekday,
        "deityKey": deity_key,
        "deityLabel": DEITY_LABELS.get(deity_key, DEITY_LABELS["surya"]),
        "tamilDate": (
            {"ta": d.tamil_date.ta, "en": d.tamil_date.en} if d.tamil_date else None
        ),
        "tithi": {"name": d.tithi.name, "paksha": d.tithi.paksha},
        "nakshatra": {"name": d.nakshatra.name, "pada": d.nakshatra.pada},
        "yoga": d.yoga.name,
        "karana": d.karana.name,
        "rahukalam": {"start": d.kalam.rahu_kalam.start, "end": d.kalam.rahu_kalam.end},
        "abhijit": {"start": d.abhijit.start, "end": d.abhijit.end},
        "sunrise": d.sunrise,
        "sunset": d.sunset,
        "moonPhaseLabel": d.moon_phase_label,
        "festival": festival_payload,
        "guidance": _daily_guidance_line(d.subha_muhurtham.is_subha),
        "brand": {
            "name": "Vinaadi AI",
            "url": "vinaadi.ai",
            "cta": {
                "ta": "உங்கள் இலவச ஜாதகம் — vinaadi.ai",
                "en": "Get your free Jadhagam — vinaadi.ai",
            },
        },
        "lang": lang,
    }
