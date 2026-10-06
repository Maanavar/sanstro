"""FTR-22 — "share with my astrologer": the Astrologer ledgers in the jadhagam PDF.

Two things are checked against a real synthetic chart on the test DB:

1. The route: `?detail=astrologer` returns a PDF larger than the one-page
   snapshot, and omitting it still returns the snapshot (additive contract).
2. The display boundary: every cell of the appendix, in both languages, names
   rasis, stars, grahas and yogas in the reader's language — never an engine
   code, and no Latin name inside Tamil (CLAUDE.md "Display boundary"). Text
   is read from the ReportLab flowables, so no PDF parser is needed.

Blind spot: this reads the text the flowables carry, not the rendered glyphs —
a missing Tamil font would still pass here (the font fallback is
`_register_pdf_fonts`'s concern, not this file's).
"""
from __future__ import annotations

import re
from datetime import date

from reportlab.platypus import Paragraph, Table

from app.calculations.astro import RASI_NAMES
from app.calculations.display_names import PLANET_EN
from app.calculations.yoga_display import YOGA_DISPLAY
from app.constants.astrology import NAKSHATRA_NAMES
from app.db.session import SessionLocal
from app.services.chart_explanation_service import build_chart_explanation
from app.services.chart_service import load_persisted_chart_response
from app.services.pdf_export_service import _section_astrologer, _styles

AS_OF = date(2026, 10, 4)

# Latin names a Tamil cell must never carry, any case.
_LATIN_NAMES = re.compile(
    r"\b(" + "|".join(map(re.escape, [*RASI_NAMES.values(), *NAKSHATRA_NAMES, *PLANET_EN.values()])) + r")\b",
    re.IGNORECASE,
)
# Engine codes an English cell must never carry: SUN, KADAGAM, GAJA_KESARI_YOGA…
_CODES = re.compile(
    r"\b("
    + "|".join(map(re.escape, [*(n.upper() for n in RASI_NAMES.values()), *NAKSHATRA_NAMES, *PLANET_EN, *YOGA_DISPLAY]))
    + r")\b"
)


def _chart_id(client, payload: dict) -> str:
    response = client.post("/api/v1/birth-profiles", json=payload)
    assert response.status_code == 200, response.text[:300]
    return response.json()["data"]["chartId"]


def _texts(flowables) -> list[str]:
    out: list[str] = []
    for item in flowables:
        if isinstance(item, Paragraph):
            out.append(item.getPlainText())
        elif isinstance(item, Table):
            for row in item._cellvalues:
                out.extend(cell.getPlainText() if isinstance(cell, Paragraph) else str(cell) for cell in row)
    return out


def test_astrologer_detail_extends_the_snapshot(client, birth_profile_payload_factory):
    chart_id = _chart_id(client, birth_profile_payload_factory(display_name="Synthetic PDF Owner"))
    snapshot = client.get(f"/api/v1/charts/{chart_id}/export/pdf", params={"asOf": AS_OF.isoformat(), "lang": "ta"})
    full = client.get(
        f"/api/v1/charts/{chart_id}/export/pdf",
        params={"asOf": AS_OF.isoformat(), "lang": "ta", "detail": "astrologer"},
    )
    assert snapshot.status_code == 200 and full.status_code == 200
    assert snapshot.content[:4] == full.content[:4] == b"%PDF"
    assert len(full.content) > len(snapshot.content)
    assert "astrologer" in full.headers["content-disposition"]
    assert client.get(f"/api/v1/charts/{chart_id}/export/pdf", params={"detail": "everything"}).status_code == 422


def test_appendix_names_everything_in_the_readers_language(client, birth_profile_payload_factory):
    chart_id = _chart_id(client, birth_profile_payload_factory(display_name="Synthetic PDF Reader"))
    with SessionLocal() as session:
        explanation = build_chart_explanation(session, chart_id, as_of=AS_OF)
        lagna_rasi = load_persisted_chart_response(session, chart_id).data.lagna.rasi
        for lang in ("ta", "en"):
            _, heading, body, caption = _styles(lang)
            texts = _texts(_section_astrologer(explanation, lagna_rasi, heading, body, caption, lang))
            # Baseline: the appendix rendered its ledgers, so an empty pass is impossible.
            assert len(texts) > 80, f"{lang}: appendix rendered only {len(texts)} cells"
            # The method note is engine prose with its own ratchet
            # (test_chart_explanation_display_names.py); it is skipped here.
            cells = [t for t in texts if t and not t.startswith(("Method:", "கணித முறை:"))]
            if lang == "ta":
                leaks = sorted({m.group(0) for t in cells for m in _LATIN_NAMES.finditer(t)})
                assert not leaks, f"Latin names inside the Tamil appendix: {leaks}"
            else:
                leaks = sorted({m.group(0) for t in cells for m in _CODES.finditer(t)})
                assert not leaks, f"engine codes inside the English appendix: {leaks}"
