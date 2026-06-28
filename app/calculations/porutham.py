"""
Tamil 10-Porutham compatibility engine (Thirukanitham tradition).

Implements the classical Tamil panchangam 10-porutham system as a pass/fail
check on each of the 10 criteria. The result is expressed as a score out of 10
(one point per porutham that passes). Rajju and Vedha are absolute vetoes:
if either is present the union is traditionally considered inauspicious regardless
of the overall score.

The 10 Poruthams (Tamil → calculation rule):
  1. Dinam      (தினம்)           — count boy's nak from girl's; fail if count mod 9 ∈ {0,2,4,6,8}
  2. Ganam      (கணம்)            — Deva/Manushya/Rakshasa; Deva+Deva or Deva+Manushya = pass
  3. Mahendra   (மகேந்திரம்)      — count girl's nak from boy's; pass if result ∈ {4,7,10,13,16,19,22,25}
  4. Stree Dirgham (ஸ்திரீ தீர்கம்) — count girl's nak from boy's; pass if result > 13
  5. Yoni       (யோனி)            — same or neutral animal pair = pass; hostile pair = fail
  6. Rasi       (ராசி)            — pass unless 4th or 8th position between rasis
  7. Rasiyathipathi (ராசியாதிபதி) — rasi lords must not be enemies (avg relation ≥ 0.5)
  8. Vasya      (வாஸ்யம்)         — at least one rasi must be vasya of the other
  9. Rajju      (ராஜ்ஜு)          — same Rajju group = VETO (widowhood risk)
 10. Vedha      (வேதம்)           — Vedha nakshatra pair = VETO

Nakshatra numbers are 1-indexed (1 = Aswini … 27 = Revathi).
"""
from __future__ import annotations

from dataclasses import dataclass

from app.calculations.astro import nakshatra_to_rasi
from app.calculations.chart_strength import SIGN_LORD

# ---------------------------------------------------------------------------
# Nakshatra → Gana mapping (1-based nakshatra index)
# Deva=1, Manushya=2, Rakshasa=3
# ---------------------------------------------------------------------------
_GANA: dict[int, int] = {
    1: 1, 2: 2, 3: 3, 4: 2, 5: 1,
    6: 2, 7: 1, 8: 1, 9: 3,
    10: 3, 11: 2, 12: 2, 13: 1,
    14: 3, 15: 1, 16: 3, 17: 1,
    18: 3, 19: 3, 20: 2, 21: 2,
    22: 1, 23: 3, 24: 3,
    25: 2, 26: 2, 27: 1,
}

# ---------------------------------------------------------------------------
# Nakshatra → Yoni (animal symbol) mapping
# 14 yoni symbols; 1=Horse 2=Elephant 3=Sheep 4=Serpent 5=Dog 6=Cat 7=Rat
#                  8=Cow 9=Buffalo 10=Tiger 11=Deer 12=Monkey 13=Lion 14=Mongoose
# ---------------------------------------------------------------------------
_YONI: dict[int, int] = {
    1: 1,  2: 2,  3: 3,  4: 4,  5: 4,
    6: 5,  7: 6,  8: 3,  9: 6,  10: 7,
    11: 7, 12: 8, 13: 9, 14: 10, 15: 9,
    16: 10, 17: 11, 18: 11, 19: 5, 20: 12,
    21: 14, 22: 12, 23: 13, 24: 1, 25: 13,
    26: 8, 27: 2,
}

_YONI_HOSTILE: frozenset[frozenset[int]] = frozenset(
    frozenset(pair) for pair in [
        {8, 10},   # Cow vs Tiger
        {2, 13},   # Elephant vs Lion
        {1, 9},    # Horse vs Buffalo
        {5, 11},   # Dog vs Deer
        {4, 14},   # Serpent vs Mongoose
        {6, 7},    # Cat vs Rat
        {3, 12},   # Sheep vs Monkey
    ]
)

# ---------------------------------------------------------------------------
# Nakshatra → Nadi mapping (1-indexed)
# ---------------------------------------------------------------------------
_NAKSHATRA_NADI: dict[int, str] = {
    n: ("AADHI" if (n - 1) % 9 < 3 else "MADHYA" if (n - 1) % 9 < 6 else "ANTHYA")
    for n in range(1, 28)
}

# ---------------------------------------------------------------------------
# Graha Maitri (planet friendship) table
# ---------------------------------------------------------------------------
_GRAHA_RELATION: dict[tuple[str, str], float] = {}

def _gm(a: str, b: str, rel: float) -> None:
    _GRAHA_RELATION[(a, b)] = rel
    _GRAHA_RELATION[(b, a)] = rel

for _p in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"):
    _GRAHA_RELATION[(_p, _p)] = 1.0

_gm("SUN", "MOON", 1.0); _gm("SUN", "MARS", 1.0); _gm("SUN", "JUPITER", 1.0)
_gm("SUN", "MERCURY", 0.5); _gm("SUN", "VENUS", 0.0); _gm("SUN", "SATURN", 0.0)
_gm("MOON", "MERCURY", 1.0); _gm("MOON", "MARS", 0.5); _gm("MOON", "JUPITER", 1.0)
_gm("MOON", "VENUS", 0.5); _gm("MOON", "SATURN", 0.5)
_gm("MARS", "JUPITER", 1.0); _gm("MARS", "VENUS", 0.5); _gm("MARS", "SATURN", 0.5)
_gm("MARS", "MERCURY", 0.0); _gm("MERCURY", "JUPITER", 0.5); _gm("MERCURY", "VENUS", 1.0)
_gm("MERCURY", "SATURN", 1.0); _gm("JUPITER", "VENUS", 0.0); _gm("JUPITER", "SATURN", 0.0)
_gm("VENUS", "SATURN", 1.0)

# ---------------------------------------------------------------------------
# Rajju groups — "tent" cycle with period 9: Pada,Kati,Udara,Kanta,Sira,Kanta,Udara,Kati,Pada
# ---------------------------------------------------------------------------
_RAJJU_GROUP: dict[int, int] = {}
_rajju_cycle = [1, 2, 3, 4, 5, 4, 3, 2, 1] * 3
for _i, _rg in enumerate(_rajju_cycle, start=1):
    _RAJJU_GROUP[_i] = _rg

# ---------------------------------------------------------------------------
# Vedha — nakshatra pairs that afflict each other (absolute veto)
# ---------------------------------------------------------------------------
_VEDHA_PAIRS: frozenset[frozenset[int]] = frozenset(
    frozenset(p) for p in [
        {1, 18}, {2, 17}, {3, 16}, {4, 15}, {5, 23},
        {6, 22}, {7, 21}, {8, 20}, {9, 19}, {10, 27},
        {11, 26}, {12, 25}, {13, 24},
    ]
)

# ---------------------------------------------------------------------------
# Vasya — rasi-to-rasi vasya table (Thirukanitham tradition)
# ---------------------------------------------------------------------------
_VASYA: dict[int, frozenset[int]] = {
    1: frozenset({5, 8}),
    2: frozenset({8, 11}),
    3: frozenset({9, 6}),
    4: frozenset({10, 1}),
    5: frozenset({11, 2}),
    6: frozenset({12, 3}),
    7: frozenset({1, 4}),
    8: frozenset({2, 7}),
    9: frozenset({3, 6}),
    10: frozenset({4, 7}),
    11: frozenset({5, 1}),
    12: frozenset({6, 9}),
}


# ---------------------------------------------------------------------------
# Individual porutham checks — each returns 1 (PASS) or 0 (FAIL)
# ---------------------------------------------------------------------------

def _dinam_score(nak_boy: int, nak_girl: int) -> int:
    """Dinam: count boy's nak from girl's (0-based mod 27); fail if remainder mod 9 is even or zero."""
    diff = (nak_boy - nak_girl) % 27
    remainder = diff % 9
    # inauspicious if remainder in {0,2,4,6,8} (0=same group or 9th, even=inauspicious)
    return 1 if remainder in {1, 3, 5, 7} else 0


def _ganam_score(nak_boy: int, nak_girl: int) -> int:
    """Ganam: same gana or Deva+Manushya = PASS; Rakshasa mix = FAIL."""
    gb = _GANA[nak_boy]
    gg = _GANA[nak_girl]
    if gb == gg:
        return 1
    if frozenset({gb, gg}) == frozenset({1, 2}):  # Deva + Manushya
        return 1
    return 0


def _mahendra_score(nak_boy: int, nak_girl: int) -> int:
    """Mahendra: count girl's nak from boy's (1-based); PASS if result ∈ {4,7,10,13,16,19,22,25}."""
    diff = (nak_girl - nak_boy) % 27 + 1
    return 1 if diff in {4, 7, 10, 13, 16, 19, 22, 25} else 0


def _stree_dirgha_score(nak_boy: int, nak_girl: int) -> int:
    """Stree Dirgham: count girl's nak from boy's (0-based); PASS if > 13."""
    diff = (nak_girl - nak_boy) % 27
    return 1 if diff > 13 else 0


def _yoni_score(nak_boy: int, nak_girl: int) -> int:
    """Yoni: hostile pair = FAIL; same or neutral = PASS."""
    yb = _YONI[nak_boy]
    yg = _YONI[nak_girl]
    if frozenset({yb, yg}) in _YONI_HOSTILE:
        return 0
    return 1


def _rasi_score(rasi_boy: int, rasi_girl: int) -> int:
    """Rasi: 4th or 8th position between rasis = FAIL; all others = PASS."""
    diff_bg = (rasi_boy - rasi_girl) % 12 + 1
    diff_gb = (rasi_girl - rasi_boy) % 12 + 1
    if diff_bg in {4, 8} or diff_gb in {4, 8}:
        return 0
    return 1


def _graha_maitri_kuta(rasi_boy: int, rasi_girl: int) -> int:
    """Rasiyathipathi: rasi lords must not be enemies (avg relation ≥ 0.5) = PASS."""
    lb = SIGN_LORD[rasi_boy]
    lg = SIGN_LORD[rasi_girl]
    ab = _GRAHA_RELATION.get((lb, lg), 0.5)
    ba = _GRAHA_RELATION.get((lg, lb), 0.5)
    return 1 if (ab + ba) / 2.0 >= 0.5 else 0


def _rajju_score(nak_boy: int, nak_girl: int) -> int:
    """Rajju: same Rajju group = FAIL (veto); different group = PASS.
    Eka-nakshatra (same birth star) is an accepted exception in Thirukanitham."""
    if nak_boy == nak_girl:
        return 1
    return 0 if _RAJJU_GROUP[nak_boy] == _RAJJU_GROUP[nak_girl] else 1


def _vedha_score(nak_boy: int, nak_girl: int) -> int:
    """Vedha: vedha nakshatra pair = FAIL (veto); else PASS."""
    return 0 if frozenset({nak_boy, nak_girl}) in _VEDHA_PAIRS else 1


def _vasya_score(rasi_boy: int, rasi_girl: int) -> int:
    """Vasya: at least one rasi must be vasya of the other = PASS; neither = FAIL."""
    bg = rasi_girl in _VASYA.get(rasi_boy, frozenset())
    gb = rasi_boy in _VASYA.get(rasi_girl, frozenset())
    return 1 if (bg or gb) else 0


# ---------------------------------------------------------------------------
# Public dataclasses and entry point
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class KutaResult:
    name: str
    name_ta: str
    passed: bool
    score: int      # 1 = pass, 0 = fail (kept for API compatibility)
    max_score: int  # always 1
    label: str      # "PASS" or "FAIL"


@dataclass(frozen=True, slots=True)
class PorutthamResult:
    kutas: list[KutaResult]
    total_score: int   # 0–10
    max_score: int     # always 10
    percentage: float
    label: str         # EXCELLENT / GOOD / AVERAGE / CAUTION
    rajju_dosha: bool
    vedha_dosha: bool
    nadi_dosha: dict[str, object]
    summary_en: str
    summary_ta: str


def check_nadi_dosha(
    boy_nakshatra: int,
    girl_nakshatra: int,
    *,
    boy_rasi: int | None = None,
    girl_rasi: int | None = None,
    boy_pada: int = 1,
    girl_pada: int = 1,
) -> dict[str, object]:
    boy_nadi = _NAKSHATRA_NADI[boy_nakshatra]
    girl_nadi = _NAKSHATRA_NADI[girl_nakshatra]
    has_dosha = boy_nadi == girl_nadi
    boy_resolved_rasi = boy_rasi if boy_rasi is not None else nakshatra_to_rasi(boy_nakshatra, boy_pada)
    girl_resolved_rasi = girl_rasi if girl_rasi is not None else nakshatra_to_rasi(girl_nakshatra, girl_pada)

    cancellations: list[str] = []
    if has_dosha and boy_nakshatra != girl_nakshatra:
        if boy_resolved_rasi != girl_resolved_rasi:
            cancellations.append("Different rasi — Nadi Dosha partially mitigated")

    final_has_dosha = has_dosha and not cancellations
    severity = "SEVERE" if final_has_dosha else ("MILD" if has_dosha else "NONE")

    return {
        "boy_nadi": boy_nadi,
        "girl_nadi": girl_nadi,
        "boy_rasi": boy_resolved_rasi,
        "girl_rasi": girl_resolved_rasi,
        "has_nadi_dosha": final_has_dosha,
        "cancellations": cancellations,
        "severity": severity,
        "note_ta": (
            "நாடி தோஷம் உள்ளது — குழந்தைகள் உடல்நலத்தில் கவனம் தேவை. பரிகாரம் குறித்து ஆலோசிக்கவும்."
            if has_dosha else "நாடி தோஷம் இல்லை."
        ),
        "note_en": (
            "Nadi Dosha present — children's health needs extra caution. Seek remedial guidance."
            if has_dosha else "No Nadi Dosha."
        ),
    }


def compute_porutham(
    *,
    boy_nakshatra: int,
    girl_nakshatra: int,
    boy_rasi: int,
    girl_rasi: int,
) -> PorutthamResult:
    """
    Compute all 10 Tamil Poruthams (pass/fail each, total out of 10).

    Parameters
    ----------
    boy_nakshatra / girl_nakshatra : int  1–27
    boy_rasi / girl_rasi           : int  1–12
    """
    scores = {
        "Dinam":           _dinam_score(boy_nakshatra, girl_nakshatra),
        "Ganam":           _ganam_score(boy_nakshatra, girl_nakshatra),
        "Mahendra":        _mahendra_score(boy_nakshatra, girl_nakshatra),
        "Stree Dirgham":   _stree_dirgha_score(boy_nakshatra, girl_nakshatra),
        "Yoni":            _yoni_score(boy_nakshatra, girl_nakshatra),
        "Rasi":            _rasi_score(boy_rasi, girl_rasi),
        "Rasiyathipathi":  _graha_maitri_kuta(boy_rasi, girl_rasi),
        "Vasya":           _vasya_score(boy_rasi, girl_rasi),
        "Rajju":           _rajju_score(boy_nakshatra, girl_nakshatra),
        "Vedha":           _vedha_score(boy_nakshatra, girl_nakshatra),
    }

    _names_ta = {
        "Dinam": "தினம்", "Ganam": "கணம்", "Mahendra": "மகேந்திரம்",
        "Stree Dirgham": "ஸ்திரீ தீர்கம்", "Yoni": "யோனி", "Rasi": "ராசி",
        "Rasiyathipathi": "ராசியாதிபதி", "Vasya": "வாஸ்யம்",
        "Rajju": "ராஜ்ஜு", "Vedha": "வேதம்",
    }

    kutas: list[KutaResult] = [
        KutaResult(
            name=name,
            name_ta=_names_ta[name],
            passed=bool(sc),
            score=sc,
            max_score=1,
            label="PASS" if sc else "FAIL",
        )
        for name, sc in scores.items()
    ]

    total = sum(scores.values())
    MAX_SCORE = 10
    percentage = round(total / MAX_SCORE * 100, 1)

    rajju_dosha = scores["Rajju"] == 0
    vedha_dosha = scores["Vedha"] == 0

    nadi_dosha = check_nadi_dosha(
        boy_nakshatra,
        girl_nakshatra,
        boy_rasi=boy_rasi,
        girl_rasi=girl_rasi,
    )

    if total >= 9:
        label = "EXCELLENT"
        summary_en = (
            f"Tamil 10-Porutham: {total}/10 — Outstanding compatibility across all poruthams. "
            "Traditionally considered a highly auspicious match."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total}/10 — அனைத்து பொருத்தங்களிலும் மிகச் சிறந்த இணக்கம். "
            "பாரம்பரியமாக மிகவும் சாதகமான திருமணமாக கருதப்படுகிறது."
        )
    elif total >= 7:
        label = "GOOD"
        summary_en = (
            f"Tamil 10-Porutham: {total}/10 — Good compatibility with minor differences. "
            "Traditionally considered a suitable match."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total}/10 — சில சிறு வேறுபாடுகளுடன் நல்ல இணக்கம். "
            "பாரம்பரியமாக ஏற்புடைய திருமணமாக கருதப்படுகிறது."
        )
    elif total >= 5:
        label = "AVERAGE"
        summary_en = (
            f"Tamil 10-Porutham: {total}/10 — Moderate compatibility. "
            "Some poruthams need attention; consultation with a jyotishi is advised."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total}/10 — நடுத்தர இணக்கம். "
            "சில பொருத்தங்களில் கவனம் தேவை; ஜோதிடர் ஆலோசனை உதவும்."
        )
    else:
        label = "CAUTION"
        summary_en = (
            f"Tamil 10-Porutham: {total}/10 — Significant incompatibilities found. "
            "Traditional guidance recommends careful consultation before proceeding."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total}/10 — குறிப்பிடத்தக்க பொருத்தமின்மை கண்டறியப்பட்டுள்ளது. "
            "தொடரும் முன் ஜோதிட ஆலோசனை அவசியம்."
        )

    if rajju_dosha:
        suffix_en = " ⚠ Rajju Dosha: same Rajju group — traditionally associated with widowhood risk; requires remedial attention."
        suffix_ta = " ⚠ ராஜ்ஜு தோஷம்: ஒரே ராஜ்ஜு வகுப்பு — வைதவ்ய ஆபத்துடன் தொடர்புடையது; பரிகாரம் அவசியம்."
        summary_en += suffix_en
        summary_ta += suffix_ta

    if vedha_dosha:
        suffix_en = " ⚠ Vedha Dosha: these nakshatras form a vedha pair — traditionally considered inauspicious."
        suffix_ta = " ⚠ வேத தோஷம்: இந்த நட்சத்திரங்கள் வேத ஜோடி — பாரம்பரியமாக சாதகமற்றதாக கருதப்படுகிறது."
        summary_en += suffix_en
        summary_ta += suffix_ta

    return PorutthamResult(
        kutas=kutas,
        total_score=total,
        max_score=MAX_SCORE,
        percentage=percentage,
        label=label,
        rajju_dosha=rajju_dosha,
        vedha_dosha=vedha_dosha,
        nadi_dosha=nadi_dosha,
        summary_en=summary_en,
        summary_ta=summary_ta,
    )
