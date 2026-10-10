"""A13 — golden output for `assess_marriage_prediction`, before any extraction.

Same method as `tests/test_daily_guidance_golden.py` and
`tests/test_life_areas_golden.py`, whose synthetic identities and
normalisation this reuses. `assess_marriage_prediction` is already pure — it
takes a `MarriageAssessmentInput` — so the input is built here from a
synthetic chart exactly as `app/api/predictions.py` builds it from a
persisted one (transits at local noon, the running maha/antar lords, D9
rasis, Sevvai/Rahu-Ketu dosham flags, natal longitudes).

Variants per profile and date, because the function is mostly gates: as built,
married, a parent's profile (relationship gate), and the legacy path with the
promise gate off. Two extra profiles reach the age gates: a child and an
elder. Flags are pinned to their shipped defaults.

What this cannot see: the route's own wrapping (`age_gated`,
`alternative_framing`, the prediction log), real persisted charts, and
float drift under 0.005 / masked clock times as in the other goldens.

Regenerate only when a change to the output is intended, and say why in the
commit:  python tests/test_marriage_prediction_golden.py --write
"""
from __future__ import annotations

import dataclasses
import json
import sys
from datetime import UTC, date, datetime, time
from datetime import time as dtime
from pathlib import Path
from uuid import UUID

import pytest

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tests.test_daily_guidance_golden import DATES, _profile, normalise
from tests.test_daily_guidance_golden import PROFILES as GUIDANCE_PROFILES

pytestmark = pytest.mark.no_db

GOLDEN = Path(__file__).resolve().parent / "golden" / "marriage" / "marriage_prediction_golden.json"

PROFILES = GUIDANCE_PROFILES + [
    ("chennai-2016", date(2016, 4, 2), dtime(9, 15), "Chennai, India", 13.0827, 80.2707, "Asia/Kolkata"),
    ("trichy-1956", date(1956, 1, 26), dtime(19, 45), "Tiruchirappalli, India", 10.7905, 78.7047, "Asia/Kolkata"),
]
VARIANTS = ("as-built", "married", "parent", "gate-off")


def _payload(chart, profile, on_date: date, variant: str):
    from app.api.predictions import _derive_life_stage
    from app.calculations.astro import resolve_timezone, utc_datetime_to_julian_day
    from app.calculations.dasha import calculate_vimshottari_timeline
    from app.calculations.ephemeris import calculate_sidereal_planets
    from app.services.location_service import resolve_effective_daily_timezone
    from app.services.marriage_service import MarriageAssessmentInput

    data = chart.data
    natal_moon = next(p for p in data.planets if p.graha == "MOON")
    tz = resolve_timezone(resolve_effective_daily_timezone(profile))
    current_jd = utc_datetime_to_julian_day(datetime.combine(on_date, time(12, 0), tzinfo=tz).astimezone(UTC))
    transit = calculate_sidereal_planets(current_jd)
    timeline = calculate_vimshottari_timeline(data.julian_day, natal_moon.absolute_longitude, current_jd)
    birth = profile.birth_date_local
    age = on_date.year - birth.year - ((on_date.month, on_date.day) < (birth.month, birth.day))
    doshams = {d.name.upper(): d for d in data.doshams}
    sevvai, rahu_ketu = doshams.get("SEVVAI_DOSHAM"), doshams.get("RAHU_KETU_DOSHAM")
    return MarriageAssessmentInput(
        as_of=on_date,
        lagna_rasi=data.lagna.rasi,
        planets_rasi={p.graha: p.rasi for p in data.planets},
        active_dasha_lords={timeline.current_mahadasha.lord, timeline.current_antardasha.lord},
        transit_jupiter_rasi=transit.bodies["JUPITER"].rasi,
        transit_venus_rasi=transit.bodies["VENUS"].rasi,
        age=age,
        life_stage=_derive_life_stage(age, None),
        marital_status="married" if variant == "married" else None,
        sevvai_dosham_cancelled=bool(sevvai and sevvai.is_cancelled),
        rahu_ketu_label=rahu_ketu.label if rahu_ketu else None,
        d9_rasi_by_planet={p.graha: p.d9_rasi for p in data.planets},
        relationship_to_owner="parent" if variant == "parent" else "self",
        planet_longitudes={
            p.graha: p.absolute_longitude for p in data.planets
            if p.graha in {"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU"}
        },
        maha_lord=timeline.current_mahadasha.lord,
        antar_lord=timeline.current_antardasha.lord,
    )


def compute() -> dict[str, dict]:
    from app.services import feature_flags
    from app.services import marriage_service as svc
    from app.services._chart_build import _chart_response_from_profile

    out: dict[str, dict] = {}
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(svc, "get_flag", lambda name: feature_flags._defaults().get(name))
        for row in PROFILES:
            key = row[0]
            profile = _profile(*row)
            chart = _chart_response_from_profile(profile, "thirukanitham-2026-v1", chart_id=UUID(int=sum(map(ord, key)) + 1))
            for day in DATES:
                for variant in VARIANTS:
                    payload = _payload(chart, chart.data.birth_profile, day, variant)
                    gate = False if variant == "gate-off" else None
                    result = svc.assess_marriage_prediction(payload, use_reasoning_gate=gate)
                    body = json.loads(json.dumps(dataclasses.asdict(result), default=str, ensure_ascii=False))
                    out[f"{key}@{day.isoformat()}#{variant}"] = normalise(body)
    return out


_CACHE: dict[str, dict] = {}


def _actual() -> dict[str, dict]:
    if not _CACHE:
        _CACHE.update(compute())
    return _CACHE


def _expected() -> dict[str, dict]:
    return json.loads(GOLDEN.read_text(encoding="utf-8"))


CASE_KEYS = [f"{p[0]}@{d.isoformat()}#{v}" for p in PROFILES for d in DATES for v in VARIANTS]


@pytest.mark.parametrize("case", CASE_KEYS)
def test_marriage_prediction_matches_golden(case: str) -> None:
    expected = _expected()[case]
    actual = _actual()[case]
    if actual != expected:
        diffs = [k for k in sorted(set(expected) | set(actual)) if expected.get(k) != actual.get(k)]
        pytest.fail(f"{case}: marriage prediction changed in {diffs}")


def test_golden_matrix_reaches_the_branches_that_matter() -> None:
    """A fixture where every case takes the same gate would pass any refactor."""
    cases = _expected()
    assert len(cases) == len(CASE_KEYS)
    keys = {f.get("key") for c in cases.values() for f in c["astrological_factors"]}
    assert {"relationship_gate", "age_phase_gate"} <= keys, keys
    assert len({c["confidence"] for c in cases.values()}) >= 2
    assert len({c["band"] for c in cases.values()}) >= 3
    assert len({c["main_prediction_en"] for c in cases.values()}) >= 8


if __name__ == "__main__":
    if "--write" not in sys.argv:
        raise SystemExit("usage: python tests/test_marriage_prediction_golden.py --write")
    GOLDEN.parent.mkdir(parents=True, exist_ok=True)
    cases = compute()
    body = ",\n".join(
        f"{json.dumps(k)}: {json.dumps(cases[k], ensure_ascii=False, sort_keys=True, separators=(',', ':'))}"
        for k in sorted(cases)
    )
    GOLDEN.write_text("{\n" + body + "\n}\n", encoding="utf-8")
    print(f"wrote {GOLDEN}")
