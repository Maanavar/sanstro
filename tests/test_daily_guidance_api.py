from app.db.session import SessionLocal
from app.models import DailyScore


def assert_response(response, status=200, required_keys=()):
    assert response.status_code == status
    data = response.json()
    for key in required_keys:
        assert key in data, f"Missing key '{key}' in response"
    return data


def _create_chart(client, birth_profile_payload_factory):
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


def _flatten_text_fields(value, path=""):
    yield path, value
    if isinstance(value, dict):
        for key, item in value.items():
            next_path = f"{path}.{key}" if path else key
            yield from _flatten_text_fields(item, next_path)
        return
    if isinstance(value, list):
        for idx, item in enumerate(value):
            next_path = f"{path}[{idx}]"
            yield from _flatten_text_fields(item, next_path)
        return


def test_daily_guidance_endpoint_returns_daily_card(client, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory)

    response = client.get(
        f"/api/v1/charts/{chart_id}/daily-guidance",
        params={"date": "2026-05-21", "language": "ta-en"},
    )

    body = assert_response(response, status=200, required_keys=("success", "data"))
    assert body["success"] is True
    assert body["data"]["dateLocal"] == "2026-05-21"
    assert 0 <= body["data"]["score"] <= 100
    assert body["data"]["label"] in {"STRONG_SUPPORT", "GOOD", "BALANCED", "CAUTION", "RESTORATIVE"}
    assert set(body["data"]["scoreBreakdown"].keys()) == {
        "moonTransit",
        "dashaSupport",
        "panchangam",
        "gocharSupport",
        "personalCautions",
        "remedialActionSupport",
    }
    assert body["data"]["bestWindows"][0]["type"] == "ABHIJIT"
    assert body["data"]["cautionWindows"][0]["type"] == "RAHU_KALAM"
    # caution suggestion always references Rahu Kalam regardless of day label
    assert "Rahu" in body["data"]["cautionSuggestion"]["en"] or "Rahu" in body["data"]["cautionSuggestion"]["ta"]
    assert body["data"]["actionSuggestion"]["en"]
    assert body["data"]["cautionSuggestion"]["en"]
    assert body["data"]["text"]["en"]
    assert body["data"]["text"]["ta"]
    assert body["data"]["nakshatraPerspective"]["en"]
    assert body["data"]["nakshatraPerspective"]["ta"]
    assert body["data"]["emotionalWeather"]["tone"]
    assert body["data"]["emotionalWeather"]["physicalTendency"]
    assert body["data"]["emotionalWeather"]["bestUseOfDay"]
    assert body["data"]["emotionalWeather"]["toneText"]["en"]
    assert body["data"]["emotionalWeather"]["physicalTendencyText"]["en"]
    assert body["data"]["emotionalWeather"]["bestUseOfDayText"]["en"]
    assert "contextInsight" in body["data"]
    assert "journalInsight" in body["data"]


def test_daily_guidance_all_text_fields_bilingual(client, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory)
    response = client.get(
        f"/api/v1/charts/{chart_id}/daily-guidance",
        params={"date": "2026-05-21", "language": "ta-en"},
    )
    data = assert_response(response, status=200, required_keys=("data",))["data"]

    for field_path, value in _flatten_text_fields(data):
        if isinstance(value, dict) and "ta" in value and "en" in value:
            assert value["ta"].strip(), f"Tamil missing at {field_path}"
            assert value["en"].strip(), f"English missing at {field_path}"


def test_daily_guidance_range_endpoint_returns_multiple_days(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    birth_profile_id = created["data"]["birthProfileId"]

    response = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    chart_id = response.json()["data"]["chartId"]

    range_response = client.get(
        "/api/v1/daily-guidance/range",
        params={"profileId": birth_profile_id, "from": "2026-05-21", "to": "2026-05-23", "language": "ta-en"},
    )

    assert range_response.status_code == 200
    body = range_response.json()["data"]
    assert body["profileId"] == birth_profile_id
    assert body["chartId"] == chart_id
    assert body["fromDate"] == "2026-05-21"
    assert body["toDate"] == "2026-05-23"
    assert len(body["items"]) == 3
    assert all(item["nakshatraPerspective"]["en"] for item in body["items"])
    assert all(item["nakshatraPerspective"]["ta"] for item in body["items"])
    assert all(item["emotionalWeather"]["tone"] for item in body["items"])
    assert all("contextInsight" in item for item in body["items"])
    assert all("journalInsight" in item for item in body["items"])


def test_daily_guidance_journal_insight_does_not_change_score(client, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory)
    target_date = "2026-05-23"

    before = client.get(
        f"/api/v1/charts/{chart_id}/daily-guidance",
        params={"date": target_date, "language": "ta-en"},
    )
    assert before.status_code == 200
    before_data = before.json()["data"]
    assert before_data["journalInsight"] is None

    entries = [
        {
            "chartId": chart_id,
            "entryDate": "2026-05-10",
            "lifeArea": "career",
            "noteText": "Interview prep and work planning.",
        },
        {
            "chartId": chart_id,
            "entryDate": "2026-05-20",
            "lifeArea": "career",
            "noteText": "Budget follow-up and office discussion.",
        },
    ]
    for entry in entries:
        created = client.post("/api/v1/journal", json=entry)
        assert created.status_code == 200

    after = client.get(
        f"/api/v1/charts/{chart_id}/daily-guidance",
        params={"date": target_date, "language": "ta-en"},
    )
    assert after.status_code == 200
    after_data = after.json()["data"]

    assert after_data["score"] == before_data["score"]
    assert after_data["scoreBreakdown"] == before_data["scoreBreakdown"]
    assert after_data["journalInsight"] is not None
    assert after_data["journalInsight"]["entryCount"] == 2
    assert after_data["journalInsight"]["dominantLifeArea"] == "career"


def test_daily_guidance_endpoint_reuses_daily_score_cache(client, monkeypatch, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory)
    params = {"date": "2026-05-21", "language": "ta-en"}

    first = client.get(f"/api/v1/charts/{chart_id}/daily-guidance", params=params)
    assert first.status_code == 200

    with SessionLocal() as session:
        rows = session.query(DailyScore).all()
        assert len(rows) == 1

    import app.services.daily_guidance_service as daily_guidance_module

    def _unexpected_recompute(*args, **kwargs):
        raise AssertionError("Should use daily score cache instead of recomputing.")

    monkeypatch.setattr(daily_guidance_module, "build_daily_guidance_response", _unexpected_recompute)

    second = client.get(f"/api/v1/charts/{chart_id}/daily-guidance", params=params)
    assert second.status_code == 200
    assert second.json()["data"]["score"] == first.json()["data"]["score"]
    assert second.json()["data"]["label"] == first.json()["data"]["label"]


def test_week_ahead_includes_real_tithi_and_nakshatra_numbers(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    birth_profile_id = created["data"]["birthProfileId"]
    response = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert response.status_code == 200

    week = client.get(
        "/api/v1/daily-guidance/week-ahead",
        params={"profileId": birth_profile_id, "weekStart": "2026-05-21", "language": "ta-en"},
    )
    assert week.status_code == 200
    days = week.json()["data"]["days"]
    assert len(days) == 7
    assert all(1 <= day["tithiNumber"] <= 30 for day in days)
    assert all(1 <= day["nakshatraNumber"] <= 27 for day in days)


def test_activity_timing_endpoint_avoids_recursive_daily_guidance_calls(client, monkeypatch, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory)

    import app.services.daily_guidance_service as daily_guidance_module

    def _unexpected_daily_guidance(*args, **kwargs):
        raise AssertionError("Activity timing should not call get_daily_guidance per day.")

    monkeypatch.setattr(daily_guidance_module, "get_daily_guidance", _unexpected_daily_guidance)

    response = client.get(
        "/api/v1/activity-timing",
        params={"chartId": chart_id, "activity": "job_change", "month": "2026-05"},
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["chartId"] == chart_id
    assert body["activity"] == "job_change"
    assert body["month"] == "2026-05"
    assert 0 < len(body["topDates"]) <= 5
