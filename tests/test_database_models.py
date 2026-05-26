from sqlalchemy import inspect

import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import engine


def test_sqlalchemy_metadata_includes_initial_persistence_tables():
    Base.metadata.create_all(engine)

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    assert {
        "users",
        "family_vaults",
        "family_members",
        "birth_profiles",
        "charts",
        "chart_planets",
        "varga_positions",
        "dasha_periods",
        "transit_snapshots",
        "notifications",
        "interpretation_outputs",
        "qa_golden_cases",
        "subscriptions",
        "daily_scores",
        "panchangam_cache",
        "family_daily_scores",
        "peyarchi_alerts",
        "user_contexts",
        "retrospective_entries",
        "journal_entries",
        "user_preferences",
        "relationship_alerts",
    }.issubset(tables)
    assert inspector.get_foreign_keys("birth_profiles")
    assert inspector.get_indexes("birth_profiles")
    assert inspector.get_indexes("charts")
