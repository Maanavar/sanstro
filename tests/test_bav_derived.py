"""Bhinnashtakavarga indications counted from the karaka graha's own rasi.

Covers the counting convention, the bands, the four rules, the asymmetric
progeny disclosure, and the life-area age-band regression that made this
change's wiring safe (a borrowed karaka chain used to drag its age gate onto a
different area).
"""
from __future__ import annotations

import pytest

from app.calculations.ashtakavarga import BAV_TABLE, compute_bhinnashtakavarga
from app.calculations.bav_derived import (
    BAND_NEUTRAL,
    BAND_STRONG,
    BAND_THIN,
    BAV_DERIVED_RULES,
    BavIndication,
    bav_house_from_planet,
    classify_bindu_band,
    compute_bav_derived_indications,
    disclosable_indications,
    expected_bindus,
    factor_code,
    rasi_from_planet,
)

pytestmark = pytest.mark.no_db

# Synthetic chart — not a real birth profile. Rasi numbers 1-12.
NATAL_RASI_MAP: dict[str, int] = {
    "SUN": 1,
    "MOON": 4,
    "MARS": 10,
    "MERCURY": 2,
    "JUPITER": 12,
    "VENUS": 3,
    "SATURN": 7,
    "RAHU": 5,
    "KETU": 11,
    "LAGNA": 8,
}


# ── Counting convention ─────────────────────────────────────────────────────

def test_first_house_from_a_planet_is_its_own_rasi():
    """1-based inclusive, matching compute_bhinnashtakavarga's own walk."""
    assert rasi_from_planet(NATAL_RASI_MAP, "JUPITER", 1) == 12


def test_fifth_from_jupiter_wraps_the_zodiac():
    # Jupiter in 12; 5th from it = 12 -> 1 -> 2 -> 3 -> 4 (inclusive count).
    assert rasi_from_planet(NATAL_RASI_MAP, "JUPITER", 5) == 4


@pytest.mark.parametrize(
    ("planet", "house", "expected"),
    [
        ("MARS", 3, 12),      # Mars in 10 -> 10,11,12
        ("MERCURY", 4, 5),    # Mercury in 2 -> 2,3,4,5
        ("SUN", 9, 9),        # Sun in 1 -> 1..9
    ],
)
def test_each_rule_counts_from_its_own_karaka(planet, house, expected):
    assert rasi_from_planet(NATAL_RASI_MAP, planet, house) == expected


def test_absent_graha_is_not_evaluated_rather_than_defaulted():
    assert rasi_from_planet({"SUN": 1}, "JUPITER", 5) is None
    assert bav_house_from_planet({}, {"SUN": 1}, "JUPITER", 5) is None


def test_nodes_get_no_saturn_proxy_here():
    """The nodes have no Bhinnashtakavarga table, so no bindu is returned.

    This layer always refused the Saturn proxy that `get_av_bindu` applied when
    scoring a transit; doctrine A-15 (ruled 2026-08-19) removed that proxy too,
    so both layers now answer None."""
    bav = compute_bhinnashtakavarga(NATAL_RASI_MAP)
    assert bav_house_from_planet(bav, NATAL_RASI_MAP, "RAHU", 3) is None


# ── Bands ───────────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    ("karaka", "house", "baseline"),
    [
        ("JUPITER", 5, 4.00),   # 5th not in Guru's own row  -> no self bindu
        ("MARS", 3, 2.67),      # 3rd not in Sevvai's own row -> no self bindu
        ("MERCURY", 4, 3.83),   # 4th not in Budhan's own row -> no self bindu
        ("SUN", 9, 4.33),       # 9th IS in Suriyan's own row -> +1 always
    ],
)
def test_each_rule_has_its_own_baseline(karaka, house, baseline):
    assert expected_bindus(karaka, house) == pytest.approx(baseline, abs=0.01)


def test_the_paternal_rule_alone_gets_a_self_bindu():
    """Structural, and the reason a flat cut skews toward "paternal strong"."""
    assert 9 in BAV_TABLE["SUN"]["SUN"]
    assert 5 not in BAV_TABLE["JUPITER"]["JUPITER"]
    assert 3 not in BAV_TABLE["MARS"]["MARS"]
    assert 4 not in BAV_TABLE["MERCURY"]["MERCURY"]


@pytest.mark.parametrize(
    ("karaka", "house", "bindus", "band"),
    [
        # progeny, baseline 4.00
        ("JUPITER", 5, 5, BAND_STRONG),
        ("JUPITER", 5, 4, BAND_NEUTRAL),
        ("JUPITER", 5, 3, BAND_THIN),
        # siblings, baseline 2.67 — 4 is STRONG here and NEUTRAL for progeny
        ("MARS", 3, 4, BAND_STRONG),
        ("MARS", 3, 3, BAND_NEUTRAL),
        ("MARS", 3, 1, BAND_THIN),
        # paternal, baseline 4.33 — 5 is NEUTRAL here and STRONG for progeny
        ("SUN", 9, 5, BAND_NEUTRAL),
        ("SUN", 9, 6, BAND_STRONG),
        ("SUN", 9, 3, BAND_THIN),
    ],
)
def test_band_is_relative_to_the_rules_own_baseline(karaka, house, bindus, band):
    assert classify_bindu_band(bindus, karaka, house) == band


def test_no_rule_is_systematically_negative():
    """Regression guard on the defect the distribution sweep caught.

    A flat "5 strong / 3 thin" cut called 74% of sibling indications THIN —
    a property of Sevvai's 39-bindu table, not of anybody's chart. No rule may
    land in one band for more than half of charts.
    """
    import random
    from collections import Counter

    random.seed(7)
    grahas = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "LAGNA"]
    bands: dict[str, Counter] = {rule.key: Counter() for rule in BAV_DERIVED_RULES}
    trials = 2000
    for _ in range(trials):
        rasi_map = {graha: random.randint(1, 12) for graha in grahas}
        bav = compute_bhinnashtakavarga(rasi_map)
        for key, indication in compute_bav_derived_indications(bav, rasi_map).items():
            bands[key][indication.band] += 1

    # Only the bands that actually reach a reader are capped. A large NEUTRAL
    # share is the desirable outcome, not a defect — it means the rule stays
    # quiet unless the chart says something.
    for key, counter in bands.items():
        for band in (BAND_STRONG, BAND_THIN):
            share = counter[band] / trials
            assert share <= 0.5, f"{key}: {band} fires on {share:.0%} of charts"


# ── The four rules ──────────────────────────────────────────────────────────

def test_all_four_rules_compute_and_stay_on_the_zero_to_eight_scale():
    bav = compute_bhinnashtakavarga(NATAL_RASI_MAP)
    indications = compute_bav_derived_indications(bav, NATAL_RASI_MAP)

    assert set(indications) == {"progeny", "siblings", "maternal", "paternal"}
    for indication in indications.values():
        assert 0 <= indication.bindus <= 8
        assert indication.band in {BAND_STRONG, BAND_NEUTRAL, BAND_THIN}


def test_each_rule_reads_its_own_karakas_bav_table():
    bav = compute_bhinnashtakavarga(NATAL_RASI_MAP)
    indications = compute_bav_derived_indications(bav, NATAL_RASI_MAP)

    for rule in BAV_DERIVED_RULES:
        indication = indications[rule.key]
        target_rasi = rasi_from_planet(NATAL_RASI_MAP, rule.karaka, rule.house)
        assert indication.rasi == target_rasi
        assert indication.bindus == bav[rule.karaka][target_rasi]


def test_maternal_rule_uses_mercury_not_moon():
    """The Moon-BAV-4th formulation is deliberately replaced: Budhan is
    matula-karaka, and the Moon variant conflates the mother with her siblings."""
    maternal = next(r for r in BAV_DERIVED_RULES if r.key == "maternal")
    assert maternal.karaka == "MERCURY"
    assert "MOON" not in {r.karaka for r in BAV_DERIVED_RULES}


def test_no_rule_emits_a_headcount():
    """The whole point: a bindu never becomes a number of people. The dataclass
    carries no count field, and bindus are bounded by the 0-8 scale."""
    assert not hasattr(BavIndication, "child_count")
    assert set(BavIndication.__dataclass_fields__) == {
        "key", "karaka", "house", "domain", "rasi", "bindus", "band",
    }


# ── Disclosure ──────────────────────────────────────────────────────────────

def _indication(key: str, band: str, domain: str) -> BavIndication:
    return BavIndication(
        key=key, karaka="X", house=1, domain=domain,
        rasi=1, bindus=7 if band == BAND_STRONG else 1, band=band,
    )


def test_nothing_is_disclosed_when_the_area_is_not_age_relevant():
    indications = {"progeny": _indication("progeny", BAND_STRONG, "CHILDREN")}
    assert disclosable_indications(indications, "CHILDREN", age_relevant=False) == []


def test_neutral_band_never_surfaces():
    indications = {"siblings": _indication("siblings", BAND_NEUTRAL, "FAMILY_HARMONY")}
    assert disclosable_indications(indications, "FAMILY_HARMONY", age_relevant=True) == []


def test_progeny_discloses_the_supportive_band():
    indications = {"progeny": _indication("progeny", BAND_STRONG, "CHILDREN")}
    disclosed = disclosable_indications(indications, "CHILDREN", age_relevant=True)
    assert [d.key for d in disclosed] == ["progeny"]


def test_progeny_withholds_the_thin_band():
    """Asymmetric by design. A discouraging fertility reading has exactly one
    home in this product — the child_timing propensity card, which carries
    DISCLAIMER_FERTILITY and a 21-50 band — and does not get a second one as an
    unlabelled chip on a life-area card."""
    indications = {"progeny": _indication("progeny", BAND_THIN, "CHILDREN")}
    assert disclosable_indications(indications, "CHILDREN", age_relevant=True) == []


def test_family_rules_disclose_both_bands():
    indications = {
        "siblings": _indication("siblings", BAND_THIN, "FAMILY_HARMONY"),
        "paternal": _indication("paternal", BAND_STRONG, "FAMILY_HARMONY"),
    }
    disclosed = disclosable_indications(indications, "FAMILY_HARMONY", age_relevant=True)
    assert {d.key for d in disclosed} == {"siblings", "paternal"}


def test_an_area_never_sees_another_areas_indication():
    indications = {
        "progeny": _indication("progeny", BAND_STRONG, "CHILDREN"),
        "siblings": _indication("siblings", BAND_STRONG, "FAMILY_HARMONY"),
    }
    assert [d.key for d in disclosable_indications(indications, "CHILDREN", age_relevant=True)] == ["progeny"]
    assert [d.key for d in disclosable_indications(indications, "FAMILY_HARMONY", age_relevant=True)] == ["siblings"]


def test_no_indication_is_routed_to_education():
    """EDUCATION borrows the CHILDREN karaka chain. Nothing may key off that."""
    assert "EDUCATION" not in {rule.domain for rule in BAV_DERIVED_RULES}


def test_factor_codes_are_stable():
    assert factor_code(_indication("progeny", BAND_STRONG, "CHILDREN")) == "progeny_bav_strong"
    assert factor_code(_indication("paternal", BAND_THIN, "FAMILY_HARMONY")) == "paternal_bav_thin"


# ── Regression: the age band belongs to the area, not the borrowed chain ────

def test_area_age_band_overrides_the_borrowed_chains_band():
    """A 10-year-old's Education card is phase-relevant, so it is not skipped.
    Before the fix it borrowed the CHILDREN chain (18-52) and came back
    NOT_APPLICABLE_FOR_AGE with a "too_young" chip on a child's education
    reading, pinned at score 30."""
    from app.services.life_areas_service import _AREA_AGE_BAND, _karaka_chain_score

    kwargs = dict(
        area_key="CHILDREN",  # the chain EDUCATION borrows
        lagna_rasi=1,
        moon_rasi=4,
        planet_scores={},
        planet_rasis=NATAL_RASI_MAP,
        current_mahadasha_lord="JUPITER",
        current_antardasha_lord="SATURN",
        transit_planet_rasis=NATAL_RASI_MAP,
        native_age=10,
    )

    borrowed = _karaka_chain_score(**kwargs)
    assert borrowed["karaka_status"] == "NOT_APPLICABLE_FOR_AGE"
    assert "too_young" in borrowed["blocking_factors"]

    corrected = _karaka_chain_score(**kwargs, age_band=_AREA_AGE_BAND["EDUCATION"])
    assert corrected["karaka_status"] != "NOT_APPLICABLE_FOR_AGE"
    assert "too_young" not in corrected["blocking_factors"]


def test_children_area_keeps_its_own_band():
    """The fix must not open the gate it exists to keep shut: CHILDREN is absent
    from _AREA_AGE_BAND, so it still falls back to the chain's 18-52."""
    from app.services.life_areas_service import _AREA_AGE_BAND, _karaka_chain_score

    assert "CHILDREN" not in _AREA_AGE_BAND
    for age in (10, 80):
        result = _karaka_chain_score(
            area_key="CHILDREN",
            lagna_rasi=1,
            moon_rasi=4,
            planet_scores={},
            planet_rasis=NATAL_RASI_MAP,
            current_mahadasha_lord="JUPITER",
            current_antardasha_lord="SATURN",
            transit_planet_rasis=NATAL_RASI_MAP,
            native_age=age,
            age_band=_AREA_AGE_BAND.get("CHILDREN"),
        )
        assert result["karaka_status"] == "NOT_APPLICABLE_FOR_AGE"
