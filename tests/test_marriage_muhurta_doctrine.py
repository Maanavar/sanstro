"""Kalaprakasika Ch. XIII-XIV marriage doctrine — provenance and value guards.

Two kinds of assertion live here, and the second kind is the point.

**Value guards** pin the extracted constants to the passages on pp. 68-87 so a
later edit cannot quietly change what the text says.

**Negative guards** pin the things the chapter turned out *not* to say. Three
plausible-sounding marriage rules were carried into the spec by secondary
sources and were disproved by the primary text: the Magha-1/Mula-1/Revati-4
pada exclusions (absent), the blanket 8th-house vacancy (contradicted — the
chapter says Saturn/Sun/Mars there are *good*), and the "fixed lagna preferred"
claim (contradicted — the three best signs are two dual and one movable).
Each is the kind of rule someone re-adds in good faith while "filling a gap."
The tests below make that re-addition fail loudly instead of silently shipping
a rule the cited source denies.

Sources: `docs/MARRIAGE_EXTRACTION_WORKSHEET_KALAPRAKASIKA_CH14_2026-08-14.yaml`.
"""
from __future__ import annotations

import pytest

from app.calculations.muhurta_doctrine import (
    ProvenanceStatus,
    RuleType,
    VerificationOutcome,
)
from app.constants.astrology import NAKSHATRA_NAMES
from app.data import marriage_muhurta_rules as mmr

pytestmark = pytest.mark.no_db


# ── provenance integrity ────────────────────────────────────────────────────

def test_every_rule_source_is_self_consistent() -> None:
    for rule_id, source in mmr.RULE_SOURCES.items():
        assert source.rule_id == rule_id, f"{rule_id} keyed under a different rule_id"
        assert source.activity.startswith("MARRIAGE"), rule_id
        assert source.source_scope, rule_id
        # A textual claim must cite a page and a passage; a non-textual rule must
        # not pretend to one — but it may still rest on declared practice rather
        # than pure engine arithmetic, and if it does it must say so and explain
        # itself (2026-08-28 ruling, FCR-10c: MARRIAGE_AMAVASAI__TRADITION is the
        # first such row — see `test_every_emitted_rule_id_resolves_and_declares_
        # what_it_rests_on` in test_muhurta_engine.py for the same invariant
        # applied engine-wide).
        if source.rule_type is RuleType.TEXTUAL_RULE:
            assert source.authority.tradition == "KALAPRAKASIKA", rule_id
            assert source.authority.page is not None, rule_id
            assert source.authority.verse_or_passage, rule_id
            assert source.verified_on and source.verified_by, rule_id
        elif source.provenance_status is ProvenanceStatus.TRADITIONALLY_REPORTED:
            assert source.authority.page is None, rule_id
            assert source.authority.verse_or_passage is None, rule_id
            assert source.authority.tradition, (
                f"{rule_id} rests on practice and must name it"
            )
            assert source.notes, f"{rule_id} rests on practice and does not say why"
        else:
            assert source.provenance_status is ProvenanceStatus.ENGINE_CONCEPT, rule_id
            assert source.authority.verse_or_passage is None, rule_id


def test_primary_text_confirmed_eligibility_matches_the_worksheet_rollup() -> None:
    """The six rules the worksheet promoted, and only those, plus the extra
    records discovered mid-chapter that also carry an exact passage."""
    confirmed = {rid for rid, s in mmr.RULE_SOURCES.items() if s.is_primary_text_confirmed()}

    # Promoted by the worksheet's own rollup.
    for rule_id in (
        "MARRIAGE_NAKSHATRA_ALLOWED_SET",
        "MARRIAGE_LAGNA_SIGN_PREFERENCE",
        "MARRIAGE_SEVENTH_HOUSE_VACANCY",
        "MARRIAGE_TITHI_ALLOWED_SET",
        "MARRIAGE_GURU_SUKRA_ASTHANGATA__TEXTUAL",
        "MARRIAGE_ADVERSE_YOGAS",
    ):
        assert rule_id in confirmed, f"{rule_id} should be PRIMARY_TEXT_CONFIRMED"

    # Never promotable: absent, contradicted, partial, or engine-side.
    for rule_id in (
        "MARRIAGE_NAKSHATRA_PADA_EXCLUSIONS",           # NOT_FOUND
        "MARRIAGE_EIGHTH_HOUSE_VACANCY",                # CONTRADICTED
        "MARRIAGE_MUKHA_DIRECTION_OVERLAY",             # PARTIAL
        "MARRIAGE_GURU_SUKRA_ASTHANGATA__COMPUTATION_POLICY",  # ENGINE_POLICY
    ):
        assert rule_id not in confirmed, f"{rule_id} must not reach PRIMARY_TEXT_CONFIRMED"


def test_conditional_confirmation_is_not_ranked_below_unconditional() -> None:
    """CONFIRMED_WITH_CONDITION is fully-sourced provenance — "X allowed
    provided Y" is a classical conditional rule, not weak evidence."""
    combustion = mmr.RULE_SOURCES["MARRIAGE_GURU_SUKRA_ASTHANGATA__TEXTUAL"]
    assert combustion.outcome is VerificationOutcome.CONFIRMED_WITH_CONDITION
    assert combustion.is_primary_text_confirmed()


def test_snaana_is_scoped_apart_from_the_marriage_lagna() -> None:
    """The 8th-vacancy rule is real but belongs to the pre-marriage bath rite.
    If its scope ever collapses into plain MARRIAGE, the contradiction that
    record 5 resolved comes straight back."""
    snaana = mmr.RULE_SOURCES["MARRIAGE_SNAANA_KARMA"]
    assert snaana.source_scope == "MARRIAGE_SNAANA"
    assert snaana.source_scope != "MARRIAGE"
    assert mmr.MARRIAGE_SNAANA_EIGHTH_HOUSE_MUST_BE_EMPTY is True


# ── value guards ────────────────────────────────────────────────────────────

def test_marriage_nakshatra_list_is_the_eleven_named_stars() -> None:
    names = {NAKSHATRA_NAMES[n - 1] for n in mmr.MARRIAGE_NAKSHATRA_ALLOWED}
    assert names == {
        "ROHINI", "MIRUGASEERIDAM", "MAGAM", "UTHIRAM", "HASTHAM", "SWATHI",
        "ANUSHAM", "MOOLAM", "UTHIRADAM", "UTHIRATTATHI", "REVATHI",
    }
    assert len(mmr.MARRIAGE_NAKSHATRA_ALLOWED) == 11


def test_magha_and_mula_are_included_despite_ugra_and_tikshna_nature() -> None:
    """The activity table overrides the generic nature classification — this
    is the case that proves it. A naive "Ugra/Tikshna = reject" rule would
    wrongly drop both."""
    magam = NAKSHATRA_NAMES.index("MAGAM") + 1      # Ugra/fierce
    moolam = NAKSHATRA_NAMES.index("MOOLAM") + 1    # Tikshna/sharp
    assert magam in mmr.MARRIAGE_NAKSHATRA_ALLOWED
    assert moolam in mmr.MARRIAGE_NAKSHATRA_ALLOWED


def test_lagna_best_avoid_middle_partition_the_zodiac() -> None:
    assert mmr.MARRIAGE_LAGNA_BEST == {3, 6, 7}          # Gemini, Virgo, Libra
    assert mmr.MARRIAGE_LAGNA_AVOID == {1, 8, 10, 12}    # Aries, Scorpio, Capricorn, Pisces
    assert mmr.MARRIAGE_LAGNA_MIDDLE == {2, 4, 5, 9, 11}
    assert not (mmr.MARRIAGE_LAGNA_BEST & mmr.MARRIAGE_LAGNA_AVOID)
    assert not (mmr.MARRIAGE_LAGNA_BEST & mmr.MARRIAGE_LAGNA_MIDDLE)
    assert not (mmr.MARRIAGE_LAGNA_AVOID & mmr.MARRIAGE_LAGNA_MIDDLE)
    # Every sign is classified — "the other signs exercise middling influence"
    # means no sign may fall through unranked.
    union = mmr.MARRIAGE_LAGNA_BEST | mmr.MARRIAGE_LAGNA_AVOID | mmr.MARRIAGE_LAGNA_MIDDLE
    assert union == frozenset(range(1, 13))


def test_marriage_tithi_best_set_is_the_seven_named() -> None:
    assert mmr.MARRIAGE_TITHI_BEST == {2, 3, 5, 7, 10, 11, 13}


def test_marriage_tithi_list_differs_from_the_ear_boring_list() -> None:
    """Ch. IV's ear-boring list is a similar-looking 9-tithi set. Shashthi (6)
    is 'best' there and only 'middling' here — the two must never be merged by
    pattern-matching the Tamil ordinal names."""
    ear_boring = {2, 3, 5, 6, 7, 10, 11, 12, 13}
    assert mmr.MARRIAGE_TITHI_BEST != ear_boring
    assert 6 not in mmr.MARRIAGE_TITHI_BEST
    assert 6 in mmr.MARRIAGE_TITHI_MIDDLING_BOTH_PAKSHA


def test_combustion_buffers_are_asymmetric_between_venus_and_jupiter() -> None:
    assert mmr.MARRIAGE_VENUS_POST_REAPPEARANCE_AVOID_DAYS == 7
    assert mmr.MARRIAGE_JUPITER_POST_REAPPEARANCE_AVOID_DAYS == 8
    assert mmr.MARRIAGE_JUPITER_PRE_COMBUSTION_AVOID_DAYS == 15
    # The text says only "just prior" for Venus — no day count. Inventing one
    # would be a fabricated number wearing a citation.
    assert mmr.MARRIAGE_VENUS_PRE_COMBUSTION_AVOID_DAYS is None
    # "Both combust = irremediable" was not located in this passage.
    assert mmr.MARRIAGE_BOTH_COMBUST_IRREMEDIABLE is None


def test_ten_favorable_yogas_are_named_and_distinct() -> None:
    names = [y.name for y in mmr.MARRIAGE_FAVORABLE_YOGAS]
    assert len(names) == 10
    assert len(set(names)) == 10
    assert set(names) == {
        "MAHENDRA", "VISHNU_PRIYA", "ARDHA_NARI", "SREEMATHI", "SAMUDRA",
        "MAHAVISHNU", "PUSHYA", "STHAVARA", "JAYA", "VIJAYA",
    }
    assert all(y.definition for y in mmr.MARRIAGE_FAVORABLE_YOGAS)


def test_jupiter_gochara_adverse_houses_from_the_moon() -> None:
    assert mmr.MARRIAGE_JUPITER_ADVERSE_HOUSES_FROM_MOON == {3, 4, 6, 8, 10, 12}


# ── negative guards: what the chapter does NOT say ─────────────────────────

def test_pada_exclusions_stay_empty() -> None:
    """Magha-1 / Mula-1 / Revati-4 are NOT in Ch. XIV. The pada-sensitive rule
    that does exist (p.69) is a bride-star compatibility check, and the
    Magha/Mula pada danger is gandanta from the *natal* chapter. Populating
    this set from a secondary source would contradict the cited page."""
    assert mmr.MARRIAGE_NAKSHATRA_PADA_EXCLUSIONS == frozenset()
    assert mmr.RULE_SOURCES["MARRIAGE_NAKSHATRA_PADA_EXCLUSIONS"].outcome is (
        VerificationOutcome.NOT_FOUND
    )


def test_eighth_house_is_not_a_marriage_vacancy_rule() -> None:
    """Ch. XIV says Saturn/Sun/Mars in the 8th cause GOOD — the opposite of a
    vacancy requirement. The vacancy rule is genuine for naming (Ch. III) and
    ear-boring (Ch. IV); importing it into marriage is the exact mistake this
    guards."""
    assert mmr.RULE_SOURCES["MARRIAGE_EIGHTH_HOUSE_VACANCY"].outcome is (
        VerificationOutcome.CONTRADICTED
    )
    assert mmr.MARRIAGE_EIGHTH_HOUSE_GOOD_GRAHAS == {"SATURN", "SUN", "MARS"}
    assert not hasattr(mmr, "MARRIAGE_EIGHTH_HOUSE_MUST_BE_EMPTY"), (
        "an 8th-house vacancy flag for MARRIAGE contradicts p.83"
    )


def test_marriage_does_not_prefer_fixed_lagnas() -> None:
    """"Sthira lagna preferred for marriage" was an assumption, and the text
    disproves it: Gemini and Virgo are dual, Libra is movable. Fixed signs
    (Taurus, Leo, Scorpio, Aquarius) are middling or avoided."""
    fixed_signs = {2, 5, 8, 11}  # Taurus, Leo, Scorpio, Aquarius
    assert not (mmr.MARRIAGE_LAGNA_BEST & fixed_signs)
    assert 8 in mmr.MARRIAGE_LAGNA_AVOID  # Scorpio is avoided outright


def test_no_marriage_rule_claims_to_override_another() -> None:
    """The text praises each yoga as independently auspicious but never says
    one cancels a dosha or supersedes a prohibition. A favourable yoga must
    not be able to rescue a prohibited 7th-house occupancy — that would need
    textual authority the chapter does not give. Nothing in this chapter
    populated `overrides`, and nothing should without a citation."""
    for rule_id, source in mmr.RULE_SOURCES.items():
        assert source.overrides == (), (
            f"{rule_id} claims to override another rule — the chapter grants no such authority"
        )
    assert mmr.MARRIAGE_SEVENTH_HOUSE_MUST_BE_EMPTY is True


def test_lunar_months_are_not_mislabelled_as_tamil_solar_months() -> None:
    """p.85 names lunar months. Treating them as Tamil solar months would
    shift every gate by roughly a month."""
    assert mmr.MARRIAGE_INAUSPICIOUS_LUNAR_MONTHS == {
        "ASHADA", "BHADRAPADA", "MARGASIRA", "MAGHA",
    }
    tamil_solar = {"CHITHIRAI", "VAIKASI", "AANI", "AADI", "AAVANI", "PURATTASI",
                   "AIPPASI", "KARTHIGAI", "MARGAZHI", "THAI", "MAASI", "PANGUNI"}
    assert not (mmr.MARRIAGE_INAUSPICIOUS_LUNAR_MONTHS & tamil_solar)
