"""Kalaprakasika Ch. XXI "To Lay Up Treasure" — gold, gems, grain, land, cattle.

Sourced from N. P. Subramania Iyer's Kalaprakasika translation (Asian
Educational Services 1982 reprint of the 1917 first edition), printed pages
**109-113**, extracted 2026-08-15 from the page-by-page transcription of the
150-page scan supplied by the repository owner. The extraction worksheet — with
the verbatim passage, the scope decisions, and the list of rules deliberately
left unimplemented — is `docs/sources/kalaprakasika_ch21_treasure_rules.md`.

Page numbers below are **printed book pages**, matching the convention already
used by `app/data/marriage_muhurta_rules.py`. PDF page = printed page + 32.

This module follows `marriage_muhurta_rules.py` exactly: data only, every
constant paired with a `RuleSource` in `RULE_SOURCES` carrying the page and the
passage, and nothing added without a citation. Where the chapter said nothing,
the set stays empty and the record says so — never a plausible-looking guess.

**Three things this chapter forced apart, which a tidier module would merge:**

* **Direction matters.** p.109-111 govern *acquiring and storing*; p.112's gold
  rule governs *parting with* gold and names two stars (U.Phalguni,
  Shatabhisha) that the p.109 list calls best. Both are true; they are
  different transactions. `GOLD_LOAN_*` is therefore its own scope, not a
  qualifier on the acquiring rules.
* **Taking possession of land is not buying land.** p.111-112 give possession a
  Cancer lagna, a pada rule and a 14-star list; p.112's "To Buy Land and
  Cattle" gives buying a weekday rule and nothing else. The star list is *not*
  promoted to the purchase scope.
* **Cattle buying is not cattle selling.** p.112 says six stars are good "only
  for buying cattle; not for selling which will end in loss."

Grain is deliberately thin: Ch. XXI names it in exactly one sentence (p.110).
The substantive grain doctrine is Ch. XX, which this pass did not read.
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
_CHAPTER = "XXI"
_EDITION = "Subramania Iyer"
_VERIFIED_ON = "2026-08-15"
_VERIFIED_BY = "primary-text transcription pp.109-113 (user-supplied scan)"


def _nak(*names: str) -> frozenset[int]:
    """Canonical 1..27 nakshatra numbers for this repo's Tamil-transliterated
    keys (`app.constants.astrology.NAKSHATRA_NAMES`) — never a second name list.

    The chapter prints Sanskrit transliterations; the mapping used throughout
    this module is Krithika=KARTHIGAI, Mrigasirsha=MIRUGASEERIDAM,
    Ardhra=THIRUVATHIRAI, Punarvasu=PUNARPOOSAM, Pushya=POOSAM, Aslesha=AYILYAM,
    Magha=MAGAM, Purvapalguni=POORAM, Utharapalguni=UTHIRAM, Hastha=HASTHAM,
    Chithra=CHITHIRAI, Visakha=VISAKAM, Anuradha=ANUSHAM, Jyeshta=KETTAI,
    Mula=MOOLAM, Purvashada=POORADAM, Utharashada=UTHIRADAM, Sravana=THIRUVONAM,
    Sravishta/Dhanishta=AVITTAM, Sathabis=SADAYAM, Purvabadhrapadha=POORATTATHI,
    Utharabadhrapadha=UTHIRATTATHI.
    """
    return frozenset(NAKSHATRA_NAMES.index(name) + 1 for name in names)


# ── 1. Chapter-level tithi rule (p.109, CONFIRMED_EXACT) ────────────────────
# "To lay up treasure, all Thithis except Rikthai, Full-Moon and New-Moon are
# auspicious."
#
# The inverse shape of the marriage tithi tiers: this states an *exclusion* set
# and declares everything else auspicious, so the excluded set is exhaustive and
# the remainder is positively good rather than merely unlisted.
# Numbers are in-paksha day numbers (1..15), the convention
# `RIKTA_TITHIS_IN_PAKSHA` already uses in `app.calculations.panchangam`.
TREASURE_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 9, 14})  # Rikta
TREASURE_TITHI_AVOID_PURNIMA: bool = True
TREASURE_TITHI_AVOID_AMAVASYA: bool = True
# Everything not excluded above is stated auspicious — this is what makes the
# rule usable as a positive preference and not just a veto list.
TREASURE_TITHI_REMAINDER_IS_AUSPICIOUS: bool = True

# ── 2. Chapter-level nakshatra list (p.109, CONFIRMED_EXACT) ────────────────
# "The following asterisms are the best:- Mrigasirsha, Ardhra, Pushya,
# Utharapalguni, Hastha, Anuradha, Utharashada, Sravana, Sravishta, Sathabis and
# Utharabadhrapadha."
#
# Preferential, NOT exhaustive: unlike Ch. VIII/XI ("the remaining asterisms
# should be avoided") this passage carries no closing clause, so the other 16
# stars are unlisted, not forbidden.
TREASURE_NAKSHATRA_BEST: frozenset[int] = _nak(
    "MIRUGASEERIDAM", "THIRUVATHIRAI", "POOSAM", "UTHIRAM", "HASTHAM",
    "ANUSHAM", "UTHIRADAM", "THIRUVONAM", "AVITTAM", "SADAYAM", "UTHIRATTATHI",
)  # count = 11; pinned by tests/test_kalaprakasika_treasure_doctrine.py
TREASURE_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False

# ── 3. Chapter-level weekday rule (p.110, CONFIRMED_EXACT) ──────────────────
# "Nitya Yoga, Monday, Wednesday, Thursday and Friday, and the Amsas and signs
# of the Moon, Mercury, Jupiter and Venus are favourable."
#
# Note what is NOT here: no adverse weekday is named. Sunday/Tuesday/Saturday
# are unstated for laying up treasure, and unstated is not forbidden — contrast
# Namakarana (Ch. III p.30), whose "Other days should be avoided" closes the set.
TREASURE_VARA_GOOD: frozenset[str] = frozenset({"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"})
TREASURE_VARA_AVOID: frozenset[str] = frozenset()  # none stated — deliberately empty
TREASURE_FAVOURED_AMSA_LORDS: frozenset[str] = frozenset({"MOON", "MERCURY", "JUPITER", "VENUS"})

# ── 4. Chapter-level lagna rule (p.110, CONFIRMED_EXACT) ────────────────────
# "Fixed signs have beneficial influence; Common signs have middling influence."
# Numbering 1=Aries..12=Pisces, matching `app.constants.astrology.SIGN_LORD`.
#
# Movable signs (Aries/Cancer/Libra/Capricorn) are NOT mentioned in this
# sentence. Ch. XX's parallel corn passage (p.109) does say "Movable signs
# should be left out of consideration" — that is a different activity and is
# deliberately not imported here. Movable stays unstated, which scores neutral.
TREASURE_LAGNA_BEST: frozenset[int] = frozenset({2, 5, 8, 11})    # Taurus, Leo, Scorpio, Aquarius
TREASURE_LAGNA_MIDDLING: frozenset[int] = frozenset({3, 6, 9, 12})  # Gemini, Virgo, Sagittarius, Pisces
TREASURE_LAGNA_AVOID: frozenset[int] = frozenset()               # none stated for this activity

# ── 5. Chapter-level karana + house rules (p.110, CONFIRMED_EXACT) ─────────
# Fully sourced, deliberately NOT scored: the engine reads a daily panchangam
# snapshot with a sunrise lagna and has neither a karana nor a muhurta-moment
# house-occupancy input. Recorded so an L6 moment-chart layer can wire them
# without a second trip to the page.
TREASURE_KARANA_AVOID: frozenset[str] = frozenset(
    # PanchangamSnapshot emits SHAKUNI (the Sakuna/Sakuni transliteration).
    {"SHAKUNI", "CHATUSHPADA", "NAGA", "KIMSTUGHNA", "VISHTI"}
)
TREASURE_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True
TREASURE_MALEFIC_UPACHAYA_HOUSES: frozenset[int] = frozenset({3, 6, 11})
TREASURE_BENEFIC_KENDRA_TRIKONA_HOUSES: frozenset[int] = frozenset({1, 4, 5, 7, 9, 10})


@dataclass(frozen=True, slots=True)
class TreasureYoga:
    """One named auspicious configuration. `definition` is the informal
    planet:house/varga wording for a later engine, kept close to the page rather
    than pre-normalised into a scheme the text does not use."""

    name: str
    definition: str
    applies_to: tuple[str, ...]
    page: int


# ── 6. Named yogas (pp.110-112, CONFIRMED_EXACT) ────────────────────────────
# None is stated to cancel a prohibition, so none feeds `overrides` on any other
# rule — additive bonuses only, exactly as with the marriage yogas. All are
# recorded and none is scored: every one needs muhurta-moment graha or varga
# placement, which this engine does not compute.
TREASURE_YOGAS: tuple[TreasureYoga, ...] = (
    TreasureYoga(
        "GOLD_VARGOTTAMA_GURU",
        "Jupiter in Vargottama, Mercury and Venus in quadrants",
        ("GOLD",), 110,
    ),
    TreasureYoga(
        "GOLD_EXALTED_MOON_NAVAMSA",
        "Moon in her degree of main exaltation in the rising navamsa, Jupiter in the 7th",
        ("GOLD",), 110,
    ),
    TreasureYoga(
        "SATURN_IN_LAGNA_GATHERING",
        "Saturn occupying the rising sign (Jupiter there separately gives prosperity)",
        ("GOLD", "GRAIN", "GEMS"), 110,
    ),
    TreasureYoga(
        "STORE_FIRM_AGAINST_FAILURE",
        "Jupiter in lagna, Venus in the 2nd, Mercury in the 11th, Moon in the 10th",
        ("TREASURE_STORE",), 110,
    ),
    TreasureYoga(
        "SERVANTS_AND_DEPOSITS",
        "Thursday, Jupiter in the rising sign, Sun in the 11th, Saturn in the 6th",
        ("TREASURE_STORE",), 110,
    ),
    TreasureYoga(
        "BASE_METALS_STORAGE",
        "Venus in the rising sign, Moon and Jupiter in the 10th (lead, bronze, iron)",
        ("GOLD",), 111,
    ),
    TreasureYoga(
        "FRAGRANT_SUBSTANCES",
        "Jupiter in the rising sign, Moon in the 12th (camphor, sandal, garlands)",
        ("TREASURE_STORE",), 111,
    ),
    TreasureYoga(
        "LIBRARY_AND_RECORDS",
        "Mercury in his main exaltation, or in the rising sign in exaltation, on a Thursday",
        ("TREASURE_STORE",), 111,
    ),
    TreasureYoga(
        # The rising sign is NOT stated in the rule; "Aquarius" is the
        # translator's own footnoted inference ("Evidently, the rising sign
        # required by this rule is Aquarius") and is preserved as his, not ours.
        "SILVER_WARES",
        "Venus in the rising sign on a Saturday, Moon in Rohini, Jupiter aspecting Aquarius "
        "(translator's footnote infers the rising sign is Aquarius — not stated in the rule)",
        ("GOLD",), 111,
    ),
    TreasureYoga(
        "SILVER_HUNDREDFOLD",
        "Venus in the rising sign in exaltation, Jupiter in the 7th, Sun in the 5th",
        ("GOLD",), 111,
    ),
    TreasureYoga(
        "LAND_SUN_KETU_TOGETHER",
        "Sun and Ketu together in the rising sign AND in its navamsa — the land so obtained "
        "remains permanently yours",
        ("LAND_POSSESSION",), 112,
    ),
    TreasureYoga(
        "SHEEP_THOUSANDFOLD",
        "Thursday ruled by Pushya with Aries rising",
        ("CATTLE_PURCHASE",), 112,
    ),
)  # count = 12; pinned by the test module


# ── 7. Gold (p.111, CONFIRMED_EXACT) ────────────────────────────────────────
# "To treasure gold, silver, copper, brass, iron, pearl, coral, emerald and
# diamond choose favourable asterisms from the list given above in this chapter."
#
# THIS SENTENCE is the licence for gold and gems to use the chapter star list.
# Without it we would be inferring the inheritance; with it the text does the
# pointing. Gold and gems stay separate activities because their *yoga* rules
# differ (gold has four of its own, gems none), not because their stars do.
GOLD_NAKSHATRA_BEST: frozenset[int] = TREASURE_NAKSHATRA_BEST
GEMS_NAKSHATRA_BEST: frozenset[int] = TREASURE_NAKSHATRA_BEST
# Grain gets the same list by CHAPTER scope only — no sentence re-points it the
# way p.111 does for gold and gems. Recorded as PARTIAL, and the reason copy the
# engine prints says "the chapter's treasure list", not "the grain list".
GRAIN_NAKSHATRA_BEST: frozenset[int] = TREASURE_NAKSHATRA_BEST

# ── 8. Gold parting-with (p.112, CONFIRMED_EXACT) ───────────────────────────
# "He who parts with his gold, at a time when the ruling asterism is Krithika,
# Magha, Mula, Sathabis, Utharapalguni, Punarvasu, or Jenma-Nakshathra will be
# reduced to destitution. The one that receives the metal will flourish."
#
# Direction- AND party-sensitive. Two of these stars (Utharapalguni,
# Sathabis) are on the chapter's own "best for laying up treasure" list — not a
# contradiction, because acquiring and giving away are opposite transactions.
# This is exactly why there is no single bidirectional "GOLD" rule set.
GOLD_PARTING_NAKSHATRA_PROHIBITED_FOR_GIVER: frozenset[int] = _nak(
    "KARTHIGAI", "MAGAM", "MOOLAM", "SADAYAM", "UTHIRAM", "PUNARPOOSAM",
)  # count = 6, plus the giver's own janma nakshatra
GOLD_PARTING_JANMA_NAKSHATRA_PROHIBITED_FOR_GIVER: bool = True
GOLD_PARTING_IS_GOOD_FOR_RECEIVER: bool = True

# ── 9. Land — taking possession (pp.111-112, CONFIRMED_EXACT) ───────────────
# "The best asterisms are:- Aswini, Rohini, Mrigasirsha, Punarvasu, Pushya,
# Utharapalguni, Hastha, Swathi, Anuradha, Utharashada, Sravana, Sravishta,
# Sathabis, and Utharabadhrapadha. Avoid Rikthai and Vishti Karana."
#
# SCOPED TO POSSESSION. This paragraph sits under the "TO TAKE POSSESSION OF
# LAND" heading and before the "To Buy Land and Cattle" sub-heading. Nothing in
# the chapter extends it to buying, so it is not extended here.
LAND_POSSESSION_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "POOSAM", "UTHIRAM",
    "HASTHAM", "SWATHI", "ANUSHAM", "UTHIRADAM", "THIRUVONAM", "AVITTAM",
    "SADAYAM", "UTHIRATTATHI",
)  # count = 14; pinned by the test module
LAND_POSSESSION_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False
# Only Rikta is banned here — this paragraph does NOT repeat the chapter
# opening's Purnima/Amavasya ban, so land-possession carries the narrower rule.
LAND_POSSESSION_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 9, 14})
LAND_POSSESSION_KARANA_AVOID: frozenset[str] = frozenset({"VISHTI"})

# A separate, narrowly-scoped rite for land whose *title is contested* (p.111):
# "scoop out and carry away a handful of earth from that land, at a time when
# the rising sign is Cancer, when the fourth quarter of any of the asterisms,
# Bharani, Ardhra, Visakha, or Hastha rules."
# These four stars are NOT the possession list above and must never be merged
# into it. Needs pada + moment lagna, so it is recorded and not scored.
LAND_CONTESTED_RITE_LAGNA: int = 4  # Cancer
LAND_CONTESTED_RITE_NAKSHATRA_PADAS: frozenset[tuple[int, int]] = frozenset(
    (n, 4) for n in _nak("BHARANI", "THIRUVATHIRAI", "VISAKAM", "HASTHAM")
)  # (nakshatra_number, pada) — the 4th quarter only

# ── 10. Land / cattle — buying (p.112, CONFIRMED_WITH_CONDITION) ───────────
# "To Buy Land and Cattle - Monday, Tuesday, Wednesday and Saturday are good.
# The lords of these days are the Moon, Mars, Mercury and Saturn respectively.
# The lord of the day, in question, should occupy the rising sign at the moment
# of the transaction."
#
# The day-lord-in-lagna clause is a CONDITION ON this weekday rule, not a
# separate rule. The engine can check the weekday half and cannot check the
# lagna half, so it credits the weekday and names the unmet condition rather
# than treating a half-met rule as met.
# Note this weekday set is NOT the treasure set: Tuesday and Saturday are good
# here and unstated there; Thursday and Friday the reverse. A real divergence.
LAND_PURCHASE_VARA_GOOD: frozenset[str] = frozenset(
    {"MONDAY", "TUESDAY", "WEDNESDAY", "SATURDAY"}
)
LAND_PURCHASE_VARA_AVOID: frozenset[str] = frozenset()  # none stated
LAND_PURCHASE_REQUIRES_DAY_LORD_IN_LAGNA: bool = True
CATTLE_PURCHASE_VARA_GOOD: frozenset[str] = LAND_PURCHASE_VARA_GOOD
CATTLE_PURCHASE_VARA_AVOID: frozenset[str] = frozenset()
CATTLE_PURCHASE_REQUIRES_DAY_LORD_IN_LAGNA: bool = True

# ── 11. Cattle (pp.112-113, CONFIRMED_EXACT) ────────────────────────────────
# "Krithika, Ardhra, Magha, Aslesha, Swathi and Anuradha are good, only for
# buying cattle; not for selling which will end in loss."
CATTLE_BUY_ONLY_NAKSHATRA: frozenset[int] = _nak(
    "KARTHIGAI", "THIRUVATHIRAI", "MAGAM", "AYILYAM", "SWATHI", "ANUSHAM",
)  # count = 6
CATTLE_SELL_UNDER_BUY_ONLY_STARS_IS_LOSS: bool = True

# "To buy or sell cows, the proper asterisms are:- Aswini, Punarvasu, Pushya,
# Hastha, Swathi, Visakha, Jyeshta, Sravishta and Revathi."
# Explicitly BIDIRECTIONAL, unlike the buy-only list. The two overlap only on
# Swathi; neither is a superset of the other.
COW_BUY_OR_SELL_NAKSHATRA: frozenset[int] = _nak(
    "ASWINI", "PUNARPOOSAM", "POOSAM", "HASTHAM", "SWATHI", "VISAKAM",
    "KETTAI", "AVITTAM", "REVATHI",
)  # count = 9

# The chapter's only activity-lord attribution (p.113 footnote): "Jupiter
# governs the sheep, the cow and all those animals that are useful to man."
# This is what lets CATTLE_PURCHASE carry a *sourced* dasha/hora lord rather
# than one picked to fill a required field.
CATTLE_ACTIVITY_LORD: str = "JUPITER"

# ── 12. General transactions (p.113, CONFIRMED_EXACT) ───────────────────────
# A separate rule set for buying/selling at large. Kept because the chapter
# states it, and kept SEPARATE because its lagna preference (Taurus, Gemini,
# Leo, Libra, Scorpio) is not the fixed-sign preference of the laying-up rule,
# and Gemini and Libra are not fixed signs.
TRANSACTION_NAKSHATRA_GOOD: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "MIRUGASEERIDAM", "THIRUVATHIRAI", "PUNARPOOSAM",
    "POOSAM", "MAGAM", "POORAM", "UTHIRAM", "HASTHAM", "VISAKAM", "KETTAI",
    "MOOLAM", "UTHIRADAM", "SADAYAM", "UTHIRATTATHI", "REVATHI",
)  # count = 17
TRANSACTION_LAGNA_GOOD: frozenset[int] = frozenset({2, 3, 5, 7, 8})  # Ta, Ge, Le, Li, Sc
TRANSACTION_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 6, 8, 9, 12, 14})

# ── 13. Loan on pledge (p.112, CONFIRMED_EXACT) ─────────────────────────────
# "Things given or pledged and money lent for interest, under asterisms
# Sadharana, Vajra and Theekshana do not return."
# Unreadable without the class table below, which is why that table is here.
NAKSHATRA_CLASS_SADHARANA: frozenset[int] = _nak("VISAKAM", "KARTHIGAI")
NAKSHATRA_CLASS_VAJRA: frozenset[int] = _nak(
    "BHARANI", "MAGAM", "POORAM", "POORADAM", "POORATTATHI",
)
NAKSHATRA_CLASS_THEEKSHANA: frozenset[int] = _nak(
    "THIRUVATHIRAI", "AYILYAM", "KETTAI", "MOOLAM",
)
NAKSHATRA_CLASS_LAGHU: frozenset[int] = _nak("ASWINI", "POOSAM", "HASTHAM")
NAKSHATRA_CLASS_MRUDHU: frozenset[int] = _nak(
    "MIRUGASEERIDAM", "CHITHIRAI", "ANUSHAM", "REVATHI",
)
NAKSHATRA_CLASS_STHIRA: frozenset[int] = _nak(
    "ROHINI", "UTHIRAM", "UTHIRADAM", "UTHIRATTATHI",
)
NAKSHATRA_CLASS_CHARA: frozenset[int] = _nak(
    "PUNARPOOSAM", "SWATHI", "THIRUVONAM", "AVITTAM", "SADAYAM",
)
# Verified, not assumed: these seven groups hold 27 entries, all distinct,
# covering stars 1..27 with no overlap and no gap. A test pins that partition,
# so an "OCR correction" to any group fails loudly instead of silently
# rewriting the class of a star.
NAKSHATRA_CLASSES: dict[str, frozenset[int]] = {
    "SADHARANA": NAKSHATRA_CLASS_SADHARANA,
    "VAJRA": NAKSHATRA_CLASS_VAJRA,
    "THEEKSHANA": NAKSHATRA_CLASS_THEEKSHANA,
    "LAGHU": NAKSHATRA_CLASS_LAGHU,
    "MRUDHU": NAKSHATRA_CLASS_MRUDHU,
    "STHIRA": NAKSHATRA_CLASS_STHIRA,
    "CHARA": NAKSHATRA_CLASS_CHARA,
}
PLEDGE_NAKSHATRA_PROHIBITED: frozenset[int] = (
    NAKSHATRA_CLASS_SADHARANA | NAKSHATRA_CLASS_VAJRA | NAKSHATRA_CLASS_THEEKSHANA
)


# =============================================================================
# RULE_SOURCES — one provenance record per worksheet rule_id.
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
    # ── chapter-level (governs gold, gems, grain) ───────────────────────────
    "KP_CH21_TREASURE_TITHI_001": _textual(
        "KP_CH21_TREASURE_TITHI_001", "TITHI", "TREASURE_STORE", 109,
        "To lay up treasure, all Thithis except Rikthai, Full-Moon and New-Moon are auspicious.",
        "An exclusion rule, so the excluded set (Rikta 4/9/14, Purnima, Amavasya) is "
        "exhaustive and every other tithi is positively auspicious — the inverse shape "
        "of the marriage tithi tiers, which name a best-list and leave the rest unranked.",
        notes=(
            "Applied to GOLD, GEMS and GRAIN by chapter scope. Land-possession restates only "
            "the Rikta half (p.112) and is encoded separately."
        ),
    ),
    "KP_CH21_TREASURE_NAKSHATRA_001": _textual(
        "KP_CH21_TREASURE_NAKSHATRA_001", "NAKSHATRA", "TREASURE_STORE", 109,
        "The following asterisms are the best:- Mrigasirsha, Ardhra, Pushya, Utharapalguni, "
        "Hastha, Anuradha, Utharashada, Sravana, Sravishta, Sathabis and Utharabadhrapadha.",
        "11 stars, framed as 'the best'. NOT exhaustive — no closing 'the remaining should be "
        "avoided' clause, so the other 16 are unlisted rather than forbidden. A star off this "
        "list is a mild penalty, never a veto.",
        notes=(
            "p.111 explicitly points gold and gems back at this list; grain inherits it by "
            "chapter scope only (see KP_CH21_GRAIN_NAKSHATRA_001)."
        ),
    ),
    "KP_CH21_TREASURE_VARA_001": _textual(
        "KP_CH21_TREASURE_VARA_001", "VARA", "TREASURE_STORE", 110,
        "Nitya Yoga, Monday, Wednesday, Thursday and Friday, and the Amsas and signs of the "
        "Moon, Mercury, Jupiter and Venus are favourable.",
        "Mon/Wed/Thu/Fri favourable. No adverse weekday is named, so Sun/Tue/Sat are unstated "
        "— they score neutral and must never be penalised on this rule's authority.",
        notes=(
            "Contrast Namakarana (Ch. III p.30), whose 'Other days should be avoided' closes "
            "the same four-day list into an exhaustive one, and land/cattle buying (p.112), "
            "which names a different four days."
        ),
    ),
    "KP_CH21_TREASURE_LAGNA_001": _textual(
        "KP_CH21_TREASURE_LAGNA_001", "MUHURTA_LAGNA_SIGN", "TREASURE_STORE", 110,
        "Fixed signs have beneficial influence; Common signs have middling influence.",
        "Fixed (Taurus/Leo/Scorpio/Aquarius) best; common (Gemini/Virgo/Sagittarius/Pisces) "
        "middling. Movable signs are unstated in this sentence and score neutral.",
        notes=(
            "Ch. XX's corn passage (p.109) does say movable signs are to be left out of "
            "consideration — a different activity, deliberately not imported. This preference "
            "also differs from the general-transaction lagna list on p.113."
        ),
    ),
    "KP_CH21_TREASURE_KARANA_001": _textual(
        "KP_CH21_TREASURE_KARANA_001", "KARANA", "TREASURE_STORE", 110,
        "Sthira Karanas (Sakunam, Chathushpadham, Nagam and Kimsthughnam) and Vishti Karanas "
        "should be avoided.",
        "Veto-class karana exclusion for laying up treasure. This sentence is also the "
        "definition of the Sthira class that Ch. III p.32 and Ch. VI p.42 invoke by name "
        "without enumerating.",
        notes=(
            "Implemented from PanchangamSnapshot karana fields; see the registry for the "
            "daily-transition scope. The same four fixed karanas are enumerated again at Ch. XX "
            "p.105 and Ch. XVIII p.99, the latter fixing each to a tithi half — so the "
            "membership rests on three concurring passages, not one."
        ),
    ),
    "KP_CH21_TREASURE_HOUSE_8_001": _textual(
        "KP_CH21_TREASURE_HOUSE_8_001", "HOUSE_OCCUPANCY_8", "TREASURE_STORE", 110,
        "There should be no planet in the 8th house.",
        "8th-house vacancy required for laying up treasure — the same device the text uses for "
        "Namakarana (Ch. III) and ear-boring (Ch. IV), and explicitly denies for marriage (Ch. "
        "XIV p.83). Per-activity, never global.",
        notes="NOT IMPLEMENTED — no muhurta-moment house-occupancy input.",
    ),
    "KP_CH21_TREASURE_BENEFIC_PLACEMENT_001": _textual(
        "KP_CH21_TREASURE_BENEFIC_PLACEMENT_001", "GRAHA_PLACEMENT", "TREASURE_STORE", 110,
        "Malefics in the 3rd, 6th and 11th houses, benefics in quadrants or trines bestow all "
        "prosperity.",
        "Upachaya malefics plus angular/trinal benefics — a bonus configuration, not a gate.",
        notes="NOT IMPLEMENTED — no muhurta-moment graha placement input.",
    ),
    # ── gold ────────────────────────────────────────────────────────────────
    "KP_CH21_GOLD_NAKSHATRA_001": _textual(
        "KP_CH21_GOLD_NAKSHATRA_001", "NAKSHATRA", "GOLD", 111,
        "To treasure gold, silver, copper, brass, iron, pearl, coral, emerald and diamond "
        "choose favourable asterisms from the list given above in this chapter.",
        "Gold takes the chapter's 11-star list by the text's OWN back-reference, not by our "
        "inference. Without this sentence gold would have no star list at all.",
        notes=(
            "The same sentence covers gems — see KP_CH21_GEMS_NAKSHATRA_001. Gold and gems stay "
            "separate activities because their yoga rules differ, not their stars."
        ),
    ),
    "KP_CH21_GOLD_YOGA_001": _textual(
        "KP_CH21_GOLD_YOGA_001", "YOGA", "GOLD", 110,
        "Jupiter in Virgothama position with Mercury and Venus in quadrants is an extremely "
        "lucky planetary position for collecting and depositing gold. The store will then "
        "increase a millionfold.",
        "Named auspicious yoga for gold. Additive bonus — nothing says it cancels a prohibition.",
        notes="NOT IMPLEMENTED — needs muhurta-moment vargas and house placement.",
        term="Virgothama (Vargottama)",
    ),
    "KP_CH21_GOLD_YOGA_002": _textual(
        "KP_CH21_GOLD_YOGA_002", "YOGA", "GOLD", 110,
        "Equally felicitous is the time when the rising Navamsa is occupied by the Moon in her "
        "main exaltation with Jupiter in the 7th house.",
        "Second gold yoga, stated equal in force to the first.",
        notes="NOT IMPLEMENTED — moment chart. Moon's main exaltation is Taurus 3 degrees (p.49).",
    ),
    "KP_CH21_GOLD_YOGA_003": _textual(
        "KP_CH21_GOLD_YOGA_003", "YOGA", "GOLD", 110,
        "A very fortunate planetary condition under which gold, grain and gems may be gathered "
        "and deposited is when the rising sign is occupied by Saturn. Jupiter located in the "
        "rising sign gives prosperity.",
        "Saturn in lagna favours gathering AND depositing gold, grain and gems jointly.",
        notes=(
            "The only sentence in Ch. XXI that names grain. NOT IMPLEMENTED — moment lagna "
            "occupancy."
        ),
    ),
    "KP_CH21_GOLD_YOGA_004": _textual(
        "KP_CH21_GOLD_YOGA_004", "YOGA", "TREASURE_STORE", 110,
        "Jupiter, in the rising sign, Venus in the 2nd, Mercury in the 11th and the Moon in the "
        "10th house - this is the best planetary position which renders the store firm against "
        "failure.",
        "Named 'best' configuration for the durability of the store.",
        notes="NOT IMPLEMENTED — moment chart.",
    ),
    "KP_CH21_SILVER_YOGA_001": RuleSource(
        rule_id="KP_CH21_SILVER_YOGA_001",
        factor="YOGA",
        activity="GOLD",
        authority=_authority(
            111,
            "For making and storing silver wares, the most felicitous time is that when the "
            "rising sign is occupied by Venus on a Saturday, when the Moon is in asterism "
            "Rohini (in her exaltation in Taurus), Jupiter aspecting Aquarius.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="GOLD",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        interpretation=(
            "Silver-specific yoga. The rising SIGN is not stated in the rule itself — the "
            "translator supplies 'Aquarius' in his own footnote as an inference ('Evidently, "
            "the rising sign required by this rule is Aquarius'). That inference is recorded "
            "as his, and is not promoted to a stated rule."
        ),
        notes="NOT IMPLEMENTED — moment chart, and the lagna is editorially inferred.",
        verified_on=_VERIFIED_ON,
        verified_by=_VERIFIED_BY,
    ),
    "KP_CH21_SILVER_YOGA_002": _textual(
        "KP_CH21_SILVER_YOGA_002", "YOGA", "GOLD", 111,
        "The silver wares will increase in quantity a hundredfold if, at the time of collecting "
        "them, the rising sign be governed by Venus, in exaltation, with Jupiter in the 7th and "
        "the Sun in the 5th house.",
        "Second silver yoga, fully stated (no editorial inference needed).",
        notes="NOT IMPLEMENTED — moment chart.",
    ),
    "KP_CH21_METALS_YOGA_001": _textual(
        "KP_CH21_METALS_YOGA_001", "YOGA", "GOLD", 111,
        "To store lead, bronze and iron, Venus located in the rising sign, with the Moon, "
        "Jupiter in the 10th house, is a prosperous planetary position.",
        "Base-metal storage yoga, filed under the gold/precious-metals activity.",
        notes="NOT IMPLEMENTED — moment chart.",
    ),
    "KP_CH21_GOLD_LOAN_NAKSHATRA_001": _textual(
        "KP_CH21_GOLD_LOAN_NAKSHATRA_001", "NAKSHATRA", "GOLD_PARTING", 112,
        "He who parts with his gold, at a time when the ruling asterism is Krithika, Magha, "
        "Mula, Sathabis, Utharapalguni, Punarvasu, or Jenma-Nakshathra will be reduced to "
        "destitution. The one that receives the metal will flourish.",
        "Direction- and party-sensitive: prohibited for the GIVER, explicitly good for the "
        "RECEIVER. Two of the six stars (Utharapalguni, Sathabis) are on the chapter's own "
        "best-for-storing list — not a contradiction, because acquiring and giving away are "
        "opposite transactions.",
        scope="GOLD_PARTING",
        notes=(
            "NOT IMPLEMENTED — no 'parting with gold' activity exists in the picker, and this "
            "must not be folded into the acquiring-gold activity. Surfaced in the worksheet as "
            "an intra-chapter tension so a future merge is forced to confront it."
        ),
    ),
    # ── gems, grain ─────────────────────────────────────────────────────────
    "KP_CH21_GEMS_NAKSHATRA_001": _textual(
        "KP_CH21_GEMS_NAKSHATRA_001", "NAKSHATRA", "GEMS", 111,
        "To treasure gold, silver, copper, brass, iron, pearl, coral, emerald and diamond "
        "choose favourable asterisms from the list given above in this chapter.",
        "Gems (pearl, coral, emerald, diamond) take the chapter's 11-star list by the same "
        "explicit back-reference as gold.",
        notes="Shares one sentence with gold; kept a separate activity because gold has four "
              "yogas of its own and gems none.",
    ),
    "KP_CH21_GRAIN_NAKSHATRA_001": _textual(
        "KP_CH21_GRAIN_NAKSHATRA_001", "NAKSHATRA", "GRAIN", 109,
        "The following asterisms are the best:- Mrigasirsha, Ardhra, Pushya, Utharapalguni, "
        "Hastha, Anuradha, Utharashada, Sravana, Sravishta, Sathabis and Utharabadhrapadha. "
        "[p.110] ... gold, grain and gems may be gathered and deposited ...",
        "Grain inherits the chapter star list by CHAPTER SCOPE only. Unlike gold and gems, no "
        "sentence points grain back at the list; the inheritance rests on the chapter heading "
        "plus the p.110 co-mention. Weaker provenance, and the engine's reason copy says so.",
        outcome=VerificationOutcome.PARTIAL,
        notes=(
            "The substantive grain doctrine is Ch. XX (Harvest / In-gathering / Expenditure of "
            "Corn, pp.105-109), including the Dhanya-Parvatha, Dhanya-Meru and Dhanyarnava "
            "yogas. Ch. XX was NOT extracted in this pass — until it is, GRAIN is thin and "
            "must not be presented as fully sourced."
        ),
    ),
    # ── land ────────────────────────────────────────────────────────────────
    "KP_CH21_LAND_NAKSHATRA_001": _textual(
        "KP_CH21_LAND_NAKSHATRA_001", "NAKSHATRA", "LAND_POSSESSION", 112,
        "The best asterisms are:- Aswini, Rohini, Mrigasirsha, Punarvasu, Pushya, "
        "Utharapalguni, Hastha, Swathi, Anuradha, Utharashada, Sravana, Sravishta, Sathabis, "
        "and Utharabadhrapadha.",
        "14 stars, scoped to TAKING POSSESSION of land. The paragraph sits under the 'To take "
        "possession of land' heading and before the 'To Buy Land and Cattle' sub-heading; "
        "nothing extends it to buying, so it is not extended.",
        notes=(
            "Differs from the chapter treasure list: adds Aswini, Rohini, Punarvasu, Swathi; "
            "drops Ardhra. Land is not a sub-case of treasure."
        ),
    ),
    "KP_CH21_LAND_TITHI_001": _textual(
        "KP_CH21_LAND_TITHI_001", "TITHI", "LAND_POSSESSION", 112,
        "Avoid Rikthai and Vishti Karana.",
        "Rikta (in-paksha 4/9/14) prohibited. This paragraph does NOT repeat the chapter "
        "opening's Purnima/Amavasya ban, so land-possession carries the narrower rule as its "
        "own stated tithi doctrine.",
    ),
    "KP_CH21_LAND_KARANA_001": _textual(
        "KP_CH21_LAND_KARANA_001", "KARANA", "LAND_POSSESSION", 112,
        "Avoid Rikthai and Vishti Karana.",
        "Vishti karana prohibited for taking possession of land.",
        notes="Implemented from PanchangamSnapshot karana fields; see the registry for the daily-transition scope.",
    ),
    "KP_CH21_LAND_LAGNA_001": _textual(
        "KP_CH21_LAND_LAGNA_001", "MUHURTA_LAGNA_SIGN", "LAND_POSSESSION_CONTESTED", 111,
        "To gain possession of any land your right to which is contested, scoop out and carry "
        "away a handful of earth from that land, at a time when the rising sign is Cancer, when "
        "the fourth quarter of any of the asterisms, Bharani, Ardhra, Visakha, or Hastha rules.",
        "Cancer lagna plus the 4th pada of Bharani/Ardhra/Visakha/Hastha. NARROWLY scoped to a "
        "contested-title earth-taking rite, not to land acquisition generally.",
        scope="LAND_POSSESSION_CONTESTED",
        notes=(
            "These four stars are NOT the 14-star possession list and must not be merged into "
            "it. NOT IMPLEMENTED — needs nakshatra pada at the moment plus a moment lagna."
        ),
    ),
    "KP_CH21_LAND_YOGA_001": _textual(
        "KP_CH21_LAND_YOGA_001", "YOGA", "LAND_POSSESSION", 112,
        "A very auspicious time for taking possession of a land is that when the rising sign "
        "and the Navamsa thereof are occupied by the Sun and Kethu - these two planets must be "
        "together in the rising sign as well as in the Navamsa Chakra, for the time. The land "
        "so obtained will permanently remain yours.",
        "Sun and Ketu conjunct in both the rasi lagna and the navamsa lagna.",
        notes="NOT IMPLEMENTED — moment chart plus navamsa.",
    ),
    "KP_CH21_LAND_VARA_001": _textual(
        "KP_CH21_LAND_VARA_001", "VARA", "LAND_PURCHASE", 112,
        "To Buy Land and Cattle - Monday, Tuesday, Wednesday and Saturday are good. The lords "
        "of these days are the Moon, Mars, Mercury and Saturn respectively. The lord of the "
        "day, in question, should occupy the rising sign at the moment of the transaction.",
        "Mon/Tue/Wed/Sat good, CONDITIONAL on that day's lord occupying the rising sign at the "
        "moment of the transaction. The engine can check the weekday and cannot check the "
        "lagna, so it credits the weekday and names the unmet condition rather than treating a "
        "half-met rule as met.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "This weekday set is NOT the treasure set (p.110): Tuesday and Saturday are good "
            "here and unstated there; Thursday and Friday the reverse. A real per-activity "
            "divergence, preserved rather than harmonised."
        ),
    ),
    # ── cattle ──────────────────────────────────────────────────────────────
    "KP_CH21_CATTLE_VARA_001": _textual(
        "KP_CH21_CATTLE_VARA_001", "VARA", "CATTLE_PURCHASE", 112,
        "To Buy Land and Cattle - Monday, Tuesday, Wednesday and Saturday are good. The lords "
        "of these days are the Moon, Mars, Mercury and Saturn respectively. The lord of the "
        "day, in question, should occupy the rising sign at the moment of the transaction.",
        "Same sentence as KP_CH21_LAND_VARA_001; the text pairs land and cattle for this one "
        "rule. Encoded as its own rule_id under the cattle activity because the two activities "
        "diverge on every other dimension — sharing a sentence is not sharing a rule set.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
    ),
    "KP_CH21_CATTLE_NAKSHATRA_001": _textual(
        "KP_CH21_CATTLE_NAKSHATRA_001", "NAKSHATRA", "CATTLE_PURCHASE", 112,
        "Krithika, Ardhra, Magha, Aslesha, Swathi and Anuradha are good, only for buying "
        "cattle; not for selling which will end in loss.",
        "Six stars good for BUYING cattle only; selling under them ends in loss. The buy/sell "
        "asymmetry is explicit, and is why the encoded activity is CATTLE_PURCHASE rather than "
        "a bidirectional 'cattle'.",
        notes=(
            "Overlaps the p.113 buy-or-sell cow list only on Swathi; neither list is a superset "
            "of the other."
        ),
    ),
    "KP_CH21_CATTLE_NAKSHATRA_002": _textual(
        "KP_CH21_CATTLE_NAKSHATRA_002", "NAKSHATRA", "CATTLE_PURCHASE", 113,
        "To buy or sell cows, the proper asterisms are:- Aswini, Punarvasu, Pushya, Hastha, "
        "Swathi, Visakha, Jyeshta, Sravishta and Revathi. One's property in cows will increase "
        "by the transaction started under these asterisms.",
        "Nine stars, explicitly BIDIRECTIONAL ('buy or sell'), unlike the buy-only list. Both "
        "lists are applied to CATTLE_PURCHASE because both permit buying; the engine names "
        "which list matched so the direction-sensitivity stays visible.",
    ),
    "KP_CH21_CATTLE_LORD_001": _textual(
        "KP_CH21_CATTLE_LORD_001", "ACTIVITY_LORD", "CATTLE_PURCHASE", 113,
        "Jupiter governs the sheep, the cow and all those animals that are useful to man.",
        "The chapter's only activity-lord attribution. This is what lets CATTLE_PURCHASE carry "
        "a sourced dasha/hora lord instead of one chosen to fill a required field.",
        notes=(
            "No comparable attribution exists in Ch. XXI for gold, gems, grain or land — those "
            "activities' lord entries are ENGINE_POLICY and are flagged as such in "
            "muhurta_service."
        ),
    ),
    "KP_CH21_SHEEP_YOGA_001": _textual(
        "KP_CH21_SHEEP_YOGA_001", "YOGA", "CATTLE_PURCHASE", 112,
        "The most prosperous time is that on a Thursday ruled by asterism Pushya when the "
        "rising sign is Aries. Sheep purchased at this time multiply a thousandfold.",
        "A three-way conjunction (Thursday AND Pushya AND Aries rising) for buying sheep.",
        notes="Recorded; sheep is not exposed as its own picker activity.",
    ),
    # ── general transactions, pledge, class table ───────────────────────────
    "KP_CH21_TRANSACTION_NAKSHATRA_001": _textual(
        "KP_CH21_TRANSACTION_NAKSHATRA_001", "NAKSHATRA", "TRANSACTION_GENERAL", 113,
        "The following asterisms cause good results in all transactions, buying, selling etc:- "
        "Aswini, Rohini, Mrigasirsha, Ardhra, Punarvasu, Pushya, Magha, Purvapalguni, "
        "Utharapalguni, Hastha, Visakha, Jyeshta, Mula, Utharashada, Sathabis and "
        "Utharabadhrapadha and Revathi.",
        "17 stars good for buying and selling at large.",
        notes="Recorded; not exposed as a picker activity in this pass.",
    ),
    "KP_CH21_TRANSACTION_LAGNA_001": _textual(
        "KP_CH21_TRANSACTION_LAGNA_001", "MUHURTA_LAGNA_SIGN", "TRANSACTION_GENERAL", 113,
        "The following signs produce the same effect:- Taurus, Gemini, Leo, Libra and Scorpio.",
        "Taurus/Gemini/Leo/Libra/Scorpio good for general transactions.",
        notes=(
            "Differs in shape from the laying-up lagna rule (fixed best, p.110) — Gemini and "
            "Libra are not fixed signs. Two activities, not a contradiction; neither is "
            "promoted over the other."
        ),
    ),
    "KP_CH21_TRANSACTION_TITHI_001": _textual(
        "KP_CH21_TRANSACTION_TITHI_001", "TITHI", "TRANSACTION_GENERAL", 113,
        "Of Thithis, all have the same effect except Chathurthi, Shashti, Ashtami, Navami, "
        "Dhwadhasi and Chathurdhasi.",
        "Avoid in-paksha 4, 6, 8, 9, 12, 14 for general transactions.",
        notes=(
            "The same six-tithi set as the Namakarana exclusion (Ch. III p.30) — but Namakarana "
            "additionally bans Purnima and Amavasya and this does not."
        ),
    ),
    "KP_CH21_PLEDGE_NAKSHATRA_001": _textual(
        "KP_CH21_PLEDGE_NAKSHATRA_001", "NAKSHATRA", "PLEDGE_OR_LOAN", 112,
        "Things given or pledged and money lent for interest, under asterisms Sadharana, Vajra "
        "and Theekshana do not return.",
        "Prohibited for pledging/lending: the union of the Sadharana, Vajra and Theekshana "
        "classes as defined on pp.112-113.",
        scope="PLEDGE_OR_LOAN",
        notes=(
            "NOT IMPLEMENTED — no pledge/lending activity in the picker. Unreadable without "
            "KP_CH21_NAKSHATRA_CLASSES_001."
        ),
    ),
    "KP_CH21_NAKSHATRA_CLASSES_001": _textual(
        "KP_CH21_NAKSHATRA_CLASSES_001", "NAKSHATRA_CLASS", "TREASURE_STORE", 112,
        "The 'Sadharana' asterisms are:- Visakha and Krithika. The 'Vajra' asterisms:- Bharani, "
        "Magha, Purvapalguni, Purvashada and Purvabadhrapadha. The 'Theekshana':- Ardhra, "
        "Aslesha, Jyeshta and Mula. The 'Laghu':- Aswini, Pushya and Hastha. The 'Mrudhu':- "
        "Mrigasirsha, Chithra, Anuradha, and Revathi. The 'Sthira':- Rohini, Utharapalguni, "
        "Utharashada and Utharabadhrapadha. The 'Chara':- Punarvasu, Swathi, Sravana, Sravishta "
        "and Sathabis.",
        "The seven nakshatra nature-classes. Verified to be a clean partition: 27 entries, all "
        "distinct, covering stars 1..27 with no overlap and no gap — which is itself evidence "
        "the transcription of this passage is sound.",
        scope="MUHURTA_GENERAL",
        notes=(
            "A reference table, not a rule. Only three of the seven classes are read by a rule "
            "in this chapter (KP_CH21_PLEDGE_NAKSHATRA_001). Do not 'correct' a group — a test "
            "pins the partition."
        ),
    ),
}
