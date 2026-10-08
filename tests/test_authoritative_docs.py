"""A16 — the documents labelled authoritative must not point at things that are gone.

These are the files a contributor or a coding agent is told to follow without
question (`AGENTS.md` names them). Each one carries copied paths, and a copied
path is a claim about the repository that silently stops being true when the
file moves. `docs/AGENT_INSTRUCTIONS.md` sent readers to a repo root on another
drive and to `docs/FRONTEND.md` months after it was archived.

What this checks, and only this:

1. every relative Markdown link in these files resolves to a file or directory;
2. every backticked repo path (`app/...`, `web/...`, `docs/...`, ...) exists;
3. every "Repo root" statement across the set names the same root.

What it cannot see: whether the prose around a valid path is still TRUE.
"Shadbala is not computed" sat beside paths that all resolved. Doctrine and
policy statements need a human reader against the ratified decisions; a gate
that searched for the corrected sentence would prove only that the sentence
was typed.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

pytestmark = pytest.mark.no_db

REPO = Path(__file__).resolve().parent.parent

# The "Start Here" set: AGENTS.md names the first two as authoritative and
# docs/INDEX.md lists the rest under "Start Here" as current orientation.
AUTHORITATIVE = (
    "CLAUDE.md",
    "AGENTS.md",
    "README.md",
    "docs/INDEX.md",
    "docs/AGENT_INSTRUCTIONS.md",
    "docs/HOW_TO_USE_CODEBASE.md",
)

_LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
_TICKED = re.compile(r"`([^`\s]+)`")
_REPO_PATH = re.compile(
    r"^(app|web|docs|tests|scripts|packages|mobile|migrations)/"
    r"[A-Za-z0-9_./\[\]\-]+\.(py|ts|tsx|mjs|js|json|md|yaml|yml|sql|ps1|css)$"
)
# A path written as a pattern or a placeholder names no single file.
_NOT_A_PATH = re.compile(r"[*{}<>$]")
# "**Repo root:** `X`" or "Repo root is `X`" — the value directly, not a later
# backticked example on the same line.
_REPO_ROOT = re.compile(r"Repo root(?:\*\*)?:?(?:\*\*)?\s*(?:is\s+)?`([^`]+)`", re.IGNORECASE)


def _text(rel: str) -> str:
    return (REPO / rel).read_text(encoding="utf-8")


def _strip_code_blocks(text: str) -> str:
    """Fenced blocks hold examples (`my_feature.py`), not claims about the tree."""
    return re.sub(r"```.*?```", "", text, flags=re.DOTALL)


@pytest.mark.parametrize("rel", AUTHORITATIVE)
def test_relative_links_resolve(rel: str) -> None:
    base = (REPO / rel).parent
    missing = []
    for target in _LINK.findall(_strip_code_blocks(_text(rel))):
        if re.match(r"^[a-z]+:", target) or target.startswith("#"):
            continue
        path = target.split("#", 1)[0]
        if path and not (base / path).exists():
            missing.append(target)
    assert not missing, f"{rel}: links to missing files: {missing}"


@pytest.mark.parametrize("rel", AUTHORITATIVE)
def test_backticked_repo_paths_exist(rel: str) -> None:
    missing = []
    for token in _TICKED.findall(_strip_code_blocks(_text(rel))):
        token = token.split(":", 1)[0]  # `file.py:42` cites a line in a file
        if _NOT_A_PATH.search(token) or not _REPO_PATH.match(token):
            continue
        if not (REPO / token).exists():
            missing.append(token)
    assert not missing, f"{rel}: names repo paths that do not exist: {missing}"


def test_authoritative_docs_agree_on_the_repo_root() -> None:
    stated = [
        (rel, root)
        for rel in AUTHORITATIVE
        for root in _REPO_ROOT.findall(_text(rel))
    ]
    assert stated, "no document states the repo root; the pattern has drifted"
    assert len({root for _, root in stated}) == 1, f"conflicting repo roots: {stated}"
