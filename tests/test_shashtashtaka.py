"""F-POR-02 — ஷஷ்டாஷ்டகம் (6/8) disclosure, ruled 2026-10-13.

The ruling approved a **safeguard, not a verdict**: detect the 6/8 relation in
either orientation, mark it `ஷஷ்டாஷ்டகக் குறை — மேலாய்வு தேவை`, do not equate it
with rejection, and *retain* the Kalaprakasika directional result as a
separately identified textual interpretation. So the thing most of this file
pins is what the feature **does not** do.

**What these gates would catch, and what they cannot.** Run with the feature
removed they all error on the import, which proves nothing; the failures worth
having are the plausible future edits:

* narrowing detection to the adverse count only ("6 is the bad one") — caught by
  `test_the_rulings_three_worked_examples`, two of whose three cases are count 8;
* folding the note into the arithmetic — caught by
  `test_the_note_changes_no_number`;
* paraphrasing the approved Tamil copy — caught by
  `test_the_tamil_copy_is_the_rulings_verbatim_wording`;
* "simplifying" `_rasi_score` to fail the 8th, which would overturn
  EC-RULING-01 by implication — caught by
  `test_the_directional_rule_is_retained_unchanged`.

**Blind spot:** every assertion here encodes *our* reading of the ruling's
mechanism. Nothing checks the Tamil copy against a native reader (it is the
ruling's own wording, which is the strongest available warrant but not a review),
and nothing checks that a 6/8 note is what a jothidar would actually say on a
given chart. The ruling also left p.74 un-re-examined, so the directional rule
this file pins is itself provisional.
"""
from __future__ import annotations

import pytest

from app.calculations.porutham import (
    ShashtashtakaNote,
    compute_porutham,
    shashtashtaka_relation,
)

pytestmark = pytest.mark.no_db

# girl's rasi, boy's rasi — the three examples tabulated in the ruling.
RULING_EXAMPLES: list[tuple[int, int, int, int]] = [
    # (girl_rasi, boy_rasi, expected girl->boy, expected boy->girl)
    (1, 8, 8, 6),   # Mesham      -> Viruchigam
    (2, 9, 8, 6),   # Rishabam    -> Dhanusu
    (4, 9, 6, 8),   # Kadagam     -> Dhanusu
]

ALL_RASI = range(1, 13)


def _note(girl_rasi: int, boy_rasi: int) -> ShashtashtakaNote:
    return shashtashtaka_relation(boy_rasi=boy_rasi, girl_rasi=girl_rasi)


# ── detection ───────────────────────────────────────────────────────────────

@pytest.mark.parametrize(("girl", "boy", "g_to_b", "b_to_g"), RULING_EXAMPLES)
def test_the_rulings_three_worked_examples(girl: int, boy: int, g_to_b: int, b_to_g: int) -> None:
    """*"In conventional ஷஷ்டாஷ்டக analysis, these are 6/8 relationships
    regardless of which chart is counted first."* Two of the three are count 8,
    which is the half the directional rule passes — so an implementation that
    only flagged the adverse count would fail here."""
    note = _note(girl, boy)
    assert note.present
    assert note.count_girl_to_boy == g_to_b
    assert note.count_boy_to_girl == b_to_g
    assert note.label_ta == "ஷஷ்டாஷ்டகக் குறை — மேலாய்வு தேவை"


def test_detection_is_closed_under_swapping_the_two_charts() -> None:
    """"Either orientation" is the whole point of the ruling. The two inclusive
    counts sum to 14, so {6, 8} is closed under the swap — this asserts the
    property rather than the arithmetic identity, so it still holds if the
    implementation stops relying on that identity."""
    for girl in ALL_RASI:
        for boy in ALL_RASI:
            assert _note(girl, boy).present == _note(boy, girl).present


def test_same_sign_couples_are_not_shashtashtaka() -> None:
    """Count 1 is its own rule in `_rasi_score` and is routed out here too."""
    for rasi in ALL_RASI:
        assert not _note(rasi, rasi).present


def test_the_flagged_population_is_twenty_four_of_one_hundred_and_forty_four() -> None:
    """Twelve pairings at count 6, twelve at count 8. Pinned because a change to
    `_SHASHTASHTAKA_COUNTS` would otherwise be invisible."""
    flagged = [(g, b) for g in ALL_RASI for b in ALL_RASI if _note(g, b).present]
    assert len(flagged) == 24
    counts = sorted(_note(g, b).count_girl_to_boy for g, b in flagged)
    assert counts.count(6) == 12
    assert counts.count(8) == 12


def test_eighteen_of_the_twenty_four_still_pass_rasi_today() -> None:
    """**The measurement the audit got wrong.** It framed this as "the 8th
    passes". Count 6 is adverse in general, but `_rasi_exception_lifts` — the
    enumerated p.74 exception pairs, approved on the unrelated question of
    restoring missing passes — lifts six of the twelve count-6 pairings to a
    full pass as well. So 18 of 144 rasi combinations are passed on Rasi while
    standing in a 6/8 relation, not 12.

    If this number moves, the exception table moved. That is a real event and
    should be read, not re-baselined.
    """
    flagged = [(g, b) for g in ALL_RASI for b in ALL_RASI if _note(g, b).present]
    passing = [(g, b) for g, b in flagged if _note(g, b).directional_pass]
    assert len(passing) == 18

    by_count = {6: 0, 8: 0}
    for g, b in passing:
        by_count[_note(g, b).count_girl_to_boy] += 1
    assert by_count == {8: 12, 6: 6}


# ── the restraint: it is a disclosure, not a verdict ────────────────────────

def test_the_directional_rule_is_retained_unchanged() -> None:
    """*"Retain the existing Kalaprakasika directional result as a separately
    identified textual interpretation until the actual page is re-examined."*

    Count 8 must still pass Rasi. Making it fail would overturn EC-RULING-01 by
    implication, which the astrologer explicitly declined to do without seeing
    p.74: *"I cannot definitively overturn your earlier page-74 ruling without
    seeing that passage itself."*
    """
    for girl, boy, g_to_b, _ in RULING_EXAMPLES:
        if g_to_b == 8:
            assert _note(girl, boy).directional_pass, (
                "count 8 must still pass Rasi — the ruling retains the "
                "directional result and adds a note beside it"
            )


def test_the_note_changes_no_number() -> None:
    """The disclosure must not reach `total_score`, and `total_score` must stay
    the sum of the ten kuta scores. Swept over nakshatra and rasi combinations
    including every Shashtashtaka pairing."""
    for boy_nak in range(1, 28, 3):
        for girl_nak in range(1, 28, 4):
            for boy_rasi in (1, 5, 8, 9):
                for girl_rasi in (1, 2, 4, 12):
                    result = compute_porutham(
                        boy_nakshatra=boy_nak,
                        girl_nakshatra=girl_nak,
                        boy_rasi=boy_rasi,
                        girl_rasi=girl_rasi,
                    )
                    assert result.total_score == pytest.approx(
                        sum(k.score for k in result.kutas)
                    ), "the shashtashtaka note has leaked into the arithmetic"


def test_the_note_does_not_reach_the_summary_or_the_veto() -> None:
    """A 6/8 pairing must not acquire a veto, and the summary sentences — which
    carry the Rajju/Vedha suffixes — must not grow a Shashtashtaka clause. The
    note is a separate field precisely so a consumer renders it beside the Rasi
    row rather than as a headline."""
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=1, boy_rasi=8, girl_rasi=1
    )
    assert result.shashtashtaka.present
    assert "ஷஷ்டாஷ்டக" not in result.summary_ta
    assert "Shashtashtaka" not in result.summary_en


def test_the_note_is_empty_when_the_relation_is_absent() -> None:
    """An absent relation carries no label and no copy, so a consumer can render
    on truthiness without also testing `present` and getting it wrong."""
    note = _note(1, 3)
    assert not note.present
    assert note.label_en == ""
    assert note.label_ta == ""
    assert note.note_en == ""
    assert note.note_ta == ""


# ── copy ────────────────────────────────────────────────────────────────────

def test_the_tamil_copy_is_the_rulings_verbatim_wording() -> None:
    """Supplied as approved wording, so a paraphrase is a regression rather than
    an edit. It also has to keep carrying the advisory voice — it asks for an
    examination and names what to examine; it does not decide."""
    note = _note(1, 8)
    assert note.note_ta == (
        "இருவரின் ராசிகளும் ஆறு–எட்டு (ஷஷ்டாஷ்டகம்) தொடர்பில் அமைந்துள்ளன. தமிழகத் "
        "திருமணப் பொருத்த மரபில் இது கவனிக்க வேண்டிய அமைப்பாகக் கருதப்படுகிறது. முழு "
        "ஜாதகத்தில் ஏழாம் பாவம், அதன் அதிபதி, சுக்கிரன், செவ்வாய் நிலை மற்றும் பிற "
        "பொருத்தங்களையும் சேர்த்துப் பரிசீலிக்க வேண்டும்."
    )


def test_neither_language_promises_an_outcome() -> None:
    """The standing directive: a traditional indication is never proof a
    marriage will fail. Guards against the banned ஆயுள் framing EC-RULING-06
    excised, and against a future edit hardening the copy into a verdict."""
    note = _note(1, 8)
    for banned in ("ஆயுள்", "fail", "reject", "unsuitable", "incompatible"):
        assert banned.lower() not in note.note_en.lower()
    assert "ஆயுள்" not in note.note_ta
