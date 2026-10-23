"""Engine vs. the owner-supplied 2027 almanac ("Tamil Dates 2027"), observance by observance.

Runs inside the vinaadi-dev-api container (pyswisseph). Read-only: no DB.

    docker cp scripts/audit/almanac_2027_vs_engine.py vinaadi-dev-api:/tmp/
    docker exec vinaadi-dev-api python /tmp/almanac_2027_vs_engine.py

For each monthly observance the almanac lists, every candidate *rule* the
engine could use is scored against it, so a disagreement is attributed to a
convention rather than reported as a bare miss:

* tithi days   — sunrise (udaya) tithi; dominant tithi over the solar day
* star days    — sunrise star; dominant star over the solar day; star at sunset
* Pradosham    — tithi at sunset (pradosha-kala)
* Sivarathiri  — tithi at nishita (civil midnight)

Evidence for FCA-04 (which instant names a star day) and FCA-06 (one almanac).
"""
import sys
from collections import defaultdict
from datetime import UTC, date, timedelta

sys.path.insert(0, "/app")

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_sun_moon_longitudes
from app.calculations.karinaal import karinaal_days_for_year
from app.services.panchangam_cache import calculate_daily_panchangam

TZ, LAT, LON = "Asia/Kolkata", 13.0827, 80.2707

# Transcribed from the PDF's monthly lists (pages 11-24). month -> days.
ALMANAC: dict[str, dict[int, list[int]]] = {
    "Amavasai": {1: [7], 2: [6], 3: [8], 4: [6], 5: [6], 6: [4], 7: [4], 8: [2, 31], 9: [30], 10: [29], 11: [28], 12: [27]},
    "Pournami": {1: [22], 2: [20], 3: [22], 4: [20], 5: [20], 6: [18], 7: [18], 8: [17], 9: [15], 10: [15], 11: [14], 12: [13]},
    "Pradosham": {1: [5, 20], 2: [3, 18], 3: [5, 20], 4: [4, 18], 5: [4, 17], 6: [2, 16], 7: [1, 15, 31], 8: [14, 29], 9: [13, 27], 10: [12, 27], 11: [11, 25], 12: [11, 25]},
    "Karthigai": {1: [18], 2: [14], 3: [13], 4: [9], 5: [7], 6: [3], 7: [1, 28], 8: [24], 9: [21], 10: [18], 11: [14], 12: [11]},
    "Ashtami": {1: [16, 29], 2: [14, 28], 3: [16, 30], 4: [14, 29], 5: [13, 29], 6: [11, 27], 7: [11, 27], 8: [9, 25], 9: [8, 23], 10: [8, 23], 11: [6, 21], 12: [6, 20]},
    "Navami": {1: [1, 17, 30], 2: [15], 3: [1, 17, 31], 4: [15, 30], 5: [14, 30], 6: [12, 28], 7: [12, 28], 8: [10, 26], 9: [9, 24], 10: [9, 24], 11: [7, 22], 12: [7, 21]},
    "Shasti": {1: [14], 2: [12], 3: [14], 4: [12], 5: [11], 6: [9], 7: [9], 8: [7], 9: [6], 10: [5], 11: [4], 12: [4]},
    "Sankatahara Chathurthi": {1: [25], 2: [24], 3: [25], 4: [24], 5: [24], 6: [22], 7: [22], 8: [20], 9: [19], 10: [18], 11: [17], 12: [16]},
    "Thiruvonam": {1: [10], 2: [6], 3: [5], 4: [2, 29], 5: [26], 6: [23], 7: [20], 8: [16], 9: [12], 10: [10], 11: [6], 12: [3]},
    "Masa Sivarathiri": {1: [5], 2: [4], 3: [6], 4: [5], 5: [4], 6: [3], 7: [2, 31], 8: [30], 9: [28], 10: [27], 11: [26], 12: [25]},
    "Ekadasi": {1: [3, 18], 2: [2, 17], 3: [4, 18], 4: [2, 17], 5: [2, 16], 6: [1, 14, 30], 7: [14, 29], 8: [12, 28], 9: [11, 26], 10: [11, 25], 11: [10, 24], 12: [9, 23]},
    "Chathurthi": {1: [11], 2: [10], 3: [12], 4: [10], 5: [9], 6: [8], 7: [7], 8: [5], 9: [4], 10: [3], 11: [2], 12: [2]},
    "Karinaal": {1: [15, 16, 17, 24, 30], 2: [27, 28], 3: [1, 20, 29], 4: [2, 19, 28], 5: [21, 30, 31], 6: [15, 20], 7: [18, 26], 8: [5, 18, 25], 9: [13], 10: [2, 15, 23], 11: [6, 17, 26], 12: [3, 21, 24]},
}


def almanac_dates(name: str) -> set[date]:
    return {date(2027, m, d) for m, days in ALMANAC[name].items() for d in days}


def in_paksha(t: int) -> tuple[int, str]:
    return (t, "SHUKLA") if t <= 15 else (t - 15, "KRISHNA")


def star_at(dt) -> int:
    sun, moon = calculate_sun_moon_longitudes(utc_datetime_to_julian_day(dt.astimezone(UTC)))
    return int(((moon % 360) + 1e-9) // (40 / 3)) + 1


def tithi_at(dt) -> int:
    sun, moon = calculate_sun_moon_longitudes(utc_datetime_to_julian_day(dt.astimezone(UTC)))
    return int(((moon - sun) % 360 + 1e-9) // 12) + 1


rules: dict[str, dict[str, set[date]]] = defaultdict(lambda: defaultdict(set))
previous_sunrise_tithi = calculate_daily_panchangam(date(2026, 12, 31), LAT, LON, TZ).tithi_number
d = date(2027, 1, 1)
while d <= date(2027, 12, 31):
    s = calculate_daily_panchangam(d, LAT, LON, TZ)
    sunset_star = star_at(s.sunset)
    # 2026-10-22 ruling Q6: the printed Amavasai/Pournami is the tithi at
    # sunrise, first of two; tharpanam is the Amavasai at aparahna.
    aparahna = s.sunrise + 0.7 * (s.sunset - s.sunrise)
    for special, name in ((30, "Amavasai"), (15, "Pournami")):
        if s.tithi_number == special:
            rules[name]["sunrise"].add(d)
            if previous_sunrise_tithi != special:
                rules[name]["sunrise-first"].add(d)
        if tithi_at(aparahna) == special:
            rules[name]["aparahna"].add(d)
    previous_sunrise_tithi = s.tithi_number
    for label, t in (("sunrise", s.tithi_number), ("dominant", s.dominant_tithi_number or s.tithi_number)):
        n, p = in_paksha(t)
        if n == 11:
            rules["Ekadasi"][label].add(d)
        if n == 8:
            rules["Ashtami"][label].add(d)
        if n == 9:
            rules["Navami"][label].add(d)
        if n == 6 and p == "SHUKLA":
            rules["Shasti"][label].add(d)
        if n == 4 and p == "SHUKLA":
            rules["Chathurthi"][label].add(d)
        if n == 4 and p == "KRISHNA":
            rules["Sankatahara Chathurthi"][label].add(d)
    n, p = in_paksha(s.pradhosham_tithi_number or s.tithi_number)
    if n == 13:
        rules["Pradosham"]["sunset"].add(d)
    n, p = in_paksha(s.nishita_tithi_number or s.tithi_number)
    if n == 14 and p == "KRISHNA":
        rules["Masa Sivarathiri"]["nishita"].add(d)
    # The engine's own day (the sunrise rule since the 2026-10-22 ruling; it
    # was the majority-of-the-civil-day rule, 10/13 and 10/12).
    if s.special_tithi_day_number == 30:
        rules["Amavasai"]["engine-day"].add(d)
    if s.special_tithi_day_number == 15:
        rules["Pournami"]["engine-day"].add(d)
    for star, name in ((3, "Karthigai"), (22, "Thiruvonam")):
        if s.nakshatra_number == star:
            rules[name]["sunrise"].add(d)
        if (s.dominant_nakshatra_number or s.nakshatra_number) == star:
            rules[name]["dominant"].add(d)
        if sunset_star == star:
            rules[name]["sunset"].add(d)
    d += timedelta(days=1)
rules["Karinaal"]["solar-rule"] = {k for k in karinaal_days_for_year(2027)}


def fmt(ds):
    return ", ".join(x.strftime("%d %b") for x in sorted(ds)) or "-"


for name in ALMANAC:
    want = almanac_dates(name)
    print(f"== {name} (almanac: {len(want)} days)")
    for rule, got in rules[name].items():
        miss, extra = want - got, got - want
        print(f"   {rule:13s} match {len(want & got):2d}/{len(want):2d}   missing: {fmt(miss)}   extra: {fmt(extra)}")


# ---- Karinaal in Tamil dates (ruling Q7: one offset everywhere, or Thai only?) ----
from app.calculations.karinaal import (  # noqa: E402
    KARINAAL_REFERENCE_LAT,
    KARINAAL_REFERENCE_LON,
    KARINAAL_REFERENCE_TZ,
    KARINAAL_TAMIL_DAYS,
)
from app.calculations.tamil_calendar import TAMIL_MONTHS, tamil_month_spans  # noqa: E402

spans = tamil_month_spans(date(2027, 1, 1), 14, KARINAAL_REFERENCE_TZ, KARINAAL_REFERENCE_LAT, KARINAAL_REFERENCE_LON)


def tamil_date_of(day: date) -> tuple[int, int] | None:
    for span in spans:
        if span.start <= day <= span.end:
            return span.rasi, (day - span.start).days + 1
    return None


by_month: dict[int, set[int]] = defaultdict(set)
for day in almanac_dates("Karinaal"):
    td = tamil_date_of(day)
    if td:
        by_month[td[0]].add(td[1])
print("\n== KARINAAL by Tamil month (almanac 2027 vs KARINAAL_TAMIL_DAYS)")
for rasi in sorted(by_month, key=lambda r: (r - 9) % 12):  # Thai first, as the year runs
    ours = set(KARINAAL_TAMIL_DAYS[rasi])
    theirs = by_month[rasi]
    shifted = {x + 1 for x in theirs}
    verdict = "same" if ours == theirs else ("ALL ONE DAY EARLY" if ours == shifted else "differs")
    print(f"   {TAMIL_MONTHS[rasi][0]:10s} almanac {sorted(theirs)}   ours {sorted(ours)}   {verdict}")


# ---- What the engine actually emits (the service's own festival builder) ----
from app.services.panchangam_service import _build_festivals  # noqa: E402

EMITTED = {
    "Karthigai": {"Karthigai Vratam"},
    "Thiruvonam": {"Thiruvonam Vratam"},
    "Sankatahara Chathurthi": {"Sankatahara Chaturthi", "Angarki Sankatahara Chaturthi"},
    "Masa Sivarathiri": {"Masa Sivarathiri", "Sivarathiri"},
    "Pradosham": {"Pradhosam", "Sani Pradhosam"},
    "Ekadasi": {"Ekadashi (Shukla)", "Ekadashi (Krishna)", "Vaikunta Ekadashi"},
    "Shasti": {"Sashti"},
    "Chathurthi": {"Chathurthi"},
}
emitted: dict[str, set[date]] = defaultdict(set)
d = date(2027, 1, 1)
while d <= date(2027, 12, 31):
    names = {f.name for f in _build_festivals(calculate_daily_panchangam(d, LAT, LON, TZ))}
    for key, wanted in EMITTED.items():
        if names & wanted:
            emitted[key].add(d)
    d += timedelta(days=1)
print("\n== ENGINE OUTPUT vs almanac")
for key in EMITTED:
    want, got = almanac_dates(key), emitted[key]
    print(f"   {key:24s} match {len(want & got):2d}/{len(want):2d}   missing: {fmt(want - got)}   extra: {fmt(got - want)}")
