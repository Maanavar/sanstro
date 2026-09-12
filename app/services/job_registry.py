"""Centralised job registry so admin endpoints can list and trigger all jobs."""
from __future__ import annotations

from collections.abc import Callable
from typing import Any

_JOB_REGISTRY: dict[str, dict[str, Any]] = {}


def register_job(
    job_id: str,
    label: str,
    description: str,
    fn: Callable[..., Any],
    *,
    destructive: bool = False,
) -> None:
    """Register a job's metadata and callable.

    ``destructive`` marks a job that deletes data or sends something outward, as
    opposed to an idempotent recompute. The admin trigger endpoint requires a
    short-lived elevation for those — see `app.api.admin.trigger_job`. Default
    False, because every job registered before this flag existed was a recompute
    and reclassifying them silently would be the wrong direction to guess in.
    """
    _JOB_REGISTRY[job_id] = {
        "job_id": job_id,
        "label": label,
        "description": description,
        "fn": fn,
        "destructive": destructive,
    }


def get_all_jobs() -> list[dict[str, Any]]:
    return list(_JOB_REGISTRY.values())


def get_job(job_id: str) -> dict[str, Any] | None:
    return _JOB_REGISTRY.get(job_id)
