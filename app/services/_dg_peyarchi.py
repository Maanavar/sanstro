"""Peyarchi (planetary transit) reports, dasha story, and node-axis analysis."""
from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.activity_timing_rules import ActivityType
from app.calculations.astro import house_from_reference, local_datetime_to_utc, utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.models import BirthProfile, Chart
from app.schemas.daily_guidance import (
    DashaStoryData,
    DashaStoryPeriod,
    DashaStoryResponse,
    PeyarchiReportData,
    PeyarchiReportPeriod,
    PeyarchiReportResponse,
)
from app.schemas.dasha import ResponseMeta
from app.services.location_service import local_noon_as_utc_for_profile

_MAHADASHA_THEMES: dict[str, dict[str, str]] = {
    "KETU":    {"ta": "ஆன்மீகம், விலகல், மறைந்த விஷயங்கள்",   "en": "Spirituality, detachment, hidden matters"},
    "VENUS":   {"ta": "உறவுகள், கலை, ஐஸ்வர்யம், வாகனம்",     "en": "Relationships, arts, luxury, vehicles"},
    "SUN":     {"ta": "தொழில், அதிகாரம், தந்தை, உடல்நலம்",    "en": "Career, authority, father, vitality"},
    "MOON":    {"ta": "மனம், தாய், உணர்வு, பயணம்",            "en": "Mind, mother, emotions, travel"},
    "MARS":    {"ta": "ஆற்றல், உடன்பிறப்பு, சொத்து",          "en": "Energy, siblings, property, courage"},
    "RAHU":    {"ta": "லட்சியம், வெளிநாடு, திடீர் மாற்றம்",   "en": "Ambition, foreign connections, sudden changes"},
    "JUPITER": {"ta": "அறிவு, குழந்தை, செல்வம், விரிவாக்கம்", "en": "Knowledge, children, wealth, expansion"},
    "SATURN":  {"ta": "ஒழுக்கம், பொறுப்பு, சேவை, ஆயுள்",    "en": "Discipline, responsibility, service, longevity"},
    "MERCURY": {"ta": "தொடர்பு, வியாபாரம், கல்வி",            "en": "Communication, business, education"},
}

_PEYARCHI_OUTLOOK: dict[str, dict[int, dict[str, str]]] = {
    "JUPITER": {
        2:  {"ta": "கஜகேசரி யோகம் சாத்தியம். தன, குடும்ப விஷயங்கள் மேம்படலாம்.", "en": "Gajakesari yoga possible. Wealth and family matters may improve."},
        5:  {"ta": "புத்திர, கல்வி, ஆன்மீக வளர்ச்சி. நல்ல காலம்.", "en": "Good period for children, education, and spiritual growth."},
        7:  {"ta": "கல்யாண யோகம். கூட்டுறவு, வியாபாரம் சாதகம்.", "en": "Marriage and partnership prospects improve."},
        9:  {"ta": "பாக்ய ஸ்தானம். அதிர்ஷ்டம், ஆசீர்வாதம், வெற்றி.", "en": "Fortune house transit. Luck, blessings, and success."},
        11: {"ta": "லாப ஸ்தானம். வருமானம், சேர்க்கை, நண்பர்கள் ஆதரவு.", "en": "Gains house. Income, accumulation, and friend support."},
        4:  {"ta": "கேந்திர குரு — கட்டமைப்பு மாற்றம், வீடு விஷயங்கள்.", "en": "Kendra Jupiter — structural changes, home matters."},
        8:  {"ta": "கஷ்டமான குரு காலம். பொறுமையும் கவனமும் தேவை.", "en": "Challenging Jupiter transit. Patience and caution needed."},
        12: {"ta": "வெளிநாடு, ஆன்மீகம், செலவு அதிகமாகலாம்.", "en": "Possible travel, spirituality, and increased expenses."},
    },
    "SATURN": {
        1:  {"ta": "ஜன்ம சனி — மாற்றமும் முதிர்ச்சியும் தரும் காலம்; எச்சரிக்கையுடன் முன்னேறவும்.", "en": "Sade Sati peak (1st) — major life changes; proceed with discipline and perspective."},
        2:  {"ta": "ஏழரை சனி (முடிவு) — நிதியில் கட்டுப்பாடு தேவை; மெதுவாக நிலைநிறுத்தம் நடக்கும்.", "en": "Sade Sati ending (2nd) — financial caution is advised; consolidation improves over time."},
        3:  {"ta": "மூன்றாம் சனி — முயற்சிக்கு பலன், தைரியம் மற்றும் முன்னேற்றம்.", "en": "3rd Saturn — effort gets rewarded; courage and execution improve."},
        4:  {"ta": "அர்த்தாஷ்டம சனி — வீடு, மனஅமைதி, குடும்ப பொறுப்புகளில் அழுத்தம் இருக்கலாம்.", "en": "Ardhashtama phase (4th) — domestic and emotional pressure; stay grounded."},
        5:  {"ta": "ஐந்தாம் சனி — நடுநிலை. திட்டமிட்ட செயல் நிதானமாக பலன் தரும்.", "en": "5th Saturn — neutral; steady, structured action works best."},
        6:  {"ta": "ஆறாம் சனி — எதிரிகளை வெல்லலாம்; ஒழுக்கமான உழைப்பிற்கு பலன் கிடைக்கும்.", "en": "6th Saturn — strong for overcoming obstacles through disciplined effort."},
        7:  {"ta": "ஏழாம் சனி — கலப்பு/நடுநிலை பலன்; உறவில் பொறுமை மற்றும் தெளிவு தேவை.", "en": "7th Saturn — neutral to mixed; relationships improve with patience and clarity."},
        8:  {"ta": "அஷ்டம சனி — கடின பருவம்; உடல்நலம் மற்றும் ஆபத்து மேலாண்மையில் கவனம் அவசியம்.", "en": "Ashtama Sani (8th) — caution period for health and obstacles; take protective steps."},
        9:  {"ta": "ஒன்பதாம் சனி — பாக்கியம் மந்தமாகலாம்; தந்தை/குரு தொடர்பில் கவனமாக இருங்கள்.", "en": "9th Saturn — unfavourable for fortune flow; be careful in father/guru-related matters."},
        10: {"ta": "பத்தாம் சனி — கடின உழைப்பால் தொழிலில் நிலையான வளர்ச்சி சாத்தியம்.", "en": "10th Saturn — good for career growth through sustained hard work."},
        11: {"ta": "லாப சனி — நீண்ட முயற்சிக்கு பலன்; வருமானமும் வட்டார ஆதரவும்வளரும்.", "en": "11th Saturn — very supportive for gains, income, and long-term rewards."},
        12: {"ta": "ஏழரை சனி (தொடக்கம்) — செலவு, பயணம், உள்ளார்ந்த மாற்றம்; ஆன்மீக முன்னேற்றத்திற்கான காலம்.", "en": "Sade Sati beginning (12th) — expenses and transition, with strong spiritual-growth potential."},
    },
}

_HOUSE_THEME_TA: dict[int, str] = {
    1: "உடல், தன்மை, வாழ்க்கை திசை",
    2: "குடும்பம், பேச்சு, பண அடித்தளம்",
    3: "முயற்சி, துணிவு, தொடர்பு",
    4: "வீடு, மன அமைதி, சொத்து",
    5: "கல்வி, புத்தி, குழந்தைகள்",
    6: "சேவை, பழக்கங்கள், உடல் பராமரிப்பு",
    7: "உறவுகள், கூட்டாண்மை",
    8: "ஆழமான மாற்றம், மறைவு, உள்மாற்றம்",
    9: "தர்மம், ஆசீர்வாதம், உயர்கல்வி",
    10: "தொழில், பொறுப்பு, பொதுப் பங்கு",
    11: "லாபம், வலையமைப்பு, விருப்ப நிறைவு",
    12: "ஓய்வு, வெளிநாடு, ஆன்மீக விடுவிப்பு",
}
_HOUSE_THEME_EN: dict[int, str] = {
    1: "self, body, and life direction",
    2: "family, speech, and financial foundations",
    3: "effort, courage, and communication",
    4: "home, emotional grounding, and property",
    5: "learning, intelligence, and children",
    6: "service, habits, and health management",
    7: "relationships and partnership",
    8: "deep change, hidden matters, and inner reset",
    9: "dharma, blessings, and higher learning",
    10: "career, responsibility, and public role",
    11: "gains, networks, and fulfilment of goals",
    12: "rest, foreign links, and spiritual release",
}

_ACTIVITY_TIMING_ACTIVITY_ALIASES: dict[str, ActivityType] = {
    "travel": "travel_abroad",
    "child": "child_birth",
}


def _normalize_activity_timing_activity(activity: str) -> ActivityType:
    normalized = _ACTIVITY_TIMING_ACTIVITY_ALIASES.get(activity, activity)
    allowed: set[ActivityType] = {
        "job_change",
        "business_start",
        "marriage",
        "education",
        "property",
        "health",
        "travel_abroad",
        "spiritual",
        "family_harmony",
        "money",
        "child_birth",
        "other",
    }
    if normalized not in allowed:
        raise HTTPException(status_code=422, detail="Unsupported activity type.")
    return normalized


def _node_axis_phase(rahu_house_from_moon: int) -> tuple[str, str]:
    if rahu_house_from_moon in {3, 6, 10, 11}:
        return (
            "இந்த அச்சு வெளிப்படையான முன்னேற்றம், திறன், சாதனை நோக்கை வலுப்படுத்தும்.",
            "This axis tends to externalize change through effort, skill-building, and visible progress.",
        )
    if rahu_house_from_moon in {1, 5, 7, 8, 12}:
        return (
            "இந்த அச்சு ஆழமான மறுசீரமைப்பு காலம்; வேகத்தை விட நிலைத்தன்மை முக்கியம்.",
            "This axis marks a deeper restructuring phase, so grounding matters more than speed.",
        )
    return (
        "இந்த அச்சு கலப்பு மாற்றத்தை தரும்; எது வளர வேண்டும், எது விடப்பட வேண்டும் என்பதில் தெளிவு தேவை.",
        "This axis brings mixed but meaningful change; clarity helps you separate what must grow from what must be released.",
    )


def _rahu_ketu_axis_outlook(
    planet: str,
    house_moon: int,
    house_lagna: int,
    opposite_house_moon: int,
    opposite_house_lagna: int,
) -> dict[str, str]:
    rahu_house_moon = house_moon if planet == "RAHU" else opposite_house_moon
    rahu_house_lagna = house_lagna if planet == "RAHU" else opposite_house_lagna
    ketu_house_moon = opposite_house_moon if planet == "RAHU" else house_moon
    ketu_house_lagna = opposite_house_lagna if planet == "RAHU" else house_lagna
    phase_ta, phase_en = _node_axis_phase(rahu_house_moon)

    if planet == "RAHU":
        return {
            "ta": (
                f"ராகு/கேது அச்சு மாற்றம் தொடங்குகிறது. ராகு சந்திர ராசியிலிருந்து {house_moon}ஆம் இடம் "
                f"({_HOUSE_THEME_TA[house_moon]}) மற்றும் லக்னத்திலிருந்து {house_lagna}ஆம் இடத்தை முன்னிலைப்படுத்தும். "
                f"எதிர் அச்சில் கேது {opposite_house_moon}ஆம் இடம் ({_HOUSE_THEME_TA[opposite_house_moon]}) மற்றும் "
                f"லக்னத்திலிருந்து {opposite_house_lagna}ஆம் இடங்களில் எளிமை, விடுவிப்பு, உள்ளார்ந்த திருப்பத்தை தரும். "
                f"{phase_ta}"
            ),
            "en": (
                f"Rahu/Ketu axis shift begins here. Rahu amplifies house {house_moon} from Moon "
                f"({_HOUSE_THEME_EN[house_moon]}) and house {house_lagna} from Lagna, increasing appetite and visibility in that area. "
                f"On the opposite axis, Ketu simplifies house {opposite_house_moon} from Moon "
                f"({_HOUSE_THEME_EN[opposite_house_moon]}) and house {opposite_house_lagna} from Lagna, "
                f"asking for release and inner correction. {phase_en}"
            ),
        }
    return {
        "ta": (
            f"ராகு/கேது அச்சு மாற்றம் தொடங்குகிறது. கேது சந்திர ராசியிலிருந்து {ketu_house_moon}ஆம் இடம் "
            f"({_HOUSE_THEME_TA[ketu_house_moon]}) மற்றும் லக்னத்திலிருந்து {ketu_house_lagna}ஆம் இடங்களில் எளிமை, "
            f"விடுவிப்பு, ஆன்மீக திருப்பத்தை தரும். எதிர் அச்சில் ராகு {rahu_house_moon}ஆம் இடம் "
            f"({_HOUSE_THEME_TA[rahu_house_moon]}) மற்றும் லக்னத்திலிருந்து {rahu_house_lagna}ஆம் இடங்களில் ஆசை, "
            f"வளர்ச்சி உந்துதல், வெளிப்படை இயக்கத்தை பெரிதாக்கும். {phase_ta}"
        ),
        "en": (
            f"Rahu/Ketu axis shift begins here. Ketu simplifies house {ketu_house_moon} from Moon "
            f"({_HOUSE_THEME_EN[ketu_house_moon]}) and house {ketu_house_lagna} from Lagna, encouraging release, "
            f"simplification, and inner correction. On the opposite axis, Rahu amplifies house {rahu_house_moon} "
            f"from Moon ({_HOUSE_THEME_EN[rahu_house_moon]}) and house {rahu_house_lagna} from Lagna, increasing "
            f"desire and outward movement. {phase_en}"
        ),
    }


def get_dasha_story(
    session: Session,
    chart_id: UUID,
    as_of: date,
    calculation_version: str = "thirukanitham-2026-v1",
) -> DashaStoryResponse:
    """
    FEATURE-09: Returns all Mahadasha periods from birth through ~120 years with themes.
    """
    from app.services.chart_service import load_persisted_chart_response

    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=404, detail="Chart not found.")

    birth_profile = session.execute(
        select(BirthProfile).where(BirthProfile.birth_profile_id == chart.birth_profile_id)
    ).scalar_one_or_none()
    if birth_profile is None:
        raise HTTPException(status_code=404, detail="Birth profile not found.")

    chart_snapshot = load_persisted_chart_response(session, chart_id)
    natal_moon = next((p for p in chart_snapshot.data.planets if p.graha == "MOON"), None)
    if natal_moon is None:
        raise HTTPException(status_code=422, detail="Moon data not available in chart.")

    if birth_profile.birth_time_local is None:
        raise HTTPException(status_code=422, detail="Birth time is required for Dasha story.")
    birth_dt = local_datetime_to_utc(
        datetime.combine(birth_profile.birth_date_local, birth_profile.birth_time_local),
        birth_profile.birth_timezone,
    )
    birth_jd = utc_datetime_to_julian_day(birth_dt)
    current_jd = utc_datetime_to_julian_day(local_noon_as_utc_for_profile(as_of, birth_profile))

    timeline = calculate_vimshottari_timeline(birth_jd, float(natal_moon.absolute_longitude), current_jd)
    birth_year = birth_profile.birth_date_local.year

    periods: list[DashaStoryPeriod] = []
    for maha in timeline.mahadashas:
        theme = _MAHADASHA_THEMES.get(maha.lord, {"ta": maha.lord, "en": maha.lord})
        age_start = maha.start_date.year - birth_year
        age_end = maha.end_date.year - birth_year
        is_current = (maha.start_date <= as_of <= maha.end_date)
        periods.append(DashaStoryPeriod(
            lord=maha.lord,
            startDate=maha.start_date,
            endDate=maha.end_date,
            ageStart=max(0, age_start),
            ageEnd=max(0, age_end),
            themeTa=theme["ta"],
            themeEn=theme["en"],
            isCurrent=is_current,
        ))

    return DashaStoryResponse(
        data=DashaStoryData(
            chartId=chart_id,
            openingLord=timeline.opening_lord,
            periods=periods,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_peyarchi_report(
    session: Session,
    chart_id: UUID,
    planet: str,
    as_of: date,
    calculation_version: str = "thirukanitham-2026-v1",
) -> PeyarchiReportResponse:
    """
    FEATURE-11: Personalised Peyarchi (Rasi transit) report for Jupiter, Saturn, Rahu, or Ketu.
    """
    from app.services.chart_service import load_persisted_chart_response
    from app.services.peyarchi_service import find_next_rasi_change

    planet = planet.upper()
    if planet not in ("JUPITER", "SATURN", "RAHU", "KETU"):
        raise HTTPException(status_code=422, detail="Only JUPITER, SATURN, RAHU, and KETU are supported for peyarchi reports.")

    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=404, detail="Chart not found.")

    birth_profile = session.execute(
        select(BirthProfile).where(BirthProfile.birth_profile_id == chart.birth_profile_id)
    ).scalar_one_or_none()
    if birth_profile is None:
        raise HTTPException(status_code=404, detail="Birth profile not found.")

    chart_snapshot = load_persisted_chart_response(session, chart_id)
    natal_moon = next((p for p in chart_snapshot.data.planets if p.graha == "MOON"), None)
    natal_lagna = chart_snapshot.data.lagna.rasi

    from_dt = local_noon_as_utc_for_profile(as_of, birth_profile)
    from_jd = utc_datetime_to_julian_day(from_dt)

    current_snapshot = calculate_sidereal_planets(from_jd)
    current_rasi = current_snapshot.bodies[planet].rasi

    events: list[PeyarchiReportPeriod] = []
    scan_jd = from_jd

    for _ in range(5):
        try:
            transit_dt, next_rasi = find_next_rasi_change(planet, scan_jd)
        except Exception:
            break

        transit_date = transit_dt.date()
        house_moon = house_from_reference(natal_moon.rasi if natal_moon else 1, next_rasi)
        house_lagna = house_from_reference(natal_lagna, next_rasi)

        outlook = _PEYARCHI_OUTLOOK.get(planet, {}).get(house_moon, {
            "ta": f"கோசார {planet.capitalize()} {house_moon}ஆம் இடத்தில் — மிதமான காலம்.",
            "en": f"Transit {planet.capitalize()} in house {house_moon} — moderate period.",
        })

        if planet in {"RAHU", "KETU"}:
            opposite_rasi = ((next_rasi + 6 - 1) % 12) + 1
            opposite_house_moon = house_from_reference(natal_moon.rasi if natal_moon else 1, opposite_rasi)
            opposite_house_lagna = house_from_reference(natal_lagna, opposite_rasi)
            outlook = _rahu_ketu_axis_outlook(
                planet,
                house_moon,
                house_lagna,
                opposite_house_moon,
                opposite_house_lagna,
            )

        events.append(PeyarchiReportPeriod(
            planet=planet,
            fromRasi=current_rasi,
            toRasi=next_rasi,
            transitDate=transit_date,
            houseFromMoon=house_moon,
            houseFromLagna=house_lagna,
            outlookTa=outlook["ta"],
            outlookEn=outlook["en"],
        ))
        current_rasi = next_rasi
        scan_jd = utc_datetime_to_julian_day(transit_dt) + 10

    return PeyarchiReportResponse(
        data=PeyarchiReportData(
            chartId=chart_id,
            planet=planet,
            events=events,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )
