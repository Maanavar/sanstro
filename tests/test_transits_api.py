
from datetime import UTC, datetime

from app.calculations.astro import (
    house_from_reference,
    rasi_from_degree,
    utc_datetime_to_julian_day,
)
from app.calculations.transits import (
    classify_sani_cycle,
    find_saturn_egress_jd,
    saturn_longitude_at_jd,
)
from app.services.transit_service import _EGRESS_HOP_DAYS, _sade_sati_cycle_end_jd


def _birth_profile_payload():
    return {
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Arjun Kumar",
        "birthDateLocal": "1991-07-22",
        "birthTimeLocal": "06:30:00",
        "birthPlace": "Chennai, Tamil Nadu, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    }


def _create_chart(client):
    created = client.post("/api/v1/birth-profiles", json=_birth_profile_payload())
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


# ── Unit: Ardhashtama Sani classification (no birth profile required) ──────────

def test_ardhashtama_sani_dhanusu_moon_saturn_meenam():
    # Dhanusu moon (9), Saturn in Meenam (12): house_from = 4 → Ardhashtama
    cycle = classify_sani_cycle(house_from_reference("Dhanusu", "Meenam"))
    assert cycle.type == "ARDHASHTAMA_SANI"
    assert cycle.is_active is True


def test_sani_classification_not_ardhashtama_for_other_positions():
    # Viruchigam moon (8), Saturn in Meenam (12): house_from = 5 → no special cycle
    cycle = classify_sani_cycle(house_from_reference("Viruchigam", "Meenam"))
    assert cycle.type is None


# ── Unit: the Ezharai cycle-end walk across a rasi boundary ───────────────────
#
# `_EGRESS_HOP_DAYS` exists for exactly one situation and nothing exercised it.
# `find_saturn_egress_jd` RAISES when its start JD is not inside the rasi it is
# asked about, so each hop of the Ezharai walk has to start clear of the
# boundary it just crossed — a zero hop would start the next search on the
# boundary itself and blow up the whole Sade Sati card with a 500.
#
# These are unit tests rather than API tests deliberately: the endpoint only
# reaches this code when the caller's natal Moon puts the day's real Saturn in
# an active cycle, and pinning that means pinning a birth date to the ephemeris
# twice over. The walk itself is the thing under test.

def _saturn_jd_just_short_of_a_boundary(*, search_from: datetime) -> tuple[float, int]:
    """A JD at which Saturn is inside a rasi but less than a day from leaving.

    Derived from the ephemeris rather than hardcoded, so an ayanamsa change
    moves the test with it instead of silently making it assert nothing.
    """
    jd = utc_datetime_to_julian_day(search_from)
    rasi = rasi_from_degree(saturn_longitude_at_jd(jd))
    for _ in range(800):
        if rasi_from_degree(saturn_longitude_at_jd(jd + 1.0)) != rasi:
            return jd, rasi
        jd += 1.0
        rasi = rasi_from_degree(saturn_longitude_at_jd(jd))
    raise AssertionError("no Saturn rasi boundary found in the search window")


def test_cycle_end_walk_survives_saturn_parked_on_a_rasi_boundary():
    boundary_jd, rasi = _saturn_jd_just_short_of_a_boundary(
        search_from=datetime(2027, 1, 1, tzinfo=UTC),
    )
    # Precondition: Saturn crosses out of `rasi` within a day — nearer the
    # boundary than the hop is wide, which is the case the constant is sized for.
    assert rasi_from_degree(saturn_longitude_at_jd(boundary_jd)) == rasi
    assert rasi_from_degree(saturn_longitude_at_jd(boundary_jd + 1.0)) != rasi
    assert _EGRESS_HOP_DAYS > 1.0

    phase_egress = find_saturn_egress_jd(rasi, boundary_jd)

    # Phase 1 walks two more rasis, so it takes the hop twice — the deepest path.
    cycle_end = _sade_sati_cycle_end_jd(rasi, phase_egress, "EZHARAI_SANI_PHASE_1")
    assert cycle_end > phase_egress
    # Two further ~2.5-year residencies. Wide bounds: this asserts the walk
    # advanced by rasis, not that the ephemeris hits a particular day.
    assert 3.0 < (cycle_end - phase_egress) / 365.25 < 7.0

    # Phase 2 / Janma walk one rasi; phase 3 is already the last, so it ends
    # where the phase does.
    one_rasi_end = _sade_sati_cycle_end_jd(rasi, phase_egress, "JANMA_SANI")
    assert phase_egress < one_rasi_end < cycle_end
    assert _sade_sati_cycle_end_jd(rasi, phase_egress, "EZHARAI_SANI_PHASE_3") == phase_egress


def test_egress_hop_lands_inside_the_next_rasi_at_every_step():
    """The invariant `_EGRESS_HOP_DAYS` encodes, asserted directly.

    Saturn moves ~2'/day at its fastest, so two days past an egress puts it
    ~4' inside the next sign. If a future step size or ephemeris change broke
    that, the walk above would raise instead of returning a wrong answer — but
    only for readers who happen to be mid-cycle, and only in production.
    """
    boundary_jd, rasi = _saturn_jd_just_short_of_a_boundary(
        search_from=datetime(2027, 1, 1, tzinfo=UTC),
    )
    jd = find_saturn_egress_jd(rasi, boundary_jd)
    current = rasi
    for _ in range(2):
        expected_next = (current % 12) + 1
        landed_in = rasi_from_degree(saturn_longitude_at_jd(jd + _EGRESS_HOP_DAYS))
        assert landed_in == expected_next, (
            f"hop of {_EGRESS_HOP_DAYS}d after leaving rasi {current} landed in "
            f"{landed_in}, not {expected_next}"
        )
        jd = find_saturn_egress_jd(expected_next, jd + _EGRESS_HOP_DAYS)
        current = expected_next


# ── Integration: API tests using real fixture chart ────────────────────────────

def test_gochar_current_returns_transit_snapshot(client):
    chart_id = _create_chart(client)

    response = client.get(
        f"/api/v1/charts/{chart_id}/gochar/current",
        params={"datetime": "2026-05-13T00:00:00Z"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["janmaRasi"] == "VIRUCHIGAM"

    transits = {item["graha"]: item for item in body["data"]["transits"]}
    assert len(transits) == 9
    assert transits["SANI"]["currentRasi"] == "MEENAM"
    assert transits["RAHU"]["isRetrograde"] is True
    assert transits["KETU"]["isRetrograde"] is True
    assert transits["MOON"]["isSandhi"] in {True, False}
    assert transits["SUN"]["isGandanta"] in {True, False}


def test_gochar_current_accepts_date_only_and_defaults_to_noon(client):
    chart_id = _create_chart(client)

    response = client.get(f"/api/v1/charts/{chart_id}/gochar/current", params={"date": "2026-05-21"})

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["asOfUTC"].startswith("2026-05-21")


def test_sani_cycle_endpoint_returns_valid_response(client):
    chart_id = _create_chart(client)

    response = client.get(f"/api/v1/charts/{chart_id}/sani-cycle", params={"date": "2026-05-21"})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["saturnRasi"] == "MEENAM"
    assert body["data"]["janmaRasi"] == "VIRUCHIGAM"
    assert body["data"]["positionFromMoon"] == 5
    assert body["data"]["moonBasedCycle"]["isActive"] in {True, False}
    assert body["data"]["lagnaBasedCycle"]["isActive"] in {True, False}
    assert body["data"]["moonBasedCycle"]["role"] == "primary"
    assert body["data"]["lagnaBasedCycle"]["role"] == "cross_check"
    for cycle in (body["data"]["moonBasedCycle"], body["data"]["lagnaBasedCycle"]):
        if cycle["isActive"]:
            assert cycle["phaseEndsOn"]
            assert cycle["cycleEndsOn"]
    assert "confirmationSentence" in body["data"]


def test_peyarchi_endpoint_returns_upcoming_events(client):
    chart_id = _create_chart(client)

    response = client.get(
        f"/api/v1/charts/{chart_id}/peyarchi",
        params={"as_of": "2026-05-22"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["data"]) == 4
    assert [event["planet"] for event in body["data"]] == ["JUPITER", "RAHU", "KETU", "SATURN"]
    assert all(event["daysFromToday"] > 0 for event in body["data"])
    assert body["data"][3]["saniCycleAfter"] in {"EZHARAI_SANI_PHASE_1", "JANMA_SANI", "EZHARAI_SANI_PHASE_3", "ARDHASHTAMA_SANI", "KANTAKA_SANI", "ASHTAMA_SANI", None}


def test_peyarchi_upcoming_filters_to_window(client):
    chart_id = _create_chart(client)

    response = client.get(
        f"/api/v1/charts/{chart_id}/peyarchi/upcoming",
        params={"as_of": "2026-05-22", "window_days": 30},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    events = body["data"]
    assert events
    assert "JUPITER" in [event["planet"] for event in events]
    assert all(0 <= event["daysFromToday"] <= 30 for event in events)
