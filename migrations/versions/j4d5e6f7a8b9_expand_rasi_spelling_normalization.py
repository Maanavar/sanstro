"""Expand rasi spelling normalization to all persisted rasi fields.

Revision ID: j4d5e6f7a8b9
Revises: 9940dd93fdbb
Create Date: 2026-05-30 11:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "j4d5e6f7a8b9"
down_revision: Union[str, Sequence[str], None] = "9940dd93fdbb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_RENAMES: list[tuple[str, str]] = [
    ("Midhunam", "Mithunam"),
    ("MIDHUNAM", "MITHUNAM"),
    ("midhunam", "mithunam"),
    ("Thulaam", "Thulam"),
    ("THULAAM", "THULAM"),
    ("thulaam", "thulam"),
    ("Vrichigam", "Viruchigam"),
    ("VRICHIGAM", "VIRUCHIGAM"),
    ("vrichigam", "viruchigam"),
]

_TARGET_COLUMNS: dict[str, tuple[str, ...]] = {
    "charts": ("lagna_rasi", "moon_rasi"),
    "chart_planets": ("rasi", "d9_rasi"),
    "peyarchi_alerts": ("from_rasi", "to_rasi"),
    "varga_positions": ("rasi",),
}


def _apply(bind, source: str, target: str) -> None:
    inspector = sa.inspect(bind)
    available_tables = set(inspector.get_table_names())

    for table_name, columns in _TARGET_COLUMNS.items():
        if table_name not in available_tables:
            continue
        table_columns = {col["name"] for col in inspector.get_columns(table_name)}
        for column_name in columns:
            if column_name not in table_columns:
                continue
            bind.execute(
                sa.text(
                    f"UPDATE {table_name} "
                    f"SET {column_name} = :target "
                    f"WHERE {column_name} = :source"
                ),
                {"source": source, "target": target},
            )


def upgrade() -> None:
    bind = op.get_bind()
    for source, target in _RENAMES:
        _apply(bind, source, target)


def downgrade() -> None:
    bind = op.get_bind()
    for source, target in _RENAMES:
        _apply(bind, target, source)

