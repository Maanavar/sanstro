from __future__ import annotations

from datetime import UTC, date, datetime

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_sidereal_planets
from app.services.peyarchi_service import find_next_permanent_rasi_change


AS_OF_DATE = date(2026, 5, 22)
AS_OF_UTC = datetime(2026, 5, 22, 12, 0, tzinfo=UTC)


def _create_chart(client, birth_profile_payload_factory) -> str:
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory())
    assert created.status_code == 200
    birth_profile_id = created.json()["data"]["birthProfileId"]

    chart = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert chart.status_code == 200
    return chart.json()["data"]["chartId"]


def test_saturn_next_rasi_is_mesham_from_may_2026():
    event_dt, next_rasi = find_next_permanent_rasi_change("SATURN", utc_datetime_to_julian_day(AS_OF_UTC))
    assert next_rasi == 1  # Mesham
    assert abs((event_dt.date() - date(2028, 2, 23)).days) <= 2


def test_jupiter_next_rasi_is_kadagam_from_may_2026():
    event_dt, next_rasi = find_next_permanent_rasi_change("JUPITER", utc_datetime_to_julian_day(AS_OF_UTC))
    assert next_rasi == 4  # Kadagam
    assert abs((event_dt.date() - date(2026, 6, 1)).days) <= 2


def test_rahu_next_rasi_is_magaram_from_may_2026():
    event_dt, next_rasi = find_next_permanent_rasi_change("RAHU", utc_datetime_to_julian_day(AS_OF_UTC))
    assert next_rasi == 10  # Magaram
    assert abs((event_dt.date() - date(2026, 12, 5)).days) <= 2


def test_ketu_is_always_180_degrees_from_rahu():
    snapshot = calculate_sidereal_planets(utc_datetime_to_julian_day(AS_OF_UTC))
    rahu = snapshot.bodies["RAHU"]
    ketu = snapshot.bodies["KETU"]
    expected_ketu_rasi = ((rahu.rasi + 6 - 1) % 12) + 1
    assert ketu.rasi == expected_ketu_rasi
    assert (ketu.absolute_longitude - rahu.absolute_longitude) % 360 == 180


def test_peyarchi_days_from_today_is_positive(client, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory)
    response = client.get(
        f"/api/v1/charts/{chart_id}/peyarchi",
        params={"as_of": AS_OF_DATE.isoformat()},
    )
    assert response.status_code == 200
    events = response.json()["data"]
    assert events
    assert all(event["daysFromToday"] > 0 for event in events)


def test_retrograde_handling_does_not_return_past_date():
    from_jd = utc_datetime_to_julian_day(AS_OF_UTC)
    for planet in ("SATURN", "JUPITER", "RAHU", "KETU"):
        event_dt, _next_rasi = find_next_permanent_rasi_change(planet, from_jd)
        assert event_dt.date() >= AS_OF_DATE


def test_peyarchi_report_supports_rahu_ketu_axis(client, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory)

    rahu_response = client.get(
        f"/api/v1/transits/peyarchi-report/{chart_id}",
        params={"planet": "RAHU", "asOf": AS_OF_DATE.isoformat()},
    )
    assert rahu_response.status_code == 200
    rahu_data = rahu_response.json()["data"]
    assert rahu_data["planet"] == "RAHU"
    assert rahu_data["events"]
    rahu_event = rahu_data["events"][0]
    assert rahu_event["outlookTa"]
    assert "Ketu" in rahu_event["outlookEn"]
    assert rahu_event["houseFromMoon"] in range(1, 13)
    assert rahu_event["houseFromLagna"] in range(1, 13)

    ketu_response = client.get(
        f"/api/v1/transits/peyarchi-report/{chart_id}",
        params={"planet": "ketu", "asOf": AS_OF_DATE.isoformat()},
    )
    assert ketu_response.status_code == 200
    ketu_data = ketu_response.json()["data"]
    assert ketu_data["planet"] == "KETU"
    assert ketu_data["events"]
    assert "Rahu" in ketu_data["events"][0]["outlookEn"]
