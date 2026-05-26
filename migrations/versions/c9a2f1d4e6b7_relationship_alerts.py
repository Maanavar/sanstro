"""add relationship_alerts table

Revision ID: c9a2f1d4e6b7
Revises: a7d9e3c1b2f4
Create Date: 2026-05-23 01:55:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c9a2f1d4e6b7"
down_revision: Union[str, Sequence[str], None] = "a7d9e3c1b2f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "relationship_alerts",
        sa.Column("alert_id", sa.Uuid(), nullable=False),
        sa.Column("vault_id", sa.Uuid(), nullable=False),
        sa.Column("member_id", sa.Uuid(), nullable=False),
        sa.Column("trigger_planet", sa.String(length=16), nullable=False),
        sa.Column("trigger_type", sa.String(length=64), nullable=False),
        sa.Column("message_en", sa.String(length=500), nullable=False),
        sa.Column("message_ta", sa.String(length=500), nullable=False),
        sa.Column("alert_date", sa.Date(), nullable=False),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["member_id"], ["family_members.family_member_id"], name=op.f("fk_relationship_alerts_member_id_family_members")),
        sa.ForeignKeyConstraint(["vault_id"], ["family_vaults.family_vault_id"], name=op.f("fk_relationship_alerts_vault_id_family_vaults")),
        sa.PrimaryKeyConstraint("alert_id", name=op.f("pk_relationship_alerts")),
        sa.UniqueConstraint(
            "vault_id",
            "member_id",
            "trigger_planet",
            "trigger_type",
            "alert_date",
            name="uq_relationship_alerts_unique_trigger",
        ),
    )
    op.create_index("idx_relationship_alerts_vault_date", "relationship_alerts", ["vault_id", "alert_date"], unique=False)
    op.create_index("idx_relationship_alerts_member", "relationship_alerts", ["member_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_relationship_alerts_member", table_name="relationship_alerts")
    op.drop_index("idx_relationship_alerts_vault_date", table_name="relationship_alerts")
    op.drop_table("relationship_alerts")

