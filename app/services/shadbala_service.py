"""Service layer for the classical Shadbala engine (app/calculations/shadbala.py).

Gathers the persisted chart, birth profile, and derived astronomical context
(Ascendant/Midheaven, sunrise/sunset, declination) and produces the
serializable Shadbala response for GET /charts/{id}/shadbala.

This is an ADVANCED / EXPERIMENTAL feature (see the calculation module's
docstring): the six-component total is a classical floor pending Jagannatha
Hora cross-validation, so the response is explicitly labelled experimental.
"""
from __future__ import annotations

from datetime import UTC, datetime, time, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.astro import (
    julian_day_to_utc_datetime,
    utc_datetime_to_julian_day,
)
from app.calculations.ephemeris import (
    calculate_asc_mc,
    calculate_rise_transit_jd,
    get_lahiri_ayanamsa_ut,
)
from app.calculations.shadbala import (
    SHADBALA_GRAHAS,
    PlanetInput,
    ShadbalaContext,
    compute_shadbala,
    declination_from_longitude,
    mean_obliquity,
)
from app.models.birth_profile import BirthProfile
from app.models.chart import Chart
from app.models.chart_planet import ChartPlanet

EXPERIMENTAL_NOTE = (
    "Classical six-component Shadbala in Rupas (60 Virupa = 1 Rupa). "
    "Advanced/experimental: Abda, Masa and Yuddha Bala sub-components are "
    "omitted (documented), so totals are a classical floor pending Jagannatha "
    "Hora cross-validation. Distinct from the 0-100 product strength score."
)


def _decimal_hours(dt: datetime) -> float:
    return dt.hour + dt.minute / 60.0 + dt.second / 3600.0


def _birth_datetime_utc(profile: BirthProfile) -> datetime | None:
    if profile.birth_datetime_utc is not None:
        dt = profile.birth_datetime_utc
        return dt.replace(tzinfo=UTC) if dt.tzinfo is None else dt.astimezone(UTC)
    return None


def build_shadbala_response(session: Session, chart_id: UUID) -> dict:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise ValueError("Chart not found.")
    birth_profile = session.get(BirthProfile, chart.birth_profile_id)
    if birth_profile is None:
        raise ValueError("Birth profile not found for chart.")

    planet_rows = session.execute(
        select(ChartPlanet).where(ChartPlanet.chart_id == chart_id)
    ).scalars().all()
    by_graha = {row.graha: row for row in planet_rows}
    missing = [g for g in SHADBALA_GRAHAS if g not in by_graha]
    if missing:
        raise ValueError(f"Chart is missing planet positions: {', '.join(missing)}")

    lat = float(birth_profile.birth_latitude)
    lng = float(birth_profile.birth_longitude)
    tz = ZoneInfo(birth_profile.birth_timezone)

    # Julian Day: prefer the exact birth instant; fall back to local noon of
    # the birth date when the birth time is unknown (Asc/MC/declination then
    # approximate, and the time-sensitive Kala sub-balas degrade to neutral).
    birth_dt_utc = _birth_datetime_utc(birth_profile)
    if birth_dt_utc is not None:
        jd_ut = utc_datetime_to_julian_day(birth_dt_utc)
    else:
        local_noon = datetime.combine(birth_profile.birth_date_local, time(12, 0), tzinfo=tz)
        jd_ut = utc_datetime_to_julian_day(local_noon.astimezone(UTC))

    asc_lon, mc_lon = calculate_asc_mc(jd_ut, lat, lng)

    # Sunrise / sunset in local clock hours for the birth date.
    sunrise_hours: float | None = None
    sunset_hours: float | None = None
    try:
        local_midnight_utc = datetime.combine(
            birth_profile.birth_date_local, time(0, 0), tzinfo=tz
        ).astimezone(UTC)
        jd_midnight = utc_datetime_to_julian_day(local_midnight_utc)
        sunrise_jd = calculate_rise_transit_jd(jd_midnight, lat, lng, rise=True)
        sunset_jd = calculate_rise_transit_jd(sunrise_jd, lat, lng, rise=False)
        sunrise_hours = _decimal_hours(julian_day_to_utc_datetime(sunrise_jd).astimezone(tz))
        sunset_hours = _decimal_hours(julian_day_to_utc_datetime(sunset_jd).astimezone(tz))
    except Exception:
        # Rise/set can fail in polar latitudes or unavailable backends; Kala
        # sub-balas fall back to neutral (documented in the calc module).
        sunrise_hours = sunset_hours = None

    # Birth clock time (local) and vara weekday (sunrise-to-sunrise day).
    birth_clock_hours: float | None = None
    if birth_profile.birth_time_local is not None:
        t = birth_profile.birth_time_local
        birth_clock_hours = t.hour + t.minute / 60.0 + t.second / 3600.0

    vara_date = birth_profile.birth_date_local
    if (
        birth_clock_hours is not None
        and sunrise_hours is not None
        and birth_clock_hours < sunrise_hours
    ):
        # Before sunrise still belongs to the previous vara.
        vara_date = vara_date - timedelta(days=1)
    # Python weekday(): Mon=0..Sun=6 → convert to 0=Sunday..6=Saturday.
    weekday = (vara_date.weekday() + 1) % 7

    ayanamsa = get_lahiri_ayanamsa_ut(jd_ut)
    obliquity = mean_obliquity(jd_ut)

    planets: dict[str, PlanetInput] = {}
    for graha in SHADBALA_GRAHAS:
        row = by_graha[graha]
        lon = float(row.absolute_longitude)
        speed = float(row.speed_deg_per_day) if row.speed_deg_per_day is not None else 0.0
        planets[graha] = PlanetInput(
            longitude=lon,
            is_retrograde=bool(row.is_retrograde),
            speed_deg_per_day=speed,
            declination=declination_from_longitude(lon, ayanamsa, obliquity),
        )

    ctx = ShadbalaContext(
        asc_longitude=asc_lon,
        mc_longitude=mc_lon,
        weekday=weekday,
        birth_clock_hours=birth_clock_hours,
        sunrise_hours=sunrise_hours,
        sunset_hours=sunset_hours,
    )

    result = compute_shadbala(planets, ctx)

    planets_payload = []
    for graha in SHADBALA_GRAHAS:
        ps = result[graha]
        planets_payload.append({
            "graha": ps.graha,
            "sthana": ps.sthana,
            "dig": ps.dig,
            "kala": ps.kala,
            "chesta": ps.chesta,
            "naisargika": ps.naisargika,
            "drik": ps.drik,
            "totalVirupa": ps.total_virupa,
            "rupas": ps.rupas,
            "requiredRupas": ps.required_rupas,
            "strengthRatio": ps.strength_ratio,
            "isStrong": ps.is_strong,
            "sthanaComponents": ps.sthana_components,
            "kalaComponents": ps.kala_components,
        })

    # Rank strongest-first by strength ratio.
    ranking = [
        p["graha"]
        for p in sorted(planets_payload, key=lambda p: p["strengthRatio"], reverse=True)
    ]

    return {
        "chartId": str(chart_id),
        "experimental": True,
        "note": EXPERIMENTAL_NOTE,
        "birthTimeKnown": birth_clock_hours is not None,
        "planets": planets_payload,
        "strongestFirst": ranking,
    }
