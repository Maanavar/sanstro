"""Name correction — spelling variants scored against the chart (NUM-53, NUM-54).

Pure module: no DB, no ephemeris, no clock, no settings.

What name correction actually is
--------------------------------
A Tamil Nadu practitioner does not hand you a new name. They alter the
*spelling* of the one you have — "Rajesh" becomes "Raajesh", "Kumar" becomes
"Kumaar" — so the Chaldean total lands on a different number while the name
stays the name your family uses. Every operation below is one of those
orthographic moves, and nothing here invents a name.

Why the operations are data, not a generator
--------------------------------------------
The most dangerous version of this feature is one that emits forty plausible
strings and lets a user pick. So variants are produced by a **named, finite set
of operations** (``SpellingOperation``), each variant records exactly which
operations produced it (``NameVariant.operations``), and the reviewable artefact
is the operation set — nine rules an astrologer can accept or reject — rather
than an unbounded list of outputs. A variant that cannot name its own derivation
is not returned.

Edits are capped at ``MAX_EDITS`` (two). Past that a "correction" is a different
name, and the entire premise of correction is that the name survives it.

The four guards this module carries
-----------------------------------
1. **A well-aligned name yields no alternatives at all.** Not "alternatives,
   plus a note saying you're fine" — ``correct_name`` returns an empty tuple.
   An engine that always has something to sell is a slot machine (plan §9.2),
   and the cheapest way to be honest is to have nothing to offer.
2. **A variant is only ever offered against the chart.** ``rank_variants``
   requires the chart's lagna; there is no chartless ranking path to call by
   mistake. Doctrine §9.1 — a number never overrides a graha.
3. **Only the called name is ever re-spelled** (see ``split_called_name``).
   The family name is counted in the total and returned untouched.
4. **The legal consequence is inseparable from the recommendation** (plan §9.4).
   This module returns ``CorrectionResult.requires_legal_warning = True`` on
   every result that carries variants; the API layer cannot serialise the
   variants without it.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from enum import StrEnum

from app.calculations.numerology import NumberReading, ScriptMismatchError, score_text
from app.calculations.numerology_alignment import (
    BENEFIC_NATURES,
    AlignmentVerdict,
    NumberAlignment,
    align_number,
)

#: Most spelling operations applied to one name. Two is already generous: TN
#: practice is typically a single doubled vowel or one added aspirate.
MAX_EDITS = 2

#: Hard ceiling on returned alternatives. A shortlist is a recommendation; a
#: catalogue is a slot machine.
MAX_ALTERNATIVES = 6


class SpellingOperation(StrEnum):
    """The orthographic moves TN name correction actually uses.

    This enum *is* the reviewable surface of this feature. Adding a member is a
    doctrine change and needs the astrologer, not a refactor.
    """

    #: Rajesh -> Raajesh, Vinod -> Vinood. The commonest correction by far.
    LENGTHEN_VOWEL = "lengthen_vowel"
    #: Raajesh -> Rajesh. The reverse move, for a name already lengthened.
    SHORTEN_VOWEL = "shorten_vowel"
    #: Kumar -> Kummar, Anil -> Annil.
    DOUBLE_CONSONANT = "double_consonant"
    #: Kumar -> Khumar, Tamil -> Thamil. Aspiration is orthographic in Latin
    #: transliteration and carries a Chaldean cost (H = 5).
    ADD_ASPIRATE = "add_aspirate"
    #: Thamil -> Tamil. The reverse.
    DROP_ASPIRATE = "drop_aspirate"
    #: Vijay -> Vijaya. A trailing vowel, common on South Indian given names.
    APPEND_VOWEL = "append_vowel"
    #: Vijay -> Vijai, Ravi -> Ravy. Final glide, attested both directions.
    SWAP_FINAL_GLIDE = "swap_final_glide"


#: Long forms per short vowel. Ordered — the first is the conventional one.
_VOWEL_LENGTHENINGS: dict[str, tuple[str, ...]] = {
    "a": ("aa",),
    "i": ("ee", "ii"),
    "u": ("oo",),
    "e": ("ee",),
    "o": ("oo",),
}

_VOWEL_SHORTENINGS: dict[str, str] = {"aa": "a", "ee": "i", "ii": "i", "oo": "u"}

#: Consonants that double in real Tamil romanisation. Deliberately excludes
#: letters that never double in practice (h, j, q, w, x, y, z).
_DOUBLEABLE = "bcdgklmnprstv"

#: Consonants that take an aspirate 'h' in Tamil romanisation.
_ASPIRABLE = "bcdgjkpt"

_VOWELS = "aeiou"


#: A token that is an initial rather than a name: "S", "S.", "K.M.". Never the
#: thing anyone is called, so never the thing a correction re-spells.
_INITIALS = re.compile(r"^(?:[A-Za-z]\.?)$|^(?:[A-Za-z]\.)+$")

_TOKEN = re.compile(r"\S+")


def split_called_name(text: str) -> tuple[str, str, str]:
    """Split a written name into (fixed prefix, the called name, fixed suffix).

    **Only the middle part may be re-spelled. The family name is never
    touched.** Nobody re-spells a surname: it is shared with parents and
    siblings, it is on their documents as well as yours, and a "correction"
    that lands on it is advice no family will act on. A baby's given name is
    the opposite case — it is not registered anywhere yet — which is exactly
    why the baby-name finder may offer spellings and this rule still holds
    there: it offers them for the given name only.

    Measured on the live engine before this existed: of the eleven one-edit
    spellings of "Rajesh Kumar", seven changed *Kumar* ("Kumaar", "Kummar",
    "Khumar"...), and because ranking is by score alone one of those could
    perfectly well come back as the top recommendation.

    A **leading initial is skipped rather than treated as the name**, because
    "S. Rajesh" is written that way on half the documents in Tamil Nadu and
    taking the first token would freeze "Rajesh" and re-spell "S." — the exact
    inversion of the rule. This is the one piece of parsing here, and it is a
    definite test ("is this token a name at all?"), not a guess about which of
    two names is the surname.

    Whitespace and punctuation are preserved verbatim, so
    ``prefix + called + suffix`` reconstructs the input exactly.
    """
    tokens = list(_TOKEN.finditer(text))
    if not tokens:
        return ("", text, "")
    index = 0
    # Stop at the last token even if it too looks like an initial: something
    # has to be the name, and "S. K." has no better candidate than "K.".
    while index < len(tokens) - 1 and _INITIALS.match(tokens[index].group()):
        index += 1
    called = tokens[index]
    return (text[: called.start()], called.group(), text[called.end() :])


@dataclass(frozen=True, slots=True)
class NameVariant:
    """One candidate spelling, with the derivation that produced it.

    ``operations`` is not decoration. A user is being asked to change a legal
    name; "we doubled the 'a' in position 3" is a reason, and "the algorithm
    suggested it" is not.
    """

    spelling: str
    reading: NumberReading
    operations: tuple[SpellingOperation, ...]
    #: Signed change in Chaldean total against the original spelling.
    delta: int

    @property
    def root(self) -> int:
        return self.reading.root


def _apply_at(text: str, index: int, old_len: int, new: str) -> str:
    return text[:index] + new + text[index + old_len:]


def _single_edits(name: str) -> list[tuple[str, SpellingOperation]]:
    """Every one-operation spelling of ``name``, with the operation that made it.

    Case is preserved at the edit site by lowercasing only for matching — a
    corrected name that arrives back as "rAAjesh" is not usable on a document.
    """
    lowered = name.lower()
    out: list[tuple[str, SpellingOperation]] = []

    for i, char in enumerate(lowered):
        # Lengthen a short vowel that is not already part of a long one.
        if char in _VOWEL_LENGTHENINGS:
            already_long = (i + 1 < len(lowered) and lowered[i + 1] == char) or (
                i > 0 and lowered[i - 1] == char
            )
            if not already_long:
                for long_form in _VOWEL_LENGTHENINGS[char]:
                    replacement = long_form.upper() if name[i].isupper() else long_form
                    out.append((_apply_at(name, i, 1, replacement), SpellingOperation.LENGTHEN_VOWEL))

        # Double a consonant, but never the first letter or an existing pair.
        # `i > 0` is a word-initial guard only because this runs on a single
        # token — `split_called_name` is what makes that true.
        if char in _DOUBLEABLE:
            doubled_already = (i + 1 < len(lowered) and lowered[i + 1] == char) or (
                i > 0 and lowered[i - 1] == char
            )
            if not doubled_already and i > 0:
                out.append((_apply_at(name, i, 1, name[i] * 2), SpellingOperation.DOUBLE_CONSONANT))

        # Add an aspirate, unless one is already there.
        if char in _ASPIRABLE and not (i + 1 < len(lowered) and lowered[i + 1] == "h"):
            aspirate = "H" if name[i].isupper() and (i + 1 >= len(name) or not name[i + 1].islower()) else "h"
            out.append((_apply_at(name, i, 1, name[i] + aspirate), SpellingOperation.ADD_ASPIRATE))

    for short, long_form in ((v, k) for k, v in _VOWEL_SHORTENINGS.items()):
        idx = lowered.find(long_form)
        while idx != -1:
            replacement = short.upper() if name[idx].isupper() else short
            out.append((_apply_at(name, idx, len(long_form), replacement), SpellingOperation.SHORTEN_VOWEL))
            idx = lowered.find(long_form, idx + 1)

    for i in range(len(lowered) - 1):
        if lowered[i] in _ASPIRABLE and lowered[i + 1] == "h":
            out.append((_apply_at(name, i, 2, name[i]), SpellingOperation.DROP_ASPIRATE))

    # `isalpha` matters for the one input that reaches here without a real
    # name in it: "S. K." has no called name, and "K.a" is not a spelling.
    if lowered and lowered[-1].isalpha() and lowered[-1] not in _VOWELS:
        out.append((name + "a", SpellingOperation.APPEND_VOWEL))
    if lowered.endswith("y"):
        out.append((name[:-1] + "i", SpellingOperation.SWAP_FINAL_GLIDE))
    elif lowered.endswith("i"):
        out.append((name[:-1] + "y", SpellingOperation.SWAP_FINAL_GLIDE))

    return out


def generate_variants(name: str, *, max_edits: int = MAX_EDITS) -> tuple[NameVariant, ...]:
    """Every spelling of ``name`` reachable in ``max_edits`` named operations.

    **Edits land on the called name only** — ``split_called_name`` holds any
    initials and the family name fixed, and every returned ``spelling`` is the
    whole written name with the corrected called name substituted in. So the
    reading, the total and the delta are all still the full name's (the number
    a person actually carries), while the part being *changed* is the only part
    anyone would change.

    Deterministic and de-duplicated: two different operation paths can land on
    the same string, and the first (fewer edits, then alphabetical) wins so the
    derivation shown is always the simplest one that explains the spelling.

    Raises ``ScriptMismatchError`` via ``score_text`` on non-Latin input — the
    same doctrine D3 refusal the rest of the engine makes.
    """
    if not 1 <= max_edits <= MAX_EDITS:
        raise ValueError(f"max_edits must be 1..{MAX_EDITS}, got {max_edits}")

    base_reading = score_text(name)
    prefix, called, suffix = split_called_name(name)
    seen: dict[str, NameVariant] = {}

    # The frontier carries the called name alone (what gets edited); `seen` is
    # keyed by the full spelling (what gets returned, and what dedupes).
    frontier: list[tuple[str, tuple[SpellingOperation, ...]]] = [(called, ())]
    for _ in range(max_edits):
        next_frontier: list[tuple[str, tuple[SpellingOperation, ...]]] = []
        for spelling, ops in frontier:
            for edited, operation in _single_edits(spelling):
                if edited.lower() == called.lower():
                    continue
                full = f"{prefix}{edited}{suffix}"
                if full in seen:
                    continue
                try:
                    reading = score_text(full)
                except (ValueError, ScriptMismatchError):  # pragma: no cover - defensive
                    continue
                trail = (*ops, operation)
                seen[full] = NameVariant(
                    spelling=full,
                    reading=reading,
                    operations=trail,
                    delta=reading.total - base_reading.total,
                )
                next_frontier.append((edited, trail))
        frontier = next_frontier

    return tuple(sorted(seen.values(), key=lambda v: (len(v.operations), v.spelling)))


# ---------------------------------------------------------------------------
# Ranking against the chart (NUM-54)
# ---------------------------------------------------------------------------
@dataclass(frozen=True, slots=True)
class RankedVariant:
    variant: NameVariant
    alignment: NumberAlignment
    #: Points of alignment gained over the current spelling. Only positive
    #: values are ever offered — a "correction" that scores worse is not one.
    improvement: int


@dataclass(frozen=True, slots=True)
class CorrectionResult:
    """The analysis of a name, and the alternatives (if any) worth discussing."""

    original: str
    original_reading: NumberReading
    original_alignment: NumberAlignment
    #: Best-first, capped at ``MAX_ALTERNATIVES``. **Empty when the current name
    #: is already well-aligned** — that is the honest answer, not a fallback.
    alternatives: tuple[RankedVariant, ...]
    change_advised: bool
    #: Why the alternatives list is empty, when it is. Populated for every empty
    #: result so "your name is fine" and "nothing scored better" stay distinct.
    no_change_reason: str | None
    #: Total spellings examined before ranking. Surfaced so a short list reads
    #: as selective rather than as a thin search.
    variants_considered: int

    @property
    def requires_legal_warning(self) -> bool:
        """Plan §9.4 — any result carrying alternatives must ship the warning."""
        return bool(self.alternatives)


def rank_variants(
    variants: tuple[NameVariant, ...],
    lagna_rasi: int,
    original_alignment: NumberAlignment,
    *,
    strengths: dict[str, float] | None = None,
    node_rasi_map: dict[str, int] | None = None,
    limit: int = MAX_ALTERNATIVES,
) -> tuple[RankedVariant, ...]:
    """Rank spellings by how they sit against *this* chart, best first.

    Chart-first by construction: a variant's score comes from
    ``align_number`` — the same Phase 3 path the Fortune Alignment uses — and
    never from a number's generic reputation. Variants that do not beat the
    current spelling are dropped rather than shown greyed out; offering a
    strictly worse spelling as an option is how a user talks themselves into
    one.

    Ties break toward the fewest edits, then the shortest spelling: given two
    equally aligned corrections, the one that changes the name least wins.
    """
    best_by_root: dict[int, RankedVariant] = {}
    for variant in variants:
        alignment = align_number(
            variant.root,
            lagna_rasi,
            natal_strength=(strengths or {}).get(variant.reading.graha),
            node_rasi_map=node_rasi_map,
        )
        improvement = alignment.score - original_alignment.score
        if improvement <= 0:
            continue
        row = RankedVariant(variant=variant, alignment=alignment, improvement=improvement)
        # All spellings sharing a root score identically — showing six ways to
        # reach the same number pads the list without adding a choice.
        incumbent = best_by_root.get(variant.root)
        if incumbent is None or _simpler(row, incumbent):
            best_by_root[variant.root] = row

    ranked = sorted(
        best_by_root.values(),
        key=lambda r: (-r.improvement, len(r.variant.operations), len(r.variant.spelling), r.variant.spelling),
    )
    return tuple(ranked[:limit])


def _simpler(candidate: RankedVariant, incumbent: RankedVariant) -> bool:
    return (
        len(candidate.variant.operations),
        len(candidate.variant.spelling),
        candidate.variant.spelling,
    ) < (
        len(incumbent.variant.operations),
        len(incumbent.variant.spelling),
        incumbent.variant.spelling,
    )


def correct_name(
    name: str,
    lagna_rasi: int,
    *,
    strengths: dict[str, float] | None = None,
    node_rasi_map: dict[str, int] | None = None,
    max_edits: int = MAX_EDITS,
    limit: int = MAX_ALTERNATIVES,
) -> CorrectionResult:
    """Analyse a name against a chart and offer corrections only if warranted.

    The "no change needed" path (plan §9.2) fires **before** any variant is
    generated: if the name's graha is functionally benefic for this native, the
    search does not run at all. Saturn as yogakaraka is the canonical case —
    "8 is unlucky" is the most sold and least defensible claim in this trade,
    and a chart-aware engine must refuse to act on it.

    ``name`` may be written in full. It is analysed in full — the total, the
    alignment and the verdict are the whole name's — but only its called name
    is re-spelled; see ``split_called_name``. A name whose called part cannot
    reach a better number therefore returns no alternatives, which is the
    honest answer rather than a surname edit nobody would make.
    """
    original_reading = score_text(name)
    original_alignment = align_number(
        original_reading.root,
        lagna_rasi,
        natal_strength=(strengths or {}).get(original_reading.graha),
        node_rasi_map=node_rasi_map,
    )

    if original_alignment.functional_nature in BENEFIC_NATURES:
        return CorrectionResult(
            original=name,
            original_reading=original_reading,
            original_alignment=original_alignment,
            alternatives=(),
            change_advised=False,
            no_change_reason="benefic_lordship",
            variants_considered=0,
        )

    if original_alignment.verdict not in {
        AlignmentVerdict.MISALIGNED,
        AlignmentVerdict.STRONGLY_MISALIGNED,
    }:
        return CorrectionResult(
            original=name,
            original_reading=original_reading,
            original_alignment=original_alignment,
            alternatives=(),
            change_advised=False,
            no_change_reason="not_misaligned",
            variants_considered=0,
        )

    variants = generate_variants(name, max_edits=max_edits)
    alternatives = rank_variants(
        variants,
        lagna_rasi,
        original_alignment,
        strengths=strengths,
        node_rasi_map=node_rasi_map,
        limit=limit,
    )
    return CorrectionResult(
        original=name,
        original_reading=original_reading,
        original_alignment=original_alignment,
        alternatives=alternatives,
        change_advised=bool(alternatives),
        no_change_reason=None if alternatives else "no_better_spelling",
        variants_considered=len(variants),
    )


# ---------------------------------------------------------------------------
# The legal-consequence warning (NUM-57, plan §9.4)
# ---------------------------------------------------------------------------
# "Name correction ships with the legal-consequence warning or does not ship."
# This is the one place in the numerology feature where the harm is not
# interpretive but administrative and real: users add a letter to a legal name,
# and then Aadhaar, PAN, bank KYC, passport, degree certificates and property
# records disagree with each other for years.
#
# Written in the same register as ``remedies.remedy_disclaimer`` — factual,
# no hedging, no "consult a professional" hand-wave that reads as boilerplate.
#
#
# This warning has its OWN review gate (below) rather than riding the corpus-wide
# ``numerology_content.CONTENT_REVIEWED``. See that constant for why.
LEGAL_WARNING_EN = (
    "Changing the spelling of a legal name is an administrative act, not only a "
    "numerological one. Aadhaar, PAN, bank KYC, passport, school and degree "
    "certificates, property records and employment history must all be updated "
    "to match, and any one of them left behind can block a loan, a visa or a "
    "property transfer years later. Many families use a corrected spelling "
    "socially and leave documents untouched — that is a legitimate choice and "
    "carries none of this risk."
)
LEGAL_WARNING_TA = (
    "சட்டப்பூர்வப் பெயரின் எழுத்தை மாற்றுவது எண் கணித விஷயம் மட்டுமல்ல — அது ஒரு "
    "நிர்வாக நடவடிக்கை. ஆதார், பான், வங்கி KYC, கடவுச்சீட்டு, பள்ளி மற்றும் பட்டச் "
    "சான்றிதழ்கள், சொத்து ஆவணங்கள், பணி விவரங்கள் அனைத்தையும் ஒரே மாதிரி மாற்ற "
    "வேண்டும். ஏதேனும் ஒன்று மாறாமல் விடப்பட்டால், பல ஆண்டுகள் கழித்து கடன், விசா "
    "அல்லது சொத்து பரிமாற்றம் தடைபடலாம். பல குடும்பங்கள் திருத்திய எழுத்தை "
    "சமூகரீதியாக மட்டும் பயன்படுத்தி, ஆவணங்களை மாற்றாமல் விடுகிறார்கள் — அதுவும் "
    "சரியான தேர்வே; அதில் இந்த ஆபத்து இல்லை."
)


#: Whether the two strings above may be rendered.
#:
#: A SEPARATE gate from ``numerology_content.CONTENT_REVIEWED``, on the same
#: reasoning that pulled Cheiro's compound titles out from under it (see that
#: module's docstring, "Two kinds of text, one gate"): one review flag was
#: covering two categories of text that need different evidence to clear.
#:
#: ``CONTENT_REVIEWED`` governs **our sentences about a person** — what a 7
#: means for the reader's life. Those are per-person interpretation and wait,
#: correctly, on a native Tamil pass plus astrologer sign-off on the framings.
#:
#: This warning is neither. It is a fixed statement about Indian administrative
#: process — Aadhaar, PAN, KYC, passport, certificates — identical for every
#: user, containing no reading of anyone. It passes the test the frontend's own
#: shared module states for this exact question: *would the sentence change if
#: the person changed?* It would not. What it needs is a Tamil reader confirming
#: the wording is sound, which is a smaller and separable act than reviewing a
#: 52-entry interpretive corpus.
#:
#: The cost of the conflation was that ``correct_name`` — a fully built, tested
#: engine — could never return a single alternative to anyone, because the one
#: sentence §9.4 requires alongside a recommendation was held by a flag waiting
#: on unrelated text. Everything else in a correction response is number-shaped
#: (spellings, Chaldean totals, alignment scores), which is precisely the
#: criterion Phase 7 used to decide what could ship without the corpus.
#:
#: Flipping this False re-arms §9.4 exactly as before: the service withholds the
#: alternatives wholesale rather than shipping a recommendation warning-less.
LEGAL_WARNING_REVIEWED: bool = True


def legal_warning_available() -> bool:
    """Whether a recommendation may be made at all (plan §9.4).

    A function rather than a bare constant read, so the one condition §9.4 turns
    on has a name at every call site.
    """
    return LEGAL_WARNING_REVIEWED


def legal_warning() -> dict[str, str]:
    """Bilingual legal-consequence note. Mandatory alongside any alternatives."""
    return {"legal_warning_en": LEGAL_WARNING_EN, "legal_warning_ta": LEGAL_WARNING_TA}


__all__ = [
    "LEGAL_WARNING_EN",
    "LEGAL_WARNING_REVIEWED",
    "LEGAL_WARNING_TA",
    "MAX_ALTERNATIVES",
    "MAX_EDITS",
    "CorrectionResult",
    "NameVariant",
    "RankedVariant",
    "SpellingOperation",
    "correct_name",
    "generate_variants",
    "legal_warning",
    "legal_warning_available",
    "rank_variants",
]
