"""Baby naming service tests (NUM-50/51/52).

Needs a real chart (Moon nakshatra/pada come off a persisted snapshot), so
this file is DB-backed — unlike `tests/test_numerology_naming.py` and
`tests/test_tamil_name_corpus.py`, which are pure and carry `no_db`.

What these tests hold down beyond "it returns 200":

1. `NumerologyChartContext` actually carries the Moon's nakshatra/pada now,
   and they are in the ranges `NamingConstraints` expects.
2. Pada-confidence precedence from `find_names` is never disturbed by the
   alignment re-sort — a number ranks within a tier, never across one.
3. `usable` is `False` for every result today, because every canon row is
   still `verified=False` — this is the state to expect, not a bug.
4. Both flags gate independently, and `UnverifiedCanonError` remains the
   backstop if a real environment ever got flipped on ahead of verification.
"""
from __future__ import annotations

from collections.abc import Iterator
from itertools import groupby
from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.calculations.numerology import score_text
from app.calculations.numerology_alignment import AlignmentVerdict
from app.calculations.numerology_naming import (
    _RELATION_RANK,
    AksharaRelation,
    MatchConfidence,
    NamingMode,
    UnverifiedCanonError,
)
from app.db.session import SessionLocal
from app.services.feature_flags import reset_flag, set_flag
from app.services.numerology_naming_service import (
    UserNameQuery,
    baby_names_for_chart,
    baby_names_for_pada,
    require_baby_naming_enabled,
)
from app.services.numerology_service import load_chart_context


@pytest.fixture
def enabled() -> Iterator[None]:
    set_flag("numerology_engine", True)
    set_flag("numerology_baby_naming", True)
    try:
        yield
    finally:
        reset_flag("numerology_engine")
        reset_flag("numerology_baby_naming")


def _create_chart(client: TestClient) -> UUID:
    """A clearly-synthetic native. No real birth data in fixtures."""
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "11111111-1111-1111-1111-111111111111",
            "displayName": "Baby Naming Test",
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


def test_chart_context_carries_moon_nakshatra_and_pada(client: TestClient, enabled: None) -> None:
    chart_id = _create_chart(client)
    with SessionLocal() as session:
        ctx = load_chart_context(session, chart_id)
    assert 1 <= ctx.moon_nakshatra_id <= 27
    assert 1 <= ctx.moon_pada <= 4


def test_baby_names_for_chart_targets_the_moon_pada(client: TestClient, enabled: None) -> None:
    chart_id = _create_chart(client)
    with SessionLocal() as session:
        ctx = load_chart_context(session, chart_id)
        result = baby_names_for_chart(chart_id, session)
    assert result.target_nakshatra_id == ctx.moon_nakshatra_id
    assert result.target_pada == ctx.moon_pada
    assert result.lagna_rasi == ctx.lagna_rasi


def test_usable_is_false_because_every_canon_row_is_still_draft(
    client: TestClient, enabled: None
) -> None:
    """Expected today, not a bug: 0/108 rows are `verified=True` yet.

    If this ever flips to True without a corresponding astrologer sign-off
    landing in `nakshatra_pada_akshara.py`, something upstream regressed the
    guard rather than the canon actually clearing review — check that file's
    `verified_row_count()` before "fixing" this test.
    """
    chart_id = _create_chart(client)
    with SessionLocal() as session:
        result = baby_names_for_chart(chart_id, session)
    assert result.usable is False


def test_alignment_only_ranks_within_a_pada_confidence_tier(
    client: TestClient, enabled: None
) -> None:
    """A number never overrides a graha (plan §9.1) — checked structurally.

    Every returned match's confidence must be non-decreasing down the list;
    alignment score may only reorder entries that share a tier.
    """
    chart_id = _create_chart(client)
    with SessionLocal() as session:
        result = baby_names_for_chart(chart_id, session, allow_ambiguous=True, limit=50)

    rank = {"confirmed": 0, "tamil_only": 1, "latin_only": 2, "ambiguous": 3}
    tiers = [rank[m.confidence.value] for m in result.matches]
    assert tiers == sorted(tiers), "a lower-precedence match ranked ahead of a higher one"

    # Within any tier that carries alignment, scores must be non-increasing.
    for _, group in groupby(zip(tiers, result.matches, strict=True), key=lambda pair: pair[0]):
        scores = [m.alignment.score for _, m in group if m.alignment is not None]
        assert scores == sorted(scores, reverse=True)


def test_public_path_never_carries_alignment(enabled: None) -> None:
    """No chart, no lagna — every candidate's alignment must be None."""
    result = baby_names_for_pada(1, 1, allow_ambiguous=True, allow_tamil_collapse=True)
    assert result.lagna_rasi is None
    assert all(m.alignment is None for m in result.matches)


# ---------------------------------------------------------------------------
# A parent's own shortlist, ranked in place among the recommendations
# ---------------------------------------------------------------------------
def test_shortlist_name_matching_a_corpus_name_is_shown_once(enabled: None) -> None:
    """"Suresh" is already a CONFIRMED corpus match for (1, 1). A parent
    typing the exact same name must see one card, tagged "both" — not the
    same name twice under two different cards."""
    result = baby_names_for_pada(
        1, 1, allow_ambiguous=True, limit=50, user_names=[UserNameQuery(latin_spelling="Suresh")]
    )
    hits = [m for m in result.matches if m.matched_spelling.casefold() == "suresh"]
    assert len(hits) == 1
    assert hits[0].source == "both"


def test_shortlist_name_survives_a_display_limit_that_would_otherwise_drop_it(
    enabled: None,
) -> None:
    """A shortlist name that opens no paadham at all ranks last by doctrine
    (D2), which a small `limit` would normally cut — it must still appear,
    because dropping a parent's own pick silently is exactly the "silence is
    a claim" mistake this feature exists to avoid."""
    result = baby_names_for_pada(
        1,
        1,
        allow_ambiguous=True,
        limit=1,
        user_names=[UserNameQuery(latin_spelling="Zzqxw")],
    )
    corpus_only = [m for m in result.matches if m.source == "corpus"]
    user_only = [m for m in result.matches if m.source == "user"]
    assert len(corpus_only) == 1  # the display limit still applies to the corpus side
    assert len(user_only) == 1
    assert user_only[0].matched_spelling == "Zzqxw"
    assert user_only[0].relation.value == "no_paadham"
    # total_matches counts the full pool, not just what's returned.
    assert result.total_matches >= len(result.matches)


def test_shortlist_name_bypasses_the_gender_filter(enabled: None) -> None:
    """"Suresh" is a boy's name and is filtered OUT of the corpus results when
    `gender="f"` — but a parent checking their own pick must still see it; the
    gender toggle narrows recommendations, not "does my chosen name count"."""
    result = baby_names_for_pada(
        1, 1, gender="f", allow_ambiguous=True, user_names=[UserNameQuery(latin_spelling="Suresh")]
    )
    assert not any(m.matched_spelling.casefold() == "suresh" and m.source == "corpus"
                   for m in result.matches)
    hits = [m for m in result.matches if m.matched_spelling.casefold() == "suresh"]
    assert len(hits) == 1
    assert hits[0].source == "user"


def test_shortlist_name_is_not_sunk_by_a_tier_english_only_input_cannot_win(
    enabled: None,
) -> None:
    """The reported defect, pinned.

    Baby Name Finder collects English spelling only, so a name the parent types
    can never reach CONFIRMED — and CONFIRMED outranks LATIN_ONLY in the sort.
    Measured before the fix, Uthiradam paadham 3 / girl / `open` scope: the
    parent's own name scored 85, **tied for the best chart fit of all 116
    names, and ranked 116th of 116**. Ranking a name last on a field our own
    form made unfillable is not a judgement about the name.

    What must NOT change: doctrine D2. A promoted name may only move within
    its own relation tier, never above an on-paadham name.
    """
    result = baby_names_for_pada(
        21,
        3,
        gender="f",
        mode=NamingMode.OPEN,
        limit=100,
        user_names=[UserNameQuery(latin_spelling="Aadhini")],
    )
    ranked = sorted(result.matches, key=lambda m: m.overall_rank)
    mine = next(m for m in ranked if m.source == "user")
    assert mine.confidence is MatchConfidence.LATIN_ONLY  # the cap is real…
    assert mine.relation is AksharaRelation.OTHER_PAADHAM

    # …but it no longer costs a place. Every name above it must be on a
    # STRONGER relation tier — never merely better-spelled on the same tier.
    above = [m for m in ranked if m.overall_rank < mine.overall_rank]
    assert above, "expected on-paadham names to still lead"
    assert all(
        _RELATION_RANK[m.relation] < _RELATION_RANK[mine.relation] for m in above
    ), "a same-tier corpus name outranked the parent's own pick on spelling evidence alone"


def test_ambiguous_shortlist_names_are_still_demoted(enabled: None) -> None:
    """AMBIGUOUS is not promoted alongside LATIN_ONLY.

    LATIN_ONLY means the English initial *uniquely* pins the row and only
    Tamil corroboration is missing. AMBIGUOUS means the matching script is
    lossy for that row — a real doubt about which paadham the letter opens,
    which survives regardless of who supplied the name.
    """
    from app.services.numerology_naming_service import _confidence_rank

    def item(confidence: MatchConfidence, source: str) -> object:
        return SimpleNamespace(confidence=confidence, source=source)

    confirmed = _confidence_rank(item(MatchConfidence.CONFIRMED, "corpus"))
    assert _confidence_rank(item(MatchConfidence.LATIN_ONLY, "user")) == confirmed
    assert _confidence_rank(item(MatchConfidence.LATIN_ONLY, "both")) == confirmed
    # Unchanged for a corpus row: there the missing Tamil IS evidence, because
    # the corpus always carries both scripts.
    assert _confidence_rank(item(MatchConfidence.LATIN_ONLY, "corpus")) > confirmed
    assert _confidence_rank(item(MatchConfidence.AMBIGUOUS, "user")) > confirmed


def test_advise_against_reuses_the_name_change_doctrine_and_what_it_refuses(
    client: TestClient, enabled: None
) -> None:
    """The one negative call this surface makes, delegated not reinvented.

    `should_advise_name_change` flags a non-benefic lordship that is ALSO
    misaligned or worse. What it REFUSES to flag matters as much: a
    functionally benefic graha is never grounds to reject a name, so the "8 is
    unlucky" claim can never reach a parent through this field.
    """
    chart_id = _create_chart(client)
    with SessionLocal() as session:
        result = baby_names_for_chart(chart_id, session, mode=NamingMode.OPEN, limit=50)

    for m in result.matches:
        if m.alignment is None:
            assert m.advise_against is False
            continue
        if m.alignment.is_benefic_lordship:
            assert m.advise_against is False, (
                f"{m.matched_spelling}: a benefic lordship must never be a reason "
                "to set a name aside, whatever the number's reputation"
            )
        if m.advise_against:
            assert not m.alignment.is_benefic_lordship
            assert m.alignment.verdict in {
                AlignmentVerdict.MISALIGNED,
                AlignmentVerdict.STRONGLY_MISALIGNED,
            }


def test_advise_against_never_reorders_across_a_relation_tier(
    client: TestClient, enabled: None
) -> None:
    """Doctrine D2 outranks the caution. A flagged name stays in its own
    letter-rule group — it is labelled there, not demoted out of it, because
    the akshara claim is real even when the number is poor (and a different
    spelling of the same name usually clears it)."""
    chart_id = _create_chart(client)
    with SessionLocal() as session:
        result = baby_names_for_chart(chart_id, session, mode=NamingMode.OPEN, limit=50)
    ranked = sorted(result.matches, key=lambda m: m.overall_rank)
    tiers = [_RELATION_RANK[m.relation] for m in ranked]
    assert tiers == sorted(tiers), "a caution moved a name out of its letter-rule group"


def test_public_chartless_path_expresses_no_opinion(enabled: None) -> None:
    """No lagna, no alignment, no advice — the flag must not default to a
    judgement the chart never supported."""
    result = baby_names_for_pada(1, 1, allow_ambiguous=True)
    assert all(m.alignment is None for m in result.matches)
    assert all(m.advise_against is False for m in result.matches)


def test_family_name_adds_a_second_reading_without_touching_the_first(enabled: None) -> None:
    """Called name and full name are different questions; both get answered.

    Tamil Nadu now uses first-name/last-name alongside the traditional
    initial + given name, so both are names the child really carries. The
    surname is supplied once and applies to OUR recommendations as well as the
    parent's own picks — a parent choosing from this list needs to know how
    "Gayathri Senthilkumar" reads, not only how their own shortlist does.
    """
    with_surname = baby_names_for_pada(
        21, 3, gender="f", mode=NamingMode.OPEN, limit=6, family_name="Senthilkumar"
    )
    for m in with_surname.matches:
        assert m.full_name_spelling == f"{m.matched_spelling} Senthilkumar"
        assert m.full_name_reading is not None
        # The called name's own reading is untouched by the surname.
        assert m.reading == score_text(m.matched_spelling)


def test_family_name_never_changes_the_ranking(enabled: None) -> None:
    """Doctrine: the paadham akshara governs the GIVEN name's opening letter,
    which a surname can neither satisfy nor violate. Ranking on the full name
    would also make the same given name rank differently for every family —
    turning our recommendation list into a statement about the surname.

    Worth pinning because the surname genuinely moves the numbers: measured on
    this paadham, "Gayathri" scores 85 alone and 25 as "Gayathri
    Senthilkumar". If that ever leaked into `_sort_key`, the list would
    silently reorder per family.
    """
    kwargs = {"gender": "f", "mode": NamingMode.OPEN, "limit": 6}
    plain = baby_names_for_pada(21, 3, **kwargs)
    surnamed = baby_names_for_pada(21, 3, family_name="Senthilkumar", **kwargs)

    assert [m.matched_spelling for m in surnamed.matches] == [
        m.matched_spelling for m in plain.matches
    ]
    assert [m.relation for m in surnamed.matches] == [m.relation for m in plain.matches]
    assert [m.confidence for m in surnamed.matches] == [m.confidence for m in plain.matches]
    assert [m.advise_against for m in surnamed.matches] == [
        m.advise_against for m in plain.matches
    ]


def test_no_family_name_leaves_the_full_name_fields_empty(enabled: None) -> None:
    """The ordinary case. Blank/whitespace must read the same as absent, not
    produce a trailing-space spelling."""
    for family in (None, "", "   "):
        result = baby_names_for_pada(21, 3, gender="f", limit=3, family_name=family)
        assert result.matches
        for m in result.matches:
            assert m.full_name_spelling is None
            assert m.full_name_reading is None
            assert m.full_name_alignment is None


def test_better_spellings_are_offered_exactly_where_the_caution_is(
    client: TestClient, enabled: None
) -> None:
    """The card promises "a different spelling of the same name usually clears
    it" — this is that spelling.

    One gate, two consumers: `should_advise_name_change` fires on a
    non-benefic lordship that is also misaligned, and `correct_name` refuses
    to generate anything unless both hold (its two no-change reasons are
    `benefic_lordship` and `not_misaligned`). So the sets must coincide
    exactly — a flagged card always has something actionable, and an unflagged
    one is never handed a "correction" it did not need.
    """
    chart_id = _create_chart(client)
    with SessionLocal() as session:
        result = baby_names_for_chart(chart_id, session, mode=NamingMode.OPEN, limit=50)

    for m in result.matches:
        if m.better_spellings:
            assert m.advise_against, (
                f"{m.matched_spelling}: offered a spelling correction without the caution"
            )
        for b in m.better_spellings:
            # A "correction" that scores worse is not one.
            assert b.improvement > 0
            assert b.alignment.score > (m.alignment.score if m.alignment else 0)
            assert b.spelling != m.matched_spelling
            assert b.operations, "a suggested spelling must name the move that produced it"


def test_better_spellings_never_touch_the_family_name(
    client: TestClient, enabled: None
) -> None:
    """Only the called name is on offer, and only because it is not registered
    anywhere yet.

    The family name is the opposite case — already on the parents' and
    siblings' documents — so it is scored into `full_name_reading` and left
    alone. Pinned here as well as in the engine because this is the surface
    that actually holds a surname: passing `full_name_spelling` to
    `correct_name` instead of the called name would compile, pass every other
    test, and start offering families a new spelling of their own surname.
    """
    chart_id = _create_chart(client)
    with SessionLocal() as session:
        result = baby_names_for_chart(
            chart_id, session, mode=NamingMode.OPEN, limit=50, family_name="Senthilkumar"
        )

    assert any(m.better_spellings for m in result.matches), "fixture offered nothing to check"
    for m in result.matches:
        for b in m.better_spellings:
            assert "Senthilkumar" not in b.spelling, (
                f"{b.spelling}: a spelling suggestion reached the family name"
            )


def test_better_spellings_are_absent_without_a_chart(enabled: None) -> None:
    """No lagna, no alignment, no caution — and so nothing to correct."""
    result = baby_names_for_pada(1, 1, allow_ambiguous=True)
    assert all(m.better_spellings == () for m in result.matches)


def test_better_spellings_carry_no_legal_warning_by_design(enabled: None) -> None:
    """Plan §9.4's warning is about changing an EXISTING legal name — Aadhaar,
    PAN, KYC, passport, certificates updated in step. A child being named has
    none of them, so `NameCorrectionResponse` (whose validator makes that
    warning unskippable) is deliberately not reused here.

    Pinned so a future reader sees the omission is a decision, not a gap: the
    dataclass must carry no warning field at all rather than an empty one.
    """
    from app.services.numerology_naming_service import BetterSpelling

    fields = BetterSpelling.__dataclass_fields__
    assert not any("legal" in name or "warning" in name for name in fields)


def test_shortlist_is_capped_and_blanks_are_ignored(enabled: None) -> None:
    result = baby_names_for_pada(
        1,
        1,
        user_names=[
            UserNameQuery(latin_spelling=""),
            UserNameQuery(latin_spelling="  "),
            UserNameQuery(latin_spelling="Alpha"),
            UserNameQuery(latin_spelling="Beta"),
            UserNameQuery(latin_spelling="Gamma"),
            UserNameQuery(latin_spelling="Delta"),
            UserNameQuery(latin_spelling="Epsilon"),
            UserNameQuery(latin_spelling="Zeta"),
        ],
    )
    user_only = {m.matched_spelling for m in result.matches if m.source == "user"}
    assert user_only == {"Alpha", "Beta", "Gamma", "Delta", "Epsilon"}  # first 5, blanks dropped


def test_require_baby_naming_enabled_404s_independently_of_numerology_engine() -> None:
    """The second flag, not folded into the first.

    `numerology_engine` may be True (it is, by default) while
    `numerology_baby_naming` is still False — this must still refuse.
    """
    set_flag("numerology_engine", True)
    set_flag("numerology_baby_naming", False)
    try:
        with pytest.raises(HTTPException) as exc_info:
            require_baby_naming_enabled()
        assert exc_info.value.status_code == 404
    finally:
        reset_flag("numerology_engine")
        reset_flag("numerology_baby_naming")


def test_unverified_canon_still_raises_in_a_real_environment(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, enabled: None
) -> None:
    """Belt-and-braces backstop behind the flags, mirrored from
    `test_numerology_naming.py`'s guard test — reachable only if both flags
    were flipped True ahead of the canon actually clearing review."""
    chart_id = _create_chart(client)
    monkeypatch.setenv("APP_ENV", "production")
    with SessionLocal() as session, pytest.raises(UnverifiedCanonError):
        baby_names_for_chart(chart_id, session)
