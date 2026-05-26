"""user_notification_preferences table

Revision ID: e1a2b3c4d5f6
Revises: 0b7f8c1d2e3f
Create Date: 2026-05-24 22:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e1a2b3c4d5f6"
down_revision: Union[str, Sequence[str], None] = "0b7f8c1d2e3f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = set(sa.inspect(bind).get_table_names())

    if "user_notification_preferences" not in existing:
        op.create_table(
            "user_notification_preferences",
            sa.Column("preference_id", sa.Uuid(), nullable=False),
            sa.Column("owner_user_id", sa.Uuid(), nullable=False),
            sa.Column("notification_channel", sa.String(length=8), server_default=sa.text("'none'"), nullable=False),
            sa.Column("morning_alert_enabled", sa.Boolean(), server_default=sa.text("false"), nullable=False),
            sa.Column("morning_alert_time", sa.Time(), server_default=sa.text("'06:00:00'"), nullable=False),
            sa.Column("dasha_alert_enabled", sa.Boolean(), server_default=sa.text("false"), nullable=False),
            sa.Column("pirantha_naal_alert_enabled", sa.Boolean(), server_default=sa.text("false"), nullable=False),
            sa.Column("fcm_device_token", sa.String(length=512), nullable=True),
            sa.Column("smart_silence_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.CheckConstraint(
                "notification_channel IN ('none','email','push','both')",
                name=op.f("ck_user_notification_preferences_channel_valid"),
            ),
            sa.ForeignKeyConstraint(
                ["owner_user_id"],
                ["users.user_id"],
                name=op.f("fk_user_notification_preferences_owner_user_id_users"),
            ),
            sa.PrimaryKeyConstraint("preference_id", name=op.f("pk_user_notification_preferences")),
            sa.UniqueConstraint("owner_user_id", name="uq_user_notification_preferences_owner"),
        )
        op.create_index(op.f("idx_user_notif_pref_owner"), "user_notification_preferences", ["owner_user_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    existing = set(sa.inspect(bind).get_table_names())

    if "user_notification_preferences" in existing:
        op.drop_index(op.f("idx_user_notif_pref_owner"), table_name="user_notification_preferences")
        op.drop_table("user_notification_preferences")
