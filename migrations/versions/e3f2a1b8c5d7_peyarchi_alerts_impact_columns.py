"""add impact_from_moon and sani_cycle_after to peyarchi_alerts

Revision ID: e3f2a1b8c5d7
Revises: d7a8f1b3c9e2
Create Date: 2026-05-23 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e3f2a1b8c5d7"
down_revision: Union[str, Sequence[str], None] = "d7a8f1b3c9e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("peyarchi_alerts", sa.Column("impact_from_moon", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("peyarchi_alerts", sa.Column("sani_cycle_after", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("peyarchi_alerts", "sani_cycle_after")
    op.drop_column("peyarchi_alerts", "impact_from_moon")
