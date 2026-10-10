"""No machine code or wrong-script name reaches the chart-explanation prose.

The explanation's prose is composed server-side, so the web's DXA-08 rasi
ratchet (which scans frontend source) never sees it. Two leak shapes were live
on every chart (FTR-01, docs/FULL_READING_STORY_MODE_PLAN_2026-10-04.md):

* an UPPER_CASE code inside an English sentence — "House 1 in KADAGAM",
  "Sun sits in POOSAM";
* a Latin rasi/nakshatra name inside a Tamil sentence — "நவாம்சத்தில் Simmam",
  which no casing regex catches. That is the half DXA-08 missed, so the Tamil
  check is case-insensitive.

The walk covers every BiText in the payload, for three synthetic charts, so a
new section that interpolates a name is caught without being listed here.
"""
from __future__ import annotations

import re

import pytest

from app.calculations.astro import RASI_NAMES
from app.calculations.display_names import NAKSHATRA_EN, RASI_EN
from app.constants.astrology import NAKSHATRA_NAMES

_PROFILES = [
    ("1991-07-22", "06:30:00", 13.0827, 80.2707),
    ("1984-02-11", "21:15:00", 9.9252, 78.1198),
    ("2001-11-03", "13:40:00", 11.0168, 76.9558),
]


def _bitexts(node, out: list[tuple[str, str]]) -> None:
    if isinstance(node, dict):
        if isinstance(node.get("ta"), str) and isinstance(node.get("en"), str):
            out.append((node["ta"], node["en"]))
            return
        for value in node.values():
            _bitexts(value, out)
    elif isinstance(node, list):
        for value in node:
            _bitexts(value, out)


def _explanation(client, birth_date: str, birth_time: str, lat: float, lon: float) -> dict:
    profile = {
        "ownerUserId": "33333333-3333-3333-3333-333333333333",
        "displayName": "Synthetic Reader",
        "birthDateLocal": birth_date,
        "birthTimeLocal": birth_time,
        "birthPlace": "Synthetic, Tamil Nadu, India",
        "birthLatitude": lat,
        "birthLongitude": lon,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    }
    chart_id = client.post("/api/v1/birth-profiles", json=profile).json()["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/explanation", params={"asOf": "2026-10-04"})
    assert response.status_code == 200
    return response.json()["data"]


def _names(data: dict) -> set[str]:
    """Every Latin spelling a rasi or nakshatra can arrive in."""
    names = {*RASI_NAMES.values(), *RASI_EN.values(), *NAKSHATRA_NAMES, *NAKSHATRA_EN.values()}
    for planet in data["planets"]:
        names.add(planet["rasiName"])
        names.add(planet["nakshatraName"])
    return {n for n in names if n}


@pytest.mark.parametrize("profile", _PROFILES)
def test_no_code_or_latin_name_in_explanation_prose(client, profile) -> None:
    data = _explanation(client, *profile)
    names = _names(data)
    latin_in_tamil = re.compile(r"\b(" + "|".join(sorted(map(re.escape, names), key=len, reverse=True)) + r")\b", re.I)
    codes = {n.upper() for n in names}

    texts: list[tuple[str, str]] = []
    _bitexts(data, texts)
    assert texts, "walker found no prose — the payload shape changed"

    tamil_leaks = sorted({m.group(0) for ta, _ in texts for m in latin_in_tamil.finditer(ta)})
    english_codes = sorted({tok for _, en in texts for tok in re.findall(r"\b[A-Z]{4,}\b", en) if tok in codes})

    assert tamil_leaks == [], f"Latin rasi/nakshatra names inside Tamil prose: {tamil_leaks}"
    assert english_codes == [], f"UPPER_CASE codes inside English prose: {english_codes}"
