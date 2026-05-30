"""
Life-area dashboard scoring — Tamil Thirukanitham system.

Seven areas: CAREER, MONEY, HEALTH, RELATIONSHIPS, EDUCATION, SPIRITUAL, FAMILY_HARMONY.

Each area is scored 0–100 using:
  - House signification rules (which house governs this area)
  - Current transit of the area's karaka (significator) planet
  - Dasha lord relevance (maha 70% + antardasha 30%)
  - Active Sani cycle penalty — from Moon (Sade Sati phases/Ardhashtama/Ashtama)
    and from Lagna (Kandaka Sani)
  - Chandrashtamam penalty for mind-sensitive areas

All planet-house tables follow South Indian Thirukanitham tradition.
Whole Sign house system assumed throughout (consistent with chart engine).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.ashtakavarga import compute_bhinnashtakavarga, compute_sarvashtakavarga
from app.calculations.astro import house_from_reference, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.karaka_chains import LIFE_AREA_KARAKA
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
    7: 68, 8: 25, 9: 82, 10: 58, 11: 80, 12: 34,
}
_SATURN_HOUSE_SCORE = {
    1: 42, 2: 40, 3: 62, 4: 34, 5: 52, 6: 64,
    7: 50, 8: 22, 9: 36, 10: 62, 11: 76, 12: 42,
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
    # Sade Sati: house 1 = peak (Janma Sani), house 12 = approaching, house 2 = leaving
    "JANMA_SANI":          {"CAREER": 12, "MONEY": 8,  "HEALTH": 15, "RELATIONSHIPS": 10, "EDUCATION": 8,  "SPIRITUAL": 0,  "FAMILY_HARMONY": 10},
    "EZHARAI_SANI_PHASE_1":{"CAREER": 6,  "MONEY": 5,  "HEALTH": 8,  "RELATIONSHIPS": 5,  "EDUCATION": 4,  "SPIRITUAL": 0,  "FAMILY_HARMONY": 5},
    "EZHARAI_SANI_PHASE_3":{"CAREER": 8,  "MONEY": 6,  "HEALTH": 10, "RELATIONSHIPS": 7,  "EDUCATION": 5,  "SPIRITUAL": 0,  "FAMILY_HARMONY": 7},
    "ARDHASHTAMA_SANI":    {"CAREER": 8,  "MONEY": 12, "HEALTH": 10, "RELATIONSHIPS": 8,  "EDUCATION": 6,  "SPIRITUAL": 0,  "FAMILY_HARMONY": 8},
    "ASHTAMA_SANI":        {"CAREER": 15, "MONEY": 15, "HEALTH": 18, "RELATIONSHIPS": 12, "EDUCATION": 10, "SPIRITUAL": 0,  "FAMILY_HARMONY": 12},
    "KANTAKA_SANI":        {"CAREER": 18, "MONEY": 10, "HEALTH": 12, "RELATIONSHIPS": 8,  "EDUCATION": 8,  "SPIRITUAL": 0,  "FAMILY_HARMONY": 8},
    "KANDAKA_SANI":        {"CAREER": 10, "MONEY": 15, "HEALTH": 8,  "RELATIONSHIPS": 10, "EDUCATION": 5,  "SPIRITUAL": 8,  "FAMILY_HARMONY": 10},
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


def _compute_age(on_date: date, birth_date: date) -> int:
    return on_date.year - birth_date.year - ((on_date.month, on_date.day) < (birth_date.month, birth_date.day))


def _is_married(marital_status: str | None) -> bool:
    return (marital_status or "").strip().lower() == "married"


def _is_student(employment_type: str | None) -> bool:
    return (employment_type or "").strip().lower() == "student"


def _not_applicable_text() -> LifeAreaText:
    return _t(
        "இந்த உள்ளடக்கம் தற்போதைய வாழ்க்கை நிலையில் பொருந்தாது.",
        "This content is not applicable for the current life stage.",
    )


def _with_improvement_hint(outlook: LifeAreaText, next_improvement_date: date | None) -> LifeAreaText:
    if next_improvement_date is None:
        return outlook
    ta_date = next_improvement_date.strftime("%d %b %Y")
    en_date = next_improvement_date.strftime("%d %b %Y")
    return _t(
        f"{outlook.ta} நிலை {ta_date}க்கு பின் மேம்படத் தொடங்கும்.",
        f"{outlook.en} Conditions improve after {en_date}.",
    )


def _married_relationship_text(score: int) -> tuple[LifeAreaText, LifeAreaText, LifeAreaText | None]:
    if score >= 65:
        return (
            _t(
                "தாம்பத்ய ஒற்றுமைக்கு நல்ல ஆதரவு உள்ளது. துணையுடன் திறந்த உரையாடல் உறவை மேலும் வலுப்படுத்தும்.",
                "Married life harmony is well supported. Open communication with your spouse can strengthen the bond.",
            ),
            _t(
                "அடுத்த 30 நாட்களில் இணைந்து திட்டமிடும் செயல்கள் நல்ல முன்னேற்றம் தரும்.",
                "In the next 30 days, shared planning and joint decisions are likely to go well.",
            ),
            None,
        )
    if score >= 45:
        return (
            _t(
                "தாம்பத்ய வாழ்க்கையில் நடுநிலை நிலை உள்ளது. பொறுமையுடன் பேசுவது முக்கியம்.",
                "Married life is in a steady phase. Patient and respectful communication is important.",
            ),
            _t(
                "அடுத்த 30 நாட்களில் குடும்ப பொறுப்புகளை இணைந்து பகிர்ந்தால் ஒற்றுமை மேம்படும்.",
                "Over the next 30 days, sharing responsibilities together can improve harmony.",
            ),
            None,
        )
    return (
        _t(
            "தாம்பத்ய உறவில் கவனம் தேவைப்படும் காலம். பதிலளிப்பதற்கு முன் அமைதியாக பேசுவது நல்லது.",
            "This is a caution phase for married life. Slow, calm responses are better than reactive conversations.",
        ),
        _t(
            "அடுத்த 30 நாட்களில் பெரிய உணர்ச்சி முடிவுகளை ஒத்திவைத்து உறவை நிலைநிறுத்த கவனம் செலுத்துங்கள்.",
            "In the next 30 days, avoid major emotional decisions and focus on stabilising the relationship.",
        ),
        _t(
            "சிறிய கருத்து வேறுபாடுகளை பெரிய விவாதமாக மாற்றாமல் நேரம் எடுத்துப் பேசுங்கள்.",
            "Do not escalate small disagreements; take time before sensitive discussions.",
        ),
    )


def _find_next_improvement_date(
    *,
    area: str,
    current_score: int,
    on_date: date,
    birth_jd: float,
    natal_moon_rasi: int,
    natal_lagna_rasi: int,
    moon_longitude: float,
) -> date | None:
    target_score = max(55, current_score + 8)
    for offset_days in range(7, 181, 7):
        check_date = on_date + timedelta(days=offset_days)
        check_jd = utc_datetime_to_julian_day(datetime.combine(check_date, time(12, 0), tzinfo=UTC))
        transit = calculate_sidereal_planets(check_jd)
        timeline = calculate_vimshottari_timeline(birth_jd, moon_longitude, check_jd)
        maha_lord = timeline.current_mahadasha.lord
        antar_lord = timeline.current_antardasha.lord
        moon = transit.bodies["MOON"]
        saturn = transit.bodies["SATURN"]
        chandrashtama_rasi = ((natal_moon_rasi - 1 + 7) % 12) + 1
        chandrashtama = moon.rasi == chandrashtama_rasi
        saturn_house_from_moon = house_from_reference(natal_moon_rasi, saturn.rasi)
        saturn_house_from_lagna = house_from_reference(natal_lagna_rasi, saturn.rasi)
        sani_cycle = classify_sani_cycle(saturn_house_from_moon)
        kandaka_cycle = classify_kandaka_cycle(saturn_house_from_lagna)
        projected = _score_area(
            area,
            natal_moon_rasi,
            transit.bodies,
            maha_lord,
            antar_lord,
            sani_cycle.type if sani_cycle.is_active else None,
            sani_cycle.is_active,
            kandaka_cycle.is_active,
            chandrashtama,
        )
        if projected >= target_score:
            return check_date
    return None


# ── Narrative templates per area × score band ─────────────────────────────────

@dataclass
class _NarrativeBundle:
    narrative: LifeAreaText
    outlook: LifeAreaText
    remedy: LifeAreaText
    caution: LifeAreaText | None = None


_SANI_TYPE_LABEL_TA = {
    "JANMA_SANI":           "ஜன்ம சனி",
    "EZHARAI_SANI_PHASE_1": "ஏழரை சனி (தொடக்கம்)",
    "EZHARAI_SANI_PHASE_3": "ஏழரை சனி (முடிவு)",
    "ARDHASHTAMA_SANI":     "அர்த்தாஷ்டம சனி",
    "ASHTAMA_SANI":         "அஷ்டம சனி",
    "KANTAKA_SANI":         "கண்டக சனி",
    "KANDAKA_SANI":         "கண்டக சனி (லக்னம்)",
}
_SANI_TYPE_LABEL_EN = {
    "JANMA_SANI":           "Janma Sani",
    "EZHARAI_SANI_PHASE_1": "Sade Sati (beginning)",
    "EZHARAI_SANI_PHASE_3": "Sade Sati (ending)",
    "ARDHASHTAMA_SANI":     "Ardhashtama Sani",
    "ASHTAMA_SANI":         "Ashtama Sani",
    "KANTAKA_SANI":         "Kantaka Sani",
    "KANDAKA_SANI":         "Kandaka Sani (Lagna)",
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
    if profile is None or profile.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
    if profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


_AREA_TO_CHAIN_KEY: dict[str, str] = {
    "CAREER": "CAREER",
    "MONEY": "FINANCE",
    "HEALTH": "HEALTH",
    "RELATIONSHIPS": "MARRIAGE",
    "EDUCATION": "CHILDREN",
    "SPIRITUAL": "SPIRITUAL",
    "FAMILY_HARMONY": "PROPERTY",
}


def _karaka_chain_score(
    area_key: str,
    lagna_rasi: int,
    moon_rasi: int,
    planet_scores: dict[str, int],
    planet_rasis: dict[str, int],
    current_mahadasha_lord: str,
    current_antardasha_lord: str,
    transit_planet_rasis: dict[str, int],
    native_age: int,
    sarvashtakavarga: dict[int, int] | None = None,
) -> dict:
    chain = LIFE_AREA_KARAKA.get(area_key)
    if chain is None:
        return {
            "score": 50,
            "primary_house_strength": "NEUTRAL",
            "karaka_status": "UNKNOWN",
            "dasha_activation": False,
            "transit_support": 50,
            "blocking_factors": [],
            "supporting_factors": [],
        }

    age_min = chain.get("age_min")
    age_max = chain.get("age_max")
    if age_min is not None and native_age < age_min:
        return {
            "score": 30,
            "primary_house_strength": "N/A",
            "karaka_status": "NOT_APPLICABLE_FOR_AGE",
            "dasha_activation": False,
            "transit_support": 30,
            "blocking_factors": ["too_young"],
            "supporting_factors": [],
        }
    if age_max is not None and native_age > age_max:
        return {
            "score": 30,
            "primary_house_strength": "N/A",
            "karaka_status": "NOT_APPLICABLE_FOR_AGE",
            "dasha_activation": False,
            "transit_support": 30,
            "blocking_factors": ["age_limit"],
            "supporting_factors": [],
        }

    primary_house = chain["primary_house"]
    karaka_planets = chain["karaka_planets"]
    supporting_factors: list[str] = []
    blocking_factors: list[str] = []

    primary_house_rasi = ((lagna_rasi + primary_house - 2) % 12) + 1
    house_lord = SIGN_LORD.get(primary_house_rasi, "SUN")
    lord_score = planet_scores.get(house_lord, 50)
    if lord_score >= 65:
        supporting_factors.append(f"{house_lord}_lord_strong")
    elif lord_score <= 35:
        blocking_factors.append(f"{house_lord}_lord_weak")

    karaka_score_avg = 0
    for karaka in karaka_planets:
        ks = planet_scores.get(karaka, 50)
        karaka_score_avg += ks
        if ks >= 65:
            supporting_factors.append(f"{karaka}_karaka_strong")
        elif ks <= 35:
            blocking_factors.append(f"{karaka}_karaka_weak")
    karaka_score_avg = karaka_score_avg // max(1, len(karaka_planets))

    dasha_lords = {current_mahadasha_lord, current_antardasha_lord}
    dasha_activation = bool(dasha_lords & ({house_lord} | set(karaka_planets)))
    if dasha_activation:
        supporting_factors.append("dasha_activates_area")

    transit_support = 50
    for karaka in karaka_planets:
        t_rasi = transit_planet_rasis.get(karaka)
        if t_rasi is None:
            continue
        t_house = house_from_reference(lagna_rasi, t_rasi)
        if t_house in {1, 5, 9, 11, primary_house}:
            transit_support += 8
            supporting_factors.append(f"{karaka}_transit_supportive")
        elif t_house in {6, 8, 12}:
            transit_support -= 8
            blocking_factors.append(f"{karaka}_transit_difficult")
    transit_support = max(20, min(80, transit_support))

    if sarvashtakavarga is not None:
        sarva = sarvashtakavarga.get(primary_house_rasi, 25)
        if sarva >= 28:
            supporting_factors.append("house_av_strong")
        elif sarva <= 22:
            blocking_factors.append("house_av_weak")

    score = (
        lord_score * 0.35
        + karaka_score_avg * 0.30
        + transit_support * 0.20
        + (15 if dasha_activation else 0)
    )
    score = max(10, min(95, round(score)))

    lord_house = house_from_reference(lagna_rasi, planet_rasis.get(house_lord, lagna_rasi))
    if lord_house in {1, 4, 7, 10, 5, 9}:
        primary_house_strength = "STRONG"
    elif lord_house in {6, 8, 12}:
        primary_house_strength = "WEAK"
    else:
        primary_house_strength = "NEUTRAL"

    karaka_status = "STRONG" if karaka_score_avg >= 65 else ("WEAK" if karaka_score_avg <= 35 else "MODERATE")

    return {
        "score": score,
        "primary_house_strength": primary_house_strength,
        "karaka_status": karaka_status,
        "dasha_activation": dasha_activation,
        "transit_support": transit_support,
        "blocking_factors": blocking_factors,
        "supporting_factors": supporting_factors,
    }


def get_life_areas(session: Session, chart_id: UUID, on_date: date, *, owner_user_id: UUID) -> LifeAreasResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    natal_moon = next(p for p in chart_snapshot.data.planets if p.graha == "MOON")
    natal_lagna_rasi = chart_snapshot.data.lagna.rasi
    birth_jd = chart_snapshot.data.julian_day
    birth_profile = chart_snapshot.data.birth_profile
    current_age = _compute_age(on_date, birth_profile.birth_date_local)
    married = _is_married(getattr(birth_profile, "marital_status", None))
    student_under_18 = _is_student(getattr(birth_profile, "employment_type", None)) and current_age < 18

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
    natal_planet_scores = {
        p.graha: (p.strength_score if getattr(p, "strength_score", 0) > 0 else 50)
        for p in chart_snapshot.data.planets
    }
    natal_planet_rasis = {p.graha: p.rasi for p in chart_snapshot.data.planets}
    transit_planet_rasis = {g: b.rasi for g, b in transit.bodies.items()}
    natal_rasi_map = {p.graha: p.rasi for p in chart_snapshot.data.planets if p.graha != "MANDHI"}
    natal_rasi_map["LAGNA"] = natal_lagna_rasi
    sarvashtakavarga = compute_sarvashtakavarga(compute_bhinnashtakavarga(natal_rasi_map))

    # Label overrides based on life stage
    _retired = (getattr(birth_profile, "employment_type", None) or "").lower() == "retired"
    area_label_override: dict[str, LifeAreaText] = {}
    if married:
        area_label_override["RELATIONSHIPS"] = _t("உறவு நலம்", "Relationship Harmony")
    if _retired:
        area_label_override["CAREER"] = _t("வாழ்க்கை நோக்கம்", "Life Purpose / Legacy")

    areas: list[LifeAreaData] = []
    for area in ("CAREER", "MONEY", "HEALTH", "RELATIONSHIPS", "EDUCATION", "SPIRITUAL", "FAMILY_HARMONY"):
        effective_label = area_label_override.get(area, _AREA_LABELS[area])

        if area == "RELATIONSHIPS" and current_age < 16:
            na = _not_applicable_text()
            areas.append(
                LifeAreaData(
                    area=area,
                    label=effective_label,
                    score=0,
                    trend="STABLE",
                    confidence="LOW",
                    confidenceReason=na,
                    driver=LifeAreaDriver(planet="N/A", reason=na),
                    narrative=na,
                    remedy=na,
                    next30DayOutlook=na,
                    caution=None,
                )
            )
            continue
        if area == "CAREER" and (current_age < 18 or student_under_18):
            na = _not_applicable_text()
            areas.append(
                LifeAreaData(
                    area=area,
                    label=effective_label,
                    score=0,
                    trend="STABLE",
                    confidence="LOW",
                    confidenceReason=na,
                    driver=LifeAreaDriver(planet="N/A", reason=na),
                    narrative=na,
                    remedy=na,
                    next30DayOutlook=na,
                    caution=None,
                )
            )
            continue

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
        chain_key = _AREA_TO_CHAIN_KEY.get(area, area)
        chain_result = _karaka_chain_score(
            area_key=chain_key,
            lagna_rasi=natal_lagna_rasi,
            moon_rasi=natal_moon.rasi,
            planet_scores=natal_planet_scores,
            planet_rasis=natal_planet_rasis,
            current_mahadasha_lord=maha_lord,
            current_antardasha_lord=antar_lord,
            transit_planet_rasis=transit_planet_rasis,
            native_age=current_age,
            sarvashtakavarga=sarvashtakavarga,
        )
        score = max(0, min(100, round(score * 0.35 + chain_result["score"] * 0.65)))

        karakas = _AREA_KARAKA[area]
        primary_karaka = karakas[0]
        karaka_label = _PLANET_LABEL[primary_karaka]
        maha_score = _DASHA_AREA_SCORE[area].get(maha_lord, 52)
        antar_score = _DASHA_AREA_SCORE[area].get(antar_lord, 52)
        dasha_score = round(maha_score * 0.70 + antar_score * 0.30)

        if primary_karaka in transit.bodies:
            h = house_from_reference(natal_moon.rasi, transit.bodies[primary_karaka].rasi)
            karaka_transit_score = _HOUSE_SCORE_TABLE.get(primary_karaka, {}).get(h, 50)
            driver_reason = _t(
                f"{karaka_label.ta} {h}ஆம் இடத்தில் உள்ளது.",
                f"{karaka_label.en} is in house {h}.",
            )
        else:
            karaka_transit_score = 50
            driver_reason = _t(f"{karaka_label.ta} நிலை", f"{karaka_label.en} position")

        # P1-B: confidence tier from 3 independent signals
        _conf_signals = sum(1 for s in (score, dasha_score, karaka_transit_score) if s >= 60)
        if _conf_signals >= 3:
            _area_confidence = "HIGH"
            _area_conf_reason = _t(
                "மூன்று சமிக்ஞைகளும் சீரமைக்கப்பட்டுள்ளன",
                "All three signals are aligned",
            )
        elif _conf_signals == 2:
            _area_confidence = "MEDIUM"
            _area_conf_reason = _t(
                "இரண்டு சமிக்ஞைகள் சீரமைக்கப்பட்டுள்ளன",
                "Two of three signals are aligned",
            )
        else:
            _area_confidence = "LOW"
            _area_conf_reason = _t(
                "சமிக்ஞைகள் கலந்த நிலையில் உள்ளன — குறிப்பு மட்டுமே",
                "Mixed signals — indicative only",
            )

        saturn_house = saturn_house_from_moon
        bundle = _narrative(
            area, score, maha_lord,
            sani_cycle.is_active, sani_cycle.type if sani_cycle.is_active else None,
            chandrashtama, jupiter_house, saturn_house,
        )

        # For married users, render relationship guidance as harmony-focused content.
        label = _AREA_LABELS[area]
        if married and area == "RELATIONSHIPS":
            label = _t("தாம்பத்ய ஒற்றுமை", "Married life harmony")
            married_narrative, married_outlook, married_caution = _married_relationship_text(score)
            bundle = _NarrativeBundle(
                narrative=married_narrative,
                outlook=married_outlook,
                remedy=bundle.remedy,
                caution=married_caution,
            )

        if score < 50 or bundle.caution is not None:
            next_improvement = _find_next_improvement_date(
                area=area,
                current_score=score,
                on_date=on_date,
                birth_jd=birth_jd,
                natal_moon_rasi=natal_moon.rasi,
                natal_lagna_rasi=natal_lagna_rasi,
                moon_longitude=natal_moon.absolute_longitude,
            )
            bundle = _NarrativeBundle(
                narrative=bundle.narrative,
                outlook=_with_improvement_hint(bundle.outlook, next_improvement),
                remedy=bundle.remedy,
                caution=bundle.caution,
            )

        areas.append(LifeAreaData(
            area=area,
            label=label,
            score=score,
            trend=_trend(score, dasha_score),
            confidence=_area_confidence,
            confidenceReason=_area_conf_reason,
            primaryHouseStrength=chain_result["primary_house_strength"],
            karakaStatus=chain_result["karaka_status"],
            dashaActivation=chain_result["dasha_activation"],
            transitSupport=chain_result["transit_support"],
            supportingFactors=chain_result["supporting_factors"],
            blockingFactors=chain_result["blocking_factors"],
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
