"""FCA-07 gate: each yearly observance once a year, and on the published day.

Runs inside the vinaadi-dev-api container (pyswisseph). Read-only: no DB.

    docker cp scripts/audit/yearly_observances_scan.py vinaadi-dev-api:/tmp/
    docker exec vinaadi-dev-api python /tmp/yearly_observances_scan.py 2020 2045

Prints every day each observance fires, per year, beside the reference date,
then (rulings 2026-10-22 round two):

* §0.1 — per selection rule, the number of years in which it fired. A
  tie-break firing in more than a handful of years is a bug report.
* §6 — Ayudha Pooja and Vijayadasami on consecutive days, in that order.
* §2 — Krishna Jayanthi's printed day is the day Ashtami holds at sunrise.

References: 2026 from app/data/calendar_categories_2026.py, 2027 the
owner-supplied almanac "Tamil Dates 2027", 2023-2033 the acceptance vectors of
the round-two rulings. A count other than 1, or a day other than the
reference, is a defect unless the row is marked as a reported conflict.
"""
import sys
from collections import defaultdict
from datetime import date, timedelta

sys.path.insert(0, "/app")

from app.calculations.festivals import SELECTION_RULES, rule_fires
from app.services.panchangam_cache import calculate_daily_panchangam
from app.services.panchangam_service import _build_festivals

TZ, LAT, LON = "Asia/Kolkata", 13.0827, 80.2707


def ymd(rows: dict[int, tuple[int, int]]) -> dict[int, date]:
    return {y: date(y, m, d) for y, (m, d) in rows.items()}


REFERENCE = {
    "Bhogi": {2027: date(2027, 1, 14)},
    "Thai Pongal": {2026: date(2026, 1, 15), 2027: date(2027, 1, 15)},
    "Mattu Pongal": {2026: date(2026, 1, 16), 2027: date(2027, 1, 16)},
    "Kaanum Pongal": {2026: date(2026, 1, 17), 2027: date(2027, 1, 17)},
    "Thai Amavasai": {2026: date(2026, 1, 18), 2027: date(2027, 2, 6)},
    # Round two §3 vectors (2023 is the two-Amavasai year).
    "Aadi Amavasai": ymd({2023: (8, 15), 2024: (8, 4), 2025: (7, 24), 2026: (8, 12), 2027: (8, 2),
                          2028: (7, 21), 2029: (8, 9), 2030: (7, 30), 2031: (7, 19), 2032: (8, 5),
                          2033: (7, 25)}),
    "Thiru Aadi Pooram": {2026: date(2026, 8, 14), 2027: date(2027, 8, 5)},
    # Round two §3 vectors. OPEN-2: they fit the star at sunrise 10/11 and at
    # pradosham (the ruled kala, coded) 4/11.
    "Aadi Krithigai": ymd({2023: (8, 9), 2024: (7, 30), 2025: (7, 20), 2026: (8, 7), 2027: (7, 28),
                           2028: (8, 14), 2029: (8, 4), 2030: (7, 25), 2031: (8, 11), 2032: (7, 31),
                           2033: (7, 21)}),
    # §9.1: 2025 is 8 Aug. 2026: the ruled rule gives Friday 28 Aug (the
    # Pournami itself); the curated row is 21 Aug -- reported conflict.
    "Varalakshmi Vratham": {2025: date(2025, 8, 8), 2026: date(2026, 8, 21), 2027: date(2027, 8, 13)},
    "Navarathiri Begins": {2026: date(2026, 10, 11)},
    # §6: 2045 is the two-aparahna year (first taken); 2022 the no-aparahna.
    "Ayudha Pooja": {2026: date(2026, 10, 19), 2027: date(2027, 10, 8), 2045: date(2045, 10, 18)},
    "Saraswathi Poojai": {2026: date(2026, 10, 19)},
    "Vijayadasami": {2022: date(2022, 10, 5), 2026: date(2026, 10, 20), 2027: date(2027, 10, 9)},
    "Arudra Darisanam": {2026: date(2026, 12, 24)},
    "Masa Sivarathiri": {},
    "Thai Poosam": {2025: date(2025, 2, 11), 2026: date(2026, 2, 1)},
    # §9.3 expects 2 Mar 2026; Magam holds only the 3 Mar sunrise (07:51 on
    # 2 Mar to 07:31 on 3 Mar), so the sunrise kala gives 3 Mar -- reported.
    "Maasi Magam": {2026: date(2026, 3, 2)},
    "Panguni Uthiram": {2026: date(2026, 4, 1)},
    "Vaigasi Visakam": {2026: date(2026, 5, 30)},
    # Round two §4 vectors. 2032: §3 picks 14 Dec over 17 Nov -- reported.
    "Karthigai Deepam": ymd({2023: (11, 26), 2024: (12, 13), 2025: (12, 4), 2026: (11, 24), 2027: (12, 11),
                             2028: (12, 1), 2029: (11, 20), 2030: (12, 8), 2031: (11, 28), 2032: (11, 17),
                             2033: (12, 5)}),
    # Round two §2 vectors. The printed label is HELD at the evening that
    # opens the night (festivals._JAYANTHI_LABEL): it matches 8 of 11; §2's
    # nisheetha date matches 3 (scripts/audit/jayanthi_label_scan.py).
    "Krishna Jayanthi": ymd({2023: (9, 6), 2024: (8, 26), 2025: (8, 15), 2026: (9, 4), 2027: (8, 25),
                             2028: (8, 13), 2029: (9, 1), 2030: (8, 21), 2031: (8, 9), 2032: (8, 27),
                             2033: (8, 17)}),
    "Mahalaya Amavasai": {2026: date(2026, 10, 10), 2027: date(2027, 9, 29)},
}
TRACK = set(REFERENCE) - {"Masa Sivarathiri"}
# Margazhi straddles New Year, so Arudra Darisanam is once per Margazhi, not per
# calendar year: 2027 has none (3 Jan 2026 and 11 Jan 2028 bracket it).
PER_TAMIL_YEAR = {"Arudra Darisanam"}
# Rows that differ from a reference for a reason already reported to the
# astrologer (docs/REVIEW_REQUESTS_2026-10-22.md, round-two report).
REPORTED = {
    ("Maasi Magam", 2026), ("Varalakshmi Vratham", 2026), ("Karthigai Deepam", 2032),
    # The held Family A test cannot break these ties (OPEN-3 / F8).
    ("Vaigasi Visakam", 2022), ("Vaigasi Visakam", 2041),
    # 15 Aug by rule; 16 Aug is the hand-entered 2025 row in festivals._YEARLY_FESTIVALS.
    ("Krishna Jayanthi", 2025),
    *(("Krishna Jayanthi", y) for y in (2027, 2029, 2030)),
    *(("Aadi Krithigai", y) for y in (2024, 2025, 2028, 2029, 2030, 2031, 2032)),
}

y0, y1 = int(sys.argv[1]), int(sys.argv[2])
found: dict[tuple[str, int], list[date]] = defaultdict(list)
fired_years: dict[str, set[int]] = defaultdict(set)
ashtami_at_sunrise: dict[date, bool] = {}
d = date(y0, 1, 1)
while d <= date(y1, 12, 31):
    prev = calculate_daily_panchangam(d - timedelta(days=1), LAT, LON, TZ)
    snap = calculate_daily_panchangam(d, LAT, LON, TZ)
    with rule_fires() as fired:
        names = {f.name for f in _build_festivals(snap, previous_day_snapshot=prev)}
    for rule in fired:
        fired_years[rule].add(d.year)
    for n in names & TRACK:
        found[(n, d.year)].append(d)
    if "Krishna Jayanthi" in names:
        ashtami_at_sunrise[d] = snap.tithi_number == 23
    d += timedelta(days=1)

bad = 0
for name in sorted(TRACK):
    for y in range(y0, y1 + 1):
        days = found[(name, y)]
        ref = REFERENCE[name].get(y)
        if name in PER_TAMIL_YEAR:
            ok = ref is None or ref in days
        else:
            ok = len(days) == 1 and (ref is None or days[0] == ref)
        mark = "  " if ok else (".." if (name, y) in REPORTED else "!!")
        bad += mark == "!!"
        print(f"{mark} {name:22s} {y}: {', '.join(x.isoformat() for x in days) or 'NONE':24s} ref={ref}")

print("\n§6 — Ayudha Pooja then Vijayadasami on consecutive days:")
for y in range(y0, y1 + 1):
    ayudha, vijaya = found[("Ayudha Pooja", y)], found[("Vijayadasami", y)]
    ok = len(ayudha) == len(vijaya) == 1 and vijaya[0] - ayudha[0] == timedelta(days=1)
    # 2045: §6's own "two aparahnas -> the first" puts Ayudha Pooja on 18 Oct
    # and Vijayadasami on 20 Oct (Dasami holds only the 20th's aparahna). Reported.
    reported = y == 2045
    bad += not ok and not reported
    if not ok:
        print(f"{'..' if reported else '!!'} {y}: Ayudha {ayudha} Vijayadasami {vijaya}")
print("   checked", y1 - y0 + 1, "years")

# §2 asks to assert this; it holds under none of the candidate labels in
# every year, so it is reported, not counted (scripts/audit/jayanthi_label_scan.py).
print("\n§2 cross-check — Krishna Jayanthi printed on the day Ashtami holds at sunrise:")
for day, holds in sorted(ashtami_at_sunrise.items()):
    if not holds:
        print(f".. {day}: Ashtami does not hold this sunrise")
print("   checked", len(ashtami_at_sunrise), "days")

print(f"\n§0.1 — years each selection rule fired, of {y1 - y0 + 1}:")
for rule, text in SELECTION_RULES.items():
    years = sorted(fired_years.get(rule, ()))
    print(f"  {len(years):3d}  {rule:34s} {', '.join(map(str, years))}")
    print(f"       {text}")
print("\nproblems:", bad)
