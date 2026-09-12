import pytest

from app.api import health as health_api
from app.schemas.health import ReadinessCheck


def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "Vinaadi AI API"
    assert payload["version"] == "0.1.0"
    assert payload["environment"] == "development"
    assert "default-src 'self'" in response.headers["content-security-policy"]
    assert response.headers["strict-transport-security"] == "max-age=31536000; includeSubDomains"


def test_liveness_does_not_touch_the_database(client, monkeypatch):
    """A database outage must not restart-loop the fleet.

    Liveness answers "is this process alive". If it consulted the database, a
    database outage would fail every liveness probe and the orchestrator would
    kill every instance — turning a recoverable dependency outage into a fleet
    that is gone.
    """

    def _explode() -> ReadinessCheck:
        raise AssertionError("liveness must not check the database")

    monkeypatch.setattr(health_api, "_check_database", _explode)

    response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_ok_reports_each_dependency(client):
    response = client.get("/health/ready")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["checks"]["database"]["status"] == "ok"
    assert payload["checks"]["database"]["required"] is True
    # The test suite runs on the in-process backends, so Redis is not in play.
    assert payload["checks"]["cache"]["status"] == "disabled"


def test_readiness_says_nothing_about_the_deployment(client):
    """It is unauthenticated. It answers one question and volunteers nothing."""
    payload = client.get("/health/ready").json()

    assert set(payload) == {"status", "checks"}
    body = client.get("/health/ready").text
    for leak in ("0.1.0", "development", "Vinaadi AI API", "postgres", "sqlite"):
        assert leak not in body


def test_readiness_is_503_when_the_database_is_down(client, monkeypatch):
    monkeypatch.setattr(
        health_api,
        "_check_database",
        lambda: ReadinessCheck(status="down", required=True),
    )

    response = client.get("/health/ready")

    assert response.status_code == 503
    payload = response.json()
    assert payload["status"] == "not_ready"
    assert payload["checks"]["database"]["status"] == "down"


@pytest.mark.parametrize(
    ("required", "expected_status"),
    [
        # Redis backs the rate limiter: falling back multiplies every limit by the
        # worker count, so the instance stops taking traffic.
        (True, 503),
        # Redis is only a cache: the in-process fallback is correct, just colder.
        # Reported honestly, but not a reason to leave the rotation.
        (False, 200),
    ],
)
def test_cache_outage_is_fatal_only_when_the_cache_is_required(
    client, monkeypatch, required, expected_status
):
    monkeypatch.setattr(
        health_api,
        "_check_cache",
        lambda: ReadinessCheck(status="down", required=required),
    )

    response = client.get("/health/ready")

    assert response.status_code == expected_status
    assert response.json()["checks"]["cache"]["status"] == "down"


def test_cache_requirement_follows_the_rate_limit_backend(monkeypatch):
    """The derivation, not the endpoint — this is the decision worth pinning."""
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "readiness_require_cache", None, raising=False)

    monkeypatch.setattr(settings, "rate_limit_backend", "redis", raising=False)
    assert health_api._cache_is_required() is True

    monkeypatch.setattr(settings, "rate_limit_backend", "memory", raising=False)
    assert health_api._cache_is_required() is False

    # An explicit setting wins in both directions.
    monkeypatch.setattr(settings, "readiness_require_cache", True, raising=False)
    assert health_api._cache_is_required() is True
    monkeypatch.setattr(settings, "rate_limit_backend", "redis", raising=False)
    monkeypatch.setattr(settings, "readiness_require_cache", False, raising=False)
    assert health_api._cache_is_required() is False


def test_probes_are_exempt_from_rate_limiting():
    """All three live under /health, which the limiter skips by prefix."""
    from app.middleware import RATE_LIMIT_EXEMPT_PREFIXES

    for path in ("/health", "/health/live", "/health/ready"):
        assert path.startswith(RATE_LIMIT_EXEMPT_PREFIXES)
