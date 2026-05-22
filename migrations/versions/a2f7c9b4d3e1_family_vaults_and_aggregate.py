"""family vaults and aggregate scores

Revision ID: a2f7c9b4d3e1
Revises: 83645c701aad
Create Date: 2026-05-21 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a2f7c9b4d3e1"
down_revision: Union[str, Sequence[str], None] = "83645c701aad"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "family_vaults",
        sa.Column("family_vault_id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("default_language", sa.String(length=16), server_default=sa.text("'ta-en'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.user_id"], name=op.f("fk_family_vaults_owner_user_id_users")),
        sa.PrimaryKeyConstraint("family_vault_id", name=op.f("pk_family_vaults")),
    )
    op.create_index("idx_family_vault_owner", "family_vaults", ["owner_user_id"], unique=False)

    with op.batch_alter_table("family_members") as batch_op:
        batch_op.add_column(sa.Column("family_vault_id", sa.Uuid(), nullable=True))
        batch_op.add_column(sa.Column("gender_for_traditional_rules", sa.String(length=32), server_default=sa.text("'not_specified'"), nullable=False))
        batch_op.add_column(sa.Column("date_of_birth_local", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("is_minor", sa.Boolean(), server_default=sa.text("false"), nullable=False))
        batch_op.add_column(sa.Column("managed_by_user_id", sa.Uuid(), nullable=True))
        batch_op.add_column(sa.Column("consent_status", sa.String(length=32), server_default=sa.text("'owner_managed'"), nullable=False))
        batch_op.add_column(sa.Column("member_weight", sa.Numeric(precision=5, scale=2), server_default=sa.text("1.00"), nullable=False))
        batch_op.create_foreign_key(
            op.f("fk_family_members_family_vault_id_family_vaults"),
            "family_vaults",
            ["family_vault_id"],
            ["family_vault_id"],
        )
        batch_op.create_foreign_key(
            op.f("fk_family_members_managed_by_user_id_users"),
            "users",
            ["managed_by_user_id"],
            ["user_id"],
        )

    op.create_index("idx_family_members_vault", "family_members", ["family_vault_id"], unique=False)
    op.create_index("idx_family_members_owner", "family_members", ["owner_user_id"], unique=False)

    op.create_table(
        "family_daily_scores",
        sa.Column("family_daily_score_id", sa.Uuid(), nullable=False),
        sa.Column("family_vault_id", sa.Uuid(), nullable=False),
        sa.Column("date_local", sa.Date(), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        sa.Column("family_score", sa.Integer(), nullable=False),
        sa.Column("family_label", sa.String(length=32), nullable=False),
        sa.Column("aggregate_breakdown", sa.JSON(), nullable=False),
        sa.Column("member_scores", sa.JSON(), nullable=False),
        sa.Column("best_family_windows", sa.JSON(), server_default=sa.text("'[]'"), nullable=False),
        sa.Column("avoid_for_family_decisions", sa.JSON(), server_default=sa.text("'[]'"), nullable=False),
        sa.Column("support_need_index", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("decision_readiness_index", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["family_vault_id"],
            ["family_vaults.family_vault_id"],
            name=op.f("fk_family_daily_scores_family_vault_id_family_vaults"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("family_daily_score_id", name=op.f("pk_family_daily_scores")),
        sa.UniqueConstraint("family_vault_id", "date_local", "timezone", name="uq_family_daily_scores_vault_date_tz"),
    )
    op.create_index("idx_family_daily_scores_vault_date", "family_daily_scores", ["family_vault_id", "date_local"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_family_daily_scores_vault_date", table_name="family_daily_scores")
    op.drop_table("family_daily_scores")

    op.drop_index("idx_family_members_owner", table_name="family_members")
    op.drop_index("idx_family_members_vault", table_name="family_members")
    with op.batch_alter_table("family_members") as batch_op:
        batch_op.drop_constraint(op.f("fk_family_members_managed_by_user_id_users"), type_="foreignkey")
        batch_op.drop_constraint(op.f("fk_family_members_family_vault_id_family_vaults"), type_="foreignkey")
        batch_op.drop_column("member_weight")
        batch_op.drop_column("consent_status")
        batch_op.drop_column("managed_by_user_id")
        batch_op.drop_column("is_minor")
        batch_op.drop_column("date_of_birth_local")
        batch_op.drop_column("gender_for_traditional_rules")
        batch_op.drop_column("family_vault_id")

    op.drop_index("idx_family_vault_owner", table_name="family_vaults")
    op.drop_table("family_vaults")
