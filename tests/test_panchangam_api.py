from datetime import date

from app.calculations.panchangam import PANCHANGAM_CACHE_DATA_VERSION
from app.db.session import SessionLocal
from app.models import PanchangamCache


def test_daily_panchangam_endpoint_returns_structured_daily_data(client):
    response = client.get(
        "/api/v1/panchangam/daily",
        params={
            "date": "2026-05-21",
            "lat": 9.9252,
            "lng": 78.1198,
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["vara"]["weekday"] == "THURSDAY"
    assert body["data"]["vara"]["lord"] == "GURU"
    assert body["data"]["tithi"]["number"] == 5
    assert body["data"]["kalam"]["rahuKalam"]["slot"] == 6
    assert body["data"]["kalam"]["yamagandam"]["slot"] == 1
    assert body["data"]["kalam"]["kuligai"]["slot"] == 3
    # Nalla Neram is weekday-slot based (Thirukanitham); Thursday = slot 1 = sunrise slot
    assert body["data"]["kalam"]["nallaNeram"][0]["slot"] == 1
    assert len(body["data"]["hora"]) == 24


def test_panchangam_timings_endpoint_returns_timing_windows(client):
    response = client.get(
        "/api/v1/panchangam/timings",
        params={
            "date": "2026-05-21",
            "lat": 9.9252,
            "lng": 78.1198,
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["kalam"]["rahuKalam"]["slot"] == 6
    assert body["data"]["abhijit"]["isRestrictedByWeekday"] is False
    assert len(body["data"]["hora"]) == 24


def test_panchangam_timings_monday_kuligai_uses_day_slot_6_not_sunrise_slot(client):
    response = client.get(
        "/api/v1/panchangam/timings",
        params={
            "date": "2026-05-25",
            "lat": 13.0827,
            "lng": 80.2707,
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["kalam"]["kuligai"]["slot"] == 6
    assert body["kalam"]["kuligai"]["start"] != body["sunrise"]
    assert body["kalam"]["kuligai"]["start"][:2] in {"12", "13", "14"}


def test_daily_panchangam_endpoint_reuses_cached_row(client, monkeypatch):
    params = {
        "date": "2026-05-21",
        "lat": 9.9252,
        "lng": 78.1198,
        "timezone": "Asia/Kolkata",
    }

    first = client.get("/api/v1/panchangam/daily", params=params)
    assert first.status_code == 200

    with SessionLocal() as session:
        rows = session.query(PanchangamCache).all()
        assert len(rows) == 1

    import app.calculations.panchangam as panchangam_module

    def _unexpected_recompute(*args, **kwargs):
        raise AssertionError("Should use panchangam cache instead of recomputing.")

    monkeypatch.setattr(panchangam_module, "calculate_rise_transit_jd", _unexpected_recompute)

    second = client.get("/api/v1/panchangam/daily", params=params)
    assert second.status_code == 200
    assert second.json()["data"]["tithi"]["number"] == first.json()["data"]["tithi"]["number"]

    with SessionLocal() as session:
        rows = session.query(PanchangamCache).all()
        assert len(rows) == 1


def test_daily_panchangam_endpoint_ignores_stale_cache_schema(client):
    params = {
        "date": "2026-05-21",
        "lat": 9.9252,
        "lng": 78.1198,
        "timezone": "Asia/Kolkata",
    }

    with SessionLocal() as session:
        stale = PanchangamCache(
            cache_date=date(2026, 5, 21),
            latitude=9.9252,
            longitude=78.1198,
            ayanamsa_type="LAHIRI",
            data={"schema_version": 1},
        )
        session.add(stale)
        session.commit()

    response = client.get("/api/v1/panchangam/daily", params=params)
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["kalam"]["kuligai"]["slot"] == 3

    with SessionLocal() as session:
        row = session.query(PanchangamCache).one()
        assert row.data["schema_version"] == PANCHANGAM_CACHE_DATA_VERSION
