"""Internal QA validation endpoints — Sprint 9."""
from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_admin_user
from app.models.user import User
from app.schemas.qa import QAFailureRecord, QARegressionReport, QAValidationResponse
from app.services.qa_service import run_golden_validation

router = APIRouter(prefix="/qa", tags=["qa"])

# In-memory regression store — survives process lifetime.
# A persistent backend (DB / file) can replace this in Sprint 10.
_regression_store: dict[str, QAFailureRecord] = {}


@router.get(
    "/validate",
    response_model=QAValidationResponse,
    summary="Run internal golden test suite",
)
def validate_golden_cases(_: User = Depends(get_admin_user)) -> QAValidationResponse:
    """Run all 139 golden QA cases across 11 modules and return pass/fail breakdown.

    Failed cases are automatically recorded in the regression store so they
    can be inspected later via GET /qa/regressions.
    """
    result = run_golden_validation()
    now = datetime.now(UTC)

    for module in result.modules:
        for case in module.cases:
            if not case.passed:
                existing = _regression_store.get(case.test_id)
                if existing:
                    _regression_store[case.test_id] = existing.model_copy(
                        update={"last_seen": now, "occurrences": existing.occurrences + 1}
                    )
                else:
                    _regression_store[case.test_id] = QAFailureRecord(
                        test_id=case.test_id,
                        module=module.module,
                        description=case.description,
                        expected=case.expected,
                        actual=case.actual,
                        detail=case.detail,
                        first_seen=now,
                        last_seen=now,
                    )

    return result


@router.get(
    "/regressions",
    response_model=QARegressionReport,
    summary="List all stored regression failures",
)
def list_regressions(_: User = Depends(get_admin_user)) -> QARegressionReport:
    """Return all failures recorded since the last server restart.

    Each failure includes first_seen, last_seen, and an occurrence count so
    flapping failures can be distinguished from hard regressions.
    """
    failures = sorted(_regression_store.values(), key=lambda r: r.last_seen, reverse=True)
    return QARegressionReport(total_stored=len(failures), failures=failures)


@router.delete(
    "/regressions/{test_id}",
    summary="Clear a specific stored regression failure",
)
def clear_regression(test_id: str, _: User = Depends(get_admin_user)) -> dict[str, str]:
    """Remove a failure from the regression store once it is acknowledged and fixed."""
    if test_id not in _regression_store:
        raise HTTPException(status_code=404, detail=f"No regression found for test_id '{test_id}'")
    del _regression_store[test_id]
    return {"cleared": test_id}


@router.delete(
    "/regressions",
    summary="Clear all stored regression failures",
)
def clear_all_regressions(_: User = Depends(get_admin_user)) -> dict[str, int]:
    """Wipe the in-memory regression store. Use after a clean green run."""
    count = len(_regression_store)
    _regression_store.clear()
    return {"cleared": count}
