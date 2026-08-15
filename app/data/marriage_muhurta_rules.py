"""Kalaprakasika Ch. XIII-XIV marriage-muhurta doctrine.

Sourced from N.P. Subramonia Iyer's Kalaprakasika translation (Internet
Archive scan), pp. 68-87, verified against 20 user-supplied page images on
2026-08-14. The verbatim passages this module encodes live in the extraction
worksheet: `docs/MARRIAGE_EXTRACTION_WORKSHEET_KALAPRAKASIKA_CH14_2026-08-14.yaml`.
Architecture background: `docs/MUHURTA_ENGINE_AUTHORITATIVE_INPUTS_v2_2026-08-14.md`.

Every constant below is paired with a `RuleSource` record in `RULE_SOURCES`
carrying the page, the verbatim passage, and the verification outcome. Do
not add, "correct", or extend a value here without a citation to back it —
this module exists specifically so nothing about marriage doctrine gets
invented. Where the chapter left something unread or unresolved, the value
stays `None`/empty and the paired `RuleSource` says PENDING or NOT_FOUND —
never fill a gap with a plausible-looking guess.

This is data only. Nothing here scores a chart or a date; it is the
reference table a future L1-L9 muhurta engine (see
`docs/MUHURTA_MASTER_REMEDIATION_2026-08-14.md`) will read from.
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
_CHAPTER = "XIV"
_EDITION = "Subramonia Iyer"
_VERIFIED_ON = "2026-08-14"
_VERIFIED_BY = "primary-text images (user-supplied)"


def _nak(*names: str) -> frozenset[int]:
    """Canonical 1..27 nakshatra numbers for this repo's Tamil-transliterated
    keys (`app.constants.astrology.NAKSHATRA_NAMES`) — never a second name list."""
    return frozenset(NAKSHATRA_NAMES.index(name) + 1 for name in names)


# ── 1. Nakshatra allowed set (p.79, CONFIRMED_EXACT) ────────────────────────
# "The following asterisms are the best; they favour the birth of sons:
# Rohini, Mrigasirsha, Magha, Utharapalguni, Hastha, Swathi, Anuradha, Mula,
# Utharashada, Utharabadhrapadha and Revathi." Preferential ("best, favour
# birth of sons"), not a stated exhaustive veto of the other 16 stars.
MARRIAGE_NAKSHATRA_ALLOWED: frozenset[int] = _nak(
    "ROHINI", "MIRUGASEERIDAM", "MAGAM", "UTHIRAM", "HASTHAM", "SWATHI",
    "ANUSHAM", "MOOLAM", "UTHIRADAM", "UTHIRATTATHI", "REVATHI",
)  # count = 11; pinned by tests/test_marriage_muhurta_doctrine.py

# A second layer the pack didn't anticipate: "Oordhva-Mukha asterisms most
# fruitful; Atho-Mukha cause harm; Thiryag-Mukha breed fever" (p.79). The
# per-star Oordhva/Atho/Thiryag-mukha assignment was not captured in this
# extraction pass — left empty, PENDING its own worksheet record.
MARRIAGE_NAKSHATRA_MUKHA_OVERLAY: dict[int, str] = {}  # nakshatra_number -> "OORDHVA"|"ATHO"|"THIRYAG"

# Pada-level exclusions (Magha-1 / Mula-1 / Revati-4): explicitly NOT_FOUND in
# Ch. XIV — do not hard-code them. The nearest real pada-sensitive rule in
# this chapter range is the Pariyaya/Dhinam compatibility check (p.69), which
# is counted from the bride's star for COMPATIBILITY, not a fixed muhurta veto.
MARRIAGE_NAKSHATRA_PADA_EXCLUSIONS: frozenset[tuple[int, int]] = frozenset()  # (nakshatra_number, pada)

# ── 2. Lagna sign preference (p.80, CONFIRMED_EXACT) ────────────────────────
# "The best signs are Gemini, Virgo and Libra. Aries, Capricorn, Scorpio and
# Pisces should be avoided. The other signs exercise middling influence."
# Numbering: 1=Aries..12=Pisces, matching `app.constants.astrology.SIGN_LORD`.
# None of the three "best" signs are fixed (Gemini/Virgo dual, Libra
# movable) — the "Sthira lagna preferred for marriage" assumption in an
# earlier draft of this doctrine was wrong and is dropped here.
MARRIAGE_LAGNA_BEST: frozenset[int] = frozenset({3, 6, 7})        # Gemini, Virgo, Libra
MARRIAGE_LAGNA_AVOID: frozenset[int] = frozenset({1, 8, 10, 12})  # Aries, Scorpio, Capricorn, Pisces
MARRIAGE_LAGNA_MIDDLE: frozenset[int] = frozenset({2, 4, 5, 9, 11})
# The three sets partition all twelve signs — pinned by the test module.

# ── 3. 7th house occupancy (p.82, CONFIRMED_EXACT, HARD_VETO) ──────────────
# "There should be no planet in the 7th house... For these reasons the 7th
# house from the rising sign, at the time of marriage, should be vacant."
# Every graha named including benefics (Jupiter/Venus/Mercury/Moon each get
# a named adverse effect); no exception given in the passage.
MARRIAGE_SEVENTH_HOUSE_MUST_BE_EMPTY: bool = True

# ── 4. 8th house occupancy (p.83, CONTRADICTED as a vacancy rule) ──────────
# "Planets in the 8th House — Saturn, the Sun and Mars in the 8th house cause
# good; other planets produce adverse effects." This directly CONTRADICTS a
# blanket "8th must be empty" marriage rule — do not import the 8th-vacancy
# rule from Namakaranam (Ch. III) / ear-boring (Ch. IV) into marriage. The
# genuinely vacancy-requiring moment is the separate pre-marriage SNAANA
# sub-rite (p.68) — see `MARRIAGE_SNAANA_EIGHTH_HOUSE_MUST_BE_EMPTY` below;
# it is a different moment from the marriage lagna itself.
MARRIAGE_EIGHTH_HOUSE_GOOD_GRAHAS: frozenset[str] = frozenset({"SATURN", "SUN", "MARS"})
MARRIAGE_EIGHTH_HOUSE_OTHER_GRAHAS_ADVERSE: bool = True

# ── 5. Tithi tiers (p.79, CONFIRMED_EXACT) ──────────────────────────────────
# "The best Thithis are: Dwithiyai, Thrithiyai, Panchami, Sapthami, Dhasami,
# Ekadhasi and Thrayodhasi. Prathamai (of the dark fortnight), Shashti,
# Ashtami, Dwadhasi, Pournami are middling. All the Thithis after Ashtami of
# Krishna Paksha are inauspicious."
# Numbers below are in-paksha day numbers (1..15), matching the convention
# `RIKTA_TITHIS_IN_PAKSHA` already uses in `app.calculations.panchangam`.
MARRIAGE_TITHI_BEST: frozenset[int] = frozenset({2, 3, 5, 7, 10, 11, 13})
MARRIAGE_TITHI_MIDDLING_KRISHNA_ONLY: frozenset[int] = frozenset({1})        # Prathama, dark fortnight only
MARRIAGE_TITHI_MIDDLING_BOTH_PAKSHA: frozenset[int] = frozenset({6, 8, 12})  # Shashthi, Ashtami, Dwadashi
MARRIAGE_TITHI_MIDDLING_SHUKLA_ONLY: frozenset[int] = frozenset({15})        # Purnima
MARRIAGE_TITHI_INAUSPICIOUS_KRISHNA_AFTER_ASHTAMI: frozenset[int] = frozenset({9, 10, 11, 12, 13, 14})
# OPEN QUESTION, flagged (not resolved) in the worksheet: the best-list
# includes 10/11/13, which are also in-paksha day numbers covered by "all
# Thithis after Ashtami of Krishna Paksha" if read paksha-agnostically. The
# most defensible reading pending astrologer sign-off is that the unqualified
# best-7 list is primarily a Shukla-paksha list, and the Krishna-paksha
# post-Ashtami sweep is the operative rule once in the dark fortnight — but
# nothing here decides that silently. Any future consumer of both constants
# together must surface the overlap rather than resolve it.

# ── 6. Guru/Sukra Asthangata marriage buffers (p.80, CONFIRMED_WITH_CONDITION) ─
# "Marriage within a week after the re-appearance (Udhayam) of Venus affects
# the life of the bride; marriage just prior to her becoming Asthangatha
# (combust) affects the life of the bridegroom. Marriage within 8 days after
# the re-appearance of Jupiter adversely affects the bridegroom; marriage
# within 15 days prior to Asthangatha harms the bride."
# Unlike Annaprasana (Ch. VIII), which explicitly waives combustion, marriage
# enforces it with these specific asymmetric buffers. Venus's pre-combustion
# buffer is stated only as "just prior" — no day count given; left as None
# rather than guessing one.
MARRIAGE_VENUS_POST_REAPPEARANCE_AVOID_DAYS: int = 7
MARRIAGE_VENUS_PRE_COMBUSTION_AVOID_DAYS: int | None = None   # text says "just prior", no number given
MARRIAGE_JUPITER_POST_REAPPEARANCE_AVOID_DAYS: int = 8
MARRIAGE_JUPITER_PRE_COMBUSTION_AVOID_DAYS: int = 15
# "Both Guru and Sukra combust = irremediable": not located in this passage.
# Left PENDING — see RULE_SOURCES["MARRIAGE_GURU_SUKRA_ASTHANGATA__TEXTUAL"].
MARRIAGE_BOTH_COMBUST_IRREMEDIABLE: bool | None = None

# A general remedial/bhanga rule (p.87) that can soften combustion and other
# penalties, stated qualitatively — not a numeric formula to implement as-is:
# "Mercury well-located in Lagna diminishes a hundred adverse effects; Venus
# strong in Lagna eradicates a thousand evils; Jupiter well-dignified in
# Lagna sinks three lakhs [of doshas]." Per RULE_PRECEDENCE level 1 (bhanga
# sits above the primary rule it modifies) this should attach as an exception
# once an engine exists; recorded here as text pending that design.
MARRIAGE_LAGNA_STRENGTH_BHANGA_TEXT: str = (
    "Mercury well-placed in Lagna diminishes a hundred adverse effects; "
    "Venus strong in Lagna eradicates a thousand evils; Jupiter "
    "well-dignified in Lagna sinks three lakhs of doshas."
)


@dataclass(frozen=True, slots=True)
class FavorableYoga:
    name: str
    definition: str  # informal planet:house configuration, for later engine wiring


# ── 7. Favorable yogas (p.85, CONFIRMED_EXACT) ──────────────────────────────
# Ten independently-auspicious planet+house configurations ("bestows all
# happiness" / "queen of all beneficial yogas"). None is stated to cancel a
# named dosha or supersede a prohibition, so none feeds `overrides` on any
# other rule — they are additive STRONG_BONUS combinations only. Houses are
# counted from the rising sign (lagna) at the muhurta moment.
MARRIAGE_FAVORABLE_YOGAS: tuple[FavorableYoga, ...] = (
    FavorableYoga("MAHENDRA", "Jupiter in lagna, Venus in 8th, Sun in 11th (Mercury not combust)"),
    FavorableYoga("VISHNU_PRIYA", "Venus in lagna, Jupiter in 10th, Sun and Mercury in 11th"),
    FavorableYoga("ARDHA_NARI", "Venus in lagna, Jupiter in 11th, 8th house unoccupied"),
    FavorableYoga("SREEMATHI", "Venus in 2nd, Jupiter in 12th, Sun in 8th, Saturn in 6th"),
    FavorableYoga("SAMUDRA", "Venus in lagna, Jupiter in 4th, Mercury in 2nd, Saturn in 11th"),
    FavorableYoga("MAHAVISHNU", "Mars in 3rd, Saturn in 6th, Venus in 9th, Jupiter in 12th"),
    FavorableYoga("PUSHYA", "Saturn in 3rd, Jupiter in 6th, Sun in 10th, Mars in 11th"),
    FavorableYoga("STHAVARA", "Jupiter with Venus in lagna, both well-dignified"),
    FavorableYoga("JAYA", "Venus in lagna conjunct Jupiter, both well-dignified"),
    FavorableYoga("VIJAYA", "Mercury, Jupiter, and Venus well-dignified in lagna"),
)  # count = 10; pinned by the test module

# Adverse conditions (p.86-87). Per-item veto-vs-penalty grading was NOT
# resolved in this extraction pass (the worksheet's own outcome notes
# "several items are veto-grade" without enumerating which) — kept as
# descriptive text, severity PENDING per item, rather than guessing a grading.
MARRIAGE_ADVERSE_CONDITIONS: tuple[str, ...] = (
    "End of Paksha, Ruthu, Ayana, or year",
    "During Rikthai (rikta tithis)",
    "Waning Moon (for auspicious commencement)",
    "Vishu / Vyatheepatham / Shadaseethimukham yogas",
    "Prishtodhaya rasis rising",
    "Asterisms 3rd, 5th, 7th, 10th, or 19th from janma nakshatra",
    "Asterism just released from, passing through, or close to a malefic",
    "Eclipse under a Kethu-governed star",
)

# A scope gate (p.87) that relaxes several of the above for most marriages:
# "month, day and Jenma-Nakshathra are inauspicious only for marriage of the
# FIRST-BORN son, not for girls or other sons." Which specific rules this
# gate relaxes beyond month/day/janma-nakshatra was not fully itemised in
# this pass — PENDING further reading before an engine applies it broadly.
MARRIAGE_FIRSTBORN_SON_SCOPE_GATE_TEXT: str = (
    "Month, day, and Jenma-Nakshathra restrictions apply only to the "
    "marriage of a family's first-born son — not to daughters or other sons."
)

# ── 8. Month gating (p.85, CONFIRMED_EXACT — lunar months, NOT yet mapped) ──
# "Ashada, Badhrapadha, Margasira and Magha months are NOT good; the other
# eight are fortunate." Per-month character effects also given (Pushya/
# Krithika -> good character, Palguna -> wealth, Vysakha/Jyeshta ->
# prosperity, Sravana/Aswayuja/Chythra -> middling). These are lunar month
# names, NOT Tamil solar months — mapping one to the other is a separate,
# deliberately-unattempted task; do not silently treat these as Tamil solar
# month names when wiring M2.
MARRIAGE_INAUSPICIOUS_LUNAR_MONTHS: frozenset[str] = frozenset(
    {"ASHADA", "BHADRAPADA", "MARGASIRA", "MAGHA"}
)

# ── 9. Jupiter gochara from the Moon (p.79, CONFIRMED_EXACT) ───────────────
# "If Jupiter transits the 3rd/4th/6th/8th/10th/12th from Janma-Rasi at
# marriage, [the] bride dies or becomes [a] widow. Marry in the 5th/6th/7th
# year of the bride when Jupiter [is] well-placed." An extremely severe
# traditional claim — this constant carries the doctrine as stated; whether
# and how literally to surface it in user-facing copy is a product decision
# for whoever wires this into the engine, not decided here.
MARRIAGE_JUPITER_ADVERSE_HOUSES_FROM_MOON: frozenset[int] = frozenset({3, 4, 6, 8, 10, 12})
MARRIAGE_JUPITER_FAVOURABLE_BRIDE_AGE_YEARS: tuple[int, ...] = (5, 6, 7)

# ── 10. Snaana (pre-marriage ceremonial bath) sub-rite (p.68, CONFIRMED_EXACT) ─
# Has its own muhurta — its own asterisms/tithis/signs and an explicit "no
# planet in the 8th house." This is what resolves the record-4 contradiction:
# 8th-vacancy is real, but it belongs to the Snaana sub-rite, not the
# marriage lagna. Kept as a scope-only flag; the sub-rite's own nakshatra/
# tithi/sign lists were not separately extracted in this pass.
MARRIAGE_SNAANA_EIGHTH_HOUSE_MUST_BE_EMPTY: bool = True


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


RULE_SOURCES: dict[str, RuleSource] = {
    "MARRIAGE_NAKSHATRA_ALLOWED_SET": RuleSource(
        rule_id="MARRIAGE_NAKSHATRA_ALLOWED_SET",
        factor="NAKSHATRA",
        activity="MARRIAGE",
        authority=_authority(
            79,
            "The following asterisms are the best; they favour the birth of sons: Rohini, "
            "Mrigasirsha, Magha, Utharapalguni, Hastha, Swathi, Anuradha, Mula, Utharashada, "
            "Utharabadhrapadha and Revathi.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_EXACT,
        interpretation=(
            "11 stars, Magha and Mula explicitly included. Framed as 'best, favour birth of "
            "sons' — preferential, not an exhaustive allow/deny list. A second overlay exists "
            "(Oordhva/Atho/Thiryag-mukha) — see MARRIAGE_NAKSHATRA_MUKHA_OVERLAY."
        ),
        notes="No pada exclusions stated here (see MARRIAGE_NAKSHATRA_PADA_EXCLUSIONS).",
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images p.79 (user-supplied)",
    ),
    "MARRIAGE_NAKSHATRA_PADA_EXCLUSIONS": RuleSource(
        rule_id="MARRIAGE_NAKSHATRA_PADA_EXCLUSIONS",
        factor="NAKSHATRA_PADA",
        activity="MARRIAGE",
        authority=_authority(
            79, "(no pada-level exclusion of Magha/Mula/Revati appears in the Ch. XIV marriage-asterism passage)"
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,  # confirmed ABSENT from this chapter
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.NOT_FOUND,
        interpretation=(
            "Ch. XIV lists the 11 stars with no pada qualifier. The claimed Magha-1/Mula-1/"
            "Revati-4 exclusions are unsupported by this primary text; the pada-sensitive rule "
            "that does exist (p.69) is a bride-star compatibility check, not a muhurta veto, "
            "and Magha/Mula pada danger is gandanta (Ch. II, natal scope)."
        ),
        notes="Do not hard-code. Treat as SCHOOL_VARIANT at most if a school insists on it.",
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images pp.69,79 (user-supplied)",
    ),
    "MARRIAGE_LAGNA_SIGN_PREFERENCE": RuleSource(
        rule_id="MARRIAGE_LAGNA_SIGN_PREFERENCE",
        factor="MUHURTA_LAGNA_SIGN",
        activity="MARRIAGE",
        authority=_authority(
            80,
            "The best signs are Gemini, Virgo and Libra. Aries, Capricorn, Scorpio and Pisces "
            "should be avoided. The other signs exercise middling influence.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_EXACT,
        interpretation=(
            "No Sthira-lagna preference for marriage exists in the text — Gemini/Virgo are "
            "dual, Libra is movable. 'Should be avoided' is treated as PENALTY/strong-avoid, "
            "not automatically HARD_VETO, unless a profile elevates it."
        ),
        notes="A separate per-sign rising-sign EFFECTS passage also exists (p.80) — a distinct table, not this ranking.",
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images p.80 (user-supplied)",
    ),
    "MARRIAGE_SEVENTH_HOUSE_VACANCY": RuleSource(
        rule_id="MARRIAGE_SEVENTH_HOUSE_VACANCY",
        factor="HOUSE_OCCUPANCY_7",
        activity="MARRIAGE",
        authority=_authority(
            82,
            "There should be no planet in the 7th house... For these reasons the 7th house "
            "from the rising sign, at the time of marriage, should be vacant.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_EXACT,
        interpretation=(
            "Every graha named including benefics (Jupiter/Venus/Mercury/Moon each given a "
            "named adverse effect); no exception given. Supports HARD_VETO."
        ),
        notes="p.82-83 also lists planets in 2nd/3rd/9th/11th as beneficial — a fuller house-occupancy table exists.",
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images p.82 (user-supplied)",
    ),
    "MARRIAGE_EIGHTH_HOUSE_VACANCY": RuleSource(
        rule_id="MARRIAGE_EIGHTH_HOUSE_VACANCY",
        factor="HOUSE_OCCUPANCY_8",
        activity="MARRIAGE",
        authority=_authority(
            83,
            "Planets in the 8th House — Saturn, the Sun and Mars in the 8th house cause good; "
            "other planets produce adverse effects.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,  # confirmed that the blanket-vacancy CANDIDATE is wrong
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONTRADICTED,
        interpretation=(
            "Ch. XIV does NOT require the 8th to be vacant for marriage — it gives a "
            "graha-specific rule instead. Do not import the 8th-vacancy rule from Namakaranam "
            "(Ch. III) / ear-boring (Ch. IV) into the marriage lagna."
        ),
        notes=(
            "The pre-marriage SNAANA bath karma (p.68) DOES require an empty 8th house — "
            "that vacancy belongs to the bath sub-rite, a different moment from the marriage lagna."
        ),
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images pp.68,83 (user-supplied)",
    ),
    "MARRIAGE_TITHI_ALLOWED_SET": RuleSource(
        rule_id="MARRIAGE_TITHI_ALLOWED_SET",
        factor="TITHI",
        activity="MARRIAGE",
        authority=_authority(
            79,
            "The best Thithis are: Dwithiyai, Thrithiyai, Panchami, Sapthami, Dhasami, Ekadhasi "
            "and Thrayodhasi. Prathamai (of the dark fortnight), Shashti, Ashtami, Dwadhasi, "
            "Pournami are middling. All the Thithis after Ashtami of Krishna Paksha are inauspicious.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_EXACT,
        interpretation=(
            "Three tiers: best / middling / inauspicious. Different from the ear-boring 9-tithi "
            "list (Shashti is 'best' there, only 'middling' here). Paksha matters: Prathama is "
            "middling only in Krishna paksha; the whole back half of Krishna paksha is bad."
        ),
        notes=(
            "OPEN QUESTION not resolved by this extraction: the best-7 list's 10/11/13 overlap "
            "in-paksha numbers with the 'after Ashtami of Krishna Paksha' sweep. See the "
            "comment beside MARRIAGE_TITHI_INAUSPICIOUS_KRISHNA_AFTER_ASHTAMI."
        ),
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images p.79 (user-supplied)",
    ),
    "MARRIAGE_GURU_SUKRA_ASTHANGATA__TEXTUAL": RuleSource(
        rule_id="MARRIAGE_GURU_SUKRA_ASTHANGATA__TEXTUAL",
        factor="PLANET_VISIBILITY",
        activity="MARRIAGE",
        authority=_authority(
            80,
            "Marriage within a week after the re-appearance (Udhayam) of Venus affects the life "
            "of the bride; marriage just prior to her becoming Asthangatha (combust) affects the "
            "life of the bridegroom. Marriage within 8 days after the re-appearance of Jupiter "
            "adversely affects the bridegroom; marriage within 15 days prior to Asthangatha "
            "harms the bride.",
            term="Asthangatha / Udhayam",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_WITH_CONDITION,
        interpretation=(
            "Marriage IS restricted around Venus/Jupiter combustion, with specific asymmetric "
            "buffers (real numbers, not placeholders) — unlike Annaprasana, which waives "
            "combustion entirely."
        ),
        notes=(
            "'Both combust = irremediable' not located here — kept PENDING. p.87 gives a "
            "Lagna-strength bhanga that may soften these penalties (MARRIAGE_LAGNA_STRENGTH_BHANGA_TEXT)."
        ),
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images pp.80,87 (user-supplied)",
    ),
    "MARRIAGE_GURU_SUKRA_ASTHANGATA__COMPUTATION_POLICY": RuleSource(
        rule_id="MARRIAGE_GURU_SUKRA_ASTHANGATA__COMPUTATION_POLICY",
        factor="PLANET_VISIBILITY",
        activity="MARRIAGE",
        authority=Authority(
            tradition=None, chapter=None, page=None, verse_or_passage=None,
            translation_edition=None, original_language_term=None,
        ),
        provenance_status=ProvenanceStatus.ENGINE_CONCEPT,
        source_scope="MUHURTA_GENERAL",
        rule_type=RuleType.ENGINE_POLICY,
        source_confidence=None,
        outcome=None,
        interpretation=(
            "Whether a planet is combust on date D is COMPUTED at L0, never read from a page. "
            "Combustion arc per planet and severity resolution (HARD_VETO vs SEVERE_PENALTY) "
            "remain PENDING engine design, separate from the textual buffers above."
        ),
        notes=None,
        verified_on=None,
        verified_by=None,
    ),
    "MARRIAGE_ADVERSE_YOGAS": RuleSource(
        rule_id="MARRIAGE_ADVERSE_YOGAS",
        factor="YOGA_AND_PLANET_IN_SIGN",
        activity="MARRIAGE",
        authority=_authority(
            85,
            "Mahendhra Yoga: Jupiter in rising sign, Venus in 8th, Sun in 11th (if Mercury not "
            "combust). Vishnu Priyai: Venus in rising, Jupiter in 10th, Sun+Mercury in 11th. "
            "Ardhanaari: Venus in rising, Jupiter in 11th, 8th house unoccupied. Sreemathi: "
            "Venus 2nd, Jupiter 12th, Sun 8th, Saturn 6th. Samudhra: Venus rising, Jupiter 4th, "
            "Mercury 2nd, Saturn 11th. Mahavishnu: Mars 3rd, Saturn 6th, Venus 9th, Jupiter "
            "12th. Pushya: Saturn 3rd, Jupiter 6th, Sun 10th, Mars 11th. Sthavara: Jupiter with "
            "Venus in rising, well-dignified. Jaya: Venus in rising conjunct Jupiter, both "
            "well-dignified. Vijayam: Mercury+Jupiter+Venus well-dignified in rising sign.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_EXACT,
        interpretation=(
            "All 10 favorable yogas are independent auspicious combinations (STRONG_BONUS "
            "class). None is stated to cancel a named dosha or supersede a prohibition, so "
            "'overrides' correctly stays empty for all of them."
        ),
        notes=(
            "Adverse-yogas list (p.86-87) is extensive; per-item veto-vs-penalty grading is "
            "PENDING (see MARRIAGE_ADVERSE_CONDITIONS). Also found a first-born-son scope gate "
            "(p.87) — see MARRIAGE_FIRSTBORN_SON_SCOPE_GATE_TEXT."
        ),
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images pp.85,86,87 (user-supplied)",
    ),
    "MARRIAGE_MONTH_GATING": RuleSource(
        rule_id="MARRIAGE_MONTH_GATING",
        factor="TAMIL_SOLAR_MONTH",
        activity="MARRIAGE",
        authority=_authority(
            85,
            "Ashada, Badhrapadha, Margasira and Magha months are NOT good; the other eight are "
            "fortunate.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_EXACT,
        interpretation="Confirms M2 (Tamil-month × activity gating) with primary authority.",
        notes="These are LUNAR month names, not Tamil solar months — mapping between the two is a separate, unattempted task.",
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images p.85 (user-supplied)",
    ),
    "MARRIAGE_MUKHA_DIRECTION_OVERLAY": RuleSource(
        rule_id="MARRIAGE_MUKHA_DIRECTION_OVERLAY",
        factor="NAKSHATRA_DIRECTION",
        activity="MARRIAGE",
        authority=_authority(
            79, "Oordhva-Mukha asterisms most fruitful; Atho-Mukha cause harm; Thiryag-Mukha breed fever."
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.PARTIAL,
        interpretation="A nakshatra-direction modifier layered on the star list — confirmed to exist, but no per-star assignment was captured.",
        notes="MARRIAGE_NAKSHATRA_MUKHA_OVERLAY is left empty pending its own extraction pass.",
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images p.79 (user-supplied)",
    ),
    "MARRIAGE_JUPITER_GOCHARA_FROM_MOON": RuleSource(
        rule_id="MARRIAGE_JUPITER_GOCHARA_FROM_MOON",
        factor="GRAHA_GOCHARA",
        activity="MARRIAGE",
        authority=_authority(
            79,
            "If Jupiter transits the 3rd/4th/6th/8th/10th/12th from Janma-Rasi at marriage, "
            "bride dies or becomes widow. Marry in the 5th/6th/7th year of the bride when "
            "Jupiter is well-placed.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_EXACT,
        interpretation="Feeds M1's guru_gochara_bala dimension with primary authority.",
        notes="Severe traditional phrasing preserved as stated; user-facing copy for this rule is a deliberately separate, undecided product question.",
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images p.79 (user-supplied)",
    ),
    "MARRIAGE_FIRSTBORN_SCOPE_GATE": RuleSource(
        rule_id="MARRIAGE_FIRSTBORN_SCOPE_GATE",
        factor="SCOPE_GATE",
        activity="MARRIAGE",
        authority=_authority(
            87,
            "Month, day and Jenma-Nakshathra are inauspicious only for marriage of the "
            "first-born son, not for girls or other sons.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_EXACT,
        interpretation="A scope gate that relaxes several rules for non-firstborn-son marriages.",
        notes="Exactly which rules beyond month/day/janma-nakshatra it relaxes was not itemised in this pass — PENDING.",
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images p.87 (user-supplied)",
    ),
    "MARRIAGE_LAGNA_STRENGTH_BHANGA": RuleSource(
        rule_id="MARRIAGE_LAGNA_STRENGTH_BHANGA",
        factor="LAGNA_BHANGA",
        activity="MARRIAGE",
        authority=_authority(
            87,
            "Mercury well-located in Lagna diminishes a hundred adverse effects; Venus strong "
            "in Lagna eradicates a thousand evils; Jupiter well-dignified in Lagna sinks three lakhs.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE",
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_EXACT,
        interpretation="A general remedial/bhanga rule — attaches as an exception that can downgrade penalties, per RULE_PRECEDENCE level 1.",
        notes="Qualitative classical phrasing, not a numeric formula — engine wiring for this is undesigned.",
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images p.87 (user-supplied)",
    ),
    "MARRIAGE_SNAANA_KARMA": RuleSource(
        rule_id="MARRIAGE_SNAANA_KARMA",
        factor="HOUSE_OCCUPANCY_8",
        activity="MARRIAGE_SNAANA",
        authority=_authority(
            68,
            "Pre-marriage ceremonial bath (Snaana) has its own muhurta: its own asterisms, "
            "tithis, signs, and 'no planet in 8th house'.",
        ),
        provenance_status=ProvenanceStatus.CONFIRMED,
        source_scope="MARRIAGE_SNAANA",  # deliberately NOT "MARRIAGE" — a different moment
        rule_type=RuleType.TEXTUAL_RULE,
        source_confidence=SourceConfidence.EXACT,
        outcome=VerificationOutcome.CONFIRMED_EXACT,
        interpretation="Resolves the 8th-vacancy contradiction: vacancy is real, but scoped to the Snaana sub-rite, not the marriage lagna.",
        notes="The sub-rite's own nakshatra/tithi/sign lists were not separately extracted in this pass.",
        verified_on=_VERIFIED_ON,
        verified_by="primary-text images p.68 (user-supplied)",
    ),
}
