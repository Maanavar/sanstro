"""Ask Vinaadi rails (spec L7): per-call cost rows and spend-alert markers.

- `ask_vinaadi_calls`: one row per provider call (prompt version, model,
  tokens, cost in paise, latency, outcome, sensitive-topic flags). No user,
  chart or question text.
- `ask_spend_alerts`: one row per (day, threshold) an owner was alerted for.

Both tables are new and hold no data from before this revision, so the
downgrade simply drops them.

Revision ID: de3f4a5b6c7d
Revises: cd2e3f4a5b6c
Create Date: 2026-11-02 21:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "de3f4a5b6c7d"
down_revision = "cd2e3f4a5b6c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ask_vinaadi_calls",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("spend_date", sa.Date(), nullable=False),
        sa.Column("prompt_version", sa.String(length=32), nullable=False),
        sa.Column("model", sa.String(length=64), nullable=False),
        sa.Column("input_tokens", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("output_tokens", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("cache_read_tokens", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("cache_write_tokens", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("cost_paise", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("latency_ms", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("outcome", sa.String(length=16), nullable=False),
        sa.Column(
            "flags",
            postgresql.ARRAY(sa.String(length=24)),
            server_default=sa.text("'{}'::varchar[]"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_ask_vinaadi_calls"),
    )
    op.create_index("ix_ask_vinaadi_calls_spend_date", "ask_vinaadi_calls", ["spend_date"])
    op.create_table(
        "ask_spend_alerts",
        sa.Column("spend_date", sa.Date(), nullable=False),
        sa.Column("threshold_pct", sa.Integer(), nullable=False),
        sa.Column("spent_paise", sa.Integer(), nullable=False),
        sa.Column("cap_paise", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("spend_date", "threshold_pct", name="pk_ask_spend_alerts"),
    )


def downgrade() -> None:
    op.drop_table("ask_spend_alerts")
    op.drop_index("ix_ask_vinaadi_calls_spend_date", table_name="ask_vinaadi_calls")
    op.drop_table("ask_vinaadi_calls")
