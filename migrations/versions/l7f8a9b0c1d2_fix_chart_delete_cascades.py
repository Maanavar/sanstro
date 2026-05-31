"""fix cascade/set-null on chart FK references to prevent orphan rows

Revision ID: l7f8a9b0c1d2
Revises: k6e7f8a9b0c1
Create Date: 2026-05-31 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "l7f8a9b0c1d2"
down_revision: str | Sequence[str] | None = "k6e7f8a9b0c1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Tables where chart_id is NOT NULL — rows must be deleted when the chart is deleted
_CASCADE_TABLES: list[tuple[str, str]] = [
    ("user_contexts",          "fk_user_contexts_chart_id_charts"),
    ("user_goals",             "fk_user_goals_chart_id_charts"),
    ("journal_entries",        "fk_journal_entries_chart_id_charts"),
    ("retrospective_entries",  "fk_retrospective_entries_chart_id_charts"),
]

# Tables where chart_id is nullable — rows survive, FK is just nulled out
_SET_NULL_TABLES: list[tuple[str, str]] = [
    ("notifications",          "fk_notifications_chart_id_charts"),
    ("interpretation_outputs", "fk_interpretation_outputs_chart_id_charts"),
]


def upgrade() -> None:
    with op.batch_alter_table("user_contexts") as batch:
        batch.drop_constraint("fk_user_contexts_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_user_contexts_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"], ondelete="CASCADE",
        )

    with op.batch_alter_table("user_goals") as batch:
        batch.drop_constraint("fk_user_goals_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_user_goals_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"], ondelete="CASCADE",
        )

    with op.batch_alter_table("journal_entries") as batch:
        batch.drop_constraint("fk_journal_entries_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_journal_entries_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"], ondelete="CASCADE",
        )

    with op.batch_alter_table("retrospective_entries") as batch:
        batch.drop_constraint("fk_retrospective_entries_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_retrospective_entries_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"], ondelete="CASCADE",
        )

    with op.batch_alter_table("notifications") as batch:
        batch.drop_constraint("fk_notifications_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_notifications_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"], ondelete="SET NULL",
        )

    with op.batch_alter_table("interpretation_outputs") as batch:
        batch.drop_constraint("fk_interpretation_outputs_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_interpretation_outputs_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"], ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("interpretation_outputs") as batch:
        batch.drop_constraint("fk_interpretation_outputs_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_interpretation_outputs_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"],
        )

    with op.batch_alter_table("notifications") as batch:
        batch.drop_constraint("fk_notifications_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_notifications_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"],
        )

    with op.batch_alter_table("retrospective_entries") as batch:
        batch.drop_constraint("fk_retrospective_entries_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_retrospective_entries_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"],
        )

    with op.batch_alter_table("journal_entries") as batch:
        batch.drop_constraint("fk_journal_entries_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_journal_entries_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"],
        )

    with op.batch_alter_table("user_goals") as batch:
        batch.drop_constraint("fk_user_goals_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_user_goals_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"],
        )

    with op.batch_alter_table("user_contexts") as batch:
        batch.drop_constraint("fk_user_contexts_chart_id_charts", type_="foreignkey")
        batch.create_foreign_key(
            "fk_user_contexts_chart_id_charts",
            "charts", ["chart_id"], ["chart_id"],
        )
