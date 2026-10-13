"""Ezharai Sani (Sade Sati) — segmentation, mitigation, and the 5th-house insight.

EC-RULING-05 (2026-08-17), implemented in the order the ruling sets: A26, then
A25, then A27.

What this replaces: a flat `-4` applied to every native for all seven and a half
years, with no phase, no mitigation and nothing to say beyond "this is happening
to you". Three separately-sourced corrections turn that into a reading.

**A26 — the cycle is not uniform.** A model that penalises all ninety months
equally is wrong about the shape of the cycle. It is segmented by its three
named phases — விரய (12th), ஜென்ம (1st), பாத (2nd) — with **Janma Sani the
heaviest**, which is how every Tamil rasi-palan column reads it.

A26 originally used a month-by-month division cited as "(p.243)", under which
months 17-51 were *comparatively favourable* and therefore the lightest part of
the cycle. Those months cover most of Janma Sani, so the model said the exact
opposite of practice about its heaviest phase. See `_SEGMENTS` below for why
that division was reverted rather than re-tuned (F-SAT-01).

**A25 — it is gated.** Natal Saturn's own dignity and house placement, and the
Ashtakavarga bindus of the sign being transited, are stated mitigations (p.227).
They decide whether this cycle lands hard or barely registers.

**A27 — the 5th is never touched.** Verified by aspect arithmetic rather than
asserted: across all three positions Saturn occupies during the cycle, the 5th
from the natal Moon is neither occupied nor aspected. Purva punya, intelligence
and the merit carried from a previous birth are structurally out of reach for
the whole seven and a half years. See `FIFTH_HOUSE_IS_UNTOUCHED` and the proof
in `tests/test_sade_sati.py`.

**Standing rule (EC-RULING-05, engine constitution):** Sade Sati is a full-chart
transit judgement. It never becomes a porutham or marriage-compatibility veto,
at any severity tier. Nothing in this module is importable into `porutham.py`,
and `tests/test_sade_sati.py` asserts that separation directly.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

# ── A26: phase segmentation ─────────────────────────────────────────────────

#: Months per Saturn sign for the purposes of the traditional table. Saturn's
#: real dwell varies (~2.2-2.6 years); the ninety-month division is stated in
#: whole thirties and the segmentation below is indexed against that reckoning,
#: not against a re-derived ephemeris duration. Using the table's own arithmetic
#: is what keeps the boundaries where the source puts them.
MONTHS_PER_PHASE = 30
TOTAL_MONTHS = 90


class SadeSatiSeverity(str, Enum):  # noqa: UP042 — str-mixin enum, repo convention
    """Which third of the cycle this native is in — the three named phases.

    F-SAT-01 replaced a month-band enum (DIFFICULT / FAVOURABLE / ACUTE /
    MIXED) with the phases themselves. Internal to the scoring path: the
    severity is not on the wire and no client reads it.
    """

    #: Months 1-30, Saturn in the 12th from the natal Moon — விரய சனி.
    VIRAYA = "VIRAYA"
    #: Months 31-60, Saturn on the natal Moon — ஜென்ம சனி, the heaviest.
    JANMA = "JANMA"
    #: Months 61-90, Saturn in the 2nd — பாத சனி, the easing third.
    PADA = "PADA"


#: (start_month, end_month_inclusive, severity), 1-based over the ninety months.
#:
#: **F-SAT-01 — why this is the phase, not the month table.**
#:
#: It used to be the month division summarised in EC-A26: 16 difficult, then 35
#: *comparatively favourable* (months 17-51), 5 mixed, 4 acute at the close of
#: Janma Sani, 30 mixed. That made months 17-51 the lightest stretch of the
#: cycle at a penalty of 1 — and those months cover the back half of Viraya
#: Sani and **most of Janma Sani**, which mainstream Tamil practice holds to be
#: the *heaviest* phase. Every Tamil rasi-palan column reads it that way.
#:
#: Two reasons not to keep it until the source is in hand:
#:
#: 1. **The citation is a bare "p. 243" with no book named.** Kalaprakasika's
#:    Appendix also begins at printed p. 243, so two books are in play.
#:    `docs/SOURCE_PHOTOCOPY_REQUEST_2026-08-27.md` (PN-4) and
#:    `VINAADI_PAGE_NEEDED_REGISTER` both still carry it as unverified.
#: 2. **The 16/35/4 figures look like the Sani Nara-Chakra**, which segments by
#:    the **nakshatra Saturn is transiting counted from the janma star**, not
#:    by months elapsed since the 12th-house ingress. Mapping a nakshatra-based
#:    body chart onto a month clock moves every boundary, which would explain
#:    how the heaviest phase ended up labelled favourable.
#:
#: So this reverts to the structural reading — the three named phases, Janma
#: heaviest — which needs no unverified page. If PN-4 is produced and states
#: the Nara-Chakra, compute it from Saturn's transit nakshatra counted from the
#: janma nakshatra; do not re-introduce a month clock.
_SEGMENTS: tuple[tuple[int, int, SadeSatiSeverity], ...] = (
    (1, 30, SadeSatiSeverity.VIRAYA),
    (31, 60, SadeSatiSeverity.JANMA),
    (61, 90, SadeSatiSeverity.PADA),
)

#: Saturn's house from the natal Moon -> which 30-month third of the cycle.
#: 12th is the first (Viraya), 1st the second (Janma), 2nd the third (Pada).
_PHASE_INDEX_BY_HOUSE: dict[int, int] = {12: 0, 1: 1, 2: 2}


def is_sade_sati_house(house_from_moon: int) -> bool:
    """Whether Saturn in this house from the natal Moon is inside the cycle."""
    return house_from_moon in _PHASE_INDEX_BY_HOUSE


def elapsed_month(house_from_moon: int, months_into_current_sign: float) -> int:
    """1-based month index within the ninety, or 0 when outside the cycle.

    `months_into_current_sign` is how long Saturn has been in its present sign,
    which the caller derives from the real ingress instant — the phase offset is
    table arithmetic but the position within the phase is not.
    """
    phase = _PHASE_INDEX_BY_HOUSE.get(house_from_moon)
    if phase is None:
        return 0
    raw = phase * MONTHS_PER_PHASE + months_into_current_sign
    return max(1, min(TOTAL_MONTHS, int(raw) + 1))


def severity_for_month(month: int) -> SadeSatiSeverity:
    """The traditional grade for one month of the cycle."""
    for start, end, severity in _SEGMENTS:
        if start <= month <= end:
            return severity
    return SadeSatiSeverity.MIXED


# ── A25: mitigation gates ───────────────────────────────────────────────────

_SATURN_OWN_SIGNS = frozenset({10, 11})   # Makara, Kumbha
_SATURN_EXALTATION = 7                    # Thula
_SATURN_STRONG_HOUSES = frozenset({3, 6, 10, 11})

#: Bindus in the transited sign above which the source calls that stretch of the
#: transit more peaceful.
SAV_PEACEFUL_THRESHOLD = 30


@dataclass(frozen=True, slots=True)
class SadeSatiMitigation:
    """Which stated mitigations apply, and what they add up to."""

    natal_saturn_dignified: bool
    natal_saturn_well_placed: bool
    transited_sign_well_supported: bool | None
    reasons: tuple[str, ...]

    @property
    def count(self) -> int:
        """Mitigations actually established. `None` (not evaluated) never counts."""
        return sum(
            bool(x) for x in (
                self.natal_saturn_dignified,
                self.natal_saturn_well_placed,
                self.transited_sign_well_supported,
            )
        )


def assess_mitigation(
    *,
    natal_saturn_rasi: int,
    natal_saturn_house_from_lagna: int,
    transited_sign_sav_bindus: int | None = None,
) -> SadeSatiMitigation:
    """The p.227 mitigations.

    `transited_sign_sav_bindus` is optional and `None` means *not evaluated* —
    never "no support". EC-RULING-05 allows the bindu gate only because
    Sarvashtakavarga is already computed elsewhere in this engine; a caller that
    does not have it must not have a mitigation silently counted against them.
    """
    reasons: list[str] = []

    dignified = (
        natal_saturn_rasi == _SATURN_EXALTATION
        or natal_saturn_rasi in _SATURN_OWN_SIGNS
    )
    if dignified:
        reasons.append(
            "natal Saturn is exalted or in its own sign"
            if natal_saturn_rasi == _SATURN_EXALTATION
            else "natal Saturn is in its own sign"
        )

    well_placed = natal_saturn_house_from_lagna in _SATURN_STRONG_HOUSES
    if well_placed:
        reasons.append(
            f"natal Saturn stands in the {natal_saturn_house_from_lagna}th from Lagna, "
            "one of the placements the tradition names as easing this cycle"
        )

    supported: bool | None = None
    if transited_sign_sav_bindus is not None:
        supported = transited_sign_sav_bindus > SAV_PEACEFUL_THRESHOLD
        if supported:
            reasons.append(
                f"the sign Saturn is crossing carries {transited_sign_sav_bindus} "
                "Ashtakavarga bindus, above the threshold the source calls more peaceful"
            )

    return SadeSatiMitigation(
        natal_saturn_dignified=dignified,
        natal_saturn_well_placed=well_placed,
        transited_sign_well_supported=supported,
        reasons=tuple(reasons),
    )


# ── A27: the 5th house is structurally untouched ────────────────────────────

#: Saturn's aspects, counted from wherever it stands.
_SATURN_ASPECTS = (3, 7, 10)


def houses_touched_during_cycle() -> frozenset[int]:
    """Every house from the natal Moon that Saturn occupies or aspects across the
    whole cycle. Computed, not tabulated — the claim in `FIFTH_HOUSE_IS_UNTOUCHED`
    is only worth making if it is derived."""
    touched: set[int] = set()
    for position in _PHASE_INDEX_BY_HOUSE:
        touched.add(position)
        for aspect in _SATURN_ASPECTS:
            touched.add((position + aspect - 2) % 12 + 1)
    return frozenset(touched)


#: The house Saturn can never reach during Ezharai Sani. Derived at import so it
#: cannot drift away from the aspect table above.
FIFTH_HOUSE_IS_UNTOUCHED: bool = 5 not in houses_touched_during_cycle()

INSIGHT_5TH_EN = (
    "Across all seven and a half years Saturn occupies the 12th, the 1st and the "
    "2nd from your Moon, and from those three positions it aspects the 2nd, 3rd, "
    "4th, 6th, 7th, 8th, 9th, 10th and 11th. The 5th is the one house it never "
    "reaches — neither occupied nor aspected at any point in the cycle. Whatever "
    "this period unsettles in money, work or household, the merit you carry, your "
    "intelligence and your capacity for good judgement are not in its path."
)

INSIGHT_5TH_TA = (
    "ஏழரை சனி முழுவதும் சனி உங்கள் சந்திரனிலிருந்து 12, 1, 2 ஆகிய இடங்களில் மட்டுமே "
    "இருக்கிறார்; அவற்றிலிருந்து 2, 3, 4, 6, 7, 8, 9, 10, 11 ஆகிய இடங்களைப் "
    "பார்க்கிறார். 5ஆம் இடம் மட்டும் அவர் ஒருபோதும் அடையாதது — இக்காலம் முழுவதும் "
    "அது சேர்க்கையாலும் பார்வையாலும் தீண்டப்படுவதில்லை. இக்காலம் பணம், வேலை, "
    "குடும்பத்தில் எதைக் கலைத்தாலும், உங்கள் பூர்வ புண்ணியம், அறிவு, தெளிவான "
    "சிந்தனை ஆகியவை அதன் பாதையில் இல்லை."
)
