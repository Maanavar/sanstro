"""Kalaprakasika Ch. VI, VIII, X, XI & XII — the student's arc, start to finish.

Sourced from N. P. Subramania Iyer's Kalaprakasika translation (Asian
Educational Services 1982 reprint of the 1917 first edition), extracted
2026-08-15 from the page-by-page transcription of the 150-page scan supplied by
the repository owner. Worksheet: `docs/sources/kalaprakasika_learning_rules.md`.

* **Vidyarambham** — learning the alphabet, Ch. VI, printed pp. 41-42
* **Starting education** — Ch. VIII, printed pp. 53-57
* **Initiation in a mantra** — Ch. X, printed pp. 61-64
* **Beginning Veda study** — Ch. XI, printed pp. 65-67
* **Snaana** — the Samavarthanam bath closing studentship, Ch. XII, printed
  pp. 67-68

Page numbers are **printed book pages**; PDF page = printed page + 32.

**Three of these agree where the samskara chapters disagree, and the fourth
breaks the agreement — which is what makes it evidence.** Ch. VI, VIII and XI
state the *same* sign doctrine in the same order: common best, movable middling,
fixed rejected. They also share a weekday shape (Wed/Thu/Fri good, Sat/Tue bad,
Sun/Mon middling) that appears nowhere else in the book, where Mon/Wed/Thu/Fri is
otherwise near-universal. Two chapters agreeing would be a coincidence worth
noting; three agreeing across seventy printed pages is a subject-level doctrine.

**Ch. X inverts it.** Sitting between Ch. VIII and Ch. XI, mantra initiation
calls the *movable* signs good and the common ones neutral — the exact swap. It
is encoded as printed, because the agreement of the other three is only evidence
so long as it is not universal, and quietly extending it over Ch. X would erase
the contrast that gives it meaning.

**Ch. X also reverses the book's most-repeated personal rule.** Six chapters
prohibit the janma / Anu-Jenma / Thri-Jenma triad; Ch. X p.62 calls it
*beneficial*. That reading is recorded, is deliberately not scored, and is
flagged for the astrologer — see `MANTRA_INITIATION_JANMA_TARA_FAVOURABLE`.

**Ch. XII is the one place in the sourced doctrine that calls Sunday good.**

Data only. The engine reads this through `app/data/muhurta_activity_registry.py`.
"""
from __future__ import annotations

from app.calculations.muhurta_doctrine import (
    Authority,
    ProvenanceStatus,
    RuleSource,
    RuleType,
    SourceConfidence,
    VerificationOutcome,
)
from app.constants.astrology import NAKSHATRA_NAMES

_TRADITION = "KALAPRAKASIKA"
_EDITION = "Subramania Iyer"
_VERIFIED_ON = "2026-08-15"
_VERIFIED_BY = "primary-text transcription pp.41-42, 53-57, 61-64, 65-68 (user-supplied scan)"


def _nak(*names: str) -> frozenset[int]:
    """Canonical 1..27 nakshatra numbers for this repo's Tamil-transliterated
    keys — never a second name list."""
    return frozenset(NAKSHATRA_NAMES.index(name) + 1 for name in names)


# The sign doctrine all three chapters state, named once because it is one rule
# appearing three times rather than three rules that happen to agree.
# 1=Aries..12=Pisces.
_COMMON_SIGNS = frozenset({3, 6, 9, 12})    # Gemini, Virgo, Sagittarius, Pisces
_MOVABLE_SIGNS = frozenset({1, 4, 7, 10})   # Aries, Cancer, Libra, Capricorn
_FIXED_SIGNS = frozenset({2, 5, 8, 11})     # Taurus, Leo, Scorpio, Aquarius


# ═════════════════════════════════════════════════════════════════════════════
# VIDYARAMBHAM — learning the alphabet, Ch. VI, pp.41-42
# ═════════════════════════════════════════════════════════════════════════════

# p.41: "The following asterisms are favourable:- Aswini, Ardhra, Punarvasu,
# Hastha, Chithra, Swathi, Anuradha, Sravana and Revathi. The remaining
# asterisms should be avoided."
VIDYARAMBHAM_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "THIRUVATHIRAI", "PUNARPOOSAM", "HASTHAM", "CHITHIRAI", "SWATHI",
    "ANUSHAM", "THIRUVONAM", "REVATHI",
)  # count = 9
VIDYARAMBHAM_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = True

# p.41: "All Thithis are good except Prathamai, Chathurthi, Shashti, Ashtami,
# Navami, Chathurdasi, the Full Moon and the New-Moon days"
VIDYARAMBHAM_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({1, 4, 6, 8, 9, 14})
VIDYARAMBHAM_TITHI_AVOID_PURNIMA: bool = True
VIDYARAMBHAM_TITHI_AVOID_AMAVASYA: bool = True
VIDYARAMBHAM_TITHI_REMAINDER_IS_AUSPICIOUS: bool = True

# p.41: "The bright fortnight and the first five Thithis of the dark fortnight
# are good."
#
# NOTE the tension with the tithi list above, which bans Prathamai outright
# while this sentence calls the dark fortnight's first five — Prathamai among
# them — good. The tithi ban is the more specific statement and wins; the
# paksha exemption is encoded WITHOUT Prathamai so the two never contradict on
# the same day. Recorded rather than silently reconciled.
VIDYARAMBHAM_PAKSHA_PREFERRED: str = "SHUKLA"
VIDYARAMBHAM_PAKSHA_EXEMPT_IN_PAKSHA: frozenset[int] = frozenset({2, 3, 4, 5})

# p.42: "Wednesday, Thursday and Friday are auspicious; Sunday and Monday are
# pretty favourable; Tuesday and Saturday are bad. Some astrologers reject
# Sunday also."
VIDYARAMBHAM_VARA_GOOD: frozenset[str] = frozenset({"WEDNESDAY", "THURSDAY", "FRIDAY"})
VIDYARAMBHAM_VARA_AVOID: frozenset[str] = frozenset({"TUESDAY", "SATURDAY"})
VIDYARAMBHAM_VARA_MIDDLING: frozenset[str] = frozenset({"SUNDAY", "MONDAY"})

# p.42: "The common signs such as Gemini, Virgo, Sagittari and Pisces are
# fruitful. Movable signs are neutral. Fixed signs should be totally avoided."
VIDYARAMBHAM_LAGNA_BEST: frozenset[int] = _COMMON_SIGNS
VIDYARAMBHAM_LAGNA_MIDDLING: frozenset[int] = _MOVABLE_SIGNS
VIDYARAMBHAM_LAGNA_AVOID: frozenset[int] = _FIXED_SIGNS

# p.42: "Sthira-karana such as Sakunam should be avoided as also Vishti-karana."
# The Sthira membership comes from Ch. XXI p.110, which enumerates the class.
VIDYARAMBHAM_KARANA_AVOID: frozenset[str] = frozenset(
    {"SHAKUNI", "CHATUSHPADA", "NAGA", "KIMSTUGHNA", "VISHTI"}
)

# Sourced, deliberately unscored.
VIDYARAMBHAM_YEAR_FROM_BIRTH: int = 5                            # p.41
VIDYARAMBHAM_REQUIRES_UTHARAYANA: bool = True                    # p.41
VIDYARAMBHAM_AVOID_SOLAR_MONTH_AQUARIUS: bool = True             # p.41
VIDYARAMBHAM_BEFORE_UPANAYANAM: bool = True                      # p.41
VIDYARAMBHAM_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True             # p.42
VIDYARAMBHAM_FIFTH_HOUSE_BENEFICS_GOOD: frozenset[str] = frozenset(
    {"MERCURY", "JUPITER", "VENUS"}
)                                                                 # p.42


# ═════════════════════════════════════════════════════════════════════════════
# EDUCATION_START — Ch. VIII, pp.53-57
# ═════════════════════════════════════════════════════════════════════════════

# p.53: "The following are the most fruitful asterisms for commencing
# education:- Mrigasirsha, Ardhra, Punarvasu, Pushya, Hastha, Chithra, Swathi,
# Sravana, Sravishta and Sathabis."
EDUCATION_NAKSHATRA_BEST: frozenset[int] = _nak(
    "MIRUGASEERIDAM", "THIRUVATHIRAI", "PUNARPOOSAM", "POOSAM", "HASTHAM",
    "CHITHIRAI", "SWATHI", "THIRUVONAM", "AVITTAM", "SADAYAM",
)  # count = 10
# p.53: "The neutral asterisms are:- Aswini, Rohini, Utharapalguni,
# Utharashada and Utharabadhrapadha and Revathi."
EDUCATION_NAKSHATRA_MIDDLING: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "UTHIRAM", "UTHIRADAM", "UTHIRATTATHI", "REVATHI",
)  # count = 6
# p.53: "The remaining asterisms should be avoided."
EDUCATION_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = True
# p.53: "Some writers commend Aswini as one of the best asterisms."
# An attributed promotion of ONE star out of the neutral tier. Recorded, not
# applied — the chapter's own placement stands.
EDUCATION_NAKSHATRA_DISPUTED_AS_BEST: frozenset[int] = _nak("ASWINI")

# p.54: "The following Thithis are auspicious:- Prathamai, (of the dark half of
# the lunar month) Dhwithiyai, Thrithyai, Panchami, Shashti, Dhasami, and
# Ekadhasi"
#
# Prathamai carries an explicit paksha qualifier that the flat tithi shape
# cannot hold; it is encoded in the best set and the qualifier recorded here.
EDUCATION_TITHI_BEST_IN_PAKSHA: frozenset[int] = frozenset({1, 2, 3, 5, 6, 10, 11})
EDUCATION_TITHI_PRATHAMAI_IS_KRISHNA_ONLY: bool = True
# p.54: "Avoid Chathurthi, Navami, Ashtami, Chathurdhasi, Full-Moon and
# New-Moon days." ... "The remaining Thithis are neutral."
EDUCATION_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 8, 9, 14})
EDUCATION_TITHI_AVOID_PURNIMA: bool = True
EDUCATION_TITHI_AVOID_AMAVASYA: bool = True

# p.54: "Take care to avoid Saturday and Tuesday and the Amsas of Saturn and
# Mars." p.54-55 then grades every weekday by its effect on the student.
EDUCATION_VARA_GOOD: frozenset[str] = frozenset({"WEDNESDAY", "THURSDAY", "FRIDAY"})
EDUCATION_VARA_AVOID: frozenset[str] = frozenset({"SATURDAY", "TUESDAY"})
# p.54: "Sundsy prolongs life; Monday makes the student dull; Tuesday brings
# death; Wednesday favours intelligence and insight (Pragna). Thursday bestows
# good sense; Friday produces success; Saturday shows incapacity."
#
# Monday's effect is adverse for a student and Sunday's is favourable, but the
# chapter's own instruction sentence names only Saturday and Tuesday to avoid.
# The instruction is scored and the effect table is recorded beside it: reading
# "makes the student dull" as a fourth avoided weekday would be our inference,
# not the chapter's rule.
EDUCATION_VARA_EFFECTS: dict[str, str] = {
    "SUNDAY": "prolongs life",
    "MONDAY": "makes the student dull",
    "TUESDAY": "brings death",
    "WEDNESDAY": "favours intelligence and insight (Pragna)",
    "THURSDAY": "bestows good sense",
    "FRIDAY": "produces success",
    "SATURDAY": "shows incapacity",
}
# p.55: "Some writers are of opinion that starting education on Sunday will
# cause impediments to progress." — a dissent against p.54's own "Sunday
# prolongs life". Recorded; neither is scored, since Sunday is in neither set.
EDUCATION_SUNDAY_IS_DISPUTED: bool = True

# p.55: "The Common signs are the best. Movable signs are of middling quality.
# Fixed signs are bad."
EDUCATION_LAGNA_BEST: frozenset[int] = _COMMON_SIGNS
EDUCATION_LAGNA_MIDDLING: frozenset[int] = _MOVABLE_SIGNS
EDUCATION_LAGNA_AVOID: frozenset[int] = _FIXED_SIGNS

# p.54, per-subject star lists. Sub-scopes of "commencing education", recorded
# because the chapter states them and NOT wired: the picker asks what day, not
# what subject, and collapsing five lists into one would erase the distinction
# the chapter drew.
EDUCATION_SUBJECT_NAKSHATRA: dict[str, frozenset[int]] = {
    "VYAKARANA_GRAMMAR": _nak(
        "ROHINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "POOSAM", "HASTHAM",
        "ANUSHAM", "AVITTAM", "REVATHI",
    ),
    "THARKA_LOGIC": _nak(
        "ASWINI", "ROHINI", "PUNARPOOSAM", "POOSAM", "UTHIRAM", "HASTHAM",
        "SWATHI", "UTHIRADAM", "THIRUVONAM", "SADAYAM", "UTHIRATTATHI",
    ),
    "JYOTISHA_AND_VEDANGAS": _nak(
        "ASWINI", "PUNARPOOSAM", "POOSAM", "HASTHAM", "SWATHI", "MOOLAM",
        "SADAYAM", "REVATHI",
    ),
    "ALL_SASTRAS_VEDAS_ARTS": _nak("POOSAM", "AVITTAM", "THIRUVONAM"),
    "AYURVEDA_AND_DHANURVEDA": _nak("AVITTAM"),
}

# Sourced, deliberately unscored.
EDUCATION_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True                # p.55
EDUCATION_FOURTH_HOUSE_VACANCY_DISPUTED: bool = True             # p.55, "some are of opinion"
EDUCATION_MALEFIC_UPACHAYA_HOUSES: frozenset[int] = frozenset({3, 6, 11})   # p.55
EDUCATION_FORENOON_OR_NOON_BEST: bool = True                     # p.55


# ═════════════════════════════════════════════════════════════════════════════
# VEDA_STUDY — Ch. XI, pp.65-67
# ═════════════════════════════════════════════════════════════════════════════

# p.65: "To start the much-esteemed study of the Vedas, choose the following
# asterisms, which are favourable:- Mrigasirsha, Ardhra, Punarvasu, Pushya,
# Hastha, Chithra, Swathi, Anuradha, Sravana, Sravishta and Sathabis."
VEDA_STUDY_NAKSHATRA_BEST: frozenset[int] = _nak(
    "MIRUGASEERIDAM", "THIRUVATHIRAI", "PUNARPOOSAM", "POOSAM", "HASTHAM",
    "CHITHIRAI", "SWATHI", "ANUSHAM", "THIRUVONAM", "AVITTAM", "SADAYAM",
)  # count = 11 — the Ch. VIII list plus Anuradha
# p.65: "The following asterisms are neutral:- Aswini. Rohini, Utharapalguni,
# Utharashada, Utharabadhrapadha and Revathi."
VEDA_STUDY_NAKSHATRA_MIDDLING: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "UTHIRAM", "UTHIRADAM", "UTHIRATTATHI", "REVATHI",
)  # count = 6 — identical to Ch. VIII's neutral tier
# p.65: "The remaining asterisms should be avoided."
VEDA_STUDY_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = True
# p.65: "Some writers include Aswini among the first of favourable asterisms."
VEDA_STUDY_NAKSHATRA_DISPUTED_AS_BEST: frozenset[int] = _nak("ASWINI")

# p.65: "Among Thithis, Sapthami and Thrayodhasi are neutral; Prathamai,
# Chathurthi, Ashtami, Navami, Dhwadhasi, Full-Moon and New-Moon days should be
# avoided. The other Thithis are excellent."
VEDA_STUDY_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({1, 4, 8, 9, 12})
VEDA_STUDY_TITHI_AVOID_PURNIMA: bool = True
VEDA_STUDY_TITHI_AVOID_AMAVASYA: bool = True
VEDA_STUDY_TITHI_MIDDLING: frozenset[int] = frozenset({7, 13})
VEDA_STUDY_TITHI_REMAINDER_IS_AUSPICIOUS: bool = True

# p.65: "Wednesday, Thursday and Friday ... are good. Sunday and Monday ... are
# neutral. Avoid Saturday and Tuesday and the Amsas and associations of Saturn
# and Mars."
VEDA_STUDY_VARA_GOOD: frozenset[str] = frozenset({"WEDNESDAY", "THURSDAY", "FRIDAY"})
VEDA_STUDY_VARA_AVOID: frozenset[str] = frozenset({"SATURDAY", "TUESDAY"})
VEDA_STUDY_VARA_MIDDLING: frozenset[str] = frozenset({"SUNDAY", "MONDAY"})

# p.65: "Common signs are auspicious; Movable signs are neutral; Fixed signs are
# not to be considered."
VEDA_STUDY_LAGNA_BEST: frozenset[int] = _COMMON_SIGNS
VEDA_STUDY_LAGNA_MIDDLING: frozenset[int] = _MOVABLE_SIGNS
VEDA_STUDY_LAGNA_AVOID: frozenset[int] = _FIXED_SIGNS

# Sourced, deliberately unscored.
VEDA_STUDY_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True               # p.65
# p.66, Pradhosham: a tithi that runs past a stated point of the night blocks
# Veda recitation. Needs sub-day tithi end times against nightfall.
VEDA_STUDY_PRADHOSHAM_TITHIS: frozenset[int] = frozenset({4, 7, 13})
# p.67, calendar days on which Veda study is barred outright.
VEDA_STUDY_BARRED_SANKRAMANA_SIGNS: frozenset[int] = frozenset({1, 4, 7, 10})


# ═════════════════════════════════════════════════════════════════════════════
# MANTRA_INITIATION — Ch. X, pp.61-62
# ═════════════════════════════════════════════════════════════════════════════
#
# **This chapter inverts the sign doctrine the other three share, and it inverts
# the book's most-repeated personal rule.** Both are stated plainly, on facing
# pages, and both are preserved. See `MANTRA_INITIATION_LAGNA_BEST` and
# `MANTRA_INITIATION_JANMA_TARA_FAVOURABLE` below.

# p.61: "The most fruitful asterisms for starting to learn a Manthra are:-
# Rohini, Ardhra, Punarvasu, Pushya, Magha, Utharapalguni, Hastha, Chithra,
# Swathi, Anu-radha, Jyeshta, Mula, Utharashada, Sravana, Sravishta,
# Utharabadhrapadha and Revathi."
MANTRA_INITIATION_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ROHINI", "THIRUVATHIRAI", "PUNARPOOSAM", "POOSAM", "MAGAM", "UTHIRAM",
    "HASTHAM", "CHITHIRAI", "SWATHI", "ANUSHAM", "KETTAI", "MOOLAM",
    "UTHIRADAM", "THIRUVONAM", "AVITTAM", "UTHIRATTATHI", "REVATHI",
)  # count = 17
# No closing clause follows, unlike all three of the other learning chapters.
MANTRA_INITIATION_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False

# Jyeshta and Mula are on this list and on no other favourable list in this
# module — the two chapters either side of it exclude both. Worth stating because
# they are among the book's most-feared stars elsewhere (Ch. V p.38 gives Jyeshta
# "loss of landed property" and Mula "ruin of family").
MANTRA_INITIATION_STARS_UNIQUE_TO_THIS_CHAPTER: frozenset[int] = _nak("KETTAI", "MOOLAM")

# p.61: "Avoid the Thithis,-Chathurthi, Ashtami and New-Moon ; reject Tuesday."
#
# "Avoid" with no softening clause — the same imperative form the registry grades
# a veto (Ch. XXI p.112, "Avoid Rikthai").
MANTRA_INITIATION_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 8})
MANTRA_INITIATION_TITHI_AVOID_PURNIMA: bool = False     # not named
MANTRA_INITIATION_TITHI_AVOID_AMAVASYA: bool = True

# p.61: "reject Tuesday." p.62: "the Sankaranthi day ... are beneficial, as also
# Wednesday."
#
# ONE GOOD DAY AND ONE BAD ONE — the narrowest weekday rule in the sourced
# doctrine. The other four days are simply not spoken about and score neutral.
MANTRA_INITIATION_VARA_GOOD: frozenset[str] = frozenset({"WEDNESDAY"})
MANTRA_INITIATION_VARA_AVOID: frozenset[str] = frozenset({"TUESDAY"})

# p.61: "Movable signs are good; Common signs are neutral; Fixed signs are
# useless for this function."
#
# **THE EXACT INVERSE OF THE OTHER THREE LEARNING CHAPTERS**, which put common
# best and movable middling (see `_SHARED_SIGN_NOTE`). Ch. X sits between Ch.
# VIII and Ch. XI in the same book and disagrees with both. Encoded as printed:
# the agreement of VI/VIII/XI is evidence precisely because it is not universal,
# and quietly extending it over Ch. X would destroy that evidence.
MANTRA_INITIATION_LAGNA_BEST: frozenset[int] = _MOVABLE_SIGNS
MANTRA_INITIATION_LAGNA_MIDDLING: frozenset[int] = _COMMON_SIGNS
MANTRA_INITIATION_LAGNA_AVOID: frozenset[int] = _FIXED_SIGNS

# p.62: "The 'asterism of the individual at birth' (Jenma-Nakshathra) and the
# 10th and 19th asterisms therefrom, the Sankaranthi day, i.e., the day of the
# Sun's transit from one sign into another, are beneficial, as also Wednesday."
#
# **THE JANMA / ANU-JENMA / THRI-JENMA TRIAD IS *BENEFICIAL* HERE.** Six other
# chapters prohibit exactly this triad — it is the book's most-repeated personal
# rule (see `muhurta_activity_registry._JANMA_TARA_NOTE`) — and this one commends
# it. The ordinals decode the same way they do everywhere else in this scan, from
# Ch. XVI p.92's spelled-out Anu-Jenma / Thri-Jenma; what is new is the polarity,
# and the word "beneficial" is not ambiguous in the transcription.
#
# **It is not the only such passage.** Ch. III p.32 offers the 10th tara —
# Anu-Jenma — as the fallback good day for the first milk feeding
# (`kalaprakasika_samskara_rules.MILK_FEEDING_FALLBACK_JANMA_TARA`). Two chapters
# thirty printed pages apart, both reversing the same rule, is much harder to
# read as a transcription slip than either would be alone.
#
# This is a source-specific exemption from the general janma-tara bar, not a
# favourable-score boost. The activity registry applies it only to mantra
# initiation (apavada > utsarga).
MANTRA_INITIATION_JANMA_TARA_FAVOURABLE: frozenset[int] = frozenset({1, 10, 19})
MANTRA_INITIATION_SANKRAMANA_DAY_IS_FAVOURABLE: bool = True     # p.62

# p.61, sourced and unscored.
MANTRA_INITIATION_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True
# p.61: "No Manthra should be commenced during the months of Ashada,
# Badhrapadha, Margasira and Magha which are known as Pithur-Masa."
MANTRA_INITIATION_BARRED_LUNAR_MONTHS: tuple[str, ...] = (
    "ASHADA", "BADHRAPADHA", "MARGASIRA", "MAGHA",
)
# p.61, the per-month effect table. Display copy, not a second score.
MANTRA_INITIATION_MONTH_EFFECTS: dict[str, str] = {
    "CHYTHRA": "produces great misery",
    "VYSAKHA": "brings gain of gems",
    "JYESHTA": "is fatal",
    "ASHADA": "seriously affects relations",
    "SRAVANA": "indicates exalted status",
    "BADHRAPADHA": "leads to loss of children",
    "ASWAYUJA": "shows well-being",
    "KRITHIKA": "favours mental development",
    "MARGASIRA": "produces evil",
    "PUSHYA": "inclines to ruin the intellect",
    "MAGHA": "tends to intellectual growth",
    "PALGUNA": "makes the disciple liked and loved by all",
}
# pp.62-64, the Siddha Chakra: a 4x4 square test matching the first letter of the
# devotee's NAME against the first letter of the mantra. Recorded as a chapter
# feature and out of scope for a day-scorer — it selects a mantra, not a moment.
MANTRA_INITIATION_SIDDHA_CHAKRA_IS_NAME_BASED: bool = True


# ═════════════════════════════════════════════════════════════════════════════
# SNAANA — the Samavarthanam bath, Ch. XII, pp.67-68
# ═════════════════════════════════════════════════════════════════════════════
#
# Samavarthanam is the set of rites closing Brahmacharya before marriage. The
# chapter has two halves: "The rules for the selection of an auspicious time for
# Vrutham are the same as those for Tonsure" (p.68) — a cross-reference, not a
# rule set — and then its own tables for the Snaana (bath), which are what is
# extracted here.

# p.68: "The following asterisms are good for the Snaana (bath) Karma :-Rohini,
# Mrigasirsha, Punarvasu, Pushya, Hastha, Anuradha, Utharashada, Sravana,
# Utharabadhrapadha and Revathi."
SNAANA_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ROHINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "POOSAM", "HASTHAM", "ANUSHAM",
    "UTHIRADAM", "THIRUVONAM", "UTHIRATTATHI", "REVATHI",
)  # count = 10
# p.68: "The other asterisms should be avoided."
SNAANA_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = True
# p.68: "Asterism Swathi is commended by some astrologers." Attributed dissent —
# recorded, not applied. Note that the list it would join is CLOSED, so applying
# it would not merely add a star but contradict the closing clause.
SNAANA_NAKSHATRA_DISPUTED_AS_BEST: frozenset[int] = _nak("SWATHI")

# p.68: "The fruitful Thithis are:- Dhwithiyai, Thrithiyai, Panchami, Sapthami,
# Dhasami and Ekadhasi. Thrayodhasi is also excellent."
SNAANA_TITHI_BEST_IN_PAKSHA: frozenset[int] = frozenset({2, 3, 5, 7, 10, 11, 13})
# p.68: "Avoid Rikthai, Prathamai, Ashtami, Full-Moon and New-Moon days."
# Rikthai is in-paksha 4, 9 and 14, by this book's own definition.
SNAANA_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({1, 4, 8, 9, 14})
SNAANA_TITHI_AVOID_PURNIMA: bool = True
SNAANA_TITHI_AVOID_AMAVASYA: bool = True
# p.68: "Some writers commend Dhwadhasi as auspicious." Dissent, not applied.
SNAANA_TITHI_DISPUTED_AS_BEST: frozenset[int] = frozenset({12})
# p.68: "Shashti is considered favourable to kings." A caste- or rank-limited
# permission, like Ch. V p.38's caste exception to the malefic weekdays. Recorded
# and not applied: the picker does not know who the subject is.
SNAANA_TITHI_FAVOURABLE_TO_KINGS: frozenset[int] = frozenset({6})

# p.68: "Sunday, Monday, Wednesday, Thursday and Friday are auspicious for the
# Snaana; Saturday and Tuesday are unfavourable."
#
# SUNDAY IS AUSPICIOUS HERE — the only place in the sourced doctrine where it is
# named among the good days outright. Five good days is also the widest weekday
# permission in the book.
SNAANA_VARA_GOOD: frozenset[str] = frozenset(
    {"SUNDAY", "MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"}
)
SNAANA_VARA_AVOID: frozenset[str] = frozenset({"SATURDAY", "TUESDAY"})

# p.68: "The signs Taurus, Gemini, Virgo, Libra, Capricorn and Pisces produce
# good ; the other signs prove beneficial for Snaana when occupied by a benefic
# planet."
#
# The remaining six are approved only on a condition a sunrise lagna cannot
# check, so they are conditional rather than avoided — the same shape Namakarana
# uses for its common signs (Ch. III p.31).
SNAANA_LAGNA_BEST: frozenset[int] = frozenset({2, 3, 6, 7, 10, 12})
SNAANA_LAGNA_CONDITIONAL: frozenset[int] = frozenset({1, 4, 5, 8, 9, 11})

# p.68, sourced and unscored.
SNAANA_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True
SNAANA_MUST_PRECEDE_THE_MARRIAGE: bool = True
# p.68: "The rules for the selection of an auspicious time for Vrutham are the
# same as those for Tonsure." A CROSS-REFERENCE TO A DIFFERENT RITE within the
# same ceremony. Recorded, and deliberately not turned into a second activity:
# the Vrutham has no tables of its own, and cloning TONSURE's under another name
# would present one rule set as two independent confirmations.
SNAANA_VRUTHAM_FOLLOWS_TONSURE_RULES: bool = True


# =============================================================================
# RULE_SOURCES
# =============================================================================

def _authority(chapter: str, page: int, passage: str, term: str | None = None) -> Authority:
    return Authority(
        tradition=_TRADITION,
        chapter=chapter,
        page=page,
        verse_or_passage=passage,
        translation_edition=_EDITION,
        original_language_term=term,
    )


def _textual(
    rule_id: str,
    factor: str,
    activity: str,
    chapter: str,
    page: int,
    passage: str,
    interpretation: str,
    *,
    outcome: VerificationOutcome = VerificationOutcome.CONFIRMED_EXACT,
    scope: str | None = None,
    notes: str | None = None,
    confidence: SourceConfidence = SourceConfidence.EXACT,
    term: str | None = None,
) -> RuleSource:
    return RuleSource(
        rule_id=rule_id,
        factor=factor,
        activity=activity,
        authority=_authority(chapter, page, passage, term),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope=scope or activity,
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=confidence,
        outcome=outcome,
        interpretation=interpretation,
        notes=notes,
        verified_on=_VERIFIED_ON,
        verified_by=_VERIFIED_BY,
    )


_SHARED_SIGN_NOTE = (
    "All three learning chapters (VI p.42, VIII p.55, XI p.65) state this same "
    "common-best / movable-middling / fixed-rejected doctrine. Three independent "
    "statements across seventy printed pages, and the only sign rule in the book "
    "repeated verbatim across chapters."
)

RULE_SOURCES: dict[str, RuleSource] = {
    # ── Vidyarambham (Ch. VI) ───────────────────────────────────────────────
    "KP_CH6_VIDYARAMBHAM_NAKSHATRA_001": _textual(
        "KP_CH6_VIDYARAMBHAM_NAKSHATRA_001", "NAKSHATRA", "VIDYARAMBHAM", "VI", 41,
        "The following asterisms are favourable:- Aswini, Ardhra, Punarvasu, Hastha, Chithra, "
        "Swathi, Anuradha, Sravana and Revathi. The remaining asterisms should be avoided.",
        "9 favourable, and the closing clause CLOSES the list — an unlisted star is excluded "
        "rather than merely unmentioned.",
    ),
    "KP_CH6_VIDYARAMBHAM_TITHI_001": _textual(
        "KP_CH6_VIDYARAMBHAM_TITHI_001", "TITHI", "VIDYARAMBHAM", "VI", 41,
        "The bright fortnight and the first five Thithis of the dark fortnight are good. All "
        "Thithis are good except Prathamai, Chathurthi, Shashti, Ashtami, Navami, Chathurdasi, "
        "the Full Moon and the New-Moon days",
        "An exclusion rule: avoid 1/4/6/8/9/14 plus both luminary days, and every other tithi "
        "is positively good.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "INTERNAL TENSION, recorded not reconciled: the first sentence calls the dark "
            "fortnight's opening five good — Prathamai among them — and the second bans "
            "Prathamai outright. The tithi ban is the more specific statement and wins, so the "
            "encoded paksha exemption runs 2-5 and omits Prathamai, leaving the two rules "
            "unable to contradict each other on any real day."
        ),
    ),
    "KP_CH6_VIDYARAMBHAM_VARA_001": _textual(
        "KP_CH6_VIDYARAMBHAM_VARA_001", "VARA", "VIDYARAMBHAM", "VI", 42,
        "Wednesday, Thursday and Friday are auspicious ; Sunday and Monday are pretty "
        "favourable ; Tuesday and Saturday are bad. Some astrologers reject Sunday also.",
        "Three good, two bad, two middling. This THREE-tier weekday shape is the learning "
        "chapters' own and appears nowhere else in the book, where Mon/Wed/Thu/Fri good and "
        "Sun/Tue/Sat bad is otherwise near-universal.",
        notes="Sunday and Monday are left unscored rather than credited; the dissent on Sunday "
              "is recorded and not applied.",
    ),
    "KP_CH6_VIDYARAMBHAM_LAGNA_001": _textual(
        "KP_CH6_VIDYARAMBHAM_LAGNA_001", "MUHURTA_LAGNA_SIGN", "VIDYARAMBHAM", "VI", 42,
        "The common signs such as Gemini, Virgo, Sagittari and Pisces are fruitful. Movable "
        "signs are neutral. Fixed signs should be totally avoided.",
        "A complete 12-sign partition into common/movable/fixed. Note this INVERTS Namakarana "
        "(Ch. III p.31), which calls the fixed signs best — per-activity, never global.",
        notes=_SHARED_SIGN_NOTE,
    ),
    "KP_CH6_VIDYARAMBHAM_KARANA_001": _textual(
        "KP_CH6_VIDYARAMBHAM_KARANA_001", "KARANA", "VIDYARAMBHAM", "VI", 42,
        "Sthira-karana such as Sakunam should be avoided as also Vishti-karana.",
        "The Sthira class and Vishti prohibited. The class membership is not enumerated here — "
        "it comes from Ch. XXI p.110, which spells the four out.",
        notes=(
            "One of five passages banning this same pairing (Ch. III p.32, VI p.42, XVIII p.99, "
            "XX p.105, XXI p.110), which is what makes the Sthira expansion safe."
        ),
    ),
    "KP_CH6_VIDYARAMBHAM_TIMING_001": _textual(
        "KP_CH6_VIDYARAMBHAM_TIMING_001", "YEARS_FROM_BIRTH", "VIDYARAMBHAM", "VI", 41,
        "This should be done in the fifth year of the boy, and during the northern course of "
        "the Sun; only, avoid the month when the Sun is in Aquarius. The study of the alphabet "
        "should be started before Upanayanam.",
        "Year 5, Utharayana, excluding the Aquarius solar month, and before Upanayanam.",
        notes="NOT IMPLEMENTED — no birth date, ayana or solar-month field on the day snapshot.",
    ),
    # ── Education (Ch. VIII) ────────────────────────────────────────────────
    "KP_CH8_EDUCATION_NAKSHATRA_001": _textual(
        "KP_CH8_EDUCATION_NAKSHATRA_001", "NAKSHATRA", "EDUCATION_START", "VIII", 53,
        "The following are the most fruitful asterisms for commencing education:- Mrigasirsha, "
        "Ardhra, Punarvasu, Pushya, Hastha, Chithra, Swathi, Sravana, Sravishta and Sathabis. "
        "The neutral asterisms are:- Aswini, Rohini, Utharapalguni, Utharashada and "
        "Utharabadhrapadha and Revathi. Some writers commend Aswini as one of the best "
        "asterisms. The remaining asterisms should be avoided.",
        "TWO tiers and a closed list: 10 most fruitful, 6 explicitly neutral, 11 remaining and "
        "excluded. The neutral six are named and so score neutral, distinct from the excluded "
        "eleven — a gap the engine would erase if both fell through to one penalty.",
        notes="The promotion of Aswini is attributed to 'some writers' and is recorded, not "
              "applied.",
    ),
    "KP_CH8_EDUCATION_TITHI_001": _textual(
        "KP_CH8_EDUCATION_TITHI_001", "TITHI", "EDUCATION_START", "VIII", 54,
        "The following Thithis are auspicious:- Prathamai, (of the dark half of the lunar "
        "month) Dhwithiyai, Thrithyai, Panchami, Shashti, Dhasami, and Ekadhasi. Avoid "
        "Chathurthi, Navami, Ashtami, Chathurdhasi, Full-Moon and New-Moon days. The remaining "
        "Thithis are neutral.",
        "Best 1/2/3/5/6/10/11; avoid 4/8/9/14 plus both luminary days; the rest explicitly "
        "neutral, so this list is NOT exhaustive even though the star list in the same chapter "
        "is.",
        outcome=VerificationOutcome.PARTIAL,
        notes=(
            "Prathamai carries a paksha qualifier — 'of the dark half' — that the registry's "
            "flat tithi shape cannot express. It is encoded in the best set and the restriction "
            "recorded in EDUCATION_TITHI_PRATHAMAI_IS_KRISHNA_ONLY, so a bright-fortnight "
            "Prathamai is currently credited slightly wider than the text allows."
        ),
    ),
    "KP_CH8_EDUCATION_VARA_001": _textual(
        "KP_CH8_EDUCATION_VARA_001", "VARA", "EDUCATION_START", "VIII", 54,
        "Take care to avoid Saturday and Tuesday and the Amsas of Saturn and Mars. Sundsy "
        "prolongs life; Monday makes the student dull; Tuesday brings death; Wednesday favours "
        "intelligence and insight (Pragna). Thursday bestows good sense; Friday produces "
        "success; Saturday shows incapacity.",
        "The instruction sentence names only Saturday and Tuesday to avoid, and the effect "
        "table beside it grades all seven. Only the instruction is scored.",
        notes=(
            "Monday 'makes the student dull' reads adverse and Sunday 'prolongs life' reads "
            "favourable, but neither is in the chapter's own avoid or good sentence. Scoring "
            "them off the effect table would be our inference rather than the chapter's rule, "
            "so the table is recorded in EDUCATION_VARA_EFFECTS and left unscored. p.55 then "
            "carries a dissent against its own Sunday reading."
        ),
    ),
    "KP_CH8_EDUCATION_LAGNA_001": _textual(
        "KP_CH8_EDUCATION_LAGNA_001", "MUHURTA_LAGNA_SIGN", "EDUCATION_START", "VIII", 55,
        "The Common signs are the best. Movable signs are of middling quality. Fixed signs are "
        "bad.",
        "Common best, movable middling, fixed bad — a complete partition.",
        notes=_SHARED_SIGN_NOTE,
    ),
    "KP_CH8_EDUCATION_SUBJECT_001": _textual(
        "KP_CH8_EDUCATION_SUBJECT_001", "NAKSHATRA", "EDUCATION_START", "VIII", 54,
        "Rohini, Mrigasirsha. Punarvasu, Pushya, Hastha, Anuradha, Sravishta and Revathi are "
        "favourable asterisms to commence the study of Vyakarna (Grammar). [and four further "
        "per-subject lists for Tharka, Jyotisha, all Sastras, and Ayur-Veda/Dhanur-Veda]",
        "FIVE per-subject star lists beneath the chapter's general one. Recorded and NOT wired: "
        "the picker asks what day, not what subject, and merging five lists into one would "
        "erase the distinction the chapter drew.",
        notes=(
            "Held in EDUCATION_SUBJECT_NAKSHATRA. A future 'what are you studying?' input could "
            "wire these without a second trip to the page."
        ),
    ),
    "KP_CH8_EDUCATION_YOGA_001": _textual(
        "KP_CH8_EDUCATION_YOGA_001", "YOGA", "EDUCATION_START", "VIII", 55,
        "I proceed to describe Saaraswatha Yoga which is very highly commended for starting the "
        "study of the Vedas. This Yoga is variously formed as delineated below [ten numbered "
        "forms follow, pp.55-56]. Vidhya-Yoga [four further forms, p.57].",
        "Saaraswatha Yoga in ten stated forms and Vidhya-Yoga in four — the largest named-yoga "
        "set in the book for any single activity.",
        notes="NOT IMPLEMENTED — every form needs muhurta-moment vargas, houses or exact "
              "degrees of exaltation.",
        term="Saaraswatha Yoga, Vidhya-Yoga",
    ),
    # ── Veda study (Ch. XI) ─────────────────────────────────────────────────
    "KP_CH11_VEDA_STUDY_NAKSHATRA_001": _textual(
        "KP_CH11_VEDA_STUDY_NAKSHATRA_001", "NAKSHATRA", "VEDA_STUDY", "XI", 65,
        "To start the much-esteemed study of the Vedas, choose the following asterisms, which "
        "are favourable:- Mrigasirsha, Ardhra, Punarvasu, Pushya, Hastha, Chithra, Swathi. "
        "Anuradha, Sravana, Sravishta and Sathabis. The following asterisms are neutral:- "
        "Aswini. Rohini, Utharapalguni, Utharashada, Utharabadhrapadha and Revathi. The "
        "remaining asterisms should be avoided.",
        "11 favourable, 6 neutral, 10 excluded. The favourable list is Ch. VIII's ten plus "
        "Anuradha, and the neutral six are IDENTICAL to Ch. VIII's — two chapters twelve pages "
        "apart agreeing on a six-star tier is strong evidence both were transcribed correctly.",
        notes="The Aswini promotion is attributed to 'some writers' and recorded, not applied.",
    ),
    "KP_CH11_VEDA_STUDY_TITHI_001": _textual(
        "KP_CH11_VEDA_STUDY_TITHI_001", "TITHI", "VEDA_STUDY", "XI", 65,
        "Among Thithis, Sapthami and Thrayodhasi are neutral; Prathamai, Chathurthi, Ashtami, "
        "Navami, Dhwadhasi, Full-Moon and New-Moon days should be avoided. The other Thithis "
        "are excellent.",
        "Avoid 1/4/8/9/12 plus both luminary days; 7 and 13 explicitly neutral; everything else "
        "positively excellent. An exclusion rule with a named middling tier inside it.",
    ),
    "KP_CH11_VEDA_STUDY_VARA_001": _textual(
        "KP_CH11_VEDA_STUDY_VARA_001", "VARA", "VEDA_STUDY", "XI", 65,
        "Wednesday, Thursday and Friday and the moments when Mercury, Jupiter and Venus are the "
        "lords of the rising Navamsa are good. Sunday and Monday and the moments when the Sun "
        "and the Moon are the lords of the rising Navamsa are neutral. Avoid Saturday and "
        "Tuesday and the Amsas and associations of Saturn and Mars.",
        "The same three-tier weekday shape as Ch. VI and Ch. VIII, stated a third time.",
    ),
    "KP_CH11_VEDA_STUDY_LAGNA_001": _textual(
        "KP_CH11_VEDA_STUDY_LAGNA_001", "MUHURTA_LAGNA_SIGN", "VEDA_STUDY", "XI", 65,
        "Common signs are auspicious; Movable signs are neutral; Fixed signs are not to be "
        "considered.",
        "Common auspicious, movable neutral, fixed rejected — the third statement of the "
        "learning-chapter sign doctrine.",
        notes=_SHARED_SIGN_NOTE,
    ),
    "KP_CH11_VEDA_STUDY_PRADHOSHAM_001": _textual(
        "KP_CH11_VEDA_STUDY_PRADHOSHAM_001", "TITHI_TRANSITION", "VEDA_STUDY", "XI", 66,
        "Chathurthi, Sapthami and Thrayodhasi should be avoided if the duration of any of these "
        "extends till mid-night... If Chathurthi lasts till nine Ghatikas in the night, what is "
        "known as Pradhosham is formed. Pradhosham is fatal to the study of the Vedas.",
        "Three tithis become prohibited CONDITIONALLY — only when they run past a stated point "
        "of the night. A sub-day rule keyed to the tithi's end time rather than to the day.",
        notes=(
            "NOT IMPLEMENTED. The snapshot does carry `tithi_ends_at`, so unlike the other "
            "sub-day gaps this one is reachable; it needs a ghatika-to-clock conversion against "
            "local nightfall, which is a window-layer change and out of this pass."
        ),
        term="Pradhosham",
    ),
    # ── Ch. X — initiation in a mantra ──────────────────────────────────────
    "KP_CH10_MANTRA_NAKSHATRA_001": _textual(
        "KP_CH10_MANTRA_NAKSHATRA_001", "NAKSHATRA", "MANTRA_INITIATION", "X", 61,
        "The most fruitful asterisms for starting to learn a Manthra are:-Rohini, Ardhra, "
        "Punarvasu, Pushya, Magha, Utharapalguni, Hastha, Chithra, Swathi, Anu-radha, Jyeshta, "
        "Mula, Utharashada, Sravana, Sravishta, Utharabadhrapadha and Revathi.",
        "17 stars, with no closing clause — the only open star list among the four learning "
        "chapters, all three of the others being closed by 'The remaining asterisms should be "
        "avoided'.",
        notes=(
            "Jyeshta and Mula appear here and on no other favourable list in this module, and "
            "the chapters either side exclude both. Elsewhere in the book they are among the "
            "most feared stars — Ch. V p.38 gives Jyeshta 'loss of landed property' and Mula "
            "'ruin of family'. A mantra initiation is not a worldly undertaking, which may be "
            "the reason; the text does not say so, and nothing here assumes it."
        ),
    ),
    "KP_CH10_MANTRA_TITHI_001": _textual(
        "KP_CH10_MANTRA_TITHI_001", "TITHI", "MANTRA_INITIATION", "X", 61,
        "Avoid the Thithis,-Chathurthi, Ashtami and New-Moon ; reject Tuesday.",
        "Chathurthi, Ashtami and Amavasya prohibited. 'Avoid' with no softening clause is the "
        "imperative form the registry grades a veto, matching Ch. XXI p.112's 'Avoid Rikthai'.",
        notes="Purnima is not named, unusually — six other chapters ban it.",
    ),
    "KP_CH10_MANTRA_VARA_001": _textual(
        "KP_CH10_MANTRA_VARA_001", "VARA", "MANTRA_INITIATION", "X", 61,
        "reject Tuesday. ... The 'asterism of the individual at birth' (Jenma-Nakshathra) and "
        "the 10th and 19th asterisms therefrom. the Sankaranthi day, i.e., the day of the Sun's "
        "transit from one sign into another, are beneficial, as also Wednesday.",
        "One good day and one bad one — the narrowest weekday rule in the sourced doctrine. The "
        "other five are not spoken about and score neutral.",
    ),
    "KP_CH10_MANTRA_LAGNA_001": _textual(
        "KP_CH10_MANTRA_LAGNA_001", "MUHURTA_LAGNA_SIGN", "MANTRA_INITIATION", "X", 61,
        "Movable signs are good; Common signs are neutral ; Fixed signs are useless for this "
        "function.",
        "Movable best, common middling, fixed rejected — THE EXACT INVERSE of the doctrine Ch. "
        "VI, VIII and XI state three times over.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "Ch. X sits between Ch. VIII and Ch. XI in the same book and disagrees with both, "
            "swapping the best and middling tiers while keeping the same rejected one. Encoded "
            "as printed. The agreement of VI/VIII/XI is evidence of a subject-level doctrine "
            "precisely because it is not universal across the book, and extending it silently "
            "over Ch. X would destroy the very thing that made it evidence."
        ),
    ),
    "KP_CH10_MANTRA_JANMA_TARA_001": _textual(
        "KP_CH10_MANTRA_JANMA_TARA_001", "JANMA_TARA_COUNT", "MANTRA_INITIATION", "X", 62,
        "The 'asterism of the individual at birth' (Jenma-Nakshathra) and the 10th and 19th "
        "asterisms therefrom. the Sankaranthi day, i.e.. the day of the Sun's transit from one "
        "sign into another, are beneficial, as also Wednesday.",
        "THE JANMA / ANU-JENMA / THRI-JENMA TRIAD IS CALLED BENEFICIAL. Six other chapters "
        "prohibit exactly this triad — it is the book's most-repeated personal rule — and this "
        "one commends it.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        confidence=SourceConfidence.INTERPRETED,
        notes=(
            "NOT SCORED IN EITHER DIRECTION, and raised for the astrologer rather than resolved "
            "here. The ordinals decode exactly as they do in the six prohibiting chapters, from "
            "Ch. XVI p.92's spelled-out Anu-Jenma / Thri-Jenma; the word 'beneficial' is not "
            "ambiguous in the transcription. What is missing is an engine shape: the "
            "janma-tara field is a prohibition set, and adding a 'favourable count' field to "
            "score one inverted passage would build machinery around the least corroborated "
            "reading in the chapter. Held in MANTRA_INITIATION_JANMA_TARA_FAVOURABLE."
        ),
    ),
    # ── Ch. XII — the Samavarthanam bath ────────────────────────────────────
    "KP_CH12_SNAANA_NAKSHATRA_001": _textual(
        "KP_CH12_SNAANA_NAKSHATRA_001", "NAKSHATRA", "SNAANA", "XII", 68,
        "The following asterisms are good for the Snaana (bath) Karma :-Rohini, Mrigasirsha, "
        "Punarvasu, Pushya, Hastha, Anuradha, Utharashada, Sravana, Utharabadhrapadha and "
        "Revathi. Asterism Swathi is commended by some astrologers. The other asterisms should "
        "be avoided.",
        "10 stars, closed by 'The other asterisms should be avoided'.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "The Swathi dissent is recorded and not applied. It is a sharper case than the "
            "other attributed dissents in this repo, because the list it would join is CLOSED: "
            "applying it would not merely widen a list, it would contradict the closing clause "
            "in the same breath."
        ),
    ),
    "KP_CH12_SNAANA_TITHI_001": _textual(
        "KP_CH12_SNAANA_TITHI_001", "TITHI", "SNAANA", "XII", 68,
        "The fruitful Thithis are:- Dhwithiyai, Thrithiyai, Panchami, Sapthami, Dhasami and "
        "Ekadhasi. Thrayodhasi is also excellent. Some writers commend Dhwadhasi as auspicious. "
        "Shashti is considered favourable to kings. Avoid Rikthai, Prathamai, Ashtami, "
        "Full-Moon and New-Moon days.",
        "Seven fruitful tithis; Rikthai (4, 9, 14), Prathamai, Ashtami, Purnima and Amavasya "
        "prohibited. 'Avoid' is the imperative the registry grades a veto.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "Two qualifications are recorded and neither is applied: the Dhwadhasi dissent, and "
            "Shashti's rank-limited permission. The latter is the same shape as Ch. V p.38's "
            "caste exception to the malefic weekdays — the picker does not know who the subject "
            "is, so a permission granted to kings cannot be granted to everyone."
        ),
    ),
    "KP_CH12_SNAANA_VARA_001": _textual(
        "KP_CH12_SNAANA_VARA_001", "VARA", "SNAANA", "XII", 68,
        "Sunday, Monday, Wednesday, Thursday and Friday are auspicious for the Snaana; Saturday "
        "and Tuesday are unfavourable.",
        "SUNDAY IS AUSPICIOUS — the only place in the sourced doctrine where it is named good "
        "outright — and five good days is the widest weekday permission in the book. Both tiers "
        "are stated explicitly, so this is the chapter's position and not an omission.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "Elsewhere Sunday is either avoided (Ch. III, IV, V, XVII, XX) or called middling "
            "(Ch. VI, VIII, XI). Preserved rather than harmonised, on the same principle as Ch. "
            "XX's Saturday and Ch. XIX's Tuesday."
        ),
    ),
    "KP_CH12_SNAANA_LAGNA_001": _textual(
        "KP_CH12_SNAANA_LAGNA_001", "MUHURTA_LAGNA_SIGN", "SNAANA", "XII", 68,
        "The signs Taurus, Gemini, Virgo, Libra, Capricorn and Pisces produce good ; the other "
        "signs prove beneficial for Snaana when occupied by a benefic planet.",
        "Six signs good outright; the other six are approved only on a condition a sunrise "
        "lagna cannot check, so they score neutral with the condition named rather than being "
        "credited or penalised.",
        notes=(
            "The same shape as Namakarana's common signs (Ch. III p.31), and the reason the "
            "registry has a conditional lagna tier at all: reading 'beneficial when occupied by "
            "a benefic' as plain approval would credit six signs on an unchecked premise."
        ),
    ),
}
