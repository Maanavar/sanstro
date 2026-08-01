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
from uuid import UUID

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.calculations.numerology_naming import UnverifiedCanonError
from app.db.session import SessionLocal
from app.services.feature_flags import reset_flag, set_flag
from app.services.numerology_naming_service import (
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
