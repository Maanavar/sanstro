"""The marriage prediction's chart signature must not depend on the process.

`MarriageAssessmentInput.active_dasha_lords` is a set, and the signature took
`list(set)[0]` as the maha lord. String hashing is randomised per process, so
the same chart was framed "revolves around the Moon" in one web worker and
"around Jupiter" in another — found when the marriage golden came out
different between two runs (12 of 97 cases). The signature's dasha points
belong to the running *maha* lord, which the route knows from the timeline.

What it cannot see: a caller that builds the input without `maha_lord` (then
there is no dasha signal unless maha and antar are the same lord — by design,
rather than a guess).
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

from app.reasoning.chart_signature import detect_signature
from app.services import feature_flags
from app.services import marriage_service as svc

pytestmark = pytest.mark.no_db

REPO = Path(__file__).resolve().parents[1]

_SCRIPT = """
import sys
sys.path.insert(0, {repo!r})
from tests import test_marriage_prediction_golden as g
from app.services import feature_flags, marriage_service as svc
from app.services._chart_build import _chart_response_from_profile
from uuid import UUID
svc.get_flag = lambda name: feature_flags._defaults().get(name)
out = []
for row in g.PROFILES[:4]:
    chart = _chart_response_from_profile(g._profile(*row), "thirukanitham-2026-v1", chart_id=UUID(int=1))
    for day in g.DATES:
        result = svc.assess_marriage_prediction(g._payload(chart, chart.data.birth_profile, day, "as-built"))
        out.append(result.chart_signature.dominant if result.chart_signature else "-")
print(",".join(out))
"""


def test_the_signature_is_the_same_in_every_process() -> None:
    seen = set()
    for seed in ("0", "1", "2", "3"):
        env = {**os.environ, "PYTHONHASHSEED": seed, "PYTHONUTF8": "1"}
        run = subprocess.run(
            [sys.executable, "-c", _SCRIPT.format(repo=str(REPO))],
            capture_output=True, text=True, env=env, cwd=REPO, check=True,
        )
        seen.add(run.stdout.strip().splitlines()[-1])
    assert len(seen) == 1, seen


def _payload(**overrides):
    base = dict(
        as_of=__import__("datetime").date(2026, 1, 14), lagna_rasi=1,
        planets_rasi={"SUN": 1, "MOON": 4, "MARS": 7, "MERCURY": 2, "JUPITER": 9, "VENUS": 3, "SATURN": 11, "RAHU": 5, "KETU": 11},
        active_dasha_lords={"MOON", "JUPITER"}, transit_jupiter_rasi=4, transit_venus_rasi=6, age=30,
        planet_longitudes={"SUN": 10.0, "MOON": 100.0, "MARS": 190.0, "MERCURY": 40.0, "JUPITER": 250.0, "VENUS": 70.0, "SATURN": 310.0, "RAHU": 130.0},
    )
    base.update(overrides)
    return svc.MarriageAssessmentInput(**base)


@pytest.fixture
def signature_on(monkeypatch):
    monkeypatch.setattr(svc, "get_flag", lambda name: True if name == "reasoning_chart_signature" else feature_flags._defaults().get(name))


@pytest.mark.parametrize(("maha", "antar"), [("JUPITER", "MOON"), ("MOON", "JUPITER")])
def test_the_signature_reads_the_running_maha_lord(signature_on, maha, antar) -> None:
    payload = _payload(maha_lord=maha, antar_lord=antar)
    expected = detect_signature(
        planet_longitudes=payload.planet_longitudes, planet_rasis=payload.planets_rasi,
        current_maha_lord=maha, current_antar_lord=antar,
    )
    assert svc._compute_chart_signature(payload).dominant == expected.dominant


def test_without_the_lords_no_dasha_signal_is_guessed(signature_on) -> None:
    payload = _payload()
    expected = detect_signature(planet_longitudes=payload.planet_longitudes, planet_rasis=payload.planets_rasi)
    assert svc._compute_chart_signature(payload).dominant == expected.dominant
