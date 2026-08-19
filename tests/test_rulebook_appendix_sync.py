"""The published table appendix must equal what the live constants generate.

`docs/VINAADI_RULEBOOK_TABLE_APPENDIX.md` exists so an external reviewer can see
the tables the engine actually evaluates. A hand-copied table in a doc drifts
from the code the day after it is written, and a drifted appendix is worse than
no appendix — it launders a stale table as verified.

So the doc is generated, and this test regenerates it in memory and compares. If
this fails, run:

    python scripts/generate_rulebook_appendix.py

and commit the result alongside whatever constant you changed.
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

pytestmark = pytest.mark.no_db

REPO_ROOT = Path(__file__).resolve().parents[1]
GENERATOR = REPO_ROOT / "scripts" / "generate_rulebook_appendix.py"
APPENDIX = REPO_ROOT / "docs" / "VINAADI_RULEBOOK_TABLE_APPENDIX.md"


def _load_generator():
    spec = importlib.util.spec_from_file_location("_rulebook_appendix_generator", GENERATOR)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_appendix_is_in_sync_with_the_live_constants():
    generated = _load_generator().build()
    committed = APPENDIX.read_text(encoding="utf-8")
    assert generated == committed, (
        "docs/VINAADI_RULEBOOK_TABLE_APPENDIX.md is stale. Regenerate it with "
        "`python scripts/generate_rulebook_appendix.py` and commit the result."
    )


def test_appendix_has_no_utf8_bom():
    """A BOM here has hidden whole files from tooling in this repo before."""
    assert APPENDIX.read_bytes()[:3] != b"\xef\xbb\xbf"


def test_appendix_covers_every_rule_the_reviewer_asked_to_see():
    """The release-gate review named the tables it could not verify. Each must
    now appear in the appendix, keyed by its rule ID."""
    text = APPENDIX.read_text(encoding="utf-8")
    for rule_id in (
        "PAN-06", "PAN-07", "PAN-08", "PAN-11", "PAN-12", "PAN-17",
        "POR-02", "POR-04", "POR-06", "POR-07", "POR-08", "POR-12",
        "STR-01", "STR-02", "DOS-01", "DOS-02", "DAS-02",
        "GO-03", "GO-05", "GO-10", "GO-11", "MUH-06", "MUH-07",
    ):
        assert rule_id in text, f"appendix does not cover {rule_id}"
