"""A13 — golden output for `get_life_areas`, before any extraction.

Same rule and method as `tests/test_daily_guidance_golden.py`, whose synthetic
profiles, dates and normalisation this reuses: four synthetic profiles × four
2026 dates, floats to 2 places, clock times and ISO datetimes masked, everything
else exact.

`get_life_areas` takes a session and touches the database in five places. Each
is replaced, at this module's own names, with what a fresh chart would give:
the owner check passes, the chart is the synthetic one, no active goals, no
life events (so no event validation), and `log_prediction` records its calls —
which are part of the golden, because which areas get logged as HIGH-confidence
claims is behaviour. Feature flags are pinned to their shipped defaults, so a
test elsewhere that overrides one cannot move this.

What this cannot see: the masked clock times, float drift under 0.005, a chart
with active goals or recorded life events (`chart_validation_status` stays
null), non-default flags, and the real owner check and persistence.

Regenerate only when a change to the output is intended, and say why in the
commit:  python tests/test_life_areas_golden.py --write
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from uuid import UUID

import pytest

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tests.test_daily_guidance_golden import DATES, PROFILES, _profile, normalise

pytestmark = pytest.mark.no_db

GOLDEN = Path(__file__).resolve().parent / "golden" / "life_areas" / "life_areas_golden.json"
OWNER = UUID(int=1)


class _NoRows:
    """A session whose only query (the chart's life events) finds nothing."""

    def execute(self, *_args, **_kwargs):
        return self

    def scalars(self):
        return self

    def all(self):
        return []


def compute() -> dict[str, dict]:
    from app.services import feature_flags
    from app.services import life_areas_service as svc
    from app.services._chart_build import _chart_response_from_profile

    out: dict[str, dict] = {}
    logged: list[dict] = []
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(svc, "_assert_chart_owner", lambda *_a, **_k: None)
        mp.setattr(svc, "get_active_goals_for_chart", lambda *_a, **_k: [])
        mp.setattr(svc, "log_prediction", lambda _session, **kwargs: logged.append(kwargs))
        mp.setattr(svc, "get_flag", lambda name: feature_flags._defaults().get(name))
        for row in PROFILES:
            key = row[0]
            chart_id = UUID(int=sum(map(ord, key)) + 1)
            chart = _chart_response_from_profile(_profile(*row), "thirukanitham-2026-v1", chart_id=chart_id)
            mp.setattr(svc, "load_persisted_chart_response", lambda _s, _id, chart=chart: chart)
            for day in DATES:
                logged.clear()
                response = svc.get_life_areas(_NoRows(), chart_id, day, owner_user_id=OWNER)
                body = response.model_dump(mode="json", by_alias=True)
                body["predictionLog"] = [
                    {k: (str(v) if not isinstance(v, (str, int, float, type(None))) else v) for k, v in call.items()}
                    for call in logged
                ]
                out[f"{key}@{day.isoformat()}"] = normalise(body)
    return out


_CACHE: dict[str, dict] = {}


def _actual() -> dict[str, dict]:
    if not _CACHE:
        _CACHE.update(compute())
    return _CACHE


def _expected() -> dict[str, dict]:
    return json.loads(GOLDEN.read_text(encoding="utf-8"))


CASE_KEYS = [f"{p[0]}@{d.isoformat()}" for p in PROFILES for d in DATES]


@pytest.mark.parametrize("case", CASE_KEYS)
def test_life_areas_match_golden(case: str) -> None:
    expected = _expected()[case]
    actual = _actual()[case]
    if actual != expected:
        diffs = [k for k in sorted(set(expected) | set(actual)) if expected.get(k) != actual.get(k)]
        data_diffs = [
            k for k in sorted(set(expected.get("data", {})) | set(actual.get("data", {})))
            if expected.get("data", {}).get(k) != actual.get("data", {}).get(k)
        ]
        pytest.fail(f"{case}: life areas changed in {diffs} / data {data_diffs}")


def test_golden_matrix_reaches_the_branches_that_matter() -> None:
    """A fixture of identical easy days would pass any refactor."""
    cases = list(_expected().values())
    assert len(cases) == len(CASE_KEYS)
    areas = [a for c in cases for a in c["data"]["areas"]]
    assert {a["confidence"] for a in areas} == {"HIGH", "MEDIUM", "LOW"}
    assert any(a["chandrashtamaApplied"] for a in areas), "no Chandrashtama-applied area"
    assert len({a["reading"] for a in areas}) >= 3, "readings barely vary"
    assert len({a["score"] for a in areas}) >= 20, "scores barely vary"
    assert any(c["predictionLog"] for c in cases), "no HIGH claim was logged"
    assert not all(c["predictionLog"] for c in cases)


if __name__ == "__main__":
    if "--write" not in sys.argv:
        raise SystemExit("usage: python tests/test_life_areas_golden.py --write")
    GOLDEN.parent.mkdir(parents=True, exist_ok=True)
    cases = compute()
    body = ",\n".join(
        f"{json.dumps(k)}: {json.dumps(cases[k], ensure_ascii=False, sort_keys=True, separators=(',', ':'))}"
        for k in sorted(cases)
    )
    GOLDEN.write_text("{\n" + body + "\n}\n", encoding="utf-8")
    print(f"wrote {GOLDEN}")
