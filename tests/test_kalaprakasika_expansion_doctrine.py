"""Ch. V, VI, VII, VIII, XI, XVII, XX, XXIII and XXIV — the second extraction pass.

These guard the things that would silently rot: counts the page states, scope
boundaries between neighbouring rites, readings that contradict the rest of the
book and therefore look like typos, and the four engine shapes this pass added.

`pytestmark` keeps the module in the offline suite — nothing here touches a DB.
"""
from __future__ import annotations

import re
from dataclasses import replace
from datetime import date, timedelta

import pytest

from app.calculations.muhurta_engine import Subject, Verdict, resolve_rule_source, score_day
from app.calculations.panchangam import calculate_daily_panchangam
from app.constants.astrology import NAKSHATRA_NAMES
from app.data import kalaprakasika_adornment_rules as adornment
from app.data import kalaprakasika_harvest_rules as harvest
from app.data import kalaprakasika_learning_rules as learning
from app.data import kalaprakasika_lifecycle_rules as lifecycle
from app.data.muhurta_activity_registry import ACTIVITY_RULES
from app.services.muhurta_service import MUHURTA_ACTIVITIES

pytestmark = pytest.mark.no_db

# Chennai — a location, not a person.
LATITUDE, LONGITUDE, TIMEZONE = 13.0827, 80.2707, "Asia/Kolkata"
SWEEP_START = date(2026, 6, 1)
SWEEP_DAYS = 60

_NEW_ACTIVITIES = (
    "TONSURE", "UPANAYANAM", "SEEMANTHAM",
    "VIDYARAMBHAM", "EDUCATION_START", "VEDA_STUDY",
    "HARVEST", "HARVEST_INGATHERING", "GRAIN_EXPENDITURE",
    "NEW_CLOTHES", "NEW_ORNAMENT",
)


@pytest.fixture(scope="module")
def snapshots() -> list:
    return [
        calculate_daily_panchangam(SWEEP_START + timedelta(days=i), LATITUDE, LONGITUDE, TIMEZONE)
        for i in range(SWEEP_DAYS)
    ]


@pytest.fixture(scope="module")
def snapshot_factory(snapshots):
    """A real snapshot with named limbs overridden.

    Built from a genuine panchangam day rather than a hand-made stub so that
    every field the engine touches is internally consistent; only the limb under
    test is forced.
    """
    def _make(**overrides):
        return replace(snapshots[0], **overrides)

    return _make


def _n(name: str) -> int:
    return NAKSHATRA_NAMES.index(name) + 1


# ── the page's own arithmetic ───────────────────────────────────────────────

@pytest.mark.parametrize(
    ("stars", "expected"),
    [
        (lifecycle.TONSURE_NAKSHATRA_BEST, 9),
        (lifecycle.TONSURE_NAKSHATRA_MIDDLING, 6),
        (lifecycle.UPANAYANAM_NAKSHATRA_BEST, 16),
        (lifecycle.SEEMANTHAM_NAKSHATRA_BEST, 10),
        (learning.VIDYARAMBHAM_NAKSHATRA_BEST, 9),
        (learning.EDUCATION_NAKSHATRA_BEST, 10),
        (learning.EDUCATION_NAKSHATRA_MIDDLING, 6),
        (learning.VEDA_STUDY_NAKSHATRA_BEST, 11),
        (learning.VEDA_STUDY_NAKSHATRA_MIDDLING, 6),
        (harvest.HARVEST_NAKSHATRA_BEST, 14),
        (harvest.INGATHERING_NAKSHATRA_BEST, 17),
        (harvest.GRAIN_EXPENDITURE_NAKSHATRA_BEST, 12),
        (harvest.GRAIN_EXPENDITURE_NAKSHATRA_PROHIBITED, 9),
        (adornment.NEW_CLOTHES_NAKSHATRA_BEST, 14),
        (adornment.NEW_ORNAMENT_NAKSHATRA_BEST, 15),
    ],
)
def test_star_list_lengths_match_the_page(stars: frozenset[int], expected: int) -> None:
    assert len(stars) == expected


def test_tonsure_lists_account_for_exactly_the_remaining_twelve() -> None:
    """Ch. V p.38 does its own arithmetic — "The remaining twelve asterisms
    should be avoided" — and it has to hold, or a star was dropped in
    transcription. 9 favourable + 6 pretty good = 15, and 27 - 15 = 12."""
    named = lifecycle.TONSURE_NAKSHATRA_BEST | lifecycle.TONSURE_NAKSHATRA_MIDDLING
    assert not (lifecycle.TONSURE_NAKSHATRA_BEST & lifecycle.TONSURE_NAKSHATRA_MIDDLING)
    assert len(named) == 15
    assert len(set(range(1, 28)) - named) == 12


def test_ch8_and_ch11_agree_on_their_neutral_star_tier() -> None:
    """Ch. VIII p.53 and Ch. XI p.65 sit twelve printed pages apart and name the
    identical six-star neutral tier. That agreement is the cross-check on both
    transcriptions; if one drifts, this fails."""
    assert learning.EDUCATION_NAKSHATRA_MIDDLING == learning.VEDA_STUDY_NAKSHATRA_MIDDLING
    # And the Veda list is the education list plus Anuradha, exactly.
    assert learning.VEDA_STUDY_NAKSHATRA_BEST - learning.EDUCATION_NAKSHATRA_BEST == {
        _n("ANUSHAM")
    }


def test_the_three_learning_chapters_state_one_sign_doctrine() -> None:
    """Common best / movable middling / fixed rejected, three times over. The
    only sign rule in the book repeated verbatim across chapters — and the
    inverse of Namakarana, which calls the fixed signs best."""
    for activity in ("VIDYARAMBHAM", "EDUCATION_START", "VEDA_STUDY"):
        entry = ACTIVITY_RULES[activity]
        assert entry.lagna_best == {3, 6, 9, 12}, activity
        assert entry.lagna_middling == {1, 4, 7, 10}, activity
        assert entry.lagna_avoid == {2, 5, 8, 11}, activity
    assert ACTIVITY_RULES["NAMING_CEREMONY"].lagna_best == {2, 5, 8, 11}


def test_grain_expenditure_leaves_four_stars_unaccounted_and_says_so() -> None:
    """Ch. XX p.108's "remaining asterisms (Aslesha and Magha)" names two of the
    six stars its own two lists leave over. The gap is recorded, not patched —
    inventing the four missing names is the failure this module exists to stop.
    """
    best = harvest.GRAIN_EXPENDITURE_NAKSHATRA_BEST
    banned = harvest.GRAIN_EXPENDITURE_NAKSHATRA_PROHIBITED
    middling = harvest.GRAIN_EXPENDITURE_NAKSHATRA_MIDDLING
    assert not (best & banned)
    leftover = set(range(1, 28)) - best - banned
    assert len(leftover) == 6
    assert middling == {_n("AYILYAM"), _n("MAGAM")}
    assert harvest.GRAIN_EXPENDITURE_UNACCOUNTED_STARS == leftover - middling
    assert len(harvest.GRAIN_EXPENDITURE_UNACCOUNTED_STARS) == 4
    # Never claim the list is closed while four stars are unexplained.
    assert harvest.GRAIN_EXPENDITURE_NAKSHATRA_LIST_IS_EXHAUSTIVE is False


# ── scope boundaries between neighbouring rites ─────────────────────────────

def test_the_first_shaving_tara_ban_is_not_promoted_to_the_tonsure() -> None:
    """Ch. V p.40's janma/10th/19th ban sits inside the paragraph about the
    shaving that FOLLOWS the tonsure, counted in days after the ceremony. Wiring
    it to TONSURE would repeat the error the spec doc made in giving Annaprasana
    the milk-feeding rite's karana clause."""
    record = lifecycle.RULE_SOURCES["KP_CH5_FIRST_SHAVING_001"]
    assert record.source_scope == "FIRST_SHAVING"
    assert lifecycle.FIRST_SHAVING_JANMA_TARA_PROHIBITED == {1, 10, 19}
    assert not ACTIVITY_RULES["TONSURE"].janma_tara_prohibited
    assert "FIRST_SHAVING" not in MUHURTA_ACTIVITIES


def test_pumsavanam_is_recorded_but_not_exposed_as_an_activity() -> None:
    """Ch. XVII p.97 subordinates its own rules to Seemantham's when the two are
    blended, which is how they are almost always performed. The text makes this
    call, not us."""
    assert lifecycle.PUMSAVANAM_NAKSHATRA_BEST
    assert "PUMSAVANAM" not in MUHURTA_ACTIVITIES
    assert lifecycle.RULE_SOURCES["KP_CH17_PUMSAVANAM_001"].source_scope == "PUMSAVANAM"


def test_the_oordhwa_mukha_table_is_recorded_and_not_wired_to_marriage() -> None:
    """Ch. XX p.107 defines the class Ch. XIV p.79 rules on for marriage without
    defining. Tempting to wire — but the other two classes that sentence names
    are still undefined, so wiring one third would score some marriage days on a
    rule the rest cannot be judged by. Marriage is untouched in this pass."""
    assert len(harvest.NAKSHATRA_CLASS_OORDHWA_MUKHA) == 9
    record = lifecycle.RULE_SOURCES.get("KP_CH20_OORDHWA_MUKHA_001")
    assert record is None  # it lives in the harvest module, not lifecycle
    assert harvest.RULE_SOURCES["KP_CH20_OORDHWA_MUKHA_001"].source_scope == "MUHURTA_GENERAL"
    assert "MARRIAGE" not in ACTIVITY_RULES


# ── readings that contradict the rest of the book ───────────────────────────

def test_ingathering_calls_saturday_best_and_wednesday_neutral() -> None:
    """Ch. XX p.106 inverts the near-universal Mon/Wed/Thu/Fri pattern, and
    justifies it by naming Saturn among the four good day lords. Pinned because
    it reads like a slip and is not one."""
    assert "SATURDAY" in harvest.INGATHERING_VARA_GOOD
    assert "WEDNESDAY" not in harvest.INGATHERING_VARA_GOOD
    assert harvest.INGATHERING_VARA_MIDDLING == {"WEDNESDAY"}
    # Every samskara chapter puts Saturday the other way.
    for activity in ("NAMING_CEREMONY", "ANNAPRASANA", "EAR_BORING", "TONSURE"):
        assert "SATURDAY" in ACTIVITY_RULES[activity].vara_avoid, activity


def test_grain_expenditure_avoids_friday_and_records_the_dispute() -> None:
    """The only Friday avoidance in the sourced doctrine — and the page disputes
    itself one sentence later."""
    assert "FRIDAY" in harvest.GRAIN_EXPENDITURE_VARA_AVOID
    assert harvest.GRAIN_EXPENDITURE_FRIDAY_IS_DISPUTED is True
    assert "SATURDAY" in harvest.GRAIN_EXPENDITURE_VARA_GOOD


def test_attributed_dissents_are_recorded_and_never_applied() -> None:
    """"Some writers are of opinion" must never outrank the sentence it dissents
    from. Each of these is held in a constant and absent from the scored set."""
    # Ch. VII p.44 would demote three of Upanayanam's own excellent stars.
    assert lifecycle.UPANAYANAM_NAKSHATRA_DISPUTED_AS_NEUTRAL <= (
        lifecycle.UPANAYANAM_NAKSHATRA_BEST
    )
    # Ch. VIII p.53 and Ch. XI p.65 would promote Aswini out of the neutral tier.
    assert learning.EDUCATION_NAKSHATRA_DISPUTED_AS_BEST <= learning.EDUCATION_NAKSHATRA_MIDDLING
    assert learning.VEDA_STUDY_NAKSHATRA_DISPUTED_AS_BEST <= learning.VEDA_STUDY_NAKSHATRA_MIDDLING
    # Ch. XX p.109 would commend Rikta, which the same page bans.
    assert harvest.GRAIN_EXPENDITURE_RIKTA_DISPUTED is True
    assert {4, 9} & harvest.GRAIN_EXPENDITURE_TITHI_AVOID_IN_PAKSHA
    # Ch. XVII p.98 would commend two tithis it has just banned.
    assert lifecycle.SEEMANTHAM_TITHI_DISPUTED <= lifecycle.SEEMANTHAM_TITHI_AVOID_IN_PAKSHA


def test_vidyarambham_paksha_exemption_cannot_contradict_its_tithi_ban() -> None:
    """Ch. VI p.41 calls the dark fortnight's first five good and bans Prathamai
    in the next sentence. The exemption is encoded 2-5 so the two rules can never
    disagree about a real day."""
    assert 1 in learning.VIDYARAMBHAM_TITHI_AVOID_IN_PAKSHA
    assert 1 not in learning.VIDYARAMBHAM_PAKSHA_EXEMPT_IN_PAKSHA
    assert learning.VIDYARAMBHAM_PAKSHA_EXEMPT_IN_PAKSHA == {2, 3, 4, 5}


# ── the engine shapes this pass added ───────────────────────────────────────

def test_exhaustive_star_lists_penalise_harder_than_unlisted_ones(snapshot_factory) -> None:
    """`stars_exhaustive` was set on nine activities and read by nothing. A star
    outside a list the chapter closed must cost more than one merely unmentioned.
    """
    closed = ACTIVITY_RULES["NEW_CLOTHES"]
    assert closed.stars_exhaustive is True
    open_list = ACTIVITY_RULES["TREASURE_STORE"]
    assert open_list.stars_exhaustive is False

    off_both = next(
        n for n in range(1, 28)
        if n not in adornment.NEW_CLOTHES_NAKSHATRA_BEST
        and not any(n in g.stars for g in open_list.star_groups)
    )
    snap = snapshot_factory(nakshatra_number=off_both)
    closed_f = next(f for f in score_day(snap, "NEW_CLOTHES").factors if f.factor == "NAKSHATRA")
    open_f = next(f for f in score_day(snap, "TREASURE_STORE").factors if f.factor == "NAKSHATRA")
    assert closed_f.contribution < open_f.contribution < 0
    assert "closes that list" in closed_f.reason_en


def test_a_middling_star_scores_neutral_not_penalised(snapshot_factory) -> None:
    """A star the chapter names as "pretty good" is approved. Letting it fall
    through to the not-listed penalty would score a named star as if the text
    had never mentioned it."""
    star = next(iter(lifecycle.TONSURE_NAKSHATRA_MIDDLING))
    factor = next(
        f for f in score_day(snapshot_factory(nakshatra_number=star), "TONSURE").factors
        if f.factor == "NAKSHATRA"
    )
    assert factor.verdict is Verdict.NEUTRAL
    assert factor.contribution == 0.0


def test_janma_tara_count_vetoes_only_with_a_subject(snapshot_factory) -> None:
    """The book's most-repeated personal rule. General mode must never fire it —
    a general result vetoed by a personal factor breaks the mode's definition."""
    subject = Subject(janma_nakshatra=1, janma_rasi=1, lagna_rasi=1)
    banned_count = 10  # Anu-Jenma, in every one of the six chapters' sets
    star = ((1 - 1 + banned_count - 1) % 27) + 1
    snap = snapshot_factory(nakshatra_number=star)

    general = score_day(snap, "HARVEST", None)
    assert "JANMA_TARA_COUNT" not in [f.factor for f in general.factors]

    personal = score_day(snap, "HARVEST", subject)
    factor = next(f for f in personal.factors if f.factor == "JANMA_TARA_COUNT")
    assert factor.verdict is Verdict.VETO
    assert personal.vetoed
    assert "Anu-Jenma" in factor.reason_en
    assert resolve_rule_source(factor.rule_id) is not None


def test_paksha_factor_fires_only_where_a_chapter_rules_on_it(snapshot_factory) -> None:
    """Most chapters say nothing about the fortnight. Emitting a paksha verdict
    for them would invent a preference."""
    with_rule = score_day(snapshot_factory(tithi_paksha="SHUKLA"), "TONSURE")
    assert any(f.factor == "PAKSHA" for f in with_rule.factors)
    without = score_day(snapshot_factory(tithi_paksha="SHUKLA"), "NEW_CLOTHES")
    assert not any(f.factor == "PAKSHA" for f in without.factors)


# ── the whole set stays honest ──────────────────────────────────────────────

@pytest.mark.parametrize("activity", _NEW_ACTIVITIES)
def test_every_new_activity_is_reachable_and_declares_its_gaps(activity: str) -> None:
    assert activity in MUHURTA_ACTIVITIES
    entry = ACTIVITY_RULES[activity]
    assert entry.unscored_dimensions, f"{activity} claims full coverage of its chapter"
    assert all(g.strip() for g in entry.unscored_dimensions)


@pytest.mark.parametrize("activity", _NEW_ACTIVITIES)
def test_every_new_activity_emits_only_resolvable_rule_ids(activity: str, snapshots) -> None:
    subject = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5)
    for snap in snapshots[:25]:
        for factor in score_day(snap, activity, subject).factors:
            if factor.rule_id is None or factor.verdict is Verdict.UNSOURCED:
                continue
            assert resolve_rule_source(factor.rule_id) is not None, (
                f"{activity}/{factor.factor} emitted unresolvable {factor.rule_id}"
            )


@pytest.mark.parametrize("activity", _NEW_ACTIVITIES)
def test_new_activities_keep_latin_out_of_the_unlabelled_tamil_copy(
    activity: str, snapshots
) -> None:
    """The picker builds its Subject without a label, so this is the production
    path for every one of these activities too."""
    unlabelled = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5)
    latin = re.compile(r"[A-Za-z]{3,}")
    for snap in snapshots[:25]:
        for factor in score_day(snap, activity, unlabelled).factors:
            if factor.verdict is Verdict.UNSOURCED:
                continue
            assert not latin.search(factor.reason_ta), (
                f"{activity}/{factor.factor}: Latin in Tamil copy — {factor.reason_ta}"
            )
