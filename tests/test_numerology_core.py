"""Chaldean numerology core tests (NUM-15).

Golden values here are **hand-computed from the Chaldean table**, not captured
from the engine — a golden set derived from the code under test only catches
regressions, never an initial error. Each case records its arithmetic so a
reviewer can check it without running anything.
"""
from __future__ import annotations

import pytest

from app.calculations.numerology import (
    CHALDEAN_GROUPS,
    CHALDEAN_VALUES,
    COMPOUND_SERIES_MAX,
    COMPOUND_SERIES_MIN,
    NUMBER_TO_GRAHA,
    ObjectKind,
    ScriptMismatchError,
    analyze_object,
    build_profile,
    chaldean_value,
    compound_from_chain,
    destiny_number,
    psychic_number,
    reading_from_total,
    reduction_chain,
    score_digits,
    score_text,
)
from app.services import numerology_content as content
from app.services.feature_flags import get_flag

pytestmark = pytest.mark.no_db

TAMIL_RANGE = range(0x0B80, 0x0BFF + 1)


# ---------------------------------------------------------------------------
# Chaldean table integrity
# ---------------------------------------------------------------------------
def test_table_covers_every_latin_letter_exactly_once() -> None:
    letters = "".join(CHALDEAN_GROUPS.values())
    assert len(letters) == 26
    assert set(letters) == set("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    assert len(CHALDEAN_VALUES) == 26


def test_no_letter_carries_the_value_nine() -> None:
    """Nine is unassigned in Chaldean. The classic implementation trap."""
    assert 9 not in CHALDEAN_GROUPS
    assert set(CHALDEAN_VALUES.values()) == {1, 2, 3, 4, 5, 6, 7, 8}


def test_table_is_data_not_an_a1_to_z26_formula() -> None:
    """Deriving the table arithmetically produces a different, wrong table."""
    formula = {chr(65 + i): (i % 9) + 1 for i in range(26)}
    differences = [ch for ch in formula if formula[ch] != CHALDEAN_VALUES[ch]]
    assert len(differences) > 15
    # 'I' is the clearest single case: 9th letter, but Chaldean value 1.
    assert formula["I"] == 9
    assert CHALDEAN_VALUES["I"] == 1


def test_graha_mapping_is_one_to_one_over_1_to_9() -> None:
    assert sorted(NUMBER_TO_GRAHA) == list(range(1, 10))
    assert len(set(NUMBER_TO_GRAHA.values())) == 9
    assert NUMBER_TO_GRAHA[8] == "SATURN"
    assert NUMBER_TO_GRAHA[4] == "RAHU"


def test_chaldean_value_of_non_letter_is_none() -> None:
    assert chaldean_value("5") is None
    assert chaldean_value(" ") is None


# ---------------------------------------------------------------------------
# Reduction + compound preservation
# ---------------------------------------------------------------------------
def test_reduction_chain_ends_at_a_single_digit() -> None:
    assert reduction_chain(87) == (87, 15, 6)   # 8+7=15, 1+5=6
    assert reduction_chain(43) == (43, 7)       # 4+3=7
    assert reduction_chain(9) == (9,)
    assert reduction_chain(100) == (100, 1)     # 1+0+0=1


def test_compound_is_never_discarded_for_equal_roots() -> None:
    """43 and 34 both reduce to 7 and mean different things."""
    a, b = reduction_chain(43), reduction_chain(34)
    assert a[-1] == b[-1] == 7
    assert compound_from_chain(a) == 43
    assert compound_from_chain(b) == 34
    assert compound_from_chain(a) != compound_from_chain(b)


def test_compound_is_the_first_value_inside_cheiros_series() -> None:
    assert compound_from_chain(reduction_chain(37)) == 37     # already in range
    assert compound_from_chain(reduction_chain(87)) == 15     # 87 > 52, reduce once
    assert compound_from_chain(reduction_chain(55)) == 10
    assert COMPOUND_SERIES_MIN == 10 and COMPOUND_SERIES_MAX == 52


def test_single_digit_total_has_no_compound() -> None:
    assert compound_from_chain(reduction_chain(6)) is None
    assert compound_from_chain(reduction_chain(100)) is None  # chain is (100, 1)


# ---------------------------------------------------------------------------
# Doctrine D6 — where Cheiro's series runs out
# ---------------------------------------------------------------------------
def test_a_total_inside_the_series_is_not_flagged_as_a_surrogate() -> None:
    reading = reading_from_total(37)
    assert reading.compound == 37
    assert reading.compound_beyond_series is None
    assert reading.compound_is_surrogate is False


def test_a_total_above_the_series_reports_the_number_the_name_actually_makes() -> None:
    """87 is read as 15, and the response must not hide that.

    Showing the meaning of 15 for a name that adds to 87 is showing a different
    number's reading. It is defensible — Cheiro documented nothing above 52 —
    but only if the surface can tell the user which number it is describing.
    """
    reading = reading_from_total(87)
    assert reading.compound == 15
    assert reading.compound_beyond_series == 87
    assert reading.compound_is_surrogate is True


def test_a_total_that_reduces_straight_past_the_series_is_not_no_compound() -> None:
    """The case that motivated D6, and it is not exotic.

    "Rajesh Kumar Subramanian" totals 63, which reduces to 9 in one step with
    nothing landing in 10..52. Before this, that reported ``compound=None`` —
    byte-identical to a genuinely single-digit total, so no caller could tell
    "this name has no compound" from "this name's compound is 63, which we have
    not encoded". Sethuraman's series reads 63; ours stops at 52.
    """
    reading = reading_from_total(63)
    assert reading.compound is None
    assert reading.has_compound is False
    assert reading.compound_beyond_series == 63
    assert reading.compound_is_surrogate is True

    single_digit = reading_from_total(6)
    assert single_digit.compound is None
    assert single_digit.compound_beyond_series is None
    assert single_digit.compound_is_surrogate is False


def test_document_length_names_routinely_leave_the_encoded_series() -> None:
    """Measured, not asserted — this is why D6 is not an edge case.

    Name correction targets the *document* spelling, and Indian document names
    are commonly three parts. If this ratio ever drops to zero the sample has
    stopped being representative, not the problem gone away.
    """
    names = (
        "Senthil Kumar Sivaraman",
        "Rajesh Kumar Subramanian",
        "Lakshmi Priya Venkatesan",
        "Thiruvengadam Ramachandran",
        "Venkataraman Krishnamurthy",
        "Meenakshi Sundaram Pillai",
        "Chandrasekaran Natarajan",
        "Parthasarathy Raghavan",
    )
    beyond = [name for name in names if score_text(name).compound_is_surrogate]
    assert len(beyond) == 8, (
        f"{len(beyond)}/8 three-part names exceeded the 10-52 series; the "
        "measurement behind doctrine D6 has changed"
    )


# ---------------------------------------------------------------------------
# Name scoring — golden cases
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    ("text", "total", "compound", "root", "graha"),
    [
        # A=1 B=2 C=3 -> 6
        ("ABC", 6, None, 6, "VENUS"),
        # T=4 E=5 S=3 T=4 -> 16 -> 1+6=7
        ("TEST", 16, 16, 7, "KETU"),
        # Z=7 O=7 R=2 O=7 -> 23 -> 2+3=5
        ("ZORO", 23, 23, 5, "MERCURY"),
        # A=1 x4 -> 4
        ("AAAA", 4, None, 4, "RAHU"),
    ],
)
def test_score_text_golden_cases(
    text: str, total: int, compound: int | None, root: int, graha: str
) -> None:
    reading = score_text(text)
    assert reading.total == total
    assert reading.compound == compound
    assert reading.root == root
    assert reading.graha == graha


def test_case_and_spacing_do_not_change_the_number() -> None:
    assert score_text("test").total == score_text("TEST").total == 16
    spaced = score_text("T E S T")
    assert spaced.total == 16
    assert " " in spaced.ignored_characters


def test_diacritics_are_folded_before_scoring() -> None:
    assert score_text("Zoró").total == score_text("ZORO").total


def test_non_latin_script_is_refused_not_silently_skipped() -> None:
    """Doctrine D3. Skipping Tamil letters would return a confident wrong number."""
    with pytest.raises(ScriptMismatchError, match="Latin"):
        score_text("தீபா")
    with pytest.raises(ScriptMismatchError):
        score_text("Deepa தீபா")


# ---------------------------------------------------------------------------
# The letter-by-letter working
# ---------------------------------------------------------------------------
def test_score_text_reports_what_each_letter_was_worth() -> None:
    """"Adds up to 23" is an assertion; this is the part a reader can check."""
    reading = score_text("ZORO")
    assert reading.letter_values == (("Z", 7), ("O", 7), ("R", 2), ("O", 7))
    assert sum(value for _, value in reading.letter_values) == reading.total


def test_letter_values_are_uppercased_and_skip_the_ignorable() -> None:
    reading = score_text("t e-s.t")
    assert reading.letter_values == (("T", 4), ("E", 5), ("S", 3), ("T", 4))
    # The dropped characters are still reported, just not as scored tokens.
    assert set(reading.ignored_characters) == {" ", "-", "."}


def test_score_digits_breaks_down_a_mixed_plate() -> None:
    """A digit scores as itself; a letter does not. The breakdown shows both."""
    reading = score_digits("TN09BX")
    assert reading.letter_values == (("T", 4), ("N", 5), ("0", 0), ("9", 9), ("B", 2), ("X", 5))
    assert sum(value for _, value in reading.letter_values) == reading.total


def test_date_derived_readings_carry_no_letters() -> None:
    """Empty must mean "there were none", not "not computed"."""
    assert psychic_number(15).letter_values == ()
    assert destiny_number(1990, 5, 17).letter_values == ()


def test_a_breakdown_that_contradicts_its_total_is_refused() -> None:
    """The breakdown is shown as *proof* of the total.

    If the two could disagree the page would be displaying a lie in the one
    format that invites the reader to check it, so this is an assertion rather
    than a lenient reconcile.
    """
    with pytest.raises(ValueError, match="letter_values sum"):
        reading_from_total(10, (), (("A", 1), ("B", 2)))


def test_empty_or_unscoreable_input_raises() -> None:
    with pytest.raises(ValueError):
        score_text("")
    with pytest.raises(ValueError):
        score_text("   ")
    with pytest.raises(ValueError, match="no scoreable"):
        score_text("...")


# ---------------------------------------------------------------------------
# The four numbers
# ---------------------------------------------------------------------------
def test_psychic_number_is_the_day_of_month() -> None:
    r = psychic_number(17)  # 1+7 = 8
    assert (r.total, r.compound, r.root, r.graha) == (17, 17, 8, "SATURN")
    assert psychic_number(5).root == 5


def test_destiny_number_sums_every_digit_of_the_date() -> None:
    # 1990-05-17 -> (1+9+9+0) + (0+5) + (1+7) = 19 + 5 + 8 = 32 -> 3+2 = 5
    r = destiny_number(1990, 5, 17)
    assert (r.total, r.compound, r.root, r.graha) == (32, 32, 5, "MERCURY")


def test_all_digits_and_pre_reduced_agree_on_root_but_not_compound() -> None:
    """Why the summation method matters: the compound outranks the root."""
    all_digits = destiny_number(1990, 5, 17)
    # Pre-reduced: 1990->19->10->1, 05->5, 17->8  =>  1+5+8 = 14
    pre_reduced_total = 14
    assert reduction_chain(pre_reduced_total)[-1] == all_digits.root  # both 5
    assert compound_from_chain(reduction_chain(pre_reduced_total)) != all_digits.compound


def test_build_profile_records_which_string_it_scored() -> None:
    """Doctrine D3 — a reading that does not say what it scored is unusable."""
    profile = build_profile(
        year=1990, month=5, day=17, document_name="Zoro", called_name="Test"
    )
    assert profile.scored_name == "Zoro"
    assert profile.scored_namesake == "Test"
    assert profile.name is not None and profile.name.total == 23
    assert profile.namesake is not None and profile.namesake.total == 16
    assert profile.psychic.root == 8
    assert profile.destiny.root == 5


def test_profile_without_names_leaves_name_numbers_absent() -> None:
    profile = build_profile(year=2000, month=1, day=1)
    assert profile.name is None
    assert profile.namesake is None
    assert profile.scored_name is None


@pytest.mark.parametrize("day", [0, 32, -1])
def test_invalid_dates_raise(day: int) -> None:
    with pytest.raises(ValueError):
        psychic_number(day)


def test_invalid_month_raises() -> None:
    with pytest.raises(ValueError):
        destiny_number(1990, 13, 1)


# ---------------------------------------------------------------------------
# Object numerology
# ---------------------------------------------------------------------------
def test_mobile_is_read_whole_and_by_its_tail() -> None:
    # 9+8+7+6+5+4+3+2+1+0 = 45 -> 4+5 = 9 ; tail 3+2+1+0 = 6
    result = analyze_object("98765 43210", ObjectKind.MOBILE)
    assert result.scored == "9876543210"
    assert (result.reading.total, result.reading.root, result.reading.graha) == (45, 9, "MARS")
    assert result.secondary is not None
    assert result.secondary_label == "last 4"
    assert (result.secondary.total, result.secondary.root) == (6, 6)


def test_vehicle_plate_scores_letters_and_digits_together() -> None:
    # T=4 N=5 0 9 B=2 X=5 4 5 1 2 -> 37 -> 3+7 = 1
    result = analyze_object("TN09BX4512", ObjectKind.VEHICLE)
    assert (result.reading.total, result.reading.compound, result.reading.root) == (37, 37, 1)
    assert result.reading.graha == "SUN"
    assert result.secondary is None


def test_house_number_handles_an_alphabetic_suffix() -> None:
    # 1 + 2 + A(1) = 4
    result = analyze_object("12A", ObjectKind.HOUSE)
    assert result.reading.total == 4
    assert result.reading.root == 4
    assert result.reading.compound is None


def test_house_number_handles_a_slash_form() -> None:
    # 4 + 2 = 6, slash ignored but reported
    result = analyze_object("4/2", ObjectKind.HOUSE)
    assert result.reading.total == 6
    assert "/" in result.reading.ignored_characters


def test_short_mobile_has_no_tail_reading() -> None:
    result = analyze_object("123", ObjectKind.MOBILE)
    assert result.secondary is None


def test_empty_object_value_raises() -> None:
    with pytest.raises(ValueError):
        analyze_object("", ObjectKind.HOUSE)
    with pytest.raises(ValueError):
        analyze_object("abc-", ObjectKind.MOBILE)  # no digits


def test_score_digits_refuses_non_latin() -> None:
    with pytest.raises(ScriptMismatchError):
        score_digits("12தா")


# ---------------------------------------------------------------------------
# Corpus: safety, review gate, drift
# ---------------------------------------------------------------------------
def test_corpus_carries_no_fear_framing() -> None:
    """Plan §9.3 — the 8-and-4 fear trade is banned, enforced not just reviewed."""
    for reading in content.all_root_readings():
        blob = " ".join([
            reading.nature_en, reading.strength_en, reading.care_en,
            reading.nature_ta, reading.strength_ta, reading.care_ta,
        ]).lower()
        for term in content.BANNED_FEAR_TERMS:
            assert term not in blob, f"root {reading.number} copy contains {term!r}"


def test_saturn_and_rahu_copy_is_not_negative_in_tone() -> None:
    """The two numbers the trade scares people about get explicit checks."""
    saturn = content.root_reading(8)
    assert "earned" in saturn.strength_en.lower() or "steady" in saturn.strength_en.lower()
    assert "not failure" in saturn.care_en.lower()
    rahu = content.root_reading(4)
    assert "structure" in rahu.care_en.lower()


def test_corpus_is_marked_unreviewed_and_not_renderable() -> None:
    assert content.CONTENT_REVIEWED is False
    assert content.corpus_is_renderable() is False


# ---------------------------------------------------------------------------
# The citation/prose split (2026-07-29)
# ---------------------------------------------------------------------------
def test_compound_citation_ships_while_the_prose_corpus_is_dark() -> None:
    """The whole point of the split: a title is a citation, not a reading.

    Before this, one ``CONTENT_REVIEWED`` gate covered both our sentences about
    a person *and* Cheiro's own titles for his numbers. The second needs no
    Tamil review — there is no Tamil in it and no claim about the reader — and
    holding it back is what left the public calculator printing a bare integer
    where a sourced classical name existed three files away.
    """
    assert content.CONTENT_REVIEWED is False, "this test is about the gate being OFF"

    citation = content.compound_citation(31)
    assert citation is not None
    assert citation.title_en == "The Recluse"
    assert citation.tone is content.CompoundTone.MIXED
    assert "Cheiro" in citation.source

    # …while the meaning of the same number stays withheld at the API edge.
    assert content.corpus_is_renderable() is False


def test_compound_citation_is_absent_where_cheiro_encodes_nothing() -> None:
    """``None`` must mean "not in the series", never "withheld"."""
    assert content.compound_citation(None) is None   # single-digit total
    assert content.compound_citation(9) is None      # a root, not a compound
    assert content.compound_citation(53) is None     # past the series
    assert content.compound_citation(108) is None    # Sethuraman's range, unencoded


def test_compound_citation_carries_no_tamil() -> None:
    """English-only by design — a Tamil title would be new, ungated translation."""
    for number in range(10, 53):
        citation = content.compound_citation(number)
        assert citation is not None
        assert not any(ord(ch) in TAMIL_RANGE for ch in citation.title_en), number


def test_every_citation_carries_a_tone_so_a_title_never_ships_bare() -> None:
    """Standing ruling 3, in its breached-by-omission form.

    Several of Cheiro's titles are alarming standing alone — 16 is "The
    Shattered Citadel", 22 "The Good Man Blinded". Shipping a title with no
    register beside it hands the reader his fatalism and withholds our
    reframing of it, which is the fear trade arrived at by leaving something
    out rather than by writing it.
    """
    for number in range(10, 53):
        citation = content.compound_citation(number)
        assert citation is not None
        assert citation.tone in set(content.CompoundTone), number


def test_citation_agrees_with_the_corpus_it_is_drawn_from() -> None:
    """Two views of one row must not drift."""
    for number in range(10, 53):
        citation = content.compound_citation(number)
        reading = content.compound_reading(number)
        assert citation is not None and reading is not None
        assert citation.title_en == reading.title_en
        assert citation.tone is reading.tone
        assert citation.echoes == reading.echoes


def test_every_root_has_a_reading_and_matches_the_engine_graha() -> None:
    readings = content.all_root_readings()
    assert len(readings) == 9
    for reading in readings:
        assert reading.graha == NUMBER_TO_GRAHA[reading.number]


def test_compound_corpus_covers_cheiros_full_10_to_52_series() -> None:
    """NUM-05, sourced to Cheiro Book of Numbers 1935 ed. pp. 126-133."""
    assert sorted(content.COMPOUND_READINGS) == list(range(10, 53))
    assert len(content.COMPOUND_READINGS) == 43
    assert "Cheiro" in content.COMPOUND_SOURCE


def test_compound_echoes_resolve_to_their_base_meaning() -> None:
    """Cheiro's own structure: 17 numbers repeat an earlier compound."""
    echoes = [r for r in content.all_compound_readings() if r.echoes is not None]
    assert len(echoes) == 17
    for reading in echoes:
        base = content.COMPOUND_READINGS[reading.echoes]
        assert reading.reading_en == base.reading_en
        assert reading.title_en == base.title_en
        assert base.echoes is None, "an echo must not point at another echo"


def test_compound_never_falls_back_to_the_root_reading() -> None:
    """Substituting root for compound is the silently-wrong case."""
    assert content.compound_reading(None) is None
    assert content.compound_reading(9) is None    # single digit, not a compound
    assert content.compound_reading(53) is None   # outside Cheiro's series
    assert content.compound_reading(43) is not None


def test_compound_43_and_34_carry_different_meanings() -> None:
    """The whole reason the compound is preserved: both reduce to 7."""
    assert content.compound_reading(43).reading_en != content.compound_reading(34).reading_en


def test_compound_corpus_carries_no_fear_framing() -> None:
    """Cheiro's originals are fatalistic; our rendering must not be (§9.3)."""
    for reading in content.all_compound_readings():
        blob = f"{reading.title_en} {reading.reading_en} {reading.reading_ta}".lower()
        for term in content.BANNED_FEAR_TERMS:
            assert term not in blob, f"compound {reading.number} contains {term!r}"


def test_cautionary_tone_is_recorded_not_erased() -> None:
    """A cautionary number must still read as cautionary — just not as a sentence."""
    tones = {r.tone for r in content.all_compound_readings()}
    assert tones == {
        content.CompoundTone.FAVOURABLE,
        content.CompoundTone.MIXED,
        content.CompoundTone.CAUTIONARY,
    }
    assert content.compound_reading(16).tone is content.CompoundTone.CAUTIONARY
    assert content.compound_reading(19).tone is content.CompoundTone.FAVOURABLE
    # 13 is the classic misread — Cheiro calls it change, not misfortune.
    assert content.compound_reading(13).tone is content.CompoundTone.MIXED


def test_compound_readings_are_script_pure() -> None:
    for reading in content.all_compound_readings():
        assert any(ord(ch) in TAMIL_RANGE for ch in reading.reading_ta), reading.number
        assert not any(ord(ch) in TAMIL_RANGE for ch in reading.reading_en), reading.number


def test_bilingual_fields_are_script_pure() -> None:
    for reading in content.all_root_readings():
        for tamil in (reading.nature_ta, reading.strength_ta, reading.care_ta):
            assert any(ord(ch) in TAMIL_RANGE for ch in tamil), reading.number
        for english in (reading.nature_en, reading.strength_en, reading.care_en):
            assert not any(ord(ch) in TAMIL_RANGE for ch in english), reading.number


# ---------------------------------------------------------------------------
# Flags
# ---------------------------------------------------------------------------
def test_numerology_flags_launched_and_proposed_doctrine() -> None:
    # Flipped ON 2026-07-28 — see app/services/feature_flags.py for why this
    # is safe ahead of Tamil content review (CONTENT_REVIEWED is the separate
    # gate that still withholds every interpretive string).
    assert get_flag("numerology_engine") is True
    assert get_flag("numerology_personal_year_epoch") == "birthday"
    assert get_flag("numerology_naming_mode") == "pada_first"
