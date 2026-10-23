"""Rulings 2026-10-22 round two, §2 / OPEN-1: which civil date carries the
Krishna Jayanthi night, under the three candidate labels.

For each year: the Krishna Ashtami of nija Shravana, its start and end, the
night selected by the §2 tie-break (Ashtami / Rohini at nisheetha, later if
neither), and that night's date under

  (a) NISHEETHA — the civil date of the nisheetha instant (§2 as written)
  (b) EVENING   — the civil date of the evening that opens the night
                  (the engine before round two)
  (c) SUNRISE   — the day Ashtami holds at sunrise, first of two

beside the round-two acceptance vectors. Read-only; vinaadi-dev-api.

    docker cp scripts/audit/jayanthi_label_scan.py vinaadi-dev-api:/tmp/
    docker exec vinaadi-dev-api python /tmp/jayanthi_label_scan.py 2020 2045
"""
import sys
from datetime import date

sys.path.insert(0, "/app")

from app.calculations.lunar_month import LUNAR_SHRAVANA, amanta_month_at
from app.calculations.observance_days import _Clock, name_day, tithi_occurrences
from app.calculations.panchangam import _tithi_number_at_jd
from app.services.panchangam_service import _star_at_jd

TZ, LAT, LON = "Asia/Kolkata", 13.0827, 80.2707
VECTORS = {2023: (9, 6), 2024: (8, 26), 2025: (8, 15), 2026: (9, 4), 2027: (8, 25), 2028: (8, 13),
           2029: (9, 1), 2030: (8, 21), 2031: (8, 9), 2032: (8, 27), 2033: (8, 17)}
clock = _Clock(TZ, LAT, LON)


def at(jd):
    from app.calculations.astro import julian_day_to_utc_datetime
    return julian_day_to_utc_datetime(jd).astimezone(clock.tz)


y0, y1 = int(sys.argv[1]), int(sys.argv[2])
score = {"a": 0, "b": 0, "c": 0}
print("year  Ashtami (IST)                      nights@nisheetha            (a)NISH  (b)EVE   (c)RISE  vector")
for year in range(y0, y1 + 1):
    lo, hi = clock.sunrise(date(year, 7, 15)), clock.sunrise(date(year, 9, 25))
    for occ in tithi_occurrences(23, lo, hi):
        month = amanta_month_at(occ.start_jd)
        if month.index != LUNAR_SHRAVANA or month.is_adhika:
            continue
        first = at(occ.start_jd).date()
        nights = []  # (evening date, nisheetha jd)
        for k in range(-2, 3):
            evening = date.fromordinal(first.toordinal() + k)
            sunset = clock.sunset(evening)
            nisheetha = (sunset + clock.sunrise(date.fromordinal(evening.toordinal() + 1))) / 2
            nights.append((evening, nisheetha, _tithi_number_at_jd(nisheetha), _star_at_jd(nisheetha)))
        holding = [n for n in nights if n[2] == 23]
        if len(holding) == 1:
            chosen, note = holding[0], ""
        else:
            # Two nisheethas, or none: the bracketing pair; Rohini, else the later.
            if holding:
                pair = holding
            else:
                pair = [n for i, n in enumerate(nights[:-1]) if n[2] < 23 < nights[i + 1][2]]
                pair = [pair[0], nights[nights.index(pair[0]) + 1]]
            rohini = [n for n in pair if n[3] == "ROHINI"]
            chosen = rohini[0] if len(rohini) == 1 else pair[-1]
            note = f" tie({'two' if holding else 'none'}{',rohini' if len(rohini) == 1 else ''})"
        nish = at(chosen[1]).date()
        sunrise_day, _how, _jd = name_day(occ, "sunrise", clock)
        vec = date(year, *VECTORS[year]) if year in VECTORS else None
        labels = {"a": nish, "b": chosen[0], "c": sunrise_day}
        if vec:
            for k, v in labels.items():
                score[k] += v == vec
        marks = "  ".join(f"{v:%d %b}{'*' if v == vec else ' '}" for v in labels.values())
        print(f"{year}  {at(occ.start_jd):%d %b %H:%M} -> {at(occ.end_jd):%d %b %H:%M}"
              f"   night {chosen[0]:%d %b} {at(chosen[1]):%d %b %H:%M} {chosen[3][:7]:7s}{note:14s}"
              f"  {marks}  {vec:%d %b}" if vec else
              f"{year}  {at(occ.start_jd):%d %b %H:%M} -> {at(occ.end_jd):%d %b %H:%M}"
              f"   night {chosen[0]:%d %b} {at(chosen[1]):%d %b %H:%M} {chosen[3][:7]:7s}{note:14s}  {marks}")
print(f"\nmatches with the {len(VECTORS)} vectors: (a) nisheetha {score['a']}, (b) evening {score['b']}, (c) sunrise {score['c']}")
