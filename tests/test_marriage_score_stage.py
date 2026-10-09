from __future__ import annotations

from datetime import date
from types import SimpleNamespace

import pytest

from app.services import marriage_service as svc

pytestmark = pytest.mark.no_db


def _payload(**overrides) -> svc.MarriageAssessmentInput:
    values = dict(
        as_of=date(2026, 1, 14),
        lagna_rasi=1,
        planets_rasi={
            "SUN": 5,
            "MOON": 4,
            "MARS": 1,
            "MERCURY": 6,
            "JUPITER": 9,
            "VENUS": 2,
            "SATURN": 11,
            "RAHU": 3,
            "KETU": 9,
        },
        active_dasha_lords={"MOON"},
        transit_jupiter_rasi=1,
        transit_venus_rasi=1,
        age=30,
        life_stage="young_adult",
        sevvai_dosham_cancelled=True,
    )
    values.update(overrides)
    return svc.MarriageAssessmentInput(**values)


@pytest.fixture(autouse=True)
def _plain_dependencies(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        svc,
        "assess_bhava_afflictions",
        lambda **_kwargs: SimpleNamespace(
            lord_afflicted_by=(),
            karaka_afflicted_by=(),
            malefics_occupying=(),
            malefics_aspecting=(),
            papa_kartari=False,
            shubha_kartari=False,
        ),
    )
    monkeypatch.setattr(
        svc,
        "assess_dasha_activation",
        lambda **_kwargs: SimpleNamespace(activated=False, connections=()),
    )
    monkeypatch.setattr(svc, "get_jupiter_aspects", lambda _rasi: set())


def _score(payload: svc.MarriageAssessmentInput, *, gate=None, married=False) -> svc._MarriageScore:
    return svc._score_marriage_prediction(
        payload,
        gate=gate,
        married_harmony_mode=married,
    )


def test_plain_score_has_named_outputs() -> None:
    result = _score(_payload())

    assert result.score == 63
    assert result.dasha_support == "WEAK"
    assert result.transit_support == "WEAK"
    assert [factor.key for factor in result.factors] == [
        "life_stage",
        "seventh_house_occupancy",
        "seventh_lord_placement",
        "venus_strength",
        "second_lord_family_support",
    ]


def test_dasha_weights_are_ten_for_primary_and_five_for_indirect(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    weak = _score(_payload())
    monkeypatch.setattr(
        svc,
        "assess_dasha_activation",
        lambda **_kwargs: SimpleNamespace(activated=True, connections=("maha:VENUS:aspects_bhava",)),
    )
    partial = _score(_payload())
    monkeypatch.setattr(
        svc,
        "assess_dasha_activation",
        lambda **_kwargs: SimpleNamespace(activated=True, connections=("maha:VENUS:is_karaka",)),
    )
    strong = _score(_payload())

    assert partial.score - weak.score == 5
    assert strong.score - weak.score == 10
    assert (weak.dasha_support, partial.dasha_support, strong.dasha_support) == (
        "WEAK",
        "PARTIAL",
        "STRONG",
    )


def test_transit_support_adds_eight_points() -> None:
    weak = _score(_payload())
    strong = _score(_payload(transit_venus_rasi=7))

    assert strong.score - weak.score == 8
    assert (weak.transit_support, strong.transit_support) == ("WEAK", "STRONG")


def test_sevvai_penalty_softens_after_twenty_eight() -> None:
    cancelled = _score(_payload(sevvai_dosham_cancelled=True))
    softened = _score(_payload(age=30, sevvai_dosham_cancelled=False))
    full = _score(_payload(age=26, sevvai_dosham_cancelled=False))

    assert cancelled.score - softened.score == 3
    assert cancelled.score - full.score == 6


def test_rahu_ketu_penalties_keep_their_two_rungs() -> None:
    none = _score(_payload())
    candidate = _score(_payload(rahu_ketu_label="RAHU_KETU_DOSHAM_CANDIDATE"))
    active = _score(_payload(rahu_ketu_label="ACTIVE_RAHU_KETU_DOSHAM"))
    mitigated = _score(_payload(rahu_ketu_label="RAHU_KETU_DOSHAM_WITH_NIVARTHI"))

    assert none.score - candidate.score == 2
    assert none.score - active.score == 5
    assert mitigated.score == none.score
    assert mitigated.supports[-1].en == "Rahu-Ketu mitigation factors are supportive."


def test_weak_promise_is_evidence_not_an_additive_weight() -> None:
    gate = svc.assess_promise(
        bhava_lord_house=1,
        bhava_lord_afflicted=False,
        karaka_dignity_d1="DEBILITATED",
        karaka_dignity_varga="DEBILITATED",
        karaka_available=True,
    )
    without_gate = _score(_payload())
    with_gate = _score(_payload(), gate=gate)

    assert gate.grade is svc.GateGrade.WEAK
    assert with_gate.score == without_gate.score
    assert with_gate.factors[0].key == "promise_gate_weak"
    assert with_gate.challenges[0].en.startswith("Birth promise is partial")
