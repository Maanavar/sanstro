"""Delivered reports — the thing a report credit is spent on (`reports`).

Additive and reversible: one new table. The rendered PDF lives in the row
because a bought report must not change or break when the chart it was built
from is edited or deleted, so `chart_id`/`partner_chart_id` are SET NULL and
informational.

This migration does not change `products.active`. Turning a report SKU on is
its own reviewed change (ARC-14).

The check constraints are named bare (`kind`, not `ck_reports_kind`): the
metadata's `ck` convention is `ck_%(table_name)s_%(constraint_name)s`, so a
name that already carries the prefix is emitted as
`ck_reports_ck_reports_kind` and the database then disagrees with the model
about what the constraint is called.

Revision ID: de4f5a6b7c8d
Revises: cd3e4f5a6b7c
Create Date: 2026-11-04 15:30:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "de4f5a6b7c8d"
down_revision = "cd3e4f5a6b7c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("lang", sa.String(length=2), nullable=False, server_default="en"),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column("credit_spend_key", sa.String(length=160), nullable=True),
        sa.Column("chart_id", sa.Uuid(), nullable=True),
        sa.Column("partner_chart_id", sa.Uuid(), nullable=True),
        sa.Column("as_of_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("calculation_version", sa.String(length=64), nullable=False),
        sa.Column("pdf", sa.LargeBinary(), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("download_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_downloaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("kind IN ('jadhagam', 'porutham')", name="kind"),
        sa.CheckConstraint("source IN ('included', 'credit')", name="source"),
        sa.CheckConstraint("byte_size > 0", name="byte_size_positive"),
        sa.CheckConstraint(
            "(source = 'credit') = (credit_spend_key IS NOT NULL)",
            name="credit_spend_key_matches_source",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.user_id"], name="fk_reports_user_id_users", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["chart_id"], ["charts.chart_id"], name="fk_reports_chart_id_charts", ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["partner_chart_id"],
            ["charts.chart_id"],
            name="fk_reports_partner_chart_id_charts",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_reports"),
    )
    op.create_index("ix_reports_user_id_created_at", "reports", ["user_id", "created_at"])
    op.create_index("ix_reports_user_id_kind_source", "reports", ["user_id", "kind", "source"])


def downgrade() -> None:
    op.drop_index("ix_reports_user_id_kind_source", table_name="reports")
    op.drop_index("ix_reports_user_id_created_at", table_name="reports")
    op.drop_table("reports")
