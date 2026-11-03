"""Chandrashtamam alert preference (audit F4, 2026-11-03).

Adds `user_notification_preferences.chandrashtama_alert_enabled`, default
TRUE. It does not opt anybody into delivery by itself: every alert still needs
the "updates" consent (notification_dispatch_service.NEEDS_UPDATES_CONSENT)
and a channel other than "none" for push or email. The default is on because a
user who has allowed astro alerts has asked for exactly this one, at about one
alert per 27 days (owner delegation, docs/NOTIFICATIONS_AND_NEW_FEATURE_UI_AUDIT_2026-11-03.md).

The column is new and holds no data from before this revision, so the
downgrade drops it.

Revision ID: ef4a5b6c7d8e
Revises: de3f4a5b6c7d
Create Date: 2026-11-03 20:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "ef4a5b6c7d8e"
down_revision = "de3f4a5b6c7d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_notification_preferences",
        sa.Column(
            "chandrashtama_alert_enabled",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("user_notification_preferences", "chandrashtama_alert_enabled")
