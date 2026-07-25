from datetime import date

from app.calculations.panchangam import PANCHANGAM_CACHE_DATA_VERSION
from app.calculations.tamil_calendar import format_tamil_date
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
    expected_ta, expected_en = format_tamil_date(date(2026, 5, 21), "Asia/Kolkata", 9.9252, 78.1198)
    assert body["data"]["tamilDate"] == {"ta": expected_ta, "en": expected_en}
    assert body["data"]["tithi"]["number"] == 5
    assert body["data"]["kalam"]["rahuKalam"]["slot"] == 6
    assert body["data"]["kalam"]["yamagandam"]["slot"] == 1
    assert body["data"]["kalam"]["kuligai"]["slot"] == 3
    assert len(body["data"]["kalam"]["gowriPanchangam"]) == 16
    assert body["data"]["kalam"]["gowriPanchangam"][0]["name"] == "DHANAM"
    assert body["data"]["kalam"]["gowriPanchangam"][0]["period"] == "DAY"
    assert body["data"]["yoga"]["endsAt"]
    assert body["data"]["yoga"]["nextName"]
    assert body["data"]["karana"]["endsAt"]
    assert body["data"]["karana"]["nextName"]
    # endsAtIso is the full local datetime alongside the bare "HH:MM" endsAt —
    # clients must use it (not endsAt + a guessed date) to tell whether a
    # boundary falls later today or on a future day. See the 2026-07-25
    # Kettai/Moolam regression below.
    for limb in ("tithi", "nakshatra", "yoga", "karana"):
        ends_at = body["data"][limb]["endsAt"]
        ends_at_iso = body["data"][limb]["endsAtIso"]
        assert ends_at_iso[:10] in ("2026-05-21", "2026-05-22")
        assert ends_at_iso[11:16] == ends_at
    chandra = body["data"]["chandrashtamamToday"]
    assert 1 <= chandra["moonRasiNumber"] <= 12
    assert 1 <= chandra["affectedJanmaRasiNumber"] <= 12
    assert chandra["affectedJanmaRasiNumber"] == ((chandra["moonRasiNumber"] - 8) % 12) + 1
    assert isinstance(chandra["janmaNakshatraWindows"], list)
    assert chandra["janmaNakshatraWindows"]
    assert {"name", "start", "end"}.issubset(chandra["janmaNakshatraWindows"][0])
    # Summary windows are compact daily-calendar timings; the full named
    # Gowri engine remains available under gowriPanchangam.
    assert len(body["data"]["kalam"]["gowriNallaNeram"]) == 2
    assert {s["period"] for s in body["data"]["kalam"]["gowriNallaNeram"]} == {"DAY", "NIGHT"}
    assert all(s["name"] is None and s["isGood"] is True for s in body["data"]["kalam"]["gowriNallaNeram"])
    assert len(body["data"]["kalam"]["nallaNeram"]) == 2
    assert {s["period"] for s in body["data"]["kalam"]["nallaNeram"]} == {"AM", "PM"}
    for s in body["data"]["kalam"]["nallaNeram"]:
        assert s["name"] is None
        assert s["isGood"] is True
        assert s["warning"] is None
    assert len(body["data"]["hora"]) == 24


def test_nakshatra_ends_at_iso_carries_the_real_next_day_boundary(client):
    """Regression: 2026-07-25 Chennai. Kettai (Jyeshtha) nakshatra runs from
    before sunrise (05:56) until 07:35 the *next* morning (2026-07-26). Before
    endsAtIso existed, clients had to guess the missing date from the bare
    "07:35" clock string; because 07:35 is numerically later than sunrise's
    05:56, that guess read it as "ends later today" and promoted the headline
    to Moolam a full day early, as soon as the clock passed 7:35 AM on the
    25th. This pins the wire value so a client comparing endsAtIso can never
    make that mistake again.
    """
    response = client.get(
        "/api/v1/panchangam/daily",
        params={
            "date": "2026-07-25",
            "lat": 13.0827,
            "lng": 80.2707,
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 200
    nakshatra = response.json()["data"]["nakshatra"]
    assert nakshatra["name"] == "KETTAI"
    assert nakshatra["nextName"] == "MOOLAM"
    assert nakshatra["endsAt"] == "07:35"
    assert nakshatra["endsAtIso"].startswith("2026-07-26T07:35")


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


def test_daily_panchangam_endpoint_returns_festival_tags(client):
    response = client.get(
        "/api/v1/panchangam/daily",
        params={
            "date": "2026-01-26",
            "lat": 13.0827,
            "lng": 80.2707,
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 200
    festivals = response.json()["data"]["festivals"]
    republic_day = next(item for item in festivals if item["name"] == "Republic Day")
    assert republic_day["category"] == "indian_govt"
    assert set(republic_day["tags"]) == {"indian_govt", "tamilnadu_govt"}


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


def test_monthly_panchangam_uses_cached_dominant_values(client, monkeypatch):
    """A warm monthly load must not re-walk the ephemeris.

    The dominant tithi/nakshatra/yoga for each civil day are persisted on the
    cached snapshot (schema v22+), so once a month is warm the monthly endpoint
    should serve it from a bulk SELECT alone — no per-day ephemeris recompute.
    """
    params = {
        "year": 2026,
        "month": 5,
        "lat": 9.9252,
        "lng": 78.1198,
        "timezone": "Asia/Kolkata",
    }

    first = client.get("/api/v1/panchangam/monthly", params=params)
    assert first.status_code == 200
    first_entries = first.json()["data"]["entries"]
    assert first_entries

    import app.calculations.panchangam as panchangam_module

    def _unexpected_recompute(*args, **kwargs):
        raise AssertionError("Warm monthly load must read snapshots from the cache, not re-walk the ephemeris.")

    # The per-day sidereal ephemeris walk is the expensive part of building a
    # snapshot. On a fully warm load every day is served from the cached snapshot,
    # so the ephemeris must never be touched.
    monkeypatch.setattr(panchangam_module, "calculate_sidereal_planets", _unexpected_recompute)

    second = client.get("/api/v1/panchangam/monthly", params=params)
    assert second.status_code == 200
    second_entries = second.json()["data"]["entries"]
    assert [e["tithiNumber"] for e in second_entries] == [e["tithiNumber"] for e in first_entries]
    assert [e["nakshatraName"] for e in second_entries] == [e["nakshatraName"] for e in first_entries]


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


def test_daily_panchangam_polar_day_returns_422_not_500(client):
    # Tromso during polar day has no sunrise/sunset — the endpoint must degrade to
    # a clean 422 (undefined input), never a 500.
    response = client.get(
        "/api/v1/panchangam/daily",
        params={"date": "2026-06-21", "lat": 69.6492, "lng": 18.9553, "timezone": "Europe/Oslo"},
    )
    assert response.status_code == 422
    assert "polar" in response.json()["detail"].lower()


def test_monthly_panchangam_polar_month_omits_undefined_days_not_500(client):
    # A fully-polar month returns 200 with the no-sunrise days simply omitted,
    # rather than failing the whole request.
    response = client.get(
        "/api/v1/panchangam/monthly",
        params={"year": 2026, "month": 6, "lat": 69.6492, "lng": 18.9553, "timezone": "Europe/Oslo"},
    )
    assert response.status_code == 200
    # June at Tromso is entirely polar day → all days omitted.
    assert response.json()["data"]["entries"] == []
