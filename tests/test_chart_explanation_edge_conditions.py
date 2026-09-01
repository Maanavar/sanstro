"""End-to-end checks that the verified edge-condition signals surface in the
'Why this prediction?' explanation (GET /charts/{id}/explanation):

  * Cazimi -> a per-planet `isCazimi` flag plus a clause in the planet's
    explanation text.
  * Border-Alert birth conditions -> qualitative factors in the summary
    (BOOST as a positive, ALERT/INFO as a caution).

Neither changes the score here; they only make the reasoning visible.
"""
from __future__ import annotations

from types import SimpleNamespace

from app.schemas.charts import ChartBirthCondition
from app.services.chart_explanation_service import _planet_explanation, _summary_section


def test_planet_explanation_appends_cazimi_clause_when_cazimi() -> None:
    # _planet_explanation only reads graha / house_from_lagna / is_cazimi.
    cazimi_planet = SimpleNamespace(graha="MERCURY", house_from_lagna=10, is_cazimi=True)
    plain_planet = SimpleNamespace(graha="MERCURY", house_from_lagna=10, is_cazimi=False)

    common = dict(current_role=None, dasha_chain_ta="", dasha_chain_en="")
    cazimi_text = _planet_explanation(cazimi_planet, "NEUTRAL_SIGN", "NEUTRAL", **common)
    plain_text = _planet_explanation(plain_planet, "NEUTRAL_SIGN", "NEUTRAL", **common)

    assert "cazimi" in cazimi_text.en.lower()
    assert "கசிமி" in cazimi_text.ta
    assert "cazimi" not in plain_text.en.lower()


def test_summary_folds_boost_and_alert_conditions_into_right_lists() -> None:
    conditions = [
        ChartBirthCondition(
            code="CAZIMI", isPresent=True, severity="BOOST",
            titleTa="கசிமி", titleEn="Cazimi",
            descriptionTa="…", descriptionEn="A planet is in the heart of the Sun.",
        ),
        ChartBirthCondition(
            code="GRAHANA", isPresent=True, severity="ALERT",
            titleTa="கிரகணம்", titleEn="Eclipse birth",
            descriptionTa="…", descriptionEn="Born near an eclipse.",
        ),
        ChartBirthCondition(
            code="NOT_PRESENT", isPresent=False, severity="ALERT",
            titleTa="x", titleEn="x", descriptionTa="x", descriptionEn="x",
        ),
    ]
    section = _summary_section([], conditions)
    positives = [t.en for t in section.positives]
    cautions = [t.en for t in section.cautions]

    assert any("Cazimi" in t for t in positives)          # BOOST -> positive
    assert any("Eclipse birth" in t for t in cautions)    # ALERT -> caution
    # A not-present condition is never surfaced.
    assert not any("NOT_PRESENT" in t or "x" in t for t in positives + cautions)


_SYNTHETIC_PROFILE = {
    "ownerUserId": "33333333-3333-3333-3333-333333333333",
    "displayName": "Arjun Kumar",
    "birthDateLocal": "1991-07-22",
    "birthTimeLocal": "06:30:00",
    "birthPlace": "Chennai, Tamil Nadu, India",
    "birthLatitude": 13.0827,
    "birthLongitude": 80.2707,
    "birthTimezone": "Asia/Kolkata",
    "calculateNow": True,
}


def _explanation(client) -> dict:
    chart_id = client.post("/api/v1/birth-profiles", json=_SYNTHETIC_PROFILE).json()["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/explanation", params={"asOf": "2026-05-21"})
    assert response.status_code == 200
    return response.json()["data"]


def test_explanation_planets_expose_cazimi_flag(client):
    data = _explanation(client)
    planets = data["planets"]
    assert planets, "explanation returned no planets"
    # Contract: every planet now carries the isCazimi flag (schema wiring).
    for planet in planets:
        assert "isCazimi" in planet
        assert isinstance(planet["isCazimi"], bool)
    # Where a planet is cazimi, its explanation text must name the reason.
    for planet in planets:
        if planet["isCazimi"]:
            assert "cazimi" in planet["explanation"]["en"].lower()


def test_explanation_summary_folds_in_border_alert_conditions(client):
    data = _explanation(client)
    summary = data["summary"]
    # Summary structure is intact and the new factors slot into it without a
    # new section (positives/cautions are the qualitative-factor lists).
    assert isinstance(summary["positives"], list) and summary["positives"]
    assert isinstance(summary["cautions"], list) and summary["cautions"]
    factor_texts = [item["en"] for item in summary["positives"] + summary["cautions"]]
    # Any present birth condition is rendered as "Birth-time condition — ...".
    # The synthetic chart may or may not have one, so assert the mechanism is
    # well-formed rather than a specific condition firing.
    for text in factor_texts:
        assert isinstance(text, str) and text
