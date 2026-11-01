"""Build the astrologer's fixture for ruling Q7 (DOCTRINE_DECISIONS_V1 §18): synthetic charts on
which Ruchaka and Sevvai form on the same Mars, under the default (Tamil five)
house set. One question goes with it: is this Ruchaka, Sevvai, or both?

Synthetic population only (seeded random instants 1960-2010, random lagna). Prints
JSON; no person, no birth data, no instant (only sign placements).

Run (Bash; PowerShell garbles the UTF-8):  docker exec -i vinaadi-dev-api python - < scripts/audit/ruchaka_sevvai_fixture.py > docs/astrologer_fixtures/ruchaka_sevvai_2026-10-30.json
"""
from __future__ import annotations

import json
import random

from app.calculations._yoga_detect import detect_pancha_mahapurusha
from app.calculations._yoga_dosham import detect_sevvai_dosham
from app.calculations.astro import house_from_reference
from app.calculations.ephemeris import calculate_sidereal_planets

RASI = ("Mesham", "Rishabam", "Mithunam", "Kadagam", "Simmam", "Kanni",
        "Thulam", "Viruchigam", "Dhanusu", "Magaram", "Kumbam", "Meenam")

rng = random.Random(1030)
charts = []
for n in range(2000):
    snap = calculate_sidereal_planets(rng.uniform(2_436_934.5, 2_455_197.5))
    planets = {g: b.rasi for g, b in snap.bodies.items()}
    lagna = rng.randint(1, 12)
    sevvai = detect_sevvai_dosham(planets, lagna)
    ruchaka = any(y.is_present and y.name == "RUCHAKA_YOGA" for y in detect_pancha_mahapurusha(planets, lagna))
    if not (sevvai.is_present and ruchaka):
        continue
    charts.append({
        "id": f"RS-{len(charts) + 1:03d}",
        "lagna": RASI[lagna - 1],
        "mars": RASI[planets["MARS"] - 1],
        "mars_house_from_lagna": house_from_reference(lagna, planets["MARS"]),
        "placements": {g: RASI[r - 1] for g, r in sorted(planets.items())},
        "engine_today": {
            "sevvai_strength": sevvai.strength,
            "sevvai_mitigations": sevvai.cancellation_factors,
            "ruchaka": True,
        },
        "astrologer_verdict": "",
    })

print(json.dumps({
    "question": "When Mars sits in the 4th or 7th from the Lagna in Mesham, Viruchigam or Magaram, "
                "is this Ruchaka, Sevvai, or both? Please mark each chart.",
    "ruling": "DOCTRINE_DECISIONS_V1.md §18, Q7. Until ruled, O-18 governs: both shown at full weight.",
    "population": "2,000 synthetic charts, seeded (1030), 1960-2010, random lagna; sign placements only",
    "count": len(charts),
    "charts": charts,
}, ensure_ascii=False, indent=2))
