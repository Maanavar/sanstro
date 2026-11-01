"""Internal QA validation endpoints — Sprint 9."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import get_admin_user, get_elevated_admin_user
from app.core.permissions import require_permission
from app.models.user import User
from app.schemas.qa import QAFailureRecord, QARegressionReport, QAValidationResponse
from app.services.audit_service import AuditEntry, audited
from app.services.qa_service import run_golden_validation

router = APIRouter(prefix="/qa", tags=["qa"])

# In-memory regression store — survives process lifetime.
# A persistent backend (DB / file) can replace this in Sprint 10.
_regression_store: dict[str, QAFailureRecord] = {}


@router.get(
    "/validate",
    response_model=QAValidationResponse,
    summary="Run internal golden test suite",
    dependencies=[Depends(require_permission("qa.read"))],
)
def validate_golden_cases(_: User = Depends(get_admin_user)) -> QAValidationResponse:
    """Run all 139 golden QA cases across 11 modules and return pass/fail breakdown.

    Failed cases are automatically recorded in the regression store so they
    can be inspected later via GET /qa/regressions.
    """
    result = _run_and_store_validation()
    return result


def _run_and_store_validation() -> QAValidationResponse:
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
    dependencies=[Depends(require_permission("qa.read"))],
)
def list_regressions(_: User = Depends(get_admin_user)) -> QARegressionReport:
    """Return all failures recorded since the last server restart.

    Each failure includes first_seen, last_seen, and an occurrence count so
    flapping failures can be distinguished from hard regressions.
    """
    failures = sorted(_regression_store.values(), key=lambda r: r.last_seen, reverse=True)
    return QARegressionReport(total_stored=len(failures), failures=failures)


@router.delete(
    "/regressions",
    summary="Clear all stored regression failures",
    dependencies=[Depends(require_permission("qa.write"))],
)
def clear_all_regressions(
    audit: Annotated[AuditEntry, audited("clear_qa_regressions", target_type="qa", reason_required=True)],
    reason: str = "",
    _: User = Depends(get_elevated_admin_user),
) -> dict[str, int]:
    """Wipe the regression store. Use after a clean green run.

    Elevated, audited and reasoned (spec L4): clearing it erases the evidence of
    which golden cases were failing, which is exactly what a later review asks for.
    """
    audit.require_reason(reason)
    count = len(_regression_store)
    _regression_store.clear()
    audit.details = {"cleared": count}
    return {"cleared": count}
