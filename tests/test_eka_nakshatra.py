"""F-POR-03 — ஏக நட்சத்திரம் (same birth star), ruled 2026-10-13.

The ruling approved a dedicated assessment, separate from Dinam and Rajju, and
held its data (the star+pada table). So what is built is the assessment and its
disclosure with **no exception applied**, and most of this file pins what the
feature does not do.

**What these gates would catch.** With the feature removed they error on the
import, which proves nothing; the failures worth having are the plausible
future edits:

* filling the held table from memory and letting it lift Rajju — caught by
  `test_rajju_still_fails_for_every_same_star_couple` and
  `test_no_exception_is_applied_anywhere`;
* echoing the by-star route's "which half" marker (1/4) or default (3) as a
  birth pada — caught by `test_padas_are_unknown_unless_the_caller_vouches_for_them`
  and the API test, which fails if `pada_known=True` is passed there;
* folding the note into the arithmetic or the summary — caught by
  `test_the_note_changes_no_number_and_no_summary`;
* a share snapshot dropping the note on read — caught by
  `test_share_view_keeps_both_porutham_notes` (it failed on the old schema,
  which silently dropped `shashtashtaka` too).

**Blind spot:** the English and Tamil copy is Vinaadi's draft and has not been
read by a native speaker or the astrologer. These tests pin its shape (no
outcome claim, locked spellings), not its quality.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.calculations.porutham import (
    _RAJJU_GROUP,
    compute_porutham,
    eka_nakshatra_assessment,
)
from app.core.rate_limit import reset_rate_limit_backend
from app.main import app
from app.schemas.porutham_shares import PoruthamShareViewData
from app.schemas.relationships import EkaNakshatraData
from app.services.synastry_service import _contextualize_porutham_result

pytestmark = pytest.mark.no_db

STARS = range(1, 28)
PADAS = range(1, 5)


def _porutham(nak: int, boy_pada: int = 1, girl_pada: int = 1, *, pada_known: bool = True):
    # Rasi is irrelevant to this note; any valid pair will do.
    return compute_porutham(
        boy_nakshatra=nak, girl_nakshatra=nak, boy_rasi=1, girl_rasi=1,
        boy_pada=boy_pada, girl_pada=girl_pada, pada_known=pada_known,
    )


# ── detection ───────────────────────────────────────────────────────────────

def test_present_exactly_when_the_two_stars_are_the_same() -> None:
    for boy in STARS:
        for girl in STARS:
            note = eka_nakshatra_assessment(boy, girl, 1, 1, pada_known=True)
            assert note.present is (boy == girl), (boy, girl)


def test_the_note_is_empty_when_the_stars_differ() -> None:
    note = eka_nakshatra_assessment(1, 2, 2, 3, pada_known=True)
    assert (note.label_en, note.label_ta, note.note_en, note.note_ta) == ("", "", "", "")
    assert note.boy_pada is None and note.girl_pada is None and note.same_pada is None


# ── what it must not do ─────────────────────────────────────────────────────

def test_rajju_still_fails_for_every_same_star_couple() -> None:
    """*Do not falsify the Rajju calculation to produce a pass.* Every star,
    every pada pairing: Rajju fails, the veto holds, the label is CAUTION."""
    for nak in STARS:
        for bp in PADAS:
            for gp in PADAS:
                result = _porutham(nak, bp, gp)
                rajju = next(k for k in result.kutas if k.name == "Rajju")
                assert rajju.score == 0 and not rajju.passed, (nak, bp, gp)
                assert result.rajju_dosha, (nak, bp, gp)
                assert result.label == "CAUTION", (nak, bp, gp)


def test_rajju_is_unchanged_for_every_pairing() -> None:
    """Rajju is still the bare group comparison across all 729 pairings."""
    for boy in STARS:
        for girl in STARS:
            result = compute_porutham(boy_nakshatra=boy, girl_nakshatra=girl, boy_rasi=1, girl_rasi=1)
            rajju = next(k for k in result.kutas if k.name == "Rajju")
            assert rajju.score == (0 if _RAJJU_GROUP[boy] == _RAJJU_GROUP[girl] else 1)


def test_no_exception_is_applied_anywhere() -> None:
    """The table is held, so no star+pada gets a class or an exception."""
    for nak in STARS:
        for bp in PADAS:
            for gp in PADAS:
                for known in (True, False):
                    note = _porutham(nak, bp, gp, pada_known=known).eka_nakshatra
                    assert note.present
                    assert note.classification is None
                    assert note.rajju_exception_applied is False


def test_the_note_changes_no_number_and_no_summary() -> None:
    """`pada_known` and the note may change only the note."""
    for nak in STARS:
        a = _porutham(nak, 2, 3, pada_known=True)
        b = _porutham(nak, 2, 3, pada_known=False)
        assert a.kutas == b.kutas
        assert (a.total_score, a.label, a.summary_en, a.summary_ta) == (
            b.total_score, b.label, b.summary_en, b.summary_ta
        )
        assert a.nadi_dosha == b.nadi_dosha
        assert a.total_score == pytest.approx(sum(k.score for k in a.kutas))
        assert "Eka" not in a.summary_en and "ஏக" not in a.summary_ta


# ── padas ───────────────────────────────────────────────────────────────────

def test_padas_are_unknown_unless_the_caller_vouches_for_them() -> None:
    """The default is unknown. A by-star caller's 1/4 or 3 is not a birth pada."""
    default = compute_porutham(boy_nakshatra=5, girl_nakshatra=5, boy_rasi=2, girl_rasi=2).eka_nakshatra
    assert default.present
    assert (default.boy_pada, default.girl_pada, default.same_pada) == (None, None, None)
    assert "not known" in default.note_en
    assert "தெரியவில்லை" in default.note_ta


def test_known_padas_are_stated_same_or_different() -> None:
    same = _porutham(5, 2, 2).eka_nakshatra
    assert (same.boy_pada, same.girl_pada, same.same_pada) == (2, 2, True)
    assert "the same pada" in same.note_en and "ஒரே பாதம்" in same.note_ta

    diff = _porutham(5, 1, 4).eka_nakshatra
    assert (diff.boy_pada, diff.girl_pada, diff.same_pada) == (1, 4, False)
    assert "different padas" in diff.note_en and "வேறு பாதங்கள்" in diff.note_ta


# ── copy ────────────────────────────────────────────────────────────────────

def test_neither_language_promises_an_outcome_and_spellings_are_locked() -> None:
    note = _porutham(9, 1, 2).eka_nakshatra
    for banned in ("fail", "reject", "unsuitable", "incompatible", "avoid", "lifespan"):
        assert banned not in note.note_en.lower(), banned
    assert "ஆயுள்" not in note.note_ta
    assert "ரஜ்ஜு" in note.note_ta and "ராஜ்ஜு" not in note.note_ta
    # The brand is spelled விநாடி (122 uses against வினாடி's 13).
    assert "வினாடி" not in note.note_ta


# ── wire and surfaces ───────────────────────────────────────────────────────

def test_wire_shape_uses_camel_case_aliases() -> None:
    wire = EkaNakshatraData.from_note(_porutham(9, 1, 2).eka_nakshatra).model_dump(by_alias=True)
    assert wire["present"] is True
    assert (wire["boyPada"], wire["girlPada"], wire["samePada"]) == (1, 2, False)
    assert wire["classification"] is None and wire["rajjuExceptionApplied"] is False
    assert wire["label"]["ta"] and wire["note"]["en"]


@pytest.mark.parametrize(
    ("context", "shown"),
    [("MARRIAGE", True), ("FRIENDSHIP", False), ("BUSINESS", False), ("FAMILY", False), ("GENERAL", False)],
)
def test_the_note_goes_only_where_the_context_shows_rajju(context: str, shown: bool) -> None:
    shaped = _contextualize_porutham_result(_porutham(9, 1, 2), context)
    assert (shaped["eka_nakshatra"] is not None) is shown


def test_share_view_keeps_both_porutham_notes() -> None:
    """The share view model used to have no `shashtashtaka` field, so pydantic
    dropped the note the service passed it. Both notes must survive a read."""
    from datetime import UTC, datetime

    result = _porutham(9, 1, 2)
    eka = EkaNakshatraData.from_note(result.eka_nakshatra).model_dump(by_alias=True)
    sha = {
        "present": True, "countGirlToBoy": 8, "countBoyToGirl": 6, "directionalPass": True,
        "label": {"ta": "t", "en": "e"}, "note": {"ta": "t", "en": "e"},
    }
    view = PoruthamShareViewData.model_validate({
        "boyNakshatra": 9, "boyNakshatraName": "x", "girlNakshatra": 9, "girlNakshatraName": "x",
        "kutas": [], "totalScore": 0, "maxScore": 10, "percentage": 0, "label": "CAUTION",
        "rajjuDosha": True, "vedhaDosha": False,
        "nadiDosha": {"boyNadi": "A", "girlNadi": "A", "hasNadiDosha": True, "severity": "HIGH",
                      "noteTa": "", "noteEn": ""},
        "shashtashtaka": sha, "ekaNakshatra": eka,
        "summary": {"ta": "", "en": ""}, "compatibilityContext": "MARRIAGE",
        "createdAt": datetime.now(UTC), "expiresAt": datetime.now(UTC),
    })
    dumped = view.model_dump(by_alias=True)
    assert dumped["shashtashtaka"]["countGirlToBoy"] == 8
    assert dumped["ekaNakshatra"]["present"] is True


@pytest.fixture(autouse=False)
def _fresh_rate_limit():
    reset_rate_limit_backend()
    yield
    reset_rate_limit_backend()


def test_by_star_route_reports_the_note_with_padas_unknown(_fresh_rate_limit) -> None:
    """The by-star route's padas are "which half" markers, so it must not
    state them as birth padas, even when the request sends both."""
    with TestClient(app, raise_server_exceptions=False) as client:
        same = client.post(
            "/api/v1/public/porutham/by-star",
            json={"boyNakshatraNumber": 3, "girlNakshatraNumber": 3, "boyPada": 1, "girlPada": 4},
        )
        differ = client.post(
            "/api/v1/public/porutham/by-star",
            json={"boyNakshatraNumber": 3, "girlNakshatraNumber": 4},
        )

    assert same.status_code == 200, same.text
    eka = same.json()["data"]["ekaNakshatra"]
    assert eka["present"] is True
    assert (eka["boyPada"], eka["girlPada"], eka["samePada"]) == (None, None, None)
    assert same.json()["data"]["rajjuDosha"] is True
    assert differ.json()["data"]["ekaNakshatra"]["present"] is False
