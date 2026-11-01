"""Web payments through Razorpay (admin spec L1, D-04).

Checkout creates the Razorpay order or subscription server-side, at the
catalogue price; the browser only opens Razorpay's checkout with the id it is
given. Access is granted by the webhook, or by `/payments/confirm` fetching the
order from Razorpay — never by the browser's word (app/services/payment_service.py).
"""
from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.payment import Order
from app.models.user import User
from app.models.webhook_event import WebhookEvent
from app.services import payment_service
from app.services.kill_switch import raise_if_paused
from app.services.razorpay_client import (
    RazorpayClient,
    RazorpayError,
    get_razorpay_client,
    verify_order_payment_signature,
    verify_subscription_payment_signature,
    verify_webhook_signature,
)

router = APIRouter(prefix="/payments", tags=["payments"])
_logger = logging.getLogger(__name__)


class _Camel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class ProductOut(_Camel):
    sku: str
    kind: Literal["subscription", "one_time"]
    name_en: str = Field(alias="nameEn")
    name_ta: str = Field(alias="nameTa")
    price_inr_paise: int = Field(alias="priceInrPaise")
    billing_period: Literal["month", "year"] | None = Field(alias="billingPeriod")
    #: Subscriptions only: false until the plan exists in Razorpay.
    available: bool


class CheckoutRequest(_Camel):
    #: The only thing the client chooses. No amount is accepted; one sent is ignored.
    sku: str


class CheckoutResponse(_Camel):
    provider: Literal["razorpay"]
    key_id: str = Field(alias="keyId")
    sku: str
    name_en: str = Field(alias="nameEn")
    name_ta: str = Field(alias="nameTa")
    order_id: str | None = Field(default=None, alias="orderId")
    subscription_id: str | None = Field(default=None, alias="subscriptionId")
    amount_paise: int | None = Field(default=None, alias="amountPaise")
    currency: str | None = None


class ConfirmRequest(_Camel):
    """Razorpay Checkout's success-handler fields, as Razorpay names them."""

    razorpay_payment_id: str
    razorpay_signature: str
    razorpay_order_id: str | None = None
    razorpay_subscription_id: str | None = None


class ConfirmResponse(_Camel):
    #: paid / active = access granted; processing = wait for the webhook.
    status: Literal["paid", "active", "processing"]


class CancelResponse(_Camel):
    cancel_at_period_end: bool = Field(alias="cancelAtPeriodEnd")
    current_period_end: datetime | None = Field(alias="currentPeriodEnd")


def _client() -> RazorpayClient:
    client = get_razorpay_client()
    if client is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Payments are not available yet.")
    return client


def _checkout_error(exc: payment_service.CheckoutError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


def _provider_error(exc: RazorpayError) -> HTTPException:
    _logger.warning("razorpay_call_failed %s", exc)
    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="The payment provider did not answer. Nothing has been charged; please try again.",
    )


@router.get("/products", response_model=list[ProductOut], summary="What is on sale, at what price")
def list_products(session: Session = Depends(get_db)) -> list[ProductOut]:
    return [
        ProductOut(
            sku=p.sku,
            kind=p.kind,  # type: ignore[arg-type]
            nameEn=p.name_en,
            nameTa=p.name_ta,
            priceInrPaise=p.price_inr_paise,
            billingPeriod=p.billing_period,  # type: ignore[arg-type]
            available=p.kind == "one_time" or bool(p.razorpay_plan_id),
        )
        for p in payment_service.active_products(session)
    ]


@router.post("/checkout/order", response_model=CheckoutResponse, summary="Start a one-time purchase")
def checkout_order(
    body: CheckoutRequest,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CheckoutResponse:
    raise_if_paused("enable_payments_checkout")
    client = _client()
    try:
        started = payment_service.start_order_checkout(session, user, body.sku, client)
    except payment_service.CheckoutError as exc:
        raise _checkout_error(exc) from exc
    except RazorpayError as exc:
        raise _provider_error(exc) from exc
    return CheckoutResponse(keyId=client.key_id, **started)


@router.post("/checkout/subscription", response_model=CheckoutResponse, summary="Start a Premium subscription")
def checkout_subscription(
    body: CheckoutRequest,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CheckoutResponse:
    raise_if_paused("enable_payments_checkout")
    client = _client()
    try:
        started = payment_service.start_subscription_checkout(session, user, body.sku, client)
    except payment_service.CheckoutError as exc:
        raise _checkout_error(exc) from exc
    except RazorpayError as exc:
        raise _provider_error(exc) from exc
    return CheckoutResponse(keyId=client.key_id, **started)


@router.post("/confirm", response_model=ConfirmResponse, summary="Report Razorpay Checkout's success callback")
def confirm_payment(
    body: ConfirmRequest,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ConfirmResponse:
    """Not gated by the checkout kill switch: money already taken must still count."""
    client = _client()
    if body.razorpay_order_id:
        valid = verify_order_payment_signature(
            body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature, client.key_secret
        )
    elif body.razorpay_subscription_id:
        valid = verify_subscription_payment_signature(
            body.razorpay_subscription_id, body.razorpay_payment_id, body.razorpay_signature, client.key_secret
        )
    else:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Order or subscription id required.")
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment signature did not match.")
    try:
        if body.razorpay_order_id:
            outcome = payment_service.confirm_order(
                session, user, order_id=body.razorpay_order_id, payment_id=body.razorpay_payment_id, client=client
            )
        else:
            outcome = payment_service.confirm_subscription(
                session, user, subscription_id=body.razorpay_subscription_id or "", client=client
            )
    except payment_service.CheckoutError as exc:
        raise _checkout_error(exc) from exc
    except RazorpayError:
        # The webhook will settle it; the client shows "processing" meanwhile.
        outcome = "processing"
    return ConfirmResponse(status=outcome)  # type: ignore[arg-type]


@router.get("/orders/{order_id}", response_model=ConfirmResponse, summary="Has this order been paid?")
def order_status(
    order_id: str,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ConfirmResponse:
    order = (
        session.query(Order)
        .filter(Order.provider_order_id == order_id, Order.user_id == user.user_id)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return ConfirmResponse(status="paid" if order.status in ("paid", "refunded", "partially_refunded") else "processing")


@router.post("/subscription/cancel", response_model=CancelResponse, summary="Stop renewing Premium")
def cancel_subscription(
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CancelResponse:
    client = _client()
    try:
        sub = payment_service.cancel_subscription(session, user, client)
    except payment_service.CheckoutError as exc:
        raise _checkout_error(exc) from exc
    except RazorpayError as exc:
        raise _provider_error(exc) from exc
    return CancelResponse(cancelAtPeriodEnd=sub.cancel_at_period_end, currentPeriodEnd=sub.current_period_end)


# ── Webhook ──────────────────────────────────────────────────────────────────


def _reject(
    session: Session, *, claimed_id: str | None, event_type: str, reason: str, signature_valid: bool
) -> JSONResponse:
    """Store the refused request, then answer 400.

    Returned, not raised: raising would roll the session back and lose the
    record. The row's event_id is generated, never the claimed one, so a forged
    request cannot occupy the id of a real event that arrives later.
    """
    session.add(
        WebhookEvent(
            provider=payment_service.PROVIDER,
            event_id=f"rejected:{uuid4()}",
            event_type=event_type[:64] or "unknown",
            status="rejected",
            signature_valid=signature_valid,
            error=reason,
            processed_at=datetime.now(UTC),
            payload={"claimed_event_id": (claimed_id or "")[:64]},
        )
    )
    session.flush()
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": reason})


@router.post("/razorpay/webhook", summary="Razorpay events (signed)")
async def razorpay_webhook(
    request: Request,
    session: Session = Depends(get_db),
    x_razorpay_signature: str | None = Header(default=None),
    x_razorpay_event_id: str | None = Header(default=None),
) -> Any:
    secret = get_settings().razorpay_webhook_secret
    if not secret:
        # Never "accept unsigned": no secret, no webhook.
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Webhook not configured.")

    raw = await request.body()
    if not verify_webhook_signature(raw, x_razorpay_signature, secret):
        _logger.warning("razorpay_webhook_bad_signature claimed_id=%s", (x_razorpay_event_id or "")[:64])
        try:
            claimed_type = str(json.loads(raw).get("event") or "")
        except (ValueError, AttributeError):
            claimed_type = ""
        return _reject(
            session,
            claimed_id=x_razorpay_event_id,
            event_type=claimed_type,
            reason="bad_signature",
            signature_valid=False,
        )

    try:
        body: dict[str, Any] = json.loads(raw)
    except ValueError:
        return _reject(
            session, claimed_id=x_razorpay_event_id, event_type="", reason="unparseable", signature_valid=True
        )
    if not x_razorpay_event_id:
        return _reject(
            session,
            claimed_id=None,
            event_type=str(body.get("event") or ""),
            reason="missing_event_id",
            signature_valid=True,
        )

    inbox = WebhookEvent(
        provider=payment_service.PROVIDER,
        event_id=x_razorpay_event_id,
        event_type=str(body.get("event") or "unknown")[:64],
        event_timestamp=payment_service._ts(body.get("created_at")),
        status="processing",
        signature_valid=True,
        payload=payment_service.minimal_payload(body),
    )
    try:
        with session.begin_nested():
            session.add(inbox)
            session.flush()
    except IntegrityError:
        # Seen before (Razorpay retries reuse the id). Granted once already.
        return {"status": "duplicate"}

    try:
        disposition, user_id = payment_service.process_event(session, body)
    except Exception:
        # Roll the whole event back (inbox row included) and let Razorpay
        # retry; reconciliation catches it if the retries run out (ARC-04).
        _logger.exception("razorpay_webhook_processing_failed event_id=%s", x_razorpay_event_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Processing failed.") from None

    inbox.status = disposition
    inbox.resolved_user_id = user_id
    inbox.processed_at = datetime.now(UTC)
    return {"status": disposition}
