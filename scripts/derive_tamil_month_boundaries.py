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
    month_start_date_for_sankranti,
)
from app.data.tamil_calendar_authority import (  # noqa: E402
    CALENDAR_AUTHORITY_EDITION,
    CALENDAR_AUTHORITY_NAME,
    CALENDAR_AUTHORITY_SOURCE_URL,
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
            # What the engine ACTUALLY returns, published-calendar overrides
            # included. Kept distinct from `sunset_rule` on purpose: this table
            # exists to be audited against the code, so it must never quietly
            # print the rule's answer where the engine gives a different one.
            "engine": month_start_date_for_sankranti(
                sankranti_jd, TZ, LATITUDE, LONGITUDE, rasi
            ),
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
        "**Engine** is what `tamil_solar_date` actually returns. It equals the sunset",
        "rule everywhere except where a verified published-calendar boundary overrides",
        "it — those rows are marked ⚠ and listed again below.",
        "",
        "| Tamil month | Sankranti (IST) | Sunrise | Sunset | Daylight | Sunset rule | Sunrise rule | Agree? | Engine |",
        "|---|---|---|---|---|---|---|---|---|",
    ]

    for r in rows:
        agree = "yes" if r["sunset_rule"] == r["sunrise_rule"] else "**NO**"
        engine = f"{r['engine']}" if r["engine"] == r["sunset_rule"] else f"⚠ **{r['engine']}**"
        lines.append(
            f"| {r['ta']} ({r['en']}) "
            f"| {r['sankranti']:%Y-%m-%d %H:%M:%S} "
            f"| {r['sunrise']:%H:%M:%S} "
            f"| {r['sunset']:%H:%M:%S} "
            f"| {r['daylight_fraction']:.3f} "
            f"| {r['sunset_rule']} "
            f"| {r['sunrise_rule']} "
            f"| {agree} "
            f"| {engine} |"
        )

    lines += [
        "",
        f"**The two conventions disagree on {len(disagreements)} of {len(rows)} months:** "
        + ", ".join(r["en"] for r in disagreements)
        + ".",
        "",
        "## Month lengths as the engine returns them",
        "",
        "| Tamil month | First day | Last day | Days |",
        "|---|---|---|---|",
    ]

    for i, r in enumerate(rows):
        if i + 1 < len(rows):
            last = rows[i + 1]["engine"] - timedelta(days=1)
            length = (rows[i + 1]["engine"] - r["engine"]).days
            lines.append(f"| {r['ta']} ({r['en']}) | {r['engine']} | {last} | {length} |")
        else:
            lines.append(f"| {r['ta']} ({r['en']}) | {r['engine']} | — | — |")

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
        "## The Aavani boundary — why it is an override and not a rule change",
        "",
        f"The sunset rule computes Aavani 1, 2026 = **{aavani['sunset_rule']}**. The published",
        f"Tamil calendar places it on **{aavani['engine']}**, and the engine follows the published",
        "calendar for this boundary via a named, regression-tested override.",
        "",
        "It has to be an override rather than a different threshold, because the two",
        "dates cannot both come from a threshold rule:",
        "",
        f"- Chithirai's crossing sits at **{chithirai['daylight_fraction']:.3f}** of daylight "
        "and is assigned to its own day.",
        f"- Aavani's crossing sits at **{aavani['daylight_fraction']:.3f}** of daylight — "
        "*earlier* — yet 18 August requires it to be pushed to the following day.",
        "",
        "A threshold that keeps the later crossing and defers the earlier one does not",
        "exist. So the published calendar is not simply using a different cut-off: either",
        "it computes sankranti by **Vakya** (mean-motion instants, which differ from drik",
        "by hours), or it applies a rule that is not a threshold at all.",
        "`tests/test_tamil_calendar.py` pins this argument as an executable proof — which",
        "is exactly why the correction is scoped to one named month rather than applied",
        "as a new universal rule.",
        "",
        "## What the authority's own table reveals about its system",
        "",
        f"The authority is **{CALENDAR_AUTHORITY_NAME}**, {CALENDAR_AUTHORITY_EDITION} edition",
        f"(<{CALENDAR_AUTHORITY_SOURCE_URL}>), imported as a complete twelve-month set rather",
        "than as isolated patches. That completeness is what makes the following check",
        "possible — and it is the strongest evidence in this document.",
        "",
        "Sorted by how far into daylight each crossing falls, with what the authority",
        "does about it:",
        "",
        "| Daylight | Tamil month | Authority | Matches |",
        "|---|---|---|---|",
    ]

    for r in sorted(rows, key=lambda x: x["daylight_fraction"]):
        if r["engine"] == r["sunset_rule"] and r["engine"] == r["sunrise_rule"]:
            matches = "both (rules agree)"
        elif r["engine"] == r["sunset_rule"]:
            matches = "**sunset** rule"
        elif r["engine"] == r["sunrise_rule"]:
            matches = "**sunrise** rule"
        else:
            matches = "*neither*"
        same_day = r["engine"] == r["sankranti"].date()
        lines.append(
            f"| {r['daylight_fraction']:.3f} | {r['ta']} ({r['en']}) "
            f"| {r['engine']} ({'same day' if same_day else 'next day'}) | {matches} |"
        )

    deferred = sorted(
        (r for r in rows if r["engine"] != r["sankranti"].date() and r["daylight_fraction"] < 1.0),
        key=lambda x: x["daylight_fraction"],
    )
    same_day_above = [
        r for r in rows
        if r["engine"] == r["sankranti"].date()
        and deferred
        and r["daylight_fraction"] > deferred[-1]["daylight_fraction"]
    ]
    same_day_below = [
        r for r in rows
        if r["engine"] == r["sankranti"].date()
        and deferred
        and r["daylight_fraction"] < deferred[0]["daylight_fraction"]
    ]

    lines += [
        "",
        "**This is not a threshold rule, and the authority's own data proves it.** Of the",
        "crossings that happen in daylight, it defers only "
        + ", ".join(f"{r['en']} ({r['daylight_fraction']:.3f})" for r in deferred)
        + " to the next day — while keeping "
        + ", ".join(f"{r['en']} ({r['daylight_fraction']:.3f})" for r in same_day_below)
        + " on the same day despite those crossings being *earlier*, and also keeping "
        + ", ".join(f"{r['en']} ({r['daylight_fraction']:.3f})" for r in same_day_above)
        + " on the same day when they are *later*.",
        "",
        "A cut-off that defers a middle band while accepting both the earlier and the",
        "later crossings does not exist. What this establishes with certainty is the",
        "negative: **the authority is not applying any threshold to the instants we",
        "compute.** Two readings remain, and the data here cannot separate them —",
        "",
        "1. it works from **different sankranti instants** (Vakya mean-motion rather than",
        "   drik), so its own \"before sunset\" test lands differently; or",
        "2. it works from the same instants under a rule that is not a threshold at all.",
        "",
        "Reading 1 is the more likely — a few hours' shift in two instants is exactly the",
        "scale of Vakya-vs-drik divergence — but it is a hypothesis, and it is recorded",
        "as one.",
        "",
        "**Why this matters practically.** It means the override table is not a list of",
        "corrections to our rule; it is a second calendar system recorded verbatim. The",
        "durable fix is a Vakya sankranti source, after which these entries become",
        "derivable rather than transcribed. Until then the complete-set discipline in",
        "`app/data/tamil_calendar_authority.py` is what keeps it honest. Confirming the",
        "system is question **Q4** in `docs/ASTROLOGER_CONSULTATION_2026-08-19.md`.",
        "",
        "**One boundary to watch:** the authority covers Chithirai 2026 – Panguni 2027",
        "only. Dates outside that window fall back to the computed sunset rule, so the",
        "convention changes at the edge of coverage. A later edition must be imported as",
        "a complete set before that window lapses.",
        "",
        "## Evidence trail",
        "",
        "Staged so whoever resolves this does not have to re-collect it. **Standing is",
        "recorded honestly** — a live calculator is not a printed almanac, and nothing",
        "below is upgraded to `SOURCE` until someone has actually seen the page.",
        "",
        "| Evidence | Claim | Standing |",
        "|---|---|---|",
        f"| **{CALENDAR_AUTHORITY_NAME}**, {CALENDAR_AUTHORITY_EDITION} | All twelve month starts | **SOURCE — the adopted authority.** Named publisher, named edition, complete April–March set, filed at `app/data/tamil_calendar_authority.py`. This is what the engine reproduces. |",
        "| TN Government Gazette | Puthandu / Chithirai 1, 2026 = 14 April | **ANCHOR** — gazetted, independently carried in our festival table, and **the authority agrees with it**. The PDF itself is not filed in this repo; filing it would close the last gap. |",
        "| TN Government Gazette | Aadi 27 = 12 August 2026 | **CORROBORATES BOTH** — implies Aadi 1 = 17 July, which the engine and the authority both give. Under the authority's 18 August Aavani, Aadi runs 17 Jul – 17 Aug (32 days) and Aadi 27 lands on 12 August exactly as gazetted. |",
        "| Live sankranti calculators | Simha sankranti ≈ 08:04 IST, 17 Aug 2026 | **CORROBORATES OUR EPHEMERIS** — we compute 07:58:45, agreeing to ~5 minutes. The disagreement was never about the astronomy. |",
        "| Prokerala (3 pages, per review) | Aavani 1, 2026 = 18 August | **SEARCH_LEAD**, now superseded as evidence by the adopted authority above — but it agrees with it, and its own system remains unstated. |",
        "",
        "The evidence bar this document originally set — *a named printed almanac,",
        "publisher and edition, showing a month-start table for a full Tamil year* — **has",
        "been met**. What remains open is narrower and is question **Q4** in",
        "`docs/ASTROLOGER_CONSULTATION_2026-08-19.md`: whether that almanac computes by",
        "Vakya or Thirukanitham. The answer decides whether these twelve dates stay",
        "transcribed or become derivable.",
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
