"""Emit the Vimshottari timings the 27 nakshatra pages print (FSA-03).

Why a generator
---------------
The visual pages once hand-typed every bhukti timing. Checked against the
arithmetic, 87 of 146 "yr N of X" claims were wrong and 65 stated ages could
not occur for any birth. The owner's ruling (2026-10-21): generate every timing
from ``app/calculations/dasha.py``, keep no second implementation of the
arithmetic in the frontend, name the datum in every sentence, and state an age
from birth only as a range over the birth balance.

So this script calls the engine itself — ``calculate_vimshottari_timeline`` and
``_build_subperiods`` — at the two extremes of the birth balance, and writes what
it gets. The page renders these numbers and does no arithmetic of its own.
Re-run after any change to the engine::

    $env:PYTHONUTF8 = "1"
    python scripts/generate_natchathiram_dasa_timings.py

``tests/test_natchathiram_dasa_timings.py`` fails if the committed file is stale.

Units
-----
Time is in years of 365.25 days, the single convention of all six dasa
engines. ``[y, m, d]`` splits that same number the way panchangam books print a
bhukti table — twelve months of thirty days to a year — so Venus–Venus reads
3 yr 4 mo 0 d. It is a way of writing the fraction, not a second calendar: no
boundary moves. Ages are rounded to the month, because a range over every
possible birth balance is no more precise than that.

The birth balance
-----------------
A native of a star is born with between nothing and all of the star lord's
dasa remaining: nothing if born at its last moment, all of it at its first.
Every age below is computed twice through the engine — the Moon at the star's
first degree (full balance) and at its last (no balance) — and the true age for
a given birth lies between. An opening-dasa bhukti can therefore lie partly or
wholly before birth; ``minStartAge`` is negative then, and the page says so
rather than printing a negative age.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from app.calculations.dasha import (  # noqa: E402
    DASHA_YEARS,
    JULIAN_YEAR_DAYS,
    NAK_LORD,
    NAKSHATRA_SIZE_DEGREES,
    _build_subperiods,
    calculate_opening_dasha,
    calculate_vimshottari_timeline,
)

OUTPUT = REPO / "web" / "lib" / "generated" / "natchathiram-dasa-timings.ts"

# Any instant serves: every age is a difference from it. J2000.0.
_BIRTH_JD = 2451545.0
# Short of the star's far edge, so the engine still reads the same star.
_EDGE = 1e-7


def _ymd(years: float) -> list[int]:
    """Years -> [y, m, d] with 12 months of 30 days, rounded to the day."""
    total_days = round(years * 360)
    return [total_days // 360, (total_days % 360) // 30, total_days % 30]


def _ym(years: float) -> list[int]:
    """Years -> [y, m], rounded to the month."""
    total_months = round(years * 12)
    return [total_months // 12, total_months % 12]


def _age(jd: float) -> float:
    return (jd - _BIRTH_JD) / JULIAN_YEAR_DAYS


def _round(value: float) -> float:
    return round(value, 6) + 0.0  # + 0.0 folds -0.0 into 0.0


def build() -> list[dict]:
    stars = []
    for nakshatra in range(1, 28):
        start = (nakshatra - 1) * NAKSHATRA_SIZE_DEGREES
        full = calculate_vimshottari_timeline(_BIRTH_JD, start)  # born at the first degree
        none = calculate_vimshottari_timeline(_BIRTH_JD, start + NAKSHATRA_SIZE_DEGREES - _EDGE)
        if not full.opening_lord == none.opening_lord == NAK_LORD[nakshatra]:
            raise RuntimeError(f"nakshatra {nakshatra}: the two balance extremes read different stars")

        mahadashas = []
        for index in range(9):
            md_full, md_none = full.mahadashas[index], none.mahadashas[index]
            years = DASHA_YEARS[md_full.lord]
            bhuktis = []
            for ad_full, ad_none in zip(
                _build_subperiods(md_full, "antar"), _build_subperiods(md_none, "antar"), strict=True
            ):
                if ad_full.lord != ad_none.lord:
                    raise RuntimeError(f"nakshatra {nakshatra}: bhukti order differs between the balance extremes")
                # The bhukti's offset into its own dasa does not depend on the
                # balance; read it off the full-balance build, where the dasa's
                # true start is its stored start.
                md_true_start = md_full.end_jd - years * JULIAN_YEAR_DAYS
                offset = (ad_full.start_jd - md_true_start) / JULIAN_YEAR_DAYS
                duration = (ad_full.end_jd - ad_full.start_jd) / JULIAN_YEAR_DAYS
                low, high = sorted((_age(ad_none.start_jd), _age(ad_full.start_jd)))
                bhuktis.append(
                    {
                        "lord": ad_full.lord,
                        "offsetYears": _round(offset),
                        "offset": _ymd(offset),
                        "durationYears": _round(duration),
                        "duration": _ymd(duration),
                        "minStartAgeYears": _round(low),
                        "maxStartAgeYears": _round(high),
                        "minStartAge": _ym(max(low, 0.0)),
                        "maxStartAge": _ym(high),
                        "canPrecedeBirth": low < 0,
                    }
                )
            start_low, start_high = sorted((_age(md_none.start_jd), _age(md_full.start_jd)))
            end_low, end_high = sorted((_age(md_none.end_jd), _age(md_full.end_jd)))
            mahadashas.append(
                {
                    "lord": md_full.lord,
                    "years": years,
                    "isOpening": index == 0,
                    "minStartAgeYears": _round(start_low),
                    "maxStartAgeYears": _round(start_high),
                    "minEndAgeYears": _round(end_low),
                    "maxEndAgeYears": _round(end_high),
                    "minStartAge": _ym(start_low),
                    "maxStartAge": _ym(start_high),
                    "minEndAge": _ym(end_low),
                    "maxEndAge": _ym(end_high),
                    "bhuktis": bhuktis,
                }
            )
        # The birth balance by pada: a pada is a quarter of the star, so a
        # birth in it leaves between the balances at its two edges.
        pada_size = NAKSHATRA_SIZE_DEGREES / 4
        balance_by_pada = []
        for pada in range(1, 5):
            _, high, _ = calculate_opening_dasha(start + (pada - 1) * pada_size, _BIRTH_JD)
            _, low, _ = calculate_opening_dasha(start + pada * pada_size - _EDGE, _BIRTH_JD)
            balance_by_pada.append(
                {
                    "pada": pada,
                    "minYears": _round(low),
                    "maxYears": _round(high),
                    "min": _ym(low),
                    "max": _ym(high),
                }
            )
        stars.append(
            {
                "nakshatra": nakshatra,
                "openingLord": NAK_LORD[nakshatra],
                "balanceByPada": balance_by_pada,
                "mahadashas": mahadashas,
            }
        )
    return stars


_HEADER = """\
// GENERATED by scripts/generate_natchathiram_dasa_timings.py from
// app/calculations/dasha.py. Do not edit; re-run the script.
// tests/test_natchathiram_dasa_timings.py fails when this file is stale.
//
// Years are 365.25 days. [y, m, d] writes the same number as a panchangam
// bhukti table does (12 months of 30 days); [y, m] is rounded to the month.
// Ages are from birth, as a range over the birth balance: "min" is a birth at
// the star's last moment, "max" at its first.

export type DasaLord =
  | "KETU" | "VENUS" | "SUN" | "MOON" | "MARS"
  | "RAHU" | "JUPITER" | "SATURN" | "MERCURY";

export interface BhuktiTiming {
  lord: DasaLord;
  /** From the start of the mahadasha. */
  offsetYears: number;
  offset: readonly [number, number, number];
  durationYears: number;
  duration: readonly [number, number, number];
  /** Negative when, for some births, the bhukti began before birth. */
  minStartAgeYears: number;
  maxStartAgeYears: number;
  /** Clamped at birth. */
  minStartAge: readonly [number, number];
  maxStartAge: readonly [number, number];
  canPrecedeBirth: boolean;
}

export interface MahadashaTiming {
  lord: DasaLord;
  years: number;
  /** The dasa running at birth: it starts before birth and its length is the balance. */
  isOpening: boolean;
  minStartAgeYears: number;
  maxStartAgeYears: number;
  minEndAgeYears: number;
  maxEndAgeYears: number;
  minStartAge: readonly [number, number];
  maxStartAge: readonly [number, number];
  minEndAge: readonly [number, number];
  maxEndAge: readonly [number, number];
  bhuktis: readonly BhuktiTiming[];
}

export interface PadaBalance {
  pada: number;
  /** Opening-dasa years left at birth, for a birth anywhere in this pada. */
  minYears: number;
  maxYears: number;
  min: readonly [number, number];
  max: readonly [number, number];
}

export interface NakshatraDasaTimings {
  nakshatra: number;
  openingLord: DasaLord;
  balanceByPada: readonly PadaBalance[];
  mahadashas: readonly MahadashaTiming[];
}

"""


def _row(obj: dict) -> str:
    return json.dumps(obj, separators=(", ", ": "))


def render(stars: list[dict]) -> str:
    lines = [_HEADER + "export const NATCHATHIRAM_DASA_TIMINGS: readonly NakshatraDasaTimings[] = ["]
    for star in stars:
        lines.append(f'  {{ "nakshatra": {star["nakshatra"]}, "openingLord": "{star["openingLord"]}", "balanceByPada": [')
        lines.extend(f"    {_row(p)}," for p in star["balanceByPada"])
        lines.append('  ], "mahadashas": [')
        for md in star["mahadashas"]:
            head = {key: value for key, value in md.items() if key != "bhuktis"}
            lines.append(f"    {_row(head)[:-1]}, \"bhuktis\": [")
            lines.extend(f"      {_row(bhukti)}," for bhukti in md["bhuktis"])
            lines.append("    ]},")
        lines.append("  ] },")
    lines.append("];")
    return "\n".join(lines) + "\n"


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(render(build()), encoding="utf-8", newline="\n")
    print(f"wrote {OUTPUT.relative_to(REPO)}")


if __name__ == "__main__":
    main()
