"""Payments: products, orders, payments, refunds, credits, mismatches (spec L1).

Additive and reversible. New tables, plus nullable/defaulted columns on
`subscriptions` and `webhook_events`; no existing row changes meaning.

Seeds the launch catalogue (owner decisions 2026-11-01, ARC-05/ARC-06/item 9).
Prices are data from here on (D-08): change them with an UPDATE, not a deploy.
Only the two Premium plans are active. The report SKUs and the Ask top-up are
seeded inactive because there is nothing to deliver yet (no report
deliverables; Ask credit spending is L7) — taking money for them would be
selling nothing. `razorpay_plan_id` is NULL until the owner creates the plans
in the Razorpay dashboard; subscription checkout answers 503 until then.

Downgrade drops the new tables and columns. Rows in them go with them, which is
only acceptable while no real payment has been taken — after launch, a
downgrade past this revision needs an export first.

Revision ID: yy8c9d0e1f2a
Revises: xx7b8c9d0e1f
Create Date: 2026-11-01 20:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "yy8c9d0e1f2a"
down_revision = "xx7b8c9d0e1f"
branch_labels = None
depends_on = None

_TS = dict(server_default=sa.text("now()"), nullable=False)

_PRODUCTS = [
    # sku, kind, name_en, name_ta, paise, period, entitlement_keys, credit_grants, active
    ("premium_monthly", "subscription", "Premium, monthly", "பிரீமியம் — மாதச் சந்தா", 14900, "month",
     ["premium"], {}, True),
    ("premium_annual", "subscription", "Premium, yearly", "பிரீமியம் — ஆண்டுச் சந்தா", 99900, "year",
     ["premium"], {}, True),
    ("jadhagam_report", "one_time", "Jadhagam report", "ஜாதக அறிக்கை", 9900, None,
     [], {"jadhagam_report": 1}, False),
    ("porutham_report", "one_time", "Porutham report", "பொருத்த அறிக்கை", 9900, None,
     [], {"porutham_report": 1}, False),
    ("ask_topup_10", "one_time", "Ask Vinaadi: 10 more questions", "விநாடியிடம் கேளுங்கள்: மேலும் 10 கேள்விகள்", 4900, None,
     [], {"ask_question": 10}, False),
]


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("sku", sa.String(length=64), nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("name_en", sa.Text(), nullable=False),
        sa.Column("name_ta", sa.Text(), nullable=False),
        sa.Column("price_inr_paise", sa.Integer(), nullable=False),
        sa.Column("billing_period", sa.String(length=8), nullable=True),
        sa.Column("entitlement_keys", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("credit_grants", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("razorpay_plan_id", sa.String(length=64), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), **_TS),
        sa.Column("updated_at", sa.DateTime(timezone=True), **_TS),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("kind IN ('subscription', 'one_time')", name="ck_products_kind"),
        sa.CheckConstraint(
            "billing_period IS NULL OR billing_period IN ('month', 'year')", name="ck_products_billing_period"
        ),
        sa.CheckConstraint("price_inr_paise > 0", name="ck_products_price_positive"),
        sa.PrimaryKeyConstraint("sku", name="pk_products"),
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("sku", sa.String(length=64), nullable=False),
        sa.Column("provider", sa.String(length=16), nullable=False),
        sa.Column("provider_order_id", sa.String(length=64), nullable=False),
        sa.Column("amount_paise", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("tax_paise", sa.Integer(), nullable=True),
        sa.Column("invoice_number", sa.String(length=64), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **_TS),
        sa.Column("updated_at", sa.DateTime(timezone=True), **_TS),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('created', 'paid', 'failed', 'refunded', 'partially_refunded')", name="ck_orders_status"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], name="fk_orders_user_id_users", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["sku"], ["products.sku"], name="fk_orders_sku_products"),
        sa.PrimaryKeyConstraint("id", name="pk_orders"),
        sa.UniqueConstraint("provider_order_id", name="uq_orders_provider_order_id"),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"], unique=False)

    op.create_table(
        "payments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("order_id", sa.Uuid(), nullable=True),
        sa.Column("subscription_id", sa.Uuid(), nullable=True),
        sa.Column("provider_payment_id", sa.String(length=64), nullable=False),
        sa.Column("method", sa.String(length=16), nullable=False),
        sa.Column("amount_paise", sa.Integer(), nullable=False),
        sa.Column("fee_paise", sa.Integer(), nullable=True),
        sa.Column("tax_on_fee_paise", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **_TS),
        sa.Column("updated_at", sa.DateTime(timezone=True), **_TS),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("order_id IS NOT NULL OR subscription_id IS NOT NULL", name="ck_payments_has_parent"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], name="fk_payments_order_id_orders", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["subscriptions.subscription_id"],
            name="fk_payments_subscription_id_subscriptions",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_payments"),
        sa.UniqueConstraint("provider_payment_id", name="uq_payments_provider_payment_id"),
    )

    op.create_table(
        "refunds",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("provider_refund_id", sa.String(length=64), nullable=False),
        sa.Column("payment_id", sa.Uuid(), nullable=True),
        sa.Column("provider_payment_id", sa.String(length=64), nullable=False),
        sa.Column("amount_paise", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), **_TS),
        sa.Column("updated_at", sa.DateTime(timezone=True), **_TS),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["payment_id"], ["payments.id"], name="fk_refunds_payment_id_payments", ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_refunds"),
        sa.UniqueConstraint("provider_refund_id", name="uq_refunds_provider_refund_id"),
    )

    op.create_table(
        "credit_ledger",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("credit_key", sa.String(length=32), nullable=False),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column("source_id", sa.String(length=120), nullable=True),
        sa.Column("idempotency_key", sa.String(length=160), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), **_TS),
        sa.CheckConstraint("delta <> 0", name="ck_credit_ledger_delta_nonzero"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.user_id"], name="fk_credit_ledger_user_id_users", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_credit_ledger"),
        sa.UniqueConstraint("idempotency_key", name="uq_credit_ledger_idempotency_key"),
    )
    op.create_index(
        "ix_credit_ledger_user_id_credit_key", "credit_ledger", ["user_id", "credit_key"], unique=False
    )

    op.create_table(
        "payment_mismatches",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("provider_ref", sa.String(length=64), nullable=False),
        sa.Column("detail", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("auto_resolved", sa.Boolean(), nullable=False),
        sa.Column("found_at", sa.DateTime(timezone=True), **_TS),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_payment_mismatches"),
    )
    op.create_index(
        "uq_payment_mismatches_kind_ref", "payment_mismatches", ["kind", "provider_ref"], unique=True
    )

    op.add_column("subscriptions", sa.Column("provider_status", sa.String(length=32), nullable=True))
    op.add_column("subscriptions", sa.Column("sku", sa.String(length=64), nullable=True))
    op.add_column(
        "subscriptions",
        sa.Column("cancel_at_period_end", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column("webhook_events", sa.Column("signature_valid", sa.Boolean(), nullable=True))
    op.add_column("webhook_events", sa.Column("error", sa.Text(), nullable=True))

    products = sa.table(
        "products",
        sa.column("sku", sa.String),
        sa.column("kind", sa.String),
        sa.column("name_en", sa.Text),
        sa.column("name_ta", sa.Text),
        sa.column("price_inr_paise", sa.Integer),
        sa.column("billing_period", sa.String),
        sa.column("entitlement_keys", postgresql.JSONB),
        sa.column("credit_grants", postgresql.JSONB),
        sa.column("active", sa.Boolean),
    )
    op.bulk_insert(
        products,
        [
            {
                "sku": sku,
                "kind": kind,
                "name_en": name_en,
                "name_ta": name_ta,
                "price_inr_paise": paise,
                "billing_period": period,
                "entitlement_keys": keys,
                "credit_grants": grants,
                "active": active,
            }
            for sku, kind, name_en, name_ta, paise, period, keys, grants, active in _PRODUCTS
        ],
    )


def downgrade() -> None:
    op.drop_column("webhook_events", "error")
    op.drop_column("webhook_events", "signature_valid")
    op.drop_column("subscriptions", "cancel_at_period_end")
    op.drop_column("subscriptions", "sku")
    op.drop_column("subscriptions", "provider_status")
    op.drop_index("uq_payment_mismatches_kind_ref", table_name="payment_mismatches")
    op.drop_table("payment_mismatches")
    op.drop_index("ix_credit_ledger_user_id_credit_key", table_name="credit_ledger")
    op.drop_table("credit_ledger")
    op.drop_table("refunds")
    op.drop_table("payments")
    op.drop_index("ix_orders_user_id", table_name="orders")
    op.drop_table("orders")
    op.drop_table("products")
