from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.astro import house_from_reference, julian_day_to_utc_datetime, resolve_rasi
from app.calculations.tajaka import calculate_tajaka_chart
from app.models import BirthProfile, Chart
from app.models.chart_planet import ChartPlanet
from app.schemas.varshaphala import (
    TajakaAspect,
    TajakaPlanetPosition,
    VarshaphalaAreaOutlook,
    VarshaphalaData,
    VarshaphalaResponse,
)

_TAJAKA_YEAR_LORD_BY_WEEKDAY = {
    0: "MOON",      # Monday
    1: "MARS",      # Tuesday
    2: "MERCURY",   # Wednesday
    3: "JUPITER",   # Thursday
    4: "VENUS",     # Friday
    5: "SATURN",    # Saturday
    6: "SUN",       # Sunday
}

_AREA_KARAKA: dict[str, str] = {
    "CAREER": "SATURN",
    "RELATIONSHIPS": "VENUS",
    "HEALTH": "SUN",
    "WEALTH": "JUPITER",
    "EDUCATION": "MERCURY",
    "CHILDREN": "JUPITER",
    "PROPERTY": "MARS",
    "FOREIGN": "RAHU",
    "LITIGATION": "MARS",
    "SPIRITUALITY": "KETU",
}


def get_varshaphala(
    session: Session,
    chart_id: UUID,
    year: int,
) -> VarshaphalaResponse:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise ValueError("Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise ValueError("Birth profile not found.")

    sun_row = session.execute(
        select(ChartPlanet).where(
            ChartPlanet.chart_id == chart_id,
            ChartPlanet.graha == "SUN",
        )
    ).scalar_one_or_none()
    if sun_row is None:
        raise ValueError("Sun position not available.")

    natal_lagna_rasi = resolve_rasi(chart.lagna_rasi)
    tajaka = calculate_tajaka_chart(
        natal_sun_longitude=float(sun_row.absolute_longitude),
        natal_lagna_rasi=natal_lagna_rasi,
        birth_year=profile.birth_date_local.year,
        return_year=year,
        birth_latitude=float(profile.birth_latitude),
        birth_longitude=float(profile.birth_longitude),
        ayanamsa_type="LAHIRI",
    )
    sr_dt = julian_day_to_utc_datetime(tajaka["julian_day"])
    weekday = sr_dt.weekday()
    year_lord = _TAJAKA_YEAR_LORD_BY_WEEKDAY[weekday]

    planets_snapshot = tajaka["planets"]
    year_lord_rasi = planets_snapshot.bodies[year_lord].rasi
    year_lord_house = house_from_reference(tajaka["sr_lagna_rasi"], year_lord_rasi)
    muntha_house = house_from_reference(tajaka["sr_lagna_rasi"], tajaka["muntha_rasi"])

    itthasala_raw = tajaka.get("itthasala_pairs", [])
    isarafa_raw = tajaka.get("isarafa_pairs", [])
    itthasala = [TajakaAspect(pair=item, kind="ITTHASALA") for item in itthasala_raw]
    isarafa = [TajakaAspect(pair=item, kind="ISARAFA") for item in isarafa_raw]

    area_outlook: list[VarshaphalaAreaOutlook] = []
    for area, karaka in _AREA_KARAKA.items():
        score = 55
        if year_lord_house in {1, 4, 5, 7, 9, 10, 11}:
            score += 8
        elif year_lord_house in {6, 8, 12}:
            score -= 7
        if muntha_house in {1, 3, 5, 9, 10, 11}:
            score += 6
        elif muntha_house in {6, 8, 12}:
            score -= 8
        if any(karaka in pair for pair in itthasala_raw):
            score += 8
        if any(karaka in pair for pair in isarafa_raw):
            score -= 5
        score = max(20, min(90, score))

        if score >= 70:
            ta = "இந்த ஆண்டில் இந்த துறையில் முன்னேற்ற வாய்ப்பு அதிகம்."
            en = "This year is strongly supportive for progress in this area."
            months = [2, 4, 6, 9, 11]
        elif score >= 50:
            ta = "இந்த ஆண்டில் கலப்பு பலன். திட்டமிட்டு சென்றால் முன்னேற்றம் சாத்தியம்."
            en = "This year gives mixed results; progress is possible with planning."
            months = [3, 5, 8, 10]
        else:
            ta = "இந்த ஆண்டில் கவனமாக செயல்பட வேண்டிய துறை."
            en = "This area needs caution and disciplined action this year."
            months = [1, 7, 12]

        area_outlook.append(
            VarshaphalaAreaOutlook(
                area=area,
                score=score,
                narrativeTa=ta,
                narrativeEn=en,
                favourableMonths=months,
            )
        )

    tajaka_planets = [
        TajakaPlanetPosition(
            planet=name,
            rasi=body.rasi,
            degreeInRasi=round(body.absolute_longitude % 30.0, 4),
        )
        for name, body in planets_snapshot.bodies.items()
        if name in {"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"}
    ]

    data = VarshaphalaData(
        chartId=chart_id,
        year=year,
        solarReturnDate=sr_dt.date(),
        solarReturnLagnaRasi=tajaka["sr_lagna_rasi"],
        solarReturnLagnaName=tajaka["sr_lagna_rasi_name"],
        munthaRasi=tajaka["muntha_rasi"],
        munthaRasiName=tajaka["muntha_rasi_name"],
        munthaHouseFromSrLagna=muntha_house,
        yearLord=year_lord,
        yearLordHouse=year_lord_house,
        tajakaPlanets=tajaka_planets,
        itthasalaPairs=itthasala,
        isarafaPairs=isarafa,
        areaOutlook=area_outlook,
    )
    return VarshaphalaResponse(
        success=True,
        data=data,
        meta={
            "calculationVersion": "thirukanitham-2026-v1",
            "generatedAt": datetime.now(tz=UTC),
        },
    )
