"""Signed-in couple mode: the partner is a saved chart, and it is guarded like one.

The Muhurta Finder in Tools has scored a wedding against both charts since
2026-09-12, from birth details typed into the form. The signed-in picker and the
Muhurtham Naal list now take the partner as a saved chart id instead. The
scoring is the same ruling; what is new here is that a second chart id arrives
on the request, and a second chart id is a second thing to authorise.

Every identity below is synthetic.
"""
from __future__ import annotations

from uuid import UUID

import pytest

from app.core.auth import get_current_user, get_optional_user
from app.db.session import SessionLocal
from app.main import app
from app.models import BirthProfile, Chart
from app.models.subscription import Subscription
from app.models.user import User

INTRUDER_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd"
INTRUDER_EMAIL = "couple-intruder@jothidam.test"

_WEDDING_SEARCH = {"activity": "MARRIAGE", "dateFrom": "2027-01-01", "dateTo": "2027-02-28"}


def _save_chart(client, factory, *, name: str, birth_date: str, birth_time: str | None) -> str:
    payload = factory(display_name=name)
    payload["birthDateLocal"] = birth_date
    if birth_time is None:
        payload.pop("birthTimeLocal", None)
    else:
        payload["birthTimeLocal"] = birth_time
    created = client.post("/api/v1/birth-profiles", json=payload)
    assert created.status_code == 200, created.text
    chart_id = created.json()["data"]["chartId"]
    assert chart_id, created.text
    return chart_id


@pytest.fixture()
def couple(client, birth_profile_payload_factory) -> tuple[str, str]:
    bride = _save_chart(
        client, birth_profile_payload_factory,
        name="Bride Synthetic", birth_date="1994-03-18", birth_time="09:15:00",
    )
    groom = _save_chart(
        client, birth_profile_payload_factory,
        name="Groom Synthetic", birth_date="1991-11-02", birth_time="21:40:00",
    )
    return bride, groom


def test_published_dates_are_ranked_for_both_charts(client, couple):
    bride, groom = couple
    solo = client.get(f"/api/v1/charts/{bride}/muhurtham-naals", params={"year": 2026})
    both = client.get(
        f"/api/v1/charts/{bride}/muhurtham-naals",
        params={"year": 2026, "partnerChartId": groom, "subjectRole": "BRIDE"},
    )
    assert solo.status_code == 200, solo.text
    assert both.status_code == 200, both.text

    solo_body, body = solo.json(), both.json()
    assert solo_body.get("partnerChartId") is None
    assert all(len(m["readings"]) == 1 for m in solo_body["matches"])

    assert body["partnerChartId"] == groom
    assert body["context"]["subjectWho"]["en"] == "Bride"
    assert body["context"]["partner"]["who"]["en"] == "Groom"

    solo_by_date = {m["naal"]["date"]: m for m in solo_body["matches"]}
    for m in body["matches"]:
        assert [r["who"]["en"] for r in m["readings"]] == ["Bride", "Groom"]
        assert m["matchScore"] <= solo_by_date[m["naal"]["date"]]["matchScore"]
    assert body["context"]["recommendedCount"] <= solo_body["context"]["recommendedCount"]


def test_the_detailed_search_scores_a_saved_couple(client, couple):
    bride, groom = couple
    solo = client.get(f"/api/v1/charts/{bride}/muhurta", params=_WEDDING_SEARCH)
    both = client.get(
        f"/api/v1/charts/{bride}/muhurta",
        params={**_WEDDING_SEARCH, "partnerChartId": groom, "subjectRole": "BRIDE"},
    )
    assert solo.status_code == 200, solo.text
    assert both.status_code == 200, both.text

    slots = both.json()["data"]["slots"]
    solo_slots = solo.json()["data"]["slots"]
    assert slots and solo_slots, "two months should hold a wedding window for either reading"
    # Both dasha lines, each named — the same shape the public tool returns.
    dasha = slots[0]["dashaSupport"]["en"]
    assert "The bride" in dasha and "The groom" in dasha
    # The weaker side governs, seen from outside the engine.
    assert slots[0]["score"] <= solo_slots[0]["score"]


def test_the_location_route_takes_the_same_partner(client, couple):
    bride, groom = couple
    # `/muhurta` authenticates through `get_optional_user`, which the `client`
    # fixture does not override — without this the request arrives anonymous and
    # 401s before it reaches anything under test.
    app.dependency_overrides[get_optional_user] = app.dependency_overrides[get_current_user]
    response = client.get(
        "/api/v1/muhurta",
        params={**_WEDDING_SEARCH, "chartId": bride, "partnerChartId": groom, "subjectRole": "GROOM"},
    )
    assert response.status_code == 200, response.text
    slots = response.json()["data"]["slots"]
    assert slots
    assert slots[0]["dashaSupport"]["en"].startswith("The groom")


def test_a_partner_without_a_first_chart_is_refused(client, couple):
    _, groom = couple
    response = client.get("/api/v1/muhurta", params={**_WEDDING_SEARCH, "lat": 13.08, "lon": 80.27, "tz": "Asia/Kolkata", "partnerChartId": groom})
    assert response.status_code == 422, response.text


@pytest.mark.parametrize("path,params", [
    ("/api/v1/charts/{chart_id}/muhurta", _WEDDING_SEARCH),
    ("/api/v1/charts/{chart_id}/muhurtham-naals", {"year": 2026}),
])
def test_a_chart_cannot_be_its_own_partner(client, couple, path, params):
    bride, _ = couple
    response = client.get(path.format(chart_id=bride), params={**params, "partnerChartId": bride})
    assert response.status_code == 422, response.text


@pytest.mark.parametrize("path,params", [
    ("/api/v1/charts/{chart_id}/muhurta", _WEDDING_SEARCH),
    ("/api/v1/charts/{chart_id}/muhurtham-naals", {"year": 2026}),
])
def test_an_untimed_partner_is_refused_and_named(client, birth_profile_payload_factory, path, params):
    """A chart whose profile has no birth time — reachable only as legacy data.

    The API no longer calculates a chart for an untimed profile (it saves the
    profile with `chartId: null`), so this state cannot be created through it.
    Rows from before that rule still exist, and the guard is for them; the test
    builds one by clearing the time on a chart that was calculated with it.
    """
    bride = _save_chart(
        client, birth_profile_payload_factory,
        name="Bride Synthetic", birth_date="1994-03-18", birth_time="09:15:00",
    )
    untimed = _save_chart(
        client, birth_profile_payload_factory,
        name="Untimed Synthetic", birth_date="1991-11-02", birth_time="21:40:00",
    )
    with SessionLocal() as session:
        with session.begin():
            chart = session.get(Chart, UUID(untimed))
            session.get(BirthProfile, chart.birth_profile_id).birth_time_local = None
    response = client.get(
        path.format(chart_id=bride),
        params={**params, "partnerChartId": untimed, "subjectRole": "BRIDE"},
    )
    assert response.status_code == 422, response.text
    assert "groom" in response.json()["detail"].lower()


@pytest.mark.parametrize("path,params", [
    ("/api/v1/charts/{chart_id}/muhurta", _WEDDING_SEARCH),
    ("/api/v1/charts/{chart_id}/muhurtham-naals", {"year": 2026}),
    ("/api/v1/muhurta", _WEDDING_SEARCH),
    ("/api/v1/charts/{chart_id}/numerology/marriage-dates", {"year": 2027}),
    ("/api/v1/activity-timing", {"activity": "marriage", "month": "2027-01"}),
])
def test_a_partner_chart_belonging_to_someone_else_is_refused(
    client, birth_profile_payload_factory, path, params,
):
    """The partner id is a second way in, so it gets the same guard as the first.

    Without it a couple request would read another user's birth star and dasha
    through the factor sentences of the intruder's own chart.
    """
    victim = _save_chart(
        client, birth_profile_payload_factory,
        name="Victim Synthetic", birth_date="1992-05-05", birth_time="07:00:00",
    )

    with SessionLocal() as session:
        with session.begin():
            uid = UUID(INTRUDER_ID)
            session.add(User(user_id=uid, email=INTRUDER_EMAIL))
            session.flush()
            session.add(Subscription(user_id=uid, tier="premium", status="active"))
    intruder = User(user_id=UUID(INTRUDER_ID), email=INTRUDER_EMAIL)
    app.dependency_overrides[get_current_user] = lambda: intruder
    # The location route reads the optional user; an un-overridden one would
    # answer 401 and this test would pass on the wrong status's neighbour.
    app.dependency_overrides[get_optional_user] = lambda: intruder

    own = _save_chart(
        client, birth_profile_payload_factory,
        name="Intruder Synthetic", birth_date="1990-01-01", birth_time="12:00:00",
    )
    query = {**params, "partnerChartId": victim, "subjectRole": "BRIDE"}
    if "{chart_id}" in path:
        url = path.format(chart_id=own)
    else:
        url = path
        query["chartId"] = own
    response = client.get(url, params=query)
    assert response.status_code == 403, response.text


_SCAN = {"activity": "marriage", "month": "2027-01", "asOf": "2027-01-15"}


def test_the_quick_date_scan_reads_both_charts_for_a_wedding(client, couple):
    """The month shortlist above the detailed search, under the same ruling (R1).

    A day's score is the lower of the two charts' own scores, each read exactly
    as that chart's own scan reads it, and every reason names whose Tara it is.
    """
    bride, groom = couple
    bride_solo = client.get("/api/v1/activity-timing", params={**_SCAN, "chartId": bride})
    groom_solo = client.get("/api/v1/activity-timing", params={**_SCAN, "chartId": groom})
    both = client.get(
        "/api/v1/activity-timing",
        params={**_SCAN, "chartId": bride, "partnerChartId": groom, "subjectRole": "BRIDE"},
    )
    for response in (bride_solo, groom_solo, both):
        assert response.status_code == 200, response.text

    assert bride_solo.json()["data"]["partnerChartId"] is None
    body = both.json()["data"]
    assert body["partnerChartId"] == groom

    day = body["dateResult"]
    assert day["score"] == min(
        bride_solo.json()["data"]["dateResult"]["score"],
        groom_solo.json()["data"]["dateResult"]["score"],
    )
    assert body["topDates"]
    for item in [day, *body["topDates"]]:
        assert item["reasonEn"].startswith("Bride: "), item["reasonEn"]
        assert "Groom: " in item["reasonEn"]
        assert "மணமகள்: " in item["reasonTa"] and "மணமகன்: " in item["reasonTa"]


def test_the_quick_date_scan_refuses_a_partner_for_any_other_rite(client, couple):
    bride, groom = couple
    response = client.get(
        "/api/v1/activity-timing",
        params={**_SCAN, "activity": "child_birth", "chartId": bride, "partnerChartId": groom},
    )
    assert response.status_code == 422, response.text
    assert "wedding" in response.json()["detail"]


def test_the_quick_date_scan_refuses_a_chart_as_its_own_partner(client, couple):
    bride, _ = couple
    response = client.get(
        "/api/v1/activity-timing", params={**_SCAN, "chartId": bride, "partnerChartId": bride},
    )
    assert response.status_code == 422, response.text


@pytest.mark.parametrize("activity", ["JOB_START", "NAMING_CEREMONY"])
def test_a_partner_is_read_only_for_a_wedding(client, couple, activity):
    """Ruling 2026-09-15: every other rite is elected on the one it is for."""
    bride, groom = couple
    response = client.get(
        f"/api/v1/charts/{bride}/muhurta",
        params={**_WEDDING_SEARCH, "activity": activity, "partnerChartId": groom},
    )
    assert response.status_code == 422, response.text
    assert "wedding" in response.json()["detail"]
