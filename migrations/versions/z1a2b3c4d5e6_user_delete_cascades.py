"""make the full user-deletion FK graph cascade at the schema level

Brings every foreign key in the user → birth_profile → chart / family-vault
subtree in line with the ORM models so deleting a ``users`` row erases all
dependent data in one statement (GDPR erasure), instead of relying on the
hand-ordered DELETE chain that used to live in ``delete_my_account``.

Idempotent and name-agnostic: for each (table, column) it drops whatever FK
currently constrains that column and recreates it with the conventional name
and the target ``ondelete`` rule. Postgres-only — SQLite test schemas are built
from the models via ``create_all`` and already carry these rules.

Revision ID: z1a2b3c4d5e6
Revises: y0f1a2b3c4d5
Create Date: 2026-06-20 12:10:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "z1a2b3c4d5e6"
down_revision: str | Sequence[str] | None = "y0f1a2b3c4d5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# (table, column, referred_table, referred_column, ondelete)
_FKS: list[tuple[str, str, str, str, str]] = [
    # user → owned roots
    ("birth_profiles", "owner_user_id", "users", "user_id", "CASCADE"),
    ("family_vaults", "owner_user_id", "users", "user_id", "CASCADE"),
    ("family_members", "owner_user_id", "users", "user_id", "CASCADE"),
    ("user_preferences", "owner_user_id", "users", "user_id", "CASCADE"),
    ("user_notification_preferences", "owner_user_id", "users", "user_id", "CASCADE"),
    ("subscriptions", "user_id", "users", "user_id", "CASCADE"),
    ("ask_vinaadi_usage", "user_id", "users", "user_id", "CASCADE"),
    ("notifications", "user_id", "users", "user_id", "CASCADE"),
    ("user_contexts", "owner_user_id", "users", "user_id", "CASCADE"),
    ("user_goals", "owner_user_id", "users", "user_id", "CASCADE"),
    ("journal_entries", "owner_user_id", "users", "user_id", "CASCADE"),
    ("retrospective_entries", "owner_user_id", "users", "user_id", "CASCADE"),
    # user references that must survive (set null), not erase the row
    ("family_members", "managed_by_user_id", "users", "user_id", "SET NULL"),
    ("feedback", "user_id", "users", "user_id", "SET NULL"),
    # birth_profile → chart subtree
    ("charts", "birth_profile_id", "birth_profiles", "birth_profile_id", "CASCADE"),
    ("daily_scores", "birth_profile_id", "birth_profiles", "birth_profile_id", "CASCADE"),
    ("birth_profiles", "family_member_id", "family_members", "family_member_id", "SET NULL"),
    # chart children
    ("chart_planets", "chart_id", "charts", "chart_id", "CASCADE"),
    ("dasha_periods", "chart_id", "charts", "chart_id", "CASCADE"),
    ("dasha_periods", "parent_dasha_period_id", "dasha_periods", "dasha_period_id", "CASCADE"),
    ("varga_positions", "chart_id", "charts", "chart_id", "CASCADE"),
    ("peyarchi_alerts", "chart_id", "charts", "chart_id", "CASCADE"),
    ("user_life_events", "chart_id", "charts", "chart_id", "CASCADE"),
    ("user_contexts", "chart_id", "charts", "chart_id", "CASCADE"),
    ("user_goals", "chart_id", "charts", "chart_id", "CASCADE"),
    ("journal_entries", "chart_id", "charts", "chart_id", "CASCADE"),
    ("retrospective_entries", "chart_id", "charts", "chart_id", "CASCADE"),
    ("notifications", "chart_id", "charts", "chart_id", "SET NULL"),
    ("interpretation_outputs", "chart_id", "charts", "chart_id", "SET NULL"),
    # family-vault subtree
    ("family_members", "family_vault_id", "family_vaults", "family_vault_id", "CASCADE"),
    ("family_daily_scores", "family_vault_id", "family_vaults", "family_vault_id", "CASCADE"),
    ("relationship_alerts", "vault_id", "family_vaults", "family_vault_id", "CASCADE"),
    ("relationship_alerts", "member_id", "family_members", "family_member_id", "CASCADE"),
    ("notifications", "family_vault_id", "family_vaults", "family_vault_id", "SET NULL"),
    ("interpretation_outputs", "family_vault_id", "family_vaults", "family_vault_id", "SET NULL"),
]


def _set_ondelete(table: str, column: str, referred_table: str, referred_column: str, ondelete: str | None) -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        # SQLite (offline/CI sqlite) builds schema from models; nothing to alter.
        return
    insp = sa.inspect(bind)
    existing = {fk["name"] for fk in insp.get_foreign_keys(table) if fk["constrained_columns"] == [column]}
    for name in existing:
        op.drop_constraint(name, table, type_="foreignkey")
    op.create_foreign_key(
        f"fk_{table}_{column}_{referred_table}",
        table,
        referred_table,
        [column],
        [referred_column],
        ondelete=ondelete,
    )


def upgrade() -> None:
    for table, column, ref_table, ref_col, ondelete in _FKS:
        _set_ondelete(table, column, ref_table, ref_col, ondelete)


def downgrade() -> None:
    # Revert to plain foreign keys (no cascade rule).
    for table, column, ref_table, ref_col, _ondelete in _FKS:
        _set_ondelete(table, column, ref_table, ref_col, None)
