"""Curated 2026 SEO event dates vs. what the engine's own daily rules label (Chennai)."""
import sys
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

sys.path.insert(0, "/app")

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_rise_transit_jd, calculate_sun_moon_longitudes
from app.calculations.panchangam import _tithi_number_at_jd
from app.calculations.tamil_calendar import tamil_solar_date
from app.constants.astrology import NAKSHATRA_NAMES
from app.data.panchangam_events_2026 import PANCHANGAM_EVENTS_2026
from app.services.panchangam_cache import calculate_daily_panchangam
from app.services.panchangam_service import _build_festivals

TZ, LAT, LON = "Asia/Kolkata", 13.0827, 80.2707
tz = ZoneInfo(TZ)


def mjd(d):
    return utc_datetime_to_julian_day(datetime.combine(d, time(0, 0), tzinfo=tz).astimezone(UTC))


RULES = {
    "pournami": lambda c: c["special"] == 15,
    "amavasai": lambda c: c["special"] == 30,
    "pradosham": lambda c: bool(c["names"] & {"Pradhosam", "Sani Pradhosam"}),
    "ekadhasi": lambda c: any(n.startswith("Ekadashi") or n == "Vaikunta Ekadashi" for n in c["names"]),
    "sashti": lambda c: "Sashti" in c["names"],
    "karthigai": lambda c: "Karthigai Vratam" in c["names"],
    "thiruvonam": lambda c: "Thiruvonam Vratam" in c["names"],
    "chathurthi": lambda c: "Chathurthi" in c["names"],
    "sankatahara-chathurthi": lambda c: any("Sankatahara" in n for n in c["names"]),
    "ashtami": lambda c: c["tithi"] in (8, 23),
    "navami": lambda c: c["tithi"] in (9, 24),
    "maadha-sivarathiri": lambda c: bool(c["names"] & {"Masa Sivarathiri", "Sivarathiri"}),
    "chandra-darisanam": lambda c: c["tithi"] == 2 and c["prev_tithi"] in (30, 1),
}

days = {}
prev = None
d = date(2026, 1, 1)
while d <= date(2026, 12, 31):
    sr = calculate_rise_transit_jd(mjd(d), LAT, LON, rise=True)
    ss = calculate_rise_transit_jd(sr, LAT, LON, rise=False)
    tithi = _tithi_number_at_jd(sr)
    paksha = "SHUKLA" if tithi <= 15 else "KRISHNA"
    moon = calculate_sun_moon_longitudes(sr)[1]
    nak = NAKSHATRA_NAMES[int((moon + 1e-9) // (40 / 3))]
    mi, dom = tamil_solar_date(d, TZ, LAT, LON)
    nishita = _tithi_number_at_jd(mjd(d + timedelta(days=1)))
    # Names come from the service's own builder (lunar month, observance
    # instants, Ekadashi dedup) — a hand-assembled argument list here would
    # silently score a different engine than the one users see.
    snap = calculate_daily_panchangam(d, LAT, LON, TZ)
    special = snap.special_tithi_day_number
    prev_snap = calculate_daily_panchangam(d - timedelta(days=1), LAT, LON, TZ)
    names = {f.name for f in _build_festivals(snap, previous_day_snapshot=prev_snap)}
    days[d] = {"tithi": tithi, "special": special, "nishita": nishita, "names": names,
               "prev_tithi": prev[0] if prev else None, "tamil": (mi, dom)}
    prev = (tithi, paksha)
    d += timedelta(days=1)

print("curated keys:", sorted(PANCHANGAM_EVENTS_2026))
tamil_mismatch = 0
for key, rows in sorted(PANCHANGAM_EVENTS_2026.items()):
    curated = {date.fromisoformat(r["date"]) for r in rows}
    for r in rows:
        dd = date.fromisoformat(r["date"])
        if (r.get("tamilMonthIndex"), r.get("tamilDay")) != days[dd]["tamil"]:
            tamil_mismatch += 1
    rule = RULES.get(key)
    if rule is None:
        print(f"{key:24s} curated={len(curated):3d}  (no engine rule to compare)")
        continue
    engine = {dd for dd, c in days.items() if rule(c)}
    only_c, only_e = sorted(curated - engine), sorted(engine - curated)
    print(f"{key:24s} curated={len(curated):3d} engine={len(engine):3d} "
          f"curated-only={[x.isoformat() for x in only_c]} engine-only={[x.isoformat() for x in only_e]}")
print("rows whose stored Tamil date differs from the engine's tamil_solar_date:", tamil_mismatch)
