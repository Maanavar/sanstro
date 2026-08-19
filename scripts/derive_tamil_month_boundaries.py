"""Derive the Tamil month-boundary table for a Tamil year and publish it as Markdown.

Doctrine A-3 claims the sunset and sunrise conventions disagree on 8 of the 12
months of Tamil year 2026-27. That is a specific, checkable number, and for one
revision it sat in a docstring with no table behind it. This script is the
table: it prints every sankranti instant and what each convention does with it,
so the claim can be re-derived rather than trusted.

Usage (from the repo root):

    python scripts\\derive_tamil_month_boundaries.py           # write the doc
    python scripts\\derive_tamil_month_boundaries.py --check   # verify it is current
"""
from __future__ import annotations

import argparse
import sys
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from app.calculations.astro import (  # noqa: E402
    julian_day_to_utc_datetime,
    utc_datetime_to_julian_day,
)
from app.calculations.tamil_calendar import (  # noqa: E402
    TAMIL_MONTHS,
    _sun_rasi_index_at_jd,
    _sunrise_jd,
    _sunset_jd,
    find_sankranti_jd,
)

OUTPUT = REPO_ROOT / "docs" / "TAMIL_MONTH_BOUNDARY_TABLE_2026-27.md"

# Chennai — the reference location for the Tamil Nadu civil calendar.
LATITUDE, LONGITUDE = 13.0827, 80.2707
TZ = ZoneInfo("Asia/Kolkata")

# Tamil year 2026-27 runs Chithirai 2026 -> Panguni 2027.
SCAN_START = date(2026, 4, 1)
SCAN_END = date(2027, 4, 30)
MONTHS_IN_YEAR = 12


def _noon_jd(d: date) -> float:
    return utc_datetime_to_julian_day(datetime.combine(d, time(12, 0), tzinfo=TZ).astimezone(UTC))


def _jd_to_ist(jd: float) -> datetime:
    return julian_day_to_utc_datetime(jd).astimezone(TZ)


def collect_boundaries() -> list[dict]:
    """One row per sankranti in the Tamil year, in calendar order."""
    rows: list[dict] = []
    cur = SCAN_START
    prev_rasi = _sun_rasi_index_at_jd(_noon_jd(cur))

    while cur <= SCAN_END and len(rows) < MONTHS_IN_YEAR:
        cur += timedelta(days=1)
        rasi = _sun_rasi_index_at_jd(_noon_jd(cur))
        if rasi == prev_rasi:
            continue
        prev_rasi = rasi

        sankranti_jd = find_sankranti_jd(rasi, _noon_jd(cur))
        sankranti_date = _jd_to_ist(sankranti_jd).date()
        sunrise_jd = _sunrise_jd(sankranti_date, TZ, LATITUDE, LONGITUDE)
        sunset_jd = _sunset_jd(sankranti_date, TZ, LATITUDE, LONGITUDE)

        rows.append({
            "rasi": rasi,
            "ta": TAMIL_MONTHS[rasi][0],
            "en": TAMIL_MONTHS[rasi][1],
            "sankranti": _jd_to_ist(sankranti_jd),
            "sunrise": _jd_to_ist(sunrise_jd),
            "sunset": _jd_to_ist(sunset_jd),
            # Implemented rule: before sunset -> same civil day.
            "sunset_rule": (
                sankranti_date if sankranti_jd < sunset_jd else sankranti_date + timedelta(days=1)
            ),
            # Competing rule: the month begins on the day whose sunrise follows the crossing.
            "sunrise_rule": (
                sankranti_date if sankranti_jd < sunrise_jd else sankranti_date + timedelta(days=1)
            ),
            "daylight_fraction": (sankranti_jd - sunrise_jd) / (sunset_jd - sunrise_jd),
        })

    return rows


def render(rows: list[dict]) -> str:
    disagreements = [r for r in rows if r["sunset_rule"] != r["sunrise_rule"]]

    lines: list[str] = [
        "# Tamil month boundaries — Tamil year 2026-27 (Chennai)",
        "",
        "**Generated** by `scripts/derive_tamil_month_boundaries.py`. Do not hand-edit —",
        "regenerate it. Every value below comes from the same ephemeris the engine uses",
        "(Swiss Ephemeris, sidereal Lahiri; sunrise/sunset as geometric disc-centre with",
        "no refraction, which is the printed-panchangam convention).",
        "",
        "This table exists because doctrine A-3 asserted that the sunset and sunrise",
        "conventions disagree on 8 of 12 months, and for one revision that number lived in",
        "a docstring with nothing behind it. Here is the derivation.",
        "",
        "- **Sunset rule** (implemented): the month starts on the sankranti day if the",
        "  crossing falls before that day's sunset, otherwise the next day.",
        "- **Sunrise rule** (competing): the month starts on the first day whose sunrise",
        "  follows the crossing.",
        "",
        "`Daylight` is how far through the day's light the crossing falls — 0.00 at",
        "sunrise, 1.00 at sunset. It is the quantity any threshold rule compares against.",
        "",
        "| Tamil month | Sankranti (IST) | Sunrise | Sunset | Daylight | Sunset rule | Sunrise rule | Agree? |",
        "|---|---|---|---|---|---|---|---|",
    ]

    for r in rows:
        agree = "yes" if r["sunset_rule"] == r["sunrise_rule"] else "**NO**"
        lines.append(
            f"| {r['ta']} ({r['en']}) "
            f"| {r['sankranti']:%Y-%m-%d %H:%M:%S} "
            f"| {r['sunrise']:%H:%M:%S} "
            f"| {r['sunset']:%H:%M:%S} "
            f"| {r['daylight_fraction']:.3f} "
            f"| {r['sunset_rule']} "
            f"| {r['sunrise_rule']} "
            f"| {agree} |"
        )

    lines += [
        "",
        f"**The two conventions disagree on {len(disagreements)} of {len(rows)} months:** "
        + ", ".join(r["en"] for r in disagreements)
        + ".",
        "",
        "## Month lengths under the implemented (sunset) rule",
        "",
        "| Tamil month | First day | Last day | Days |",
        "|---|---|---|---|",
    ]

    for i, r in enumerate(rows):
        if i + 1 < len(rows):
            last = rows[i + 1]["sunset_rule"] - timedelta(days=1)
            length = (rows[i + 1]["sunset_rule"] - r["sunset_rule"]).days
            lines.append(f"| {r['ta']} ({r['en']}) | {r['sunset_rule']} | {last} | {length} |")
        else:
            lines.append(f"| {r['ta']} ({r['en']}) | {r['sunset_rule']} | — | — |")

    chithirai = rows[0]
    aavani = next(r for r in rows if r["en"] == "Aavani")

    lines += [
        "",
        "## Why the anchor decides it",
        "",
        f"Puthandu — Chithirai 1, 2026 = **{chithirai['sunset_rule']}** — is gazetted by the",
        "Tamil Nadu government. The sunrise rule places it on",
        f"{chithirai['sunrise_rule']}, so the anchor excludes that convention outright.",
        "",
        "## The open Aavani conflict",
        "",
        f"This engine produces Aavani 1, 2026 = **{aavani['sunset_rule']}**. Multiple live",
        "panchang sources publish **2026-08-18**.",
        "",
        "The two claims cannot both come from a threshold rule:",
        "",
        f"- Chithirai's crossing sits at **{chithirai['daylight_fraction']:.3f}** of daylight "
        "and is assigned to its own day.",
        f"- Aavani's crossing sits at **{aavani['daylight_fraction']:.3f}** of daylight — "
        "*earlier* — yet 18 August requires it to be pushed to the following day.",
        "",
        "A threshold that keeps the later crossing and defers the earlier one does not",
        "exist. So the 18 August sources are not simply using a different cut-off: either",
        "they compute sankranti by **Vakya** (mean-motion instants, which differ from drik",
        "by hours), or they apply a rule that is not a threshold, or an anchor is misread.",
        "`tests/test_tamil_calendar.py` pins this argument as an executable proof.",
        "",
        "## Evidence trail",
        "",
        "Staged so whoever resolves this does not have to re-collect it. **Standing is",
        "recorded honestly** — a live calculator is not a printed almanac, and nothing",
        "below is upgraded to `SOURCE` until someone has actually seen the page.",
        "",
        "| Evidence | Claim | Standing |",
        "|---|---|---|",
        "| TN Government Gazette | Puthandu / Chithirai 1, 2026 = 14 April | **ANCHOR** — gazetted, and independently carried in our own festival table. The PDF itself is not filed in this repo; filing it would close the last gap. |",
        "| TN Government Gazette | Aadi 27 = 12 August 2026 | **CORROBORATES US** — implies Aadi 1 = 17 July, which this engine produces. Constrains where Aadi *starts*, not how long it runs, so it does not by itself imply an 18 August Aavani. |",
        "| Live sankranti calculators | Simha sankranti ≈ 08:04 IST, 17 Aug 2026 | **CORROBORATES US** — our ephemeris gives 07:58:45, agreeing to ~5 minutes. This matters: it means the dispute is *not* about the astronomy. Both sides agree when the Sun crosses; they disagree about which civil day that opens. |",
        "| Prokerala (3 pages, per review) | Aavani 1, 2026 = 18 August | **SEARCH_LEAD** — a live calculator, not a printed almanac, and **its system (Vakya vs Thirukanitham) is unstated**. That unknown is the crux of the whole question. |",
        "",
        "The single most useful thing anyone can add here is a **named printed almanac**",
        "— publisher, edition, and whether it is Vakya or Thirukanitham — showing a",
        "month-start table for a full Tamil year. See question **Q4** in",
        "`docs/ASTROLOGER_CONSULTATION_2026-08-19.md`.",
        "",
    ]

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="exit non-zero if the published table is stale instead of rewriting it",
    )
    args = parser.parse_args()

    rendered = render(collect_boundaries())

    if args.check:
        if not OUTPUT.exists():
            print(f"MISSING: {OUTPUT.relative_to(REPO_ROOT)} — run this script without --check")
            return 1
        if OUTPUT.read_text(encoding="utf-8") != rendered:
            print(f"STALE: {OUTPUT.relative_to(REPO_ROOT)} — run this script without --check")
            return 1
        print(f"current: {OUTPUT.relative_to(REPO_ROOT)}")
        return 0

    OUTPUT.write_text(rendered, encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
