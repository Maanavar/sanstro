"""`chart.birthProfile.relationshipToOwner` must name the real relationship.

The field used to be read with ``getattr(profile, "relationship_to_owner",
"self")``. ``BirthProfile`` has no such attribute — the column is
``family_members.relationship`` — so every persisted profile reported ``"self"``
and no test noticed, because the only object that *does* declare the field is
``BirthProfileCreate`` on the create path.

`dashboard-workspace.handleEditFamilyMember` seeds the edit modal's relationship
dropdown from this field and PATCHes it back, so a spouse or a child was
silently retagged ``self`` on save — and `useFamilyData` drops a ``self`` member
from `memberCharts` by design, which empties the member picker on every tab.

These are pure-function tests: no database, no fixtures.
"""

from __future__ import annotations

from app.models import BirthProfile
from app.services._chart_build import _relationship_to_owner


class _Member:
    def __init__(self, relationship: str) -> None:
        self.relationship_to_owner = relationship


class _PersistedProfile:
    """Stands in for the ORM row: no `relationship_to_owner` attribute at all."""

    def __init__(self, member: _Member | None) -> None:
        self.family_member = member


def test_birth_profile_model_still_has_no_relationship_column() -> None:
    # The premise of the resolver. If someone adds the column to BirthProfile,
    # this fails and the resolver's `family_member` hop should be revisited.
    assert not hasattr(BirthProfile, "relationship_to_owner")


def test_reads_the_linked_family_member() -> None:
    for relationship in ("spouse", "child", "parent", "sibling", "grandparent", "other"):
        assert _relationship_to_owner(_PersistedProfile(_Member(relationship))) == relationship


def test_owner_own_profile_has_no_member_row_and_stays_self() -> None:
    assert _relationship_to_owner(_PersistedProfile(None)) == "self"


def test_blank_relationship_falls_back_to_self() -> None:
    assert _relationship_to_owner(_PersistedProfile(_Member(""))) == "self"


def test_declared_field_wins_on_the_create_path() -> None:
    # BirthProfileCreate carries the field itself; the payload's answer is the
    # only one available before the FamilyMember row exists.
    class _Payload:
        relationship_to_owner = "spouse"
        family_member = None

    assert _relationship_to_owner(_Payload()) == "spouse"
