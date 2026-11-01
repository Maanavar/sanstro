"""Razorpay REST client and signature checks (admin spec L1, D-04).

A thin httpx wrapper over the handful of calls Vinaadi makes, not the
`razorpay` SDK: the SDK pulls in `requests` and does nothing here that ten
lines of httpx do not. Every call is bounded by a timeout.

Three different HMACs, easy to mix up:

* checkout, one-time order — HMAC-SHA256(key_secret, f"{order_id}|{payment_id}")
* checkout, subscription  — HMAC-SHA256(key_secret, f"{payment_id}|{subscription_id}")
* webhook                  — HMAC-SHA256(webhook_secret, raw request body)

A valid checkout signature proves the browser saw Razorpay's success handler.
It does not prove the money arrived, so nothing is granted on it alone
(spec L1 acceptance): the webhook, or an order fetched from this API, decides.
"""
from __future__ import annotations

import hashlib
import hmac
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import get_settings

API_BASE = "https://api.razorpay.com/v1"
_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


class RazorpayError(RuntimeError):
    """Razorpay answered with an error, or could not be reached."""


def _hmac_hex(secret: str, message: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def _matches(expected: str, given: str | None) -> bool:
    return bool(given) and hmac.compare_digest(expected, given or "")


def verify_webhook_signature(raw_body: bytes, signature: str | None, secret: str) -> bool:
    """The body as received, byte for byte: re-serialised JSON will not match."""
    return _matches(_hmac_hex(secret, raw_body), signature)


def verify_order_payment_signature(order_id: str, payment_id: str, signature: str | None, key_secret: str) -> bool:
    return _matches(_hmac_hex(key_secret, f"{order_id}|{payment_id}".encode()), signature)


def verify_subscription_payment_signature(
    subscription_id: str, payment_id: str, signature: str | None, key_secret: str
) -> bool:
    return _matches(_hmac_hex(key_secret, f"{payment_id}|{subscription_id}".encode()), signature)


@dataclass(frozen=True)
class RazorpayClient:
    key_id: str
    key_secret: str

    def _request(self, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
        try:
            response = httpx.request(
                method,
                f"{API_BASE}{path}",
                auth=(self.key_id, self.key_secret),
                timeout=_TIMEOUT,
                **kwargs,
            )
        except httpx.HTTPError as exc:
            raise RazorpayError(f"razorpay_unreachable {type(exc).__name__}") from exc
        if response.status_code >= 400:
            # Razorpay's error body names the field at fault; it carries no
            # card or customer data, so it is safe to keep in the message.
            raise RazorpayError(f"razorpay_http_{response.status_code} {response.text[:300]}")
        return response.json()

    # ── One-time purchases (Orders API) ──────────────────────────────────────

    def create_order(self, *, amount_paise: int, receipt: str, notes: dict[str, str]) -> dict[str, Any]:
        return self._request(
            "POST",
            "/orders",
            json={"amount": amount_paise, "currency": "INR", "receipt": receipt, "notes": notes},
        )

    def fetch_order(self, order_id: str) -> dict[str, Any]:
        return self._request("GET", f"/orders/{order_id}")

    def fetch_order_payments(self, order_id: str) -> list[dict[str, Any]]:
        return list(self._request("GET", f"/orders/{order_id}/payments").get("items", []))

    # ── Subscriptions ────────────────────────────────────────────────────────

    def create_subscription(self, *, plan_id: str, total_count: int, notes: dict[str, str]) -> dict[str, Any]:
        return self._request(
            "POST",
            "/subscriptions",
            json={"plan_id": plan_id, "total_count": total_count, "customer_notify": 1, "notes": notes},
        )

    def fetch_subscription(self, subscription_id: str) -> dict[str, Any]:
        return self._request("GET", f"/subscriptions/{subscription_id}")

    def cancel_subscription(self, subscription_id: str, *, at_cycle_end: bool = True) -> dict[str, Any]:
        return self._request(
            "POST",
            f"/subscriptions/{subscription_id}/cancel",
            json={"cancel_at_cycle_end": 1 if at_cycle_end else 0},
        )

    # ── Reconciliation ───────────────────────────────────────────────────────

    def _list(self, path: str, *, since: int, until: int) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        skip = 0
        while True:
            page = self._request(
                "GET", path, params={"from": since, "to": until, "count": 100, "skip": skip}
            ).get("items", [])
            items.extend(page)
            if len(page) < 100:
                return items
            skip += 100

    def list_payments(self, *, since: int, until: int) -> list[dict[str, Any]]:
        return self._list("/payments", since=since, until=until)

    def list_refunds(self, *, since: int, until: int) -> list[dict[str, Any]]:
        return self._list("/refunds", since=since, until=until)


def get_razorpay_client() -> RazorpayClient | None:
    """None when keys are not configured. Callers answer 503, never proceed."""
    settings = get_settings()
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        return None
    return RazorpayClient(key_id=settings.razorpay_key_id, key_secret=settings.razorpay_key_secret)
