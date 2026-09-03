"""Kalaprakasika Ch. XIX & XXII — working the land, and eating its first crop.

Sourced from N. P. Subramania Iyer's Kalaprakasika translation (Asian
Educational Services 1982 reprint of the 1917 first edition), extracted
2026-08-15 from the page-by-page transcription of the 150-page scan supplied by
the repository owner. Worksheet:
`docs/sources/kalaprakasika_agriculture_rules.md`.

* **Entering the land** to begin the season's work — Ch. XIX, printed p. 100
* **Tillage** / first ploughing — Ch. XIX, printed pp. 100-102
* **Sowing** — Ch. XIX, printed pp. 102-105
* **The first meal of new grain** — Ch. XXII, printed pp. 114-115

Page numbers are **printed book pages**; PDF page = printed page + 32.

**Ch. XIX contradicts itself on the rising sign, and the contradiction is
recorded rather than resolved.** Under the "TILLAGE" heading p.100 opens
*"Taurus, Virgo and Scorpio produce good"*; one page later the same rite is
given a full three-tier partition that **avoids Scorpio** and grades Virgo only
middling. The tie-breaker is the chapter's own per-sign gloss on p.101, which
says Scorpio *"threatens to cause damage to the crops by fire"* — it agrees with
the partition and against the opening sentence. So the partition is what scores,
and the opening sentence is held in `TILLAGE_LAGNA_OPENING_SENTENCE` with the
disagreement stated. Nothing is harmonised: both readings survive in the data.

**Three weekday findings that break the book's near-universal pattern.**
Mon/Wed/Thu/Fri good, Sun/Tue/Sat bad holds across almost every chapter here.
Ch. XIX does not follow it:

* entering the land (p.100) names **Tuesday among the four auspicious days**,
  and omits Friday entirely;
* it then adds **Saturday** as an attributed dissent, which is recorded and not
  applied;
* sowing (p.104) says Sunday, Tuesday and Saturday are *"favourable only to a
  particular kind of agricultural work"* — a qualified permission, not a
  prohibition, so those three are **not** put in any avoid set.

**Ch. XXII disputes its own sign rule in the same paragraph.** It avoids Aries,
Scorpio and Pisces, then reports that *"the last sign is however the most
felicitous for a meal of the first crops, according to Devaratha"*. Attributed
dissent: recorded, never applied, and the avoidance stands.

**The sun-relative and Venus-relative star counts are not scored.** Ch. XIX
selects tillage stars by counting from the star the **Sun** occupies (p.101) and
sowing days by counting from the star **Venus** occupies (pp.104-105). Both are
real rules and both are recorded; neither is wired, because the engine's only
star-counting factor counts from a subject's birth star and re-pointing it at a
graha would be a new factor rather than a use of an existing one.

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
_VERIFIED_BY = "primary-text transcription pp.100-105, 114-115 (user-supplied scan)"


def _nak(*names: str) -> frozenset[int]:
    """Canonical 1..27 nakshatra numbers for this repo's Tamil-transliterated
    keys — never a second name list."""
    return frozenset(NAKSHATRA_NAMES.index(name) + 1 for name in names)


# 1=Aries..12=Pisces.
_FIXED_SIGNS = frozenset({2, 5, 8, 11})
_COMMON_SIGNS = frozenset({3, 6, 9, 12})
_MOVABLE_SIGNS = frozenset({1, 4, 7, 10})

# "Badhrai is the word used to denote Dhwitiyai, Sapthami and Dhwadhasi Thithis"
# — the chapter's own footnote on p.100.
_BADHRAI_IN_PAKSHA = frozenset({2, 7, 12})


# ═════════════════════════════════════════════════════════════════════════════
# AGRICULTURE_START — setting foot on the land, Ch. XIX p.100
# ═════════════════════════════════════════════════════════════════════════════
#
# The chapter makes this a distinct rite: "The first step in this matter is to
# select an auspicious day on which the owner may set his foot on his land for
# the purpose. Then follow ploughing and other operations."

# p.100: "The best asterisms under which the owner may enter into his land to
# start agricultural work are:- Bharani, Ardhra, Pushya, Magha, Utharapalguni,
# Chithra, Swathi, Anuradha, Utharashada and Utharabadhrapadha."
AGRICULTURE_START_NAKSHATRA_BEST: frozenset[int] = _nak(
    "BHARANI", "THIRUVATHIRAI", "POOSAM", "MAGAM", "UTHIRAM", "CHITHIRAI",
    "SWATHI", "ANUSHAM", "UTHIRADAM", "UTHIRATTATHI",
)  # count = 10
AGRICULTURE_START_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False   # no closing clause

# p.100: "All odd Thithis (Prathamai, Thrithiyai, Panchami, Sapthami, Navami,
# Ekadhasi and Thrayodhasi) except Navami are favourable. The even Thithis except
# Dhwithiyai and Dhasami should be avoided."
#
# The enumeration the sentence supplies stops at 13 and at 14 — it never reaches
# Purnima and never mentions Amavasya, so neither is ranked here and neither is
# banned. Navami is struck off the favourable list but is not put in the avoid
# list either; the same is true of Dwithiyai and Dhasami, which merely escape the
# even-tithi avoidance. Those three score as unnamed days, which is what the
# sentence actually says about them.
AGRICULTURE_START_TITHI_BEST_IN_PAKSHA: frozenset[int] = frozenset({1, 3, 5, 7, 11, 13})
AGRICULTURE_START_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 6, 8, 12, 14})
AGRICULTURE_START_TITHI_AVOID_PURNIMA: bool = False
AGRICULTURE_START_TITHI_AVOID_AMAVASYA: bool = False
AGRICULTURE_START_TITHI_UNRANKED: frozenset[int] = frozenset({2, 9, 10})

# p.100: "Some astrologers condemn Badhrai." Attributed dissent — recorded, not
# applied. It contradicts the sentence directly above it: Sapthami is Badhrai and
# is also on this rite's favourable list.
AGRICULTURE_START_BADHRAI_DISPUTED: frozenset[int] = _BADHRAI_IN_PAKSHA

# p.100: "Monday, Tuesday, Wednesday and Thursday are auspicious. Saturday also
# is recommended by some."
#
# TUESDAY IS AUSPICIOUS HERE and Friday is not named at all — an inversion of the
# Mon/Wed/Thu/Fri set almost every other chapter in this repo states. Encoded as
# printed. No adverse day is named, so nothing goes in the avoid set.
AGRICULTURE_START_VARA_GOOD: frozenset[str] = frozenset(
    {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"}
)
AGRICULTURE_START_VARA_AVOID: frozenset[str] = frozenset()      # none named
AGRICULTURE_START_SATURDAY_DISPUTED: bool = True                # "recommended by some"


# ═════════════════════════════════════════════════════════════════════════════
# TILLAGE — ploughing, Ch. XIX pp.100-102
# ═════════════════════════════════════════════════════════════════════════════

# p.101: "The beneficent asterisms are:-Rohini, Punarvasu, Pushya,
# Utharapalguni, Hastha, Anuradha, Mula, Utharashada and Utharabadhrapadha."
TILLAGE_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ROHINI", "PUNARPOOSAM", "POOSAM", "UTHIRAM", "HASTHAM", "ANUSHAM",
    "MOOLAM", "UTHIRADAM", "UTHIRATTATHI",
)  # count = 9
TILLAGE_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False

# p.101: "Aswini, Mrigasirsha, Magha, Chithra, Swathi, Visakha, Sravana,
# Sravishta and Sathabis are also considered auspicious by some astrologers."
#
# ATTRIBUTED DISSENT — recorded and NOT applied, per this repo's standing rule.
# It matters that it is not applied: nine stars is as many as the chapter's own
# list, so honouring it would double the favourable set on an attribution the
# chapter declines to adopt.
TILLAGE_NAKSHATRA_DISPUTED_ADDITIONS: frozenset[int] = _nak(
    "ASWINI", "MIRUGASEERIDAM", "MAGAM", "CHITHIRAI", "SWATHI", "VISAKAM",
    "THIRUVONAM", "AVITTAM", "SADAYAM",
)  # count = 9

# p.101: "For commencing tillage choose the 3rd, 4th, 5th, 6th, 7th, 11th, 12th,
# 13th, 14th, 15th, 19th, 20th, 24th, 25th and 26th asterisms from the one
# occupied by the Sun on the day in question. All other asterisms produce evil."
#
# p.102 then qualifies it: "Avoid the six asterisms from the one occupied by the
# Sun, for they cause affliction to the bullocks; asterisms thirteen to eighteen
# therefrom (both inclusive), affect the landlord adversely."
#
# Counted from the SUN's star, not from a birth star. Recorded, NOT scored — see
# the module docstring.
TILLAGE_SURYA_TARA_FAVOURABLE: frozenset[int] = frozenset(
    {3, 4, 5, 6, 7, 11, 12, 13, 14, 15, 19, 20, 24, 25, 26}
)
TILLAGE_SURYA_TARA_HARMS_BULLOCKS: frozenset[int] = frozenset({1, 2, 3, 4, 5, 6})
TILLAGE_SURYA_TARA_HARMS_LANDLORD: frozenset[int] = frozenset({13, 14, 15, 16, 17, 18})

# p.101: "All Thithis except Chathurthi, Shashti, Ashtami, Navami, Dhwadhasi,
# Chathurdhasi Full-Moon and New-Moon days are good."
TILLAGE_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 6, 8, 9, 12, 14})
TILLAGE_TITHI_AVOID_PURNIMA: bool = True
TILLAGE_TITHI_AVOID_AMAVASYA: bool = True
TILLAGE_TITHI_REMAINDER_IS_AUSPICIOUS: bool = True

# p.101: "To start ploughing on Navami causes damage to crops; Chathurthi leads
# to their destruction by insects; Chathurdhasi tends to cause danger to the life
# of the owner."
#
# THREE OF THE SIX EXCLUDED TITHIS CARRY A STATED CONSEQUENCE and the other three
# do not. By the registry's grading rule a stated consequence is what separates a
# veto from a penalty — but the flag is one boolean for the whole set, so vetoing
# it would condemn Shashti, Ashtami and Dhwadhasi on a sentence that says nothing
# about them, and the containing rule is the weaker "all Thithis except X are
# good" form. Graded a PENALTY, with the split recorded here rather than
# silently averaged away.
TILLAGE_TITHI_AVOID_WITH_STATED_CONSEQUENCE: frozenset[int] = frozenset({4, 9, 14})

# p.101: "The fortunate signs are:- Taurus, Gemini, Cancer Capricorn and Pisces.
# Avoid Aries, Leo, Scorpio and Aquarius. The remaining signs are of middling
# quality."
TILLAGE_LAGNA_BEST: frozenset[int] = frozenset({2, 3, 4, 10, 12})
TILLAGE_LAGNA_AVOID: frozenset[int] = frozenset({1, 5, 8, 11})
TILLAGE_LAGNA_MIDDLING: frozenset[int] = frozenset({6, 7, 9})   # the stated remainder

# p.100, under the same TILLAGE heading: "Taurus, Virgo and Scorpio produce
# good." This DISAGREES with the partition above on Scorpio (avoided there) and
# on Virgo (middling there). Recorded and not scored — see the module docstring
# for why the partition wins: the chapter's own p.101 per-sign gloss calls
# Scorpio a fire risk to the crops, siding with the partition.
TILLAGE_LAGNA_OPENING_SENTENCE: frozenset[int] = frozenset({2, 6, 8})

# p.101, the per-sign effect gloss. Display copy, not a second score.
TILLAGE_LAGNA_EFFECTS: dict[int, str] = {
    1: "proves fatal to the cows",
    2: "promises a good harvest",
    3: "promises a good harvest",
    4: "promises a good harvest",
    5: "leads to damage of crops",
    6: "favours a proper yield",
    7: "predicts luxuriant growth",
    8: "threatens to cause damage to the crops by fire",
    9: "promotes fertility",
    10: "gives an abundant harvest",
    11: "causes fear of thieves",
    12: "denotes prosperity",
}

# p.102: "Choose the bright fortnight (Sakla-Paksha) and avoid the dark fortnight
# (Krishna-Paksha)." Unconditional — no opening-tithi exemption is offered, which
# is what Ch. V and Ch. VII both give for their samskaras.
TILLAGE_PAKSHA_PREFERRED: str = "SHUKLA"
TILLAGE_PAKSHA_EXEMPT_IN_PAKSHA: frozenset[int] = frozenset()

# p.100, sourced and unscored: "The days of benefic planets produce good; those
# of malefics show evil. Sign Leo or any other, held by the Sun, or, any asterism
# governed by him, is favourable." The Leo clause contradicts p.101's avoidance
# of Leo, and is conditional on the Sun occupying it, so it is not scored.
TILLAGE_SUN_HELD_SIGN_IS_FAVOURABLE: bool = True

# p.102, sourced and unscored — every one needs a muhurta-moment chart.
TILLAGE_FIRST_PLOUGH_YOGAS: tuple[str, ...] = (
    "the Moon holding a watery sign",
    "the rising sign occupied by Jupiter and Venus",
    "asterism Rohini ruling with a benefic as lord of the rising Navamsa",
    "Taurus rising during the forenoon under asterism Rohini",
)
TILLAGE_NO_MALEFIC_IN_LAGNA: bool = True                         # p.101


# ═════════════════════════════════════════════════════════════════════════════
# SOWING — Ch. XIX pp.102-105
# ═════════════════════════════════════════════════════════════════════════════

# p.102: "The most fruitful asterisms are:- Rohini, Pushya, Magha,
# Utharapalguni, Hastha. Swathi, Visakha, Anuradha, Mula, Utharashada, Sravana,
# Sathabis. Utharabadhrapadha and Revathi."
SOWING_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ROHINI", "POOSAM", "MAGAM", "UTHIRAM", "HASTHAM", "SWATHI", "VISAKAM",
    "ANUSHAM", "MOOLAM", "UTHIRADAM", "THIRUVONAM", "SADAYAM", "UTHIRATTATHI",
    "REVATHI",
)  # count = 14

# p.102: "Aswini, Mrigasirsha, Punarvasu and Sravishta have middling influence."
SOWING_NAKSHATRA_MIDDLING: frozenset[int] = _nak(
    "ASWINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "AVITTAM",
)  # count = 4

# p.102: "The other asterisms should be avoided." A closing clause — so an
# unlisted star here is an excluded star, not merely an unranked one.
SOWING_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = True

# p.103: "All Thithis except Prathamai, Dhwithiyai, Chathurthi, Shashti,
# Sapthami, Navami, Ekadhasi and Chathurdhasi and all Karanas except Vishti,
# Chathushpadham, Nagam, Kimsthughnam are auspicious."
SOWING_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({1, 2, 4, 6, 7, 9, 11, 14})
SOWING_TITHI_AVOID_PURNIMA: bool = False        # not named
SOWING_TITHI_AVOID_AMAVASYA: bool = False       # not named
SOWING_TITHI_REMAINDER_IS_AUSPICIOUS: bool = True

# THE KARANA SET HERE IS NOT THE STHIRA FOUR. Every other karana passage in this
# repo's sourced doctrine names Sakunam, Chathushpadham, Nagam, Kimsthughnam and
# adds Vishti — five. This one drops **Sakunam** and lists Vishti in its place.
# Encoded as printed; Sakunam is not supplied from the neighbouring chapters.
SOWING_KARANA_AVOID: frozenset[str] = frozenset(
    {"VISHTI", "CHATUSHPADA", "NAGA", "KIMSTUGHNA"}
)

# p.103: "Monday, Wednesday, Thursday and Friday and the Amsas governed by the
# Moon, Mercury, Jupiter and Venus are beneficent."
SOWING_VARA_GOOD: frozenset[str] = frozenset({"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"})
# p.104: "Sunday, Tuesday and Saturday are favourable only to a particular kind
# of agricultural work." A QUALIFIED PERMISSION, not a prohibition — so the avoid
# set stays empty and those three score as unnamed days.
SOWING_VARA_AVOID: frozenset[str] = frozenset()
SOWING_VARA_QUALIFIED: frozenset[str] = frozenset({"SUNDAY", "TUESDAY", "SATURDAY"})

# p.104: "The best signs are:- Taurus, Cancer, Leo, Capricorn and Pisces; Libra,
# Gemini and Aquarius have common influence; the other signs will do no good."
#
# LEO IS BEST FOR SOWING and avoided for tillage (p.101), one page apart in the
# same chapter for two stages of the same season's work. Both stand.
SOWING_LAGNA_BEST: frozenset[int] = frozenset({2, 4, 5, 10, 12})
SOWING_LAGNA_MIDDLING: frozenset[int] = frozenset({3, 7, 11})
SOWING_LAGNA_AVOID: frozenset[int] = frozenset({1, 6, 8, 9})   # "will do no good"

# p.103, sourced and unscored: the per-crop star lists. The picker asks for a
# day, not for a crop, exactly as it asks for a day and not a school subject
# (Ch. VIII p.54).
SOWING_ROOT_SEED_NAKSHATRA: frozenset[int] = _nak(
    "BHARANI", "KARTHIGAI", "MAGAM", "POORAM", "VISAKAM", "MOOLAM", "POORADAM",
    "POORATTATHI",
)  # count = 8
SOWING_FLOWER_AND_FRUIT_NAKSHATRA: frozenset[int] = _nak(
    "MIRUGASEERIDAM", "PUNARPOOSAM", "HASTHAM", "CHITHIRAI", "SWATHI", "ANUSHAM",
    "KETTAI", "REVATHI",
)  # count = 8
SOWING_PER_CROP_STAR_YOGAS: dict[str, str] = {
    "BHARANI": "Solanum Indicum and Solanum Jacquini",
    "ASWINI": "betel-nut trees",
    "ROHINI": "trees",
    "PUNARPOOSAM": "sugar-canes",
    "CHITHIRAI": "all varieties of grain",
    "SWATHI": "paddy",
    "ANUSHAM": "sesamum",
    "MOOLAM": "all roots and creepers",
    "SADAYAM": "black-grain crops",
    "THIRUVONAM": "paddy, the best asterism for it",
}

# pp.104-105, sourced and unscored: the sowing day is also selected by counting
# from the star VENUS occupies — three blighting, three barren, twelve
# luxuriant, six empty, three perishing. A graha-relative count, like the Sun
# one above, and not a factor the engine has.
SOWING_SUKRA_TARA_BANDS: tuple[tuple[str, int], ...] = (
    ("blight the crops", 3),
    ("prevent earing, and produce blasted stalks", 3),
    ("favour luxuriant growth", 12),
    ("produce empty grains", 6),
    ("the plants perish", 3),
)
SOWING_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True                  # p.104
SOWING_VENUS_IN_SEVENTH_IS_ADVERSE: bool = True                 # p.104


# ═════════════════════════════════════════════════════════════════════════════
# NEW_GRAIN_MEAL — the first meal of the new crop, Ch. XXII pp.114-115
# ═════════════════════════════════════════════════════════════════════════════
#
# "After commencing the harvest it is customary, among the Hindus, to take home
# the first sheaf of corn and make a repast of the same in celebration of the
# event." The translator's bracketed gloss, p.114.

# p.114: "The following asterisms are considered the most fruitful for this
# purpose :- Aswini, Rohini, Mrigasirsha, Punarvasu, Pushya, Magha,
# Utharapalguni, Hastha, Chithira, Swathi, Visakha, Anuradha, Mula, Utharashada,
# Sravana, Sravishta, Sathabis, Utharabadhrapadha and Revathi."
NEW_GRAIN_MEAL_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "POOSAM", "MAGAM",
    "UTHIRAM", "HASTHAM", "CHITHIRAI", "SWATHI", "VISAKAM", "ANUSHAM", "MOOLAM",
    "UTHIRADAM", "THIRUVONAM", "AVITTAM", "SADAYAM", "UTHIRATTATHI", "REVATHI",
)  # count = 19 — the widest star list in the sourced doctrine
# p.114: "The remaining asterisms should be avoided."
NEW_GRAIN_MEAL_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = True

# p.114: "All Thithis, except Chathurthi, Shashti, Ashtami, Navami, Dhwadhasi,
# Chat*-irdhasi, Full-Moon and New-Moon days produce good. Avoid Vishti Karana."
NEW_GRAIN_MEAL_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 6, 8, 9, 12, 14})
NEW_GRAIN_MEAL_TITHI_AVOID_PURNIMA: bool = True
NEW_GRAIN_MEAL_TITHI_AVOID_AMAVASYA: bool = True
NEW_GRAIN_MEAL_TITHI_REMAINDER_IS_AUSPICIOUS: bool = True

# VISHTI ALONE. The chapter names no Sthira karana, and the four members are not
# imported from its neighbours.
NEW_GRAIN_MEAL_KARANA_AVOID: frozenset[str] = frozenset({"VISHTI"})

# p.114: "Wednesday, Thursday and Friday and the Amsa and Dhrekkana of the lords
# of these days-Mercury, Jupiter and Venus-have a very beneficent influence on a
# meal composed of the fruits of the new crops."
#
# THREE DAYS, NOT FOUR — Monday is absent, where the samskara chapters name it
# with the other three. The three named lords are exactly Mercury, Jupiter and
# Venus, so the omission is the sentence's own arithmetic and not a dropped word.
NEW_GRAIN_MEAL_VARA_GOOD: frozenset[str] = frozenset({"WEDNESDAY", "THURSDAY", "FRIDAY"})
NEW_GRAIN_MEAL_VARA_AVOID: frozenset[str] = frozenset()     # none named

# p.114: "The following signs should be chosen:- Taurus, Can-cer, Leo, Virgo,
# Libra, Sagittarius, Capricorn and Aquarius. Gemini has a middling quality.
# Avoid Aries, Scorpio, and Pisces."
NEW_GRAIN_MEAL_LAGNA_BEST: frozenset[int] = frozenset({2, 4, 5, 6, 7, 9, 10, 11})
NEW_GRAIN_MEAL_LAGNA_MIDDLING: frozenset[int] = frozenset({3})
NEW_GRAIN_MEAL_LAGNA_AVOID: frozenset[int] = frozenset({1, 8, 12})

# p.114: "The last sign is however the most felicitous for a meal of the first
# crops, according to Devaratha." An attributed dissent that reverses the
# chapter's own avoidance of Pisces one clause later. Recorded, not applied.
NEW_GRAIN_MEAL_PISCES_DISPUTED_BY_DEVARATHA: bool = True

# pp.114-115, sourced and unscored — three sub-rites, each with one sign and
# nothing else. Their signs are precisely the three the grain meal avoids, which
# is why they are kept apart from it rather than folded in.
NEW_GRAIN_MEAL_FIRST_FLOWERS_SIGN: int = 1      # Aries
NEW_GRAIN_MEAL_FIRST_FRUITS_SIGN: int = 12      # Pisces
NEW_GRAIN_MEAL_FIRST_LEAVES_SIGN: int = 8       # Scorpio

# p.115, sourced and unscored.
NEW_GRAIN_MEAL_NINTH_TENTH_MUST_BE_EMPTY: bool = True
NEW_GRAIN_MEAL_MOON_IN_8TH_OR_12TH_IS_ADVERSE: bool = True
NEW_GRAIN_MEAL_AVOID_LUNAR_MONTHS: tuple[str, ...] = ("ASHADA", "MARGASIRA", "MAGHA")


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


RULE_SOURCES: dict[str, RuleSource] = {
    # ── entering the land ───────────────────────────────────────────────────
    "KP_CH19_AGRI_START_NAKSHATRA_001": _textual(
        "KP_CH19_AGRI_START_NAKSHATRA_001", "NAKSHATRA", "AGRICULTURE_START", "XIX", 100,
        "The best asterisms under which the owner may enter into his land to start "
        "agricultural work are:- Bharani, Ardhra, Pushya, Magha, Utharapalguni, Chithra, "
        "Swathi, Anuradha, Utharashada and Utharabadhrapadha.",
        "10 stars for the owner's first entry onto the land. Not exhaustive — no closing "
        "clause follows.",
        notes=(
            "This is a rite in its own right, not a preamble: the chapter says 'The first step "
            "in this matter is to select an auspicious day on which the owner may set his foot "
            "on his land for the purpose. Then follow ploughing and other operations.' Its star "
            "list overlaps the tillage list on only three of ten."
        ),
    ),
    "KP_CH19_AGRI_START_TITHI_001": _textual(
        "KP_CH19_AGRI_START_TITHI_001", "TITHI", "AGRICULTURE_START", "XIX", 100,
        "All odd Thithis (Prathamai, Thrithiyai, Panchami, Sapthami, Navami, Ekadhasi and "
        "Thrayodhasi) except Navami are favourable. The even Thithis except Dhwithiyai and "
        "Dhasami should be avoided. Some astrologers condemn Badhrai.",
        "Favourable 1/3/5/7/11/13; avoid 4/6/8/12/14. Navami, Dwithiyai and Dhasami are named "
        "only to be taken OUT of a list, so they score as unnamed days.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "The enumeration stops at 13 and 14, so Purnima is never reached and Amavasya is "
            "never mentioned — neither is ranked and neither is banned. The Badhrai dissent "
            "(Dwithiyai, Sapthami, Dhwadhasi, by the chapter's own p.100 footnote) is recorded "
            "and not applied; it contradicts the sentence beside it, since Sapthami is on this "
            "rite's favourable list."
        ),
    ),
    "KP_CH19_AGRI_START_VARA_001": _textual(
        "KP_CH19_AGRI_START_VARA_001", "VARA", "AGRICULTURE_START", "XIX", 100,
        "Monday, Tuesday, Wednesday and Thursday are auspicious. Saturday also is recommended "
        "by some.",
        "TUESDAY IS AUSPICIOUS and FRIDAY IS ABSENT — an inversion of the Mon/Wed/Thu/Fri set "
        "almost every other chapter here states. No adverse day is named, so the other three "
        "score neutral.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "Preserved rather than harmonised toward the pattern, on the same principle as Ch. "
            "XX's Saturday. The Saturday clause is an attributed dissent and is recorded "
            "without being applied."
        ),
    ),
    # ── tillage ─────────────────────────────────────────────────────────────
    "KP_CH19_TILLAGE_NAKSHATRA_001": _textual(
        "KP_CH19_TILLAGE_NAKSHATRA_001", "NAKSHATRA", "TILLAGE", "XIX", 101,
        "The beneficent asterisms are:-Rohini, Punarvasu, Pushya, Utharapalguni, Hastha, "
        "Anuradha, Mula, Utharashada and Utharabadhrapadha. Aswini, Mrigasirsha, Magha, "
        "Chithra, Swathi, Visakha, Sravana, Sravishta and Sathabis are also considered "
        "auspicious by some astrologers.",
        "9 stars for ploughing. The second nine are an ATTRIBUTED DISSENT and are not scored.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "The dissent is as large as the chapter's own list, so applying it would double the "
            "favourable set on an attribution the chapter itself declines to adopt. Held in "
            "TILLAGE_NAKSHATRA_DISPUTED_ADDITIONS."
        ),
    ),
    "KP_CH19_TILLAGE_SURYA_TARA_001": _textual(
        "KP_CH19_TILLAGE_SURYA_TARA_001", "SURYA_TARA_COUNT", "TILLAGE", "XIX", 101,
        "For commencing tillage choose the 3rd, 4th, 5th, 6th, 7th, 11th, 12th, 13th, 14th, "
        "15th, 19th, 20th, 24th, 25th and 26th asterisms from the one occupied by the Sun on "
        "the day in question. All other asterisms produce evil. ... Avoid the six asterisms "
        "from the one occupied by the Sun, for they cause affliction to the bullocks; asterisms "
        "thirteen to eighteen, therefrom (both inclusive), affect the landlord adversely.",
        "A star count taken from the SUN's star rather than from a birth star, with the "
        "chapter's own p.102 qualification of which favourable counts still harm the bullocks "
        "or the landlord.",
        notes=(
            "NOT IMPLEMENTED. The engine's only star-counting factor counts from a subject's "
            "birth star; pointing it at a graha would be a new factor, not a use of an existing "
            "one. Recorded in full so a future pass has both passages without a second trip."
        ),
    ),
    "KP_CH19_TILLAGE_TITHI_001": _textual(
        "KP_CH19_TILLAGE_TITHI_001", "TITHI", "TILLAGE", "XIX", 101,
        "All Thithis except Chathurthi, Shashti, Ashtami, Navami, Dhwadhasi, Chathurdhasi "
        "Full-Moon and New-Moon days are good. To start ploughing on Navami causes damage to "
        "crops ; Chathurthi leads to their destruction by insects ; Chathurdhasi tends to cause "
        "danger to the life of the owner.",
        "Avoid in-paksha 4/6/8/9/12/14, Purnima and Amavasya; everything else positively good.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "THREE OF THE SIX carry a stated consequence and three do not, which is exactly the "
            "line the registry uses to separate a veto from a penalty. The flag is one boolean "
            "for the whole set, so vetoing it would condemn Shashti, Ashtami and Dhwadhasi on a "
            "sentence that says nothing about them, while the containing rule is the weaker "
            "'all Thithis except X are good' form. Graded PENALTY; the three with consequences "
            "are held in TILLAGE_TITHI_AVOID_WITH_STATED_CONSEQUENCE for the astrologer."
        ),
    ),
    "KP_CH19_TILLAGE_LAGNA_001": _textual(
        "KP_CH19_TILLAGE_LAGNA_001", "MUHURTA_LAGNA_SIGN", "TILLAGE", "XIX", 101,
        "The fortunate signs are:- Taurus, Gemini, Cancer Capricorn and Pisces. Avoid Aries, "
        "Leo, Scorpio and Aquarius. The remaining signs are of middling quality.",
        "A complete three-tier partition: five best, four avoided, and Virgo, Libra and "
        "Sagittarius middling by the sentence's own residue.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "THE CHAPTER CONTRADICTS ITSELF HERE. Under the same TILLAGE heading, p.100 opens "
            "'Taurus, Virgo and Scorpio produce good' — Scorpio is avoided by this partition "
            "and Virgo is only middling. The partition is scored because the chapter's own "
            "per-sign gloss on this page sides with it: Scorpio 'threatens to cause damage to "
            "the crops by fire', Virgo merely 'favours a proper yield'. The opening sentence is "
            "recorded in TILLAGE_LAGNA_OPENING_SENTENCE and neither reading is deleted."
        ),
    ),
    "KP_CH19_TILLAGE_PAKSHA_001": _textual(
        "KP_CH19_TILLAGE_PAKSHA_001", "PAKSHA", "TILLAGE", "XIX", 102,
        "Choose the bright fortnight (Sakla-Paksha) and avoid the dark fortnight "
        "(Krishna-Paksha).",
        "Shukla preferred, unconditionally — no opening-tithi exemption is offered, where Ch. V "
        "p.38 and Ch. VII p.44 both exempt the first five days of the dark half.",
    ),
    # ── sowing ──────────────────────────────────────────────────────────────
    "KP_CH19_SOWING_NAKSHATRA_001": _textual(
        "KP_CH19_SOWING_NAKSHATRA_001", "NAKSHATRA", "SOWING", "XIX", 102,
        "The most fruitful asterisms are:- Rohini, Pushya, Magha, Utharapalguni, Hastha. "
        "Swathi, Visakha, Anuradha, Mula, Utharashada, Sravana, Sathabis. Utharabadhrapadha and "
        "Revathi. Aswini, Mrigasirsha, Punarvasu and Sravishta have middling influence. The "
        "other asterisms should be avoided.",
        "14 fruitful, 4 expressly middling, and a closing clause — so the remaining nine are "
        "excluded stars rather than merely unranked ones.",
    ),
    "KP_CH19_SOWING_TITHI_001": _textual(
        "KP_CH19_SOWING_TITHI_001", "TITHI", "SOWING", "XIX", 103,
        "All Thithis except Prathamai,Dhwithiyai. Chathurthi, Shashti. Sapthami, Navami, "
        "Ekadhasi and Chathurdhasi and all Karanas except Vishti, Chathushpadham, Nagam, "
        "Kimsthughnam are auspicious.",
        "Eight in-paksha tithis excluded and the rest positively good. Neither Purnima nor "
        "Amavasya is named, so neither is banned — unusual for this book.",
    ),
    "KP_CH19_SOWING_KARANA_001": _textual(
        "KP_CH19_SOWING_KARANA_001", "KARANA", "SOWING", "XIX", 103,
        "all Karanas except Vishti, Chathushpadham, Nagam, Kimsthughnam are auspicious.",
        "FOUR KARANAS, AND SAKUNAM IS NOT ONE OF THEM. Every other karana passage in this "
        "repo's sourced doctrine names the Sthira four — Sakunam, Chathushpadham, Nagam, "
        "Kimsthughnam — and adds Vishti, making five. This sentence drops Sakunam and puts "
        "Vishti in the list itself.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "Encoded as printed. Supplying Sakunam from the neighbouring chapters would be "
            "harmonising a list the page states in full, and this book has already been shown "
            "to differ deliberately between chapters on weekdays and on signs."
        ),
    ),
    "KP_CH19_SOWING_VARA_001": _textual(
        "KP_CH19_SOWING_VARA_001", "VARA", "SOWING", "XIX", 103,
        "Monday, Wednesday, Thursday and Friday and the Amsas governed by the Moon, Mercury, "
        "Jupiter and Venus are beneficent. ... Agricultural work started on Monday, Wednesday, "
        "Thursday and Friday will prove quite profitable. Sunday, Tuesday and Saturday are "
        "favourable only to a particular kind of agricultural work.",
        "The four benefic weekdays, stated twice. Sunday, Tuesday and Saturday are QUALIFIEDLY "
        "PERMITTED rather than forbidden, so the avoid set is empty and they score neutral.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "The distinction is the point: 'favourable only to a particular kind of work' is "
            "not the 'avoid Sunday, Tuesday and Saturday' the samskara chapters state, and "
            "flattening it into an avoid set would penalise days the chapter permits."
        ),
    ),
    "KP_CH19_SOWING_LAGNA_001": _textual(
        "KP_CH19_SOWING_LAGNA_001", "MUHURTA_LAGNA_SIGN", "SOWING", "XIX", 104,
        "The best signs are:- Taurus, Cancer, Leo, Capricorn and Pisces; Libra, Gemini and "
        "Aquarius have common influence ; the other signs will do no good.",
        "Five best, three middling, and 'the other signs will do no good' closes the partition "
        "on Aries, Virgo, Scorpio and Sagittarius.",
        notes=(
            "LEO IS BEST FOR SOWING AND AVOIDED FOR TILLAGE (p.101) — two stages of one "
            "season's work, three pages apart, disagreeing on a sign. Both are encoded as "
            "printed; the chapter is not made self-consistent."
        ),
    ),
    "KP_CH19_SOWING_CROP_TABLES_001": _textual(
        "KP_CH19_SOWING_CROP_TABLES_001", "NAKSHATRA", "SOWING", "XIX", 103,
        "To sow seeds of roots the following asterisms are good:- Bharani, Krithika, Magha, "
        "Purvapalguni, Visakha, Mula, Purvashada and Purvabadhrapadha. ... for sowing seeds of "
        "flower plants and fruit-bearing creepers the following are beneficent asterisms :- "
        "Mrigasirsha, Punarvasu, Hastha, Chithra, Swathi, Anuradha. Jyeshta and Revathi. ... "
        "Bharani governs Solanum Indicum and Solanum Jacquini. Aswini favours the growth of "
        "betel-nut trees; Rohini is a fruitful asterism for trees; sugar-canes flourish under "
        "Punarvasu; Chithra protects all varieties of grain; Swathi governs paddy; Anuradha is "
        "a productive asterism for sesamum ; Mula brings up all roots and creepers ; "
        "black-grain crops do very well under asterism Sathabis ; and for the teeming growth of "
        "paddy Sravana is the best asterism.",
        "Per-crop star lists. Recorded and NOT scored: the picker asks for a day, not for a "
        "crop, exactly as Ch. VIII p.54's per-subject lists are recorded and not scored.",
        notes=(
            "Two of these directly cross the chapter's main list — Bharani and Krithika head "
            "the root-seed list and neither is on the fruitful-for-sowing list, which is closed "
            "by 'The other asterisms should be avoided'. Wiring the crop tables would therefore "
            "contradict the chapter's own general rule for anyone sowing roots."
        ),
    ),
    "KP_CH19_SOWING_SUKRA_TARA_001": _textual(
        "KP_CH19_SOWING_SUKRA_TARA_001", "SUKRA_TARA_COUNT", "SOWING", "XIX", 104,
        "To determine the day for sowing a Field- Note in the first place the asterism ruled by "
        "Venus on the day in question. The three succeeding asterisms, therefrom, blight the "
        "crops ; the next three asterisms prevent earing, and produce blasted stalks; the next "
        "twelve asterisms favour luxuriant growth, and one of them should be chosen ; the "
        "penultimate six asterisms produce empty grains ; and under the last three the plants "
        "perish.",
        "A 3/3/12/6/3 banding of the 27 stars counted from the star VENUS occupies.",
        notes="NOT IMPLEMENTED, for the same reason as the Sun-relative tillage count.",
    ),
    # ── the first meal of new grain ─────────────────────────────────────────
    "KP_CH22_NEW_GRAIN_MEAL_NAKSHATRA_001": _textual(
        "KP_CH22_NEW_GRAIN_MEAL_NAKSHATRA_001", "NAKSHATRA", "NEW_GRAIN_MEAL", "XXII", 114,
        "The following asterisms are considered the most fruitful for this purpose :- Aswini, "
        "Rohini, Mrigasirsha, Punarvasu, Pushya, Magha, Utharapalguni, Hastha, Chithira, "
        "Swathi, Visakha, Anuradha, Mula, Utharashada, Sravana, Sravishta, Sathabis, "
        "Utharabadhrapadha and Revathi. The remaining asterisms should be avoided.",
        "19 stars — the widest list in the sourced doctrine — and closed, so the remaining "
        "eight are excluded rather than unranked.",
        notes=(
            "A 19-of-27 favourable list with a closing clause is a permissive rule, not a loose "
            "one: the chapter is naming eight stars it will not eat the new crop under, and "
            "saying so exhaustively."
        ),
    ),
    "KP_CH22_NEW_GRAIN_MEAL_TITHI_001": _textual(
        "KP_CH22_NEW_GRAIN_MEAL_TITHI_001", "TITHI", "NEW_GRAIN_MEAL", "XXII", 114,
        "All Thithis, except Chathurthi, Shashti, Ashtami, Navami, Dhwadhasi, Chathurdhasi, "
        "Full-Moon and New-Moon days produce good. Avoid Vishti Karana.",
        "Six in-paksha tithis plus both lunations excluded; the rest positively good.",
    ),
    "KP_CH22_NEW_GRAIN_MEAL_KARANA_001": _textual(
        "KP_CH22_NEW_GRAIN_MEAL_KARANA_001", "KARANA", "NEW_GRAIN_MEAL", "XXII", 114,
        "Avoid Vishti Karana.",
        "VISHTI ALONE. The chapter names no Sthira karana and the four members are not imported "
        "from its neighbours.",
    ),
    "KP_CH22_NEW_GRAIN_MEAL_VARA_001": _textual(
        "KP_CH22_NEW_GRAIN_MEAL_VARA_001", "VARA", "NEW_GRAIN_MEAL", "XXII", 114,
        "Wednesday, Thursday and Friday and the Amsa and Dhrekkana of the lords of these "
        "days-Mercury, Jupiter and Venus-have a very beneficent influence on a meal composed of "
        "the fruits of the new crops.",
        "THREE DAYS, NOT FOUR. Monday is absent where the samskara chapters name it beside the "
        "other three, and the three lords the sentence names are exactly Mercury, Jupiter and "
        "Venus — so the omission is the sentence's own arithmetic, not a dropped word.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes="No adverse day is named, so the other four score neutral rather than penalised.",
    ),
    "KP_CH22_NEW_GRAIN_MEAL_LAGNA_001": _textual(
        "KP_CH22_NEW_GRAIN_MEAL_LAGNA_001", "MUHURTA_LAGNA_SIGN", "NEW_GRAIN_MEAL", "XXII", 114,
        "The following signs should be chosen:- Taurus, Can-cer, Leo, Virgo, Libra, "
        "Sagittarius, Capricorn and Aquarius. Gemini has a middling quality. Avoid Aries, "
        "Scorpio, and Pisces. The last sign is however the most felicitous for a meal of the "
        "first crops, according to Devaratha.",
        "Eight best, Gemini middling, three avoided.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "THE PAGE REVERSES ITSELF ON PISCES IN THE NEXT CLAUSE, on an attribution to "
            "Devaratha. Recorded and not applied, on the same footing as Ch. XX p.109's Rikthai "
            "dissent: the chapter's own avoidance stands. Separately, the three avoided signs "
            "are exactly the three the sub-rites on pp.114-115 require — Aries for the first "
            "flowers, Pisces for the first fruits, Scorpio for the first leaves — which is why "
            "those sub-rites are kept as distinct records and not folded into this activity."
        ),
    ),
}
