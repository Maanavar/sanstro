from __future__ import annotations

import pytest


def test_personalized_muhurta_uses_a_transient_birth_chart_and_never_persists(client):
    response = client.post(
        "/api/v1/public/muhurta/personalized",
        json={
            "birth": {
                "displayName": "Test Reader",
                "birthDateLocal": "1992-04-18",
                "birthTimeLocal": "09:15:00",
                "birthLatitude": 12.9716,
                "birthLongitude": 77.5946,
                "birthTimezone": "Asia/Kolkata",
                "birthPlace": "Bengaluru, Karnataka, India",
            },
            "eventType": "JOB_START",
            "dateFrom": "2026-09-01",
            "dateTo": "2026-09-07",
            "lat": 12.9716,
            "lng": 77.5946,
            "timezone": "Asia/Kolkata",
            "place": "Bengaluru, Karnataka, India",
        },
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["chartId"] is None
    assert payload["activityLocation"]["place"] == "Bengaluru, Karnataka, India"
    assert payload["slots"]
    assert payload["slots"][0]["dashaSupport"] is not None
    assert payload["slots"][0]["factors"]


def test_personalized_muhurta_requires_birth_time(client):
    response = client.post(
        "/api/v1/public/muhurta/personalized",
        json={
            "birth": {
                "birthDateLocal": "1992-04-18",
                "birthLatitude": 12.9716,
                "birthLongitude": 77.5946,
                "birthTimezone": "Asia/Kolkata",
                "birthPlace": "Bengaluru, Karnataka, India",
            },
            "eventType": "JOB_START",
            "dateFrom": "2026-09-01",
            "dateTo": "2026-09-01",
            "lat": 12.9716,
            "lng": 77.5946,
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 422
    assert "Birth time is required" in response.json()["detail"]


# ── Couple mode: a wedding has two subjects ─────────────────────────────────
#
# Every birth block below is synthetic. See CLAUDE.md — real-looking birth data
# in a fixture is a review finding, not a convenience.

_BRIDE = {
    "displayName": "Test Bride",
    "birthDateLocal": "1994-02-11",
    "birthTimeLocal": "07:40:00",
    "birthLatitude": 13.0827,
    "birthLongitude": 80.2707,
    "birthTimezone": "Asia/Kolkata",
    "birthPlace": "Chennai, Tamil Nadu, India",
}
_GROOM = {
    "displayName": "Test Groom",
    "birthDateLocal": "1991-09-03",
    "birthTimeLocal": "21:05:00",
    "birthLatitude": 11.0168,
    "birthLongitude": 76.9558,
    "birthTimezone": "Asia/Kolkata",
    "birthPlace": "Coimbatore, Tamil Nadu, India",
}


def _wedding_body(**overrides):
    body = {
        "birth": _BRIDE,
        "subjectRole": "BRIDE",
        "eventType": "MARRIAGE",
        "dateFrom": "2026-09-01",
        "dateTo": "2026-09-30",
        "lat": 13.0827,
        "lng": 80.2707,
        "timezone": "Asia/Kolkata",
        "place": "Chennai, Tamil Nadu, India",
    }
    body.update(overrides)
    return body


@pytest.mark.parametrize("event_type", ["JOB_START", "NAMING_CEREMONY"])
def test_a_partner_is_refused_for_any_rite_but_a_wedding(client, event_type):
    """Ruling 2026-09-15: only a marriage is elected on two charts.

    The Tools form only sends `partner` for a wedding, and until now that was
    the whole of the enforcement — any other client could have had a naming
    ceremony scored "weaker side governs" with no ruling behind it.
    """
    response = client.post(
        "/api/v1/public/muhurta/personalized",
        json=_wedding_body(partner=_GROOM, eventType=event_type, subjectRole="PERSON"),
    )
    assert response.status_code == 422, response.text
    assert "wedding" in response.json()["detail"]


def test_a_wedding_can_be_checked_against_both_charts(client):
    """Both readings are reported for each personal factor, each named.

    The point of the feature in one assertion: before it, a wedding date was
    scored on one person's Chandrashtama and Tara Bala and recommended as though
    that were the whole question.
    """
    response = client.post(
        "/api/v1/public/muhurta/personalized", json=_wedding_body(partner=_GROOM),
    )

    assert response.status_code == 200, response.text
    slots = response.json()["data"]["slots"]
    assert slots
    reasons = " ".join(
        factor["reason"]["en"] for slot in slots for factor in slot["factors"]
    )
    assert "the bride's" in reasons
    assert "the groom's" in reasons
    # Both dasha lines, on the one field the four-surface contract has.
    dasha = slots[0]["dashaSupport"]["en"]
    assert "The bride" in dasha and "The groom" in dasha


def test_the_couple_score_is_never_above_the_same_search_for_one_of_them(client):
    """The weaker side governs — the ruling, seen from outside the engine."""
    both = client.post("/api/v1/public/muhurta/personalized", json=_wedding_body(partner=_GROOM))
    bride_only = client.post("/api/v1/public/muhurta/personalized", json=_wedding_body())
    assert both.status_code == 200 and bride_only.status_code == 200

    couple_top = both.json()["data"]["slots"][0]["score"]
    solo_top = bride_only.json()["data"]["slots"][0]["score"]
    assert couple_top <= solo_top


def test_the_partner_chart_also_needs_a_birth_time(client):
    """The same rule as the first chart: both feed the personal layer, so a
    missing time on either would mean claiming a Lagna/Hora/Dasha we do not have."""
    partner = {k: v for k, v in _GROOM.items() if k != "birthTimeLocal"}
    response = client.post(
        "/api/v1/public/muhurta/personalized", json=_wedding_body(partner=partner),
    )

    assert response.status_code == 422
    assert "second person" in response.json()["detail"]


def test_a_failing_chart_is_named_when_there_are_two(client):
    """One error message for two identical-looking blocks leaves the reader
    guessing which half to correct."""
    partner = {**_GROOM, "birthLatitude": 999.0}
    response = client.post(
        "/api/v1/public/muhurta/personalized", json=_wedding_body(partner=partner),
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, str) and detail.startswith("Groom:")


def test_one_person_mode_stays_available_and_unchanged(client):
    """"Check for one person only" is a supported answer, not a degraded one."""
    response = client.post(
        "/api/v1/public/muhurta/personalized", json=_wedding_body(subjectRole="PERSON"),
    )

    assert response.status_code == 200
    slots = response.json()["data"]["slots"]
    assert slots
    factors = [f["factor"] for slot in slots for f in slot["factors"]]
    # No second reading of any personal factor on any day.
    for slot in slots:
        personal = [f["factor"] for f in slot["factors"] if f["factor"] == "CHANDRA_BALA"]
        assert len(personal) == 1
    assert "TARA_BALA" in factors


def test_naming_the_bride_is_what_unlocks_the_jupiter_rule(client):
    """Ch. XIV p.79 is counted from the bride's Janma-Rasi. A run that never said
    which chart is hers gets silence, not a guess — including for the groom."""
    named = client.post("/api/v1/public/muhurta/personalized", json=_wedding_body())
    unnamed = client.post(
        "/api/v1/public/muhurta/personalized", json=_wedding_body(subjectRole="PERSON"),
    )
    as_groom = client.post(
        "/api/v1/public/muhurta/personalized", json=_wedding_body(subjectRole="GROOM"),
    )

    def gochara(response):
        return [
            factor
            for slot in response.json()["data"]["slots"]
            for factor in slot["factors"]
            if factor["factor"] == "GRAHA_GOCHARA"
        ]

    assert gochara(named)
    assert gochara(unnamed) == []
    assert gochara(as_groom) == []
    # Sourced, and carrying the passage the copy on screen deliberately softens.
    factor = gochara(named)[0]
    assert factor["sourced"] is True
    assert factor["ruleId"] == "MARRIAGE_JUPITER_GOCHARA_FROM_MOON"
    assert factor["citation"]["page"] == "79"


def test_a_partner_without_a_first_chart_is_refused(client):
    response = client.post(
        "/api/v1/public/muhurta/personalized",
        json={k: v for k, v in _wedding_body(partner=_GROOM).items() if k != "birth"},
    )

    assert response.status_code == 422


def test_an_unnamed_couple_still_has_two_distinguishable_charts(client):
    """A partner without roles must not narrate both charts as "this person".

    The web form always sends roles, but the route accepts a partner without
    them — and the single-chart fallback copy is unambiguous for one chart and
    useless for two identical sentences stacked on each other.
    """
    response = client.post(
        "/api/v1/public/muhurta/personalized",
        json=_wedding_body(partner=_GROOM, subjectRole="PERSON"),
    )

    assert response.status_code == 200, response.text
    slot = response.json()["data"]["slots"][0]
    chandra = [f for f in slot["factors"] if f["factor"] == "CHANDRA_BALA"]
    assert len(chandra) == 2
    # Two readings, two distinguishable sentences — the whole point.
    assert len({f["reason"]["en"] for f in chandra}) == 2
    assert len({f["reason"]["ta"] for f in chandra}) == 2
    assert any("the first chart" in f["reason"]["en"] for f in chandra)
    assert any("the second chart" in f["reason"]["en"] for f in chandra)
    assert any("முதல் ஜாதகம்" in f["reason"]["ta"] for f in chandra)
    assert any("இரண்டாம் ஜாதகம்" in f["reason"]["ta"] for f in chandra)
    assert "this person" not in " ".join(f["reason"]["en"] for f in chandra)
