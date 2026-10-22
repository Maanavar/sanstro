"""Rulings 2026-10-22 round two, §3 / Task 3a / 3b / OPEN-2 / OPEN-3.

Runs every solar-month star (and special-tithi) observance through the
universal duplicate tie-break (`app.calculations.observance_days`) for each
year, beside the rule it replaces, and prints:

* every candidate day, with how it was named (kala / sunrise fallback /
  contained) and whether its lunar month opens inside the solar month;
* the selected day, and whether the tie-break fired;
* for Family A, the day the withdrawn "full moon's month" rule gave, and a
  MOVED marker where the two differ;
* per rule, the number of years it fired (§0.1).

Runs inside the vinaadi-dev-api container. Read-only: no DB.

    docker cp scripts/audit/solar_month_tiebreak_scan.py vinaadi-dev-api:/tmp/
    docker exec vinaadi-dev-api python /tmp/solar_month_tiebreak_scan.py 2020 2045
"""
import sys
from collections import Counter
from datetime import date, timedelta

sys.path.insert(0, "/app")

from app.calculations.lunar_month import full_moon_tamil_month_index
from app.calculations.observance_days import _Clock, name_day, select_in_solar_month, star_occurrences
from app.calculations.tamil_calendar import tamil_month_spans

TZ, LAT, LON = "Asia/Kolkata", 13.0827, 80.2707
CHITHIRAI, VAIKASI, AADI, KARTHIGAI, MARGAZHI, THAI, MAASI, PANGUNI = 0, 1, 3, 7, 8, 9, 10, 11

# (festival, solar month, kind, value, kala, family A?)
OBSERVANCES = [
    ("Thai Poosam", THAI, "star", "POOSAM", "sunrise", True),
    ("Maasi Magam", MAASI, "star", "MAGAM", "sunrise", True),
    ("Panguni Uthiram", PANGUNI, "star", "UTHIRAM", "sunrise", True),
    ("Vaigasi Visakam", VAIKASI, "star", "VISAKAM", "sunrise", True),
    ("Arudra Darisanam", MARGAZHI, "star", "THIRUVATHIRAI", "sunrise", True),
    ("Thiru Aadi Pooram", AADI, "star", "POORAM", "sunrise", False),
    ("Aadi Krithigai", AADI, "star", "KARTHIGAI", "sunset", False),
    ("Aadi Krithigai @sunrise", AADI, "star", "KARTHIGAI", "sunrise", False),
    ("Karthigai Deepam", KARTHIGAI, "star", "KARTHIGAI", "sunset", False),
    ("Aadi Amavasai", AADI, "tithi", 30, "aparahna", False),
    ("Thai Amavasai", THAI, "tithi", 30, "aparahna", False),
]

EXPECTED = {
    "Aadi Krithigai": {2023: (8, 9), 2024: (7, 30), 2025: (7, 20), 2026: (8, 7), 2027: (7, 28), 2028: (8, 14),
                       2029: (8, 4), 2030: (7, 25), 2031: (8, 11), 2032: (7, 31), 2033: (7, 21)},
    "Aadi Amavasai": {2023: (8, 15), 2024: (8, 4), 2025: (7, 24), 2026: (8, 12), 2027: (8, 2), 2028: (7, 21),
                      2029: (8, 9), 2030: (7, 30), 2031: (7, 19), 2032: (8, 5), 2033: (7, 25)},
    "Karthigai Deepam": {2023: (11, 26), 2024: (12, 13), 2025: (12, 4), 2026: (11, 24), 2027: (12, 11),
                         2028: (12, 1), 2029: (11, 20), 2030: (12, 8), 2031: (11, 28), 2032: (11, 17),
                         2033: (12, 5)},
    "Maasi Magam": {2026: (3, 2)},
    "Thiru Aadi Pooram": {2026: (8, 14)},
}
EXPECTED["Aadi Krithigai @sunrise"] = EXPECTED["Aadi Krithigai"]


def month_containing(year: int, rasi: int):
    # Mid-month probe: a Tamil month opens 13-17 of the Gregorian month
    # numbered rasi + 4 (Chithirai ~14 Apr), so the 28th is always inside it.
    gregorian_month = (rasi + 3) % 12 + 1
    return tamil_month_spans(date(year, gregorian_month, 28), 1, TZ, LAT, LON)[0]


def full_moon_rule(star: str, rasi: int, span, clock: _Clock) -> list[date]:
    """The withdrawn Family A rule as coded: the star's sunrise-named day
    whose nearest full moon has the Sun in `rasi` -- no solar-month test."""
    found = []
    lo, hi = clock.sunrise(span.start - timedelta(days=20)), clock.sunrise(span.end + timedelta(days=20))
    for occurrence in star_occurrences(star, lo, hi):
        day, _how, _jd = name_day(occurrence, "sunrise", clock)
        if full_moon_tamil_month_index(clock.sunrise(day)) == rasi:
            found.append(day)
    return found


y0, y1 = int(sys.argv[1]), int(sys.argv[2])
clock = _Clock(TZ, LAT, LON)
fired, unresolved, moved, mismatched = Counter(), [], [], []
for name, rasi, kind, value, kala, family_a in OBSERVANCES:
    print(f"\n== {name} ({kind} {value} at {kala})")
    for year in range(y0, y1 + 1):
        span = month_containing(year, rasi)
        sel = select_in_solar_month(kind, value, kala, span.start, TZ, LAT, LON)
        cands = ", ".join(
            f"{c.day:%d %b}[{c.named_by}{'' if c.lunar_month_begins_in_solar_month else ',prev-lunar'}]"
            for c in sel.candidates
        ) or "none"
        chosen = sel.selected[0] if len(sel.selected) == 1 else None
        shown = ", ".join(d.isoformat() for d in sel.selected) or "NONE"
        line = f"  {year} {span.start:%d %b}-{span.end:%d %b}: {cands:52s} -> {shown}"
        if sel.tie_break_fired:
            fired[name] += 1
            line += "  [tie-break FIRED]"
        if sel.unresolved:
            unresolved.append((name, year))
            line += "  !! UNRESOLVED"
        if family_a:
            old = full_moon_rule(str(value), rasi, span, clock)
            if old != [chosen]:
                moved.append((name, year, old, chosen))
                line += f"  MOVED (full-moon rule: {', '.join(f'{d:%d %b %Y}' for d in old) or 'none'})"
        exp = EXPECTED.get(name, {}).get(year)
        if exp is not None and chosen != date(year, *exp):
            mismatched.append((name, year, chosen, date(year, *exp)))
            line += f"  != expected {date(year, *exp):%d %b}"
        print(line)

print("\n== §0.1 fire counts (years the duplicate tie-break fired)")
for name, *_ in OBSERVANCES:
    print(f"  {name:26s} {fired[name]:3d} / {y1 - y0 + 1}")
print("\nunresolved:", unresolved or "none")
print("\nTask 3a/3b — Family A dates that differ from the full-moon rule:")
for name, year, old, new in moved:
    print(f"  {name} {year}: full-moon rule {[d.isoformat() for d in old]} -> tie-break {new}")
print("\nAcceptance-vector mismatches:")
for name, year, got, exp in mismatched:
    print(f"  {name} {year}: got {got}, expected {exp}")
