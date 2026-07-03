"""Kalachakra Dasha — rasi-based Navamsa-Nakshatra Dasa (Thirukanitham Depth
Expansion Plan, Phase 4.3).

Not present in this project's frozen spec
(`docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md`).
Per the Depth Expansion Plan's own gate on this item, this was not coded from
a single source picked at random. The tables and formulas below are ported
verbatim from Saravali's Kalachakra documentation
(https://saravali.github.io/astrology/kala_basics.html,
kala_chakras.html, kala_balance.html, kala_antardasas.html, kala_cycle.html —
CC BY-SA 4.0, retrieved 2026-07-03), which in turn cites Maharishi Parasara's
*Hora Shastra* and Vaidhyanatha Dikshita's *Jataka Parijata* as the classical
sources (with Sumeet Chugh's *Yogini and Kalachakra Dasa* as a modern
secondary reference). This module reimplements the documented algorithm; it
does not copy any of that site's code (none was published — only prose and
HTML tables).

Structural differences from every other dasha in this codebase:
  - Dasha lords are RASIS (signs), not Grahas (planets) — like Jaimini Chara
    Dasha (`jaimini_dasha.py`), but unlike Vimshottari/Yogini/Ashtottari.
  - Period lengths are non-uniform per rasi (4 to 21 years) and members of
    the 9-rasi sequence can repeat within one cycle — this is a documented
    classical feature (the "Gati"/jump mechanic), not a bug.
  - The dasha depends on the Moon's Nakshatra PADA (= Navamsa), not just the
    Nakshatra — hence "Navamsa based Nakshatra Dasa".

Algorithm (verbatim from the cited pages):
  1. Each of the 27 nakshatras belongs to one of 4 named "chakras" — Aswini,
     Bharani (both Savya/forward), Rohini, Mrigasira (both Apsavya/reverse).
     See NAKSHATRA_GROUP (kala_basics.html's mapping table).
  2. Each chakra has its own fixed table of 4 padas; each pada has its own
     ordered 9-rasi sequence with a duration (years) per rasi, and a
     Paramayus (max cycle span: 83, 85, 86 or 100 years) that the 9 rasi
     durations always sum to exactly (cross-checked below in the module's
     own test suite). See KALACHAKRA_CHAKRAS (kala_chakras.html).
  3. Balance at birth (kala_balance.html): find the Moon's nakshatra and
     pada, compute the elapsed fraction *of the pada* (not the nakshatra),
     multiply by that pada's Paramayus to get "expired years", then walk the
     pada's 9-rasi sequence subtracting each rasi's years until the running
     total would go negative — that rasi is the one running at birth, with
     balance = its full years minus whatever had already elapsed.
  4. Antardasha (kala_antardasas.html): rotate the SAME pada's 9-rasi list to
     start at the running mahadasha's position in that list (tracked as
     `pada_table_index` below, since a rasi can appear twice in one 9-rasi
     list — rotating by rasi *name* would be ambiguous). Each antardasha's
     duration = antardasha_rasi_years * mahadasha_years / paramayus. Verified
     against the source's own worked example (Taurus Mahadasha, Aswini
     chakra 3rd pada, Paramayus 83: Taurus/Taurus = 16*16/83 = 3.0843y,
     Taurus/Aries = 7*16/83 = 1.349y — both reproduced by
     test_kalachakra_dasha.py).

Known issue found in the source while porting it (documented here, not
hidden, per this project's established practice — see
ashtottari_dasha.py's docstring for the same posture): kala_balance.html's
own second worked example labels its sample birth "Purva Phalguni 1st Pada"
but its Paramayus (85) and Deha/Jeeva values (Capricorn/Gemini) only match
Purva Phalguni's *3rd* pada (Mrigasira chakra) in kala_chakras.html's own
table — the 1st-pada row for the same chakra has Paramayus 86. This module
therefore trusts the verbatim numeric TABLE (kala_chakras.html, internally
self-consistent — every 9-rasi row sums exactly to its stated Paramayus,
checked in tests) over the prose walkthrough's pada label, which looks like
a documentation typo in the source rather than an error in the table itself.

Cycle continuation (kala_cycle.html) is explicitly flagged by the source as
"one of the most delicate questions" with four disagreeing named methods
(Progressive, Cyclic, Progressive-in-same-Nakshatra, Portion Zero). This
module uses the **Portion Zero Method** — "sometimes applied in South
India... the cycle begins always in the first Dasa of a Pada" — i.e. once
the birth pada's 9-rasi sequence is exhausted, it simply repeats from its
own first rasi indefinitely. This is both the source's own named South-
Indian/Tamil convention (matching this project's Thirukanitham scope) and
structurally identical to how every other dasha in this codebase repeats its
fixed sequence (see `dasha.py`, `yogini_dasha.py`, `ashtottari_dasha.py`) —
documented here as a deliberate choice, not a default nobody considered, and
flagged for reconsideration if a future astrologer review disagrees.

**Status: experimental / display-only**, same posture as Shadbala before its
Jagannatha Hora cross-validation and Ashtottari's nakshatra-lord table — no
independent second-source (Jagannatha Hora, etc.) cross-check has been done
for this module yet. Not used in any scoring path.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Final, Literal

from app.calculations.astro import julian_day_to_utc_datetime, normalize_longitude
from app.calculations.dasha import EPSILON_DEGREES, JULIAN_YEAR_DAYS, NAKSHATRA_SIZE_DEGREES

PADA_SIZE_DEGREES: Final[float] = NAKSHATRA_SIZE_DEGREES / 4.0

# Duration (years) of each rasi's Kalachakra Mahadasha — kala_basics.html
# "Duration of the Mahadasas" table. Same duration applies wherever that
# rasi appears in any chakra/pada's 9-rasi sequence.
RASI_YEARS: Final[dict[str, int]] = {
    "ARI": 7, "SCO": 7,        # Mars
    "TAU": 16, "LIB": 16,      # Venus
    "GEM": 9, "VIR": 9,        # Mercury
    "CAN": 21,                 # Moon
    "LEO": 5,                  # Sun
    "SAG": 10, "PIS": 10,      # Jupiter
    "CAP": 4, "AQU": 4,        # Saturn
}

# Rasi code -> this project's 1-12 rasi number (app.calculations.astro.RASI_NAMES).
RASI_NUMBER: Final[dict[str, int]] = {
    "ARI": 1, "TAU": 2, "GEM": 3, "CAN": 4, "LEO": 5, "VIR": 6,
    "LIB": 7, "SCO": 8, "SAG": 9, "CAP": 10, "AQU": 11, "PIS": 12,
}

# Nakshatra number (1-27, same numbering as dasha.py/NAK_LORD: 1=Ashwini) ->
# chakra group. Verbatim from kala_basics.html's mapping table.
NAKSHATRA_GROUP: Final[dict[int, str]] = {
    1: "ASWINI", 2: "BHARANI", 3: "ASWINI", 4: "ROHINI", 5: "MRIGASIRA",
    6: "ROHINI", 7: "ASWINI", 8: "BHARANI", 9: "ASWINI", 10: "ROHINI",
    11: "MRIGASIRA", 12: "ROHINI", 13: "ASWINI", 14: "BHARANI", 15: "ASWINI",
    16: "ROHINI", 17: "MRIGASIRA", 18: "ROHINI", 19: "ASWINI", 20: "BHARANI",
    21: "ASWINI", 22: "ROHINI", 23: "MRIGASIRA", 24: "ROHINI", 25: "ASWINI",
    26: "BHARANI", 27: "ASWINI",
}

CHAKRA_DIRECTION: Final[dict[str, str]] = {
    "ASWINI": "SAVYA", "BHARANI": "SAVYA", "ROHINI": "APSAVYA", "MRIGASIRA": "APSAVYA",
}

# Per chakra, per pada (1-4): (9-rasi sequence in order, Paramayus years).
# Verbatim from kala_chakras.html. Each 9-rasi row sums exactly to its
# Paramayus (checked in test_kalachakra_dasha.py) — the strongest available
# internal-consistency check on this transcription.
KALACHAKRA_CHAKRAS: Final[dict[str, dict[int, tuple[tuple[str, ...], int]]]] = {
    "ASWINI": {
        1: (("ARI", "TAU", "GEM", "CAN", "LEO", "VIR", "LIB", "SCO", "SAG"), 100),
        2: (("CAP", "AQU", "PIS", "SCO", "LIB", "VIR", "CAN", "LEO", "GEM"), 85),
        3: (("TAU", "ARI", "PIS", "AQU", "CAP", "SAG", "ARI", "TAU", "GEM"), 83),
        4: (("CAN", "LEO", "VIR", "LIB", "SCO", "SAG", "CAP", "AQU", "PIS"), 86),
    },
    "BHARANI": {
        1: (("SCO", "LIB", "VIR", "CAN", "LEO", "GEM", "TAU", "ARI", "PIS"), 100),
        2: (("AQU", "CAP", "SAG", "ARI", "TAU", "GEM", "CAN", "LEO", "VIR"), 85),
        3: (("LIB", "SCO", "SAG", "CAP", "AQU", "PIS", "SCO", "LIB", "VIR"), 83),
        4: (("CAN", "LEO", "GEM", "TAU", "ARI", "PIS", "AQU", "CAP", "SAG"), 86),
    },
    "ROHINI": {
        1: (("SAG", "CAP", "AQU", "PIS", "ARI", "TAU", "GEM", "LEO", "CAN"), 86),
        2: (("VIR", "LIB", "SCO", "PIS", "AQU", "CAP", "SAG", "SCO", "LIB"), 83),
        3: (("VIR", "LEO", "CAN", "GEM", "TAU", "ARI", "SAG", "CAP", "AQU"), 85),
        4: (("PIS", "ARI", "TAU", "GEM", "LEO", "CAN", "VIR", "LIB", "SCO"), 100),
    },
    "MRIGASIRA": {
        1: (("PIS", "AQU", "CAP", "SAG", "SCO", "LIB", "VIR", "LEO", "CAN"), 86),
        2: (("GEM", "TAU", "ARI", "SAG", "CAP", "AQU", "PIS", "ARI", "TAU"), 83),
        3: (("GEM", "LEO", "CAN", "VIR", "LIB", "SCO", "PIS", "AQU", "CAP"), 85),
        4: (("SAG", "SCO", "LIB", "VIR", "LEO", "CAN", "GEM", "TAU", "ARI"), 100),
    },
}

# Enough cycles of the birth pada's own 9-rasi sequence (Portion Zero Method)
# to cover well past any human lifespan regardless of which Paramayus (83-100
# years) applies.
_MAHADASHA_CYCLES: Final[int] = 3


@dataclass(frozen=True, slots=True)
class KalachakraPeriod:
    level: Literal["maha", "antar"]
    rasi: str
    pada_table_index: int
    start_jd: float
    end_jd: float
    start_date: date
    end_date: date
    sequence_index: int


@dataclass(frozen=True, slots=True)
class KalachakraTimeline:
    chakra: str
    direction: str
    pada: int
    paramayus: int
    opening_rasi: str
    balance_years_at_birth: float
    opening_end_jd: float
    mahadashas: tuple[KalachakraPeriod, ...]
    current_mahadasha: KalachakraPeriod
    current_antardasha: KalachakraPeriod
    antardashas: tuple[KalachakraPeriod, ...]


def _period_dates(start_jd: float, end_jd: float) -> tuple[date, date]:
    return julian_day_to_utc_datetime(start_jd).date(), julian_day_to_utc_datetime(end_jd).date()


def _nakshatra_and_pada(moon_longitude: float) -> tuple[int, int, float]:
    """Returns (nakshatra 1-27, pada 1-4, fraction elapsed within that pada)."""
    normalized = normalize_longitude(moon_longitude)
    nakshatra = int((normalized + EPSILON_DEGREES) // NAKSHATRA_SIZE_DEGREES) + 1
    nakshatra_start = (nakshatra - 1) * NAKSHATRA_SIZE_DEGREES
    into_nakshatra = normalized - nakshatra_start

    pada = int((into_nakshatra + EPSILON_DEGREES) // PADA_SIZE_DEGREES) + 1
    pada = min(pada, 4)
    pada_start = nakshatra_start + (pada - 1) * PADA_SIZE_DEGREES
    fraction_into_pada = (normalized - pada_start) / PADA_SIZE_DEGREES

    return nakshatra, pada, fraction_into_pada


def _find_period(periods: tuple[KalachakraPeriod, ...], as_of_jd: float) -> KalachakraPeriod:
    if not periods:
        raise ValueError("No periods were generated.")

    adjusted = as_of_jd + EPSILON_DEGREES
    for period in periods:
        if period.start_jd <= adjusted < period.end_jd:
            return period
    return periods[-1]


def calculate_opening_kalachakra(
    moon_longitude: float, birth_jd: float
) -> tuple[str, int, tuple[str, ...], int, int, float, float]:
    """Returns (chakra, pada, rasi_sequence, paramayus, opening_pada_table_index,
    balance_years_at_birth, opening_end_jd)."""
    nakshatra, pada, fraction_into_pada = _nakshatra_and_pada(moon_longitude)
    chakra = NAKSHATRA_GROUP[nakshatra]
    sequence, paramayus = KALACHAKRA_CHAKRAS[chakra][pada]

    expired_years = fraction_into_pada * paramayus
    remaining = expired_years
    opening_index = len(sequence) - 1
    balance_years = float(RASI_YEARS[sequence[-1]])
    for index, rasi in enumerate(sequence):
        years = float(RASI_YEARS[rasi])
        if remaining < years:
            opening_index = index
            balance_years = years - remaining
            break
        remaining -= years

    opening_end_jd = birth_jd + balance_years * JULIAN_YEAR_DAYS
    return chakra, pada, sequence, paramayus, opening_index, balance_years, opening_end_jd


def _build_mahadashas(
    start_jd: float, sequence: tuple[str, ...], opening_index: int, first_duration_years: float
) -> tuple[KalachakraPeriod, ...]:
    n = len(sequence)
    periods: list[KalachakraPeriod] = []
    current_start = start_jd

    for cycle in range(_MAHADASHA_CYCLES):
        for offset in range(n):
            table_index = (opening_index + offset) % n
            rasi = sequence[table_index]
            index_in_cycle = cycle * n + offset
            duration_years = (
                first_duration_years if index_in_cycle == 0 else float(RASI_YEARS[rasi])
            )
            end_jd = current_start + duration_years * JULIAN_YEAR_DAYS
            start_date, end_date = _period_dates(current_start, end_jd)
            periods.append(
                KalachakraPeriod(
                    level="maha",
                    rasi=rasi,
                    pada_table_index=table_index,
                    start_jd=current_start,
                    end_jd=end_jd,
                    start_date=start_date,
                    end_date=end_date,
                    sequence_index=index_in_cycle,
                )
            )
            current_start = end_jd

    return tuple(periods)


def _build_antardashas(
    parent: KalachakraPeriod, sequence: tuple[str, ...], paramayus: int
) -> tuple[KalachakraPeriod, ...]:
    """Antardashas within a Kalachakra Mahadasha (kala_antardasas.html).
    Rotates the SAME pada's 9-rasi list starting at the parent's own
    table position (not by rasi name, since a rasi can appear twice in one
    9-rasi list). Reconstructs the parent's true (unclipped) span the same
    way every other dasha module in this codebase does, since the opening
    Mahadasha is stored clipped to the balance at birth."""
    n = len(sequence)
    parent_years = float(RASI_YEARS[parent.rasi])
    true_start = parent.end_jd - parent_years * JULIAN_YEAR_DAYS
    current_start = true_start

    periods: list[KalachakraPeriod] = []
    for offset in range(n):
        table_index = (parent.pada_table_index + offset) % n
        rasi = sequence[table_index]
        duration_years = RASI_YEARS[rasi] * parent_years / paramayus
        end_jd = current_start + duration_years * JULIAN_YEAR_DAYS
        start_date, end_date = _period_dates(current_start, end_jd)
        periods.append(
            KalachakraPeriod(
                level="antar",
                rasi=rasi,
                pada_table_index=table_index,
                start_jd=current_start,
                end_jd=end_jd,
                start_date=start_date,
                end_date=end_date,
                sequence_index=offset,
            )
        )
        current_start = end_jd

    return tuple(periods)


def calculate_kalachakra_timeline(
    birth_jd: float, moon_longitude: float, as_of_jd: float | None = None
) -> KalachakraTimeline:
    if as_of_jd is None:
        as_of_jd = birth_jd

    chakra, pada, sequence, paramayus, opening_index, balance_years, opening_end_jd = (
        calculate_opening_kalachakra(moon_longitude, birth_jd)
    )

    mahadashas = _build_mahadashas(birth_jd, sequence, opening_index, balance_years)
    current_mahadasha = _find_period(mahadashas, as_of_jd)
    antardashas = _build_antardashas(current_mahadasha, sequence, paramayus)
    current_antardasha = _find_period(antardashas, as_of_jd)

    return KalachakraTimeline(
        chakra=chakra,
        direction=CHAKRA_DIRECTION[chakra],
        pada=pada,
        paramayus=paramayus,
        opening_rasi=sequence[opening_index],
        balance_years_at_birth=balance_years,
        opening_end_jd=opening_end_jd,
        mahadashas=mahadashas,
        current_mahadasha=current_mahadasha,
        current_antardasha=current_antardasha,
        antardashas=antardashas,
    )
