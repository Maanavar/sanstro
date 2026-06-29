"""Regression test for GDPR account erasure.

Seeds a user with rows across every dependent subtree (chart, family vault,
direct user rows, and the SET-NULL ``interpretation_outputs`` special case),
deletes the account the same way the ``DELETE /me`` handler does, and asserts no
orphan rows survive. This is the guard against the old hand-ordered DELETE chain
silently missing a table — if a new FK to a user-owned row is added without a
cascade, this test should start leaving orphans and fail.

Requires a real Postgres test DB (interpretation_outputs uses JSONB); it is
skipped automatically when the DB is unreachable (see conftest.require_db).
"""
from __future__ import annotations

from datetime import date
from uuid import uuid4

import pytest
from sqlalchemy import text

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.ask_vinaadi_usage import AskVinaadiUsage
from app.models.birth_profile import BirthProfile
from app.models.chart import Chart
from app.models.chart_planet import ChartPlanet
from app.models.family_member import FamilyMember
from app.models.family_vault import FamilyVault
from app.models.feedback import Feedback
from app.models.interpretation_output import InterpretationOutput
from app.models.relationship_alert import RelationshipAlert
from app.models.subscription import Subscription
from app.models.user import User


@pytest.fixture()
def db_session():
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO PUBLIC"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


def _seed_user_graph(session) -> dict[str, object]:
    user = User(user_id=uuid4(), email=f"erase-{uuid4().hex}@example.com")
    session.add(user)
    session.flush()

    profile = BirthProfile(
        owner_user_id=user.user_id,
        display_name="Erase Me",
        birth_date_local=date(1990, 1, 1),
        birth_place="Chennai",
        birth_latitude=13.08,
        birth_longitude=80.27,
        birth_timezone="Asia/Kolkata",
    )
    session.add(profile)
    session.flush()

    chart = Chart(
        birth_profile_id=profile.birth_profile_id,
        calculation_version="test-1",
        ephemeris_provider="swisseph",
        house_system_primary="WHOLE_SIGN",
        julian_day=2447893.0,
        lagna_rasi="MESHA",
        lagna_longitude=10.0,
        moon_rasi="VRISHABHA",
        janma_nakshatra="ROHINI",
        janma_pada=1,
    )
    session.add(chart)
    session.flush()

    session.add(ChartPlanet(
        chart_id=chart.chart_id,
        graha="SURYA",
        absolute_longitude=120.0,
        degree_in_rasi=0.0,
        rasi="SIMHA",
        nakshatra="MAGHA",
        pada=1,
        house_from_lagna=5,
    ))
    session.add(InterpretationOutput(
        chart_id=chart.chart_id,
        output_type="daily",
        language="en",
        structured_input={"k": "v"},
        output_text={"en": "hi"},
    ))
    session.add(Subscription(user_id=user.user_id, tier="pro"))
    session.add(AskVinaadiUsage(user_id=user.user_id, usage_date=date(2026, 6, 20)))

    vault = FamilyVault(owner_user_id=user.user_id, name="Erase Family")
    session.add(vault)
    session.flush()

    member = FamilyMember(
        owner_user_id=user.user_id,
        family_vault_id=vault.family_vault_id,
        display_name="Member",
    )
    session.add(member)
    session.flush()

    session.add(RelationshipAlert(
        vault_id=vault.family_vault_id,
        member_id=member.family_member_id,
        trigger_planet="GURU",
        trigger_type="transit",
        message_en="hi",
        message_ta="vanakkam",
        alert_date=date(2026, 6, 20),
    ))
    # Vault-linked interpretation output (the other SET-NULL path).
    session.add(InterpretationOutput(
        family_vault_id=vault.family_vault_id,
        output_type="family",
        language="en",
        structured_input={"k": "v"},
        output_text={"en": "hi"},
    ))

    # Feedback uses ON DELETE SET NULL — it must SURVIVE erasure with user_id NULL.
    feedback = Feedback(user_id=user.user_id, message="great app")
    session.add(feedback)
    session.flush()

    session.commit()
    return {
        "user_id": user.user_id,
        "profile_id": profile.birth_profile_id,
        "chart_id": chart.chart_id,
        "vault_id": vault.family_vault_id,
        "member_id": member.family_member_id,
        "feedback_id": feedback.id,
    }


def test_account_deletion_leaves_no_orphans(db_session):
    ids = _seed_user_graph(db_session)
    uid = ids["user_id"]

    # Mirror the handler: erase the SET-NULL interpretation rows, then cascade.
    db_session.execute(text("""
        DELETE FROM interpretation_outputs
        WHERE chart_id IN (
            SELECT c.chart_id FROM charts c
            JOIN birth_profiles bp ON c.birth_profile_id = bp.birth_profile_id
            WHERE bp.owner_user_id = :uid
        )
        OR family_vault_id IN (
            SELECT family_vault_id FROM family_vaults WHERE owner_user_id = :uid
        )
    """), {"uid": str(uid)})
    user = db_session.get(User, uid)
    db_session.delete(user)
    db_session.commit()

    def count(sql: str, **params) -> int:
        return db_session.execute(text(sql), params).scalar_one()

    assert count("SELECT count(*) FROM users WHERE user_id = :id", id=str(uid)) == 0
    assert count("SELECT count(*) FROM birth_profiles WHERE owner_user_id = :id", id=str(uid)) == 0
    assert count("SELECT count(*) FROM charts WHERE birth_profile_id = :id", id=str(ids["profile_id"])) == 0
    assert count("SELECT count(*) FROM chart_planets WHERE chart_id = :id", id=str(ids["chart_id"])) == 0
    assert count("SELECT count(*) FROM subscriptions WHERE user_id = :id", id=str(uid)) == 0
    assert count("SELECT count(*) FROM ask_vinaadi_usage WHERE user_id = :id", id=str(uid)) == 0
    assert count("SELECT count(*) FROM family_vaults WHERE owner_user_id = :id", id=str(uid)) == 0
    assert count("SELECT count(*) FROM family_members WHERE owner_user_id = :id", id=str(uid)) == 0
    assert count("SELECT count(*) FROM relationship_alerts WHERE vault_id = :id", id=str(ids["vault_id"])) == 0
    # interpretation_outputs (both chart- and vault-linked) must be gone too.
    assert count("SELECT count(*) FROM interpretation_outputs WHERE chart_id = :id", id=str(ids["chart_id"])) == 0
    assert count("SELECT count(*) FROM interpretation_outputs WHERE family_vault_id = :id", id=str(ids["vault_id"])) == 0

    # Feedback survives, but is de-identified (user_id nulled by ON DELETE SET NULL).
    row = db_session.execute(
        text("SELECT user_id FROM feedback WHERE id = :id"), {"id": str(ids["feedback_id"])}
    ).first()
    assert row is not None
    assert row[0] is None
