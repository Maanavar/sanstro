"""Authenticated, chart-aware numerology endpoints (Phases 3-4).

Three things these tests exist to hold down, beyond the happy paths:

1. **The flag is checked before the chart.** A flag-off deployment must answer
   404 identically whether or not the chart exists, or the gate becomes an
   existence oracle for chart ids.
2. **No prose leaks while the corpus is unreviewed.** Every explanation string
   these engines can emit was drafted by one hand and has had no Tamil native
   pass. The schema converters route them through ``reviewed_prose``; this file
   asserts the result rather than trusting the converters were all remembered.
3. **"No change needed" actually fires over HTTP.** The doctrine guard is unit
   tested in ``test_numerology_alignment.py``, but a guard that is correct in
   the engine and dropped by the response model is still a slot machine.
"""
from __future__ import annotations

from collections.abc import Iterator
from typing import Any
from uuid import uuid4

import pytest

from app.calculations import numerology_correction
from app.services import numerology_content
from app.services.feature_flags import reset_flag, set_flag


@pytest.fixture
def enabled() -> Iterator[None]:
    set_flag("numerology_engine", True)
    try:
        yield
    finally:
        reset_flag("numerology_engine")


@pytest.fixture
def numerology_off() -> Iterator[None]:
    """The flag ships ON (2026-07-28) — this forces the rollback path so the
    gate itself stays under test rather than only its currently-launched
    happy path."""
    set_flag("numerology_engine", False)
    try:
        yield
    finally:
        reset_flag("numerology_engine")


@pytest.fixture
def reviewed() -> Iterator[None]:
    """Pretend the Tamil corpus has cleared review.

    Only for the test that asserts prose appears *once it does* — proving the
    fields are wired and merely withheld, not missing. Everything else runs
    against the real (unreviewed) state.
    """
    original = numerology_content.CONTENT_REVIEWED
    numerology_content.CONTENT_REVIEWED = True
    try:
        yield
    finally:
        numerology_content.CONTENT_REVIEWED = original


@pytest.fixture
def legal_warning_unreviewed() -> Iterator[None]:
    """Force plan §9.4's refusal path.

    The warning's own gate ships ON (2026-07-29), so the withholding branch is
    no longer the default and would otherwise fall out of test. It is the more
    important of the two branches — it is the rule that a recommendation never
    ships without the cost of acting on it — so it gets driven explicitly rather
    than being tested only while a flag happened to be off.
    """
    original = numerology_correction.LEGAL_WARNING_REVIEWED
    numerology_correction.LEGAL_WARNING_REVIEWED = False
    try:
        yield
    finally:
        numerology_correction.LEGAL_WARNING_REVIEWED = original


def _create_chart(client, native: dict[str, Any] | None = None) -> str:
    """A clearly-synthetic Chennai-born native. No real birth data in fixtures."""
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "11111111-1111-1111-1111-111111111111",
            "displayName": "Numerology Test",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
            **(native or {}),
        },
    )
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


#: Bilingual keys that are NOT numerology prose and must not trip the scanner.
#: ``graha*`` comes from ``app.calculations.display_names``, the app-wide graha
#: name map that every other surface already renders; ``tradition*`` is the
#: single "Chaldean numerology, as practised in Tamil Nadu" declaration that
#: plan §9.5 requires and Phase 2 already ships.
_NON_PROSE_BILINGUAL_KEYS = frozenset({"grahaEn", "grahaTa", "traditionEn", "traditionTa"})


def _prose_values(node: Any) -> list[tuple[str, Any]]:
    """Every (key, value) in a response that looks like numerology's own copy.

    Keyed on the ``<field>En`` / ``<field>Ta`` suffix convention rather than a
    list of known field names, so a Phase 5/6 response model that adds a new
    explanation field is caught here instead of shipping unreviewed Tamil.

    Deliberately does *not* match ``BiText`` objects (``{"ta": …, "en": …}``):
    those come from the muhurta and muhurtham-naal engines, which are existing
    reviewed content this layer only passes through — flagging them would make
    the guard cry wolf on copy that is already live on other routes.
    """
    found: list[tuple[str, Any]] = []
    if isinstance(node, dict):
        for key, value in node.items():
            if key.endswith(("En", "Ta")) and key not in _NON_PROSE_BILINGUAL_KEYS:
                found.append((key, value))
            found.extend(_prose_values(value))
    elif isinstance(node, list):
        for item in node:
            found.extend(_prose_values(item))
    return found


# ── Gate ─────────────────────────────────────────────────────────────────────
#: (verb, path suffix, valid payload — query params for GET, body for POST).
#: The payloads are not decoration: FastAPI validates required params and bodies
#: *before* the route function runs, so a lucky-dates request with no dates or a
#: name-correction with no name answers 422 and never reaches the flag check.
#: That is harmless in itself — the 422 is identical with the flag on or off,
#: and for a chart that exists or not — but a gate test that never reaches the
#: gate proves nothing.
ROUTES: tuple[tuple[str, str, dict[str, Any]], ...] = (
    ("POST", "alignment", {}),
    ("POST", "name-correction", {"name": "Zoro"}),
    ("GET", "favourable-numbers", {}),
    ("GET", "personal-cycle", {}),
    (
        "GET",
        "lucky-dates",
        {"activity": "SPIRITUAL", "dateFrom": "2026-06-01", "dateTo": "2026-06-05"},
    ),
    ("GET", "marriage-dates", {}),
    # NUM-58. The DELETE route carries an extra path segment and so does not fit
    # this matrix; its gate and auth are covered in test_numerology_name_sessions.py.
    ("POST", "name-sessions", {"name": "Zoro"}),
    ("GET", "name-sessions", {}),
)


def _call(http, verb: str, url: str, payload: dict[str, Any]):
    return http.post(url, json=payload) if verb == "POST" else http.get(url, params=payload)


@pytest.mark.parametrize(("verb", "suffix", "payload"), ROUTES)
def test_routes_404_while_the_flag_is_off(
    client, numerology_off: None, verb: str, suffix: str, payload: dict[str, Any]
) -> None:
    """A feature switched back off must not advertise itself."""
    chart_id = _create_chart(client)
    url = f"/api/v1/charts/{chart_id}/numerology/{suffix}"
    response = _call(client, verb, url, payload)
    assert response.status_code == 404, (
        f"{verb} {suffix} answered {response.status_code}; a 422 here means the "
        "payload is invalid and the gate was never reached"
    )


def test_flag_off_hides_whether_the_chart_exists(client, numerology_off: None) -> None:
    """The gate must not double as an existence oracle for chart ids.

    Both answers are 404 with the same body, so a caller learns nothing about
    which ids are real from probing a flag-off deployment.
    """
    real = _create_chart(client)
    missing = uuid4()
    real_response = client.get(f"/api/v1/charts/{real}/numerology/favourable-numbers")
    missing_response = client.get(
        f"/api/v1/charts/{missing}/numerology/favourable-numbers"
    )
    assert real_response.status_code == missing_response.status_code == 404
    assert real_response.json() == missing_response.json()


@pytest.mark.parametrize(("verb", "suffix", "payload"), ROUTES)
def test_routes_require_auth(
    raw_client, verb: str, suffix: str, payload: dict[str, Any]
) -> None:
    url = f"/api/v1/charts/{uuid4()}/numerology/{suffix}"
    response = _call(raw_client, verb, url, payload)
    assert response.status_code == 401


def test_missing_chart_is_404_when_the_flag_is_on(client, enabled: None) -> None:
    response = client.get(f"/api/v1/charts/{uuid4()}/numerology/favourable-numbers")
    assert response.status_code == 404


# ── Fortune Alignment (Phase 3) ──────────────────────────────────────────────
def test_alignment_scores_the_numbers_against_the_chart(client, enabled: None) -> None:
    chart_id = _create_chart(client)
    response = client.post(
        f"/api/v1/charts/{chart_id}/numerology/alignment",
        json={"documentName": "Zoro", "calledName": "Zed"},
    )
    assert response.status_code == 200
    body = response.json()

    # Born on the 22nd -> psychic 2+2 = 4 (Rahu). Date digits 1+9+9+1+7+2+2 = 31 -> 4.
    assert body["readings"]["psychic"]["root"] == 4
    assert body["readings"]["destiny"]["total"] == 31
    # Z=7 O=7 R=2 O=7 -> 23. The compound survives the alignment response.
    assert body["readings"]["name"]["total"] == 23
    assert body["readings"]["name"]["compound"] == 23
    assert body["readings"]["scoredName"] == "Zoro"

    for key in ("psychic", "destiny", "name", "namesake"):
        assert body[key]["number"] == body["readings"][key]["root"]
        assert 0 <= body[key]["score"] <= 100
        assert body[key]["functionalNature"].isupper()

    assert 0 <= body["overallScore"] <= 100
    assert sorted(body["favourableNumbers"]) == list(range(1, 10))
    assert 1 <= body["lagnaRasi"] <= 12
    assert isinstance(body["nameChangeAdvised"], bool)


def test_the_verdict_arrives_with_its_own_working(client, enabled: None) -> None:
    """`basis` and `verdictScale` must survive the response model, ungated.

    They are what turns "Out of step - 38 / 100" from an assertion into
    something a reader can check, and they cross the wire *whatever*
    `readingsAvailable` says: houses ruled and arithmetic are facts about the
    calculation, not the readings-about-a-person the corpus review holds back.
    Gating them by accident would restore the exact silence this fixed, and it
    would look like nothing at all had broken.
    """
    chart_id = _create_chart(client)
    body = client.post(
        f"/api/v1/charts/{chart_id}/numerology/alignment",
        json={"documentName": "Zoro"},
    ).json()

    for key in ("psychic", "destiny", "name"):
        basis = body[key]["basis"]
        # The invariant every surface prints: base + delta == score.
        assert basis["baseScore"] + basis["strengthDelta"] == body[key]["score"]
        assert basis["strengthRule"] in {"amplifies", "inverted", "damped", "none"}
        # A graha either rules houses or is a node explaining itself another way
        # — never neither, which would leave the UI with nothing to say.
        assert basis["ownedHouses"] or basis["nodeBasis"] is not None
        assert all(1 <= h <= 12 for h in basis["ownedHouses"])

    # 4 is Rahu: two of the nine numbers take the node path, so it is reachable
    # from an ordinary fixture rather than needing a contrived one.
    rahu = body["psychic"]
    assert rahu["number"] == 4
    node = rahu["basis"]["nodeBasis"]
    assert node is not None
    assert node["kind"] in {"occupied_house", "dispositor", "no_position"}

    scale = body["verdictScale"]
    assert [b["verdict"] for b in scale][0] == "strongly_aligned"
    assert scale[0]["maxScore"] == 100
    assert scale[-1]["minScore"] == 0
    # Contiguous, so a client can draw the axis with no gaps.
    for higher, lower in zip(scale, scale[1:], strict=False):
        assert higher["minScore"] == lower["maxScore"] + 1


def test_the_ranked_list_carries_the_scale_it_is_read_against(
    client, enabled: None
) -> None:
    chart_id = _create_chart(client)
    body = client.get(f"/api/v1/charts/{chart_id}/numerology/favourable-numbers").json()
    assert len(body["verdictScale"]) == 5
    for row in body["numbers"]:
        assert row["basis"]["baseScore"] + row["basis"]["strengthDelta"] == row["score"]


def test_alignment_body_is_optional(client, enabled: None) -> None:
    """With no names the chart numbers still align — enough for a dashboard card."""
    chart_id = _create_chart(client)
    response = client.post(f"/api/v1/charts/{chart_id}/numerology/alignment", json={})
    assert response.status_code == 200
    body = response.json()
    assert body["name"] is None
    assert body["namesake"] is None
    assert body["psychic"]["number"] == 4
    assert body["nameChangeAdvised"] is False


def test_no_change_is_advised_for_a_benefic_name_number(client, enabled: None) -> None:
    """Doctrine §9.1/§9.2, asserted over HTTP.

    A guard that fires in the engine and is dropped by the response model is
    still a slot machine. Scan the nine numbers for one whose graha is
    functionally benefic in this chart; that number must never carry a
    change recommendation.
    """
    chart_id = _create_chart(client)
    ranked = client.get(
        f"/api/v1/charts/{chart_id}/numerology/favourable-numbers"
    ).json()
    benefic = [
        row
        for row in ranked["numbers"]
        if row["functionalNature"] in {"YOGAKARAKA", "LAGNA_LORD", "TRIKONA"}
    ]
    assert benefic, "no functionally benefic graha in this chart — pick another fixture"

    # "A" scores 1, so an n-letter run of A's is a name whose number is n.
    target = benefic[0]["number"]
    response = client.post(
        f"/api/v1/charts/{chart_id}/numerology/alignment",
        json={"documentName": "A" * target},
    )
    body = response.json()
    assert body["name"]["number"] == target
    assert body["nameChangeAdvised"] is False


def test_non_latin_name_is_refused_with_422(client, enabled: None) -> None:
    """Doctrine D3 — silently skipping Tamil letters returns a confident wrong number."""
    chart_id = _create_chart(client)
    response = client.post(
        f"/api/v1/charts/{chart_id}/numerology/alignment",
        json={"documentName": "தீபா"},
    )
    assert response.status_code == 422
    assert "Latin" in response.json()["detail"]


def test_favourable_numbers_rank_all_nine(client, enabled: None) -> None:
    chart_id = _create_chart(client)
    response = client.get(f"/api/v1/charts/{chart_id}/numerology/favourable-numbers")
    assert response.status_code == 200
    body = response.json()

    assert len(body["numbers"]) == 9
    assert sorted(body["favourableNumbers"]) == list(range(1, 10))
    # The two are projections of one sort; if they can disagree, they will.
    assert [row["number"] for row in body["numbers"]] == body["favourableNumbers"]
    scores = [row["score"] for row in body["numbers"]]
    assert scores == sorted(scores, reverse=True)


# ── Name correction (Phase 5) ────────────────────────────────────────────────
def _name_scoring(target: int) -> str:
    """A name whose Chaldean root is ``target``. 'A' scores 1, so n A's give n."""
    return "A" * target


def _numbers_by_verdict(client, chart_id: str) -> dict[str, list[dict]]:
    ranked = client.get(
        f"/api/v1/charts/{chart_id}/numerology/favourable-numbers"
    ).json()
    grouped: dict[str, list[dict]] = {}
    for row in ranked["numbers"]:
        grouped.setdefault(row["verdict"], []).append(row)
    return grouped


def test_name_correction_returns_the_analysis(client, enabled: None) -> None:
    chart_id = _create_chart(client)
    response = client.post(
        f"/api/v1/charts/{chart_id}/numerology/name-correction",
        json={"name": "Rajesh"},
    )
    assert response.status_code == 200
    body = response.json()

    # R=2 A=1 J=1 E=5 S=3 H=5 -> 17 -> root 8 (Sani).
    assert body["original"] == "Rajesh"
    assert body["originalReading"]["total"] == 17
    assert body["originalReading"]["root"] == 8
    assert body["originalAlignment"]["number"] == 8
    assert body["originalAlignment"]["graha"] == "SATURN"
    assert 1 <= body["lagnaRasi"] <= 12


def test_a_benefic_name_gets_no_alternatives_over_http(client, enabled: None) -> None:
    """Doctrine §9.2 asserted at the boundary, not just in the engine.

    Picks a number the chart itself scores as benefic, so the assertion holds
    whatever lagna the fixture chart lands on.
    """
    chart_id = _create_chart(client)
    grouped = _numbers_by_verdict(client, chart_id)
    benefic = [
        row
        for rows in grouped.values()
        for row in rows
        if row["functionalNature"] in {"YOGAKARAKA", "LAGNA_LORD", "TRIKONA"}
    ]
    assert benefic, "no benefic lordship in this chart — pick another fixture"

    body = client.post(
        f"/api/v1/charts/{chart_id}/numerology/name-correction",
        json={"name": _name_scoring(benefic[0]["number"])},
    ).json()

    assert body["alternatives"] == []
    assert body["changeAdvised"] is False
    assert body["noChangeReason"] == "benefic_lordship"
    assert body["alternativesWithheldReason"] is None
    assert body["variantsConsidered"] == 0
    # A refusal needs no warning — the guard must not block the honest answer.
    assert body["legalWarningEn"] is None


def test_a_misaligned_name_has_its_alternatives_withheld_pending_review(
    client, enabled: None, legal_warning_unreviewed: None
) -> None:
    """Plan §9.4's refusal path, driven explicitly.

    The engine found corrections. They are removed — not because the name is
    fine, but because the legal-consequence warning that must accompany any
    recommendation cannot be rendered. The two reasons must never be conflated,
    so this asserts the withheld reason is set and the no-change reason is not.

    The fixture is what changed 2026-07-29, not the rule: the warning now has
    its own review gate and that gate ships ON, so this branch has to be forced
    rather than being whatever the corpus flag happened to make it.
    """
    chart_id = _create_chart(client)
    grouped = _numbers_by_verdict(client, chart_id)
    misaligned = grouped.get("misaligned", []) + grouped.get("strongly_misaligned", [])
    assert misaligned, "no misaligned number in this chart — pick another fixture"

    body = client.post(
        f"/api/v1/charts/{chart_id}/numerology/name-correction",
        json={"name": _name_scoring(misaligned[0]["number"])},
    ).json()

    assert body["alternatives"] == []
    assert body["alternativesWithheldReason"] == "pending_content_review"
    assert body["noChangeReason"] is None, (
        "a withheld recommendation must never read as 'your name is fine'"
    )
    assert body["changeAdvised"] is False, (
        "advising a change with nothing to change to is worse than silence"
    )
    assert body["variantsConsidered"] > 0, "the engine did search — say so"


def test_alternatives_and_the_legal_warning_appear_together(client, enabled: None) -> None:
    """Corrections ship, and never without the warning.

    Deliberately takes NO ``reviewed`` fixture. That is the assertion: the two
    review gates are independent, so corrected spellings reach a user while
    every interpretive sentence in the response is still dark. Add ``reviewed``
    here and the test stops covering the thing the 2026-07-29 split was for.
    """
    chart_id = _create_chart(client)
    grouped = _numbers_by_verdict(client, chart_id)
    misaligned = grouped.get("misaligned", []) + grouped.get("strongly_misaligned", [])
    assert misaligned, "no misaligned number in this chart — pick another fixture"

    body = client.post(
        f"/api/v1/charts/{chart_id}/numerology/name-correction",
        json={"name": _name_scoring(misaligned[0]["number"])},
    ).json()

    assert body["alternatives"], "the warning is available but no corrections were offered"
    assert body["alternativesWithheldReason"] is None
    assert body["changeAdvised"] is True
    assert "Aadhaar" in body["legalWarningEn"]
    assert body["legalWarningTa"]
    # The independence, stated as an assertion rather than left to the docstring.
    assert body["readingsAvailable"] is False, (
        "this test is meaningless if the corpus gate happens to be open — the "
        "point is that a correction ships without it"
    )

    for row in body["alternatives"]:
        # Every offered spelling must say how it was derived and why it is better.
        assert row["operations"], f"{row['spelling']} arrived with no derivation"
        assert row["improvement"] > 0
        assert row["alignment"]["score"] > body["originalAlignment"]["score"]


def test_name_correction_refuses_non_latin(client, enabled: None) -> None:
    chart_id = _create_chart(client)
    response = client.post(
        f"/api/v1/charts/{chart_id}/numerology/name-correction",
        json={"name": "தீபா"},
    )
    assert response.status_code == 422
    assert "Latin" in response.json()["detail"]


def test_name_correction_caps_max_edits(client, enabled: None) -> None:
    """Three edits is a different name, and the schema says so before the engine
    has to."""
    chart_id = _create_chart(client)
    response = client.post(
        f"/api/v1/charts/{chart_id}/numerology/name-correction",
        json={"name": "Rajesh", "maxEdits": 3},
    )
    assert response.status_code == 422


# ── Horoscope + numerology compatibility (Phase 3, NUM-34) ───────────────────
COMPATIBILITY_URL = "/api/v1/numerology/compatibility"

#: Second synthetic native, chosen so both *asymmetric* relation grades appear
#: over HTTP rather than only in the unit tests. Born on the 17th -> psychic 8
#: (Sani); date digits 1+9+8+5+2+1+7 = 33 -> destiny 6 (Sukran). Against native
#: A (psychic 4, destiny 4, both Rahu) that gives:
#:   destiny  4 x 6 -> Rahu counts Venus a friend, Venus counts Rahu an enemy
#:                     -> one_sided
#:   psychic  4 x 8 -> Rahu counts Saturn a friend, Saturn is neutral to Rahu
#:                     -> supportive
_NATIVE_B: dict[str, Any] = {
    "displayName": "Numerology Test Two",
    "birthDateLocal": "1985-02-17",
    "birthTimeLocal": "21:15:00",
    "birthPlace": "Madurai, Tamil Nadu, India",
    "birthLatitude": 9.9252,
    "birthLongitude": 78.1198,
}


def _two_charts(client) -> tuple[str, str]:
    return _create_chart(client), _create_chart(client, _NATIVE_B)


def test_compatibility_404s_while_the_flag_is_off(client, numerology_off: None) -> None:
    """Cheap by design: random chart ids never reach the database.

    That the call still 404s *is* the assertion — the flag is checked before
    either chart is looked up, so a flag-off deployment cannot be used to probe
    which chart ids exist. Without ``numerology_off`` this passes for the wrong
    reason once the flag ships ON by default: a random chart id 404s from
    ``_assert_chart_owner`` regardless of the gate, so the test would stop
    proving anything about the flag the moment it stopped forcing it off.
    """
    response = client.post(
        COMPATIBILITY_URL, json={"chartIdA": str(uuid4()), "chartIdB": str(uuid4())}
    )
    assert response.status_code == 404


def test_compatibility_flag_off_hides_whether_the_charts_exist(
    client, numerology_off: None
) -> None:
    """A real chart and a nonexistent one must be indistinguishable while off."""
    real = _create_chart(client)
    with_real = client.post(
        COMPATIBILITY_URL, json={"chartIdA": real, "chartIdB": str(uuid4())}
    )
    with_neither = client.post(
        COMPATIBILITY_URL, json={"chartIdA": str(uuid4()), "chartIdB": str(uuid4())}
    )
    assert with_real.status_code == with_neither.status_code == 404
    assert with_real.json() == with_neither.json()


def test_compatibility_requires_auth(raw_client) -> None:
    response = raw_client.post(
        COMPATIBILITY_URL, json={"chartIdA": str(uuid4()), "chartIdB": str(uuid4())}
    )
    assert response.status_code == 401


def test_compatibility_rejects_an_unknown_context(client, enabled: None) -> None:
    """422 from the schema, before any chart is touched."""
    response = client.post(
        COMPATIBILITY_URL,
        json={
            "chartIdA": str(uuid4()),
            "chartIdB": str(uuid4()),
            "compatibilityContext": "ROMANCE",
        },
    )
    assert response.status_code == 422


def test_compatibility_refuses_a_chart_compared_with_itself(
    client, enabled: None
) -> None:
    """Every pair would be a number against itself — harmonious by construction.

    422 from the schema, so no chart is loaded and no meaningless-but-confident
    reading is ever assembled.
    """
    same = str(uuid4())
    response = client.post(COMPATIBILITY_URL, json={"chartIdA": same, "chartIdB": same})
    assert response.status_code == 422


def test_compatibility_missing_chart_is_404_when_the_flag_is_on(
    client, enabled: None
) -> None:
    real = _create_chart(client)
    response = client.post(
        COMPATIBILITY_URL, json={"chartIdA": real, "chartIdB": str(uuid4())}
    )
    assert response.status_code == 404


def test_compatibility_layers_numbers_over_the_poruthams(client, enabled: None) -> None:
    """The whole doctrine of NUM-34, asserted at the boundary.

    Two charts is the expensive fixture in this file, so this one request is
    checked hard: the astrology block, the never-recomputed label, the bounded
    adjustment, the clamp direction, and the two directional pairs.
    """
    chart_a, chart_b = _two_charts(client)
    response = client.post(
        COMPATIBILITY_URL, json={"chartIdA": chart_a, "chartIdB": chart_b}
    )
    assert response.status_code == 200
    body = response.json()

    # ── Astrology, and it is the authority ──
    # maxScore is not always 10: the context masks which kutas are evaluated,
    # and GENERAL (the default here) scores a subset. Assert the invariant, and
    # pin the threading of the context separately below.
    astrology = body["astrology"]
    assert astrology["maxScore"] >= 1
    assert 0 <= astrology["totalScore"] <= astrology["maxScore"]
    assert astrology["label"] in {"EXCELLENT", "GOOD", "AVERAGE", "CAUTION"}
    assert body["overallLabel"] == astrology["label"], (
        "the verdict must be the porutham engine's own — numerology shades the "
        "score and never the label"
    )

    assert body["authority"] == "jathagam_porutham", (
        "the deciding instrument must be machine-readable, not left to layout"
    )

    # ── Peyar Porutham, bounded ──
    assert abs(body["adjustment"]) <= 8
    assert body["combinedScore"] == pytest.approx(
        max(0.0, min(100.0, astrology["percentage"] + body["adjustment"])), abs=0.05
    )
    flagged = (
        astrology["label"] == "CAUTION"
        or astrology["rajjuDosha"]
        or astrology["vedhaDosha"]
        or astrology["nadiDosha"]
    )
    if flagged:
        assert body["adjustment"] <= 0, (
            "no number may lift a match the poruthams flagged"
        )
    # One-directional: the flag means "a positive adjustment was taken away".
    # An adjustment that was already zero or negative is not a clamp, so this
    # must not be asserted as an equivalence — that would fail whenever the
    # numbers happen to land on neutral for a flagged match.
    if body["clampedByAstrology"]:
        assert flagged and body["adjustment"] == 0

    # ── Peyar Porutham's pairs, and the asymmetry that is the point ──
    # (the psychic pair below still carries it: Rahu regards Saturn a friend
    # while Saturn is neutral toward Rahu, so directional regard survives at the
    # boundary even after the destiny pair stopped being spuriously one-sided)
    peyar = body["peyarPorutham"]
    assert peyar["method"] == "peyar_porutham"
    assert peyar["basis"] == "cheiro_series", "doctrine D4 default"
    assert peyar["band"] in {"strong", "supportive", "neutral", "guarded", "difficult"}
    assert 0 <= peyar["score"] <= 100
    pairs = {row["kind"]: row for row in peyar["pairs"]}
    assert set(pairs) == {"destiny", "psychic"}, "no names were sent, so no name pair"

    destiny = pairs["destiny"]
    assert (destiny["a"]["number"], destiny["b"]["number"]) == (4, 6)
    assert (destiny["a"]["graha"], destiny["b"]["graha"]) == ("RAHU", "VENUS")
    # Under Cheiro (the default) 4 and 6 are in different series, so the pair
    # grades neutral — but the graha view still ships, and the disagreement
    # between the two doctrines is declared rather than hidden.
    #
    # Rahu/Venus used to assert one_sided + (friend, enemy) here. That was not
    # doctrine: classical maitri gives the nodes no friendships at all, and in
    # the Tamil node-inclusive table this repo's Rahu/Ketu rows follow, Venus and
    # both nodes are mutual friends. The old grade came from a Venus row listing
    # the nodes as enemies while the node rows listed Venus as a friend — a
    # contradiction that made `graha_relation` answer differently depending on
    # argument order. Fixed 2026-08-17 in `chart_strength._NATURAL_ENEMIES`.
    # The bases still disagree, which is the property this line is really for.
    assert destiny["relation"] == "neutral"
    assert destiny["grahaRelation"] == "harmonious"
    assert (destiny["grahaRegardAToB"], destiny["grahaRegardBToA"]) == ("friend", "friend")
    assert destiny["basesAgree"] is False

    psychic = pairs["psychic"]
    assert (psychic["a"]["number"], psychic["b"]["number"]) == (4, 8)
    # Cheiro gives 8 the interchangeable number 4, so this IS a same-series pair.
    assert psychic["relation"] == "harmonious"
    assert psychic["grahaRelation"] == "supportive"
    assert (psychic["grahaRegardAToB"], psychic["grahaRegardBToA"]) == ("friend", "neutral")

    # Each side is aligned against its OWN chart, so each carries its own lagna's
    # verdict rather than both being scored against one of them.
    assert body["lagnaRasiA"] != body["lagnaRasiB"]
    for row in peyar["pairs"]:
        for side in ("a", "b"):
            assert row[side]["functionalNature"].isupper()
            assert 0 <= row[side]["score"] <= 100

    assert body["readingsA"]["destiny"]["root"] == 4
    assert body["readingsB"]["destiny"]["total"] == 33
    assert body["readingsA"]["name"] is None
    assert body["compatibilityContext"] == "GENERAL"
    # No names were sent, so Sethuraman's per-partner name harmony is absent —
    # "not asked", not "scored badly".
    assert peyar["nameHarmonyA"] is None
    assert peyar["nameHarmonyB"] is None


def test_compatibility_threads_the_context_into_the_porutham(
    client, enabled: None
) -> None:
    """The context masks which kutas the astrology evaluates, and it must reach it.

    MARRIAGE scores all ten; GENERAL scores a subset. If the parameter were
    dropped on the way through, both would answer the same and this numerology
    surface would quietly disagree with the porutham screen for the same couple.
    """
    chart_a, chart_b = _two_charts(client)

    def verdict(context: str) -> dict[str, Any]:
        response = client.post(
            COMPATIBILITY_URL,
            json={
                "chartIdA": chart_a,
                "chartIdB": chart_b,
                "compatibilityContext": context,
            },
        )
        assert response.status_code == 200
        return response.json()

    marriage = verdict("MARRIAGE")
    general = verdict("GENERAL")

    assert marriage["astrology"]["maxScore"] == 10, "MARRIAGE evaluates all ten kutas"
    assert general["astrology"]["maxScore"] < 10, "GENERAL evaluates a masked subset"
    assert marriage["compatibilityContext"] == "MARRIAGE"
    # The numbers do not depend on the kuta mask — only the astrology does.
    assert marriage["peyarPorutham"]["score"] == general["peyarPorutham"]["score"]


def test_compatibility_scores_the_name_pair_only_when_both_names_are_given(
    client, enabled: None
) -> None:
    """One name is not a weak signal, it is no signal.

    Scoring one person's name against the other's *destiny* number would be an
    invented rule; the pair is dropped instead and the weights renormalise.
    """
    chart_a, chart_b = _two_charts(client)

    one = client.post(
        COMPATIBILITY_URL,
        json={"chartIdA": chart_a, "chartIdB": chart_b, "documentNameA": "Zoro"},
    ).json()
    assert {row["kind"] for row in one["peyarPorutham"]["pairs"]} == {"destiny", "psychic"}
    assert one["readingsA"]["scoredName"] == "Zoro"
    assert one["readingsB"]["name"] is None
    # Sethuraman's per-partner harmony needs only THAT partner's own name, so
    # it appears for A alone — unlike the pair, which needs both.
    assert one["peyarPorutham"]["nameHarmonyA"] is not None
    assert one["peyarPorutham"]["nameHarmonyB"] is None

    both = client.post(
        COMPATIBILITY_URL,
        json={
            "chartIdA": chart_a,
            "chartIdB": chart_b,
            "documentNameB": "Zed",
            "documentNameA": "Zoro",
        },
    ).json()
    pairs = {row["kind"]: row for row in both["peyarPorutham"]["pairs"]}
    assert set(pairs) == {"destiny", "psychic", "name"}
    assert both["peyarPorutham"]["nameHarmonyB"] is not None
    # Z=7 O=7 R=2 O=7 -> 23 -> 5; Z=7 E=5 D=4 -> 16 -> 7.
    assert (pairs["name"]["a"]["number"], pairs["name"]["b"]["number"]) == (5, 7)
    assert pairs["name"]["weight"] == pytest.approx(0.25)


def test_compatibility_refuses_a_non_latin_name(client, enabled: None) -> None:
    """Doctrine D3 holds on this route too."""
    chart_a, chart_b = _two_charts(client)
    response = client.post(
        COMPATIBILITY_URL,
        json={"chartIdA": chart_a, "chartIdB": chart_b, "documentNameA": "தீபா"},
    )
    assert response.status_code == 422
    assert "Latin" in response.json()["detail"]


# ── Time numerology (Phase 4) ────────────────────────────────────────────────
def test_personal_cycle_uses_the_charts_birth_date(client, enabled: None) -> None:
    """Born 22 Jul 1991, read on 27 Jul 2026 under the default birthday epoch.

    Year: digits of 22 + 7 + 2026 = 4 + 7 + 10 = 21 -> root 3.
    Month: 3 + 7 = 10 -> root 1. Day: 1 + 27 = 28 -> root 1.
    """
    chart_id = _create_chart(client)
    response = client.get(
        f"/api/v1/charts/{chart_id}/numerology/personal-cycle",
        params={"onDate": "2026-07-27"},
    )
    assert response.status_code == 200
    body = response.json()

    assert body["onDate"] == "2026-07-27"
    assert body["year"]["reading"]["total"] == 21
    assert body["year"]["reading"]["root"] == 3
    assert body["year"]["epoch"] == "birthday"
    assert body["year"]["governingYear"] == 2026
    assert body["year"]["cycleStart"] == "2026-07-22"
    assert body["year"]["cycleEnd"] == "2027-07-21"
    # Month and day nest their arithmetic under ``reading``, alongside a
    # ``meaning`` block held dark until the personal-year corpus clears review.
    assert body["month"]["reading"]["total"] == 10
    assert body["day"]["reading"]["total"] == 28
    assert body["readingsAvailable"] is False
    assert all(
        body[level]["meaning"]["number"] == body[level]["reading"]["root"]
        for level in ("year", "month", "day")
    )


def test_lucky_dates_reorder_muhurta_without_adding_or_removing(
    client, enabled: None
) -> None:
    """The muhurta engine decides which dates are fit to act on; this only ranks.

    Compared against the muhurta route directly rather than against a count we
    assert by hand — a layer that quietly drops a slot is the failure mode.
    """
    chart_id = _create_chart(client)
    params = {"activity": "SPIRITUAL", "dateFrom": "2026-06-01", "dateTo": "2026-06-05"}

    muhurta = client.get(f"/api/v1/charts/{chart_id}/muhurta", params=params).json()
    layered = client.get(
        f"/api/v1/charts/{chart_id}/numerology/lucky-dates", params=params
    )
    assert layered.status_code == 200
    body = layered.json()

    assert body["activity"] == "SPIRITUAL"
    assert body["timezone"] == "Asia/Kolkata"
    assert sorted(body["favourableNumbers"]) == list(range(1, 10))
    assert sorted(row["slot"]["date"] for row in body["dates"]) == sorted(
        slot["date"] for slot in muhurta["data"]["slots"]
    )

    for row in body["dates"]:
        # The astrology's own score is never overwritten, and the numerology
        # adjustment is bounded — the layer nudges inside a band, never re-ranks.
        assert abs(row["numerology"]["adjustment"]) <= 8
        assert row["adjustedScore"] == pytest.approx(
            row["slot"]["score"] + row["numerology"]["adjustment"]
        )
        if row["slot"]["cautions"]:
            assert row["numerology"]["adjustment"] <= 0


def test_lucky_dates_sort_clean_slots_above_flagged_ones(client, enabled: None) -> None:
    """Astrology first: no number can lift a flagged date over a clean one."""
    chart_id = _create_chart(client)
    body = client.get(
        f"/api/v1/charts/{chart_id}/numerology/lucky-dates",
        params={"activity": "MARRIAGE", "dateFrom": "2026-06-01", "dateTo": "2026-06-20"},
    ).json()
    flagged = [bool(row["slot"]["cautions"]) for row in body["dates"]]
    assert flagged == sorted(flagged), "a cautioned slot sorted above a clean one"


def test_marriage_dates_never_promote_into_the_recommended_set(
    client, enabled: None
) -> None:
    chart_id = _create_chart(client)
    response = client.get(
        f"/api/v1/charts/{chart_id}/numerology/marriage-dates", params={"year": 2027}
    )
    assert response.status_code == 200
    body = response.json()

    assert body["year"] == 2027
    assert body["context"]["source"]
    recommended = [not row["match"]["isRecommended"] for row in body["matches"]]
    assert recommended == sorted(recommended), (
        "an unrecommended naal sorted above a recommended one"
    )
    for row in body["matches"]:
        assert abs(row["numerology"]["adjustment"]) <= 8
        if not row["match"]["isRecommended"]:
            assert row["numerology"]["adjustment"] <= 0


# ── The prose gate ───────────────────────────────────────────────────────────
def test_no_explanation_prose_ships_while_the_corpus_is_unreviewed(
    client, enabled: None
) -> None:
    """Every reason/note/recommendation field is null, on every route.

    Walks the whole response tree rather than naming fields, so a Phase 5/6
    response model that adds a new explanation field is caught by this test
    instead of shipping unreviewed Tamil.
    """
    assert numerology_content.CONTENT_REVIEWED is False, (
        "corpus is now reviewed — this test and the readingsAvailable flag both "
        "need revisiting"
    )
    chart_id, chart_b = _two_charts(client)
    base = f"/api/v1/charts/{chart_id}/numerology"
    bodies = [
        client.post(f"{base}/alignment", json={"documentName": "Zoro"}).json(),
        client.get(f"{base}/favourable-numbers").json(),
        client.get(
            f"{base}/lucky-dates",
            params={
                "activity": "SPIRITUAL",
                "dateFrom": "2026-06-01",
                "dateTo": "2026-06-05",
            },
        ).json(),
        client.get(f"{base}/marriage-dates", params={"year": 2027}).json(),
        # NUM-34 adds per-pair reasons and an overall summary — all of it drafted
        # by the same hand as the rest, so it is scanned by the same guard. Note
        # the response deliberately carries no porutham prose: the astrology's
        # own (reviewed) summary stays on /relationships/compare rather than
        # sitting beside withheld copy under one readingsAvailable flag.
        client.post(
            COMPATIBILITY_URL, json={"chartIdA": chart_id, "chartIdB": chart_b}
        ).json(),
        # NUM-58 embeds a NumberAlignmentOut per saved spelling, so the same
        # reasonEn/reasonTa every other alignment gates must be gated here too.
        # A saved session is also the longest-lived response in the feature — a
        # user opens their shortlist days later — so a leak here outlives the
        # request that caused it.
        client.post(f"{base}/name-sessions", json={"name": "Zoro"}).json(),
    ]

    for body in bodies:
        leaked = [(key, value) for key, value in _prose_values(body) if value is not None]
        assert not leaked, f"unreviewed prose reached the client: {leaked}"
        if "readingsAvailable" in body:
            assert body["readingsAvailable"] is False


def test_prose_appears_once_the_corpus_clears_review(
    client, enabled: None, reviewed: None
) -> None:
    """The fields are wired and withheld, not absent.

    Without this, "no prose leaks" would also pass for a response model that
    forgot the explanation fields entirely — and the Tamil review would clear
    onto an endpoint that still says nothing.
    """
    chart_id, chart_b = _two_charts(client)
    body = client.post(
        f"/api/v1/charts/{chart_id}/numerology/alignment",
        json={"documentName": "Zoro"},
    ).json()

    assert body["readingsAvailable"] is True
    assert body["recommendationEn"]
    assert body["recommendationTa"]
    assert body["destiny"]["reasonEn"]
    assert body["destiny"]["reasonTa"]

    # NUM-34's own copy, same check: withheld today, present once review clears.
    compatibility = client.post(
        COMPATIBILITY_URL, json={"chartIdA": chart_id, "chartIdB": chart_b}
    ).json()
    assert compatibility["readingsAvailable"] is True
    assert compatibility["summaryEn"]
    assert compatibility["summaryTa"]
    # The instrument's own name and the precedence statement are gated prose
    # too — only the `method` / `authority` tokens ship while the corpus is dark.
    assert compatibility["precedenceEn"]
    assert compatibility["precedenceTa"]
    assert compatibility["peyarPorutham"]["methodEn"]
    assert compatibility["peyarPorutham"]["methodTa"]
    for row in compatibility["peyarPorutham"]["pairs"]:
        assert row["reasonEn"]
        assert row["reasonTa"]
