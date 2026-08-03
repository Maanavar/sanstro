"""Baby naming route tests (NUM-50/51/52) — public and chart-scoped.

Two flags gate every route here: `numerology_engine` (master) and
`numerology_baby_naming` (this feature specifically). Both must be True for a
200; either False must 404, and the flag is checked before the chart on the
authenticated route (same convention as every other route in
`app.api.numerology`).
"""
from __future__ import annotations

from collections.abc import Iterator
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.core.rate_limit import reset_rate_limit_backend
from app.services.feature_flags import reset_flag, set_flag

PUBLIC_URL = "/api/v1/public/numerology/baby-names"
PREVIEW_URL = "/api/v1/public/numerology/baby-names-preview"

#: A clearly-synthetic native for the ephemeral (unpersisted) preview path.
SYNTHETIC_BIRTH = {
    "displayName": "Preview Test Baby",
    "birthDateLocal": "2026-01-15",
    "birthTimeLocal": "08:15:00",
    "birthPlace": "Chennai, Tamil Nadu, India",
    "birthLatitude": 13.0827,
    "birthLongitude": 80.2707,
    "birthTimezone": "Asia/Kolkata",
}


def _chart_url(chart_id: str) -> str:
    return f"/api/v1/charts/{chart_id}/numerology/baby-names"


@pytest.fixture
def both_flags_on() -> Iterator[None]:
    reset_rate_limit_backend()
    set_flag("numerology_engine", True)
    set_flag("numerology_baby_naming", True)
    try:
        yield
    finally:
        reset_flag("numerology_engine")
        reset_flag("numerology_baby_naming")
        reset_rate_limit_backend()


@pytest.fixture
def only_engine_on() -> Iterator[None]:
    """The realistic rollback state: `numerology_engine` already launched,
    `numerology_baby_naming` deliberately still off."""
    reset_rate_limit_backend()
    set_flag("numerology_engine", True)
    set_flag("numerology_baby_naming", False)
    try:
        yield
    finally:
        reset_flag("numerology_engine")
        reset_flag("numerology_baby_naming")
        reset_rate_limit_backend()


def _create_chart(client: TestClient) -> UUID:
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "11111111-1111-1111-1111-111111111111",
            "displayName": "Baby Naming API Test",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )
    assert created.status_code == 200
    chart = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": created.json()["data"]["birthProfileId"],
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert chart.status_code == 200
    return UUID(chart.json()["data"]["chartId"])


# ── Public route ─────────────────────────────────────────────────────────────
def test_public_404s_while_baby_naming_flag_is_off(
    client: TestClient, only_engine_on: None
) -> None:
    """`numerology_engine` alone is not enough — this is the realistic state
    once the master flag has launched but this feature has not."""
    response = client.post(PUBLIC_URL, json={"nakshatraId": 1, "pada": 1})
    assert response.status_code == 404


def test_public_returns_pada_matched_names_when_both_flags_are_on(
    client: TestClient, both_flags_on: None
) -> None:
    response = client.post(PUBLIC_URL, json={"nakshatraId": 1, "pada": 1})
    assert response.status_code == 200
    body = response.json()

    assert body["targetNakshatraId"] == 1
    assert body["targetPada"] == 1
    # No chart on this path — no lagna, no alignment on any candidate.
    assert body["lagnaRasi"] is None
    assert all(c["alignment"] is None for c in body["candidates"])
    # Every canon row is still draft — see the service test of the same name.
    assert body["usable"] is False
    assert body["canonVerified"] is False
    assert body["traditionEn"]


def test_public_rejects_an_out_of_range_pada(client: TestClient, both_flags_on: None) -> None:
    response = client.post(PUBLIC_URL, json={"nakshatraId": 1, "pada": 5})
    assert response.status_code == 422


# ── Scope ladder over the wire (2026-07-31) ──────────────────────────────────
#
# The engine tests pin the ladder's behaviour; these pin that a client can
# actually drive it and can render the explanation. Both were missing pieces
# in the same defect: the tool offered only the strict rule and said nothing
# about it, which reads as "a name not opening with this letter is wrong".
def test_every_scope_rung_is_reachable_over_the_wire(
    client: TestClient, both_flags_on: None
) -> None:
    counts: list[int] = []
    for mode in ("pada_first", "pada_weighted", "rasi_wide", "open"):
        response = client.post(
            PUBLIC_URL, json={"nakshatraId": 21, "pada": 3, "mode": mode, "limit": 50}
        )
        assert response.status_code == 200, mode
        body = response.json()
        assert body["mode"] == mode
        counts.append(len(body["candidates"]))
    assert counts == sorted(counts)
    assert counts[-1] > counts[0]


def test_an_unknown_scope_is_rejected_rather_than_silently_narrowed(
    client: TestClient, both_flags_on: None
) -> None:
    """A typo must not quietly fall back to the strict rule — that would show a
    parent a narrower answer than the one they asked for, with no signal."""
    response = client.post(
        PUBLIC_URL, json={"nakshatraId": 21, "pada": 3, "mode": "everything"}
    )
    assert response.status_code == 422


def test_the_response_carries_what_the_scope_explanation_needs(
    client: TestClient, both_flags_on: None
) -> None:
    """Naming the rasi is not decoration: a scope described as "your rasi"
    without saying which rasi is not an explanation, and the client has no
    nakshatra-to-rasi table of its own."""
    response = client.post(PUBLIC_URL, json={"nakshatraId": 21, "pada": 3})
    body = response.json()
    assert body["targetRasi"] == 10  # Uthiradam paadham 3 falls in Makaram
    assert body["targetRasiEn"]
    assert body["targetRasiTa"]


def test_every_candidate_says_which_rule_admitted_it(
    client: TestClient, both_flags_on: None
) -> None:
    """A widened list must never be indistinguishable from a strict one.

    At `open` scope a name from an unrelated star sits on the same page as one
    the paadham actually calls for; without `relation` (and the paadham its own
    letter DOES open) the tool would be passing the first off as the second.
    """
    strict = client.post(PUBLIC_URL, json={"nakshatraId": 21, "pada": 3}).json()
    assert {c["relation"] for c in strict["candidates"]} == {"on_paadham"}

    wide = client.post(
        PUBLIC_URL, json={"nakshatraId": 21, "pada": 3, "mode": "open", "limit": 50}
    ).json()
    relations = {c["relation"] for c in wide["candidates"]}
    assert "on_paadham" in relations
    assert relations - {"on_paadham"}, "open scope must reach past this paadham"
    for candidate in wide["candidates"]:
        if candidate["relation"] == "no_paadham":
            assert candidate["nakshatraId"] is None
        else:
            # "ஆ opens Kaarthigai paadham 1" is an answer; "not your paadham"
            # is only a verdict.
            assert candidate["nakshatraTa"]
            assert candidate["aksharaTa"]
            assert candidate["pada"] in (1, 2, 3, 4)


def test_on_paadham_names_still_lead_at_the_widest_scope(
    client: TestClient, both_flags_on: None
) -> None:
    """Doctrine D2 survives widening — a number never overrides a graha, so
    opening the scope changes what ELSE is offered, never what leads."""
    body = client.post(
        PREVIEW_URL, json={"birth": SYNTHETIC_BIRTH, "mode": "open", "limit": 50}
    ).json()
    relations = [c["relation"] for c in body["candidates"]]
    if "on_paadham" in relations:
        last_on_target = len(relations) - 1 - relations[::-1].index("on_paadham")
        assert all(r == "on_paadham" for r in relations[: last_on_target + 1])


# ── Public preview route (birth details, ephemeral chart) ──────────────────
def test_preview_404s_while_baby_naming_flag_is_off(
    client: TestClient, only_engine_on: None
) -> None:
    response = client.post(PREVIEW_URL, json={"birth": SYNTHETIC_BIRTH})
    assert response.status_code == 404


def test_preview_ranks_names_by_pada_then_alignment_with_no_saved_profile(
    client: TestClient, both_flags_on: None
) -> None:
    """The primary path: no birth profile, no chart_id, no login — just birth
    details, mirroring how Jadhagam Generator's `/chart-preview` already works."""
    response = client.post(PREVIEW_URL, json={"birth": SYNTHETIC_BIRTH})
    assert response.status_code == 200
    body = response.json()

    assert 1 <= body["targetNakshatraId"] <= 27
    assert 1 <= body["targetPada"] <= 4
    # Unlike the bare nakshatra+pada route: an ephemeral chart still has a
    # real lagna, so this DOES carry alignment.
    assert body["lagnaRasi"] is not None
    for candidate in body["candidates"]:
        assert candidate["alignment"] is not None
        assert candidate["reading"]["root"] in range(1, 10)
    assert body["usable"] is False  # draft canon — see naming-service tests


def test_preview_rejects_incomplete_birth_details(
    client: TestClient, both_flags_on: None
) -> None:
    incomplete = {k: v for k, v in SYNTHETIC_BIRTH.items() if k != "birthLatitude"}
    response = client.post(PREVIEW_URL, json={"birth": incomplete})
    assert response.status_code == 422


# ── userNames: a parent's own shortlist, ranked in place ───────────────────
def test_preview_ranks_a_users_own_shortlist_in_place(
    client: TestClient, both_flags_on: None
) -> None:
    """The whole point of the feature: the parent's own candidate names come
    back inside `candidates`, at their true rank, tagged so the UI can label
    them "your pick" rather than silently blending in as a recommendation."""
    response = client.post(
        PREVIEW_URL,
        json={
            "birth": SYNTHETIC_BIRTH,
            "mode": "open",
            "limit": 5,
            "userNames": ["Zzqxw Not A Real Name", "Suresh"],
        },
    )
    assert response.status_code == 200
    body = response.json()
    sources = {c["latinSpelling"]: c["source"] for c in body["candidates"]}
    assert sources.get("Zzqxw Not A Real Name") in ("user", "both")
    for candidate in body["candidates"]:
        assert candidate["overallRank"] >= 1
    assert body["totalMatches"] >= len(body["candidates"])


def test_preview_rejects_more_than_five_shortlist_names(
    client: TestClient, both_flags_on: None
) -> None:
    response = client.post(
        PREVIEW_URL,
        json={"birth": SYNTHETIC_BIRTH, "userNames": ["A", "B", "C", "D", "E", "F"]},
    )
    assert response.status_code == 422


def test_preview_shortlist_names_are_never_dropped_by_the_display_limit(
    client: TestClient, both_flags_on: None
) -> None:
    """A tiny `limit` still trims the corpus side only — every shortlist name
    the parent typed must still be in the response."""
    response = client.post(
        PREVIEW_URL,
        json={"birth": SYNTHETIC_BIRTH, "limit": 1, "userNames": ["Zzqxw Not A Real Name"]},
    )
    body = response.json()
    assert "Zzqxw Not A Real Name" in {c["latinSpelling"] for c in body["candidates"]}


# ── Chart-scoped route ───────────────────────────────────────────────────────
def test_chart_route_404s_while_baby_naming_flag_is_off(
    client: TestClient, only_engine_on: None
) -> None:
    """Flag checked before the chart: a made-up id must 404 identically to a
    real one while the feature is off, so the flag cannot be used to probe ids."""
    made_up_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(_chart_url(made_up_id))
    assert response.status_code == 404


def test_chart_route_ranks_names_by_pada_then_alignment(
    client: TestClient, both_flags_on: None
) -> None:
    chart_id = _create_chart(client)
    response = client.get(_chart_url(str(chart_id)))
    assert response.status_code == 200
    body = response.json()

    assert 1 <= body["targetNakshatraId"] <= 27
    assert 1 <= body["targetPada"] <= 4
    assert body["lagnaRasi"] is not None
    assert body["usable"] is False  # draft canon — see naming-service tests

    for candidate in body["candidates"]:
        assert candidate["reading"]["root"] in range(1, 10)
        # Chart-scoped: every candidate gets an alignment.
        assert candidate["alignment"] is not None


def test_chart_route_404s_for_a_chart_that_does_not_exist(
    client: TestClient, both_flags_on: None
) -> None:
    made_up_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(_chart_url(made_up_id))
    assert response.status_code == 404
