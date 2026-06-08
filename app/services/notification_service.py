"""
Morning Nalla Neram push notification builder.
Product Spec Module 18.1: Daily 6 AM local push notification per user.
"""
from __future__ import annotations


SCORE_LABEL_LINES: dict[str, dict[str, str]] = {
    "STRONG_SUPPORT": {
        "ta": "இன்று வலுவான ஆதரவு நாள். திட்டமிட்ட காரியங்களுக்கு நல்ல நேரம்.",
        "en": "Strong support day. Good for planned decisions and actions.",
    },
    "GOOD": {
        "ta": "இன்று நல்ல ஆதரவு நாள். திட்டமிட்டதை செய்யுங்கள்.",
        "en": "Good support day. Move ahead with your planned tasks.",
    },
    "BALANCED": {
        "ta": "இன்று நிலையான நாள். படிப்படியாக செல்லுங்கள்.",
        "en": "Steady day. Move step by step.",
    },
    "CAUTION": {
        "ta": "இன்று சற்று கவனம் தேவை. வழக்கமான பணிகளுக்கு மட்டும் முன்னுரிமை கொடுங்கள்.",
        "en": "A quieter day. Focus on routine tasks and defer major decisions.",
    },
    "RESTORATIVE": {
        "ta": "இன்று ஓய்வு மற்றும் மறுபரிசீலனை நாள். புதிய முயற்சிகளை நாளை தொடங்குங்கள்.",
        "en": "A restorative day. Rest and review. Start new things tomorrow.",
    },
}


def build_morning_notification(
    score_label: str,
    nalla_neram_start: str,
    nalla_neram_end: str,
    rahu_start: str,
    rahu_end: str,
    nakshatra_name_ta: str,
    nakshatra_name_en: str,
    nalla_neram_category_ta: str | None = None,
    nalla_neram_category_en: str | None = None,
    nalla_neram_purpose_ta: str | None = None,
    nalla_neram_purpose_en: str | None = None,
) -> dict:
    """
    Build the bilingual push notification payload for the morning Nalla Neram alert.

    Delivery: 6:00 AM local time in the user's birth city timezone (IANA tz from birth profile).
    Infrastructure: FCM (Firebase Cloud Messaging). All notifications are opt-in only.

    Returns a dict with 'title' and 'body', each a dict with 'ta' and 'en' keys.
    """
    label = SCORE_LABEL_LINES.get(score_label, SCORE_LABEL_LINES["BALANCED"])
    time_range = f"{nalla_neram_start}–{nalla_neram_end}"
    title_ta = (
        f"இன்றைய நல்ல நேரம்: {nalla_neram_category_ta} {time_range}"
        if nalla_neram_category_ta
        else f"இன்றைய நல்ல நேரம்: {time_range}"
    )
    title_en = (
        f"Today's Nalla Neram: {nalla_neram_category_en} {time_range}"
        if nalla_neram_category_en
        else f"Today's Nalla Neram: {time_range}"
    )
    purpose_ta = (
        f"{nalla_neram_category_ta}: {nalla_neram_purpose_ta}. "
        if nalla_neram_category_ta and nalla_neram_purpose_ta
        else ""
    )
    purpose_en = (
        f"{nalla_neram_category_en}: good for {nalla_neram_purpose_en}. "
        if nalla_neram_category_en and nalla_neram_purpose_en
        else ""
    )
    return {
        "title": {
            "ta": title_ta,
            "en": title_en,
        },
        "body": {
            "ta": (
                f"நட்சத்திரம்: {nakshatra_name_ta}. "
                f"{purpose_ta}"
                f"{label['ta']} "
                f"ராகு காலம் {rahu_start}–{rahu_end} தவிர்க்கவும்."
            ),
            "en": (
                f"Star: {nakshatra_name_en}. "
                f"{purpose_en}"
                f"{label['en']} "
                f"Avoid Rahu Kalam {rahu_start}–{rahu_end}."
            ),
        },
    }
