"""Is today good for beginning ordinary new work? One answer for every surface.

AAU-07 / AAU-20, ruled 2026-10-29 (docs/ASTROLOGER_RULING_AAU-07_AAU-20_2026-10-29.md).

The calendar's நல்ல நாள் badge, the PDF day block and the push fallback asked
this one question and answered it from three hand-typed star lists, read on two
different stars (sunrise vs the 24-hour dominant). On 14 days of 2026 the badge
said good while the PDF and push said caution. This module is the only place the
answer is made.

Two layers, kept apart:

* **Doctrine (பலன்).** Muhurta Chintamani sorts the 27 stars into seven classes
  by the work each suits. The four gentle classes (Dhruva, Chara, Kshipra,
  Mridu) are fit for ordinary new work; Mishra is mixed; Ugra and Tikshna are
  unfit. Magam (Ugra) and Moolam (Tikshna) are therefore unfit for ordinary
  work — they remain marriage stars, which is a different list
  (`app/data/muhurtham_naals.py`, the marriage engine's Kalaprakasika set).
  A work is judged on the star in force when it begins.
* **Grading (Vinaadi policy).** A whole-day verdict has no clock time, so it
  reads the *daytime*, sunrise to sunset: the star holding most of it names the
  verdict, ties to the earlier star. If the star changes in daytime into a
  different column (fit / neutral / unfit), the day is split and the change
  time is part of the answer. Scores: good 72, neutral 50, caution 32. A
  weekday or tithi block lowers good to neutral, never to caution.

Chandrashtama keeps its own D11 sunrise-star rule; nothing here touches it.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Protocol

StarClass = Literal["DHRUVA", "CHARA", "KSHIPRA", "MRIDU", "MISHRA", "UGRA", "TIKSHNA"]
Fitness = Literal["FIT", "NEUTRAL", "UNFIT"]
Verdict = Literal["GOOD", "NEUTRAL", "CAUTION"]

#: Muhurta Chintamani, nakshatra prakarana. Keyed by canonical number 1..27.
STAR_CLASS: dict[int, StarClass] = {
    4: "DHRUVA", 12: "DHRUVA", 21: "DHRUVA", 26: "DHRUVA",          # Rohini, Uthiram, Uthiradam, Uthirattathi
    7: "CHARA", 15: "CHARA", 22: "CHARA", 23: "CHARA", 24: "CHARA",  # Punarpoosam, Swathi, Thiruvonam, Avittam, Sadhayam
    1: "KSHIPRA", 8: "KSHIPRA", 13: "KSHIPRA",                      # Aswini, Poosam, Hastham
    5: "MRIDU", 14: "MRIDU", 17: "MRIDU", 27: "MRIDU",              # Mirugaseeridam, Chithirai, Anusham, Revathi
    3: "MISHRA", 16: "MISHRA",                                      # Karthigai, Visakam
    2: "UGRA", 10: "UGRA", 11: "UGRA", 20: "UGRA", 25: "UGRA",      # Bharani, Magam, Pooram, Pooradam, Poorattathi
    6: "TIKSHNA", 9: "TIKSHNA", 18: "TIKSHNA", 19: "TIKSHNA",       # Thiruvathirai, Ayilyam, Kettai, Moolam
}

CLASS_FITNESS: dict[StarClass, Fitness] = {
    "DHRUVA": "FIT", "CHARA": "FIT", "KSHIPRA": "FIT", "MRIDU": "FIT",
    "MISHRA": "NEUTRAL",
    "UGRA": "UNFIT", "TIKSHNA": "UNFIT",
}

FIT_STARS: frozenset[int] = frozenset(n for n, c in STAR_CLASS.items() if CLASS_FITNESS[c] == "FIT")
NEUTRAL_STARS: frozenset[int] = frozenset(n for n, c in STAR_CLASS.items() if CLASS_FITNESS[c] == "NEUTRAL")
UNFIT_STARS: frozenset[int] = frozenset(n for n, c in STAR_CLASS.items() if CLASS_FITNESS[c] == "UNFIT")

DAY_SCORE: dict[Verdict, int] = {"GOOD": 72, "NEUTRAL": 50, "CAUTION": 32}


def star_fitness(star_number: int) -> Fitness:
    return CLASS_FITNESS[STAR_CLASS[star_number]]


def _verdict(star_number: int, blocked: bool) -> Verdict:
    fitness = star_fitness(star_number)
    if fitness == "UNFIT":
        return "CAUTION"
    if fitness == "FIT" and not blocked:
        return "GOOD"
    return "NEUTRAL"


class _Span(Protocol):
    @property
    def number(self) -> int: ...
    @property
    def start(self) -> datetime: ...
    @property
    def end(self) -> datetime: ...


@dataclass(frozen=True, slots=True)
class DaySplit:
    """The daytime star change that moves the verdict, and both sides of it."""

    change_at: datetime
    before_star: int
    after_star: int
    before: Verdict
    after: Verdict


@dataclass(frozen=True, slots=True)
class DayQuality:
    verdict_star: int
    star_class: StarClass
    verdict: Verdict
    split: DaySplit | None
    block_reason: str | None

    @property
    def score(self) -> int:
        return DAY_SCORE[self.verdict]

    @property
    def is_good(self) -> bool:
        return self.verdict == "GOOD"


def day_quality(
    spans: Sequence[_Span],
    sunrise: datetime,
    sunset: datetime,
    *,
    fallback_star: int,
    block_reason: str | None = None,
) -> DayQuality:
    """The day's verdict for beginning ordinary new work.

    `spans` are the day's nakshatra spans (sunrise to next sunrise); only their
    daytime part counts. `fallback_star` is used when no span reaches daytime
    (no spans, or a polar day). `block_reason` is the caller's weekday/tithi
    block, if any: it lowers good to neutral.
    """
    blocked = block_reason is not None
    daytime: list[tuple[int, datetime, datetime]] = []
    for span in spans:
        start, end = max(span.start, sunrise), min(span.end, sunset)
        if end > start:
            daytime.append((span.number, start, end))

    if not daytime:
        star = fallback_star
        return DayQuality(star, STAR_CLASS[star], _verdict(star, blocked), None, block_reason)

    held: dict[int, float] = {}
    for star, start, end in daytime:
        held[star] = held.get(star, 0.0) + (end - start).total_seconds()
    order = [star for star, _, _ in daytime]
    verdict_star = max(held, key=lambda s: (held[s], -order.index(s)))

    split: DaySplit | None = None
    for (before, _, _), (after, change_at, _) in zip(daytime, daytime[1:], strict=False):
        if star_fitness(before) != star_fitness(after):
            split = DaySplit(change_at, before, after, _verdict(before, blocked), _verdict(after, blocked))
            break

    return DayQuality(
        verdict_star, STAR_CLASS[verdict_star], _verdict(verdict_star, blocked), split, block_reason,
    )
