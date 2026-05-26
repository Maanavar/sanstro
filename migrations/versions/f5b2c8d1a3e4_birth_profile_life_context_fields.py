"""Add marital_status and employment_type to birth_profiles

Revision ID: f5b2c8d1a3e4
Revises: e1a2b3c4d5f6
Create Date: 2026-05-24 14:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f5b2c8d1a3e4"
down_revision: Union[str, Sequence[str], None] = "e1a2b3c4d5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    cols = {c["name"] for c in sa.inspect(bind).get_columns("birth_profiles")}

    if "marital_status" not in cols:
        op.add_column("birth_profiles", sa.Column("marital_status", sa.String(32), nullable=True))

    if "employment_type" not in cols:
        op.add_column("birth_profiles", sa.Column("employment_type", sa.String(32), nullable=True))


def downgrade() -> None:
    op.drop_column("birth_profiles", "employment_type")
    op.drop_column("birth_profiles", "marital_status")
