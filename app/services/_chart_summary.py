"""Chart summary and Jadhagam report builders."""
from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.ashtakavarga import compute_bhinnashtakavarga
from app.calculations.astro import house_from_reference, navamsa_rasi_from_degree, utc_datetime_to_julian_day
from app.calculations.chart_strength import compute_natal_planet_score, detect_planetary_wars
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.functional_nature import get_functional_nature
from app.calculations.house_lords import compute_house_lord_report
from app.calculations.transits import RASI_NAMES, classify_sani_cycle, is_combust
from app.models import Chart
from app.models.user_life_events import UserLifeEvent
from app.schemas.charts import (
    AdhipathiReading,
    ChartCalculateResponse,
    ChartSummaryData,
    ChartSummaryResponse,
    ChartSummaryText,
    JadhagamReportAgeWiseTimeline,
    JadhagamReportBirthProfile,
    JadhagamReportCoreIdentity,
    JadhagamReportDashaAnalysis,
    JadhagamReportData,
    JadhagamReportExecutiveSummary,
    JadhagamReportNavamsaSummary,
    JadhagamReportPlanetStrengthItem,
    JadhagamReportPlanetStrengthSummary,
    JadhagamReportPrimaryConcern,
    JadhagamReportRasiSummary,
    JadhagamReportResponse,
    JadhagamReportYogaDoshamSummary,
    ResponseMeta,
)
from app.services._chart_build import RASI_NUMBERS, _value
from app.services._chart_persist import _require_active_birth_profile, load_persisted_chart_response
from app.services._chart_planets import (
    _NATAL_GRAHAS,
    _aspect_counts,
    _is_daytime_birth,
    _paksha_is_shukla,
    _speed_ratio,
)
from app.services.age_phase_service import (
    build_chart_gist,
    build_executive_summary,
    build_year_guidance,
    get_active_life_phases,
    get_age_based_practical_guidance,
    get_age_based_remedies,
)
from app.services.location_service import local_midnight_as_jd_for_profile
from app.services.primary_concern_service import infer_primary_concerns
from app.services.rectification_service import validate_chart_against_events


def _gist_text(
    *,
    current_age: int,
    lagna_rasi: str,
    moon_rasi: str,
    nakshatra: str,
    mahadasha_lord: str,
    antardasha_lord: str,
) -> ChartSummaryText:
    gist = build_chart_gist(
        current_age=current_age,
        lagna_rasi=lagna_rasi,
        moon_rasi=moon_rasi,
        nakshatra=nakshatra,
        mahadasha_lord=mahadasha_lord,
        antardasha_lord=antardasha_lord,
    )
    return ChartSummaryText(ta=gist["ta"], en=gist["en"])


def _current_age(birth_date_local: date, today: date) -> int:
    age = today.year - birth_date_local.year
    if (today.month, today.day) < (birth_date_local.month, birth_date_local.day):
        age -= 1
    return age


def _functional_nature_table(chart_response: ChartCalculateResponse) -> dict[str, str]:
    lagna_rasi = chart_response.data.lagna.rasi
    node_rasi_map = {
        planet.graha: planet.rasi
        for planet in chart_response.data.planets
        if planet.graha in ("RAHU", "KETU")
    }
    return {
        planet: get_functional_nature(lagna_rasi, planet, node_rasi_map=node_rasi_map).value
        for planet in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
    }


def _adhipathi_report(chart_response: ChartCalculateResponse) -> list[AdhipathiReading]:
    """Bhava-lord (அதிபதி) placement report from the persisted chart (audit T3)."""
    planets = chart_response.data.planets
    lagna_rasi = chart_response.data.lagna.rasi
    planet_rasis = {p.graha: p.rasi for p in planets}
    planet_scores = {p.graha: p.strength_score for p in planets}
    node_rasi_map = {p.graha: p.rasi for p in planets if p.graha in ("RAHU", "KETU")}
    readings = compute_house_lord_report(
        lagna_rasi, planet_rasis, planet_scores, node_rasi_map=node_rasi_map
    )
    return [
        AdhipathiReading(
            house=r.house,
            houseRasi=r.house_rasi,
            lord=r.lord,
            lordRasi=r.lord_rasi,
            lordHouse=r.lord_house,
            strengthScore=r.strength_score,
            strengthBand=r.strength_band,
            functionalNature=r.functional_nature,
            adhipathiTa=r.adhipathi_ta,
            adhipathiEn=r.adhipathi_en,
            significationsTa=r.significations_ta,
            significationsEn=r.significations_en,
            readingTa=r.reading_ta,
            readingEn=r.reading_en,
        )
        for r in readings
    ]


def _ashtakavarga_table(chart_response: ChartCalculateResponse) -> dict[str, dict[int, int]]:
    natal_rasi_map = {planet.graha: planet.rasi for planet in chart_response.data.planets}
    natal_rasi_map["LAGNA"] = chart_response.data.lagna.rasi
    return compute_bhinnashtakavarga(natal_rasi_map)


def get_chart_summary_from_snapshot(
    chart_response: ChartCalculateResponse,
    *,
    language: str = "ta-en",
) -> ChartSummaryResponse:
    birth_profile = chart_response.data.birth_profile
    moon = next(planet for planet in chart_response.data.planets if planet.graha == "MOON")
    d9_lagna_rasi = navamsa_rasi_from_degree(chart_response.data.lagna.absolute_longitude)
    timeline = calculate_vimshottari_timeline(
        chart_response.data.julian_day,
        moon.absolute_longitude,
        utc_datetime_to_julian_day(datetime.now(tz=UTC)),
    )
    today = datetime.now(tz=UTC).date()
    current_age = _current_age(birth_profile.birth_date_local, today)

    return ChartSummaryResponse(
        data=ChartSummaryData(
            chart_id=chart_response.data.chart_id,
            display_name=birth_profile.display_name,
            current_age=current_age,
            lagna_rasi=chart_response.data.lagna.rasi_name,
            moon_rasi=moon.rasi_name,
            d9_lagna_rasi=RASI_NAMES[d9_lagna_rasi],
            d9_moon_rasi=RASI_NAMES[moon.d9_rasi] if isinstance(moon.d9_rasi, int) else None,
            janma_nakshatra=moon.nakshatra_name,
            janma_pada=moon.pada,
            current_mahadasha=timeline.current_mahadasha.lord,
            current_antardasha=timeline.current_antardasha.lord,
            functional_nature=_functional_nature_table(chart_response),
            adhipathi_report=_adhipathi_report(chart_response),
            ashtakavarga=_ashtakavarga_table(chart_response),
            planets=chart_response.data.planets,
            yogas=chart_response.data.yogas,
            chart_validation_status=None,
            primary_language_text=_gist_text(
                current_age=current_age,
                lagna_rasi=chart_response.data.lagna.rasi_name,
                moon_rasi=moon.rasi_name,
                nakshatra=moon.nakshatra_name,
                mahadasha_lord=timeline.current_mahadasha.lord,
                antardasha_lord=timeline.current_antardasha.lord,
            ),
        ),
        meta=ResponseMeta(
            calculation_version=chart_response.meta.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_chart_summary(session: Session, chart_id: UUID, *, language: str = "ta-en") -> ChartSummaryResponse:
    chart_response = load_persisted_chart_response(session, chart_id)
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    birth_profile = _require_active_birth_profile(session, chart.birth_profile_id)

    moon = next(planet for planet in chart_response.data.planets if planet.graha == "MOON")
    d9_lagna_rasi = navamsa_rasi_from_degree(chart_response.data.lagna.absolute_longitude)
    timeline = calculate_vimshottari_timeline(
        chart_response.data.julian_day,
        moon.absolute_longitude,
        utc_datetime_to_julian_day(datetime.now(tz=UTC)),
    )
    today = datetime.now(tz=UTC).date()
    validation_status: str | None = None
    events = session.execute(
        select(UserLifeEvent).where(
            UserLifeEvent.chart_id == chart_id,
            UserLifeEvent.deleted_at.is_(None),
        )
    ).scalars().all()
    if events:
        report = validate_chart_against_events(
            chart_response,
            [
                {
                    "eventType": event.event_type,
                    "eventDate": event.event_date.isoformat(),
                }
                for event in events
            ],
        )
        validation_status = report.confidence

    current_age = _current_age(birth_profile.birth_date_local, today)

    return ChartSummaryResponse(
        data=ChartSummaryData(
            chart_id=chart_id,
            display_name=birth_profile.display_name,
            current_age=current_age,
            lagna_rasi=chart_response.data.lagna.rasi_name,
            moon_rasi=moon.rasi_name,
            d9_lagna_rasi=RASI_NAMES[d9_lagna_rasi],
            d9_moon_rasi=RASI_NAMES[moon.d9_rasi] if isinstance(moon.d9_rasi, int) else None,
            janma_nakshatra=moon.nakshatra_name,
            janma_pada=moon.pada,
            current_mahadasha=timeline.current_mahadasha.lord,
            current_antardasha=timeline.current_antardasha.lord,
            functional_nature=_functional_nature_table(chart_response),
            adhipathi_report=_adhipathi_report(chart_response),
            ashtakavarga=_ashtakavarga_table(chart_response),
            planets=chart_response.data.planets,
            yogas=chart_response.data.yogas,
            chart_validation_status=validation_status,
            primary_language_text=_gist_text(
                current_age=current_age,
                lagna_rasi=chart_response.data.lagna.rasi_name,
                moon_rasi=moon.rasi_name,
                nakshatra=moon.nakshatra_name,
                mahadasha_lord=timeline.current_mahadasha.lord,
                antardasha_lord=timeline.current_antardasha.lord,
            ),
        ),
        meta=ResponseMeta(
            calculation_version=chart.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_jadhagam_report(session: Session, chart_id: UUID) -> JadhagamReportResponse:
    chart_response = load_persisted_chart_response(session, chart_id)
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    birth_profile = _require_active_birth_profile(session, chart.birth_profile_id)

    moon = next(planet for planet in chart_response.data.planets if planet.graha == "MOON")
    timeline = calculate_vimshottari_timeline(
        chart_response.data.julian_day,
        moon.absolute_longitude,
        utc_datetime_to_julian_day(datetime.now(tz=UTC)),
    )
    today = datetime.now(tz=UTC).date()
    current_age = _current_age(birth_profile.birth_date_local, today)
    functional_nature = _functional_nature_table(chart_response)

    sun_lon = next(planet.absolute_longitude for planet in chart_response.data.planets if planet.graha == "SUN")
    moon_lon = next(planet.absolute_longitude for planet in chart_response.data.planets if planet.graha == "MOON")
    is_daytime = _is_daytime_birth(_value(birth_profile, "birth_time_local"))
    paksha_is_shukla = _paksha_is_shukla(moon_lon, sun_lon)
    report_rasi_map = {p.graha: p.rasi for p in chart_response.data.planets if p.graha in _NATAL_GRAHAS}
    report_wars = detect_planetary_wars({p.graha: p.absolute_longitude for p in chart_response.data.planets})
    report_combust = {
        p.graha
        for p in chart_response.data.planets
        if p.graha in _NATAL_GRAHAS and is_combust(p.graha, p.absolute_longitude, sun_lon, p.is_retrograde)
    }
    strength_items: list[JadhagamReportPlanetStrengthItem] = []
    for planet in chart_response.data.planets:
        if planet.graha == "MANDHI":
            continue
        benefic_aspects, malefic_aspects = _aspect_counts(
            planet.graha,
            report_rasi_map,
            report_combust,
            paksha_is_shukla=paksha_is_shukla,
        )
        score = compute_natal_planet_score(
            planet=planet.graha,
            natal_rasi=planet.rasi,
            natal_longitude=planet.absolute_longitude,
            natal_lagna_rasi=chart_response.data.lagna.rasi,
            sun_longitude=sun_lon,
            is_retrograde=planet.is_retrograde,
            is_vargottama=planet.is_vargottama,
            d9_rasi=planet.d9_rasi,
            is_daytime=is_daytime,
            paksha_is_shukla=paksha_is_shukla,
            speed_ratio=_speed_ratio(planet.graha, float(planet.speed_deg_per_day)),
            benefic_aspect_count=benefic_aspects,
            malefic_aspect_count=malefic_aspects,
            planetary_wars=report_wars,
        )
        strength_items.append(JadhagamReportPlanetStrengthItem(planet=planet.graha, score=score))

    strength_items.sort(key=lambda item: item.score, reverse=True)
    strong = [item for item in strength_items if item.score >= 70]
    weak = [item for item in strength_items if item.score <= 39]
    moderate = [item for item in strength_items if 40 <= item.score <= 69]

    d9_by_planet = {planet.graha: planet.d9_rasi for planet in chart_response.data.planets}
    vargottama_planets = [planet.graha for planet in chart_response.data.planets if planet.is_vargottama]

    gender = _value(birth_profile, "gender_for_traditional_rules")
    children = _value(birth_profile, "children")
    active_focus = get_active_life_phases(current_age, gender, children)
    life_area_predictions = [{"area": area, "status": "ACTIVE"} for area in active_focus]

    mahadasha_lord = timeline.current_mahadasha.lord
    antardasha_lord = timeline.current_antardasha.lord
    lagna_rasi_name = chart_response.data.lagna.rasi_name
    strong_planet_names = [item.planet for item in strong]
    weak_planet_names = [item.planet for item in weak]
    active_yoga_names = [y.name for y in chart_response.data.yogas if y.is_present]
    active_dosham_names = [d.name for d in chart_response.data.doshams if d.is_present and not d.is_cancelled]

    saturn_snapshot = calculate_sidereal_planets(local_midnight_as_jd_for_profile(today, birth_profile))
    saturn_house_from_moon = house_from_reference(moon.rasi, saturn_snapshot.bodies["SATURN"].rasi)
    sani_cycle = classify_sani_cycle(saturn_house_from_moon)

    primary_concerns = infer_primary_concerns(
        current_age=current_age,
        gender=gender,
        mahadasha_lord=mahadasha_lord,
        antardasha_lord=antardasha_lord,
        lagna_rasi=chart_response.data.lagna.rasi,
        sani_cycle=sani_cycle,
        children=children,
    )

    practical = get_age_based_practical_guidance(
        current_age=current_age,
        mahadasha_lord=mahadasha_lord,
        antardasha_lord=antardasha_lord,
        lagna_rasi=lagna_rasi_name,
        strong_planets=strong_planet_names,
        weak_planets=weak_planet_names,
        gender=gender,
        children=children,
    )
    remedies = get_age_based_remedies(
        current_age=current_age,
        mahadasha_lord=mahadasha_lord,
        lagna_rasi=lagna_rasi_name,
        weak_planets=weak_planet_names,
    )
    year_guidance = build_year_guidance(
        current_age=current_age,
        mahadasha_lord=mahadasha_lord,
        antardasha_lord=antardasha_lord,
        strong_planets=strong_planet_names,
    )
    executive = build_executive_summary(
        current_age=current_age,
        lagna_rasi=lagna_rasi_name,
        moon_rasi=moon.rasi_name,
        nakshatra=moon.nakshatra_name,
        mahadasha_lord=mahadasha_lord,
        antardasha_lord=antardasha_lord,
        strong_planets=strong_planet_names,
        weak_planets=weak_planet_names,
        active_yogas=active_yoga_names,
        active_doshams=active_dosham_names,
    )

    return JadhagamReportResponse(
        data=JadhagamReportData(
            chart_id=chart_id,
            birth_profile=JadhagamReportBirthProfile(
                display_name=birth_profile.display_name,
                birth_date_local=birth_profile.birth_date_local.isoformat(),
                birth_time_local=birth_profile.birth_time_local.isoformat() if birth_profile.birth_time_local else "--:--",
                birth_place=birth_profile.birth_place,
                birth_timezone=birth_profile.birth_timezone,
                current_age=current_age,
            ),
            core_identity=JadhagamReportCoreIdentity(
                lagna_rasi=lagna_rasi_name,
                moon_rasi=moon.rasi_name,
                janma_nakshatra=moon.nakshatra_name,
                janma_pada=moon.pada,
                current_mahadasha=mahadasha_lord,
                current_antardasha=antardasha_lord,
            ),
            rasi_chart_summary=JadhagamReportRasiSummary(
                lagna=chart_response.data.lagna,
                planets=chart_response.data.planets,
            ),
            navamsam_summary=JadhagamReportNavamsaSummary(
                d9_by_planet=d9_by_planet,
                vargottama_planets=vargottama_planets,
            ),
            functional_nature_table=functional_nature,
            adhipathi_report=_adhipathi_report(chart_response),
            yoga_dosham_summary=JadhagamReportYogaDoshamSummary(
                yogas=chart_response.data.yogas,
                doshams=chart_response.data.doshams,
            ),
            planetary_strength_summary=JadhagamReportPlanetStrengthSummary(
                strong=strong,
                moderate=moderate,
                weak=weak,
            ),
            dasha_analysis=JadhagamReportDashaAnalysis(
                current_mahadasha=mahadasha_lord,
                current_antardasha=antardasha_lord,
            ),
            life_area_predictions=life_area_predictions,
            age_wise_timeline=JadhagamReportAgeWiseTimeline(
                current_age=current_age,
                active_focus_areas=active_focus,
            ),
            primary_concerns=[
                JadhagamReportPrimaryConcern(
                    concern=candidate.concern,
                    confidence=candidate.confidence,
                    rationale_en=candidate.rationale_en,
                    rationale_ta=candidate.rationale_ta,
                )
                for candidate in primary_concerns
            ],
            current_year_guidance=year_guidance,
            practical_guidance=practical,
            optional_remedies=remedies,
            executive_summary=JadhagamReportExecutiveSummary(
                ta=executive["ta"],
                en=executive["en"],
            ),
        ),
        meta=ResponseMeta(
            calculation_version=chart.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )
