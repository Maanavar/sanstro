"""Products, orders, payments, refunds, credits (admin spec L1, D-04, D-08).

Money rows (orders, payments, refunds) are accounting records: the user FK is
SET NULL, never CASCADE, so erasing an account leaves the record of the money
with its personal link removed (spec L5). Access rows (credit_ledger) follow the
user and go with them.
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

#: Credit keys a product can grant and a feature can spend (ARC-02).
CREDIT_KEYS = ("ask_question", "jadhagam_report", "porutham_report")


class Product(TimestampMixin, Base):
    """A thing for sale. Prices are data, not code (D-08): changing one is a row
    update, and checkout always reads the amount from here, never from the client."""

    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("kind IN ('subscription', 'one_time')", name="kind"),
        CheckConstraint("billing_period IS NULL OR billing_period IN ('month', 'year')", name="billing_period"),
        CheckConstraint("price_inr_paise > 0", name="price_positive"),
    )

    sku: Mapped[str] = mapped_column(String(64), primary_key=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    name_en: Mapped[str] = mapped_column(Text, nullable=False)
    name_ta: Mapped[str] = mapped_column(Text, nullable=False)
    price_inr_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    billing_period: Mapped[str | None] = mapped_column(String(8), nullable=True)
    #: Time-ranged access a subscription grants, e.g. ["premium"].
    entitlement_keys: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    #: What a one-time purchase adds to the credit ledger, e.g. {"ask_question": 10}.
    credit_grants: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    #: The plan created in the Razorpay dashboard (subscriptions only).
    razorpay_plan_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    #: Off = not sold. A product with nothing to deliver yet stays off.
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class Order(TimestampMixin, Base):
    """One one-time purchase attempt, mirrored from a Razorpay order."""

    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint(
            "status IN ('created', 'paid', 'failed', 'refunded', 'partially_refunded')", name="status"
        ),
        Index("ix_orders_user_id", "user_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    sku: Mapped[str] = mapped_column(ForeignKey("products.sku"), nullable=False)
    provider: Mapped[str] = mapped_column(String(16), nullable=False, default="razorpay")
    provider_order_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    amount_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="created")
    #: Filled when the CA settles the invoice format (spec §10.4).
    tax_paise: Mapped[int | None] = mapped_column(Integer, nullable=True)
    invoice_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Payment(TimestampMixin, Base):
    """A captured or failed payment, from a one-time order or a subscription charge."""

    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("order_id IS NOT NULL OR subscription_id IS NOT NULL", name="has_parent"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    order_id: Mapped[UUID | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    subscription_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("subscriptions.subscription_id", ondelete="SET NULL"), nullable=True
    )
    provider_payment_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    #: upi | card | netbanking | wallet | other
    method: Mapped[str] = mapped_column(String(16), nullable=False, default="other")
    amount_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    #: Gateway fee and the GST on it, for net revenue (spec §8).
    fee_paise: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tax_on_fee_paise: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(24), nullable=False)
    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Refund(TimestampMixin, Base):
    __tablename__ = "refunds"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    provider_refund_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    payment_id: Mapped[UUID | None] = mapped_column(ForeignKey("payments.id", ondelete="SET NULL"), nullable=True)
    provider_payment_id: Mapped[str] = mapped_column(String(64), nullable=False)
    amount_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    #: pending | processed | failed
    status: Mapped[str] = mapped_column(String(16), nullable=False)


class CreditLedgerEntry(Base):
    """+n / −n of a countable right (ARC-02). Balance = sum of `delta`.

    `idempotency_key` is unique, so a retried grant or spend lands once: an
    order grants under "order:<id>", its refund reverses under "refund:<id>".
    """

    __tablename__ = "credit_ledger"
    __table_args__ = (
        CheckConstraint("delta <> 0", name="delta_nonzero"),
        Index("ix_credit_ledger_user_id_credit_key", "user_id", "credit_key"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    credit_key: Mapped[str] = mapped_column(String(32), nullable=False)
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    #: purchase | refund | spend | return (a spend given back) | grant
    source: Mapped[str] = mapped_column(String(16), nullable=False)
    source_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    idempotency_key: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class PaymentMismatch(Base):
    """Something the nightly reconciliation found that local rows do not explain.

    The console lists open ones on the Payments page (spec L1; the L+30 home
    queue reads the same rows).
    """

    __tablename__ = "payment_mismatches"
    __table_args__ = (
        # One open row per finding, however many nights it is seen.
        Index("uq_payment_mismatches_kind_ref", "kind", "provider_ref", unique=True),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    #: payment_missing | payment_status | refund_missing | subscription_status
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_ref: Mapped[str] = mapped_column(String(64), nullable=False)
    detail: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    #: True when reconciliation applied the fix itself (a lost webhook for a
    #: known order); still listed, so someone knows a webhook went missing.
    auto_resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    found_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
