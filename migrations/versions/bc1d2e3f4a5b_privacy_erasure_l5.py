"""Erasure (spec L5): tombstones, and subscriptions outlive the account.

- `erasure_tombstones`: one row per erased account. No foreign key: the row
  exists to outlive the account, and a restored backup replays it.
- `subscriptions.user_id` becomes nullable with ON DELETE SET NULL (was NOT
  NULL, CASCADE). A subscription is the accounting record its payments point
  at, and `payments.ck_payments_has_parent` needs an order or a subscription:
  with CASCADE, deleting a user who had paid through a subscription nulled the
  payment's only parent and the whole delete failed on that check. Orders were
  already SET NULL; subscriptions now match.

Reversible. The downgrade refuses, with the count, while any subscription has
no user (an erased account's record): restoring NOT NULL would need those rows
deleted, which is a decision about accounting records, not a migration's.

Revision ID: bc1d2e3f4a5b
Revises: ab0f1a2b3c4d
Create Date: 2026-11-02 10:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "bc1d2e3f4a5b"
down_revision = "ab0f1a2b3c4d"
branch_labels = None
depends_on = None


def _set_subscription_user_fk(ondelete: str) -> None:
    insp = sa.inspect(op.get_bind())
    for fk in insp.get_foreign_keys("subscriptions"):
        if fk["constrained_columns"] == ["user_id"]:
            op.drop_constraint(fk["name"], "subscriptions", type_="foreignkey")
    op.create_foreign_key(
        "fk_subscriptions_user_id_users", "subscriptions", "users", ["user_id"], ["user_id"], ondelete=ondelete
    )


def upgrade() -> None:
    op.create_table(
        "erasure_tombstones",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("via", sa.String(length=8), nullable=False),
        sa.Column("erased_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("via IN ('self', 'admin')", name=op.f("ck_erasure_tombstones_via")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_erasure_tombstones")),
        sa.UniqueConstraint("user_id", name=op.f("uq_erasure_tombstones_user_id")),
    )
    op.alter_column("subscriptions", "user_id", existing_type=sa.Uuid(), nullable=True)
    _set_subscription_user_fk("SET NULL")


def downgrade() -> None:
    detached = op.get_bind().execute(sa.text("SELECT count(*) FROM subscriptions WHERE user_id IS NULL")).scalar_one()
    if detached:
        raise RuntimeError(
            f"{detached} subscription rows belong to erased accounts; NOT NULL would reject them. "
            "Decide what happens to those accounting records first."
        )
    _set_subscription_user_fk("CASCADE")
    op.alter_column("subscriptions", "user_id", existing_type=sa.Uuid(), nullable=False)
    op.drop_table("erasure_tombstones")
