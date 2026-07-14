"""Ashtottari Dasha — 108-year secondary/comparison dasha system
(Thirukanitham Depth Expansion Plan, Phase 4.2).

Not present in this project's frozen spec
(`docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md`).
Two things are consistently agreed across every classical/software source
checked (Satyori, AstroSight, Astro121, ModernAstro, astrosutras.in):

    1. Eight lords, no Ketu, fixed cycle order and years, total 108:
       Sun 6, Moon 15, Mars 8, Mercury 17, Saturn 10, Jupiter 19, Rahu 12,
       Venus 21.
    2. The system is reckoned from the Moon's birth nakshatra the same
       structural way Vimshottari is: each of the 27 nakshatras has an
       assigned Ashtottari lord, the birth nakshatra's lord opens the
       sequence, and the balance-at-birth/antardasha nesting is proportional
       — identical machinery to `dasha.py`, just an 8-lord cycle over a
       108-year total instead of 9 over 120.

The *exact* nakshatra-to-lord table was the genuinely contested piece. It is
now the authoritative **Ardra-adi grouping** (classical Jataka Parijata /
B.V. Raman lineage), supplied by the astrologer in the live review session
(2026-07-14, EC-6). Unlike Vimshottari's even 9-apart cycle, this is a
*non-uniform* grouping — runs of 3/3/3/4/3/4/3/4 nakshatras per lord — so it
is encoded as an explicit 27-row table (`NAK_LORD` below), not a modulo of the
run-order sequence. Anchor: the reckoning starts at Ardra (n=6 → Sun).
Ashwini (1), Bharani (2), and Revati (27) all → **Rahu**, which is stable
across every Ardra-adi source; the prior `SEQUENCE[(n - 3) % 8]` Krittikadi
derivation was wrong (it gave Bharani → Venus, and only coincidentally matched
Rahu at Ashwini).

CROSS-CHECK DONE (2026-07-15, full-ownership web research) — the interior
boundaries are NOT a "pending, will-converge" question; they are a genuine
**two-tradition fork**, and this matters enough to state precisely:

  * v1 (THIS TABLE) — the B.V. Raman / Jataka Parijata lineage: 27 nakshatras,
    no Abhijit, groups Sun{3} Moon{4} Mars{3} Mercury{4} Saturn{3} Jupiter{4}
    Rahu{3} Venus{3} (Moon/Mercury/Jupiter get 4, the rest 3).
  * v2 — the primary BPHS (R. Santhanam, Ch. 47) and astro121: **28** nakshatras
    WITH Abhijit, groups Sun{4} Moon{3} Mars{4} Mercury{3} Saturn{4, incl.
    Abhijit} Jupiter{3} Rahu{4} Venus{3} (malefics Sun/Mars/Saturn/Rahu get 4,
    benefics get 3). Santhanam's text: "From 4 nakshatras from Ardra commences
    the Dasa of the Sun, from 3 after that the Moon; 4 after that Mars…".

The two disagree on many interior cells (e.g. Ashlesha→Moon in v1 vs Sun in v2;
Vishakha→Mercury in v1 vs Mars in v2; U.Bhadra→Jupiter in v1 vs Rahu in v2), but
BOTH keep Ashwini/Bharani/Revati → Rahu (the locked anchors). JHora itself ships
Ashtottari as a *multi-option* dasha, confirming there is no single canonical
partition. We deliberately keep **v1 (Raman)**: it is the lineage the live-session
astrologer supplied (2026-07-14) and the de-facto standard in South-Indian / Tamil
practice, which suits a Tamil Thirukanitham product; v1 is internally consistent
as a 27-nakshatra system, so its omission of Abhijit is correct FOR THAT tradition
(Abhijit belongs to the BPHS 28-nak v2, not to Raman's v1). This is a display-only
secondary dasha and never feeds scoring, so the tradition choice is disclosed, not
load-bearing. The v1 partition + anchors are locked by tests/test_ashtottari_dasha.py.

Product decision (per the Depth Expansion Plan's own recommendation): run
unconditionally for every chart and label as a secondary/comparison dasha.
The timeline is NEVER hidden or gated on classical applicability — those rules
are disputed and this is display-only, non-load-bearing output.

APPLICABILITY (EC-6 follow-up, resolved 2026-07-15 — full-ownership astrologer
call): rather than either hard-gating (which would silently hide the system for
~75% of charts on a *contested* reading) or leaving applicability unspoken, we
surface it as an **informational verdict**, exactly the pattern the sibling
conditional-dasha family already uses (`conditional_dashas.evaluate_applicability`
+ its web selector). `evaluate_ashtottari_applicability` below computes:

  * PRIMARY (the `applicable` boolean): Rahu occupies a kendra (1/4/7/10) or
    trikona (5/9) FROM THE LAGNA LORD, excepting Rahu placed in the lagna itself
    (BPHS / Parashari). Union of qualifying relative houses = {1,4,5,7,9,10}.
    This is the *dominant / most widely accepted* applicability doctrine, NOT the
    only one — a few parampara-s trigger Ashtottari on entirely different grounds
    (e.g. lagna in a Rahu nakshatra). For a definitive boolean we pick this one;
    UI copy must say "most widely accepted", not claim universality.
  * SECONDARY (`paksha_supports`, surfaced *separately*): day birth in Krishna
    Paksha, OR night birth in Shukla Paksha. Sources genuinely dispute whether
    this is a co-requirement, an alternate pathway, or a primary-plus-confirmation
    pair. Reporting it separately and treating it as *supportive not gating* is
    itself the alternate-path / non-binding reading — a deliberate tradition
    choice (cf. the mode-flag pattern used for `nadi_parihara_mode`), not a
    neutral "less strong". So `paksha_supports=False` must be surfaced as "some
    traditions require this as a co-condition; this reading treats it as supportive
    only", lest a strict practitioner see a green-ish verdict the engine internally
    knows they'd reject. If this ever gets scored or gated, promote it to a mode
    flag then. (Two conditions as a co-requirement classically qualify ~25% of
    charts: paksha alone ~50%, the Rahu set 6/12 houses ~50%, intersection ~25%.)

Two reference frames, easy to conflate (kept strictly separate below): the
QUALIFYING test counts Rahu's house FROM the lagna lord's house; the EXCEPTION
test is Rahu's ABSOLUTE house == 1. "1st from the lagnesha" (Rahu conjunct the
lagnesha) qualifies; "Rahu in the ascendant" excepts — different cells whenever
the lagnesha is not itself in the 1st. The exception is checked first so it wins.

Sources: BPHS Ch. 47 (R. Santhanam); Satyori; astrosutras.in; corroborating
practitioner notes — reviewed & wording-pinned 2026-07-15.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Final

from app.calculations.astro import normalize_longitude
from app.calculations.dasha import (
    EPSILON_DEGREES,
    JULIAN_YEAR_DAYS,
    NAKSHATRA_SIZE_DEGREES,
    DashaPeriod,
    _find_period,
    _period_dates,
)

ASHTOTTARI_SEQUENCE: Final[list[str]] = [
    "SUN", "MOON", "MARS", "MERCURY", "SATURN", "JUPITER", "RAHU", "VENUS",
]

ASHTOTTARI_YEARS: Final[dict[str, int]] = {
    "SUN": 6, "MOON": 15, "MARS": 8, "MERCURY": 17,
    "SATURN": 10, "JUPITER": 19, "RAHU": 12, "VENUS": 21,
}

TOTAL_CYCLE_YEARS: Final[float] = 108.0

# Ardra-adi grouping (authoritative, live session 2026-07-14 — EC-6). Explicit
# 27-row table because the grouping is non-uniform (runs of 3/3/3/4/3/4/3/4):
#   Rahu {1,2,27} · Venus {3-5} · Sun {6-8} · Moon {9-12} · Mars {13-15} ·
#   Mercury {16-19} · Saturn {20-22} · Jupiter {23-26}.
# Ashwini/Bharani/Revati → Rahu are stable anchors. Interior boundaries are the
# B.V. Raman / Jataka Parijata partition, deliberately kept over the divergent
# BPHS-Santhanam 28-nakshatra (Abhijit) partition — see module docstring for the
# full two-tradition fork and why Raman is kept for this Tamil product.
NAK_LORD: Final[dict[int, str]] = {
    1: "RAHU", 2: "RAHU", 3: "VENUS", 4: "VENUS", 5: "VENUS",
    6: "SUN", 7: "SUN", 8: "SUN", 9: "MOON", 10: "MOON",
    11: "MOON", 12: "MOON", 13: "MARS", 14: "MARS", 15: "MARS",
    16: "MERCURY", 17: "MERCURY", 18: "MERCURY", 19: "MERCURY", 20: "SATURN",
    21: "SATURN", 22: "SATURN", 23: "JUPITER", 24: "JUPITER", 25: "JUPITER",
    26: "JUPITER", 27: "RAHU",
}

# 3 cycles (324 years) gives generous margin past any human lifespan for
# _find_period to resolve a running Mahadasha at any as_of date.
_MAHADASHA_CYCLES: Final[int] = 3

# --- Applicability (informational only; see module docstring, EC-6) ----------
# Kendra (1/4/7/10) ∪ trikona (1/5/9) relative houses, measured FROM the lagna
# lord. The 1st is shared by both; the union is {1,4,5,7,9,10}.
_KENDRA_TRIKONA: Final[frozenset[int]] = frozenset({1, 4, 5, 7, 9, 10})

# Traditional 7-planet sign lordship; equals chart_strength.SIGN_LORD (kept
# local so this leaf module stays free of the heavier chart_strength import,
# matching conditional_dashas._SIGN_LORD).
_SIGN_LORD: Final[dict[int, str]] = {
    1: "MARS", 2: "VENUS", 3: "MERCURY", 4: "MOON", 5: "SUN", 6: "MERCURY",
    7: "VENUS", 8: "MARS", 9: "JUPITER", 10: "SATURN", 11: "SATURN", 12: "JUPITER",
}

# Descriptive, and careful NOT to claim universality — this is the dominant, not
# the only, applicability doctrine (a few parampara-s trigger differently).
_RULE_EN: Final[str] = (
    "Rahu in a kendra (1/4/7/10) or trikona (5/9) from the lagna lord, and not in "
    "the lagna itself — the most widely accepted of several applicability traditions."
)
_RULE_TA: Final[str] = (
    "ராகு லக்னாதிபதியிலிருந்து கேந்திரம் (1/4/7/10) அல்லது திரிகோணத்தில் (5/9), "
    "லக்னத்தில் இல்லாமல் — பல பாரம்பரியங்களில் இதுவே பரவலாக ஏற்கப்பட்டது."
)


@dataclass(frozen=True, slots=True)
class AshtottariApplicability:
    """Informational classical-applicability verdict for Ashtottari.

    NEVER gates whether the timeline renders (Ashtottari is unconditional,
    display-only — see module docstring). `applicable` is the PRIMARY positional
    rule (Rahu kendra/trikona from the lagna lord, Rahu not in lagna), the reading
    every source agrees on. `paksha_supports` is the disputed SECONDARY condition,
    reported separately so it strengthens rather than gates. `None` on either =
    indeterminate (a required datum was missing).
    """

    applicable: bool | None
    reason: str
    rule_en: str
    rule_ta: str
    paksha_supports: bool | None
    paksha_reason: str


def evaluate_ashtottari_applicability(
    *,
    lagna_rasi: int,
    planet_house: Mapping[str, int],
    paksha: str | None,
    is_day_birth: bool | None,
) -> AshtottariApplicability:
    """Classical applicability of Ashtottari for a chart (informational).

    `planet_house` maps each graha to its house-from-lagna (1..12). `paksha` is
    "SHUKLA"/"KRISHNA"; `is_day_birth` the (possibly approximate) day/night flag.
    """
    lagna_lord = _SIGN_LORD[lagna_rasi]
    lagna_lord_house = planet_house.get(lagna_lord)
    rahu_house = planet_house.get("RAHU")

    if lagna_lord_house is None or rahu_house is None:
        applicable: bool | None = None
        reason = "Rahu or lagna-lord position unavailable"
    elif rahu_house == 1:
        # BPHS exception: Rahu in the lagna itself disqualifies the system.
        applicable = False
        reason = "Rahu is in the lagna (excepted)"
    else:
        relative_house = (rahu_house - lagna_lord_house) % 12 + 1
        applicable = relative_house in _KENDRA_TRIKONA
        reason = f"Rahu is house {relative_house} from the lagna lord ({lagna_lord.title()})"

    if paksha is None or is_day_birth is None:
        paksha_supports: bool | None = None
        paksha_reason = "paksha / day-night not available"
    else:
        paksha_supports = (is_day_birth and paksha == "KRISHNA") or (
            not is_day_birth and paksha == "SHUKLA"
        )
        day_word = "day" if is_day_birth else "night"
        paksha_reason = f"{day_word} birth in {paksha.title()} Paksha"

    return AshtottariApplicability(
        applicable=applicable,
        reason=reason,
        rule_en=_RULE_EN,
        rule_ta=_RULE_TA,
        paksha_supports=paksha_supports,
        paksha_reason=paksha_reason,
    )


@dataclass(frozen=True, slots=True)
class AshtottariTimeline:
    opening_lord: str
    balance_years_at_birth: float
    opening_end_jd: float
    mahadashas: tuple[DashaPeriod, ...]
    current_mahadasha: DashaPeriod
    current_antardasha: DashaPeriod
    antardashas: tuple[DashaPeriod, ...]


def _sequence_from(start_lord: str) -> list[str]:
    start_index = ASHTOTTARI_SEQUENCE.index(start_lord)
    n = len(ASHTOTTARI_SEQUENCE)
    return [ASHTOTTARI_SEQUENCE[(start_index + offset) % n] for offset in range(n)]


def _build_ashtottari_periods(
    start_jd: float, sequence_start_lord: str, first_duration_years: float
) -> tuple[DashaPeriod, ...]:
    periods: list[DashaPeriod] = []
    sequence = _sequence_from(sequence_start_lord)
    current_start = start_jd

    for cycle in range(_MAHADASHA_CYCLES):
        for index, lord in enumerate(sequence):
            duration_years = (
                first_duration_years if (cycle == 0 and index == 0) else float(ASHTOTTARI_YEARS[lord])
            )
            end_jd = current_start + duration_years * JULIAN_YEAR_DAYS
            start_date, end_date = _period_dates(current_start, end_jd)
            periods.append(
                DashaPeriod(
                    level="maha",
                    lord=lord,
                    start_jd=current_start,
                    end_jd=end_jd,
                    start_date=start_date,
                    end_date=end_date,
                    sequence_index=cycle * len(ASHTOTTARI_SEQUENCE) + index,
                )
            )
            current_start = end_jd

    return tuple(periods)


def _build_ashtottari_subperiods(parent: DashaPeriod) -> tuple[DashaPeriod, ...]:
    """Antardashas within an Ashtottari Mahadasha. Same true-span
    reconstruction as `dasha.py: _build_subperiods` — the opening Mahadasha
    is stored clipped to the balance at birth, so its antardashas are
    rebuilt over the full unclipped span to resume from the bhukti actually
    running at birth."""
    periods: list[DashaPeriod] = []
    sequence = _sequence_from(parent.lord)
    parent_years = float(ASHTOTTARI_YEARS[parent.lord])
    true_start = parent.end_jd - parent_years * JULIAN_YEAR_DAYS
    current_start = true_start

    for index, lord in enumerate(sequence):
        duration_years = parent_years * ASHTOTTARI_YEARS[lord] / TOTAL_CYCLE_YEARS
        end_jd = current_start + duration_years * JULIAN_YEAR_DAYS
        start_date, end_date = _period_dates(current_start, end_jd)
        periods.append(
            DashaPeriod(
                level="antar",
                lord=lord,
                start_jd=current_start,
                end_jd=end_jd,
                start_date=start_date,
                end_date=end_date,
                sequence_index=index,
            )
        )
        current_start = end_jd

    return tuple(periods)


def calculate_opening_ashtottari(moon_longitude: float, birth_jd: float) -> tuple[str, float, float]:
    normalized_moon = normalize_longitude(moon_longitude)
    moon_nakshatra = int((normalized_moon + EPSILON_DEGREES) // NAKSHATRA_SIZE_DEGREES) + 1
    opening_lord = NAK_LORD[moon_nakshatra]

    nak_start = (moon_nakshatra - 1) * NAKSHATRA_SIZE_DEGREES
    fraction_elapsed = (normalized_moon - nak_start) / NAKSHATRA_SIZE_DEGREES
    balance_years = (1.0 - fraction_elapsed) * ASHTOTTARI_YEARS[opening_lord]
    opening_end_jd = birth_jd + balance_years * JULIAN_YEAR_DAYS
    return opening_lord, balance_years, opening_end_jd


def calculate_ashtottari_timeline(
    birth_jd: float, moon_longitude: float, as_of_jd: float | None = None
) -> AshtottariTimeline:
    if as_of_jd is None:
        as_of_jd = birth_jd

    opening_lord, balance_years_at_birth, opening_end_jd = calculate_opening_ashtottari(moon_longitude, birth_jd)
    mahadashas = _build_ashtottari_periods(birth_jd, opening_lord, balance_years_at_birth)
    current_mahadasha = _find_period(mahadashas, as_of_jd)
    antardashas = _build_ashtottari_subperiods(current_mahadasha)
    current_antardasha = _find_period(antardashas, as_of_jd)

    return AshtottariTimeline(
        opening_lord=opening_lord,
        balance_years_at_birth=balance_years_at_birth,
        opening_end_jd=opening_end_jd,
        mahadashas=mahadashas,
        current_mahadasha=current_mahadasha,
        current_antardasha=current_antardasha,
        antardashas=antardashas,
    )
