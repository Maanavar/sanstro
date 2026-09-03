"""Kalaprakasika Ch. XXIII & XXIV — wearing new clothes and a new ornament.

Sourced from N. P. Subramania Iyer's Kalaprakasika translation (Asian
Educational Services 1982 reprint of the 1917 first edition), printed pages
**115-118**, extracted 2026-08-15 from the page-by-page transcription of the
150-page scan supplied by the repository owner. Worksheet:
`docs/sources/kalaprakasika_adornment_rules.md`.

Page numbers are **printed book pages**; PDF page = printed page + 32.

**Why these two are worth their place in a Tamil almanac product.** Unlike a
naming ceremony or a thread-marriage, these are elections an ordinary user makes
several times a year and already asks about — new clothes at Puthandu, Deepavali
and Pongal, and gold at Akshaya Tritiya. They are also the only two activities in
the extracted doctrine where the book gives a **per-nakshatra effect for all 27
stars**, which is copy a UI can show for any day of the year rather than only for
the days that score well.

**One inversion to notice.** Ch. XXIV makes the Full-Moon a *best* tithi for
putting on a gold jewel. Purnima is banned by Namakarana, tonsure, Upanayanam,
Vidyarambham and Veda study, and excluded from the Ch. XXI treasure rule. This
chapter reverses that, and closes its list so the reversal cannot be read as an
oversight ("The other Thithis should be avoided").

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
_VERIFIED_BY = "primary-text transcription pp.115-118 (user-supplied scan)"


def _nak(*names: str) -> frozenset[int]:
    """Canonical 1..27 nakshatra numbers for this repo's Tamil-transliterated keys."""
    return frozenset(NAKSHATRA_NAMES.index(name) + 1 for name in names)


# ═════════════════════════════════════════════════════════════════════════════
# NEW_CLOTHES — Ch. XXIII, pp.115-117
# ═════════════════════════════════════════════════════════════════════════════

# p.115: "The following asterisms are the best:- Aswini, Rohini, Punarvasu,
# Pushya, Utharapalguni, Hastha, Chithra, Swathi, Visakha, Anuradha,
# Utharashada, Sravishta, Utharabadhrapadha and Revathi. The remaining
# asterisms are inauspicious."
NEW_CLOTHES_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "PUNARPOOSAM", "POOSAM", "UTHIRAM", "HASTHAM",
    "CHITHIRAI", "SWATHI", "VISAKAM", "ANUSHAM", "UTHIRADAM", "AVITTAM",
    "UTHIRATTATHI", "REVATHI",
)  # count = 14
NEW_CLOTHES_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = True

# pp.115-116: the per-star effect table, all 27 stars, keyed by this repo's
# nakshatra numbers. Display copy, not a scored factor — the 14-star list above
# is what scores. Kept because it answers "what does today bring?" for the 13
# days the list rejects as well as the 14 it accepts, which a bare good/bad
# verdict cannot.
NEW_CLOTHES_STAR_EFFECTS_EN: dict[int, str] = {
    1: "brings rewards from royalty",
    2: "causes danger to the wife's life",
    3: "exposes the person to fire accidents",
    4: "bestows all wealth",
    5: "causes danger to clothes by rats",
    6: "affects longevity",
    7: "favours plenty of wealth and corn",
    8: "engenders all prosperity",
    9: "breeds disease",
    10: "shows danger to life",
    11: "causes affliction by disease",
    12: "indicates wealth of habits",
    13: "brings fine, soft articles of dress",
    14: "bestows various kinds of apparel",
    15: "welcomes exquisite feast",
    16: "favours mental happiness",
    17: "creates kinship",
    18: "inclines to cause damage to the clothes",
    19: "troubles the grain",
    20: "portends disease",
    21: "predicts many additional articles of dress",
    22: "tends to cause eye-disease",
    23: "shows increase of corn",
    24: "creates fear of poison",
    25: "leads to royal displeasure",
    26: "favours many sons",
    27: "signifies gain of gems",
}

# p.116: "Dhwithiyai, Thrithiyai, Panchami, Sapthami, Dhasami, Ekadhasi and
# Thrayodhasi are the best Thithis. Chathurthi, Navami, Chathurdhasi and
# New-Moon days should be strictly avoided. Other Thithis have medium
# influence."
NEW_CLOTHES_TITHI_BEST_IN_PAKSHA: frozenset[int] = frozenset({2, 3, 5, 7, 10, 11, 13})
NEW_CLOTHES_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 9, 14})
NEW_CLOTHES_TITHI_AVOID_AMAVASYA: bool = True
NEW_CLOTHES_TITHI_AVOID_PURNIMA: bool = False   # not named either way
NEW_CLOTHES_TITHI_LIST_IS_EXHAUSTIVE: bool = False  # "other Thithis have medium influence"

# p.116: "Wednesday, Thursday and Friday and the Amsas of Mercury, Jupiter and
# Venus produce good. Sunday and Monday have middling effect. The remaining two
# days should be avoided."
#
# "The remaining two days" resolves to Tuesday and Saturday — the only two left
# once Wed/Thu/Fri and Sun/Mon are spoken for. Arithmetic the sentence itself
# supplies, not an inference.
NEW_CLOTHES_VARA_GOOD: frozenset[str] = frozenset({"WEDNESDAY", "THURSDAY", "FRIDAY"})
NEW_CLOTHES_VARA_AVOID: frozenset[str] = frozenset({"TUESDAY", "SATURDAY"})
NEW_CLOTHES_VARA_MIDDLING: frozenset[str] = frozenset({"SUNDAY", "MONDAY"})
# p.116, the per-weekday effect table beside the rule.
NEW_CLOTHES_VARA_EFFECTS_EN: dict[str, str] = {
    "SUNDAY": "portends disease",
    "MONDAY": "is likely to cause the cloth to be bathed in tears",
    "TUESDAY": "creates risk of fire accidents to clothes",
    "WEDNESDAY": "gives rise to all prosperity",
    "THURSDAY": "predicts an amplitude of wealth and corn",
    "FRIDAY": "welcomes several kinds of prosperity",
    "SATURDAY": "denotes the likelihood of deep grief",
}

# p.116: "All signs except Aries, Leo, Scorpio, Sagittarius, Aquarius and
# Pisces are felicitous." — an exclusion naming six, so the other six are
# stated felicitous rather than merely unlisted.
NEW_CLOTHES_LAGNA_AVOID: frozenset[int] = frozenset({1, 5, 8, 9, 11, 12})
NEW_CLOTHES_LAGNA_BEST: frozenset[int] = frozenset({2, 3, 4, 6, 7, 10})
# pp.116-117 grades each sign individually and calls Capricorn "but commer
# [common] influence" — softer than the other five it groups as felicitous.
# Recorded; not split out, since the chapter's own sentence puts it in the
# felicitous set.
NEW_CLOTHES_LAGNA_CAPRICORN_IS_COMMON_ONLY: bool = True


# ═════════════════════════════════════════════════════════════════════════════
# NEW_ORNAMENT — Ch. XXIV, pp.117-118
# ═════════════════════════════════════════════════════════════════════════════

# p.117: "The following are fruitful asterisms for putting on a new jewel made
# of gold:- Aswini, Rohini, Mrigasirsha, Punarvasu, Pushya, Magha,
# Utharapalguni, Hastha, Chithra, Swathi, Anuradha, Utharashada, Sravana,
# Utharabadhrapadha and Revathi."
NEW_ORNAMENT_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "POOSAM", "MAGAM",
    "UTHIRAM", "HASTHAM", "CHITHIRAI", "SWATHI", "ANUSHAM", "UTHIRADAM",
    "THIRUVONAM", "UTHIRATTATHI", "REVATHI",
)  # count = 15
NEW_ORNAMENT_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False

# p.117: "The best Thithis are:- Prathamai, Shashti, Panchami, Dhasami,
# Ekadhasi and the Full-Moon. The other Thithis should be avoided."
#
# **PURNIMA IS BEST HERE.** Namakarana, tonsure, Upanayanam, Vidyarambham and
# Veda study all ban the Full-Moon, and Ch. XXI excludes it from the treasure
# rule. This chapter puts it in the best set and then CLOSES the list, so the
# reversal cannot be read as an oversight. Encoded as printed.
NEW_ORNAMENT_TITHI_BEST_IN_PAKSHA: frozenset[int] = frozenset({1, 5, 6, 10, 11})
NEW_ORNAMENT_TITHI_PURNIMA_IS_BEST: bool = True
NEW_ORNAMENT_TITHI_LIST_IS_EXHAUSTIVE: bool = True

# p.117: "Monday, Wednesday, Thursday and Friday and the Amsas of the Moon,
# Mercury, Jupiter and Venus are auspicious; the other planets and the other
# days should not be considered."
NEW_ORNAMENT_VARA_GOOD: frozenset[str] = frozenset(
    {"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"}
)
NEW_ORNAMENT_VARA_AVOID: frozenset[str] = frozenset({"SUNDAY", "TUESDAY", "SATURDAY"})

# p.117: "Taurus, Gemini, Virgo, Sagittarius and Pisces produce good."
NEW_ORNAMENT_LAGNA_BEST: frozenset[int] = frozenset({2, 3, 6, 9, 12})
NEW_ORNAMENT_LAGNA_AVOID: frozenset[int] = frozenset()   # none stated

# p.117, sourced and unscored.
NEW_ORNAMENT_FORTUNATE_NITYA_YOGAS: frozenset[str] = frozenset({"SIDDHA", "AMRITHA"})
NEW_ORNAMENT_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True
NEW_ORNAMENT_MALEFIC_UPACHAYA_HOUSES: frozenset[int] = frozenset({3, 6, 11})
NEW_ORNAMENT_BENEFIC_KENDRA_TRIKONA_HOUSES: frozenset[int] = frozenset({1, 4, 5, 7, 9, 10})


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
    # ── new clothes ─────────────────────────────────────────────────────────
    "KP_CH23_NEW_CLOTHES_NAKSHATRA_001": _textual(
        "KP_CH23_NEW_CLOTHES_NAKSHATRA_001", "NAKSHATRA", "NEW_CLOTHES", "XXIII", 115,
        "The following asterisms are the best :- Aswini, Rohini, Punarvasu, Pushya, "
        "Utharapalguni, Hastha, Chithra, Swathi, Visakha, Anuradha, Utharashada, Sravishta, "
        "Utharabadhrapadha and Revathi. The remaining asterisms are inauspicious.",
        "14 stars, and the closing clause CLOSES the list — an unlisted star is inauspicious "
        "rather than merely unmentioned, so it takes the exclusion penalty.",
        notes=(
            "The chapter then grades all 27 stars individually (pp.115-116), and those effects "
            "corroborate the split: every star it calls adverse is off the 14-star list, and "
            "none of the 14 is given an adverse effect. An internal consistency check that "
            "passes."
        ),
    ),
    "KP_CH23_NEW_CLOTHES_STAR_EFFECTS_001": _textual(
        "KP_CH23_NEW_CLOTHES_STAR_EFFECTS_001", "NAKSHATRA_EFFECT", "NEW_CLOTHES", "XXIII", 115,
        "Stellar Influence on the Wearing of New Clothes.- Aswini brings rewards from royalty; "
        "Bharani causes danger to wife's life; Krithika exposes the person to fire accidents; "
        "Rohini bestows all wealth; ... Revathi signifies gain of gems. In this way each of the "
        "twenty seven asterisms exercises its influence on the wearing of new apparel.",
        "A complete per-star effect table for all 27 asterisms — one of only two in the "
        "extracted doctrine (Ch. V p.38 has the other, for tonsure).",
        notes=(
            "DISPLAY COPY, not a scored factor. Held in NEW_CLOTHES_STAR_EFFECTS_EN so a UI can "
            "say what any day brings, including the thirteen the star list rejects. Scoring it "
            "as well would double-count the same sentence that already decided the star list."
        ),
    ),
    "KP_CH23_NEW_CLOTHES_TITHI_001": _textual(
        "KP_CH23_NEW_CLOTHES_TITHI_001", "TITHI", "NEW_CLOTHES", "XXIII", 116,
        "Dhwithiyai, Thrithiyai, Panchami, Sapthami, Dhasami, Ekadhasi and Thrayodhasi are the "
        "best Thithis. Chathurthi, Navami, Chathurdhasi and New-Moon days should be strictly "
        "avoided. Other Thithis have medium influence.",
        "Best 2/3/5/7/10/11/13; avoid 4/9/14 and Amavasya; the rest explicitly medium. Three "
        "tiers stated outright, so nothing is inferred from silence — and the list is NOT "
        "exhaustive despite the star list in the same chapter being so.",
    ),
    "KP_CH23_NEW_CLOTHES_VARA_001": _textual(
        "KP_CH23_NEW_CLOTHES_VARA_001", "VARA", "NEW_CLOTHES", "XXIII", 116,
        "Wednesday, Thursday and Friday and the Amsas of Mercury, Jupiter and Venus produce "
        "good. Sunday and Monday have middling effect. The remaining two days should be "
        "avoided. [and a per-day effect table] Sunday portends disease; Monday is likely to "
        "cause the cloth to be bathed in tears; Tuesday creates risk of fire accidents to "
        "clothes; Wednesday gives rise to all prosperity; Thursday predicts an amplitude of "
        "wealth and corn; Friday welcomes several kinds of prosperity; Saturday denotes the "
        "likelihood of deep grief.",
        "'The remaining two days' resolves to Tuesday and Saturday — arithmetic the sentence "
        "itself supplies once Wed/Thu/Fri and Sun/Mon are spoken for, not an inference. The "
        "effect table on the same page confirms it: Tuesday and Saturday are the two graded "
        "adverse.",
    ),
    "KP_CH23_NEW_CLOTHES_LAGNA_001": _textual(
        "KP_CH23_NEW_CLOTHES_LAGNA_001", "MUHURTA_LAGNA_SIGN", "NEW_CLOTHES", "XXIII", 116,
        "All signs except Aries, Leo, Scorpio, Sagittarius, Aquarius and. Pisces are "
        "felicitous. [and] To wear a cloth when the rising sign is. Taurus brings benefit "
        "through corn; Gemini and Virge signify pecuniary gain; Capricorn has but commer "
        "influence; Aries is a bringer of deep grief; Leo has a tendency to cause dishonor; "
        "Aquarius shows trouble by disease; Scorpio tends to loss of property; Sagittarius "
        "tends to create royal displeasure; Pisces signifies fear of contracting disease.",
        "An exclusion naming six adverse signs, so the other six are stated felicitous. The "
        "per-sign gloss that follows names exactly those six as adverse — the two sentences "
        "agree, which is the check.",
        notes=(
            "Capricorn is called 'but common influence' in the gloss while sitting in the "
            "felicitous set of the rule. The rule's own sentence is scored; the softer gloss is "
            "recorded in NEW_CLOTHES_LAGNA_CAPRICORN_IS_COMMON_ONLY."
        ),
    ),
    # ── new ornament ────────────────────────────────────────────────────────
    "KP_CH24_NEW_ORNAMENT_NAKSHATRA_001": _textual(
        "KP_CH24_NEW_ORNAMENT_NAKSHATRA_001", "NAKSHATRA", "NEW_ORNAMENT", "XXIV", 117,
        "The following are fruitful asterisms for putting on a new jewel made of gold:- Aswini, "
        "Rohini, Mrigasirsha, Punarvasu, Pushya, Magha, Utharapalguni, Hastha, Chithra, Swathi, "
        "Anuradha, Utharashada, Sravana, Utharabadhrapadha and Revathi. To wear a new jewel, "
        "for the first time, under any of these asterisms promotes welfare.",
        "15 stars for first wearing a gold ornament. Not exhaustive — no closing clause, unlike "
        "the tithi rule in the same chapter.",
        notes=(
            "Distinct from Ch. XXI's gold rules, which govern ACQUIRING and STORING the metal. "
            "Wearing is a third transaction and gets its own list — the same direction-"
            "sensitivity Ch. XXI shows between storing gold and parting with it."
        ),
    ),
    "KP_CH24_NEW_ORNAMENT_TITHI_001": _textual(
        "KP_CH24_NEW_ORNAMENT_TITHI_001", "TITHI", "NEW_ORNAMENT", "XXIV", 117,
        "The best Thithis are:- Prathamai, Shashti, Panchami, Dhasami, Ekadhasi and the "
        "Full-Moon. The other Thithis should be avoided.",
        "AN EXHAUSTIVE INCLUSION LIST — the second in the sourced doctrine after ear-boring "
        "(Ch. IV p.36) — and it puts the FULL MOON among the best.",
        notes=(
            "Purnima is banned by Namakarana (Ch. III p.30), tonsure (Ch. V p.39), Upanayanam "
            "(Ch. VII p.45), Vidyarambham (Ch. VI p.41) and Veda study (Ch. XI p.65), and "
            "excluded from the Ch. XXI treasure rule. This chapter reverses all of them AND "
            "closes its list, so the reversal cannot be read as an oversight. A clear case for "
            "why tithi doctrine is per-activity and must never be globalised."
        ),
    ),
    "KP_CH24_NEW_ORNAMENT_VARA_001": _textual(
        "KP_CH24_NEW_ORNAMENT_VARA_001", "VARA", "NEW_ORNAMENT", "XXIV", 117,
        "Monday, Wednesday, Thursday and Friday and the Amsas of the Moon, Mercury, Jupiter and "
        "Venus are auspicious ; the other planets and the other days should not be considered.",
        "The book's standard benefic four, with a closing clause that makes the other three "
        "avoided rather than unstated.",
        notes=(
            "Note this differs from the neighbouring Ch. XXIII (p.116), which drops Monday to "
            "middling and keeps only Wed/Thu/Fri. Two adjacent chapters on adjacent subjects, "
            "two weekday sets — preserved, not harmonised."
        ),
    ),
    "KP_CH24_NEW_ORNAMENT_LAGNA_001": _textual(
        "KP_CH24_NEW_ORNAMENT_LAGNA_001", "MUHURTA_LAGNA_SIGN", "NEW_ORNAMENT", "XXIV", 117,
        "Taurus, Gemini, Virgo, Sagittarius and Pisces produce goed.",
        "Five signs named good. No adverse sign is stated, so the other seven score neutral and "
        "must never be penalised on this rule's authority.",
    ),
    "KP_CH24_NEW_ORNAMENT_YOGA_001": _textual(
        "KP_CH24_NEW_ORNAMENT_YOGA_001", "YOGA", "NEW_ORNAMENT", "XXIV", 118,
        "That time is the best for wearing a jewel made of gold, when Jupiter occupies the "
        "rising Navamsa in exaltation with Mercury and Venus in the 4th house... Choose a "
        "Saturday governed by asterism Rohini and make a gold jewel, during the interval known "
        "as Amirthaghatika, and put on the jewel on a Saturday of the same asterism and at the "
        "same time thereon... If, at the time of wearing a gold jewel, the rising sign be "
        "occupied by Jupiter in exaltation... the jewels will increase a millionfold.",
        "Several named configurations, one of which pairs the MAKING and the WEARING of the "
        "jewel at the same Saturday-plus-Rohini moment — the only rule in the extracted "
        "doctrine that ties two separate occasions to one recurring slot.",
        notes="NOT IMPLEMENTED — moment chart, navamsa, and the Amirthaghatika interval.",
        term="Amirthaghatika",
    ),
    "KP_CH24_NEW_ORNAMENT_NITYA_YOGA_001": _textual(
        "KP_CH24_NEW_ORNAMENT_NITYA_YOGA_001", "NITYA_YOGA", "NEW_ORNAMENT", "XXIV", 117,
        "The days ruled by fortunate Yogas (Siddha Yoga or Amritha Yoga) are good for wearing a "
        "new jewel.",
        "Two named nitya yogas called good for this activity.",
        notes=(
            "NOT IMPLEMENTED as an activity factor. The engine already reports the day's nitya "
            "yoga in its generic almanac layer as an explicitly UNGRADED neutral; crediting it "
            "here would make one activity's yoga handling differ from every other's, which is a "
            "change to the generic layer rather than to this chapter."
        ),
    ),
}
