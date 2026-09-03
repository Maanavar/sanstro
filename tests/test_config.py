from __future__ import annotations

import pytest

from app.core.config import Settings

pytestmark = pytest.mark.no_db


@pytest.fixture(autouse=True, scope="session")
def require_db():  # noqa: F811 - shadows conftest require_db; no DB needed
    return


def test_development_generates_ephemeral_auth_secrets(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)

    settings = Settings(database_url="postgresql://example/test", _env_file=None)

    assert settings.jwt_secret
    assert settings.admin_api_key


def test_staging_requires_auth_secrets(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)

    with pytest.raises(RuntimeError, match="JOTHIDAM_JWT_SECRET"):
        Settings(
            database_url="postgresql://example/test",
            environment="staging",
            encryption_key="configured",
            cookie_secure=True,
            _env_file=None,
        )


# ---------------------------------------------------------------------------
# Process roles — SEC-1 §5.2. Least privilege for the scheduler process.
# ---------------------------------------------------------------------------

def _production(**overrides):
    """A minimal production Settings, overridable per test."""
    kwargs = {
        "database_url": "postgresql://example/test",
        "environment": "production",
        "encryption_key": "configured",
        "cookie_secure": True,
        "_env_file": None,
    }
    kwargs.update(overrides)
    return Settings(**kwargs)


def test_worker_boots_in_production_without_auth_secrets(monkeypatch):
    """The scheduler authenticates nothing, so it should hold nothing that does.

    Requiring these of every process is what made per-service secret grants
    impossible: the worker container had to be handed a JWT secret it never used.
    """
    monkeypatch.delenv("APP_ENV", raising=False)

    settings = _production(process_role="worker")

    assert settings.jwt_secret is None
    assert settings.admin_api_key is None


def test_worker_boots_in_production_without_cookie_secure(monkeypatch):
    """Regression: the `scaled` compose profile could not start at all.

    The worker service sets JOTHIDAM_ENVIRONMENT=production and there is no .env
    in the image, so cookie_secure defaulted false and the production check
    rejected it — a cookie setting blocking a process that serves no cookies.
    """
    monkeypatch.delenv("APP_ENV", raising=False)

    settings = _production(process_role="worker", cookie_secure=False)

    assert settings.process_role == "worker"


def test_api_role_still_requires_auth_secrets(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)

    with pytest.raises(RuntimeError, match="JOTHIDAM_JWT_SECRET"):
        _production(process_role="api")


def test_role_defaults_to_the_one_that_demands_more(monkeypatch):
    """An unset role must fail closed: an HTTP process with no JWT secret is the
    failure this check exists to prevent, so the default cannot be `worker`."""
    monkeypatch.delenv("APP_ENV", raising=False)

    with pytest.raises(RuntimeError, match="JOTHIDAM_JWT_SECRET"):
        _production()


def test_worker_still_requires_the_encryption_key(monkeypatch):
    """It reads birth profiles for the morning push, so it decrypts."""
    monkeypatch.delenv("APP_ENV", raising=False)

    with pytest.raises(RuntimeError, match="JOTHIDAM_ENCRYPTION_KEY"):
        _production(process_role="worker", encryption_key="")


def test_unknown_role_is_rejected_rather_than_assumed(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)

    with pytest.raises(RuntimeError, match="JOTHIDAM_PROCESS_ROLE"):
        _production(process_role="scheduler", jwt_secret="x", admin_api_key="y")


# ---------------------------------------------------------------------------
# File-backed secrets — SEC-1 §6.
# ---------------------------------------------------------------------------

def test_secret_is_read_from_the_file_named_by_the_FILE_variable(tmp_path, monkeypatch):
    key_file = tmp_path / "encryption_keys"
    key_file.write_text("a-key-from-a-file", encoding="utf-8")
    monkeypatch.setenv("JOTHIDAM_ENCRYPTION_KEY_FILE", str(key_file))

    settings = _production(process_role="worker", encryption_key="")

    assert settings.encryption_key == "a-key-from-a-file"


def test_trailing_newline_is_stripped(tmp_path, monkeypatch):
    """`echo key > file` is how these get written, and a Fernet key with a
    newline on the end is not a Fernet key."""
    key_file = tmp_path / "jwt_secret"
    key_file.write_text("secret-value\n", encoding="utf-8")
    monkeypatch.setenv("JOTHIDAM_JWT_SECRET_FILE", str(key_file))

    settings = _production(process_role="worker")

    assert settings.jwt_secret == "secret-value"


def test_missing_file_names_the_variable_and_the_path(tmp_path, monkeypatch):
    missing = tmp_path / "not-mounted"
    monkeypatch.setenv("JOTHIDAM_JWT_SECRET_FILE", str(missing))

    with pytest.raises(RuntimeError, match="JOTHIDAM_JWT_SECRET_FILE"):
        _production(process_role="worker")


def test_empty_file_is_a_failed_mount_not_an_empty_secret(tmp_path, monkeypatch):
    """Booting with an empty secret defers the failure to first use. For the
    encryption key that means writing rows under a key nobody holds."""
    key_file = tmp_path / "encryption_keys"
    key_file.write_text("", encoding="utf-8")
    monkeypatch.setenv("JOTHIDAM_ENCRYPTION_KEY_FILE", str(key_file))

    with pytest.raises(RuntimeError, match="empty"):
        _production(process_role="worker", encryption_key="")


def test_both_channels_disagreeing_is_refused(tmp_path, monkeypatch):
    """No rule anyone would guess about which wins. For the encryption key,
    guessing wrong writes rows under a key the operator thinks is retired."""
    key_file = tmp_path / "encryption_keys"
    key_file.write_text("from-the-file", encoding="utf-8")
    monkeypatch.setenv("JOTHIDAM_ENCRYPTION_KEY_FILE", str(key_file))

    with pytest.raises(RuntimeError, match="both set and disagree"):
        _production(process_role="worker", encryption_key="from-the-environment")


def test_both_channels_agreeing_is_allowed(tmp_path, monkeypatch):
    """Happens mid-migration, when .env has not been cleaned up yet."""
    key_file = tmp_path / "encryption_keys"
    key_file.write_text("same-value", encoding="utf-8")
    monkeypatch.setenv("JOTHIDAM_ENCRYPTION_KEY_FILE", str(key_file))

    settings = _production(process_role="worker", encryption_key="same-value")

    assert settings.encryption_key == "same-value"


def test_the_error_never_prints_the_secret(tmp_path, monkeypatch):
    key_file = tmp_path / "encryption_keys"
    key_file.write_text("s3cr3t-material", encoding="utf-8")
    monkeypatch.setenv("JOTHIDAM_ENCRYPTION_KEY_FILE", str(key_file))

    with pytest.raises(RuntimeError) as excinfo:
        _production(process_role="worker", encryption_key="different-s3cr3t")

    message = str(excinfo.value)
    assert "s3cr3t-material" not in message
    assert "different-s3cr3t" not in message


def test_production_secret_error_does_not_echo_the_values(monkeypatch):
    """The reason every config failure raises RuntimeError and not ValueError.

    Pydantic turns a ValueError raised inside a validator into a ValidationError
    carrying ``input_value=`` — the entire settings dict. This check fires on a
    misconfigured production boot, which is exactly when every secret that WAS
    set would have been written to the log.
    """
    monkeypatch.delenv("APP_ENV", raising=False)

    with pytest.raises(RuntimeError) as excinfo:
        _production(encryption_key="ENCKEY-LEAKME", revenuecat_webhook_secret="HOOK-LEAKME")

    message = str(excinfo.value)
    assert "ENCKEY-LEAKME" not in message
    assert "HOOK-LEAKME" not in message
    assert "input_value" not in message
    # Still says what is wrong, by name.
    assert "JOTHIDAM_JWT_SECRET" in message


def test_an_unrelated_FILE_variable_is_not_interpreted(tmp_path, monkeypatch):
    """Only the model's own fields. A stray FOO_FILE in the environment of a
    container that mounts other things is not ours to read."""
    monkeypatch.setenv("JOTHIDAM_NOT_A_SETTING_FILE", str(tmp_path / "nope"))

    settings = _production(process_role="worker")

    assert settings.encryption_key == "configured"
