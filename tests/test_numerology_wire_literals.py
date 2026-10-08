"""A14 — the numerology response fields that carry a fixed vocabulary.

These fields were `str` on the Pydantic models while the shared client typed
them as literal unions, so the generated types could not be checked against
the client (server looser than client). They are now `Literal`s. A `Literal`
also *validates*: a producer emitting a value outside it is a 500, not a
looser type. So each one is pinned here to the thing that actually produces
it — the engine enum, the Tara table, the name corpus — and adding a member
there without widening the wire type fails this test instead of a request.

What it cannot see: a producer that builds one of these models from a value
that does not come from the pinned source (every current producer was traced
by hand on 2026-10-08 — see docs/MASTER_FIX_LIST.md, A14 numerology group).
"""
from __future__ import annotations

import typing

import pytest
from pydantic import BaseModel

from app.calculations.functional_nature import FunctionalNature
from app.calculations.muhurta_engine import Verdict
from app.calculations.numerology_alignment import AlignmentVerdict, NodeBasisKind, StrengthRule
from app.calculations.numerology_naming import AksharaRelation, EmptyReason, MatchConfidence, NamingMode, Relaxation
from app.calculations.numerology_timing import PersonalYearEpoch
from app.data.tamil_name_corpus import TAMIL_NAME_CORPUS
from app.schemas import muhurta, muhurtham_naal, numerology
from app.services.muhurtham_naal_service import TARA_QUALITY
from app.services.numerology_content import CompoundTone

pytestmark = pytest.mark.no_db


def _literal_values(annotation) -> set:
    """Every Literal member reachable in `X | None`, `list[X]`, …"""
    if typing.get_origin(annotation) is typing.Literal:
        return set(typing.get_args(annotation))
    out: set = set()
    for arg in typing.get_args(annotation):
        out |= _literal_values(arg)
    return out


def _field(model: type[BaseModel], name: str) -> set:
    return _literal_values(model.model_fields[name].annotation)


def _values(enum) -> set:
    return {member.value for member in enum}


ENUM_FIELDS = [
    (numerology.NumberReadingOut, "compound_tone", CompoundTone),
    (numerology.NodeBasisOut, "kind", NodeBasisKind),
    (numerology.AlignmentBasisOut, "strength_rule", StrengthRule),
    (numerology.VerdictBandOut, "verdict", AlignmentVerdict),
    (numerology.NumberAlignmentOut, "functional_nature", FunctionalNature),
    (numerology.NumberAlignmentOut, "verdict", AlignmentVerdict),
    (numerology.PersonalYearOut, "epoch", PersonalYearEpoch),
    (numerology.LuckyDatesResponse, "epoch", PersonalYearEpoch),
    (numerology.MarriageDatesResponse, "epoch", PersonalYearEpoch),
    (numerology.BabyNameCandidateOut, "confidence", MatchConfidence),
    (numerology.BabyNameCandidateOut, "relation", AksharaRelation),
    (numerology.BabyNamesResponse, "mode", NamingMode),
    (numerology.BabyNamesResponse, "relaxations_applied", Relaxation),
    (numerology.BabyNamesResponse, "empty_reason_code", EmptyReason),
    (muhurta.MuhurtaFactor, "verdict", Verdict),
]


@pytest.mark.parametrize(("model", "field", "enum"), ENUM_FIELDS, ids=lambda v: getattr(v, "__name__", v))
def test_wire_vocabulary_equals_the_producing_enum(model, field, enum) -> None:
    assert _field(model, field) == _values(enum)


@pytest.mark.parametrize("model", [muhurtham_naal.MuhurthamNaalReading, muhurtham_naal.MuhurthamNaalMatchItem])
def test_tara_quality_is_the_tara_tables_vocabulary(model) -> None:
    assert _field(model, "tara_quality") == set(TARA_QUALITY.values())


def test_candidate_gender_covers_every_gender_in_the_corpus() -> None:
    genders = {c.gender for c in TAMIL_NAME_CORPUS if c.gender is not None}
    assert genders <= _field(numerology.BabyNameCandidateOut, "gender")
