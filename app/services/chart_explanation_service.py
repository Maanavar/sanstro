from __future__ import annotations

from datetime import UTC, date, datetime, time
from itertools import combinations
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import RASI_NAMES, house_from_reference, utc_datetime_to_julian_day
from app.calculations.chart_strength import (
    DEBILITATION_RASI,
    EXALTATION_RASI,
    MOOLATRIKONA_ZONE,
    OWN_SIGN_RASI,
    _NATURAL_ENEMIES,
    _NATURAL_FRIENDS,
    _dignity_score,
)
from app.calculations.dasha import DashaPeriod, calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.functional_nature import get_functional_nature
from app.models import Chart
from app.schemas.chart_explanation import (
    ChartExplanationAspect,
    ChartExplanationActivationSignal,
    ChartExplanationConjunctionGroup,
    ChartExplanationCoreIdentity,
    ChartExplanationCurrentActivationSection,
    ChartExplanationData,
    ChartExplanationDashaLordActivation,
    ChartExplanationHouseGroup,
    ChartExplanationMaitriPair,
    ChartExplanationPeyarchiEvent,
    ChartExplanationPeyarchiSection,
    ChartExplanationPlanet,
    ChartExplanationResponse,
    ChartExplanationSummarySection,
    ChartExplanationText,
    ChartExplanationYogaDoshamSection,
)
from app.schemas.charts import PlanetPosition, ResponseMeta
from app.services.chart_service import load_persisted_chart_response
from app.services.peyarchi_service import get_peyarchi_summary

_NATAL_PLANETS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
_KENDRA_HOUSES = frozenset({1, 4, 7, 10})
_TRIKONA_HOUSES = frozenset({1, 5, 9})
_DUSTHANA_HOUSES = frozenset({6, 8, 12})
_ASPECT_HOUSES: dict[str, frozenset[int]] = {
    "MARS": frozenset({4, 7, 8}),
    "JUPITER": frozenset({5, 7, 9}),
    "SATURN": frozenset({3, 7, 10}),
    # Vinaadi documents the node tradition used here: Rahu/Ketu use 5th, 7th, and 9th aspects.
    "RAHU": frozenset({5, 7, 9}),
    "KETU": frozenset({5, 7, 9}),
}

_HOUSE_THEMES: dict[int, ChartExplanationText] = {
    1: ChartExplanationText(ta="உடல், தன்மை, வாழ்க்கை திசை", en="self, body, life direction"),
    2: ChartExplanationText(ta="குடும்பம், பேச்சு, பண அடித்தளம்", en="family, speech, money base"),
    3: ChartExplanationText(ta="முயற்சி, துணிவு, தொடர்பு", en="effort, courage, communication"),
    4: ChartExplanationText(ta="வீடு, மன அமைதி, சொத்து", en="home, inner peace, property"),
    5: ChartExplanationText(ta="கல்வி, புத்தி, குழந்தைகள்", en="learning, intelligence, children"),
    6: ChartExplanationText(ta="சேவை, பழக்கங்கள், ஒழுங்கு", en="service, habits, discipline"),
    7: ChartExplanationText(ta="உறவுகள், கூட்டாண்மை", en="relationships, partnership"),
    8: ChartExplanationText(ta="ஆழமான மாற்றம், ஆராய்ச்சி, கவனம்", en="deep change, research, careful renewal"),
    9: ChartExplanationText(ta="தர்மம், ஆசீர்வாதம், உயர்கல்வி", en="dharma, grace, higher learning"),
    10: ChartExplanationText(ta="தொழில், பொறுப்பு, வெளிப்படை செயல்", en="career, responsibility, public work"),
    11: ChartExplanationText(ta="லாபம், நண்பர்கள், வலையமைப்பு", en="gains, friends, networks"),
    12: ChartExplanationText(ta="ஓய்வு, வெளிநாடு, ஆன்மீக விடுவிப்பு", en="rest, foreign links, spiritual release"),
}


def _bi(ta: str, en: str) -> ChartExplanationText:
    return ChartExplanationText(ta=ta, en=en)


def _public_planets(planets: list[PlanetPosition]) -> list[PlanetPosition]:
    return [planet for planet in planets if planet.graha in _NATAL_PLANETS]


def _house_group(house: int) -> str:
    if house in _DUSTHANA_HOUSES:
        return "DUSTHANA"
    if house in _KENDRA_HOUSES and house in _TRIKONA_HOUSES:
        return "KENDRA_TRIKONA"
    if house in _KENDRA_HOUSES:
        return "KENDRA"
    if house in _TRIKONA_HOUSES:
        return "TRIKONA"
    return "OTHER"


def _dignity_label(planet: PlanetPosition) -> str:
    graha = planet.graha
    if DEBILITATION_RASI.get(graha) == planet.rasi:
        return "DEBILITATED"
    if EXALTATION_RASI.get(graha) == planet.rasi:
        return "EXALTED"
    mt = MOOLATRIKONA_ZONE.get(graha)
    if mt:
        mt_rasi, mt_start, mt_end = mt
        if planet.rasi == mt_rasi and mt_start <= planet.degree_in_rasi < mt_end:
            return "MOOLATRIKONA"
    if planet.rasi in OWN_SIGN_RASI.get(graha, frozenset()):
        return "OWN_SIGN"
    sign_lord = {
        1: "MARS",
        2: "VENUS",
        3: "MERCURY",
        4: "MOON",
        5: "SUN",
        6: "MERCURY",
        7: "VENUS",
        8: "MARS",
        9: "JUPITER",
        10: "SATURN",
        11: "SATURN",
        12: "JUPITER",
    }.get(planet.rasi)
    if sign_lord in _NATURAL_FRIENDS.get(graha, frozenset()):
        return "FRIEND_SIGN"
    if sign_lord in _NATURAL_ENEMIES.get(graha, frozenset()):
        return "ENEMY_SIGN"
    return "NEUTRAL_SIGN"


def _dignity_text(dignity: str) -> ChartExplanationText:
    mapping = {
        "EXALTED": _bi("உச்சம்: இயல்பான பலம் தெளிவாக வெளிப்படும்.", "Exalted: natural strength expresses clearly."),
        "DEBILITATED": _bi("நீசம்: மெதுவான ஆதரவும் ஒழுங்கும் தேவை.", "Debilitated: steady support and structure are needed."),
        "MOOLATRIKONA": _bi("மூலத்திரிகோணம்: கிரக சக்தி தெளிவான திசையில் இயங்கும்.", "Moolatrikona: the planet acts with focused strength."),
        "OWN_SIGN": _bi("சொந்த ராசி: நிலையான ஆதரவு கிடைக்கும்.", "Own sign: stable support is available."),
        "FRIEND_SIGN": _bi("நட்பு ராசி: சூழல் ஒத்துழைப்பாக இருக்கும்.", "Friendly sign: the setting is cooperative."),
        "ENEMY_SIGN": _bi("பகை ராசி: கவனமாக கையாளும் போது பலன் சமநிலையாகும்.", "Enemy sign: results balance better with careful handling."),
        "NEUTRAL_SIGN": _bi("சம ராசி: பலன் தசை மற்றும் கோசாரம் மூலம் மாறும்.", "Neutral sign: results vary by dasha and transit."),
    }
    return mapping[dignity]


def _planet_explanation(planet: PlanetPosition, dignity: str, functional_nature: str) -> ChartExplanationText:
    dignity_text = _dignity_text(dignity)
    theme = _HOUSE_THEMES[planet.house_from_lagna]
    ta = (
        f"{planet.graha} {planet.house_from_lagna}-ஆம் வீட்டில் உள்ளது; இது {theme.ta} துறையை சுட்டுகிறது. "
        f"{dignity_text.ta} செயல்பாட்டு பங்கு: {functional_nature}."
    )
    en = (
        f"{planet.graha} is in house {planet.house_from_lagna}, pointing to {theme.en}. "
        f"{dignity_text.en} Functional role: {functional_nature}."
    )
    return _bi(ta, en)


def _build_planet_sections(planets: list[PlanetPosition], lagna_rasi: int) -> tuple[list[ChartExplanationPlanet], dict[str, str]]:
    functional = {planet: get_functional_nature(lagna_rasi, planet).value for planet in _NATAL_PLANETS}
    items: list[ChartExplanationPlanet] = []
    for planet in planets:
        dignity = _dignity_label(planet)
        dignity_score = _dignity_score(planet.graha, planet.rasi, planet.absolute_longitude)
        fn = functional.get(planet.graha, "NEUTRAL")
        items.append(
            ChartExplanationPlanet(
                graha=planet.graha,
                house_from_lagna=planet.house_from_lagna,
                rasi=planet.rasi,
                rasi_name=planet.rasi_name,
                nakshatra=planet.nakshatra,
                nakshatra_name=planet.nakshatra_name,
                pada=planet.pada,
                dignity=dignity,
                dignity_score=dignity_score,
                strength_score=planet.strength_score,
                is_retrograde=planet.is_retrograde,
                is_combust=planet.is_combust,
                is_vargottama=planet.is_vargottama,
                d9_rasi=planet.d9_rasi,
                house_group=_house_group(planet.house_from_lagna),
                functional_nature=fn,
                explanation=_planet_explanation(planet, dignity, fn),
            )
        )
    return items, functional


def _relationship(a: str, b: str) -> str:
    if b in _NATURAL_ENEMIES.get(a, frozenset()) or a in _NATURAL_ENEMIES.get(b, frozenset()):
        return "HOSTILE"
    if b in _NATURAL_FRIENDS.get(a, frozenset()) or a in _NATURAL_FRIENDS.get(b, frozenset()):
        return "FRIENDLY"
    return "NEUTRAL"


def _relationship_text(a: str, b: str, relationship: str) -> ChartExplanationText:
    if relationship == "FRIENDLY":
        return _bi(
            f"{a} மற்றும் {b} இயல்பான நட்பு ஆதரவை பகிர்கின்றன.",
            f"{a} and {b} share natural friendship support.",
        )
    if relationship == "HOSTILE":
        return _bi(
            f"{a} மற்றும் {b} ஒன்றாக இருந்தால் கவனமாக சமநிலைப்படுத்த வேண்டும்.",
            f"{a} and {b} together need careful balancing.",
        )
    return _bi(
        f"{a} மற்றும் {b} நடுநிலை கூட்டமாக செயல்படுகின்றன.",
        f"{a} and {b} act as neutral company.",
    )


def _build_conjunctions(planets: list[PlanetPosition], lagna_rasi: int) -> list[ChartExplanationConjunctionGroup]:
    by_rasi: dict[int, list[PlanetPosition]] = {}
    for planet in planets:
        by_rasi.setdefault(planet.rasi, []).append(planet)

    groups: list[ChartExplanationConjunctionGroup] = []
    for rasi, group_planets in sorted(by_rasi.items()):
        if len(group_planets) < 2:
            continue
        pairs: list[ChartExplanationMaitriPair] = []
        group_tone = "NEUTRAL"
        for a, b in combinations(group_planets, 2):
            relation = _relationship(a.graha, b.graha)
            if relation == "HOSTILE":
                group_tone = "HOSTILE"
            elif relation == "FRIENDLY" and group_tone != "HOSTILE":
                group_tone = "FRIENDLY"
            pairs.append(
                ChartExplanationMaitriPair(
                    planet_a=a.graha,
                    planet_b=b.graha,
                    relationship=relation,
                    explanation=_relationship_text(a.graha, b.graha, relation),
                )
            )
        house = house_from_reference(lagna_rasi, rasi)
        planets_label = ", ".join(p.graha for p in group_planets)
        groups.append(
            ChartExplanationConjunctionGroup(
                rasi=rasi,
                rasi_name=group_planets[0].rasi_name,
                house_from_lagna=house,
                planets=[p.graha for p in group_planets],
                relationship_tone=group_tone,
                pairs=pairs,
                explanation=_bi(
                    f"{planets_label} {house}-ஆம் வீட்டில் ஒன்றாக நிற்கின்றன; இந்த கூட்டம் {group_tone} தன்மையை காட்டுகிறது.",
                    f"{planets_label} stand together in house {house}; this company is {group_tone.lower()}.",
                ),
            )
        )
    return groups


def _aspect_houses(planet: str) -> frozenset[int]:
    return _ASPECT_HOUSES.get(planet, frozenset({7}))


def _aspect_type(planet: str, aspect_house: int) -> str:
    if aspect_house == 7:
        return "STANDARD_7TH"
    return f"{planet}_SPECIAL_{aspect_house}TH"


def _build_aspects(planets: list[PlanetPosition]) -> list[ChartExplanationAspect]:
    aspects: list[ChartExplanationAspect] = []
    for source in planets:
        for target in planets:
            if source.graha == target.graha:
                continue
            aspect_house = house_from_reference(source.rasi, target.rasi)
            if aspect_house not in _aspect_houses(source.graha):
                continue
            aspects.append(
                ChartExplanationAspect(
                    source_planet=source.graha,
                    target_planet=target.graha,
                    source_house=source.house_from_lagna,
                    target_house=target.house_from_lagna,
                    aspect_house=aspect_house,
                    aspect_type=_aspect_type(source.graha, aspect_house),
                    explanation=_bi(
                        f"{source.graha} {target.graha}-ஐ {aspect_house}-ஆம் பார்வையில் பார்க்கிறது.",
                        f"{source.graha} aspects {target.graha} by its {aspect_house}th-house drishti.",
                    ),
                )
            )
    return aspects


def _build_house_groups(planets: list[PlanetPosition]) -> list[ChartExplanationHouseGroup]:
    groups = [
        (
            "KENDRA",
            [1, 4, 7, 10],
            _bi(
                "கேந்திர வீடுகள் வாழ்க்கையின் வெளிப்படைத் தூண்கள். இங்குள்ள கிரகங்கள் தெளிவாக செயல்படும்.",
                "Kendra houses are visible pillars of life. Planets here act clearly.",
            ),
        ),
        (
            "TRIKONA",
            [1, 5, 9],
            _bi(
                "திரிகோண வீடுகள் திறமை, புண்ணியம், வளர்ச்சி வழிகளை காட்டும்.",
                "Trikona houses show talent, grace, and growth channels.",
            ),
        ),
        (
            "DUSTHANA",
            [6, 8, 12],
            _bi(
                "துஷ்டான வீடுகள் கவனம், திருத்தம், ஒழுங்கு மூலம் சமநிலைப்படுத்தப்படும்.",
                "Dusthana houses are balanced through care, correction, and discipline.",
            ),
        ),
    ]
    result: list[ChartExplanationHouseGroup] = []
    for name, houses, explanation in groups:
        result.append(
            ChartExplanationHouseGroup(
                group=name,
                houses=houses,
                planets=[planet.graha for planet in planets if planet.house_from_lagna in houses],
                explanation=explanation,
            )
        )
    return result


def _activation_tone(
    planet: PlanetPosition,
    dignity: str,
    functional_nature: str,
    transit_house_from_moon: int,
    transit_house_from_lagna: int,
) -> str:
    score = planet.strength_score if planet.strength_score is not None else 50
    if functional_nature in {"YOGAKARAKA", "LAGNA_LORD", "TRIKONA"}:
        score += 12
    elif functional_nature in {"DUSTHANA", "MARAKA", "UPACHAYA"}:
        score -= 10

    if dignity in {"EXALTED", "MOOLATRIKONA", "OWN_SIGN"}:
        score += 8
    elif dignity in {"DEBILITATED", "ENEMY_SIGN"}:
        score -= 8

    if transit_house_from_moon in {2, 3, 5, 7, 9, 10, 11}:
        score += 8
    elif transit_house_from_moon in {6, 8, 12}:
        score -= 8

    if transit_house_from_lagna in {1, 5, 9, 10, 11}:
        score += 5
    elif transit_house_from_lagna in {6, 8, 12}:
        score -= 5

    if score >= 70:
        return "SUPPORT"
    if score <= 44:
        return "CAUTION"
    return "STEADY"


def _tone_text(tone: str) -> ChartExplanationText:
    if tone == "SUPPORT":
        return _bi("ஆதரவு", "support")
    if tone == "CAUTION":
        return _bi("கவனத்துடன் செயல்பட வேண்டிய", "needs care")
    return _bi("சமநிலை", "steady")


def _activation_life_areas(natal_house: int, transit_house_from_lagna: int) -> list[str]:
    values = [_HOUSE_THEMES[natal_house].en, _HOUSE_THEMES[transit_house_from_lagna].en]
    result: list[str] = []
    for value in values:
        if value not in result:
            result.append(value)
    return result


def _activation_signal_text(source_planet: str, active_lord: str, signal_type: str) -> ChartExplanationText:
    if signal_type == "TRANSIT_CONJUNCTION":
        return _bi(
            f"கோசார {source_planet} நடப்பு {active_lord} தசை கிரகத்தின் பிறப்பு ராசியை தொடுகிறது.",
            f"Transit {source_planet} touches the natal sign of the active {active_lord} period lord.",
        )
    if signal_type == "DASHA_LORD_RETURN":
        return _bi(
            f"{active_lord} இப்போது தனது பிறப்பு ராசியை மீண்டும் தொடுகிறது; அந்த கிரகத் துறை அதிக கவனம் பெறுகிறது.",
            f"{active_lord} is transiting its natal sign, so that planet's themes receive extra focus.",
        )
    return _bi(
        f"கோசார {source_planet} நடப்பு {active_lord} தசை கிரகத்தை பார்வையால் தொடுகிறது.",
        f"Transit {source_planet} aspects the natal {active_lord} period lord.",
    )


def _activation_signals(
    active_lord: str,
    natal_planet: PlanetPosition,
    transit_bodies: dict[str, object],
) -> list[ChartExplanationActivationSignal]:
    signals: list[ChartExplanationActivationSignal] = []
    active_transit = transit_bodies.get(active_lord)
    if active_transit is not None and active_transit.rasi == natal_planet.rasi:
        signals.append(
            ChartExplanationActivationSignal(
                source_planet=active_lord,
                signal_type="DASHA_LORD_RETURN",
                explanation=_activation_signal_text(active_lord, active_lord, "DASHA_LORD_RETURN"),
            )
        )

    for source in ("JUPITER", "SATURN", "RAHU", "KETU"):
        body = transit_bodies.get(source)
        if body is None:
            continue
        aspect_house = house_from_reference(body.rasi, natal_planet.rasi)
        if aspect_house == 1:
            signal_type = "TRANSIT_CONJUNCTION"
        elif aspect_house in _aspect_houses(source):
            signal_type = f"TRANSIT_ASPECT_{aspect_house}TH"
        else:
            continue
        signals.append(
            ChartExplanationActivationSignal(
                source_planet=source,
                signal_type=signal_type,
                explanation=_activation_signal_text(source, active_lord, signal_type),
            )
        )
    return signals


def _activation_explanation(
    level: str,
    period: DashaPeriod,
    natal_planet: PlanetPosition,
    transit_house_from_moon: int,
    transit_house_from_lagna: int,
    tone: str,
) -> ChartExplanationText:
    tone_copy = _tone_text(tone)
    natal_theme = _HOUSE_THEMES[natal_planet.house_from_lagna]
    transit_theme = _HOUSE_THEMES[transit_house_from_lagna]
    return _bi(
        (
            f"{level} நிலையில் {period.lord} செயல்படும் கிரகம். பிறப்பு ஜாதகத்தில் இது லக்னத்திலிருந்து "
            f"{natal_planet.house_from_lagna}-ஆம் இடத்தில் இருந்து {natal_theme.ta} துறையை இயக்குகிறது. "
            f"இப்போது கோசாரத்தில் லக்னத்திலிருந்து {transit_house_from_lagna}-ஆம் இடம், சந்திரனிலிருந்து "
            f"{transit_house_from_moon}-ஆம் இடம்; இதனால் இந்த அடுக்கு {tone_copy.ta} போக்கில் படிக்கப்படுகிறது."
        ),
        (
            f"At the {level} level, {period.lord} is the operating planet. Natally it sits in house "
            f"{natal_planet.house_from_lagna} from Lagna, activating {natal_theme.en}. Right now it transits "
            f"house {transit_house_from_lagna} from Lagna and house {transit_house_from_moon} from Moon, so this "
            f"layer is read as {tone_copy.en}."
        ),
    )


def _build_current_activation_section(
    planets: list[PlanetPosition],
    lagna_rasi: int,
    moon: PlanetPosition,
    timeline,
    as_of: date,
    as_of_jd: float,
) -> ChartExplanationCurrentActivationSection:
    natal_by_planet = {planet.graha: planet for planet in planets}
    transit = calculate_sidereal_planets(as_of_jd)
    periods: list[tuple[str, DashaPeriod]] = [
        ("MAHADASHA", timeline.current_mahadasha),
        ("BHUKTI", timeline.current_antardasha),
        ("ANTARAM", timeline.current_pratyantardasha),
    ]

    active_lords: list[ChartExplanationDashaLordActivation] = []
    all_signals: list[ChartExplanationActivationSignal] = []
    tones: list[str] = []

    for level, period in periods:
        natal_planet = natal_by_planet.get(period.lord)
        transit_body = transit.bodies.get(period.lord)
        if natal_planet is None or transit_body is None:
            continue

        dignity = _dignity_label(natal_planet)
        functional_nature = get_functional_nature(lagna_rasi, period.lord).value
        transit_house_from_moon = house_from_reference(moon.rasi, transit_body.rasi)
        transit_house_from_lagna = house_from_reference(lagna_rasi, transit_body.rasi)
        tone = _activation_tone(
            natal_planet,
            dignity,
            functional_nature,
            transit_house_from_moon,
            transit_house_from_lagna,
        )
        signals = _activation_signals(period.lord, natal_planet, transit.bodies)
        tones.append(tone)
        all_signals.extend(signals)

        active_lords.append(
            ChartExplanationDashaLordActivation(
                level=level,
                lord=period.lord,
                start_date=period.start_date,
                end_date=period.end_date,
                natal_house_from_lagna=natal_planet.house_from_lagna,
                natal_house_from_moon=house_from_reference(moon.rasi, natal_planet.rasi),
                natal_rasi=natal_planet.rasi,
                natal_rasi_name=natal_planet.rasi_name,
                natal_dignity=dignity,
                natal_strength_score=natal_planet.strength_score if natal_planet.strength_score is not None else 50,
                functional_nature=functional_nature,
                transit_rasi=transit_body.rasi,
                transit_rasi_name=RASI_NAMES[transit_body.rasi],
                transit_house_from_moon=transit_house_from_moon,
                transit_house_from_lagna=transit_house_from_lagna,
                transit_is_retrograde=transit_body.is_retrograde,
                period_tone=tone,
                life_areas=_activation_life_areas(natal_planet.house_from_lagna, transit_house_from_lagna),
                transit_signals=signals,
                explanation=_activation_explanation(
                    level,
                    period,
                    natal_planet,
                    transit_house_from_moon,
                    transit_house_from_lagna,
                    tone,
                ),
            )
        )

    chain = " / ".join(f"{period.lord} {level}" for level, period in periods)
    support_count = sum(1 for tone in tones if tone == "SUPPORT")
    caution_count = sum(1 for tone in tones if tone == "CAUTION")
    period_summary = _bi(
        f"நடப்பு தசைச் சங்கிலி: {chain}. மகாதசை முக்கிய கரு, புக்தி துணை கரு, அந்தரம் உடனடி தூண்டுதல்.",
        f"Current dasha chain: {chain}. Mahadasha is the main theme, Bhukti the sub-theme, and Antaram the immediate trigger.",
    )
    transit_summary = _bi(
        (
            f"கோசாரத்தில் {len(all_signals)} முக்கிய தொடுதல்கள் உள்ளன; {support_count} அடுக்குகள் ஆதரவு போக்கிலும் "
            f"{caution_count} அடுக்குகள் கவன போக்கிலும் படிக்கப்படுகின்றன."
        ),
        (
            f"Current gochar shows {len(all_signals)} major contacts to the active period lords; "
            f"{support_count} layers read supportive and {caution_count} layers ask for care."
        ),
    )

    return ChartExplanationCurrentActivationSection(
        as_of=as_of,
        period_summary=period_summary,
        transit_summary=transit_summary,
        active_lords=active_lords,
        explanation=_bi(
            "இந்த பகுதி பிறப்பு ஜாதக வாக்குறுதியையும் நடப்பு தசை/புக்தி/அந்தரம் மற்றும் கோசார இயக்கத்தையும் இணைக்கிறது.",
            "This section connects natal promise with the current Mahadasha, Bhukti, Antaram, and gochar movement.",
        ),
    )


def _summary_section(planets: list[PlanetPosition]) -> ChartExplanationSummarySection:
    scored = [planet for planet in planets if planet.strength_score is not None]
    strongest = max(scored, key=lambda planet: planet.strength_score, default=None)
    weakest = min(scored, key=lambda planet: planet.strength_score, default=None)
    kendra_count = sum(1 for planet in planets if planet.house_from_lagna in _KENDRA_HOUSES)
    dusthana_count = sum(1 for planet in planets if planet.house_from_lagna in _DUSTHANA_HOUSES)
    positives = [
        _bi(
            f"{kendra_count} கிரகங்கள் கேந்திரத்தில் உள்ளன; செயல்பாட்டு துறைகள் தெளிவாக இயங்கும் போக்கு உள்ளது.",
            f"{kendra_count} planets are in Kendra houses, indicating a tendency for visible life areas to stay active.",
        )
    ]
    cautions = [
        _bi(
            f"{dusthana_count} கிரகங்கள் துஷ்டான வீடுகளில் உள்ளன; ஓய்வு, ஒழுங்கு, அளவான முடிவுகள் உதவும்.",
            f"{dusthana_count} planets are in Dusthana houses; rest, routines, and measured choices help.",
        )
    ]
    if strongest is not None:
        positives.append(
            _bi(
                f"{strongest.graha} அதிக பலம் பெற்ற கிரகமாக தெரிகிறது; அதன் வீட்டு துறை ஆதரவாக இயங்கும்.",
                f"{strongest.graha} appears strongest; its house themes can act as a support channel.",
            )
        )
    if weakest is not None:
        cautions.append(
            _bi(
                f"{weakest.graha} அதிக ஆதரவு தேவைப்படும் கிரகமாக தெரிகிறது; அந்த துறையில் மெதுவான திட்டம் நல்லது.",
                f"{weakest.graha} appears to need the most support; a slower plan helps that area.",
            )
        )
    return ChartExplanationSummarySection(
        strongest_planet=strongest.graha if strongest else None,
        weakest_planet=weakest.graha if weakest else None,
        positives=positives,
        cautions=cautions,
    )


def _peyarchi_text(planet: str, house_from_moon: int, house_from_lagna: int, sani_cycle_after: str | None) -> ChartExplanationText:
    if planet == "SATURN":
        stage = sani_cycle_after or "SATURN_RESTRUCTURING"
        return _bi(
            f"சனி சந்திரனிலிருந்து {house_from_moon}-ஆம் இடத்தையும் லக்னத்திலிருந்து {house_from_lagna}-ஆம் இடத்தையும் தொடுகிறது. {stage} ஒழுங்கு, பொறுப்பு, நீண்டகால சீரமைப்பை வலியுறுத்தும்.",
            f"Saturn touches house {house_from_moon} from Moon and house {house_from_lagna} from Lagna. {stage} emphasizes discipline, responsibility, and long-term restructuring.",
        )
    if planet == "JUPITER":
        quality = "supportive" if house_from_moon in {2, 5, 7, 9, 11} else "careful" if house_from_moon in {6, 8, 12} else "steady"
        return _bi(
            f"குரு சந்திரனிலிருந்து {house_from_moon}-ஆம் இடம் ({quality}) மற்றும் லக்னத்திலிருந்து {house_from_lagna}-ஆம் இடம். அறிவு, வளர்ச்சி, வாய்ப்பு துறைகள் இயக்கம் பெறும்.",
            f"Jupiter moves to house {house_from_moon} from Moon ({quality}) and house {house_from_lagna} from Lagna. Learning, growth, and opportunity themes are activated.",
        )
    if planet == "RAHU":
        opposite_house = ((house_from_moon + 6 - 1) % 12) + 1
        rahu_theme = _HOUSE_THEMES[house_from_moon]
        ketu_theme = _HOUSE_THEMES[opposite_house]
        return _bi(
            f"ராகு/கேது அச்சு {house_from_moon}-{opposite_house} வீடுகளை இயக்குகிறது. ராகு {house_from_moon}-ஆம் இடத்தில் "
            f"({rahu_theme.ta}) கவனத்தை பெரிதாக்கும்; எதிர் அச்சில் கேது {opposite_house}-ஆம் இடம் ({ketu_theme.ta}) "
            f"விடுவிப்பு மற்றும் உள்ளார்ந்த திருத்தத்தை கேட்கும்.",
            f"The Rahu/Ketu axis activates houses {house_from_moon} and {opposite_house} from Moon. Rahu magnifies "
            f"{rahu_theme.en}, while Ketu trims the opposite axis of {ketu_theme.en}; ambition works best with grounding.",
        )
    opposite_house = ((house_from_moon + 6 - 1) % 12) + 1
    ketu_theme = _HOUSE_THEMES[house_from_moon]
    rahu_theme = _HOUSE_THEMES[opposite_house]
    return _bi(
        f"ராகு/கேது அச்சு {opposite_house}-{house_from_moon} வீடுகளை இயக்குகிறது. கேது {house_from_moon}-ஆம் இடத்தில் "
        f"({ketu_theme.ta}) எளிமை மற்றும் உள்ளார்ந்த திருத்தத்தை தரும்; எதிர் அச்சில் ராகு {opposite_house}-ஆம் இடம் "
        f"({rahu_theme.ta}) ஆசை மற்றும் வெளிப்படை இயக்கத்தை பெரிதாக்கும்.",
        f"The Rahu/Ketu axis activates houses {opposite_house} and {house_from_moon} from Moon. Ketu simplifies "
        f"{ketu_theme.en}, while Rahu magnifies the opposite axis of {rahu_theme.en}; release works best when desire stays measured.",
    )


def _build_peyarchi_section(session: Session, chart_id: UUID, *, as_of: date, window_days: int) -> ChartExplanationPeyarchiSection:
    summary = get_peyarchi_summary(session, chart_id, as_of=as_of, window_days=window_days)
    events = [
        ChartExplanationPeyarchiEvent(
            planet=event.planet,
            event_date=event.peyarchi_date_local,
            from_rasi=event.from_rasi,
            to_rasi=event.to_rasi,
            house_from_moon=event.impact_from_moon,
            house_from_lagna=event.impact_from_lagna,
            sani_cycle_after=event.sani_cycle_after,
            explanation=_peyarchi_text(
                event.planet,
                event.impact_from_moon,
                event.impact_from_lagna,
                event.sani_cycle_after,
            ),
        )
        for event in summary.data
    ]
    return ChartExplanationPeyarchiSection(
        as_of=as_of,
        events=events,
        explanation=_bi(
            "பெயர்ச்சி விளக்கம் சந்திர ராசி மற்றும் லக்னம் இரண்டிலிருந்தும் கணிக்கப்பட்டது.",
            "Peyarchi notes are counted from both natal Moon and Lagna.",
        ),
    )


def build_chart_explanation(
    session: Session,
    chart_id: UUID,
    *,
    as_of: date,
    peyarchi_window_days: int = 700,
) -> ChartExplanationResponse:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")

    chart_response = load_persisted_chart_response(session, chart_id)
    data = chart_response.data
    planets = _public_planets(data.planets)
    moon = next((planet for planet in planets if planet.graha == "MOON"), None)
    if moon is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Chart is missing Moon position.")

    as_of_dt = datetime.combine(as_of, time(hour=12), tzinfo=UTC)
    as_of_jd = utc_datetime_to_julian_day(as_of_dt)
    timeline = calculate_vimshottari_timeline(
        data.julian_day,
        moon.absolute_longitude,
        as_of_jd,
    )

    planet_sections, functional_nature = _build_planet_sections(planets, data.lagna.rasi)
    core_identity = ChartExplanationCoreIdentity(
        lagna_rasi=data.lagna.rasi_name,
        moon_rasi=moon.rasi_name,
        janma_nakshatra=moon.nakshatra_name,
        janma_pada=moon.pada,
        current_mahadasha=timeline.current_mahadasha.lord,
        current_antardasha=timeline.current_antardasha.lord,
        current_pratyantardasha=timeline.current_pratyantardasha.lord,
        explanation=_bi(
            "இந்த பகுதி லக்னம், சந்திர ராசி, நடப்பு தசை ஆகியவற்றை ஒரே அடிப்படையாக இணைக்கிறது.",
            "This section connects Lagna, Moon sign, and the current dasha as the chart's working base.",
        ),
    )

    response = ChartExplanationResponse(
        data=ChartExplanationData(
            chart_id=chart_id,
            core_identity=core_identity,
            planets=planet_sections,
            conjunctions=_build_conjunctions(planets, data.lagna.rasi),
            aspects=_build_aspects(planets),
            house_groups=_build_house_groups(planets),
            functional_nature=functional_nature,
            yoga_dosham=ChartExplanationYogaDoshamSection(
                yogas=data.yogas,
                doshams=data.doshams,
                explanation=_bi(
                    "யோகங்கள் மற்றும் தோஷங்கள் ஏற்கனவே கணிக்கப்பட்ட ஜாதக விதிகளிலிருந்து எடுத்தவை.",
                    "Yogas and doshams are reused from the already computed chart rules.",
                ),
            ),
            current_activation=_build_current_activation_section(
                planets,
                data.lagna.rasi,
                moon,
                timeline,
                as_of,
                as_of_jd,
            ),
            summary=_summary_section(planets),
            peyarchi=_build_peyarchi_section(
                session,
                chart_id,
                as_of=as_of,
                window_days=peyarchi_window_days,
            ),
            method_note=_bi(
                "முறை: லக்னம் முழு ராசி வீடு, இயற்கை கிரக நட்பு, கேந்திர/திரிகோண/துஷ்டான வகை, 7-ஆம் பார்வை மற்றும் செவ்வாய்/குரு/சனி சிறப்பு பார்வைகள். ராகு/கேது 5/7/9 பார்வை மரபு இங்கே ஆவணப்படுத்தப்பட்டு பயன்படுத்தப்படுகிறது.",
                "Method: whole-sign Lagna houses, natural graha friendship, Kendra/Trikona/Dusthana grouping, standard 7th aspects, and special Mars/Jupiter/Saturn aspects. Rahu/Ketu 5/7/9 aspects are documented here as the chosen node tradition.",
            ),
        ),
        meta=ResponseMeta(
            calculation_version=chart.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )
    return response
