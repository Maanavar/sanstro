"""Conditional Nakshatra Dashas — the Parashari *conditional* udu-dasha family
(Thirukanitham Depth Expansion, Tranche 3 of the edge-conditions program).

Seven nakshatra dashas that BPHS (Brihat Parashara Hora Shastra) describes as
applicable only when a specific birth condition is met, each a structural
variant of Vimshottari with its own cycle length, lord set, per-lord year
table, starting nakshatra and applicability rule:

    Shodashottari      116y   Dwadashottari    112y   Panchottari       105y
    Shatabdika         100y   Chaturashiti-sama 84y   Dwisaptati-sama    72y
    Shashtihayani       60y

Ashtottari (108y) is the eighth member of this family but already has its own
module (`ashtottari_dasha.py`) and route, so it is not duplicated here.

ACCURACY POSTURE (project rule: domain calc bugs are silent — see
[[feedback_astrology_calc_accuracy]]):

The *machinery* below is provably correct — it is the identical
balance-of-dasha / proportional-antardasha construction as `dasha.py`
(Vimshottari) and `ashtottari_dasha.py`, generalised over an arbitrary lord
cycle and cycle-total. The regression suite proves this by feeding the
Vimshottari 9-lord / 120-year table through this engine and asserting it
reproduces `dasha.py` exactly.

The *tables* (lord order, per-lord years, starting nakshatra, applicability
rule) are anchored to a SINGLE citable source — satyori.com's Jyotish dasha
series, which cites R. Santhanam's BPHS translation — the same source
`ashtottari_dasha.py` already trusts. This choice is deliberate: a second
systematised source (astrosutras.in) gives materially DIFFERENT tables for the
same dashas (e.g. a natural Sun..Rahu order with monotonic years, and
Rahu=48 in Panchottari), and mixing sources would silently corrupt results.
The classical/traditional web numbers corroborate satyori on the -ottari
family, which is why these ship, but only in the same posture Ashtottari,
Kalachakra and the D27/D40/D45 vargas take: run behind the "advanced /
experimental" gate, labelled display-only, NOT used in any scoring path, and
flagged for a live-astrologer cross-check. The alternate tables, and the
Shashtihayani nakshatra-grouping question below, are logged in
docs/ASTROLOGER_LIVE_SESSION_BACKLOG_2026-07.md (EC-3..).

Nakshatra-to-lord rule (satyori, for all seven): "count nakshatras forward
from the system's start nakshatra to the Moon's janma nakshatra, divide by N
(the lord count), and the remainder selects the opening lord from the cycle."
That is exactly `SEQUENCE[((n - start) % 27) % N]` — the forward count is
taken mod 27 FIRST (so pre-start births wrap a full circle) and only then mod
N. NB this differs from `ashtottari_dasha.py`'s `(n - 3) % 8`, which omits the
mod-27 step and therefore mis-assigns the opening lord for births whose
nakshatra precedes the start nakshatra; that is a latent bug in the (equally
gated/experimental) Ashtottari module, logged for the same astrologer pass.

Dwadashottari counting-direction exception (astrologer-confirmed, EC-3,
2026-07-14): BPHS phrases six of the seven systems "count from the anchor
nakshatra to the Janma Nakshatra" (anchor -> janma), but phrases Dwadashottari
in reverse — "count from the Janma Nakshatra to Revati" (janma -> anchor).
Reversing the direction is NOT equivalent to negating the step count mod N
(27 is not a multiple of 8), so Dwadashottari needs its own count:
`SEQUENCE[((start - n) % 27) % N]`, flagged via `count_from_janma=True` on its
`ConditionalDashaSystem`. All six other systems keep the anchor -> janma
count. Getting this wrong silently mis-assigns Dwadashottari's opening lord
for every birth even though its lord/year/anchor table is itself correct
(verified against BPHS / R. Santhanam directly, not just satyori).

Shashtihayani non-uniform grouping (astrologer-confirmed, EC-4, 2026-07-14):
unlike the other six systems, Shashtihayani does NOT use the uniform
"count-and-mod-8" rule at all. BPHS (Ch.47 v.40-41) assigns each of the 8
lords a *contiguous block* of 3-4 nakshatras (Jupiter: Ashwini-Krittika, Sun:
Rohini-Punarvasu, Mars: Pushya-Magha, Moon: P.Phalguni-Chitra, Mercury:
Swati-Anuradha, Venus: Jyeshtha-U.Ashadha, Saturn: Abhijit-Dhanishta, Rahu:
Shatabhisha-Revati) rather than one lord per single nakshatra scattered every
8 positions. Mod-8 cannot reproduce this — it disagrees with the block table
on 7 of the first 8 nakshatras. The block boundaries are modelled directly in
absolute sidereal longitude (`_SHASHTIHAYANI_BLOCKS`), because the true
sequence has 28 members, not 27: Abhijit is a real inserted nakshatra
(sidereal 6d40m-10d53m20s Capricorn = 276.667 deg-280.889 deg) folded into
Saturn's block, which shifts the Venus/Saturn boundary 3d20m earlier than the
classical U.Ashadha/Shravana line (276.667 deg instead of 280.0 deg); all
other six block boundaries land on ordinary nakshatra lines. Both `nak_lord`
(nakshatra-midpoint lookup, used for table-level checks) and
`calculate_opening` (exact-longitude lookup, used for real charts) branch on
`degree_blocks` for this one system. Balance-of-dasha is computed as the
fraction of the FULL BLOCK elapsed (not the fraction of the single occupied
nakshatra) — this is forced by the block model itself: since one lord's
mahadasha spans multiple contiguous nakshatras, using single-nakshatra
fraction would incorrectly reset the balance at every nakshatra boundary
*within* the same lord's block. ⚠️ Single fully-sourced citation for blocks
3-8 (Astroseekers/Sunil Dutt, citing BPHS); flagged for a Jagannatha Hora
cross-check before treating as final, same posture as the Amirthadhi grid.
"""
from __future__ import annotations

import math
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

NAKSHATRA_COUNT: Final[int] = 27


@dataclass(frozen=True, slots=True)
class ConditionalDashaSystem:
    """Immutable configuration for one conditional nakshatra dasha."""

    key: str
    name_en: str
    name_ta: str
    total_years: int
    # Lord cycle in dasha order. len(sequence) == N == number of lords.
    sequence: tuple[str, ...]
    # Per-lord dasha length in years. sum(years.values()) == total_years.
    years: dict[str, int]
    # 1-based janma-nakshatra number (Ashwini=1) at which the count opens.
    start_nakshatra: int
    # Human-readable applicability condition (informational; see selector).
    applicability_en: str
    applicability_ta: str
    # True only for Dwadashottari: BPHS phrases its count in reverse ("from
    # the Janma Nakshatra to Revati") instead of the anchor -> janma count
    # every other system uses. See module docstring, "Dwadashottari
    # counting-direction exception".
    count_from_janma: bool = False
    # Non-uniform nakshatra->lord blocks (Shashtihayani only; see module
    # docstring "Shashtihayani non-uniform grouping"). Each entry is
    # (start_deg, end_deg, lord) in absolute sidereal longitude. When set,
    # this OVERRIDES the uniform count-and-mod rule entirely for both
    # `nak_lord` and `calculate_opening`. None for the other six systems.
    degree_blocks: tuple[tuple[float, float, str], ...] | None = None

    @property
    def lord_count(self) -> int:
        return len(self.sequence)

    def nak_lord(self, nakshatra: int) -> str:
        """Opening lord for a birth in `nakshatra` (1..27). Counts mod 27
        first (so pre-anchor births wrap a full circle), then mod N selects
        the lord. Direction is anchor -> janma for six systems; Dwadashottari
        reverses it (`count_from_janma=True`) per its own BPHS phrasing.
        Shashtihayani (`degree_blocks` set) instead looks up the block
        containing the nakshatra's MIDPOINT longitude — a convenience for
        table-level/display checks; real charts use `calculate_opening`'s
        exact-longitude lookup, which alone resolves the Abhijit boundary
        sitting inside U.Ashadha."""
        if self.degree_blocks is not None:
            midpoint = (nakshatra - 1) * NAKSHATRA_SIZE_DEGREES + NAKSHATRA_SIZE_DEGREES / 2.0
            return _lookup_degree_block(self.degree_blocks, midpoint)
        if self.count_from_janma:
            steps = (self.start_nakshatra - nakshatra) % NAKSHATRA_COUNT
        else:
            steps = (nakshatra - self.start_nakshatra) % NAKSHATRA_COUNT
        return self.sequence[steps % self.lord_count]


def _lookup_degree_block(blocks: tuple[tuple[float, float, str], ...], longitude: float) -> str:
    for start_deg, end_deg, lord in blocks:
        if start_deg <= longitude < end_deg:
            return lord
    raise AssertionError(f"longitude {longitude} not covered by any block in {blocks}")


# Abhijit's start boundary (see module docstring "Shashtihayani non-uniform
# grouping"): sidereal 6d40m Capricorn = 270 + 6:40:00. Only the START matters
# for lord assignment — it is where Venus's block ends and Saturn's begins,
# 3d20m before the classical U.Ashadha/Shravana line (280.0 deg). Abhijit's
# own overlap into Shravana's head is irrelevant since both are Saturn.
_ABHIJIT_START_DEG: Final[float] = 270.0 + 6.0 + 40.0 / 60.0  # 276.6667 deg

# Shashtihayani's 8 contiguous nakshatra->lord blocks in absolute sidereal
# longitude (BPHS Ch.47 v.40-41). Sequence/years stay the standard
# Jupiter-first order below; only opening-lord assignment uses this table.
_SHASHTIHAYANI_BLOCKS: Final[tuple[tuple[float, float, str], ...]] = (
    (0 * NAKSHATRA_SIZE_DEGREES, 3 * NAKSHATRA_SIZE_DEGREES, "JUPITER"),   # Ashwini-Krittika
    (3 * NAKSHATRA_SIZE_DEGREES, 7 * NAKSHATRA_SIZE_DEGREES, "SUN"),       # Rohini-Punarvasu
    (7 * NAKSHATRA_SIZE_DEGREES, 10 * NAKSHATRA_SIZE_DEGREES, "MARS"),     # Pushya-Magha
    (10 * NAKSHATRA_SIZE_DEGREES, 14 * NAKSHATRA_SIZE_DEGREES, "MOON"),    # P.Phalguni-Chitra
    (14 * NAKSHATRA_SIZE_DEGREES, 17 * NAKSHATRA_SIZE_DEGREES, "MERCURY"), # Swati-Anuradha
    (17 * NAKSHATRA_SIZE_DEGREES, _ABHIJIT_START_DEG, "VENUS"),            # Jyeshtha-Mula-P.Ashadha-most of U.Ashadha
    (_ABHIJIT_START_DEG, 23 * NAKSHATRA_SIZE_DEGREES, "SATURN"),           # Abhijit-Shravana-Dhanishta
    (23 * NAKSHATRA_SIZE_DEGREES, 27 * NAKSHATRA_SIZE_DEGREES, "RAHU"),    # Shatabhisha-Revati
)


# --- The seven systems (satyori.com / Santhanam BPHS; see module docstring) ---

CONDITIONAL_DASHA_SYSTEMS: Final[dict[str, ConditionalDashaSystem]] = {
    "shodashottari": ConditionalDashaSystem(
        key="shodashottari",
        name_en="Shodashottari Dasha",
        name_ta="ஷோடசோத்தரி தசை",
        total_years=116,
        sequence=("SUN", "MARS", "JUPITER", "SATURN", "KETU", "MOON", "MERCURY", "VENUS"),
        years={"SUN": 11, "MARS": 12, "JUPITER": 13, "SATURN": 14, "KETU": 15, "MOON": 16, "MERCURY": 17, "VENUS": 18},
        start_nakshatra=8,  # Pushya
        applicability_en="Born by day in Krishna Paksha, or by night in Shukla Paksha.",
        applicability_ta="பகலில் கிருஷ்ண பக்ஷம், அல்லது இரவில் சுக்ல பக்ஷத்தில் பிறந்தவர்.",
    ),
    "dwadashottari": ConditionalDashaSystem(
        key="dwadashottari",
        name_en="Dwadashottari Dasha",
        name_ta="த்வாதசோத்தரி தசை",
        total_years=112,
        sequence=("SUN", "JUPITER", "KETU", "MERCURY", "RAHU", "MARS", "SATURN", "MOON"),
        years={"SUN": 7, "JUPITER": 9, "KETU": 11, "MERCURY": 13, "RAHU": 15, "MARS": 17, "SATURN": 19, "MOON": 21},
        start_nakshatra=27,  # Revati
        applicability_en="Lagna falls in a navamsa of Venus (Taurus or Libra D-9 lagna).",
        applicability_ta="லக்னம் சுக்ர நவாம்சத்தில் (ரிஷபம்/துலாம் D-9 லக்னம்) அமைந்தால்.",
        count_from_janma=True,  # BPHS: "from Janma Nakshatra to Revati" (reversed)
    ),
    "panchottari": ConditionalDashaSystem(
        key="panchottari",
        name_en="Panchottari Dasha",
        name_ta="பஞ்சோத்தரி தசை",
        total_years=105,
        sequence=("SUN", "MERCURY", "SATURN", "MARS", "VENUS", "MOON", "JUPITER"),
        years={"SUN": 12, "MERCURY": 13, "SATURN": 14, "MARS": 15, "VENUS": 16, "MOON": 17, "JUPITER": 18},
        start_nakshatra=17,  # Anuradha
        applicability_en="Cancer (Karka) lagna that also falls in the Cancer dvadashamsa (D-12).",
        applicability_ta="கடக லக்னம், மேலும் கடக துவாதசாம்சத்தில் (D-12) அமைந்தால்.",
    ),
    "shatabdika": ConditionalDashaSystem(
        key="shatabdika",
        name_en="Shatabdika Dasha",
        name_ta="சதாப்திகா தசை",
        total_years=100,
        sequence=("SUN", "MOON", "VENUS", "MERCURY", "JUPITER", "MARS", "SATURN"),
        years={"SUN": 5, "MOON": 5, "VENUS": 10, "MERCURY": 10, "JUPITER": 20, "MARS": 20, "SATURN": 30},
        start_nakshatra=27,  # Revati
        applicability_en="Vargottama lagna (same sign in the rasi and the navamsa).",
        applicability_ta="வர்கோத்தம லக்னம் (ராசியிலும் நவாம்சத்திலும் ஒரே ராசி).",
    ),
    "chaturashiti_sama": ConditionalDashaSystem(
        key="chaturashiti_sama",
        name_en="Chaturashiti Sama Dasha",
        name_ta="சதுராசீதி சம தசை",
        total_years=84,
        sequence=("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"),
        years={"SUN": 12, "MOON": 12, "MARS": 12, "MERCURY": 12, "JUPITER": 12, "VENUS": 12, "SATURN": 12},
        start_nakshatra=15,  # Swati
        applicability_en="The lord of the 10th house occupies the 10th house.",
        applicability_ta="பத்தாம் அதிபதி பத்தாம் வீட்டிலேயே அமர்ந்தால்.",
    ),
    "dwisaptati_sama": ConditionalDashaSystem(
        key="dwisaptati_sama",
        name_en="Dwisaptati Sama Dasha",
        name_ta="த்விசப்ததி சம தசை",
        total_years=72,
        sequence=("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU"),
        years={"SUN": 9, "MOON": 9, "MARS": 9, "MERCURY": 9, "JUPITER": 9, "VENUS": 9, "SATURN": 9, "RAHU": 9},
        start_nakshatra=19,  # Mula
        applicability_en="The lagna lord is placed in the lagna itself or in the 7th house.",
        applicability_ta="லக்னாதிபதி லக்னத்திலோ அல்லது ஏழாம் வீட்டிலோ அமர்ந்தால்.",
    ),
    "shashtihayani": ConditionalDashaSystem(
        key="shashtihayani",
        name_en="Shashtihayani Dasha",
        name_ta="ஷஷ்டிஹாயனி தசை",
        total_years=60,
        sequence=("JUPITER", "SUN", "MARS", "MOON", "MERCURY", "VENUS", "SATURN", "RAHU"),
        years={"JUPITER": 10, "SUN": 10, "MARS": 10, "MOON": 6, "MERCURY": 6, "VENUS": 6, "SATURN": 6, "RAHU": 6},
        start_nakshatra=1,  # Ashwini
        applicability_en="The Sun occupies the lagna.",
        applicability_ta="சூரியன் லக்னத்தில் அமர்ந்தால்.",
        degree_blocks=_SHASHTIHAYANI_BLOCKS,
    ),
}


@dataclass(frozen=True, slots=True)
class ConditionalDashaTimeline:
    system_key: str
    opening_lord: str
    balance_years_at_birth: float
    opening_end_jd: float
    mahadashas: tuple[DashaPeriod, ...]
    current_mahadasha: DashaPeriod
    current_antardasha: DashaPeriod
    antardashas: tuple[DashaPeriod, ...]


def _sequence_from(system: ConditionalDashaSystem, start_lord: str) -> list[str]:
    start_index = system.sequence.index(start_lord)
    n = system.lord_count
    return [system.sequence[(start_index + offset) % n] for offset in range(n)]


def _mahadasha_cycles(total_years: int) -> int:
    """Enough full cycles for `_find_period` to resolve a running mahadasha at
    any human as-of date. ~130 years of coverage past birth with margin."""
    return math.ceil(130 / total_years) + 1


def _build_periods(
    system: ConditionalDashaSystem, start_jd: float, start_lord: str, first_duration_years: float
) -> tuple[DashaPeriod, ...]:
    periods: list[DashaPeriod] = []
    sequence = _sequence_from(system, start_lord)
    current_start = start_jd
    cycles = _mahadasha_cycles(system.total_years)

    for cycle in range(cycles):
        for index, lord in enumerate(sequence):
            duration_years = (
                first_duration_years if (cycle == 0 and index == 0) else float(system.years[lord])
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
                    sequence_index=cycle * system.lord_count + index,
                )
            )
            current_start = end_jd

    return tuple(periods)


def _build_subperiods(system: ConditionalDashaSystem, parent: DashaPeriod) -> tuple[DashaPeriod, ...]:
    """Antardashas within a mahadasha. Same true-span reconstruction as
    `dasha.py: _build_subperiods` — the opening mahadasha is stored clipped to
    the balance at birth, so its antardashas are rebuilt over the full unclipped
    span to resume from the bhukti actually running at birth."""
    periods: list[DashaPeriod] = []
    sequence = _sequence_from(system, parent.lord)
    parent_years = float(system.years[parent.lord])
    true_start = parent.end_jd - parent_years * JULIAN_YEAR_DAYS
    current_start = true_start

    for index, lord in enumerate(sequence):
        duration_years = parent_years * system.years[lord] / system.total_years
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


def calculate_opening(
    system: ConditionalDashaSystem, moon_longitude: float, birth_jd: float
) -> tuple[str, float, float]:
    normalized_moon = normalize_longitude(moon_longitude)

    if system.degree_blocks is not None:
        # Shashtihayani: exact-longitude block lookup (resolves the Abhijit
        # boundary inside U.Ashadha) + balance as fraction of the FULL BLOCK
        # elapsed, not the single occupied nakshatra — see module docstring.
        block_start, block_end, opening_lord = next(
            (s, e, lord) for s, e, lord in system.degree_blocks if s <= normalized_moon < e
        )
        fraction_elapsed = (normalized_moon - block_start) / (block_end - block_start)
    else:
        moon_nakshatra = int((normalized_moon + EPSILON_DEGREES) // NAKSHATRA_SIZE_DEGREES) + 1
        opening_lord = system.nak_lord(moon_nakshatra)
        nak_start = (moon_nakshatra - 1) * NAKSHATRA_SIZE_DEGREES
        fraction_elapsed = (normalized_moon - nak_start) / NAKSHATRA_SIZE_DEGREES

    balance_years = (1.0 - fraction_elapsed) * system.years[opening_lord]
    opening_end_jd = birth_jd + balance_years * JULIAN_YEAR_DAYS
    return opening_lord, balance_years, opening_end_jd


def calculate_timeline(
    system_key: str, birth_jd: float, moon_longitude: float, as_of_jd: float | None = None
) -> ConditionalDashaTimeline:
    system = CONDITIONAL_DASHA_SYSTEMS[system_key]
    if as_of_jd is None:
        as_of_jd = birth_jd

    opening_lord, balance_years_at_birth, opening_end_jd = calculate_opening(system, moon_longitude, birth_jd)
    mahadashas = _build_periods(system, birth_jd, opening_lord, balance_years_at_birth)
    current_mahadasha = _find_period(mahadashas, as_of_jd)
    antardashas = _build_subperiods(system, current_mahadasha)
    current_antardasha = _find_period(antardashas, as_of_jd)

    return ConditionalDashaTimeline(
        system_key=system_key,
        opening_lord=opening_lord,
        balance_years_at_birth=balance_years_at_birth,
        opening_end_jd=opening_end_jd,
        mahadashas=mahadashas,
        current_mahadasha=current_mahadasha,
        current_antardasha=current_antardasha,
        antardashas=antardashas,
    )


# --------------------------------------------------------------------------- #
# Applicability selector                                                       #
# --------------------------------------------------------------------------- #
#
# Which conditional dasha applies to a chart is the MOST source-divergent part
# of this family (satyori, astrosutras and the classical commentaries word the
# conditions differently, and BPHS lists more conditions than it resolves). So
# this selector is strictly INFORMATIONAL: it reports, per system, whether the
# chart meets the (satyori-worded) classical condition, and returns None
# ("needs review") wherever the datum is missing or the rule is genuinely a
# judgement call. It NEVER auto-hides a dasha and NEVER feeds scoring. The rule
# wordings and the day/night approximation are logged for the astrologer pass
# (docs/ASTROLOGER_LIVE_SESSION_BACKLOG_2026-07.md, EC-3..).

# Local classical sign-lord map (Rahu/Ketu are not sign lords). Kept local to
# stay a dependency-light leaf, matching jaimini_dasha.py; a test asserts it
# equals chart_strength.SIGN_LORD.
_SIGN_LORD: Final[dict[int, str]] = {
    1: "MARS", 2: "VENUS", 3: "MERCURY", 4: "MOON", 5: "SUN", 6: "MERCURY",
    7: "VENUS", 8: "MARS", 9: "JUPITER", 10: "SATURN", 11: "SATURN", 12: "JUPITER",
}

_VENUS_SIGNS: Final[frozenset[int]] = frozenset({2, 7})  # Taurus, Libra
_CANCER: Final[int] = 4


@dataclass(frozen=True, slots=True)
class ApplicabilityResult:
    key: str
    applicable: bool | None  # None = indeterminate (missing datum / astrologer call)
    reason: str              # short English diagnostic


def _house_of(planet_house: Mapping[str, int], lord: str) -> int | None:
    return planet_house.get(lord)


def evaluate_applicability(
    *,
    lagna_rasi: int,
    d9_lagna_rasi: int | None,
    d12_lagna_rasi: int | None,
    planet_house: Mapping[str, int],
    paksha: str | None,
    is_day_birth: bool | None,
) -> dict[str, ApplicabilityResult]:
    """Evaluate each conditional dasha's classical applicability condition.

    `planet_house` maps a graha to its house-from-lagna (1..12). `paksha` is
    "SHUKLA"/"KRISHNA". `is_day_birth` is the (approximate) day/night flag.
    """
    results: dict[str, ApplicabilityResult] = {}

    # Shodashottari — day+Krishna OR night+Shukla.
    if paksha is None or is_day_birth is None:
        results["shodashottari"] = ApplicabilityResult(
            "shodashottari", None, "paksha / day-night not available"
        )
    else:
        applies = (is_day_birth and paksha == "KRISHNA") or (not is_day_birth and paksha == "SHUKLA")
        day_word = "day" if is_day_birth else "night"
        results["shodashottari"] = ApplicabilityResult(
            "shodashottari", applies, f"{day_word} birth in {paksha.title()} Paksha"
        )

    # Dwadashottari — lagna in a Venus navamsa (D9 lagna Taurus/Libra).
    if d9_lagna_rasi is None:
        results["dwadashottari"] = ApplicabilityResult("dwadashottari", None, "D9 lagna not available")
    else:
        applies = d9_lagna_rasi in _VENUS_SIGNS
        results["dwadashottari"] = ApplicabilityResult(
            "dwadashottari", applies, f"D9 lagna sign {d9_lagna_rasi}"
        )

    # Panchottari — Cancer lagna AND Cancer dvadashamsa (D12).
    if lagna_rasi != _CANCER:
        results["panchottari"] = ApplicabilityResult("panchottari", False, "lagna is not Cancer")
    elif d12_lagna_rasi is None:
        results["panchottari"] = ApplicabilityResult("panchottari", None, "Cancer lagna; D12 not available")
    else:
        applies = d12_lagna_rasi == _CANCER
        results["panchottari"] = ApplicabilityResult(
            "panchottari", applies, f"Cancer lagna; D12 lagna sign {d12_lagna_rasi}"
        )

    # Shatabdika — vargottama lagna (rasi lagna == navamsa lagna).
    if d9_lagna_rasi is None:
        results["shatabdika"] = ApplicabilityResult("shatabdika", None, "D9 lagna not available")
    else:
        applies = lagna_rasi == d9_lagna_rasi
        results["shatabdika"] = ApplicabilityResult(
            "shatabdika", applies, "vargottama lagna" if applies else "lagna not vargottama"
        )

    # Chaturashiti Sama — 10th lord occupies the 10th house.
    tenth_rasi = (lagna_rasi + 8) % 12 + 1
    tenth_lord = _SIGN_LORD[tenth_rasi]
    tenth_lord_house = _house_of(planet_house, tenth_lord)
    if tenth_lord_house is None:
        results["chaturashiti_sama"] = ApplicabilityResult(
            "chaturashiti_sama", None, f"10th lord ({tenth_lord}) position unknown"
        )
    else:
        results["chaturashiti_sama"] = ApplicabilityResult(
            "chaturashiti_sama", tenth_lord_house == 10, f"10th lord ({tenth_lord}) in house {tenth_lord_house}"
        )

    # Dwisaptati Sama — lagna lord in the lagna (1st) or the 7th.
    lagna_lord = _SIGN_LORD[lagna_rasi]
    lagna_lord_house = _house_of(planet_house, lagna_lord)
    if lagna_lord_house is None:
        results["dwisaptati_sama"] = ApplicabilityResult(
            "dwisaptati_sama", None, f"lagna lord ({lagna_lord}) position unknown"
        )
    else:
        results["dwisaptati_sama"] = ApplicabilityResult(
            "dwisaptati_sama", lagna_lord_house in (1, 7), f"lagna lord ({lagna_lord}) in house {lagna_lord_house}"
        )

    # Shashtihayani — Sun occupies the lagna.
    sun_house = _house_of(planet_house, "SUN")
    if sun_house is None:
        results["shashtihayani"] = ApplicabilityResult("shashtihayani", None, "Sun position unknown")
    else:
        results["shashtihayani"] = ApplicabilityResult(
            "shashtihayani", sun_house == 1, f"Sun in house {sun_house}"
        )

    return results
