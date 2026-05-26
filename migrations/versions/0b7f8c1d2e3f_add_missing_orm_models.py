"""add missing orm models

Revision ID: 0b7f8c1d2e3f
Revises: 91e2c6a7b1d0
Create Date: 2026-05-24 20:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "0b7f8c1d2e3f"
down_revision: Union[str, Sequence[str], None] = "91e2c6a7b1d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    existing = set(sa.inspect(bind).get_table_names())

    if "varga_positions" not in existing:
        op.create_table(
            "varga_positions",
            sa.Column("varga_position_id", sa.Uuid(), nullable=False),
            sa.Column("chart_id", sa.Uuid(), nullable=False),
            sa.Column("varga_code", sa.String(length=16), nullable=False),
            sa.Column("graha", sa.String(length=32), nullable=False),
            sa.Column("rasi", sa.String(length=32), nullable=False),
            sa.Column("house_from_varga_lagna", sa.Integer(), nullable=True),
            sa.Column("calculation_method", sa.String(length=64), nullable=False),
            sa.Column("raw_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.ForeignKeyConstraint(["chart_id"], ["charts.chart_id"], ondelete="CASCADE", name=op.f("fk_varga_positions_chart_id_charts")),
            sa.PrimaryKeyConstraint("varga_position_id", name=op.f("pk_varga_positions")),
            sa.UniqueConstraint("chart_id", "varga_code", "graha", name="uq_varga_positions_chart_code_graha"),
            sa.CheckConstraint("house_from_varga_lagna BETWEEN 1 AND 12", name=op.f("ck_varga_positions_house_from_varga_lagna_range")),
        )
        op.create_index(op.f("idx_varga_positions_chart"), "varga_positions", ["chart_id"], unique=False)

    if "dasha_periods" not in existing:
        op.create_table(
            "dasha_periods",
            sa.Column("dasha_period_id", sa.Uuid(), nullable=False),
            sa.Column("chart_id", sa.Uuid(), nullable=False),
            sa.Column("level", sa.String(length=16), nullable=False),
            sa.Column("lord", sa.String(length=32), nullable=False),
            sa.Column("parent_dasha_period_id", sa.Uuid(), nullable=True),
            sa.Column("start_jd", sa.Numeric(precision=16, scale=8), nullable=False),
            sa.Column("end_jd", sa.Numeric(precision=16, scale=8), nullable=False),
            sa.Column("start_date", sa.Date(), nullable=False),
            sa.Column("end_date", sa.Date(), nullable=False),
            sa.Column("sequence_index", sa.Integer(), nullable=False),
            sa.Column("raw_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.CheckConstraint("level IN ('maha', 'antar', 'pratyantar', 'sookshma', 'prana')", name=op.f("ck_dasha_periods_level_valid")),
            sa.ForeignKeyConstraint(["chart_id"], ["charts.chart_id"], ondelete="CASCADE", name=op.f("fk_dasha_periods_chart_id_charts")),
            sa.ForeignKeyConstraint(
                ["parent_dasha_period_id"],
                ["dasha_periods.dasha_period_id"],
                name=op.f("fk_dasha_periods_parent_dasha_period_id_dasha_periods"),
            ),
            sa.PrimaryKeyConstraint("dasha_period_id", name=op.f("pk_dasha_periods")),
        )
        op.create_index(op.f("idx_dasha_chart_level"), "dasha_periods", ["chart_id", "level"], unique=False)
        op.create_index(op.f("idx_dasha_date_lookup"), "dasha_periods", ["chart_id", "start_date", "end_date"], unique=False)

    if "transit_snapshots" not in existing:
        op.create_table(
            "transit_snapshots",
            sa.Column("transit_snapshot_id", sa.Uuid(), nullable=False),
            sa.Column("as_of_utc", sa.DateTime(timezone=True), nullable=False),
            sa.Column("calculation_version", sa.String(length=64), nullable=False),
            sa.Column("planets", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("transit_snapshot_id", name=op.f("pk_transit_snapshots")),
            sa.UniqueConstraint("as_of_utc", "calculation_version", name="uq_transit_snapshots_as_of_calc"),
        )

    if "notifications" not in existing:
        op.create_table(
            "notifications",
            sa.Column("notification_id", sa.Uuid(), nullable=False),
            sa.Column("user_id", sa.Uuid(), nullable=False),
            sa.Column("family_vault_id", sa.Uuid(), nullable=True),
            sa.Column("chart_id", sa.Uuid(), nullable=True),
            sa.Column("type", sa.String(length=64), nullable=False),
            sa.Column("priority", sa.Integer(), nullable=False),
            sa.Column("title", sa.Text(), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("language", sa.String(length=8), server_default=sa.text("'ta-en'"), nullable=False),
            sa.Column("send_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("status", sa.String(length=32), server_default=sa.text("'queued'"), nullable=False),
            sa.Column("suppression_reason", sa.Text(), nullable=True),
            sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
            sa.CheckConstraint("priority BETWEEN 0 AND 100", name=op.f("ck_notifications_priority_range")),
            sa.ForeignKeyConstraint(["chart_id"], ["charts.chart_id"], name=op.f("fk_notifications_chart_id_charts")),
            sa.ForeignKeyConstraint(["family_vault_id"], ["family_vaults.family_vault_id"], name=op.f("fk_notifications_family_vault_id_family_vaults")),
            sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], name=op.f("fk_notifications_user_id_users")),
            sa.PrimaryKeyConstraint("notification_id", name=op.f("pk_notifications")),
        )
        op.create_index(op.f("idx_notifications_status"), "notifications", ["status"], unique=False)
        op.create_index(op.f("idx_notifications_user_send"), "notifications", ["user_id", "send_at"], unique=False)

    if "interpretation_outputs" not in existing:
        op.create_table(
            "interpretation_outputs",
            sa.Column("interpretation_output_id", sa.Uuid(), nullable=False),
            sa.Column("chart_id", sa.Uuid(), nullable=True),
            sa.Column("family_vault_id", sa.Uuid(), nullable=True),
            sa.Column("output_type", sa.String(length=64), nullable=False),
            sa.Column("language", sa.String(length=8), nullable=False),
            sa.Column("structured_input", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("output_text", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("safety_flags", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["chart_id"], ["charts.chart_id"], name=op.f("fk_interpretation_outputs_chart_id_charts")),
            sa.ForeignKeyConstraint(
                ["family_vault_id"],
                ["family_vaults.family_vault_id"],
                name=op.f("fk_interpretation_outputs_family_vault_id_family_vaults"),
            ),
            sa.PrimaryKeyConstraint("interpretation_output_id", name=op.f("pk_interpretation_outputs")),
        )

    if "qa_golden_cases" not in existing:
        op.create_table(
            "qa_golden_cases",
            sa.Column("golden_case_id", sa.Uuid(), nullable=False),
            sa.Column("case_name", sa.String(length=255), nullable=False),
            sa.Column("case_type", sa.String(length=64), nullable=False),
            sa.Column("input_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("expected_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("tolerance_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("golden_case_id", name=op.f("pk_qa_golden_cases")),
        )

    if "subscriptions" not in existing:
        op.create_table(
            "subscriptions",
            sa.Column("subscription_id", sa.Uuid(), nullable=False),
            sa.Column("user_id", sa.Uuid(), nullable=False),
            sa.Column("tier", sa.String(length=32), nullable=False),
            sa.Column("provider", sa.String(length=64), nullable=True),
            sa.Column("provider_subscription_id", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=32), server_default=sa.text("'active'"), nullable=False),
            sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
            sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], name=op.f("fk_subscriptions_user_id_users")),
            sa.PrimaryKeyConstraint("subscription_id", name=op.f("pk_subscriptions")),
        )


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    existing = set(sa.inspect(bind).get_table_names())

    if "subscriptions" in existing:
        op.drop_table("subscriptions")
    if "qa_golden_cases" in existing:
        op.drop_table("qa_golden_cases")
    if "interpretation_outputs" in existing:
        op.drop_table("interpretation_outputs")
    if "notifications" in existing:
        op.drop_index(op.f("idx_notifications_user_send"), table_name="notifications")
        op.drop_index(op.f("idx_notifications_status"), table_name="notifications")
        op.drop_table("notifications")
    if "transit_snapshots" in existing:
        op.drop_table("transit_snapshots")
    if "dasha_periods" in existing:
        op.drop_index(op.f("idx_dasha_date_lookup"), table_name="dasha_periods")
        op.drop_index(op.f("idx_dasha_chart_level"), table_name="dasha_periods")
        op.drop_table("dasha_periods")
    if "varga_positions" in existing:
        op.drop_index(op.f("idx_varga_positions_chart"), table_name="varga_positions")
        op.drop_table("varga_positions")
