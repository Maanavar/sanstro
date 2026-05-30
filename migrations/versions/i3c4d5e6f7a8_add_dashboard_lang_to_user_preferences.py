"""Add dashboard_lang to user_preferences

Revision ID: i3c4d5e6f7a8
Revises: f5b2c8d1a3e4
Create Date: 2026-05-29 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "i3c4d5e6f7a8"
down_revision: Union[str, Sequence[str], None] = "f5b2c8d1a3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    cols = {c["name"] for c in sa.inspect(bind).get_columns("user_preferences")}
    if "dashboard_lang" not in cols:
        op.add_column(
            "user_preferences",
            sa.Column("dashboard_lang", sa.String(8), nullable=False, server_default="ta"),
        )


def downgrade() -> None:
    op.drop_column("user_preferences", "dashboard_lang")
