"""A15 — properties of the CI workflows that have each failed silently before.

Each check is about what CI *runs*, read from the workflow files themselves:

1. Every job is bounded. One web-image job ran 4h47m on a stalled install
   before anyone learned anything (CLAUDE.md, P0-5).
2. Mobile CI runs the Jest suites. It type-checked and linted only, so the
   A02/A07/A08 lifecycle tests could regress with every check green.
3. Mobile CI triggers on the files that decide what mobile installs. A
   lockfile or workspace-override change used to run no mobile check at all.
4. Mobile lint covers `src/`, not just `app/` — and with a warning ceiling, so
   the existing findings are a recorded baseline rather than noise.

What this cannot see: whether a job *passes*, whether GitHub honours the
config (only a real run proves that), or branch protection — `main` had no
required checks at all on 2026-10-08, so a red run blocks nothing.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest
import yaml

REPO = Path(__file__).resolve().parent.parent
WORKFLOWS = sorted((REPO / ".github" / "workflows").glob("*.yml"))

pytestmark = pytest.mark.no_db

# Root files that change what a mobile install resolves.
MOBILE_TRIGGER_FILES = (
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".npmrc",
    ".github/workflows/mobile.yml",
)


def _load(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _triggers(workflow: dict) -> dict:
    # YAML 1.1 reads a bare `on:` key as the boolean True.
    return workflow.get("on") or workflow.get(True) or {}


def test_workflows_were_found() -> None:
    names = {path.name for path in WORKFLOWS}
    assert {"ci.yml", "mobile.yml"} <= names, names


@pytest.mark.parametrize("path", WORKFLOWS, ids=lambda p: p.name)
def test_every_job_has_a_timeout(path: Path) -> None:
    unbounded = [
        name for name, job in _load(path)["jobs"].items()
        if not isinstance(job.get("timeout-minutes"), int)
    ]
    assert not unbounded, f"{path.name}: jobs with no timeout-minutes: {unbounded}"


def _mobile_check_steps() -> list[str]:
    job = _load(REPO / ".github" / "workflows" / "mobile.yml")["jobs"]["check"]
    return [step.get("run", "") for step in job["steps"]]


def test_mobile_ci_runs_jest() -> None:
    runs = _mobile_check_steps()
    assert any("-F mobile test" in run for run in runs), runs


@pytest.mark.parametrize("event", ["push", "pull_request"])
def test_mobile_ci_triggers_on_install_inputs(event: str) -> None:
    paths = _triggers(_load(REPO / ".github" / "workflows" / "mobile.yml"))[event]["paths"]
    missing = [f for f in MOBILE_TRIGGER_FILES if f not in paths]
    assert not missing, f"mobile.yml {event} ignores changes to {missing}"
    assert "packages/**" in paths, "design-tokens and shared both live under packages/"


def test_mobile_lint_covers_src_with_a_warning_ceiling() -> None:
    script = json.loads((REPO / "mobile" / "package.json").read_text(encoding="utf-8"))["scripts"]["lint"]
    assert "src/" in script, script
    assert "--max-warnings" in script, script
