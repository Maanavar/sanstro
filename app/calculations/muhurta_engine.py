"""One muhurta scoring engine, with an optional personal layer.

`subject=None` **is** general mode — every personal rule short-circuits and
nothing else changes. There is no second code path to keep in sync; the two
modes drifting apart is exactly how `_score_public_muhurta` and
`find_best_muhurta_slots` ended up disagreeing.

Design contract (see `docs/MUHURTA_MASTER_REMEDIATION_2026-08-14.md` §6):

* **Pure.** No DB, no HTTP, no ephemeris calls — a snapshot in, a score out.
  That is what makes it testable over a 60-day sweep without a database.
* **Veto vs penalty are distinct.** A veto removes the day and names the factor
  that killed it; a penalty is a weighted reduction that something else can
  outweigh. They are never collapsed into one number, because some defects
  (Chandrashtama) can never be numerically cancelled.
* **Every factor reports itself.** `DayScore.factors` carries what fired, what
  it contributed, and — where the rule came from a classical text — the
  `rule_id` whose `RULE_SOURCES` record holds the page and passage. That is the
  audit trail that lets the product answer "why did you allow Moolam?" with a
  citation instead of a scoring opinion.
* **Silence is never taken for approval.** An activity with no sourced rule
  table does not quietly score as fine: `_nakshatra_factor` and friends emit an
  explicit UNSOURCED verdict naming the gap. That gap is now smaller but has not
  closed: MARRIAGE (Kalaprakasika Ch. XIV), the three samskaras (Ch. III-IV) and
  the Ch. XXI treasure activities have primary-text tables; JOB_START, EXAM,
  TRAVEL, MEDICAL, SPIRITUAL and the generic PURCHASE/INVESTMENT still do not,
  and must not pretend otherwise.
* **Sourced does not mean fully judged.** An activity's registry entry lists the
  dimensions its chapter covers that this engine *cannot* check — house
  occupancy, named yogas, day part. `unscored_dimensions_for` exposes them so a
  surface can say what was left unexamined instead of implying the day passed
  every rule on the page.

Two layers, in evaluation order (`docs/MUHURTA_MASTER_REMEDIATION_2026-08-14.md`
§6.2):

* **L1 generic almanac** (`_almanac_*`) — rikta/subha tithi, the broad subha
  nakshatra list, subha-muhurtham status, Abhijit and Nalla Neram. Runs for
  **every** activity, because "we have no table for gold" must not mean "we
  have nothing to say about the day". Its factors are prefixed `ALMANAC_` and
  carry no `rule_id`: they are almanac convention, not cited doctrine.
* **L2 activity doctrine** (`_nakshatra_factor`, `_tithi_factor`,
  `_vara_factor`, `_lagna_sign_factor`) — the per-activity rules from the
  classical text, cited. Deliberately named without the prefix and kept separate
  from L1 so a UI can tell "Poosam is on the general auspicious list" apart from
  "Kalaprakasika names Poosam best for this activity" — the second is a much
  stronger claim.

L2 is table-driven off `app.data.muhurta_activity_registry` for every activity
**except MARRIAGE**, which keeps its own branch. Marriage's tithi doctrine is
paksha-conditional across three tiers and reports a real intra-page conflict
that the registry's flat shape cannot carry; flattening it would have been a
silent re-scoring of every marriage day, so it was not done.

This module is the **only** thing in the repo that scores a day for a muhurta
(`docs/MUHURTA_MASTER_REMEDIATION_2026-08-14.md` §9.4). `muhurta_service.
_score_panchangam` and `public_tools._score_public_muhurta` were two copies of
L1 that had already drifted apart — they are gone, and this is where they
landed. Do not add a third.

**Provenance of the numbers.** Every weight in `_W` is `ENGINE_POLICY` —
Vinaadi's product decision, not sastra. The classical texts rank factors
(best / middling / avoid) without assigning arithmetic. Do not present these
values to users as traditional, and do not tune them by fitting to a result we
already like; they change only with a stated reason.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from app.calculations.display_names import (
    YOGA_NAME_EN,
    YOGA_NAME_TA,
    nakshatra_en,
    nakshatra_ta,
    rasi_en,
    rasi_ta,
    tithi_display,
)
from app.calculations.ephemeris import EphemerisBody
from app.calculations.muhurta_doctrine import RuleSource
from app.calculations.panchangam import (
    RIKTA_TITHIS_IN_PAKSHA,
    SUBHA_NAKSHATRA_NUMBERS,
    SUBHA_TITHIS_KRISHNA,
    SUBHA_TITHIS_SHUKLA,
)
from app.calculations.tara_bala import TARA_SCORE, chandra_bala, tara_number
from app.calculations.transits import is_cazimi, is_combust
from app.data import marriage_muhurta_rules as marriage
from app.data.muhurta_activity_registry import (
    ACTIVITY_RULES,
    RULE_SOURCE_TABLES,
    ActivityRules,
)


class Verdict(str, Enum):  # noqa: UP042 — str-mixin enum kept; StrEnum changes str()/format() output
    VETO = "VETO"
    PENALTY = "PENALTY"
    NEUTRAL = "NEUTRAL"
    BONUS = "BONUS"
    # The rule table for this activity has not been sourced yet. Distinct from
    # NEUTRAL on purpose: "we checked and it is fine" and "we have nothing to
    # check against" must never render as the same thing.
    UNSOURCED = "UNSOURCED"


@dataclass(frozen=True, slots=True)
class Subject:
    """The personal layer's entire input. `None` in place of one of these is
    general mode — never a subject with placeholder values."""

    janma_nakshatra: int          # 1..27
    janma_rasi: int               # 1..12
    lagna_rasi: int | None = None  # 1..12, for lagna-lord hora
    maha_lord: str | None = None
    antar_lord: str | None = None
    label: str | None = None       # "Meera" — for copy; never used in scoring


@dataclass(frozen=True, slots=True)
class FactorResult:
    factor: str
    verdict: Verdict
    contribution: float
    reason_en: str
    reason_ta: str
    # Provenance link into `RULE_SOURCES` — present only when a classical rule
    # decided this factor. `None` means engine heuristic, and the UI must not
    # dress it up as sourced doctrine.
    rule_id: str | None = None
    # Set when two sourced rules both matched and the text does not settle which
    # wins. Surfaced rather than silently resolved.
    conflict: str | None = None


@dataclass(frozen=True, slots=True)
class DayScore:
    score: float
    vetoed: bool
    factors: tuple[FactorResult, ...]

    @property
    def veto_reasons(self) -> tuple[FactorResult, ...]:
        return tuple(f for f in self.factors if f.verdict is Verdict.VETO)


# ── ENGINE_POLICY weights. Not doctrine. See module docstring. ──────────────
class _W:
    BASE = 50.0
    # L1 generic almanac. These values are carried over unchanged from
    # `muhurta_service._score_panchangam`, which is where they were tuned, so
    # that folding the two former copies into one engine is not also a silent
    # re-scoring of every day. The one place the two copies disagreed was
    # Amavasai — see ALMANAC_AMAVASAI.
    ALMANAC_RIKTA = -15.0
    # `_score_panchangam` printed the Amavasai caution and scored it 0;
    # `_score_public_muhurta` scored it -5. Resolved toward the penalty: a day
    # we tell the user is "not ideal for new starts" and then score as though
    # we had not is exactly the silence-taken-for-approval this module forbids.
    ALMANAC_AMAVASAI = -5.0
    ALMANAC_SUBHA_TITHI_SHUKLA = 10.0
    ALMANAC_SUBHA_TITHI_KRISHNA = 8.0
    ALMANAC_SUBHA_NAKSHATRA = 10.0
    ALMANAC_SUBHA_MUHURTHAM = 20.0
    ALMANAC_ABHIJIT = 5.0
    ALMANAC_NALLA_NERAM = 5.0
    # L2 activity doctrine.
    NAKSHATRA_FAVOURED = 14.0
    NAKSHATRA_NOT_LISTED = -6.0
    # A star outside a list the chapter explicitly closed ("the remaining
    # asterisms should be avoided"). Heavier than merely unlisted, and set level
    # with TITHI_INAUSPICIOUS because both come from the same grade: a stated
    # exclusion that carries no stated consequence.
    NAKSHATRA_EXCLUDED = -14.0
    TITHI_BEST = 10.0
    TITHI_MIDDLING = 0.0
    TITHI_INAUSPICIOUS = -14.0
    # A known prohibited karana transition without a complete time schedule.
    KARANA_TRANSITION = -10.0
    LAGNA_BEST = 8.0
    LAGNA_AVOID = -10.0
    # Product heuristic approved by the owner, not a Kalaprakasika rule. It is
    # applied only in the picker after the actual window lagna is known, and
    # the service keeps it inside the result's existing display band.
    WEALTH_HOUSE_HEURISTIC = 1.0
    # A sourced weekday preference. Weaker than the star, which is why VARA_GOOD
    # sits below NAKSHATRA_FAVOURED — Tamil practice ranks the star above the
    # weekday, and three of these chapters name the same four benefic weekdays,
    # so crediting the weekday heavily would flatten the ranking toward "any
    # Monday or Thursday".
    VARA_GOOD = 6.0
    VARA_AVOID = -8.0
    # The fortnight, where a chapter rules on it. Sized near the weekday: both
    # are broad calendar preferences that would flatten the ranking if priced
    # like a star, and half the days in any range share the verdict.
    PAKSHA_PREFERRED = 6.0
    PAKSHA_AGAINST = -8.0
    CHANDRA_STRONG = 10.0
    CHANDRA_BONUS = 5.0
    CHANDRA_WEAK = -12.0


# Navatara quality. The adverse *classification* (Vipat 3 / Pratyak 5 / Vadha 7)
# is practice consensus; mapping it to a number below is engine policy.
_TARA_ADVERSE = frozenset({3, 5, 7})
_TARA_NAMES: dict[int, tuple[str, str]] = {
    1: ("ஜென்மம்", "Janma"), 2: ("சம்பத்", "Sampat"), 3: ("விபத்", "Vipat"),
    4: ("க்ஷேமம்", "Kshema"), 5: ("பிரத்யரி", "Pratyari"), 6: ("சாதனை", "Sadhana"),
    7: ("நைதனம்", "Naidhana"), 8: ("மித்திரம்", "Mitra"), 9: ("பரம மித்திரம்", "Parama Mitra"),
}

# Chandra Bala by house from Janma Rasi (spec Q5). Position 8 is Chandrashtama
# and vetoes — practice consensus, and the most rigorously observed rule in
# Tamil household practice. The rest of the mapping is engine policy.
_CHANDRA_STRONG = frozenset({3, 6, 10, 11})
_CHANDRA_BONUS = frozenset({1, 7})
_CHANDRA_WEAK = frozenset({4, 12})
_CHANDRASHTAMA = 8

# Weekday names for the bilingual reason copy. Keyed by the uppercase English
# name `PanchangamSnapshot.weekday` carries, so a Latin day name never lands
# inside an otherwise-Tamil sentence.
_WEEKDAY_TA: dict[str, str] = {
    "MONDAY": "திங்கள்", "TUESDAY": "செவ்வாய்", "WEDNESDAY": "புதன்",
    "THURSDAY": "வியாழன்", "FRIDAY": "வெள்ளி", "SATURDAY": "சனி", "SUNDAY": "ஞாயிறு",
}

# Activities with a primary-text rule table. Everything else scores on the
# generic almanac layer and says so.
#
# MARRIAGE is listed separately because it is the one activity the engine still
# handles by its own branch (see the module docstring); everything else arrives
# through the registry, so this set never needs editing when a chapter is added.
_MARRIAGE = "MARRIAGE"
_SOURCED_ACTIVITIES: frozenset[str] = frozenset({_MARRIAGE}) | frozenset(ACTIVITY_RULES)
# Public alias. `muhurta_service` builds its accepted-activity list from this so
# an activity cannot be sourced by the engine and unreachable through the API —
# which is what happened while `_ACTIVITY_LORDS` doubled as the validity check.
SOURCED_ACTIVITIES: frozenset[str] = _SOURCED_ACTIVITIES


# Every `RULE_SOURCES` table whose rule_ids this engine can emit. A factor's
# `rule_id` is worthless to the product unless something can turn it back into a
# page and a passage, so the lookup lives here beside the code that emits it —
# and `tests/test_muhurta_engine.py` asserts every emitted id resolves. Add the
# activity's table here in the same change that starts citing it.
_RULE_SOURCE_TABLES: tuple[dict[str, RuleSource], ...] = (
    marriage.RULE_SOURCES,
    *RULE_SOURCE_TABLES,
)


def resolve_rule_source(rule_id: str) -> RuleSource | None:
    """The `RuleSource` behind a factor's `rule_id`, or None for an unsourced id."""
    for table in _RULE_SOURCE_TABLES:
        found = table.get(rule_id)
        if found is not None:
            return found
    return None


def _in_paksha_tithi(tithi_number: int) -> int:
    """1..30 tithi -> its 1..15 number within the paksha."""
    return tithi_number if tithi_number <= 15 else tithi_number - 15


def _ordinal(n: int) -> str:
    """English ordinal for a house number. `f"{n}th"` produces "1th"/"2th"/"3th",
    which reached the reason copy before this existed."""
    if 11 <= (n % 100) <= 13:
        return f"{n}th"
    return f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th') }"


def _star(snapshot) -> tuple[str, str]:
    """(en, ta) display names for the day's nakshatra.

    Reason copy is bilingual, so the star must be too: `nakshatra_name.title()`
    put a Latin "Aswini" inside an otherwise-Tamil sentence. Falls back to the
    title-cased raw name only if the number is somehow off the 1..27 map, which
    is a broken snapshot rather than a display choice.
    """
    fallback = str(snapshot.nakshatra_name).title()
    number = snapshot.nakshatra_number
    return (nakshatra_en(number) or fallback, nakshatra_ta(number) or fallback)


def _tithi(snapshot) -> tuple[str, str]:
    """(en, ta) display names for the day's tithi.

    The snapshot's `tithi_name` is an uppercase code, so composing prose from it
    put "CHATHURTHI" beside "Aswini" in English and a Latin word inside the
    Tamil copy. Both come from the shared display table now.
    """
    number = snapshot.tithi_number
    name_ta, name_en = tithi_display(number)
    return (name_en, name_ta)


# ── L1: generic almanac. Runs for every activity, sourced or not. ───────────

def _almanac_tithi_factor(snapshot) -> FactorResult:
    """The day's tithi judged by general almanac convention, not by any
    activity's own table. Amavasai, Rikta and the broad subha lists are mutually
    exclusive by construction (Amavasai is in-paksha 15; Rikta is 4/9/14), so
    the branches below cannot double-count."""
    tithi = snapshot.tithi_number
    in_paksha = _in_paksha_tithi(tithi)
    name_en, name_ta = _tithi(snapshot)

    if tithi == 30:
        return FactorResult(
            factor="ALMANAC_TITHI",
            verdict=Verdict.PENALTY,
            contribution=_W.ALMANAC_AMAVASAI,
            reason_en="Amavasai tithi — generally not ideal for new starts.",
            reason_ta="அமாவாசை திதி — புதிய தொடக்கத்திற்கு ஏற்றதல்ல",
        )

    if in_paksha in RIKTA_TITHIS_IN_PAKSHA:
        return FactorResult(
            factor="ALMANAC_TITHI",
            verdict=Verdict.PENALTY,
            contribution=_W.ALMANAC_RIKTA,
            reason_en=f"{name_en} is a Rikta tithi — generally avoided for auspicious starts.",
            reason_ta=f"{name_ta} திதி — சுப நிகழ்வுகளுக்கு தவிர்க்கவும்",
        )

    is_krishna = snapshot.tithi_paksha == "KRISHNA"
    if not is_krishna and in_paksha in SUBHA_TITHIS_SHUKLA:
        return FactorResult(
            factor="ALMANAC_TITHI",
            verdict=Verdict.BONUS,
            contribution=_W.ALMANAC_SUBHA_TITHI_SHUKLA,
            reason_en=f"{name_en} in the waxing fortnight — a generally favourable tithi.",
            reason_ta=f"சாதக திதி: {name_ta}",
        )
    if is_krishna and in_paksha in SUBHA_TITHIS_KRISHNA:
        return FactorResult(
            factor="ALMANAC_TITHI",
            verdict=Verdict.BONUS,
            contribution=_W.ALMANAC_SUBHA_TITHI_KRISHNA,
            reason_en=f"{name_en} in the waning fortnight — a generally favourable tithi.",
            reason_ta=f"சாதக திதி: {name_ta}",
        )

    return FactorResult(
        factor="ALMANAC_TITHI",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"{name_en} is neither a favoured nor an avoided tithi by general almanac reckoning.",
        reason_ta=f"{name_ta} திதி — பொது பஞ்சாங்கப்படி நடுநிலை",
    )


def _almanac_nakshatra_factor(snapshot) -> FactorResult:
    """The broad Thirukanitham subha-nakshatra list — activity-agnostic.

    Distinct from `_nakshatra_factor`, which is the *activity's own* sourced
    table. Both may fire on the same day and they are not the same claim: "a
    generally auspicious star" is far weaker than "Kalaprakasika names this star
    best for marriage", and collapsing them would overstate the second.
    """
    name_en, name_ta = _star(snapshot)
    if snapshot.nakshatra_number in SUBHA_NAKSHATRA_NUMBERS:
        return FactorResult(
            factor="ALMANAC_NAKSHATRA",
            verdict=Verdict.BONUS,
            contribution=_W.ALMANAC_SUBHA_NAKSHATRA,
            reason_en=f"{name_en} is on the general auspicious-star list.",
            reason_ta=f"சுப நட்சத்திரம்: {name_ta}",
        )
    return FactorResult(
        factor="ALMANAC_NAKSHATRA",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"{name_en} is not on the general auspicious-star list.",
        reason_ta=f"{name_ta} — பொது சுப நட்சத்திரப் பட்டியலில் இல்லை",
    )


def _almanac_day_quality_factor(snapshot) -> FactorResult:
    if snapshot.is_subha_muhurtham:
        return FactorResult(
            factor="ALMANAC_DAY_QUALITY",
            verdict=Verdict.BONUS,
            contribution=_W.ALMANAC_SUBHA_MUHURTHAM,
            reason_en="The almanac marks this a subha muhurtham day.",
            reason_ta="சுப முகூர்த்த நாள்",
        )
    return FactorResult(
        factor="ALMANAC_DAY_QUALITY",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en="The almanac does not mark this a subha muhurtham day.",
        reason_ta="இந்நாள் சுப முகூர்த்த நாளாகக் குறிக்கப்படவில்லை",
    )


def _almanac_yoga_factor(snapshot) -> FactorResult:
    """Names the day's yoga without judging it.

    Deliberately zero-contribution and NEUTRAL. Both former copies of L1
    appended `"Yoga: {name}"` to the *support* string unconditionally, so an
    inauspicious yoga (Vyatipata, Vaidhriti) read to the user as a reason the
    day was good. A yoga table graded for muhurta is not sourced yet, so the
    honest move is to report the yoga and score nothing on it.
    """
    number = getattr(snapshot, "yoga_number", None)
    name_en = YOGA_NAME_EN.get(number) or str(snapshot.yoga_name or "").title()
    name_ta = YOGA_NAME_TA.get(number)
    if not name_en:
        return FactorResult(
            factor="ALMANAC_YOGA",
            verdict=Verdict.NEUTRAL,
            contribution=0.0,
            reason_en="No yoga recorded for this day.",
            reason_ta="இந்நாளுக்கு யோகம் பதிவாகவில்லை",
        )
    return FactorResult(
        factor="ALMANAC_YOGA",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"Yoga is {name_en} — not graded for muhurta by any sourced table yet.",
        # Named only when the Tamil table has it. A yoga number off the 1..27
        # map means a broken snapshot, and dropping an English name into Tamil
        # prose to cover for it is worse than the unnamed sentence.
        reason_ta=(
            f"யோகம்: {name_ta} — முகூர்த்தத்திற்கான தரவரிசை இன்னும் உறுதி செய்யப்படவில்லை"
            if name_ta
            else "இந்நாளின் யோகம் முகூர்த்தத்திற்கு இன்னும் தரவரிசைப்படுத்தப்படவில்லை"
        ),
    )


def _almanac_windows_factor(snapshot) -> FactorResult:
    """Whether the day carries usable auspicious windows at all — Abhijit and
    Nalla Neram. A day with neither has nowhere good to put the event."""
    has_abhijit = snapshot.weekday != "WEDNESDAY" and not snapshot.abhijit_restricted
    has_nalla_neram = bool(snapshot.nalla_neram)
    contribution = (_W.ALMANAC_ABHIJIT if has_abhijit else 0.0) + (
        _W.ALMANAC_NALLA_NERAM if has_nalla_neram else 0.0
    )

    parts_en = []
    parts_ta = []
    if has_abhijit:
        parts_en.append("an Abhijit muhurta window")
        parts_ta.append("அபிஜித் முகூர்த்தம்")
    if has_nalla_neram:
        parts_en.append("Nalla Neram slots")
        parts_ta.append("நல்ல நேரம்")

    if not parts_en:
        return FactorResult(
            factor="ALMANAC_WINDOWS",
            verdict=Verdict.NEUTRAL,
            contribution=0.0,
            reason_en="This day carries neither an Abhijit window nor Nalla Neram slots.",
            reason_ta="இந்நாளில் அபிஜித் முகூர்த்தமும் நல்ல நேரமும் இல்லை",
        )
    return FactorResult(
        factor="ALMANAC_WINDOWS",
        verdict=Verdict.BONUS,
        contribution=contribution,
        reason_en=f"This day carries {' and '.join(parts_en)}.",
        reason_ta=f"இந்நாளில் {' மற்றும் '.join(parts_ta)} உள்ளது",
    )


# ── L2/L5: activity-specific almanac factors ────────────────────────────────

def _rules(activity: str) -> ActivityRules | None:
    """The registry entry for an activity, or None for MARRIAGE (own branch)
    and for anything with no sourced table."""
    return ACTIVITY_RULES.get(activity)


def unscored_dimensions_for(activity: str) -> tuple[str, ...]:
    """Dimensions this activity's chapter covers that the engine cannot check.

    A day that clears every scored factor has *not* cleared the chapter, and a
    surface that shows a sourced citation without saying so overstates what was
    verified. Empty for MARRIAGE and for unsourced activities — in the first
    case its gaps are recorded on `marriage_muhurta_rules.RULE_SOURCES`, in the
    second there is nothing to be silent about.
    """
    entry = _rules(activity.upper())
    return entry.unscored_dimensions if entry is not None else ()


def _unsourced(
    factor: str,
    activity: str,
    dimension_en: str,
    dimension_ta_stem: str,
    dimension_ta_noun: str,
) -> FactorResult:
    """The explicit "we have no table for this" verdict.

    Deliberately not NEUTRAL: "we checked and it is fine" and "we have nothing
    to check against" must never render the same way.

    Tamil takes the dimension name twice in two different forms, and one
    variable cannot serve both: the compound needs the adjectival stem
    (நட்சத்திரப் பட்டியல்) while the standalone subject needs the nominative
    (இந்நாளின் நட்சத்திரம்). Reusing the stem in the second slot produces
    "இந்நாளின் நட்சத்திர இச்செயலுக்கு", which is ungrammatical — the same
    case-inflection bug class this repo has hit before.
    """
    name = activity.replace("_", " ").title()
    return FactorResult(
        factor=factor,
        verdict=Verdict.UNSOURCED,
        contribution=0.0,
        reason_en=(
            f"No primary-text {dimension_en} list has been sourced for {name} yet — "
            f"this day's {dimension_en} was not judged for this activity."
        ),
        reason_ta=(
            f"{name} செயலுக்கான {dimension_ta_stem}ப் பட்டியல் இன்னும் மூல நூலிலிருந்து "
            f"உறுதி செய்யப்படவில்லை — இந்நாளின் {dimension_ta_noun} இச்செயலுக்கு "
            "மதிப்பிடப்படவில்லை."
        ),
    )


def _nakshatra_factor(snapshot, activity: str) -> FactorResult:
    if activity not in _SOURCED_ACTIVITIES:
        return _unsourced("NAKSHATRA", activity, "nakshatra", "நட்சத்திர", "நட்சத்திரம்")
    if activity != _MARRIAGE:
        return _registry_nakshatra_factor(snapshot, activity)

    number = snapshot.nakshatra_number
    name_en, name_ta = _star(snapshot)
    if number in marriage.MARRIAGE_NAKSHATRA_ALLOWED:
        return FactorResult(
            factor="NAKSHATRA",
            verdict=Verdict.BONUS,
            contribution=_W.NAKSHATRA_FAVOURED,
            reason_en=f"{name_en} is among the eleven asterisms Kalaprakasika names best for marriage.",
            reason_ta=f"கலப்பிரகாசிகை திருமணத்திற்குச் சிறந்ததெனக் கூறும் பதினொரு நட்சத்திரங்களுள் {name_ta} ஒன்று.",
            rule_id="MARRIAGE_NAKSHATRA_ALLOWED_SET",
        )
    # The text lists the eleven as "best" and does not blanket-forbid the rest,
    # so a non-listed star is a mild penalty, never a veto.
    return FactorResult(
        factor="NAKSHATRA",
        verdict=Verdict.PENALTY,
        contribution=_W.NAKSHATRA_NOT_LISTED,
        reason_en=f"{name_en} is not among the eleven asterisms named best for marriage.",
        reason_ta=f"திருமணத்திற்குச் சிறந்ததெனக் கூறப்பட்ட பதினொரு நட்சத்திரங்களுள் {name_ta} இல்லை.",
        rule_id="MARRIAGE_NAKSHATRA_ALLOWED_SET",
    )


def _registry_nakshatra_factor(snapshot, activity: str) -> FactorResult:
    """The activity's own sourced star lists, from the registry.

    Three outcomes, and the gap between the second and third is the doctrine:

    * **VETO** — the star is on a list the chapter *prohibits* with a stated
      consequence. Only Annaprasana has one (Ch. III p.34: eight stars that
      "will cause misery... one should not start any function of feeding on
      those days"). Nothing else in the sourced tables forbids a star.
    * **BONUS** — the star is on one of the activity's "best" lists. Which list
      is named, because for cattle the difference between the buy-only six and
      the buy-or-sell nine *is* the rule.
    * **PENALTY** — the star is on neither. Mild, never a veto: none of these
      chapters closes its star list, so an unlisted star is unlisted, not
      forbidden.
    """
    entry = ACTIVITY_RULES[activity]
    number = snapshot.nakshatra_number
    name_en, name_ta = _star(snapshot)

    if number in entry.prohibited_stars:
        verdict = Verdict.VETO if entry.prohibited_stars_is_veto else Verdict.PENALTY
        return FactorResult(
            factor="NAKSHATRA",
            verdict=verdict,
            # A veto removes the day; pricing it as well would double-count it
            # against a score nobody should rank on anyway.
            contribution=0.0 if verdict is Verdict.VETO else _W.NAKSHATRA_NOT_LISTED,
            reason_en=(
                f"{name_en} is among the stars Kalaprakasika expressly forbids for "
                f"{entry.label_en}."
            ),
            reason_ta=(
                f"கலப்பிரகாசிகை {entry.label_ta} தவிர்க்கச் சொல்லும் நட்சத்திரங்களுள் "
                f"{name_ta} ஒன்று."
            ),
            rule_id=entry.prohibited_stars_rule_id,
        )

    # Best tiers first: a star on both a best and a middling list takes the
    # stronger reading, and ordering the scan this way makes that explicit
    # rather than dependent on how the groups happen to be declared.
    for group in entry.star_groups:
        if group.tier != "BEST" or number not in group.stars:
            continue
        # GRAIN reaches its list through the chapter heading rather than a
        # sentence naming grain, so its copy says "the chapter's list", not
        # "the grain list". Overstating that inheritance is the one way this
        # factor could lie.
        hedge_en = (
            " — the chapter names no star list for grain specifically"
            if entry.stars_inherited_by_chapter_scope
            else ""
        )
        return FactorResult(
            factor="NAKSHATRA",
            verdict=Verdict.BONUS,
            contribution=_W.NAKSHATRA_FAVOURED,
            reason_en=f"{name_en} is {group.what_en} in Kalaprakasika{hedge_en}.",
            reason_ta=f"கலப்பிரகாசிகையில் {group.what_ta} நட்சத்திரங்களுள் {name_ta} ஒன்று.",
            rule_id=group.rule_id,
        )

    # A middling star is *named* and approved — it is not the same as a star the
    # chapter never mentions, so it scores neutral rather than taking the
    # not-listed penalty below.
    for group in entry.star_groups:
        if group.tier == "BEST" or number not in group.stars:
            continue
        return FactorResult(
            factor="NAKSHATRA",
            verdict=Verdict.NEUTRAL,
            contribution=0.0,
            reason_en=f"{name_en} is {group.what_en} in Kalaprakasika.",
            reason_ta=f"கலப்பிரகாசிகையில் {group.what_ta} நட்சத்திரங்களுள் {name_ta} ஒன்று.",
            rule_id=group.rule_id,
        )

    if not entry.star_groups:
        return _unsourced("NAKSHATRA", activity, "nakshatra", "நட்சத்திர", "நட்சத்திரம்")

    # An unlisted star is only mildly against the day — unless the chapter shut
    # the list ("the remaining asterisms should be avoided"), which turns silence
    # into exclusion. Still a penalty, not a veto: these are bare imperatives
    # with no stated consequence. See the registry's grading rule.
    if entry.stars_exhaustive:
        return FactorResult(
            factor="NAKSHATRA",
            verdict=Verdict.PENALTY,
            contribution=_W.NAKSHATRA_EXCLUDED,
            reason_en=(
                f"{name_en} is outside the stars Kalaprakasika names for {entry.label_en}, "
                "and the text closes that list — the remaining stars are to be avoided."
            ),
            reason_ta=(
                f"{entry.label_ta} கலப்பிரகாசிகை கூறும் நட்சத்திரப் பட்டியலுக்கு வெளியே "
                f"{name_ta} உள்ளது; எஞ்சியவை தவிர்க்கப்பட வேண்டும் என நூல் கூறுகிறது."
            ),
            rule_id=entry.star_groups[0].rule_id,
        )

    return FactorResult(
        factor="NAKSHATRA",
        verdict=Verdict.PENALTY,
        contribution=_W.NAKSHATRA_NOT_LISTED,
        reason_en=f"{name_en} is not among the stars named good for {entry.label_en}.",
        reason_ta=f"{entry.label_ta} உகந்ததெனக் கூறப்பட்ட நட்சத்திரங்களுள் {name_ta} இல்லை.",
        rule_id=entry.star_groups[0].rule_id,
    )


def _tithi_factor(snapshot, activity: str) -> FactorResult:
    if activity not in _SOURCED_ACTIVITIES:
        return _unsourced("TITHI", activity, "tithi", "திதி", "திதி")
    if activity != _MARRIAGE:
        return _registry_tithi_factor(snapshot, activity)

    in_paksha = _in_paksha_tithi(snapshot.tithi_number)
    is_krishna = snapshot.tithi_paksha == "KRISHNA"
    name_en, name_ta = _tithi(snapshot)
    is_best = in_paksha in marriage.MARRIAGE_TITHI_BEST
    swept = is_krishna and in_paksha in marriage.MARRIAGE_TITHI_INAUSPICIOUS_KRISHNA_AFTER_ASHTAMI

    if swept:
        # "All the Thithis after Ashtami of Krishna Paksha are inauspicious" is
        # the paksha-qualified — therefore more specific — statement, so it
        # governs the dark fortnight (RULE_PRECEDENCE: specific over general).
        # Where the unqualified best-list also matches, that is a genuine
        # ambiguity in the source and is reported, not silently resolved.
        conflict = None
        if is_best:
            conflict = (
                f"Tithi {in_paksha} appears in the best-list and in the "
                "'after Krishna Ashtami' sweep on the same page; the sweep is applied "
                "as the more specific rule, pending astrologer confirmation."
            )
        return FactorResult(
            factor="TITHI",
            verdict=Verdict.PENALTY,
            contribution=_W.TITHI_INAUSPICIOUS,
            reason_en=f"{name_en} falls after Ashtami in the waning fortnight — inauspicious for marriage.",
            reason_ta=f"தேய்பிறை அஷ்டமிக்குப் பின் வரும் {name_ta} திதி திருமணத்திற்கு உகந்ததல்ல.",
            rule_id="MARRIAGE_TITHI_ALLOWED_SET",
            conflict=conflict,
        )

    if is_best:
        return FactorResult(
            factor="TITHI",
            verdict=Verdict.BONUS,
            contribution=_W.TITHI_BEST,
            reason_en=f"{name_en} is among the seven tithis Kalaprakasika names best for marriage.",
            reason_ta=f"கலப்பிரகாசிகை திருமணத்திற்குச் சிறந்ததெனக் கூறும் ஏழு திதிகளுள் {name_ta} ஒன்று.",
            rule_id="MARRIAGE_TITHI_ALLOWED_SET",
        )

    middling = (
        in_paksha in marriage.MARRIAGE_TITHI_MIDDLING_BOTH_PAKSHA
        or (is_krishna and in_paksha in marriage.MARRIAGE_TITHI_MIDDLING_KRISHNA_ONLY)
        or (not is_krishna and in_paksha in marriage.MARRIAGE_TITHI_MIDDLING_SHUKLA_ONLY)
    )
    if middling:
        return FactorResult(
            factor="TITHI",
            verdict=Verdict.NEUTRAL,
            contribution=_W.TITHI_MIDDLING,
            reason_en=f"{name_en} is of middling influence for marriage.",
            reason_ta=f"{name_ta} திதி திருமணத்திற்கு நடுத்தரமான பலனைத் தரும்.",
            rule_id="MARRIAGE_TITHI_ALLOWED_SET",
        )

    return FactorResult(
        factor="TITHI",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"{name_en} is not named in the marriage tithi tiers.",
        reason_ta=f"{name_ta} திதி திருமணத் திதிப் பட்டியலில் குறிப்பிடப்படவில்லை.",
        rule_id="MARRIAGE_TITHI_ALLOWED_SET",
    )


def _registry_tithi_factor(snapshot, activity: str) -> FactorResult:
    """The activity's own sourced tithi rule, from the registry.

    The chapters state tithi doctrine in two opposite shapes and the difference
    survives here rather than being normalised away:

    * an **exclusion** list ("the Thithis to be avoided are…"), where everything
      not excluded is positively auspicious — naming, Annaprasana, treasure;
    * an **exhaustive inclusion** list ("…are favourable. Other Thithis are not
      to be considered") — ear-boring, the only one in the sourced doctrine.

    Whether the exclusion vetoes or merely penalises is read off the verb and
    recorded per activity in the registry: "should be totally avoided" vetoes,
    "all Thithis except X are auspicious" does not.
    """
    entry = ACTIVITY_RULES[activity]
    tithi = snapshot.tithi_number
    in_paksha = _in_paksha_tithi(tithi)
    is_krishna = snapshot.tithi_paksha == "KRISHNA"
    name_en, name_ta = _tithi(snapshot)

    has_rule = bool(entry.tithi_best or entry.tithi_avoid or entry.tithi_avoid_amavasya)
    if not has_rule:
        return _unsourced("TITHI", activity, "tithi", "திதி", "திதி")

    is_amavasya = tithi == 30
    # Purnima is in-paksha 15 of the bright fortnight; Amavasya is in-paksha 15
    # of the dark one. Checking `is_krishna` keeps the two apart, which matters
    # because Annaprasana bans neither and naming bans both.
    is_purnima = in_paksha == 15 and not is_krishna

    banned = (
        in_paksha in entry.tithi_avoid
        or (is_purnima and entry.tithi_avoid_purnima)
        or (is_amavasya and entry.tithi_avoid_amavasya)
        or (entry.tithi_exhaustive and in_paksha not in entry.tithi_best)
    )
    if banned:
        verdict = Verdict.VETO if entry.tithi_avoid_is_veto else Verdict.PENALTY
        if entry.tithi_exhaustive:
            reason_en = (
                f"{name_en} is outside the nine tithis Kalaprakasika lists for {entry.label_en}, "
                "and the text closes that list — other tithis are not to be considered."
            )
            reason_ta = (
                f"{entry.label_ta} கலப்பிரகாசிகை கூறும் திதிப் பட்டியலுக்கு வெளியே "
                f"{name_ta} உள்ளது; பிற திதிகள் கணக்கில் கொள்ளப்படக் கூடாது என நூல் கூறுகிறது."
            )
        else:
            reason_en = f"{name_en} is among the tithis Kalaprakasika says to avoid for {entry.label_en}."
            reason_ta = f"கலப்பிரகாசிகை {entry.label_ta} தவிர்க்கச் சொல்லும் திதிகளுள் {name_ta} ஒன்று."
        return FactorResult(
            factor="TITHI",
            verdict=verdict,
            contribution=0.0 if verdict is Verdict.VETO else _W.TITHI_INAUSPICIOUS,
            reason_en=reason_en,
            reason_ta=reason_ta,
            rule_id=entry.tithi_rule_id,
        )

    if in_paksha in entry.tithi_best:
        return FactorResult(
            factor="TITHI",
            verdict=Verdict.BONUS,
            contribution=_W.TITHI_BEST,
            reason_en=f"{name_en} is among the tithis Kalaprakasika names favourable for {entry.label_en}.",
            reason_ta=f"கலப்பிரகாசிகை {entry.label_ta} உகந்ததெனக் கூறும் திதிகளுள் {name_ta} ஒன்று.",
            rule_id=entry.tithi_rule_id,
        )

    if entry.tithi_remainder_auspicious:
        # "All Thithis except X are auspicious" makes the remainder positively
        # good — a weaker claim than being named best, so it earns less.
        return FactorResult(
            factor="TITHI",
            verdict=Verdict.BONUS,
            contribution=_W.TITHI_BEST / 2,
            reason_en=(
                f"{name_en} is not among the tithis excluded for {entry.label_en}, and the text "
                "calls every other tithi auspicious."
            ),
            reason_ta=(
                f"{entry.label_ta} விலக்கப்பட்ட திதிகளுள் {name_ta} இல்லை; "
                "மற்ற அனைத்து திதிகளும் உகந்தவை என நூல் கூறுகிறது."
            ),
            rule_id=entry.tithi_rule_id,
        )

    return FactorResult(
        factor="TITHI",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"{name_en} is not named either way in the {entry.label_en} tithi rule.",
        reason_ta=f"{entry.label_ta} உரிய திதி விதியில் {name_ta} குறிப்பிடப்படவில்லை.",
        rule_id=entry.tithi_rule_id,
    )


def _karana_factor(snapshot, activity: str) -> FactorResult | None:
    """Judge cited karana exclusions without pretending a day has one karana.

    A snapshot carries its active karana and the next one only. The source says
    to avoid the karana at the elected moment, so the rule is VETO-class there.
    At date-ranking scope, one prohibited side of the supplied transition is a
    penalty: it identifies a period that needs time-level exclusion without
    discarding the rest of the date. Only two adjacent prohibited karanas veto
    the day. This is intentionally conservative and does not certify later
    unrepresented transitions; window selection needs a full karana schedule.
    """
    entry = _rules(activity)
    if entry is None or not entry.karana_avoid:
        return None

    current = snapshot.karana_name
    following = snapshot.karana_next_name
    current_avoided = current in entry.karana_avoid
    next_avoided = following in entry.karana_avoid
    if not current_avoided and not next_avoided:
        return FactorResult(
            factor="KARANA", verdict=Verdict.NEUTRAL, contribution=0.0,
            reason_en="Neither of the snapshot's supplied karanas is excluded for this activity.",
            reason_ta="பஞ்சாங்கத்தில் வழங்கப்பட்ட இரு கரணங்களிலும் இந்தச் செயலுக்குத் தவிர்க்கப்பட்ட கரணம் இல்லை.",
            rule_id=entry.karana_rule_id,
        )

    current_en = current.replace("_", " ").title()
    next_en = following.replace("_", " ").title() if following else "the next karana"
    current_ta = "இந்தக் கரணம்"
    next_ta = "அடுத்த கரணம்"
    if current_avoided and next_avoided:
        return FactorResult(
            factor="KARANA", verdict=Verdict.VETO, contribution=0.0,
            reason_en=(f"{current_en} and the following {next_en} are both excluded for "
                       f"{entry.label_en}."),
            reason_ta=(f"{current_ta} மற்றும் அடுத்த {next_ta} இரண்டும் "
                       f"{entry.label_ta} தவிர்க்கப்பட வேண்டிய கரணங்கள்."),
            rule_id=entry.karana_rule_id,
        )
    avoided_en = current_en if current_avoided else next_en
    avoided_ta = current_ta if current_avoided else next_ta
    return FactorResult(
        factor="KARANA", verdict=Verdict.PENALTY, contribution=_W.KARANA_TRANSITION,
        reason_en=(f"{avoided_en} is excluded for {entry.label_en} in one side of the "
                   "snapshot's karana transition; choose a verified time outside it."),
        reason_ta=(f"{avoided_ta} இந்தக் கரண மாற்றத்தின் ஒரு பகுதியில் {entry.label_ta} "
                   "தவிர்க்கப்பட வேண்டியது; அதற்கு வெளியிலான சரிபார்க்கப்பட்ட நேரத்தைத் தேர்க."),
        rule_id=entry.karana_rule_id,
    )


def _vara_factor(snapshot, activity: str) -> FactorResult | None:
    """The day of the week, where the activity's chapter rules on it.

    Returns None rather than an UNSOURCED factor when no weekday rule exists,
    because — unlike nakshatra and tithi — a missing weekday table is not a gap
    a reader would expect to be filled. MARRIAGE returns None too: Ch. XIV's
    weekday guidance was not part of the Ch. XIV extraction, and inventing one
    here would be exactly the drive-by doctrine this module forbids.

    An activity's explicitly avoided weekday is a categorical date veto. This
    remains activity-specific: some sources name Saturday favourable, so no
    global Saturday rule exists.
    """
    entry = _rules(activity)
    if entry is None or not (entry.vara_good or entry.vara_avoid):
        return None

    weekday = str(snapshot.weekday).upper()
    day_en = weekday.title()
    day_ta = _WEEKDAY_TA.get(weekday, day_en)

    if weekday in entry.vara_avoid:
        return FactorResult(
            factor="VARA",
            verdict=Verdict.VETO if entry.vara_avoid_is_veto else Verdict.PENALTY,
            contribution=0.0 if entry.vara_avoid_is_veto else _W.VARA_AVOID,
            reason_en=f"{day_en} is a day Kalaprakasika says to avoid for {entry.label_en}.",
            reason_ta=f"கலப்பிரகாசிகை {entry.label_ta} தவிர்க்கச் சொல்லும் நாள் {day_ta}.",
            rule_id=entry.vara_rule_id,
        )
    if weekday in entry.vara_good:
        # Where the chapter attaches a condition the snapshot cannot check, the
        # weekday is still credited but the sentence says what was not verified.
        # A half-met rule that reads as met is worse than no rule.
        extra_en = f" ({entry.vara_unmet_condition_en})" if entry.vara_unmet_condition_en else ""
        extra_ta = f" ({entry.vara_unmet_condition_ta})" if entry.vara_unmet_condition_ta else ""
        return FactorResult(
            factor="VARA",
            verdict=Verdict.BONUS,
            contribution=_W.VARA_GOOD,
            reason_en=f"{day_en} is named good for {entry.label_en}{extra_en}.",
            reason_ta=f"{entry.label_ta} உகந்த நாளெனக் கூறப்பட்டது {day_ta}{extra_ta}.",
            rule_id=entry.vara_rule_id,
        )
    return FactorResult(
        factor="VARA",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"{day_en} is named neither good nor adverse for {entry.label_en}.",
        reason_ta=f"{entry.label_ta} {day_ta} உகந்ததெனவோ தவிர்க்க வேண்டியதெனவோ கூறப்படவில்லை.",
        rule_id=entry.vara_rule_id,
    )


def _lagna_sign_factor(snapshot, activity: str) -> FactorResult | None:
    """Sunrise lagna only. A full-day lagna schedule (A3) does not exist yet, so
    this judges the day's rising sign, not the rising sign at the candidate
    minute — the reason text says so rather than implying a precision we lack."""
    if activity not in _SOURCED_ACTIVITIES:
        return None
    if activity != _MARRIAGE:
        return _registry_lagna_sign_factor(snapshot, activity)

    rasi = snapshot.lagna_rasi_number
    fallback = str(snapshot.lagna_rasi_name)
    name_en = rasi_en(rasi) or fallback
    name_ta = rasi_ta(rasi) or fallback
    if rasi in marriage.MARRIAGE_LAGNA_BEST:
        return FactorResult(
            factor="LAGNA_SIGN_AT_SUNRISE",
            verdict=Verdict.BONUS,
            contribution=_W.LAGNA_BEST,
            reason_en=f"{name_en} rises at sunrise — among the best marriage lagnas.",
            reason_ta=f"சூரிய உதயத்தில் {name_ta} லக்னம் — திருமணத்திற்குச் சிறந்த லக்னங்களுள் ஒன்று.",
            rule_id="MARRIAGE_LAGNA_SIGN_PREFERENCE",
        )
    if rasi in marriage.MARRIAGE_LAGNA_AVOID:
        return FactorResult(
            factor="LAGNA_SIGN_AT_SUNRISE",
            verdict=Verdict.PENALTY,
            contribution=_W.LAGNA_AVOID,
            reason_en=f"{name_en} rises at sunrise — a marriage lagna the text says to avoid.",
            reason_ta=f"சூரிய உதயத்தில் {name_ta} லக்னம் — திருமணத்தில் தவிர்க்கச் சொல்லப்பட்ட லக்னம்.",
            rule_id="MARRIAGE_LAGNA_SIGN_PREFERENCE",
        )
    return FactorResult(
        factor="LAGNA_SIGN_AT_SUNRISE",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"{name_en} rises at sunrise — middling influence for marriage.",
        reason_ta=f"சூரிய உதயத்தில் {name_ta} லக்னம் — திருமணத்திற்கு நடுத்தரமான பலன்.",
        rule_id="MARRIAGE_LAGNA_SIGN_PREFERENCE",
    )


def lagna_sign_factor_at_window(activity: str, rasi: int) -> FactorResult | None:
    """Apply a sourced lagna-sign rule to the selected window's actual lagna.

    The all-day engine deliberately does not call this: the expensive lagna
    schedule is calculated only after the picker has shortlisted its dates.
    """
    entry = _rules(activity)
    if activity == _MARRIAGE:
        best, middling, avoid = marriage.MARRIAGE_LAGNA_BEST, frozenset(), marriage.MARRIAGE_LAGNA_AVOID
        rule_id = "MARRIAGE_LAGNA_SIGN_PREFERENCE"
        label_en, label_ta = "marriage", "திருமணம்"
    elif entry is not None:
        best, middling, avoid = entry.lagna_best, entry.lagna_middling, entry.lagna_avoid
        rule_id = entry.lagna_rule_id
        label_en, label_ta = entry.label_en, entry.label_ta
    else:
        return None
    if not (best or middling or avoid):
        return None

    name_en = rasi_en(rasi) or str(rasi)
    name_ta = rasi_ta(rasi) or str(rasi)
    if rasi in avoid:
        verdict, contribution = Verdict.PENALTY, _W.LAGNA_AVOID
        reason_en = f"{name_en} rises during the selected window — a sign the text says to avoid for {label_en}."
        reason_ta = f"தேர்ந்தெடுத்த நேரத்தில் {name_ta} லக்னம் — {label_ta} தவிர்க்கச் சொல்லப்பட்ட ராசி."
    elif rasi in best:
        verdict, contribution = Verdict.BONUS, _W.LAGNA_BEST
        reason_en = f"{name_en} rises during the selected window — among the signs named best for {label_en}."
        reason_ta = f"தேர்ந்தெடுத்த நேரத்தில் {name_ta} லக்னம் — {label_ta} சிறந்ததெனக் கூறப்பட்ட ராசிகளுள் ஒன்று."
    elif rasi in middling:
        verdict, contribution = Verdict.NEUTRAL, 0.0
        reason_en = f"{name_en} rises during the selected window — of middling quality for {label_en}."
        reason_ta = f"தேர்ந்தெடுத்த நேரத்தில் {name_ta} லக்னம் — {label_ta} நடுத்தரமான பலன்."
    else:
        verdict, contribution = Verdict.NEUTRAL, 0.0
        reason_en = f"{name_en} rises during the selected window — the text names it neither way for {label_en}."
        reason_ta = f"தேர்ந்தெடுத்த நேரத்தில் {name_ta} லக்னம் — {label_ta} நூல் இதைக் குறிப்பிடவில்லை."
    return FactorResult(
        factor="LAGNA_SIGN_AT_WINDOW",
        verdict=verdict,
        contribution=contribution,
        reason_en=reason_en,
        reason_ta=reason_ta,
        rule_id=rule_id,
    )


_WEALTH_HEURISTIC_ACTIVITIES = frozenset({
    "TREASURE_STORE",
    "GOLD",
    "GEMS",
    "LAND_PURCHASE",
    "LAND_POSSESSION",
    "NEW_ORNAMENT",
})
_NATURAL_BENEFICS = frozenset({"JUPITER", "VENUS", "MERCURY"})
_NATURAL_MALEFICS = frozenset({"SUN", "MARS", "SATURN", "RAHU", "KETU"})


def wealth_house_heuristic_factor(
    activity: str,
    lagna_rasi: int,
    bodies: dict[str, EphemerisBody],
) -> FactorResult | None:
    """Return the owner-approved, explicitly unsourced wealth-house bonus.

    This deliberately evaluates only the agreed condition: an unafflicted
    natural benefic in the 2nd or 11th from the *selected-window* lagna, with
    no natural malefic in the 2nd. Sign dignity and aspect are not inferred.
    The caller supplies planets at the recommended-window midpoint, preserving
    this engine's no-ephemeris-call contract.
    """
    if activity not in _WEALTH_HEURISTIC_ACTIVITIES or not 1 <= lagna_rasi <= 12:
        return None

    second_rasi = (lagna_rasi % 12) + 1
    eleventh_rasi = ((lagna_rasi + 9) % 12) + 1
    sun = bodies.get("SUN")
    if sun is None:
        return None

    # The approved condition requires the second house to be free of a natural
    # malefic even if a qualifying benefic is found in the eleventh.
    if any(body is not None and body.rasi == second_rasi for name in _NATURAL_MALEFICS if (body := bodies.get(name))):
        return None

    for benefic_name in _NATURAL_BENEFICS:
        benefic = bodies.get(benefic_name)
        if benefic is None or benefic.rasi not in {second_rasi, eleventh_rasi}:
            continue
        combust = is_combust(
            benefic_name,
            benefic.absolute_longitude,
            sun.absolute_longitude,
            benefic.is_retrograde,
        ) and not is_cazimi(benefic_name, benefic.absolute_longitude, sun.absolute_longitude)
        if combust:
            continue
        if any(
            body is not None and body.rasi == benefic.rasi
            for name in _NATURAL_MALEFICS
            if (body := bodies.get(name))
        ):
            continue
        return FactorResult(
            factor="WEALTH_HOUSE_HEURISTIC",
            verdict=Verdict.BONUS,
            contribution=_W.WEALTH_HOUSE_HEURISTIC,
            reason_en=(
                "An unafflicted natural benefic occupies the 2nd or 11th from the selected lagna, "
                "supporting this wealth purchase. This is a product heuristic, not a Kalaprakasika rule."
            ),
            reason_ta=(
                "தேர்ந்தெடுத்த லக்னத்திலிருந்து 2 அல்லது 11ஆம் வீட்டில் பாதிப்பில்லாத சுபகிரகம் உள்ளது — "
                "இந்தச் செல்வக் கொள்முதலுக்கு ஆதரவு. இது கலப்பிரகாசிகை விதியல்ல; செயலி வழிகாட்டல்."
            ),
        )
    return None


def _registry_lagna_sign_factor(snapshot, activity: str) -> FactorResult | None:
    """The activity's own sourced lagna-sign preference.

    Graded PENALTY rather than VETO for the avoid set, following the precedent
    `MARRIAGE_LAGNA_SIGN_PREFERENCE` already set: "should be avoided" is a
    strong penalty, not automatically a hard veto.

    Signs the chapter approves *conditionally* (Namakarana's common signs, good
    only "when occupied by a benefic") score NEUTRAL with the condition spelled
    out. Crediting them would claim a benefic placement nobody computed.
    """
    entry = _rules(activity)
    if entry is None or not (entry.lagna_best or entry.lagna_avoid or entry.lagna_conditional):
        return None

    rasi = snapshot.lagna_rasi_number
    fallback = str(snapshot.lagna_rasi_name)
    name_en = rasi_en(rasi) or fallback
    name_ta = rasi_ta(rasi) or fallback

    if rasi in entry.lagna_avoid:
        return FactorResult(
            factor="LAGNA_SIGN_AT_SUNRISE",
            verdict=Verdict.PENALTY,
            contribution=_W.LAGNA_AVOID,
            reason_en=f"{name_en} rises at sunrise — a sign the text says to avoid for {entry.label_en}.",
            reason_ta=f"சூரிய உதயத்தில் {name_ta} லக்னம் — {entry.label_ta} தவிர்க்கச் சொல்லப்பட்ட ராசி.",
            rule_id=entry.lagna_rule_id,
        )
    if rasi in entry.lagna_best:
        return FactorResult(
            factor="LAGNA_SIGN_AT_SUNRISE",
            verdict=Verdict.BONUS,
            contribution=_W.LAGNA_BEST,
            reason_en=f"{name_en} rises at sunrise — among the signs named best for {entry.label_en}.",
            reason_ta=f"சூரிய உதயத்தில் {name_ta} லக்னம் — {entry.label_ta} சிறந்ததெனக் கூறப்பட்ட ராசிகளுள் ஒன்று.",
            rule_id=entry.lagna_rule_id,
        )
    if rasi in entry.lagna_conditional:
        return FactorResult(
            factor="LAGNA_SIGN_AT_SUNRISE",
            verdict=Verdict.NEUTRAL,
            contribution=0.0,
            reason_en=(
                f"{name_en} rises at sunrise — {entry.lagna_conditional_en or 'approved only conditionally'}."
            ),
            reason_ta=(
                f"சூரிய உதயத்தில் {name_ta} லக்னம் — "
                f"{entry.lagna_conditional_ta or 'நிபந்தனையுடன் மட்டுமே ஏற்கப்படும்'}."
            ),
            rule_id=entry.lagna_rule_id,
        )
    if rasi in entry.lagna_middling:
        return FactorResult(
            factor="LAGNA_SIGN_AT_SUNRISE",
            verdict=Verdict.NEUTRAL,
            contribution=0.0,
            reason_en=f"{name_en} rises at sunrise — of middling quality for {entry.label_en}.",
            reason_ta=f"சூரிய உதயத்தில் {name_ta} லக்னம் — {entry.label_ta} நடுத்தரமான பலன்.",
            rule_id=entry.lagna_rule_id,
        )
    return FactorResult(
        factor="LAGNA_SIGN_AT_SUNRISE",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"{name_en} rises at sunrise — the text names it neither way for {entry.label_en}.",
        reason_ta=f"சூரிய உதயத்தில் {name_ta} லக்னம் — {entry.label_ta} நூல் இதைக் குறிப்பிடவில்லை.",
        rule_id=entry.lagna_rule_id,
    )


# ── L3/L4: personal layer. Only runs when a subject is supplied. ────────────

def _janma_nakshatra_factor(snapshot, activity: str, subject: Subject) -> FactorResult | None:
    """Activities whose chapter forbids the subject's own birth star.

    Only Annaprasana states one (Ch. III p.34: "The child should not be fed for
    the first time on a day ruled by its asterism at birth, for this will
    shorten its life"). Personal-layer by nature — it needs a birth star — so it
    is absent from general mode, which is the definition of that mode.

    The reason copy names *whose* star was used. The picker's subject is the
    chart owner's, which is exact when the chart is the child's and wrong when a
    parent runs it against their own chart; saying which star was compared is
    the difference between a checkable claim and a misleading one.
    """
    entry = _rules(activity)
    if entry is None or not entry.janma_nakshatra_prohibited:
        return None
    if snapshot.nakshatra_number != subject.janma_nakshatra:
        return None

    # The fallback is bilingual, not one English string reused in both. The
    # picker builds its `Subject` without a label, so the unlabelled path is the
    # *production* path — a shared `or "this chart"` would put a Latin phrase
    # inside the Tamil sentence on every real result, not just in a rare corner.
    # A supplied label is a personal name and is printed as given in both.
    who_en = subject.label or "this chart"
    who_ta = f"{subject.label} " if subject.label else ""
    star_en, star_ta = _star(snapshot)
    return FactorResult(
        factor="JANMA_NAKSHATRA",
        verdict=Verdict.VETO,
        contribution=0.0,
        reason_en=(
            f"{star_en} is {who_en}'s own birth star, and Kalaprakasika forbids "
            f"{entry.label_en} on the birth star."
        ),
        reason_ta=(
            f"{star_ta} {who_ta}ஜென்ம நட்சத்திரம்; ஜென்ம நட்சத்திர நாளில் "
            f"{entry.label_ta} கூடாது என கலப்பிரகாசிகை கூறுகிறது."
        ),
        rule_id=entry.janma_nakshatra_rule_id,
    )


def _janma_tara_count_factor(snapshot, activity: str, subject: Subject) -> FactorResult | None:
    """Counts from the subject's birth star that the chapter shuts out.

    The book's most-repeated personal rule: six chapters name a set of counts
    from the native's own Jenma-Nakshathra and forbid days ruled by them. The
    recurring core is janma / 10th / 19th, which Ch. XVI p.92 names outright as
    Jenma, **Anu-Jenma** and **Thri-Jenma** — and that naming is what decodes the
    same two ordinals where the scan garbles them (see the registry).

    Graded VETO. Unlike the weekday and lagna imperatives this module downgrades
    to penalties, these passages state a consequence or use the strongest verbs
    the book has — "should be strictly avoided" (Ch. XVI p.92), "No manner of
    celebration should be held" (Ch. VII p.50). It is also a *personal* rule, so
    it can only ever remove days for one subject, never for everybody, and it is
    absent from general mode by construction.

    Counting is inclusive of both ends, the convention `tara_number` already
    uses: the birth star itself is 1.
    """
    entry = _rules(activity)
    if entry is None or not entry.janma_tara_prohibited:
        return None
    count = ((snapshot.nakshatra_number - subject.janma_nakshatra) % 27) + 1
    if count not in entry.janma_tara_prohibited:
        return None

    who_en = subject.label or "this chart"
    who_ta = f"{subject.label} " if subject.label else ""
    star_en, star_ta = _star(snapshot)
    # The book names only the janma/10th/19th triad. Anything else is printed as
    # a bare ordinal rather than given an invented name.
    named = {1: ("Jenma", "ஜென்ம"), 10: ("Anu-Jenma", "அனுஜென்ம"), 19: ("Thri-Jenma", "த்ரிஜென்ம")}
    if count in named:
        label_en, label_ta = named[count]
        which_en = f"{label_en}, the {_ordinal(count)} star from"
        which_ta = f"{label_ta} நட்சத்திரம் ({count}வது)"
    else:
        which_en = f"the {_ordinal(count)} star from"
        which_ta = f"{count}வது நட்சத்திரம்"
    return FactorResult(
        factor="JANMA_TARA_COUNT",
        verdict=Verdict.VETO,
        contribution=0.0,
        reason_en=(
            f"{star_en} is {which_en} {who_en}'s birth star, which Kalaprakasika "
            f"shuts out for {entry.label_en}."
        ),
        reason_ta=(
            f"{star_ta} — {who_ta}ஜென்ம நட்சத்திரத்திலிருந்து {which_ta}; "
            f"{entry.label_ta} இந்நாள் கூடாது என கலப்பிரகாசிகை கூறுகிறது."
        ),
        rule_id=entry.janma_tara_rule_id,
    )


def _paksha_factor(snapshot, activity: str) -> FactorResult | None:
    """The fortnight itself, where a chapter rules on it.

    Ch. V p.37 is the clearest: "The bright fortnight bestows longevity; the dark
    fortnight tells upon life and fortune." Most chapters say nothing about the
    paksha and this factor stays silent for them.

    Two chapters then carve an exception out of the disfavoured half — Ch. V p.38
    and Ch. VII p.44 both call the first five tithis of the dark fortnight
    beneficent — so an exempt day scores neutral rather than taking the penalty.
    """
    entry = _rules(activity)
    if entry is None or entry.paksha_preferred is None:
        return None

    paksha = snapshot.tithi_paksha
    if paksha == entry.paksha_preferred:
        return FactorResult(
            factor="PAKSHA", verdict=Verdict.BONUS, contribution=_W.PAKSHA_PREFERRED,
            reason_en=f"The waxing fortnight is the half Kalaprakasika favours for {entry.label_en}.",
            reason_ta=f"{entry.label_ta} கலப்பிரகாசிகை உகந்ததெனக் கூறும் வளர்பிறைப் பக்கம்.",
            rule_id=entry.paksha_rule_id,
        )
    if _in_paksha_tithi(snapshot.tithi_number) in entry.paksha_exempt_in_paksha:
        return FactorResult(
            factor="PAKSHA", verdict=Verdict.NEUTRAL, contribution=0.0,
            reason_en=(
                "The waning fortnight is the disfavoured half, but the text calls its "
                "opening tithis beneficent and this day is among them."
            ),
            reason_ta=(
                "தேய்பிறை உகந்ததல்ல; எனினும் அதன் முதல் திதிகள் நல்லவை என நூல் கூறுகிறது — "
                "இந்நாள் அவற்றுள் ஒன்று."
            ),
            rule_id=entry.paksha_rule_id,
        )
    return FactorResult(
        factor="PAKSHA", verdict=Verdict.PENALTY, contribution=_W.PAKSHA_AGAINST,
        reason_en=f"The waning fortnight is the half Kalaprakasika counts against {entry.label_en}.",
        reason_ta=f"{entry.label_ta} கலப்பிரகாசிகை உகந்ததல்ல எனக் கூறும் தேய்பிறைப் பக்கம்.",
        rule_id=entry.paksha_rule_id,
    )


def _chandra_bala_factor(snapshot, subject: Subject) -> FactorResult:
    house = chandra_bala(subject.janma_rasi, snapshot.chandrashtamam_moon_rasi_number)
    who_en = subject.label or "this person"
    who_ta = f"{subject.label} " if subject.label else ""

    if house == _CHANDRASHTAMA:
        return FactorResult(
            factor="CHANDRA_BALA",
            verdict=Verdict.VETO,
            contribution=0.0,
            reason_en=f"Moon is 8th from {who_en}'s birth sign — Chandrashtama, which no other strength offsets.",
            reason_ta=f"{who_ta}ஜென்ம ராசிக்கு 8ல் சந்திரன் — சந்திராஷ்டமம், வேறு எந்த பலமும் இதை ஈடுசெய்யாது.",
        )
    nth = _ordinal(house)
    if house in _CHANDRA_WEAK:
        return FactorResult(
            factor="CHANDRA_BALA",
            verdict=Verdict.PENALTY,
            contribution=_W.CHANDRA_WEAK,
            reason_en=f"Moon is {nth} from {who_en}'s birth sign — a weak position.",
            reason_ta=f"{who_ta}ஜென்ம ராசிக்கு {house}ல் சந்திரன் — பலவீனமான நிலை.",
        )
    if house in _CHANDRA_STRONG:
        return FactorResult(
            factor="CHANDRA_BALA",
            verdict=Verdict.BONUS,
            contribution=_W.CHANDRA_STRONG,
            reason_en=f"Moon is {nth} from {who_en}'s birth sign — a strong position.",
            reason_ta=f"{who_ta}ஜென்ம ராசிக்கு {house}ல் சந்திரன் — வலிமையான நிலை.",
        )
    if house in _CHANDRA_BONUS:
        return FactorResult(
            factor="CHANDRA_BALA",
            verdict=Verdict.BONUS,
            contribution=_W.CHANDRA_BONUS,
            reason_en=f"Moon is {nth} from {who_en}'s birth sign — favourable.",
            reason_ta=f"{who_ta}ஜென்ம ராசிக்கு {house}ல் சந்திரன் — சாதகமானது.",
        )
    return FactorResult(
        factor="CHANDRA_BALA",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"Moon is {nth} from {who_en}'s birth sign — neutral.",
        reason_ta=f"{who_ta}ஜென்ம ராசிக்கு {house}ல் சந்திரன் — நடுநிலை.",
    )


def _tara_bala_factor(snapshot, subject: Subject) -> FactorResult:
    tara = tara_number(subject.janma_nakshatra, snapshot.nakshatra_number)
    tara_ta, tara_en = _TARA_NAMES[tara]
    who_en = subject.label or "this person"
    who_ta = f"{subject.label} " if subject.label else ""
    star_en, star_ta = _star(snapshot)

    if tara in _TARA_ADVERSE:
        return FactorResult(
            factor="TARA_BALA",
            verdict=Verdict.PENALTY,
            contribution=float(TARA_SCORE[tara]),
            reason_en=f"{star_en} is {tara_en} tara from {who_en}'s birth star — an adverse count.",
            reason_ta=f"{who_ta}ஜென்ம நட்சத்திரத்திலிருந்து {star_ta} {tara_ta} தாரா — உகந்ததல்ல.",
        )
    if tara == 1:
        return FactorResult(
            factor="TARA_BALA",
            verdict=Verdict.BONUS,
            contribution=float(TARA_SCORE[tara]),
            reason_en=f"{star_en} is {who_en}'s own birth star — Janma tara.",
            reason_ta=f"{star_ta} {who_ta}சொந்த நட்சத்திரம் — ஜென்ம தாரா.",
        )
    return FactorResult(
        factor="TARA_BALA",
        verdict=Verdict.BONUS,
        contribution=float(TARA_SCORE[tara]),
        reason_en=f"{star_en} is {tara_en} tara from {who_en}'s birth star — favourable.",
        reason_ta=f"{who_ta}ஜென்ம நட்சத்திரத்திலிருந்து {star_ta} {tara_ta} தாரா — சாதகமானது.",
    )


# ── the entry point ─────────────────────────────────────────────────────────

def score_day(
    snapshot,
    activity: str,
    subject: Subject | None = None,
    *,
    include_lagna_sign: bool = True,
) -> DayScore:
    """Score one day for one activity, optionally for one person.

    `subject=None` is general mode: the personal factors are not computed, not
    scored, and not mentioned. A general result can never be vetoed by a
    personal factor — that is the definition of the mode.

    The returned score is **not clamped**. Callers add their own layers on top
    (`muhurta_service` adds a dasha and a hora bonus) and clamping here would
    silently eat those before they were applied; clamp at the point of display
    instead.
    """
    activity = activity.upper()
    factors: list[FactorResult] = [
        # L1 — always, for every activity.
        _almanac_tithi_factor(snapshot),
        _almanac_nakshatra_factor(snapshot),
        _almanac_day_quality_factor(snapshot),
        _almanac_yoga_factor(snapshot),
        _almanac_windows_factor(snapshot),
        # L2 — the activity's own sourced table, or an explicit UNSOURCED gap.
        _nakshatra_factor(snapshot, activity),
        _tithi_factor(snapshot, activity),
    ]
    # Optional L2 factors: absent when the activity's chapter rules on neither.
    # A missing weekday or lagna table is not the same gap as a missing star
    # table, so these stay silent rather than emitting UNSOURCED noise on every
    # activity that happens not to have one.
    for optional in (
        _karana_factor(snapshot, activity),
        _vara_factor(snapshot, activity),
        _paksha_factor(snapshot, activity),
    ):
        if optional is not None:
            factors.append(optional)
    if include_lagna_sign:
        lagna_factor = _lagna_sign_factor(snapshot, activity)
        if lagna_factor is not None:
            factors.append(lagna_factor)

    if subject is not None:
        factors.append(_chandra_bala_factor(snapshot, subject))
        factors.append(_tara_bala_factor(snapshot, subject))
        for personal in (
            _janma_nakshatra_factor(snapshot, activity, subject),
            _janma_tara_count_factor(snapshot, activity, subject),
        ):
            if personal is not None:
                factors.append(personal)

    vetoed = any(f.verdict is Verdict.VETO for f in factors)
    # A vetoed day keeps its factor list — the UI needs to name what killed it —
    # but its score is not a number anyone should rank on.
    return DayScore(
        score=_W.BASE + sum(f.contribution for f in factors),
        vetoed=vetoed,
        factors=tuple(factors),
    )


# ── the display mapping ─────────────────────────────────────────────────────
#
# `score_day` is unclamped by design (see its docstring). Every surface that
# shows a number to a human must therefore map it into 0–100 first, and every
# such surface must use *this* function: a plain `min(100, raw)` collapses the
# whole top of the range into an identical "100" and destroys the ranking the
# picker exists to communicate. Measured over a 90-day Chennai sweep of all
# sourced activities (n = 3244 usable day-scores): min −9, p50 80, p95 130,
# max 161, with 29.3% of scores at or above 100.

_DISPLAY_KNEE = 80.0
"""Raw score below which the scale already behaves; identity is applied there.

Chosen so that every value below it stays byte-identical to what shipped
before this mapping existed, which is what lets `SCORE_COLOR` (75/55) and the
shared `scoreTone` (65/45) keep their exact current meaning on every surface.
"""

_DISPLAY_CEIL = 180.0
"""Raw score that maps to a displayed 100.

Deliberately a *fixed* constant comfortably above the observed maximum of 161,
never a value derived from the observed distribution: a data-derived ceiling
would drift every time a weight or a rule table changed, silently moving every
displayed number. That drift is exactly why linear rescaling was rejected.
"""


def display_score(raw: float) -> float:
    """Map an unclamped `score_day` result onto a 0–100 display scale.

    Identity on ``[0, KNEE]``, then piecewise-linear compression of
    ``[KNEE, CEIL]`` into ``[KNEE, 100]``, saturating above ``CEIL``. The
    mapping is strictly monotonic below the ceiling, so it never reorders two
    days and never invents a tie between two different raw scores — it only
    stops the top of the range from flattening into a single value.

    Callers should round to one decimal, not to an integer: at integer
    precision the compressed band recovers only 66 of 110 distinct top-five
    values across the sourced activities, against 93 of 110 at one decimal.
    """
    if raw <= 0.0:
        return 0.0
    if raw <= _DISPLAY_KNEE:
        return raw
    if raw >= _DISPLAY_CEIL:
        return 100.0
    return _DISPLAY_KNEE + (raw - _DISPLAY_KNEE) * (100.0 - _DISPLAY_KNEE) / (
        _DISPLAY_CEIL - _DISPLAY_KNEE
    )
