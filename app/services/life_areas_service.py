"""
Life-area dashboard scoring — Tamil Thirukanitham system.

Seven areas: CAREER, MONEY, HEALTH, RELATIONSHIPS, EDUCATION, SPIRITUAL, FAMILY_HARMONY.

Each area is scored 0–100 using:
  - House signification rules (which house governs this area)
  - Current transit of the area's karaka (significator) planet
  - Dasha lord relevance (maha 70% + antardasha 30%)
  - Active Sani cycle penalty — from Moon (Janma/Ardhashtama/Ashtama/Kantaka)
    and from Lagna (Kandaka Sani)
  - Chandrashtamam penalty for mind-sensitive areas

All planet-house tables follow South Indian Thirukanitham tradition.
Whole Sign house system assumed throughout (consistent with chart engine).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import house_from_reference, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import classify_kandaka_cycle, classify_sani_cycle
from app.schemas.dasha import ResponseMeta
from app.schemas.life_areas import (
    LifeAreaData,
    LifeAreaDriver,
    LifeAreaText,
    LifeAreasResponse,
    LifeAreasResponseData,
)
from app.models import BirthProfile, Chart
from app.services.chart_service import load_persisted_chart_response


# ── Bilingual helper ───────────────────────────────────────────────────────────

def _t(ta: str, en: str) -> LifeAreaText:
    return LifeAreaText(ta=ta, en=en)


# ── Planet display names (Tamil Thirukanitham) ─────────────────────────────────

_PLANET_LABEL = {
    "SUN":     _t("சூரியன்",   "Suryan (Sun)"),
    "MOON":    _t("சந்திரன்",  "Chandran (Moon)"),
    "MARS":    _t("செவ்வாய்",  "Chevvai (Mars)"),
    "MERCURY": _t("புதன்",      "Budhan (Mercury)"),
    "JUPITER": _t("குரு",       "Guru (Jupiter)"),
    "VENUS":   _t("சுக்கிரன்", "Sukran (Venus)"),
    "SATURN":  _t("சனி",        "Sani (Saturn)"),
    "RAHU":    _t("ராகு",       "Rahu"),
    "KETU":    _t("கேது",       "Ketu"),
}

# ── Area label names ───────────────────────────────────────────────────────────

_AREA_LABELS = {
    "CAREER":          _t("தொழில்",         "Career"),
    "MONEY":           _t("பணம் / செல்வம்", "Money / Wealth"),
    "HEALTH":          _t("உடல்நலம்",       "Health"),
    "RELATIONSHIPS":   _t("உறவு / திருமணம்","Relationships / Marriage"),
    "EDUCATION":       _t("கல்வி",          "Education"),
    "SPIRITUAL":       _t("ஆன்மீகம்",       "Spiritual Growth"),
    "FAMILY_HARMONY":  _t("குடும்ப நலம்",   "Family Harmony"),
}

# ── House quality tables (from Moon — Tamil Thirukanitham) ────────────────────
# Score 0–100 for a planet transiting each house from the Moon.
# Based on standard Ashtakavarga / Gochar tables used in Thirukanitham.

_JUPITER_HOUSE_SCORE = {
    1: 50, 2: 72, 3: 48, 4: 42, 5: 78, 6: 38,
    7: 74, 8: 25, 9: 82, 10: 58, 11: 80, 12: 34,
}
_SATURN_HOUSE_SCORE = {
    1: 38, 2: 30, 3: 58, 4: 28, 5: 55, 6: 60,
    7: 35, 8: 22, 9: 52, 10: 45, 11: 62, 12: 34,
}
_MARS_HOUSE_SCORE = {
    1: 38, 2: 34, 3: 50, 4: 40, 5: 46, 6: 52,
    7: 42, 8: 28, 9: 48, 10: 44, 11: 50, 12: 32,
}
_MERCURY_HOUSE_SCORE = {
    1: 55, 2: 60, 3: 52, 4: 48, 5: 65, 6: 45,
    7: 58, 8: 30, 9: 62, 10: 55, 11: 65, 12: 36,
}
_VENUS_HOUSE_SCORE = {
    1: 55, 2: 62, 3: 50, 4: 55, 5: 68, 6: 42,
    7: 65, 8: 30, 9: 60, 10: 50, 11: 68, 12: 38,
}
_SUN_HOUSE_SCORE = {
    1: 50, 2: 45, 3: 55, 4: 38, 5: 60, 6: 48,
    7: 40, 8: 28, 9: 65, 10: 58, 11: 55, 12: 32,
}

_HOUSE_SCORE_TABLE = {
    "JUPITER": _JUPITER_HOUSE_SCORE,
    "SATURN":  _SATURN_HOUSE_SCORE,
    "MARS":    _MARS_HOUSE_SCORE,
    "MERCURY": _MERCURY_HOUSE_SCORE,
    "VENUS":   _VENUS_HOUSE_SCORE,
    "SUN":     _SUN_HOUSE_SCORE,
}

# ── Dasha lord scores per area ─────────────────────────────────────────────────
# Each planet's dasha support score per life area.
# Higher = more natural affinity with the area.

_DASHA_AREA_SCORE: dict[str, dict[str, int]] = {
    "CAREER": {
        "SUN": 72, "MOON": 50, "MARS": 65, "MERCURY": 62,
        "JUPITER": 68, "VENUS": 55, "SATURN": 60, "RAHU": 55, "KETU": 40,
    },
    "MONEY": {
        "SUN": 55, "MOON": 58, "MARS": 52, "MERCURY": 72,
        "JUPITER": 70, "VENUS": 68, "SATURN": 50, "RAHU": 58, "KETU": 38,
    },
    "HEALTH": {
        "SUN": 68, "MOON": 55, "MARS": 60, "MERCURY": 55,
        "JUPITER": 65, "VENUS": 55, "SATURN": 45, "RAHU": 40, "KETU": 38,
    },
    "RELATIONSHIPS": {
        "SUN": 48, "MOON": 65, "MARS": 50, "MERCURY": 58,
        "JUPITER": 65, "VENUS": 78, "SATURN": 42, "RAHU": 50, "KETU": 38,
    },
    "EDUCATION": {
        "SUN": 60, "MOON": 55, "MARS": 48, "MERCURY": 78,
        "JUPITER": 75, "VENUS": 55, "SATURN": 48, "RAHU": 52, "KETU": 45,
    },
    "SPIRITUAL": {
        "SUN": 65, "MOON": 62, "MARS": 50, "MERCURY": 55,
        "JUPITER": 78, "VENUS": 55, "SATURN": 65, "RAHU": 45, "KETU": 80,
    },
    "FAMILY_HARMONY": {
        "SUN": 55, "MOON": 72, "MARS": 50, "MERCURY": 58,
        "JUPITER": 70, "VENUS": 68, "SATURN": 45, "RAHU": 42, "KETU": 42,
    },
}

# ── Sani cycle penalties per area ─────────────────────────────────────────────

_SANI_AREA_PENALTY: dict[str, dict[str, int]] = {
    "JANMA_SANI":       {"CAREER": 12, "MONEY": 8,  "HEALTH": 15, "RELATIONSHIPS": 10, "EDUCATION": 8,  "SPIRITUAL": 0,  "FAMILY_HARMONY": 10},
    "ARDHASHTAMA_SANI": {"CAREER": 8,  "MONEY": 12, "HEALTH": 10, "RELATIONSHIPS": 8,  "EDUCATION": 6,  "SPIRITUAL": 0,  "FAMILY_HARMONY": 8},
    "ASHTAMA_SANI":     {"CAREER": 15, "MONEY": 15, "HEALTH": 18, "RELATIONSHIPS": 12, "EDUCATION": 10, "SPIRITUAL": 0,  "FAMILY_HARMONY": 12},
    "KANTAKA_SANI":     {"CAREER": 18, "MONEY": 10, "HEALTH": 12, "RELATIONSHIPS": 8,  "EDUCATION": 8,  "SPIRITUAL": 0,  "FAMILY_HARMONY": 8},
    "KANDAKA_SANI":     {"CAREER": 10, "MONEY": 15, "HEALTH": 8,  "RELATIONSHIPS": 10, "EDUCATION": 5,  "SPIRITUAL": 8,  "FAMILY_HARMONY": 10},
}

# ── Karaka (significator) planets per area ─────────────────────────────────────
# Thirukanitham tradition: primary karaka used for transit scoring

_AREA_KARAKA: dict[str, list[str]] = {
    "CAREER":         ["SATURN", "SUN"],        # 10th house: Sani primary, Suryan secondary
    "MONEY":          ["JUPITER", "VENUS"],      # 2nd/11th: Guru, Sukran
    "HEALTH":         ["SUN", "MARS"],           # 1st/6th: Suryan, Chevvai
    "RELATIONSHIPS":  ["VENUS", "JUPITER"],      # 7th: Sukran primary
    "EDUCATION":      ["MERCURY", "JUPITER"],    # 4th/5th: Budhan, Guru
    "SPIRITUAL":      ["JUPITER", "KETU"],       # 9th/12th: Guru, Ketu
    "FAMILY_HARMONY": ["MOON", "JUPITER"],       # 4th: Chandran, Guru
}


# ── Trend calculation ──────────────────────────────────────────────────────────

def _trend(score: int, dasha_score: int) -> str:
    if dasha_score >= 65 and score >= 60:
        return "UP"
    if score < 45 or dasha_score < 45:
        return "DOWN"
    return "STABLE"


# ── Narrative templates per area × score band ─────────────────────────────────

@dataclass
class _NarrativeBundle:
    narrative: LifeAreaText
    outlook: LifeAreaText
    remedy: LifeAreaText
    caution: LifeAreaText | None = None


_SANI_TYPE_LABEL_TA = {
    "JANMA_SANI":       "ஜன்ம சனி",
    "ARDHASHTAMA_SANI": "அர்த்தாஷ்டம சனி",
    "ASHTAMA_SANI":     "அஷ்டம சனி",
    "KANTAKA_SANI":     "கண்டக சனி",
    "KANDAKA_SANI":     "கண்டக சனி (லக்னம்)",
}
_SANI_TYPE_LABEL_EN = {
    "JANMA_SANI":       "Janma Sani",
    "ARDHASHTAMA_SANI": "Ardhashtama Sani",
    "ASHTAMA_SANI":     "Ashtama Sani",
    "KANTAKA_SANI":     "Kantaka Sani",
    "KANDAKA_SANI":     "Kandaka Sani (Lagna)",
}


def _sani_label_ta(sani_type: str | None) -> str:
    return _SANI_TYPE_LABEL_TA.get(sani_type or "", "சனி சுழற்சி")


def _sani_label_en(sani_type: str | None) -> str:
    return _SANI_TYPE_LABEL_EN.get(sani_type or "", "Sani cycle")


def _narrative(area: str, score: int, maha_lord: str, sani_active: bool, sani_type: str | None, chandrashtama: bool, jupiter_house: int, saturn_house: int) -> _NarrativeBundle:
    planet_ta = _PLANET_LABEL[maha_lord].ta
    planet_en = _PLANET_LABEL[maha_lord].en
    jup_h = jupiter_house
    sat_h = saturn_house
    sani_ta = _sani_label_ta(sani_type) if sani_active else ""
    sani_en = _sani_label_en(sani_type) if sani_active else ""

    match area:
        case "CAREER":
            if score >= 70:
                narr = _t(
                    f"தொழில் துறையில் நல்ல ஆதரவு உள்ளது. {planet_ta} தசையில் முன்னேற்றம் சாத்தியம். "
                    f"குரு {jup_h}ஆம் இடத்தில் உள்ளது — {'வளர்ச்சி அதிகம்' if jup_h in (2,5,9,11) else 'நடுநிலை'}.",
                    f"Career support is strong. Progress is possible under {planet_en} dasa. "
                    f"Jupiter in house {jup_h} — {'growth favoured' if jup_h in (2,5,9,11) else 'neutral'}.",
                )
                outlook = _t(
                    "அடுத்த 30 நாட்களில் தொழில் முன்னேற்றத்திற்கு நல்ல வாய்ப்பு உள்ளது. முக்கிய திட்டங்களை தொடங்கலாம்.",
                    "Good opportunity for career advancement in the next 30 days. New projects can be initiated.",
                )
                remedy = _t("வியாழக்கிழமை தட்சிணாமூர்த்தி தரிசனம். சனிக்கிழமை சனீஸ்வரன் வழிபாடு.",
                            "Visit Dakshinamurthy temple on Thursdays. Worship Saneeswaran on Saturdays.")
            elif score >= 50:
                narr = _t(
                    f"தொழில் நடுநிலையான நிலையில் உள்ளது. {planet_ta} தசையில் படிப்படியான முன்னேற்றம் சாத்தியம். "
                    f"சனி {sat_h}ஆம் இடத்தில் — {'கவனம் தேவை' if sat_h in (1,4,8,12) else 'சாதகம்'}.",
                    f"Career is in a steady state. Gradual progress is possible under {planet_en} dasa. "
                    f"Saturn in house {sat_h} — {'caution needed' if sat_h in (1,4,8,12) else 'favourable'}.",
                )
                outlook = _t(
                    "அடுத்த 30 நாட்களில் நிலையான முன்னேற்றம் எதிர்பார்க்கலாம். அவசர முடிவுகளை தவிர்க்கவும்.",
                    "Steady progress expected in the next 30 days. Avoid hasty decisions.",
                )
                remedy = _t("சனிக்கிழமை விரதம் அல்லது ஹனுமான் வழிபாடு உதவும்.",
                            "Saturday fasting or Hanuman worship is helpful.")
            else:
                narr = _t(
                    f"தொழிலில் தற்காலிக சவால்கள் உள்ளன. {planet_ta} தசையில் பொறுமை மிக முக்கியம். "
                    f"{sani_ta + ' நடப்பில் — தொழில் முடிவுகளில் கவனம்.' if sani_active else 'சனி நிலையை கவனிக்கவும்.'}",
                    f"Temporary career challenges are present. Patience is key under {planet_en} dasa. "
                    f"{sani_en + ' is active — exercise caution in career decisions.' if sani_active else 'Monitor Saturn position.'}",
                )
                outlook = _t(
                    "அடுத்த 30 நாட்களில் பெரிய மாற்றங்களை தவிர்க்கவும். நிலைப்படுத்துதலில் கவனம் செலுத்துங்கள்.",
                    "Avoid major changes in the next 30 days. Focus on stabilisation.",
                )
                remedy = _t("சனிக்கிழமை எள் எண்ணெய் விளக்கு ஏற்றுங்கள். கடுமையான பேச்சை தவிர்க்கவும்.",
                            "Light a sesame oil lamp on Saturdays. Avoid harsh speech.")
                return _NarrativeBundle(narr, outlook, remedy, caution=_t(
                    "தொழில் சம்பந்தமான பெரிய ஒப்பந்தங்களை நல்ல நாளில் கையெழுத்திடுங்கள்.",
                    "Sign important career contracts only on auspicious days.",
                ))

        case "MONEY":
            if score >= 70:
                narr = _t(
                    f"பண வரவு சாதகமாக உள்ளது. குரு {jup_h}ஆம் இடத்தில் — {'நல்ல வருமானம் சாத்தியம்' if jup_h in (2,5,9,11) else 'நடுநிலை'}. "
                    f"{planet_ta} தசையில் நிதி வாய்ப்புகள் உள்ளன.",
                    f"Financial inflow is favourable. Jupiter in house {jup_h} — {'good income possible' if jup_h in (2,5,9,11) else 'neutral'}. "
                    f"Financial opportunities exist under {planet_en} dasa.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் சேமிப்பு மற்றும் முதலீட்டிற்கு நல்ல நேரம்.",
                             "Good time for savings and investment in the next 30 days.")
                remedy = _t("வெள்ளிக்கிழமை மகாலட்சுமி வழிபாடு. தான தர்மம் செய்யுங்கள்.",
                            "Worship Mahalakshmi on Fridays. Practice charity and giving.")
            elif score >= 50:
                narr = _t(
                    f"நிதி நிலை நடுநிலையாக உள்ளது. {planet_ta} தசையில் கவனமான நிதி முடிவுகள் தேவை.",
                    f"Financial position is steady. Careful financial decisions are needed under {planet_en} dasa.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் தேவையற்ற செலவுகளை தவிர்க்கவும்.",
                             "Avoid unnecessary expenses in the next 30 days.")
                remedy = _t("வியாழக்கிழமை குரு வழிபாடு. மஞ்சள் தானம் உதவும்.",
                            "Jupiter worship on Thursdays. Donating yellow items is helpful.")
            else:
                narr = _t(
                    f"நிதியில் சவால்கள் உள்ளன. {sani_ta + ' — செலவுகள் அதிகரிக்கலாம்.' if sani_active else 'கவனமான நிதி மேலாண்மை தேவை.'}",
                    f"Financial challenges are present. {sani_en + ' — expenses may increase.' if sani_active else 'Careful financial management needed.'}",
                )
                outlook = _t("அடுத்த 30 நாட்களில் பெரிய முதலீடுகளை தவிர்க்கவும்.",
                             "Avoid large investments in the next 30 days.")
                remedy = _t("வெள்ளிக்கிழமை விரதம், மகாலட்சுமி வழிபாடு. தங்கம் வாங்குவதை ஒத்திவையுங்கள்.",
                            "Friday fasting and Mahalakshmi worship. Postpone gold purchases.")
                return _NarrativeBundle(narr, outlook, remedy, caution=_t(
                    "பெரிய கடன் வாங்குவதோ, தொழில் முதலீடு செய்வதோ ஒத்திவையுங்கள்.",
                    "Postpone large loans or business investments.",
                ))

        case "HEALTH":
            if score >= 70:
                narr = _t(
                    f"உடல்நலம் நல்ல நிலையில் உள்ளது. {planet_ta} தசையில் ஆற்றல் அதிகம். சூரியன் நிலை சாதகம்.",
                    f"Health is in a good state. High energy under {planet_en} dasa. Sun position is favourable.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் உடற்பயிற்சி மற்றும் ஆரோக்கியமான வழக்கங்களை தொடரவும்.",
                             "Continue exercise and healthy routines in the next 30 days.")
                remedy = _t("ஞாயிற்றுக்கிழமை சூரியனை வணங்குங்கள். நீர் அதிகம் அருந்துங்கள்.",
                            "Worship the Sun on Sundays. Drink plenty of water.")
            elif score >= 50:
                narr = _t(
                    f"உடல்நலம் நடுநிலையில் உள்ளது. {'சந்திராஷ்டமம் — மன அழுத்தம் கவனம்.' if chandrashtama else f'{planet_ta} தசையில் சாதாரண கவனம் தேவை.'}",
                    f"Health is in a steady state. {'Chandrashtamam — watch mental stress.' if chandrashtama else f'Ordinary care needed under {planet_en} dasa.'}",
                )
                outlook = _t("அடுத்த 30 நாட்களில் தூக்கம் மற்றும் உணவில் கவனம் செலுத்துங்கள்.",
                             "Pay attention to sleep and diet in the next 30 days.")
                remedy = _t("திங்கட்கிழமை சந்திர வழிபாடு. யோகா அல்லது தியானம் உதவும்.",
                            "Moon worship on Mondays. Yoga or meditation will help.")
            else:
                narr = _t(
                    f"உடல்நலத்தில் கவனம் தேவை. {sani_ta + ' — ஓய்வு மிக முக்கியம்.' if sani_active else 'சக்தி குறைவு சாத்தியம்.'}",
                    f"Health needs careful attention. {sani_en + ' — rest is essential.' if sani_active else 'Low energy is possible.'}",
                )
                outlook = _t("அடுத்த 30 நாட்களில் மருத்துவ சோதனை தள்ளிவையாதீர்கள்.",
                             "Do not delay health check-ups in the next 30 days.")
                remedy = _t(
                    "ஞாயிற்றுக்கிழமை ஆதித்ய வழிபாடு. அறுவை சிகிச்சை சந்திராஷ்டமம் நாட்களில் தவிர்க்கவும்."
                    if chandrashtama
                    else "ஞாயிற்றுக்கிழமை ஆதித்ய வழிபாடு. மருத்துவ முடிவுகளை அவசரமின்றி திட்டமிடுங்கள்.",
                    "Aditya worship on Sundays. Avoid surgery during Chandrashtamam days."
                    if chandrashtama
                    else "Aditya worship on Sundays. Plan medical decisions calmly and without hurry.",
                )
                return _NarrativeBundle(
                    narr,
                    outlook,
                    remedy,
                    caution=_t(
                        f"சந்திராஷ்டமம் மற்றும் {sani_ta} நாட்களில் அறுவை சிகிச்சை தவிர்க்கவும்."
                        if chandrashtama
                        else f"{sani_ta} காலத்தில் முக்கிய சிகிச்சை முடிவுகளை கவனமாக திட்டமிடுங்கள்.",
                        f"Avoid surgery on Chandrashtamam and {sani_en} days."
                        if chandrashtama
                        else f"During {sani_en} periods, plan major medical procedures carefully.",
                    ),
                )

        case "RELATIONSHIPS":
            if score >= 70:
                narr = _t(
                    f"உறவு / திருமண வாய்ப்புகள் சாதகமாக உள்ளன. சுக்கிரன் நிலை நல்லது. {planet_ta} தசை ஆதரவளிக்கிறது.",
                    f"Relationship / marriage prospects are favourable. Venus position is good. {planet_en} dasa is supportive.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் திருமண பேச்சுவார்த்தைகளுக்கு நல்ல நேரம்.",
                             "Good time for marriage discussions in the next 30 days.")
                remedy = _t("வெள்ளிக்கிழமை மகாலட்சுமி வழிபாடு. வெள்ளை அல்லது வண்ணப் பூக்கள் சமர்ப்பிக்கவும்.",
                            "Worship Mahalakshmi on Fridays. Offer white or colourful flowers.")
            elif score >= 50:
                narr = _t(
                    f"உறவுகளில் நடுநிலை நிலை. {planet_ta} தசையில் பொறுமையும் புரிதலும் முக்கியம்.",
                    f"Relationships are in a steady state. Patience and understanding are key under {planet_en} dasa.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் உறவுகளில் நேர்மையான தொடர்பு வைத்திருங்கள்.",
                             "Maintain honest communication in relationships over the next 30 days.")
                remedy = _t("வெள்ளிக்கிழமை விரதம் மற்றும் சுக்கிர வழிபாடு உதவும்.",
                            "Friday fasting and Venus worship will help.")
            else:
                narr = _t(
                    f"உறவுகளில் சவால்கள் உள்ளன. {'சந்திராஷ்டமம் — உணர்வு மோதல் தவிர்க்கவும்.' if chandrashtama else 'அமைதியான உரையாடல் தேவை.'}",
                    f"Relationship challenges are present. {'Chandrashtamam — avoid emotional conflict.' if chandrashtama else 'Calm communication is needed.'}",
                )
                outlook = _t("அடுத்த 30 நாட்களில் முக்கிய திருமண முடிவுகளை தவிர்க்கவும்.",
                             "Avoid major marriage decisions in the next 30 days.")
                remedy = _t("வெள்ளிக்கிழமை மகாலட்சுமி வழிபாடு. கடும் வார்த்தைகளை தவிர்க்கவும்.",
                            "Mahalakshmi worship on Fridays. Avoid harsh words.")
                return _NarrativeBundle(
                    narr,
                    outlook,
                    remedy,
                    caution=_t(
                        "சந்திராஷ்டமம் நாட்களில் முக்கிய உறவு முடிவுகளை தவிர்க்கவும்."
                        if chandrashtama
                        else "உணர்ச்சி தீவிரமான நாட்களில் முக்கிய உறவு முடிவுகளை தள்ளிவைக்கவும்.",
                        "Avoid major relationship decisions on Chandrashtamam days."
                        if chandrashtama
                        else "When emotions are intense, postpone major relationship decisions.",
                    ),
                )

        case "EDUCATION":
            if score >= 70:
                narr = _t(
                    f"கல்வி மற்றும் கற்றலுக்கு நல்ல ஆதரவு. குரு {jup_h}ஆம் இடத்தில் — {'நல்ல புரிதல் திறன்' if jup_h in (4,5,9) else 'நடுநிலை'}. "
                    f"{planet_ta} தசை ஆதரவளிக்கிறது.",
                    f"Good support for education and learning. Jupiter in house {jup_h} — {'strong comprehension' if jup_h in (4,5,9) else 'neutral'}. "
                    f"{planet_en} dasa is supportive.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் புதிய திறன்கள் கற்கவும், தேர்வுகளுக்கு நல்ல நேரம்.",
                             "Good time to learn new skills and appear for exams in the next 30 days.")
                remedy = _t("வியாழக்கிழமை சரஸ்வதி மற்றும் தட்சிணாமூர்த்தி வழிபாடு.",
                            "Worship Saraswati and Dakshinamurthy on Thursdays.")
            elif score >= 50:
                narr = _t(
                    f"கல்வியில் நடுநிலை ஆதரவு. {planet_ta} தசையில் தொடர்ச்சியான முயற்சி தேவை.",
                    f"Moderate educational support. Consistent effort is needed under {planet_en} dasa.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் கவனம் சிதறாமல் படிப்பை தொடருங்கள்.",
                             "Continue studies without distraction over the next 30 days.")
                remedy = _t("புதன்கிழமை பெருமாள் (திருமால்) வழிபாடு. ஓலை எழுதுவது நல்லது.",
                            "Worship Perumal on Wednesdays. Writing on a leaf is auspicious.")
            else:
                narr = _t(
                    f"கல்வியில் கவன சிதறல் மற்றும் தடைகள் சாத்தியம். {planet_ta} தசையில் மிகுந்த முயற்சி தேவை.",
                    f"Concentration difficulties and obstacles in education possible. Extra effort needed under {planet_en} dasa.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் தேர்வுகள் / முக்கிய சமர்ப்பிப்புகளை கவனமாக திட்டமிடுங்கள்.",
                             "Carefully plan exams and important submissions in the next 30 days.")
                remedy = _t("வியாழக்கிழமை சரஸ்வதி வழிபாடு. படிக்கும் முன் வாக்கேவரி கவசம் சொல்லுங்கள்.",
                            "Saraswati worship on Thursdays. Recite Vageeswari Kavacham before studying.")
                return _NarrativeBundle(
                    narr,
                    outlook,
                    remedy,
                    caution=_t(
                        "சந்திராஷ்டமம் நாட்களில் தேர்வுகளை எழுதுவதை தவிர்க்க முயற்சிக்கவும்."
                        if chandrashtama
                        else "மன அழுத்தம் அதிகமான நாட்களில் முக்கிய தேர்வுகளை கவனமாக திட்டமிடுங்கள்.",
                        "Try to avoid writing important exams on Chandrashtamam days."
                        if chandrashtama
                        else "On mentally heavy days, plan important exams with extra care.",
                    ),
                )

        case "SPIRITUAL":
            if score >= 70:
                narr = _t(
                    f"ஆன்மீக வளர்ச்சிக்கு மிகவும் சாதகமான காலம். {planet_ta} தசையில் தியானம் மற்றும் வழிபாடு பலன் தரும்.",
                    f"A highly favourable period for spiritual growth. Meditation and worship yield results under {planet_en} dasa.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் திருத்தலங்கள் செல்வதற்கும், தியான பயிற்சிக்கும் நல்ல நேரம்.",
                             "Good time for temple visits and meditation practice in the next 30 days.")
                remedy = _t("வியாழக்கிழமை குரு வழிபாடு. கீதை அல்லது திருவாசகம் ஒரு அத்தியாயம் தினமும் படிக்கலாம்.",
                            "Guru worship on Thursdays. Read one chapter of Gita or Thiruvasagam daily.")
            else:
                narr = _t(
                    f"ஆன்மீக கவனம் சிதறும் காலம். {planet_ta} தசையில் நிலையான வழிபாட்டு வழக்கம் தேவை.",
                    f"A period of spiritual distraction. A steady worship routine is needed under {planet_en} dasa.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் சிறிய தியான பயிற்சியை தொடர்ந்து செய்யுங்கள்.",
                             "Continue a short daily meditation practice over the next 30 days.")
                remedy = _t("தினமும் காலையில் சூரியனை வணங்கி ஆரம்பிக்கவும். மவுன நேரம் வைத்திருங்கள்.",
                            "Begin each day by worshipping the Sun. Keep a period of silence daily.")

        case "FAMILY_HARMONY":
            if score >= 70:
                narr = _t(
                    f"குடும்ப நலன் மற்றும் ஒற்றுமை சாதகமாக உள்ளது. {planet_ta} தசையில் குடும்பம் ஒன்றிணைந்து செயல்படும்.",
                    f"Family well-being and harmony are favourable. Family acts in unity under {planet_en} dasa.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் குடும்ப நிகழ்வுகள் மற்றும் பயணங்களுக்கு நல்ல நேரம்.",
                             "Good time for family events and travel in the next 30 days.")
                remedy = _t("திங்கட்கிழமை குடும்பத்தினருடன் சந்திர வழிபாடு செய்யுங்கள்.",
                            "Perform Moon worship with family on Mondays.")
            elif score >= 50:
                narr = _t(
                    f"குடும்ப நலம் நடுநிலையில் உள்ளது. {planet_ta} தசையில் கவனமான தொடர்பு முக்கியம்.",
                    f"Family harmony is in a steady state. Mindful communication is important under {planet_en} dasa.",
                )
                outlook = _t("அடுத்த 30 நாட்களில் குடும்ப உறுப்பினர்களுக்கு நேரம் ஒதுக்குங்கள்.",
                             "Allocate time for family members over the next 30 days.")
                remedy = _t("திங்கட்கிழமை விரதம், சந்திர வழிபாடு உதவும்.",
                            "Monday fasting and Moon worship will help.")
            else:
                narr = _t(
                    f"குடும்பத்தில் மோதல் மற்றும் கருத்து வேறுபாடு சாத்தியம். {'சந்திராஷ்டமம் — உணர்வுகளை கவனமாக வெளிப்படுத்துங்கள்.' if chandrashtama else 'பொறுமை மிக முக்கியம்.'}",
                    f"Family conflict and disagreement is possible. {'Chandrashtamam — express emotions carefully.' if chandrashtama else 'Patience is essential.'}",
                )
                outlook = _t("அடுத்த 30 நாட்களில் குடும்ப முடிவுகளை அனைவரும் சேர்ந்து எடுங்கள்.",
                             "Make family decisions together over the next 30 days.")
                remedy = _t("திங்கட்கிழமை அம்மன் வழிபாடு. கடும் வார்த்தைகளை முற்றிலும் தவிர்க்கவும்.",
                            "Worship Amman on Mondays. Avoid harsh words completely.")
                return _NarrativeBundle(
                    narr,
                    outlook,
                    remedy,
                    caution=_t(
                        "சந்திராஷ்டமம் நாட்களில் குடும்ப நடவடிக்கைகளில் கோபத்தை கட்டுப்படுத்துங்கள்."
                        if chandrashtama
                        else "குடும்ப உரையாடல்களில் அவசர பதில்களை தவிர்த்து பொறுமையுடன் நடந்துகொள்ளுங்கள்.",
                        "Control anger in family interactions on Chandrashtamam days."
                        if chandrashtama
                        else "Avoid reactive speech in family interactions and respond with patience.",
                    ),
                )

    # Default fallback
    narr = _t(f"{planet_ta} தசையில் இந்த துறையில் {score}/100 ஆதரவு உள்ளது.",
              f"{score}/100 support in this area under {planet_en} dasa.")
    outlook = _t("அடுத்த 30 நாட்களில் நிலையான முன்னேற்றம் எதிர்பார்க்கலாம்.",
                 "Steady progress expected in the next 30 days.")
    remedy = _t("வழக்கமான வழிபாட்டை தொடரவும்.", "Continue regular worship practice.")
    return _NarrativeBundle(narr, outlook, remedy)


# ── Primary scoring function ───────────────────────────────────────────────────

def _score_area(
    area: str,
    natal_moon_rasi: int,
    transit_bodies: dict,
    maha_lord: str,
    antar_lord: str,
    sani_cycle_type: str | None,
    sani_cycle_active: bool,
    kandaka_sani_active: bool,
    chandrashtama: bool,
) -> int:
    karakas = _AREA_KARAKA[area]
    primary_karaka = karakas[0]

    # Karaka transit score (primary)
    if primary_karaka in _HOUSE_SCORE_TABLE and primary_karaka in transit_bodies:
        h = house_from_reference(natal_moon_rasi, transit_bodies[primary_karaka].rasi)
        karaka_score = _HOUSE_SCORE_TABLE[primary_karaka][h]
    else:
        karaka_score = 50

    # Secondary karaka (if available, blend 70/30)
    if len(karakas) > 1:
        sec = karakas[1]
        if sec in _HOUSE_SCORE_TABLE and sec in transit_bodies:
            h2 = house_from_reference(natal_moon_rasi, transit_bodies[sec].rasi)
            sec_score = _HOUSE_SCORE_TABLE[sec][h2]
            karaka_score = round(karaka_score * 0.70 + sec_score * 0.30)

    # Dasha lord affinity — maha 70% + antardasha 30%
    maha_score = _DASHA_AREA_SCORE[area].get(maha_lord, 52)
    antar_score = _DASHA_AREA_SCORE[area].get(antar_lord, 52)
    dasha_score = round(maha_score * 0.70 + antar_score * 0.30)

    # Blend: 55% karaka transit + 35% dasha + 10% base
    raw = round(karaka_score * 0.55 + dasha_score * 0.35 + 50 * 0.10)

    # Sani cycle penalty — from Moon (Janma/Ardhashtama/Ashtama/Kantaka)
    if sani_cycle_active and sani_cycle_type and sani_cycle_type in _SANI_AREA_PENALTY:
        raw -= _SANI_AREA_PENALTY[sani_cycle_type].get(area, 0)

    # Kandaka Sani penalty — Saturn in 1/4/7/10 from Lagna (separate from Moon cycle)
    if kandaka_sani_active:
        raw -= _SANI_AREA_PENALTY["KANDAKA_SANI"].get(area, 0)

    # Chandrashtamam penalty for mind-sensitive areas
    if chandrashtama and area in ("HEALTH", "RELATIONSHIPS", "FAMILY_HARMONY", "EDUCATION"):
        raw -= 8

    return max(0, min(100, raw))


# ── Public service function ────────────────────────────────────────────────────

def _assert_chart_owner(session: Session, chart_id: UUID, owner_user_id: UUID) -> None:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def get_life_areas(session: Session, chart_id: UUID, on_date: date, *, owner_user_id: UUID) -> LifeAreasResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    natal_moon = next(p for p in chart_snapshot.data.planets if p.graha == "MOON")
    natal_lagna_rasi = chart_snapshot.data.lagna.rasi
    birth_jd = chart_snapshot.data.julian_day
    birth_profile = chart_snapshot.data.birth_profile

    tz = resolve_timezone(birth_profile.birth_timezone)
    local_noon = datetime.combine(on_date, time(12, 0), tzinfo=tz)
    current_jd = utc_datetime_to_julian_day(local_noon.astimezone(UTC))

    transit = calculate_sidereal_planets(current_jd)
    timeline = calculate_vimshottari_timeline(birth_jd, natal_moon.absolute_longitude, current_jd)
    maha_lord = timeline.current_mahadasha.lord
    antar_lord = timeline.current_antardasha.lord

    moon = transit.bodies["MOON"]
    saturn = transit.bodies["SATURN"]
    jupiter = transit.bodies["JUPITER"]

    chandrashtama_rasi = ((natal_moon.rasi - 1 + 7) % 12) + 1
    chandrashtama = moon.rasi == chandrashtama_rasi

    saturn_house_from_moon = house_from_reference(natal_moon.rasi, saturn.rasi)
    saturn_house_from_lagna = house_from_reference(natal_lagna_rasi, saturn.rasi)
    jupiter_house = house_from_reference(natal_moon.rasi, jupiter.rasi)

    sani_cycle = classify_sani_cycle(saturn_house_from_moon)
    kandaka_cycle = classify_kandaka_cycle(saturn_house_from_lagna)

    areas: list[LifeAreaData] = []
    for area in ("CAREER", "MONEY", "HEALTH", "RELATIONSHIPS", "EDUCATION", "SPIRITUAL", "FAMILY_HARMONY"):
        score = _score_area(
            area,
            natal_moon.rasi,
            transit.bodies,
            maha_lord,
            antar_lord,
            sani_cycle.type if sani_cycle.is_active else None,
            sani_cycle.is_active,
            kandaka_cycle.is_active,
            chandrashtama,
        )

        karakas = _AREA_KARAKA[area]
        primary_karaka = karakas[0]
        karaka_label = _PLANET_LABEL[primary_karaka]
        maha_score = _DASHA_AREA_SCORE[area].get(maha_lord, 52)
        antar_score = _DASHA_AREA_SCORE[area].get(antar_lord, 52)
        dasha_score = round(maha_score * 0.70 + antar_score * 0.30)

        if primary_karaka in transit.bodies:
            h = house_from_reference(natal_moon.rasi, transit.bodies[primary_karaka].rasi)
            driver_reason = _t(
                f"{karaka_label.ta} {h}ஆம் இடத்தில் உள்ளது.",
                f"{karaka_label.en} is in house {h}.",
            )
        else:
            driver_reason = _t(f"{karaka_label.ta} நிலை", f"{karaka_label.en} position")

        saturn_house = saturn_house_from_moon
        bundle = _narrative(
            area, score, maha_lord,
            sani_cycle.is_active, sani_cycle.type if sani_cycle.is_active else None,
            chandrashtama, jupiter_house, saturn_house,
        )

        areas.append(LifeAreaData(
            area=area,
            label=_AREA_LABELS[area],
            score=score,
            trend=_trend(score, dasha_score),
            driver=LifeAreaDriver(planet=primary_karaka, reason=driver_reason),
            narrative=bundle.narrative,
            remedy=bundle.remedy,
            next30DayOutlook=bundle.outlook,
            caution=bundle.caution,
        ))

    return LifeAreasResponse(
        data=LifeAreasResponseData(
            chartId=chart_id,
            dateLocal=on_date,
            areas=areas,
        ),
        meta=ResponseMeta(
            calculation_version=chart_snapshot.meta.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )
