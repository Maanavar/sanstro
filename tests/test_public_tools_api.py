from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.rate_limit import reset_rate_limit_backend
from app.main import app

pytestmark = pytest.mark.no_db


def _birth_payload(name: str, birth_date: str, birth_time: str) -> dict[str, object]:
    return {
        "displayName": name,
        "birthDateLocal": birth_date,
        "birthTimeLocal": birth_time,
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "birthPlace": "Chennai",
    }


def test_public_chart_accepts_marketing_site_payload() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/public/chart",
            json={"birth": _birth_payload("Marketing Tool User", "1990-01-01", "12:00")},
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["data"]["birthProfile"]["displayName"] == "Marketing Tool User"
    assert body["data"]["birthProfile"]["birthDateLocal"] == "1990-01-01"


def test_public_porutham_accepts_marketing_site_payload() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/public/porutham",
            json={
                "personA": _birth_payload("Person A", "1990-01-01", "12:00"),
                "personB": _birth_payload("Person B", "1992-02-02", "13:00"),
                "compatibilityContext": "MARRIAGE",
            },
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["data"]["boyNakshatraName"]
    assert body["data"]["girlNakshatraName"]


def test_public_porutham_by_star_matches_mobile_shared_wrapper_payload() -> None:
    """packages/shared/src/api/porutham.ts's getPorutham() posts exactly this shape."""
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/public/porutham/by-star",
            json={"boyNakshatraNumber": 1, "girlNakshatraNumber": 4},
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["boyNakshatra"] == 1
    assert data["girlNakshatra"] == 4
    assert len(data["kutas"]) == 10
    assert data["maxScore"] == 10
    assert 0 <= data["totalScore"] <= 10
    assert isinstance(data["rajjuDosha"], bool)
    assert isinstance(data["vedhaDosha"], bool)
    assert data["nadiDosha"]["boyNadi"]
    assert data["summary"]["en"]


def test_public_porutham_by_star_rejects_out_of_range_nakshatra() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/public/porutham/by-star",
            json={"boyNakshatraNumber": 28, "girlNakshatraNumber": 1},
        )

    assert response.status_code == 422, response.text


def test_public_porutham_by_star_pada_changes_rasi_dependent_kutas() -> None:
    """Uthiram (nakshatra 12) straddles Simha/Kanni — pada 1 vs pada 4 must differ."""
    with TestClient(app, raise_server_exceptions=False) as client:
        early = client.post(
            "/api/v1/public/porutham/by-star",
            json={"boyNakshatraNumber": 12, "girlNakshatraNumber": 1, "boyPada": 1},
        ).json()["data"]
        late = client.post(
            "/api/v1/public/porutham/by-star",
            json={"boyNakshatraNumber": 12, "girlNakshatraNumber": 1, "boyPada": 4},
        ).json()["data"]

    rasi_kutas_early = {k["name"]: k["score"] for k in early["kutas"] if k["name"] in {"Rasi", "Graha Maitri", "Vasya"}}
    rasi_kutas_late = {k["name"]: k["score"] for k in late["kutas"] if k["name"] in {"Rasi", "Graha Maitri", "Vasya"}}
    assert rasi_kutas_early != rasi_kutas_late


def test_public_porutham_by_star_default_pada_matches_majority_rasi_convention() -> None:
    """Default (no pada given) must equal explicit pada=3 — the majority/late-tiebreak rasi."""
    with TestClient(app, raise_server_exceptions=False) as client:
        default = client.post(
            "/api/v1/public/porutham/by-star",
            json={"boyNakshatraNumber": 12, "girlNakshatraNumber": 1},
        ).json()["data"]
        pada3 = client.post(
            "/api/v1/public/porutham/by-star",
            json={"boyNakshatraNumber": 12, "girlNakshatraNumber": 1, "boyPada": 3},
        ).json()["data"]

    assert default["totalScore"] == pada3["totalScore"]
    assert default["kutas"] == pada3["kutas"]


def test_public_porutham_by_star_grid_returns_all_27_candidates() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/public/porutham/by-star/grid",
            json={"girlNakshatraNumber": 4},
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["girlNakshatraNumber"] == 4
    assert len(body["results"]) == 27
    boy_numbers = {item["boyNakshatra"] for item in body["results"]}
    assert boy_numbers == set(range(1, 28))
    for item in body["results"]:
        assert 0 <= item["totalScore"] <= 10
        assert isinstance(item["nadiCaution"], bool)


def test_public_porutham_by_star_grid_matches_single_lookup() -> None:
    """A grid row must agree with the equivalent single by-star lookup."""
    with TestClient(app, raise_server_exceptions=False) as client:
        grid = client.post(
            "/api/v1/public/porutham/by-star/grid",
            json={"girlNakshatraNumber": 4},
        ).json()
        single = client.post(
            "/api/v1/public/porutham/by-star",
            json={"boyNakshatraNumber": 1, "girlNakshatraNumber": 4},
        ).json()["data"]

    row = next(item for item in grid["results"] if item["boyNakshatra"] == 1)
    assert row["totalScore"] == single["totalScore"]
    assert row["rajjuDosha"] == single["rajjuDosha"]
    assert row["vedhaDosha"] == single["vedhaDosha"]
    assert row["nadiCaution"] == single["nadiDosha"]["hasNadiDosha"]


def test_public_compare_returns_dasha_for_both_people() -> None:
    """The dashboard porutham tool shows each person's currently-running
    Mahadasha/Antardasha alongside the score — /public/compare must return it
    for both charts (2026-07 UX gap: neither surface stated it before)."""
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/public/compare",
            json={
                "personA": _birth_payload("Person A", "1990-01-01", "12:00"),
                "personB": _birth_payload("Person B", "1992-02-02", "13:00"),
                "compatibilityContext": "MARRIAGE",
            },
        )

    assert response.status_code == 200, response.text
    body = response.json()["data"]
    assert body["dashaA"]["current"]["mahadasha"]["lord"]
    assert body["dashaA"]["current"]["antardasha"]["lord"]
    assert body["dashaB"]["current"]["mahadasha"]["lord"]
    assert body["dashaB"]["current"]["antardasha"]["lord"]


@pytest.mark.parametrize("lang", ["en", "ta"])
def test_public_compare_pdf_returns_pdf(lang: str) -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            f"/api/v1/public/compare/pdf?lang={lang}",
            json={
                "personA": _birth_payload("Person A", "1990-01-01", "12:00"),
                "personB": _birth_payload("Person B", "1992-02-02", "13:00"),
                "compatibilityContext": "MARRIAGE",
            },
        )

    assert response.status_code == 200, response.text
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content[:4] == b"%PDF"


def test_public_panchangam_returns_daily_snapshot() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get(
            "/api/v1/public/panchangam?date=2026-06-02&lat=13.0827&lng=80.2707&timezone=Asia%2FKolkata"
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["data"]["dateLocal"] == "2026-06-02"
    assert body["data"]["tamilDate"]["en"]
    assert body["data"]["location"]["timezone"] == "Asia/Kolkata"


def test_public_rasi_palan_returns_prediction_for_named_rasi() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get(
            "/api/v1/public/rasi-palan"
            "?rasi=mesham&query_date=2026-06-02&lat=13.0827&lng=80.2707&timezone=Asia%2FKolkata"
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["rasi"] == 1
    assert body["rasiName"] == {"ta": "மேஷம்", "en": "Mesham"}
    assert body["date"] == "2026-06-02"
    assert 1 <= body["moonHouse"] <= 12
    assert body["headline"]["ta"] and body["headline"]["en"]
    assert body["body"]["ta"] and body["body"]["en"]
    assert isinstance(body["luckyNumbers"], list) and body["luckyNumbers"]
    assert body["tone"] in {"positive", "neutral", "caution", "warn"}


def test_public_rasi_palan_accepts_numeric_rasi() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get("/api/v1/public/rasi-palan?rasi=7&query_date=2026-06-02")

    assert response.status_code == 200, response.text
    assert response.json()["rasi"] == 7


def test_public_rasi_palan_rejects_out_of_range_rasi() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get("/api/v1/public/rasi-palan?rasi=13&query_date=2026-06-02")

    assert response.status_code == 422, response.text


def test_public_rasi_palan_grid_returns_all_12_rasis() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get(
            "/api/v1/public/rasi-palan/grid?query_date=2026-06-02&lat=13.0827&lng=80.2707&timezone=Asia%2FKolkata"
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["date"] == "2026-06-02"
    assert 1 <= body["moonRasi"] <= 12
    assert body["nakshatra"]
    assert len(body["results"]) == 12
    assert {item["rasi"] for item in body["results"]} == set(range(1, 13))
    for item in body["results"]:
        assert 1 <= item["moonHouse"] <= 12
        assert item["headline"]["ta"] and item["headline"]["en"]
        assert item["tone"] in {"positive", "neutral", "caution", "warn"}


def test_public_rasi_palan_grid_matches_single_lookup() -> None:
    """A grid row must agree with the equivalent single /rasi-palan lookup —
    both derive from the same Moon transit, computed once server-side for the
    grid instead of once per rasi."""
    with TestClient(app, raise_server_exceptions=False) as client:
        grid = client.get(
            "/api/v1/public/rasi-palan/grid?query_date=2026-06-02&lat=13.0827&lng=80.2707&timezone=Asia%2FKolkata"
        ).json()
        single = client.get(
            "/api/v1/public/rasi-palan"
            "?rasi=8&query_date=2026-06-02&lat=13.0827&lng=80.2707&timezone=Asia%2FKolkata"
        ).json()

    row = next(item for item in grid["results"] if item["rasi"] == 8)
    assert row["moonHouse"] == single["moonHouse"]
    assert row["headline"] == single["headline"]
    assert row["body"] == single["body"]
    assert row["luckyNumbers"] == single["luckyNumbers"]
    assert row["tone"] == single["tone"]
    assert grid["moonRasi"] == single["moonRasi"]


# ── Endpoint-level rate limiting (2026-07-22 audit follow-up) ────────────────
#
# The 7 endpoints below previously had no @public_endpoint_rate_limit decorator
# and relied only on the global 120/min/IP middleware. Confirm each still works
# with the added `request: Request` parameter, and that the limiter actually
# fires once its per-endpoint budget (app/core/public_endpoint_limiter.py) is
# exceeded — not just that the decorator is present.


def test_public_friendship_compatibility_still_works() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/public/friendship-compatibility",
            json={
                "personA": _birth_payload("Person A", "1990-01-01", "12:00"),
                "personB": _birth_payload("Person B", "1992-02-02", "13:00"),
            },
        )

    assert response.status_code == 200, response.text


def test_public_muhurtham_naals_still_works() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get("/api/v1/public/muhurtham-naals?year=2027")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["year"] == 2027
    assert isinstance(body["naals"], list)


def test_public_panchangam_events_still_works() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        list_response = client.get("/api/v1/public/panchangam-events?year=2026")
        assert list_response.status_code == 200, list_response.text
        events = list_response.json()["events"]
        assert events

        detail_response = client.get(f"/api/v1/public/panchangam-events/{events[0]['key']}?year=2026")

    assert detail_response.status_code == 200, detail_response.text


def test_public_calendar_categories_still_works() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        list_response = client.get("/api/v1/public/calendar-categories?year=2026")
        assert list_response.status_code == 200, list_response.text
        categories = list_response.json()["categories"]
        assert categories

        detail_response = client.get(f"/api/v1/public/calendar-categories/{categories[0]['slug']}?year=2026")

    assert detail_response.status_code == 200, detail_response.text


def test_public_panchangam_share_card_still_works() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get(
            "/api/v1/public/panchangam-share-card?date=2026-06-02&lat=13.0827&lng=80.2707&timezone=Asia%2FKolkata"
        )

    assert response.status_code == 200, response.text


def test_public_muhurtham_naals_rate_limit_enforced() -> None:
    """public_muhurtham_naals had no endpoint-level budget before this fix — only the
    global 120/min middleware. Confirm its new 30/min budget (public_endpoint_limiter.py)
    actually trips a 429 rather than silently allowing unlimited scraping.

    Resets the shared in-memory limiter first: earlier tests in this module hit the same
    endpoint/IP bucket, and this file's raw TestClient(app) pattern (unlike the `client`
    fixture in conftest.py) doesn't reset it between tests.
    """
    reset_rate_limit_backend()
    with TestClient(app, raise_server_exceptions=False) as client:
        responses = [client.get("/api/v1/public/muhurtham-naals?year=2027") for _ in range(31)]

    assert responses[-1].status_code == 429, responses[-1].text
    assert "Retry-After" in responses[-1].headers
    assert all(r.status_code == 200 for r in responses[:30])


# -- Daily cap on the rasi-palan grid ----------------------------------------
#
# A per-minute limit bounds a burst, not a day. The grid returns every sign's
# full bilingual prediction and remedies in one unauthenticated call, so at
# 30/min a single IP could pull the whole content library 43,200 times between
# midnights and never once exceed its budget. GO_LIVE_CHECKLIST's public-API
# scraping item asks for a daily cap in addition; these pin it.


def test_rasi_palan_grid_has_its_own_budget_not_the_shared_panchangam_one() -> None:
    """It used to share `public_panchangam` with three other routes.

    That matters because a daily cap on the shared key would have silently
    applied to /panchangam, /rasi-palan and /panchangam/monthly as well -- none
    of which return a whole library, and one of which the dashboard calls.
    """
    from app.core.public_endpoint_limiter import PublicEndpointLimiter

    config = PublicEndpointLimiter._ENDPOINT_CONFIG
    assert "public_rasi_palan_grid" in config
    assert config["public_rasi_palan_grid"]["daily_max_requests"] == 120
    assert "daily_max_requests" not in config["public_panchangam"]


def test_the_daily_cap_uses_a_separate_counter_from_the_burst_one() -> None:
    """Sharing one key would make both windows increment the same counter, and
    the tighter of the two would decide both."""
    from app.core.public_endpoint_limiter import _ONE_DAY_SECONDS, PublicEndpointLimiter

    reset_rate_limit_backend()
    limiter = PublicEndpointLimiter()
    seen: list[tuple[str, int, int]] = []

    class _Recorder:
        def check(self, key: str, max_requests: int, window_seconds: int):
            seen.append((key, max_requests, window_seconds))

            class _Result:
                allowed = True
                retry_after = 0

            return _Result()

    limiter._backend = _Recorder()
    assert limiter.check("public_rasi_palan_grid", "203.0.113.9") == (True, 0)

    assert seen == [
        ("public:public_rasi_palan_grid:203.0.113.9", 30, 60),
        ("public:public_rasi_palan_grid:daily:203.0.113.9", 120, _ONE_DAY_SECONDS),
    ]


def test_an_endpoint_without_a_daily_cap_checks_only_one_budget() -> None:
    """The second window is opt-in. Every other endpoint keeps one check."""
    from app.core.public_endpoint_limiter import PublicEndpointLimiter

    reset_rate_limit_backend()
    limiter = PublicEndpointLimiter()
    seen: list[str] = []

    class _Recorder:
        def check(self, key: str, max_requests: int, window_seconds: int):
            seen.append(key)

            class _Result:
                allowed = True
                retry_after = 0

            return _Result()

    limiter._backend = _Recorder()
    limiter.check("public_panchangam", "203.0.113.9")

    assert seen == ["public:public_panchangam:203.0.113.9"]


def test_exceeding_the_burst_limit_does_not_consume_the_daily_budget() -> None:
    """Order of the two checks, stated as behaviour.

    A caller already over the per-minute limit must not also burn a slot from the
    daily allowance -- otherwise a burst of 429s would spend the day's budget on
    requests that were all rejected.
    """
    from app.core.public_endpoint_limiter import PublicEndpointLimiter

    reset_rate_limit_backend()
    limiter = PublicEndpointLimiter()
    daily_checks: list[str] = []

    class _BurstExhausted:
        def check(self, key: str, max_requests: int, window_seconds: int):
            if "daily:" in key:
                daily_checks.append(key)

            class _Result:
                allowed = "daily:" in key
                retry_after = 0 if "daily:" in key else 42

            return _Result()

    limiter._backend = _BurstExhausted()
    allowed, retry_after = limiter.check("public_rasi_palan_grid", "203.0.113.9")

    assert (allowed, retry_after) == (False, 42)
    assert daily_checks == []
