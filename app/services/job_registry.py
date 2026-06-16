"""Centralised job registry so admin endpoints can list and trigger all jobs."""
from __future__ import annotations

from typing import Any, Callable

_JOB_REGISTRY: dict[str, dict[str, Any]] = {}


def register_job(job_id: str, label: str, description: str, fn: Callable[..., Any]) -> None:
    _JOB_REGISTRY[job_id] = {
        "job_id": job_id,
        "label": label,
        "description": description,
        "fn": fn,
    }


def get_all_jobs() -> list[dict[str, Any]]:
    return list(_JOB_REGISTRY.values())


def get_job(job_id: str) -> dict[str, Any] | None:
    return _JOB_REGISTRY.get(job_id)
