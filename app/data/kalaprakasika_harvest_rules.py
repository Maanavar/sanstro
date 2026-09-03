"""Kalaprakasika Ch. XX — harvest, in-gathering, and the expenditure of corn.

Sourced from N. P. Subramania Iyer's Kalaprakasika translation (Asian
Educational Services 1982 reprint of the 1917 first edition), printed pages
**105-109**, extracted 2026-08-15 from the page-by-page transcription of the
150-page scan supplied by the repository owner. Worksheet:
`docs/sources/kalaprakasika_harvest_rules.md`.

Page numbers are **printed book pages**; PDF page = printed page + 32.

**This is the chapter `GRAIN` was missing.** `kalaprakasika_treasure_rules`
records that Ch. XXI names grain in exactly one sentence and that the
substantive doctrine lives here. It does: three distinct grain activities, each
with its own tables, plus the Dhanya-Parvatha, Dhanya-Meru and Dhanyarnava
yogas. Ch. XXI's `GRAIN` activity is left scored as it was — it is a *storing*
rule and these are reaping, gathering and spending rules — and its gap note now
points here instead of claiming the chapter was never read.

**Three weekday findings that break the book's own pattern.** Mon/Wed/Thu/Fri
good and Sun/Tue/Sat bad is near-universal in this text. Here:

* in-gathering (p.106) calls **Saturday one of the four best days**, and demotes
  Wednesday to neutral;
* expenditure of corn (p.109) **avoids Friday** — then disputes itself in the
  next sentence;
* expenditure of corn also calls **Saturday** favourable (p.109).

None is harmonised toward the pattern. A chapter that disagrees with its
neighbours is evidence about the doctrine, not evidence of a transcription slip.

Data only. The engine reads this through `app/data/muhurta_activity_registry.py`.
"""
from __future__ import annotations

from dataclasses import dataclass

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
_CHAPTER = "XX"
_EDITION = "Subramania Iyer"
_VERIFIED_ON = "2026-08-15"
_VERIFIED_BY = "primary-text transcription pp.105-109 (user-supplied scan)"


def _nak(*names: str) -> frozenset[int]:
    """Canonical 1..27 nakshatra numbers for this repo's Tamil-transliterated keys."""
    return frozenset(NAKSHATRA_NAMES.index(name) + 1 for name in names)


_STHIRA_AND_VISHTI: frozenset[str] = frozenset(
    {"SHAKUNI", "CHATUSHPADA", "NAGA", "KIMSTUGHNA", "VISHTI"}
)
_FIXED_SIGNS = frozenset({2, 5, 8, 11})
_COMMON_SIGNS = frozenset({3, 6, 9, 12})
_MOVABLE_SIGNS = frozenset({1, 4, 7, 10})


# ═════════════════════════════════════════════════════════════════════════════
# HARVEST — starting to reap, p.105
# ═════════════════════════════════════════════════════════════════════════════

# p.105: "To start reaping the crop, the most favourable asterisms are;-
# Bharani, Rohini, Mrigasirsha, Ardhra, Pushya, Magha, Utharapalguni, Hastha,
# Visakha, Anuradha, Utharashada, Sravana, Utharabadhrapadha and Revathi."
HARVEST_NAKSHATRA_BEST: frozenset[int] = _nak(
    "BHARANI", "ROHINI", "MIRUGASEERIDAM", "THIRUVATHIRAI", "POOSAM", "MAGAM",
    "UTHIRAM", "HASTHAM", "VISAKAM", "ANUSHAM", "UTHIRADAM", "THIRUVONAM",
    "UTHIRATTATHI", "REVATHI",
)  # count = 14
HARVEST_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False

# p.105: "Of Thithis, avoid Chathurthi, Ashtami, Navami, Ekadhasi, Dhwadhasi,
# Chathurdhasi and New-Moon... The remaining Thithis and Karanas are good."
HARVEST_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 8, 9, 11, 12, 14})
HARVEST_TITHI_AVOID_AMAVASYA: bool = True
HARVEST_TITHI_AVOID_PURNIMA: bool = False
HARVEST_TITHI_REMAINDER_IS_AUSPICIOUS: bool = True

# p.105: "Sthira Karanas (Sakunam, Chathushpadham, Nagam and Kimsthughnam) and
# Vishti Karanas should be positively avoided."
HARVEST_KARANA_AVOID: frozenset[str] = _STHIRA_AND_VISHTI

# p.105: "Signs belonging to benefics and the days governed by them are
# felicitous."
#
# The weekday half is unambiguous: this book names the same four benefics —
# Moon, Mercury, Jupiter, Venus — as the good amsa lords in a dozen chapters, and
# their days are Monday, Wednesday, Thursday and Friday.
HARVEST_VARA_GOOD: frozenset[str] = frozenset({"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"})
HARVEST_VARA_AVOID: frozenset[str] = frozenset()  # none named
# The sign half needs one step the sentence does not print: which signs those
# four own. Moon=Cancer; Mercury=Gemini, Virgo; Jupiter=Sagittarius, Pisces;
# Venus=Taurus, Libra. Recorded at INTERPRETED confidence and NOT scored,
# because "signs belonging to benefics" is a derivation and every other lagna
# rule in this repo is a list the text printed.
HARVEST_BENEFIC_OWNED_SIGNS: frozenset[int] = frozenset({2, 3, 4, 6, 7, 9, 12})

# p.106: "Avoid Jenma-Nakshathra and the 1oth and the 19th asterisms therefrom.
# To start work under these asterisms will result in loss."
HARVEST_JANMA_TARA_PROHIBITED: frozenset[int] = frozenset({1, 10, 19})

# p.105, three stated lagna+star pairings. Recorded, not scored: each needs a
# sign AND a star to coincide, which is a yoga rather than a factor.
HARVEST_COMMENCEMENT_YOGAS: tuple[tuple[int, str], ...] = (
    (12, "BHARANI"), (8, "THIRUVONAM"), (4, "VISAKAM"),
)
HARVEST_FRUIT_GATHERING_SIGNS: frozenset[int] = frozenset({1, 4})   # p.106
HARVEST_AVOID_AFTER_NIGHTFALL: bool = True                          # p.106


# ═════════════════════════════════════════════════════════════════════════════
# HARVEST_INGATHERING — bringing the crop in, pp.106-108
# ═════════════════════════════════════════════════════════════════════════════

# p.106: "The best asterisms are:- Bharani, Rohini, Mrigasirsha, Purvapalguni,
# Ardhra, Punarvasu, Pushya, Magha, Utharapalguni, Hastha, Swathi, Anuradha,
# Mula, Utharashada, Sravana, Utharabadhrapadha and Revathi."
INGATHERING_NAKSHATRA_BEST: frozenset[int] = _nak(
    "BHARANI", "ROHINI", "MIRUGASEERIDAM", "POORAM", "THIRUVATHIRAI",
    "PUNARPOOSAM", "POOSAM", "MAGAM", "UTHIRAM", "HASTHAM", "SWATHI", "ANUSHAM",
    "MOOLAM", "UTHIRADAM", "THIRUVONAM", "UTHIRATTATHI", "REVATHI",
)  # count = 17
INGATHERING_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False

# p.106: "All Thithis, except Chathurthi, Shashti, Ashtami, Navami, Dhwadhasi,
# Chathurdhasi and New-Moon, are good."
INGATHERING_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 6, 8, 9, 12, 14})
INGATHERING_TITHI_AVOID_AMAVASYA: bool = True
INGATHERING_TITHI_AVOID_PURNIMA: bool = False
INGATHERING_TITHI_REMAINDER_IS_AUSPICIOUS: bool = True

INGATHERING_KARANA_AVOID: frozenset[str] = _STHIRA_AND_VISHTI   # p.106

# p.106: "Monday, Thursday, Friday and Saturday are the best as also the Amsas
# and signs of the lords thereof, viz., the Moon, Jupiter, Venus and Saturn.
# Wednesday: and the Amsa of Mercury are neutrals. Avoid Tuesday and Sunday and
# the Amsas ef Mars and the Sun."
#
# SATURDAY IS BEST HERE. Every samskara chapter in this repo puts Saturday in
# the avoid set, and this chapter puts it among the four best while demoting
# Wednesday — which those chapters call good — to neutral. Encoded as printed.
INGATHERING_VARA_GOOD: frozenset[str] = frozenset(
    {"MONDAY", "THURSDAY", "FRIDAY", "SATURDAY"}
)
INGATHERING_VARA_AVOID: frozenset[str] = frozenset({"TUESDAY", "SUNDAY"})
INGATHERING_VARA_MIDDLING: frozenset[str] = frozenset({"WEDNESDAY"})

# p.106: "Fixed signs bestow much good; Common signs cause profit as well as
# loss. Nc collection of grain should be commenced when the rising sign is a
# Movable one"
INGATHERING_LAGNA_BEST: frozenset[int] = _FIXED_SIGNS
INGATHERING_LAGNA_MIDDLING: frozenset[int] = _COMMON_SIGNS
INGATHERING_LAGNA_AVOID: frozenset[int] = _MOVABLE_SIGNS

# p.106, sourced and unscored.
INGATHERING_AVOID_LUNAR_MONTHS: tuple[str, ...] = ("SRAVANA", "BADHRAPADHA")
INGATHERING_SATURN_IN_4TH_IS_BENEFIC: bool = True
INGATHERING_MALEFIC_UPACHAYA_HOUSES: frozenset[int] = frozenset({3, 6, 11})
INGATHERING_BENEFIC_GOOD_HOUSES: frozenset[int] = frozenset({1, 4, 5, 7, 9, 10})

# p.107 footnote — a REFERENCE TABLE, not a rule of this chapter.
#
# "Oordhwa-Mukha Asterisms are :- Rohini, Ardhra, Pushya, Utharapalguni,
# Utharashada, Sravana, Sravishta, Sathabis and Utharabadhrapadha."
#
# Worth its place here because Ch. XIV p.79 RULES on this class for marriage
# ("'Oordhva-Mukha' asterisms are the most fruitful, Atho-Mukha asterisms cause
# harm and 'Thiryag Mukha' asterisms breed fever") and never defines it. This
# footnote is the definition that passage depends on. It is recorded and
# deliberately NOT wired to marriage: marriage scoring is unchanged in this pass,
# and the two remaining classes are still undefined in the pages transcribed.
NAKSHATRA_CLASS_OORDHWA_MUKHA: frozenset[int] = _nak(
    "ROHINI", "THIRUVATHIRAI", "POOSAM", "UTHIRAM", "UTHIRADAM", "THIRUVONAM",
    "AVITTAM", "SADAYAM", "UTHIRATTATHI",
)  # count = 9


@dataclass(frozen=True, slots=True)
class HarvestYoga:
    """One named auspicious configuration, kept in the page's own wording."""

    name: str
    definition: str
    applies_to: tuple[str, ...]
    page: int


# pp.107-108 — the named grain yogas, including the three Ch. XXI pointed at.
HARVEST_YOGAS: tuple[HarvestYoga, ...] = (
    HarvestYoga(
        "DHANYA_PARVATHA_MAGHA",
        "Asterism Magha in the month of Magha, or Utharapalguni in the month of Palguna, "
        "with Taurus rising",
        ("HARVEST_INGATHERING",), 107,
    ),
    HarvestYoga(
        "DHANYA_PARVATHA_PUSHYA",
        "Asterism Pushya in the month of Pushya, or Sravana in the month of Sravana",
        ("HARVEST_INGATHERING",), 108,
    ),
    HarvestYoga(
        "DHANYA_MERU",
        "Saturn in the rising sign, Jupiter in the 7th, the Moon in the 7th from the Sun — "
        "endows the landlord with a mountain of grain",
        ("HARVEST_INGATHERING",), 108,
    ),
    HarvestYoga(
        "DHANYARNAVA",
        "Jupiter in the rising sign, the Moon in the 4th, the Sun in the 11th, Saturn in the "
        "7th — the grain store swells like the billows of the ocean",
        ("HARVEST_INGATHERING",), 108,
    ),
    HarvestYoga(
        "FIXED_LAGNA_SATURN_JUPITER",
        "A fixed sign rising aspected by Saturn with Jupiter in the 7th house",
        ("HARVEST_INGATHERING",), 107,
    ),
    HarvestYoga(
        "AFTERNOON_SATURN_OR_GULIKA",
        "After mid-day, when the rising sign is occupied by Saturn or by Gulika",
        ("HARVEST_INGATHERING",), 108,
    ),
    HarvestYoga(
        "JUPITER_LAGNA_MOON_12_SUN_6",
        "Jupiter in the rising sign, the Moon in the 12th and the Sun in the 6th house",
        ("HARVEST_INGATHERING",), 108,
    ),
)  # count = 7


# ═════════════════════════════════════════════════════════════════════════════
# GRAIN_EXPENDITURE — spending down the store, pp.108-109
# ═════════════════════════════════════════════════════════════════════════════

# p.108: "The best asterisms for expenditure of corn are:- Aswini, Mrigasirsha,
# Punarvasu, Pushya, Purvapalguni, Utharapalguni, Utharashada, Sravana,
# Sravishta, Purvabadhrapadha, Utharabadhrapadha and Revathi."
GRAIN_EXPENDITURE_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "POOSAM", "POORAM", "UTHIRAM",
    "UTHIRADAM", "THIRUVONAM", "AVITTAM", "POORATTATHI", "UTHIRATTATHI", "REVATHI",
)  # count = 12

# p.108: "The asterisms to be avoided are:- Bharani, Krithika, Rohini, Ardhra,
# Chithra, Swathi, Jyeshta, Mula, and Sathabis. Under no circumstances can grain
# be interfered with on these days."
#
# "Under no circumstances" is the most categorical verb in this chapter and one
# of the strongest in the book — graded a VETO, alongside Annaprasana's
# forbidden stars as the only star-level vetoes in the sourced doctrine.
GRAIN_EXPENDITURE_NAKSHATRA_PROHIBITED: frozenset[int] = _nak(
    "BHARANI", "KARTHIGAI", "ROHINI", "THIRUVATHIRAI", "CHITHIRAI", "SWATHI",
    "KETTAI", "MOOLAM", "SADAYAM",
)  # count = 9

# p.108: "The influence of the remaining asterisms (Aslesha and Magha) is
# middling."
#
# **THE PARENTHETICAL DOES NOT ADD UP AND IS NOT PATCHED.** 12 best + 9 avoided
# = 21 named, leaving six unlisted: Aslesha, Magha, Hastha, Visakha, Anuradha
# and Purvashada. The sentence names only the first two. Either the scan dropped
# four names or the translator's parenthetical is incomplete — this module
# cannot tell which, so the middling tier holds ONLY the two the page prints and
# the list is not marked exhaustive. The other four fall through to the ordinary
# unlisted penalty, which is the least destructive reading of an incomplete
# sentence.
GRAIN_EXPENDITURE_NAKSHATRA_MIDDLING: frozenset[int] = _nak("AYILYAM", "MAGAM")
GRAIN_EXPENDITURE_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False
GRAIN_EXPENDITURE_UNACCOUNTED_STARS: frozenset[int] = _nak(
    "HASTHAM", "VISAKAM", "ANUSHAM", "POORADAM",
)  # count = 4 — named by neither tier; see above.

# p.109: "No grain should be expended on Chathurthi, Ashta-mi, Navami,
# Chathurdhasi and the New-Moon. The remaining Thithis do good."
GRAIN_EXPENDITURE_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 8, 9, 14})
GRAIN_EXPENDITURE_TITHI_AVOID_AMAVASYA: bool = True
GRAIN_EXPENDITURE_TITHI_AVOID_PURNIMA: bool = False
GRAIN_EXPENDITURE_TITHI_REMAINDER_IS_AUSPICIOUS: bool = True
# p.109: "Some astrologers commend Rikthai as good for expending corn."
# Rikta is 4/9/14 — two of which this same page has just banned. An attributed
# dissent that directly contradicts the chapter's own sentence. Recorded and not
# applied; the ban stands.
GRAIN_EXPENDITURE_RIKTA_DISPUTED: bool = True

GRAIN_EXPENDITURE_KARANA_AVOID: frozenset[str] = _STHIRA_AND_VISHTI   # p.109

# p.109: "as also Sunday, Tuesday and Friday, and the Amsas of the Sun, Mars and
# Venus. The other days are good. Some writers consider Friday felicitous and
# commend also the Amsas of Venus as such."
#
# FRIDAY IS AVOIDED HERE — the only place in this repo's sourced doctrine where
# it is — and the very next sentence disputes that. The chapter's own reading is
# scored and the dissent is recorded. p.109 separately calls Saturday
# favourable, so the remaining good days are Monday, Wednesday, Thursday and
# Saturday.
GRAIN_EXPENDITURE_VARA_AVOID: frozenset[str] = frozenset({"SUNDAY", "TUESDAY", "FRIDAY"})
GRAIN_EXPENDITURE_VARA_GOOD: frozenset[str] = frozenset(
    {"MONDAY", "WEDNESDAY", "THURSDAY", "SATURDAY"}
)
GRAIN_EXPENDITURE_FRIDAY_IS_DISPUTED: bool = True

# p.109: "Fixed signs have a beneficent influence ; Common signs have middling
# influence ; Movable signs should be left. out of consideration."
#
# THIS is the sentence `kalaprakasika_treasure_rules` refused to import into
# Ch. XXI's laying-up rule. It belongs here, and here it is applied.
GRAIN_EXPENDITURE_LAGNA_BEST: frozenset[int] = _FIXED_SIGNS
GRAIN_EXPENDITURE_LAGNA_MIDDLING: frozenset[int] = _COMMON_SIGNS
GRAIN_EXPENDITURE_LAGNA_AVOID: frozenset[int] = _MOVABLE_SIGNS

GRAIN_EXPENDITURE_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True             # p.109


# =============================================================================
# RULE_SOURCES
# =============================================================================

def _authority(page: int, passage: str, term: str | None = None) -> Authority:
    return Authority(
        tradition=_TRADITION,
        chapter=_CHAPTER,
        page=page,
        verse_or_passage=passage,
        translation_edition=_EDITION,
        original_language_term=term,
    )


def _textual(
    rule_id: str,
    factor: str,
    activity: str,
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
        authority=_authority(page, passage, term),
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
    # ── reaping ─────────────────────────────────────────────────────────────
    "KP_CH20_HARVEST_NAKSHATRA_001": _textual(
        "KP_CH20_HARVEST_NAKSHATRA_001", "NAKSHATRA", "HARVEST", 105,
        "To start reaping the crop, the most favourable asterisms are;- Bharani, Rohini, "
        "Mrigasirsha, Ardhra, Pushya, Magha, Utharapalguni, Hastha, Visakha, Anuradha, "
        "Utharashada, Sravana, Utharabadhrapadha and Revathi.",
        "14 stars for starting to reap. Not exhaustive — no closing clause.",
        notes=(
            "Bharani opens this list and is on the Annaprasana forbidden set (Ch. III p.34). "
            "Nothing is wrong with that: a star adverse for feeding a child is not thereby "
            "adverse for cutting corn, which is why activity tables never generalise."
        ),
    ),
    "KP_CH20_HARVEST_TITHI_001": _textual(
        "KP_CH20_HARVEST_TITHI_001", "TITHI", "HARVEST", 105,
        "Of Thithis, avoid Chathurthi, Ashtami, Navami, Ekadhasi, Dhwadhasi, Chathurdhasi and "
        "New-Moon. Sthira Karanas (Sakunam, Chathushpadham, Nagam and Kimsthughnam) and Vishti "
        "Karanas should be positively avoided. The remaining Thithis and Karanas are good.",
        "Avoid in-paksha 4/8/9/11/12/14 and Amavasya; everything else stated good. Ekadhasi is "
        "banned here and is FAVOURABLE for ear-boring (Ch. IV p.36) and tonsure (Ch. V p.39).",
    ),
    "KP_CH20_HARVEST_KARANA_001": _textual(
        "KP_CH20_HARVEST_KARANA_001", "KARANA", "HARVEST", 105,
        "Sthira Karanas (Sakunam, Chathushpadham, Nagam and Kimsthughnam) and Vishti Karanas "
        "should be positively avoided.",
        "The Sthira four and Vishti prohibited, with the class enumerated in place.",
        notes=(
            "One of only two passages in the book that BOTH names the Sthira class and lists "
            "its members — Ch. XXI p.110 is the other, and they agree exactly."
        ),
    ),
    "KP_CH20_HARVEST_VARA_001": _textual(
        "KP_CH20_HARVEST_VARA_001", "VARA", "HARVEST", 105,
        "Signs belonging to benefics and the days governed by them are felicitous.",
        "The weekday half is unambiguous — this book names the Moon, Mercury, Jupiter and Venus "
        "as the benefics in a dozen chapters, and their days are Monday, Wednesday, Thursday "
        "and Friday. No adverse day is named, so the other three score neutral.",
        outcome=VerificationOutcome.PARTIAL,
        confidence=SourceConfidence.INTERPRETED,
        notes=(
            "The SIGN half of the same sentence is deliberately NOT scored. Turning 'signs "
            "belonging to benefics' into a list requires supplying the ownerships the sentence "
            "does not print; the derived set is held in HARVEST_BENEFIC_OWNED_SIGNS and left "
            "unwired, because every other lagna rule in this repo is a list the text printed."
        ),
    ),
    "KP_CH20_HARVEST_JANMA_TARA_001": _textual(
        "KP_CH20_HARVEST_JANMA_TARA_001", "JANMA_TARA_COUNT", "HARVEST", 106,
        "Avoid Jenma-Nakshathra and the 10th and the 19th asterisms therefrom. To start work "
        "under these asterisms will result in loss.",
        "The janma / Anu-Jenma / Thri-Jenma triad, with a stated consequence. Personal-layer.",
    ),
    # ── in-gathering ────────────────────────────────────────────────────────
    "KP_CH20_INGATHERING_NAKSHATRA_001": _textual(
        "KP_CH20_INGATHERING_NAKSHATRA_001", "NAKSHATRA", "HARVEST_INGATHERING", 106,
        "The best asterisms are:- Bharani, Rohini, Mrigasirsha, Purvapalguni, Ardhra, "
        "Punarvasu, Pushya, Magha, Utharapalguni, Hastha, Swathi, Anuradha, Mula, Utharashada, "
        "Sravana, Utharabadhrapadha and Revathi.",
        "17 stars for bringing the crop in — a wider list than reaping's 14, and the widest "
        "star list in this chapter.",
    ),
    "KP_CH20_INGATHERING_TITHI_001": _textual(
        "KP_CH20_INGATHERING_TITHI_001", "TITHI", "HARVEST_INGATHERING", 106,
        "All Thithis, except Chathurthi, Shashti, Ashtami, Navami, Dhwadhasi, Chathurdhasi and "
        "New-Moon, are good.",
        "An exclusion rule: six in-paksha tithis and Amavasya excluded, everything else "
        "positively good. Purnima is NOT banned.",
    ),
    "KP_CH20_INGATHERING_VARA_001": _textual(
        "KP_CH20_INGATHERING_VARA_001", "VARA", "HARVEST_INGATHERING", 106,
        "Monday, Thursday, Friday and Saturday are the best as also the Amsas and signs of the "
        "lords thereof, viz., the Moon, Jupiter, Venus and Saturn. Wednesday: and the Amsa of "
        "Mercury are neutrals. Avoid Tuesday and Sunday and the Amsas ef Mars and the Sun.",
        "SATURDAY IS AMONG THE FOUR BEST and Wednesday is demoted to neutral — an inversion of "
        "the Mon/Wed/Thu/Fri pattern every samskara chapter in this repo states. All three "
        "tiers are named explicitly, so this is the chapter's considered position and not an "
        "omission.",
        notes=(
            "Preserved rather than harmonised. Saturn is named as one of the four good day "
            "lords here, which is what makes the reading unmistakable — the sentence does not "
            "merely list Saturday, it justifies it."
        ),
    ),
    "KP_CH20_INGATHERING_LAGNA_001": _textual(
        "KP_CH20_INGATHERING_LAGNA_001", "MUHURTA_LAGNA_SIGN", "HARVEST_INGATHERING", 106,
        "Fixed signs bestow much good; Common signs cause profit as well as loss. Nc collection "
        "of grain should be commenced when the rising sign is a Movable one",
        "A complete partition. 'Profit as well as loss' is a genuinely two-sided middling, and "
        "the movable prohibition is stated as an instruction rather than a preference.",
    ),
    "KP_CH20_INGATHERING_KARANA_001": _textual(
        "KP_CH20_INGATHERING_KARANA_001", "KARANA", "HARVEST_INGATHERING", 106,
        "Sthira Karanas — Sakunam, Chathushpadham, Nagam and Kimsthughnam — and Vishti Karanas "
        "should he strictly avoided. Nitya Yogas produce good.",
        "The Sthira four and Vishti prohibited, enumerated in place a second time in this "
        "chapter.",
    ),
    "KP_CH20_INGATHERING_YOGA_001": _textual(
        "KP_CH20_INGATHERING_YOGA_001", "YOGA", "HARVEST_INGATHERING", 107,
        "Dhanya Parvatha Yoga - The day ruled by asterism Magha, in the month of Magha, or that "
        "ruled by Utharapalguni in the month of Palguna, at a time when the rising sign is "
        "Taurus. Dhanya-Meru - Saturn occupying the rising sign, Jupiter in the 7th, the Moon "
        "in the 7th house from the Sun. Dhanyarnava Yoga - the rising sign occupied by Jupiter, "
        "the 4th house by the Moon, the 11th by the Sun and the 7th by Saturn.",
        "The three named grain yogas Ch. XXI's provenance record pointed at without having "
        "read, plus four further configurations on pp.107-108.",
        notes="NOT IMPLEMENTED — every one needs a muhurta-moment chart, and two additionally "
              "need the lunar month.",
        term="Dhanya-Parvatha, Dhanya-Meru, Dhanyarnava",
    ),
    "KP_CH20_OORDHWA_MUKHA_001": _textual(
        "KP_CH20_OORDHWA_MUKHA_001", "NAKSHATRA_CLASS", "MUHURTA_GENERAL", 107,
        "Oordhwa-Mukha Asterisms are :- Rohini, Ardhra, Pushya, Utharapalguni, Utharashada, "
        "Sravana, Sravishta, Sathabis and Utharabadhrapadha.",
        "The nine upward-facing asterisms. A REFERENCE TABLE, not a rule of this chapter — its "
        "importance is that Ch. XIV p.79 rules on this class for marriage ('Oordhva-Mukha "
        "asterisms are the most fruitful, Atho-Mukha asterisms cause harm and Thiryag Mukha "
        "asterisms breed fever') and never defines it. This footnote is the definition that "
        "passage depends on.",
        scope="MUHURTA_GENERAL",
        notes=(
            "DELIBERATELY NOT WIRED TO MARRIAGE. Marriage scoring is unchanged in this pass, "
            "and the other two classes Ch. XIV names — Atho-Mukha and Thiryag-Mukha — are not "
            "defined anywhere in the pages transcribed, so wiring one third of a three-way "
            "classification would score some marriage days on a rule the others cannot be "
            "judged by. Recorded so a future pass has the table without a second trip."
        ),
        term="Oordhwa-Mukha",
    ),
    # ── expenditure of corn ─────────────────────────────────────────────────
    "KP_CH20_GRAIN_EXPENDITURE_NAKSHATRA_001": _textual(
        "KP_CH20_GRAIN_EXPENDITURE_NAKSHATRA_001", "NAKSHATRA", "GRAIN_EXPENDITURE", 108,
        "The best asterisms for expenditure of corn are:- Aswini, Mrigasirsha, Punarvasu, "
        "Pushya, Purvapalguni, Utharapalguni, Utharashada, Sravana, Sravishta, "
        "Purvabadhrapadha, Utharabadhrapadha and Revathi. If grain be expended on days ruled by "
        "these asterisms the store will flourish increasigly.",
        "12 stars, with a stated positive consequence.",
    ),
    "KP_CH20_GRAIN_EXPENDITURE_NAKSHATRA_002": _textual(
        "KP_CH20_GRAIN_EXPENDITURE_NAKSHATRA_002", "NAKSHATRA", "GRAIN_EXPENDITURE", 108,
        "The asterisms to be avoided are:- Bharani, Krithika, Rohini, Ardhra, Chithra, Swathi, "
        "Jyeshta, Mula, and Sathabis. Under no circumstances can grain be interfered with on "
        "these days. The influence of the remaining asterisms (Aslesha and Magha) is middling.",
        "Nine prohibited stars. 'Under no circumstances' is categorical and is graded a VETO — "
        "one of only two star-level vetoes in the sourced doctrine, beside Annaprasana's "
        "forbidden eight.",
        outcome=VerificationOutcome.PARTIAL,
        notes=(
            "THE ARITHMETIC OF THE FINAL SENTENCE DOES NOT CLOSE, and is not patched. 12 best "
            "plus 9 avoided is 21 named, leaving SIX unlisted: Aslesha, Magha, Hastha, Visakha, "
            "Anuradha and Purvashada. The parenthetical names only the first two. Either the "
            "scan dropped four names or the translator's list is incomplete, and this module "
            "cannot tell which — so the middling tier holds only the two the page prints, the "
            "list is not marked exhaustive, and the other four take the ordinary unlisted "
            "penalty. Held in GRAIN_EXPENDITURE_UNACCOUNTED_STARS pending a clean page image."
        ),
    ),
    "KP_CH20_GRAIN_EXPENDITURE_TITHI_001": _textual(
        "KP_CH20_GRAIN_EXPENDITURE_TITHI_001", "TITHI", "GRAIN_EXPENDITURE", 109,
        "No grain should be expended on Chathurthi, Ashtami, Navami, Chathurdhasi and the "
        "New-Moon. The remaining Thithis do good. Some astrologers commend Rikthai as good for "
        "expending corn.",
        "Avoid 4/8/9/14 and Amavasya; everything else good.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "SELF-CONTRADICTING PAGE. Rikthai is in-paksha 4, 9 and 14 — two of which this same "
            "sentence has just banned — and the dissent commending it follows immediately. The "
            "chapter's own ban is applied and the attributed dissent is recorded, the same way "
            "the marriage tithi conflict is handled."
        ),
    ),
    "KP_CH20_GRAIN_EXPENDITURE_VARA_001": _textual(
        "KP_CH20_GRAIN_EXPENDITURE_VARA_001", "VARA", "GRAIN_EXPENDITURE", 109,
        "Any Saturday ruled by a beneficent asterism and a Thithi ... is very auspicious for "
        "expenditure of corn. ... Sthira Karanas and Vishti Karanas should be avoided, as also "
        "Sunday, Tuesday and Friday, and the Amsas of the Sun, Mars and Venus. The other days "
        "are good. Some writers consider Friday felicitous and commend also the Amsas of Venus "
        "as such.",
        "FRIDAY IS AVOIDED — the only place in this repo's sourced doctrine where it is — and "
        "Saturday is expressly auspicious. The good set is therefore Monday, Wednesday, "
        "Thursday and Saturday, which matches no other chapter here.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "The page disputes itself on Friday one sentence later. The chapter's own reading "
            "is scored and the dissent recorded in GRAIN_EXPENDITURE_FRIDAY_IS_DISPUTED. "
            "Saturday being good is stated independently at the top of p.109, so it does not "
            "rest on the 'other days are good' residue alone."
        ),
    ),
    "KP_CH20_GRAIN_EXPENDITURE_LAGNA_001": _textual(
        "KP_CH20_GRAIN_EXPENDITURE_LAGNA_001", "MUHURTA_LAGNA_SIGN", "GRAIN_EXPENDITURE", 109,
        "Fixed signs have a beneficent influence ; Common signs have middling influence ; "
        "Movable signs should be left. out of consideration.",
        "Fixed best, common middling, movable rejected.",
        notes=(
            "THIS is the sentence `kalaprakasika_treasure_rules` refused to import into Ch. XXI "
            "p.110's laying-up rule, on the grounds that it belongs to a different activity. It "
            "does belong here, and here it is applied — which retrospectively confirms the "
            "restraint: Ch. XXI's own sentence names only fixed and common, and stays silent on "
            "movable."
        ),
    ),
    "KP_CH20_GRAIN_EXPENDITURE_KARANA_001": _textual(
        "KP_CH20_GRAIN_EXPENDITURE_KARANA_001", "KARANA", "GRAIN_EXPENDITURE", 109,
        "Sthira Karanas (Sakunam,Chathushpadham, Nagam, Kimsthughnam) and Vishti Karanas should "
        "be avoided.",
        "The Sthira four and Vishti prohibited — the third statement of this pairing in one "
        "chapter.",
    ),
}
