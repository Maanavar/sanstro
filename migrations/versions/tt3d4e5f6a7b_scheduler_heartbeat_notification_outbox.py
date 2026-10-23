"""Dedicated scheduler heartbeat and durable notification outbox (A09/A10).

Additive and reversible. Existing notification rows deliberately retain NULL
logical keys/expiries and receive no delivery rows: replaying historical
``queued``/``failed`` records would turn an infrastructure rollout into a user-
visible resend. Only intents created by the new application path enter the
outbox.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "tt3d4e5f6a7b"
down_revision = "ss2c3d4e5f6a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "scheduler_heartbeats",
        sa.Column("scheduler_name", sa.String(length=64), nullable=False),
        sa.Column("instance_id", sa.Uuid(), nullable=False),
        sa.Column("is_leader", sa.Boolean(), nullable=False),
        sa.Column("leader_backend_pid", sa.Integer(), nullable=True),
        sa.Column("last_successful_cycle_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("scheduler_name", name="pk_scheduler_heartbeats"),
    )

    op.add_column("notifications", sa.Column("logical_key", sa.Text(), nullable=True))
    op.add_column("notifications", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))
    op.create_unique_constraint("uq_notifications_logical_key", "notifications", ["logical_key"])

    op.create_table(
        "notification_deliveries",
        sa.Column("delivery_id", sa.Uuid(), nullable=False),
        sa.Column("notification_id", sa.Uuid(), nullable=False),
        sa.Column("channel", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=32), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("attempt_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("claimed_by", sa.String(length=128), nullable=True),
        sa.Column("claim_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("provider_reference", sa.Text(), nullable=True),
        sa.Column("last_error_code", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("attempt_count >= 0", name="ck_notification_deliveries_attempt_count_nonnegative"),
        sa.CheckConstraint("channel IN ('push', 'email')", name="ck_notification_deliveries_channel_supported"),
        sa.CheckConstraint(
            "status IN ('pending', 'claimed', 'retry', 'delivered', 'expired', "
            "'suppressed', 'failed_permanent', 'exhausted')",
            name="ck_notification_deliveries_status_supported",
        ),
        sa.ForeignKeyConstraint(
            ["notification_id"],
            ["notifications.notification_id"],
            name="fk_notification_deliveries_notification_id_notifications",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("delivery_id", name="pk_notification_deliveries"),
        sa.UniqueConstraint(
            "notification_id",
            "channel",
            name="uq_notification_deliveries_intent_channel",
        ),
    )
    op.create_index(
        "ix_notification_deliveries_eligible",
        "notification_deliveries",
        ["status", "next_attempt_at"],
        unique=False,
    )
    op.create_index(
        "ix_notification_deliveries_claim_expiry",
        "notification_deliveries",
        ["status", "claim_expires_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_notification_deliveries_claim_expiry", table_name="notification_deliveries")
    op.drop_index("ix_notification_deliveries_eligible", table_name="notification_deliveries")
    op.drop_table("notification_deliveries")
    op.drop_constraint("uq_notifications_logical_key", "notifications", type_="unique")
    op.drop_column("notifications", "expires_at")
    op.drop_column("notifications", "logical_key")
    op.drop_table("scheduler_heartbeats")
