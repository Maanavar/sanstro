"""Name correction orchestration (NUM-53, NUM-54, NUM-57, Phase 5).

Thin, like the alignment service: the doctrine lives in
``app.calculations.numerology_correction`` where it is testable without a
database. This module fetches the chart, enforces the two Phase 5 gates, and
hands back a result the API layer can serialise.

The two gates, and why they are here rather than at the route
-------------------------------------------------------------
**``numerology_alignment_required`` (plan §9.1).** No alternative spelling may
be offered without its Fortune Alignment against this native's chart. The
engine already requires a lagna to rank anything, so the flag is belt to that
braces: it drops any variant that somehow arrived unscored rather than
displaying it unranked. Enforced in the service so every future caller — a
report, a batch job, a second route — inherits it.

**The legal warning (plan §9.4).** "Name correction ships with the
legal-consequence warning or does not ship." The rule is unchanged and is still
enforced here; what changed (2026-07-29) is *which* flag answers it.

It used to be ``readings_available()`` — the corpus-wide
``numerology_content.CONTENT_REVIEWED``. That was the wrong gate, for the same
reason it was the wrong gate for Cheiro's compound titles: one flag was covering
two categories of text needing different evidence. The corpus is per-person
interpretation and waits on a native pass plus astrologer sign-off; the legal
warning is a fixed statement about Indian paperwork, identical for every user.
Tying the second to the first meant a fully built, tested correction engine
could never return one alternative to anyone — the alternatives themselves are
spellings, totals and alignment scores, all number-shaped, all of the kind
Phase 7 shipped without the corpus.

``numerology_correction.legal_warning_available()`` is now the condition, and
flipping it False re-arms the old behaviour exactly. The composition rule still
holds either way: while the warning cannot be rendered, **the alternatives are
withheld and the analysis still ships**. A user learns how their current name
sits against their chart — the honest, useful half — and learns nothing about
what to change it to until the sentence explaining the cost of changing it can
actually be shown to them.

That is why ``alternatives_withheld_reason`` exists. An empty list from a
withheld recommendation and an empty list from "your name is already
well-aligned" are opposite findings, and a caller that cannot tell them apart
will render the wrong one.
"""
from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.orm import Session

from app.calculations.numerology_correction import (
    MAX_ALTERNATIVES,
    MAX_EDITS,
    CorrectionResult,
    RankedVariant,
    correct_name,
    legal_warning_available,
)
from app.services.feature_flags import get_flag
from app.services.numerology_service import (
    load_chart_context,
    require_numerology_enabled,
)

CALCULATION_VERSION = "numerology-correction-v1"

#: Why an otherwise non-empty alternatives list was emptied.
WITHHELD_PENDING_REVIEW = "pending_content_review"
WITHHELD_UNALIGNED = "alignment_unavailable"


def alignment_required() -> bool:
    return bool(get_flag("numerology_alignment_required"))


@dataclass(frozen=True, slots=True)
class ChartNameCorrection:
    """A correction analysis, plus what (if anything) was held back and why."""

    result: CorrectionResult
    lagna_rasi: int
    #: Populated when the engine produced alternatives that this layer removed.
    #: ``None`` means the engine's own list is what the caller is seeing.
    alternatives_withheld_reason: str | None
    calculation_version: str = CALCULATION_VERSION

    @property
    def alternatives(self) -> tuple[RankedVariant, ...]:
        """What the caller may actually be shown."""
        return () if self.alternatives_withheld_reason else self.result.alternatives

    @property
    def change_advised(self) -> bool:
        """Never True without something to advise.

        A response saying "change your name" with nothing to change it to is
        worse than silence, and a withheld list must not leak the verdict it was
        withheld with.
        """
        return bool(self.alternatives)

    @property
    def requires_legal_warning(self) -> bool:
        return bool(self.alternatives)


def correct_name_for_chart(
    chart_id: UUID,
    name: str,
    session: Session,
    *,
    max_edits: int = MAX_EDITS,
    limit: int = MAX_ALTERNATIVES,
) -> ChartNameCorrection:
    """Score a name against this native's chart and offer corrections if warranted.

    ``name`` is caller-supplied — it is the spelling on their documents, which
    is not chart data. ``correct_name`` raises ``ScriptMismatchError`` on
    non-Latin input (doctrine D3); the route turns that into a 422 at the
    boundary the string came from.
    """
    require_numerology_enabled()
    ctx = load_chart_context(session, chart_id)
    result = correct_name(
        name,
        ctx.lagna_rasi,
        strengths=ctx.strengths,
        node_rasi_map=ctx.node_rasi_map,
        max_edits=max_edits,
        limit=limit,
    )

    withheld: str | None = None
    if result.alternatives:
        if not legal_warning_available():
            # §9.4 — the warning cannot be rendered, so the recommendation it
            # is mandatory for cannot be made. Note this is the WARNING's own
            # gate, not the corpus gate: a correction may ship with every
            # interpretive sentence still dark, because the alternatives carry
            # no interpretation — only spellings, totals and alignment scores.
            withheld = WITHHELD_PENDING_REVIEW
        elif alignment_required() and any(
            variant.alignment is None for variant in result.alternatives
        ):  # pragma: no cover - the engine cannot currently produce this
            withheld = WITHHELD_UNALIGNED

    return ChartNameCorrection(
        result=result,
        lagna_rasi=ctx.lagna_rasi,
        alternatives_withheld_reason=withheld,
    )
