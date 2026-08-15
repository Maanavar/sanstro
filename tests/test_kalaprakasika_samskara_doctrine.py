"""Kalaprakasika Ch. III & IV — Namakarana, Annaprasana, Karnavedha.

**The central assertion of this module is that the three rites disagree.** They
share a chapter neighbourhood and a life stage, which makes "one baby samskara
activity" the obvious simplification — and the primary text refuses it on nine
of ten rule dimensions. Ardra is *good* for naming and *expressly forbidden* for
Annaprasana. Dwadashi is *prohibited* for naming and *favourable* for
ear-boring. The fixed signs are *best* for naming and three of the four are
*avoided* for ear-boring. The vacant house is the 8th for two rites and the
10th for the third.

The tests below pin each of those disagreements, so a later merge fails loudly
rather than silently picking one rite's doctrine for all three.

Worksheet: `docs/sources/kalaprakasika_samskara_rules.md`.
"""
from __future__ import annotations

import pytest

from app.calculations.muhurta_doctrine import (
    ProvenanceStatus,
    RuleType,
    VerificationOutcome,
)
from app.constants.astrology import NAKSHATRA_NAMES
from app.data import kalaprakasika_adornment_rules as adornment
from app.data import kalaprakasika_samskara_rules as kps
from app.data import marriage_muhurta_rules as marriage
from app.data.muhurta_activity_registry import ACTIVITY_RULES
from app.services.muhurta_service import MUHURTA_ACTIVITIES, normalize_activity

pytestmark = pytest.mark.no_db

_SAMSKARAS = ("NAMING_CEREMONY", "ANNAPRASANA", "EAR_BORING")


def _n(name: str) -> int:
    return NAKSHATRA_NAMES.index(name) + 1


# ── provenance integrity ────────────────────────────────────────────────────

def test_every_rule_source_is_self_consistent() -> None:
    for rule_id, source in kps.RULE_SOURCES.items():
        assert source.rule_id == rule_id, f"{rule_id} keyed under a different rule_id"
        assert source.rule_type is RuleType.TEXTUAL_RULE, rule_id
        assert source.provenance_status is ProvenanceStatus.CONFIRMED, rule_id
        assert source.authority.tradition == "KALAPRAKASIKA", rule_id
        assert source.authority.chapter in {"III", "IV"}, rule_id
        assert source.authority.page is not None, rule_id
        assert source.authority.verse_or_passage, rule_id
        assert source.verified_on and source.verified_by, rule_id
        assert source.overrides == (), rule_id


def test_cited_pages_match_the_chapter_they_claim() -> None:
    """Ch. III runs pp.29-35 and Ch. IV pp.35-36. A rule filed under the wrong
    chapter is a citation that leads a reader to the wrong page."""
    for rule_id, source in kps.RULE_SOURCES.items():
        page = int(source.authority.page)
        if source.authority.chapter == "III":
            assert 29 <= page <= 35, f"{rule_id} claims Ch. III at p.{page}"
        else:
            assert 35 <= page <= 36, f"{rule_id} claims Ch. IV at p.{page}"


# ── value guards: Namakarana (Ch. III pp.30-31) ─────────────────────────────

def test_naming_nakshatra_list_is_the_fourteen_named_on_p30() -> None:
    assert kps.NAMING_NAKSHATRA_BEST == {
        _n("ASWINI"), _n("ROHINI"), _n("MIRUGASEERIDAM"), _n("THIRUVATHIRAI"),
        _n("PUNARPOOSAM"), _n("POOSAM"), _n("UTHIRAM"), _n("HASTHAM"),
        _n("SWATHI"), _n("ANUSHAM"), _n("THIRUVONAM"), _n("AVITTAM"),
        _n("SADAYAM"), _n("REVATHI"),
    }
    assert len(kps.NAMING_NAKSHATRA_BEST) == 14


def test_naming_tithi_bans_six_numbers_in_both_pakshas_plus_the_moons_ends() -> None:
    assert kps.NAMING_TITHI_AVOID_IN_PAKSHA == {4, 6, 8, 9, 12, 14}
    assert kps.NAMING_TITHI_AVOID_PURNIMA is True
    assert kps.NAMING_TITHI_AVOID_AMAVASYA is True


def test_naming_weekday_rule_is_exhaustive_unlike_the_treasure_one() -> None:
    """"Other days should be avoided" closes this list. Ch. XXI names the same
    four good days and no adverse ones — the same four days, two different
    rules, and only one of them condemns the rest."""
    assert kps.NAMING_VARA_GOOD == {"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"}
    assert kps.NAMING_VARA_AVOID == {"SUNDAY", "TUESDAY", "SATURDAY"}
    assert kps.NAMING_VARA_GOOD | kps.NAMING_VARA_AVOID == {
        "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
    }


def test_naming_common_signs_are_conditional_and_never_credited_as_met() -> None:
    """Common signs are approved "when occupied by a benefic" — a condition a
    day snapshot cannot check. Scoring them as best would claim a placement
    nobody computed."""
    assert kps.NAMING_LAGNA_BEST == {2, 5, 8, 11}
    assert kps.NAMING_LAGNA_CONDITIONAL == {3, 6, 9, 12}
    entry = ACTIVITY_RULES["NAMING_CEREMONY"]
    assert entry.lagna_conditional == kps.NAMING_LAGNA_CONDITIONAL
    assert not (entry.lagna_best & entry.lagna_conditional)
    assert entry.lagna_conditional_en and entry.lagna_conditional_ta
    assert kps.RULE_SOURCES["KP_CH3_NAMING_LAGNA_001"].outcome is (
        VerificationOutcome.CONFIRMED_WITH_CONDITION
    )


# ── value guards: Annaprasana (Ch. III pp.33-35) ────────────────────────────

def test_annaprasana_nakshatra_lists_are_the_sixteen_and_the_eight_on_p34() -> None:
    assert len(kps.ANNAPRASANA_NAKSHATRA_BEST) == 16
    assert kps.ANNAPRASANA_NAKSHATRA_PROHIBITED == {
        _n("THIRUVATHIRAI"), _n("KARTHIGAI"), _n("KETTAI"), _n("BHARANI"),
        _n("AYILYAM"), _n("POORAM"), _n("POORADAM"), _n("POORATTATHI"),
    }
    assert len(kps.ANNAPRASANA_NAKSHATRA_PROHIBITED) == 8
    # The two lists cannot overlap, and together they leave three stars unnamed.
    assert not (kps.ANNAPRASANA_NAKSHATRA_BEST & kps.ANNAPRASANA_NAKSHATRA_PROHIBITED)
    named = kps.ANNAPRASANA_NAKSHATRA_BEST | kps.ANNAPRASANA_NAKSHATRA_PROHIBITED
    assert len(named) == 24, "the chapter names 24 of 27 stars; the rest score neutral"


def test_annaprasana_is_the_only_samskara_with_forbidden_stars() -> None:
    """"One should not start any function of feeding on those days" is a
    prohibition with a stated consequence. Naming and ear-boring state nothing
    equivalent, and giving them an inferred forbidden set would be inventing
    doctrine from the shape of their neighbour."""
    assert ACTIVITY_RULES["ANNAPRASANA"].prohibited_stars_is_veto is True
    assert kps.NAMING_NAKSHATRA_PROHIBITED == frozenset()
    assert kps.EAR_BORING_NAKSHATRA_PROHIBITED == frozenset()
    for activity in ("NAMING_CEREMONY", "EAR_BORING"):
        assert ACTIVITY_RULES[activity].prohibited_stars == frozenset(), activity


def test_annaprasana_does_not_ban_purnima_or_amavasya_but_naming_does() -> None:
    """Two rites, one chapter, two tithi rules. Copying naming's bans across
    would forbid two days a month the feeding passage never mentions."""
    assert kps.ANNAPRASANA_TITHI_AVOID_IN_PAKSHA == {4, 6, 8, 9, 14}
    assert kps.ANNAPRASANA_TITHI_AVOID_PURNIMA is False
    assert kps.ANNAPRASANA_TITHI_AVOID_AMAVASYA is False
    assert kps.NAMING_TITHI_AVOID_PURNIMA is True
    # The one number that separates the two exclusion sets.
    assert kps.NAMING_TITHI_AVOID_IN_PAKSHA - kps.ANNAPRASANA_TITHI_AVOID_IN_PAKSHA == {12}


def test_the_illegible_tara_rule_is_recorded_but_left_empty() -> None:
    """THE negative guard of this module. Four of the ten ordinals on p.34 are
    OCR noise. Reconstructing them would be inventing a tara list — so the rule
    is recorded as TRANSLATION_AMBIGUOUS and the constant stays empty."""
    assert kps.ANNAPRASANA_FAVOURABLE_TARA_COUNTS == frozenset()
    record = kps.RULE_SOURCES["KP_CH3_ANNAPRASANA_TARA_001"]
    assert record.outcome is VerificationOutcome.TRANSLATION_AMBIGUOUS
    assert not record.is_primary_text_confirmed(), (
        "an illegible passage must not qualify as primary-text confirmed"
    )
    assert "NOT IMPLEMENTED" in (record.notes or "")


def test_the_combustion_waiver_is_recorded_so_no_global_veto_can_cover_it() -> None:
    """The text's own proof that combustion is per-activity: marriage enforces
    it with day buffers, this rite waives it outright."""
    assert kps.ANNAPRASANA_COMBUSTION_WAIVED is True
    assert marriage.MARRIAGE_JUPITER_PRE_COMBUSTION_AVOID_DAYS == 15
    record = kps.RULE_SOURCES["KP_CH3_ANNAPRASANA_COMBUSTION_WAIVER_001"]
    assert record.outcome is VerificationOutcome.CONFIRMED_EXACT


def test_the_milk_feeding_karana_rule_is_not_promoted_to_annaprasana() -> None:
    """A misattribution this extraction corrected: the existing engine-inputs
    doc credits *Annaprasana* with avoiding Sthira karana and Vishti. That
    sentence is from the milk-feeding rite on p.32; the rice-feeding passage
    states no karana rule at all. Same class of error as the marriage
    8th-vacancy import."""
    record = kps.RULE_SOURCES["KP_CH3_MILK_FEEDING_KARANA_001"]
    assert record.source_scope == "MILK_FEEDING"
    assert record.activity == "MILK_FEEDING"
    assert int(record.authority.page) == 32
    assert "misattribution" in (record.notes or "").lower()
    # And nothing under the ANNAPRASANA scope claims a karana rule.
    annaprasana = [s for s in kps.RULE_SOURCES.values() if s.source_scope == "ANNAPRASANA"]
    assert not [s for s in annaprasana if s.factor == "KARANA"]


# ── value guards: Karnavedha (Ch. IV pp.35-36) ──────────────────────────────

def test_ear_boring_nakshatra_list_is_the_nine_named_on_p36() -> None:
    assert kps.EAR_BORING_NAKSHATRA_BEST == {
        _n("MIRUGASEERIDAM"), _n("THIRUVATHIRAI"), _n("PUNARPOOSAM"),
        _n("POOSAM"), _n("HASTHAM"), _n("CHITHIRAI"), _n("THIRUVONAM"),
        _n("AVITTAM"), _n("REVATHI"),
    }
    assert len(kps.EAR_BORING_NAKSHATRA_BEST) == 9


def test_only_two_chapters_close_their_tithi_list() -> None:
    """A closing clause makes a tithi off the list a genuine prohibition rather
    than an absence, so which chapters have one is load-bearing.

    Ear-boring (Ch. IV p.36, "Other Thithis are not to be considered") was the
    only one until Ch. XXIV p.117 was extracted ("The other Thithis should be
    avoided"). Every other sourced tithi rule leaves its remainder unranked or
    positively auspicious.

    This list is asserted exactly rather than by membership: a third activity
    acquiring `tithi_exhaustive` silently would turn unlisted tithis into
    prohibited ones across a whole chapter, which is precisely the change that
    must never pass unnoticed.
    """
    assert kps.EAR_BORING_TITHI_BEST_IN_PAKSHA == {2, 3, 5, 6, 7, 10, 11, 12, 13}
    assert kps.EAR_BORING_TITHI_LIST_IS_EXHAUSTIVE is True
    exhaustive = sorted(a for a, r in ACTIVITY_RULES.items() if r.tithi_exhaustive)
    assert exhaustive == ["EAR_BORING", "NEW_ORNAMENT"]


def test_the_new_ornament_tithi_rule_reverses_the_purnima_ban() -> None:
    """Ch. XXIV p.117 puts the Full-Moon among the best tithis for wearing a
    gold jewel, where Namakarana, tonsure, Upanayanam, Vidyarambham and Veda
    study all ban it outright.

    Pinned because it looks exactly like a transcription error and is not one:
    the same sentence closes the list, so the chapter had to consider what it
    was including. If someone "fixes" this to match its neighbours, the fix
    fails here.
    """
    entry = ACTIVITY_RULES["NEW_ORNAMENT"]
    assert adornment.NEW_ORNAMENT_TITHI_PURNIMA_IS_BEST is True
    assert entry.tithi_avoid_purnima is False
    for banned in ("NAMING_CEREMONY", "TONSURE", "UPANAYANAM", "VIDYARAMBHAM", "VEDA_STUDY"):
        assert ACTIVITY_RULES[banned].tithi_avoid_purnima is True, banned


def test_ear_boring_lagna_partitions_all_twelve_signs() -> None:
    best = kps.EAR_BORING_LAGNA_BEST
    middling = kps.EAR_BORING_LAGNA_MIDDLING
    avoid = kps.EAR_BORING_LAGNA_AVOID
    assert best == {2, 3, 4, 6, 7, 9, 12}
    assert middling == {1, 10}
    assert avoid == {5, 8, 11}
    assert best | middling | avoid == set(range(1, 13))
    assert len(best) + len(middling) + len(avoid) == 12, "the three tiers overlap"


# ── the disagreements that keep the three activities apart ──────────────────

def test_ardra_is_good_for_naming_and_forbidden_for_annaprasana() -> None:
    ardra = _n("THIRUVATHIRAI")
    assert ardra in kps.NAMING_NAKSHATRA_BEST
    assert ardra in kps.EAR_BORING_NAKSHATRA_BEST
    assert ardra in kps.ANNAPRASANA_NAKSHATRA_PROHIBITED
    assert ardra not in kps.ANNAPRASANA_NAKSHATRA_BEST


def test_dwadashi_is_banned_for_naming_and_favourable_for_ear_boring() -> None:
    assert 12 in kps.NAMING_TITHI_AVOID_IN_PAKSHA
    assert 12 not in kps.ANNAPRASANA_TITHI_AVOID_IN_PAKSHA
    assert 12 in kps.EAR_BORING_TITHI_BEST_IN_PAKSHA


def test_the_fixed_signs_are_best_for_naming_and_avoided_for_ear_boring() -> None:
    """The single clearest reason these two rites cannot share one activity:
    three of the four signs naming calls *best* are signs ear-boring says to
    avoid."""
    fixed = {2, 5, 8, 11}
    assert kps.NAMING_LAGNA_BEST == fixed
    assert kps.EAR_BORING_LAGNA_AVOID == fixed - {2}


def test_the_vacant_house_differs_between_the_rites() -> None:
    """Naming and ear-boring want the 8th empty; Annaprasana wants the 10th.
    "The Nth house must be empty" is not a generalisable samskara rule."""
    assert kps.NAMING_EIGHTH_HOUSE_MUST_BE_EMPTY is True
    assert kps.EAR_BORING_EIGHTH_HOUSE_MUST_BE_EMPTY is True
    assert kps.ANNAPRASANA_TENTH_HOUSE_MUST_BE_EMPTY is True
    assert not hasattr(kps, "ANNAPRASANA_EIGHTH_HOUSE_MUST_BE_EMPTY")


def test_no_two_samskaras_share_a_nakshatra_or_tithi_rule() -> None:
    """The structural guard against a future merge: every pair of the three
    differs on the star list, and each carries its own rule_ids."""
    stars = {
        activity: {s for g in ACTIVITY_RULES[activity].star_groups for s in g.stars}
        for activity in _SAMSKARAS
    }
    assert stars["NAMING_CEREMONY"] != stars["ANNAPRASANA"]
    assert stars["ANNAPRASANA"] != stars["EAR_BORING"]
    assert stars["NAMING_CEREMONY"] != stars["EAR_BORING"]

    rule_ids = [ACTIVITY_RULES[a].tithi_rule_id for a in _SAMSKARAS]
    assert len(set(rule_ids)) == 3, f"two samskaras cite the same tithi rule: {rule_ids}"


# ── reachability and the mobile key ─────────────────────────────────────────

def test_all_three_samskaras_are_selectable_and_distinct() -> None:
    for activity in _SAMSKARAS:
        assert activity in MUHURTA_ACTIVITIES, f"{activity} is sourced but unreachable"
        assert activity in ACTIVITY_RULES, activity


def test_the_mobile_baby_naming_key_routes_to_the_sourced_naming_activity() -> None:
    """It shipped on the mobile picker and never resolved: uppercased it became
    `BABY_NAMING`, which matched no backend activity, so every tap 422'd."""
    assert normalize_activity("baby_naming") == "NAMING_CEREMONY"
    assert normalize_activity("BABY_NAMING") == "NAMING_CEREMONY"
    assert normalize_activity("baby_naming") in MUHURTA_ACTIVITIES


def test_the_other_broken_mobile_keys_still_fail_rather_than_guessing() -> None:
    """`house`, `vehicle` and `business` had the same defect. Aliasing them
    would mean guessing which activity the astrologer meant — no chapter we have
    extracted rules on a house or a vehicle — so they stay unroutable."""
    for key in ("house", "vehicle", "business"):
        assert normalize_activity(key) not in MUHURTA_ACTIVITIES, key
