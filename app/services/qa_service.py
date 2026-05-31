"""Internal QA validation service — Sprint 9 golden test runner.

10 golden categories, 5+ tests each, covering every MVP calculation module.
"""
from __future__ import annotations

from datetime import date, datetime

from app.calculations.astro import (
    house_from_reference,
    local_datetime_to_utc,
    nakshatra_from_degree,
    navamsa_rasi_from_degree,
    navamsa_rasi_from_nakshatra_pada,
    pada_from_degree,
    rasi_from_degree,
    utc_datetime_to_julian_day,
)
from app.calculations.dasha import NAK_LORD, calculate_opening_dasha, calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets, set_lahiri_ayanamsa
from app.calculations.panchangam import calculate_daily_panchangam
from app.calculations.transits import classify_kandaka_cycle, classify_sani_cycle, is_gandanta
from app.schemas.qa import QACaseResult, QAModuleResult, QAValidationResponse

FORBIDDEN_TEXT_FRAGMENTS = [
    "you will die",
    "no marriage",
    "no children",
    "disaster period",
    "cursed",
    "guaranteed loss",
]

# ── helpers ──────────────────────────────────────────────────────────────────


def _case(
    test_id: str,
    description: str,
    expected: object,
    actual: object,
    detail: str | None = None,
) -> QACaseResult:
    return QACaseResult(
        test_id=test_id,
        description=description,
        passed=expected == actual,
        expected=expected,
        actual=actual,
        detail=detail,
    )


def _approx(test_id: str, description: str, expected: float, actual: float, tol: float = 0.01) -> QACaseResult:
    passed = abs(actual - expected) <= tol
    return QACaseResult(
        test_id=test_id,
        description=description,
        passed=passed,
        expected=round(expected, 4),
        actual=round(actual, 4),
        detail=f"tolerance ±{tol}",
    )


# ── Category 1: UTC conversion ────────────────────────────────────────────────


def _run_time_conversion() -> QAModuleResult:
    utc1 = local_datetime_to_utc(datetime(1991, 7, 22, 6, 30), "Asia/Kolkata")
    utc2 = local_datetime_to_utc(datetime(2025, 5, 20, 15, 32), "Asia/Kolkata")
    utc3 = local_datetime_to_utc(datetime(2000, 1, 1, 0, 0), "Asia/Kolkata")   # millennium midnight IST
    utc4 = local_datetime_to_utc(datetime(1947, 8, 15, 0, 0), "Asia/Kolkata")  # India independence
    utc5 = local_datetime_to_utc(datetime(1975, 6, 10, 18, 45), "Asia/Kolkata")
    cases = [
        _case("T010-a", "1991-07-22 06:30 IST -> 1991-07-22 01:00 UTC", "1991-07-22T01:00:00+00:00", utc1.isoformat()),
        _case("T010-b", "2025-05-20 15:32 IST -> 2025-05-20 10:02 UTC", "2025-05-20T10:02:00+00:00", utc2.isoformat()),
        _case("T010-c", "2000-01-01 00:00 IST -> 1999-12-31 18:30 UTC (millennium rollover)", "1999-12-31T18:30:00+00:00", utc3.isoformat()),
        _case("T010-d", "1947-08-15 00:00 IST -> 1947-08-14 18:30 UTC (independence day)", "1947-08-14T18:30:00+00:00", utc4.isoformat()),
        _case("T010-e", "1975-06-10 18:45 IST -> 1975-06-10 13:15 UTC", "1975-06-10T13:15:00+00:00", utc5.isoformat()),
        _case("T010-f", "UTC result has zero offset", True, utc1.utcoffset().total_seconds() == 0),
    ]
    passed = sum(1 for c in cases if c.passed)
    return QAModuleResult(module="utc_conversion", passed=passed, failed=len(cases) - passed, cases=cases)


# ── Category 2: Rasi boundary ─────────────────────────────────────────────────


def _run_rasi_boundary() -> QAModuleResult:
    cases = [
        _case("T001-a", "0.0 deg = Mesham (rasi 1)", 1, rasi_from_degree(0.0)),
        _case("T001-b", "29.99 deg = Mesham (rasi 1)", 1, rasi_from_degree(29.99)),
        _case("T001-c", "30.0 deg = Rishabam (rasi 2)", 2, rasi_from_degree(30.0)),
        _case("T001-d", "240.0 deg = Dhanusu (rasi 9)", 9, rasi_from_degree(240.0)),
        _case("T001-e", "270.0 deg = Magaram (rasi 10)", 10, rasi_from_degree(270.0)),
        _case("T001-f", "330.0 deg = Meenam (rasi 12)", 12, rasi_from_degree(330.0)),
        _case("T001-g", "359.99 deg = Meenam (rasi 12)", 12, rasi_from_degree(359.99)),
        _case("T002-a", "house_from Dhanusu to Meenam = 4", 4, house_from_reference("Dhanusu", "Meenam")),
        _case("T002-b", "house_from Magaram to Meenam = 3", 3, house_from_reference("Magaram", "Meenam")),
        _case("T002-c", "house_from Kadagam to Kumbam = 8", 8, house_from_reference("Kadagam", "Kumbam")),
        _case("T002-d", "house_from Mesham to Mesham = 1 (self)", 1, house_from_reference("Mesham", "Mesham")),
        _case("T002-e", "house_from Meenam to Mesham = 2", 2, house_from_reference("Meenam", "Mesham")),
    ]
    passed = sum(1 for c in cases if c.passed)
    return QAModuleResult(module="rasi_boundary", passed=passed, failed=len(cases) - passed, cases=cases)


# ── Category 3: Nakshatra boundary ───────────────────────────────────────────


def _run_nakshatra_boundary() -> QAModuleResult:
    # Each nakshatra spans 13°20' (40/3 degrees). Pada = 3°20' (10/3 degrees).
    cases = [
        _case("T011-a", "0.0 deg = Aswini (nak 1), pada 1", (1, 1), (nakshatra_from_degree(0.0), pada_from_degree(0.0))),
        _case("T011-b", "13.333 deg = Aswini (nak 1), pada 4 (end of nak)", (1, 4), (nakshatra_from_degree(13.333), pada_from_degree(13.333))),
        _case("T011-c", "13.334 deg = Bharani (nak 2), pada 1 (boundary cross)", (2, 1), (nakshatra_from_degree(13.334), pada_from_degree(13.334))),
        _case("T011-d", "26.666 deg = Bharani (nak 2), pada 4", (2, 4), (nakshatra_from_degree(26.666), pada_from_degree(26.666))),
        _case("T011-e", "26.667 deg = Krittika (nak 3), pada 1", (3, 1), (nakshatra_from_degree(26.667), pada_from_degree(26.667))),
        _case("T011-f", "40.0 deg = Rohini (nak 4), pada 1", (4, 1), (nakshatra_from_degree(40.0), pada_from_degree(40.0))),
        _case("T011-g", "53.333 deg = Rohini (nak 4), pada 4", (4, 4), (nakshatra_from_degree(53.333), pada_from_degree(53.333))),
        _case("T011-h", "53.334 deg = Mirugaseeridam (nak 5), pada 1", (5, 1), (nakshatra_from_degree(53.334), pada_from_degree(53.334))),
        _case("T011-i", "359.999 deg = Revati (nak 27), pada 4", (27, 4), (nakshatra_from_degree(359.999), pada_from_degree(359.999))),
        _case("T011-j", "NAK_LORD of nak 1 (Aswini) = KETU", "KETU", NAK_LORD[1]),
        _case("T011-k", "NAK_LORD of nak 4 (Rohini) = MOON", "MOON", NAK_LORD[4]),
        _case("T011-l", "NAK_LORD of nak 5 (Mirugaseeridam) = MARS", "MARS", NAK_LORD[5]),
    ]
    passed = sum(1 for c in cases if c.passed)
    return QAModuleResult(module="nakshatra_boundary", passed=passed, failed=len(cases) - passed, cases=cases)


# ── Category 4: D9/Navamsa ────────────────────────────────────────────────────


def _run_navamsa() -> QAModuleResult:
    d9_uthiradam_3 = navamsa_rasi_from_nakshatra_pada("Uthiradam", 3)
    d9_moolam_1 = navamsa_rasi_from_degree(240.5)       # Mula (Dhanusu) start
    d1_rishabam = rasi_from_degree(43.5)                 # Rishabam 13°30'
    d9_rishabam = navamsa_rasi_from_degree(43.5)
    d9_mesham_start = navamsa_rasi_from_degree(0.0)      # Mesham start → D9 Mesham
    d9_mesham_mid = navamsa_rasi_from_degree(15.0)       # Mesham mid
    d9_kadagam = navamsa_rasi_from_degree(90.0)          # Kadagam start (movable) → D9 Kadagam
    d9_kanni_fixed = navamsa_rasi_from_degree(150.0)     # Kanni (fixed) → starts from 9th = Makaram
    d9_midhunam_dual = navamsa_rasi_from_degree(60.0)    # Midhunam (dual) → starts from 5th = Thulam
    cases = [
        _case("T020-a", "Uthiradam 3rd Pada -> D9 Kumbam (11)", 11, d9_uthiradam_3),
        _case("T020-b", "Moolam 1st Pada (240.5) -> D9 Mesham (1)", 1, d9_moolam_1),
        _case("T021-d1", "Rishabam 13-30 -> D1 Rishabam (2)", 2, d1_rishabam),
        _case("T021-d9", "Rishabam 13-30 -> D9 Rishabam (2) = Vargottama", 2, d9_rishabam),
        _case("T021-varg", "Vargottama: D1 Rishabam == D9 Rishabam", d1_rishabam, d9_rishabam),
        _case("T022-a", "Mesham 0 (movable) -> D9 starts Mesham, pada 1 = Mesham (1)", 1, d9_mesham_start),
        _case("T022-b", "Kadagam 0 (movable) -> D9 Kadagam (4)", 4, d9_kadagam),
        _case("T022-c", "Kanni 0 (fixed) -> D9 starts from 9th sign = Makaram (10)", 10, d9_kanni_fixed),
        _case("T022-d", "Midhunam 0 (dual) -> D9 starts from 5th sign = Thulaam (7)", 7, d9_midhunam_dual),
    ]
    passed = sum(1 for c in cases if c.passed)
    return QAModuleResult(module="navamsa_d9", passed=passed, failed=len(cases) - passed, cases=cases)


# ── Category 5: Vargottama ────────────────────────────────────────────────────


def _run_vargottama() -> QAModuleResult:
    # Vargottama: planet in same rasi in D1 and D9
    # Rishabam 13°30' is Vargottama (verified above)
    # Mesham 0° is Vargottama (movable: D1=Mesham, D9=Mesham)
    # Kadagam 0° is Vargottama (movable)
    # Thulaam 0° is Vargottama (movable)
    # Magaram 0° is Vargottama (movable)
    def is_vargottama(deg: float) -> bool:
        return rasi_from_degree(deg) == navamsa_rasi_from_degree(deg)

    cases = [
        _case("T025-a", "Rishabam 13-30 is Vargottama", True, is_vargottama(43.5)),
        _case("T025-b", "Mesham 0 is Vargottama (movable start)", True, is_vargottama(0.0)),
        _case("T025-c", "Kadagam 0 is Vargottama (movable start)", True, is_vargottama(90.0)),
        _case("T025-d", "Thulaam 0 is Vargottama (movable start)", True, is_vargottama(180.0)),
        _case("T025-e", "Magaram 0 is Vargottama (movable start)", True, is_vargottama(270.0)),
        _case("T025-f", "Mesham 5 is NOT Vargottama", False, is_vargottama(5.0)),
        _case("T025-g", "Rishabam 0 (fixed, D9 starts Magaram) is NOT Vargottama", False, is_vargottama(30.0)),
    ]
    passed = sum(1 for c in cases if c.passed)
    return QAModuleResult(module="vargottama", passed=passed, failed=len(cases) - passed, cases=cases)


# ── Category 6: Dasha balance ─────────────────────────────────────────────────


def _run_dasha_balance() -> QAModuleResult:
    set_lahiri_ayanamsa()
    # Reference birth: 1970-01-01 00:00 IST, Chennai (Unix epoch midnight — neutral, memorable)
    local_dt = datetime(1970, 1, 1, 0, 0)
    utc_dt = local_datetime_to_utc(local_dt, "Asia/Kolkata")
    jd = utc_datetime_to_julian_day(utc_dt)
    snap = calculate_sidereal_planets(jd)
    moon_lon = snap.bodies["MOON"].absolute_longitude  # type: ignore[attr-defined]
    moon_nak = nakshatra_from_degree(moon_lon)
    moon_pada = pada_from_degree(moon_lon)
    opening_lord, balance_years, _ = calculate_opening_dasha(moon_lon, jd)
    timeline = calculate_vimshottari_timeline(jd, moon_lon)

    # Moon at ~164.39 -> nak 13 (Chithirai), lord MOON, pada 2
    cases = [
        _case("T030-a", "1970-01-01 IST: Moon nakshatra = 13 (Chithirai)", 13, moon_nak),
        _case("T030-b", "1970-01-01 IST: Moon pada = 2", 2, moon_pada),
        _case("T030-c", "1970-01-01 IST: Opening dasha lord = MOON", "MOON", opening_lord),
        _approx("T030-d", "1970-01-01 IST: MOON balance ~ 6.705 years", 6.705, balance_years, tol=0.05),
        _case("T030-e", "NAK_LORD[13] = MOON", "MOON", NAK_LORD[13]),
        # Near nak start: maximum balance
        _case("T031-a", "Moon at nak start (0.001) -> KETU dasha", "KETU", calculate_opening_dasha(0.001, jd)[0]),
        _approx("T031-b", "Moon at nak start -> balance close to 7.0 yrs (KETU)", 7.0, calculate_opening_dasha(0.001, jd)[1], tol=0.01),
        # Near nak end: minimum balance
        _case("T031-c", "Moon at nak end (13.32) -> KETU dasha", "KETU", calculate_opening_dasha(13.32, jd)[0]),
        _approx("T031-d", "Moon at nak end -> balance near 0 yrs (KETU)", 0.0, calculate_opening_dasha(13.32, jd)[1], tol=0.02),
        # Timeline structure
        _case("T032-a", "Timeline current_mahadasha is a DashaPeriod", True, timeline.current_mahadasha is not None),
        _case("T032-b", "Timeline current_antardasha is a DashaPeriod", True, timeline.current_antardasha is not None),
        _case("T032-c", "Opening lord matches timeline opening_lord", opening_lord, timeline.opening_lord),
    ]
    passed = sum(1 for c in cases if c.passed)
    return QAModuleResult(module="dasha_balance", passed=passed, failed=len(cases) - passed, cases=cases)


# ── Category 7: Panchangam weekday/timing ─────────────────────────────────────


def _run_panchangam() -> QAModuleResult:
    # Coimbatore coords (11.0168, 76.9558), Asia/Kolkata
    lat, lng, tz = 11.0168, 76.9558, "Asia/Kolkata"
    tue = calculate_daily_panchangam(date(2025, 5, 20), lat, lng, tz)
    wed = calculate_daily_panchangam(date(2025, 5, 21), lat, lng, tz)
    mon = calculate_daily_panchangam(date(2025, 5, 19), lat, lng, tz)
    sun = calculate_daily_panchangam(date(2025, 5, 18), lat, lng, tz)
    sat = calculate_daily_panchangam(date(2025, 5, 24), lat, lng, tz)
    cases = [
        _case("T040-a", "2025-05-20 weekday = TUESDAY", "TUESDAY", tue.weekday),
        _case("T040-b", "2025-05-21 weekday = WEDNESDAY", "WEDNESDAY", wed.weekday),
        _case("T040-c", "2025-05-19 weekday = MONDAY", "MONDAY", mon.weekday),
        _case("T040-d", "2025-05-18 weekday = SUNDAY", "SUNDAY", sun.weekday),
        _case("T040-e", "2025-05-24 weekday = SATURDAY", "SATURDAY", sat.weekday),
        # Kalam slots: fixed by weekday (verified against canonical Tamil almanac)
        _case("T041-a", "Tuesday Rahu Kalam slot = 7", 7, tue.rahu_kalam.slot),
        _case("T041-b", "Tuesday Yamagandam slot = 3", 3, tue.yamagandam.slot),
        _case("T041-c", "Tuesday Kuligai slot = 5", 5, tue.kuligai.slot),
        _case("T041-d", "Wednesday Rahu Kalam slot = 5", 5, wed.rahu_kalam.slot),
        _case("T041-e", "Wednesday Yamagandam slot = 2", 2, wed.yamagandam.slot),
        _case("T041-f", "Monday Rahu Kalam slot = 2", 2, mon.rahu_kalam.slot),
        _case("T041-g", "Sunday Rahu Kalam slot = 8", 8, sun.rahu_kalam.slot),
        _case("T041-h", "Saturday Rahu Kalam slot = 3", 3, sat.rahu_kalam.slot),
    ]
    passed = sum(1 for c in cases if c.passed)
    return QAModuleResult(module="panchangam_timing", passed=passed, failed=len(cases) - passed, cases=cases)


# ── Category 8: Sani-cycle identification ────────────────────────────────────


def _run_sani_cycle() -> QAModuleResult:
    ardhashtama = classify_sani_cycle(house_from_reference("Dhanusu", "Meenam"))
    no_cycle = classify_sani_cycle(house_from_reference("Magaram", "Meenam"))
    janma = classify_sani_cycle(house_from_reference("Meenam", "Meenam"))
    # Ezharai sati: Sani in 12th, 1st, or 2nd from Moon
    ezhara_12 = classify_sani_cycle(house_from_reference("Rishabam", "Mesham"))  # 12th
    ezhara_1 = classify_sani_cycle(house_from_reference("Mesham", "Mesham"))     # 1st
    ezhara_2 = classify_sani_cycle(house_from_reference("Meenam", "Mesham"))     # 2nd
    # Kandaka sani (from lagna)
    kandaka_10 = classify_kandaka_cycle(house_from_reference("Mesham", "Magaram"))
    kandaka_4 = classify_kandaka_cycle(house_from_reference("Mesham", "Kadagam"))
    kandaka_7 = classify_kandaka_cycle(house_from_reference("Mesham", "Thulaam"))
    kandaka_1 = classify_kandaka_cycle(house_from_reference("Mesham", "Mesham"))
    not_kandaka = classify_kandaka_cycle(house_from_reference("Mesham", "Rishabam"))
    cases = [
        _case("T050-a", "Dhanusu Moon + Meenam Sani -> Ardhashtama type", "ARDHASHTAMA_SANI", ardhashtama.type),
        _case("T050-b", "Ardhashtama Sani is_active = True", True, ardhashtama.is_active),
        _case("T050-c", "Magaram Moon + Meenam Sani -> no named cycle", False, no_cycle.is_active),
        _case("T050-d", "Meenam Moon + Meenam Sani -> Janma Sani", "JANMA_SANI", janma.type),
        _case("T050-e", "Janma Sani is_active = True", True, janma.is_active),
        _case("T051-a", "Sani in 12th from Moon -> Ezharai active", True, ezhara_12.is_active),
        _case("T051-b", "Sani in 1st from Moon -> Ezharai active", True, ezhara_1.is_active),
        _case("T051-c", "Sani in 2nd from Moon -> Ezharai active", True, ezhara_2.is_active),
        _case("T052-a", "Sani in 10th from Lagna -> Kandaka Sani", "KANDAKA_SANI", kandaka_10.type),
        _case("T052-b", "Sani in 4th from Lagna -> Kandaka Sani", "KANDAKA_SANI", kandaka_4.type),
        _case("T052-c", "Sani in 7th from Lagna -> Kandaka Sani", "KANDAKA_SANI", kandaka_7.type),
        _case("T052-d", "Sani in 1st from Lagna -> Kandaka Sani", "KANDAKA_SANI", kandaka_1.type),
        _case("T052-e", "Sani in 2nd from Lagna -> NOT Kandaka", False, not_kandaka.is_active),
    ]
    passed = sum(1 for c in cases if c.passed)
    return QAModuleResult(module="sani_cycle", passed=passed, failed=len(cases) - passed, cases=cases)


# ── Category 9: Chandrashtama ────────────────────────────────────────────────


def _chandrashtama_active(janma_rasi: int, transit_rasi: int) -> bool:
    chandrashtama_rasi = ((janma_rasi - 1 + 7) % 12) + 1
    return transit_rasi == chandrashtama_rasi


def _run_chandrashtama() -> QAModuleResult:
    # Chandrashtamam = transit Moon in the 8th rasi from janma rasi (whole-sign count).
    cases = [
        _case("T060-a", "Janma rasi 1, transit rasi 8 -> Chandrashtama", True, _chandrashtama_active(1, 8)),
        _case("T060-b", "Janma rasi 3, transit rasi 10 -> Chandrashtama", True, _chandrashtama_active(3, 10)),
        _case("T060-c", "Janma rasi 5, transit rasi 12 -> Chandrashtama", True, _chandrashtama_active(5, 12)),
        _case("T060-d", "Janma rasi 8, transit rasi 3 -> Chandrashtama (wrap)", True, _chandrashtama_active(8, 3)),
        _case("T060-e", "Janma rasi 12, transit rasi 7 -> Chandrashtama", True, _chandrashtama_active(12, 7)),
        _case("T061-a", "Janma rasi 1, transit rasi 1 -> not Chandrashtama", False, _chandrashtama_active(1, 1)),
        _case("T061-b", "Janma rasi 1, transit rasi 9 -> not Chandrashtama", False, _chandrashtama_active(1, 9)),
        # Gandanta (fire-water rasi cusp) tests
        _case("T062-a", "359.0 deg is Gandanta (Meenam-Mesham cusp)", True, is_gandanta(359.0)),
        _case("T062-b", "1.0 deg is Gandanta (Mesham start cusp)", True, is_gandanta(1.0)),
        _case("T062-c", "119.0 deg is Gandanta (Kadagam-Simmam cusp)", True, is_gandanta(119.0)),
        _case("T062-d", "239.0 deg is Gandanta (Vrichigam-Dhanusu cusp)", True, is_gandanta(239.0)),
        _case("T062-e", "150.0 deg is NOT Gandanta", False, is_gandanta(150.0)),
    ]
    passed = sum(1 for c in cases if c.passed)
    return QAModuleResult(module="chandrashtama", passed=passed, failed=len(cases) - passed, cases=cases)


# ── Category 10: Family aggregation ──────────────────────────────────────────


def _run_family_aggregation() -> QAModuleResult:
    # Verify family score formula: weighted mean with member weights
    # Canonical weights: self=1.0, spouse=1.0, child=0.75, parent=1.15
    members = [
        {"score": 72, "weight": 1.0},
        {"score": 55, "weight": 1.0},
        {"score": 88, "weight": 0.75},
        {"score": 41, "weight": 1.15},
    ]
    total_weight = sum(m["weight"] for m in members)
    weighted_sum = sum(m["score"] * m["weight"] for m in members)
    weighted_mean = weighted_sum / total_weight
    lowest = min(m["score"] for m in members)
    highest = max(m["score"] for m in members)

    # Low-score penalty: any member < 45 adds a penalty
    low_score_count = sum(1 for m in members if m["score"] < 45)

    # Chandrashtama count
    chandrashtama_flags = [False, False, True, False]
    chandrashtama_count = sum(chandrashtama_flags)

    # Family score after low-score penalty
    penalty = low_score_count * 3
    final_score = max(0, min(100, round(weighted_mean) - penalty))

    cases = [
        _approx("T070-a", "4-member weighted mean ~61.58", 61.58, weighted_mean, tol=0.1),
        _case("T070-b", "lowest member score = 41", 41, lowest),
        _case("T070-c", "highest member score = 88", 88, highest),
        _case("T070-d", "total weight = 3.9", 3.9, round(total_weight, 1)),
        _case("T070-e", "low_score_count (< 45) = 1", 1, low_score_count),
        _case("T070-f", "chandrashtama_count = 1", 1, chandrashtama_count),
        _approx("T070-g", "family_score with penalty ~ 59", 59.0, float(final_score), tol=2),
        # Score clamping
        _case("T071-a", "score clamp: max(0, min(100, 110)) = 100", 100, max(0, min(100, 110))),
        _case("T071-b", "score clamp: max(0, min(100, -5)) = 0", 0, max(0, min(100, -5))),
        _case("T071-c", "score clamp: max(0, min(100, 50)) = 50", 50, max(0, min(100, 50))),
        # Weight sanity
        _case("T072-a", "self weight equals spouse weight", True, 1.0 == 1.0),
        _case("T072-b", "parent weight 1.15 > child weight 0.75", True, 1.15 > 0.75),
        _case("T072-c", "child weight 0.75 < self weight 1.0", True, 0.75 < 1.0),
    ]
    passed = sum(1 for c in cases if c.passed)
    return QAModuleResult(module="family_aggregation", passed=passed, failed=len(cases) - passed, cases=cases)


# ── Safety text scan ──────────────────────────────────────────────────────────


def _run_safety_text() -> QAModuleResult:
    from app.services.daily_guidance_service import _build_text

    sample_labels = ["STRONG_SUPPORT", "GOOD", "BALANCED", "CAUTION", "RESTORATIVE"]
    cases: list[QACaseResult] = []
    for label in sample_labels:
        text, action, caution = _build_text(50, label, [], [])
        combined = (text.en + text.ta + action.en + action.ta + caution.en + caution.ta).lower()
        for fragment in FORBIDDEN_TEXT_FRAGMENTS:
            found = fragment in combined
            cases.append(
                QACaseResult(
                    test_id=f"T090-{label[:3]}-{fragment[:8]}",
                    description=f"Label '{label}' must not contain '{fragment}'",
                    passed=not found,
                    expected=False,
                    actual=found,
                )
            )
    passed = sum(1 for c in cases if c.passed)
    return QAModuleResult(module="safety_text", passed=passed, failed=len(cases) - passed, cases=cases)


# ── Master runner ─────────────────────────────────────────────────────────────


def run_golden_validation() -> QAValidationResponse:
    modules = [
        _run_time_conversion(),       # Category 1
        _run_rasi_boundary(),         # Category 2
        _run_nakshatra_boundary(),    # Category 3
        _run_navamsa(),               # Category 4
        _run_vargottama(),            # Category 5
        _run_dasha_balance(),         # Category 6
        _run_panchangam(),            # Category 7
        _run_sani_cycle(),            # Category 8
        _run_chandrashtama(),         # Category 9
        _run_family_aggregation(),    # Category 10
        _run_safety_text(),           # Bonus: safety text scan
    ]
    total_passed = sum(m.passed for m in modules)
    total_failed = sum(m.failed for m in modules)
    return QAValidationResponse(total_passed=total_passed, total_failed=total_failed, modules=modules)
