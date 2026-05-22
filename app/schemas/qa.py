from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel


class QACaseResult(BaseModel):
    test_id: str
    description: str
    passed: bool
    expected: Any
    actual: Any
    detail: str | None = None


class QAModuleResult(BaseModel):
    module: str
    passed: int
    failed: int
    cases: list[QACaseResult]

    @property
    def pass_rate(self) -> float:
        total = self.passed + self.failed
        return self.passed / total if total > 0 else 1.0


class QAValidationResponse(BaseModel):
    total_passed: int
    total_failed: int
    modules: list[QAModuleResult]
    run_at: datetime = None  # type: ignore[assignment]

    def model_post_init(self, _context: Any) -> None:
        if self.run_at is None:
            object.__setattr__(self, "run_at", datetime.now(UTC))


class QAFailureRecord(BaseModel):
    """A single failed case stored for regression tracking."""
    test_id: str
    module: str
    description: str
    expected: Any
    actual: Any
    detail: str | None = None
    first_seen: datetime
    last_seen: datetime
    occurrences: int = 1


class QARegressionReport(BaseModel):
    """Summary of stored regression failures."""
    total_stored: int
    failures: list[QAFailureRecord]
