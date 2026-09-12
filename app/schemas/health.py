from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: str
    version: str
    environment: str


class ReadinessCheck(BaseModel):
    """One dependency's contribution to readiness.

    ``required`` is what separates this from a status page: a dependency the app
    degrades around (Redis, when the limiter is already per-process) reports its
    real state without taking the instance out of rotation.
    """

    status: Literal["ok", "down", "disabled"]
    required: bool
    latency_ms: float | None = None


class ReadinessResponse(BaseModel):
    """Deliberately says nothing about version, environment or connection strings.

    ``/health`` already exposes the first two and is load-bearing for the
    container healthcheck, so it is left alone; this endpoint is new and does not
    have to repeat the mistake. An unauthenticated probe answers one question —
    send traffic here, or not.
    """

    status: Literal["ready", "not_ready"]
    checks: dict[str, ReadinessCheck]
