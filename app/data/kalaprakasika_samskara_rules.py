"""Kalaprakasika Ch. III & IV — Namakarana, Annaprasana, Karnavedha.

Sourced from N. P. Subramania Iyer's Kalaprakasika translation (Asian
Educational Services 1982 reprint of the 1917 first edition), extracted
2026-08-15 from the page-by-page transcription of the 150-page scan supplied by
the repository owner. Extraction worksheet:
`docs/sources/kalaprakasika_samskara_rules.md`.

* **Namakarana** (naming) — Ch. III, printed pp. 30-31
* **Milk feeding** (first feeding on milk) — Ch. III, printed p. 32
* **Annaprasana** (first feeding on rice) — Ch. III, printed pp. 33-35
* **Karnavedha** (ear-boring) — Ch. IV, printed pp. 35-36

Page numbers are **printed book pages**; PDF page = printed page + 32.

**Why these are three activities and not one.** They share a chapter
neighbourhood and a life stage and almost nothing else. Nine of ten rule
dimensions differ:

| | Naming | Annaprasana | Ear-boring |
|---|---|---|---|
| best stars | 14 | 16 | 9 |
| Ardra | included | **forbidden** | included |
| forbidden stars | none stated | **8 named** | none stated |
| tithi shape | exclusion list | exclusion list | **exhaustive inclusion** |
| Dwadashi (12) | prohibited | permitted | **favourable** |
| fixed signs | **best** | mostly good | **three of four avoided** |
| vacant house | 8th | **10th** | 8th |
| combustion | silent | **explicitly waived** | silent |

A single "baby samskara" activity would have to pick one column and discard two.

**One correction this extraction produced.**
`docs/MUHURTA_ENGINE_AUTHORITATIVE_INPUTS_v2_2026-08-14.md` states that
*Annaprasana* avoids Sthira karana and Vishti. The primary text puts that clause
in the **milk-feeding** rite (p.32), not the rice-feeding rite (pp.33-35), which
states no karana rule at all. Same class of error as the marriage 8th-vacancy
finding — a rule real in one rite, imported into its neighbour. It is recorded
here under `MILK_FEEDING` scope and is **not** applied to Annaprasana.

**And the rite that correction pointed at turned out to be a whole activity.**
p.32 states a complete rule set — 17 stars, a tithi ban, the karana ban above, a
weekday list and a sign ban — so `MILK_FEEDING` is now extracted in full and
exposed, where it began life here as two constants recorded only to prove what
did *not* belong to Annaprasana. The two feeding rites remain strictly separate:
Ardhra is forbidden for the rice and merely absent for the milk, and eleven of
the seventeen milk stars are shared, so neither list can be derived from the
other. p.32 also offers the **10th tara from the child's birth star** as a good
fallback day — a count six other chapters prohibit. That reversal is recorded,
not scored, and raised for the astrologer; Ch. X p.62 states the same reversal
independently.

Data only. Nothing here scores a chart; the engine reads it through
`app/data/muhurta_activity_registry.py`.
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
_VERIFIED_BY = "primary-text transcription pp.29-36 (user-supplied scan)"


def _nak(*names: str) -> frozenset[int]:
    """Canonical 1..27 nakshatra numbers for this repo's Tamil-transliterated
    keys — never a second name list. See `kalaprakasika_treasure_rules._nak`
    for the Sanskrit->Tamil key mapping used throughout."""
    return frozenset(NAKSHATRA_NAMES.index(name) + 1 for name in names)


# ═════════════════════════════════════════════════════════════════════════════
# NAMAKARANA (naming the child) — Ch. III, pp.30-31
# ═════════════════════════════════════════════════════════════════════════════

# p.30: "The following asterisms are good:- Aswini, Rohini, Mrigasirsha, Ardhra,
# Punarvasu, Pushya, Utharapalguni, Hastha, Swathi, Anuradha, Sravana,
# Sravishta, Sathabis and Revathi."
#
# Preferential ("are good"), NOT exhaustive — no closing "the remaining should be
# avoided". Note ARDRA IS INCLUDED despite being a Tikshna star: any rule that
# rejected stars by nature-class would wrongly drop it, which is the whole
# reason activity tables outrank nature classes here.
NAMING_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "MIRUGASEERIDAM", "THIRUVATHIRAI", "PUNARPOOSAM",
    "POOSAM", "UTHIRAM", "HASTHAM", "SWATHI", "ANUSHAM", "THIRUVONAM",
    "AVITTAM", "SADAYAM", "REVATHI",
)  # count = 14; pinned by tests/test_kalaprakasika_samskara_doctrine.py
NAMING_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False
NAMING_NAKSHATRA_PROHIBITED: frozenset[int] = frozenset()  # none stated

# p.30: "The Thithis to be avoided are:- The 4th, 6th, 8th, 9th, 12th, and 14th
# of the bright and dark halves of the lunar month, the Full-Moon and the
# New-Moon days."
#
# Paksha-explicit ("of the bright AND dark halves"), so unlike marriage there is
# no paksha ambiguity to preserve. In-paksha day numbers 1..15.
NAMING_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 6, 8, 9, 12, 14})
NAMING_TITHI_AVOID_PURNIMA: bool = True
NAMING_TITHI_AVOID_AMAVASYA: bool = True

# p.30: "Monday, Wednesday, Thursday and Friday are good, ... Other days should
# be avoided."
#
# The closing clause makes this EXHAUSTIVE — unlike the Ch. XXI treasure weekday
# rule, which names the same four good days and no adverse ones.
NAMING_VARA_GOOD: frozenset[str] = frozenset({"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"})
NAMING_VARA_AVOID: frozenset[str] = frozenset({"SUNDAY", "TUESDAY", "SATURDAY"})
NAMING_FAVOURED_AMSA_LORDS: frozenset[str] = frozenset({"MERCURY", "JUPITER", "VENUS", "MOON"})

# p.31: "Fixed signs (Taurus, Leo, Scorpio and Aquarius) are considered the best.
# Common signs (Gemini, Virgo, Sagittari and Pisces) are also approved, when
# occupied by a benefic."
#
# Movable signs are UNSTATED, not prohibited. The benefic-occupancy condition on
# the common signs is not evaluable from a day snapshot, so common signs score
# neutral with the condition named — never credited as met.
NAMING_LAGNA_BEST: frozenset[int] = frozenset({2, 5, 8, 11})       # Taurus, Leo, Scorpio, Aquarius
NAMING_LAGNA_CONDITIONAL: frozenset[int] = frozenset({3, 6, 9, 12})  # common signs, benefic required
NAMING_LAGNA_AVOID: frozenset[int] = frozenset()                   # none stated

# Sourced, deliberately unscored — no engine input exists for the house and
# timing rules below. Karana is evaluated from the daily snapshot.
NAMING_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True                      # p.30
# PanchangamSnapshot emits SHAKUNI (the Sakuna/Sakuni transliteration).
NAMING_KARANA_AVOID: frozenset[str] = frozenset({"SHAKUNI", "VISHTI"})  # p.30
NAMING_FORENOON_ONLY: bool = True                                   # p.31, stated as a requirement
NAMING_PREFERRED_DAYS_FROM_BIRTH: tuple[int, ...] = (10, 12, 16)    # p.30
NAMING_FALLBACK_AFTER_DAY_FROM_BIRTH: int = 16                      # p.30


# ═════════════════════════════════════════════════════════════════════════════
# ANNAPRASANA (first feeding on rice) — Ch. III, pp.33-35
# ═════════════════════════════════════════════════════════════════════════════

# p.34: "The following are the most favourable asterisms - Aswini, Rohini,
# Mrigasirsha, Punarvasu, Pushya, Utharapalguni, Hastha, Chithra, Swathi,
# Anuradha, Utharashada, Sravana, Sravishta, Sathabis, Utharabadhrapada and
# Revathi."
ANNAPRASANA_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "POOSAM", "UTHIRAM",
    "HASTHAM", "CHITHIRAI", "SWATHI", "ANUSHAM", "UTHIRADAM", "THIRUVONAM",
    "AVITTAM", "SADAYAM", "UTHIRATTATHI", "REVATHI",
)  # count = 16; pinned by the test module

# p.34: "The asterisms Ardhra, Krithika, Jyeshta, Barani, Aslesha,
# Purvapalguni, Purvashada, Purvabadrapada will cause misery, thoughtlessness
# and fear and so one should not start any function of feeding on those days."
#
# An EXPLICIT PROHIBITION — "one should NOT start any function of feeding on
# those days" — not a mere absence from the good list. This is the only
# forbidden-star set among the three samskaras, and the strongest-graded
# nakshatra rule in this module. ARDRA IS HERE, and is on the *naming* good
# list: the two rites disagree about Ardra, which is why they never merge.
ANNAPRASANA_NAKSHATRA_PROHIBITED: frozenset[int] = _nak(
    "THIRUVATHIRAI", "KARTHIGAI", "KETTAI", "BHARANI", "AYILYAM", "POORAM",
    "POORADAM", "POORATTATHI",
)  # count = 8; pinned by the test module
ANNAPRASANA_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False  # 3 stars are on neither list

# p.34: "Shashti, Ashtami, Navami, Chathurthi, Chathurdasi - these Thithis
# should be totally avoided for this function."
# The naming list minus Dwadashi (12), and without the Purnima/Amavasya ban.
ANNAPRASANA_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 6, 8, 9, 14})
ANNAPRASANA_TITHI_AVOID_PURNIMA: bool = False   # not stated for this rite
ANNAPRASANA_TITHI_AVOID_AMAVASYA: bool = False  # not stated for this rite

# p.34: "Monday, Wednesday, Thursday and Friday are good... Sunday, Tuesday and
# Saturday and the time when the rising Navamsa is that of the Sun, Mars or
# Saturn are unfavourable."
# Both halves stated explicitly here, where naming reaches the same partition
# via a closing "other days should be avoided".
ANNAPRASANA_VARA_GOOD: frozenset[str] = frozenset({"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"})
ANNAPRASANA_VARA_AVOID: frozenset[str] = frozenset({"SUNDAY", "TUESDAY", "SATURDAY"})

# p.34: "Taurus, Aquarius, Libra, Virgo, Leo, Cancer, Capricorn, Gemini and
# Sagittari are beneficent signs."
# Nine named beneficent; Aries, Scorpio and Pisces are NOT called adverse — they
# are unstated and score neutral, never a penalty.
ANNAPRASANA_LAGNA_BEST: frozenset[int] = frozenset({2, 3, 4, 5, 6, 7, 9, 10, 11})
ANNAPRASANA_LAGNA_AVOID: frozenset[int] = frozenset()  # none stated

# p.34: "The child should not be fed (for the first time) on a day ruled by its
# asterism at birth, for this will shorten its life."
#
# A PERSONAL-LAYER rule: only evaluable when a subject is supplied, and
# deliberately absent from general mode. Graded as a prohibition because the
# text states a consequence ("will shorten its life"), not a preference.
ANNAPRASANA_JANMA_NAKSHATRA_PROHIBITED: bool = True

# p.34: "The 2nd, 4th, 6th, 8th, 10th, 11th, 13th, 15th, 17th and 19th asterisms
# from the asterism, at birth, are favourable."
#
# DELIBERATELY EMPTY. Four of the ten ordinals are OCR noise in the scan
# ("and", "roth", "rth", "roth"). The bracketed reading above is the most
# plausible reconstruction and is NOT confidently legible; encoding it would be
# inventing a tara list, which is precisely what this module exists to prevent.
# Needs re-verification against a clean page image before it is filled in.
ANNAPRASANA_FAVOURABLE_TARA_COUNTS: frozenset[int] = frozenset()

# p.35: "The most important element in the matter of starting to feed a child is
# the month; and so it does not matter if Jupiter and Venus be 'Asthangatha' at
# the time."
#
# The text's own proof that combustion is a PER-ACTIVITY rule: marriage (Ch. XIV
# p.80) enforces it with specific day buffers; this rite waives it outright.
# Recorded so nobody ever adds a global combustion veto over the top of it.
ANNAPRASANA_COMBUSTION_WAIVED: bool = True

# p.34, sourced and unscored — needs a muhurta-moment chart.
ANNAPRASANA_PROHIBITED_GRAHA_HOUSES: dict[str, int] = {"MARS": 8, "VENUS": 7, "MERCURY": 9}
ANNAPRASANA_TENTH_HOUSE_MUST_BE_EMPTY: bool = True   # NOT the 8th — see the module docstring
ANNAPRASANA_SIXTH_HOUSE_OCCUPANCY_ADVERSE: bool = True
# p.33 — sex-dependent month from birth. The chapter calls the month "the most
# important element" (p.35), so this is the rite's PRIMARY rule and the picker
# cannot see it: it takes no child birth date or sex. Stated plainly.
ANNAPRASANA_MONTHS_FROM_BIRTH_SON: tuple[int, ...] = (6, 8, 10, 12)
ANNAPRASANA_MONTHS_FROM_BIRTH_DAUGHTER: tuple[int, ...] = (7, 9, 11)

# ═════════════════════════════════════════════════════════════════════════════
# MILK_FEEDING — the first feeding on milk, Ch. III, p.32
# ═════════════════════════════════════════════════════════════════════════════
#
# A DIFFERENT RITE from Annaprasana, four pages earlier in the same chapter, and
# the source of the karana misattribution described in the module docstring.
#
# It was first recorded here as documentation only — two constants, no activity —
# because its role at the time was to prove what did NOT belong to Annaprasana.
# The page in fact states a complete rule set (stars, tithis, karanas, weekdays,
# signs), so it is now extracted in full and exposed as its own activity. Scope
# is MILK_FEEDING throughout and none of it may be promoted to Annaprasana.

# p.32: "The following asterisms are the best- Aswini, Rohini, Mrigasirsha,
# Punarvasu, Pushya, Magha, Utharapalguni, Hastha, Chithra, Swathi, Anuradha,
# Sravishta, Utharashada, Sravana, Sathabis, Utharabadrapada and Revathi."
MILK_FEEDING_NAKSHATRA_BEST: frozenset[int] = _nak(
    "ASWINI", "ROHINI", "MIRUGASEERIDAM", "PUNARPOOSAM", "POOSAM", "MAGAM",
    "UTHIRAM", "HASTHAM", "CHITHIRAI", "SWATHI", "ANUSHAM", "AVITTAM",
    "UTHIRADAM", "THIRUVONAM", "SADAYAM", "UTHIRATTATHI", "REVATHI",
)  # count = 17
MILK_FEEDING_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False   # no closing clause

# **Magha is on this list and forbidden for Annaprasana is not** — but Ardhra is
# the sharper case: it is FORBIDDEN for Annaprasana (p.34, with a stated
# consequence) and simply absent here, while eleven of these seventeen stars are
# shared with the rice-feeding list. Two feeding rites four pages apart, neither
# list derivable from the other.

# p.32: "Avoid the following Thithis.- Chathurthi, Navami, Shasti, Ashtami,
# Chathurdhasi and New Moon as also Sthirakarana and Vishtikarana."
MILK_FEEDING_TITHI_AVOID_IN_PAKSHA: frozenset[int] = frozenset({4, 6, 8, 9, 14})
MILK_FEEDING_TITHI_AVOID_AMAVASYA: bool = True
MILK_FEEDING_TITHI_AVOID_PURNIMA: bool = False            # not named

# p.32: "Aries, Scorpio and Pisce; as also 'the sign occupied by the Sun'
# (Atho-Mugha Rasi) are inauspicious ; the other Rasis are favourable."
MILK_FEEDING_LAGNA_AVOID: frozenset[int] = frozenset({1, 8, 12})
# The Sun-occupied sign is a fourth prohibition that moves through the year.
# Recorded and NOT scored: it needs the Sun's sign at the elected moment, and
# treating "the other Rasis are favourable" as a flat approval of the remaining
# nine would certify a sign the sentence excludes for one month in twelve.
MILK_FEEDING_SUN_OCCUPIED_SIGN_IS_ADVERSE: bool = True

# p.32: "Monday, Wednesday, Thursday and Friday and the signs occupied or
# aspected by the Moon, Mercury, Jupiter, or Venus are auspicious for commencing
# to nourish the child."
MILK_FEEDING_VARA_GOOD: frozenset[str] = frozenset(
    {"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"}
)
MILK_FEEDING_VARA_AVOID: frozenset[str] = frozenset()     # none named

# p.32, sourced and unscored.
MILK_FEEDING_DAY_FROM_BIRTH: int = 31
# The 10th tara is an activity-specific exemption from the general janma-tara
# bar, applied only to first milk-feeding in the registry (apavada > utsarga).
MILK_FEEDING_FALLBACK_JANMA_TARA: int = 10   # "the day of the 10th asterism from the
                                             # Jenma-Nakshatra of the child will be good"
MILK_FEEDING_TENTH_HOUSE_MUST_BE_EMPTY: bool = True
MILK_FEEDING_FORENOON_OR_NOON_ONLY: bool = True
# "Sthira Karanas (Sakunam, Chathushpadham, Nagam and Kimsthughnam)" (Ch. XXI
# p.110) defines the class named by this milk-feeding passage. STHIRA is a
# class, not a PanchangamSnapshot value, so spell out its four members.
#
# The expansion is corroborated twice over, so it is not a lone reading: Ch. XX
# (p.105) enumerates the same four, and Ch. XVIII (p.99) both names them and
# fixes them to tithi halves — "Sakhunam occurs in the latter half of
# Chathurdhasi; Chathushpadham and Nagam occur in the two halves of the New-Moon
# respectively; Kimsthughnam occurs in the first half of Prathamai of the bright
# fortnight." Three independent passages, one membership list.
#
# This is still MILK_FEEDING-only and must not be promoted to Annaprasana.
MILK_FEEDING_KARANA_AVOID: frozenset[str] = frozenset(
    {"SHAKUNI", "CHATUSHPADA", "NAGA", "KIMSTUGHNA", "VISHTI"}
)


# ═════════════════════════════════════════════════════════════════════════════
# KARNAVEDHA (ear-boring) — Ch. IV, pp.35-36
# ═════════════════════════════════════════════════════════════════════════════

# p.36: "The auspicious asterisms are:- Mrigasirsha, Ardhra, Punarvasu, Pushya,
# Hasta, Chithra, Sravana, Sravishta and Revathi."
# The tightest of the three lists. Not stated exhaustive.
EAR_BORING_NAKSHATRA_BEST: frozenset[int] = _nak(
    "MIRUGASEERIDAM", "THIRUVATHIRAI", "PUNARPOOSAM", "POOSAM", "HASTHAM",
    "CHITHIRAI", "THIRUVONAM", "AVITTAM", "REVATHI",
)  # count = 9; pinned by the test module
EAR_BORING_NAKSHATRA_LIST_IS_EXHAUSTIVE: bool = False
EAR_BORING_NAKSHATRA_PROHIBITED: frozenset[int] = frozenset()  # none stated

# p.36: "Dwithiyai, Thrithiyai, Panchami, Shashti, Sapthami, Dhasami, Ekadesi,
# Dwadesi and Thrayodasi are favourable. Other Thithis are not to be considered."
#
# THE ONLY EXHAUSTIVE TITHI RULE in this repo's sourced doctrine. "Other Thithis
# are not to be considered" closes the set, so a tithi off this list is a
# genuine prohibition rather than an absence. Contrast marriage, where Shashthi
# and Dwadashi are merely *middling* — here both are outright favourable.
EAR_BORING_TITHI_BEST_IN_PAKSHA: frozenset[int] = frozenset({2, 3, 5, 6, 7, 10, 11, 12, 13})
EAR_BORING_TITHI_LIST_IS_EXHAUSTIVE: bool = True

# p.36: "Monday, Wednesday, Thursday and Friday ... are good. Avoid Sunday,
# Tuesday and Saturday and the Virgas of the Sun, Mars and Saturn."
EAR_BORING_VARA_GOOD: frozenset[str] = frozenset({"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"})
EAR_BORING_VARA_AVOID: frozenset[str] = frozenset({"SUNDAY", "TUESDAY", "SATURDAY"})

# p.36: "Taurus, Gemini, Cancer, Virgo, Libra, Sagittari and Pisces are
# considered the best signs. Aries and Capricorn are of middling quality. Leo,
# Scorpio and Aquarius should be avoided."
#
# A COMPLETE partition of all twelve signs, like the marriage lagna rule. Note
# it avoids three of the four fixed signs where Namakarana calls the fixed signs
# *best* — the single clearest reason these two rites cannot share an activity.
EAR_BORING_LAGNA_BEST: frozenset[int] = frozenset({2, 3, 4, 6, 7, 9, 12})
EAR_BORING_LAGNA_MIDDLING: frozenset[int] = frozenset({1, 10})
EAR_BORING_LAGNA_AVOID: frozenset[int] = frozenset({5, 8, 11})
# The three sets partition all twelve signs — pinned by the test module.

# Sourced, deliberately unscored.
EAR_BORING_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True                     # p.36
EAR_BORING_PROHIBITED_GRAHA_HOUSES: tuple[tuple[str, int], ...] = (    # p.36
    ("VENUS", 6), ("VENUS", 8), ("MERCURY", 8),
)
EAR_BORING_NAKSHATRA_SANDHI_PROHIBITED: bool = True                    # p.35
EAR_BORING_TWO_STAR_OR_TWO_TITHI_DAY_PROHIBITED: bool = True           # p.36
EAR_BORING_FORENOON_BEST_NOON_FAIR: bool = True                        # p.36
EAR_BORING_PREFERRED_DAYS_FROM_BIRTH: tuple[int, ...] = (12, 16)       # p.35
EAR_BORING_PREFERRED_MONTHS_FROM_BIRTH: tuple[int, ...] = (6, 7, 8, 10)  # p.35


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
    # ── Namakarana ──────────────────────────────────────────────────────────
    "KP_CH3_NAMING_NAKSHATRA_001": _textual(
        "KP_CH3_NAMING_NAKSHATRA_001", "NAKSHATRA", "NAMING_CEREMONY", "III", 30,
        "The following asterisms are good:- Aswini, Rohini, Mrigasirsha, Ardhra, Punarvasu, "
        "Pushya, Utharapalguni, Hastha, Swathi, Anuradha, Sravana, Sravishta, Sathabis and "
        "Revathi.",
        "14 stars, framed as 'good'. NOT exhaustive — no closing 'the remaining should be "
        "avoided' clause, so an unlisted star is a mild penalty, never a veto.",
        notes=(
            "Ardra is INCLUDED despite being a Tikshna star. Any rule rejecting stars by "
            "nature-class would wrongly drop it — activity tables outrank nature classes. "
            "Annaprasana (Ch. III p.34) explicitly FORBIDS Ardra; the two rites disagree."
        ),
    ),
    "KP_CH3_NAMING_TITHI_001": _textual(
        "KP_CH3_NAMING_TITHI_001", "TITHI", "NAMING_CEREMONY", "III", 30,
        "The Thithis to be avoided are:- The 4th, 6th, 8th, 9th, 12th, and 14th of the bright "
        "and dark halves of the lunar month, the Full-Moon and the New-Moon days.",
        "Avoid in-paksha 4/6/8/9/12/14 in BOTH pakshas, plus Purnima and Amavasya. "
        "Paksha-explicit, so unlike marriage there is no paksha ambiguity to preserve.",
        notes=(
            "Differs from Annaprasana (same chapter, p.34), which drops Dwadashi from the set "
            "and does not ban Purnima/Amavasya. Same six-tithi core as the Ch. XXI general "
            "transaction rule (p.113), which likewise omits the Purnima/Amavasya ban."
        ),
    ),
    "KP_CH3_NAMING_VARA_001": _textual(
        "KP_CH3_NAMING_VARA_001", "VARA", "NAMING_CEREMONY", "III", 30,
        "Monday, Wednesday, Thursday and Friday are good, as also the Amsa, the Lagna (rising "
        "sign), the Dhrekkana and Hora of Mercury, Jupiter, Venus and the Moon. Other days "
        "should be avoided.",
        "Mon/Wed/Thu/Fri good; Sun/Tue/Sat avoided. The closing 'Other days should be avoided' "
        "makes this EXHAUSTIVE — unlike the Ch. XXI treasure weekday rule, which names the "
        "same four good days and no adverse ones.",
    ),
    "KP_CH3_NAMING_LAGNA_001": _textual(
        "KP_CH3_NAMING_LAGNA_001", "MUHURTA_LAGNA_SIGN", "NAMING_CEREMONY", "III", 31,
        "Fixed signs (Taurus, Leo, Scorpio and Aquarius) are considered the best. Common signs "
        "(Gemini, Virgo, Sagittari and Pisces) are also approved, when occupied by a benefic.",
        "Fixed best. Common signs are approved ONLY on a condition (a benefic occupying them) "
        "that a day snapshot cannot evaluate — so they score neutral with the condition named, "
        "never credited as met. Movable signs are unstated and score neutral.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        notes=(
            "Ear-boring (Ch. IV p.36) AVOIDS Leo, Scorpio and Aquarius — three of the four "
            "signs called best here. The clearest single reason the two rites are not merged."
        ),
    ),
    "KP_CH3_NAMING_HOUSE_8_001": _textual(
        "KP_CH3_NAMING_HOUSE_8_001", "HOUSE_OCCUPANCY_8", "NAMING_CEREMONY", "III", 30,
        "The 8th house, from the rising sign, at the time, should be unoccupied.",
        "8th-house vacancy required for naming.",
        notes=(
            "This is the rule Ch. XIV explicitly refuses for marriage (Saturn/Sun/Mars in the "
            "8th are GOOD there). Its genuine homes are here, ear-boring, the pre-marriage "
            "Snaana rite, and Ch. XXI treasure. Per-activity, never global. NOT IMPLEMENTED — "
            "no muhurta-moment house-occupancy input."
        ),
    ),
    "KP_CH3_NAMING_KARANA_001": _textual(
        "KP_CH3_NAMING_KARANA_001", "KARANA", "NAMING_CEREMONY", "III", 30,
        "Sakunam and Vishti Karanas should be avoided.",
        "Sakuna and Vishti prohibited. The same page enumerates the eight tithi-halves that "
        "constitute Vishti.",
        notes="Implemented from PanchangamSnapshot karana fields; see the registry for the daily-transition scope.",
    ),
    "KP_CH3_NAMING_DAYPART_001": _textual(
        "KP_CH3_NAMING_DAYPART_001", "DAY_PART", "NAMING_CEREMONY", "III", 31,
        "The ceremony should be performed during the fore-noon of the day and not at any other "
        "time.",
        "Forenoon REQUIRED — stated as a requirement, not a preference.",
        notes=(
            "NOT IMPLEMENTED. The picker's recommended window comes from the hora-intersect-"
            "Gowri-kala layer; constraining it to the forenoon is a window-layer change, "
            "deliberately out of this pass."
        ),
    ),
    "KP_CH3_NAMING_DAY_COUNT_001": _textual(
        "KP_CH3_NAMING_DAY_COUNT_001", "DAYS_FROM_BIRTH", "NAMING_CEREMONY", "III", 30,
        "The appropriate day for this function is the 10th, 12th or 16th day of the child's "
        "birth. Failing to perform it on any of these days, an auspicious day, say the Vedas, "
        "should be chosen for the purpose - after the 16th day of the child's birth.",
        "Day 10, 12 or 16 from birth preferred; otherwise any auspicious day after day 16.",
        notes="NOT IMPLEMENTED — the picker takes no child birth date.",
    ),
    "KP_CH3_NAMING_YOGA_001": _textual(
        "KP_CH3_NAMING_YOGA_001", "YOGA", "NAMING_CEREMONY", "III", 31,
        "Jupiter must occupy quadrant (Kendra) or Trine (Thrikona) from the rising sign, at the "
        "time of christening; a malefic must occupy the 11th house, with Mercury in a quadrant "
        "occupying a benefic Navamsa - this is considered a very fortunate time for celebrating "
        "the christening festival.",
        "Named auspicious configuration. Additive bonus; nothing says it cancels a prohibition.",
        notes="NOT IMPLEMENTED — moment chart.",
    ),
    "KP_CH3_NAMING_YOGA_002": _textual(
        "KP_CH3_NAMING_YOGA_002", "YOGA", "NAMING_CEREMONY", "III", 31,
        "Another auspicious time is during the bright fortnight (Sukla Paksha) when the 11th "
        "house from the rising sign, at the time, is occupied by either Venus or a malefic, "
        "Jupiter or Moon occupying the quadrants (Kendras). This will produce wealth, "
        "contentment and prosperity.",
        "Second named yoga for naming.",
        notes="NOT IMPLEMENTED — moment chart.",
    ),
    "KP_CH3_NAMING_YOGA_003": _textual(
        "KP_CH3_NAMING_YOGA_003", "YOGA", "NAMING_CEREMONY", "III", 31,
        "Yet another auspicious time is that when the rising sign, at the time, is the house of "
        "a benefic with a malefic in the 3rd and Venus in the 12th house, the Moon being "
        "dignified.",
        "Third named yoga for naming.",
        notes="NOT IMPLEMENTED — moment chart.",
    ),
    # ── Annaprasana ─────────────────────────────────────────────────────────
    "KP_CH3_ANNAPRASANA_NAKSHATRA_001": _textual(
        "KP_CH3_ANNAPRASANA_NAKSHATRA_001", "NAKSHATRA", "ANNAPRASANA", "III", 34,
        "The following are the most favourable asterisms - Aswini, Rohini, Mrigasirsha, "
        "Punarvasu, Pushya, Utharapalguni, Hastha, Chithra, Swathi, Anuradha, Utharashada, "
        "Sravana, Sravishta, Sathabis, Utharabadhrapada and Revathi.",
        "16 stars, 'the most favourable'. Paired with an explicit 8-star prohibition "
        "(KP_CH3_ANNAPRASANA_NAKSHATRA_002); three stars fall on neither list and score neutral.",
        notes="Ardra is ABSENT here and PRESENT in the naming list on p.30 — the two rites disagree.",
    ),
    "KP_CH3_ANNAPRASANA_NAKSHATRA_002": _textual(
        "KP_CH3_ANNAPRASANA_NAKSHATRA_002", "NAKSHATRA", "ANNAPRASANA", "III", 34,
        "The asterisms Ardhra, Krithika, Jyeshta, Barani, Aslesha, Purvapalguni, Purvashada, "
        "Purvabadrapada will cause misery, thoughtlessness and fear and so one should not start "
        "any function of feeding on those days.",
        "An EXPLICIT PROHIBITION with a stated consequence — 'one should not start any function "
        "of feeding on those days'. Graded as a veto, not a penalty, and distinct from mere "
        "absence from the favourable list.",
        notes=(
            "The only named forbidden-star set among the three samskaras, and the strongest "
            "nakshatra rule in this module."
        ),
    ),
    "KP_CH3_ANNAPRASANA_TITHI_001": _textual(
        "KP_CH3_ANNAPRASANA_TITHI_001", "TITHI", "ANNAPRASANA", "III", 34,
        "Shashti, Ashtami, Navami, Chathurthi, Chathurdasi - these Thithis should be totally "
        "avoided for this function.",
        "Avoid in-paksha 4, 6, 8, 9, 14. 'Totally avoided' grades this a prohibition.",
        notes=(
            "The naming set minus Dwadashi (12), and WITHOUT the Purnima/Amavasya ban. Two "
            "rites in one chapter, two different tithi sets — preserved, not harmonised."
        ),
    ),
    "KP_CH3_ANNAPRASANA_VARA_001": _textual(
        "KP_CH3_ANNAPRASANA_VARA_001", "VARA", "ANNAPRASANA", "III", 34,
        "Monday, Wednesday, Thursday and Friday are good, as also the time when the rising "
        "Navamsa is that of the Moon, Mercury, Jupiter and Venus. Sunday, Tuesday and Saturday "
        "and the time when the rising Navamsa is that of the Sun, Mars or Saturn are "
        "unfavourable.",
        "Mon/Wed/Thu/Fri good; Sun/Tue/Sat unfavourable — both halves stated explicitly.",
    ),
    "KP_CH3_ANNAPRASANA_LAGNA_001": _textual(
        "KP_CH3_ANNAPRASANA_LAGNA_001", "MUHURTA_LAGNA_SIGN", "ANNAPRASANA", "III", 34,
        "Taurus, Aquarius, Libra, Virgo, Leo, Cancer, Capricorn, Gemini and Sagittari are "
        "beneficent signs.",
        "Nine signs named beneficent. Aries, Scorpio and Pisces are NOT called adverse — they "
        "are unstated and score neutral, never a penalty.",
    ),
    "KP_CH3_ANNAPRASANA_JANMA_NAKSHATRA_001": _textual(
        "KP_CH3_ANNAPRASANA_JANMA_NAKSHATRA_001", "JANMA_NAKSHATRA", "ANNAPRASANA", "III", 34,
        "The child should not be fed (for the first time) on a day ruled by its asterism at "
        "birth, for this will shorten its life.",
        "The child's own birth star is prohibited. A PERSONAL-LAYER rule: only evaluable when a "
        "subject is supplied, and deliberately absent from general mode. Graded a veto because "
        "the text states a consequence rather than a preference.",
        notes=(
            "The subject the picker carries is the chart owner's. When the chart IS the child's "
            "this is exact; when a parent runs the picker for a child whose chart is not "
            "loaded, the factor is judged against the wrong birth star — so the engine names "
            "whose star it used in the reason copy."
        ),
    ),
    "KP_CH3_ANNAPRASANA_TARA_001": RuleSource(
        rule_id="KP_CH3_ANNAPRASANA_TARA_001",
        factor="TARA_COUNT_FROM_JANMA",
        activity="ANNAPRASANA",
        authority=_authority(
            "III", 34,
            "The [2nd], 4th, 6th, 8th, [10th], [11th], 13th, 15th, 17th and [19th] asterisms "
            "from the asterism, at birth, are favourable.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="ANNAPRASANA",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.INTERPRETED,
        outcome=VerificationOutcome.TRANSLATION_AMBIGUOUS,
        interpretation=(
            "A tara-count rule exists and is confirmed to exist. Four of its ten ordinals are "
            "OCR noise in the scan ('and', 'roth', 'rth', 'roth'); the bracketed readings above "
            "are the most plausible reconstruction and are NOT confidently legible."
        ),
        notes=(
            "DELIBERATELY NOT IMPLEMENTED. `ANNAPRASANA_FAVOURABLE_TARA_COUNTS` is empty. "
            "Reconstructing the missing ordinals would be inventing a tara list — the exact "
            "failure this module exists to prevent. Needs a clean page image."
        ),
        verified_on=_VERIFIED_ON,
        verified_by=_VERIFIED_BY,
    ),
    "KP_CH3_ANNAPRASANA_COMBUSTION_WAIVER_001": _textual(
        "KP_CH3_ANNAPRASANA_COMBUSTION_WAIVER_001", "PLANET_VISIBILITY", "ANNAPRASANA", "III", 35,
        "The most important element in the matter of starting to feed a child is the month; and "
        "so it does not matter if Jupiter and Venus be 'Asthangatha' at the time.",
        "Combustion is WAIVED for this rite — the month outranks it. The text's own proof that "
        "combustion rules are per-activity: marriage (Ch. XIV p.80) enforces combustion with "
        "specific asymmetric day buffers, and this rite waives it outright.",
        term="Asthangatha",
        notes=(
            "NOT IMPLEMENTED as a scored factor (no combustion input), but recorded so that no "
            "global combustion veto is ever added over the top of it."
        ),
    ),
    "KP_CH3_ANNAPRASANA_HOUSE_001": _textual(
        "KP_CH3_ANNAPRASANA_HOUSE_001", "HOUSE_OCCUPANCY", "ANNAPRASANA", "III", 34,
        "The function should not be performed at a time when the 8th house from the rising sign "
        "is occupied by Mars, or the 7th house by Venus, or the 9th by Mercury. The 10th house "
        "from the rising sign at the time of feeding must be unoccupied. Planets in the 6th "
        "house, benefic or malefic, cause ill-feeling among relations.",
        "Graha-specific 7th/8th/9th bans, a 10th-house vacancy requirement, and an adverse 6th.",
        notes=(
            "This rite requires the 10TH vacant where naming and ear-boring require the 8TH — "
            "do not generalise 'the Nth house must be empty' across rites. NOT IMPLEMENTED."
        ),
    ),
    "KP_CH3_ANNAPRASANA_MONTH_001": _textual(
        "KP_CH3_ANNAPRASANA_MONTH_001", "MONTHS_FROM_BIRTH", "ANNAPRASANA", "III", 33,
        "Start feeding the son in the 6th month, failing which in the 8th, 10th or 12th solar "
        "month. In the case of a daughter, the function should take place in the 7th, 9th or "
        "11th month - in odd months.",
        "Sex-dependent month-from-birth preference.",
        notes=(
            "NOT IMPLEMENTED — the picker takes no child birth date or sex. p.35 calls the "
            "month 'the most important element' for this rite, so the engine currently cannot "
            "see this activity's PRIMARY rule. Stated plainly rather than papered over."
        ),
    ),
    "KP_CH3_MILK_FEEDING_KARANA_001": _textual(
        "KP_CH3_MILK_FEEDING_KARANA_001", "KARANA", "MILK_FEEDING", "III", 32,
        "Avoid the following Thithis.- Chathurthi, Navami, Shasti, Ashtami, Chathurdhasi and "
        "New Moon as also Sthirakarana and Vishtikarana.",
        "The milk-feeding rite's own tithi and karana bans.",
        scope="MILK_FEEDING",
        notes=(
            "RECORDED TO CORRECT A MISATTRIBUTION. docs/MUHURTA_ENGINE_AUTHORITATIVE_INPUTS_v2_"
            "2026-08-14.md states that *Annaprasana* avoids Sthira karana and Vishti. This "
            "sentence is from the MILK-feeding rite (p.32); the rice-feeding rite (pp.33-35) "
            "states no karana rule at all. Same class of error as the marriage 8th-vacancy "
            "finding. Must not be promoted to ANNAPRASANA."
        ),
    ),
    "KP_CH3_MILK_FEEDING_NAKSHATRA_001": _textual(
        "KP_CH3_MILK_FEEDING_NAKSHATRA_001", "NAKSHATRA", "MILK_FEEDING", "III", 32,
        "The following asterisms are the best- Aswini, Rohini, Mrigasirsha, Punarvasu, Pushya, "
        "Magha, Utharapalguni, Hastha, Chithra, Swathi, Anuradha, Sravishta, Utharashada, "
        "Sravana, Sathabis, Utharabadrapada and Revathi.",
        "17 stars for the first feeding on milk. Not exhaustive — no closing clause.",
        scope="MILK_FEEDING",
        notes=(
            "A SEPARATE LIST FROM ANNAPRASANA'S, four pages earlier in the same chapter. "
            "Ardhra is the clearest proof they are not one rule: it is FORBIDDEN for the "
            "rice-feeding (p.34, with a stated consequence) and is simply absent here, while "
            "eleven of these seventeen are shared. Neither list is derivable from the other."
        ),
    ),
    "KP_CH3_MILK_FEEDING_TITHI_001": _textual(
        "KP_CH3_MILK_FEEDING_TITHI_001", "TITHI", "MILK_FEEDING", "III", 32,
        "Avoid the following Thithis.- Chathurthi, Navami, Shasti, Ashtami, Chathurdhasi and "
        "New Moon as also Sthirakarana and Vishtikarana.",
        "Five in-paksha tithis and Amavasya prohibited. 'Avoid the following Thithis' is the "
        "same categorical form Namakarana states on p.30 and is graded a veto alongside it. "
        "Purnima is not named.",
        scope="MILK_FEEDING",
    ),
    "KP_CH3_MILK_FEEDING_VARA_001": _textual(
        "KP_CH3_MILK_FEEDING_VARA_001", "VARA", "MILK_FEEDING", "III", 32,
        "Monday, Wednesday, Thursday and Friday and the signs occupied or aspected by the Moon, "
        "Mercury, Jupiter, or Venus are auspicious for commencing to nourish the child.",
        "The four benefic weekdays. No adverse day is named, so the other three score neutral.",
        scope="MILK_FEEDING",
    ),
    "KP_CH3_MILK_FEEDING_LAGNA_001": _textual(
        "KP_CH3_MILK_FEEDING_LAGNA_001", "MUHURTA_LAGNA_SIGN", "MILK_FEEDING", "III", 32,
        "Aries, Scorpio and Pisce; as also 'the sign occupied by the Sun' (Atho-Mugha Rasi) "
        "are inauspicious ; the other Rasis are favourable.",
        "Three signs prohibited outright. The fourth prohibition — whichever sign the Sun "
        "occupies — is recorded and NOT scored.",
        outcome=VerificationOutcome.PARTIAL,
        scope="MILK_FEEDING",
        notes=(
            "The remaining nine are NOT credited as favourable, even though the sentence says "
            "so, because one of them is disqualified for a month at a time by the Sun clause "
            "and a sunrise lagna alone cannot say which. Crediting all nine would certify a "
            "sign this very sentence excludes."
        ),
        term="Atho-Mugha Rasi",
    ),
    "KP_CH3_MILK_FEEDING_JANMA_TARA_001": _textual(
        "KP_CH3_MILK_FEEDING_JANMA_TARA_001", "JANMA_TARA_COUNT", "MILK_FEEDING", "III", 32,
        "A wise man will commence to feed the child on milk from a nursing chank on the 31st "
        "day of its birth; if that be not convenient, the day of the 10th asterism from the "
        "Jenma-Nakshatra of the child will be good.",
        "THE 10TH TARA — Anu-Jenma — IS OFFERED AS THE FALLBACK GOOD DAY. Six chapters "
        "prohibit that same count, and this one recommends it.",
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        scope="MILK_FEEDING",
        notes=(
            "NOT SCORED, and it is the SECOND of two independent passages in this book that "
            "invert the janma-tara polarity — Ch. X p.62 calls the whole janma / Anu-Jenma / "
            "Thri-Jenma triad 'beneficial' "
            "(`kalaprakasika_learning_rules.MANTRA_INITIATION_JANMA_TARA_FAVOURABLE`). Two "
            "chapters thirty pages apart agreeing on the reversal makes it much harder to read "
            "either as a transcription slip, and it is raised for the astrologer rather than "
            "encoded: the engine's janma-tara field is a prohibition set, and building a "
            "favourable-count field around two passages would be premature."
        ),
    ),
    # ── Karnavedha ──────────────────────────────────────────────────────────
    "KP_CH4_EAR_BORING_NAKSHATRA_001": _textual(
        "KP_CH4_EAR_BORING_NAKSHATRA_001", "NAKSHATRA", "EAR_BORING", "IV", 36,
        "The auspicious asterisms are:- Mrigasirsha, Ardhra, Punarvasu, Pushya, Hasta, Chithra, "
        "Sravana, Sravishta and Revathi.",
        "9 stars — the tightest of the three samskara lists. Not stated exhaustive, so an "
        "unlisted star is a mild penalty rather than a veto.",
    ),
    "KP_CH4_EAR_BORING_TITHI_001": _textual(
        "KP_CH4_EAR_BORING_TITHI_001", "TITHI", "EAR_BORING", "IV", 36,
        "Dwithiyai, Thrithiyai, Panchami, Shashti, Sapthami, Dhasami, Ekadesi, Dwadesi and "
        "Thrayodasi are favourable. Other Thithis are not to be considered.",
        "In-paksha 2/3/5/6/7/10/11/12/13 favourable, and the closing 'Other Thithis are not to "
        "be considered' CLOSES the set — a tithi off this list is a genuine prohibition, not "
        "merely unlisted. The only exhaustive tithi rule in this repo's sourced doctrine.",
        notes=(
            "Contrast marriage (Ch. XIV p.79), where Shashthi and Dwadashi are only middling; "
            "here both are outright favourable. Distinct lists with similar Tamil ordinals — "
            "the marriage worksheet flagged this collision risk and it was real."
        ),
    ),
    "KP_CH4_EAR_BORING_VARA_001": _textual(
        "KP_CH4_EAR_BORING_VARA_001", "VARA", "EAR_BORING", "IV", 36,
        "Monday, Wednesday, Thursday and Friday and the time when the rising Navamsa is that of "
        "the Moon, Mercury, Jupiter or Venus are good. Avoid Sunday, Tuesday and Saturday and "
        "the Virgas of the Sun, Mars and Saturn.",
        "Mon/Wed/Thu/Fri good; Sun/Tue/Sat avoided. Both halves stated explicitly.",
    ),
    "KP_CH4_EAR_BORING_LAGNA_001": _textual(
        "KP_CH4_EAR_BORING_LAGNA_001", "MUHURTA_LAGNA_SIGN", "EAR_BORING", "IV", 36,
        "Taurus Gemini, Cancer, Virgo, Libra, Sagittari and Pisces are considered the best "
        "signs. Aries and Capricorn are of middling quality. Leo, Scorpio and Aquarius should "
        "be avoided.",
        "A COMPLETE partition of all twelve signs into best (7) / middling (2) / avoid (3), like "
        "the marriage lagna rule. 'Should be avoided' is a penalty, not automatically a veto.",
        notes=(
            "Avoids three of the four fixed signs, which Namakarana (Ch. III p.31) calls BEST. "
            "The clearest single reason these two rites cannot share one activity."
        ),
    ),
    "KP_CH4_EAR_BORING_HOUSE_8_001": _textual(
        "KP_CH4_EAR_BORING_HOUSE_8_001", "HOUSE_OCCUPANCY_8", "EAR_BORING", "IV", 36,
        "The 8th house from the rising sign, at the time, should be unoccupied. Venus must not "
        "occupy the 6th house or the 8th. Mercury should not be in the 8th house.",
        "8th-house vacancy plus explicit Venus (6th/8th) and Mercury (8th) bans.",
        notes="NOT IMPLEMENTED — no muhurta-moment house-occupancy input.",
    ),
    "KP_CH4_EAR_BORING_SANDHI_001": _textual(
        "KP_CH4_EAR_BORING_SANDHI_001", "NAKSHATRA_SANDHI", "EAR_BORING", "IV", 35,
        "'Nakshatra-Sandhi' - the time between the ending moments of one asterism and the "
        "beginning of its next - is inauspicious.",
        "The star-junction moment is prohibited.",
        term="Nakshatra-Sandhi",
        notes=(
            "NOT IMPLEMENTED — needs sub-day nakshatra transition timing at the candidate "
            "minute, which a day-level scorer does not model."
        ),
    ),
    "KP_CH4_EAR_BORING_DUAL_RULER_001": _textual(
        "KP_CH4_EAR_BORING_DUAL_RULER_001", "NAKSHATRA_TITHI_TRANSITION", "EAR_BORING", "IV", 36,
        "A day ruled by two asterisms or by two Thithis is bad. If this rule be not observed, "
        "the subject will be exposed to the risk of having his ears hurt.",
        "A day carrying a star change or a tithi change is prohibited.",
        notes="NOT IMPLEMENTED — same sub-day transition modelling gap as the sandhi rule.",
    ),
    "KP_CH4_EAR_BORING_DAYPART_001": _textual(
        "KP_CH4_EAR_BORING_DAYPART_001", "DAY_PART", "EAR_BORING", "IV", 36,
        "The forenoon is the best time; noon is pretty favourable; afternoon, evening and the "
        "twilight time are inauspicious.",
        "Forenoon best, noon fair, afternoon/evening/twilight prohibited.",
        notes="NOT IMPLEMENTED — window-layer change, deliberately out of this pass.",
    ),
    "KP_CH4_EAR_BORING_DAY_COUNT_001": _textual(
        "KP_CH4_EAR_BORING_DAY_COUNT_001", "DAYS_FROM_BIRTH", "EAR_BORING", "IV", 35,
        "This function should be performed on the 12th or the 16th day of the birth of the "
        "child or in the 6th, 7th, 8th or the 10th month.",
        "Day 12 or 16 from birth, or month 6/7/8/10.",
        notes="NOT IMPLEMENTED — the picker takes no child birth date.",
    ),
}
