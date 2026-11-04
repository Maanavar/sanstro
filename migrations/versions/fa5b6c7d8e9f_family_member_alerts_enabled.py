"""Per-member family alert opt-in (audit F5, 2026-11-03).

Adds `family_members.alerts_enabled`, default FALSE. Unlike the user's own
Chandrashtamam alert (ef4a5b6c7d8e, default true), a family member is a
separate data principal whose details were entered to compute charts; alerting
about them is a further use the user opts into person by person (decision D3,
docs/NOTIFICATIONS_AND_NEW_FEATURE_UI_AUDIT_2026-11-03.md). Opt-in also bounds
noise: five members on by default would be ~65 extra pushes a year.

Delivery of the resulting digest still needs the owner's "updates" consent
(notification_dispatch_service.NEEDS_UPDATES_CONSENT["FAMILY_DIGEST"]) and a
channel other than "none" for push or email.

The column is new and holds no data from before this revision, so the
downgrade drops it.

Revision ID: fa5b6c7d8e9f
Revises: ef4a5b6c7d8e
Create Date: 2026-11-03 21:30:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "fa5b6c7d8e9f"
down_revision = "ef4a5b6c7d8e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "family_members",
        sa.Column(
            "alerts_enabled",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("family_members", "alerts_enabled")
