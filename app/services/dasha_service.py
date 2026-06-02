from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Literal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.dasha import _build_subperiods, calculate_vimshottari_timeline
from app.calculations.dasha_house_mapping import get_dasha_activated_houses
from app.calculations.functional_nature import FunctionalNature, get_functional_nature
from app.calculations.maturation import maturation_status
from app.schemas.dasha import (
    DashaCurrentWindow,
    DashaTransitionNote,
    DashaInterpretation,
    DashaOpeningWindow,
    DashaPeriodWindow,
    DashaTimelineResponse,
    DashaTimelineResponseData,
    ResponseMeta,
)
from app.services.chart_service import load_persisted_chart_response
from app.services.location_service import local_midnight_as_jd_for_profile


# Natural domain text per planet (Tamil + English)
_PLANET_DOMAIN: dict[str, tuple[str, str]] = {
    "SUN":     ("ஆன்மா, தலைமை, தந்தை, அரசு, உடல்நலம்",
                "Soul, leadership, father, government, vitality"),
    "MOON":    ("மனம், தாய், உணர்வுகள், வீடு, நலன்",
                "Mind, mother, emotions, home, nourishment"),
    "MARS":    ("தைரியம், தொழில், சகோதரர், நில சொத்து, ஆற்றல்",
                "Courage, siblings, property, career drive, energy"),
    "MERCURY": ("புத்தி, வணிகம், கல்வி, தொடர்பு, திறன்",
                "Intellect, business, education, communication, skill"),
    "JUPITER": ("குரு ஆசி, கல்வி, தர்மம், செல்வம், குழந்தைகள்",
                "Wisdom, dharma, wealth, children, spiritual growth"),
    "VENUS":   ("திருமணம், கலை, ஆடம்பரம், உறவுகள், சுகம்",
                "Marriage, arts, luxury, relationships, pleasure"),
    "SATURN":  ("ஒழுக்கம், நீடித்த உழைப்பு, வயது, கர்மா, தொழிலாளர்",
                "Discipline, sustained effort, longevity, karma, service"),
    "RAHU":    ("எதிர்பாராத மாற்றம், வெளிநாடு, சேர்க்கை, புதுமை",
                "Unexpected change, foreign matters, obsession, innovation"),
    "KETU":    ("ஆன்மீகம், வைராக்யம், பழைய வினை, மறைவான ஞானம்",
                "Spirituality, detachment, past karma, hidden wisdom"),
}

# House signification labels
_HOUSE_DOMAIN: dict[int, tuple[str, str]] = {
    1:  ("உடல், ஆளுமை, ஆரோக்யம்", "Body, personality, health"),
    2:  ("குடும்பம், சொத்து, பேச்சு", "Family, wealth, speech"),
    3:  ("சகோதரர், தைரியம், குறுந்தூரம்", "Siblings, courage, short journeys"),
    4:  ("தாய், வீடு, கல்வி, சுகம்", "Mother, home, education, comfort"),
    5:  ("புத்தி, புத்திரர், பூர்வ புண்யம்", "Intelligence, children, past merit"),
    6:  ("எதிரிகள், நோய், கடன், சேவை", "Enemies, illness, debts, service"),
    7:  ("திருமணம், கூட்டாளி, வெளி உலகம்", "Marriage, partnerships, public dealings"),
    8:  ("ஆயுள், மாற்றம், மறைவான செல்வம்", "Longevity, transformation, hidden wealth"),
    9:  ("தர்மம், குரு, தந்தை, பாக்யம்", "Dharma, guru, father, fortune"),
    10: ("தொழில், புகழ், அரசு, செயல்", "Career, status, government, action"),
    11: ("லாபம், நண்பர்கள், ஆசைகள்", "Gains, friends, aspirations"),
    12: ("வீண் செலவு, வெளிநாடு, மோட்சம்", "Losses, foreign lands, liberation"),
}

_FUNCTIONAL_NATURE_TEXT: dict[FunctionalNature, tuple[str, str]] = {
    FunctionalNature.YOGAKARAKA: ("யோககாரகன் — இந்த தசை மிக சாதகமான காலம்", "Yogakaraka — highly auspicious period"),
    FunctionalNature.LAGNA_LORD: ("லக்னாதிபதி — உடல்நலம் மற்றும் ஆளுமைக்கு சாதகம்", "Lagna lord — favourable for health and identity"),
    FunctionalNature.TRIKONA:    ("திரிகோண அதிபதி — பாக்யம் மற்றும் தர்மத்திற்கு உகந்தது", "Trikona lord — supports fortune and dharma"),
    FunctionalNature.KENDRA:     ("கேந்திர அதிபதி — செயல்பாடு மற்றும் கட்டமைப்பை வலுப்படுத்தும்", "Kendra lord — strengthens action and structure"),
    FunctionalNature.MARAKA:     ("மாரக அதிபதி — முக்கிய மாற்றங்களை கவனமாக கையாள வேண்டும்", "Maraka lord — handle important transitions with care"),
    FunctionalNature.DUSTHANA:   ("துஷ்டான அதிபதி — சவால்கள் சாத்தியம்; விழிப்புடன் இருக்கவும்", "Dusthana lord — challenges possible; proceed with awareness"),
    FunctionalNature.UPACHAYA:   ("உபசய அதிபதி — முயற்சியால் வளரும் காலம்", "Upachaya lord — growing period; effort yields results"),
    FunctionalNature.NEUTRAL:    ("நடுநிலை அதிபதி — நிலையான காலம்", "Neutral lord — stable period"),
}


def _dasha_transition_note(
    outgoing_lord: str,
    incoming_lord: str,
    lagna_rasi: int,
    transition_date: date,
) -> DashaTransitionNote:
    out_fn = get_functional_nature(lagna_rasi, outgoing_lord)
    in_fn = get_functional_nature(lagna_rasi, incoming_lord)

    if (out_fn in (FunctionalNature.YOGAKARAKA, FunctionalNature.TRIKONA)
            and in_fn in (FunctionalNature.DUSTHANA, FunctionalNature.MARAKA)):
        ta = f"{outgoing_lord} தசையிலிருந்து {incoming_lord} தசைக்கு மாற்றம் — சவாலான கட்டம் தொடங்கலாம். கவனமாக இருங்கள்."
        en = f"Transition from {outgoing_lord} to {incoming_lord} dasha — a more challenging phase begins. Exercise caution."
    elif (out_fn in (FunctionalNature.DUSTHANA, FunctionalNature.MARAKA)
            and in_fn in (FunctionalNature.YOGAKARAKA, FunctionalNature.TRIKONA)):
        ta = f"{incoming_lord} தசை தொடங்குகிறது — நிலைமை மேம்படும் காலம். புதிய வாய்ப்புகளுக்கு தயாராகுங்கள்."
        en = f"{incoming_lord} dasha begins — conditions improve significantly. Prepare for new opportunities."
    else:
        ta = f"{incoming_lord} தசை தொடங்குகிறது — {_PLANET_DOMAIN.get(incoming_lord, ('இந்த கிரக', 'this planet'))[0]} சார்ந்த அம்சங்கள் வலுப்படும்."
        en = f"{incoming_lord} dasha begins — {_PLANET_DOMAIN.get(incoming_lord, ('', 'this planet'))[1]} themes strengthen."

    return DashaTransitionNote(
        transitionDate=transition_date.isoformat(),
        noteTa=ta,
        noteEn=en,
    )


def _build_dasha_interpretation(
    lord: str,
    lagna_rasi: int,
    maha_lord: str | None = None,
) -> DashaInterpretation:
    houses = get_dasha_activated_houses(lord, lagna_rasi)
    house_parts_ta = [f"{h}ஆம் இடம் ({_HOUSE_DOMAIN[h][0]})" for h in houses if h in _HOUSE_DOMAIN]
    house_parts_en = [f"house {h} ({_HOUSE_DOMAIN[h][1]})" for h in houses if h in _HOUSE_DOMAIN]
    house_text_ta = "இந்த தசை " + ", ".join(house_parts_ta) + " செயல்படுத்துகிறது." if house_parts_ta else ""
    house_text_en = "This dasha activates " + ", ".join(house_parts_en) + "." if house_parts_en else ""

    domain = _PLANET_DOMAIN.get(lord, ("", ""))
    func_nature = get_functional_nature(lagna_rasi, lord)
    func_text = _FUNCTIONAL_NATURE_TEXT.get(func_nature, ("", ""))

    rel_ta = ""
    rel_en = ""
    if maha_lord and maha_lord != lord:
        maha_domain = _PLANET_DOMAIN.get(maha_lord, ("", ""))
        maha_func = get_functional_nature(lagna_rasi, maha_lord)
        maha_func_text = _FUNCTIONAL_NATURE_TEXT.get(maha_func, ("", ""))
        rel_ta = (
            f"இந்த அந்தர்தசை {maha_lord} மகாதசையின் உள்ளே இயங்குகிறது. "
            f"மகாதசை அதிபதி {maha_lord}: {maha_domain[0]}. {maha_func_text[0]}."
        )
        rel_en = (
            f"This antardasha operates within the {maha_lord} Mahadasha. "
            f"Maha lord {maha_lord}: {maha_domain[1]}. {maha_func_text[1]}."
        )

    return DashaInterpretation(
        activated_houses=houses,
        house_text_ta=house_text_ta,
        house_text_en=house_text_en,
        natural_domain_ta=f"{lord}: {domain[0]}. {func_text[0]}.",
        natural_domain_en=f"{lord}: {domain[1]}. {func_text[1]}.",
        relationship_to_maha_ta=rel_ta,
        relationship_to_maha_en=rel_en,
    )


def _serialize_period(
    period,
    transition_note: DashaTransitionNote | None = None,
    maturation: dict[str, object] | None = None,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "level": period.level,
        "lord": period.lord,
        "startDate": period.start_date,
        "endDate": period.end_date,
    }
    if transition_note is not None:
        payload["transitionNote"] = transition_note.model_dump(mode="json", by_alias=True)
    if maturation is not None:
        payload["maturationStatus"] = maturation
    return payload


def _timeline_for_level(
    timeline,
    level: Literal["maha", "antar", "pratyantar", "sookshma", "prana"],
    lagna_rasi: int,
    birth_date: date,
) -> list[dict[str, object]]:
    if level == "maha":
        rows: list[dict[str, object]] = []
        prev_lord: str | None = None
        for period in timeline.mahadashas:
            transition_note = None
            if prev_lord is not None:
                transition_note = _dasha_transition_note(
                    prev_lord,
                    period.lord,
                    lagna_rasi,
                    period.start_date,
                )
            rows.append(
                _serialize_period(
                    period,
                    transition_note=transition_note,
                    maturation=maturation_status(period.lord, birth_date, period.start_date),
                )
            )
            prev_lord = period.lord
        return rows
    if level == "antar":
        return [
            _serialize_period(period, maturation=maturation_status(period.lord, birth_date, period.start_date))
            for period in _build_subperiods(timeline.current_mahadasha, "antar")
        ]
    if level == "pratyantar":
        return [
            _serialize_period(period, maturation=maturation_status(period.lord, birth_date, period.start_date))
            for period in _build_subperiods(timeline.current_antardasha, "pratyantar")
        ]
    if level == "sookshma":
        return [
            _serialize_period(period, maturation=maturation_status(period.lord, birth_date, period.start_date))
            for period in _build_subperiods(timeline.current_pratyantardasha, "sookshma")
        ]
    if level == "prana":
        return [
            _serialize_period(period, maturation=maturation_status(period.lord, birth_date, period.start_date))
            for period in _build_subperiods(timeline.current_sookshmadasha, "prana")
        ]
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail={
            "ta": (
                f"'{level}' என்பது செல்லுபடியாகும் தசா நிலை அல்ல. "
                "சரியான தேர்வுகள்: maha, antar, pratyantar, sookshma, prana."
            ),
            "en": (
                f"Unknown dasha level '{level}'. "
                "Valid: maha, antar, pratyantar, sookshma, prana."
            ),
        },
    )


def get_chart_dasha(
    session: Session,
    chart_id: UUID,
    as_of: date,
    *,
    level: Literal["maha", "antar", "pratyantar", "sookshma", "prana"] = "pratyantar",
) -> DashaTimelineResponse:
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    moon = next(planet for planet in chart_snapshot.data.planets if planet.graha == "MOON")
    birth_jd = chart_snapshot.data.julian_day
    as_of_jd = local_midnight_as_jd_for_profile(as_of, chart_snapshot.data.birth_profile)
    lagna_rasi = chart_snapshot.data.lagna.rasi

    timeline = calculate_vimshottari_timeline(birth_jd, moon.absolute_longitude, as_of_jd)
    birth_date = chart_snapshot.data.birth_profile.birth_date_local

    maha_lord = timeline.current_mahadasha.lord
    antar_lord = timeline.current_antardasha.lord
    pratyantar_lord = timeline.current_pratyantardasha.lord

    return DashaTimelineResponse(
        data=DashaTimelineResponseData(
            chartId=chart_id,
            openingDasha=DashaOpeningWindow(
                lord=timeline.opening_lord,
                balanceYearsAtBirth=timeline.balance_years_at_birth,
            ),
            current=DashaCurrentWindow(
                mahadasha=DashaPeriodWindow(
                    lord=maha_lord,
                    startDate=timeline.current_mahadasha.start_date,
                    endDate=timeline.current_mahadasha.end_date,
                    interpretation=_build_dasha_interpretation(maha_lord, lagna_rasi),
                    maturationStatus=maturation_status(maha_lord, birth_date, as_of),
                ),
                antardasha=DashaPeriodWindow(
                    lord=antar_lord,
                    startDate=timeline.current_antardasha.start_date,
                    endDate=timeline.current_antardasha.end_date,
                    interpretation=_build_dasha_interpretation(antar_lord, lagna_rasi, maha_lord=maha_lord),
                    maturationStatus=maturation_status(antar_lord, birth_date, as_of),
                ),
                pratyantardasha=DashaPeriodWindow(
                    lord=pratyantar_lord,
                    startDate=timeline.current_pratyantardasha.start_date,
                    endDate=timeline.current_pratyantardasha.end_date,
                    interpretation=_build_dasha_interpretation(pratyantar_lord, lagna_rasi, maha_lord=maha_lord),
                    maturationStatus=maturation_status(pratyantar_lord, birth_date, as_of),
                ),
            ),
            timeline=_timeline_for_level(timeline, level, lagna_rasi, birth_date),
        ),
        meta=ResponseMeta(
            calculation_version=chart_snapshot.meta.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )
