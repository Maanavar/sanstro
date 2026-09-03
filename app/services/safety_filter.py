"""Safety pass (D15) — one place every surface's bilingual output passes
through before serving.

The doctrine imagines a single ordered `Safety -> Medical -> Legal ->
Psychological -> Language` pass (docs/PREDICTION_DOCTRINE_AND_ROADMAP.md
§4.2). `narrative_engine.tone_validator` (language: no fatalistic phrasing)
had zero serve-time call sites — test-only — before this module. This is
what actually calls it at serve time, and is the one seam every surface
(whatif, life-areas, marriage, daily-guidance, propensities, Ask Vinaadi)
now shares instead of re-implementing its own check.

Deliberately tone-only, not precision-only-or-both: `precision_validator`
(no false X/100 leaking into copy) is a *context-sensitive* rule — some
narrative strings deliberately show both the band word and the numeric
score side by side (product decision 2026-07-13, P0-1;
narrative_engine.precision_validator's own docstring), while the
epistemic-state voices (SILENT/BLOCKED/reading templates) must stay
band-only. That distinction is already enforced by the targeted test
suite (tests/reasoning/test_ordinal_copy.py's precision sweep) against
the fixed template strings it applies to. Re-running precision_validator
blanket over every general narrative field here would flag the sanctioned
score-alongside-band strings as false positives. Tone (never fatalistic)
has no such exception anywhere — it is the universal, context-free rule
this pass exists to actually enforce at runtime, especially for Ask
Vinaadi's LLM-generated text, which is the one surface with no
pre-validated template behind it at all.

Every template string in this codebase is already covered by test-time
tone_validator sweeps (tests/reasoning/, tests/test_tone_compliance.py),
so for template-driven surfaces a violation reaching this function means
a real bug, not an expected runtime branch — log loudly, never raise,
never block the response.
"""
from __future__ import annotations

import logging
from typing import Any

from app.services.narrative_engine import tone_validator

logger = logging.getLogger(__name__)


def check_text(text: str, *, source: str, lang: str) -> list[str]:
    """Run the tone check on one string; log and return any banned phrases."""
    leaks = tone_validator(text)
    if leaks:
        logger.error(
            "safety_filter: banned phrase(s) %s in %s/%s: %r", leaks, source, lang, text
        )
    return leaks


def run_safety_pass(*texts: Any, source: str) -> None:
    """Serve-time D6 tone check over every bilingual field a surface is
    about to return. Accepts any object exposing ``.ta``/``.en`` (BiText
    from app.reasoning.verdict, app.services.narrative_engine, or
    app.services.life_area_prediction_models — they share the shape by
    duck typing, same convention as render_causal_chain) or ``None``
    (skipped, so callers can pass optional fields directly).

    Never raises — a leak here is a bug signal (see module docstring), not
    a reason to fail the request.
    """
    for text in texts:
        if text is None:
            continue
        ta = getattr(text, "ta", None)
        en = getattr(text, "en", None)
        if isinstance(ta, str):
            check_text(ta, source=source, lang="ta")
        if isinstance(en, str):
            check_text(en, source=source, lang="en")
