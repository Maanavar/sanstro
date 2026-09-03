"""Kalaprakasika Ch. V, VII, XVII & XVIII — Choulam, Upanayanam, Seemantham, the birth chamber.

Sourced from N. P. Subramania Iyer's Kalaprakasika translation (Asian
Educational Services 1982 reprint of the 1917 first edition), extracted
2026-08-15 from the page-by-page transcription of the 150-page scan supplied by
the repository owner. Worksheet: `docs/sources/kalaprakasika_lifecycle_rules.md`.

* **Choulam / Tonsure** (Mottai) — Ch. V, printed pp. 37-41
* **Upanayanam / thread-marriage** (Poonal) — Ch. VII, printed pp. 42-52
* **Seemantham** (Valaikappu) — Ch. XVII, printed pp. 96-98
* **The lying-in apartment** (Soothika-Griham) — Ch. XVIII, printed p. 99

Page numbers are **printed book pages**; PDF page = printed page + 32.

**Ch. XVIII elects the arranging of the birth chamber, never the birth.** That
distinction is the reason it belongs in an election engine at all: Ch. II treats
the moment of birth as natal material to be *read*, and this repo does not offer
a rite it cannot honestly schedule.

**Two scope traps this chapter set contains, both of the kind that has already
bitten this repo once.**

1. **Ch. V's janma/10th/19th ban belongs to the *subsequent shaving*, not to the
   tonsure.** The sentence sits inside the "After tonsure, the first shaving
   should be on the 2nd, 6th, 8th or 9th day" paragraph on p.40, whose whole
   subject is the follow-up haircut. Reading it as a tonsure rule would import a
   neighbour's rule exactly as the doc did with Annaprasana's karana clause. It
   is recorded here under `FIRST_SHAVING` scope and is **not** wired to TONSURE.
2. **Upanayanam states two different janma-tara bans on two pages** (p.50's
   named Karmam/Sanghatham/Saamudhayam/Vinasanam/Manasam set and p.51's general
   set). Both are stated, neither is said to supersede the other, so both apply
   and the union is what the engine reads — recorded as two rule_ids so the
   provenance of each count survives.

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
_VERIFIED_BY = "primary-text transcription pp.37-52, 96-99 (user-supplied scan)"


def _nak(*names: str) -> frozenset[int]:
    """Canonical 1..27 nakshatra numbers for this repo's Tamil-transliterated
    keys — never a second name list. See `kalaprakasika_treasure_rules._nak`
    for the Sanskrit->Tamil key mapping used throughout."""
    return frozenset(NAKSHATRA_NAMES.index(name) + 1 for name in names)


# ═════════════════════════════════════════════════════════════════════════════
# CHOULAM / TONSURE — Ch. V, pp.37-41
# ═════════════════════════════════════════════════════════════════════════════

# p.38: "The favourable asterisms are:- Aswini, Mrigasirsha, Punarvasu, Pushya,
# Hastha, Chithra, Sravana, Sravishta and Revathi."
TONSURE_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "POOSAM", "HASTHAM", "CHITHIRAI",
    "THIRUVONAM", "AVITTAM", "REVATHI",
)  # count = 9

# p.38: "The asterisms Rohini, Utharapalguni, Swathi, Utharashada, Sathabis and
# Utharabadhrapadha are pretty good."
#
# A SECOND POSITIVE TIER, not a second best list. "Pretty good" beside
# "favourable" is a distinction the text draws and the engine keeps: these score
# neutral-but-named, never the full star bonus.
TONSURE_NAKSHATRA_MIDDLING: frozenset[int] = _nak(
    "ROHINI", "UTHIRAM", "SWATHI", "UTHIRADAM", "SADAYAM", "UTHIRATTATHI",
)  # count = 6

# p.38: "The remaining twelve asterisms should be avoided."
#
# The text does the arithmetic for us and it checks out: 9 + 6 = 15 named,
# 27 - 15 = 12 remaining. That the count printed in the scan matches the two
# lists exactly is independent evidence both were transcribed whole.
TONSURE_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = True

# p.39: "The fruitful Thithis are Dhwithiyai, Thrithiyai, Panchami, Sapthami,
# Dhasami, Ekadasi, and Thrayodasi."
TONSURE_TITHI_BEST_IN_PAKSHA: frozenset[int] = frozenset({2, 3, 5, 7, 10, 11, 13})
# p.39: "Those to be avoided are:- Chathurthi, Prathamai, Shashti, Ashtami,
# Navami, Chathurdhasi, the New-Moon and the Full-Moon days."
TONSURE_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({1, 4, 6, 8, 9, 14})
TONSURE_TITHI_AVOID_PURNIMA: bool = True
TONSURE_TITHI_AVOID_AMAVASYA: bool = True

# p.37: "The bright fortnight bestows longevity; the dark fortnight tells upon
# life and fortune."
# p.38: "The first five Thithis of the dark fortnight are, however, beneficent.
# Some writers are of opinion that the first seven days of the dark fortnight
# are good."
#
# The five-day exemption is the stated one; the seven-day reading is attributed
# ("some writers") and is NOT encoded — recording the majority reading and
# naming the minority is this module's convention.
TONSURE_PAKSHA_PREFERRED: str = "SHUKLA"
TONSURE_PAKSHA_EXEMPT_IN_PAKSHA: frozenset[int] = frozenset({1, 2, 3, 4, 5})

# p.38: "Monday, Wednesday, Thursday and Friday are beneficent. Sunday, Tuesday
# and Saturday are to be avoided."
TONSURE_VARA_GOOD: frozenset[str] = frozenset({"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"})
TONSURE_VARA_AVOID: frozenset[str] = frozenset({"SUNDAY", "TUESDAY", "SATURDAY"})

# p.39: "Taurus, Gemini, Cancer, Virgo, Libra, Capricorn and Pisces are
# auspicious signs. Avoid Aries, Leo, Scorpio and Sagittari." — and then, of
# Aquarius: "In any case, Aquarius should be totally avoided."
#
# A COMPLETE partition of all twelve. Aquarius reaches the avoid set by the
# second sentence, not the first: p.39 offers the other four adverse signs an
# escape ("These signs are favourable, if occupied or aspected by benefic
# planets") and then expressly denies Aquarius that escape. The engine cannot
# check benefic aspect, so all five score alike; the asymmetry is recorded
# because it is real, not because it changes today's number.
TONSURE_LAGNA_BEST: frozenset[int] = frozenset({2, 3, 4, 6, 7, 10, 12})
TONSURE_LAGNA_AVOID: frozenset[int] = frozenset({1, 5, 8, 9, 11})

# Sourced, deliberately unscored.
TONSURE_YEARS_FROM_BIRTH: tuple[int, ...] = (3, 5, 7)          # p.37, 3rd is best
TONSURE_REQUIRES_UTHARAYANA: bool = True                        # p.37
TONSURE_BANNED_WHILE_MOTHER_PREGNANT: bool = True               # p.37, waived past age 5
TONSURE_AVOID_NIGHT: bool = True                                # p.40
TONSURE_EIGHTH_HOUSE_MUST_BE_EMPTY_EXCEPT_VENUS: bool = True    # p.40

# A DIFFERENT rite (p.40): the first shaving that FOLLOWS the tonsure. Recorded
# to keep it off TONSURE — see the module docstring.
FIRST_SHAVING_PREFERRED_DAYS_AFTER_TONSURE: tuple[int, ...] = (2, 6, 8, 9)
FIRST_SHAVING_AVOID_DAYS_AFTER_TONSURE: tuple[int, ...] = (3, 5, 7, 22)
FIRST_SHAVING_JANMA_TARA_PROHIBITED: frozenset[int] = frozenset({1, 10, 19})


# ═════════════════════════════════════════════════════════════════════════════
# UPANAYANAM — Ch. VII, pp.42-52
# ═════════════════════════════════════════════════════════════════════════════

# p.44: "The following asterisms are excellent:- Aswini, Rohini, Mrigasirsha,
# Punarvasu, Pushya, Utharapalguni, Hastha, Chithra, Swathi, Anuradha,
# Utharashada, Sravana, Sravishta, Sathabis, Utharabadhrapadha and Revathi."
UPANAYANAM_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "POOSAM", "UTHIRAM",
    "HASTHAM", "CHITHIRAI", "SWATHI", "ANUSHAM", "UTHIRADAM", "THIRUVONAM",
    "AVITTAM", "SADAYAM", "UTHIRATTATHI", "REVATHI",
)  # count = 16
# p.44: "Some are of epinion that Sravana Sravishta and Sathabis are neutral."
# An attributed MINORITY view against the chapter's own list. Recorded, not
# applied: demoting three stars on "some are of opinion" would let a dissent
# outrank the sentence it dissents from.
UPANAYANAM_NAKSHATRA_DISPUTED_AS_NEUTRAL: frozenset[int] = _nak(
    "THIRUVONAM", "AVITTAM", "SADAYAM",
)
# p.44 states no closing clause for this list, unlike Ch. V and Ch. VIII.
UPANAYANAM_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False

# p.45: "During the bright fortnight, Dwithiyai, Thrithiyai, Panchami, Shashti,
# Sapthami, Dhasami and Thrayodhasi are auspicious." ... "Of the dark fortnight,
# Prathamai, Dwithiyai and Thrithiyai Thithis are considered auspicious."
#
# The two halves get different lists. The registry's tithi shape is
# paksha-agnostic, so the encoded best set is the BRIGHT-fortnight list — the
# one the chapter leads with and the half it prefers — and the dark-fortnight
# trio rides the paksha exemption instead. Recorded so the narrowing is visible.
UPANAYANAM_TITHI_BEST_SHUKLA: frozenset[int] = frozenset({2, 3, 5, 6, 7, 10, 13})
UPANAYANAM_TITHI_BEST_KRISHNA: frozenset[int] = frozenset({1, 2, 3})
# p.45: "Ekadhasi and Dhwadhasi are of middling quality. They, however, prove
# beneficial if the Moon be strong at the time."
UPANAYANAM_TITHI_MIDDLING: frozenset[int] = frozenset({11, 12})
# p.45: "The days to be avoided are:- Chathurthi, Ashtami, Navami,
# Chathurdhasi, the Full-moon and the New-moon days."
UPANAYANAM_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 8, 9, 14})
UPANAYANAM_TITHI_AVOID_PURNIMA: bool = True
UPANAYANAM_TITHI_AVOID_AMAVASYA: bool = True

# p.44: "The bright fortnight and the first five Thithis of the dark fortnight
# are beneficial days." — the same shape as Ch. V, stated independently.
UPANAYANAM_PAKSHA_PREFERRED: str = "SHUKLA"
UPANAYANAM_PAKSHA_EXEMPT_IN_PAKSHA: frozenset[int] = frozenset({1, 2, 3, 4, 5})

# p.45: "Wednesday, Thursday and Friday are good. Sunday and Monday are
# middling; Saturday and Tuesday should be avoided as also Monday of the dark
# fortnight."
#
# Note this is NARROWER than every other chapter in this repo: Monday is good in
# Ch. III, IV, V and XXI and is only middling here, and conditionally adverse in
# the dark fortnight. Sunday and Monday are left out of both sets — the registry
# has no middling weekday tier, and inventing one to hold two days would be
# worse than scoring them neutral, which is what an unnamed weekday already does.
UPANAYANAM_VARA_GOOD: frozenset[str] = frozenset({"WEDNESDAY", "THURSDAY", "FRIDAY"})
UPANAYANAM_VARA_AVOID: frozenset[str] = frozenset({"SATURDAY", "TUESDAY"})
UPANAYANAM_VARA_MIDDLING: frozenset[str] = frozenset({"SUNDAY", "MONDAY"})
UPANAYANAM_MONDAY_ADVERSE_IN_KRISHNA: bool = True

# p.45: "Taurus, Gemini, Cancer, Leo, Virgo, Libra, Sagittari and Pisces are
# favourable. The other signs should be avoided." — a complete partition.
UPANAYANAM_LAGNA_BEST: frozenset[int] = frozenset({2, 3, 4, 5, 6, 7, 9, 12})
UPANAYANAM_LAGNA_AVOID: frozenset[int] = frozenset({1, 8, 10, 11})

# p.51-52: "The following periods are also inauspicious - ... Thyajyam,
# Vishti-Karana, Shadaseethimukham, Vyaghatham, ..."
UPANAYANAM_KARANA_AVOID: frozenset[str] = frozenset({"VISHTI"})

# p.51: "The asterisms to be avoided are the Janma-Nakshatra and the 5th, 7th,
# 10th, 19th, 22nd and the 27th therefrom."
UPANAYANAM_JANMA_TARA_PROHIBITED_GENERAL: frozenset[int] = frozenset({1, 5, 7, 10, 19, 22, 27})
# p.50: "No manner of celebration should be held on days ruled by the 10th,
# 16th, 18th, 23rd and 25th asterisms from the 'Jenma-Nakshathra'. These
# asterisms are respectively known as Karmam, Sanghatham, Saamudhayam,
# Vinasanam and Manasam."
#
# The book NAMES these five, which is why they are encoded with confidence where
# a bare garbled ordinal would not be.
UPANAYANAM_JANMA_TARA_PROHIBITED_NAMED: frozenset[int] = frozenset({10, 16, 18, 23, 25})
UPANAYANAM_JANMA_TARA_NAMES: dict[int, str] = {
    10: "Karmam", 16: "Sanghatham", 18: "Saamudhayam", 23: "Vinasanam", 25: "Manasam",
}
# Both passages stand; neither is said to supersede the other.
UPANAYANAM_JANMA_TARA_PROHIBITED: frozenset[int] = (
    UPANAYANAM_JANMA_TARA_PROHIBITED_GENERAL | UPANAYANAM_JANMA_TARA_PROHIBITED_NAMED
)  # 11 of 27 counts — deliberately wide; see the registry note.

# Sourced, deliberately unscored.
UPANAYANAM_YEARS_FROM_BIRTH: tuple[int, ...] = (5, 8)           # p.42, 5th preferred
UPANAYANAM_REQUIRES_UTHARAYANA: bool = True                     # p.44
UPANAYANAM_JUPITER_VENUS_MUST_NOT_BE_COMBUST: bool = True       # p.44
UPANAYANAM_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True              # p.47
# p.50-51, five named adverse yogas, each a graha in a quadrant.
UPANAYANAM_ADVERSE_QUADRANT_YOGAS: dict[str, str] = {
    "SPOORJITHAM": "SUN", "SPUTITHAM": "MARS", "RUDHITHAM": "SATURN",
    "RUNDHRAM": "RAHU", "UGRAM": "KETU",
}
# p.52, nitya yogas the chapter rejects by name.
UPANAYANAM_ADVERSE_NITYA_YOGAS: frozenset[str] = frozenset({
    "VYAGHATHA", "VAJRA", "VISHKAMBHA", "PARIGHA", "VAIDHRITI", "VYATIPATA",
    "SHOOLA", "GANDA", "ATIGANDA",
})


# ═════════════════════════════════════════════════════════════════════════════
# SEEMANTHAM — Ch. XVII, pp.96-98
# ═════════════════════════════════════════════════════════════════════════════

# p.97: "The following asterisms are excellent:- Rohini, Mrigasirsha,
# Punarvasu, Pushya, Utharapalguni, Utharashada, Utharabadhrapadha, Hastha,
# Sravana and Revathi."
SEEMANTHAM_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ROHINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "POOSAM", "UTHIRAM", "UTHIRADAM",
    "UTHIRATTATHI", "HASTHAM", "THIRUVONAM", "REVATHI",
)  # count = 10
# p.98: "Some astrologers are of opinion that Aswini, Anuradha and Mula may also
# be commended as auspicious under unavoidable circumstances."
#
# Doubly hedged — attributed AND conditional on necessity — so these are a
# middling tier, never the full bonus.
SEEMANTHAM_NAKSHATRA_FALLBACK: frozenset[int] = _nak("ASWINI", "ANUSHAM", "MOOLAM")
SEEMANTHAM_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False

# p.98: "Avoid Chathurthi. Shashti, Ashtami, Navami, Chathurdhasi and New-Moon
# days."
SEEMANTHAM_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 6, 8, 9, 14})
SEEMANTHAM_TITHI_AVOID_AMAVASYA: bool = True
SEEMANTHAM_TITHI_AVOID_PURNIMA: bool = False
# p.98, immediately after: "Chathurthi, Chathurdhasi and the Full-Moon days are
# commended as auspicious by some when the Moon is well-dignified."
#
# AN INTRA-PAGE CONFLICT, on the same shape as the marriage tithi finding: two
# of the five tithis just banned are commended two sentences later, by an
# attributed minority and on a condition (a well-dignified Moon) the engine
# cannot check. The ban is applied and the tension is surfaced, not resolved.
SEEMANTHAM_TITHI_DISPUTED: frozenset[int] = frozenset({4, 14})

# p.98: "Monday, Wednesday. Thursday, and Friday and the Amsas of the Moon,
# Mercury, Jupiter and Venus (lords of these days respectively) are fruitful.
# Avoid Sunday, luesday and Saturday and the Amsas of maletics."
SEEMANTHAM_VARA_GOOD: frozenset[str] = frozenset({"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"})
SEEMANTHAM_VARA_AVOID: frozenset[str] = frozenset({"SUNDAY", "TUESDAY", "SATURDAY"})

# p.98: "All signs except Leo and Scorpio are beneficent."
# The exclusion names two; the remaining ten are stated beneficent, so both sets
# are positive/negative rather than one list and a silence.
SEEMANTHAM_LAGNA_AVOID: frozenset[int] = frozenset({5, 8})
SEEMANTHAM_LAGNA_BEST: frozenset[int] = frozenset(set(range(1, 13)) - {5, 8})

# p.98: "The wise man will avoid Seemantham under the 3rd, 5th, 7th, 10th, 19th,
# 22nd and 27th asterisms, from the Jenma-Nakshathra which are inauspicious."
#
# Note this set does NOT include the birth star itself, where Ch. V and Ch. VII
# both do. Encoded as printed rather than harmonised toward its neighbours.
SEEMANTHAM_JANMA_TARA_PROHIBITED: frozenset[int] = frozenset({3, 5, 7, 10, 19, 22, 27})

# Sourced, deliberately unscored.
SEEMANTHAM_MONTHS_OF_PREGNANCY: tuple[int, ...] = (4, 6, 8)     # p.97; 5th/7th per Bhodhayana
SEEMANTHAM_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True              # p.98, with a kendra exception
# p.98: "as the auspicious nature of the month ranks first in importance,
# Jupiter and Venus produce no evil, if combust". The SECOND rite in this repo's
# sourced doctrine to waive combustion outright — Annaprasana (Ch. III p.35) is
# the other, and both waive it for the same reason: the month outranks it.
SEEMANTHAM_COMBUSTION_WAIVED: bool = True
SEEMANTHAM_AVOID_ATHIMASAM: bool = True                         # p.98

# Pumsavanam is a separate rite that p.97 says is normally BLENDED with
# Seemantham ("As a rule, it is blended with Seemantham in which case the
# delineations for the latter should be followed"). Recorded because the chapter
# states it, and kept off the Seemantham activity because the text itself says
# Seemantham's rules win when the two are combined.
PUMSAVANAM_NAKSHATRA_BEST: frozenset[int] = _nak("POOSAM", "THIRUVONAM")
PUMSAVANAM_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 6, 8, 9, 12, 14})
PUMSAVANAM_LAGNA_AVOID: frozenset[int] = frozenset({3, 4, 6})   # Gemini, Cancer, Virgo


# ═════════════════════════════════════════════════════════════════════════════
# LYING_IN_CHAMBER — Soothika-Griham, Ch. XVIII, p.99
# ═════════════════════════════════════════════════════════════════════════════
#
# "The place for child-birth (Soothika-Griham) should be arranged at the approach
# of the month of parturition." The elected moment is the *arranging* of the
# room, which is a plannable act — unlike the birth itself, which is not
# elective and which this chapter does not pretend to schedule.

# p.99: "The following asterisms are the best :-Aswini, Rohini, Mrigasirsha,
# Punarvasu, Utharapalguni, Hastha, Chithra, Swathi, Anuradha. Utharashada,
# Utharabadhrapadha and Revathi."
LYING_IN_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "UTHIRAM", "HASTHAM",
    "CHITHIRAI", "SWATHI", "ANUSHAM", "UTHIRADAM", "UTHIRATTATHI", "REVATHI",
)  # count = 12
LYING_IN_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False     # no closing clause

# p.99: "All Thithis except Rikthai (Chathurthi, Navami and Chathurdhasi)
# Ashtami, New-Moon and Full-Moon days are auspicious."
#
# THE PAGE DEFINES RIKTHAI IN PLACE — "(Chathurthi, Navami and Chathurdhasi)" —
# which is the clearest statement of that class in the transcribed pages and
# corroborates the 4/9/14 reading used for Ch. XXI p.110 and Ch. XII p.68.
LYING_IN_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 8, 9, 14})
LYING_IN_TITHI_AVOID_PURNIMA: bool = True
LYING_IN_TITHI_AVOID_AMAVASYA: bool = True
LYING_IN_TITHI_REMAINDER_IS_AUSPICIOUS: bool = True

# p.99: "The Sthira-Karanas such as Sakhunam, Chathush-padham, Nagam, and
# Kimsthughnam should be avoided, as also Vishti-Karana."
#
# This page is the book's most complete statement of the Sthira class: it both
# names the four and pins each to a tithi half in the same footnote — "Sakhunam
# occurs in the latter half of Chathurdhasi; Chathushpadham and Nagam occur in
# the two halves of the New-Moon respectively; Kimsthughnam occurs in the first
# half of Prathamai of the bright fortnight."
LYING_IN_KARANA_AVOID: frozenset[str] = frozenset(
    {"SHAKUNI", "CHATUSHPADA", "NAGA", "KIMSTUGHNA", "VISHTI"}
)

# p.99: "Monday, Wednesday, Thursday and Friday are prosperous as also the Amsas
# af the Moon, Mercury, Jupiter and Venus. Malefics should be avoided and the
# days which they govern-Sunday, Tuesday and Saturday-and the Amsas."
LYING_IN_VARA_GOOD: frozenset[str] = frozenset({"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"})
LYING_IN_VARA_AVOID: frozenset[str] = frozenset({"SUNDAY", "TUESDAY", "SATURDAY"})

# p.99: "Taurus, Leo, Scorpio and Aquarius are fruitful signs; Gemini and other
# Common signs are middling; the Movable signs, Aries, Cancer, Libra and
# Capricorn should not be considered."
#
# Fixed best / common middling / movable rejected — the same partition Ch. XX
# p.106 gives the in-gathering of grain, and the inverse of the learning
# chapters. The sentence enumerates all twelve signs, so nothing is inferred.
LYING_IN_LAGNA_BEST: frozenset[int] = frozenset({2, 5, 8, 11})
LYING_IN_LAGNA_MIDDLING: frozenset[int] = frozenset({3, 6, 9, 12})
LYING_IN_LAGNA_AVOID: frozenset[int] = frozenset({1, 4, 7, 10})

# p.99, sourced and unscored. The chapter states no house rule, no day-part and
# no personal rule at all — one of the few that does not.
LYING_IN_ARRANGE_NEAR_PARTURITION_MONTH: bool = True


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
    # ── Choulam / Tonsure ───────────────────────────────────────────────────
    "KP_CH5_TONSURE_NAKSHATRA_001": _textual(
        "KP_CH5_TONSURE_NAKSHATRA_001", "NAKSHATRA", "TONSURE", "V", 38,
        "The favourable asterisms are:- Aswini, Mrigasirsha, Punarvasu, Pushya, Hastha, "
        "Chithra, Sravana, Sravishta and Revathi. The asterisms Rohini, Utharapalguni, "
        "Swathi, Utharashada, Sathabis and Utharabadhrapadha are pretty good. The remaining "
        "twelve asterisms should be avoided.",
        "TWO positive tiers and a closed list: 9 favourable, 6 'pretty good', 12 to be "
        "avoided. The middling six are named and approved, so they score neutral rather than "
        "taking the unlisted penalty; the remaining twelve are excluded rather than merely "
        "unmentioned, which is the first exhaustive star list in this repo's sourced doctrine.",
        notes=(
            "The printed count is a self-check that passes: 9 + 6 = 15 named, and 27 - 15 = 12, "
            "exactly the 'remaining twelve' the sentence claims. Evidence both lists survived "
            "transcription whole."
        ),
    ),
    "KP_CH5_TONSURE_TITHI_001": _textual(
        "KP_CH5_TONSURE_TITHI_001", "TITHI", "TONSURE", "V", 39,
        "The fruitful Thithis are Dhwithiyai, Thrithiyai, Panchami, Sapthami, Dhasami, "
        "Ekadasi, and Thrayodasi. Those to be avoided are:- Chathurthi, Prathamai, Shashti, "
        "Ashtami, Navami, Chathurdhasi, the New-Moon and the Full-Moon days.",
        "Best 2/3/5/7/10/11/13; avoid 1/4/6/8/9/14 plus both luminary days. Both halves are "
        "stated, so neither is inferred from the other's silence.",
        notes="Prathamai is avoided here and auspicious in the DARK fortnight for Upanayanam "
              "(Ch. VII p.45) — two rites, two readings, preserved.",
    ),
    "KP_CH5_TONSURE_PAKSHA_001": _textual(
        "KP_CH5_TONSURE_PAKSHA_001", "PAKSHA", "TONSURE", "V", 37,
        "The bright fortnight bestows longevity; the dark fortnight tells upon life and "
        "fortune. [p.38] The first five Thithis of the dark fortnight are, however, beneficent. "
        "Some writers are of opinion that the first seven days of the dark fortnight are good.",
        "Shukla preferred with a stated consequence on both sides. The first five tithis of "
        "Krishna are exempted from the penalty.",
        notes=(
            "The seven-day variant is attributed ('some writers') and is NOT encoded — the "
            "five-day reading is the chapter's own. Ch. VII p.44 states the same five-day shape "
            "independently."
        ),
    ),
    "KP_CH5_TONSURE_VARA_001": _textual(
        "KP_CH5_TONSURE_VARA_001", "VARA", "TONSURE", "V", 38,
        "Monday, Wednesday, Thursday and Friday are beneficent. Sunday, Tuesday and Saturday "
        "are to be avoided.",
        "The repo's standard benefic/malefic weekday split, stated in both directions.",
        notes=(
            "p.38 then adds a CASTE-conditional exception — 'Among malefic days, Sunday is "
            "favourable for Brahmanas; Tuesday for Kshathriyas; and Saturday for Vaisyas' — "
            "which is deliberately not encoded: the picker holds no caste and must not ask."
        ),
    ),
    "KP_CH5_TONSURE_LAGNA_001": _textual(
        "KP_CH5_TONSURE_LAGNA_001", "MUHURTA_LAGNA_SIGN", "TONSURE", "V", 39,
        "Taurus, Gemini, Cancer, Virgo, Libra, Capricorn and Pisces are auspicious signs. "
        "Avoid Aries, Leo, Scorpio and Sagittari. Signs Leo and Scorpio breed disease and "
        "distress; Aries, great afflictions; Sagittari, fear of government; Aquarius, ruin of "
        "family. These signs are favourable, if occupied or aspected by benefic planets. In "
        "any case, Aquarius should be totally avoided.",
        "A complete 12-sign partition: 7 auspicious, 5 avoided. Aquarius joins the avoid set "
        "via the second sentence rather than the first, and is the only sign expressly denied "
        "the benefic-aspect escape the other four are offered.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "The benefic-aspect escape is not checkable from a day snapshot, so all five score "
            "alike today. Aquarius's stronger grading is recorded for an L6 moment-chart layer."
        ),
    ),
    "KP_CH5_TONSURE_YEAR_001": _textual(
        "KP_CH5_TONSURE_YEAR_001", "YEARS_FROM_BIRTH", "TONSURE", "V", 37,
        "It may be performed in the 3rd, 5th or 7th year from date of its birth or from that "
        "of conception. The 3rd year of birth is considered the best.",
        "Year 3, 5 or 7 from birth or conception; 3 preferred.",
        notes="NOT IMPLEMENTED — the picker takes no child birth date.",
    ),
    "KP_CH5_TONSURE_AYANA_001": _textual(
        "KP_CH5_TONSURE_AYANA_001", "AYANA", "TONSURE", "V", 37,
        "It would be most beneficent to have the Tonsure ceremony when the Sun is in northern "
        "course; the other half of the year is unfavourable.",
        "Utharayana required; Dakshinayana unfavourable. p.37 then grades the individual solar "
        "months from Capricorn through Gemini.",
        notes="NOT IMPLEMENTED — the day snapshot carries no ayana or solar-month field.",
        term="Utharayana",
    ),
    "KP_CH5_TONSURE_PREGNANCY_001": _textual(
        "KP_CH5_TONSURE_PREGNANCY_001", "HOUSEHOLD_STATE", "TONSURE", "V", 37,
        "The ceremony should not be performed when the mother of the child is pregnant, for, "
        "in that case, it will cause affliction to the parents besides being fatal to "
        "pregnancy. If, however, the child be over five years old, this rule need not be "
        "observed.",
        "A prohibition on household state rather than on time.",
        notes="NOT IMPLEMENTED and NOT IMPLEMENTABLE from a chart — surfaced as an advisory.",
    ),
    "KP_CH5_FIRST_SHAVING_001": _textual(
        "KP_CH5_FIRST_SHAVING_001", "JANMA_TARA_COUNT", "FIRST_SHAVING", "V", 40,
        "After tonsure, the first shaving should be on the 2nd, 6th, 8th or 9th day. Avoid the "
        "3rd, 5th, 7th and the 22nd day (after tonsure) as also 'Chandrashtama'. The day ruled "
        "by your asterism at birth is also bad, as also the 10th and the 19th asterisms "
        "therefrom.",
        "The janma / 10th / 19th ban belongs to the FIRST SHAVING that follows the tonsure, "
        "not to the tonsure itself — the whole paragraph is about the follow-up haircut and is "
        "counted in days after the ceremony.",
        scope="FIRST_SHAVING",
        notes=(
            "SCOPE TRAP, deliberately not promoted to TONSURE. Reading this as a tonsure rule "
            "would repeat exactly the error the doc made in giving Annaprasana the milk-feeding "
            "rite's karana clause. No first-shaving activity exists in the picker."
        ),
    ),
    # ── Upanayanam ──────────────────────────────────────────────────────────
    "KP_CH7_UPANAYANAM_NAKSHATRA_001": _textual(
        "KP_CH7_UPANAYANAM_NAKSHATRA_001", "NAKSHATRA", "UPANAYANAM", "VII", 44,
        "The following asterisms are excellent:- Aswini, Rohini, Mrigasirsha, Punarvasu, "
        "Pushya, Utharapalguni, Hastha, Chithra, Swathi, Anuradha, Utharashada, Sravana, "
        "Sravishta, Sathabis, Utharabadhrapadha and Revathi. Some are of opinion that Sravana "
        "Sravishta and Sathabis are neutral.",
        "16 stars called 'excellent'. NOT exhaustive — no closing clause, unlike Ch. V and "
        "Ch. VIII. The dissent demoting three of them is attributed and is recorded rather "
        "than applied: letting 'some are of opinion' override the sentence it dissents from "
        "would invert the chapter's own ranking.",
        notes="The disputed three are held in UPANAYANAM_NAKSHATRA_DISPUTED_AS_NEUTRAL.",
    ),
    "KP_CH7_UPANAYANAM_TITHI_001": _textual(
        "KP_CH7_UPANAYANAM_TITHI_001", "TITHI", "UPANAYANAM", "VII", 45,
        "During the bright fortnight, Dwithiyai, Thrithiyai, Panchami, Shashti, Sapthami, "
        "Dhasami and Thrayodhasi are auspicious. Ekadhasi and Dhwadhasi are of middling "
        "quality. They, however, prove beneficial if the Moon be strong at the time. Of the "
        "dark fortnight, Prathamai, Dwithiyai and Thrithiyai Thithis are considered "
        "auspicious. Some writers commend Thrayodhasi also. The days to be avoided are:- "
        "Chathurthi, Ashtami, Navami, Chathurdhasi, the Full-moon and the New-moon days.",
        "PAKSHA-CONDITIONAL, like the marriage tithi doctrine: the bright fortnight gets a "
        "seven-tithi list and the dark fortnight a three-tithi one. The registry's tithi shape "
        "is paksha-agnostic, so the encoded best set is the bright-fortnight list and the dark "
        "trio is carried by the paksha exemption instead.",
        outcome=VerificationOutcome.PARTIAL,
        notes=(
            "The narrowing is recorded rather than hidden: UPANAYANAM_TITHI_BEST_KRISHNA holds "
            "the dark-fortnight list, and the middling Ekadhasi/Dhwadhasi pair is conditional "
            "on a strong Moon, which a day snapshot cannot check."
        ),
    ),
    "KP_CH7_UPANAYANAM_PAKSHA_001": _textual(
        "KP_CH7_UPANAYANAM_PAKSHA_001", "PAKSHA", "UPANAYANAM", "VII", 44,
        "The bright fortnight and the first five Thithis of the dark fortnight are beneficial "
        "days.",
        "Shukla preferred, with the first five tithis of Krishna exempted — the identical shape "
        "Ch. V p.37-38 states for tonsure, arrived at independently.",
    ),
    "KP_CH7_UPANAYANAM_VARA_001": _textual(
        "KP_CH7_UPANAYANAM_VARA_001", "VARA", "UPANAYANAM", "VII", 45,
        "Wednesday, Thursday and Friday are good. Sunday and Monday are middling; Saturday and "
        "Tuesday should be avoided as also Monday of the dark fortnight (Krishna-paksha). "
        "Wednesday should be rejected if Mercury be 'Asthangatha' (in combustion) at the time.",
        "NARROWER than every other chapter here: only three good days, and Monday — good in "
        "Ch. III, IV, V and XXI — is merely middling, and adverse outright in the dark "
        "fortnight. Sunday and Monday are left out of both scored sets, which scores them "
        "neutral; that is what the text says and the registry has no middling weekday tier to "
        "invent for two days.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes="The Mercury-combustion condition on Wednesday is not checkable here.",
    ),
    "KP_CH7_UPANAYANAM_LAGNA_001": _textual(
        "KP_CH7_UPANAYANAM_LAGNA_001", "MUHURTA_LAGNA_SIGN", "UPANAYANAM", "VII", 45,
        "Taurus, Gemini, Cancer, Leo, Virgo, Libra, Sagittari and Pisces are favourable. The "
        "other signs should be avoided.",
        "A complete partition by closure: 8 favourable, and the closing clause makes the "
        "remaining 4 (Aries, Scorpio, Capricorn, Aquarius) avoided rather than unstated.",
    ),
    "KP_CH7_UPANAYANAM_KARANA_001": _textual(
        "KP_CH7_UPANAYANAM_KARANA_001", "KARANA", "UPANAYANAM", "VII", 52,
        "The following periods are also inauspicious - The end of a season, of a month, of a "
        "Thithi, of an asterism; Thyajyam, Vishti-Karana, Shadaseethimukham, Vyaghatham, "
        "Vajram, Vishkambam, Parigham, Vaidhrithi, Vyathipatham, Soolam, Gandam, Athigandam - "
        "all these should be avoided.",
        "Vishti karana prohibited. Only the karana half of this list is scored; the nitya "
        "yogas and the sandhi periods beside it are recorded and unscored.",
        notes=(
            "Note this chapter bans only VISHTI, not the Sthira group that Ch. III, XVIII, XX "
            "and XXI ban alongside it. Encoded as printed."
        ),
    ),
    "KP_CH7_UPANAYANAM_JANMA_TARA_001": _textual(
        "KP_CH7_UPANAYANAM_JANMA_TARA_001", "JANMA_TARA_COUNT", "UPANAYANAM", "VII", 51,
        "The asterisms to be avoided are the Janma-Nakshatra and the 5th, 7th, 10th, 19th, "
        "22nd and the 27th therefrom.",
        "Seven prohibited counts from the subject's own birth star, the birth star included. "
        "A personal-layer rule: absent from general mode by construction.",
        notes=(
            "Two of these ordinals print as OCR noise in the scan and are decoded from Ch. XVI "
            "p.92, which names the same pair outright as Anu-Jenma (10th) and Thri-Jenma "
            "(19th). A decode from a parallel passage, not a reconstruction."
        ),
    ),
    "KP_CH7_UPANAYANAM_JANMA_TARA_002": _textual(
        "KP_CH7_UPANAYANAM_JANMA_TARA_002", "JANMA_TARA_COUNT", "UPANAYANAM", "VII", 50,
        "No manner of celebration should be held on days ruled by the 10th, 16th, 18th, 23rd "
        "and 25th asterisms from the 'Jenma-Nakshathra' (one's asterism at birth). These "
        "asterisms are respectively known as Karmam, Sanghatham, Saamudhayam, Vinasanam and "
        "Manasam.",
        "A SECOND janma-tara ban on a different page of the same chapter, and the only one in "
        "the book whose counts are each given a name. Both passages stand and neither is said "
        "to supersede the other, so the engine reads their union.",
        notes=(
            "Named counts are encoded with more confidence than bare ordinals precisely because "
            "the name survives OCR where a numeral may not. The union spans 11 of 27 counts, "
            "which is wide — flagged in the registry rather than quietly narrowed."
        ),
        term="Karmam, Sanghatham, Saamudhayam, Vinasanam, Manasam",
    ),
    "KP_CH7_UPANAYANAM_YOGA_001": _textual(
        "KP_CH7_UPANAYANAM_YOGA_001", "YOGA", "UPANAYANAM", "VII", 50,
        "Spoorjitham - The Sun in a quadrant... Sputitham - Mars occupying a quadrant... "
        "Rudhitham - Saturn occupying a quadrant... Rundhram - Rahu occupying a quadrant... "
        "Ugram - Kethu occupying a quadrant... the time chosen for Upanayanam should be bereft "
        "of these five adverse Yogas.",
        "Five named ADVERSE yogas, each one malefic in a kendra. Unusual: most named yogas in "
        "this repo's sourced doctrine are bonuses, and these are the first set stated purely as "
        "disqualifiers.",
        notes="NOT IMPLEMENTED — needs muhurta-moment house occupancy.",
        term="Spoorjitham, Sputitham, Rudhitham, Rundhram, Ugram",
    ),
    "KP_CH7_UPANAYANAM_YEAR_001": _textual(
        "KP_CH7_UPANAYANAM_YEAR_001", "YEARS_FROM_BIRTH", "UPANAYANAM", "VII", 42,
        "Upanayanam should be performed in the 5th or in the 8th year from the date of "
        "conception or of birth. The 5th year is preferable as it tends to promote "
        "intellectual development.",
        "Year 5 or 8; 5 preferred. p.43 gives the caste-dependent age limits.",
        notes="NOT IMPLEMENTED — the picker takes no birth date, and holds no caste.",
    ),
    # ── Seemantham ──────────────────────────────────────────────────────────
    "KP_CH17_SEEMANTHAM_NAKSHATRA_001": _textual(
        "KP_CH17_SEEMANTHAM_NAKSHATRA_001", "NAKSHATRA", "SEEMANTHAM", "XVII", 97,
        "The following asterisms are excellent:- Rohini, Mrigasirsha, Punarvasu, Pushya, "
        "Utharapalguni, Utharashada, Utharabadhrapadha, Hastha, Sravana and Revathi. It would "
        "be well if the stellar quarter, at the time of celebration, be governed by a benefic.",
        "10 stars called excellent. Not stated exhaustive. The pada-lord preference attached to "
        "it needs the quarter's lord, which the day scorer does not compute.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
    ),
    "KP_CH17_SEEMANTHAM_NAKSHATRA_002": _textual(
        "KP_CH17_SEEMANTHAM_NAKSHATRA_002", "NAKSHATRA", "SEEMANTHAM", "XVII", 98,
        "Some astrologers are of opinion that Aswini, Anuradha and Mula may also be commended "
        "as auspicious under unavoidable circumstances.",
        "A DOUBLY hedged fallback tier — attributed to 'some astrologers' AND conditional on "
        "unavoidable circumstances. Scored as middling: named and approved, but never worth the "
        "full bonus the chapter's own ten earn.",
    ),
    "KP_CH17_SEEMANTHAM_TITHI_001": _textual(
        "KP_CH17_SEEMANTHAM_TITHI_001", "TITHI", "SEEMANTHAM", "XVII", 98,
        "Avoid Chathurthi. Shashti, Ashtami, Navami, Chathurdhasi and New-Moon days. "
        "Chathurthi. Chathurdhasi and the Full-Moon days are commended as auspicious by some "
        "when the Moon is well-dignified.",
        "Avoid in-paksha 4/6/8/9/14 and Amavasya. Purnima is NOT banned — it appears only in "
        "the commending sentence.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "INTRA-PAGE CONFLICT, the same shape as the marriage tithi finding: Chathurthi and "
            "Chathurdhasi are banned and then commended two sentences later, by an attributed "
            "minority and on a well-dignified-Moon condition the engine cannot evaluate. The "
            "ban is applied and the tension is surfaced rather than resolved."
        ),
    ),
    "KP_CH17_SEEMANTHAM_VARA_001": _textual(
        "KP_CH17_SEEMANTHAM_VARA_001", "VARA", "SEEMANTHAM", "XVII", 98,
        "Monday, Wednesday. Thursday, and Friday and the Amsas of the Moon, Mercury, Jupiter "
        "and Venus (lords of these days respectively) are fruitful. Avoid Sunday, luesday and "
        "Saturday and the Amsas of maletics (the Sun, Mars and Saturn.)",
        "The standard benefic/malefic weekday split, both halves stated.",
    ),
    "KP_CH17_SEEMANTHAM_LAGNA_001": _textual(
        "KP_CH17_SEEMANTHAM_LAGNA_001", "MUHURTA_LAGNA_SIGN", "SEEMANTHAM", "XVII", 98,
        "All signs except Leo and Scorpio are beneficent.",
        "An exclusion rule: Leo and Scorpio adverse, and the remaining ten stated beneficent "
        "rather than merely unlisted — so both the best and the avoid set come from one "
        "sentence.",
    ),
    "KP_CH17_SEEMANTHAM_JANMA_TARA_001": _textual(
        "KP_CH17_SEEMANTHAM_JANMA_TARA_001", "JANMA_TARA_COUNT", "SEEMANTHAM", "XVII", 98,
        "The wise man will avoid Seemantham under the 3rd, 5th, 7th, 10th, 19th, 22nd and 27th "
        "asterisms, from the Jenma-Nakshathra which are inauspicious.",
        "Seven prohibited counts. Note this set does NOT include the birth star itself, where "
        "Ch. V p.40 and Ch. VII p.51 both do — encoded as printed rather than harmonised "
        "toward its neighbours.",
    ),
    "KP_CH17_SEEMANTHAM_COMBUSTION_WAIVER_001": _textual(
        "KP_CH17_SEEMANTHAM_COMBUSTION_WAIVER_001", "PLANET_VISIBILITY", "SEEMANTHAM", "XVII", 98,
        "It must be observed that, as the auspicious nature of the month ranks first in "
        "importance, Jupiter and Venus produce no evil. if combust, at the time of the "
        "celebration.",
        "Combustion WAIVED, for the same reason Annaprasana waives it (Ch. III p.35): the "
        "month outranks it. The second such waiver in the sourced doctrine, and together they "
        "settle that combustion is per-activity and must never be applied globally.",
        term="combust",
        notes="NOT IMPLEMENTED as a scored factor; recorded to block a global combustion veto.",
    ),
    "KP_CH17_SEEMANTHAM_HOUSE_8_001": _textual(
        "KP_CH17_SEEMANTHAM_HOUSE_8_001", "HOUSE_OCCUPANCY_8", "SEEMANTHAM", "XVII", 98,
        "The 8th house from the rising sign at the time must be vacant. Exception - If the "
        "lord of the 8th house from the rising sign, at the time, be stationed in a quadrant "
        "(Kendhra) aspected to benefics, the adverse effects referred to in the above rule will "
        "disappear.",
        "8th-house vacancy, with an explicit cancelling exception — the only 8th-vacancy rule "
        "in this repo's doctrine that states its own escape clause.",
        notes="NOT IMPLEMENTED — no muhurta-moment house-occupancy input.",
    ),
    "KP_CH17_SEEMANTHAM_MONTH_001": _textual(
        "KP_CH17_SEEMANTHAM_MONTH_001", "MONTHS_OF_PREGNANCY", "SEEMANTHAM", "XVII", 97,
        "This must take place in the 4th, 6th or 8th solar month. Followers of Bhodhayana and "
        "Kowsheethaka may have Seemantham in the 5th or the 7th month. The ceremony is ordained "
        "only in respect to the first conception.",
        "Month 4, 6 or 8 of pregnancy, with a named-school variant of 5 or 7, and restricted to "
        "a first pregnancy.",
        notes="NOT IMPLEMENTED — the picker takes no conception date.",
    ),
    "KP_CH17_PUMSAVANAM_001": _textual(
        "KP_CH17_PUMSAVANAM_001", "NAKSHATRA", "PUMSAVANAM", "XVII", 96,
        "This function is performed when the woman is in the family way, in the 3rd month, "
        "preferably... Pumsavanam may also be celebrated in the 4th, 6th or 8th month under "
        "asterisms, Pushya or Sravana. All Thithis except Chathurthi, Shashti, Ashtami, "
        "Navami, Dhwadhasi, Chathurdhasi, Full-Moon and New-Moon days, are auspicious. All "
        "signs, except Gemini, Cancer and Virgo, are favourable.",
        "A separate rite with its own two-star list and its own tithi and sign rules.",
        scope="PUMSAVANAM",
        notes=(
            "NOT EXPOSED as an activity, on the chapter's own instruction: p.97 says 'As a "
            "rule, it is blended with Seemantham in which case the delineations for the latter "
            "should be followed.' The text itself subordinates these rules to Seemantham's when "
            "the two are combined, which is how they are almost always performed."
        ),
    ),
    # ── Ch. XVIII — the lying-in apartment ──────────────────────────────────
    "KP_CH18_LYING_IN_NAKSHATRA_001": _textual(
        "KP_CH18_LYING_IN_NAKSHATRA_001", "NAKSHATRA", "LYING_IN_CHAMBER", "XVIII", 99,
        "The place for child-birth (Soothika-Griham) should be arranged at the approach of the "
        "month of parturition. The following asterisms are the best :-Aswini, Rohini, "
        "Mrigasirsha, Punarvasu, Utharapalguni, Hastha, Chithra, Swathi, Anuradha. Utharashada, "
        "Utharabadhrapadha and Revathi.",
        "12 stars for arranging the birth chamber. Not exhaustive — no closing clause.",
        notes=(
            "The elected moment is the ARRANGING of the room, not the birth. That distinction "
            "is what makes this an election rule at all: Ch. II treats birth itself as natal "
            "material to be read, never as a moment to be chosen."
        ),
        term="Soothika-Griham",
    ),
    "KP_CH18_LYING_IN_TITHI_001": _textual(
        "KP_CH18_LYING_IN_TITHI_001", "TITHI", "LYING_IN_CHAMBER", "XVIII", 99,
        "All Thithis except Rikthai (Chathurthi, Navami and Chathurdhasi) Ashtami, New-Moon and "
        "Full-Moon days are auspicious.",
        "Rikthai plus Ashtami plus both lunations excluded; everything else positively good. "
        "The 'except X are auspicious' form, which the registry grades a penalty rather than a "
        "veto.",
        notes=(
            "THIS PAGE DEFINES RIKTHAI IN PLACE. It is the clearest statement of that class in "
            "the transcribed pages, and it corroborates the 4/9/14 reading this repo already "
            "applies at Ch. XXI p.110 and Ch. XII p.68, neither of which enumerates it."
        ),
        term="Rikthai",
    ),
    "KP_CH18_LYING_IN_KARANA_001": _textual(
        "KP_CH18_LYING_IN_KARANA_001", "KARANA", "LYING_IN_CHAMBER", "XVIII", 99,
        "The Sthira-Karanas such as Sakhunam, Chathush-padham, Nagam, and Kimsthughnam should "
        "be avoided, as also Vishti-Karana. ... Sakhunam occurs in the latter half of "
        "Chathurdhasi; Chathushpadham and Nagam occur in the two halves of the New-Moon "
        "respectively; Kimsthughnam occurs in the first half of Prathamai of the bright "
        "fortnight.",
        "The Sthira four and Vishti prohibited, with the class both enumerated AND pinned to "
        "tithi halves — the book's most complete statement of it.",
        notes=(
            "This footnote is the third independent corroboration of the Sthira membership "
            "list, after Ch. XX p.105 and Ch. XXI p.110, and the only one that also fixes when "
            "each occurs. It is what lets `MILK_FEEDING_KARANA_AVOID` expand a bare class name "
            "into four members without guessing."
        ),
        term="Sthira-Karana",
    ),
    "KP_CH18_LYING_IN_VARA_001": _textual(
        "KP_CH18_LYING_IN_VARA_001", "VARA", "LYING_IN_CHAMBER", "XVIII", 99,
        "Monday, Wednesday, Thursday and Friday are prosperous as also the Amsas af the Moon, "
        "Mercury, Jupiter and Venus. Malefics should be avoided and the days which they "
        "govern-Sunday, Tuesday and Saturday-and the Amsas.",
        "The book's standard weekday split, stated with both halves and both lord sets — one "
        "of the cleanest statements of it in the transcribed pages.",
    ),
    "KP_CH18_LYING_IN_LAGNA_001": _textual(
        "KP_CH18_LYING_IN_LAGNA_001", "MUHURTA_LAGNA_SIGN", "LYING_IN_CHAMBER", "XVIII", 99,
        "Taurus, Leo, Scorpio and Aquarius are fruitful signs; Gemini and other Common signs "
        "are middling; the Movable signs, Aries, Cancer, Libra and Capricorn should not be "
        "considered.",
        "Fixed best, common middling, movable rejected. The sentence enumerates all twelve "
        "signs, so no membership is inferred.",
        notes=(
            "The same partition Ch. XX p.106 gives the in-gathering of grain, and the exact "
            "inverse of the one Ch. VI, VIII and XI give the learning rites. Two chapters "
            "sixty pages apart agreeing is worth recording; it is not treated as a book-wide "
            "default, since Ch. X states the opposite."
        ),
    ),
}
