"""Kalaprakasika Ch. XXI ("To Lay Up Treasure") — provenance and value guards.

Two kinds of assertion, and the second kind is the point.

**Value guards** pin the extracted constants to the passages on pp.109-113 so a
later edit cannot quietly change what the text says.

**Negative guards** pin the things the chapter turned out *not* to say. Four
plausible-sounding rules would have been easy to add in good faith while
"completing the table", and every one of them is denied by the primary text:

* that the 14-star land list also governs **buying** land (it sits under "To
  take possession of land"; buying gets a weekday rule and no stars at all);
* that one "cattle" star list serves buying and selling alike (p.112 says six
  stars are good "only for buying cattle; not for selling");
* that the chapter's best-star list is a closed set, so unlisted stars are
  forbidden (no closing clause exists — they are unlisted, not banned);
* that gold's acquiring rules also govern parting with gold (p.112 forbids the
  giver two stars the chapter elsewhere calls best).

Worksheet: `docs/sources/kalaprakasika_ch21_treasure_rules.md`.
"""
from __future__ import annotations

import pytest

from app.calculations.muhurta_doctrine import (
    ProvenanceStatus,
    RuleType,
    VerificationOutcome,
)
from app.constants.astrology import NAKSHATRA_NAMES
from app.data import kalaprakasika_treasure_rules as kp21
from app.data.muhurta_activity_registry import ACTIVITY_RULES
from app.services.muhurta_service import (
    _ACTIVITY_LORDS,
    _SOURCED_ACTIVITY_LORDS,
    MUHURTA_ACTIVITIES,
)

pytestmark = pytest.mark.no_db


def _n(name: str) -> int:
    return NAKSHATRA_NAMES.index(name) + 1


# ── provenance integrity ────────────────────────────────────────────────────

def test_every_rule_source_is_self_consistent() -> None:
    for rule_id, source in kp21.RULE_SOURCES.items():
        assert source.rule_id == rule_id, f"{rule_id} keyed under a different rule_id"
        assert source.rule_id.startswith("KP_CH21_"), rule_id
        assert source.source_scope, rule_id
        assert source.rule_type is RuleType.TEXTUAL_RULE, rule_id
        assert source.provenance_status is ProvenanceStatus.CONFIRMED, rule_id
        assert source.authority.tradition == "KALAPRAKASIKA", rule_id
        assert source.authority.chapter == "XXI", rule_id
        assert source.authority.page is not None, rule_id
        assert source.authority.verse_or_passage, rule_id
        assert source.verified_on and source.verified_by, rule_id


def test_every_cited_page_is_inside_the_chapter() -> None:
    """Ch. XXI runs pp.109-113. A citation outside that range is a page number
    copied from the wrong chapter, which is exactly the error that would make a
    citation on screen worthless."""
    for rule_id, source in kp21.RULE_SOURCES.items():
        assert 109 <= int(source.authority.page) <= 113, f"{rule_id} cites p.{source.authority.page}"


def test_no_rule_claims_to_override_another() -> None:
    """`overrides` is populated only when the source text says a rule cancels
    another. Ch. XXI never does — praising a yoga as auspicious is not an
    override, and a favourable yoga must not rescue a prohibited tithi."""
    for rule_id, source in kp21.RULE_SOURCES.items():
        assert source.overrides == (), rule_id


# ── value guards: the chapter-level rules (pp.109-110) ──────────────────────

def test_chapter_nakshatra_list_is_the_eleven_named_on_p109() -> None:
    assert kp21.TREASURE_NAKSHATRA_BEST == {
        _n("MIRUGASEERIDAM"), _n("THIRUVATHIRAI"), _n("POOSAM"), _n("UTHIRAM"),
        _n("HASTHAM"), _n("ANUSHAM"), _n("UTHIRADAM"), _n("THIRUVONAM"),
        _n("AVITTAM"), _n("SADAYAM"), _n("UTHIRATTATHI"),
    }
    assert len(kp21.TREASURE_NAKSHATRA_BEST) == 11


def test_the_chapter_star_list_is_not_exhaustive() -> None:
    """"The following asterisms are the best" carries no closing "the remaining
    should be avoided". Treating it as closed would forbid sixteen stars the
    page never mentions."""
    assert kp21.TREASURE_NAKSHATRA_LIST_IS_EXHAUSTIVE is False
    for activity in ("TREASURE_STORE", "GOLD", "GEMS", "GRAIN"):
        assert ACTIVITY_RULES[activity].stars_exhaustive is False, activity


def test_chapter_tithi_rule_excludes_rikta_purnima_and_amavasya_only() -> None:
    assert kp21.TREASURE_TITHI_AVOID_IN_PAKSHA == {4, 9, 14}
    assert kp21.TREASURE_TITHI_AVOID_PURNIMA is True
    assert kp21.TREASURE_TITHI_AVOID_AMAVASYA is True
    # "all Thithis except ... are auspicious" — the remainder is positively
    # good, not merely unranked. That is what makes this a usable preference.
    assert kp21.TREASURE_TITHI_REMAINDER_IS_AUSPICIOUS is True


def test_chapter_weekday_rule_names_no_adverse_day() -> None:
    """p.110 names four favourable weekdays and no unfavourable one. Filling in
    Sun/Tue/Sat as "avoid" — as the naming and ear-boring chapters do state —
    would import a rule this chapter does not make."""
    assert kp21.TREASURE_VARA_GOOD == {"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"}
    assert kp21.TREASURE_VARA_AVOID == frozenset()


def test_chapter_lagna_rule_leaves_movable_signs_unstated() -> None:
    """Fixed best, common middling, movable *not mentioned*. Ch. XX's corn
    passage does say movable signs are to be left out — a different activity,
    and importing it here would be the same mistake as the marriage 8th-house
    vacancy."""
    assert kp21.TREASURE_LAGNA_BEST == {2, 5, 8, 11}
    assert kp21.TREASURE_LAGNA_MIDDLING == {3, 6, 9, 12}
    assert kp21.TREASURE_LAGNA_AVOID == frozenset()
    movable = {1, 4, 7, 10}
    assert not (movable & (kp21.TREASURE_LAGNA_BEST | kp21.TREASURE_LAGNA_MIDDLING))


# ── gold (KP_CH21_GOLD_NAKSHATRA_001) ───────────────────────────────────────

def test_gold_takes_the_chapter_list_by_the_texts_own_back_reference() -> None:
    """p.111 says, of gold, to "choose favourable asterisms from the list given
    above in this chapter". That sentence is the licence; without it the
    inheritance would be our inference."""
    assert kp21.GOLD_NAKSHATRA_BEST == kp21.TREASURE_NAKSHATRA_BEST
    record = kp21.RULE_SOURCES["KP_CH21_GOLD_NAKSHATRA_001"]
    assert record.outcome is VerificationOutcome.CONFIRMED_EXACT
    assert "from the list given above in this chapter" in record.authority.verse_or_passage


def test_parting_with_gold_is_a_separate_scope_that_contradicts_acquiring() -> None:
    """The intra-chapter tension, pinned so a future "one gold activity" merge
    has to confront it: two stars the chapter calls best for *storing* treasure
    are the stars it says ruin a man who *gives gold away*."""
    both = kp21.GOLD_PARTING_NAKSHATRA_PROHIBITED_FOR_GIVER & kp21.TREASURE_NAKSHATRA_BEST
    assert both == {_n("UTHIRAM"), _n("SADAYAM")}
    record = kp21.RULE_SOURCES["KP_CH21_GOLD_LOAN_NAKSHATRA_001"]
    assert record.source_scope == "GOLD_PARTING"
    assert record.source_scope != "GOLD"
    # And the giver-prohibited stars must never leak into the GOLD activity.
    gold_stars = {s for g in ACTIVITY_RULES["GOLD"].star_groups for s in g.stars}
    assert ACTIVITY_RULES["GOLD"].prohibited_stars == frozenset()
    assert both <= gold_stars, "the acquiring rule must keep its own best stars"


# ── gems (KP_CH21_GEMS_NAKSHATRA_001) ───────────────────────────────────────

def test_gems_share_golds_sentence_but_stay_a_separate_activity() -> None:
    assert kp21.GEMS_NAKSHATRA_BEST == kp21.TREASURE_NAKSHATRA_BEST
    gold = kp21.RULE_SOURCES["KP_CH21_GOLD_NAKSHATRA_001"]
    gems = kp21.RULE_SOURCES["KP_CH21_GEMS_NAKSHATRA_001"]
    assert gold.authority.verse_or_passage == gems.authority.verse_or_passage
    assert gold.activity != gems.activity
    assert "GOLD" in ACTIVITY_RULES and "GEMS" in ACTIVITY_RULES


# ── grain (KP_CH21_GRAIN_NAKSHATRA_001) ─────────────────────────────────────

def test_grain_provenance_is_weaker_than_gold_and_says_so() -> None:
    """Gold and gems are pointed back at the chapter list by name; grain never
    is. Recording grain as CONFIRMED_EXACT would overstate it, and the registry
    flag is what makes the engine's copy hedge."""
    record = kp21.RULE_SOURCES["KP_CH21_GRAIN_NAKSHATRA_001"]
    assert record.outcome is VerificationOutcome.PARTIAL
    assert kp21.RULE_SOURCES["KP_CH21_GOLD_NAKSHATRA_001"].outcome is VerificationOutcome.CONFIRMED_EXACT
    assert ACTIVITY_RULES["GRAIN"].stars_inherited_by_chapter_scope is True
    assert ACTIVITY_RULES["GOLD"].stars_inherited_by_chapter_scope is False
    assert "Ch. XX" in (record.notes or ""), "the real grain chapter must stay named as unread"


# ── land (KP_CH21_LAND_NAKSHATRA_001 / KP_CH21_LAND_VARA_001) ───────────────

def test_land_possession_list_is_the_fourteen_named_on_p112() -> None:
    assert kp21.LAND_POSSESSION_NAKSHATRA_BEST == {
        _n("ASWINI"), _n("ROHINI"), _n("MIRUGASEERIDAM"), _n("PUNARPOOSAM"),
        _n("POOSAM"), _n("UTHIRAM"), _n("HASTHAM"), _n("SWATHI"), _n("ANUSHAM"),
        _n("UTHIRADAM"), _n("THIRUVONAM"), _n("AVITTAM"), _n("SADAYAM"),
        _n("UTHIRATTATHI"),
    }
    assert len(kp21.LAND_POSSESSION_NAKSHATRA_BEST) == 14


def test_land_is_not_a_sub_case_of_treasure() -> None:
    """A tempting simplification: reuse the treasure star list for land. The
    two lists genuinely differ — land adds four stars and drops Ardra."""
    assert kp21.LAND_POSSESSION_NAKSHATRA_BEST != kp21.TREASURE_NAKSHATRA_BEST
    assert _n("THIRUVATHIRAI") in kp21.TREASURE_NAKSHATRA_BEST
    assert _n("THIRUVATHIRAI") not in kp21.LAND_POSSESSION_NAKSHATRA_BEST


def test_buying_land_gets_no_star_list_because_the_chapter_gives_none() -> None:
    """THE negative guard for land. The 14-star list is printed under "To take
    possession of land"; the only rule the chapter gives for *buying* land is a
    weekday one. Promoting the stars into the purchase scope would invent
    doctrine, so LAND_PURCHASE deliberately has no star groups."""
    assert ACTIVITY_RULES["LAND_PURCHASE"].star_groups == ()
    assert ACTIVITY_RULES["LAND_PURCHASE"].tithi_best == frozenset()
    assert ACTIVITY_RULES["LAND_PURCHASE"].tithi_avoid == frozenset()
    assert ACTIVITY_RULES["LAND_PURCHASE"].vara_good  # the one thing it does have
    assert kp21.RULE_SOURCES["KP_CH21_LAND_NAKSHATRA_001"].source_scope == "LAND_POSSESSION"


def test_land_purchase_weekdays_differ_from_the_treasure_weekdays() -> None:
    """Same chapter, two weekday rules, and they are not the same four days.
    Harmonising them would erase a real per-activity divergence."""
    assert kp21.LAND_PURCHASE_VARA_GOOD == {"MONDAY", "TUESDAY", "WEDNESDAY", "SATURDAY"}
    assert kp21.LAND_PURCHASE_VARA_GOOD != kp21.TREASURE_VARA_GOOD


def test_the_land_purchase_weekday_rule_carries_its_unmet_condition() -> None:
    """The passage requires the day-lord in the rising sign, which a day-level
    snapshot cannot check. A half-met rule that reads as met is worse than no
    rule, so the condition must survive into the registry."""
    assert kp21.LAND_PURCHASE_REQUIRES_DAY_LORD_IN_LAGNA is True
    entry = ACTIVITY_RULES["LAND_PURCHASE"]
    assert entry.vara_unmet_condition_en and entry.vara_unmet_condition_ta
    assert kp21.RULE_SOURCES["KP_CH21_LAND_VARA_001"].outcome is (
        VerificationOutcome.CONFIRMED_WITH_CONDITION
    )


def test_the_contested_land_rite_stays_out_of_the_general_land_list() -> None:
    """p.111's Cancer-lagna earth-taking rite names four stars at their 4th
    pada. They are not the possession list and must not be merged into it."""
    contested = {n for n, _pada in kp21.LAND_CONTESTED_RITE_NAKSHATRA_PADAS}
    assert contested == {_n("BHARANI"), _n("THIRUVATHIRAI"), _n("VISAKAM"), _n("HASTHAM")}
    assert all(pada == 4 for _n_, pada in kp21.LAND_CONTESTED_RITE_NAKSHATRA_PADAS)
    assert kp21.LAND_CONTESTED_RITE_LAGNA == 4  # Cancer
    assert contested != kp21.LAND_POSSESSION_NAKSHATRA_BEST
    assert kp21.RULE_SOURCES["KP_CH21_LAND_LAGNA_001"].source_scope == "LAND_POSSESSION_CONTESTED"


# ── cattle (KP_CH21_CATTLE_*) ───────────────────────────────────────────────

def test_cattle_buy_only_list_is_the_six_named_on_p112() -> None:
    assert kp21.CATTLE_BUY_ONLY_NAKSHATRA == {
        _n("KARTHIGAI"), _n("THIRUVATHIRAI"), _n("MAGAM"), _n("AYILYAM"),
        _n("SWATHI"), _n("ANUSHAM"),
    }
    assert kp21.CATTLE_SELL_UNDER_BUY_ONLY_STARS_IS_LOSS is True


def test_cow_buy_or_sell_list_is_the_nine_named_on_p113() -> None:
    assert kp21.COW_BUY_OR_SELL_NAKSHATRA == {
        _n("ASWINI"), _n("PUNARPOOSAM"), _n("POOSAM"), _n("HASTHAM"),
        _n("SWATHI"), _n("VISAKAM"), _n("KETTAI"), _n("AVITTAM"), _n("REVATHI"),
    }


def test_the_two_cattle_lists_are_genuinely_different_and_stay_apart() -> None:
    """THE negative guard for cattle. One list is buy-only, the other explicitly
    bidirectional; they overlap on exactly one star and neither contains the
    other. Merging them into one set would erase which page a day's credit came
    from — and would silently make six buy-only stars good for selling."""
    overlap = kp21.CATTLE_BUY_ONLY_NAKSHATRA & kp21.COW_BUY_OR_SELL_NAKSHATRA
    assert overlap == {_n("SWATHI")}
    assert not kp21.CATTLE_BUY_ONLY_NAKSHATRA <= kp21.COW_BUY_OR_SELL_NAKSHATRA
    assert not kp21.COW_BUY_OR_SELL_NAKSHATRA <= kp21.CATTLE_BUY_ONLY_NAKSHATRA

    groups = ACTIVITY_RULES["CATTLE_PURCHASE"].star_groups
    assert len(groups) == 2, "the two lists must stay separately attributable"
    assert {g.rule_id for g in groups} == {
        "KP_CH21_CATTLE_NAKSHATRA_001", "KP_CH21_CATTLE_NAKSHATRA_002",
    }


def test_cattle_is_the_only_activity_with_a_sourced_dasha_lord() -> None:
    """p.113's footnote ("Jupiter governs the sheep, the cow and all those
    animals that are useful to man") is the chapter's only activity-lord
    attribution. Gold, gems, grain and land get no lord entry rather than a
    plausible one — an unsourced judgement behind a citation-bearing result is
    the failure this whole module guards against."""
    assert kp21.CATTLE_ACTIVITY_LORD == "JUPITER"
    assert _ACTIVITY_LORDS["CATTLE_PURCHASE"] == {"JUPITER"}
    assert _SOURCED_ACTIVITY_LORDS == frozenset({"CATTLE_PURCHASE"})
    for activity in ("GOLD", "GEMS", "GRAIN", "LAND_POSSESSION", "LAND_PURCHASE", "TREASURE_STORE"):
        assert activity not in _ACTIVITY_LORDS, f"{activity} grew an unsourced dasha lord"


# ── the nakshatra class table (pp.112-113) ──────────────────────────────────

def test_the_seven_nakshatra_classes_partition_all_twenty_seven_stars() -> None:
    """Checked rather than assumed. The clean partition is itself evidence the
    transcription of this passage is sound — and it means an OCR "correction"
    that drops or duplicates a star fails here instead of silently reclassifying
    one and changing the pledge prohibition."""
    entries = [n for group in kp21.NAKSHATRA_CLASSES.values() for n in group]
    assert len(entries) == 27, "the seven classes no longer hold 27 entries"
    assert sorted(entries) == list(range(1, 28))
    assert len(kp21.NAKSHATRA_CLASSES) == 7


def test_the_pledge_prohibition_is_exactly_three_of_those_classes() -> None:
    assert kp21.PLEDGE_NAKSHATRA_PROHIBITED == (
        kp21.NAKSHATRA_CLASS_SADHARANA
        | kp21.NAKSHATRA_CLASS_VAJRA
        | kp21.NAKSHATRA_CLASS_THEEKSHANA
    )
    assert len(kp21.PLEDGE_NAKSHATRA_PROHIBITED) == 11


# ── yogas ───────────────────────────────────────────────────────────────────

def test_every_yoga_cites_a_page_inside_the_chapter_and_names_its_activities() -> None:
    assert len(kp21.TREASURE_YOGAS) == 12
    for yoga in kp21.TREASURE_YOGAS:
        assert 109 <= yoga.page <= 113, yoga.name
        assert yoga.applies_to, yoga.name
        for activity in yoga.applies_to:
            assert activity in MUHURTA_ACTIVITIES, f"{yoga.name} names unknown activity {activity}"


def test_the_silver_yogas_editorially_inferred_lagna_is_flagged_as_the_editors() -> None:
    """The translator supplies "Aquarius" in a footnote as *his* inference; the
    rule itself states no rising sign. Recording it as stated doctrine would
    promote an editor's guess to primary text."""
    record = kp21.RULE_SOURCES["KP_CH21_SILVER_YOGA_001"]
    assert record.outcome is VerificationOutcome.CONFIRMED_WITH_CONDITION
    assert "translator" in (record.interpretation or "").lower()
    assert "Aquarius" not in record.authority.verse_or_passage.split("Jupiter aspecting")[0]


# ── activities are reachable, and separately ────────────────────────────────

def test_every_chapter_xxi_activity_is_selectable_through_the_picker() -> None:
    for activity in (
        "TREASURE_STORE", "GOLD", "GEMS", "GRAIN",
        "LAND_POSSESSION", "LAND_PURCHASE", "CATTLE_PURCHASE",
    ):
        assert activity in MUHURTA_ACTIVITIES, f"{activity} is sourced but unreachable"
        assert activity in ACTIVITY_RULES, activity
