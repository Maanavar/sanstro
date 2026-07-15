"""Unit tests for app.calculations.nakshatra_analysis — WI-06
(docs/CALC_AUDIT_REMEDIATION_PLAN_2026-07.md): Pushkara Navamsa (two per
sign, by element) and Pushkara Bhaga (standard per-sign degree) tables.
"""
from __future__ import annotations

import pytest

from app.calculations.nakshatra_analysis import pushkara_check

pytestmark = pytest.mark.no_db


def test_pushkara_bhaga_exact_degree_true():
    # 21 deg Aries (rasi 1) == the Aries bhaga degree (21.0) -> True.
    out = pushkara_check({"SUN": 21.0})
    assert out["SUN_bhaga"] is True


def test_pushkara_bhaga_just_outside_orb_false():
    # 21.6 deg Aries is 0.6 deg from the 21.0 bhaga degree -> outside +-0.5 orb.
    out = pushkara_check({"SUN": 21.6})
    assert out["SUN_bhaga"] is False


def test_pushkara_navamsa_seventh_navamsa_aries_true():
    # 21 deg Aries falls in the 7th navamsa (20-23.33 deg); Aries is a fire
    # sign, and the fire pushkara navamsas are {7, 9}.
    out = pushkara_check({"SUN": 21.0})
    assert out["SUN"] is True


def test_pushkara_navamsa_first_navamsa_cancer_true():
    # 1 deg Cancer (rasi 4) falls in the 1st navamsa (0-3.33 deg); Cancer is
    # a water sign, and the water pushkara navamsas are {1, 3}.
    out = pushkara_check({"MOON": 91.0})  # (4-1)*30 + 1
    assert out["MOON"] is True


def test_pushkara_navamsa_first_navamsa_aries_false():
    # 1 deg Aries falls in the 1st navamsa, but Aries's (fire) pushkara
    # navamsas are {7, 9} -- the 1st navamsa does not qualify.
    out = pushkara_check({"SUN": 1.0})
    assert out["SUN"] is False
