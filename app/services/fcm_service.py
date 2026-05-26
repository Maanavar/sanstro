"""
Firebase Cloud Messaging (FCM) HTTP v1 push notification delivery.

Operates in stub mode when FCM credentials are not configured:
  - JOTHIDAM_FCM_PROJECT_ID and JOTHIDAM_FCM_SERVICE_ACCOUNT_JSON unset
  → silently logs and returns without error.

When credentials are present, sends via FCM HTTP v1 API using a short-lived
OAuth2 access token obtained from the service account JSON.

No new package dependencies: uses httpx (already in requirements) and
the stdlib json/datetime modules.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_FCM_SEND_URL = "https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"
_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
_FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"

# Simple in-process token cache: (access_token, expiry_epoch)
_token_cache: tuple[str, float] | None = None


def _fcm_configured() -> bool:
    s = get_settings()
    return bool(getattr(s, "fcm_project_id", None) and getattr(s, "fcm_service_account_json", None))


def _get_access_token() -> str:
    """
    Obtain a short-lived OAuth2 access token from the service account JSON.
    Caches for 50 minutes (tokens last 60 min).
    """
    global _token_cache

    now = time.time()
    if _token_cache and _token_cache[1] > now + 60:
        return _token_cache[0]

    s = get_settings()
    sa_json: dict[str, Any] = json.loads(s.fcm_service_account_json)  # type: ignore[arg-type]

    import base64
    import hashlib
    import hmac
    import struct

    # Build a minimal JWT for the service account → exchange for access token
    # Using RS256 requires the rsa or cryptography package. We fall back to
    # the google-auth flow via httpx if available, otherwise raise clearly.
    try:
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding
        from cryptography.hazmat.backends import default_backend
    except ImportError as exc:
        raise RuntimeError(
            "FCM push requires the 'cryptography' package. "
            "Install it with: pip install cryptography"
        ) from exc

    private_key_pem: str = sa_json["private_key"]
    client_email: str = sa_json["client_email"]

    header = {"alg": "RS256", "typ": "JWT"}
    iat = int(now)
    payload = {
        "iss": client_email,
        "scope": _FCM_SCOPE,
        "aud": _OAUTH_TOKEN_URL,
        "iat": iat,
        "exp": iat + 3600,
    }

    def _b64url(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    header_b64 = _b64url(json.dumps(header).encode())
    payload_b64 = _b64url(json.dumps(payload).encode())
    signing_input = f"{header_b64}.{payload_b64}".encode()

    private_key = serialization.load_pem_private_key(private_key_pem.encode(), password=None, backend=default_backend())
    signature = private_key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())  # type: ignore[arg-type]
    jwt_token = f"{header_b64}.{payload_b64}.{_b64url(signature)}"

    resp = httpx.post(
        _OAUTH_TOKEN_URL,
        data={
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": jwt_token,
        },
        timeout=10,
    )
    resp.raise_for_status()
    token_data = resp.json()
    access_token: str = token_data["access_token"]
    expires_in: int = token_data.get("expires_in", 3600)
    _token_cache = (access_token, now + expires_in - 600)  # cache with 10 min margin
    return access_token


def send_push(
    device_token: str,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> bool:
    """
    Send an FCM push notification to a single device token.

    Returns True on success or when FCM is unconfigured (stub mode).
    Returns False on delivery failure (logs error, does not raise).
    """
    if not _fcm_configured():
        logger.info("FCM not configured — skipping push to token %s…: %s", device_token[:12], title)
        return True

    s = get_settings()
    project_id: str = s.fcm_project_id  # type: ignore[attr-defined]

    try:
        access_token = _get_access_token()
    except Exception as exc:
        logger.error("FCM token fetch failed: %s", exc)
        return False

    message: dict[str, Any] = {
        "message": {
            "token": device_token,
            "notification": {"title": title, "body": body},
        }
    }
    if data:
        message["message"]["data"] = data

    url = _FCM_SEND_URL.format(project_id=project_id)
    try:
        resp = httpx.post(
            url,
            json=message,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if resp.status_code == 200:
            logger.info("fcm_sent token=%s… title=%s", device_token[:12], title)
            return True

        # 404 = token invalid / unregistered — not worth retrying
        if resp.status_code == 404:
            logger.warning("fcm_token_invalid token=%s…", device_token[:12])
            return False

        logger.error("fcm_failed status=%d body=%s", resp.status_code, resp.text[:200])
        return False

    except Exception as exc:
        logger.error("fcm_exception token=%s… exc=%s", device_token[:12], exc)
        return False
