"""
Nakshatra birthday (Pirantha Naal / Janma Nakshatra day) alert.
Product Spec Module 10.
Scans forward day by day until the transiting Moon enters the person's birth Nakshatra.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from app.calculations.panchangam import calculate_daily_panchangam
from app.services.narrative_engine import NAKSHATRA_NAME


@dataclass
class PiranthaNaalAlert:
    janma_nakshatra: int
    nakshatra_name_ta: str
    nakshatra_name_en: str
    alert_date: date          # The Pirantha Naal date
    nakshatra_ends_at: str    # Local time when the Nakshatra ends on that day
    days_away: int
    is_today: bool


def next_janma_nakshatra_date(
    janma_nakshatra: int,
    from_date: date,
    latitude: float,
    longitude: float,
    timezone_name: str,
) -> PiranthaNaalAlert | None:
    """
    Scans forward up to 30 days from from_date.
    Returns a PiranthaNaalAlert when the day's nakshatra_number matches janma_nakshatra.
    The Moon completes one cycle in ~27.3 days, so this always finds a match within 28 days.
    """
    current = from_date
    for _ in range(30):
        panchang = calculate_daily_panchangam(current, latitude, longitude, timezone_name)
        if panchang.nakshatra_number == janma_nakshatra:
            nak_bi = NAKSHATRA_NAME.get(janma_nakshatra)
            name_ta = nak_bi.ta if nak_bi else str(janma_nakshatra)
            name_en = nak_bi.en if nak_bi else str(janma_nakshatra)
            ends_at = panchang.nakshatra_ends_at.strftime("%H:%M") if panchang.nakshatra_ends_at else "N/A"
            days_away = (current - from_date).days
            return PiranthaNaalAlert(
                janma_nakshatra=janma_nakshatra,
                nakshatra_name_ta=name_ta,
                nakshatra_name_en=name_en,
                alert_date=current,
                nakshatra_ends_at=ends_at,
                days_away=days_away,
                is_today=(days_away == 0),
            )
        current += timedelta(days=1)
    return None


def build_pirantha_naal_notification(
    name: str,
    alert: PiranthaNaalAlert,
) -> dict:
    """
    Build bilingual notification payload for a Pirantha Naal alert.
    Returns dict with 'title' and 'body', each with 'ta' and 'en'.
    """
    if alert.is_today:
        title_ta = f"இன்று {name}-ன் நட்சத்திர பிறந்த நாள் — {alert.nakshatra_name_ta}"
        title_en = f"Today is {name}'s Janma Nakshatra day — {alert.nakshatra_name_en}"
        body_ta = (
            f"நட்சத்திர நேரம்: {alert.nakshatra_ends_at} வரை. "
            f"குடும்பத்தினரை வாழ்த்துங்கள். கோவிலுக்கு சென்று ஆசி பெறுங்கள்."
        )
        body_en = (
            f"Nakshatra until: {alert.nakshatra_ends_at}. "
            f"Greet family members. Visit the temple for blessings."
        )
    else:
        title_ta = f"நாளை {name}-ன் நட்சத்திர பிறந்த நாள் — {alert.nakshatra_name_ta}"
        title_en = f"Tomorrow is {name}'s Janma Nakshatra day — {alert.nakshatra_name_en}"
        body_ta = (
            f"நட்சத்திர நேரம் நாளை {alert.nakshatra_ends_at} வரை. "
            f"முன்கூட்டியே கோவில் திட்டமிடுங்கள்."
        )
        body_en = (
            f"Nakshatra lasts until {alert.nakshatra_ends_at} tomorrow. "
            f"Plan a temple visit in advance."
        )

    return {"title": {"ta": title_ta, "en": title_en}, "body": {"ta": body_ta, "en": body_en}}
