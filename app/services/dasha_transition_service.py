"""
Dasha transition alert system — 90 / 30 / 7 day and day-of alerts.
Product Spec Module 4.3.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.calculations.dasha import SEQUENCE, calculate_vimshottari_timeline


TRANSITION_COPY: dict[str, dict[str, dict[str, str]]] = {
    "MAHADASHA": {
        "90_DAY": {
            "ta": "{lord} மகாதசை 90 நாட்களில் முடிகிறது. இந்தக் காலகட்டத்தின் பாடங்களை உள்வாங்குங்கள்.",
            "en": "{lord} Mahadasha ends in 90 days. A time to integrate this chapter's themes.",
        },
        "30_DAY": {
            "ta": "{lord} மகாதசை 30 நாட்களில் மாறுகிறது. தொடர்ச்சியான விஷயங்களை நிறைவு செய்யுங்கள்.",
            "en": "{lord} Mahadasha ends in 30 days. Complete pending matters in this theme.",
        },
        "7_DAY": {
            "ta": "{lord} மகாதசையின் கடைசி வாரம். மாற்றத்திற்கு தயாராகுங்கள்.",
            "en": "Final week of {lord} Mahadasha. Prepare for the transition.",
        },
        "TODAY": {
            "ta": "இன்று புதிய மகாதசை தொடங்குகிறது — {next_lord} காலம் ஆரம்பம்.",
            "en": "New Mahadasha begins today — {next_lord} period starts.",
        },
    },
    "ANTARDASHA": {
        "90_DAY": {
            "ta": "{lord} அந்தர்தசை 90 நாட்களில் முடிகிறது. இந்தக் காலகட்டத்தின் விளைவுகளை கவனியுங்கள்.",
            "en": "{lord} Antardasha ends in 90 days. Be attentive to this phase's themes.",
        },
        "30_DAY": {
            "ta": "{lord} அந்தர்தசை 30 நாட்களில் மாறுகிறது. நிலுவையான காரியங்களை முடிக்கவும்.",
            "en": "{lord} Antardasha ends in 30 days. Wrap up ongoing matters.",
        },
        "7_DAY": {
            "ta": "{lord} அந்தர்தசையின் கடைசி வாரம். அடுத்த கட்டத்திற்கு தயாராகுங்கள்.",
            "en": "Final week of {lord} Antardasha. Prepare for the next phase.",
        },
        "TODAY": {
            "ta": "இன்று புதிய அந்தர்தசை தொடங்குகிறது — {next_lord} காலம் ஆரம்பம்.",
            "en": "New Antardasha begins today — {next_lord} period starts.",
        },
    },
}

PLANET_NAME_TA: dict[str, str] = {
    "SUN":     "சூரியன்",
    "MOON":    "சந்திரன்",
    "MARS":    "செவ்வாய்",
    "MERCURY": "புதன்",
    "JUPITER": "குரு",
    "VENUS":   "சுக்கிரன்",
    "SATURN":  "சனி",
    "RAHU":    "ராகு",
    "KETU":    "கேது",
}


def _next_lord(current_lord: str) -> str:
    idx = SEQUENCE.index(current_lord)
    return SEQUENCE[(idx + 1) % len(SEQUENCE)]


@dataclass
class DashaTransitionAlert:
    type: str           # "MAHADASHA" or "ANTARDASHA"
    urgency: str        # "90_DAY", "30_DAY", "7_DAY", "TODAY"
    days_remaining: int
    ending_lord: str
    starting_lord: str | None
    transition_date: date
    copy_ta: str
    copy_en: str


def get_dasha_transition_alerts(
    birth_jd: float,
    moon_longitude: float,
    current_jd: float,
    check_date: date,
) -> list[DashaTransitionAlert]:
    """
    Returns transition alerts for Mahadasha and Antardasha ending within 90 days.
    One alert per transition type at most (highest urgency shown).
    """
    timeline = calculate_vimshottari_timeline(birth_jd, moon_longitude, current_jd)
    alerts: list[DashaTransitionAlert] = []

    checks = [
        ("MAHADASHA",  timeline.current_mahadasha.end_date,  timeline.current_mahadasha.lord),
        ("ANTARDASHA", timeline.current_antardasha.end_date, timeline.current_antardasha.lord),
    ]

    for transition_type, end_date, ending_lord in checks:
        days = (end_date - check_date).days
        if 0 <= days <= 90:
            urgency = (
                "TODAY"  if days == 0 else
                "7_DAY"  if days <= 7  else
                "30_DAY" if days <= 30 else
                "90_DAY"
            )
            next_l = _next_lord(ending_lord)
            lord_ta = PLANET_NAME_TA.get(ending_lord, ending_lord)
            next_ta = PLANET_NAME_TA.get(next_l, next_l)
            tmpl = TRANSITION_COPY[transition_type][urgency]
            copy_ta = tmpl["ta"].format(lord=lord_ta, next_lord=next_ta)
            copy_en = tmpl["en"].format(lord=ending_lord.capitalize(), next_lord=next_l.capitalize())

            alerts.append(DashaTransitionAlert(
                type=transition_type,
                urgency=urgency,
                days_remaining=days,
                ending_lord=ending_lord,
                starting_lord=next_l,
                transition_date=end_date,
                copy_ta=copy_ta,
                copy_en=copy_en,
            ))

    return alerts
