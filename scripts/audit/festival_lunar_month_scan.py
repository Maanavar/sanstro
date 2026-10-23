"""Festival-date audit: engine rule (solar Tamil month) vs lunar (amanta) month.

Runs inside the vinaadi-dev-api container (pyswisseph, Linux). Read-only: no DB.
"""
import sys
from collections import defaultdict
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

sys.path.insert(0, "/app")

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_rise_transit_jd, calculate_sun_moon_longitudes
from app.calculations.panchangam import _tithi_number_at_jd, special_tithi_day_from_sunrises
from app.calculations.tamil_calendar import tamil_solar_date
from app.constants.astrology import NAKSHATRA_NAMES
from app.services.panchangam_cache import calculate_daily_panchangam
from app.services.panchangam_service import _build_festivals

TZ = "Asia/Kolkata"
LAT, LON = 13.0827, 80.2707
tz = ZoneInfo(TZ)

START, END = date(int(sys.argv[1]), 1, 1), date(int(sys.argv[2]), 12, 31)


def midnight_jd(d):
    return utc_datetime_to_julian_day(datetime.combine(d, time(0, 0), tzinfo=tz).astimezone(UTC))


def elong(jd):
    s, m = calculate_sun_moon_longitudes(jd)
    return (m - s) % 360.0, s, m


# ---- new moons (reference lunar months) ----
new_moons = []
jd = midnight_jd(START - timedelta(days=60))
end_jd = midnight_jd(END + timedelta(days=60))
prev = elong(jd)[0]
while jd < end_jd:
    nxt = jd + 0.5
    e = elong(nxt)[0]
    if e < prev:  # wrapped through 0
        lo, hi = jd, nxt
        for _ in range(50):
            mid = (lo + hi) / 2
            if elong(mid)[0] > 180:
                lo = mid
            else:
                hi = mid
        new_moons.append(hi)
    prev, jd = e, nxt

LUNAR = ["Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
         "Ashvina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna"]
# month starting at a new moon with Sun in rasi r (0=Mesha) is LUNAR[(r+1)%12]
months = []
for i in range(len(new_moons) - 1):
    r0 = int(elong(new_moons[i])[1] // 30) % 12
    r1 = int(elong(new_moons[i + 1])[1] // 30) % 12
    adhika = r0 == r1  # no sankranti inside -> adhika
    months.append((new_moons[i], new_moons[i + 1], LUNAR[(r0 + 1) % 12], adhika))


def lunar_month_at(jd):
    for a, b, name, adh in months:
        if a <= jd < b:
            return name, adh
    return None, None


TRACK = {
    "Vinayagar Chaturthi": ("Bhadrapada", 4),
    "Deepavali": ("Ashvina", 29),
    "Skanda Sashti": ("Kartika", 6),
    "Krishna Jayanthi": ("Shravana", 23),
    "Sivarathiri": ("Magha", 29),
    "Mahalaya Amavasai": ("Bhadrapada", 30),
}

engine = defaultdict(list)   # (fest, year) -> [dates]
ref = defaultdict(list)
prev_tithi = None
d = START
while d <= END:
    m = midnight_jd(d)
    sr = calculate_rise_transit_jd(m, LAT, LON, rise=True)
    tithi = _tithi_number_at_jd(sr)
    paksha = "SHUKLA" if tithi <= 15 else "KRISHNA"
    _, _, moon = elong(sr)
    nak = NAKSHATRA_NAMES[int((moon + 1e-9) // (40 / 3))]
    mi, dom = tamil_solar_date(d, TZ, LAT, LON)
    nishita = _tithi_number_at_jd(midnight_jd(d + timedelta(days=1)))
    special = special_tithi_day_from_sunrises(
        tithi,
        _tithi_number_at_jd(calculate_rise_transit_jd(midnight_jd(d - timedelta(days=1)), LAT, LON, rise=True)),
        _tithi_number_at_jd(calculate_rise_transit_jd(midnight_jd(d + timedelta(days=1)), LAT, LON, rise=True)),
    )
    # Engine side: the service's own builder (lunar month, observance instants
    # such as Krishna Jayanthi's true midnight and Mahalaya's aparahna). The
    # reference side below keeps this script's own independent new-moon
    # bisection and sunrise tithi, so a one-day kala shift is tolerated there.
    snap = calculate_daily_panchangam(d, LAT, LON, TZ)
    prev_snap = calculate_daily_panchangam(d - timedelta(days=1), LAT, LON, TZ)
    fs = _build_festivals(snap, previous_day_snapshot=prev_snap)
    names = {f.name for f in fs if "hindu" in f.tags or f.category == "hindu"}
    for fest in TRACK:
        if fest in names:
            engine[(fest, d.year)].append((d, mi, dom))
    # reference: lunar month at sunrise (nishita for Sivarathiri)
    for fest, (lm, t) in TRACK.items():
        probe_jd, probe_t = (midnight_jd(d + timedelta(days=1)), nishita) if fest == "Sivarathiri" else (sr, tithi)
        if fest == "Mahalaya Amavasai":
            probe_t = special if special == 30 else -1
        name, adh = lunar_month_at(probe_jd)
        if name == lm and not adh and probe_t == t:
            ref[(fest, d.year)].append((d, mi, dom))
    prev_tithi = (tithi, paksha)
    d += timedelta(days=1)

TM = ["Chithirai", "Vaikasi", "Aani", "Aadi", "Aavani", "Purattasi", "Aippasi",
      "Karthigai", "Margazhi", "Thai", "Maasi", "Panguni"]


def fmt(rows):
    return ", ".join(f"{r[0].isoformat()} ({TM[r[1]]} {r[2]})" for r in rows) or "NONE"


for fest in TRACK:
    bad = 0
    for y in range(START.year, END.year + 1):
        e, r = engine[(fest, y)], ref[(fest, y)]
        if [x[0] for x in e] != [x[0] for x in r]:
            # tolerate a +/-1 day sunrise-vs-other-kala shift with the same month
            if len(e) == len(r) == 1 and abs((e[0][0] - r[0][0]).days) <= 1:
                continue
            bad += 1
            print(f"{fest:22s} {y}: engine={fmt(e)} | lunar={fmt(r)}")
    print(f"== {fest}: {bad} year(s) differ in {START.year}-{END.year}\n")
