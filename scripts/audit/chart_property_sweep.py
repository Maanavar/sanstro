"""Property sweep of the natal chart builder against raw swisseph. Synthetic profiles only."""
import random
import sys
import traceback
from datetime import date, datetime, time
from zoneinfo import ZoneInfo

sys.path.insert(0, "/app")
import swisseph as swe

from app.services._chart_build import _chart_response_from_profile


class P(dict):
    def __getattr__(self, k):
        if k in self:
            return self[k]
        raise AttributeError(k)


swe.set_ephe_path("/app/ephe")
swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)

PLACES = [  # (lat, lon, tz) — synthetic test locations, not anyone's birthplace
    (13.08, 80.27, "Asia/Kolkata"), (9.93, 78.12, "Asia/Kolkata"), (1.35, 103.82, "Asia/Singapore"),
    (51.51, -0.13, "Europe/London"), (40.71, -74.01, "America/New_York"), (-33.87, 151.21, "Australia/Sydney"),
    (43.65, -79.38, "America/Toronto"), (59.33, 18.07, "Europe/Stockholm"), (25.20, 55.27, "Asia/Dubai"),
    (6.93, 79.85, "Asia/Colombo"), (3.14, 101.69, "Asia/Kuala_Lumpur"), (-26.20, 28.05, "Africa/Johannesburg"),
]
random.seed(20261022)
cases = []
for _ in range(300):
    lat, lon, tz = random.choice(PLACES)
    d = date(random.randint(1940, 2025), random.randint(1, 12), random.randint(1, 28))
    t = time(random.randint(0, 23), random.randint(0, 59))
    cases.append((d, t, lat, lon, tz))
# hand-picked edges: midnight, IST/UTC date seam, leap day, DST gaps
cases += [
    (date(2000, 2, 29), time(0, 0), 13.08, 80.27, "Asia/Kolkata"),
    (date(1990, 1, 1), time(5, 29), 13.08, 80.27, "Asia/Kolkata"),
    (date(1990, 1, 1), time(23, 59), 13.08, 80.27, "Asia/Kolkata"),
    (date(2021, 3, 28), time(1, 30), 51.51, -0.13, "Europe/London"),   # nonexistent local time
    (date(2021, 10, 31), time(1, 30), 51.51, -0.13, "Europe/London"),  # ambiguous local time
    (date(1985, 6, 21), time(12, 0), 69.65, 18.96, "Europe/Oslo"),     # Arctic (Tromso)
]

fails, errors = [], []
for i, (d, t, lat, lon, tz) in enumerate(cases):
    profile = P({
        "birth_profile_id": None, "display_name": f"Synthetic {i}", "birth_date_local": d,
        "birth_time_local": t, "birth_timezone": tz, "birth_latitude": lat, "birth_longitude": lon,
        "birth_place_name": "Synthetic", "birth_place": "Synthetic", "birth_time_source": "EXACT", "calendar_input_type": "gregorian", "language_preference": "ta-en", "gender_for_traditional_rules": random.choice(["male", "female"]),
    })
    try:
        resp = _chart_response_from_profile(profile, "test")
    except Exception as exc:  # noqa: BLE001
        errors.append(f"{d} {t} {tz} lat={lat}: {type(exc).__name__}: {exc}")
        if len(errors) <= 2:
            traceback.print_exc()
        continue
    data = resp.data
    utc = datetime.combine(d, t, tzinfo=ZoneInfo(tz)).astimezone(ZoneInfo("UTC"))
    jd = swe.julday(utc.year, utc.month, utc.day, utc.hour + utc.minute / 60 + utc.second / 3600)
    moon = swe.calc_ut(jd, swe.MOON, swe.FLG_SIDEREAL | swe.FLG_SWIEPH)[0][0]
    _, ascmc = swe.houses_ex(jd, lat, lon, b"W", swe.FLG_SIDEREAL)
    asc = ascmc[0]
    exp_lagna = int(asc // 30) + 1
    exp_nak = int(moon // (40 / 3)) + 1
    m = next(p for p in data.planets if p.graha == "MOON")
    if data.lagna.rasi != exp_lagna and abs((asc % 30) - 15) < 14.99:
        fails.append(f"LAGNA {d} {t} {tz}: engine {data.lagna.rasi} vs {exp_lagna} (asc {asc:.3f})")
    if m.nakshatra != exp_nak and abs(moon % (40 / 3) - 20 / 3) < 20 / 3 - 0.001:
        fails.append(f"MOON-NAK {d} {t} {tz}: engine {m.nakshatra} vs {exp_nak}")
    dasha = getattr(data, "dasha", None) or getattr(data, "vimshottari", None)
    if dasha is not None and hasattr(dasha, "balance_years_at_birth"):
        lords = ["KETU", "VENUS", "SUN", "MOON", "MARS", "RAHU", "JUPITER", "SATURN", "MERCURY"]
        years = {"KETU": 7, "VENUS": 20, "SUN": 6, "MOON": 10, "MARS": 7, "RAHU": 18, "JUPITER": 16, "SATURN": 19, "MERCURY": 17}
        lord = lords[(exp_nak - 1) % 9]
        exp_bal = (1 - (moon % (40 / 3)) / (40 / 3)) * years[lord]
        if abs(dasha.balance_years_at_birth - exp_bal) > 0.01:
            fails.append(f"DASHA {d} {t}: balance {dasha.balance_years_at_birth:.3f} vs {exp_bal:.3f}")

print(f"cases={len(cases)} fails={len(fails)} errors={len(errors)}")
print("\n".join(fails[:20]))
print("\n".join(errors[:20]))
print("response fields:", sorted(type(data).model_fields)[:60])
