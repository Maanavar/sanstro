"""AAU-05: the Jadhagam's Sevvai card and the compatibility report agree.

WI-13 said the two "can never disagree". They could: the report called
`detect_sevvai_dosham` with planets and lagna only, while the card also passes
combustion, the D9 map and the live doctrine. On 400 synthetic charts severity
differed on 57 and the reasons on 214.

This compares the card (built by the production chart builder) with the
report's single-chart reading, through `sevvai_inputs_from_snapshot`, on 400
synthetic births. The partner-dependent part of the report (dosha samyam) is
two-chart by design and is not compared here.

All births are synthetic; no real person's data.
"""
from __future__ import annotations

import random
from datetime import date, time, timedelta
from types import SimpleNamespace
from uuid import UUID

import pytest

from app.calculations._yoga_dosham import detect_sevvai_dosham
from app.calculations.compatibility_intelligence import sevvai_inputs_from_snapshot
from app.services._chart_build import _chart_response_from_profile
from app.services.feature_flags import current_doctrine_options

pytestmark = pytest.mark.no_db

_GENDERS = ("male", "female", "not_specified")


def _profile(i: int, d: date, t: time) -> SimpleNamespace:
    return SimpleNamespace(
        birth_profile_id=UUID(int=i + 1),
        display_name=f"Synthetic {i}",
        birth_date_local=d,
        birth_time_local=t,
        birth_time_known=True,
        birth_place="Chennai",
        birth_latitude=13.0827,
        birth_longitude=80.2707,
        birth_timezone="Asia/Kolkata",
        current_latitude=None,
        current_longitude=None,
        current_timezone=None,
        current_place=None,
        gender=None,
        gender_for_traditional_rules=_GENDERS[i % 3],
    )


def _fields(result) -> tuple:
    return (result.is_present, result.strength, result.label, list(result.cancellation_factors))


def test_card_and_report_read_sevvai_the_same_way_on_400_charts():
    rng = random.Random(20261029)
    doctrine = current_doctrine_options()
    differ: list[str] = []
    for i in range(400):
        d = date(1960, 1, 1) + timedelta(days=rng.randrange(365 * 50))
        t = time(rng.randrange(24), rng.randrange(60))
        chart = _chart_response_from_profile(_profile(i, d, t), "thirukanitham-2026-v1", chart_id=UUID(int=i + 1))
        card = next(x for x in chart.data.doshams if x.name == "SEVVAI_DOSHAM")
        report = detect_sevvai_dosham(**sevvai_inputs_from_snapshot(chart, doctrine))
        if _fields(card) != _fields(report):
            differ.append(f"{d} {t}: card={_fields(card)} report={_fields(report)}")
    assert differ == [], f"{len(differ)} of 400 differ; first: {differ[:3]}"
