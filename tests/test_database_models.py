from sqlalchemy import create_engine, inspect

import app.models  # noqa: F401
from app.db.base import Base


def test_sqlalchemy_metadata_includes_initial_persistence_tables():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    assert {"users", "family_vaults", "family_members", "birth_profiles", "charts", "family_daily_scores"}.issubset(tables)
    assert inspector.get_foreign_keys("birth_profiles")
    assert inspector.get_indexes("birth_profiles")
    assert inspector.get_indexes("charts")
