"""Entitlements: trial, purchase and grant access rows (admin spec L1, D-05).

Additive and reversible. A new, empty table: nobody's access changes at
upgrade, because `limits_for_user` reads an active subscription first and an
empty table adds nothing to it.

The partial unique index allows one trial per account, ever.

Revision ID: xx7b8c9d0e1f
Revises: ww6a7b8c9d0e
Create Date: 2026-11-01 18:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "xx7b8c9d0e1f"
down_revision = "ww6a7b8c9d0e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "entitlements",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("key", sa.String(length=48), nullable=False),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column("source_id", sa.String(length=120), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_reason", sa.Text(), nullable=True),
        sa.Column("granted_by", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("source IN ('trial', 'purchase', 'grant')", name="ck_entitlements_source"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.user_id"], name="fk_entitlements_user_id_users", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["granted_by"], ["users.user_id"], name="fk_entitlements_granted_by_users", ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_entitlements"),
    )
    op.create_index("ix_entitlements_user_id_key", "entitlements", ["user_id", "key"], unique=False)
    op.create_index(
        "uq_entitlements_one_trial_per_user",
        "entitlements",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("source = 'trial'"),
    )


def downgrade() -> None:
    op.drop_index("uq_entitlements_one_trial_per_user", table_name="entitlements")
    op.drop_index("ix_entitlements_user_id_key", table_name="entitlements")
    op.drop_table("entitlements")
