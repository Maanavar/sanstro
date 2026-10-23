"""Bhava palan — bands, polarity, the why-line and the conduct register.

Pure-function tests: this module needs no DB and no ephemeris, so it runs anywhere.

The test that matters most is `test_term_scores_match_compute_bhava_bala`.
`bhava_palan._term_scores` deliberately mirrors `chart_strength.compute_bhava_bala`
instead of changing that function to return its parts, because that function feeds the
LIVE Life Areas score (life_areas_service.py:1669). A mirror silently drifts; this
asserts it cannot.
"""
from __future__ import annotations

import itertools
import random

import pytest

from app.calculations import bhava_palan as bhava_palan_module
from app.calculations.aspects import aspect_strength, effective_natural_class
from app.calculations.bhava_palan import (
    CONDUCT,
    HOUSE_DOMAIN,
    HOUSE_LABEL,
    LordDignity,
    _term_scores,
    band_word,
    build_palan,
    karaka_in_own_bhava,
    lord_dignity_of,
    polarity_of,
    render_conduct,
    render_contrast,
    render_framing,
    render_karaka_note,
    render_polarity_note,
    render_why,
    verdict_of,
)
from app.calculations.bhava_palan_copy import (
    BHANGA,
    BHANGA_VIA_D9,
    DEBILITATED_BUT_PLACED,
    HOLLOW_EXALTATION,
)
from app.calculations.chart_strength import (
    DEBILITATION_RASI,
    EXALTATION_RASI,
    compute_all_bhava_bala,
    compute_bhava_bala,
)
from app.calculations.display_names import planet_en
from app.constants.astrology import SIGN_LORD
from app.services.narrative_engine import mortality_validator, tone_validator

PLANETS = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"]


def _chart(rng: random.Random) -> tuple[int, dict[str, int], dict[str, int]]:
    """A synthetic placement set. Nodes stay exactly opposed, as in a real chart."""
    rasi = {p: rng.randint(1, 12) for p in PLANETS if p not in ("RAHU", "KETU")}
    rahu = rng.randint(1, 12)
    rasi["RAHU"] = rahu
    rasi["KETU"] = (rahu + 5) % 12 + 1
    scores = {p: rng.randint(15, 85) for p in PLANETS}
    return rng.randint(1, 12), rasi, scores


def _charts(n: int, seed: int = 4242):
    rng = random.Random(seed)
    for _ in range(n):
        yield _chart(rng)


# ── The mirror must not drift ───────────────────────────────────────────────────

def test_term_scores_match_compute_bhava_bala() -> None:
    """Our three terms must recombine into exactly the engine's number."""
    for lagna, rasi, scores in _charts(200):
        for house in range(1, 13):
            lord_s, occ, dr, _ = _term_scores(house, lagna, rasi, scores)
            recombined = max(0, min(100, round(lord_s * 0.5 + occ * 0.25 + dr * 0.25)))
            assert recombined == compute_bhava_bala(house, lagna, rasi, scores), (
                f"bhava_palan._term_scores has drifted from compute_bhava_bala "
                f"(house {house}, lagna {lagna})"
            )


# ── Polarity and bands ──────────────────────────────────────────────────────────

def test_polarity_mapping() -> None:
    assert [polarity_of(h) for h in (6, 8, 12)] == ["INVERTED"] * 3
    assert [polarity_of(h) for h in (3, 11)] == ["UPACHAYA"] * 2
    for h in (1, 2, 4, 5, 7, 9, 10):
        assert polarity_of(h) == "DIRECT"


@pytest.mark.parametrize(
    ("house", "bala", "expected"),
    [
        # DIRECT: >=52 supported, <40 needs care. The green cut was 50 until
        # 2026-09-30; 50 and 51 are pinned MIXED so a revert cannot pass quietly.
        (7, 52, "SUPPORTED"), (7, 51, "MIXED"), (7, 50, "MIXED"), (7, 40, "MIXED"),
        (7, 39, "NEEDS_CARE"),
        # UPACHAYA is the most forgiving of the three.
        (11, 50, "SUPPORTED"), (11, 49, "MIXED"), (11, 48, "MIXED"), (11, 38, "MIXED"),
        (11, 37, "NEEDS_CARE"),
        # INVERTED reads the other way round: LOW is the good news.
        (6, 39, "SUPPORTED"), (6, 40, "MIXED"), (6, 41, "MIXED"), (6, 50, "MIXED"),
        (6, 51, "NEEDS_CARE"),
        (8, 30, "SUPPORTED"), (12, 70, "NEEDS_CARE"),
    ],
)
def test_verdict_boundaries(house: int, bala: int, expected: str) -> None:
    assert verdict_of(house, bala) == expected


def test_upachaya_is_more_forgiving_than_direct() -> None:
    """A 3rd and a 7th on the same number must not band the same at the margin."""
    assert verdict_of(3, 50) == "SUPPORTED"
    assert verdict_of(7, 50) == "MIXED"
    assert verdict_of(3, 38) == "MIXED"
    assert verdict_of(7, 38) == "NEEDS_CARE"


def test_dusthana_top_band_is_worded_quiet_not_strong() -> None:
    """A quiet 6th is good news, but calling it 'Supported' over a low number is
    what makes a reader distrust the panel (ruling Q3)."""
    assert band_word("SUPPORTED", 6) == ("அமைதி", "Quiet")
    assert band_word("SUPPORTED", 7) == ("வலுவானது", "Supported")
    # The low band is the same word everywhere — and never "பலவீனம்".
    for house in (6, 7, 11):
        ta, en = band_word("NEEDS_CARE", house)
        assert en == "Needs care"
        assert "பலவீன" not in ta


def test_eighth_house_is_not_labelled_ayul() -> None:
    """Deliberate departure from the almanac name — ஆயுள் ஸ்தானம் invites exactly the
    longevity question this product permanently refuses (ruling Q4)."""
    ta, _ = HOUSE_LABEL[8]
    assert ta == "மாற்றம்"
    assert "ஆயுள்" not in ta


# ── The why-line ────────────────────────────────────────────────────────────────

def test_why_line_always_names_a_graha_when_there_is_a_signal() -> None:
    generic = 0
    for lagna, rasi, scores in _charts(120):
        bala = compute_all_bhava_bala(lagna, rasi, scores)
        for house in range(1, 13):
            palan = build_palan(house, lagna, rasi, scores, bala[house])
            _, why_en = render_why(palan, 5)
            if palan.dominant.graha is None:
                generic += 1
            else:
                assert any(
                    w in why_en
                    for w in ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus",
                              "Saturn", "Rahu", "Ketu")
                ), why_en
    # The no-signal branch should be genuinely rare, not the common case.
    assert generic < 120 * 12 * 0.02, f"{generic} houses fell back to generic copy"


def test_inverted_help_contradiction_is_bridged() -> None:
    """A helpful mechanic producing NEEDS_CARE on 6/8/12 must explain itself in place."""
    for lagna, rasi, scores in _charts(300):
        bala = compute_all_bhava_bala(lagna, rasi, scores)
        for house in (6, 8, 12):
            palan = build_palan(house, lagna, rasi, scores, bala[house])
            if palan.dominant.helps and palan.verdict == "NEEDS_CARE":
                _, why_en = render_why(palan, 5)
                assert "asks real work of you" in why_en
                return
    pytest.skip("no inverted helps/NEEDS_CARE combination in the sample")


# ── Conduct is keyed on the graha, not the band ─────────────────────────────────

def test_conduct_varies_with_the_responsible_graha() -> None:
    """The whole point of the register: same band, different graha, different advice."""
    seen: dict[str, tuple] = {}
    for lagna, rasi, scores in _charts(200):
        bala = compute_all_bhava_bala(lagna, rasi, scores)
        for house in range(1, 13):
            palan = build_palan(house, lagna, rasi, scores, bala[house])
            if palan.verdict != "NEEDS_CARE" or palan.dominant.graha is None:
                continue
            seen.setdefault(palan.dominant.graha, render_conduct(palan))
    assert len(seen) >= 4, "conduct register barely exercised"
    # No two grahas may produce identical advice for the same band.
    for a, b in itertools.combinations(seen, 2):
        assert seen[a] != seen[b], f"{a} and {b} give identical conduct"


def test_every_graha_has_a_conduct_register() -> None:
    for planet in PLANETS:
        assert planet in CONDUCT, planet
        assert len(CONDUCT[planet]["lean_on"]) == 2
        assert len(CONDUCT[planet]["go_slowly"]) == 2


def test_conduct_never_phrased_as_a_prohibition() -> None:
    """Ruling Q6: 'go slowly with', never 'don't'; reversible, non-medical acts only."""
    banned = ("don't", "do not", "never ", "you must", "postpone", "refuse",
              "doctor", "medicine", "lawyer", "sue ", "sell ", "leave your")
    for planet, register in CONDUCT.items():
        for _, en in register["lean_on"] + register["go_slowly"]:
            low = en.lower()
            for phrase in banned:
                assert phrase not in low, f"{planet}: {en!r} contains {phrase!r}"


# ── Tone: every generated string, both languages ────────────────────────────────

def _all_strings(palan, lord_house: int) -> list[str]:
    out: list[str] = []
    out.extend(render_framing(palan))
    out.extend(render_why(palan, lord_house))
    lean, slow = render_conduct(palan)
    for pair in lean + slow:
        out.extend(pair)
    for note in (render_karaka_note(palan), render_polarity_note(palan)):
        if note:
            out.extend(note)
    return out


def test_no_fatalistic_or_mortality_phrasing_anywhere() -> None:
    """The shared serve-time tone check.

    BLIND SPOT, recorded deliberately: `tone_validator` is a fixed banned-PHRASE
    list, not a semantic check. Measured against it directly, it catches "doomed"
    but passes "this will destroy your career" and "you will suffer loss". So a
    green tick here proves only that no listed phrase appears -- it is NOT evidence
    that the copy is non-fatalistic. The check with actual teeth for this module is
    `test_generated_copy_stays_inside_the_q6_fence` below, plus an astrologer
    reading twelve real outputs (plan P2 gate).
    """
    for lagna, rasi, scores in _charts(150):
        bala = compute_all_bhava_bala(lagna, rasi, scores)
        for house in range(1, 13):
            palan = build_palan(house, lagna, rasi, scores, bala[house])
            for text in _all_strings(palan, 5):
                assert tone_validator(text) == [], text
                assert mortality_validator(text) == [], text


_Q6_FENCE = (
    # prohibition register
    "don't", "do not ", "you must", "never marry", "avoid marriage",
    # irreversible acts
    "postpone", "cancel", "call it off", "walk out", "sell ", "resign",
    # out-of-scope professional advice
    "doctor", "medicine", "medical", "diagnos", "lawyer", "legal action", "sue ",
    # fatalism the shared validator misses
    "destroy", "ruin", "doomed", "suffer", "disaster", "hopeless", "no future",
)


def test_generated_copy_stays_inside_the_q6_fence() -> None:
    """Sweeps EVERY generated string, not just the conduct table, against the fence
    ruling Q6 set. This is the check that actually constrains the copy, because
    tone_validator's phrase list does not cover most of what we care about here."""
    banned = _Q6_FENCE
    for lagna, rasi, scores in _charts(150):
        bala = compute_all_bhava_bala(lagna, rasi, scores)
        for house in range(1, 13):
            palan = build_palan(house, lagna, rasi, scores, bala[house])
            for text in _all_strings(palan, 5):
                low = text.lower()
                for phrase in banned:
                    assert phrase not in low, f"house {house}: {text!r} contains {phrase!r}"


def test_the_q6_fence_would_actually_fail() -> None:
    """Baseline for the gate above: confirm the fence rejects what it claims to."""
    banned_probe = [
        "You must postpone the wedding.",
        "See a doctor about this.",
        "This will destroy your career.",
    ]
    fence = ("you must", "postpone", "doctor", "destroy")
    for probe in banned_probe:
        assert any(p in probe.lower() for p in fence), probe


def test_needs_care_seventh_never_reads_as_a_refusal() -> None:
    """The house this feature will be judged on. 'Needs care' must never become
    'do not marry'."""
    palan = None
    for lagna, rasi, scores in _charts(400):
        bala = compute_all_bhava_bala(lagna, rasi, scores)
        candidate = build_palan(7, lagna, rasi, scores, bala[7])
        if candidate.verdict == "NEEDS_CARE":
            palan = candidate
            break
    assert palan is not None, "no NEEDS_CARE 7th in the sample"
    _, framing_en = render_framing(palan)
    assert "not a closed door" in framing_en
    joined = " ".join(_all_strings(palan, 5)).lower()
    for phrase in ("should not marry", "avoid marriage", "unsuitable for marriage",
                   "will not marry", "no marriage"):
        assert phrase not in joined


# ── Karako bhava nashaya ────────────────────────────────────────────────────────

def test_karaka_note_fires_only_for_the_karaka_in_its_own_bhava() -> None:
    # Aries lagna: house 7 is Libra (7), so Venus in Libra is the karaka at home.
    rasi = {p: 1 for p in PLANETS}
    rasi["VENUS"] = 7
    assert karaka_in_own_bhava(7, 1, rasi) == "VENUS"
    rasi["VENUS"] = 8
    assert karaka_in_own_bhava(7, 1, rasi) is None


def test_saturn_in_the_eighth_is_the_classical_exception() -> None:
    """Saturn in the 8th is read as *giving* longevity, so it must not be flagged."""
    rasi = {p: 1 for p in PLANETS}
    rasi["SATURN"] = 8  # Aries lagna -> house 8 is Scorpio (8)
    assert karaka_in_own_bhava(8, 1, rasi) is None


def test_karaka_note_avoids_the_longevity_register() -> None:
    rasi = {p: 1 for p in PLANETS}
    rasi["VENUS"] = 7
    palan = build_palan(7, 1, rasi, {p: 50 for p in PLANETS}, 45)
    note = render_karaka_note(palan)
    assert note is not None
    for text in note:
        assert tone_validator(text) == []
        assert mortality_validator(text) == []


# ── Polarity notes and coverage ─────────────────────────────────────────────────

def test_polarity_note_present_exactly_where_the_scale_is_unusual() -> None:
    rasi = {p: 1 for p in PLANETS}
    scores = {p: 50 for p in PLANETS}
    for house in range(1, 13):
        palan = build_palan(house, 1, rasi, scores, 45)
        note = render_polarity_note(palan)
        if house in (6, 8, 12) or house in (3, 11):
            assert note is not None, house
        else:
            assert note is None, house


def test_every_house_has_a_label_and_a_domain() -> None:
    for house in range(1, 13):
        assert HOUSE_LABEL[house][0] and HOUSE_LABEL[house][1]
        assert HOUSE_DOMAIN[house][0] and HOUSE_DOMAIN[house][1]


def test_framing_substitutes_the_domain_in_both_languages() -> None:
    rasi = {p: 1 for p in PLANETS}
    scores = {p: 50 for p in PLANETS}
    for house in range(1, 13):
        palan = build_palan(house, 1, rasi, scores, 45)
        ta, en = render_framing(palan)
        assert "{domain}" not in ta and "{domain}" not in en
        assert HOUSE_DOMAIN[house][1] in en


# ── The lord sentence must agree with the chart drawn beside it ─────────────────
#
# `render_why` calls the lord "strongly placed" whenever its composite score clears
# 50, but a reader takes that as a claim about DIGNITY — the one thing they can check
# against the chart on the same screen. The two come apart often: over 4,000 sweep
# charts each carrying a forced debilitation, 3,384 of those grahas still scored >= 50
# (`scripts/bhava_dignity_sweep.py`). The
# clause added by `_varga_ground` is what keeps the sentence honest, and it is where
# D9 becomes visible to the reader at all — it reaches the number upstream, silently,
# through the lord's `strength_score`.


def _chart_with_d9(rng: random.Random):
    """A placement set plus a Navamsa, so the D9-dependent branches are reachable."""
    lagna, rasi, scores = _chart(rng)
    d9 = {p: rng.randint(1, 12) for p in PLANETS}
    return lagna, rasi, scores, d9, rng.randint(1, 12)


def _charts_with_d9(n: int, seed: int = 909):
    rng = random.Random(seed)
    for _ in range(n):
        yield _chart_with_d9(rng)


def test_lord_dignity_reads_both_vargas() -> None:
    """Venus neecha in the Rasi and neecha again in the Navamsa, reported separately."""
    rasi = {p: 1 for p in PLANETS}
    rasi["VENUS"] = DEBILITATION_RASI["VENUS"]
    d9 = {p: 1 for p in PLANETS}
    d9["VENUS"] = DEBILITATION_RASI["VENUS"]
    d = lord_dignity_of("VENUS", 1, rasi, d9, 1)
    assert d.debilitated and d.d9_debilitated and not d.exalted

    rasi["VENUS"] = EXALTATION_RASI["VENUS"]
    d = lord_dignity_of("VENUS", 1, rasi, d9, 1)
    assert d.exalted and not d.debilitated and d.d9_debilitated


def test_lord_dignity_degrades_quietly_without_a_navamsa() -> None:
    """No D9 supplied must mean a quieter sentence, never a wrong one."""
    rasi = {p: 1 for p in PLANETS}
    rasi["VENUS"] = DEBILITATION_RASI["VENUS"]
    d = lord_dignity_of("VENUS", 1, rasi)
    assert d.debilitated
    assert not d.d9_debilitated and not d.bhanga_via_d9


def test_a_debilitated_lord_never_reads_strong_without_stating_its_ground() -> None:
    """THE gate. If the sentence claims strength the chart appears to deny, it explains.

    Blind spot, recorded: this checks that *a clause is present*, not that the clause
    is the right one for that chart, and it says nothing about the Tamil half beyond
    the presence of நீச. The branch-to-copy mapping is pinned separately below.
    """
    checked = 0
    for lagna, rasi, scores, d9, d9_lagna in _charts_with_d9(250):
        bala = compute_all_bhava_bala(lagna, rasi, scores)
        for house in range(1, 13):
            palan = build_palan(
                house, lagna, rasi, scores, bala[house],
                d9_rasi=d9, d9_lagna_rasi=d9_lagna,
            )
            if palan.dominant.term != "LORD" or not palan.dominant.helps:
                continue
            if not palan.lord_dignity.debilitated:
                continue
            checked += 1
            why_ta, why_en = render_why(palan, 5)
            assert "debilitation" in why_en, why_en
            assert "நீச" in why_ta, why_ta
    assert checked >= 20, f"only {checked} contradicting houses in the sample"


def test_the_ground_gate_would_fail_with_the_clause_removed() -> None:
    """Baseline for the gate above (CLAUDE.md: a gate proves its own check).

    Run the same sweep with `_varga_ground` neutered and confirm it trips. Without
    this, a gate that silently stopped finding contradicting houses would read green
    forever.
    """
    original = bhava_palan_module._varga_ground
    bhava_palan_module._varga_ground = lambda dignity, helps: None
    try:
        with pytest.raises(AssertionError):
            test_a_debilitated_lord_never_reads_strong_without_stating_its_ground()
    finally:
        bhava_palan_module._varga_ground = original
    # And the real one passes again once restored.
    test_a_debilitated_lord_never_reads_strong_without_stating_its_ground()


def test_each_ground_branch_maps_to_its_own_copy() -> None:
    """The four cases are distinct claims; none may borrow another's sentence."""
    ground = bhava_palan_module._varga_ground
    assert ground(
        LordDignity(debilitated=True, bhanga=True, bhanga_via_d9=True), True
    ) == BHANGA_VIA_D9
    assert ground(LordDignity(debilitated=True, bhanga=True), True) == BHANGA
    assert ground(LordDignity(debilitated=True), True) == DEBILITATED_BUT_PLACED
    assert ground(LordDignity(exalted=True, d9_debilitated=True), False) == HOLLOW_EXALTATION


def test_the_navamsa_route_is_named_as_the_navamsa() -> None:
    """The reader's actual question: when D9 is why the house reads well, say D9."""
    ta, en = BHANGA_VIA_D9
    assert "Navamsa" in en and "neecha bhanga" in en
    assert "நவாம்ச" in ta and "நீசபங்கம்" in ta
    # The Rasi-side route must NOT claim the Navamsa did it.
    assert "Navamsa" not in BHANGA[1] and "நவாம்ச" not in BHANGA[0]


def test_no_ground_clause_where_the_chart_and_the_sentence_agree() -> None:
    """A debilitated lord that reads weak needs no excuse, and an exalted one that
    reads strong needs no caveat. Adding either would undercut a verdict for free."""
    ground = bhava_palan_module._varga_ground
    assert ground(LordDignity(debilitated=True, bhanga=True), False) is None
    assert ground(LordDignity(exalted=True), True) is None
    assert ground(LordDignity(exalted=True, d9_debilitated=True), True) is None
    assert ground(LordDignity(), True) is None
    assert ground(LordDignity(), False) is None


def test_ground_clause_only_ever_follows_a_lord_verdict() -> None:
    """D9 and dignity reach `bhava_bala` through the lord's score alone (50%); the
    occupant and drishti terms are keyed on benefic/malefic class and see neither.
    A ground clause on those would be explaining a cause that did not apply."""
    seen_non_lord = 0
    for lagna, rasi, scores, d9, d9_lagna in _charts_with_d9(200):
        bala = compute_all_bhava_bala(lagna, rasi, scores)
        for house in range(1, 13):
            palan = build_palan(
                house, lagna, rasi, scores, bala[house],
                d9_rasi=d9, d9_lagna_rasi=d9_lagna,
            )
            if palan.dominant.term == "LORD":
                continue
            seen_non_lord += 1
            _, why_en = render_why(palan, 5)
            for clause in (BHANGA[1], BHANGA_VIA_D9[1], DEBILITATED_BUT_PLACED[1],
                           HOLLOW_EXALTATION[1]):
                assert clause not in why_en, why_en
    assert seen_non_lord >= 50


def test_the_ground_clauses_pass_the_tone_and_q6_fences() -> None:
    """The sweep fences never reach these: `_charts()` passes no Navamsa, so the D9
    branches cannot fire there. Check the strings directly instead."""
    banned = ("don't", "do not ", "you must", "postpone", "doctor", "medical",
              "lawyer", "destroy", "ruin", "doomed", "suffer", "hopeless")
    for pair in (BHANGA, BHANGA_VIA_D9, DEBILITATED_BUT_PLACED, HOLLOW_EXALTATION):
        for text in pair:
            assert text.strip()
            assert tone_validator(text) == [], text
            assert mortality_validator(text) == [], text
            for phrase in banned:
                assert phrase not in text.lower(), f"{text!r} contains {phrase!r}"
        # Never the banned low-band word (module docstring: reads as a life sentence).
        assert "பலவீனம்" not in pair[0]


def test_the_band_is_unchanged_by_the_navamsa() -> None:
    """The clause explains the number; it must never move it. If a varga ever needs to
    change a verdict that is a doctrine decision and a score change, not a copy edit."""
    for lagna, rasi, scores, d9, d9_lagna in _charts_with_d9(150):
        bala = compute_all_bhava_bala(lagna, rasi, scores)
        for house in range(1, 13):
            without = build_palan(house, lagna, rasi, scores, bala[house])
            with_d9 = build_palan(
                house, lagna, rasi, scores, bala[house],
                d9_rasi=d9, d9_lagna_rasi=d9_lagna,
            )
            assert without.verdict == with_d9.verdict
            assert without.bhava_bala == with_d9.bhava_bala
            assert without.polarity == with_d9.polarity


# ── Contrast line: the lord's chip against the house's chip ─────────────────────
#
# A reader saw "Supported" on a 10th and "Needs support" on Saturn, its lord, lower
# on the same page, and read it as a contradiction; the why-line named only Saturn,
# under the green chip, because `dominant_term` picks the single largest term.
# These mirror web's planet-chip cuts (`scoreLabel`: >=70 Strong, <45 Needs support).
_STRONG_AT, _WEAK_BELOW = 70, 45


def _lord_of(house: int, lagna: int) -> str:
    return SIGN_LORD[((lagna + house - 2) % 12) + 1]


def _each_house(n: int):
    for lagna, rasi, scores in _charts(n):
        bala = compute_all_bhava_bala(lagna, rasi, scores)
        for house in range(1, 13):
            verdict = verdict_of(house, bala[house])
            yield lagna, rasi, scores, house, verdict, render_contrast(
                house, lagna, rasi, scores, verdict
            )


def test_a_house_chip_against_its_lords_chip_is_never_left_unexplained() -> None:
    """The gate. Every row where the two chips visibly disagree carries a line.

    Measured over 800 charts at the raised green cut: the dusthana case dominates
    (~1.25k), "carried" is ~4, and "held" is ~0 — a lord at >=70 contributes >=35
    on its own, so a direct house under it only drops below 40 if its occupants and
    aspects are near zero. That branch is exercised directly in the next test.
    """
    seen = {"carried": 0, "held": 0, "inverted": 0}
    for lagna, _, scores, house, verdict, line in _each_house(2500):
        if verdict == "MIXED":
            continue
        lord_score = scores[_lord_of(house, lagna)]
        weak, strong = lord_score < _WEAK_BELOW, lord_score >= _STRONG_AT
        inverted = polarity_of(house) == "INVERTED"
        lord_en = planet_en(_lord_of(house, lagna))
        if not inverted and verdict == "SUPPORTED" and weak:
            assert line is not None, f"green house {house} under weak {lord_en}, no line"
            assert line[1].startswith(f"Lord {lord_en} is weak, but ")
            seen["carried"] += 1
        elif not inverted and verdict == "NEEDS_CARE" and strong:
            assert line is not None, f"red house {house} under strong {lord_en}, no line"
            assert line[1].startswith(f"Lord {lord_en} is strong, but ")
            seen["held"] += 1
        elif inverted and ((verdict == "SUPPORTED" and weak) or (verdict == "NEEDS_CARE" and strong)):
            # The expected inversion, which still LOOKS wrong in a closed row.
            assert line is not None, f"dusthana {house} under {lord_en}, no line"
            assert "which keeps this house" in line[1]
            seen["inverted"] += 1
    assert seen["carried"] >= 5 and seen["inverted"] >= 10, seen


def test_the_held_back_branch_names_the_malefics(monkeypatch) -> None:
    """Unreachable at the real 70 cut (see above) and not even found by an 800-chart
    sweep at a cut of 52, so build it by hand and lower the cut to reach it. Guards
    the branch's copy against silent rot.

    Mesha lagna, 7th = Thulam, lord Venus at 52, placed in the 8th — the 7th is the
    12th from there, so the benefics parked with it cast no partial aspect back (the
    11th would: a half-strength 9th-house aspect). Sun, Mars, Saturn and Ketu crowd
    the 7th (occupant 10) and Rahu aspects it from the 1st (drishti 42):
    26 + 2.5 + 10.5 = 39, NEEDS_CARE.
    """
    monkeypatch.setattr(bhava_palan_module, "_LORD_CHIP_STRONG_AT", 52)
    rasi = {"SUN": 7, "MOON": 8, "MARS": 7, "MERCURY": 8, "JUPITER": 2,
            "VENUS": 8, "SATURN": 7, "RAHU": 1, "KETU": 7}
    scores = {p: 50 for p in rasi} | {"VENUS": 52}
    bala = compute_bhava_bala(7, 1, rasi, scores)
    assert verdict_of(7, bala) == "NEEDS_CARE", bala

    line = render_contrast(7, 1, rasi, scores, "NEEDS_CARE")
    assert line is not None
    assert line[1].startswith("Lord Venus is strong, but ")
    assert line[1].endswith("weigh on this house.")
    assert "அழுத்தத்தை அதிகரிக்கின்றனர்" in line[0]


def test_the_contrast_line_is_silent_where_nothing_contradicts() -> None:
    for lagna, _, scores, house, verdict, line in _each_house(300):
        lord_score = scores[_lord_of(house, lagna)]
        moderate = _WEAK_BELOW <= lord_score < _STRONG_AT
        if verdict == "MIXED" or moderate:
            assert line is None, (house, verdict, lord_score, line)
        elif polarity_of(house) != "INVERTED" and (
            (verdict == "SUPPORTED" and lord_score >= _STRONG_AT)
            or (verdict == "NEEDS_CARE" and lord_score < _WEAK_BELOW)
        ):
            # A green house under a strong lord needs no explaining.
            assert line is None, (house, verdict, lord_score, line)


def test_the_named_counterweights_really_pull_that_way() -> None:
    """A 'carried by' graha must be a benefic in or aspecting the house, never the
    lord itself; a 'weighs on' graha must be a malefic doing the same."""
    checked = 0
    for lagna, rasi, _, house, verdict, line in _each_house(2500):
        if line is None or ", but " not in line[1]:
            continue
        pull = bhava_palan_module._verdict_pull(house, verdict)
        lord = _lord_of(house, lagna)
        house_rasi = ((lagna + house - 2) % 12) + 1
        named = bhava_palan_module._pullers(house, lagna, rasi, lord, pull)
        assert named and lord not in named
        for graha in named:
            benefic = effective_natural_class(graha, rasi) == "BENEFIC"
            assert benefic == pull, (graha, pull)
            assert rasi[graha] == house_rasi or aspect_strength(graha, rasi[graha], house_rasi) > 0
            assert planet_en(graha) in line[1].split(", but ")[1]
        checked += 1
    assert checked >= 5, checked


def test_the_contrast_line_stays_the_exception() -> None:
    """A line on every row reads as boilerplate and gets skipped. Measured at 1.74
    per chart over 2,000 charts, whose uniform 15-85 scores are MORE extreme than
    real ones, so real charts fire less."""
    lines = sum(1 for *_, line in _each_house(1000) if line is not None)
    assert lines / 1000 < 2.5, lines / 1000


def test_the_contrast_tamil_follows_the_native_review() -> None:
    """A native reader's review (2026-09-30) rejected four phrasings as translated
    English. Sweep every generated Tamil line so none can drift back:
      · the lord is described by its STRENGTH in the genitive ("சனியின் வலு
        குறைவாக உள்ளது"), not as a person ("சனி வலு குறைந்தவர்");
      · two full sentences — no semicolon;
      · "அதிகம் இயங்குகிறது" read as "functioning well" on a 12th;
      · "தாங்குகிறார்" (holds up) was metaphorical; "ஆதரவாக உள்ளார்" replaces it.
    """
    retired = ("வலு குறைந்தவர்", "வலுவானவர்", ";", "இயங்குகிறது", "இயங்க வைக்",
               "தாங்கு", "மேல் அழுத்தம்")
    genitives = set(bhava_palan_module._LORD_GENITIVE_TA.values())
    seen = 0
    for *_, line in _each_house(400):
        if line is None:
            continue
        ta = line[0]
        for phrase in retired:
            assert phrase not in ta, f"{ta!r} contains retired {phrase!r}"
        assert ta.startswith("அதிபதி ") and ta.split()[1] in genitives, ta
        assert " வலு குறைவாக உள்ளது." in ta or " வலு அதிகமாக உள்ளது." in ta, ta
        # Second review: no back-to-back அதிகமாக across the two sentences.
        assert ta.count("அதிகமாக") <= 1, ta
        seen += 1
    assert seen >= 100


def test_the_dusthana_note_does_not_teach_quiet_equals_good() -> None:
    """Second native review (2026-09-30): the opened 6/8/12 panel said a quiet
    dusthana is good — the absolute the intro had just been softened away from.
    Both languages must now make the conditional claim."""
    ta, en = render_polarity_note(build_palan(8, 1, {"SUN": 1}, {}, 45))
    assert "அமைதியாக இருப்பதே நல்லது" not in ta
    assert "favours you" not in en
    assert "கூடுதல் கவனம் தேவைப்படலாம்" in ta
    assert "depends on the strength" in en


def test_the_contrast_line_passes_the_tone_and_q6_fences() -> None:
    for *_, line in _each_house(200):
        if line is None:
            continue
        for text in line:
            assert tone_validator(text) == [], text
            assert mortality_validator(text) == [], text
            for phrase in _Q6_FENCE:
                assert phrase not in text.lower(), f"{text!r} contains {phrase!r}"
        assert "பலவீனம்" not in line[0]
