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
  explicit UNSOURCED verdict naming the gap. Today only MARRIAGE has a
  primary-text table (Kalaprakasika Ch. XIV); gold, land and business are still
  waiting on Ch. XXI and must not pretend otherwise.

**Provenance of the numbers.** Every weight in `_W` is `ENGINE_POLICY` —
Vinaadi's product decision, not sastra. The classical texts rank factors
(best / middling / avoid) without assigning arithmetic. Do not present these
values to users as traditional, and do not tune them by fitting to a result we
already like; they change only with a stated reason.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from app.calculations.tara_bala import chandra_bala, tara_number
from app.data import marriage_muhurta_rules as marriage


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
    NAKSHATRA_FAVOURED = 14.0
    NAKSHATRA_NOT_LISTED = -6.0
    TITHI_BEST = 10.0
    TITHI_MIDDLING = 0.0
    TITHI_INAUSPICIOUS = -14.0
    LAGNA_BEST = 8.0
    LAGNA_AVOID = -10.0
    TARA_GOOD = 12.0
    TARA_ADVERSE = -18.0
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

# Activities with a primary-text rule table. Everything else scores on the
# generic almanac layer and says so.
_SOURCED_ACTIVITIES = frozenset({"MARRIAGE"})


def _in_paksha_tithi(tithi_number: int) -> int:
    """1..30 tithi -> its 1..15 number within the paksha."""
    return tithi_number if tithi_number <= 15 else tithi_number - 15


def _ordinal(n: int) -> str:
    """English ordinal for a house number. `f"{n}th"` produces "1th"/"2th"/"3th",
    which reached the reason copy before this existed."""
    if 11 <= (n % 100) <= 13:
        return f"{n}th"
    return f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th') }"


def _tithi_display(snapshot) -> str:
    """Tithi names arrive uppercase on the snapshot; nakshatra names are
    title-cased for display. Match them, or one reason line reads
    "CHATHURTHI" beside another reading "Aswini"."""
    return str(snapshot.tithi_name).title()


# ── L2/L5: activity-specific almanac factors ────────────────────────────────

def _nakshatra_factor(snapshot, activity: str) -> FactorResult:
    if activity not in _SOURCED_ACTIVITIES:
        return FactorResult(
            factor="NAKSHATRA",
            verdict=Verdict.UNSOURCED,
            contribution=0.0,
            reason_en=(
                f"No primary-text nakshatra list has been sourced for {activity.title()} yet — "
                "this day's star was not judged for this activity."
            ),
            reason_ta=(
                f"{activity.title()} செயலுக்கான நட்சத்திரப் பட்டியல் இன்னும் மூல நூலிலிருந்து "
                "உறுதி செய்யப்படவில்லை — இந்நாளின் நட்சத்திரம் இச்செயலுக்கு மதிப்பிடப்படவில்லை."
            ),
        )

    number = snapshot.nakshatra_number
    name = snapshot.nakshatra_name.title()
    if number in marriage.MARRIAGE_NAKSHATRA_ALLOWED:
        return FactorResult(
            factor="NAKSHATRA",
            verdict=Verdict.BONUS,
            contribution=_W.NAKSHATRA_FAVOURED,
            reason_en=f"{name} is among the eleven asterisms Kalaprakasika names best for marriage.",
            reason_ta=f"கலப்பிரகாசிகை திருமணத்திற்குச் சிறந்ததெனக் கூறும் பதினொரு நட்சத்திரங்களுள் {name} ஒன்று.",
            rule_id="MARRIAGE_NAKSHATRA_ALLOWED_SET",
        )
    # The text lists the eleven as "best" and does not blanket-forbid the rest,
    # so a non-listed star is a mild penalty, never a veto.
    return FactorResult(
        factor="NAKSHATRA",
        verdict=Verdict.PENALTY,
        contribution=_W.NAKSHATRA_NOT_LISTED,
        reason_en=f"{name} is not among the eleven asterisms named best for marriage.",
        reason_ta=f"திருமணத்திற்குச் சிறந்ததெனக் கூறப்பட்ட பதினொரு நட்சத்திரங்களுள் {name} இல்லை.",
        rule_id="MARRIAGE_NAKSHATRA_ALLOWED_SET",
    )


def _tithi_factor(snapshot, activity: str) -> FactorResult:
    if activity not in _SOURCED_ACTIVITIES:
        return FactorResult(
            factor="TITHI",
            verdict=Verdict.UNSOURCED,
            contribution=0.0,
            reason_en=f"No primary-text tithi list has been sourced for {activity.title()} yet.",
            reason_ta=f"{activity.title()} செயலுக்கான திதிப் பட்டியல் இன்னும் மூல நூலிலிருந்து உறுதி செய்யப்படவில்லை.",
        )

    in_paksha = _in_paksha_tithi(snapshot.tithi_number)
    is_krishna = snapshot.tithi_paksha == "KRISHNA"
    name = _tithi_display(snapshot)
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
            reason_en=f"{name} falls after Ashtami in the waning fortnight — inauspicious for marriage.",
            reason_ta=f"தேய்பிறை அஷ்டமிக்குப் பின் வரும் {name} திதி திருமணத்திற்கு உகந்ததல்ல.",
            rule_id="MARRIAGE_TITHI_ALLOWED_SET",
            conflict=conflict,
        )

    if is_best:
        return FactorResult(
            factor="TITHI",
            verdict=Verdict.BONUS,
            contribution=_W.TITHI_BEST,
            reason_en=f"{name} is among the seven tithis Kalaprakasika names best for marriage.",
            reason_ta=f"கலப்பிரகாசிகை திருமணத்திற்குச் சிறந்ததெனக் கூறும் ஏழு திதிகளுள் {name} ஒன்று.",
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
            reason_en=f"{name} is of middling influence for marriage.",
            reason_ta=f"{name} திதி திருமணத்திற்கு நடுத்தரமான பலனைத் தரும்.",
            rule_id="MARRIAGE_TITHI_ALLOWED_SET",
        )

    return FactorResult(
        factor="TITHI",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"{name} is not named in the marriage tithi tiers.",
        reason_ta=f"{name} திதி திருமணத் திதிப் பட்டியலில் குறிப்பிடப்படவில்லை.",
        rule_id="MARRIAGE_TITHI_ALLOWED_SET",
    )


def _lagna_sign_factor(snapshot, activity: str) -> FactorResult | None:
    """Sunrise lagna only. A full-day lagna schedule (A3) does not exist yet, so
    this judges the day's rising sign, not the rising sign at the candidate
    minute — the reason text says so rather than implying a precision we lack."""
    if activity not in _SOURCED_ACTIVITIES:
        return None

    rasi = snapshot.lagna_rasi_number
    name = snapshot.lagna_rasi_name
    if rasi in marriage.MARRIAGE_LAGNA_BEST:
        return FactorResult(
            factor="LAGNA_SIGN_AT_SUNRISE",
            verdict=Verdict.BONUS,
            contribution=_W.LAGNA_BEST,
            reason_en=f"{name} rises at sunrise — among the best marriage lagnas.",
            reason_ta=f"சூரிய உதயத்தில் {name} லக்னம் — திருமணத்திற்குச் சிறந்த லக்னங்களுள் ஒன்று.",
            rule_id="MARRIAGE_LAGNA_SIGN_PREFERENCE",
        )
    if rasi in marriage.MARRIAGE_LAGNA_AVOID:
        return FactorResult(
            factor="LAGNA_SIGN_AT_SUNRISE",
            verdict=Verdict.PENALTY,
            contribution=_W.LAGNA_AVOID,
            reason_en=f"{name} rises at sunrise — a marriage lagna the text says to avoid.",
            reason_ta=f"சூரிய உதயத்தில் {name} லக்னம் — திருமணத்தில் தவிர்க்கச் சொல்லப்பட்ட லக்னம்.",
            rule_id="MARRIAGE_LAGNA_SIGN_PREFERENCE",
        )
    return FactorResult(
        factor="LAGNA_SIGN_AT_SUNRISE",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"{name} rises at sunrise — middling influence for marriage.",
        reason_ta=f"சூரிய உதயத்தில் {name} லக்னம் — திருமணத்திற்கு நடுத்தரமான பலன்.",
        rule_id="MARRIAGE_LAGNA_SIGN_PREFERENCE",
    )


# ── L3/L4: personal layer. Only runs when a subject is supplied. ────────────

def _chandra_bala_factor(snapshot, subject: Subject) -> FactorResult:
    house = chandra_bala(subject.janma_rasi, snapshot.chandrashtamam_moon_rasi_number)
    who = subject.label or "this person"

    if house == _CHANDRASHTAMA:
        return FactorResult(
            factor="CHANDRA_BALA",
            verdict=Verdict.VETO,
            contribution=0.0,
            reason_en=f"Moon is 8th from {who}'s birth sign — Chandrashtama, which no other strength offsets.",
            reason_ta=f"{who} ஜென்ம ராசிக்கு 8ல் சந்திரன் — சந்திராஷ்டமம், வேறு எந்த பலமும் இதை ஈடுசெய்யாது.",
        )
    nth = _ordinal(house)
    if house in _CHANDRA_WEAK:
        return FactorResult(
            factor="CHANDRA_BALA",
            verdict=Verdict.PENALTY,
            contribution=_W.CHANDRA_WEAK,
            reason_en=f"Moon is {nth} from {who}'s birth sign — a weak position.",
            reason_ta=f"{who} ஜென்ம ராசிக்கு {house}ல் சந்திரன் — பலவீனமான நிலை.",
        )
    if house in _CHANDRA_STRONG:
        return FactorResult(
            factor="CHANDRA_BALA",
            verdict=Verdict.BONUS,
            contribution=_W.CHANDRA_STRONG,
            reason_en=f"Moon is {nth} from {who}'s birth sign — a strong position.",
            reason_ta=f"{who} ஜென்ம ராசிக்கு {house}ல் சந்திரன் — வலிமையான நிலை.",
        )
    if house in _CHANDRA_BONUS:
        return FactorResult(
            factor="CHANDRA_BALA",
            verdict=Verdict.BONUS,
            contribution=_W.CHANDRA_BONUS,
            reason_en=f"Moon is {nth} from {who}'s birth sign — favourable.",
            reason_ta=f"{who} ஜென்ம ராசிக்கு {house}ல் சந்திரன் — சாதகமானது.",
        )
    return FactorResult(
        factor="CHANDRA_BALA",
        verdict=Verdict.NEUTRAL,
        contribution=0.0,
        reason_en=f"Moon is {nth} from {who}'s birth sign — neutral.",
        reason_ta=f"{who} ஜென்ம ராசிக்கு {house}ல் சந்திரன் — நடுநிலை.",
    )


def _tara_bala_factor(snapshot, subject: Subject) -> FactorResult:
    tara = tara_number(subject.janma_nakshatra, snapshot.nakshatra_number)
    tara_ta, tara_en = _TARA_NAMES[tara]
    who = subject.label or "this person"
    star = snapshot.nakshatra_name.title()

    if tara in _TARA_ADVERSE:
        return FactorResult(
            factor="TARA_BALA",
            verdict=Verdict.PENALTY,
            contribution=_W.TARA_ADVERSE,
            reason_en=f"{star} is {tara_en} tara from {who}'s birth star — an adverse count.",
            reason_ta=f"{who} ஜென்ம நட்சத்திரத்திலிருந்து {star} {tara_ta} தாரா — உகந்ததல்ல.",
        )
    if tara == 1:
        return FactorResult(
            factor="TARA_BALA",
            verdict=Verdict.NEUTRAL,
            contribution=0.0,
            reason_en=f"{star} is {who}'s own birth star — Janma tara, neutral.",
            reason_ta=f"{star} {who} சொந்த நட்சத்திரம் — ஜென்ம தாரா, நடுநிலை.",
        )
    return FactorResult(
        factor="TARA_BALA",
        verdict=Verdict.BONUS,
        contribution=_W.TARA_GOOD,
        reason_en=f"{star} is {tara_en} tara from {who}'s birth star — favourable.",
        reason_ta=f"{who} ஜென்ம நட்சத்திரத்திலிருந்து {star} {tara_ta} தாரா — சாதகமானது.",
    )


# ── the entry point ─────────────────────────────────────────────────────────

def score_day(snapshot, activity: str, subject: Subject | None = None) -> DayScore:
    """Score one day for one activity, optionally for one person.

    `subject=None` is general mode: the personal factors are not computed, not
    scored, and not mentioned. A general result can never be vetoed by a
    personal factor — that is the definition of the mode.
    """
    activity = activity.upper()
    factors: list[FactorResult] = [
        _nakshatra_factor(snapshot, activity),
        _tithi_factor(snapshot, activity),
    ]
    lagna = _lagna_sign_factor(snapshot, activity)
    if lagna is not None:
        factors.append(lagna)

    if subject is not None:
        factors.append(_chandra_bala_factor(snapshot, subject))
        factors.append(_tara_bala_factor(snapshot, subject))

    vetoed = any(f.verdict is Verdict.VETO for f in factors)
    # A vetoed day keeps its factor list — the UI needs to name what killed it —
    # but its score is not a number anyone should rank on.
    score = _W.BASE + sum(f.contribution for f in factors)
    return DayScore(
        score=max(0.0, min(100.0, score)),
        vetoed=vetoed,
        factors=tuple(factors),
    )
