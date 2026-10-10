"""DOCTRINE_DECISIONS v1.8 — the owner's second round of rulings, 2026-10-03.

Two A2 items from the sign-off packet: Kadagam Guru (kept out by the
moolatrikona co-lord test until v1.7) and O-24 (kendradhipati for a natural
benefic owning two kendras). Both are owner rulings, not a practitioner
signature; `MATRIX_SIGNED_OFF` stays False and the BPHS 34 Dhanus verse is
still to be checked in a printed edition (§18).

All charts are synthetic placements, not anyone's birth data.
"""
from __future__ import annotations

import pytest

from app.calculations._yoga_detect import detect_raja_yoga
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, OPEN_ITEM_BY_ID, DoctrineOptions
from app.calculations.functional_status import (
    ALL_LAGNAS,
    MATRIX_SIGNED_OFF,
    MIXED_RAJA_RELATION,
    RAJA_LINEAGE_EXCEPTIONS,
    SEVEN_SIGN_LORDS,
    kendradhipati_two_kendras,
    raja_grade,
    raja_participation,
    raja_relation,
)

pytestmark = pytest.mark.no_db

MESHAM, RISHABAM, MITHUNAM, KADAGAM, SIMMAM, KANNI = 1, 2, 3, 4, 5, 6
THULAM, VIRUCHIGAM, DHANUSU, MAGARAM, KUMBAM, MEENAM = 7, 8, 9, 10, 11, 12
SURYAN, CHANDRAN, SEVVAI, BUDHAN = "SUN", "MOON", "MARS", "MERCURY"
GURU, SUKRAN, SANI, RAHU, KETU = "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"


def _chart(**rasis: int) -> dict[str, int]:
    """Every sign lord parked in Rishabam, nodes on the Rishabam–Viruchigam
    axis, unless placed."""
    base = {p: RISHABAM for p in SEVEN_SIGN_LORDS} | {RAHU: RISHABAM, KETU: VIRUCHIGAM}
    base.update({k.upper(): v for k, v in rasis.items()})
    return base


def _pair(results, a: str, b: str):
    return [r for r in results if r.is_present and set(r.key_grahas) == {a, b}]


def test_matrix_stays_unsigned() -> None:
    assert MATRIX_SIGNED_OFF is False


# ── Kadagam Guru: a named exception, not a weaker rule ───────────────────────
def test_kadagam_guru_takes_part_as_the_ninth_lord() -> None:
    part = raja_participation(KADAGAM, GURU)
    assert part.eligible and part.trikona_lord and not part.kendra_lord
    assert part.basis == "kadagam_guru_9th_lord_exception"
    exception = RAJA_LINEAGE_EXCEPTIONS[(KADAGAM, GURU)]
    assert exception.positive_lordship == {9} and exception.adverse_lordship == {6}


def test_the_exception_reaches_no_other_lord() -> None:
    """Only Kadagam Guru moves. The other 6th/8th and 3rd/11th exclusions stand."""
    out = {
        (l, p) for l in ALL_LAGNAS for p in SEVEN_SIGN_LORDS
        if (part := raja_participation(l, p)) and (part.kendra_lord or part.trikona_lord) and not part.eligible
    }
    assert out == {
        (MESHAM, SANI), (KADAGAM, SANI), (SIMMAM, SUKRAN),
        (KANNI, SANI), (KUMBAM, SEVVAI), (KUMBAM, BUDHAN),
    }


@pytest.mark.parametrize("partner", [SEVVAI, CHANDRAN, SUKRAN], ids=["mars-yogakaraka", "moon-lagna-lord", "venus"])
def test_every_kadagam_guru_pair_grades_mixed_never_full(partner: str) -> None:
    """Guru carries its 6th into every pair: Sevvai (5+10, the yogakaraka),
    Chandran (lagna lord), Sukran (4+11). Conjunct in Meenam, Guru's own 9th."""
    results = detect_raja_yoga(_chart(jupiter=MEENAM, **{partner: MEENAM}), KADAGAM)
    found = _pair(results, GURU, partner)
    assert found, partner
    assert "raja_grade_mixed" in found[0].conditions_met
    assert raja_grade(KADAGAM, GURU, partner) == "MIXED"
    assert raja_relation(KADAGAM, GURU, partner) == MIXED_RAJA_RELATION


def test_switching_the_exception_off_restores_v17() -> None:
    v17 = DoctrineOptions(o23_lineage_exceptions=False)
    part = raja_participation(KADAGAM, GURU, v17)
    assert not part.eligible and part.basis == "moolatrikona_dusthana"
    results = detect_raja_yoga(_chart(jupiter=MEENAM, mars=MEENAM), KADAGAM, doctrine=v17)
    assert not _pair(results, GURU, SEVVAI)


def test_the_exception_holds_under_the_six_eight_only_test() -> None:
    options = DoctrineOptions(o23_six_eight_colord_mode="moolatrikona")
    assert raja_participation(KADAGAM, GURU, options).basis == "kadagam_guru_9th_lord_exception"
    # Under lordship_only the test never excluded Guru, so the exception is not needed.
    lordship = DoctrineOptions(o23_six_eight_colord_mode="lordship_only")
    assert raja_participation(KADAGAM, GURU, lordship).basis == "lordship_only_6th_8th"


# ── O-24: kendradhipati grades, it does not delete ───────────────────────────
def test_o24_default_is_mixed() -> None:
    assert DEFAULT_DOCTRINE.o24_kendradhipati_two_kendras == "mixed"
    assert "Owner ruling 2026-10-03" in OPEN_ITEM_BY_ID["O-24"].default


@pytest.mark.parametrize(
    ("lagna", "planet"),
    [(MITHUNAM, GURU), (KANNI, GURU), (DHANUSU, BUDHAN), (MEENAM, BUDHAN)],
    ids=["mithunam-guru", "kanni-guru", "dhanusu-budhan", "meenam-budhan"],
)
def test_two_kendra_benefics_stay_eligible(lagna: int, planet: str) -> None:
    assert kendradhipati_two_kendras(lagna, planet)
    part = raja_participation(lagna, planet)
    assert part.eligible and part.basis == "kendradhipati_mixed"


def test_golden_dhanusu_surya_budhan_is_not_rejected_for_kendradhipati() -> None:
    """BPHS 34, Dhanus: Surya (9th) and Budhan (7th+10th) are capable of
    conferring a yoga. Conjunct, the pair forms; Budhan's kendradhipati shows
    in the grade and does not make it FULL."""
    results = detect_raja_yoga(_chart(sun=SIMMAM, mercury=SIMMAM), DHANUSU)
    found = _pair(results, SURYAN, BUDHAN)
    assert found
    assert "raja_grade_mixed_kendradhipati" in found[0].conditions_met
    assert "raja_grade_full" not in found[0].conditions_met


def test_mithunam_guru_is_eligible_but_its_saturn_pair_is_still_vetoed() -> None:
    """Eligibility first, then the pair rule: BPHS 34 vetoes Guru + Sani for
    Mithunam, so O-24 letting Guru take part does not let that pair form."""
    assert raja_participation(MITHUNAM, GURU).eligible
    results = detect_raja_yoga(_chart(jupiter=KADAGAM, saturn=KADAGAM), MITHUNAM)
    assert not _pair(results, GURU, SANI)
    assert any("raja_pair_source_vetoed_jupiter_saturn" in r.cancellation_factors for r in results)
