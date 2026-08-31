"""
Tamil 10-Porutham compatibility engine (Thirukanitham tradition).

Implements the classical Tamil panchangam 10-porutham system. Each criterion is
graded on the classical three-fold ladder — **உத்தமம் / மத்யமம் / அதமம்**
(Uttama / Madhyama / Adhama) — and the result is expressed as a score out of 10.
Rajju and Vedha are absolute vetoes: if either is present the union is
traditionally considered inauspicious regardless of the overall score.

**Madhyama scores 0.5, and that is doctrine, not a convenience** (astrologer
ruling 2026-08-31). Madhyama is the acceptable-with-reservation tier — a weak
pass, not a soft fail; a practitioner never tells a family that a madhyama
porutham "failed". The hard 0 it used to carry was an artifact of this engine
being unable to express anything but true/false (the 2026-08-28 binary fallback),
and it was stricter than the sastra. Half a point is what madhyama means.

The 10 Poruthams (Tamil → calculation rule):
  1. Dinam      (தினம்)           — count boy's nak from girl's (1-based, 1-27); pass only for the classical good-count table (incl. the 9th/18th counts, Parama Mitra tara)
  2. Ganam      (கணம்)            — Deva/Manushya/Rakshasa; Deva+Deva or Deva+Manushya = pass
  3. Mahendra   (மகேந்திரம்)      — count boy's nak from girl's; pass if result ∈ {4,7,10,13,16,19,22,25}
  4. Stree Dirgham (ஸ்திரீ தீர்கம்) — count boy's nak from girl's; 1–7 Adhama,
     8–13 Madhyama (0.5), 14–27 Uttama
  5. Yoni       (யோனி)            — same or neutral animal pair = pass; hostile pair = fail
  6. Rasi       (ராசி)            — pass unless 6th or 8th position (Shashtashtaka) between rasis
  7. Rasiyathipathi (ராசியாதிபதி) — FAIL if either rasi lord regards the other as an enemy (one-way enmity fails)
  8. Vasya      (வாஸ்யம்)         — at least one rasi must be vasya of the other
  9. Rajju      (ராஜ்ஜு)          — same Rajju group = VETO (see RAJJU_SOURCE_TEXT_CATEGORY)
 10. Vedha      (வேதம்)           — Vedha nakshatra pair = VETO

Nakshatra numbers are 1-indexed (1 = Aswini … 27 = Revathi).
"""
from __future__ import annotations

import math
from dataclasses import dataclass

from app.calculations.astro import nakshatra_to_rasi
from app.calculations.chart_strength import SIGN_LORD

# ---------------------------------------------------------------------------
# The three-fold grade (astrologer ruling 2026-08-31)
#
# உத்தமம் / மத்யமம் / அதமம் — best / middling / worst. This ladder is general
# across Jyotisha, so the *mechanism* here is general: hard-coding 0.5 as a
# Sthree-Deergham special case would assert that only that one porutham has a
# middle state, which is false.
#
# A porutham's madhyama band is *populated* only where its thresholds are
# authored rather than paraphrased. Today that is Sthree Deergham alone; Rasi
# carries a classical madhyama too (see `_rasi_exception_lifts`) and drops in
# when Jothidam p.68 settles. Gana and arguably Yoni are the other real
# candidates. Dinam, Vasya, Rasyadipathi and Mahendra are rendered binary in
# practice. An ungraded porutham is simply the two-valued projection of the same
# ladder — a full pass reads UTTAMA, a fail reads ADHAMA, and no third state can
# arise.
# ---------------------------------------------------------------------------
GRADE_UTTAMA = "UTTAMA"
GRADE_MADHYAMA = "MADHYAMA"
GRADE_ADHAMA = "ADHAMA"

#: Score credit per grade. **Madhyama is a weak pass, so it earns half a point**
#: — see the module docstring for why a hard 0 was stricter than the doctrine.
GRADE_SCORE: dict[str, float] = {
    GRADE_UTTAMA: 1.0,
    GRADE_MADHYAMA: 0.5,
    GRADE_ADHAMA: 0.0,
}

#: **PERMANENTLY BINARY — never populate a madhyama band for these two.**
#:
#: Not "not yet": never. A gate is open or shut; there is no middling Rajju. This
#: is pinned on the same line as the reason, because the two facts read
#: separately look independent and are not: the veto below fires on
#: `score == 0`, so a graded Rajju would carry `score == 0.5` and **slip
#: straight past the veto**. The general grade mechanism would then have quietly
#: punched a hole in the hardest gate in the engine.
#: `test_porutham.py::test_veto_kutas_are_never_graded` enforces it.
BINARY_ONLY_KUTAS = frozenset({"Rajju", "Vedha"})


def format_porutham_total(total: float) -> str:
    """Render a half-point total for display: 8.5 -> "8.5", 8.0 -> "8".

    Without this every whole-number score starts reading "8.0/10" to every
    family the moment the total becomes a float — a silent cosmetic regression
    across all four surfaces, introduced by a change none of them asked for.
    """
    return f"{total:g}"


def porutham_band_label(total: float) -> str:
    """The porutham layer's own EXCELLENT/GOOD/AVERAGE/CAUTION word.

    **This is not the composite's 80/65/50 ladder and must not be lockstepped to
    it** (astrologer ruling 2026-08-31). The two answer different questions —
    this one is "how strong is the star-matching, on its own?", the composite's
    is "should this marriage proceed, all seven layers weighed?" — and they are
    allowed to differ. A couple with strong stars and ordinary charts *should*
    read "Porutham EXCELLENT" under a composite of GOOD; that reads correctly.

    **Ties break upward.** The total is rounded to the nearest band, and a
    trailing .5 — which only a madhyama can ever produce — rounds *up*, to the
    pass side. The justification is the same one behind the 0.5 itself: a
    madhyama is a weak pass, so at a boundary it tips toward passing, never
    away. Rounding it down would mean a madhyama never helps at a rung, which is
    the old binary under-credit creeping back in through the label after we paid
    to remove it from the score.

    So in effect EXCELLENT >= 8.5, GOOD >= 6.5, AVERAGE >= 4.5 — but as a
    *derived* rule, not a fresh cut of the rungs. The rungs are still 9/7/5.

    `math.floor(total + 0.5)` rather than `round()`: Python's `round()` is
    banker's rounding, so `round(8.5)` is 8 — it would break the tie *downward*,
    which is precisely the under-credit this rule exists to prevent.

    The band is composition-blind: 8.5 might be 8 clean poruthams plus one
    madhyama, or 7 clean plus three. That is the standing "which seven, not just
    how many" limitation, inherited here rather than created here.

    The nine anchor cases these rungs answer to — stated as verdicts an
    astrologer would give a family, which is the record, not the numbers — are
    in ``docs/RULINGS_2026-08-31_MADHYAMA_HALF_POINT.md``. Anchor 2 is the one
    that bites here: 8 clean plus a madhyama shortfall must still read
    EXCELLENT, which is what the upward tie-break delivers.
    """
    rounded = math.floor(total + 0.5)
    if rounded >= 9:
        return "EXCELLENT"
    if rounded >= 7:
        return "GOOD"
    if rounded >= 5:
        return "AVERAGE"
    return "CAUTION"


# ---------------------------------------------------------------------------
# Nakshatra → Gana mapping (1-based nakshatra index)
# Deva=1, Manushya=2, Rakshasa=3
# Public (also consumed by app.services.nakshatra_content for the per-star
# profile card's Ganam attribute — same classical table, not duplicated).
# ---------------------------------------------------------------------------
GANA_BY_NAKSHATRA: dict[int, int] = {
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
# Public (also consumed by app.services.nakshatra_content for the per-star
# profile card's Yoni attribute — same classical table, not duplicated).
# ---------------------------------------------------------------------------
YONI_BY_NAKSHATRA: dict[int, int] = {
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
# Classical assignment zigzags in a repeating 6-nakshatra cycle
# (Aadhi, Madhya, Anthya, Anthya, Madhya, Aadhi) — NOT contiguous blocks of 3.
# Aadhi   = 1,6,7,12,13,18,19,24,25
# Madhya  = 2,5,8,11,14,17,20,23,26
# Anthya  = 3,4,9,10,15,16,21,22,27
# ---------------------------------------------------------------------------
_NADI_CYCLE = ("AADHI", "MADHYA", "ANTHYA", "ANTHYA", "MADHYA", "AADHI")
_NAKSHATRA_NADI: dict[int, str] = {
    n: _NADI_CYCLE[(n - 1) % 6] for n in range(1, 28)
}

# ---------------------------------------------------------------------------
# Graha Maitri (planet friendship) table — Parashari Permanent Friendship
# Asymmetric: each entry (A, B) is A's view of B; 1.0=friend 0.5=neutral 0.0=enemy
# ---------------------------------------------------------------------------
_GRAHA_RELATION: dict[tuple[str, str], float] = {}

def _gr(a: str, b: str, a_to_b: float, b_to_a: float) -> None:
    _GRAHA_RELATION[(a, b)] = a_to_b
    _GRAHA_RELATION[(b, a)] = b_to_a

for _p in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"):
    _GRAHA_RELATION[(_p, _p)] = 1.0

#                              A→B   B→A
_gr("SUN",     "MOON",    1.0, 1.0)  # friends both ways
_gr("SUN",     "MARS",    1.0, 1.0)  # friends both ways
_gr("SUN",     "JUPITER", 1.0, 1.0)  # friends both ways
_gr("SUN",     "MERCURY", 0.5, 1.0)  # Sun:neutral, Mercury:friend
_gr("SUN",     "VENUS",   0.0, 0.0)  # enemies both ways
_gr("SUN",     "SATURN",  0.0, 0.0)  # enemies both ways
_gr("MOON",    "MERCURY", 1.0, 0.0)  # Moon:friend, Mercury:enemy
_gr("MOON",    "MARS",    0.5, 1.0)  # Moon:neutral, Mars:friend
_gr("MOON",    "JUPITER", 0.5, 1.0)  # Moon:neutral, Jupiter:friend
_gr("MOON",    "VENUS",   0.5, 0.0)  # Moon:neutral, Venus:enemy
_gr("MOON",    "SATURN",  0.5, 0.0)  # Moon:neutral, Saturn:enemy
_gr("MARS",    "MERCURY", 0.0, 0.5)  # Mars:enemy, Mercury:neutral
_gr("MARS",    "JUPITER", 1.0, 1.0)  # friends both ways
_gr("MARS",    "VENUS",   0.5, 0.5)  # neutral both ways
_gr("MARS",    "SATURN",  0.5, 0.0)  # Mars:neutral, Saturn:enemy
_gr("MERCURY", "JUPITER", 0.5, 0.0)  # Mercury:neutral, Jupiter:enemy
_gr("MERCURY", "VENUS",   1.0, 1.0)  # friends both ways
_gr("MERCURY", "SATURN",  0.5, 1.0)  # Mercury:neutral, Saturn:friend (Parashari; matches chart_strength._NATURAL_FRIENDS)
_gr("JUPITER", "VENUS",   0.0, 0.5)  # Jupiter:enemy, Venus:neutral
_gr("JUPITER", "SATURN",  0.5, 0.5)  # neutral both ways
_gr("VENUS",   "SATURN",  1.0, 1.0)  # friends both ways

# ---------------------------------------------------------------------------
# Rajju groups — "tent" cycle with period 9: Pada,Kati,Udara,Kanta,Sira,Kanta,Udara,Kati,Pada
# ---------------------------------------------------------------------------
_RAJJU_GROUP: dict[int, int] = {}
_rajju_cycle = [1, 2, 3, 4, 5, 4, 3, 2, 1] * 3
for _i, _rg in enumerate(_rajju_cycle, start=1):
    _RAJJU_GROUP[_i] = _rg

# ---------------------------------------------------------------------------
# Vedha — nakshatra pairs that afflict each other (absolute veto)
#
# EC-RULING-02 (2026-08-17): HELD. **RESOLVED 2026-08-17** — the triad is real,
# and what shipped was a transcription loss rather than a rival tradition.
#
# The hold asked for the FULL printed table, "not just the Chitra line, since
# the surrounding rows are what disambiguate which structure the source is
# using". Jothidam p.70 supplies it, and the surrounding rows settle it three
# ways over:
#
#   1. TWELVE of the thirteen shipped rows are verbatim identical to p.70. The
#      thirteenth, {5,23}, is p.70's closing line — "Mrigashirsha, Chitra and
#      Dhanishta are mutually Vedha with one another" — flattened to a single
#      edge with Chitra dropped. Same source, one row lost, not variance.
#   2. 27 is ODD. A pairing cannot cover it, so reading (a) was never a rival
#      structure: it is the arithmetic residue of losing a triad member. Any
#      table that vetoes on 13 pairs necessarily exempts exactly one star.
#   3. The pair sums fall into three families of four — 19, 28, 37 — and the
#      triad members are the one star each family is missing (5+14=19,
#      5+23=28, 14+23=37). They sit at 5, 14, 23: ≡5 (mod 9), the middle star
#      of each nakshatra ninth. The same triple recurs in the source as a
#      natural class at p.69 (Siro Rajju) and pp.60-61 (Kuja Dosha exemption).
#
# Behavioural effect: {5,14} and {14,23} now veto. Chitra × Mrigashira and
# Chitra × Dhanishta fail Vedha where they used to pass; nothing that failed
# before now passes.
VEDHA_TABLE_UNVERIFIED = False
VEDHA_OPEN_QUESTION = (
    "RESOLVED against Jothidam p.70: Mrigashira/Chitra/Dhanishta are mutually "
    "Vedha, so all 27 stars are covered and no star is veto-exempt."
)

_VEDHA_PAIRS: frozenset[frozenset[int]] = frozenset(
    frozenset(p) for p in [
        {1, 18}, {2, 17}, {3, 16}, {4, 15},
        {6, 22}, {7, 21}, {8, 20}, {9, 19}, {10, 27},
        {11, 26}, {12, 25}, {13, 24},
        # p.70 closing line — a mutual TRIAD, not a pair. All three edges.
        {5, 14}, {5, 23}, {14, 23},
    ]
)

# ---------------------------------------------------------------------------
# Vasya — rasi-to-rasi vasya table (classical Tamil Thirukanitham tradition)
# Key = rasi (1-based), Value = rasis it controls
#
# Two rows were INCOMPLETE until 2026-08-17 and are corrected below. The gap was
# invisible to any test because every row still looked like a valid vasya row on
# its own; only a full-table diff against a printed source caught it. Both
# additions are attested by two independent authorities that agree with each
# other and disagree with the shipped code:
#
#   * Vrischika (8) → Kanni (6): Jothidam p.69 vasya table AND the standard
#     Muhurta-Chintamani/Jataka-Parijata table both give Vrischika two vasya
#     signs (Kataka AND Kanni); the code carried only Kataka.
#   * Makara (10) → Kumbha (11): the standard table gives Makara both Mesha and
#     Kumbha; Jothidam p.69 gives Kumbha. The code carried only Mesha, i.e. the
#     one sign the book does *not* list.
#
# Effect: both are missing PASSes, never spurious ones — couples who should have
# cleared Vasya porutham were being failed on it. Simha (5) → Thula (7) is
# deliberately kept as-is: Jothidam p.69 prints Makara there, which contradicts
# every standard table and is treated as a source/OCR defect, not doctrine.
# ---------------------------------------------------------------------------
_VASYA: dict[int, frozenset[int]] = {
    1:  frozenset({5, 8}),   # Mesha   → Simha, Vrischika
    2:  frozenset({4, 7}),   # Rishaba → Kataka, Thula
    3:  frozenset({6}),      # Mithuna → Kanni
    4:  frozenset({8, 9}),   # Kataka  → Vrischika, Dhanus
    5:  frozenset({7}),      # Simha   → Thula
    6:  frozenset({3, 12}),  # Kanni   → Mithuna, Meena
    7:  frozenset({10}),     # Thula   → Makara
    8:  frozenset({4, 6}),   # Vrischika → Kataka, Kanni
    9:  frozenset({12}),     # Dhanus  → Meena
    10: frozenset({1, 11}),  # Makara  → Mesha, Kumbha
    11: frozenset({1}),      # Kumbha  → Mesha
    12: frozenset({10}),     # Meena   → Makara
}


# ---------------------------------------------------------------------------
# Individual porutham checks — each returns 1 (PASS) or 0 (FAIL)
# ---------------------------------------------------------------------------

# Spec §11.4 — count boy's nak from girl's (1-based, 1..27); these counts pass.
# Includes the 9th/18th counts (Parama Mitra tara) as a pass. 17/22/27 are
# deliberately absent: a pure tara-mod-9 rule would pass them, but the locked
# spec table is the 12-count Tamil variant — the product stance.
_DINAM_GOOD_COUNTS = frozenset({2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26})


def _dinam_score(nak_boy: int, nak_girl: int) -> int:
    """Dinam: count boy's nak from girl's (1-based); PASS if count in the classical good-count table."""
    count = ((nak_boy - nak_girl) % 27) + 1
    return 1 if count in _DINAM_GOOD_COUNTS else 0


def _ganam_score(nak_boy: int, nak_girl: int) -> int:
    """Ganam: same gana or Deva+Manushya = PASS; Rakshasa mix = FAIL."""
    gb = GANA_BY_NAKSHATRA[nak_boy]
    gg = GANA_BY_NAKSHATRA[nak_girl]
    if gb == gg:
        return 1
    if frozenset({gb, gg}) == frozenset({1, 2}):  # Deva + Manushya
        return 1
    return 0


def _mahendra_score(nak_boy: int, nak_girl: int) -> int:
    """Mahendra: count boy's nak from girl's (1-based); PASS if result ∈ {4,7,10,13,16,19,22,25}.

    Doctrine A-18 (ruled 2026-08-19): the count runs from the bride's nakshatra
    to the groom's — the girl's star is the base and counts as 1. This corrects
    the direction we had recorded (girl counted from the boy's star), which was
    the opposite of the reference spec (§11.5) and of the worked examples.

    No PASS/FAIL outcome changes, and that is the trap this note exists to flag:
    {4,7,10,13,16,19,22,25} is closed under c -> 29-c (the two count directions
    around a 27-star ring always sum to 29), so the set is direction-blind and
    the wrong direction was invisible. That symmetry is an accident of this
    particular set, not a general guarantee — any future edit to the set can
    break it silently. `test_mahendra_good_set_symmetric_under_direction_reversal`
    pins the accident so the breakage would be caught.
    """
    diff = (nak_boy - nak_girl) % 27 + 1
    return 1 if diff in {4, 7, 10, 13, 16, 19, 22, 25} else 0


def _stree_dirgha_band(nak_boy: int, nak_girl: int) -> str:
    """Return the ruled Sthree Deergham grade for the inclusive star count.

    Astrologer ruling 2026-08-28: 1–7 ADHAMA, 8–13 MADHYAMA, 14–27 UTTAMA.

    The 2026-08-28 ruling added a binary fallback ("the point is awarded at
    >= 14") because the engine could not then express anything but 0 or 1. The
    2026-08-31 ruling removed that constraint: Madhyama now scores 0.5 via
    `GRADE_SCORE`, which is what the grade actually means. The band itself is
    unchanged — only the credit it earns.
    """
    count = (nak_boy - nak_girl) % 27 + 1
    if count <= 7:
        return GRADE_ADHAMA
    if count <= 13:
        return GRADE_MADHYAMA
    return GRADE_UTTAMA


def _yoni_score(nak_boy: int, nak_girl: int) -> int:
    """Yoni: hostile pair = FAIL; same or neutral = PASS."""
    yb = YONI_BY_NAKSHATRA[nak_boy]
    yg = YONI_BY_NAKSHATRA[nak_girl]
    if frozenset({yb, yg}) in _YONI_HOSTILE:
        return 0
    return 1


# EC-RULING-01 (2026-08-17) opened these DISABLED because neither reported
# refinement arrived with a quoted passage. ASTROLOGER RULING 2026-08-28 (`A-5`)
# ENABLES the two that now have one, and holds the third.
#
# The ruling: "Enable BOTH + the six enumerated pairs [CLASSICAL p.74]. 2nd =
# [CLASSICAL:KP], 6th even-sign = [LINEAGE:Jothidam]. Enumerated pairs beat
# even-sign generic at the 6th. Where both lift a pairing, show the more
# conservative grade."
#
# So this is not "which text governs" — it is BOTH texts, each marked with where
# it comes from, plus a stated precedence. Kalaprakasika's 2nd-position
# exception and Jothidam's 6th-position one are different claims about different
# positions, not rival versions of one claim.
RASI_EXCEPTIONS_ENABLED = True

#: Inclusive bride->groom counts the source marks adverse.
_RASI_ADVERSE_COUNTS: frozenset[int] = frozenset({2, 3, 4, 5, 6})

# ── 2nd position — Kalaprakasika p.74, verbatim [CLASSICAL:KP] ───────────────
#
#   "Even if the Jenma-Rasi of the bridegroom be the 2nd from that of the bride,
#    the effect will be good if such Jenma-Rasi be an even sign ... If it be an
#    odd sign, it will do harm."
#
# The test is on the GROOM's rasi (the "such Jenma-Rasi" the sentence has just
# named), not the bride's. Even signs are Rishabha, Kataka, Kanni, Vrichigam,
# Makaram, Meenam — the even ordinals.
RASI_SECOND_POSITION_EVEN_SIGN_LIFTS: bool = True

# ── 6th position — Kalaprakasika p.74, verbatim [CLASSICAL:KP] ───────────────
#
#   "Aries and Virgo; Sagittari and Taurus; Libra and Pisces; Aquarius and
#    Cancer; Leo and Capricorn; Gemini and Scorpio."
#
# Stored as (bride rasi, groom rasi). Each printed pair is a 6th-position
# pairing in exactly one direction — the reverse direction is the 8th, which
# this rule does not address — so the ordering is the text's, not a choice.
_RASI_SIXTH_PAIR_EXCEPTIONS: frozenset[tuple[int, int]] = frozenset({
    (1, 6),    # Mesham  -> Kanni
    (9, 2),    # Dhanusu -> Rishabham
    (7, 12),   # Thulam  -> Meenam
    (11, 4),   # Kumbam  -> Kadagam
    (5, 10),   # Simmam  -> Makaram
    (3, 8),    # Mithunam-> Vrichigam
})

# ── 6th position — Jothidam p.68 [LINEAGE:Jothidam]. RULED IN, HELD UNFILLED ──
#
# The ruling enables this row. It is **not** filled here, and the reason is the
# same one that kept the whole block disabled until today: we hold a paraphrase
# of p.68 ("even sign from Rishabha, groom 6th -> Madhyama"), not the sentence.
# Filling a set from a paraphrase is the exact failure EC-RULING-01 named.
#
# Two things must be settled on the page before this fires, and one of them is a
# question for the astrologer rather than for the book:
#
#  1. **Scope.** Does "even sign" mean every even rasi, or the even signs
#     counted *from* Rishabha (a subset)? The paraphrase carries both readings.
#  2. **Coverage — and this is the substantive one.** At the 6th, the groom's
#     rasi is always the bride's parity flipped, so the six enumerated pairs
#     above are exactly the cases with an ODD bride and an EVEN groom. If
#     Jothidam's exception is read as "every even sign", it covers precisely the
#     six pairings the enumerated list does *not*, and the two rules together
#     would lift **every** 6th-position pairing — retiring the 6th-position
#     failure entirely. That is a much larger change than "enable an exception",
#     and it is not what the ruling appears to intend.
#
# So the schema is live and the set is empty: enabling this row changes nothing
# until the page settles it. That is deliberate and must not be read as the rule
# being switched off.
_RASI_SIXTH_EVEN_SIGN_JOTHIDAM: frozenset[int] = frozenset()
RASI_EXCEPTION_GAP = (
    "The 2nd-position even-sign exception and the six 6th-position pair "
    "exceptions are live (Kalaprakasika p.74). Jothidam p.68's 6th-position "
    "even-sign exception is ruled in but held: we hold a paraphrase, not the "
    "sentence, and its scope decides whether the 6th-position failure survives "
    "at all."
)


def _rasi_exception_lifts(count: int, rasi_girl: int, rasi_boy: int) -> bool:
    """Whether a sourced exception lifts an otherwise-adverse rasi count.

    PRECEDENCE, per the ruling: at the 6th the enumerated pairs are the specific
    rule and beat the even-sign generic. Where more than one route would lift the
    same pairing, the more conservative grade wins — which, while every criterion
    is pass/fail, means a lift needs only one route and no route can *soften* a
    verdict another route already gives. When the Madhyama grade lands (`A-7`
    carries the same three-band shape), this is the function that has to return
    the minimum rather than a boolean.
    """
    if count == 2:
        return RASI_SECOND_POSITION_EVEN_SIGN_LIFTS and rasi_boy % 2 == 0
    if count == 6:
        if (rasi_girl, rasi_boy) in _RASI_SIXTH_PAIR_EXCEPTIONS:
            return True
        return rasi_boy in _RASI_SIXTH_EVEN_SIGN_JOTHIDAM
    # 3rd, 4th and 5th: no exception is stated by either text.
    return False


def _inclusive_rasi_count(from_rasi: int, to_rasi: int) -> int:
    """Inclusive 1..12 count from one sign to another. The base sign counts as 1."""
    return (to_rasi - from_rasi) % 12 + 1


def _rasi_score(rasi_boy: int, rasi_girl: int) -> int:
    """Rasi porutham — an ASYMMETRIC bride->groom directional count.

    EC-RULING-01: the previous implementation failed Shashtashtaka (6th or 8th,
    measured in *either* direction). That is the North Indian Bhakoot rule, and
    it is a structurally different rule — symmetric, and about a different set of
    positions — not a regional variant of this one. The Tamil rule counts
    inclusively **from the bride's rasi to the groom's** and reads:

        1            -> same-rasi handling (a separate rule; see below)
        2, 3, 4, 5, 6 -> adverse
        7            -> favourable
        8..12        -> favourable, as the converse of the corresponding
                        reverse-direction case (a count of d one way is 14 - d
                        the other, so 8..12 mirror 6..2)

    Net effect versus the old rule: 2nd/3rd/4th/5th from the bride now fail where
    they used to pass, and 8th now passes where it used to fail.

    Same-rasi (count 1) returns PASS, which is the source's base position. The
    refinement that grades it on the partners' relative nakshatra order is
    deliberately NOT applied here — it is a different rule with its own
    exception lists, and those lists are unverified (see RASI_EXCEPTION_GAP).
    """
    count = _inclusive_rasi_count(rasi_girl, rasi_boy)

    if count == 1:
        # Routed out of this rule per the ruling, not silently folded in.
        return 1

    if count in _RASI_ADVERSE_COUNTS:
        if RASI_EXCEPTIONS_ENABLED and _rasi_exception_lifts(count, rasi_girl, rasi_boy):
            # A MISSING PASS restored, never a new fail: every exception here
            # moves a couple from FAIL to PASS. Same shape as the 2026-08-17
            # Vasya defect — couples who should have cleared were being failed.
            return 1
        return 0

    return 1


def _graha_maitri_kuta(rasi_boy: int, rasi_girl: int) -> int:
    """Rasiyathipathi: FAIL if either rasi lord considers the other an enemy."""
    lb = SIGN_LORD[rasi_boy]
    lg = SIGN_LORD[rasi_girl]
    ab = _GRAHA_RELATION.get((lb, lg), 0.5)
    ba = _GRAHA_RELATION.get((lg, lb), 0.5)
    return 0 if (ab == 0.0 or ba == 0.0) else 1


def _rajju_score(nak_boy: int, nak_girl: int) -> int:
    """Rajju: same Rajju group = FAIL (veto); different group = PASS.

    EC-RULING-04 (2026-08-17): the eka-nakshatra exemption was removed. It used
    to return PASS whenever both partners shared a birth star, which is
    self-defeating — the same star is necessarily the same Rajju group, so the
    exemption silently waived the veto in the *most* concentrated case the rule
    describes.

    Its provenance was a category error: *eka nakshatra – bhinna pada* is a
    classical exception to **Nadi** dosha, and this repo implements it correctly
    there (`check_nadi_dosha`). It has no textual basis inside the Rajju rule,
    which states five groups and prohibits same-group membership without
    qualification.

    KNOWN GAP, deliberately not filled: the ruling asked whether a *separate,
    general* mitigation passage exists covering Rajju/Vedha/Gana/Rasi together
    (rasi-lord relationships, opposite-sign configurations). No matching or
    porutham chapter has been extracted into this repo at all — every
    `kalaprakasika_*` module here is a muhurta chapter, and the porutham tables
    come from the Formula Engine Specification, not from a primary text. So the
    passage can be neither confirmed nor ruled out from inside this codebase.
    Per the ruling, it is therefore left unencoded and flagged rather than
    assumed: if it turns up, it is a different rule from the one removed here
    and must be added on its own citation, not restored as this exemption.
    """
    return 0 if _RAJJU_GROUP[nak_boy] == _RAJJU_GROUP[nak_girl] else 1


def _vedha_score(nak_boy: int, nak_girl: int) -> int:
    """Vedha: vedha nakshatra pair = FAIL (veto); else PASS."""
    return 0 if frozenset({nak_boy, nak_girl}) in _VEDHA_PAIRS else 1


def _vasya_score(rasi_boy: int, rasi_girl: int) -> int:
    """Vasya: same rasi, or at least one rasi vasya of the other = PASS; else FAIL."""
    if rasi_boy == rasi_girl:
        return 1
    bg = rasi_girl in _VASYA.get(rasi_boy, frozenset())
    gb = rasi_boy in _VASYA.get(rasi_girl, frozenset())
    return 1 if (bg or gb) else 0


# ---------------------------------------------------------------------------
# Public dataclasses and entry point
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class KutaResult:
    """One porutham's result.

    **`score` and `passed` answer different questions, and they diverge exactly
    at Madhyama — which is the whole reason the grade exists.** Do not collapse
    them into one flag (ruling 2026-08-31):

    * `score`  — the weighted credit: 1.0 / 0.5 / 0.0. All arithmetic reads
      this, and so does the Rajju/Vedha veto (`score == 0`).
    * `grade`  — UTTAMA / MADHYAMA / ADHAMA. Drives green / amber / red on any
      consumer that can paint three states.
    * `passed` — derived, `grade != ADHAMA`. **The floor for binary consumers.**
      A madhyama is a pass, so this is True for it. A surface that can only
      paint two states then *overstates* a weak pass as a full pass — an error
      on the correct side of the doctrine — instead of the one error that is
      not permitted anywhere: rendering Fail for a couple the doctrine passes.

    `is_uttama` is the "earned full marks" concept, for consumers that need it;
    it is deliberately not smuggled into `passed`.
    """

    name: str
    name_ta: str
    passed: bool
    score: float    # 1.0 = uttama, 0.5 = madhyama, 0.0 = adhama
    max_score: int  # always 1
    label: str      # "PASS" or "FAIL"
    grade: str      # UTTAMA / MADHYAMA / ADHAMA

    @property
    def is_uttama(self) -> bool:
        return self.grade == GRADE_UTTAMA


@dataclass(frozen=True, slots=True)
class PorutthamResult:
    kutas: list[KutaResult]
    total_score: float  # 0–10, in halves (a .5 can only come from a madhyama)
    max_score: int     # always 10
    percentage: float
    label: str         # EXCELLENT / GOOD / AVERAGE / CAUTION
    rajju_dosha: bool
    vedha_dosha: bool
    nadi_dosha: dict[str, object]
    summary_en: str
    summary_ta: str


# ---------------------------------------------------------------------------
# Nadi Dosha cancellation (A-9 v2, astrologer ruling 2026-07-14)
#
# "Different rasi alone" does NOT cancel Nadi Dosha (the old rule was too
# lenient and is retired). Cancellation requires one of:
#   1. A Classical Exception (Parihāra) — applies in every mode:
#        - same nakshatra, different pada (eka nakshatra – bhinna pada)
#        - same rasi, different nakshatra (eka rasi – bhinna nakshatra)
#   2. Rasi-lord friendship (rasi-adhipati maitri), when Moon signs differ —
#      gated by the `nadi_parihara_mode` flag: `classical_lenient` grants a
#      full cancel, `strict` (default) records only a disclosed partial
#      mitigation — the dosha stays flagged.
# Same nakshatra + same pada is an explicit non-exception (never cancels).
# A Rajju hard-fail is surfaced independently of Nadi status in all modes —
# see `rajju_failed` — and `compute_porutham` separately forces the overall
# label to CAUTION whenever Rajju fails, so a Nadi exception can never imply
# the match is clear.
#
# Tamil text below was native-reviewed and approved as-is on 2026-07-15 (A-9
# Tamil pass, docs/tamil-review-nadi-dosha.md, status RESOLVED) — all six new v2
# sentences confirmed native-quality, no corrections. Locked by
# tests/test_nadi_dosha_v2.py::test_nadi_v2_tamil_strings_native_reviewed_locked;
# any edit here must go through review + update that golden test.
# ---------------------------------------------------------------------------

# ── EC-RULING-06 internal traceability ──────────────────────────────────────
#
# The source's own framing for the Rajju prohibition is a longevity/spouse-loss
# concern. That framing is inadmissible in user-facing output (EC-A11), but the
# rule still has to be traceable back to what the text actually says, or the
# engine ends up asserting a veto it cannot explain to an astrologer.
#
# These two constants are the sanctioned carrier: a machine-readable reason code
# and a *category*, never the sentence. `tests/test_porutham.py` asserts they
# never appear in any rendered string, so "keep it internal" is enforced rather
# than merely intended.
RAJJU_REASON_CODE = "RAJJU_SAME_GROUP"
RAJJU_SOURCE_TEXT_CATEGORY = "traditional_longevity_concern"

_NADI_PARIHARA_MODES = ("strict", "classical_lenient")

_NADI_PRESENT_EN = "Nadi Dosha present — children's health needs extra caution. Seek remedial guidance."
_NADI_PRESENT_TA = "நாடி தோஷம் உள்ளது — குழந்தைகள் உடல்நலத்தில் கவனம் தேவை. பரிகாரம் குறித்து ஆலோசிக்கவும்."
_NADI_NONE_EN = "No Nadi Dosha."
_NADI_NONE_TA = "நாடி தோஷம் இல்லை."

_NADI_EXCEPTION_PADA_EN = "Classical Exception (Parihāra): same nakshatra, different pada."
_NADI_EXCEPTION_PADA_TA = "பாரம்பரிய விதிவிலக்கு (பரிகாரம்): ஒரே நட்சத்திரம், வேறு பாதம்."
_NADI_EXCEPTION_RASI_EN = "Classical Exception (Parihāra): same rasi, different nakshatra."
_NADI_EXCEPTION_RASI_TA = "பாரம்பரிய விதிவிலக்கு (பரிகாரம்): ஒரே ராசி, வேறு நட்சத்திரம்."
_NADI_LENIENT_CANCEL_EN = (
    "Nadi Dosha may be considered cancelled when the Moon signs differ and the "
    "respective Rasi lords are identical or mutually friendly, subject to the "
    "tradition being followed. Different Rasi alone should not automatically "
    "cancel the dosha."
)
_NADI_LENIENT_CANCEL_TA = (
    "ராசிகள் வேறுபட்டு, அந்தந்த ராசி அதிபதிகள் ஒரே கிரகமாகவோ அல்லது பரஸ்பர "
    "நண்பர்களாகவோ இருக்கும்போது, பின்பற்றப்படும் பாரம்பரியத்தைப் பொறுத்து நாடி "
    "தோஷம் நீங்கியதாகக் கருதப்படலாம். வெறும் ராசி வேறுபாடு மட்டும் தோஷத்தை "
    "தானாக நீக்காது."
)
_NADI_STRICT_PARTIAL_EN = (
    "The Rasi lords are friendly, but under the strict reading followed here "
    "this is only a partial mitigation, not a full clearance of Nadi Dosha."
)
_NADI_STRICT_PARTIAL_TA = (
    "ராசி அதிபதிகள் நட்புடையவர்களாக இருந்தாலும், இங்கு பின்பற்றப்படும் கடுமையான "
    "நடைமுறையின்படி இது ஒரு பகுதி தணிப்பு மட்டுமே — நாடி தோஷம் முழுமையாக நீங்கவில்லை."
)
_NADI_CLOSING_CLAUSE_EN = (
    "This removes only the Nadi objection. Other mandatory poruthams "
    "(Rajju, Vedhai, Mahendra, Yoni, etc.) are evaluated independently."
)
_NADI_CLOSING_CLAUSE_TA = (
    "இது நாடி ஆட்சேபனையை மட்டுமே நீக்குகிறது. மற்ற கட்டாய பொருத்தங்கள் "
    "(ராஜ்ஜு, வேதம், மகேந்திரம், யோனி போன்றவை) தனித்தனியாக மதிப்பிடப்படுகின்றன."
)
_NADI_RAJJU_WARNING_EN = "Rajju Dosha still applies regardless of the Nadi outcome above."
_NADI_RAJJU_WARNING_TA = "மேலே உள்ள நாடி முடிவைப் பொருட்படுத்தாமல் ராஜ்ஜு தோஷம் இன்னும் பொருந்தும்."


def _rasi_lords_mutually_friendly(rasi_a: int, rasi_b: int) -> bool:
    """Rasi-adhipati maitri: identical lord, or friends in BOTH directions
    (Parashari mitra tier — a one-way neutral/friend does not qualify)."""
    lord_a = SIGN_LORD[rasi_a]
    lord_b = SIGN_LORD[rasi_b]
    if lord_a == lord_b:
        return True
    a_to_b = _GRAHA_RELATION.get((lord_a, lord_b), 0.5)
    b_to_a = _GRAHA_RELATION.get((lord_b, lord_a), 0.5)
    return a_to_b >= 1.0 and b_to_a >= 1.0


def check_nadi_dosha(
    boy_nakshatra: int,
    girl_nakshatra: int,
    *,
    boy_rasi: int | None = None,
    girl_rasi: int | None = None,
    boy_pada: int = 1,
    girl_pada: int = 1,
    mode: str = "strict",
    rajju_failed: bool = False,
) -> dict[str, object]:
    if mode not in _NADI_PARIHARA_MODES:
        mode = "strict"

    boy_nadi = _NAKSHATRA_NADI[boy_nakshatra]
    girl_nadi = _NAKSHATRA_NADI[girl_nakshatra]
    has_dosha = boy_nadi == girl_nadi
    boy_resolved_rasi = boy_rasi if boy_rasi is not None else nakshatra_to_rasi(boy_nakshatra, boy_pada)
    girl_resolved_rasi = girl_rasi if girl_rasi is not None else nakshatra_to_rasi(girl_nakshatra, girl_pada)

    nadi_cancelled = False
    mitigation = "NONE"
    cancellations: list[str] = []
    extra_en: list[str] = []
    extra_ta: list[str] = []

    if has_dosha:
        same_nakshatra = boy_nakshatra == girl_nakshatra
        same_pada = boy_pada == girl_pada
        same_rasi = boy_resolved_rasi == girl_resolved_rasi

        if same_nakshatra and same_pada:
            pass  # explicit guard: identical star AND pada never cancels
        elif same_nakshatra and not same_pada:
            nadi_cancelled = True
            mitigation = "FULL"
            cancellations.append("Classical Exception (Parihāra): same nakshatra, different pada")
            extra_en.append(_NADI_EXCEPTION_PADA_EN)
            extra_ta.append(_NADI_EXCEPTION_PADA_TA)
        elif same_rasi and not same_nakshatra:
            nadi_cancelled = True
            mitigation = "FULL"
            cancellations.append("Classical Exception (Parihāra): same rasi, different nakshatra")
            extra_en.append(_NADI_EXCEPTION_RASI_EN)
            extra_ta.append(_NADI_EXCEPTION_RASI_TA)
        elif not same_rasi and _rasi_lords_mutually_friendly(boy_resolved_rasi, girl_resolved_rasi):
            if mode == "classical_lenient":
                nadi_cancelled = True
                mitigation = "FULL"
                cancellations.append("Cancelled (lenient tradition): friendly/identical rasi lords")
                extra_en.append(_NADI_LENIENT_CANCEL_EN)
                extra_ta.append(_NADI_LENIENT_CANCEL_TA)
            else:
                mitigation = "MODERATE"
                cancellations.append("Partial mitigation only: friendly rasi lords (strict mode)")
                extra_en.append(_NADI_STRICT_PARTIAL_EN)
                extra_ta.append(_NADI_STRICT_PARTIAL_TA)
        # else: no cancellation, mitigation stays NONE (regression fix — a
        # difference in rasi alone, with unrelated lords, no longer cancels)

    if nadi_cancelled or mitigation != "NONE":
        cancellations.append(_NADI_CLOSING_CLAUSE_EN)
        extra_en.append(_NADI_CLOSING_CLAUSE_EN)
        extra_ta.append(_NADI_CLOSING_CLAUSE_TA)

    rajju_guard_warning: str | None = None
    if rajju_failed:
        rajju_guard_warning = _NADI_RAJJU_WARNING_EN
        extra_en.append(_NADI_RAJJU_WARNING_EN)
        extra_ta.append(_NADI_RAJJU_WARNING_TA)

    final_has_dosha = has_dosha and not nadi_cancelled
    severity = "SEVERE" if final_has_dosha else ("MILD" if has_dosha else "NONE")

    base_en = _NADI_PRESENT_EN if has_dosha else _NADI_NONE_EN
    base_ta = _NADI_PRESENT_TA if has_dosha else _NADI_NONE_TA
    note_en = " ".join([base_en, *extra_en])
    note_ta = " ".join([base_ta, *extra_ta])

    return {
        "boy_nadi": boy_nadi,
        "girl_nadi": girl_nadi,
        "boy_rasi": boy_resolved_rasi,
        "girl_rasi": girl_resolved_rasi,
        "has_nadi_dosha": final_has_dosha,
        "cancellations": cancellations,
        "severity": severity,
        "mitigation": mitigation,
        "nadi_parihara_mode": mode,
        "rajju_guard_warning": rajju_guard_warning,
        "note_ta": note_ta,
        "note_en": note_en,
    }


def compute_porutham(
    *,
    boy_nakshatra: int,
    girl_nakshatra: int,
    boy_rasi: int,
    girl_rasi: int,
    boy_pada: int = 1,
    girl_pada: int = 1,
    nadi_parihara_mode: str = "strict",
) -> PorutthamResult:
    """
    Compute all 10 Tamil Poruthams (pass/fail each, total out of 10).

    Parameters
    ----------
    boy_nakshatra / girl_nakshatra : int  1–27
    boy_rasi / girl_rasi           : int  1–12
    boy_pada / girl_pada           : int  1–4, real birth pada when known —
        feeds the Nadi "same nakshatra, different pada" Classical Exception
        (A-9 v2). Defaults to 1/1 (conservative: never spuriously grants the
        exception) when the caller doesn't have real pada data.
    nadi_parihara_mode             : "strict" (default) | "classical_lenient"
        — resolved by the caller from the `nadi_parihara_mode` feature flag;
        this module deliberately does not read flags itself (calculations
        layer stays flag-agnostic).
    """
    stree_dirgha_band = _stree_dirgha_band(boy_nakshatra, girl_nakshatra)
    scores = {
        "Dinam":           _dinam_score(boy_nakshatra, girl_nakshatra),
        "Ganam":           _ganam_score(boy_nakshatra, girl_nakshatra),
        "Mahendra":        _mahendra_score(boy_nakshatra, girl_nakshatra),
        "Stree Dirgha":    GRADE_SCORE[stree_dirgha_band],
        "Yoni":            _yoni_score(boy_nakshatra, girl_nakshatra),
        "Rasi":            _rasi_score(boy_rasi, girl_rasi),
        "Graha Maitri":    _graha_maitri_kuta(boy_rasi, girl_rasi),
        "Vasya":           _vasya_score(boy_rasi, girl_rasi),
        "Rajju":           _rajju_score(boy_nakshatra, girl_nakshatra),
        "Vedha":           _vedha_score(boy_nakshatra, girl_nakshatra),
    }

    _names_ta = {
        "Dinam": "தினம்", "Ganam": "கணம்", "Mahendra": "மகேந்திரம்",
        "Stree Dirgha": "ஸ்திரீ தீர்கம்", "Yoni": "யோனி", "Rasi": "ராசி",
        "Graha Maitri": "ராசியாதிபதி", "Vasya": "வாஸ்யம்",
        "Rajju": "ராஜ்ஜு", "Vedha": "வேதம்",
    }

    # An authored madhyama band, per porutham. Only Sthree Deergham carries one
    # today; every other porutham projects onto the two-valued ends of the same
    # ladder. `BINARY_ONLY_KUTAS` must never appear as a key here — see its
    # comment for the veto hole that would open if it did.
    graded_bands = {"Stree Dirgha": stree_dirgha_band}
    assert not (graded_bands.keys() & BINARY_ONLY_KUTAS), (
        "Rajju/Vedha are permanently binary: a graded veto kuta would score 0.5 "
        "and slip past the `score == 0` veto."
    )

    def _grade_for(name: str, sc: float) -> str:
        if name in graded_bands:
            return graded_bands[name]
        return GRADE_UTTAMA if sc >= 1 else GRADE_ADHAMA

    kutas: list[KutaResult] = []
    for name, sc in scores.items():
        grade = _grade_for(name, sc)
        # `passed` is the binary floor and follows the doctrine, not the full
        # point: a madhyama is a pass. See KutaResult's docstring.
        passed = grade != GRADE_ADHAMA
        kutas.append(
            KutaResult(
                name=name,
                name_ta=_names_ta[name],
                passed=passed,
                score=sc,
                max_score=1,
                label="PASS" if passed else "FAIL",
                grade=grade,
            )
        )

    total = sum(scores.values())
    MAX_SCORE = 10
    percentage = round(total / MAX_SCORE * 100, 1)
    total_str = format_porutham_total(total)

    rajju_dosha = scores["Rajju"] == 0
    vedha_dosha = scores["Vedha"] == 0

    nadi_dosha = check_nadi_dosha(
        boy_nakshatra,
        girl_nakshatra,
        boy_rasi=boy_rasi,
        girl_rasi=girl_rasi,
        boy_pada=boy_pada,
        girl_pada=girl_pada,
        mode=nadi_parihara_mode,
        rajju_failed=rajju_dosha,
    )

    label = porutham_band_label(total)
    if label == "EXCELLENT":
        summary_en = (
            f"Tamil 10-Porutham: {total_str}/10 — Outstanding compatibility across all poruthams. "
            "Traditionally considered a highly auspicious match."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total_str}/10 — அனைத்து பொருத்தங்களிலும் மிகச் சிறந்த இணக்கம். "
            "பாரம்பரியமாக மிகவும் சாதகமான திருமணமாக கருதப்படுகிறது."
        )
    elif label == "GOOD":
        summary_en = (
            f"Tamil 10-Porutham: {total_str}/10 — Good compatibility with minor differences. "
            "Traditionally considered a suitable match."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total_str}/10 — சில சிறு வேறுபாடுகளுடன் நல்ல இணக்கம். "
            "பாரம்பரியமாக ஏற்புடைய திருமணமாக கருதப்படுகிறது."
        )
    elif label == "AVERAGE":
        summary_en = (
            f"Tamil 10-Porutham: {total_str}/10 — Moderate compatibility. "
            "Some poruthams need attention; consultation with a jyotishi is advised."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total_str}/10 — நடுத்தர இணக்கம். "
            "சில பொருத்தங்களில் கவனம் தேவை; ஜோதிடர் ஆலோசனை உதவும்."
        )
    else:
        label = "CAUTION"
        summary_en = (
            f"Tamil 10-Porutham: {total_str}/10 — Significant incompatibilities found. "
            "Traditional guidance recommends careful consultation before proceeding."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total_str}/10 — குறிப்பிடத்தக்க பொருத்தமின்மை கண்டறியப்பட்டுள்ளது. "
            "தொடரும் முன் ஜோதிட ஆலோசனை அவசியம்."
        )

    if rajju_dosha:
        # EC-RULING-06 (2026-08-17), P0. This string used to name a spouse-loss
        # outcome outright, in both languages, and shipped to anonymous visitors
        # through the public porutham calculator. That is an EC-A11-class event
        # assertion, and the ruling is *excise, don't reword*: no
        # conversion-operator form, no softened phrasing, no hedge. The finding
        # itself is unchanged — Rajju still fails, still forces CAUTION, still
        # reads as one of the strongest objections in Tamil matching. Only the
        # claim about an outcome is gone.
        #
        # The banned wording is deliberately not quoted here either: a comment
        # reproducing it verbatim would keep the phrase in the shipped tree and
        # trip the very sweep that now guards this
        # (`tests/test_tone_compliance.py`). See `RAJJU_SOURCE_TEXT_CATEGORY`
        # for the sanctioned internal carrier.
        suffix_en = (
            " ⚠ Rajju Porutham not met: both partners fall in the same Rajju group — "
            "one of the strongest objections in Tamil matching, and one that remedial "
            "guidance addresses directly."
        )
        suffix_ta = (
            " ⚠ ராஜ்ஜு பொருத்தம் இல்லை: இருவரும் ஒரே ராஜ்ஜு வகுப்பைச் சேர்ந்தவர்கள் — "
            "தமிழ்ப் பொருத்தத்தில் வலிமையான ஆட்சேபனைகளுள் ஒன்று; பரிகாரத்தால் "
            "நேரடியாகக் கவனிக்கப்படுவது."
        )
        summary_en += suffix_en
        summary_ta += suffix_ta

    if vedha_dosha:
        suffix_en = " ⚠ Vedha Dosha: these nakshatras form a vedha pair — traditionally considered inauspicious."
        suffix_ta = " ⚠ வேத தோஷம்: இந்த நட்சத்திரங்கள் வேத ஜோடி — பாரம்பரியமாக சாதகமற்றதாக கருதப்படுகிறது."
        summary_en += suffix_en
        summary_ta += suffix_ta

    # A Rajju/Vedha veto is inauspicious regardless of the numeric score — the
    # label must reflect that at the source, not rely on every consumer to
    # re-derive it from rajju_dosha/vedha_dosha themselves (2026-07 audit A-4).
    if (rajju_dosha or vedha_dosha) and label != "CAUTION":
        label = "CAUTION"

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
